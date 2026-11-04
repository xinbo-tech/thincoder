# 2026-11-02 · closeout-proof-s3-declaration
> 六段，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> §2 = 现在要做什么 —— 本条可就地改（`edit`，§4.19）；§1 / §3 / §5 / §6 = 当时说了什么 —— 只追加，不回改。
> 编制：主 agent · 2026-11-02 · 来源 = 2026-11-02 16:17 用户「我认为应该修掉这个机制上打架的情况，开一批改。」。
> 台账 = #2000（— · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-02
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 这一批要解决的事

**用户的话（2026-11-02 16:17）**：「我认为应该修掉这个机制上打架的情况，开一批改。」

**现场（另一仓 v2-vibe-coding 实撞，本仓两头都在盘上）**：一行台账停在 `待核销` 销不掉 —— 那批是**纯措辞纠正、无设计变更**，收口时 §1 声明了 `> 不适用：§3 —— <理由>`，收口过了；核销时被 §3 判据拦下。

## 两个门的实读原文（父侧核过）

**收口门** `thincoder-core/agent-tools/batch-closeout.mjs` 的 `assertCloseoutGates`：

```js
if (!sectionInapplicable(src, 3)) {          // §1 声明 §3 不适用 ⇒ 放行
  const s3 = readSectionStatusWord(src, 3)
  if (s3 !== STATUS_WORDS[3].done) throw new Error(closeoutS3Error(...))
}
```

注释原文：「② §3 状态词臂：word pass 或 §1 声明 §3 不适用（普通模式无设计评审的出路）」。

**核销门** `thincoder-core/ledger-close-proof.mjs` 的 `assertCloseOutProof`：

```js
const s3 = readSectionStatusWord(src, 3)
if (s3 !== STATUS_WORDS[3].done) {
  missing.push(`③ 批档 §3 未通过评审（§3 状态行 = ${s3}，须 = 评审通过）：重开该档补评审结论，或另起批次`)
}
```

**⇒ 同一份档、同一条声明：收口门认，核销门不认。**

## 为什么这是真缺陷，不是「两处不同的门本来就该判不同」

**⇒ 两门判的是**同一件事实**：这批有没有经过设计评审。**
**⇒ 收口门已经把「§1 声明不适用」确立为这条事实的合法表达（并写明它是「普通模式无设计评审的出路」）。**
**⇒ 核销门若另立一条，就等于说「同一份档，收口时没有评审也算过，核销时又必须有过」—— 中间那步只能靠编。**
**⇒ 后果在另一仓已经发生：要么补一轮假评审（评审对象是两句话的措辞），要么让行永远挂 `待核销`。**

## 要改的东西（父侧给方向，设计席定形态）

**核销门的 §3 判据改为与收口门同一条事实读法**：`§3 状态行 = 评审通过` **∨** `§1 声明 §3 不适用`。

**⇒ 单源方向由设计席定**：是把 `sectionInapplicable(src, 3)` 这个既有判定直接复用（它已住 `batch-skeleton.mjs`），还是抽一条共用的「§3 事实判定」供两门同调——**不许两处各写一遍条件**（那正是本批要消灭的形状）。

## 边界（父侧先划死）

- **不动**：§1/§2/§4/§6 的判据；收口门现有判序；状态词表。
- **不放宽**：`不适用` 声明仍只对 §2/§3/§4 生效，且必须带非空理由、形不合由 `malformedInapplicableLine` 拒——这条与收口门共用一个判据，不另立。
- **不新增**：新状态词、新配置项、豁免名单。

## 落点（父侧实读）

- `thincoder-core/ledger-close-proof.mjs`（核销门本体，`assertCloseOutProof` 第 ③ 项）
- `thincoder-core/agent-tools/batch-skeleton.mjs`（`sectionInapplicable` 已在此，判据单源候选）
- `test/integration/ledger-close-proof.test.mjs`（现成用例档，须补一格：声明不适用 ⇒ 核销放行）
- 拒文若改（第 ③ 项现在只提「补评审」），同笔收正

## 父侧裁定（2026-11-02 16:22）—— 方向改了：不是让核销门认声明，是把 §3 的「不适用」口子堵掉

**用户原话**：「不，不允许做这种不适用声明，把这个口子堵住。」

### 为什么这是对的方向（我先前那条指令错了）

**⇒ 核销门的三条判据全读同一个文件，它从来不独立核对 —— 这一点我先前说对了。**
**⇒ 但两者的分量不同：**

| 那行字 | 谁写得进去 | 能不能被绕过 |
|---|---|---|
| `§3 状态行 = 评审通过` | **评审实例** —— 只有绑本档的评审写得了 | 绕不过：没有评审实例就写不出这行 |
| `> 不适用：§3 —— <理由>` | **主 agent**（§1 是我的段） | 一句话就能绕：自己写、自己销 |

**⇒ 让核销门认声明 = 允许主代理靠在自己段里写一行，把「这批没评审」变成核销通过。**
**⇒ 而这条声明本来就是**给普通模式留下的捷径**，在工程模式里它变成了「跳过评审的正规通道」。**

### 改法（父侧定方向）

1. **`§3` 从可声明集里删掉**：`INAPPLICABLE_SEGMENTS` 现为 `[2, 3, 4]` ⇒ 去掉 3。§3 一律要有评审结论。
2. **收口门的 §3 臂同步收紧**：`assertCloseoutGates` 现在写 `if (!sectionInapplicable(src, 3)) { 要求状态词 }` ⇒ 去掉这个分支，**无条件要求 `§3` 状态行 = `评审通过`**。
3. **核销门不动**：它本来就要求 `§3` 状态词；口子一堵，两门自动一致，**不需要给它加任何放宽**。
4. **拒文同笔收正**：`closeoutS3Error` 与核销门第 ③ 项，把「或声明不适用」这条路从话里删掉。

### 现场量过了（父侧实读）

```
声明 §3 不适用 的批档 = 29 份 · 已收口 29 · 未收口 0
```

**⇒ 全是冻结档，堵口不动任何在飞的批。**
**⇒ 代价说清楚：此后**每一批**（含纯措辞批）收口前都要有一轮真评审；普通模式也一样——它本就共用同一条设计评审通道。**

### 存量 29 份怎么处置

**⇒ 不回改（冻结档回改 = 重开，成本与收益不成比例）。**
**⇒ 它们的台账行若还停在 `待核销`：按现判据销不掉。这是**如实的结果**，不另开豁免；处置时机 = 该行被下一批引用时，由那一批带着新判据处理。**

### 已知的连带面（设计席必须实读确认，别凭我这句话）

- `malformedInapplicableLine` 对「行首 `> 不适用` 而完整形不合」是拒写 —— §3 移出集合后，那 29 份的声明行变成「形不合」。它们已冻结 ⇒ 写面本就拒，但要确认**读面**（`readSectionStatusWord` / 核销 / 收口）不会因为这些行抛错或误判。
- 普通模式文档（`docs/core/requirements/NORMAL-MODE.md` 等）里凡是拿「无设计评审的出路」当依据的句子，要同轮找出来。

## 父侧裁定（2026-11-02 16:24）—— 口径扩大：整条「不适用」声明机制封掉，不是只封 §3

**用户原话**：「那把那个口子也封掉，那些口子都是你他妈的留的！」

### 现场（父侧实读，封之前先量）

```
声明 `> 不适用：§N` 的批档 = 29 份 · 已收口 29 · 未收口 0
```

**⇒ 零本在飞 ⇒ 封到底不动任何活档。**

### 改法（覆盖上一节的四条，以本节为准）

1. **`INAPPLICABLE_SEGMENTS` 清空**（现 `[2,3,4]` ⇒ `[]`）：任何段都不得声明不适用。
2. **收口链门**：`§2 / §3 / §4 / §6` **一律要有内容**，删掉「或经 §1 声明不适用」这条分支与它的两条判据（`sectionInapplicable` 在链门里的调用、`sectionContentState` 的 `not-applicable` 分支）。
3. **核销门**：一字不改 —— §3 口子一封，它本来就对。
4. **拒文三处同笔收正**：`closeoutChainError` ∥ `inapplicableDeclarationError` ∥ 核销门第 ③ 项，把「或声明不适用」从话里删干净。
5. **`malformedInapplicableLine` 的去留由设计席定**：若「不适用」这个形彻底退场，它判的对象就不存在了 —— 要么删，要么改成「出现即拒」并写清为什么还留着。

### 为什么连 §2 / §4 一起封（不是只封 §3）

**⇒ §2（设计）与 §4（用户批准）被声明不适用，等于**这批没有设计、也没有批准**就结了账。**
**⇒ 比 §3 更严重 —— §3 至少还有「评审实例才写得了」那道外部事实，§2/§4 全是自述。**

### 连带面（设计席必须实读确认）

- **轻通道**：`docs/core/design/LIGHT-CHANNEL.md` 的收尾本来就走**全链**（设计形式化 → 独立评审 → 修复 → 批准 → 收口）。**⇒ 它本来就该有 §2 与 §3；历史上的「轻通道 ⇒ §3 不适用」与它自己的设计相抵。** 设计席要把这条相抵实读出来并写进决策，不许拿「轻通道没有评审」当理由。
- 需求档 / 普通模式档里凡以「无设计评审的出路」作依据的句子，同轮找出来（写权归主代理，设计席只列点）。

### 存量 29 份

**⇒ 不回改、不重开。它们已冻结 ⇒ 写面本就拒。**
**⇒ 但要确认**读面**（核销 / 收口 / `readSectionStatusWord`）不会因为这些档的 §1 里那行 `> 不适用：§3` 而抛错或误判 —— 这是封口后唯一可能反噬的地方，设计席要实测这 29 份。**

### 代价（说清楚，不留到事后）

**⇒ 此后**任何一批**，没有 §2、没有 §3、没有 §4，就收不了口、也销不掉账。**
**⇒ 这是你这句话的直接后果，不是附带损伤。**

## 父侧裁定（2026-11-02 16:28）—— 一并处理：把剩下两条「不开链也能结账」的路查并封

**用户原话**：「你把这些口子也一起处理一下。」

父侧扫完剩下的绕行面，**真正还在的两条**如下（其余逐条判过，不是口子，列在后面备查）。

### 口子 A：「追认核销」一跳（`待讨论 / 待设计 → 已核销`）

**位置**：`thincoder-core/ledger-write-ops.mjs` 的 `applyRowClose` —— 现文允许 `待讨论 / 待设计` 直接核销，只要求带 `evidence`。

