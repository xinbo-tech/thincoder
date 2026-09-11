# VSC 索引 / 感知面收口（6 条）· 批次记录（2026-09-11）

> 六段 append-only，**一段一作者**：§1 讨论（主 agent）· §2 批次任务（eng-designer）·
> §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder 自写）· §6 验证与收口（父代理）。
> 编制：主 agent（工程模式）· 2026-09-11 13:12 · 来源 = 用户 13:10「**批B开工**」（TODO 全量审计 id=28「该落地」清单之批 B）+ 审计报告（逐条一手实测）。

---

## §1 讨论（主 agent 记）

### 需求来源

- TODO 全量审计（id=28）「该落地」清单之 **批 B（VSC 索引 / 感知面）**——6 条同族（VSC 仓索引与用户可见感知）；
- 用户 13:10「批B开工」= 开工。

### 本批条目（6 条——三方一致锚）

| # | 条目 | 分级 | 证据（审计一手，as-of 2026-09-11） |
|---|---|---|---|
| **B1** | **`loadIndex`/`searchIndex` 不校验 `vector_dim`/`embed_model`**——换 embedding 模型（维度不同）→ **静默全 0 分**（用户只看到"搜不到"） | **P2 · 中** | `thincoder-vscode/src/indexer.mjs:92-93` 写入两字段；`:125-135`（loadIndex）与 `:224-261`（searchIndex）**零校验** |
| **B2** | **gitignore 盲区（窄化版）**——gitignored 的**非 memory** 可索引文件增删改**不触发重建**（索引静默过期） | **P2 · 中** | dirty 集只源 `git status --porcelain`（`indexer.mjs:152-155` 注释自述）；memory 目录已特判（`:184-195`），其余未管 |
| **B3** | **`listMemoryFiles` 非递归 vs `discoverFiles` 递归**——嵌套 memory 文件被索引却反复判 file-removed（无效重算） | P3 · 小 | `thincoder-vscode/src/index-discover.mjs:65-73`（`readdirSync` + `e.isFile()`）vs 递归面 |
| **B4** | **reason 串失配**——`"file-changed"`（`:177/:194`）vs `"file-changes"`（`:207` fallback）真差异残留 | P3 · 一行 | `indexer.mjs:177/:194/:207` |
| **B5** | **config.json 外部写盘不实时感知**——CLI `/advisor` 等外部写后扩展端无感知 | P3 · 中 | 全 VSC src **零 `createFileSystemWatcher`**；推送面已在位（`chat-panel.mjs:316` `_pushSettingsLight`） |
| **B6** | **digest 开始无可见指示**——异步子代理完成并入流后长时间无动静（消化已开始） | P3 · 小 | `extension/suspension.mjs:265` 仅 `logEvent("digest:start")`；对齐 CLI `[auto-turn: digesting…]` |

### 已核事实（供 designer 免重复勘察）

- 全部证据 = 审计 id=28 逐条现场触证（行号 as-of 2026-09-11，须复核）；
- 设计档候选：索引面 = `docs/design/MEMORY.md`（VSC 仓）；设置面 = `docs/design/SETTINGS.md`；感知/digest 面 = `WEBVIEW.md` / `SESSION-ACTIVITY-REVISED.md` / `QUEUED-VISIBILITY.md`（归属由 A1 勘察裁定）；
- B5 的 watcher 面：VSC 扩展宿主 API（`vscode.workspace.createFileSystemWatcher`）可用性由设计裁（或明确"轮询/手动刷新"替代）；
- 双端对位：B6 有 CLI 先例（`[auto-turn: digesting…]`）；B1/B2 为 VSC 独有面（CLI 无向量索引）。
- 测试范式：VSC 新档须入 `test/files.mjs`（显式清单）。

### 范围边界（明确不做）

- 不改索引/检索语义（除校验、提示、触发面）；不碰他链在途档；不改 CLI 仓；
- **不得自行新建档**（必须新建 → 停下打回主 agent）。

### 待设计裁定

1. 6 条各自：**修法选型**（候选 ≥2 给选型表；B1 的失配行为 = 报错/提示/自动重建；B2 的覆盖面 = 兜底扫描/显式提示/声明）——**判据 = 静默失效→可见**；
2. 归属档裁定（MEMORY.md / SETTINGS.md / 感知面档 落点）；
3. 受影响文件全清单（行数/增量）+ 用例 + AC（逐条回指 B1–B6）；
4. B5 的实现面（watcher vs 替代——含代价）；
5. 纪律核对（D1 · 双端纪律 · 既有测试锁零伤）。

### 状态

**已收口 2026-09-11**（用户「批B开工」）。下一步 = **设计**（spawn eng-designer）。

---

## §2 批次任务（eng-designer 自写）

_（待写——eng-designer）_

**状态：任务书就绪**（2026-09-11——需求 + 设计 + 测试三层已落档，待设计评审）。实施者 = eng-coder（设计 token 门）。本 §2 = coder 任务书本体（不另写副本；契约逐字 / 用例全文 / AC 判据在设计档各节，本段只做任务书 + 口径锚）。

**落档位置**：需求 = CLI 仓 `docs/requirements/MEMORY.md` **§4**（F6–F9 / N5–N6）· `docs/requirements/AGENT-LOOP.md` **§5**（F-C1 / NFR-C1–C2）· `docs/requirements/MULTI-INSTANCE-COLLAB.md` **§2**（F6 / N5–N6）；
设计+测试 = `MEMORY（VSC 仓）§4`（索引面）· `SETTINGS（VSC 仓）§2.5/§2.6`（设置面）· `WEBVIEW（VSC 仓）§7.2/§7.4`（感知面）。

## 一、六条裁定（§1 五问的结论——实施者据此执行，勿再选型）

| # | 条目 | 裁定 | 落点（设计档） |
|---|---|---|---|
| B1 | 模型/维度校验 | **校验（名称 + 维度双层）+ 不产出 + 可见**——弃自动重建 / 仅报错 / 仅声明 | MEMORY §4.1-B1 · 契约一~四 |
| B2 | gitignored 盲区 | **ignored 集并入（同一 git 子进程加 `--ignored=traditional`）+ 限定根走查**——弃全量扫描兜底（大仓实测 ~3.9s）/ 显式提示 / 仅声明 | MEMORY §4.1-B2 · 契约五 |
| B3 | 嵌套 memory | **`listMemoryFiles` 递归对齐 `discoverFiles`**（走同一 walk）——弃「收窄发现」/ 维持 | MEMORY §4.1-B3 · 契约六/七 |
| B4 | reason 串 | **统一 `file-changed`**（`src/indexer.mjs:207` 一处）——弃常量表 | MEMORY §4.1-B4 · 契约八 |
| B5 | 外部写盘感知 | **宿主 watcher（`createFileSystemWatcher` + `RelativePattern(Uri,…)`）+ 去抖 + stat 元组抑制**——弃轮询 / 焦点触发 / 手动刷新 | SETTINGS §2.6（D-S1~D-S3） |
| B6 | digest 起跑指示 | **流内元素 `#digest-status` + 消息 `{type:"digest", status:"start"\|"end", n, ok?, ms?}`（起止两态 + ok 旗标）**——弃仅状态行文案 / 仅日志 | WEBVIEW §7.4（D-W1~D-W3） |

