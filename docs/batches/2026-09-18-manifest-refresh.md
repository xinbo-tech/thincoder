# 2026-09-18 · 重估点批（#34 情境行值变重推）

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-18（台账 #34 已核销）

### 1.1 批件（用户 2026-09-18 01:38 裁定「要修」）

| 项 | 实况 |
|---|---|
| #34 | `agent.manifest` 无运行期刷新点 ⇒ **CLI 会话内**改 `PROJECT-MANIFEST.json` 的 `phase`，情境行不更新（直到重启）；VSC 无此问题（`hydrateRun` 每 run 重读——`thincoder-vscode/src/agent/setup.mjs:374-394`） |

**父侧核清（2026-09-18 01:37——实读）**：① 注入器逐回合跑且支持值变换行——`pushManifestStateReminder` 判据序 ①–⑥（`thincoder-core/agent/setup-reminders.mjs:80-106`；`phase` 自 `agent.manifest` 读 `:86`）；② `agent.manifest` 刷新点 = 装配钩子（CLI 装配期 `make-agent.mjs:129` + 启动恢复后重估 `bin/thincoder.mjs:337`——**均属会话起点**）；③ 测试为直接改内存对象（`setup-reminders.test.mjs:93/:103`）⇒ 机制全绿但 CLI 生产面「值变」不可达。

### 1.2 修法（建议方向——最终由设计轮定）

- **mtime 门控重读**：`pushManifestStateReminder` 内、`phase` 构建前：`stat` 项目根的 manifest 档——**mtime 变 ⇒ `readManifest` 重读并更新 `agent.manifest` + 缓存**；未变 ⇒ **零额外 I/O**（同档 `:111` peer 提醒 mtime 缓存模式先例）。
- 效果 = CLI 也真「值变重推」（设计 §2.6 承诺落地）；VSC 面冗余无害（每 run 已重读）。

### 1.3 边界（设计轮不得越）

- **不改**：注入器判据序 ①–⑥ / 幂等与摘行语义（§2.6）/ `write-gate` 读盘面 / VSC 每 run 机制 / 压缩生存（E5.1 #5）/ #41（模式翻转族——另批）。
- **禁触**：`scripts/**` · 冻结批档 · `_archive/**` · 参照树 · 提示词面。

### 1.4 台账

- **#34**（tech_todo · 前置 = 批② 已收口；本条 = 要修落地的载体）。

## §2 批次任务与设计修订（eng-designer）

### 2.1 段位与结论（initial 轮 · eng-designer）

设计落点 = `docs/core/design/MANIFEST.md`（§2.2 / §2.3 / §2.4 / §2.5 / §2.6 / §3.1 / §3.2 / §4——逐处已落）。修法方向（mtime 门控重读）按 §1 裁定保留，**具体语义由设计轮落定**——缓存载体 / 路径解析 / 失败退化 / 压缩生存交互四条各一条句写清（§2.6 条 3 + KD-M1-17 / M1-18 / M1-19）。**判据序 ①–⑥ 逐条零改**；新增 = 取值前置步 **③b**（③ 后、④ 前）。

### 2.2 设计落点（逐处）

| # | 落点 | 内容 |
|---|---|---|
| 1 | §2.6 条 3（新增） | 取值 = mtime 门控重读：`stat` → 门控 → `readManifest` 采纳 / 未变零重读 / 失败保守（不更新 · 不清零 · 不抛） |
| 2 | §2.6 判据表 | +`③b` 行（③ 后、④ 前）——①–⑥ 原位逐字零改 |
| 3 | §2.2 接口 | +`manifestFilePath(cwd)`（档路径**单源**）；读 / 写两处改用（零语义） |
| 4 | §2.2 钩子段 | +「附着决策 = 会话起点（KD-M1-13 零改）· 值刷新 = 每回合门控」两分句 |
| 5 | §2.3 表 | +行 10–12（`thincoder-core/manifest.mjs` 258 / `thincoder-core/agent/setup-reminders.mjs` 160 / `thincoder-core/test/setup-reminders.test.mjs` 136；Δ +~8−4 / +~30−1 / +~65） |
| 6 | §2.4 | +KD-M1-17（值变检测）/ M1-18（路径单源）/ M1-19（缓存载体）——各带被拒备选 |
| 7 | §2.5 | +「与 KDs 的关系（本批）」条（钩子面零改 · ③b 居 ①②③ 之后 ⇒ 三态零 I/O） |
| 8 | §3.1 / §3.2 | +AC-N7 / AC-N7b / AC-N7c / AC-N7d；+T32–T36 |
| 9 | §4 | 变更记录一条 |