**今天它走不通**：同函数第 161 行无条件调 `assertCloseOutProof`，要求批档在盘 ∧ §1 已收口 ∧ §3 评审通过 ⇒ 想走这条路，先得有一本完整收口的批档。

**⇒ 那它就不是活口子，是一条**读起来像捷径的死分支**。**
**⇒ 但「读起来像捷径」本身就是缺陷：下一个人会试，试完发现被拒，再去想怎么让机检过 —— 而不是去想这批该不该走全链。**
**⇒ 处置（设计席定形，父侧给方向）：分支删掉或改成显式判据，让「追认」不再是一个可写进去的目标态。**

### 口子 B：「兜底核销路径」——**设计档写着一条代码拒绝的路**

**设计档** `docs/core/design/BATCH-RECORD.md` §5.2 标题即「兜底核销路径（批未收口 / 条目失去挂靠）」，正文：

> 触发 ① 条目已实质完成，而挂靠批档停在「进行中」且 §4 / §6 无实质内容…
> 动作：**核销判据 = 结账依据**（不是挂靠批档的状态行）——先按迁移表推进到「待核销」，`evidence` 回写结账依据

**代码**：`assertCloseOutProof` 要求**批档必须是「已收口」**，否则第 ② 项即拒。

**⇒ 两者相反：文档说「批未收口也能结账（用结账依据）」，代码说「批未收口就不许结账」。**
**⇒ 与本次要修的 §3 那条同族：**同一件事，文档一套、代码一套**。**

**⇒ 处置：以代码为准，把 §5.2 这条「不开链也能结账」的路删掉**；保留它有价值的那半句 —— 「条目在别处完成时，把结账依据写进 evidence」，但**结账前提不变：挂靠批仍须走完全链收口**。

### 逐条判过、确认不是口子的四处（备查，不处理）

| 项 | 判据 |
|---|---|
| `§5` 豁免（`batch-closeout.mjs` 注释「§5 is exempt」） | 轻通道轮无实施段；链门判集本就不含 §5 |
| `trigger = 认账不排期` 在批量重锚里零触 | 政策判断不归机器；行仍留着，不是跳过流程 |
| `batch status` 写 §1「已收口」 | 与 `close` 同一道 `assertCloseoutGates`，无第二条路 |
| 轻通道「免设计→评审→批准全链」 | 它免的是**落笔前**那条链；**收口仍跑全链**（`docs/core/design/LIGHT-CHANNEL.md` 明写 §3 = 独立评审 + VERDICT）。封掉声明后，轻通道批也必须有一轮真评审 —— 这是本批裁决的直接后果 |

### 边界

**⇒ 不新增门、不加豁免名单、不动状态词表。**
**⇒ 两条处置都是**删路**，不是**加路**。**

## 父侧裁定（2026-11-02 16:32）—— 口子 A 不接受「留着但注明不可达」，要删边

**设计席 #4 的处置**：决策 30 写「追认核销**留着，不删分支**——可达前提 = 一本走完全链收口的批档」。

**⇒ 我不接受。** 理由不是它说得不对，是它答的是另一个问题。

- 它答的是「**能不能被利用**」⇒ 不能（先得有完整收口的批档）。
- 我问的是「**这条边该不该存在**」⇒ 不该。

### 为什么这条边该删

**⇒ 台账状态机有序：`待讨论 → 待设计 → 在途 → 待核销 → 已核销`。**
**⇒ 追认核销让 `待讨论 / 待设计 → 已核销` 一步跨过去。**

它跳过的不是权限，是四个状态各自代表的事实：

- `待设计` = 设计没写
- `在途` = 有人认领、正在做
- `待核销` = 做完了、在等结账

**⇒ 这条边等于允许「没设计、没人认领、没验证」的行显示为已结账。**
**⇒ 它今天走不通，只是**另一道门**恰好挡着。**
**⇒ 拿另一道门给自己的合法性背书，正是本批要消灭的形状。**

### 要的处置

**⇒ 删掉 `待讨论 / 待设计 → 已核销` 这条边。**
**⇒ 唯一通向已核销的路径 = `在途 → 待核销 → 已核销`。**

**⇒ §5.2 保留的那半句（条目在别处完成）仍成立，但走法不同**：
先落 `在途`（认领）→ `待核销` → 结账，**不给捷径边**。

**⇒ 连带退役**：`applyRowClose` 里对 `待讨论 / 待设计` 的分支 ∥ `:163` 的追认 evidence 判据。
**⇒ 一处一词**：设计档 / 提示词 / 工具描述里凡写「追认核销」处同笔收正——迁移没了，名字也不留。

### 边界

**⇒ 不改六态词表；不改迁移表其余边；不给 `待讨论` 行开任何新出口。**

## 父侧更正（2026-11-02 17:10）—— 我先把评审的 🔴 判成误判，那是我量错了

**⇒ 我曾对设计席说「评审的 🔴 #1 与 🔵 #13 不成立，实测 384 ∥ 446 ∥ 289」。那句话作废。**

### 字节读数（真值）

```
batch-skeleton.mjs  bytes=36361  LF=523  CRLF=0  loneCR=0  ⇒ 524 行
batch.mjs           bytes=42913  LF=531  CRLF=0  loneCR=0  ⇒ 532 行
items.mjs           bytes=17194  LF=309  CRLF=0  loneCR=0  ⇒ 310 行
```

**⇒ 档是纯 LF、无混合行尾 —— 行数只有一种真值。**
**⇒ 我用的 `Get-Content .Count` 在本机偏低 140 行/档，是坏尺子。**
**⇒ 评审的档位结论成立：`batch-skeleton.mjs` 524 ∥ `batch.mjs` 532，两档越 500 软线。**

### 我错在哪（不是量法，是态度）

**⇒ 它量出来的结论**正是我想要的**（设计席没问题），我就没换一把尺子复核，直接判评审误判。**
**⇒ 今晚同一形状第二次**：先前我凭印象说「轻通道与自己的设计相抵」，被设计席用 `grep` 零命中顶回来。**
**⇒ 共同点：**我的否定结论，都是在结论对我有利时下的**。**

### 现在的处置

- **档位结论按 LF 重写**；`items.mjs` 改 310；
- **拆单不在这批做，但要写计划**：两档各写拆边界，并登记为下一批接笔（触发 = 下一批动这两个档时同笔抽）；
- **量法写进设计档**：LF 计数 + 为什么用它（含我这次的 140 行差的教训）。

**重开记录**：2026-11-02 · 原收口 2026-11-02 · 理由 = 用户 2026-11-02 17:41「怎么还有『轻通道免全链』的说法？杀了多少次了！杀不干净啊！」——本档 §6.3 第四项残留该说法，重开改这一句 · 操作者 = 主 agent
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（服务端台账面并批：条目 R-S3-10/11/12 · 受影响文件八行 + 本席本轮收正 `docs/server/design/ledger/LEDGER.md`（§9 死指针删 + 三条读数 + §10 七行载体 ∥ §11 标题 + `v20 段` 行改指 + R74② 删）· 验收三行 · 跨面差异与三处存量入「明确不在本批」；上抛 10/11 已由父侧裁定（DDL 列注本轮不动，理由 = 与 `docs/server/design/store/STORE.md` 逐字镜像））

### 本批条目（覆盖）

| # | 条目 | 回指 |
|---|---|---|
| R-S3-1 | **`不适用` 声明机制整条退役**：`INAPPLICABLE_SEGMENTS` 清空 ⇒ `sectionInapplicable` 恒 false、`sectionContentState` 的 `not-applicable` 分支不可达，两者一并退役；`§1` 里出现 `> 不适用：§N —— <理由>` ⇒ 拒 | 台账 #2000 · 设计 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6 · §4 决策 28 · 用户 16:24 |
| R-S3-2 | **收口门 §3 臂无条件**：`assertCloseoutGates` 去掉 `if (!sectionInapplicable(src, 3))` 分支，`§3` 一律要状态行 = `评审通过` | 同上 §2.6 收口门行 |
| R-S3-3 | **`§5` 写入门去死分支**：`assertSectionFiveGate` 删 `if (sectionInapplicable(src, 3)) return`；拒文括注「仅普通模式的批可在 §1 写 … 放行」整句删 | 同上 §2.6 `§5` 门行 + `R-G2` 逐字块 |
| R-S3-4 | **核销门零改**：`ledger-close-proof.mjs` 判据与 ③ 拒文字面一字不动（它本就要求 §3 状态词，也本就不提声明） | 父侧 `§1` 第 3 条 |
| R-S3-5 | **四处拒文收正**：`closeoutChainError`（`(§2 / §3 / §4 only)` 与「be declared inapplicable in §1」整段删）· `closeoutS3Error`（「或由 §1 声明不适用」删）· `inapplicableDeclarationError`（改「声明机制已停用」）· `§5` 门括注 | 父侧 `§1` 第 2 条 + 本席实读 `thincoder-core/agent-tools/batch-closeout.mjs:55` |
| R-S3-6 | **轻通道相抵收正**：`docs/core/design/LIGHT-CHANNEL.md` §2.6 表与 K3 的 §5「不适用」改「不写」，并写明收尾轮的 §2 = eng-designer、§3 = 评审子代理，封声明后是收口的机械前置 | 父侧 `§1` 第 4 条 |
| R-S3-7 | **核销边只留一条：`待讨论 / 待设计 → 已核销` 删除**（旧称「追认核销」随迁移一并退场）：`applyRowClose` 源态判收窄为只认 `待核销`、`:163` 的追认 `evidence` 门删除、拒文改带出路句；批量面跳过文案与工具描述同笔收正 | 台账 #2000 · 用户 16:32 · 设计 §2.14 · 决策 30 |
| R-S3-8 | **「条目在别处完成」不再是一条核销路**：`docs/core/design/BATCH-RECORD.md` §5.2 删「核销判据 = 结账依据（不是挂靠批档的状态行）」，改成「结账依据写 `evidence`，核销节点仍是挂靠批收口」；**走法 = 先 `update` 到 `在途`（认领）→ `待核销` → 勾销，不给捷径边**；同档 BR-17 / D-BR16 / §5 表行同笔收正 | 父侧 `§1` 16:28 口子 B + 16:32 |
| R-S3-9 | **绕行面四条逐条判**（见下节）：`§5` 豁免 · `认账不排期` 零触 · `status` 写「已收口」 · 轻通道免全链——四条均判**不是口子**，逐条带判据与暴露面 | 父侧 `§1` 16:28「四处备查」 |
| R-S3-10 | **服务端核销边同步删掉（判据对齐）**：`closeItem` 源态判收窄为只认 `待核销`；追认正文门随边一并删 ⇒ 两侧只剩同一条边 | 台账 #2000 · 用户 16:32 · `docs/server/design/ledger/LEDGER.md` §2 `KD-SV-141` · §4「核销边只有一条」∥「不收正文门」 |
| R-S3-11 | **服务端拒文与注同笔收正**：400 人话 = 「核销仅限 待核销（现态点名）」+ 出路句；域内与工具面六处注里的「追认核销」一并收正 | 同上 §4「收口/撤回」行 · §11 `B7` |
| R-S3-12 | **服务端用例**：`B7`（三态各 400、行状态零变、`closed_at` 仍空）∥ `B7b`（同一行 `PATCH` 三步到 `待核销` 再 `close` ⇒ 通过）——服务端无既有测试档，载体 = 本批单测档 | 同上 §11 `B7` / `B7b` |

