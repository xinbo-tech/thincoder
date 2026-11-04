# Thincoder Server · 我的面（docs/server/design/webui/ME.md）

> 域总览与壳面 = `docs/server/design/webui/WEBUI.md`。

## 1. 关键决策（本面）

| # | 决策 | 理由 |
|---|---|---|
| KD-SV-47 | **「我的·key 与签发」页 = 多把并存工作台**（功能点 25）：API Key 表六列（名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作）+ 页首「签发新 API Key」（弹窗——名称可空）+ 行内「吊销」（弹窗——后果文案；零原生 `confirm`）+ 页级一次性秘密区（复制钮——`showSecret` 全局随动）+ 接入卡成员面（`accessCard` 同源复用——admin 面零改）+ 空态引导；**「轮换」页面下架**（端点保留——全断操作与逐把模型相抵；需求 ① 留否 = 否）；页面非壳（钉表五页不扩） | 用户「太草率」+「可以」+ 附加两令（名称 ∥ 多把）；多把模型 = 加一把/吊销一把（全换无位）；秘密面复用 `showSecret`（一处随动三处受益）；接入卡单源（防两卡漂移） |
| KD-SV-49 | **「我的·用量」页 = 本人面轻量图表**：页形 = 本档 §2.2（概览卡 ∥ 筛选行四控件 ∥ KPI ∥ 按日堆叠柱主图（维度切换 = 端点/模型——零依赖柱件复用；段色 = `--accent` 透明度阶梯）∥ 分模型区（请求数 ∥ tokens ∥ 本月已用）∥ 明细表）；**导出不设**；壳面五页钉表维持（报表卡不承缩 + 明细承缩——高度链 +2 行）；管理面专属面收窄 = 跨成员过滤/排行 ∥ CSV 导出 ∥ 看板页 | 用户「单薄……更多的图表」；数据面本人过滤复用（`usageSummary({memberId})` 既有 + 新端点 = KD-SV-50）；零依赖柱件既有（KD-SV-29 机制不破）；零新档（档目 19 ∥ 20 不动） |

## 2. 机制

### 2.1 ⑥ 「我的·key 与签发」页重做（功能点 25；用户「太草率」+「可以」+ 附加两令「key最好有个名称」 ∥「一个用户可能会有多个Key」）

- **页形**（`#/me/keys`；非壳页——`docs/server/design/webui/STYLE.md` §2.2① 排除面在册）：页题「我的 API Key」+ 页首「签发新 API Key」钮（`me.keys.issue`）∥ 页级一次性秘密区（`ctx.showSecret`——签发成功后明文落此，含复制钮）∥ API Key 表卡（卡题 = `me.keys.listTitle`——「提示形」黑话下架）∥ 接入卡（成员面——素材复用，见下）。
- **API Key 表（六列——表格族 canon `docs/server/design/webui/STYLE.md` §2.1①）**：名称（`key.name`——签发时命名 ∥ 空名默认 `key-N`） ∥ API Key（`code` 提示形） ∥ 签发时间（`fmtTs(createdAt)`） ∥ 最后使用（`fmtTs(lastUsedAt)`——空值 ⇒ `me.keys.neverUsed`「从未使用」） ∥ 近 30 天（`{tokens} tokens`） ∥ 操作（行内「吊销」= `tiny danger`）。
  数据 = `/api/me` key 行（单源 = `memberView`——行形 += `name`/`createdAt`；仅未吊销 ⇒ 吊销后行离列）；空态 = `.hint` 引导（「签发新 API Key」指引 + 明文仅显示一次——`me.keys.empty`）。
