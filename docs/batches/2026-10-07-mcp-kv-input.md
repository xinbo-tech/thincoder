# 2026-10-07 · MCP 表单键值结构化输入（env ∥ headers——两端）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 父侧盘点（VSC MCP 表单 env 逗号分隔串 + 桌面同病实读补证）+ 用户 2026-10-07 19:04「3开小批now」（台账 #1036）。
> 台账 = #1036（vsc · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论与登记（2026-10-07 19:0x · 父侧）

- **来源**：父侧盘点（VSC MCP 表单 env 输入 = 逗号分隔串，placeholder「KEY=value, KEY2=value2 (comma-separated)」——值含逗号即坏）+ 桌面同病实读补证（`thincoder-desktop/renderer/views/settings-sections-mcp.mjs:92-95` `kvToInput` = `k=v, k2=v2` 串（与提交端解析互逆）∥ `:144/:150/:155` env/headers 共用）；用户 2026-10-07 19:04「3开小批now」。
- **台账**：#1036（并入本批）。
- **边界（小批）**：只动 MCP 表单 env ∥ headers 的输入形态（含解析 ∥ 回显 ∥ 加删行）；不拖其他 MCP 字段 ∥ 不涉他面。
- **源对齐**：VSC 为准、桌面逐元素对齐（用户 18:10 口径——本仓现行 doctrine）。

### 1.2 上抛项裁定（主 agent · 2026-10-07 19:5x · 核验通过）

- **上抛 1（需求档坐标漂移）**：裁 = 认可——**随实现轮收口父侧笔收正**（`docs/vsc/requirements/WEBVIEW.md:34` 两坐标按拆后新档实读收正，一笔落；拆档前现坐标仍成立，不预改）。
- **上抛 2（CLI `/mcp` 串式端差）**：裁 = **落账登记**（台账 tech_todo 已开 · trigger 归批——跨端形差默认消除；对齐评估随下批，本批不动 CLI）。
- **上抛 3（桌面拆档本批执行）**：裁 = **认可**——F2 三先例实读收正成立（装配点 `mount-settings-exits.mjs` 装配即合并 ∥ 单一 `handlers` 表对外零改）；父侧无另行设计 ⇒ 按 KD-6 本批执行。
- **上抛 4（需求卷落点）**：裁 = **维持「台账条目 + 批档判据」形**——需求卷（桌面 D9 模块级）已覆盖模块目标；输入形判据属设计定形（§2 A1–A6 = 判据单源），不增专条。
- **另认**：追记② `T-DSK64` 自铸（合规；占号冲突由届盘复核兜底）∥ 追记① 越域触（`MCP.md` 射程句 · 零语义改）——认，异议时单笔 revert 通道在册。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（两端行式键值编辑器（先拆后改两处 · 零新 CSS）· 续笔核验（追记⑥）· 2026-10-07）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 本批条目（覆盖）

- **条目 1 = MCP 表单 env ∥ headers 输入形态改行式键值（两端）**（台账 #1036 · vsc · 归批；源 = 父侧盘点 + 桌面实读补证——逐字 = §1.1）。病征：VSC 表单 env/headers = 逗号分隔单行串（`webview/settings-tools.js:66` ∥ `:71` ∥ `:76` 占位符「(comma-separated)」；解析 = `:389-404` `parseHeadersLike` 逗号切分）⇒ **值含逗号即坏**（`KEY=va,lue` ⇒ `KEY=va` + 残片丢弃）；桌面同形同病（`renderer/views/settings-sections-mcp.mjs:92-96` `kvToInput` ↔ `renderer/mount-settings-segments.mjs:30-44` `parseKv` 互逆串）。
- **条目 2 = 两端同形**（源对齐 doctrine —— §1.1：VSC 为准、桌面逐元素对齐）：形 ∥ 语义判据 ∥ 文案词值两端一致（实现各端自持）。
- **本批不动**：其余 MCP 字段（name ∥ type ∥ url ∥ wsUrl ∥ token ∥ command ∥ args——args 空格分隔口径零改）∥ CLI `/mcp` 串式表单（端差登记，见上抛项）∥ 键行 ∥ provider ∥ 索引 ∥ 核 ∥ `thincoder-render-core` 零触。落盘形零改：`env` ∥ `headers` 仍为对象，载荷仍 `{name, config}`（`src/config-mcp.mjs:26-28 ∥ :54-56` ∥ 桌面 `src/main/mcp-servers.mjs:102-110` 原样落盘——两主侧零改）。