### 2.3 实施面（eng-coder——token 门不变）

| # | 文件 | 动作 | Δ |
|---|---|---|---|
| 1 | `thincoder-core/manifest.mjs` | +导出 `manifestFilePath(cwd)`（= `join(writeRoot(cwd), MANIFEST_REL)`）；`readManifest` / `writeManifest` 两处同式改用（零语义） | +~8 / −4 |
| 2 | `thincoder-core/agent/setup-reminders.mjs` | +模块私有 `refreshManifest(agent)`（③b：路径 → `statSync` 门控 → `readManifest` 采纳 / 失败保守）；`pushManifestStateReminder` 判据③ 之后、行构造之前一行调用；模块头注一行 | +~30 / −1 |
| 3 | `thincoder-core/test/setup-reminders.test.mjs` | +T32–T36（五例——临时项目根夹具 + `utimesSync` 确定性推进 mtime）；既有用例组零改 | +~65 |

**相对 §1.2「实施面 = `setup-reminders.mjs` 一处」的扩充（明账）**：+`manifest.mjs` **一行导出**——理由 = 档路径判据单源（KD-M1-18；拒「注入器内重写根解析式」= 判据双源，与 2026-09-17 基数缺陷同族）。除该一行外零扩面；VSC 侧零改（同源核函数自动获此行为）。

**禁触**：判据序 ①–⑥ 的判据 / 动作 / 顺序 · 幂等与摘行语义 · `write-gate` 读盘面 · VSC 每 run 机制 · `scripts/**` · 数据档 `PROJECT-MANIFEST.json` · 提示词面 · 冻结批档 / `_archive/**` / 参照树。

### 2.4 验收（本批）

| # | 判据 | 回指 |
|---|---|---|
| A1 | **先红**：T32 实施前实跑**必红**（现态：会话内改档 ⇒ 行不更新），读数原样入 §5 | AC-N7 |
| A2 | T32–T36 全绿 + 既有注入面用例（AC-N1–N6 · T8–T14）**零改**全绿 | AC-N7–AC-N7d |
| A3 | 核全链测试全绿（`thincoder-core` `npm test`） | — |
| A4 | 机检零新增：`node scripts/doc-check.mjs` 悬空 / 行宽读数相对基线**不增** | — |

**读数（设计轮实测 · as-of 2026-09-18 01:5x）**：改动前 = 悬空 **449** · 行宽 **2**（`.thincoder/tmp/refresh-baseline.log`）；改动后 = 悬空 **449** · 行宽 **2** · 候选 17110 · 注记豁免 61 · 拟新增 3（`.thincoder/tmp/refresh-after2.log`）⇒ **悬空 / 行宽零新增**（逐行 diff：新增 0 · 移除 0）。报告面（符号·宽）MANIFEST.md 1 → 14 行——新增 13 行均为**本批新符号**（`manifestFilePath` / `_manifestMtime` / `refreshManifest`）在代码落地前不入 codeIds——**非闸**，实施后自消（`collectCodeTokens` 全树走）。

### 2.5 报告格式（§5）

`处 → 改动 file:line` + T32 先红读数（原样）+ 全绿命令与读数 + 实施面实际 Δ + 机检复跑（含报告面自消核对）+ 未决项。

### 2.6 需父侧 / 主 agent 处置（不在本子代理写权内）

| # | 项 | 归属 |
|---|---|---|
| 1 | `SPEC-MANIFEST.md` ④ AC-M1-6 判据枚举补 AC-N7 / AC-N7b / AC-N7c / AC-N7d（现枚举 = 「AC-N1–AC-N6、AC-N3b」）——设计侧已在 §2.6 末标注「需求侧待同步」 | 主 agent（需求档写权） |
| 2 | 派单 brief 的「§9 变更记录」在本档结构中实为 **§4 变更记录**（本档无 §9）——已落 §4；编号口径如需统一请明示 | 主 agent |
| 3 | 「CLI 会话内改档 ⇒ 下回合行更新」的**子进程端到端**用例（T31 式）本批**未列入**——机判面 = 核单测 T32（真实档 + 真实 cwd）；是否加端到端层，归父侧定 | 父侧 / 主 agent |

