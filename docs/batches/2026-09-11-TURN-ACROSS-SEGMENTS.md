# 批次记录（本仓份）— TURN-ACROSS-SEGMENTS（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `thincoder/docs/batches/2026-09-11-TURN-ACROSS-SEGMENTS.md` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **6** 条目 = VSC 实施面 5 档 + 本仓父侧排程行）；源档 blob SHA = a63f6aabda21。
> 源档案内锚：§2 `:85` / `:86` 双端行（各端独立实现）。

## 本仓份（逐字自源档搬运）

**受影响文件（实施面——coder 声明 `files`；行数口径 = `wc -l`，as-of 2026-09-11）**：

VSC：`src/agent.mjs`(353 → ~358) · `src/agent/run-helpers.mjs`(276 → ~292) · `src/agent-tools/subagent-run.mjs`(184 → ~185) · `src/agent-tools/subagent-escalate-async.mjs`(216 → ~217) · `test/turn-across-segments.test.mjs`(新 ~90)

**验收标准（源档——本仓面）**：= 设计档 VSC AC1′-AC6′（19.7）+ 最低门：
① 两仓新增用例全绿（T1-T8）；② 既有全量回归绿（VSC `npm test` / test:full）；③ 两仓 `node scripts/check-doc-width.mjs` 新增违规 0；④ 源码锚（VSC AC2′/AC3′）驻留。

**纪律核对（源档 §2——双端共规）**：双端独立实现、语义同源（各端以本端代码为准，不互为镜像）✔ · D1 写权（需求/设计 = eng-designer——coder 不写文档；父侧维护文件 coder 不列 `files`）✔。

**明确不在本批（源档边界——本仓面）**：VSC live 头逐轮跳动（登记行保持开放——`open`）· 桥面零改动 · 段内帽与 `ContinueError` 载荷零改动。

**父侧排程（源档 §2——本仓面行；coder / 设计者均不写）**：VSC `docs/design/AGENT-LOOP` :27-29 登记行指针 + :129 hook 措辞同步 · VSC `docs/design/ARCHITECTURE` :21-23 同款指针（两处同改防漂移）。
