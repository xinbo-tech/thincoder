# 结构债批 5 + 批 6（STRUCTURE-DEBT-BATCH-5-6）

> 板块：结构债（横切——跨多板块的架构/文档/状态债评估与清理）。权威源：STRUCTURE-DEBT.md（总账）+ 本文档（批专属设计——第三次评估 N1-N7 清扫）。
> 状态：**已交付核销**——2026-09-09（CLI 458857c + VSC 65092ff——批 5 AC1-4 + 批 6 AC1-5 过——L2 双端绿——consume f7dc212e——偏差 4 项记录见变更记录）。

---

## 批 5 —— 文档小批

### 需求

- **N3**：CLI AGENTS.md:14-20 文档地图 8 档悬空（ARCHITECTURE-v2/ENGINEERING-WORKLOOP/
  VERIFY-DOCONLY/ROADMAP-0.9.0/EVALUATION/COMPETITIVE-CLI-2026/KIMI-CODE-PROMPT-ANALYSIS/
  TTSR-ANALYSIS——均仅 `_archive/` 但按活体裸名列出——与 README.md 矛盾）+ 7 物理档
  （5 逻辑批——DOC-CLEANUP-BATCH/DOC-REWRITE*/DOC-REORG-VSC/SYSTEM-SPLIT-BATCH/
  CODE-HARDENING-BATCH）未登记地图。
- **N7**：resumed/restart 双端载体异名（CLI `_envResumed`/`_processRestartPending` vs VSC `_resumedPending`/模块级 `restartDetectionDone`）——代码注释无跨端异名锚（仅 VSC 测试文件头一处自注）——统一注释锚。

### 设计（勘察建议——照做勿自行解释）

1. **AGENTS.md:13-20 地图段改粗分类 + 指 README.md**（勘察建议——两份重复地图违反单一权威源——AGENTS.md 只留分类行 + 指向 docs/design/README.md 权威地图——删逐档裸名清单——悬空 8 档随删除自然消解——+ 行 27 注释参照同步）——VSC AGENTS.md 无地图段（勘察核——不动）。
2. **README.md 地图补「结构债批执行」板块行**（:54 后加一行——备注指向 STRUCTURE-DEBT.md §7 + 各 BATCH 档名——7 档物理在根、归 STRUCTURE-DEBT 板块——+ :65 变更记录）。VSC README.md 零悬空已核（不动）。
3. **N7 注释锚**（两武装位各加互指注——单一权威 SESSION.md §11.2 已详述——不落新文件）：
   - CLI `src/session.mjs:275-276` 注释块追加：VSC 端同机制载体异名 `agent._resumedPending`（setup.mjs hydrateRun）+ 模块级 `restartDetectionDone` 闸（setup-reminders.mjs）——双端同语义各自独立实现、命名不统一是刻意（各端自理）——见 SESSION.md §11.2。
   - VSC `src/agent/setup.mjs:353-354` 注释块对称追加：CLI 端载体异名 `agent._envResumed` + `agent._processRestartPending`（session.mjs/bin/thincoder.mjs）——见 thincoder SESSION.md §11.2。
   - 其余消费位（CLI setup-reminders.mjs:9、bin:302；VSC setup-reminders.mjs:72）已各自指向本端武装位——不动。

### 受影响文件（批 5）

| 文件 | 端 | 改动 |
|---|---|---|
| AGENTS.md:13-20 | CLI | 地图段改粗分类 + 指 README.md（删 28 档裸名清单——悬空随删消解）+ :27 注释参照 |
| docs/design/README.md:54/:65 | CLI | 补「结构债批执行」板块行 + 变更记录 |
| src/session.mjs:275-276 | CLI | N7 注释锚追加（VSC 异名互指） |
| src/agent/setup.mjs:353-354 | VSC | N7 注释锚追加（CLI 异名互指） |

（纯 .md 豁免行数注；session.mjs/setup.mjs 注释追加 = structure unchanged——行数 ≤±2）

### 验收（批 5）

- AC1 CLI AGENTS.md 无悬空裸名档（8 档归档随删消解）——地图指 README.md 权威——:27 注释参照同步（评审 #4）
- AC2 CLI README.md 地图含「结构债批执行」板块行（评审 #3：含本档 STRUCTURE-DEBT-BATCH-5-6 自登记——8 档/或行指向 §7 不逐档）
- AC3 N7 双武装位注释含跨端异名互指（CLI session.mjs 点 VSC 名 + VSC setup.mjs 点 CLI 名——见 SESSION.md §11.2）
- AC4 零功能改动（注释 + 文档——测试不回归）

---

## 批 6 —— 代码小批

### 需求

- **N1**：VSC `src/agent-tools/subagent.mjs` 508 行 + `src/advisor/run.mjs` 511 行越 500 硬限（今日增量推过线——上次 488/未列）——照 500 硬拆纪律小拆。
- **N6**：`_permQueue` 3 处 inline（CLI subagent.mjs:209-210 / subagent-spawn.mjs:289-290 /
  escalate-async.mjs:223-224——逐字同型）收 helper——VSC 零 _permQueue（勘察核——不镜像）
  ——+ subagent-actions.mjs:426 注释界定 sync/async（评审 #5——字面矛盾消解——入需求）。

