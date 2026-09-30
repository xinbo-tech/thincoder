# 2026-09-30 · 核心工具族两修（CLI 贴图生命周期 ∥ batch CRLF 容错）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 用户 2026-09-30 17:48「我同事报告错误，batch工具在特定仓库不可用」+ 17:59「为什么删掉原图」两案并批（父侧复现 + 裁定 A · 用户 18:02「A」）：① batch 工具 CRLF 盲区（台账 #732）② CLI 贴图「读后即删」（台账 #733）——修复判据 = **忠实执行已文档化机制**（非另发明）。
> 台账 = #732 ∥ #733（核心工具 · 归批）。前情 = 无（独立批——两案均 2026-09-30 当日实报）。
## §1 讨论（主 agent）
**状态行**：进行中（来源/裁定入档 ✓（用户 18:02 裁 A）· §2 在册 · 评审在跑（advisor id=9））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 两案并批（父侧 · 2026-09-30 18:0x）

**授权**：用户 18:02「A，明明有说的清清楚楚的机制，为甚恶魔不执行！」——① 选项 A 裁定（贴图修 = 落盘并入 `.thincoder/tmp` 族 + 撤读后删）；② 总判据 = **忠实执行已文档化机制**（禁另发明新机制）；③ 点火（承本会话 00:14 全链授权「排空」模式）。

**案① batch 工具 CRLF 盲区（#732 · 同事报）**：现象 =「batch 工具在特定仓库不可用」。父侧真模块复现：CRLF 行尾批次档 ⇒ `readBatchStatusLine` = `unknown`（LF = `open`）；根因 = `thincoder-core/agent-tools/batch-skeleton.mjs:48` `STATUS_LINE_RE`（`(.*)$`——`.` 不吞 `\r`、`$` 无 m 旗）⇒ 全链被拒（append ∥ status ∥ close fail-closed ∥ 在飞扫描失明）；「特定仓库」= CRLF 行尾仓（git autocrlf ∥ `.gitattributes` ∥ 编辑器）。同族先例 = VSC 编辑工具 CRLF 坐标事故（「`$` 锚在 CRLF 失配」）。

**案② CLI 贴图「读后即删」（#733 · 用户 17:59 实报）**：现象 = 贴图被 `read_image` 读掉即删（用户两张图均为父侧 read_image 所删——实伤：二次读 ∕ 裁切失据 ∥ 会话记录留死路径）。代码 = `thincoder-core/tools/file.mjs:181-185`（`unlink`，注释 "delete after use, no litter"）+ `thincoder-cli/src/tui/clipboard.mjs:135-178`（落 `<cwd>/.thincoder-paste-<ts>.png`）；由头 = `docs/TODO-archive.md:136` P19（「污染用户仓库根」）。**而文档化机制早就在**：`thincoder-core/attachments.mjs`（头注 `:16` ∥ `:20`）= 落 `<cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>` + 清理 = 逐回合 `cleanupTurn` + mtime 扫除兜底（3 天窗 = `agent/helpers.mjs:80` `TMP_RETENTION_MS` ∥ `cleanupOldToolResults` `:134-149`）；消费面 = 桌面 ∥ VSC——**唯 CLI 贴图未接正路**（用户指斥 = 此）。

**判据**：两修均按既有文档化机制执行；设计轮届盘实读定形（落点表 + 验收腿）。

**父侧补注（2026-09-30 18:1x）**：§1.1 三处前提经设计轮实读修正（以 §2.4 ∕ D-4 ∕ F-2 为准）——①「close 全拒」实为 **close 未拒**（门短跳）+ 重关不拦；②「写面零改候选」仅纯态成立——**混合行尾档写面会插重复状态行**（扩入写面小修）；③「消费面 = 桌面 ∥ VSC；唯 CLI 未接」——**VSC 清理面亦未接**（F-1，另立台账）。

**来源**：① 同事报（经用户 2026-09-30 17:48）「batch 工具在特定仓库不可用」⇒ #732（CRLF 盲区——`thincoder-core/agent-tools/batch-skeleton.mjs:48` `STATUS_LINE_RE` 无 `\r` 容错；父侧复现：CRLF 档状态行解析 = `unknown`；受损链 = append ∥ status ∥ close ∥ 在飞扫描全拒）；② 用户 17:59 追问「为什么要删掉原图」⇒ #733（CLI 贴图「读后即删」——`thincoder-core/tools/file.mjs:181-185` 读即 `unlink`；落盘源 = `thincoder-cli/src/tui/clipboard.mjs:135-178`）。**用户 18:02 裁定「A」**（原话：「A，明明有说的清清楚楚的机制，为甚恶魔不执行！」——修 = 落盘并入 `.thincoder/tmp` 族 + 撤读后删；总判据 = **忠实执行已文档化机制**）。

**授权**：本会话 00:14「排空」全链授权 + 2026-09-30 18:28「自动跑完」（射程 = 本批全链：评审点火 ∥ 代签 ∥ 修正/实施派发 ∥ 收口核销提交推送）。

**范围**：案① #732（解析层 CRLF 容错 + 写面收正 + 批内件 L1–L4）∥ 案② #733（贴图落盘改 `.thincoder/tmp/paste-<id>-0.png` + 写前 3 天窗扫除 + 撤读后删 + 文档随动 + 批内件 L1–L6）。设计块 = §2（含复现基线 §2.4 ∥ 文档随动 §2.5 ∥ 上抛 §2.7）。

**下一手**：设计评审在跑（advisor id=9）→ 修正（如需）→ 代签 → 实施舱。

### 1.3 并行事实与停手线（CLI 会话落笔 · 2026-09-30 18:3x）

**并行事实**：本批在**两个会话**同时推进——CLI 会话：设计评审已 pass（0🔴）· 收正轮已落 · token 已签发（在手）；桌面会话（见本节上文授权块）：**设计评审 id=9 在跑** · 计划「修正 → 代签 → 实施舱」。

**停手线（执行归属待用户裁定）**：裁定前**两链均不得代签 ∥ 派实施**；CLI 会话已停手待裁。桌面侧见字请按既有停点规则（「需用户口径 ⇒ 停」）暂停本批推进，待用户口径。

**由头** = 双 §4 代签 ∥ 双实施舱（同文件域，调度器将串行 ⇒ 第二舱为纯重复劳动）∥ 双 token 并存——非内容分歧，纯调度归属问题。

### 1.4 执行归属裁定（用户 2026-09-30 19:04「b」）与并行链接收

**裁定**：本批执行归属 = **CLI 会话**（用户答「b」）。**停手线（§1.3）撤除**。

**并行链产物处置**：桌面链于 18:35–19:04 间继续落下的产物——**§3 轮次 2（评审 · pass：🔴0 ∥ 🟡1 ∥ 🔵4）∥ §2 收正轮 2（轮次 2 #5 + 父裁追补 #6）**——**照单接收**（并入本批设计面，机制零抵）；桌面其余在飞批次（#713 ∥ #721 ∥ #726 ∥ #734 ∥ #735 ∥ #738 等）与本批无关。

**执行自本笔起 = CLI 会话**：§4 代签 + 实施舱派发（本笔后即办）；本批已由 CLI 会话接手，桌面侧无需再动。

### 1.5 复裁（用户 2026-09-30 19:1x）——§1.4 以本节为准

**用户复裁原话**：「那边还是让他自动巡航吧，你这边避让一下。」

**落**：① **桌面链保持自动巡航**——本批（含实施）随其链，不受打断；② **CLI 会话避让退场**——实施舱已取消（零改动 ∥ 目标文件零触）∥ §4 代签随撤（见 §4 续笔）∥ 文件零写。§1.3 停手线 ∥ §1.4「CLI 接手」句均以本节为准。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（首设轮 + 收正轮 1/2/3 落毕 · 评审轮 1 #1–#12 ∥ 评审轮 2 #1–#5 ∥ 评审轮 3 #1–#3 全收（父裁 = 全采纳）· 2026-09-30）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 ∥ 不覆盖）

**覆盖（两案全量）**：

- **#732（案①）batch 工具 CRLF 盲区**——CRLF 行尾批次档的状态行被解析为 `unknown` ⇒ 冻结门误拒（append ∥ status）+ 在飞扫描失明 + 冻结真值虚化（close 短跳）。修 = 解析 ∥ 改写面按「EOL 形态无关」收正——本修 = §4.9 机制意图的落地（行尾句随 2.5① 补入；零另发明）。
- **#733（案②）CLI 贴图「读后即删」**——落盘并入核 `attachments.mjs` 正路（`<cwd>/.thincoder/tmp/paste-<id>-<i>.<ext>`）+ 撤 `read_image` 读后删 + CLI 写时 3 天窗扫除接线。
- 判据（§1 授权）：**忠实执行已文档化机制**；规格源 = 盘上文档（`attachments.mjs` 头注 ∥ `BATCH-RECORD.md` §4.9/§4.12）。

**不在本批**（发现见 2.7）：VSC 贴图件扫除接线（F-1）∥ API-CONTRACT 坐标顺移（机检轮）∥ 旧根族存量清扫（不追）。

### 2.2 案① 设计——batch 工具 CRLF 容错（#732）

**机制设计（三件）**：

