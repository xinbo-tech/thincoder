# 2026-10-06 · models-config
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 21:39「ACDE」+ 21:40「A需要保留，不能被Provider页吸收……只能在服务模型页面操作」——R24 配置面裁定（需求档 §2:17 在盘）→ 设计轮（排 #87 后）。。
> 台账 = #981（server · 归批）。前情 = 无（独立批——承功能点 17 配置面（R24）；前情批 = docs/batches/2026-10-06-console-modals.md（已收口 2026-10-06））。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-07
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（fix 轮 #95 受理落地（发现 1–7、9——8 = Not an issue 零改；行号锚 = §2 修正块；机检新增悬空 0∕超宽 0））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**本批条目（覆盖）**：功能点 17 配置面落字段（用户 2026-10-06 21:39「ACDE」+ 21:40「A 保留服务模型页操作」——需求档 §2:17 在盘，逐条照它）——A（开放/停用——服务模型页自持操作面；退役模型同口径可停）∥ C（per-model 限流——RPM/TPM）∥ D（展示元数据——自动快照 + 手填说明）∥ E（成本权重——内部估算参考）；**B（默认请求参数）零落**；实现 = 另轮排期（本批 = 设计在盘）。

**边界（本条不含）**：产品码零写 ∥ 测试档零写 ∥ 需求档零笔 ∥ `modal.mjs` 本体重写零涉 ∥ 对外计费语义零触 ∥ 功能点 17/18 边界外不添。

**设计落点（逐档）**：
- `webui/WEBUI.md`：§2.4③ 重写（:114–125——列表同源 + 零上游探针 ∥ 详情弹窗 ∥ 配置四组 A/C/D/E ∥ 保存/取消 ∥ 退役语义 ∥ 与 Provider 页单源协同）∥ §2.2 键族登记（:69——净 ≈+26 键）+ 映射集/细则（:62–63）∥ §5 预算（:169–178——views-models **77 ⇒ ≈235** ∥ `model-specs-snapshot.mjs` 新 ≈80 ∥ i18n/style 增量；小计 ⇒ ≈3154）∥ §6 AC-17 行重写（:191–192——逐条机判）+ 档目 18 ∥ 19 ⇒ **19 ∥ 20** 五处随正 ∥ §7 增 KD-SV-34（:208）∥ §1/§8 随正（:11–17 ∥ :213–214）。
- `gateway/API.md`：§2.2 增「模型设置（`settings`）」（:59–61——形/写面键级合并/读面/存储/校验单源/热生效）∥ §2.1 增模型限流准入（:33）∥ §2 行 + §3 码随正（:26 ∥ :91–92——429 `rate_limited` + `Retry-After`）∥ §4 预算（:100–112——`ratelimit.mjs` 新 ≈90；小计 ⇒ ≈1363）∥ §5 增 AC-17 行（:124）∥ §6 增 KD-SV-35（:134）∥ §7 增 N23–N25/B18/E19（:168–172）∥ §8 边界随正（:177）。
- `store/STORE.md`：§1 版本 3 ⇒ 4（:11）∥ §2 增 v4 增段（:103–111——`ALTER TABLE providers ADD COLUMN settings_json`）∥ §3 迁移链 v4（:122——表不重建 ∥ 判据）∥ §4 预算（:129——⇒ ≈155）。
- `design/PROJECT.md`：§2.1（:25/:28/:29——gateway 十一档 + 模型限流 ∥ store v4 ∥ webui 十九档）∥ §2.2 链 [4] 补限流准入（:45）∥ §4 索引增 KD-SV-34/35（:121–122；标题 1–33 ⇒ 1–35）∥ §6 预算（:137–138——产品面 ≈+526 ∥ 全树 ⇒ ≈7465（58 档））+ 随动表 + 注⑧（:186–187）∥ §7 AC-17 行随正（:209）∥ §9 R24/R30 收正 + R31–R35（:256–263）。

**机制设计**：
- **A（开放/停用）**：开放态 = `provider.models` 成员（单源）；停用 = PATCH `models` 减项（confirm ⇒ 零重启随动 ⇒ 行离列 + flash）；**退役模型（不在上游发现集、仍开放）同口径可停**——本页零上游探针（不引发现面）；重新开放 = Provider 页勾选（其勾选段 = 开放操作；候选需发现数据——归该页）；协同 = 两页同写 `models`、无互斥面。
- **C（per-model 限流）**：检查点 = 派发命中后/转发前；窗口 = 进程内存 60s 定窗（通过即计次 +1；token 于用量到达计入；失败/断开计次不计 token）；超限 = 429 `rate_limited` + `Retry-After`（秒）；限值源 = `settings`（空 = 不限）；热生效 = 既有「校验 → 候选注册表 → 落库 → 换表」四步链（零独立机制）；重启归零（软状态）。
- **D（展示元数据）**：自动行 = 核 `model-specs.mjs` 子集快照（context ∥ maxOutput ∥ multimodal——`thincoder-server/public/model-specs-snapshot.mjs`（拟新增）前缀查表；未知 ⇒「未收录」不套兜底值；零端点零探针）+ 手填「说明」（≤200 字符——存 settings）；快照沿 KD-SV-17 先例。
- **E（成本权重）**：输入/输出两权重（非负；空 = 未设）——存 `settings`；**显式圈界 =「内部估算参考——非计费口径」**（对外计费零触；估算消费面 = 后续轮）。
- **存储/端点（C/E 共用）**：`providers.settings_json`（v4——单列迁移，非新表）+ PATCH `settings` 键级合并（零新端点；读 = GET 行内）；校验单源 = `thincoder-server/src/ops/config.mjs`；配置种子零 settings 字段（控制台单一面）。

