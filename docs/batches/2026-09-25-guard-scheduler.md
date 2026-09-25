# 2026-09-25 · guard-scheduler
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 12:57「这七批都派出去」——技术待办排批 · 批 6/7：守卫·调度轮（条目 #327/#309）。
> 台账 = #327 / #309（技术待办 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（任务书指针 = 本档 §2 · 条目细节以台账 evidence 为准）：

| # | 条目 | 要点 | 面 |
|---|---|---|---|
| #327 | 工具钩子守卫不对称族 | 核 `agent/dispatch.mjs:201` · `record-results.mjs:149`；VSC `execute-tools.mjs:188/:349` · `tool-gates.mjs:94` · `rules-face.mjs:101`——六点未守卫 + `args=null` 边界 + 同参两通道形态分歧 + `touchedPaths=[]` 消费面后果 | 核 + VSC |
| #309 | 任务书跨投递（异步队列同文件等待） | #4 消费了 #6 的任务文本——候选：task↔batchDoc 启动校验 / 出队重绑 / 跨批 §段 拒绝 | 核 |

**边界**：核 dispatch / 子代理调度面；#327 的修形若与已批 E1 文本冲突须走设计裁定（条目 evidence ⑤ 在案）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（initial 轮 · 2026-09-25 · 写域 = 设计档四份 + 本档 §2 · 零产品码触碰）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：✅ 设计完成 · 2026-09-25（initial 轮 · 写域 = 设计档四份 + 本档 §2 · 零产品码触碰）

### 2.1 本批条目（覆盖 · 台账 #327 / #309）

| # | 条目 | 设计形（一句） | 落点 |
|---|---|---|---|
| #327 | 工具钩子守卫不对称族 + `args=null` 边界 | 单源谓词 `toolTouchPaths`（零抛 · `args` 规范化）+ 两树十处消费点对齐 + 桥路由判据归一（同参两通道同归宿）+ 「该调用必败」前提机检 | `docs/core/design/TOOLS.md` §6.17（决策 D-TO12）· `docs/core/design/EDIT.md` §5/§6/§7/§8（D-6/D-8） |
| #309 | 任务书跨投递（异步队列同文件等待） | 批次档写门（containment）+ 条目自携与双点留痕（可诊断性）+ task↔batchDoc 观测留痕 + 串扰回归锁；**根因未定（如实登记）** | `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29 · `docs/core/design/BATCH-RECORD.md` §4.2（指针行） |

**本批不做（边界 · 明确排除）**：`touchedPaths` 钩子本体零改（`thincoder-core/tools/file.mjs` 零碰）· 门禁对空路径集的判据零改（T-22 语义保持）· 不新增工具面标记 / 配置开关 · 不改 `batch` 工具段白名单与档绑定面 · 不改 `subagent` 面板 / status 数据面 · 不改 send / escalate / consult 族面 · 不修一个未定位的根因（#309 只落 containment + 可诊断性）· 提示词面零触（产品代码——主 agent 权）· 需求档零触（主 agent 笔）。

### 2.2 机制设计

**#327-A · 单源提取谓词（`docs/core/design/TOOLS.md` §6.17 裁定 1）**：`toolTouchPaths(tool, args)` 落 `thincoder-core/agent/helpers.mjs`（与 `FILE_MUTATORS` / 子代排除集同址——两树共引的守卫谓词面）。
契约：`args` 非 null 对象 ⇒ 规范化为 `{}` 再交钩子；有钩子 ⇒ 钩子裁决（try/catch 兜底）；无钩子 ⇒ `[args.path]` 兜底；钩子 throw / 返回非数组 ⇒ `[]`；**不过滤非字符串项**（「未知路径 ⇒ 保守」判据归门禁自身）。

**#327-B · 消费点对齐（十处 = 核 6 · VSC 4）**：未守卫七处（`thincoder-core/agent/dispatch.mjs:201` 工程设计闸 · `thincoder-core/agent/record-results.mjs:149` · `thincoder-core/peer-domains.mjs:81`；`thincoder-vscode/src/agent/execute-tools.mjs:349` · `thincoder-vscode/src/agent/tool-gates.mjs:26`〔`l3TouchedPaths`〕· `:94` · `thincoder-vscode/src/agent/rules-face.mjs:101`）+ 台账点名的调用方 `thincoder-vscode/src/agent/execute-tools.mjs:188` 一律改调谓词（行为变更 = `args = null` 从裸抛变为成形结果）；已守卫三处（`thincoder-core/agent/dispatch.mjs:127` · `:232` · `thincoder-core/agent.mjs:401`）零变对齐（其 try/catch 外壳退休——谓词内部即保险）。

**#327-C · 判据归一（同参两通道同归宿）**：ACP 桥 `edit` 路由判据由 `Array.isArray(args?.edits)` 改为**真值判**（与核 `execute` 同判据，`thincoder-cli/src/acp/bridge.mjs:311`/`:313`）——`edits` 真值 ⇒ 批量分支（共享容器守卫、同一错误面）；假值 ⇒ 单形态面。分歧窄形态（真值非数组 + 合法单形态参数）此后两通道同拒，「桥径单形态应用」分支消除。

**#327-D · 前提机检（不改已批判据）**：`[]` 零触达语义以「该调用必败」为支撑——以用例固定该前提：`FILE_MUTATORS` 六成员 × 畸形入参（`args = null`；`edit` 的 `edits` 真值非数组）⇒ `execute` 返回 `Error:` 且目标文件零变更。
`thincoder-core/tools/file.mjs:257` 容器守卫与 #325 E1 文本**零改**；候选保守形 `args.path ? [args.path] : []` **否决**（掩盖真因 = 通道判据分歧）。

**#309-A · 批次档写门（containment · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29.1）**：工程角色子代理（`depth > 0` ∧ `agent._batchDoc` 在场）写**批次档文件**（目标落 `batchDocBases(cwd)` 任一基底内）且目标 ≠ 绑定档 ⇒ 拒绝（fail-closed）；比较键 = 绝对路径 + win32 大小写归一。
判据本体 = `thincoder-core/agent/write-gate.mjs` 新导出 `batchRecordWriteConflict(agent, depth, absPaths)`（与 `freezeWindowConflict` 同址——写前判据单源；基底集按 run 记忆化）；落点 = 核 `thincoder-core/agent/dispatch.mjs` Phase 1（与冻结窗同区、共用同一路径集）/ VSC `thincoder-vscode/src/agent/tool-gates.mjs` 的 `preGateBlocked`。
分层：`batch` 工具绑定面管**段维度**（身份 → 可写段白名单）；本门管**档维度**——绑定档**之外**的同族文件此前无门（`write` / `edit` 直写批档 = 绕过工具绑定的通道 = 本实例的损害通道）。

**#309-B · 条目自携 + 双点留痕（可诊断性 · §6.29.2）**：`executeAsyncSpawn` 在条目上记 `_batchDoc`（= `child._batchDoc ?? null`）与 `_taskSeal`（任务书文本 12 hex 摘要——不留全文）；`child:spawn`（既有）与 `child:start`（新，条目实际启动点）键面同为 `{ role, id, batchDocBase, taskSeal }`（基名 + 摘要，零内容）——事后可对账「哪条任务书在哪个 id 下起跑」。「以条目记录重建 payload」原形**否决**（启动路径已按条目闭包取值 = 等价已重绑；重建 = 无收益结构重写）。

**#309-C · task↔batchDoc 观测留痕（不阻断 · §6.29.3）**：`thincoder-core/agent-tools/subagent-spawn.mjs` 门区扫描任务书中的批次档路径 token（经 `resolveBatchReadPath` 解析）命中**存在且 ≠ 绑定档** ⇒ 留痕一条（含两侧基名），spawn 照常放行。**硬拒否决**：任务书合法引用他批档是常态（前情指针 / 证据引用——台账 #309 evidence 自身即引 qwen 批档 §1.9）⇒ 硬拒 = 假拒面。

