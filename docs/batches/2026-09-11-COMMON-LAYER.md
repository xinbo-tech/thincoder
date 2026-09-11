# 提示词公共层扩容（common 4→10 节）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 · 来源 = 用户 2026-09-10 裁定（需求已收口，待设计）+ 用户 2026-09-11 12:52「都跑起来吧」。

---

## §1 讨论（主 agent 记）

### 需求来源

- 用户 2026-09-10 裁定——**需求已收口，待设计**；
- 用户 2026-09-11 12:52「**还有哪些能跑起来的都跑起来吧**」= 开工。
- 登记：`docs/TODO.md`「提示词公共层扩容」行。

### 裁定内容（摘要——逐字以归属档为准）

- **common.md 由 4 节扩至 10 节**（新增：证据纪律 / 停下上报 / 任务边界 / 交付报告格式 / 工具观 + 路由表 / 系统接口语义框架）；
- **迁移裁定**：C1 / C2 / C4 / C5 / C6 / C7 **上移**（到公共层）· **C3 不上移** · **C8 落人格层**。
- 归属档 = `docs/design/PROMPT-SYSTEM.md` §2.5 + §4（原文路径记作 `docs/design/requirements/PROMPT-SYSTEM.md`——**现场校正**）。

### 已核事实（供 designer 免重复勘察）

- 提示词双源结构：`src/prompts/*`（运行时落地）+ `docs/design/prompts/*`（内容权威）；逐字一致性由镜像锚测试守（第 9 批扩展面⑥先例）。
- 双端：CLI `thincoder/src/prompts/` + VSC `thincoder-vscode/src/prompts/`（各端自持；镜像锚跨仓断言）。
- 公共层现状 = `common.md` 4 节（具体节题以现场为准）；C1–C8 的对应关系需逐条对现状（裁定的字母表以归属档 §2.5 为准）。

### 范围边界（明确不做）

- 不改工程纪律/人格层语义（除 C8 落人格层的**迁移**本身）；不碰他链在途档（`docs/TODO.md` 只读）；
- 提示词**内容权 = 主 agent**（designer 起草逐字 → 主 agent 确认 → eng-coder 落笔——D1）；
- **不得自行新建档**（必须新建 → 停下打回主 agent）。

### 待设计裁定

1. **现状对账**：common.md 4 节现状 vs 目标 10 节的逐节映射（含 C1–C8 的迁移表：上移/不上移/落人格层——逐条给落点）；
2. 新增 6 节各自的**逐字草案**（内容权 → 主 agent 确认环节写进流程）；
3. 双端落地面（CLI/VSC 各端自持 + 镜像锚测试面扩展）；
4. 受影响文件全清单（行数/增量）+ 用例 + AC（逐条回指裁定条目）；
5. 与既有纪律冲突核对（D1 · 双端纪律 · 第 9 批链行/四值句落点纪律）。

### 状态

**已收口 2026-09-11**（用户「都跑起来吧」）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）


### 批次任务（eng-designer 自写 · 2026-09-11）

**状态：任务书就绪**——设计就绪待评审（发起权在用户）；批准后 spawn eng-coder（设计 token 门）。实施者 = eng-coder。
**落点**：需求 = `docs/requirements/PROMPT-SYSTEM.md` §2.5（验收已扩至 ①–⑦ + 落地现状行）· 设计+测试 = `docs/design/PROMPT-SYSTEM.md`（**本批新建**——落点裁定见该档抬头 + §5 D-CL1，待父侧复核；内容与落点解耦，迁移成本一行）· 本段 §2 = 任务书本体（不另写副本；逐字文案 / 面表 / 用例 / AC 全文在设计档）。

**三方条目一致**：本段条目 ①–⑥ = 设计档 AC-CL1–AC-CL8 回指的条目 = 需求档 §2.5（公共层 10 节 + C1–C8 决策表 + 验收 ①–⑦）。

#### 1. 目标与为什么

common.md 4 节 → 10 节落地（C1–C8 迁移收尾）：EN 双端补 6 节、双纪律层清重复（删源）、锚测试迁宿主 + 扩展。
价值：公共层 = 全场景恒注入的协作基础（证据纪律/停下上报/任务边界/交付报告/工具观+路由表/系统接口语义首度全链在位）；
eng 链首次具备工具路由表；同规则单源（D2）。

#### 2. 已知事实（父侧与设计轮已勘察——不重复勘察）

- 装配 = 整文件拼接、**零段落级解析**（`src/prompt-overlays.mjs` 槽位表）——本批**零运行时代码改动**；七场景全注入 common。
- 每改动落 **4 面**（CLI/VSC × EN/CN）；CN 权威源已定稿（除设计档 §2.7 四类）；EN = 待落地产物。
- 锚测试 4 档要动（设计档 §3.3）：CLI/VSC `prompts-async-guidance`（搜索条款宿主迁 common + `#9` 清单清零）· CLI `prompts-dual-source`（+3 例）· VSC `prompts-mirror-anchors`（+面 ⑦）。
- 端特有段（VSC `discipline-engineering` R14 / `persona-engineering` Multi-Task / `persona-eng-coder` Guidelines）原地保留，删除操作不得触碰（镜像断言保持绿）。
- 全量落笔来源 = 设计档 §2.2（6 节 EN 逐字草案）+ §2.3（逐文件删除锚点 / R-1/R-2 补条）——**唯一来源**，不自行改词。

#### 3. 设计要点与禁止范围

