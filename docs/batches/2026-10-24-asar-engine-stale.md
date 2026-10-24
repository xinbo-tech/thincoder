# 2026-10-24 · 桌面 asar 打包下 doc_check 恒判引擎陈旧：归档内文件不比 mtime
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = 用户 2026-10-24 17:14 转网友报告：ThinCoder Desktop 0.10.10（Windows，C:\Program Files\ThinCoder），`doc_check(mode:"gate")` 恒返回 ERROR「引擎已更新（… mtime > 进程启动）」，批档收口被永久挡住。
> 台账 = #1746（DOC-CHECK · 归批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

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
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