**B1 要点**（防实施走偏）：机械根因 = `cosine()` 维度不等返回 0（`src/embedding.mjs:48`），`searchIndex` 仍取 top-K
⇒ **返回 score=0.000 的无效条目**。修复 = 三道闸：① `loadIndex` 头一致性（`manifest.vector_dim !== decode.dim` → `null`）
② `indexCompat` 名称闸 ③ embed 后 query 维度闸。**返回 `[]` 即回退信号**（`tools/code.mjs:24` / `memory-tool.mjs:160` 既有回退链）——**消费方零改动**。
**B2 要点**：`!!` 行**不得**进 dirty 集（否则被当"变更文件"）；走查根过滤 `canWalkRoot` = 无 SKIP_DIRS 组件 ∧（无点前缀组件 ∨ `.thincoder/memory` 路径前缀）——与 `discoverFiles` 进入规则同源（`.thincoder` 下仅进 `memory`）；memory 特判块（`:186-195`）**保留**。
**B6 要点**：post 必须**早于** `entry.runTurn` 调用；结束以 `try/finally` 保证 `end` 必发（`ok:false` = 异常——不留「仍在消化」假象）；**直投**（同 `compress` 先例——不经任务可见性 outbox）。

## 二、目标与背景（为什么）

VSC 索引/感知面六条同族缺陷（审计 id=28「该落地」批 B），判据统一 = **静默失效 → 可见**：
① 换 embedding 模型后检索**给错**（全 0 分条目当结果——比"搜不到"更坏）；② gitignored 可索引文件增删改**不触发重建**（索引静默过期）；③ 嵌套 memory 文件**反复判 file-removed**（无效重算/反复整库重建）；④ 诊断 reason 串残留拼写差异；⑤ CLI 等外部写 config.json 后面板常开**零感知**；⑥ 消化轮起跑到首 token 之间**面板无动静**（用户分不清"在消化"与"卡死"——CLI 有 `[auto-turn: digesting …]` 零延迟行）。
不修的后果：①② 用户拿到错误的检索结果 / 过期索引且无任何提示；③ 每次面板打开/切项目都做整库重建判定；⑤⑥ 感知面（"在动没有"）长期缺失。

## 三、已知事实（免重复勘察——直接读）

- 现状锚（as-of 2026-09-11，全部复核过）：`src/indexer.mjs` 326 行（`:92-93` 写两字段 · `:111-135` load · `:140-215` needsRebuild · `:152-155` 快路径注释 · `:186-195` memory 特判 · `:207` `file-changes` · `:224-261` searchIndex）·
  `src/index-discover.mjs` 74 行（`:42-53` shouldIndexFile 不变量注释 · `:65-73` listMemoryFiles）· `src/embedding.mjs:48` cosine · `src/index-bin.mjs` 解码 ·
  `src/extension/panel-index.mjs` 164 行（`:13-31` pushIndexStatus · `:95-111` maybePromptIndex）· `src/extension/chat-panel.mjs:316-335`（`_pushSettingsLight`/`_pushSettings`）·
  `src/extension/suspension.mjs:261-274`（digest 分支）· `webview/chat.js:283-…`（`showCompressStatus` 先例）· `webview/base.css:182-198`（`.compress-status`）· `locales/{zh,en}.json:61-65`（`compress.*`）。
- 调用点：`needsRebuild` 唯一消费 = `panel-index.mjs:102`（只取 `needed`——reason 纯诊断）；`maybePromptIndex` 调用点 = `panel-session.mjs:337` + `panel-project.mjs:55`；`searchIndex` 消费 = `tools/code.mjs:23` + `memory-tool.mjs:151`。
- 测试范式：新测档**必须登记** `test/files.mjs`（显式清单——不登记不跑）；快层 `npm test`（slow 门 800ms 拦截——见 `test/slow.mjs`：需 git 子进程的用例标 `slow(...)`，快层 skip / test:full 照跑）；webview 侧走 `test/helpers/webview-env.mjs`（happy-dom + en locale）；宿主侧走 `test/vscode-mock`（`import * as vscode from "vscode"` 经 devDependency 别名解析到 mock）。
- 现状证伪锚：`createFileSystemWatcher` 全仓 **零命中**；test 目录对 `indexer`/`needsRebuild` **零命中**（B1–B4 无既有覆盖——全新增）。
- 代价实测（本仓 + 本机）：`git status --porcelain` 82ms → `--ignored=traditional` 同量级（19 条 `!!` 条目）；全量扫描反例 = `D:/teamcode` 48,489 可索引文件 walk 672ms + stat 3191ms。

## 四、覆盖需求（三方一致——批次 §2 = 设计 AC 回指 = 需求档条目）

| 需求条目 | 本批内容 | 设计档 | 验收 |
|---|---|---|---|
| **F6**（需求 MEMORY §4） | 索引有效性校验 + 不产出 + 状态/提示双可见面 | MEMORY §4.2 契约一~四 | AC-I1（T-I1~T-I5） |
| **F7**（同上） | gitignored 重建触发（ignored 集 + 限定根走查） | MEMORY §4.2 契约五 | AC-I2（T-I6/T-I7——slow） |
| **F8**（同上） | 嵌套 memory 自检/发现一致 | MEMORY §4.2 契约六/七 | AC-I3（T-I8） |
| **F9**（同上） | reason 词表单一化 | MEMORY §4.2 契约八 | AC-I4（T-I9） |
| **N5/N6**（同上） | 降级可用 + 零回归 + 可机判 | MEMORY §4.5/§4.6 | AC-I5（T-I10） |
| **F-C1**（需求 AGENT-LOOP §5） | digest 起跑即时可见（起止两态） | WEBVIEW §7.4 | AC-D1/AC-D2（T-D1~T-D5） |
| **NFR-C1/C2**（同上） | 对位 CLI + 零回归 | WEBVIEW §7.4 | AC-D3 |
| **F6**（需求 MULTI-INSTANCE §2） | 外部写盘感知（面板自动刷新） | SETTINGS §2.6 | AC-S1（T-S1/T-S2/T-S4） |
| **N5/N6**（同上） | 事件驱动零空转 + 自扰抑制 + 降级 | SETTINGS §2.6 | AC-S2（T-S3/T-S5/T-S6） |

