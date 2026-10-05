# 2026-10-05 · attach 文件支持（非图片档内联）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-05 · 来源 = 用户 2026-10-05 20:15「其余两件也要做」（承同日 attach 成文方案——现状 ∥ 修法 ∥ 立需求；台账 #948）。
> 台账 = #948（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-05
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源与授权

- 用户原话（2026-10-05 傍晚）：「输入框下面的那个 attach 其实只能传图片，但是有时候我需要传其他文件，比如刚才那个就没成功，我自己贴了文件路径你才读到的。」→ 父侧实读成文方案（19:1x 交付：现状 ∥ 修法 ∥ 立需求与否）→ 用户 20:15「其余两件也要做」= 本批点火。
- 现状（实读 `thincoder-render-core/composer/attach.mjs`）：选择器写死 `accept="image/*"`（`:38`）⇒ 非图选不进来；非图文件零反馈静默丢弃（`:81-84`）；仅栅格四型的原因在案（`:58-60`——发送链限制）。核件一端两处：桌面 + VSC 同源。
- 修法方向（成文方案）：① 选择器扩文本/源码族（扩展名清单 + `text/*`）；② 读文本 + 上限（单档建议 ≤256KB、每回合 ≤ 几档）；③ 发送时内联「路径头 + fenced 段」进用户消息；④ 拒绝面一律出声（超大 / 二进制 / 超量）；⑤ 图片道零改。
- 边界：不做 PDF/Office 解析、不做二进制附件。设计轮职责 = 勘察定形（含两端消费面与发送链内联位、上限取数、红绿对）。
- 授权 = 全链跑（设计 → 代点火评审 → 代签 → 实施 → 收口；「自动跑」在效）。台账 = **#948**（待设计 → 任务书 = 本档 §2）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（机制设计 + 逐处落点 + 红绿对 T1–T15 + L7 复核 0；修正轮 1（评审轮 1 · 九项）已落——设计档两处随动；实施后口径对齐（fix 轮）已落——KD-RC-13「含在飞档」口径 + 变更记录；doc-check 复跑 exit 0）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）

- **台账 #948**（desktop · 待设计 → 本批实施）：附件面扩「文本/源码档」——采集（受纳判据 + 三限）∥ 发送时内联（路径头 + fenced 段）∥ 拒绝面零静默。核件一端两处（桌面 + VSC 同源——`thincoder-render-core/composer/attach.mjs`）。
- **覆盖需求** = `docs/desktop/requirements/COMPOSER.md` **D13**（会话素材——附件行）；**登记形 = D13 扩句**（零新 D 行——D 表仍 D1–D42）；建议文本 = §2.9（需求档落笔 = 父侧）。
- **明确不在本批**（边界——单源 = `docs/render-core/design/RENDER-CORE.md` §9 附件条）：PDF / Office / 二进制附件 ∥ 剪贴板文件粘贴收集 ∥ 全路径头 ∥ 无扩展名源码档（`Dockerfile` / `Makefile` 类）∥ 空文本 + 附件可发 ∥ 图片道任何行为改动。

### 2.2 设计档落点（本设计轮已落）

| 档 | 落笔 |
|---|---|
| `docs/render-core/design/RENDER-CORE.md` | §2 增 **KD-RC-13**；§5 条 6 补附件面扩展段；§6 增随动段；§9 增附件边界条；变更记录 +1 行 |
| `docs/desktop/design/COMPOSER.md` | §2 增本批注；§3.2 增本批行；变更记录落点指针 +1 行 + 变更行 +1 行 |
| 需求档（父侧笔） | `docs/desktop/requirements/COMPOSER.md` D13 扩句——建议文本 = §2.9 |

### 2.3 机制设计（终形 · 逐字）

**A. 采集（核 `thincoder-render-core/composer/attach.mjs`——两端同收）**

1. **受纳判据**：`isTextFile(file)` = 扩展名 ∈ `TEXT_EXTS`（导出常量，**79** 项〔逐项实计〕：`.txt .md .markdown .mdx .rst .log .csv .tsv .json .jsonc .json5 .yaml .yml .toml .ini .cfg .conf .env .xml .properties .html .htm .css .scss .sass .less .js .mjs .cjs .jsx .ts .mts .cts .tsx .py .pyi .rb .go .rs .java .kt .kts .scala .swift .c .h .cc .cpp .hpp .cxx .hxx .cs .php .lua .pl .pm .r .jl .dart .vue .svelte .astro .sh .bash .zsh .fish .ps1 .psm1 .bat .cmd .sql .graphql .gql .proto .gradle .groovy .tf .hcl .mk`）∨ `file.type.startsWith("text/")`。选择器 `fileInput.accept` 同源派生：`["image/*", "text/*", ...TEXT_EXTS].join(",")`。
2. **三限**（导出常量）：单档 ≤ `TEXT_MAX_BYTES` = **256 000** B ∥ 每回合 ≤ `TEXT_TURN_MAX_FILES` = **4** 档 ∥ 每回合合计 ≤ `TEXT_TURN_MAX_BYTES` = **512 000** B（B = 字节；**KB = 1000 B**——词面「256 KB ∥ 512 KB」同口径）。**判序 = 档数 → 单档 → 合计**（先到先拒；各拒一支 toast——零静默）。**档数 ∥ 合计两限含在飞档**（判据 = 已入列 + 在飞：`pendingCount` ∥ `pendingBytes`——受理即入账、读毕 / 失败销账；单档限判 incoming `file.size`——不涉读面）。**「每回合」操作定义 = 每次发送前的未发列表**（发送即清列——非 agent 回合计；需求句 ∥ 词面「每回合最多 4 个」∥ 机制三处同义）。
3. **读**：`FileReader.readAsArrayBuffer` ⇒ 前 `BINARY_SCAN_BYTES` = **8000** B NUL 扫描（二进制判据——git `buffer_is_binary` 同窗）⇒ `new TextDecoder().decode(bytes)`（UTF-8；BOM 缺省剥）⇒ 入列 + 重渲芯片；读失败（`error` ∥ `abort`）⇒ **出声拒**——toast `composer.attach.readFailed`（零芯片 ∥ 零入列——第六拒面）。
4. **换处理序（change 处理）**：`RASTER_MIME` ⇒ 图径（零改）→ `image/*` 非栅格 ⇒ 现键 `paste.unsupportedFormat`（零改）→ `isTextFile` ⇒ `collectTextFile` → 余 ⇒ **新键** `composer.attach.unsupported`（今天零反馈静默丢弃面——本批补出声）。
5. **芯片条**：双族同条——图芯片 `📎 image N`（+`data-kind="image"` 属性级）∥ 档芯片 `📎 <文件名>`（名字经 HTML 转义——`& < > "` 四替换）；✕ 按 `data-kind` + `data-idx` 分列 splice 重渲；`clear()` 零改（空条件补 `files.length === 0`）。

