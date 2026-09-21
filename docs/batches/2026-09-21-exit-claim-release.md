# 2026-09-21 · exit-claim-release
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-21 · 来源 = 用户 2026-09-21 21:56 事故报告（正常退出未恢复会话）。
> 台账 = #211（SESSION.md · 归批）。前情 = docs/batches/2026-09-21-git-noninteractive.md（已收口 2026-09-21）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中——设计轮（eng-designer #1 设计稿已交回，父侧核验通过，待用户点火评审；前状态行误带冻结词致档被误冻结，已纠偏复开——批次从未收口，纠偏 = 父侧直接执行可 revert）

**本批条目**（需求档 `docs/core/requirements/SESSION.md` §2.5 · 台账 #211 · 板块 SESSION.md）：

| # | 条目 | 一句话 |
|---|---|---|
| F-XR1 | 退出释放 | 优雅退出前释放本进程全部槽认领（`staleClaims` 保留集空）——失败容忍，退出恒达 |
| F-XR2 | 路标保留 | 端标记保持指向退出前槽不置空——下次启动「无属主即可用」直达恢复，零探测 |
| F-XR3 | 崩溃面零变 | 非优雅退出不经本路径，探测三态判据（D-MI10）语义原样 |
| F-XR4 | 双端同源 | 机制核内单点；CLI 接线 = `key-handler.mjs` 退出分支；VSC 接线 = extension `deactivate` |

**事故链与授权口径**：用户 2026-09-21 21:56 实测 Ctrl+C×2 正常退出 → 1.7s 后重启新开空槽 44，旧会话（槽 41，5554 条）未恢复（数据完好）。根因 = 退出路径零释放 + 恢复押在 OS 探测明确判死上（探测 unknown ⇒ 保守新开槽）。父侧取证（crash-reports / peers / manifest / 事件日志四源互证）→ 修法方案（释放认领 + 路标保留 + 探测只管崩溃）完整呈报（含边界表 + T1–T4 验收骨架）→ **用户 22:26 问「vsc 侧需要处理吗」→ 父侧实勘 VSC 同雷（deactivate 链零释放）→ 用户 22:28「可以，开始吧」= 本批点火授权**。

**关键判据**：① 恢复判定链现状（`session-slots.mjs:277-297`）——端标记可用 ∧ 属主空/死/本进程 ⇒ 认领；属主探测 unknown ⇒ 保守放弃（`usableSlot` 无属主分支零探测直达——释放后恢复即走此支）；② 释放谓词单源 = `staleClaims`（`session-slots-manifest.mjs:114-120`，F-CR1 批已验）；③ CLI 优雅退出唯一收口 = `key-handler.mjs:139-154`（空闲双确认分支 → `process.exit(0)`）；VSC `deactivate` 支持 async；④ 不做时间窗启发式；ACP `session/close`（#168①）与崩溃路径（F-XR3）不在本批。

**排除面**：提示语义修正（台账 #212 · CRASH-REPORTS 板块）**不并入本批**——分属两板块两需求点，另案走批。

**补充（2026-09-21 22:4x · 设计稿交回 + 父侧纠偏）**：① eng-designer #1 交回设计（SESSION.md §6.18 + D-SE41/42）；其 §2 写入被拒——根因 = 父侧把 §1 状态行写成「讨论已收口」触发整档冻结门（词面纪律坑重犯——状态行只留「进行中」最小词面），已纠偏复开（上方状态行 + 本行存证）。② 父侧实勘裁决 designer 三上抛：`/exit` 第二退出路径属实（`cmd-exit.mjs:5-7` → `ctx.exit` → `index.mjs:441`）→ 需求 F-XR4 已订正双入口；`exitImpl` 缝不存在（全 CLI 零命中——交接摘要旧词顺入）→ T4 订正为 `exitDelay`+`exitTimer` 既有缝；`session-boot.test.mjs` 实测 447 行（原记 319 过期）→ 已订正。三笔 = 需求档笔面，父侧直接执行可 revert。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成——§2 已落（本批条目覆盖 / 落点表 8 文件 / 关键决策 D-SE41/42 / 红线五项对照 / T1–T6 验收对照 / 上抛项无新增）；设计稿 = 设计档 §6.18（父侧已核验通过），待点火评审

**本批条目（覆盖）**：需求档 `docs/core/requirements/SESSION.md` §2.5 F-XR1–F-XR4 全覆盖（条目表 = §1 同源不复制）；F-XR4 按双入口订正形态承接（CLI Ctrl+C×2 + `/exit` 两点、VSC `deactivate` 一点）。不覆盖：ACP `session/close`（#168① 另案）· 提示语义修正（#212 另批）· 崩溃路径（F-XR3 = 语义锁零变）。

