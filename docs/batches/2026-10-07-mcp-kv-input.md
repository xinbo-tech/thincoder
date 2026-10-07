# 2026-10-07 · MCP 表单键值结构化输入（env ∥ headers——两端）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 父侧盘点（VSC MCP 表单 env 逗号分隔串 + 桌面同病实读补证）+ 用户 2026-10-07 19:04「3开小批now」（台账 #1036）。
> 台账 = #1036（vsc · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（设计评审 pass（🔴0）· 实施舱已交（13/13 绿 · 评审 clean）· 回填轮已交 · 套件读数已取 · 真机走查待（T-DSK64））
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
**状态行**：设计完成（两端行式键值编辑器（先拆后改两处 · 零新 CSS）· 续笔核验（追记⑥）· 修复轮（#1–#7 · 追记⑦）· 实施后回填轮（追记⑧ · 2026-10-07））
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

**追记 ⑦（设计评审修复轮——§3 轮次 1 · 发现 #1–#7 逐号落实 · 2026-10-07）**

**口径**：父侧裁 = 七发现全采纳（🟡×4 ∥ 🔵×3）；本轮点修——只修 #1–#7（零新语义 ∥ 零扩面 ∥ 不改判据 ∥ 不加机制 ∥ 不重排结构）；产品码零触；§1 ∥ §3–§6 零动；需求档零动。

**逐号落盘（号 → 落点）**：

- **#1** → `docs/core/design/MCP.md:106`（§6.5）主句改 CLI 作用域——「**headers / env 键值对输入**：**CLI `/mcp` 表单面 = 逗号分隔**」（「统一」残句删）；射程句（`:107`）∥ §7 D-MC9（`:193`）括注零动；变更行同拍（`:252`）。
- **#2**（登记 · 回填面 +2 项）→ ① `docs/desktop/design/SHELL.md` §1 树 +新档行（`mount-settings-segments-mcp.mjs`——MCP 键值行式输入批（#1036）拆档产出 · 拟新增；同族行位 = `:80-85`；先例 = `SHELL.md:330`「§1 树增一行（`settings-modal.mjs`——D39 新档）」），相关计数行随动；② `docs/vsc/design/WEBVIEW.md` §3 文件表 +新档行（`settings-mcp.js`——拟新增）+ `settings-tools.js` 读数随动（**433 ⇒ ≈270**；先例 = `WEBVIEW.md:722`「§3 文件表 **+2 行**（`chat-messages.js` **234** / `chat-status.js` **124**——读数 + 面）」）。**随实现轮 / 回填轮落**（落地后去「拟新增」+ 实读回填）。
- **#3**（登记 · 回填面 +1 项）→ `docs/vsc/design/SETTINGS.md` §2.10 判据域边界档数——**按现盘基数**：设置面档 **9 ⇒ 10** ∥ 合域含 `input.js` **10 ⇒ 11**（`settings-mcp.js` 命中 `/^settings.*\.js$/` 入域）；随拆档同拍收正——已并入该档「实施后回填面」清单（`:708`）+ 修复轮变更行（`:711`）。**另注（事实）**：现文「实读 8 档 ∥ 9 档」与现盘差一——并行批（`2026-10-07-provider-config-parity` · #1029）新档 `thincoder-vscode/webview/settings-provider-dialog.js`（已落盘）未计；差项归并行批 / 回填轮同拍消解（本笔不改其数）。
- **#4** → `docs/desktop/design/PROJECT.md:401`（§4.1 越层段 `i18n-views.mjs` 行）补本批触属性句（**398 ⇒ ≈406**——kv 四新键 × 两语 + 值改 2；非结构性 ⇒ 续期；与同批 `mount-settings-segments.mjs` 行「**364 ⇒ ≈195**」句式对齐）；`docs/desktop/design/UI.md:500`（§4.1 同值行）同拍；两档变更行同拍（PROJECT `:1865` ∥ UI `:816`）。
- **#5** → `docs/desktop/design/PROJECT.md:384` 次大两档句 `views/settings.mjs` 读数按现读收正（**364（实读 2026-10-01）⇒ 398**——实读 2026-10-02；本修复轮复读 2026-10-07 同值；消解与同档 `:400` 的自相矛盾）；变更行同拍。
- **#6** → 本表端归属（本追记收正）：受影响文件表 `:69` 零触行第三路径 `src/extension/panel-mcp.mjs` 属 **VSC 树**（`thincoder-vscode/src/extension/panel-mcp.mjs`）；桌面零触两路径 = `renderer/settings.css` ∥ `src/main/mcp-servers.mjs`；对照 = `docs/desktop/design/SETTINGS.md:338` 零触格（VSC 以括注列、不列路径）；原行零动（表格 append-only）；**零触结论不变**。
- **#7** → `docs/desktop/design/SETTINGS.md:211`（§2.17 项 3）补机制句——类型切换出口行值捕获 = 与加删出口同一「自读 DOM 行集」面（`readMcpForm` 快照不采行件为前提——防实施轮误依赖 `draft`）；变更行同拍（`:449`）。