**#309-D · 串扰回归锁（§6.29.4）**：「每条目启动消费自携 payload」以用例固定——同 `files` 域两条目（任务书 / 绑定档各异）⇒ 逐条 `_batchDoc` / `_taskSeal` = spawn 入参、两条目互不相等、启动序 = 先入者。

### 2.3 关键决策

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| KD-GS1（#327） | 钩子消费 = **单源谓词 + 判据归一**（落 `thincoder-core/agent/helpers.mjs`） | 五份守卫形态 = 下轮漂移源；否决逐点 try/catch · 否决钩子内抛成形文案（#325 D-6 已否） · 否决核侧迁就桥（弱化容器守卫） · 否决新叶档（谓词与 `FILE_MUTATORS` 同址消费面最近）。全文 = `docs/core/design/TOOLS.md` §6.17 / D-TO12 |
| KD-GS2（#327④） | 与已批 E1 文本的张力处置 = **恢复前提**（归一通道），不改判据 | 真因 = 通道判据分歧，非 `[]` 本身；改 `[]` 为保守形 = 掩盖真因 + 违 T-22 空路径集语义（否决） |
| KD-GS3（#309） | 三形合一（containment + 可诊断性 + 回归锁）；**不声称修根因** | 现码内未见跨投递路径（payload 逐条目闭包捕获）+ 事件侧无轨迹 ⇒ containment 与可诊断性为正解；否决「出队重绑」原形（无收益重写）· 否决 task↔batchDoc 硬拒（假拒面） |
| KD-GS4（#309） | 写门 = **档维度**；`batch` 工具 = **段维度**（分层不重叠） | 段白名单管「身份 → 可写段」，文件维度无门 = 直写通道裸露；指针落 `docs/core/design/BATCH-RECORD.md` §4.2（D2——不重述） |

### 2.4 受影响文件与测试面（现况 = 本轮实测 · 口径 = `split("\n").length - 1`）

| 文件 | 现况 | Δ 预估（⇒ 实施后 ≈） | 条目 | 说明 |
|---|---|---|---|---|
| `thincoder-core/agent/helpers.mjs` | 431 | +≈27 ⇒ 458 | #327 | `toolTouchPaths` 谓词 + 注（>300 已登记档——登记面零改） |
| `thincoder-core/agent/dispatch.mjs` | 496 | +≈3 ⇒ 499 | #327+#309 | 两处替换净 −1 · 写门 + 拒因分支 +4；**余量 1 行**——拆分计划见下 |
| `thincoder-core/agent/record-results.mjs` | 174 | +≈4 ⇒ 178 | #327 | 解析与提取同 try（对齐 `thincoder-core/agent.mjs:399-406` 既有形态）+ 谓词调用 |
| `thincoder-core/agent.mjs` | 443 | ±0 ⇒ 443 | #327 | 中断分支改谓词调用（行数不变） |
| `thincoder-core/peer-domains.mjs` | 298 | +1 ⇒ 299 | #327 | 谓词调用替换（贴 300 软线——实施轮不得再增） |
| `thincoder-core/agent/write-gate.mjs` | 88 | +≈34 ⇒ 122 | #309 | `batchRecordWriteConflict` 谓词 + 基底记忆化 + 注 |
| `thincoder-core/agent-tools/subagent-run.mjs` | 208 | +≈12 ⇒ 220 | #309 | 条目自携两字段 + `child:start` 留痕 |
| `thincoder-core/agent-tools/subagent-spawn.mjs` | 407 | +≈14 ⇒ 421 | #309 | spawn 点留痕扩键 + task↔batchDoc 观测留痕（门区） |
| `thincoder-vscode/src/agent/tool-gates.mjs` | 165 | +≈11 ⇒ 176 | #327+#309 | `l3TouchedPaths` 转谓词 · 设计闸转谓词 · 批次档写门 |
| `thincoder-vscode/src/agent/execute-tools.mjs` | 417 | +1 ⇒ 418 | #327 | 记账面谓词调用 |
| `thincoder-vscode/src/agent/rules-face.mjs` | 116 | +1 ⇒ 117 | #327 | 谓词调用 |
| `thincoder-cli/src/acp/bridge.mjs` | 394 | +1 ⇒ 395 | #327 | `edit` 路由判据归一（真值判单点取值） |
| `thincoder-core/test/touch-paths.test.mjs` | 新档 | ≈70 | #327 | 谓词直驱（正常 / 边界 / 错误） |
| `thincoder-core/test/batch-record-write-gate.test.mjs` | 新档 | ≈95 | #309 | 写门判据直驱（命中 / 放行 / 边界） |
| `thincoder-cli/test/portability-classification.test.mjs` | 179 | +≈20 ⇒ 199 | #327 | T-22 族扩：`args = null` 两态 + 消费面零裸抛 |
| `thincoder-vscode/test/portability-vsc-classification.test.mjs` | 183 | +≈20 ⇒ 203 | #327+#309 | 同族两例 + 端侧写门一例 |
| `thincoder-cli/test/edit-tool-improvement.test.mjs` | 446 | +≈18 ⇒ 464 | #327 | 窄形态两通道同拒 + 前提机检（用例 42 → 45） |
| `thincoder-cli/test/queue-payload-binding.test.mjs` | 新档 | ≈75 | #309 | 串扰回归锁（同域两条目自携 payload） |

**设计档（本批写域 · 设计轮已落）**：`docs/core/design/TOOLS.md` 1039 → ≈1115（§6.17 + D-TO12 + 变更记录）· `docs/core/design/EDIT.md` 138 → ≈145（§5 两条 · §6 续扫 · §7 用例 42→45 · §8 D-6/D-8 · 变更记录）· `docs/core/design/AGENT-LOOP-SUBAGENT.md` 917 → ≈954（§6.29 + 变更记录）· `docs/core/design/BATCH-RECORD.md` 432 → ≈434（§4.2 指针行 + 变更记录）。
**零改面**：`thincoder-core/tools/file.mjs`（钩子本体）· `thincoder-core/tools/edit-diff.mjs` / `edit-batch.mjs`（守卫与文案单源）· `thincoder-core/agent-tools/batch*.mjs`（`batch` 工具语义）· `thincoder-core/agent-tools/subagent-scheduler.mjs`（调度判据——#309 只加白名单外的自携字段）· 提示词面 · 需求档 · `thincoder-core/test/subagent-scheduler.test.mjs`（既有例零改）。VSC 侧 `thincoder-vscode/test/edit-tool-improvement.test.mjs` 零改（守卫在核）。

**拆分计划（dispatch.mjs 贴 500 硬限）**：本批不拆（499 在限内）；**触发 = 该档任一次净增使其 ≥500（硬限红）或该档下次实质改动** ⇒ 拆分位 = Phase-1 三处写前门（工程设计闸 / D5 冻结窗 / 批次档写门）外提 `thincoder-core/agent/pre-write-gates.mjs`（预估 ≈60 行；dispatch 侧留调用点 ≈10 行 ⇒ 回 ≈455）；实施轮若越 499 即触发（不得带红收口）。`thincoder-core/agent/helpers.mjs` 458 与 `thincoder-core/agent/write-gate.mjs` 122 档位注记随登记面既有口径（前者 >300 已登记、后者 ≤300 免登记）。

### 2.5 用例表（正常 / 边界 / 错误 · 机判）

