/**
 * cases/longctx.mjs — 长上下文维 3 例（大海捞针；题面逐字冻结 = 设计档 §5.7；改题 ⇒ SUITE_VERSION + 1）。
 * 长文 = `lib/haystack.mjs` 确定性生成（固定语料 + 定种子；埋点按字符偏移固定）⇒ 跨时点可比。
 * 题面面（§2.2-11）：构造型用例 = 用例声明 `prompt` 逐字（**含载荷括注**；载荷入 `build()`、不入档）；
 * 判官 `question` = 该回合用户实际所见问句（与 `build()` 发送串的问句部分逐字一致）。
 * 判分（§2.10.2 分层）：三例均有机械面（`numEquals`）；`.3` 另有判官面（**新旧区分**）。
 */

import { judgeAfterMech, numEquals, ok, preview } from "../lib/grade.mjs"
import { buildHaystack } from "../lib/haystack.mjs"

const userMsg = (text, question) => [{ role: "user", content: `${text}\n\n${question}` }]

export const cases = [
  {
    id: "longctx.1",
    dim: "longctx",
    class: "normal",
    prompt: "8K 字符长文；埋「服务 atlas 的监听端口是 49152」。问：文中提到的服务 atlas 的监听端口是多少？只回答数字。",
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
    mechRubric: "答案须为 49152（数字独立成词）。",
    grade: (result) => {
      const hit = numEquals(result.text, 49152)
      return ok(hit, hit ? `命中 49152：${preview(result.text, 40)}` : `未命中 49152：${preview(result.text, 70)}`)
    },
  },
  {
    id: "longctx.2",
    dim: "longctx",
    class: "boundary",
    prompt: "32K 字符长文；埋「服务 beacon 的监听端口是 57318」，另布置近邻数字干扰（57317、57310 等）。问句同上（服务 beacon）。",
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
    mechRubric: "答案须为 57318（数字独立成词）；57317 / 57310 为近邻干扰值。",
    grade: (result) => {
      const hit = numEquals(result.text, 57318)
      return ok(hit, hit ? `命中 57318：${preview(result.text, 40)}` : `未命中 57318（近邻干扰 57317/57310）：${preview(result.text, 60)}`)
    },
  },
  {
    id: "longctx.3",
    dim: "longctx",
    class: "error",
    prompt: "16K 字符长文：先出现「服务 helios 的历史端口是 40001（已废弃）」，后出现「服务 helios 当前监听端口是 42875」。问：服务 helios **当前**的监听端口是多少？",
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
    judge: {
      turn: 0,
      question: "服务 helios 当前的监听端口是多少？只回答数字。",
      rubric: [
        "长文载明「当前端口 42875」与「历史端口 40001（已废弃）」。PASS = 以 42875 为当前值（提及 40001 但明示其为历史 / 已废弃亦可）。FAIL = 把 40001 表述为当前值。",
      ].join("\n"),
    },
    mechRubric: "答案须以 42875 为当前端口；40001 只可作为「历史 / 已废弃」提及。",
    grade: async (result, ctx) => {
      const hit = numEquals(result.text, 42875)
      return judgeAfterMech(
        ok(hit, hit ? `命中 42875：${preview(result.text, 40)}` : `未命中 42875：${preview(result.text, 60)}`),
        ctx,
      )
    },
  },
]
