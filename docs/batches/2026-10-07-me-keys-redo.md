# 2026-10-07 · me-keys-redo
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 16:06「我的 key与签发那个界面太草率了，完全没从用户角度考虑过。」+ 16:08「可以，先做出来看」（按父侧呈请 A–E 方向落——B = 多把并存）。
> 台账 = #1023（webui · 归批）。前情 = 无（独立批——承用户 16:06 走查「我的·key 与签发」页）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 批件（用户 2026-10-07 16:06–16:1x 走查四连）

- 「我的 key与签发那个界面太草率了，完全没从用户角度考虑过。」（16:06）
- 「可以，先做出来看。」（16:08——按父侧呈请 A–E 方向落）
- 「key最好有个名称」（追加）
- 「一个用户可能会有多个Key」（追加——**多把并存 = 硬需求再确认**）
- 需求落述 = `docs/server/requirements/PROJECT.md` 功能点 25（:116 区）+ AC-25（:158）；方向 = 多把并存 ∥ key 命名 ∥ 表格六列 ∥ 弹窗化+复制钮 ∥ 接入卡上成员面 ∥ 人话化。
- 现状取证：`.thincoder/tmp/me-keys-1-current.png`（实拍——裸行 ×5 + 「签发/轮换 key」+ 卡头黑话「提示形」）+ `me-keys-walk.json`（probe）。

### 1.2 父侧裁定（设计轮上抛处置——2026-10-07）

| # | 上抛（§2.7/§2.8/§2.9） | 裁定 | 依据 |
|---|---|---|---|
| 1 | 轮换页面下架（端点保留） | **准**——留否 = 需求 ① 明授权「设计轮定」；端点保留 = API 兼容不变量 | §2.7① |
| 2 | 三数值：名称 ≤40 字符 ∥ 自助上限 20 把（CLI 免）∥ 他人 key ⇒ 404 | **准**——404 沿 admin 先例、防枚举（AC-25「404/403」允许面内） | §2.7② |
| 3 | 「接入卡源不动」读法 = admin 面**行为**零改（同源导出/变体参数允许） | **准**——需求档边界句同日回笔（「接入卡 = admin 同源构件复用——加导出/变体参数允许，admin 面渲染/措辞零改」）；「源码零触」读法弃（两卡漂移面违单一权威） | §2.8 |
| 4 | 一名两形（密钥 ∥ key）登记、统一另笔 | **受理**——入台账技术待办（统一 = 后续随正批） | §2.9 |
| 5 | 板档 §6 各批总账行缺（2026-10-07 五批） | **受理**——入台账技术待办（设计档面：建议专轮/随批补） | §2.7⑦ |

- 评审前置条件已齐：本表落盘 + 需求档回笔 + 三设计档在盘（doc-check 悬空 0）——设计评审可开（fire 权 = 用户 16:08「可以，先做出来看」全链授权口径下，父侧代发）。

### 1.3 修正轮（#44）与上抛处置——2026-10-07

- **七号定点全落**（父侧抽核相符）：#1/#2/#4/#5/#6/#7/#8 逐号在盘（`ACCOUNTS.md:18`（命名落位·各创建路径）∥ `:23`（轮换行补默认名句）∥ `WEBUI.md:90`/`:118`/`:200` ∥ 板档 `:146-147`（越线补两档）∥ `:212-215`（注⑩）∥ `:303`（R40①/R40③））；doc-check 悬空 0 · exit 0（改后同值）。
- **#44 上抛处置**：① 死名（`-quota-v2.test.mjs` 实盘不存在 ⇒ `-quota-v2-member-models`）——收到，已收正；② 号外补列（门禁件数随正两档 `-server-auto-update:480` ∥ `-quota-per-model:444` + `package.json` 22 ⇒ 23）——**准**（#1 同类面、防收口红；单行可回退在案）；③ i18n 口径注（净 ≈+23 ∥ 行数估不动）——照准；④ `README.md`/`config.mjs` 实读收正——照准。
- **术语门（待用户一词定音）**：需求 §2:25③ 字面「密钥」vs 全局「key」——用户 16:41 指向「惯例 = apikey」；查证（Google Cloud/AWS/IBM 中文官方 = 「API 密钥」∥ 阿里云 = API Key）——**A（API 密钥）/ B（API Key）待定**；定音后：me 页文案随正（设计档微笔）+ 既有四面轻通道 copy 笔扫平（#1025 核销）。**实施派发 = 等此门。**

### 1.4 A 轮（#46 服务端面）受理与知会处置——2026-10-07

- **交付受理**：3 源档（`db.mjs` v8 段 `:158-163`/`:174` ∥ `keys.mjs` 命名/上限/计数 `:18-22`/`:65-98`/`:111-114` ∥ `routes.mjs` 两端点 `:131-141`/`:143-150` + key 行两字段 `:48-55`）+ 批内件（370 行·七用例 **7/7 绿** ∥ 四档 `node --check` OK）；内审 clean ∥ 内评 pass（0🔴 ∥ 🟡2 ∥ 🔵3）。§5 已由 #46 写入。
- **[知会] 随正清单缺口（受理——已传令 #47 扩围）**：实跑另破 `-server-gateway.test.mjs`（版本 7⇒8 ∥ 失败迁移探针 `v:8` 撞号 ⇒ 改 `v:9`）与 `-server-gateway-accounts.test.mjs`（`:224`/`:306` 行形）——随正七件 ⇒ **九件**（6 件 9 红，全归本批；已列档内超坐标破点同按实跑收正）。
- **[知会] 非阻塞在册**：`package.json` 门禁 22 ⇒ 23/24（父侧直笔——待 #47 报件数定）∥ 空体 CL:0 边界 ∥ `{name:null}` 视同缺省 ∥ 重复吊销各记审计 ∥ 名称计长 = UTF-16 码元——收口轮一并覆核。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（me-keys 批设计轮 + fix 轮（评审 #43 七号落修）+ 术语定音微轮（2026-10-07——本页新文案词位 ⇒「API Key」；两档设计微笔）——三档设计修订 + 板档 §4/§6/§7/§9 随动）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批覆盖（需求条目 → 设计落点）