| # | 类 | 场景 | 输入 | 期望（机判） | 条目 |
|---|---|---|---|---|---|
| T1 | 正常 | 谓词正常面 | `toolTouchPaths(editTool, {path, old_string, new_string})` | `["<path>"]`（钩子裁决） | #327 |
| T2 | 边界 | 无钩子工具兜底 | `toolTouchPaths({name:"x"}, {path:"a"})` | `["a"]` | #327 |
| T3 | 边界 | 非字符串项**不过滤** | 钩子返 `[undefined]` | `[undefined]`（门禁保守判据归门禁——T-22 语义） | #327 |
| T4 | 错误 | `args = null` 零抛 | 谓词直驱（有钩子 / 无钩子两形） | 不抛；按 `{}` 裁决 ⇒ `[]`（hookless ⇒ `[undefined]`） | #327 |
| T5 | 错误 | 钩子 throw / 返非数组 | 桩钩子两态 | `[]`（恒数组） | #327 |
| T6 | 错误 | 设计闸 + `args = null` | 工程父代理 `depth 0` 直驱 `executeToolCalls`（`arguments:"null"` 的 `write`） | 流程不裸抛；返回成形结果（工具 `Error:`） | #327 |
| T7 | 正常 | 窄形态核径 | `edits` 真值非数组 + 合法单形态参数 ⇒ `editTool.execute` | `Error: edits must be a non-empty array of …`（容器面） | #327 |
| T8 | 错误 | 窄形态桥径 | 同参数经 `toolRouter` | 同错误面（同句）；**目标文件零变更** | #327 |
| T9 | 边界 | 「该调用必败」前提 | 六 `FILE_MUTATORS` × `args = null`（+ `edit` 窄形态）直调 `execute` | 恒 `Error:` ∧ 零 fs 变更 | #327 |
| T10 | 正常 | 条目自携 | 同域两 spawn（任务书 / 绑定档各异）⇒ 入队两条 | 逐条 `_batchDoc` / `_taskSeal` = spawn 入参；两条目互不相等 | #309 |
| T11 | 正常 | 启动序（零回归） | 同域两条目 ⇒ 补位启动 | 先入者先启动（既有判据） | #309 |
| T12 | 错误 | 跨批写门（核 + 端各一） | 绑定档 A 的子代理写批次档 B | 拒绝；文案含 A / B 基名；零写入 | #309 |
| T13 | 正常 | 写门正控 | 同 args 写绑定档 A 自己 | 放行（不入门） | #309 |
| T14 | 边界 | 写门豁免面 | depth 0 主 agent / 无 `_batchDoc` 子代理写批次档 | 零变（不入门） | #309 |
| T15 | 边界 | 观测留痕两态 | spawn 任务书提及**他批存在档** / 只提绑定档 | 前者留痕一条（含两侧基名）· 后者零事件；两态均放行 | #309 |
| T16 | 边界 | 门范围机检 | 两端源码扫描 | 门判据集 = `FILE_MUTATORS`（`file_ops` / 读类不在门内） | #309 |

### 2.6 验收对照（逐条回指 · 机检）

| AC | 判据（机检） | 回指 |
|---|---|---|
| AC-1 | 谓词零抛恒数组——T1–T5 全绿；**单源结构机检**：两树除 `thincoder-core/agent/helpers.mjs`（单源体）与 `thincoder-core/tools/**`（钩子定义）外，零 `touchedPaths` 直调 / 零内联提取式 | #327 · `docs/core/design/TOOLS.md` §6.17 裁定 1/2 |
| AC-2 | `args = null` 边界：消费面零裸抛——T4 / T6 绿 | #327 evidence ② · 裁定 1 |
| AC-3 | 判据归一：同参两通道同错误面、零写入——T7 / T8 绿 | #327 evidence ③ · 裁定 3 |
| AC-4 | 「该调用必败」前提机检——T9 绿 | #327 evidence ④ · 裁定 4 |
| AC-5 | `thincoder-core/tools/file.mjs` 与门禁空路径集判据**零改**（diff 零命中 + T-22 既有例零改全绿） | #327 evidence ④⑤ · KD-GS2 |
| AC-6 | 设计档收正在档（`docs/core/design/EDIT.md` §5/§6/§7/§8 · `docs/core/design/TOOLS.md` §6.17/D-TO12）+ `node scripts/doc-check.mjs` 本批写域零新增红 | #327 evidence ⑤ |
| AC-7 | 批次档写门两端在位——T12 / T13 / T14 / T16 绿 | #309 修法候选③ · §6.29.1 |
| AC-8 | 条目自携 + 双点留痕——T10 绿 ∧ `child:spawn` / `child:start` 键面一致（traces 抽验一条 · 实施轮记录） | #309 · §6.29.2 |
| AC-9 | task↔batchDoc 观测留痕（不阻断）——T15 绿 | #309 · §6.29.3 |
| AC-10 | 串扰回归锁 + 既有无回归——T10 / T11 绿；`thincoder-cli/test/subagent-scheduler.test.mjs` 既有例零改全绿 | #309 · §6.29.4 |
| AC-11 | 三包全量绿（`thincoder-core` / `thincoder-cli` / `thincoder-vscode`）+ `node scripts/doc-check.mjs` 零新增红（入场先存非本批红作对照） | 两条目 · 项目门 |

### 2.7 上抛项（逐条 · 报告不代裁）

| # | 项 | 建议处置 |
|---|---|---|
| U1 | **#309 根因未定**：payload 逐条目闭包捕获（`thincoder-core/agent-tools/subagent-run.mjs:157`）· 事件侧无轨迹 ⇒ 本设计按 containment + 可诊断性落形，**不声称修掉根因** | 若父侧持有事件轨迹（traces / 会话记录）可改判形；建议以本批形二留痕为下次复现的对账面 |
| U2 | 台账 #327 点名六点之外**本轮实勘新增三处同族点**（`thincoder-core/peer-domains.mjs:81` 未守卫 · `thincoder-core/agent/record-results.mjs:148` 二次解析 · 已守卫点 `thincoder-core/agent/dispatch.mjs:127`/`:232` 与 `thincoder-core/agent.mjs:401`） | 已纳入「消费点对齐」射程（不纳则「单源」不成立）；如需严格限定六点请裁 |
| U3 | **桥面纳入（披露扩面）**：#327③ 的归一必然触碰 `thincoder-cli/src/acp/bridge.mjs`（台账坐标未点名该档） | 已作设计裁定 3 落位；若不纳 ⇒ ④ 的前提无法恢复、只能改已批 E1 判据（不建议） |
| U4 | **需求面缺位**（同族先例 = MODEL-SPECS 批 R-8）：两板块（TOOLS / AGENT-LOOP-SUBAGENT）均无常驻需求节，需求面 = 台账 evidence + 本档 §1（一次性载体） | 请裁是否为本板块建常驻需求节（需求档 = 主 agent 笔） |
| U5 | #327⑤ `docs/core/design/EDIT.md:63`「零裸抛」条未限定 `args` 自身 | 本设计轮已补（非 null 对象 ⇒ 按 `{}` 处理）——evidence ⑤ 消解 |

### 2.8 三方一致性与自检

- **三方同源**：本档 §2.1 条目表（#327 / #309）= 设计档节（`docs/core/design/TOOLS.md` §6.17 + `docs/core/design/EDIT.md` §5/§8 · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29 + `docs/core/design/BATCH-RECORD.md` §4.2）= 台账行（#327 / #309 · `tech_todo` · 触发归批）——无悬空、无缺项。
- **设计八项**：方案与理由 / 接口契约 / 受影响文件（含拆分计划）/ 关键决策（含否决备选）/ 验收回指 / 用例表 / 边界 / UI 决策——**八项齐备**；UI 面结论 = 本批**零 UI 变更**（面板 / status 数据面零改，显式落边界）；`open` 项 0。
- **写域自检**：本轮写 = 设计档四份 + 本档 §2；产品码 / 测试码 / 提示词 / 需求档零触碰。

### 2.9 交付前机检实跑（一次 · cwd = 仓根 · 2026-09-25）与写域归因