- **签发流**（公共弹窗 `modal.mjs`）：体 = 名称输入（可空——`me.keys.namePh`「留空 = 自动命名」+ `me.keys.nameHint`）+ 说明行（`me.keys.issueHint`——明文仅一次）+ 上限提示（`me.keys.capHint`）；脚区 = 「签发」（主）+「取消」；成功 ⇒ 关窗 + 页级秘密区回显明文 + 表刷新（多把并存——旧把照常可用）；失败 ⇒ 窗内状态行（弹窗定则——反馈落窗内）。
- **吊销流**（公共弹窗）：体 = API Key 名 + 提示形 + **后果文案**（`me.keys.revokeConsequence`——吊销立即失效 ∥ 客户端即断 ∥ 不可撤销）；脚区 = 「吊销」（危险）+「取消」；成功 ⇒ 关窗 + 表刷新（行离列）+ flash「已吊销」；失败 ⇒ 窗内状态行。**零原生 `confirm`**（`window.confirm` 页面零调用——机检扫描面）。
- **复制钮（`showSecret` 全局随动）**：秘密区 = 明文 + 「复制」钮（`common.copy`）；复制三路 = ① `navigator.clipboard.writeText`（安全上下文）⇒ ② 选中明文 + `document.execCommand("copy")` ⇒ ③ 仍失败 ⇒ 保持选中 + flash 手动提示（`common.copyManual`）；成功反馈 = 钮文案「已复制」（`common.copied`——2s 复位）。三处秘密面（新 key ∥ 新建成员初始密码 ∥ 重置密码）同随动。
- **接入卡（成员面——⑤）**：与 admin 接入卡**同源复用**（`views-system.mjs` 导出的同构件——`accessCard(ctx, variant)`；admin 面 = 现行零改）；成员变体 = 措辞三键（`me.keys.accessTitle`/`accessHint`/`accessKeyRow`+`accessKeyValue`）+ 同四端字段/baseURL/curl 素材键。
- **轮换（全换）处置（本档 §1 KD-SV-47）**：**页面不保留**（按钮下架——多把并存下「全换」= 全断操作，与逐把模型相抵；需求 ①「留否 = 设计轮定」⇒ 否）；HTTP 端点 `/api/me/keys/rotate` **保留**（API 契约与既有单元测试档零动——非页面面；契约 = `docs/server/design/accounts/ACCOUNTS.md` §3）。
- **壳面口径**：本页非壳页（功能点 20 钉表五页不扩——key 表行数量级小、页内含接入卡静态长内容；入壳 = 另议）；表不带 tfoot 计数（tfoot = 壳面 canon）。
- **数据/权**：全经 `/api/*`（契约 = `docs/server/design/accounts/ACCOUNTS.md` §3）；判权仍在服务端（本人面——无 webui 侧新增判据）。

### 2.2 ⑦ 「我的·用量」页图表化（功能点 26；用户「我的用量那个界面感觉单薄……更多的图表」）

- **页形**（`#/me/usage`——壳面五页在册不动〔`docs/server/design/webui/STYLE.md` §2.2①〕；页头固定 + 页区承缩）：
  - **页头**（`.page-head`）：页题 ∥ 向量提示条（现件——`docs/server/design/webui/READINGS.md` §2.1①）∥ 概览卡行 ∥ 筛选行。
    概览卡行 = 两枚 stat 卡：「本月已用」= `member.usedTokens`（日表月累计——含嵌入行，现口径） ∥ 「分模型配额」= `fmtModelQuotas(member.modelQuotas)`（`col.quota` 同键）。
    筛选行 = 时间维度 select（近 7 天 ∥ 近 30 天 ∥ 本月；缺省 30） ∥ 端点 select（全部 ∥ chat ∥ embeddings） ∥ 模型输入（外标形） ∥ 「清除筛选条件」钮——即选即查。
  - **页区**（`.page-area`——两卡）：**报表卡**（`report-card`——不承缩；上限 = 页区高 55%（超限卡内自滚——明细卡恒得剩余高））+ **明细卡**（承缩——表槽自滚 + 表尾计数，链 = `docs/server/design/webui/STYLE.md` §2.2②）。
- **报表卡内**：KPI 行 ∥ 主图 ∥ 分模型区。
  - KPI 行 = 两枚 stat 卡：「请求数」= `totals.requests` ∥ 「tokens」= `totals.totalTokens`（注行 = `me.usage.kpiSplit`——prompt/completion 拆）。
  - **主图**（h4 = `usageReport.trend`）：按日**堆叠柱**——纯 CSS 件（`.bar-stacked`/`.bar-seg`；柱高 = 当日 tokens/峰值；段 = 维度值）。
    - **段色** = `--accent` 透明度阶梯 [1 / 0.7 / 0.45 / 0.3]（第 5 段起 0.3——零新颜色变量）；段 `title` = 日 · 维值 · 请求数 · tokens。
    - **维度切换** = `.chart-toggle` 两枚 `tiny` 钮（「端点」∥「模型」——`usageReport.endpoint` ∥ `usage.col.model` 同键）；活动态取 `.lang-switch .active` 同形；切换 = 本地重画（数据一次取齐——零重取）。
    - **图例** = `.bar-swatch` + 维值名；轴标 = `.chart-axis`（现件）；空态（`totals.requests` = 0）⇒ `usageReport.trendEmpty`。
    - **数据**：维度「端点」= `trendByEndpoint` ∥ 「模型」= `trendByModel`（逐日 × 维值段；零填充在服务端——前端只画）。
  - **分模型区**（h4 = `usageReport.byModel`）：表五列 = #（`usageReport.colRank`） ∥ 模型（`usage.col.model`） ∥ 请求数（`usageReport.requests`） ∥ tokens（`usageReport.tokens`） ∥ 本月已用（`me.usage.used`）。
    「本月已用」取值 = `member.modelUsage` 同键（缺 = 0；自然月 = 配额窗）；行序 = `byModel` 降序 + 范围无行而本月有量者殿后（月量降序）；空 ⇒ `usage.empty`。
    殿后行 × 过滤口径：殿后行源 = 月窗（含嵌入行——与概览卡行同为月语境）；`endpoint` 过滤只裁窗表（`byModel` 侧）——仅月窗有量的嵌入模型在 `endpoint = chat` 下照以殿后行示出（0/0 + 本月已用）。