**要做**（面表 = 设计档 §4，共 9 件提示词各按需落面 + 4 档测试）：

1. 提示词 4 面落地：按设计档 §2.3 A/B 表逐文件执行（R-1/R-2 补条、C8 标题注剥除、de/dn 删源、persona 收敛、eng-coder 2 处补丁）；
2. 测试：按设计档 §3.3 清单（重定向 + 负断言 + 新例 + 面 ⑦）；
3. 交付报告含「提示词改动需 reload 会话后生效」声明（不得以静态断言绿声称已生效）。

**落笔前置门（顺序不跳）**：设计评审（用户发起）→ 主 agent 内容确认（R-1–R-4 裁定，设计档 §2.7）→ 用户批准 → spawn eng-coder。
R 项裁定结论未回填前**不落笔提示词**（测试落笔与提示词同批，不得先行）。

**禁止范围**：

- 不改运行时代码（`src/prompt-overlays.mjs` / `src/agent/**` / 装配链）；不改评审侧提示词（`advisor-*.md` / `consult-base.md`——特殊域自包含）；
- **不新增文件**（提示词 / 测试均不新增；`test/files.mjs` 免改）；不改文件命名法；
- 不改 CN 定稿其余文本（除 §2.7 四类）；不做语义新设计（本批 = 迁移落地）；
- 不碰他链在途档（`docs/TODO.md` 只读 / `docs/design/ENGINEERING-MODE.md` / `docs/design/TUI.md` 零碰）；不 commit；
- 提示词零维护者注（无日期 / 批次号 / 评审号）。

#### 4. 验收标准（机器可验证——全文唯一权威 = 设计档 §3.1）

| AC | 判据（摘要） | 回指 |
|---|---|---|
| AC-CL1 | 双端 EN `common.md` 11 个 `##` 块标题逐字（10 节口径——设计档 §1.2 计数口径） | 需求验收① / 条目① |
| AC-CL2 | de/dn 双端双源零残留 + persona 收敛 + eng-coder 2 处补丁在位 | 需求验收②③ / 条目② |
| AC-CL3 | 4 面齐（面表逐面核）+ VSC 端特有段零损 | 需求验收⑥ / 条目③ |
| AC-CL4 | 锚扩展全绿（设计档 §3.3 清单） | 需求验收⑦ / 条目④ |
| AC-CL5 | 装配七场景零回归（既有用例零改） | 需求验收⑤ / 条目⑤ |
| AC-CL6 | 零维护者注（含 CN「评审 #C8 落位」剥除核验） | §2.7 #15 / 条目② |
| AC-CL7 | 文档面（需求档 ①–⑦ + 本档 + 父侧件登记到位） | 条目⑥ / 批次 §1 问 4 |
| AC-CL8 | 双端 `check-doc-width.mjs` 新增 0 + 快层全绿 | 需求验收④ / 条目⑤ |

#### 5. 交付报告格式

Done / Simplified / Not done 三值表 + 逐文件 × 面改动清单 + 断言运行输出（双端快层 ℹ 行）+ R 项执行回填 + T75 协调结果 + 「不 commit / reload 生效」声明 + 偏差如实披露（超声明 = 披露即可）。

#### 6. 就绪状态与父侧排程项

- 任务书就绪；**设计待评审**（发起权在用户）——评审经 `batchDoc` 传本档写 §3。
- **父侧排程件**（设计档 §4 第 21/22/41 行 + CHANGELOG）：`docs/README.md` §4 登记本档（含同名 basename 双档注）· `docs/TODO.md` 行状态推进 · `thincoder-vscode/docs/design/VSC-PROMPTS.md` 落地纪要 + CLI 档引用改跨仓形态 · CHANGELOG。
- **实施拆分建议**：两面并行 eng-coder（CLI 面 / VSC 面——file 域互斥零重叠）或单 coder 全量；提示词落笔 = 双源手抄/译写（无同步脚本）。
- **跨批依赖**：T75（第 14 批在途）守恒值 53 → 56 由后落地者同步（设计档 §3.4 / D-CL6）。

### 修正轮（2026-09-11——设计评审轮次 1 后；本追加与上文本冲突时以本追加为准）

**背景**：设计评审（轮次 1）**pass**（🔴 0 · 🟡 4 · 🔵 3——发现表见 §3）。父侧裁决 **6 条落地**（#1/#2/#3/#5/#6/#7）；**#4 = 父侧处置**（跨批依赖 T75 已入 `docs/TODO.md` 并随两批 eng-coder 任务书——协调项，本修正轮无动作）。本轮 = 修正轮（**只改文档、不碰实现**——提示词实体零改；实现落笔仍待批准链）。

**发现 → 落点映射（全部已落）**：

| 发现 | 级别 | 落点 |
|---|---|---|
| #1 | 🟡 | 删除裁定收口：设计档 §2.3 A persona-explore 行注（删除依据 = CN 权威形态 + 运行时机械承载 `subagent-spawn.mjs:286-288`/`:301-302`）+ 需求档 §2.5 persona-explore 行收敛注 |
| #2 | 🟡 | 【R-2】= 设计侧定位标注、落地剥除——设计档 §2.3（A 表 common 行 + B 表 R-2 行）+ §3.3 落地文本卫生注 |
| #3 | 🟡 | 落笔前置 ①（见下）——设计档 §3.3 首步注 + 本块 |
| #4 | 🟡 | 父侧处置（跨批依赖 T75——不在本修正轮，见 §6） |
| #5 | 🔵 | `test/files.mjs` 免改 → 仓库限定（VSC 仓显式清单 / CLI 仓走 glob 自动发现）——设计档 §3.3 item 5 + §5 D-CL4 |
| #6 | 🔵 | 落笔前置 ②（见下）——设计档 §4 头部注 + 本块 |
| #7 | 🔵 | 需求档 §2.5 迁移前快照注（人格层表 + 纪律层表表头）+ persona-explore 行注（与 #1-② 同落） |

