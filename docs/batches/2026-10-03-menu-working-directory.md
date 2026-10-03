# 2026-10-03 · menu-working-directory
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 23:52「还有个问题：文件菜单里叫"项目"会引起用户误会，以为一次只能打开一个git项目，不如叫工作目录更符合实际。」——轻通道轮（文案 ∥ 命中项 ①）：桌面用户可见面「项目」⇒「工作目录」（菜单 ∥ 引导 ∥ 向导 ∥ 设置类目；双语言面同改）。
> 台账 = #888（desktop · 归批）。前情 = 无（独立批——轻通道轮·文案）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源与授权**：用户 2026-10-03 23:52「还有个问题：文件菜单里叫"项目"会引起用户误会，以为一次只能打开一个git项目，不如叫工作目录更符合实际。」

**笔面披露**：本笔 = **轻通道**（命中项 ① 细节/文案——用户可见字样重命名，非新机制、非行为改）｜**change** = 桌面用户可见面「项目」⇒「工作目录」（双语言面同改）：菜单三键（打开项目…／最近项目／无最近项目）∥ 引导语（chat.guide.noProject）∥ 向导（wizard.dir.hint）∥ 设置类目（settings.reason.noProject）｜**reach** = `src/main/menu-words.mjs`（zh/en 6 值）∥ `renderer/i18n.mjs`（4 值）∥ `renderer/i18n-settings.mjs`（2 值）∥ 批内件 `2026-10-02-desktop-menu-system.test.mjs`（3 断言随动）∥ 冻结基线 `2026-09-29-i18n-split.baseline.json`（6 值重锚——沿「断言随动 = 父侧」先例，enddiff-clearance 判例）∥ 文档引用随动（`MENU.md` ∥ `requirements/MENU.md` ∥ `PACKAGING.md` ∥ `UI.md` ∥ `IPC.md` ∥ `requirements/SESSIONS.md`——仅 UI 字样引用，机制术语不动）｜**rollback = revertable**（单笔可逆，逐档回退）。

**边界（明示不做）**：机制术语零改（`project:*` 通道 ∥ 「项目面」 ∥ KD-9「最近项目目录」 ∥ `recentDirs` ∥ `project:open`）∥ 零行为改（同通道同实现，纯字样）∥ 冻结批档 `2026-10-02-desktop-menu-system.md` 零回改 ∥ 会话条「打开目录…」现状已合（零动）。

**闭轮口径**：轻通道轮——收口时走全链（设计形式化 ∥ 独立评审（代码·记录·文档对账）∥ 批准 ∥ 收口核销）。

**§1 笔完（走查 · 2026-10-03 23:5x–2026-10-04 00:1x）**

- **落笔**：代码 3 档 12 值（`thincoder-desktop/src/main/menu-words.mjs` zh/en 6 ∥ `renderer/i18n.mjs` 4 ∥ `renderer/i18n-settings.mjs` 2）+ 文档 6 档 8 处 UI 字样引用（`MENU.md`×3 ∥ `requirements/MENU.md` ∥ `PACKAGING.md` ∥ `UI.md` ∥ `IPC.md` ∥ `requirements/SESSIONS.md`）——均「父侧直接执行 · 可 revert」。
- **走查读数**：① 旧字样复扫——**用户可见面零残留**（余者 = 源码注释 3 处（机制述语）∥ `.thincoder/tmp` ∥ `dist-r3/r4` 构建副本——非源面）；② **doc-check EXIT 0**（锚 0 悬空 ∥ 行宽 0 命中——`UI.md:71` 首改 302 超宽 ⇒ 已折行修复）；③ 现行继任件 `2026-10-02-settings-menu-trim.test.mjs` **EXIT 0**（本笔后复跑——零回归）；④ 菜单件红基线已取（6 腿红——其中 3 腿本笔随动、余为存量，见下）。
- **档案观察（存量红 · 非本笔引入）**：`2026-10-02-desktop-menu-system.test.mjs`（#817/#820 后组名/结构/键集漂移——本笔更名又 +3 处标签差异）∥ `2026-10-02-desktop-settings-menu-upgrade.test.mjs`（#820 后漂移）∥ `2026-09-29-i18n-split.test.mjs` + 基线件（键数 55⇒62 ∥ 行数闸 ∥ 冻结值——时代漂移；本笔 2 值在其差异集内）——**均为冻结系档案件，不重跑 · 零动作**（沿 head-toolcolor 先例）；家族重锚/归档 = 台账新挂（归批）。
- **边界确认**：机制术语零改（`project:*` ∥ 项目面 ∥ KD-9「最近项目目录」 ∥ `recentDirs`）∥ 零行为改 ∥ 冻结批档 `2026-10-02-desktop-menu-system.md` 零回改 ∥ tmp/dist 零触。
- **本笔到此完成**；闭轮（全链收口）= 随时可跑——一句「收口」即启动。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
