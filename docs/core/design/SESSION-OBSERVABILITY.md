# 会话面可观测性：槽事件 · 设计凭证丢弃报明 · 状态栏标题单行化

> 本档 = 本批单源设计档。三个条目同属「会话面出事无人知晓」一族：槽机制无结构化事件、设计凭证换槽静默丢弃、状态栏标题含换行导致滚屏。
> 需求条目 = 本批 §2 的 R1 / R2 / R3（GitHub #23 · GitHub #28 · Gitee IKLMGA）。事件通道单源 = `docs/core/design/LOGGING.md`（`logEvent`），本档只定事件面，不改通道实现。
> 标题单行化不变式的单源 = `docs/cli/design/TUI.md` §7.4；本档 §3.3 只留批内接线（D2）。

## 1. 范围与条目

| 条目 | 内容 | 本档节 |
|---|---|---|
| R1 | 槽机制四类时点各落一条结构化事件 | §3.1 |
| R2 | 设计凭证离开会话时核心透出计数、CLI 报明恰一行（只报明，不做跨槽持久化） | §3.2 |
| R3 | 状态栏标题与回退标题统一单行化，状态行写出口兜底 | §3.3 |

## 2. 方案与理由

**最接近先例**：事件通道已有单一实现 `thincoder-core/log.mjs:114` `export function logEvent(kind, fields = {})`（`{"ts","ev","seq",...fields}` 单行 JSON，字段名黑名单 + 字符串脱敏 + 512 字符收尾）。
本批**复用**该函数，事件名沿用既有 `ns:event` 形（`thincoder-core/agent/dispatch-run.mjs:61` `tool:call`、`thincoder-core/provider/core.mjs:88` `llm:start`）；不新造事件总线、不新增日志文件、不加开关。
**偏离**：无。四类事件走同一函数、同一命名形；`session-*.mjs` 侧只加 import 与调用点。
**公开源勘察**：已查 `docs/core/design/LOGGING.md`（§6.1「统一入口 `thincoder-core/log.mjs`——`logEvent(kind, fields)`」）· `docs/core/design/SESSION.md`（§6.5 / §6.23 拒写与轮转）· `docs/cli/design/TUI.md` §7.4（会话标题段——本批的单行化不变式并入该节）。三处均与本批相关，无「无关」项。

**新名三问（逐名）**：

| 新名 | 三问结论 |
|---|---|
| `singleLineTitle` | `existing but unusable: thincoder-core/markdown.mjs:80` · 名 `function oneLine(v)` · 失败面 = 档内私有（不导出）+ 语义属 markdown frontmatter 标量 + 正则 `/\s*\r?\n\s*/g` 只覆盖 LF / CRLF 且吞两侧空格 ⇒ 宽度账不守恒。本批需覆盖 `\t` `\v` `\f` U+0085 U+2028 U+2029，且一字符换一空格 |
| `slot:rotate` · `slot:allocate` · `slot:new` · `slot:refuse` | `existing: thincoder-core/log.mjs:114` · 名形 = 既有 `ns:event`（`thincoder-core/agent/dispatch-run.mjs:61` `tool:call` · `thincoder-core/provider/core.mjs:88` `llm:start`）· consumers = 日志读侧（tail / grep）。本批新开 `slot` 命名空间，分隔符与既有家族一致 |
| `droppedDesignTokens` | `none found:` 检索面 = 本仓 `**/*.mjs` 全量 grep `droppedDesignTokens` 零命中 |
| `TITLE_BREAK_RE` | `none found:` 检索面 = 本仓 `**/*.mjs` 全量 grep `TITLE_BREAK_RE` 零命中；住址 = `thincoder-cli/src/tui/status-line.mjs`，与 `singleLineTitle` 同档、档内私有、不导出；正则字面单源 = `docs/cli/design/TUI.md` §7.4 |
| 报明文案（§3.2 两行） | `none found:` 检索面 = 本仓 `**/*.mjs` 全量 grep `已批准设计凭证` / `随槽作废` 零命中。新名锚点 = 产品既有词「设计评审 / 已批准设计凭证」（`advisor` 工具描述同族），本档 §3.2 逐字固定 |

