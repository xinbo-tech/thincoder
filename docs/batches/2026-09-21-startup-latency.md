# 批次档 · 2026-09-21 启动等待时长（STARTUP-LATENCY）

> 批次边界：一个交付目标（启动等待回到正常量级）+ 一组同批条目（F-SL1 / F-SL2 / F-SL3）。
> 六段各自作者在案（§2 = eng-designer · §3 = 评审子代理 · §5 = eng-coder）。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-21（父侧）

**用户报告（2026-09-21 03:16 · 逐字）**：「感觉thincoder现在启动的时间好长啊，你分析一下是为啥？时间长对用户体验影响很大。」

**用户裁定（2026-09-21 03:31 · 逐字）**：「可以，就这么修。」——= 批准本档「修法方向」四项中的 **1 / 2 / 3**（见下）；第 4 项（二次成本：单进程化 / 懒加载 / execSync 去重 / MCP 连接优化）**不在本批**（候选在册，如需纳入请示下）。

**用户授权（父侧代点火 + 代批准 · 时限「跑到干完」· 2026-09-21 04:06）**：用户逐字「**自动跑完**」⇒ 本批链上的**设计评审点火权**与 **§4 用户批准权**均**委托父侧自动执行**（含轮 2 重发），至本批收口 ✓。
**父侧自缚**：① 代签仅当「评审 **pass（0 🔴）** ∧ 修正轮已落地并逐条核验 ∧ token 已签发」三条件齐备代签；② 代签在 §4 写明「父侧代签（用户 04:06『自动跑完』授权）+ 依据」；③ 需**新范围**或**用户口径裁决** ⇒ 停下 ✓。

**根因（父侧实测钉定 · 2026-09-21 02:4x–03:2x · 全数字为实测）**：

- **主犯① · sessions 热路径同步阻塞 ≈10s**：`resumeSlot`（`bin/thincoder.mjs:315`）→ `scheduleSessionGC(cwd)`（`session-lifecycle.mjs:39`）→ `gcResidue` 的**同步 `readdirSync`**（`session-gc.mjs:86`）——`~/.thincoder/sessions/` = **20,227 项**（9,358 个 cwd 前缀遗留）；直接实测 `readdirSync` = **9,999 / 10,641ms**；CPU profile = `readdir` 同步自时 30.4s；**空 HOME 对照全链 495ms** ⇒ 启动 9.6–16s 的 ~95% 在此。CLI / VSC 端壳 resume 路径同源受影响。
- **主犯② · traces 全量扫描**：存量 **15,610** 个 `.jsonl`（4 日目录：6,609 / 1,979 / 5,574 / 1,394）；`cleanupTraces` 逐文件串行 `stat` ⇒ ① 启动后台风暴；② `--version` 印出后挂 **12.5s**；③ `recordChatTrace` 每写一条又全扫。
- **从犯（≈1.0s · 本批不动）**：builtin tools 0.5s（含 2× `gitAuthor()` execSync）· MCP 连接 0.3s · SQLite 开 0.16s（memory DB 3.3GB）· TUI 图导入 0.3s · 双进程包装。

**本批条目（覆盖）**：**F-SL1**（GC 热路径零同步阻塞）· **F-SL2**（sessions 存量治理）· **F-SL3**（traces 清理面性能边界）——需求档 = `docs/core/requirements/SESSION.md` §2.4 + `docs/core/requirements/TRACES.md` §2.3（机制单源）；CLI 面读数锚 = `docs/cli/requirements/TUI.md` §3 **N12**。

**范围边界（不做）**：二次成本四项（单进程化 / 懒加载 / execSync git 去重 / MCP 连接优化）不动 · 不动活数据（活主 / 近期写 / 绑定面）· 不改槽 / 轨迹格式与端标记形态 · 不改「完整落盘 + prune」策略裁决本身 · 不引入常驻进程。

**数据面（用户 03:31 已点头）**：sessions 9,358 个陈旧 cwd 组 + traces 15,610 文件 = 本批执行面（判据 / 保留期 / 执行面由设计钉；零误删活数据）。

**口径扩（2026-09-21 03:36 用户裁定 · 逐字）**：「设计如此是设计不对，这也是端差，应该消除，这部分代码能进核吗？这样两端可以共用同一套机制。」⇒ F-SL2 的显式命令面**双端都要有**（VSC 补端侧入口；机制 = 核单源——已实核：核备 `listColdCwds` / `deleteColdCwd`，VSC 转口已在；「冷 cwd 手动执行面仅 CLI」端差**注销**，登记面 = `docs/core/design/SESSION.md` §6.12 ④）。**属 F-SL2 口径扩，非新条目 ⇒ 本批范围内。**

**验收读数（可机检 · 本机）**：启动到 TTY 门 ≤ **2s**（对照 9.6–16s；空 HOME 0.495s + 真装配 ~1.0s 为参考下界）；`--version` 总时长 ≤0.5s（对照 12.9s）；启动路径同步 fs 阻塞 ≤50ms；三端测试全绿；存量清理后目录量级回落。

**前情**：无直接前批（启动观感面与 `docs/batches/2026-09-21-loading-screens.md`（已收口）相邻但机制不同——本批 = 等待时长本体）。

## §2 批次任务与设计（eng-designer）

**状态行**：🔄 设计完成 · 待评审（2026-09-21 · eng-designer · round = initial）

**本批条目（覆盖 · 三方一致基准 = 需求档 ↔ 本节 ↔ 设计档回指）**：

| 条目 | 内容 | 需求源 |
|---|---|---|
| F-SL1 | GC 热路径零同步阻塞（`resumeSlot` → `scheduleSessionGC` → `gcResidue` 链；判据 = 启动路径同步 fs 阻塞 ≤50ms） | `docs/core/requirements/SESSION.md` §2.4 |
| F-SL2 | sessions 存量治理（可清组判据 / 保留期 / 执行面；含 03:36 口径扩：显式命令面**双端**、端差注销） | 同上 §2.4 |
| F-SL3 | traces 清理面性能边界（目录级判据 / 每写节流 / 存量清理） | `docs/core/requirements/TRACES.md` §2.3 |

CLI 面读数锚 = `docs/cli/requirements/TUI.md` §3 **N12**（启动到 TTY 门 ≤2s / `--version` ≤0.5s / 三端测试全绿）。

**设计档落点（就地并入 · 坐标 = 落笔后实读）**：

- `docs/core/design/SESSION.md`：§2.2 `:35`（#125 行端差处置列收正——冷 cwd 手动面双端同面）· §5 `:59`（本批落点指针）· §6.12 `:210-214`（残留 GC 触发句 + 冷 cwd 条 + 模块约束收正 + 端差注销）· **新增 §6.17 `:380-434`**（判据句 / 边界情形表 / 验收回指 / 端差注销）· §7 `:473-477`（**新增 D-SE34–D-SE38**）· 变更记录 `:547-548`。
- `docs/core/design/TRACES.md`：§6.3 `:72`（边界行收正）· **新增 §6.4 `:76-89`**（目录级三段梯 / 节流 / 触发面收窄 / 存量清理 / 模块落点）· §7 `:102-104`（**新增 D-TR11–D-TR13**）· 变更记录 `:134`。
- `docs/cli/design/TUI.md`：§1 `:24`（地图行补 `writeLoadingLine`）· **新增「启动序（首帧前）」`:56-61`** · 变更记录 `:609`。

**设计要点**：

**① F-SL1（D-SE34 · 全链异步化）**：清立面两档（`thincoder-core/session-gc.mjs` 与 `thincoder-core/session-stale.mjs`）内**零同步扫描**——`readdirSync` / `statSync` / `readFileSync` / `unlinkSync` / `rmSync` 禁用，目录与逐文件面一律 `node:fs/promises`（同步 fs 仅留 `existsSync` 单条目探测）。`scheduleSessionGC(cwd)` 保持「每进程每前缀一次 + 不阻塞调用面」；pass = 一次异步目录快照 → 残留面（当前前缀）+ 存量面（有界）。触发时点 = 启动窗外延迟拍（核侧 `setTimeout`——`GC_PASS_DELAY_MS` = 3s，D-SE39）；**不做帧耦合**（核无帧概念 / VSC 无帧事件——异步化已满足判据）。双端同源：CLI `thincoder-cli/bin/thincoder.mjs:322` · VSC 端壳 `thincoder-vscode/src/extension/session-io.mjs:89`（经纯转口 `thincoder-vscode/src/extension/session-gc.mjs:15`）⇒ 判据双端同判。

**② F-SL2（D-SE35 / D-SE36 / D-SE37 / D-SE38）——可清组判据（唯一公式，组粒度）**：
- **组** = sessions 根下同一 40 位 cwd 哈希前缀的全文件集合。
- **可清 ⟺ 三合取**：① 无活属主（manifest `slotSessions` 经入口一次探测束 + `ownerState` 三态——**活 / 未知 ⇒ 保留**；无 manifest ⇒ 该条自动满足）；② 内容面不可达或无内容（**T1**：可读数据文件 `cwd` 全部不存在于磁盘——至少读到一份；**T2**：组内无任何数据文件）；③ 安全窗：组内最新 mtime < now − **7 天**（`STALE_SAFETY_WINDOW_MS`）。**90 天冷判据保留**（cwd 存活组唯一出口）。
- **理由链**：cwd 不可达 ⇒ 内容在恢复 / 检索发现 / 列表呈现三路径均不可达；T2 ⇒ 内容面为零；安全窗兜临时不可达 + 竞态。**端无关**（双端共享 sessions 根——任一端可清另一端弃用 cwd）。
- **实测分布（as-of 2026-09-21 · 设计轮实读）**：9,358 组 ⇒ 一次性清理预期 **≈7,384 组**（T1 = 5,869 · T2 = 1,515）；余 = 0–7 天窗口 1,970 组 + cwd 存活 4 组；抽样 262/262 组 cwd 均不存在且全为临时目录（`%TEMP%` 下 acp 测试遗留）⇒ 判据覆盖面经实证。
- **两级窗口 + 回收目录（D-SE36）**：判据窗 7 天 + 回收保留 7 天 ⇒ **不可逆删除最早 = 最后写入 + 14 天**；回收根 `~/.thincoder/sessions-trash/<批次时间戳>/`（sessions 根外——不参与扫描 / 不入发现面）；恢复 = 移回原目录。
- **执行面双层（D-SE37）**：自动面 = 启动空闲拍每进程一次、有界 ≤ `STALE_SWEEP_LIMIT`（500 组/次）+ 回收清运；显式命令面 = `session gc --dry-run` / `--confirm <hash>` / `--confirm --all`（**零新增旗标**——判据扩展使候选面自然扩大）。
- **VSC 命令入口 + 端差注销（D-SE38）**：命令 `thincoder.sessionGc`（`thincoder-vscode/package.json` contributes.commands + 处理体 `thincoder-vscode/extension.mjs:128` 起同址簇）；流程 = `listColdCwds`（核数据面）→ 计数报告 → 模态警告确认（`showWarningMessage(..., {modal:true}, "Delete")`；驳回 / undefined ⇒ 零删除）→ 逐组 `deleteColdCwd`（内部重校验）→ 汇总；**不消费 `runSessionGc`**（保 `advisor-consult-merge.test.mjs:170-175` 核内零消费方结构机检）。端侧命令档 = `thincoder-vscode/src/extension/session-gc-command.mjs`（拟新增）；原「仅 CLI」端差注销（登记面 = §6.12 + §6.17 + 端壳 `session-gc.mjs` 头注）。

**③ F-SL3（D-TR11 / D-TR12 / D-TR13）**：
- **目录级三段梯（D-TR11）**：设 `D` = 日目录、`retention` = `traces.retentionHours`——① `dayEnd(D) + retention ≤ now` 且目录全 `.jsonl` ⇒ **整目录删**（递归 rm，零逐文件 stat）；② `dayStart(D) + retention > now` ⇒ **整目录跳过**；③ 其余（含非 `.jsonl` 条目的目录）⇒ 逐文件 stat + unlink（现行语义；非 `.jsonl` 不碰）。空日目录按现法移除。语义 delta 登记（列报）：整删不逐文件核 mtime（正常写入 mtime ∈ 目录日 ⇒ 无差异）。
- **每写节流（D-TR12）**：`maybePruneTraces`（`recordChatTrace` 写盘成功后调用）——`PRUNE_THROTTLE_MS` = 10 分钟窗 + 在飞合并；`cleanupTraces` 本体保持无状态。判据 = 同窗 3 连写 ⇒ 扫描 ≤1。双端同函数（CLI = 启动扫 + 每写；VSC = 仅每写——宿主长驻）。
- **启动清理触发面收窄（D-TR13）**：仅会话型命令（`tui` / `chat` / `acp`）执行（`thincoder-cli/bin/thincoder.mjs:144` 触发闸）；纯信息命令零后台工作 ⇒ `--version` ≤0.5s 可闭合。策略裁决（完整落盘 + prune）不变。
- **存量一次性清理**：目录级判据下任一后续清理拍即整删全部过期日目录（幂等、可复跑）；判据 = `.jsonl` 总量回落。
- **模块落点**：清理面外提 `thincoder-core/traces/trace-cleanup.mjs`——`trace-store.mjs` 回落 ≤300（消解既有超软线在册）；`cleanupTraces` 经 `trace-store.mjs` re-export 保既有 import 面。

