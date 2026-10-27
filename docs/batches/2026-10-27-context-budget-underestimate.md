# 2026-10-27 · 上下文预算低估
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-27 · 来源 = 用户 2026-10-27 01:21 报障：`dgx-spark` 会话报 `LLM API error 400: maximum context length is 1048576 tokens. However, you requested 1116488 tokens (723272 in the messages, 393216 in the completion)`；01:23 附截图「界面显示目前的上下文长度才 491K」；01:29「直接开修吧」。
> 台账 = #1827（CONTEXT-COMPACTION · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-27
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：用户 2026-10-27 01:21 报障（`dgx-spark` 会话）· 01:23 附截图 · 01:29「直接开修吧」。

## 现象

```
LLM API error 400: This model's maximum context length is 1048576 tokens.
However, you requested 1116488 tokens (723272 in the messages, 393216 in the completion)
```

**界面同时显示 `context 49% 491k`** —— 与「实际发出 723,272」相差 **232K（47%）**。

## 父侧实读的完整链路（本批勘察）

| # | 环节 | 现状 | 证据 |
|---|---|---|---|
| ① | 用户配置 | `deepseek.maxTokens = 393216` | `~/.thincoder/config.json`（非 preset 的 `384_000`）|
| ② | 预算派生 | `limit = window − reserve = 1_000_000 − 393_216 = 606_784` | `thincoder-core/config.mjs:100-121` `requestBudget` |
| ③ | 发送面净判 | `estPrompt = estimateRequestTokens(body) − body.max_tokens`；`if (!(estPrompt > budget.limit)) return` | `provider/core.mjs:258-261` · `provider/errors.mjs:157-163` |
| ④ | 估算公式 | `Math.ceil((len − nonAscii)/4) + nonAscii` | `provider/rate.mjs:62-66` `_estimateSingle` |
| ⑤ | 自校准 | `_tokRatio = max(1, num/den)`，样本来自**服务端成功响应的 `usage.prompt_tokens`** | `token-window.mjs:165-175` `recordTokenSample` |
| ⑥ | 越窗 400 | 三渠道报文特征逐字识别 + 标成 typed 错误后**直接抛出**，无自适应 | `provider/errors.mjs:137-138` · `:166-175` `markContextOverflow` |

## 死锁（本批要治的根）

```
恢复大会话（新进程，8223 条）⇒ 无 _lastPromptTokens、无样本 ⇒ _tokRatio = 1
估算 491K < limit 606,784  ⇒ 守卫放行
服务端实际 723K + 393K = 1,116K > 1,048K  ⇒ 400
失败 ⇒ 拿不到 usage.prompt_tokens ⇒ _tokRatio 永不采样
重试 ⇒ 同样的估算 ⇒ 同样的 400
```

**校准需要一次成功响应，而第一次请求必然失败。** `/compact` 能救是因为它真把历史砍下去了，不是估算变准了。

## 已做的应急（父侧，2026-10-27 01:29）

`~/.thincoder/config.json` 的 `deepseek.maxTokens`：`393216` → **`65536`**（备份 `config.json.bak-20261027`；其余 18 个 provider 逐字未变，已核）。

**效果**：服务端合计 `723,272 + 65,536 = 788,808 < 1,048,576` ⇒ 能过。

**这不是修复**：守卫仍拿估算比 `limit`，估算仍低估——messages 涨到 ~850K 时同样会漏。

## 三条要修的

| # | 修什么 | 为什么 |
|---|---|---|
| 1 | **`_tokRatio` 持久化到会话档** | 现在它是进程内变量，恢复会话后必然回 1；而校准需一次成功响应 ⇒ 死锁 |
| 2 | **越窗 400 后自适应压一次再重试** | `markContextOverflow` 已能逐字识别三渠道报文，却只打标记不动作。服务端说了算，比估算可靠 |
| 3 | **估算公式 `ascii/4` → `ascii/3`** | 注释自陈「measured BPE is 1.5-2.5 chars/token」——中文按 1 字/token 是高估，但代码/JSON 主体 `/4` 是低估 |

## 边界

- 不动 `requestBudget` 的预算公式本身（`limit = window − reserve` 是对的）
- 不动压缩触发阈值 `threshold`
- 不改用户的 `maxTokens` 语义（应急改动已就位，本批不回收）

**重开记录**：2026-10-27 · 原收口 2026-10-27 · 理由 = VSC 恢复面遗漏——设计席以「VSC 走端壳自有循环、连样本都不产」为由登记边界，该理由经父侧实核为误：thincoder-vscode/src/agent.mjs 仅 10 行转口档（主循环 2026-09-29 已归核 runAgent），采样点 turn-loop.mjs:221 对双端同样生效

**重开原因续**：真正缺的是端侧写/读两处（run-helpers.mjs agentState() 不带 estimateSample · agent-state.mjs applySlotSessionState 不读回）。设计档 design:896 与 D-CC22（:957）所引 agent.mjs:387-397 系退役前旧坐标，同批收正。 · 操作者 = 主 agent
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-27（修正轮 4 + §6.16.9 实读收正已落（评审第 3 轮 8 条 + 第 4 轮 N1 must-fix / N2 两条均已处置；§4/§6 由主 agent 修正段承接））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.0 一句话

`limit` 公式是对的；错的是进 `limit` 的那个数。三条链分别修「基准」「校准能不能活过重启」「服务端说超了之后做什么」。

### 2.1 本批条目（覆盖 / 不在本批）

| # | 条目 | 判定摘要（可机判） | 设计回指 |
|---|---|---|---|
| R1 | 估算基准：ASCII 字符/token `4 → 3` | `estimateText("x".repeat(4000)) === 1334`；混排 `estimateText("x"*200 + "字"*200) === 267` | `design §6.17.1 链一` |
| R2 | 校准样本跨进程持久化 | 槽带合法样本 ⇒ `applySession` 后 `_tokRatio = num/den`；`est` 或 `key` 任一不符 ⇒ 回 `1` | `design §6.17.1 链二` |
| R3 | 越窗 400 自适应（压一次 + 重试一次） | 400 越窗 ⇒ 压缩恰 1 次、重试恰 1 次、成功即返回；二次仍越窗 ⇒ typed 错误、不再压、不截断 | `design §6.17.1 链三` |

**不在本批**：`requestBudget` 的 `limit = window − reserve` 公式 · 压缩触发阈值 `threshold` / `resolveCompactThreshold` · 摘要与 tail 预算本体 · 用户 `maxTokens` 取值（应急 `393,216 → 65,536` 已就位，本批不回收）· 按 400 报文反推收缩量（三渠道数字解析）· 跨会话共享样本池。

### 2.2 设计档落点

- `docs/core/design/CONTEXT-COMPACTION.md`：§6.17 原地改（`_tok` 形态加 `est` · 先例行 +3 行 · RB19 / RB22 夹具按新系数收正）+ 新增 §6.17.1（三条链 + 用例 RB24–RB33）。设计正文只在设计档，本段不复制（D2）。
- `test/RTM.md` §11：改 1 行 + 新增 1 行，见 2.7。

### 2.3 机制设计（结论 + 落点）

- **链一（基准）**：`_estimateSingle` 的 ASCII 除数改常量 `ASCII_CHARS_PER_TOKEN = 3`，同档导出 `ESTIMATOR_VERSION = 1`。落点 `thincoder-core/provider/rate.mjs:62-66`。
  依据 = 失败现场服务端 `723,272` ÷ 同刻状态栏 `491k` ≈ 1.47 ⇒ 实际约 2.7 字/token；`/3` 把残差压到约 1.1，余下由链二按模型吸收。CJK 仍 1 字/token（保守方向，不动）。
- **链二（持久化）**：`_tok` 增版本位 `est`；样本随**回合尾 `saveSession` 的 `fields` 对象**落槽（键名 `estimateSample`），恢复由 `applySession` 读回，四条校验（形状 / `est === ESTIMATOR_VERSION` / `key === tokenKey(provider)` / `max(1, num/den)`）。落点 `thincoder-core/session.mjs:128-146` · `thincoder-core/session-lifecycle.mjs:92` · `thincoder-core/token-window.mjs:158-175`。
  作用域 = 本会话（死锁就在单会话恢复这一面）；`/new` 清空与 `key` 变自清的现语义不动。
- **链三（自适应）**：`thincoder-core/agent/turn-loop.mjs:131` 的 `callModelTurn` 外包一层 catch——`kind === "context_overflow"` ⇒ 调守卫同一个压缩原子（抽为 `enforceContextFit(agent, ctx)`，现体 `thincoder-core/agent/run-stages.mjs:137-158`）压一次 ⇒ 重试同一回合一次。
  `agent._overflowRetried` 在 run 起点复位（`thincoder-core/agent/setup.mjs:65-66` 同处）；已置位再越窗 ⇒ 直接抛。排除面：`stage ∈ {compress, distill}` 不经本 catch（止血动作本身，压它 = 重入压缩机）；续写失败已在 `provider/core.mjs:317-323` 折进 `_warnings`。

### 2.4 受影响文件表（行数 = 2026-10-27 本批实测）

| 文件 | 现行行数 | 预估 Δ | 内容 |
|---|---|---|---|
| `thincoder-core/provider/rate.mjs` | 168 | +9 / −2 | 链一：`ASCII_CHARS_PER_TOKEN` · `ESTIMATOR_VERSION` · `_estimateSingle` |
| `thincoder-core/token-window.mjs` | 209 | +20 / −4 | 链二：`tokenKey()` 提出 · `recordTokenSample` 认 `est` · 样本读/写两个小函数 |
| `thincoder-core/session.mjs` | 275 | +2 | 链二写面：`fields.estimateSample` |
| `thincoder-core/session-lifecycle.mjs` | 421 | +14 | 链二读面：`applySession` 校验并写回（`/new` 清空不动） |
| `thincoder-core/agent/turn-loop.mjs` | 288 | +18 | 链三：catch + 重试一次 |
| `thincoder-core/agent/run-stages.mjs` | 334 | +14 | 链三：守卫段抽 `enforceContextFit`（守卫与自适应共用） |
| `thincoder-core/agent/setup.mjs` | 310 | +2 | 链三：`_overflowRetried` run 起点复位 |
| `thincoder-core/agent.mjs` | 106 | 0 | 构造字面量 `_tok: null` 不变 |
| `thincoder-core/provider/errors.mjs` | 175 | 0 | typed 错误已够用（三实数 + remedy） |
| `thincoder-core/provider/core.mjs` | 494 | 0 | 发送面净判不动 |
| `docs/core/design/CONTEXT-COMPACTION.md` | — | 已改 | §6.17 原地 + §6.17.1 |
| `test/RTM.md` | — | 改 1 行 / +1 行 | 见 2.7 |
| `docs/batches/2026-10-27-context-budget-underestimate.test.mjs` | 新建 | ~200 | 本批单测（收口前删除——RTM 7-4 的档位形态） |

### 2.5 验收对照（每条一个可跑判据）

单测档 = `docs/batches/2026-10-27-context-budget-underestimate.test.mjs`；跑法 `node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs`。

- **AC-R1**（→ R1）：该档内 R1 用例全绿——4000 ASCII ⇒ `1334`；200 ASCII + 200 CJK ⇒ `267`；纯 CJK 400 字 ⇒ `400`（零回归）。
- **AC-R2**（→ R2）：该档内 R2 用例全绿——写面（`saveSession` 后槽 JSON `estimateSample` 与内存同值）、读面（`applySession` 后 `_tokRatio` = `num/den`）、三条退化（无 `est` / `key` 不符 / 损坏值 ⇒ 回 1 且不抛）。
- **AC-R3**（→ R3）：该档内 R3 用例全绿——400 越窗 ⇒ 压缩 1 次、重试 1 次；二次越窗 ⇒ 抛 `context_overflow`、压缩不再增；`stage:"compress"` 的 400 不触发自适应。
- **AC-R4**（→ R2+R3 合面）：同一进程内模拟「采样 → `saveSession` → 新 agent `applySession`」三步后，首请求估算支 = 未持久化时的 `num/den` 倍（可断言数值）。
- **AC-R5**（→ R3 可见性）：强制压缩触发既有 `onCompressStart` / `onCompress` 回调各 1 次（不新增静默路径）。
- **AC-R6**（→ 全批）：`node --check` 七个改动档全通过；`node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs` 全绿（读数写进 §5）。

### 2.6 关键决策（含否决）

- **D1 ASCII 系数取常量而非配置项**：估算口径是产品内部量，不是用户参数（零新配置面，同 `docs/core/design/ADVISOR-GUARDS.md` §9）。否决「可调」：会多一个没人会调、却要进 `/config` 面的键。
- **D2 样本存会话槽而非独立档**：复用既有槽写守卫 / 轮转 / 恢复面；样本丢一次只退化到旧值或 1，不是需要即刻落盘的安全项。否决「每次采样落盘」（每模型调用一次写盘 + 绕开守卫 = 新写面）与「独立校准档」（新生命周期：GC / 损坏 / 多实例并发，换来的只是不想要的跨会话共享）。
- **D3 样本带 `est` 版本位**：链一改了估算公式 ⇒ 旧样本的 `den` 与新估算不同量纲，直接复用会把估算抬高两次（过压）。版本位让口径变更自清，不需要第二个迁移分支。
- **D4 链三压整压一次、不按报文反推**：压缩机产出有确定上界（tail ≤ 窗口 15% + 摘要 ≈1K），一次足够把 723K 压回线内；反推要给三渠道各写数字解析（只有 OpenAI 兼容面有逐字样本），解析失败还要一条降级支。否决「多次重试」：第二次仍越窗说明压缩解不了，再压只是重复付费。
- **D5 链三落 turn-loop 而非 provider 层**：`chat()` 入参没有 agent（`provider/core.mjs:84`），拿不到历史与压缩机；turn-loop 是唯一同时握有回合调用与压缩上下文的位置。
- **D6 死循环守卫用 run 级旗而非计数**：一次就是全部额度；计数会引入「N 次」这个无现场数字。

### 2.7 RTM 增量（`test/RTM.md` §11）

- **改写 11-4**（本批打破其断言）：原句「provider 桩直接回 400 越窗报文 ⇒ 不重试（请求恰 1 次）」——本批后应为两半：① 首请求 400 越窗 ⇒ 强压恰 1 次 + 重试恰 1 次且 200；② 重试仍 400 越窗 ⇒ 抛 `kind = context_overflow`、`retryable === false`、压缩不再增、不截断。
- **新增 11-5**（缺行）：恢复带样本的会话（`estimateSample` 在槽）⇒ 首请求按学到的比值判，估算 `491K × 1.47` 越 `limit` ⇒ 触发压缩而非吃 400。业务可观察 = 重启后继续大会话不再 400。
- **11-1 / 11-2 / 11-3**：断言面（守卫强压一次 / 三实数 / absent 地板）零改；它们喂的是字面估算值，不经 `estimateText`，系数改动不影响其数值。
- 计数：CLI 端 35 行 → 36 行（逐节点数：3+3+3+3+3+5+5+2+1+3+4 = 35；窗口 50–100 内）。

### 2.8 边界

不改 `requestBudget` 公式、压缩阈值、摘要本体、提示词面、VSC 设置面板、`/compact` 命令语义；不新增配置项；不改用户 `maxTokens`。

### 2.9 上抛项