- 命令 = `cd thincoder && node scripts/doc-check.mjs`；读数 = `FAIL(锚): 4 条悬空（闸态——阈值 0）` · `FAIL(行宽): 13 行超 300 字符`。
- **本批写域（四设计档 + 本档）= 零红**：四档在闸态 ✗ 列表中零命中（档内 ✗ 全部为「迁移期引文 · 列报 · 不入闸」豁免项与「报告面 · 不入闸」符号项）。入场同刻全局为 10 悬空 / 25 行宽，差额由并批收口与本轮形态修复共同消化。
- **本批同轮形态修复（零语义 · 逐处可核）**：① `docs/core/design/TOOLS.md:1034/:1040` 存量三条悬空坐标补全仓根前缀（`agent.mjs:169-170` → `thincoder-core/agent.mjs:169-170`；`run-stages.mjs:91-92` / `agent-state.mjs:121` / `agent.mjs:418` → `thincoder-vscode/src/agent/...`——同档 `:1038` 既有全路径先例为据）；② 同两行行宽折行；③ `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29 两处行宽折行；④ `docs/core/design/EDIT.md` 变更记录行折行；⑤ `docs/core/design/BATCH-RECORD.md` 存量两条变更记录行（2026-09-21）行宽折行。以上**措辞与语义零改**。
- 非本批存量红（未触）：`docs/core/design/MEMORY.md` · `docs/core/design/MODEL-SPECS.md` · `docs/core/design/SESSION.md` · `docs/vsc/design/WEBVIEW.md` 等——读数随并批收口同步下落（10 → 4 悬空 / 25 → 13 行宽），本批未代修。
- 机读位口径：本档 §2 首行 = 机读状态行（模板位——已由 `batch status` 置「设计完成」）；下方另有一条 append 载荷内的状态陈述行（记录面）——机读**以首行为准**，两行并存非机读冲突。

### 2.10 设计评审修正轮（14 条逐号落位 · 父侧裁定「全部接受」· 2026-09-25）

**来源** = 本档 §3 轮次 1（🟡 6 · 🔵 8 = 14 条 · 无 🔴）；**处置面** = 点修落地（不重开设计、不扫未点名处所）。
本轮写域 = 设计档四份 + 本档 §2 追加；产品码 / 测试码 / 提示词面 / 需求档零触。

- **#1（🟡 · `thincoder-vscode/src/agent/execute-tools.mjs:188`）** 处置钉死 = **保持调用 `l3TouchedPaths`（该点零改）**——谓词经其定义点（`tool-gates.mjs:26`）间接生效。
  「十处」计数不变（VSC 4 = `tool-gates.mjs:26` / `:94` · `execute-tools.mjs:349` · `rules-face.mjs:101`）；§2.4 Δ（`:77` `+1` = 记账面 `:349`）与之同口径、零改。
- **#2（🟡 · 用例档实址）** 同族既有用例档 = `thincoder-cli/test/subagent-scheduler.test.mjs`（在案实址 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:224`；`thincoder-core/test/` 侧无同档）。
  §2.4 零改面（`:88`）按此钉死（AC-10 `:126` 原已同址）；新档宿主分列 = `thincoder-cli/test/queue-payload-binding.test.mjs`（cli 侧——与既有调度器用例同宿主）。
- **#3（🟡 · `AGENT-LOOP-SUBAGENT.md` §6.29.3）** 观测留痕补两钉——① 通道 / 事件名 = `logEvent`（`child:batchdoc-ref`；键面 `{ role, batchDocBase, refBase }`）。
  ② token 提取判据 = `.md` 且含路径分隔符的连续非空白字面 ⇒ `resolveBatchReadPath(cwd, token)` ⇒ 基底内 ∧ ≠ 绑定档；断言面 = `THINCODER_LOG_DIR` 隔离目录计数（T15 `:110` / AC-9 `:125` 的「一条 / 零条」）。
- **#4（🟡 · 同档 §6.29.1 边界行）** 显式登记「**非 `FILE_MUTATORS` 写通道（`bash` / `execute` 等）不在射程**」+ 理由（判据面 = 工具面 mutator 集；文本拦截已被否；事故真实通道未定 ⇒ 不宣称全面封闭）。
  T16（`:111`）/ AC-7（`:123`）措辞与之一致（判据集 = `FILE_MUTATORS`）。
- **#5（🟡 · `BATCH-RECORD.md` §4.2）** 括注「段维度 ⊃ 档维度」→「段维度 / 档维度——分层不重叠」（段维度 = 身份 → 可写段；档维度 = 目标档 ∈ 绑定档）——与 §6.29.1 / KD-GS4 同口径。
- **#6（🟡 · U4 `:136`）** 断语收窄 = 「**本主题**（钩子守卫消费 / 批次档写门）在需求档无对应条目」——在位需求档在案（`TOOLS.md:990` · `AGENT-LOOP-SUBAGENT.md:8`）；需求档零触。
- **#7（🔵 · 三处同改）** 无歧义形 = 「`args` 为 null **或非对象** ⇒ 一律规范化为 `{}` 再交钩子」——落 `TOOLS.md` §6.17 裁定 1（`:919`）· `EDIT.md` §5（`:63`）。
  本档 §2.2-A（`:36`）同点以本行为准（append-only 不改既有行）。
- **#8（🔵 · T6 / T9 期望形态）** T6（`:101`）/ T9（`:104`）改**实施前先跑**格——先跑读数记 §5、期望形态据实收正（`Error:` 串 ∥ 抛错）；AC-4（`:120`）判据 = 「必败 ∧ 目标零变更」（形态不参与判定）。
  设计档同源句同形收正：`TOOLS.md` §6.17 裁定 4（`:924`）· `EDIT.md` §7（`:95`）。
- **#9（🔵 · §6.29.1 接口契约）** 补定形行（与 `TOOLS.md` §6.17 表同形）——`batchRecordWriteConflict(agent, depth, absPaths)` → `{ bound, target, message }` ∥ `null` · 恒零抛；
  拒绝文案单源 = `thincoder-core/agent/write-gate.mjs`（两端直取 `conflict.message`——零字面副本）。
- **#10（🔵 · AC-1）** 钉扫描面 + 两条具名结构谓词（详下）。
- **#11（🔵 · 五档档位）** 逐档档位结论（详下）。
- **#12（🔵 · 设计档行数）** 按实测刷新（as-of 本修正轮落定——详下）。
- **#13（🔵 · 批档 §2 双状态行前缀）** `BATCH-RECORD.md` §4.12 成文 = **段内多命中 ⇒ 改写首条**（工具面实读 `batch-lifecycle.mjs:159` `findIndex` 首命中）。
  本档 §2 `:22` = append 载荷的记录面行（非机读位——append-only 不改既有行，取「注明非机读位」选项；机读位 = 段内首条）。
- **#14（🔵 · 桥路由登记面）** 判 = **纯缺陷修复** ⇒ 零对外契约登记、零 CHANGELOG 行；发布关联照 §6.14 先例——判句落 `TOOLS.md` §6.17「登记面判定」行（本档不重述）。

**AC-1 收正形（#10 · 机检）** 扫描面 = `thincoder-core/**`（除 `test/**`）+ `thincoder-vscode/src/**`；测试面（`thincoder-core/test/**` · `thincoder-cli/test/**` · `thincoder-vscode/test/**`）另列（宿主行为断言，不入结构谓词）。
两条具名谓词（先例 = `TOOLS.md:435` A20）：① 直调谓词 `\btouchedPaths\s*\(`：命中集 ⊆ {`thincoder-core/tools/file.mjs`（钩子定义面）· `thincoder-core/agent/helpers.mjs`（单源体）}；
② 内联提取谓词 `\[\s*args\??\.path\s*\]`：命中集 ⊆ {`thincoder-core/agent/helpers.mjs`（单源体内兜底形）}；行为面 = T1–T5 全绿。

