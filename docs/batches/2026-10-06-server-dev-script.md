# 2026-10-06 · server-dev-script
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 17:20「可以」——采纳父侧提议（承 17:18 问答：node --watch 已内置、22 起稳定）：thincoder-server 加 `npm run dev`（node --watch）。
> 台账 = #968（server · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-06
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**轻通道 pen 1（2026-10-06 17:2x——dev 脚本）· 已冻结**：
- **disclosure**：细节面（开发者便利——零产品行为 ∥ 运行时零涉）∥ rollback = revert。
- **change**：`thincoder-server/package.json:11`（+`dev` 行 = `node --watch bin/thincoder-server.mjs --config config.json`——与 `start` 同形加 `--watch`）；覆盖形 = `npm run dev -- --config <档>`（parseArgs 末位胜——本轮实跑见证：临时档覆盖生效）。
- **walkthrough（实跑）**：temp 配置（`.thincoder/tmp/dev-script-check/config.json`——端口 39017 ∥ 临时库）⇒ ① 启动 ready（`routes:21 ∥ version:0.1.0`）∥ ② mtime 触碰 `bin/thincoder-server.mjs` ⇒ `Change detected` + `Restarting` + 二次 ready ✓（重启径 = SIGTERM 优雅停机面）；8787 走查实例零触；bg 任务已清。
- **观测注记**：启动窗内一次自发起重起（报 `src/ops/update.mjs` change——实核 mtime 未变（16:20:58）＝ watcher 启动窗边角，无害）；日志读取编码注记（PowerShell 缺省 ANSI 显乱码——文件本身 UTF-8 无损）。
- **freeze**：本笔完成（round 收口随下一波走——settlement 挂钩在册：台账 #968 在途）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（轻通道收尾轮 · 设计形式化（§2 落段——条目表 ∥ 句面照录 ∥ 机制 ∥ 受影响文件与测试面 ∥ 验收对照（含收口测试复跑形·父侧执行）∥ 关键决策 ∥ 披露 ∥ 边界）；待 §3 设计评审）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**收尾轮 · 设计形式化（轻通道 · eng-designer · 2026-10-06）**

**段位声明**：本段 = 轻通道收尾全链步 1「设计形式化 + 文档一致化方案」——段位出处 = `docs/core/design/LIGHT-CHANNEL.md` §2.4 收尾序列步 1（`:71`）∥ §2.6 段位表 §2 行（`:94`）；本笔 = 父侧直改（记录住 §1；§5 不适用——§2.6 `:97`）。本批 = 单笔轮（§1「轻通道 pen 1」在册——已冻结）。本步笔面 = 本档 §2 一段（**记录形——不改已落笔**）；设计档落点 = **无**（轻通道轮设计即本段——设计档 ∥ 提示词面 ∥ 产品码 ∥ 他批零触）。台账 = #968（在途——「收尾未落 ⇒ 不许核销」挂钩在册，§1 `:14`）。

**① 条目表（本批覆盖——一行）**

| 条目 | 落点 | 判据归属 | 句面照录（`package.json:11` 实文） |
|---|---|---|---|
| dev 脚本（开发者便利——`npm run dev`） | `thincoder-server/package.json:11`（`start` 行 `:10` 同形加 `--watch`；本笔 +1 行） | 细节面（零产品行为 ∥ 运行时零涉——轻通道准入判由；交底 = §1 `:10`；回退 = revert） | `"dev": "node --watch bin/thincoder-server.mjs --config config.json",` |

笔源 = 用户 2026-10-06 17:20「可以」（承 17:18 问答：node --watch 已内置、22 起稳定——§1 编制行在册）。

**② 机制设计（本笔形态）**

- `dev` = `start` 同形 + `node --watch`（Node 内置 watch 模式；`package.json:16` `engines` = node ≥24；server 包零 `dependencies` 实读——零新增依赖 ∥ 零自研面；选形理由 = §1 编制行在册）。
- 改动触发 ⇒ 重起（重启径 = SIGTERM 优雅停机面——`bin/thincoder-server.mjs:149-150`；§1 `:12` 在册）；重启后就绪行重申（`ready`——`:131`）。
- 覆盖形 = `npm run dev -- --config <档>`：`--` 后参尾接 ⇒ 实参序列含两处 `--config`；`parseArgs` 逐参覆写 `configPath`（`bin/thincoder-server.mjs:33-43`；并列形 `--config=<档>` 同面 `:38`）⇒ **末位胜**（本轮实跑见证——临时档覆盖生效，§1 `:11`）。