## 五、明确出批（不做——勿扩面）

- 不改检索命中/排序语义、不改 embedding 调用、不做自动重建/自动取消；
- 不引入常驻轮询/新常驻定时器；不做 config 内容级 diff/自动合并；不改既有写盘语义（F5 mtime 门控原样）；
- 不做 embedder/会话槽等进程内缓存的外部写同步（登记边界——MEMORY §4.7 边界二 / SETTINGS §2.6 边界）；
- 不改 CLI 仓**代码与已交付面**（文档域除外——见 §六）；不改提示词；不碰他链在途档（含 `docs/design/ADVISOR-CONVERGENCE.md`——D5 冻结）；
- 不恢复历史 digest 元素（Reload 后不补）；不做消化进度百分比。

## 六、受影响文件全清单（实施域 15 项 = 9 改 + 4 新 + 2 登记；行数 as-of 实测）

**索引面（B1–B4）**：`src/indexer.mjs`（326 → ~385）· `src/index-discover.mjs`（74 → ~92）· `src/extension/panel-index.mjs`（164 → ~196）· `webview/settings-tools.js`（367 → ~382）· `locales/zh.json` + `locales/en.json`（243 → ~245——`settings.indexMismatch` 一键）。
**设置面（B5）**：`src/extension/config-watch.mjs`（**新** → ~55）· `extension.mjs`（83 → ~92）· `test/vscode-mock/index.mjs`（141 → ~162——补 `createFileSystemWatcher` + `RelativePattern`）。
**感知面（B6）**：`src/extension/suspension.mjs`（346 → ~360）· `webview/chat.js`（319 → ~342）· `webview/base.css`（432 → ~446）· `locales/*.json`（+`digest.*` 三键——同上两档）。
**测试**：`test/index-perception.test.mjs`（**新** → ~170）· `test/config-watch.test.mjs`（**新** → ~95）· `test/digest-visibility.test.mjs`（**新** → ~120）· `test/files.mjs`（55 → 58——三新档登记）。
**文档域（设计者写域——coder 零碰）**：VSC 仓 `docs/design/{MEMORY,SETTINGS,WEBVIEW}.md` 三节 + `docs/TODO.md` 6 条状态推进；CLI 仓 `docs/requirements/{MEMORY,AGENT-LOOP,MULTI-INSTANCE-COLLAB}.md` 三节。

## 七、验收标准（逐条见设计档 §4.6 / §2.6 / §7.4——每条可机器验证）

跑法（coder 必须实跑并在报告中给日志尾部）：
- `cd thincoder-vscode && npm test`（快层全绿——含三新档登记后清单 +3）
- `npm run test:full`（slow 门用例：T-I6/T-I7/T-I10）
- 机判：`"file-changes"` 全仓 grep 零命中 · `--ignored=traditional` 在 `src/indexer.mjs` 命中且旧形态零残留 · `createFileSystemWatcher` 在 `src/extension/config-watch.mjs` 命中
- `cd thincoder-vscode && node scripts/check-doc-width.mjs`（新增违规 0——写文档才涉及）

## 八、交付报告格式（回报必含）

① 逐需求透明表（F6/F7/F8/F9/F-C1/F6-S 九条 → 文件:行 证据）；② 实测行数表（对照 §六 预计值——超档位须说明，任一文件越 500 硬帽停下报告）；③ 测试实测（命令 + 通过数 + 日志尾部）；④ 偏差披露（设计 vs 实现差异——零静默）；⑤ §5 写入自证。

## 九、边界与纪律

- **D5 冻结窗口**：本 §2 与三层档在评审在途期间零写入（改动集齐后统一入场）；实现中发现设计缺陷 → 停下报告（回设计者/父侧），不静默偏离。
- **D1 写权**：coder 写 `src/**` + `test/**`；三层文档 = eng-designer 写域（发现文档需改 → 回报，不自行改）。
- **双端纪律**：CLI 仓代码零改（单端缺陷——B1/B2 为 VSC 独有面，B6 对位 CLI 语义同源、文案自持）；跨仓引用按「名称（仓别）§N」形态（规范 = 本仓 `docs/README.md` §3.7）。
- 逐字文案（提示/状态/i18n）必须照抄设计档；测试断言优先行为断言（grep 仅作补充）。
- 凭证不落档：设计 token 值不入任何文档。

## 十、新档授权请求（§4 批准面——父侧先裁，勿先建）

本批需 **4 件新档**（三测档 + 一源档），机械理据如下；若父侧不批源档，**回退落点**已备（语义零损）：

1. `test/index-perception.test.mjs`——test 目录对 indexer/needsRebuild **零既有覆盖**（无归属可并）；
2. `test/config-watch.test.mjs`——watcher = 宿主生命周期面，既有 config 系测档均为读写语义面（不同域）；
3. `test/digest-visibility.test.mjs`——同族 `async-visibility.test.mjs` 已 388 行（+~120 逼近 500 硬帽；且需 happy-dom 与宿主两面混合——先例 = 第 18 批新档裁定「『档』以文档档为限」）；
4. `src/extension/config-watch.mjs`——watcher 生命周期属扩展宿主级（非面板级）；候选宿主 `chat-panel.mjs` 420 / `panel-messages.mjs` 468（贴线）、`settings.mjs` 350（业务面 = provider/key 管理，watcher 非其业务）——**回退案**：不批则并入 `src/extension/settings.mjs`（350 → ~405，语义等价，仅内聚度略降；测试改从 settings.mjs 导入）。

## 十一、需父侧排程的文档项（设计者写域之外——本轮未写，如实列出）

- `AGENT-LOOP（VSC 仓）§7`（挂起回合 digest——机制权威）：需补 **1 行指针**（digest 起跑可见指示 → 见 `WEBVIEW（VSC 仓）§7.4`）——本批设计者写域未含该档（spawn 声明面为 MEMORY/SETTINGS/WEBVIEW 三档），未写入；请父侧排程（或授权后补写）。
- 跨端观察（未核·登记）：CLI 侧向量检索（`memory.db`）是否有同族「模型/维度不校验」缺口——本批未核，登记后续勘察（见 MEMORY §4.7）。