1. **解析层**（`batch-skeleton.mjs`）：`readBatchStatusLine:120` ∥ `sectionHasStatusLine:143` 行切分 `split("\n")` → `split(/\r?\n/)`——`\r` 归行分隔、不归行内容；`STATUS_LINE_RE:48` 字面零改（行形单源不动——EOL 面归切分）。
2. **写面**（`batch-lifecycle.mjs` `updateSectionStatusLine:157-173`）：替换支改**逐行扫描 + 命中行原位替换**（行尾随各行自身、其余字节零变）；缺行插入支改**偏移插入**（标题行后；**插入块行尾 = 标题行自身行尾**——锚行后首二字节判读：`\r\n` ⇒ CRLF ∥ 其余 ⇒ `\n`；纯态与旧形逐字节等值——实读校验）。
   取法之由 = 与替换支「行尾随各行自身」同一局部性原则（零全档汇总 ∥ 混合档接缝零造混）；据 = 混合档实证：旧形对混合档 `findIndex` 失配 ⇒ 误走插入支 ⇒ §1 现重复状态行（2.4 读数）。
3. **同族扫查（读数）**：batch 族 `$`-锚行正则仅 `STATUS_LINE_RE:48` 一处病面；
   `sectionHeaderRe`（`(?=\s|$)`+m）∥ `/^## §\d/gm`（无 `$`）∥ `ROUND_HEADING_RE`（`batch.mjs:45`——无 `$`）——CRLF 实读全兼容，零改；
   `BATCH-RECORD.md:345`（§5.1 L8 暂缓扫描 `/^\*\*状态行\*\*：.*$/m`）——逐字复核（2026-09-30 实跑）= CRLF 兼容（CRLF 串命中且 `m[0]` 不含 `\r`——`$`（m 旗）于 `\r` 前成立）；
   `BATCH-RECORD.md:238`（§4.14 判据命令）按 **parser 口径**另列——核 parser 单源式（无 `$`-锚正则面；不对 m 旗作断言，随本修解析面自然对齐）。

**落点表（可派）**：

| 序 | 落点 file:line | 模块 | 动作 | 现行行数 | Δ | 档位 |
|---|---|---|---|---|---|---|
| ①-1 | `thincoder-core/agent-tools/batch-skeleton.mjs:120` | M3 | `body.split("\n")` → `body.split(/\r?\n/)` | 174 | ±0（行内改） | <300 |
| ①-2 | `thincoder-core/agent-tools/batch-skeleton.mjs:143` | M3 | 同上（`sectionHasStatusLine`） | 174 | ±0（行内改） | <300 |
| ①-3 | `thincoder-core/agent-tools/batch-lifecycle.mjs:157-173` | M3 | `updateSectionStatusLine` 重写（扫描替换 ∥ 偏移插入——插入行行尾随标题行） | 329 | ≤±2 行 | >300（在册——拆分评估见 2.3 末） |
| ①-4 | `docs/batches/2026-09-30-core-tools-pairfix.test.mjs`（新档） | — | ①L1–①L4 落地件 | 新增 | 新增 | —（批内件） |
| ①-5 | `docs/core/design/BATCH-RECORD.md`（§4.9 ∥ §4.12 随动——同 2.5①） | M3 | 解析规格补「行尾形态无关」句 ∥ §4.12 机制注刷新 ∥ 文末变更记录行 | —（设计档） | 句级 | —（设计档） |

**验收腿（①L1–①L4 · 批内件机检）**：

- ①L1 解析四态：LF ∥ CRLF ∥ 混合（状态行 CRLF）∥ 混合（状态行 LF）⇒ `readBatchStatusLine`=open ∧ `sectionHasStatusLine(1)`=true；已收口-CRLF ⇒ closed；畸形值 ⇒ unknown（fail-closed 保真）。
- ①L2 消费全链（CRLF）：append ∥ status 过门；close 成；close 后 append ∥ status ∥ 再 close 全拒（与 LF 同——「再 close 拒」= **LF 行为对齐 · 非新增契约**（实读 `batch-lifecycle.mjs:321` 门 ∥ 头注 `:308-309`「对已收口档再 close ⇒ 拒」）；判由见 §2.9 #3）；`findInFlightBatch`：仅 CRLF 在飞命中 ∥ LF+CRLF 双在飞按复数判——受控基底 ∥ 驱动面：fixture 目录 + 既有注入缝 `_setProjectRootForTest`（测试注入位——`manifest-discovery.mjs:19`；`manifest.mjs:42` re-export）⇒ 缺省基底 = `<fixtureRoot>/docs/batches` ∥ 直调 `findInFlightBatch(cwd, bases)`（`bases` = 显式注入面——既有签名 `batch-lifecycle.mjs:82`）；不扫仓内 `docs/batches`——真基底含在飞档：本批档自身即一例 ⇒ 断言随仓内容漂移。
- ①L3 写面保真（替换四态 + 缺行自建两格）：status/close ⇒ §1 段内状态行恰一行 ∧ 除被替换行外全文字节零变（串等值法——替换行行尾随原行自身）；缺行档自建（close 对无状态行档自建机读位——台账 #422③；承 `docs/batches/2026-09-28-tech-debt-closeout.md` §2 #422 行）⇒ LF ∥ CRLF 两格：除新增块外零变 ∧ 新增块行尾 = 标题行自身行尾。
- ①L4 复现对照（入件）：重演 2.4 口径 ⇒ CRLF ∥ 混合读数逐项对齐 LF（对照 = 2.4 修复形模拟读数）。

验收对照：#732（解析 ∥ 门 ∥ 扫描 ∥ 写面四现象）⇒ ①L1–①L4 全覆盖。

### 2.3 案② 设计——CLI 贴图生命周期（#733）

**机制设计（四件）**：

1. **落盘（a）**：`clipboard.mjs` 撤 `<cwd>/.thincoder-paste-<ts>.png` 直落 ⇒ 捕获至系统临时 staging（`join(os.tmpdir(), "thincoder-paste-<ts>.png")`——临档不入项目树）⇒ 读 buffer ⇒ **staging 用毕即清**（成功径读后 unlink——与失败径（②L5）同口径；ENOENT 容忍；仅进程中断窗口残余归 OS）⇒ 交新导出 `savePastedImageBuffer(buffer, cwd)`。
   **调用图（生产径——唯一写盘者 = 核 `savePastedImages`）**：`pasteClipboardImage → savePastedImageBuffer → [写时扫除 → 构 dataURL → 核 savePastedImages(dataUrls, cwd, {fs})]` ⇒ `<cwd>/.thincoder/tmp/paste-<id>-0.png`；`savePastedImageBuffer` 自身零自写盘（扫除 ∥ 构串 ∥ 调核）。
   扫除**在生产径上**（`pasteClipboardImage` 恒调 `savePastedImageBuffer`——非仅测点；见 b）。捕获面测试缝 = `pasteClipboardImage(ctx, captureImpl = null)`——第二参 `captureImpl(dest)` `??` 缺省平台捕获实现（写 staging ∥ 无图抛）；缺省 null ⇒ 生产调用点零改 ∥ 参数作用域 ⇒ 零跨调用残留。
   **定形 = 核件零改 ∥ 不增 buffer 入口**（核签名实读 = dataURL 串列——桌面 ∥ VSC 同形；CLI 以 dataURL 生产者身份接正路）。
   超阈早筛 = stat 后、读前（核 `IMAGE_MAX_BYTES` 单源——不读巨件）。失败径（dim 提示行 ×3）：无图 = 既有句逐字沿用 ∥ 超阈 = `Clipboard image too large (max 15MB)` ∥ 写败 = `Clipboard image could not be saved (write failed)`。
2. **清理接线（b）**：写时扫除 = 调核前一步 `cleanupOldToolResults(<cwd>/.thincoder/tmp)`（核 `helpers.mjs:134`——3 天窗 `:80`），执行位 = `savePastedImageBuffer` 内——**随生产径恒执行**（调用图 = a）。
   `savePastedImageBuffer(buffer, cwd)`：扫除 ⇒ 构 dataURL ⇒ 调核 `savePastedImages` ⇒ 路径 ∥ null（新导出——兼批次本地件测点；先例 = `buildWindowsClipboardCommand` 测用导出）。
   **不接 `cleanupTurn`**：CLI 件须跨回合重读（用户实诉）——逐回合清 = 复刻实害；3 天窗 = 档头 mtime 扫除同口径（写时自清理先例 = offload ∥ crash-reports 族）。
3. **撤读后删（c）**：`file.mjs:181-185` 块删净 + `:22` import 去 `unlink`（该档唯一用处）——`read_image` 回归 `readonly:true` 声明语义（读不动档）。
4. **旧根族处置（d）**：**不追**——本仓零存量（glob 实读零命中）；遗留件惰性（新码不再产 ∥ 不再自动删）；不设扫除 ∥ 不动 `.gitignore`。

**落点表（可派）**：