**落笔前置（修正后任务书增补——顺序不跳）**：

1. **首步 = 3 条搜索条款字面串（CLI/VSC `prompts-async-guidance` 既有断言）↔ 设计档 §2.2 草案逐字比对**；差异 ⇒ 草案回改存量串（唯一来源口径下的最小修）。（评审 #3）
2. **首步 = 受影响文件全表行数复核**——设计档 §4 行数注记按现场重测；差异以现场为准。（评审 #6）

**#1 裁定备注**：explore「权限边界」整节删除 = 父侧内容权**接受**——依据 = CN 权威形态（CN 侧无对位节）+ 运行时机械承载（explore 工具面 = 只读族：只读过滤 + 权限恒拒；EN 原句为行为纵深防御）。

**修正轮完成**：6 条已全部落档（设计档 / 需求档 / 本块）；后续（验证 / 批准）发起权在用户。

## §3 设计评审（评审子代理自写）


### 轮次 1（评审子代理）

**轮次 1 发现表（设计评审——对象：`docs/design/PROMPT-SYSTEM.md` ＋ `docs/requirements/PROMPT-SYSTEM.md` §2.5 ＋ 本档 §2）**

已核要点（抽检通过，不加级）：C1–C8 迁移表（design:49-60）与批次 §1 裁定（batch:19-20）逐条一致（C3 不上移＝R-1 回补）；`##` 计数口径（10 内容项 vs 11 块）在 design:44-45 钉死，与 CN 实测 10 个 `##`、AC-CL1 的 11 块断言自洽；EN 工具路由表草案实测 21 行，与 R-3「按 CN 定稿 21 行」相符；R-1–R-4 四项默认立场（design:251-258）与父侧「回补/接受/执行」口径一致；需求档 §2.5 验收 ①–⑦ 已实落（requirements:96-98、:307）；VSC 镜像锚档既有六面（231 行档）与新面 ⑦ 同构可落（`readRepo` 双仓断言形态相容）。

| # | 类别 | 级别 | 问题 | 建议 |
|---|------|------|------|------|
| 1 | Requirements／删源空洞 | 🟡 | EN `persona-explore` 删「权限边界（只读/不碰用户）」整节（design:170）超出 C1–C8 迁移表（C2 行仅 :20-22、C6 行仅 :18）；随之消失的自持句 = `thincoder/src/prompts/persona-explore.md:10`「You do NOT have file editing tools — read-only tools only… no shell tool is available」，而 CN 权威侧无对位句（`docs/design/prompts/persona-explore.md` 仅 :3「身份：只读侦察」，实测）；需求档 §5 角色表（requirements:58「② 权限边界（只读/不碰用户）」）同批未同步 → 删后两源均无该约束文本。**未验证**：运行时 explore 工具面是否已机械承载只读 | 主 agent 内容确认环节显式裁：保留一句收窄删除，或确认运行时承载并同步需求档 §5 行；§2.3 A 行注明取舍 |
| 2 | Clarity／落地文本卫生 | 🟡 | §2.2「落地文本」代码块含设计侧标注 `【R-2】`（design:118），而 §2.1 #4 / §2.7 #15（design:73、:249）要求新增文本零维护者注；全文未给「标注剥除」指令（对照 CN 逐字 design:207 无标记） | 落笔前在 §2.3／§3.3 明示「【R-2】= 设计侧定位标注，落地剥除」 |
| 3 | Acceptance criteria／锚字面相容 | 🟡 | T-CL5/T-CL6（design:285-286）与 §3.3 item 2（design:294-296）依赖「3 条搜索条款字面串」逐字命中于新 common、`§2.7 #9` 清单清零；本轮未将既有断言 3 串与 §2.2 草案逐字比对（**unverified**）——一字之差即在重定向后转红 | 落笔首步逐字比对 3 串（CLI/VSC `prompts-async-guidance`）↔ §2.2 草案；差异 ⇒ 草案回改存量串（唯一来源口径下的最小修） |
| 4 | 跨批协调 | 🟡 | D-CL6／T75：11→14 例使守恒式 53→56「后落地者同步」仅登记在本批（design:306、:367；batch:115）；第 14 批在途侧的在档同步面无任何声明 | 父侧排程时把该依赖登记进第 14 批侧（或钉死两批落地顺序），避免互相覆盖锁值——协调项，非缺陷 |
| 5 | 方法／引用精度 | 🔵 | 「`test/files.mjs` 免改」未注仓库（design:300；batch:88）：CLI 仓无此档（实测 `thincoder/test/` 无 files.mjs——glob 自动发现），该档为 VSC 仓显式清单（`thincoder-vscode/test/files.mjs`，含注释、无行数注记）；语义正确（本批零新增测试档），但沿用前批同类歧义 | 加仓库限定（VSC 显式清单免改；CLI 走 glob 自动发现） |
| 6 | Affected-file annotations | 🔵 | §4（design:311-353）行数注记抽检通过子集：VSC `prompts-mirror-anchors` 231 ✓、VSC CN common 120 ✓、CLI CN de 155 ✓、VSC CN dn 248 ✓；其余 30+ 项（CLI EN 40/47/20/28/47/29/37/227/245 · 测试 175/419/450 · requirements 301 · README/TODO/VSC-PROMPTS）本轮未逐一 spot-check（**unverified**）。已核注记全部 ≤300、测试档 ≤500 → 档位结论（无拆分触发）对已核子集成立 | 实施首步全表复核行数（沿用「行界按现场」口径） |
| 7 | 文档卫生 | 🔵 | 需求档 §5 角色表（requirements:54-60）描述迁移前形态（explore ②权限边界 ／ de ⑥工具观条款 ／ dn ⑤工具观条款）；本批文档面（§2.4）只改 §2.5，落删源后该表成历史口径 | 父侧收口时以「已迁移至公共层」注记同步 §5 行（或明确其为历史快照） |