**受影响文件与测试面（设计估——实施轮实读回填）**：webui ≈+314（`views-models.mjs` 77 ⇒ ≈235 ∥ `model-specs-snapshot.mjs`（拟新增）≈80 ∥ `i18n-zh.mjs` 312 ⇒ ≈337 ∥ `i18n-en.mjs` 308 ⇒ ≈333 ∥ `style.css` 139 ⇒ ≈165）∥ gateway ≈+171（`ratelimit.mjs`（拟新增）≈90 ∥ provider-admin 197 ⇒ ≈225 ∥ providers 146 ⇒ ≈165 ∥ routes 86 ⇒ ≈100 ∥ errors 56 ⇒ ≈65 ∥ forward 185 ⇒ ≈191 ∥ server 192 ⇒ ≈197）∥ ops ≈+30（config settings 校验）∥ store ≈+11（db 144 ⇒ ≈155——v4 段）；新增 2 档；`package.json` +1（`prepublishOnly`——件数以当刻盘面为准）。**批内件** = `docs/batches/2026-10-06-models-config.test.mjs`（实施轮新建——设计轮零写）；**随正六件**（父侧——跨批写门禁）= `-console-modals`（详情骨架零字段断言 ⇒ 配置四组）∥ `-server-gateway`（迁移读点 v:3 ⇒ v:4）∥ `-server-i18n`（JS 档单 16 ⇒ 17 ∥ 键族）∥ `-server-gateway-webui-deploy`（档目 19 ⇒ 20 ∥ 标题句）∥ `-console-completeness-2` ∥ `-console-providers`（档目名单）+ `thincoder-server/package.json`（添件）——断点以当刻盘面为准；行数 = `design/PROJECT.md` §6 注⑧。

**验收对照（AC-17 → 设计判据行）**：AC-17 = `webui/WEBUI.md` §6 行（① 列表同源 + 零探针 ∥ ② 弹窗复用 + 配置四组（A 停用流含退役可停 ∥ C 限流 ∥ D 快照 ∥ E 权重）∥ ③ C 机检（429 + `Retry-After` + 热生效 + 窗滚）∥ ④ Provider 页单源协同 ∥ i18n/档目随正）+ `gateway/API.md` §5 行（限流面机检）；三链同源：本段条目 = 设计判据行 = 需求 §2:17/AC-17（需求档回笔 = R31——主 agent 笔）。

**关键决策（本批新增）**：KD-SV-34（服务模型配置面 = A/C/D/E 落字段——A 自持操作面 ∥ `settings`（v4 + PATCH 键级合并 ∥ 零新端点）∥ D 快照 ∥ E 内部估算参考；全文 = `webui/WEBUI.md` §7 :208）∥ KD-SV-35（C = per-model 限流——内存定窗 ∥ 429 `rate_limited` + `Retry-After` ∥ 热生效 = 换表链；全文 = `gateway/API.md` §6 :134）——索引 = `design/PROJECT.md` §4（1–33 ⇒ 1–35）。

**上抛项 / 披露**：
- **R31（需求档回笔——主 agent 笔）**：AC-17 行「配置项 = 用户裁定面（未裁前只落详情 + 编辑骨架）」收正（配置项 = A/C/D/E 已裁——设计在盘）+ §2:17 末句「实现序 = 另轮排期（本轮骨架在盘）」随正；设计侧已随正（`webui/WEBUI.md` §6）。
- **R32（C 裁定点——上抛）**：设计取 = ① 存储 `providers.settings_json`（v4——单列非新表）∥ ② 端点 = PATCH 扩 `settings` 键级合并（零新端点）∥ ③ 窗口 = 内存 60s 定窗（重启归零）∥ ④ 拒绝形 = 429 `rate_limited` + `Retry-After`；备选（被否）= 新表 `model_settings` + 新端点族 ∥ 滑动窗 ∥ 持久窗。
- **R33（随正六件登记）**：见「测试面」；行数 = 注⑧。**R34（实施后回填轮）**：预算实读（≈7465 推算值收正）∥ 批内件行数 ∥ 随正六件核销。**R35（跨批顺序披露）**：建议 provider 重做批先行（随正链 18 ⇒ 19 先落）⇒ 本批（19 ⇒ 20）；倒置时断点以当刻盘面为准。
- 非阻塞观察：需求档 §2:17/AC-17 两处措辞随本批设计已陈旧（回笔 = R31）；`#958` 族存量悬空 65 条（非本批——基线读数不变）。

**文档一致化去向**：四档同拍（`webui/WEBUI.md` ∥ `gateway/API.md` ∥ `store/STORE.md` ∥ `design/PROJECT.md`）；需求档零笔（R31——主 agent）；产品码/测试档零写（实施面未开）。**机检** = 改前基线 = 悬空 65 ∥ 超宽 0；首轮 = +2 裸路径（`ops/config.mjs`——已改全路径）+ 6 处超宽（已拆行/收敛）；**终读 = 悬空 65（新增 0——新引用均带「拟新增」标记列报不入闸）∥ 超宽 0（新增 0）**；符号·宽报告面 +34 条（报告态——不入闸）。

