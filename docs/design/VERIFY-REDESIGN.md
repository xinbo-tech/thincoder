# Verify 重构：通用验证门禁

> 板块：agent-tools（verify 工具）。权威源指向：TOOLS.md §1（元工具）/ §7（verify 契约，testNamePattern）+ 本文档（verify 重构设计）。
> 状态：**相 1（verify 工具本体）已实现；相 2（guard/prompt/双端一致收口）已实现交付**——2026-09-07 用户裁定。相 1 经同步评审签发 + 双 eng-coder 交付 clean；相 2 代码面 2026-09-08 落地（STRUCTURE-DEBT-BATCH-7 收尾——代码实证见下注）。
> DOC-SWEEP 注（2026-09-09 核验——相 2 代码面全落）：G1-G4 guard 文案双端逐字（CLI completion.mjs:81/94/109 + VSC run-stages.mjs:55/68/82——declaring the outcome via verification.status）；G5-G9 prompts 声明式语义（双端 eng-coder/engineering-sub/system/discipline/main）；G10 doc-only+failed 打回（verify 描述）；
> G11 rejectionReport 补 node --check 软提示（VSC verify.mjs:165/269）；G12 VSC guard hasCodeMutations（run-stages.mjs:50）；G13 VSC goal.mjs 门禁（:34 注释自标）；G14 状态面已闭环——**T-V8..V11 全量验收（test:full 双端）待父侧核后正式核销**。
> 背景注：async advisor 评审 token 跨会话注册 bug（designId not found）尚未修复，用户指示本轮走**同步评审**（async:false）。

## 1. 问题陈述

verify.mjs 当前把**项目特定逻辑硬编码进通用工具**：
1. `MODULE_TO_TEST` —— src 模块 → 测试文件硬编码映射（thincoder 仓私有结构，任何其他项目无意义）；
2. "改动无测试则 `_verifyPassed=false` 强制拦 done" —— 强制每改动配测试，与"测试不强制、按需加"理念冲突；
3. `npm test` / node --check 自动执行 —— 锁死 JS/npm 生态。

后果：verify 只适用于特定 JS 项目；测试文件一变映射即悬空（已实证——本仓测试清理后 verify 映射全指不存在文件）；通用 agent 面对非 JS/无测试项目逻辑失效或误拦。

> 需求层已迁出（2026-09-10 需求层拆分批）：本板块需求见 `../requirements/VERIFY-REDESIGN.md`——本档保留设计+测试层。

## 3. 设计

- **D-V1 交互形态**：模型调用 verify 时**声明验证状态**，收参数 `verification: { status: "passed" | "failed" | "skipped", command?, summary? }`。verify 不执行该 command——它是模型的自述证据。
- **D-V2 判定门**：
  - `passed` → 放行（结合语法结果）；
  - `failed` → 打回（`_verifyPassed=false`，不能声明 done）；
  - `skipped` → 放行但校验 `summary` 有跳过理由（不能空跳过——防假装跑过）。