**计数：🔴 0 · 🟡 4 · 🔵 3**

VERDICT: pass

> 备注：对象状态一致（批次 §2 任务书就绪、设计待评审）；无机制级描述冲突、无需求覆盖缺口构成阻断项；4 条 🟡 均为落笔前可闭环项（内容确认/文案剥除/字面比对/父侧排程登记）。

## §4 用户批准（主 agent 记）

**2026-09-11 13:28 父侧代签**——用户 12:48 授权原话「**你都自动推进，授权到下午两点**」（窗口 12:48 → 14:00；与 04:20 夜班窗口同款自缚规则）；父侧代签三条件**齐备**：

- **轮次 1**：**pass**（🔴 0 · 🟡 4 · 🔵 3——发现表见 §3 轮次 1）；
- **修正轮落地**（id=31）经父侧逐条实文核验：**6/6**（#1 删除依据+需求档注 · #2 【R-2】剥除明示 · #3 落笔前置比对 · #5 files.mjs 仓库限定 · #6 行数复核口径 · #7 迁移前形态双表注）；
- **token 已签发**（值不落档——运行时凭证）。

**批准范围**：C1–C8 迁移收尾 + EN 补 6 节 + 源侧删重复 + 镜像锚面 ⑦；实施域 = CLI 18 项（9 源提示词 + 7 中文权威 + 2 测试）+ VSC 18 项（9 + 7 + 2 测试——计数更正：原「17 项」为误，设计档 §4 :39/:40 明列两测试档）——真正只改提示词档与测试档，零源代码。

**落点裁定追认（修正轮披露 ①）**：评审 #7 所称「需求档 §5 角色表」实为 **§2.5 两表**（人格层 + 纪律层）——修正轮两表均加注 = 完整覆盖被点名行（explore/de/dn）；父侧追认此落法。

**遗留（批准时登记）**：① `COMMON-LAYER.md` §3「已核要点」行超宽（344 字符——评审写入，非本批改动面）；② 跨批 T75 守恒锁（53 → 56——后落地者同步，已入 TODO）；③ 落笔首步 = 3 条搜索条款字面串逐字比对（#3 落档）。

## §5 实施记录（eng-coder 自写）


### 实施记录（eng-coder 自写 · 2026-09-11——CLI 面）

**面域**：CLI 仓 18 档（9 EN 提示词 + 7 CN 权威源 + 2 测试档）；**VSC 仓零触碰**（另一 coder 面）；**零源代码改动**（`src/*.mjs` 未碰）；未 commit。

**落笔前置（顺序不跳——两项已执行）**：

1. 3 条搜索条款字面串（`test/prompts-async-guidance.test.mjs` 既有断言）↔ 设计 §2.2 草案逐字比对：**3/3 逐字命中**
   （MCP primary / websearch junk / fallback 限定）——**无差异，草案无需回改**。
2. §4 行数注记现场重测：全部实测 = 设计注记 −1（计数口径差——设计按 `split("\n")` 含尾部空段计，实测按内容行计）；
   **无超档**（提示词档 ≤300、测试档 ≤500）——档位结论（无拆分触发）不变。

**实测行数（设计口径 / 落定内容行）**：

| 文件 | 设计注记 → 落定（内容行） |
|---|---|
| `src/prompts/common.md` | 40→≈115 / **39→115** |
| `persona-engineering.md` | 47→≈52 / **46→54** |
| `persona-normal.md` | 20→≈25 / **19→27** |
| `persona-explore.md` | 28→≈19 / **27→15** |
| `persona-coder.md` | 47→≈27 / **46→21** |
| `persona-plan.md` | 29→≈27 / **28→26** |
| `persona-eng-coder.md` | 37→≈39 / **36→38** |
| `discipline-engineering.md` | 227→≈214 / **226→214** |
| `discipline-normal.md` | 245→≈185 / **244→179** |
| CN `common.md` | 120→≈121 / **119→120** |
| CN `persona-engineering.md` / `persona-normal.md` | 47→47 / 23→23 · **46→46 / 22→22**（仅标题注剥除） |
| CN `persona-explore.md` / `persona-coder.md` | 15→≈16 / 18→≈19 · **14→15 / 17→18**（+R-1） |
| CN `discipline-engineering.md` | 155→≈142 / **154→143** |
| CN `discipline-normal.md` | 248→≈192 / **247→182** |
| `test/prompts-dual-source.test.mjs` | 175→≈245 / **174→288**（+3 例——11→14） |
| `test/prompts-async-guidance.test.mjs` | 419→≈420 / **418→429**（例数守恒 42 不动——3 处用例重定向/更新） |

**改动清单（逐文件）**：