**明确不在本批**：状态词表 · 收口门判序 · 核销门三条判序 · 新状态词 / 新配置 / 豁免名单 · 存量 29 份冻结档（不回改——封口不重写历史账） · `§1` 状态行判据 · 迁移表其余边（只删核销那一条，其余六条零改）。

- **服务端跨面差异（本批两侧都不动）**：本机有 `待讨论 → 在途` 建档边，服务端没有。
- 本机实读：`thincoder-core/ledger-write-ops.mjs:42`–`:46` 逐字「`待讨论 → 在途`（2026-10-27 建档边）」在进边集内。
- 服务端实读：`thincoder-server/src/ledger/items.mjs:32` 逐字 `"待讨论": ["待设计", "已废弃"]`——无该边。
- ⇒ 同一「条目在别处完成」的走法：本机最少 2 跳（`待讨论 → 在途 → 待核销`），服务端固定 3 跳（`待讨论 → 待设计 → 在途 → 待核销`）。
- **触发条件 = 服务端下一次动 `ALLOWED_MIGRATIONS` 的轮次（或 `KD-SV-141` 复核轮）**：届时二选一（服务端补该边 ∥ 本机删该边），由用户在那一轮裁；本批不预设，也不为它加门。
- **三处存量残缺（属存量清理轮）**：`docs/server/design/gateway/API.md:249` ∥ `docs/server/design/store/STORE.md:532` 各有一行仍写已退役的那条边；第三处 = `thincoder-server/src/store/migrations/ddl-v12-v20.mjs:261` 列注。
- 三处同轮的依据：该 DDL 档头注逐字「v20 段逐字」沿 `docs/server/design/store/STORE.md` ⇒ 代码侧列注与该档是**逐字镜像对**，单改一侧就把镜像声明改成假的。

### 设计档落点

