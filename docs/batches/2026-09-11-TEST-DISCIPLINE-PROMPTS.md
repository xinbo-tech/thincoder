# 批次记录（本仓份）— TEST-DISCIPLINE-PROMPTS（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `thincoder/docs/batches/2026-09-11-TEST-DISCIPLINE-PROMPTS.md` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **7** 条目 = 波 2 VSC 6 档 + VSC 测试档 ⑨ 组）；源档 blob SHA = 511d217b296a。
> 源档案内锚：§2 `:89` / `:90` 两波（波 1 CLI / 波 2 VSC）。

## 本仓份（逐字自源档搬运）

**实施波次建议（两波——文件域不相交；跨批序为硬约束）**：
- **波 1（CLI 面）**：CLI 6 档（de×2 / dn×2 / pe×2，8 编辑点）+ CLI 测试档 TD 锚组——对端份（留源档）。
- **波 2（本仓面）**：VSC 6 档 + VSC 测试档 ⑨ 组——**前置 = `VSC-CONTEXT-PARITY` 批已落**（语料修复后基线；落笔前读现态、键控定位——行号会漂移）；完成即跑 VSC 快层 + VSC 宽度机检。
- 两波可由同一 coder 顺序执行，或按 `files` 域分两 spawn（调度器串行）；VSC 波 `files` 含跨仓测试档路径照实声明。

**本仓落点（波 2 六档 + 测试档 ⑨ 组）**：VSC `discipline-engineering.md`（src + docs 双源）· VSC `discipline-normal.md`（src + docs 双源）· VSC `persona-engineering.md`（src + docs 双源）· VSC 测试档 TD 锚组 ⑨。

**验收标准（源档 §2——本仓面同规）**：AC-TD1–AC-TD8 + 用例 T-TD1–T-TD8；关键命令 = 两仓 `node test/run-fast.mjs` 全绿 · 两仓 `node scripts/check-doc-width.mjs` 新增违规 0 · 行数实测对表（设计 §8.8 预计值）。

**边界与纪律（源档 §2——本仓面切面）**：coder 写提示词 + 测试档；三层文档 = eng-designer 写域（发现文档需改 → 回报，不自行改）。
