# eng-designer 角色 + 行为纪律 · 批次记录（2026-09-10）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（目标态 eng-designer；落地期主 agent 代写）·
> §3 设计评审 · §4 用户批准 · §5 实施记录 · §6 验证与收口。
> 不是规格：需求在 `requirements/` 成文；整批做完整档冻结。机制与模板见 `requirements/ENGINEERING-MODE.md` §1.12。

---

## §1 讨论（主 agent）

### 批次范围

**第 2 批 = A + B**（用户 2026-09-10 裁定"可以"）：
- **A：eng-designer 角色落地**——FR9 九条裁定（角色三段链）+ FR19 产出要求落 CLI 端（角色枚举/新槽文件/装配矩阵/写稿面权限/spawn 同门/任务书写法）
- **B：行为纪律（提示词层）**——FR16 六段自写·一段一作者 · FR20 #9 执行者拒收 · FR17 铁律 #3/#4

### 谈成什么（逐条）

1. **第 2 批范围裁定**（用户）：A+B 同批——**互为前提**（角色落地才有"写稿面"，六段 §2 才有主；光落角色不带纪律，它不知道要写 §2），拆开做两批皆半成品。
2. **C 单列**（advisor 写批次档 §3 权限）：动的是**只读评审模型**（安全侧），混入角色批会让评审面失控；过渡期由父侧代写 §3 已被第 1 批实证可用。
3. **D 单列**（FR18 需求池指针化）：小，可随时插队。
4. **E 单列**（可移植性 FR10–FR15）：横切面，与角色机制无耦合。
5. **批次档独立**：第 1 批档（`2026-09-10-ENGINEERING-MODE.md`）已闭合冻结，本批另开本档（第 1 批六段走通即首例）。

### 对账结果

本批需求**已在需求档收口**（无需重新讨论）——来源：
- §1.5 **FR9 九条裁定**（角色重定义：主 agent = 产品经理会话面 / eng-designer = 写稿面 / eng-coder = 实现）——**待设计**
- §1.8 **eng-designer 工作流**（授权范围 / 五步 / 失败路径 / 纪律 / spawn 一批次一次 / 验收口径规则进提示词 / 产出两件 + 八维判据）
- **FR16**（批次记录机制——**行为面**：六段自写、一段一作者、随件传递）
- **FR17 铁律 #3/#4**（澄清必经主 agent / 三方条目一致）与 **#5 行为面**
- **FR20 #9 行为面**（执行者拒收：查不到任务书就不执行、打回）
- **FR19**（设计要求：批次任务独立成件 + 设计档 8 项 + 八维判据）

**对账发现（两处——一处已由裁定回答，一处需用户裁）**：

1. **提示词文件的写权 vs 产品代码门禁（已裁——2026-09-10）**：§1.5 #8 vs FR1 的张力，**用户裁定 = (b)**——
   **提示词保持产品代码**（门禁不动；豁免等于把纪律面移出设计门禁——而本批重构的正是它），
   **主 agent 的“编写权” = 内容权**（逐字文本由它定，属设计的一部分），**落笔走 eng-coder**。
   已写入需求档 §1.5 #8 注。
2. **设计者的写域**（已由 §1.5 #8 回答）：提示词文件不归设计者——故 eng-designer 的写域 = `docs/**` **扣除** `docs/design/prompts/`
   （中文权威模板也是提示词文件）；需求档/设计档/批次档 §2/TODO 归它。

### 本批需求清单（回读给用户 → 用户确认）

| # | 需求点 | 归属 | 状态 |
|---|---|---|---|
| 1 | FR9 九条裁定落地（eng-designer 角色：枚举/装配/权限/同门门禁） | §1.5 | 待设计 |
| 2 | FR19 产出要求（批次任务独立成件 + 设计档 8 项 + 八维判据） | §1.8 | 待设计 |
| 3 | FR16 行为面（六段自写 · 一段一作者 · 随件传递） | §1.12 | 待设计 |
| 4 | FR20 #9 行为面（执行者拒收，查不到任务书不执行） | §1.14 | 待设计 |
| 5 | FR17 铁律 #3/#4（澄清必经主 agent · 三方条目一致） | §1.11 | 待设计 |

> 说明：本批**只落 CLI 端**（用户第 1 批指令：仅 CLI；VSC 镜像延后）。

### todo 项（提交 designer 时必须带上）

= 上表 5 条（主 agent 记录；**维护归 eng-designer**——本批落地后由其接管；过渡期主 agent 代维护）。
**补充 2026-09-10 晚**：+3 项（写权路由 / 文档更新纪律 FR21 / 核销同步清单 + 机械校验 V1-V2）——见文末「范围追加」节；**合计 8 条**。

### 状态

**已收口 2026-09-10**（用户确认第 2 批范围；需求层已在需求档收口）。下一步 = **设计**（第 2 批设计落 `docs/design/ENGINEERING-MODE.md`）。

### 范围追加（2026-09-10 晚——用户裁定，同一批；**本批需求实计 8 条 = 上表 5 条 + 本节 3 项**）

设计评审轮次 2 后追加三件（不得单列）：