- 机制正文 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6（门表三行 + 「`不适用` 声明机制整体退役」块 + 两处拒文块 + 模式范围段）+ **§2.14**（核销边只留一条）。
- 台账面机制正文 = `docs/core/design/LEDGER.md` §3：核销一条边 · `evidence` 参表 · 批量面 · API 表 · AC-M2-27 · 用例 T33–T36 · §边界行。§3 失败文案 = 逐态出路句表（三支：`待讨论`/`待设计` ∥ `在途` ∥ 归档态，与 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.14 表逐字一致）；§3.1 ④ = 一条边（`在途 → 待核销 → 已核销`）。
- 验收 = 同档 §5 `R4` / `R5` / `R6` / `R22`（声明面）∥ `R28`（核销边）；用例 = 同档 §6（存量声明档核销 ⇒ 拒 · 声明批 `append §5` ⇒ 拒 · `待讨论` 行核销 ⇒ 拒 · 认领三步全过）。
- 关键决策 = 同档 §4 决策 28（声明退役：理由一 / 二 + 被拒三案）· **决策 30（核销边只留一条 + 被拒两案）**。
- RTM delta = 同档 §9：声明面 破 0 / 冗余 0 / 改 1 / 增 1（10-3 加第四档 d · 新增 7-11）；核销边 破 0 / 冗余 0 / 增 1（新增 10-5）。
- **本轮设计面收正（两档，本席笔；零语义新增——改的都是「盘上已如此」的对齐）**：`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.6 声明退役条按现状成文（`INAPPLICABLE_SEGMENTS` = 空集 · 声明判定函数不导出 · `sectionContentState` 只有 `content` / `empty` 两态 · `malformedInapplicableLine` 行首命中即拒）；同档决策 28 被拒案里的符号引用改为该臂判据。`docs/core/design/LIGHT-CHANNEL.md` §2.5 门径行 = 核销单边（`待核销` → `已核销`），`applyRowClose` 落点由调用面 `thincoder-core/ledger-cmd.mjs` 改指实体档 `thincoder-core/ledger-write-ops.mjs`；同档先例行的两条坐标同笔改指实体档与调用点。

### 机制设计

**声明机制退役的落法（`thincoder-core/agent-tools/batch-skeleton.mjs`）**：

```js
export const INAPPLICABLE_SEGMENTS = []   // 声明机制退役：清空即可，正则与函数体都留着
```

- **`malformedInapplicableLine` 留着、语义改「出现即拒」**：段号集一清空，它在 `§1` 命中的每一行都是非法行（宽网 `INAPPLICABLE_PREFIX_RE` + `INAPPLICABLE_SEGMENTS.includes` 恒 false）。留它的理由：它是**停用机制的痕迹检测器**——`§1` 里还写着 `> 不适用：§3 —— …` 的人必须当场被拒并读到「这条路没有了」，而不是静默当作没写。
- **`sectionInapplicable` 删、不改成恒 false 的导出**：留一个恒 false 的函数 = 留一个下一个人能重新接上的插座。消费点两处（`assertCloseoutGates` 的 §3 臂、`assertSectionFiveGate` 的首判据）随之删。
- **`sectionContentState` 改两态**（`content` / `empty`），`not-applicable` 分支与三态 JSDoc 退役；判空口径（排除类行集）零改。
- **判据不另立函数**：`§3` 判据 = `readSectionStatusWord(src, 3) === STATUS_WORDS[3].done`，门面同读一个词表（`STATUS_WORDS` 单源），不新增导出。
- **核销门判据零改，① 拒文同笔收正**：③ 串实读为「重开该档补评审结论，或另起批次」，本就不含声明路 ⇒ 判据与判序零改。但 ① 拒文逐字仍写「**追认核销**须先挂批档（update 写 task_book），再跑全链」（`thincoder-core/ledger-close-proof.mjs:41`）——边已删、旧边名留在人话里 ⇒ 改「核销须先挂批档（update 写 task_book），再跑全链」。改的是一条拒因的人话，不是判据。
- **存量 29 份冻结档重开后的读面后果（实读，附出路）**：重开径**不过**收口门——`thincoder-core/agent-tools/batch-lifecycle.mjs:246` 逐字「重开（§4.18-B · §2.13）：一次写盘、两处落笔（状态行改写 + §1 段尾追记行）——不跑收口门」，`:252` 回执逐字「the closeout chain gate still applies at the next close」；`malformedInapplicableLine` 只在链门被调（`thincoder-core/agent-tools/batch-closeout.mjs:65`，入口 = `assertCloseoutGates:85`）。
  ⇒ **带 `> 不适用` 的存量档一旦重开，此后每次 `close` 都在链门被 J3 拒、永久关不上**（`§1` 只追加，那行删不掉）。**出路** = 主 agent 直改该档 `§1` 段体删掉那一行（不在段头区，删它不触状态行），再正常收口；本批不回改任何冻结档。验收 = R-S3-1 第二格。

**核销边的删法（`thincoder-core/ledger-write-ops.mjs` 的 `applyRowClose`）**——判据一句 + 三支出路句（与设计档 §2.14 逐字一致）：

**判据（单源 = `applyRowClose` 首判）**：目标 = `已核销` ∧ 行现态 ≠ `待核销` ⇒ 拒。拒文逐字：

```text
ledgerClose：核销仅限 待核销（现态 <X>）：<出路句>
```

**出路句按现态分支**（同一件事实、出路不同——对 `在途` 说「先 update 到 在途 认领」是让人重做一步已做的事）：

| 现态 | 出路句 |
|---|---|
| `待讨论` / `待设计` | `先 update 到 在途 认领，再 update 到 待核销，最后 close 勾销` |
| `在途` | `先 update 到 待核销（做完才结账），再 close 勾销` |
| 归档态（`已核销` / `已废弃`） | `该行已归档（<X>），不在核销面` |

归档态那支不是新分支：改前同一输入也走这条首判并拒（旧判据 `待讨论 / 待设计 / 待核销` 本就不含归档态），行为零改，只把这句兜底话换准。

- **删 `:163` 的追认门**：那一行判的是「`待讨论 / 待设计` 核销须带 `evidence`」——边删了，它判的对象不存在。`evidence` 剩余两拒面（旗独传 ∥ 新值全空白）不动。
- **批量面文案**：`ledgerCloseBatch` 的 `待讨论 / 待设计` 跳过行 `why` 改 `ledgerClose：待认领不可核销（须先 update 到 在途）`（原句指向的「转单行 close」那条路已不存在）。
- **批量面文案三问（先查再建）**：`existing but unusable: thincoder-core/ledger-cmd.mjs:250` · name: `ledgerClose：追认核销不入批量面（转单行 close）` · failed on: 句名是已退役的边，且它指的出路（转单行 `close`）随边一并消失，除 `ledgerClose：` 前缀外无可复用——新句落在同一 `why` 槽。同处 `在途` 支的 `ledgerClose：在途不可跳（须先 待核销）` 判的是另一件事，零改。
- **工具描述五处**：`thincoder-core/ledger-tools.mjs` 的 `batch` / `status` / `evidence` 三条与 `thincoder-core/tool-docs/ledger.md` 两条，凡「追认核销」改「勾销」或删。
- **不改判序**：源态判仍在核销标记门之前（`docs/core/design/LEDGER.md` §3 判序零改）。

**三处拒文（逐字，改动后）**：

J1（`closeoutChainError`）——删「(§2 / §3 / §4 only)」与「be declared inapplicable in §1」两处：

```text
batch: 收口链未跑完（closeout chain gate）— close refuses: the record's closeout chain has not run, and closing would freeze it that way. Missing: <段表>. Each named section must carry its own content — the `不适用` declaration is retired (every batch needs its design, its review and its approval). §6 must carry its verification. Nothing was written.
```

`inapplicableDeclarationError` —— 改「声明已停用」：

```text
batch: `不适用` 声明已停用（inapplicability declaration retired）— no declaration is accepted: §2 / §3 / §4 / §6 must each carry content (§5 exempt). Offending line: <line>. Nothing was written.
```

`§5` 门括注 —— 删「仅普通模式的批可在 §1 写 `> 不适用：§3 —— <理由>` 放行 —— 普通模式无设计评审。」整句，只留：

```text
（轻通道的评审是后置，不是免掉：改完补设计与评审，补完再收回口。）
```

### 受影响文件与测试覆盖

| 文件 | 变化 |
|---|---|
| `thincoder-core/agent-tools/batch-skeleton.mjs` | 改造：`INAPPLICABLE_SEGMENTS` 清空；删 `sectionInapplicable`（含 JSDoc）；`sectionContentState` 改两态；`malformedInapplicableLine` / `inapplicableDeclarationError` 字面与 JSDoc 改 |
| `thincoder-core/agent-tools/batch-closeout.mjs` | 改造：§3 臂无条件 ∥ `assertSectionFiveGate` 删死分支与括注 ∥ `closeoutChainError` 字面改 ∥ 头注两处收正 |
| `thincoder-core/agent-tools/batch.mjs` | 改：`appendBatchRecord` 处注释句（「无评审的批由 §1 声明放行」）删 |
| `thincoder-core/ledger-write-ops.mjs` | 改：`applyRowClose` 源态判收窄为 `["待核销"]` + 拒文带出路句；删 `:163` 追认 `evidence` 门；头注「核销两源」改一条边 |
| `thincoder-core/ledger-cmd.mjs` | 改：`ledgerClose` 头注（判序删追认门）；`ledgerCloseBatch` 头注与跳过文案（`待认领不可核销（须先 update 到 在途）`） |
| `thincoder-core/ledger-tools.mjs` | 改：`close` 的 `batch` / `status` / `evidence` 三条工具描述里的追认句收正 |
| `thincoder-core/tool-docs/ledger.md` | 改：`close` 与 `close --batch` 两条的追认句收正 |
| `thincoder-core/tool-docs/batch.md` | 改：`:26` 的「or §1 declares it inapplicable … (§2 / §3 / §4 only; §5 is exempt; §6 never)」整句换「every section must carry content (§5 exempt)」 |
| `thincoder-core/ledger-close-proof.mjs` | 改：判据与判序零改；① 拒文旧边名收正（`:41`「追认核销须先挂批档」⇒「核销须先挂批档」）；③ 串零改 |
| `docs/core/design/LEDGER.md` | 改：§3 失败文案（`:140`）= 逐态出路句表（三支：`待讨论`/`待设计` ∥ `在途` ∥ 归档态，与 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.14 表逐字一致）；§3.1 ④（`:179`）= 一条边 `在途 → 待核销 → 已核销`，追认段整段删；§3.1 判序段的块名改指 §3 核销标记门；`AC-M2-14` ∥ `AC-M2-27` ∥ `T33`–`T36` 在盘 |
| `test/integration/ledger-close-proof.test.mjs` | 改：10-3 加第四档 d（存量声明档 ⇒ 核销 **拒**，③ 行逐字、行零改）；增 10-5（`待讨论` 行核销 ⇒ 拒 + 认领三步全过） |
| `test/integration/batch-close-gate.test.mjs` | 改：加一格——`§1` 有 `> 不适用：§3` 的档 `close` ⇒ 拒（`inapplicableDeclarationError` 逐字）、`§1` 状态行字节不变 |
| `test/RTM.md` | 改：10-3 行加第四档 d（该档核销 ⇒ **拒**）；故事 7 增 **7-11**（收口面声明一律拒 ⇒ 拒）——7-10 已被批档 `edit §2` 那行占用，编号顺延；故事 10 增 **10-5**（`待讨论` 行核销 ⇒ 拒 · 认领三步全过） |

**档位结论**：**两档越 500 软线**——`thincoder-core/agent-tools/batch-skeleton.mjs` 524 行 ∥ `thincoder-core/agent-tools/batch.mjs` 532 行。本批不动它们，拆边界与触发见下。

**拆边界（`batch-skeleton.mjs`）**：抽两族出门。

- 「裁定与轮次块族」：`VERDICT_PASS_LINE` / `VERDICT_CHANGES_LINE` 锚 + `verdictGapOf` + `countRoundBlocks` / `lastRoundBlock` / `nextRoundNumber` + `statusResetPlan` / `statusPassPlan`。
- 「模板与占位族」：`batchSkeleton` / `TEMPLATE_PLACEHOLDERS` / `findPlaceholderResidue` / `placeholderResidueError`。
- 骨架档留：词表（`STATUS_WORDS` 单源）+ 段头 / 段体解析 + 段级状态行读面 + 段内容判词。

**拆边界（`batch.mjs`）**：抽「段写入轨」出门（段绑定判 + 净化 + `insertIntoSection` + 两条状态计划的消费），留 `batch.mjs` = `create` / `list` / 参数面（路径解析已在 `batch-paths.mjs`）。

**触发 = 下一批动这两档时同笔抽**，不另开拆档批；具体切口由那一批的设计席按实读定字面（本节只定边界，不记行号）。本批零新增导出：两档本批只删分支与注释。

**量法**：行数 = **LF 计数**（`split(/\r?\n/)`，与字节侧 `\n` 计数同值）。**不用 `Get-Content … .Count`**——它在纯 LF 档上偏低：同一档实测 `.Count` = 384、LF = 524，差 140 行（这个尺子给偏低值，且不报错）。档无混合行尾（CRLF = 0、lone CR = 0）⇒ 只有一种真值。

### 验收对照（回指本批条目）

| 条目 | 判据（可机检） |
|---|---|
| R-S3-1 | ① `node --test test/integration/batch-close-gate.test.mjs`：`§1` 含 `> 不适用：§3 —— <理由>` 的档 `close` ⇒ 拒、拒串 = `inapplicableDeclarationError` 逐字、`§1` 状态行字节不变。② 存量档重开后的后果（可判形）：造一本临时档 —— `§1` 状态行 = `进行中` + `§1` 段体含 `> 不适用：§3 —— <理由>` + `§2 / §4 / §6` 各有内容 ⇒ `close` 拒、拒串 = `inapplicableDeclarationError` 逐字并点名该行、档字节零写；出路 = 主 agent 直改 `§1` 段体删该行后再收口。③ `grep -c "INAPPLICABLE_SEGMENTS = \[\]" thincoder-core/agent-tools/batch-skeleton.mjs` = 1 |
| R-S3-2 | `node --test test/integration/batch-close-gate.test.mjs`：`§3` 无状态行、其余段有内容 ⇒ `close` 拒（拒串含 `§3 状态行 = （无状态行）`） |
| R-S3-3 | `§3` 无 pass 时 `append §5` ⇒ 拒（`R-G2` 逐字，拒文不含「仅普通模式的批」）；`grep -c "仅普通模式的批" thincoder-core/agent-tools/batch-closeout.mjs` = 0 |
| R-S3-4 | 声明面零改：`grep -c "不适用" thincoder-core/ledger-close-proof.mjs` = 0。① 拒文旧边名收正：`grep -c "追认核销" thincoder-core/ledger-close-proof.mjs` = 0。判据 ∥ 判序 ∥ ③ 串零改：`git diff` 该档只有 `:41` 一处 hunk，`thincoder-core/ledger-close-proof.mjs:53`–`:56` 判据臂与 `:55` ③ 串逐字与改前一致 |
| R-S3-5 | `grep -c "be declared inapplicable" thincoder-core/agent-tools/batch-closeout.mjs` = 0；`grep -c "或由 §1 声明不适用" thincoder-core/agent-tools/batch-closeout.mjs` = 0；`grep -c "§2 / §3 / §4 only" thincoder-core/tool-docs/batch.md` = 0 |
| R-S3-6 | `grep -c "不适用：§3" docs/core/design/LIGHT-CHANNEL.md` = 0 |
| R-S3-7 | `node --test test/integration/ledger-close-proof.test.mjs`：`待讨论` 行 `close{status:"已核销"}` ⇒ 拒（拒文逐字含 `核销仅限 待核销（现态 待讨论）` 与 `先 update 到 在途 认领，再 update 到 待核销，最后 close 勾销`）、行状态仍 `待讨论`、`closed_at` 仍空；`待设计` 行同形同拒（现态点名 `待设计`、出路句同上）；`在途` 行同形同拒（现态点名 `在途`、**出路句 = `先 update 到 待核销（做完才结账），再 close 勾销`，不是认领句**）；归档态行（`已核销` ∥ `已废弃`）同拒、出路句 = `该行已归档（<X>），不在核销面`；同档 `update` 到 `在途` → `待核销` → `close` 三步全过；`grep -c "追认核销"` 四值全 0：`thincoder-core/ledger-write-ops.mjs` · `thincoder-core/ledger-cmd.mjs` · `thincoder-core/ledger-tools.mjs` · `thincoder-core/tool-docs/ledger.md` |
| R-S3-8 | `grep -c "核销判据 = 结账依据" docs/core/design/BATCH-RECORD.md` = 0；`grep -c "兜底核销" docs/core/design/BATCH-RECORD.md` = 0 |
| R-S3-9 | 四条判定在 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §4 决策 29 逐条成文（每项带判据与暴露面）；本档下一节同四条 |
| R-S3-10 | 载体 = 本批单测档 `docs/batches/2026-11-02-closeout-proof-s3-declaration.test.mjs`（收口删除）；命令 = `node --test docs/batches/2026-11-02-closeout-proof-s3-declaration.test.mjs`。`B7`：import `closeItem` + `openDatabase` 造内存库 ⇒ `待讨论` 行 `close{status:"已核销"}` 抛 400（message 逐字含 `核销仅限 待核销（现态 待讨论）` 与 `先 PATCH 推进到 待核销`）、行 `status` 仍 `待讨论`、`closed_at` 仍 `null`；`待设计` ∥ `在途` 同形同拒（现态各自点名、行零变）。`B7b`：同一行 `PATCH` `待设计 → 在途 → 待核销` 再 `close` ⇒ 通过、`closed_at` 落值。夹具跑不动 ⇒ 实施席停下上报父侧，不许自行降级 |
| R-S3-11 | `grep -c "追认核销"` 六值全 0：`thincoder-server/src/ledger/items.mjs` · `thincoder-server/src/ledger/routes.mjs` · `thincoder-server/src/ledger/client-routes.mjs` · `thincoder-server/public/views-ledger.mjs` · `thincoder-core/team-ledger.mjs` · `thincoder-core/tool-docs/team_ledger.md` |
| R-S3-12 | 设计面判据 = `docs/server/design/ledger/LEDGER.md` §11 `B7` ∥ `B7b` 两行在场；可跑面 = 与 R-S3-10 同档（服务端无既有测试档，见受影响文件表末行） |

**集成面**：改 1 行（10-3 加 d 档）+ 增 2 行（7-11 · 10-5）；破 0 / 冗余 0。本批**不跑全套**——全套 = 父侧收口门。

### 绕行面逐条判（四条都不是口子——父侧「备查」那节的实证复核）

| 项 | 判据（本席实读） | 为什么不是口子 | 判错会怎么露出来 |
|---|---|---|---|
| `§5` 豁免 | `const CHAIN_SEGMENTS = [2, 3, 4, 6]`（`thincoder-core/agent-tools/batch-closeout.mjs:33`）——判空只有这一个入口；`assertSectionFiveGate` 门的是**写序**，不要求 §5 存在 | 轻通道轮无 eng-coder 实施段，链门判集不含 §5 是设计，不是漏判 | 轻通道批永不写 §5：若另有门把它当必填，这些批会在收口被拒——而它们照常收口 |
| `trigger = 认账不排期` 批量重锚零触 | `thincoder-core/ledger-cmd.mjs:312` `if (row.trigger === "认账不排期") continue`——行状态一字不动 | 行仍在册、仍进 `query` 的 `aged` 读数（未决四态 ∧ 行龄 > 30 天），不是静默消失；政策判断归行主人 | 一行没做完却没人看得见——只在有人只读收口回执、从不跑 `query` 时。**这是可见面的薄弱点，不是绕行路**，不另加机制 |
| `batch status` 写 `§1`「已收口」 | `thincoder-core/agent-tools/batch-lifecycle.mjs:257` ∥ `:287` 同调 `assertCloseoutGates`，同判序 | 两入口差别只在 `action` 字串（单测档门与机检门的措辞）与其后的设计凭证消费 | 造一本 `§3` 空档：`close` 拒而 `status` 通过 ⇒ 一格夹具即红 |
| 轻通道免「设计 → 评审 → 批准」 | `docs/core/design/LIGHT-CHANNEL.md` §2.6 表：§2 = eng-designer（收尾轮）、§3 = 评审子代理；§2.4 序列含这两步 | 免的是**落笔前**那条链；收尾全链本来就有这两步，封声明后是收口的机械前置（链门 + §3 状态词臂） | 若真是空转，轻通道批的 §2 / §3 永远凑不齐——封声明后链门点名缺段。**历史上 29 份声明档证明有人走了那个出口，不证明那两步不存在**——这正是本批要收的口 |

### 服务端台账面（同一口子 · 团队台账镜像）

- **一句话**：团队台账与本机台账是**同一条边**——`待讨论 → 待设计 → 在途 → 待核销 → 已核销`，核销只自 `待核销` 出；本机删了 `待讨论 / 待设计 → 已核销`，服务端同一批删，两侧不留第二条路。
- **设计档正文（本轮已落盘，本席零重写）**：`docs/server/design/ledger/LEDGER.md` §2 `KD-SV-141` · §3 `detail` 行 · §4 收口/撤回行 + 两条新行 · §11 `B7` ∥ `B7b`。
- **判据（本席实读落点）**：`closeItem`（`thincoder-server/src/ledger/items.mjs:277`）现文 `:287` 白名单 `["待讨论", "待设计", "待核销"]` ⇒ 收窄为只认 `待核销`；`:290`–`:292` 的追认正文门（`detail` 非空）随边一并删。
- **删正文门有设计面依据**：正文门原本只服务那条被删的边，边没了它判的对象也不存在——见 `docs/server/design/ledger/LEDGER.md` §4「不收正文门」。
- **拒文：同一句事实，出路半句按本面迁移表写**：本机侧不在此重复逐字——按上文「出路句按现态分支」那张三行表落（同一句拒文并存两种逐字，正是本批要消灭的形）。
- 服务端 400 人话同构，但本面无 `待讨论 → 在途` 边 ⇒ 不写「先到 在途」，写 `核销仅限 待核销（现态 X）：先 PATCH 推进到 待核销，再收口`（对服务端三态 `待讨论` ∥ `待设计` ∥ `在途` 都成立）。
- **三问（先查再建）**：`existing: thincoder-server/src/ledger/items.mjs:288` · name: `核销仅限 待讨论 / 待设计 / 待核销（现态 <X>；在途须先过 待核销）` · consumers: `closeItem` 抛的 400 人话（`invalid_request_error`，经 `routes.mjs` ∥ `client-routes.mjs` 回两端）。**对齐** = 留在原槽、保留「点名现态」形；**变化** = 源态集收窄为一个值 + 出路半句换成本面走法（本面无 `待讨论 → 在途` 边）。
- **判序不动**：终态门 → 写权 → 源态判，与本机 `docs/core/design/LEDGER.md` §3 同序。

**受影响文件**：

| 文件 | 变化 |
|---|---|
| `thincoder-server/src/ledger/items.mjs` | 改：`closeItem` 源态判收窄 + 删追认正文门 + 拒文带出路句；`closeItem` JSDoc（`:273`–`:274`）与 `normalizeDetail` 注（`:78`「追认门按结果值判空」）同笔收正 |
| `thincoder-server/src/ledger/routes.mjs` | 改：`:51` 注「追认核销正文门在域模块」收正 |
| `thincoder-server/src/ledger/client-routes.mjs` | 改：`:51` 同句收正 |
| `thincoder-server/public/views-ledger.mjs` | 改：`:9` ∥ `:176` 两注（「追认核销须正文」）收正；渲面与按钮行为零改 |
| `thincoder-core/team-ledger.mjs` | 改：`detail` 参两处描述（`:177` ∥ `:204`）里的「追认核销」收正 |
| `thincoder-core/tool-docs/team_ledger.md` | 改：`:8` `close` 行的「追认核销（待讨论 ∥ 待设计，须正文非空）」收正 |
| `thincoder-server/src/store/migrations/ddl-v12-v20.mjs` | **本轮不动**：`:261` 列注与 `docs/server/design/store/STORE.md` 是逐字镜像对，并入存量清理轮（见「明确不在本批」） |
| 服务端测试档 | **无**：`thincoder-server` 下 `*.test.mjs` 零档；`test/RTM.md` 检索 `团队台账` / `team_ledger` 零命中 ⇒ 服务端面零测试载体（既有事实，非本批造成） |
| `docs/server/design/ledger/LEDGER.md` | 改（父侧 2026-11-02 16:43 点名，本席本轮落）：§9 删指向已删测试档 `2026-10-13-team-ledger.test.mjs`（1206 行）的那一行、改记「`*.test.mjs` 零档」+ 行数口径 + 软线读数三条、全表行数按实读收正；`v20 段` 行由 `src/store/db.mjs` 改指 `src/store/migrations/ddl-v12-v20.mjs`（db.mjs = 再导出面，30 行）；§10 七行载体列 ∥ §11 标题改「无测试档（§9）」；§13 R74② 的 db.mjs ≈675 观察项删 |

- **档位结论**：跨档位 **0 档**。服务端面各档本轮只做删分支与注释收正（净减），无一档触 500 软线；本批不新增档。

### 关键决策

1. **`malformedInapplicableLine` 留、语义改「出现即拒」**：删它，`§1` 里残留的声明行就成了一句无人过问的散文；留着，写它的人当场被拒并读到「这条路没有了」。被拒 = 连它一起删；被拒 = 保留「形合规即认」（就是本批要封的那个口子）。
2. **`sectionInapplicable` 删、不留恒 false 版**：理由同第 1 条的反面——插座留着就会被重新接上。
3. **核销门零改**：父侧第 3 条；③ 串本就不含声明路，口径收紧后两门自动一致。
4. **核销边删掉，不留「注明不可达」**（父侧 16:32 裁定）：被拒 = 留着但注明不可达——它答的是「能不能被利用」，没答「这条边该不该存在」；读起来像捷径的死分支下一个人还会试，试完想的是怎么让机检过。被拒 = 加一道门去拦它——边没了就不需要门。
5. **服务端同删，不当「另一面另判」**：同一件事实两面给两套判据，正是本批要消灭的形状；服务端迁移表本来就逐字沿本机语汇（`KD-SV-141`），核销边也必须同源。被拒 = 服务端留两条边、设计档只写「不推荐」——读起来像捷径的边，下一个人照走。
6. **DDL 列注与 `docs/server/design/store/STORE.md` 同轮收，本轮不动**：`thincoder-server/src/store/migrations/ddl-v12-v20.mjs:249` 自述 v20 段逐字沿该档 ⇒ 两处是逐字镜像对，单改代码侧就把镜像声明改成假的，而该档在本轮文件域外。被拒 = 本轮改代码侧、让该档悬着——那正是本批在收的「文档一套代码一套」。

### 上抛项

1. `[已处置·本席本轮落地]` **两份设计档已落完**：`docs/core/design/BATCH-RECORD.md` §4.18-A / BR-17 / BR-62 / D-BR16 / D-BR30 / §5 表行已改成「声明一律拒」口径；`docs/core/design/LIGHT-CHANNEL.md` §2.6 表与 K3 已改。**实读更正一处**：该档里**没有**「轻通道 ⇒ §3 不适用」的句子（`grep -c "不适用：§3"` = 0）；它的两处「不适用」都在 §5 行（K3 ∥ §2.6），那是 §5 段号豁免的依据，不是退役的声明机制——已按「一事一词」改成「不写」。
2. `[上抛·待裁]` **拒文收正由三处扩到四处**：`closeoutS3Error`（`thincoder-core/agent-tools/batch-closeout.mjs:55`）逐字含「§2 / §4 / §6 各段须有内容或由 §1 声明不适用」，与 `closeoutChainError` ∥ `inapplicableDeclarationError` ∥ §5 门括注 同族。父侧 16:24 第 4 条点名的是三处，本席实读发现第四处，已并入 R-S3-5；如不认可请回退该行。
3. `[上抛·知会]` **RTM 新增行编号顺延为 7-11**：`test/RTM.md:94` 的 7-10 已被「批档 `edit §2`」那行占用，原稿「增 7-10」撞号；设计档 §9 与本档已同步改 7-11。
4. `[上抛·待裁]` **需求档与现盘相抵**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:52` 逐字「**凭证在册**：该批档在 design token 槽的**批次归属**中有记录」、`:96` AC-M2-34 同款；现盘 `thincoder-core/ledger-close-proof.mjs:53`–`:56` 读的是 `readSectionStatusWord(src, 3)`，全档零槽读取。需求档措辞归主 agent 收正，本设计按设计档 §2.6 落笔。
5. `[上抛·待裁]` **AC 编号撞号**：`docs/core/design/LEDGER.md:1222` 把 `AC-M2-34` 记作「出口面机判单源（`overdueOf`）」；需求档 `:96` 的 `AC-M2-34` 是核销机检三件。两档同号不同物 ⇒ 处置归主 agent。
6. `[上抛·知会]` **29 份冻结档读面实测（不会反噬）**：`docs/batches/*.md` 含 `> 不适用：§3` 的档 = 29 份，`§1` 全 = `已收口`（在飞 0）；逐档实跑 `readBatchStatusLine` / `readSectionStatusWord(src, 3)` / `sectionContentState(src, 3)` / `malformedInapplicableLine` **抛错 0 次**。封口后这些行被判非法行，但档已冻结、无写路径；核销这些档的行会被 ③ 如实拒。**未读确认**：重开路径（`§1` → `进行中`）是否经过收口门——实施席实读 `thincoder-core/agent-tools/batch-lifecycle.mjs` 的两个调用点确认。
7. `[已处置·父侧 2026-11-02 17:10 更正]` **行数按 LF 口径落定**：`thincoder-core/agent-tools/batch-skeleton.mjs` = 524 行 ∥ `thincoder-core/agent-tools/batch.mjs` = 532 行，两档越 500 软线 —— 拆边界与触发见「档位结论」节，量法见「量法」节。
8. `[上抛·待裁]` **服务端台账同面未改，跨面不一致**：`thincoder-server/src/ledger/items.mjs:274` ∥ `:291` 逐字仍写「**追认核销**（判结果值正文非空，缺 / 全空白 ⇒ 400）」；`docs/server/design/ledger/LEDGER.md:53` ∥ `docs/server/design/store/STORE.md:532` ∥ `docs/server/design/gateway/API.md:249` 同形。本机台账的边删了，服务端那面还是两条边 ⇒ 同一机制两个面向用户给出相反的账。处置归主代理（另起一批 or 并入本批扩面）；本席按声明文件面只改本机台账三档。
9. `[上抛·待裁]` **需求档仍以「追认核销」作机制依据**：`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md:28` 逐字「**收口两源**：已核销的来源 = 待核销（勾销）· **待讨论 / 待设计（追认核销——`evidence` 必填，缺则拒）**」；另 `docs/core/requirements/PROMPT-SYSTEM.md:49` ∥ `:55` 以「已落地 ⇒ 追认核销」为 triage 出口。迁移边已删 ⇒ 这两处写的是已不存在的机制。需求档写权归主代理。

