# 项目待办（Project TODO）
> 台账（FR18）——两池不混：**需求池**（用户需求点）/ **技术待办**（设计遗留 / 评审发现 / 债）。形态权威 = `docs/requirements/ENGINEERING-MODE.md` §1.13。
> 需求池条目 = 一行指针（`<需求句> → 需求 <档> §X · 任务书 batches/… §2 · status=<六态>`）；技术待办 = 指针（可指则指）+ 最小证据行（`file:line` + 症状）。**不展开任务细节**（细节住需求档 / 批次档）。
> 状态机六态：待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃——**已核销 / 已废弃 → 移入 `docs/TODO-archive.md`**（活文件只留未决；组计数 = 未决数）；组计数（N 条）与组内实条目数同改（D3）。
> 维护：**记录 + 状态推进 + 物理落笔 = 主 agent**（§1.13——2026-09-11 修订）。本文件只承载**当前未决项**——已核销 / 已废弃移入 `docs/TODO-archive.md`（git history 可追溯）。

---

## 需求池（0 条）


> 快车道：用户说"急"走单点不入池。生命周期：实现后核销勾销。





## 技术待办（1 条）

- [ ] **文档↔实装漂移（类）：设计/需求档「事实句」落后于代码/测试现态**（2026-09-12 LEDGER 批串行排查暴露；当晚已清 250+ 处）→ 证据：`docs/design/ADVISOR-CONVERGENCE.md:766`（citations grep 断言面无本批段删承载）· `:913`（同族）· `docs/design/ENGINEERING-MODE.md:2221`（AC76 子串族）· `docs/design/TURN-CAP-CONTINUE.md:159` · `docs/design/ACP-CLIENT.md:435`；另见 `ADVISOR-CONVERGENCE` §14 族 / `ledger-surface` T106 面（2026-09-12 批档 §2 各轮列报）· 消解路径 = 专项「文档↔实装对账」轮（逐档逐句：事实句 ↔ 现代码/现测试）· **触发=条件（该面下次被触碰时 / 下批收口前）**

---