**受影响文件表（R24a · as-of 2026-09-21 · 行数 = 实读）**：

| 文件 | 行数（实读） | 预期增量 | 档位 / 越线核查 |
|---|---|---|---|
| `thincoder-core/session-gc.mjs` | 248 | +≈45 | 目标 ≤300（≈293，余 ≥7）；越线 ⇒ 随批登记 `SOFT_LINE_REGISTRY` + 拆分计划（残留面外提姊妹档） |
| `thincoder-core/session-stale.mjs`（拟新增） | 0 | ≈200–250 | 新档 ≤300（分组 / 判据 / 回收 / 清运单源） |
| `thincoder-core/traces/trace-store.mjs` | 303（既有在册） | −≈35 | 清理面外提后 ≈268 ≤300 ⇒ **移出 `SOFT_LINE_REGISTRY`**（登记表同批编辑） |
| `thincoder-core/traces/trace-cleanup.mjs`（拟新增） | 0 | ≈120–150 | 新档 ≤300 |
| `thincoder-cli/bin/thincoder.mjs` | 440（既有超软线） | +≤15 | ≤500 硬限（余 ≥45）；结构不变（触发闸一处） |
| `thincoder-vscode/extension.mjs` | 168 | +≤15 | ≤300（≈183） |
| `thincoder-vscode/src/extension/session-gc-command.mjs`（拟新增） | 0 | ≈90–130 | 新档 ≤300 |
| `thincoder-vscode/src/extension/session-gc.mjs` | 16 | ±0（头注收正） | ≤300 |
| `thincoder-vscode/package.json` | 135 | +7 | 命令注册（contributes.commands） |
| `thincoder-core/test/core-hygiene.test.mjs` | 151 | ±3 | 登记表增删（trace-store 移出） |
| `thincoder-core/test/session-gc-stale.test.mjs`（拟新增） | 0 | ≈180–240 | 用例 T-SL1.x / T-SL2.x |
| `thincoder-cli/test/session-gc-cli.test.mjs`（拟新增） | 0 | ≈120–180 | CLI 命令面 + 触发闸用例 |
| `thincoder-vscode/test/trace-cleanup.test.mjs`（拟新增） | 0 | ≈90–140 | 用例 T-SL3.x |
| `thincoder-vscode/test/session-gc-command.test.mjs`（拟新增） | 0 | ≈120–170 | VSC 命令面用例 |

零改动预期（保绿）：`thincoder-vscode/test/trace-store.test.mjs`（400——`D-TR10 清理` 用例在本判据下逐断言同结果：纯 `.jsonl` 目录整删 / 含 `.txt` 目录走逐文件）· `thincoder-cli/test/session-store.test.mjs:216`（T-RS9——回收移动后 `existsSync` 断言同结果）。

**测试面（用例表 · normal / boundary / error）**：

| 用例 | 类别 | 输入 / 装置 | 期望 |
|---|---|---|---|
| T-SL1.1 | 正常（结构） | 两档源文本扫描 | 零 `readdirSync` / `statSync` / `readFileSync` / `unlinkSync` / `rmSync`（`existsSync` 豁免） |
| T-SL1.2 | 正常（行为） | 假 sessions 目录 ≥10,000 项；起 `resumeSlot(cwd)` 后同拍挂 100ms 定时器 | 定时器 ≤1s 触达（事件循环未被同步扫描吞噬；旧实现同装置 ≥10s 级） |
| T-SL1.3 | 边界 | 目录缺失 / 探测失败 | GC 静默降级；`resumeSlot` 正常返回 |
| T-SL2.1 | 正常（判据矩阵） | 组夹具逐格：活主 / 未知 / cwd 存活 / 不可读 / 窗内 / T1 / T2 | 逐格 reason 与 keep 期望（纯函数直测） |
| T-SL2.2 | 边界（零误删） | 活属主组（探活注入 alive）· 未知组 | 均不候选 |
| T-SL2.3 | 正常（一次性清理） | 300 组夹具（含槽 + manifest + 残留）；`runSessionGc(["gc","--dry-run"])` → `["gc","--confirm","--all"]` | dry-run 全列零删；confirm 后原目录零残留 + 回收批全量在；二次跑候选 0（幂等） |
| T-SL2.4 | 正常（可回退） | 回收批文件移回原目录 → `listSlots`；`purgeTrash` 双窗 | 移回后摘要读得回；保留期内不删 / 超期批删除 |
| T-SL2.5 | 边界（TOCTOU） | 候选列举后该组变活（新 mtime / 新活属主） | `deleteColdCwd(hash)` 返回 `{ok:false, reason:"not-cold"}`，零删除 |
| T-SL2.6 | 边界（有界） | 600 候选 | 单次自动 pass 恰处理 ≤500 组 |
| T-SL2.7 | 正常（端无关） | 含 `.vscode` marker 的组经 CLI 面 | 可清（判据不引用端） |
| T-SL3.1 | 正常（目录级） | 3 个过期纯 `.jsonl` 日目录 + 当天目录 + 含 `.txt` 过期目录 | 前 3 整删（零逐文件 stat——计数注入）；当天零动；含 `.txt` 走逐文件且 `.txt` 不碰 |
| T-SL3.2 | 正常（节流） | 同窗 3 连写 | 扫描 ≤1（`maybePruneTraces` 首调 true / 后调 false） |
| T-SL3.3 | 边界（语义保真） | VSC `D-TR10 清理` 既有用例 | 全绿（保留期 / 非 `.jsonl` 语义不变） |
| T-SL3.4 | 正常（存量） | 缩比夹具：全部过期日目录 | 整删后 `.jsonl` 总量回落；可复跑幂等 |
| T-SL3.5 | 正常（触发闸） | `node bin/thincoder.mjs --version` | 零 traces 扫（真机读数 ≤0.5s） |
| T-VSC-SG1 | 正常 + 边界（VSC 命令面） | mock vscode：候选空 / 确认 / 驳回（undefined） | 空 ⇒ 零删除提示；确认 ⇒ 逐组 `deleteColdCwd`；驳回 ⇒ 零删除；命令注册 + 直调点机检在案 |
| T-VSC-SG2 | 边界（VSC 命令面） | 删除期某组变活 | 该组拒绝行 + 其余组继续；汇总含跳过计数 |

**数据面执行设计（一次性清理：9,358 组 + 15,610 轨迹文件）**：
- **时机**：sessions 侧 = 显式命令（用户确认后 `session gc --confirm --all` 执行一次；自动面按 7 天窗渐进 ≤500 组/次）；traces 侧 = 首个会话型命令启动即清（后台异步）或复跑（幂等）。
- **判据**：三合取公式（§6.17）+ 逐组删除前重校验（TOCTOU）；traces = 目录级三段梯。
- **原子性**：组内逐文件 rename 进回收批（同卷元数据操作；顺序 = 残留 / 端标记 → manifest → 数据文件）；单文件失败 = 跳过并计数；组粒度非事务——不可达性保证任意中途状态安全（无活属主 + cwd 不可达 / 零内容）。
- **回退**：回收批 7 天保留（不可逆删除 ≥14 天）；恢复 = 文件移回原目录；命令输出给出回收路径与恢复提示；超期票在后续 pass 清运。
- **预期读数**：sessions 9,358 组 → ≈1,974 组（余 0–7 天窗口 + cwd 存活 4 组）；目录项 20,227 → ≈4k 量级；轨迹 4 个日目录中非当日者整删（15.6k 文件量级回落）。

**验收（回指需求 · 可机检）**：① 同步阻塞 ≤50ms = T-SL1.1（结构）+ T-SL1.2（行为）；② 启动到 TTY 门 ≤2s / `--version` ≤0.5s = 真机读数（父侧收口跑，对照 9.6–16s / 12.9s）；③ 三端测试全绿（CLI / core / VSC `npm test`）；④ 存量回落 + 零误删 = T-SL2.1–T-SL2.7（含 dry-run 全列 / confirm 全移 / 幂等 / 可回退）；**端差注销在档可实读**（§6.12 / §6.17）+ VSC 命令入口可机检（T-VSC-SG1）。

**边界（不做）**：不改槽文件 / manifest / 端标记形态 · 不改 90 天冷判据与残留后缀保留期 · 不引入常驻进程 / 后台定时器 · 不动二次成本四项（单进程化 / 懒加载 / execSync 去重 / MCP 连接）· 不读 / 不改用户 config.json · 不改「完整落盘 + prune」策略裁决 · 不做轨迹压缩 / 加密 / 重放。

**未决 / 上报（父侧）**：
1. `docs/core/requirements/SESSION.md:56`（F-SL2 口径扩句）**372 字符超行宽**——父侧笔域；不收则 `doc-check` 全局 exit 1（见 2）。
2. `node scripts/doc-check.mjs --root .` 全局读数 = **exit 1 / 3 项**，**均非本代理笔域**：① 上述需求档行宽；② `docs/core/design/BATCH-RECORD.md:167`（悬空锚 `agent-tools/batch.mjs`）+ ③ 同档 `:349`（589 字符）——该档正由并行批 `2026-09-21-batch-lifecycle-tool` 在写（working tree 未提交），未触碰（避并发写冲突）。**本代理三档（SESSION / TRACES / TUI）机检 0 悬空 / 0 行宽**（本代理一处 328 字符行宽已当场折行）。
3. 7 天安全窗 + cwd 不可达判据的残余风险登记：非临时目录的 cwd 长期不可达（外接盘 / 网络盘长期离线）⇒ 回收 7 天缓冲后不可逆——当前证据（存量 100% 为临时目录遗留）支持该窗；如需更长窗口请示裁。
4. `session-gc.mjs` 越线风险（目标 ≈293）：若实施读数 >300 ⇒ 随批登记 `SOFT_LINE_REGISTRY` + 拆分计划（切面 = 残留面外提，设计已备）。
5. 端差注销实施面（coder 轮）：`thincoder-vscode/src/extension/session-gc.mjs` 头注 `:11` 改述；VSC 归档需求档 F-N6 表述不维护（归档档）。
6. 设计轮实测分布（§6.17「实测分布」）为设计轮实读读数（as-of 2026-09-21）——实施后如落笔刷新请以新读数为准（不影响判据）。

**自检**：需求覆盖 F-SL1 / F-SL2（含 03:36 口径扩）/ F-SL3 / N12 逐条 ✓；判据句全部在档（§6.17 / §6.4 / 启动序节）✓；验收逐条回指 ✓；受影响文件表（file 级 + 行数 + 档位 + 越线核查）✓；用例表（normal / boundary / error）✓；数据面执行设计（时机 / 原子性 / 判据 / 回退）✓；端差注销在档 + 双端命令面 ✓；三档变更记录各一行 ✓；未决 / 偏差清单 6 条 ✓。

**修正轮（round = fix · 2026-09-21 · 承 §3 轮次 1 发现表 · eng-designer）**

**源**：§3 轮次 1 = VERDICT `changes-required`；表 13 行。父侧已逐条裁定**接受（全数）**；处置执行人 = 本代理；口径 = 评审 `Suggestion` 列 + 父侧派单「设计要点与禁止范围」（需求档本体零写 / 产品与测试代码归实施轮 / 不引新机制面）。
**§3 计数行不符（报父侧）**：计数行「🔴 1 · 🟡 8 · 🔵 5（共 14）」与表实读不符——表 = 13 行（1🔴 / 7🟡 / 5🔵）。§3 = 评审子代理笔域，本代理**零改**。

**逐号处置（号 → 落点 file:line · 坐标 = 修正轮落笔后实读）**

| # | 处置 | 落点（实读） |
|---|---|---|
| 1 🔴 | 自动面**判据集合钉死 = 仅三合取组**（D-SE35）；**90 天冷 cwd 面（cwd 存活组唯一出口）保持显式命令面**——理由在档（cwd 存活 = 内容可达，自动回收致不可逆；与核档头注「v1 不自动删 manifest」同向）；§6.12 条标签同步收正为「执行面双档」 | `docs/core/design/SESSION.md:410`（执行面）· `:211`（§6.12 标签）· `:483`（D-SE37 行） |
| 2 🟡 | 有界语义 = 每 pass **内容判据 ② 评估 ≤500 组**（**非删除数**）+ 选取顺序（组最新 mtime 升序——最旧优先）+ 前向推进论证 + 求值序 / 短路（③ mtime → ① 属主 → ② 内容；短路组不占上限）+ 单 pass 成本读数（设计值） | `SESSION.md:411-414` |
| 3 🟡 | 回收根 = **由当次 sessions 根 `dir` 派生（同级）** + 清运面带注入 now 缝；VSC 命令面**显式传端侧派生的 sessions 根** + 用例沙箱缝 | `SESSION.md:417`（D-SE36）· `:422`（目录来源） |
| 4 🟡 | D-TR13 **白名单化**（含 `command === undefined` 无参默认路径；白名单外命令逐名写明；闸位 = 命令解析之后） | `docs/core/design/TRACES.md:91-93` |
| 5 🟡 | 受影响文件表补 `thincoder-vscode/test/files.mjs`（行数 + 增量 + 登记动作 + 分域判据——见下） | 本档本节「受影响文件表 · 补行」 |
| 6 🟡 | 错误类用例补 3 条（T-SL2.8 / 2.9 / 2.10）+ 边界情形表补对应行 | 本档本节「用例表 · 修正轮」· `SESSION.md:435-436` |
| 7 🟡 | 验收①机检路由**改述三档**（结构扫描 + 行为代理 ≤1s + 收口真机读数；≤50ms 归收口面）——**取「改述」支**（否决「补埋点用例」：同步耗时采样埋点属新机制面，本轮禁）；D-SE34 判据句同步 | `SESSION.md:393` · `:438` |
| 8 🟡 | 端差注销**落地清单补需求侧行**（`docs/core/requirements/SESSION.md` §4.5 ④ 行——父侧直改；本代理零写需求档） | `SESSION.md:423` |
| 9 🔵 | 落点坐标回填（as-of 修正轮实读——见下「落点坐标回填」） | 本档本节 |
| 10 🔵 | TUI 启动序收正（import → `resumeSlot` → 装配 → `writeStartupSequence` + `writeLoadingLine` → 首帧） | `docs/cli/design/TUI.md:60-61` |
| 11 🔵 | 未决 1 改述**已消解**（需求档 `:56-58` 三行 <300——实读 135 / 195 / 46；03:36 裁定句实住 `:57`） | 本档本节「未决块更新」 |
| 12 🔵 | 整删支 `removed` 计数口径 = **批内 `.jsonl` 条目数**（既有断言面保绿）+ 非日期名目录**回落 ③ 逐文件支**成文 | `TRACES.md:87-88` |
| 13 🔵 | 节流窗**测试缝注明**（`_resetTraceStateForTest` 一并复位 / now 注入缝 + 跨用例残留提示） | `TRACES.md:89-90` |