### 2.7 设计评审轮 1（pass）裁定落地（fix 轮 · eng-designer · 2026-09-18）

**裁定**（父侧——评审轮 1 VERDICT = pass，🔴0 · 🟡4 · 🔵2）：**#2 / #3 / #5 / #6 逐条接受**（处置执行人 = eng-designer，本轮已逐条落设计档）；**#4 = 不加**子进程端到端用例——机判面维持核单测 T32–T36（真实数据档 + 真实 cwd，值变重推机制面真覆盖），「CLI 会话内改档 ⇒ 下回合行更新」的逐回合接线（`thincoder-core/agent/run-stages.mjs:115-118`）为**既有已交付行为**，不另设端到端层（后续若实证需要，另批开）。

**本轮落点**（`docs/core/design/MANIFEST.md`——逐号）：
- **#2** → §2.3 行 11：行构造改取刷新后的值（`:83` 局部捕获 `const manifest = agent.manifest` 删除 = Δ「−1」落点、判据③ 改读 `agent.manifest`）+ 两条新 import 列出（`node:fs` `statSync` · `../manifest.mjs` `manifestFilePath, readManifest`）。
- **#3** → §2.5 新增「运行期失败退化 vs 启动门槛」条 + §2.6 条 3 失败退化 bullet 补口径 + KD-M1-17 补被拒备选 ④（清零被拒）+ AC-N7c 口径指针（启动门槛判「能不能进循环」/ 注入面判「这一回合出什么行」两分）。
- **#5** → §2.6 条 3 成本句 + §2.5 同载收正：每回合一次路径解析（≥1 次 `existsSync`；无 `.git` 时 `readdirSync` + 逐子目录 `existsSync`）+ 一次 `statSync`。
- **#6** → §2.3 行 10 Δ 收正「+~6 / −2（净 ~+4）」+ 表下句按档列增量后行数（≈262 · ~189 · ~201）。

**零新语义 / 零新范围**：③b 语义 · KD-M1-17/18/19 结论 · AC / 用例结论零改（只补口径与措辞）；零碰代码 / `scripts/**` / 冻结批档 / `_archive/**` / 参照树 / 需求档（§1.3 禁触面全守）。

**机检复跑**（`node scripts/doc-check.mjs`，2026-09-18 02:1x 实跑）：候选 17325 · 悬空 451 · 行宽 2——**本档在闸面零命中**（`MANIFEST.md` 无一 ✗ 行，全部为其报告面行）；相对本批基线（`.thincoder/tmp/refresh-after2.log`：候选 17110 · 悬空 449 · 行宽 2）的悬空 +2 经逐行集合比对 = 15 增 / 13 减，**全部落在在飞他批的档**（`CORE-UNIFICATION.md` / `CONTEXT-COMPACTION.md` / `DOC-DISCIPLINE.md` / `WEBVIEW-PROTOCOL.md`——多为行号漂移）⇒ 本档零新增；行宽 2 = 基线原样（`docs/core/design/prompts/persona-engineering.md:137` / `:139`，非本档）。