**R1 理由**：槽轮转 / 落号 / 新建 / 拒写现在的唯一痕迹是 stderr 一行，stderr 不落盘、跨进程不可查、跑在 TUI 里还会被帧刷新覆盖。四类时点都是「事后要复盘」的时刻，事件落 `~/.thincoder/logs/agent-<date>.log` 后可 grep 可 tail。
**R2 理由**：`/new` 与切槽让**已批准的设计凭证**离开当前会话——用户丢掉的是「已花钱走完的评审结果」。只报明不持久化：跨槽留活等于悄悄放大授权范围（一个槽里获批的设计在别的槽继续放行代码写），必须先由用户单独裁定，本批不做（§8）。
**R3 理由**：状态栏按「一行」布局（`render-loop.mjs:111` 按行绝对定位差分重绘），标题里一个 LF 就是一次真实换行 ⇒ 滚屏 + 差分基准 `prevRows` 与物理行错位 ⇒ 旧行残留。清洗放显示入口与写出口两处：前者保语义（回退标题同规则），后者是唯一出口兜底。

## 3. 接口契约

### 3.1 槽事件（R1）

事件名（`ev` 字段）与必填字段是**闭集**，多余字段不写；机判 = 在日志行上按 `"ev":"<名>"` grep 后再核字段。

| `ev` | 触发点（写面坐标） | 必填字段 | 取值 |
|---|---|---|---|
| `slot:rotate` | `thincoder-core/session-slot-write.mjs:80-83`（轮转成功）· `:84-93`（异常分支）· `thincoder-core/session-guard.mjs:58-61`（guard 轮转）· `:69-78`（guard 异常分支） | `slot` `reason` `bak` `via` | `reason` ∈ `newer-version` / `foreign-cwd` / `other-session` / `longer-record` / `unreadable` / `rotate-failed`；`bak` = 是否把现场改名成 `.bak-<ts>`（布尔；异常支恒 `false`——`.corrupted` 不计 bak）；`via` ∈ `write` / `guard` |
| `slot:allocate` | `thincoder-core/session-slot-claims.mjs:178-183`（分到全新号，仅分支 3） | `slot` `prevSlot` `reason` | `reason` = `all-slots-live`；`prevSlot` = 分配前 `m.active`（无则 `null`） |
| `slot:new` | `thincoder-core/session-lifecycle.mjs:265-290`（`newSession` 落定后） | `slot` `prevSlot` `reason` | `reason` = `new-session`；`prevSlot` = 覆盖前 `m.active`（无则 `null`） |
| `slot:refuse` | `thincoder-core/session-slots-manifest.mjs:145-149`（拒写）· `:163-164`（写后读回失败） | `reason` | `reason` ∈ `read-failed` / `parse-failed` / `shape-invalid` / `readback-failed` |

**`unreadable` 与 `rotate-failed` 的判别式**（两者共用同一个 catch，`thincoder-core/session-slot-write.mjs:84-93`）：异常支按现场是否已保全分——`preserved === true` ⇒ `unreadable`（`:88` 已把现场改名 `.corrupted`，盘面坏档 / 半写档）；`preserved === false` ⇒ `rotate-failed`（`:86-91` 现场未保全：文件已不在盘 ∥ 改名失败，属轮转动作本身失败）。
guard 侧同形（`thincoder-core/session-guard.mjs:69-78`），但今日 catch 不记改名成败（`:73-75` 吞异常）⇒ 本批在 `:73-75` 内补 `preserved` 标志（改名成功置 `true`），判别式与 write 侧同形。
**硬约束（隐私）**：事件字段**不含用户输入原文、标题、消息内容、文件路径、cwd、token 值**。`slot` / `prevSlot` = 整数；`reason` / `via` = 上面枚举字面。理由：`logEvent` 的黑名单只按字段名挡 token 族，按「自带原文就永远挡不住」的口径，本批事件从字段集上就不带。
**通道**：`import { logEvent } from "./log.mjs"`（`session-slot-claims.mjs` / `session-guard.mjs` / `session-slots-manifest.mjs` / `session-slot-write.mjs` / `session-lifecycle.mjs` 各加一行）。`logEvent` 是 fire-and-forget（写失败只置 `_dead`，主流程零影响），调用点不得 `await`、不得包 try 外抛。
**负向锁**：读路径（`listSlots` / `loadSlotFile` / 状态查询）零事件——只在上面四个写时点发。

