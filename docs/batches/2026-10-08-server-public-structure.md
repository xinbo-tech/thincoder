# 2026-10-08 · server public 结构轮（i18n 拆表 ∥ app.mjs 拆分）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-08 · 来源 = #976（i18n 双表越 300——拆域拆表结构轮）∥ #993（public/app.mjs ≈317 拆分预案）——用户 2026-10-08 10:51「还有那些能开的，都开吧」。
> 台账 = #976 · #993（server · 归批）。前情 = 无（独立批——两条件项并轮）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-08
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 点火与范围（2026-10-08 10:5x · 主 agent）

- 用户 2026-10-08 10:51「还有那些能开的，都开吧」= 点火。
- 条目：#976（i18n 双表 zh **382** ∥ en **385** 越 300——拆域拆表结构轮）∥ #993（`public/app.mjs` ≈317 拆分预案——「现状接受亦可」的裁点在用户批准面）。
- 边界：`thincoder-server/public/**` 只；`src/**` 零触；门禁（`prepublishOnly` 26 件链）与断言件随动在批（随正件）。
- 归批理由（两条件俱中）：i18n 表续增触发拆表断点 ∥ app.mjs 结构性触碰批即本批（i18n 拆分波及 import 面）。
- 设计轮 = eng-designer 已派（#4）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（结构轮设计轮：i18n 四拆+门面 ∥ app.mjs 拆三档（两案附代价）；上抛 4 项待裁）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（2026-10-08 结构轮设计轮——i18n 拆表 ∥ `app.mjs` 拆分；两处上抛待裁 = §2.8）

### 2.1 本批条目（覆盖）与实读口径
- **#976（i18n 双表越 300——拆域拆表）**：实读 **zh 382 ∥ en 385** 行（node 复读；与设计档 §5 末值一致）；键 **338 ∥ 343**（`Object.keys` 直读——en 含 `.one` 变体 7）。处置 = 按域四拆 + 聚合门面（§2.3）。
- **#993（`thincoder-server/public/app.mjs` 拆分）**：实读 **350 行**（node 复读）。**任务书「≈317」为陈旧读数**（317 = 布局收正批时点值；配额批 ⇒ 320 ⇒ 321 ⇒ me-keys 批落定后实读 350）——越 300 软线（<500 硬限）。
- **非本批条目（列册）**：`views-admin.mjs` 实读 331 ∥ `views-providers-modals.mjs` 实读 367（越线在册；两档预案标「触发 = 结构轮（#993/#976 同族）」——是否随本结构轮 = 上抛③）。

### 2.2 设计档落点（已落盘——逐处 file:line）
- `docs/server/design/webui/WEBUI.md:9`（§1 静态面——`app.mjs` 职责收窄 + `dom.mjs`/`health.mjs` 落点）
- `WEBUI.md:17-18`（§1——JS 档目 17 ⇒ **27**；越线在册清单 ⇒ 余两档）
- `WEBUI.md:97-100`（§2.2 新增「拆表」条——四部件域界 ∥ 装载形（门面保留） ∥ 零语义指纹 ∥ 越线解除）
- `WEBUI.md:102`（§2.2 零 CJK 机检口径——排除面改前缀式 `i18n-zh*`/`i18n-en*`）
- `WEBUI.md:483-485`（§5——`app.mjs` 实读 350 ⇒ 拆后 ≈192 + `dom.mjs` ≈120 + `health.mjs` ≈62 两新行）
- `WEBUI.md:502-511`（§5——i18n 两门面 ≈16/16 + 八部件 ≈69/69/136/118 ∥ ≈68/70/140/118 八新行）
- `WEBUI.md:512`（§5 小计 ⇒ ≈3696——public 19 档 3541 ⇒ ≈3618 + `static.mjs` 78）
- `WEBUI.md:518/520/522/523/524/527/531/535/538/540`（§6——档目链随正 ⇒ 结构轮后 **29 ∥ 30** + 四条批面括注「本批零新档」）
- `WEBUI.md:565-566`（§7 新增 KD-SV-51（i18n 拆表） ∥ KD-SV-52（`app.mjs` 拆三档））
- `WEBUI.md:582`（§8 边界——结构轮批不做面）
- `WEBUI.md:637`（变更记录一行）
- `docs/server/design/PROJECT.md:138-139`（§4 索引——KD-SV-51/52）
- `PROJECT.md:150`（§6 越线在册句——余两档 + 两条目已拆解）
- `PROJECT.md:164`（§6 本批预算行）+ `PROJECT.md:227-228`（注⑫——随正件 十六件逐处 + 新批内件一行）
- `PROJECT.md:319`（§9 R42——上抛 ∥ 需求档回笔 ∥ 随正件 ∥ 域外发现）
- **需求档（主 agent 笔——本设计不改）**：`docs/server/requirements/PROJECT.md:147`（AC-12 档目链 19 ∥ 20 ⇒ 29 ∥ 30） ∥ `:149`（AC-14 同链；若裁不拆 app ⇒ 27 ∥ 28）。

### 2.3 机制设计（零语义结构轮）
**① i18n 拆表（#976）**——四部件 × 两语言 + 门面：
- 域界 = **键首段前缀**（机器可判）：`-shell`（`app.*`/`common.*`/`col.*`/`denied.*`/`nav.*`/`lang.*`/`login.*`/`err.*`） ∥ `-me`（`usage.*`/`me.*`） ∥ `-admin`（`admin.*`） ∥ `-system`（`system.*`/`vector.*`/`health.*`/`overview.*`/`usageReport.*`/`audit.*`）；新档八 = `i18n-{zh,en}-{shell,me,admin,system}.mjs`。
- 装载形 = **聚合门面保留**：`i18n-zh.mjs` ∥ `i18n-en.mjs` 收为门面（四部件展开合体 + `Object.freeze`；导出名 `ZH`/`EN` 不变）——`i18n.mjs:8-9` 与全部门禁断言件取件面**零改**；`.one` 变体随基键同表。
- 零语义 = 键集/值逐字 + 键归属互斥/并集完备；**指纹锚（实施/收口核）**：
  `sha256(JSON.stringify(Object.keys(T).sort().map(k => [k, T[k]])))`：zh = `43366ed4260ed7c8a65059191e346cea56d0f2f25f0ed23e19c510a075d4cae1`；en = `fae04763770034ab36b6d339ad415ce42e044888a8869581ee06a606a6311936`（= 现盘基线；拆后必须逐值相等）。键序 = 非契约（无消费者读序；部内逐字搬移）。
- 拆分后逐档（设计估）：门面 ≈16/16；zh ≈69/69/136/118；en ≈68/70/140/118（≤300 软线内——实读回填）。