### 设计档落点

- `docs/vsc/design/SETTINGS.md`：§1 卡表行（Tools & Services 实现入口 +`settings-mcp.js`）∥ §2.4（env ∥ headers 输入形态句改写）∥ §2.10 拆分复核条（`settings-tools.js` 拆档兑现）∥ §5 增 **U-S17**（行式键值编辑器）∥ 变更行。
- `docs/desktop/design/SETTINGS.md`：§1 增 **KD-76** ∥ §2.17 新立（本批注）∥ §3.1 三行（MCP 段体 ∥ 段出口族 ∥ 新档）∥ §3.2 本批块 ∥ 变更行；`docs/desktop/design/PROJECT.md`：§4.1 越层段该档行 + 拆档链登记行。
- `docs/vsc/design/VSC-DEBT.md`：§13.3 拆档表行（触发达成 ⇒ 兑现）。
- **实施后回填面（点名 · 归实现轮 / 回填轮）**：两档内指向已搬迁功能的 `file:line` 坐标——`docs/vsc/design/SETTINGS.md` §2.10 入口册 #5（`:201` ∥ `:205`）∥ MCP token/headers 表单读段（`:215-216`）∥ `renderMCPList` 坐标（`:223` ∥ `:235`）∥ 行载体段（`:272-276`）；`docs/vsc/design/WEBVIEW-PROTOCOL.md` `settings-tools.js` 发射坐标 7 行（`:492 ∥ :496 ∥ :498 ∥ :502 ∥ :510 ∥ :517 ∥ :532`）；桌面 `docs/desktop/design/SETTINGS.md` §2.2 项 5 内坐标随动（若有）。**判断规则**：活坐标 ⇒ 改指新档；记录面（变更记录 / 批档引文）零动。

### 机制设计（形态 = 本批定形；两端逐元素同形）

