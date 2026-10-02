#!/usr/bin/env node
/**
 * make-icon.mjs — 桌面图标生成器（零依赖 · 确定性可复跑——复跑字节一致）。
 *
 * 形 = 站点 `favicon.svg` 同品牌：圆角方块 `#2563eb` + `</>` 白字形（几何笔画程序绘制——非字体渲染）。
 * 产物 = `build/icon.ico`（多尺寸 16 ∕ 32 ∥ 48 ∥ 256 单文件入库——构建输入；单源 = `docs/desktop/design/PROJECT.md` §5.4）。
 * 编码：RGBA PNG（手写 chunks + zlib deflate）装进 ICO 容器（Vista+ PNG 形态——记 bitCount 32）。
 * 用法：`node scripts/make-icon.mjs`；纯函数面（`renderIcon` ∥ `encodePng` ∥ `encodeIco`）可直测（批内件 L2）。
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { deflateSync } from "node:zlib"

/** 产物尺寸族（单文件 ico 内逐尺寸一件 PNG）。 */
export const SIZES = [16, 32, 48, 256]

/** 品牌色 `#2563eb`（站点 favicon 同值）。 */
export const BRAND = { r: 0x25, g: 0x63, b: 0xeb }

/** 圆角半径（归一化——favicon `rx=6` / 32 ≈ 0.1875）。 */
export const RADIUS = 0.1875

/** 字形几何（归一化坐标；`</>` 三笔——笔画 = 胶囊线段，端点圆帽；三笔分离，对位 favicon 字形）。 */
export const GLYPH = {
  cy: 0.545, // 字形竖直中心
  chevron: { cx: [0.245, 0.755], halfW: 0.088, halfH: 0.108 }, // `<` ∥ `>`
  slash: { cx: 0.5, halfW: 0.062, halfH: 0.152 },
  stroke: 0.062, // 笔画宽（直径——半径 = /2）
}

/** 字形笔画段（由 `GLYPH` 派生——单源）。 */
export function glyphSegments(glyph = GLYPH) {
  const { cy, chevron, slash } = glyph
  const [left, right] = chevron.cx
  return [
    [left + chevron.halfW, cy - chevron.halfH, left - chevron.halfW, cy],
    [left - chevron.halfW, cy, left + chevron.halfW, cy + chevron.halfH],
    [right - chevron.halfW, cy - chevron.halfH, right + chevron.halfW, cy],
    [right + chevron.halfW, cy, right - chevron.halfW, cy + chevron.halfH],
    [slash.cx - slash.halfW, cy + slash.halfH, slash.cx + slash.halfW, cy - slash.halfH],
  ]
}

/** 点到线段距离（纯函数——胶囊覆盖判定基座）。 */
export function distanceToSegment(px, py, [x1, y1, x2, y2]) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSq))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

/** 圆角方块覆盖判定（归一化点——超椭圆 ∕ SDF 形）。 */
export function insideRoundedRect(px, py, radius = RADIUS) {
  const dx = Math.abs(px - 0.5) - (0.5 - radius)
  const dy = Math.abs(py - 0.5) - (0.5 - radius)
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  const inside = Math.min(Math.max(dx, dy), 0)
  return outside + inside - radius <= 0
}

/** 字形覆盖判定（归一化点——任一笔画胶囊内）。 */
export function insideGlyph(px, py, glyph = GLYPH) {
  const limit = glyph.stroke / 2
  return glyphSegments(glyph).some((segment) => distanceToSegment(px, py, segment) <= limit)
}

/** 渲染（纯函数 · 确定性）：RGBA 缓冲（`size × size × 4`）；边沿 4×4 超采样抗锯齿。 */
export function renderIcon(size, samples = 4) {
  const buf = Buffer.alloc(size * size * 4)
  const total = samples * samples
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0
      let fg = 0
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = (x + (sx + 0.5) / samples) / size
          const py = (y + (sy + 0.5) / samples) / size
          if (!insideRoundedRect(px, py)) continue
          bg++
          if (insideGlyph(px, py)) fg++
        }
      }
      const mix = bg > 0 ? fg / bg : 0 // 白字形覆盖率（相对底色覆盖——字形恒在底内）
      const offset = (y * size + x) * 4
      buf[offset] = Math.round(BRAND.r + (0xff - BRAND.r) * mix)
      buf[offset + 1] = Math.round(BRAND.g + (0xff - BRAND.g) * mix)
      buf[offset + 2] = Math.round(BRAND.b + (0xff - BRAND.b) * mix)
      buf[offset + 3] = Math.round((bg / total) * 0xff)
    }
  }
  return buf
}

/** CRC-32（PNG chunk 校验——零依赖自实现，确定性与 Node 版本无涉）。 */
export function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** PNG chunk（`[4B 长度][4B 类型][载荷][4B CRC]`——长度 ∕ 类型 ∕ 载荷入 CRC）。 */
function chunk(type, payload) {
  const head = Buffer.alloc(4)
  head.writeUInt32BE(payload.length, 0)
  const body = Buffer.concat([Buffer.from(type, "latin1"), payload])
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([head, body, tail])
}

/** RGBA ⇒ PNG（8 位色深 · 真彩 + alpha · 无隔行 · 逐行 filter 0）。 */
export function encodePng(rgba, size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // 位深
  ihdr[9] = 6 // 颜色型 = 真彩 + alpha
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))])
}

/** PNG 件 ⇒ ICO 容器（`ICONDIR` + 逐件 `ICONDIRENTRY` + PNG 数据；256 ⇒ 宽高字节记 0）。 */
export function encodeIco(entries) {
  const header = Buffer.alloc(6 + 16 * entries.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)
  let offset = header.length
  entries.forEach((entry, index) => {
    const at = 6 + 16 * index
    const dim = entry.size >= 256 ? 0 : entry.size
    header.writeUInt8(dim, at)
    header.writeUInt8(dim, at + 1)
    header.writeUInt16LE(1, at + 4) // 色平面
    header.writeUInt16LE(32, at + 6) // 位深（RGBA）
    header.writeUInt32LE(entry.png.length, at + 8)
    header.writeUInt32LE(offset, at + 12)
    offset += entry.png.length
  })
  return Buffer.concat([header, ...entries.map((entry) => entry.png)])
}

/** 图标构建（纯函数 · 确定性——同入参恒同字节）。 */
export function buildIcon(sizes = SIZES) {
  return encodeIco(sizes.map((size) => ({ size, png: encodePng(renderIcon(size), size) })))
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const out = join(root, "build", "icon.ico")
  const icon = buildIcon()
  mkdirSync(dirname(out), { recursive: true })
  writeFileSync(out, icon)
  console.log(`[make-icon] ${out}（${icon.length} 字节 · 尺寸 ${SIZES.join(" ∕ ")}）`)
  return 0
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url
if (isMain) process.exit(main())