**② `app.mjs` 拆分（#993）**——按关切三拆（推荐案）：
- `dom.mjs`（≈120）= 渲染助手 + 提示条：`h`/`table`/`fmtTs`/`fmtValue`/`fmtModelQuotas`/`showSecret`/`copyText`/`usageTable`/`dataShell` + `flash`（携 `flashEl`/计时器——`copyText` 消费 `flash`，同档自持免循环依赖）。
- `health.mjs`（≈62）= 健康轮询：`HEALTH_POLL_MS`/三态键/`healthSnapshot`/`onHealth`/灯直更/`pollHealth`/启停 + **订阅清零口**（原 `route()`/`logout()` 直写 `healthListeners = []` ⇒ 收为导出函数——行为不变）。
- `app.mjs`（≈192）= 入口：路由分派 ∥ `api`/`refresh`/`navigate`/`fail` ∥ 会话态 ∥ 启动装配（`viewCtx` 注入面名不变）。
- 备选：不拆（越线续存）；仅拆健康块（**实测已不足**：350−50+1 ≈ 301——不回线内，注册预案前提已失效）。

### 2.4 受影响文件表（product 面 + 随正件 + 测试面）
**产品面（`thincoder-server/public/`）**：新增 8（i18n 部件）+ 2（`dom.mjs`/`health.mjs`）；改写 3（`i18n-zh.mjs` 382 ⇒ ≈16 ∥ `i18n-en.mjs` 385 ⇒ ≈16 ∥ `app.mjs` 350 ⇒ ≈192）；零触 = `nav.mjs` ∥ `views-*` 十档 ∥ `modal.mjs` ∥ `model-specs-snapshot.mjs` ∥ `style.css` ∥ `index.html` ∥ `src/**`（服务端零触）。档目 19 ∥ 20 ⇒ **29 ∥ 30**。
**随正件（十六件门禁断言件——跨批写门禁；父侧落讫沿先例）**：
- 目录整列断言十件（名单添十名 + 计数 [20,19] ⇒ [30,29]）：`2026-10-06-console-completeness-2.test.mjs:436-440` ∥ `2026-10-06-console-list-style.test.mjs:204-210` ∥ `2026-10-06-console-modals.test.mjs:411-416` ∥ `2026-10-06-console-provider-redo-runtime.test.mjs:293-299` ∥ `2026-10-06-console-providers.test.mjs:424-426` ∥ `2026-10-06-models-config.test.mjs:217-223` ∥ `2026-10-06-server-gateway-webui-deploy.test.mjs:272-274` ∥ `2026-10-07-me-keys-redo-ui.test.mjs:390-391` ∥ `2026-10-07-provider-model-metadata.test.mjs:483-484` ∥ `2026-10-07-quota-v2-member-models.test.mjs:730-731`。
- i18n 扫描面八件（排除名单 ⇒ 前缀式 `i18n-zh*`/`i18n-en*`）：`2026-10-06-server-i18n.test.mjs:42`（JS 档单）+ `:123`（档单名单）+ `:129-130`（CJK 载体断言 ⇒ 取 zh 族）+ `:173`（import 图面含部件）+ `:197`（直发面含部件） ∥ `-console-completeness-2:461` ∥ `-console-modals:435` ∥ `-console-provider-redo-runtime:320` ∥ `-models-config:230` ∥ `-console-layout:432` ∥ `-me-usage-charts-ui:382` ∥ `-quota-v2-member-models:512`。
- app 源扫三处：`2026-10-07-console-layout.test.mjs:166-172`（`dataShell`/`rowCount` ⇒ `dom.mjs`） ∥ `2026-10-06-console-completeness-2.test.mjs:479-480`（`HEALTH_POLL_MS`/三态键 ⇒ `health.mjs`） ∥ `2026-10-07-me-keys-redo-ui.test.mjs:95`（`load("app.mjs")` 取 `h`/`table`/`showSecret` ⇒ 改载 `dom.mjs`）。
- 门禁件数七件（26 ⇒ **27**——注释同拍）：`-console-list-style:237` ∥ `-server-auto-update:480` ∥ `-console-layout:449` ∥ `-me-usage-charts:225` ∥ `-provider-model-metadata:493` ∥ `-quota-per-model:444` ∥ `-quota-v2-member-models:428`；+ `thincoder-server/package.json:13`（`prepublishOnly` 添本批件）。
**批内件（新建一件）**：`docs/batches/2026-10-08-server-public-structure.test.mjs`（估 ≈220 行；不住仓套件；随批留存）。
**不动**：`style.css` ∥ `index.html` ∥ 视图十档 ∥ `src/**` ∥ 批外档（域外发现只报——§2.6④）。

### 2.5 验收对照（AC——每条机器可核）
| # | 判据 | 载体 |
|---|---|---|
| 1 | 键集/值零语义：拆后 `ZH`/`EN` 的 sorted-key 序列化 sha256 = 上列两枚基线值 ∧ 键数 338 ∥ 343 | 批内件（+实施前后各跑一次） |
| 2 | 部件互斥/完备：任意键恰属一部件（归属 = 剥 `.one` 首段前缀）∧ 八部件并集 = 门面全键 | 批内件 |
| 3 | 门面不破：`i18n.mjs` 取 `{ ZH }`/`{ EN }` 零改；`t()`/缺键回退链/`.one` 取形抽样直测不变 | 批内件 + 既有 `-server-i18n` 全腿复跑 |
| 4 | 逐档行数：十新档 + 两门面档 ≤500（硬限全绿）；目标 ≤300 者逐档列读（zh ≈69/69/136/118 ∥ en ≈68/70/140/118 ∥ 门面 ≈16/16） | 批内件（读数）+ 设计档 §5 回填 |
| 5 | 静态直发：十新档 200 ∥ `text/javascript` ∥ 字节 = 磁盘 | 批内件 + `-server-i18n` 直发面 |
| 6 | 目录断言随正：`public/` 名单 = 30 档（含 favicon；UI 29）逐名同拍 | 十件随正件复跑 |
| 7 | （若裁拆 app）`app.mjs` ≤300 ∧ `dom.mjs`/`health.mjs` 在盘；`dataShell`/`rowCount`/`HEALTH_POLL_MS`/三态键扫面迁移后复绿；`SHELL_PAGES` 五路径钉表不破 | 批内件 + `-console-layout`/`-console-completeness-2`/`-me-keys-redo-ui` 复跑 |
| 8 | 行为零改（真机）：登录 → 五页点击 → 语言切换（两语）→ 健康灯三态 → 复制钮——浏览器实走（`scripts/console-walkthrough.mjs`） | 收口轮 |
| 9 | 门禁全链：`npm run prepublishOnly` 27 件全绿（含 3×`node --check`） | 实施/收口轮 |