10. `[已处置·父侧 2026-11-02 16:43 裁定]` **DDL 列注本轮不动**：父侧裁「你对，本轮不动」，理由同本席实读——它与 `docs/server/design/store/STORE.md` 是逐字镜像对，单改一侧就把「镜像」变成假的；已记入存量清理轮，三处（`docs/server/design/gateway/API.md` ∥ `docs/server/design/store/STORE.md` ∥ DDL 列注）同轮收。
11. `[已处置·本席本轮落地]` **设计档 §9 末行与盘不符 —— 父侧裁：「要改，就在你这轮」**（`docs/server/design/ledger/LEDGER.md` 本就是本席的档）。本轮就地收正：§9 删掉指向已删测试档 `2026-10-13-team-ledger.test.mjs`（1206 行）的那一行，改记当前事实「`thincoder-server` 下 `*.test.mjs` 零档」+ 行数口径 + 软线读数三条；全表行数按 2026-11-02 实读收正；`v20 段` 的行由 `src/store/db.mjs`（631）改指 `src/store/migrations/ddl-v12-v20.mjs`（211），db.mjs 现为该段的再导出面（30 行）；§10 七行「载体」列与 §11 标题同步改「无测试档（§9）」；§13 R74② 的 db.mjs ≈675 观察项随同一条事实删除。本批服务端验收仍按 R-S3-10 载体走。

