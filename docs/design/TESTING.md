# 测试基建（TESTING）

> 板块：测试基建——本端测试生命周期与集成集落地面（新建 2026-09-11——测试生命周期与集成集批；与 CLI 仓同名档对应，语义同源·各端原文自持）。
> 机制语义（三层来源 ①②③ / 处置判据 / 演进评估 / 收编 / 发布门）以 CLI 侧测试基建设计档为准（跨仓指针（CLI 侧）——本端不重述；文件 = `thincoder/docs/design/TESTING.md`）。
> 本端档承载：本端执行面（目录/清单/runner/门禁）、首批场景本端实例、验收、受影响文件与纪律核对。
> 既有基建（快/全两层 + slow 门 + 显式清单）为与 CLI 同源移植（`run-fast.mjs` / `run-full.mjs` / `slow.mjs` 头注"TESTING.md §1 D-T1/D-T6——2026-09-06 移植 CLI 同名机制"）；架构登记见本端 `ARCHITECTURE.md`（测试域与验证层行）。
> 状态：**已实施**（测试生命周期与集成集——集成集 + 发布门三环已接线；执行结果见 §6 表）。

## 1. 本端现状（承前）

| 层 | 入口 | 目标集合 |
|---|---|---|
| 快层 | `npm test` → `test/run-fast.mjs`（slow 跳过 + 慢门防漏） | `test/files.mjs` 显式清单 |
| 全量 | `npm run test:full` → `test/run-full.mjs` | 同清单（slow 全放行） |
| 单文件调试 | `node --test test/xxx.test.mjs` | 直达（不经门） |

- **显式清单纪律**（本端特有）：新增测试档在 `test/files.mjs` 登记——**不登记不跑**（显式清单为单一来源；CLI 为 glob 自动发现——端差异按本端原文处理）。
- 本批前零集成集：一切执行面 = 上述两层。

## 2. 测试生命周期（本端落地）

- 机制语义与判据 = CLI 侧测试基建设计档 §3（跨仓指针（CLI 侧）——本端不重述）。
- 本端落地面：
  - ① 单元 = `test/*.test.mjs`（顶层各档——`test/files.mjs` 登记）；
  - ②③ 集成 = `test/integration/`（本端清单见 §3）；
  - 批次 §6 处置行的 ①半 票据 = 批次档 §2/§5 + 本端 `test/files.mjs` **登记差分**（每批新增档即处置对象）。

## 3. 集成集：承载与执行（本端契约）

| 项 | 本端契约 |
|---|---|
| 目录 | `test/integration/`（寿命分界：`test/` 顶层 = ① 单元域；`integration/` 子目录 = ②③ 常驻域——本端同构 CLI 侧选型） |
| 目标集合 | 显式清单 `test/integration/files.mjs`（**登记即跑**——沿本端显式清单纪律） |
| 入口 | `test/run-integration.mjs`（npm script `test:integration`）——启动器形态沿 `run-full.mjs`（shell:false 直传清单；命名 .mjs 非 .test.mjs） |
| env 门 | 无（执行面 = 入口本身）；集成档**不得**用 `slow()`（无快层执行面） |
| 发布门接线 | `vscode:prepublish` = `npm run lint && npm run test:full && npm run test:integration` |
| 不变量 | `npm test` / `test:full` 目标集合零变（清单天然排除集成档）；单文件调试 `node --test test/integration/x.test.mjs` 直达不经门 |
| 登记制边界 | `test/files.mjs`（单元清单）零含集成档；两清单互不混入（新增集成档只登集成清单） |

## 4. 首批集成场景（本端实例）

- 场景目录（①–⑦ + 种子 S1/S2）与三态判据 = CLI 侧测试基建设计档 §5（共享语义源（CLI 侧））。
- 本端驱动面（按本端既有测试工艺——与 CLI 端不同，语义对齐、手段各自）：

| 场景 | 本端驱动面 |
|---|---|
| ① 普通模式完整工具流 | 扩展侧 agent 循环直驱（vscode-mock + 本端 provider 缝） |
| ② 工程模式全链 | 本端 token 结算面 + 本端 spawn 门（两路）直驱 |
| ③ 子代理生命周期 | 本端调度器 / 异步池直驱（种子 S1 落此） |
| ④ 会话恢复 | 本端槽位文件 + 恢复呈现面（首窗 / 配对） |
| ⑤ TUI / 面板基本盘 | webview DOM 直驱（happy-dom——面板 / 活动面；种子 S2 落此） |
| ⑥ commit / 验证关口 | 本端 git 工具面 + verify 镜像面（**commit 镜像缺口在案（TODO）——本场景不覆盖缺口修复**） |
| ⑦ 配置装载与选路 | 本端配置装载 + 软失败面（`config-softfail` 先例） |

