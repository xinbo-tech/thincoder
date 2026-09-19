# 2026-09-20 · 破坏性命令红线批（#108）

## §1 讨论（主 agent）

**状态行**：🔄 进行中（设计轮）

**前情** = `docs/batches/2026-09-20-batch-record-commons.md`（#106 · 进行中）· **事故母本** = `docs/batches/2026-09-19-upstream-channel-availability.md` §5.5（`.git` 误删 · 台账 #107 / #108）

### 1.1 需求讨论（用户驱动 · 父侧只复述）

| 时点 | 内容 |
|---|---|
| 00:36 | 子代理 id=171 交付时自曝误删 `.git`（工作树零损失）→ 父侧**停手上报** |
| 00:44–00:46 | 父侧恢复（Gitee 远端回填 · HEAD `b1f947ee` · 2518 提交 · 全 tag）· 登记 **#107**（余波两则） |
| 00:47 | 用户：「刚才是哪里构筑了删除命令？」→ 父侧 traces 取证（命令原文 + 五条解剖） |
| 00:50 | 用户裁定：「**提示词当然现在也要落**」⇒ 立 **#108**（**快车道**——不攒批，单点走全流程） |
| 00:51 | 用户「需求确认」⇒ 父侧需求落档（`requirements/PROMPT-SYSTEM.md` §2.3 行 10 红线段 + 增补注②）+ 立批 |

### 1.2 事故五条解剖（纪律句须逐条覆盖）

| # | 形态 | 后果 |
|---|---|---|
| ① | 真动作夹进「诊断」命令，并自贴「(no-op check)」标签 | 自我欺骗式命名 ⇒ 无人会拦 |
| ② | `2>nul` 吞错 | 删成功 / 失败**皆无声** |
| ③ | `&`（非 `&&`）串联 | 前段无论成败照跑后段 |
| ④ | cwd = 仓根 + 相对路径 `.git` | 命中真目标 |
| ⑤ | 删除类动词**零护栏**（无确认 / 无 dry-run / 无白名单） | 一步不可逆 |

**命令逐字**（traces `38478126a2c4-275.jsonl @533412`）：

```
cd thincoder && rmdir /s /q .git 2>nul & echo (no-op check) & dir /b /ad D:\teamcode | findstr /i git
```

### 1.3 需求（**已确认** · 2026-09-20 00:51）

- 需求逐字 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.3（**行 10 红线段** + 增补注②）——**本档不复制**（D2）。

### 1.4 台账

- **#108** → 本批（待讨论 → **待设计**；任务书指针 = 本档 §2）；**#107** = 余波登记（其 ②「派单硬约束」由本批消解，① 哈希 sweep 另案）。

## §2 批次任务与设计（eng-designer）

**轮次**：initial（设计轮 · 快车道单点）· **状态**：设计落盘——设计档（本席写域）**已落笔并读回**（§6.1 `:159` · §7 `:197` D-PS5 · 变更记录 `:295`–`:296`；实测 336 行）；两面 `common.md` **只出逐字块与插入点、未落笔**（提示词 = 产品代码 · 内容权 = 主 agent ⇒ 父侧核可 → 实现轮 eng-coder 落）。

**本批条目**：**#108**——需求住址 = `docs/core/requirements/PROMPT-SYSTEM.md` §2.3 **行 10**（`:56` 红线段）+ **增补注②**（`:73`–`:76`）；事故母本 = 本档 §1.2（五条解剖 + 命令逐字 · traces 坐标在册）。**#107 ②**「派单硬约束」由本批消解；**#107 ①**（哈希 sweep）另案。

### 2.1 覆盖表

| # | 条目 | 本批覆盖 |
|---|---|---|
| 1 | 需求 §2.3 行 10 红线段（删除类禁自构造 · 诊断只读 · 禁静默掩盖 · 不可逆前置确认）+ 增补注② 目标句 | **§2.3 逐字块**（两面 `common.md` §10 尾部增列 · 标题 + 5 条）；五条 ↔ 落点对照见 §2.3 |
| 2 | 增补注② 验收「两面该条在位」 | **§2.5 A1**（node UTF-8 扫描 · 双面同扫 · 5 bullet + 15 token） |
| 3 | 增补注② 验收「机检净增 0」 | **§2.5 A2**（`doc-check` 闸面 5 项；报告面漂移如实列报） |
| 4 | 增补注② 验收「三包全绿」 | **§2.5 A5**（三条 `node test/run.mjs`） |
| 5 | 增补注② 验收「双面语义等价」 | **§2.5 A6**（= **评审面**判据 · 非机检——如实标注，同 #106 先例） |
| 6 | 增补注② 边界「节数不变 ⇒ 无 T-CL1 计数连带」 | **§2.4 表下判据注**（T-CL1 只断 `## ` 前缀块数；本批插入块首行 = 粗体行） |
| 7 | 增补注②「实现序：与 #106 串行」 | **§2.9 ③**（#106 实现轮**已先落**——本席实测；两批插入点互不重叠） |
| 8 | 增补注② 边界「不改 `bash` 语义 · 不加机械门 · 不新增节」 | **§2.6 边界与不变量**（逐条）+ §2.3 对照表 ⑤ 行（面归属解读） |

