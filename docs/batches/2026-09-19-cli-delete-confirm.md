# 批：2026-09-19 · CLI 端删除二次确认（台账 #96）

**状态行**：🔄 进行中（设计轮 · eng-designer）

> 批次边界：交付目标 = 「**CLI 端删除类入口亦须一次显式确认**」（与 VSC 端 F-W17 同判据：不可复得 ⇒ 须确认）；条目集 = 用户 2026-09-19 08:21 逐字「**应该补。**」（承 08:1x「你先现在做的这些删除确认是cli/vsc两端都实现的吧？」的澄清 ⇒ 父侧实核 = **CLI 端未做**）。
> 前情 = VSC 侧三批 `2026-09-18-vsc-key-delete-confirm.md`（已收口）· `2026-09-18-vsc-mcp-delete-confirm.md`（已收口）· `2026-09-19-vsc-provider-delete-confirm.md`（在途）——**本批为其 CLI 对位**（跨端判据一致，实现各自独立）。

## §1 批次任务（父侧）

**状态行**：🔄 进行中（设计轮 · eng-designer）

> 形态说明（父侧自正 · 2026-09-19 08:2x）：状态行**必居 §1 段内**——`batch_segment` 解析域 = `## §1` 标题到下一个 `## §N`（`thincoder-core/agent-tools/batch-segment.mjs:98-110`），仅置档头 ⇒ `status = unknown` ⇒ fail-closed 拒写（设计 id=136 实核）。档案头行保留双置。

### 1.1 目标与理由

用户 08:1x 问「删除确认是 CLI/VSC 两端都实现的吧？」——父侧实核答：**只在 VSC 端**。CLI 端两条同类入口（provider 删除、MCP server 删除）**函数体内未见确认步骤**，且 provider 删除会**连带丢弃其 `apiKey` 原文**（与 VSC #95 同险）。用户 08:21「应该补。」⇒ 本批。

### 1.2 本批覆盖的条目（逐条可交付）

| # | 入口 | 现状（父侧实读 · 见 §1.3） | 本批交付 |
|---|---|---|---|
| ① | **provider 删除**（`/model` → Remove Provider） | `thincoder-cli/src/tui/model-picker.mjs:374` `removeProviderFlow()`——picker 选中 ⇒ **直接 `persistRaw` splice + 级联清引用** ⇒ 其 `apiKey` 一并消失；**函数体内未见确认** | 选中后**一次显式确认**（形式由设计裁：picker 二次确认项 / 确认行 / 复用既有确认件——若 CLI 已有确认模式须复用，禁新造） |
| ② | **MCP server 删除**（`/mcp`） | `thincoder-cli/src/tui/cmd-mcp.mjs:88-98`——`persistRaw` filter + `removeMcpTools` + `[mcp] xxx removed`；**调用侧是否有确认 = 未核** | 同判据入确认门（若调用侧已有确认 ⇒ 登记为「已覆盖」并给坐标；不得重复加） |
| ③ | **独立「删 key」入口** | 父侧 `grep` 未见（`setKeyFlow`（`model-picker.mjs:398`）是**设** key） | 实核后逐条处置（无 ⇒ 写「无此入口」；有 ⇒ 入册过门） |

### 1.3 已知事实（父侧只读探索 · 勿重查）

- `removeProviderFlow()`：候选 = `agent.providers` 排除 `agent.activeProvider`（当前激活不可删）；`persistRaw` fresh-raw splice + `cascadeRemoveProvider(raw, se.name)`；落盘后同步清内存镜像（`agent.providers.splice` + 再跑级联 + `agent.config.advisor?.provider === se.name` 时 `delete`）。
- **行数实况（设计 id=136 实核 · 覆盖父侧旧记）**：`model-picker.mjs` = **498（wc-l）/ 499（raw）**；`cmd-mcp.mjs` = **394（wc-l）/ 395（raw）**——**均远未越 500 硬限**（§1.3 旧记「cmd-mcp 500 行」**失实、作废**；原探索口径把 `model-picker` 的 499 误记到 `cmd-mcp`）。
- `cascadeRemoveProvider` 清 `consultModels` / `subagentModels` / `advisor.provider` 三处悬挂引用（**其完整实现与导出位置 = 待核**）。
- MCP 删除为「先盘后存」（fresh-raw filter，不整节写回内存——避免抹掉 `keptConnected` 尾巴）；随后 `removeMcpTools(agent, name)`。
- CLI 既有「确认/选择」原语 = `showPicker`（`model-picker.mjs` 在用）——**CLI 是否有专用确认件 = 待核**。

### 1.4 本批不做

- 不改 VSC 端（三批各自独立）。
- 不改删除语义本体（级联清理、先盘后存、内存镜像收正逐条保持）。
- 不取撤销机制（承用户 21:07 口径）。

### 1.5 验收口径

1. **可机判 · 逐条**：① provider 删除 ⇒ 选中后**不立即落盘**；确认 ⇒ 落盘 + 级联；取消 ⇒ **零落盘 ∧ 零内存变更**；② MCP 删除同（或有既有确认则给出坐标）；③ 独立删 key 入口实核结论。
2. **零回归锚**：级联清理三处 · 先盘后存语义 · 内存镜像收正 · `activeProvider` 不可删。
3. `thincoder-cli` 测试全绿（`npm test`）+ lint OK + `doc-check` 按档归属零新增。

## §2 批次任务与设计

（eng-designer 写）