- 种子 S1/S2（生产反馈收编）：业务语气场景件；既有单测档不因收编移除（寿命按扫①口径，本批清单内零动）。

## 5. 验收标准（本端——回指）

| AC | 标准（机验） | 回指 |
|---|---|---|
| AC-VT1 | `npm run test:integration` 退出码 0（七场景 + 种子全绿） | 发布门 |
| AC-VT2 | `test/integration/files.mjs` 与实档一一对应（漏登记档不被执行——反证） | 清单制 |
| AC-VT3 | `npm test` / `test:full` 集合零混入（清单断言）；集成档零 `slow(`（grep） | 不变量 |
| AC-VT4 | `package.json` `vscode:prepublish` 串含 `test:integration`（串断言） | 发布门 |
| AC-VT5 | 普通模式场景档在场 + 三态用例齐全 | 必选 |
| AC-VT6 | `docs/design/README.md` 登记行在位 | 登记 |
| AC-VT7 | `node scripts/check-doc-width.mjs` 新增超宽 0 + 新增一致性违规 0；快层全绿 | 批级 |

## 6. 受影响文件（本端——as-of 2026-09-11）

| 文件 | 现状（行数） | 增量（执行结果 as-of 落地） | 说明 |
|---|---|---|---|
| `docs/design/TESTING.md` | 新 | 97（实测 as-of 实施轮：96 新建落定 + 1 变更记录行） | 本档（已落 + 实施轮变更记录） |
| `docs/design/README.md` | 123 | +2（本批登记行 + 变更记录——**实测 125 as-of 本批**；文件另含他批在飞增量） | 登记行 + 变更记录（已落） |
| `test/run-integration.mjs` | 新 | 60（实测——含启动前清单自检四项） | 集成集入口 |
| `test/integration/files.mjs` | 新 | 18（实测） | 集成清单（登记即跑） |
| `test/integration/*.test.mjs` | 新 | 7 场景档共 1024 行（实测）+ 共享夹具 `helpers/mock-llm.mjs` 86 行；28 用例 | 本端实例 + 种子（S1 落 ③档 / S2 落 ⑤档） |
| `package.json` | 129 | +1（实测——`test:integration` 行；prepublish 串为行内改写） | `test:integration` + prepublish 串 |
| `test/settings-panel.test.mjs` → `test/config-pool.test.mjs` | 86 / 121 | **已执行**：源档删、断言全并入（8+5=13 用例全保留）；并后 `config-pool` 实测 193 行（差额 = 头部/import/env 装配去重） | 合并（父侧裁定 = 接受；分节标注「面板显示面」） |
| 削段点名档 | `turn-across-segments` · `verify-redesign` · `eng-designer-role` · `index-perception` · `activity-flow` ↔ `async-visibility` | **已执行**（清单见批次档 §5）：T8 删/T11 裁 · T-V9 删/T-V10 裁 · T58 改挂行为面 · T-I9 裁 · never-born 补桩删（承载方 async-visibility）；index-perception 另拆 git 慢档组 | 删除清单制 |
| `AGENTS.md` | 122 | +3（实测——测试全量行 + 集成集行 + 发布门行；实档 125） | Testing 段 |
| `docs/design/RELEASE.md` | 200 | +2（实测——发布门三环表述 + 变更记录） | 发布门表述 |
| 提示词 D7 枚举（双源两文件） | — | 行内改写 | 同步面（主 agent 内容权 + eng-coder 落笔；冻结窗口排程） |

## 7. 与既有纪律核对

| # | 项 | 结论 |
|---|---|---|
| 1 | 显式清单纪律 | 兼容（两清单分域——§3 登记制边界行） |
| 2 | slow 门 | 兼容（集成档禁 `slow()`——执行面独立，不靠 skip 机制） |
| 3 | 发布门单轮制（R7——`RELEASE.md`） | 扩为三环（lint → test:full → test:integration）；full 保留兜底（理由同 CLI 侧设计档 §9 第 1 条） |
| 4 | 跨仓引用与 V1（本端独有语义） | 本档对 CLI 侧引用以「（CLI 侧）」注记形态（豁免规则沿 `docs/design/README.md` 镜像差异表先例） |

## 8. 散文锚退役——本端执行面（PROSE-ANCHOR-RETIRE——2026-09-12）

> 机制语义（判据三条 / 口径裁定 C1–C5 / **判据补充 C1-a–d** / 归类三值 / 保留面 / 决策记录）以测试基建设计（CLI 仓）§11 为准（跨仓指针（CLI 侧）——本端不重述）。
> 需求依据 = **本仓 `docs/requirements/TESTING.md`**（F15–F22 / N10–N12——本端自持；与 CLI 侧同标识条目语义同源、各端原文自持）。
> 双端纪律：语义同源、各端独立执行、不做 byte-identical、不加跨端同步依赖（F20）。

