/**
 * i18n.mjs — 词表面（`docs/desktop/design/SHELL.md:31` · 批 2 档 §2.4（g）· 本批 §2.1 E-5 / §2.5 U44）：
 *   ① 核域键 = `config:read` 语言面**下发投影**（核 `projectDictionary(locale)` 已扁平投影
 *      ⇒ 渲染面零核导入、零第二词表源）；
 *   ② 宿主 UI 专有键 = `HOST_DICT`（左列 17 键 + 标签条 4 键 + 对话流 10 键 + 活动池 7 键 + 审批卡 7 键
 *      + 提问卡 3 键 + 设置 49 键 + 向导 10 键 + 信息行 9 键 + 输入区 6 键 + 会话头 3 键 + 档位 2 键
 *      + 状态栏 1 键 + 状态行 16 键 + 核件复制钮 2 键 + **核件子 agent 词键 7 + 说话人三键 3** = **156 键** × 2 语（批 B 增十二键：本舱七 = 对话流复制面 2 · 会话头 3 · 档位 2；
 *      并行舱五 = 输入区附件面 3 · 设置档位列 1 · 状态栏读数 1 —— 附件降级两键名出
 *      `docs/desktop/design/UI.md` §1 批 B 注项 2，余键名与全键值面由本档拟定：批 B 注只述形 / 锚，
 *      词面登记处 = 此处）；**批 B 追加轮增二键** = 对话流引导面 2（键名与两语句面单源 =
 *      `docs/desktop/design/UI.md` §1 批 B 追加注项 4）；
 *      两语键集须相等，增键两语同增、禁单语落键）；**R3a 增十键** = 状态行段词（D17 承载 12 段 —— 注意力 / 当前工具 /
 *      耗时 / 任务计数 / 令牌三件 / 计时 / 排队两句；状态词「运行中」与回合 N/M 两段**复用核 i18n 键**
 *      `sub.running` / `status.turn` —— 同义词不另立，词形与核同源）；
 *      **R3b**：活动池族标 `pool.family.blocks` ⇒ **`pool.family.subagents`**（右列重定位 = 子 agent 块面 ——
 *      旧键退场不留残）+ 增 `pool.stop`（子 agent 块停止钮词）= 活动池 7 ⇒ **8** 键、计 134 ⇒ **135**；
 *      **R3c**：左列会话行元数据族（D18）两键 = `rail.session.msgs` / `rail.session.updated` —— 左列 13 ⇒ **15**、
 *      计 135 ⇒ **137**；另**增核件复制钮两键** `msg.copy` / `msg.copied`（核 `flow/stream.mjs` `attachCopyButtons`
 *      词键 —— 端供给面：树面零消费（值住核产出 DOM 面），词值同 VSC 同键）—— 计 **137 ⇒ 139**；
 *      **D22 状态栏对齐批增六键**（`status.ready` / `status.enter.send` + banner 四态 `status.banner.plan|auto|advisor|eng`——代号字面，两语同形）= 状态行 10 ⇒ **16**、计 139 ⇒ **145**；**账本可靠批 · 桌面微轮增一键** = `rail.ledger.notice`（左列 15 ⇒ **16**）——计 **145 ⇒ 146**；**该批修正轮增一键** = `rail.ledger.notice.scene`（主句拆出**条件附句** —— 三端同义；左列 16 ⇒ **17**）—— 计 **146 ⇒ 147**；
 *      **「对齐第二批」增十键** = 核件子 agent 词键 7（`sub.*` 族 —— 核 `subblocks/*` 四构件取词）+ 说话人 / 待发送 3（`msg.user` / `msg.assistant` / `queued.pending`）—— 计 147 ⇒ **157**；**同批退场一键** = `pool.stop`（自建五段行块面退场 ⇒ ⏹ 词归核件 `sub.stopBtn`；活动池 8 ⇒ **7**）—— 计 **157 ⇒ 156**；
 *      **桌面空闲唤醒批增三键** = `susp.*` 三键（状态行段 3 支①挂起句 —— 值 zh = CLI 逐字 ∥ en = VSC 逐字；键名沿 VSC 同名键；
 *      消费面 = `renderer/views/statusline.mjs`；`digest.*` **零新键** —— 核字典经 `t()` 投影面直取、`notify.*` 单键（`notify.done` 值对）= 核 `notify-policy.mjs` `NOTIFY_TEXTS` 自持〔非本表〕）—— 计 **156 ⇒ 159**；
 *      **「对齐第三批」增十九键** = 视图面词族**第二档**（`renderer/i18n-views.mjs` —— 在册拆分落形：新增词族出第二档，
 *      本档两语展开合并 ⇒ `HOST_DICT` 单一持有点不变；四组 = 对话流 6 / 输入区 2 / 审批面 1 / 设置面 agent 具名十键）；
 *      **同批退场一键** = `chat.empty.hint`（欢迎条三行取代单行提示 —— 项 15；树面消费归零 ⇒ 键面随退）
 *      —— 计 **159 + 19 − 1 = 177**（键数链随动 = `thincoder-desktop/test/views-chrome-vocab.test.mjs` U51）；
 *      **输入面板上提批（R1）增二十八键** = 输入面板词族**第三档**（`renderer/i18n-composer.mjs` —— 核件
 *      `composer/` 组六件取词；**键名一字不改 ∕ 两语值皆 VSC 逐字** = `thincoder-vscode/locales/*` 同名键；
 *      合并点不变 = 本档 `HOST_DICT` 两语展开）；**同批退场四键** = 自建输入树三词 + 附件条移除控件名
 *      （`composer.input` ∕ `composer.interrupt` ∕ `composer.queue.full` ∕ `composer.attach.remove` ——
 *      消费面随换装归零 ⇒ 键面随退，零残键）—— 计 **177 + 28 − 4 = 201**（链口径 = 两语键集相等，
 *      增 / 退两语同拍）；
 *      **会话模型轮 R13 减十三键** = 左列族四（`rail.recent.title` ∕ `rail.sessions.title` ∕ `rail.project.none` ∕
 *      `rail.empty.hint`）+ 左列动作三（`rail.action.rename` ∕ `rail.action.delete` ∕ `rail.action.cancel`——
 *      换装为 `session.*` 三键）+ `origin.*` 三（来源端标面随左列裁撤退场）+ `tab.action.close*` 三（关闭确认面
 *      随标签裁撤退场；`tab.badge.approval` 保留 —— 位标词键沿 `tab.badge.*` 族）；**同拍增五键入第二档**
 *      （`session.title` ∕ `session.empty` ∕ `session.rename` ∕ `session.delete` ∕ `session.deleteConfirm`——
 *      值 = VSC 逐字）—— 计 **201 − 13 + 5 = 193**（增 / 退两语同拍）；
 *      **R10 增一键 ∕ 退一键** = 增 `sub.newBlocks`（池面出生计数贴 —— 两语值逐字同 VSC `locales/{en,zh}.json:170`；
 *      消费面 = `renderer/views/activity-new.mjs`）+ 退 `pool.empty.hint`（空态提示面随 E2 区域退场 —— 消费面归零
 *      ⇒ 键面随退，零残键）—— 计 **203 + 1 − 1 = 203**（两语同拍；实读基 = 本次改动前 `HOST_DICT` 两语各
 *      203 键；链前段（至 193）后另有批次未逐笔续计 —— 本节自本次起以实读续链）；
 *      **R7 键链复核实读**（承台账 #544「链随 R5 ∕ R7 续链」—— 本次以实读续）：三档单语键数 = `HOST_DICT` **265**
 *      ∕ `VIEWS_DICT`（第二档）**104** ∕ `COMPOSER_DICT`（第三档）**28** ⇒ 合计 **397**（两语同拍、键集相等）；
 *      R7 本次增 **47** 键（第二档 ⑪ 设置补充族 —— 逐键清单 = `renderer/i18n-views.mjs` ⑪ 组）⇒ 前值实读 **350**
 *      —— R2 +7 ∕ R4 +2 ∕ R5 +1 ∕ R6 +5 等前段未逐笔续计，本行起为最新链值；
 *      **R9 增二键**（承 #486 失败面可见性：`session.openFailed` ∕ `session.loadFailed` —— 第二档 ⑤ 组；消费面 =
 *      `renderer/session-wire.mjs` toast）⇒ `VIEWS_DICT`（第二档）104 ⇒ **106**；`HOST_DICT`（**合并表** —— 两语展开含第二 ∕ 三档）
 *      265 ⇒ **267**（= 本行二键经合并点随动）；`COMPOSER_DICT`（第三档）= 28 不变（两语同拍、键集相等）；
 *      **复制面对齐批退二增四**（复制面对齐 VSC 批 · 台账 #557 ∕ #558：退自建复制面两键（块级 ∕ 末条两控件可及名，消费面归零
 *      ⇒ 键面随退）；增 `menu.edit.*` 四键（主进程右键编辑菜单文案 ——
 *      消费面 = `src/main/context-menu.mjs` `contextMenuLabels` 直取本表））⇒ `HOST_DICT`（**合并表**）267 ⇒ **269**（两语同拍、键集相等）；
 *      **B10 W2 增八键**（S1 ∕ S2 ∕ S5 ∕ S6 词面七键 = `settings.proxyRow` ∕ `settings.proxyRowTitle` ∕ `settings.fetchModels` ∕
 *      `settings.connecting` ∕ `settings.connOk` ∕ `settings.providerUrlRequired` ∕ `settings.secretDeleteConfirm` + 第二档 `settings.indexNoKey`〔S12〕；
 *      行面「不可用」∕ 拉取失败兜底两词复用同表在册键 `settings.reason.unavailable` ∕ `settings.reason.probeFailed`）⇒ 实读
 *      `HOST_DICT`（**合并表**）**279** ∕ `VIEWS_DICT`（第二档）**109**（两语同拍、键集相等；其间他批增键未逐笔续计 —— 台账 #575 在途）；
 *      **让位修复批增二键**（承 `docs/batches/2026-09-29-subblock-follow-resume.md` —— `sub.follow.new` ∕
 *      `sub.follow.bottom`：核件出口钮两态（消费面 = 核 `subblocks/block.mjs` 出口钮，词经注册端出）；值逐字同
 *      VSC `locales/{en,zh}.json` 同名键）⇒ 实读 `HOST_DICT`（**合并表**）**281**（两语同拍、键集相等；届盘重读落笔 ——
 *      并行舱键增未逐笔续计，后落者续链；**收口复读**〔父侧 · 2026-09-29 · #603 §6 实测〕：三档单语键数 = `HOST_DICT` **295** ∕ `VIEWS_DICT`（第二档）**124** ∕ `COMPOSER_DICT`（第三档）**28**（两语同拍、键集相等——其间多舱增键未逐笔续计，本行为最新链值）。
 *      **状态行 ⇒ CLI 补漏批退一键**（项目级读数族末键两语退场 —— 段 11 改常驻、消费归零 ⇒ 键面随退，零残键；
 *      `status.usage` 仅值改、零增退）⇒ 实读 `HOST_DICT`（**合并表**）**295 ⇒ 294**（两语同拍、键集相等；届盘实读续链）。
 *      **i18n 拆分批（2026-09-29 · 台账 #614 · 顶格消解）**：`settings.*` 族 **55** 键出档（→ `renderer/i18n-settings.mjs`
 *      （第四档））⇒ 本档自有 **142 ⇒ 87**、四档单语键数 = `HOST_DICT`（**合并表**，值零动）**294** 不变 ∕ `VIEWS_DICT` **124** ∕
 *      `COMPOSER_DICT` **28** ∕ `SETTINGS_DICT` **55**（两语同拍、键集相等；机检 = 批内件）。
 *      **撤会话头批退三键**（会话头三字段标两语同退 —— 台账 #668；消费面随面退场 ⇒ 键面随退，零残键）
 *      ⇒ 实读 `HOST_DICT`（**合并表**）**295 ⇒ 292**（两语同拍、键集相等；届盘实读续链）。
 *      **S3 分档批增一键**（#673 · 2026-09-29：`settings.reason.hostBusy` 两语同增 —— 渠行行标分档词，
 *      消费面 = `renderer/views/settings-sections.mjs`）⇒ `SETTINGS_DICT`（第四档）**55 ⇒ 56** ∕
 *      `HOST_DICT`（**合并表**，经合并点随动）**292 ⇒ 293**（两语同拍、键集相等）。
 *      **右栏宽度拖动批增一键**（#742 · 2026-09-30：`pool.resize` 两语同增 —— 拖柄 `aria-label` 词，消费面 = `renderer/pool-width.mjs` `refreshResizerLabel`）⇒ 实读 `HOST_DICT`（**合并表**）**294 ⇒ 295**（两语同拍、键集相等；届盘实读续链——链文前值 293 系滞后值，并行批增键未逐笔续计）。
 *      **主题切换批增四键**（#743 · 2026-09-30：面头主题三态族 `settings.theme` ∥ `.system` ∥ `.light` ∥ `.dark` 两语同增 ——
 *      值 = 设计给定；消费面 = `renderer/views/settings.mjs` `themeNode`）⇒ `SETTINGS_DICT`（第四档）**56 ⇒ 60** ∕
 *      `HOST_DICT`（**合并表**，经合并点随动）**295 ⇒ 299**（两语同拍、键集相等；届盘实读续链）。
 *   ③ `t(key, params)` 解析序 = **宿主 → 核投影 → 键名自身**（缺键回落键名：不静默吞、不抛、
 *      永不返回空 / `undefined`）；插值 = **核同形** `${name}`（键值由核 `projectDictionary`
 *      原样投影 ⇒ 占位方言只能随核 —— `thincoder-core/i18n.mjs:12`「两端同约定」），缺参原样保留；
 *   ④ 语言归一：**与核 `normalizeLocale` 同形同终态**（`thincoder-core/i18n.mjs:75-81`）—— BCP-47 取
 *      基语言（`zh-CN` ⇒ `zh`）；缺 / 非串 / 未知 ⇒ `"en"`；值域同核 `SUPPORTED_LOCALES`。
 *   ⑤ **核件取词单点接线**（「对齐第二批」项 3 / 修复轮收正 —— 接线点外移）：核构件族内取词走核 i18n
 *      （模块级 `t`）⇒ 端侧经**注册面** `setStringsSink(fn)` 注入 —— 注册单点 = `renderer/app.mjs`
 *      （`setStringsSink(setStrings)` 一次注册；核件供体 `/rc/i18n.mjs` 居该浏览器专属档）；本档 `initDict`
 *      合并式（核投影 ∪ 宿主表）**经注册端出**（缺 sink ⇒ 空操作 —— 本档保持平 node 可装载：**零 `/rc/`
 *      静态导入**，判据单源 = `docs/desktop/design/SHELL.md` §1「node-safe 子集」）；核件所需 VSC 侧键
 *      （`sub.*` 族 / `msg.*` / `queued.pending`）入宿主表，**值逐字同 VSC locales**（沿 `msg.copy` /
 *      `msg.copied` 先例）。
 * 零落盘 · 零 `node:` / 零裸包（渲染面静态闭包判据）。
 */