**来源与本段地位**（eng-designer · 设计轮 id=136 · **重投** as-of 2026-09-19 08:3x）：本段 = 首投资料正文（判据表 / 待核四项结论 / 受影响文件表 / 用例表 CD-1…CD-10 + 先红读数 / 零回归锚四条 / 上抛六项）**逐字重投**，
并逐条标注父侧裁定（见 §2.8）。首投被拒原因 = §1 段内缺**状态行**（`batch_segment` 解析域 = `## §1` 标题到下一个 `## §N`——`thincoder-core/agent-tools/batch-segment.mjs:98-110` ⇒ `status = unknown` ⇒ fail-closed 拒写）；
**父侧已补**（§1 段内 `:10`）——本段为其解除后的重投；**不重跑探索 · 不重做设计 · 设计档零改 · §1 零改**。

### 2.1 落点（单源 · D2）

| 面 | 落点 | 状态（as-of 本轮实读） |
|---|---|---|
| 设计档 | `docs/cli/design/TUI-COMMANDS.md` **§5.4「删除类入口显式确认门」**（`:123-162`）+ §1 模块地图 `pickers.mjs` 行（`:30`）+ 变更记录（`:194-196`） | ✅ 已落盘（**204 / 205 行**） |
| 需求档 | `docs/cli/requirements/TUI.md` —— **F14「删除类入口显式确认」**（五要素：判据句 = 不可复得 ⇒ 一次显式确认；判定句 = 选中不落盘 / 确认落盘 / 取消零落盘；范围边界 = 表单清空保存类不做门；设计回指 = `TUI-COMMANDS.md` §5.4；与 VSC `F-W17` 同判据） | ⏳ **父侧笔**（实读仍 F1–F13——见 §2.8 第 1 行裁定） |
| 用例宿主 | `thincoder-cli/test/cli-delete-confirm.test.mjs`（拟新增，驱动手法承 `test/tui-selection-surfaces.test.mjs:34-43` 的 `createPickers` 装配 + `test/provider-admission.test.mjs` 的真 TUI 路径） | ⏳ 实现轮 |

### 2.2 判据表（条目 / 门位 · `file:line` / 判据）

| 条目 | 修法（门位 · `file:line`） | 判据 |
|---|---|---|
| **① 渠道删除**（`/model` → Remove Provider） | `thincoder-cli/src/tui/model-picker.mjs:381`（`if (!se) return`）与 `:382`（`persistRaw`）**之间**插门（+1 行；`removeProviderFlow` 本体 `:374`；**单一调用点 `:73` 零改**） | 选中 ⇒ **不落盘**；确认 ⇒ 落盘 + 级联逐字执行；取消 / Esc ⇒ **零落盘 ∧ 零内存变更** |
| **② MCP server 删除**（`/mcp`） | `thincoder-cli/src/tui/cmd-mcp.mjs:87`（注释块后）与 `:88`（`persistRaw`）**之间**插门（+1 行；`removeServer` 本体 `:84`；**单一收口覆盖两条路径** = 直参 `:331` / 子菜单 `:389`） | 同 ①；取消 ⇒ 零落盘 ∧ 零内存 ∧ **无** `[mcp] … removed` 输出行（`:97`） |
| **③ 独立「删 key」入口** | 无代码面（**实核 = 不存在**） | 「无此入口」结论入 §5.4 入口册末条 + CD-9 计数（名单数 = 2） |
| **确认件（形态复用 · 禁新造模态）** | `thincoder-cli/src/tui/pickers.mjs` 新增绑定 `confirmDelete`（`showPicker(<问句>?, [Yes, "Cancel"], { defaultIndex: 1 })`）——与 `cmd-clear.mjs:6-9` · `cmd-new.mjs:30-33` **逐字同形**；装配经 ctx（`pickers.mjs:111-114` → `index.mjs:409-411` · `:426`） | CD-4（`defaultIndex == 1` ∧ `items[1].action === "no"`）· **缺键 ⇒ 报错不降级直删**（fail-closed） |

### 2.3 待核项结论（四条 · 逐条实核 · 承 §1.3 待核标记）

1. **② MCP 调用侧是否已有确认 = 无**（真 TUI 路径实跑）：菜单路径 picker 序列 = `MCP → MCP: srv2`（**无第三面**）后即落盘；直参 `/mcp remove srv1` **零 picker** 直接落盘。⇒ **入确认门**，门位 = `cmd-mcp.mjs:84` `removeServer`（两路径单一收口）。
2. **③ 独立「删 key」入口 = 不存在**：`setKeyFlow`（`model-picker.mjs:398`）与 `/config` embedding key（`cmd-config.mjs:38-41`）均属**设** key（空输入直接 `return`、不写盘）；**CLI 域**（`thincoder-cli/src/**`）`removeKey|deleteKey|delKey|clearKey` grep **零命中**（实核 as-of 08:3x；仓内他域仅 VSC 侧 `_delKey` 死 handler——已在 VSC 批 F-W17 入口册，与本批无涉）⇒ key 原文消失路径只有 ①②（已入册），**无第三入口待门**。
3. **CLI 既有确认件 = 有 ⇒ 必须复用**：`cmd-clear.mjs:6-9`（`"Clear screen?"` + `defaultIndex: 1`）· `cmd-new.mjs:30-33`（`"Start new session?"`）——形态 = Yes / Cancel 二次 picker，**非新模态**；本批把该形态收口为单点 `confirmDelete`（D2 单一权威源）。
4. **`cascadeRemoveProvider` 完整实现与导出位置** = `thincoder-cli/src/tui/model-picker.mjs:475-498`（JSDoc `:475-479` · `export function` **`:480`** · 函数体 `:481-497` · **文件尾**）——纯 mutate，清 `agent.consultModels` / `agent.subagentModels[role]`（`=== name` 或 `name:` 前缀）/ `agent.advisor.provider` 三处，空数组 / 空对象键删除。