### 3.2 设计凭证离开会话的报明（R2）

核心只**度量并透出**计数，打印归端壳；本批端壳 = CLI，VSC / 桌面见 §8。

| 函数 | 坐标 | 变更 | 返回 |
|---|---|---|---|
| `resetSessionState(agent)` | `thincoder-core/session-lifecycle.mjs:297-325` | `:304` 重建 Map 前数一遍**未过期**条目 | `{ droppedDesignTokens: N }`（N 见下「N 的计数口径」；无 Map ⇒ 0） |
| `restoreEngTokens(agent, data)` | `thincoder-core/token-ttl.mjs:131-147` | `:132` 重建前快照旧 Map 的未过期 id 集，`:145-146` 落定后与新 Map 的 id 集求差 | `{ droppedDesignTokens: N }`，N = 离开集（见下） |
| `applySession(agent, data, opts)` | `thincoder-core/session-lifecycle.mjs:89` · 返回点 `:210` / `:214` | **中继契约变更**：返回值由布尔改为对象——`switched` = 今日 `return switched` 的原值（`:210`）∥ 未命中渠道支 `false`（`:214`）；`droppedDesignTokens` = `restoreEngTokens` 的返回值原样透出 | `{ switched, droppedDesignTokens }` |

**N 的计数口径（两分支同判：离开集，不是集合大小差）**：`N` 只数「本会话内生效中且未过期」的凭证 id。
`/new` = 重建前 Map 中 `!(typeof t === "string" && tokenExpired(t))` 的条目数；切槽 = 旧 Map 的未过期 id 里、不在新 Map 的那些（新 Map 已按 TTL 过滤，`thincoder-core/token-ttl.mjs:135`）。
`tokenExpired` 走 `thincoder-core/session-lifecycle.mjs:42` 同行 import，不新增依赖方向。
「已批准」与计数同一集合：Map 中的条目即评审签发的凭证，本批只剔除已过期者。
理由：`restoreEngTokens` 是**整体替换**——`:132` `const map = new Map()` 重建、`:145` 覆盖 ⇒ 前后是两个不同 id 的集合，`before - after` 在两个槽都带凭证时恒为 0（A 槽 2 个 → B 槽 2 个），而这两个凭证确实已不在本会话生效，正是要报的那一刻（§7 C9b）。

**`applySession` 调用面（实读 6 处，均不读返回值 ⇒ 契约变更零回归）**：`thincoder-cli/src/tui/cmd-session.mjs:122` · `thincoder-cli/src/command-interactive.mjs:143` · `thincoder-cli/src/acp/handlers-slots.mjs:112` / `:177`
· `thincoder-desktop/src/main/session-io.mjs:29` · `thincoder-server/deploy/sandbox/member-shell/core-run.mjs:292`（`core.applySession`）。
端壳取计数的唯一路径 = 读返回值（`/new` 读 `resetSessionState`，切槽读 `applySession`）。

**报明文案（逐字，N 为十进制整数；两分支语义不同，不可互借）**：

| 分支 | 语义 | 文案 |
|---|---|---|
| `/new`（`resetSessionState`） | 凭证离开本会话；原槽档仍留，`/session` 切回可读回 | `⚠ ${N} 个已批准设计凭证离开本会话，继续本会话需重走设计评审` |
| 切槽（`restoreEngTokens`） | 本槽不再生效；切回原槽即恢复 | `⚠ ${N} 个已批准设计凭证在本槽不再生效（切回原槽可恢复）` |

**输出条件（两分支同判）**：`droppedDesignTokens > 0` 才输出，**恰一行**；`= 0` 零输出（负向锁——半态逐字节等价）。行样式 = CLI 既有会话行通道的警示行（`pushLine(text, C.warn)`），**不进模态、不阻塞、不进状态栏**。

