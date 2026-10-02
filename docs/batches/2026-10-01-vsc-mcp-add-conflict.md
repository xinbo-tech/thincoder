# 2026-10-01 · VSC MCP add 冲突面小修 + streaming 缩进（#757 ∥ #789）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-01 · 来源 = 用户 2026-10-01 16:27「随便找几个任务折腾一下」——台账 #757 ∥ #789（VSC 小修）。
> 台账 = #757 ∥ #789（vsc · 归批）。前情 = docs/batches/2026-10-01-zero-semantic-sweep.md §6（已收口 2026-10-01）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**任务（父侧选批 · 用户 2026-10-01 16:27「随便找几个任务折腾一下」）**：

- **#757**：VSC MCP **新增冲突面**——新增服务器撞 mtime 冲突时，面板显示 `No MCP server named "…"`（update 回退串被误用——`thincoder-vscode/src/extension/panel-mcp.mjs:129 ∥ :151` 死面 + `panel-messages-settings.mjs:43` 链；既有形态、非本批引入）。收正方向 = **add 与 update 分流**（新增冲突 ⇒ 冲突语义明示，不误报不存在）。
- **#789**：`thincoder-vscode/webview/streaming.js:137` 缩进残面（#719 同族——零语义）。

**链**：设计（本档 §2）→ 评审 → 批准 → 实施（eng-coder）→ 收口。
**批内件纪律**：最小化——只为失败代价大的点写；一句话能说清的 = 设计里给父侧实读/实跑验证法即可，不写档。

**【勘误 · 父侧笔 · 2026-10-01】**：任务正文所书「`panel-mcp.mjs:129 ∥ :151` **死面**」经实施前实核**不成立**——两处为活面且语义正确（webview 实发 `testMcp ∥ reconnectMcp`；委托链 `chat-panel.mjs:345-347`）；缺陷真源 = `settings.mjs:298-302` → `updateMcpServer` → `config-mcp.mjs:43` 回退链（评审轮 1 发现 2 同判）。以 §2 归因为准；设计修复轮（发现 1 ∥ 2 收正）在跑。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（随动已落（MCP.md §6.10）· 验证脚本在盘已首跑（修前红录）· fix 轮（评审轮 1 发现 1 ∥ 2）逐号收正已落（§2 收正块 · 2026-10-01））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### §2 正文（eng-designer · 2026-10-01）

#### 2.1 本批条目（覆盖）

| # | 条目（台账） | 处置 |
|---|---|---|
| #757 | VSC MCP 新增冲突面：add 冲突误报「No MCP server named」 | **修**——add ∕ update 分流（只收正分流与串面） |
| #789 | `streaming.js:137` 缩进残面（#719 同族） | **修**——零语义缩进收正 |

- 两条目均 = 技术待办（台账 `kind=tech_todo` · 无 `req_doc`）——需求档五要素检查面 N/A；承接 = 批头事实源 + 台账行（`task_book` 均指本批档）。
- 明确不在本批：`panel-mcp.mjs:129 ∥ :151` ∥ `config-mcp.mjs:43 ∥ :68` 四处 `No MCP server named`（语义正确——零触）；webview 表单 ∕ 消息面（协议零改）；CLI `/mcp` 命令面（零触）；`config-mcp.mjs` CRUD 本体（零触）。

#### 2.2 机制设计（#757 · add ∕ update 分流）

**缺陷链（静态实读 + 实跑复现双证 · 坐标 2026-10-01 实读）**：
add 表单（`webview/settings-tools.js:138`）→ 消息 `saveMcpServer` → `handleSaveMcpServer`（`panel-messages-settings.mjs:41-45`）→ `chat-panel.mjs:354` → `panel-settings-push.mjs:37-39` → **`settings.mjs:298-302`**：`addMcpServer` 失败（任意原因）⇒ **无条件回落 `updateMcpServer`**。
新增撞 mtime 冲突时：add 的写被核 `writeConfigAtomic`（`config-io.mjs:63-79`——`t0 !== t1` 判）放弃 ⇒ `CONFIG_CONFLICT_HINT`；条目未落盘 ⇒ update `findIndex = -1` ⇒ 返 `No MCP server named "…"`（`config-mcp.mjs:43`）——冲突串被 not-found 串顶替。

