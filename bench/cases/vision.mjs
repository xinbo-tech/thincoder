/**
 * cases/vision.mjs — 视觉维 3 例（题面逐字冻结 = 设计档 §5.8；改题 ⇒ SUITE_VERSION + 1）。
 * 图片 = `lib/png.mjs` 手写生成（16×16 四象限 / 8×8 纯色 #00aa00），以 data URL 随消息发送；
 * 判分 = 颜色归一化词表命中（vision.3 = 无中生有拒答闭词表）。
 */

import { colorMatch, keywordSet, ok, preview } from "../lib/grade.mjs"
import { BLUE, GREEN, GREEN_AA, RED, YELLOW, quadrantPng, solidPng, toDataUrl } from "../lib/png.mjs"

const QUADRANTS = quadrantPng({ size: 64, quadrants: { tl: RED, tr: BLUE, bl: GREEN, br: YELLOW } })
const SOLID_GREEN = solidPng({ size: 32, color: GREEN_AA })

const withImage = (question, dataUrl) => [{
  role: "user",
  content: [
    { type: "text", text: question },
    { type: "image_url", image_url: { url: dataUrl } },
  ],
}]

export const ABSTAIN_WORDS = ["没有猫", "没猫", "看不到", "不存在", "无法判断", "没有动物", "没有任何猫", "一只猫也没有", "0只猫", "零只猫"]

/** 否定式形态（组合判定：`没有…猫` / `猫…也没有` 任序——补词表漏检）。 */
export const ABSTAIN_RE = /(没有|没|无|不存在|看不到)[^。！？\n]{0,12}猫|猫[^。！？\n]{0,10}(也没有|都没有|都没)/

export const cases = [
  {
    id: "vision.1",
    dim: "vision",
    class: "normal",
    prompt: "图片被分成四个象限，请只回答左上角象限的颜色。",
    build: () => ({ messages: withImage("图片被分成四个象限，请只回答左上角象限的颜色。", toDataUrl(QUADRANTS)) }),
    callOpts: {},
    grade: (result) => {
      const hit = colorMatch(result.text, "red")
      return ok(hit.hit, hit.hit ? `左上角 = 红色族（命中「${hit.matched}」）` : `未命中红色族：${preview(result.text, 60)}`)
    },
  },
  {
    id: "vision.2",
    dim: "vision",
    class: "boundary",
    prompt: "这张图是什么颜色？只回答颜色名。",
    build: () => ({ messages: withImage("这张图是什么颜色？只回答颜色名。", toDataUrl(SOLID_GREEN)) }),
    callOpts: {},
    grade: (result) => {
      const hit = colorMatch(result.text, "green")
      return ok(hit.hit, hit.hit ? `纯色图 = 绿色族（命中「${hit.matched}」）` : `未命中绿色族：${preview(result.text, 60)}`)
    },
  },
  {
    id: "vision.3",
    dim: "vision",
    class: "error",
    prompt: "图里有几只猫？",
    build: () => ({ messages: withImage("图里有几只猫？", toDataUrl(QUADRANTS)) }),
    callOpts: {},
    grade: (result) => {
      // 正确 = 指出图中没有猫 / 无法判断（无中生有拒答）；词表 ∪ 否定式正则
      const hit = keywordSet(result.text, ABSTAIN_WORDS)
      const re = ABSTAIN_RE.test(result.text)
      const pass = hit.hit || re
      return ok(pass, pass ? `拒答正确（${hit.hit ? `命中「${hit.matched}」` : "否定式形态"}）` : `未拒答：${preview(result.text, 70)}`)
    },
  },
]
