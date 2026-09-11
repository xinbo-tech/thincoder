/**
 * read_image.mjs — Image reading tool: read_image
 * Returns multimodal JSON { text, images } for the agent loop to inject as user message.
 */

import { readFileSync, statSync } from "node:fs"
import { DESC, resolvePath } from "./shared.mjs"

// Raster formats only — every mainstream vision API (Kimi, Anthropic, OpenAI, Gemini)
// rejects svg/bmp. svg is served as text source below; bmp is refused with a hint.
const IMAGE_MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" }
const MAX_IMAGE_BYTES = 15_000_000 // 15MB raw ≈ 20MB base64
const MAX_SVG_CHARS = 100_000

export const readImageTool = {
  name: "read_image",
  readonly: true,
  multimodal: true, // returns JSON { text, images } — agent loop converts to multimodal user message
  description: DESC("read_image"),
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Image file path (relative to cwd or absolute)" },
    },
    required: ["path"],
  },
  /** Returns JSON string: { text, images: [{ type: "image_url", image_url: { url: "data:..." } }] } */
  async execute({ path }, ctx) {
    const abs = resolvePath(path, ctx.cwd)
    const ext = abs.slice(abs.lastIndexOf(".") + 1).toLowerCase()

    // SVG is text markup — return the source directly (plain text, not the multimodal
    // JSON envelope, so the agent loop treats it as a normal tool result). Works with
    // text-only models too, and never poisons history with an image part the API 400s on.
    if (ext === "svg") {
      const st = statSync(abs)
      if (st.size > MAX_IMAGE_BYTES) throw new Error(`Image too large: ${Math.round(st.size / 1_000_000)}MB (max 15MB)`)
      const src = readFileSync(abs, "utf8")
      const body = src.length > MAX_SVG_CHARS ? src.slice(0, MAX_SVG_CHARS) + `\n[... truncated: ${src.length - MAX_SVG_CHARS} chars omitted]` : src
      return `[read_image: ${path} (svg source, ${src.length} chars — no vision API accepts image/svg+xml, showing markup instead)]\n${body}`
    }

    const mime = IMAGE_MIME[ext]
    if (!mime) {
      const hint = ext === "bmp" ? " Convert it to PNG first (no mainstream vision API accepts BMP)." : ""
      throw new Error(`Unsupported image format: .${ext}. Supported: ${Object.keys(IMAGE_MIME).join(", ")}, svg (as text source).${hint}`)
    }

    const imgStat = statSync(abs)
    if (imgStat.size > MAX_IMAGE_BYTES) {
      throw new Error(`Image too large: ${Math.round(imgStat.size / 1_000_000)}MB (max 15MB)`)
    }

    const buf = readFileSync(abs)
    const b64 = buf.toString("base64")
    const bytes = buf.length

    return JSON.stringify({
      text: `[read_image: ${path} (${mime}, ${bytes} bytes)]`,
      images: [{ type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } }],
    })
  },
}