**实跑红基线（本舱 · 2026-10-01 · 脚本见 2.5）**：`C add+conflict ⇒ "No MCP server named \"c\""`（盘面 `["a"]`——add 被弃）；对照 `D update+conflict ⇒ "config changed on disk concurrently — retry"`（update 面正确）。

**修复（落点 = `settings.mjs:295-302` 整块重写为）**：

```js
/** Add or update an MCP server (existing name → in-place update). Returns error string or null.
 *  F5/MCP.md §4：面板 [Edit] 复用同一表单——已存在即原位更新（CLI /mcp edit parity，
 *  保持数组序 + token 字段落盘）。分流按存在性判：add 侧失败（含并发冲突）原串上抛（#757）。 */
export function saveMcpServer(name, config) {
  if (loadMcpServers().some((s) => s.name === name)) return updateMcpServer(name, config)
  return addMcpServer(name, config)
}
```

（整块重写保持 8 行——净 ±0；函数起点 `:298` 不动 ⇒ `API-CONTRACT.md:2702` 锚零漂。）
修后冲突 ⇒ `CONFIG_CONFLICT_HINT` → `postProviderError`（`settings.mjs:311-313`）⇒ `reason:"mtime-conflict"` → webview 词表出词（`webview/settings.js:75`；`SETTINGS.md:434` REASON_WORD）——全部既有机制，零新面。

#### 2.3 机制设计（#789 · 缩进收正）

`streaming.js:137-142`（六行）缩进 6 空格 → 4 空格（`finish()` 内 `if (aborted) {`（`:128`）直层）。零语义、零 token 改、行数不变（184 → 184）。

#### 2.4 设计档随动（已落）

`docs/core/design/MCP.md` §6.10——**已落本舱**：
① `:143` 括注 `（add 失败（重复）则 update）` → `（已存在 ⇒ 原位 update；add 侧失败（含并发冲突）原串上抛）`；
② 变更记录 +1 行（`:218`——批名 ∕ 台账 #757）。档 218 → 219 行。

**报告不随拍**（上抛·发现 2）：§6.10 坐标族陈旧——`:140` `panel-mcp.mjs:96`（实读 `:106`）· `:142` `:116`（实读 `:126`）· `:147` `:12/:19/:37/:63`（实读 `:15/:22/:40/:66`）· `:149`「经 `persistRaw`」（实读 `vscPersistRaw`——`settings-panel-write.mjs:24-26`）。预存漂移、非本修所生——随该档下次实质触碰收正。

#### 2.5 受影响文件与测试面

| 文件 | 现状行数（实读） | 预期 delta | 说明 |
|---|---|---|---|
| `thincoder-vscode/src/extension/settings.mjs` | 371 | 371（±0） | `:295-302` 分流重写（同行长形）——函数起点 `:298` 不动 |
| `thincoder-vscode/webview/streaming.js` | 184 | 184（±0） | `:137-142` 缩进 |
| `docs/core/design/MCP.md` | 218 | 219（+1 · 已落） | 2.4 随动 |

**测试面 = 不写批内件**（批内件最小化纪律——分流一句话可述 + 失败代价面 = 消息选择；验证走 scratch 实跑）。
scratch 在盘：`thincoder-vscode/.thincoder/tmp/mcp-add-conflict-check.mjs`（工程辅面 · 不入仓——两层 `.gitignore` 已盖；A/B/C/D 四例自判 + 退出码；本舱已首跑）。
**注入陷阱（本舱实测）**：同 tick 双写 `mtimeMs` 相等（差 = 0）⇒ 窗内写必须 `utimesSync` 强制前推（+2s），否则注入假绿——已固化进脚本头。

#### 2.6 验证法（父侧实读 ∕ 实跑）

- **V1（实跑 · 主腿）**：`node thincoder-vscode/.thincoder/tmp/mcp-add-conflict-check.mjs` ⇒ 修后 **ALL GREEN (4/4)** + exit 0；修前态（本舱已录）= A/B/D PASS ∥ C FAIL（`No MCP server named "c"`）+ exit 1。
- **V2（实读 · 串面）**：`saveMcpServer` 体内零 `No MCP server named`；全仓存活点 = 4 处（`config-mcp.mjs:43/:68` ∥ `panel-mcp.mjs:129/:151`——均语义正确）。
- **V3（可选 · 端到端）**：`handleSaveMcpServer` 冲突臂（#695 件同构驱动）⇒ 恰一条 `{type:"providerError",scope:"mcp",reason:"mtime-conflict"}`。
- **V4（#789）**：`git diff` 仅缩进行（token 零改）+ `node --check` 过。