**§六 计数更正（D3——本追加与上文冲突时以本追加为准）**：实施域 = **16 项 = 12 改 + 4 新**（上栏「15 项 = 9 改 + 4 新 + 2 登记」为计数笔误——枚举不变，即上列文件）：
改 12 = `src/indexer.mjs` · `src/index-discover.mjs` · `src/extension/panel-index.mjs` · `webview/settings-tools.js` · `locales/zh.json` · `locales/en.json` ·
`extension.mjs` · `src/extension/suspension.mjs` · `webview/chat.js` · `webview/base.css` · `test/vscode-mock/index.mjs` · `test/files.mjs`（登记 1 行）；
新 4 = `src/extension/config-watch.mjs` + 三测档（`test/index-perception.test.mjs` · `test/config-watch.test.mjs` · `test/digest-visibility.test.mjs`）。

**补充：逐字文案已落档**（自检补写——coder 照抄判据）：索引面 = 设计档 `MEMORY（VSC 仓）§4.2 契约四`（`settings.indexMismatch` 两语 + `maybePromptIndex` 提示句）；感知面 = 设计档 `WEBVIEW（VSC 仓）§7.4`（`digest.start` / `digest.done` / `digest.aborted` 两语表）。

**§2 格式归一注记（2026-09-11——设计者自查后修正，如实披露，全部零语义变化）**：

① 跨仓引用归一到本仓 `docs/README.md` §3.7 规范形态「名称（仓别）§N」（原「路径 + `.md` + §N」形态——V1 按本仓 basename 解析，同名 basename 存在「以错档通过」风险）；
② 三处 >300 字符单行按句读换行（人类可读判据——本仓宽度检查无表格行豁免，实跑命中 `:74/:86/:157` 三行）；
③ 需求档（`AGENT-LOOP` §5）内 `WEBVIEW（VSC 仓）§7.6` 为笔误 → 已改 **§7.4**（与设计档节号一致）。

**VSC 侧同步**：三设计档（MEMORY §4 / SETTINGS §2.6 / WEBVIEW §7.4）的 CLI 侧引用补「（CLI 侧）」注记（VSC 镜像面 V1 豁免形态——镜像差异表第 6/7 项）。

**手段与边界**：上述修正以 `edit` 在**本段（eng-designer 自写段）内**就地完成——未触碰 §1/§3–§6 他段任何一行；如与此后纪律（严格 append-only）冲突请父侧裁定。

**检查实跑（2026-09-11）**：VSC 仓 `check-doc-width` 全绿（新增违规 0——存量基线 34 条）；本仓新增 0（余留失败均为**他批存量**：`2026-09-11-COMMON-LAYER.md:150`（344 字符）· `2026-09-11-VSC-GUARD-COMPLETION.md:157`（802 字符）· 另有一处自指节号引用 V1（`PORTABILITY.md`）——均非本批文件，本批零触碰）。

**修正轮（设计评审轮次 1 后——2026-09-11；本追加与上文冲突时以本追加为准）**

**背景**：设计评审轮次 1 = changes-required（🔴2 · 🟡1 · 🔵4）；父侧裁定 7 条落修方向；本轮 = 修正轮（**只改文档、不碰实现**；需求档零碰）。落档面 = VSC 仓四档（MEMORY / SETTINGS / WEBVIEW / AGENT-LOOP）+ 本块；四档变更记录逐档一行已加。

**逐条落点（as-of 行号）**：

