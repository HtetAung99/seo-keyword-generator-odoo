import { getConfig, setConfig, clearConfig } from '../utils/storage.js';
import { ExtensionConfig, DEFAULT_CONFIG, LLMProvider } from '../types/index.js';

class OptionsPage {
  private form: HTMLFormElement | null = null;
  private statusMessage: HTMLElement | null = null;

  async init(): Promise<void> {
    this.form = document.getElementById('options-form') as HTMLFormElement;
    this.statusMessage = document.getElementById('status-message');

    if (!this.form) {
      console.error('[SEO-Odoo Options] Form not found');
      return;
    }

    await this.loadSettings();

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleReset());
    }

    const providerSelect = document.getElementById('llm-provider') as HTMLSelectElement;
    if (providerSelect) {
      providerSelect.addEventListener('change', () => this.updateProviderUI());
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const config = await getConfig();
      this.populateForm(config);
      this.updateProviderUI();
    } catch (error) {
      console.error('[SEO-Odoo Options] Failed to load settings:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  private populateForm(config: ExtensionConfig): void {
    const odooDomain = document.getElementById('odoo-domain') as HTMLInputElement;
    const llmProvider = document.getElementById('llm-provider') as HTMLSelectElement;
    const apiKey = document.getElementById('api-key') as HTMLInputElement;
    const geminiModel = document.getElementById('gemini-model') as HTMLSelectElement;
    const customBaseUrl = document.getElementById('custom-base-url') as HTMLInputElement;
    const marketHint = document.getElementById('market-hint') as HTMLSelectElement;
    const autoFill = document.getElementById('auto-fill') as HTMLInputElement;

    if (odooDomain) odooDomain.value = config.odooDomain;
    if (llmProvider) llmProvider.value = config.llmProvider;
    if (apiKey) apiKey.value = config.apiKey;
    if (geminiModel) geminiModel.value = config.geminiModel;
    if (customBaseUrl) customBaseUrl.value = config.customBaseUrl;
    if (marketHint) marketHint.value = config.defaultMarketHint;
    if (autoFill) autoFill.checked = config.autoFill;
  }

  private updateProviderUI(): void {
    const providerSelect = document.getElementById('llm-provider') as HTMLSelectElement;
    const geminiModelGroup = document.getElementById('gemini-model-group');
    const customUrlGroup = document.getElementById('custom-url-group');
    const apiKeyHint = document.getElementById('api-key-hint');

    if (!providerSelect) return;

    const provider = providerSelect.value as LLMProvider;

    if (geminiModelGroup) {
      geminiModelGroup.hidden = provider !== 'gemini';
    }
    if (customUrlGroup) {
      customUrlGroup.hidden = provider !== 'custom';
    }
    if (apiKeyHint) {
      switch (provider) {
        case 'gemini':
          apiKeyHint.textContent = 'Your Gemini API key from Google AI Studio';
          break;
        case 'openai':
          apiKeyHint.textContent = 'Your OpenAI API key from platform.openai.com';
          break;
        case 'custom':
          apiKeyHint.textContent = 'API key for your custom endpoint (sent as Bearer token)';
          break;
      }
    }
  }

  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.form) return;

    const formData = new FormData(this.form);

    const odooDomainRaw = (formData.get('odooDomain') as string) || '';
    const odooDomain = odooDomainRaw.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const config: Partial<ExtensionConfig> = {
      odooDomain,
      llmProvider: (formData.get('llmProvider') as LLMProvider) || DEFAULT_CONFIG.llmProvider,
      apiKey: (formData.get('apiKey') as string) || '',
      geminiModel: (formData.get('geminiModel') as string) || DEFAULT_CONFIG.geminiModel,
      customBaseUrl: (formData.get('customBaseUrl') as string) || '',
      defaultMarketHint: (formData.get('defaultMarketHint') as string) || DEFAULT_CONFIG.defaultMarketHint,
      autoFill: formData.get('autoFill') === 'on',
    };

    try {
      await setConfig(config);
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('[SEO-Odoo Options] Failed to save settings:', error);
      this.showStatus('Failed to save settings. Please try again.', 'error');
    }
  }

  private async handleReset(): Promise<void> {
    const confirmed = confirm('Are you sure you want to reset all settings to defaults?');
    if (!confirmed) return;

    try {
      await clearConfig();
      this.populateForm(DEFAULT_CONFIG);
      this.updateProviderUI();
      this.showStatus('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('[SEO-Odoo Options] Failed to reset settings:', error);
      this.showStatus('Failed to reset settings. Please try again.', 'error');
    }
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    if (!this.statusMessage) return;

    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    this.statusMessage.hidden = false;

    setTimeout(() => {
      if (this.statusMessage) {
        this.statusMessage.hidden = true;
      }
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const optionsPage = new OptionsPage();
  optionsPage.init().catch((error) => {
    console.error('[SEO-Odoo Options] Initialization failed:', error);
  });
});
