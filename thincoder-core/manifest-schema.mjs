/**
 * manifest-schema.mjs — **校验 ∕ 默认值族**出档（2026-09-29 structure-split-2 · 台账 #620）：自 `manifest.mjs`
 * 全量迁出——`isValidDocRootValue`（docRoot 子键值形态判据）·
 * `DEFAULT_MANIFEST`（默认五键）· `MANIFEST_SCHEMA`（判据单源）· 元素层谓词一件 · `validateManifest` ·
 * `fillDefaults`；**结构拆分零语义**（面不变 ∕ 判据不变，只换宿主档；切点 ∕ 缝单源 =
 * 批档 `docs/batches/2026-09-29-structure-split-2.md` §2.2-C）。
 *
 * 缝 = 同名再出口：宿主 `manifest.mjs` 转口四名既有导出（`DEFAULT_MANIFEST` ∥ `MANIFEST_SCHEMA` ∥
 * `isValidDocRootValue` ∥ `validateManifest`）；`fillDefaults` 被宿主 `readManifest` 消费 ⇒ 随迁导出（宿主 import）。
 * 零环：本档零 import（纯谓词 ∥ 冻结常量——不引宿主 ∥ 不引它档）；机制详述 = `docs/core/design/MANIFEST.md` §2.2。
 */

/**
 * `docRoot` 子键**值形态判据**（F7 / KD-M1-6 / KD-M1-8——判据单源）：非空字符串（`trim` 后
 * 非空），或非空数组且元素皆非空字符串（**同款口径**：元素 `trim` 后非空），或 `null`
 * （**「本面无」合法哨兵**——KD-M1-37）；其余（空串 / 空白串 / 空数组 / 数组含非串 / 空串 /
 * 空白串元素 / 非串非数组）为非法。
 * @param {unknown} value docRoot 某子键的值
 * @returns {boolean}
 */
export function isValidDocRootValue(value) {
  if (value === null) return true
  if (typeof value === "string") return value.trim() !== ""
  if (!Array.isArray(value) || value.length === 0) return false
  return value.every((p) => typeof p === "string" && p.trim() !== "")
}

/** 默认五键——整档初始化的写源与缺键 fallback 的补源；每一键描述的都是这个用户项目自身
 *  （阶段 / 文档层 / 代码段 / 索引），产品内部布局与工具参数不住这里。 */
export const DEFAULT_MANIFEST = Object.freeze({
  version: 1,
  phase: "initial-dev",
  docRoot: Object.freeze({
    requirements: "docs/requirements",
    specs: "docs/requirements/specs",
    design: "docs/design",
    modules: "docs/design/modules",
    batches: "docs/batches",
    // 第六子键（MANIFEST.md §2.12 · KD-M1-55/57）：**标准档本身**的文件路径（单份 ∥ 多份数组），
    // 不是目录——目录会逼着在目录里猜文件名，正是本批禁的「猜固定名」。默认 `null`（未声明）是
    // 三态的地基：给一条默认路径，「未声明」与「声明了但读不到」会读出同一路径、塌成一态。
    standards: null,
  }),
  // 项目声明三族（2026-09-27 声明载体唯一化批并入——键名 / 形态逐字承前；来源档已退役）。
  codePaths: Object.freeze(["src"]),
  index: Object.freeze({ codeExtensions: Object.freeze([]), docExtensions: Object.freeze([]), excludePaths: Object.freeze([]), publicRepos: Object.freeze([]) }),
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
    index: Object.freeze(Object.keys(DEFAULT_MANIFEST.index)),
  }),
})

/** 三族声明键**元素层**判据（KD-M1-32）：数组且各元素为非空字符串（`trim` 后非空）；
 *  **数组层**自身可空（`[]` 合法——`codePaths:[]` = 无段名代码面 / `index.*:[]` = 追加零项）。 */
function isNonEmptyStringArray(v) {
  return Array.isArray(v) && v.every((e) => typeof e === "string" && e.trim() !== "")
}