**需求侧（主 agent 域——不变）**：#3 的口径句（运行期失败退化 vs 启动门槛）随 `SPEC-MANIFEST.md` ④ AC-M1-6 判据枚举补登（AC-N7–AC-N7d）时一并联入——§2.6 #1 条维持，仍待主 agent。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**目标**：重估点批（#34）设计轮 1 核验——③b 取值前置步（mtime 门控重读）· KD-M1-17/18/19 · AC-N7–N7d + T32–T36 · 受影响表行 10–12 · 批档 §2 任务书。
**核验摘要**：批档 §2.2 九处落点逐处在设计落档 ✅；机制可落——`writeRoot` 单源（`thincoder/thincoder-core/manifest.mjs:96-98`）、读写两处同式（`:198`/`:201`、`:241`/`:246`）、判据 ①–③ 前置三态零 I/O（`thincoder/thincoder-core/agent/setup-reminders.mjs:81-84`）、逐回合接线既有（`thincoder/thincoder-core/agent/run-stages.mjs:117`）；既有注入面用例夹具无 `cwd`（`thincoder/thincoder-core/test/setup-reminders.test.mjs:67-68`）⇒ ③b 跳过 ⇒ 零回归；行 10–12 当前行数逐档实测一致（258 / 160 / 136）。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 需求 / 档态 | 🟡 | `thincoder/docs/core/requirements/ENGINEERING-MODE-V2-SPEC-MANIFEST.md:36`（AC-M1-6）判据枚举仍 = 「AC-N1–AC-N6、AC-N3b」，未含本批 AC-N7–AC-N7d；设计已在 `thincoder/docs/core/design/MANIFEST.md:228` / `:374` 自标「需求侧待同步」，批档 §2.6 #1 登记为待同步项（父侧 trigger 称「需求档同步…补登 AC-N7 系列」与盘面不符——R7a / R7e：报告不改） | AC-M1-6 枚举补 AC-N7 / N7b / N7c / N7d（同载 ③b 门控语义与失败退化口径），设计侧「待同步」注随之撤销 |
| 2 | 清晰度 | 🟡 | 行 11 编辑点「判据③ 之后、行构造之前一行调用」（`MANIFEST.md:127`）未写明取值消费改点：现档行构造取 ③ 的局部捕获 `const manifest = agent.manifest`（`thincoder/thincoder-core/agent/setup-reminders.mjs:83` → `:86`），照字面插入后行仍取旧值（T32 才暴露）；同处未列新增 `node:fs` `statSync` 与 `../manifest.mjs` 两条 import（现档 import 仅三条 `:25-27`） | 明写「行构造改取 `agent.manifest.phase`（`:83` 局部捕获删除或改读）」+ 列出两条 import + 注明 Δ「−1」落点 |
| 3 | 需求 / 语义 | 🟡 | 运行期失败退化（档删 / 读回非法 ⇒ 沿用陈旧值、不拒、不清零——`MANIFEST.md:213` · AC-N7c `:305` · T35/T36 `:364-365`）与 AC-M1-2（`SPEC-MANIFEST.md:32`）/ KD-M1-2（`MANIFEST.md:142`）「整档缺失 → 拒进正常循环、绝不静默 fallback」的边界无一句口径（启动门槛 vs 运行期注入面两分）；KD-M1-17（`:157`）未记「缺失 ⇒ 清零」被拒备选 | §2.5 / §2.6 补一句限定（本步失败只降级注入面；`readManifest` 返回语义与 E2 启动门槛零改），随 AC-M1-6 枚举一并联入需求档；KD-M1-17 补一条被拒备选 |
| 4 | 验收（协调项） | 🟡 | AC-N7 机判面止于核单测 T32–T36（真实档 + 真实 cwd，`:361-365`）；「CLI 会话内改档 ⇒ 下回合行更新」子进程端到端未列——批档 §2.6 #3 已登记为待定项（R5 协调项，非缺陷） | 若要全链覆盖，加 T31 式一例（伪 HOME + mock 端点 + 会话内改档）；不加亦可（逐回合接线 `run-stages.mjs:117` 为既有已交付行为） |
| 5 | 受影响表数值 | 🔵 | 成本句「唯一新增开销 = 每回合一次 `statSync`」（`MANIFEST.md:212`）不完整：`manifestFilePath` → 写根解析至少再花一次 `existsSync(.git)`（`manifest.mjs:44`），无 `.git` 时含 `readdirSync` + 逐子目录 `existsSync`（`:46-50`） | 措辞改「一次根解析（≥1 stat）+ 一次 `statSync`」；行为不变 |
| 6 | 受影响表数值 | 🔵 | 行 10 Δ「+~8 / −4」（`MANIFEST.md:126`）与净改动 ≈−2 有微差（`:198`/`:201`、`:241`/`:246` 两处各减一行）；表下「含本轮增量最高约 200」（`:134`）若读作增量后最高行数，与 manifest.mjs ≈262 不符 | 括注改 ≈−2 / 按档列 262 · ~189 · ~201（或写明「增量最高档 ≈200」） |

