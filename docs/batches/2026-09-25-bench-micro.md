# 2026-09-25 · bench-micro
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-25 · 来源 = 用户 2026-09-25 12:57「这七批都派出去」——技术待办排批 · 批 7/7：bench 微修轮（条目 #259/#260）。
> 台账 = #259 / #260（技术待办 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**本批条目**（任务书指针 = 本档 §2 · 条目细节以台账 evidence 为准）：

| # | 条目 | 要点 | 面 |
|---|---|---|---|
| #259 | 失败路径补全族 | 判官/复核逐尝试耗时传输面失败恒 null（`judge.mjs:239` 区——`rec(null)` ⇒ `totalMs: null`）；`throttled` 失败路径恒 false（`client.mjs:148`——补它 = 传输面契约变更） | bench |
| #260 | error-duration 上抛三微项 | ① `report-time.mjs:33` 部分未记录谓词未排除 skipped（当前不可达）② `client.mjs:150` 失败记录与 `toCallRecord` 双写 ③ `report-tables.mjs:75` 注释未补「未记录」定性 | bench |

**边界**：bench 内部面；须含既有报告对拍（零回归锚）。

**勘误（2026-09-25 · 评审轮 1 发现 5 收正）**：本 §1 条目表 #259 所引 `judge.mjs:239` 应读 `judge.mjs:239-241`（`rec(null)` 实住 `:240`——`try/catch` 区读法不变）；§2.1 同一处随 fix 轮一并收正。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（本批 #259/#260 五项逐条设计 + KD-47/KD-48 · fix 轮（发现 #1–#6）已落地 · 2026-09-25；KD-48 为单列裁定项）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 覆盖条目（本批 = 台账 #259 / #260 全量 · 条目细节以台账 evidence 原文为准）

| # | 条目（台账原文摘要） | 本批落点（实现形态） | 判定 |
|---|---|---|---|
| #259① | 判官 / 复核逐尝试耗时：传输面失败 ⇒ `totalMs: null`（`bench/lib/judge.mjs:239` 区——`rec(null)`） | `callSlot` 尝试点取墙钟（`try` 前 `t0 = Date.now()`）；`catch` 分支 `rec(null)` → `rec({ totalMs: Date.now() - t0 })`——级联面（`judge-fallback.mjs` 逐级 `calls.push(...r.calls)`）天然生效、零改 | AC-1 · `timing.2` ①② |
| #259② | `throttled` 失败路径恒 `false`（`client.mjs:148`）；台账注明「补它 = 传输面契约变更」 | `client.mjs` 新导出原语 `markFailureObservation(err, throttled)`（仅 `true` ∧ 对象 ∧ 可扩展才挂）+ `liveTransport` try/catch 挂载 + `runCase` 消费 `e?.throttled === true`；契约文句 = 设计 §2.9-4 第 4 条 · **KD-48（单列裁定项）** | AC-2 · `timing.3`①–⑤（**先决 = 单列裁定通过**） |
| #260① | `report-time.mjs:33` 部分未记录谓词未排除 `skipped`（当前不可达） | 谓词首项加 `r.verdict !== "skipped"`（与 `report-tables.mjs:76` 参与面谓词同口径）；设计 §2.3-7 补「`skipped` 不入本分支」句 | AC-3 · `render.4` ⑫ |
| #260② | `client.mjs:150` 失败记录形状与 `toCallRecord` 双写（新增 per-call 字段须两处同步） | `toCallRecord(round, call = {})` 参数缺省化 ⇒ 失败路径传合成 call、同过单形状函数（键序与既有字面逐字相同） | AC-4 · `timing.3`⑤ |
| #260③ | `report-tables.mjs:75` 注释未补「未记录」定性 | 注释补「= **未记录**」定性（与 §2.3 骨架口径行 / `render.4` ⑦ 字面同源；零代码） | AC-4（注释逐字对读） |

**显式不在本批**（边界 · 设计 §7-21 / §7-12 在册）：判官 / 复核账目**不增 `throttled` 字段**（判官面暂停不入报告限流计数）；在档档**不重跑 / 不重出 / 不追改**；不做失败专属呈现（进度行耗时 / 失败率 / 超时读数列）；不引调用侧汇点参数；不改核层（三端产品树零改动）。

### 2.2 设计档落点（单源 = `docs/core/design/MODEL-BENCH.md` · 就地更新后 **1878** 行 · 变更记录一行在册）

