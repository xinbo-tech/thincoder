/**
 * manifest-schema.mjs — **校验 ∕ 默认值族**出档（2026-09-29 structure-split-2 · 台账 #620）：自 `manifest.mjs`
 * 全量迁出〔原 `:194-205` + `:240-369` 两段非连续〕——`isValidDocRootValue`（docRoot 子键值形态判据）·
 * `DEFAULT_MANIFEST`（默认八键）· `MANIFEST_SCHEMA`（判据单源）· 元素层谓词两件 · `validateManifest` ·
 * `fillDefaults`；**结构拆分零语义**（面不变 ∕ 判据不变，只换宿主档；切点 ∕ 缝单源 =
 * 批档 `docs/batches/2026-09-29-structure-split-2.md` §2.2-C）。
 *
 * 缝 = 同名再出口：宿主 `manifest.mjs` 转口四名既有导出（`DEFAULT_MANIFEST` ∥ `MANIFEST_SCHEMA` ∥
 * `isValidDocRootValue` ∥ `validateManifest`）；`fillDefaults` 被宿主 `readManifest` 消费 ⇒ 随迁导出（宿主 import）。
 * 零环：本档零 import（纯谓词 ∥ 冻结常量——不引宿主 ∥ 不引它档）；机制详述 = `docs/core/design/MANIFEST.md` §2.2。
 */

/**
 * `docRoot` 子键**值形态判据**（F7 / KD-M1-6 / KD-M1-8——判据单源）：非空字符串（`trim` 后
 * 非空），或非空数组且元素皆非空字符串（**同款口径**：元素 `trim` 后非空）；其余（空串 /
 * 空白串 / 空数组 / 数组含非串 / 空串 / 空白串元素 / 非串非数组）为非法。
 * @param {unknown} value docRoot 某子键的值
 * @returns {boolean}
 */
export function isValidDocRootValue(value) {
  if (typeof value === "string") return value.trim() !== ""
  if (!Array.isArray(value) || value.length === 0) return false
  return value.every((p) => typeof p === "string" && p.trim() !== "")
}

/** 默认八键（架构 §2.3 E1 五键 + 三族声明键——KD-M1-31）——整档初始化的写源与缺键 fallback 的补源。 */
export const DEFAULT_MANIFEST = Object.freeze({
  version: 1,
  phase: "initial-dev",
  docRoot: Object.freeze({
    requirements: "docs/requirements",
    specs: "docs/requirements/specs",
    design: "docs/design",
    modules: "docs/design/modules",
    batches: "docs/batches",
  }),
  promptsLanding: "thincoder-core/prompts",
  checkConfig: Object.freeze({
    scanDirs: Object.freeze(["docs"]),
    lineWidth: 300,
    widthExemptZones: Object.freeze([]),
    anchors: Object.freeze({ domain: "docs", exclude: Object.freeze(["_archive", "batches"]) }),
    exemptions: Object.freeze([]),
    lineCounts: Object.freeze([]), // 行数面机检声明（#546）：[] = 未载惰性（doc-check 行数族）
  }),
  // 项目声明三族（2026-09-27 声明载体唯一化批并入——键名 / 形态逐字承前；来源档已退役）。
  codePaths: Object.freeze(["src"]),
  index: Object.freeze({ codeExtensions: Object.freeze([]), docExtensions: Object.freeze([]), excludePaths: Object.freeze([]) }),
  advisor: Object.freeze({ docMap: "", standardsDoc: "" }),
})

/** 校验判据（模块设计 §2.2）——枚举 / 键存在（fallback 用）；判据单源（KD-M1-4）。 */
export const MANIFEST_SCHEMA = Object.freeze({
  $anchor: "docs/core/design/MANIFEST.md",
  enum: Object.freeze({
    phase: Object.freeze(["initial-dev", "production"]),
  }),
  keys: Object.freeze(Object.keys(DEFAULT_MANIFEST)),
  nestedKeys: Object.freeze({
    docRoot: Object.freeze(Object.keys(DEFAULT_MANIFEST.docRoot)),
    checkConfig: Object.freeze(Object.keys(DEFAULT_MANIFEST.checkConfig)),
    index: Object.freeze(Object.keys(DEFAULT_MANIFEST.index)),
    advisor: Object.freeze(Object.keys(DEFAULT_MANIFEST.advisor)),
  }),
})

/** 三族声明键**元素层**判据（KD-M1-32）：数组且各元素为非空字符串（`trim` 后非空）；
 *  **数组层**自身可空（`[]` 合法——`codePaths:[]` = 无段名代码面 / `index.*:[]` = 追加零项）。 */
function isNonEmptyStringArray(v) {
  return Array.isArray(v) && v.every((e) => typeof e === "string" && e.trim() !== "")
}

/** `checkConfig.lineCounts` 元素层判据（#546）：数组且各元素为非数组对象、`doc` / `section` 皆非空串（`trim` 后非空）；`[]` = 未载惰性。 */
function isLineCountsValue(v) {
  return Array.isArray(v) && v.every((e) => e !== null && typeof e === "object" && !Array.isArray(e)
    && typeof e.doc === "string" && e.doc.trim() !== "" && typeof e.section === "string" && e.section.trim() !== "")
}

/**
 * 形状校验（模块设计 §2.2）——枚举 / version 数值恒做；**纯函数、零 fs**（原 `{ cwd }`
 * 指针腿已随字段整链裁撤——KD-M1-5 墓志）；不落盘。键存在性入 missingKeys（非拒）：
 * 缺键 = 便利 fallback（补默认值），不是错（与整档缺失两分——KD-M1-2）。
 * @param {object} obj 待校验 manifest 对象
 * @returns {{ok:boolean, errors:string[], missingKeys:string[]}}
 */
