# 批次档 · VSC 端文档迁移（VSC-DOC-MIGRATION）· 2026-09-15 起

> **建档 ✓：2026-09-15 00:44**（父代理 §1 ✓）。**独立成档的理由** ✗：① 主题独立（VSC 端 ✓ —— 与 CLI 端批次 `2026-09-14-doc-migration.md` **分档** ✓）② 用户 00:37 诊断「**批次档用得太狠 ⇒ 注意力下降**」✓ ⇒ **一主题一档** ✗（生命周期原则 ✓ 已挂需求：需求池「批次档生命周期」条 ✓）。
> **执行的裁定** ✗：**21:41**「VSC 必须**文档先行**」✓（代码面未许可前一行不动 ✓）· **21:37**「已取代旧档就地留参照、不上迁」✓ · **23:02**「**明显应该是 B**」✓（留原地 + 根层所缺内容补写 ✓）· **21:47** 三部分规划 `docs/core/design/DOC-SYSTEM.md`（判据 P1–P5 ✓ · `docs/vsc/` = VSC 部分 ✓）。

## §1 批次任务（主 agent · 父代理）

**目标** ✗：把 `thincoder-vscode/docs/{design,requirements}/**` 里的**活档**内容迁进基准层 `docs/vsc/` ∥ `docs/core/` ✓；**历史档就地留参照** ✓。

**本批（第 1 批）** ✗：VSC 文档**实点 + 二分表 + 当场迁第一批活档（≤6 档）** ✓ —— **规划与迁移同轮**（禁纯统计空转 ✓ 用户 00:26/00:42 双重口径 ✓）。

**硬要求** ✗（今晚实证的教训 ✓）：**凡新建目录（如 `docs/vsc/`）⇒ 同批必须把该目录加进两扫描器的射程** ✓（`scripts/check-doc-width-core.mjs` 的 `SCAN_DIRS` ✓ · `scripts/doc-anchors-v5.mjs` 的 `V5_SCAN_DIRS` ✓）；`scripts/**` = **工程工具面**（用户 00:18 规程 ✓）⇒ 可直接改 ✓ **但改完必须实跑报读数** ✓。

**纪律** ✗：三机检绿（锚域一悬空 **0** · 宽度 **0 新增** · 台账 **0**）+ 单笔可 revert + 逐批报用户 ✓；**`thincoder-vscode/**` 一字不改** ✗（只读参照 ✓）。

## §2 批次任务（eng-designer）

（待本批写入 ✓）

**本批任务（B 式迁移轮 · VSC 第 1 批）** ✗：VSC 端文档**实点 + 二分表 + 当场迁第一批活档** ✓（规划与迁移同轮 ✓）。规划结论落 = `docs/vsc/design/VSC-MIGRATION.md`（设计）+ `docs/vsc/requirements/VSC-MIGRATION.md`（需求，同名成对 ✓）。

**范围内（本批覆盖的需求）** ✗：需求档 F-M1（实点 + 二分 + 小计闭合）· F-M2（依据列 + 待核单列）· F-M3（当场迁 ≥1 档活档）· F-M4（落点档不含批次材料）· F-M5（坐标改写为现状路径并实核）· F-M6（新建目录同批入射程 + 实跑报读数）。

**本批实迁（3 档源档 · 旧档一字未改）** ✗：

| # | 源档（`thincoder-vscode/**`，未改） | 行数 | 落点（基准层活档） | 行数 |
|---|---|---|---|---|
| 1 | `docs/design/SETTINGS.md` | 178 | `docs/vsc/design/SETTINGS.md` | 128 |
| 2 | `docs/design/PROJECT-SWITCHER.md` | 75 | `docs/vsc/design/PROJECT-SWITCHER.md` | 97 |
| 3 | `docs/requirements/WEBVIEW.md` | 71 | `docs/vsc/requirements/WEBVIEW.md` | 91 |

**受影响文件（R24a · 实核行数）** ✗：新增 5 档（`docs/vsc/design/{VSC-MIGRATION,SETTINGS,PROJECT-SWITCHER}.md` 329/128/97 + `docs/vsc/requirements/{VSC-MIGRATION,WEBVIEW}.md` 46/91）；实修 2 常量（`scripts/check-doc-width-core.mjs` `SCAN_DIRS` · `scripts/doc-anchors-v5.mjs` `V5_SCAN_DIRS`——各加 `docs/vsc/design` + `docs/vsc/requirements`）；本批次档 §2 append 1 处。

**明列批外（本批零写入）** ✗：① 统一面 64 档（P1 → `docs/core/**`）——父侧 2026-09-15 收紧写域（与并行 CLI 批同文件竞争）⇒ 列 `VSC-MIGRATION.md` §8 **待父侧另批**（串行）；② 待核 3 条（VSC-PROMPTS 设计/需求 + `design/prompts/` 15 档）——`VSC-MIGRATION.md` §7 给两种读法 + 依据，**零裁定**；③ `WEBVIEW（VSC 侧）` 1867 行——超 500 硬限**必拆**，归**批 2**（拆分规划已在 §6 给出）；④ 历史档 14 档（就地留）· `_archive/` 17 · `prompts/` 15 · 批次档 34（批次档不迁）。

**验收标准（逐条回指需求 · 机器可验）** ✗：A-VM1 实点/二分闭合（84 = 33+3+1+13 / 31+1+1+1）✓ · A-VM2 84 行依据列非空 + 待核含两读法 ✓ · A-VM3 落点档在位 + `thincoder-vscode/**` 零改 ✓ · A-VM4 落点档无状态行/流水 + 含「不并项与历史沿革」✓ · A-VM5 坐标按现状实核（本批发现源档漂移 2 处：`setup.mjs` `:232`→`:237`、`shell.mjs` `:233`→`:229`——已按现状改写并上报）✓ · A-VM6 锚根域悬空 0 + 射程含新目录 ✓ · A-VM7 宽度无 >300 + 无 >500 档 ✓ · A-VM8 `git status` ⊆ 声明写域 ✓。

**三闸读数（改后 · 实跑）** ✗：`doc-anchors` 根域 61 档（改前 56）· **悬空 0** · exit 0；`check-doc-width` 337 档（改前 332）· 无 >300 单行 · 一致性新增违规 0 · exit 0；`check-ledger` 0 处违规 · exit 0。

## §3 评审发现（评审子代理）

_（待写）_

## §4 父侧核验与裁决（主 agent）

_（待写）_

## §5 实施记录（eng-coder）

_（待写）_

## §6 收口与核销（父代理）

_（待写）_