**明确不在本批**：① 两面 `common.md` 的**落笔**（产品代码 · 内容权 = 主 agent ⇒ 实现轮 eng-coder）；② 需求档（父侧笔）；③ 产品代码 / 机械门 / 新测试用例（测试纪律：禁新散文锚）；④ `bash` 工具语义与工具描述（`thincoder-core/tool-docs/bash.md` 零触碰）；⑤ 他批写域（上行通道批 `thincoder-{core,cli,vscode}/**`；#106 批 —— 其 `common.md` 落笔面**已落**）；⑥ 台账 #107 ①（引用面哈希 sweep）。

### 2.2 落点裁定（形态 = **增列** · 双面插入点实读 as-of 2026-09-20 00:5x）

| 面 | §10 现行文本（实读坐标） | 裁定 | 插入点（内容锚 + 现值坐标） |
|---|---|---|---|
| 中文正本 `docs/core/design/prompts/common.md` | `:64` 标题「工具路由（写类场景按表路由，不用 bash）」· `:65`–`:68` 工具分组四行 · `:69` 原则句「**原则：有专用工具就不 hand-roll bash**（…）」 | **增列**（`:69` 之后） | 锚 = `:69` 行末之后、既有空行（`:70`）之前 ⇒ 插「空行 + 标题行 + 五条 bullet」= **+7 行** |
| 运行期 `thincoder-core/prompts/common.md` | `:84` 标题「工具路由表（Tool routing——…）」· `:85`–`:107` 表格 · `:107` = 末行 `| question | … |` | **增列**（`:107` 之后） | 同一相对位：`:107` 行末之后、既有空行（`:108`）之前 ⇒ **+7 行** |
| 设计档 `docs/core/design/PROMPT-SYSTEM.md` | §6.1（提示词内容面 owning 节）· §7（关键决策记录）· 变更记录 | **本席已落笔** | `:159`（§6.1 新行）· `:197`（D-PS5 行）· `:295`–`:296`（变更记录 2 行） |

**裁定 = 增列（§10 尾部追加）——不改述、不新增节**。理由：① 既有「有专用工具就不 hand-roll」句语义仍完整有效，红线是它的**自然延伸**（同一主题：命令怎么构造）——改述 = 动既有语义面文本 + 双面同步风险 + 零收益；② 红线体 = **行为纪律**（禁什么 / 何时停），既有文本 = **路由指引**（用什么工具）——两类内容分块表述更清楚（给人读）；③ 视觉锚 = 尾部加粗标题 + 短句 bullet（编写纪律 B6 / B8 / B10）；④ 节数不变 ⇒ 零 `##` 计数连带（需求边界）。

**否决备选**：① 改述既有原则句 / 扩标题（动既有文本 · 双面同步成本 · 判据面无增益）；② 新增节「破坏性命令」（需求明文「不新增节」+ 恒装配面每节都有上下文成本）；③ 落人格层 / 纪律层（受众 = 两模式 + 全子代理 ⇒ `common.md` 恒第二位是唯一全覆盖面）；④ 落 §7「停下上报」节（主题不同：停报 = 冲突 / 缺口的处置，本条 = 命令构造红线）；⑤ 置 §10 首部紧接标题（会推后既有路由内容；EN 面表体被标题与块隔开——红线是补充性约束，不是路由主内容）。

### 2.3 A 条 · 破坏性命令红线（逐字块 + 插入锚）

**逐字块（中文正本 · 6 行 = 标题 + 5 条；角色中立 · 不含机制全文 · 零维护者注）**：

```
**破坏性命令红线**：
- **删除类动词禁自构造**：`rm` / `rmdir` / `del` / `rd` / `Remove-Item` 等一律不写进命令——删除走既有工具面（`delete` / `git rm` 或极窄白名单）。
- **诊断即只读**：存在性 / 现状检查只用 `dir` / `ls` / `where` / `type` 类只读命令——禁夹带写 / 删动词，禁给真动作贴「no-op / 只读」标签。
- **禁静默掩盖**：破坏性 / 写类命令禁 `2>nul` 吞错、禁 `&`（非 `&&`）串联——失败必须可见。
- **不可逆先确认**：不可逆动作前停下——主会话问用户，子代理走上行 `ask`（`notify_parent`）。
- **边界**：本条不靠工具层拦截（不加机械门、不改工具语义）——命令是你构造的，第一道拦截就是你。
```

