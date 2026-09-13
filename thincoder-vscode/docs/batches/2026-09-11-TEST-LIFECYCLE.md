# 批次记录（本仓份）— TEST-LIFECYCLE（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-TEST-LIFECYCLE（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **≈23** 条目——源档标注 unverified：档数受并发他链改写影响）；源档 blob SHA = 034c76e6c42b。
> 源档案内锚：§5 本仓面 ② `:282` 起（另有扫① 面）。

## 本仓份（逐字自源档搬运）

### 实施记录（VSC 面——eng-coder 自写）

**状态：clean**（2026-09-11——集成集 28/28 退出码 0 · 快层 483 pass/0 fail · doc-width 新增 0；内部偏差审计 1 轮 + 内部代码评审 pass + 修正轮 6/6 落地）。未 commit；未发起用户级评审。

#### 一、交付摘要（as-of 落地）

1. **集成集（TL-3/TL-4）**：`test/run-integration.mjs`（新，53 行——清单启动器 + 启动前自检四项：清单在盘 /
   漏登记反证（递归）/ 两清单零混入 / 集成档禁 slow）；`test/integration/files.mjs`（新，18 行——显式清单）；
   7 场景档共 1012 行 + 共享夹具 `test/integration/helpers/mock-llm.mjs` 86 行；**28 用例**（①–⑦ 各三态 + 种子 S1 落 ③ / S2 落 ⑤）。
   断言面 = 业务可观察结果为主（产物/送达/放行-打回/渲染逐字）；判定探针 `_verifyPassed` 按 CLI 侧设计档 §4.5 口径内使用。
2. **接线**：`package.json` `test:integration` script + `vscode:prepublish` = `lint → test:full → test:integration`（三环）。

**回填实测（修正轮后——源档行内）**：`test/run-integration.mjs` **60 行**（原记 53）；7 场景档共 **1024 行**（原记 1012；scenario-02 185 / 03 234 / 05 152）；
`test/index-perception.test.mjs` **259 行**（原记 258）；`test/index-ignored-slow.test.mjs` **122 行**（原记 123）；
`test/helpers/webview-env.mjs` **90 行**（+28——新增 `installFullIndexFixture`，修正轮 #4）。VSC 设计档 §6 表已同步（run-integration 60 / 场景档 1024）。

**四面实测（修正轮后复跑）**：`test:integration` 28/28 · 退出码 0；`npm test` 490 用例 / 483 pass / 0 fail / 7 skip；`check-doc-width` 新增超宽 0 + 新增一致性违规 0。

> 行数 as-of 源档交付日；后续批次（INDEX-PERCEPTION 等）已在其上叠加——现文行数以各档现态为准。
