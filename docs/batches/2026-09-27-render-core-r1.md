# 2026-09-27 · render-core R1（核包 + 双端加载管道）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-27 · 来源 = 设计批 `docs/batches/2026-09-27-desktop-ui-alignment.md`（§4 已批准 · 2026-09-27）——R1（核包新建 + 双端加载管道）；任务面 = `docs/render-core/design/RENDER-CORE.md` §8。
> 台账 = #466–#468（归批 · 在途）。前情 = 设计批 `docs/batches/2026-09-27-desktop-ui-alignment.md`（§4 已批准 · 2026-09-27——R1–R3c 分批；本批 = **R1**）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）

### 1.1 本批口径（父侧 · 2026-09-27 21:5x ✓）

- **来源** ✓：设计批 `docs/batches/2026-09-27-desktop-ui-alignment.md` §4 已批准（2026-09-27 代签）；本批 = **R1**（核包新建 + 双端加载管道）——任务面 = `docs/render-core/design/RENDER-CORE.md` §8 R1 行（判据 C1–C6 + VSC 全绿）。
- **接入形裁定**（父侧——设计 §6「接入形随 R1」授权）：VSC 侧六档 = **再导出 shim**（零逻辑 · 单源；不逐档改 32 个消费档——后续可机械收窄项）；`highlight.js` 消费面复核后可删（实施舱逐档报告处置）。
- **派发拆分**（一舱一文件面 · 依赖链）：**R1a** 核包（`thincoder-render-core/**`）→ **R1b** VSC 管道（`thincoder-vscode/**`）∥ **R1c** 桌面管道（`thincoder-desktop/**`）——b/c 均 dependsOn a，b ∥ c 文件面不交叠。
- **开工前置** ✓：退役批文件面核对——#108 已收口（`9ccc372c`；其面 = 核 / CLI / VSC src，与 R1 零交叠）⇒ 无冲突。
- **探针两件**（设计 §10 E）：探针① = VSC dev junction 取核（R1b）· 探针② = 桌面 `/rc/` 双根 + 逃逸负探针（R1c）——任一失败 ⇒ 停报（回设计改加载形）。
- **边界**：核不持宿主句柄四律 · CLI 零触碰 · `renderer/**`（R3 面）零触碰 · 提示词 / 需求档零触碰。

### 1.2 事实修（舱 a 上抛 · 父侧裁决 ✓）

- **前提修**：舱 a 简报「六档内部交叉引用仅一处」不成立——实读第二条边：`thincoder-vscode/webview/diff.js:6` `import { escHtml } from "./ui.js"`（`ui.js` = 判定表「拆」档 · 端面 ⇒ 核包内不可达）。
- **父侧核验** ✓：`ui.js:419-421` `escHtml` 与 `md.js:151-153` `esc` **函数体逐字同构**（同四替换同序）；`esc` = md.js 导出（六档内）。
- **裁决**：准「`diff.mjs` 引用行重指 `./md.mjs` 的 `esc as escHtml`」——函数体零改 · 99 行保持 · 输出逐字不变；**逐字性例外 = 唯一一条**（迁移注 + 一次性逐字对比证据随 §5 披露）。
- **设计面随动**：`RENDER-CORE.md` §6 `diff.mjs` 行「逐字搬迁」注 ⇒ R1 结算时补实施注（父侧直接执行〔例外②③〕 · 机械事实收正）。

### 1.3 核包不发布（用户裁定 · 2026-09-27 22:00 ✓）

- **用户原话**：「render-core 包需要发布到 npm 吗？我不希望发布」⇒ **不发布**（`private: true` · 无 `publishConfig`）。
- **依据**（父侧实读）：无 registry 端消费者——CLI 依赖表仅 `@thincoder/core`（`thincoder-cli/package.json:22-24`）；VSC / 桌面均**内嵌带发**（vsix 反排除内嵌 · 桌面 `electron-builder` 打包生产依赖）⇒ 两端装机零 registry 解析。`private: true` 先例 = `thincoder-desktop/package.json:4`。
- **依赖形收正**：两端依赖 = `"@thincoder/render-core": "file:../thincoder-render-core"`（本地链接；**不得用 registry 版本段**——未发布即 E404）；打包窗物化 = `npm install --install-links`（照核先例同窗）。
- **待收正（R1 结算随微轮）**：`RENDER-CORE.md` §1.3 发行面句 + KD-RC-1「发布纪律」项（⇒ 链接 / 物化 / 断言三纪律 + **永不发布**）；`docs/RELEASE.md`（不入发布序列 + 两打包窗前置换核物化）。
- **在飞处置**：舱 a（#2）已追加裁定（续跑）；排队舱 b / c **撤回重派**（依赖形收正后）。

### 1.4 待办清单（父侧 · 结算随收）

