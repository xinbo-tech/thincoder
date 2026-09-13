# frontend-design — design and build frontend UIs

## When to Use
When the user asks for a web page, dashboard, landing page, or any browser-based UI.

## Design Principles
1. **Mobile-first**: start with the smallest screen, add breakpoints for larger ones
2. **Color system**: pick 3 colors max — primary, accent, neutral. Use `oklch()` for modern browsers
3. **Typography stack**: system font stack (`system-ui, -apple-system, sans-serif`), no external fonts unless necessary
4. **Spacing rhythm**: use multiples of 4px (4, 8, 12, 16, 24, 32, 48, 64)
5. **Dark mode**: always include `prefers-color-scheme: dark` support

## Delivery Format
- Single self-contained HTML file with inline `<style>` and `<script>`
- No build step, no npm, no framework unless the user explicitly requests one
- Use modern CSS: grid, flexbox, custom properties, `@container` queries
- Use vanilla JS (ES2020+) — no jQuery, no lodash

## Quick Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>App</title>
<style>
  :root {
    --bg: #fff; --text: #1a1a1a;
    --primary: oklch(0.55 0.2 260);
    --radius: 8px; --gap: 16px;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #1a1a1a; --text: #eee; }
  }
  body { font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: var(--gap); }
</style>
</head>
<body>
  <main><!-- your content --></main>
</body>
</html>
```

## Rules
- Always `<!DOCTYPE html>` and viewport meta
- Test colors for WCAG AA contrast (4.5:1 for text)
- No horizontal scroll at 320px width
- Buttons and links need hover+focus+active states
- Use `fetch()` for API calls, handle loading/error/empty states
