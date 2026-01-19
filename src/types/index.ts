export interface ProductSEOContext {
  title: string;
  brand: string | null;
  category: string | null;
  specsText: string | null;
  priceText: string | null;
  internalRef: string | null;
  marketHint: string;
}

export type SEOMode = 'keywords' | 'title' | 'description';

export interface SEORequest {
  context: ProductSEOContext;
  mode: SEOMode;
}

export interface SEOResponse {
  keywords?: string[];
  title?: string;
  description?: string;
  error?: string;
}

export type LLMProvider = 'gemini' | 'openai' | 'custom';

export interface ExtensionConfig {
  llmProvider: LLMProvider;
  apiKey: string;
  geminiModel: string;
  customBaseUrl: string;
  defaultMarketHint: string;
  autoFill: boolean;
  odooDomain: string;
}

export type PublicConfig = Pick<ExtensionConfig, 'defaultMarketHint' | 'autoFill' | 'llmProvider' | 'odooDomain'>;

export const DEFAULT_CONFIG: ExtensionConfig = {
  llmProvider: 'gemini',
  apiKey: '',
  geminiModel: 'gemini-2.0-flash',
  customBaseUrl: '',
  defaultMarketHint: 'general',
  autoFill: false,
  odooDomain: '',
};

export type MessageType =
  | 'GENERATE_SEO'
  | 'GET_CONFIG'
  | 'SET_CONFIG'
  | 'SEO_RESULT'
  | 'SEO_ERROR';

export interface BaseMessage {
  type: MessageType;
}

export interface GenerateSEOMessage extends BaseMessage {
  type: 'GENERATE_SEO';
  payload: SEORequest;
}

export interface GetConfigMessage extends BaseMessage {
  type: 'GET_CONFIG';
}

export interface SetConfigMessage extends BaseMessage {
  type: 'SET_CONFIG';
  payload: Partial<ExtensionConfig>;
}

export interface SEOResultMessage extends BaseMessage {
  type: 'SEO_RESULT';
  payload: SEOResponse;
}

export interface SEOErrorMessage extends BaseMessage {
  type: 'SEO_ERROR';
  payload: { error: string };
}

export type ExtensionMessage =
  | GenerateSEOMessage
  | GetConfigMessage
  | SetConfigMessage
  | SEOResultMessage
  | SEOErrorMessage;

export interface SEOModalElements {
  modal: HTMLElement;
  titleInput: HTMLInputElement | null;
  descriptionTextarea: HTMLTextAreaElement | null;
  keywordInput: HTMLInputElement | null;
  addButton: HTMLButtonElement | null;
}

export type SEOModalEventType = 'open' | 'close';

export interface SEOModalEvent {
  type: SEOModalEventType;
  elements?: SEOModalElements;
}