**档位结论（#11 · >300 五档 · 口径 = `split("\n").length - 1`）**
- `thincoder-core/agent.mjs` 443（±0）：**既有登记**（`thincoder-core/test/core-hygiene.test.mjs` `SOFT_LINE_REGISTRY`）——登记面零改。
- `thincoder-core/agent-tools/subagent-spawn.mjs` 407 → 421：**既有登记**（同表）；硬限余量 79 ⇒ 本批不拆（触发 = 越 500 硬限或该档下次实质改动——既有口径）。
- `thincoder-vscode/src/agent/execute-tools.mjs` 417 → 418：**免登记**（`SOFT_LINE_REGISTRY` 只覆盖 `thincoder-core/**`；端侧在册结构断言 = `thincoder-vscode/test/child-permission.test.mjs:360` `≤500`）；硬限余量 82 ⇒ 本批不拆。
- `thincoder-cli/src/acp/bridge.mjs` 394 → 395：**免登记**（CLI 侧无机械登记面）；硬限余量 105 ⇒ 本批不拆。
- `thincoder-cli/test/edit-tool-improvement.test.mjs` 446 → 464：**免登记**（同上）；+18（用例 42 → 45）后硬限余量 36 ⇒ 本批不拆（同触发口径）。

**设计档行数复位（#12 · as-of 本修正轮落定 · 口径 = `split("\n").length - 1`）**
- `docs/core/design/TOOLS.md` = **1105**（表内旧估 `:87`：1039 → ≈1115）· `docs/core/design/EDIT.md` = **144**（138 → ≈145）。
- `docs/core/design/AGENT-LOOP-SUBAGENT.md` = **978**（917 → ≈954）· `docs/core/design/BATCH-RECORD.md` = **443**（432 → ≈434）。
- **口径注**：设计档为在改面（并批在位）⇒ 数值 = as-of 读数 · 本批不追值（先例 = `AGENT-LOOP-SUBAGENT.md:280`）；`.md` 免档位判据。
- 修正轮净增（对 §3 轮次 1 实测；EDIT 不在评审读数内）= TOOLS +3 · AGENT-LOOP-SUBAGENT +16 · BATCH-RECORD +4 · EDIT ±0。

**机检读数（本轮落定 · 命令 = `cd thincoder && node scripts/doc-check.mjs`）**
- `FAIL(锚): 15 条悬空` · `FAIL(行宽): 19 行超 300 字符`（as-of 本节落定——两读随并批收口浮动，非单调）。
- **本批写域（四设计档 + 本档）= 零净增红**：15 悬空全部落在非本批面（`CORE-UNIFICATION` / `MODEL-SPECS` / `SESSION` / `VSC-DEBT`）；行宽 19 行全部落在非本批面（`CORE-UNIFICATION` / `MODEL-BENCH` / `MODEL-SPECS` / `VSC-DEBT` / `WEBVIEW`）。
- 修正轮两处初判红（`BATCH-RECORD.md:75` / `:214` = 307 / 377 字符）已折行消化；其余 `✗` 行 = 「迁移期引文 · 列报 · 不入闸」与「报告面 · 不入闸」豁免项（非闸态红）。

**零新语义**：以上 14 条均为评审发现的逐号落位（措辞收正 / 界定补钉 / 计数刷新 / 登记面判句）——无机制面新内容。
设计档收正落点 = `TOOLS.md` §6.17 · `EDIT.md` §5/§7 · `AGENT-LOOP-SUBAGENT.md` §6.29.1/§6.29.3 · `BATCH-RECORD.md` §4.2/§4.12。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审面** = 批档 §2 + `TOOLS.md` §6.17 / `AGENT-LOOP-SUBAGENT.md` §6.29 / `EDIT.md` / `BATCH-RECORD.md`（状态 = 待评审）。