### 8.1 本端逐条删除清单（VSC 仓）

> 键控 = `档 + 用例起始行`（行号 as-of 2026-09-12；执行轮以「档 + 用例名」定位，行号漂移不阻断——D4）。
> `整删` = 删该用例全部（用例总数 −1）；`段删` = 只删列出的断言行（用例总数不变，行为断言保留）。
> 清单外断言零触碰（N12）；档内未被点名的用例一律保留。判据 / 口径裁定 C1–C5 + **判据补充 C1-a–d** = CLI 侧设计档 §11.1。

| 档 | 用例行 | 用例名（截断） | 归类 | 删除行号 | 依据 |
|---|---|---|---|---|---|
| activity-closure | 147 | T-CL6 全归档后区空（`:empty` 规则在位） | 段删 | 154-155 | 读 `webview/base.css` 常量 match |
| activity-closure | 282 | T-CL19 turn / 计时刷新 | 段删 | 298-300 | 读 `webview/panels.js` 正则在场/缺席 |
| activity-flow | 85 | T-R1 区出生（AC-CL1） | 段删 | 103-108 | 读 `webview/index.html` indexOf 序 |
| activity-flow | 183 | T-R7 区显隐（`:empty` 规则） | 段删 | 188-189 | 读 `webview/base.css` 常量 match |
| activity-flow | 196 | T-R9 150 消息裁 + 归档块入窗 | 段删 | 216-221 | 读 `history.js` / `ui.js` 源 grep + 计数 |
| activity-flow | 224 | T-R10 区自滚 | 段删 | 247-251 | 读 `base.css` + 三条样式 match |
| activity-live-ux | 134 | T-LU5 CSS 高度（契约静态） | 整删 | 134-143 | 全为 `webview/chat.css` 文本在场断言 |
| advisor-chain-guards | 214 | T-VG6 code 守卫……旧锚正则零残留 | 段删 | 225-227 | 读 `advisor-async.mjs` includes |
| advisor-chain-guards | 251 | T-VG8 压缩定锚（pinned 三锚） | 段删 | 277-286 | 读 `run.mjs` / `loop.mjs` 切片 grep |
| advisor-chain-guards | 320 | T-VG11 失败原因三分 | 段删 | 339-340 | 读 citations 源正则缺席 |
| advisor-context-budget | 151 | T-CB6 静态锚：旧 OOM 注释与常量零残留 | 整删 | 151-158 | 全为 src 源文本在场 / 缺席断言 |
| advisor-context-budget | 75 | T-CB1 纯函数 advisorContextBudget | 段删 | 88-94 | 读 readSrc + split 派生 import 表比对 |
| advisor-guard-completion | 55 | T-VG16 启动断言 | 段删 | 71-74 | 读 run / advisor-async grep |
| advisor-guard-completion | 135 | T-VG19 冻结拦截（集成） | 段删 | 178-180 | 读 tool-gates 调用点 / 文案 grep |
| advisor-guard-completion | 183 | T-VG20 点火回执冻结句 | 段删 | 195-198 | 读 advisor-async 实现锚 grep |
| advisor-refusal-accounting | 230 | AC-MA6-3 静态：builder 导出 + 旧内联零残留 | 整删 | 230-238 | 全为三档 src 源文本 grep |
| async-visibility | 399 | AC-A6/A7 机检：REMOVE 面零复活 + 登记 + 调用点 | 段删 | 400-407 | 读六档源 includes |
| batch-doc-gate | 105 | T54 边界：校验逻辑单份 | 整删 | 105-115 | 全为三档 src grep + 计数 |
| batch-doc-gate | 173 | T54 边界：schema 含 batchDoc 属性 | 段删 | 175-176 | 读 `src/setup.mjs` 正则在场 |
| child-permission | 494 | T-CP17 R2 措辞锚（四处逐字在位） | 整删 | 494-516 | 全为 `docs/design/*.md` 文本在场 / 缺席 |
| child-permission | 520 | T-CP18 结构：execute-tools ≤500、tool-gates 五函数 | 段删 | 527-530 | 函数名 src grep + 旧定义零残留 |
| context-parity | 363 | T-CI-11 双端对照：CLI 序锚字面在源 | 段删 | 367-384 | 读 `../thincoder` 源 + indexOf 序 |
| digest-visibility | 78 | T-D6 digest cap 发射 + 两调用点机检 | 段删 | 86-88 | 读 `panel-chat.mjs` 调用点计数 |
| digest-visibility | 192 | T-D8 接线机检 | 段删 | 194-197 | 读 `webview` CSS 常量子串 |
| doc-consistency | 185 | T-MA8-2 主流程零内联 width 扫描 + 规则 6 子串 | 段删 | 192-194 | 读 `docs/design/README.md` 子串 |
| eng-designer-role | 118 | T57 边界：场景表（不静默回退）+ 人格槽位 + 纪律槽 | 段删 | 121 · 123 | 装配产物 `assemblePrompt(...).prompt` 的常量全文比对与槽句在场——PA-A1（C1-a）；槽表 / 长度 / warnings 断言保留（119 · 122 · 125-128） |
| index-perception | 244 | T-I9 词表锁（七词表） | 段删 | 249-253 | 读 `src/indexer.mjs` 字面量集比对 |
| ledger | 194 | T105 VSC 提示词双源两锚在位 | 整删 | 194-201 | 双源提示词 includes / 反向 |
| ledger | 182 | 接线机检：四处挂载 + 样式族 | 段删 | 184-191 | 读 `src/` `webview/` 源码文本 |
| portability-vsc-advisor-context | 46 | T-V07 正常（注入）：指南 + 文档地图注入在场 | 整删 | 46-65 | 装配器出口（`buildAdvisorUserMessage` 返回值）提示词句子断言——PA-A1（C1-a） |
| portability-vsc-advisor-context | 69 | T-V08 边界（缺料）：三条降级句在场 | 整删 | 69-84 | 同上（注入正文 + 降级句 + 旧指令句缺席——均为提示词句子） |
| portability-vsc-advisor-context | 88 | T-V09 正常（声明）：声明路径注入优先 | 整删 | 88-100 | 同上（声明注入正文 + 降级句缺席） |
| portability-vsc-advisor-context | 104 | T-V10 正常（非 git）：NO_GIT_NOTICE 在场 | 整删 | 104-113 | 同上（降级句在场 + 评审内容行） |
| portability-vsc-advisor-context | 166 | AC-V11 拆分兑现（导出面 + 旧内联零残留） | 段删 | 168-173 · 178-179 | 读 src 源码常量子串 |
| portability-vsc-classification | 183 | AC-V01 静态面：src 全仓判据副本零残留 | 整删 | 183-204 | src 源码 regex / includes 在场·缺席 |
| portability-vsc-index | 167 | T-V17 提示词：六档通用化句在场 + 旧句零命中 | 整删 | 167-214 | 六档提示词逐字 includes / 反向 |
| portability-vsc-index | 216 | T-V18 R24 对齐：双源 R24 行同文 | 整删 | 216-224 | 双源提示词 R24 字面串在场 / 缺席 |
| prompts-async-guidance | 54 | A1 勘察 checklist 引句 + 子条驻留 | 整删 | 54-59 | de.includes 常量句 / 子条 |
| prompts-async-guidance | 61 | A2 方案对比逐字驻留 | 整删 | 61-65 | de.includes ×3 |
| prompts-async-guidance | 67 | A3 评审前预检引句 + 子条驻留 | 整删 | 67-72 | de.includes（循环 69 子条表） |
| prompts-async-guidance | 74 | A4 实践沉淀逐字驻留 | 整删 | 74-77 | de.includes ×2 |
| prompts-async-guidance | 82 | 锚#1 零裁量句驻留 | 整删 | 82-86 | de.includes ×3 |
| prompts-async-guidance | 88 | 锚#2 需求池三句驻留 | 整删 | 88-92 | de.includes ×3 |
| prompts-async-guidance | 94 | 锚#3 docs FIRST + 锚#5 链终消费 + 异步锚 | 整删 | 94-99 | de.includes ×4 |
| prompts-async-guidance | 101 | 锚#4 拍板 ≠ 设计批准 + 指针句驻留 | 整删 | 101-106 | de.includes ×4 |
| prompts-async-guidance | 108 | 锚#6 凭证不落文档驻留 | 整删 | 108-111 | de.includes ×2 |
| prompts-async-guidance | 113 | 锚#7 调度器句驻留 | 整删 | 113-118 | de.includes（含 SQ_LITERAL 表） |
| prompts-async-guidance | 123 | C1 推进档位顶层规则驻留 | 整删 | 123-128 | pe.includes ×3 + indexOf 序 |
| prompts-async-guidance | 130 | C2 step4 尾句驻留（MACHINE SIGNAL） | 整删 | 130-133 | de.includes ×2 |
| prompts-async-guidance | 135 | C3 分派表 User stop 条驻留 | 整删 | 135-138 | de.includes ×2 |
| prompts-async-guidance | 140 | C4 normal 档位语义段 | 整删 | 140-144 | de.includes ×3 |
| prompts-async-guidance | 149 | ASYNC-RESIDUE R1 escalation 段无同步引导 | 整删 | 149-152 | dn doesNotMatch / includes |
| prompts-async-guidance | 154 | ASYNC-RESIDUE R2 重复句合一 | 整删 | 154-157 | 同上 |
| prompts-async-guidance | 159 | ASYNC-RESIDUE R4 advisor.mjs 机制限定句 | 整删 | 159-162 | src 源码子串 |
| prompts-async-guidance | 164 | ASYNC-RESIDUE F-2/F-3 工程侧 async 段同基 | 整删 | 164-168 | de includes / doesNotMatch |
| prompts-async-guidance | 170 | ASYNC-RESIDUE R6 路由面随迁 common | 整删 | 170-174 | common / dn 源码文本 |
| prompts-async-guidance | 176 | F-1 ESCALATE.md async:false 残留句零 + 锚句驻留 | 整删 | 176-181 | 读 `ESCALATE.md` 文本 |
| prompts-async-guidance | 183 | F-2 WEBVIEW.md 输入锁旧句零残留 | 整删 | 183-187 | 读 `WEBVIEW.md` 文本 |
| prompts-async-guidance | 189 | §7.5 subagent-spec 描述 Async spawn 锚句双句驻留 | 整删 | 189-196 | src 工具描述文本 match / doesNotMatch |
| prompts-async-guidance | 198 | §7.5 subagent-spec 描述 escalate 段 + async 参数 | 整删 | 198-202 | 同上 |
| prompts-async-guidance | 204 | §7.7.1 advisor 描述无 async:false 顶层同步引导 | 整删 | 204-207 | 同上 |
| prompts-async-guidance | 218 | advisor AC1 单值 VERDICT 裁决行指令 | 整删 | 218-223 | TIERS 循环 f.includes（219-222） |
| prompts-async-guidance | 225 | advisor AC2 裁决后禁续 | 整删 | 225-233 | 提示词档 includes ×5 |
| prompts-async-guidance | 235 | advisor AC7 双轨消除——旧 pass 定义不复发 | 整删 | 235-241 | 提示词档 doesNotMatch ×5 |
| prompts-async-guidance | 246 | 搜索条款宿主迁移：3 字面驻留 common + de/dn 零命中 | 整删 | 246-257 | CLAUSES 循环 includes / 反向 |
| prompts-async-guidance | 275 | §3.2 装配矩阵：输出=槽序拼接 + 层序内部锚 | 段删 | 277-281 | 装配产物 prompt 的句子位序断言——PA-A1（C1-a）；warnings 结构断言保留（283） |
| prompts-async-guidance | 287 | §3.2 装配矩阵：角色场景人格差异 + 常量导出面 | 段删 | 290-291 | 装配产物含人格档句子 / 自指句缺席（PA-A1；289 孤立常量随清理）；常量非空保留（293-294） |
| prompts-async-guidance | 298 | §3.2 consult 场景：返回 CONSULT_BASE 自含基底 | 段删 | 300 | 装配产物全文与字面常量相等——PA-A1（C1-a）；warnings 断言保留（301） |
| prompts-async-guidance | 309 | §3.4 降级链①：槽文件缺失→空缺+警告 | 段删 | 320-322 | 装配产物 prompt 的槽句在场 / 缺席（PA-A1）；warnings 诊断串断言保留（317-319） |
| prompts-async-guidance | 329 | §3.4 降级链②：common.md 缺失→同款警告 | 段删 | 338-339 | 同上（PA-A1）；warnings 诊断串断言保留（336-337） |
| prompts-async-guidance | 362 | §3.4 降级链④：基底缺失→不可用报错 | 整删 | 362-366 | 读 `setup.mjs` 源码 assert.match ×2 |
| prompts-async-guidance | 430 | T-RO1 链行节点双源均在位 | 整删 | 430-433 | PE_PAIR includes + indexOf 序 |
| prompts-async-guidance | 435 | T-RO2/T-RO3 Action 四值 + 计数词同改 | 整删 | 435-442 | DE_PAIR/DN_PAIR includes + indexOf |
| prompts-async-guidance | 444 | T-RO4 时序 bullet 双源逐字全文 + 位序 | 整删 | 444-451 | ROPE_BULLET 字面串 + indexOf |
| prompts-async-guidance | 474 | T-PC-1 语料修复（修一）：两缺节 + 4 压平标题独占行 | 整删 | 474-500 | dn.includes（含 DN_RESTORED_HEADINGS 表） |
| prompts-async-guidance | 502 | T-PC-2 语料修复（修一边界）：编辑点结果行 ≤300 字符 | 整删 | 502-522 | 读 dn 文本按键定位 + 计数（C3） |
| prompts-async-guidance | 524 | T-PC-3 语料修复（修二）：E-2 三子句 + E-3 cancel 行迁入 de | 整删 | 524-534 | de / pe includes ×7 |
| prompts-async-guidance | 346 | §3.4 降级链③：AGENTS.md 缺失=静默跳过 | 段删 | 353-355 | 读 `src/agent/setup.mjs`（356-359 为结构表） |
| prompts-async-guidance | 392 | §2.7 #5 前 20% 巡检词 | 段删 | 398 | 读 pe 断言关键词正则（399 长度守卫留） |
| prompts-async-guidance | 453 | T-RO5/T-RO6 旧三值句 / 旧相邻形态零残留 | 段删 | 454-457 | 读档散文负向（458 扫测试内常量） |
| prompts-mirror-anchors | 108 | A1–A8/A11/A12 文本类锚（VSC ↔ CLI 逐字） | 整删 | 108-118 | ANCHORS 循环双仓 includes |
| prompts-mirror-anchors | 120 | A8 工具描述文案跨仓 grep | 整删 | 120-136 | CONTRACT 循环双仓 includes |
| prompts-mirror-anchors | 147 | ③ 端特有段进镜像且被断言 | 整删 | 147-159 | 三镜像档 includes ×8 |
| prompts-mirror-anchors | 213 | ⑥ 同文组跨仓逐字（组 1 / 组 2） | 整删 | 213-227 | GROUPS 循环双仓 includes |
| prompts-mirror-anchors | 262 | ⑦ common 11 标题组 + 关键句组跨仓逐字 | 整删 | 262-275 | GROUPS 循环双仓 includes |
| prompts-mirror-anchors | 277 | A12/T65 主 agent 人格改述 | 整删 | 277-285 | 双源档 includes / 反向 ×6 |
| prompts-mirror-anchors | 295 | ⑧ 角色重定义锚（本端四端面） | 整删 | 295-320 | 双源档 includes / 反向 |
| prompts-mirror-anchors | 350 | ⑨-1 de 双源测试纪律新节 + 台账块 | 整删 | 350-358 | TD_DE + TD_CNT 循环双仓 includes |
| prompts-mirror-anchors | 360 | ⑨-2 dn 双源新句 + 旧句零残留 | 整删 | 360-372 | TD_DN_* / TD_C_* 循环 |
| prompts-mirror-anchors | 374 | ⑨-3 pe 双源归属句 | 段删 | 375-379 | 读档 includes（380-381 扫测试内常量） |
| setup-reminders | 270 | hydrateRun：permission 句退役 + AUTO 唯一推送点 | 段删 | 279 · 281 · 285 | 读 src 文本 / 常量文案子串 |
| status-line | 72 | T-CL21a-2 发射点机检（五项逐项在位） | 整删 | 72-87 | 全为 src 源码子串 / 调用点计数 |
| status-line | 89 | T-CL21a-3 host 面机判 | 段删 | 97-98 | 读 `subagent-run.mjs` 正则在场 |
| status-line | 169 | T-CL24 端差登记（悬浮回底钮在位） | 段删 | 177-179 | 读 `webview` js / index.html 子串 |
| tool-descriptions | 40 | T-TD-1 描述 = DESC 读出（与 .md 全文相等） | 整删 | 40-50 | 读 `src/tools/*.md` 全文等 + 子串 |
| tool-descriptions | 77 | T-TD-4 打包面：`.vscodeignore` 无 `*.md` 排除 | 整删 | 77-85 | 读仓根 `.vscodeignore` 文本 |
| tool-descriptions | 52 | T-TD-2 read.md 含 Routing 段与指向句 | 段删 | 54-59 | 读 `src/tools/read.md` 子串 / 正则 |
| tool-descriptions | 62 | T-TD-3 内联描述块零残留 | 段删 | 66-72 | 读 `src/tools/*.mjs` 行文本 |
| turn-across-segments | 191 | T11 种子锚：escalate-async 续跑支种子传参驻留 | 段删 | 194-195 | 读 src 子串在场 + 出现计数（C3） |
| verify-redesign | 149 | T-V10 prompts 验声明参数名驻留（旧语义负向锚已裁） | 整删 | 149-160 | 读 `src/prompts/*.md` 正则在场（唯一断言） |
| webview-turnstate | 298 | ⑥ Send running 期隐藏（send.js 出口守卫） | 段删 | 320-321 | 读 `webview/send.js` 子串在场 |

