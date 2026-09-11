# 评审失败护栏 + 用户介入提醒（#IKDCVV 收口）· 批次记录（2026-09-11）

> 六段 append-only，一段一作者。编制：主 agent · 2026-09-11 15:10 · 来源 = 用户 13:36「都可以」（Gitee #IKDCVV——评估 id=47 拆条；②④ 两面获准）。

---

## §1 讨论（主 agent 记）

### 本批条目（2 条——#IKDCVV 拆条收口）

| # | 条目 | 内容 |
|---|---|---|
| **G1** | **评审失败护栏（防无限重评）** | 评估结论：②「反复被中断重评审」= token 断裂（判死/stale 均不签发 → 门禁不解锁 → 必然重评）+ **放大器**：design 评审豁免 5 轮 cap（`advisor/run.mjs:21-25`，2026-09-07 用户裁定）→ 失败可无限重评。**用户裁定（13:36 批准）**：做——「同一 doc-set 连续 N 次 incomplete 即停并出结论」。机制形态（N 值/计数载体/与豁免 5 轮的关系/双端）待设计。 |
| **G2** | **用户介入提醒（attention 态）** | 评估结论：零覆盖新 feature（全 docs 检索 `任务栏/attention` 零命中；TUI 状态栏现仅模式/耗时/token/上下文利用率/busy）。用户原文（#IKDCVV）：「对于出现需要用户介入的情况进行一个底部任务栏的变色提醒，这样就不用反复切回来」。**用户裁定（13:36 批准立项）**：CLI 状态栏变色 + VSC 面板/状态栏 attention 态。 |

### 已核事实（id=47 免重复）
- G1：判死不签发 `design-token.mjs:76-92`；stale 不签发 `advisor-settle.mjs:198-204`；design 豁免 5 轮 `run.mjs:21-25`（§3.2）；三条用户可见文案（未完成/已变更/Invalid or missing）——「token 过期」字样仅存在于 `cleared N expired design token(s)`（`eng.mjs:61`、`cmd-eng.mjs:72`）→ issue ③ 段系转述失真（TTL 实际 7 天，`design-token.mjs:34`）。
- G2：TUI 状态栏现状 `docs/design/TUI.md:233`；「需要用户介入」的既有信号面（question 卡 / approval 卡 / design token 门 / pendingInput…）待设计清点。

### 待设计裁定
1. G1：N 值与计数载体（会话级/discard 时机）+ 「同 doc-set」判据 + 与豁免 5 轮的关系 + 停止后的产物（结论表？）+ 双端；
2. G2：触发条件清单（哪些形态算「需要用户介入」）+ 双端形态（CLI 状态栏变色——色/闪/文案；VSC 面板/状态栏 attention 态）+ 消除条件（用户看到/介入后复位）；
3. 受影响文件全清单（行数/增量）+ 用例/AC（逐条机验）+ 双端纪律核对；
4. 与既有纪律（§14 评审链 / TUI 状态栏 / VSC 面板）冲突核对。

### 范围边界（明确不做）
- G1 不改签发/作废语义（只加「连续失败即停」护栏）；G2 不做系统级通知（仅应用内可见态）；不改既有状态栏信息面（增量）；不得新建档（必须 → 打回）。

### 状态
**已收口**（用户批准）。下一步 = 设计。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求层 + 设计/测试层已落档，待设计评审——发起权在用户）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；契约逐字 / 用例表 / AC 判据全文在设计档各节，本段只做任务书 + 口径锚）。

**落档位置**：需求 = `requirements/ADVISOR-CONVERGENCE.md` §12（F28 / F29 + N20 / N21）· `requirements/TUI.md` §2 F13 + §3 N9；设计+测试 = `design/ADVISOR-CONVERGENCE.md` §17 全节（契约一~三 / 用例 T-SK1–T-SK10 / AC-SK1–AC-SK6）· `design/TUI.md` §14 全节（契约 a–f / 用例 T-AT1–T-AT8 / AC-AT1–AC-AT6）。

**本批条目（2 条——G1 / G2）与条目回指**（三方一致：本表 = 设计档 AC 回指的条目 = 需求档条目）：

| # | 批次条目 | 需求条目 | 设计档回指（AC） |
|---|---|---|---|
| G1 | 评审失败护栏（同一 doc-set 连续未完成即停） | F28 / F29 + N20 / N21 | `design/ADVISOR-CONVERGENCE.md` §17（AC-SK1–AC-SK6） |
| G2 | 用户介入提醒（attention 态——CLI 面） | F13 + N9 | `design/TUI.md` §14（AC-AT1–AC-AT6） |