| # | 级别 | 落点（file:line / 节） |
|---|---|---|
| 1 | 🔴 | 被忽略文件「删」可达触发路径：`MEMORY（VSC 仓）§4.2 契约五` 补「忽略文件删除存在性扫描」（:232-238——`git check-ignore --stdin -z` 圈定 ignored∩manifest 候选 + 存在性检查 → `file-removed`；依据 = 被忽略文件删除后 `!!`/status 双无踪迹、模式匹配不依赖路径存在性）；`§4.3 D-I7`（:268——否决：全 manifest 逐条扫描 / ls-files 未跟踪减法 / 不做）；`§4.5` T-I6 删路径注记（:296）+ T-I10 删场景两路同向明示（:300）；`§4.7 登记边界三`（:320-322——未跟踪且未忽略删除面：预存在、B2 窄化范围外，如实登记） |
| 2 | 🔴 | 基线回填（父侧裁定 ①）：`SETTINGS（VSC 仓）§2.6` 契约改 `{ dispose, noteSelfWrite }` + `onConfigSelfWrite` 接口/时机（:67-80——saveRaw 写成功后同步回调、startConfigWatch 内部订阅、config-io 写盘唯一通道）；D-S2 注记（:91）；装配注（:82-84）；T-S3 改真实自写序列 + T-S3b（:106-107）；AC-S2（:115）；受影响文件 +`src/config-io.mjs`（:94-96） |
| 3 | 🟡 | `AGENT-LOOP（VSC 仓）§7` 补 1 行指针（:301-302 → `WEBVIEW（VSC 仓）§7.4`）；上栏 §十一 的排程请求已履行（本轮已授权该档入写域） |
| 4 | 🔵 | AC 标签：`MEMORY（VSC 仓）§4.6` AC-I5 →（N5/**N6**）（:310）；`WEBVIEW（VSC 仓）§7.4` AC-D1 →（F-C1 / **NFR-C1**）（:468）；NFR-C1 锚点现场复核见下 |
| 5 | 🔵 | locales 合并口径见下 |
| 6 | 🔵 | 收集域口径：`MEMORY（VSC 仓）§4.5` T-I9（:299）+ `§4.2 契约八`（:252-256）+ AC-I4（:309）——收集域 = `needsRebuild` 返回值；`indexCompat.reason` 属独立命名空间（不在七词表约束内） |
| 7 | 🔵 | `MEMORY（VSC 仓）§4.1-B2` 代价实测补注（:163-167）——git 侧输出规模界 + 实测 + 局限，见下 |

**N5 复核（需求档零碰——结论 = 无需改动；等义收紧情形）**：`MULTI-INSTANCE-COLLAB（CLI 侧）§2.3` N5（`docs/requirements/MULTI-INSTANCE-COLLAB.md:60`）在基线回填机制下两判据均成立——「元组未变故零推送」= T-S3b 保持；「扩展自写不抖动面板」由机制不可达变为可达（语义未动，措辞零改）。

**NFR-C1 锚点现场复核（评审 #4 附带项——逐条 as-of 命中）**：`docs/requirements/AGENT-LOOP.md:121` = NFR-C1 行；同批复核 `docs/requirements/MEMORY.md:55`（F7 行）· `:64`（N6 行）· `:69`（F7 判定句）· `docs/requirements/MULTI-INSTANCE-COLLAB.md:60`（N5 行）——全部命中，无需修正。跨仓引用形态 = 规范「名称（仓别）§N」（`docs/README.md` §3.7）。

**locales 合并口径（评审 #5）**：两档最终预计值 = 243 → **~247**（本批合并 +4 键：`settings.indexMismatch` ×1 + `digest.*` ×3）；分面表（`MEMORY（VSC 仓）§4.4` / `WEBVIEW（VSC 仓）§7.4` 的 ~245 / ~246）为分面单列——实施报告「实测对照 §六 预计值」以本行为唯一合并基准。

**git 侧代价实测摘要（评审 #7——详版在 `MEMORY（VSC 仓）§4.1-B2` 补注；本机 = Windows / git 2.55.0.windows.3，单机单版本、读数有波动）**：

① `--ignored=traditional` 不下钻被忽略目录（2k / 20k 文件合成子树均单条 `!! <dir>/`；本仓 19 条）——输出规模界 = 顶层忽略条目数；
② 本仓 plain 56–115ms → ignored 311–559ms（**+~0.25–0.45s/次**；合成未复现该增量——规模律未闭合，如实留白）；
③ 删除扫描新增 `git check-ignore`（本仓 341 路径 71ms）+ 候选子集逐条 stat（2k 文件 65ms）；
④ 对照「弃全量扫描」= 非 git 树 48,489 文件 walk 672ms + stat 3,191ms——选定案低一档但非免费。

**计数更正（D3）**：实施域再更 = 13 改 + 4 新（+`src/config-io.mjs`——B5 自写基线回填面；总数 17 项）；行数修订：`src/indexer.mjs` 326 → ~395 · `src/extension/config-watch.mjs` 新 → ~65 · `test/config-watch.test.mjs` 新 → ~110；其余同 §六。

**检查实跑（2026-09-11 修正轮）**：VSC 仓 `check-doc-width` 全绿（宽度 67 文件 OK；一致性 V1/V2/V3 新增 0——存量基线 34 条）；四档改点已逐处回读核实（D6）。

## §3 设计评审（评审子代理自写）

_（待写——评审子代理）_

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements coverage / Feasibility（B2 删除面） | 🔴 | B2「删」情形无机制：契约五只对**目录条目**给出「该根下 manifest 中已消失的条目 → `file-removed`」（thincoder-vscode/docs/design/MEMORY.md:221-223）；按**文件模式**被忽略的文件（T-I6 的 `notes.md`）删除后已无现存路径——`!!` 只列举现存被忽略路径（契约五自身建模前提），随后既无目录条目可走查、也无文件条目可判四态 ⇒ 删除无任何触发路径。但 T-I6（:279「删 → `file-removed`」）、AC-I2（:289）、需求 F7（thincoder/docs/requirements/MEMORY.md:55、:69「增/删/改」）均断言必须检出；§2 B2 要点（:68/:77）亦未给出该路径。 | 请设计者给出删除情形的确切触发路径（例：对 manifest 条目按与 `canWalkRoot` 同源的位置做存在性扫描，或其它可达机制），并据以核对 T-I6 与 T-I10「两路同向」在删除场景的一致性；若确不可检出 → 同步修正 T-I6/AC-I2 与需求 F7 的「删」断言（需求侧变更须用户确认）。本判断可实测证伪。 |
| 2 | Feasibility / Acceptance（B5 自写抑制） | 🔴 | 「stat 元组抑制」无法区分自写与外部写：任何真实写盘（含扩展自写）都改变 mtimeMs ⇒ 必走「异」分支触发 `onChange`（thincoder-vscode/docs/design/SETTINGS.md:72-73）；模块接口（:67 `startConfigWatch({ onChange, debounceMs, configPath })`）没有任何供写盘路径刷新基线的入口、「上次推送值」的更新者/时机未定义 ⇒ D-S2（:85）与 N5（thincoder/docs/requirements/MULTI-INSTANCE-COLLAB.md:60）承诺的「扩展自写不抖动面板」在机制上不可达；T-S3（:99）只测「事件但元组未变」退化形，掩盖真实自写序列（写→事件→元组已变）。 | 二选一：① 定义基线回填（自写成功后刷新 watcher 基准——在契约中显式给出接口与时机）；② 若确认 `_pushSettingsLight` 对未变快照天然无可见抖动，则删去「自写不抖动」的机制归因、并把 T-S3 改为真实自写序列断言。两者均需同步 N5 度量口径（需求侧同源措辞 thincoder/docs/requirements/MULTI-INSTANCE-COLLAB.md:60）。 |
| 3 | Scope coordination | 🟡 | 协调项（非缺陷）：`AGENT-LOOP（VSC 仓）§7` 需补 1 行指针（digest 起跑指示 → `WEBVIEW（VSC 仓）§7.4`），因 spawn 写域未含该档而未写——§2 §十一（:158）已如实列出并请父侧排程。 | 父侧在批准/收口前排程该指针补写（或显式豁免），避免挂起 digest 机制权威处悬空。 |
| 4 | Acceptance criteria（回指链） | 🔵 | 需求 N6（thincoder/docs/requirements/MEMORY.md:64）与 NFR-C1（thincoder/docs/requirements/AGENT-LOOP.md:121）未被设计 AC 显式标注：实质覆盖于 T-I6/T-I7/T-I10 slow 归册与 T-D1「post 早于 runTurn」断言；§2 覆盖表将 N6 并入 AC-I5、将 NFR-C1 并入 AC-D3（而 AC-D3 标注的是 NFR-C2）。 | 在设计档 AC 行补 N6 / NFR-C1 标签（或修正 §2 覆盖表映射），使「设计 AC 回指」逐条无歧义。 |
| 5 | Clarity（行数口径） | 🔵 | locales 行数两处同基线各自估：`settings.indexMismatch`（MEMORY（VSC 仓）§4.4：243 → ~245）与 `digest.*` 三键（WEBVIEW（VSC 仓）§7.4：243 → ~246）——合并后（约 +4 键）无统一目标值，§2 §六对 digest 键未给目标。 | 补一句合并口径（两档 locales 的最终预计值），供实施报告「实测对照 §六 预计值」时唯一基准。 |
| 6 | Acceptance criteria（测试域歧义） | 🔵 | T-I9「全路径 grep + 各分支 reason 收集；reason ∈ 七词表」（MEMORY（VSC 仓）§4.5 :282）与契约一新增的 `indexCompat.reason:"model-changed"`（:182）存在收集域歧义：若收集域未显式限定 `needsRebuild` 分支，新值将 ∉ 七词表 → 自指红灯。 | 在 T-I9/AC-I4 写明收集域 = `needsRebuild` 分支（或注明 `indexCompat.reason` 属独立命名空间，不在词表约束内）。 |
| 7 | Feasibility（代价证据） | 🔵 | B2 代价实测仅覆盖「本仓 19 条 `!!`、同量级」（§2 :95）；对「大仓 + 大型未被 SKIP_DIRS 豁免的忽略子树」未实测，且未注明 `--ignored=traditional` 对忽略目录是否下钻——git 侧输出规模的最坏界未给（走查侧界已给：MEMORY（VSC 仓）§4.1-B2 :156）。 | 在 §4.1-B2 代价列补 git 侧最坏情形口径或一次实测（亦可注明本机实测局限），使「弃全量扫描」的成本对比两侧证据对等。 |

计数：🔴 2 ｜ 🟡 1 ｜ 🔵 4
VERDICT: changes-required

### 轮次 2（评审子代理）

轮次 2（单轮校验——7 条处置逐一核验）：**7/7 落档**（#1 契约五 :232-238 · D-I7 :268 · T-I6 :296 · T-I10 :300 · 边界三 :320-322；#2 §2.6 :67-84 · D-S2 :91 · 受影响文件 :94-96 · T-S3/T-S3b :106-107 · AC-S2 :115；#3 指针 :301-302 → §7.4；#4 :310 · :468 · NFR-C1 锚 requirements/AGENT-LOOP.md:121；#5 合并口径批次档 :200；#6 :299 · :252-256 · :309；#7 补注 :163-167）。残遗 3 条（🔴0 · 🟡1 · 🔵2）：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance criteria（回指链——#4 残遗） | 🟡 | 轮次 1 #4 处置只落了设计侧标签（`thincoder-vscode/docs/design/WEBVIEW.md:468` AC-D1 →（F-C1 / NFR-C1））；批次档 §2「四、覆盖需求」表 `thincoder/docs/batches/2026-09-11-VSC-INDEX-PERCEPTION.md:107` 仍映射 `NFR-C1/C2 → AC-D3`——而 AC-D3 现仅标 NFR-C2（`WEBVIEW.md:470`，已核）；:97 表头「三方一致」对 NFR-C1 不成立（设计 > 记录——记录侧滞后）。 | 父侧 doc 层同步该行（NFR-C1 → AC-D1、NFR-C2 → AC-D3）或加一行注记指向修正块 #4；评审只读，未改。 |
| 2 | Affected-file size annotations（数值残遗） | 🔵 | `thincoder-vscode/docs/design/SETTINGS.md:94`（`src/extension/config-watch.mjs` 新 → ~65——含基线/自写订阅面）与 `:98` 档位注记（新档 ~55 行）不一致；批次档 :209 亦记 ~65——修正轮修订后 :98 未同步。 | 将 :98 同步为 ~65（或注明 ~55 为修订前基线）。 |
| 3 | Methodology compliance（变更记录核验——未证实项） | 🔵 | 批次档 :182「四档变更记录逐档一行已加」：`MEMORY（VSC 仓）:27` · `SETTINGS（VSC 仓）:128` · `WEBVIEW（VSC 仓）:569` 三档命中；`thincoder-vscode/docs/design/AGENT-LOOP.md` 全文 grep「修正轮」无变更记录形态命中（仅正文 :189/:355 机制词）——该项**未经证实**（措辞可能不同；非定论）。 | 父侧顺手核对 AGENT-LOOP（VSC 仓）变更记录有无本批（第 21 批 / B6 指针）行——有则忽略本条，无则补一行。 |

计数：🔴 0 ｜ 🟡 1 ｜ 🔵 2
VERDICT: pass

## §4 用户批准（主 agent 记）

**2026-09-11 19:30 父侧代签**——用户 12:48 授权（13:38 延展至排空）；三条件齐备：轮次 1 changes-required（🔴2 · 🟡1 · 🔵4）→ 修正轮 7/7 落地（含两处 🔴：B2 删除面排查机制补出 + B5 基线回填契约）→ 父侧实文核验 + **轮次 2 = pass**（7/7 核销 · 🟡1 🔵2 非阻断残遗——§3 轮次 2）→ **token 已签发**（值不落档）。

**批准范围**：实施域以设计三档受影响表为准（约 13 改 + 4 新 = 17 档；含新档 `src/extension/config-watch.mjs` ~65 / `test/config-watch.test.mjs` ~110；`indexer.mjs` → ~395）。

**遗留（批准时登记）**：① 🟡 批次档 §2 覆盖表 :107（NFR-C1 → AC-D1）待同步；② 🔵 SETTINGS :98 行数 ~55 → ~65；③ 🔵 AGENT-LOOP（VSC 仓）变更记录行核对；④ 两处排程面（§一 · 第 12/18 批排程面收口）· commit 待父侧。

## §5 实施记录（eng-coder 自写）

_（待写——eng-coder）_

_（待写——eng-coder）_

**状态：实施完成 · 交付收敛**（2026-09-11）。内部审计 1 轮（DEVIATIONS：🟡1 + 🔵1，均当场自修）· 内部 advisor 代码评审 1 轮（**VERDICT: pass**，🟡1 + 🔵4——2 条以代码/测试修复，3 条报告面）。
实施域 = 17 档（13 改 + 4 新——与 §六 修正块计数一致）。红线零破：`docs/**`（设计者写域）零碰 · CLI 仓零改 · `webview/**` 仅 chat.js/base.css/settings-tools.js（设计档 §7.4 受影响表 + §4.4 明列）· 他批在途档零碰。

### 一、逐条目透明表（B1–B6 → 落点证据 → 验收）

| 条目 | 落点（as-of 实测行号） | 验收结果 |
|---|---|---|
| **B1** 模型/维度校验 + 不产出 + 双可见面 | `src/indexer.mjs:132`（loadIndex 头一致性）· `:147-156`（indexCompat）· `:342`（searcIndex 名称闸，embed 前）· `:349`（query 维度闸）· `src/extension/panel-index.mjs:29`（mismatch 载荷）· `:114-115`（提示条件 needed ∨ !compat）· `:120`（逐字提示句）· `webview/settings-tools.js:312-317`（状态行不匹配态）· `locales/{zh,en}.json:166` | T-I1~T-I5 + T-I4b 全绿（full）；消费方零改动（code.mjs/memory-tool.mjs 空数组回退链） |
| **B2** ignored 集并入 + 删除存在性扫描 | `src/indexer.mjs:181`（同一子进程 `--ignored=traditional`）· `:192-194`（`!!` 入 ignored 集、不进 dirty）· `:214-216`（调用点）· `:253-262`（canWalkRoot）· `:283-296`（目录走查 + 根下消失条目）· `:298-301`（文件条目）· `:312-325`（`git check-ignore --stdin -z` + 存在性 → file-removed；失败降级跳过）· `src/index-discover.mjs:48-52`（discoverFilesUnder） | T-I6 / **T-I6b** / T-I7 / T-I10 全绿（slow 层）；memory 特判保留（`:218-227`） |
| **B3** 嵌套 memory 自检对齐 | `src/index-discover.mjs:17`（单一 walk collectFiles——发现面/自检面/走查面同源）· `:85-87`（listMemoryFiles = discoverFilesUnder） | T-I8 全绿（快层）+ T-I8b（slow：git 快路径连调两次 needed:false） |
| **B4** reason 词表统一 | `src/indexer.mjs:239`（原 `:207` 位——`file-changed`） | T-I9 全绿 + `src/**` 旧串零残留（实测 0 命中） |
| **B5** 外部写盘感知 | `src/extension/config-watch.mjs:35-78`（新档：注册/去抖/元组判/基线回填/退订随 dispose/降级）· `src/config-io.mjs:52-56`（onConfigSelfWrite）+ `:112-114`（saveRaw 写成功同步回调）· `extension.mjs:10/:44`（装配）· `test/vscode-mock/index.mjs:21/:128`（createFileSystemWatcher + RelativePattern） | T-S1~T-S6 + T-S3b 全绿 |
| **B6** digest 起跑可见指示 | `src/extension/suspension.mjs:270`（start **早于** runTurn）· `:271-279`（ok 旗标 + try/finally 保 end 必发）· `webview/chat.js:245` + `:321-346`（#digest-status 单元素三态）· `webview/base.css:180-205`（与 .compress-status 共享规则）· `locales/{zh,en}.json:66-68`（三键两语逐字） | T-D1~T-D5 + T-D4a 全绿 |

### 二、实测行数表（对照 §六 预计值；as-of 2026-09-11）

| 档 | 现 → 预计 | 实测 | 说明 |
|---|---|---|---|
| `src/indexer.mjs` | 326 → ~395 | **445** | 超预计 +50（契约五四辅助函数 + 契约锚注释；已按设计估计做一轮注释压缩 455→445）；未越 500 硬限 |
| `src/index-discover.mjs` | 74 → ~92 | 88 | 在预计内 |
| `src/extension/panel-index.mjs` | 164 → ~196 | 178 | 在预计内 |
| `webview/settings-tools.js` | 367 → ~382 | 374 | 在预计内（存量超线档——设计已裁定不拆分） |
| `locales/zh.json` / `en.json` | 243 → ~247（合并口径） | 247 / 247 | 与合并口径一致（+4 键） |
| `src/extension/config-watch.mjs` | 新 → ~65 | 78 | 超预计 +13（注释/降级面）；未越 500 |
| `extension.mjs` | 83 → ~92 | 92 | 在预计内 |
| `src/config-io.mjs` | 455 → ~465 | 471 | 略超 +6 |
| `src/extension/suspension.mjs` | 346 → ~360 | 359 | 在预计内 |
| `webview/chat.js` | 319 → ~342 | 355 | 超预计 +13（showDigestStatus 实现 + 注释）；未越 500 |
| `webview/base.css` | 432 → ~446 | 435 | 用共享选择器（.compress-status, .digest-status）——比预计省 ~11 行且零观感漂移 |
| `test/vscode-mock/index.mjs` | 141 → ~162 | 167 | 三枚补件（见偏差 ④） |
| `test/files.mjs` | 55 → 58 | 59 | +3 新档登记（另含他批未提交 2 行——非本批） |
| `test/index-perception.test.mjs` | 新 → ~170 | 343 | 超预计（用例 +13：含 T-I4b/T-I6b/T-I8b 三个补强例）；未越 500 |
| `test/config-watch.test.mjs` | 新 → ~110 | 157 | 超预计（T-S3b 补强例 + 断言文案） |
| `test/digest-visibility.test.mjs` | 新 → ~120 | 147 | 在预计附近（+T-D4a） |

### 三、实跑记录（先落盘再查）

- `cd thincoder-vscode && npm test`：448 tests / **441 pass / 0 fail** / 7 skipped（slow 归册）；slow 门零拦截（退出码 0）。
- `npm run test:full`：448 tests / **448 pass / 0 fail**（连跑 3 遍全绿——含全部 slow 例）。
- 定向：`THINCODER_TEST_FULL=1 node --test test/index-perception.test.mjs` = 13/13 全绿；`node --test test/{config-watch,digest-visibility}.test.mjs` = 13/13 全绿。
- 机械判据（§七）：`"file-changes"` 在 `src/**` 递归扫描 **0 命中**（旧串仅存于 docs 叙述句——见下偏差 ⑥）；`--ignored=traditional` 在 `src/indexer.mjs` 命中且无 flag 旧形态零残留；`createFileSystemWatcher` 在 `src/extension/config-watch.mjs` 命中。
- 项目检查：`node scripts/check-syntax.mjs` = 245 JS 档 OK；`node scripts/check-doc-width.mjs` = 宽度全绿 + 一致性新增违规 0（存量基线 34）。

### 四、偏差披露（零静默）

① **T-I5 / T-I8 分层调整（设计 ✓ → slow）**：实测 git 子进程在并行快层（`--test-concurrency=6`）下 T-I5 1287ms / T-I8 1149ms——越 800ms 拦截线（slow 门=硬红）。
按项目 slow.mjs 铁律（>500ms 且用真实 git 子进程）归册：T-I5 → `slow(...)`；
T-I8 拆为 **T-I8 快层**（自检面 == 发现面，纯 fs）+ **T-I8b slow**（git 快路径连调两次 needed:false）。
AC-I1/AC-I3 字面跑法（快层 T-I5）需设计档同步——**属设计者/父侧文档域**。
② **T-I9 收集面手法**：五次 needsRebuild 连调实测 ≈765ms（逼近拦截线）——改为**静态全量收集**（解析 needsRebuild 函数体全部 reason 字面量——覆盖七个词，含 fixture 不可达的 new-commits/file-missing）+ **运行抽检 no-index**；其余四词运行态由 T-I5/T-I6/T-I7/T-I8b/T-I10 覆盖。
③ **行数超预计**（见第二节）：`indexer.mjs`/`config-watch.mjs`/`chat.js`/三测档超设计预计值；均未越 500 硬限。
④ **mock 第三枚补件**：`test/vscode-mock/index.mjs` 除设计两枚（createFileSystemWatcher / RelativePattern）外，另补 `withProgress` 的 token `onCancellationRequested`——T-I5 的 Build 分支经 buildIndex 调它，缺则 TypeError（设计只列两枚，此处如实登记）。
⑤ **新增补强例三个**：T-I4b（状态行渲染——happy-dom 驱真 settings-tools.js）、T-I6b（ignored **目录条目**分支：目录内改 + 整棵子树删除）、T-I8b（见 ①）——均为设计用例表外的补强，语义与设计不冲突。
⑥ **AC-I4「全仓 grep」域收窄**：`file-changes` 在 `docs/**`（设计档 M4 §4.2/§4.5/§4.6 词表说明 + `docs/TODO.md`）仍存历史引用——实现与测试的收集域收窄为 `src/**`（测试内旧串以 `"file-" + "changes"` 拼接构造，防自命中）；代码面零残留成立。文档口径建议由设计者/父侧收口。
⑦ **test/files.mjs 的 diff 另含他批未提交 2 行**（advisor-guard-completion / advisor-context-budget）——非本批写面。
⑧ **webview 面**：实施按设计档受影响表动了 `webview/chat.js`/`base.css`/`settings-tools.js`（任务书括注「webview 两文件零改」与设计档 `WEBVIEW.md:449-451` 字面冲突——按 R7b 设计 > 记录执行；其余 webview 档零改）。

### 五、审计与代码评审（轮次与终态）

**(1) 内部审计（explore 只读——实施后）**：DEVIATIONS（🟡1 + 🔵1，无 🔴）→ **fix round 1**：
- 🟡 提示面合取分支（`needed ∧ 不匹配` 时不出两模型名、且出「not built」假陈述）→ 已修（`panel-index.mjs:114-120`；T-I5 加合取分支断言「不出 not built」）。
- 🔵 测试档头注释分层漂移（T-I5/T-I8b 未列入 slow 名单）→ 已修（档头逐字更新）。

**(2) 内部 advisor 代码评审 1 轮（VERDICT: pass）** 裁决表：

| # | Action | Detail |
|---|---|---|
| 1 | Deferred | 文件规模警示（新测档 343 行 > 300；`indexer.mjs` 445 > 300）——均 < 500 硬限；`indexer.mjs` 为存量超线档（设计档明裁本批不拆分）；测档拆分属设计域（档结构由设计者裁定），本批不夹带结构变更。已入交付报告「实测行数表」。 |
| 2 | Deferred | AC-I4「全仓 grep」字面 vs docs 历史引用——文档域修正权在设计者/父侧（coder 零碰 docs）；代码面已零残留（`src/**` 递归 0 命中，实测）。见偏差 ⑥。 |
| 3 | Fixed | B2 目录条目/目录模式覆盖缺口 + 目录模式行为未实测 → 新增 **T-I6b**（slow）：ignored **目录**内改 → `file-changed`（目录走查分支）、整棵子树删除 → `file-removed`——实测**绿**（同时实证了设计「整棵子树删除由存在性扫描兜底」的目录模式可达性；此前 unverified）。 |
| 4 | Fixed | T-I5 轮询窗 2s（fire-and-forget 残留风险）→ 窗口放宽至 250×20ms（5s）。 |
| 5 | Not an issue | 任务书括注 vs 设计档受影响表冲突（webview 文件面）——按 R7b「设计 > 记录」执行（`WEBVIEW.md:449-451` 明列 chat.js/base.css）；其余 `webview/**` 零改。若括注实意为「其余 webview 档零改」则零冲突，建议父侧一句澄清。 |

**终态：clean**（审计 1 轮 + 代码评审 1 轮，全部发现已裁决；零 🔴 残遗；🟡 两条为报告/文档面，已列入交付报告）。

### 六、§5 写入自证

本段经 `batch_segment(segment="5")` 由 eng-coder 本人写入（一段一作者）；未触碰 §1/§2/§3/§4/§6 任何一行；无任何 token/designId 值落档（凭证不落文档）。

## §6 验证与收口（父代理自写）

**2026-09-11 23:15 父侧收口**（用户授权窗口 12:48→排空）。

### 父侧验证

- 定向 **13/13 + 13/13** · 全量 `test:full` **448/448**（三连绿）· 快层 441/441/0（skip 7）· **任一档未越 500 硬限（最大 471）✓**；
- **父侧抽核**：`config-watch.mjs` 新档 ✓ · `indexCompat` 导出 ✓ · `file-changed` 单点 + `src/**` 旧串零残留 ✓ · 三测档登记 ✓；
- 内部：审计 1 轮（自修 2）+ 代码评审 pass（🟡1🔵4——2 修 3 报告）+ fix 2 次（含 T-I6b 子树删实测补强）。

### 逐条验收结论

- **B1–B6 全过**（六面：校验不产出双可见 / ignored 重建（同子进程 + 删面同源兜底）/ 递归自检一致 / reason 单点 / watcher 基线回填 / digest 起跑可见）；**Simplified 零 · Not done 零**；
- 偏差 9 条如实（含 T-I5/T-I8 slow 归册、AC-I4 域收窄、webview 按设计 > 记录执行并披露）；未越硬限。

### 核销同步清单

- 角色表：无 ✓ · 状态行：§5 converged ✓ · 计数：行数表对 §六 ✓ · 指针：需求 ↔ 设计 ↔ 用例 ✓ · 待办：三项文档项（下方遗留 1）登记 ✓

### 遗留项

1. **三文档项（设计者/父侧）**：① `MEMORY.md` §4.5 T-I5/T-I8 分层标记 + §4.6 AC-I1 跑法（快层→slow）；② AC-I4「全仓 grep」口径改 `src/**`；③ 行数估值刷新（indexer 445 / config-watch 78 / chat 355 / 三测档）；
2. 批次档 §3 :234 超宽行（评审段属主）；`test/files.mjs` 含他批未提交 2 行（非本批）；
3. **设计 token 已消费（链终）**；commit 待父侧随批提交。