- **本端合计：27 档 · 整删 61 条 · 段删 40 条**（= 101 条处置行——含 2026-09-12 修正轮：PA-A1 追加 `portability-vsc-advisor-context` T-V07–T-V10 整删 4 条 + `eng-designer-role` / `prompts-async-guidance` 段删 6 条；PA-A3 回退 `settings-tool` T-S2.35 1 条、`settings-tool` 档随之出清单）。
- **粗筛 → 逐条判定的差额（诚实对账）**：VSC 侧记录 §1「事实基线」的粗筛口径 = 「读档 + `includes`/`match` ≥3 的档 → 该档**全部**用例」= 28 档 / ≈330 用例 ≈ 本端 suite 50%。
  逐条判定后（含修正轮）= 61 整删 + 40 段删（101 条处置行）——差额原因：粗筛把**断言对象是运行产物**的用例一并计入（混装档的 `includes` 多数落在运行时值上）。
  口径注：粗筛的「用例数」与本档对账口径（`test(` / `slow(` / `it(` 起始行计数）不同——**对账以本档口径为准**（命令见 §8.3 AC-VT8）。
- 被删用例留下的孤立 helper / import / 常量：执行轮按「删除后零 unused」一并清理（不得留死代码）。
### 8.2 本端执行面要点（端特有）

