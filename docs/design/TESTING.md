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

## 变更记录

- 2026-09-11：新建——测试生命周期与集成集（测试生命周期与集成集批——与 CLI 仓同名档对应；集成清单制 / runner / 发布门三环接线为待实施项）。
- 2026-09-11（TEST-LIFECYCLE 实施轮）：集成集落地（`test/run-integration.mjs` + `test/integration/` 7 场景 + 种子 S1/S2 + 共享夹具——28 用例，退出码 0）；发布门三环接线（`vscode:prepublish`）；§6 受影响文件表对齐执行结果（README 行数注落定 125 as-of 本批 / 合档与削段已执行）。
