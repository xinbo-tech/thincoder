# 2026-10-28 · sse-first-chunk-idle
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-28 · 来源 = 用户 2026-10-28 00:27 逐字「修」—— 批准修 `#1858`（SSE 空闲超时把首 chunk 与流中途断塞进同一个 120 秒，本地 spark 集群长上下文必误杀）。用户 00:25 给的现场：「我就是刚碰到这个错，我们的本地 spark 集群在长上下文时首 token 一定会超过这个时间。」。
> 台账 = #1859（PROVIDER · 归批）。前情 = 2026-10-28-retransmit-forensics（进行中）∥ 2026-10-28-product-text-sweep（进行中）∥ 2026-10-28-doc-drift-sweep（进行中）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 用户现场与需求

**用户 2026-10-28 00:25 逐字**：「呃，我就是刚碰到这个错，我们的本地 spark 集群在长上下文时首 token 一定会超过这个时间。」

**⇒ 这条把 `thincoder-core/config-defaults.mjs:16` 那句注释「`≤0` / 非有限数回退本值（不禁用——**无现场判据**）」的前提推翻了一半：现在有现场了。**

**用户可见形态**：spark 集群长上下文请求 ⇒ 响应头很快回来（HTTP 200）⇒ 但**第一个 chunk 要等几分钟** ⇒ 撞 `SSE idle timeout: no data for 120s`（`thincoder-core/provider/sse.mjs:210`）。

### 1.2 父侧实读的机制现状

**`thincoder-core/provider/sse.mjs:215-218` 逐字**：

```
  armIdle()
  try {
    for await (const chunk of response.body) {
      armIdle()
```

**⇒ `:215` 首挂一次（用 `idleMs`），`:218` 每收一个 chunk 重挂**同一个** `idleMs`。**

**⇒ 于是「等第一个 chunk」与「流中途断没断」共用一个旋钮。**

### 1.3 为什么这不是「调大默认值」能治的

**两个阶段的正常时长差两个数量级：**

| 阶段 | 在等什么 | 正常时长 |
|---|---|---|
| 首 chunk 前 | 上游排队 + **prefill** | 长上下文时可达数分钟（用户的 spark 场景） |
| 首 chunk 后 | 模型吐字 | 毫秒级 |

**⇒ 调大 `agent.bodyIdleTimeoutMs` 会把两者一起放松：**流中途真卡死时，发现时间也变成同一个长值。**

**⇒ 那是把一个参数用在了两种失败模式上 —— 治了这个、钝了那个。**

### 1.4 父侧的处置（分两层）

- **即时缓解（已执行）**：把用户的 `~/.thincoder/config.json` 的 `agent.bodyIdleTimeoutMs` 设为 `600000`（原未设，走默认 120000），备份在 `config.json.bak-20261028`。**这是顶住，不是修好** —— 代价写清：流中途卡死也要等 10 分钟才报错。
- **机制修复（本批）**：让「等首 chunk」与「流中途」分开计。方向见 §1.5。

### 1.5 本批要定的事（交给设计席判，父侧只给方向与约束）

1. **首 chunk 的窗口取什么值**：父侧倾向**复用已有的 `fetchTimeoutMs`**（默认 600 秒，语义同为「等上游」）—— 零新配置键；但设计席可判更合适的形。
2. **怎么改最小**：`readSSE` 的 `armIdle` 分两态（首挂 ∥ 常规），或签名加参数由三处调用传入（`thincoder-core/provider/core.mjs:265` · `google.mjs:144` · `responses.mjs` 三处）。
3. **不许破坏的**：`sse.mjs:198-202` 那条设计意图（「body 只要有数据流动就永不超时，连续 `idleMs` 无新 chunk 才判死」）—— 首 chunk 之后必须仍按 `idleMs` 判。
4. **`≤0` 的语义要不要跟着改**：那是另一个问题（能否禁用），本批**不夹带**；若设计席认为必须一并处置，写成上抛项。

### 1.6 第一轮评审裁定（父侧 2026-10-28 00:4x）

**评审判 changes-required（🔴 1 · 🟡 6 · 🔵 2），4/4 引证实读全中。十条全数接受。**

