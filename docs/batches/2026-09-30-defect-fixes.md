# 2026-09-30 · 缺陷修复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #707 ∥ #704 ∥ #750 ∥ #699（真缺陷族）；用户 2026-09-30 23:42 批次点火令「实活都做了」。
> 台账 = #707 ∥ #704 ∥ #750 ∥ #699 ∥ #700（真缺陷族 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>
## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（五条（#707 ∕ #704 ∕ #750 ∕ #699 ∕ #700）· 档落三处）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

【授权与范围】授权 = 批档 §1（台账 #707 ∥ #704 ∥ #750 ∥ #699）+ 用户 2026-09-30 23:43 范围增补令「#700 并入本批」⇒ 本批**五条**。轮次 = initial；产品码 ∕ 需求档 ∕ 提示词面**零触**（本设计轮）。

【设计档落点（**本设计轮已落**——D1 eng-designer 笔；归属判读逐条披露）】
- #707 → `docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1（族成员行 :56 ∕ :71 + 「已知局限（误删方向）」兑现注 :86 + 变更记录 :441）——判读：身份判据单源住 `process-probe.mjs`，其设计权威面 = 本档 §3.1（`TOOLS.md` 不载该判据，不迁）。
- #704 → `docs/cli/design/CLI-ENTRY.md` §3（:52-56 发射契约重写）+ §4（:61 MS-2 宿主行收正）+ 变更记录（:77）——CLI 发射面归属本档（既有建档口径）。
- #700 → `docs/core/design/MEMORY.md` §6.14 面① 第 2 件（:519 限制句删除 + 换算语义句）+ §8.3（:647）+ 变更记录（:708）——排除谓词机制源住 §6.14。
- #699 → **零设计档笔**（收正对象 = 码内注释化石，无设计档计数面）；#750 → 零设计档笔（处置面 = 批内件 ∥ 批档；语义单源 = `RENDERER.md` §1.1「留档记录」条零改）。

【1 · #707 · executor 判活对桌面 dev 相对路径形假阴性】
- 实锤（引台账 + 本轮回读）：桌面 dev 启动形 cmdline = `node_modules\electron\dist\electron.exe --remote-debugging-port=9222 --remote-allow-origins=* .`（相对路径；`isProductProc` 三族零命中 ⇒ `ownerState` ④ 支误判 dead）。影响四消费面 = 台账尾「属主已死 N」· `thincoder-core/ledger-executors.mjs:46-88`（判活 + `classifyEnd` 端标签）· `peer-instances.mjs:143-155`（读面）· `session-slot-claims.mjs:78-90` `cleanDeadOwners`（**误删方向**）。
- **候选裁定**：
  - (a) 启动面绝对路径 = **已落**（`scripts/desktop-debug.cmd:7` 现盘 = `"%CD%\node_modules\electron\dist\electron.exe" …` + `:6` 注释明由；现行实例实证 = pid 19160 cmdline 绝对路径形）。其余启动形（`npm start` ∥ npx 链）子进程 argv 亦绝对（现盘进程链实读：`npx-cli.js → cmd → node cli.js → electron.exe`）⇒ 保留为启动面形态规范，本批不再动。
  - (b) 判活源改心跳（peers 件新鲜度）= **否决**。读证三件：① peers 件写点 = 回合末且**仅当本回合有文件写入**（`peer-domains.mjs:273-294` flush 门 `_peerWritten` 非空）+ 写工具成功钩子（`peer-claims.mjs:120-147`）——**非心跳**；② 空闲活会话件陈旧（现盘实证：活桌面会话 19160 的件停写于 15:41）· 零写作会话**无件** ⇒ 新鲜度判活会把更多活会话判死，与 D-MI10 方向纪律相悖；③ LEDGER 面已否决心跳写共享面先例（`LEDGER.md` §7.3.1 禁项）。
  - (c) 身份族补形 = **采纳**：`DESKTOP_END_RE`（`thincoder-core/process-probe.mjs:52` 单源）扩 `node_modules[\\/]electron[\\/]dist[\\/]` 段——沿该档头注已登记消解路径（「实测出现时补进本族，单源改点仅此一处」）；超集面（他 electron dev 应用）与 VSC 宿主族全 VS Code 窗口超集同向（宁可多留）；误保留 = 噪音、误删 = 双进程同槽破坏级 ⇒ 方向纪律下接受，披露在册。
- 落码面（实施轮）：`process-probe.mjs:52`（regex 扩）+ `:49-51` 注释收正（补实测形 + 日期 + 台账号）；`isProductProc` ∥ `classifyEnd` 两消费面经单源自动随动（VSC 先判序不变）。
- 验收腿（批内件 `docs/batches/2026-09-30-defect-fixes-core.test.mjs`（拟新增））：
  - L707-1：`isProductProc(<实测相对形>) === true` ∧ `classifyEnd(…)==="desktop"` ∧ `ownerState(pid, alive+cmds) === "alive"`。
  - **L707-2（「误删风险面」负控腿——必含）**：`filterDeadOwners(pid, { alive:true, cmdline:<实测形> }) === false` ∧ `cleanDeadOwners(m, bundle)` 对该活桌面属主条目**不删**；对照臂 = 他属主 pid 活 + 异 cmdline ⇒ 删 · pid 死 ⇒ 删 · 缺行 ⇒ 保留。
  - L707-3（回归零变）：CLI 形 ∥ VSC 形 ∥ 异形 ∥ 缺行 ∥ 探测失败 = 五态与既往逐条同值。
  - L707-4（显示面）：`resolveExecutorStates`（借 `_setProcessProbeTestImpl` 注入 + TTL 缝置 0 防缓存）⇒ `state="alive"` · `end="desktop"` · `deadExecutors=0` · `executorTail` 非「属主已死」形。

