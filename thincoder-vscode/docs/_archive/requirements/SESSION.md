# 会话（SESSION）— 需求（VSC 仓）

> 板块：会话持久化 / 恢复 / 槽位管理（VS Code 面板侧）。本仓自持需求档（异层者建档；依据 = `ENGINEERING-MODE（本仓·需求）§1.3` F11）。
> 对位档：`SESSION（CLI 仓·需求）§10.1 / §11.1 / §13.1 / §14.1`——语义同源、本端原文自持（不做逐字一致）；端差登记见本档 §4。
> 设计见本仓 `docs/design/SESSION.md`（519 行）；权威源 = `src/extension/session-slots.mjs`（400 行）· `session-io.mjs`（437 行）· `panel-session.mjs`（339 行）。
> 实测口径 as-of 2026-09-12。

## 1. 总体需求

为 VS Code 面板解决同一项目的**会话跨回合 / 跨进程持久化与恢复**：每个 cwd 一套**编号槽位**会话文件（与 CLI 共享同一磁盘契约与目录），
面板每回合尾落盘双线历史；新建 / 切换 / 恢复 / 删除走认领与端分离恢复——重启后面板回到原会话与原内容。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| F-N1 | **槽位契约**：目录 `~/.thincoder/sessions/`；文件 `{sha1}.json.N` + `.manifest` + 本端 marker `.manifest.vscode`；hash = `normalizeCwd`（盘符大写）后完整 40 位 sha1。证据 = `src/extension/session-slots.mjs:47-60,107-108,114-117` | 槽文件 / manifest / marker 三件套在位；两端同 hash 同槽位命名空间 | 不截断 hash；不写对端 marker（`.cli` 只读） |
| F-N2 | **双线历史落盘**：人读线瘦身（`slimForDisplay`——args 300 / tool content 500 / 丢 image_url）；机读线一字不动；v2 字段集（version / cwd / title / activeProvider / activeModel / updatedAt / history / contextHistory / tasks / planMode / autoApprove / engineering / engDesignTokens / advisor / pendingReminders / sessionStart）。证据 = `src/extension/session-io.mjs:157-179` · `src/extension/panel-session.mjs:57-69,78-126` | 落盘字段集齐备；机读线往返逐字；v1 单线回退播种（contextHistory 空 → 从 history 播种 + `stripTruncatedToolArgs`） | 不改人读线瘦身阈值语义；不把 transient 消息写进人读线 |
| F-N3 | **新建 / 切换 / 恢复**：`newSlot` 选号跳过 manifest 条目 / 现存文件 / 活认领号；`switchToSlot` 读槽成功才翻 active；`resumeSlot` 三分支（记录可用 → claim / 记录缺失 → 一次性继承 / 其余 → allocateFresh）；marker 三态读 + 原子写。证据 = `src/extension/session-slots.mjs:123-140,259-271,362-380` | 重启恢复三分支行为可机判；占用者不认领；切换失败不动 active | 不做无标记覆盖（占用检测在位） |
| F-N4 | **删除**：`deleteSlotAndUpdate`（文件 + manifest 条目 + deletions 落盘 + active 置空 + marker 显式置空）；「至少留一个会话」；删绑定槽后重绑幸存槽并写 marker。证据 = `src/extension/session-io.mjs:382-393` · `src/extension/panel-session.mjs:227-240` | 删槽后文件 / manifest / marker 一致；最后一个会话不可删 | 删除即弃（不做回收站） |
| F-N5 | **槽位并发（认领 / 占用）**：`claimSlot` / `allocateFresh`（空文件槽回收 → 新号 max+1）；死主清理必须过 `isProcessAlive`；`slotOccupancy`（排除本进程）——占用则不钉槽。证据 = `src/extension/session-slots.mjs:292-339,391-399` | 活进程占用的槽不可被第二实例认领；死主槽可回收 | 不做跨机锁；不做抢占 |
| F-N6 | **GC / 残留清理**：`gcResidue` 只扫当前 cwd 前缀、活跃槽现场保留；保留期 30 天（`.corrupted` / `.unreadable` / `.bak-*`）/ 7 天（孤儿 `.tmp`）；触发 = resumeSlot 包装 → `scheduleSessionGC`（setImmediate + 每前缀去重）；冷 cwd 原语 90 天。证据 = `src/extension/session-gc.mjs:19-22,55-79,86-95` | 活跃槽零误清；超龄残留按保留期清除；调度去重（同前缀不重跑） | 冷 cwd 手动执行面仅 CLI（本端只接线自动残留 GC——端差登记） |
| F-N7 | **标题管理**：自动标题（首条用户消息 → 生成）；写契约 `{ok,reason}` + mtime 门控；手动改名同契约。证据 = `src/extension/panel-session.mjs:244-265` · `src/extension/session-io.mjs:401-424` | 标题写入结果可判（ok / reason）；mtime 门控防旧值回写 | 不改标题生成触发条件 |
| F-N8 | **环境态 / 记忆槽位**：env-state 注入行带 `slot: {N}`（顶层回合注入）；会话级三字段（tasks / goal / pendingReminders）+ engDesignTokens 往返；槽 → agent 水合。证据 = `src/agent/setup-reminders.mjs:37-50` · `src/agent/run-helpers.mjs:217-246` · `src/agent/agent-state.mjs:80-108` | 注入行含槽号；三字段往返逐值；水合后 agent 状态与槽一致 | 不改 env-state 行格式 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| N-N1 | 原子写 | 槽文件写 = `.tmp` + rename（失败降级 unlink + rename → 直写）；marker 写失败容忍 | `src/extension/session-slots.mjs:144-154` |
| N-N2 | 现场保全 | 结构非法 → `.unreadable`；解析失败 → `.corrupted`；`.tmp` 回退提升；manifest 解析失败 → `.manifest.corrupted` | `src/extension/session-io.mjs:99-137` · `src/extension/session-slots.mjs:194-198` |
| N-N3 | 覆盖防护 | 写前 `.bak-{ts}` 轮转（v>2 / sessionStart 不符 / 磁盘 history 更长 三条件）+ mtime 缓存门控 | `src/extension/session-io.mjs:325,334-376` |
| N-N4 | 上限与迁移 | 槽号自动增长（新号 = max+1）；历史分页步长 200（本端规定）；短 hash 5 候选一次性改名 + Set 幂等 | `src/extension/history-window.mjs:18-22` · `src/extension/session-slots.mjs:62-99,292-327` |
| N-N5 | 可机判 | 会话行为由用例断言（含集成场景） | `test/session-boot.test.mjs`（319 行 / 4 例）· `test/history-window.test.mjs`（192 行 / 8 例）· `test/history-restore.test.mjs`（237 行 / 9 例）· 集成 `test/integration/scenario-04-session-recovery.test.mjs`（140 行 / 5 例） |