1. **写权路由落地**（用户：**“主代理负责的是批次档，设计档由 designer 负责。”**）——设计档归 eng-designer（含修订），
   主 agent 只管批次档；调用链（批次讨论收口 → spawn eng-designer）同批成文（设计 §2.15 A2；需求 §1.5 #10）。
2. **文档更新纪律**（用户：“你根本没想过更新文档的复杂度，随便写要不了几下就把文档体系搞乱了。”）——
   七条纪律（写权矩阵 / 单一权威源 / 计数枚举 / 指针 / 冻结窗口 / 回读核对 / 变更留痕 + 核销同步）
   → 需求 §1.15 · 设计 §2.19（本批落地）。
3. **核销同步清单**（批次档 §6 模板新槽位，需求 §1.12）+ **机械校验最小集**（V1 段引用可解析 / V2 计数与列表一致——
   `scripts/check-doc-width.mjs` 扩扫 + 新增 `test/doc-consistency.test.mjs`）——本批一并落。

> 踩坑记录·第四条（源于本轮实操）：**编辑吻标题**——本会话已两次（§2.14 插入吞 §3 标题、§2.19 插入又吞 §3.1 标题）。
> 教训：插节时 old_string 必须回带被替换的标题；与“回读核对”同源（已升为纪律 D6）。


---

## §2 批次任务（写手：目标态 eng-designer；A6 落地期 = 主 agent 代写）

> **本节即 eng-coder 的任务书**（用户裁定——不另派生副本；spawn 传本节路径 + `batchDoc` 参数）。
> 写手：目标态 = **eng-designer 自写**；**落地注记（A6）**：eng-designer 尚未落地 → **本节由主 agent 代写**。
> 状态：**已就绪 2026-09-10**（设计评审轮次 4 pass + 用户批准）。

### 本批覆盖的需求条目

| 需求 | 本批落地面 |
|---|---|
| **FR9 九条裁定** | 角色注册五处 + 模式门 + A2 写权路由 + 主 agent 人格改述（#1/#2/#3/#4/#6/#7/#8 落 · #5 纪律告知 · #9 部分——逐条状态表见设计 §2.15） |
| **FR19 设计要求** | persona-eng-designer 必含产出要素（产出两件 + 设计档 8 项 + 判定句 + 打回链） |
| **FR16 行为面** | 六段自写 · 一段一作者 · 随件传递（batchDoc 已由第 1 批落地） |
| **FR17 铁律 #3/#4** | 澄清必经主 agent · 三方条目一致（纪律层句） |
| **FR20 #9 行为面** | 执行者拒收（coder 找不到 §2 / designer 找不到 §1 → 不执行、打回） |
| **FR21 文档更新纪律** | D1-D7 七条 + 机械校验 V1/V2 + 核销同步清单槽位 |

### 明确不在本批

C（advisor 写 §3 权限）· D（FR18 需求池指针化）· E（可移植性 FR10–FR15）· **VSC 镜像**（仅 CLI）· 勘察预算的机械门禁（提示词级）。

### 受影响文件（带行数——详见设计档 §2.18）

源/测试（as-of 行数 + 档位结论）：`src/agent-tools/subagent.mjs`(395) · `src/agent-tools/subagent-spawn.mjs`(444) · `src/agent/spawn-child.mjs`(218) ·
`src/agent/setup.mjs`(343) · `src/prompt-overlays.mjs`(81) · `src/tui/cmd-submodel.mjs`(155) · `src/tui/slash-commands.mjs`(187) ·
`src/tui/subagent-blocks.mjs`(451) · `src/tui/tool-args.mjs`(82) · `scripts/check-doc-width.mjs`(51)；
**新增**：`test/eng-designer-role.test.mjs` · `test/doc-consistency.test.mjs` · `test/fixtures/doc-consistency-baseline.json`；
修改测试：`test/prompts-async-guidance.test.mjs`(417) · `test/batch-doc-gate.test.mjs`(160)；
提示词（双源）：`src/prompts/persona-eng-designer.md`（新）· `docs/design/prompts/persona-eng-designer.md`（新）· `discipline-engineering.md`(196/124) ·
`persona-eng-coder.md`(30/30) · `persona-engineering.md`(40/40)；
文档登记：`docs/requirements/PROMPT-SYSTEM.md` · `docs/design/AGENT-LOOP.md` · `AGENTS.md`。

> **父侧预落项（不必重做，只需核）**：`docs/README.md`（§1 目录行 + §3.1 作者表 + 勾销句——评审处置时已改）。

### 验收标准（逐步回指需求）

**引用设计档 §3.1 AC16–AC28 全文**（不重抄——单一权威源 D2）：AC16 角色注册五处/模式门 · AC17 装配不静默回退 + 接线断言 ·
AC18 batchDoc 同门 · AC19 写域=提示词级 · AC20 勘察变体 explore-only + 无 token · AC21 新槽双源 + NEW_PROMPTS · AC22 锚家族三组十句 ·
AC23 主 agent 人格改述 · AC24 撤销“主会话即 designer” · AC25 FR19 固定子串 · AC26 保留人工 ask · AC27/AC27b 写权六面 · AC28 文档一致性 V1/V2。
**用例**：设计档 §3.2 T30–T42（正常 / 边界 / 错误三态齐备）。