| # | 需求条目（`docs/server/requirements/PROJECT.md`） | 设计要点 | 设计落点 |
|---|---|---|---|
| 1 | §2:25① 多把并存（自助签发「加一把」+ 逐把吊销——新端点） | 两新端点（会话面）+ 所有权 404（不区分——防枚举）+ 审计两型复用（九型零增） | `accounts/ACCOUNTS.md` §1.1/§3/§5 AC-25；`webui/WEBUI.md` §2.3⑥ |
| 2 | §2:25② 命名（可空——留空默认名） | trim ≤40 字符（超长 ⇒ 400）∥ 空名 ⇒ 默认 `key-N`（单调不复用，落库）∥ 重名允许 | `accounts/ACCOUNTS.md` §1.1；`store/STORE.md` §2 v8 段 |
| 3 | §2:25③ 表格六列（签发时间 = 新暴露字段） | 六列表（名称/密钥/签发时间/最后使用/近 30 天/操作）∥ `memberView` key 行 += `name`/`createdAt` | `webui/WEBUI.md` §2.3⑥/§6 AC-25；`accounts/ACCOUNTS.md` §3 |
| 4 | §2:25④ 动作面弹窗化（后果明示）+ 明文区复制钮（`showSecret` 全局随动） | 签发/吊销双弹窗（后果文案 ∥ 页面零 `window.confirm`）∥ 复制三路回退（clipboard ⇒ execCommand ⇒ 选中+提示） | `webui/WEBUI.md` §2.3⑥/§6 AC-25 |
| 5 | §2:25⑤ 接入卡进成员面（与 admin 同源——素材复用） | `accessCard(ctx, variant)` 导出复用（admin 面行为零改） | `webui/WEBUI.md` §2.3⑥/§2.1 落点句 |
| 6 | §2:25⑥ 人话化（「提示形」下架 ∥ 空态带引导） | 键值收正（`listTitle` ⇒「密钥」）+ 空态重写 + 键族登记 | `webui/WEBUI.md` §2.2/§6 AC-25 |
| 7 | §2:25 边界（admin 面行为零动 ∥ `/v1` 对外契约零动 ∥ 新端点仅 `/api/me/*`） | `routes-admin.mjs`/`members.mjs` 零触 ∥ 端点面不动别处 | `accounts/ACCOUNTS.md` §1.1/§3/§8；`webui/WEBUI.md` §8 |
| 8 | 需求② 的直系数据面（命名落库） | v8 迁移：`api_keys.name` + 存量回填 `key-N`（按成员签发序） | `store/STORE.md` §1/§2 v8 段/§3（**spawn 未列此落点——本设计轮补列，见 §2.7⑥**） |

**不在本批**（边界，逐条在册）：admin 面 key 表加名称列 ∥ 改名/排序/搜索 ∥ key 级明细/趋势 ∥ 页面壳化/分页 ∥ 独立「key 详情」弹窗 ∥ README 成员接入成文删改 ∥ CLI 命名参数（`webui/WEBUI.md` §8 ∥ `accounts/ACCOUNTS.md` §8 边界行）。

### 2.2 设计要点（裁决四条 + 复用三条）

1. **轮换（全换）**：页面**下架**（误读为「换一把」= 意外全断——与逐把模型相抵；需求①「留否 = 设计轮定」⇒ 否）；**HTTP 端点 `/api/me/keys/rotate` 保留不动**（API 兼容不变量——既有批内件与 `key_rotate` 审计型零动）。
2. **命名**：`api_keys.name`（v8）；空名 ⇒ 服务端生成默认名 `key-N`（N = 该成员签发序号——含吊销行，单调不复用）**落库**（显示稳定 ∥ 吊销/新增不重排）；≤40 字符；重名允许（名称 = 标签非标识——寻址仍按 `id`/提示形）。
3. **上限**：自助面 active ≤20 把（超出 ⇒ 400 `invalid_request_error` 消息明示；计数与 INSERT 同同步段——无竞态面）；**CLI 不设限**（本机兜底面）。
4. **吊销后行**：即时消失（列表 = 未吊销——KD-SV-16 口径不变）+ flash「已吊销」；幂等 200；他人 key ⇒ 404（与不存在不区分）。
5. **接入卡复用**（不建新档）：`views-system.mjs` 导出 `accessCard(ctx, variant)`，`views-me.mjs` import（先例 = `views-admin` ← `views-models` 的 `deriveModels`）；admin 面措辞零改，成员面走新键 4 枚。
6. **复制钮**：落 `app.mjs` `showSecret`（全局随动——新 key 明文 ∥ 新建成员初始密码 ∥ 重置密码三处同得）。
7. **非壳页**：key 表不入 `SHELL_PAGES` 五页钉表（功能点 20 不扩——免改需求语义；表行数量级小、页内含接入卡）；`ul.key-list` 族退役（死类删净）。

### 2.3 受影响文件（产品面——实读 ⇒ 预期）

| 档 | 实读 | 预期 | 变更 |
|---|---|---|---|
| `thincoder-server/src/store/db.mjs` | 210 | ≈228 | v8 段（ALTER + 回填 + 迁移段） |
| `thincoder-server/src/accounts/keys.mjs` | 109 | ≈131 | `issueKey` 携名 ∥ 默认名助手 ∥ `countActiveKeys` ∥ `MAX_ACTIVE_KEYS` ∥ `activeKeysOf` 列增 |
| `thincoder-server/src/accounts/routes.mjs` | 118 | ≈152 | 两新路由 + key 行两字段 |
| `thincoder-server/public/views-me.mjs` | 122 | ≈211 | key 页重做（表/双弹窗/接入卡/空态） |
| `thincoder-server/public/views-system.mjs` | 172 | ≈178 | `accessCard` 导出/参数化（admin 面零改） |
| `thincoder-server/public/app.mjs` | 321 | ≈346 | `showSecret` 复制钮 + 三路回退 |
| `thincoder-server/public/style.css` | 224 | ≈219 | `ul.key-list` 族删净（−5） |
| `thincoder-server/public/i18n-zh.mjs` ∥ `i18n-en.mjs` | 352 ∥ 355 | ≈374 ∥ ≈377 | 键族（+25 ∥ −2 ∥ 改值 4） |

零新档（档目 19 ∥ 20 不变）；零触：`members.mjs` ∥ `routes-admin.mjs` ∥ `modal.mjs` ∥ `nav.mjs` ∥ `views-admin.mjs` ∥ gateway 面全档 ∥ `metering` 面全档。

### 2.4 验收（AC-25 逐点 → 判据）