| # | 级别 | 裁 | 理由与处置 |
|---|---|---|---|
| 1 | 🔴 | **Fixed（按 ② 裁）** | **E2（传输层首 chunk 窗）移出本批。** 全文唯一逐字现场是用户 00:25「spark 集群长上下文时首 token 一定超过 120 秒」——没提代理。代理径是设计席按「只改读侧则代理用户照旧被误杀」的对称推理补的，有道理但无现场、无复现路径；而它带走 7 个源文件里 5 个只为 `_firstChunkMs` 过手 + 2 条用例 + 1 条验收 + 1 组相位串与文案。分支要有现场才走——没有 scene 的防御是没人走的路径。修完读侧 E1 即解用户现场。 |
| 2 | 🟡 | **Fixed** | 即时缓解的回收没写：用户配置 `agent.bodyIdleTimeoutMs = 600000` 是顶住用的，修好后不回收 ⇒「流中途卡死等 10 分钟」原样留着，而那恰是 E1 要消掉的一半。⇒ 增回收步骤 + 判据（回收后首 chunk 慢仍拿到正文、中途停摆按 120s 判死）。 |
| 3 | 🟡 | **Fixed** | 代价没认：首 chunk 窗取 600s 后，「响应头已回、此后永不出字节」的发现时间由 120s 变 600s。而 D1 拒掉「调大 `bodyIdleTimeoutMs`」的理由正是这条代价 ⇒ 同一笔账不能一边拒一边不认。⇒ 增认账行 + 一条默认值判据（默认配置下首 chunk 永不发按 600s 报）。 |
| 4 | 🟡 | **Fixed** | `docs/core/design/TIMEOUT-DIGEST.md` 的 §2.1 八处坐标仍是上一批实读（`:67` / `:68` / `:71`），与新 §2.4 的现坐标并存 ⇒ 同档两套坐标。⇒ 同批校到现形，或表头注明坐标所属批次。 |
| 5 | 🟡 | **Fixed** | 三个新相位串与两条新文案进了 abort 溯源面，而词汇表归属面是 AGENT-LOOP 板（`docs/core/design/PROVIDER.md:117` 写「词汇表与判定归 AGENT-LOOP 板，本档只指针」）；且新名无三问答复。⇒ 补既有件表（`sse-idle` 族记 `existing but unusable:` —— 它分不出「流断了」与「还没开始」；其余记 `none found:`），词汇表若为闭集则 AGENT-LOOP 登记行进落点。 |
| 6 | 🟡 | **Fixed** | 三面文案只定了一面：直连给了 `SSE first-chunk timeout: no data for Ns`，google 面只有相位串，传输面文案只出现在用例行 T16 ⇒ §2.4 接口契约与 A14 都没写全。 |
| 7 | 🟡 | **Fixed** | 两态门的关系未定：`thincoder-core/proxy-transport.mjs:104` 现形是 `if (bodyIdleMs > 0)`，而首 chunk 窗缺省取 `bodyIdleMs` ⇒ `≤ 0` 会把新窗一并静默关掉。⇒ 首挂门看 `firstChunkMs > 0`、重挂门看 `idleMs > 0`，两态各自成门 + 一对边界用例。E2 移出后本条随传输面一并移出，但仍须在 §7 边界记一句「传输面未处置」。 |
| 8 | 🟡 | **Fixed** | §9 不是按 delta 写：`test/RTM.md` 故事 19 两行已在盘（`:230` / `:231`），但没答「哪些既有行被本批动到 ∥ 冗余 ∥ 缺」。⇒ 增一行判据式陈述。 |
| 9 | 🔵 | **Fixed** | 三档行数比批档多 1（`sse.mjs` 301 vs 记 300 · `core.mjs` 495 vs 494 · `proxy-transport.mjs` 301 vs 300），疑 `wc -l` 与末行换行口径差。⇒ 收口时 `wc -l` 复核；`core.mjs` 495 加 4 行 = 499，仍在 500 咨询线内。 |
| 10 | 🔵 | **Fixed** | §7 同一条边界两副本（`:229` 与 `:234`）；另 §5 的 A9（`node thincoder-core/test/run.mjs` 全绿）是上一批回归行，不属本批门。⇒ 两条并一条；收口不把 A9 当本批验收。 |

**评审也核了正面**：机制单源与落点正确（§2.4 新增；`docs/core/design/PROVIDER.md:112` 与 `docs/core/design/PROXY.md:36` 已就地成两窗，既有 `sse-idle` 族零改）· closest-precedent 行与 survey-evidence 行齐备 · 读侧机制与实读一致（`thincoder-core/provider/sse.mjs:205` 首挂、`:210` 文案与相位串、`:198` 设计意图未破）· 缺省入参 = 老行为 · 验收只跑改动面单档。

**⇒ 修正轮：E2 移出要成一条正文处置（不是删段落了事）—— §7 边界写明「传输面未处置，见台账」，并把代理径的事实面记进上抛项。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

台账 `#1859`（PROVIDER · 归批）· 用户裁定 = `#1858`「修」。

| # | 条目 | 覆盖 |
|---|---|---|
| E1 | 响应体阶段「等首 chunk」与「流中途停摆」分两个窗计时：首 chunk 前用 `effectiveFetchTimeoutMs`（默认 600s），首 chunk 后仍按 `agent.bodyIdleTimeoutMs`（默认 120s）——读侧面（`thincoder-core/provider/sse.mjs` · `thincoder-core/provider/google.mjs`） | 本批 |
| E2 | 传输层看门狗（`thincoder-core/proxy-transport.mjs`）的首 chunk 窗 | **移出本批（另批）**——唯一的逐字现场未提代理，无日志、无复现命令、无代理配置下的读数；分支要有现场才走。事实面与另批所需 = 设计档 §8 上抛①，边界 = 设计档 §7 |
| E3 | 超时文案与相位串按相位分（`sse-first-chunk` ∥ `google-sse-first-chunk`），既有串不动 | 本批 |
| E4 | 回收即时缓解：用户 `~/.thincoder/config.json` 的 `agent.bodyIdleTimeoutMs = 600000`（顶住用）在修复落地后恢复默认（`config.json.bak-20261028` ∥ 删键），判据 = 设计档 §5 A16 | 本批 |

**明确不在本批**：`agent.bodyIdleTimeoutMs` 的默认值与 `≤0`（能否禁用）语义（§1.5 第 4 条 —— 不夹带）；`agent.fetchTimeoutMs` 进 `settings list`（既有边界）；anthropic 直连读侧补空闲定时器（既有边界，见 2.7）；首 chunk 阶段的用户提示文案。

### 2.2 设计档落点

机制单源 = `docs/core/design/TIMEOUT-DIGEST.md` **§2.4「首 chunk 窗与流中途空闲窗分计」**（本批新增）；§1 增该机制的 closest-precedent 行 / survey-evidence 行 / 两条分支依据行；§2.1 八处消费点坐标校到现形；§3 三档行数校到现形；§4 增 D7–D10；§5 增 A11–A16；§6 增 T11–T16；§7 增「传输面未处置」边界；§8 增上抛①（代理径）；§9 按 delta 重写。

消费面：`docs/core/design/PROVIDER.md:112-115`（body 阶段两窗）本批已就地成两窗；`docs/core/design/PROXY.md:36` 校正为**单窗**（`_bodyIdleMs` 管首字节前后两段）并注明该面分窗不在本批——否则该档会描述一个不存在的 `_firstChunkMs` 传参面。

集成索引：`test/RTM.md` **故事 19**（新立两行 19-1 / 19-2，用例文件 = `test/integration/sse-first-chunk-window.test.mjs`，收口时由父侧执行）。