1. **[上抛·待裁] 需求档条目缺位**：`docs/core/requirements/CONTEXT-COMPACTION.md` §2.1 现只到 F-CC5，三条链无对应条目 ⇒ 三方链（§2 ↔ 设计 AC ↔ 需求档）当前断在需求端。拟落三条（编号取该档下一个 F-CC 序位，由主 agent 定）：
   - 估算基准贴实测（判定句 = AC-R1 两条等式）。
   - 校准样本跨进程复用（判定句 = 恢复后首请求按样本比值判；`est` / `key` 不符即弃）。
   - 越窗 400 自适应一次（判定句 = 压缩 1 + 重试 1；二次越窗即抛，不截断）。
   主 agent 落到需求档后，本批 AC 的「需求回指」一列改指该三条。
2. **[上抛·知会] 用户可见读数会跳高约 1/3**：升级后状态行 ctx% 与 `context` stats 的估算值上升（如 491K → 约 654K），压缩触发更早。这是收正，但用户会看见数字变了——建议在交付说明里点一句。
3. **[上抛·知会] 应急配置不回收**：`deepseek.maxTokens` 仍是 `65536`（父侧 01:29 改），本批按 §1 边界不动；本批上线后该值不再是「能否过」的前提，是否回调到规格值由用户另定。

### 修正轮（评审 §3 第 1 轮 12 条，逐条处置）

读法：本段是 §2 的增量面——§2 上方各节为 append-only，被本段取代的表述以本段为准。

| # | 处置 | 落点 |
|---|---|---|
| 1 🔴 | §6.3 的系数句纳入本批原地改：由「文本 ASCII/4 + 非 ASCII/1」改为「公式单源 = §6.17.1 链一」+ 常量式（`Math.ceil(ascii / ASCII_CHARS_PER_TOKEN) + nonAscii`，`ASCII_CHARS_PER_TOKEN = 3`），并写明「本节不另写系数」。§2.2 登记面增量 = 设计档两处原地改（§6.3 · §6.16.9）+ 新增 §6.17.1；§2.4 登记面增量 = 设计档行「§6.3 系数句 · §6.16.9 全表刷新」，见下「§2.4 增量」 | `design §6.3:150` · `design §6.17.1 链一:882` |
| 2 🟡 | 需求条目已落：状态行改指 F-CC6–F-CC8；§2.9 第 1 条（需求档条目缺位）**已解决，作废**；设计档三处需求指针补到 F-CC1–F-CC8；AC 需求回指列见下「AC 回指改指」 | `design:42` · `design:350` · `design:410` · 本段「AC 回指改指」 |
| 3 🟡 | 取第二选项：§2.8 登记「VSC 恢复面不在本批」+ 理由。理由两条：① VSC 不经核 `applySession`（`thincoder-vscode/src/extension/panel-session.mjs:94` `activeLines` 槽直读组装机读线）；② VSC 走端壳自有循环（`thincoder-vscode/src/agent.mjs:387-397`），采样点住核循环（`thincoder-core/agent/turn-loop.mjs:199`）⇒ VSC 面连样本都不产，只补读面会读到一个永远为 1 的比。VSC 循环接 `recordTokenSample` 的那批同批带读面 | `design §6.17.1 链二端面:896` · 本段「§2.8 增量」· `design §6.16.9` 表新行（`panel-session.mjs` 329 / Δ 0） |
| 4 🟡 | 查清：**流内帧路径不命中本链**，因为属性名不同——流内出口写 `errorKind`（`thincoder-core/provider/responses.mjs:38` `e.errorKind = cls.kind`、`:97` 同形），HTTP 400 与本地净判写 `kind`（`thincoder-core/provider/errors.mjs:171` `markContextOverflow`、`:148` `contextOverflowError`）。故本链按 `error.kind` 判不进入流内帧错误，也就不存在「已流出再重放」；同时给出实施轮判据：若上游任一环把 `errorKind` 归一成 `kind`，本链须加「未流出才重试」（判据 = 该次请求已产出 content 长度 > 0 ⇒ 不压不重试、直接抛） | `design §6.17.1 链三:910` |
| 5 🟡 | RTM `11-5` 定形见下「11-5 最终断言形」——点名夹具 `maxTokens: 393_216`（⇒ `limit` 606,784），并把断言写成对具名 `limit` 的不等式，不再用「491K × 1.47 越 limit」这种依赖现配置的算术 | `test/RTM.md` §11 行 11-5（父侧落笔；断言形由本段给出）|
| 6 🟡 | 三问块补 6 条：`ASCII_CHARS_PER_TOKEN`（none found）· `ESTIMATOR_VERSION`（none found）· `estimateSample`（none found，附 `fields` 键集实读）· `tokenKey()`（existing but 抽出，`token-window.mjs:168`）· `enforceContextFit()`（existing but 抽出，`run-stages.mjs:141-162`）· `_overflowRetried`（none found） | `design §6.17 三问块:840-845` |
| 7 🟡 | 校验① 补现场 + 复现路径（不删分支）：现场 = 槽档是盘上用户数据，`applySession` 已对 `history` 逐字段防御（`thincoder-core/session-lifecycle.mjs:99`）；复现 = 把槽 JSON 的 `estimateSample` 改成 `{"key":"openai:x","num":"NaN","den":0}`（槽路径 = `slotPath(cwd, slot)`）⇒ 恢复 ⇒ 比回 1、会话照常恢复、不抛 | `design §6.17.1 链二校验①:894` |
| 8 🟡 | §6.16.9 全表按 2026-10-27 实读刷新（23 档逐值实测 + 新增 4 行），表头口径改「现况 = 本机实读 2026-10-27」、Δ 改「本批预期」。刷新后与 §2.4 逐值同源（§2.4 不再自持读数：见「§2.4 增量」） | `design §6.16.9:611-614` 及表体 |
| 9 🔵 | AC-R4 补夹具与期望数；AC-R2 的比写法定形为 `max(1, num/den)`，需求档 F-CC7 判定句同步（已获授权范围：仅此半条） | 本段「AC 回指改指」· `requirements §2.1 F-CC7:44` |
| 10 🔵 | RB24 期望值只留 `1334（ceil(4000/3)）`，「改前 1000」移出设计档——记在本段：改前系数 `/4` ⇒ `estimateText("x".repeat(4000))` = 1000 | `design RB24:919` · 本段 |
| 11 🔵 | §6.17.1 链三记下 run 级旗的后果：同一 run 内第二次独立越窗不再自愈、直接抛 typed 错误（`/compact` 后可继续）；理由 D6 不变 | `design §6.17.1 链三:908` |
| 12 🔵 | §6.17.1 链三补安全点不变量：切点要求末尾 role ∈ {user, tool}，该不变量由循环门 `thincoder-core/agent/turn-loop.mjs:121-122` 背书；循环形状若改本链切点安全性一并失效，审计锚 = 该门 | `design §6.17.1 链三:911` |

**§2.4 增量（读数单一化）**：受影响文件表的行数读数单源改为 `design §6.16.9`（本次已刷新到 2026-10-27）；§2.4 上方表格里的读数与它逐值同源，不再各自维护。§2.4 另加两行登记面：`docs/core/design/CONTEXT-COMPACTION.md` 的 §6.3 系数句（原地改）与 §6.16.9（全表刷新）。

**§2.8 增量（边界）**：VSC 恢复面不在本批。理由见处置 #3；恢复条件 = VSC 端壳循环接 `recordTokenSample` 的那批，同批带读面。

**AC 回指改指**（原「设计回指」列全部补需求条目）：

| # | 条目 | 判定摘要（可机判） | 需求回指 | 设计回指 |
|---|---|---|---|---|
| R1 | 估算基准：ASCII 字符/token `4 → 3` | `estimateText("x".repeat(4000)) === 1334`；混排 `"x"×200 + "字"×200 === 267` | F-CC6（`requirements:41-42`） | `design §6.17.1 链一` |
| R2 | 校准样本跨进程持久化 | 槽带合法样本 ⇒ `applySession` 后 `_tokRatio = max(1, num/den)`；`est` 或 `key` 任一不符 ⇒ 回 `1` | F-CC7（`requirements:43-44`） | `design §6.17.1 链二` |
| R3 | 越窗 400 自适应（压一次 + 重试一次） | 400 越窗 ⇒ 压缩恰 1 次、重试恰 1 次、成功即返回；二次仍越窗 ⇒ typed 错误、不再压、不截断 | F-CC8（`requirements:45-46`） | `design §6.17.1 链三` |

**AC-R2 定形**（原句写 `_tokRatio = num/den`，与设计下界分叉 → 收正）：合法样本（含 `num/den < 1`）⇒ `_tokRatio = max(1, num/den)`；下界 1 的理由 = 比 < 1 会把整条估算缩小、重开「该压没压」，属保守方向不可取。三条退化（无 `est` / `key` 不符 / 损坏值）⇒ 回 1 且不抛。

**AC-R4 定形**（原句无数，补夹具与期望）：夹具 = 采样 `num = 2668` / `den = 1334`（`_tokRatio` = 2.0）。三步 = ① 采样 ⇒ ② `saveSession` ⇒ ③ 新 agent `applySession`。期望：恢复后同一 history 的估算支 = `2 ×` 未持久化时的值（即 2,668 vs 1,334，逐值可断言）。

**11-5 最终断言形**（替换原「491K × 1.47 越 limit」）：

- 夹具：会话槽带 `estimateSample`（`num = 723_272` / `den = 491_000` ⇒ 比 ≈ 1.473）+ provider `maxTokens: 393_216`（**不得用现盘 `65_536`**——应急值下 `limit` = 934,464，该行照旧算术会红）。
- 该夹具下 `limit` = `1_000_000 − 393_216` = **606,784**；恢复后首请求估算支 = `491_000 × (723_272/491_000)` ≈ **723,272**。
- 断言：`est > limit`（723,272 > 606,784）成立 ⇒ `stage:"compress"` 恰 1 次 ∧ 回合请求零 400；不写任何依赖现配置的乘式。

### 实施回抛三处口径漂移 —— 收正（2026-10-27）

依据 = §5.6（实施轮上抛）+ 父侧派单三处。落点全在设计档，本批代码零改。

| # | 上抛项 | 处置 | 落点 |
|---|---|---|---|
| 1 | `enforceContextFit` 参数形 | 改三参形 `(agent, ctx, { forceCompact })`，写明第三参语义（`true` ⇒ 跳过前置估算判据 `usage.total > budget.limit` 直接强压一次；缺省 `false` ⇒ 守卫面原行为逐字不变）；同处收正坐标 `run-stages.mjs:137-158` → `:158`、`turn-loop.mjs:131` → `:55-72`（两个调用点 `:57` / `:70`） | `design §6.17.1 链三:905-907` · `design 三问块:846` · `design 先例行:832` |
| 2 | 两个新名进三问块 | 补 `tokenSampleOf()`（`token-window.mjs:188`，消费者 = `saveSession` 的 `fields.estimateSample`，`session.mjs:150`）· `restoreTokenSample()`（`token-window.mjs:202`，消费者 = `applySession` 两出口 `session-lifecycle.mjs:215` / `:221`）。同时把 `tokenKey()` 行由「现体内联于 `:168`」改为现体 `:159`——该名已抽出，旧表述是改前态 | `design 三问块:843-845` |
| 3 | §6.16.9 Δ 与实读漂移 | 全表按 2026-10-27 收官实读刷新现况列；Δ 列改为**本批实际增量**（预测值不再保留，表头注明「收官以实读为准」） | `design §6.16.9:611-639` |

**第 3 项实读（`wc -l` 口径，本机 2026-10-27）**：`rate.mjs` 168→**176**（+8）· `token-window.mjs` 209→**247**（+38）

`session.mjs` 275→**280**（+5）· `session-lifecycle.mjs` 421→**426**（+5）· `turn-loop.mjs` 288→**310**（+22）· `run-stages.mjs` 334→**355**（+21）· `setup.mjs` 310→**312**（+2）· `agent.mjs` 106（0，零改）· 本批单测档 **278**。其余 15 行实读与刷新前逐值相同（本批未触及）。

**读数分歧一处**：§5 记 `session-lifecycle.mjs` 实读 427；本次 `wc -l` 实读 **426**——该档以换行结尾，read 工具的「行数」把尾随换行记成第 427 行。设计档按表头声明的 `wc -l` 口径记 **426**，Δ = +5。

**顺带收正的坐标**（同属 §5.6 第一条漂移，与第 1 项同段）：`rate.mjs` `_estimateSingle` `:62-66` → `:70-74` · `session.mjs` `fields` `:128-146` → `:128-150` · 采样点 `turn-loop.mjs:199` → `:221`（两处）。`session-lifecycle.mjs:92` 对过盘面，原值正确、未改。

**一条旧判断被实施否证**：§2.7「11-1 / 11-2 / 11-3 断言面零改」不成立——集成夹具 `test/integration/context-overflow-guard.test.mjs:36` 的 `asciiTokens(n) = "x".repeat(n * 4)` 经 `estimateText` 消费系数，`/3` 后同夹具估算变 ×4/3。父侧已按 §5.6 末条修夹具（`n*4 → n*3`、摘要桩 `2_800_000 → 2_100_000`）并把 RTM §11 落为 11-4a / 11-4b + 11-5。本批此后不再有「断言面零改」的表述。

### 已知边界（实施上抛两条取舍，评审已认）

两条均按设计字面实现、未擅自加门，登记为已知边界，代码不改：

1. **压缩失败仍重试一次**：`enforceContextFit` 把摘要失败并进既有失败链后只按「压后估算 > `limit`」再判。在「估算偏低 + 服务端先 400」这一本批目标场景里，压缩失败 ⇒ 历史未变 ⇒ 再判落线下 ⇒ 仍重试一次 ⇒ 必然再吃一次 400 才收束（每 run 至多多一次注定失败的请求；用户先见「压缩失败」再见「上下文超限」）。这是 §6.17.1 链三「重试一次」的字面语义；把重试绑在「压缩确实重建历史」上是新判据，须另立批次裁决。
2. **系数 4→3 的两个连带面**：同一 `estimateRequestTokens` 还喂 ① TPM/RPM 闸（`provider/rate.mjs:103` 告警支 · `:107` 置 `tpm = null` · `:117` 超 `effectiveTpm` ⇒ 告警 + 记账 + 直接放行）——`tpm` 落在旧 / 新估算之间的渠道整段失闸；② prune 门槛与 tail 预算（`token-window.mjs:224` `PRUNE_MIN_TOKENS = 200`，判据 `:242`；`tailBudgetTokens` `:54`，消费于 `context.mjs:173` / `:241`）——prune 合格集变大、tail 更早收紧。两处判据与配置面零改，方向均偏保守（更早压 / 更早 prune）；设计档「读数面影响」已补记这两处，不再记为零改。

**补记读数一处（上节计数对账）**：`thincoder-vscode/src/extension/panel-session.mjs` 现况由 329 收正为 **328**（本机 `wc -l` 实测；本批未触碰该档——属旧读数偏差，随本次刷新收正，Δ 仍为 0）。故上节「其余 15 行」= 未受影响行；§6.16.9 共 25 行 = 8 行本批改动 + 本行旧读数收正 + 15 行未受影响 + 1 行批内单测档（278，收口删）。

### 修正轮 2（批档重开 · VSC 恢复面判断推翻）

依据 = §1 重开记录 + 父侧实核三条（本席逐条对盘复核，落点见下表）。落点全在设计档；本批代码未动（coder 落）。

**原判断错在哪**：链二端面把「VSC 走端壳自有循环」当事实，由此推出「VSC 不产样本 ⇒ 只补读面只会读到恒 1 的比 ⇒ 整面不值得补」，并登记为边界。该前提引的是退役前旧坐标（`thincoder-vscode/src/agent.mjs:387-397`），而该档现只有 10 行（仅转口 `ContinueError`）——前提不成立，结论与边界登记一并作废。