**产品码零触（修复轮）**。明细 = §3 轮次 1 ∥ 本追记。

**追记 ⑧（实施后回填轮 · 设计面 · 2026-10-07）**

**口径**：父侧派单 = 实施后回填轮（设计面）——「预估 ⇒ 实读」回填 + 两档登记（拟新增 ⇒ 已落）+ 机制补句 + 活坐标改指；**零新语义（读数 ∥ 坐标 ∥ 登记）**；产品码零触 ∥ 需求档零动 ∥ 批外档零触 ∥ 记录面（历史变更行 ∥ 批档引文）零动。

**逐号落盘（①–⑧ · 号 → 落点）**：

- ① `docs/vsc/design/SETTINGS.md`：§2.10 拆分复核条翻「拆档已执行」（拆后实读：本档 **212** ∥ 新档 `settings-mcp.js` **273**）；判据域档数终值收正（设置面档 **10** ∥ 合域 **11**——含并行批 #1029 新档 `settings-provider-dialog.js` + 本批新档）；MCP 面活坐标改指 `settings-mcp.js` 实读位（入口册 #5 ∥ 门调用点 ∥ 读段 ∥ `renderMcpList` ∥ 行载体段 ∥ 同族绑定句）；弹框契约 `locales` 正文键坐标随盘（`:184 ⇒ :201`——en ∥ zh 同值）；同节非 MCP 活坐标随档缩按现盘重锚（`websearchRowHtml` ✕ `:273 ⇒ :103` ∥ `embedRowHtml` ✕ `:286 ⇒ :116` ∥ `renderKeyRow` `:305-315 ⇒ :138-148` ∥ `updateWebsearchSettings` `:317-320 ⇒ :150-153` ∥ `renderIndexStatus` `:327-347 ⇒ :191-212`——**超出点名单的同类死指针 · 一致性面当场修 · 逐条报告**）。
- ② `docs/vsc/design/VSC-DEBT.md` §13.3：拆后两档实读回填（本档 **212** ∥ 新档 `settings-mcp.js` **273** ∥ 拆前 433）+ 触发格 ∥ 收束句收正（拆档已落）+ 标题随正。
- ③ `docs/vsc/design/WEBVIEW-PROTOCOL.md` §13：MCP 发射坐标七行改指新档实读位（`deleteMcpServer` `:182` ∥ `editMcp` ∥ `saveMcpServer` `:134` ∥ `getMcpStatus` `:148` ∥ `mcpTools` `:192` ∥ `reconnectMcp` `:213` ∥ `testMcp` `:208`）+ `buildIndex` 随档缩重锚（`:150 ⇒ :83`）。
- ④ `docs/vsc/design/WEBVIEW.md` §3 文件表：+`settings-mcp.js` 行（**273 行**——职责 + 拆出说明）+ `settings-tools.js` 读数（拆后 **212** ∥ 拆前 433）；模块计数按现盘收正（**44 ⇒ 47**）。
- ⑤ `docs/desktop/design/SHELL.md` §1 树：+`mount-settings-segments-mcp.mjs` 行（同族行位 = `-agent.mjs` 后）+ `mount-settings-segments.mjs` 行族枚举随动（去 MCP）。
- ⑥ `docs/desktop/design/SETTINGS.md`：§2.17 项 3 +**现读面机制句**（`mcpFormNode()` = 文档序末位 `[data-form="mcp"]`——页体 ∥ 组弹窗体；`mount-settings-segments-mcp.mjs:85-90`）∥ §2.17 项 5 ∥ §1 **KD-76** ⑤ 去「拟新增」（**已落 · 299**）∥ §3.1 四行实读回填（`views/settings-sections-mcp.mjs` **241** ∥ `mount-settings-segments.mjs` **164**（回线）∥ 新档 **已落 · 299** ∥ `mount-settings-exits.mjs` **289**）∥ §3.2 本批块翻「现行 ⇒ 实读（实施落盘）」（说明 ∥ 表头 ∥ 七行随正）。
- ⑦ `docs/desktop/design/PROJECT.md`：§4.1 拆档链登记行去「拟新增」（已落）∥ 越层段 `mount-settings-segments.mjs` 行 **364 ⇒ 164**（除名兑现：十五 ⇒ 十四）+ 新档行（已落 · 299）+ `i18n-views.mjs` **406**（实读回填）∥ 次大两档句随正（次席回线出缺——待重排；**未新造排名**）∥ `views/settings-sections-mcp.mjs` 表行读数随正（**241**——表行机检对盘 ✓）。
- ⑧ `docs/desktop/design/UI.md` §4.1：`i18n-views.mjs` 行**首列读数终值 406**（实读回填；表行机检对盘 ✓）。