#### 2.7 验收对照（回指条目）

- AC-757-①（分流生效 · 机读）：V1 C 例 PASS——新名 + 冲突 ⇒ `CONFIG_CONFLICT_HINT`（修前红已实证在案）。
- AC-757-②（零回归 · 机读）：V1 A/B/D 例 PASS（净写 ∕ 更新 ∕ 更新冲突）。
- AC-757-③（串面收正 · 实读）：V2。
- AC-757-④（可选腿）：V3。
- AC-789-①（零语义）：V4。
- AC-DOC-①：MCP.md §6.10 括注 ∥ 变更记录行与修后实现一致（实读互证）。

#### 2.8 案例表

| 类 | 输入 | 期望输出 |
|---|---|---|
| 正常 | 新名 + config（净写） | `null` + 条目落尾（A） |
| 正常 | 既有名 + config | `null` + 原位替换 + 序保持 + 空 transport 回落（B） |
| 边界 | add 表单撞既有名 | 转 update（同旧行为——表单复用语义保留） |
| 错误（本修） | **新名 + mtime 冲突** | `CONFIG_CONFLICT_HINT` → 词化句（C：修前红已实证） |
| 错误 | 既有名 + mtime 冲突 | 同左（D——update 面既有） |
| 边界 | 竞态：存在性检查后他端落同名 | `MCP server "…" already exists` 原串上抛（旧：静默转 update 覆盖）——登记 |

#### 2.9 边界（不做）

- 不改 webview 协议 ∕ 表单（`saveMcpServer` ∥ `editMcp` 消息与载荷零改）；不新增 reason 码（复用既有 `mtime-conflict` 词表）；不动四处既有串面；不动 CLI `/mcp` 命令面；不拆档（`settings.mjs` 371 越 300 顾问线——既有「在册裁定不拆」沿守，本修净 ±0 不恶化）。
- 不迁移 CLI 严格 add（`cmd-mcp-form.mjs:191-193` add 撞名拒）到面板——表单复用语义（F5/MCP.md §4）零改。

#### 2.10 关键决策

- **KD-1 分流判据 = 存在性**（`loadMcpServers().some`）。否决：① 错误串匹配（跨模块字面量耦合——`config-mcp.mjs:24` 串改即静默破）；② 失败后复查存在性（他端窗内落同名 ⇒ 误判重复 ⇒ 转 update 静默覆盖他端条目）；③ 消息面严格分流（`saveMcpServer` 严格 add ∕ `editMcp` 严格 update——改既有 add 撞名行为，超残项射程）。
- **KD-2 不写批内件**（理由 + scratch 实跑见 2.5）。
- **KD-3 随动 = 一行级**：只落「本修所生之陈旧」（括注）；预存坐标漂移报告不随拍。

#### 2.11 上抛 ∕ 发现（逐条）

1. **批头坐标勘误**：`panel-mcp.mjs:129 ∥ :151` 实为活面且语义正确（webview 实发 reconnect ∕ test——`settings-tools.js:222/:227`；委托链 `chat-panel.mjs:345-347` 在位）。缺陷真源 = `config-mcp.mjs:43` 经 `settings.mjs:298-302` 回退链——修面据此定。§1 表述含「死面」字样，请父侧知悉口径。
2. §6.10 坐标族陈旧（清单见 2.4）——预存漂移，报告不随拍。
3. `panel-mcp.mjs:161` 注「saveMcpServer duplicate→update 语义」= 同族措辞（修后仍可读通——add 撞名仍落 update）；非阻塞，随该档下次触碰。
4. 注入陷阱：同 tick `mtimeMs` 相等 ⇒ 不推 mtime 的冲突注入假绿（已固化进脚本头 + 2.5）。
5. §1 仍为模板占位（主 agent 段）——本舱按 dispatch + 批头事实源执行；如 §1 补写与本 §2 相抵，以上抛面为准另裁。
6. #695 旧件（`docs/batches/2026-09-30-vsc-cleanup-695.test.mjs:18-20`）「站⑨ 限 update 分支」注记 = 历史冻结；修后 add 分支成为可注入面（该件 D 同构腿修后仍绿——本舱实读），零动作。