① 多把并存 → `POST /api/me/keys/issue`（旧 key 照常可用）∥ `POST /api/me/keys/:keyId/revoke`（即断 ∥ 幂等）；他人 key ⇒ 404。② 命名 → 携名落库 ∥ 表列显 ∥ 空名默认 `key-N`（v8 回填抽查）。③ 六列 → 表头逐键在场 ∥ `createdAt` 随行下发。④ 弹窗化 → `openModal` 两径 ∥ 后果文案键引用 ∥ 页面零 `window.confirm`；复制钮三路直测（stub `navigator.clipboard`）。⑤ 接入卡 → 成员面 `accessCard` 复用（admin 面行断言回归）。⑥ 人话化 → 「提示形」零残留（文案键值面）∥ 空态引导分支。机检 = 批内件（`docs/batches/2026-10-07-me-keys-redo.test.mjs`，拟）+ 收口轮（浏览器实走；走查件法 = `.thincoder/tmp/2026-10-07-me-keys-walk.mjs` 同法）。

### 2.5 随正件（旧批测试——父侧落地，实施轮同拍）

- **类删断点（`.key-item` 四件）**：`2026-10-06-console-list-style.test.mjs`（`:116`/`:188`/`:189`）∥ `2026-10-07-console-layout.test.mjs`（`:458`/`:481`/`:484`）∥ `2026-10-07-quota-v2-member-models.test.mjs`（`:744`）∥ `2026-10-07-provider-model-metadata.test.mjs`（`:490`）（断言改点以实施盘面为准）。
- **值改随正（`me.keys.lastUsed`/`windowTokens` 列内形）**：`2026-10-06-console-completeness-2.test.mjs`（`:452`——键在场，**应不破**，实读为界）∥ `2026-10-07-quota-v2.test.mjs`（`:526`/`:545`——复数直测期望文本随正）。

### 2.6 批内件与设计档同拍

批内件（拟）= v8 迁移四判据（空库读数 8 ∥ v7 库升后 8 ∥ 幂等 ∥ 回填抽查）∥ 端点六态（N31–N34 ∥ B28/B29 ∥ E23）∥ 页面静态面（六列/双弹窗/零 confirm/复制三路）∥ i18n 键集与死键 ∥ `style.css` 类名双向闭合 ∥ 接入卡 admin 面回归。设计档同拍：`webui/WEBUI.md`（§2/§2.1/§2.2/§2.3⑥/§2.5/§2.6①/§5/§6/§7/§8/变更记录）∥ `accounts/ACCOUNTS.md`（§1/§1.1 新增/§2.1/§3/§4/§5/§6/§7/§8/变更记录）∥ `store/STORE.md`（§1/§2 v8 段/§3/§4/变更记录）∥ `design/PROJECT.md`（§4/§6/§7/§9 R40/变更记录）。

### 2.7 上抛与披露

① **[上抛·待裁] 轮换页面下架**（端点保留）——设计轮裁，供评审/用户复核。
② **[上抛·待裁] 三个数值/范围裁定**：名称上限 40 字符 ∥ 自助上限 20 把（CLI 免）∥ 他人 key ⇒ 404（AC-25 允许「404/403」——取 404 沿 admin 先例）。
③ **[披露] admin 面 key 表不加名称列**（面外——拟不做；如需另议）。
④ **[披露] 页面非壳**（钉表五页不扩——功能点 20 语义零改）。
⑤ **[披露] STORE 落点为本批补列**：spawn 只列 WEBUI/ACCOUNTS 两档；`store/STORE.md` v8 段 = 需求②「携名落库」的直系后果（非夹带）——请评审按三档同源核。
⑥ **[披露] `ACCOUNTS.md` §4 小计尾部悬余估算**（「（本批：+≈50 = members +≈18 ∥ routes-admin +≈17 ∥ routes +≈9 ∥ keys +≈6）」——无批名归属、与 DESIGN 面不符）已在原位随正为带批名条目（一致性面；判决过程零改）。
⑦ **[披露] 板档滞账**：`design/PROJECT.md` §4 索引 42–46 ∥ §7 AC-23/AC-24 行（前两批漏登）已随本批补齐；2026-10-07 各批 §6 总账行仍缺——建议各批回填轮或父侧一次性补（§9 R40②）。
⑧ **[披露] 需求② 边界句「不动 admin 面既有行为」**在本设计下成立（`routes-admin.mjs`/`views-admin.mjs` 零触；接入卡 admin 面措辞零改）。

### 2.8 需求边界句的一处读法（报评审裁）

- 需求 §2:25 边界句「不动 admin 面既有行为（**接入卡源不动**）」——本设计的读法 = **admin 面行为/渲染逐字段零改**（同源复用需对构件加导出与变体参数：`views-system.mjs` `accessSection` ⇒ `accessCard(ctx, variant)` 导出，+≈6 行）；另一读法 = 该档**源码零触**——若按此读，则须在成员面另建第二份接入卡（同源要求落空、两卡漂移面）。本设计取前者（`webui/WEBUI.md` §2.3⑥；`admin` 面行断言回归 = 批内件）。**如评审/用户按「源码零触」读 ⇒ 回笔并改设计**。
- 同拍登记：自助上限 20 把（CLI 免）∥ 名称上限 40 字符 ∥ 默认名 `key-N` 落库 ∥ 轮换页面下架（端点保留）——四项均为**设计轮新增面**（需求未点名），已在 §2.7②/① 上抛；需求档回笔由主 agent 定（若需）。

### 2.9 设计档自查补记（词汇口径——一名两形）

- **发现**（探索面）：`i18n-zh.mjs` 现文案族里同一实体有两名——页题 `me.keys.title`（「我的 key」）∥ nav `nav.page.me.keys`（「key 与签发」）∥ 管理面（「key 清单」/「key 数」）∥ 审计型（「key 签发/吊销」）∥ 接入卡（`system.accessHint`）用「key」；而需求 §2:25③ 的字面列头 = 「密钥」。
- **处置**（设计轮裁）：本批新文案取需求 ③ 字面（「密钥」——列头/按钮/弹窗；卡题 = 「密钥清单」）；上述既有面**本批零触**（零触面枚举在册）；一名两形作为登记项（`webui/WEBUI.md` §2.2 键族登记「词汇口径」条 ∥ `design/PROJECT.md` §9 R40③），**统一 = 另笔**（建议主 agent 回笔需求或后续随正批一次性收口）——本批不自行改名（跨面文案 = 面外语义面）。
- **批内件同拍**：键存在性断言按本表；「提示形」零残留断言只扫本页可见文案与新键值（既有面「key」保留——断言不得波及面外键值）。

**fix 轮——评审 #43 七号落修（eng-designer · 2026-10-07）**

