# LLM-Powered SEO Assistant for Odoo

A Chrome Extension (Manifest V3) that uses AI/LLM to generate SEO keywords, titles, and descriptions for Odoo e-commerce products.

## Features

- 🔍 **Smart Extraction** - Automatically extracts product context from Odoo shop pages (title, price, specs, brand, category)
- 🤖 **Multi-Provider AI** - Supports Google Gemini, OpenAI, or your custom LLM endpoint
- 🌐 **Bilingual Keywords** - Generates keywords in both English and Burmese for Myanmar market
- ⚡ **One-Click Population** - Instantly populates keywords into Odoo's SEO modal
- 🔄 **Auto-Fill Option** - Automatically generate when SEO modal opens
- ⚙️ **Configurable** - Customize API provider, model, and default settings

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store listing](#) *(link coming soon)*
2. Click "Add to Chrome"
3. Configure your API key in extension options

### Development Setup

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd seo-odoo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `seo-odoo` directory

## Configuration

1. Click the extension icon and go to **Options** (or right-click → Options)
2. Configure your settings:

| Setting | Description |
|---------|-------------|
| **LLM Provider** | Choose Gemini, OpenAI, or Custom API |
| **API Key** | Your API key for the selected provider |
| **Gemini Model** | Model to use (default: gemini-2.0-flash) |
| **Custom Base URL** | Your API server endpoint (for Custom provider) |
| **Odoo Domain** | Your Odoo store domain (e.g., `mystore.odoo.com`) |
| **Default Market Hint** | Target market for keyword generation (b2b/b2c) |
| **Auto-Fill** | Automatically generate when modal opens |

## Usage

1. Navigate to any Odoo shop product page
2. Open the "Optimize SEO" modal in Odoo
3. Click the **"✨ Generate SEO (AI)"** button
4. Keywords will be automatically populated

## Privacy Summary

- **No tracking** - We don't track users or collect analytics
- **No storage** - Product data is not stored after generation
- **Direct API calls** - Data goes directly to your configured LLM provider
- **Local keys** - API keys are stored securely in Chrome sync storage

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full details.

## Project Structure

```
seo-odoo/
├── manifest.json           # Extension manifest (V3)
├── src/
│   ├── content/
│   │   ├── content.ts      # Main content script entry
│   │   ├── extractor.ts    # Product data extraction from DOM
│   │   ├── modal-detector.ts # MutationObserver for SEO modal
│   │   └── injector.ts     # UI injection and form population
│   ├── background/
│   │   └── service-worker.ts # Background API calls
│   ├── options/
│   │   ├── options.html    # Settings page
│   │   ├── options.ts      # Settings logic
│   │   └── options.css     # Settings styles
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   └── utils/
│       └── storage.ts      # Chrome storage helpers
├── assets/
│   └── icons/              # Extension icons
├── package.json
├── tsconfig.json
├── PRIVACY_POLICY.md
├── LICENSE
└── README.md
```

## Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build all scripts |
| `npm run watch` | Watch mode for development |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run clean` | Remove build artifacts |

### Adding Icons

Place your extension icons in `assets/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run typecheck` to ensure no type errors
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.