| 项 | 本端契约 |
|---|---|
| 登记清单 | `test/files.mjs` **零改**——本端无整档删除（每档均有保留用例），63 条登记项（62 档 `.test.mjs` + 1 档 `smoke-settings.mjs`）与实档数不变 |
| 对账基准 | 本端快层用例总数 653 → **592**（−61 = 本端清单整删条数 61——含修正轮净变动 +3） |
| 计数口径 | 同 CLI 侧（`test(` / `slow(` / `it(` 起始行计数） |
| 结构机检面（**端差登记——2026-09-12 修正轮更正**） | 本端实际构成 = `scripts/check-doc-width.mjs`（**行宽 + 一致性 V1/V2/V3 单源**）+ `scripts/check-syntax.mjs`（`npm run lint`）+ `test/doc-consistency.test.mjs` + slow 门——判据面**零改**（保留面）。**端差**：本端 `scripts/` **无 `check-ledger.mjs`**（实测 = `check-doc-width.mjs` / `check-syntax.mjs` / `publish-all.mjs`）——台账机检脚本住 CLI 仓（默认台账清单含两端），**本端无法就地跑台账机检**；该面判据零改、本批零改零新造脚本，**端差登记**（见 §8.6；**不得静默**——N-CL4） |
| 发布门 | `vscode:prepublish` 三环（lint → test:full → test:integration）全绿不降 |