- **#1**：`design/PROJECT.md` §6 添注⑩（`:212-215`）+ 本批行指针（`:156`）——me-keys 随正件行数（实读）⇒ ≤±N + 新批内件（拟）估算 ≈450 行/拆档触发；**实读勘误两处**：① 原「六名」中 `2026-10-07-quota-v2.test.mjs`（§2.5 ∥ §9 R40① 两处）盘上无此件——实为 `-quota-v2-member-models`（`:526`/`:545` 复数直测在其内——与断点件同件；R40① 已收正 `:303`）；② 门禁件数随正两档漏列（`-server-auto-update` **498** ∥ `-quota-per-model` **447**——`prepublishOnly` 22 ⇒ 23 断言/注释同拍——R40① 补列）——随正实单 = 七档。**§2.5 修正面 = 本块**（append-only——原行不回溯改写）。
- **#2**：`accounts/ACCOUNTS.md` §1.1 增「命名落位（各创建路径）」条（`:18`）+ 端点行（`:23`）/§3 轮换行（`:87`）`name` 落位 + §5 AC-25 行「空串零残留」断点（`:125`）；`store/STORE.md` 零动（不变量在 ACCOUNTS 闭合后成立——视需 = 否）。
- **#4**：`webui/WEBUI.md` §5 两表净增口径收正（`:447`/`:448`——净 ≈+22 ⇒ **≈+23**；行数估不动——照「改值不改行数」）。
- **#5**：`design/PROJECT.md` §6 越线在册补 `views-admin.mjs` **331** ∥ `views-providers-modals.mjs` **367**（2026-10-07 实读——`:146`/`:147`）+ 「此外最宽」实读收正（`config.mjs` **260** ∥ `README.md` **244**——原 README 句「241 ⇒ ≈255」陈旧）。
- **#6**：`design/PROJECT.md` §9 R40③（`:303`）需求边界句读法 = 已裁（需求档回笔在案：同源构件复用——导出/变体参数允许；admin 面渲染/措辞零改）。
- **#7**：`webui/WEBUI.md` §2.2 键族登记补「复用 1 键」条（`:90`——`me.keys.neverUsed`）+ §2.3⑥ 表句登记键名同拍（`:118`；两表在盘、本批零改）。
- **#8**：`webui/WEBUI.md` §2.5④（`:200`）悬停枚举删「ul 清单行」（与 AC-19 续「行悬停声明 = 2 条」对齐——D8 零残句）。
- **口径与披露**：零新语义（除 #1 实读勘误两处——死名归并 + 门禁件数补列，均随报告逐条披露）；各设计档变更记录一行同拍；机检（`node scripts/doc-check.mjs`——cwd = `thincoder/`）：悬空 0 ∥ 行宽 OK ∥ exit 0（改前/改后同值）；#3 = 父侧另笔（需求档面——非本笔）。

**术语定音微轮（fix——本页文案词位「密钥」⇒「API Key」；eng-designer · 2026-10-07）**

- **来源与口径**：用户 16:41「惯例都叫apikey」+ 16:43 取 B（§1.3 术语门）；需求 §2:25②③ 已由父侧回笔（「密钥」⇒「API Key」）——本笔 = 设计档侧词位同步。判定 = 会照进 UI 的字串（列头/卡题/按钮/弹窗文案/空态）⇒「API Key」（zh 保留英文原形 ∥ en = "API key"）；机器面/内部称法（`me.keys.*` ∥ `key_issue` ∥ API 路径 ∥ 样式族类目语）不动；既有四面（nav/管理/审计/接入卡）零触——统一 = 另笔（台账 #1025）。
- **逐处（2 档 11 行 19 词位）**：`webui/WEBUI.md` `:26`（路由行 3）∥ `:89`（改值键 2——行宽守界折行两行化）∥ `:92`（词汇口径条 1——zh/en 形制 + #1025 指针；行宽守界折行）∥ `:119`（2）∥ `:120`（2）∥ `:121`（1）∥ `:123`（1）∥ `:462`（AC-15⑥ 1）∥ `:476`（AC-25 2）∥ `:500`（KD-SV-47 3）；变更记录 `:564` 一行同拍；`design/PROJECT.md` `:303`（R40③——字面 + #1025）+ 变更记录 `:344` 一行。
- **残留（复扫逐条判定——全部内部语 ∥ 面外 ∥ 记录面；本页 UI 词零残留）**：`webui/WEBUI.md` 12 行——`:173`/`:178`/`:285`（Provider 面 #87——面外）∥ `:195`/`:236`/`:315`/`:357`/`:359`（样式族类目语/类名 `.secret`/`.secret-value`）∥ `:410`（admin 成员弹窗 key 表——管理面既有面）∥ `:458`（AC-11 provider 面）∥ `:562`（历史行）/`:564`（本笔记录行）；`accounts/ACCOUNTS.md` `:40`（「密钥面零涉」——登录防护内部语；本档本笔零改）；`gateway/API.md` 7 行 ∥ `ops/OPS.md` 5 行 ∥ `design/PROJECT.md` `:106`/`:231`（provider/embedding 面——面外）；`store/STORE.md` 零命中。
- **行正说明（append-only——原行不回溯）**：§2.1 #3/#6 行与 §2.9 条中的「密钥」字面 = 设计轮原裁，定音后以「API Key」为准（设计档已同步——上表）。
- **机检**：`node scripts/doc-check.mjs`（cwd/`--root` = 仓根）——悬空 0 ∥ 行宽 OK ∥ exit 0（改前/改后同值）。
- **零触**：需求档（父侧笔）∥ 既有四面文案 ∥ 机器面词 ∥ 代码/测试面（本笔仅设计档词位）∥ `store/STORE.md`。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（范围 = `docs/server/requirements/PROJECT.md` + `design/PROJECT.md` + `design/webui/WEBUI.md` + `design/accounts/ACCOUNTS.md` + `design/store/STORE.md`；重点批 = me-keys）