### 2.6 发现（逐条上报——含非阻塞）
① **任务书读数陈旧**：`app.mjs`「≈317」≠ 实读 350（317 = 布局批时点值；其后配额批/配额 v2 批/me-keys 批叠加——设计档 §5 链在案）。设计按 **350** 定锚。
② **注册预案前提失效**：WEBUI §5 注册的 `health.mjs` 单独拆（按 ≈301 时点设计）在 350 盘面下拆后 ≈301——**不回线内**；须扩展（本设计之荐 = +`dom.mjs`）。
③ **越线余额两档**：`views-admin.mjs` 331 ∥ `views-providers-modals.mjs` 367 仍在册，且两档预案标「触发 = 结构轮（#993/#976 同族）」——本批即该结构轮；是否随轮 = 上抛③（未擅自扩边）。
④ **域外发现**：`docs/core/design/API-CONTRACT.md:2626` 载 `HEALTH_POLL_MS | thincoder-server/public/app.mjs:111`——该坐标**现已陈旧**（实读 `app.mjs:140`）；拆分后符号迁 `health.mjs`。该档 = core 面（批外档零触）⇒ 只报；重刷 = `node scripts/api-contract.mjs --write`（工具面 ∥ 另轮）。
⑤ **门禁随动面偏大（如实）**：目录整列断言十件 + 扫描面八件 + 门禁件数七件 + app 源扫三处——结构轮的本质代价；逐处断点 = §2.4（父侧落讫沿跨批写门禁先例）。
⑥ **消费面勘查结论**：i18n 门面外零消费面（`i18n.mjs` 单点取件）；`dom.mjs` 拆分后 `me-keys-redo-ui.test.mjs:95`（取 `h`/`table`/`showSecret` 真件）须改载 `dom.mjs`（随正件之一）；`console-layout:221`/`me-usage-charts-ui:375` 等类名/退役键扫面不受影响（拆后新档零该类残留——实读为界）。

### 2.7 关键决策（全文 = WEBUI §7 KD-SV-51/52）
- **KD-SV-51**：i18n = 四部件 + 聚合门面（域界 = 键前缀；门面保消费面零改；拒运行时直取/动态装载/两拆/不拆）。
- **KD-SV-52**：`app.mjs` = 拆三档（拒：不拆 ∥ 仅拆健康块（≈301 不回线内） ∥ 再拆 api/会话块（余量已足、随动面增））。

### 2.8 上抛（用户批准面——评审 §3 / 批准 §4 裁）
1. **i18n 拆法形态**：四部件 + 门面（拟案）——备选 = 三拆（≈135/135/112）∥ 两拆（≈245 单档，余量薄）；及**命名**（`i18n-{zh,en}-{shell,me,admin,system}.mjs`）。
2. **`app.mjs` 拆否**：拟 = 拆三档（§2.3②）；备选 = 现状接受（越线续存——代价 = 随批续增 + 下次触碰重估）。裁点 = 用户批准面。
3. **余两越线档是否随轮**：`views-admin.mjs`(331) ∥ `views-providers-modals.mjs`(367)——预案在册且触发条件写「结构轮（#993/#976 同族）」；本设计**未扩边**（批记录 §1 条目 = #976/#993 两条）；如需并轮 = 另裁。
4. **域外坐标归口**：`API-CONTRACT.md` 生成区重刷（§2.6④）——另轮/工具面。

### 2.9 fix 轮（设计评审轮 1 修正——§3 八发现逐号落修 + 号外收正；2026-10-08）

- 🔴#1（AC-14 口径收正——`webui/WEBUI.md:524`）：排除面 ⇒ 前缀式（i18n 表族——门面 + 八部件）∥「i18n 三档 CJK 口径」⇒「zh 族 = 唯一 CJK 载体 ∥ `i18n.mjs` 与 en 族零 CJK」∥「三新档静态直发 200」⇒「十新档静态直发 200」；机制决定零动，仅判据面字面收正（`webui/WEBUI.md:104` 同拍自称随之成真）。
- 🟡#2（`design/PROJECT.md:330` R42② 补登记项）：「AC-14 CJK 措辞随回笔同拍」（「三档 CJK 口径（zh 表 = 唯一 CJK 档）」⇒ 族式「zh 族」∥「三新档静态直发」⇒「十新档」——与设计侧 AC-14 行字面同拍）；需求档本体零触（回笔 = 主 agent 笔）。
- 🟡#3（注⑫ 逐件行数 + 越 500 处置——`design/PROJECT.md:237-239` 新补）：十六件逐件「实读 ⇒ ≤±N」（实读 2026-10-08）；越 500 两件处置 = `-quota-v2-member-models`（745）∥ `-console-completeness-2`（**502**——本轮实读发现，原登记 497 已陈）——档位结论 = 拆档（独立笔；本批随正最小改点不动；窗口 = 该件下次独立触及批）。
- 🟡#4（件数收正——四处同拍）：「十四件」⇒「**十六件**」（①–④ 去重并集）：`design/PROJECT.md:165-166`（原 :164）∥ `:330`（原 :319）∥ 注⑫（:229）∥ `webui/WEBUI.md:640`（原 :637）。本块同时收正 §2.4 两处标称：件数「14 件」⇒ 16；③「app 源扫两件」实列三处（`-console-layout` ∥ `-console-completeness-2` ∥ `-me-keys-redo-ui:95`）⇒ 标称 = 三处（件数去重 16 不受累）。
- 🟡#5（`design/PROJECT.md` 三处随正）：`:29` §2.1 webui 行 19 ⇒ **29** + 十件档单（`dom.mjs` ∥ `health.mjs` ∥ i18n 部件八档；含 favicon 全目录 30）∥ `:84` 标题 ⇒ KD-SV-1–52 ∥ `:256`/`:260`/`:262` §7 三行补「⇒ 结构轮后 **29 ∥ 30**」。
- 🟡#6（`webui/WEBUI.md:568` KD-SV-52 否决栏算术收正）：`350−50+1 ≈ 301`（`50` = 删除行数——实读；新档 `≈62` = 删除 50 + 档头/导入 ≈12——与 §5 同源）；两数关系明写。【偏离申报：未按 Suggestion「改 ≈289」字面落——289 系「新档 ≈62」混作「删除 ≈50」的算读；实算余数 ≈301（`app.mjs:137–186` 实读 50 行）——「不回线内」结论保持（与 §2.3②/§2.6② 同源）。父侧/轮 2 如仍取 289 口径 ⇒ 一行可回改】
- 🟡#7（`webui/WEBUI.md:97-99` 折行）：371 字符 ⇒ 三段（198/130/47——零语义；doc-check 行宽闸读数）。
- 🔵#8（视图取件面核实——`webui/WEBUI.md:585` 邻落句）：grep 实读（2026-10-08）= `views-*` 十档零 `app.mjs` import（渲染助手/`t`/`flash` 等全经 `ctx` 注入——`viewCtx()` 单点装配）；i18n 表族 = `i18n.mjs` 单点取件 ⇒ `dom.mjs`/`health.mjs` 拆分与门面保留下视图面零触（零触承载面 = `ctx` 注入——非门面再导出）；§2.6⑥ 消费面勘查句随补（原句仅及 i18n/测试面）。
- 号外（随修发现——已随正）：
  - doc-check 在库红线收正（零语义）：`design/PROJECT.md:150`（321 字符 ⇒ 两段）∥ `:165`（376 字符 ⇒ 两段）折行 ∥ `webui/WEBUI.md:567` 门面引注（`i18n-zh/en.mjs` 合一写法 ⇒ 两档名——锚机检）∥ `design/PROJECT.md:330` 坐标引注（裸 `app.mjs:111` ⇒ 全路径式——锚机检）∥ `webui/WEBUI.md:486-487`/`:505-513` 十行「拟新增」标记形收正（`（结构轮——拟新增）` ⇒ `（拟新增——结构轮）`——锚检查器闭字面「（拟新增」；十行由闸态转「列报 · 不入闸」）。
  - `-console-completeness-2` 实读 **502**（>500 硬线；doc-cleanup 批 497 登记已陈）——登记 + 拆档窗口（见 🟡#3）。