**计数**：🔴 0 · 🟡 4 · 🔵 2
**VERDICT: pass**
**出批面（无严重度，不入本批判定）**：§2.3 表头称全表 as-of 2026-09-18 01:5x 实测，但行 1 `make-agent.mjs` 197 与现档 224 行不符（#30 已实施——行 1–9 数为其实施前读数；行 10–12 三个当前行数实测一致 ✅）。

## §4 用户批准（主 agent）

**2026-09-18 01:38 用户裁定「要修」= 本批批准**（修法方向 = mtime 门控重读）；设计评审轮 1 = PASS（🔴0 / 🟡4 / 🔵2）——四条修项 + 一条裁定已全部落位（父侧逐处核验 ✓）；需求档已同步（`SPEC-MANIFEST.md` ④ AC-M1-6 枚举补 AC-N7–N7d）⇒ 实施轮派发（eng-coder · initial）。

## §5 实施记录（eng-coder）

**状态**：实施 → 内部差异审计（`clean`）→ 内部代码评审（`pass`，无 must-fix）→ 收敛交付；三包全量绿；待父侧 §6 收口。
**档面**：本段外零写设计档 / 需求档 / 批档（唯一写入 = 本段）；数据档 `PROJECT-MANIFEST.json` 未触碰。

### 5.1 改动清单（处 → 改动 file:line）

| # | 处 | 改动 |
|---|---|---|
| 1 | `thincoder-core/manifest.mjs:101-110` | 新增导出 `manifestFilePath(cwd)` = `join(writeRoot(cwd), MANIFEST_REL)`（档路径**单源**——KD-M1-18）；`:15` 模块头契约表 +1 行 |
| 2 | `thincoder-core/manifest.mjs:209` / `:212` | `readManifest` 改用：删 `const root = writeRoot(cwd)`，读行改传 `manifestFilePath(cwd)`（**零语义**） |
| 3 | `thincoder-core/manifest.mjs:252` / `:256` | `writeManifest` 改用：删 `const root = …`，写行同式（**零语义**；`writeRoot` 保留——唯一消费者 = `manifestFilePath`） |
| 4 | `thincoder-core/agent/setup-reminders.mjs:74-103` | 模块私有 `refreshManifest(agent)`：③b 取值前置步（`manifestFilePath(agent.cwd)` → `statSync` 门控 → `readManifest` 采纳 / 失败保守——不更新 · 不清零 · 不抛 · 缓存不推进） |
| 5 | `thincoder-core/agent/setup-reminders.mjs:118-121` | 判据③ 改读 `agent.manifest`（原 `:83` 局部捕获删除）+ `:119` 一行调用 ③b + `:121` 行构造改取 `agent.manifest.phase`（**①–⑥ 判据序零改**） |
| 6 | `thincoder-core/agent/setup-reminders.mjs:27` / `:31` | 两条 import（`node:fs` `statSync` · `../manifest.mjs` `manifestFilePath, readManifest`）；`:20-21` 模块头注 +2 行；`:107` / `:111` JSDoc 收正 |
| 7 | `thincoder-core/test/setup-reminders.test.mjs:141-243` | 新增 T32–T36（五例 + 夹具：临时项目根 `.git` / 真数据档 / `utimesSync` 定死 mtime）；`:12-14` 三条 import；`:7-8` 文件头注。**既有用例组（AC-N1–AC-N6）零改** |

### 5.2 T32 先红读数（实施前 · 原样）

命令 = `node --test test/setup-reminders.test.mjs`（cwd = `thincoder-core`）；留档 = `.thincoder/tmp/refresh-t32-red.log`。

```text
✖ AC-N7/T32 值变重推（盘面驱动）：会话内盘上 phase 变（mtime 推进）→ 下回合行 = 新值 (3.6064ms)
✖ AC-N7d/T33 首次观测对齐：缓存未设（首回合 / 会话恢复后）⇒ 读一次对齐盘面值 (2.1076ms)
✖ AC-N7b/T34 未变零重读：mtime 未推进（内容变 + mtime 复位）⇒ false 且行不变 (2.0001ms)
✖ AC-N7c/T35 失败退化（stat 失败）：档被删 ⇒ 不抛、不更新、不清零；行不变 (1.838ms)
✖ AC-N7c/T36 读回非法 ⇒ 保守（缓存不推进）；修好 ⇒ 自愈（同 mtime 仍重试采纳） (4.9961ms)
ℹ tests 16 · ℹ pass 11 · ℹ fail 5
```