**B. 内联（发送时——`thincoder-render-core/composer/panel.mjs` `send()` 两径）**

6. **形成（纯函数两件——`attach.mjs` 导出）**：`formatFileBlock({ name, text })` = 头行 `[Attached file: ${name}]` + `\n` + fenced 段（围栏 = 反引号 × `max(3, 内容最长反引号串 + 1)`；info string = 扩展名去点小写，无扩展名 ⇒ 略）＋ `\n` + 内容 + `\n` + 围栏；`withAttachedFiles(text, files)` = `text` + `"\n\n"` + 逐档块（空列 ⇒ 原文零改）。
7. **时序（两径同式）**：满队拒收判**之后** ⇒ 快照清列（`const files = [...attach.files]`；`attach.files.length = 0`——保身份，照 `images` 式）⇒ `const message = withAttachedFiles(text, files)` ⇒ **回显（`onUserEcho(message)`）∥ 上行（`post` 的 `text: message`）∥ 迟到补写（wire `healLate` / 回执兜底——消费 `payload.text`）三面同串**（单值单源——本地块与回放块同形）。
8. **上行面零改**：桌面 `msg:send { key, text, images }`（text 已含内联——`toImages` 的 `dataURL` 判据天然滤文本档）∥ VSC `userMessage` 同形（payload 透传）；宿主附件面（落盘 ∥ 降级 ∥ 清理）**零触**；零新通道。

**C. 词面（两语同拍——值源 = `thincoder-vscode/locales/{en,zh}.json` canon ⇒ 桌面 `renderer/i18n-views.mjs` 逐字副本）**

| 键 | en | zh |
|---|---|---|
| `composer.attach.tooLarge` | File too large (max 256 KB): ${name} | 文件过大（上限 256 KB）：${name} |
| `composer.attach.tooMany` | Too many text attachments (max 4): ${name} | 文本附件过多（每回合最多 4 个）：${name} |
| `composer.attach.totalLimit` | Attachment total exceeds 512 KB for this turn: ${name} | 本回合附件合计超过 512 KB：${name} |
| `composer.attach.binary` | Not a text file (binary content): ${name} | 非文本文件（二进制内容）：${name} |
| `composer.attach.unsupported` | Unsupported file type: ${name} | 不支持的文件类型：${name} |
| `composer.attach.readFailed` | Could not read file: ${name} | 无法读取文件：${name} |
| `toolbar.attach`（值收正） | Attach image ⇒ **Attach file** | 添加图片 ⇒ **添加文件** |

核件按钮硬编码随正：`attachBtn.title` ∥ `aria-label` "Attach image" ⇒ "Attach file"；`pasteBadge` aria-label "Attached images" ⇒ "Attached files"。

**D. 图片道零改（可证面）**：`RASTER_MIME` ∥ 粘贴径 ∥ `readImageFile` ∥ `images` 列 ∥ 图芯片文本 `📎 image N` ∥ 桌面 `toImages` ∥ 宿主落盘 / 降级 = 逐处零语义改（图芯片行 +`data-kind` 属性一级；`attach.images` 快照 / 清列 / 保身份照旧）。

### 2.4 精确落点（实施者零开放结构决定——as-of 2026-10-05 实读）

| # | file:line | 改动 |
|---|---|---|
| L1 | `thincoder-render-core/composer/attach.mjs:23` 后 | 增 `TEXT_EXTS` ∥ `TEXT_MAX_BYTES` ∥ `TEXT_TURN_MAX_FILES` ∥ `TEXT_TURN_MAX_BYTES` ∥ `BINARY_SCAN_BYTES` ∥ `isTextFile` |
| L2 | `attach.mjs:32` 区 | 工厂顶增 `const files = []`（deps 零增） |
| L3 | `attach.mjs:38` | `accept` ⇒ `["image/*", "text/*", ...TEXT_EXTS].join(",")` |
| L4 | `attach.mjs:44-45` | title / aria-label ⇒ "Attach file" |
| L5 | `attach.mjs:54` | pasteBadge aria-label ⇒ "Attached files" |
| L6 | `attach.mjs:80-86`（change 处理） | 补 `else if (isTextFile(file)) collectTextFile(file)` ∥ 兜底 `else showToast(t("composer.attach.unsupported", { name: file.name }))` |
| L7 | `attach.mjs:88-95` 后 | 增 `collectTextFile(file)`（判序 → 读（失败 ⇒ toast `composer.attach.readFailed` + 零入列）→ NUL → 解码入列）+ `totalBytes()` |
| L8 | `attach.mjs:97-115`（`renderPasteBar`） | 双族芯片 + `data-kind` 分列删除 + `escapeHtml` |
| L9 | `attach.mjs:123`（返回面） | 补 `files` |
| L10 | `attach.mjs` 文末（导出区） | `formatFileBlock` ∥ `withAttachedFiles` |
| L11 | 核 `panel.mjs:50` | import 补 `withAttachedFiles` |
| L12 | 核 `panel.mjs:334-339`（忙态径） | 清列（`attach.files`）+ `message` 构建 + `onUserEcho(message)` + `post("queuedUserMessage", { text: message, … })` |
| L13 | 核 `panel.mjs:351-359`（直发径） | 同上（`message` 于 `setLoading(true)` 后、`onUserEcho` 前构建；`post("userMessage", { text: message, … })`） |
| L14 | `thincoder-vscode/locales/en.json:20-22` ∥ `zh.json:20-22` | +6 键（`paste.unsupportedFormat` 后）∥ `toolbar.attach` 值收正 |
| L15 | `thincoder-desktop/renderer/i18n-views.mjs:74` ∥ `:241` | +6 键（en ∥ zh——值逐字同 VSC） |
| L16 | `thincoder-desktop/renderer/i18n.mjs:96` 后 | 键数链续链一截（`VIEWS_DICT` 实读 138 ⇒ 144 ∥ `HOST_DICT` 实读 308 ⇒ 314——届盘实读续链） |
| L17 | 批内件 `docs/batches/2026-10-05-attach-file-support.test.mjs`（新档） | T1–T15（见 §2.6） |