**限制（如实登记）**：① 本评审未声明项目标准档与文档地图 ⇒ 「文档归属」按在案 D2 单源纪律（不重述 / 指针化）+ AGENTS.md 档位线（≤300 建议 / ≤500 硬限）判定；② 依评审判据「review ONLY these files」，源码 / 测试码的行数与坐标**未**独立抽检 ⇒ 批档 §2.4 的「现况 / Δ」两列一律 **unverified**；面内可核者已核：表中可对照的引用坐标均 < 同表声明现量、「十处 = 核 6 + VSC 4 = 未守卫 7 + 已守卫 3」自洽、Δ 算术自洽（496 − 1 + 4 = 499；用例 42 + 3 = 45；写入 445 → 45 例）；③ 未声明档（需求档内容）标 unverified。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | 批档 §2.2-B（`:38`）把「台账点名的调用方 `execute-tools.mjs:188`」并入「一律改调谓词」，与 `TOOLS.md` §6.17 接口契约（`:937`「端消费…**四处**替换调用；`l3TouchedPaths` 保留 `file_ops` 特例分支、其余转调谓词」）及 §2.4 Δ（`:77` execute-tools.mjs `+1` = 记账面 `:349`）不一致——按 §2.2-B 直改 `:188` 将绕过 `l3TouchedPaths` 的特例分支（该点行为变更），且本批用例表 T1–T16 无一格锁定该分支 | 把 `:188` 的处置钉死并与 §6.17 同口径（建议 = 保持调用 `l3TouchedPaths` ⇒ 该点自身零改，「十处」计数不变）；若确需改该点，须补 Δ 行 + 一格锁定 `file_ops` 特例分支的用例 |
| 2 | Clarity | 🟡 | 同族既有用例档在批档内写作两个树：§2.4 零改面（`:88`）= `thincoder-core/test/subagent-scheduler.test.mjs`；AC-10（`:126`）= `thincoder-cli/test/subagent-scheduler.test.mjs`。本评审面内在案者仅 CLI 侧（`AGENT-LOOP-SUBAGENT.md:224` 表行 = `thincoder-cli/test/subagent-scheduler.test.mjs`，182 行）⇒ 至少一处为误，AC-10「既有例零改全绿」的机检对象不唯一 | 按在案实址钉死（cli 侧），并把新档 `thincoder-cli/test/queue-payload-binding.test.mjs` 的宿主归属与该行一并分列写明 |
| 3 | Acceptance criteria | 🟡 | §6.29.3（`AGENT-LOOP-SUBAGENT.md:795-799`）的观测留痕两点未钉：① 留痕的通道 / 事件名（对比 §6.29.2 `:792` 明写 `child:spawn` / `child:start`）；② 「批次档路径 token」的提取判据（何种字面、如何经 `resolveBatchReadPath` 解析）。⇒ T15（`批档:110`「留痕一条（含两侧基名）· 后者零事件」）与 AC-9（`:125`）无断言目标，不可机判 | 补事件名（或 logEvent 键）与 token 提取判据（含解析输入形态），使 T15 可断言「一条 / 零条」两态 |
| 4 | Scope | 🟡 | §6.29.1 射程边界（`AGENT-LOOP-SUBAGENT.md:787`）只排除 `file_ops` / 读类，未点名 `bash` / `execute` 等**非工具面写通道**——在同一「绕过工具绑定即损害通道」理由（`:785`）下这些通道仍开放；而事故真实通道未定（`:770-773` 自述「根因未定」）⇒ T12 / AC-7 的「跨批写即拒」易被读成全面封闭 | 边界行显式登记「非 `FILE_MUTATORS` 写通道不在射程」（含理由：判据面 = 工具面 mutator 集；文本拦截已被否），并让 AC-7 / T16 措辞与之一致 |
| 5 | Document ownership | 🟡 | `BATCH-RECORD.md:75` 新行括注「写面两道门（段维度 **⊃** 档维度）」与判据 owner 档的「分层不重叠」互为抵触（`AGENT-LOOP-SUBAGENT.md:785`「与 `batch` 工具的关系（分层，不重复）」· 批档 `:62` KD-GS4）——`⊃` 可读作「段维度门已含档维度」，正是该行要否证的误读 | 改为与 owner 档同口径的关系陈述（段维度 = 身份 → 可写段；档维度 = 目标档 ∈ 绑定档；两门分层不重叠），或删括注只留指针句 |
| 6 | Requirements | 🟡 | 批档 §2.7 U4（`:136`）称「两板块（TOOLS / AGENT-LOOP-SUBAGENT）均**无常驻需求节**——需求面 = 台账 evidence + 本档 §1」；但在案档头明示需求层在位：`TOOLS.md:990`（§8.3「已并入本层需求档 `docs/core/requirements/TOOLS.md`（与本档同名成对）」）· `AGENT-LOOP-SUBAGENT.md:8`（「需求层 = `docs/core/requirements/AGENT-LOOP.md`（含 §4 需求条目面）」）⇒ 现措辞会被读成「需求档不存在」，据此请裁落错前提（两需求档内容不在本评审可读面 = unverified） | 把 U4 断语收窄为「**本主题**（钩子守卫消费 / 批次档写门）在需求档无对应条目」，并注明与在位需求档的关系 |
| 7 | Clarity | 🔵 | 「`args` 非 null 对象 ⇒ 规范化为 `{}`」（`TOOLS.md:920` · `EDIT.md:63` · 批档 `:36`）可反读为「`args` 是（非 null 对象）⇒ 置 `{}`」——与 T2（hookless `{path:"a"}` ⇒ `["a"]`）期望相反（T4 的「按 `{}` 裁决」可兜住，三处同形措辞仍易误实现） | 三处同改无歧义形：「`args` 为 null **或非对象** ⇒ 一律规范化为 `{}` 再交钩子」 |
| 8 | Acceptance criteria | 🔵 | T9（`:104`）/ T6（`:101`）把 `args = null` 下 `execute` 的期望形态定为返回 `Error:`（而非抛）；同档 `TOOLS.md:895` 自述该触发面「未实证 · 读码推演」，评审面内无该形态的直接证据（**unverified**）。若实为裸抛，「该调用必败」前提仍立，但期望形态须改 | 把 T9 定为**实施前先跑**的谓词格并记先红 / 先绿读数，据实收正期望形态（`Error:` 串 或 `assert.rejects`），再据此判 AC-4 |
| 9 | Clarity | 🔵 | §6.29.1 的接口契约比同批 §6.17 薄：`batchRecordWriteConflict(agent, depth, absPaths)` 返回值形态未钉、「拒绝文案（实现单源）」（`:779`）落点未指（由判据本体 + 两端同文案 T12 反推应在 `write-gate.mjs`，未成文） | 补一行接口契约定形（返回值 = 冲突信息 / 文案；文案单源落点 = `write-gate.mjs`；两端同取），与 `TOOLS.md` §6.17「接口契约（实现面）」表同形 |
| 10 | Acceptance criteria | 🔵 | AC-1（`:117`）前半（零 `touchedPaths` 直调）可判，后半「**零内联提取式**」无判据形态，且「两树」未界定扫描面（测试面 / 文档面是否在内——含测试面易假阳） | 钉扫描面（如 `thincoder-core/**` + `thincoder-vscode/src/**`，测试面另列）与两条具名谓词（直调 / 内联提取各一形态），同族先例 = `TOOLS.md:435`（§6.13 A20 三条结构谓词） |
| 11 | Affected-file size annotations | 🔵 | 触碰档中 >300 行者只给两处档位注记（helpers 458「已登记」· write-gate 122「免登记」——`:90`）；其余五档无档位结论：`agent.mjs` 443（±0）· `subagent-spawn.mjs` 407→421 · VSC `execute-tools.mjs` 417→418 · `bridge.mjs` 394→395 · `edit-tool-improvement.test.mjs` 446→464。（**非跨档**——本批无档越线，`dispatch.mjs` 496→499 另带拆分计划与触发线） | 逐档补一行档位结论（既有登记 / 免登记 / 触发式拆分），与 dispatch 行同形；同族先例 = `AGENT-LOOP-SUBAGENT.md:256`（A5「越软线档在档内登记」） |
| 12 | Affected-file size annotations | 🔵 | 设计档行数估值与在案实测有偏（评审轮实读，末行号 / wc 口径见 `TOOLS.md:605`）：`TOOLS.md` 表内 `1039 → ≈1115`（`:87`）vs 实测 **1102**（末行 1103）；`BATCH-RECORD.md` `432 → ≈434` vs **439**（末行 440）；`AGENT-LOOP-SUBAGENT.md` `917 → ≈954` vs **962**（末行 963）。（.md 免档位判据——仅记录面准确性） | 实施轮以实测刷新三档数值，或按「as-of 读数 · 不追值」口径标注（先例 = `AGENT-LOOP-SUBAGENT.md:280`） |
| 13 | Clarity | 🔵 | 批档 §2 内有两条同前缀 `**状态行**：` 行（`:19` 机读首行 · `:22` append 载荷内状态陈述行）；`BATCH-RECORD.md:214`（§4.12）把 status 写域定义为「调用者自己段内的 `**状态行**：` 行」——同段多命中的处置未钉（§2.9 `:151` 自述「以首行为准」，工具面行为未成文） | 载荷行改前缀（如「状态陈述：」）或注明非机读位，使段内机读标记唯一（防下轮 status 改写落错行） |
| 14 | Methodology | 🔵 | 桥路由变更（窄形态由「单形态写入落地」改「拒」）属工具可见面行为变更，设计未见登记面判句（对外契约 / CHANGELOG / 发布关联）；同族先例 = `TOOLS.md:141`（§4 契约表「登记 + CHANGELOG」）与 §6.14「发布关联」行（`:647`） | 显式判一句（判为纯缺陷修复可零登记；否则补登记 + CHANGELOG 行），使「契约面变更」与「缺陷修复」两类有同一处置口径 |

VERDICT: pass
计数：🔴 0 · 🟡 6 · 🔵 8（共 14 条；无 🔴 ⇒ 不阻塞）

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代执行 · 2026-09-25 全链授权口径）**

- **授权口径** = 2026-09-25「这七批都派出去」= 全链（设计 → 评审 → 批准 → 实施 → 收口）；代执行自缚三条件逐项核验：
  - ① 设计评审 **pass**（🔴0 / 🟡6 / 🔵8 · `§3` 轮次 1 在册）✓；
  - ② 修正轮（fix · 14 条）**全落并读回核验** ✓（本档 §2.10 块 `:153-204`；设计档收正抽核：`TOOLS.md` §6.17（`:919`/`:924`/`:935`/`:940`）· `EDIT.md` §5/§7（`:63`/`:95`）· `AGENT-LOOP-SUBAGENT.md`（`:789`/`:811`/`:813`）· `BATCH-RECORD.md`（`:75`/`:216`）逐点实读在案）；
  - ③ designToken **在效** ✓。
- **追认两项**：① 修正轮 #8 的延伸落点（`TOOLS.md:924` · `EDIT.md:95` 同源句同形收正——同一缺陷面邻行，防实施照死形态）**接受**；② #14 判句（桥路由 = 纯缺陷修复 ⇒ 零对外契约登记、零 CHANGELOG 行）**接受**——发布动作 = 用户门，另行。
- 据上：批⑥ 进入实施（eng-coder · 按批档 §2 实施；§5 实施记录由该档写）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（initial 轮 · 2026-09-25 · 写域 = §2.4 表内 12 产品档 + 6 测试档；表外 3 处已披露；审计 🔴0 + 评审 pass）

### 5.1 交付摘要（逐条 · 坐标 = 实施后实读）

**#327-A 单源谓词**：`thincoder-core/agent/helpers.mjs:88-112` 新 `toolTouchPaths(tool, args)`——`args` 为 null **或非对象** ⇒ 一律规范化 `{}` 再交钩子；有钩子 ⇒ 钩子裁决；无钩子 ⇒ 单参兜底（缺 path 仍返含 `undefined` 的单元素数组，形态零变）；钩子 throw / 返回非数组 ⇒ `[]`（恒数组 · 恒零抛）；**不过滤非字符串项**（未知路径的保守判据归门禁自身——T-22 语义零变）。