三档变更记录各一行（修正轮）：`SESSION.md:556-558` · `TRACES.md:140-141` · `TUI.md:610`。

**受影响文件表 · 补行（#5）**

| 文件 | 行数（实读 `wc -l` 口径） | 预期增量 | 档位 / 越线核查 |
|---|---|---|---|
| `thincoder-vscode/test/files.mjs` | 122 | +2 | ≤300；实施步节点 = 两新测试档落地步**同笔登记**（`test/trace-cleanup.test.mjs` / `test/session-gc-command.test.mjs`——漏登记 ⇒ `npm test` 启动自检 fail-closed，`thincoder-vscode/test/run.mjs:52-56`） |

**VSC 清单分域判据**：域界 = `test/integration/` 为集成域、顶层 `test/*.test.mjs` 为单元域（`thincoder-vscode/test/run.mjs:52-61` + `thincoder-vscode/test/integration/files.mjs:4-7`）⇒ 本批两新档（纯单元 + 夹具沙箱）落**单元清单**；`test/integration/files.mjs`（实读 23 行）**零改**。
**读数口径收正（一致性面 · 当场修）**：原表「零改动预期」行写 `thincoder-vscode/test/trace-store.test.mjs`（400）——`wc -l` 实读 = **399**（同表其余读数 248 / 303 / 440 / 168 / 135 / 151 复读相符）。

**用例表 · 修正轮（改述 / 新增行——与原表同表同义，原行以本节为准）**

| 用例 | 类别 | 输入 / 装置 | 期望 |
|---|---|---|---|
| T-SL2.6（改述） | 边界（有界） | 600 组全过 ③∧① 的可清候选 + 若干 ③ / ① 短路组 | 单次自动 pass **内容判据（②）评估**组数恰 ≤500（删除 ≤500）；短路组**不占上限**；余量下一 pass 继续（幂等推进） |
| T-SL2.8（新增） | 错误（回收根只读） | 回收根不可写（只读 / 占用） | 逐文件 rename 跳过并计数；原组文件**零删除**（不 unlink 兜底）；组保持可重判 |
| T-SL2.9（新增） | 错误（组内 rename 中途失败） | 组内单文件 rename 抛错（注入缝） | 部分移动态安全（组不可达）；二次跑幂等（计数一致 / 不重复移动） |
| T-SL2.10（新增） | 错误（清运失败） | 超期回收批不可删（只读 / 占用） | 静默跳过、**不误删在期批**；后续 pass 重试 |
| T-SL3.1（补注） | 正常（目录级） | 3 个过期纯 `.jsonl` 日目录 + 当天目录 + 含 `.txt` 过期目录 | 前 3 整删且 `removed` 计数 = 批内 `.jsonl` 条目数；当天零动；含 `.txt` 走 ③ 且 `.txt` 不碰 |
| T-SL3.2（补注） | 正常（节流） | 同窗 3 连写（**须先复位节流窗**——缝 = `_resetTraceStateForTest` 扩展 / now 注入；跨用例残留提示） | 扫描 ≤1（首调 true / 后调 false） |
| T-SL3.5（补注） | 正常（触发闸·负例） | `node bin/thincoder.mjs --version` | 零 traces 扫（真机读数 ≤0.5s） |
| T-SL3.6（新增） | 正常（触发闸·正例） | 无参启动（`command === undefined`）与 `tui` / `chat` / `acp` | 启动清理**仍执行**（白名单含无参默认路径——`thincoder-cli/bin/thincoder.mjs:312-313`） |
| T-VSC-SG1（补注） | 正常 + 边界（VSC 命令面） | mock vscode + **装置显式传 temp `dir`**（沙箱缝） | 空 ⇒ 零删除提示；确认 ⇒ 逐组 `deleteColdCwd`；驳回 ⇒ 零删除；命令注册 + 直调点机检在案 |

**落点坐标回填（#9 · as-of 修正轮实读）**：`docs/core/design/SESSION.md` = §6.17 `:381` · §6.12 冷 cwd 条 `:211-213` · 执行面 `:408` · D-SE38 段 `:419-423` · 边界情形表 `:425-436` · 验收回指 `:438` · **D-SE34–D-SE38 `:480-484`** · 变更记录修正行 `:556-558`；`docs/core/design/TRACES.md` = §6.4 **`76-96`** · 变更记录修正行 `140-141`；`docs/cli/design/TUI.md` = 启动序节 **`56-63`** · 启动序行 `60-61` · 变更记录修正行 `610`。（评审轮实读值 474-478 / 548-549 / 76-91 / 56-62 = 会话内时点读数——坐标随修正轮内容增长位移，以本节实读为准。）

**未决块更新（#11）**：未决 1 = **已消解**（父侧 03:47 折行已落——需求档 `docs/core/requirements/SESSION.md:56-58` 三行实读 135 / 195 / 46 字符 <300；03:36 裁定句实住 `:57`）。未决 2 = **读数刷新**：`node scripts/doc-check.mjs --root .`（仓根）= FAIL 2 类——① 锚：`docs/core/design/BATCH-RECORD.md:168`（悬空 1 条）；② 行宽：`BATCH-RECORD.md:356`（589）+ `docs/core/requirements/SESSION.md:128`（355——即 #8 的 §4.5 ④ 行，父侧直改时一并消解）。**本批三档（SESSION / TRACES / TUI）0 悬空 · 0 行宽**（修正轮前后同读）。未决 3–5 保持（实施面）。

**自检（修正轮）**：13 号逐条落地 ✓（可核坐标）；受影响文件表补行 + 分域判据 ✓；用例表 **normal / boundary / error** 三类在册（错误类 3 条）✓；三档变更记录各一行 ✓；机检路由三档在档（`:393` / `:438`）✓；端差注销落地清单含需求侧行 ✓；未决 1 消解 + 未决 2 读数刷新 ✓；三档 doc-check 0 悬空 / 0 行宽 ✓。

**修正轮 2（round = fix · 2026-09-21 · 承 §3 轮次 2 残留表 · eng-designer）**

**源**：§3 轮次 2 = VERDICT `pass`（13/13 Fixed）；两项非阻塞残留经父侧裁定**接受**：🟡#14（#2 残留——前向推进论证未覆盖 ② 面保留组）+ 🔵#15（#4 残留——D-TR13 决策行未同步）；另附批档读数收正一处（未决 2）。处置执行人 = 本代理；口径 = 父侧派单「设计要点与禁止范围」（不引新机制面 / 需求档零写 / 产品与测试代码归实施轮 / 只动本批三档）。

**逐号处置（号 → 落点 file:line · 坐标 = 修正轮 2 落笔后实读）**

| # | 处置 | 落点（实读） |
|---|---|---|
| 14 🟡 | ① 边界情形表补行：**② 面保留组（T1 不成立 / 不可读）计入 500 预算**——达 ≥500 组时自动面滞留（升序窗口被永久占用、更新的可清组永不进入）；**兜底 = 显式命令面**（`session gc --confirm --all`——全量面）；② 单 pass 成本读数补 **① 面 manifest 读**（进入 ① 面的组各一次——存量下 ≈7.4k 次/pass，异步）；③ 零新机制（「本 pass 跳过集」不采纳——父侧裁定：登记边界 + 兜底即可） | `docs/core/design/SESSION.md:437`（补行）· `:414`（成本读数） |
| 15 🔵 | §7 **D-TR13 行同步白名单形态**（含无参默认路径 `command === undefined`——与 §6.4 机制行 `:91` 一致） | `docs/core/design/TRACES.md:109` |
| 未决读数收正 | 未决 2 改述：`docs/core/requirements/SESSION.md:128` 项**已消解**（父侧 04:04 折行）；复跑 `node scripts/doc-check.mjs --root .`（仓根）读数 = **行宽仅剩 `docs/core/design/BATCH-RECORD.md:356`（589 字符）· 悬空仅剩同档 `:168`**——两者均属并线批 `2026-09-21-batch-lifecycle-tool`（working tree 未提交），**非本批**；**本批两档（SESSION / TRACES）0 悬空 / 0 行宽**（修正轮 2 前后同读） | 本档本节 |

两档变更记录各一行（修正轮 2）：`docs/core/design/SESSION.md:560-561` · `docs/core/design/TRACES.md:142`。

**自检（修正轮 2）**：#14 / #15 逐条落地（可核坐标）✓；边界行 + 兜底在档、零新机制面 ✓；成本读数含 ① 面 manifest 读 ✓；两档变更记录各一行 ✓；`doc-check` 本批触碰档零新增（读数见「未决读数收正」行）✓；未决 3–5 保持（实施面）✓。

**实施轮补充覆盖（2026-09-21 · 用例表补录 · 追溯面）**

标注 = **实施轮补充覆盖 · 2026-09-21**；来源 = §5 实施记录（交付摘要表第 10 行 + 审计处置 🔵#6）· 机制判据 = `docs/core/design/SESSION.md` §6.17。

| 用例 | 类别 | 输入 / 装置 | 期望 |
|---|---|---|---|
| T-SL2.11（新增） | 正常（冷面显式 + 可回退） | 90 天冷 cwd 组（cwd 存活——内容可达）经自动面（`listStaleCwds`）；再经显式面 `deleteColdCwd` | 自动面零动作（冷面不入三合取面——仍为显式命令面）；显式面回收成功（`reason: "cold-90d"`）——**回收替代直删**（经回收目录；回收批在 = 可回退） |
| T-SL2.6 内「② 面滞留相位」（补充） | 边界（有界 / 滞留） | 500 个恒保留组（cwd 存在 ⇒ T1 不成立 ⇒ ② 保留）+ 一个更新的可清组 | 单 pass `evaluated = 500` / `candidates = 0`（② 面保留组占满 500 预算——自动面滞留相位，§6.17 边界行）；**兜底 = 显式全量面可达**（全量列举面） |

**修正轮 3（收口前机制微修 · round = fix · 2026-09-21 · 承父侧 04:5x 真机复测 · eng-designer）**

**源**：父侧真机复测 = 验收② 未达成（无参启动拒印 **2,955 / 4,162ms**；pass 竞争下 `resumeSlot` **1,894 / 1,945 / 3,768ms**，安静态对照 126ms；`session gc --dry-run` 全面 **41.6s / 6,887 候选**）+ 派单（处置执行人 = 本代理；round = fix；禁改验收② ≤2s 数值 / 需求档 / 产品与测试代码——归 coder 微轮；禁表外档；禁全量重勘）。设计档落笔 = 本代理（docs first）。

**逐号处置（号 → 落点 file:line · 坐标 = 本轮落笔后实读）**

| # | 处置 | 落点（实读） |
|---|---|---|
| A 触发 | pass 与启动链解耦 = **启动窗外延迟拍**（核侧 `setTimeout`——`GC_PASS_DELAY_MS`（拟新增）= 3s；每进程每前缀一次保持；不 unref——保后台排空现状；核无帧概念保持）；启动解耦判据句在档；否决「调用面首帧后点火」 | `docs/core/design/SESSION.md:395-396`（触发句 + 判据句）· `:391` · `:411` · `:210`（§6.12 触发句）· `:484` + `:489`（D-SE34 / D-SE39） |
| B 预算 | ① 面 manifest 读纳入每 pass 预算 = **过 ③ 进 ① 即耗 1**（总评估 ≤ `STALE_SWEEP_LIMIT`；达上限即停、余量下一 pass 继续；③ 短路组零预算）；前向推进论证改写；成本行 = 每 pass 总评估 ≈500 组（含 ① manifest 读）；边界行泛化（恒保留组占预算 ⇒ 滞留相位；兜底 = 显式全量面 limit=Infinity） | `SESSION.md:412-417`（有界语义 / 预算口径 / 前向推进 / 成本行）· `:440`（边界行）· `:444`（不做行）· `:447` / `:487` / `:490`（§7 头 / D-SE37 / D-SE40） |
| C 一致性 | 触发术语传播收正（「异步 + 空闲拍」→「异步非阻塞」——机制单源指针不变） | `docs/cli/design/TUI.md:62` + 变更记录 `:610`（前插） |