### 设计（勘察建议——照做勿自行解释）

1. **VSC subagent.mjs 拆**——切法 A：`:313-479` runChild 巨型闭包（~165 行）→ 新建 `subagent-run.mjs`（CLI 同名词——参数对象收编闭包捕获 parent/ctx/role/subId/asyncFlag/childSignal/terminalStatus）——execute 保留调用——降 ~165 → ~343 行。零消费面影响（runChild 文件内私有）。头部注记更新。
2. **VSC advisor/run.mjs 拆**——切法 A：`:78-111` 工具集 + 工具 import → 新建 `src/advisor/tools.mjs`
   （~34 行——独立 read-only 工具包 + 测试覆写 seam——先例 citations.mjs）——+ 切法 B：`:336-360`
   `resolveAdvisorProvider` → `src/advisor/provider.mjs`（~25 行——config-io import 随迁）——A+B
   ~59 行 → ~452。**消费面 shim 兜**：MAX_ADVISOR_ROUNDS（run-stages.mjs:16/agent.mjs:13）、
   runAdvisorReview + resolveAdvisorProvider（advisor-async.mjs:27/advisor.mjs:8）、测试
   `_runAdvisorToolLoop`/`_renderTimeline`/`_advisorToolsFor`/`_setAdvisorToolSetForTest`——run.mjs
   留 re-export shim（先例 citations.mjs）。镜像注：CLI advisor/run.mjs 499 压线——只 VSC
   侧拆、文档注漂移（不强行双端同拆）。
3. **N6 _permQueue helper**——归属 CLI `subagent-async.mjs`（三处均已直接 import 它——零新增边零环）：
   ```js
   // agent-tools 共享：并行子代理的审批/继续弹窗经 owner 上命名 promise 链串行——
   // 永不叠弹窗（返回链供调用方 .then 续接）。
   export function enqueueAsk(owner, key, ask) {
     const chain = (owner[key] ?? Promise.resolve()).then(ask, ask)
     owner[key] = chain
     return chain
   }
   ```
   三处改 `return enqueueAsk(parent, "_permQueue", ask)`——逐字替换零语义变化。
4. **subagent-actions.mjs:426 注释界定**："escalate has NO permQueue" → "sync escalate has NO permQueue——async 飞行权限走 _permQueue（escalate-async.mjs）"——一行（:426 在 sync escalate 路径——:423 sync childPermission 直传无队——async escalate-async.mjs:223 才走队——两事实并存字面矛盾消解）。

### 受影响文件（批 6）

| 文件 | 端 | 改动 | 行数 |
|---|---|---|---|
| src/agent-tools/subagent.mjs | VSC | runChild → subagent-run.mjs + execute 引用改 | 508 → ~343 |
| src/agent-tools/subagent-run.mjs | VSC 新 | runChild 迁入（参数对象收编） | ~165 新 |
| src/advisor/run.mjs | VSC | 工具集 → tools.mjs + provider → provider.mjs + re-export shim | 511 → ~452 |
| src/advisor/tools.mjs | VSC 新 | 工具集 + 测试覆写 seam | ~34 新 |
| src/advisor/provider.mjs | VSC 新 | resolveAdvisorProvider（config-io 随迁） | ~25 新 |
| src/agent-tools/subagent-async.mjs | CLI | enqueueAsk helper 导出 | ≤500 现（+~10——评审 #2：若实超 500 则 enqueueAsk 落新文件或并入 async-settle——后备注） |
| src/agent-tools/subagent.mjs:209 | CLI | → enqueueAsk | ~284 现（-2） |
| src/agent-tools/subagent-spawn.mjs:289 | CLI | → enqueueAsk | ~289 现（-2） |
| src/agent-tools/escalate-async.mjs:223 | CLI | → enqueueAsk | ~230 现（-2——评审 #1 补数） |
| src/agent-tools/subagent-actions.mjs:426 | CLI | 注释界定 sync/async | ~440 现（+1——评审 #1 补数） |

### 验收（批 6）

- AC1 VSC subagent.mjs ≤500（拆后 ~343）+ subagent-run.mjs 新（CLI 同名对齐）
- AC2 VSC advisor/run.mjs ≤500（拆后 ~452）+ tools.mjs/provider.mjs 新——导出面 re-export shim 全（测试绿——含 _runAdvisorToolLoop/_advisorToolsFor/_setAdvisorToolSetForTest 消费）
- AC3 CLI enqueueAsk 三处替换——行为零变化（测试绿——_permQueue 串行语义不变）
- AC4 subagent-actions.mjs:426 注释界定 sync/async
- AC5 双端 npm test 快层绿 + VSC L2 全量（链终）

---

## 变更记录

- 2026-09-08：第三次屎山度评估（STRUCTURE-DEBT 批 F 路线）N1-N7 清扫立项——批 5（文档）+ 批 6（代码）——勘察 explore 一手（改动面 file:line 实测）——落本档。N2/N5 已父侧 minor 清（ARC 档头 + AGENT-LOOP 折行）；N4 由 SESSION §11.3 单独链处理（system.md 同步）。
