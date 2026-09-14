/**
 * prompt-injections-cli.test.mjs — CLI 端锚面机检（U2——CORE-UNIFICATION §2.6.3 专项验收
 * ②③⑦ · §2.13.2「CLI 列」· §2.13.7⑤⑥）。
 *
 * 断言面（行为 / 结构机检——不断言文档句子）：
 *   ① 表 ⇔ 核锚名集合**逐名等值**（fail-closed：核档新增锚而表未配 ⇒ 配置态装配抛错即红；
 *      表多键 / 旧名单锚回潮 ⇒ 本检红）；锚名去重 = 13、`agent-loop-ptr-*` 恰 5 名；
 *   ② 配置态（CLI 表）：七个场景装配 + 全部内建工具描述零 `{{inject:` 字面，且 §2.13.2
 *      「CLI 列」取值逐条在场（空串项由零字面断言覆盖）；
 *   ③ 未配置态：恒等（原文过——U0 三态基线「未配置零变」）。
 * 纯模块调用 + 文件读取——快层直跑（真实入口径覆盖在集成层 cli-prompt-entry.test.mjs）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import {
  PROMPTS_DIR, TOOL_DOCS_DIR,
  configurePromptInjections, resetPromptInjections,
} from "@thincoder/core/prompt-files.mjs"
import { assemblePrompt } from "@thincoder/core/prompt-overlays.mjs"
import { toOpenAISchema, builtinTools } from "@thincoder/core/tools/index.mjs"
import { CLI_PROMPT_INJECTIONS } from "../src/prompt-injections.mjs"

const SCENARIOS = ["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan", "consult"]
const ANCHOR_RE = /\{\{inject:([a-z0-9-]+)\}\}/g
const LITERAL = "{{inject:"

after(() => resetPromptInjections())

/** 核内全部注入锚名（去重；扫描对象 = 核包 prompts/ + tool-docs/——与表同源）。 */
function coreAnchorNames() {
  const names = new Set()
  for (const dir of [PROMPTS_DIR, TOOL_DOCS_DIR]) {
    for (const f of readdirSync(dir)) {
      for (const m of readFileSync(join(dir, f), "utf8").matchAll(ANCHOR_RE)) names.add(m[1])
    }
  }
  return [...names].sort()
}

test("① 表 ⇔ 核锚名集合逐名等值（13 名 · 旧名单锚零命中 · ptr 族恰 5 名）", () => {
  const core = coreAnchorNames()
  assert.deepEqual(core, Object.keys(CLI_PROMPT_INJECTIONS).sort(), "CLI 表键 ⇔ 核内锚名（逐名等值——新增/缺失即红）")
  assert.equal(core.length, 13, "锚名去重集合 = 13（§2.13.7⑥）")
  assert.ok(!core.includes("agent-loop-pointer"), "旧名单锚零命中")
  assert.equal(core.filter((n) => n.startsWith("agent-loop-ptr-")).length, 5, "agent-loop-ptr-* 恰 5 名")
})

test("② 配置态：七场景 + consult 装配零锚字面，且「CLI 列」取值逐条在场", () => {
  try {
    configurePromptInjections(CLI_PROMPT_INJECTIONS)
    const prompts = {}
    for (const s of SCENARIOS) {
      const r = assemblePrompt(s)
      assert.ok(!r.prompt.includes(LITERAL), `${s}: 装配输出零 ${LITERAL} 字面`)
      assert.deepEqual(r.warnings, [], `${s}: 全槽在位（核包）`)
      prompts[s] = r.prompt
    }
    // 全 13 名取值在场（空串 = 显式「本端为空」⇒ 该处零字面，由上一断言覆盖）
    const faces = [...Object.values(prompts), ...builtinTools.map((t) => String(toOpenAISchema(t).function.description))]
    const union = faces.join("\n────────\n")
    for (const [name, value] of Object.entries(CLI_PROMPT_INJECTIONS)) {
      if (value === "") continue
      assert.ok(union.includes(value), `§2.13.2「CLI 列」取值在场：${name}`)
    }
    // 场景面特有形态（取值落点逐条——含括号 / 后缀边界：前缀重复类缺陷即红）
    assert.ok(prompts.engineering.includes("docs/README.md"), "engineering: 文档地图 docs/README.md")
    assert.ok(prompts.engineering.includes("(AGENT-LOOP.md §11.2 — R13)"), "engineering: 异步锚句指针（整条）")
    assert.ok(prompts.engineering.includes("## 改动面反查（文档影响面）"), "engineering: 改动面反查节")
    assert.ok(prompts.engineering.includes("review, AGENT-LOOP.md §18)"), "engineering: 交付链指针（整条）")
    assert.ok(prompts.normal.includes("(AGENT-LOOP.md §18 D-E1a)"), "normal: 顶层异步 spawn 指针（整条）")
    assert.ok(prompts.normal.includes("(like an async spawn; AGENT-LOOP §25)"), "normal: 飞刀指针（整条）")
    assert.ok(prompts.normal.includes("Ctrl+I interrupt does not"), "normal: 会诊终止口径")
    assert.ok(prompts["eng-coder"].includes("session (AGENT-LOOP.md §18)."), "eng-coder: 交付协议指针（整条）")
    assert.ok(!union.includes("AGENT-LOOPAGENT-LOOP"), "整条指针替换（前缀不重复）")
  } finally { resetPromptInjections() }
})

test("③ 配置态：工具描述面零锚字面（bash 无终极端行 / question Availability 恰一份）", () => {
  try {
    configurePromptInjections(CLI_PROMPT_INJECTIONS)
    const schemas = builtinTools.map(toOpenAISchema)
    for (const s of schemas) assert.ok(!String(s.function.description).includes(LITERAL), `${s.function.name}: 描述零锚字面`)
    const descOf = (name) => String(schemas.find((s) => s.function.name === name).function.description)
    assert.ok(!descOf("bash").includes('terminal: "visible"'), "bash: CLI 面无终极端参数行")
    const avail = descOf("question").match(/Availability/g) ?? []
    assert.equal(avail.length, 1, "question: Availability 行恰一份（替换非追加）")
    assert.ok(descOf("question").includes("headless runs, subagent children"), "question: CLI 措辞在场")
  } finally { resetPromptInjections() }
})

test("④ 未配置态：恒等（原文过——现行行为零变）", () => {
  resetPromptInjections()
  assert.ok(assemblePrompt("engineering").prompt.includes(LITERAL), "未配置 ⇒ 锚字面原样过（零替换）")
  assert.ok(builtinTools.map(toOpenAISchema).some((s) => String(s.function.description).includes(LITERAL)), "工具描述面同（未配置恒等）")
})
