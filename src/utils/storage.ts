import { ExtensionConfig, PublicConfig, DEFAULT_CONFIG } from '../types/index.js';

const STORAGE_KEY = 'seo_odoo_config';

export async function getConfig(): Promise<ExtensionConfig> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as Partial<ExtensionConfig> | undefined;
    return { ...DEFAULT_CONFIG, ...stored };
  } catch (error) {
    console.error('[SEO-Odoo] Failed to get config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function getPublicConfig(): Promise<PublicConfig> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const stored = result[STORAGE_KEY] as Partial<ExtensionConfig> | undefined;
    const config = { ...DEFAULT_CONFIG, ...stored };
    return {
      defaultMarketHint: config.defaultMarketHint,
      autoFill: config.autoFill,
      llmProvider: config.llmProvider,
      odooDomain: config.odooDomain,
    };
  } catch (error) {
    console.error('[SEO-Odoo] Failed to get public config:', error);
    return {
      defaultMarketHint: DEFAULT_CONFIG.defaultMarketHint,
      autoFill: DEFAULT_CONFIG.autoFill,
      llmProvider: DEFAULT_CONFIG.llmProvider,
      odooDomain: DEFAULT_CONFIG.odooDomain,
    };
  }
}

export async function setConfig(
  config: Partial<ExtensionConfig>
): Promise<void> {
  try {
    const current = await getConfig();
    const updated = { ...current, ...config };
    await chrome.storage.sync.set({ [STORAGE_KEY]: updated });
  } catch (error) {
    console.error('[SEO-Odoo] Failed to set config:', error);
    throw error;
  }
}

export async function clearConfig(): Promise<void> {
  try {
    await chrome.storage.sync.remove(STORAGE_KEY);
  } catch (error) {
    console.error('[SEO-Odoo] Failed to clear config:', error);
    throw error;
  }
}

export function onConfigChange(
  callback: (newConfig: ExtensionConfig, oldConfig: ExtensionConfig) => void
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'sync' && changes[STORAGE_KEY]) {
      const oldConfig = {
        ...DEFAULT_CONFIG,
        ...changes[STORAGE_KEY].oldValue,
      } as ExtensionConfig;
      const newConfig = {
        ...DEFAULT_CONFIG,
        ...changes[STORAGE_KEY].newValue,
      } as ExtensionConfig;
      callback(newConfig, oldConfig);
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
