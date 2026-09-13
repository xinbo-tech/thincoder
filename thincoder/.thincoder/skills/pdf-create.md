# pdf-create — generate PDF documents

## When to Use
When the user asks to create a report, document, invoice, or any printable output.

## Workflow
1. Write the content as a complete HTML file with inline CSS (use `<style>` tag, not external files)
2. Style it professionally: clean typography, reasonable margins, page numbers via CSS `@page`
3. Convert HTML to PDF using Chrome/Edge headless mode:

```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --disable-gpu --print-to-pdf=output.pdf --no-margins file:///absolute/path/to/page.html

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --headless --disable-gpu --print-to-pdf=output.pdf --no-margins file:///absolute/path/to/page.html
```

Or use Edge which is always available on Windows:
```bash
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --print-to-pdf=output.pdf --no-margins file:///absolute/path/to/page.html
```

## Rules
- Always use absolute `file://` paths
- Remove `--no-margins` if you want default page margins
- The HTML file must be self-contained (no external CSS/fonts/images — or use data URIs for small images)
- Test by opening the HTML in a browser first if possible
- Clean up the intermediate HTML file after PDF generation unless the user wants to keep it