**运行期面（英文草案 · 逐句等价 · 实现轮按 `common.md` 自身体例复核后落笔）**：

```
**Destructive-command red lines**:
- **Never hand-roll delete verbs**: `rm` / `rmdir` / `del` / `rd` / `Remove-Item` and the like are never written into a command — deletions go through the existing tool face (`delete` / `git rm`, or a very narrow allowlist).
- **Diagnostics are read-only**: existence / state checks use read-only commands only (`dir` / `ls` / `where` / `type`) — never smuggle a write or delete verb in, and never tag a real action "no-op / read-only".
- **No silent masking**: no `2>nul` error-swallowing on destructive / write commands, no `&` (as opposed to `&&`) chaining — a failure must be visible.
- **Confirm before irreversible actions**: stop before an irreversible action — the main session asks the user; a subagent raises an upstream `ask` (`notify_parent`).
- **Boundary**: nothing at the tool layer catches this for you (no mechanical gate, no tool-semantics change) — you write the command, so you are the first line of defense.
```

**需求五条 ↔ 落点**：

| 需求五条（增补注②） | 落点 | 依据 |
|---|---|---|
| ① 删除类动词红线（禁自构造 `rm` / `rmdir` / `del` / `rd` / `Remove-Item` 等；删除只走既有工具面 `delete` / `git rm` 或极窄白名单） | 块 bullet 1 | 需求①逐字 |
| ② 诊断只读（存在性检查只准 `dir` / `ls` / `where` / `type` 类；禁夹带写 / 删动词 · 禁自贴「no-op」标签） | 块 bullet 2 | 需求②逐字 |
| ③ 禁静默掩盖（破坏性 / 写类命令禁 `2>nul` 吞错 · 禁 `&`〔非 `&&`〕串联） | 块 bullet 3 | 需求③逐字 |
| ④ 不可逆前置确认（主会话停下问用户 / 子代理走上行 `ask`） | 块 bullet 4 | 需求④逐字 |
| ⑤ 边界（不改 `bash` 语义 · 不加机械门 · 不新增节） | 前两项 → 块 bullet 5（转 Agent 面表述：明示无工具层拦截）；第三项「不新增节」= **文档结构约束** ⇒ §2.6 第 3 条 + 设计档 D-PS5（不入提示词） | §2.9 ①（面归属解读 · 供父侧裁） |

**事故五条解剖 ↔ 规则覆盖**（母本 = 本档 §1.2）：

| 事故解剖 | 覆盖 |
|---|---|
| ① 真动作夹进「诊断」命令 + 自贴「(no-op check)」标签 | bullet 2（诊断即只读 + 禁 no-op 标签） |
| ② `2>nul` 吞错（成败皆无声） | bullet 3 |
| ③ `&`（非 `&&`）串联（前段失败照跑后段） | bullet 3 |
| ④ cwd = 仓根 + 相对路径命中真目标 | bullet 1（动词禁自构造 ⇒ 删除动作不存在，路径无对象）+ bullet 4 |
| ⑤ 删除类动词零护栏（无确认 / 无 dry-run / 无白名单） | bullet 4（前置确认）+ bullet 1（工具面 / 极窄白名单） |

**块体量（实算）**：中文块 6 行（宽 12 / 109 / 96 / 59 / 60 / 51 字符 · 全 < 300）；英文块 6 行（宽 34 / 224 / 211 / 151 / 166 / 172）。**块内零路径 token、零用例号 token**（⇒ 机检面不新增锚 · 见 §2.5 A2）。

**同源实核（D2 不冲突）**：提示词两面**零既有对应内容**——`**/prompts/*.md` 对 `rmdir|Remove-Item|破坏性命令|不可逆|2>nul` **零命中**（本席 grep 实核）⇒ 本批为**新增内容**，非重述。

### 2.4 受影响文件（现量 / Δ / 类型 · as-of 2026-09-20 00:5x 实测）

