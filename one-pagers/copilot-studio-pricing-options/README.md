# Copilot Studio Pricing Options One-Pager

A customer-facing, single-page overview of Copilot Studio pricing and licensing.

## Files

- `index.html` - the one-pager. Renders as a web page and prints to a one-page letter PDF. Includes a web-only **Download PDF** button (hidden when printing).
- `pdf/copilot-studio-pricing-options.pdf` - exported PDF, linked by the Download button.
- `source-notes/pricing-options-source-notes.md` - source facts, official Microsoft links, and customer discussion notes.
- `assets/` - preview images and supporting assets.

## Hosting

This page is served by GitHub Pages at `.../one-pagers/copilot-studio-pricing-options/`. See the repo [README](../../README.md) for deploy steps.

## Export to PDF

Open `index.html` in a browser and print to PDF using:

- Layout: Portrait
- Paper size: Letter
- Margins: None or Default
- Headers and footers: Off
- Background graphics: On

The print CSS (`@media print`) locks it to a single page and hides web-only elements such as the Download button. See the repo README for a headless-Chrome command to regenerate the PDF.