### §2 修正块（fix 轮——评审 #95 发现 1–7、9 受理落地 · 2026-10-06）

**逐号落地**（#1–#7 ∥ #9——与交付报告「号 → 改动 file:line」同源；行号 = 本块落时盘面）：

#1 `settings` 提交线形明写（`gateway/API.md` :60–:61——键 = 上游模型名 ∥ 值 = 该模型完整对象（全子字段在册；未设字段显式 `null`；清空 = 显式 `null`；草稿初值来源 = GET 行 `settings` 该键值）∥ `webui/WEBUI.md` :125 同拍 ∥ AC-17（续）机检补 = `webui/WEBUI.md` :364）∥
#2 映射集改述 =「控制台可达码 + 预留」（`webui/WEBUI.md` :62–:63——`rate_limited` 仅 /v1 面产生；键集不动——计数零 ripple）∥
#3 §5 四档实读收正（拟新增 ⇒ 已落盘；行数 = 当刻盘面实读——`webui/WEBUI.md` :339 ∥ :340 ∥ :341 ∥ :344：views-usage **139** ∥ views-overview **74** ∥ views-audit **88** ∥ modal **68**）∥
#4 板级档目链补「⇒ 配置面批后 19 ∥ 20」（`PROJECT.md` :209 ∥ :213 ∥ :215——与 `webui/WEBUI.md` §6 同拍）∥
#5「本批」改批名（实指二轮批——`gateway/API.md` :110 ∥ :114 ∥ `webui/WEBUI.md` :334 ∥ :338）∥
#6 择一 = **§9 报告项**（`PROJECT.md` R39 :273——披露口径沿 R30；退役且已停用模型 ⇒ 控制台零重开径；「不做」清单零涉）∥
#7 数字收正（`PROJECT.md` :138 产品面 ⇒ ≈+527 ∥ :139 全树 ⇒ ≈7467 ∥ :146–:147 域表 store 行对齐 `store/STORE.md` 实读链；派生随动 = :140 ∥ :150 ∥ :268 ∥ :270——样式链 ⇒ ≈7493）∥
#9 注⑧「v4 读点」逐点列明（`PROJECT.md` :192——SCHEMA_VERSION/readVersion/迁移返回/失败探针版本 + 消息文案；行号以当刻盘面为准）。
#8 = **Not an issue**（对象面声明笔误——零设计改动；仅对账列出）。

**偏离与披露**（上抛）：
- #7 取 **≈+527 ∥ ≈7467**（分项和闭式：314+171+30+11+1 = 527；6940+527 = 7467）——裁定文本「7466」对应 526 口径（须做无依据的 −1 分项改动）；样式随动 ≈7491 ⇒ ≈7493。
- `db.mjs` 当刻 KD-4 实读 **143** ∥ `store/STORE.md` §4 记 144（差 1——疑 v3 回填轮计数，该档未动）——归回填轮复核。

**机检读数**（`node scripts/doc-check.mjs --root d:/teamcode/thincoder`）：开工 = 悬空 65 ∥ 超宽 0（候选 50294）；落点 = 悬空 65 ∥ 超宽 0（候选 50304——新增引用均可解析）⇒ **触面（本批三档）新增悬空 0 ∥ 新增超宽 0**。

**变更记录同落**：`webui/WEBUI.md` :417 ∥ `PROJECT.md` :307 ∥ `gateway/API.md` :203（`store/STORE.md` 零触——本轮无其面改动）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审轮（评审对象 = R24 配置面落地设计——功能点 17 A/C/D/E；批 docs/batches/2026-10-06-models-config.md；实读四档 = docs/server/design/{webui/WEBUI.md ∥ PROJECT.md ∥ gateway/API.md ∥ store/STORE.md}）

限定/面：无项目标准档 ∥ 无文档地图（文档所有权 = 降级判定，按 AGENTS.md + 既有文档体系口径抽检）；需求档（docs/server/requirements/PROJECT.md）与 ops/OPS.md 不在评审面——覆盖度/预算按在面引用（需求 §2:17 ∥ 板档 R24/R30–R35）核对；只读评审，零改动。覆盖、可行性、机制一致性（A/C/D/E 跨四档描述一致；v4 迁移链 ∥ PATCH 合并 ∥ 内存定窗 ∥ 429 形均可实现）未见 🔴。