### 8.3 本端验收（回指）

| AC | 标准（机验） | 回指 |
|---|---|---|
| AC-VT8 | 本端快层用例总数 653 → 592（下降数 == 本端清单整删条数 61） | F16 / F21 / N10 |
| AC-VT9 | 本端清单逐条落地（点名的用例名 / 断言行零命中）；本端 `test/files.mjs` 零改 | F16 / F18 |
| AC-VT10 | 本端 `scripts/check-doc-width.mjs`（宽 + V1/V2/V3）判据面零改 + 台账机检判据零改（执行面端差登记见 §8.2）；`vscode:prepublish` 三环全绿 | F17 / N11 |
| AC-VT11 | 零新增跨仓同步依赖 / 零 byte-identical 断言（各端原文自持） | F20 |
| AC-VT12 | 需求档自持：本仓 `docs/requirements/TESTING.md` 在位（含 F15–F22 / N10–N12 标识与判据口径）；本档 §8 需求依据与 AC 回指均指本仓档（零「需求落 CLI 侧档」表述） | 批级（分仓裁定） |

### 8.4 边界

- 与 CLI 侧的关系 = **共享语义源**（CLI 侧设计档 §11）：本端实现面自持，不以任一端产物回改另一端（多实现面纪律）；
- 不新增测试档；不动本端登记制与两清单边界（§3「登记制边界」行）；
- 本端既有 AC（AC-VT1–AC-VT7）语义零改。