**#327-B 十处消费点**（一律改调谓词；已守卫三处的 try/catch 外壳退休）——
核 6 = `agent/dispatch.mjs:126`（执行即刻记账）· `:198`（工程设计闸）· `:229`（D5 冻结窗，与写门共用同一路径集）· `agent/record-results.mjs:150`（解析与提取同 try）· `agent.mjs:401`（中断分支）· `peer-domains.mjs:80`（L3 写前查——file_ops 无钩子 ⇒ source/dest 双算特例保留）。
VSC 4 = `src/agent/tool-gates.mjs:28`（`l3TouchedPaths`）· `:96`（工程设计闸）· `src/agent/execute-tools.mjs:351`（记账面）· `src/agent/rules-face.mjs:103`（作用域规则 JIT）。
**`execute-tools.mjs:190` 保持调用 `l3TouchedPaths` 零改**（§2.10 #1 处置）——谓词经 `tool-gates.mjs:28` 间接生效。

**#327-C 判据归一**：`thincoder-cli/src/acp/bridge.mjs:313` `const hasEdits = Boolean(args?.edits)` 单点取值，`:314` 条件与 `:316` 分支同用 ⇒ `edits` 真值非数组 + 合法单形态参数两通道同拒（同容器守卫同句）、零写入；「桥径单形态应用」分支消除。

**#327-D 前提机检**：T9 落 `thincoder-cli/test/edit-tool-improvement.test.mjs:395-410`（六 `FILE_MUTATORS` × `args = null` + edit 窄形态 ⇒ 必败 ∧ 目标零变更；形态双收谓词 `failed()`——**形态不参与判定**）。

**#309-A 批次档写门**：判据本体 = `thincoder-core/agent/write-gate.mjs:133-155` `batchRecordWriteConflict(agent, depth, absPaths)` → `{bound, target, message}` ∥ null（depth>0 ∧ `_batchDoc` 在场 ∧ 目标落 `batchDocBases(cwd)` 基底内 ∧ ≠ 绑定档）；比较键 = 绝对路径 + `.` 段/分隔符归一 + win32 大小写归一（`:100-103`）；基底集按 agent 记忆化（WeakMap，`:105-111`）；拒绝文案单源 = `:151`（两端直取 `message`，零字面副本）。两端接线 = 核 `dispatch.mjs:232`（拒因分支 `:334`）· 端 `tool-gates.mjs:118`；判据集两端同 = `FILE_MUTATORS`（`file_ops` / 读类不在门内）。

**#309-B 条目自携 + 双点留痕**：`subagent-run.mjs:91-92` 条目记 `_batchDoc`（= `child._batchDoc ?? null`）/ `_taskSeal`（任务书文本 12 hex 摘要，`:22-24`）；`child:start` 新事件 `:166`、`child:spawn` 扩键 `:207`——键面同为 `{ role, id, batchDocBase, taskSeal }`（基名 + 摘要，零内容）。

**#309-C 观测留痕（不阻断）**：`subagent-spawn.mjs:41-65` `logBatchDocRefs`（token = `.md` 结尾的连续路径型字面，含盘符形态；逐 token 经 `resolveBatchReadPath` 解析；命中 = 可读 ∧ 落基底内 ∧ ≠ 绑定档；同档按解析后绝对路径去重；事件 `child:batchdoc-ref` + 两侧基名），调用点 `:251` 落 batchDoc 门区（spawn 照常放行）。

**#309-D 串扰回归锁**：`thincoder-cli/test/queue-payload-binding.test.mjs`（T10 自携逐条 = spawn 入参且互不相等 · T11 先入者先启动 · T15 留痕两态「一条 / 零条」）。

### 5.2 先跑读数（§2.10 #8 · T6/T9 形态据实 · 探针直跑，用后即删）

- **六个 `FILE_MUTATORS` × `args = null` 直调 `execute`（`thincoder-core/tools/index.mjs` 表）⇒ 全部 `THREW TypeError: Cannot read properties of null (reading '<键>')`，目标文件零变更 ✓**（write / edit / insert_after / apply_patch / delete / hashline_edit）。
- **`edit` 窄形态**（`edits` 真值非数组 + 合法单形态参数 + 顶层 `path`）⇒ `THREW Error: edits must be a non-empty array of {path, old_string | line/startLine+endLine, new_string}`，零变更 ✓。
- **T6 面**（`executeToolCalls` 直驱 `arguments:"null"` 的 `write`，工程父代理 depth 0）：修复前 **`THREW TypeError: Cannot read properties of null (reading 'path')`**（= #327 evidence ② 的裸抛实证）；修复后 = 成形 `Error: design review required before any file modification. …`（保守拦截——T-23 锁）。
- **形态收正**：判据只取「必败 ∧ 目标零变更」，形态不参与判定（T9 双收谓词同收 `Error:` 串 ∥ 抛错）。
- **附读**：非工程面 + autoApprove 下 `edit` 窄形态经 dispatch ⇒ `ok=false`、结果 = `Error: edits must be a non-empty array of …`（成形），零变更。

### 5.3 AC-8 双点留痕抽验（traces 一条 · 真实 spawn 链路）

`THINCODER_LOG_DIR` 隔离目录；池内同域阻断 + 释放补位（真实 `entry.start()`；子 provider 无 baseURL ⇒ chat 立即抛，**零网络**）——两事件逐字：

```
{"ts":"2026-09-25T05:41:32.224Z","ev":"child:spawn","seq":1,"role":"eng-designer","id":"eng-designer#2","kind":"async","status":"queued","ms":0,"batchDocBase":"a.md","taskSeal":"2f495f4093d8"}
{"ts":"2026-09-25T05:41:32.227Z","ev":"child:start","seq":2,"role":"eng-designer","id":"eng-designer#2","batchDocBase":"a.md","taskSeal":"2f495f4093d8"}
```

⇒ 双点键面一致（`role` / `id` / `batchDocBase` / `taskSeal`；`child:spawn` 为超集，保留既有 kind/status/ms），基名 + 摘要、零任务书内容。

### 5.4 验证读数（最终 · 命令 + 结果）

| 门 | 命令（cwd） | 读数 |
|---|---|---|
| 核全量 | `node test/run.mjs`（thincoder-core） | **663 / 663 · fail 0** |
| CLI 全量 | `node test/run.mjs`（thincoder-cli） | **850 / 850 · fail 0** |
| VSC 全量 | `node test/run.mjs`（thincoder-vscode） | **987 / 987 · fail 0** |
| AC-1 结构机检 | `node --test test/touch-paths.test.mjs`（core） | 7 / 7（含机检格） |
| T12/T13/T14/T16 | `node --test test/batch-record-write-gate.test.mjs`（core） | 7 / 7 |
| T7/T8/T9（#327 三例） | `node --test test/edit-tool-improvement.test.mjs`（cli） | 45 / 45（用例 42 → 45 ✓） |
| T10/T11/T15 | `node --test test/queue-payload-binding.test.mjs`（cli） | 3 / 3 |
| T-23/T-24/T-25 + T-22 族 | `node --test test/portability-classification.test.mjs`（cli） | 12 / 12 |
| T-V07/08/09 | `node --test test/portability-vsc-classification.test.mjs`（vsc） | 9 / 9 |
| doc-check | `node scripts/doc-check.mjs`（仓根） | `FAIL(锚) 14` · `FAIL(行宽) 18`——**本批写域（四设计档 + 本档）零红**；红行全落 CORE-UNIFICATION / MODEL-SPECS / SESSION / VSC-DEBT / MODEL-BENCH / WEBVIEW（对照 §2.10 落定 15 / 19——并批浮动，非单调） |
| 档位（口径 = `split("\n").length - 1`） | 实读 | dispatch **498**（红线 499 ✓ 余量 1）· helpers 458〔登记〕· agent 442〔登记〕· subagent-spawn 438〔登记〕· write-gate 156 · record-results 177 · peer-domains **296**（未再增）· subagent-run 225 · VSC tool-gates 172 / execute-tools 419 / rules-face 118 · bridge 397 · edit-tool-improvement.test 486（硬限余量 14）· portability-classification.test 220 · queue-payload-binding.test 114 · touch-paths.test 107 · batch-record-write-gate.test 130 · portability-vsc-classification.test 236 |