变更记录（各一行）：`SESSION.md:568-569` · `TUI.md:610`。

**实施面（coder 微轮 · 设计已收正，逐点）**：`thincoder-core/session-gc.mjs`（`scheduleSessionGC` 现 `:132-138` → `setTimeout` + 常量 + 测试缝 `_setSessionGcDelayForTest(ms)`（拟新增，`_setSessionsDirForTest` 同款）；注释面 = 头注 `:18` · `gcPass` doc `:117` · `scheduleSessionGC` doc `:129-131`）· `thincoder-core/session-stale.mjs`（`listStaleCwds` 现 `:145-174` 预算闸位移到过 ③ 进 ① + `evaluated` 读数 = 预算消耗组数；注释面 = 头注 `:14-15` / `:139-144` / `:166` / `:229`）· 调用面注释同步 = `thincoder-core/session-lifecycle.mjs:36` · `thincoder-vscode/src/extension/session-io.mjs:86` · 测试 = `thincoder-core/test/session-gc-stale.test.mjs`。

**用例面 delta（承上 · 原用例行以本节为准）**：T-SL2.2 `evaluated` 期望改「过 ③ 组数」（① 短路组已耗 1 预算）；T-SL2.6 预算口径 = 过 ③ 进 ① ≤500（含 ① manifest 读；滞留相位断言 `evaluated = 500 / candidates = 0` 不变）；T-SL1.2 = 注入 0 延迟后 100ms 定时器 ≤1s 触达；T-SL1.4（新增）= `GC_PASS_DELAY_MS` = 3000 常量机检 + 源文本 `setTimeout` 无 `setImmediate`（结构）。

**doc-check 读数（`node scripts/doc-check.mjs --root .` · 仓根）**：全局残 2 项 = `docs/core/design/BATCH-RECORD.md:168`（悬空）+ `:356`（行宽 589 字符）——均属并线批 `2026-09-21-batch-lifecycle-tool`，**非本批**；**本轮触碰两档（SESSION / TUI）0 悬空 / 0 行宽**（`GC_PASS_DELAY_MS` 新符号 = 符号·宽报告面，不入闸）。

**自检**：A / B 逐条落地（可核坐标）+ 判据句 / 成本行 / 前向推进论证在档 ✓；两档变更记录各一行 ✓；三处一致性 = 条目（F-SL1 / F-SL2）与验收② 数值零动 ✓；doc-check 本轮触碰档零新增 ✓；未决见下。

**未决 / 观察（报父侧）**：① 目录快照逐条目 stat（≈20k 次/pass）仍不在预算面——A / B 收口后单 pass 有界性不含快照成本；若 UI 期 fs 争用仍有感可另案。② 启动链上调度 GC 的一次性命令进程退出被延迟拍推后 ≥3s（对照现状「后台排空」同向、设计内）；coder 微轮如遇 CLI 用例超时预算紧张可评估注入缝。

**修正轮 4（收口前机制微修 2 · round = fix · 2026-09-21 · 承父侧 #9 后 8 轮复测 · eng-designer）**

**源**：父侧 #9（GC 延迟拍）落地后复测 8 轮——无参启动至拒印 = 2.2 / 1.5 / 2.7 / 1.8 / 2.9 / 2.4 / 1.3 / 1.7 s（≤2s 命中 4/8 ✗ 中位 ≈2.1s ⇒ 验收② 仍未稳定达标）。残余竞争者 = **traces 启动清理**（`thincoder-cli/bin/thincoder.mjs:144-149` 闸内 `cleanupTraces(...)` 未随 GC 延迟化——fs 爆发（4 日目录 ≈15k 文件：3 个过期目录整删 + 今日 1,873 文件逐文件）仍落在启动窗内、与启动链争同一事件循环）。处置执行人 = 本代理（父侧裁定）；禁项 = 验收② 数值 / 需求档 / 产品与测试代码（归 coder 微轮）/ 表外档 / 全量重勘。

**逐号处置（号 → 落点 file:line · 坐标 = 本轮落笔后实读）**

| # | 处置 | 落点（实读） |
|---|---|---|
| A 收正 | D-TR13 增「**启动清理 = 启动窗外延迟拍**」——**核侧 `setTimeout` 取支**：拟新增 `scheduleTraceCleanup({ dir, retentionHours })` + `TRACE_CLEANUP_DELAY_MS` = 3s（与 D-SE39 同值同形态；不 unref；失败静默移入调度器；白名单 / 闸位 / 每进程一次语义保持；测试缝 `_setTraceCleanupDelayForTest(ms)` 注入 0–短值）；**判据句在档** = 启动链不因 traces 清理竞争超 2s（无参启动至拒印 ≤2s × 复测 ≥2 次）+ 结构保证「清理起点 ≥ 调度点 + 3s」；否决闸位包裹（缝不可注入 / 常量外落端层）·「首帧后点火」（同 D-SE39） | `docs/core/design/TRACES.md:91`（标题）· `:94-99`（延迟拍段） |
| B 一致性 | §7 D-TR13 行同步（白名单 + 延迟拍 + 理由）；变更记录一行 | `TRACES.md:115` · `:150-151` |

**一致性面（本轮当场修 · 随报）**：§6.4 模块落点行——旧文写「`cleanupTraces` re-export 保既有 import 面（CLI `thincoder-cli/bin/thincoder.mjs:20` 与两端测试）」+ 陈旧「（拟新增）」标记：A 落地后 bin 启动面改直引调度器（不再引 `cleanupTraces`）⇒ CLI 指针与「拟新增」标记一并收正（re-export 面收窄为「两端测试」+ 新增调度器直引句） | `TRACES.md:102`

**实施面（coder 微轮 · 设计已收正，逐点）**：① `thincoder-core/traces/trace-cleanup.mjs`——新增 `TRACE_CLEANUP_DELAY_MS` = 3000 · 模块延迟值 · `_setTraceCleanupDelayForTest(ms)` · `scheduleTraceCleanup({ dir, retentionHours = 24 })`（`setTimeout` 延迟点火；`.catch(() => {})` 移入；不 unref；头注收正）；② `thincoder-cli/bin/thincoder.mjs:20`（import 面：`cleanupTraces` → `tracesRoot` + 新增 `scheduleTraceCleanup` 直引 trace-cleanup.mjs）· `:138-149`（闸内改调 `scheduleTraceCleanup({ dir: tracesRoot(), retentionHours })` + 注释收正为「延迟拍」形态）；③ 测试面 = `thincoder-vscode/test/trace-cleanup.test.mjs`（缝用例：注入 0–短值 ⇒ 清理真点火 + 常量 3000 结构断言）· `thincoder-cli/test/session-gc-cli.test.mjs`（结构机检符号面收正：`cleanupTraces(` 直调零处 → `scheduleTraceCleanup(` 恰一处且门内；T-SL3.6 观测面见未决 ②）。

**验收（本轮 · 可机检）**：① A / B 落位（坐标见上）+ 判据句在档 ✓；② 变更记录一行 ✓；③ `node scripts/doc-check.mjs --root .` 本批触碰档零新增 ✓（读数见下）；④ 逐号回报在案 ✓。

**doc-check 读数（`node scripts/doc-check.mjs --root .` · 仓根）**：改前 = 锚 **OK（0 悬空）** · 行宽 1 项 = `docs/core/design/BATCH-RECORD.md:356`（589 字符——并线批 `2026-09-21-batch-lifecycle-tool`，非本批）；改后 = 同读（TRACES.md **零新增悬空 / 零新增行宽**；新符号 `scheduleTraceCleanup` / `TRACE_CLEANUP_DELAY_MS` / `_setTraceCleanupDelayForTest` = 符号·宽报告面，不入闸——与 `GC_PASS_DELAY_MS` 先例同）。全局 exit 1 残项 = 上述并线批行宽（非本批）。

**自检**：A / B 逐条落地（可核坐标）+ 判据句在档 ✓；变更记录一行 ✓；验收② 数值零动 / 需求档零写 / 产品与测试代码零触 ✓；一致性面 1 处（随报）✓；doc-check 本批触碰档零新增 ✓。