① **行式键值编辑器**（三组各一份：stdio `env` ∥ http `headers` ∥ ws `headers`）：每行 = 键格 + 值格 + ✕；行集下 = `[+ 添加行]` 钮；**零项 ⇒ 零行**（零假造——沿桌面「空表零节点」判）。加行 ⇒ 尾附一空行；删行 ⇒ 摘该行。字段序零改（env 居 args 后；headers 居 token 后）。
② **提交口径**（两端同判 · 逐条机检面 = A1/A4）：键 ∥ 值提交时两端 trim；**空键行 ∥ 空值行 ⇒ 不提交**（空值 = 旧串式 `k=` 删项语义的自然延续）；**重复键 ⇒ 后行胜**（沿旧串式 `out[key]=value` 判）；**全空 ⇒ 该字段删除**（`config.env` ∥ `config.headers` 键缺席——沿 `src/config-mcp.mjs:28 ∥ :54-56` 与桌面 `mcpConfigFrom` 现判：清空即条目重建时字段消失）。
③ **回显口径**（互逆 · 机检面 = A3）：行集 = 存储对象的 `Object.entries` 序（插入序保持）；**值 = 字面**（逗号 ∥ 等号 ∥ 引号 ∥ 空格原样——本批病灶即在此）；**口径变化点（明示）**：旧串式剥成对引号（`parseHeadersLike:397` ∥ `parseKv:38` 的 `replace(/^["']|["']$/g,"")`）——行式下引号 = 正文字符，**零剥离**（旧剥离系串式语法补丁，行式无此需要）。
④ **粘贴 = 零解析**（取舍记录）：不引入「粘贴按换行分行」等任何隐式解析——由 = ①值可含换行 ⇒ 分行同样误拆 ②新增解析面 = 小批边界外 ③本批病灶恶因即为「串 + 解析」。代价（明示）：多项录入须用 `[+ 添加行]` 逐行；粘贴整块文本 = 落在一个格内。
⑤ **边界（明示）**：值格 = 单行 `input` ⇒ **值内换行不可录入**（罕见；需要时另批裁 textarea）；键格零字符限制（首尾空白被裁）；加删行不落盘（仅表单态）。
⑥ **两端实现形**（同形不同构——各端自持，零跨端耦合）：
- **VSC（DOM 即态）**：行面 = `<div class="key-row">` + 两 `<input>`（宽度行内 style）+ `✕`（`.key-btn.del-key`）；加 ∥ 删 = 行容器上的事件委托（沿同档既有 `addEventListener` 绑定形态）；预填 = 对象 → 行集；保存 = 行集 → 对象（空 ⇒ 不设该键）。**实现落点 = 新档 `webview/settings-mcp.js`**（先拆后改——见 ⑦）：§2.10 注册拆档案触发（「MCP 面下次结构改动」——本批即触发；阈值 450 未到亦执行）。
- **桌面（零 DOM 描述符树 + 切片）**：行令牌态 = `form.kv = { env ∥ headers ∥ wsHeaders: [{ t, k, v }] }`（表单开时自 config 生成 ∥ 随 `form` 生命周期复位）；令牌 `t` = 表单内单调递增、**永不复用**（防草稿残值复活——`renderer/view-state.mjs:168-174` 草稿按 `id` 定位，索引键在删行后会把旧值灌进新行）；行件 = `.settings-field-row` + 两 `.settings-field`（`data-draft` 申报 ∥ `id = mcp-<group>-<k\|v>-<t>`）+ `.settings-row-action` ✕；**加删出口** = `onMcpKvAdd(group)` ∥ `onMcpKvRemove(group, t)`：先自读 DOM 行集（无 DOM ⇒ 空转——同 `readMcpForm:238-249` 退化式）→ 写切片 → 重挂（#604 两闸捕获 ∥ 复填保输入）；**类型切换出口** `mcpFormType` 同拍同步当前组行集（切换不丢手——承 `draft` 先例）；提交 = FormData `getAll("<group>-k")` ∥ `getAll("<group>-v")` 按 DOM 序配对 → 判同②；`readMcpForm` 草稿快照**不采行件**（行值保真归令牌 + 草稿闸两层）。
⑦ **拆档两处（先拆后改——零语义搬移在前，改动在后）**：① VSC `webview/settings-tools.js`（现 **433**）⇒ MCP 面（`renderMCPList` ∥ `updateMcpTools` ∥ `updateMcpTestResult` ∥ `parseHeadersLike`→**删** ∥ `openMcpForm` ∥ `kvToInput`→**删** ∥ `bindToolsControls` MCP 段 ∥ `toolsCardHtml` 表单段）出档 `webview/settings-mcp.js`（缝 = `mcpFormHtml()` ∥ `bindMcpControls()` 两口回插 + `settings.js` import 源一行改；对外导出名零改——`chat.js:50` ∥ `settings.js:59` 消费面零改）。**给由 = 硬限**：433 + kv 面 ≈ +80 ⇒ ≈513 **越 500 硬限**（≤300 建议线段同触）。② 桌面 `renderer/mount-settings-segments.mjs`（现 **364**，越 300 在册 + 注册预案 = MCP 族再出一档——`docs/desktop/design/SETTINGS.md:231` ∥ `PROJECT.md:397`）⇒ MCP 族出口 + kv 件出档 **`renderer/mount-settings-segments-mcp.mjs`**（拟新增；沿 `-models.mjs` ∥ `-providers.mjs` ∥ `-agent.mjs` 先例；缝 = 同形工厂 `createSegmentExits(deps)` 返回 handlers，主档合并表零改）。**给由 = 在册预案触发**（本批 = MCP 族结构性触碰——前批「行级小修 ⇒ 顺延」句不再成立）。
⑧ **文案（两端 × 两语逐字——新键 4 + 值改 4）**：新键 `settings.mcp.kvAdd`（en `+ Add row` ∥ zh `+ 添加行`）· `settings.mcp.kvRemove`（en `Remove row` ∥ zh `删除行`——桌面行 ✕ 的 aria-label）· `settings.mcp.kvKey`（en `KEY` ∥ zh `KEY`）· `settings.mcp.kvValue`（en `value` ∥ zh `值`——两格占位符）；值改 `settings.mcp.env`（en `Env` ∥ zh `环境变量`）∥ `settings.mcp.headers`（en `Headers` ∥ zh `请求头`）——**「comma-separated ∥ 逗号分隔」措辞退场**（`locales/en.json:139/:143` ∥ `locales/zh.json:139/:143` ∥ 桌面 `i18n-views.mjs:205/:209 ∥ :378/:382`）。
⑨ **零新 CSS（两端）**：VSC 复用 `.key-row ∥ .key-btn ∥ .del-key` + 行内宽度；桌面复用 `.settings-field-row ∥ .settings-field ∥ .settings-row-action`（✕）∥ `.settings-submit`（添加行）。**给由** = 避触样式族拆档窗口（VSC `settings.css` 注册件 = `docs/vsc/design/SETTINGS.md:556`；桌面 `settings.css` 在册越线，预案 = 控件族出档）。
⑩ **零新状态源**：VSC = DOM 即态（沿面板「单一状态源」精神——表单态不入 SS）；桌面 = 切片 `form.kv`（沿 S8 面态归属口径；开 ∥ 关面复位 = `resetFacets` 现径同拍）。