【2 · #704 · completion 发射语法】
- 裁：发射形去转义改直写（发射脚本即真实 shell 脚本；`\$(…)` 非命令替换 ⇒ `bash -n` 语法错；zsh 双引号内 `\$` = 字面 `$` ⇒ 分派不匹配）。点账（`thincoder-cli/src/completions.mjs` 实读 137 行）：bash 11 行 `\\$(compgen` → `$(compgen`（:14 ∕ :17-20 ∕ :23-25 ∕ :27 ∕ :28 ∕ :30）∥ 11 处 `"\\$cur"` → `"$cur"` ∥ 2 处 `case "\\$prev" in` → `case "$prev" in`（:16 ∕ :22）；zsh 4 处（:45 `\\$state` ∥ :61 ∥ :64 ∥ :69 `\\$words[…]`）→ 零转义形；fish 零改；`\${COMP_WORDS[…]}` 三行（:11-13）**保留**（JS 插值险位——发射须字面 `${`）。
- 契约（`CLI-ENTRY.md` §3 已落）：源档形 ≡ 发射字节形（零反斜杠）+ 插值险位例外 + zsh 分派行同排书写。
- 锁点重定：MS-2 锁定形 = 本批批内件 `docs/batches/2026-09-30-defect-fixes-cli.test.mjs`（拟新增：沙箱 env 子进程驱动三套发射；bash 直写形逐字 ∥ zsh 分派行 ∥ fish 旗标 token ∥ 旧形零残留断言）；**负向锁行换写 ⇒ 5 行** = `docs/batches/2026-09-30-crossline-clearance-cli.test.mjs:139`（`case "\\$prev"`）∥ `:140`（`case "\\$words[2]"`）∥ `:143-145`（三行 `\\$(compgen`）——逐字改直写形（该批命令集锁定字面零变）；§4 宿主行已收正（原宿主随测试树全清退场——回迁随重建轮）。
- 真机腿（环境实读）：bash = Git Bash 在盘（`C:\Program Files\Git\bin\bash.exe`，非 PATH）⇒ `-n` 语法腿 + `source` 冒烟（`complete -p thincoder` 注册回读）**必跑**；zsh ∕ fish 本机不可得（`where` 零命中；WSL 在盘、发行版未验）⇒ 静态字节锁兜底 + §5 如实披露「真壳未跑」；不得以静态断言冒充真机腿。

【3 · #750 · digest-persistence 4/9 红归因】
- 复跑签名（2026-09-30 本轮 · 仓根 `node --test docs/batches/2026-09-30-digest-persistence.test.mjs`）= **5/9**（与 #746 ∥ #738 审计 O1 登记逐条同签）：腿 2 `页读回执成立 false≠true`（:349）∥ 腿 3 `留档块入块序 0≠5`（:398）∥ 腿 4 `TypeError: … 'some' of undefined`（:435）∥ 腿 7 `ENOENT <tmp>/sessions/<hash>.json.1`（:586）。
- **归因（本轮探针实证）**：`thincoder-desktop/node_modules/@thincoder/core` = **junction**（实读 `<JUNCTION> core [D:\teamcode\thincoder\thincoder-core]`）；node ESM 对 junction **不作同 URL 折叠** ⇒ 同文件**双模块实例**。探针三步：① 同沙箱下核侧 `loadSlotFile` 读得（history=1）而端壳 `pageHistory` 回 `slot-missing`；② `a===b` **false**、缝设于核路径实例时 junction 实例**不受**；③ 缝设于**端壳 re-export 缝** ⇒ junction 实例随动。⇒ 测试 `sandbox()` 只设核路径实例缝，端壳消费实例读**真实** `~/.thincoder/sessions` ⇒ 腿 2/3/4 `slot-missing` 级联、腿 7 同因（写真实面 ∥ 测试读沙箱面 ⇒ ENOENT）。**红因 = 测试宿主接线漂移**（叠加腿内 #747 语义撤销面断言需对位）。
- **二择裁定 = 同源修复**（首选）：① 缝对齐（`sandbox()` ∥ `after` 同时设端壳 re-export 缝——实证可达，~4 行）→ 复跑；② 余红逐腿对位收正（语义单源 = `RENDERER.md` §1.1「留档记录」条 ∥ 对位物 = `docs/batches/2026-09-30-triple-end-digest-unify.test.mjs` 四腿）⇒ **9/9 绿收口**；③ 件退役 = 仅当①②后余红断言面与现语义单源相抵且非接线时兜底启用（须再上抛）。**产品码零触**（无回归证据：真机三径 ✓ ∥ #747 批内件 4/4 ✓ ∥ 现实现实读在位 = `turn-face.mjs:95-99` ∥ `:166-179` 写点前移在码）。
- **副作用披露（必入 §5）**：腿 7 复跑经端壳实例向**真实** `~/.thincoder/sessions/` 落临时 cwd 哈希档两对：`4cc349…json.1 ∥ .json.manifest`（20:54 ∥ 前轮）+ `a6499e…json.1 ∥ .json.manifest`（23:48 ∥ 本轮）；**清理 = 父侧动作**（本席仓外零触）。
- 验收腿：该件复跑 9/9 绿（或逐腿收正后全绿）；§5 记逐腿处置 + 签名逐条。

【4 · #699 · 化石计数句收正（零语义）】
- `thincoder-desktop/src/main/ipc-relays.mjs:34`：`设置族十二项处理体：转口三档模块，本档零算法副本` ⇒ `转口群十九项处理体（设置族十六 ∕ 配置写一 ∕ 台账相位两）：转口四档模块，本档零算法副本`。计数基准（逐名实读）= 注释下 19 导出口：provider 8 + model 2 + agent 1 + MCP 5 + config 1 + ledger 2；「四档」= `providers.mjs` ∥ `settings.mjs` ∥ `mcp-servers.mjs` ∥ `project-info.mjs`（原「三档」同化石，同笔收）。
- `thincoder-desktop/src/preload/preload.cjs:11`：`设置族十二项（provider / model / agent 参数 / MCP / 配置写 / 语言）` ⇒ `设置族二十项（provider / model / agent 参数 / MCP / env / tools / 配置写（语言））`。计数基准（白名单 46 项内实读）= 8+2+1+6+1+1+1 = 20；「项目级信息两项（台账 / 相位）」核算为真零改。
- 相邻「二十四项」句（`ipc.mjs:9` ∥ `:269` ∥ `ipc-registry.mjs:21` ∥ `ipc-relays.mjs:2`）核算 = 真（19+2+2+1）⇒ **不在收正射程**（披露 · 零改）。
- 验收腿（批内件 `docs/batches/2026-09-30-defect-fixes-desktop.test.mjs`（拟新增））：两档源文本含新句 ∧ 「设置族十二项」两档零命中 ∧ 旧「三档模块」句零命中。