**机检（落笔后复跑）**：`node scripts/doc-check.mjs`——**行数面 26 ⇒ 25 条**（本批三档读数全对盘：`settings-sections-mcp` **241** ∥ `mount-settings-segments` **164** ∥ `i18n-views` **406**；余 25 条 = 他批存量，报告态不入闸）；**行宽面无新增**（本笔把 3 处新越线折行消解；余 PROJECT.md `:384`（437——原 398 已越）∥ `:400`（379——原 371）∥ vsc `SETTINGS.md:532`（482——原 475）三处 = 存量越线 + 本笔小增，报告待裁）；锚面：本笔新写坐标零 ✗。

**报告附项（非本笔修面 · 待裁）**：① 现盘读数与文记不符三处——`views/settings.mjs` 实读 **418**（文记 398；三端对齐批「Δ ≈+6 ⇒ 预估 ≈404，实施后实读回填」未落）∥ `i18n.mjs` 实读 **420**（文记 416）∥ `store.mjs` 实读 **370**（文记 341）；② `docs/vsc/design/SETTINGS.md` §2.2 项 5 内坐标核 = 无（该条零 `file:line`）；③ `VSC-DEBT` §13.1「零执行（登记刷新）」行读数 398 未随 §13.3 收正——该节读数 as-of 2026-09-25 且显式指 §13.3 = 现行单源 ⇒ 维持不动（判读披露）。