**2.11 附注（读回时点补记）**：本读回时 §1 已由主 agent 补入任务正文（`:9-15`；状态行 ∕ 骨架占位行 `:6/:7` 仍在）——第 5 条「§1 仍为模板占位」应读作「§1 骨架占位行仍在（`:7`）」。§1 任务正文与 §2 无相抵；唯 `:11` 的坐标口径勘误见第 1 条（`panel-mcp.mjs:129 ∥ :151` 实为活面且语义正确）。

**§2 收正块（fix 轮 · 评审轮 1 发现 1 ∥ 2 · 2026-10-01）**：

- **收正 1（发现 1 · 采纳选项 B——同行长形）**：§2.2 修法收正为**同行长形**（形改零语义——两形行为等价；存在性检查落局部 const；`:295-302` 块 8 行 ∥ 函数 5 行不变 ⇒ `settings.mjs` 保持 **371 行**）：

```js
/** Add or update an MCP server (existing name → in-place update). Returns error string or null.
 *  F5/MCP.md §4：面板 [Edit] 复用同一表单——已存在即原位更新（CLI /mcp edit parity，
 *  保持数组序 + token 字段落盘）。分流按存在性判：add 侧失败（含并发冲突）原串上抛（#757）。 */
export function saveMcpServer(name, config) {
  const exists = loadMcpServers().some((s) => s.name === name)
  if (exists) return updateMcpServer(name, config)
  return addMcpServer(name, config)
}
```

  **判由（评审发现 1 采纳 ∥ 锚零漂）**：原净 −1 形令 `:302` 以下行号上移 ⇒ `docs/core/design/API-CONTRACT.md:2703-2708` 六条生成区引用（`:304 ∥ :311 ∥ :316 ∥ :325 ∥ :329 ∥ :341`）陈旧，而 `scripts/api-contract.mjs --check` 为报告态、不入闸 ⇒ 漂移静默落档；同行长形 ⇒ **全锚零漂**（`API-CONTRACT.md:2703-2708` 保持对位；评审另注之 `docs/vsc/design/SETTINGS.md:438` 预存漂移（本就偏 2）亦不再叠漂）。
  **随动 · 受影响面表（§2.5）**：`settings.mjs` 行 = **371 → 371（±0）**——判由 = 评审发现 1 采纳 ∥ 锚零漂；说明 = `:295-302` 分流重写（同行长形）——函数起点 `:298` 不动。
  **随动 · §2.9**：括句「本修净 −1 不恶化」⇒「本修 ±0 不恶化」。
  **随动 · KD ∥ 案例表（§2.10 ∥ §2.8）**：零变——KD-1 判据 ∥ 否决项 ∥ KD-3 随动口径均不变（同一 `loadMcpServers().some`；局部 const 绑定 = 同行长形之形）；§2.8 案例表逐行行为等价（存在性先行判、单次求值）。
  **生效面**：实施轮按本块——§2.2 所列形 ∥「净 −1」括注（`:55`）∥ §2.5 表「370（−1）」（`:74`）∥ §2.9「净 −1」括句（`:111`）均以本块为准。