### 2.3 机制设计（要点；全文见设计档 §2.4）

- **两个失败模式、两个窗**：首 chunk 之前等的是上游排队 + prefill（长上下文可达数分钟）；首 chunk 之后等的是模型吐字（毫秒级）。一个旋钮管两件事 ⇒ 治了这个钝了那个。
- **首 chunk 窗取值 = `effectiveFetchTimeoutMs(provider)`**（默认 600s，`agent.fetchTimeoutMs` 可配）：零新配置键；语义同为「等上游开口」；头阶段超时早已用同一值（`thincoder-core/provider/core.mjs:428`）。
- **两态武装、一次翻转**：定时器首次挂用 `firstChunkMs`；第一个 body 字节到达后此后每次重挂用 `idleMs`，翻转不可逆（`thincoder-core/provider/sse.mjs:205-218` 的 `armIdle` 按 `gotFirstChunk` 取窗；`:215` 首次挂 + `:218` 每 chunk 重挂 = 现有两处调用点；`thincoder-core/provider/google.mjs:227-240` 同形）。
- **传输面不在本批**（`thincoder-core/proxy-transport.mjs`）：该面首 chunk 窗无现场、无复现路径，随 E2 移出（设计档 §7 ∥ §8 上抛①）；`proxy.mjs` / `proxy-transport.mjs` / `anthropic.mjs` / `responses.mjs` 零改，不新建 `_firstChunkMs` 传参面。
- **入参缺省 = 老行为**：`readSSE` / `parseGeminiStream` 的 `firstChunkMs` 缺省 = `idleMs`；`thincoder-core/provider/list-models.mjs:33` 只传 `_bodyIdleMs` ⇒ 零变。
- **代价认账**：首 chunk 窗默认 600s ⇒「响应头已回、此后永不出字节」的发现时间由 120s 变 600s；这是本设计的已知代价（与拒掉「调大 `bodyIdleTimeoutMs`」的理由同源），缩短的旋钮只有 `agent.fetchTimeoutMs`。

### 2.4 受影响文件（行数为本轮实读 2026-10-28）

| 文件 | 当前行数（实读） | 预期 Δ | 改动 |
|---|---|---|---|
| `thincoder-core/provider/sse.mjs` | 301 | +6 / −2 | `:93` 收 `firstChunkMs = idleMs`；`:203-218` `gotFirstChunk` + 按态取窗 / 取文案 / 取相位串；循环体收到 chunk 即翻转 |
| `thincoder-core/provider/google.mjs` | 299 | +5 / −1 | `:144` 传 `firstChunkMs`；`:178` 形参；`:227-240` 同 sse 的两态臂 |
| `thincoder-core/provider/core.mjs` | 495 | 0（两行改写） | `:265` / `:285` 传 `firstChunkMs: effectiveFetchTimeoutMs(provider)` |
| `docs/batches/2026-10-28-sse-first-chunk-idle.test.mjs`（新） | — | 新建 | 单元用例 T11–T16（设计档 §6），随批删除 |

不动：`thincoder-core/config-defaults.mjs`、`thincoder-core/config.mjs`、`thincoder-core/provider/list-models.mjs`；传输面四档（`proxy.mjs` / `proxy-transport.mjs` / `provider/anthropic.mjs` / `provider/responses.mjs`）随 E2 一并零改。

单文件最大 = `thincoder-core/provider/core.mjs` 495 行（本批 Δ = 0，不出 500 行咨询线）；`sse.mjs` 301 + 4 = 305、`google.mjs` 299 + 4 = 303，均在线内，本批不重构。行数口径：`sse.mjs` 301 / `google.mjs` 299 / `core.mjs` 495 = 本轮三档实读（上一轮记的 300 / 298 / 494 各少 1 行，差在末行换行是否计入——以本轮读数为准，不构成档位影响）。

### 2.5 验收对照（逐条指回 2.1 的条目；判据全文在设计档）

| 条目 | 判据落点 | 单元用例 |
|---|---|---|
| E1 | 设计档 `docs/core/design/TIMEOUT-DIGEST.md` §5 A11 · A13 · A15 | `node --test docs/batches/2026-10-28-sse-first-chunk-idle.test.mjs`（T11 / T13 / T14 / T16） |
| E3 | 设计档 §5 A12 · A14（文案与相位串） | 同上（T12 / T15） |
| E4 | 设计档 §5 A16（回收后判据） | 同上（T11 ∥ T13 在回收后配置下重跑 = 同一断言） |

**四步自检**：首 chunk 慢 ⇒ 按期拿到正文（T11）；首 chunk 永不到 ⇒ `SSE first-chunk timeout` + 首 chunk 相位串（T12 / T15）；首 chunk 后停摆 ⇒ 仍按 `idleMs` 判死（T13）；未传新入参 ⇒ 零变（T14）；默认窗来源 = 600s 且首挂窗 = 传入值（T16）。

### 2.6 关键决策

| # | 决策 | 被拒选项与理由 |
|---|---|---|
| D1 | 首 chunk 窗复用 `effectiveFetchTimeoutMs`，不新立配置键 | 新立 `agent.firstChunkTimeoutMs`——现无「首 chunk 窗要 ≠ 头阶段窗」的现场，多一个键多一个用户要学的旋钮；调大 `bodyIdleTimeoutMs`——正是要修的病（流中途停摆的发现时间同比变长） |
| D2 | 只修读侧面（`readSSE` ∥ `parseGeminiStream`），传输层看门狗另批 | 只改读侧会留代理径未处置——但同批改传输面需要现场，而唯一的逐字现场（spark 报障）未提代理、无日志、无复现路径；分支要有现场才走，把没有现场的防御写进去 = 一条没人走的路径（带文案 + 相位串 + 用例一起长进来） |
| D3 | 相位串按相位分，既有串零改 | 沿用 `sse-idle`——报障时无法区分「流断了」与「还没开始」（正是本次报障的表述缺口）；新增串进 abort 溯源面，不改既有分类判据 |
| D4 | `firstChunkMs` 缺省取 `idleMs`（入参缺省 = 老行为） | 缺省取 `600000` 常量——未传的调用者（`list-models`）行为会静默变化 |

