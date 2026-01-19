import { getConfig } from '../utils/storage.js';
import {
  ExtensionConfig,
  ExtensionMessage,
  ProductSEOContext,
  SEORequest,
  SEOResponse,
} from '../types/index.js';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function validateCustomUrl(urlStr: string): string {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error('Invalid Custom API URL');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Custom API URL must use http or https');
  }
  return url.href;
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'GENERATE_SEO') {
    handleGenerateSEO(message.payload)
      .then(sendResponse)
      .catch((error) => {
        console.error('[SEO-Odoo] API error:', error.message);
        sendResponse({ error: error.message });
      });
    return true;
  }

  return false;
});

async function handleGenerateSEO(request: SEORequest): Promise<SEOResponse> {
  const config = await getConfig();

  if (!config.apiKey) {
    throw new Error('API Key not configured. Please set it in extension options.');
  }

  switch (config.llmProvider) {
    case 'gemini':
      return callGeminiAPI(config, request);
    case 'openai':
      return callOpenAIAPI(config, request);
    case 'custom':
      return callCustomAPI(config, request);
    default:
      throw new Error(`Unknown LLM provider: ${config.llmProvider}`);
  }
}

function buildPrompt(context: ProductSEOContext, mode: string): string {
  const productInfo = `
Product Title: ${context.title}
Brand: ${context.brand || 'N/A'}
Category: ${context.category || 'N/A'}
Specifications: ${context.specsText || 'N/A'}
Price: ${context.priceText || 'N/A'}
Market: ${context.marketHint}
`.trim();

  if (mode === 'keywords') {
    return `You are an SEO assistant for an ecommerce store in Myanmar. Given the following product details, generate 15-25 concise SEO keywords suitable for a product page.

Generate keywords in BOTH English and Burmese (Myanmar language):
- 10-15 English keywords (high-intent queries, max 3 words each)
- 5-10 Burmese keywords (common search terms Myanmar users would use)

${productInfo}

Return ONLY a valid JSON object with this exact format: { "keywords": ["english keyword 1", "english keyword 2", "မြန်မာ keyword", ...] }
Do not include any other text or explanation.`;
  }

  if (mode === 'title') {
    return `You are an SEO assistant. Generate an optimized SEO title (max 60 characters) for this product:

${productInfo}

Return ONLY a valid JSON object: { "title": "your optimized title" }`;
  }

  if (mode === 'description') {
    return `You are an SEO assistant. Generate an optimized meta description (max 160 characters) for this product:

${productInfo}

Return ONLY a valid JSON object: { "description": "your meta description" }`;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

async function callGeminiAPI(config: ExtensionConfig, request: SEORequest): Promise<SEOResponse> {
  const model = config.geminiModel || 'gemini-2.0-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const prompt = buildPrompt(request.context, request.mode);

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `API error (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();

  const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error('No content in Gemini response');
  }

  return parseJSONResponse(textContent, request.mode);
}

async function callOpenAIAPI(config: ExtensionConfig, request: SEORequest): Promise<SEOResponse> {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  const prompt = buildPrompt(request.context, request.mode);

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `API error (${response.status})`);
  }

  const data = await response.json();
  const textContent = data?.choices?.[0]?.message?.content;

  if (!textContent) {
    throw new Error('No content in OpenAI response');
  }

  return parseJSONResponse(textContent, request.mode);
}

async function callCustomAPI(config: ExtensionConfig, request: SEORequest): Promise<SEOResponse> {
  if (!config.customBaseUrl) {
    throw new Error('Custom Base URL not configured.');
  }

  const validatedBaseUrl = validateCustomUrl(config.customBaseUrl);
  const endpoint = `${validatedBaseUrl.replace(/\/$/, '')}/generate-seo`;

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      context: request.context,
      mode: request.mode,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return validateSEOResponse(data, request.mode);
}

function parseJSONResponse(text: string, mode: string): SEOResponse {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not find JSON in response');
  }

  try {
    const data = JSON.parse(jsonMatch[0]);
    return validateSEOResponse(data, mode);
  } catch {
    throw new Error('Failed to parse JSON response');
  }
}

function validateSEOResponse(data: unknown, mode: string): SEOResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response format from API');
  }

  const response: SEOResponse = {};

  if (mode === 'keywords' || 'keywords' in data) {
    const raw = (data as Record<string, unknown>).keywords;
    if (Array.isArray(raw)) {
      response.keywords = raw
        .filter((k): k is string => typeof k === 'string')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }
  }

  if (mode === 'title' || 'title' in data) {
    const raw = (data as Record<string, unknown>).title;
    if (typeof raw === 'string' && raw.trim()) {
      response.title = raw.trim();
    }
  }

  if (mode === 'description' || 'description' in data) {
    const raw = (data as Record<string, unknown>).description;
    if (typeof raw === 'string' && raw.trim()) {
      response.description = raw.trim();
    }
  }

  return response;
}

chrome.runtime.onInstalled.addListener(() => {});