- **收正 2（发现 2）**：§2.11 附注（`:129`）句「§1 任务正文与 §2 无相抵」收正为「§1 任务正文与 §2 **已勘误**（见上抛 1——`panel-mcp.mjs:129 ∥ :151` 实为活面且语义正确；真源 = `settings.mjs:298-302` 回退链）」。`§1:11` 原文 = 父侧域（本轮零触；父侧勘误块 `§1:17` 在盘）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面**：批档 §1–§2 全文 ∥ `docs/core/design/MCP.md`（§6.10 + 变更记录）。抽核实读（设计所引坐标逐条落盘复核）：`settings.mjs:291-314`（371 行）· `webview/streaming.js:117-160`（184 行）· `src/config-mcp.mjs` · `panel-mcp.mjs:95-167` · `panel-messages-settings.mjs:40-52` · `settings-panel-write.mjs:18-26` · `webview/settings.js:62-83` · `webview/settings-tools.js:137-138 ∥ :215-229` · `chat-panel.mjs:344-355` · `panel-settings-push.mjs:37-39` · `thincoder-core/config-io.mjs:59-99`（`t0 !== t1` ∥ `CONFIG_CONFLICT_HINT :42`）· `API-CONTRACT.md:2701-2708` · scratch `thincoder-vscode/.thincoder/tmp/mcp-add-conflict-check.mjs`（在盘，判据读毕与设计所述一致）。
**抽核结论（受影响面行数注解）**：`settings.mjs` 371（−1 → 370）∥ `streaming.js` 184（±0）∥ `MCP.md` 219（+1 已落）——与实读一致 ✓；`settings.mjs` 越 300 顾问线但「在册裁定不拆」已在册（`docs/batches/2026-09-30-vsc-cleanup.md:343`），本修净 −1 不恶化 → 无拆分计划缺口。**批头勘误实核**：`panel-mcp.mjs:129 ∥ :151` 为活面（webview 实发 `testMcp ∥ reconnectMcp`——`settings-tools.js:222 ∥ :227`）⇒ §2.11·1 收正向成立；缺陷真链 `settings.mjs:298-302 → updateMcpServer → config-mcp.mjs:43` 逐段实读成立（修前 C 例红基线复现路径一致）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc/coordination | 🟡 | 落点 `settings.mjs:295-302` 整块重写净 −1 ⇒ `:302` 以下全档行号上移 1：`API-CONTRACT.md` 生成区 :2703–:2708（`deleteMcpServer` :304 · `postProviderError` :311 · `pushStatus` :316 · `lastModelsPayload` :325 · `endProbeWindow…` :329 · `fullStatus` :341）将陈旧 −1；设计只记「`:2702` 锚零漂」（该行确不动），受影响面表无生成区行，且 `scripts/api-contract.mjs --check` = 报告态不入闸（脚本头 `:3`）⇒ 漂移静默落档（同族预存漂移另见 `docs/vsc/design/SETTINGS.md:438` 的 `settings.mjs:309-312`——本就偏 2，将再偏 1） | 二选一：把生成区刷新（`node scripts/api-contract.mjs --write`）列入受影响面 ∕ 收口清单；或改用同行长改写形（存在性检查落局部 const，函数体保持 5 行）⇒ 文件保持 371 行、全部锚零漂 |
| 2 | Doc state（§1↔§2） | 🟡 | 批档 `:11`（§1）仍把缺陷归于 `panel-mcp.mjs:129 ∥ :151`「死面」+ `panel-messages-settings.mjs:43` 链；实读证明该两处为活面且语义正确（webview 实发 `testMcp ∥ reconnectMcp`），真源 = `settings.mjs:298-302` 回退链——§2.11 附注（`:127`）却称「§1 任务正文与 §2 无相抵」；上抛 1 已披露口径，但 `:11` 原文未收正 ⇒ 档内两种缺陷归因并存 | 把 `:11` 措辞收正到实核归因，或把附注「无相抵」改为显式「已勘误（见上抛 1）」——使本档只存一种缺陷归因（零代码影响） |
| 3 | Acceptance criteria | 🔵 | AC-757-③/V2 非判别腿：`No MCP server named` 字面量本就不在 `saveMcpServer` 体内（修前亦不在——串自 `updateMcpServer` → `config-mcp.mjs:43` 返出）⇒ V2 修前修后同绿，只证零旁触；用户可见面（面板出词而非英文串）落在可选腿 V3 | 保留 V2 但标注其为「零旁触」面；若要以证据（而非推理）闭环症状，补跑 V3——出词链已实核在位（`settings.mjs:311-313` → `webview/settings.js:74-76`） |
| 4 | Doc hygiene（批档） | 🔵 | 骨架占位残留：`:7`（§1）与 `:19`（§2）两条 `<§N 模板占位…>` 仍在盘，`:6` §1 状态行为「🔄 进行中（…）」；设计自报只提 §1 占位，未提 §2 自身占位（批工具视为合法模板行，不阻塞写） | 各段落定 ∕ 收口时填入或清掉两条占位行与状态行省略号——合法 ≠ 应留存 |
| 5 | Evidence notes | 🔵 | 本评审未能独立复核者：① 台账行字段（`kind=tech_todo` ∕ 无 `req_doc`——本评审工具面无台账读通道）；② V1 修前红 ∕ 修后绿实跑（脚本在盘且判据读毕与设计一致，但本评审无执行通道，取设计记录） | 无需动作；登记以便下游知道这两条 = 设计记录而非本评复现 |

