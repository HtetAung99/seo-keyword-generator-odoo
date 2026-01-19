import { SEOModalElements, SEOModalEvent } from '../types/index.js';
import { debug, debugError } from '../utils/debug.js';

type ModalEventCallback = (event: SEOModalEvent) => void;

export class SEOModalDetector {
  private observer: MutationObserver | null = null;
  private callbacks: Set<ModalEventCallback> = new Set();
  private currentModal: HTMLElement | null = null;
  private isWatching = false;

  start(): void {
    if (this.isWatching) return;

    debug('Starting modal detector...');

    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.isWatching = true;
    
    setTimeout(() => this.checkForExistingModal(), 100);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isWatching = false;
    this.currentModal = null;
  }

  onModalEvent(callback: ModalEventCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          this.checkNode(node);
        }
      }

      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          if (node === this.currentModal || 
              node.contains(this.currentModal) ||
              node.querySelector('.oe_seo_configuration')) {
            debug('Modal removed');
            this.emitEvent({ type: 'close' });
            this.currentModal = null;
          }
        }
      }
    }
  }

  private checkNode(node: HTMLElement): void {
    let modal: HTMLElement | null = null;

    if (node.classList.contains('oe_seo_configuration')) {
      modal = node;
    } else {
      modal = node.querySelector('.oe_seo_configuration');
    }

    if (!modal) {
      const title = node.querySelector('.modal-title');
      if (title?.textContent?.includes('Optimize SEO')) {
        modal = node.closest('.modal-content') || node;
      }
    }

    if (modal && modal !== this.currentModal) {
      debug('Found SEO modal');
      this.currentModal = modal;
      const elements = this.extractModalElements(modal);
      this.emitEvent({ type: 'open', elements });
    }
  }

  private checkForExistingModal(): void {
    const modal = this.findSEOModalInDocument();
    if (modal) {
      debug('Found existing SEO modal');
      this.currentModal = modal;
      const elements = this.extractModalElements(modal);
      this.emitEvent({ type: 'open', elements });
    }
  }

  private findSEOModalInDocument(): HTMLElement | null {
    const seoConfig = document.querySelector<HTMLElement>('.oe_seo_configuration');
    if (seoConfig) return seoConfig;

    const modalTitles = document.querySelectorAll('.modal-title');
    for (const title of modalTitles) {
      if (title.textContent?.trim() === 'Optimize SEO') {
        const modal = title.closest('.modal-content, .modal');
        if (modal instanceof HTMLElement) return modal;
      }
    }

    return null;
  }

  private extractModalElements(modal: HTMLElement): SEOModalElements {
    const titleInput = modal.querySelector<HTMLInputElement>(
      'input[type="text"][placeholder="Keep empty to use default value"]'
    );

    const descriptionTextarea = modal.querySelector<HTMLTextAreaElement>(
      'textarea[name="website_meta_description"]'
    ) || modal.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder="Keep empty to use default value"]'
    );

    const keywordInput = modal.querySelector<HTMLInputElement>(
      'input[placeholder="Keyword"]'
    );

    let addButton: HTMLButtonElement | null = null;
    const buttons = modal.querySelectorAll<HTMLButtonElement>('button');
    for (const btn of buttons) {
      if (btn.textContent?.trim() === 'Add') {
        addButton = btn;
        break;
      }
    }

    return {
      modal,
      titleInput,
      descriptionTextarea,
      keywordInput,
      addButton,
    };
  }

  private emitEvent(event: SEOModalEvent): void {
    debug('Emitting modal event:', event.type);
    for (const callback of this.callbacks) {
      try {
        callback(event);
      } catch (error) {
        debugError('Modal event callback error:', error);
      }
    }
  }

  getCurrentElements(): SEOModalElements | null {
    if (!this.currentModal) return null;
    return this.extractModalElements(this.currentModal);
  }
}
