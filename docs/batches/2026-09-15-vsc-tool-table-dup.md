# VSC 子代工具表重名（VSC-TOOL-TABLE-DUP）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 用户「另开一批。cli修」（2026-09-15 22:33）——针对 21:46 挂账缺陷修复后**暴露的同链第二处缺陷**。
> 六段骨架头常驻（各段 append 的锚点；段内无内容 = 该段尚未发生——不另加「待写」式占位文本）。
> **状态：设计轮待发 · 执行宿主 = CLI**（2026-09-15——**VSC 宿主 spawn 仍不可用**，本批设计轮与实施轮的 spawn 须在 CLI 宿主执行；§1 已备齐交接材料）。
>
> **导航（父侧维护）**：§1（裁定与讨论）= 本档 §1；§2 当前任务书 = 本档 §2（designer 追加面）。
> **条目指针（三方一致）**：本批 = 台账 `docs/TODO.md` 需求池「VSC 子代工具表重名」条——§2 条目 ↔ 设计档验收回指 ↔ 需求档条目须逐条对齐。
> **前置批次**（同链第一处缺陷，已收口）= `docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md`（台账条目 = `docs/TODO.md:41`）。
> 上游：台账 `docs/TODO.md` · 批次档模板与段作者表 = `docs/core/design/BATCH-RECORD.md`（D2——本档不重述）。

---

## §1 讨论（主 agent 记）

### 状态

**设计轮待发 · 执行宿主 = CLI（2026-09-15）**——父侧 5 批设计轮两度被 VSC 宿主 spawn 缺陷阻断：
第一处（`agent.tools` 未装配）已由用户修复（commit `9a0ec8e4`，其回归测试 4/4 绿），随即**暴露第二处**（本批）。
用户 22:33 裁定：**另开一批**（不续进已收口的前置批次）+ **修在 CLI 侧**——因 VSC 内无法自修（修复需 spawn 子代理，而 VSC 的 spawn 链正是坏的那条）。

### 用户裁定与澄清（2026-09-15）

| 时点 | 内容 |
|---|---|
| 21:46 | 用户「这个红要挂」= 第一处缺陷入台账需求池（`docs/TODO.md:41`） |
| 22:29 | 用户「我再cli那边把你刚才提的bug修复了，你再试试」→ 父侧复测：装配已通过，暴露出第二处 |
| 22:33 | 用户「**另开一批。cli修**」= ① 本缺陷单独建批（不并入前置批次）② 修复宿主 = CLI |

### 批次条目（本批 = 台账需求池一条；原文与证据以台账为准）

| # | 台账条目 | 症状 | 消解路径（台账所载） |
|---|---|---|---|
| 1 | `docs/TODO.md` 需求池「VSC 子代工具表重名 ⇒ provider 400」 | VSC 宿主内 spawn `eng-designer` / `eng-coder` 子代理 ⇒ provider 返回逐字 `400 Tool names must be unique.` ⇒ 子代理零落笔 | 见下「修法方向」——经设计轮裁决后单笔落地 + 机判断言 |

### 症状与演进（两轮对比——同时是第一处修复的验证面）

| 轮次 | 报错（逐字） | 含义 |
|---|---|---|
| 第 1 轮 | `agent.tools is not iterable` | 父对象无 `agent.tools` ⇒ 子代装配即崩（TypeError） |
| 第 2 轮（前置修复后） | `LLM API error 400: {"error":{"message":"Tool names must be unique."...}}` | **装配已通过** ⇒ 子代拿到工具表，但表内重名，被 provider 拒绝 |

两轮子代理均**零落笔**（5 个批次档的 mtime 与字节数同父侧写入逐字一致）。

### 根因（父侧机械实证——designer 不必重探）

**两端对 `agent.tools` 的语义不一致**：

| 端 | `agent.tools` 绑的是什么 | 坐标 |
|---|---|---|
| **CLI** | **基础集**（`baseTools + mcpTools`）——task / plan / timer 等留给核追加 | `thincoder-cli/src/cli/make-agent.mjs:111-117` |
| **VSC** | **已装配全表**（含 task / plan / timer / subagent / skill / goal / eng / verify / …） | `thincoder-vscode/src/agent/setup.mjs:351-378`（按 depth/role 算 `agentTools`）→ `:408-414`（拼 `tools`）→ **`:523` `agent.tools = tools`** |

而核的子代装配**会再追加一次**同名工具（`thincoder-core/agent/setup.mjs:293`）：

```
const tools = [...agent.tools, taskTool, planTool, timerTool, ...depthOnly]
```

⇒ 子代表 = 父表（**同一数组引用**，`thincoder-core/agent-tools/subagent-spawn.mjs:292`）+ 核追加的同名项。

**实测读数（父侧在真夹具实跑，2026-09-15）**：

```
parent.tools 数量 = 43
parent.tools 中已被核 :293 追加的名字 = task, plan, timer, subagent,
                                      recent_changes, read_history, advisor,
                                      verify, skill, goal, eng
child.tools  = 43 · 与 parent 同一数组引用 = true
装配后重名 = ["task×2", "plan×2", "timer×2"]
（复刻只含 batch_segment；实际另含 engChildSubagent，其 name 亦为 "subagent"
  —— 核 :255-262 ⇒ 实际重名集 = {task, plan, timer, subagent} 四个）
```

**为何父级自身不崩**：VSC 的父级 schema 由**它自己**算（`thincoder-vscode/src/agent/setup.mjs:503`），不经核 `:293` ⇒ 父表无重名。
**为何 CLI 不崩**：CLI 绑的是基础集 ⇒ 核追加后仍唯一。
**为何此前从未暴露**：VSC 侧 `agent.tools` 绑定在换核（W13）后即缺失（参见前置批次），这条 spawn 路从未真正跑通过。

### 为何现有回归测试全绿（盲区——设计要求处置）

前置批次的 `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（T1–T4）使用 **mock provider**，
而 mock **不校验工具名唯一性** ⇒ 该测试在真 provider 面前失效。**建议**：补一条**机判断言**
（子代 schema 名字集 `size === length`；拆掉修复行或拆掉去重 ⇒ 必红）。是否落在本批、落哪一层，由设计轮定。

### 修法方向（供设计轮裁决——父侧不代裁）

| # | 方向 | 说明 | 代价 / 风险 |
|---|---|---|---|
| A | VSC 把 `agent.tools` 绑成**基础集**（与 CLI 同语义），装配全表另存字段供自身 schema 用 | 契约对齐，根治 | 动 VSC 装配面（`:408` / `:523` + 全部用表处） |
| B | 核 `thincoder-core/agent/setup.mjs:293` **按名去重** | 单点、两端受益、防御性 | 改核共享语义 ⇒ 须证 CLI 行为零变 |
| C | spawn 侧（`subagent-spawn.mjs`）过滤掉核会追加的名字 | 局部止血 | 脆——核新增工具即再次错位 |

**父侧倾向 = A**（契约对齐优先；B 可作后续加固）——但 `agent.tools` 的语义归属（**基础集 ∥ 全表**）**属设计决策**，交设计轮与用户裁。

### 设计输入与已知事实（父侧已核——designer 不必重探）

1. **前置批次已收口**：`docs/batches/2026-09-15-vsc-agent-tools-spawn-fix.md`（§1–§6）——本批**不重开**它。
2. **宿主约束**：VSC 面板内**无法 spawn 子代理**（本缺陷自身即断点）⇒ 本批设计轮与实施轮的 spawn 必须发生在 **CLI 宿主**。
3. **分工口径**（改到哪模块 ⇒ 同步修该模块权威档）= 承 `docs/batches/2026-09-15-vsc-core-wiring.md` §1（三层分工）。
4. **迁移期档性**：权威文档层 = `docs/core/**` · `docs/cli/**` · `docs/vsc/**`；产品树 `docs/**` = 迁移期参照历史（保留 ≠ 维护，`docs/README.md:4`）⇒ 坐标按现状实核重锚。
5. 结构纪律：档 ≤300 行软线 / ≤500 硬限；`thincoder-core/agent/setup.mjs` 与 `thincoder-vscode/src/agent/setup.mjs` 两档均须给**行数增量与超线判断**。

### 批次边界（明确不做）

1. 不重开前置批次（`2026-09-15-vsc-agent-tools-spawn-fix`）——本批是**其后续**，不是其修订。
2. 不改 5 批（`docs/batches/2026-09-15-{core-defect-fixes,check-tooling-debt,eng-discipline-prompts,cli-async-discard,doc-contract-reconcile}.md`）的 §1——它们仍待设计轮启动。
3. 只修本缺陷；勘察若发现同链第三处 ⇒ **停下上报**（父侧另批），不自行扩批。
4. 不改台账 / 不改本档 §1。

---

## §2 批次任务（eng-designer）

**状态：任务书就绪（L1+L2 合并终态；评审轮次 1 = changes-required ⇒ 修正轮-1 已落修——11/11，见文末修正块）**（2026-09-15）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本）；契约逐字 / 函数形状 / 用例全文在下文各节（以修正轮-1 落修后文本为准）。本段 = 本席自写（含两轮 steer 后口径 + 评审落修）。

**依据与口径**：本档 §1（父侧）+ 两条 steer——① 原任务书七要点；② **用户 2026-09-15 22:46 裁定「可以，如果考虑了这个，那我觉得应该整合，不要两边各一份」** ⇒ 本批范围 = **L1（契约归一）+ L2（家族装配逻辑单源）合并**——产出终态 = 家族矩阵单源（核导出）+ VSC 改调核单源（两边各一份的矩阵消灭）；B（核内去重）= 加固候选/后续核内笔；C = 否决；L3（全装配入核）= 远期候选。
**本席复核** = 直读取证（零 explore 委派——勘察预算未用）：L1 修复面（`:408-414` / `:523`）· L2 面（核 `:173-293` / VSC `:345-405` / 登记册 / `package.json` exports / 死支消费者穷举 / 装饰面清单）· 测试面（`host-shape-spawn.test.mjs` / `mock-llm.mjs` / `scenario-02`）· 文档面（两档收正已落 + 机检实测）——全部逐点实核。

**任务项 ↔ 落点映射**：七要点 1→2.1/2.3 · 2→2.5 · 3→2.6 · 4→2.7 · 5→2.10 · 6→2.2 · 7→2.11；steer 六点 ①→2.3A · ②→2.3C · ③→2.1A · ④→2.4 · ⑤→2.5B · ⑥→2.8；评审 #37 11 点 ⇒ 修正轮-1（文末修正块——逐条落点）。

### 2.1 修复面总览（L1 + L2）

**A. L1 —— `agent.tools` 契约归一（VSC 绑基础集）**

| 项 | 内容 |
|---|---|
| 文件 | `thincoder-vscode/src/agent/setup.mjs`（现 683 行） |
| 落点 1 | `:408-414` 工具装配段：拆为「**基础集**「`baseSet`——`baseTools` + 多模态 `readImageTool` + `mcpTools` + `opts.extraTools`，即原数组中**除 `...agentTools` 外**的项」与「全表 `tools`（原样保留——含 `agentTools`，供端侧 schema/执行面 `:417` / `:503`）」 |
| 落点 2 | `:523` `agent.tools = tools` → `agent.tools = baseSet`（每轮重指语义保留——B 类绑定） |
| 契约 | 绑定值 = 不含端侧 meta 工具族（`agentTools`）的工具面——与 CLI 同语义（`thincoder-cli/src/cli/make-agent.mjs:111-117` 绑 `baseTools + mcpTools`）；核 `agent/setup.mjs:293` 追加 task/plan/timer 等 depth 家族由核负责——**不相交式 = 追加家族 ∥ 绑定值（基础集）**（防子代装配重名；端侧 meta 族与追加家族实测重叠 11 名——故其不得入绑定值）；**`opts.extraTools` 成员同受约束**（注入方义务——§2.3F） |
| 形态 | 最小 diff：保留现 `tools` 数组构造不动，新增 `baseSet` 数组（等价替代：抽 `mm` 局部变量消重——行为等价，coder 任选） |

**B. L2 —— 家族矩阵单源化（核侧导出 + VSC 改调）**

| 项 | 内容 |
|---|---|
| 新档 | `thincoder-core/agent/family-tools.mjs`（新——家族矩阵单源；核 `package.json` `exports: "./*"` 通配已覆盖，零 exports 改动） |
| 核改 | `thincoder-core/agent/setup.mjs`（现 355 行）：`:173` 登记册载入 · `:178-183` withPool · `:184-195` subagentRoles · `:196-216` filteredSubagent · `:218-263` engChildSubagent · `:275-292` depthOnly · `:293` 家族展开——**家族矩阵段整体迁出**至新档；`:293` 调用点改为「家族段 = 新档函数产物」的两段式（调用 + 展开——§2.3D 逐字；净增 ~5–7 行） |
| VSC 改 | `thincoder-vscode/src/agent/setup.mjs` `:351-405`：本地角色分支链**整体替换**为一次核调用 + 端装饰注入（§2.3C 逐字）；`:345-349` 登记册解构面**收窄**（仅留装饰所需实例）；死支删除（§2.4） |
| 契约 | 见 §2.3（函数形状 / 入参 / 返回 / 装饰口径 / 零行为变化论证） |

### 2.2 方案对比与裁定呈请（§4 用）

**整合层级对比（用户 22:46 裁定后的终态口径）**

| # | 层级 | 内容 | 判据评估 | 取舍 / 代价 | 结论 |
|---|---|---|---|---|---|
| L1 | 契约归一（本批必做） | VSC `agent.tools` 绑基础集 + 机判断言 | 修复重名根因；两端绑值语义归一 | 动 VSC 装配面 2 点 | **选定**（与 L2 合并落地） |
| L2 | 家族矩阵单源 | 核导出 `assembleFamilyTools`；VSC 改调 + 端装饰留端 | 消灭「同一角色矩阵两份实现」——本次缺陷的类根因；死支自然消除 | 核内一处笔（新档 + 调用点改调）+ VSC 改调；全回归证明零行为变化 | **选定**（用户裁定合并——本批落） |
| L3 | 全装配入核（端差面进缝） | VSC setup 装配段全迁核（时序 / 槽 / 注入 / prompt） | 边际收益低（L2 已消主要重复） | 端壳大幅改造 + 端差全缝化前置 | 远期候选（不排期——前置条件 = L2 完成 + 端差全缝化） |

**原 A/B/C 方向对照（并入本批口径）**

| # | 方向 | 说明 | 代价 / 风险 | 结论 |
|---|---|---|---|---|
| A | VSC 把 `agent.tools` 绑成基础集（+ 家族单源化） | 契约对齐 + 根治 + 矩阵单源 | 见 L1/L2 行 | **选定（= L1+L2 合并）** |
| B | 核 `agent/setup.mjs:293` 按名去重 | 单点防御、两端受益 | 改核共享语义须证 CLI 零变；**静默容忍端侧契约错误 = 掩盖缺陷**（与上批否决「核侧容错 `?? []`」同哲学） | **加固候选（后续核内笔）**——L2 后仍可选 |
| C | spawn 侧过滤核追加名字 | 局部止血 | 脆——核新增工具即再次错位 | **否决** |

**裁定呈请（呈 §4 用户批准）**：① **`agent.tools` 语义归属 = 基础集**（L1 契约——两端归一）；② **家族矩阵单源化 = 本批落地**（L2——核导出 + VSC 改调；端差装饰留端）；③ **子代可见面变化（知情项——随本批生效）**：只读子代工具面 `[task, recent_changes] → [task, plan, timer]`（失 `recent_changes`、得 `plan` / `timer`）；子代继承面随绑定值收窄（全表 → 基础集；族段由核追加补全）。备选 B 作为后续加固登记；C 否决；L3 远期。

### 2.3 L2 契约（核心设计——逐字）

**A. 核导出函数（新档 `thincoder-core/agent/family-tools.mjs`）**

```js
/**
 * assembleFamilyTools — 家族矩阵单源（CLI 与 VSC 共用）。
 * 给定运行面配置，返回该面应「追加」到工具表的家族工具数组
 * （task/plan/timer 固定段 + depth 家族段 + 工程子代理段）。
 * 端差经 `decorate` 注入（VSC：subagent 装饰链 / settings 追加 / consult 装饰）；
 * 不传 decorate ⇒ 核默认形态（CLI = 现状逐字）。
 */
