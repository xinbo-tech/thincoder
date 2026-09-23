/**
 * cases/vision.mjs — 视觉维 3 例（题面逐字冻结 = 设计档 §5.8；改题 ⇒ SUITE_VERSION + 1）。
 * 图片 = `lib/png.mjs` 手写生成（64×64 四象限 / 32×32 纯色 #00aa00），以 data URL 随消息发送。
 * 题面面（§2.2-11）：构造型用例 = 用例声明 `prompt` 逐字（含载荷括注）；判官 `question` = 用户实际所见问句。
 * 判分（§2.10.2 分层）：三例**全部为判官面**（色名族 / 无中生有拒答；rubric = §5.11 正本逐字）——
 * 判官不喂图像（KD-22：事实正本住 rubric）。
 */

import { judgeResult } from "../lib/grade.mjs"
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

export const cases = [
  {
    id: "vision.1",
    dim: "vision",
    class: "normal",
    prompt: "64×64 四象限图（左上红 #ff0000 / 右上蓝 / 左下绿 / 右下黄）。问：图片被分成四个象限，请只回答左上角象限的颜色。",
    build: () => ({ messages: withImage("图片被分成四个象限，请只回答左上角象限的颜色。", toDataUrl(QUADRANTS)) }),
    callOpts: {},
    judge: {
      turn: 0,
      question: "图片被分成四个象限，请只回答左上角象限的颜色。",
      rubric: "四象限图（左上 `#ff0000`）。PASS = 回答左上角为红色族（红 / 红色 / 大红 / 正红 / `#ff0000` / red 等等价表述）。FAIL = 其他颜色、答非所问、或声称无法判断。",
    },
    grade: async (result, ctx) => judgeResult(await ctx.judge()),
  },
  {
    id: "vision.2",
    dim: "vision",
    class: "boundary",
    prompt: "32×32 纯色图（纯绿 #00aa00）。问：这张图是什么颜色？只回答颜色名。",
    build: () => ({ messages: withImage("这张图是什么颜色？只回答颜色名。", toDataUrl(SOLID_GREEN)) }),
    callOpts: {},
    judge: {
      turn: 0,
      question: "这张图是什么颜色？只回答颜色名。",
      rubric: "纯色图 `#00aa00`。PASS = 回答绿色族（绿 / 绿色 / `#00aa00` / green 等等价表述）。FAIL = 其他颜色或拒绝回答。",
    },
    grade: async (result, ctx) => judgeResult(await ctx.judge()),
  },
  {
    id: "vision.3",
    dim: "vision",
    class: "error",
    prompt: "64×64 四象限图同 `vision.1`。问：图里有几只猫？",
    build: () => ({ messages: withImage("图里有几只猫？", toDataUrl(QUADRANTS)) }),
    callOpts: {},
    judge: {
      turn: 0,
      question: "图里有几只猫？",
      rubric: "图为四象限色块（无猫）。PASS = 指出图中没有猫 / 无法回答该问题 / 明确拒答（任何等价表述）。FAIL = 给出任何猫的数量或描述（无中生有）。",
    },
    grade: async (result, ctx) => judgeResult(await ctx.judge()),
  },
]
