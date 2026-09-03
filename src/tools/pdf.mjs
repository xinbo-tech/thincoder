/**
 * pdf.mjs — read_pdf tool: text-PDF extraction (text + layout), scanned pages ride the
 * multimodal channel (read_image mechanism), pages parameter, encryption refusal.
 * Design: TOOLS.md §11 (9-stage pipeline in pdf-parse-xref.mjs + pdf-parse-text.mjs).
 */
import { DESC, resolveInCwd } from "./shared.mjs";
import { openPdf, PdfError, MAX_FILE_BYTES, encodePng, decodeStreamBytes } from "./pdf-parse-xref.mjs";
import { extractPages } from "./pdf-parse-text.mjs";
import { specForModel } from "../config.mjs";
import { offloadToolResult } from "../agent/helpers.mjs"; // family behavior: >64K text → disk preview + path (dispatch skips offload for multimodal tools)
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

const MAX_PAGES_PER_CALL = 50; // design §11.3.1: 50-page cap per call
const MAX_IMAGE_BYTES = 15_000_000; // parity with read_image MAX_IMAGE_BYTES (file.mjs)
const MAX_TOTAL_IMAGE_BYTES = 25_000_000; // cumulative scan budget per call — narrowing pages splits big scans (advisor 🟡)

export const readPdfTool = {
  name: "read_pdf",
  description: DESC("read_pdf"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "PDF file path (relative to cwd or absolute)" },
      pages: { type: "string", description: `Pages to extract, e.g. "1-3,5" (1-based, PDF page numbers; default: all pages, max ${MAX_PAGES_PER_CALL} per call)` },
    },
    required: ["path"],
  },
  readonly: true,
  multimodal: true, // scanned pages return JSON { text, images } — agent loop converts to a multimodal user message (read_image mechanism)
  /** Returns plain text for text PDFs; JSON { text, images } when scanned pages are included. */
  async execute(args, ctx) {
    const abs = resolveInCwd(ctx, args.path)
    const st = await stat(abs).catch(() => null)
    if (!st) throw new Error(`read_pdf: file not found: ${args.path}`)
    if (st.size > MAX_FILE_BYTES) throw new Error(`read_pdf: PDF too large (${Math.round(st.size / 1024 / 1024)}MB > ${MAX_FILE_BYTES / 1024 / 1024}MB limit)`)
    const buf = await readFile(abs)

    // --- open + page selection (F-P4) ---
    let doc
    try { doc = openPdf(buf) }
    catch (e) { throw new Error(`read_pdf: ${e.message}`) }
    const pageCount = extractPages(doc, []).pageCount // cheap: page-tree walk only
    const want = parsePages(args.pages, pageCount)
    const { pages, warnings } = extractPages(doc, want)

    // --- vision gate (c2): only image pages need a multimodal provider ---
    const model = ctx.agent?.provider?.model
    const vision = !model || specForModel(model).multimodal
    const textPart = [`[read_pdf: ${basename(abs)} — ${pages.length} of ${pageCount} page${pageCount === 1 ? "" : "s"}${args.pages ? ` (${args.pages})` : ""}]`]
    const images = []
    let scanned = 0
    let totalImageBytes = 0
    for (const page of pages) {
      textPart.push(`--- Page ${page.no} ---`)
      if (page.hasText) {
        for (const line of page.lines) textPart.push(line)
        continue
      }
      if (!page.images.length) {
        textPart.push("(blank page — no text, no images)")
        continue
      }
      scanned++
      if (!vision) {
        // degrade to a text hint (design §11.3.2): no image_url in a text-only model's history
        textPart.push(`[page ${page.no}: scanned page (${page.images.length} image${page.images.length === 1 ? "" : "s"}, no text layer). Model "${model}" has no vision — switch to a multimodal provider and re-run read_pdf (page images return in-band), or extract the page and read it via read_image.]`)
        continue
      }
      const perPage = []
      for (const imgObj of page.images) {
        try {
          const out = extractImage(imgObj)
          if (!out) { perPage.push(`[page ${page.no}: embedded image in an unsupported form — cannot return via the multimodal channel]`) ; continue }
          if (out.data.length > MAX_IMAGE_BYTES) { perPage.push(`[page ${page.no}: embedded image too large (${Math.round(out.data.length / 1024 / 1024)}MB > 15MB) to return — skipped]`) ; continue }
          if (totalImageBytes + out.data.length > MAX_TOTAL_IMAGE_BYTES) {
            perPage.push(`[page ${page.no}: cumulative scan budget exhausted (25MB/call) — narrow the pages range (e.g. pages="1-10") and re-run for the rest]`)
            continue
          }
          images.push({ type: "image_url", image_url: { url: `data:${out.mime};base64,${out.data.toString("base64")}` } })
          totalImageBytes += out.data.length
          perPage.push(`[page ${page.no}: scanned image attached (${out.mime}, ${out.data.length} bytes, ${out.width}×${out.height})]`)
        } catch (e) {
          perPage.push(`[page ${page.no}: image extraction failed: ${e.message}]`)
        }
      }
      textPart.push(...perPage)
    }
    for (const w of warnings.slice(0, 8)) textPart.push(`[warning: ${w}]`)
    if (warnings.length > 8) textPart.push(`[warning: ${warnings.length - 8} more suppressed — re-run to investigate]`)
    const full = textPart.join("\n")
    if (images.length) {
      // envelope: images ride the multimodal channel; text capped tightly with an actionable note (no file exists here)
      const capped = full.length > 60_000 ? full.slice(0, 60_000) + `\n[... text capped at 60KB — narrow the pages range and re-run for the rest]` : full
      return JSON.stringify({ text: capped, images })
    }
    return offloadToolResult(full, `read_pdf-${basename(abs)}`) // text-only: >64K → disk preview + path, same pipeline as read (design §11.3.1)
  },
}