限制声明：无项目标准档、无文档地图（Document ownership 判据降级——按 Project Guide + 评审判据判定）；`gateway/API.md` ∥ `metering/METERING.md` ∥ `ops/OPS.md` ∥ `EVOLUTION.md` 不在评审范围 ⇒ 其承判的需求面（AC-2/3/4/6/8/9/10 等）未核验。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | File-size annotations | 🟡 | 本批随正六件测试档（`-console-list-style` ∥ `-console-layout` ∥ `-quota-v2-member-models` ∥ `-provider-model-metadata` ∥ `-console-completeness-2` ∥ `-quota-v2`）与新批内件无「当前行数 ⇒ 增量」注：`design/PROJECT.md:298`（R40①）仅列件名与断点，§6 本批行只写「批内件另计」（`design/PROJECT.md:155`）——无 §6 注①–⑨ 式「行数（实读）⇒ ≤±N」 | 沿 §6 注形补六件随正件的 ≤±N 注 + 新批内件行数估值与拆档触发条件（对照 `design/PROJECT.md:204` 注⑥形） |
| 2 | Clarity | 🟡 | rotate ∥ CLI 两条 key 创建路径的 `name` 取值未闭合：`ACCOUNTS.md:22`「轮换端点 `POST /api/me/keys/rotate` = **保留**」与 `ACCOUNTS.md:86`「端点 = API 兼容不变量，行为零改」未接默认名规则（`ACCOUNTS.md:17`「trim 后空 ⇒ **默认名 `key-N`**」）；CLI 路径在册（`ACCOUNTS.md:55` 写作点含「`thincoder-server/src/ops/cli.mjs` `key issue`」）而命名面明记「CLI 命名参数（后续如需——在案）」（`ACCOUNTS.md:23`）——若两径落空串，`STORE.md:192`「空串 = 迁移前存量行——随段回填默认名」不变量破裂（AC「空串零残留」只查迁移），me 页名称列（`WEBUI.md:117`）出现空首列 | 明写全部创建路径（issue ∥ rotate ∥ CLI）的 name 落库规则（共用默认名助手，或显式例外 + 显示口径）并在 AC 加断点 |
| 3 | Document ownership | 🟡 | 需求档随正欠账（跨档数字/清单）：AC-12 ∥ AC-14 行档目链止于「弹窗批后 **17 ∥ 18**」（`requirements/PROJECT.md:140` ∥ `:142`），设计侧已链到「⇒ **19 ∥ 20**（配置面批后——+ `model-specs-snapshot.mjs`）」（`WEBUI.md:454`）；AC-19 逐族套用表清单（`requirements/PROJECT.md:150`「（列表面 ∥ 按钮 ∥ 表单 ∥ 间距 ∥ 字排 ∥ 色板 ∥ 卡片 ∥ 弹窗内构 ∥ 空/错态——含 #87/#88 新增面接续标注）」）缺设计勘误的 ⑩ 码面（`WEBUI.md:464`「⑩码面——含 #87/#88 新面「随其落地套用」」） | 需求档 AC 行随正：档目链补 18 ∥ 19 ⇒ 19 ∥ 20；族目清单补 ⑩ 码面（或注明勘误授权）——先例 = `requirements/PROJECT.md:229` |
| 4 | Clarity | 🔵 | i18n 体量表估算差 1：`WEBUI.md:89`「表体量：zh 352 ⇒ ≈374 ∥ en 355 ⇒ ≈377（估——实施实读为准）」配「新增 **25 键**」（`WEBUI.md:86`）与「退役 2 键」，`WEBUI.md:446`「净 ≈+22」——25 − 2 = 23（改值不改行数） | 净增改 ≈+23（或注明扣减位）；终值以实施实读为准 |
| 5 | Document ownership | 🔵 | 板级越线总账句陈旧：`design/PROJECT.md:146`「此后越线在册：`app.mjs` ≈301（拆分预案 = `webui/WEBUI.md` §5） ∥ i18n 双表 312 ∥ 308（R25 独立结构轮）；二者外最宽 = `README.md` 实读 241」——域档现读 `views-admin.mjs`（`WEBUI.md:433`「⇒ 实读 331（2026-10-07）」）与 `views-providers-modals.mjs`（`WEBUI.md:435`「⇒ 实读 367（2026-10-07——列式收正批落地后）」）均已越 300 且宽于 README | 板级越线清单按域档现读收正（或并入 R40② 总账回填——`design/PROJECT.md:298`） |
| 6 | Document ownership | 🔵 | R40③ 子项已由需求档回笔解决仍以「供复核」上抛：`design/PROJECT.md:298`「∥ 需求边界句「接入卡源不动」读法（admin 面行为零改 vs 源码零触——批档 §2.8）」vs `requirements/PROJECT.md:123`「接入卡 = admin 同源构件复用——加导出/变体参数允许，admin 面渲染/措辞零改」（回笔在案 = `requirements/PROJECT.md:252`「同日回笔：边界句「接入卡源不动」⇒「同源构件复用（导出/变体参数允许，admin 面渲染零改）」——设计轮 §2.8 上抛经父侧裁定」） | 销项该子项或标注「已裁（需求档回笔在案）」 |
| 7 | Clarity | 🔵 | me 页「从未使用」文案键未登记：`WEBUI.md:117`「最后使用（`fmtTs(lastUsedAt)` ∥ 从未使用）」；本批新键清单（`WEBUI.md:86`）无该键，亦未指明复用（成员面同义键 = `WEBUI.md:407`「最后使用（本地化 ∥ `neverUsed`）」） | 登记该文案键（复用 `neverUsed` 或新增 `me.keys.*`）——与 AC-14「键引用闭合」机检对齐 |
| 8 | Document ownership | 🔵 | §2.5④ 悬停枚举未随 me-keys 删净随正：`WEBUI.md:199`「`--hover`：表格数据行 ∥ ul 清单行 ∥ 导航项」——唯一 ul 清单消费者已退役（`WEBUI.md:465`「`li.key-item:hover` 随 ul 清单退役删净——me-keys 批」；悬停声明清单 = 2 条） | §2.5④ 枚举删「ul 清单行」或注「me-keys 后无消费者」——与 AC-19 续 2 条声明清单对齐 |

VERDICT: pass

计数：🔴 0 ∥ 🟡 3 ∥ 🔵 5（无 🔴 ⇒ 通过；🟡/🔵 不阻塞）

## §4 用户批准（主 agent）

**状态行**：已批准（代签——2026-10-07）

### 4.1 代签核验（自缚三条）

- ① 设计评审 **0 🔴**：advisor#43 = pass（🟡3 ∥ 🔵5——七号已落修 #44 + 术语微轮 #45；父侧抽核 7/7 相符）。
- ② 修轮落定：`ACCOUNTS.md:18`/`:23` ∥ `WEBUI.md:26`/`:89`/`:92`/`:119`/`:120`/`:500`（术语 = 「API Key」——用户 16:43 定音 B）∥ 板档 `:146-147`/`:212-215`/`:303`；doc-check 悬空 0 · exit 0（改前/改后同值）。
- ③ token：已签发在握（值不落档）。
- 授权口径：用户 16:08「可以，先做出来看」（全链授权）+ 16:43 术语定音「B」。