### 受影响文件与测试面（行数 = 内容行数口径 · as-of 2026-10-07 实读）

| 端 | 档 | 行数 | 改动面 |
|---|---|---|---|
| VSC | `thincoder-vscode/webview/settings-mcp.js`（拟新增） | 0 ⇒ **≈250** | MCP 面搬移（≈170）+ kv 行面（≈80） |
| VSC | `thincoder-vscode/webview/settings-tools.js` | **433 ⇒ ≈270** | MCP 面出档（−170）+ 卡壳两插点（+7）；≤300 回线 |
| VSC | `thincoder-vscode/webview/settings.js` | **190 ⇒ 190** | import 源一行换（数不变） |
| VSC | `thincoder-vscode/locales/en.json` ∥ `zh.json` | **284 ⇒ ≈288** | +4 键 ∥ 两值改 |
| VSC | `thincoder-vscode/webview/settings.css` | **≈405（在册）** | **零触** |
| 桌面 | `thincoder-desktop/renderer/mount-settings-segments-mcp.mjs`（拟新增） | 0 ⇒ **≈240** | MCP 族出口搬移 + kv 件 |
| 桌面 | `thincoder-desktop/renderer/mount-settings-segments.mjs` | **364 ⇒ ≈195** | MCP 族出档；≤300 回线 ⇒ 越层除名 |
| 桌面 | `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` | **185 ⇒ ≈250** | 行件构树 + 加删钮 + kv 组渲染 |
| 桌面 | `thincoder-desktop/renderer/i18n-views.mjs` | **398 ⇒ ≈406** | +4 键 ×2 语 + 两值改（词值类 ⇒ 非结构性——沿同档先例） |
| 桌面 | `thincoder-desktop/renderer/settings.css` ∥ `src/main/mcp-servers.mjs` ∥ `src/extension/panel-mcp.mjs` | — | **零触** |

**测试面** = 批内件 `docs/batches/2026-10-07-mcp-kv-input.test.mjs`（拟新增 · ≈300 行 · 四腿）：L1 桌面构树（`mcpBody` 平 node：回显逗号保真 ∥ 零项零行 + 添加钮在场 ∥ 加删 handler 绑定 ∥ 行 id 唯一）；L2 桌面出口（`createSegmentExits` 桩 + `FormData`：加 ∥ 删令牌 +1 ∥ −1 且不复用 ∥ 配对判据四态——逗号值 ∥ 空行丢 ∥ 重复后胜 ∥ 全空 ⇒ 字段删）；L3 VSC 真 webview（happy-dom：加 ∥ 删行 ∥ 保存载荷含逗号值 ∥ 预填—保存互逆）；L4 源扫（四新键 × 两端 × 两语在场 ∥「comma-separated ∥ 逗号分隔」零残留 ∥ 标签值 = 约定值）。**仓套件零改**（VSC `test/files.mjs` 清单 = 空 ∥ 桌面 `test/` 无涉；集成面零涉——表单面非集成档位）。**真机走查项（点名）**：VSC 面板 MCP 表单 add ∥ edit 两态 + 桌面设置页 ∥ 弹窗 MCP 段两态——重点 = 值含逗号 token 存取 ∥ 加删行 ∥ 类型切换保真 ∥ 保存后重开回显逐字同。

