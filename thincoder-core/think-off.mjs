/**
 * think-off.mjs — off 形族的单一实现源（叶档：零 import 纯函数）。
 *
 * 单一来源 = `docs/core/design/MODEL-SPECS.md`：写面取形 = §16.2 / §15.4-2 族别判据表；
 * 「有效 off 路径」判据 = §16.4。四处生产者（CLI `/think` · CLI `/advisor` · VSC 主模型面
 * `reasoning-mode.mjs` · VSC 面板写面 `settings-panel-write.mjs`）一律消费本档（端引核零副本——
 * 副本即漂移源：VSC 全族一形 `null` 与 CLI 自定义族支 `undefined` 两处漂移已实证，§16.1-③）。
 */

/** 写面取形（§15.4-2 族别判据的单一实现）：`spec → null | { type:"disabled" }`。
 *  effort 族（`thinkApi === "effort"`）⇒ `null`——载荷层 off 门首款要求 `thinking === null`
 *  （单源 = `doc:PROVIDER.md:§6.12`；`{type:"disabled"}` 不开门 ⇒ 关思考静默失效）；
 *  其余（type 族默认 / 自定义开值族）⇒ `{ type: "disabled" }`——type 机制原生 off 形。 */
export function thinkOffShape(spec) {
  return spec?.thinkApi === "effort" ? null : { type: "disabled" }
}

/** 有效 off 路径（「何时可宣称 OFF」判据本体 = §16.4）——由 `thinkOffShape` 派生（防两处漂移）：
 *  `null` 形只有 effort 族的载荷门据它补发 `reasoning_effort:"none"` ⇒ 须枚举含 `"none"`
 *  （无枚举 / 无 `none` ⇒ 形不发任何字段，§16.4 表第 1 行）；`{type:"disabled"}` 形 ⇒ 达载荷层。
 *  两形共门 = `thinkAlwaysOn !== true`（服务端强制族：形被拒 / 恒思考 ⇒ 无效，§16.3 / §16.4 表第 2 行）。 */
export function thinkOffPath(spec) {
  if (spec?.thinkAlwaysOn === true) return false
  if (thinkOffShape(spec) === null) return (spec?.reasoningEffortEnum ?? []).includes("none")
  return true
}