| 序 | 落点 file:line | 模块 | 动作 | 现行行数 | Δ | 档位 |
|---|---|---|---|---|---|---|
| ②-1 | `thincoder-cli/src/tui/clipboard.mjs:135-180` | — | `pasteClipboardImage` 重写（staging ∥ 捕获缝第二参 ∥ 调 `savePastedImageBuffer` ∥ 返回契约 = `{ insert, path }`：`insert` = 插入文本 ∥ `path` = 最终绝对路径；失败径 `null` + 提示行 ×3） | 180 | ≤±15 行 | <300 |
| ②-2 | `thincoder-cli/src/tui/clipboard.mjs`（新导出——置 `pasteClipboardImage` 前） | — | `savePastedImageBuffer`：写时扫除 → 构 dataURL → 调核 `savePastedImages` → 路径 ∥ null | 180 | ≤+12 行 | <300 |
| ②-3 | `thincoder-cli/src/tui/clipboard.mjs:1` | — | +`node:fs`(mkdirSync/writeFileSync) ∥ `node:fs/promises`(stat/readFile/unlink) ∥ `node:path`(join) ∥ `node:os`(tmpdir) ∥ 核 `attachments.mjs`(savePastedImages/IMAGE_MAX_BYTES) ∥ 核 `helpers.mjs`(cleanupOldToolResults) | 180 | ≤+6 行 | <300 |
| ②-4 | `thincoder-core/tools/file.mjs:181-185` | — | 删「读后即删」块 | 468 | −5 行 | >300（在册——拆分评估见 2.3 末） |
| ②-5 | `thincoder-core/tools/file.mjs:22` | — | import 去 `unlink` | 468 | ±0（行内改） | 同上 |
| ②-6 | `thincoder-core/attachments.mjs:16-17`（注释行——随实施） | — | 清理面短句 + 「机制单源 = `docs/core/design/PROVIDER.md` §6.18」指针（同 2.5④） | 125 | ≤+2 行 | <300 |
| ②-7 | `docs/batches/2026-09-30-core-tools-pairfix.test.mjs`（同 ①-4） | — | ②L1–②L6 落地件（②L4 ∥ ②L5 经捕获缝驱动） | 新增 | 新增 | —（批内件） |
| ②-8 | `docs/core/design/PROVIDER.md`（§6.18 随动——同 2.5②） | — | 自清理句收正为端侧时序面整句（载全文——终形 = `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.6①）∥ CLI 子句按落地时真值成终形 ∥ 文末变更记录行 | —（设计档） | 句级 | —（设计档） |

**验收腿（②L1–②L6 · 批内件机检）**：

- ②L1 落盘形 ∥ 根零残留：`savePastedImageBuffer(pngBuf, cwd)` ⇒ 路径 = `<cwd>/.thincoder/tmp/paste-<id>-0.png` ∧ 件在场 ∧ cwd 根零新 `.thincoder-paste-*`。
- ②L2 非一次性：同一件连续两次 `read_image` ⇒ 两次成功 ∧ 档仍在。
- ②L3 清理窗（3 天）：tmp 内超龄件（mtime 回拨 >3 天）⇒ 下次落盘后被清 ∥ 未超龄件保留。
- ②L4 路径稳定（捕获缝驱动）：`pasteClipboardImage(ctx, 捕获缝)` ⇒ 返回契约 `{ insert, path }`（断言对象钉此边界——②-1）：`path` = `<cwd>/.thincoder/tmp/paste-<id>-0.png`（最终绝对路径——非 staging）∧ `insert` = `read_image <path>`（实际插入文本）；同路径两读可解。
- ②L5 失败径不静默（捕获缝驱动）：无图（捕获抛 ∥ 零字节）∥ 超 15MB（捕获落巨件）∥ 写败（cwd 取不可建目录之形）⇒ 提示行在场 ∧ staging 清（用毕即清——同 (a) 成功径口径）∧ 零插入；超阈以核 `IMAGE_MAX_BYTES` 单源早筛（不构巨串）。
- ②L6 面零改读数：核 `attachments.mjs` 行为零改 ∥ 桌面 ∥ VSC 消费面零触（diff 空证）；`read_image` 其余语义（svg ∥ 非视觉门 ∥ 15MB 闸）零回归。

验收对照：#733（落盘 ∥ 一次性 ∥ 根污染 ∥ 清理四现象）⇒ ②L1–②L6 全覆盖（清理窗 = 3 天——文档化窗；逐回合窗不适用 CLI 面，理由见 2.6 D-3）。

受影响档行数（现行 = `split("\n").length − 1` 实读 · as-of 2026-09-30）：skeleton 174 ∥ lifecycle 329 ∥ `tools/file.mjs` 468 ∥ clipboard 180 ∥ attachments 125——逐行「现行 + Δ（≤±N）+ 档位」+ 模块列见两落点表；>300 两档终读数 = lifecycle ≈331 ∥ `tools/file.mjs` ≈463；均 ≪500 硬限。

**拆分评估（>300 两档——在册消解条件逐档裁定）**：

- `batch-lifecycle.mjs` 329 → ≈331（Δ ≤±2）：在册计划 = `docs/core/design/TOOLS.md:741-742`（拆分位 = create 面 → 姊妹档 `batch-lifecycle-create.mjs`；**消解条件 = 越 500 硬限 ∥ 该档下次实质改动时**）。
  **裁定 = 不触发**：本批 = 点修级（`updateSectionStatusLine` 单函数重写——零结构面 ∥ 零导出面 ∥ 在册拆分位零触），不构成「该档下次**实质**改动」；329 ≪ 500 ⇒ 缓办（维持登记 ∥ 计划 ∥ 条件续挂；拆分 = 独立结构动作，不入本批）。
  登记面现态 = `TOOLS.md:842`（`SOFT_LINE_REGISTRY` 运行面随测试树清退场——机检义务随重建恢复）；该档未入 §2.8.1 子表 → F-5。
- `tools/file.mjs` 468 → ≈463（Δ −5）：在册计划 = `docs/core/design/CORE-UNIFICATION.md:1139`（§2.8.1 子表行 17——拆分位 = 工具族四面；**消解条件 = 越 500 硬限前 ∥ 该档下次实质改动时**）。
  **裁定 = 不触发**：本批 = 删块（净减——零结构面 ∥ 拆分位零触）；463 ≪ 500 ⇒ 条件续挂。

**L7 复核 = 1 模块**（模块列去重：M3——`batch-skeleton.mjs` ∥ `batch-lifecycle.mjs` ∥ 随动设计档 `BATCH-RECORD.md`；余行非 M 族 = `—`）⇒ ≤2 护栏内（无拆批）。
测试面 = 批内件新档（仓套件现为空清单 ∥ 批内件不进套件——随批归档，复跑 `node --test docs/batches/2026-09-30-core-tools-pairfix.test.mjs`）。

### 2.4 真机复现读数（验收基线 · 2026-09-30 实跑 · 真模块）

- 解析面（现行）：LF = open ∥ sectionHas=true；CRLF = unknown ∥ false；混合-状态行 CRLF = unknown ∥ false；混合-状态行 LF = open ∥ true。
- 消费面（现行）：append CRLF 拒 ∥ LF 过；status CRLF 拒 ∥ LF 过；close CRLF **过** ∥ LF 过；**再 close CRLF 过（不拒）** ∥ LF 拒——「close 全拒」与实不符：实害 = 冻结真值虚化 + 双关不拦（解析面修后自动闭合）。
- 在飞扫描（现行）：LF+CRLF 双在飞只识 LF（欠计 ⇒ 缺省定位错靶风险）；仅 CRLF ⇒ 抛「无在飞批」。
- 混合写面（现行）：close(m1) ∥ close(m2) 均过且 §1 现重复状态行（全文状态行计数 3 vs 纯态 2——多出者即 §1 重复行）——「写面 EOL 保形已安全」仅纯态成立。
- `read_image`（现行）：读后档即删（exists-after=false）∥ 二次读 ENOENT（读后即删实读坐实）。
- 修复形模拟（同探针）：解析四态 ⇒ open/true 全对齐、已收口-CRLF ⇒ closed；写面新形——纯态旧=新逐字节等值 ∥ 混合替换后 §1 状态行恰一行 ∧ 其余字节零变。
- 探针件存 `.thincoder/tmp/pairfix-probe/`（复跑口径 = 批内件 ①L4 复演）。

### 2.5 文档随动（收正清单 · 落实时点 = 实施后收正轮）

**跨批同句（② ∥ ④）**：**终形以 `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.6 为准**（跨批同句写者序 · 父裁 2026-09-30；`PROVIDER.md` §6.18 载全文 ∥ `attachments.mjs` 头注短句指回 §6.18）。

① `docs/core/design/BATCH-RECORD.md` §4.9（`:171`）——解析规格补「行尾形态无关」句（LF ∥ CRLF ∥ 混合同判；`\r` 归行分隔）；§4.12（`:219`）段内改写机制注刷新（逐行扫描 ∥ 命中行原位替换 ∥ 缺行插入支行尾随标题行——字节保真；**as-of 坐标按现盘重锚 = `thincoder-core/agent-tools/batch-lifecycle.mjs:169`——替换旧号 `:159`，勿并存堆叠**）；文末变更记录行。

② `docs/core/design/PROVIDER.md` §6.18（`:271`）——「文件随 offload 写时自清理」句收正为**端侧时序面整句**（§6.18 载全文——终形定稿 = `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.6①）：桌面 = 回合尾 `cleanupTurn` ∥ CLI ∥ VSC = 贴图落盘写时 mtime 扫除（3 天窗）；**CLI 子句按落地时真值成终形**（本批落地后 CLI 已接——现盘「CLI = 未接（留存）」随收正轮收正）；文末变更记录行。

③ `docs/core/design/TOOLS.md`——前提自核毕：`read_image` 行（`:242`）无删除句、无失实句——**零改**。

④ `thincoder-core/attachments.mjs:16-17` 头注——清理面句收正为**短句 + 「机制单源 = `docs/core/design/PROVIDER.md` §6.18」指针**（终形定稿 = `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.6②）：桌面 = 逐回合显式清（`cleanupTurn`——落句依据 = 逐回合删件实读：`thincoder-desktop/src/main/attachments.mjs:101-107`，非 mtime 窗）· CLI ∥ VSC = 贴图落盘写时 mtime 扫除（3 天窗）；**CLI 子句按落地时真值成终形**（本批落地后 CLI 已接——现盘「CLI = 未接（留存）」随收正轮收正）；产品档注释行，随实施。