【5 · #700 · 内存库排除面嵌套 cwd 基面统一】
- 裁 = **谓词内换算根面**（候选①；候选②「行走面携根基 ∕ 改存根相对 path」否决——`rel` = 库面 path 键（origin 相对）属数据面契约，改基 = 迁移 + 检索 ∕ 删除连带，远超缺陷射程）。
- 机制：`conventions.mjs` `isExcludedRelPath(rel, decl, base = null)`——`base` = `rel` 的相对基（调用面 cwd/origin）：`resolve(base, rel)` → `relative(decl.root, abs)`（分隔符归一 `/`）后按既有前缀判据比对；**越出根面**（`..` 头 ∥ 根外绝对形）⇒ **不命中**（保守不排除——沉默洞方向收窄；与 D17 aux 面「indeterminate ⇒ 不匹配」同向）；`base` 缺省 ∥ `decl.root` 缺 ⇒ `rel` 原样（根起步调用面等义）。函数注释同步收正（:259-260「项目根相对」句改「`base` 相对——缺省视为根相对」）。
- 起效点四（全携 `base`，实施轮）：`code-sync.mjs:91`（gitSync ⇒ `dir`）∥ `:155`（listProjectFiles 谓词注入——walk 剪枝同缝）∥ `:426`（reindexFile ⇒ `cwd`）∥ `sync-tail.mjs:65-70`（`sweepStaleRows` 增 `base` 参；消费 = `code-sync.mjs:268` ∥ `docs.mjs:87` 携 `dir`）。
- 验收腿（`-core.test.mjs`）：L700-1 等义（cwd=根；含 `openclaw` vs `openclaw-fork` 边界）；**L700-2 正腿**（base=`<root>/sub`；声明 `sub/build`；`build/a.mjs` ⇒ 排除——修前 red）；**L700-3 反腿**（base=`<root>/src`；声明 `docs`；`docs/b.md` ⇒ 不排除——修前 red）；L700-4 越界腿（`../x` ⇒ 不排除零抛）；L700-5 接线腿（`walkProjectFiles` 真目录剪枝零列 ∥ `sweepStaleRows` 桩 db：命中零删 ∥ 非命中照删）；L700-6 缺省回归（`[]` ⇒ 恒 false）。

【受影响文件与测试面（行数 = 内容行实读 2026-09-30）】
| 文件 | 现读 | 预期 |
|---|---|---|
| `thincoder-core/process-probe.mjs` | 163 | ≈172（族扩 + 注释） |
| `thincoder-core/conventions.mjs` | 295 | ≈310（谓词 base 换算 + 注释） |
| `thincoder-core/memory/code-sync.mjs` | 458 | ≈461（3 处携 base） |
| `thincoder-core/memory/sync-tail.mjs` | 81 | ≈84（`base` 参） |
| `thincoder-core/memory/docs.mjs` | 437 | ≈438（1 处携 base） |
| `thincoder-cli/src/completions.mjs` | 137 | ≈139（转义收正 + 头注） |
| `thincoder-desktop/src/main/ipc-relays.mjs` | 71 | 71（注释行换文） |
| `thincoder-desktop/src/preload/preload.cjs` | 80 | 80（注释行换文） |
| 批内件（新 ×3）：`2026-09-30-defect-fixes-core.test.mjs` ∥ `-cli.test.mjs` ∥ `-desktop.test.mjs` | — | ≈230 ∥ ≈100 ∥ ≈60 |
| 旧批件换写：`2026-09-30-crossline-clearance-cli.test.mjs`（5 行）· `2026-09-30-digest-persistence.test.mjs`（缝对齐 ~4 行 + 余腿收正 ≲30 行） | — | 逐件记 §5 |
| 设计档（本设计轮已落）：`CLI-ENTRY.md` §3 ∕ §4 ∕ 变更记录 ∥ `MULTI-INSTANCE-COLLAB.md` §3.1×2 ∕ 兑现注 ∕ 变更记录 ∥ `MEMORY.md` §6.14 ∕ §8.3 ∕ 变更记录 | — | 已落 |