### 验收对照（逐条机检 / 走查）

- **A1 值含逗号不坏**：`KEY=va,lue` 两端录入保存 ⇒ config.json `env.KEY === "va,lue"`（机检 = L1 ∥ L2 ∥ L3）。
- **A2 两端同形**：行 = 键格 + 值格 + ✕；`[+ 添加行]`；零项零行；文案词值两端同（机检 = L4 键值面 + 构树面；走查 = 真机两态）。
- **A3 提交/回显互逆**：非空项集 `read(render(cfg)) ≡ cfg`（序保持 ∥ 值逐字）；零修改保存 ⇒ 载荷与现值同（机检 = L1 ∥ L3）。
- **A4 提交判据**：空键行 ∥ 空值行丢弃；重复键后行胜；全空 ⇒ `env` ∥ `headers` 键缺席（机检 = L2）。
- **A5 词面零残留**：`comma-separated` ∥ `逗号分隔` 在 MCP 表单面零残留（机检 = L4 + 全仓 grep）。
- **A6 行数纪律**：两新档 ≤ 300 ∥ 两主档回线（≤300）∥ 硬限 500 全绿（机检 = 回填轮实读）。

### 关键决策

- **KD-1 行式键值（每行两格 + 加删行）**——功能对位 VSC 先定、桌面逐元素对齐。被否：① 保留单行 + 转义语法（`\,` 自造语法 = 第三套口径，且用户须记住转义）② JSON textarea（桌面 S8 已判退场——不可读）③ 每项一枚「键=值」小弹窗（操作面 ≫ 收益）。
- **KD-2 空值/空键/重复/全空判据** = 沿旧串式语义的自然延续（③②已述）——旧表单「`k=` 删项」技法由 ✕ 承接。
- **KD-3 值 = 字面（零引号剥离）**——口径变化点明示（④③）；由 = 引号剥离系串式语法补丁；风险 = 存量含引号值（手工编辑 config 才会出现）保存后原样保留（零损坏）。
- **KD-4 粘贴零解析**——取舍见 ④；被否：换行分行（值可含换行 ⇒ 误拆）∥ 逗号分行（= 复刻病灶）。
- **KD-5 桌面行值不落草稿快照**（`readMcpForm` 不采行件）——行值保真 = 行令牌 + #604 草稿闸两层；并入快照会引入「重复 name 塌缩」（`draft[name]` 单值槽）缺陷。
- **KD-6 拆档两处先拆后改**——给由见 ⑦（VSC = 硬限；桌面 = 在册预案触发）。被否：VSC 减量保限（删解析换净增也贴 500 顶格——零余量 = 结构债）。
- **KD-7 零新 CSS**——给由见 ⑨。
- **KD-8 单行 input 边界明示**（⑤）——被否：`textarea` 值格（高度参差 ∥ 越本批边界）。

### 上抛项

- **上抛 1（主 agent 笔 · 需求档坐标漂移）**：`docs/vsc/requirements/WEBVIEW.md:34`（F-W17 判据句）内 `settings-tools.js:190`（MCP 行 ✕ 生成）∥ `:194-200`（绑定）坐标将随拆档漂移——需求档笔权 = 主 agent；本批实施轮提供新档实读坐标，请主 agent 收正（本仓同类先例 = 需求档坐标随批收正）。另 `:176` 句（MCP token/headers 表单清空保存 = 表单语义 ≠ 删除动作）**本批后仍成立**（行式加删 = 表单态，不落盘）。**本批不受阻**——继续推进，该项按「无回复 ⇒ 报告未办」纪律处置。
- **上抛 2（登记 · CLI 端差）**：CLI `/mcp` 表单 env/headers 仍为逗号串（`thincoder-cli/src/tui/cmd-mcp-form.mjs`；口径单源 = `docs/core/design/MCP.md:131-144`）——本批边界 = 两端（VSC ∥ 桌面），CLI 未动 ⇒ **管理面三端形不一致**（VSC/桌面行式 vs CLI 串式）。请主 agent 裁：落账登记（如「CLI 串式随下批对齐」）或裁定维持端差。
- **上抛 3（报备 · 可裁）**：桌面越层档 `mount-settings-segments.mjs`（364 > 300）拆档 = 本批执行（KD-6）。若父侧判「续期」⇒ 改动面回缩为单端（VSC）拆档 + 桌面原档内改（+≈65 ⇒ ≈429，仍 <500 硬限）——两案均齐 A1–A5，差异仅结构面。