⑤ 前提自核（零改）：`docs/cli/design/TUI.md:63` ∥ `TUI-INPUT-BOX.md:48/:214`（粘贴功能句照旧）∥ `docs/TODO-archive.md:136` P19（归档记录——冻结零触）。

⑥ 登记面判定 / 发布关联（判据 = `docs/core/design/TOOLS.md:955`）：案① = 纯缺陷修复（判据未变——解析恢复文档化规格）∥ 案② = 纯缺陷修复（对齐文档化单源——`read_image` 出口串零变 ∥ 贴图路径形态 = 文档化既有形态 ⇒ 不属模型可见新形态）⇒ **零对外契约登记、零 CHANGELOG 行**；发布关联 = 修复随下一代 CLI 发布（发布动作 = 用户门——照 §6.14 先例）；**`CHANGELOG.md` 本批零触**（笔权在另面）。

### 2.6 关键决策与依据（含被否）

- D-1 案①修形 = **行切分归一 + 写面原位**——否决改 `STATUS_LINE_RE` 字面 ∥ 落 m 旗：`\r` 语义属行分隔层；正则字面 = 行形单源，改动面最小且四态实读全绿（2.4）。
- D-2 案②落形 = **CLI 以 dataURL 生产者接核正路**——否决「`savePastedImages` 收 buffer 形」与「增 buffer 入口」（核签名实读 = dataURL 契约；消费面零改纪律；「禁另发明」判据）。
- D-3 案②清理 = **写时 3 天窗扫除**——否决在 **CLI 面**接 `cleanupTurn`（逐回合清 = 复刻实害：CLI 件须跨回合重读——用户实诉；D-3 理由限定 CLI 面）。桌面面实读 = **逐回合删件**（`cleanupTurn` 逐件清本回合 `paths`——`thincoder-desktop/src/main/attachments.mjs:101-107`；结算点 = `turn-face.mjs:192` ∥ `turn-input.mjs:82/:89` ∥ `turn-chain.mjs:87` ∥ `suspension-drive.mjs:124/:162`——grep 实读）：桌面面**同受「跨回合重读不可达」限制**（回合毕 ⇒ 本回合件全删——显式认账）——该形 = 桌面在册契约（头注 `:19` 项 6——单源 = `docs/desktop/design/IPC.md` §2「附件注」项 6），本批零改。
- D-4 修幅 = 案①含写面小修（混合档重复行实害——2.4）：**修正 §1「写面零改候选」口径**（纯态成立 ∥ 混合档不成立）。
- D-5 旧根族 = 不追（零存量实读；不设新扫除面——禁另发明）。

复核：两案均 = 已文档化机制的忠实执行（案② = 核档头落盘管线 ∥ 清理面规格；案① = §4.9 机制意图的落地（行尾句随 2.5① 补入））——零新机制。

### 2.7 发现与上抛项

- F-1 **VSC 贴图件无清理面（文档与实码不符 · 范围外）**：`attachments.mjs:16-17` ∥ `PROVIDER.md:271` 声称「VSC = offloadToolResult mtime 扫除兜底（paste-* 在其扫除面内）」；实读 = offload 已上提核、默认目录 `~/.thincoder/tool-results`（`helpers.mjs:156`）——`<cwd>/.thincoder/tmp` 不在扫除面。
  VSC 源码零扫除调用 ⇒ paste-* 无自动清理（累积）——`parity-b4 §2.3`（`:129`）「保留」裁定的「无落盘累积」结论对 VSC 不成立。**裁定（父侧 · 2026-09-30）= 登记接受**（台账 #735 在册；接线另轮——本批不涉）。
- F-2 §1 表述与实不符两处（已按实修正于 2.4/D-4）：「close 全拒」实为「未拒（短跳）+ 双关不拦」；「写面 EOL 保形已安全」仅纯态成立。
- F-3 `TOOL-OUTPUT-LIMITS.md:111` 行引 VSC `run-helpers.mjs:167`（`offloadToolResult`）坐标已退役（该档 89 行 ∥ 头注自述消费面随主循环退役）——再锚候选（表外 ∥ 机检轮）。
- F-4 机检面：本次改动引发行号顺移（API-CONTRACT 等坐标表）——按派单「机检卫生不单独扫」，留机检轮。
- F-5 **登记面收口缺口（`batch-lifecycle.mjs` 未入 §2.8.1 子表 · 范围外）**：`TOOLS.md:842` 口径 = 「设计侧现行登记面 = `CORE-UNIFICATION.md` §2.8.1 子表」，
  而该档（>300、带计划）于 §2.8.1 主/子表零命中（2026-09-30 全档 grep 实核）——其计划现仅住 `TOOLS.md:741-742`；已退役 `SOFT_LINE_REGISTRY` 对应项未随迁。**处置建议：随登记面收口轮补登**——本批不涉。
- 上抛：无（F-1 已裁——登记接受；F-5 为范围外登记面项，需入册由父侧定）。其余无阻塞。

### 2.8 设计收正轮 1（评审轮 1 · #1–#12 逐号落毕 · 2026-09-30 · 状态行经工具刷新）

**逐号落点（号 → 落点——前文就地同步）**：

- #1 §2.3 (a)/(b)——调用图钉死（生产径 = `pasteClipboardImage → savePastedImageBuffer → [写时扫除 + 构 dataURL + 核 savePastedImages]`；唯一写盘者 = 核 ∥ 扫除在生产径）+ ②-1 ∥ ②-2 行同步。
- #2 捕获面测试缝（参数覆盖——`??` 缺省 null；生产零变）+ ②L4 ∥ ②L5 改钉捕获缝 + ②-7 声明同步。
- #3 两落点表补「现行 + Δ（≤±N）+ 档位」+ 模块列 ∥ §2.3 行数段重写 + 拆分评估（>300 两档——在册消解条件逐档判「不触发」+ 由）。
- #4 「L7 复核 = 1 模块」结论行（模块列去重）——≤2 护栏内。
- #5 腿号加案前缀（①L1–①L4 ∥ ②L1–②L6）+ ①-4 统一「①L1–①L4 落地件」。
- #6 §2.2 写面补插入行行尾取法（标题行自身行尾）+ ①L3 补 CRLF 缺行档。
- #7 §2.2 同族扫查改锚 `BATCH-RECORD.md:345`（逐字复核 CRLF 兼容）+ §4.14（`:238`）按 parser 口径另列。
- #8 ①L3 出处补（台账 #422③ + 承批坐标——自足句）。
- #9 清理面句单源化（全文 = `attachments.mjs` 头注 ∥ PROVIDER.md §6.18 = 指针）。
- #10 §2.5⑥ 登记面判定（两案均纯缺陷修复 ⇒ 零登记零 CHANGELOG；发布关联随下一代；`CHANGELOG.md` 零触）。
- #11 措辞统一「本修 = §4.9 机制意图的落地（行尾句随 2.5① 补入）」（§2.1 ∥ §2.6）。
- #12 F-1 裁定落档（父裁 = 登记接受 · 台账 #735）+ F-5（登记面收口缺口——范围外）。

**附（一致性面 · 已披露）**：②-3 import 枚举补 `node:os`(tmpdir) ∥ `node:fs/promises`(stat/readFile/unlink)——机制 (a) 既有引用，落点枚举补全。

**本轮 = 收正 ∥ 零新语义**（全部落点 = 评审发现 / 父侧裁定的直接落位）；§1 ∥ §3–§6 零触 ∥ 产品码零触 ∥ 评审未点火。

### 2.9 设计收正轮 2（评审轮 2 · #1–#5 逐号落毕 + 跨批同句追补 · 2026-09-30 · 状态行经工具刷新）

**逐号落点（号 → 落点——前文就地同步）**：