- **随 R2 落**（一行级）：`thincoder-render-core/package.json` 去 `prepublishOnly`（private 包无发布步——残留零用）。
- **设计面收正微轮**（R1 结算时一次落）：`RENDER-CORE.md` §6 `diff.mjs` 行补实施例外注（`diff.mjs:6` 重指 + 对拍证据）· §1.3 发行面句 + KD-RC-1 发布纪律 ⇒「链接 / 物化 / 断言三纪律 + **永不发布**」· §5 `formatToolSummary` 签名按实读收正。
- **父侧笔**：`docs/RELEASE.md` 收正（render-core 不入发布序列 + 两打包窗前置换核物化）。
- **R1a 核验读数**（父侧亲跑 · 2026-09-27 22:0x）：核包 **54/54** · 逐字性机械复核 = **恰 3 行差异**（`md:17` / `diff:6`〔批准例外〕/ `tool-summary:29`——其余三档字节全同）✓。

### 1.5 事故与发现（核 registry 陈旧 · 2026-09-27 22:2x ✓）

- **事件**：用户真机桌面 App 启动崩溃（弹窗 `ERR_MODULE_NOT_FOUND: …@thincod…\think-off.mjs` @ `src/main/settings.mjs`）。
- **根因（父侧实测闭环）**：① registry `@thincoder/core@0.9.5`（latest）= **旧快照**——`npm pack` 实列包面**无 `think-off.mjs`**（源树有，09-25 新增）；② 舱 c（#6）`npm install` 按 `^0.9.5` 从 registry 解析 ⇒ desktop 的 `@thincoder/core` junction 被换成旧快照 ⇒ 启即崩；VSC 打包同报（`thincoder-vscode/.thincoder/tmp/rc-r1b-package.log`）。
- **处置**：两舱发硬约束——任何 npm install 后恢复 **junction 到源树**；打包物化**源自源树**、不得依赖 registry 解析；收尾附最小启动验证读数。现状 = 两端 junction 在位（父侧亲测 `RESOLVE OK` + 文件在盘）。
- **登记**：台账 tech_todo（触发 = 条件——凡触碰两端依赖形 / 打包物化 / 发布窗）；`RENDER-CORE.md` §1.3 物化句随结算微轮补注（registry 可能落后源树 · 物化取自源树；dev 硬形 = junction——npm install 会覆盖，须恢复）。
- **设计面含义（记）**：设计 §1.3「发布前物化」原假设 registry = 源树同步；实况 = 发布窗外 registry 落后 ⇒ 物化纪律须以「源自源树」为准（发布窗内两者一致，无冲突）。

### 1.6 R1c 核验 + 随动账（父侧 · 2026-09-27 22:3x ✓）

- **父侧亲跑**：desktop 套件 **171/171 · fail 0**；**smoke 亲跑** = `{"served":39,"blocked":5,"ok":true}`——探针表逐项符合期望（`rcMd` 200 `text/javascript` · `escapePct` / `rcEscape` / `escapeSrc` 404 + stderr 双拒绝行 ✓）；C4–C6 读数在案。
- **随动账（设计面收正微轮补单）**：`docs/desktop/design/PROJECT.md:107`（window.mjs 记 130 ⇒ 实 **136**）· `:108`（protocol.mjs 记 68 ⇒ 实 **88**）；`RENDER-CORE.md` §1.3 行锚（`protocol.mjs:13`/`:16-22`/`:39-41` · guard `:67` · check-dist `:12`）按终态复核。
- **备记（advisor 顾问项 · 非 must-fix**——结算时统一裁）：`--smoke` 无常驻用例 · check-dist 夹具无常驻回归 · guard 白名单可收紧至 URL 形 · 门①判据段界 · host 未校验 · `main.mjs` 阈值 5 可派生自探针表。
- **环境学会**（已归台账 #470）：恢复收敛序 = **先 `npm install` 再 `npm link`**（反序会把 lock 写成 packed 形）；`file:` + `--install-links` 的 `npm ls` `ELSPROBLEMS` = npm 11 固有（非本仓缺陷）。

### 1.7 探针①口径裁定（舱 b 上抛 · 父侧 · 2026-09-27 22:3x ✓）

- **裁**：探针①以任务书 ㈤ / §1.1 为**操作口径**（node 真 import 经核包相对路径 + 负向对照 + 传递可达 + 产物面证据 + fail-closed 退出码 = 达标）；设计 §10 E「真 webview」字面 = 理想证据，**不列 R1 硬判据**（本环境无 VS Code 自动化面——客观不可达，非交付缺口）。
- **边界登记**：真宿主运行时加载（webview 资源根 / CSP 实况）未证 ⇒ **R2 入口风险标注** + **首次真跑观察项**；若现网加载异常 ⇒ 回设计备选（物化 + `localResourceRoots` 显式扩面）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

**状态行**：✅ 实施完成 2026-09-27（R1a 核包 + R1b VSC 管道 + R1c 桌面管道——逐舱记录 5.1–5.6（R1b 续 5.7；R1b/R1c 两段同号 5.6，以舱名区分））

### 5.1 交付摘要（R1a = 核包文件面）

落点 `thincoder-render-core/`（新顶层包 · `@thincoder/render-core` · v0.1.0）：

