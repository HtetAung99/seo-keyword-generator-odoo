const CONTENT_SCRIPT_ID = 'seo-odoo-dynamic';

export async function requestDomainPermission(domain: string): Promise<boolean> {
  const origins = buildOriginPatterns(domain);
  
  const hasPermission = await chrome.permissions.contains({ origins });
  if (hasPermission) {
    return true;
  }

  return chrome.permissions.request({ origins });
}

export async function registerContentScript(domain: string): Promise<void> {
  const matches = buildMatchPatterns(domain);

  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  } catch {
    // Script not registered yet, ignore
  }

  await chrome.scripting.registerContentScripts([
    {
      id: CONTENT_SCRIPT_ID,
      matches,
      js: ['content/content.js'],
      runAt: 'document_idle',
      allFrames: true,
    },
  ]);
}

export async function unregisterContentScript(): Promise<void> {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] });
  } catch {
    // Script not registered, ignore
  }
}

function buildOriginPatterns(domain: string): string[] {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return [
    `https://${cleanDomain}/*`,
    `https://*.${cleanDomain}/*`,
  ];
}

function buildMatchPatterns(domain: string): string[] {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return [
    `https://${cleanDomain}/*`,
    `https://*.${cleanDomain}/*`,
    `http://${cleanDomain}/*`,
    `http://*.${cleanDomain}/*`,
  ];
}