| 面 | 落点 |
|---|---|
| 计时口径（口径 3） | §1.3-3：口径句补「判官 / 复核逐尝试同口径」+ 落点列补 `bench/lib/judge.mjs` + 版本格补 KD-47 |
| 结果 JSON 契约 | §2.2-2（失败记录形状单源句 + `throttled` 照实记指针）· §2.2-8（逐尝试 `totalMs` 语义新行） |
| 报告契约 | §2.3-7（部分未记录分支：`skipped` 排除句——按语义折行入续行） |
| 传输面契约 | §2.9-4（第 4 条补「失败路径同真」+ 续行「失败路径观测通道」（挂载 / 消费 / 契约文句 / 单列裁定标注）） |
| 决策记录 | §4 KD-47（失败路径补全族 · 四项 · 版本口径 = 不 bump）· KD-48（`throttled` 观测通道 · 单列裁定项） |
| 测试面 | §5.13（分档句补本族 + `timing.2` / `timing.3` 两行 + `judge.14` / `render.4` 行延伸 + 必测项 ⑥） |
| AC 回指 | §6（本批 AC-1–AC-5 块 · 需求面指针 = 本档 §1） |
| 受影响文件 | §3（本批表 10 行 + 块首口径句） |

### 2.3 机制设计（实现形态 · 精确落点）

**① 判官 / 复核逐尝试失败耗时**（`bench/lib/judge.mjs` `callSlot`）：`try` 前取 `t0`；`catch` 分支由 `rec(null)` 改 `rec({ totalMs: Date.now() - t0 })`（`callRecord` 读 `res?.totalMs` ⇒ 数值入档；`tokens` / `finishReason` / `costCny` 照实 `null` 零改）。语义 = 「该次尝试实际占用墙钟（超时也占墙钟）」——与 §2.2 样例 B 位 attempt 1 = **30120** 既冻结语义对齐（实现未随）；观测点 = 调用侧（承 KD-30——不引「错误对象挂耗时」，KD-30 被否① 保持被否）。

**② 失败记录形状单源**（`bench/lib/client.mjs`）：`toCallRecord(round, call = {})`；失败路径改 `const rec = toCallRecord(round, { totalMs: Date.now() - callT0, throttled: e?.throttled === true })`——合成 call 无 `response` ⇒ `ttftMs` / `tokens` / `toolNames` / `finishReason` 照实缺记；键序与现字面逐字相同 ⇒ 在档序列化形零变、新增 per-call 字段单点维护。

**③ 部分未记录谓词 × `skipped`**（`bench/lib/report-time.mjs:33`）：谓词加 `r.verdict !== "skipped"` 守卫。**零行为变更**（生产 `skipped` 构造 = `calls: []` ∧ `metrics.totalMs = null`——`bench/lib/pipeline.mjs:204`；在档三对实测部分未记录 run = **0**）。**守卫必要性（设计轮实证）**：构造腿（skipped run 携数值 `totalMs` + 未记录 call）现行为 = 脚注「`- fx-skip：1 个 run 部分 call 未记录`」与累计格 `—` 并存——脚注为**未入累计的 run** 声言「按已记录之和入累计」。

**④ 注释定性**（`bench/lib/report-tables.mjs:75`）：`totalMs` 为 `null` 不计入 ⇒ 补「= **未记录**」（体例 = §2.3 骨架口径行两短语之一）。零代码 / 零行为。

**⑤ 失败路径 `throttled` 观测（单列裁定项）**（`bench/lib/client.mjs`）：新导出 `markFailureObservation(err, throttled)`（对象 ∧ `Object.isExtensible` 才挂 `throttled: true`；否则原样返回——primitive / frozen 不抛、不改错误本体）；`liveTransport.call` 以 try/catch 包 `chat`，`catch (e) { throw markFailureObservation(e, throttled) }`；`runCase` 失败记录读 `e?.throttled === true`（缺字段 ≡ `false`——记录形零改）。**设计轮实证**：Node 24 下 `DOMException`（TimeoutError）/ `Error` / `TypeError` 均可扩展（挂载面成立）；现行为实测 = 抛错携 `throttled: true` 仍记 `false`（缺口复现）。契约文句 = §2.9-4（成功路径返回式契约 / 调用签名零改）。