### 2.7 上抛项（待主 agent 裁）

`[上抛·待裁]` ① **代理径（传输层看门狗）的首 chunk 窗**

- 事实面：`thincoder-core/proxy-transport.mjs:104` 现形是 `if (bodyIdleMs > 0)` 单窗、`:126` 头到齐即首次挂。
- 推理：按对称性，代理用户同样会在首字节前被 120s 误杀。
- 缺口：无现场、无复现命令、无代理配置下的读数 ⇒ 本批不做（E2 移出）；另批需要现场或可复现路径。

`[上抛·待裁]` ② **首 chunk 窗可能短于流中途窗**：用户把 `agent.fetchTimeoutMs` 调到 < 120s 时，「等首 chunk」会比「流中途」更早判死。本设计判为「用户明确要求更短的等上游窗口」不加钳制；若要求首 chunk 窗恒 ≥ `bodyIdleTimeoutMs`，请裁。

`[上抛·待裁]` ③ **anthropic 直连读侧仍无空闲定时器**（既有边界）：该径无读侧 timer，本批也不向它传首 chunk 窗；是否补定时器 = 新机制，请另批裁定。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**状态行**：评审通过（轮次 2 回评：轮次 1 十条全闭（🔴 0），新增 1 🟡 + 3 🔵 不挡通过）

评审对象 = 批档 §2（E1–E3 · D1–D4 · 2.4 受影响文件 · 2.5 验收 · 2.7 上抛）+ 设计档 §1 依据行 · §2.4 · §5 A11–A14 · §6 T11–T16 · §7 · §9 + 消费面 §6.3（`docs/core/design/PROVIDER.md:112-115` · D-PR6）+ `docs/core/design/PROXY.md:36` + `test/RTM.md` 故事 19。

| # | 维度 | 级别 | 一句话 |
|---|---|---|---|
| 1 | 分支依据（6b）∥ 集成（12） | 🔴 | 传输层首 chunk 窗（E2）无现场、无复现路径 |
| 2 | 需求覆盖（1） | 🟡 | 用户配置的即时缓解 600000 无回收动作 |
| 3 | 验收（5） | 🟡 | 默认 600s 的发现时延代价未认账、无用例 |
| 4 | 文档归属 ∥ 状态（7） | 🟡 | 同档 §2.1 消费点坐标停留在上一批实读 |
| 5 | 既有件核查（11） | 🟡 | 三个新 detail 值的词汇表归属面未入落点、无三问答案 |
| 6 | 清晰度（4） | 🟡 | 首 chunk 相位文案三面只定了一面 |
| 7 | 清晰度（4） | 🟡 | 传输面两态臂与既有 `bodyIdleMs > 0` 门的关系未定 |
| 8 | 集成设计（12） | 🟡 | §9 未按 delta 写；传输面在 RTM 零行 |
| 9 | 行数抽查（8） | 🔵 | 三档实读各比批档多 1 行 |
| 10 | 文档卫生（7） | 🔵 | §7 同一条边界两副本；A9 不属本批门 |

**1（🔴）传输层首 chunk 窗无现场**

- 唯一逐字引用的现场 = 用户 2026-10-28 00:25 的 spark 报障（批档 `:11`），全文未说该请求经代理、哪个渠开了 `providers[].proxy`。
- 设计给的理由只是对称推理：`docs/core/design/TIMEOUT-DIGEST.md:37`「代理径在首个 body 字节之前只有传输层看门狗在计时」+ 批档 `:123`「代理用户照旧误杀」——无日志、无复现命令、无代理配置下的读数。
- 这一支带走的同族物无法核对：`proxy-first-chunk-idle` 相位串与文案、7 个源文件里 5 个只为 `_firstChunkMs` 过手、T15/T16、A14，且 RTM 故事 19 无代理行。

**1 的建议**

- 二择一二。① 给出该支的现场或可复现路径（代理配置 + 首字节延迟夹具的实际读数 ∥ 报错原文）。
- ② 把 E2 移出本批：在 TIMEOUT-DIGEST §7 与批档 §2.1 登记为另批项；只留读侧 E1 即已解用户现场。
- 保留 E2 时补 `test/RTM.md` 故事 19 的代理行与业务入口。

**2（🟡）即时缓解未回收**

- 批档 `:47` 记「把用户的 `~/.thincoder/config.json` 的 `agent.bodyIdleTimeoutMs` 设为 `600000`」（备份 `config.json.bak-20261028`），覆盖表 ∥ 受影响文件 ∥ 上抛都不含回收动作。
- 后果：修复落地后用户仍是 600s，「流中途卡死也要等 10 分钟才报错」照旧——正是 E1 要消掉的那一半。
- 建议：增回收步骤（恢复备份 ∥ 删键回默认）+ 一条判据（回收后首 chunk 慢仍拿正文、中途停摆按 120s 判死）。

**3（🟡）默认 600s 的代价无判据**

- 首 chunk 窗改取 `effectiveFetchTimeoutMs` 后，`thincoder-core/provider/core.mjs:265` / `:285` 每次 `readSSE` 都按默认 600s 武装。
- ⇒「响应头已回、此后永不出字节」的发现时间由 120s 变 600s；A12 ∥ T12 ∥ T16 全把窗口设成 1.2–2s 小值，无一条覆盖默认值。
- 而 D1 拒掉「调大 `bodyIdleTimeoutMs`」的理由恰是这条代价（批档 `:122`）。
- 建议：增一条认账行 + 一条默认值判据，或把该相位的发现时间单列成可配项。

**4（🟡）同档两套坐标**

