# 2026-10-24 · 超时与投递面：body 空闲可配 · 子代理报告无条件落盘 · digest 推回不被 task 更新清零
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-24 · 来源 = GitHub #22 · #29 · Gitee IKKBF8 发现 3：空闲超时写死不可配、子代理报告在超时后凭空消失、digest 投递被 task 更新反复打断。用户 2026-10-24 17:31「其他问题能够也并行开始处理吗！」。
> 台账 = #1749（归批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖）

| # | 条目 | 覆盖 |
|---|---|---|
| 1 | GitHub #22 —— body 空闲超时不可配 | 覆盖（配置键 + 八处字面量收口 + 判据） |
| 2 | Gitee IKKBF8 发现 3 —— 子代理报告超时后凭空消失 | 覆盖（无条件落盘 + digest 带路径 + 预览） |
| 3 | GitHub #29 —— digest 推回被 task 更新清零 | 覆盖（完成门合取 `!poolLive(agent)`） |

**明确不在本批**（边界，全文 = 设计档 §7）：`requestWithRetry` 重试语义 · 「`0` = 禁用超时」开关 · `agent.fetchTimeoutMs` 的 `settings list` 可见性 · anthropic 直连读侧新增定时器 · `bg` / `browser` 两族注入器 · consult 族预算口径 · `task.mjs:83` 归零语义。

### 设计档落点

`docs/core/design/TIMEOUT-DIGEST.md`（§1 方案与理由 · §2 接口契约 · §3 受影响文件 · §4 关键决策 · §5 验收 · §6 用例 · §7 边界 · §8 UI · §9 集成口径）。

被本批改写的两处基础档已就地更新并指回设计档：`docs/core/design/PROVIDER.md` §6.3（body 阶段超时值来源）、`docs/core/design/AGENT-LOOP.md` §9 第 2 条（pending tasks 提醒加池判据）。基础机制（重试 / SSE 看门狗 / digest 注入文法 / 挂起尾巴）不重述。

### 机制设计（三件，逐件「现状 → 目标形 → 判据」）

**① body 空闲超时可配**

- 现状：`120_000` 在八处各写一遍，无配置键、无 env：
  `provider/core.mjs:67` · `provider/sse.mjs:201` · `provider/google.mjs:133`/`:218` · `provider/anthropic.mjs:105`
  · `provider/responses.mjs:248`/`:267`/`:285` · `thincoder-core/proxy.mjs:51` · `thincoder-core/proxy-transport.mjs:41`/`:232`。
- 目标形：配置键 **`agent.bodyIdleTimeoutMs`**，默认 **`120000`**，单源常量 `DEFAULT_BODY_IDLE_MS`（`thincoder-core/config-defaults.mjs`）。
  链路：`loadConfig` 提升为 `provider.bodyIdleTimeoutMs`（同 `fetchTimeoutMs` 形，`config.mjs:352` 后）
  → `effectiveBodyIdleMs(provider)`（`provider/core.mjs`，与 `effectiveFetchTimeoutMs` 相邻）为唯一解析点 → 八处消费点原地改读（表 = 设计档 §2.1）。
  `≤0` / 非有限 ⇒ 回退默认。
- 判据：`settings list` 可见 `agent.bodyIdleTimeoutMs = 120000`；设 5000 后长生成按 `SSE idle timeout: no data for 5s` 失败、缺省同请求跑完；全仓 `provider/` 与 `proxy*.mjs` 再无 `120_000` 字面量。

**② 子代理报告无条件落盘**

- 现状：`thincoder-core/agent-tools/subagent-async.mjs:386` `const preview = (over && await persistOverflowReport(...)) || await offloadToolResult(...)` —— 只有轮累计超 64K 预算才落盘；未超时 `offloadToolResult` 因长度门直接返回原文（`agent/helpers.mjs:156-157`），报告只在内存里。
- 目标形：`offloadToolResult(text, callId, dir?, { force })` 加 `force` 支（跳过长度门，恒写 `configDir/tool-results/`，返回双端预览 + 全量路径）；注入点无条件 `{ force: true }`；`digestBudgetOver` 记账保留、布尔值在本族退役；`persistOverflowReport` 语义不变（其它族）。
- 判据：200 字符与 70K 两条报告都落盘，注入文本带路径 + 预览且不再出现全文 inline；落盘不可写时注入体为预览 + `offload to disk failed`，不抛错。