- **明细卡内**：h3 = `me.usage.detail`（现件）；表 = `usageTable(rows, { withMember: false, foot: true })`（列零改）；数据 = `/api/me/usage`。
- **单过滤面（四区同拍）**：筛选行四控件 ⇒ `Promise.all` 两读同刷——`/api/me/usage/summary`（契约 = `docs/server/design/metering/METERING.md` §3）∥ `/api/me/usage`（+ `limit=100`）。
  概览卡行 = 月语境，不随筛选行；失败 ⇒ 两区各 `.hint error`（`usage.loadFailed`——`ctx.fail` 收口）。
- **窗换**：近 7 天（-6 日）∥ 近 30 天（缺省——服务端缺省窗同构）∥ 本月（月首）；`from` ms 客户端换算（admin 先例同构；异时区窗沿差 = 已知边界在案）。
- **导出 = 不设（判否）**：① 参考图导出钮属金额/账单语境——本服务器无金额面（`docs/server/design/metering/METERING.md` §8 不做项）⇒ 无对应语义；
  ② 放宽 `/api/usage/export` 对 user = 翻判权三态（`docs/server/design/webui/READINGS.md` §4 AC-15② 在案）；另立本人面导出端点 = 新契约面无对应收益。
- **statCard 复用**：`views-overview.mjs` 的 `statCard(h, label, ...content)` 导出复用（函数体零改——注行 = 追加 `.hint` 节点）；`views-usage.mjs` 自有同形件零动（两处并存 = 去重候选，在册）。
- **元素对照（参考截图——逐条可追）**：

| 截图元素 | 本页落点 / 不映射理由 |
|---|---|
| ① 页头说明条（GMT+8 ∥ 5 分钟延迟） | **不映射**——记账 = 实时（无延迟管道）；时间本地化显示既在（`fmtTs`） |
| ② 峰谷提示 banner（+「我知道了」） | **不映射**——无峰谷计价面（金额族） |
| ③ 两概览卡（充值余额 ∥ 累计消费金额） | 金额族不映射；替代 = 概览卡行（本月已用 ∥ 分模型配额） |
| ④ 筛选行·时间维度 | 时间维度 select（近 7 天 ∥ 近 30 天 ∥ 本月；缺省 30 = 服务端缺省窗同构） |
| ④·API Key 下拉 | **不映射**（key 过滤轴数据面无）；第二轴 = 模型输入（数据面既有） |
| ④·清除筛选条件 | 「清除筛选条件」钮（四控件复位 + 重查） |
| ④·导出钮 | **不设**（判否——见上） |
| ⑤ KPI 卡 ×3（金额 ∥ 请求数 ∥ Tokens） | KPI 行 ×2（请求数 ∥ tokens——注行 = 输入/输出拆）；金额卡不映射 |
| ⑥ 主柱图 + 图例切换（模型 ∥ API Key） | 按日堆叠柱 + 维度切换（端点 ∥ 模型）——零依赖柱件复用 |
| ⑦ 分模型区（逐模型 请求数面积图 ∥ Tokens 柱图） | 分模型表（逐模型 请求数 ∥ tokens ∥ 本月已用）——逐模型出图不采（页肥；表形等价） |

- **不做**：成本/金额/余额（`docs/server/design/metering/METERING.md` §8 不变）∥ 小时/周粒度（日/月两键为限）∥ 图表库/CDN（零依赖——KD-SV-29 机制不破）∥ 本人面导出（判否）∥ key 维度过滤（数据面无此轴）∥ 数字千分位（站内口径不引）∥ 模型 top-N 归并（全模型分段——色阶下限 0.3 在案）∥ 总览/管理面零改。

