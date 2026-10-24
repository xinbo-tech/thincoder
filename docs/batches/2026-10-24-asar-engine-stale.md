# 2026-10-24 · 桌面 asar 打包下 doc_check 恒判引擎陈旧：归档内文件不比 mtime
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 17:14 转网友报告：ThinCoder Desktop 0.10.10（Windows，C:\Program Files\ThinCoder），`doc_check(mode:"gate")` 恒返回 ERROR「引擎已更新（… mtime > 进程启动）」，批档收口被永久挡住。
> 台账 = #1746（DOC-CHECK · 归批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-24
> 不适用：§2 —— 单行判据修正（归档内档不比 mtime），无新机制 / 无接口变更，设计形态即 §1 的「处置」段，不另起设计；
> 不适用：§3 —— 依同一理由免独立设计评审；修复面 = 判据内部条件，可由单元读数与实装对照直接判定（读数见 §6）。

**讨论（主 agent）**

**现象（用户转网友报告 · 桌面 0.10.10）**：`doc_check(mode:"gate")` 恒返回 `DOC-CHECK GATE: ERROR（引擎已更新（… mtime > 进程启动 …））`，批档永远收不了口。

**根因（读码 + 报告归因一致）**：`thincoder-core/doc-check/version.mjs:39-49` 的 `staleEngineFiles` 逐档取 `mtimeMs`，与**进程启动时刻**（`Date.now() − uptime×1000`）比较：`mtimeMs > startMs` ⇒ 判 stale。

桌面端 `asar: true`（`thincoder-desktop/electron-builder.yml:20`），`node_modules/@thincoder/core/doc-check/**` 打进 `resources/app.asar`。**Electron 对 asar 内条目返回的 `mtime` = 归档挂载时刻**（进程启动后 4–6 ms）⇒ 恒成立 ⇒ 闸永不放行。

**判据错在哪（不是打包错）**：这条检查要防的是「引擎档在模块加载后被改写」。**asar 归档在进程生命周期内不可改**——归档内的档不可能在后被改写，mtime 只是挂载元数据，不携带「是否更新过」的信息。拿一个不携带该信息的读数做判据，结论只能是噪声。

**处置（轻通道 · 缺陷修 · 父侧直笔）**：`staleEngineFiles` 对**位于归档内**（路径含 `.asar` 段）的档跳过 mtime 比较；不可读仍 fail-closed。判据从「所有档按 mtime 判」变成「归档外的档按 mtime 判，归档内的档按归档不可变性判」。

**为什么不改打包**：`asarUnpack` 也能让 mtime 变真，但它把「判据正确性」押在打包配置上——任何一个端换打包方式就复发。判据本身对归档内文件本就不该成立，修在判据上是根上修。

**影响面**：`agent-tools/doc-check.mjs`（gate 分支）∥ `agent-tools/batch-gate.mjs`（两机械点）共用本函数 ⇒ 两处同愈；CLI / VSC 不受影响（非归档路径，行为逐字不变）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）

**批准（主 agent 代记）**

用户 2026-10-24 17:14 转报缺陷并要求查；17:16「接着查」；17:19「这个先不管了。可能是客户自己尝试打包的」——**后者只撤回「自更新失败留下的半装态」那一段调查**（非本仓产物责任），不撤回本批修复。

**口径**：doc_check 在 asar 内恒判陈旧的判据缺陷由本批修；自更新失败现场的归因（客户自行打包 / 杀软 / 提权）不在本仓范围内，作废。

**母题外的一条更正（记档）**：本席一度据 `win-sign.mjs` 的证书探测（返回 `MISSING`）断言「发布版未签名」——**错误**。该探测查的是本机证书库，EV 证书在 eToken USB 里，发布时才插。实测产物 `Get-AuthenticodeSignature dist\ThinCoder-Setup-0.10.10.exe` ⇒ `Status: Valid`（GlobalSign EV + 时间戳），`ThinCoder.exe` 同。判签名必须验产物，不能验本机证书库。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

**核销同步（主 agent）**

**落地面**：`thincoder-core/doc-check/version.mjs`
- 新增 `isInsideArchive(path)`（`:30`）——路径含 `.asar` 段即归档内。
- `staleEngineFiles` 判据循环（`:59`）：归档内的档 `continue` 跳过 mtime 比较；不可读仍 fail-closed。
- 两条消费面（`agent-tools/doc-check.mjs` gate 分支 ∥ `agent-tools/batch-gate.mjs` 两机械点）共用本函数 ⇒ 两处同愈；CLI / VSC 非归档路径，行为逐字不变。

**读数**：
- `isInsideArchive` 四例：Windows 反斜杠 ∥ 正斜杠（`C:\Program Files\ThinCoder\resources\app.asar\…`）⇒ true；两条非归档路径 ⇒ false。
- fail-closed 未削弱：注入「晚于启动 5 ms」的 stat（非归档路径）⇒ 判 stale 6/6。
- 本机实跑 `staleEngineFiles()` ⇒ stale 0。
- core 35/0 · vsc 27/0 · `doc_check` gate PASS。

**收口测试行**：本批验证 = 上述四组读数 + 两包单测 ∥ 命令 = `node test/run.mjs`；**集成场景无变化**（判据内部修正，未触及业务行为）。集成集现量 **0 / 50–100**。

**未做（如实）**：未改打包（不加 `asarUnpack`）——理由见 §1：判据正确性不该押在打包配置上。桌面端要等下一个版本才带此修复；现版可用 CLI 跑 gate 绕过。

**doc-check 门**：`DOC-CHECK GATE: PASS`。

**台账**：#1746 同轮核销。