- #1（🟡 · 桌面面落句依据）——桌面面实读补毕（2026-09-30 · 真模块）：`cleanupTurn` = **逐回合删件**——`thincoder-desktop/src/main/attachments.mjs:101-107`（逐件 `rmSync` 本回合 `paths`；`force` 吞「已不在」；不删目录——他回合件可能在内）∥ 头注 `:19`（「宿主回合尾结算点调 `cleanupTurn(paths)` 清**本回合**落盘件」）∥ 结算点调用 = `turn-face.mjs:192` ∥ `turn-input.mjs:82/:89` ∥ `turn-chain.mjs:87` ∥ `suspension-drive.mjs:124/:162`（grep 实读）——**非窗口扫除**（零 mtime 面）⇒ 落「逐回合删件」腿：§2.5④ 措辞收正（附实读坐标 +「非 mtime 窗」）；D-3 加调和句——否决限定 **CLI 面** ∥ 桌面面同受「跨回合重读不可达」限制（显式认账——形 = 桌面在册契约（头注 `:19` 项 6——单源 = `docs/desktop/design/IPC.md` §2「附件注」项 6），本批零改）。
- #2（🔵 · 引用卫生）——「评审 #176」两处（§2 状态行 ∥ §2.8 标题）就地收正为可解析指称「评审轮 1 · #1–#12」（解析对象 = §3 轮次 1 十一项 + 父裁 #12）；状态行经工具刷新（兼记收正轮 2 落毕）。
- #3（🔵 · 随动覆盖差）——随动①就地补「§4.12 刷新 = 逐行扫描 ∥ 命中行原位替换 ∥ **缺行插入支行尾随标题行**」；冻结面二择 = **注明腿**：①L2「再 close 全拒」= **LF 行为对齐**（非新增契约）——判由：① 现行 LF 即拒（实读 `batch-lifecycle.mjs:321` 门 ∥ 头注 `:308-309`「对已收口档再 close ⇒ 拒」——行为先于本批）；② 本修射程 = EOL 形态无关（解析层）⇒ 该腿性质 = CRLF/LF 对齐核验；③ 否决「冻结面补 close 项」腿 = 修复批内零新增规范句（冻结面枚举（`BATCH-RECORD.md:172` ∥ `:227` ∥ `:150`）只列 append / status、未言「仅」——不与「再 close 拒」相抵）⇒ 随动面零增。
- #4（🔵 · 确定性）——①L2 就地补受控扫描基底 ∥ 驱动面：受控基底 = fixture 目录 + 既有注入缝 `_setProjectRootForTest`（测试注入位——`manifest-discovery.mjs:19`；`manifest.mjs:42` re-export）⇒ 缺省基底 = `<fixtureRoot>/docs/batches` ∥ 直调 `findInFlightBatch(cwd, bases)`（`bases` = 显式注入面——既有签名 `batch-lifecycle.mjs:82`）——不扫仓内 `docs/batches`（真基底含在飞档：本批档自身即一例 ⇒ 断言随仓内容漂移）。
- #5（🔵 · 断言对象）——②-1 行就地补 `pasteClipboardImage` 返回契约 = `{ insert, path }`（`insert` = 插入文本 ∥ `path` = 最终绝对路径；失败径 `null`）；②L4 断言就地钉到该边界（断言对象 = 返回契约——非「插入命令」转述）。
- #6（追补 · 跨批同句写者序——父裁 2026-09-30）——② ∥ ④ 清理面句方向与 `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.6 互抵（**彼时**本批 = §6.18 指针 ∥ 头注单源；#735 = §6.18 全文 ∥ 头注短句指回）⇒ 父裁「以 #735 §2.6 定稿为准」；§2.5 节首就地加标注（终形以该批 §2.6 为准）——**本体（② ∥ ④ ∥ ②-8 ∥ ②-6）已随收正轮 3 改写为终形方向（评审轮 3 #1 补落）**。归入本收正轮，不另立。

**本轮 = 收正 ∥ 零新语义**（全部落点 = 评审轮 2 发现 ∥ 父裁追补的直接落位）；§1 ∥ §3–§6 零触 ∥ 产品码零触 ∥ 机制本体零改（只按号收正）∥ 评审未点火。

### 2.10 设计收正轮 3（评审轮 3 · #1–#3 逐号落毕 · 2026-09-30 · 状态行经工具刷新）

**逐号落点（号 → 落点——前文就地同步）**：

- #1（🔴 · 跨批同句方向）——§2.5 ②（`:164`）∥ ④（`:168`）∥ 落点表 ②-8（`:122`）本体就地重写为终形方向（§6.18 载整句 ∥ 头注 = 短句 + 「机制单源 = §6.18」指针；终形定稿 = `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.6）；反向表述删净（「§6.18 改指针」∥「本句单源（② 侧为指针）」∥「VSC = 扫除未接（贴图件留存）」）；**CLI 子句按落地时真值成终形**（本批落地后并入「CLI ∥ VSC = 贴图落盘写时 mtime 扫除（3 天窗）」——现盘「CLI = 未接（留存）」随收正轮收正）。同向表述第 4 处——落点表 ②-6（`:120`）「本句单源」随同修（评审表未列——一致性面，已披露）；§2.9 #6（`:225`）括注加「彼时」限定 + 补记本体改写落点（收正轮 2 标注缺口——已补落）。
- #2（🔵 · 成功径 staging 处置）——机制 (a)（`:100`）补成功径处置句（staging 用毕即清——成功径读后 unlink，与失败径同口径；ENOENT 容忍；仅进程中断窗口残余归 OS）；②L5（`:130`）同口径同步（「staging 清」→「用毕即清——同 (a) 成功径口径」）。
- #3（🔵 · as-of 漂移）——随动①（`:162`）as-of 坐标句改为按现盘重锚（旧 `:159` → 现 `thincoder-core/agent-tools/batch-lifecycle.mjs:169`——替换旧号，勿并存堆叠）。

**本轮 = 收正 ∥ 零新语义**（全部落点 = 评审轮 3 发现 ∥ 父裁「全采纳」的直接落位）；§1 ∥ §3–§6 零触 ∥ 产品码零触 ∥ 机制面改动仅限 #2 补入的处置句（其余零改）∥ 评审未点火。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 清晰度（案② 写盘者） | 🟡 | 写盘路径二义：批档 `:66` 定形 = CLI 构 dataURL 直调核 `savePastedImages`（核件零改）；`:68` 又让新导出 `savePastedImageBuffer(buffer, cwd)` 承担「写盘前扫除 → 落盘」并自注「批次本地件测点」；`:77`（②-1）重写 `pasteClipboardImage` 只写「staging ∥ 核管线」，未写调用该导出。按字面读 ⇒ 生产径直调核件、扫除只活在仅测试驱动的导出上：`:89` L3 会在「产品无扫除」形态下通过（验收有效性缺口），且 `:112` 拟写进 PROVIDER.md §6.18 的「CLI = 贴图落盘写时 mtime 扫除（3 天窗）」成失实句 | 钉死调用图（生产径 = `pasteClipboardImage → savePastedImageBuffer → [扫除 + 构 dataURL + 核 savePastedImages]`），明写唯一写盘者与「扫除在生产径上」 |
| 2 | 验收判据（可执行性） | 🟡 | `:90` L4（插入命令 = 最终绝对路径）与 `:91` L5（无图 ∥ 超阈 ∥ 写败 ⇒ 提示行在场）须驱动系统剪贴板捕获段，而捕获段无任何注入缝（`:68` 的 `buildWindowsClipboardCommand` 先例只覆盖命令构造）；`:83` 仍称 L1–L6 全为「批内件落地件」⇒ 无图 / 超阈两态随环境漂移、>15MB 态不可构造（真剪贴板不可确定复现） | 补捕获面测试缝（模块级 setter 或参数覆盖 + `??` 缺省 null ⇒ 生产行为零变、`finally` 复位），或把 L4/L5 断言改钉到可注入边界并同步 `:83` 落地件声明 |
| 3 | 行数注记（档位） | 🟡 | `:96` 以「均 ≤500 硬限，拆分不需」一句收口，未按档位处理两个 >300 档（`batch-lifecycle.mjs` 329 → ≈331 ∥ `tools/file.mjs` 468 → ≈464）；且与在册拆分计划相抵：`TOOLS.md:741-742` 已为 `batch-lifecycle.mjs` 登记「跨 300 软线 ⇒ 登记 + 拆分计划（拆出 `batch-lifecycle-create.mjs`）+ 消解条件 = 越 500 硬限 **或 该档下次实质改动时**」——本批改的正是该档写面，消解条件是否触发未判（登记面现态 = `TOOLS.md:842`）；表内亦无「现行行数 + Δ（≤±N）」列（`BATCH-RECORD.md:273` §4.14 E⑤「>300 行 ⇒ 随附拆分评估」同口径） | 受影响表逐行补「现行行数 + Δ（≤±N）+ 档位」；两个 >300 档逐档落拆分评估结论（含在册消解条件是否触发 ∥ 缓办理由） |
| 4 | 方法学合规（L7） | 🟡 | §2 落点表无「模块列」（`:45-50` / `:75-83`）；`BATCH-RECORD.md:330`（§5.1 L7 取数面）要求 = §2 表模块列去重（设计档行一并计入）+ 判定时点②「§2 表落表后复核，>2 ⇒ 停下上报」；本批跨 batch 工具两件 + CLI TUI + 核 tools + 两份设计档（两案并批）⇒ 模块计数与 ≤2 护栏复核无处可判 | 补模块列（非 M 族行标 `—`，设计档行一并计入）并落「L7 复核 = N 模块」结论行 |
| 5 | 验收判据（腿号 / 落地件） | 🟡 | 腿号与落地件映射互斥：`:52` 案① 腿集 = L1–L4，`:50`（①-4）写「L1–L3 落地件」，`:106` 又称「复跑口径入批内件 L4」；且 `:83`（②-7）「L1–L6 落地件」与案① 共落同一新档 ⇒ 档内腿号撞号（「L3 / L4」二义） | 腿号加案前缀（①L1–①L4 ∥ ②L1–②L6）并统一落地件归属（案① 四腿全落批内件，或明写 L4 = 人工对照不入件） |
| 6 | 清晰度（写面规格） | 🟡 | `:40` 替换支明写「行尾随各行自身」，插入支只写「偏移插入（标题行后；纯态与旧形逐字节等值——实读校验）」——CRLF 档缺状态行时新插入行行尾无规（写 `\n` 即把该档造为混合档）；`:56` L3「缺行档自建（close #422③）⇒ 除新增块外零变」亦未钉新行行尾、未含 CRLF 缺行档格 | 明写插入行行尾取法（随该档多数派行尾 ∥ 标题行自身行尾），L3 补 CRLF 缺行档一格 |
| 7 | 文档状态（引用悬空） | 🟡 | `:41`「§4.14 单行式扫描（m 旗）」在现盘不落地：`BATCH-RECORD.md:238`（§4.14 命令）已是核 parser 单源式（无正则 / 无 m 旗），原「单行式」结构已按 `:477` 变更记录收正退役；现盘带 `m` 旗的单行扫描在 §5.1 L8（`BATCH-RECORD.md:345`） | 改锚 `BATCH-RECORD.md:345` 并逐字复核其 CRLF 兼容读数；§4.14 命令按 parser 口径另列 |
| 8 | 清晰度 | 🔵 | `:56`「缺行档自建（close #422③）」的编号在审四档无出处（在册面无解析对象） | 补出处（批次档 / 台账行坐标）或改写为自足句 |
| 9 | 文档归属 | 🔵 | 同一清理面句将落两处（`:112` PROVIDER.md §6.18 与 `:116` `attachments.mjs:16-17` 头注，设计自标「同句」）——两处同句 = 漂移面 | 一处留全文、另一处改指针（或标「本句单源 = …」） |
| 10 | 方法学合规（登记面） | 🔵 | 两修均属可见行为变更（`read_image` 不再删档 + CLI 贴图落点 / 命名变化），设计未落「登记面判定 / 发布关联」行；在册先例 = `TOOLS.md:955`（纯缺陷修复 ⇒ 零登记零 CHANGELOG；归一变更 ∥ 模型可见新形态 ⇒ 登记 + CHANGELOG + 发布关联） | 补一行登记面判定（案① = 缺陷修复 ∥ 案② 是否属模型可见新形态）并按判定落 CHANGELOG / 登记 |
| 11 | 判据口径 | 🔵 | 「忠实执行已文档化机制」措辞与现盘略松：`:29` / `:128` 称案① 规格源 = 「§4.9 已写明的解析规格」，而 `:110`（2.5①）拟为 §4.9 **补**「行尾形态无关」句——现盘 §4.9（`BATCH-RECORD.md:171`）只载解析对象与关键字判定，未载行尾句 | 措辞统一为「本修 = §4.9 机制意图的落地（行尾句随 2.5① 补入）」，免「已写明」与「补句」并存的读法分叉 |