**实施域（两组——无文件交集；可同批一 coder 或并行两 spawn，files 逐档声明）**

G1（评审链，4 改 + 2 新）：`src/agent-tools/review-streak.mjs`（新——常量 + `normAbs`/`docSetKey` 迁入 + 记录 API + 纯分类函数）·
`src/advisor/run.mjs`（结论串 + 前缀常量 + 内防线）· `src/agent-tools/advisor.mjs`（工具层预检 + 拒发登记 + 同步面计数）·
`src/agent-tools/advisor-settle.mjs`（`normAbs` 迁出 + settle 三出口计数）· `src/agent-tools/advisor-async.mjs`（`docSetKey` 迁出 + 导入）·
`test/design-review-streak-guard.test.mjs`（新）

G2（TUI，5 改 + 1 新）：`src/tui/render-frame.mjs`（派生 + chip + 底色包裹 + 宽度预算）· `src/tui/ansi.mjs`（`bg` + 色对）· `src/tui/agent-turn.mjs`（链尾谓词 + 置位）· `src/tui/key-handler.mjs`（入口清位）· `src/tui/index.mjs`（state 字段 + 鼠标路径清位）· `test/attention-state.test.mjs`（新）

**口径锚（防漂移——逐字契约以设计档为准）**

- **G1**：N = 3（`MAX_DESIGN_REVIEW_STREAK`）；计数类 = 五 kind（`context_limit`/`turn_cap`/`timeout`/`empty`/`review_failed`）+ `stale` + `no_credential` + `no_report`；
  neutral = `interrupted` / 取消 / 拒发；reset = pass / changes-required；键 = `docSetKey`（迁入复用，空清单不适用）；载体 = `agent._designReviewStreaks`（会话级内存、不落盘）；
  停止 = 硬停 + 结论串（稳定前缀 `Advisor: design review stopped`——逐字表在 §17.4）；拒绝 = 不置 called / 不耗轮次 / **零 LLM**（两检查点：工具层预检 + `runAdvisorReview` 内防线）；分类单源纯函数（两计数点共用）。
- **G2**：触发 = `state.permission` / `state.question` / 回合链尾（`userNeededAtTurnEnd`——skipSession / 挂起两态 / 池 live / 队列非空 / processing 全排除）；色对 = `\x1b[43m\x1b[30m`（黄底黑字——`C.attention`）；chip 三态逐字（`⚠ 等待你的审批` / `⚠ 等待你的回答` / `⚠ 等待你的输入`；blocked > awaiting）；清位 = 键盘入口 + 鼠标输入路径；平态输出**逐字节等价**（负向锁）；**零新定时器**。

**执行纪律**：不改设计档 / 需求档（docs 写权归设计者——实测行数进交付报告，不回写文档）；不 commit；不动 VSC 仓；逐条 AC 机验证据（命令 + 结果）随交付报告；透明表（Done / Simplified / Not done）。

**验收（顶层命令）**：`cd thincoder && node test/run-fast.mjs` 全绿（含既有 advisor 三档 + `input-lock.test.mjs`）；两新档 glob 自动发现（测试数 +2 档）；`node scripts/check-doc-width.mjs` 新增违规 0；受影响文件 ≤ 档位帽（实测对表）；`git status` 判据 = `src/prompts/**` 与 VSC 仓零改动。

**需父侧排程（非本设计者写域 / 非 coder 域）**

1. **VSC 两链**：G2 面（所需档 = `WEBVIEW（VSC 仓）` 新增 attention 节 + `REQUIREMENTS（VSC 仓）` 登记；
   最小改动面 = `chat-panel.mjs` `_setStatus`/`_refreshStatus` + `webview/status-bar.js`/`*.css` + `locales/{en,zh}.json` + `test/files.mjs` 注册——设计档 §14.9 #2）；
   G1 镜像（VSC `agent-tools/advisor-async.mjs` **492 行近帽**——先评估拆分；设计档 §17.9 #1）。