### 2.3 「我的·账户」页增 Git 凭据卡（KD-SV-204）

- **定位**：成员本人的 git 凭据（拉取/推送共用）绑定面——**绑一次复用**（盒内助手按次取件）；**入径 = 拉取流内就地绑**（缺凭据/无效 ⇒ 拉取窗内录入——`docs/server/design/webui/CHAT.md` §2.2；`docs/server/design/agent/MEMBER-AGENT.md` KD-SV-215）；**本卡 = 管理面**（改/删/多主机——保留）；落点 = 账户页（`#/me/account`——`views-me.mjs` 三页之账户页）；**不进沙盒页**（成员面 vs 管理面分面——`docs/server/design/sandbox/SANDBOX.md` §8）。
- **卡形**：表（主机 ∥ 用户名 ∥ 更新时间 ∥ 操作：改/删）+「添加凭据」钮（弹窗：主机 ∥ 用户名 ∥ 口令/令牌——**密文零回显**；成事 ⇒ 审计 `member_event`/`credential_set`；删 ⇒ `credential_revoke`）；源表式副作用（与私有仓凭据卡同形——两面分面：成员自有凭据 ∥ 平台私有仓凭据）。
- **数据面**：`/api/me/git-credentials*` 三端点（`docs/server/design/gateway/API.md` §2.11）；密列读写单点（`credential-crypto.mjs` 复用）；错误形沿族（400 形非法 ∥ 404 不存在）。
- **边界**：值只进不出（查看/导出无面——改 = 覆写）∥ 三面零秘密回显（响应/日志/审计）∥ 凭据测试连接钮不设（拉取失败即验证径——零专项件）。

## 3. 文件账（本面文件行 ∥ 键族登记）

| 档 | 行数 | 职责 |
|---|---|---|
| `thincoder-server/public/views-auth.mjs` | **31** | 登录视图 |
| `thincoder-server/public/views-me.mjs` | **398** | 我的·key/用量/账户三页 |
| `thincoder-server/public/i18n-zh-me.mjs` | **184** | 文案表·zh·我的面 |
| `thincoder-server/public/i18n-en-me.mjs` | **185** | 文案表·en·我的面 |

**面小计**：≈798（域合计 = 各面之和——不单列）。

**键族登记**：

- **键族登记（两表逐键同步）**：新增 **25 键**，逐族列名：
  - **表六列**：`me.keys.colName` ∥ `colKey` ∥ `colCreated` ∥ `colLastUsed` ∥ `colWindow` ∥ `colActions`；
  - **签发流**：`issue` ∥ `issueTitle` ∥ `nameLabel` ∥ `namePh` ∥ `nameHint` ∥ `issueHint` ∥ `issueSubmit` ∥ `capHint`；
  - **吊销流**：`revokeTitle` ∥ `revokeConsequence` ∥ `revokeSubmit` ∥ `revoked`；
  - **接入卡成员面**：`accessTitle` ∥ `accessHint` ∥ `accessKeyRow` ∥ `accessKeyValue`；
  - **复制钮**：`common.copy` ∥ `common.copied` ∥ `common.copyManual`；
  - **列头与空态**：`me.keys.listTitle`（「API Key 清单」） ∥ `me.keys.empty`（「签发新 API Key」指引） ∥ `me.keys.lastUsed` ∥ `me.keys.windowTokens`（列内形 `{time}` ∥ `{tokens} tokens`）；
  - **表体量**：zh ≈374 ∥ en ≈377。
  - **复用 1 键**：`me.keys.neverUsed`（「从未使用」——本档 §2.1 表「最后使用」空值文案；成员弹窗 key 表同键——`docs/server/design/webui/STYLE.md` §2.2⑤；两表在盘，零改）。
  - **词汇口径（统一现状）**：范围 = 四面 + 本页；本页实体名 = 「API Key」（需求 §2:25③ 字面——列头/按钮/弹窗；zh 保留英文原形 ∥ en = "API key"；用户定音（B，术语门））。
  - **同口径覆盖面**：`nav.page.me.keys`（「API Key 与签发」） ∥ 管理面（`admin.members.tableTitle`/`colKeys`/`colKeyCount`/`colKey`） ∥ 审计型（`audit.type.key_issue`/`key_revoke`/`key_rotate`） ∥ 接入卡（`system.accessHint`）。
  - **页题随统一**：`me.keys.title` ∥ `me.keys.secretLabel`（指别 = 成员 API Key；provider 凭证三键 ∥ `vector.clearApiKey` = 上游/引擎凭证实体——非本口径面，零触）。