### 2.4 受影响文件表（行数 as-of 本轮末实测 · 口径 = `wc -l`）

| # | 文件 | 现况 → 预估（Δ） | 面 |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/pickers.mjs` | **117** → **~128**（+11） | `confirmDelete` 单源 + ctx / 返回装配（键追加既有行） |
| 2 | `thincoder-cli/src/tui/model-picker.mjs` | **498** → **499**（+1） | 落盘前插门（单行）——**500 硬限：未越（余量 1）** |
| 3 | `thincoder-cli/src/tui/cmd-mcp.mjs` | **394** → **395**（+1） | `removeServer` 落盘前插门（单行）——距硬限 105 行 |
| 4 | `thincoder-cli/src/tui/index.mjs` | **482** → **482**（**+0**） | 追加进既有装配行（`createPickers` 解构行 + slash ctx 行） |
| 5 | `thincoder-cli/test/cli-delete-confirm.test.mjs`（拟新增） | — → ~150 | 用例宿主 CD-1…CD-10 |
| 6 | `docs/cli/design/TUI-COMMANDS.md` | 159 → **204**（+45 · **已落盘实读**） | §5.4 + §1 模块地图 + 变更记录 |
| 7 | **零改面** | — | `cmd-clear.mjs`(22) · `cmd-new.mjs`(38) · `cmd-mcp-form.mjs` · `interaction.mjs` · `config-helpers.mjs` · `thincoder-core/**` · 需求档（父侧笔）· VSC 端全档 · `_archive/**` |

**500 硬限结论**：`model-picker.mjs` 净增 **+1**（单行门）⇒ 落 **499**——**两口径皆未越**（wc-l 499 / raw 500）。
**拆分方案（触发式 · 已写死 · 不预拆）**：实现轮末实读 **> 500** ⇒ 当场把渠道管理四流（add / remove / key / context ≈100 行）析出为 `thincoder-cli/src/tui/provider-admin.mjs`
（`createProviderAdmin(ctx)` 装配型，同 `createModelPicker` 先例）——预估 `model-picker.mjs` → ~390、新档 ~115、`pickers.mjs` 装配 +3 行 + §1 地图同批回写。

### 2.5 用例表（CD-1…CD-10 · 正常 / 边界 / 反例 / 结构对账）+ 先红读数

**驱动 = 真 TUI 路径 + 真 `persistRaw`**（`createConfigHelpers(agent, { configPath })` 注入 + 逐面脚本化 `showPicker`，零夹具手写；型同 `test/provider-admission.test.mjs`）。

| 编号 | 组 | 输入 / 动作 | 期望（断言级） | **先红读数（本席实跑 · as-of 设计轮）** |
|---|---|---|---|---|
| CD-1 | 正常 ① · **必红** | 真 `openModelPicker` → Remove Provider → 选 deepseek → 确认面 Yes | 恰 1 确认面 ∧ 磁盘 providers 无 deepseek ∧ 级联三处清 ∧ 内存镜像同步 | picker 序列 = `Models & Providers → Remove Provider`（**无第三面**）∧ 磁盘 = `["kimi"]` ∧ `apiKey` 原文 = `null`（**选中即落盘**） |
| CD-2 | **反例 ①（取消 ⇒ 零落盘）** · **必红** | 同上 → Cancel | 磁盘字节逐字同操作前 ∧ `agent.providers` 长度不变 ∧ `persistRaw` 零调用 | 确认面**不存在** ⇒ 「取消」路径为空域（现态选中即删） |
| CD-3 | 边界 ① · Esc（返回 null） · **必红** | 确认面返回 null | 同 CD-2 | 同上（空域） |
| CD-4 | 边界 ① · 默认落点 · **必红** | 读确认面 `defaultIndex` / items | `== 1` ∧ `items[1].action === "no"` | 无确认面可读 |
| CD-5 | 正常 ② · 菜单 · **必红** | 真 `handleMcpCommand(ctx, [])` → server 行 → Remove → Yes | 恰 1 确认面 ∧ 磁盘无 srv2 ∧ 无 srv2 工具 | 序列 = `MCP → MCP: srv2`（无第三面）∧ 磁盘 `["srv1"]` ∧ 输出 `[mcp] srv2 removed` |
| CD-6 | 反例 ② · 菜单取消 · **必红** | 同 CD-5 → Cancel | 磁盘字节零变 ∧ 内存 servers 不变 ∧ **无** `removed` 行 | 空域 |
| CD-7 | 正常 ② · 直参 · **必红** | `handleMcpCommand(ctx, ["remove", "srv1"])` → Yes | 恰 1 确认面 ∧ 磁盘无 srv1 | **零 picker** ∧ 磁盘 `["srv2"]` ∧ `token` 原文 `null` |
| CD-8 | 反例 ② · 直参取消 · **必红** | 同 CD-7 → Cancel | 零落盘 ∧ 零内存变更 ∧ 无 `removed` 行 | 空域 |
| CD-9 | 结构对账（fail-closed · 代理判据） | 扫 `thincoder-cli/src/tui/**`：删条写点数（`providers` splice / `mcp.servers` filter）== 名单数（**2**）∧ 各写点所在入口内 `confirmDelete(` ≥1 | 逐名过门 ∧ 计数漂移 ⇒ 红 + 点名 ∧ 域外正控 `session gc` 在 | 两入口 gated **0 / 2**（**红**） |
| CD-10 | 零回归锚 · **恒绿** | CD-1 / CD-5 后读盘 + 内存 | 级联三处同清 · 先盘后存顺序 · 内存镜像收正 · `activeProvider` 不可删 | 现态恒绿（语义本体零改） |