| 端 | 落点 | 取值 |
|---|---|---|
| CLI `/new` | 取值 `thincoder-cli/src/tui/cmd-new.mjs:16`（`resetSessionState(agent)` 返回值）· 打印 `:26` 既有 New session 行之后 | `resetSessionState` 返回值 |
| CLI 切槽 | 取值 `thincoder-cli/src/tui/cmd-session.mjs:122`（`applySession` 返回值存局部量）· 打印 `:137` 起（`restoreLines(state, desc)` 之后、与 `── Switched to slot` 同址或其后） | `applySession` 返回值 |

**切槽打印落点不得早于 `:130`**：`thincoder-cli/src/tui/cmd-session.mjs:130` `state.lines = []` 清空行集、`:132` `restoreLines` 重灌——在 `:122` 直接推的警示行会被清掉，C9 必红。
故取值与打印分两个坐标：`:122` 取值存局部量，行集重建后统一推。`pushLine(..., C.warn)` 在该函数作用域内可用（`:109` / `:120` 已在用）。

### 3.3 状态栏标题单行化（R3）

不变式、正则、三处应用点与可机判句的单源 = `docs/cli/design/TUI.md` §7.4（本批并入该节）。本档只记批内接线：

| 位置 | 坐标 | 变更 |
|---|---|---|
| `singleLineTitle` 定义 + 具名导出 | `thincoder-cli/src/tui/status-line.mjs` | 新函数（正则见 `docs/cli/design/TUI.md` §7.4） |
| 状态栏入口 · 标题 / 回退标题 | 同档（`docs/cli/design/TUI.md` §7.4 三处应用点的前两处：入口 `:172` · 回退 `:71-76`） | 各套一层 |
| status 行写出口兜底 | `thincoder-cli/src/tui/render-frame.mjs:265` | import + 出口套一层 |

三处应用点 = 入口 / 回退 / 写出口，与 `docs/cli/design/TUI.md` §7.4 同口径。

**导出方向**：`render-frame.mjs` 直接 import `status-line.mjs` 的 `singleLineTitle`（同目录，无新依赖方向）。

## 4. 受影响文件表

| 文件 | 当前行数 | 预期增量 | 变更 |
|---|---|---|---|
| `thincoder-core/session-slot-write.mjs` | 235 | ≤+6 | import + 轮转成功 / 异常两支事件 |
| `thincoder-core/session-guard.mjs` | 80 | ≤+6 | import + guard 轮转 / 异常两支事件（含 `preserved` 跟踪） |
| `thincoder-core/session-slots-manifest.mjs` | 244 | ≤+4 | import + 拒写 / 读回失败事件 |
| `thincoder-core/session-slot-claims.mjs` | 231 | ≤+5 | import + `slot:allocate` |
| `thincoder-core/session-lifecycle.mjs` | 404 | ≤+18 | `slot:new` + `resetSessionState` 未过期计数与返回值 + `applySession` 中继返回对象 |
| `thincoder-core/token-ttl.mjs` | 297 | ≤+10 | `restoreEngTokens` 离开集度量 + 返回值 |
| `thincoder-cli/src/tui/status-line.mjs` | 198 | ≤+10 | 正则 / `singleLineTitle` / 两处应用 |
| `thincoder-cli/src/tui/render-frame.mjs` | 322 | ≤+2 | import + status 行兜底 |
| `thincoder-cli/src/tui/cmd-new.mjs` | 39 | ≤+4 | 读返回值 + 警示行 |
| `thincoder-cli/src/tui/cmd-session.mjs` | 140 | ≤+8 | `:122` 取返回值存局部量 + `:137` 之后警示行 |
| `thincoder-cli/test/session-observability.test.mjs` | 新档 | 新档 | 纯函数断言（`singleLineTitle` / 两个返回值 / 事件字段组装） |

行数为本档写作时 `read` 读数。**跨文件行数上限**：本仓单档 500 行口径；最大 `session-lifecycle.mjs` 404 → ≤422，`render-frame.mjs` 322 → ≤324，均无跨限，不需拆分计划。