- **D-V3 打回引导**：打回消息对"该做什么验证"有要求——列出改动的源文件 + 引导"参考项目 AGENTS.md 声明的验证方式决定补什么验证"，不空泛说"没验证"。
- **D-V4 删除**：删 `MODULE_TO_TEST`、`moduleName` 的项目映射、related-tests 自动发现/执行段、`npm test` 自动跑、"无测试拦 done"。verify 不再知道"哪个测试覆盖哪个模块"。
- **D-V5 保留**：doc-only 快路径（文档改动跳过语法/测试）、**可选语法提示**（仅改动为 .js/.mjs 且 node 存在时 node --check 软提示——不进门禁）、task/checklist、git diff 报告。**例外（评审 #6）**：doc-only 快路径不吞显式 failed——模型显式声明 verification.failed 时仍打回（见 D-V11 G10 / T-V8）。
- **D-V6 双端**：CLI + VS Code verify 语义一致（同输入同判定）；测试纪律靠 METHODOLOGY/AGENTS.md 自然语言指导模型，不进 verify 代码。
- **D-V7 参数清理（评审 #4）**：删除 `full`/`testNamePattern`/`filter` 参数及其拒绝分支（无测试自动跑后语义消亡）；保留 `workdir`（定位项目根/doc-only 判定）。新增 `verification` 参数（D-V1）。
- **D-V8 受影响文件（评审 #2/#3 补——双端）**：
  - CLI `src/agent-tools/verify.mjs`（删 MODULE_TO_TEST/related-tests/参数清理/verification 接入）
  - CLI `src/agent-tools/verify-watch.mjs`（runTestFile/runTestSuite 若不被 verify 再用则删——实现时核实去留）
  - VS Code `src/agent-tools/verify.mjs` 及 verify 相关（镜像同构）
  - 两端工具 description/schema（verify 参数改 verification）
  - `docs/design/TOOLS.md` §7 verify 契约行更新（当前写 testNamePattern——评审 #3）
  - 测试：按需加 verify 自身用例（T-V 系——CLI test/ 与 VS Code test/ 各补一）

### 相 2 缺口收口设计（2026-09-07 · explore 审计——guard 强制端/提示词引导/双端一致）

工具本体重构后，explore 审计确认整条 verify 机制另三面未跟上（相 1 只改了工具本体）。补下列设计，收口相 2：

- **D-V9 guard 强制端文案（G1-G4）**：verify guard（CLI completion.mjs:81/92/107；VS Code run-stages.mjs:55/68/82）仍写"call verify to run syntax checks and tests" / "verify reported test failures"——但新 verify 不跑测试只收模型声明。改写为声明式引导。**六站点逐点定稿文案（评审 #2——双端逐字同）**：
  - 首个闸（CLI:81 / VS Code:55）："Before finishing: run the project's verification yourself (per its AGENTS.md test method), then call verify declaring the outcome via verification.status. verify mechanically gates on your declaration."
  - 失败重试（CLI:92 / VS Code:68）："verify was not passed — either your verification declared failed, was skipped without a reason, or was not declared. Fix or complete your verification, then call verify again declaring the outcome."
  - 耗尽诚实声明（CLI:107 / VS Code:82）："You have not passed verification. Either state explicitly that your verification could not be completed, or run verify again once it is."
  三句皆不称"test failures"/"tests failing"（`_verifyPassed=false` ≠ 测试失败，可能是 failed/skipped 无理由/未声明）。
- **D-V10 提示词同步（G5-G9）**：两端 src/prompts/ 5 文件仍写 verify 跑测试旧语义——eng-coder.md:7 / engineering-sub.md:7（最大：L0/L1/L2 分级建在旧 verify 自动跑测试上）/ system.md:42 / discipline.md:61-62（tool 表）/ main.md:32。改写为声明式语义。（2026-09-10 迁移注：上述 5 文件已退役——宿主映射 = persona-eng-coder.md + discipline-normal.md，T-V10 断言已随施工③更新。）
  **engineering-sub.md 新分级语义注（评审 #3）**：测试执行职责从 verify 挪回模型——L0 = 模型对改动做即时验证（语法/冒烟）+ 经 verify 声明 passed 或 skipped+理由；L1 = 模型自跑项目快测试（npm test 快层）；L2 = 模型自跑全量（full suite）。verify 三层都只收声明（declares passed/skipped），不代跑。模型从项目 AGENTS.md 读该项目的测试方法决定跑哪层。
- **D-V11 双端一致修正（G10-G13，违反 D-V6/T-V7）**：
  - G10 doc-only/空改动 + 显式 failed：CLI 无条件放行 vs VS Code 打回——统一为尊重显式 failed 打回（VS Code 行为为对，改 CLI）；
  - G11 VS Code rejectionReport 打回分支补 node --check 语法提示（对齐 CLI）；
  - G12 VS Code guard 触发补 `hasCodeMutations` 层（doc-only 不再被推回，对齐 CLI）；
  - G13 VS Code goal.mjs 补 verify 门禁（对齐 CLI goal.mjs:53）。