- `docs/core/design/TIMEOUT-DIGEST.md` §2.1 仍是上一批坐标：`:67`「`provider/core.mjs:256` / `:274` `readSSE` 调用」、`:68`「`provider/core.mjs:413` 代理传输分支」、`:71`「`provider/google.mjs:139` / `:172` Gemini 流解析器」。
- 新 §2.4（`:137-141`）与批档 `:97-101` 用现坐标（实读 `core.mjs:265` / `:285` / `:429`、`google.mjs:144` / `:178`）。
- 批档 `:79` 的落点只写「同批就地更新的消费面两行」，不含 §2.1；§3 表头仍注「行数为本轮实读 2026-10-24」。
- 建议：同批校 §2.1 八处坐标（或表头注明坐标属上一批），§3 表头改注本批实读。

**5（🟡）新名的既有件回答缺**

- 三个新 `detail` 值（`sse-first-chunk` / `google-sse-first-chunk` / `proxy-first-chunk-idle`）与两条新文案进了 abort 溯源面。
- 该词汇表的归属面是 AGENT-LOOP 板：`docs/core/design/PROVIDER.md:117`「词汇表与判定归 AGENT-LOOP 板（本档只指针）」；批档 `:79` 的落点不含该板。
- 新名（三个相位串、两条文案、`firstChunkMs` / `_firstChunkMs`）无一处三问答案（`existing:` ∥ `none found:` ∥ `existing but unusable:`）。
- 建议：补一张既有件表逐名作答（`sse-idle` 族 → `existing but unusable:` 无法区分「流断了」与「还没开始」；其余 `none found:`）；词汇表若是闭集，把 AGENT-LOOP 板登记行进落点。

**6（🟡）文案三面只定一面**

- §2.4 `:144` 只给 `SSE first-chunk timeout: no data for Ns`；google 面文案全文未定（只有相位串）。
- 传输面文案只出现在用例行 T16（`Response first-chunk timeout: no body data for 1.2s`），§2.4 接口契约与 A14 都没写。
- 建议：§2.4 把三面文案与相位串并列写全（照「流中途」那半的写法），用例行只引用。

**7（🟡）两态臂与既有门的关系未定**

- `thincoder-core/proxy-transport.mjs:104` 现形 = `if (bodyIdleMs > 0) idleTimer = ...`，而首 chunk 窗缺省取 `bodyIdleMs`。
- 照现形门写，`bodyIdleMs ≤ 0` 会把新加的首 chunk 窗一并静默关掉；设计未写门是否也按态分。
- 建议：§2.4 与批档 `:88` 补一句——首挂门看 `firstChunkMs > 0`、重挂门看 `idleMs > 0`，两态各自成门，并出一对边界用例。

**8（🟡）§9 不是 delta 写法**

- `test/RTM.md` 故事 19 两行已在盘（`:230-231`），但 §9 通篇不答「哪些既有行被本批动到 ∥ 冗余 ∥ 缺」，而本批改了每个 `readSSE` 调用点的默认首 chunk 窗。
- 传输面在 RTM 零行（19-1 ∥ 19-2 都是 CLI 直连桩）⇒ E2 的业务结果在集成层没有落点。
- 建议：§9 增一行判据式陈述（不改任何既有行的业务结果断言 ∥ 逐行说明被动到的那几行）；E2 按第 1 条处置后再定其行。

**9（🔵）行数抽查**

- `thincoder-core/provider/sse.mjs` 实读 301（批档 `:95` 记 300）· `thincoder-core/provider/core.mjs` 495（`:97` 记 494）· `thincoder-core/proxy-transport.mjs` 301（`:101` 记 300）。
- 三处一致偏 1，疑 `wc -l` 与末行换行口径差；无档位影响（core.mjs 495 + 4 ⇒ 499，仍在线内，拆点已在 `:106` 写明）。
- 建议：收口时 `wc -l` 复核一次即可。

**10（🔵）文档卫生**

- §7 同一条边界两副本：`:229`「不改 `agent.fetchTimeoutMs` 的可见性（它仍不在 `settings list` 里——本批不扩围）」与 `:234`「不改 `agent.fetchTimeoutMs` 的可见性：它仍不在 `settings list` 里」；批档 `:77` 记作「§7 增四条边界」。
- §5 的 A9（`node thincoder-core/test/run.mjs` 全绿）是上一批回归行，不属本批门（本批门 = 批档 `:112-114` 的单档跑）。
- 建议：§7 两条并一条；收口不把 A9 当本批验收执行。

**通过项**

- 落点与单源正确：§2.4 新增，`docs/core/design/PROVIDER.md:112-115` 与 `docs/core/design/PROXY.md:36` 已就地两窗，既有 `sse-idle` 族零改。
- closest-precedent 行（`:20`）与 survey-evidence 行（`:14` / `:25`）齐备。
- 读侧机制与实读一致：`thincoder-core/provider/sse.mjs:205-218` 首挂 + 每 chunk 重挂、`:210` 文案与相位串、`:198-202` 设计意图未破。
- 缺省入参 = 老行为；验收只跑改动面单档（批档 `:112-114`）；单档行数与拆点方案在位。

**计数**：🔴 1 · 🟡 7 · 🔵 2 · 合计 10。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 回评（只验轮次 1 的 10 条 + 修复引出的新问题）**

评审对象 = 批档 §1.6 / §2（E1–E4 · D1–D4 · 2.4 · 2.5 · 2.7）+ 设计档 §1 · §2.1 · §2.4 · §3 · §4 D7–D10 · §5 A11–A16 · §6 T11–T16 · §7 · §8 · §9 + 消费面 + `test/RTM.md` 故事 19。

本轮实读：`thincoder-core/provider/sse.mjs`（301 行）· `google.mjs`（299 行）· `core.mjs`（495 行）· grep 四档 `_bodyIdleMs` 坐标 · grep `firstChunkMs`（零命中）。