- 机检读数（修正后）：`node scripts/doc-check.mjs`——server 设计两档零闸态（余 = 「拟新增/迁移期引文——列报 · 不入闸」）；仓域余项（悬空 31 ∥ 行宽 35）= core/desktop/vsc 既有（批外）。
- 变更行随补：`webui/WEBUI.md` 变更记录 `:641` ∥ `design/PROJECT.md` 变更记录 `:377`。
- 边界（零动）：产品码 ∥ 批外档 ∥ 需求档本体 ∥ 上抛四项（§2.8）；除判据面字面收正外**零新语义**。

### 2.10 fix 轮（设计评审轮 2 修正——复评残余两枚落地：标称 ∥ 档目链；2026-10-08）
- 标称（= §2.9 🟡#4 申报之实落——§2.4 两处就地收正）：件数「14 件」⇒「十六件」（①–④ 去重）∥ ③「app 源扫两件」⇒「app 源扫三处」（实列三处：`-console-layout` ∥ `-console-completeness-2` ∥ `-me-keys-redo-ui:95`；坐标 `:62` ∥ `:65`）；`design/PROJECT.md:234` 同口径（「③ app 源扫两件」⇒「三处」+ 补 `-me-keys-redo-ui` · `:95` 腿——`load("app.mjs")` 取 `h`/`table`/`showSecret` ⇒ 改载 `dom.mjs`）。
- 档目链（`webui/WEBUI.md` 四处补链——零语义）：`:528` ∥ `:536` ∥ `:540` ∥ `:542` 档目注补「⇒ 结构轮后 **29 ∥ 30**」（与同节已链各处同拍）。
- 变更行随补：`webui/WEBUI.md` 变更记录 `:642` ∥ `design/PROJECT.md` 变更记录 `:378`。
- 机检读数（修正后）：`node scripts/doc-check.mjs`——server 设计两档零闸态（余 = 「拟新增/迁移期引文——列报 · 不入闸」）；仓域余项（悬空 31 ∥ 行宽 34）= core/desktop/vsc 批外（含他批在写档——未归因）。
- 边界（零动）：产品码 ∥ 批外档 ∥ §3 ∥ 设计决策；零新语义（唯标称/链形）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

发现表（结构轮设计评审——对象 = #976 i18n 拆表 ∥ #993 app.mjs 拆分；评审面 = `webui/WEBUI.md` ∥ `design/PROJECT.md` ∥ `requirements/PROJECT.md`；代码档不在评审范围）：

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership（机制级） | 🔴 | 同一「零 CJK 机检口径」两处描述不一：`webui/WEBUI.md:102` 取「排除 i18n 表族——前缀 `i18n-zh*`/`i18n-en*`（门面 + 八部件）」并自称「零 CJK 机检口径（§6 AC-14 同拍）」；而 `webui/WEBUI.md:522`（AC-14 判据行）仍载「（排除 `i18n-zh.mjs` ∥ `i18n-en.mjs` ∥ `index.html`」+「i18n 三档 CJK 口径（zh 表 = 唯一 CJK 档」+「三新档静态直发 200」。按 AC-14 字面容，拆后承载 CJK 的 zh 部件仍在「注释外零 CJK 字面量」扫描面内 ⇒ 验收判据与本次拆分互斥（照写实施必红）；「同拍」自称与事实不符。 | §6 AC-14 行收正为前缀式排除（门面 + 八部件）并同步「三档/三新档」措辞（新档直发面并入十新档）——机制决定不变，仅收正判据行。 |
| 2 | Requirements coverage（跨档滞后） | 🟡 | `requirements/PROJECT.md:147` ∥ `:149` 档目链止于「配置面批后 **19 ∥ 20**」，且 `:149` 仍载「i18n 三档 CJK 口径（zh 表唯一 CJK 档）」；设计侧已「⇒ 结构轮后 **29 ∥ 30**」（`webui/WEBUI.md:518`/`:520`/`:522`）。回笔已登记（`design/PROJECT.md:319` R42②，含「若裁不拆 app ⇒ 27 ∥ 28」），但 AC-14 的 CJK 措辞收正未在登记项内明列。 | 回笔时同拍档目链 + AC-14 CJK 措辞（两行一次改齐——零设计面改动）。 |
| 3 | Affected-file size annotations（判据 8） | 🟡 | 随正件清单（`design/PROJECT.md:227`「随正件 = **十四件断言件**……（断点以当刻盘面为准）」）逐件只给断点坐标，缺各自实读行数与「≤±N」预期增量（注⑥–⑪ 惯例形——如 `:221`「`-quota-v2-member-models` **745** ⇒ ≤±6」）；其中该件自载实读 745 已越 500 硬线（本次三腿触面）——越线处置/声明未写（R3：不升级、不重审，仅登记）。 | 逐件补「实读 ⇒ ≤±N」注（沿注⑩/⑪ 形）；对越 500 件补一句处置（拆分 ∥ 沿随正件不拆的既有口径声明）。 |
| 4 | Document state（件数口径） | 🟡 | 「十四件」断言件与自身四腿列举去重（16 件）不符——并集 = console-completeness-2 · console-list-style · console-modals · console-provider-redo-runtime · console-providers · models-config · server-gateway-webui-deploy · me-keys-redo-ui · provider-model-metadata · quota-v2-member-models · server-i18n · console-layout · me-usage-charts-ui · server-auto-update · me-usage-charts · quota-per-model = 16；件数句另见 `design/PROJECT.md:164`/`:319` 与 `webui/WEBUI.md:637`（皆作 14）。 | 件数或列举二者取一收正（全链四处同拍）。 |
| 5 | Document ownership / 状态同步 | 🟡 | 设计总览三处未随结构轮收正：① `design/PROJECT.md:29` §2.1 webui 行仍「`thincoder-server/public/` 十九档」+ 旧档单（无 `dom.mjs`/`health.mjs`/八部件）；② `:84` §4 标题仍「（KD-SV-1–50）」而表已含 51/52（`:138`/`:139`），变更记录 `:365` 却自称「（标题 1–50 ⇒ 1–52）」；③ §7 判据行档目链止于 19 ∥ 20（`:245` ∥ `:249` ∥ `:251`）。 | 三处随正（§2.1 档目 19 ⇒ 29 并补十件档单 ∥ §4 标题收正 ∥ §7 三行补「⇒ 结构轮后 **29 ∥ 30**」）。 |
| 6 | Clarity（决策理由） | 🟡 | `webui/WEBUI.md:566` KD-SV-52 否决栏「仅拆健康块（≈301——不回线内）」与同档 §5 健康块估「**≈62**」（`:485`）不相容——350−62+1 ≈ 289（回线内）；否决所用旧估（「（350−50+1 ≈ 301）」，`50` 为注册预案时点的旧估）未随实估收正——「健康块单独拆不可行」的理由不成立（三拆决定本身不受累）。 | 否决栏算术以当刻实估重述（或注明取值时点），保持与 §5 同源。 |
| 7 | Methodology compliance（行宽） | 🟡 | `webui/WEBUI.md:97` 新写 bullet 实读 **≈365 字符**（人工计数——估算，非机检），超 doc-check 行宽闸口径（≤300 字符；先例 = `:619` 载「363 字符行 ⇒ 折两行；doc-check 行宽闸读数」）。 | 折行（零语义——折点取「；en 四部件同后缀…」前后）。 |
| 8 | Feasibility（未核验项） | 🔵 | `webui/WEBUI.md:582`「批外档零触」+「门面外消费面（`i18n.mjs` ∥ 视图件 `t()` 面）零改」依赖视图经 `ctx` 取用渲染助手（`h`/`flash`/`usageTable` 等迁 `dom.mjs`）——视图档 import 面不在评审范围（源码档不可读），unverified。 | 核实视图取件面（一次 grep）：若视图直取 `app.mjs` 导出 ⇒ import 同拍收正；否则在设计写明零触承载面（`ctx` 注入 ∥ 门面再导出）。 |