| # | 类别 | 级别 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 清晰度/验收 | 🟡 | PATCH `settings` 提交线形未明：服务端语义 = 键级整对象替换（gateway/API.md:60「写面 = PATCH 键级合并（请求 `settings` 出现的键 = 整对象替换」），控制台侧仅写「键级合并——单键提交」（webui/WEBUI.md:124）——若实现为只提交变更子字段，同键其余字段（tpm/costIn/costOut/note）被整对象替换清空（静默丢配置）；「空输入 ⇒ null」映射与草稿初值来源未写；AC-17（续）未覆盖「部分字段保存 ⇒ 其余字段保留」 | 明写线形（键 = 上游模型名；值 = 完整对象，未设字段显式 `null`；清空 = 显式 `null`）+ 补一条机检（部分字段保存后其余保留 ∥ 单字段清空不误伤） |
| 2 | 一致性 | 🟡 | `err.rate_limited` 计入「控制台可达码全集」（webui/WEBUI.md:62「映射集 = 控制台可达码全集」），但 429 `rate_limited` 仅 /v1 转发链产生（gateway/API.md:33「派发命中后、转发前检 per-model RPM/TPM」）；控制台「数据全经 `/api/*`」（webui/WEBUI.md:42）且「直连 `/v1/models`（无团队 key）」（webui/WEBUI.md:126 不做项）⇒ 该码不可达——与同集缺 `quota_exceeded` 口径不一致 | 二择：① 改述「可达码 + 预留」（注明仅 /v1 面产生）；② 移出映射集（新增键 27 ⇒ 26，§2.2/§5 键数同拍） |
| 3 | 文档状态 | 🟡 | §1 与 §5 同档标记矛盾：§1 记 views-usage/views-overview/views-audit/modal 为「已落盘」（webui/WEBUI.md:10「`views-usage.mjs`（已落盘——全队用量 + 看板——§2.3②）」）；§5 同四档仍「（拟新增）」+ 设计估（webui/WEBUI.md:338「`views-usage.mjs`（拟新增）」；modal = :343）——行数口径（设计估 vs 实读）同轴不一致 | 按当刻盘面实读一次，两侧同步（拟新增 ⇒ 已落盘 ∥ 行数收正） |
| 4 | 文档状态 | 🟡 | 板级 §7 档目链未随本批收正：AC-12/AC-16/AC-18 停在「provider 重做批后 18/19」（PROJECT.md:207 ∥ :211 ∥ :213），未含 WEBUI §6 已写入的「⇒ **19 ∥ 20**（配置面批后）」（webui/WEBUI.md:357 ∥ :361 ∥ :365）——沿 provider 重做轮先例（该轮曾同步板级 AC-12/AC-16） | 板级三行补「⇒ 配置面批后 19 ∥ 20」（与随正件档目断点同拍） |
| 5 | 文档卫生 | 🟡 | 预算表「本批」相对指代残留（实指他批）：gateway/API.md:109 system.mjs 行「本批 +≈5 = `embedding` 字段」（实为 console-completeness-2 批增量）与本档小计「服务模型配置面批估：…system ±0」（gateway/API.md:113）并读矛盾；同档小计「（本批 +≈185 = embedding-admin 新 ≈110」同指他批；webui/WEBUI.md:333 ∥ :337 同型 | 「本批」逐处改批名（沿 WEBUI §5 命名口径） |
| 6 | 边缘/披露 | 🔵 | 退役（不在上游发现列表）且已停用 ⇒ 控制台零重开路径：Provider 页「本窗不可勾/不可停」（webui/WEBUI.md:139）∥ 服务模型页列表 = 开放集 ⇒ 行不在——仅 API 级 PATCH `models`；末态未披露 | 入 §9 类报告项披露（口径沿 R30）或显式入「不做」清单 |
| 7 | 数字漂移 | 🔵 | 预算自洽小差：PROJECT.md:138「产品面 ≈+526」与分项和 527（+package.json +1）差 1；:139「全树 ≈7465 行」与 6940+526 = 7466 差 1；板级域表 store 行「≈175 ⇒ 110 ⇒ 124」（PROJECT.md:146）未随 STORE.md:129「**124 ⇒ ≈160 ⇒ 144**（实读——v3 落地后）**⇒ ≈155**（服务模型配置面批 +≈11」收正 | 回填轮一并收正（store 行可先对齐实读） |
| 8 | 对象面 | 🔵 | 评审对象声明「A 成员停用」vs 设计/板档 R24 的 A = 模型开放/停用（PROJECT.md:256「A（开放/停用——**服务模型页自持操作面」）——对象面待确认（若确指成员面则本设计未覆盖） | 确认 A 指模型面（声明笔误）即可——零设计改动 |
| 9 | 完备性 | 🔵 | 注⑧对基准件仅列「v4 读点」（PROJECT.md:189「`-server-gateway` **496** ⇒ ≤±6（v4 读点）」），未沿注④⑤先例逐点列明（失败探针版本+消息文案再进一档 ∥ SCHEMA_VERSION/readVersion ⇒ 4——现值以当刻盘面为准） | 实施轮按盘面自查 v4 全改点（沿 PROJECT.md:185 注⑤口径列点） |

计数：🔴 0 ∥ 🟡 5 ∥ 🔵 4 ∥ 合计 9
VERDICT: pass

### 轮次 2（评审子代理）

修复核验轮（评审对象 = R24 配置面落地设计修复 claims——评审 #95 发现 1–7、9（#8 = Not an issue，对账在案）；批 `docs/batches/2026-10-06-models-config.md` §3 ∥ §2 修正块 :43-63；实读四档 = docs/server/design/{webui/WEBUI.md ∥ PROJECT.md ∥ gateway/API.md ∥ store/STORE.md}）