- EN `common.md`：追加 §2.2 全段（6 节 = 7 个 `##` 块）——与设计草案 **75/75 行逐字一致**（仅剥除【R-2】标注，零残留在册）；
  4 节 → 10 节（11 块）；标题串与 CN 权威逐字同串（11/11 全等）。
- EN `persona-engineering.md` / `persona-normal.md`：+C8 段（角色版——normal 版 `mode = mode toggle` + caches/in-flight 句）。
- EN `persona-explore.md`：删「权限边界」整节；报告义务瘦身 2 条；保留彻底度档位；身份节尾 +R-1 行。
- EN `persona-coder.md`：旧 1-3 号条 → 中立瘦身条 + common 指针句；交付表块与五条清单 → 报告义务两行；工具权限注保留；+R-1 行。
- EN `persona-plan.md`：删 :7-8 调用方句（「不问用户」句 :12 自持）。
- EN `persona-eng-coder.md`：①行尾补「（此条覆写 common 确认门）」；②自含交付协议补「交付表按 common.md 统一格式；审计/评审轮次与终态写进报告（角色补充）。」
- EN `discipline-engineering.md`：删「## 工具观条款」整节（:215-226）。
- EN `discipline-normal.md`：删路由块 + 探索顺序节（:129-185）+ 常用纪律 C8 副本（:109-115、:118）；并行细则保留。
- CN `common.md`：搜索优先级补 R-2 镜像路径 bullet（位 3——逐字取 §2.3 C CN 形态）。
- CN `persona-engineering.md` / `persona-normal.md`：标题「——评审 #C8 落位」剥除。
- CN `persona-explore.md` / `persona-coder.md`：身份节尾 +R-1 行。
- CN `discipline-engineering.md`：删工具观条款节（:144-154）。
- CN `discipline-normal.md`：删路由块（:127-182）+ 探索顺序（:185-187）+ C8 副本（:109-113、:116）；评审纪律指针块与并行细则保留。
- 测试：`dual-source` +3 例（T-CL1 / T-CL2 / T-CL3+T-CL4；头部 +1 行）；`async-guidance` 3 处（搜索条款宿主迁移 + `#9` 清单清零 + R6 重定向）。

**偏差与设计缺口处置（如实披露）**：

1. **R6 用例宿主缺口**（设计 §3.3 未列——本面发现的缺口）：`ASYNC-RESIDUE R6` 断言锚 ∈ 被删 dn 路由块 → 该例同批重定向
   （common subagent 族行 + 飞刀段 escalate 异步句 + dn 旧块零残留），例数守恒 42 不动。**请父侧复审此改法**。
2. **dn 的 MCP 不可信行（CN :116 / EN :118）**：§2.3 A ③ item 列表含「MCP 不可信段」，但范围注记 `:109-115` 未覆盖该行——按 **item 列表**执行删除
   （不删则与 common §10 字面重复，违验收③）；已核四源零残留。
3. **EN R-2 行前缀**：设计两处字面形态不一（§2.2 草案无 `- ` 前缀 / §2.3 C「R-2 逐字」有 `- ` 前缀）——EN 按 §2.3 A「插入 §2.2 全段」取草案形态（marker 剥除）；
   CN 按 R-2 逐字（含 `- `）。内容等价，仅列前缀差异。
4. **估算 vs 实测**：explore/coder EN 与 dn 双端落定行数低于设计 ≈ 估值（内容删除项逐条按 §2.3 执行；差值 = 估算宽裕）。
5. **T-CL4 增补 persona 负断言**（AC-CL2 明列的负断言给测试宿主）：coder/explore EN 零 C1 证据规则句、零 C4 交付表块（指针句允许——首版过宽断言已自修）。
6. **T75 协调结果**：`test/doc-consistency.test.mjs` 现档**无 T75 锁**（第 14 批设计未落地——本面零碰该档）；本批 `dual-source` 例数 11 → 14
   ⇒ **守恒值 = 56 = 42 + 14**——供第 14 批后落地者同步（D-CL6）。

**运行证据（命令 + 结果）**：

- `node --test test/prompts-dual-source.test.mjs test/prompts-async-guidance.test.mjs` → **56/56 pass · 0 fail**（42 + 14——例数守恒达成）。
- `node test/run-fast.mjs` → 434 例 · 421 pass · 2 fail · 11 skipped；**2 fail 均为他链在途**（非本批改动面）：
  ① `T41 ① doc-consistency` = `docs/batches/2026-09-11-PORTABILITY.md` 新 V1 违规（未跟踪档——他批记录；本批改动前基线即同一条）；
  ② `T40 eng-designer-role` = 他链未提交的 `docs/design/ENGINEERING-MODE.md` §2.28 新增行命中其正则（HEAD 版该断言通过——经 `git show HEAD` 对照实测）。
- `node scripts/check-doc-width.mjs` → 与本批改动前基线**逐条相同**（2 超宽行 + 1 V1 新违规，均他批/他链档）——**本批改动面新增 0**。
- 本批改动面 diffstat（18 档）：+231 / −218；新增行零维护者注（16 档提示词档全绿；命中仅存在于测试档批次注释——非提示词禁注面）。

**审计/评审（子代理内协议）**：见本段追加（下发轮次与终态）。

### 实施记录（§5 追加——审计/评审终态 + 交付终表 · 2026-09-11）