2. `docs/TODO.md` 池行 / #IKDCVV 台账 / CHANGELOG 记账——父侧写域。
3. **D5 核对（开工前）**：本批四档（两需求 + 两设计）写入时点若有他链评审在途（本设计者不可见父侧评审池），本次写入会致其 stale——请父侧点火前核对；他链在途批次档现含 `2026-09-11-PORTABILITY.md` / `2026-09-11-TUI-SELECTION.md` 等（`check-doc-width` 一致性面报告 4 条新增违规在他链档，非本批写域——如实转报）。

**未确认面（open——明示，不静默）**

- VSC 端形态细节（色 / 文案 / 面板可见形态）——由 VSC 端设计裁定（语义同源已锁定：三触发态 + 消除语义）。
- G1「neutral 不打断连续」的语义取舍（设计档 §17.9 #2）与「会话内再武装」不引入（§17.9 #4）——观察后另案（需用户裁定则另走链）。
- 两仓 `check-doc-width`：本批四档新增违规 0（宽度 + V1/V2 均零新增）；残余报告项均在他链档。

### 修正轮（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（🔴 0 · 🟡 1 · 🔵 5——发现表见 §3）。裁决：**6 条全部处理**（🟡1 + 🔵5 落修；#6 = 评审自注「无需动作」，交付链 AC-SK6 / AC-AT6「实测对表」兜底）。本轮 = 修正轮（**只改文档、不碰实现**；行数复核 = 实测声明）。

**发现 → 落点映射（修正轮——落点 file:line as-of 落笔后）**：

| 发现 | 级别 | 处置与落点 |
|---|---|---|
| #1 F13④ 措辞滞后（processing ↔ blocked 字面冲突） | 🟡 | **Fixed**——F13④ 消歧（processing 豁免仅及 awaiting 派生）；T-AT1 补「permission+processing 同真 → blocked」矩阵行锁 · T-AT7 输入行收紧——`docs/requirements/TUI.md` L40 / `docs/design/TUI.md` L1258 · L1264 |
| #2 N9「逐字节等价」操作化口径 | 🔵 | **Fixed**——判定句补机判口径（零 `\x1b[43m` + strip-ANSI 无 chip——与 §14.3 / T-AT2 同口径）；§14.3 负向锁补实现约束 + 同口径；T-AT2 / AC-AT2 同步——`docs/requirements/TUI.md` L54 / `docs/design/TUI.md` L1175 · L1259 · L1275 |
| #3 §17.6 行 5 档位标注 + 行数 | 🔵 | **Fixed**——档位改「>300 advisory（存量 354 → 交付 ~348）」· 行数复核 350 → 354（在途批改动 + 修正轮实测）· §17.9 #1 补 CLI 侧远帽注——`docs/design/ADVISOR-CONVERGENCE.md` L1380 · L1430 |
| #4 §17.9 #5 `_designReviewStreaks` 生命周期 | 🔵 | **Fixed（定案）**——会话级；eng 模式切换**不清**（与 `_advisorRuns` 刻意不同步——F28⑤ + `/new` 唯一会话级复位；实现零动作）· §17.2 / §17.4 / D-SK2 / D-SK6 / §17.8 / T-SK9 / AC-SK2 同步——`docs/design/ADVISOR-CONVERGENCE.md` L1438-1440（另 L1265 · L1305 · L1398 · L1402 · L1422 · L1455 · L1466） |
| #5 T-AT8 置位调用点静态锚 | 🔵 | **Fixed**——T-AT8 补置位接线锚（`agent-turn.mjs` 含 `userNeededAtTurnEnd` 调用 + `attentionAwaiting = true`——D-AT6 纳入机判）；AC-AT6 同步——`docs/design/TUI.md` L1265 · L1279 |
| #6 证据披露（未开实现对源文件） | 🔵 | **No action**——评审自注；交付链 AC-SK6 / AC-AT6「实测对表」兜底 |

**计数（D3——修正轮后）**：用例与 AC **零增删**——T-SK1–T-SK10（10）· AC-SK1–AC-SK6（6）· T-AT1–T-AT8（8）· AC-AT1–AC-AT6（6）仅既有用例内增补（矩阵行 / 静态锚）；本批条目与三方映射（上表）零变。

**行数复核（修正轮实测——口径 `split("\n").length`）**：`src/agent-tools/advisor-async.mjs` 350 → **354**（§17.6 行 5——在途批改动所致 + 复核修正）· `src/tui/key-handler.mjs` 440 → **441**（§14.4 行 4）；其余实施域行与磁盘一致。