| 件 | 内容 | 注 |
|---|---|---|
| `package.json`（41 行） | name/version/type/`exports {"./*":"./*"}`/files/`scripts.test` 照核先例；**零 dependencies / 零 devDependencies**；`"private": true` + 零 `publishConfig`（用户 2026-09-27 22:00「不发布」裁定）；files = `["*.mjs","flow/","cards/","subblocks/"]`（后三项 = R2 嵌套核件预置——评审轮 1 🟡#1） | 零发布态 |
| 六档 `*.mjs` | `md.mjs`(266) · `highlight.mjs`(198) · `diff.mjs`(99) · `lib.mjs`(99) · `tool-summary.mjs`(122) · `i18n.mjs`(33) | 逐字搬迁（读数见 5.2） |
| `test/run.mjs` | 镜像 `thincoder-core/test/run.mjs` 形 + **③ 包面自检**（零依赖 + 核内 import 面只含核内相对路径 + `node:`——评审轮 1 🟡#2） | 负探针已验 |
| `test/*.test.mjs`（6 档） | md / highlight / diff / lib / tool-summary / i18n 用例，共 **54 例** | 平 node 直测；只依赖 `node:` + 核内模块 |

### 5.2 逐字性与实跑读数

- **逐字性 diff 面**（逐行实读 · 全 817 行）：差异**恰 3 行**——`md.mjs:17` 与 `tool-summary.mjs:29`（扩展名 `.js`→`.mjs`）+ `diff.mjs:6`（引用行重指 `import { esc as escHtml } from "./md.mjs"` + 迁移注）；行数 266/198/99/99/122/33 与设计 §6 表逐档相等。
- **字节对账**（核侧 = `npm pack` 读数 3069/7765/873/4485/11169/6324；源档侧 = 审计/评审独立实读）：highlight / lib / i18n **字节全同**；md +1 · tool-summary +1（两条扩展名改各 +1 字节）；diff +107（重指行 + 迁移注）——与「恰 3 行」自洽，无第四处漂移。
- **旧⇄新同输入对拍**（一次性证据 · 裁决②）：六模块 **225 项 0 mismatch**（含 `& < > "` 特殊字符样本）；另 direct `escHtml`(`ui.js:419-421`) ⇄ `esc`(`md.mjs:151-153`) 5 项 0 mismatch。
- **`node --check`**：13 档（六模块 + run.mjs + 六用例档）全过（exit 0）。
- **`npm test`**：**54/54 全绿**（exit 0）。
- **门禁反证（负探针）**：临时副本注入 `dependencies` ⇒ 红（"declares dependencies"）；注入裸包 `import "lodash"` ⇒ 红（"non-core import"）；基线绿 ⇒ PROBE PASS（临时目录已清理）。
- **宿主面实核**：`state.js` / `--vscode-` / `ctx` / `acquireVsCodeApi` / `window.` / `document.` / `require(` / `invoke(` **代码面 0 命中**；唯一命中 = `i18n.mjs:4` 注释（描述宿主注入方式——非代码面）。
- **包面**：`npm pack --dry-run` = **7 件**（六模块 + package.json；test/ 不入包；`private: true` 不影响 pack/物化）。
- **越界面**：VSC / 桌面 / CLI 三树零触碰（审计 mtime + 内容双证）。

### 5.3 决策透明表

| # | 决策 / 变更 | 依据 | 状态 |
|---|---|---|---|
| 1 | `diff.mjs:6` 引用行重指（**逐字性唯一例外**）：`escHtml` 改由核内 `./md.mjs` 的 `esc`（`as` 别名——调用面零改） | 简报前提「内部交叉引用仅一处」被事实推翻（`diff.js:6`→`ui.js`，ui.js 不在六档内且属「拆」档）；父侧裁决「准」+ 要求同输入对拍证据 | ✅ 已批准 · 证据 = 5.2 对拍 |
| 2 | `package.json` 去 `publishConfig` + 加 `"private": true` | 用户 2026-09-27 22:00「不发布」（无 registry 消费端：CLI 依赖表不含它；VSC vsix / 桌面 dist 内嵌带发）；先例 `thincoder-desktop/package.json:4` | ✅ 用户裁定 |
| 3 | `files` 白名单预置 `flow/` `cards/` `subblocks/` | 评审轮 1 🟡#1（设计 §6 的 R2 核件居嵌套目录 · 物化面防静默缺件） | ✅ 已落 · R2 落档时核对实际档名 |
| 4 | `test/run.mjs` 增 ③ 包面自检（~14 行：零依赖 + import 面） | 评审轮 1 🟡#2（C1 机检面常驻化） | ✅ 已落 + 负探针验证 |
| 5 | `test/md.test.mjs` 档头锚声明收正 T-H1…T-H14（T-H15 由消费端保留） | 评审轮 1 🔵#5 | ✅ 已落 |
| 6 | 六档头注内旧 `.js` 名保留未改（仅 `diff.mjs:6` 带迁移注） | 逐字纪律 | 记录在案 · 后续批次可补来源注（评审 🔵#6） |

### 5.4 审计与代码评审轮次与终态