### 8.5 与并行批的文件域重叠面（登记——不裁定分派）

| 面 | 本批（PROSE-ANCHOR-RETIRE） | 并行批（LEDGER-SELF-CONTAINED） | 重叠 |
|---|---|---|---|
| 本仓提示词双源 | `src/prompts/discipline-engineering.md` + `docs/design/prompts/discipline-engineering.md`——测试纪律节加「禁写散文锚」句（F19） | 该批 R3 提示词层要求（台账维护条款面） | **是**（同两档，不同节位） |
| 本仓测试面 | `test/**`（本档 §8.1 清单） | 台账面测试（如涉） | 待该批设计定——本批不预设 |

- 登记范围仅此：**两侧实施分派方式**（与 CLI 侧同链 / 各端独立）与**两侧记录的互引形态规范**不属本批设计裁定范围（属并行批 `2026-09-12-LEDGER-SELF-CONTAINED.md` 的设计范围）。
- 本批设计侧落笔面 = 本档；提示词档落笔 = 主 agent 内容权 + eng-coder 落笔（非本批设计侧）。

### 8.6 本批两侧记录与跨批协调（登记）

- CLI 侧记录 = `thincoder/docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md`；VSC 侧记录 = `docs/batches/2026-09-12-PROSE-ANCHOR-RETIRE.md`（本仓）。
- 两侧记录**各持自身范围**（本档 = 本端设计落地）——本档只登记，不预设互引语句。