| # | 原# | 级别 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 1 | 🔴 | Fixed | E2 移出写成正文处置：§2.1 = 「移出本批（另批）」+ 设计档 §7 边界 + §8 上抛① + §4 D8；受影响源文件 7 → 3 |
| 2 | 2 | 🟡 | Fixed | 回收成条：§2.1 E4 + §5 A16 + §9 新行「即时缓解回收后行为回到默认」 |
| 3 | 3 | 🟡 | Fixed | 代价认账行（设计档 §2.4 末段）+ A15 + T16（默认 600s，1.2s 夹具等价验证） |
| 4 | 4 | 🟡 | Fixed | §2.1 八处坐标已校到现形；§3 表头改「行数 = 实读」+ 末注区分本批 / 上一轮 |
| 5 | 5 | 🟡 | Fixed | 既有件三问表三条（两条 `existing but unusable:` + `firstChunkMs` `none found:`）；词汇表归属面已答无闭集 |
| 6 | 6 | 🟡 | Fixed | google 面文案与相位串已并列写全；传输面随 E2 移出（残留措辞见新 N2） |
| 7 | 7 | 🟡 | Fixed | 读侧面「无 `≤0` 门也不需要」已写明并带实读依据；传输面门随 E2 移出，§7 边界有记 |
| 8 | 8 | 🟡 | Fixed | §9 按 delta 写：既有行 0 动 / 冗余 0 / 缺 0 + 理由；RTM 19-1 / 19-2 零改 |
| 9 | 9 | 🔵 | Fixed | 行数 301 / 299 / 495 已实读入表并写明 ±1 口径；core.mjs 495 + 4 = 499 在线内 |
| 10 | 10 | 🔵 | Fixed | §7 `agent.fetchTimeoutMs` 边界并成一条；本批门 = 批档 §2.5 单档跑，不含 A9 |
| N1 | (新) | 🟡 | New | §2 用文件编辑重写而非 append：破本档档头 append-only 纪律，且轮次 1 §3 的行号引用全部指空 |
| N2 | (新) | 🔵 | New | 设计档 §2.4 表前仍写「三面并列」，表内只剩两面（传输面已移出） |
| N3 | (新) | 🔵 | New | §3 表里四行未触碰档仍带上一轮坐标 / Δ，与 §2.1 现坐标并列（末注已说明，仍是两个数） |

**N1（🟡）§2 就地重写破 append-only**

- 本档档头 `docs/batches/2026-10-28-sse-first-chunk-idle.md:2`：「六段 append-only，一段一作者」——§2 是 eng-designer 的段。
- 现 §2 与新写内容同形，轮次 1 的 §2 正文已不在盘；批档 `:112` 现文 = 「### 2.4 受影响文件（行数为本轮实读 2026-10-28）」，而轮次 1 §3 写「验收只跑改动面单档（批档 `:112-114`）」⇒ 该引用指空。
- 同批先例 = `docs/batches/2026-10-28-doc-drift-sweep.md` 的 §2.8 / §2.9「修正轮」追加块（不动既有行）⇒ 修正轮的正规形。
- 建议：修正轮改为追加块（本档可补一条 §2.10 记「本轮就地重写了 §2」并重新锚定轮次 1 §3 的引用），后续轮次一律 append。

**N2（🔵）「三面并列」残留**

- 设计档 `docs/core/design/TIMEOUT-DIGEST.md:144` 写「（三面并列：文案 ∥ 相位串）」，表 `:148-149` 只有读侧 OpenAI / Gemini 两行；传输面已随 E2 移出。

**N3（🔵）§3 表与 §2.1 两套坐标并存**

- §3 `:174` anthropic 记 `:225`、`:175` responses 记 `:248` / `:267` / `:285`；§2.1 `:75` / `:76` 已记现形（`:229` / `:252` / `:271` / `:289`，grep 实读）。
- §3 末注 `:186` 已说明「其余行的行数与坐标 = 上一轮实读」，故按已注明收；收口若重算行数顺手一并校到现形即可。

**已复核仍正确（本轮实证）**：批档 §2.4 三档行数 301 / 299 / 495 与实读一致；`sse.mjs:205-214` 无 `idleMs > 0` 门、`:215` 首挂 / `:217-218` 每 chunk 重挂、`:210` 文案与 `sse-idle`；`google.mjs:227-236` / `:232` / `:239-240`；`firstChunkMs` 全仓 grep 零命中（`none found:` 成立）；RTM 故事 19 节注已写「传输层看门狗本批不动——另批」。

**计数**：🔴 0 · 🟡 1 · 🔵 3（新 N1 / N2 / N3）。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（2026-10-28 00:49）

**用户逐字**：「都批，自动跑完」—— 覆盖 A / B / C / D 四批的批准门（FR36 整批令：批内全链自动跑完）。

**⇒ 本批批准面 = 设计档 `docs/core/design/TIMEOUT-DIGEST.md` §2.4 的两窗分离（E1 · E3 · E4）+ 验收 A11–A16 + 三个源文件（`thincoder-core/provider/sse.mjs` · `google.mjs` · `core.mjs`）。**

**⇒ E2（传输层首 chunk 窗）不在批准面内** —— 已在 §1.6 裁定移出、另批立案。

**⇒ 批准即开工：eng-coder 已派（`#30`）。**

## §5 实施记录（eng-coder）

### 5.1 交付摘要（2026-10-28）

机制 = 读侧面两态武装、一次翻转：首挂窗用 `firstChunkMs`（生产面 = `effectiveFetchTimeoutMs(provider)`，默认 600s），收到第一个 body 字节后每次重挂改用 `idleMs`（默认 120s），翻转不可逆。

落点 = `thincoder-core/provider/sse.mjs`（`readSSE`）∥ `thincoder-core/provider/google.mjs`（`parseGeminiStream`）。三处生产调用点全量传参：`thincoder-core/provider/core.mjs:265` · `thincoder-core/provider/core.mjs:285` · `thincoder-core/provider/google.mjs:144`（全仓 grep 无第四处）。