### 2.4 受影响文件与测试面（现状 = 本批设计轮实读行数 · 2026-09-25 · 计数尺 = 末行含换行者不计空尾行；**单源 = 设计档 §3 本批表**）

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/lib/client.mjs` | 191 | +8 ±3 | `toCallRecord` 参数缺省化（形状单源）+ `liveTransport` try/catch 失败观测挂载 + `markFailureObservation`（导出）+ 头注 |
| `bench/lib/judge.mjs` | 271 | +3 ±1 | `callSlot` 尝试点取墙钟 + 失败分支 `rec({ totalMs })` + 注释 |
| `bench/lib/report-time.mjs` | 48 | +2 ±1 | 谓词加 `skipped` 守卫 + 注释 |
| `bench/lib/report-tables.mjs` | 288 | ±0 | `:75` 注释补「未记录」定性（零代码） |
| `bench/test/timing.test.mjs` | 58 | +40 ±10 | `timing.2` + `timing.3` + 头注扩（采集面 = 失败路径补全族） |
| `bench/test/judge-fallback.test.mjs` | 228 | +1 | `judge.14` 延伸一行断言（失败级 `calls[0].totalMs` 非 `null`） |
| `bench/test/report-present.test.mjs` | 299 | +3 ±2 | `render.4` ⑫；**超 300 软线 299 → ~302**（拆分计划入设计档 §3——触发 = 本档下次触碰或 ≥ 320 行） |
| `bench/cases/index.mjs` · `bench/judge.json` | 68 · 63 | **±0** | 不 bump（`SUITE_VERSION` 恒 7 · `frozenAtSuiteVersion` 恒 7） |
| `bench/README.md` | 230 | **±0** | 用时表条三短语已在位（本批语义零偏——对读核讫） |
| `bench/results/` | 11 档（5 对 + v6-rejudged pdf） | **±0** | 不重跑 · 不重出 · 不追改 |

**测试面**：`bench/test/` 现读数 92 例（设计档在册 · 2026-09-25）⇒ 本批 **+2 例**（`timing.2` / `timing.3`；`judge.14` / `render.4` = 既有例内延伸，不增例）；不进 CI 照旧（AC-8 口径）。

### 2.5 验收对照（逐条机检 · 与设计档 §6 本批 AC 块同源）

| AC | 判据（条目面） | 判定方式 |
|---|---|---|
| AC-1 | #259① 失败尝试不再记 `null` | `node --test "bench/test/*.test.mjs"` ⇒ `timing.2`①（`callSlot` 延迟抛错腿：数字 ∧ ≥ 25）+ ②（`judge.14` 级联失败级非 `null`）；§2.2 样例对读（30120） |
| AC-2 | #259② 失败路径 `throttled` 出洞 | `timing.3`①–⑤（生产者四态 / 消费两态 / 成功对照 / 键集同形）；**先决 = §4 单列裁定通过**（否决 ⇒ AC-2 撤销 + 缺口登记） |
| AC-3 | #260① `skipped` 排除 | `render.4` ⑫（skipped 构造腿：不入部分未记录脚注 + 累计格 `—` + 采样 `0`；守卫前反例 = 脚注出现——设计轮实测在册） |
| AC-4 | #260②③ 形状单源 + 注释定性 | `timing.3`⑤（失败记录钥匙集 = 成功记录钥匙集）+ `bench/lib/report-tables.mjs:75` 注释含「未记录」定性（逐字对读） |
| AC-5 | 批次边界（零回归锚 + 版本面 + 在档零改写） | ① 全绿 `node --test "bench/test/*.test.mjs"`；② **在档对拍（一次性 · 不落档）**：见下方命令 ⇒ 输出 `IDENTICAL`（设计轮实测 = 237025 字符逐字节相同）；③ `git status --porcelain bench/results/` 输出空；④ `SUITE_VERSION` 恒 7 ∧ `bench/judge.json.frozenAtSuiteVersion` 恒 7（两档 ±0 行） |

**AC-5 ② 命令形态（逐字可跑 · cwd = `thincoder` · 内存渲染不落档）**：

```bash
node --input-type=module -e "import fs from 'node:fs';const{renderReport}=await import('./bench/lib/report.mjs');const b='bench/results/2026-09-25-roster-29-v6-rejudged';const d=JSON.parse(fs.readFileSync(b+'.json','utf8'));console.log(renderReport(d,{fileBase:String(d.startedAt).slice(0,10)+'-'+d.label})===fs.readFileSync(b+'.md','utf8')?'IDENTICAL':'DIFF')"
```

（`docs/batches/` 在行宽扫描排除面内——manifest `checkConfig.anchors.exclude`；该命令行保可跑字面。）

### 2.6 关键决策 / 版本口径

**KD-47（失败路径补全族 · 四项 · 新增）**：① 判官 / 复核逐尝试 `totalMs` 失败照记；② 失败记录形状单源；③ 部分未记录谓词排除 `skipped`；④ `report-tables` 注释定性。**版本口径 = 不 bump**（采集完整度 / 记录形状 / 注释 / 谓词口径——规则层零改，KD-30③ 同源；`bench/cases/index.mjs` · `bench/judge.json` ±0）。

**KD-48（`throttled` 观测通道 · 新增 · 单列裁定项）**：传输面失败路径错误对象可携 `throttled: true`；须单列裁定（§3 评审 + §4 用户）；否决 ⇒ 保持现态 + 缺口登记。

**被否候选（设计档 §4 逐项在册）**：判官耗时由传输面自报（KD-30 被否① 同源）· 失败记录维持字面双写 · 谓词不加守卫（仅凭「生产不可达」）· 部分未记录改判整 run 不计；`throttled` 面：调用侧汇点参数 · 记 `null` 三态 · 维持恒 `false` · 由核披露进错误。

### 2.7 上抛项（父侧 / 评审 / 用户知悉）

1. **单列裁定项（须显式裁定）**：KD-48 = 传输面契约扩展（#259②）。设计侧已定形态与最小面（成功路径 / 调用签名零改）；**先决 = §3 评审 + §4 用户裁定**——通过 ⇒ 按 §2.3⑤ 实施；否决 ⇒ #259② 保持现态（登记为已知缺口），AC-2 撤销，其余四项照做。
2. **报告项（非缺陷 · 供后续批）**：在档报告对的可复现性**分层**——`2026-09-25-roster-29-v6-rejudged` 对现盘可逐字节复现（本批零回归锚取它）；`2026-09-24-roster-29-v5` / `2026-09-25-roster-29-v6` 对**不可**（渲染于后续渲染面增量之前——如替代池行缺失）。后续批做「在档对拍」按此分层取锚（不追改，KD-10 精神）。
3. **报告项（越线登记）**：`bench/test/report-present.test.mjs` 本批后 ≈ 302 行（超 300 软线）——拆分计划已入设计档 §3 本批表（触发 = 本档下次触碰或 ≥ 320 行，先到者）。
4. **范围外登记（不入本批）**：判官 / 复核账目无 `throttled` 字段（判官面暂停不计入报告限流计数——现状如实）；在档判官失败尝试 `totalMs: null`（v5 **14** 条 / v6 **1** 条 · 设计轮实读）照旧留档——本批修复只对后续运行生效（不追改）。
5. **机检读数（设计轮自跑 · 交付前）**：`node scripts/doc-check.mjs`（cwd = `thincoder`）——锚：全仓悬空 **7**（本批档面**零新增**）；行宽：全仓 **18** 行超 300（本批净新 **0**——自引入两条曾超宽（§2.9-4 续行 / 变更记录行）已当场折断）；`docs/core/design/MODEL-BENCH.md` 就地更新后 **1878** 行。

### 2.8 fix 轮（设计评审轮 1 · 发现 #1–#6 落地 · 2026-09-25）

评审轮 1 = pass（0🔴 / 2🟡 / 4🔵 · §3 逐字在册）；父侧裁定 = 六条全数接受；本块 = 六点处置的记录面（§2 = append-only 面——既有行不就地改写：以下各条 = 对点名行的收正 / 补全，读法以本块为准；设计档同日就地更新）。

1. **#1（KD-48 否决支 · 补测试面处置）**——§2.5 AC-2 行与 §2.7-1 的否决支补全：否决 ⇒ 随 AC-2 撤销 = `markFailureObservation` + `timing.3` ①–④（不实施）；**`timing.3` ⑤ 保留**（AC-4 判定方式依赖）；`timing.test.mjs` 增量相应回退（原 +40 ±10 = `timing.2` + `timing.3` 两例合计——否决支下不再适用）。其余四项照旧。
2. **#2（拆分计划触发句 · 钉无歧义形）**——§2.4 `report-present.test.mjs` 行与 §2.7-3 的触发句收正为：**本批之后首次触碰该档或 ≥ 320 行，先到者**（本批 = 越线登记轮 · 不执行拆分）。
3. **#3（测试面读数 · 更新）**——§2.4 测试面读数收正为：`bench/test/` **现盘 13 档 / 105 例**（2026-09-25 实读 · `^test(` 直数；旧读数 11 档 / 92 例 = 探针实现前时点——设计档 §10.10 与 §3 探针块已补该时点注）。本批 **+2 例**结论不变。
4. **#4（设计档 §3 本批块首 · 限定语）**——「零新常驻腿」限定已落设计档（在档对拍 = 一次性验收命令 · **非常驻腿**；本批新腿 = `timing.2` / `timing.3`）；§2 侧无动作。
5. **#5（引证收正）**——§2.1 #259① 所引 `judge.mjs:239` 收正为 `bench/lib/judge.mjs:239-241`（`rec(null)` 实住 `:240`；§1 勘误行（`:18`）已由父侧在册）。
6. **#6（AC-1 判定方式 · 补注）**——§2.5 AC-1 行补注：复核面经同一 `callSlot` 单点覆盖（`bench/lib/judge.mjs:269`）——不另设专属腿。

**机检读数（fix 轮交付前 · 自跑一次 · cwd = `thincoder`）**：`node scripts/doc-check.mjs`——锚：全仓悬空 **14**（本批面 **零新增**——MODEL-BENCH.md 零悬空，仅两条既存 拟新增 列报行）；行宽：全仓 **19** 行超 300（本批净新 **0**——本批编辑面最长 292 字符）。全仓读数相对设计轮基线（悬空 7 / 行宽 18）的漂移（+7 / +1）非本批引入（本批只触 MODEL-BENCH.md 与批档——批档在 `anchors.exclude` 排除面；漂移落点 = VSC-DEBT / MODEL-SPECS / CORE-UNIFICATION 等他批档面）。设计档 fix 轮后就地更新后 = **1881** 行（计数尺 = 末行含换行者不计空尾行；§2.2 的 1878 = 设计轮读数）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**设计评审（对象 = 批 2026-09-25-bench-micro §2 + `docs/core/design/MODEL-BENCH.md` 本批面；方法 = 文档逐条对读 + 现盘源码/测试/在档报告只读抽核，不跑命令）**

| # | 类别 | 级别 | 问题 | 建议 |
|---|------|------|------|------|
| 1 | 验收（条件支完整性） | 🟡 | KD-48 否决支只写「AC-2 撤销 + 缺口登记，其余四项照做」（批档 :104 / :81），未说测试面处置：`timing.3` 是单例，把 KD-48 依赖腿（①–④）与 #260② 需要的 ⑤ 捆在一起——而 AC-4 的判定方式点名 = `timing.3` ⑤（键集同形）（批档 :83 / 设计档 :1417），`bench/test/timing.test.mjs` 增量 +40 ±10 也按 `timing.2` + `timing.3` 两例合计（批档 :67） | 否决支补一句：随 AC-2 撤销的是 `markFailureObservation` + `timing.3` ①–④；`timing.3` ⑤ 保留（AC-4 依赖），该档增量相应回退 |
| 2 | 受影响文件行数注记 / 拆分计划 | 🟡 | `bench/test/report-present.test.mjs` 299 → ~302 越 300 软线，拆分计划已在位（落点 `report-cross.test.mjs`），但触发句「触发 = 本档下次触碰或 ≥ 320 行，先到者」有歧义——本批本身就是一次触碰（且正是把它推过线的那次）（批档 :69 / :106 · 设计档 :939） | 触发句钉无歧义形态（如「本批之后首次触碰或 ≥ 320 行」，或明确「本批内执行拆分」） |
| 3 | 测试面读数（数字漂移） | 🔵 | 「`bench/test/` 现读数 92 例」为陈旧读数：现盘 `*.test.mjs` = **13 档**（探针面 `probe.test.mjs` / `probe-report.test.mjs` 在 92 例读数之后新增；按 `^test(` 直数 ≈ 106 例）（批档 :74 · 设计档 :1744「现 11 档 / 92 例（2026-09-25 实读）」） | 更新为现盘读数或注明「读数时点 = 探针实现前」；本批 +2 例的增量结论不受影响 |
| 4 | 清晰度 | 🔵 | 设计档 §3 本批块首「**零新常驻腿**」与同批「**+2 例**（`timing.2` / `timing.3`）」并置，易被读成矛盾（原意应为「在档对拍不作为常驻测试腿」）（设计档 :929 / :937） | 补括注：在档对拍 = 一次性验收命令（非常驻腿）；本批新腿 = `timing.2` / `timing.3` |
| 5 | 引证（数字漂移） | 🔵 | 批档 §1 #259① 引 `judge.mjs:239` 为 `rec(null)` 处；现盘 `:239` = `} catch (e) {`，`rec(null)` 实在 `:240`（「区」字已兜住区域读法）（批档 :13 · `bench/lib/judge.mjs:239-240`） | 引作 `judge.mjs:239-241`（或 `:240`） |
| 6 | 覆盖（证据注 · 非缺口） | 🔵 | AC-1 两条腿均走判官路径（`callSlot` 直测 + `judge.14` 级联）；复核面无专属失败耗时腿——`reviewRun` 经同一 `callSlot` 单点（`bench/lib/judge.mjs:269`）⇒ 结构上已覆盖，不需补腿 | （可选）AC-1 判定方式补注「复核面经同一 `callSlot` 单点覆盖」 |

**计数：🔴 0 · 🟡 2 · 🔵 4（共 6）**

**现盘抽核（只读 · 逐条对上）**：`client.mjs:107/116/148-151`（`toCallRecord` 键序 = 失败字面键序，逐字同序 ⇒ KD-47② 零序列化形变成立）· `judge.mjs:212-223/228-252`（`callRecord` 读 `res?.totalMs` ⇒ `rec({totalMs})` 得数值；`callSlot` 已导出且 `transport` 可注、`judgeProviderEntry` 缺 provider 不抛 ⇒ `timing.2` ① 可直测）· `report-time.mjs:33`（谓词确未排除 `skipped`）· `report-tables.mjs:75`（注释确缺「未记录」定性）· `pipeline.mjs:204`（生产 `skipped` = `calls: []` ⇒ 守卫零行为变更）· `judge-fallback.mjs:43`（`calls.push(...r.calls)` ⇒ 级联天然生效）· `report.mjs:141/170`（`throttled` 计数消费面真实；`renderReport(data,{fileBase})` 签名与验收命令相符）· 受影响表行数逐项相符（191 / 271 / 48 / 288 / 58 / 228 / 299 / 68 · 63 / 230 / results 11 文件）· 在档 md 零「个 run 部分 call 未记录」脚注 ⇒ 谓词改动对零回归锚无影响；`2026-09-25-roster-29-v6-rejudged.md` 含 7 列用时表 / 替代池行 / 逐档参数表 / 方法段级联句 ⇒ 锚可复现前提成立（`IDENTICAL` · 237025 字符未复跑 ⇒ 未验证）；设计档即时读数 1878 行与「末行空尾不计」计数尺相符。判官身份评审侧不对 KD-48 作裁定（批档已置于 §4 单列裁定，含双支处置）。

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代执行 · 2026-09-25 全链授权口径）**

- **授权口径** = 2026-09-25「这七批都派出去」= 全链（设计 → 评审 → 批准 → 实施 → 收口）；代执行自缚三条件逐项核验：
  - ① 设计评审 **pass**（🔴0 / 🟡2 / 🔵4 · `§3` 轮次 1 在册）✓；
  - ② 修正轮（fix · 发现 #1–#6）**全落并读回核验** ✓（批档 `§2.8` 块 `:112-123` + 设计档 `:927` / `:929` / `:939` / `:1414` / `:1415` / `:1744` 逐处抽核在案）；
  - ③ designToken **在效** ✓。
- **单列裁定（KD-48 · 传输面契约扩展）** = **通过**（默认口径：评审后与全线推进中两次预告无异议；改判窗口 = 实施完成前）。
- 据上：批⑦ 进入实施（eng-coder · 按批档 §2 + 设计档实施；§5 实施记录由该档写）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（7 档（4 库 + 3 测试）· AC-1..AC-5 逐条实跑 · bench 107/107 · 三端 631/839/964 全绿 · 审计 clean · 代码评审 pass（0🔴 / 1🟡 / 3🔵）· fix 轮 0 · 2026-09-25）



**实施轮**（2026-09-25 · 按序 = 批档 §2 + §2.8 fix 收正块 + 设计档本批面；开工先取基线 + 红证据，收官全量复跑）。

### 5.1 交付摘要（四机制 + 四测试面 · 7 档 · 零表外改）

| 项 | 档 | 实现落点 | 行数（设计表 → 实测） |
|---|---|---|---|
| #259① 判官 / 复核逐尝试失败耗时 | `bench/lib/judge.mjs` | `callSlot` `try` 前取 `t0`（`:233`）· catch 分支 `rec({ totalMs: Date.now() - t0 })`（`:242`）· JSDoc 补失败语义行 | 271 → 273（+2 ∈ +3±1） |
| #259② 失败路径 `throttled` 观测（KD-48） | `bench/lib/client.mjs` | 新导出 `markFailureObservation(err, throttled)`（`:27-30`——true ∧ 对象 ∧ `Object.isExtensible` 才挂；primitive / frozen 原样返回不抛）· `liveTransport.call` try/catch 包 `chat`，catch 抛 `markFailureObservation(e, throttled)`（`:47-52`）· `runCase` 消费 `e?.throttled === true`（`:161`） | 见下行合计 |
| #260② 失败记录形状单源 | `bench/lib/client.mjs` | `toCallRecord(round, call = {})` 参数缺省化（`:119`）· 失败路径传合成 call（`:161`）——键序与旧字面逐字同（`round/ttftMs/totalMs/tokens/toolNames/finishReason/throttled`） | 191 → 201（+10 ∈ +8±3） |
| #260① 部分未记录谓词排除 `skipped` | `bench/lib/report-time.mjs` | 谓词首项加 `r.verdict !== "skipped"`（`:34`）+ 注释行 | 48 → 49（+1 ∈ +2±1） |
| #260③ 注释定性 | `bench/lib/report-tables.mjs` | `:75` 注释补「= **未记录**」（零代码 · 零行为） | 288 → 288（±0） |
| 测试面 · `timing.2` / `timing.3` | `bench/test/timing.test.mjs` | `timing.2`（`callSlot` 直测六断言：数字 ∧ ≥25 / tokens·finishReason·costCny=null / attempt=1 / verdict=error / attempts=1）+ `timing.3`（生产者四态 / 消费两态 / 成功对照 / `Object.keys` 同集同序）+ 头注扩 | 58 → 108（+50 ∈ +40±10 上缘） |
| 测试面 · `judge.14` 延伸 | `bench/test/judge-fallback.test.mjs` | +1 断言：失败级 `calls[0].totalMs` 为数字（只断非空、不断阈值——夹具即时抛错） | 228 → 229（+1） |
| 测试面 · `render.4` ⑫ | `bench/test/report-present.test.mjs` | `skipped` 构造腿（携数值 `totalMs` + 未记录 call ⇒ 不入脚注 + 累计格 `—` + 采样 `0`）+ 头注行收正 | 299 → 304（+5 ∈ +3±2 上缘；越 300 软线——按 §2.8#2 在册计划不拆） |

### 5.2 验证读数（逐条实跑 · cwd = `thincoder`）

| AC | 命令 / 判定方式 | 实测 |
|---|---|---|
| AC-1 | `timing.2` ①（直测 `callSlot` 延迟 40 ms 抛 `TimeoutError`）+ ②（`judge.14` 级联腿） | 绿（失败 `calls[0].totalMs` = 数字 ∧ ≥ 25；旧行为 = `null` 已复现为红证据） |
| AC-2 | `timing.3` ①–⑤ | 绿（挂 / 不挂 / 冻结不抛不挂 / 原始值原样 + 消费两态 + 成功对照 + 键集同形） |
| AC-3 | `render.4` ⑫ | 绿（守卫前反例实跑复现：脚注 `- fx-skip：1 个 run 部分 call 未记录` 出现 ⇒ 断言红；守卫后不复现） |
| AC-4 | `timing.3`⑤ + `report-tables.mjs:75` 注释逐字对读 | 绿 + 注释含「未记录」在盘实读 |
| AC-5① | `node --test "bench/test/*.test.mjs"` | **tests 107 · pass 107 · fail 0 · skipped 0**（开工前同命令基线 = 105/105；本批 +2 例） |
| AC-5② | 在档对拍（一次性命令 · 内存渲染不落档） | **IDENTICAL · 237025 字符**（与设计轮读数逐字相同） |
| AC-5③ | `git status --porcelain bench/results/` | **非空** = `?? bench/results/2026-09-25-roster-29-v6-rejudged.pdf`（既存未跟踪父侧产物——非本批引入）；同域跟踪面 `git diff --stat bench/results/` = **空** |
| AC-5④ | `SUITE_VERSION` ∧ `judge.json.frozenAtSuiteVersion` | `bench/cases/index.mjs:24` = 7 · `bench/judge.json:3` = 7（两档 ±0 行） |
| 另 | 三端套件（零改面回归） | core **631/631** · cli **839/839** · vsc **964/964**（fail 0） |
| 另 | 改动面 | `git status --porcelain bench/` = 恰 7 档（设计表逐行）+ 既存 pdf；**零表外改** |

### 5.3 决策透明表

| # | 决策点 | 选择 | 依据 |
|---|---|---|---|
| 1 | KD-48 单列裁定 | 按**通过**实施（原语 + ①–④ 全做、⑤ 保留） | §4 裁定 = 通过（`:154`）；§2.8#1 否决支不适用 |
| 2 | 行数增量初超设计带上缘 | 按设计表收窄（纯注释压缩：client 头注 / 原语注释 −2 行 · timing 头注 / 夹具注释 −3 行 · ⑫ render 调用折行 −1 行） | 批档 §2.4 预期增量 = 设计档 §3 表（`:933-943`）；**零断言删减 / 零语义改** |
| 3 | 挂载守卫形态 | `err !== null && typeof err === "object" && Object.isExtensible(err)` | 设计 §2.9-4 / KD-48「对象 ∧ 可扩展才挂」；strict mode 下对不可扩展对象赋新键会抛 ⇒ 守卫是必要性面 |
| 4 | 复核面失败耗时 | 不另设专属腿（`reviewRun → callSlot` 单点覆盖） | 设计 §6 AC-1 注（fix #6）+ §5.13 `timing.2` 行 |
| 5 | 评审咨询项（🔵） | **不就地改**（表外行 + 口径面） | 见 5.5-2 |

### 5.4 审计与代码评审轮次与终态

- **内部偏离审计**（explore · 只读 · 1 轮）：总判 **`clean`**——四机制逐条对读相符 · 测试腿逐条对齐 §5.13 · 无表外改动 · 行数全落设计带 · 残留物扫描零命中 · §7-21 边界（判官账目无 `throttled`）✓。
- **内部代码评审**（advisor · code · 1 轮）：**VERDICT: pass**（0🔴 / 1🟡 / 3🔵）。
  - 🟡 = `report-present.test.mjs` 304 行 > 300 软线（**已在册**——§2.7-3 拆分计划；触发 = 本批之后首次触碰 / ≥320 行先到者 ⇒ 非 must-fix）。
  - 🔵 = ① `client.mjs:43` 注释枚举（gate/retry/overloaded）窄于谓词（非 `warn` 相位 ⇒ 含 `quota`——核 `retry.mjs:60-61` 只发 message 随即 429 抛出、无等待）；② `liveTransport` 挂载点无测试缝（设计面覆盖边界）；③ wall-clock 下界断言评估 = 非脆弱（余量 ≥30%）。
- **终态 = `clean`**（零必须修 ⇒ fix 轮 = 0；🟡/🔵 均为在册或设计面处置）。

### 5.5 fix 轮与上抛项

**fix 轮 = 0（无必须修项）。上抛：**
1. 拆分计划照旧（本批 = 越线登记轮，实测 304 行——触发句不变）。
2. `client.mjs:43` 注释 / 谓词面咨询项——面 = 设计档 §2.9-4 第 4 条括注区（现括注「`onWait` 非 `warn` 相位」与实现逐字相符；正文「暂停（限流等待）发生时」与 `quota` 相位不等价）——本席只报不改（表外行 + 口径面）。
3. AC-5③ 读数如实登记（既存未跟踪 pdf = 父侧产物；批档 `:74` 11 档读数含它）。

### 5.6 设计漂移（只报不改）

设计档 §6 AC-1 注内 `judge.mjs:269`（复核面单点）现盘 = `:271`（本批 judge.mjs +2 行位移）——按既存约定（设计档行号 = 设计轮坐标 · 现盘复读为准）属坐标漂移，非实现偏差；本席不改设计档。

### 5.7 读回

本段经 `batch` 工具 append 落 §5（无 path · spawn 绑定）；7 档改动逐档读回核讫（含 `file:line` 定位复读 · 无调试残留 / 过期注释 / 半截编辑）；改动清单 = `git status --porcelain bench/` 恰 7 档。

## §6 验证与收口（父代理）