**产品码零触（回填轮）**。明细 = 交付报告。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 文档卫生（规范面残留） | 🟡 | `docs/core/design/MCP.md:106` 规范面主句仍为失实措辞「**headers / env 键值对输入**：统一为**逗号分隔**」——同批仅在 `:107` 追加射程句「本条 = **CLI `/mcp` 表单面**输入语义」而未改主句；同档变更记录 `:251` 自认「原「统一」措辞对三端面不再成立」。读者据主句可得「三端统一串式」的失实结论。 | 主句改写为 CLI 作用域表述（如「CLI `/mcp` 表单面 = 逗号分隔」），删「统一」残句；射程句与 `:193` D-MC9 括注保持不变。 |
| 2 | 文档归属（模块图 ∥ 文件表同拍） | 🟡 | 两新档未入模块图 / 文件表，且批档落点 ∥ 回填面（`docs/batches/2026-10-07-mcp-kv-input.md:36-39`）均未点名：① 桌面新档 `mount-settings-segments-mcp.mjs` 未入 `docs/desktop/design/SHELL.md` §1 树（同族行位 = `SHELL.md:80-85`；先例 = `SHELL.md:330`「§1 树增一行（`settings-modal.mjs`——D39 新档）」）；② VSC 新档 `settings-mcp.js` + `settings-tools.js` 读数未入 `docs/vsc/design/WEBVIEW.md` §3 文件表（先例 = `WEBVIEW.md:722`「§3 文件表 **+2 行**（`chat-messages.js` **234** / `chat-status.js` **124**——读数 + 面）」）。 | 把 `docs/desktop/design/SHELL.md` §1 树（新档一行）与 `docs/vsc/design/WEBVIEW.md` §3 文件表（新档一行 + `settings-tools.js` 读数）补进「实施后回填面」点名表。 |
| 3 | 文档状态（计数漂移预防） | 🟡 | VSC 侧新档入结构对账扫描域而域档数未入回填面：`docs/vsc/design/SETTINGS.md:322` 记域 = 设置面档（「实读 **8 档**」）∪ `input.js` = **9 档**（`:328`「本批域 **9 档** ⇒ 下限 **≥6**」）——`settings-mcp.js` 命中 `/^settings.*\.js$/` ⇒ 域变 9 档 + `input.js` = 10 档；`:708` 的「**实施后回填面** = 本档 §2.10 入口册 #5 坐标（`:206` ∥ `:210`）」等四条未含该计数。 | 回填面 +1 项：§2.10 判据域边界档数（8 ⇒ 9 ∥ 9 ⇒ 10）随拆档同拍收正。 |
| 4 | 文档状态（在册档触碰登记） | 🟡 | 在册 >300 档 `i18n-views.mjs` 本批触碰（`docs/desktop/design/SETTINGS.md:336`「**398 ⇒ ≈406**」）未落同拍登记：`docs/desktop/design/PROJECT.md:399` 已为同批 `mount-settings-segments.mjs` 落触属性句（「**364 ⇒ ≈195**」），而 `:401` 的 i18n-views 行（「**398**（实读 2026-10-05」）无本批句；该档文件账住 `PROJECT.md:301` 所指 `docs/desktop/design/UI.md` §4.1，亦未列同拍。 | `PROJECT.md` §4.1 越层段 i18n-views 行补触属性句（预估 ≈406 ∥ 非结构性 ⇒ 续期）；`docs/desktop/design/UI.md` §4.1 同值行列入同拍面。 |
| 5 | 文件账（读数失真） | 🔵 | `docs/desktop/design/PROJECT.md:384`「次大两档 = `thincoder-desktop/renderer/views/settings.mjs` **364**」（标实读 2026-10-01）与本档 `:400` 同文件「**398**（实读 2026-10-02」自相矛盾——本批已触碰该行（新增 #1036 拆档句）未顺手收正。 | 该行读数按现读收正（或明标 as-of 口径）；`mount-settings-segments.mjs` 侧 364 本批已收正。 |
| 6 | 受影响文件表（端归属） | 🔵 | 批档 §2 受影响表零触行把 VSC 路径挂在桌面行下：`docs/batches/2026-10-07-mcp-kv-input.md:69`「| 桌面 | `thincoder-desktop/renderer/settings.css` ∥ `src/main/mcp-servers.mjs` ∥ `src/extension/panel-mcp.mjs` | — | **零触** |」——`src/extension/panel-mcp.mjs` 属 VSC 树。 | 该路径改挂 VSC 零触列（桌面档同格 = `docs/desktop/design/SETTINGS.md:338` 作对照；零触结论不变）。 |
| 7 | 清晰度（机制名未明示） | 🔵 | 桌面「类型切换保真」的取值路径未点名：`docs/desktop/design/SETTINGS.md:211` 同时定「**类型切换出口**同拍同步当前组行集（切换不丢手」与「`readMcpForm` 草稿快照**不采行件**」——`mcpFormType` 现径只取 `readMcpForm()` 快照，行值捕获须由 kv 专用读取面承接（未明示）；结局已由 `:388` T-DSK64 ② 钉住。 | 在 §2.17 项 3 明示类型切换出口的行值捕获 = 与加删出口同一「自读 DOM 行集」面（防实施轮误依赖 `draft`）。 |

VERDICT: pass

**计数**：🔴 0 ∥ 🟡 4（#1–#4）∥ 🔵 3（#5–#7）——无阻断项（🟡/🔵 不阻 pass）。

**本轮验证（抽检 · 证据）**：行数抽检四档与设计所记逐档一致（口径 = 内容行数，文末换行不计）：`thincoder-vscode/webview/settings-tools.js` 433 ∥ `thincoder-desktop/renderer/mount-settings-segments.mjs` 364 ∥ `thincoder-desktop/renderer/views/settings-sections-mcp.mjs` 185 ∥ `thincoder-desktop/renderer/mount-settings-exits.mjs` 254 ∥ `i18n-views.mjs` 398；病灶坐标实读在位（`webview/settings-tools.js:66 ∥ :391-404` ∥ 桌面 `views/settings-sections-mcp.mjs:92-96` ∥ `mount-settings-segments.mjs:30-44` ∥ `view-state.mjs:168-174`）；零新 CSS 类族在位（VSC `.key-row:122 ∥ .del-key:150`；桌面 `.settings-field-row:210 ∥ .settings-row-action:178 ∥ .settings-submit:74`）；缝可行性在位（`webview/settings.js:13` 模块 import 面——新档无需 HTML 注册；桌面 `mount-settings-exits.mjs:191-201` `resetFacets` 整键置换 ⇒ `form.kv` 随 `form` 复位，`store.mjs` 免改）。

**限制声明**：本评审对象 = 声明所载（批档 §2 + 五档设计档）；文件清单未列批档，但 Target 段点名「批档 §2」⇒ 已并入读（#6 引文出自该档）。项目无标准档声明、无文档地图 ⇒ 方法学合轨按 `AGENTS.md` + 各档在盘惯例（指针 / 计数 / 同拍纪律）判；文档归属按各档自带的单源指针判。