数值抽查（设计判据 8 之 spot-check）通过：键 338 ∥ 343（= 54+58+123+103 ∥ 54+59+127+103，`webui/WEBUI.md:99`/`:503`–`:511`）∥ 部件和 ≈392 ∥ ≈396 + 门面 ≈16（382 ⇒ ≈408 = +26 ∥ 385 ⇒ ≈412 = +27）∥ app 三拆 350 ⇒ ≈192+≈120+≈62（+24，`design/PROJECT.md:164`）∥ 档目 19 ⇒ 29 ∥ 20 ⇒ 30（+10）∥ 小计 3619 + 77 = ≈3696（`webui/WEBUI.md:512`）。

VERDICT: changes-required

计数：🔴×1 ∥ 🟡×6 ∥ 🔵×1（共 8）

### 轮次 2（评审子代理）

复评（轮次 2——修正轮后）——对象 = 批 2026-10-08-server-public-structure（#976 i18n 拆表 ∥ #993 app.mjs 拆分）；核对面 = `webui/WEBUI.md` ∥ `design/PROJECT.md` ∥ `requirements/PROJECT.md`（全读）+ 本档 §2.9 修正申报（引用核对）。口径附注：本轮指令的 review surface 指向 `docs/batches/2026-10-08-residue-sweep.md`（desktop/VSC 他批）——与本对象不符；已按对象声明执行，该档不作本回评审面。代码档不可读、doc-check 不可复跑——涉码/机检读数按申报收录（unverified）。

| # | Orig# | 文件 | Severity | Status | Notes |
|---|---|---|---|---|---|
| 1 | 1 | `webui/WEBUI.md:524`（AC-14 行） | 🔴 | Fixed | 已收正为前缀式排除 + 族式措辞 + 十新档：「（排除 i18n 表族——前缀 `i18n-zh*`/`i18n-en*`（门面 + 八部件） ∥ `index.html`」「i18n 三档 CJK 口径（zh 族 = 唯一 CJK 载体 ∥ `i18n.mjs` 与 en 族零 CJK）」「十新档静态直发 200（`text/javascript`）」——与 §2.2:104「（§6 AC-14 同拍）」已实拍。 |
| 2 | 2 | `requirements/PROJECT.md:147/:149` ∥ `design/PROJECT.md:330` | 🟡 | Fixed | R42② 已补登记「AC-14 CJK 措辞随回笔同拍（「i18n 三档 CJK 口径（zh 表 = 唯一 CJK 档）」⇒ 族式「zh 族」 ∥ 「三新档静态直发」⇒「十新档」——与设计侧 AC-14 行字面同拍）」；需求档两行本体按设计待回笔（主 agent 笔）——登记闭环，不阻塞。 |
| 3 | 3 | `design/PROJECT.md:237-239`（注⑫ 补） | 🟡 | Fixed | 十六件逐件「实读 ⇒ ≤±N」在册；越 500 两件处置明写：`-quota-v2-member-models`（745）∥ `-console-completeness-2`（502——原登记 497 已陈）⇒ 拆档（独立笔；窗口 = 下次独立触及批）。 |
| 4 | 4 | `design/PROJECT.md:166/:229/:330` ∥ `webui/WEBUI.md:640` | 🟡 | Fixed | 四处「十六件」同拍（①–④ 去重 = 16，逐名核对一致）。※ 批档 §2.4 残余见 #9。 |
| 5 | 5 | `design/PROJECT.md:29/:84/:256/:260/:262` | 🟡 | Fixed | §2.1 webui 行 ⇒「二十九档」+ 十件档单（含 favicon 全目录 30）；§4 标题 ⇒「（KD-SV-1–52）」；§7 AC-12/16/18 三行补「⇒ 结构轮后 **29 ∥ 30**」。 |
| 6 | 6 | `webui/WEBUI.md:568`（KD-SV-52 否决栏） | 🟡 | Accepted | 父侧裁定受理（≈301 口径保持——`app.mjs:137–186` 实读 50 可删行）；否决栏已明写「`50` = 删除行数；新档 `≈62` = 删除 50 + 档头/导入 ≈12——§5 同源」。不重复报（依触发说明）。 |
| 7 | 7 | `webui/WEBUI.md:97-99` | 🟡 | Fixed | 原单行长（≈365–371 字符）已折三段（零语义）。 |
| 8 | 8 | `webui/WEBUI.md:585` | 🔵 | Fixed | 「视图取件面核实（2026-10-08 grep 实读）：`views-*` 十档零 `app.mjs` import——渲染助手/`t`/`flash` 等全经 `ctx` 注入」在册（grep 证据 = 修正轮申报——评审面不可复跑）。 |
| 9 | （new） | 批档 `2026-10-08-server-public-structure.md:62/:65` ∥ `design/PROJECT.md:234` | 🟡 | New | §2.9 🟡#4 申报「本块同时收正 §2.4 两处标称」未落：`:62` 仍「**随正件（14 件门禁断言件——跨批写门禁；父侧落讫沿先例）**：」；`:65` 仍「app 源扫两件：」（其后实列三处，含 `…-me-keys-redo-ui.test.mjs:95`）。另设计侧同标签同缺：`design/PROJECT.md:234`「③ app 源扫两件：…（仅 `-console-layout` ∥ `-console-completeness-2` 两腿——缺 `-me-keys-redo-ui:95` 腿）」。→ 标称收正（件数 ⇒ 十六件 ∥ 腿数 ⇒ 三处）或删该申报句。 |
| 10 | （new） | `webui/WEBUI.md:528/:536/:540/:542` | 🟡 | New | §6 四处「档目」注未随结构轮收正（同节八处已「⇒ 结构轮后 **29 ∥ 30**」；其中 `:537` 与 `:536`/`:540`/`:542` 为同一「（本批零新档）」模式却已补链——同模式不同拍）：`:536`「档目 19 ∥ 20 不变（本批零新档）」；`:540` 同；`:542` 同；`:528`「档目随正（+ `model-specs-snapshot.mjs`——19 ∥ 20）」。→ 四处补链（零语义）。 |

