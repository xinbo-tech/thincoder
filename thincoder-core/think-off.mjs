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

/** advisor 推理档写面三态（**写语义单源** —— 由 VSC `settings-panel-write.mjs:149-164` 上提；B10 S11：
 *  桌面主侧 ∕ VSC 写面两端同引，零副本）：`advisor` 对象原地作用于 `{ thinking, reasoningEffort }` 两键 ——
 *  ① `"none"`（关思考）⇒ `thinking = thinkOffShape(spec)`（族别 off 形）+ 删 `reasoningEffort`；
 *  ② 非空档字面 ⇒ `reasoningEffort = 值` + 清 off 形残记（`thinking` 为 `null` 字面 ∕ `{type:"disabled"}`
 *     两 off 形皆清 —— 选档即要思考，B10 S11 收正：源式只清 `null` 字面，type 族 off 形残留会压过档位读回）；
 *  ③ 其余（空 ∕ 非串 = 中性）⇒ 删 `reasoningEffort` + 清 off 形残记（读回中性 —— 同上收正）。
 *  写后投影恒等（读回 = 所选：off 形 ⇒ `"none"`；字面档 ⇒ 该档；两清 ⇒ 中性）。*/
export function applyAdvisorEffort(advisor, value, spec) {
  const target = advisor !== null && typeof advisor === "object" && !Array.isArray(advisor) ? advisor : {}
  const offish = target.thinking === null || target.thinking?.type === "disabled"
  if (value === "none") {
    target.thinking = thinkOffShape(spec)
    delete target.reasoningEffort
  } else if (typeof value === "string" && value.trim()) {
    target.reasoningEffort = value.trim()
    if (offish) delete target.thinking
  } else {
    delete target.reasoningEffort
    if (offish) delete target.thinking
  }
  return target
}