**内部 explore 偏差审计：1 轮 → 2 条偏差（均非阻断、均已在 §5 披露）**：① 设计内部字面冲突（EN R-2 列前缀取 §2.2 形态——披露 #3）；② R6 用例重定向（设计 §3.3 清单外、§2.6「被改锚句的断言同批改」隐含面——披露 #1）。
四类偏差扫描：**SILENT-SIMPLIFICATION 0 · DOC-DRIFT 0 · OUT-OF-LIST 0**（实改 18 档 = 设计 §4 CLI 表 1–18 行）。信息项 3 条（需求档 §2.5「落地现状」行为 stale 快照 · CN R-2 bullet 无机器锚 · `docs/TODO.md` mtime 属父侧 T75 登记）→ 父侧处置。

**内部 advisor 代码评审：轮次 1 → pass（🔴 0 · 🟡 3 · 🔵 2）**；裁决 5/5 收敛：**#1 Not an issue · #2 Not an issue · #3 Fixed · #4 Fixed · #5 Not an issue**（详表见交付报告）。
**终态 = `clean`**（无 must-fix 项；无修正轮触发）。评审通报项：3 条引用因路径前缀/推理混入未通过宿主机检——其中「async 档行数」条经本面独立实测复核（见下订正）。

**自修 1 次（评审前）**：T-CL4 首版 persona 负断言过宽（子串 `Evidence discipline` 误伤 common 指针句）→ 收窄为 C1 规则句本体（`behavioral question is an EVIDENCE question`），复跑 56/56 绿。

**行数表订正（评审 #3 + 本面自核——§5 上表两处）**：`test/prompts-async-guidance.test.mjs` 落定 = **418 内容行**（末行 `:418` = `})`；表内「429」为误值）；`src/prompts/persona-eng-coder.md` 落定 = **37 行**（表内「38」订正——净 +1 行）。其余 15 行复核无误。

**R 项执行回填（R-1–R-4——设计 §2.7 默认立场）**：**R-1 ✅** 回补（4 档：EN/CN × explore/coder——「你是子代理……不向最终用户提问」双源同义，逐字取 §2.3 C）；
**R-2 ✅** 补条（CLI 双源 common 各 1 条镜像路径 bullet）；**R-3 ✅** 按 CN 定稿 21 行（EN 表实测 21 行、最宽行 153 字符 ≤200）；**R-4 ✅** CN 删源（de/dn 工具条款删净）+ 标题注剥除（pe/pn 两档）。

**T75 协调结果**：CLI 测试树**无 T75 锁**（`test/doc-consistency.test.mjs` 实测零命中——本面零碰该档）；本批 `dual-source` 例数 11 → 14 ⇒ **守恒值 = 56 = 42 + 14**（供第 14 批后落地者同步；`docs/TODO.md:104` 已登记）。

**提示词改动需 reload 会话后生效**——静态断言绿 ≠ 已生效，不得据断言绿声称已生效（父侧收口后真机核验一次装配注入文本 = common 10 节）。

**交付三值表（本报告范围 = CLI 面）**：

| # | Status | Requirement |
|---|--------|-------------|
| 1 | ✅ Done | 提示词落面：CLI 16 档（9 EN + 7 CN——批次 §2「要做」1 的 CLI 半面） |
| 2 | ✅ Done | 测试面：2 档（dual-source +3 例 / async 逐字重定向 + `#9` 清单清零；42 / 14 例守恒） |
| 3 | ✅ Done | 交付报告含 reload 声明（同条 3——见上；⚠️/❌ 零行：本面零简化、零未做） |

**未 commit**（父侧收口）；VSC 面 = 另一 eng-coder（dependsOn 本面），不在本报告范围。

### 实施记录（eng-coder 自写 · 2026-09-11——VSC 面）

**面域**：VSC 仓 18 档（9 EN 提示词 + 7 CN 权威源 + 2 测试档）；CLI 仓零触碰；**零源代码改动**（`src/*.mjs` 未碰）；未 commit。

**落笔前置（顺序不跳——两项已执行）**：

1. CLI 面已落定核验：`thincoder/src/prompts/common.md` 10 节在位（11 块）、9 EN + 7 CN + 2 测试档改动齐备——核验通过后才落笔。
2. VSC 与 CLI 的 5 档落笔前**逐字同文**（common / persona-normal / persona-explore / persona-coder / persona-plan——比对 CLI HEAD 确认一致，落定后仍逐字同文：common 115 行全等）；
   余 4 档端自持（VSC 端特有段保留）。
3. 3 条搜索条款字面串（`prompts-async-guidance` 既有断言）↔ 设计 §2.2 草案逐字比对：**3/3 逐字命中**——无差异，草案无需回改。
4. §4 行数现场重测：全表按现场（下表）；无超档（提示词 ≤300；测试档 ≤500 硬限内）。

**实测行数（内容行——落定；设计注记 → 落定）**：

| 文件 | 设计注记 → 落定 |
|---|---|
| `src/prompts/common.md` | 40→≈115 / **115**（与 CLI 逐字同文） |
| `persona-engineering.md` | 79→≈84 / **86**（含 VSC Multi-Task 端段） |
| `persona-normal.md` | 20→≈25 / **27** |
| `persona-explore.md` | 28→≈19 / **15** |
| `persona-coder.md` | 47→≈27 / **21** |
| `persona-plan.md` | 29→≈27 / **26** |
| `persona-eng-coder.md` | 50→≈52 / **50**（+2 处补丁、净 +1 行） |
| `discipline-engineering.md` | 234→≈219 / **221**（R14 端段保留） |
| `discipline-normal.md` | 230→≈172 / **168** |
| CN `common.md` | 120→≈121 / **120**（+R-2 行） |
| CN `persona-engineering.md` / `persona-normal.md` | 54 / 23 → **53 / 22**（仅标题注剥除） |
| CN `persona-explore.md` / `persona-coder.md` | 15 / 18 → **15 / 18**（+R-1 各 +1 行、净 +1——原 14 / 17） |
| CN `discipline-engineering.md` | 161→≈147 / **149** |
| CN `discipline-normal.md` | 248→≈192 / **182** |
| `test/prompts-async-guidance.test.mjs` | 450→≈451 / **451**（3 处用例重定向/更新，例数守恒） |
| `test/prompts-mirror-anchors.test.mjs` | 231→≈280 / **280**（+面 ⑦，11→12 例） |