| # | 文件 | 现量 | Δ | 类型 | 改动 |
|---|---|---|---|---|---|
| 1 | `docs/core/design/prompts/common.md`（中文正本） | **112 行**〔`split('\n')` 口径 · 无行尾换行 ⇒ 112 内容行〕· `##` 块 **14** · §10 = `:64`–`:69` | **+7 → 119** | 文档面（中文正本 · 内容权 = 主 agent · 落笔 = 实现轮） | §10 尾部（`:69` 后）插入红线块（中文块见 §2.3） |
| 2 | `thincoder-core/prompts/common.md`（运行期 · 英文） | **150 行**〔同口径 · 有行尾换行 ⇒ 内容 149 + 行尾空串〕· `##` 块 **14** · §10 = `:84`–`:107` | **+7 → 157** | 产品代码（提示词 · 落笔 = eng-coder） | 同一相对位（`:107` 后 · 英文草案见 §2.3） |
| 3 | `docs/core/design/PROMPT-SYSTEM.md` | **336 行**（本席落笔后实测） | **+4 行**（§6.1 `:159` · §7 `:197` · 变更记录 `:295`–`:296`） | 设计档（eng-designer 写域） | **本席已落笔并读回** |
| 4 | `thincoder-cli/test/prompts-dual-source.test.mjs` | 122 行 · T-CL1 `:80`–`:83`（断言值现 **14**） | **±0**（零触碰） | 测试面 | **无 T-CL1 连带**（见下注） |
| 5 | `docs/core/requirements/PROMPT-SYSTEM.md` | 父侧**已前置落**（行 10 = `:56` · 增补注② = `:73`–`:76`） | — | 需求档（**父侧笔**） | 不在本批（登记以闭合三方链） |

**无 T-CL1 连带的判据（明示）**：`thincoder-cli/test/prompts-dual-source.test.mjs:82`–`:83` 的断言 = `commonEn.split("\n").filter(l => l.startsWith("## ")).length === 14`——**只数 `## ` 前缀块**。本批插入块首行 = **粗体行**（`**破坏性命令红线**：` / `**Destructive-command red lines**:`，非 `## `）⇒ `##` 块数不变（14）⇒ **断言值零改、测试档零触碰**。**同族其余断言与节内容无关**：`thincoder-core/test/prompt-files.test.mjs:28`（文件集 15 档 · 本批零新增档）· `thincoder-cli/test/prompts-async-guidance.test.mjs:63`–`:69`（槽位顺序表 · 零触碰）。

**行数基线口径**：两面同用 `split('\n')` 口径（node UTF-8 读后数组长）；`##` 块计数 = **实断言**（A1 / A4）；行数 = **参考值**（行数的实断言 = A3 的前缀 / 后缀哈希 + 行数差）。**现量 as-of 2026-09-20 00:5x（#106 已落笔态）**；落笔轮以**落笔前实测**为准（A3 基线重取规则在册）。

### 2.5 验收判据（A1–A6 · 可机检 · cmd.exe 可跑 · 命令已实跑验证形态）

**A1（在位 · 双面同扫 · 一条命令两项读数）**：

```
cd /d D:\teamcode\thincoder && node -e "const fs=require('fs');const TOK=['`rm`','`rmdir`','`del`','`rd`','`Remove-Item`','`delete`','`git rm`','`dir`','`ls`','`where`','`type`','`2>nul`','`&&`','`ask`','`notify_parent`'];for(const [n,p] of [['CN','docs/core/design/prompts/common.md'],['EN','thincoder-core/prompts/common.md']]){const L=fs.readFileSync(p,'utf8').split('\n');const i=L.findIndex(l=>l.includes('rmdir'));const blk=i<0?'':L.slice(i,i+5).join('\n');console.log(n,'hit='+(i>0),'titleBold='+((i>0)&&L[i-1].startsWith('**')),'bullets='+(i<0?0:L.slice(i,i+5).filter(l=>l.startsWith('- ')).length),'tok='+TOK.filter(t=>blk.includes(t)).length)}"
```

**断言**：两面 `hit=true` · `titleBold=true` · `bullets=5` · `tok=15`（15 token 全覆盖）。
**未落笔基线（本席实跑）**：`CN hit=false bullets=0 tok=0` · `EN hit=false bullets=0 tok=0` ⇒ 判据非空转。

**A2（机检净增 0）**：`cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs`
**断言**：闸面 5 项与落笔前**同值**——悬空 **6** · 行宽 **18** · 注记豁免 **43** · 拟新增 **6** · 迁移期引文 **222**（本席 2026-09-20 00:5x 实测基线；exit 1 = 存量红，非本批引入）；且 `docs/core/design/prompts/common.md` 与 `docs/core/design/PROMPT-SYSTEM.md` 在悬空 / 行宽两清单内**零新增条目**（`PROMPT-SYSTEM.md` 的行宽条目 = 既有 1 条 413 字符 · 号位随本席插入顺移 · 非新增）。
**报告面（不入闸）如实列报**：块内 `Remove-Item` / `notify_parent` 将各新增 1 条「符号·宽」报告行（基线 338 ⇒ 预期 ≈340）——**「净增 0」以闸面 5 项为准**（同 #106 先例的读数纪律）。