**③ 完成门认池**

- 现状：`thincoder-core/agent/completion.mjs:62` 判「depth 0 ∧ 非工程模式 ∧ 有 pending ∧ `_taskPushbacks < 1`」，不看池；`agent-tools/task.mjs:83` 一更新列表就把 `_taskPushbacks` 归零 ⇒ 池里子代理在飞时回合被反复推回（issue 实录 8 小时）。
- 目标形：合取 `!poolLive(agent)`（取自 `agent/suspension.mjs:64`，与挂起尾巴 `:296` 同判据）。`task.mjs:83` 零改。
- 判据：池在飞 + pending ⇒ 门不触发（`_taskPushbacks` 恒 0）；池空 + pending ⇒ 推回一次。

### 受影响文件与测试覆盖

逐档行数与增量 = 设计档 §3（12 个源文件 + 1 个新单元用例，表共 13 行；最大增量 7 行，无文件触发拆分）。测试覆盖：单元 `thincoder-core/test/timeout-digest.test.mjs`（T1–T8，收口即删）；集成套件现存 0 例（≈50–100 窗口），本批不改集成面，缺口由父侧收口记账（口径 = 设计档 §9）。

### 验收对照

设计档 §5 A1–A9，逐条指回本批三个条目：A1–A3 → 条目 1；A4–A6 → 条目 2；A7–A8 → 条目 3；A9 = 零回归。三条硬约束的落点：无第三方依赖（§7）· `requestWithRetry` 零改（只换 idle 取值来源）· 三件各自可独立回滚（文件集合两两不交：`provider/*`+`proxy*`+`config*` ∥ `agent/helpers.mjs`+`agent-tools/*` ∥ `agent/completion.mjs`）。

### 关键决策

D1 键名 `agent.bodyIdleTimeoutMs` / 默认 `120000` · D2 默认值住 DEFAULTS 表（判据「list 可见」要求）· D3 非法值回退、不做禁用开关 · D4 复用一个 `offloadToolResult` 的 `force` 支（不新写落盘函数）· D5 注入体恒为「预览 + 路径」· D6 完成门复用 `poolLive`（不立第二口径）。被拒选项 = 设计档 §4。

### 上抛项

`[上抛·待裁]` **anthropic 直连读侧无空闲定时器**：`provider/anthropic.mjs:149-206` 的流读取无 timer（`120_000` 只以 `_bodyIdleMs` 出现在代理分支 `:105`）。因此新键在「anthropic + 无代理」这一格不生效。补定时器 = 新机制（设计档 §7 已列为边界），请裁是否另批。

### 实施注意（给 eng-coder）