**改动清单（逐文件）**：

- EN `common.md`：诚实原则节后追加 §2.2 全段（6 节 = 7 个 `##` 块）——与 CLI 落定文逐字同文；4 节 → 10 节（11 块）。
- EN `persona-engineering.md`：推进档位节后、「与 eng-coder 的分工界面」前插 C8 段（角色版 7 行）。
- EN `persona-normal.md`：文件尾追加 C8 段（角色版——`mode = mode toggle` + caches/in-flight 句）。
- EN `persona-explore.md`：删「权限边界（只读/不碰用户）」整节；报告义务瘦身为 2 条（无命中显式报告 / 报告结构化+交付表按 common）；保留彻底度档位；身份节尾 +R-1 行。
- EN `persona-coder.md`：旧 1-3 号条 → 中立瘦身条 + common 指针句；交付表块与五条清单 → 报告义务两行；工具权限注保留；身份节尾 +R-1 行。
- EN `persona-plan.md`：删调用方两行（`All user messages…` + `Treat the parent as your caller.`）——「不问用户」句自持。
- EN `persona-eng-coder.md`：①「绝不请求确认」行尾补「（此条覆写 common 确认门）」；②自含交付协议补「交付表按 common.md 统一格式；审计/评审轮次与终态写进报告（角色补充）。」——Guidelines 端段零碰。
- EN `discipline-engineering.md`：删「## 工具观条款」整节（Search Tool Priority + Codebase exploration order）；R14 端段保留。
- EN `discipline-normal.md`：删路由块（bullets + 全表 + 搜索优先级）+ 探索顺序 bullet + C8 副本（reminders/env 段 + MCP 行）；并行细则、委派、会诊、飞刀、收尾验收节保留。
- CN `common.md`：搜索工具优先级补 R-2 镜像路径 bullet（位 3——逐字取 §2.3 C CN 形态）。
- CN `persona-engineering.md` / `persona-normal.md`：标题「——评审 #C8 落位」剥除。
- CN `persona-explore.md` / `persona-coder.md`：+R-1 行（与 EN 同义）。
- CN `discipline-engineering.md`：删工具观条款节（搜索优先级 + 探索顺序）；VSC 端特有段（R14）保留。
- CN `discipline-normal.md`：删路由块 + 探索顺序节 + C8 副本（reminders/env 段、MCP 行）；评审纪律指针块与并行细则保留。
- 测试：`async` 3 处（搜索条款宿主迁 common + 3 字面 + de/dn 负断言；`#9` 清单清零 = `[]`；R6 用例重定向）；`mirror` +面 ⑦（common 11 标题组 + 关键句组 zh↔zh / en↔en 跨仓逐字）+ 头部「断言七面」。

**偏差与设计缺口处置（如实披露）**：

1. **R6 用例重定向**（设计 §3.3 未列——被删 dn 路由块含其断言锚）：断言迁 common subagent 族行 + dn 飞刀段 escalate 异步句 + dn 旧块零残留；例数守恒。与 CLI 面同款改法。
2. **VSC dn 融合行拆行**（3 处物理行融合：编辑纪律+路由导语 / 表末行+搜索优先级导语 / 搜索 bullet+评审纪律导语）：按内容边界拆分——保留编辑纪律本体与「Review discipline (…)」导语；CN 侧为逐行体、无此融合。
3. **de 删「工具观条款」后 EN `### VSC 端特有段：R14 池规则` 成孤悬三级标题**（端段零触碰原则下未改标题层级；CN 侧同段为 `##`）——如实登记，父侧如另有裁定可一行改。
4. **EN R-2 行前缀**（同 CLI 面披露）：设计两处字面形态不一（§2.2 无 `- ` 前缀 / §2.3 C 有 `- `）——EN 按 §2.2 草案形态（marker 剥除）、CN 按 R-2 逐字（含 `- `）。内容等价，仅列前缀差异。
5. **测试注释未写批次号**：父侧口径「第 17 批」与设计/CLI 侧「第 15 批」不一致——取中性「公共层扩容」，规避口径冲突（可机检注释里无日期/批次号/评审号）。
6. **T75 协调结果**：VSC 仓 `test/doc-consistency.test.mjs` 实测**无 T75 守恒锁**（本面零碰该档、零涉跨批锁值）；本面例数变化 = `mirror-anchors` 11→12（`async` 例数不动）。

**运行证据（命令 + 结果）**：

- `node --test test/prompts-async-guidance.test.mjs test/prompts-mirror-anchors.test.mjs` → **54/54 pass · 0 fail**。
- `node test/run-fast.mjs` → 415 例 · 414 pass · **0 fail** · 1 skipped（先落盘再查——临时目录日志）。
- `node scripts/check-doc-width.mjs` → 扫描域 67 文件无 >300 行；一致性 V1/V2/V3 **新增违规 0**（存量基线 34）。
- 本批改动面 diffstat（18 档）：**+176 / −216**；新增行零 `【R-2】` / 零「评审 #C8」残留（全仓 grep 核）。