- **内部 explore 分歧审计（1 轮）· 终态 = 代码面 clean**：独立实读（六对逐行哈希全扫 / 宿主面全扫 / import 面 / 越界面 / 包面）——半实现 / 静默简化 / 文档漂移 / 越出文件面**四类零发现**；唯一报告面偏差 = 本节 §5 未写（已落，自解）；两条观察项收编（files 预置 → 5.3 #3；注释面旧档名 → 5.3 #6）。
- **内部 advisor 代码评审（轮 1 = pass · 0 🔴）**：独立坐实逐字性（字节级）/ 包面 / 用例正确性；3 🟡（非 must-fix：files 白名单 · C1 机检面常驻化 · 报告面）+ 4 🔵。
- **fix 轮（1 轮 · 3 处）**：评审轮 1 🟡#1 / 🟡#2 / 🔵#5 → 5.3 #3 / #4 / #5；复跑读数 = 5.2（54/54 保持 · 包 7 件不减）。
- **修复复验（轮 2 = pass · 0 🔴）**：三处修复逐项实核在盘（含 `private: true` 先例与依赖形一致性）；新 🔵 2 条（run.mjs ③ 段的非递归扫描 / 按行锚定——R2 或后续批次可选收窄）+ 🟡 1 条（设计档 §1.3 发行面措辞随「不发布」裁定的收正——**批档已登记**「R1 结算随微轮」，非本舱缺口）。
- **终态 = clean**（遗留 must-fix = 0；轮次：审计 1 · 代码评审 2 · fix 1）。

### 5.5 交接与未动项

- **R2 交接**：① `files` 已预置 `flow/` `cards/` `subblocks/`——R2 落档时核对实际档名，并考虑把 `check-vsix` 断言由「版本相等」扩至「文件集在场」（R1b 面）；② `run.mjs` ③ 段非递归扫描（评审轮 2 🔵）建议随 R2 补递归。
- **未动（按范围）**：VSC / 桌面 / CLI 三树零触碰；设计档 / 需求档 / 提示词零触碰；**未提交**（工作树新增 `thincoder-render-core/**`——提交时机待父侧裁决）。
- **父侧 / 设计面随动项**：`RENDER-CORE.md` §6 `diff.js` 行补实施例外注（评审 🔵#4 · 批档已在案）· §5 `formatToolSummary(name, args)` → `text`（评审 🔵#7）· §1.3 发行面句 / KD-RC-1 发布纪律 + `docs/RELEASE.md` 随「不发布」裁定收正（批档已登记）· §10 B/C（发布序列 / 模块地图补行）随同裁定重裁。

### 5.6 R1c · 桌面侧加载管道 + 探针②（eng-coder 舱 c · 重派 · 2026-09-27）

**范围**：批 §2 舱 c = 桌面侧加载管道（`app://` 双根 `/rc/`）+ 探针②；设计面 = `docs/render-core/design/RENDER-CORE.md` §1.3「桌面端加载形」/ §8 R1 行 / §10 E；依赖形 = 本档 §1.3「核包不发布」裁定（`file:../thincoder-render-core`，不得用 registry 版本段）。

**交付摘要**（落点 `thincoder-desktop/` · 7 档 · 行数 = 终态）：

| # | 件 | 改动 | 增量（+/−） |
|---|---|---|---|
| 1 | `package.json`（22 行） | dependencies +1：`"@thincoder/render-core": "file:../thincoder-render-core"`；description 收正（in-repo packages——render-core 注明 never published） | +3/−2 |
| 2 | `package-lock.json`（3977 行） | + `../thincoder-render-core` 包项 + `node_modules/@thincoder/render-core`（`"resolved": "../thincoder-render-core", "link": true`——默认 `npm install` 稳定形）；`@thincoder/core` 项零改 | +14/−1 |
| 3 | `src/main/protocol.mjs`（88 行） | 双根：`CORE_ROOT = dirname(createRequire(import.meta.url).resolve("@thincoder/render-core/package.json"))`（装载期 fail-loud）+ `ROOTS` 显式表（`/rc/` 先于 `/` 兜底）+ `routeRoot()`；各根同走逃逸门（判定序 / 计数语义不变）；MIME 白名单零改 | +24/−4 |
| 4 | `src/main/window.mjs`（136 行） | 探针表 5→8：`rcMd`（`rc/md.mjs` ⇒ 200 + `text/javascript`）· `rcEscape`（`rc/..%2Fthincoder-core%2Fi18n.mjs`）· `escapeSrc`（`..%2Fsrc%2Fmain%2Fprotocol.mjs`）——后两枚 `%2F` 编码防 URL 归一化吸收，真达门①（「逃逸门两向」） | +8/−2 |
| 5 | `src/main/main.mjs`（93 行） | `ok` 式负探针计数阈值 3→5 | +1/−1 |
| 6 | `test/guard-closure.test.mjs`（114 行） | `/rc/` 前缀白名单（分类第 4 桶）· U6 增两向样本（`/rc/md.mjs` 放行 ∧ `@thincoder/render-core/md.mjs` 仍判红） | +14/−3 |
| 7 | `scripts/check-dist.mjs`（81 行）**工程工具面 · 披露** | `CHECKS = []` 空表 → 1 条产物断言（asar 包内 `node_modules/@thincoder/render-core/package.json` 存在；零依赖手写 asar 头解析 + 逐段下钻 `files` 树；只读 · fail-closed） | +61/−7 |