**环境异常登记（非本批）**：VSC 首跑 = 757 例 / **58 红**，全数 = `src/extension/peer-claims.mjs` 的 `writeRecordAtomic` 导出缺失（并批 peer-closeout 在飞中间态）；该批落位后复跑 967/967 → 987/987 全绿。另：`thincoder-vscode/node_modules/@thincoder/core` 期间由「HEAD 物化副本」翻为「指向 `thincoder-core/` 的链接」（开发期形态；RELEASE.md §5.5 口径）——VSC 套件据此读到本批核改动。

### 5.5 表外改动（逐处披露 · 理由）

1. **`thincoder-core/agent/dispatch.mjs:462-465`**（异常路径 `args` 守卫）：评审 🟡#1 独立复核成立——`arguments:"null"` + 工具抛错（本批先跑读数实证）经 autoApprove 短路入 Phase 2 ⇒ catch 内 `item.args.path` 二次裸 TypeError 逸出 `runOne` → `Promise.all` 拒 → 整跑崩（实测复现 `REJECTED: TypeError Cannot read properties of null (reading 'path')`）。改 = `const a = item.args ?? {}` + 三处经 `a` 读（`command` 加 `String(...)`）；dispatch 497 → **498**（红线内）。
2. **`thincoder-core/agent/record-results.mjs:152`**（过滤口径对齐）：评审 🔵#6——补 `typeof p !== "string" || !p ⇒ continue`，与 `dispatch.mjs:230` / VSC `execute-tools.mjs:353` 同口径（单条畸形路径不拖累同批合法路径）；177 行。
3. **回归锁 `thincoder-cli/test/portability-classification.test.mjs:199-206`（T-25）**：锁「畸形 args 下工具抛错 ⇒ 整跑不崩、收口为成形 `Error: …` 结果」（评审 🟡#1 建议格）。
4. 探针 2 枚（仓根 `tmp-gs-probe.mjs` · `.thincoder/tmp/gs-ac8-probe.mjs`）用后即删（实读 ENOENT）；`gs-*` 日志落 `.thincoder/tmp/`（忽略域）。

### 5.6 决策透明表（设计未述 · 实施自决）

| # | 决策 | 理由 |
|---|---|---|
| 1 | 写门排在 D5 冻结窗前（同块共用路径集） | 两者同区无依赖；containment（跨批写）先于 stale 面 |
| 2 | AC-1 结构机检允许集 = 单源体 + **钩子定义面（file.mjs / patch.mjs）** + `git.mjs`（内联形） | §2.10 #10 允许集枚举不全：按字面 {file.mjs, helpers.mjs} / {helpers.mjs} 会对 `patch.mjs:183/:263`（apply_patch/delete 钩子定义）与 `git.mjs:153`（`git diff -- <path>` 组参—无关同名形）假红；实勘后允宽，**消费面（核 6 + VSC 4）实测零残留** |
| 3 | token 正则字符类含 `:`（`[A-Za-z0-9_@.:\\/-]+\.md`） | 设计「连续非空白字面」未钉盘符形态；含 `:` 才不丢 `D:\…` 前缀 |
| 4 | T15 态① 扩为「相对 + 盘符绝对」双 token | 顺带锁 §6.29.3 的同档去重语义；仍属「留痕一条 / 零条」两态 |
| 5 | T9 落 slow 层 | 真实落盘断言（临时文件）——与既有 slow 分层口径一致 |
| 6 | VSC 三例拆 T-V07 / T-V08 / T-V09 | 对齐 §2.4「同族两例 + 端侧写门一例」计数 |

### 5.7 审计与代码评审轮次（终态）

- **内部偏离审计**（explore 只读 · 1 轮）：**🔴 0** · 🟡 2（AC-1 允许集宽于设计枚举〔= 5.6#2，报父侧〕· §5 未回填〔= 本节〕）· 🔵 5 → 已处置：write-gate 档头计数（「两个单点」→「三个单点」）· token 正则边界（5.6#3）· 余为记录面（行数 / 归属注记）。
- **顾问代码评审**（`advisor type=code` · round 1 · 评审态 = 已实现 · 审面 = §2.4 内 18 档 + 批档 + 四设计档）：**VERDICT pass**（🔴 0 · 🟡 4 · 🔵 2 · **无 must-fix**）。**响应表**：

| 评审项 | 处置 |
|---|---|
| 🟡#1 dispatch 异常路径裸解引用 | **已修 + 锁**（5.5 #1 / #3；实测复现 → 修后 T-25 绿） |
| 🟡#2 AC-1 允许集宽于 §2.10 #10 枚举 | **不按记录改测试**（按字面会假红）：以 5.6#2 在 §5 记录交付形；**§2.10 #10 记录面收正提请父侧 / 设计席** |
| 🟡#3 `edit-tool-improvement.test.mjs` 486 行（记录 464 · 硬限余量 14） | 记录面刷新（5.4 档位行）；拆分触发按既有口径（越 500 / 下次实质改动）——**本批不拆** |
| 🟡#4 批档 §5 为空 | **本节即回填**（先跑读数 5.2 · 抽验 5.3 · 三包读数 5.4） |
| 🔵#5 §2.4 Δ 预估漂移（write-gate 122 → 156 等） | 记录面刷新（5.4 档位行逐档实读） |
| 🔵#6 `record-results` 过滤口径不一致 | **已修**（5.5 #2） |

- **终态 = clean**（0 未处置 🔴；无 must-fix；余项 = 记录面提请 + 已披露表外改动）。

## §6 验证与收口（父代理）

**核验与收口（主 agent · 2026-09-25）**

**实施交付核验**
- 交付 = eng-coder `#24`（内部审计 🔴0 · 顾问代码评审 pass〔0🔴 / 4🟡 / 2🔵 · 无 must-fix〕· 表外改动 3 处逐处有据 · §5 在档 8152 字符）。
- **本席复核（读盘抽验）**：`toolTouchPaths`（`helpers.mjs:102-112`——畸形入参规范化 / 钩子裁决 / try-catch 恒零抛 / 不过滤非字符串项）✓ · `batchRecordWriteConflict`（`write-gate.mjs:133-155`——depth>0 + `_batchDoc` 门 / 绑定额豁免 / 基底 containment / 恒零抛 / 拒因文案单源）✓ · `dispatch.mjs:462-465` 防御收口（`const a = item.args ?? {}`——#327 同族）✓。
- 三树读数（交付 · 并发期）：core **663/663** · CLI **850/850** · VSC **987/987**（fail 0 ×3）；doc-check 红行全在非本批面（15/19 口径浮动 = 并批面）。**全批静默期统一复跑** = 父侧收尾轮执行（留档）。
- 档位：`dispatch.mjs` **498/499**（余量 1——拆分预案 `pre-write-gates.mjs` 触发句保持）· `edit-tool-improvement.test.mjs` **486**（硬限余量 14）——两档进观察行。

**记录面收正（承交付提请 · 父侧裁）**
- ① §2.10 #10 的 AC-1 允许集枚举按字面不全（会对 `tools/patch.mjs:183`/`:263` 钩子定义面 / `tools/git.mjs:153` 无关同名形假红）——**以交付实测形为准**（单源体 + 钩子定义面 + 无关同名形；消费面零残留已实测）；本行为记录面收正。
- ② §2.4 Δ 预估漂移（`write-gate.mjs` 122→156 等）**以 §5.4 as-of 实读为准**。
- ③ 表外 3 处（dispatch 防御收口 + `record-results.mjs:152` 过滤 + T-25 回归锁）= 评审建议落地 —— **接受**。

**评审面**：设计评审 pass（0🔴）· 修正块全落并由本席核验（§2.8 / §2.10）。

**收口**：§1 置「已收口」· 记录冻结；台账 #327 / #309 → 待核销 → 已核销；designToken 消费（链终止）。