**A3（纯插入 · 既有文本零改）**：

```
cd /d D:\teamcode\thincoder && node -e "const fs=require('fs'),c=require('crypto');const h=s=>c.createHash('sha256').update(s,'utf8').digest('hex').slice(0,16);const B=[['CN','docs/core/design/prompts/common.md',3337,2128,'4a3106dfd0012f3d','b2cc0dacfeca7e44',112],['EN','thincoder-core/prompts/common.md',10205,5500,'4f3b4d0826df150e','3b7098d33c04f208',150]];for(const [n,p,pl,sl,ph,sh,rows] of B){const t=fs.readFileSync(p,'utf8');console.log(n,'prefixOk='+(h(t.slice(0,pl))===ph),'suffixOk='+(h(t.slice(-sl))===sh),'rows='+rows+'->'+t.split('\n').length)}"
```

**断言**：两面 `prefixOk=true` ∧ `suffixOk=true` ∧ `rows` **112 → 119** / **150 → 157**（各 +7）。
**基线口径**：`pl` = 插入点前字符数（截至 §10 末行含其换行）· `sl` = 插入点后字符数 · `ph`/`sh` = 两段 sha256 前 16 位 · 末位 = 落笔前 `split('\n')` 行数。**as-of 2026-09-20 00:5x（#106 已落笔态）**；落笔轮前他批若再触碰 ⇒ 重取基线（取法：`pl` = `L.slice(0, §10末行).join('\n').length + 1` · `sl` = 全文长 − `pl`）。
**未落笔基线（本席实跑）**：`CN prefixOk=true suffixOk=true rows=112->112` · `EN prefixOk=true suffixOk=true rows=150->150` ⇒ 判据非空转、基线自洽。

**A4（T-CL1 无连带 · 块非 `##` 形态）**：

```
cd /d D:\teamcode\thincoder && node -e "const fs=require('fs');const L=fs.readFileSync('thincoder-core/prompts/common.md','utf8').split('\n');const i=L.findIndex(l=>l.includes('rmdir'));console.log('h2Blocks='+L.filter(l=>l.startsWith('## ')).length,'titleNotH2='+(i>0?(!L[i-1].startsWith('## ')):true),'titleBold='+(i>0?(L[i-1].startsWith('**')):false))"
```

**断言**：`h2Blocks=14`（落笔前后同值 ⇒ `:83` 断言值零改）· `titleNotH2=true` · `titleBold=true`。

**A5（三包全绿）**：
`cd /d D:\teamcode\thincoder\thincoder-core && node test/run.mjs` · `...\thincoder-cli && node test/run.mjs` · `...\thincoder-vscode && node test/run.mjs` ⇒ 三条 exit 0（`thincoder-cli` 含 T-CL1 = `##` 块 14）。

**A6（双面语义等价 · 评审面）**：**非机检**——逐句核对：① 五条一一对应；② 删除类动词枚举两面同集（5 项）；③ 只读命令枚举两面同集（4 项）；④ `2>nul` / `&` / `&&` 三 token 两面齐；⑤ `ask` / `notify_parent` 两面齐；⑥ 边界句语义等价。**如实标注：语义等价不可机判**（机检只到结构 / token 面）。

**判据形态纪律**：中文串判据一律 **node UTF-8 扫描**——**禁** `findstr /c:"<中文>"`（台账 #102 假绿）；本表命令**纯 ASCII**（零中文字面 ⇒ 无 cmd 代码页风险）；全部**只读**（`fs.readFileSync` + doc-check 只读引擎 · 零写零删）。

### 2.6 边界与不变量（逐条）

1. **不改 `bash` 工具语义**——`thincoder-core/tool-docs/bash.md` / `thincoder-core/tools/bash.mjs` 零触碰；红线 = 行为纪律，不新增拦截、不新增门。**证据（既有架构自洽）**：`docs/core/design/TOOLS.md:190`「零文本拦截（彻底）：破坏性命令（rm -rf 等）一律放行，走审批 + 快照」⇒ 「不加机械门」不是本批新承诺，是现状陈述。
2. **不加机械门 / 不新增判据族**——零新门、零新常量、零新测试用例（测试纪律：禁新散文锚）；块内判据全数出自需求五条，**不引入新判据面**。
3. **不新增节**——`##` 块数两面均保持 **14**；插入块首行 = 粗体行（非 `##` 形态）。
4. **不动既有各节文本**——§10 既有行（CN `:64`–`:69` / EN `:84`–`:107`）逐字零改；**§13 台账 · §14 批次档常识（#106 落）零触碰**；判据 = A3 前缀 / 后缀哈希。
5. **内容权归父侧**——本席只出**逐字草案**（中文 + 英文）；落笔归实现轮 eng-coder（父侧核可后）。
6. **不碰**：需求档（父侧笔）· 产品代码（除提示词落笔）· 测试档 · 设计档以外的文档 · 他批写域（上行通道批）。
7. **本设计轮作业合规自陈**：全部动作为**只读**（`read` / `grep` / `fs.readFileSync` / `node scripts/doc-check.mjs`）；**零删除类动词构词**、**零 `2>nul`**、**零 `&` 串联**（串联一律 `&&`）——承本批派单硬约束（母本同源）。