import { COMPOSER_DICT } from "./i18n-composer.mjs"
import { SETTINGS_DICT } from "./i18n-settings.mjs"
import { VIEWS_DICT } from "./i18n-views.mjs"

/** 宿主 UI 专有键（两语键序同 = 对位阅读 · 键集相等 = 用例机检面）：`rail.*` = 会话控制条残余族（打开目录 ∕
 *  新建会话两动作词 + 会话条目三键 = 缺省题 ∕ 计数 ∕ 日期 + 账本注记两键——会话模型轮 R13：原左列元素族随左列
 *  裁撤退场，保留键 = 会话控制条 ∕ 引导面两消费面同用）·
 *  `chat.*` = 对话流（引导面两键 / 摘要块 / 药丸两态 /
 *  工具卡改动摘要 + 耗时；`welcome.*` 四键 = `no-message` 帧欢迎条三行〔含文案二值〕—— 单源
 *  = `renderer/i18n-views.mjs`）· `menu.*` = 主进程原生右键菜单四键（编辑族文案 = 剪切 ∕ 复制 ∕ 粘贴 ∕ 全选 ——
 *  消费面 = `src/main/context-menu.mjs` `contextMenuLabels`，主进程直取本表）· `pool.*` = 活动池（标题 / 三族标 / 折叠控件两态 `aria-label` / 空态提示 ——
 *  折叠字形住 `renderer/pool.css`）· `approval.*` = 审批卡两形三出口词面 + 批形计数（`${count}` 占位；
 *  键位闭集住 `renderer/views/approval.mjs`）· `question.*` = 提问卡（文本控件 `aria-label` / 提交键 / 取消键 ——
 *  键位闭集住 `renderer/views/question.mjs`）· `settings.*` = 设置面（**60 键** —— 单源 = `renderer/i18n-settings.mjs`）·
 *  `wizard.*` = 首启向导（标题 / 退场 / 三步名 / 两推进键 / 渠道提交键 / 目录步两词）·
 *  `composer.*` = 输入区（**换装后残余两族**：B21 发送失败行 `composer.send.failed`〔住 `renderer/i18n-views.mjs`〕+
 *  B22 降级提示行两键 `composer.attach.nonvision` ∕ `composer.attach.partial`——三键皆端侧自有词，非 VSC 源；
 *  旧三词（输入框 `aria-label` ∕ 中断控件词 ∕ 满队提示行）+ 附件条移除控件名随自建树退场——核件控件词归
 *  `renderer/i18n-composer.mjs`）·
 *  `effort.*` = 档位两特值词（`auto` = 未设（`null`）·
 *  `off` = 关思考 —— 逐模型枚举成员**零词键**、原字面投影）· `status.*` = 状态行（上下文读数串 `context ${percent}%${tokens}` —— 令牌尾串 `␣<fmtK>`、0 ∕ 缺 ⇒ 缺席 = 半态〔状态行 ⇒ CLI 补漏批改形〕——
 *  未至 / 非正数 ⇒ 零节点，键面不落空串；段词十六键 = 注意力 / 当前工具 / 耗时 / 任务计数 / 令牌三件 / 计时 /
 *  排队两句 + 静息词 / 输入提示静息态 / banner 四态（代号字面 —— 两语同形）＋ **R4 增状态文本 index 两形二键**
 *  （`status.indexScan` ∕ `status.indexProgress` —— 值逐字同 VSC locales；表外四 kind 与压缩四态 = 核投影取、零新键）
 *  ——段词与判据单源 =
 *  `renderer/views/statusline-segments.mjs` + `renderer/views/statusline-banner.mjs`〔banner 四态〕）· 占位方言沿核 `${name}`，本档零字形字面）。 */