## §4 用户批准（主 agent）

**代签（主 agent · 2026-10-07 20:1x · 自动跑授权内——用户 19:43「修彻底」）**

- 评审链：设计评审轮 1 = **pass**（🔴 0 ∥ 🟡 4（#1–#4）∥ 🔵 3（#5–#7）——发现表在 §3 轮次 1）；七号修复轮逐号落盘（**§2 追记⑦**）。
- 父侧核验（抽读，全在盘）：`docs/core/design/MCP.md:106`（主句 =「**CLI `/mcp` 表单面 = 逗号分隔**」）∥ `docs/desktop/design/PROJECT.md:384`（398 读数消矛盾）∥ `:401`（i18n-views 本批触属性句）∥ `docs/desktop/design/SETTINGS.md:211`（类型切换行值捕获径句）∥ 追记⑦ `:126–140`（七号逐条）。
- 上抛三项处置：① #2 执行口径 = **维持登记制**（`SHELL.md` ∥ `WEBVIEW.md` 本体随实施/回填轮落——去「拟新增」+ 实读回填）；② #3 基数 = **按现盘登记 9 ⇒ 10 ∥ 10 ⇒ 11**——终值随实施回填同拍写足（变更行注明组成 = 并行批 #1029 新档 + 本批新档；「8 ∥ 9」现文一并收正）；③ 观察句（`PROJECT.md:384`「次大两档」）= **维持**（历史语境句，非排行断言）。
- **准予实施**：产品码面 = VSC（`settings-tools.js` 拆档 ∥ `settings-mcp.js` 新档 ∥ 表单行式化）∥ 桌面（`mount-settings-segments-mcp.mjs` 新档 ∥ 段体与装配）；回填面 = `SHELL.md` ∥ `WEBVIEW.md` ∥ VSC SETTINGS §2.10 计数 ∥ PROJECT/UI 实读。
- 令牌 = 运行时凭据（不入档）；实施舱随本签派发。

## §5 实施记录（eng-coder）
**状态行**：实施完成（批内件 13/13 绿 ∥ 审计 clean ∥ 代码评审 1🔴 已修 → clean ∥ 新档 299 ≤300 · 主档回线 212/164）



**实施轮（eng-coder · 2026-10-07 · 台账 #1036）**

**面**：两端 MCP 表单 `env ∥ headers` 行式键值 + 两处先拆后改 + 词面 8 笔。**成品**：产品码 8 改 2 增（VSC 3 改 1 增 ∥ 桌面 5 改 1 增）+ 批内件 1 档 + 词面 2 档；`settings.css` ×2 ∥ `src/main/mcp-servers.mjs` ∥ `panel-mcp.mjs` 零触（`git status` 实读）。

### 交付对照（§2 机制 ①–⑩）

| # | 状态 | 交付（落点） | 机检 |
|---|---|---|---|
| ① 行式编辑器 | ✅ | 两端三组行集（键格 ∥ 值格 ∥ ✕ + `[+ 添加行]`；零项零行；字段序零改）：VSC `webview/settings-mcp.js`（`kvRowHtml` ∥ `kvRowsInto` ∥ `kvObjectOf` + 行容器事件委托）∥ 桌面 `views/settings-sections-mcp.mjs`（`kvRowNode` ∥ `kvFieldNodes`）+ `mount-settings-segments-mcp.mjs`（令牌件） | L1-1 ∥ L1-2 ∥ L3-1 ∥ L3-3 |
| ② 提交口径 | ✅ | 两端同判 trim ∥ 空键 ∥ 空值行丢 ∥ 重复后胜 ∥ 全空 ⇒ 键缺席（VSC `kvObjectOf`；桌面 `kvFromForm`） | L2-3 ∥ L3-2 |
| ③ 回显口径 | ✅ | 插入序保持 ∥ 值 = 字面（**零引号剥离**——旧串式剥离随 `parseHeadersLike` ∥ `parseKv` 同笔净删） | L1-1 ∥ L3-2 互逆 |
| ④ 粘贴零解析 | ✅ | 无任何隐式解析面（值格 = 单行 `input`，整块文本落一格） | L1-4 值格型 |
| ⑤ 边界 | ✅ | 值格单行 `input`；键格零字符限制（trim 裁首尾）；加删行零落盘（VSC 纯 DOM ∥ 桌面仅切片） | L1-4 ∥ L2-1 |
| ⑥ 两端实现形 | ✅ | VSC DOM 即态（表单态不入 SS）∥ 桌面 `form.kv` 令牌态（随 `form` 生命周期复位 = `resetFacets` 现径）；加删出口先自读 DOM 行集 ⇒ 写切片 ⇒ 重挂；`readMcpForm` 不采行件 | L2-1 ∥ L2-2 ∥ L2-3 |
| ⑦ 拆档两处（先拆后改） | ✅ | VSC：`settings-tools.js` **433 ⇒ 212**、新档 `settings-mcp.js` **273**（缝 = `mcpFormHtml()` ∥ `bindMcpControls()` 两口回插；对外导出名零改）；桌面：`mount-settings-segments.mjs` **364 ⇒ 164**、新档 `mount-settings-segments-mcp.mjs` **298**（缝 = 同形工厂 `createMcpExits(deps)`；装配点 `mount-settings-exits.mjs` 装配即合并） | 行数实读 + 装载实读（41 handlers 零重名） |
| ⑧ 文案 8 笔 | ✅ | VSC `locales/en.json` ∥ `zh.json` 两语同拍（各 291 键）∥ 桌面 `i18n-views.mjs` 两语同拍 | L4-1 |
| ⑨ 零新 CSS | ✅ | 两 `settings.css` 零触（复用既有类 + 行内宽度） | `git status` 零涉 |
| ⑩ 零新状态源 | ✅ | VSC 零（DOM 即态）∥ 桌面 +`settings.mcp.form.kv`（表单面态内部形——非切片新族） | 结构 + L2-1 |