/** Parse the pages spec ("1-3,5"): 1-based, ranges inclusive, ≤50 unique, within document. */
function parsePages(spec, pageCount) {
  if (spec === undefined || spec === null) {
    if (pageCount > MAX_PAGES_PER_CALL) {
      throw new Error(`read_pdf: this PDF has ${pageCount} pages — at most ${MAX_PAGES_PER_CALL} pages per call. Pass pages="1-${MAX_PAGES_PER_CALL}" (or any range within the document) to select.`)
    }
    return Array.from({ length: pageCount }, (_, i) => i + 1)
  }
  if (typeof spec !== "string" || !/^[\d,\-\s]+$/.test(spec)) {
    throw new Error(`read_pdf: invalid pages spec "${spec}" — expected e.g. "1-3,5" (page numbers or ranges).`)
  }
  const out = new Set()
  for (const token of spec.split(",")) {
    const t = token.trim()
    if (!t) continue
    const m = t.match(/^(\d+)(?:-(\d+))?$/)
    if (!m) throw new Error(`read_pdf: invalid pages spec "${spec}" — bad token "${t}"; expected e.g. "1-3,5".`)
    const a = parseInt(m[1]), b = m[2] === undefined ? a : parseInt(m[2])
    if (a < 1 || b < a) throw new Error(`read_pdf: invalid page range "${t}" — pages are 1-based and ranges go low-to-high.`)
    if (b > pageCount) throw new Error(`read_pdf: page ${b} out of range — this PDF has ${pageCount} page${pageCount === 1 ? "" : "s"}.`)
    for (let p = a; p <= b; p++) {
      out.add(p)
      if (out.size > MAX_PAGES_PER_CALL) throw new Error(`read_pdf: more than ${MAX_PAGES_PER_CALL} pages requested — narrow the range (e.g. "1-${MAX_PAGES_PER_CALL}").`)
    }
  }
  if (!out.size) throw new Error(`read_pdf: pages spec "${spec}" selected no pages.`)
  return [...out].sort((a, b) => a - b)
}

/** Image XObject ({dict, stream}) → { mime, data, width, height } — DCT passthrough / Flate→PNG (gray/RGB 8-bit). */
function extractImage(imgObj) {
  const d = imgObj.dict
  const filter = d.Filter
  const F = typeof filter === "string" ? filter : Array.isArray(filter) ? filter[0] : null
  const bpc = d.BitsPerComponent || 8
  const w = d.Width, h = d.Height
  if ((F === "DCTDecode" || F === "DCT") && imgObj.stream) {
    return { mime: "image/jpeg", data: imgObj.stream, width: w, height: h }
  }
  if ((F === "FlateDecode" || F === "Fl") && bpc === 8 && imgObj.stream) {
    const data = decodeStreamBytes(imgObj.stream, imgObj.dict) // Flate + PNG predictor per DecodeParms
    const colors = resolveColorCount(d.ColorSpace)
    if (colors === 1 || colors === 3) return { mime: "image/png", data: encodePng(data, w, h, colors), width: w, height: h }
    throw new PdfError(`Flate image in unsupported colorspace (${colors === null ? "?" : colors} channels) — only gray/RGB 8-bit convertible to PNG in v1`)
  }
  throw new PdfError(`unsupported image form (filter ${F || "?"}, ${bpc}-bit) — v1 extracts DCTDecode JPEG and 8-bit Flate gray/RGB`)
}

function resolveColorCount(cs) {
  if (!cs) return 3
  const name = typeof cs === "string" ? cs : Array.isArray(cs) ? cs[0] : null
  if (name === "DeviceGray" || name === "CalGray") return 1
  if (name === "DeviceRGB" || name === "CalRGB") return 3
  return null // Indexed/CMYK/ICC: v1 out of scope (note is surfaced, never silent)
}