**③ 受影响文件与测试面**

- 受影响文件 = `thincoder-server/package.json`（+1 行 @ `:11`）。工作树 diff 同档另含 `prepublishOnly` 行差异 = 同期他批（#962 ∥ #963 ∥ #965 波）件名随动——非本笔；本笔 = `dev` 行单行。
- 测试面 = 零新增批内件（细节面——零产品行为；「必要测试」= 走查读数本——`LIGHT-CHANNEL.md` §2.4）；收口测试 = 复跑读数对（父侧执行——见 ④）。

**④ 验收对照**

| # | 项 | 判据（可核） | 读数 / 落点 |
|---|---|---|---|
| A | walkthrough（笔时实跑——§1 `:12` 在册照录） | ① temp 档（端口 39017 ∥ 临时库）⇒ 启动 ready（`routes:21 ∥ version:0.1.0`）∥ ② mtime 触碰 `bin/thincoder-server.mjs` ⇒ `Change detected` + `Restarting` + 二次 ready ✓（重启径 = SIGTERM 优雅停机面）；8787 走查实例零触；bg 任务已清 | §1 `:12`（temp 档 = `.thincoder/tmp/dev-script-check/config.json`） |
| B | 收口测试（复跑形——读数前后对；**父侧执行**） | temp 档 ⇒ `npm run dev -- --config <temp 档>` 启动 ⇒ 前读数 = ready 行（`routes:21 ∥ version:0.1.0`；端口面随 temp 档 ⇒ 覆盖形同时复证）→ mtime 触碰（§1 同法）⇒ 后读数 = `Change detected` + `Restarting` + 二次 ready（同形）⇒ 读数对成立 = pass；与 8787 实例端口相异 ⇒ 零触碰 | 复跑用 §1 同款 temp 档（现盘复核路径）；读数随 §6 收口面回填 |

**⑤ 关键决策**

- **D1 走轻通道（细节面准入）**：零产品行为 ∥ 运行时零涉——误准入兜底 = 本收尾全链（`LIGHT-CHANNEL.md` §2.1 `:37`）。
- **D2 形态 = `start` 同形 + `--watch`**：覆盖语义与 `start` 一致（`--config` 末位胜）；选形理由在册（§1 编制行——内置 ∥ 22 起稳定 ⇒ 零新增依赖 ∥ 零自研面；第三方 watcher 类 = 不需要，内置已足）。

**⑥ 披露（上抛——供父侧裁）**

- 披露 1（启动窗自重起边角 · §1 `:13` 在册）：启动窗内一次自发起重起（报 `src/ops/update.mjs` change；实核 mtime 未变（16:20:58））＝ watcher 启动窗边角；判读 = 无害；本席倾向 = 不另立新面（无复现路径 ⇒ 追账无决期；复现再立）。
- 披露 2（日志读取编码注记 · §1 `:13` 在册）：PowerShell 缺省 ANSI 显乱码；文件本身 UTF-8 无损——读取面注记（非缺陷）；收口复跑读数以文件 / UTF-8 面读。
- 覆盖形判据（实跑见证 + 代码面）：末位胜代码面 = `bin/thincoder-server.mjs:33-43`；实跑见证 = §1 `:11`。

**⑦ 边界（本批不做）**

- 不触 8787 走查实例；零产品码触碰 ∥ 零产品行为（生产径 `start` 零改）；笔 = `package.json` 单行（产品文本面——批单承载；记录面不动）——不再改；记录面（设计档 ∥ 提示词 ∥ README ∥ OPS）零触；§1 零触（本段只写 §2）；他批零触。

**⑧ 文档一致化去向**：**无需**——server 文档面实读未枚举 npm 脚本面（`docs/server/**` ∥ `thincoder-server/**` 两树 grep「npm run」零命中）；文档面启动形 = 装机后 `thincoder-server --config <档>`（`thincoder-server/README.md:90`）∥ compose——与本笔（仓库内开发便利）不同轴。落格按 `LIGHT-CHANNEL.md` §2.4 `:81` 模板。

## §3 设计评审（评审子代理）