### 2.7 关键决策记录（含否决备选）

| # | 决策 | 否决备选与理由 |
|---|---|---|
| D-108-1 | 落点形态 = **§10 尾部增列**（不改述、不新增节） | 否决 改述原则句 / 扩标题 · 新增节 · 落人格 / 纪律层 · 落 §7 停下上报 · 置 §10 首部（理由见 §2.2） |
| D-108-2 | 块体 = **粗体标题 + 五条 bullet**（`**…**：` 标签式短句 · 与 §10 既有「一句一条」体例同族） | 否决 散文段（一句一条的可扫读性差）· 表格（EN §10 已是表格，再叠表 = 密度过高；CN 面无表体例）· 纯 bullet 无标题（缺视觉锚） |
| D-108-3 | 边界条 = 需求⑤前两项**转 Agent 面表述**入块，第三项（不新增节）留设计面 | 见 §2.9 ①（面归属解读 · 供父侧裁） |
| D-108-4 | 双面插入 = **同相对位**（§10 末行后 + 空行 + 块） | 否决 档末追加（红线与 §10 主题分离——违 D2 主题归属）· 各面自择位（双面漂移） |
| D-108-5 | 验收基线取 **#106 已落笔态**（112 / 150 行 · `##` 块 14 · T-CL1 = 14） | 否决 沿用本席首轮读数（105 / 143 · 块 13）——**该态已失效**：#106 实现轮于本设计轮窗口内落笔（见 §2.9 ③） |

### 2.8 回指（三方一致链 · 本席自校）

- **需求档**（§2.3 行 10 `:56` + 增补注② `:73`–`:76`）= **批档 §2 覆盖表**（§2.1）= **设计档**（§6.1 `:159` + §7 `:197` D-PS5）——**同源**。
- **台账 #108**（本档 §1.4）⇒ 设计交付后由主 agent 推进状态；**#107 ②** 由本批消解，#107 ① 另案。
- **未落笔项**：两面 `common.md`（实现轮 eng-coder）· 需求档（父侧笔 · 已前置落）；测试档零触碰（无连带）。
- **行数**：设计档 336（本席落笔后实测）；两面 `common.md` 现量 112 / 150 ⇒ 落笔后 119 / 157。

### 2.9 不一致 / 上抛（发现即报 · 只报不改）

① **需求五条第 ⑤ 条跨面**：三项中「不改 `bash` 语义」「不加机械门」可转 Agent 面表述（已入块 bullet 5），「**不新增节**」纯属文档结构约束 ⇒ 只落设计面（§2.6 第 3 条 + 设计档 D-PS5）。派单写「逐字块覆盖五条」——本席按「4 条入块 + 1 条跨面」处置，**供父侧裁**：若要求 ⑤ 整条逐字入提示词，可补（成本 1 行 + 双面同步）。
② **派单「现有句」口径偏差（只报不改）**：派单称「现有句 =『写类场景按表路由不用 bash；有专用工具就不 hand-roll』——红线是它的自然延伸」——**实核**：该句只在**中文正本** `:69` 存在（「**原则：有专用工具就不 hand-roll bash**（…）」）；**运行期英文面 §10 无此句**（体例 = 表格 `| Tool | Use it for | Not … |`，原则以 `Not` 列承载）。⇒ 「自然延伸」在两面**同节主题**上成立（裁定不变），但「既有句」是**单面事实**。**本批不处置**：该双面体例差 = **既有漂移**（`design/PROMPT-SYSTEM.md` §10.2 行 5 在册「`common` EN 工具面更全（表 vs CN 散文…）」· 属既有 P2 已认账项）。
③ **#106 串行状态（实测）**：本设计轮窗口内，**#106 实现轮已落笔**两面 `common.md`（第 14 节「批次档常识」）并同步 T-CL1 = 14——本席**首轮读数（105 / 143 行 · 块 13）已失效**，现量 = **112 / 150 行 · 块 14**；两批插入点**互不重叠**（#106 在档末追加、本批在 §10 中段）⇒ 本批 Δ 以现量为基线（§2.4）。
④ **报告面读数漂移（非闸 · 预告）**：本批块内 `Remove-Item` / `notify_parent` 各新增 1 条「符号·宽」报告行（不入闸）——「净增 0」以**闸面 5 项**为准（同 #106 先例读数纪律）。
⑤ **域外观察（不动作 · 存量红）**：`docs/core/design/prompts/persona-engineering.md:141`（507 字符）/ `:143`（416 字符）与 `docs/core/design/PROMPT-SYSTEM.md:298`（413 字符 · #106 批已上抛、尚未折行）在 doc-check 行宽清单内——**均非本批引入、不在本批射程**，只报不改（后者的处置归 #106 收口轮）。