限定/面：无项目标准档 ∥ 无文档地图（文档所有权 = 降级判定——按设计集自载地图（PROJECT §3）抽检：修复轮改动均落在属主档（WEBUI/API/PROJECT），`store/STORE.md` 零触正确）；源文件行数（139/74/88/68 等实读）与 doc-check 读数 = 声明面外（本轮未复跑——工具面不可达）——按在面一致性 + 批块/档面互证核。修复 claims 逐号核验：#1–#7、#9 内容逐项落位（#1 线形三处同拍 ∥ #2 改述 + 键集 27/净 26 零 ripple ∥ #3 四档实读 139/74/88/68 + 已落盘 ∥ #4 板级 AC-12/AC-16/AC-18 三行 19 ∥ 20 ∥ #5 四处改批名（二轮）∥ #6 R39 增（「不做」清单零涉）∥ #7 527/7467/7493 分项闭式 + 域表 store 行对齐实读链（偏离「7466」已披露）∥ #9 v4 读点逐点）——未见 🔴。残留：#5 类「本批」两处未清；行号锚多处差 1–2 行；API §4 两档「拟新增」标记疑陈（源面外——未核）；ops config.mjs 逐档行注在四档未见（明细档面外——未核）。

| # | 类别 | 级别 | 发现 | 建议 |
|---|---|---|---|---|
| 1 | 修复核验（#5 残留） | 🟡 | 「本批」异指残留两处未清：`docs/server/design/webui/WEBUI.md:338`「**⇒ 本批重做拆分两档**」（实指 provider 重做批），与同 §5 表内 `WEBUI.md:344`「本批 +≈158」及 :348/:350/:351（实指服务模型配置面批）同表异指；`WEBUI.md:69`「本批净 ≈−1/表」（实指 provider 重做批）与 :70「（服务模型配置面批——两表逐键同步；本批）」并读异指——#5「逐处改批名」未全扫 | 沿 §5 命名口径改批名（或补批次戳）；同型散置（§1/§3/AC 行）逐处同拍 |
| 2 | 修复核验（行号锚） | 🔵 | 修正块行号锚与当刻盘面差 1–2 行（内容逐项核实落位）：#1（批块 :47）引 `webui/WEBUI.md` :364 → 实读 :366 ∥ #3（:49）引 :339 ∥ :340 ∥ :341 ∥ :344 → 实读 :341 ∥ :342 ∥ :343 ∥ :346 ∥ #4（:50）引 `PROJECT.md` :209 ∥ :213 ∥ :215 → 实读 :211 ∥ :215 ∥ :217 ∥ #5（:51）引（WEBUI）:334 ∥ :338 → 实读 :336 ∥ :340 ∥ #6（:52）引 :273 → 实读 :275 ∥ #7（:53）引 :138 ∥ :139 → 实读 :139 ∥ :140（派生 :150 ∥ :268 ∥ :270 → :151 ∥ :270 ∥ :272）∥ #9（:54）引 :192 → 实读 :193；精确命中 = `gateway/API.md` :60–:61 ∥ :110 ∥ :114 ∥ `webui/WEBUI.md` :125 | 行号锚按当刻盘面收正（或统一注「行号以当刻盘面为准」——注⑨口径） |
| 3 | 受影响文件注 | 🔵 | 本批受影响文件表 ops 行仅域级聚合（批块 :29「ops ≈+30（config settings 校验）」；`PROJECT.md:140` 同）——`ops/config.mjs` 无逐档当刻行数/预期增量注（webui/gateway/store 三域均逐档）；ops 明细档面不在本评审面——未核 | 补 `config.mjs` 当刻行数 ⇒ 预期增量一行（口径对齐同批三域），或在 ops 档面核存 |
| 4 | 标记复核项 | 🔵 | `gateway/API.md:111` ∥ :112 两档（`embedding-admin.mjs` ∥ `overview.mjs`）仍「拟新增」+ 设计估——若二轮实施已落盘（其 webui 四档盘面实读已录——#3）则与 #3 同型未随；源面不在本评审面——未核 | 按当刻盘面复核两档标记（拟新增 ⇒ 已落盘 ∥ 设计估 ⇒ 实读） |

计数：🔴 0 ∥ 🟡 1 ∥ 🔵 3 ∥ 合计 4
VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent · 2026-10-06 23:0x——代执行）**

**代执行口径**（承用户 2026-10-06 22:05「好，后续你自动跑完」全链放行）：设计（§2 + 修正块）→ 评审轮 1（设计评审：**pass** + 9 条发现——🔴 0 ∥ 🟡 5 ∥ 🔵 4；§3 轮次 1 在档）→ 修复轮（发现 1–7、9 受理落地——发现 8 = Not an issue；§2 修正块 :43–63）→ **修复核验：pass**（8 条 claims 全核到落位 ∥ 残留 1🟡 + 3🔵 非阻塞）⇒ **批准进入实施**。

**三条件核验**：① 评审 pass（0🔴）✓（reviewId 不落档——沿纪律）；② 修复轮已落地并经核验 ✓（核验轮逐处复核 + 盘面抽读全中）；③ designToken 已签发 ✓（凭据值不落档；换发版在握）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（两棒落地（服务端九档 ∥ 前端+门禁面）；背离审计 1 轮 ∥ 代码评审 1 轮 changes-required → 修复轮（拆档+补腿）→ 第 2 轮 pass；终态 clean；上抛 U1–U8 见段内）

**交付摘要**（本棒 = 服务端九档；前端面 `public/**` = 另一棒，本棒零触）：