- **G14 归属注**：G14 = explore 报告的设计文档状态项。状态行（本文件 :4）已从"待评审"更新为"相 1 已实现、相 2 设计中"——G14 状态面已闭环；其受影响文件面由相 2 D-V9..V11 覆盖。

## 4. 测试

| # | 场景 | 输入 | 预期 |
|---|---|---|---|
| T-V1 | 声明 passed | verification:{status:passed} | 放行（语法过则通过） |
| T-V2 | 声明 failed | verification:{status:failed} | 打回，`_verifyPassed=false` |
| T-V3 | 声明 skipped + 理由 | verification:{status:skipped,summary:"项目无自动化测试"} | 放行 |
| T-V4 | 声明 skipped 无理由 | verification:{status:skipped} | 打回（空跳过不允许） |
| T-V5 | doc-only 改动 | 只改 .md | 快路径跳过 |
| T-V6 | 打回消息含引导 | failed/skipped | 消息含改动文件 + 引 AGENTS.md 验证方式 |
| T-V7（双端一致，评审 #5） | 同输入双端同输出 | verification 各态在 CLI + VS Code 同参数 | 双端输出一致（通过/打回同判定） |
| T-V8（相 2：doc-only+failed，G10） | 只改 .md + 显式 failed | doc-only 改动 + verification:{status:failed} | 打回（双端同） |
| T-V9（相 2：guard 文案，G1-G4） | guard 推回文案 | guard pushback 触发 | 文案含"declaring the outcome"（定稿实际子串——评审 #6）非"run syntax checks and tests" |
| T-V10（相 2：prompt 语义，G5-G9） | prompt 无旧 verify 语义 | grep prompts 无"verify runs/related tests" | 干净 |
| T-V11（相 2：goal 门禁，G13） | VS Code goal mutated 未 verify | goal complete + 改动未 verify | 拦截（对齐 CLI） |

## 5. 验收

AC1 = T-V1..V11 全绿（test:full）；AC2 = verify.mjs 不含 `MODULE_TO_TEST`/模块映射/**任何语言特定强制/进门禁执行**（可选 node --check 软提示除外——评审 #4）；AC3 = 双端一致（T-V7/T-V8 行为断言）；AC4 = lint/语法过；AC5（相 2）= guard 文案 + prompts 无旧 verify 语义（T-V9/T-V10）。

测试文件已清空——按"按需加"理念补 verify 自身的 few 用例（T-V 系，相 1 已建 T-V1..V6b；相 2 补 T-V8..V11）。

## 变更记录

- 2026-09-07：立项（用户裁定 verify 改造走工程模式——通用 agent 不 hardcode 项目测试逻辑——需求澄清三轮：①定位=通用门禁；②项目 AGENTS.md 自然语言声明验证方式；③机械检查判定，模型自决执行）。设计落本文档。
- 2026-09-07 相 1：设计同步评审签发 + 双 eng-coder（CLI+VS Code）交付 clean——工具本体重构 + T-V1..V6b。
- 2026-09-07 相 2：explore 审计确认 verify 机制整链另三面未跟上（guard 强制端文案/提示词引导/双端一致 G1-G14），设计收口相 2 缺口（D-V9..V11 + T-V8..V11）。
- 2026-09-08：前身吸收——`VERIFY-DOCONLY.md`（doc-only 快路径专题，2026-08-03 实现记录）并入本档后归档 `_archive/`：其独有信息 = isDocFile 三处判定统一历史（verify 入口/guard/dispatch 门禁同判据——纯文档改动跳过语法与测试、`_verifyPassed=true`、代码改动行为不变）——doc-only 机制已由本档 D-V5 保留段/T-V5 用例接管。