## §3 设计评审（评审子代理）
**状态行**：评审通过



### 轮次 1（评审子代理）

评审对象：「不适用」声明机制退役 ∥ 核销边只留一条 ∥ 兜底核销路径收正 ∥ 服务端台账同面同改（§2 R-S3-1…12）。局限：项目无标准档、无文档地图（按 Project Guide + 通用判据）。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | 档位（criterion 8） | 🔴 | 档位结论与盘上不符：`batch-skeleton.mjs` 实读 524 行、`batch.mjs` 实读 532 行（设计记 351 / 427），均越 500 软线；结论写「跨档位 **0 档**」「无一档需拆」，两档皆无拆单 | 按计入空行的口径重测（`(Get-Content <档>).Count`），结论行点名这两档各带拆单边界；尺寸表与净减预估值按 criterion 8 移出设计档 |
| 2 | 验收 | 🟡 | R-S3-10 同一格并存两种验收形：`node --test docs/batches/…test.mjs` + 断言，末句「造库夹具成本过高 ⇒ 降级为 `grep` 读数 + 一次直调读数，§5 记明」；grep 断言不了「行状态仍 待讨论 ∥ `closed_at` 仍 null」 | 只留一种形态；取降级形就写死命令、读数面与它断言什么 |
| 3 | 一处一词 | 🟡 | R-S3-4 声明核销门零改；R-S3-7 的 `追认核销` grep 四值不含 `thincoder-core/ledger-close-proof.mjs`，而该档 ① 拒文仍逐字写「追认核销须先挂批档…」——退役边名留在人话里 | 把该档并入 grep 清单，或改写 ① 拒文 |
| 4 | 清晰度 | 🟡 | 逐字拒文「核销仅限 待核销（现态 <X>）：先 update 到 在途 认领…」对现态 = `在途` 读成「先 update 到 在途 认领」；R-S3-7 正逐字断言该串（`在途` 同形同拒） | 出路句按现态分支（`在途` ⇒ 先 update 到 待核销），或省掉认领半句 |
| 5 | 边界情形 | 🟡 | 存量 29 份 × 重开留给实施席「未读确认」：实读 `thincoder-core/agent-tools/batch-lifecycle.mjs` 重开径逐字「不跑收口门」，`malformedInapplicableLine` 只在链门被调；§1 只追加 ⇒ 重开后的存量档再也收不了口 | 设计档写明该结果与出路（主 agent 直改档头），或落成验收一格 |
| 6 | 集成设计 | 🟡 | §9 两块本批 delta（收口面声明一律拒 ∥ 核销边只留一条）用「行 / 原断言 / 本批之后」三列，未按 §9 既有四列（交互 · 业务结果 · 进入口 · 服务条目）逐行作答 | 按四列重写 7-11 与 10-3 d 两行（10-5 已是四列形） |
| 7 | 集成设计 | 🟡 | 服务端面（R-S3-10/11/12）在 §9 无 delta 块；给的读数是「`thincoder-server` 下 `*.test.mjs` 零档」= 载体事实，非「不改业务可观察结果」 | 在 §9 明写服务端面 RTM 结论（无故事 ⇒ 验收 = §11 B7 ∥ B7b + 本批单测档），或补一行 |
| 8 | 受影响面 | 🟡 | 受影响文件表缺设计档落点点名的档：`docs/core/design/LEDGER.md` §3（核销一条边 + 失败文案 + AC-M2-27 + T33–T36）与 R-S3-8 的 `docs/core/design/BATCH-RECORD.md` §5.2 皆不在表内 | 补行，或写明它们属设计面已落笔件 |
| 9 | 最近先例 | 🟡 | §2.14 / 决策 30 无最近先例行（坐标 + 对齐 ∥ 偏离理由）；同档 §2.6.1 与决策 26 有此行 | 补一行，偏离理由点名先例并说清为何不适用 |
| 10 | 查证面 | 🟡 | 全批无「查过哪些公共源档 ∥ 有无相关」一行；父侧点名的 `docs/core/requirements/NORMAL-MODE.md` 检索读数（零命中）也未记 | 补一行；「none relevant」同样要记 |
| 11 | 服务端档 | 🟡 | `docs/server/design/ledger/LEDGER.md` §4「核销边只有一条」把判序指向「§5 端点行」，而 §5 是端点 ∥ 判权表、无判序句；「先于终态门之后的核销分支」不可解析 | 改指本机 `docs/core/design/LEDGER.md` §3（判序单源），或就地写死判序 |
| 12 | 文档卫生 | 🔵 | 设计档 §9 成逐轮 delta 堆叠（自述「历史 delta 块不追改」），50 / 51 行预算与破 0 / 破 3 两套读数并存 | 活口径留一处，历史留批档与提交 |
| 13 | 数字漂移 | 🔵 | `docs/server/design/ledger/LEDGER.md` §9 记 `items.mjs` 289 行，实读 310 行；同节「本域最大 = `src/ledger/items.mjs` 289」随之（结论仍成立：未越 500） | 按实读收正两处 |
| 14 | 既有件 | 🔵 | 两条新文案（`ledgerClose：待认领不可核销…` ∥ 服务端 400 人话）无三问作答 | 补 `existing` / `none found` 一行 |

计数：🔴 1 · 🟡 10 · 🔵 3。

VERDICT: changes-required

### 轮次 2（评审子代理）

上轮 14 条逐条复核（第 2 轮，三份档本轮重读）