**先红档** = CD-1…CD-9（9 例，读数见右列）；**恒绿档** = CD-10 + 既有全量（`thincoder-cli/test/**` 无任何用例驱动删除流 ⇒ 既有档零触达——本席实核）。

### 2.6 验收标准（AC-CL-1…AC-CL-5 · 可机判 · 逐条回指 §1.5 与需求 F14）

| # | 验收（机判口径） | 承 | 判据用例 |
|---|---|---|---|
| AC-CL-1 | 渠道删除：选中 ⇒ **不落盘**；确认 ⇒ 落盘 + 级联三处逐字执行；取消 / Esc ⇒ **零落盘 ∧ 零内存变更** | §1.5-1① · F14 判定句 | CD-1 / CD-2 / CD-3 |
| AC-CL-2 | MCP 删除（两路径单一收口）：同 AC-CL-1；取消 ⇒ 另加「无 `[mcp] … removed` 行」 | §1.5-1② · F14 判定句 | CD-5 / CD-6 / CD-7 / CD-8 |
| AC-CL-3 | 确认件单源 `pickers.mjs` `confirmDelete` ∧ 形态 = Yes/Cancel 二次 picker ∧ `defaultIndex == 1`（反误触）∧ 缺键 fail-closed 报错、**不降级直删** | §5.4 契约 · §1.2 ① | CD-4 + 缺键例 |
| AC-CL-4 | 独立「删 key」入口 = **不存在**（实核结论入 §5.4 入口册 + 结构对账计数 = 2） | §1.5-1③ | CD-9 |
| AC-CL-5 | **零回归锚四条**（§2.7）+ `thincoder-cli` 测试全绿（`npm test`）+ lint OK + `doc-check` 按档归属**零新增** | §1.5-2 / §1.5-3 | CD-10 + 全量 |

### 2.7 零回归锚（§1.5-2 逐条 · 本体逐字零改）

级联清理三处（`consultModels` / `subagentModels[role]` / `advisor.provider`）· 先盘后存（`persistRaw` 落盘 → 内存镜像 / 工具表收尾）· 内存镜像收正（`agent.providers.splice` + 二次级联 + `advisor` 双处）· `activeProvider` 不可删（`candidates` 排除 + `Remove provider…` 行 `length > 1` 才出）——**门只加在落盘之前**。

### 2.8 上抛六项 + 父侧裁定（as-of 2026-09-19 08:2x · 父侧逐条已裁）

| # | 上抛事项 | 父侧裁定 | 落位 |
|---|---|---|---|
| 1 | **需求档 F14 缺位**：`docs/cli/requirements/TUI.md` 现 F1–F13 无「删除类入口显式确认」条目 | **父侧笔落 F14**（判据句 = 不可复得 ⇒ 一次显式确认；范围边界 = 表单清空保存类不做门）——本段标注即可 | `docs/cli/requirements/TUI.md`（父侧执行；实读尚未落） |
| 2 | **批档 §1 计数失实**：`cmd-mcp.mjs` 实核 **394 / 395**，非 §1 旧记「500 行」 | **父侧已收正**（§1.3 现记 394/395 并注「旧记失实、作废」） | 本档 §1.3 |
| 3 | **直参路径是否同门**：`/mcp remove <name>` 未点名确认 | **同门**（单一收口，与 VSC 两载体同判据）；「**显式点名 = 已确认**」属 `--force` 语义 ⇒ **需用户新裁**，本批**不自行放宽** | §5.4 入口册第 3 行 · §2.2 ② · CD-7 / CD-8 |
| 4 | **表单清空保存类是否设门**（MCP `token` / `headers` / `env` 清空后保存） | **保持不设门**（登记边界：编辑面 ≠ 选中即生效的删除入口） | §5.4 判据域边界第 1 条 |
| 5 | **`thincoder session gc --confirm`**（非 TUI 面） | **已覆盖**（自带显式旗标 ⇒ 登记，不入本批写域） | §5.4 入口册第 4 行 |
| 6 | **批档 §1 骨架缺状态行**（阻塞 §2 落地） | **父侧已补**（§1 段内 `:10`）——本段即解除后的重投 | 本档 §1 |

**本席自证**：本段 = 首投资料逐字重投 + 父侧裁定标注；**零新语义 · 零新探索 · 设计档 / §1 / 需求档零触碰**；上抛 3 的「`--force` 语义」面**未自行放宽**（待用户新裁）。

## §3 设计评审记录

（评审子代理写）

### 轮次 1（评审子代理）