T32 失败为**正因**（`false !== true`——值变未重推，断言落 `test:187`）；T34 失败点 = `_manifestMtime` 未设（前置断言——同时证明缓存面此前不存在）。既有 11 例先红前即全绿 ⇒ 新五例为唯一红面。

### 5.3 全绿命令与读数（修复后）

| 命令（cwd） | 读数 | 留档 |
|---|---|---|
| `node --test test/setup-reminders.test.mjs`（`thincoder-core`） | tests 16 · pass **16** · fail 0 | `.thincoder/tmp/refresh-t32-green2.log` |
| `npm test`（`thincoder-core`） | tests 304 · pass **304** · fail 0 | `.thincoder/tmp/refresh-core-full.log` |
| `npm test`（`thincoder-cli`） | tests 628 · pass **628** · fail 0 | `.thincoder/tmp/refresh-cli-full.log` |
| `npm test`（`thincoder-vscode`） | tests 593 · pass **593** · fail 0 | `.thincoder/tmp/refresh-vsc-full.log` |

### 5.4 实施面实际 Δ（`git diff --numstat` 实读）

| 文件 | 设计预测（§2.3 行 10–12 / 表下句） | 实测（+ / − → 行数） | 差 |
|---|---|---|---|
| `thincoder-core/manifest.mjs` | 258 → ≈262（+~6 / −2，净 ~+4） | **+14 / −4 → 268** | 净 +10（超差全在注释块：契约表 1 行 + 导出 JSDoc 7 行） |
| `thincoder-core/agent/setup-reminders.mjs` | 160 → ≈189（+~30 / −1） | **+40 / −5 → 195** | 净 +35（超差全在 JSDoc / 模块头注 / 行内注释） |
| `thincoder-core/test/setup-reminders.test.mjs` | 136 → ≈201（+~65） | **+107 / −1 → 242** | 净 +106（超差在夹具 + 逐例断言消息） |

三档均在 300 软线内 ⇒ **无拆分面**；**行为面零超差**（超差全在注释与夹具文本）。

### 5.5 机检复跑（含报告面自消核对）

命令 = `node scripts/doc-check.mjs`（仓根）；留档 = `.thincoder/tmp/refresh-doccheck-after.log`（基线 `.thincoder/tmp/refresh-after2.log`）。

- 读数：**候选 17329 · 悬空 452 · 行宽 2**（基线 = 17110 · 449 · 2）。
- **逐行归因**（✗ 集合比对，键 = `file:line 符号`）：新增 **16** / 移除 **13**；16 条新增**零条**落在本批三档或 `MANIFEST.md` / 本批档——全在在飞他批的档（`CONTEXT-COMPACTION.md` · `CORE-UNIFICATION.md` · `DOC-DISCIPLINE.md` · `WEBVIEW-PROTOCOL.md` · `docs/core/requirements/CONTEXT-COMPACTION.md`，多为行号漂移）⇒ **本批零新增**。
- 行宽：2 行（`docs/core/design/prompts/persona-engineering.md:137` / `:139`）——与基线**逐条相同**（新增 0 / 移除 0）。
- **报告面自消核对**：`MANIFEST.md` 报告面行 **14 → 5**——消失的 13 行 = `manifestFilePath` / `_manifestMtime` / `refreshManifest`（设计 §2.4 预判「实施后自消」⇒ **已自消**）；余 5 行 = `resolveEngineeringManifest` / `manifestInit`（#41 / #30 他批符号，非本批）。

### 5.6 内部审计与代码评审（收敛链）