### 2.10 同轮补录（终点读数校正 · 2026-09-20 00:5x · 本席复跑）

**① 机检终测（`cd /d D:\teamcode\thincoder && node scripts/doc-check.mjs`）**：闸面 = 悬空 **6** · **行宽 19** · 注记豁免 43 · 拟新增 6 · 迁移期引文 222。
**行宽 18 → 19 的唯一增量 = `docs/core/design/AGENT-LOOP.md:105（325 字符）`**——该行内容 = **上行通道批在飞**（「上行 ask 入队尾〔`agent-tools/parent-channel.mjs`——2026-09-19 F-UC7 批…〕…实现已落地…父侧直接执行 · 可 revert」），mtime = 本席作业窗口内（2026-09-19T16:58:39Z ≡ 本地 00:58）⇒ **非本批引入、不在本批写域**。**A2 的「净增 0」以本批写域为准**：`docs/core/design/PROMPT-SYSTEM.md` 的行宽条目仍**恰 1 条**（= 落笔前既有 413 字符行）· `docs/core/design/prompts/common.md` 现盘**零**行宽 / 零悬空条目。

**② 号位顺移登记**：§2.5 A2 与 §2.9 ⑤ 记的 `PROMPT-SYSTEM.md:298` 现为 **`:303`**（= 本席 +4 行插入 + 他批同窗改动的顺移）；**413 字符行本体未动**（零语义接触 · 非新增）。

**③ 机检域边界（如实标注 · 影响 A2 射程）**：`checkConfig.scanDirs = ["docs"]`（`PROJECT-MANIFEST.json:21-23` 实读）⇒ **运行期英文面 `thincoder-core/prompts/**` 不在机检域**（实测该档 `:25` / `:34` / `:35` / `:38` / `:146` 五行为存量 >300 字符行——存量、非本批引入、本批不处置）。⇒ **本批对英文面的保障 = A1（双面同扫）+ A6（评审面语义等价）**；A2 的机检保障面 = 中文正本 + 设计档。

**④ 本席写域终态（落笔后实测）**：设计档 **336 行**（+4 = `:159` `:197` `:295`–`:296`）· 批档 §2（本段）· 两面 `common.md` **零触碰**（未落笔）。

**⑤ 落笔前基线复核（本席终测实跑 · 命令逐字取自 §2.5）**：`A1 = CN/EN hit=false · bullets=0 · tok=0`（负面基线 ⇒ 判据非空转）· `A3 = CN/EN prefixOk=true · suffixOk=true · rows 112->112 / 150->150`（**基线哈希此刻仍有效** ⇒ 两档自取基线后未被触碰）· `A4 = h2Blocks=14 · titleNotH2=true · titleBold=false`（未落笔态）。⇒ **落笔轮可直接沿用 §2.5 基线值**（若其前他批再触碰两档 ⇒ 按 A3 取法重取）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：破坏性命令红线（#108）——批档 §1–§2（含 §2.10）+ 设计档 `PROMPT-SYSTEM.md`（`:159` / `:197` D-PS5 / `:295`–`:296`）+ 需求档 §2.3 行 10（`:56`）与增补注②（`:73`–`:76`）；状态 = 待评审 → **pass**。