- **键族登记（两表逐键同步）**：新增 **8 键**——`me.usage.range`（时间维度） ∥ `me.usage.range7`（近 7 天） ∥ `me.usage.range30`（近 30 天） ∥ `me.usage.rangeMonth`（本月） ∥
  `me.usage.clear`（清除筛选条件） ∥ `me.usage.modelPh`（模型——输入占位） ∥ `me.usage.used`（本月已用——概览卡 ∥ 分模型列头同键） ∥ `me.usage.kpiSplit`（`prompt {prompt} · completion {completion}`——KPI 注行）；
  表体量：zh 382 ∥ en 385。

## 4. 验收（本面 AC 行）

| 需求 | 设计级判据 | 载体 |
|---|---|---|
| AC-25（功能点 25——「我的·key 与签发」页重做） | ① 多把并存（签发 ⇒ 新把在场 ∥ 旧把照常可用；吊销 ⇒ 即断；他人 key 操作 ⇒ 404——端点契约判据 = `docs/server/design/accounts/ACCOUNTS.md` §5 AC-25 行） ∥ ② 命名（签发携名落库 ∥ 表列显 ∥ 空名默认 `key-N`） ∥ ③ 表六列（名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作——签发时间 = 新暴露字段 `createdAt`） ∥ ④ 弹窗化（签发/吊销 = `modal.mjs`——吊销后果文案在场 ∧ 页面零 `window.confirm`）+ 复制钮（`showSecret`——三秘密面随动） ∥ ⑤ 接入卡成员面（baseURL ∥ curl ∥ 四端——与 admin 接入卡同源复用） ∥ ⑥ 「提示形」零残留（页面文案与两表值） + 空态引导（含「签发新 API Key」指引）；页面非壳（`docs/server/design/webui/STYLE.md` §2.2① 排除面在册） | 单元测试档 + 收口轮（浏览器实走） |
| AC-25（续·机检口径） | `views-me.mjs`——六列表头逐键在场 ∥ 行 = key 行映射（名称/提示形/签发时间/最后使用/近 30 天/吊销钮） ∥ 空态分支 ↺ 两弹窗 = `openModal` 调用（签发：名称输入 + 提交路径 `/api/me/keys/issue`；吊销：后果文案键引用 + 提交路径含 keyId） ∥ 页面零 `window.confirm`（档面扫描） ∥ `showSecret` 复制钮 + 三路回退（`navigator.clipboard` stub 直测三路） ∥ 接入卡成员面 = `accessCard` 导出复用（admin 面行断言回归——零改） ∥ i18n：新 25 键两表同步（en 零 CJK ∥ 占位符一致）∥ 死键 `me.keys.rotate`/`rotateConfirm` 零残留 ∥ 改值键列内形（`lastUsed`/`windowTokens`）∥ `style.css` 类名双向闭合（`key-list`/`key-item`/`key-meta` 零残留）+ 行悬停清单 = 2 条（`li.key-item:hover` 删净——AC-19 续行同拍）∥ 档目随正——单源 = `docs/server/design/webui/WEBUI.md` §1；迁移 v8 判据 = `docs/server/design/store/STORE.md` §3 | 单元测试档 |
| AC-26（功能点 26——「我的·用量」页图表化；`docs/server/requirements/PROJECT.md` 验收表） | ① 页形在册（概览卡行（本月已用 ∥ 分模型配额）∥ 筛选行四控件（时间维度三档 ∥ 端点 ∥ 模型 ∥ 清除）∥ KPI 行（请求数 ∥ tokens+拆分注）∥ 主图（按日堆叠柱——维度切换 端点/模型 两态）∥ 分模型区（逐模型 请求数 ∥ tokens ∥ 本月已用）∥ 明细表（现件 + tfoot——含 key 名称列）——本档 §2.2） ∥ ② 零依赖（堆叠柱 = 纯 CSS 件——`.bar-stacked`/`.bar-seg`；零新库 ∥ 零外部引用扫描不破） ∥ ③ 数据面（`/api/me/usage/summary` + `/api/me/usage` 同过滤面同拍；`memberView.modelUsage` 消费（分模型「本月已用」列——缺 = 0）） ∥ ④ 壳面不破（`SHELL_PAGES` 五路径不动；高度链 +2 行在册（`docs/server/design/webui/STYLE.md` §2.2②）；报表卡上限自滚（明细卡恒得剩余高）+ 明细卡承缩（表槽自滚 + tfoot 计数在册）；矮视口回退既有口径） ∥ ⑤ i18n（新 8 键两表同步 ∥ `me.usage.summary` 退役零残留——本档 §3） ∥ ⑥ 空/错态（全零窗 ⇒ KPI 0 + 主图 `usageReport.trendEmpty` ∥ 分模型空 ⇒ `usage.empty` ∥ 失败 ⇒ `.hint error` 两区——零错） ∥ ⑦ 导出 = 不设（判否——本档 §2.2）；admin CSV 零动 ∥ ⑧ 段色 = `--accent` 透明度阶梯（零新颜色变量）；弹窗/原生 `confirm` 零涉 | 单元测试档 + 收口轮（浏览器实走） |
| AC-26（续·机检口径） | `views-me.mjs`：`renderMeUsage` 结构（概览卡 2 枚 ∥ 筛选控件 4（select×2 + input + 钮）∥ KPI 2 枚 ∥ `.chart-toggle` 两钮 + `.bar-seg` 段容器 ∥ 分模型表五列 ∥ 明细 = `usageTable(rows, { withMember: false, foot: true })`）∥ 两跳取数（`Promise.all`——`/api/me/usage/summary` + `/api/me/usage`）∥ 三档窗换算（近 7/30/本月 ⇒ `from` ms）∥ 维度切换 = 本地重画（零重取） ∥ `views-overview.mjs`：`statCard` 导出在场 ∥ `style.css`：`.bar-stacked`/`.bar-seg`/`.bar-swatch`/`.chart-toggle` 在册 ∥ `.page-area` gap + `.page-area > .card.report-card`（`flex: none` + 上限自滚——`docs/server/design/webui/STYLE.md` §2.2②）在册（表随正） ∥ AC-19 canon（类名双向闭合 ∥ `:root` 零新颜色字面量 ∥ 悬停规则零新 ∥ 内距 ∈ 刻度） ∥ i18n 键集（+8 ∥ −1；两表同步 ∥ en 零 CJK） ∥ 档目随正——单源 = `docs/server/design/webui/WEBUI.md` §1（me 用量图表化批零新档） ∥ 旧件随正 = `2026-10-07-console-layout.test.mjs`（me 页用例：路由桩补 summary ∥ 页头断言改点） | 单元测试档 |
| AC-15（续·⑥） | ⑥ key 表（六列——名称/API Key/签发时间/最后使用/近 30 天/操作；最后使用 ∥ 近 30 天 = 真值 ∥ 从未使用文案；多把并存——本档 §2.1） | 单元测试档 + 收口轮 |

