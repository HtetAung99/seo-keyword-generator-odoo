# Privacy Policy

**LLM-Powered SEO Assistant for Odoo**

*Last updated: January 2025*

## Overview

This Chrome extension helps generate SEO keywords and metadata for Odoo e-commerce products using AI/LLM services. We are committed to protecting your privacy.

## Data Collection

### What We Collect

When you use the "Generate SEO" feature, the extension collects the following product information from the current Odoo page:

- Product title
- Product price
- Product specifications/features
- Brand name
- Category path

This data is collected **only** when you explicitly trigger SEO generation.

### What We Do NOT Collect

- Personal information (name, email, etc.)
- Browsing history
- User behavior or analytics
- Cookies or tracking data

## Data Usage

### Where Data Is Sent

Product information is sent **only** to the LLM provider you configure in the extension settings:

- **Google Gemini API** (`generativelanguage.googleapis.com`)
- **OpenAI API** (`api.openai.com`)
- **Custom API endpoint** (your own server)

Data is transmitted directly to your chosen provider and is not routed through any intermediary servers.

### Data Retention

- The extension does not store product data
- No data is persisted after generation is complete
- No data is sent to any analytics or tracking services

## Local Storage

The extension stores the following settings locally in Chrome sync storage:

- Your API key (stored securely in Chrome sync storage)
- LLM provider selection
- Odoo domain configuration
- Default market hint preference
- Auto-fill preference

**API keys never leave your browser** except when making authorized API calls to your configured provider.

## Third-Party Services

This extension integrates with third-party LLM APIs. Their data handling is governed by their respective privacy policies:

- [Google Privacy Policy](https://policies.google.com/privacy)
- [OpenAI Privacy Policy](https://openai.com/privacy)

## User Rights

You can:

- View and modify all stored settings via the extension options page
- Delete all stored data by uninstalling the extension
- Choose which LLM provider handles your data

## Permissions

This extension requests the following permissions:

- **storage**: To save your settings (API key, Odoo domain, preferences)
- **scripting**: To inject the SEO assistant UI into your Odoo pages
- **host_permissions** (optional): To access your configured Odoo domain - you grant this when you save your domain in settings

## Security

- All API communications use HTTPS
- API keys are stored locally in Chrome sync storage and never sent to any server except your configured LLM provider
- No external scripts are loaded
- No data is collected or transmitted to the extension developer

## Changes to This Policy

We may update this privacy policy. Changes will be reflected in the "Last updated" date.

## Contact

For privacy concerns or questions, please open an issue on the project repository.