export const HOST_DICT = Object.freeze({
  en: {
    "rail.action.openDir": "Open folder…",
    "rail.action.newSession": "New session",
    "rail.session.untitled": "Untitled session",
    "rail.session.msgs": "${n} msgs",
    "rail.session.updated": "${date}",
    "rail.ledger.notice": "Session ledger anomaly (${reason}) — opening a session self-heals it",
    "rail.ledger.notice.scene": "Corrupted-scene files kept 30 days",
    "tab.badge.approval": "awaiting approval",
    "chat.pill.new": "${n} new",
    "chat.pill.bottom": "Back to latest",
    "chat.summary.older": "${n} earlier messages",
    "chat.tool.changes": "${files} files · +${add} −${del}",
    "chat.tool.duration": "${seconds}s",
    // ── 右键编辑菜单四键（复制面对齐批：主进程 `src/main/context-menu.mjs` `contextMenuLabels` 直取本表 ——
    //    显式 `label` 文案（不采 role 默认文案 = 英文硬编码字面）；`locale` 现读 ⇒ 两语随动）──
    "menu.edit.cut": "Cut",
    "menu.edit.copy": "Copy",
    "menu.edit.paste": "Paste",
    "menu.edit.selectAll": "Select All",
    // ── 核件复制钮两键（R3c：核 `flow/stream.mjs` `attachCopyButtons` 词键 —— **端供给面**，树面零消费；
    //    词值同 VSC 同键（`thincoder-vscode/locales/en.json:34-35`）—— 同一控件同词）──
    "msg.copy": "Copy",
    "msg.copied": "Copied!",
    // ── 核件子 agent 词键 + 说话人 / 待发送三键（「对齐第二批」项 3 / 4：核构件族内取词经**注册端**注入
    //    （注册单点 = `renderer/app.mjs` `setStringsSink(setStrings)`；本档 `initDict` 合并式经注册端出）；
    //    **值逐字同 VSC locales** —— 同一控件同词；`msg.user` / `queued.pending` = 核
    //    `queued-mark` 两原语取词（`paintLabel` / `markPending`），`msg.assistant` = 端侧助手标签同字面落形
    //    （核无原语 —— 端差登记）；`sub.newBlocks` = **R10 增**（池面出生计数贴 —— 端侧消费 = `views/activity-new.mjs`））──
    "sub.async": "async",
    "sub.sync": "sync",
    "sub.waiting": "waiting",
    "sub.awaitingApproval": "Awaiting approval: ${tool}",
    "sub.cancelQueueBtn": "cancel queue",
    "sub.stopBtn": "Stop this subagent",
    "sub.newBlocks": "↓ ${n} new block(s)",
    // 让位修复批增二键（2026-09-29 · #603 · 核件出口钮两态——核 `subblocks/block.mjs` 取词经注册端出；
    // 值逐字同 VSC `locales/{en,zh}.json` 同名键——同一控件同词）
    "sub.follow.new": "↓ New output",
    "sub.follow.bottom": "↓ Back to latest",
    "sub.desc": "Subagent activity — the agent spawned a helper for an independent subtask. Expand for details; ⏹ stops a background run.",
    "msg.user": "You",
    "msg.assistant": "ThinCoder",
    "queued.pending": "Queued — sent automatically, no interruption",
    // ── 首启引导面（批 B 追加轮：`views/chat-guide.mjs` —— 两码文案）──
    "chat.guide.noProject": "No project open — open a folder to start",
    "chat.guide.noSession": "No session yet — create one to start chatting",
    "pool.title": "Activity",
    "pool.family.approvals": "Approvals",
    "pool.family.subagents": "Subagents",
    "pool.family.queue": "Queued",
    "pool.collapse": "Collapse activity",
    "pool.expand": "Expand activity",
    "pool.resize": "Resize activity panel",
    "composer.attach.nonvision": "Images not sent — this model does not accept images",
    "composer.attach.partial": "Some images were dropped (over the limit or failed to save) — the rest were sent",
    "approval.once": "Allow once",
    "approval.always": "Always allow",
    "approval.reject": "Reject",
    "approval.batch.approveAll": "Approve all",
    "approval.batch.deny": "Deny all",
    "approval.batch.oneByOne": "Review one by one",
    "approval.batch.count": "${count} tools awaiting approval",
    // ── 提问卡（批 A：`views/question.mjs` —— 键名由该档拟定，登记面即此处）──
    "question.input": "Your answer",
    "question.answer": "Send answer",
    "question.cancel": "Cancel",
    // 「i18n 拆分批」设置面词族第四档（单源 = `renderer/i18n-settings.mjs` —— 合并式两语展开，键序原位）
    ...SETTINGS_DICT.en,
    // ── 首启向导（批 9：`views/onboarding.mjs`）──
    "wizard.title": "Initial setup",
    "wizard.dismiss": "Close setup",
    "wizard.step.channel": "Provider",
    "wizard.step.model": "Model",
    "wizard.step.dir": "Folder",
    "wizard.next": "Next",
    "wizard.finish": "Finish",
    "wizard.dir.hint": "Pick a project folder — you can change it later.",
    "wizard.dir.pick": "Choose folder…",
    "wizard.save": "Save provider",
    // ── 批 B 面（档位两特值词 / 状态栏读数串 —— 键名本档拟定，登记面即此处）──
    "effort.auto": "Auto",
    "effort.off": "Off",
    "status.usage": "context ${percent}%${tokens}",
    // ── 状态行（R3a；D22 扩至承载 16 段 —— 增六键：静息词 / 输入提示静息态 / banner 四态〔代号字面 · 两语同形〕）：`views/statusline.mjs` —— 键名本档拟定，登记面即此处）──
    "status.attention.blocked": "⚠ Awaiting your approval or answer",
    "status.tool": "${name}…",
    "status.elapsedSeconds": "${seconds}s",
    "status.tasks": "✓${done}/${total}",
    "status.tokens": "↑${up} ↓${down}",
    "status.tokens.reasoning": "✦${tokens}",
    "status.tokens.hit": "hit${percent}%",
    "status.timer": "⏰${n}",
    "status.queue.enter": "Enter to queue",
    "status.queue.n": "${n} queued message(s)",
    "status.ready": "Ready",
    "status.enter.send": "Enter: send",
    "status.banner.plan": "PLAN",
    "status.banner.auto": "AUTO",
    "status.banner.advisor": "ADVISOR",
    "status.banner.eng": "ENG",
    // ── 挂起句三键（桌面空闲唤醒批 —— 核 i18n 无同源键；值单源 = `docs/desktop/design/IPC.md` §1「挂起 ∕ 消化词键注」：
    //    en = VSC 逐字（`thincoder-vscode/locales/en.json:259-261` 同名键）· zh = CLI 逐字；消费 = 状态行段 3 支①）──
    "susp.running": "${n} background subagent(s) running",
    "susp.digesting": "${n} awaiting digestion",
    "susp.winding": "background subagents finishing…",
    // 「输入面板上提批」输入面板词族第三档（单源 = `renderer/i18n-composer.mjs` —— 核件 composer 组取词；两语展开）
    ...COMPOSER_DICT.en,
    // 「对齐第三批」视图面词族第二档（单源 = `renderer/i18n-views.mjs` —— 合并式两语展开，键序尾随）
    ...VIEWS_DICT.en,
  },
  zh: {
    "rail.action.openDir": "打开目录…",
    "rail.action.newSession": "新建会话",
    "rail.session.untitled": "未命名会话",
    "rail.session.msgs": "${n} 条消息",
    "rail.session.updated": "${date}",
    "rail.ledger.notice": "会话账本异常（${reason}）——打开会话即自动补回",
    "rail.ledger.notice.scene": "损坏现场档保留 30 天",
    "tab.badge.approval": "待审批",
    "chat.pill.new": "${n} 条新消息",
    "chat.pill.bottom": "回到最新",
    "chat.summary.older": "更早的 ${n} 条",
    "chat.tool.changes": "${files} 个文件 · +${add} −${del}",
    "chat.tool.duration": "${seconds} 秒",
    // ── 右键编辑菜单四键（复制面对齐批：主进程 `src/main/context-menu.mjs` `contextMenuLabels` 直取本表 ——
    //    显式 `label` 文案（不采 role 默认文案 = 英文硬编码字面）；`locale` 现读 ⇒ 两语随动）──
    "menu.edit.cut": "剪切",
    "menu.edit.copy": "复制",
    "menu.edit.paste": "粘贴",
    "menu.edit.selectAll": "全选",
    // ── 核件复制钮两键（R3c：核 `flow/stream.mjs` `attachCopyButtons` 词键 —— **端供给面**，树面零消费；
    //    词值同 VSC 同键（`thincoder-vscode/locales/zh.json:34-35`）—— 同一控件同词）──
    "msg.copy": "复制",
    "msg.copied": "已复制！",
    // ── 核件子 agent 词键 + 说话人 / 待发送三键（「对齐第二批」项 3 / 4：值逐字同 VSC locales）──
    "sub.async": "异步",
    "sub.sync": "同步",
    "sub.waiting": "等待中",
    "sub.awaitingApproval": "等待审批: ${tool}",
    "sub.cancelQueueBtn": "取消排队",
    "sub.stopBtn": "停止该子代理",
    "sub.newBlocks": "↓ ${n} 新块",
    // 让位修复批增二键（2026-09-29 · #603 · 核件出口钮两态；值逐字同 VSC `locales/{en,zh}.json` 同名键）
    "sub.follow.new": "↓ 新内容",
    "sub.follow.bottom": "↓ 回到最新",
    "sub.desc": "子代理活动——主 agent 为独立子任务派出的助手。展开看详情；⏹ 可停止后台运行。",
    "msg.user": "你",
    "msg.assistant": "ThinCoder",
    "queued.pending": "待发送 · 不打断当前执行，自动发送",
    // ── 首启引导面（批 B 追加轮：`views/chat-guide.mjs` —— 两码文案）──
    "chat.guide.noProject": "未打开项目——先打开一个项目目录即可开始",
    "chat.guide.noSession": "尚无会话——新建一个会话即可开始对话",
    "pool.title": "活动",
    "pool.family.approvals": "待审批",
    "pool.family.subagents": "子 agent",
    "pool.family.queue": "队列",
    "pool.collapse": "折叠活动池",
    "pool.expand": "展开活动池",
    "pool.resize": "拖动调整活动栏宽度",
    "composer.attach.nonvision": "图片未随发——该模型不支持图片",
    "composer.attach.partial": "部分图片已丢弃（超限或保存失败）——其余照发",
    "approval.once": "允许一次",
    "approval.always": "始终允许",
    "approval.reject": "拒绝",
    "approval.batch.approveAll": "全部批准",
    "approval.batch.deny": "全部拒绝",
    "approval.batch.oneByOne": "逐项审查",
    "approval.batch.count": "待审批 ${count} 个工具",
    // ── 提问卡（批 A：`views/question.mjs` —— 键名由该档拟定，登记面即此处）──
    "question.input": "你的回答",
    "question.answer": "提交作答",
    "question.cancel": "取消",
    // 「i18n 拆分批」设置面词族第四档（单源 = `renderer/i18n-settings.mjs` —— 合并式两语展开，键序原位）
    ...SETTINGS_DICT.zh,
    // ── 首启向导（批 9：`views/onboarding.mjs`）──
    "wizard.title": "初始设置",
    "wizard.dismiss": "关闭向导",
    "wizard.step.channel": "渠道",
    "wizard.step.model": "模型",
    "wizard.step.dir": "目录",
    "wizard.next": "下一步",
    "wizard.finish": "完成",
    "wizard.dir.hint": "选择项目目录——之后也可以更改。",
    "wizard.dir.pick": "选择目录…",
    "wizard.save": "保存渠道",
    // ── 批 B 面（档位两特值词 / 状态栏读数串 —— 键名本档拟定，登记面即此处）──
    "effort.auto": "自动",
    "effort.off": "关闭",
    "status.usage": "上下文 ${percent}%${tokens}",
    // ── 状态行（R3a；D22 扩至承载 16 段 —— 增六键：静息词〔词形来源 = CLI 静息值 `Ready`〕/ 输入提示静息态 / banner 四态〔代号字面 · 两语同形〕）：`views/statusline.mjs` —— 键名本档拟定，登记面即此处）──
    "status.attention.blocked": "⚠ 等待你的审批或回答",
    "status.tool": "${name}…",
    "status.elapsedSeconds": "${seconds} 秒",
    "status.tasks": "✓${done}/${total}",
    "status.tokens": "↑${up} ↓${down}",
    "status.tokens.reasoning": "✦${tokens}",
    "status.tokens.hit": "命中${percent}%",
    "status.timer": "⏰${n}",
    "status.queue.enter": "Enter 排队",
    "status.queue.n": "已排队 ${n} 条消息",
    "status.ready": "就绪",
    "status.enter.send": "Enter: send",
    "status.banner.plan": "PLAN",
    "status.banner.auto": "AUTO",
    "status.banner.advisor": "ADVISOR",
    "status.banner.eng": "ENG",
    // ── 挂起句三键（桌面空闲唤醒批 —— zh = CLI 逐字：`thincoder-cli/src/tui/suspension-drive.mjs` `backgroundStatusText`；
    //    两语句合成式（` · ` 分隔）沿 CLI 同字面）──
    "susp.running": "后台 ${n} 子代理运行中",
    "susp.digesting": "${n} 完成待消化",
    "susp.winding": "后台子代理收尾…",
    // 「输入面板上提批」输入面板词族第三档（单源 = `renderer/i18n-composer.mjs` —— 核件 composer 组取词；两语展开）
    ...COMPOSER_DICT.zh,
    // 「对齐第三批」视图面词族第二档（单源 = `renderer/i18n-views.mjs` —— 合并式两语展开，键序尾随）
    ...VIEWS_DICT.zh,
  },
})