**注（`injectAtRefs` 归属）**：内联内容与键入 / 粘贴文本**同径（有意）**——`@ref` 扫描行为与今日粘贴文本同源，本批零改（`injectAtRefs` 全扫照过——含 `@…` token 的源码内容同受；行为面详读 = 实施轮实读补证）。

### 2.5 受影响文件与测试面（行数 + Δ + 模块 · L7 复核）

| # | 文件 | 现（行——实读 2026-10-05〔内容行数口径〕） | Δ | 模块 |
|---|---|---|---|---|
| 1 | `thincoder-render-core/composer/attach.mjs` | 124 | ≈+100 ⇒ ≈225 | — |
| 2 | `thincoder-render-core/composer/panel.mjs` | 466 | ≈+8 ⇒ ≈474 | — |
| 3 | `thincoder-vscode/locales/en.json` | 278 | ≈+6 ⇒ ≈284 | — |
| 4 | `thincoder-vscode/locales/zh.json` | 278 | ≈+6 ⇒ ≈284 | — |
| 5 | `thincoder-desktop/renderer/i18n-views.mjs` | 384 | ≈+15 ⇒ ≈399 | — |
| 6 | `thincoder-desktop/renderer/i18n.mjs` | 413 | ≈+6 ⇒ ≈419 | — |
| 7 | `docs/render-core/design/RENDER-CORE.md` | 580 | **+22 ⇒ 602**（实读 2026-10-05——修正轮改动后） | — |
| 8 | `docs/desktop/design/COMPOSER.md` | 313 | **+24 ⇒ 337**（实读 2026-10-05——修正轮改动后） | — |
| 9 | `docs/batches/2026-10-05-attach-file-support.test.mjs` | —（新档） | ≈300 | — |

**L7 复核（判定时点②——§2 表落表后复核）**：模块列去重 = **0**（M1–M11 点名者零命中——本批 = 产品功能面，非工程机制模块）≤ 2 ✓ **不拆批**。行数界：`attach.mjs` ≈225 <300 ✓；`panel.mjs` 466 ⇒ ≈474（越 300 在册 ⇒ 本批 = 行级触碰 ⇒ **续期**，拆档搬移另批；距 500 硬限余 34 ⇒ ≈26；单源 = `docs/render-core/design/RENDER-CORE.md` §6 本批随动段）；`i18n-views.mjs` 384 ⇒ ≈399（越 300 在册——键行 = 非结构性触碰 ⇒ 续期）；`i18n.mjs` 413 ⇒ ≈419（越 300 在册 ⇒ 键行 = 非结构性触碰 ⇒ **续期**；拆分预案 = 余族按消费族续拆（备案 = `thincoder-desktop/renderer/i18n-status.mjs`（拟新增）——启动条件 = 加键致 >450）；消解窗口 = 该档下次结构性触碰的批）。

### 2.6 红绿对（批内件腿——红态实跑可坐实；车具 = happy-dom 真 DOM + `/rc/` 解析钩子 + 桌面词表注册，沿 `docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs` 先例；file 注入 = `Object.defineProperty(input, "files", { value: [file] })` + `change` 派发；T12 腿 = `accept` 属性机检（零注入）∥ T13–T14 = 受纳两半支互斥腿 ∥ T15 = 读失败桩腿）