**未决 / 观察（报父侧）**：① 两处延迟拍同值 3s（GC / traces）——收口复测若显示 +3s 附近仍有争用观感，错峰（如 traces 4s）可另案评估（本轮禁项）。② **T-SL3.6 观测面（实施轮须处置）**：`[]` / `tui` / `chat` 三子用例在非 TTY / 无键路径经 `exitSoon` 早退（~+0.1–2s < 3s）⇒ 延迟拍不执行、原「启动清理已执行」行为断言不再可观测（`acp` 长驻路径仍可观测；语义在档 = 早退 ⇒ 本次不执行、幂等）——建议收正 = 结构断言（门内 `scheduleTraceCleanup` 恰一处）+ `acp` 长驻行为见证 + 核侧缝用例；如需子进程注入 0 延迟 = 新增环境缝（面外——请示裁）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = STARTUP-LATENCY 批设计（F-SL1 / F-SL2 含 03:36 口径扩 / F-SL3）· 对象状态 = 待评审 · 触发 = 用户点火（2026-09-21 03:51）。
**实核面**（本次评审读盘取证）：批档 §2 受影响文件表逐档行数 · 关键 file:line（bin:315/:139/:20 · session-lifecycle.mjs:38-39 · session-gc.mjs:86/:10-11 · trace-store.mjs:199/:269/:284 · VSC session-io.mjs:88-89 · session-gc.mjs(端壳):11 · package.json:59-76 · extension.mjs:127-128 · core-hygiene.test.mjs:46-58/:117-131 · advisor-consult-merge.test.mjs:170-175 · VSC test/run.mjs:52-56 + test/files.mjs:6 · trace-store.test.mjs:225-258 · session-store.test.mjs:216-244 · TUI.md:24/:56-62 · TRACES.md:76-91 · SESSION.md:211/:385-386/:392-412/:425/:474-478/:548-549）。
**限制声明**：无项目标准档声明（方法学按 Project Guide 判）· 无文档地图 ⇒ 文档归属判据降级（按 Project Guide + 同板既有先例判）· 行宽 372 字符读数未复跑 doc-check（unverified）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 需求覆盖 / 机制一致性 | 🔴 | 同一清理面的执行面两处描述不一致且自动面判据集合未钉：`docs/core/design/SESSION.md:211` 标「**冷 cwd / 存量组清理**（手动面——双端同面）」；`docs/core/design/SESSION.md:409` 同时存在「**自动面**：…有界 ≤ `STALE_SWEEP_LIMIT`（500）组/次 + 回收清运」。自动面适用的判据集合全文未钉——若沿用「可清组 = 三合取 ∪ 保留的 90 天冷判据」（`:403`「90 天冷判据保留…cwd 存活组唯一出口」+ 边界表 `:425`「cwd 存在 ⇒ 仅走 90 天冷判据」），则 **cwd 存活（内容可达）组会在启动时被自动移入回收批、14 天后不可逆**，与既有纪律「F2 冷 cwd（手动——12.2.4 三步，v1 不自动删 manifest）」（`thincoder-core/session-gc.mjs:10-11`）相抵，也超出需求档对该面自动化的界定（`docs/core/requirements/SESSION.md:56` 的陈旧组 = cwd 目录已不存在 / 属主死 / 无活数据文件）。 | 在 §6.17 钉死自动面的判据集合（建议：自动面只做三合取组；90 天冷面保持显式面），并把 §6.12 该条的执行面标签改成与之一致；若确要自动化 90 天面，则随批登记该语义变更（含 cwd 存活组的自动回收风险与回退窗）。 |
| 2 | 清晰度 / 可行性 | 🟡 | 「有界 ≤ `STALE_SWEEP_LIMIT`（500 组/次）」的边界语义未钉：是**评估** ≤500 组还是**删除** ≤500 组（用例 T-SL2.6「600 候选 ⇒ 单次自动 pass 恰处理 ≤500 组」读作后者，批档:105）。若边界只落在删除，则每次启动仍须评估全部组（含逐文件读 `cwd` 取 T1），单 pass 成本无界；组选取顺序 / 游标 / 判据求值序（先 stat 还是先读文件）全未定 ⇒ 无进度保证（前 500 组若恒为「保留」组，自动面可永不推进）。 | 写明「每 pass 评估组数上限 + 选取顺序（如按组最新 mtime 升序 + 游标持久化/跳过集）」与判据求值序（建议 ③ mtime → ① 属主 → ② 内容，含短路口径），并把单 pass 成本读数（读文件数 / 耗时）列入登记。 |
| 3 | 清晰度 | 🟡 | 新面的目录来源未钉（两处）：① 回收根写死 `~/.thincoder/sessions-trash/<批次时间戳>/`（`docs/core/design/SESSION.md:412`），未说是否随 `dir` 注入缝——既有用例 `thincoder-cli/test/session-store.test.mjs:239-241` 注入 temp `dir`，而核 `dir` 缺省 = 核内 configDir 版、**不随沙箱缝**（端壳头注自述 `thincoder-vscode/src/extension/session-gc.mjs:8-11`）⇒ 沙箱测试可能写到真实 HOME；② VSC 命令面（`:416`）只说走 `listColdCwds` / `deleteColdCwd`，未说传哪个 `dir`（端侧 `sessionsDir()` 为核 `sessionPath` 反推——`docs/core/design/SESSION.md:259`）⇒ 端侧命令与端侧其余会话面可能不同目录，T-VSC-SG1 也无沙箱缝。 | 钉明「回收根 = sessions 根同级、由 `dir` 派生」（使既有 `dir` 缝覆盖回收批，并给清运一条注入 now 的缝）；钉明端侧命令显式传端侧派生的 sessions 根（或统一走核访问器），用例给沙箱缝。 |
| 4 | 清晰度 | 🟡 | D-TR13 触发闸未以白名单形态写死：`docs/core/design/TRACES.md:88` / 批档:68 只列「会话型命令（`tui` / `chat` / `acp`）」，而主入口是 `case "tui": case undefined:`（`thincoder-cli/bin/thincoder.mjs:305-306`）——无参默认路径未点名（照字面实现即漏掉主启动路径）；且「纯信息命令（`--version` / `--help` / `completion` 等）零后台工作」未覆盖同样被闸掉的 `memory` / `sync` / `reindex` / `distill` / `upgrade` / `session`。 | 以白名单写死（含 `undefined` 默认路径），补一条「无参启动仍执行启动清理」的用例（现 T-SL3.5 只测 `--version`）。 |
| 5 | 受影响文件 | 🟡 | 受影响文件表缺 `thincoder-vscode/test/files.mjs`：VSC runner 对盘上**未登记**的 `*.test.mjs` fail-closed（`thincoder-vscode/test/run.mjs:52-56` + `thincoder-vscode/test/files.mjs:6`「新增测试文件：在此登记」）⇒ 两个新 VSC 测试档（批档:88-89）不登记则 `npm test` 必红，验收③「三端测试全绿」不成立。（core / CLI 两侧为 glob 收集，无需登记——`thincoder-core/test/run.mjs:31-42`。） | 表内补 `thincoder-vscode/test/files.mjs`（当前行数 + 增量）并在实施步节点名登记动作（含 integration 清单分域判据）。 |
| 6 | 验收标准 | 🟡 | 用例表无「错误」类用例（批档:97-113 全为 正常 / 边界），而自检声称「用例表（normal / boundary / error）✓」（批档:134）；组面与清理面的错误路径（回收根不可写 / 组内 rename 中途失败 / 清运失败 / 评估期 manifest 损坏 / 跨卷 rename 回落）无覆盖。 | 补 2–3 条错误类用例（例：回收根只读 ⇒ 逐文件跳过且计数；组内单文件 rename 失败 ⇒ 部分移动态安全 + 二次跑幂等；超期批清运失败 ⇒ 静默且不误删）。 |
| 7 | 验收标准 | 🟡 | 验收①的机检路由与用例表不一致：`docs/core/design/SESSION.md:392` 称「机检 = 结构扫描 + **同步前缀埋点**」，批档用例只有结构扫描（T-SL1.1 源文本动词扫描）与行为代理（T-SL1.2 定时器 ≤1s，批档:98-99），无埋点用例；「≤50ms」样本无直测项。 | 二者对齐：或补埋点用例（启动路径同步 fs 耗时采样 ≤50ms），或改述为「结构扫描 + 行为代理（≤1s）+ 收口真机读数」三档并把 ≤50ms 明确归收口面。 |
| 8 | 文档归属 | 🟡 | 端差注销未波及需求层登记：`docs/core/requirements/SESSION.md:126-128` 仍列「VSC 端差（登记）④ 冷 cwd 手动 GC 无 shell 通道」，而 D-SE38 已补端侧命令入口（`docs/core/design/SESSION.md:417`；批档:63 / 未决 5 只提归档档 F-N6）。 | 把需求档 §4.5 ④ 一行列入端差注销落点（或注明在本批失效），保持需求 ↔ 设计三层一致。 |
| 9 | 清晰度 | 🔵 | 落点坐标多处与实读不符（批档自称「坐标 = 落笔后实读」）：D-SE34–38 实为 `SESSION.md:474-478`（批档写 `:473-477`）· §6.17 变更记录实为 `SESSION.md:548-549`（写 `:547-548`）· TRACES §6.4 实为 `76-91`（写 `:76-89`）· TUI「启动序」实为 `56-62`（写 `:56-61`）。 | 按实读复核并回填坐标（本批其余落点坐标抽验相符：`SESSION.md:35` #125 / `:59` 指针 / §6.12 `210-214` / `TRACES.md:72` / `TUI.md:24`）。 |
| 10 | 清晰度 | 🔵 | `docs/cli/design/TUI.md:60` 启动序把「子进程 import + 装配」排在 `resumeSlot` 之前；实码 `resumeSlot` 已前移至装配之前（`thincoder-cli/bin/thincoder.mjs:310-316`：`:315` resumeSlot → `:316` assembleAgent）。 | 收正为 import → `resumeSlot` → 装配 → `writeStartupSequence` + `writeLoadingLine` → 首帧。 |
| 11 | 清晰度 | 🔵 | 批档未决 1 引 `docs/core/requirements/SESSION.md:56`，而 03:36 裁定句实住 `:57`（实读）；372 字符读数本次评审未复跑 doc-check（unverified；门限 = 300，`PROJECT-MANIFEST.json:24`）。 | 复核行号与字符读数后回填（本项为父侧笔域，改写前先复跑）。 |
| 12 | 清晰度 | 🔵 | 目录级整删的返回计数语义未钉：既有 VSC 用例断言 `removed === 2`（`thincoder-vscode/test/trace-store.test.mjs:248-249`），整删支若不把批内文件计入 `removed`，批档「零改动预期（保绿）」不成立；非日期名日目录的归类（日期解析 NaN ⇒ 两条件恒假 ⇒ 自然落 ③）亦未成文。 | 钉明整删支计数口径（按批内 `.jsonl` 计数）与非日期名目录回落 ③ 的口径。 |
| 13 | 清晰度 | 🔵 | 节流窗缺测试缝说明：T-SL3.2（同窗 3 连写 ⇒ 扫描 ≤1）需重置 / 注入 `PRUNE_THROTTLE_MS` 窗的缝，模块级窗会跨用例残留（既有先例 = `_resetTraceStateForTest`，`thincoder-core/traces/trace-store.mjs:99`）。 | 在 `docs/core/design/TRACES.md` §6.4 / 用例表注明节流状态的复位或注入缝。 |

**计数**：🔴 1 · 🟡 8 · 🔵 5（共 14）。
**越界注（无严重度）**：① `docs/core/design/CORE-UNIFICATION.md:1102` 的「`SOFT_LINE_REGISTRY` 在册 35 档 / 已登 14 / 待补 21」在 trace-store 移出登记表后即失配——该节 = 设计侧行数与拆分计划落点（同档 `:1079`），本批落点表未列（该档不在本次评审范围，仅报不改）；② 本批「可清 ⟺ 三合取」与保留的 90 天面的**并集**关系由边界表 `SESSION.md:425` 承载，公式行本身未写并集（与发现 1 同源）。
**抽验相符（备查）**：受影响文件表读数 248 / 303 / 440 / 168 / 135 / 151 与盘上 `wc -l` 口径相符；新增拟档（`session-stale.mjs` / `trace-cleanup.mjs` / 三测试档）盘上均不存在；`STALE_*` / `PRUNE_THROTTLE_MS` / `sessions-trash` 全仓零命中（确为新引入）；`advisor-consult-merge.test.mjs:170-175` 确为「核内零消费方」结构机检（`runSessionGc` 仅核外消费）——D-SE38「不消费 `runSessionGc`」的判据理由成立（该机检只扫核内 ⇒ VSC 消费其实不会破门，属保守取法）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮 2 核验（评审子代理 · 触发 = 父侧代点火 · 用户 04:06「自动跑完」授权）**：核验对象 = §3 轮次 1 的 13 项修正（+ 兜底新问题）。**本轮读盘面（全量重读）**：批档 §2（含修正轮节）· `docs/core/design/SESSION.md` · `docs/core/design/TRACES.md` · `docs/cli/design/TUI.md`（:40-79 / :595-619）· `docs/core/requirements/SESSION.md`；代码抽验：`index.mjs:162/:168` · `bin/thincoder.mjs:305-306/:315-316`。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/SESSION.md | 🔴 | Fixed | §6.17:410「**自动面（判据集合 = 三合取组）**…**仅三合取组（D-SE35）**；**90 天冷 cwd 判据面…不入自动面**，保持显式命令面」+ §6.12:211「**执行面双档**——90 天冷 cwd 面（cwd 存活组唯一出口）= **显式命令面**；三合取存量组 = **自动面（有界）+ 显式面（全量）**」+ D-SE37:483 同步 ⇒ 判据集合钉死、两处标签一致、边界行 :431 相容。 |
| 2 | 2 | docs/core/design/SESSION.md · 批档 | 🟡 | Fixed | :411「`STALE_SWEEP_LIMIT`（500）= **每 pass 评估组数上限**（**不是删除数**）；评估闸落在**内容判据 ②**…不占上限」+ :412 求值序/短路（③→①→②）+ :413 选取顺序（mtime 升序）+ :414 成本读数（登记）；批档 T-SL2.6 改述 :177；残留下探（见 #14）。 |
| 3 | 3 | docs/core/design/SESSION.md · 批档 | 🟡 | Fixed | :417「回收根 = **由当次 sessions 根 `dir` 派生（同级）**…`dir` 注入缝因此覆盖回收批…清运面带**注入 now 的缝**」· :422「处理体**显式传端侧派生的 sessions 根**…用例沙箱缝 = 处理体接受注入 `dir` + 装置显式传 temp 目录」· D-SE36:482·D-SE38:484 同步；批档 T-VSC-SG1 补注 :185。 |
| 4 | 4 | docs/core/design/TRACES.md · 批档 | 🟡 | Fixed | :91「**D-TR13 启动清理触发面收窄（白名单）**…`tui`（**含无参默认路径 `command === undefined`**…）」+ :92 白名单外命令逐名（`memory`/`sync`/`reindex`/`distill`/`upgrade`/`session`）+ 闸位 = 命令解析后；批档 T-SL3.6 正例 :184。残留小注见 #15。 |
| 5 | 5 | docs/batches/2026-09-21-startup-latency.md | 🟡 | Fixed | 受影响文件表「补行」:166-168 补 `thincoder-vscode/test/files.mjs` 122 行 +2 + 实施步节点名登记动作；:170 分域判据（单元/集成清单，`test/integration/files.mjs` 零改）。 |
| 6 | 6 | docs/batches/… · docs/core/design/SESSION.md | 🟡 | Fixed | 错误类 3 条在册：T-SL2.8（回收根只读）/T-SL2.9（组内 rename 中途失败）/T-SL2.10（清运失败）:178-180；边界情形表补对应行 :435-436；自检「normal / boundary / error」:191 属实。 |
| 7 | 7 | docs/core/design/SESSION.md | 🟡 | Fixed | :393「判据句 = 启动路径同步 fs 阻塞样本 ≤50ms——**机检路由三档**：① 结构扫描 ② 行为代理 ③ **收口真机读数**」+ 验收回指 :438 同口径（取「改述」支，否决埋点——属新机制面）⇒ 与用例表一致。 |
| 8 | 8 | docs/core/requirements/SESSION.md | 🟡 | Fixed | :128「④ 冷 cwd 手动 GC 无 shell 通道（只接线自动残留 GC）——**注销（2026-09-21）**：VSC 已补命令入口 `thincoder.sessionGc`…（见 `docs/core/design/SESSION.md` §6.17 D-SE38）」——留行 + 注销标 + 现态指针（端差注销形态）✓。 |
| 9 | 9 | 三档落点坐标 | 🔵 | Fixed | 修正轮回填 :187 逐条实读相符：SESSION.md §6.17 `:381` · §6.12 `:211-213` · 执行面 `:408` · D-SE38 段 `:419-423` · 边界表 `:425-436` · 验收回指 `:438` · D-SE34–38 `:480-484` · 变更记录 `:556-558`；TRACES.md §6.4 `76-96` · `:140-141`；TUI.md 启动序节 `56-63`。 |
| 10 | 10 | docs/cli/design/TUI.md | 🔵 | Fixed | :60-61「序：…→ 子进程 import → `resumeSlot`（`bin/thincoder.mjs:315`）→ 装配（同档 `:316`）→ `writeStartupSequence`（`index.mjs:162`）+ `writeLoadingLine`（同档 `:168`）→ 首帧」——代码抽验相符（`index.mjs:162`=writeStartupSequence / `:168`=writeLoadingLine；`bin:315`=resumeSlot / `:316`=assembleAgent）。 |
| 11 | 11 | 批档未决块 | 🔵 | Fixed | :189 未决 1 = 已消解（需求档 :56-58 折行；03:36 裁定句实住 `docs/core/requirements/SESSION.md:57`——本轮实读相符）。doc-check 读数见「未复核项」。 |
| 12 | 12 | docs/core/design/TRACES.md | 🔵 | Fixed | :87「整删支的 `removed` 计数 = 该批内 `.jsonl` 条目数…既有断言面保持（`thincoder-vscode/test/trace-store.test.mjs:248-249` `removed === 2`）」+ :88 非日期名目录回落 ③ 成文。 |
| 13 | 13 | docs/core/design/TRACES.md | 🔵 | Fixed | :90「**测试缝（D-TR12）**：节流为模块级状态（**跨用例残留**）——缝 = 既有先例 `_resetTraceStateForTest`…扩展为**一并复位节流窗**（或给节流面注入 now 缝），用例须显式复位」✓。 |
| 14 | (new) | docs/core/design/SESSION.md | 🟡 | New（#2 残留） | 前向推进论证只覆盖 ③/① 短路组：`:413`「③ / ① 短路组不占上限（零预算）⇒ 恒保留组不阻塞推进」——但**通过 ③∧① 后在 ② 被保留（T1 不成立 / 不可读——边界行 `:431`/`:432`）的组会占 500 预算**且恒保留 ⇒ ≥500 个此类组时，升序窗口被永久占用、更新的可清组永不进入（即设计自己否决「上限计全部评估组」时点名的同一失效形态，`:413` 末句）。另：`:414` 成本读数未计 ① 面 manifest 读（③∧① 通过组各一次——存量下 ≈7.4k 次/pass）。建议：边界表登记该情形 + 明示兜底 = 显式命令面（或加「本 pass 内跳过集」），并把 manifest 读计入成本读数。 |
| 15 | (new) | docs/core/design/TRACES.md | 🔵 | New（#4 残留） | §7 D-TR13 行 `:109`「启动清理触发面 = **会话型命令**（tui / chat / acp）」未随白名单化同步（未提 `command === undefined` 默认路径）；机制行 `:91` 已含 ⇒ 建议同步一行。 |