计数：🔴 0 · 🟡 7 · 🔵 4（合计 11）。文档归属在审面自核：两处设计档修正（BATCH-RECORD.md §4.9 / §4.12 · PROVIDER.md §6.18）均落在既有主档、无新建档碎片化、未见机制级描述相抵（无 🔴）。评审面限制：无 project standards 文档 / 无 document map（按 review 上下文声明）——方法学合规按在审文档（BATCH-RECORD.md §4/§5 · TOOLS.md §6.7/§6.15）与 Project Guide 判定。范围外注记（无 severity，本审未验证）：落点表代码坐标与 §2.4 复现读数（`batch-skeleton.mjs` / `batch-lifecycle.mjs` / `file.mjs` / `clipboard.mjs` / `attachments.mjs` / `helpers.mjs`）不在审面；2.5⑤ 前提自核指向的 `docs/cli/design/TUI.md` · `TUI-INPUT-BOX.md` · `docs/TODO-archive.md` 不在审面；F-1 / F-3 / F-4 按 declaration 排除未评。

VERDICT: pass

### 轮次 2（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档随动（落句依据） | 🟡 | `:144`（§2.5④）拟写「桌面 = 回合尾 `cleanupTurn`」为 `attachments.mjs:16-17` 头注单源全文——该归属在 §2.4 无读数（2.4 仅 CLI 面：解析∥消费∥扫描∥写面）；同批 F-1 已证同族句在 VSC 面失实。且与 D-3（`:154`）「逐回合清 = 复刻实害：跨回合重读不可达」需一句调和——cleanupTurn 若为逐回合删件，桌面面即同受该限制（应显式认账）；若为窗口扫除，则 D-3 措辞失准 | 落句前补桌面面实读，或把 D-3 理由限定为 CLI 面 ∥ 桌面语义另注；单源句成文前先核读（免再造 F-1 同族失实句） |
| 2 | 引用卫生 | 🔵 | 「评审 #176」两处（`:30` §2 状态行 ∥ `:171` §2.8 标题）在审面无解析对象——PROVIDER.md 的 `#176` = 华为云台账（与评审无关）；§2.8 实际内容 = #1–#12 逐号落毕 | 收正为可解析指称（如「评审轮 1 · #1–#12」）或补出处 |
| 3 | 文档随动（覆盖差） | 🔵 | 随动①（`:138`）§4.12 刷新句未含插入支行尾取法（`:48` 已钉「插入块行尾 = 标题行自身行尾」）；`:68` ①L2 断言「再 close 全拒」不在文档冻结面枚举（`BATCH-RECORD.md:172` ∥ `:227` ∥ `:150` 只列 append / status） | 随动①句尾补「插入支行尾随标题行」；§4.13/§4.9 冻结面补 close 项，或注明该断言 = LF 行为对齐（非新增契约） |
| 4 | 验收判据（确定性） | 🔵 | `:68` ①L2 的 `findInFlightBatch` 断言（「仅 CRLF 在飞命中」∥「双在飞按复数判」）未写受控扫描基底 ∥ 驱动面——仓内真实 `docs/batches` 含在飞档（本批档自身即一例），无受控基底则断言随仓内容漂移 | ①L2 补驱动面一句（fixture 基底 ∥ 既有注入缝），使两断言在受控面上可复现 |
| 5 | 清晰度（断言对象） | 🔵 | `:107` ②L4 断言「插入命令 = `read_image <最终绝对路径>`」，而 `pasteClipboardImage` 的返回契约未写（`:84` 只钉 `savePastedImageBuffer` = 路径 ∥ null）——插入文本由该函数产出 ∥ 由调用层拼装，两者测点边界不同 | 明写 `pasteClipboardImage` 返回契约（插入文本 ∥ 路径），并将 ②L4 断言钉到该边界 |

计数：🔴 0 · 🟡 1 · 🔵 4（合计 5）。

文档归属在审面自核：随动①–⑥均落既有主档（BATCH-RECORD.md ∥ PROVIDER.md ∥ attachments.mjs 头注 ∥ 三个零改自核），无新建档碎片化、未见机制级描述相抵（无 🔴）。轮 1 十一项 +父裁 #12 已逐号抽查复见落地（#1 调用图 `:79-80` ∥ #2 捕获缝 `:80` ∥ #3 两表列+拆分评估 `:115-121` ∥ #4 L7 行 `:123` ∥ #5 案前缀腿号 ∥ #6 插入行尾 `:48` ∥ #7 改锚 `:52-53` ∥ #8 出处 `:69` ∥ #9 单源 `:98`∥`:140` ∥ #10 §2.5⑥ `:148` ∥ #11 措辞 `:37`∥`:158`），本轮无复出。评审面限制：无 project standards 文档 ∥ 无 document map（按 review 上下文声明）——方法学合规按在审文档（BATCH-RECORD.md §4/§5）与 Project Guide 判定。范围外注记（无 severity，本审未验证）：落点表代码坐标与 §2.4 复现读数（`batch-skeleton.mjs` ∥ `batch-lifecycle.mjs` ∥ `file.mjs` ∥ `clipboard.mjs` ∥ `attachments.mjs` ∥ `helpers.mjs`）不在审面；被引面外坐标（TOOLS.md ∥ CORE-UNIFICATION.md ∥ `docs/batches/2026-09-28-tech-debt-closeout.md` 等）未复核；L7 模块清单归属（`ENGINEERING-MODE-V2.md` §2.2）未复核；§2.5⑤ 指向的 TUI 档与 TODO-archive 不在审面。审面状态注：现盘 §2 含收正轮 1（§2.8——声明行称 §2.1–2.7，按现盘全貌审）；本表引用 = 本读落点（2026-09-30）。

VERDICT: pass

### 轮次 3（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档归属（同机制两述 · 跨批同句方向） | 🔴 | §2.5 ②（`thincoder/docs/batches/2026-09-30-core-tools-pairfix.md:164`）仍要求「`PROVIDER.md` §6.18 收正为**指针句**、清理面单源 = `attachments.mjs:16-17` 头注」；④（`:168`）载「头注 = 三面实况**全文**——本句单源（② 侧为指针）」；落点表 ②-8（`:122`）同向（「自清理句改指针」）。节首（`:160`；追补 `:225`）与已裁终形方向相反——`thincoder/docs/batches/2026-09-30-vsc-paste-cleanup.md:151`／`:155` = §6.18 载全文 ∥ 头注短句指回 §6.18，且现盘即终形（`thincoder/thincoder-core/attachments.mjs:17` 明载「机制单源 = `docs/core/design/PROVIDER.md` §6.18」；`thincoder/docs/core/design/PROVIDER.md:271` 载整句）。按 ②／④ 字面落笔 ⇒（a）反转 #735 已落随动（该批 `…vsc-paste-cleanup.md:307` 遗留③ = CLI 子句由本批收终形）；（b）头注「机制单源 = §6.18」与 §6.18 指针句互指／悬空；（c）④ 句内「VSC = 扫除未接（贴图件留存）」已失实（VSC 接线已落：`thincoder/thincoder-vscode/src/extension/image-handler.mjs:16`／`:26`）。节首标注未替换 ②／④／②-8 本体 ⇒ 同一机制在审面两述并存（一处待落指令 vs 一处终形） | 把 §2.5 ②／④ 与落点表 ②-8 行改写为 #735 §2.6 终形方向（§6.18 载整句、头注为短句 + 「机制单源 = §6.18」指针），删去被裁定取代的反向表述（「§6.18 改指针／本句单源（② 侧为指针）」）与已失实的 VSC 子句；CLI 子句按落地时真值成终形（本批落地后 CLI 已接） |
| 2 | 清晰度（成功径 staging 处置） | 🔵 | 成功径 staging 处置仅以「临档不入项目树；孤儿归 OS」带过（`thincoder/docs/batches/2026-09-30-core-tools-pairfix.md:100`），失败径明写「staging 清」（②L5 `:130`）——同函数两径处置不对称、成功径无钉法，实现轮可自决（读后删／不删皆可辩护） | 机制 (a) 与 ②L5 同口径明写成功径处置（读后 unlink staging，或明标「归 OS」为有意），免实现轮自决 |
| 3 | 数值漂移（已计划随动） | 🔵 | `thincoder/docs/core/design/BATCH-RECORD.md:219`（§4.12）载 as-of 快照坐标「`batch-lifecycle.mjs:159` `findIndex` 首命中、整行替换」——现盘该 `findIndex` 在 `thincoder/thincoder-core/agent-tools/batch-lifecycle.mjs:169`（`:159` = `if (!hdr) {`）；随动①（`thincoder/docs/batches/2026-09-30-core-tools-pairfix.md:162`）已计划「as-of 坐标实施后回填」 | 随动① 落笔时按现盘重锚该机制注坐标（替换旧号，勿以并存注堆积） |