受影响文件 = 批档 2.4 表内四档（`provider/sse.mjs` · `provider/google.mjs` · `provider/core.mjs` · 新建 `docs/batches/2026-10-28-sse-first-chunk-idle.test.mjs`）。

无表外改动：传输面四档（`proxy.mjs` / `proxy-transport.mjs` / `provider/anthropic.mjs` / `provider/responses.mjs`）零改。

| 条目 | 状态 | 落点 |
|---|---|---|
| E1 首 chunk 窗与流中途窗分计 | ✅ | `sse.mjs:205-224` · `google.mjs:230-245` · 三处调用点 |
| E3 相位文案与相位串按相位分 | ✅ | `sse.mjs:218-220` · `google.mjs:239-241`；既有 `sse-idle` / `google-sse-idle` 零改 |
| E2 传输层看门狗 | — 按评审裁定移出本批（另批） | 四档零改，边界见设计档 §7 |
| E4 即时缓解回收 | ❌ 未执行（仓外写面） | 判据面（A16）由 T11 / T13 覆盖；用户机配置属仓外，交父侧/用户执行 |

### 5.2 决策披露（实施期拍板，逐条带理由）

| # | 决定 | 理由 |
|---|---|---|
| 1 | `firstChunkMs` 不在签名里给默认，改体内 `firstChunkMs ?? idleMs`；相位文案按「是否传参」判（`firstChunkMs != null`） | 设计档 §6 T14 要求「不传 ⇒ 文案与相位串与分窗前逐字一致」，§2.4 又要求「按态取窗与文案」。按两窗**值相等**判能同时过这两条，但漏掉一个真实配置：用户当前即时缓解值 `agent.bodyIdleTimeoutMs = 600000` 与默认 `fetchTimeoutMs = 600000` 相等 ⇒ 首 chunk 相位串永不出现，正是 D9 要消掉的表述缺口。按「是否传参」判两条同时成立；`??` / `!= null` 一并吃掉 `null` 入参（否则 `null !== idleMs` 成立、`setTimeout(null)` 立刻判死并报 `no data for 0s`）。 |
| 2 | `parseGeminiStream` 由模块私有改为 `export`（`google.mjs:178`） | 设计档 §6 T14 / T15 以它为夹具，模块私有则验收判据不可执行。设计档 §3 表与批档 2.4 均未记此项 ⇒ 漂移交父侧。 |
| 3 | 不动 `effectiveFetchTimeoutMs` / `effectiveBodyIdleMs`、不动 `agent.bodyIdleTimeoutMs` 默认值与 `≤0` 语义 | 设计档 §2.4「读侧面无 `≤0` 门，也不需要」+ §7 边界（能否禁用不夹带） |
| 4 | 相位文案的 `N` 取该相位实际生效的窗值（`ms`），不写死 `firstChunkMs` | 设计档 §2.4「`N` = 该相位实际生效的窗值」；`ms` 是真正交给 `setTimeout` 的值，文案与窗单一来源 |

### 5.3 轮次与终态

| 轮 | 发现 | 处置 |
|---|---|---|
| 内审：explore 分歧审计 1 轮 | A14 次半无断言；A12 首子句无断言；两处旧注释（「连续 `idleMs` 无新 chunk 判死」）未限定相位 | 当轮全修：T15 增 google 首帧后停摆断言；T12 增 `effectiveFetchTimeoutMs({ fetchTimeoutMs: 2000 }) === 2000`；两处注释补「首 chunk 之前改用首 chunk 窗」 |
| 独立代码评审 1 轮（changes-required） | 🟡 必改：相位归属按值相等判（见 5.2 #1）；🔵 墙钟上界 3s 有假红面；🔵 设计档坐标与行数滞后 | 前两条当轮修（判据改按是否传参 + 补「显式传相等值」边界断言；上界放宽 10s 并注明漂移方向）；第三条非本席写面 ⇒ 交父侧路由（5.5） |
| 独立代码评审 2 轮（收敛，pass） | 三条修复核验通过；新增 1 🟡 可选 + 1 🔵 报告项，均在设计档/批档措辞面 | 不改代码；作漂移项上报（5.5） |
| 终态 | **clean** | 单档 6/6 绿（5.4） |

### 5.4 实施期验证读数

命令 = `node --test docs/batches/2026-10-28-sse-first-chunk-idle.test.mjs`（批内单档，平 node）⇒ `ℹ tests 6` · `pass 6` · `fail 0`，耗时 ≈13.5s（2026-10-28 实跑）。语法面：三档源文件 + 用例档 `node --check` 全 OK。

用例覆盖 A11–A16：T11（首帧 1.5s 慢于 `idleMs` 仍跑完 + 默认窗同断言）· T12（首帧永不发 ⇒ 首 chunk 文案与相位串）· T13（首帧后停摆仍按 `idleMs` + 回收后默认首 chunk 窗同断言）· T14（不传 `firstChunkMs` ⇒ 逐字零变；显式传相等值仍报首 chunk 相位）· T15（google 面两相位文案与相位串）· T16（默认窗来源 600000 + 首挂窗取传入值）。

A13 的 `list-models` 子句未设用例——该径不经读侧定时器（`thincoder-core/provider/list-models.mjs` 全文无 `readSSE`），代码面已足。

### 5.5 交父侧路由的事项

