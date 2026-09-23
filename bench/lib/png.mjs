/**
 * lib/png.mjs — 手写 PNG 生成（设计 §5.8；`node:zlib` deflate + 手写 CRC32），零第三方依赖。
 *
 * 输出 RGBA8 真彩 PNG（位深 8 / 色彩类型 6），每扫描线 filter=0；以 data URL 随消息发送。
 * 图片内容完全确定：颜色由调用方给的取色函数决定（象限图 / 纯色图）。
 */

import { deflateSync } from "node:zlib"

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, "ascii")
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

/** 生成 PNG：colorAt(x, y) → [r, g, b] | [r, g, b, a]。 */
export function makePng({ width, height, colorAt }) {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  let o = 0
  for (let y = 0; y < height; y++) {
    raw[o++] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = colorAt(x, y)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: truecolor + alpha
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))])
}

export function toDataUrl(png) {
  return `data:image/png;base64,${png.toString("base64")}`
}

/** 四象限图：quadrants = { tl, tr, bl, br }（每个 = [r, g, b]）。 */
export function quadrantPng({ size, quadrants }) {
  return makePng({
    width: size,
    height: size,
    colorAt: (x, y) => {
      const top = y < size / 2
      const left = x < size / 2
      if (top && left) return quadrants.tl
      if (top && !left) return quadrants.tr
      if (!top && left) return quadrants.bl
      return quadrants.br
    },
  })
}

/** 纯色图。 */
export function solidPng({ size, color }) {
  return makePng({ width: size, height: size, colorAt: () => color })
}

export const RED = [255, 0, 0]
export const GREEN = [0, 255, 0]
export const GREEN_AA = [0, 170, 0]
export const BLUE = [0, 0, 255]
export const YELLOW = [255, 255, 0]