**依赖就地消解（2026-09-12 修正轮二——用户 05:11 裁定；不挂对齐轮）**

| # | 项 | 处置（已落） |
|---|---|---|
| 1 | 需求落点（原「跨仓引用」） | **已消解**：本端需求自持于本仓 `docs/requirements/TESTING.md`（2026-09-12 新建；语义同源、各端原文自持）——本档 §8 需求依据与 AC 回指均指本仓档；CLI 侧需求指针指其本仓档 |
| 2 | 台账机检执行面（端差） | **已定案**：本端无 `check-ledger.mjs` = 既有端差（§8.2 登记）；本批零改、不新造脚本；L1–L3 判据保留面不动 |

**跨批协调项（2026-09-12——SWEEP-FOLLOWUP 守恒锁）**：CLI 侧回归锁 `SPLIT_CASES`（`ENGINEERING-MODE（CLI 仓）§2.27.4`；as-of 42 / 21 / 合计 63）
锁定 `prompts-async-guidance` / `prompts-dual-source` 两档用例数；本批实施删除对应散文锚用例 → **实施轮同批重测并同步该锁值**
（守则 = `ENGINEERING-MODE（CLI 仓）§2.27.1`「守恒锁守则」；同值面 = 设计档 §2.27.1 / §2.27.4 / AC57 / §3.2 T111 + `ENGINEERING-MODE 需求（CLI 仓）§1.15`）。
本端对应受影响两档 = `test/prompts-async-guidance.test.mjs` / `test/prompts-mirror-anchors.test.mjs`——**本端无同类例数守恒锁（grep 实测零命中）→ 无锁值同步面**。

## 变更记录

- 2026-09-12（**修正轮二——设计评审轮次 1 落修 #7/#9/#10**；只落直接导出的修正、零新语义）：
  §8 头注 / §8.1 判据补充改 **C1-a–d** + 需求依据改指**本仓** `docs/requirements/TESTING.md`（分仓就地消解）·
  §8.2 登记项计数 63 + 端差登记措辞 · §8.3 增 **AC-VT12**（需求档自持）· §8.6 **依赖就地消解** +
  **跨批协调项（SWEEP-FOLLOWUP 守恒锁——本端无同类锁值同步面）**。
- 2026-09-12（**修正轮**——批次档 §1「待裁项裁定与缺陷处置（04:41）」逐条落地）：
  - §8.1 追加 10 条（`portability-vsc-advisor-context` T-V07–T-V10 整删 · `eng-designer-role` T57 边界 / `prompts-async-guidance` §3.2·§3.4 段删 6 条），并**撤出** `settings-tool` T-S2.35（PA-A3 回退——工具契约面）；小计与差额重算（**61 整删 + 40 段删 = 101 条**）。
  - §8.2 **端差登记更正**（本端 `scripts/` 无 `check-ledger.mjs`——实测载明；结构机检面 = `check-doc-width.mjs`（含 V1–V3）+ `check-syntax.mjs` + doc-consistency 用例 + slow 门）+ 对账基准重算（592）。
  - §8.3 AC-VT8 / AC-VT10 同步；§8.6 新增**已登记依赖——未消解**（跨仓引用 / 台账机检执行面 vs 并行批 R1/R7）；§8 头注登记需求面依赖。
- 2026-09-12（散文锚退役批——PROSE-ANCHOR-RETIRE）：新增 **§8**（本端执行面：**§8.1 本端逐条删除清单（27 档 · 整删 61 · 段删 40——修正轮后实测）** + 粗筛对账 + 端特有面 + AC-VT8–AC-VT11 + 边界 + 与并行批重叠面登记 + 两侧记录登记）；登记清单零改（本端无整档删除）；判据/口径=CLI 侧设计档 §11；需求落 CLI 侧 `thincoder/docs/requirements/TESTING.md` §5。

- 2026-09-11：新建——测试生命周期与集成集（测试生命周期与集成集批——与 CLI 仓同名档对应；集成清单制 / runner / 发布门三环接线为待实施项）。
- 2026-09-11（TEST-LIFECYCLE 实施轮）：集成集落地（`test/run-integration.mjs` + `test/integration/` 7 场景 + 种子 S1/S2 + 共享夹具——28 用例，退出码 0）；发布门三环接线（`vscode:prepublish`）；§6 受影响文件表对齐执行结果（README 行数注落定 125 as-of 本批 / 合档与削段已执行）。
