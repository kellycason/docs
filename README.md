# Copilot Studio Docs

A small collection of shareable, single-page reference guides ("one-pagers") for Microsoft Copilot Studio, hosted as a static site on **GitHub Pages**.

Each one-pager is a self-contained HTML page that:
- Renders as a clean web page (desktop and mobile).
- Offers a **Download PDF** button.
- Prints to a single-page, letter-size PDF.

## Live site structure

Once GitHub Pages is enabled, URLs look like:

- `https://<user>.github.io/<repo>/` &mdash; landing hub ([index.html](index.html))
- `https://<user>.github.io/<repo>/one-pagers/copilot-studio-pricing-options/` &mdash; a one-pager

## Repo layout

```
index.html                      Landing hub linking to every one-pager
.nojekyll                       Tells GitHub Pages to serve files as-is
one-pagers/
  copilot-studio-pricing-options/
    index.html                  The one-pager (web + print)
    pdf/                        Exported PDF (linked by the Download button)
    assets/                     Preview images / supporting assets
    source-notes/               Source facts and reference links
    README.md
```

## Deploy to GitHub Pages (one-time)

1. Create a new **empty** repository on GitHub (no README/.gitignore).
2. From this folder, push the code:
   ```powershell
   git remote add origin https://github.com/<user>/<repo>.git
   git branch -M main
   git push -u origin main
   ```
3. In the repo on GitHub: **Settings > Pages**.
4. Under **Build and deployment**, set **Source = Deploy from a branch**, **Branch = main**, **Folder = / (root)**, then **Save**.
5. Wait ~1 minute. Your site is live at `https://<user>.github.io/<repo>/`.

To use a custom domain (like a teammate's `example.com/...`), add it under **Settings > Pages > Custom domain**.

> Note: GitHub Pages sites are **public**. This content is customer-facing reference material with a "not a quote" disclaimer, so that's expected.

## Add a new one-pager

1. Create a folder: `one-pagers/<your-slug>/`.
2. Add an `index.html` (copy an existing one-pager as a starting point).
3. Regenerate its PDF into `one-pagers/<your-slug>/pdf/`.
4. Add a card linking to it in the landing [index.html](index.html).
5. Commit and push &mdash; Pages redeploys automatically.

## Regenerate a PDF from HTML

PDFs are produced with headless Chrome/Edge. Example (PowerShell):

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$html   = "one-pagers\copilot-studio-pricing-options\index.html"
$out    = "one-pagers\copilot-studio-pricing-options\pdf\copilot-studio-pricing-options.pdf"
$uri    = [System.Uri]::new((Resolve-Path $html).Path).AbsoluteUri
$tmp    = Join-Path $env:TEMP "onepager.pdf"
$prof   = Join-Path $env:TEMP ("chrome-" + [guid]::NewGuid().ToString('N'))
& $chrome --headless=new --disable-gpu --no-sandbox `
  --run-all-compositor-stages-before-draw --virtual-time-budget=8000 `
  --no-pdf-header-footer --user-data-dir="$prof" `
  "--print-to-pdf=$tmp" $uri
Move-Item $tmp $out -Force
Remove-Item $prof -Recurse -Force
```

The page's print CSS (`@media print`) locks it to one letter-size page and hides web-only elements such as the Download button.