/**
 * 形状校验（模块设计 §2.2）——枚举 / version 数值恒做；**纯函数、零 fs**（原 `{ cwd }`
 * 指针分支已随字段整链裁撤——KD-M1-5 墓志）；不落盘。键存在性入 missingKeys（非拒）：
 * 缺键 = 便利 fallback（补默认值），不是错（与整档缺失两分——KD-M1-2）。
 * 未知键（#802 / KD-M1-36）：顶层 + 两嵌套层产 `unknownKeys`（非拒——ok 定性零变；产线恰 =
 * fillDefaults 丢弃面；嵌套键用点形路径——同 missingKeys 口径）。
 * @param {object} obj 待校验 manifest 对象
 * @returns {{ok:boolean, errors:string[], missingKeys:string[], unknownKeys:string[]}}
 */
export function validateManifest(obj) {
  const errors = []
  const missingKeys = []
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return { ok: false, errors: ["manifest 顶层必须是 JSON 对象"], missingKeys, unknownKeys: [] }
  }
  // #802（KD-M1-36——未知键可见化）：顶层 + 两嵌套层逐键对照（非拒——ok 定性零变；嵌套键点形）。
  const unknownKeys = []
  for (const key of Object.keys(obj)) if (!MANIFEST_SCHEMA.keys.includes(key)) unknownKeys.push(key)
  for (const [nested, subkeys] of Object.entries(MANIFEST_SCHEMA.nestedKeys)) {
    const value = obj[nested]
    if (value === null || typeof value !== "object" || Array.isArray(value)) continue
    for (const sub of Object.keys(value)) if (!subkeys.includes(sub)) unknownKeys.push(`${nested}.${sub}`)
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
      // docRoot 子键值形态（F7 / KD-M1-7 / KD-M1-37）：串 | 非空串数组 | null（本面无）；非法 → 拒（不静默跳过）。
      if (nested === "docRoot" && !isValidDocRootValue(value[sub])) {
        errors.push(`docRoot.${sub} 值形态非法：${JSON.stringify(value[sub])}（须为非空字符串 / 非空字符串数组 / null（本面无）——KD-M1-6 / KD-M1-7 / KD-M1-37）`)
      }
    }
  }
  // 三族声明键形态（KD-M1-32——fail-closed：非法即 errors，不静默跳过；缺键仍在 missingKeys）。
  // `index.excludePaths`（§6.14 面①）：**数组层** fail-closed（非数组 ⇒ 拒）；元素层宽容——空 ∕ 非串
  // 元素由归一剔除（L-①-1 夹具 `["./openclaw/","refs",""]` ⇒ `["openclaw","refs"]`）；`index.publicRepos`（§6.15）同款。
  const strArrErr = (key, v) => { if (!isNonEmptyStringArray(v)) errors.push(`${key} 值形态非法：${JSON.stringify(v)}（须为非空字符串数组——KD-M1-32）`) }
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
    if (obj.index.publicRepos !== undefined && !Array.isArray(obj.index.publicRepos)) {
      errors.push(`index.publicRepos 值形态非法：${JSON.stringify(obj.index.publicRepos)}（须为数组——非数组 fail-closed；空 ∕ 非串元素由归一剔除）`)
    }
  }
  if (obj.phase !== undefined && !MANIFEST_SCHEMA.enum.phase.includes(obj.phase)) {
    errors.push(`phase 取值非法："${obj.phase}"（允许：${MANIFEST_SCHEMA.enum.phase.join(" | ")}）`)
  }
  if (obj.version !== undefined && (typeof obj.version !== "number" || !Number.isFinite(obj.version))) {
    errors.push(`version 非法：${JSON.stringify(obj.version)}（须为数值）`)
  }
  return { ok: errors.length === 0, errors, missingKeys, unknownKeys }
}

/** 缺键补默认值（module 设计 §2.2 管线）：顶层缺键补默认、嵌套键（docRoot/index）
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
        if (key === "index") out[key] = src // 形态错 → 透传（再校验拒）；docRoot 保持默认
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
