# 项目待办（Project TODO —— thincoder 合并仓）

> 台账（FR18）——两池不混：**需求池**（用户需求点）/ **技术待办**（设计遗留 / 评审发现 / 债）。形态权威 = `thincoder/docs/requirements/ENGINEERING-MODE.md` §1.13。
> 需求池条目 = 一行指针（`<需求句> → 需求 <档> §X · 任务书 batches/… §2 · status=<六态>`）；技术待办 = 指针（可指则指）+ 最小证据行（`file:line` + 症状）。**不展开任务细节**（细节住需求档 / 批次档）。
> 状态机六态：待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃——**已核销 / 已废弃 → 移入同目录 `docs/TODO-archive.md`**（活文件只留未决；组计数 = 未决数）；组计数（N 条）与组内实条目数同改（D3）。
> 维护：**记录 + 状态推进 + 物理落笔 = 主 agent**（§1.13）。本文件只承载**当前未决项**。
> **单仓单账（2026-09-13 台账单仓化）**：合并后本项目**只有本档一份台账**；原 `thincoder/docs/TODO.md` 与 `thincoder-vscode/docs/TODO.md` 两产品池已退役，其未决条目迁入本档、归档内容并入同目录 `docs/TODO-archive.md`。本档条目一律写**全仓相对路径**（`thincoder/…` ∥ `thincoder-vscode/…` ∥ 仓根 `scripts/…`）。

---

## 需求池（2 条）

- [ ] **子 agent 需要上下文压缩机制**（2026-09-13 用户提出）→ 触发 = 批 2 eng-coder **上下文超限崩溃**（请求 1,049,429 tokens > 上限 1,048,576），崩前成果呈半成品态（部分已提交 / 部分未提交未审）；现状 = 压缩与预算护栏只覆盖**父会话**（`thincoder/docs/design/CONTEXT-COMPACTION.md`），子代理长轮次无护栏、直接崩且无降级路径 → 关联档 `thincoder/docs/design/CONTEXT-COMPACTION.md` · status=待讨论
- [ ] **成果外发：技术长文（暂不投 arXiv）**（2026-09-13 用户裁定「丙」）→ 方向 = 先以**技术长文**形式放出（博客 / 仓库 docs），arXiv 留给「甲路（锚一致性机检 V5 + 变异体实验）」完成后的加固版；素材已备 = 三路只读盘点（评审收敛数据 · 机检 V1–V5/L1–L4 · 测试治理 · 提示词体系 · 上下文治理，皆带坐标）；前置 = **公开范围裁定**（方法论与提示词体系的外发尺度）；关联 = 技术待办「两仓合并招牌数字不可复现」（长文若引那组数字，须先可复现）· status=待讨论


> 快车道：用户说"急"走单点不入池。生命周期：实现后核销勾销。


## 技术待办（4 条）

- [ ] **文档↔实装漂移（类）：设计/需求档「事实句」落后于代码/测试现态**（2026-09-12 LEDGER 批串行排查暴露；单仓化时两产品条目合并为一条）→ CLI 侧证据：`thincoder/docs/design/ADVISOR-CONVERGENCE.md:766` · `:913`（同族）· `thincoder/docs/design/ENGINEERING-MODE.md:2221`（AC76 子串族）· `thincoder/docs/design/TURN-CAP-CONTINUE.md:159` · `thincoder/docs/design/ACP-CLIENT.md:435`；VSC 侧证据：`thincoder-vscode/docs/design/WEBVIEW.md:231`（「红线…（grep 零命中保持）」）· `:1736`（T-R9 面待核）· `thincoder-vscode/docs/design/VSC-PROMPTS.md:218`（AC-PC-2 尾块两态面待核）；另见两产品 `ADVISOR-CONVERGENCE` §14 族同族列报 · 消解路径 = 专项「文档↔实装对账」轮（逐档逐句：事实句 ↔ 现代码/现测试）· **触发=条件（该面下次被触碰时 / 下批收口前）**
- [ ] **`:N/:M` 多坐标形态不入 V5 射程**（DOC-CODE-RECONCILE 批外审遗留 · 2026-09-13；单仓化时两产品条目合并为一条）：`file.ext:54/:103` 类**多坐标尾**——抽取式只覆盖 `:N` / `:N-M` ⇒ 该形态不可见（无既知实例）· 证据 `scripts/doc-anchors-core.mjs:108`（`stripLineNo` 覆盖面——单仓化后两产品共用此单源）· 消解路径 = 判据句扩 + 复跑（同批 `:N-M` 扩法）+ 判别夹具 · **触发=条件（该面下次被触碰时）**
- [ ] **`doc-consistency` 探针路径写死 → 并发测试互踩（发版门实测暴露）**（2026-09-13 `npm publish` 时 prepublishOnly 全量门报 `ENOENT: docs/design/_doc-consistency-probe.md`）：本目录**另一活跃实例**同时跑同一套测试抢同一探针路径（单跑即绿）· 证据 `thincoder/test/doc-consistency.test.mjs:42`（`PROBE` 常量）· `:160`（v2 判据）· `:167`（清理）· 消解路径 = 探针名带进程唯一标识（`process.pid`）或改系统临时目录 · **触发=条件（该档下次被触碰时）**
- [ ] **`mirror-divergence.mjs` 用法面与符号链接面两处小债**（2026-09-13 入库轮 advisor 评审 🟡/🔵 各一）→ ① **用法错误无契约**：未知旗标静默忽略 · 缺目录抛原始 ENOENT · 恒 exit 0（建议改 fail-loud exit 2——注：入库轮报告所引「`doc-impact.mjs` 先例」经父侧实核**不存在**）② `walkFiles` 静默跳过符号链接（Dirent 对 symlink 既非 dir 亦非 file；两树现无 symlink）· 证据 `scripts/mirror-divergence.mjs:167-169`（argv 解析——无未知旗标校验、无退出码契约）· `:46`（`walkFiles` 只走 `isDirectory()`/`isFile()`）· 消解路径 = 该档下次被触碰时同批收敛 · **触发=条件（该面下次被触碰时）**