**轮次 1（代码类 · 评审实例 `#61`）——【父侧代录】**（mount 无 batch 写通道——代码类；发现表按机制由父侧代录并打「代录」标）：

- **核验对象与结果**：① 旧项承继（`#54` 七条——**7/7 Fixed**：`PROMPT-SYSTEM.md` §6.17 登记 ∥ §6.1 实例 ∥ §10.2 行 7 复算 **16/16** ∥ 批档 §2.7 勘误三件 ∥ §6 三项到盘）；② **本对象** = dev 脚本笔（`thincoder-server/package.json:11`）+ 轮记录（§1 笔 ∥ §2 形式化）——**0 缺陷**（落码照录一致 ∥ 引证坐标逐处实读相符（`bin/thincoder-server.mjs:33-43`/`:131`/`:149-150`；`LIGHT-CHANNEL.md` §2.4 `:71` ∥ §2.6 `:94`/`:97` ∥ §2.1 `:37`；`README.md:90`）∥ `npm run` 两树零命中成立 ⇒ ⑧ 去向「无需」立）。
- **计数**：旧项 **7/7 Fixed**；本对象新项 **0**；must-fix 0 ∥ **VERDICT: pass**。
- **未复核项（carried 留 §6）**：机检实跑读数 ∥ 实跑走查读数 ∥ 提交哈希 ∥ 台账态。
- （注：⑥ 披露 2 件 + D1 兜底 = 在册待父侧裁点（§6 落）——非缺陷。）

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-06 17:20「可以」（dev 脚本笔放行——§1 编制行在册）+ 18:38「自动跑完」（全链授权）。

- **条件齐备**：① 评审 **pass**（§3——`#61`）；② 修正轮 = **无**（评审 0 缺陷）；③ 实施面 = 轻通道（主 agent 直改 · §5 不适用——无 eng-coder/token 面）。
- **批准范围** = 本笔全链收口（§1 pen 1 + §2 形式化 + 收口核销）。依据登记 = §3 ∥ §2 ∥ §1。可撤回。

## §5 实施记录（eng-coder）

**§5 = 不适用**（轻通道轮——无 eng-coder 实施段；笔 = 父侧直改，记录住 §1；机制在册）。

## §6 验证与收口（父代理）

**§6 验证与收口（父代理 · 2026-10-06 18:5x）**

**核销同步清单（逐项）**：

- **角色表**：§1 主 agent（笔 + 授权）∥ §2 eng-designer（形式化，`#57`）∥ §3 评审（`#61` pass——代录块）∥ §4 主 agent 代签 ∥ §5 不适用 ∥ §6 父代理。
- **修正轮落地前置**：无（评审 0 缺陷——无需修正轮）。
- **收口测试（复跑形 · 父侧亲跑 · §2④B 兜现）**：temp 档（`:39017` ∥ 临时库）⇒ **前读数** = `ready`（`port 39017 ∥ routes 23 ∥ version 0.1.0`）→ mtime 触碰 `bin/thincoder-server.mjs` ⇒ `Change detected` + `Restarting 'bin/thincoder-server.mjs --config config.json --config ../.thincoder/tmp/dev-script-check/config.json'`（**完整 argv 保留**——覆盖形末位胜再证）⇒ **后读数** = 二次 `ready`（同形）⇒ **读数对成立 = pass**；与 8787 实例端口相异 ⇒ 零触碰 ✓；bg 任务已清 ✓。
- **覆盖依据**：用户 17:20「可以」（承 17:18 问答——node --watch 内置、22 起稳定）。
- **搁置清单回核**：「无」。**暂缓批复核：无**。
- **用户文档面同拍**：零需求档面（开发便利——不涉功能点）✓（§2⑧ 文档对账「无需」+ 评审复核成立）。
- **计数**：笔 = `package.json` 单行（+1 行）；记录 = 本档；无测试档（细节面——走查读数即验收读数本）。
- **指针**：评审 carried 项已按本节复核；无新增指针。
- **变更记录**：无（本笔不触设计档/提示词/README——§2⑧ 在册）。
- **台账可见面**：`#968` → **待核销**（证据 = 本节）；核销随提交。
- **前批遗留核对**：前情 = 无（独立批）。

**提交**：`dev` 行已随 server 波提交 `9d33046a` 入仓（他波 scope —— §2:40 as-of 说明在册）；本档（记录面）随 docs 波提交。