**计数**：本轮 = 🔴 0 · 🟡 1（新） · 🔵 1（新）；§3 轮次 1 的 🔴 1 项已闭合（13/13 处置落地，其中 #2 / #4 各留 1 项残留新发现）。
**未复核项（unverified）**：批档未决 2 的 doc-check 读数（`docs/core/requirements/SESSION.md:128` = 355 字符 / `BATCH-RECORD.md:356` 等）本轮无工具复跑；`:128` 目视 ≈150 字符 ⇒ 建议父侧复读确认口径（按行 vs 按块）。
**越界注（无严重度 · 仅报不改）**：`docs/core/design/CORE-UNIFICATION.md:1102`「`SOFT_LINE_REGISTRY` 在册 35 档」在 trace-store 移出后仍失配（设计侧台账落点，本批落点表未列情况未变）。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 04:06「自动跑完」授权 · 代签三条件齐备）**：

- 依据 ① **评审 pass**：§3 轮次 2 = 🔴 0 · 🟡 1（新 · #14）· 🔵 1（新 · #15）——非阻塞；两项经父侧裁定接受并已由修正轮 2 落地（`docs/core/design/SESSION.md:437` 边界行 + `:414` 成本读数 · `docs/core/design/TRACES.md:109` 行同步——父侧逐处实读核验 ✓）；
- 依据 ② **修正轮已落地并逐条核验**：修正轮 1（13 项）+ 修正轮 2（#14 / #15 / 未决读数收正）——父侧逐号抽读核验 ✓ · doc-check 本批触碰档零新增 ✓（全局残项 = 并线批 `BATCH-RECORD.md`，非本批）；
- 依据 ③ **token 已签发**（轮 2 通过即发——不落值）。

**批准 = 本批设计（F-SL1 / F-SL2 含 03:36 口径扩 / F-SL3 · §6.17 + D-SE34–D-SE38 + §6.4 + D-TR11–D-TR13 + 启动序节）为正式设计，准予实施** ✓。
（数据面一次性执行已获用户 03:31 点头——留父侧轮后执行；二次成本四项不在本批 ✓。）

## §5 实施记录（eng-coder）

（待批准后。）

**实施轮（eng-coder · round = initial · 2026-09-21）**

**状态行**：✅ 实施完成 · 三端测试全绿 · 内部审计 + 代码评审已收敛（0 🔴）——待父侧收口（§6）。

**交付摘要（15 档 + 表外 1 档 · 行数 = 实读 `wc -l` 口径）**

| # | 档 | 落点（行数） | 要点 |
|---|---|---|---|
| 1 | `thincoder-core/session-gc.mjs` | 279（目标 ≤300 ✓） | 全链异步化（`node:fs` 仅 `existsSync`）；`gcPass` 编排（一次 readdir 快照共享两面）；`listColdCwds`/`deleteColdCwd` 加 `hashes`/`entries` 缝；`runSessionGc` 三形态候选面 = 冷 90 天 ∪ 三合取全量；回收替代直删 |
| 2 | `thincoder-core/session-stale.mjs`（新） | 242 | 分组 / `judgeStaleGroup`（纯函数三合取）/ `listStaleCwds`（升序 + ② 预算 + 短路零预算 + 前缀预筛）/ `recycleGroup`（回收序 + 不 unlink 兜底）/ `deleteStaleCwd` / `purgeTrash` / `sweepStale`；`STALE_SAFETY_WINDOW_MS` 7 天 · `STALE_SWEEP_LIMIT` 500 · `sessions-trash/` 由 `dir` 派生 |
| 3 | `thincoder-core/traces/trace-cleanup.mjs`（新） | 86 | 目录级三段梯（① 整删 = 批内 `.jsonl` 计数 / ② 整跳 / ③ 逐文件）+ `dayBounds`（非日期名 + 非法日 ⇒ ③）+ `_cleanupHooks` 计数注入缝 |
| 4 | `thincoder-core/traces/trace-store.mjs` | 299（≤300 ⇒ 已移出软线登记 ✓） | 清理面外提 + `maybePruneTraces`（10 分钟窗 + 在飞合并）+ `PRUNE_THROTTLE_MS` + `_resetTraceStateForTest` 复位节流窗 + `cleanupTraces` 包装 re-export |
| 5 | `thincoder-cli/bin/thincoder.mjs` | 448（≤500 ✓） | D-TR13 触发闸白名单（`undefined`/`tui`/`chat`/`acp`；全档清理调用恰一处）+ help 行收正（cold/stale + 回收语义） |
| 6 | `thincoder-vscode/src/extension/session-gc-command.mjs`（新） | 70 | `thincoder.sessionGc` 处理体：候选列举 → 计数报告 → 模态确认（`{modal:true}` + "Delete"）→ 逐组 `deleteColdCwd`（快照透传）→ 汇总（区分 not-cold / 文件级跳过）；驳回 / undefined ⇒ 零删除；不消费 `runSessionGc` |
| 7 | `thincoder-vscode/extension.mjs` | 174 | `thincoder.sessionGc` 注册（同址簇 + `logFireAndForget`） |
| 8 | `thincoder-vscode/src/extension/session-gc.mjs` | 21 | 端差注销头注（原「仅 CLI」注销 + 端侧命令面指针 + 坐标改符号名引用） |
| 9 | `thincoder-vscode/package.json` | +4 行 | `contributes.commands` 注册（`ThinCoder: Recycle Cold Session Data`） |
| 10 | `thincoder-core/test/session-gc-stale.test.mjs`（新） | 286 | T-SL1.1/1.2/1.3 + T-SL2.1–2.11（含 T-SL2.6 内 ② 面滞留相位）；夹具全走 temp `dir` / `_setSessionsDirForTest` |
| 11 | `thincoder-cli/test/session-gc-cli.test.mjs`（新） | 133 | T-SL3.5 负例（`--version` 零扫）+ T-SL3.6 正例（无参/`tui`/`acp`/`chat`）+ 触发闸结构机检 + 命令面（dry-run / 单组 / 全量 / 拒行），假 HOME 沙箱 |
| 12 | `thincoder-vscode/test/trace-cleanup.test.mjs`（新） | 101 | T-SL3.1 / 3.2 / 3.4（计数注入证「整删支零逐文件 stat」） |
| 13 | `thincoder-vscode/test/session-gc-command.test.mjs`（新） | 127 | T-VSC-SG1a–d + T-VSC-SG2（删除期变活 + 跳过计数）+ 注册/直调点/清单登记机检 |
| 14 | `thincoder-vscode/test/files.mjs` | +3 行 | 两新档登记（未登记 ⇒ runner fail-closed） |
| 15 | `thincoder-core/test/core-hygiene.test.mjs` | 154 | `traces/trace-store.mjs` 移出 `SOFT_LINE_REGISTRY`（303 → 299）+ 登记面注记 |

**三端测试读数（改动前基线 → 改动后 · 全绿 fail 0）**：核 **462 → 476**（+14）· CLI **765 → 770**（+5）· VSC **866 → 874**（+8）。（批档 §2 原引基线 456/764/865 系设计轮时点读数——本机改动前实测为 462/765/866，以此为准。）另：`node scripts/check-syntax.mjs` 两包 OK（198 / 242 档）；`node scripts/doc-check.mjs --root .` 全局残 2 项（`BATCH-RECORD.md:168` 悬空 · `BATCH-RECORD.md:356` 行宽 589 字符）——均属并线批 `2026-09-21-batch-lifecycle-tool`，**本批触碰档零新增**。

**结构机检（在档）**：① 两档零同步动词（注释剥除后扫描）② 触发闸白名单形态 + 全档 `cleanupTraces` 调用恰一处且门内 ③ VSC 命令注册 + 处理体直调点 + `runSessionGc` 零消费 ④ 两新 VSC 档 `files.mjs` 登记。

**决策透明表**

| 判断点 | 取值 | 理由 / 影响 |
|---|---|---|
| 逐组重校验的目录成本 | 两道优化：`hashes` 前缀预筛（免逐组全目录 `stat`）+ 命令面循环传**一次性目录快照**（免逐组全目录 `readdir`） | 本批一次性存量（≈9.4k 组 / 20k 项）执行从 O(N×M) 降到 O(N + Σ组文件)；① 面 manifest 读与探测束仍**逐组新鲜**（变活组由 ① 拦截）——快照模型与自动面 pass 一致 |
| `purgeTrash` 批名判据 | 收为 **13 位 epoch ms 形态锁**（`/^\d{13}$/`） | 外来纯数字目录不被误删（原「有限正数」判据过宽） |
| 非法日目录（如 `2026-02-31`） | 与「非日期名」同判 ⇒ 落 ③ 逐文件支 | 比设计字面「日期解析 NaN ⇒ 回落 ③」更保守（设计字面下非法日会被 `new Date` 归一而可能走 ① 整删）——安全向；设计档未落该句（已上报设计侧） |
| 单组面 `--confirm <hash>` | 候选面收窄到该 hash（免全量 ② 评估）；`--all`/`--dry-run` = 全量面 | 与设计「单组 / 全量」语义一致；`--confirm --all` 为滞留兜底 |
| `--confirm --all` 的退出码 | 全拒仍返 0（逐组结果在行内明示） | 保持既有命令契约；单组面不中 ⇒ 1（拒行明示零删除） |
| 端侧命令面 `deleteColdCwd` 逐组 | 不消费 `runSessionGc`；显式传端侧 `sessionsDir()`；用例传 temp `dir` | 保核内零消费方结构机检；沙箱缝按 D-SE38 |

**审计与代码评审轮次与终态**

- **内部发散审计**（`subagent` explore · 只读）：VERDICT `findings`（2 🟡 + 4 🔵，0 🔴 / 0 表外静默）——**逐条处置**：🟡#1 逐组 stat 放大 ⇒ 前缀预筛（上表）；🟡#2 §5 未写 ⇒ 本节；🔵#4 `bin` 端差注释陈旧 ⇒ 收正；🔵#6 ② 面滞留无用例 ⇒ T-SL2.6 补相位（断言 `evaluated = 500 / candidates = 0` + 显式全量面可达）；🔵#3（`CORE-UNIFICATION.md:1102` 计数 35→34）/ 🔵#5（非法日口径）⇒ **设计档面，非本代理笔域 ⇒ 上报不改**。
- **内部代码评审**（`advisor` type=code · 同步）：**VERDICT `pass`（0 🔴）**；🟡×2（均可选：命令面逐组 `readdir` 成本 / 冷面中途态 `skipped` 未上报）+ 🔵×3（批名判据 / 端壳头注坐标 / help 与术语漂移）——**处置 5/5**：逐组 `readdir` ⇒ 快照透传；`skipped` ⇒ CLI 行内 + 端侧汇总（not-cold 与 recycle-failed 分述）；批名 ⇒ 13 位锁；端壳坐标 ⇒ 改符号名引用（`scheduleSessionGC`，实读 `:132-138`）；help 行 + 核档 F2 段术语 ⇒「删除 → 回收」收正。
- **fix round**：**2 轮**（审计轮 1 → 评审轮 1），每轮后复跑三端 + 结构机检 + 真数据面核验；终态 = **clean**（无 🔴、无未处置 must-fix；余 2 项设计面 🔵 已上报）。

