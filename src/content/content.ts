import { ProductSEOExtractor } from './extractor.js';
import { SEOModalDetector } from './modal-detector.js';
import { SEOInjector } from './injector.js';
import { getPublicConfig } from '../utils/storage.js';
import { debug, debugError } from '../utils/debug.js';
import {
  GenerateSEOMessage,
  SEOResponse,
  SEOModalElements,
} from '../types/index.js';

class SEOAssistant {
  private extractor: ProductSEOExtractor;
  private detector: SEOModalDetector;
  private injector: SEOInjector;
  private currentElements: SEOModalElements | null = null;
  private editorObserver: MutationObserver | null = null;

  constructor() {
    this.extractor = new ProductSEOExtractor();
    this.detector = new SEOModalDetector();
    this.injector = new SEOInjector();
  }

  async init(): Promise<void> {
    const shouldInit = await this.isProductPage();
    if (!shouldInit) {
      debug('Not a product page or domain not configured, skipping initialization');
      return;
    }

    debug('Initializing SEO Assistant on product page');

    this.detector.onModalEvent(async (event) => {
      if (event.type === 'open' && event.elements) {
        debug('SEO modal detected');
        this.currentElements = event.elements;
        this.injectButton(event.elements.modal);
        
        try {
          const config = await getPublicConfig();
          if (config.autoFill) {
            debug('Auto-fill enabled, triggering generation...');
            this.handleGenerateClick();
          }
        } catch (e) {
          debugError('Failed to check autoFill setting:', e);
        }
      } else if (event.type === 'close') {
        debug('SEO modal closed');
        this.currentElements = null;
        this.injector.cleanup();
      }
    });

    this.detector.start();
    this.watchForEditorMode();
  }

  private watchForEditorMode(): void {
    this.editorObserver = new MutationObserver(() => {
      const isEditorMode = document.body.classList.contains('editor_enable') ||
                          document.querySelector('.o_website_preview') !== null ||
                          document.querySelector('[data-editor-message]') !== null ||
                          document.querySelector('.o_we_website_top_actions') !== null;
      
      if (isEditorMode) {
        debug('Editor mode detected, restarting detector...');
        this.detector.stop();
        setTimeout(() => {
          this.detector.start();
        }, 1000);
      }
    });

    this.editorObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: false,
    });
  }

  private async isProductPage(): Promise<boolean> {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const isShopPage = url.includes('/shop/');
    const isInFrame = window.self !== window.top;
    const isEditorPage = url.includes('/odoo/') || url.includes('website_preview');
    
    let isConfiguredDomain = false;
    try {
      const config = await getPublicConfig();
      if (config.odooDomain) {
        isConfiguredDomain = hostname.includes(config.odooDomain) || 
                            config.odooDomain.includes(hostname);
      }
    } catch (e) {
      debugError('Failed to get config for domain check:', e);
    }
    
    if (!isConfiguredDomain) {
      return false;
    }
    
    return isShopPage || isInFrame || isEditorPage;
  }

  private injectButton(modal: HTMLElement): void {
    const formGroup = modal.querySelector('.modal-body, .o_form_view, form');
    if (!formGroup) {
      console.warn('[SEO-Odoo] Could not find form container in modal');
      return;
    }

    this.injector.injectGenerateButton(formGroup as HTMLElement, () => {
      this.handleGenerateClick();
    });
  }

  private async handleGenerateClick(): Promise<void> {
    if (!this.currentElements) {
      this.injector.showError('Modal not detected. Please try reopening it.');
      return;
    }

    this.injector.setLoading(true);

    try {
      const config = await getPublicConfig();
      const context = this.extractor.extract(config.defaultMarketHint);

      debug('Extracted context:', context);

      const message: GenerateSEOMessage = {
        type: 'GENERATE_SEO',
        payload: {
          context,
          mode: 'keywords',
        },
      };

      let response;
      try {
        response = await chrome.runtime.sendMessage(message);
      } catch (sendError) {
        if (String(sendError).includes('Extension context invalidated')) {
          throw new Error('Extension was reloaded. Please refresh the page and try again.');
        }
        throw sendError;
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      const seoResponse = response as SEOResponse;

      if (seoResponse.keywords && seoResponse.keywords.length > 0) {
        const elements = this.detector.getCurrentElements();
        if (!elements) {
          throw new Error('Modal closed during generation');
        }

        if (!elements.keywordInput || !elements.addButton) {
          const keywordInput = document.querySelector<HTMLInputElement>('input[placeholder="Keyword"]');
          const addButton = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
            .find(btn => btn.textContent?.trim() === 'Add');
          
          if (keywordInput && addButton) {
            elements.keywordInput = keywordInput;
            elements.addButton = addButton;
          }
        }

        const addedCount = await this.injector.populateKeywords(
          seoResponse.keywords,
          elements
        );

        this.injector.showSuccess(`Added ${addedCount} keywords successfully!`);
      } else {
        this.injector.showError('No keywords generated. Try again.');
      }
    } catch (error) {
      debugError('Generation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      this.injector.showError(`Error: ${message}`);
    } finally {
      this.injector.setLoading(false);
    }
  }

  destroy(): void {
    this.detector.stop();
    this.injector.cleanup();
  }
}

const assistant = new SEOAssistant();
assistant.init().catch((error) => {
  debugError('Failed to initialize:', error);
});

if (typeof window !== 'undefined') {
  (window as unknown as { __seoOdooAssistant?: SEOAssistant }).__seoOdooAssistant = assistant;
}