VERDICT: pass

计数：10 条 = Fixed ×7 ∥ Accepted ×1 ∥ New ×2 ∥ Unfixed ×0；未决 🔴 = 0（原 🔴#1 已核落）。

## §4 用户批准（主 agent）

### 4.1 父侧代签（用户 2026-10-08 11:38 授权「自动跑」✓）

**三条件齐备** ✓：① **设计评审 pass** ✓（§3 轮次 2 · 🔴 0 · 10 条核讫〔Fixed ×7 ∥ Accepted ×1 ∥ New ×2——两 New 由 §2.10 收尾轮闭合〕）；② **修正轮已落地并逐条核验** ✓（§2.9 + §2.10 + 父侧实读：`:42` 十六件 ∥ `:62` 十六件 ∥ `:65` 三处 ∥ `design/PROJECT.md:234` 三腿 ∥ `WEBUI.md:528`/`:536`/`:540`/`:542` 四链在盘；机检 = server 两档零闸态）；③ **token 已签发** ✓。**代签依据 = §3 轮次 2「VERDICT: pass」+ 计数（Fixed ×7 ∥ Accepted ×1 ∥ New ×2）**。

**父侧直笔（披露）**：§2.2`:42`「随正件 14 件」⇒「十六件」——机械计数收正（#23 上抛项裁 = 收正；就地单处，可逆）。
**实施分派**：产品腿 = eng-coder（十四档：八部件新 + `dom.mjs`/`health.mjs` 新 + `i18n-zh.mjs`/`i18n-en.mjs`/`app.mjs` 改写 + `package.json`）；测试腿 A ∥ B = 随正十六件 + 新批内件一件（分两腿，dependsOn 产品腿）；父侧回填 = 实施后（机检 + 档目链）。

## §5 实施记录（eng-coder）

### 5.1 产品腿实施（eng-coder · 2026-10-08）

**状态行**：实施完成（产品腿十四档落盘——零语义；偏差审计 clean ∥ advisor pass（2026-10-08））

**落盘（十四档——批档 §2.4 清单逐档对齐）**
- 新增 10：`thincoder-server/public/i18n-{zh,en}-{shell,me,admin,system}.mjs` 八部件（域界 = 键首段前缀；`.one` 变体随基键；键序 = 原档相对序）∥ `dom.mjs`（渲染助手 + 提示条——自 `app.mjs` 逐字外拆）∥ `health.mjs`（健康轮询——逐字外拆 + 订阅清零口 `clearHealthListeners`）。
- 改写 3：`i18n-zh.mjs`（382 ⇒ **12**——聚合门面：四部件展开 + `Object.freeze`；`ZH` 导出名不变）∥ `i18n-en.mjs`（385 ⇒ **12**；`EN` 不变）∥ `app.mjs`（350 ⇒ **190**——入口收窄：路由分派 ∥ `api`/`refresh`/`navigate`/`fail` ∥ 会话态 ∥ 启动装配；`viewCtx()` 注入面 17 名逐字不变）。
- 改 1：`thincoder-server/package.json:13`——`prepublishOnly` 清单 26 ⇒ **27**（添 `docs/batches/2026-10-08-server-public-structure.test.mjs`；单行、档行数零变）。
- 逐字边界（唯一增补）：跨模块消费所需 `export` 前缀 5 处（`dataShell` ∥ `onHealth` ∥ `renderHealthLight` ∥ `startHealthPolling` ∥ `stopHealthPolling`）；另 `app.mjs` 头部与 `viewCtx` 注释两处保真收正（「单源住本档」⇒「单源住 `dom.mjs`」——注释保真、非语义，披露在案）。

**行数实读（≤300 全绿）**：`app.mjs` 190 ∥ `dom.mjs` 118 ∥ `health.mjs` 62 ∥ 门面 12 ∥ 12 ∥ zh 部件 73/68/137/122 ∥ en 部件 71/69/141/122（`i18n.mjs` 137 零改）。

**单件机检**：`node --check` ×13 全绿 + `package.json` JSON 核；探针 `.thincoder/tmp/2026-10-08-structure-check.mjs` 实跑 **ALL PASS**——指纹 zh `43366ed4260ed7c8…` ∥ en `fae04763770034ab…` = 设计基线（批档 §2.3）；键数 338 ∥ 343；旧↔新键表 diff 空（onlyOld 0 ∥ onlyNew 0）；部件互斥/并集 = 门面全键 ∥ 域界 = 键首段前缀 ∥ 部内相对序 = 原档相对序 ∥ 键行逐字（含缩进/尾逗号）∥ 段注释 multiset（zh 18 ∥ en 17）∥ en 值零 CJK ∥ app 外拆段逐字（白名单恰 5 行）；`viewCtx` 注入行 ∥ `i18n.mjs:8-9` 取件行逐字；运行时抽样（`t` 缺省 zh ∥ en `.one` 复数取形 ∥ zh 落基键）。改动面实读 = 恰十四档（`git status`/`git diff`；`src/**` ∥ `index.html` ∥ `style.css` ∥ `views-*` 十档 ∥ `nav.mjs` ∥ `modal.mjs` ∥ `model-specs-snapshot.mjs` ∥ `i18n.mjs` 零触）。**未跑仓套件**（父侧收口轮唯一跑点）；测试腿件未投、未跑。

**fix round（实施自纠 2 处——红→绿当轮闭合）**：① `i18n-en-shell.mjs` 初写误收 `usage.*` 块（与 `-me` 重复）⇒ 删净（探针「互斥/并集/注释 multiset」转绿）；② `dom.mjs` `flashTimer` 与 `flash` 间多余空行破坏 227-233 逐字连贯 ⇒ 删行转绿。探针自身一处断言口径收正（`&&` 段数——非产品件）。