**实核三条**：

| # | 事实 | 证据（本席实读） |
|---|---|---|
| ① | VSC 无自有循环，主循环归核 | `thincoder-vscode/src/agent.mjs:2-8`（退役头注「depth-0 循环本体归核」）· `panel-turn-loop.mjs:230` `runAgent(agent, turnInput, callbacks, coreOpts)` |
| ② | 采样点全仓唯一，双端同一处 | `recordTokenSample` 唯一调用点 = `thincoder-core/agent/turn-loop.mjs:221` |
| ③ | 真实缺口 = 端侧写 / 读 | 写 `run-helpers.mjs:76` `agentState()` 六键无 `estimateSample`；读 `agent-state.mjs:89` `applySlotSessionState` restore 支无 `_tok` 读回 |

**修正后的补法（本批补上，不再登记边界）——三处，不是两处**：

| # | 落点 | 改法 | 依据 |
|---|---|---|---|
| ① | `thincoder-vscode/src/agent/run-helpers.mjs:76` | `agentState()` 增 `estimateSample: tokenSampleOf(agent)` | 值进 `extra`（`panel-callbacks.mjs:269` `{ seed: slotStamp, ...agentState }`） |
| ② | `thincoder-vscode/src/extension/panel-session-write.mjs:71-122` | `saveLines` 槽对象增显式键 `estimateSample: extra.estimateSample !== undefined ? extra.estimateSample : (existing.estimateSample ?? null)` | 该函数**逐键构造**槽对象、无 `...extra` 泛 spread（实读 `:71-122`）⇒ 只加 ① 值不落槽 |
| ③ | `thincoder-vscode/src/agent/agent-state.mjs:120-124` | restore 支调 `restoreTokenSample(agent, slot?.estimateSample, provider)`；`provider` 由装配面第三参传入 | `applySlotSessionState` 住 `setup.mjs:193`，`agent._provider` 到 `:228` 才落 ⇒ 该点取不到 agent 上的 provider |

② 是父侧「这两处各加一行」之外的一处：不加它，①写出的值不落槽，端面仍不生效。已按实读入设计档（`design §6.17.1 链二端面`）。

**§2.4 增量**：受影响文件表加三行（`run-helpers.mjs` 87 / +1 · `panel-session-write.mjs` 151 / +1 · `agent-state.mjs` 159 / +1；读数 = 本机 `wc -l` 2026-10-27）；`panel-session.mjs` 行改述（链二端面不在此档）。

**§2.8 增量**：原「VSC 恢复面不在本批」一条**删除**（不再成立）；本批边界 = 不改 VSC 设置面板、不改 `applySlotSessionState` 的槽字段合并语义、不加第二个样本来源。

**AC 增量**：AC-R7（→ R2 端面）：RB34 全绿——写① `agentState` 取值与 `tokenSampleOf` 逐值同（空样本 `null`）· 写② `saveLines` 落槽 JSON 同值 · 读③ restore 后 `_tokRatio = max(1, num/den)`，`restore:false` / 坏样本 ⇒ 保持 1 不抛。跑法同 AC-R6 单测档。

**设计档落点（已改）**：`design §6.17.1 链二端面:902-903`（端面 + 三处补法）· `design D-CC22:966`（三站点 → 两站点 + 端侧零独立构造点）· `design §6.10 #9:252-254`（同一旧坐标收正，见报告）· `design §6.16.9:638-641`（`panel-session` 行改述 + 三新行）· `design 三问块:847-848`（两函数消费者补 VSC 面）· `design RB34:937`。

### 修正轮 3（评审 §3 轮次 3 · 8 条逐条处置）

读法同前：本段是 §2 的增量面，被本段取代的表述以本段为准。落点全在设计档 + 本段；代码零改，`test/RTM.md` 零改（§4 / §6 归主 agent）。

| # | 处置 | 落点 |
|---|---|---|
| 2 🟡 | 取**选项①**（保留三目、具名真实键缺席调用点）。现场 = 五处不携 `agentState` 的 `saveLines` 调用：`panel-turn-loop.mjs:275`（`{ seed: slotStamp }`）· `panel-turn-stages.mjs:134`（`{ seed: slotStamp, title? }`）· `suspension.mjs:315`（`{}`）· `timer-watch.mjs:36`（不传 `extra`，取 `panel-chat.mjs:342` 缺省 `{}`）· `panel-messages.mjs:259`（`{ activeProvider, activeModel }`——切模型保存）。选项②**否决**并写明理由：这五处手里没有 agent，单表达式会写 `undefined` ⇒ 整档覆盖时键随序列化消失、槽内既有样本被抹掉（该函数注释自陈 full-overwrite，`panel-session-write.mjs:48-51`）。两半的语义同时写明：键在场 ⇒ 内存即权威（空样本 `null` 照写 = `saveSession` 同语义），键缺席 ⇒ 保留槽值，跨模型旧样本由校验③ 自清 | `design §6.17.1 链二端面:906` · `design RB34:940` |
| 3 🟡 | 签名变更闭合三点：**调用点全集 = 1 处**（`thincoder-vscode/src` 全量 grep 仅 `setup.mjs:193`；`thincoder-vscode/test` 无直接调用）· **`provider` 缺省落值 = 比 1、不抛**（`tokenKey(undefined)` 经两处 `?.` 兜底产出 `"openai:"`，与采样期写入的 `"<format>:<model>"` 恒不等 ⇒ 校验③ 判不符；`restoreTokenSample` 入口已先置 `_tok = null` / `_tokRatio = 1`）· 忘传第三参的后果 = 只退化到未校准档 | `design §6.17.1 链二端面:906` |
| 4 🟡 | AC-R6 改**十档**（7 核 + 3 端）；AC-R7 跑法写实成两段，② 的可导入性按实读判（见下「AC-R6 / AC-R7 定形」） | 本段 |
| 5 🟡 | §2.7 补端面增量 = **不落 RTM 行**，两条理由 + 一条登记（见下「§2.7 端面增量」）；并对 `requirements:100` 的「补测触发」口径**上抛**（见「上抛项」） | 本段 |
| 6 🟡 | 三问块 `estimateSample` 行补第二写入面：VSC 槽对象键集（`panel-session-write.mjs:71-122` 逐键 18 键 + `...existing`）无同名键；两端消费者逐点给出 | `design 三问块:848` |
| 7 🟡 | 先例行块补第 4 条端面条目（先例 ∥ 对齐 ∥ 偏离）；块标题由「本批三件」改为「本批四条 · 前置三条」+ 一句点明前三条属 D-CC32（读不出哪三条是本批的问题就此消解） | `design 先例行:828-838` |
| 8 🟡 | `activeLines` 按实读择一：`:54-55` / `:56` 是**分档前旧坐标**（现档 328 行，`panel-session.mjs` 2026-09-18 四档拆分后行号漂移）；唯一定位 = `:94`（函数声明）· 归并点 `:105`（`contextHistory` 定线 `:101` 后、`:106` 返回前）。§6.16.9:638 与 §6.17.1:906 的 `activeLines:94` 是函数坐标，与之一致，保留 | `design §6.10 #8:243` |
| 9 🔵 | 用例表标题 RB24–RB33 → **RB24–RB34**；§2.2 落点同收正（本段为准）；§2.4 单测档行 `~200` → **278**（实测）+ RB34 增量（预计）；§6.16.9 表头 Δ 口径改为「已实施行取实读、未实施行标 `预计`」，三行端档 Δ 写 `预计 +1`，`design:639` 的 TODO 句删除 | `design:926` · `design:611` · `design:639-642` · 本段 |

**设计档另一处顺带收正（一致性面 · 同段内自相矛盾）**：先例行「校准样本持久化」条原写 `session.mjs:128-146`，而同一 § 的链二写面与三问块均为 `:128-150`（修正轮 2 已收正过的坐标，该条漏改）⇒ 按 `:128-150` 统一。`design 先例行:836`

### AC-R6 / AC-R7 定形（替换 §2.5 原两条）

- **AC-R6**（→ 全批）：`node --check` **十档**逐档 OK——7 核（`provider/rate.mjs` · `token-window.mjs` · `session.mjs` · `session-lifecycle.mjs` · `agent/turn-loop.mjs` · `agent/run-stages.mjs` · `agent/setup.mjs`）+ 3 端（`thincoder-vscode/src/agent/run-helpers.mjs` · `thincoder-vscode/src/extension/panel-session-write.mjs` · `thincoder-vscode/src/agent/agent-state.mjs`）；`node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs` 全绿。读数逐条进 §5。
- **AC-R7**（→ R2 端面，RB34）：跑法**两段**，按可导入性实读分：
  - **可与 AC-R6 同命令**：① `run-helpers.mjs` 与 ③ `agent-state.mjs` 的依赖面只有 `@thincoder/core/*`（`run-helpers.mjs:11-14` · `agent-state.mjs:11-14` 实读），批内单测档直 import。
  - **② `panel-session-write.mjs` 需单独一条跑法**：其传递依赖两处 `import * as vscode from "vscode"`（`panel-messages.mjs:5` · `panel-session.mjs:30`）⇒ 无宿主不能直 import。实施轮二选一并记读数：ⓐ 批内单测档前置注册 `vscode` 桩，并入 AC-R6 同一命令（**推荐**——不依赖未读面）；ⓑ 端侧自有跑法 `cd thincoder-vscode && node test/run.mjs`（`thincoder-vscode/package.json:151`）。
  - **未验证**：该端 `test/run.mjs` 内部如何解析 `vscode` 裸名——本席未读该档，故 ⓑ 只作备选。
  - 判定：RB34 的三处断言（写① 逐值同 · 写② 落槽同值且键缺席保留 · 读 比 / 坏样本 / `provider` 缺省）各有一条实读读数进 §5。

### §2.7 端面增量（RTM 侧）

- **本批不加端面 RTM 行**，两条理由：① 该端无集成层可跑——`test/RTM.md:138` 自陈「本端集成层尚未建立——本端集成层尚未建立；故事节随首个用例设立」；加行只留一条永假的「待执行」；② 端面业务可观察结果（面板重启继续大会话不再吃 400）在本批由**同一比 + 同一守卫**承接，RB34 已逐值断言其三个输入面（写① / 写② / 读③）。
- **登记（非本批可落）**：VSC 集成层建立后补一条端面行——业务可观察 = 面板重启继续大会话零 400 · 入口 = 面板恢复 · 编号在该端首节先行。本批**不预设编号**（RTM 现在该端零行，预设 = 造一个没有 runner 的号）。
- **上抛**：需求档 `requirements:100` 写「补测触发 = 该面下次被触碰」，本批正是那次触碰 —— RB34 是批内单测（收口即删），不构成该档字面要求的**留存**测试。是「RB34 满足」还是「须建 VSC 永久测试面」，属需求层裁定，见下上抛项（不由设计席自决）。

**§2.2 / §2.4 读数收正（本段为准）**：§2.2 设计档落点的「用例 RB24–RB33」⇒ **RB24–RB34**（含端面用例）；§2.4 单测档行「~200」⇒ **278**（2026-10-27 实测）+ RB34 增量（预计）。

### 上抛项（本批新增）

1. **[上抛·待裁] 需求档「补测触发」口径**：`requirements:100` 的「该面下次被触碰 ⇒ 补测」在本批被触发，而端面有两条事实——① VSC 无集成层（`test/RTM.md:138`）；② 本批能留的只有收口即删的 RB34。请裁：RB34 是否满足该条，或须另立一批为 VSC 建永久测试面（后者超出本批 §4 批准面）。本席不预设，§2.7 已按「不加 RTM 行 + 登记」落笔。
2. **[上抛·知会] 评审 #1（🔴）不在本席写域**：§4 的「批准覆盖 / 不覆盖 / 实施面」仍是七档 + 不覆盖 VSC，§6 已知边界表仍有「VSC 走端壳自有循环」那条被推翻的前提——两处均在主 agent 段，本次零改。

**修正轮 3 勘误（引文逐字）**：上段「§2.7 端面增量」引 `test/RTM.md:138` 的句子多写了一个重句——该行逐字为「**尚无集成用例**——本端集成层尚未建立；故事节随首个用例设立（编号先行：先定 RTM 编号，再落用例标题 `test('<编号> …')`）。」引文不重、结论与落点不变。

### 修正轮 4（评审 §3 轮次 4 · N1 must-fix + N2 措辞）

读法同前：本段是 §2 的增量面，被本段取代的表述以本段为准。落点 = 设计档 + 本段；§1 / §3 / §4 / §6 / `test/RTM.md` / 代码均未动。§4 修正 2（十一档）由父侧已落，本席零改。

| # | 处置 | 落点 |
|---|---|---|
| N1 🔴 must-fix | 端面补法 **三处 → 四处**：④ 装配面 `thincoder-vscode/src/agent/setup.mjs:193-197` 的第三参对象 `{ cfg: cfgBag, restore }` 增 `provider`（形参在作用域 `:90`，原位一参）。**为什么必须在内**（已写进设计档）：`provider` 是第三参的新键，不传 ⇒ `tokenKey(undefined)` ⇒ 校验③ 恒不符 ⇒ 端比恒 1 ⇒ 端面修复在生产面静默失效；而 RB34 自己直传 `provider` 仍绿（绿着漏） | `design §6.17.1 链二端面:907` |
| N1-② | §6.16.9 加行 `thincoder-vscode/src/agent/setup.mjs` **322 / 预计 0**（`wc -l` 实读 2026-10-27；原位一参不动行数） | `design §6.16.9:642` |
| N1-③ | RB34 读半改跑法：③ 直调**只证读回逻辑、不证 ④ 接线**；④ 走**结构机检**（读 `setup.mjs` 源文，断言 `applySlotSessionState(` 调用段含 `provider`）。退一步的两条理由写在设计档表后（`hydrateRun` 是全装配、非密封；该档 `:16` 引的 `setup-tooltable.mjs` 直接 import `vscode`） | `design RB34:941` · `design 表后:943-947` |
| N2a 🔵 | 「本批已补（三处…）」→「已纳入本批（端侧四处待落）」：码未动。**§6 归父侧，本席未改** | 待父侧落（§6 修正段「已知边界（修正后）」表 VSC 端面行） |
| N2b 🔵 | §2 上抛项 2 的「两处均在主 agent 段，**本次零改**」**作废**：§4 修正 / §4 修正 2 / §6 修正均已落（父侧），该句字面已否 | 本段 |

**读数收正（一致性面 · 当场修）**：§6.16.9 的 `panel-session-write.mjs` 行 **151 → 150**。按表头声明的 `wc -l` 口径实读 150（本机 2026-10-27）；151 = read 工具把尾随换行记成第 151 行——与 `session-lifecycle` 426/427 那次同一问题。

**同批四端档实读**：`run-helpers.mjs` 87 · `panel-session-write.mjs` 150 · `agent-state.mjs` 159 · `setup.mjs` 322（均 `wc -l`，2026-10-27）。

**AC-R6 / AC-R7 再定形（取代本段之前的「十档 / 两段跑法」）**：