## 5. 关键决策记录

| # | 决策 | 理由 | 备选（未采纳） |
|---|---|---|---|
| D1 | 事件走既有 `logEvent` | 通道单源；用户可 tail / grep；零新依赖零开关 | 新建事件总线 / 新日志文件：两条写路径必漂移 |
| D2 | 事件字段闭集，不带路径 / cwd / 标题 / 消息 | 黑名单按字段名挡不住自由文本；本批从字段集上就不带 | 复用一个 `message` 字段自由拼：原文进日志，违反硬约束 |
| D3 | 事件名用 `ns:event` 分隔符（`slot:rotate` 等） | 与既有家族同形（`tool:call` / `llm:start`），读侧一条 grep 即可跨族筛 | 点分隔 `slot.rotate`：同仓两套分隔符，读侧要记两套 |
| D4 | `slot:refuse` 不设 `via` 字段 | 该事件只有一个写面（manifest），单值字段不携带判别信息 | 留 `via`=常量：闭集里的死字段 |
| D5 | 只在四类写时点发事件，读路径零事件 | 读放大（`listSlots` 逐槽读）会把日志冲爆，事件价值被淹 | 全链路埋点：日志成噪声 |
| D6 | 凭证只报明、不跨槽持久化 | 凭证跨槽留活 = 授权范围悄悄放大，须用户单独裁定 | 随槽文件复制：授权边界变更，超出本批 |
| D7 | 单行化 = 固定控制字符集 + 一字符换一空格 | 宽度账逐个守恒；固定集可机判 | 复用 `thincoder-core/markdown.mjs:80` `oneLine`：私有 + 吞空格 + 不覆盖 `\t`/`\v`/`\f`/U+0085/U+2028/U+2029；用 `split(/\s+/).join(" ")`：会并空格、改可见字符宽度 |
| D8 | 两分支两句文案，语义分开 | `/new` 让凭证离开会话、切槽只是本槽不再生效（切回可恢复）；一句文案盖两种事实即误报 | 合成一句「随槽作废」：切槽分支实况不符 |
| D9 | `applySession` 返回对象承载 `droppedDesignTokens` | 端壳取计数的唯一既有中继点；6 个调用点均不读返回值 ⇒ 零回归 | 另加读接口 / agent 上挂临时字段：多一条状态通道 |
| D10 | 状态行兜底放 `render-frame.mjs` 的 `put()` 处 | 唯一写出口；上游任意新增标题来源都被兜住 | 只改 status-line：回退链 / 未来新段再犯 |
| D11 | 上游 `generate-title.mjs:119` 不动 | 该处是标题生成面，改它会改 VSC / 桌面顶栏与清单显示值——跨端行为变更，不在本批 | 生成时就清洗：外溢到未评审的端 |
| D12 | `droppedDesignTokens` 数**离开集**，不数集合大小差 | 整体替换语义下前后是两个不同 id 的集合；`before - after` 在 A(2)→B(2) 时恒 0 ⇒ 静默漏报（§7 C9b） | `max(0, before - after)`：换槽带凭证时恒 0 |
| D13 | guard 异常支补 `preserved` 跟踪 | 闭集 `reason` 的 `unreadable` / `rotate-failed` 在 guard 侧要可判别；今日 catch 吞掉改名成败（`session-guard.mjs:73-75`） | guard 侧恒报一个值：另一个闭集值成死值 |

## 6. 验收判据（回指条目）