**实跑读数**（工作树终态 = 双 junction · 2026-09-27 晚）：

- **resolve() 两态可达**（`createRequire` 锚 = `src/main/protocol.mjs`）：symlink 态 ⇒ `D:\teamcode\thincoder\thincoder-render-core\package.json`；实拷态（`npm install --install-links`）⇒ `…\node_modules\@thincoder\render-core\package.json`。
- **探针②（正 + 负）**：正 = `app://desktop/rc/md.mjs` ⇒ **200** · `text/javascript`（served 计数含之）；负 = `app://desktop/rc/..%2Fthincoder-core%2Fi18n.mjs` ⇒ **404** + stderr `[protocol] escape refused: …`（**门①**归属）；两向补齐 = `app://desktop/..%2Fsrc%2Fmain%2Fprotocol.mjs` ⇒ **404** + 门①。
- **smoke 全量读数**：`{"smoke":1,"lock":"primary","window":true,"node":"24.21.0","sqlite":true,"floorMet":true,"protocol":{"served":39,"blocked":5,"probes":[{"id":"html","status":200,"mime":"text/html"},{"id":"css","status":200,"mime":"text/css"},{"id":"rcMd","status":200,"mime":"text/javascript"},{"id":"escape","status":404},{"id":"escapePct","status":404},{"id":"ext","status":404},{"id":"rcEscape","status":404},{"id":"escapeSrc","status":404}]},"boot":"ok","configKeys":16,"channels":["provider:list","ledger:read","batch:status","config:read","model:list","project:recent","sessions:list"],"errors":[],"ok":true}` · exit 0。
- **门**：`cd thincoder-desktop && npm test` = **171/171 · fail 0 · exit 0**（改动前基线同值 171）。
- **check-dist 三态夹具**（源树取材 · `@electron/asar` 造真 asar · 不依赖 registry）：A 含核 ⇒ exit 0「断言 1 条」；B 去核 ⇒ exit 1「missing asar entry」；C 损坏头 ⇒ exit 1「unreadable asar」；D 缺 dist ⇒ exit 1。互证：手写头解析 JSON 与 `@electron/asar` `getRawHeader().header` **逐字相等**。
- **启动最小验证**：双 junction 在位；`import('@thincoder/core/think-off.mjs')` ⇒ `THINK-OFF OK: thinkOffPath,thinkOffShape`；`core → thincoder-core\think-off.mjs` · `render-core → thincoder-render-core\package.json`。

**环境动作（必披露 · 与父侧事故闭环）**：加依赖的 `npm install` 按 `^0.9.5` 把 `@thincoder/core` junction 物化为 registry 0.9.5 **旧快照**（缺 `think-off.mjs`）⇒ 触发真机启动崩溃（父侧通报）；已 `npm link @thincoder/core` 恢复 junction（22:20 · 父侧亲测闭环）。终态 = core + render-core 双 junction · lock = link 形。**配套事实**：物化态 `npm ls` 对 `file:` 目录依赖报 `ELSPROBLEMS/invalid`（npm 11 固有 · 沙箱复现——非本项目缺陷）；打包窗纪律 = `npm install --install-links`（物化）→ 打包 → 恢复链接。

**决策透明表**：

| # | 决策 | 依据 | 状态 |
|---|---|---|---|
| 1 | 依赖形 `file:../thincoder-render-core` + lock 记 link 形 | 本档 §1.3 裁定；link 形 = 默认 `npm install` 稳定产物（sandbox 两态对拍含回切） | ✅ |
| 2 | 双根 = 一条门代码路径按选定根施加（非两套门） | 「各根各留逃逸门」语义等价（roots 表 + 路由）——advisor 复核判非简化 | ✅ |
| 3 | 探针② 增第 3 枚 `escapeSrc` | C4「逃逸门两向」严格读法 + 在册缺口（门①运行期零覆盖） | ✅ |
| 4 | check-dist 手写 asar 头解析（零依赖） | 只读脚本不引 devDep/传递依赖；与库解析逐字对拍 | ✅ |
| 5 | 物化态探针落点退化入注释（不改探针） | 两态无「同址」公共落点；门①归属 + `blocked` 计数双证兜底 | ✅ |
| 6 | 未加 `--smoke` 常驻用例 / check-dist 夹具用例 | 设计 §8 R1 行文件面未含新测试档；以实跑读数 + §5 为证据面（advisor 判非 must-fix） | 记录在案 |

**审计与代码评审轮次与终态**：