### 本批 §2 追记（设计轮落盘确认 · 2026-10-07）

**已落盘（本笔实核）**：`docs/vsc/design/SETTINGS.md`（§1 卡表行 ∥ §2.4 行式键值段 ∥ §2.10 拆分复核条翻「触发条款达成 ⇒ 拆档已执行」∥ §5 +**U-S17** ∥ 变更行）· `docs/vsc/design/VSC-DEBT.md`（§13.3 `settings-tools.js` 行：**433** 实读 + 触发「达成 ⇒ 拆档执行」+ 收束句改「一档触发未到 · 一档达成」）· `docs/desktop/design/SETTINGS.md`（§1 +**KD-76** ∥ §2 **§2.17** 新立 ∥ §3.1 三行 ∥ §3.2 本批块 ∥ §5 +**T-DSK64** ∥ 变更行）· `docs/desktop/design/PROJECT.md`（§2 KD 索引 +KD-76 行 ∥ §4.1 次大两档句 + 越层段该档行（预案触发 ⇒ 本批执行）∥ 拆档链登记 +新档行）· `docs/core/design/MCP.md`（§6.5 射程句 ∥ §7 D-MC9 射程括注 ∥ 变更行）。

**追记 ①（一致性面当场修 · 逐条报告）**：`docs/core/design/MCP.md:106`（§6.5）原句「headers / env 键值对输入：**统一为逗号分隔**」+ §7 **D-MC9**——核档「统一」措辞在三端面不再成立（GUI 两端本批改行式）⇒ 已加**射程句**（本条 = CLI `/mcp` 表单面）+ D-MC9 射程括注（**零语义改**：条文内容 ∥ 判由 ∥ 行为逐字未动，仅辖域显名）。归属说明 = 本批跨域触碰核心档（前例 = 同档「消费面」句随桌面批收正）；若父侧判越域 ⇒ 该两处可 revert（单笔可回滚）。

**追记 ②（用例号自铸披露）**：`T-DSK64`（MCP 键值行式输入走查行）= 本批自铸（沿先例；若并行批占号 ⇒ 父侧并号裁定）；落点 = `docs/desktop/design/SETTINGS.md` §5。

**追记 ③（批内件的写轮次）**：`docs/batches/2026-10-07-mcp-kv-input.test.mjs` 本笔**未写**（设计轮 = 规划：四腿定义 ∥ 走查项已入本 §2 与两设计档）；**写 + 跑 = 实现轮**（eng-coder——批内件随批留存 · 不进仓套件）。

**追记 ④（回填面清单不改）**：实施后回填面（= 上「设计档落点」段中点名的 `file:line` 坐标族 ∥ 拆后两档实读 ∥ 新档实读）**随实现轮 / 回填轮**落；本笔已把该义务登记进两设计档的变更行（VSC SETTINGS.md 变更行尾「实施后回填面」句 ∥ 桌面 PROJECT.md §4.1 越层段「回填轮落数」句）。

**追记 ⑤（上抛 4 · 判定线落卷 · 主 agent 笔）**：本批 = 台账 #1036（需求池条目），需求卷**无 env ∥ headers 输入形对位条目**（实读：`docs/desktop/requirements/SETTINGS.md:14` D9 = 「MCP ∥ 服务器增删与工具入口（复用核）」——模块级一句，未定输入形；`docs/vsc/requirements/WEBVIEW.md` 侧无 MCP 表单输入形条目）⇒ **无需求档矛盾**（本条 = D9 模块目标下的设计定形），但本批判据（A1–A5：值含逗号不坏 ∥ 两端同形 ∥ 提交回显互逆 ∥ 提交四判据 ∥ 词面零残留）无需求卷落点。请主 agent 裁：① 落需求卷（桌面 D9 行补输入形判据 ∥ VSC 增条目）② 或维持「台账条目 + 批档判据」形（本批不阻塞——设计档 ∥ 批档均已载判据全文）。