| 条目 | 判据（机判） |
|---|---|
| R1 | 今日日志 `~/.thincoder/logs/agent-<YYYY-MM-DD>.log` 中，`grep '"ev":"slot:rotate"'` / `"slot:allocate"` / `"slot:new"` / `"slot:refuse"` 各至少 1 行；每行含 §3.1 该事件的必填字段；任意事件行**不含** `agent.title` 文本、用户消息文本或路径分隔符 |
| R2 · `/new` | 2 个未过期有效凭证 ⇒ `resetSessionState` 返回 `{droppedDesignTokens:2}` 且 CLI 会话流恰一行 `⚠ 2 个已批准设计凭证离开本会话，继续本会话需重走设计评审`；0 个 ⇒ 返回 0 且零新行 |
| R2 · 切槽 A(2)→B(2) | B 槽自带 2 个**不同 id** 的有效凭证 ⇒ `applySession` 返回 `droppedDesignTokens:2` 且恰一行 `⚠ 2 个已批准设计凭证在本槽不再生效（切回原槽可恢复）`——大小差式在本格得 0，本格即抓它 |
| R2 · 切槽 A(2)→B(0) | 返回 `droppedDesignTokens:2` 且恰一行同上下文案 |
| R2 · 切槽 A(0)→B(2) | 返回 0 且零新行（负向锁） |
| R2 · 过期项不计 | A 槽 1 个未过期 + 1 个已过期，切到 B(0) ⇒ 返回 1 |
| R3 | 判据 = `docs/cli/design/TUI.md` §7.4「可机判」行（`title="a\nb"` ⇒ `a b`、行高不变；41 列截断逐字节相同） |
| 通用 | `npm test`（`thincoder-cli/test/run.mjs` 收集 `test/*.test.mjs`）全绿；`doc_check` gate PASS |

## 7. 用例表

| # | 场景 | 输入 | 期望输出 |
|---|---|---|---|
| C1 | 轮转（正常） | 槽文件 cwd 为别的项目 | `slot:rotate reason=foreign-cwd bak=true via=write`；stderr 行照旧 |
| C2 | 轮转（不可读） | 槽文件为半写坏档，改名 `.corrupted` 成功 | `slot:rotate reason=unreadable bak=false via=write` |
| C3 | 轮转（现场未保全） | 槽文件为非法 JSON（`JSON.parse` 抛），并把 `<槽文件>.corrupted` 预先建成目录 ⇒ `:88` 改名失败 | `slot:rotate reason=rotate-failed bak=false via=write` |
| C3b | guard 异常支（现场未保全） | VSC 侧槽文件为非法 JSON，`<槽文件>.corrupted` 预先建成目录 ⇒ `session-guard.mjs:73-75` 改名失败 | `slot:rotate reason=rotate-failed bak=false via=guard` |
| C4 | guard 轮转 | VSC 侧槽文件 `version=3` | `slot:rotate reason=newer-version bak=true via=guard` |
| C5 | 落号 | 全部槽被活进程占（制造路径见 §9） | `slot:allocate slot=<max+1> prevSlot=<active> reason=all-slots-live` |
| C6 | 新建 | `/new` | `slot:new slot=<n> prevSlot=<旧 active> reason=new-session` |
| C7 | 拒写（解析失败） | manifest 为非法 JSON | `slot:refuse reason=parse-failed` + 既有 stderr 拒写行；现场改名 `.corrupted` |
| C7b | 拒写（读失败） | manifest 路径被同名目录占据 ⇒ `readFileSync` 抛 EISDIR（非 `SyntaxError`） | `slot:refuse reason=read-failed`；不改名（现场原样） |
| C7c | 拒写（形态非法） | manifest 为合法 JSON 但顶层形态非法（如 `{"slots":"x"}`）⇒ `isTrustedBase` 假 | `slot:refuse reason=shape-invalid`；现场改名 `.corrupted` |
| C7d | 拒写（读回失败） | `_setManifestWriteHookForTest` 在读回前把临时档写坏 ⇒ `isTrustedBase` 假 | `slot:refuse reason=readback-failed`；现场改名 `.corrupted` |
| C8 | 凭证离开（`/new`） | 内存 2 个有效凭证 + `/new` | 返回 `{droppedDesignTokens:2}`；CLI 恰一行 §3.2 `/new` 文案 |
| C9 | 凭证换装（目标槽无凭证） | A 槽 2 个未过期凭证 → B 槽 0 个 | `applySession` 返回 `droppedDesignTokens:2`；CLI 恰一行 §3.2 切槽文案 |
| C9b | 凭证换装（目标槽也带凭证） | A 槽 2 个未过期凭证（id a1/a2）→ B 槽 2 个不同 id（b1/b2） | 返回 `droppedDesignTokens:2`（离开集）；CLI 恰一行切槽文案 |
| C9c | 凭证换装（本槽无凭证） | A 槽 0 个 → B 槽 2 个 | 返回 0；零新行（负向锁） |
| C10 | 零丢弃（负向锁） | 内存无凭证 + `/new` | 计数 0；零新行（输出逐字节等价） |
| C11 | 标题单行（边界） | `agent.title = "a\nb"` | 状态栏 `a b`，物理行数不变 |
| C12 | 标题双控制符（边界） | `agent.title = "a\r\nb"` | 状态栏 `a  b`（两个空格） |
| C13 | 回退标题单行 | `title=""`，首条 user 消息含 `\t` | 状态栏回退段单行，无 Tab |
| C14 | 空标题 + 空回退 | `title=""`，无 user 消息 | `(empty)`（不受单行化影响） |
| C15 | 超宽截断回归 | title 为 41 列纯 ASCII | 与改动前逐字节相同的 `…` 截断结果 |