- **内部 explore 分歧审计（1 轮）· 终态 = 代码面 clean**：0🔴 · 1🟡 · 2🔵——全部为**注释漂移**（`rcEscape` 判别力注 · `runSmoke` 档头「5 探针」陈旧 · check-dist 档头「空表」陈旧）；半实现 / 静默简化 / 越面三类零发现（越界面独立核：renderer 零 `/rc/` 引用、核包 mtime 不落本舱窗口）。**fix 轮（1 轮 · 3 处）**：逐处收正；其中 `rcEscape` 判别力按两态硬证据改写（审计前提「目标不存在」修正为「物化态退化」）。
- **内部 advisor 代码评审（1 轮 · pass）**：0🔴 · 2🟡（可选 · 非 must-fix——`--smoke` 无常驻用例 / check-dist 无常驻回归面，均以 §5 读数记录为替代处置）· 4🔵（guard 前缀白名单可收紧 · 门①段界判据 · host 未校验〔两枚既有行〕· 设计档 §1.3 行锚陈旧——并入已登记微轮）。
- **终态 = clean**（遗留 must-fix = 0；轮次：审计 1 · fix 1（3 处）· 代码评审 1）。

**未动项 / 后续**：`renderer/**` 零触碰（R3 面）· VSC / CLI / 核包零触碰 · 设计档 / 需求档零触碰；**未提交**；随动项 = 设计档 §1.3 行锚并入本档 §1.4 微轮（父侧）。

### 5.6 R1b · VSC 侧加载管道 + 六档换接 + 探针①（eng-coder · 2026-09-27）

**范围**：`thincoder-vscode/**`（依赖 +1 · `.vscodeignore` 反排除 +1 · 五档 shim + `highlight.js` 删除 · `check-vsix` 断言 F · T-17 结构锁改判）+ 探针①。禁改面（桌面 / CLI / 核包 / 六档逻辑）零触碰。

**交付件与实跑读数**

| 面 | 内容 | 读数 |
|---|---|---|
| 依赖 | `package.json` deps +1 = `"@thincoder/render-core": "file:../thincoder-render-core"`（本地链接形——核包不发布；无 registry 段） | `npm ls --production` exit 0（`rc-r1b-npmls-link.txt`）；`node_modules/@thincoder/render-core` = junction → 源树 |
| 锁面 | `package-lock.json` 新条目 `link: true` + `resolved: "../thincoder-render-core"`（与既有 `file:` 先例 `test/vscode-mock` 同形）；根 deps 同步 | lock sha256 `35a379b4…`（dev 形备份 `rc-r1b-lock-dev.json` 逐字节相同） |
| 发行面 | `.vscodeignore:5` `!node_modules/@thincoder/render-core/**`（照 `:4` 核先例同式） | vsce include 表含 `render-core/**` 7 件（`rc-r1b-vsce-ls-follow.txt:460-466`） |
| 断言 | `check-vsix.mjs` 断言 F（与断言 B 同构）：vsix 含 `extension/node_modules/@thincoder/render-core/package.json` 且版本逐字 = 源树 `thincoder-render-core/package.json` | 真 vsix（475 件 / 1.87 MB）B+D+E+F 全过 exit 0（`rc-r1b-check-probe.txt`）；旧 0.9.7 vsix 断言 F 红 + exit 1（fail-closed，`rc-r1b-check-old.txt`） |
| 六档 | 五档 = 再导出 shim（零逻辑 `export *` · 单源）；`highlight.js` 删除（消费面 = 0——原唯一消费者 `md.js` 已核化） | 导出面逐档 = 原档（探针读数 `rc-r1b-probe1.txt`）；全树零悬空引用（grep 实核） |
| 门禁 | `npm test` | 改前基线 1015/1015 → 改后 1015/1015（`rc-r1b-baseline.log` / `rc-r1b-final.log`；打包窗两跑亦 1015/1015） |
| 探针① | dev junction 形态下核模块经 webview 相对路径可达（node 真 `import()` 取值 + 负向对照 + highlight 传递可达） | 5/5 PASS + negative-control PASS，exit 0（`rc-r1b-probe1.txt`） |

**决策透明表（R1b）**

| # | 决策 / 变更 | 依据 | 状态 |
|---|---|---|---|
| 1 | 逐档处置：shim ×5（`md` / `diff` / `lib` / `tool-summary` / `i18n`）· 删 ×1（`highlight.js`——唯一消费者 `md.js` 已迁核 ⇒ 零消费面，留档 = 死档） | 父侧接入形裁定（§1.1）+「可删」条款 | ✅ 已落 |
| 2 | `test/session-index-command.test.mjs` T-17 依赖面结构锁改判（在册两键 = 核 + 渲染核；严格键集+顺序仍锁死，第三键即红） | 设计 §6 发行三件「依赖 +1」；锁自带「新增须显式过目」纪律 ⇒ 改判即过目记录 | ✅ 已落（代码评审轮 1 复核「未松锁」） |
| 3 | 探针形态 = node 侧最小可达实证（+ 负向对照 + 传递可达 + 产物面证据） | 任务书 ㈤「最小可达实证（例：断路径在盘 + `node` 真 `import()` 取值；能跑真扩展宿主 / 冒烟更佳）」+ §1.1「探针① = VSC dev junction 取核」；设计 §10 E 字面含「真 webview」——两口径差已 `ask` 上抛待父裁 | ⚠️ 待父裁（探针头注 + 报告已披露边界） |
| 4 | 打包窗实测（一次性）：**物化形（`npm install --install-links`）下 vsce 硬失败**——`npm list --production` 报 `ELSPROBLEMS / invalid: @thincoder/render-core@0.1.0`（lock 记 `link:true` 而盘面为实目录）；C3 读数的出货形改取 **link 形 + `--follow-symlinks`** | 实测：`rc-r1b-package2.log:1072-1074` 失败 · `rc-r1b-package3.log` 成功（475 件）⇒ 设计 §1.3 发行面句「发布前物化」对 render-core 不可执行；另：link 形下反排除会连**被链源树**一并纳入（`render-core/test/**` 7 档 · `core/test/**`） | ⚠️ 上抛父侧（发布档 / 反排除收窄另裁） |
| 5 | 核材来源纪律：打包探针的 `@thincoder/core` 物化**取自源树**（`npm pack` 本地 tarball 解入），非 registry | 父侧硬约束②（registry 0.9.5 = 旧快照，缺 `think-off.mjs` ⇒ 物化必坏）；收尾态已恢复 junction 到源树 | ✅ 遵守（core junction + `think-off.mjs` 在位实测） |

