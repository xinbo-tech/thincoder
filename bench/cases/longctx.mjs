/**
 * cases/longctx.mjs — 长上下文维 3 例（大海捞针；题面逐字冻结 = 设计档 §5.7；改题 ⇒ SUITE_VERSION + 1）。
 * 长文 = `lib/haystack.mjs` 确定性生成（固定语料 + 定种子；埋点按字符偏移固定）⇒ 跨时点可比。
 */

import { numEquals, ok, preview } from "../lib/grade.mjs"
import { buildHaystack } from "../lib/haystack.mjs"

const userMsg = (text, question) => [{ role: "user", content: `${text}\n\n${question}` }]

export const cases = [
  {
    id: "longctx.1",
    dim: "longctx",
    class: "normal",
    prompt: "【8K 字符长文 + 问题】文中提到的服务 atlas 的监听端口是多少？只回答数字。",
    build: () => ({
      messages: userMsg(
        buildHaystack({
          chars: 8000,
          insertions: [{ ratio: 0.55, text: "服务 atlas 的监听端口是 49152。" }],
        }),
        "文中提到的服务 atlas 的监听端口是多少？只回答数字。",
      ),
    }),
    callOpts: {},
    grade: (result) => {
      const hit = numEquals(result.text, 49152)
      return ok(hit, hit ? `命中 49152：${preview(result.text, 40)}` : `未命中 49152：${preview(result.text, 70)}`)
    },
  },
  {
    id: "longctx.2",
    dim: "longctx",
    class: "boundary",
    prompt: "【32K 字符长文 + 近邻数字干扰】文中提到的服务 beacon 的监听端口是多少？只回答数字。",
    build: () => ({
      messages: userMsg(
        buildHaystack({
          chars: 32000,
          insertions: [
            { ratio: 0.69, text: "配置片段：端口 57317 属于服务 alpha；端口 57310 属于服务 gamma。" },
            { ratio: 0.7, text: "服务 beacon 的监听端口是 57318。" },
          ],
        }),
        "文中提到的服务 beacon 的监听端口是多少？只回答数字。",
      ),
    }),
    callOpts: {},
    grade: (result) => {
      const hit = numEquals(result.text, 57318)
      return ok(hit, hit ? `命中 57318：${preview(result.text, 40)}` : `未命中 57318（近邻干扰 57317/57310）：${preview(result.text, 60)}`)
    },
  },
  {
    id: "longctx.3",
    dim: "longctx",
    class: "error",
    prompt: "【16K 字符长文 + 新旧干扰】问：服务 helios 当前的监听端口是多少？只回答数字。",
    build: () => ({
      messages: userMsg(
        buildHaystack({
          chars: 16000,
          insertions: [
            { ratio: 0.3, text: "服务 helios 的历史端口是 40001（已废弃）。" },
            { ratio: 0.8, text: "服务 helios 当前监听端口是 42875。" },
          ],
        }),
        "服务 helios 当前的监听端口是多少？只回答数字。",
      ),
    }),
    callOpts: {},
    grade: (result) => {
      const text = String(result.text ?? "")
      if (text.includes("40001")) return ok(false, `命中旧值 40001（已废弃端口）：${preview(text, 60)}`)
      const hit = numEquals(text, 42875)
      return ok(hit, hit ? `命中当前值 42875：${preview(text, 40)}` : `未命中 42875：${preview(text, 60)}`)
    },
  },
]