**评审对象**：`docs/cli/design/TUI-COMMANDS.md`（§5.4 / §1 地图 / 变更记录）· `docs/batches/2026-09-19-cli-delete-confirm.md`（§1–§2）。未声明项目标准档与文档地图 ⇒ 文档归属判据降级；方法学按 Project Guide（`AGENTS.md`）+ 评审判据判。为核 §2.2 / §2.4 的坐标与行数声明，抽读设计所引源档（`thincoder-cli/src/tui/{model-picker,cmd-mcp,pickers,index,slash-commands,config-helpers,cmd-clear,cmd-new,cmd-config}.mjs` · `test/{tui-selection-surfaces,provider-admission,consult-models-softfail}.test.mjs` · `thincoder-cli/package.json` · `docs/vsc/requirements/WEBVIEW.md` · `docs/cli/requirements/TUI.md` · `docs/core/requirements/PROJECT.md`）——仅作证据抽核，未作评审对象；CD-1…CD-10 先红读数 = 设计轮声明，本席未复跑。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage · 协调项 | 🟡 | 需求侧锚点缺位：`thincoder/docs/cli/requirements/TUI.md:22-34` 实读只 F1–F13、全档无「删除 / 确认」字样，而设计档 §5.4 已落盘（`thincoder/docs/cli/design/TUI-COMMANDS.md:123-162`）；§5.4 判据源只写用户逐字 + VSC F-W17（`:127`）。批档已上抛并得父侧裁定（`thincoder/docs/batches/2026-09-19-cli-delete-confirm.md:59` · `:131`）⇒ 协调项、非缺陷 | F14 落盘后，在 §5.4 判据源行补需求侧回指（F14），使三链（批档 §1.2 / 设计 §5.4 / 需求 F14）逐条可对账 |
| 2 | Document ownership | 🟡 | 「同判据」宣称与 VSC 侧现行判据句不同源：`thincoder/docs/vsc/requirements/WEBVIEW.md:34` 现文 =「**所有删除入口**（密钥 / 令牌 / MCP 行 / provider 行）均须过一次显式确认——「单击即删」类**已空域**」，本档 `TUI-COMMANDS.md:160` 走类判据（「可复得类不做门」）；两者等价的前提 = CLI 域「可复得类删除入口」为空集，而入口册（`:142-149`）未给该结论（域内实存他类删除入口：`thincoder/thincoder-cli/src/tui/cmd-config.mjs:155` 清 proxy · `:231-235` 删 consultModels 条目） | 在 §5.4 补一行 `≙` 对位映射句（型同 `thincoder/docs/vsc/design/SETTINGS.md:168`），并把「可复得类」实核清单（含上述两处）写进判据域边界句，使判据句与入口册同读一致 |
| 3 | Affected-file size / tier | 🟡 | 行数实读对得上（`model-picker.mjs` 499 raw / `cmd-mcp.mjs` 395 raw / `pickers.mjs` 117 / `index.mjs` 483 raw），但 tier 分析只算文件层且把 `model-picker.mjs` 的 Δ 假定为严格 +1（`docs/batches/2026-09-19-cli-delete-confirm.md:83-90`）：同批须触碰的 ctx JSDoc 键列（`thincoder/thincoder-cli/src/tui/model-picker.mjs:12-13`）每加一行即 raw 501 ⇒ 触发设计自设的延迟拆分；函数层未提——`createModelPicker` 本体 `:21-473`（453 行） | 拆分触发改为按「含 ctx 解构（`:22`）与 ctx JSDoc 在内的实际 Δ 实读」判定；拆分方案句补函数层落点（四流析出同时缩短 `createModelPicker`——把该收益写进方案句） |
| 4 | Acceptance criteria（可机判性） | 🟡 | CD-9 计数单位歧义：`docs/batches/2026-09-19-cli-delete-confirm.md:108` 写「删条写点数（`providers` splice / `mcp.servers` filter）== 名单数（2）」，而域内该两类写点实为 4 处（`thincoder/thincoder-cli/src/tui/model-picker.mjs:385` · `:389` · `cmd-mcp.mjs:91` · `:93`）⇒ 按字面出现次数统计必然 4 ≠ 2（构造性红）；同表先红读数却按入口计（「两入口 gated 0 / 2」） | CD-9 明示计数单位 = 按入口（函数）归组、非逐次出现，并写「一入口多写点」的归组规则 |
| 5 | Test / evidence precision | 🔵 | 批档 `:111`「`thincoder-cli/test/**` 无任何用例驱动删除流 ⇒ 既有档零触达」过宽：`thincoder/thincoder-cli/test/consult-models-softfail.test.mjs:78-89` 以同型 mutate（`writeConfigAtomic` + `cascadeRemoveProvider`，自述「removeProviderFlow persistRaw mutate 同型」）驱动同一写路径——不触插入点，故结论成立 | 措辞收正为「无用例驱动 `removeProviderFlow` / `removeServer` 本体（两者非导出）」，并把该档列入恒绿锚（级联零回归） |
| 6 | 机检面覆盖范围 | 🔵 | `TUI-COMMANDS.md:162`「fail-closed：未登记入口 ⇒ 红 + 点名」强于机制：CD-9 只扫 `providers` splice / `mcp.servers` filter 两种写点模式，他形态删除写点（别的键 filter / splice）不会被判红 | 该句限定为「本域两种写点模式内 fail-closed」，或补一条域内写点模式清单（新增模式时同批扩表） |