### 任务书就绪

本节即任务书（spawn 传路径 + `batchDoc` 参数）；`files` 声明照需求 §1.11 B3（不声明 `docs/TODO.md`）。

## §3 设计评审（评审子代理自写；本批代写落档——advisor 自写机制未落地）

- **轮次 1**：changes-required——1🔴（§2.14 受影响文件表缺失）+ 7🟡 + 2🔵；用户裁定全部照办。
- **轮次 2**：changes-required——1🔴（写权路由未闭环）+ 5🟡 + 3🔵；用户裁定：**“主代理负责的是批次档，设计档由 designer 负责。”**
- **轮次 3**：changes-required——2🔴（写权路由只闭环一半 + README 冲突未纳入）+ 9🟡 + 3🔵；用户裁定：**“勾销这些都应该在批次档做，不是设计档。”**
- **轮次 4**：**pass**（0 🔴；11🟡 + 5🔵 advisory 已逐条处置）。

## §4 用户批准（主 agent 记）

- **已批准 2026-09-10**（轮次 4 pass 后显式“批准”）——解锁 eng-coder 实施（本批范围 = 第 2 批 CLI：eng-designer 角色 + 行为纪律 + 文档更新纪律）。

## §5 实施记录（写手：目标态 eng-coder 自写；本批 = 交付报告 + 父侧代写落档）

### 交付摘要（eng-coder 报告，2026-09-10）

- **终态：clean**（内部审计 1 轮——PARTIAL/DOC-DRIFT/OUT-OF-LIST 未发现 · advisor 代码评审 **pass**（0🔴；2🟡+6🔵）· 修正轮 1/5 · LLM 验证 2/3——修正轮未重跑评审，未触及未覆盖文件）。
- **改动**（21 改 + 5 新增 = 26，全部清单内）：角色注册五处 + 第三道模式门（非工程禁 designer）· 装配四处（内层选择器同步，designer 实选场景）·
  新槽双源 persona-eng-designer · batchDoc 门扩角色集 + 文案参数化 · 勘察变体参数化复用（designer 路径返回 null，不触发审计注入；审计预算仍只计 eng-coder）·
  designer 不置 _engDesignReviewed/_engTaskAuthorized（写走人工 ask）· 双源纪律/persona 改写（删“主会话即 designer” + 四步三句 + D1-D7 + 调用链段）·
  TUI 四处 · 文档登记七处 · **V1/V2 机械校验**（check-doc-width.mjs 51→281 行 + doc-consistency.test.mjs 171 行 + 基线 19 条）。
- **未动**：`src/agent/dispatch.mjs`（AC19——写域=提示词级，零机械门）· `docs/README.md`（父侧预落，只核未改）· **未 git 提交**（留工作区）。
- **自证**：lint 252 OK · 目标面测试 72/72 · 快层 310/299 pass（11 slow-skip）· 一致性新增违规 0 / 存量 19（基线内）。
- **透明表**：Done 全项；Simplified 无；Not done 无。

### 父侧抽查（交付后逐项核磁盘）

角色 enum/第三门/batchDoc 文案角色集/setup 工程枚举/SLOT+场景注册/designer 返回 null/`dispatch.mjs` 未含 eng-designer/新槽双源存在/双源无“主会话即 designer”——**10/10 与声明一致**。


## §6 验证与收口（父代理自写）

### 父侧验证（L2 恰一次）

- `npm run test:full` → **pass 310 / fail 0**（含新用例 eng-designer-role 32 + doc-consistency 等；快层 310/299 + 11 slow 与自证一致）。

### 遗留项（交付报告 #1-#7，父侧跟进）

| # | 项 | 处置 |
|---|---|---|
| 1 | **V2 窗口口径**（实现用“紧邻枚举”，设计/需求文本写“同节”——实测按字面 3 条含 2 假阳） | **需改设计/需求那两句**为“声明所在段落或其紧邻块”（待用户裁；实现不改） |
| 2 | 中文权威档缺“设计行为纪律四维”正文 | 父侧补正文或加指针（提示词内容权在主 agent） |
| 3 | 既存漂移：设计档 §2.2 step5 spawn 签名无 batchDoc；subagent 描述沿用 check 动作名 | 文档批处理 |
| 4 | 预估偏差：check-doc-width 51→281（预算 ±60）；eng-designer-role.test 313 行（>300 测试档 🟡） | 已披露；档位规则下次批处理 |
| 5 | designer 异步子代改动不进父侧 _touchedFiles（与 coder 同构） | 观察项 |
| 6 | T39 假工具名 probe_write（避 slow 门） | 测试构造说明 |
| 7 | 审计机械 union 只见 7 文件（实际 26） | 父侧核验不依赖该 union |
| 8 | **CLI 侧自用首验**（batchDoc 门 + 新角色）——本会话宿主为 VSC，无法自验 | 已登记 TODO；待 CLI 会话 |