**验收 A1–A6 实读**：A1 ✅ 值含逗号不坏（读数 `{"KEY":"va,lue"}`——L2-3 ∥ L3-1）· A2 ✅ 两端同形（行件三元素 ∥ 添加钮 ∥ 零项零行 ∥ 四词面 8 值逐字同）· A3 ✅ 互逆（零修改保存 ⇒ 载荷与现值同——L3-2；桌面编辑态起表单同判——L2-1）· A4 ✅ 四判据（L2-3）· A5 ✅ 零残留（L4-2 扫 155 档命中 0；另全仓源面 208 档 grep 零命中）· A6 ✅ 行数：新档 **273 ∥ 298**、回线 **212 ∥ 164**、硬限 500 全绿（`i18n-views.mjs` **406** 在册越 300——本批词值级触碰）。

### 决策透明表（实施轮判定）

| # | 判定 | 依据 ∥ 影响 |
|---|---|---|
| D1 | VSC ws 组 DOM 组名 = `ws-headers`（桌面切片键 = `wsHeaders`） | 组名只在各端内部（VSC = DOM 锚；桌面 = 切片键）；两端提交皆映 `config.headers` ⇒ 对外零差 |
| D2 | 桌面 kv 两出口**不**随写携 `draft` 快照 | §2.17 项 3：行值保真 = 令牌态 + 草稿闸两层（`#604` 按 `id` 复填；非行控件 id 稳定 ⇒ 跨重挂保输入）；`draft` 仅承「类型切换」跨型带货 |
| D3 | `mcpFormType` 写表单对象 = 新构 `{ editing, type, kv, draft }`（非 spread held） | 沿迁出前现径（该出口原即新构）；`kv` = 本批新增键，其余键集同 |
| D4 | 桌面新档初稿 **327** ⇒ 压注释 ∥ 空行至 **298**（**零代码行改动**） | A6 两新档 ≤300；压掉的是与 §2.17 重复的机制复述（单源纪律） |
| D5 | 测试 L1-4 增「非行控件同携 `data-draft`」1 断言（§2 枚举外） | 保输入链下半（草稿闸按 id 复填）为本批依赖——不测则链断无声；已在此披露 |
| D6 | 桌面 kv 出口空转径（无 DOM/表外令牌）记 `console.error` 后零写 | 沿域内「零静默」口径（§2.17 只说「空转」，不说「无语」） |

### 实施读数（实读）