**文档域四档（修正轮后读取计行）**：design/ADVISOR-CONVERGENCE **1501** · design/TUI **1344**（含末行 EOL 归一 +1）· requirements/TUI **76** · requirements/ADVISOR-CONVERGENCE 334（未动）。

**D5 提示**：本轮四档写入时若他链评审在途（本设计者不可见评审池）→ stale 风险请父侧按上文 §2 注核对。

**口径锚（原 §2 主体不变）**：G1 / G2 逐字契约与实施域以上文本 + 本轮落修为准（两设计档 = 权威）；lint = `node scripts/check-doc-width.mjs`——本批面宽度新增 0、V1/V2 新增 0（残余均在他链批次档，如实转报）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档一致性（需求⇄设计） | 🟡 | `docs/requirements/TUI.md:41`（F13④）把 `processing` 列入「非触发态」；`docs/design/TUI.md:1243`（§14.6 INPUT-LOCK 行）与 :1152 派生首行（permission/question ⇒ blocked 无条件）表明「processing 中弹审批/提问」仍提醒——该情形的字面表述两处相反。设计侧与 F13 正向触发集一致、自洽；仅与④括注字面不一致——判为措辞滞后，非机制冲突 | 建议父侧文档层对 F13④ 与 §14.6 的表述做一致性收敛（消除字面歧义）；可同时建议 T-AT1/T-AT3 矩阵补「blocked + processing 同真」一行锁住裁决 |
| 2 | 验收强度（负向锁） | 🔵 | `docs/requirements/TUI.md:55`（N9 判定句）要求「attention 为 null 时状态帧与改动前逐字节等价」；设计操作化为「`\x1b[43m` 零出现」（`docs/design/TUI.md:1175`），T-AT2/AC-AT2（:1259/:1275）只断言零序列+strip-ANSI 形态——弱于字面等价 | 可选：为平态负向锁补基线夹具对照，或把 N9 判定句与 T-AT2 的验收口径明确对齐——两选一，父侧文档层定 |
| 3 | 受影响表（档位标注一致性） | 🔵 | `docs/design/ADVISOR-CONVERGENCE.md:1380`（§17.6 行 5）`advisor-async.mjs` 350 行（>300）档位结论只写「交付 ~344 ≤500 ✓」，未沿同批 >300 文件的「>300 advisory」标注先例（对照 `docs/design/TUI.md:1208-1210`）；§17.9 :1428-1430 拆分评估只提 VSC 侧 492 行档 | 统一标注口径即可（补 advisory 标注或注明净减理由）——不影响放行 |
| 4 | 设计完备性（生命周期语义） | 🔵 | `docs/design/ADVISOR-CONVERGENCE.md:1438-1439`（§17.9 #5）把 `_designReviewStreaks` 与 `_advisorRuns` 重置点一致性留给「实施时同点清空或在本节登记（二选一）」——影响可观察语义（eng 模式切换能否在会话内复位护栏），与 `docs/requirements/ADVISOR-CONVERGENCE.md:316`（F28⑤「停止在该会话内不可自解除」）及结论串三选项相交 | 建议点火前在设计侧先定并写明各自语义；若维持二选一，回收选中项进 §17.9 |
| 5 | 验收强度（置位接线） | 🔵 | G2 置位点「顶层链尾」（`docs/design/TUI.md:1177-1186`）无行为用例、无 call-site 静态锚——T-AT6 只测谓词矩阵、T-AT8（:1265）只查零新 setInterval+导出在位；对照 G1 先例 T-SK9（`docs/design/ADVISOR-CONVERGENCE.md:1454`）含消费点静态锚 | 建议 T-AT8 沿 T-SK9 先例补置位调用点静态锚（一行 grep 级），把 D-AT6 接线裁决纳入机判 |
| 6 | 证据范围（披露） | 🔵 | 本评审按声明限读所列节段，未打开实现源文件——§17.6/§14.4 实现域「当前行数/增量」为设计侧实测声明，未在本评审内独立复核；文档域四行与磁盘一致（design/ADVISOR-CONVERGENCE.md 1499 行 · design/TUI.md 1342 行 · requirements/TUI.md 75 行 · requirements/ADVISOR-CONVERGENCE.md 334 行——均与声明落档值吻合） | 无需动作——交付链 AC-SK6/AC-AT6「实测对表」兜底 |