**表外改动（1 档 · 事先未在受影响文件表 · 已披露）**：`thincoder-cli/test/model-ref.test.mjs`（+18/−0 行）——该档 `loadSession`（`:303`）→ 核 `resumeSlot` → `scheduleSessionGC` 未隔离 sessions 根；本批 F-SL2 自动面在 `node --test` 进程下会扫**真实** `~/.thincoder/sessions`（实测事故：04:25:38 本地一次 pass 移出 500 组 / **1,005 文件** → `~/.thincoder/sessions-trash/1789935938078/`）。处置 = 全档补 `_setSessionsDirForTest` 沙箱缝（`beforeEach`/`afterEach`；断言逐条不变——仅落点隔离）+ 逐档复跑验证零新增回收批。**数据面事实（上报父侧）**：回收批文件**未丢**（同卷 rename，可移回原目录）；其判据与「一次性清理」目标同向——父侧可保留/核销（计作存量清理的一部分）或移回。

**给父侧收口面的提示**：① 真实存量一次性执行 = `thincoder session gc --confirm --all`（幂等；复跑判据 = 候选 0）；自动面已在本次实测中处理 500 组（见上）。② 冷面（cwd 存活）中途态（manifest 已移出、数据文件未移出）残留文件目前两面皆不可见——`skipped` 已在两命令面输出，但该残留形态建议设计侧登记（本轮设计原子性论证只覆盖「无活 cwd」两面）。③ 收口读数（启动到 TTY ≤2s / `--version` ≤0.5s / 同步阻塞 ≤50ms）未在本轮真机复跑——归父侧收口面。

**微修轮（收口前机制微修 · eng-coder · round = fix · 2026-09-21）**

**状态行**：✅ 实施完成 · 定向用例全绿（15/15）· 内部审计 + 代码评审已收敛（VERDICT `pass` · 0 🔴 · 0 must-fix）——待父侧收口（§6）。

**源**：父侧 04:5x 真机复测（验收② 未达：无参启动拒印 2,955 / 4,162ms；pass 竞争下 `resumeSlot` 1,894 / 1,945 / 3,768ms；`session gc --dry-run` 全面 41.6s / 6,887 候选）+ §2「修正轮 3」派单（设计已收正：`docs/core/design/SESSION.md` §6.17 `:395-396` 触发句/判据句 · `:412-417` 预算口径/成本行 · §7 D-SE39/D-SE40）。范围 = §2 修正轮 3「实施面」逐点（4 产品档 + 2 测试档 + 本段）。

**逐项交付（项 → 改变 file:line · 坐标 = 落笔后实读）**

| 项 | 内容 | 落点（实读） |
|---|---|---|
| A 触发延迟化 | `GC_PASS_DELAY_MS` = 3000（新常量）+ 模块级 `gcPassDelayMs` + 测试缝 `_setSessionGcDelayForTest(ms)`；`scheduleSessionGC` 由 `setImmediate` 改 `setTimeout(..., gcPassDelayMs)`；每进程每前缀去重保持 · **不 unref** 保持 | `thincoder-core/session-gc.mjs:130-136`（常量/缝）· `:145-151`（函数——setTimeout 在 `:150`） |
| B 预算口径 | `listStaleCwds` 预算闸位移 =「**过 ③ 进 ① 即耗 1**」（③ 短路 `continue` 零预算；达上限 `break`；`evaluated` = 预算消耗组数——含 ① 面 manifest 读）；② 判决环只判预算内组；`limit` 透传与显式面 `Infinity` 不变 | `thincoder-core/session-stale.mjs:157-164`（预算闸）· `:166-176`（判决环）· `:177`（`evaluated` 返回）· `:236`（`sweepStale` 透传） |
| C 注释同步 · 核 | 头注触发形态行 · `gcPass` doc · `scheduleSessionGC` doc · 头注求值序+预算段 · `listStaleCwds` doc · 内联预算注释 · `sweepStale` doc | `thincoder-core/session-gc.mjs:21-22` · `:119-122` · `:140-144`；`thincoder-core/session-stale.mjs:14-17` · `:141-148` · `:158-160` · `:233-235` |
| C 注释同步 · 调用面 | 「setImmediate 空闲执行」→「启动窗外延迟拍（`GC_PASS_DELAY_MS` = 3s）+ 每进程每前缀去重、**异步非阻塞**」 | `thincoder-core/session-lifecycle.mjs:35-37`；`thincoder-vscode/src/extension/session-io.mjs:85-87` |
| 测试 delta | T-SL1.2 改用（注入 0 延迟 + 延迟拍点火观测）· T-SL1.3 注释收正 · **T-SL1.4 新增**（常量 3000 + 源文本 `setTimeout` 且无 `setImmediate`）· T-SL2.2 `evaluated` 期望 = 2 · T-SL2.6 预算口径改述（pass1 = 500 / pass2 = 101；② 面滞留相位 500/0 不变） | `thincoder-core/test/session-gc-stale.test.mjs:61-77`（T-SL1.2）· `:93`（1.3）· `:97-102`（1.4）· `:131`（2.2）· `:201-221`（2.6） |
| 零改档（在范围） | CLI 测试档未改：触发闸/命令面用例不涉延迟拍（子进程 spawn 无法注入进程内缝；会话 GC 点火面已由核档 T-SL1.2/1.4 覆盖） | `thincoder-cli/test/session-gc-cli.test.mjs`（133 行——读数不变） |

**行数读数（实读口径）**：`thincoder-core/session-gc.mjs` **292**（≤300 ✓——§2 未决 4 的越线风险未触发）· `thincoder-core/session-stale.mjs` **247** · `thincoder-core/session-lifecycle.mjs` **318**（>300——**已在册** `SOFT_LINE_REGISTRY`，非本轮新增、本轮零行为改动）· `thincoder-vscode/src/extension/session-io.mjs` **225** · 测试档 **297**（≤300 ✓）。

**定向验证**：`node --test --test-reporter=tap test/session-gc-stale.test.mjs` = **15/15 pass · fail 0**（多次复跑一致）；`node --check` 全档 Syntax OK；`node scripts/check-syntax.mjs` = CLI 198 档 OK / VSC 242 档 OK。

**三端读数（本席实跑）**：核 **477** / CLI **770** / VSC **874**——均 fail 0（≥ 基线 476 / 770 / 874）。**过程事实（上报父侧）**：核 / CLI 两侧其后复跑出现红，**非本席改动所致**——并线批 `2026-09-21-batch-lifecycle-tool` 的两个未跟踪在飞档所致：`thincoder-core/agent-tools/batch-lifecycle.mjs:21` import `SEGMENT_BY_ROLE` 与该档 `batch-skeleton.mjs` 导出现状错配 ⇒ 核 `core-modules` 导入冒烟红（477/476/1）；同档 `:45` 含 `§4.1` ⇒ CLI `prompt-refs-zero` T9 红（770/769/1）。本席零触那两档，已两条 note 上报父侧。

**决策透明表**

| 判断点 | 取值 | 理由 |
|---|---|---|
| 注释行数守恒 | 两处 `resumeSlot` 包装注释压回原行数（3 行） | 设计档 §6.17 `:386`/`:387` 以 `session-lifecycle.mjs:38`（resumeSlot）/:39（scheduleSessionGC）与 vsc `session-io.mjs:89` 为坐标——扩 1 行即漂移 ⇒ 压行使坐标续真（不动设计档） |
| T-SL1.3 延迟取值 | 保持默认 3s（不注入） | 该用例只验「目录缺失 ⇒ 静默降级 + 正常返回」；延迟拍在调度时已捕获沙箱路径（3s 后打到 absent 目录，无害），断言零依赖其触发时点 |
| 测试档行数 | 上界 297（≤300） | 新增面（T-SL1.4 + T-SL1.2 观测）经压缩才不触发软线登记；再扩面须另案登记/拆档 |
| CLI 测试档 | 零改 | 见「零改档」行（用例不涉延迟拍） |
| 回收/清运路径 | 本轮零改（B 只动预算闸位） | 禁扩面（快照逐条目 stat / 显式面耗时优化 = 另案） |

**内部发散审计（`subagent` explore · 只读）**：VERDICT `findings`（🔵×3 + 1 项待落；0 🔴 / 0 🟡；无静默简化 / 无表外改动 / 无禁止面触达）——逐条处置：① §5 未写 ⇒ 本段已落；② 设计档 `SESSION.md:386` 坐标因注释扩行漂移 ⇒ **压回原行数**消解（上表决策 1）；③ 测试档头注漏收 T-SL2.11 ⇒ 收正「T-SL2.1–2.11」；④ `session-gc.mjs` 头注「每进程一次」措辞不齐 ⇒ 收正「每进程每前缀一次」。

**内部代码评审（`advisor` type=code · 同步）**：**VERDICT `pass`（0 🔴 · 0 must-fix 🟡）**；🔵×2 + 🟡×1（登记债）——处置：🔵1 测试档 `:201`/`:215`/`:221` 旧口径字面（「② 评估 / ② 预算」）⇒ **已改「过 ③ 进 ①」口径**（复跑 15/15 绿）；🔵2 T-SL1.2 墙钟判据易碎面（`elapsed < 1000` + 固定轮询上限）⇒ **保留并写明理由**（设计 `:393` 钉死 ≤1s 代理值不可放宽；轮询上限已是实测耗时 ≈10×；补 `_staleHooks` 级完成信号会越测试档 300 行软线且扩缝面——登记接受）；🟡3 `session-lifecycle.mjs` 318 行 >300 ⇒ 登记债（`thincoder-core/test/core-hygiene.test.mjs:58` 在册）· 不动作。

**fix round**：**2 轮**（审计轮 1 → 评审轮 1），每轮后复跑定向用例 + 行数/语法读数；终态 = **clean**（无 🔴、无未处置 must-fix；保留项 1 条 = 🔵2 已知易碎面，理由在上）。

**面外披露**：本轮改动面 = §2 修正轮 3 实施面逐点（7 档含本段），**无表外改动**。两条观测（非本席笔域）上报：① 设计档 `SESSION.md:386` 对本席改动前坐标经压行后续真（无需改档）；② 并线批在飞档破核 / CLI 两套（见「三端读数」段）。

**未做 / 偏差清单**：① 设计档 / 需求档零写（按派单禁）——压行方案即为此；② `thincoder-vscode/src/extension/session-gc.mjs:8` 头注坐标（`:132-138`）随核行数位移未改（非本轮清单档；该注自述「随核行数位移」）；③ `thincoder-cli/test/model-ref.test.mjs:20` 旧术语「空闲拍」未改（非清单档）；④ 快照逐条目 stat / `session gc` 显式面耗时优化 / 全量重勘 = 本轮禁项（未做）；⑤ 收口读数（启动到 TTY 门 ≤2s × 复测 ≥2 次 / `--version` ≤0.5s）归父侧收口面——本席只落机制 + 定向用例。

**微修轮 2（收口前机制微修 2 · traces 启动清理延迟化 · eng-coder · round = fix · 2026-09-21）**

**状态行**：✅ 实施完成 · 定向用例全绿 · 内部审计 + 代码评审已收敛（VERDICT `pass` · 0 🔴 · 0 must-fix）——待父侧收口（§6）。

**源**：父侧派单（设计已由 eng-designer #10 落定 = `docs/core/design/TRACES.md` §6.4 `:91` / `:94-99` + §7 `:115`；§2 修正轮 4 `:244-263` 实施面逐点）。范围 = 4 档 + 本段。

**逐项交付（项 → 改变 file:line · 坐标 = 落笔后实读 · 行数 = `wc -l` 口径）**

| 项 | 内容 | 落点（实读） |
|---|---|---|
| A 延迟拍（核） | 头注收正（启动面 = 延迟拍句 + 缝句）；`TRACE_CLEANUP_DELAY_MS` = 3000（新常量）+ 模块延迟值 + 测试缝 `_setTraceCleanupDelayForTest(ms)`；`scheduleTraceCleanup({ dir, retentionHours = 24 })` —— `setTimeout` 延迟点火（自调度点起 3s）；`.catch(() => {})` 移入调度器（失败静默——fire-and-forget 语义不变）；**不 unref**（保后台排空——同 D-SE39）；无去重闸（白名单 / 闸位 / 每进程一次语义住调用面）；**零新增环境缝** | `thincoder-core/traces/trace-cleanup.mjs:19-23`（头注）· `:94`（常量）· `:95`（模块值）· `:99`（缝）· `:107-109`（调度器——`setTimeout` 在 `:108`）；档行数 **109**（≤300 ✓） |
| B 调用面（CLI） | import 面：`cleanupTraces` → `tracesRoot`（trace-store）+ `scheduleTraceCleanup` 直引 trace-cleanup（不再引 `cleanupTraces`——全档零处）；闸块内改调调度器（`dir` / `retentionHours` 调度点捕获）；注释收正为延迟拍形态 | `thincoder-cli/bin/thincoder.mjs:20-21`（import 面）· `:138-143`（注释）· `:144-149`（闸块——调用在 `:147`）；档行数 **448**（与 §5 原读数 / 设计面读数同——行数守恒，见决策表） |
| C1 测试面（核侧缝 + 结构） | T-SL3.7 缝用例（常量 3000 断言 + 缝注入短值 150ms ⇒ 先于拍零动作 / 到拍清理执行 + 失败静默面）· T-SL3.7 结构机检（注释剥除后 `setTimeout` + 常量 + 缝在档 + 无 `.unref(`）· T-SL3.2 断言收正（根面计数 `rootScans === 1`——原「恰一次」消息与 `>= 1` 断言不符） | `thincoder-vscode/test/trace-cleanup.test.mjs:91`（T-SL3.2 收正）· `:105-122`（T-SL3.7 缝用例——`:106` 常量 / `:110` 缝 / `:114` 先于拍 / `:116` 到拍 / `:117-120` 失败静默 / `:121` 缝还原）· `:124-131`（T-SL3.7 结构机检）；档行数 **131** |
| C2 测试面（CLI 观测面） | T-SL3.6 观测面收正：`[]` / `tui` / `chat` 早退面 ⇒ 结构断言（门内 `scheduleTraceCleanup` 恰一处 + 零直呼 `cleanupTraces`，注释剥除后计数）；`acp` 长驻路径行为见证（≥ `TRACE_CLEANUP_DELAY_MS` 下界断言）；沙箱 env 钉 `THINCODER_TRACES_DIR`（装置与清理目标恒一致） | `thincoder-cli/test/session-gc-cli.test.mjs:29`（沙箱）· `:76-80`（收正注）· `:81-94`（acp 见证——下界断言 `:91`）· `:95-103`（结构机检——计数面 `:100`）；档行数 **137** |
| D 面外披露 | 无表外改动（4 档 + 本段）。**行数守恒**：import 面 +1 行 ↔ U2 注释（`:36-37`）3→2 行纯折行（零词改）⇒ 全档 448 行不变，设计档坐标 `:40` / `:144` / `:144-149` / `:312-313` 续真（随报） | `thincoder-cli/bin/thincoder.mjs:36-37` |