## 4. 对位与端差登记（对位 = `SESSION（CLI 仓·需求）§10.1 / §11.1 / §13.1 / §14.1`）

| 面 | 本端 | 端差（登记） |
|---|---|---|
| marker | 端常量 `END = "vscode"`——只写 `.vscode`、永不碰 `.cli` | 对端写 `.cli`；双端各持自身 marker（认领面隔离） |
| 历史分页步长 | 200（`HISTORY_PAGE_SIZE`） | 对端 = 20 |
| 恢复呈现 | assistant 帧容器 + 嵌套工具卡（本端渲染规则——turnStart / 配对规则对齐对端） | 呈现形态端差；配对语义同源 |
| 冷 cwd 手动 GC | 扩展无 shell 通道——只接线自动残留 GC | 对端有手动执行面 |
| 记录存储形态 | 无 append-only 记录存储 / sidecar 机制（实测零命中） | 对端对应面见对位档 §14.1 域——本端零该机制（如实登记） |
| 操作竞态守卫 | `turnBusy()` 拒新会话 / 删除 / 切换 / 换项目 | 本端会话操作与回合互斥的实现面 |

- 差异若有 → 逐条补登记（不静默）；本档不代述对端正文。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 A 轮——异层者建档；内容 = 本端机制实况登记 + 端差登记；零新需求语义）。