### 4.2 实施派发（按变更面拆两轮——文件域不重叠、批内件共用件由调度器串行）

- **A 轮（服务端面）**：`src/store/db.mjs` ∥ `src/accounts/keys.mjs` ∥ `src/accounts/routes.mjs` + 批内件（服务端用例：v8 迁移四判据 ∥ 端点六态 ∥ 命名/上限/吊销）。
- **B 轮（前端面）**：`public/views-me.mjs` ∥ `views-system.mjs` ∥ `app.mjs` ∥ `style.css` ∥ i18n 两表 + 批内件（UI 用例追加）+ 旧批件随正七件（`.key-item` 断点 ∥ 值改 ∥ 门禁件数 22 ⇒ 23）。
- `thincoder-server/package.json`（prepublishOnly 22 ⇒ 23）= 工程工具面，父侧直笔（A 轮落定批内件后）。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-10-07（A 轮（服务端面）+ B 轮（前端面）两轮齐；批内件两件 13/13 绿 ∥ 审计零背离（两条已收正/本段补）∥ 代码评审 VERDICT pass（🔴0）；随正九件 + package.json 22 ⇒ 24 = 父侧落地）



**A 轮交付摘要（服务端面——逐档；行数 = 本会话实读，末行无尾空行计；估值 = 批档 §2.3）**

- `src/store/db.mjs`（210 ⇒ **224**，估 ≈228）：v8 段（`DDL_V8` = ALTER `api_keys.name` + 存量回填 UPDATE——与 `store/STORE.md` §2 v8 段逐字）∥ 迁移链尾 `{ v:8 }`。
- `src/accounts/keys.mjs`（109 ⇒ **143**，估 ≈131——越估 12 披露）：`MAX_ACTIVE_KEYS = 20` ∥ `normalizeKeyName`（trim ≤40 ∥ 非字符串 ⇒ 400 ∥ 空 ⇒ null）∥ 默认名助手 `nextDefaultKeyName`（`key-N`——该成员全部行数 +1；含吊销行单调不复用；issue ∥ rotate ∥ CLI 三径共用）∥ `issueKey` 携名落库（返回 += `name`）∥ `countActiveKeys` ∥ `activeKeysOf` 列增 `name`。
- `src/accounts/routes.mjs`（118 ⇒ **151**，估 ≈152）：`POST /api/me/keys/issue`（判权先行 ⇒ 空体/名称校验 ⇒ 上限 ⇒ 签发 ⇒ 审计 `key_issue`；200 `{id,name,hint,plain}`）∥ `POST /api/me/keys/:keyId/revoke`（他人 ∥ 不存在 ⇒ 同 404；幂等 200 `{ok,id,status}`；审计 `key_revoke`）∥ `memberView` key 行 += `name`/`createdAt`（`/api/me` ∥ `/api/members` 同源随动）∥ `readOptionalJsonBody`（零字节体 ⇒ `{}`——N32）。
- 新建批内件 `docs/batches/2026-10-07-me-keys-redo.test.mjs`（**370 行**；七腿：v8 迁移四判据 ∥ N31 ∥ N32 ∥ N33/N34 ∥ B28 ∥ B29 ∥ E23——B 轮延长本件）。

**读数（本会话实跑 · cwd = `thincoder/`）**