计数：🔴 1 · 🟡 0 · 🔵 2（合计 3）。

抽核（criterion 8 实读）：落点表现行行数五项全对（skeleton 174 ∥ lifecycle 329 ∥ `tools/file.mjs` 468 ∥ clipboard 180 ∥ attachments 125）；坐标抽核全对（`tools/file.mjs:22`／`:181-185` ∥ `batch-lifecycle.mjs:82`／`:157-173`／`:308-309`／`:321` ∥ `batch-skeleton.mjs:48`／`:120`／`:143` ∥ `manifest-discovery.mjs:19`／`manifest.mjs:42`）；§2.2 同族扫查读数与实读相符（`ROUND_HEADING_RE`／`sectionHeaderRe`／`/^## §\d/gm` 无 `$` 病面；`attachments.mjs`／`cleanupOldToolResults` 语义与 3 天窗读数相符）。评审面限制：无 project standards 文档 ∥ 无 document map（按 review 上下文声明）——方法学合规按在审文档（BATCH-RECORD.md §4／§5）与 Project Guide 判定。

VERDICT: changes-required

### 轮次 4（评审子代理）

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | `thincoder/docs/batches/2026-09-30-core-tools-pairfix.md`（§2.5 ② ∥ ④ ∥ 落点表 ②-6 ∥ ②-8） | 🔴 | **Fixed** | ②（`:164`）已重写为「**端侧时序面整句**（§6.18 载全文——终形定稿 = `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.6①）…**CLI 子句按落地时真值成终形**（本批落地后 CLI 已接——现盘「CLI = 未接（留存）」随收正轮收正）」；④（`:168`）=「**短句 + 「机制单源 = `docs/core/design/PROVIDER.md` §6.18」指针**（终形定稿 = 同批 §2.6②）」；②-6（`:120`）∥ ②-8（`:122`）同向。反向表述删净（「§6.18 改指针」∥「本句单源（② 侧为指针）」∥「VSC = 扫除未接」全档零命中）；与 #735 §2.6 终形（`:151`∥`:155`）方向一致；现盘 `thincoder/thincoder-core/attachments.mjs:17` = 「机制单源 = `docs/core/design/PROVIDER.md` §6.18。」——不再互指／悬空（VSC 已接线 fresh 复核：`thincoder/thincoder-vscode/src/extension/image-handler.mjs:16`∥`:26`） |
| 2 | 2 | `thincoder/docs/batches/2026-09-30-core-tools-pairfix.md:100` ∥ `:130` | 🔵 | **Fixed** | `:100` = 「⇒ 读 buffer ⇒ **staging 用毕即清**（成功径读后 unlink——与失败径（②L5）同口径；ENOENT 容忍；仅进程中断窗口残余归 OS）」；②L5（`:130`）= 「staging 清（用毕即清——同 (a) 成功径口径）」——两径同口径 |
| 3 | 3 | `thincoder/docs/batches/2026-09-30-core-tools-pairfix.md:162` | 🔵 | **Fixed** | 随动① = 「**as-of 坐标按现盘重锚 = `thincoder-core/agent-tools/batch-lifecycle.mjs:169`——替换旧号 `:159`，勿并存堆叠**」；fresh 实读 `thincoder/thincoder-core/agent-tools/batch-lifecycle.mjs:169` = 「  const idx = lines.findIndex((l) => STATUS_LINE_RE.test(l))」✓ 重锚值正确 |
| 4 | (new) | `thincoder/docs/batches/2026-09-30-core-tools-pairfix.md:207` | 🔵 | New（不阻塞） | §2.8 #9 历史行仍载旧方向且无「彼时」标记——`:207: - #9 清理面句单源化（全文 = `attachments.mjs` 头注 ∥ PROVIDER.md §6.18 = 指针）。`——收正轮 3 声明「反向表述删净」未覆盖此历史行（对比 §2.9 #6（`:225`）已加「彼时」）；作用面 = 阅读面（工作单 = §2.5 已正确） |
| 5 | (new) | `thincoder/docs/batches/2026-09-30-core-tools-pairfix.md:162` ∥ `thincoder/docs/core/design/BATCH-RECORD.md:219` | 🔵 | New（不阻塞） | §2.5 落实时点 = 实施后收正轮（`:158`），而 ①-3 已重写 `updateSectionStatusLine` ⇒ 落笔时该函数行号将再移、且刷新后机制注应引**新实现**坐标（`:169` = 稿期值，指旧 `findIndex` 行）——勿按「`:159`→`:169`」字面替换，须按落笔时现盘重读 |

计数：🔴 0 · 🟡 0 · 🔵 2（新增，均不阻塞）。先轮（轮次 3）三项——1🔴 + 2🔵——全修毕（逐项 fresh 实读复核，见上表）。

VERDICT: pass

## §4 用户批准（主 agent）

**批准**：✅ 设计批准（2026-09-30 19:0x · 父侧代签）。依据 = 用户 19:04「b」（执行归属裁定：本批归 CLI 会话）+ 18:02「A」（修向裁定）+ 本会话 00:14「排空」全链授权。

**三条件齐备**：① 设计评审 **pass** ✓——§3 轮次 1（🔴0 ∥ 🟡7 ∥ 🔵4——11 条全收）∥ 轮次 2（🔴0 ∥ 🟡1 ∥ 🔵4）两轮均 pass；② 收正轮已落地并核验 ✓——收正轮 1（#1–#12）逐条父侧实读回验 ∥ 收正轮 2 在档（轮次 2 各项已随轮处置）；③ token 已签发 ✓（值不落档）。

**随批准裁定**：F-1 = 登记接受（台账 #735 · 另轮接线）∥ F-5 = 登记面收口轮补登 ∥ 拆分评估（>300 两档「不触发」）随档在案 ∥ 并行链产物（§3 轮次 2 ∥ 收正轮 2）照单接收。

**执行归属** = CLI 会话（用户 19:04「b」）；实施舱 = 本笔后即派。

**撤（2026-09-30 19:1x）**：用户复裁 = 桌面链保持自动巡航 ∥ CLI 避让（§1.5）——上条代签随撤；本批批准与执行归属以桌面链为准。CLI 实施舱已取消（零改动）。

**桌面链代签（复裁后 · 2026-09-30 20:4x）**：依据 = 用户 19:1x 复裁（§1.5——「桌面链保持自动巡航 ∥ CLI 避让」= 本批批准与执行归属以桌面链为准）+ 用户 18:28「自动跑完」+ 本会话 00:14「排空」全链授权；**设计链 = 两轮 pass**（§3 轮次 1 ∥ 轮次 2——收正轮 1/2 全落）。实施舱 = 本笔后即派（桌面链）；验收 = §2.2/§2.3 验收腿 ①L1–①L4 ∥ ②L1–②L6（批内件 `docs/batches/2026-09-30-core-tools-pairfix.test.mjs`）。

**父侧自识（如实）**：复裁落于 19:1x，桌面链未即时读档 ⇒ 实施派发迟到约 1.5 小时（用户 20:38 问起才转身）——本节代签即补，无内容面影响（设计 ∥ 评审 ∥ 收正轮均已在盘）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（2026-09-30 · 实施轮 · eng-coder——十腿 12/12 绿 ∥ 审计 1 轮 CLEAN ∥ 代码评审 2 轮（轮 1 pass + 轮 2 fix 复核 pass）· 详见 §5.1–5.6）



### 5.1 执行摘要（实施轮 · 2026-09-30）

**落点交付（§2.2 ∥ §2.3 落点表逐条 · 实测行数 = 现盘）**：