## 8. 边界（不做）

- **不做**设计凭证跨槽持久化 / 跨槽继承 / 授权范围变更（§5 D6）。
- **不做** VSC 端报明：该端 `reconcileEngDesignTokens` 的 Map「永不复位清空」（`thincoder-vscode/src/agent/agent-state.mjs:51`），本批 before/after 度量形在该路径没有丢弃时点；从槽合入凭证时只增不减（`:118`）。
- **不做**桌面端报明：`thincoder-desktop/src/main/session-io.mjs:29` 的 `applySession` 前置态（装配出的 agent 的 `_engDesignTokens` 是否非空）本批未勘察 ⇒ 不猜打印点。
- 两端报明随 VSC / 桌面面另批统一接（主 agent 记台账）。
- **不做**事件的可视化面板、聚合统计、告警阈值；只落文件行。
- **不改** `logEvent` 的字段黑名单、脱敏、512 字符收尾语义（通道单源不动）。
- **不改**标题生成面与上游截断（§5 D11）；**不改** VSC / 桌面顶栏、会话清单的标题显示值。
- **不改**状态栏除标题段以外的任何段、不改宽度预算与截断函数。
- 读路径零事件（§3.1 负向锁）。

## 9. 集成测试设计

业务可观察点 = 「用户能看见的会话面」。本批用例：

| # | 入口（业务可观察点） | 判据（断言什么） | 条目 |
|---|---|---|---|
| I1 | 终端里开一个 `a\nb` 标题的会话，看状态栏 | 状态栏一行显示 `a b`，屏幕不滚、不残留旧行 | R3 |
| I2 | 制造一次槽轮转后启动 CLI，`grep` 今日日志 | 有 `slot:rotate` 行，含槽号与 `bak` | R1 |
| I3 | 拿 2 个已批准凭证执行 `/new` | 会话流里恰一行「2 个已批准设计凭证离开本会话，继续本会话需重走设计评审」，会话照常继续 | R2 |
| I4 | 两个槽各带 2 个已批准凭证，从 A 切到 B，看会话流 | 恰一行「2 个已批准设计凭证在本槽不再生效（切回原槽可恢复）」，会话照常继续 | R2 |

**C5（`slot:allocate`）的制造路径**：临时 `sessions` 目录 + 与槽数等量的活进程——启 K 个 `node -e "setTimeout(()=>{},600000)"`，把各 pid 写进该目录 `manifest.json` 的 `slotSessions`（槽 1..K），再在该目录下起第 K+1 个进程触发落号 ⇒ `liveClaimed` 全真 ⇒ 走分支 3，日志得 `all-slots-live`。
**单元面**：`thincoder-cli/test/` 有可用收集器 `run.mjs`（收 `test/*.test.mjs` 与 `test/integration/*.test.mjs`，`thincoder-cli/test/run.mjs:3`；当前零用例即绿）与 `test/slow.mjs`（纯别名）。本批新增常驻文件 `thincoder-cli/test/session-observability.test.mjs`：`singleLineTitle` 控制字符集与宽度守恒、两个返回值、事件字段组装。该文件随 `npm test` 常驻，不作「用后即删」。