**正向核验（无发现）**：`pickers.mjs` 现无 `confirmDelete`（117 行；`:116` 返回面可直接挂绑定）；两门位实点存在（`model-picker.mjs:381`/`:382` 之间 · `cmd-mcp.mjs:87`/`:88` 之间）；两路径单一收口（`removeProviderFlow` 仅 `:73` 调用 · `removeServer` 收口 `:331`/`:389`）；先例形态逐字同源（`cmd-clear.mjs:6-9` · `cmd-new.mjs:30-33`）；确认面为独立一层（`:73` 与 `cmd-mcp.mjs:389` 处 picker 栈已空——上层 picker 均已 await 弹出，无 `closePicker()` 误弹风险）；`index.mjs` 零改可行（`slash-commands.mjs:108` `handlerCtx = { ...ctx }` 透传 ⇒ slash-commands.mjs 无需改，受影响表未列它是对的）；测试驱动面双向可缝（`cmd-mcp.mjs:60-61` `ctx.configPath` · `config-helpers.mjs:8-9` `createConfigHelpers(agent,{configPath})` · `test/tui-selection-surfaces.test.mjs:34-43` 装配型 · `test/provider-admission.test.mjs:15-22` 真 TUI 路径）；「独立删 key 入口不存在」成立（`thincoder-cli/src/tui` 内 `removeKey|deleteKey|delKey|clearKey` 零命中；`model-picker.mjs:398` `setKeyFlow` 与 `cmd-config.mjs:38-41` 均为设 key）；`cascadeRemoveProvider` 坐标逐字对（`model-picker.mjs:475-498`，`export function` `:480`）；`session gc --confirm` 在（`thincoder-cli/bin/thincoder.mjs:118`）；无行宽 lint 约束（`thincoder-cli/package.json:39` = `scripts/check-syntax.mjs`）⇒「追加进既有行 = +0 行」的算术成立。

**范围外注（不评 severity）**：`docs/core/requirements/PROJECT.md:33`（C6）仍写「删除 = 列出非 active 的 provider」——本批（及 VSC provider 批）后该流程句缺确认步；设计 / 批档未登记该跨档回指（他档，仅登记）。

**计数**：🔴 0 · 🟡 4 · 🔵 2 · 范围外注 1（发现表 6 行）。

VERDICT: pass

## §4 用户批准

**2026-09-19 08:21 用户逐字裁定** —— 「**应该补。**」（承 08:1x 端面澄清：VSC 已做三批、CLI 未做 ⇒ 本批补 CLI 对位。）

## §5 实施与修正记录

（eng-coder 写）

**实现轮（eng-coder）· as-of 2026-09-19 08:5x · 状态 = 已实现（内部审计 + advisor 代码评审均已跑 · 终态 = clean）**

### 5.1 交付摘要（逐条对 §2.2 判据表）

- **确认件单源**：`pickers.mjs:113-119` 新增 `confirmDelete(question = "Delete?")` = `showPicker(<问句>, [{Yes, delete, action:"yes"}, {Cancel, action:"no"}], { defaultIndex: 1 })` ⇒ `e?.action === "yes"`——
  形态与 `cmd-clear.mjs:6-9` · `cmd-new.mjs:30-33` **逐字同形**（零新造模态：未触 key-handler / 渲染面 / 键位）。
  装配 = `:126` 追加进既有行 + `:129` 返回面给出（两处均改既有行 ⇒ **+0 行**）。
- **门位①（渠道删除）**：`model-picker.mjs:382` = `if (!(await confirmDelete(\`Remove provider ${se.name}?\`))) return`，插在 `:381`（`if (!se) return`）与 `:383`（`persistRaw`）之间（**+1 行**）；单一调用点 `:73` 零改。
- **门位②（MCP server 删除）**：`cmd-mcp.mjs:88` = `if (!(await confirmDelete(\`Remove MCP server "${name}"?\`))) return`，插在注释块后、`:89`（`persistRaw`）前（**+1 行**）；单一收口覆盖两路径（直参 `:332` / 子菜单 `:390`）。
- **ctx 透传（+0 行）**：`index.mjs:409`（createPickers 解构 append）· `:426`（slash ctx append）→ `slash-commands.mjs:108` `handlerCtx = { ...ctx }`（该档零改）→ `cmd-mcp.mjs:53` 取得；`/model` 侧经 `cmd-model.mjs:13` 同一闭包。
- **缺键 fail-closed**：两消费点 ctx 解构默认值 = 抛错桩（同文案 `ctx.confirmDelete missing — deletion refused (fail-closed)`）——缺键 ⇒ 入口报错、**零落盘**（不降级直删）；落点 `model-picker.mjs:22` · `cmd-mcp.mjs:53`。
- **③ 独立「删 key」入口**：实核结论仍 = **不存在**（本席独立扫 `src/tui/**` 写点 + `removeKey|deleteKey|delKey|clearKey` 零命中）——CD-9 名单数 = **2**。

### 5.2 受影响表（文件 / 改动 / Δ 实测 · wc-l 与 raw 双口径）

| # | 文件 | 改动 | 实测 |
|---|---|---|---|
| 1 | `thincoder-cli/src/tui/pickers.mjs` | `confirmDelete` 单源 + 装配（改既有行两处 +0） | 117 → **130 wc-l / 131 raw**（Δ +13；预估 ~128） |
| 2 | `thincoder-cli/src/tui/model-picker.mjs` | 落盘前插门（单行）+ JSDoc/ctx 两处改既有行 | 498 → **499 wc-l / 500 raw**（Δ +1 · 逐字命中；**≤500 raw 未越**） |
| 3 | `thincoder-cli/src/tui/cmd-mcp.mjs` | `removeServer` 落盘前插门（单行）+ 头注/ctx 两处改既有行 | 394 → **395 wc-l / 396 raw**（Δ +1 · 逐字命中） |
| 4 | `thincoder-cli/src/tui/index.mjs` | 两处追加进既有行（createPickers 解构 / slash ctx） | 482 → **482 wc-l / 483 raw**（**Δ +0 · 逐字命中**） |
| 5 | `thincoder-cli/test/cli-delete-confirm.test.mjs` | 新建（CD-1…CD-10 + 缺键两例 = 12 例） | 0 → **385 wc-l / 386 raw**（预估 ~150；<500 建议线内） |
| 6 | **零改面** | — | `cmd-clear.mjs` · `cmd-new.mjs` · `interaction.mjs` · `thincoder-core/**` · 设计档 · 需求档 · VSC 端 · `_archive/**`（hash 实证见 5.5） |