`completion.mjs` import `poolLive` 若成环（`suspension.mjs` ↔ `agent.mjs`），按设计档 §2.3 末段迁到叶子 `agent/pool-live.mjs` + `suspension.mjs` re-export，消费面零改。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审 · TIMEOUT-DIGEST.md（body 空闲可配 · 报告无条件落盘 · 完成门认池）

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 需求 / 清晰度 | 🔴 | §2.2（`TIMEOUT-DIGEST.md:67`）把 `force` 支的返回体定义为「双端预览 + 全量路径」原样复用，但 `buildDualEndPreview` 的契约假定正文长于头片：`safeSliceUTF16End` 在 `text.length <= max` 时整串返回（`thincoder-core/agent/helpers.mjs:57`、`:72-76`，HEAD=16K / TAIL=48K，`:38-39`）。⇒ 任何 ≤16K 的子代理报告（绝大多数）注入体会出现「正文 ×2 + `middle omitted: 0 chars`」，且 `:164-167` 的固定文案会宣称 `output too large (200 chars total)`（A4 的 200 字符用例正是此形）；相对现状（≤64K 直接返回原文）把注入体翻倍。A4/T5/T6 只断言「含路径 / 含预览」，机判抓不到。 | 在 §2.2 补出 `force` 支的形态分支：正文 ≤ offload 门限（或 ≤ PREVIEW_HEAD）时注入「正文一份 + 尺寸中性文案 `full content saved to: <path>`」，`双端预览` 仅在真截断时使用；文案参数化去掉「too large」断言；A4 增加「正文在该注入体中恰好出现一次」的机判（如分段计数 === 1）。 |
| 2 | 方法论（测试缝） | 🟡 | 注入点硬编码 `dir` 为 `undefined`（`TIMEOUT-DIGEST.md:72`），落盘目录不可注入；既有缝 `_setDigestOffloadDirForTest` 只覆盖 `persistOverflowReport`（`thincoder-core/agent-tools/digest-budget.mjs:58-66`，re-export 于 `subagent-async.mjs:27`），改造后不再触达本族 ⇒ A4/A6/T5/T6 要么写进真实 `configDir/tool-results`，要么无法执行（A6「把落盘目录指向不可写路径」无入口）。仓库已有同式先例（模块级 `let _x = null` + `??` 默认，`bash-async.mjs:59`）。 | 给 `offloadToolResult` 加进程内缝（`_setOffloadDirForTest(dir)` / 模块级 `_offloadDirOverride ?? join(configDir,"tool-results")`，成对 reset，生产零变），或让注入点以 `_override ?? undefined` 传 `dir`；§6 T5/T6 写明经该缝执行并 finally 复位。 |
| 3 | 方法论（行数档） | 🟡 | §3 增量与自述矛盾：`agent/helpers.mjs` 现 498 行、`+6 / −2`（`TIMEOUT-DIGEST.md:102`）⇒ 收口 ≈502 行，已越 500 行咨询档，而 `:107` 断言「无文件越过单文件行数上限 …… 不触发拆分」。 | 要么把 helpers.mjs 的增量压到净 ≤+2（保住 500 档），要么在 §3 补一行动态拆分评审判词（拆点候选 = offload/预览族整块外移），并同步 `:107` 的措辞。 |
| 4 | 文档归属 | 🟡 | 新建档未登记进权威地图：`docs/README.md:83` 持有「`core/design/` 实档 61 = 本图登记 61 + 待补登 0（逐名相等）」的机判不变式，而 `TIMEOUT-DIGEST.md` 不在图内；§3 受影响表（`:91-105`）也只列源码与测试，无一条 `.md`（本批实际改写 `PROVIDER.md` §6.3 / `AGENT-LOOP.md:321`，已在盘核实）。 | §3 增两行 `.md` 条目（`docs/README.md` 登记 + 计数 61→62；本档自身），或在 §7 边界写明「地图登记 = 父侧收口动作」并给出编号，避免该不变式静默失衡。 |
| 5 | 方法论（测试落点） | 🟡 | 批内用例落 `thincoder-core/test/timeout-digest.test.mjs`（`:105`，收口即删），但 `TESTING.md:94` 的批内件口径是「`docs/batches/*.test.mjs`，随批删」（盘上现有 7 件即此形）；`thincoder-core/test/` 现存 6 档均为常驻机检档，混入一次性档会让「零留存」不可读。 | 改落 `docs/batches/2026-10-24-timeout-and-digest.test.mjs`（与批档同址同删），或在该行注明为何必须住 core 测试树（如需要 `node --test` 单层收集）。 |
| 6 | 范围（协调项） | 🟡 | 判据 ①「body 空闲超时可配」在「anthropic + 直连」一格不生效（§7 `:152` 已声明 + §8 `:160` 上抛）。这是诚实的边界，但条目表面是「超时值全仓收口」，读者会按全覆盖预期验收。 | 该上抛项按协调项挂起即可；若主 agent 裁定「补定时器」，§2.1 消费表与 §3 需补 `provider/anthropic.mjs:149-206` 一行，条目 ① 才可宣闭环。 |
| 7 | 范围 / 设计 | 🟡 | 轮累计预算对本族失效：§2.2 保留记账但丢弃布尔（`:71-72`），注入体恒为 ≤64K 预览。池上限 4/4/4（`config-defaults.mjs:46`）+ 一轮多报告 ⇒ 单轮可注入数百 K，恰是 D5 拒「全文 inline」时引用的「64K+ 请求体原事故面」的同类风险，只是换了单位。 | 为 `force` 支保留一个上限：预览尺寸受轮累计预算约束（超预算 ⇒ 只给更短的头片 + 路径，落盘恒不变），或显式认账「本族不受轮预算约束」并给出可接受的单轮注入上限。 |
| 8 | 验收 / 可判性 | 🔵 | A2 与 T3/T4 依赖真实墙钟：40s × 3 帧，缺省配置一条就要跑 ≈120s，且对 CI 抖动敏感（R4）。 | 把间隔压到「显著小于缺省、显著大于小值」的窗口（如 1.5s 间隔 / `idle=800ms`），断言两条即可区分，测试时长从分钟级降到秒级。 |
| 9 | 验收 / 纪律 | 🔵 | A9 用 `node --test thincoder-core/test/`（`:132`），而单入口是 `test/run.mjs`（`thincoder-core/test/run.mjs:2-4`、`:48` 收集 `test/*.test.mjs` 单层 glob，启动器本身就在被传目录内）。 | 改为 `node thincoder-core/test/run.mjs`（或 `node --test thincoder-core/test/*.test.mjs`），与 `TESTING.md` 单入口纪律对齐。 |
| 10 | 先例 / 查证面 | 🔵 | §1 的先例走查只列了头超时同构形（`:9-12`），未点出反向先例 `AGENT-PARAMS.md:21`（`advisor.timeoutMs` 的默认「不写进 DEFAULTS、只住常量」）——D2 的偏离正是对着它做的；且该档被 §1 `:22` 与 §8 `:158` 当作裁定源引用，却不在 `:14-16` 的 survey-evidence 清单里。 | 在 §1/D2 补一句「对照 `AGENT-PARAMS.md` §2 的 advisor 先例（默认只住常量）——本键因「`settings list` 可见」判据必须登记 DEFAULTS，故不沿用」，并把该档写进查证清单。 |
| 11 | 文档卫生 | 🔵 | §1 `:16` 声称两处基础档「已就地更新并指回本档」，盘上核实为真（`PROVIDER.md:101`、`AGENT-LOOP.md:321`），但 `PROVIDER.md:1121`（D-PR6 行）仍写「body 读侧空闲 `READ_IDLE_MS`」——被删常量名残留。 | 该残留随本批一并改为 `agent.bodyIdleTimeoutMs`（或在行内注记常量已退役），使就地更新自洽。 |

**计数**：🔴 1 · 🟡 6 · 🔵 4（共 11 项）。核实面：受影响行数抽样（`config-defaults.mjs` 92 · `config.mjs` 438 · `provider/core.mjs` 468 · `agent/helpers.mjs` 498）与盘上 `wc` 口径一致；`120_000` 在 `provider/` 与 `proxy*.mjs` 的分布恰为 §2.1 八行所列（另 `list-models.mjs:32` 用 `LIST_TIMEOUT_MS`，不入本键）；`poolLive` 导出点 `suspension.mjs:64`、挂起尾巴判据 `:296`、`completion.mjs:62` 现形、`task.mjs:83` 归零、`config.mjs:350-352` 提升链、`digest-budget.mjs:51-56` 记账口径均与文档引用一致。

**VERDICT: changes-required**

依据：第 1 项 🔴 —— `force` 支对 ≤16K 报告（主流形态）会注入「正文两份 + `middle omitted: 0 chars` + `output too large` 假文案」，A4/T5/T6 三条机判均不覆盖，须先补契约与判据再实施。其余 🟡/🔵 不阻塞。

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