- 行数：VSC `settings-mcp.js` **273** ∥ `settings-tools.js` **433 ⇒ 212** ∥ `settings.js` **195**；桌面 `mount-settings-segments-mcp.mjs` **298** ∥ `mount-settings-segments.mjs` **364 ⇒ 164** ∥ `mount-settings-exits.mjs` **289**（261 ⇒ 289：+import/call/spread 三处 + 注）∥ `views/settings-sections-mcp.mjs` **241** ∥ `i18n-views.mjs` **398 ⇒ 406**；批内件 **354**。
- 词面：VSC `locales/{en,zh}.json` **291 键**（各 293 行）∥ 桌面 `VIEWS_DICT` 两语同拍；`settings.mcp.env ∥ .headers` 值改 + 四新键（L4-1 读数「四键 × 4 词面 ✓」）。
- 装载：`createExits`（桩 deps）装载实读 **41 handlers**（MCP 十一项在场 ∥ keys 去重零损）——拆档后装配面对外零改。
- 测试：批内件 **12/12 绿**（L1 4 ∥ L2 3 ∥ L3 3 ∥ L4 2）；VSC `node test/smoke-settings.mjs` = **SMOKE-OK**（真 webview 装配面）。
- 仓套件：**未跑**（本仓纪律 = 父侧收口跑为唯一仓套件跑）；集成面零涉（表单面非集成档位）。
- 观察（非本批改动）：`thincoder-vscode/webview/settings.js` 的本批 import 一行改已被并行批提交（`5ac999ef`）带走，故不在本批 `git status` 未提交面——内容实读在位（`:15` import 自 `settings-mcp.js`）。

### 审计轮（内部 · explore 只读发散审计）

- **轮次 1**（交付后）：四类偏差（PARTIAL ∥ SILENT-SIMPLIFICATION ∥ DOC-DRIFT ∥ OUT-OF-LIST）**零发现**；A1–A6 静态条条可对；新增/改动 11 档 + 批内件**全在批档受影响文件表内**（零表外）。VERDICT = **clean**（限制声明：该装配无执行工具——`node --test` ∥ smoke ∥ 真机走查由其标为「交父侧收口跑复核」）。
- **审计观察四条（🔵）与处置**：
  1. **计数账失真（已修）**：`mount-settings-exits.mjs` 头注「段族 **19** 项」与所列举四族实读不符 ⇒ 收正为 **30**（`segments` 9 ∥ `modelSegments` 8 ∥ `mcpSegments` 11 ∥ `agentSegments` 2）∥ 渠道面 **6 ⇒ 7**（含并行批 `onAddProvider` 之前的 `providerSegments` 七项）；同处 R7 历史句「env ∕ 工具 **十一**」⇒ 回「**十三**」（R7 迁出数），#1036 句改「族**九**出口拆出（该族现**十一**）」。
  2. **§5 装载读数更正（本追加）**：上文「41 handlers」= **过时读数**（该值取自拆档后、kv 两出口落盘前）⇒ 落盘实读 **44**（`openModal` 缺省径；`openModal` 在位 ⇒ 45）＝ 家族 **37**（9+8+11+7+2）＋ 直表 **7**；零重名。**并记**：并行批（provider-config 在途）同刻在改 `providerSegments` 族件，故两读数差 3 = 上批 1 项 + 本批 kv 2 项。
  3. **令牌退化小疵（已修）**：`readKvRows` 缺 `data-kv-token` 属性时 `Number(null) = 0` ⇒ 已改 `raw === null || raw === "" ⇒ NaN ⇒ 取新号`（现实不可达径的稳健性收口）。
  4. **回填面（非本批交付 · 交父侧回填轮）**：桌面 `SETTINGS.md` §3.1 与 `PROJECT.md` 的数条预估数需按实读收正（本档 §5.3 实读族即据：`views/settings-sections-mcp.mjs` `185⇒≈250` → 实读 **241** ∥ `mount-settings-segments.mjs` `364⇒≈195` → **164** ∥ 新档 `0⇒≈240` → **298** ∥ `mount-settings-exits.mjs` `254⇒≈258` → **289** ∥ VSC `settings.js` `190⇒190` → **195**（并行批混入改（注）；本批仅 import 一行）。
- **修后复跑**：批内件 **12/12 绿**（读数同前）∥ VSC `smoke-settings.mjs` **SMOKE-OK** ∥ `node --check` 全绿 ∥ 行数：新档 **299** ∥ `exits.mjs` **289**。

### 代码评审轮（内部 · advisor · code）