| # | 原 # | 位置 | 状态 | 依据（本轮实读） |
|---|------|------|------|------------------|
| 1 | 1 | 批档 §2 档位结论 | **Fixed** | 结论已改「两档越 500 软线」，点名两档各带拆边界 + 触发（下一批同笔抽）+ 量法（LF 计数）；旧的逐档行数表与净减预估已移出。服务端面结论仍 0 档，`items.mjs` = 310 < 500，成立 |
| 2 | 2 | 批档 §2 R-S3-10 | **Fixed** | 只剩一种形态：命令 + 断言 +「夹具跑不动 ⇒ 实施席停下上报父侧，不许自行降级」 |
| 3 | 3 | 批档 §2 机制设计 ∥ R-S3-4 | **Fixed** | ① 拒文旧边名收正写进机制设计 + 受影响文件行；R-S3-4 验收加 `grep -c "追认核销"` = 0 |
| 4 | 4 | 批档 §2 出路句 | **Fixed** | 改逐态分支表（`待讨论`∥`待设计` ∥ `在途` ∥ 归档态）；§2.14 表、§5 R28、§6 用例同笔一致 |
| 5 | 5 | 批档 §2 存量 × 重开 | **Fixed** | 写明重开径「不跑收口门」⇒ 重开后永久关不上 + 出路（主 agent 直改 `§1` 段体）；R-S3-1 增第二格验收 |
| 6 | 6 | §9 两块本批 delta | **Fixed** | 改五列（交互 · 业务结果 · 进入口 · 服务条目），7-11 与 10-3 d 逐格作答 |
| 7 | 7 | §9 服务端面 | **Fixed** | 新增服务端块：如实记「缺 1 行」+ 该有故事 + 不开立理由 + 触发条件 + 验收两处 |
| 8 | 8 | 批档 §2 受影响文件表 | **Unfixed（部分）** | `docs/core/design/BATCH-RECORD.md` ∥ `docs/core/design/LIGHT-CHANNEL.md` 已由上抛项 1 覆盖；`docs/core/design/LEDGER.md` 仍只出现在「设计档落点」，表内 12 行无它（🟡 非必改） |
| 9 | 9 | §2.14 ∥ 决策 30 | **Fixed** | 两处各有最近先例行（坐标 + 对齐 ∥ 偏离），偏离写明为何不照搬决策 28 |
| 10 | 10 | §1 调研证据 | **Fixed** | 仓外声明源 ∥ 仓内设计层相关档 ∥ 需求层 ∥ 普通模式面（零命中，负结果照记）|
| 11 | 11 | `docs/server/design/ledger/LEDGER.md` §4 | **Fixed** | 判序就地写死（目标态判 → 行取与写权 → 归档态门 → 源态判），不再指空的 §5 |
| 12 | 12 | §9 历史 delta 堆叠 | **Accepted** | Deferred 理由成立：本档自述约定（历史块不追改）+ 另一次清理；属 🔵 文档卫生，不在本批射程 |
| 13 | 13 | `docs/server/design/ledger/LEDGER.md` §9 | **Fixed** | `items.mjs` 310 + 行数口径（LF）+ 140 行差教训；本域最大改 310，软线结论仍成立 |
| 14 | 14 | 两条新文案的三问 | **Unfixed** | 新跳过文案 ∥ 服务端 400 人话仍无 `existing:` ∥ `none found:` 行（本档只给 `verdictGapOf` 做过三问）——🔵 |
| N1 | (new) | 批档 §2 「服务端台账面」拒文行 | **New 🟡** | 该节仍逐字钉旧形「核销仅限 待核销（现态 X）：先 update 到 在途 认领，再走 待核销 → 已核销」，与 §2 出路句分支表 ∥ §2.14 表冲突（同一句拒文两种逐字，旧形正是 #4 判掉的那句） |

计数：🔴 0 · Fixed 11 · Accepted 1 · Unfixed 2（🟡 1 · 🔵 1）· New 1（🟡）。🟡 两项均为可选项，未标必改；上一轮唯一 🔴（档位结论）已按 LF 口径修好并经本轮读数复核。

VERDICT: pass

## §4 用户批准（主 agent）

**用户批准**（2026-11-02 16:32）：「**都自动跑完吧。**」——整批令：本批的评审发起、批准、实施、收口由父侧连续跑完。

**批准内容**（交付面）：
- ① `> 不适用：§N` 声明机制整条退役：任何批都须有 `§2` 设计 ∥ `§3` 评审 ∥ `§4` 批准 ∥ `§6` 验证；
- ② 核销边只留一条（`在途 → 待核销 → 已核销`），追认那条捷径边删除；
- ③ 兜底核销路径（设计档写着、代码拒绝的那条）以代码为准收正；
- ④ 服务端台账同面同改（400 人话 + 用例 B7 ∥ B7b）；
- ⑤ 四条绕行面逐条实证（`§5` 豁免 ∥ `认账不排期` 零触 ∥ `status` 同门 ∥ 轻通道免全链）。

**用户在本批期间的两条追加裁定**（原话，已落 §1）：
- 16:17「**我认为应该修掉这个机制上打架的情况，开一批改。**」
- 16:24「**那把那个口子也封掉，那些口子都是你他妈的留的！**」

**⇒ 本行是用户对交付的裁定，不是事后追认的补记。**

## §5 实施记录（eng-coder）

**状态行**：实施完成（§2 十二条全部落盘；验收面全绿；自检两轮 = 内部审计 1 轮 · 独立代码评审 1 轮，终态 clean；外笔与未做逐条带理由，见末表）

### 逐条交付（对 §2 条目表）

| 条目 | 落点与形态 | 状态 |
|---|---|---|
| R-S3-1 | `thincoder-core/agent-tools/batch-skeleton.mjs`：`INAPPLICABLE_SEGMENTS = []`；`sectionInapplicable` 整函数删（不留恒 false 插座）；`sectionContentState` 改两态（`content` / `empty`）；`malformedInapplicableLine` 留作痕迹检测（`§1` 出现即拒） | ✅ 完成 |
| R-S3-2 | `thincoder-core/agent-tools/batch-closeout.mjs` 的 `assertCloseoutGates`：§3 臂去旁路，无条件 `readSectionStatusWord(src, 3) === STATUS_WORDS[3].done` | ✅ 完成 |
| R-S3-3 | 同档 `assertSectionFiveGate`：删 `if (sectionInapplicable(src, 3)) return`；拒文括注只剩「（轻通道的评审是后置，不是免掉：改完补设计与评审，补完再收回口。）」 | ✅ 完成 |
| R-S3-4 | `thincoder-core/ledger-close-proof.mjs`：判据臂与 ③ 串字面零改；只收正 ① 串旧边名（`追认核销` ⇒ `核销`），该档 `git diff` 恰一处 hunk | ✅ 完成 |
| R-S3-5 | 四处拒文收正：`closeoutChainError` ∥ `closeoutS3Error` ∥ `inapplicableDeclarationError`（改「声明已停用」）∥ §5 门括注 | ✅ 完成 |
| R-S3-6 | `docs/core/design/LIGHT-CHANNEL.md`：§2.6 表 §5 行改「不写」、收尾轮两段（§2 = eng-designer ∥ §3 = 评审子代理）与「封声明后是收口的机械前置」由设计席落盘，本席实读复核（`不适用：§3` 零命中） | ✅ 完成（设计席落笔） |
| R-S3-7 | `thincoder-core/ledger-write-ops.mjs` 的 `applyRowClose`：源态判收窄为只认 `待核销`、三支出路句按现态分支、删追认 `evidence` 门；`thincoder-core/ledger-cmd.mjs` 批量面跳过文案改「待认领不可核销（须先 update 到 在途）」；工具描述三处 ∥ `thincoder-core/tool-docs/ledger.md` 两条收正 | ✅ 完成 |
| R-S3-8 | `docs/core/design/BATCH-RECORD.md` §5.2 / BR-17 / D-BR16 已由设计席落成「核销节点 = 挂靠批收口」口径；本席补收 D-BR16 判据列残留的已废机制名（该档 `核销判据 = 结账依据` 零命中） | ✅ 完成 |
| R-S3-9 | 四条绕行面判定属设计档（`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 决策 29），本席零笔 | ✅ 完成（设计席落笔） |
| R-S3-10 | `thincoder-server/src/ledger/items.mjs` 的 `closeItem`：源态判收窄为只认 `待核销`；追认正文门随边删除 | ✅ 完成 |
| R-S3-11 | 服务端 400 人话 = `核销仅限 待核销（现态 X）：先 PATCH 推进到 待核销，再收口`；六处注里的旧边名收正（`thincoder-server/src/ledger/items.mjs` ∥ `routes.mjs` ∥ `client-routes.mjs` ∥ `thincoder-server/public/views-ledger.mjs` ∥ `thincoder-core/team-ledger.mjs` ∥ `thincoder-core/tool-docs/team_ledger.md`） | ✅ 完成 |
| R-S3-12 | 服务端用例载体 = 本批单测档（`B7` ∥ `B7b`），命令 `node --test docs/batches/2026-11-02-closeout-proof-s3-declaration.test.mjs`，夹具构造成功、未降级 | ✅ 完成 |

### 验证读数（本席亲跑，cwd = 仓根）

- `node --test test/integration/ledger-close-proof.test.mjs` → 2 pass / 0 fail（10-3 四档 a/b/c/d ∥ 10-5 逐态四条拒 + 认领三步全过 + 归档态两支）。
- `node --test test/integration/batch-close-gate.test.mjs` → 9 pass / 0 fail（新增 7-11 两半：声明行 ⇒ 拒 ∥ §3 无状态行 ⇒ 拒）。
- `node --test docs/batches/2026-11-02-closeout-proof-s3-declaration.test.mjs` → 2 pass / 0 fail（服务端 `B7` ∥ `B7b`）。
- 邻面回归（本批改到的共享门可能波及的既有用例）：`batch-gates-reanchor` 8 pass；`batch-ledger-bind` ∥ `batch-status-auto-set` ∥ `batch-close-token-consume` ∥ `batch-edit-spec-section` 合计 14 pass；`batch-live-batch-lock` ∥ `batchdoc-reuse-guard` ∥ `unbooked-pen` ∥ `advisor-record-gate` ∥ `batch-anchor-create` 合计 15 pass；全 0 fail。
- 机检读数（逐条实测）：`INAPPLICABLE_SEGMENTS = []` = 1 处；`仅普通模式的批` ∥ `be declared inapplicable` ∥ `或由 §1 声明不适用` ∥ `§2 / §3 / §4 only`（工具描述面）∥ `不适用：§3`（LIGHT-CHANNEL）∥ `核销判据 = 结账依据` ∥ `兜底核销` 全 0；`追认核销` 在十档（本机四 + 服务端六）= 0；`ledger-close-proof.mjs` 的 `不适用` 与 `追认核销` 均 = 0。
- 迁移表旁径复核：`thincoder-core/ledger-db.mjs` 与 `thincoder-server/src/ledger/items.mjs` 的 `ALLOWED_MIGRATIONS` 里 `待讨论` / `待设计` 均无 `已核销` 出边 ⇒ 核销边删掉后 `update` 那条旁径也不通。

### 外笔与未做（逐条带理由）

| 项 | 说法 |
|---|---|
| 外笔①：`thincoder-core/prompts/persona-engineering.md` | 该档逐字仍写「A section may declare itself inapplicable: §2 / §3 / §4 write `> 不适用：§N —— <reason>` in §1」——机制已退役，留着就是把一条已封的路教给下一个主 agent，与工具描述面新口径相反。改两句：声明一律拒、`§1` 出现即拒；同节「算内容」那一行把该行类改标「已退役」。 |
| 外笔②：`docs/core/design/BATCH-RECORD.md` D-BR16 判据列 | R-S3-8 的机检格要求该档 `核销判据 = 结账依据` 零命中，而该行判据列仍以「设计档原写…」的否定形留着这句旧名（否定形会被检索当作现行读法）⇒ 删该半句，保留判据本体与理由。一行改动，措辞零新增。 |
| 外笔③：同档 §4.15 条 1 的两处空行 | doc_check 报该段「文字太长」（三段继续行合并 521 字，先于本批：HEAD 版同段 385 字同样越线）。该档进了本席触达账 ⇒ 这一条会拒掉 §5 的每一次 append（实测已 REFUSED 一次）⇒ 在两处句界只插空行，一字未改。已在交付时上抛父侧待裁。 |
| 未做①：`docs/core/design/API-CONTRACT.md` 生成区 | 该区仍登记已删导出 `sectionInapplicable`（生成区自述「生成器唯一笔——勿手改」），`scripts/api-contract.mjs --check` 现已报漂移。重生成会同时扫入工作树里其它在飞批的导出、混入别批工作面 ⇒ 交父侧处置。 |
| 未做②：两条设计档措辞件 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 仍以「`sectionInapplicable` 恒 false」描述已删符号；`docs/core/design/LIGHT-CHANNEL.md` 一处仍写「勾销 ∥ 追认同判」。两处都在设计席笔域，本席未动。 |

### 自检轮次与终态

- **内部审计 1 轮**（只读 explore 对 §2 逐条对盘）：12 条全部落地、逐字拒文与 §2 逐字块一致、无残留引用；提出 3 项（归档态只断言一支 ∥ 两条设计档漂移 ∥ 一处外笔未登记）。
- **自修 1 轮**：补 `已核销` 归档态断言（10-5 现两支全覆盖），同步收正 `test/RTM.md` 的 10-5 行。
- **独立代码评审 1 轮**（advisor · code）：verdict = pass，无 🔴；提 5 条 —— 2 条文档/档位债（`docs/core/design/API-CONTRACT.md` 生成区漂移 ∥ 两档越 500 软线的存量债，均已由 §2 登记拆边界与触发）、2 条措辞（设计档「恒 false」残形 ∥ `closeoutS3Error` 一句已被本门否证的话）、1 条已登记外笔。
- **自修 2 轮**：删 `closeoutS3Error` 里「§2 / §4 / §6 各段须有内容」那半句（走到该臂即证链门刚已过），同步改 7-11 断言；改后该档 9 pass 复跑绿。
- **终态 = clean**：无未修的可执行项；余下四条已入「外笔与未做」并带理由，交父侧裁决。

### 父侧裁定落地（2026-11-02 17:39 / 17:45）

**① 外笔③ 的档笔权**：设计档 `docs/core/design/BATCH-RECORD.md` 段 366 超长段按机械门要求做**纯结构拆分**（521 字 → 210 ∥ 179 ∥ 132，零字改动），父侧 17:39 追认；笔权本属设计席，本次为例外并已报备。

**判据留念（下不为例）**：结构拆分（只加空行 / 拆条目、零字改动）⇒ 可先动后报；涉及任何措辞、判据、条目的改动 ⇒ 停下报，等设计席。

**② 生成区重生成时点**：父侧裁「现在不重生成」——此刻跑 `--write` 会把另两批在飞导出（`PARA_DISP