**500 硬限结论**：`model-picker.mjs` raw 500 ≤ 500 ⇒ **拆分方案未触发**（设计触发条件 = >500）；余量 0（后续任何 +1 行即越限）。

### 5.3 先红读数（真 TUI 路径 + 真 `persistRaw` · 未改代码时实跑 · 原样记录）

命令 = `cd thincoder-cli && node --test test/cli-delete-confirm.test.mjs` ⇒ **tests 12 / pass 1 / fail 11**（CD-1…CD-9 红 + 缺键两例红；CD-10 恒绿档已绿）。

| 档 | 失败读数（原样） |
|---|---|
| CD-1…CD-4 | `picker 面未出现：确认面（当前 = Models & Providers · 已见 = Models & Providers → Remove Provider → Models & Providers）`（= 选中即落盘、无第三面） |
| CD-5 / CD-6 | `确认面未出现：MCP → MCP: srv2 → MCP` |
| CD-7 / CD-8 | `picker 面未出现：确认面（直参）（当前 = null · 已见 = ）`（= 零 picker 直接落盘） |
| CD-9 | `cmd-mcp.mjs:removeServer 写点（行 91/93）之前无 confirmDelete( 门`（两入口 gated **0 / 2**） |
| 缺键 ×2 | `Missing expected rejection: 缺门 ⇒ 报错（非静默放行）`（现态静默直删） |

### 5.4 用例读数（修后）

- `node --test test/cli-delete-confirm.test.mjs` ⇒ **tests 12 / pass 12 / fail 0**（CD-1…CD-10 + 缺键两例逐条绿）。
- `npm run lint`（`node scripts/check-syntax.mjs`）⇒ **check-syntax: 189 file(s) OK**。
- `npm test`（= `node test/run.mjs` 全量）⇒ **tests 714 / pass 713 / fail 1 / skipped 0**；唯一失败 = `test/memory-scan-bounds.test.mjs:333` T-Y4 真时探针——
  **改动前基线即红**（开工前全量 702/701/1，逐字同档；三次读数 267 / 272 / 265 ms vs 阈值 300 ms）⇒ 环境敏感型、与变更面零 import 耦合 ⇒ **非本批引致**（已上抛 5.8-①）。
- `doc-check`（`node scripts/doc-check.mjs --root .`）：锚 **5 悬空** / 行宽 **12**——与开工基线同值 ⇒ **按档归属零新增**（本轮五档在该报面零命中）。

### 5.5 零改面证明（非 git 等价判据 = sha256 内容哈希 · 十六位截断）

| 档 | 开工基线（08:40 实读） | 收工复读 | 判定 |
|---|---|---|---|
| `thincoder-cli/src/tui/cmd-clear.mjs` | `43acb56234fc1a35` | 同值 | ✓ 零改 |
| `thincoder-cli/src/tui/cmd-new.mjs` | `8f0d617dfb4cd11b` | 同值 | ✓ 零改 |
| `thincoder-cli/src/tui/interaction.mjs` | `f6984c1768c4426f` | 同值 | ✓ 零改 |
| `thincoder-core/**`（251 档 / 42072 wc-l 聚合指纹） | `f9a134491d9cf9c4` | 同值 | ✓ 零改 |

### 5.6 审计与代码评审轮次 + 终态

| 轮 | 对象 | 结论 | 处置 |
|---|---|---|---|
| 内部探索审计（explore · 只读 · 1 轮） | 交付五档 vs 批档 §2 + 设计 §5.4 | PARTIAL 0 · SILENT-SIMPLIFICATION 0 · OUT-OF-LIST 0 · DOC-DRIFT 3（均 🔵：设计档调用点 `:331`→`:332` / `:389`→`:390` · `setKeyFlow :398`→`:399` = 插门 +1 位移；§2.4 两项预估；§5.4 `:162` 机检面句强于 CD-9 模式集） | 设计档 / 需求档非本席写域（D1）⇒ **只报不改**，交设计轮 / 父侧收正 |
| advisor 代码评审（1 轮 · 同步） | 五档 + 设计/批档 | 🔴 0 · 🟡 1 · 🔵 3 · **VERDICT: pass** | 🟡1 = AC-CL-5「npm test 全绿」未字面达成（既有红协调项）⇒ 上抛；🔵3 = 面记录器去重削弱「恰 1 确认面」⇒ **fix round 1 已修**；🔵2 / 🔵4 ⇒ 报告项、零动作 |
| **fix round 1**（唯一一轮） | 测试档 `waitPicker` / 新增 `rec` | 「恰 1 确认面」改**按 picker 对象身份**记录每次换面（连续同题两次不再被去重 ⇒ 双确认退化可判红） | 复跑 tests **12/12 绿** · 全量 **714/713/1**（同基线） |

**终态 = clean**：0 遗留 🔴 / 0 must-fix；残留 1 🟡（父侧裁定项）+ 3 🔵（报告项：两条设计档收正 + CD-9 边界自登记）。

### 5.7 决策透明表（自行裁定 / 偏离声明）