| # | 类别 | 严重度 | 问题 | 建议 |
|---|------|--------|------|------|
| 1 | 文档归属 / 证据 | 🟡 | `docs/batches/2026-09-20-destructive-command-redline.md:122` 的 D2 免责句「提示词两面零既有对应内容 ⇒ 本批为新增内容，非重述」以五 token（`rmdir` / `Remove-Item` / `破坏性命令` / `不可逆` / `2>nul`）零命中为据——该词面复跑确为零命中，但结论宽于证据：以「破坏性」/`rm -rf` 为词面即命中两面既有文本（`docs/core/design/prompts/discipline-normal.md:137`「**可逆性分级**：…破坏性（rm -rf、force-push）——先确认…」· `thincoder-core/prompts/discipline-normal.md:138` EN 对位句），与本批 block bullet 4（不可逆先确认）主题重叠（同向不互斥，非机制矛盾）。 | 扩 D2 检索词面（补「破坏性」/`rm -rf`/destructive 等）并把「block bullet 4 ↔ `discipline-normal.md` 可逆性分级句」的覆盖关系（各管哪层、是否构成重述/取代）在批档 §2.3 或 §2.9 显式登记，使「非重述」结论与证据面同宽。 |
| 2 | 验收判据（读数漂移） | 🔵 | `:150` A2 的基线含「行宽 18」，与同档 `:215`–`:216` §2.10① 的同轮校正（行宽 **19**；+1 = `docs/core/design/AGENT-LOOP.md:105`，他批在飞、非本批）并存——按 A2 字面比对将出现一条已知假差异（§2.10① 已给「以本批写域为准」裁决，A2 行内数字未随之收正）。 | 把 A2 行内基线并入 §2.10① 的校正读数，或改为「基线以 §2.10① 为准」的单点指句，避免实现轮读到两套数。 |
| 3 | 需求覆盖 / 范围（coordination） | 🟡 | `:207` §2.9① 把需求 ⑤ 拆为「两项入块 bullet 5（转 Agent 面表述）+『不新增节』留设计面」，与派单口径「逐字块覆盖五条」未闭合 ⇒ §2.1 行 8（`:60`）与 §2.3 对照表 ⑤ 行（`:108`）的覆盖判据悬置一处（含 bullet 5 的边界表述选择）。 | 在 §2.1 / §2.3 把 ⑤ 的落点口径择一钉死（4 条入块 + 1 条跨面，或 ⑤ 整条入块并同步行数/两面），使「五条 ↔ 落点」单点可判。 |
| 4 | 清晰度（设计档决策记录） | 🔵 | 设计档 `docs/core/design/PROMPT-SYSTEM.md:197`（D-PS5）以「红线是既有『有专用工具就不 hand-roll』句的自然延伸」为落点理由，而该句仅存于中文正本 `docs/core/design/prompts/common.md:69`；英文运行面 §10 为表体（`thincoder-core/prompts/common.md:84`–`:107`，原则以 `Not` 列承载）——单面事实只在批档 `:208` §2.9② 登记，持久设计档未带限定。 | D-PS5 理由句补单面限定（或改述为「同节主题的延伸」），使持久设计档不暗示两面皆有该句。 |
| 5 | 清晰度（新旧规则交互） | 🔵 | 新块 bullet 4「子代理走上行 `ask`」与 §8 既有滤网的交互未在设计面说明：`docs/core/design/prompts/common.md:48`–`:51`（两问皆过才可问、「否则自己定」、禁问「任务书已明示的取舍」；EN 对位 `thincoder-core/prompts/common.md:52`–`:56`）——任务书已显式授权的不可逆动作，按 §8 口径可自行定、按 bullet 4 口径须先 ask，两读法可并存但未收口。 | 在批档 §2.9 增一条交互登记（bullet 4 相对 §8 滤网的特例/优先关系），或把 ask 情形表述为「任务书未显式授权时」——二择一，使两处规则读法一致。 |

**计数**：🔴 0 · 🟡 2（#1 / #3）· 🔵 3（#2 / #4 / #5）——均不阻断；另域外注记 1 条（不赋级）。

**实核（最小核对 · 只读）**：两面 `common.md` 现量 **112 / 150**（`split('\n')` 口径，EN 含行尾空串）· `##` 块各 **14** · §10 = CN `:64`–`:69` / EN `:84`–`:107`（`:69` 后、`:107` 后均为既有空行）——与 §2.2 / §2.4 记值一致；两面 `rmdir` 零命中（A1 负面基线、A4 `h2Blocks=14` 基线成立）；T-CL1 断言 `thincoder-cli/test/prompts-dual-source.test.mjs:83` = 14 且只数 `## ` 前缀（全仓未见他处节计数断言）；三包 `test/run.mjs` 在册（A5 命令形态成立）；`PROJECT-MANIFEST.json:21`–`:23` `scanDirs=["docs"]` · `:24` `lineWidth=300`；`docs/core/design/TOOLS.md:190` 引文逐字一致；`notify_parent` 两面 §8 在位（`:45` / `:49`）。
**评审局限**：Project Standards 未声明 / Document Map 缺失 ⇒ 方法论合规与文档归属判据降级判定；本轮只读、未执行命令 ⇒ A2 / A3 / A4 / A5 实跑读数与 §2.10① mtime 归属标 unverified。

VERDICT: pass

## §4 用户批准（主 agent）

## §5 实施记录（eng-coder）

## §6 验证与收口（父代理）