- **AC-R6**（→ 全批）：`node --check` **十一档**逐档 OK——7 核（`provider/rate.mjs` · `token-window.mjs` · `session.mjs` · `session-lifecycle.mjs` · `agent/turn-loop.mjs` · `agent/run-stages.mjs` · `agent/setup.mjs`）+ **4 端**（`thincoder-vscode/src/agent/run-helpers.mjs` · `thincoder-vscode/src/extension/panel-session-write.mjs` · `thincoder-vscode/src/agent/agent-state.mjs` · `thincoder-vscode/src/agent/setup.mjs`）；`node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs` 全绿。读数逐条进 §5。
- **AC-R7**（→ R2 端面，RB34）：① ③ 直 import、与 AC-R6 同命令；② `panel-session-write.mjs` 需 `vscode` 桩或端侧跑法（同前段，未变）；**④ 不进 import 面**——断言对象是源文，无宿主依赖。
- **④ 的机检判据（防误绿）**：断言对象 = `applySlotSessionState(` 起、括号配平到调用结束的整段文本，断言其含 `provider`。**不得退成全档 grep**——`provider` 在该档另有 `:90`（`hydrateRun` 形参）/ `:216`（`buildToolTable` 入参）/ `:228`（`agent._provider = provider`）三处 ⇒ 全档 grep 恒绿、测不出漏接。调用段内只有 `agent` ∥ 第二参对象（`slot` / `engState` / `planModeOverride`）∥ 第三参对象，前三者不含 `provider` ⇒ 段内有即必在第三参。

**三问块**：④ 未引入新名（`provider` 是 `hydrateRun` 既有形参 `:90`）⇒ 零增。

**一处与父侧读数分歧 [上抛·知会]**：父侧给「实读行数 + `预计 +1`」；本席按改法实算 **预计 0**——`:197` 那行已存在（`}, { cfg: cfgBag, restore })`），增一参是同行原位改，行数不动。表里写「预计 0」并沿用表头既有口径「收官以实读为准」；若父侧要保留 +1（例如实施时换行书写），一句话改回。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

### 设计评审结论（2026-10-27）

评审对象 = 三条链（估算基准 ascii/4→3 ∥ `_tokRatio` 跨进程持久化 ∥ 越窗 400 自适应）· 批档 §2 · design §6.17/§6.17.1 · 需求档 F-CC6–F-CC8 · RTM §11 增量。
已读全量：批档、design（955 行）、需求档。行数抽检三档（`rate.mjs` 168 · `token-window.mjs` 209 · `agent.mjs` 106，wc-l 口径）与批档 §2.4 逐值相符。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements / 文档归属 | 🔴 | 估算公式在设计档里出现两份互相矛盾的现行表述：`design:150`「估算公式统一（取 CLI 精细版）：文本 ASCII/4 + 非 ASCII/1」vs `design:872`「常量 `ASCII_CHARS_PER_TOKEN = 3` 与公式同住本档」。批档自己的落点计划（`batch:85`）只列「§6.17 原地改 … + 新增 §6.17.1」，§6.3 的规范句未进改动集 ⇒ 实施后同一机制两处不同取值。 | 把 §6.3 的系数句并入本批原地改动（改写为常量口径，或改为指向 §6.17.1 的单源指针），并在 §2.2 与受影响文件表登记该处。 |
| 2 | Requirements / 追溯 | 🟡 | 批档仍按「需求档缺位」表述：`batch:66`「需求档 F-CC 条目缺位已上抛（§2.9）」、`batch:148`「§2.1 现只到 F-CC5」；而需求档现已有 F-CC6（`requirements:41`）· F-CC7（`requirements:43`）· F-CC8（`requirements:45`）。设计档的需求指针仍止于 F-CC5（`design:42` / `design:350` / `design:410`），AC 表的需求回指列仍只指设计链（`batch:77-79`、`batch:119-124`）。 | 把 §2 状态行 / §2.9 / AC 需求回指列 / §6.17.1 验收回指一并改指 F-CC6–F-CC8，并删掉已落定的上抛项。 |
| 3 | Requirements / 端覆盖 | 🟡 | 链二只接在 CLI 持久化面：写面 `saveSession` 的 `fields`（`batch:92`、`design:882`）、读面 `applySession`（`design:883`）——而同一档记载 VSC 不走该路（`design:243`「VSC **不经核 `applySession`**」）。F-CC7（`requirements:43`）无限定单端 ⇒ VSC 恢复会话仍从比值 1 起步，本批要杀的死锁在该端仍在；§2.8 边界未登记这一面。 | 明确 VSC 面：或指名 VSC 槽读点（并进受影响文件表），或在 §2.8 登记「VSC 恢复面不在本批」并给理由。 |
| 4 | 可行性 / 行为 | 🟡 | 链三按 `error.kind === "context_overflow"`（`design:892`）开火，但该 kind 也由 Responses 流内帧分类产出——设计自陈其作用面「本处只把作用面从「Responses 流内帧」扩到「HTTP 级 4xx」」（`design:804`）。该路径上回合可能已流出文本，而「不重放」的论证只覆盖续写子请求（`design:897`「续写子请求的失败已在 … 不到达本 catch ⇒ 不存在「已流出内容被重放」」）。 | 明示流内帧路径能否在已流出后触发链三；若可达，加「未流出才重试」的判据，或把重复输出列为已接受边界面。 |
| 5 | 验收 / 新 RTM 行可判性 | 🟡 | 新增行 11-5 的算术在本批现行配置下不成立：`batch:138`「估算 `491K × 1.47` 越 `limit`」≈ 722K，而父侧应急把 `maxTokens` 落 `65536`（`batch:45`、`batch:154`）⇒ `limit` = 934,464，722K 不越线 ⇒ 该行照字面会红。该行也未点名所用配置夹具与 `/3` 之后的估算值。 | 点名夹具（如 `maxTokens: 393_216` ⇒ `limit` 606,784）并把断言改成对该 `limit` 的不等式，或统一给出两端数。 |
| 6 | 既有件三问 | 🟡 | 三问块（`design:830-835`）只答既有名（`context_overflow` / `estimateRequestTokens` / `_tok`·`_tokRatio` / `estimated`），本批新引入的名字全部缺位：`ASCII_CHARS_PER_TOKEN` / `ESTIMATOR_VERSION`（`batch:90`）、`estimateSample`（`batch:92`）、`tokenKey()` 导出（`batch:92`）、`enforceContextFit` / `_overflowRetried`（`batch:94`）。 | 每个新名补一行三问；`tokenKey` / `enforceContextFit` 按「existing but 抽出」给坐标，`estimateSample` 按新槽字段确认无同名既有字段。 |
| 7 | 分支现场（6b） | 🟡 | 链二校验四条（`design:884`）里，「形状 … 有限且 `den > 0`」这一支没有现场：既未引真实损坏槽，也未给复现路径，RB30 的手工夹具（`design:911`）是夹具不是现场。（校验② `est` 不符一支有现场——口径变更——不在本条。） | 补现场：或给一个真实损坏槽 / 产出它的命令，或声明槽写守卫使该形态不可达并删掉该支。 |
| 8 | 受影响文件表 / 文档状态 | 🟡 | 设计档自宣「**本表是本档唯一读数源**」（`design:611`），但其读数与批档表冲突：`token-window.mjs` 188（`design:632`）vs 209（`batch:102`）、`agent.mjs` 94（`design:621`）vs 106（`batch:108`）；抽检三行以批档数为准（`wc -l` 口径逐一相符）。 | 按 2026-10-27 读数刷新 §6.16.9，或把 §2.4 改为刷新后的 §6.16.9 指针，让一处拥有这些数字。 |
| 9 | 验收清晰度 | 🔵 | AC-R4 未给数（`batch:122`「首请求估算支 = 未持久化时的 `num/den` 倍（可断言数值）」），与 AC-R1–R3 的定值风格不一致；AC-R2（`batch:120`「`_tokRatio` = `num/den`」）与需求档 `requirements:44` 同写 `num/den`，而设计档下界兜底为 `max(1, …)`（`design:884` ④）——比 < 1 的合法样本两处不同值。 | 给 AC-R4 具体夹具与期望数；把 AC / 需求判定句的写法与下界对齐，或把下界理由写进判定句。 |
| 10 | 文档卫生 | 🔵 | `design:905` 的期望列带「（`ceil(4000/3)`；改前 1000）」——改前值留在用例期望的规范面。 | 改前值归批档记录，用例行只留期望值。 |
| 11 | 设计备注 | 🔵 | `_overflowRetried` 是 run 级旗（`design:896`、D6 `batch:133`）⇒ 同一 run 内第二次独立越窗直接抛而不自愈，把 F-CC8（`requirements:45`）的「压一次 + 重试一次」由按请求收窄为按 run。 | 在 §6.17.1 记下该后果（或按轮复位，若原意是按请求）；D6 理由成立，故为备注非缺陷。 |
| 12 | 清晰度 | 🔵 | 链三在安全点检查之外压缩（`design:892` 包 `turn-loop.mjs:131`），设计未声明该处 tail 仍是 `user`/`tool`——真正保证它的是循环里 `turn-loop.mjs:121-122` 的门。 | 链三补一句该不变量，使循环形状变动时可审计。 |

**已核可的部分**：链一落点精确（`rate.mjs:62-66` 现体确为 `/ 4`）· 先例行逐条带对齐/偏离（`design:821-828`，含 ADVISOR-GUARDS §9 / 会话槽字段 / 守卫强压三件）· 公开源勘察行在场（`design:868`）· 集成面从 RTM 出发做增量（破 11-4 / 补 11-5 / 明示 11-1–11-3 零改，`batch:135-140`，非空白场景清单）

**同时核可**：验收只跑改动面单测档与 `node --check`，未写全量套件（`batch:117`、`batch:124`）· 受影响文件无越档（最大 `provider/core.mjs` 494 恒值）· D1–D6 决策含否决理由。

计：🔴 1 · 🟡 7 · 🔵 4

VERDICT: changes-required

### 轮次 2（评审子代理）

### 第 2 轮验证（第 1 轮 12 条逐条 + 新问题）