**VERDICT: pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 3）

## §4 用户批准（主 agent）

**代签（父侧 · 2026-10-01）**：依据 = 用户全链自动授权 + **评审 pass**（0🔴 ∥ 2🟡 ∥ 3🔵——发现 1 采纳选项 B（同行长形·零锚漂）∥ 发现 2 勘误双落（§2.11 收正 + §1 父侧勘误块）+ 设计修复轮（#13）落定经核）。**批准范围** = §2 全（含收正块 `:131-151` 为准面）：`settings.mjs:295-302` 同行长形分流 ∥ `streaming.js:137-142` 缩进。实施 = eng-coder 单舱（2 档 + scratch 验证脚本在盘）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（审计 CLEAN ∥ 评审 pass ∥ fix round 0 · 2026-10-01）

### §5 正文（eng-coder · 2026-10-01）

#### 5.1 实施摘要（两档产品码 · 按准面）

- **#757**：`thincoder-vscode/src/extension/settings.mjs:295-302`——`saveMcpServer` = 存在性分流（`const exists = loadMcpServers().some((s) => s.name === name)` ⇒ `exists` 走 `updateMcpServer` ∥ 否则 `addMcpServer` 原串上抛）。**同行长形**：8 行块 ∥ 函数 5 行 ∥ 函数起点 `:298` 不动。新块与批档 §2 收正块（`:136-143`）**逐字一致**（机械比对：8/8 行相等）。文件 **371 行 ±0**（read 口径）。
- **#789**：`thincoder-vscode/webview/streaming.js:137-142`——缩进 6 → 4 空格（零语义）。改动行**恰** `:137-142`；每行仅缩进差、余内容逐字不变（修前快照机械比对）。文件 **184 行 ±0**。
- **零旁触**：设计档（含 `MCP.md` §6.10）∥ `API-CONTRACT.md` ∥ 其余源码 = 零写；锚零漂实测 = `deleteMcpServer:304 ∥ postProviderError:311 ∥ pushStatus:316`（对位 `API-CONTRACT.md:2702-2708` 生成区）。

#### 5.2 实跑读数（对 §2.7）

| 腿 | 命令 | 读数 |
|---|---|---|
| AC-757-①/②（V1） | `node thincoder-vscode/.thincoder/tmp/mcp-add-conflict-check.mjs` | **ALL GREEN (4/4)** · exit 0；C 例 `r="config changed on disk concurrently — retry"`（修前红基线见 §2.2）；B 序保持 `["a","b"]` |
| AC-789-①（V4） | `node --check` ×2（两档） | exit 0 · 无输出；改动面 = 纯缩进（5.1） |
| AC-757-③（V2） | grep `No MCP server named` 全仓 | `settings.mjs` 零中；代码存活点恰 4 处（`config-mcp.mjs:43 ∥ :68` ∥ `panel-mcp.mjs:129 ∥ :151`） |
| 邻证（一次性补跑） | `node --test docs/batches/2026-09-30-vsc-cleanup-695.test.mjs` | **23/23 pass**（含 T1 ⑨ mcp save 冲突腿——本链邻近回归面） |
| AC-757-④（V3 · 可选） | — | **未跑**（可选腿；出词链静态在案——`settings.mjs:311-313` → `webview/settings.js:75` → locales） |

（本舱以 execute（scriptFile ∥ nodeArgs）等价跑法执行——脚本头用法同形。）

#### 5.3 决策透明表

| # | 决策 | 取法 ∥ 依据 |
|---|---|---|
| D-1 | 修前基线 = **快照件** | 工作树先于本批已脏（149 M 文件；`streaming.js` 预存 hunk `:125-126` 非本批）⇒ `git diff` 无法单独呈现本批改动面。落 `thincoder-vscode/.thincoder/tmp/pre-757-settings.mjs.snap ∥ pre-757-streaming.js.snap`（工程辅面 · 不入仓）作机械比对基。**保留在盘供 §6 复算**。 |
| D-2 | 比对判据（机械） | `settings.mjs`：改动行 ⊆ `:295-302` ∧ 新块 vs 批档收正块逐字等 ∧ 行数相等；`streaming.js`：改动行 = `:137-142` ∧ 逐行 6→4 空格 ∧ 余字节等 ∧ 行数相等。 |
| D-3 | 邻件补跑 = 一次性 | `-695.test.mjs`（#695 批内件）覆盖本链邻近回归面——补跑一枚读数（非批内件、非仓套件）。 |
| D-4 | §2 正文旧形（`:55/:74/:111`）= **不收正** | §2 = eng-designer 段（一段一作者 · append-only）——转父侧文档层（评审发现 1，见 5.4）。 |