| 腿 | 场景 | 红（现盘直跑 = 失败） | 绿（终形 = 通过） |
|---|---|---|---|
| T1 | 选 `.md`（`text/markdown`） | 零芯片（静默丢） | 芯片 `📎 notes.md` 在场 |
| T2 | T1 + 文本 + Enter（直发） | 上行 `text` 无块 | `userMessage.text` = `行文\n\n[Attached file: notes.md]\n```md\n…\n``` ` 逐字；芯片清 |
| T3 | 单档 >256 000 B | 零反馈 | toast = `t("composer.attach.tooLarge", { name })` |
| T4 | NUL 内容（前 8000 B） | 零反馈 | toast = `t("composer.attach.binary", { name })` |
| T5 | 第 5 档 | 零反馈 | toast = `t("composer.attach.tooMany", { name })` |
| T6 | 合计溢出（2×200 000 B 后第 3 档） | 零反馈 | toast = `t("composer.attach.totalLimit", { name })` |
| T7 | 选 `.pdf` | 静默 | toast = `t("composer.attach.unsupported", { name })` |
| T8 | 围栏安全：内容含 ``` | 无块 | 围栏 4+ 反引号（长 = 最长串 + 1）；名含 `<` ⇒ 芯片字面（零注入） |
| T9 | 忙态径（`turnState: "running"`）+ 档 + Enter | `queuedUserMessage.text` 无块 | 同 T2 内联（队径同判） |
| T10 | 图片道零改（绿锁）：raster png 照收（芯片 `📎 image 1`）∥ 非栅格 svg 照拒（`paste.unsupportedFormat`） | （现盘绿） | 保持绿 |
| T11 | 边界锁（绿锁）：档在 ∥ 文本空 ∥ Enter | 零上行（现状守卫） | 保持零上行 |
| T12 | 选择器面机检（L3 派生——零注入）：`input.accept` 串 | 现盘 = `image/*`（无 `text/*` ∥ 无扩展名项） | 串含 `image/*` ∧ `text/*` ∧ TEXT_EXTS 抽样（`.md` ∥ `.py` ∥ `.json`） |
| T13 | 受纳·扩展名支：`file.type` 空串 + `notes.md` | 零芯片（静默丢） | 芯片 `📎 notes.md` 在场（仅扩展名支即受纳） |
| T14 | 受纳·`text/*` 支：无扩展名（`README`）+ `text/plain` | 零芯片（静默丢） | 芯片在场；发送 ⇒ 块 info string 省略（`[Attached file: README]` + 裸围栏段） |
| T15 | 读失败（`FileReader` `error` ∥ `abort`——注桩） | 零反馈（第六条静默路） | toast = `t("composer.attach.readFailed", { name })`（零芯片） |

### 2.7 验收集（每条可机检——点回 §2.6 腿）

- **AC-1**（T1–T2 ∥ T12–T14）：受纳面全支（选择器派生 ∥ 扩展名支 ∥ `text/*` 支）→ 芯片 → 发送内联逐字形（`[Attached file: …]` + fenced 段；T14 并验 info string 省略径）。机检 = 批内件 payload 逐字断言 ∥ `accept` 串断言。
- **AC-2**（T3–T7 ∥ T15）：六拒面各出对应 toast（核 `t()` 读值逐字）；零静默。
- **AC-3**（T8）：围栏长规则 + 文件名 HTML 转义。
- **AC-4**（T9）：队径内联同判（回显 ∥ 上行同串）。
- **AC-5**（T10–T11）：图片道零改（raster 收 ∥ 非栅格拒原词）∥ 空文本边界锁。
- **AC-6**（源码面）：`node --check` ×3（`attach.mjs` ∥ `panel.mjs` ∥ 批内件）；`attach.mjs` <300 行；`panel.mjs` ≤500。
- **AC-7**（词面）：en ∥ zh 键集相等（+6 同拍）；`toolbar.attach` 两语收正；值 = locale canon 逐字（批内件对拍）。
- **AC-8**（doc-check）：`node scripts/doc-check.mjs` exit 0（悬空 0）——本设计轮已实跑 **exit 0**；实施后复跑。

**红态构造与坐实时点（说明——非本轮实跑）**：批内件 = 实施轮建（本设计轮产品码零触）；红态 = 机制面未落（断言直越机制面——芯片 / payload 逐字 / toast 逐字）⇒ 实施轮首跑坐实（红读数回填 §5）；T10 ∥ T11 = 现状锁（防退化）。

### 2.8 关键决策与否决备选（机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-13）

| # | 决策 | 理由 | 被否 |
|---|---|---|---|
| K1 | 内联 = **发送时**在核 `panel.mjs` 形成（非宿主、非端侧） | 内容只在 webview 可读；核一处 ⇒ 两端同收；`msg:send.text` 承载——零新通道 | 宿主侧内联（无文件内容 ∥ 无路径）· 端侧各实现（双源） |
| K2 | 头行 = `[Attached file: <文件名>]`（**不含全路径**） | Electron 44 无 `File.path`；VSC webview 零 fs；全路径 = 桌面独有桥面（端差） | 全路径头 · 无头行（裸 fenced） |
| K3 | 回显 = 内联后整串（`onUserEcho(message)`） | 回显 ∥ 上行 ∥ 迟到补写单串单源——本地块与回放块同形（加强）；所见即所发 | 回显原文（本地 ∥ 回放异文——差异面大）· 回显加标记（第二形态） |
| K4 | 档芯片 = `📎 <文件名>`（图芯片 `📎 image N` 文本锁不动） | 名 = 用户辨识物；图芯片文本 = 既有锚 | 统一编号（图芯片文本破锁） |
| K5 | 判序 = 档数 → 单档 → 合计 | 确定性（测试可锁） | 其余序（无由） |
| K6 | 二进制判据 = 前 8000 B NUL（git 同窗） | 有据先例、确定性、小代价 | 全档扫描（同效但无由）· 编码嗅探（重） |
| K7 | 空文本 + 附件 ⇒ 提交零动作（**守现状**） | 图片道同守卫（`!text ⇒ 拒`）——改共享守卫 = 图片道行为变化 | 空文本可发（另批面——边界在册） |
| K8 | 粘贴径（剪贴板文件）零改 | 「图片道零改」+ 收集径 = 选择器（§1 方向①） | 粘贴兼收文件（超方向） |

### 2.9 上抛与建议文本（父侧笔权面）

- **需求档 delta**：`docs/desktop/requirements/COMPOSER.md` D13 判据列增句（建议逐字）：「**附件面扩文本/源码档**（2026-10-05 · 台账 #948）：选择器受纳文本/源码族（扩展名清单 + `text/*`）；单档 ≤256 KB · 每回合 ≤4 档 ∧ 合计 ≤512 KB；发送时内联（`[Attached file: 名]` + fenced 段）入用户消息；拒面（超大/超数/合计超/二进制/类型不支持/读取失败）一律出声；图片道零改。落批 = `docs/batches/2026-10-05-attach-file-support.md`。」——**零新 D 行**（D 表仍 D1–D42）。
- **披露①**：本设计轮产品码零触（只读勘察 ∥ 批内件 = 实施轮建）；设计档两处已落（§2.2）。
- **披露②**：`panel.mjs` 越 300 在册——本批 = 行级触碰 ⇒ 续期（拆档搬移另批；消解窗口 = 下次结构性触碰）。
- **披露③**：剪贴板「复制文件 → 粘贴」收集 = 边界外（粘贴径零改）；如用户需要 ⇒ 另批。
- **披露④**：无扩展名源码档（`Dockerfile` / `Makefile` 类）= 边界外（受纳 = 扩展名 ∨ `text/*`；拒面出声，零静默）。

### 2.10 自检读数（本设计轮）

- `node scripts/doc-check.mjs` = **exit 0**（锚悬空 0 ∥ 行宽 0——两设计档改动后实跑；首跑曾出 4 悬空 + 3 行宽，已就地收正）。
- 落点坐标逐处实读（`attach.mjs` ∥ `panel.mjs` ∥ 两词表 ∥ locales）；行数 = node 实读（内容行数口径）。
- 红绿对红态 = 机制面未落（批内件 = 实施轮建）——实施轮首跑坐实读数回填 §5。

### 2.11 评审轮次 1 修正（fix 轮 · 九项逐号 · 父侧裁 = 全采纳）

**来源** = §3 轮次 1（发现 8 = 🟡3 ∥ 🔵5 + 域外注 1）；逐号 = 终值 ∥ 落点（正文已按终值就地收正——本块 = 记录面）：

| # | 终值 | 落点 |
|---|---|---|
| #1 🟡 | `i18n.mjs` 越层处置句补登——**在册 ∥ 续期 ∥ 拆分预案**（余族按消费族续拆；备案 = `thincoder-desktop/renderer/i18n-status.mjs`（拟新增）——启动条件 = 加键致 >450）∥ **消解窗口** = 该档下次结构性触碰的批 | 本档 §2.5 L7 段；`docs/render-core/design/RENDER-CORE.md` §6（i18n.mjs 邻位） |
| #2 🟡 | 腿 **T12–T14**：①选择器面机检（`input.accept` 含 `image/*` ∧ `text/*` ∧ TEXT_EXTS 抽样）②`file.type` 空串·仅扩展名受纳 ③无扩展名 `text/plain` · info string 省略径；腿号续链 T1–T15；验收对照随动（AC-1） | 本档 §2.6 ∥ §2.7 |
| #3 🟡 | 读失败径（`FileReader` `error` ∥ `abort`）⇒ **出声拒**（toast `composer.attach.readFailed` + 零芯片——第六拒面）；键面裁决 = **新键**（复用核查：五拒键 + `*.failed` 族（`composer.send.failed` ∥ `session.openFailed` ∥ `session.renameFailed` ∥ `compress.failed`）逐键核义——无一承载「读失败」⇒ 判不合）+ 全链随动（键数 +1）+ 腿 T15 | 本档 §2.3 读支 ∥ C 表 ∥ §2.4 L7 ∥ §2.5（L14 ∥ L15 ∥ L16 ∥ 行 3 ∥ 行 4 ∥ 行 5）∥ §2.6 ∥ §2.7 ∥ §2.9；`RENDER-CORE.md` KD-RC-13；`docs/desktop/design/COMPOSER.md` §2 注项 1 ∥ §3.2 行 1–2 |
| #4 🔵 | `RENDER-CORE.md` §9 附件条补 **⑥ 受纳 = UTF-8 可解**（不可解内容 = `TextDecoder` 缺省替换字符原样解码送出：不另检 ∥ 不出声——给由在案） | `RENDER-CORE.md` §9 |
| #5 🔵 | 「每回合」操作定义 = **每次发送前的未发列表**（发送即清列——非 agent 回合计；需求句 ∥ 词面 ∥ 机制三处同义） | 本档 §2.3 三限句；`RENDER-CORE.md` KD-RC-13 同拍 |
| #6 🔵 | TEXT_EXTS = **79** 项（逐项实计〔脚本复算〕——去约数） | 本档 §2.3 受纳判据 |
| #7 🔵 | 单位口径 **KB = 1000 B**（词面同口径） | 本档 §2.3 三限句；`RENDER-CORE.md` KD-RC-13 同拍 |
| #8 🔵 | 内联内容与键入 / 粘贴文本**同径（有意）**——`@ref` 扫描行为与今日粘贴文本同源，本批零改 | 本档 §2.4 注（表后） |
| 域外注 | **已核，零命中**——`docs/vsc/design/**` 实读（grep：`attach` ∥ `附件` ∥ `attachment` ∥ `accept` ∥ `image/*` ∥ 词值抽样）：零附件面词值镜像；仅两处涉 attach 字样（`WEBVIEW.md:36` 按钮名录 ∥ `:83` 粘贴图片流）——均非词值面且本批粘贴径零改 ⇒ 无跨档滞后；本批不改 VSC 档 | 本块（记录） |

**随动读数**：本档 §2.5 行 7 ∥ 行 8 按修正轮改动后实读收正（`RENDER-CORE.md` **602** ∥ `COMPOSER.md` **337**）。

**需求档 delta 随动（父侧笔权）**：§2.9 建议文本拒面枚举 +「读取失败」（六拒面）——`docs/desktop/requirements/COMPOSER.md` D13 已落句待父侧同拍（逐字 = §2.9）。

**复跑读数**：`node scripts/doc-check.mjs` = **exit 0**（锚悬空 0 ∥ 行宽 0——修正轮三档改动后复跑）。

**披露**：产品码零触 ∥ `docs/core/design/API-CONTRACT.md` 零触 ∥ 他批面零触（`review-cross-talk` ∥ `model-face-pens` ∥ `review-gate-gaps`）；**未触随动面** = `docs/desktop/design/PROJECT.md` §4.1 越层段两档读数（i18n.mjs ∥ i18n-views）——按惯例归实施后回填轮。

### 2.12 实施后口径对齐（fix 轮 · 父侧派发 · 注记级）

**来源** = §5 D1（三限判据读面 = 已入列 + 在飞——`pendingCount` ∥ `pendingBytes` 记账）∥ #49 ⑥⑧ 披露（建议写明「含在飞档」）。**终值 ∥ 落点**：

| # | 终值 | 落点 |
|---|---|---|
| 1 | **KD-RC-13** 三限口径补登——**档数 ∥ 合计两限含在飞档**（判据 = 已入列 + 在飞：`pendingCount` ∥ `pendingBytes`——受理即入账、读毕 / 失败销账）；注记范围 = 档数 ∥ 合计两限（单档限判 incoming `file.size`——不涉读面；D1「三限」为机制总称） | `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-13（合计句后） |
| 2 | 变更记录 +1 行（置顶） | `docs/render-core/design/RENDER-CORE.md` §变更记录 |

**口径核（实施面实读）**：`thincoder-render-core/composer/attach.mjs:145-173`——档数读面 = `files.length + pendingCount`（`:155`）∥ 合计读面 = `totalBytes() + pendingBytes + file.size`（`:157`）∥ 在飞 = 已受理、未落列（`:145-146`）∥ 受理即入账（`:158-159`）∥ 销账 = 读毕（`:164`）∕ 失败（`:162`）。

**边界**：机制语义零改（口径对齐——注记级）∥ 产品码零触 ∥ 他批面零触（`review-cross-talk` ∥ `model-face-pens` ∥ `review-gate-gaps`）。**复跑读数**：`node scripts/doc-check.mjs` = exit 0（悬空 0 ∥ 行宽 OK——设计档改动后实跑）。

**随动（2026-10-05）**：本档 §2.3 三限计法句已就地收正（口径 = 本块 #1 终值——档数 ∥ 合计两限含在飞档；单档限在外）；`node scripts/doc-check.mjs` 复跑 = exit 0（悬空 0 ∥ 行宽 OK）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象** = 批档 §2 设计（`thcoder`→实读路径下的 `thincoder/docs/batches/2026-10-05-attach-file-support.md`）∥ `thincoder/docs/render-core/design/RENDER-CORE.md` ∥ `thincoder/docs/desktop/design/COMPOSER.md` ∥ `thincoder/docs/desktop/requirements/COMPOSER.md`。**限制**：未声明项目标准档 ∥ 未找到文档地图 ⇒ Document ownership 判据降级（按 Project Guide 判）；产品码锚与代码档行数为域外，未上盘复核——scope 内两设计档行数标注实读一致（RENDER-CORE 597 ∥ COMPOSER 336）。需求面实读：D13 扩句已落且与批档 §2.9 建议文本逐字一致（`thincoder/docs/desktop/requirements/COMPOSER.md:13` ∥ `:23` ⟷ 批档 `:148`）——覆盖成立。

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Affected-file size annotations | 🟡 | `thincoder-desktop/renderer/i18n.mjs` 413 行且本批 +≈6 ⇒ ≈419（`thincoder/docs/batches/2026-10-05-attach-file-support.md:97`）——§2.5「L7 复核 · 行数界」段（`:102`）只处置 `attach.mjs` ∥ `panel.mjs` ∥ `i18n-views.mjs` 三档，该档缺口；同批 `thincoder/docs/render-core/design/RENDER-CORE.md:428` 对 `i18n-views.mjs` 写「**越 300 在册**——键行 = 非结构性触碰 ⇒ 续期」，紧邻的 `i18n.mjs` 只写「+键数链一截」——越层处置句缺。 | 为 `i18n.mjs` 补同式越层处置句（在册 ∥ 续期 ∥ 拆分预案 + 消解窗口）；若判其属纯键值数据面，也以一句给由。 |
| 2 | Acceptance criteria | 🟡 | 红绿对 T1–T11 全经 `Object.defineProperty(input, "files", …)` 直注 + `change` 派发（`:104`）——选择器面零腿；L3 的 `accept` 派生（`:72`）不被任何腿断言，且 T1 走 `text/markdown`（`:108`）⇒ 只命 `text/*` 支——TEXT_EXTS 扩展名支（`:39` 受纳判据的另一半）无腿命中（T7 `.pdf` `:114` 两半皆不中）⇒ 用户报障原话（`:11`「attach 其实只能传图片」）所指面无 AC 覆盖。 | 补选择器面机检腿（断 `input.accept` 含 `text/*` 与 TEXT_EXTS 抽样项）+ 一条 `file.type` 空串、仅按扩展名受纳的腿（另可补无扩展名 `text/plain` 腿验 info string 省略径）。 |
| 3 | Acceptance criteria | 🟡 | 读阶段失败（`FileReader` error ∥ abort）无处置：A3（`:41`）与 L7（`:76`「判序 → 读 → NUL → 解码入列」）未载失败支，T1–T11 无该腿 ⇒ 读失败 = 无芯片 ∥ 无 toast 的第六条静默路，与本批「拒绝面零静默」（`:23`；`thincoder/docs/render-core/design/RENDER-CORE.md:79`「拒面一律出声」）抵触。 | 明确读失败径处置（拒面出声 ∥ 显式登记为已知残余）并给一腿。 |
| 4 | Clarity | 🔵 | 非 UTF-8 文本经 `new TextDecoder().decode(bytes)`（UTF-8；BOM 缺省剥）（`:41`）静默产替换串——内容已腐坏仍入列并送出、零出声；§9 附件边界条（`thincoder/docs/render-core/design/RENDER-CORE.md:491-493`）未载该边界。 | 边界条补「受纳 = UTF-8 可解」句（或补解码检：不可解 ⇒ 出声拒）；维持静默替换则在案给由。 |
| 5 | Requirements coverage | 🔵 | 「每回合 ≤4 档 ∧ 合计 ≤512 KB」（`thincoder/docs/desktop/requirements/COMPOSER.md:13`；词面「每回合最多 4 个」`:56`）机制上 = 未发送列表计数（「合计 = 已收档位 `size` 之和」`:40`；发送即清列 `:48`）——非按 agent 回合计；同一回合经队列两次发送可累计越限而不触拒。 | 机制行明确「每回合」的操作定义（= 每次发送前的未发列表）使需求句 ∥ 词面 ∥ 机制三处同义；若本意为按 agent 回合封顶，须另加回合界计数。 |
| 6 | Clarity | 🔵 | TEXT_EXTS 计数漂移：文述「约 76 项」（`:39`）与同处枚举实计 **79** 项（逐项清点）。 | 去约数或将计数与枚举对齐（实施前锁定清单——受纳面宜单值）。 |
| 7 | Clarity | 🔵 | 单位口径未载：常量 256 000 ∥ 512 000 B（`:40`）与需求句 ∥ 词面「256 KB ∥ 512 KB」（`thincoder/docs/desktop/requirements/COMPOSER.md:13`；批档 `:55` ∥ `:57`）两制并存——边界大小档（如 260 000 B）的提示词与判据观感不一致。 | 机制行标注单位制（如 KB = 1000 B），或使词面与常量同口径。 |
| 8 | Clarity | 🔵 | 内联入消息文本后，桌面回合起跑仍过 KD-51 `injectAtRefs` 全扫（`thincoder/docs/desktop/design/COMPOSER.md:19`「注入位 = 用户回合起跑前单点」；`:80`「注入只在 `run` 入参」）——设计未说明附件内联内容是否豁免该扫描（同径 ∥ 豁免二选一未在案）；含 `@…` token 的源码内容之扫描行为 = unverified（未读实现）。 | 补一句归属句（同径 = 有意 ∥ 加豁免）；行为面实施时实读补证。 |

**计数**：🔴 0 ∥ 🟡 3 ∥ 🔵 5（共 8 条）。

**域外注（无严重度）**：本批改 VSC 侧可见行为（按钮词 ∥ `accept` ∥ 词键）但 §2.2 落点表不涉任何 VSC 侧设计档——若 VSC 侧档（如 `docs/vsc/design/WEBVIEW-INPUT.md`）载有该附件面词值镜像或机制描述，本批可能留下跨档滞后（未证——域外，未读该档）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-10-05 20:4x 父侧代签**——依据用户 20:15「其余两件也要做」= 全链授权（代点火评审 → 代签 → 实施派发 → 收口；「自动跑」在效）。

**三条件核验**：

① **设计评审通过** ✓——评审 id=43（VERDICT pass · 0🔴 / 3🟡 / 5🔵 + 域外注 1）→ 修正轮（`#47` 九项全落：腿 T12–T15 ∥ 读失败出声拒 + 新键 `composer.attach.readFailed` + 全链随动 ∥ `i18n.mjs` 越层处置句 ∥ §9 ⑥ ∥ 「每回合」定义 ∥ 计数 79 ∥ 单位制 ∥ `@ref` 归属句 ∥ VSC 档核查「已核，零命中」）→ 父侧抽读核过（§2.5 `:105` ∥ §2.6 `:107` / `:122-125` ∥ §2.4 `:89` ∥ §2.11 `:167-189` ∥ `RENDER-CORE.md:426-429`）。
② **修正落地并逐条核验** ✓——上列各窗实读对位；需求档 delta 同拍（D13 拒面枚举收正为六面——本笔随落）。
③ **token 已签发** ✓（pass——运行态不入档）。

**批准范围** = 受纳（`TEXT_EXTS` 79 项 + `text/*`；三限 256KB / 4 档 / 512KB；NUL 判二进制）∥ 六拒面出声（含读失败）∥ 发送内联（`[Attached file:]` + fenced；回显 / 上行 / 迟到补写三面同串）∥ 芯片双族 ∥ 词面 +6 键（链 138 ⇒ 144 ∥ 308 ⇒ 314）∥ 两设计档 + 批内件 T1–T15。**边界** = 图片道零改 ∥ 不做 PDF/Office/二进制 ∥ 粘贴径零改 ∥ 桌面端面 / 宿主 / 核 / CLI 零触。

## §5 实施记录（eng-coder）

### 5.1 交付摘要（实施面实读 · 2026-10-05 · 台账 #948）

**状态行**：实施完成（先红后绿 16/16 · 门读数全绿 · 审计 no-divergence · 代码评审 turns 1→fix→2 pass · 终态 clean）

- 核 `thincoder-render-core/composer/attach.mjs`（124 ⇒ **236** 行）：`TEXT_EXTS`（79 项——逐项同设计枚举）∥ 三限常量（256000 ∥ 4 ∥ 512000）∥ `BINARY_SCAN_BYTES`（8000）∥ `isTextFile` ∥ `accept` 同源派生 ∥ `collectTextFile`（判序 = 档数 → 单档 → 合计；`readAsArrayBuffer` → 前 8000 B NUL 扫描 → UTF-8 解码入列；`error`/`abort` ⇒ `readFailed` 出声拒）∥ 芯片双族（图 `📎 image N` + `data-kind` 属性级 ∥ 档 `📎 <名>` 经 `escapeHtml`）∥ `renderPasteBar` 空条件补 `files.length === 0` ∥ 返回面 +`files` ∥ 内联纯函数两件（`formatFileBlock` ∥ `withAttachedFiles`）。
- 核 `thincoder-render-core/composer/panel.mjs`（466 ⇒ **472** 行）：import +`withAttachedFiles`；`send()` 两径（忙态 ∥ 直发——满队拒收判之后）快照清列 + 内联；回显 ∥ 上行同串（K3 单值单源）。
- 词面四档：`thincoder-vscode/locales/en.json` ∥ `thincoder-vscode/locales/zh.json`（278 ⇒ **284** 行 · 键 276 ⇒ 282）；`thincoder-desktop/renderer/i18n-views.mjs`（384 ⇒ **398**）；`thincoder-desktop/renderer/i18n.mjs`（413 ⇒ **416**——键数链续链 `VIEWS_DICT` 138 ⇒ 144 ∥ `HOST_DICT` 308 ⇒ 314）；`toolbar.attach` 两语收正（Attach file ∥ 添加文件）。
- 批内件新档 `docs/batches/2026-10-05-attach-file-support.test.mjs`（**366** 行 · 16 例 = T1–T15 + AC-7 词面对拍）。
- 零触面（复核）：图片道（`RASTER_MIME` 值 ∥ 粘贴径 ∥ `readImageFile` ∥ `images` 列）∥ 桌面端面（`thincoder-desktop/renderer/attach.mjs` ∥ `composer-wire.mjs` ∥ `composer-sync.mjs` ∥ `mount-composer.mjs`）∥ 宿主 ∥ CLI ∥ `thincoder-core` ∥ 两设计档（设计轮已落）。

### 5.2 红绿两读（先红后绿）

- **红（首跑 · 机制面未落）**：`node --test docs/batches/2026-10-05-attach-file-support.test.mjs` ⇒ tests 16 ∥ pass **2** ∥ fail **14**——红 = T1–T9 ∥ T12–T15 ∥ AC-7；绿锁 T10 ∥ T11 现盘绿（与设计判别列同值）。红样本：T1 `badge=""`；T2 `text="行文"`（零块）；T3 ∥ T7 ∥ T15 `toast=null`；T12 `accept="image/*"` ∥ `TEXT_EXTS=0`。
- **绿（终形 · fix 轮后复跑）**：tests 16 ∥ pass **16** ∥ fail **0**。样本：T1 `badge="📎 notes.md✕"`；T2 ∥ T9 = 原文 + 空行 + 头行 + fenced 段（info `md`）逐字断言通过；T3 `toast="文件过大（上限 256 KB）：big.txt"`；T5 `toast="文本附件过多（每回合最多 4 个）：m5.txt"`（同一 change 事件五档腿）；T6 `toast="本回合附件合计超过 512 KB：h3.txt"`（同一事件 3×200 000 B 腿）；T15（error ∥ abort）`toast="无法读取文件：notes.md"`。

### 5.3 门读数

| 门 | 读数 |
|---|---|
| 批内件（红 → 绿） | 红 = pass 2 ∥ fail 14（T10 ∥ T11 绿锁在位）⇒ 绿 = **16/16**（exit 0） |
| `node --check` ×3 | `thincoder-render-core/composer/attach.mjs` ∥ `thincoder-render-core/composer/panel.mjs` ∥ 批内件 = exit 0 ×3 |
| 行位守限 | `attach.mjs` **236** <300 ✓ ∥ `panel.mjs` **472** ≤500 ✓（越 300 = 在册续期——单源 = `docs/render-core/design/RENDER-CORE.md` §6 本批随动段） |
| 词面 | 两语键集相等（+6 同拍）∥ 键 282 ∥ 282；桌面第二档六键值逐字同 VSC；链 144 ∥ 314（实读对盘） |
| `doc-check` | `node scripts/doc-check.mjs` = exit 0（锚悬空 0 ∥ 行宽 0） |

### 5.4 决策透明表

| # | 决定 | 由 |
|---|---|---|
| D1 | 三限判据读面 = 已入列 + **在飞**（`pendingCount` ∥ `pendingBytes`：受理即入账、读毕或失败销账） | 设计不变量「未发列表 ≤4 档 ∧ ≤512 000 B」+ AC-2 拒面零静默；原「只读已入列」在**同一 change 事件多选**下可整体越限且零出声（代码评审轮 1 🔴）——修正 = 判据面修补（档位形 ∥ 设计路径零改） |
| D2 | 批内件 T5 ∥ T6 **同腿号**补「同一事件多选」段（不新增腿号） | 腿号链 T1–T15 由设计锁定；盲区属两腿各自判据面 ⇒ 同腿号内补齐 |
| D3 | AC-7 词面对拍以 `AC-7（词面…）` 命名落批内件（不占 T 号） | 设计把 AC-7 检查面指为「批内件对拍」但未分配腿号；守 T1–T15 链不动 |
| D4 | 围栏长只按内容最长反引号串计（不并 info string 反引号） | 逐字 = 设计规则；域外沿（info 含反引号）只登记不擅改（见披露④） |
| D5 | `@ref` 同径面零改（不豁免内联段） | 设计已裁「同径（有意）」；行为实证在域外档（`thincoder-core/file-refs.mjs`）——是否另批豁免交父侧 |
| D6 | `fileExt` 去导出（本档内部件） | 设计导出面未列（§2.4 L1 ∥ `docs/render-core/design/RENDER-CORE.md` §5 条 6）；内部审计 🔵 收正 |
| D7 | `panel.mjs` 头部行数注随盘收正（466 ⇒ 472 ∥ 余 34 ⇒ 28） | 文件自带事实陈述随落盘更新（注释准确性） |
| D8 | 不触随动面 = `docs/desktop/design/PROJECT.md` §4.1 越层段两档读数 | 设计已披露「按惯例归实施后回填轮」（§2.11）；本实施轮零该档笔权 |

### 5.5 审计与代码评审轮次与终态

- **内部 divergence 审计（explore · 轮 1）**：VERDICT = **no-divergence**（四类偏差全零）；观察项 🔵 四（`fileExt` 多余导出 ∥ `panel.mjs` 行数注滞后 ∥ `docs/desktop/design/PROJECT.md` §4.1 两档读数滞后〔设计已推迟〕∥ 邻档 mtime 不可归因〔并行批〕）——前两项当场收正。
- **内部代码评审（advisor · 轮 1 · 全量）**：VERDICT = **changes-required**——🔴1（三限多选绕过 + 零出声；批内件 T5 ∥ T6 盲区）+ 🟡3（本档 §5∥§6 空 ∥ `@ref` 同径行为补证缺 ∥ 批内件越 300 顾问线）+ 🔵5。
- **fix 轮 1（本实施轮）**：🔴 已修（在飞档记账 + T5 ∥ T6 同事件多选腿）；随带 `fileExt` 去导出 ∥ `panel.mjs` 行数注收正。
- **内部代码评审（advisor · 轮 2 · 只验修复面）**：VERDICT = **pass**——四项修复声明逐项已核；无新 🔴；余项 = 🟡2（记录面）+ 🔵/advisory（均非阻塞、明确 report-only）。
- **终态 = `clean`**（轮 1 全量 → fix → 轮 2 复核 pass）。

### 5.6 披露

① 自修两笔（D1 在飞档记账 ∥ D6 去导出）与两处 🔵 清理均在隔离内完成并复跑绿；② 域外只读实证 = `thincoder-core/file-refs.mjs`（`@ref` 展开机制：读档 ≤4000 截断后注入）——是否另批豁免 ∥ 登记边界交父侧；③ `@ref` 面 = 内联正文含可解析 `@路径` token 时模型输入面被就地展开（气泡所见不变）；设计裁「同径（有意）」⇒ 本批零改（残余登记）；④ 围栏沿 = info string 反引号未并计（设计规则外沿）+ 读 ∥ 发竞态（在飞档不入发送快照）——两项 🔵 登记，另批可选；⑤ 批内件 366 行越 300 顾问线（批内件 · 随批留存 · 不进仓套件）；⑥ `toolbar.attach` 收正仅达 VSC 消费面，桌面按钮词仍为核件硬编码英文（设计 L4 面；既有非回归）；⑦ `docs/desktop/design/PROJECT.md` §4.1 两档读数待回填轮收正——本实施轮零触。

## §6 验证与收口（父代理）

**2026-10-05 21:2x · 收口**

**① 交付验证**：实施（`#49`）七档写入面（含评审轮 1 🔴 自修 = 三限判据「已入列 + 在飞」记账）+ 设计档口径两笔（`#51` KD-RC-13 `:79` ∥ `#52` §2.3 `:40` 就地收正）。**父侧抽验**：`attach.mjs:31-42`（`TEXT_EXTS` 79）∥ `:145-173`（`collectTextFile`——在飞记账：档数读面 `files.length + pendingCount` ∥ 合计读面 `totalBytes() + pendingBytes + file.size`）∥ `:206-226`（`formatFileBlock` / `withAttachedFiles`）∥ `panel.mjs:334-342` ∥ 批内件独立亲跑 ∥ `RENDER-CORE.md:79` ∥ §2.3 `:40`。

| 面 | 终值 | 核验读数 |
|---|---|---|
| 批内件 | `docs/batches/2026-10-05-attach-file-support.test.mjs`（366 行 · 16 例：T1–T15 + AC-7 词面对拍） | 先红后绿：首跑 **pass 2 / fail 14**（T10 ∥ T11 绿锁在位）→ **父侧亲跑 16/16** |
| 行位守限 | `attach.mjs` **236 <300** ∥ `panel.mjs` **472 ≤500**；词面链 144 ∥ 314；两语键集相等（282 ∥ 282） | 实读核 ✓ |
| 门 | `node --check` ×3 exit 0 ∥ `doc-check` exit 0（悬空 0 ∥ 行宽 0——含父侧回填折行收正） | 父侧亲跑 ✓ |
| 契约面 | `api-contract` 生成回填 **2912 条 → OK 零漂**（父侧直接执行——归还本波在飞窗） | 实跑 ✓ |
| 数据面 | 词表读数回填 = `UI.md:499` **416** ∥ `:500` **398** ∥ `PROJECT.md` 越层段两行（折行守宽） | 父侧直接执行 · 可 revert ✓ |

**② 集成场景**：零涉（桌面输入区功能面——真机走查随下批人机走查，非自动面）。

**③ 仓套件读数**：三端跑器（cli ∥ desktop ∥ vscode）**空清单绿灯 ×3**（父侧亲跑 exit 0——本波统一读数）。

**④ 收口清单核验**：角色表六段齐 ✓ ∥ 状态行 = 已收口（close 落）∥ 计数（6 产品档 + 批内件 + 2 设计档 + 需求档 + 回填 2 档 + `API-CONTRACT.md`）∥ 指针（§2 ∥ KD-RC-13 `:79` ∥ §5 D1）✓ ∥ 变更记录（两设计档 + 需求档各自）✓ ∥ 待办勾销 = `#948` ∥ 前批遗留跨核 = 无 ∥ 台账面 = 核销行。

**⑤ 暂缓批复核**：无（边缘三项在册另批面：剪贴板文件收集 ∥ 无扩展名源码档 ∥ PDF/Office）。

**⑥ 债务与备忘**：① `@ref` 展开归属（设计裁「同径有意」）与围栏沿 / 读∥发竞态 = 在册候选（另批可选）；② `toolbar.attach` 收正仅达 VSC 消费面（桌面按钮词 = 核件硬编码英文——设计 L4 面、非回归）在册；③ 批内件 366 行越顾问线（随批留存 · 不进仓套件）。

**⑦ 收口判定**：实施验证通过（16/16 ∥ 门全绿 ∥ 行位守限 ∥ `api-contract` 零漂）⇒ 本批**收口**（记录冻结）。