export function validateManifest(obj) {
  const errors = []
  const missingKeys = []
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, errors: ["manifest 顶层必须是 JSON 对象"], missingKeys }
  }
  for (const key of MANIFEST_SCHEMA.keys) {
    if (!(key in obj)) missingKeys.push(key)
  }
  for (const [nested, subkeys] of Object.entries(MANIFEST_SCHEMA.nestedKeys)) {
    const value = obj[nested]
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      missingKeys.push(nested) // 整键缺失/非对象 → 与整键缺同语义（整键补默认）
      continue
    }
    for (const sub of subkeys) {
      if (!(sub in value)) { missingKeys.push(`${nested}.${sub}`); continue } // 子键路径（AC-3 / T3b）
      // docRoot 子键值形态（F7 / KD-M1-7）：串 | 非空串数组；非法 → 拒（不静默跳过）。
      if (nested === "docRoot" && !isValidDocRootValue(value[sub])) {
        errors.push(`docRoot.${sub} 值形态非法：${JSON.stringify(value[sub])}（须为非空字符串或非空字符串数组——KD-M1-6 / KD-M1-7）`)
      }
      // checkConfig.lineCounts 元素层形态（#546）：数组，元素 = { doc, section } 非空串；非法 → 拒（不静默跳过）。
      if (nested === "checkConfig" && sub === "lineCounts" && !isLineCountsValue(value[sub])) {
        errors.push(`checkConfig.lineCounts 值形态非法：${JSON.stringify(value[sub])}（须为数组，元素 = { doc: 非空串, section: 非空串 }——#546）`)
      }
    }
  }
  // 三族声明键形态（KD-M1-32——fail-closed：非法即 errors，不静默跳过；缺键仍在 missingKeys）。
  // `index.excludePaths`（§6.14 面①）：**数组层** fail-closed（非数组 ⇒ 拒）；元素层宽容——空 ∕ 非串
  // 元素由归一剔除（L-①-1 夹具 `["./openclaw/","refs",""]` ⇒ `["openclaw","refs"]`）。
  const strArrErr = (key, v) => { if (!isNonEmptyStringArray(v)) errors.push(`${key} 值形态非法：${JSON.stringify(v)}（须为非空字符串数组——KD-M1-32）`) }
  const strErr = (key, v) => { if (typeof v !== "string") errors.push(`${key} 值形态非法：${JSON.stringify(v)}（须为字符串——KD-M1-32）`) }
  const objErr = (key, v) => (v === null || typeof v !== "object" || Array.isArray(v)
    ? `${key} 值形态非法：${JSON.stringify(v)}（须为对象——KD-M1-32）` : null)
  if (obj.codePaths !== undefined) strArrErr("codePaths", obj.codePaths)
  const idxBad = obj.index === undefined ? null : objErr("index", obj.index)
  if (idxBad) errors.push(idxBad)
  else if (obj.index !== undefined) {
    for (const k of ["codeExtensions", "docExtensions"]) if (obj.index[k] !== undefined) strArrErr(`index.${k}`, obj.index[k])
    if (obj.index.excludePaths !== undefined && !Array.isArray(obj.index.excludePaths)) {
      errors.push(`index.excludePaths 值形态非法：${JSON.stringify(obj.index.excludePaths)}（须为数组——非数组 fail-closed；空 ∕ 非串元素由归一剔除）`)
    }
  }
  const advBad = obj.advisor === undefined ? null : objErr("advisor", obj.advisor)
  if (advBad) errors.push(advBad)
  else if (obj.advisor !== undefined) for (const k of ["docMap", "standardsDoc"]) if (obj.advisor[k] !== undefined) strErr(`advisor.${k}`, obj.advisor[k])
  if (obj.phase !== undefined && !MANIFEST_SCHEMA.enum.phase.includes(obj.phase)) {
    errors.push(`phase 取值非法："${obj.phase}"（允许：${MANIFEST_SCHEMA.enum.phase.join(" | ")}）`)
  }
  if (obj.version !== undefined && (typeof obj.version !== "number" || !Number.isFinite(obj.version))) {
    errors.push(`version 非法：${JSON.stringify(obj.version)}（须为数值）`)
  }
  return { ok: errors.length === 0, errors, missingKeys }
}

/** 缺键补默认值（module 设计 §2.2 管线）：顶层缺键补默认、嵌套键（docRoot/checkConfig/index/advisor）
 *  子键补默认（与整键缺同语义）；不覆写既有值。深拷贝默认源（structuredClone）——冻结常量永不外泄引用。
 *  三族键的非对象值**原样透传**（不洗白——再校验拒，KD-M1-32）。 */
export function fillDefaults(obj) {
  const out = structuredClone(DEFAULT_MANIFEST)
  for (const key of MANIFEST_SCHEMA.keys) {
    if (!(key in obj)) continue
    const def = out[key]
    if (def !== null && typeof def === "object" && !Array.isArray(def)) {
      const src = obj[key]
      if (src === null || typeof src !== "object" || Array.isArray(src)) {
        if (key === "index" || key === "advisor") out[key] = src // 形态错 → 透传（再校验拒）；docRoot/checkConfig 保持默认
        continue
      }
      for (const sub of Object.keys(def)) {
        if (sub in src) out[key][sub] = src[sub]
      }
    } else {
      out[key] = obj[key]
    }
  }
  return out
}