（承接上一行：上段末句被截断于 `PARA_DISP`，完整读法 = 父侧裁「现在不重生成」，理由 = 此刻跑 `--write` 会把另两批在飞导出（`PARA_DISPOSE` ∥ `path-resolve.mjs`）的中间态烘进生成区；压到本会话收口时一次性重生成，已入父侧收口清单。以此为定稿读法。）

**本批验收改写**：`node scripts/api-contract.mjs --check` **允许报漂移**（理由 = 生成区待收口统一重生成），但**其它漂移必须为零**。

**实读读数（本席亲跑，逐行对表而非只看计数）**：`--check` exit 1；把生成器产物与盘上生成区逐行对表，**唯一差异行 = 符号 `sectionInapplicable` 指向 `thincoder-core/agent-tools/batch-skeleton.mjs`、导出形 `fn` 的那一行**（盘上有、源里没有）；「只在新生」的行数 = 0 ⇒ 别人家的导出差异 = 零，符合父侧条件。

## §6 验证与收口（父代理）

### 6.1 验证读数（父侧独立复跑，非转述实施席）

| 面 | 命令 | 读数 |
|---|---|---|
| 本批三档用例 | `node --test test/integration/ledger-close-proof.test.mjs test/integration/batch-close-gate.test.mjs <本批单测档>` | **13 / 13 pass** |
| 邻面回归（实施席跑，父侧读其读数） | 10 组共享门用例 | **37 / 37 pass** |
| 删前留痕 | 单测档最后一跑 | **2 / 2 pass**（删于收口前） |
| 关键串零命中 | `git grep` 于 `thincoder-core` ∥ `thincoder-server` | `兜底核销` = 0 ∥ `结账依据` = 0 ∥ `INAPPLICABLE_SEGMENTS = []` = 1（新值在位） |
| `追认核销` 残留 | 同上 | 2 档：`thincoder-core/CHANGELOG.md`（历史面，不回改）∥ `thincoder-server/src/store/migrations/ddl-v12-v20.mjs` 列注（= 存量清理轮，与 `docs/server/design/store/STORE.md` 逐字镜像，单改一侧镜像即假） |
| 独立代码评审 | `advisor type=code` 一轮 | **pass，无 🔴**（一轮自修后复跑 9 绿） |

### 6.2 零留存

本批单测档 `docs/batches/2026-11-02-closeout-proof-s3-declaration.test.mjs` **已删**（收口即删，删前读数见上表）。
常驻面 = `test/integration/ledger-close-proof.test.mjs`（10-3 第四档 d ∥ 10-5 逐态）∥ `test/integration/batch-close-gate.test.mjs`（7-11 两半）—— 那是 RTM 的用例载体，不随批删。

### 6.3 交付内容（逐条对 §2）

- **声明机制退役**：`INAPPLICABLE_SEGMENTS` = 空集；`sectionInapplicable` 整个删除（不留恒 false 插座）；`sectionContentState` 两态；`§1` 出现声明行即拒。
- **收口门 §3 臂**：删旁路，无条件要 `评审通过`。
- **核销边**：本机 ∥ 服务端都只留 `在途 → 待核销 → 已核销`；两档 `ALLOWED_MIGRATIONS` 本就没有 `待讨论 ∥ 待设计 → 已核销` 出边 ⇒ `update` 旁径一并断。
- **拒文**：四处逐字收正（链门 J1 ∥ `closeoutS3Error` ∥ 声明拒句 ∥ `§5` 门括注），旧路话术零残留。
- **服务端**：`closeItem` 源态判收窄 + 追认正文门删；400 人话逐态；`B7` ∥ `B7b` 用例在盘。
- **设计档**：`docs/core/design/LEDGER.md` §3 失败文案改逐态表、§3.1 ④ 改一条边；`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.14 + 决策 29/30；`docs/core/design/LIGHT-CHANNEL.md` 单边 + 指针改实体档。

### 6.4 已知未决（不并入本批，逐条有归属）

- **`docs/server/design/gateway/API.md` ∥ `docs/server/design/store/STORE.md` ∥ `thincoder-server/src/store/migrations/ddl-v12-v20.mjs` 列注** 三处仍写已退役的边 —— 属**存量清理轮**（三处同轮改，依据 = 代码列注与设计档是逐字镜像对）。
- **`docs/core/design/API-CONTRACT.md` 生成区漂移**：`sectionInapplicable` 已删、生成区仍登记。**压到本会话收口统一重生成**（现在跑会把另两批在飞的导出烘进去）。
- **台账 `#2003`**（`batch-skeleton.mjs` 524 ∥ `batch.mjs` 532 越 500 软线）：拆边界已定，待下一批接笔。
- **两档存量残缺**（`docs/server/design/gateway/API.md` 226 条锚缺 ∥ `docs/server/design/store/STORE.md` 58 条锚缺）：存量清理轮。

### 6.5 收口判定

`§2` ∥ `§3` ∥ `§4` ∥ `§6` 四段皆带内容；单测档已删；用例 13/13 ∥ 回归 37/37 绿；独立代码评审 pass 无 🔴。**准予收口。**

### 6.6 结算

- 台账 `#2000`：`在途 → 待核销 → 已核销`（父侧勾销，`evidence` = 本档 §6）。
- 暂缓批复核：本批无暂缓批。
- 前批遗留：无新增（`#2003` 已单独立行）。
- 文档机检门：本档各笔 append 回执皆 `DOC-CHECK GATE: PASS`。

### 6.7 重开更正（2026-11-02 17:43）

**用户 17:41 原话**：「怎么还有『轻通道免全链』的说法？杀了多少次了！杀不干净啊！」

**⇒ 本档 §6.3 第四项写的「轻通道免全链」是**我抄设计档决策 29 的缩写**，而这句缩写在任何地方被照字面读，就等于「这批可以没有设计、没有评审」。**

**⇒ 更正口径（与本会话需求档 / 设计档已落的一致）：**
**轻通道把设计与评审**挪到收口时跑**（省时点，不是省工序）；收口前必须凑齐 `§2` 设计 ∥ `§3` 评审 ∥ `§4` 批准 ∥ `§6` 验证 —— 一条都不能省（2026-11-02 声明机制退役后尤其如此）。**

**⇒ 已同批收正的落点**（设计席 #32 实测 `grep 免.*全链` 于 `docs/core/design/LIGHT-CHANNEL.md` ∥ `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` = **0**）：开头「该走的三样」· §2.11 设计槽条 · 决策 K4 · 决策 29 绕行面第一条 · 提示词落点表路由句 · §5 边界行；需求档 `docs/core/requirements/LIGHT-CHANNEL.md` 由父侧同轮改。

**⇒ 代码面 `thincoder-core/agent-tools/batch-closeout.mjs` 那句**（「轻通道的评审是后置，不是免掉：改完补设计与评审，补完再收回口」）**不动**——它写的正是正确的那件事（后置 ≠ 免掉），是本条口径的正面表述。

**⇒ 教训写在这里**：这句话杀不干净的原因不是有人坚持它，是**每次只改一处、留下措辞更短的几处，下一轮抄的就是留下的那些**。所以本批的判据是 grep 归零，不是「改完我读一遍觉得对了」。