- `store/db.mjs`：v4 迁移段——`ALTER TABLE providers ADD COLUMN settings_json TEXT NOT NULL DEFAULT '{}'`（列级 ALTER、表不重建；MIGRATIONS 追段 ⇒ `SCHEMA_VERSION=4`）。
- `gateway/ratelimit.mjs`（新）：进程内 60s 定窗 `check`∥`record`；时钟可注入（`createRateLimiter({ windowMs, now })`）；`Retry-After` 秒（≥1——距窗尾）；空限值 = 不限（零状态）。
- `gateway/providers.mjs`：`rowToEntry` 解 `settings_json`（坏行拒启）∥ 注册表携 settings ∥ `settingsFor`；种子径注释登记「settings 不入列」。
- `gateway/provider-admin.mjs`：GET 行载 `settings` 全图 ∥ PATCH 键级合并（`mergeProviderSettings`——出现键整对象替换／值 `null` ⇒ 删键／未出现键不动）→ 单源校验 → 写 `settings_json` + 换表。
- `gateway/routes.mjs`：chat 链 [4.5] 准入（派发命中后／转发前；通过 ⇒ 计次 +1）——超限 429 `rate_limited` + `Retry-After` 头；`onUsage` 串联（用量到达计入）。
- `gateway/errors.mjs`：`rate_limited`（429／`rate_limit_error`）+ `HttpError`/`sendJson`/`sendError` 可选 headers。
- `gateway/forward.mjs`：`onUsage` 钩子（用量到达即回调；异常不反噬；失败/断开 tokens=null ⇒ 不调）。
- `gateway/server.mjs`：`failRequest` 透传 `err.headers`（`Retry-After` 落头）。
- `ops/config.mjs`：`validateProviderSettings`（校验单源——未知子字段∥非法值 ⇒ 拒／400）；`validateProviderEntry` 出参携归一 settings（逐键全子字段在册）。

**自跑读数**（临时件 `.thincoder/tmp/models-config-smoke.mjs`——不入仓；跑法 `node .thincoder/tmp/models-config-smoke.mjs`，cwd = `thincoder/`）：**SMOKE PASS**（两跑均绿）：

① 空库：`SCHEMA_VERSION=4` ∥ `settings_json` 列 NOT NULL DEFAULT `'{}'`；② v3 库 ⇒ 迁 v4（存量行 `'{}'`）∥ 再开幂等（列不重、行不丢、版本 4）；③ rpm=1 ⇒ 第 1 请求 200 ∥ 第 2 请求 **429 `rate_limited` + `Retry-After: 40`**（message 含模型/限值）∥ 429 不转发不落用量；④ 注时钟 +61s 滚窗 ⇒ 恢复放行；⑤ tpm=2 ⇒ 第 1 请求 200（用量 2 到达计入）∥ 第 2 请求 429（token 计数口径）；⑥ 键级合并（部分字段保存 ⇒ 其余保留 ∥ 单键 `null` ⇒ 删键 ∥ 未出现键不动）；⑦ 非法值（rpm=0／tpm=−1／costIn=−1／note 超 200／未知子字段／settings 非对象）⇒ 400 `invalid_request_error` ∥ 库与读面零变 ∥ 后续请求照常 200。九档 `node --check` 全绿；全档 < 300 行。

**决策透明表**（实现自定——设计未明处；审计与评审均裁定「无设计冲突」）：

| # | 自定 | 依据 |
|---|---|---|
| D1 | settings 值对象缺子字段 ⇒ 服务端归一到显式 `null`（不拒） | 提交线形（全对象）= 对控制台的线形约束；非法判据清单（未知子字段∥非法值）不含缺省 ⇒ 缺省 = 未设（`store/STORE.md` §2 v4：「`null`/缺省 = 未设」） |
| D2 | `note` 长度按 UTF-16 code units（`String.length`——与 HTML `maxlength` 同口径） | 「≤200 字」未钉口径；前后端边界一致（前端建议沿用 maxlength） |
| D3 | `config.json` 种子若手写 `settings` ⇒ 校验接收但导入忽略（不落库、不报错） | 种子零 settings 字段（控制台单一面——KD-SV-34）；手工种子面不做；已注释登记（`providers.mjs` 种子导入注） |
| D4 | 限流器 = 工厂（`createRateLimiter`），非常驻模块级单例 | 时钟可注入（「注时钟滚窗 ⇒ 放行」腿）+ 进程内存定窗；`routes.mjs` 注册期建单实例（批内件可注时钟） |

**审计与代码评审轮次与终态**：

- 背离审计（explore·只读）：1 轮——PARTIAL 0 ∥ SILENT-SIMPLIFICATION 0 ∥ OUT-OF-LIST 0；本棒内零背离（发现 2 条均他批面／回填轮面——见上抛 U2/U3），零代码修复。
- 代码评审（advisor）：第 1 轮 changes-required（1🔴/2🟡/2🔵）→ 响应轮（fix 2 处 + 裁定引用 3 条）→ 第 2 轮 **pass**：🔴#1 = Accepted（批内件归前端棒——评审对象声明排除）∥ 🟡#2 = Accepted（随正六件·父侧在案）∥ 🟡#3 = Accepted（设计口径 + 注释登记）∥ 🔵#4 = Accepted（R34 回填轮）∥ 🔵#5 = Fixed（注释登记核到）；新增问题 0。
- 终态：**clean**（无未决本棒项）。