| # | 事项 | 处置 | 理由 |
|---|---|---|---|
| 1 | 批件「须登记 `test/files.mjs`」 | **不适用本仓 · 零动作** | CLI 无清单档（`test/run.mjs:9` 走 `test/*.test.mjs` + `test/integration/*.test.mjs` 两层 glob + 未收集档 fail-closed 自检）⇒ 新档落 `test/` 顶层即被执行；同族先例 = `2026-09-18-machine-check-closeout` 批「CLI 无清单」结清 |
| 2 | 缺键 fail-closed 落点 = ctx 解构默认值抛错桩（改既有行 · +0 行） | 未用独立守卫行 | `model-picker.mjs` raw 余量恰 1（499→500）——独立守卫行（净 +2）会触设计既定拆分触发；两消费点同文案、同在落盘前抛 |
| 3 | 门内问句文案（设计写 `<问句>?` 由调用方定） | 渠道 `Remove provider <name>?` · MCP `Remove MCP server "<name>"?`；Yes 行文案 `Yes, delete` | 先例同形（`Yes, …` + `Cancel`）；问句含目标名便于确认面自明 |
| 4 | 行数偏差 | 只记实测（5.2） | `pickers.mjs` +13（预估 ~128 → 130）· 测试档 385（预估 ~150）——预估为 `~` 值，验收口径 ≤500 raw 达成（`model-picker.mjs` 恰 500 raw） |

### 5.8 上抛（父侧 / 设计轮）

1. 🟡 **AC-CL-5 字面口径**：全量 1 例既有红（`test/memory-scan-bounds.test.mjs:333` T-Y4 真时探针，改动前基线即红）⇒ 需裁定「接受既有红登记」或另开微修轮。
2. 🔵 **设计档坐标随 +1 位移**：`TUI-COMMANDS.md:147`（调用点 `:389` → 实为 `:390`）· `:148`（`:331` → 实为 `:332`）· `:151`（`setKeyFlow :398` → 实为 `:399`）——设计轮收正（本席零改设计档）。
3. 🔵 **需求档 F14 仍未落盘**（承 §2.8-1）——父侧笔；落盘后三链（批档 §1.2 / 设计 §5.4 / 需求 F14）可对账。
4. 🔵 **§5.4 `:162` 机检面句与 CD-9 模式集强度差**（评审轮 1 #6 同源）——设计轮裁（限定句 = 本域两种写点模式内 fail-closed，或扩模式清单）。

**本席自证**：改动 = 声明的 5 档（4 源 + 1 测试档）；删除语义本体逐字零改（门只加在落盘之前）；未取撤销机制；`cmd-clear.mjs` / `cmd-new.mjs` / `interaction.mjs` / `thincoder-core/**` / 设计档 / 需求档 / VSC 端 / `_archive/**` 零写（hash 实证 5.5）。

## §6 验证与收口

**收口（2026-09-19 08:5x · 父侧直接执行）**

- **交付判据**：用户 08:21「应该补。」→ 立批 §1 → 设计 id=136/138 → 评审 **pass**（id=139 · 0🔴/4🟡/2🔵）→ 实现 id=140（终态 clean）⇒ **CLI 两条删除入口（provider / MCP）均入确认门，直参路径同门（父侧裁定）**。
- **父侧独立复跑**：`cli-delete-confirm` **12 pass / 0 fail**（与 coder 报数一致）。
- **验收读数**：CLI 全量 **714 tests / 713 pass / 1 fail**——唯一红 = `test/memory-scan-bounds.test.mjs:333` T-Y4 真时探针（267/272/265 ms vs 阈值 300 ms · **改动前基线即红**（702/701/1）· 环境敏感 · **与本批零耦合**）· lint OK（189 档）· `doc-check` 按档归属零新增。
- **先红（真 TUI 路径 + 真 `persistRaw`）**：**12 tests / 1 pass / 11 fail**——CD-1…CD-9 红（选中即落盘、无第三面；直参零 picker）+ 缺键两例红（现态静默直删）。
- **零改面（内容哈希）**：`cmd-clear.mjs` / `cmd-new.mjs` / `interaction.mjs` / `thincoder-core/**`（251 档聚合）四者前后同值。
- **行数**：`model-picker.mjs` raw **500 ≤ 500**（未触发拆分 · 余量 0 入册）；其余 386/396/483/131 raw 均 &lt;500。
- **既有红上抛（不静默）**：`memory-scan-bounds` T-Y4 时延探针基线红 ⇒ **登记为技术待办（消解路径 = 探针阈值/采样口径收正；到期 = 该档下次触碰）**——本批不修（与本批零耦合，且属跨批环境敏感面）。
- **坐标漂移（登记 · 待收正）**：`TUI-COMMANDS.md:147` `:389`→`:390` · `:148` `:331`→`:332` · `:151` `:398`→`:399`（随插门 +1）——消解路径 = 父侧文档卫生同笔。
- **其他上抛**：F14 未落盘（父侧笔）· §5.4 机检面句强度差（评审 🔵）· 批件「`test/files.mjs` 登记」对 CLI 不适用（本仓 `test/run.mjs:9` 两层 glob + 未收集档自检 ⇒ 新档自动执行）。
- **状态行**：✅ 已收口 2026-09-19（全档冻结）。
- **台账**：⚠️ **本批未入台账**——原文「#96 ⇒ 已核销」**不实**（该号未建，后已为他项占用）⇒ **交付记录以本档 §6 为准**；补登记待裁。（2026-09-19 22:0x 父侧自纠）