/** 语言值域（与核 `SUPPORTED_LOCALES` 同步 —— **显式常量**，不由 `HOST_DICT` 键集派生：
 *  派生下核增语种即静默分叉；本档零核导入 ⇒ 由用例机检「值域 == 核值域」）。 */
export const SUPPORTED_LOCALES = Object.freeze(["en", "zh"])

/** 缺省语言（未知终态 —— 与核同）。 */
export const FALLBACK_LOCALE = "en"

/** 当前语言（归一后）· 当前核域投影 · 宿主键表覆盖（测试缝，缺省 = 本档 `HOST_DICT`）。 */
let current = FALLBACK_LOCALE
let project = {}
let hostTable = null
/** 核件取词注册槽（「对齐第二批」修复轮）：未注册（平 node / 用例面）⇒ `initDict` 空操作 —— 本档零依赖。 */
let stringSink = null

/** 核件取词注册面（注册单点 = `renderer/app.mjs` —— 浏览器专属档持核 `setStrings`；本档须保持平 node
 *  可装载 ⇒ **零 `/rc/` 静态导入** —— `docs/desktop/design/SHELL.md` §1「node-safe 子集」）。非函数 ⇒ 清槽。 */
export function setStringsSink(fn) {
  stringSink = typeof fn === "function" ? fn : null
}