**审计与代码评审（内部 · 本舱）**

- **explore 分歧审计（1 轮）**：四类偏差实读——半实现 / 静默简化 / 越出文件面 = 零；2 条 ⚠️：①探针①为 node 侧近似（已披露，真宿主面未证）；②文档指针漂移（`docs/vsc/design/WEBVIEW.md:66` 仍列 `highlight.js` 等 / `thincoder-vscode/AGENTS.md:66` 模块图 / 设计 §6 六档接入形行）——登记面随本条落。
- **fix 轮（1 处）**：探针读数可追溯性缺口 ⇒ 探针补 `.thincoder/tmp/rc-r1b-probe1.txt` 落盘 + 退出码 fail-closed（复跑 5/5 PASS · exit 0）。
- **advisor 代码评审（轮 1）**：verdict = changes-required——1 🔴（探针①「真 webview」字面未达成；与本舱所依任务书 ㈤ / §1.1 口径冲突 ⇒ 已 `ask` 上抛父裁）+ 4 🔵/🟡（发行面机理（= 决策表 #4）· 断言 F 扩「文件集在场」（R2 面）· 锁面核对通过 · T-17 记录面）。
- **fix 轮（2 处）**：① §5 决策透明表补 T-17 / 探针 / 打包实测三行（记录面收口，本条即证）；② 探针口径冲突上抛（`ask`）。**轮 2 复验读数见 5.7。**

**未动项 / 上抛**

- 未动：桌面 / CLI / 核包 / 六档逻辑 / 设计档 / 需求档 / 提示词（`git status` 实核：`thincoder-desktop/**` = 并行舱 c 面，本舱零触碰）。
- 上抛：①探针① 口径裁定（真 webview vs 最小实证）；②发布面（`docs/RELEASE.md` §5.5 物化纪律对 render-core 不可执行 + 反排除可能随包 `test/**`）；③文档指针（`WEBVIEW.md` / `thincoder-vscode/AGENTS.md` / 设计 §6）随动笔在父侧 / 设计面；④盘上 `thincoder-vscode-0.9.7.vsix`（旧）与探针产物同版本号不同内容——发布轮注意。

### 5.7 R1b · 轮 2 复验 + 父侧裁定 + 收尾实测（eng-coder · 2026-09-27）

- **父侧裁定（探针①口径 · 已落 §1.7）**：以任务书 ㈤ / §1.1 为**操作口径**；本舱交付形态（node 真 `import()` 经核包相对路径 5/5 + 负向对照 + `highlight` 传递可达 + 产物面证据 + fail-closed 退出码）**采信达标**；设计 §10 E「真 webview」字面 = 理想证据、**不列 R1 硬判据**（本环境无 VS Code 自动化面）；边界（真宿主运行时加载未证）登记 = **R2 入口风险 + 首次真跑观察项**，异常 ⇒ 回设计备选（物化 + `localResourceRoots` 显式扩面）。
- **advisor 轮 2 复验（本舱内部 · 同步）**：verdict = **pass** —— 上轮 1 🔴（探针①口径）= 销条（依 §1.7 重裁 + 设计 §8 R1 判据格 = `C1–C6 + VSC 全绿`，探针不在列，判据面自洽）；上轮 4 项（打包实测记录 / 断言 F 面 / 锁面 / T-17 记录面）= 记录面已闭或复核通过；新 3 项**皆非阻塞**（记录面编号与状态滞后 2 项 + 探针可选收窄 1 项，见下条处置）。
- **最小启动验证（父侧硬约束③）**：`.thincoder/tmp/rc-r1b-startup-smoke.mjs`（mock 宿主入口径，与既有入口径用例同法）⇒ **exit 0**，读数落 `rc-r1b-startup.txt`：
  ① 入口 `extension.mjs` 闭包装载 OK（exports = activate / deactivate / applyEngineFloorGuard / engineFloorMet / isMemoryFaceEnabled / nodeFloorMet）；
  ② `activate()` OK — subscriptions = 13；
  ③ **core face = `file:///D:/teamcode/thincoder/thincoder-core/agent.mjs (v0.9.5)`** —— 经 junction 落**源树**（registry 物化形会显示 `node_modules/@thincoder/core/...` ⇒ 事故类反证）；
  ④ `@thincoder/render-core` face = `file:///D:/teamcode/thincoder/thincoder-render-core/md.mjs`（本批新依赖同样落源树）。