| 序 | 落点 | 落况 | 实测 |
|---|---|---|---|
| ①-1 ∥ ①-2 | `thincoder-core/agent-tools/batch-skeleton.mjs:120` ∥ `:143` | ✓ `body.split("\n")` → `split(/\r?\n/)`（`STATUS_LINE_RE:48` 字面零改） | 174 → 174（Δ0 ✓） |
| ①-3 | `thincoder-core/agent-tools/batch-lifecycle.mjs:158-176` | ✓ `updateSectionStatusLine` 重写（逐行扫描 ∥ 命中行原位替换〔行尾随命中行自身〕∥ 缺行标题行后偏移插入〔插入块行尾 = 标题行自身行尾，锚行后首二字节判读〕） | 329 → 332（Δ+3；计划 ≤±2，**+1 超估**） |
| ①-4 ∥ ②-7 | `docs/batches/2026-09-30-core-tools-pairfix.test.mjs`（新档） | ✓ 十腿落件（12 个 test 块：①L1 ∥ ①L2×2 ∥ ①L3×2 ∥ ①L4 ∥ ②L1–②L6） | 新档 412 行 |
| ①-5 | `docs/core/design/BATCH-RECORD.md` | ✓ §4.9 行尾句 ∥ §4.12 机制注 + as-of 重锚 ∥ 变更记录行 | 见 5.3 |
| ②-1 ∥ ②-2 ∥ ②-3 | `thincoder-cli/src/tui/clipboard.mjs` | ✓ `pasteClipboardImage(ctx, captureImpl)` 重写（staging → 早筛 → 用毕即清 → `savePastedImageBuffer` → `{insert, path}` ∥ 失败径 ×3 → null）∥ 新导出 `savePastedImageBuffer`（扫除 → dataURL → 核 `savePastedImages` → 路径 ∥ null）∥ 六条 import | 180 → 224（Δ+44；口径见 5.5） |
| ②-4 ∥ ②-5 | `thincoder-core/tools/file.mjs:22` ∥ 读后删块 | ✓ import 去 `unlink` ∥ 五行块删净（读后即删撤） | 468 → 463（Δ−5 ✓） |
| ②-6 | `thincoder-core/attachments.mjs:15-17` 头注 | ✓ CLI ∥ VSC = mtime 扫除句 + 「机制单源 = PROVIDER.md §6.18」指针 | 125 → 125（Δ0 ✓） |
| ②-8 | `docs/core/design/PROVIDER.md` §6.18 | ✓ CLI 子句按落地真值收终形 ∥ 变更记录行 | 见 5.3 |

**调用图实况（生产径）**：`pasteClipboardImage → savePastedImageBuffer → [cleanupOldToolResults → 构 dataURL → 核 savePastedImages]`——扫除在生产径上（`:207` 恒调）；唯一写盘者 = 核。生产调用点（`turn-face.mjs:52`）单参调用零改。

**未触面（零改自核）**：核件行为面（`savePastedImages` / `parseDataUrl` / `downgradeNonVisionImages` 签名与语义；②-6 仅注释行）∥ 桌面 ∥ VSC 消费面（`thincoder-desktop/src/**` ∥ `thincoder-vscode/src/**` 全表 diff 零命中）∥ `STATUS_LINE_RE` 字面 ∥ 冻结门语义 ∥ `TOOLS.md`（§2.5③）∥ TUI 两档 ∥ `TODO-archive.md:136`（§2.5⑤）∥ `CHANGELOG.md`（§2.5⑥零触）∥ `.gitignore`（旧根族不追——§2.3(d)）。

### 5.2 机检读数（命令 + 实读）

- `node --test docs/batches/2026-09-30-core-tools-pairfix.test.mjs` ⇒ **12/12 pass ∥ 0 fail**（复跑于修正轮 1 后——仍全绿）。
- 旧形/新形对拍（`.thincoder/tmp/pairfix-probe/probe-oldnew.mjs`）⇒ **ALL-BYTE-EQUAL**（纯 LF ∥ CRLF × 替换 ∥ 缺行自建 四格逐字节等值——①-3「纯态与旧形逐字节等值」实读校验）。
- 红证（`.thincoder/tmp/pairfix-probe/probe-redcheck.mjs`）⇒ 判据有判别力：修前解析 CRLF ∥ 混合（状态行 CRLF）= `unknown`（两态必红）；修前写面混合两态 §1 状态行数 = 2（重复行）vs 新形 = 1。
- `node --check` ⇒ 四代码档全过；`node --test bench/test/toolcall.test.mjs`（read_image 能力位/载荷面）⇒ 6/6 pass。
- ②L6 桌面 ∥ VSC 零触（报告面 diff 读数）：本会话改动全表 = 五代码档 + 两设计档 + 批内件（+ 两探针件，gitignore 区）；`thincoder-desktop/src/**` ∥ `thincoder-vscode/src/**` 零命中。
- 仓套件 = **未在实施链内跑**（纪律：repo-suite = 父侧收口一次；且 CLI 套件现为空清单——`test/run.mjs` 零用例早退）⇒ 父侧收口跑为唯一 repo-suite 跑。

### 5.3 文档随动（§2.5 清单 · 终形方向落实）

- ① `BATCH-RECORD.md`：§4.9「行尾形态无关」句（`:172`）∥ §4.12 机制注刷新 + as-of 重锚 `batch-lifecycle.mjs:169`（`:220-221`；旧 `:159` 替换不并存）∥ 变更记录行（`:474`）。
- ② `PROVIDER.md`：§6.18 CLI 子句收终形——「桌面 = 回合尾 `cleanupTurn` ∥ CLI ∥ VSC = 贴图落盘写时 mtime 扫除（3 天窗——核 `thincoder-core/agent/helpers.mjs` `cleanupOldToolResults` 单源）。」（`:271`）∥ 变更记录行（`:495`；#735 历史行保留其当时口径 = 记录面不回改）。
- ④ `attachments.mjs:15-17`：CLI ∥ VSC 并入扫除句 + 机制单源指针（#735 §2.6② 终形）。
- ③ ⑤ ⑥ 零改（自核复核：`TOOLS.md:242` 无删除句/无失实句 ✓；TUI 两档 ∥ TODO-archive 未触 ✓；零登记零 CHANGELOG ✓）。

### 5.4 内部审计 ∥ 代码评审（轮次与终态）

- **内部发散审计（explore · 只读）= CLEAN**：五类对照零命中（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 超清单 ∥ 验收腿缺失）；落点表 ①-1..②-8 逐项 verdict ✓（探针件随 §2.4 在册）。审计限制如实：无执行面工具 ⇒ 测试为静态核读（实跑读数 = 5.2）。
- **内部代码评审（advisor · code）= pass**（1🟡 可选 + 6🔵 · 零 🔴）。修正轮 1 逐条处置：
  - 🔵 `cursor` 取码点长度 → **修**（`const chars = [...insert]`——与 `insertPastedText` 同口径；星平面字符路径不漂）；
  - 🔵 `savePastedImageBuffer` 契约「路径 ∥ null」不越出 → **修**（核内异常 catch → null，归「写败」径）；
  - 🔵 批内件跨午夜脆性（`TODAY` 加载期定值 vs close 侧 `todayLocal()` 调用期取值）→ **修**（期望以写后文本为准 + 形判 `已收口 \d{4}-\d{2}-\d{2}`）；
  - 🔵 `BATCH-RECORD.md` §4.12 「+ 空行」字面歧义 → **修**（插入块逐字节随旧形〔含空行数〕——纯态等值实读校验）；
  - 🟡 两档 >300 软线（lifecycle 332 ∥ file.mjs 463）+ 🔵 批内件 412 行 → **不动作**（在册拆分评估「不触发」已裁 ∥ 批内件随批归档不进套件）；
  - 🔵 `readFile` 抛出径（异常逸出 + staging 残留）→ **不动作**（设计失败径枚举 = ×3 之外；生产径读 IO 错属异态，逸出由调用点 `.catch` 印红行 = fail-loud；staging 落 OS 临时区——「仅进程中断窗口残余归 OS」面）。
- 终态 = **converged**（修正后 12/12 复跑全绿；评审轮 2 = 复核 fix claims——结论随本段续笔）。

### 5.5 计划 vs 实测口径（如实披露）

- `clipboard.mjs` Δ = +44（计划逐项口径：②-1 ≤±15 ∥ ②-2 ≤+12 ∥ ②-3 ≤+6 ⇒ ≤+33）。超出项 = ①捕获实现抽函数（`captureClipboardImage`，落点表未单列，由 ②-1「staging ∥ 捕获缝」隐含）+19 行；②修正轮 1 两修 +5 行。功能面与落点表零偏差；档位 <300（224）。
- `batch-lifecycle.mjs` Δ = +3（计划 ≤±2）：重写后 332 行 ≪ 500；无结构面动作（在册拆分不触发）。
- 探针件（`.thincoder/tmp/pairfix-probe/`）= 本批验证工件（§2.4 在册存位；gitignore 区，不入仓）。

### 5.6 残留（≤2）

1. **VSC 贴图件扫除接线**——本批已落（#735 面），但核档与实码的「同句」终形已由本批收正；无残留动作。
2. **旧根族存量**（`<cwd>/.thincoder-paste-*`）——不追（§2.3(d) 裁定：本仓零存量；新码不再产；遗留件惰性）——如需清理由父侧裁量，无本批动作。

**续笔（评审轮 2 · fix-claims 复核）= pass**：逐项复核——游标 codepoint（`clipboard.mjs:218/:220`）**Fixed** ∥ 批内件时钟脆性（test `:203`/`:216` 期望以写后文本为准）**Fixed** ∥ §5 落位 **Fixed**；残余两条均不阻塞：① `readFile(staging)` 读窗仍无守卫（`clipboard.mjs:210`——核调用已内守卫、扫除自吞错已复核，残余仅此静默 IO 异常面，逸出由调用点 `.catch` 印红行）② `BATCH-RECORD.md:221`「空行数」未落值（措辞已收窄）。🟡 文件体量 = 在册裁定不触发；新增 🔴 ∥ 🟡 = 0。终态 = **converged**。

## §6 验证与收口（父代理）