【关键决策记录（含被否）】
- D1 (#707)：采 c（族补 + 单源）；否 b（非心跳——读证三件在册；方向纪律相悖）；a 已落事实登记（不改）。负控腿 = 误删方向的机械挡（方向不对称 = 模块头注既有纪律）。
- D2 (#704)：发射形直写（零反斜杠）；`\${` 险位单源写规；MS-2 载体重定（宿主退役事实收正）；真机 bash 必跑 ∥ zsh/fish 缺壳披露制。
- D3 (#750)：同源修复首选（缝对齐实证可达）；退役仅兜底；产品码零触（证据链在册）。
- D4 (#699)：两处各自块面计数基准写定（自证可核）；「二十四项」族零动。
- D5 (#700)：谓词 base 换算（单点）；否行走面 ∕ 数据面改基；越界不命中（保守不排除）。

【上抛项】
- U1（需求笔 · 零阻塞）：`docs/core/requirements/MULTI-INSTANCE-COLLAB.md:34` F-MI6 家族枚举「③ 桌面族：命令行含 `thincoder-desktop` 路径段」随族扩不完整 ⇒ 主 agent 笔随动（或改指针式）。
- U2：真实 `~/.thincoder/sessions/` 两对临时哈希档（见 #750 副作用披露）——清理待父侧。
- U3：`scripts/desktop-debug.cmd` 绝对路径形为**已落事实**（git 归属 `d7f7612b9`）——如父侧判定应计入 #707 交付，请并入 §5 记录；本席按启动面规范登记于本条。
- U4（观察）：junction ⇒ node ESM 实例双身 = 测试面系统性源（#750 根因）；测试体系重建轮宜立一条载入面通则（非本批射程，登记）。

【修复轮（轮 1）· 评审九条逐条落位（eng-designer · 2026-10-01）】

**来源** = 本档 §3 轮次 1（VERDICT = pass；🔴 0 ∥ 🟡 5 ∥ 🔵 4）+ 父侧逐条裁定（全收——执行者 = 本席）。**轮次** = fix。**方法** = 先实读核证（坐标 ∕ 行数 ∥ WSL 探针）→ 才落笔；**零新语义**。**本轮不做** = 产品码零触（#699 定稿文本仅供实施轮落码）∥ 需求档零笔（号 4 = 主 agent 笔）∥ §1 ∕ §4 ∕ §5 ∕ §6 零动 ∥ 已过面（五裁定）零动。

| 号 | 处置 | 落位（file:line = 本轮终态实读） |
|---|---|---|
| 1 | 受影响表行收正：`conventions.mjs` 现读 295 → **320**；预期 ≈310 → **≈335**；补 >300 档位句（免拆依据 ∥ 500 余量） | 本块「受影响文件表收正」（§2 :62 原行以本块为准） |
| 2 | 两「旧批件换写」补现读 + 增量列：`crossline-clearance-cli.test.mjs` **151** · `digest-persistence.test.mjs` **625** | 本块「受影响文件表收正」（§2 :70 原行以本块为准） |
| 3 | 合同面去修订残迹（删「2026-09-30 … #704 收正——…非命令替换」∥「同批收正」；活形条款留；沿革 = :77——不另立变更记录行） | `docs/cli/design/CLI-ENTRY.md:52` ∥ `:55` |
| 4 | U1 = 主 agent 笔 ∥ 随本批落地（F-MI6 家族枚举随动；本席零笔） | `docs/core/requirements/MULTI-INSTANCE-COLLAB.md:34`（主 agent 执行） |
| 5 | #750 验收增零触腿（真实 `~/.thincoder/sessions/` 跑前 ∥ 跑后对照 ∥ `HOME` 重定向对照臂；对齐 `CLI-ENTRY.md` §3 沙箱纪律） | 本块「#750 零触腿（增补）」 |
| 6 | 625 行档 = 存量债（非本批引入）：载档位状态 ∥ 拆分候选登记（不扩本批射程） | 本块「受影响文件表收正」附注 |
| 7 | 坐标收正（定义现体 = `session-slot-claims.mjs:78`；转口 = `session-slots.mjs:48`；调用 = `:305`） | `docs/core/design/MULTI-INSTANCE-COLLAB.md:74` ∥ `:297`（§7）+ 变更记录 `:442` |
| 8 | 新句限域：定稿 =「…本块设置族十六…」（§2 :47 计划文本以本块为准——实施轮照此落码） | 本块「#699 新句定稿」 |
| 9 | WSL 探针：**无可用发行版** ⇒ 真壳 leg 不可补 ⇒ 维持披露制（§2 :37「发行版未验」以本块读数为准） | 本块「号 9 · WSL 探针读数」 |

**受影响文件表收正（与 §2 原表 :62 ∥ :70 冲突处以本表为准——原行文不改，本档 append-only）**：

| §2 原行 | 文件 | 现读 | 预期 Δ | 档位 ∕ 备注 |
|---|---|---|---|---|
| :62 | `thincoder-core/conventions.mjs` | **320** | **≈335**（谓词 `base` 换算 + 注释） | >300 档位句：改动面 = 既有谓词 `isExcludedRelPath`（定义 `:261` ∥ 注释 `:259-260`）内小改（`base` 缺省参 + 换算支 + 注释收正）——未新增导出 ∕ 职责面 ⇒ **无需拆分**；未触 500 硬限（改后余量 ≈165 行） |
| :70 | 旧批件换写 · `2026-09-30-crossline-clearance-cli.test.mjs` | **151** | 5 行字面换写（行数零变——`:139` ∥ `:140` ∥ `:143-145` 直写形；§2 :36 口径不变） | <300——无档位面 |
| :70 | 旧批件换写 · `2026-09-30-digest-persistence.test.mjs` | **625** | 缝对齐 ~4 行 + 余腿收正 ≲30 行（逐件记 §5） | **625 越 500 硬限——存量债（非本批引入）；拆分候选登记在册**（本批不拆——不扩本批射程；消解窗口 = 测试体系重建轮酌处） |

行数口径 = 文本行实读（读取工具）；`wc -l` 读数各 −1（尾换行差——非漂移）。

**#750 零触腿（增补——§2 :44 验收腿附加项）**：

- **主判**：修后复跑该件（真实 `HOME`）——跑前 ∥ 跑后对真实 `~/.thincoder/sessions/` 取快照（条目集 ∥ mtime ∥ size）⇒ **逐字一致 = 绿**；任一新增 ∕ 变更 ∕ 删除 = 红 ⇒ 使「接线修好 ⇒ 真实目录零触」可判。
- **灵敏度先证**：修前实况即该腿红形态（§2 :43 披露——前跑向真实面落两对临时档）⇒ 腿有判别力。
- **对照臂**：`HOME` ∥ `USERPROFILE` → 临时目录复跑同件 ⇒ 该件全绿且真实面快照同样逐字一致（对齐 `docs/cli/design/CLI-ENTRY.md` §3 测试沙箱纪律：禁触真实 `~/.thincoder`）。
- 读数入 §5（实施轮）∥ §6（核验）。

**#699 新句定稿（§2 :47 计划文本以本行为准——实施轮照此落码）**：
`转口群十九项处理体（本块设置族十六 ∕ 配置写一 ∕ 台账相位两）：转口四档模块，本档零算法副本`
（本块口径 vs 全群设置族十九——档头 `:2-3` ∥ `ipc.mjs:10`；差额三项 = env ∕ tools ∕ `mcp:tools`（`:30-32`）。§2 :50 验收腿「两档源文本含新句」= 含本定稿文本。）

**号 9 · WSL 探针读数（2026-10-01）**：`wsl.exe -l -v` ∥ `-l -q` ∥ `echo ok` = usage + exit 1；`--status` = 空 + exit 50；`reg query HKCU\…\Lxss` = 键不存在 ⇒ **无已装发行版**（真壳 leg 不可补）⇒ 维持 §2 :37 披露制（zsh ∕ fish = 静态字节锁 + §5 如实披露「真壳未跑」；bash 真机腿 = Git Bash `-n` + source 冒烟必跑——不变）。

**自检读数（本轮终态）**：① 九条逐条落位（上表）✓；② 设计档读回：`CLI-ENTRY.md:52` ∥ `:55`（修订残迹零残留）· `MULTI-INSTANCE-COLLAB.md:74` ∥ `:297` ∥ `:442`（新坐标在位）✓；③ 行数实读（读取工具口径）：`conventions.mjs` 320 ∥ crossline 151 ∥ digest 625（与本表一致）✓；④ 探针 = WSL 读数在册（号 9）；⑤ 有意未改 = 产品码 ∥ 需求档（主 agent）∥ 已过面；⑥ 本块 = §2 最新权威面（与上文行文冲突处以本块为准）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审执行（设计评审 · 首轮 · 2026-09-30）**——对象 = 批档 §2（五条：#707 ∥ #704 ∥ #750 ∥ #699 ∥ #700）+ 三处设计档实落（`docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1 · `docs/cli/design/CLI-ENTRY.md` §3–§4 · `docs/core/design/MEMORY.md` §6.14 ∕ §8.3）。

**核验面（抽核 · 实读 2026-09-30）**：#707 单源坐标 `thincoder-core/process-probe.mjs:52`（`DESKTOP_END_RE` 现形 = `/thincoder-desktop/i`——未含 electron/dist 段，假阴性前提成立）；`filterDeadOwners` :155 ∥ `cleanDeadOwners` = `session-slot-claims.mjs:78` ∥ 读面 `peer-instances.mjs:143-155` ∥ 账尾 `ledger-executors.mjs:46 ∕ :95` 全在位。#704 `completions.mjs`（137 行）逐点对账全中（bash 11 行 `\\$(compgen` ∕ 11 处 `"\\$cur"` ∕ `case "\\$prev"` :16 ∕ :22；zsh :45 ∕ :61 ∕ :64 ∕ :69；`\${` 三行 :11-13）；负向锁行 5 行（旧批件 :139 ∕ :140 ∕ :143-145）逐字核实、无第 6 行。#699 两化石句现状逐字核实；计数基准逐名复核为真（`ipc-relays.mjs:34` 注释下 19 导出口 = 8+2+1+5+1+2；`preload.cjs:7 ∕ :11` 白名单口径 8+2+1+6+1+1+1 = 20）；全仓「设置族十二项」恰两处 ⇒ 收正射程完整。「二十四项」四句核算为真（19+2+2+1——对 `ipc.mjs:10`「设置族十九」）。#700 谓词全调用点枚举完整（`conventions.mjs:261` 定义 + `code-sync.mjs:91 ∕ :155 ∕ :426` + `sync-tail.mjs:70`；消费 `code-sync.mjs:268 ∥ docs.mjs:87`）；`file-walk.mjs:94 ∕ :97` 为谓词注入形（零改结论成立）。#750 归因与现盘一致（`@thincoder/core` 入口在；端壳 `session-slots.mjs:41-68` 经 `@thincoder/core/*` 取件 ⇒ 双实例缝面成立；`sandbox()` 仅设核路径缝 = `digest-persistence.test.mjs:261-269`）；该件 9 腿在册（:290/:305/:332/:386/:422/:481/:513/:526/:575）。junction 属性本身 `unverified`（junction-vs-copy 不可判；入口形与取件路径已实证）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 受影响文件行数注（判据 8） | 🟡 | `conventions.mjs` 现读注 295（批档 :62）≠ 现盘实读 **320** 行（同表其余七档 ±1 内吻合 ⇒ 非口径差）；且该档已在 300 建议线上、改后约 335（非注中 ≈310），设计零拆分考量句 | 收正现读 ∕ 预期读数，补该档 300 线档位句（拆分审视结论或免拆依据；500 硬限未触） |
| 2 | 受影响文件行数注（判据 8） | 🟡 | 两「旧批件换写」行现读 = 「—」（批档 :70）：`2026-09-30-crossline-clearance-cli.test.mjs`（151 行）· `2026-09-30-digest-persistence.test.mjs`（**625** 行）——判据要求被改测试档逐档载现读 + 增量 | 补两档现读；625 行档另载档位状态 |
| 3 | 文档卫生 | 🟡 | `CLI-ENTRY.md:52 ∕ :55` 合同面（§3 发射契约）留修订式叙述（「2026-09-30 … #704 收正——…`\$(…)` 非命令替换」∕「同批收正」）——修订残迹应退记录面（:77 已在） | 保留活形条款，删修订标记 ∕ 旧形叙述 |
| 4 | 协调项（跨档滞后） | 🟡 | U1 核实为真：需求档 `docs/core/requirements/MULTI-INSTANCE-COLLAB.md:34` F-MI6 家族 ③ 仍只载 `thincoder-desktop` 路径段，设计面已扩 `node_modules/electron/dist/` 段（`MULTI-INSTANCE-COLLAB.md:56 ∕ :71`）——两面对同族表述不同步；登记正确，但不得越批存活 | 需求面家族枚举同批随动（或指针式） |
| 5 | 验收可验证性 | 🟡 | #750 验收 = 「复跑 9/9 绿」（批档 :44），不能判「缝已对齐」与「仍写真实目录」之别——正是本缺陷形态（本轮自查复现即向真实 `~/.thincoder/sessions/` 落两对档，批档 :43 ∥ U2），对纪律句 `CLI-ENTRY.md:57`（禁触真实 `~/.thincoder`） | 增零触腿（真实 sessions 目录前后对照 ∥ HOME 重定向跑），令「接线修好 ⇒ 真实目录零触」可判 |
| 6 | 存量债（非本批引入） | 🔵 | `2026-09-30-digest-persistence.test.mjs` = 625 行越 500 硬限；本批对其有修改（~4 + ≲30 行）而档位状态未载 | 载档位状态 ∥ 拆分候选登记（不扩本批射程） |
| 7 | 跨档坐标滞后 | 🔵 | `MULTI-INSTANCE-COLLAB.md:74 ∕ §7` 仍指 `cleanDeadOwners` 住 `session-slots.mjs`（as-of `:205-219`）；定义现体 = `session-slot-claims.mjs:78`（`session-slots.mjs:48` 转口 ∕ `:305` 调用）——批档自用现坐标（:21），设计档未随 | 下次触碰该节时收正坐标（定义点 + 转口注） |
| 8 | 清晰度（计数标签） | 🔵 | 新句 `ipc-relays.mjs:34` 用「设置族十六」，本档头（:2-3）∥ `ipc.mjs:10` 载「设置族十九」（全群口径；两值各自块内自洽）——同标签两值，计数审计易复报 | 新句限域（明写本块口径）或对齐全群数 |
| 9 | 验证强度（真壳腿） | 🔵 | #704 zsh ∕ fish 真壳腿以静态字节锁 + §5 披露兜底（批档 :37「WSL 在盘、发行版未验」） | 先探 WSL 发行版；能跑补真壳腿，跑不了再落披露制 |

**计数**：🔴 0 ∥ 🟡 5 ∥ 🔵 4。
VERDICT: pass

### 轮次 2（评审子代理）

**评审执行（设计评审 · 轮次 2 · 跨重启重签放行前终审 · 2026-10-01）**——对象 = 批档 §2（含「修复轮（轮 1）」块）+ 三处设计档实落（`docs/core/design/MULTI-INSTANCE-COLLAB.md` §3.1 · `docs/cli/design/CLI-ENTRY.md` §3–§4 · `docs/core/design/MEMORY.md` §6.14 ∕ §8.3）。

**核验（本轮全数实读）**：轮 1 九条逐条核位——① `conventions.mjs` 读取工具实读 **320**（定义 `:261` ∥ 注释 `:259-260` 在位；>300 档位句在册）⇒ 号 1 落位 ✓；② `2026-09-30-crossline-clearance-cli.test.mjs` 实读 **151**、`:139 ∥ :140 ∥ :143-145` 五行旧形逐字在位 ⇒ 号 2 落位 ✓；③ `CLI-ENTRY.md:52 ∥ :55` 修订残迹零残留（活形条款留；沿革 = `:77`）⇒ 号 3 落位 ✓；④ U1 载「主 agent 笔 ∥ 随本批落地」（本档 :95 ∥ §4 :154 载体随签）⇒ 登记在位（未落地·协调项）；⑤ 零触腿三件（主判 ∥ 灵敏度先证 ∥ 对照臂）在位 ⇒ 号 5 落位 ✓；⑥ 625 档位状态 + 拆分候选登记在册 ⇒ 号 6 落位 ✓；⑦ `MULTI-INSTANCE-COLLAB.md:74 ∥ :297 ∥ :442` 新坐标在位（定义 `:78` ∥ 转口 `session-slots.mjs:48` ∥ 调用 `:305`）⇒ 号 7 落位 ✓；⑧ #699 定稿限域「本块设置族十六」在位；16 ∕ 19 算式对 `ipc-relays.mjs:2-3`（8+2+1+6+1+1 = 19）与 `:30-32` 差额三项实核 ✓；⑨ WSL 探针读数在册（无发行版 ⇒ 维持披露制）✓。另核 #700 底座：`code-sync.mjs` 458 行、四接线坐标 `:91 ∥ :155 ∥ :426 ∥ sync-tail.mjs:65` 全在位、`:68/:69` `--relative` 在位（base=dir 成立）；`file-walk.mjs:94 ∥ :97` 注入形（零改结论成立）；#704 点账逐点全中（137 行）；digest 件 `sandbox()` = 单缝（`:267`，归因成立）；批内件三档均未创建（「拟新增」为真）。

**发现表（轮次 2）**：

| # | 来源 | 面 | 级别 | 状态 | 说明 |
|---|---|---|---|---|---|
| 1 | 轮 2 复核（R5 · 协调项） | 批档 :95 ∥ :154（落点 = `docs/core/requirements/MULTI-INSTANCE-COLLAB.md:34`） | 🟡 | 未闭（非缺陷·不阻塞） | F-MI6 家族枚举随动未落地——已定主 agent 笔 ∥ 随本批落地；不得越批存活（R7e：文档态矛盾不阻放行） |
| 2 | 新增（R4 · 腿环境敏感） | 批档 §2 修复轮 :114 | 🔵 | 新 | 真实 sessions 目录跑前 ∥ 跑后「逐字一致」判据 ⇒ 任一并发活实例回合末写 manifest（`saveSession` 每回合重写——`MEMORY.md:61`）即假红；建议判据收在本次 cwd-hash 族 ∕ 明载「并发扰动 ⇒ 重跑」归因规则 |
| 3 | 新增（R7c · 读数口径） | 批档 §2 修复轮 :110 ∥ :61 ∥ :108 | 🔵 | 新（±1 容差内） | 抽核两档与表注差 1：`process-probe.mjs` 表注 163（读取工具实读 164）· digest 件表注 625（实读 626）；轮 1「±1 内吻合」同判，不影响增量 ∕ 档位判断 |

**计数**：🔴 0 ∥ 🟡 1（协调项）∥ 🔵 2（新增）。
VERDICT: pass

## §4 用户批准（主 agent）

**批准（全链自动授权 · 代签）**——用户 2026-10-01 令（全链自动授权：代签 ∥ 代点火 ∥ 代派）+ 本刻「A/B/D 先开始处理」续令（2026-10-01 13:0x）；依 §3 轮次 1 = pass（🟡5 · 🔵4——九号全修在册）⇒ 批准实施。

**载体随签**：U1（需求档 F-MI6 家族枚举随动）= 父侧笔随签落地 ∥ U2（真实 `~/.thincoder/sessions/` 两对测试临时档）= 父侧清理 ∥ U3（`desktop-debug.cmd` 已落事实）= 计入 §5 实施记录（由实施舱如实登记）。

**签发状态**：设计 token 面随派单核（跨重启有效性以机制回执为准——被拒则重走评审）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（四条全量落地 + #750 归因/退役登记（父侧裁）；批内件 11/11 ∥ 5/5 ∥ 2/2 绿；内审 pass ∥ 代码评审 pass（终态 clean））



**实施记录（eng-coder · 2026-10-01）**

**交付摘要**：五条中四条全量落地（#707 ∥ #704 ∥ #699 ∥ #700 + 批内件三档全绿）；#750 = 归因完成 + 件退役登记（父侧裁，归因见下）。跨批两件按父侧裁分置：crossline 5 行 = 父侧执行（字面清单在册）；digest-persistence = 退役、零触。越表项 = 零。

**逐号落点（file:line = 终态实读）**
- #707：`thincoder-core/process-probe.mjs:56`（`DESKTOP_END_RE` 扩 `node_modules[\\/]electron[\\/]dist[\\/]` 段）+ `:49-55` 注释收正（实测形 + 2026-09-30 + 台账 #707 + 超集披露）；两消费面 `:63`（isProductProc）∥ `:71`（classifyEnd）单源随动（零第二套正则）。
- #704：`thincoder-cli/src/completions.mjs` —— bash 11 行 `$(compgen`（`:18 ∥ :21-24 ∥ :27-29 ∥ :31 ∥ :32 ∥ :34`）∥ 11 处 `"$cur"` ∥ 2 处 `case "$prev" in`（`:20 ∥ :26`）；zsh 4 处直写（`:49 ∥ :65 ∥ :68 ∥ :73`）；`\${COMP_WORDS…}` 三行保留（`:15-17`）；fish 零改；头注 `:5-8`（发射契约自限：bash 直写形零反斜杠 ∥ 余反斜杠仅续行保留 ∥ `\${` 险位例外）。
- #699：`thincoder-desktop/src/main/ipc-relays.mjs:34`（定稿句逐字：转口群十九项处理体（本块设置族十六 ∕ 配置写一 ∕ 台账相位两）：转口四档模块）∥ `thincoder-desktop/src/preload/preload.cjs:11`（设置族二十项句逐字）。
- #700：`thincoder-core/conventions.mjs:265-276`（`isExcludedRelPath(rel, decl, base = null)`：resolve+relative 换算至 `decl.root` ∥ 越界（`..` 头∕根外绝对形）⇒ 不命中 ∥ 缺省=根相对等义 ∥ 注释同拍）；起效点 `thincoder-core/memory/code-sync.mjs:91 ∥ :155 ∥ :426` ∥ `thincoder-core/memory/sync-tail.mjs:66 ∥ :71`（`sweepStaleRows` base 参）；消费携 base = `code-sync.mjs:268 ∥ docs.mjs:87`。
- 批内件三（新 · 不进仓套件）：`docs/batches/2026-09-30-defect-fixes-core.test.mjs`（197 行 · 11 腿）∥ `-cli.test.mjs`（99 行 · 5 腿）∥ `-desktop.test.mjs`（60 行 · 2 腿）。

**实跑读数（仓根 `thincoder/`；各件直接 `node --test <file>`）**
- core 件 ⇒ **11/11**（L707-1..4：实测相对形判活 ∥ 误删风险面负控 + 三对照臂 ∥ 五态回归 ∥ 显示面；L700-1..6：等义 ∥ 正腿 ∥ 反腿 ∥ 越界 ∥ 接线两面 ∥ 缺省）。
- cli 件 ⇒ **5/5**（MS-2 三 shell 旗标 + 顶层 ledger ∥ bash 直写形逐字 ∥ zsh 分派行 ∥ 旧形零残留 ∥ fish 锁）。
- desktop 件 ⇒ **2/2**（新句在场 ∥ 旧句零命中 ∥ 计数自证：注释下 19 导出口 ∥ 白名单设置族 20 = 8+2+1+6+1+1+1）。
- #704 真机腿（Git Bash `C:\Program Files\Git\bin\bash.exe`，sha-free）：发射 bash 脚本 `bash -n` ⇒ **exit 0**（语法洁）∥ `source` 冒烟 ⇒ `complete -p thincoder` 回读 `complete -F _thincoder thincoder`（注册成立）。**zsh ∥ fish 真壳未跑**（WSL 无发行版——设计披露制在册，`:123`）。
- 零残留：源面 grep（`thincoder-*/**/*.{mjs,js,cjs}`）`设置族十二项` = 0 ∥ `转口三档模块` = 0；`completions.mjs` 含 `\$` 仅头注说明形 + `:15-17` 险位三行（发射面零 `\$` 由 cli 件机检）。
- 真实面零触：诊断跑（HOME 重定向）与 scratch 实验（真实 HOME）前后对 `~/.thincoder/sessions/` 快照 = **零新增 ∥ 零变更**。
- 仓套件零跑（父侧收口单跑——纪律）。
- crossline 件现读（我侧改动后 ∥ 父侧换写前）⇒ 3/4（T-XL8 红 = 旧字节锁 5 行，按预期）；**换写后绿 = 未实跑**（以等价 scratch 预演替代：同内容 + 同 5 行替换 ⇒ 4/4 绿）。

**#750 归因（父侧裁：归因完成 + 件退役登记）**
- 复跑签名（2026-10-01）⇒ **4/9**（红：腿 2 ∥ 3 ∥ 4 ∥ 6 ∥ 7）。
- 逐腿归因（scratch 缝对齐实验——`sandbox()` 兼设端壳 re-export 缝 ⇒ 6/9）：

| 腿 | 无缝对齐 | 缝对齐后 | 红因 |
|---|---|---|---|
| 腿 2 | 红（:350 回执 false——端壳读真面 slot-missing） | **红**（:373 痕元素恰一枚 4≠1） | 接线下游 + **语义撤销**：自然形行族每轮 1–4 行皆携 `data-digest`（无轮容器）——旧「痕元素恰一枚 ∥ 位次」形已随 #765 拆除 |
| 腿 3 | 红（:399 留档块入块序 0≠5——同 slot-missing） | **绿** | 纯接线（块重建语义仍立） |
| 腿 4 | 红（:436 `.some` of undefined——同 slot-missing） | **红**（:453 `chatStream.alignPlan is not a function`） | 接线下游 + **API 面消亡**（alignPlan 随后续批移除；「痕随窗摘除」与自然形「零摘除」相抵） |
| 腿 6 | 红（:543 alignPlan 非函数） | **红**（同） | **API 面消亡**（alignPlan ∥ 旧 settleFrame 形） |
| 腿 7 | 红（ENOENT——端壳写真面） | **绿** | 纯接线 |

- **退役判由**：①断言对象不存在（座次机随 #765 拆除；alignPlan/旧 settleFrame 随后续批移除）；②缝对齐只解接线面（腿 3 ∥ 7 + 腿 2/4 初红），余红 = 语义撤销/API 消亡（非接线可解）；③缝对齐补丁 ∥ 零触腿均不落（父侧裁）；④件自带断代标（`2026-09-30-digest-persistence.test.mjs:3`：2026-10-01 · #765 拆批 · 留档对照·勿复跑）与批复一致。
- **覆盖关系（与 #765/#768/#769 新件）**：#765 digest-teardown 件（7/7 腿）覆盖座次机拆除后的行族形与记录面；#768 natural-form 件（8/8 腿）覆盖自然形行族 + 重载复列；#769 audit-remediation 件（39/39 腿）覆盖复核收正面；本件独有面（记录直通 ∥ 折叠 ∥ 恢复）× 新件三已同覆（记录流转 + 折叠 + 复列）——无覆盖洞。
- **偏差登记（设计前提不成立 · 缘于批间演化）**：§2 条 3 写作（2026-09-30）时「缝对齐 ⇒ 9/9」成立于当时盘面；#754/#765/#768（2026-10-01 03:55–08:0x）拆除座次机 ∥ 自然形收正后腿断言对象演进 ⇒ 9/9 不可达（非接线可解）⇒ 父侧裁改判「归因完成 + 件退役登记」。
- U2 登记：真实 `~/.thincoder/sessions/` 两对临时哈希档（20:54 ∥ 23:48 落）= 父侧已清（本席复核盘面零残留）。

**crossline 5 行清单（父侧执行；行号 = 现读；命令集字面零变——仅去转义）**

| 行 | old ⇒ new |
|---|---|
| :139 | `bash.includes('ledger) case "\\$prev" in') && bash.includes('"migrate audit" -- "\\$cur"')` ⇒ `bash.includes('ledger) case "$prev" in') && bash.includes('"migrate audit" -- "$cur"')` |
| :140 | `zsh.includes('ledger) case "\\$words[2]" in')` ⇒ `zsh.includes('ledger) case "$words[2]" in')` |
| :143 | `bash.includes('COMPREPLY=( \\$(compgen -W "tui chat acp memory sync reindex distill upgrade completion session ledger -v --version -h --help" -- "\\$cur") )')` ⇒ 同句 `\\$(` → `$(` ∥ `\\$cur` → `$cur` |
| :144 | `…'COMPREPLY=( \\$(compgen -W "list search put remove sweep" -- "\\$cur") )'` ⇒ 去转义同形 |
| :145 | `…'COMPREPLY=( \\$(compgen -W "--origin= --dry-run --confirm" -- "\\$cur") )'` ⇒ 去转义同形 |

**U3 登记**（§4 载体随签）：`scripts/desktop-debug.cmd` 绝对路径启动形 = 已落事实——`:5` `cd /d "%~dp0..\thincoder-desktop"` ∥ `:7` `"%CD%\node_modules\electron\dist\electron.exe" --remote-debugging-port=9222 --remote-allow-origins=* .`；git 归属 `d7f7612b9`；本批零触。**注（供父侧酌处）**：`:6` 注释括注「相对路径形会判成非本产品」已被 #707 超集覆盖（相对形现亦命中 electron/dist 段）⇒ 该括注语义过期；本批禁扩面未动。

**行数对账（读取工具口径；±1 容差在册）**

| 档 | 批档预期 | 终态实读 | 注 |
|---|---|---|---|
| `process-probe.mjs` | ≈172 | 168 | 注释 + regex |
| `conventions.mjs` | ≈335 | 330 | 谓词 + 注释 |
| `code-sync.mjs` | ≈461 | 458 | 四起效点 = 行内改（零增行） |
| `sync-tail.mjs` | ≈84 | 82 | base 参 + 注释 |
| `docs.mjs` | ≈438 | 437 | 行内携 base |
| `completions.mjs` | ≈139 | 141 | 头注 4 行 |
| `ipc-relays.mjs` ∥ `preload.cjs` | 71 ∥ 80 | 71 ∥ 81 | 注释行换文（±1） |
| 批内件三（core ∥ cli ∥ desktop） | ≈230 ∥ ≈100 ∥ ≈60 | 197 ∥ 99 ∥ 60 | 紧写，腿全 |

**内审与代码评审（本会话内闭环）**
- explore 发散审计（1 轮）：**pass**——四类偏差（部分实现 ∥ 静默简化 ∥ 设计偏差 ∥ 越表）**零**；2 观察：§5 盘面空缺（即本段）∥ 头注宽述（已修——措辞自限，comment-only）。
- advisor 代码评审（1 轮）：**pass**（🔴 零；4×🟡 + 2×🔵）；固定轮 1（自修）：L700-5a 腿判别力修复——`build` 属内建 SKIP_DIRS（`code-sync` 系 `file-walk.mjs:26 ∥ :94` 先于谓词剪枝）⇒ 夹具改 `sub/gen` + 增「零谓词照列」对照臂 ⇒ 复跑 11/11 绿。
- 遗留（非阻塞，供收口轮酌处）：`conventions.mjs` 330 ∥ `code-sync.mjs` 458 ∥ `docs.mjs` 437 越 300 建议线（存量债；code-sync ∥ docs 档位审视句未载）∥ `MEMORY.md:518` 谓词签名两参旧形（与 `:519` 换算句并存）∥ crossline 换写后复跑（父侧落盘后）。
- **终态 = clean**（无未决阻塞项）。

**决策透明表**

| # | 决策 | 依据 / 披露 |
|---|---|---|
| 1 | crossline 5 行 = 父侧笔 | 写门实证拒（cross-batch batch-record write：「the parent agent handles other batch records」）；父侧裁定同向 |
| 2 | digest-persistence = 退役、零触 | 父侧裁（前提不成立）；归因表 + 覆盖关系在册 |
| 3 | scratch 实验（`.thincoder/tmp/dx750-scratch.test.mjs` ∥ `dx704-crossline-scratch.test.mjs`）= 诊断专用、用后即删 | 非交付面；真实面零触（快照实证）；盘面复核零残留 |
| 4 | #704 头注措辞自限（comment-only） | 内审观察 #2 吸收；零语义 |
| 5 | L700-5a 夹具改名 + 对照臂 | 评审发现 #3 吸收；行为断言不变（判别力增） |

## §6 验证与收口（父代理）

**收口轮（父侧 · 2026-10-01）**：① **父侧亲跑复验**：批内件三段独立复跑 = **18/18 绿**（core 11 ∥ cli 5 ∥ desktop 2）；`crossline-clearance-cli.test.mjs` 5 行换写（父侧执行——字面照 #10 清单）后 **4/4 绿**（T-XL1/2/6/8——「换写后仍绿」达成，原「未实跑」注记消解）。② **crossline 父侧笔回执**：`:139 ∥ :140 ∥ :143 ∥ :144 ∥ :145` 去转义（命令集字面零变、零增删——仅 `\\` 剥除）。③ **#750 改判交付**：归因完成（逐腿表 §5）＋ 件退役登记（断代留档——不落缝对齐 ∥ 不落零触腿）；偏差（设计前提不成立·缘于批间演化）在册；真实 HOME 残档 U2 = 父侧已清（复核零残留）。④ **尾项**：`MEMORY.md:518` 签名三参收正（父侧笔〔③类〕+ 变更记录）；`scripts/desktop-debug.cmd:6` 过期括注收正（#707 超集覆盖——可执行行零变）；三档 >300 存量债（`conventions.mjs` 330 ∥ `code-sync.mjs` 458 ∥ `docs.mjs` 437）= 登记 **#786**（拆分预案·触发式）。⑤ **台账结算**：#707 ∥ #704 ∥ #699 ∥ #700 ∥ #750 → **已核销**（5 笔——随本收口轮落地）。⑥ **D7 对账**：角色表 §1–§6 ✓ ∥ 状态行 ✓ ∥ 计数（5 条 ∥ 8 产品档 ∥ 3 批内件）✓ ∥ 指针（批档 ↔ 台账 ↔ 修复面）✓ ∥ 变更记录（MEMORY.md ✓）∥ 遗留（zsh ∕ fish 真壳 = 披露制在册 ∥ 越线债 #786 在册）。**收口完成 ⇒ 冻结。**