/** 归一（**镜像核同形** `thincoder-core/i18n.mjs:75-81`：BCP-47 取基语言 `zh-CN` ⇒ `zh`；
 *  缺 / 空 / 非串 / 未知 ⇒ 缺省）。 */
export function normalizeLocale(value) {
  const raw = String(value ?? "").trim()
  if (!raw) return FALLBACK_LOCALE
  if (SUPPORTED_LOCALES.includes(raw)) return raw
  const base = raw.split("-")[0]
  return SUPPORTED_LOCALES.includes(base) ? base : FALLBACK_LOCALE
}

/** 词表置位（引导面调用）→ 归一后的语言。`dict` = `config:read` 载荷的核投影（缺 / 非载体
 *  ⇒ 空投影）；`host` = 宿主键表覆盖（**测试缝** —— 先例 = 核 `_setSessionsDirForTest`：
 *  宿主表缺省 = 本档 `HOST_DICT`（缝：⑤ 优先级判据须能注入同名键）。
 *  **核件取词单点接线**（「对齐第二批」项 3 / 修复轮收正）：同一写点 = 合并式（核投影 ∪ 宿主表，宿主胜
 *  —— 与 `t` 解析序同向）**经注册端出**（`stringSink` —— 注册单点 = `renderer/app.mjs`；缺 sink ⇒
 *  空操作）——核构件族（四件）内取词走核模块级 `t` ⇒ 不接线即出键名。 */
export function initDict({ locale, dict, host } = {}) {
  current = normalizeLocale(locale)
  project = dict !== null && typeof dict === "object" ? dict : {}
  hostTable = host !== null && typeof host === "object" ? host : null
  stringSink?.({ ...project, ...(hostTable ?? HOST_DICT[current] ?? {}) })
  return current
}

/** 当前语言（归一后 —— 读数面）。 */
export function locale() { return current }

/** 插值：**核同形同语义** —— `${name}` 占位、逐参首发替换（镜像核 `t` 的替换面，
 *  `thincoder-core/i18n.mjs:91-93`）；缺参 / 参不匹配 ⇒ 占位原样保留（不吞、不抛）。 */
function interpolate(template, params) {
  if (params === null || typeof params !== "object") return template
  let out = template
  for (const [name, value] of Object.entries(params)) out = out.replace("${" + name + "}", String(value))
  return out
}

/** 解析序：宿主 → 核投影 → 键名自身。 */
export function t(key, params) {
  const hit = (hostTable ?? HOST_DICT[current] ?? {})[key] ?? project[key]
  if (typeof hit !== "string") return String(key)
  return params === undefined ? hit : interpolate(hit, params)
}