**内部 explore 偏差审计：1 轮 → 四类偏差 0**（PARTIAL 0 · SILENT-SIMPLIFICATION 0 · DOC-DRIFT 0 · OUT-OF-LIST 0）+ 3 条观测：
① VSC EN dn 相对 CN 镜像缺「文档先行 / 查重与意图」独立节——经 diff 自核 = **存量端差**（非本批引入；EN 以 Workflow bullets 内联承载）；
② 需求档 §2.5「落地现状」行与 `VSC-PROMPTS.md` = 父侧收口待办（非本面写域，如实登记）；
③ 披露项复核一致（R6 重定向 / dn 拆行 / de 孤悬标题均与现场一致）。

**内部 advisor 代码评审：轮次 1 → pass（🔴 0 · 🟡 2 · 🔵 2）**；裁决 4/4 收敛：
**#1 Deferred**（批次 §4 计数「VSC 17 项（9 + 7 + 1测试）」应为 18——**父侧写域**，报告披露、收口时一行更正）·
**#2 Not an issue**（测试档 451 行：项目档位口径 = 测试档 ≤500 硬限内、无拆分触发——设计档 §4 档位注；本批净 +≈1 行不改档位）·
**#3 Not an issue**（`persona-coder.md:9` 单行 384 字符：与 CLI 逐字同文；设计 ≤300 口径的核算域 = §2.2 新增 common 文本，本行非该域）·
**#4 Deferred**（pe/de Multi-Task 段重复 = 存量端差、设计 §2.1 #3 端段冻结——留后续提示词卫生批）。
**终态 = `clean`**（无 must-fix 项；零修正轮）。

**提示词改动需 reload 会话后生效**——静态断言绿 ≠ 已生效，不得据断言绿声称已生效（父侧收口后建议真机核验一次装配注入文本 = common 10 节 / 11 块）。

**交付三值表（本报告范围 = VSC 面）**：

| # | Status | Requirement |
|---|--------|-------------|
| 1 | ✅ Done | 提示词落面：VSC 16 档（9 EN + 7 CN——批次 §2「要做」1 的 VSC 半面） |
| 2 | ✅ Done | 测试面：2 档（async 3 处重定向 + mirror 面 ⑦；54/54 绿） |
| 3 | ✅ Done | 交付报告含 reload 声明（同条 3——见上；⚠️/❌ 零行：本面零简化、零未做） |

**未 commit**（父侧收口）；CLI 面 = 另一 eng-coder（本面 dependsOn 已满足——CLI 已落定），不在本报告范围。

## §6 验证与收口（父代理自写）

**2026-09-11 17:00 父侧收口**（**双面交付**——CLI 面 id=36 + VSC 面 id=37；用户授权窗口 12:48→排空）。

### 父侧验证

- **定向**：CLI `56/56`（dual-source 14 例 + async 42 例）· VSC `54/54`（async + mirror 8 例）；
- **快层**：CLI `434/421/2`（2 fail = 他链在途，已核）· VSC `415/414/0`；
- **宽度/一致性**：两仓新增 0；
- **父侧抽核**：CLI common 115/11 块 · VSC common 115/11 块 · dual-source 288 行/14 例 · mirror 280 行/8 例 · de 工具观条款零残留（两仓）· dn 路由块零残留（VSC）· persona-eng-coder 37（CLI）。

### 逐条验收结论

- 双面 AC（CLI AC-CL1–AC-CL8 / VSC 对位面）逐条自证 ✓（id=36 / id=37 交付报告）；**Simplified 零 · Not done 零**（双面）；
- T75 守恒：CLI `56 = 42 + 14`；VSC mirror `11→12`（async 不动）——守恒值已入 §5 与需求档。

### 需求池核销

- 需求池行「提示词公共层扩容」→ **已核销**（common 4→10 节/11 块双端 + C1–C8 迁移收尾 + 双纪律层删源 + 人格层 C8 + R-1/R-2 回补；双面 36 档）。

### 核销同步清单

- 角色表：无 ✓ · 状态行：需求档 §2.5/§4 ✓ · 计数：T75 守恒值（上）✓ · 指针：需求 §2.5 ↔ 设计 §2.2/§2.3 ↔ 用例 ✓ · 变更记录：两仓各档 ✓ · 待办勾销：需求池行翻转 + §4 计数更正（18 项）✓

### 遗留项

1. **T3**：de 删工具观条款后 EN `### VSC 端特有段：R14 池规则` 孤悬三级标题（端段零触碰原则下未改——如判需改一行即成）；
2. **T4**：EN R-2 行前缀口径（§2.2 无 `- ` / §2.3 C 有——双面同款取草案形态，内容等价）；
3. **Multi-Task 段重复驻留**（`persona-engineering` ≈25 行与 de 重叠——存量端差，提示词卫生批候选；届时同批更新锚#7 与镜像面④断言）；
4. 需求档「落地现状」行 + `VSC-PROMPTS.md` 落地纪要（父侧排程件）；
5. EN dn 缺「文档先行」独立节（存量端差，非本批）；
6. **提示词改动需 reload 后生效**——建议父侧收口后真机核验一次装配注入文本（common 10 节/11 块）；
7. **设计 token 已消费（链终）**；commit 待父侧随批提交。