- **差异审计（explore·只读 · 轮 1）**：`clean`——四类偏差（PARTIAL / SILENT-SIMPLIFICATION / DOC-DRIFT / OUT-OF-LIST）**全无**。核验面：判据序 ①–⑥ 零改 · ③b 位置正确（③ 后、行构造前）· 行构造确取刷新值 · 路径真单源 · T32–T36 ↔ AC-N7–N7d 逐条对上 · 无设计外多出项 · 三态零 I/O 顺序正确。四条非偏差观察中 1 条归我修 = 测试档死导入 `statSync`（**已删**，`:12`），另 3 条 = 行数超预测（§5.4）· T36 更强输入（§5.7 #1）· 本段当时为空（本段即其落定）。
- **代码评审（advisor · 轮 1）**：`pass`（🔴0 · 🟡1 · 🔵2——🟡 为 R7a 报告面、明确非 must-fix）⇒ **无 must-fix，不触发 fix round 2**。评审亦独立复核先红读数与 T32–T36 ↔ AC 对位。fix round 计 **1**（仅死导入卫生项），终态 = `clean`。

### 5.7 未决项（交父侧）

| # | 项 | 归属 |
|---|---|---|
| 1 | T36 自愈步输入 = **同一 mtime**（`T0+1000`）而非设计 §3.2 字面「mtime 再推进」——**更强**变体：同 mtime 下仍须重读采纳方能过（若失败时推进了缓存，该断言必红）⇒ 顺手证死「缓存不推进」；语义 = 设计意图超集，**零简化**（审计已判非偏离） | 已记（透明披露） |
| 2 | 设计档 `MANIFEST.md:233` / `:235`（§2.6 末）仍写「需求侧待同步（AC-M1-6 枚举需补 AC-N7–N7d）」，但需求档 `SPEC-MANIFEST.md:36` 已实载「2026-09-18 #34 批补：值变检测 = mtime 门控重读（③b）——AC-N7 / N7b / N7c / N7d 在册」⇒ 该活体注陈旧（同档 `:169` 已有「需求侧已同步」撤销先例）。**coder 零写设计档** | 父侧 / eng-designer |
| 3 | §5.4 三档行数超设计预测（测试档 +41）——设计/批档预测行待下次触碰收正（非闸，无拆分面） | 父侧（小改自办） |
| 4 | 禁触面全守（零触碰）：`scripts/**` · 冻结批档 · `_archive/**` · 参照树 · 提示词面 · write-gate 读盘面 · VSC 端代码 · `PROJECT-MANIFEST.json` | 已核 |

## §6 验证与收口（父代理）

### 6.1 父侧核验（2026-09-18 02:24——实跑 + 实读，非转录）

- **实跑**：`node --test test/setup-reminders.test.mjs` ⇒ **16/16**（父侧复跑）；coder 轮读数链：先红 T32–T36 全 ✖（`pass 11 / fail 5`，留档 `.thincoder/tmp/refresh-t32-red.log`）→ 修复 → core **304/304** · cli **628/628** · vsc **593/593**。
- **实读**：`setup-reminders.mjs:74-103`（`refreshManifest` 逐句对齐设计 §2.6 条 3：mtime 门控 / 未变零重读 / 失败保守不推进 / 无锚跳过 / 不抛）+ `:119` 调用点（③ 之后、行构造 `:121` 之前）+ 行构造确取刷新值（局部捕获已删）✓；`manifest.mjs:101-110` 新导出 + 两处同式改用 ✓。
- **机检**：复跑 452（±3 = 他批在途漂移，逐行集差分 ✓）；本批三档零命中；报告面 **14 → 5 行**（自消 ✓）。
- **写域**：三代码档 + 批档 §5；禁触面零触碰 ✓。
- **链**：内审 explore 1 轮（clean）+ fix 1（死导入）· advisor 代码评审 1 轮 = **pass**（🟡1 转父侧 · 🔵2）。

### 6.2 交付面与父侧处置

- 设计档 §2.6「需求侧待同步」活体注陈旧（coder 上报 §5.7 #2——需求档侧父侧已于 02:0x 落）+ 三档行数超预测（§5.7 #3）→ **父侧收正**（待 `MANIFEST.md` 解冻——id=52 评审窗内）。
- T36 输入强于设计字面（同一 mtime 证死「失败不推进缓存」）→ 已披露；裁定 = **接受**（语义超集、零简化）。

### 6.3 收口

- 提交 = **9cd92cc3**（4 档；+376/−10）；台账 **#34 → 已核销**；凭证槽 consume。
