Read a PDF file and extract its text as plain text — page by page, in reading order (row/column layout, `--- Page N ---` separators). Use this instead of `read` for `.pdf` files: read decodes PDFs as UTF-8 garbage.

**Route to read_pdf instead of bash:** `pdftotext`, python `pypdf`/`pdfminer`, node pdf libraries → read_pdf (zero-dependency built-in extractor).

Parameters:
- path (required): PDF file path (relative to cwd or absolute).
- pages: which pages to extract, e.g. `"1-3,5"` (1-based PDF page numbers, ranges inclusive). Default: all pages; at most 50 pages per call (larger documents need a `pages` selection).

What it handles:
- Text PDFs from real producers: Chrome/Edge print, Word, LibreOffice, LaTeX, Quartz — xref tables and xref streams, object streams, Flate + PNG predictors, Type0/CID fonts with ToUnicode CMaps (bfchar/bfrange), simple fonts via WinAnsi/StandardEncoding/MacRoman (+ /Differences), TJ kerning, ligature ActualText spans, and double/triple-column layout (light x-cluster column detection; tables are NOT reconstructed — table cell text reads in row/column flow).
- Scanned/image-only pages (no text operators): the page image is returned via the multimodal channel (`{ text, images }` JSON, like read_image) so a vision-capable model can read it. DCTDecode (JPEG) images pass through; 8-bit Flate gray/RGB images are converted to PNG. This needs a multimodal (vision) provider — under a text-only model such pages degrade to a hint telling you to switch providers.

Limits & refusals (explicit, never silent):
- Text-only results follow the read-family pipeline: extraction over 64KB is saved to the standard offload file (preview + path returned — page the file with read). When scanned-page images are attached, the JSON envelope rides the multimodal channel inline; text is capped at 60KB and images at 25MB cumulative per call (per-image 15MB) — narrow the pages range to read large scans in batches.
- Encrypted PDFs (/Encrypt) are refused with a clear message — decrypt first.
- Unsupported forms (Type3 glyph runs without ToUnicode, symbolic fonts without mappings, LZW-compressed streams, CMap-preset fonts without ToUnicode, JBIG2/JPX/CCITT images, palette/CMYK images) produce warnings or inline notes — output is best-effort and never silently wrong.
- Files >100MB refused; results never inflate past 512MB per stream (hostile-PDF guards: xref chains, recursion, operand floods).

Notes:
- Extraction is text-layer only — it does not OCR. Scanned pages without a text layer rely on the multimodal image channel.
- Layout is best-effort for irregular designs (rotated text, complex tables, text boxes).