- 新批内件：`node --test docs/batches/2026-10-07-me-keys-redo.test.mjs` ⇒ **7/7 全绿**（tests 7 ∥ suites 0 ∥ pass 7 ∥ fail 0 ∥ duration_ms ≈2023）。
- 受影候选旧批件（六件联跑，零改）：**57 例 ∥ 48 pass ∥ 9 fail**——9 红全部由本批 A 轮直接引起（§2 版本 pin `[7,7]` vs 实读 `[8,8]` ∥ key 行精确形缺口 `name`/`createdAt`）：`-server-gateway`（:167/:168/:186/:201/:208——另 :205 失败迁移探针 `v:8` 与真 v8 段撞号，随正须改 `v:9`）∥ `-server-gateway-accounts`（:224/:306）∥ `-console-completeness-2`（:152/:173/:308）∥ `-provider-model-metadata`（:151/:168）∥ `-quota-per-model`（:150/:180）∥ `-quota-v2-member-models`（:167/:184/:188）。随正 = B 轮/父侧（批档在册）；两件（`-server-gateway` ∥ `-server-gateway-accounts`）不在 §2.5 实单内——清单缺口已上抛知会（父侧）。
- `node --check` 四档全过。**仓套件未跑** —— `not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**决策透明表**

| # | 决策 | 备选 | 何故 |
|---|---|---|---|
| 1 | 默认名序号 = 该成员全部行数 + 1（`COUNT(*)` 无 status 过滤） | 只数 active ∥ 查名字空位 | 设计「含吊销行——单调不复用」（ACCOUNTS §1.1）∥ 全库唯一 `INSERT INTO api_keys` 落点 ⇒ 无删除面、行数 = 签发序 |
| 2 | 空体判定 = `content-length: 0` ⇒ `{}` | 捕获 `JSON.parse` 失败兜底 | 解析失败与非法 JSON 同码易混；CL:0 覆盖标准 JSON 客户端（fetch/curl 无体 POST）；非 CL:0 零字节体 = 已知边界（评审 🔵 在册） |
| 3 | `{name:null}` 视同缺省 ⇒ 默认名 | 字面「非字符串 ⇒ 400」 | 仓内先例 = `createMember` 的 `name?`（null ⇒ 缺省——`members.mjs:112`）；审计列为设计留白（未覆盖项 #1） |
| 4 | 重复吊销每次各记一条 `key_revoke` | 仅首次记 | 沿 admin 吊销路由 ∥ CLI 先例（无条件 `recordAudit`）；设计未言明（审计在册） |
| 5 | 名称长度按 UTF-16 码元（`.length`） | 码点计数 | 设计「≤40 字符」未言明计法；仓内长度校验同口径（`MIN_PASSWORD_LENGTH` 同） |

**审计与代码评审轮次与终态**

- ① 内探索背离审计（只读子代理；对照批档 §2/§4.2 + ACCOUNTS §1.1/§3/§5/§7 + STORE §2 v8/§3/§4）：**clean**——四类背离（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）零命中；另列五项设计留白（低危——决策表 2–5 + keyId 文本形参数卫生）。
- ② 内 advisor 代码评审（四档 + 三文档）：**VERDICT pass**——0🔴 ∥ 🟡2（① 门禁在册两件随正清单缺口 + `package.json` 22 ⇒ 23 待父侧——已上抛知会 ∥ ② 批内件 370 行 > 300 咨询线 advisory——B 轮追加前定拆档阈值）∥ 🔵3（空体边界 ∥ 设计档行数回填（收口轮）∥ §5 待写 = 本段即补）。
- fix round（自纠 ≤5）：评审前 1 轮自纠（批内件 ①——node:sqlite 行对象 null-prototype 与 `deepEqual` 原型不等 ⇒ 数组映射化；修后复跑全绿）；评审后零 must-fix ⇒ 无追加修轮。
- 终态：**converged（clean）**。

**披露（偏离/越限/待办）**

- **随正清单缺口（已上抛知会）**：实跑 9 红全归本批 A 轮；其中两件不在批档 §2.5/§2.7 实单内（`-server-gateway` ∥ `-server-gateway-accounts`），且 `-server-gateway.test.mjs:205` 探针撞号须改 `v:9`——B 轮/收口按扩清单收正。
- **越清单**：无——除声明写域（三源档 + 新批内件）外零改动；产品面零新档（文件集未动）。
- **行数越估**：`keys.mjs` +34（估 +22——越估 12）∥ `db.mjs` +14（估 +10）∥ `routes.mjs` +33（估 +34——在估内）；批内件 370 行（>300 咨询线——advisory 在册）。
- **零触实核（git status）**：`members.mjs` ∥ `routes-admin.mjs` ∥ `gateway/**` ∥ `metering/**` ∥ `public/**` ∥ `package.json` ∥ 旧批测试件——零触。
- 单测隔离：临时库/内存库（`tmpdir` + `:memory:`）——零碰真库/生产数据。

**B 轮交付摘要（前端面——逐档；行数 = 本会话实读（`split("\n")` 末行无尾空行计）；估值 = 批档 §2.3）**

- `public/views-me.mjs`（122 ⇒ **194**，估 ≈211——在估内）：key 页重做（六列表 ⟨名称 ∥ API Key ∥ 签发时间 ∥ 最后使用 ∥ 近 30 天 ∥ 操作⟩ ∥ 页级一次性秘密区 ∥ 签发/吊销双弹窗 ∥ 行内吊销钮 ∥ 空态引导）+ 轮换按钮下架；imports += `mapError`/`openModal`/`accessCard`。
- `public/views-system.mjs`（172 ⇒ **175**，估 ≈178——在估内）：`accessSection` ⇒ `export function accessCard(ctx, variant = "admin")`（成员变体四键；admin 变体渲染/措辞零改——`renderSystem` 走 `"admin"`）。
- `public/app.mjs`（321 ⇒ **350**，估 ≈346——越估 4）：`showSecret` += 复制钮 + `copyText` 三路回退（clipboard ⇒ 选中 + `execCommand` ⇒ 保持选中 + flash 手动提示；成功 2s 复位）。
- `public/style.css`（224 ⇒ **218**，估 ≈219——在估内）：`ul.key-list`/`.key-item`/`.key-meta` 族删净（−6）；`.nav-item:hover` 注释收正。
- `public/i18n-zh.mjs` ∥ `i18n-en.mjs`（352 ⇒ **375** ∥ 355 ⇒ **378**，估 ≈374 ∥ ≈377——在估内）：+25 键 ∥ −2 死键（`rotate`/`rotateConfirm`）∥ 改值 4（净 +23）∥ en `.one` 变体 `{tokens} token`。
- 批内件两件：`2026-10-07-me-keys-redo.test.mjs`（370 行——头行随正，服务端七腿不动）∥ 新建 `2026-10-07-me-keys-redo-ui.test.mjs`（395 行——UI 六腿：页形 ∥ 双弹窗 ∥ 复制三路 ∥ 接入卡变体 ∥ 静态面 ∥ 键/类名零残留）；拆档理由 = UI 腿顺写原件越 500 硬限。

**读数（本会话实跑 · cwd = `thincoder/`）**

- 批内件两件：`node --test docs/batches/2026-10-07-me-keys-redo.test.mjs docs/batches/2026-10-07-me-keys-redo-ui.test.mjs` ⇒ **13/13 全绿**（7 + 6 ∥ duration_ms ≈161）。
- `node --check` 五档（`app.mjs` ∥ `views-me.mjs` ∥ `views-system.mjs` ∥ 两 i18n 表）全过。
- 门禁旁证：其余 13 件门禁档零改联跑 ⇒ **87/87 全绿**（本批产品面零外溢）。
- 随正九件（父侧落地——本子代理写门拒绝：跨批绑定）：实跑现状 **16 红（8 件）**——`gateway` ×2 ∥ `gateway-accounts` ×2 ∥ `list-style` ×3 ∥ `console-layout` ×1 ∥ `provider-model-metadata` ×2 ∥ `quota-per-model` ×1 ∥ `quota-v2-member-models` ×3 ∥ `completeness-2` ×2（`auto-update` 本刻零红——其门禁 pin 待 `package.json` 翻 24 后现）。
- 补件预验证：九件补件联跑 ⇒ **93/99 绿——6 红全为门禁件数（22 ⇒ 24 待父侧直笔）**；补件在 `.thincoder/tmp/me-keys-verify/patched/`（逐件 old→new 已在报告列明）。
- **仓套件未跑** —— `not repo-suite verified — the parent-side closeout run is the only repo-suite run.`

**决策透明表（B 轮）**

| # | 决策 | 备选 | 何故 |
|---|---|---|---|
| 1 | `me.keys.lastUsed` 列内消费（`t("me.keys.lastUsed", { time: ctx.fmtTs(...) })`）——内审 🔵 收正 | 直用 `ctx.fmtTs(...)`（§2.3⑥ 字面） | §2.2 键族登记已把该键改值为列内形 `{time}`——不消费 ⇒ 改值键成孤儿（与「零消费者删净」口径相抵）；两法输出逐字相同，取「两行皆真」读法 |
| 2 | 弹窗失败反馈 = 窗内状态行（401 非凭据类 ⇒ 踢登录） | 全量 `ctx.fail`（旧面先例） | §2.3⑥「失败 ⇒ 窗内状态行（弹窗定则——反馈落窗内）」；401 分径与 `views-admin`/`views-providers-modals` 逐字同形（先例） |
| 3 | 行内吊销钮复用 `admin.members.revoke` 键 | 新增 `me.keys.revokeRow` 键 | 设计键族 25 键表无此键（复用面）；操作列文案两表同词 |
| 4 | UI 腿拆新档（`-me-keys-redo-ui.test.mjs`） | 顺写原件（370 + UI 腿 ⇒ 越 500 硬限） | 硬限红线；两件同批留存 |
| 5 | 计时器捕获（UI 件复制腿——stub `setTimeout` 收 2s/8s 回调） | 让定时器真跑 | 真跑 ⇒ 进程白等 8s（首跑实测 duration_ms 8150 ⇒ 捕获后 161）；捕获顺证 2s 复位回调 |

**审计与代码评审轮次与终态**

- ① 内探索背离审计（只读子代理；对照批档 §2/§2.4 + WEBUI §2.2/§2.3⑥/§6 AC-25）：**findings**——四类背离（部分实现 ∥ 静默简化 ∥ 文档漂移 ∥ 越清单）**零命中**；两条 other：🟡 §5-B 段未写（本段即补）∥ 🔵 `me.keys.lastUsed` 零消费者（已收正——决策表 1 + UI 件加键消费断言）。
- ② 内 advisor 代码评审（六档 + 批内件两件 + 设计/需求四文档）：**VERDICT pass**——0🔴 ∥ 🟡4（`app.mjs` 350 行 ∥ i18n 两表 375/378 行 ∥ 批内件两件 370/395 行——三档行数咨询线，均在册/非 must-fix ∥ 批档 §4.2「七件/23」与 §1.4「九件/23-24」互斥——父侧回笔项）∥ 🔵3（吊销后刷新失败 ⇒ 错误 flash 被「已吊销」覆盖——顺序建议 ∥ 一名两形残留（#1025 在册）∥ 实读回填待落——本段 + 收口轮）。
- fix round（自纠 ≤5）：审计后 1 轮自纠（`me.keys.lastUsed` 消费化——修后两件复跑 13/13 绿）；评审后零 must-fix ⇒ 无追加修轮（🔵 顺序建议 = 记录在册、未实施——与设计「成功 ⇒ 关窗 + 表刷新 + flash」序相合，改动收益与复核成本不成比例）。
- 终态：**converged（clean）**。

**披露（偏离/越限/待办）**

- **随正九件写门拒绝（非越权）**：本子代理经机械写门拒绝（「cross-batch batch-record write」——本子代理绑定本批件）；随正九件 = 父侧落地（批档 §2.5「旧批测试——父侧落地」），补件预验证在 `.thincoder/tmp/me-keys-verify/patched/`。
- **门禁件数终值 = 24**（非 23）：`thincoder-server/package.json:13` 现列 22 件、两件 me-keys 批内件均未列；六处补件按 24 断言——父侧直笔 22 ⇒ 24 后 6 红自消。
- **`"hint error"` 计数 17 ⇒ 19**（`-console-list-style.test.mjs`）：本页双弹窗窗内状态行 +2——补件已同拍（title/注释/计数）；此点不在 A 轮实单内（B 轮新发现）。
- **行数越限/越估**：`app.mjs` 越估 4（+29 实）；批内件两件 370 ∥ 395 行（各 >300 咨询线——500 硬限内）；`views-me.mjs` 194（估 ≈211——在估内）。
- **零触实核**：`modal.mjs` ∥ `nav.mjs` ∥ `views-admin.mjs` ∥ `members.mjs`/`routes-admin.mjs` ∥ `gateway/**`/`metering/**` ∥ `package.json` ∥ 九件旧批件（原位）——零触；`src/**`（A 轮面）本次零改。

## §6 验证与收口（父代理）

**状态行**：已收口（2026-10-07）

### 6.1 收口链结果

- **设计**：评审 #43 = pass（🟡3/🔵5——七号落修 #44 ∥ 术语微轮 #45）；需求档回笔（边界句 ∥ AC-12/14/19 ∥ 术语「API Key」）；doc-check 悬空 0 · exit 0。
- **实施**：A 轮 #46（服务端——v8 迁移 ∥ 命名/上限 ∥ 两端点；内审 clean ∥ 内评 pass 0🔴）∥ B 轮 #47（前端——页重做/复制/接入卡/i18n；内审 findings 修毕 ∥ 内评 pass 0🔴）。两轮终态 = converged（clean）。
- **随正**：九件旧批测试（原七件 + 扩围 `-server-gateway` ∥ `-server-gateway-accounts`）+ `package.json` 门禁 22 ⇒ **24**（两批内件入链）——父侧落地（补件照取 + 抽样实核）。

### 6.2 父侧真跑读数

- **门禁全链**（`npm run prepublishOnly`，cwd = `thincoder-server/`）：**tests 186 ∥ pass 186 ∥ fail 0 ∥ exit 0**（24 件——含本批两件 13 用例）。
- **收口实拍**（`.thincoder/tmp/2026-10-07-me-keys-redo-walk.mjs`——内存库 + 头less CDP；六态）：① 六列表（名称/API Key/签发时间/最后使用/近 30 天/操作——key-1..5「从未使用」「0 tokens」）⇒ ② 签发弹窗（名称 + 上限/明文一次/旧钥照常三条提示）⇒ ③ 携名「团队压测用」签发 ⇒ 表 +1 行 + 页级秘密区明文 + 「复制」钮 ⇒ ④ 吊销弹窗（key-1 + 提示形 + 「吊销立即生效……不可撤销」）⇒ ⑤ 行离列 + flash「已吊销」⇒ ⑥ 接入指南卡（baseURL/四端/curl 全在）。截图 = `me-keys-redo-1..6-*.png`。
- **注**：实拍首跑 = 走查脚本选择器缺陷（签发窗「×」被误选——产品侧无责）；修脚本复跑取证全绿。

### 6.3 提交与核销

- **提交**：（随补）
- **台账**：#1023 在途 ⇒ 待核销 ⇒ 已核销。
- **留项**：#1025（用词统一轻通道笔——含本页遗留三串：页题「我的 key」 ∥ `me.keys.secretLabel`「新 key（明文）」 ∥ nav「key 与签发」）；`-server-gateway:192` EPERM 遮蔽现象（随正后自消——补件联跑已证）；批内件两件 370/395 行（&gt;300 咨询线、&lt;500 硬限——在册）。

### 6.4 用户面

- 16:08「可以，先做出来看」——实拍六图 + 读数呈报（本收口轮）。