**审计/评审轮次与终态**：explore 偏差审计 1 轮 = 四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）**零发现**；advisor 代码评审 1 轮 = **VERDICT: pass**（残项 4 条：🟡×1 = 跨腿协调——门禁链含未落盘批内件〔测试腿待落，批档 §4 声明序〕∥ 🔵×3 = 设计档数字待回填 ∥ `dom.mjs` 顶层 `document` 取件需先桩 ∥ tmp 探针不留存〔锚并入批内件〕）。终态 = **clean**（零 fix 轮换）。

**边界（不做，如实）**：测试件（十六随正件 ∥ 批内件——另腿）∥ 设计档/需求档零触（回填 = 父侧）∥ `src/**` 零触 ∥ 越设计范围改动 = 零。

**【勘误 · 同段自纠】**：上段「探针 55 项断言」更正为 **51 项**（探针终态实跑 PASS=51 ∥ FAIL=0 ∥ `ALL PASS`——机读计数，2026-10-08）。其余读数不变。

### 5.2 测试腿 B（eng-coder · 2026-10-08——随正 8 件落点随动）

**状态行**：实施完成（测试腿 B：改法定稿 + tmp 副本逐件全绿 62/62；原档落讫 = 父侧〔跨批写门禁〕）

**写门禁与落讫路线（父侧 2026-10-08 裁定同拍）**：随正 8 件（`docs/batches/2026-10-0{6,7}-*.test.mjs`）皆他批记录 ⇒ write 被跨批写门禁拒（『the parent agent handles other batch records』）；与设计 §2.4『跨批写门禁；父侧落讫沿先例』一致 ⇒ 不绕门禁，落讫归父侧。本腿产出 = 改法逐处定稿 + tmp 副本实证 + 全量 old→new 清单（交付报告）。

**tmp 副本（落改实证 + 可直替）**：`.thincoder/tmp/2026-10-08-legB/` 八件 = 原档 + 逐处改点（零语义：目录名单/计数 [20,19] ⇒ [30,29]、排除名单 ⇒ 前缀式 `i18n-zh*`/`i18n-en*`、门禁件数 26 ⇒ 27、app 源扫落点 ⇒ `dom.mjs`）；行数 Δ：`-server-i18n` 301 ⇒ 303（+2——`TABLE_FAMILY` 常量），余七件 ±0（皆 ≤±8 设计预算内）；与原档 diff 逐件仅清单点（hunks 8 件 = 10/3/7/1/6/7/3/4——与改点 1:1，零它改）。

**逐件跑读数（`node --test`，cwd = thincoder/；跑对象 = tmp 副本）**：`-server-i18n` **6/6** ∥ `-server-auto-update` **14/14** ∥ `-console-layout` **8/8** ∥ `-me-usage-charts` **3/3** ∥ `-me-usage-charts-ui` **6/6** ∥ `-provider-model-metadata` **6/6** ∥ `-quota-per-model` **7/7** ∥ `-quota-v2-member-models` **12/12**——62/62 全绿；`node --check` ×8 全绿。（批内件 `2026-10-08-server-public-structure.test.mjs` 已在盘 ⇒ 六件门禁存在性循环绿灯前提具备。）

**逐处改点（26 行改动/8 件——全量 old→new 逐字在交付报告；索引）**：① 目录整列 [20,19] ⇒ [30,29] 两件（`-provider-model-metadata:484` ∥ `-quota-v2-member-models:731`）+ 同拍注释；② 排除式前缀化四件（`-server-i18n:42` ∥ `-console-layout:432` ∥ `-me-usage-charts-ui:382` ∥ `-quota-v2-member-models:732` 行宽清单）；③ 门禁件数 26 ⇒ 27 六件（`-provider-model-metadata:493` ∥ `-quota-v2-member-models:428` ∥ `-console-layout:449` ∥ `-server-auto-update:480` ∥ `-me-usage-charts:225` ∥ `-quota-per-model:444`）+ 注释/标题同拍；④ app 源扫落点 ⇒ `dom.mjs` 两处（`-console-layout:166-172` 扫面 ∥ `:439` 行计数键）；⑤ `-server-i18n` 单点五处（`:123` 名单添 `dom.mjs`/`health.mjs` ∥ `:129-130` CJK 载体 ⇒ zh 族 ∥ `:173` import 图面 ∥ `:197` 直发面 ∥ 头部注释同拍）。

**两处设计指针收正（如实——父侧补令已随动）**：① 注⑫ `-quota-v2-member-models · :512`——实盘 `:512` = 死键字面扫描（全 .mjs 面 ∥ 无排除名单 ∥ 拆后零需改——实跑绿，零改在案）；本件随动对象实为 **`:732`** 行宽清单（现只含三门面档 ⇒ 改前缀式取八部件）。② `-console-layout:439`（第二处 app 源扫——设计清单外）已随动。③ `-server-i18n:197` 直发面扩为「`i18n.mjs` + 表族」（11 档）——与设计「含部件」同拍；「十新档直发」面 = 批内件 ④ 腿（已核在盘）。

**边界（不做）**：原档零触（写门禁）∥ 产品码零触 ∥ 设计/需求档零触 ∥ 腿 A 九件零触 ∥ 越清单断言零做。

**待办（移交父侧）**：落讫（可直替副本 or 逐处 old→new）⇒ 新轮复跑（父侧口径）。

**【勘误 · 同段自纠】**：上段两处数字收正——①「26 行改动/8 件」⇒ **改动 53 行/8 件（+55/−53——净 +2 = `-server-i18n` 常量块）**；② hunks 逐件映射明写（件序同交付报告）：`-server-i18n` 10 ∥ `-server-auto-update` 3 ∥ `-console-layout` 7 ∥ `-me-usage-charts` 3 ∥ `-me-usage-charts-ui` 1 ∥ `-provider-model-metadata` 6 ∥ `-quota-per-model` 4 ∥ `-quota-v2-member-models` 7——合计 **41**（与改点族一一对应）。其余读数不变。

### 5.3 测试腿 A（eng-coder · 2026-10-08——新批内件 1 件 + 随正 8 件落点随动）

**状态行**：实施完成（新批内件落盘 6/6 全绿；随正 8 件改法定稿 + tmp 副本 50/50 全绿；原档落讫 = 父侧〔跨批写门禁〕）