**fix round**（评审响应）：`gateway/providers.mjs` 种子导入注释登记「settings 不入列」（:130）∥ `gateway/ratelimit.mjs` 桶有界口径登记（:26）——两处零语义；fix 后 smoke 复跑 SMOKE PASS。

**上抛 / 披露（父侧）**：

- U1（批级跟进）：批内件 `docs/batches/2026-10-06-models-config.test.mjs` 未落盘——任务书裁定归前端棒（本棒不写测试件）；须在批收口前由前端棒建、父侧接线（`package.json` `prepublishOnly` 添件），否则 AC-17 机检载体缺失。
- U2（他批面残留——未触，请父侧裁定）：`gateway/provider-admin.mjs` 发现失败消息 4 处尾句「——可手填模型清单降级」（`:187` ∥ `:194` ∥ `:201` ∥ `:205`）+ 档头 `:12`「手填降级照常」——与现行「无手填兜底」裁定（`gateway/API.md` §2.2 发现行 ∥ 用户 21:36）相抵；零语义文本改动（删尾句），归 provider 重做批面。
- U3（回填轮）：设计档预算「拟新增」标记与行数未回填（R34 在案）——九档实读：db **150** ∥ ratelimit **64** ∥ providers **167** ∥ provider-admin **220** ∥ routes **101** ∥ errors **63** ∥ forward **196** ∥ server **192** ∥ config **252**。
- U4（随正件）：既有两件断言 v:3 ⇒ v:4（`-server-gateway` ∥ `-console-completeness-2`）——R33 在案（父侧随正六件），未落地前 `prepublishOnly` 门不成立。
- U5（并行写面观察）：工作树另有 `public/**` 修改与 `-console-provider-redo.test.mjs` 未跟踪件（他棒在途）——本棒零触，仅供父侧对账。

### §5 追加（前端 + 门禁面棒——2026-10-06；同批第二棒）

**交付摘要**（本棒 = `public/**` 前端 + 批内件；服务端零触）：

- `public/views-models.mjs`（77 ⇒ 194 行）：配置四组 A（停用流——confirm ⇒ PATCH `models` 减项 ⇒ 关窗 + 行离列 + flash）∥ C（RPM/TPM——正整数/空 = 不限）∥ D（快照查表 + 手填说明 ≤200）∥ E（成本权重 +「内部估算参考——非计费口径」注）；保存 = PATCH `settings` 单键全对象（其余字段不丢）；导出 `openModelModal` + 纯函数 `modelsWithout`/`draftFromSettings`/`settingsValueFromDraft`。
- `public/model-specs-snapshot.mjs`（新 103 行）：核 `model-specs.mjs` 快照（74 行 ∥ context/maxOutput/multimodal 子集）∥ `specForDisplay` 前缀查表（大小写不敏感 ∥ 厂商命名空间剥离 ∥ 未知 ⇒ `null` 零兜底）；漂移件断在批内件。
- `public/i18n-zh.mjs` 302 ⇒ 328 ∥ `i18n-en.mjs` 298 ⇒ 324（+27 −1 = 净 +26；`admin.models.configSkeleton` 退役 ∥ `err.rate_limited` 在册）。
- `public/i18n.mjs`：`ERROR_CODES` 加 `rate_limited`（113 ⇒ 113——AC-17（续）「入映射集」必需面）。
- `public/style.css` 146 ⇒ 157（配置面样式块 + `.hint.error`）。
- `thincoder-server/package.json`：`prepublishOnly` 加本批两件（13 ⇒ 15 件）。
- `docs/batches/2026-10-06-models-config.test.mjs`（**267 行**——纯函数/静态面腿 ①③⑤⑥⑧⑨⑩）∥ `docs/batches/2026-10-06-models-config-ui.test.mjs`（**462 行**——运行面腿 ②④⑦a–e）：**拆档**（设计予案 = `PROJECT.md` 注⑧「越 500 硬线 ⇒ 沿注③拆档预案」——首版单件 657 行越硬限，评审 🔴 ⇒ 拆档修复；两件同入门禁）。

**自跑读数**：两件 `node --test` 全绿（主件 7/7 ∥ 运行面件 7/7——含真网关两腿：PATCH `models` 减项 ⇒ `/v1/models` 随动 + 派发 404；PATCH `settings` ⇒ 超限 429 `rate_limited` + `Retry-After` + 桩时钟窗滚 ⇒ 恢复放行）∥ 改动档 `node --check` 全绿 ∥ 静态自检（⑨ 腿）：档目 20 ∥ 19 逐名同拍 ∥ 全 `public/**` 零外链 ∥ 键引用闭合 ∥ 两新档静态直发 200。

**决策透明表**（实现自定——设计未明处）：