#### 5.4 审计与代码评审（轮次 ∥ 终态）

**内部偏离审计（explore · 轮次 1）**：**CLEAN**——四类（未实现面 ∥ 静默简化 ∥ 设计外变更 ∥ 文档漂移）零发现。实读核：两档 vs 准面逐字一致 ∥ 文档面零触 ∥ 锚对位（`:298/:304/:311/:316/:325/:329/:341`）∥ 行数账吻合（371/184）∥ 串面 4 存活点。_披露：审计舱无执行 ∥ git 通道——其独立可及面 = lint（node --check）两档 + 实读 + 快照对位；V1 读数取本舱记录。_

**内部代码评审（advisor · code · 轮次 1）**：**pass**（0🔴 ∥ 3🟡——均非 must-fix ∥ **fix round 0**）。响应表：

| # | 发现（🟡） | 处置 |
|---|---|---|
| 1 | §2 正文三处旧形 ∥ 旧行数（`:55`「净 −1」· `:74`「370（−1）」· `:111`「净 −1」）与收正块（371 ±0）并存 | 不修（非本段 · 一段一作者）——转父侧文档层随 §6 收口 |
| 2 | §5/§6 两段空（机读证据无载体） | 已响应——本轮落 §5（本段）；§6 属父侧 |
| 3 | `settings.mjs` 371 行越 300 顾问线（机械条款） | 无动作——在册裁定不拆（R3 不复议）∥ 本批 ±0 未恶化 |

域外注（评审 · 无动作）：`SETTINGS.md:438` 预存偏移（`:309-312` vs 实测 `:311-313`——本批零漂、未叠）∥ `-695.test.mjs` 头注历史措辞（§2.11·6 登记）。

**终态：clean**（审计 1 轮 CLEAN ∥ 评审 1 轮 pass ∥ fix round 0；无未决项）。

#### 5.5 披露 ∥ 未及面

- **辅面写（非产品面）**：仅两份修前快照（5.3 D-1 路径；不入仓 · 保留供 §6）；其余零写。
- **未及面**：V3 可选腿未跑；仓套件未跑（父侧收口腿——本舱只跑变更触发面）。
- **行数口径**：本文 371/184 = read 工具口径（含尾空行）；`\n` 计数 370/183——两口径修前 ∥ 修后均 ±0。

## §6 验证与收口（父代理）

**收口轮（父侧 · 2026-10-01）**

① **父侧亲跑验证**（独立于舱内）：`node thincoder-vscode/.thincoder/tmp/mcp-add-conflict-check.mjs` ⇒ **ALL GREEN (4/4)**（修前 C 红在案）∥ 两档 `node --check` ✓ ∥ `settings.mjs:295-302` 读回 = 收正块逐字（8 行 —— 371/370 两口径均 ±0）∥ `streaming.js:137-142` 纯缩进（零语义）。
② **§2 残句收正**（父侧直执行 · 机械 · 可 revert）：`:55` ∥ `:74` ∥ `:111` 三处旧形（净 −1 ∥ 370）⇒ 现形（净 ±0 ∥ 371）——失效表达删除（不再依赖生效面条款）。
③ **上抛处置**：`MCP.md §6.10` 坐标族陈旧（预存漂移 ∥ 非本修所生——§2.4 已登记，随该档下次实质触碰）；`SETTINGS.md:438` 预存偏 2（本批零漂）——域外注，零动作。
④ **域外如实**：V3 可选腿未跑（V1/V2 已闭合）∥ 仓套件 = 空清单（沿在册）——父侧收口腿。
⑤ **台账结算**：#757/#789 → 已核销（经 待核销）。

**收口完成 ⇒ 冻结。**