**追记 ⑥（续笔核验轮——前席被杀重启接续 · 2026-10-07）**

**核验结论 = 继续**（前轮半成品成立）：五档 diff 与 §2 声称逐条一致；行数实读复验（VSC `settings-tools.js` **433** ∥ 桌面 `mount-settings-segments.mjs` **364** ∥ `views/settings-sections-mcp.mjs` **185** ∥ `i18n-views.mjs` **398** ∥ 两 `locales` **284**）；病灶坐标实读在位（`webview/settings-tools.js:66 ∥ :71 ∥ :76`、`parseHeadersLike:391-404`；桌面 `views/settings-sections-mcp.mjs:92-96` ∥ `mount-settings-segments.mjs:30-44` ∥ `view-state.mjs:168-174`）；词键 `settings.mcp.kv*` 全仓零占用；两造型类名族在场（VSC `.key-row ∥ .key-btn ∥ .del-key`；桌面 `.settings-field-row ∥ .settings-row-action ∥ .settings-submit`）；需求档两处实读（`docs/desktop/requirements/SETTINGS.md:14` D9 模块级 ∥ `docs/vsc/requirements/WEBVIEW.md` 无对位条目）= 追记⑤所载一致。

**续笔收正（一致性面当场修 · 逐条 → 设计档）**：
① 时态三处（设计轮产品码零触 ∥ 新档实未建——`thincoder-vscode/webview/` 目录实读无 `settings-mcp.js`）：`docs/vsc/design/SETTINGS.md:530`「拆档已执行」⇒「拆档执行」∥ `:531`「已建」⇒「拟新增」；`docs/desktop/design/PROJECT.md:384`「拆档执行中」⇒「拆档执行（本批）」。
② 缝句三处（`docs/desktop/design/SETTINGS.md:32 ∥ :213 ∥ :244`）：「主档合并表零改」按三先例实读收正 ⇒「装配点 `mount-settings-exits.mjs` 装配即合并、单一 `handlers` 表对外零改」（依据 = `createModelsExits ∥ createProviderExits ∥ createAgentExits` 调用位同档 `:152 ∥ :156 ∥ :162` ∥ 合并表 `:226-238`）。
③ **受影响面 +1**：`mount-settings-exits.mjs` **254 ⇒ ≈258**（装配点 +import/+工厂调用/+合并展开）——本 §2「受影响文件与测试面」表原缺该档，以本追记为准；设计档 §3.1 行 ∥ §3.2 本批块行已落（现行 `:243` ∥ `:337`）。
④ 回填面坐标修正（§2「设计档落点」段所列四组数字为 §2.4 插入（+5 行）前旧值）：VSC `SETTINGS.md` 现读 = 入口册 #5 `:206 ∥ :210` ∥ MCP token/headers 读段 `:220-221` ∥ `renderMcpList` `:228 ∥ :240` ∥ 行载体段 `:277-281`（该档变更行已同拍收正）；`settings.css` 注册件现读 = `SETTINGS.md:560`（§2 ⑨ 原记 `:556` 不指该条）。`WEBVIEW-PROTOCOL.md` 七行（`:492 ∥ :496 ∥ :498 ∥ :502 ∥ :510 ∥ :517 ∥ :532`）实读**准确**。
⑤ L4 零残留扫描面界定：面 = 两端表单源面（VSC `webview/**` + `locales/**`；桌面 `renderer/**`）；CLI（批外）∥ 记录面（CHANGELOG ∥ 历史批档 ∥ baseline）∥ 产物面（`dist*` ∥ `.thincoder/tmp`）不在扫描面——防误红。
⑥ 登记（非阻塞 · 实现轮顺手）：`mount-settings-segments.mjs:30-31` 注释引 `settings-tools.js:356-369`（旧坐标；实位 `:391-404`）——随 kv 件重写自然消解。
⑦ 三档变更行追行已落（`docs/vsc/design/SETTINGS.md` ∥ `docs/desktop/design/SETTINGS.md` ∥ `docs/desktop/design/PROJECT.md`——含 PROJECT 前轮欠行补记）；批内件未写（承追记③）；**产品码零触（续笔）**；追记④⑤（回填面清单 ∥ 上抛）结论不变。

## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
