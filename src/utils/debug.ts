const DEBUG = false;

export function debug(...args: unknown[]): void {
  if (DEBUG) {
    console.log('[SEO-Odoo]', ...args);
  }
}

export function debugError(...args: unknown[]): void {
  console.error('[SEO-Odoo]', ...args);
}