**设计档落点**：`docs/core/design/SESSION.md` §6.18（判据句 / 接线序 / 端壳裁定 / 边界情形 / 验收回指）+ §7 D-SE41/42 决策行；落点表与用例细表 = 本节（一次性材料，不入设计档）。

**机制设计一句话**：核内薄函数 `releaseClaimsAll(cwd)`（`loadManifest` → `staleClaims(m, [])` 保留集空 → 非空才 `saveManifest`；整体 try/catch 永不抛）——CLI 两点同步插行、VSC `deactivate` async 前置释放；释放零触碰 marker 面，恢复走 D-2 ① 支既有判据零新语义。细则 = 设计档 §6.18，本节不复制。

**受影响文件与测试面**（8 文件）：

| # | 文件 | 改动 | 量级 |
|---|---|---|---|
| 1 | `thincoder-core/session-slots-manifest.mjs` | 新增 `releaseClaimsAll(cwd)`（与 `staleClaims` / `saveManifest` 同档单源） | +~22 |
| 2 | `thincoder-cli/src/tui/key-handler.mjs` | Ctrl+C×2 空闲双确认退出分支：`cleanup()` 后、`exitTimer` 注册前插释放（+ import） | +2 |
| 3 | `thincoder-cli/src/tui/index.mjs` | `/exit` 路径（`cmd-exit.mjs:6` → `ctx.exit`）同型插行（+ import） | +2 |
| 4 | `thincoder-vscode/extension.mjs` | `deactivate` 改 async，`await releaseClaimsOnExit(_cwd())` 前置于既有三步 | ~4 |
| 5 | `thincoder-vscode/src/extension/session-io.mjs` | 薄包装 `releaseClaimsOnExit`（node 可测缝；`workspaceFolders` 空 ⇒ false 不落核） | +~8 |
| 6 | `thincoder-core/test/session-slot-write.test.mjs` | T1 / T2 核面用例新组 | 新组 |
| 7 | `thincoder-cli/test/tui-exit-cleanup.test.mjs` | T4 CLI 退出 e2e 新组 | 新组 |
| 8 | `thincoder-vscode/test/session-exit-release.test.mjs` | T5 VSC 端壳机判新档 | 新档 |

**关键决策**：D-SE41 = 释放函数与谓词 / 落盘**同档单源**（住 `session-slots-manifest.mjs`，与 `staleClaims` / `saveManifest` 判据面零复制，§6.16 落盘判据三条自动继承）；D-SE42 = CLI 退出链**否决 async 化**、取同步插行（同步单文件写零改造零新竞态面，100ms 窗内同步完成零竞态；`ctx.exitDelay ?? 100` 原值保留不动）。

**红线五项对照**：① F-XR1 失败容忍——try/catch 永不抛、退出恒达（写失败 = 认领残留，恢复走既有探测面，现状形态）；② F-XR2 路标保留——释放零触碰 marker 面（不调 `writeEndMarker`、不写 null；与 `deleteSlot` 显式置空路径严格区分）；③ F-XR3 崩溃面零变——D-MI10 探测三态判据一字不动，崩溃路径信号无 JS 钩子不可达释放面；④ F-XR4 双端同源——机制核内单点，端壳 = 纯转口两行（W11 形态，零端差零镜像必要）；⑤ NF1——零新增跨端共享可变字段（认领集 = 共享 manifest 既有结构）。

**验收对照（T1–T6 · 判据级）**：

- T1 = 释放后盘面三断言（manifest 无本进程条目 ∧ marker 仍指原槽 ∧ 槽文件完好）；
- T2 = T1 后 `resumeSlot` 返回原槽非空数据 + 探测束零 exec（沙箱单进程替身注入）；
- T3 = 崩溃路径负向回归（认领在 + 探测 unknown ⇒ 全新分配，现状锁）；
- T4 = CLI 退出 e2e（`exitDelay` 注入 + `ctx.exitTimer` 捕获——先释放后定时器注册 / 桩收 `exit(0)` / 释放抛错仍注册退出 = 失败容忍）；
- T5 = VSC 端壳机判（沙箱 + deactivate 结构机检）；T6 = 三端测试全绿。

机检形态细表 = 设计档 §6.18 验收回指。

**上抛项**：无新增。设计期三上抛（`/exit` 第二退出路径属实 / `exitImpl` 缝不存在 / 测试行数过期）已由父侧实勘裁决并落需求档订正（§1 补充行②）；本节已按订正后形态承接（T4 = `exitDelay`+`exitTimer` 既有缝）。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