已读全量：需求档（103 行）· 批档（232 行）· 设计档（969 行）。第 1 轮 12 条 = 11 Fixed · 1 Accepted · 0 Unfixed。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/core/design/CONTEXT-COMPACTION.md | 🔴→关闭 | Fixed | `design:150` 现为「估算公式（**单源 = §6.17.1 链一**）：`Math.ceil(ascii / ASCII_CHARS_PER_TOKEN) + nonAscii`，`ASCII_CHARS_PER_TOKEN = 3`…本节不另写系数」——与 `design:882` 同值同主，`/4` 表述已无（全档仅 `design:883` 以「`/4` 低报 1.47 倍」作选值理由，非规范句）。落点登记见 `batch:162`（§2.2 增量含 §6.3 · §6.16.9 两处原地改）。 |
| 2 | 2 | docs/batches/2026-10-27-context-budget-underestimate.md | 🟡→关闭 | Fixed | 状态行改指需求条目（`batch:66`「需求档 F-CC6–F-CC8 已落并回指」）；§2.9 第 1 条作废（`batch:163`「§2.9 第 1 条（需求档条目缺位）**已解决，作废**」）；AC 需求回指列已补（`batch:181-185`）；设计档三处指针补到 F-CC8（`design:42` · `design:350` · `design:410`「预算保真三条 **F-CC6–F-CC8** 的落点 = §6.17.1」）；需求档 `requirements:41/43/45` 三条在位。 |
| 3 | 3 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | 取「登记边界」选项：`design:896`「**端面（本批只接 CLI）**」给出两条理由（VSC 不经 `applySession`；采样点住核循环）与恢复条件；`batch:177`「VSC 恢复面不在本批」；§6.16.9 增 `panel-session.mjs` 329 / Δ 0 行（`design:638`）。 |
| 4 | 4 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Accepted | 技术反驳成立且可核：`design:910`「**Responses 流内帧路径不命中本链（属性名不同）**」——流内出口写 `errorKind`（`responses.mjs:38`/`:97`）、HTTP 400 与本地净判写 `kind`（`errors.mjs:171`/`:148`），故「已流出再重放」在本链不可达；并给出实施轮判据（若上游把 `errorKind` 归一成 `kind` ⇒ 加「未流出才重试」）+ 登记为接受的边界。原提问的两向（可达⇒加判据 / 不可达⇒登记）已择后者并给证。 |
| 5 | 5 | docs/batches/2026-10-27-context-budget-underestimate.md | 🟡→关闭 | Fixed | `batch:191-195` 以「11-5 最终断言形」替换原算术：点名夹具 `maxTokens: 393_216`（`limit` = 606,784，并明示禁用现盘 `65_536`）、给出 `491,000 × (723,272/491,000) ≈ 723,272` 与不等式 `est > limit`，不再写依赖现配置的乘式。 |
| 6 | 6 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | 三问块补 6 条（`design:840-845`）：`ASCII_CHARS_PER_TOKEN`（none found + 现体字面量 `/ 4` 实读）· `ESTIMATOR_VERSION`（none found，值 1）· `estimateSample`（none found + `fields` 键集逐项）· `tokenKey()`（existing but 抽出，`token-window.mjs:168`）· `enforceContextFit()`（existing but 抽出）· `_overflowRetried`（none found，与 `_compressFailures`/`_pendingCompact` 划界）。 |
| 7 | 7 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:894` 校验① 补现场 + 复现路径：「**现场** = 槽档是盘上用户数据，同函数已对 `history` 逐字段防御（`session-lifecycle.mjs:99`）；**复现** = 把槽 JSON 的 `estimateSample` 改成 `{"key":"openai:x","num":"NaN","den":0}`…⇒ 比回 1、会话照常恢复，不抛」。分支保留，符合 6b「给复现路径即可走通」。 |
| 8 | 8 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | §6.16.9 表头改「现况 = 本机实读 2026-10-27」（`design:611`），表体读数与批档 §2.4 逐值同源：`token-window.mjs` 209（`design:635` = `batch:102`）· `agent.mjs` 106（`design:622` = `batch:108`）· 其余 rate 168 / session 275 / session-lifecycle 421 / turn-loop 288 / run-stages 334 / setup 310 / errors 175 / provider/core 494 全对；`batch:175` 声明读数单源改为 §6.16.9。第 1 轮抽检三档（168 / 209 / 106）与本轮表值一致。 |
| 9 | 9 | docs/batches/2026-10-27-context-budget-underestimate.md | 🔵→关闭 | Fixed | `batch:189`「**AC-R4 定形**（原句无数，补夹具与期望）」= `num 2668 / den 1334` ⇒ 比 2.0、恢复后估算支 = 2×（2,668 vs 1,334）；`batch:187`「**AC-R2 定形**」把比写成 `max(1, num/den)`，需求档 `requirements:44` 同步（含下界理由）。 |
| 10 | 10 | docs/core/design/CONTEXT-COMPACTION.md | 🔵→关闭 | Fixed | `design:919` RB24 期望列现为「`1334`（`ceil(4000/3)`）」，改前值已移出设计档（改前 `/4` ⇒ 1000 记在 `batch:171`）。 |
| 11 | 11 | docs/core/design/CONTEXT-COMPACTION.md | 🔵→关闭 | Fixed | `design:908`「**后果（旗是 run 级，不是按请求）**：同一 run 内第二次**独立**越窗不再自愈，直接抛 typed 错误（用户 `/compact` 后可继续）。理由 = 批档 D6」。 |
| 12 | 12 | docs/core/design/CONTEXT-COMPACTION.md | 🔵→关闭 | Fixed | `design:911`「**安全点不变量（本链依赖）**」给出门条件与审计锚（`turn-loop.mjs:121-122`），并写明循环形状改变时本链切点安全性一并失效。 |
| N1 | (new) | docs/core/design/CONTEXT-COMPACTION.md | 🔵 | New: 同一抽出体两个坐标 | 新三问行写 `design:844`「现体 = `thincoder-core/agent/run-stages.mjs:141-162` 的守卫段」，而链三仍写 `design:904`「`thincoder-core/agent/run-stages.mjs:137-158`」——同一个 `enforceContextFit` 抽出体两个区间（§6.17 `design:771` 的逐点读数是 `:141` 取 budget / `:143` 判据 / `:147` 强压 / `:156` 二次判并抛）。建议择一为唯一读数（按 `:771` 逐点口径落一个区间），避免实施轮按错区间截断 `throw`。 |

**本轮未再报**：第 1 轮其余判断无反复；`batch:158` 的「增量面取代」读法已消解 append-only 与收正之间的表观冲突。

VERDICT: pass

计：🔴 0 · 🟡 0 · 🔵 1（新，不阻塞）；第 1 轮 12 条 = 11 Fixed · 1 Accepted · 0 Unfixed。

### 轮次 3（评审子代理）

### 第 3 轮（批档重开 · VSC 恢复面补漏 · 修正轮 2 增量）

审查面 = 修正轮 2 增量（`batch:229-259`）∥ design §6.17.1 链二端面（`design:902-903`）· §6.10 #9（`design:252-254`）· D-CC22（`design:966`）· §6.16.9 三新行（`design:638-641`）· 三问块（`design:845-848`）· RB34（`design:937`）∥ 需求档 F-CC6–F-CC8（`requirements:39-47`）。

已读全量：批档（479 行）· 设计档（978 行）· 需求档（103 行）。

**已核可**：三处补法在批档与设计档逐字一致（`design:903` ∥ `batch:245-251`）· 旧坐标 `agent.mjs:387-397` 已从设计档消失，替代表述（`design:254`「端壳主循环 2026-09-29 已归核」／`design:966`「端侧零独立构造点」）与 §1 重开记录同口径 · §6.16.9 三新行与 §2.4 增量逐值同源（87/151/159，Δ +1/+1/+1；`panel-session.mjs` 328 两处一致）· 三档均 ≪500 软线，无越档、无需 split plan

**另核可**：改动落在已拥有该主题的档（design §6.17.1 / 需求档 F-CC6–F-CC8），未新开档 · F-CC7（`requirements:43-44`）无限定单端 ⇒ 本轮补法是需求字面要求，非扩权。

**限制**：源档（`thincoder-vscode/**` · `thincoder-core/**`）不在本次可读面 ⇒ 全部代码坐标与行数为 `unverified`（仅核文档间一致性），行数未做 spot-check；无项目标准文档、无文档地图（评审上下文声明）⇒ 文档归属按 Project Guide 目录约定判。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档归属 / 文档状态 | 🔴 | 同一机制（VSC 恢复面是否在本批）三处仍是「不在本批」的活表述：§6 已知边界表写「VSC 不经 `applySession`、且走端壳自有循环 ⇒ 连样本都不产」（`batch:471`）——正是 §1 重开记录判为误的那条前提（`batch:65`「该理由经父侧实核为误」）；§4 不覆盖列「VSC 恢复面（§2.8 已登记边界 + 恢复条件）」（`batch:350`），实施面仍为「7 个源档 …」（`batch:346`）⇒ 本轮新增三档（`batch:253`）落在批准面外；而 §2.8 增量已把该条「**删除**（不再成立）」（`batch:255`）。两份活描述并存，读者无法判断哪份权威，且 §5.1「清单外改动：零」随之不成立。 | 随重开一并收正三处：§4 的「批准覆盖 / 不覆盖 / 实施面」按十档重述（含三档 VSC 与 AC-R7/RB34），§6 已知边界表删 VSC 行或改写为「本批已补，边界 = 不改 `applySlotSessionState` 槽字段合并语义」，使全档单一口径。 |
| 2 | 分支现场（6b）/ 清晰度 | 🟡 | `saveLines` 的 `extra.estimateSample !== undefined ? extra.estimateSample : (existing.estimateSample ?? null)`（`design:903`、`batch:248`）的「键缺席」半支既无现场（未引任何无 `estimateSample` 的 `saveLines` 调用点）也无复现路径；而 ① 让 `agentState()` 恒带该键（含 `null`）⇒ 主写路径上该半支不可达、恒走覆盖支（空样本 `null` 覆盖槽内既有样本），与同句「键缺席保留槽值」的提示相反。核心写面空样本落 `null`（`design:898`）与覆盖支同义，故语义面可核。 | 二选一并在设计档写明：① 具名一个真实的键缺席调用点（cite 该 site）并保留三目；② 收成单表达式 `estimateSample: tokenSampleOf(agent)`，并一句写明「空样本以 `null` 覆盖槽值（与 `saveSession` 同语义）」。 |
| 3 | 清晰度 / 可行性 | 🟡 | 端读面 ③ 实为 `applySlotSessionState` 的签名扩展（第三参 `provider`），设计只点名装配面一处（`design:903`「`applySlotSessionState` 住 `thincoder-vscode/src/agent/setup.mjs:193`」），未登记该函数调用点全集，也未登记 `provider` 缺省时校验③ 的落值（`design:900`「`key === tokenKey(provider)`」，`tokenKey(undefined)` 无定义）——「该点拿不到 agent 上的 provider」正是设计自陈的约束，忘传即静默退化到比 1（`unverified`：调用点数量与 `tokenKey` 对 `undefined` 的行为未核）。 | 补「调用点全集 = N 处（逐点列出）」与 `provider` 缺省落值（如 `provider == null ⇒ 视为校验③不符 ⇒ 比 1，不抛`），使签名变更闭合。 |
| 4 | 验收 | 🟡 | AC-R6 仍写「`node --check` 七个改动档全通过」（`batch:127`），本轮三档不在该集合；AC-R7 声明「跑法同 AC-R6 单测档」（`batch:257`），而单测档住核心树 `docs/batches/`，直 import 三档 VSC 模块在无 vscode 宿主下的可导入性未登记（`unverified`）。 | AC-R6 改「十档」（7 核 + 3 端）并把三档 VSC 跑法写实（同档直 import / 需 `vscode` 桩 / 改用端侧跑法），AC-R7 回指同一跑法。 |
| 5 | 集成测试设计 | 🟡 | 端面改变了业务可观察结果（VSC 面板重启继续大会话不再吃 400 越窗），但 §2.7 的 RTM 增量仍只有 CLI 端（11-4a / 11-4b / 11-5，`batch:140`、`batch:218`），端面既无新行也无「不落 RTM」的理由；需求档自写「VSC `test/` 对压缩面零专属用例——补测触发 = 该面下次被触碰」（`requirements:100`），本批正是那次触碰。（`test/RTM.md` 不在本次可读面内，此条判的是增量陈述本身。） | §2.7 补一行端面 RTM（业务可观察 = VSC 面板重启后继续大会话零 400；入口 = 面板恢复），或写明「RTM §11 为 CLI 端，端面观测落 …，理由 = …」。 |
| 6 | 既有件三问 | 🟡 | `estimateSample` 的三问只答核心面键集（`design:845`「查过 `session.mjs` 的 `fields` 键集 … 无同名键」）；本轮把同名键加进 VSC 槽对象（第二个写入面，`design:903` ②），该键集是否已有同名键未答。 | 同条三问补第二面：「VSC 槽对象键集（`panel-session-write.mjs` 现体逐键）无 `estimateSample`」或「已有但形态不同 ⇒ 说明」，并给两端消费者。 |
| 7 | 最近先例 | 🟡 | 本轮新增的端面三处无先例行条目：§6.17「先例行（本批三件）」块（`design:828-835`）含 6 条、均为链一/二/三，不含端面；唯一形态依据是 ② 的内联「与 `pendingReminders` `:110` 同式」（`design:903`）——有坐标、无偏离论证。 | 补一条：先例 = 核会话槽字段族（`design:834`）∥ VSC 槽键同式（`pendingReminders:110`）；对齐 = 同一 `tokenSampleOf` / `restoreTokenSample`、同一四条校验；偏离 = 写面逐键构造、读面 provider 由装配面注入（agent 上尚未落）。 |
| 8 | 清晰度 / 坐标 | 🟡 | 同一符号 `activeLines` 同档两个区间并存：`design:243`「`activeLines` `:54-55`（… `:56` 返回前）」vs `design:638` / `design:903`「`activeLines:94`」；而 §6.16.9 自宣「本表是本档唯一读数源」（`design:611`）。二者不能同真。 | 按实读择一（并核 `:94` 是否为另一符号 / 另一分支），全档单一区间。 |
| 9 | 数字漂移 / 文档卫生 | 🔵 | 用例表标题仍「RB24–RB33」（`design:923`，表内已到 RB34 `design:937`）；§2.2 落点同写「用例 RB24–RB33」（`batch:88`）；§2.4 单测档行仍「~200」（`batch:116`，实测 278 且 RB34 还会增）；`design:639`「Δ 待实施后按实读收口」是读数单源表内的 TODO 面。 | 标题与落点改 RB24–RB34；单测档行按实读 + RB34 增量估；`design:639` 的 Δ 写成预估区间并注明收官以实读为准（与表头口径一致）。 |

计：🔴 1 · 🟡 7 · 🔵 1

VERDICT: changes-required

### 轮次 4（评审子代理）

### 第 4 轮（第 3 轮 9 条逐条 + 修正轮 3 落地验证 · 新问题）

审查面 = 第 3 轮 9 条（🔴1 · 🟡7 · 🔵1）逐条状态 + 修正轮 3 增量（`batch:261-300`）∥ design §6.17.1 链二端面（`design:905-906`）· 先例行（`design:828-838`）· 三问块（`design:848`）· §6.16.9（`design:609-642`）· RB34（`design:940`）∥ §4/§6 修正段（`batch:426-453` / `batch:580-602`）。

已读全量（本轮）：批档（603 行）· 设计档（981 行，含 §6.16.9 / 先例行 / 三问块 / RB24–RB34 逐行）· 需求档（103 行）。

**已核可**：设计档内「只接 CLI」/「本批三件」/「恢复面不在本批」/「走端壳自有循环」/`387-397`/`activeLines :54-55` 六类旧表述 **grep 零命中** · `panel-session.mjs` 328 在批档与设计档同值 · §6.16.9 三新行（87 / 151 / 159，`预计 +1`）与 §2.4 增量逐值同源。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/batches/2026-10-27-context-budget-underestimate.md | 🔴→关闭 | Fixed | 三处活表述已被显式取代段覆盖：`batch:426`「**§4 修正（重开后 · 2026-10-27）——取代本段之上「批准覆盖 / 不覆盖」的对应表述**」+ `batch:436`「**实施面 = 十档**：」（表体 `batch:441-443` 逐档列出三端档）+ `batch:449`「- **删**：「VSC 恢复面」一条——本批已补（三处补法见 §2 修正轮 2 与设计档 §6.17.1 链二端面）」；`batch:580`「**§6 修正（重开后 · 2026-10-27）——取代本段之上「已知边界」表的 VSC 行**」+ `batch:586`「**该行整条作废**，理由 = §1 重开记录已记明的实核结论：」。原行保留属 append-only 记录面（被取代已逐段写明），不构成两活描述。 |
| 2 | 2 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | 键缺席支已有现场：`design:906`「**键缺席支的现场 = 五处不携 agentState 的保存**」（`panel-turn-loop.mjs:275` · `panel-turn-stages.mjs:134` · `suspension.mjs:315` · `timer-watch.mjs:36` · `panel-messages.mjs:259`），并写明否决单表达式的后果（`undefined` 进 full-overwrite ⇒ 槽内既有样本被抹）与两半语义（键在场 = 内存即权威、空样本 `null` 照写；键缺席 = 保留槽值、跨模型旧样本由校验③ 自清）；RB34 增「另两夹具 = `saveLines` 的 `extra = { seed }`（键缺席——现场 `panel-turn-loop.mjs:275`）」与「键缺席时槽内既有 `estimateSample` 逐字保留」（`design:940`）。 |
| 3 | 3 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | 三点闭合：`design:906`「**调用点全集 = 1 处**」·「**`provider` 缺省落值 = 比 1、不抛**」（`tokenKey(undefined)` 经两处 `?.` 兜底产 `"openai:"` ⇒ 校验③ 判不符；`restoreTokenSample` 入口先置 `_tok = null` / `_tokRatio = 1`）· 忘传后果 = 只退化到未校准档。签名变更语义面已闭合；**装配面文件是否需改**另立为新条目（见 N1）。 |
| 4 | 4 | docs/batches/2026-10-27-context-budget-underestimate.md | 🟡→关闭 | Fixed | `batch:278`「### AC-R6 / AC-R7 定形（替换 §2.5 原两条）」：`batch:280`「`node --check` **十档**逐档 OK」（7 核 + 3 端逐档点名）；`batch:281-285` 跑法两段（①③ 可同命令直 import ∥ ② 需 `vscode` 桩或端侧跑法，并标「**未验证**：该端 `test/run.mjs` 内部如何解析 `vscode` 裸名」）。 |
| 5 | 5 | docs/batches/2026-10-27-context-budget-underestimate.md | 🟡→关闭 | Accepted | 有理由的非修（第 3 轮建议本身允许「或写明理由」）：`batch:289`「- **本批不加端面 RTM 行**，两条理由」——① 该端无集成层（引 `test/RTM.md:138` 自陈）；② 业务可观察结果由同一比 + 同一守卫承接，RB34 逐值断言三个输入面；并给「登记（非本批可落）」与需求层「补测触发」上抛（`batch:291` / `:297`）。`test/RTM.md` 不在本次可读面 ⇒ 该引文 `unverified`，但反驳本身可核（文档内自洽、且未把未核事实写成已核）。 |
| 6 | 6 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:848`「**第二写入面（VSC 槽对象）同答**：」——逐键 18 键列举（`version`…`activeModel`）另加 `...existing` 泛 spread、无同名键，并给两端消费者（写 `tokenSampleOf` ∥ 读 `restoreTokenSample`）。 |
| 7 | 7 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:828`「**先例行（本批四条 · 前置三条）**：」+ `design:830` 点明前三条属 D-CC32；第 4 条端面条目在场：`design:838`「- 链二端面（6.17.1 链二端面）：先例 = 核会话槽字段族」（对齐 = 同一两函数 / 同一四条校验；偏离 = 端侧逐键构造 + provider 由装配面注入）。 |
| 8 | 8 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | 按实读择一已落：`design:243`「`activeLines` `:94`（函数声明；归并点 `:105`——`contextHistory` 定线 `:101` 后、`:106` 返回前」；设计档全档 grep `:54-55` **零命中**，与 `design:638` / `design:906` 的 `activeLines:94` 一致。 |
| 9 | 9 | docs/core/design/CONTEXT-COMPACTION.md | 🔵→关闭 | Fixed | `design:926`「**用例表（本批续号 RB24–RB34）**」；`design:611`「Δ 口径 = 已实施行取实读、未实施行标 `预计`（收官一律以实读为准）」⇒ `design:639-641` 三行写 `预计 +1`、`design:639` 的 TODO 句已无；§2.2/§2.4 读数由 `batch:293`「**§2.2 / §2.4 读数收正（本段为准）**」取代（RB24–RB34 · 278 + RB34 增量）。 |
| N1 | (new) | docs/core/design/CONTEXT-COMPACTION.md ∥ docs/batches/2026-10-27-context-budget-underestimate.md | 🟡 must fix before implementation | New | 装配面文件未进任何登记面：`design:906`「`provider` 由装配面第三参传入（`applySlotSessionState` 住 `thincoder-vscode/src/agent/setup.mjs:193`」，而 RB34 的目标调用形是 `applySlotSessionState(agent, { slot }, { cfg, restore: true, provider })`（`design:940`）——`provider` 是第三参对象的新键。该调用点唯一（`design:906`「**调用点全集 = 1 处**」），其所在档 `thincoder-vscode/src/agent/setup.mjs` 在三处登记面**均无行**：`design:638-641` 只有 `panel-session` / `run-helpers` / `panel-session-write` / `agent-state`；`batch:253` §2.4 增量同三档；`batch:436`「**实施面 = 十档**：」表体 `batch:441-443` 亦无。两种状态只能有一个为真：ⓐ 该调用点**已**携 `provider`（则须一句写明，十档成立）；ⓑ 须加一行（则实施面 = 十一档、受影响表缺该档现况读数 ⇒ 按现登记实施即落入 §5.1「清单外改动」面，或不改则该行拿不到 provider、`provider` 恒缺省 ⇒ 校验③ 恒不符 ⇒ VSC 端比恒 1，而 RB34 因显式传 `provider` 仍绿，端面修复在生产面静默失效）。`unverified`：该档现体第三参是否已含 `provider`（源档不在本次可读面）。 |
| N2 | (new) | docs/batches/2026-10-27-context-budget-underestimate.md | 🔵 | New | 两处状态措辞未随修正收口：① `batch:599`「\| **VSC 端面** \| **本批已补**（三处：`agentState` 值 · `saveLines` 显式键 · `applySlotSessionState` restore 支） \| 验收 = AC-R7 / RB34；不再登记为边界 \|」——而 `batch:231`「落点全在设计档；本批代码未动（coder 落）。」、§4 表体 `batch:440` 仅 1–7 标「核（已落）」⇒ 「已补」宜作「已纳入本批（端侧待落）」。② `batch:298`「两处均在主 agent 段，本次零改。」——§4/§6 修正已落（`batch:426` / `:580`），该上抛句已过期（可由修正段读法吸收，但字面仍否）。 |

计：🔴 0 · 🟡 2（1 条前轮已 Accepted · 1 条新 must-fix）· 🔵 1（新）；第 3 轮 9 条 = 8 Fixed · 1 Accepted · 0 Unfixed。

VERDICT: changes-required

### 轮次 5（评审子代理）

### 第 5 轮（第 4 轮 11 条逐条验证 · 修正轮 4 落地验证）

审查面 = 第 4 轮 11 条（🔴0 · 🟡2〔1 已 Accepted · 1 must-fix〕· 🔵1）逐条状态 + 修正轮 4 增量（`batch:302-326`）∥ §4 修正 2（`batch:509-542`）∥ §6 修正 2（`batch:693-714`）∥ design 链二端面 ④（`design:907` 后半）· §6.16.9 新行（`design:642`）· RB34（`design:941`）· RB34 ④ 理由（`design:943-947`）。

已读全量（本轮）：批档（715 行）· 设计档（988 行）· 需求档（103 行）。设计档全档 grep `:54-55|本批三件|只接 CLI|走端壳自有循环|387-397|RB24–RB33|恢复面不在本批` = **零命中**。

限制：源档（`thincoder-vscode/**` · `thincoder-core/**`）与 `test/RTM.md` 不在可读面 ⇒ 代码坐标与行为断言按 `unverified`，本轮只核文档间一致性。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | 1 | docs/batches/2026-10-27-context-budget-underestimate.md | 🔴→关闭 | Fixed | `batch:480`「**§4 修正（重开后 · 2026-10-27）——取代本段之上「批准覆盖 / 不覆盖」的对应表述**」+ `batch:490`「**实施面 = 十档**：」+ `batch:503`「- **删**：「VSC 恢复面」一条——本批已补（三处补法见 §2 修正轮 2 与设计档 §6.17.1 链二端面）」；`batch:669`「**§6 修正（重开后 · 2026-10-27）——取代本段之上「已知边界」表的 VSC 行**」+ `batch:675`「**该行整条作废**，理由 = §1 重开记录已记明的实核结论：」。原行为 append-only 记录面，被取代已逐段写明，不构成两份活描述。 |
| 2 | 2 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:907`「**键缺席支的现场 = 五处不携 agentState 的保存**：`panel-turn-loop.mjs:275` … `panel-messages.mjs:259`」+ 否决单表达式后果（`undefined` 进 full-overwrite ⇒ 键随序列化消失）+ 两半语义（键在场 = 内存即权威、空样本 `null` 照写；键缺席 = 保留槽值）；RB34 夹具与期望在场：`design:941`「写② `saveLines` 两夹具（`extra = { seed }` 键缺席 ∥ 键在场）」「键缺席时槽内既有 `estimateSample` 逐字保留」。 |
| 3 | 3 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:907`「**调用点全集 = 1 处**，即 ④ 的改点」（附 `thincoder-vscode/test` 无直接调用）+「**`provider` 缺省落值 = 比 1、不抛**」（`tokenKey(undefined)` ⇒ `"openai:"` ⇒ 校验③ 判不符；`restoreTokenSample` 入口先置 `_tok = null` / `_tokRatio = 1`）+ 忘传后果 = 只退化到未校准档。 |
| 4 | 4 | docs/batches/2026-10-27-context-budget-underestimate.md | 🟡→关闭 | Fixed | 第 3 轮定形（`batch:278-285` 十档 + 跑法两段）已被 `batch:318`「**AC-R6 / AC-R7 再定形（取代本段之前的「十档 / 两段跑法」）**」向上取代：`batch:320` 十一档（7 核 + 4 端逐档点名）· `batch:321` ④ 不进 import 面 · `batch:322` ④ 结构机检判据（断言 `applySlotSessionState(` 起括号配平段含 `provider`，并明示「不得退成全档 grep」及三处同名干扰）。 |
| 5 | 5 | docs/batches/2026-10-27-context-budget-underestimate.md | 🟡→关闭 | Accepted | 有理由的非修（第 3 轮建议允许「或写明理由」）：`batch:289`「- **本批不加端面 RTM 行**，两条理由」+ `batch:290` 登记（非本批可落）+ `batch:291` 需求层「补测触发」上抛（`batch:297`）。`test/RTM.md` 不在可读面 ⇒ 引文 `unverified`（引文逐字已在 `batch:300` 勘误收正），反驳本身文档内自洽。 |
| 6 | 6 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:849`「**第二写入面（VSC 槽对象）同答**：」——逐键 18 键 + `...existing` 泛 spread、无同名键，两端消费者逐点（写 `tokenSampleOf` ⇒ `session.mjs:150` ∥ `run-helpers.mjs:76`；读 `restoreTokenSample` ⇒ `session-lifecycle.mjs:215`/`:221` ∥ `agent-state.mjs:120-124`）。 |
| 7 | 7 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:829`「**先例行（本批四条 · 前置三条）**：」+ `design:831` 点明前三条属 D-CC32、本批四条 = 后三条 + 端面一条；第 4 条在 `design:839`「- 链二端面（6.17.1 链二端面）：先例 = 核会话槽字段族」（对齐 = 同一两函数 / 同一四条校验；偏离 = 逐键构造 + `provider` 由装配面注入）。 |
| 8 | 8 | docs/core/design/CONTEXT-COMPACTION.md | 🟡→关闭 | Fixed | `design:243`「`activeLines` `:94`（函数声明；归并点 `:105`——`contextHistory` 定线 `:101` 后、`:106` 返回前」；设计档全档 grep `:54-55` 零命中，与 `design:638` / `design:906` 的 `activeLines:94` 一致。 |
| 9 | 9 | docs/core/design/CONTEXT-COMPACTION.md | 🔵→关闭 | Fixed | `design:927`「**用例表（本批续号 RB24–RB34）**」；`design:611`「Δ 口径 = 已实施行取实读、未实施行标 `预计`（收官一律以实读为准）」⇒ `design:639-642` 写 `预计 +1/+1/+1/+0`，`design:639` 的 TODO 句已无；§2.2/§2.4 读数由 `batch:293`「**§2.2 / §2.4 读数收正（本段为准）**」取代。 |
| 10 | N1 | docs/core/design/CONTEXT-COMPACTION.md ∥ docs/batches/2026-10-27-context-budget-underestimate.md | 🟡 must-fix→关闭 | Fixed | 四处全部落档：`batch:308`「端面补法 **三处 → 四处**：④ 装配面 `thincoder-vscode/src/agent/setup.mjs:193-197` 的第三参对象 `{ cfg: cfgBag, restore }` 增 `provider`」+ 为什么必须在内（`provider` 恒缺省 ⇒ 端比恒 1、RB34 仍绿 = 绿着漏）；`design:907` ④ 段同文；`design:642` 新行「`thincoder-vscode/src/agent/setup.mjs` | 322 | 预计 0 | 链二端装配面④…」（`wc -l` 实读 + 原位一参 ⇒ 行数不变）；实施面 十档 → 十一档（`batch:530`「**实施面 = 十一档**：」+ `batch:538` 第 11 行）；AC-R6 十一档（`batch:320`）+ ④ 结构机检（`batch:322` / `design:941`）+ 机检为何不退成全档 grep（`design:943-947` 两条理由）；RB34 读半改跑法并写明「③ 直调只证读回逻辑、不证 ④ 接线」（`design:941`）。读数分歧已裁：`batch:326` 上抛「预计 0」⇒ `batch:713`「以 0 为准」。 |
| 11 | N2 | docs/batches/2026-10-27-context-budget-underestimate.md | 🔵→关闭 | Fixed | ① `batch:706`「\| **VSC 端面** \| **已纳入本批（端侧四处待落）**：① …④ `setup.mjs:193-197` 第三参增 `provider` \| 验收 = AC-R7 / RB34（③ 行为面 + ④ 结构机检）；**收口前必须四处全落**…」——第 4 轮所指「已补（三处…）」行（今 `batch:688`）已被 §4…（实为 §6）修正 2 向上取代；② `batch:312`「§2 上抛项 2 的「两处均在主 agent 段，**本次零改**」**作废**」= 显式作废记录（原句 `batch:298` 字面未改，按 append-only 由本段取代读法吸收）。注：§4 修正 的「三处补法」字样由 `batch:513`（§4 修正 2 的为什么改）向前取代，不再单列。 |

计：🔴 0 · 🟡 0（1 条前轮 Accepted 已关闭 · 1 条 must-fix 已修）· 🔵 0（新）；第 4 轮 11 条 = **10 Fixed · 1 Accepted · 0 Unfixed**。

VERDICT: pass

## §4 用户批准（主 agent）

**批准 = 设计评审第 2 轮 pass（2026-10-27 01:42）**

## 评审读数

| 轮 | 结论 | 计数 |
|---|---|---|
| 1 | changes-required | 🔴 1 · 🟡 7 · 🔵 4 |
| 2 | **pass** | 第 1 轮 12 条 = 11 Fixed · 1 Accepted；新增 🔵 1（`enforceContextFit` 抽出段的两个行区间并存——实现前择一） |

## 用户授权链

| 时点 | 原话 |
|---|---|
| 2026-10-27 01:21 | 「你检查一下 dgx-spark目录的session 6，他现在报：…maximum context length is 1048576 tokens…」 |
| 2026-10-27 01:23 | 「问题是界面显示目前的上下文长度才491K。」（界面读数与实际发出 723,272 分叉）|
| 2026-10-27 01:29 | 「**直接开修吧。**」——本批三条链的授权 |
| 2026-10-27 01:27 | 「预算低估的问题怎么解决/」——诊断确认后要求方案 |

## 批准覆盖

- 设计档 `docs/core/design/CONTEXT-COMPACTION.md`：§6.3 系数句改单源指针 · §6.16.9 全表按 2026-10-27 实读刷新 + 3 新行 · §6.17 三问块补 6 名 · 新增 §6.17.1（三条链 + RB24–RB33）
- 需求档 `docs/core/requirements/CONTEXT-COMPACTION.md`：F-CC6 / F-CC7 / F-CC8 + 边界
- 批档 §2（含修正轮 12 条逐条处置 + RTM 11-5 最终断言形）
- 实施面 = 7 个源档（`provider/rate.mjs` · `token-window.mjs` · `session.mjs` · `session-lifecycle.mjs` · `agent/turn-loop.mjs` · `agent/run-stages.mjs` · `agent/setup.mjs`）+ 本批单测档

## 不覆盖

- VSC 恢复面（§2.8 已登记边界 + 恢复条件）
- `requestBudget` 的 `limit = window − reserve` 公式 · 压缩触发阈值 · 摘要与 tail 预算本体
- 用户 `maxTokens` 取值（应急 `393,216 → 65,536` 已就位，本批不回收）
- 新增 🔵（`enforceContextFit` 行区间择一）——实现时由 coder 按 `design:771` 的逐点分解定，不改设计语义

**§4 修正（重开后 · 2026-10-27）——取代本段之上「批准覆盖 / 不覆盖」的对应表述**

## 为什么改

评审第 3 轮 🔴 #1：同一机制（VSC 恢复面是否在本批）在本档三处仍是「不在本批」的活表述——§6 已知边界表复述了 §1 重开记录已判为误的前提（「VSC 走端壳自有循环 ⇒ 连样本都不产」），§4 的「不覆盖」与「实施面 = 7 个源档」也把本轮新增的三档挡在批准面外。两份活描述并存，读者无法判断哪份权威；且 §5.1 的「清单外改动：零」随之不成立。

## 批准覆盖（修正后）

**设计面**（不变）：设计档 §6.3 / §6.16.9 / §6.17 / §6.17.1（含链二端面三处补法 · D-CC22 · §6.10 #9 收正）· 需求档 F-CC6–F-CC8 · 批档 §2（含修正轮 1 / 2 / 3）。

**实施面 = 十档**：

| # | 档 | 面 |
|---|---|---|
| 1–7 | `provider/rate.mjs` · `token-window.mjs` · `session.mjs` · `session-lifecycle.mjs` · `agent/turn-loop.mjs` · `agent/run-stages.mjs` · `agent/setup.mjs` | 核（已落） |
| 8 | `thincoder-vscode/src/agent/run-helpers.mjs` | 端写面：`agentState()` 带 `estimateSample` |
| 9 | `thincoder-vscode/src/extension/panel-session-write.mjs` | 端写面：`saveLines` 槽对象显式键 |
| 10 | `thincoder-vscode/src/agent/agent-state.mjs` | 端读面：`applySlotSessionState` restore 支读回 |

**+ 本批单测档**（`docs/batches/2026-10-27-context-budget-underestimate.test.mjs`，收口删）。

## 不覆盖（修正后）

- **删**：「VSC 恢复面」一条——本批已补（三处补法见 §2 修正轮 2 与设计档 §6.17.1 链二端面）
- 保留：不改 VSC 设置面板 · 不改 `applySlotSessionState` 的槽字段合并语义（只加 `estimateSample` 一个键）· 不加第二个样本来源
- 保留：不改 `requestBudget` 的 `limit = window − reserve` 公式 · 不改压缩触发阈值 · 不改摘要与 tail 预算本体
- 保留：不改用户 `maxTokens` 取值（应急 `393,216 → 65,536` 已就位）
- 保留：压缩失败仍重试一次（收紧 = 新判据，须另立批次）

**§4 修正 2（评审第 4 轮 N1）——实施面 = 十一档**

## 为什么改

评审第 4 轮 N1：`provider` 是 `applySlotSessionState` 第三参对象的**新键**，其唯一调用点所在档 `thincoder-vscode/src/agent/setup.mjs` 在三处登记面（设计档 §6.16.9 · 批档 §2.4 增量 · 本段十档表）**均无行**。

**父侧实读确认（不是推断）**：

```js
// thincoder-vscode/src/agent/setup.mjs:193-197  现体
applySlotSessionState(agent, {
  slot: sessionData, engState, planModeOverride: opts.planMode,
}, { cfg: cfgBag, restore })          // ← 第三参只有 cfg / restore，无 provider
```

**而 `provider` 在该点已在作用域内**：`hydrateRun` 的形参（`setup.mjs:90` `export async function hydrateRun(agent, { provider, cwd, input, opts, depth, role, getAuto, restore = false })`），同函数 `:216`（`buildToolTable` 入参）与 `:228`（`agent._provider = provider`）均在使用。

**不改这行的后果**：`provider` 恒缺省 ⇒ `tokenKey(undefined)` ⇒ 校验③ 恒不符 ⇒ **VSC 端比恒 1，端面修复在生产面静默失效**；而 RB34 因显式传 `provider` 仍绿 ⇒ **绿着漏**。

## 批准覆盖（修正后 2）

**实施面 = 十一档**：

| # | 档 | 面 |
|---|---|---|
| 1–7 | `provider/rate.mjs` · `token-window.mjs` · `session.mjs` · `session-lifecycle.mjs` · `agent/turn-loop.mjs` · `agent/run-stages.mjs` · `agent/setup.mjs` | 核（已落） |
| 8 | `thincoder-vscode/src/agent/run-helpers.mjs` | 端写面：`agentState()` 带 `estimateSample` |
| 9 | `thincoder-vscode/src/extension/panel-session-write.mjs` | 端写面：`saveLines` 槽对象显式键 |
| 10 | `thincoder-vscode/src/agent/agent-state.mjs` | 端读面：`applySlotSessionState` restore 支读回 |
| 11 | `thincoder-vscode/src/agent/setup.mjs` | **端装配面：`:197` 第三参增 `provider`（一行）** |

**+ 本批单测档**（`docs/batches/2026-10-27-context-budget-underestimate.test.mjs`，收口删）。

**验收补一条**：RB34 的「读」半必须**经装配面**（`hydrateRun` 或等价的第三参构造）而非测试直传 `provider`——否则测的是测试自己的入参，不是生产路径。

## §5 实施记录（eng-coder）

**状态行**：实施完成 2026-10-27（重开轮：VSC 端侧四处 + RB24–RB34 重建；tests 8 · pass 8 · node --check 12/12 · 审计 clean · 代码评审 pass）

### 5.1 交付面（7 源档 + 本批单测档；逐档实读增量）

| 文件 | 改前 → 改后（行） | 内容（坐标 = 改后实读） |
|---|---|---|
| `thincoder-core/provider/rate.mjs` | 168 → 176 | 链一：`ASCII_CHARS_PER_TOKEN = 3`（:48）· `ESTIMATOR_VERSION = 1`（:50）· `_estimateSingle` 改读常量（:73） |
| `thincoder-core/token-window.mjs` | 209 → 247 | 链二：`tokenKey()`（:159）· `recordTokenSample` 认 `est`（:171）· `tokenSampleOf` 写面（:187）· `restoreTokenSample` 读面四条校验（:201） |
| `thincoder-core/session.mjs` | 275 → 280 | 链二写面：`fields.estimateSample`（:150，空样本落 `null`） |
| `thincoder-core/session-lifecycle.mjs` | 421 → 427 | 链二读面：`applySession` 两个出口各一次 `restoreTokenSample`（:215 A 支 / :221 B 支，均在 `provider` 落定之后） |
| `thincoder-core/agent/turn-loop.mjs` | 288 → 310 | 链三：`callTurn` catch（:55-72，判 kind → run 级旗 → 强压 → 重试恰一次，重试在 catch 体内故二次越窗原样上抛）· 调用点改 `callTurn`（:152） |
| `thincoder-core/agent/run-stages.mjs` | 334 → 355 | 链三：记账三件提模块级（:80 / :91 / :100）· 守卫段抽 `enforceContextFit`（:158）· 守卫面改为一行调用（:146） |
| `thincoder-core/agent/setup.mjs` | 310 → 312 | 链三：`_overflowRetried = false` 每 run 复位（:71） |
| `thincoder-core/agent.mjs` | 106 → 106 | 零改（构造字面量 `_tok: null` 不变；`_overflowRetried` 由 setup 每 run 复位，不入构造器） |
| `docs/batches/2026-10-27-context-budget-underestimate.test.mjs` | 新建 278 行 | 本批单测档（收口前删除；RTM 7-4 档位形态） |

**清单外改动**：零（8 个被触碰档全部落在 §4 批准实施面内）。设计档 / `test/RTM.md` / 集成档未触碰。

### 5.2 实施轮裁定的两处（§2 明文留给实施判断）

1. **`enforceContextFit(agent, ctx, { forceCompact })`**：守卫面不传（保留 `usage.total > budget.limit` 前置判据，行为逐字同改前）；链三传 `{ forceCompact: true }` 跳过前置判据、直接强压。依据 = §2.1 R3 判据「400 越窗 ⇒ 压缩恰 1 次、重试恰 1 次」+ §6.17.1 链三「① 强制压缩一次」——死锁现场估 491K < limit 606,784，按估算开门会压 0 次、重试同一请求再吃 400，即本批要治的故障本身。压后的「再判仍超 ⇒ 抛三实数」两面同判（压后仍越线说明压缩解不了，再压只是重复付费）。
2. **`enforceContextFit` 抽出范围（§3 轮次 2 N1 的两个行区间）**：取守卫代码体（改前 `run-stages.mjs:141-162`）+ 同段共用的记账三件，方法现住 `run-stages.mjs:158`。与 `design:771` 的逐点分解（`:141` 取 budget / `:143` 判据 / `:147` 强压 / `:156` 二次判并抛）逐点对应；`design:904` 与 `design:844` 的两处旧区间不再引用。

### 5.3 用例与读数（AC 对照）

单测档 8 例，`node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs` ⇒ **tests 8 · pass 8 · fail 0**（duration ≈0.9 s）。

| 用例 | AC | 断言要点（实读读数） |
|---|---|---|
| 估算基准 | AC-R1 / RB24·RB25 | `estimateText("x".repeat(4000))` = **1334**；混排 200+200 = **267**；纯 CJK 400 = **400**；空值 0；`estimateRequestTokens` 同源 |
| 写面落槽 | AC-R2 / RB26 | 槽 JSON `estimateSample` = `{key:"openai:deepseek-flash",num:2668,den:1334,est:1}` 与内存逐值同；空样本 ⇒ `null` |
| 读面复用 | AC-R2 / RB27 + AC-R4 | 恢复后 `_tokRatio` = **2**；`contextUsage().total` = **2668** vs 未持久化 **1334**（恰 2×） |
| 三条退化 | AC-R2 / RB28·29·30 | 无 `est` / `est=0` / key 不符 / `{num:"NaN",den:0}` / 非对象 / 样本缺席 ⇒ 六条全部回 1 且不抛；`num/den<1` ⇒ 复用样本但比兜底 1 |
| 会话边界 | AC-R2 / RB30 复现路径 | 槽 JSON 改坏后 `applySession` 不抛、`_tok=null`、历史照常 2 条 |
| 400 自适应救回 | AC-R3 / RB31 + AC-R5 | 回合请求 2 · 压缩请求 1（顺序：400 → 压缩 → 重试）；答复返回「handled」；`_overflowRetried` 置位；`onCompressStart` / `onCompress` 各 **1** |
| 二次越窗 | AC-R3 / RB32 | 抛 `kind=context_overflow` · `retryable=false` · 报文含 `上下文超限——/compact` 与三实数 **1116488**；压缩不再增（1）；压后摘要仍在历史（不截断） |
| 止血面排除 | AC-R3 / RB33 | `stage:"compress"` 的 400 走既有失败链：`_overflowRetried` 仍 `false` · 压缩 1 · 回合请求 **0** · `_compressFailures` = 1 · 报错为本地三实数（非 `LLM API error`） |

夹具已去规格耦合：`limit` 由 `requestBudget({model:"deepseek-flash"}).limit` 现算（不写死 616,000），巨消息 = `limit + 5,000`、压缩线 = `limit + 150,000`。

**`node --check`**：七个改动档 + 单测档逐档 OK（八次调用零输出、exit 0）。

### 5.4 审计 / 评审轮次与终态

- **内部发散审计（explore，1 轮）**：24 行逐条比对（R1/R2/R3 · AC-R1–R6 · 修正轮落码项 · 三问块六名 · 两处实施轮裁定）⇒ 全部「符合」，无偏离 / 未实现 / 过度实现；清单外改动零。审计提出的三处**注释精度**已同轮修（`token-window` 采样侧写权措辞、`turn-loop` 越窗两出口措辞、`run-stages` 返回值措辞）⇒ 修正轮 1。
- **内部代码评审（advisor type=code，1 轮）**：**VERDICT: pass**，🔴 0 · 🟡 2（均为可选、非 must-fix）· 🔵 3。处置：🔵 两条（RB33 规格耦合、RB32 三实数断言）已在单测档修掉并复跑全绿 ⇒ 修正轮 2；🟡 两条与 🔵 一条（设计档 Δ 漂移）属设计档 / 注册面，按 D1 归父侧，见 5.6。
- **终态：clean**（无未收敛项；无 `stalled`）。

### 5.5 已知取舍（评审 🟡，登记而非改码）

1. **压缩失败仍重试一次**：`enforceContextFit` 把摘要失败吞进既有失败链后只按「压后估算 > limit」再判；在「估算偏低 + 服务端先 400」这一本批目标场景里，压缩失败 ⇒ 历史未变 ⇒ 再判过线以下（不抛）⇒ 仍重试一次 ⇒ 必然再吃一次 400 才收束（每 run 至多多一次注定失败的请求，且用户先见「压缩失败」再见「上下文超限」）。这是设计 §6.17.1 链三「重试一次」的字面语义，未擅自加门（把重试绑在「压缩确实重建历史」上是新判据，须设计裁决）。
2. **系数 4→3 的两个连带面未进设计档「读数面影响」**：同一 `estimateRequestTokens` 还喂 ① TPM/RPM 闸（`rate.mjs:103` / `:107` / `:117`——估算上抬 1/3 可让 tpm 落在旧/新估算之间的渠道整段失闸、走「告警 + 记账 + 直接放行」支）；② prune 门槛与 tail 预算（`token-window.mjs:242` 的 `PRUNE_MIN_TOKENS` 判据、`tailBudgetTokens` 比较）同样上移约 33%（prune 合格集变大、tail 更早收紧）。两处方向都偏保守，但设计档记成零改。

### 5.6 设计档漂移（我的 diff 触碰到的；设计档是 eng-designer 笔，未改）

- 行号坐标已下移：`rate.mjs` `_estimateSingle` → `:70-74`；`token-window.mjs` `recordTokenSample` → `:171`；`session.mjs` `fields` → `:128-150`；`session-lifecycle.mjs` `applySession` → `:97`；`turn-loop.mjs` 调用点 → `:152`（`design:904` 写 `:131`）；`run-stages.mjs` 守卫 → `:158`（`design:904`/`:832` 写 `:137-158`）。
- `design:904` 仍写 `enforceContextFit(agent, ctx)` 两参形，未记第三参 `{ forceCompact }`。
- `design:840-845` 三问块未单列 `tokenSampleOf` / `restoreTokenSample`（§2.4 以「样本读/写两个小函数」登记过，设计档未逐名落）。
- §6.16.9「本批预期 Δ」与实读漂移（现况列同源、Δ 列为预估）：`token-window` 209 → 预估 225 / 实读 247；`session-lifecycle` 421 → 预估 435 / 实读 427；`turn-loop` 306 / 实读 310；`run-stages` 348 / 实读 355；`rate` 175 / 实读 176；`setup` 312 = 实读 312。
- **§2.7「11-1 / 11-2 / 11-3 断言面零改」不成立**：集成夹具 `test/integration/context-overflow-guard.test.mjs:36` 的 `asciiTokens(n) = "x".repeat(n * 4)` 经 `estimateText` 走系数——`/3` 后同一夹具估算变 `×4/3`。实跑 `node --test test/integration/context-overflow-guard.test.mjs` ⇒ **1 pass / 3 fail**：11-2 压缩数 2≠1（阈值面先压 + 守卫再压）、11-3 退化档「零压缩」1≠0（133,334 > 地板 128,000）、11-4 请求数 3≠1（自适应已生效，RTM 行本就计划改写）；11-1 绿但被测面变了（`620,000 × 4/3` 已过压缩线 750,000，压它的是阈值面而非「只可能来自守卫」）。

### 5.7 父侧待办（不在 coder 实施面，§2.7 / §4 指派父侧）

1. `test/RTM.md` §11：改写 11-4 为两半（§2.7 原句）；新增 11-5（断言形 = §2 修正轮「11-5 最终断言形」，夹具 `maxTokens: 393_216`，禁现盘 `65_536`）。
2. `test/integration/context-overflow-guard.test.mjs`：`asciiTokens` 的 `×4 → ×3`（或改喂字面估算）；11-1 的「只量守卫」前提随系数失效需重立；11-4 拆两半。11-2 / 11-3 的断言值随之复位。
3. 需求档 F-CC6–F-CC8 与设计档两处口径（5.6 前四条）由设计与父侧收口。

### 修正轮 5（批档重开 · VSC 端侧四处 + 单测档重建 —— 实施记录增量）

读法同 §2 的增量段：本段是 §5 的增量面，被本段取代的表述以本段为准（上方 5.1 的「7 源档」交付面、5.3 的「278 行」与「8 例」旧读数，即被取代的那三处）。

**本段范围** = §2 修正轮 2（三处）+ 修正轮 4（第四处）+ 「AC-R6 / AC-R7 再定形」。核七档（`provider/rate.mjs` · `token-window.mjs` · `session.mjs` · `session-lifecycle.mjs` · `agent/turn-loop.mjs` · `agent/run-stages.mjs` · `agent/setup.mjs`）上一轮已落，本轮**未触碰**。

#### 5.8 交付面（端侧四档 + 单测档重建；行数 = `wc -l` 口径，本机 2026-10-27）

| 文件 | 改前 → 改后 | 内容（坐标 = 改后实读） |
|---|---|---|
| `thincoder-vscode/src/agent/run-helpers.mjs` | 87 → 92（+5） | ① 写面：`tokenSampleOf` 自核单源引入（`:13`）；`agentState()` 增 `estimateSample`（`:90`） |
| `thincoder-vscode/src/extension/panel-session-write.mjs` | 150 → 157（+7） | ② 槽写面：`saveLines` 槽对象显式键（`:116`，与同函数 `pendingReminders` 同式三目——逐键构造、无 `...extra` 泛 spread） |
| `thincoder-vscode/src/agent/agent-state.mjs` | 159 → 168（+9） | ③ 读面：第三参解构增 `provider`（`:95`）；`restore` 支调 `restoreTokenSample(agent, slot?.estimateSample, provider)`（`:132`） |
| `thincoder-vscode/src/agent/setup.mjs` | 322 → 322（**0**） | ④ 装配面：`:197` 第三参 `{ cfg: cfgBag, restore }` → `{ cfg: cfgBag, restore, provider }`（原位一参，与设计「预计 0」一致） |
| `docs/batches/2026-10-27-context-budget-underestimate.test.mjs` | 重建 **416** 行 | RB24–RB34 共 8 个 `test()`（RB24+RB25 合例 · RB28–RB30 合例 · RB34 四面合例）；收口前删除 |

**清单外改动：零**（四个被触碰的端档 + 单测档全部落在 §4 修正 2 的十一档批准实施面内）。

#### 5.9 验收读数（AC-R6 / AC-R7）

- **AC-R6**：`node --check` **十一档逐档 OK**（7 核 + 4 端），单测档同命令 OK（合计 12 次调用零输出）；`node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs` ⇒ **tests 8 · pass 8 · fail 0**（duration ≈1.1 s）。
- **AC-R7**（RB34：三组行为面读数 + 一组结构机检）：
  - **写①**：空样本 ⇒ `estimateSample === null`（键恒在场）；`agent._tok` 置样本 ⇒ 取值等于 `tokenSampleOf(agent)` **且**等于字面 `SAMPLE`（`{key:"openai:deepseek-flash",num:2668,den:1334,est:1}`）。
  - **写②**：`extra` 带样本 ⇒ 槽 JSON 同值；`extra = { seed }`（键缺席，现场 = 五处不携 `agentState` 的保存）⇒ 槽内既有样本**逐字保留**；`extra.estimateSample = null`（键在场、空样本）⇒ 槽落 `null`（内存即权威，同 CLI `saveSession`）。
  - **读③**：直调 `applySlotSessionState(agent, { slot }, { cfg, restore: true, provider })` ⇒ `_tokRatio = 2`；`restore:false` ⇒ 1；坏样本 `{key:"openai:x",num:"NaN",den:0}` ⇒ 1 且不抛；`provider` 缺省 ⇒ 1 且不抛（④ 漏接后的退化档）。③ 只证读回逻辑、不证 ④ 接线。
  - **④ 结构机检（断言对象逐字）**：源文 = `thincoder-vscode/src/agent/setup.mjs`；取 `applySlotSessionState(` 起、**括号配平到调用结束的整段文本**；先断言该调用点唯一，再按顶层逗号切实参，断言**第 3 参**匹配键位正则 `/(?:^|[{,]\s*)provider\s*(?::\s*[A-Za-z_$][\w$]*\s*)?(?:,|})/`（简写 ∥ `provider: <标识符>` 均可；值形 `model: provider` 不算键）。另有一条反证：全档（段外）另含 `provider` ⇒ 全档 grep 恒绿，故不退化为全档 grep。判别力已反向验证：第三参改回 `{ cfg: cfgBag, restore }` ⇒ 该断言红。

#### 5.10 审查轮次与终态

- **内部发散审计（explore，1 轮）**：逐条比对修正轮 2 / 修正轮 4 / AC-R6 / AC-R7 / RB24–RB34 ⇒ **符合 24 · 偏离 0 · 未实现 0 · 过度实现 0 · 清单外 0**。
- **内部代码评审（advisor · type=code，1 轮）**：**VERDICT: pass**；🔴 0 · 🟡 1（可选：本轮端面读数未进 §5——即本段补的这一页）· 🔵 4（§6.16.9 三行 Δ 低估 · `_tok` 无显式初值 · RB34 写① 值形由单源函数自证 · 链三分类锚耦合提示词散文）。
- **修正轮 1**：两条可选项当场落码（RB34 追加字面 `SAMPLE` 断言 · `SUMMARIZE_SIG` 补「改提示词首句需同改本行」联动注）⇒ 复跑 **tests 8 · pass 8 · fail 0**。另有 1 次实施中自纠：`estimateSample` 块原插在 `pendingReminders` 与 `sessionStart` 注释块之间（注释归属会被读错），已前移到 `engDesignTokens` 之后。
- **终态：clean**（无未收敛 must-fix；无 `stalled`）。

#### 5.11 设计档 / 登记面漂移（我的 diff 触碰到的；设计档是 eng-designer 笔，未改）

1. **§6.16.9 三行端档 Δ 低估**：表头口径自陈「收官一律以实读为准」（`design:611`），三行仍写 `预计 +1`（`design:639-641`）；实读增量 = `run-helpers` **+5** / `panel-session-write` **+7** / `agent-state` **+9**（差额来自随迁的说明注释；`setup.mjs` 行 Δ 0 与预测一致）。
2. **§6.16.9 单测档行读数陈旧**：`design:643` 记 278 行，重建后 **416** 行（RB34 增量已落）。
3. **VSC `buildTopLevelAgent()` 未显式初始化 `_tok` / `_tokRatio`**（评审 🔵，未改）：核工厂有初值（`thincoder-core/agent.mjs:76` `_tok: null, _tokRatio: 1,`），端侧今天靠 restore 支 `restoreTokenSample` 隐式建立 + 消费面 `?? 1` 兜底（`token-window.mjs:142`），无行为后果。设计四处未列该初始化 ⇒ 本批不擅自加键，建议另立一笔。

## §6 验证与收口（父代理）

## 缺陷根因（一句话）

**`limit` 公式是对的，错的是喂进 `limit` 的那个数。**

估算低估 47%（491K 估 vs 723K 实数）⇒ 守卫放行 ⇒ 服务端 400；而校准需要一次成功响应，**第一次必然失败 ⇒ 比值永远校不准**。

## 三条链修了什么

| 链 | 改前 | 改后 | 读法 |
|---|---|---|---|
| 一 · 估算基准 | `ascii/4` | `ascii/3` + `ESTIMATOR_VERSION = 1` | `estimateText("x"×4000)`：**1000 → 1334** |
| 二 · 样本持久化 | 进程内变量，恢复即归 1 | 随槽 `estimateSample` 落/读，四道校验 | 恢复后 `_tokRatio = max(1, num/den)`；`est`/`key` 不符回 1 |
| 三 · 越窗自愈 | 识别 400 后只打标记 | 压一次 + 重试一次；二次越窗 typed 错误 | 压缩 1 · 重试 1 · 不截断 |

## 验证读数（父侧亲跑）

| 面 | 命令 | 结果 |
|---|---|---|
| 单测 | `node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs` | **tests 8 · pass 8 · fail 0** |
| 集成 | `node --test test/integration/context-overflow-guard.test.mjs` | **tests 5 · pass 5 · fail 0** |
| 语法 | `node --check` × 8 档 | 全 OK |
| 文档门 | `doc_check(gate)` 四档 | **PASS**（0 段问题）|

## 实施轮发现的一处设计错误（已收正）

设计档原把链三的安全点审计锚写成 `turn-loop.mjs:121-122`——**该区间实为回合进度 token 发射**（`if (depth > 0 && callbacks.onToken)`）。

**真正的门在 `turn-loop.mjs:143-144`**（`const lastRole = agent.history.at(-1)?.role` / `if (lastRole === "user" || lastRole === "tool")`）。

设计席已按实际代码改正。

## 实施轮否证的一处设计判断（已记明）

§2.7 原写「11-1 / 11-2 / 11-3 断言面零改」——**不成立**：集成夹具 `asciiTokens(n) = "x".repeat(n * 4)` 按旧系数造，`/3` 后同一夹具估算 ×4/3。

**父侧修法**：夹具 `n * 4 → n * 3` · 摘要桩 `2_800_000 → 2_100_000`（700K token × 3）· `11-4` 按 §2.7 定形拆成 `11-4a`（自适应成功）/ `11-4b`（二次越窗终局）。

## 单测档

`docs/batches/2026-10-27-context-budget-underestimate.test.mjs`（278 行 · 8 例）——**收口即删**，读数已入 §5 与本段。

## 已知边界（不在本批）

| 项 | 现状 | 处置 |
|---|---|---|
| **VSC 恢复面** | VSC 不经 `applySession`、且走端壳自有循环 ⇒ 连样本都不产（只补读面会读到恒 1 的比） | §2.8 已登记；恢复条件 = VSC 循环接 `recordTokenSample` 的那批同批带读面 |
| **压缩失败仍重试一次** | 目标场景下每 run 至多多一次注定失败的请求 | 按设计字面实现；收紧 = 新判据，须另立批次 |
| **系数连带面** | TPM/RPM 闸与 prune/tail 预算判据同幅上抬约 1/3 | 已记入 §6.17.1；非缺陷，是同一系数的必然连带 |
| **用户 `maxTokens`** | 应急 `393216 → 65536` 已就位 | 本批不回收；是否回调由用户定 |

## 台账

`#1827`（需求池 · CONTEXT-COMPACTION）——本批收口后核销。

**§6 修正（重开后 · 2026-10-27）——取代本段之上「已知边界」表的 VSC 行**

## 为什么改

评审第 3 轮 🔴 #1。本段上方「已知边界（不在本批）」表里的 VSC 行写的是「VSC 不经 `applySession`、且走端壳自有循环 ⇒ 连样本都不产（只补读面会读到恒 1 的比）」，处置写「§2.8 已登记；恢复条件 = VSC 循环接 `recordTokenSample` 的那批同批带读面」。

**该行整条作废**，理由 = §1 重开记录已记明的实核结论：

| 核的什么 | 读数 |
|---|---|
| `thincoder-vscode/src/agent.mjs` | **10 行转口档**——头注「VSC 主循环退役（2026-09-29 parity-b1）：depth-0 循环本体归核 `@thincoder/core/agent.mjs` `runAgent(...)`」 |
| VSC 真调点 | `thincoder-vscode/src/extension/panel-turn-loop.mjs:230` `const content = await runAgent(agent, turnInput, callbacks, coreOpts)` |
| `recordTokenSample` 全仓调用点 | **唯一一处** = `thincoder-core/agent/turn-loop.mjs:221` ⇒ 双端同源 |
| 真实缺口 | 端侧写 / 读两处 + 槽对象逐键构造的第三处（详见 §2 修正轮 2） |

## 已知边界（修正后）

| 项 | 现状 | 处置 |
|---|---|---|
| **VSC 端面** | **本批已补**（三处：`agentState` 值 · `saveLines` 显式键 · `applySlotSessionState` restore 支） | 验收 = AC-R7 / RB34；不再登记为边界 |
| **压缩失败仍重试一次** | 目标场景下每 run 至多多一次注定失败的请求 | 按设计字面实现；收紧 = 新判据，须另立批次 |
| **系数连带面** | TPM/RPM 闸与 prune/tail 预算判据同幅上抬约 1/3 | 已记入 §6.17.1；非缺陷，是同一系数的必然连带 |
| **用户 `maxTokens`** | 应急 `393216 → 65536` 已就位 | 本批不回收；是否回调由用户定 |

**§6 修正 2（评审第 4 轮 N2a · 2026-10-27）——「已知边界（修正后）」表 VSC 端面行改口**

## 为什么改

本段上方「已知边界（修正后）」表的 VSC 端面行写「**本批已补**（三处：…）」——两处不准：

1. **三处 → 四处**：第 ④ 处 = 装配面 `thincoder-vscode/src/agent/setup.mjs:193-197` 的第三参对象增 `provider`（父侧实读：现体 `}, { cfg: cfgBag, restore })` 无该键；`provider` 是 `hydrateRun` 形参、在该点已在作用域）
2. **「已补」→「已纳入本批」**：代码未动（`batch:231` 自陈「本批代码未动（coder 落）」；§4 修正 2 表体 8–11 档无「已落」标记）

## 已知边界（修正后 2）

| 项 | 现状 | 处置 |
|---|---|---|
| **VSC 端面** | **已纳入本批（端侧四处待落）**：① `run-helpers.mjs` `agentState()` 带值 · ② `panel-session-write.mjs` `saveLines` 显式键 · ③ `agent-state.mjs` `applySlotSessionState` restore 支读回 · ④ `setup.mjs:193-197` 第三参增 `provider` | 验收 = AC-R7 / RB34（③ 行为面 + ④ 结构机检）；**收口前必须四处全落**，否则端比恒 1 且 RB34 仍绿（绿着漏） |
| **压缩失败仍重试一次** | 目标场景下每 run 至多多一次注定失败的请求 | 按设计字面实现；收紧 = 新判据，须另立批次 |
| **系数连带面** | TPM/RPM 闸与 prune/tail 预算判据同幅上抬约 1/3 | 已记入 §6.17.1；非缺陷，是同一系数的必然连带 |
| **用户 `maxTokens`** | 应急 `393216 → 65536` 已就位 | 本批不回收；是否回调由用户定 |

## 同时采纳的两处读数

- `thincoder-vscode/src/agent/setup.mjs` 的 Δ：**预计 0**（`:197` 那行已存在，增一参是同行原位改）——父侧派单原写 `+1`，设计席按改法实算为 0，**以 0 为准**
- `panel-session-write.mjs` 行数 **151 → 150**（`wc -l` 口径；151 = read 工具把尾随换行记成第 151 行，与 `session-lifecycle` 426/427 同源）

## 重开轮收口读数（2026-10-27 二次收口）

### 端侧四处已落（父侧实读）

| # | 档 | 改了什么 | 落点 |
|---|---|---|---|
| ① | `thincoder-vscode/src/agent/run-helpers.mjs` | `agentState()` 增 `estimateSample: tokenSampleOf(agent)` | `:90`（87 → 92） |
| ② | `thincoder-vscode/src/extension/panel-session-write.mjs` | `saveLines` 槽对象显式键（三目，键缺席保留槽值） | `:116`（150 → 157） |
| ③ | `thincoder-vscode/src/agent/agent-state.mjs` | 第三参解构增 `provider`；restore 支调 `restoreTokenSample` | `:95` / `:132`（159 → 168） |
| ④ | `thincoder-vscode/src/agent/setup.mjs` | `:193-197` 第三参 `{ cfg: cfgBag, restore }` → `{ cfg: cfgBag, restore, provider }` | `:197`（322 → 322，原位一参） |

**④ 父侧实读确认**：`setup.mjs:197` = `}, { cfg: cfgBag, restore, provider })` ✓

### 验证（父侧亲跑，非转述）

| 面 | 命令 | 结果 |
|---|---|---|
| 单测（本批重建 RB24–RB34） | `node --test docs/batches/2026-10-27-context-budget-underestimate.test.mjs` | **tests 8 · pass 8 · fail 0** |
| 集成（越窗守卫） | `node --test test/integration/context-overflow-guard.test.mjs` | **tests 5 · pass 5 · fail 0** |
| 语法 | `node --check` × 十一档（7 核 + 4 端） | **11/11 OK** |
| 文档门 | `doc_check(gate)` 四档 | **PASS**（0 段问题） |

### coder 的两条自证（我采信，理由）

1. **④ 结构机检反向验证**：改回 `{ cfg: cfgBag, restore }` ⇒ 断言红；改回带 `provider` ⇒ 绿 ⇒ **判据有判别力**，不是恒绿
2. **先跑红灯基线再落码**：实施前四处均未生效（红），落码后同一探针转绿 ⇒ **不是先绿后补**

### 设计席收正的读数（`design:639-643`）

`run-helpers` 92 / **+5** · `panel-session-write` 157 / **+7** · `agent-state` 168 / **+9** · `setup` 322 / **0** · 单测档 416 / 收口删。

### 上抛项的处置

| 项 | 裁定 |
|---|---|
| VSC `buildTopLevelAgent()` 显式初始化 `_tok` / `_tokRatio` | **不另立**——核工厂有初值（`thincoder-core/agent.mjs:76`），端侧靠 restore 支建立，**今天无行为后果**；为未发生的情况加分支持久机制与该纪律相悖 |
| §6.16.9 读数漂移 | 已由设计席收正（`design:639-643`） |
| §2 状态行停在「修正轮 3」 | 已改（`batch:69`） |

### 单测档

`docs/batches/2026-10-27-context-budget-underestimate.test.mjs`（416 行 · 8 例）——**收口即删**，读数已入 §5.8–5.11 与本段。