| # | 自定 | 依据 |
|---|---|---|
| D1 | 批内件拆两档（`-ui` 后缀件）——首版单件 657 行越 500 硬限 | 项目 `F3-1`/`F-R24a`「>500 不允许诞生」+ 设计注⑧拆档予案；两件同入 `prepublishOnly`（⑩ 腿双件断言） |
| D2 | 数值输入 = `type="text"` + `inputmode="numeric"`（非 number） | number 型对非法文本吞成空串 ⇒「非法」会静默降级为「未设」；自走校验（前端先行 + 服务端复核） |
| D3 | 说明长度 = HTML `maxlength=200`（不在 JS 复制长度判据） | 第一棒 D2 已钉「UTF-16 code units（与 `maxlength` 同口径）」；服务端复核为准 |
| D4 | 保存成功后本地 `entry.settings` 就地更新（不重取列表） | 弹窗留驻口径（§2.4③）+「部分字段编辑不丢其余字段」——重开草稿同源、零多余往返 |
| D5 | 多模态未声明 ⇒ 显示「—」（复用 `fmtValue`）而非「否」 | 核表语义 =「仅 true / undefined」——「否」系过度断言；「—」为既有语言中性缺省 |

**审计与代码评审轮次与终态**：

- 背离审计（explore·只读）：1 轮——PARTIAL 0 ∥ SILENT-SIMPLIFICATION 0 ∥ OUT-OF-LIST 0（快照 74 行与核表逐行全等；写面仅 GET/PATCH 两族；嵌入行四组零落）。
- 代码评审（advisor）：第 1 轮 changes-required（1🔴/3🟡/2🔵——🔴 = 批内件 657 行越限；🟡 = 载体缺「空态 ∥ Provider 协同」两腿 + 随正协调项；🔵 = i18n >300 已裁 ∥ 设计回填在案）→ 修复轮（拆档 + 补两腿：⑦d 空态 ∥ ⑦e Provider 协同驱真件 `openProviderDetailModal`）→ 第 2 轮 **pass**（5 项逐条核到：#1/#2 = Fixed；#3/#4/#5 = Accepted；新增 1🔵 = 拆档后文档登记滞后（R34 面内，不阻收口））。
- 终态：**clean**（本棒无未决项；R34 文档回填 = 父侧登记轮）。

**上抛 / 披露（父侧）**：

- U6（随正面扩）：`prepublishOnly` 现 15 件——设计登记六件之外，`-server-auto-update.test.mjs`（13 件等值断言）与在途 `-console-provider-redo.test.mjs`（19/18 档目）同受牵动，须并入父侧随正/核销面（以当刻盘面为准）。
- U7（拆档登记）：`-ui` 件名与双行数（267 ∥ 462）未入设计/批档——R34 回填轮一并收正；`package.json` 添件已由本棒落盘（勿重复添件）。
- U8（批量观察）：工作树另有他批在途件（`views-providers-modals.mjs` ∥ `-console-provider-redo.test.mjs` 未跟踪）——本棒零触；⑦e 腿只读引用（`openProviderDetailModal`），其面变动会联动本件报红（单源协同护栏）。

## §6 验证与收口（父代理）

**§6 核验与收口（主 agent · 2026-10-07 00:5x）**

**实施（四棒浪第 2/3 棒）**：eng-coder #104（服务端九档）+ #106（前端+门禁七档）——均 initial。#104：子内审计 clean ∥ 代码评审两轮（changes-required → pass，全 Accepted/Fixed）∥ 零语义 fix 两处。#106：审计 clean ∥ 评审两轮（1🔴 = 拆档 + 补 ⑦d/⑦e 腿 → pass）。落点：v4 迁移（`store/db.mjs`）∥ `ratelimit.mjs` 64 ∥ settings 全链（providers/provider-admin/routes/errors/forward/server/ops-config）∥ `views-models.mjs` 77 ⇒ 194 ∥ 新档 `model-specs-snapshot.mjs` 103 ∥ i18n 328/324 ∥ `style.css` 157 ∥ `package.json`。

**批内件**：`-models-config.test.mjs`（267 行）+ `-models-config-ui.test.mjs`（462 行——单件越 500 硬限按设计注⑧预案拆档）——双件 **7/7 ∥ 7/7**；**父侧门禁链内并入复跑通过**。

**父侧动作**：① 随正全扫（八文件——本批相关：`-server-gateway` v3⇒v4 + 失败探针 v4⇒v5 ∥ `-console-completeness-2` ①/⑥（v4 + 档目 19∥20）∥ `-server-presets` 三处 `settings: {}`（validate 出参形）∥ 档目链全量 ∥ `-server-i18n` JS 档单 15 ∥ 门禁 17 件）；② **设计小修**（父侧直接执行 · 可 revert）：`webui/WEBUI.md` AC-19 续白名单补「∪ 布局组变量（`--nav-w`）」——#107 上抛的设计内部张力裁定（具体条款 S15/底座为准）；③ `package.json` 两件在列（#106 已落——父侧核销未重复）。

**披露处置**：U1 已落（批内件双件入闸）∥ U2 光笔（provider-admin 五处——见 `docs/batches/2026-10-06-console-provider-redo.md` §1 补记）∥ U3 回填轮 #983 ∥ U4 已核销（v3⇒v4 两件随正落地）∥ U5 观察项（并行写面对账核讫）∥ D1 拆档采纳 ∥ D2 `i18n.mjs` ERROR_CODES 采纳（映射集必需面）∥ D3 package.json 已落。

**核验读数**：`npm run prepublishOnly` = **140/140 ∥ 0 fail ∥ exit 0**（2026-10-07 00:4x）。

**台账号**：#981 在途 ⇒ 待核销 ⇒ 已核销（evidence = 本 §6 + 门禁读数）。

**欠账（已入账）**：#983（回填轮——R34/R36 实读收正）。