## 5. 边界（本面不做面）

- 成员面接入卡（接入成文 = README；系统页卡 = admin 面——`docs/server/design/webui/SYSTEM.md` §2.1）。
- 凭据卡不做面：值回显/查看/导出（只进不出）∥ 多主机批量导入 ∥ 凭据测试连接钮（拉取失败即验证径——零专项件）∥ 成员面列平台私有仓凭据（管理面专属）。
- key 页不做面：轮换按钮回页面（下架——端点保留）∥ 改名/排序/搜索（名称 = 签发时标签——签发后只读）∥ key 用量明细/趋势（面外——`#/me/usage` 已有）∥ admin 面 key 表加列（名称不进管理表——另议）∥ 壳化/分页/筛选（`docs/server/design/webui/STYLE.md` §2.2① 排除面）∥ 独立「key 详情」弹窗（行即全信息）∥ 成员面接入卡的 README 成文删改（README 仍为成文面）；`#/me/keys` 独立加载态（数据随 `/api/me` 同拍——无独立拉取）。
- 用量页不做面：成本/金额/余额（`docs/server/design/metering/METERING.md` §8 不变）∥ 小时/周粒度（日/月两键为限）∥ 图表库（零依赖手绘——KD-SV-29 机制不破）∥ 本人面导出（判否——本档 §2.2）∥ key 维度过滤（数据面无此轴）∥ 数字千分位（站内口径不引）∥ 模型 top-N 归并（全模型分段——色阶下限在案）∥ 总览/管理面零改 ∥ 出壳/自由滚动版式（壳面五页钉表维持——另轮如裁）。

## 6. 上抛/余项

- 本面无独立上抛/余项。
