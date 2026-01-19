import { ProductSEOContext } from '../types/index.js';

export class ProductSEOExtractor {
  extract(marketHint: string): ProductSEOContext {
    return {
      title: this.extractTitle(),
      brand: this.extractBrand(),
      category: this.extractCategory(),
      specsText: this.extractSpecs(),
      priceText: this.extractPrice(),
      internalRef: this.extractInternalRef(),
      marketHint,
    };
  }

  private extractTitle(): string {
    const h1 = document.querySelector('main h1');
    if (h1) {
      return h1.textContent?.trim() || '';
    }

    const productTitle = document.querySelector(
      '.product_name, .o_product_page_title, [itemprop="name"]'
    );
    return productTitle?.textContent?.trim() || document.title || '';
  }

  private extractBrand(): string | null {
    const brandSelectors = [
      '[itemprop="brand"]',
      '.product_brand',
      '.o_product_brand',
    ];

    for (const selector of brandSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        return el.textContent.trim();
      }
    }

    const labelSearch = this.findLabelValue('Brand');
    if (labelSearch) return labelSearch;

    const manufacturerSearch = this.findLabelValue('Manufacturer');
    if (manufacturerSearch) return manufacturerSearch;

    return null;
  }

  private extractCategory(): string | null {
    const breadcrumb = document.querySelector(
      '.breadcrumb, nav[aria-label="breadcrumb"], .o_breadcrumb'
    );

    if (breadcrumb) {
      const items = breadcrumb.querySelectorAll('li, a, span');
      const categories: string[] = [];

      items.forEach((item) => {
        const text = item.textContent?.trim();
        if (text && text !== 'Home' && text !== '/' && text !== '>') {
          const existing = categories[categories.length - 1];
          if (!existing || !text.includes(existing)) {
            categories.push(text);
          }
        }
      });

      if (categories.length > 1) {
        categories.pop();
      }

      if (categories.length > 0) {
        return categories.join(' > ');
      }
    }

    return null;
  }

  private extractSpecs(): string | null {
    const specSelectors = [
      '.o_product_page_description',
      '.product_description',
      '#product_details',
      '.tab-content',
      '[itemprop="description"]',
    ];

    const specsTexts: string[] = [];

    for (const selector of specSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        specsTexts.push(el.textContent.trim());
      }
    }

    const tables = document.querySelectorAll(
      '.product_attributes table, .o_product_attributes'
    );
    tables.forEach((table) => {
      if (table.textContent?.trim()) {
        specsTexts.push(table.textContent.trim());
      }
    });

    if (specsTexts.length > 0) {
      return specsTexts
        .join('\n')
        .replace(/\s+/g, ' ')
        .substring(0, 2000);
    }

    return null;
  }

  private extractPrice(): string | null {
    const priceSelectors = [
      '.oe_price',
      '.product_price',
      '[itemprop="price"]',
      '.oe_currency_value',
      '.product-price',
    ];

    for (const selector of priceSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const priceAttr = el.getAttribute('content');
        if (priceAttr) return priceAttr;

        const text = el.textContent?.trim();
        if (text) return text;
      }
    }

    return null;
  }

  private extractInternalRef(): string | null {
    const refSelectors = [
      '[itemprop="sku"]',
      '.product_ref',
      '.oe_product_reference',
      '.product_id',
    ];

    for (const selector of refSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) {
        return el.textContent.trim();
      }
    }

    const refSearch = this.findLabelValue('Reference');
    if (refSearch) return refSearch;

    const skuSearch = this.findLabelValue('SKU');
    if (skuSearch) return skuSearch;

    return null;
  }

  private findLabelValue(label: string): string | null {
    const allElements = document.querySelectorAll('td, th, dt, label, span, div');

    for (const el of allElements) {
      const text = el.textContent?.trim().toLowerCase();
      if (text === label.toLowerCase() || text === `${label.toLowerCase()}:`) {
        const nextSibling = el.nextElementSibling;
        if (nextSibling?.textContent?.trim()) {
          return nextSibling.textContent.trim();
        }

        const parent = el.parentElement;
        if (parent) {
          const valueEl = parent.querySelector('td:last-child, dd, .value');
          if (valueEl?.textContent?.trim()) {
            return valueEl.textContent.trim();
          }
        }
      }
    }

    return null;
  }
}