1. 设计档坐标与行数滞后：`docs/core/design/TIMEOUT-DIGEST.md` §2.4 记 `sse.mjs` `:205-214` / `:217-218`、`google.mjs` `:227-236` / `:239-240`，现形 208-224 / 228-229 与 230-245 / 249-250；§3 表记 301 / 299 行，实读 312 / 309（`core.mjs` 495 不变，三档均在 500 行咨询线内）。
2. 设计档 `docs/core/design/TIMEOUT-DIGEST.md:144` 的「三面并列」残留（表内只剩两面，传输面随 E2 移出）——评审轮次 1 的 N2 仍在页。
3. 设计档接口记法滞后 + 新判据无落点：§2.4 仍写 `firstChunkMs = idleMs` 作签名默认（现为体内 `??`）；T14 未记「显式传相等值仍属分窗使用者 ⇒ 报首 chunk 相位」这条已由用例锁定的规则。
4. E4 的配置回收（`~/.thincoder/config.json` 的 `agent.bodyIdleTimeoutMs` 回默认，备份 `config.json.bak-20261028`）属仓外用户机配置，本席未执行。

## §6 验证与收口（父代理）

## 6.1 验证与收口（父侧 2026-10-28 01:0x）

### 6.2 父侧亲测读数（非引用报告）

| 项 | 读数 |
|---|---|
| 三档行数（`node` 口径） | `thincoder-core/provider/sse.mjs` **312** · `google.mjs` **309** · `core.mjs` **495**（Δ=0，不出 500 咨询线） |
| 两态臂落地 | `sse.mjs:207` `gotFirstChunk` · `:212` `firstArm` · `:213` `ms = firstArm ? (firstChunkMs ?? idleMs) : idleMs` · `:225` 首挂 · `:228` 翻转 · `:229` 重挂 —— 翻转不可逆 |
| 相位串两支 | `sse.mjs:219` `sse-first-chunk` ∥ `google.mjs:240` `google-sse-first-chunk`；既有 `sse-idle` / `google-sse-idle` 零改 |
| 缺省 = 老行为 | `firstChunkMs ?? idleMs`（不传 ⇒ 首挂用 `idleMs`，文案逐字不变） |
| **验收实跑** | `node --test docs/batches/2026-10-28-sse-first-chunk-idle.test.mjs` ⇒ **tests 6 · pass 6 · fail 0**（13.7s） |
| 用例档零留存 | **父侧已删**（跑完留读数后） |

### 6.3 交付对照

| # | 状态 | 条目 |
|---|---|---|
| E1 | ✅ Done | 首 chunk 窗 = `effectiveFetchTimeoutMs`（600s）、首字节后仍按 `idleMs`（120s）；两条读侧路径（`readSSE` / `parseGeminiStream`）+ 三处生产调用点全传参 |
| E3 | ✅ Done | 超时文案与相位串按相位分 |
| E2 | ❌ 不在本批 | 传输层看门狗首 chunk 窗 —— §1.6 裁定移出（无现场、无复现路径），四档零改 |
| E4 | ⚠️ 待执行（**前置 = 重启**） | 用户配置回收见 6.5 |

### 6.4 实施期三处拍板（父侧认可）

1. **相位文案按「是否传参」判（`firstChunkMs != null`），不按两窗值相等判** —— 理由成立且关键：用户当前即时缓解配置 `bodyIdleTimeoutMs = 600000` 恰与默认 `fetchTimeoutMs` 相等，值相等判会让首 chunk 相位串**永不出现**，而那正是本次要消掉的表述缺口。它先按值相等实现、被内审与代码评审两轮同时挑中后改 —— 这是对的处置。
2. `parseGeminiStream` 改为 `export`（设计档 T14 / T15 以它为夹具，私有则判据不可执行）；文件表未记，已按漂移上报。
3. 未动 `effective*` 两函数、未动默认值与 `≤0` 语义、传输面四档零改。

### 6.5 E4（用户配置回收）的执行条件 —— **必须等重启**

**回收动作 = 把 `~/.thincoder/config.json` 的 `agent.bodyIdleTimeoutMs`（现 600000）删掉或恢复备份 `config.json.bak-20261028`。**

**⇒ 现在不能做：本进程仍在跑旧代码（首 chunk 也走 120s），此刻回收会让首 chunk 重新撞 120s 死。**

**⇒ 顺序 = 重启使新代码生效 → 再回收。父侧在重启后执行并留读数。**

**判据（A16）：回收后首帧 1.5s 慢于 120s 仍拿到正文（T11 已覆盖默认窗同断言）· 首帧后停摆仍按 120s 判死（T13 同）。**

### 6.6 未覆盖面（如实）

1. **设计档坐标与行数滞后**：`docs/core/design/TIMEOUT-DIGEST.md` §2.4 记 `sse.mjs:205-214` / `:217-218`、`google.mjs:227-236` / `:239-240`，现形 `208-224` / `228-229` 与 `230-245` / `249-250`；§3 表记 301 / 299，**实读 312 / 309**。⇒ 实施改写代码后行号下移，设计档未随改 —— **正是今日新写进 `docs/core/requirements/ENGINEERING-MODE-V2.md` §7.6「反向核对」那条判据的第二个实例**。待另批再锚。
2. `docs/core/design/TIMEOUT-DIGEST.md:144`「三面并列」残留（表内只剩两面）—— 评审轮次 1 的 N2 仍在页，`doc_check` 不判它（非锚点 / 非长度）。
3. 接口记法滞后：§2.4 仍写 `firstChunkMs = idleMs` 作签名默认（现为体内 `??`）；T14 未记「显式传相等值仍属分窗使用者」这条已由用例锁定的规则。
4. **未跑全量回归**：A9 不属本批门（批档 §2.5 指定单档跑）。

### 6.7 结算清单

- **§2 ↔ 设计档对账**：§2.1 三条（E1 / E3 / E4）+ §2.5 验收 A11–A16 逐条对现文，一致。
- **前批遗留交叉核**：无（新开批）。
- **修正轮落地前提**：修正轮已落、二轮评审 pass。
- **用户面同步**：**有** —— 用户可见行为变化 = 长 prefill 不再被 120s 误杀。回收后需重启复验（见 6.5）。
- **台账沉降**：`#1859` · `#1858`。**`#1860` 复用于设计档坐标滞后**（本次新增两条来源）。