**用例数 delta（CLI 档 5 → 4）**：`[]` / `tui` / `chat` 三早退子用例的行为断言（延迟拍不点火 ⇒ 不可观测）合并为 1 条结构机检 + 1 条 `acp` 长驻见证——收正直接导出（设计未决②）；白名单四形态（含 `undefined`）由门正则逐字覆盖。

**三端读数（本席实跑 · as-of 2026-09-21 06:1x）**：

- 核 `node test/run.mjs` = **477 / 476 pass / 1 红**——红 = `agent-tools/batch.mjs: 397`（>300 未登记）＝ 并线批 `2026-09-21-batch-lifecycle-tool` 未跟踪在飞档，**非本批**；
- CLI = **769 / 765 pass / 4 红**——T47 / T47b / T51 = `thincoder-cli/test/batch-segment.test.mjs`（并线批自身在飞用例）+ T9 = `thincoder-core/agent-tools/batch-lifecycle.mjs:45 §4.1`（`prompt-refs-zero` 实档锁）——均并线批，**非本批**；
- VSC = **876 / 871 pass / 5 红**——W9 ①（核工具登记册 `batchTool` / `batchSegmentTool` 名集不符）/ T60 / T57×2 / T5 = `batch-segment` / `eng-designer-role` / `agent-tools-registry` / `host-shape-spawn`（并线批在飞改名所致）；**本批面全绿**（本席四档用例全通过；同批早前一次运行（改名落地前）读数 = 876 / 876 / 0）。
- 旁证：`node scripts/check-syntax.mjs` = CLI 198 档 OK / VSC 242 档 OK。

**决策透明表**

| 判断点 | 取值 | 理由 |
|---|---|---|
| 行数守恒（保设计坐标） | import 面 +1 行 ⇒ U2 注释 3→2 行纯折行抵消 | 设计档 `:40` / `:144` / `:144-149` / `:312-313` 为实读坐标（本轮禁改设计档）——净零续真（同前轮「注释行数守恒」先例） |
| 缝注入取值 | 短值 150ms（非 0） | 同时见证「先于拍零动作」（40ms 探针）+「到拍执行」；0 值下延迟形态不可辨 |
| T-SL3.6 早退面 | 结构断言（不行为） | 非 TTY / 无键早退（`exitSoon` = 显式 `process.exit`）< 3s ⇒ 延迟拍不点火、行为不可观测（未决②已钉）；子进程面缝不可注入、**不新增环境缝** |
| 沙箱 env 钉 `THINCODER_TRACES_DIR` | 显式同址（假 HOME `traces/`） | `tracesRoot()` 以该 env 为第一优先 ⇒ 免外层环境变量串扰（评审 🔵3）；「禁触真实 `~/.thincoder`」纪律加固 |
| 结构机检计数面 | 注释剥除后计数 | 免注释文本假命中（评审 🔵4）；与 VSC 结构机检同口径 |
| 行数口径 | `wc -l`（448 / 109 / 131 / 137） | read 工具计 449（含末空行）——批档既有口径 = `wc -l`，与设计面读数同源 |

**内部发散审计（`subagent` explore · 只读）**：VERDICT `findings`（0 🔴 / 1 🟡 / 3 🔵；0 部分实现 / 0 静默简化 / 0 表外改动）——逐条处置：🟡 F1 = `TRACES.md:95` / `:98` 遗留「拟新增」标记（设计面笔域——**上报不改**）；🔵 F2 = 批档 `:71` 陈旧指针（写 `:139`，实为 `:144`；§2 作者笔域——**上报不改**）；🔵 F3 = `thincoder-vscode/test/files.mjs:122` 注记未含 T-SL3.7（表外档——**不改**，上报）；🔵 F4 = acp 见证缺下界断言 ⇒ **已补**（`:91`）；🔵 F5 = 失败静默子面无断言 ⇒ **已收正**（`:117-120`）。

**内部代码评审（`advisor` type=code · 同步）**：**VERDICT `pass`**（0 🔴 · 2 🟡 均非 must-fix · 3 🔵）——处置：🟡1（`bin` 449 / `wc -l` 448 行 >300 软线）= 既有在册债（≤500 内）、不动作；🟡2（不 unref + `chat` 白名单 ⇒ 一次性会话自然排空被推后 ≤3s；`TRACES.md:96` 未登记该后果）= **代码取支已由设计钉死 ⇒ 不改码**，登记为对父侧 / 设计面的报告项（见未决）；🔵3（沙箱未钉 `THINCODER_TRACES_DIR`）⇒ **已修**（`:29`）；🔵4（结构机检注释敏感）⇒ **已修**（`:100`）；🔵5（`scans >= 1` 与消息「恰一次」不符）⇒ **已修**（`:84` / `:91`）。

**fix round**：**2 轮**（审计轮 1 → 评审轮 1），修正项共 5 处（审计 🔵 F4 / F5 + 评审 🔵3 / 🔵4 / 🔵5），每轮后复跑定向用例（VSC 5/5 · CLI 4/4 全绿）；终态 = **clean**（0 🔴 · 0 must-fix；余 3 项 = 报告 / 登记面 + 1 项设计面后果登记建议）。

**面外披露**：无表外改动；1 项行数守恒折行（`bin:36-37`，随报）；并线批在飞红如实排除（读数段）。

**未做 / 偏差清单**：① 设计档 / 需求档零写（按派单禁）——`TRACES.md:95` / `:98` 残留「拟新增」标记 = 设计面笔域（上报不改）；② 3s 默认值 / 白名单语义 / 白名单外命令面零动；③ 不加环境缝（面外，未获批）；④ 快照 stat 面 / 显式面耗时优化 = 另案（未做）；⑤ 真实数据面 `~/.thincoder` 零触（夹具全 temp / 沙箱假 HOME + `THINCODER_TRACES_DIR`）；⑥ 收口读数（启动到 TTY 门 ≤2s × 复测 ≥2 次 / `--version` ≤0.5s）归父侧收口面。

**未决 / 观察（报父侧）**：① **一次性会话自然排空被延迟拍推后**：`chat`（白名单内）成功路径无显式 `process.exit` ⇒ 非 unref 的 3s 拍保持事件循环存活，会话 <3s 完成时进程延后 ≤3s（+清理排空）退出；`TRACES.md:96` 只登记「显式 `process.exit` 早退 ⇒ 本次不执行」——建议设计面补登记该后果（或明写继承 D-SE39 / D-TR13「不 unref 保后台排空」取舍）；GC 侧同一后果已在 §2 修正轮 3 未决② 登记为「设计内」。② `docs/core/design/SESSION.md:98`（314 字符）——本批设计档工作树改动（线号锚改符号锚）新越行宽 300，`doc-check` 全局 FAIL(行宽) 2 项之一（另一项 = 并线批 `BATCH-RECORD.md:356`）；**非本席笔域（设计档禁改）**，请设计面折行。③ 两处延迟拍同值 3000（GC / traces）落于同拍——§2 修正轮 3 未决① 已登记（错峰另案）。

**读数收正（本节 · 落笔后复读发现 · 当场随报）**：上表 C2 行「`:76-80`（收正注）· `:81-94`（acp 见证）」坐标差 1 —— 实读 = 收正注 `:77-81` · acp 见证 `:82-93`（下界断言 `:91` 续真）；同档其余坐标（沙箱 `:29` · 结构机检 `:95-103` · 计数面 `:100`）与其余三档全部坐标复读相符。

## §6 验证与收口（父代理）

**状态行**：✅ 已收口 2026-09-21（父侧）

**验收读数（父侧独立复跑 · 2026-09-21 04:5x–06:1x）**

| # | 判据（设计钉定） | 读数 | 结果 |
|---|---|---|---|
| ① | 同步阻塞样本 ≤50ms（机检三档） | 结构扫描（两档零同步动词）✓ · 行为代理（T-SL1.2）✓ · 收口真机 = `--trace-sync-io` 启动路径 **0 告警** | ✓ |
| ② | 启动到 TTY 门 ≤2s（复测 ≥2） | 无参启动至拒印 ×6 = **1.17 / 1.21 / 1.23 / 1.26 / 1.27 / 1.34 s**（中位 1.26s · 对照 9.6–16s = **8–12×**） | ✓ |
| ③ | 三端测试全绿 | 核 **494/0** ✓（全绿）；CLI 765/4 · VSC 871/5——9 红**全数**指向并线批 `2026-09-21-batch-lifecycle-tool` 在飞面（`batch-segment` / `batchTool`——逐名在册）；**本批专项复跑全绿**（核 15/15 · VSC 10/10 · CLI 4/4） | ✓（本批面） |
| ④ | 存量回落 + 零误删 | `session gc --dry-run` = **6,887 组**候选（对照设计估 ≈7,384 ✓ 同量级）；执行 = 本节后父侧 `--confirm --all`（回退面 = 回收批 7 天 ✓） | ✓ |
| ⑤ | VSC 命令入口 + 端差注销在档 | 需求 §4.5④ 注销行 ✓ · 设计 §6.12 / §6.17 / D-SE38 ✓ · 端壳头注 ✓ · 命令注册 + 直调点结构机检 ✓ | ✓ |
| ⑥ | `--version` 总时 ≤0.5s | **0.27 / 0.27 / 0.29 / 0.39 s**（对照 12.9s = **44×**） | ✓ |
| ⑦ | doc-check 本批触碰档零新增 | 锚 **0 悬空**（闸态 OK）；行宽残 1 = 并线批 `docs/core/design/BATCH-RECORD.md:356`（非本批） | ✓（本批面） |
| ⑧ | 热路径 `resumeSlot` | 安静 **126ms**（对照 ~10s = **79×**；修复前争用态 1.9–3.8s 已由延迟拍消解） | ✓ |

**链上轮次**：设计 6（#1 初稿 · #3 修正轮 1 · #5 修正轮 2 · #7 文档残留 · #8 GC 延迟拍/预算 · #10 traces 延迟拍）× 实施 3（#6 15 档 · #9 · #11）× 评审 2（轮 1 changes-required 1🔴/8🟡/5🔵 → 13/13 修正 · 轮 2 pass）✓。

**父侧机械直改（打标 · 可 revert）**：§2 坐标/触发句收正 4 处（`:57` / `:71` / `:73` / `:184`）· 去「（拟新增）」标记 5 处（SESSION `:216`/`:392`/`:427` · TRACES `:95`/`:98`）· `SESSION.md:98` 消费面符号锚化 · 需求 §4.5④ 端差注销行 · TRACES §6.4 排空注一行。

**披露与另案**：数据面事件（04:25:38 测试期自动面搬 500 组 / 1,005 文件 → 回收批 `1789935938078`——按用户存量清理授权**保留核销**，计入 ④）· 表外档 1（`model-ref.test.mjs` +18 沙箱缝）· 并线批安全事件（他批 tamper 面——本批交叉证据在册，非本批笔域）· 另案入册 3 条（**#178** 显式面耗时 · **#179** 快照 stat 面/错峰 · **#180** 术语坐标卫生）。

**结算同步（D7）**：① 角色表 = 本档 §1/§2/§3/§4 各段标注 ✓；② 状态行 = §1 `:8` 已改「已收口」+ 本节 ✓；③ 计数 = 用例表 30 项 / 受影响文件表 15 档 / §7 决策 D-SE34–D-SE40 ✓；④ 指针 = 落点坐标 as-of 实读（`:187`）✓；⑤ 变更记录 = 需求 3 档 + 设计 4 档各一行 ✓；⑥ 待办 = #178/#179/#180 入册 ✓；⑦ 台账 = **#173 在途 → 待核销 → 已核销**（两段已走 · 证据 = 本档 §5/§6）✓；⑧ 前批遗留交叉 = 无本批关联遗留 ✓。

**提交**：见下方 errata（本档收口提交）。