export async function assembleFamilyTools({
  depth,                 // number   0 = 主 agent；>0 = 子代理
  role = null,           // string   子代理角色（eng-coder / eng-designer / coder / consult / explore / …）
  engineering = false,   // boolean  depth-0 role enum 注入用（工程模式）
  consultModels = [],    // array    consult 池（[] ⇒ consult 工具不注册）
  batchDoc = null,       // string   batchSegment 绑定路径（eng 角色）
  decorate = null,       // object   端差面：{ subagent?, consultStart?, consultStop?, settings? }
} = {}) { … }
```

- **返回** = 家族段数组（`[task, plan, timer, ...depth 家族/角色段]`）——**不含** `agent.tools` 展开与 `extraTools`（调用点各自展开）。
- **迁出语义**（核 `:173-293` 逐字迁入——含 withPool / subagentRoles / filteredSubagent / engChildSubagent / depthOnly 全部逻辑）：
  depth-0 家族 = `[filteredSubagent, skill, goal, eng, verify, recentChanges, readHistory, advisor, ...consultTools]`；
  eng-coder = `[advisor, verify, batchSegment, engChildSubagent]`；eng-designer = `[batchSegment, engChildSubagent]`；
  coder = `[verify, advisor]`；consult = `[recentChanges]`；else = `[]`；全部 + `[task, plan, timer]` 固定段。
- **decorate 语义（端差口径）**：`subagent`（缺省 = 核 filteredSubagent；VSC 传 `pool.length ? withPool(vscSubagentFace(subagentTool)) : vscSubagentFace(subagentTool)`
  ——pool 读 VSC `loadConsultPool()`）；`consultStart` / `consultStop`（缺省 = 核 withPool 装饰版；VSC 传其 withPool 版——保持文案零变化）；
  `settings`（缺省 = 无；VSC 传 `settingsTool`——depth-0 段追加——保持「depth-0 主 agent 面」现状）。**收敛通道**：将来去 decorate 项即收敛到核形态（渐进单源）。
- **依赖**：登记册**动态** `await import("../agent-tools.mjs")`（核 `:173` 现款同语义迁入）；W8 契约②安全面 = VSC 对该档一律**动态 import**（先例 `vscStatusTerminalEcho` 引核 async-settle）。

**B. 角色判定**（现行为保持）：`engChildRole` = `depth > 0 && role ∈ {eng-coder, eng-designer}` 时的 role（现值语义：核读 `agent._role`——迁出后取平参 `role`；**CLI 调用点传 `agent._role`、VSC 传其 `role` 形参**——两者同为 run 角色）。

**C. VSC 调用面（替换 `:351-405`）**

```js
const { subagentTool, consultStartTool, consultStopTool } = await import("@thincoder/core/agent-tools.mjs") // ← 解构面收窄（装饰所需实例）
const { assembleFamilyTools } = await import("@thincoder/core/agent/family-tools.mjs") // ← 动态（W8 契约②）
const pool = loadConsultPool()
const agentTools = await assembleFamilyTools({
  depth, role, engineering,
  consultModels: pool,
  batchDoc,
  decorate: {
    subagent: pool.length ? withPool(vscSubagentFace(subagentTool)) : vscSubagentFace(subagentTool),
    consultStart: pool.length ? withPool(consultStartTool) : consultStartTool,
    consultStop: consultStopTool,
    settings: settingsTool,
  },
})
```

（`withPool` / `vscSubagentFace` / `settingsTool` 均端侧既有——保留；`modeRoleField`（`:242`——顶层 schema `:503-516` 消费）**保留不动**；端侧 `toolSchemas` 组装与基础集/全表构造不动——仅 `agentTools` 的来源替换。）
**解构残留注（修正轮-1 #9）**：`taskTool` / `planTool`（`_t` / `_p`）自解构面删除——装饰面不需（§2.1B 收窄口径即终态；旧解构为草稿遗留——定案 = 删）。

**D. 核调用点（`:293` 改调）**

```js
const familyTools = await assembleFamilyTools({
  depth, role: agent._role ?? null,
  engineering: agent.config?.agent?.engineering === true,
  consultModels: agent.config?.agent?.consultModels ?? [],
  batchDoc: agent._batchDoc ?? null,
})
const tools = [...agent.tools, ...familyTools, ...(Array.isArray(extraTools) ? extraTools : [])]
```

**E. 零行为变化论证（逐分支核对）**：CLI 侧 = 迁出前后逐字同序（decorate 缺省 = 核默认）；VSC depth-0 家族名集 = 现状同集（顺序差：核序 + settings 末位——schema 数组顺序变化，零功能影响，如实登记）；VSC 侧**两处行为对齐**（非回归——目的本身）：① `explore`/只读子代家族面 `[task, recentChanges] → [task, plan, timer]`（核契约——`image-handler.mjs:84` 视觉子代理受益）；② 死支内差异随删除消解（§2.4）。

**F. `extraTools` 面（L1 契约补句 · 修正轮-1 · 评审 #5——可达性实证）**

- **核侧来源**：`runAgent` opts（`thincoder-core/agent.mjs:96` `extraTools = null` → `:129` 传入 prepareRun → `thincoder-core/agent/setup.mjs:42` → `:293` 展开）——depth 无关，**子代装配同受展开**。
- **端侧形态**：`opts.extraTools`（VSC `src/agent/setup.mjs:413`——原数组末位注入）；L1 后归入 baseSet ⇒ 经 `agent.tools` 随 spawn 父对象入子代装配。
- **关系判定 = 可达**（两端参数面连通——非「不可达」）；生产现状 = **零 producer**（全仓无 caller 传值——核侧仅 `test/advisor-consult-merge.test.mjs:126` 直驱；端侧仅注入位本体）⇒ 不构成当前缺陷链，但该成员的不相交未证 ⇒ 纳入 L1 契约。
- **L1 契约补句**：`extraTools` 注入方承担「与核追加家族（task/plan/timer + depth 家族名）不重名」义务（两端同规）——违反即子代装配重名（本次缺陷同形态）；核 `:293` 展开序不变（`agent.tools` → 家族 → `extraTools`）。

### 2.4 死支判定（steer ④——实核）

**VSC `hydrateRun` depth>0 分支消费者穷举**（证据 = 调用点全扫）：

| 分支 | 现坐标 | 消费者实核 | L2 后处置 |
|---|---|---|---|
| eng-coder | `:368-371` | **无生产消费者**——工程子代 spawn 走核 runAgent + 核 setup（上批缺陷链实证：子代装配展开 = 核 `agent/setup.mjs:293`；VSC 树无 `ctx.runAgent` 注入——`subagent-actions.mjs:415` 等 `ctx.runAgent ?? runAgent` 缝未被填充） | 删除（换核调用） |
| eng-designer | `:372-378` | 同上——**无** | 删除 |
| coder | `:383-384` | **无**——普通 spawn 走核链 | 删除 |
| else（read-only） | `:385` | **活**——`thincoder-vscode/src/extension/image-handler.mjs:84`（视觉渠道子代理 `depth: 1, role: "explore"` → VSC runAgent → VSC setup——唯一 depth>0 生产消费者） | 换核调用（行为对齐：`[task, recentChanges] → [task, plan, timer]`——§2.3E） |
| `engChildSubagentTool`（函数） | `:270-291` | **无**——唯一调用点 = 上述两个 eng 死支 | 删除（受限通道 = 核版 `:226-263`；VSC 场景不消费——零行为影响） |
| `engAuditSubagentTool`（VSC 档 §8 所载名——修正轮-1 前 `:382`） | 源内**查无此名**（grep 实核）——**旧名沿旧（同物）**：`091ebc49`（第 5 批 FR23）将 `src/agent/setup.mjs` 的 `engAuditSubagentTool()` 更名为 `engChildSubagentTool(childRole)`（双角色参数化）；文档名未随改（VSC 档 §8 + 同树 `TOOLS.md:115`） | **收正**（本席已落——修正轮-1）：§8 该 bullet 名称 / 状态收正（同物 = `engChildSubagentTool`——已退场，语义由核版承载）；`TOOLS.md:115` 同形面 = 写域外（父侧处置） |
| §14（a）受限变体 description 两行（VSC 档——修正轮-1 前 `:849-862`；`src/agent/setup.mjs:85` / `:86` 为 as-of 2026-09-11 坐标） | **同物**——逐字片段 = `engChildSubagentTool` `:287` / `:288` 两串（本席实核逐字相符；坐标已漂移 :85/:86 → :287/:288） | **收正**（本席已落——修正轮-1）：§14 加退场注（承载对象随死支删除；语义由核版承载） |

**L2 后全消确认**：VSC 不再持有角色分支链（`:368-385` 整段消失）；活面保留 = depth-0 家族（经核调用）· `:405-420`（baseTools / baseSet / tools / `:417` toolByName）·
`:503-516`（modeRoleField schema 装配）· `:523` 绑定。
**L2 的自然边界**（答「哪段值得归、哪段必须留端」）：**归核** = 家族矩阵决策（哪个角色得哪些工具）+ 固定段 + 装饰缺省；
**留端** = 工具实例的端差装饰（`vscSubagentFace` 装饰链 / settings 追加 / consult 池来源 `loadConsultPool`）+ 端侧 schema 组装（modeRoleField）+ 基础集组装（readImage 条件 / mcp 展开 / extraTools——端差值）。

### 2.5 回归面（硬项——断言 A/B + 反证）

**断言 A（L1——工具名唯一性）**：子代真跑后，mock 收到的**本测试新增的每个请求** `body.tools` 名数组满足 `names.length === new Set(names).size`。（断言范围 = 新增请求——`llm.requests.slice(起点)`——父级 hydrateRun 不触达 provider。）
**断言 B（L2——矩阵同源）**：(a) VSC 生产装配产出的**家族段名集**（全表 `toolByName` − 基础集名集）与 (b) 直接调用 `assembleFamilyTools`（同参）的名集**逐名相等**；另加 (c) **fixture 名集**（**必备 5 角色**——depth-0 默认 / eng-designer / eng-coder / coder / explore，每角色内置期望清单；
**depth-0 例期望集 = 改前基线实读**——实施首步捕获，见下行与 ⓪）——(a)≡(b) 防「VSC 绕过核函数」，(a)≡(c) 使「**改核矩阵**」在端侧可见（⑤ 反证面；depth-0 例兼封评审 #6「自证其说」口）。
**mock-llm 重名校验（默认启用）**：请求级检查 `body.tools` 重名 → 400 `{"error":{"message":"Tool names must be unique."}}`（贴真 provider——用户报错路径逐字复现面）；开关 `mockLLM(script, { validateToolNames = true })` 保留（显式 `false` 可关）。代价：共享夹具改动 ⇒ 全集成集复跑（纳 AC）。
**覆盖角色**：eng-designer（用户实测）+ coder（端侧基础例）为主断言例；断言 B 角色面 = 上列 **5 角色必备清单**（旧「至少三例」下限表述退役——以单清单为准）。
**反证（判据落 §5 复跑链——原样读数 + 实验后恢复现场）**：⓪ **改前基线（先于一切生产改动）**：VSC depth-0 家族名集原样读数落 §5（= 断言 B (c) depth-0 例期望集；改后 (a)≡(c) 即改前≡改后逐名对照——差异仅本批已登记项）；
① **L1 反证**：临时把 `:523` 改回 `agent.tools = tools` ⇒ T5 红（断言 A 红 + mock 400 红——`Tool names must be unique.` 逐字复现）＋ scenario-02 红（eng-coder 链同爆）；恢复 ⇒ 全绿。
② **L2 反证**：临时在核矩阵加一项（或删一项）⇒ 端侧 fixture 断言 (c) 红（核单测同红）；恢复 ⇒ 全绿。③ §5 记录命令与输出行原样（含实验后恢复的复跑绿）。

### 2.6 测试面 / 夹具评估

| # | 面 | 处置 | 依据 |
|---|---|---|---|
| 1 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（现 125 行） | **并入**——新增 T5（eng-designer 行为例：真跑 + 断言 A/B）+ T4 加强（coder 真跑追加断言 A）；选择理由 = 驱动面同源（生产宿主形状 + 真核 spawn 链 + mock 真跑——夹具零重复） | 同类即合（测试纪律） |
| 2 | `thincoder-vscode/test/integration/helpers/mock-llm.mjs`（现 87 行） | 加重名校验（默认启用 + 开关） | 贴真 provider；本缺陷的根教训 = mock 与真 provider 行为分离 |
| 3 | `thincoder-vscode/test/integration/scenario-02-eng-chain.test.mjs` | **零改动**——已生产形状（上批转换）；修复后过；**修复前（+校验默认开）自动红** = 天然反证面 | 自动守卫 |
| 4 | `thincoder-vscode/test/integration/files.mjs` | **零改动**（无新档——并入） | — |
| 5 | `thincoder-core/test/family-tools.test.mjs` | **新档**（纯函数矩阵断言：5 角色 × 期望名集 fixture + decorate 缺省/注入两面）——「改核矩阵 ⇒ 红」的最早失败面 | 核内笔从属面（§2.11 边界认定） |
| 6 | 快层（`npm test`） | 不另开——结构断言在集成档已覆盖绑定面；与本缺陷根因链（核 spawn 装配）跨层，快层收益 = 早失败、代价 = 双面维护（回潮防护判据「拆修复行 ⇒ 至少一面红」已由集成档满足） | 上批评审 #8 遗留项的处置结论 |

### 2.7 验收判据（可机器验证——逐命令一行）

| # | 判据 | 命令 | 期望读数 | 回指 |
|---|---|---|---|---|
| AC1 | 新断言绿（断言 A/B）+ 集成读数 | `npm run test:integration`（cwd = thincoder-vscode） | 33/33/0 → **34/34/0**（T5 +1；T4 加强不改例数） | 任务项 2 / steer ⑤ |
| AC2 | 反证红面 | §5 原样记录（§2.5 反证 ①②） | 拆修复行 ⇒ 红；恢复 ⇒ 绿 | 任务项 2 |
| AC3 | VSC 五命令零回归 | `npm test` → 553/518/0/35 ／ `npm run lint` → 193 JS OK ／ `npm run test:full` → 553/553/0 ／ `npm run test:integration` → 34/34/0 ／ `npm run doc:check` → 0 命中 | 见左 | 任务项 4 |
| AC4 | 核回归 | `node --test`（cwd = thincoder-core） | 178/178/0 → **178+N / 178+N / 0**（N = family-tools 单测例数） | 任务项 4 |
| AC5 | 三闸（精确口径——见右注） | ① `node scripts/check-doc-width.mjs` → 411 文件 0 超 + 新增 0；② `node scripts/check-ledger.mjs` → 0 违规；③ `node scripts/doc-anchors.mjs --root . --domain thincoder-vscode --strict` → 0 命中；④ 仓根域读数（全量跑段 1）→ OK 0 悬空 | 见左 | 任务项 4 |
| AC6 | 矩阵同源机判 | 断言 B 三件套（a≡b / a≡c——depth-0 例携改前基线锚）绿 | 见左 | steer ⑤ / 评审 #6 |
| AC7 | 文档收正在位 | §2.9 两档已落（设计者）+ §5 提交含之 | 见左 | 任务项 4 |
| AC8 | 边界 | §2.11（核仅家族单源一处笔；CLI / 台账 / 他段零触碰；单笔提交） | 见左 | 任务项 7 |

> **AC5 口径注（实核基线）**：无参数全量 `node scripts/doc-anchors.mjs` 现况 exit 1——**唯一成因 = thincoder-cli 域存量悬空 37 条**（参照历史树引用已删文件，如 `src/compact.mjs`——本席实核该文件不在；本批开工前基线恒 37、修后恒 37、**非本批引入**、涉及档未被本席触碰）。**本批相关域全部 0**（实测：段 1 仓根域 0 · VSC 域 strict 0 · 宽度 0 · 台账 0）。CLI 域存量处置 = 父侧另议（§2.10 发现项）。

### 2.8 受影响文件表（R24a——行数 ≥ 现读数 + 预计增量）

| # | 文件（cwd = 仓根） | 现值 | 预计增量 | 动作 |
|---|---|---|---|---|
| 1 | `thincoder-core/agent/family-tools.mjs` | 新 | ~+120–160 | 家族矩阵单源（新档——含迁出全部逻辑） |
| 2 | `thincoder-core/agent/setup.mjs` | 355 | **≈ −100（净；区间 −95～−110）** | 家族段迁出（枚举实核 **105 行** = `:173` 1 + `:178-183` 6 + `:184-195` 12 + `:196-216` 21 + `:218-263` 46 + `:275-292` 18 + `:293` 1；附随注释 / consult 装配段 ~10 行随迁）+ `:293` 调用点改调（1 行 → 调用 + 展开 ~8 行——净 +5～+7）⇒ **迁后 ≈ 245–260**；**≤300 软线 ✓**（修正轮-1 按枚举重算收正——原「~305–320 越软线」系按「仅迁家族展开」误算）；≤500 硬限 ✓ |
| 3 | `thincoder-vscode/src/agent/setup.mjs` | 683 | −50～−80（净） | L1 拆分 + L2 改调 + 死支删除（~14 行分支链 + ~22 行 `engChildSubagentTool` + 装配段替换）。**体量登记（刷新——2026-09-08「500 行边缘」旧注已被取代）**：现值 **683**（本席实测）；>500 硬限 = 存量越线；台账结构债行 = `docs/TODO.md:54`（读数 681 as-of W15——刷新归父侧）；本批净减后 ≈603–633 仍越线。**拆分计划（显式——本批不做拆分升级）**：切法 = 装配面（工具装配 / schema 组装 / run 绑定段）外提姊妹档——判据 = R24a（组内同面 / 切点零交叉 / 各档 ≤500）；执行时点 = 结构减债轮（承接台账行消解路径） |
| 4 | `thincoder-core/test/family-tools.test.mjs` | 新 | ~+80–120 | 矩阵 fixture 单测（新档） |
| 5 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | 125 | +60～+100 | T5 + T4 加强 + 断言 helper |
| 6 | `thincoder-vscode/test/integration/helpers/mock-llm.mjs` | 87 | +8～+14 | 重名校验（默认启用 + 开关） |
| 7 | `thincoder-vscode/docs/design/AGENT-LOOP.md` | 1573（HEAD） | **已落**（本批合计 **+8**——现文 **1581**；设计轮 +2 / 修正轮-1 +6） | §11.2 B 行 · 变更记录 · §1 模块地图 · §8 受限 spawn 条 · §14 退场注（本席——§2.9 + 修正块） |
| 8 | `docs/core/design/AGENT-LOOP.md` | 502（HEAD） | **已落**（本批合计 **+4**——现文 **506**；设计轮 +2 / 修正轮-1 +2） | §6.18 行 · 变更记录 · §6.1 模块地图（新档行 + 职责句）（本席——§2.9 + 修正块） |

### 2.9 文档收正（已落——本席；实施笔零重复触碰）

| # | 落点 | 内容 | 机检实测 |
|---|---|---|---|
| 1 | `thincoder-vscode/docs/design/AGENT-LOOP.md:41-43`（变更记录——修正轮-1 后） | L1 + L2 同题条目（基础集语义 / 家族单源化；批次档指针 = `docs/batches/2026-09-15-vsc-tool-table-dup.md`（根仓））+ 修正轮-1 落修行 | 宽度 ≤300 ✓；VSC 域 A3 = 0 ✓ |
| 2 | 同档 §11.2 B 类绑定清单（修正轮-1 后实文 `:467-468`——原 `:465`/`:466` 坐标随两轮编辑漂移，以节定位为准） | `tools` 绑定值 = 基础集 + 核追加由核负责 + 家族单源化句（`agent/setup.mjs:293`（核仓）= E3 合规形态；修正轮-1：不相交式收正） | 同上 ✓ |
| 3 | `docs/core/design/AGENT-LOOP.md:395`（§6.18 #83 行——修正轮-1 后） | 绑定值收正 + 家族矩阵单源化句 + 不相交式收正 | 仓根域 0 悬空 ✓（V5-C 窄三要素已规避——行内无「导出」类谓词） |
| 4 | 同档 `:503-505`（变更记录——修正轮-1 后） | 同题条目（含家族单源化 + 修正轮-1 落修行） | 宽度 ✓（310 → 折行后 ≤300） |

**修正轮-1 增补（评审 #37）**：VSC 档 §1 模块地图行（`:77`）· §8 受限 spawn 条（`:383-387`）· §14 退场注（`:851-853`）；核档 §6.1 模块地图（`:166-167`——新档行 + 职责句）。落点与说明逐条见文末修正块；§2.8 行 7/8 增量读数已随收。

**合规形态记录**（本席实修实测——供后续批次复用）：跨仓引用在 VSC 域 = `路径（核仓）` **E3 形态**（「仓」须紧贴「）」——`（核仓）` ✓ / `（仓根）` ✗）；v5 域 = `thincoder-core/…` 全前缀可解析；**V5-C 窄三要素**（反引号标识符 + 「导出/定义于/生成点」类谓词 + 同行唯一坐标）——谓词行内会出现「该行全部反引号标识符须在 host 档在册」的连带判定（本次踩坑与规避实证）。

### 2.10 旁路面与发现登记（不扩批——如实上报）

1. **settings 归属端差**（VSC depth-0 家族 ∥ CLI 基础集）：L2 经 `decorate.settings` 承载——**收敛通道** = 去 decorate 项即归核位；**是否随批收敛 = 父侧/用户裁**（不进本批实现面）。
2. **question 面**：VSC 子代工具面含 `question`（修复前后同态——均来自父 run 的 depth-0 `baseTools`；`questionTool.readonly = true` ⇒ explore 只读过滤亦不排除）；
  与 CLI 同态（核 `assembleBuiltinTools` 含 questionTool）；**VSC 旧注释 `setup.mjs:403-405`「question excluded from ALL subagents」在换核后不再由装配层承载——注释与现状不一致**（更新与否 = 父侧裁）。
  子代 ctx `onQuestion` 可达性未追踪（`wrapChildCallbacks` 于核 `spawn-child.mjs:131`——VSC 是否触达 onQuestion 面未实核——复核归父侧）。
3. **`_syncChildAborts` / `_permQueue`**（核 `subagent-spawn.mjs:318/:322` 读写）：VSC 树无初始化点（grep 零命中）——读侧可选链兜底 / `enqueueAsk` 自建形态待核——**候选登记**（未发现生产症状）。
4. **CLI 域存量悬空 37 条**（thincoder-cli 参照历史树——§2.7 口径注）：非本批；处置归父侧。
5. **CLI 侧 mock-llm 无重名校验**（`thincoder-cli/test/helpers/mock-llm.mjs`）：本批不动 CLI——后续候选（同步启用则获同守卫）。
6. **VSC `engChildSubagentTool`（`:270-291`）与核版（`:226-263`）两份实现微差**（VSC 删 action prop ∥ 核显式 `action enum:['spawn']`）：随死支删除以核版为准——零行为影响。
7. **`assembleFamilyTools` 的 exports 面**：核 `package.json` `"./*": "./*"` 通配已覆盖新档——零改动（实核）。
8. **VSC 档 `TOOLS.md:115` 同形面**（`engAuditSubagentTool` 旧名——与 §8 同族，修正轮-1 发现）：写域外——收正归父侧（本席未动）。
9. **台账 `docs/TODO.md:54` 读数刷新**（681 as-of W15 → 现态 683）：本席勿动台账——归父侧。

### 2.11 边界与交付链

- **改动面** = 核内**一处笔**（家族单源：新档 + `agent/setup.mjs` 调用点改调 + 单测——用户裁定扩面，其余核内面零触碰）+ VSC 生产改动（L1 拆分 + L2 改调 + 死支删除）+ 测试面（集成 + 夹具 + 核单测）+ 文档面 2 档（已落）。
- **零触碰**：登记册各工具实现 · `subagent-spawn` / spawn-child 链 · `thincoder-cli/**` · 台账 `docs/TODO.md` · 本档 §1 / §3–§6 · `scenario-02` / `files.mjs`（评估零改）。
- **单笔提交**：含本批全部改动（生产 + 测试 + 两权威档——后者为设计者已落内容）；批次档本体不入笔（父侧统一）；回退点 = 单笔 revert。
- **施工者写入手段** = `batch_segment({ segment, text })`（无路径参数，段号由身份定）；**兜底** = 实核发现 L2 装饰面有漏（如某角色矩阵不可表达/引用不等价）⇒ **停下上抛**，不自行扩面。
- **UI/交互** = 无面（装配层——webview / 交互 / 面板零触碰）。
- **评审就绪自检（A3）**：① 修复点精确到 file:line ✓（L1 两落点 / L2 两档 + 新档）② 受影响文件 + 行数标注（R24a）✓ ③ 验收逐条回指（AC 表）✓ ④ UI/交互无面声明 ✓ ⑤ 方案对比（L1/L2/L3 + A/B/C 含否决理由）✓

### 修正轮-1（评审 #37 落修——11/11 · eng-designer 记 · 2026-09-15）

**依据** = 本档 §3（评审轮次 1——1🔴 / 6🟡 / 4🔵）+ 父侧裁决（全数落修，无一 Deferred）。
**形态** = §2 就地修订（下文落点即现文）+ 本块追加（审计记录——段作者本席）。
**写域** = 本档 §2 · `thincoder-vscode/docs/design/AGENT-LOOP.md` · `docs/core/design/AGENT-LOOP.md`；实现代码 / 台账 / 本档 §1 / §3–§6 零触碰；`CORE-UNIFICATION.md` 零触碰（#3 不需要）。

**逐条落点（修正后坐标——本档 §2 现文 + 两设计档实文）**

| # | 落点（file:line——修正后） | 修正说明 |
|---|---|---|
| 🔴1 | 本档 §2.1 契约行（`:132`）+ VSC 档 `:41` / `:467-468` + 核档 `:395` / `:503`（落点五） | 不相交式收正——「追加家族与端侧 meta 族不重叠」→「**追加家族 ∥ 绑定值（基础集）**」（端侧 meta 族与追加家族实测重叠 11 名——故其不得入绑定值）；只改措辞，代码方向不变；两档变更记录同步收正 |
| 🟡2 | 本档 §2.8 行 2（`:302`） | 核 `agent/setup.mjs` 增量按枚举重算：迁出 105 行（逐段实核）+ 附随 ~10 行；调用点净 +5～+7 ⇒ 迁后 ≈245–260（非 305–320）；**≤300 软线判断反转收正**（不越线）；§2.1 核改行「两行式」→「两段式」（同源收正） |
| 🟡3 | 核档 `:166-167`（§6.1）+ VSC 档 `:77`（§1） | 核 §6.1 补新档行（`family-tools.mjs`——裸 basename + 落位注）+ `agent/setup.mjs` 职责句改「改调家族单源」；VSC §1 同格改「装配改调核单源 + 端差装饰」 |
| 🟡4 | 本档 §2.4 穷举表 +2 行（`:252-253`）+ VSC 档 `:383-387` / `:851-853` | 两面判定 = **同物**：① `engAuditSubagentTool` = 旧名（`091ebc49` 第 5 批 FR23 更名为 `engChildSubagentTool`——git 溯源 + grep 实核）——§8 bullet 名称 / 状态收正；② §14(a) description 两行 = 该函数 `:287` / `:288` 逐字片段——§14 加退场注；`TOOLS.md:115` 同形面 = 写域外（父侧处置） |
| 🟡5 | 本档 §2.1 契约行 + §2.3F（`:234-239`——新块） | `extraTools` 面：核侧来源 = `runAgent` opts（`agent.mjs:96` → `:129` → `setup.mjs:42` → `:293`，depth 无关）；端侧 = `opts.extraTools`（VSC `setup.mjs:413`）——**可达**（非「不可达」）；生产零 producer；L1 契约补句 = 注入方不重名义务 |
| 🟡6 | 本档 §2.5（`:263-264` / `:267-269`）+ §2.7 AC6（`:291`） | 改前 depth-0 名集基线：实施首步实读落 §5 → 固化进 fixture (c) depth-0 例（(a)≡(c) 兼封「自证其说」口） |
| 🟡7 | 本档 §2.8 行 3（`:303`） | VSC `setup.mjs` 体量登记刷新（现值 683——2026-09-08「边缘」旧注取代）+ 显式拆分计划（切法 / 判据 / 执行时点）+ 指向台账 `docs/TODO.md:54` |
| 🔵8 | 本档 §2.5（`:263` / `:266`） | fixture 口径定案 = **必备 5 角色**（depth-0 默认 / eng-designer / eng-coder / coder / explore；「至少三例」下限退役） |
| 🔵9 | 本档 §2.3C（`:201` 代码 + `:218` 注） | 解构残留定案 = **删**（`taskTool: _t, planTool: _p`——装饰面不需）；注一行 |
| 🔵10 | 本档 §2.9 行 2（`:312`） | 坐标收正：`:465` → 实文（修正轮-1 后 `:467-468`——以节定位为准；行号随两轮编辑漂移已在表内注明） |
| 🔵11 | 本档 §2.2 呈请 ③（`:162`） | 点名子代可见面变化（只读子代 `[task, recent_changes] → [task, plan, timer]`——失 `recent_changes` 得 `plan` / `timer`；继承面收窄）供 §4 知情 |

**三闸 + doc:check 读数（修正后复跑——全绿；读数落盘 `.thincoder/tmp/dup1-*.log` + 终态复跑 `dup1b-*`〔width / ledger / VSC strict / root 四闸同读数〕）**

| 闸 | 命令 | 读数（修正后） |
|---|---|---|
| 宽度 + 一致性 | `node scripts/check-doc-width.mjs`（仓根） | `OK(宽度)：411 文件 0 超`；一致性 V1/V2/V3 新增 0 / 存量 0；exit 0（`.thincoder/tmp/dup1-width.log`） |
| 台账 | `node scripts/check-ledger.mjs` | 两档 OK · **0 处违规**（基线 0）；exit 0（`.thincoder/tmp/dup1-ledger.log`） |
| VSC 锚（strict） | `node scripts/doc-anchors.mjs --root . --domain thincoder-vscode --strict` | **命中 0 处**（A1/A2/A3 全 0）；exit 0（`.thincoder/tmp/dup1-vsc-strict.log`） |
| 仓根域（v5 闸态） | `node scripts/doc-anchors.mjs --root . --domain .` | 125 档 · **悬空 0** · 注记豁免 872；候选 8399（较基线 +4）；`OK(V5)` exit 0（`.thincoder/tmp/dup1-root-v5.log`） |
| 全量（四域） | `node scripts/doc-anchors.mjs --root .` | 段 1 仓根域 0 悬空 ✓ · 段 2 `thincoder-cli` 域 **37 悬空 = 存量基线**（§2.7 口径注所载「开工前恒 37」——非本批；涉及档未被本席触碰）· 段 3 VSC 域 报告态 0 命中；整体 exit 1 唯一成因 = CLI 存量（`.thincoder/tmp/dup1-full.log`） |
| VSC doc:check | `npm run doc:check`（cwd = thincoder-vscode） | 命中 0 处；exit 0（`.thincoder/tmp/dup1-doccheck.log`） |

**边界与写域记录（如实登记）**：① 实现代码 / 台账 / 本档 §1 / §3–§6 零触碰；② VSC 档 `TOOLS.md:115` 同形面（旧名 `engAuditSubagentTool`）= 写域外——收正归父侧；③ 台账 `docs/TODO.md:54` 读数刷新（681 as-of W15 → 现态 683）归父侧（本席勿动台账）；
④ 新档行取「裸 basename + 落位注」形态——依据 = 仓内既例（`CORE-UNIFICATION.md` §2.8.1 新档行）+ V5-A 实测（全路径 token 在文件未建时 = 悬空，实测复现）；
⑤ 设计档两档本批净增合计：VSC +8（1573→1581）· 核 +4（502→506）；⑥ 全量闸 exit 1 = CLI 域存量 37（先于本批）——非本批引入。

### 批末文档收正轮（实施后坐标实读——eng-designer 记 · 2026-09-15）

**依据** = 实施笔 `cc908b7d` 落地现态（逐点 read 实读，非报告转述）+ §5「越表披露」与落点表行 7 + 父侧批末收正派单。
**写域记录** = 本段追加（本档 §2）+ 三档设计档坐标收正；实现面 / 台账 / 本档 §1 / §3–§6 零触碰；内容 = 坐标 / 状态行 / as-of 注（机制条文零改）。

**§2.8 表补正（越表档回填——增量取自 `git show --numstat cc908b7d` 实测；现值 = 2026-09-15 实读）**

| # | 文件（cwd = 仓根） | 现值 | 增量（实测） | 动作（§5 披露原样） |
|---|---|---|---|---|
| 9 | `thincoder-core/test/tool-registry.test.mjs` | 105 | +20/−7 | #83 结构机检：消费点迁指 `agent/family-tools.mjs` + setup.mjs 经单源档断言（迁移本体——不移即红，核 `node --test` 178/177/1 实测） |
| 10 | `thincoder-vscode/test/agent-tools-registry.test.mjs` | 68 | +16/−5 | W9③ 解构面恰 14 名 → 装饰实例三名 + 家族段经核单源断言（§2.3C 解构收窄——不移即红，快层 553/516/2 实测） |
| 11 | `thincoder-vscode/test/eng-designer-role.test.mjs` | 195 | +5/−2 | T57 受限变体 `!("action" in props)` → `action.enum === ["spawn"]`（§2.10.6 微差收正——随死支删除以核版为准） |
| 12 | `thincoder-vscode/docs/design/TOOLS.md` | 389 | +14/−8 | 角色分派块收正（旧名沿旧面 + role 列表按单源化后事实收正——§5 落点表行 7） |

> 行数口径：测试档 = `wc -l`；`TOOLS.md` = 末行号（与 §2.8 既有文档读数同法）。越表结构 = 测试机检 3 档 + 文档 1 档——均已在 §5「越表披露」三点 / 落点表行 7 披露；本表 = 回填，非新改动。

**批末收正注（本轮收正清单——坐标 = 实施后实读值）**

| # | 档 | 收正项（before → after） |
|---|---|---|
| 1 | `docs/core/design/AGENT-LOOP.md` | §6.18 #83 行（`:395`）与变更记录（`:503`）：`thincoder-core/agent/setup.mjs:293` → 家族单源 `thincoder-core/agent/family-tools.mjs` + 核调用点 `thincoder-core/agent/setup.mjs:175-182` |
| 2 | `thincoder-vscode/docs/design/AGENT-LOOP.md` | 变更记录（`:41-42`）与 §11.2 B（`:470-472`）：`agent/setup.mjs:293`（核仓）→ 家族段单源 `thincoder-core/agent/family-tools.mjs`（核仓）+ 核调用点 `thincoder-core/agent/setup.mjs:175-182`（核仓）；§14 退场注（`:857`）：`thincoder-core/agent/setup.mjs:226-263` → `thincoder-core/agent/family-tools.mjs:83-121`（核仓）；§8 受限 spawn 条（`:388-390`）补 as-of 注（核版承载形态 = `action` 保留 · `enum: ["spawn"]`；端侧旧「action 参数整体移除」= as-of 2026-09-11 形态） |
| 3 | `docs/core/design/CORE-UNIFICATION.md` | §2.8.1 在册超软线档拆分计划行 7（`:1117`）：**354 → 246**（实读）+ 已兑现注（家族 / 装配段外提 = `thincoder-core/agent/family-tools.mjs` 单源）+ 指针（本档 §2 / §5）；行未删（结构债账目闭环）；**转述纠偏：该表所属节 = §2.8.1（非派单所载 §2.7——以现档为准）** |

**实读坐标存档**：核 `agent/setup.mjs` = 246 行（家族调用 `:175-180` · 展开 `:182`）；核 `agent/family-tools.mjs` = 159 行（受限变体段 `:83-121`；`action` 钉位 `:107-111`）；VSC 档收正后 **1585** 行（+4——与 §2.9 现文读数同口径）。

**闸读数（文档收正后复跑——四闸 exit 0）**：宽度 412 档 0 超 + 一致性 V1/V2/V3 新增 0；台账 0 违规（基线 0）；根域锚（`--domain .`）125 档 · 悬空 0 · 注记豁免 872（候选 8420——较 §2.9 读数 8399 的差额含本席 +4 与在飞他处改动）；VSC 域 `doc:check`（strict）命中 0 处（A1/A2/A3 全 0）。

### 批末文档收正轮-2（残簇坐标 · 范围扩一条）——eng-designer 记 · 2026-09-15

**依据** = 实施笔 `cc908b7d` 现码实读（核 `agent/setup.mjs` 246 行——装配调用 `:175-182` · `tools` 展开 `:182` · `toolSchemas` 物化 `:183` · 场景映射调用 `:199-205`〔外层谓词 `:202` / 内层选择器 `:203`〕；家族段实体 = `thincoder-core/agent/family-tools.mjs` 159 行）
  + 收正轮-1 报告范围外发现两簇 + 父侧追加派单（embedding 修复批 `9e4bd132` 审计：本档 U8 表 `:803-806` 读数仍为旧值）。
**写域** = 三档坐标收正（`docs/core/design/CORE-UNIFICATION.md` · `thincoder-cli/docs/design/ACP-CLIENT.md` · `thincoder-cli/docs/design/ENGINEERING-MODE.md`）；机制条文零改；实现面 / 台账 / 本档 §1 / §3–§6 零触碰。
**形态（择一 = 改述为现读实体）** = 全部落点改写为现读坐标；读数类按批内既例附 `（2026-09-15 实读——原 N）` 尾注。

**收正清单（7 行 = 10 处替换；坐标 = 收正后实读值）**

| # | 档:落点 | before → after |
|---|---|---|
| 1 | CORE-UNIFICATION §2.13.6 缺口 5② | `thincoder-core/agent/setup.mjs:293-294` → `:182-183` |
| 2 | CORE-UNIFICATION §2.13.8（二）行 3 | `agent/setup.mjs:294` → `:183`（同行 `advisor/loop.mjs:46` 复核仍有效——零改） |
| 3 | CORE-UNIFICATION U8 表（`:803-806` 三行——范围扩） | `415 / 299 / 419` → `416 / 300 / 420`（各附「2026-09-15 实读——原 N」尾注；`thincoder-core/memory/{code-sync,core,docs}.mjs` `wc -l` 自核实读；`thincoder-cli/src/memory/` 已不存在——现居核仓） |
| 4 | ACP-CLIENT §12.1 问题陈述 | `thincoder-core/agent/setup.mjs:293-294` → `:182-183` |
| 5 | ENGINEERING-MODE §2.15 B 表行 | `thincoder-core/agent/setup.mjs:295-301` → `:199-205`；`（`:299`）` → `（`:203`）` |
| 6 | ENGINEERING-MODE §2.27.2 登记集行 2 | `现 :307–313 / :310–312` → `现 :199–205 / :202–204`（原句「现」保留） |
| 7 | ENGINEERING-MODE §3.1 AC17 | `盖 thincoder-core/agent/setup.mjs:299 内层选择器` → `:203` |

**兜底核位（如实）**：7 簇逐条实读——均确系「迁出/失序」（无「本就未指向被迁面」项——无豁免不改项）；邻位坐标 `agent.mjs:125`（`prepareRun` 调用点）· `advisor/loop.mjs:46`（`toOpenAISchema` 调用）· `tools/shared.mjs:18`（`DESC`）复核仍有效（零改）。

**四闸复跑（收正后——全绿；与轮-1 终态读数一致）**

| 闸 | 命令（cwd） | 读数 |
|---|---|---|
| 宽度 | `node scripts/check-doc-width.mjs`（仓根） | `OK(宽度)：412 文件 0 超`；V1/V2/V3 新增 0 · 存量 0；exit 0 |
| 台账 | `node scripts/check-ledger.mjs`（仓根） | 两档 OK · 0 处违规（基线 0）；exit 0 |
| 根域锚 | `node scripts/doc-anchors.mjs --root . --domain .`（仓根） | 125 档 · 悬空 0 · 注记豁免 872 · 候选 8420；`OK(V5)`；exit 0 |
| VSC doc:check | `npm run doc:check`（thincoder-vscode） | 命中 0 处（A1/A2/A3 全 0）· 阻断态；exit 0 |

**同族残留登记（只登记不扩面；坐标 = 实读）**

1. `CORE-UNIFICATION.md:42`（B16 行）· `:1049`（§2.8 行）：同组读数中 `docs` 419 / `code-sync` 415 / `core` 299 三值仍为旧读数（现值 420/416/300；同组其余五值 `schema` 452 / `delete` 236 / `code-index` 219 / `file-walk` 109 / `scan` 95 经核位均为现值）——与 `:803-806` 同族；本轮未覆盖（派单仅列 `:803-806`）。
2. `CORE-UNIFICATION.md:893`（U15 表 `src/agent/setup.mjs` 354）：计数快照 as-of 性质（历史批记录）——未列入本轮修正面（留档不溯改）。
3. `ENGINEERING-MODE.md` 核 `agent/setup.mjs` 迁出前坐标残留（§2.x 历史批段）：`:306`（`:187`/`:189`——现居 `family-tools.mjs:43`/`:45`）· `:422`（`:224-257`——现居 `family-tools.mjs:83-121`）·
   `:423`（`:277`——现居 `family-tools.mjs:132-138`）· `:434`/`:436`/`:439`（`:253`/`:259`/`:260`——现居 `family-tools.mjs:107-111`）· `:610`（`:286-290`——现居 `family-tools.mjs:151-152`）·
   `:654`（`:275`——现居 `family-tools.mjs:133`）· `:673`（`:172`——现居 `family-tools.mjs:27`）· `:750`（`:151-160` 所载 449 行与核档历读数不符——疑端侧档引文，归父侧判）。以上本轮未覆盖。
4. `docs/core/design/MEMORY.md:75`：指向 `docs/core/design/CORE-UNIFICATION.md` §2.8.1「核内逐档行数与拆分计划」（本子系统面 = `index-bin.mjs` / `index-discover.mjs`）——写域外——登记（父侧派单注明）。
5. 候选：`CORE-UNIFICATION.md:1493` 同行 `tools/shared.mjs:165` 实读 = JSDoc 注释行（该注释述 U0 锚替换缝）/ 函数定义在 `:168`——差 3 行、归属两可——归父侧裁。

**边界与写域记录（如实）**：① 实现代码 / 台账 / 本档 §1 / §3–§6 零触碰；② 工作树查证 = `git status`（`workdir = thincoder`）：5 档 M——本席 3（`CORE-UNIFICATION.md`〔含轮-1 `:1117` 既有改动叠加〕·
  `ACP-CLIENT.md` · `ENGINEERING-MODE.md`）+ 轮-1 遗留 2（核 / VSC 两档 `AGENT-LOOP.md`）——均未提交（归父侧统一入笔）；无本轮未预期文件改动；③ 查证口径注：`git status` 须带 `workdir = thincoder`（默认 scope 读数 = clean——非本仓范围）。

### 批末文档收正轮-3（残簇全覆盖 · 收正链终轮）——eng-designer 记 · 2026-09-16

**依据** = 轮-2「同族残留登记」5 条 + 派单（残簇全覆盖）+ 逐条实读核位（现场读 + git 溯源）。**写域** = `docs/core/design/CORE-UNIFICATION.md` · `thincoder-cli/docs/design/ENGINEERING-MODE.md` · 本段（§2）。
**形态** = 读数类附「（2026-09-15 实读——原 N）」尾注；迁出前坐标保留 + 补「（迁出前坐标——现居 `thincoder-core/agent/family-tools.mjs:M`，2026-09-15 实读）」；`:750` 簇按实读判定归属后收正。

**收正清单（15 处替换——CU 3 + EM 12；坐标 = 收正后实读值）**

| # | 档:落点 | before → after |
|---|---|---|
| 1 | CU `:42`（B16 行） | `core` 299 / `docs` 419 / `code-sync` 415 → 300 / 420 / 416（各附「2026-09-15 实读——原 N」尾注） |
| 2 | CU `:1049`（§2.8 行） | 同上三值同款收正 |
| 3 | CU `:1493` | `toOpenAISchema()`（`tools/shared.mjs:165`）→ `:168`（引用意图 = 函数定义；`:165` 实读为 JSDoc 注释行——同格 `:18`（`DESC` 定义）同型） |
| 4–13 | EM 迁出前坐标 10 行（`:306`/`:422`/`:423`/`:434`/`:435`/`:436`/`:439`/`:610`/`:654`/`:673`） | 保留历史坐标 + 补迁出注（映射表见下） |
| 14 | EM `:750`（§2.22.4 ④ 行——449 簇） | 路径前缀 `thincoder-core/` → `thincoder-vscode/`（449 行附 as-of 注——归属判定见下） |
| 15 | EM `:829`（§2.23 表同簇——发现项） | 同 14 |

**迁出前坐标映射（实核：旧档 = `cc908b7d^` 核 `agent/setup.mjs` 354 行；现居 = `thincoder-core/agent/family-tools.mjs` 159 行）**

| 旧坐标 | 现居 | 内容 |
|---|---|---|
| `:172` | `:27` | 登记册解构（`../agent-tools.mjs`） |
| `:187` / `:189` | `:43` / `:45` | 工程模式 enum / suffix |
| `:224-257` | `:83-121` | 受限变体 IIFE（参数化双角色） |
| `:253` | `:110` | action 描述行（块 `:107-111`） |
| `:259` / `:260` | `:116` / `:117` | 勘察 / 审计描述行 |
| `:275` | `:132-133` | depthOnly 链（advisor 挂载列表） |
| `:277` | `:132-155` | depthOnly 链全段（`designer` 行 = `:152`） |
| `:286-290` | `:151` / `:152` | eng-coder / eng-designer 分支（batch_segment） |

**轮-2 预登记两处精化（如实）**：① `:434` 簇的 `:253`/`:259`/`:260` 轮-2 并记「现居 `:107-111`」——实核 `:253`→`:110`、`:259`/`:260`→`:116`/`:117`（`:107-111` 仅覆盖 action 块）；
② `:423` 的 `:277` 轮-2 记「`:132-138`」——实核取全链 `:132-155`（`:132-138` 不含分支行 `:151-152`）。
派单枚举「8 处」——实读为 **10 行坐标**（`:434`/`:436`/`:439` 句群另含 `:435`，同句群一并补注）。

**`:750` 449 归属判定（全链判据——实读）**：
① 原引 = `37c5f3a1`（2026-09-10 §2.22 设计）`src/agent/setup.mjs:151-160`（449 行）——该文件 = **VSC 端**（`091ebc49` 实改：`:151` 分支链处增 eng-designer 分支 + `engChildSubagentTool` 参数化——diff 实证；VSC 464 行 = 449 + 设计内 +15 实施）；
② 核档 `agent/setup.mjs` 历读数 = 354（2026-09-14 建核）→ 246（2026-09-15 迁出）——**从未 449**；
③ 现文本 `thincoder-core/` 前缀 = U15（`31860f39`「138 dangling anchors resolved」）机械收正误指——本轮实读收正（`:750` + `:829` 同簇）。
**同型观察（未逐行勘定——如实）**：同两表其余行（`thincoder-core/agent-tools/*`、`prompt-overlays` 82 等）疑为同轮机械收正产物——本轮只处置 449 簇。

**「仍留档不改」判据表（残簇终态——余项均为已判据，无悬项）**

| # | 项 | 判据 |
|---|---|---|
| 1 | CU `:893`（U15 表 `src/agent/setup.mjs` 354） | **历史快照（S2 迁移单元 as-of 记账）**——该表 = `thincoder-cli/` 相对迁移单元逐档行数（表头所载）；354 = CLI 侧 as-of 读数（语义正确，非核档读数）；现态面由 §2.8.1（读数 as-of 2026-09-14 + `:1117` 2026-09-15 实读行）承载 |
| 2 | EM `:664`（§2.21 `subagent-spawn.mjs` 449） | **历史快照**——第 4 批 as-of（表头「as-of 快照——不得当契约引用」）；重锚核档正确（核版现 459） |
| 3 | `docs/core/design/MEMORY.md:75` | **非本席写域**（轮-2 已登记父侧；本轮按派单零触碰） |
| 4 | EM `:750`/`:829` 簇 449 | 已于本轮收正（清单 14/15）——无残留 |

**§2 自身收正（轮-2 块 4 处形态——收正前实读发现，如实）**：① `:413`（302 字符）· `:444`（484）· `:448`（329）三处超宽行折行（纯格式——内容零改，行序后移 4 行）；
② `:445` 段引用收正——以「本档」指代者 → 全路径 `docs/core/design/CORE-UNIFICATION.md` §2.8.1（V1 段引用收正）。**注**：收正前该块实读为 3 宽超 + 1 V1——与轮-2 报告「四闸全绿」读数不符（如实登记）；本席收正后复跑全绿。

**四闸复跑（收正后——全绿；读数与轮-2 基线一致）**

| 闸 | 命令（cwd） | 读数 |
|---|---|---|
| 宽度 + 一致性 | `node scripts/check-doc-width.mjs`（仓根） | `OK(宽度)：412 文件 0 超`；V1/V2/V3 新增 0 · 存量 0；exit 0 |
| 台账 | `node scripts/check-ledger.mjs`（仓根） | 两档 OK · 0 处违规（基线 0）；exit 0 |
| 根域锚 | `node scripts/doc-anchors.mjs --root . --domain .`（仓根） | 125 档 · 悬空 0 · 注记豁免 872 · 候选 8420；`OK(V5)`；exit 0 |
| VSC doc:check | `npm run doc:check`（thincoder-vscode） | 命中 0 处（A1/A2/A3 全 0）· 阻断态；exit 0 |

**全量锚核（附加——CLI 域基线核）**：根域 0 悬空 ✓；CLI 域 **悬空 37 = 存量基线**（中途曾因本席新注「时名 `src/agent/setup.mjs`」未带仓别注记产生 +2（37→39），已就地收正为「`src/agent/setup.mjs`（VSC 仓）」形态——复跑回 37）；VSC 域报告态 0 命中。
**边界与写域记录**：实现代码 / 台账 / 本档 §1 / §3–§6 零触碰；工作树 = `git status` 5 档 M（同轮-2 集合，未提交——归父侧统一入笔）。

**轮-3 补记（同轮收束——回读发现）**：本块引文中的「本档」式段引用字面（原样引述旧文）再次触发 V1（引文入判）——已改述为「以『本档』指代者 → 全路径」形态；连前计 **5 处形态收正**；终态复跑全绿（宽度 412 档 0 超 + 一致性 V1/V2/V3 新增 0 · 存量 0）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审范围与限制**：读全四档（批次档 §1/§2 · VSC AGENT-LOOP · 核 AGENT-LOOP · CORE-UNIFICATION）。无文档地图声明 ⇒「文档归属」判据降级（按 Project Guide + 档内既有归属节判定）；无项目标准档声明 ⇒ 方法论按 Project Guide 判。源码面（VSC/核 `setup.mjs` 行号、`package.json` exports、测试夹具）不在本轮范围 ⇒ 相关坐标一律按设计者声明处理，未独立复核（`unverified`）。

**已核合规面（无发现）**：四段工作流与边界声明齐（§1 讨论 → §2 设计 → §3 评审 → §4 批准；实施者/宿主/单笔提交/零触碰/UI 无面）；方案对比（L1/L2/L3 + A/B/C 含否决理由）齐；R24a 受影响文件表在位；反证面（断言 A/B + mock 400 逐字 + 拆修复行必红）成立；文档收正两档已落（`thincoder-vscode/docs/design/AGENT-LOOP.md:41-42` / `:466`，`docs/core/design/AGENT-LOOP.md:394` / `:502-503` 实读到文）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Document ownership | 🔴 | 机制级描述互斥（同一机制两处写法不同）：`docs/batches/2026-09-15-vsc-tool-table-dup.md:132`、`thincoder-vscode/docs/design/AGENT-LOOP.md:41` / `:466`、`docs/core/design/AGENT-LOOP.md:394` / `:502` 五处均写「追加家族与端侧 meta 族**不重叠**（防子代装配重名）」；而同档 `docs/batches/2026-09-15-vsc-tool-table-dup.md:68-70` 实测逐字为「`parent.tools` 中已被核 `:293` 追加的名字 = task, plan, timer, subagent, recent_changes, read_history, advisor, verify, skill, goal, eng」（11 名重叠）、`:72`/`:74` 实测重名集 = {task, plan, timer, subagent}——即本缺陷的重叠**恰在**核追加家族与端侧 meta 族之间；真正成立的不相交式是「核追加家族 ∥ **绑定值（基础集）**」。两档权威设计档（核 §6.18 行 + 变更记录、VSC §11.2 B 行 + 变更记录）现已载入与本档自身实测相抵的机制陈述 | 落笔前把不相交式改述到**绑定值（基础集）**而非端侧 meta 族——五处（批次档 §2.1 契约行 · VSC §11.2 B 与变更记录 · 核 §6.18 行与变更记录）；仅措辞面，代码方向（绑基础集）不变 |
| 2 | Affected-file size | 🟡 | §2.8 第 2 行（`docs/batches/2026-09-15-vsc-tool-table-dup.md:289`）记核 `agent/setup.mjs` 355 → 净 −35～−50（迁后 ~305–320），但同档 `:140` 枚举的迁出面逐段相加 = 105 行（`:173` 1 + `:178-183` 6 + `:184-195` 12 + `:196-216` 21 + `:218-263` 46 + `:275-292` 18 + `:293` 1），且 §2.3A 声明「全部逻辑」迁出、`:293` 只换两行调用（`:228`）⇒ 落点应约 235–255 而非 305–320；该偏差**反转**该档的 300 行软线判断（305–320 越线 / 235–255 不越线） | 按枚举区间重算该行（增量 + 迁后行数 + ≤300/≤500 结论）；若区间有意只迁一部分，写明哪几段留在核 `agent/setup.mjs` |
| 3 | Document ownership | 🟡 | L2 新档 `thincoder-core/agent/family-tools.mjs` 且把「角色工具面装配（`depthOnly`）」职责迁出核 `agent/setup.mjs`，但该主题的归属节未随之收正：核档 §6.1 模块地图（`docs/core/design/AGENT-LOOP.md:167`）仍把该职责记在 `agent/setup.mjs` 名下、且无新档行；VSC 档 §1 模块地图（`thincoder-vscode/docs/design/AGENT-LOOP.md:76`）仍把「角色工具面装配」记为端侧 setup 职责。本批只改了 §6.18 / §11.2 + 两条变更记录 | 核 §6.1 补新档行并把 `agent/setup.mjs` 职责句收正为「改调家族单源」；VSC §1 同格改为「装配改调核单源 + 端差装饰」 |
| 4 | Requirements / 设计完整性 | 🟡 | §2.4 死支消费者穷举（`docs/batches/2026-09-15-vsc-tool-table-dup.md:237-243`）未覆盖与删除面相邻、且由 VSC 档自持的两个受限通道描述面：`thincoder-vscode/docs/design/AGENT-LOOP.md:382`（§8「受限 spawn（`engAuditSubagentTool`）…」）与 `:849`-`:862`（§14（a）受限变体 description 两行 = `src/agent/setup.mjs:85` / `:86` 逐字表）。若二者与将删的 `engChildSubagentTool`（`:270-291`）同物（疑同名沿旧），文档面即随删失准；若不同物，则仍有活消费者 ⇒「零行为影响」需限定 | 穷举表补这两面 + 给出收正或保留的判定；若 `engAuditSubagentTool` 是旧名，明写同名关系 |
| 5 | Feasibility / 契约完整性 | 🟡 | 基础集定义含 `opts.extraTools`（`:130`），而核子代装配调用点同样展开 `extraTools`（`:228`）；设计未说明核侧 `extraTools` 的来源与两者关系 ⇒ 防 400 的不相交式在该成员上未证（若某端侧消费者经两路同时传入同名工具，缺陷可复现） | 写明核侧 `extraTools` 来源及端侧 `opts.extraTools` 是否可达子代装配；若可达，把该成员的不相交（或剔除）纳入 L1 契约 |
| 6 | Acceptance / 回归覆盖 | 🟡 | §2.3E（`:231`）称「VSC depth-0 家族名集 = 现状同集」，但断言 B 的 fixture (c) 由**新**核矩阵反推（`:253`）⇒ 对「与现状 VSC 面同集」这一主张，(a)≡(c) 自证其说，无法发现 depth-0 面漂移（丢/换工具） | 在 §5 反证链前先落一次**改前** depth-0 名集原样读数（改后对照），或把该对照纳入断言 B |
| 7 | Affected-file size / 结构债 | 🟡 | VSC `thincoder-vscode/src/agent/setup.mjs` 683 → ~603–633（`:290`），仍越 500 硬限 100+ 行，且所引「既有登记」（`thincoder-vscode/docs/design/AGENT-LOOP.md:63`，2026-09-08「setup.mjs 500 行边缘（挂 TODO 拆）」）相对现值已陈旧；本批对该档无拆分计划 | 按现值刷新登记 + 给出显式拆分计划或指向（批次级处置）；不静默沿用「边缘」旧注（不做本批拆分升级） |
| 8 | Acceptance（可实施性） | 🔵 | 断言 B 的 fixture 底线写「至少三例」（`:253`），同段覆盖行又写「扩至 5 角色」（`:255`）——测试作者无法确定必备 fixture 集 | 明确逐角色 fixture 清单（哪几个角色必须内置期望名集） |
| 9 | Clarity | 🔵 | §2.3C 调用面逐字仍解构 `taskTool: _t, planTool: _p`，与 §2.1 B「解构面收窄（仅留装饰所需实例）」（`:141`）不一致——要么是残留（应删），要么保留的全表构造需要它们 | 一句注说明（删或保留），避免 coder 二义 |
| 10 | Clarity / 档面卫生 | 🔵 | §2.9 收正坐标 `:465`（`:302`）与实文不符：§11.2 B 类绑定清单实居 `thincoder-vscode/docs/design/AGENT-LOOP.md:466`（465 为空行） | 更正坐标（或注明计数口径） |
| 11 | Approval protocol | 🔵 | §2.2 呈请（`:162`）只列 ①绑定=基础集 ②家族单源化，正文已登记的子代可见面变化（§2.3E ①：只读子代 `[task, recentChanges] → [task, plan, timer]`，即失 `recent_changes`、得 `plan`/`timer`；及 ① 连带继承面收窄）未在呈请中点名 | §4 呈请中把该变化点名（按 A11 口径让批准知情——虽疑被 ①② 覆盖） |

**计数**：🔴 1 · 🟡 6 · 🔵 4（共 11）。

**范围外备注（不记严重度）**：① 台账 `docs/TODO.md:46` 载同一「与核追加名重叠 11 个」读数——与发现 #1 同证，修正对象为设计档（台账该句本身正确）。② `docs/batches/2026-09-15-vsc-core-wiring.md`（不在本轮范围；仅 grep 触及）记有未落项涉及核 `agent/setup.mjs:293-294`（`toolSchemas` 物化处 run 期能力重解）——与本批 `:293` 重写同点，父侧可确认时序（`unverified`）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**评审轮次 2（核验前表 + 新问题）**——范围：重读全四档现文（§2 就地修订后 + 两设计档收正后）；源码面仍不在本轮范围（`unverified` 处理同上轮）。

**前表（轮次 1：1🔴 / 6🟡 / 4🔵）逐项核验 = 11/11 Fixed（本轮 read 实文引用为证）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批次档 `:132` · VSC `:41` / `:467-468` · 核 `:395` / `:503` | 🔴 | **Fixed** | 五处均改为「**不相交式 = 追加家族 ∥ 绑定值（基础集）**（…端侧 meta 族与追加家族实测重叠 11 名，故其不得入绑定值）」；旧句「追加家族与端侧 meta 族不重叠」零残留（两 AGENT-LOOP 档 grep 实测） |
| 2 | 2 | 批次档 `:302` / `:140` | 🟡 | **Fixed** | 「**≈ −100（净；区间 −95～−110）**…迁后 **≈ 245–260**；**≤300 软线 ✓**（修正轮-1 按枚举重算收正）」；§2.1 核改行「两行式」→「两段式」同收 |
| 3 | 3 | 核 `:166-167` · VSC `:77` | 🟡 | **Fixed** | 核 §6.1：setup 行改「角色工具面装配（改调家族单源 `family-tools.mjs`）」+ 新档行「`family-tools.mjs`（新档——落 `thincoder-core/agent/`）｜家族矩阵单源：`assembleFamilyTools`…」；VSC §1 同格「改调核单源 `family-tools.mjs` + 端差装饰」 |
| 4 | 4 | 批次档 `:252-253` · VSC `:383` / `:851-853` | 🟡 | **Fixed** | 穷举表补两面并判定「**同物**」（`:252` 旧名沿旧；`:253` §14(a) 逐字 = `engChildSubagentTool` `:287`/`:288`）；§8 条 + §14 退场注在位 |
| 5 | 5 | 批次档 `:132` / `:234-239` | 🟡 | **Fixed** | §2.3F 新块：核侧来源链 + 端侧形态 + 「关系判定 = **可达**；生产现状 = **零 producer**」+ L1 契约补句（`extraTools` 注入方不重名义务） |
| 6 | 6 | 批次档 `:263-264` / `:267` / `:291` | 🟡 | **Fixed** | 改前基线 ⓪ 步骤（落 §5）固化进 fixture (c) depth-0 例；AC6 携基线锚 |
| 7 | 7 | 批次档 `:303` | 🟡 | **Fixed** | 体量登记刷新（现值 683 实测，旧「边缘」注取代）+ 台账指针 + 显式拆分计划（切法/判据/执行时点） |
| 8 | 8 | 批次档 `:263` / `:266` | 🔵 | **Fixed** | 「必备 5 角色」单清单为准；旧「至少三例」下限退役 |
| 9 | 9 | 批次档 `:201` / `:218` | 🔵 | **Fixed** | 解构面收窄为装饰实例三项；残留注「定案 = 删」 |
| 10 | 10 | 批次档 `:315` | 🔵 | **Fixed** | 坐标收正为实文 `:467-468`（以节定位为准）；VSC `:467-468` 实文核验相符 |
| 11 | 11 | 批次档 `:162` | 🔵 | **Fixed** | §2.2 呈请补 ③ 子代可见面变化（只读子代 `[task, recent_changes] → [task, plan, timer]`；继承面收窄）供 §4 知情 |

**新增问题：无 🔴 / 无 🟡。**（行数读数核验：VSC 档现文 1581 ✓〔§2.8 行 7〕、核档现文 506 ✓〔行 8〕）

**无严重度备注**：① VSC `:383` / `:852` / `:43` 的「**已退场**」为前置断言（端侧删除随 §5 落地）——与「文档先落 / §5 记实施」批次惯例一致；仅批次改写范围时需回收。② 本档 §1 状态行（`:7` / `:20`）仍「设计轮待发」——§1 属父侧零触碰面（无严重度）。

**计数**：剩余 🔴 0 · 🟡 0 · 新增 🔵 0；前表 11/11 = Fixed。

VERDICT: pass

### 轮次 3（评审子代理）

**核验方式**：本轮重读四档现文（批次档 · VSC AGENT-LOOP · 核 AGENT-LOOP · CORE-UNIFICATION）；源码面不在本轮范围（相关坐标按设计者声明处理，`unverified`）。

**前表（轮次 1：1🔴/6🟡/4🔵）逐项核验 = 11/11 Fixed（本轮 read 实文引用为证）**

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | 批次档 `:132` · VSC `:41` / `:467-468` · 核 `:395` / `:503` | 🔴 | **Fixed** | 五处均载「**不相交式 = 追加家族 ∥ 绑定值（基础集）**（…端侧 meta 族与追加家族实测重叠 11 名，故其不得入绑定值）」；旧句「追加家族与端侧 meta 族不重叠」两设计档 grep 零残留；CORE-UNIFICATION.md 同族词零命中 |
| 2 | 2 | 批次档 `:302` / `:140` | 🟡 | **Fixed** | 「**≈ −100（净；区间 −95～−110）**…迁后 **≈ 245–260**；**≤300 软线 ✓**（修正轮-1 按枚举重算收正）」；§2.1 核改行「两行式」→「两段式」同收 |
| 3 | 3 | 核 `:166-167` · VSC `:77` | 🟡 | **Fixed** | 核 §6.1 setup 行改「角色工具面装配（改调家族单源 `family-tools.mjs`）」+ 新档行「`family-tools.mjs`（新档——落 `thincoder-core/agent/`）｜家族矩阵单源：`assembleFamilyTools`…」；VSC §1 同格「改调核单源 `family-tools.mjs` + 端差装饰」 |
| 4 | 4 | 批次档 `:252-253` · VSC `:383` / `:851-853` | 🟡 | **Fixed** | 穷举表补两面并判定「**同物**」（`:252` 旧名沿旧；`:253` §14(a) 逐字 = `engChildSubagentTool` `:287`/`:288`）；§8 条收正 + §14 退场注在位（`：852` 删除记录 = 批次档 §5） |
| 5 | 5 | 批次档 `:132` / `:234-239` | 🟡 | **Fixed** | §2.3F：核侧来源链（`agent.mjs:96→:129→setup.mjs:42→:293`）· 端侧形态 · 「关系判定 = **可达**；生产现状 = **零 producer**」+ L1 契约补句（注入方不重名义务） |
| 6 | 6 | 批次档 `:263-264` / `:267` / `:291` | 🟡 | **Fixed** | 改前基线 ⓪ 步骤（落 §5）固化进 fixture (c) depth-0 例；AC6 携基线锚 |
| 7 | 7 | 批次档 `:303` | 🟡 | **Fixed** | 体量登记刷新（现值 683 实测，旧「边缘」注取代）+ 台账指针 + 显式拆分计划（切法/判据/执行时点） |
| 8 | 8 | 批次档 `:263` / `:266` | 🔵 | **Fixed** | 「必备 5 角色」单清单为准；旧「至少三例」下限退役 |
| 9 | 9 | 批次档 `:201` / `:218` | 🔵 | **Fixed** | 解构面收窄为装饰实例三项；残留注「定案 = 删」 |
| 10 | 10 | 批次档 `:315` | 🔵 | **Fixed** | 坐标收正为实文 `:467-468`（以节定位为准）；VSC `:467-468` 实文核验相符 |
| 11 | 11 | 批次档 `:162` | 🔵 | **Fixed** | §2.2 呈请补 ③ 子代可见面变化（只读子代 `[task, recent_changes] → [task, plan, timer]`；继承面收窄）供 §4 知情 |

**新增问题**：无 🔴 / 无 🟡 / 无 🔵。行数读数核验：VSC 档现文 **1581** ✓（§2.8 行 7 所载）、核档现文 **506** ✓（行 8 所载）。

**无严重度备注**：① VSC `:383` / `:852` / `:43` 的「**已退场**」为前置断言（端侧删除随 §5 落地）——与「文档先落 / §5 记实施」批次惯例一致；② 本档 §1 状态行（`:7` / `:20`）仍「设计轮待发」——§1 属父侧零触碰面。

**计数**：剩余 🔴 0 · 🟡 0 · 新增 🔵 0；前表 11/11 = Fixed。

VERDICT: pass

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

**状态：已实现待评审（审计 1 轮 = DEVIATIONS 5 条·全数处置；advisor 代码评审见文末追加块）**（2026-09-15）。实施面 = L1+L2 合并（§2 任务书 + 修正轮-1 块 11/11 口径）；执行宿主 = CLI。

### 落点（file:line——实施后坐标）

| # | 文件 | 动作 | 落点 / 读数 |
|---|---|---|---|
| 1 | `thincoder-core/agent/family-tools.mjs` | 新档（159 行） | `assembleFamilyTools`：迁出矩阵逐支照 §2.3A（depth-0 / eng-coder / eng-designer / coder / consult / else + consult 池门 + `decorate` 四键 + 固定段首）；登记册动态载入 `:27` |
| 2 | `thincoder-core/agent/setup.mjs` | 家族段迁出 + 两段式改调 | 355 → **246 行**（§2.8 预计 ≈245–260 ✓）；调用点 `:175-182`（§2.3D 逐字）；`engChildRole` 保留 `:198`（prompt 场景映射 `:199-205` 消费——迁出面唯一未随迁消费点，实测发现） |
| 3 | `thincoder-vscode/src/agent/setup.mjs` | L1 拆分 + L2 改调 + 死支删除 | 683 → **645 行**（净 −38——§2.8 预计 −50～−80，越带见「决策透明表」#3）；baseSet `:360-367` · 全表 `:368-374` · 绑定 `:485` · 核调用 `:323-333` · `engChildSubagentTool`（原名）已退场 |
| 4 | `thincoder-core/test/family-tools.test.mjs` | 新档（5 例） | 5 角色 fixture + 固定段序 + consult 池门 + decorate 两面 |
| 5 | `thincoder-vscode/test/integration/host-shape-spawn.test.mjs` | T4 加强 + T5 新增 | 125 → 201 行；断言 A helper `:96-104`；断言 B（(a)/(c)/(a)≡(b)）T5 内 |
| 6 | `thincoder-vscode/test/integration/helpers/mock-llm.mjs` | 重名校验（默认开 + 开关） | 87 → 102 行；`:42` `{ validateToolNames = true }`；`:55-63` 请求级 400 逐字 |
| 7 | `thincoder-vscode/docs/design/TOOLS.md` | 角色分派块收正 | `:110-124`（旧名沿旧面 + role 列表按单源化后事实收正） |

### ⓪ 改前基线（先于一切生产改动——原样读数）

探针 = `thincoder-vscode/.thincoder/tmp/dup-baseline.mjs`（生产宿主形状 `hydrateRun(buildTopLevelAgent(), …)`·零手写 tools 字段）；日志 = `.thincoder/tmp/dup2-baseline.log`。**depth-0 家族名集原样（12 名）= 断言 B fixture (c) depth-0 例期望集**：

```
=== depth-0 default ===   full (43) · base (31) · family (12):
advisor, eng, goal, plan, read_history, recent_changes, settings, skill, subagent, task, timer, verify
```

四子角色参照读数（informational——深支死面，战后以核矩阵为准）：eng-designer `(5) batch_segment, plan, subagent, task, timer`（与核矩阵**同集**）；
eng-coder `(8) advisor, batch_segment, plan, recent_changes, subagent, task, timer, verify`（差 1 名 = `recent_changes`——§2.4 死支差异登记）；coder `(4) advisor, recent_changes, task, verify`；
explore/consult `(2) recent_changes, task`（§2.3E ① 已登记：`[task, recent_changes] → [task, plan, timer]`）。

### 反证（红/绿原样——命令 + 输出行）

**① L1 反证**（临时把 `:485` 改回 `agent.tools = tools`；命令 `npm run test:integration`（cwd = thincoder-vscode）；日志 `.thincoder/tmp/dup2-counter1-red.log`）：

```
ℹ tests 34   ℹ pass 30   ℹ fail 4
✖ T4 coder（行为——用户报错路径）：真跑 sync spawn 正常返回报告
✖ T5 eng-designer（行为——用户实测角色）：真跑 + 断言 A（工具名唯一）+ 断言 B（矩阵同源，5 角色）
✖ ② 正常：设计评审结算 → token 签发 → spawn 放行（两路）→ 链终 consume 消费
✖ ② 边界：链未收口——同 designId 修正复用放行；消费后再 spawn → 机械拒
  Error: LLM API error 400: {"error":{"message":"Tool names must be unique."}}
```

⇒ 用户报错路径**逐字复现**（4 处）；恢复 `agent.tools = baseSet` ⇒ 复跑 `34/34/0`（`.thincoder/tmp/dup2b-integ.log`）✓。

**② L2 反证**（临时自核 depth-0 段删 `recentChangesTool` 一项；命令 `node --test test/family-tools.test.mjs`（cwd = thincoder-core）+ `npm run test:integration`）：

```
核单测（.thincoder/tmp/dup2-counter2-core-red.log）：ℹ tests 5  ℹ pass 3  ℹ fail 2
  ✖ 家族矩阵：5 角色必备 fixture + consult 名集逐名相等（乱序比较）
  ✖ 固定段序：task → plan → timer 恒为前 3 项；家族段随后（装配契约序）
集成（.thincoder/tmp/dup2-counter2-vsc-red.log）：ℹ tests 34  ℹ pass 33  ℹ fail 1
  ✖ T5 …（断言 B）AssertionError: (a)≡(c) depth-0 默认（携改前基线锚）
    - 'recent_changes'（expected 有 / actual 无）
```

⇒ 「改核矩阵 ⇒ 核内最早失败面红 + 端侧 fixture 可见红」双面成立；恢复 ⇒ 全绿 ✓。

### 复跑链（终态读数——日志 `.thincoder/tmp/dup2b-*.log`）

| 命令 | 期望（AC） | 实测 | 日志 |
|---|---|---|---|
| `npm test`（VSC 快层） | 553/518/0/35 | **553/518/0/35** ✓ | `dup2b-fast-2.log` |
| `npm run lint` | 194 JS OK | **194 JS OK** ✓ | `dup2b-lint.log` |
| `npm run test:full` | 553/553/0 | **553/553/0** ✓ | `dup2b-full.log` |
| `npm run test:integration` | 33/33/0 → 34/34/0 | **34/34/0** ✓（T5 +1） | `dup2b-integ.log` |
| `npm run doc:check` | 0 命中 | **0 命中**（A1/A2/A3 全 0） ✓ | `dup2b-doccheck.log` |
| `node --test`（核回归） | 178/178/0 → +N | **183/183/0** ✓（N = 5） | `dup2b-core.log` |
| `node scripts/check-doc-width.mjs` | 411 档 0 超 | **412 档 0 超**（+1 = 他批新批次档 `2026-09-15-embedding-utf16-truncation.md`——非本批产物） ✓ | `dup2b-width.log` |
| `node scripts/check-ledger.mjs` | 0 违规 | **0 违规** ✓ | `dup2b-ledger.log` |
| `doc-anchors --domain thincoder-vscode --strict` | 0 命中 | **0 命中** ✓ | `dup2b-vsc-strict.log` |
| `doc-anchors --root . --domain .` | 0 悬空 | **0 悬空**（候选 8399·豁免 872） ✓ | `dup2b-root-v5.log` |
| `npm test`（CLI 读数·附加） | 红按现况归因 | **609/552/0/57**（零红） ✓ | `dup2b-cli.log` |

**读数漂移注**：AC3 期望 lint 193 / AC5 期望宽度 411——**改前基线实测即 194 / 411+1**（`dup2-lint-baseline.log` / `dup2-width-1.log`），系设计侧旧读数，非交付缺陷。

### 决策透明表（实施期决策——对照 §2 口径）

| # | 决策 | 依据 / 代价 | 处置 |
|---|---|---|---|
| 1 | VSC 调用面**不传** `engineering` | §2.3C 逐字含该参数，但该值在 `:487` 才落（调用点在 `:351` 位——实核：调用点前无该绑定）；核内该参数唯一消费点 = `filteredSubagent`（depth-0 角色 enum + escalate 池装饰），而端侧恒传 `decorate.subagent` ⇒ `decorate?.subagent ?? filteredSubagent` 永不落到缺省支 ⇒ **行为中性**；端侧同语义由 schema 面 `modeRoleField(engineering)` 承载。已就地注记 + 收敛通道残留项 | 如实登记（审计 5# 同判「行为中性有实证」） |
| 2 | `engChildRole` 判据**保留**在核 `setup.mjs` | 迁出面之外仍有消费点（prompt 场景映射 `:199-205`）——纯迁出会 TDZ 崩；保留行与单源档内同判并存（各司其职） | 已落 |
| 3 | VSC 净减 **−38**（645 行）越出 §2.8 预计带（−50～−80） | 差异源 = 新增调用面注记（端差/engineering 决策 4 行 + L1 契约注记 4 行）与 `baseSet`/`tools` 双列表构造（§2.1A 认可形态——保序优先，未用 `[...baseSet, ...agentTools]` 短形态以免全表序变）；**「仍越 500 硬限」结论不变**，拆分计划归结构减债轮（§2.8 行 3） | 如实登记 |
| 4 | 「旧名收正」落点为注记行形态 | `TOOLS.md` 写 `engAuditSubagentTool`（原名，代码面无此名）触发 V5-A2 锚（doc:check 实测红）；改 P3 注记行形态（原名 + 已退场 + 删除记录）后 0 命中 | 已落（首轮红/次轮绿原样） |
| 5 | 集成 (b) 直调同参口径 | 首版传 `consultModels: []`/`batchDoc: null`（审计 5# 指出「同参」非严格）；改 `loadConsultPool()` + `BATCH` = 生产取值源同款 | 已落 |

### 越表披露（设计面未登记的机器档改动——3 处·均因旧断言钉死改前形态）

| # | 文件 | 旧断言（钉死形态） | 新形态 | 依据 |
|---|---|---|---|---|
| 1 | `thincoder-core/test/tool-registry.test.mjs` | #83 结构机检：`agent/setup.mjs` 直取登记册（consult 家族） | 消费点迁指 `agent/family-tools.mjs` + setup.mjs 经单源档断言 | 迁移本体（§2.3A）——不移即红（`node --test` 178/177/1 实测） |
| 2 | `thincoder-vscode/test/agent-tools-registry.test.mjs` | W9③：解构面**恰 14 名** | 解构面 = 装饰实例三名 + 家族段经核单源断言 | §2.3C 解构收窄——不移即红（快层 553/516/2 实测） |
| 3 | `thincoder-vscode/test/eng-designer-role.test.mjs` | T57：受限变体 `!("action" in props)`（VSC 旧 delete-action 形态） | `action.enum === ["spawn"]`（核版形态） | §2.10.6 微差收正「随死支删除以核版为准」——不移即红（同上读数） |

### 未落项 / 未决（承 §2.10——本批不做）

1. `extraTools` 注入方不重名义务 = 契约句（§2.3F）——生产零 producer，无代码面（如实）。
2. CLI 侧 mock-llm 无重名校验（§2.10.5）——未动（本批不动 CLI 测试面）。
3. `_syncChildAborts` / `_permQueue` 初始化点（§2.10.3）· `question` 注释陈旧（§2.10.2）· `settings` 归属端差收敛（§2.10.1）——均按 §2.10 归父侧/另批。
4. 单笔提交：**提交面 = 生产 3 档 + 测试 5 档 + 测试机检收正 3 档 + 文档 3 档**（两档 AGENT-LOOP 为设计者已落内容，随笔带走）；批次档本体与台账 / `docs/TODO*.md` 不入笔（父侧统一）。

### 审计与代码评审（同会话交付链——AGENT-LOOP §18；终态 = clean）

**① 内审（explore 偏差审计，1 轮）** = `DEVIATIONS` 5 条（3 PARTIAL + 1 OUT-OF-LIST + 1 DOC-DRIFT；**无 🔴**）。处置逐条：

| # | 严重度 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | 本档 §5 空置（⓪ 基线 / 反证红绿读数未入档） | 已修——本段主体即补档 |
| 2 | 🔵 | `TOOLS.md:110-124` 越表（§2.8 无该行 · §2.10.8 判「写域外」） | 非缺陷（父任务书第 6 项已列——事后知情）；落档本段「落点」行 7 |
| 3 | 🔵 | VSC `setup.mjs` 净减 −38 越 §2.8 预计带 | 如实登记（决策透明表 #3）——实测与原因在案 |
| 4 | 🔵 | VSC 调用面未传 `engineering`（§2.3C 逐字含） | 审计同判「行为中性有实证」——注记 + 决策透明表 #1 |
| 5 | 🔵 | 集成 (b) 直调「同参」非严格（`consultModels: []`/`batchDoc: null`） | 已修——改 `loadConsultPool()` + `BATCH`（生产取值源同款） |

**② 代码评审（advisor `type=code`，1 轮）= `VERDICT: pass`**（无 🔴；🟡 5 + 🔵 4）。逐条裁决：

| # | 严重度 | 发现 | 处置（落点） |
|---|---|---|---|
| 1 | 🟡 | 两档 AGENT-LOOP 悬空坐标（`agent/setup.mjs:293`——迁出后核档 246 行该行不存在；实位 `:182`；另 VSC 档 `:853` 的 `thincoder-core/agent/setup.mjs:226-263` → 实体在 `family-tools.mjs:83-121`） | **父侧/文档层项**（两档 = 设计者写域 + 父任务书「勿重复触碰」）——不落修，如实上报 |
| 2 | 🟡 | 本档 §4 / §6 空置（实施已完、批准与收口未在案）+ 建议 §6 含用户原场景端到端复核（VSC 面板 spawn eng-designer——现全部证据为测试层） | **父侧协调项**（段作者 = 主 agent）——本席无该两段写通道 |
| 3 | 🟡 | §2.8 R24a 表未含 3 个机检档 + `TOOLS.md`（改动集不单表可读） | **设计者段（§2）项**——已由本段「越表披露」3 行 + 落点表行 7 双披露；建议父侧按披露回填 |
| 4 | 🟡 | `TOOLS.md:120-121` 把 consult 并入「其余只读子代理」⇒ 漏 `recent_changes`（违 §2.3A「consult = `[recentChanges]`」） | **已修**——拆出 consult 支（现文 `task/plan/timer + recent_changes`） |
| 5 | 🟡 | VSC `setup.mjs` 645 行越 500 硬限（存量在册债——`docs/TODO.md:54` + §2.8 行 3 拆分计划；本批净减 −38 未增量） | 无需动作（R3——不升级、不重开；结论不变） |
| 6 | 🔵 | §2.8 行 3 数值漂移（−50～−80 预计 vs −38 实际） | 已登记（决策透明表 #3）——无需动作 |
| 7 | 🔵 | VSC `setup.mjs:357` / `:483` 新写注释内的悬空 `agent/setup.mjs:293` 坐标 | **已修**——改符号指称（`assembleFamilyTools` 追加族……），行号型指针清零 |
| 8 | 🔵 | `:350-352` 注释「`question` excluded from ALL subagents」过度断言（核 spawn 链子代经 `parent.tools` 继承 —— `subagent-spawn.mjs:292`） | **父侧裁**（§2.10.2 在册：更新与否 = 父侧裁）——本席不擅动 |
| 9 | 🔵 | VSC AGENT-LOOP §8 正文（`:384-386`）以现时语气描述已退场端侧形态（「action 参数整体移除」）——承载方核版保 `action`（`enum:["spawn"]`，机检同断言） | **父侧/文档层项**——建议加 §14 同款 as-of/退场注 |

**③ 修正轮（如上一并落修——4 处，均在声明写域内）**：TOOLS.md consult 支 · VSC 注释坐标 ×2（`:357`/`:483`）· 家族单源档头 as-of 注 · 集成 (b) 同参口径。修后复跑读数（`.thincoder/tmp/dup2c-*`）：VSC 快层 **553/518/0/35** · 集成 **34/34/0** · lint **194** · doc:check **0 命中** · 核 **183/183/0** · 宽度 **0 超**（V1/V2/V3 新增 0）——与修正前同读数。

**④ 单笔提交**：`cc908b7d`（12 档 · +502/−233）——生产 3 档 + 测试 5 档 + 测试机检收正 3 档 + 文档 3 档（两档 AGENT-LOOP = 设计者已落内容，随笔带走）；台账 `docs/TODO*.md` / 本档本体 / 他批未提交改动（`docs/core/design/MEMORY.md` 等）**零纳入**（`git commit --only` 逐路径）。批次档不入笔（父侧统一）。

**⑤ 环境噪声登记**：快层 slow 门报告（`1–2 个用例未标 slow 而超阈值`——`edit-tool-improvement` / `provider-admission`，均为存量档）在**加载并行时**出现、**独立复跑即无**（`dup2b-fast-2.log` 无报告）——非本批引入、非交付缺陷。

**终态 = clean**（内审 1 轮 + 代码评审 1 轮；未决项 0——见 ② 的父侧项清单）。

## §6 验证与收口（父代理）

### 6.1 实施与验证（父侧实核，非采信自述）

- 单笔提交 `cc908b7d`（`git show` = 12 档 / +502/−233）：核新档 `thincoder-core/agent/family-tools.mjs`（159 行）· 核 `agent/setup.mjs` **355 → 246**（落 §2.8 预计带 245–260 内）· VSC `src/agent/setup.mjs` **683 → 645**（`baseSet` 拆分 + 核单源调用 + 死支删除）· 测试（断言 A/B + 旧断言收正）· 两档 AGENT-LOOP + `TOOLS.md`。
- 反证链（§5 原样）：⓪ 改前 depth-0 家族 12 名基线 → ① L1 反证（4 红 + 用户报错逐字 `Tool names must be unique`）→ ② L2 反证（核 3/2 + 端 33/1）→ 恢复全绿。
- 复跑：核 `node --test` 183/183/0 · VSC 快层 553/518/0/35 · full 553/553/0 · 集成 **34/34/0** · lint 194 · CLI `npm test` **609/552/0/57**（零红）。
- 三闸 + `doc:check`：宽度 412 档 0 超 · 台账 0 · 根域锚 0 悬空 · VSC `doc:check` 0 命中。

### 6.2 批末文档收正（三轮，全落）

- 轮-1（3 档 +11/−7）：核/VSC 两档 AGENT-LOOP 坐标收正（`family-tools.mjs` 单源 + 调用点 `:175-182`）· VSC §14 退场注 · §8 as-of 注 · CU 行 7 `:1117`（354 → 246「已兑现」注 + 指针）· §2.8 越表 4 档回填。
- 轮-2（10 处）：CU `:1441`/`:1493` + U8 表读数（416/300/420）· `ACP-CLIENT.md:262` · EM ×3（`:199-205` / `:202-204` / `:203`）。
- 轮-3（残簇清空）：CU `:42`/`:1049` 读数 + `:1493`（`shared.mjs:168`）· EM 迁出前坐标 10 行补迁出注 · EM `:750`/`:829` 449 簇归属判定（VSC 端 as-of 快照 + U15 机械收正误指 ⇒ 复原 `thincoder-vscode/src/agent/setup.mjs`）+ as-of 注。
- 留档不改（判据）：CU `:893` / EM `:664` = 历史快照（表头自载 as-of）；`docs/core/design/MEMORY.md:75` = 指针（登记）。
- 踩坑登记：轮-2 块曾引入 3 行宽超 + 1 处 V1（轮-3 已收正）；轮-3 中途 CLI 域 +2 悬空（自消）。

### 6.3 未落项（携带——本批不做，均已在册或另有归属）

1. `extraTools` 注入方不重名义务 = 契约句（零 producer，无代码面）。
2. CLI 侧 mock-llm 重名校验 · `_syncChildAborts`/`_permQueue` 初始化点 · `question` 注释陈旧 · `settings` 归属端差收敛（§2.10）。
3. 环境噪声：快层 slow 门报告仅并行加载时出现（存量档）——非本批。
4. **用户面端到端复核（建议）**：VSC 面板内 spawn eng-designer / eng-coder ⇒ 子代工具表零重名、不 400（本批证据 = 测试层 + 真夹具；面板态需 reload 后实机）。

### 6.4 收口行（核销同步清单）

- 台账：`docs/TODO.md:31` 需求池条目 → `docs/TODO-archive.md` §四（已核销）；需求池计数 26 → 25。
- 提交：实现 = `cc908b7d`（单笔）；收口 = 本记录（§2 三轮追加 + §3/§5/§6）+ 收正三档（两档 AGENT-LOOP · CU · ACP-CLIENT · ENGINEERING-MODE）+ 台账两档（父侧单笔）。
- 推送：两远端（gitee / github）。
- 凭证：本批 designId 槽位终消费（链终）。

### 6.5 结论

批终态 = clean（设计评审轮 1 changes-required → 修正轮-1 全修 → 轮 2 pass → 轮 3 同态复核 pass · 反证闭环齐 · 全链绿 · 三层收正链收束）。