核验计数：🔴 0 · 🟡 1 · 🔵 5。重点核①–⑤逐项核验通过（三选型与口径逐条一致；G2 七面裁决+色对+chip+稳态+置位/消除齐备；受影响 12 项=9 改+3 新、档位无越帽、T-SK1–10/T-AT1–8 与 AC-SK1–6/AC-AT1–6 清单对齐；两档冲突核对节零冲突；三方条目映射一致、D5 冻结提示与 VSC 两链登记在档）。

VERDICT: pass

### 轮次 2（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| — | — | — | 0 发现——6 条处置逐条核对全部落档，无残遗/未落/新增矛盾（#1 F13④ 消歧 `requirements/TUI.md:40` + T-AT1 矩阵行 `design/TUI.md:1258` + T-AT7 收紧 `:1264`；#2 N9 机判口径 `requirements/TUI.md:54` · `design/TUI.md:1175`/`:1259`/`:1275`；#3 档位/行数 `ADVISOR-CONVERGENCE.md:1380`/`:1430`；#4 生命周期定案 `ADVISOR-CONVERGENCE.md:1438-1440` + 7 同步点 `:1265`/`:1305`/`:1398`/`:1402`/`:1422`/`:1455`/`:1466`；#5 置位锚 `design/TUI.md:1265`/`:1279`；#6 无动作——AC-SK6（`ADVISOR-CONVERGENCE.md:1470`）/ AC-AT6（`design/TUI.md:1279`）「实测对表」在位）；自披露数复核一致（advisor-async 354 · key-handler 441 · design/TUI 1344） | — |

发现计数：🔴 0 · 🟡 0 · 🔵 0
VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-12 03:40 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 pass（🟡1 · 🔵5）→ 修正 5 Fixed + 1 No action（F13④ 消歧 + N9 口径 + 档位 + 生命周期定案 + 置位锚）→ **轮次 2 = pass**（6/6 核销 · 0 发现）→ **token 已签发**（值不落档）。

**批准范围**：实施域 12 档（G1 4 改+2 新：`review-streak.mjs`新 · `advisor/run.mjs` · `agent-tools/advisor.mjs` · `advisor-settle.mjs` · `advisor-async.mjs` · 新测档；G2 5 改+1 新：`render-frame.mjs` · `ansi.mjs` · `agent-turn.mjs` · `key-handler.mjs` · `index.mjs` · 新测档）。

**遗留（批准时登记）**：① VSC 两链镜像（G2 状态栏 + G1 镜像——父侧排程）；② commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

### 实施记录（eng-coder 自写——2026-09-11）

**交付摘要**：G1 / G2 两组 12 档全量落地（9 改 + 3 新：G1 = `review-streak.mjs` 新 + `advisor/run.mjs` / `agent-tools/advisor.mjs` / `advisor-settle.mjs` / `advisor-async.mjs` + 新测档；G2 = `render-frame.mjs` / `ansi.mjs` / `agent-turn.mjs` / `key-handler.mjs` / `index.mjs` + 新测档）。

本会话内闭环：实现 → 独立分歧审计（explore 只读）→ 代码评审（advisor 同步 1 轮）→ 收敛交付。
零越界：未改设计档 / 需求档 / `src/prompts/**` / VSC 仓；未 commit、未发起设计评审（父侧面）。

**落地清单（实测行数——口径 `split("\n").length` 含末行；对表 §17.6 / §14.4）**

| 组 | 文件 | 设计 as-of → 预计 | 实测 | 档位 |
|---|---|---|---|---|
| G1 | `src/agent-tools/review-streak.mjs` | 新 → ~95 | 94 | ≤300 ✓ |
| G1 | `src/advisor/run.mjs` | 239 → ~281 | 294 | ≤300 ✓ |
| G1 | `src/agent-tools/advisor.mjs` | 241 → ~261 | 261 | ≤300 ✓ |
| G1 | `src/agent-tools/advisor-settle.mjs` | 212 → ~222 | 232 | ≤300 ✓ |
| G1 | `src/agent-tools/advisor-async.mjs` | 354 → ~348 | 347（净 −7） | >300 advisory（存量先例） |
| G1 | `test/design-review-streak-guard.test.mjs` | 新 → ~230 | 292 | ≤500 ✓ |
| G2 | `src/tui/render-frame.mjs` | 377 → ~409 | 397 | >300 advisory（存量先例） |
| G2 | `src/tui/ansi.mjs` | 49 → ~54 | 51 | ≤300 ✓ |
| G2 | `src/tui/agent-turn.mjs` | 324 → ~336 | 344 | >300 advisory（存量先例） |
| G2 | `src/tui/key-handler.mjs` | 441 → ~446 | 475 | >300 advisory（<500 ✓） |
| G2 | `src/tui/index.mjs` | 450 → ~458 | 455 | >300 advisory（<500 ✓） |
| G2 | `test/attention-state.test.mjs` | 新 → ~200 | 211 | ≤500 ✓ |