**轮次 1（交付后 · 阻塞）**：VERDICT = **changes-required**（1 🔴 + 3 🟡 + 2 🔵）：
- 🔴 **kv 三出口的 DOM 读取面绑死设置槽 ⇒ 组弹窗面死钮**：`readKvRows` ∥ `readMcpForm` 以 `document.querySelector(slot)`（`[data-slot="settings"]`）为作用域，而 MCP 组弹窗体由 `settings-modal.mjs:45-46`（`body.append(backdrop)` ∥ `body.append(card)`）挂 `document.body`（**槽外**），且 `openSettingsModal` 不置 `open`（页树 `open` 假 ⇒ 零子节点）；菜单「MCP…」径（`src/main/app-menu.mjs:36` `SETTINGS_GROUPS` 含 `mcp` ⇒ `app.mjs:76` `settingsFace.openSettingsModal(group)`）页闭 ⇒ 槽内零表单 ⇒ 加 ∥ 删 **零写**（仅 `console.error`——钮可见可按）；页 ∥ 弹窗同开 ⇒ 读命中**页体**（跨面读）。验收 A2/T-DSK64 的「弹窗两态」不可达；本批机检（L2 夹具挂槽内）与审计轮（无执行面 ∥ 未分析弹窗宿主）均未覆盖 ⇒ 上条「A1–A6 ✅」在弹窗面不成立（本席收正）。
- 🟡 三条（非阻塞）：① 回填面未落（父侧回填轮——`SETTINGS.md` `0 ⇒ ≈240` 对实读 299 等四组）；② 批内件超 300 顾问线；③ L2 无弹窗宿主腿（随修一并补）。
- 🔵 两条：① `mount-settings-segments.mjs:150` 计数陈旧（「MCP 族九项」vs 同档头「十一」）；② 新档 299 行零余量（设计预估 ≈240 低 25%）。

**修轮（轮 1）三处落地**：
1. **现读面宿主无关化**：新件 `mcpFormNode()`（`mount-settings-segments-mcp.mjs:83-89`）——现读面 = **文档序末位 `[data-form="mcp"]`**（弹窗体挂 `body` 尾 ⇒ 在场即交互面；页闭径末位 = 弹窗体）；`readKvRows` ∥ `readMcpForm` 两读口同源收正（`slot` 依赖自该档 destructure 移除——注入口子在主档保留，调用面零改）。
2. **批内件增 L2-4**（弹窗宿主：单宿主加 ∥ 删 + 两宿主并存读末位 ∥ 弹窗体键入值保真）——**红→绿**结构性护栏：旧读链（`querySelector(slot)` → `querySelector('[data-form="mcp"]')`）在 L2-4 夹具（页闭 + 表单挂 `body`）下恒 `null` ⇒ 旧码必红。
3. **🔵① 收正**：`mount-settings-segments.mjs:150`「MCP 族九项」⇒「MCP 族十一项」。

**轮次 2（复跑）**：批内件 **13/13 绿**（新腿读数：单宿主加/删 `1 ⇒ 0` ∥ 双宿主 `rows=[["MODAL","m,v"],["",""]]`）∥ 新档 **299** 行 ≤300 ✓ ∥ `node --check` 全绿。
**终态**：**clean**（🔴 已修并复跑；🟡① 非本席可闭（父侧回填轮）、🟡② 披露如下、🟡③ 已补；🔵① 已收正、🔵② 交父侧）。

**披露（D3 计数纪律）**：批内件 **390** 行 > 300 顾问线——件为随批遗留物（不进仓套件），四腿 **13** 例含 1 条弹窗宿主回归护栏；不拆档的给由 = 保改批复查的单档可跑性（父侧可裁）。

**代码评审轮 2（复核 · 仅查修复声明）**：VERDICT = **pass**——
① 🔴 修复声明**已核实**（三读口同源收正 ∥ `slot` 全档零命中 ∥ 末位假设独立复核：`settings-modal.mjs:46` 卡挂 `body` 尾 → `:56` 刷新保位 → `:65` 关＝清根 ⇒ 弹窗在场＝读面、退场＝回页体、页单独＝页体，零残件陷阱）；
② L2-4 腿**已核实**为真红→绿护栏（判别断言在旧槽作用域链下必红）；
③ 新档 299 ≤300 **实测相符**。
不阻塞项 6 条（本轮不改判）：🟡① 回填面（父侧回填轮）∥ 🟡② 批内件 390 行（已披露，父侧可裁）∥ 🟡③ 新增：**设计单源缺句**——现读面宿主判据只住码内头注 + 批档，`SETTINGS.md` §2.17 项 3 ∥ KD-76 未载（单向缺口非矛盾；建议回填轮同拍补机制句，先例 :449）∥ 🔵① 计数陈旧——**本轮已落盘收正**（`mount-settings-segments.mjs:150`「MCP 族九项」⇒「十一项」，与同档头注对齐）∥ 🔵② 新档零余量（信息项）。
**终态（收口）**：**clean** —— 内部审计 clean ∥ 代码评审 1🔴 已修已核 + round 2 pass ∥ 批内件 13/13 绿 ∥ 行数纪律全绿（新档 299 ∥ 273；回线 212 ∥ 164；硬限 500 ✓）。

## §6 验证与收口（父代理）
