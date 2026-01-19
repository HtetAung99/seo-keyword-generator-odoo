import { SEOModalElements, SEOResponse } from '../types/index.js';
import { debug, debugError } from '../utils/debug.js';

export class SEOInjector {
  private static styleInjected = false;
  private generateButton: HTMLButtonElement | null = null;
  private isLoading = false;

  injectGenerateButton(
    targetContainer: HTMLElement,
    onClick: () => void
  ): HTMLButtonElement {
    if (this.generateButton) {
      this.generateButton.remove();
    }

    this.generateButton = document.createElement('button');
    this.generateButton.type = 'button';
    this.generateButton.className = 'btn btn-primary seo-ai-generate-btn';
    this.generateButton.innerHTML = `
      <span class="btn-text">✨ Generate SEO (AI)</span>
      <span class="btn-loading" style="display: none;">
        <span class="spinner"></span> Generating...
      </span>
    `;

    this.generateButton.style.cssText = `
      margin: 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    `;

    if (!SEOInjector.styleInjected) {
      const style = document.createElement('style');
      style.textContent = `
        .seo-ai-generate-btn .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #ffffff40;
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: seo-ai-spin 0.8s linear infinite;
        }
        @keyframes seo-ai-spin {
          to { transform: rotate(360deg); }
        }
        .seo-ai-generate-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .seo-ai-error {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          padding: 8px;
          background: #f8d7da;
          border-radius: 4px;
        }
        .seo-ai-success {
          color: #155724;
          font-size: 12px;
          margin-top: 5px;
          padding: 8px;
          background: #d4edda;
          border-radius: 4px;
        }
      `;
      document.head.appendChild(style);
      SEOInjector.styleInjected = true;
    }

    this.generateButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.isLoading) {
        onClick();
      }
    });

    targetContainer.insertBefore(
      this.generateButton,
      targetContainer.firstChild
    );

    return this.generateButton;
  }

  setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (!this.generateButton) return;

    const textSpan = this.generateButton.querySelector('.btn-text');
    const loadingSpan = this.generateButton.querySelector('.btn-loading');

    if (textSpan && loadingSpan) {
      (textSpan as HTMLElement).style.display = loading ? 'none' : 'inline';
      (loadingSpan as HTMLElement).style.display = loading ? 'inline-flex' : 'none';
    }

    this.generateButton.disabled = loading;
  }

  showError(message: string, container?: HTMLElement): void {
    this.clearMessages(container);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'seo-ai-error';
    errorDiv.textContent = message;

    const target = container || this.generateButton?.parentElement;
    if (target) {
      target.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    }
  }

  showSuccess(message: string, container?: HTMLElement): void {
    this.clearMessages(container);

    const successDiv = document.createElement('div');
    successDiv.className = 'seo-ai-success';
    successDiv.textContent = message;

    const target = container || this.generateButton?.parentElement;
    if (target) {
      target.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
    }
  }

  private clearMessages(container?: HTMLElement): void {
    const target = container || this.generateButton?.parentElement;
    if (target) {
      target.querySelectorAll('.seo-ai-error, .seo-ai-success').forEach((el) => el.remove());
    }
  }

  async populateKeywords(
    keywords: string[],
    elements: SEOModalElements
  ): Promise<number> {
    const { keywordInput, addButton } = elements;

    if (!keywordInput || !addButton) {
      throw new Error('Keyword input or Add button not found in modal');
    }

    let addedCount = 0;

    for (const keyword of keywords) {
      const trimmedKeyword = keyword.trim();
      if (!trimmedKeyword) continue;

      try {
        keywordInput.focus();
        keywordInput.value = '';
        
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(keywordInput, trimmedKeyword);
        } else {
          keywordInput.value = trimmedKeyword;
        }
        
        keywordInput.dispatchEvent(new Event('input', { bubbles: true }));
        keywordInput.dispatchEvent(new Event('change', { bubbles: true }));
        keywordInput.dispatchEvent(new InputEvent('input', { 
          bubbles: true, 
          data: trimmedKeyword,
          inputType: 'insertText'
        }));

        await this.delay(100);

        addButton.click();

        await this.delay(150);

        addedCount++;
        debug(`Added keyword: ${trimmedKeyword}`);
      } catch (err) {
        debugError(`Failed to add keyword "${trimmedKeyword}":`, err);
      }
    }

    return addedCount;
  }

  populateTitle(title: string, elements: SEOModalElements): boolean {
    const { titleInput } = elements;
    if (!titleInput) return false;

    titleInput.value = title;
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    titleInput.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
  }

  populateDescription(description: string, elements: SEOModalElements): boolean {
    const { descriptionTextarea } = elements;
    if (!descriptionTextarea) return false;

    descriptionTextarea.value = description;
    descriptionTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    descriptionTextarea.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
  }

  async populateAll(
    response: SEOResponse,
    elements: SEOModalElements
  ): Promise<{ keywords: number; title: boolean; description: boolean }> {
    const results = {
      keywords: 0,
      title: false,
      description: false,
    };

    if (response.title) {
      results.title = this.populateTitle(response.title, elements);
    }

    if (response.description) {
      results.description = this.populateDescription(response.description, elements);
    }

    if (response.keywords && response.keywords.length > 0) {
      results.keywords = await this.populateKeywords(response.keywords, elements);
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  cleanup(): void {
    if (this.generateButton) {
      this.generateButton.remove();
      this.generateButton = null;
    }
    this.isLoading = false;
  }
}