口径注记（评审 🔵#2 落实）：工作树含他链未提交改动（排除域），上表 = 当前工作树实测；`key-handler.mjs` 设计 as-of 441 为滞后值（本批开工实测 461，本批增量 +14 = 助手 + 调用点）。
硬帽 500 全部满足；>300 advisory 5 档均属设计侧预先登记项（`docs/design/TUI.md` §14.4 · `docs/design/ADVISOR-CONVERGENCE.md` §17.6）。

**测试实测（先落盘再查）**

- `node test/design-review-streak-guard.test.mjs` → **10/10 pass**（T-SK1–T-SK10）。
- `node test/attention-state.test.mjs` → **8/8 pass**（T-AT1–T-AT8）。
- `node test/run-fast.mjs`（全量，输出落盘后读尾）→ tests 592 · pass 576 · skip 14 · **fail 2**——两条 fail 均在他链在途面、非本批写域（如实转报）：
  ① `doc-consistency` T41：新增违规全部位于他批档 `docs/batches/2026-09-11-{ACP-CHANNEL-FIXES,PORTABILITY,TUI-SELECTION}.md`（本批零 docs 写入）；
  ② `prompts-dual-source` T-CL3：`src/prompts/persona-normal.md` 缺 C8 节（他链在途，本批零 prompts 写入）。
  另 slow 门报告 2 条他链 `hooks-stop` 用例超阈（时序面，非本批文件）。
- 既有 advisor 回归档（`advisor-chain-guards` / `advisor-sync-accounting` / `design-token-settlement` / `advisor-context-budget`）与 `input-lock` 等全绿。

**AC 透明表（Done / Simplified / Not done——逐条机验证据）**

G1（AC-SK1–AC-SK6）

| AC | 状态 | 证据 |
|---|---|---|
| AC-SK1 | Done | T-SK1 绿（矩阵 + 优先级逐条）；`review-streak.mjs` 唯一 import = `node:path`、零 `src/` 导入（T-SK1 静态断言） |
| AC-SK2 | Done | T-SK2–T-SK5 绿；session 落盘面（`session.mjs` / `session-slots.mjs` / `token-ttl.mjs`）`_designReviewStreaks` grep 零命中；`eng.mjs` / `cmd-eng.mjs` 零命中（T-SK9——模式切换不清护栏） |
| AC-SK3 | Done | T-SK7 绿（前缀逐字 + 尝试表 + 三选项 + 零凭证值扫描 + 拒发登记）；T-SK3 log 与表行一致 |
| AC-SK4 | Done | T-SK9 绿（工具层 + 内防线静态锚）；T-SK7 绿（零 chat——无池条目 / 无 async-ack；含内防线行为锁） |
| AC-SK5 | Done | T-SK6 绿（键隔离 + 三类写法变体同键）；T-SK10 绿（`[]` / `null` no-op + 停止恒 false） |
| AC-SK6 | Done（批次面） | 两新档 glob 自动发现（测试档 +2）；实测行数对表（上表）；`check-doc-width.mjs` 本批面新增违规 0（报告残余全部在他链档、如实转报）；`src/prompts/**` 与 VSC 仓本批零改动；run-fast 他链 2 fail 如实转报 |

G2（AC-AT1–AC-AT6）

| AC | 状态 | 证据 |
|---|---|---|
| AC-AT1 | Done | T-AT1（派生矩阵 + permission+processing 同真锁）/ T-AT7（非触发态）绿；纯函数无 I/O |
| AC-AT2 | Done | T-AT2 绿（`\x1b[43m` + chip 逐字 + 宽度 ≤ cols−1 + 平态零序列 / 无 chip 负向锁） |
| AC-AT3 | Done | T-AT3 绿（blocked > awaiting；permission > question） |
| AC-AT4 | Done | T-AT4（键盘：字符 / 方向 / Esc——清位一次 + render）/ T-AT5（鼠标单点 + index 接线锚）绿 |
| AC-AT5 | Done | T-AT6 绿（七条件矩阵：skipSession / suspended / _suspPending / 池 live / 队列 / processing 全排除） |
| AC-AT6 | Done（批次面） | T-AT8 绿（零新 `setInterval`——render-frame 0 / agent-turn 仅既有 ticker；两导出在位；置位接线锚）；run-fast + 行数 + VSC 零改动同 AC-SK6 |