- **收尾硬约束复核（本轮时点）**：`node_modules/@thincoder/core` 与 `node_modules/@thincoder/render-core` 皆 = **junction 到源树**（lstat symlink=true · realpath 实读；`npm ls --production` 两行 `-> .\..\<源树>` · exit 0）；`package-lock.json` sha256 = `35a379b4…`（dev 形，与 `rc-r1b-lock-dev.json` 逐字节相同）；核材物化（打包探针**一次性**）= **源树取材**（`npm pack` 于 `thincoder-core/` 得 tarball + file: 链接实拷）——**零 registry 取材**。
- **记录面收正（轮 2 新项处置）**：本 §5.7 即 §5.6（R1b 段）「轮 2 复验读数见 5.7」所指之块（悬空前指随之闭合）；R1b 段与 R1c 段**同号 5.6**（append-only 不可回改）——引用以**舱名**区分；§5.6 决策表 #3「⚠️ 待父裁」状态已由 §1.7 裁定（本条即前向指针）。
- **残余（父侧面）**：① 发布档（`docs/RELEASE.md` §5.5 物化纪律对 render-core 不可执行 · 反排除可能随包 `test/**`）；② 文档指针（`WEBVIEW.md` / `thincoder-vscode/AGENTS.md` / 设计 §6 接入形行）；③ R2 面（断言 F 扩「文件集在场」· 真宿主加载观察项）。

## §6 验证与收口（父代理）

### 6.1 实施核验（父侧亲跑 · 三舱 + 双探针 · 2026-09-27 22:3x ✓）

| 面 | 父侧读数（亲跑） |
|---|---|
| 舱 a · 核包 **C1** | **54/54 · fail 0** · 逐字性机械复核 = 恰 **3 行差异**（`md:17` / `diff:6`〔批准例外〕/ `tool-summary:29`；其余三档字节全同）· `private:true` + 零依赖 ✓ |
| 舱 b · VSC **C2 / C3** | **1015/1015 · fail 0** · 五档 shim 实读（2 行零逻辑形）· `.vscodeignore` 反排除在位（`:5`；`highlight.js` 删除零悬空）· 探针① exit 0（5/5 + 负对照 + 传递可达）· check-vsix 断言 F 真 vsix 绿 / 旧 vsix 红（fail-closed） |
| 舱 c · 桌面 **C4–C6** | **171/171** · smoke 亲跑 `served 39 · blocked 5 · ok:true`（`rcMd` 200 `text/javascript` · `escapePct`/`rcEscape`/`escapeSrc` 404 + 拒绝行）· check-dist 夹具四态（A 过 / B·C·D 红） |
| 环境面 | 双 junction 落在源树（`RESOLVE OK`）· 事故（§1.5）闭环 · 零 registry 取材（舱 b 独立复现 + 闭环） |

### 6.2 上抛处置

| # | 处置 |
|---|---|
| b-① **物化不可执行**（`--install-links` + `file:` ⇒ `ELSPROBLEMS` ⇒ vsce 硬红；link 形 + 反排除会携测试面入 vsix） | **设计面微轮**（实测形收正：vsix 内嵌 = link 形 + `--follow-symlinks`（实测 475 件）；**内嵌面收窄规则** = 核包仅运行必需（`.mjs` + package.json）· 测试面不入）——落 `RENDER-CORE.md` §1.3 + 发布面；R2 入口不受阻 |
| b-② 文档指针 / 实施注（`WEBVIEW.md:66` `highlight.js` 已删 · `RENDER-CORE.md` §6 六档行 + §1.3 行锚 · `PROJECT.md:107/:108` 行数漂移 · `diff.mjs` 实施注 · §5 `formatToolSummary` 签名） | **设计面微轮**（同步立单） |
| b-③ 记录面（§5.6 同号双段 · 盘上旧 vsix） | 记录面注（无动作；旧 vsix 在 `.thincoder/tmp` git 忽略面） |
| c-① `prepublishOnly` 残留（private 包） | 随 **R2a** 一行清 |
| 探针① 真宿主残余面 | §1.7 已裁（R2 入口风险标注 + 首次真跑观察项） |

### 6.3 结算面 + 后续

- 覆盖：**C1–C6 + 两探针全过**；三舱各 §5 在册（审计 + 代码评审双轮 clean）。
- 台账：#466–#468 仍在途（设计继 R2 / R3c）；#470 / #471 / #472（另批快车道）在册。
- 提交：两笔路径限提交（docs 面 / R1 实施面）→ 双远端推送。
- **下一步 = R2**（核构件层 `flow/cards/subblocks` + VSC 换接；拟拆 R2a / R2b——构件层先行）。