**落盘（本腿唯一写面——新批内件）**：`docs/batches/2026-10-08-server-public-structure.test.mjs` 新建——实读 **156 行**（≤500 不拆；设计估 ≈220——回填在父侧）；六腿 = ① 零语义指纹（zh/en 两枚 sha256 基线 ∥ 键数 338 ∥ 343 ∥ 门面冻结）② 部件互斥/并集（八部件两两互斥 ∧ 并集 = 门面全键 ∧ 域界 = 剥 `.one` 首段前缀 ∥ 部件冻结）③ 门面 identity（`i18n.mjs` 取件行 ∥ 缺省 zh ∥ 缺键回退链 ∥ `.one` 复数取形三态）④ 十新档静态直发（200 ∥ `text/javascript; charset=utf-8` ∥ 字节 = 磁盘——真 `static.mjs` 句柄）⑤ 拆分接线（`app.mjs` 零重复定义三项 ∥ 两档导入 ∥ `viewCtx()` 注入面 17 名逐序钉表 ∥ `dom.mjs`/`health.mjs` 导出面）⑥ 行数核（十三档 ≤300 ∥ 硬限 ≤500）。

**写门禁与落讫路线（父侧 2026-10-08 裁决同拍）**：随正 8 件（`docs/batches/2026-10-0{6,7}-*.test.mjs`）皆他批记录 ⇒ write 被跨批写门禁拒（『the parent agent handles other batch records』）；与设计 §2.4『跨批写门禁；父侧落讫沿先例』一致 ⇒ 不绕门禁。本腿产出 = 改法逐处定稿 + tmp 副本实证 + 全量 old→new 清单（交付报告）。

**tmp 副本（落改实证 + 可直替）**：`.thincoder/tmp/2026-10-08-legA/` 八件 = 原档 + 逐处改点（零语义）。diff 实读（vs 原档）：completeness-2 **+9/−7** ∥ list-style **+11/−11** ∥ modals **+7/−6** ∥ provider-redo-runtime **+7/−7** ∥ providers **+4/−4** ∥ models-config **+8/−8** ∥ webui-deploy **+3/−3** ∥ me-keys **+10/−10**（合计 +59/−56；净 +3 = 名单行 2 ⇒ 3 行两件 ∥ healthSrc 行 +1 一件）；逐件 diff 仅清单点，零它改（explore 审计复核在案）。

**逐件跑读数（`node --test`，cwd = `thincoder/`；跑对象 = tmp 副本）**：`-console-completeness-2` 6/6 ∥ `-console-list-style` 7/7 ∥ `-console-modals` 6/6 ∥ `-console-provider-redo-runtime` 3/3 ∥ `-console-providers` 9/9 ∥ `-models-config` 7/7 ∥ `-server-gateway-webui-deploy` 6/6 ∥ `-me-keys-redo-ui` 6/6 —— **50/50 全绿**；`node --check` ×8 全绿；新批内件落盘实跑 **6/6** 全绿（含评审修后复跑）。

**改点清单（8 件——全量逐字 old→new 在交付报告）**：① 目录整列 [20,19] ⇒ [30,29] + 名单添十名八件；② 排除名单前缀式（`i18n-zh*`/`i18n-en*`）四件（`-console-completeness-2:461` ∥ `-console-modals:435` ∥ `-console-provider-redo-runtime:320` ∥ `-models-config:230`）；③ 门禁件数 26 ⇒ 27 一件（`-console-list-style:237` + 注释/标题/头注同拍）；④ app 源扫落点 ⇒ `health.mjs` 一件（`-console-completeness-2:479-480`）；⑤ `load("app.mjs")` ⇒ `load("dom.mjs")` 一件（`-me-keys-redo-ui:95` + 头注/桩说明/桩注同拍）。

**审计/评审轮次与终态**：explore 偏差审计 1 轮 = 四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）**零发现**（唯 🔵×1 = `-me-keys-redo-ui` 副本 `:51` 桩注仍指 `app.mjs`——同族 `:54` 一并收正，副本复跑 6/6 仍绿）；advisor 代码评审 1 轮（对象 = 新批内件）= **VERDICT: pass**（🔵×3 已修：⑤ 定位启发式 ⇒ 锚 `viewCtx()` 正则 ∥ 逐序钉表 ⇒ 加注「有意：顺序变更亦视为注入面变更」∥ 头注「零网络」⇒「零外部网络/零真库（④ 腿 = 环回自持）」；修后 6/6 复跑绿）。终态 = **clean**。

**边界（不做，如实）**：原档零触（写门禁）∥ 产品码零触 ∥ 设计/需求档零触 ∥ 腿 B 八件零触 ∥ 越清单断言零做。

**待办（移交父侧）**：落讫（可直替副本 or 逐处 old→new）⇒ 新轮复跑（父侧口径）。

## §6 验证与收口（父代理）

### 6.1 收口结算（2026-10-08 · 主 agent）

**实施核讫**：产品腿十四档 ✓（§5.1——`node --check` ×13 + 探针 51 项 ALL PASS）∥ 随正十六件**全落**（父侧直替——tmp 副本经两腿审计；落讫后复跑：腿 B 8 件 **62/62** ∥ 腿 A 8 件 + 新件 **56/56**）∥ 新批内件实读 **156 行**（设计估 ≈220——as-built 以本行为准——回填核销）。
**收口闸链（父侧唯一跑点）**：`npm run prepublishOnly`（27 件链）⇒ **tests 201 ∥ pass 201 ∥ fail 0** ✓。
**父侧直笔（披露 · 机械 · 可 revert）**：① `webui/WEBUI.md:533` 落点收正（`app.mjs`——`dataShell` ⇒ 拆面 `dom.mjs`——`dataShell` ∥ `app.mjs`——`SHELL_PAGES`）+ 变更行 `:643`；② `design/PROJECT.md:233` 坐标收正（`:512` ⇒ `:732`）+ 变更行 `:379`；③ `-server-gateway-webui-deploy.test.mjs:13` 头注收正（十二 ∥ 十三 ⇒ 二十九 ∥ 三十——与 `:271-274` 同拍）。
**上抛四项（§2.8）处置**：1/2 = 按拟案落（代签批准面——§4.1）；3 = **不并轮**（批界未扩——余两越线档留册）；4 = `API-CONTRACT.md` 生成区重刷 ⇒ **台账 #1075 入册**（归批——工具面另轮）。
**域外处置**：`views-me.mjs:9` 注释陈旧 ⇒ **台账 #1074**（归批）；`-console-completeness-2` 502 越 500 ⇒ 拆档窗口在册（§2.9 🟡#3——独立笔）。
**台账**：#976 ∥ #993 → **已核销**（证据 = 落点 + 复跑读数）。
**结算同步清单**：角色表 ✓ ∥ 状态行 ✓ ∥ 计数 ✓（本块）∥ 指针 ✓（§2 表 + §2.9/§2.10 重锚）∥ 变更记录 ✓（WEBUI/PROJECT 两档）∥ 待办勾销 ✓ ∥ 前批遗留交叉核 = 无 ∥ 台账可见面 = 结算行随报（本会话）。
**暂缓批复核：无**。
**收口**：记录冻结（回改禁止 · 只读）；批终。