**偏差与简化披露**

- Simplified / Not done：**零**（无静默缩水；设计逐字契约全部落位）。
- 实现细化 ①：鼠标清位点落在 `index.mjs` stdin `data` 处理器**顶部**（解码后、粘贴 / 滚轮 / 点击分支之前）——设计定位「滚轮分支与 `onMouseClick` 调用前」；取顶部 = 覆盖粘贴 + 滚轮 + 点击的单点（语义一致，位置略早）。
- 实现细化 ②：`clearAttention(state, render)` 助手定义在 `key-handler.mjs` 并导出（键盘 / 鼠标两点共用单源），`index.mjs` 只承载调用点——设计钉调用点、未钉助手定义位置。
- 实测差异：`key-handler.mjs` 设计 as-of 441 vs 开工实测 461（在途批所致，本批增量 +14）；`run.mjs` 294（预计 ~281）、`advisor-settle.mjs` 232（预计 ~222）、新测档 292（预计 ~230）——均在帽内。
- 未 commit（父侧）；测试口径 = 快层 `run-fast`（未跑 full 层——本批无 slow 归册用例）。

**独立分歧审计（explore——只读）**

四类偏差（部分实现 / 静默简化 / 文档漂移 / 越清单）**均无**。逐维核验：分类单源、两检查点、两计数点、结论串逐字、生命周期（eng/cmd-eng/session 面零命中）、G2 派生 / 渲染 / 置位清位、八 + 十条用例 1:1。
非偏差观察 3 条：§5 待写（本段即补）· T-AT5 用直驱 + 接线锚替代事件级注入（AC-AT4 判据全断言）· 行数项（本表已披露）。

**代码评审（advisor——子代理内同步 1 轮）**

发现计数：**🔴 0 · 🟡 0 · 🔵 2** → 终态 **clean**（无 fix round：两条 🔵 均为零改动建议——① >300 advisory 档位提示（设计已预先登记，零动作）；② 行数「实测对表」须注明在途批混入——已在上文口径注记落实）。
正面核验摘要：七级优先级逐行同序 · 前缀 / 8 类 kind→meaning / 三选项逐字一致 · 平态负向锁字节级成立（零字节注入）· chip 三态逐字 + 优先级 · 置位在 `suspensionSession` 退出之后（D-AT6）· 清位两点接线锚在位 · 两新档与用例表 1:1、静态锚零悬空。

## §6 验证与收口（父代理自写）

**2026-09-12 06:30 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **10/10 + 8/8** · 快层 592/576/2（两 fail 均他链——doc-consistency + prompts-dual-source）· advisor 回归档 + input-lock 全绿；
- **父侧抽核**：`review-streak.mjs` 93 行 ✓ · 色对（`ansi.bg(3)`=43m + fg(0)）✓ · chip 三文案 ✓ · 置位锚（`userNeededAtTurnEnd`+`attentionAwaiting`）✓ · `clearAttention` 单源 ✓；
- 内部：审计四类零命中 + 代码评审 **🔴0🟡0**（🔵2 零改动）——**零 fix round**。

### 逐条验收结论

- **AC-SK1–6 / AC-AT1–6 全 Done**；**Simplified 零 · Not done 零**；偏差 3 条如实（鼠标清位取顶部单点覆盖三路—语义一致）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 clean ✓ · 计数：12 档实测对表 ✓ · 指针：两设计档 ↔ 用例 18 ✓ · 待办：四项（下）✓

### 遗留项

1. **VSC 两链镜像**（G2 状态栏 + G1 镜像——`advisor-async.mjs` 492 行近帽需先评估拆分）；
2. `docs/TODO.md` 池行 / #IKDCVV 台账 / CHANGELOG（父侧核销同步）；
3. 他链 2 fail 与 slow 门报告（他批收口面）；
4. **设计 token 已消费（链终）**；commit 待父侧随批提交。
