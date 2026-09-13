# 两仓合并（TWO-REPO-MERGE）

> 板块 = **两仓合并**——架构级机制档：本档承载**设计层 + 测试层**（需求层已迁出，见下）。
> 建档：2026-09-13 · 状态：**设计评审通过（轮次 3 PASS）· 用户已批准（2026-09-13）· 批 1（搬迁）已实施**
> 本档承载 **phase 1（目录合并）**的权威设计；**phase 2（核心统一）**只留演进通道（§2.13），不在本批实施。
> 需求层已迁出（2026-09-13 需求层拆分批）：需求见 `../requirements/TWO-REPO-MERGE.md`（板块镜像形态见 `docs/README.md` §3.2）——本档保留设计与测试细节。

---

## 2. 设计（Design）

### 2.1 现状事实基线（勘察结论）

以下事实为 2026-09-13 实测所得，是本设计的全部依据。

| # | 事实 | 证据 / 量化 |
|---|---|---|
| B1 | **跨仓机制 100% 位于 build / doc / test 期**，`src/**` 内**无任何运行期跨仓依赖** | VSC 侧侦察：扩展从不 resolve / spawn / import CLI 仓 |
| B2 | 共享运行期状态 = 用户级 `~/.thincoder/` 面（`config.json` · `checkpoints/{cwdHash12}/` · `logs/`——用户状态）；**仓际接口为零**（无运行期跨仓调用） | VSC `package.json` 声明 shared with the CLI；`AGENTS.md:42` 快照「与 VS Code 端**同存储同格式**、跨端互通」；`src/log.mjs:51` 共享 `~/.thincoder/logs/`——**合并后原样存活**，不属跨仓机制 |
| B3 | 提示词同名集合两仓各 15 档，**逐字节相同仅 8 对** | 实测 sha256：相同 8 / 不同 7 |
| B4 | 两产品文档**大量同名撞车** | design 27 对 · requirements 31 对 · batches 20 对 |
| B5 | 规范档（design + requirements）路径 token **128 处**；`（X 仓）` 注记约 **1031 处** | 实测 / 普查 |
| B6 | 两仓**默认分支不同**：CLI = `main`，VSC = `master` | git 事实 |
| B7 | 两仓 **tag 名有交集 4 条**：`v0.8.1` `v0.8.2` `v0.8.5` `v0.8.10` | CLI 71 tag / VSC 34 tag |
| B8 | `git subtree` 可用；**`git filter-repo` 未安装** | git 2.55.0；干跑 `subtree add` 退出码 0（5.0s），VSC 807 提交以独立根并入且可达 |
| B9 | 合并仓**不能**落在当前工作区根 | 工作区根非 git 仓，且混有十余个无关项目与大量临时产物 |
| B10 | 两仓 `.thincoder/` 均入库且**内容不同**，存在同名不同内容文件 | `checklist.md`、`skills/code-review.md` 双仓同名 |
| B11 | VSC 仓有 CI 工作流（`push`/`PR` → `npm install` + `npm test` + `npm run lint`），**假设仓根 = 包根** | VSC 仓内 `.github/workflows/test.yml`；CLI 仓无 CI |
| B12 | CLI 仓根约 70 个未跟踪日志产物；VSC 仓根另有大量 `.vsix` 与临时日志（均未跟踪） | 清点；均未入版本控制 |

**B1 是全部方案的地基**：既然运行期没有跨仓接口，合并就**不必触碰任何产品代码**——它是一次纯结构性搬迁。

### 2.2 目标布局

```
<合并仓根>/                       ← 单一 git 仓
├── thincoder/                    ← CLI 产品（原 CLI 仓内容整体下移一层）
│   ├── bin/  src/  test/  scripts/  docs/
│   └── package.json  CHANGELOG.md  LICENSE  README.md  AGENTS.md
├── thincoder-vscode/             ← VSC 产品（subtree 并入）
│   ├── extension.mjs  src/  webview/  locales/  assets/  test/  scripts/  docs/
│   └── package.json  CHANGELOG.md  LICENSE  README.md  AGENTS.md
├── .gitattributes                ← 仓根级（两产品共用）
├── .gitignore                    ← 仓根级
└── README.md                     ← 合并仓总览
```

**关键约束：两个子目录名必须沿用现有仓名（`thincoder` / `thincoder-vscode`）。** 理由见 §2.5 / §2.6——否则两产品文档里
现有 128 处路径 token 全部失效，需逐条改写，直接违背"结构搬迁非重写"。

#### 2.2.1 被否方案

| 方案 | 内容 | 否决理由 |
|---|---|---|
| **X1 抽独立核心包** | 抽出 `thincoder-core` 作第三方依赖，两产品引包 | 需先把 `src/**` 差异（B3 所示仅 12 档近同）真正统一——那是 phase 2 的工作；本批做会退化成重写 |
| **X2 只删一仓** | 弃用 VSC 仓，只留 CLI 仓 | 丢失 VSC 历史（F3）与 Marketplace 溯源（F6），且不解决"两份实现"本身 |
| **X3 只改纪律** | 不动仓结构，仅靠纪律约束跨仓引用 | 已试行（「各仓自持」批）：机制仍在、成本仍在，未除病根 |
| **X4 短子目录名** | 子目录取名 `cli/` / `vscode/` | 128 处路径 token 全失效，改写量大且制造大范围文档漂移风险 |
| **X5 非对称布局** | 沿用 CLI 仓为根，VSC 并入其子目录 | 违背 F1「两产品各占子目录」的用户口径；两产品地位不对等 |
| **X6 工作区根作仓根** | 直接在当前工作区目录建仓 | 会把十余个无关项目卷入（B9），不可接受 |

### 2.3 历史合并（F3 / N2 / N4）

**选型：`git subtree` 并入**（B8 实测可用）。

| 项 | subtree（**采用**） | filter-repo（备选） |
|---|---|---|
| 工具可用性 | 系统 git 自带（2.55.0），零安装 | **未安装**——采用即引入"先装工具"前提 |
| 历史可达 | VSC 807 提交以独立根并入，逐个可达 | 可达，且可重写路径前缀 |
| 追溯成本 | `git log -- <子目录>` 只显示 graft 提交 ⇒ 追溯须 `--follow -m`（graft 合并提交未给 `-m` 时改名检测不成立——批 1 实测：单 `--follow` 返回空）或 `git blame` | 追溯连续，无需 `--follow` |
| 回滚 | 并入是一次普通提交，`reset` 即退 | 需重跑全仓重写，回滚成本高 |
| 风险 | 低（不改既有历史） | 高（重写 SHA，全部 tag / 引用失效） |

**决策**：采用 subtree。filter-repo 的长处（追溯连续）不足以抵偿其代价（工具前提 + 重写全史 + B7 的 tag 交集问题会放大）。

**tag 处置（B7）**：目标 = 并入**不搬 tag**——4 条同名 tag（`v0.8.1` / `v0.8.2` / `v0.8.5` / `v0.8.10`）不产生冲突。
**决策**：merge 仓只为**新产品线**打 tag；旧 VSC 仓的 34 个 tag 留在归档仓内可查（F6）。不重命名、不搬移。

**实施前必验项（S2 前置——tag 行为）**：subtree 并入内部走 `git fetch`——tag 是否随 fetch 自动跟随 / 同名 tag 是否被拒，**尚未定论**
（B8 干跑仅记退出码；2026-09-13 预观察 = `git fetch --dry-run ../thincoder-vscode master` 仅输出分支行、exit 0——**dry-run 不展开 tag 判定**，不足为证）。
实施批置前必在**副本仓**以确切命令干跑（`git subtree add --prefix=thincoder-vscode <VSC 仓路径> master`——命令与输出逐字记录），
并入前后对比 `git tag -l`；观察结论落实施批 §5。**对策候选**（随观察定）：a. fetch 侧 `--no-tags`；b. 改从本地 mirror/bare 仓 `subtree add`。
（**复核**：`git ls-remote ../thincoder-vscode "refs/tags/v0.8.*"` 实测 7 条——含 4 条同名交集，与 B7 一致。）

**默认分支（B6）**：合并仓默认分支沿用 CLI 仓的 `main`；VSC 的 `master` 仅作为其历史来源，不保留为分支。

### 2.4 跨仓机制退役清单（F4——本板块的核心交付）

> 判据落点全部经 2026-09-13 行级核验。**处置 = 删除 / 改写**，不含"保留待用"。

| # | 机制 | 行级落点 | 合并后状态 | 处置 |
|---|---|---|---|---|
| R1 | 对端仓根发现（③兄弟目录） | CLI `scripts/doc-anchors.mjs:73` `resolvePeerRoot`，:80-86 兄弟循环 | **反转成假阳性生成器**——`ws/<sibling>` 命中旧仓真目录 | 删（仅留本仓根解析）；**连带测试 = CLI `test/doc-anchors.test.mjs`**（`:21` 导入 `resolvePeerRoot` + 对端解析 / 降级断言段——删断言段 + 导入清单同步；S4） |
| R2 | 对端前缀解析 | CLI `scripts/doc-anchors.mjs:32` `PEER_PREFIX`；:173 排除式 5②（`token.split("/")[0] === PEER_PREFIX` ⇒ 跳判裸直引）；:188-190 `peerPrefixed` 早返回 | 命中旧 VSC 仓或悬空 | 删（token 走仓内相对路径）；**扫描口径 = 实施批按 `PEER_PREFIX` 全消费者面扫描，不按坐标清单**；**连带测试 = CLI `test/doc-anchors.test.mjs`**——**T-V5-5⑦ 夹具（`:139`）+ `:146-147` 计数断言随单仓化重述**（单仓化后该类 token 转「仓内相对路径」被判定 ⇒ 夹具期望需重述、非整段删；S4） |
| R3 | 缺仓/域外口径 | CLI `scripts/doc-anchors.mjs:199` `domain-out` | 语义消失（无"域外"可言） | 删 |
| R4 | 兄弟仓族常量 | CLI `scripts/doc-anchors.mjs:31`；`scripts/check-ledger.mjs:52` | 同仓真目录被认作兄弟仓 | 删 |
| R5 | 跨仓形态判据（V4/X1/X3） | CLI `scripts/check-doc-width.mjs:49` `PEER_DIRS`；:257 X1 正则；:265 预筛 | **仓内合规路径被判违规** | 删判据与预筛；**连带测试 = CLI `test/doc-consistency.test.mjs`**（T-LS35–T-LS37 V4 段——`:226` 起）· CLI `test/doc-anchors.test.mjs`（V4 钉死快照 `:288-291` + `resolvePeerRoot` 直驱 `:293`——随 R1 同档处理）；S4 |
| R6 | 台账跨仓闸（L4） | CLI `scripts/check-ledger.mjs:123` 形态判据；:70 wide 域 | 仓内路径被认作"跨仓形态" | 删形态判据；wide 域收为本仓根；**连带测试 = CLI `test/ledger.test.mjs`**（T-LS2 / T-LS3 跨仓 L4 必报 + T-LS42 / T-LS43 形态判据段 + T67 缺仓跳过段——实施前逐档确认失红面）· CLI `test/ledger-surface.test.mjs`（调用点改指——零跨仓断言）；S4 |
| R7 | 对端根断言与解析 | VSC `scripts/check-doc-anchors.mjs:303（VSC 仓）` `assertPeerRoot`；:311-313 `resolvePeerRoot`；:331 调用点 | 合并后路径**真能解析**⇒断言静默通过 | 删（含调用点）；**连带测试 = VSC `test/doc-anchors.test.mjs:90（VSC 仓）`**（T-DC3 缺仓域外 / 自指 fail-closed——`:116` 段；T-DC7⑥ 对端符号夹具随批）· **连带脚本 = VSC `scripts/reconcile-lookup.mjs:19（VSC 仓）`**（import 自同目录 VSC `scripts/check-doc-anchors.mjs（VSC 仓）`——移仓 / 改指统一版）· VSC `test/reconcile-lookup.test.mjs（VSC 仓）`（随移仓同步）；S4 |
| R8 | 跨仓形态判据（VSC 侧） | VSC `scripts/check-doc-width.mjs:39` `PEER_DIRS`；:260 X1；:268 预筛 | 同 R5（方向相反） | 删；**V1「（CLI 侧）」豁免保留**（单仓语义 = 产品域外引用豁免——§2.5；判据句按单仓语境重述随 R8 落）；**连带测试 = VSC `test/doc-consistency.test.mjs:177（VSC 仓）`**（T-VS31–T-VS33 V4 段）；S4 |
| R9 | 台账跨仓闸（VSC 侧） | VSC `scripts/check-ledger.mjs:41` `SIBLING_NAMES`；:118 形态判据；:76 wide 域 | 同 R6 | 删；**连带测试 = VSC `test/ledger-check.test.mjs:55（VSC 仓）`**（T-VS2 / T-VS3 跨仓 L4 必报——`:74` 段 + 跨仓夹具）；S4 |
| R10 | 自指 fail-closed 防护 | VSC `test/prompts-mirror-anchors.test.mjs:26（VSC 仓）`（兄弟仓路径）、:28（自指断言）、:31-35（跨仓读取） | 前提消失——"缺对端必须失败"的语义保证在**无一条红测**下蒸发 | 删跨仓段（:26/:28 + 跨仓读取与比对）；**产品内双源守卫保留**——本端双源同名集合相等 + 本端镜像节引用可解析断言（单仓版，见 §2.7）；实施批 = S5；**该「删跨仓断言段」处置 = 本批 R1–R9 连带测试档的统一范式**（§2.14）；**R16 = 同范式**（context-parity T-CI-11——同型对端发现 + 自指防护 + 缺仓 fail-closed，见 R16 行） |
| R11 | 提示词双副本 | CLI / VSC 各自的 `src/prompts/` 与 `docs/design/prompts/`；两产品 `AGENTS.md`「镜像提示词约定」段（CLI `:21` / VSC `:15`——as-of；含 `thincoder/scripts/…` 跨仓指针与「两端各自照抄」叙述） | 跨仓机制层失去对象；产品内双源存续（§2.7） | **跨仓机制层退役**；产品内「权威模板 ↔ 运行期落地物」双源保留（§2.7）；**AGENTS.md 两段 = 改写为产品内双源约定**（去跨仓叙述 / 跨仓指针——实施批 = S5） |
| R12 | 「各仓自持」纪律句 | 两仓 `docs/README.md`（自持段——CLI `:114` / `README（VSC 仓）:23`，as-of）+ 两仓 `docs/requirements/ENGINEERING-MODE.md`（CLI §1.19 / `ENGINEERING-MODE（VSC 仓）§1`）+ 提示词自持节两副本（`discipline-normal.md`——CLI `:38` / VSC `:35`；`discipline-engineering.md`——CLI `:119` / VSC `:123`；均含 `docs/design/prompts/` 镜像副本；as-of） | 失去对象 | 改写为仓内规范（含提示词自持节两副本——S6）；验收 = T-M24（检域含提示词档） |
| R13 | 「每仓一轮」流程口径 | 两仓 `src/prompts/discipline-engineering.md`（「跨仓批」条——CLI `:123` / VSC `:127`，as-of）及 `docs/design/prompts/` 镜像副本（各 `:98`） | 失去对象 | 改写（VSC 侧 T-DC16 条文锚随字面同步） |
| R14 | 「禁跨仓 import」纪律句 | 两仓 `docs/requirements/ENGINEERING-MODE.md`（CLI §1.17 N1「语义同源·原文自持——不作跨仓 import」`:795`；`ENGINEERING-MODE（VSC 仓）§1` N5「不跨仓依赖」`:78`——as-of）；设计档同源句（CLI `docs/design/ENGINEERING-MODE.md` as-of `:698`/`:810`） | 单仓内 import 合法 | 删除禁令 |
| R15 | 端差登记 | **纪律句级——无独立脚本落点**（`scripts/` 实测零判据）：VSC `docs/requirements/AGENT-LOOP.md:302（VSC 仓）` N-CL4「端差逐条登记不静默」；登记面 = `docs/design/README.md（VSC 仓）`「镜像差异表」节 + 两仓设计档端差登记节（如 CLI `docs/design/TESTING.md` §11.6） | 跨仓登记语境失去对象（登记面收为产品侧对位）；`（CLI 侧）`注记按产品侧语义存续——V1 豁免**保留**（§2.5 / R8） | 纪律句级——随 R12/R13 同批改写；**验收 = T-M27**（检索式——三落点） |
| R16 | 跨仓 fail-closed 源在位守卫（T-CI-11——兄弟仓 CLI 源在位） | VSC `test/context-parity.test.mjs（VSC 仓）`（:3 计数句 14 条 · :15-17 头注跨仓自述 · :37 `CLI_ROOT` 兄弟解析 `join(VSC_ROOT, "..", "thincoder")` + `THINCODER_CLI_ROOT` 覆盖口 · :368-374 T-CI-11 整条——:371 自指断言 `notStrictEqual(CLI_ROOT, VSC_ROOT)` · :372-373 `cliSetup` 存在性 fail-closed） | 合并后 `join(VSC_ROOT, "..", "thincoder")` 恰解析到**仓内**子目录 `<合并仓根>/thincoder` ⇒ 两断言**恒真、守卫空转且静默绿**——与 R10 同型（对端发现 + 自指防护 + 缺仓 fail-closed 全要素；§2.4 尾注「不报红」类） | **整段退役**（R10 同款范式；实施批 = S4）——删 :3 计数句（14 → 13 条；T-CI-1 ~ T-CI-10）· :15-17 头注跨仓句 · :21 import 同步（`existsSync` 无他处消费者）· :37 解析（含 `THINCODER_CLI_ROOT` 口）· :368-374（banner + 整条用例）；**`cliSetup` 存在性断言不设单仓版**——其唯一消费者（跨仓序锚读取）已于 2026-09-12 PROSE-ANCHOR-RETIRE 退役，「兄弟产品内部文件存在」改写版属跨产品内部耦合（与 F2 互不触发相抵）、无同仓意义；**连带文档 = T-CI-11 引用行退场注记**——口径 = **按 T-CI-11 语义面扫描（含 §17.9 / 跨仓只读叙述段），非按坐标清单**；VSC `docs/design/AGENT-LOOP.md（VSC 仓）` `:48` 变更记录行——as-of 豁免；**代表点** = VSC `docs/design/AGENT-LOOP.md（VSC 仓）` `:1278-1284`（跨仓只读语义段）· `:1302`（§17.9 边界句）· §17 组（:1242 · :1276 · :1294 · :1298 · :1332 · :1334——as-of）· VSC `docs/design/TESTING.md:129（VSC 仓）` · CLI `docs/requirements/AGENT-LOOP.md:306` · CLI `docs/requirements/PROMPT-SYSTEM.md:337（+ :413）`——V5 注记面；随 S6） |

**R1 / R7 是本次退役中最隐蔽的两条**：它们不是"失效"，而是**反向生效**——合并后机制继续运行，但结论全错，
且**不产生任何红**（R10 / R16 所示：测试侧守卫空转、语义保证在无人察觉中消失）。这类静默退化是本板块必须整体删除、而非逐条修补判据的根本原因。

**落点分布实测**：跨仓措辞的实际载体是 **`scripts/` 与 `docs/`**（脚本判据 + 文档纪律），
提示词层仅零星几处（`discipline-engineering.md` 3 处「跨仓」、5 处「他仓」等）。
`scripts/doc-impact.mjs` 的 2 处「对端」仅是**同族口径注释**，无行为依赖——随批改写措辞即可（141 行 → ±0；import 改指统一版——§2.14；实施批 = S4）。

### 2.5 机检单仓化（F5 / N6）

合并后，两套同名机检脚本（`doc-anchors` / `check-doc-width` / `check-ledger`）**不能各留一份**——
它们的判据都建立在"本仓 vs 对端"的二分上，单仓内该二分不存在。

| 脚本 | 现状 | 合并后设计 |
|---|---|---|
| 文档锚一致性（V5） | CLI `scripts/doc-anchors.mjs`；VSC `scripts/check-doc-anchors.mjs（VSC 仓）`（两份实现） | 收为**一份**（居合并仓根 `scripts/`——域参数化，两态见下段）；路径 token 按**仓根相对路径**解析 |
| 文档格式（V1/V4） | 同名两份，`PEER_DIRS` 方向相反 | 收为一份（同上）；**V4 跨仓形态整类删除**（R5/R8） |
| 台账（L4） | 同名两份，兄弟仓闸 | 收为一份（同上）；L4 收为**仓内可解析**（R6/R9） |
| 语法（check-syntax） | 同名两份，无跨仓逻辑 | 按产品各跑一次（各产品自有源码树），逻辑不变 |

**统一脚本定案（档名 / 位置 / 执行根 / 调用 / 扫描域两态）**：

- **档名**：**沿用现有三名**——`scripts/doc-anchors.mjs` / `scripts/check-doc-width.mjs` / `scripts/check-ledger.mjs`（VSC 侧 `scripts/check-doc-anchors.mjs（VSC 仓）` 并入后取 `scripts/doc-anchors.mjs` 一名）⇒ 现行文档命令形态 `node scripts/<name>.mjs` **零改**（2026-09-13 第 3 修正轮裁定）。
- **位置**：合并仓根 `scripts/`（单份 ×3——文档锚 / 文档格式 / 台账；落点见 §2.14）。
- **执行根**：机检命令一律**自合并仓根执行**（命令形态保持有效的前提）。
- **调用**：两产品门禁链各自调用仓根统一脚本并**传入本产品域**（`thincoder/` 或 `thincoder-vscode/`）——避免两产品发布门禁相互牵连（F2「互不触发」/ N5）。
- **扫描域两态**：**无域参 = 全域**（默认——CI 全域调用与现行文档命令形态的承载面）；产品域态（门禁——显式传本产品域，只扫本产品域）。F5 的「全域」口径由 CI 面承载。
- **统一版内部依赖**：判据单源导入沿用（CLI 锚 ← 格式谓词 `isExecutableLine` / `inCodeSpan`；VSC 锚 ← 台账判序 `evidenceState`；反查 ← 锚抽取器）——改指统一版族内档、不复制实现（D2）；统一版对产品源码的运行时依赖（如台账解析 `src/ledger.mjs`）按**产品域**取用（两产品各自实现——不跨产品混用；细节实施批定）。
- **V1「（CLI 侧）」豁免去留（VSC 独有——`cliSideAnnotated`（VSC 仓））**：**保留**——单仓版语义 = **产品域外引用豁免**（产品域扫描 / 门禁时，带「对方产品侧」注记的引用不判 unknown-doc）；依据 = 存量现行 / 冻结文档大量使用该注记（D10：停新增 / 随触碰），删除会转 V1 红（与 N6 / T-M6 相抵）且无基线通道（F14 阈值 = 0）；判据句按单仓语境重述（S4 随 R8），豁免逻辑本体不变。
- **本板块两档自身锚（V5——T-M17 面）**：R 表 / §2.14 的六档行号锚（及 R16 行坐标——同批）在批 2 删改后不再指向现存档——处置 = **退场注记 + 来源指针**（「已并入仓根统一脚本 `scripts/doc-anchors.mjs` / `scripts/check-doc-width.mjs` / `scripts/check-ledger.mjs`」形态）或符号化改写；不逐锚追改统一版命名（as-of 证据口径）；执行 = S4（删改同批落注记）+ S6（两档复跑 V5 零悬空）。

**现行文档脚本引用面（2026-09-13 第 3 修正轮裁定——非命令形态登记）**：统一版落位（S4）后，**命令形态**（`node scripts/<name>.mjs`——档名沿用 + 仓根执行 + 全域默认）**保持有效、不逐条改写**。
**非命令形态**（把脚本当文件路径断言——「落点 =」「宿主 =」「受影响文件表行」类 AC / 受影响表引用）登记为**随批处置面**：

- **口径**（机判）：两仓 `docs/design` + `docs/requirements` 全量 .md；匹配 = 四个档名 `.mjs` 全形态；排除 `_archive/` · `docs/batches/`（留痕）与本板块两档（自身引用见上条）。
- **计数（2026-09-13 实测）**：命令形态 97 · 非命令形态 190（跨 14 档）；非命令形态按档 Top-4：CLI `docs/design/ENGINEERING-MODE.md` 59 · CLI `docs/design/LEDGER-SELF-CONTAINED.md` 32 · VSC `docs/design/LEDGER-SELF-CONTAINED.md（VSC 仓）` 28 · VSC `docs/design/DOC-CODE-RECONCILE.md（VSC 仓）` 25（其余档 ≤10）。
- **代表形态**：「落点 = `scripts/doc-anchors.mjs`」（CLI `docs/design/ENGINEERING-MODE.md:553`）·「受影响文件表行 `scripts/check-doc-width.mjs`」（CLI `docs/design/ENGINEERING-MODE.md:522`）·「本端检查器 `scripts/check-ledger.mjs`」（VSC `docs/design/LEDGER-SELF-CONTAINED.md:546（VSC 仓）`）。
- **分界**：**历史 AC / as-of 断言行按留痕处理、不改写**（坐标记录的是当时事实——同 `（X 仓）` 冻结口径 D10）；**随批处置** = 此界之外的现行断言（S4 脚本删改同批触发 + S6 文档批复核——改法不逐条规划）。

**解析语义变更（关键）**：现行 `resolveFile` 的候选序含"本仓别名前缀剥离"（CLI `scripts/doc-anchors.mjs:189`）。
合并后 token 形如 `thincoder/src/x.mjs` 时，候选① `resolve(root, token)` **直接命中**（因 CLI 内容确在 `thincoder/` 下）——
即**两产品文档的 128 处路径 token 无需任何改写**，自行从"跨仓引用"降格为"仓内路径"。这是 §2.2 子目录命名约束的兑现点。

### 2.6 文档层处置（F5 / N6 / B4 / B5）

| 对象 | 现状 | 处置 |
|---|---|---|
| 路径 token（128 处规范档 / 435 处留痕档） | `thincoder/…`、`thincoder-vscode/…` 全限定写法 | **零改写**——子目录名沿用后自动成为正确的仓内路径（§2.5） |
| `（X 仓）` 注记（约 1031 处） | 跨仓引用形态的合规标记 | **不再新增**；存量留痕档（`batches/`、`_archive/`）**不动**（历史留痕，冻结）；现行档触碰时随改 |
| **同名撞车 27 + 31 + 20 对** | 两产品各自的 `docs/design/TESTING.md` 等同名档 | **不物理合并**——两产品文档分层保留在各自子目录内（`thincoder/docs/` 与 `thincoder-vscode/docs/`），撞车不成立 |
| 文档地图 | 两仓各一份 `docs/README.md` | 各留一份（各管各产品）；合并仓根另建总览 `README.md` |
| **项目台账单仓化**（仓根 `docs/TODO.md` / `docs/TODO-archive.md`） | 两产品各自产品级活档 + 归档档（共四档） | **已实施（2026-09-13——commit `c9f35f93`）**：仓根 `docs/TODO.md`（项目级唯一活档）+ `docs/TODO-archive.md`（两产品归档并入 + 单仓化归档节）；原产品四档退役；仓根 `README.md` 增「Project ledger」节；机检承接 = `check-ledger` 默认清单改指仓根两档（批 2 补做轮落地——SKIP 零行） |

**关于"同名撞车"的结论**：撞车之所以成为问题，前提是"扫描域扁平化为单层"。
本方案**保持两产品各自的 `docs/` 分层**，扫描域按产品前缀隔离（§2.5），撞车自然消解——
这同时避免了 V1 按 basename 解析时的 fail-open 风险（一对多命中）。

### 2.7 提示词承载（R11 / B3）

现状（2026-09-13 实测 sha256 矩阵）：两仓各持 `src/prompts/` + `docs/design/prompts/`，同名各 15 档。

| 比较 | 逐字节相同 |
|---|---|
| CLI `src/prompts` ↔ VSC `src/prompts` | 8/15 |
| CLI `docs/design/prompts` ↔ VSC `docs/design/prompts` | 10/15 |
| CLI `src/prompts` ↔ CLI `docs/design/prompts` | **0/15** |
| VSC `src/prompts` ↔ VSC `docs/design/prompts` | **0/15** |

**运行期事实（本节点案的依据）**：

| # | 事实 | 落点 |
|---|---|---|
| P1 | CLI 运行期从**自己的** `src/prompts/` 加载——槽位面**静默空载**（缺档返回空串） | `src/prompt-overlays.mjs:18` `readFileSync(join(__dirname, "prompts", name), "utf8")` |
| P2 | VSC 运行期加载——槽位面（两侧同型）**静默空载** / advisor 面**缺档即抛错** | 抛错面 = CLI `src/advisor.mjs:63-69` + VSC `src/advisor/main.mjs:66-71（VSC 仓）` |
| P3 | 两产品的 `src/prompts/` 均**随包发布** | CLI `package.json` `files=["bin/","src/",…]`；VSC `.vscodeignore` 排 `docs/**` 但**不排 `src/**`** |

**结论（机械性，非偏好）**：**「单副本」在 phase 1 不可实现**——npm tarball 与 vsix **均只收包根之内**的文件（CLI 的 `files` 无法收录父目录文件；vsix 打包根 = 扩展目录）。
单副本若居合并仓根或另一产品内，两产品的**运行期加载会同时断**（槽位面缺档静默空载 / advisor 面缺档即抛错——加载面一律断供）；
而「构建期拷入 `src/prompts/`」会把 `src/**` 变成生成物——破坏开发期直跑源码，且违反代码段纪律。

**处置（分层）**：

| 层 | 对象 | phase 1 处置 |
|---|---|---|
| 跨仓机制层 | 对端发现 / 自指防护 / 跨仓逐字断言（R10） | **退役**——合并后同仓，对端发现无对象 |
| 产品内双源层 | 各产品 `docs/design/prompts/`（中文权威模板）↔ `src/prompts/`（运行期落地物） | **保留**——产品内的权威↔落地关系，与「仓」无关 |
| 跨产品内容层 | 8/15（src）· 10/15（docs）逐字节相同 | **本批不动**——收敛归 phase 2（§2.13） |

> **F4「提示词双副本」要素收窄（既定——2026-09-13 评审后）**：该要素收窄为**其跨仓机制层**退役（对端发现 / 自指防护 / 跨仓逐字断言）；
> 产品内「权威模板 ↔ 运行期落地物」双源按 §2.12 D14 **保留**——依据 = 运行期硬加载 + npm/vsix 只收包根之内文件的机械约束（P1–P3）。
> F4 行措辞已按此收窄（`../requirements/TWO-REPO-MERGE.md` §2）；删除跨仓断言后，产品内双源由**单仓版断言**守（本端同名集合相等 + 本端镜像节引用可解析——见 §2.4 R10 行）。

### 2.8 发布链承载（F2 / N5）

| 产品 | 现状 | 合并后 |
|---|---|---|
| CLI（npm 包 `thincoder`） | 仓根即包根；`prepublishOnly` → `release:check`（lint → 全量测试 → 集成集） | 在 `thincoder/` 子目录内执行 `npm publish`；门禁链**步骤不变**（lint → test:full → test:integration）——文档机检改指仓根统一脚本并传本产品域（§2.5） |
| VSC（vsix `thincoder-vscode`） | `vscode:prepublish` = lint + doc:check + test:full + test:integration；`vsce package` → 双源发布（Marketplace + Open VSX） | 在 `thincoder-vscode/` 子目录内执行；`vscode:prepublish` 四环**步骤不变**——`doc:check` 改指仓根统一脚本并传本产品域（§2.5）；`publish-all.mjs` 链逻辑不变，仅工作目录变化 |

要点：
- 两产品的 `package.json` / `package-lock.json` 各自留在子目录内——**不合并 lockfile**（依赖树独立）。
- `.vscodeignore` 随产品留在子目录内，其排除规则需**复核**（原按仓根相对路径书写）。
- VSC `package.json` 的 `repository` 字段**必须继续指向旧 VSC 仓**（现值 = `https://github.com/xinbo-tech/thincoder-vscode.git`）——迁移中极易被顺手改为新仓；实施批核对 + T-M7 校验（F6）。
- 发布动作本身是手工流程（既有 RELEASE 流程），合并**不改变**其步骤，只改变执行目录。

### 2.9 CI 承载（B11）

**现状风险**：VSC 的 CI 工作流位于 `thincoder-vscode/.github/workflows/test.yml`，其触发与步骤假设**仓根 = 包根**。
GitHub Actions **只读仓根 `.github/workflows/`**——合并后若原样留在子目录内，该工作流将**静默失效**（不报错，只是不再运行）。

**处置**：
- 工作流迁至**合并仓根** `.github/workflows/`，步骤内显式 `working-directory` 指向产品子目录；
- 矩阵化：两产品各自一条 job（CLI 与 VSC 的 `npm install` / `test` / `lint` 步骤同构）；
- **全域文档机检**：工作流增设全域调用 step（统一脚本扫合并仓全域——扫描域两态见 §2.5；F5 的「全域」口径承载面）；
- CLI 侧此前无 CI——合并是补齐其 CI 的**顺路机会**：**已定案执行（D11）；非 F 级需求**——工作流迁仓根时一并落地 CLI job；验收口径 = T-M28（仓根 CI 实跑：两产品 job 绿 + 全域机检 step 绿）。

**「零红」口径（2026-09-13 收正轮）**：全域调用下 VSC 域引擎为**报告态**——仓根 `scripts/doc-anchors.mjs` 内 `vscGate` 默认不阻断 ⇒ CI 全域 job 会打印报告行而**退出码 0**。「零红」= **退出码 0**（报告行不阻断）。
VSC 域转闸（报告态 → 阻断态）的时间点 = **依赖批 3 / S6 面清零**（清零前全域调用保持「退出码 0」口径）。

### 2.10 仓根状态与清理（B10 / B12）

| 项 | 处置 |
|---|---|
| 未跟踪临时产物（日志 / `.vsix` / 探针档，两仓合计近百） | **迁入前清理**——未跟踪，删除无历史损失；清理清单迁移前逐条确认 |
| `.thincoder/`（两仓均入库，内容不同） | 合并后**各产品子目录内各留一份**（B10 同名不同内容的 `checklist.md`、`skills/code-review.md` 因此不必合流）；仓根如需 `.thincoder/` 另行建 |
| 仓根级配置文件（`.gitattributes` / `.gitignore`） | 仓根建一份（两产品共用）；各产品子目录内可保留自有规则 |
| **产品级 `.gitignore`（批 1 补正——实施批 §5 发现 #2）** | 仓根 `.gitignore` 沿用 CLI 原档后，其含斜杠规则（`.thincoder/index/` / `.thincoder/tmp/`）锚定在**仓根** ⇒ 产品内 `.thincoder/` 产物脱保（批 1 实测：`git check-ignore -v thincoder/.thincoder/tmp/x.txt` 未命中、`git status` 报 `?? thincoder/.thincoder/tmp/`——可被误提交）。处置 = 新增**产品级** `thincoder/.gitignore`（依据 = 本节「各产品子目录内可保留自有规则」授权；内容 = `/.thincoder/index/` · `/.thincoder/tmp/`——**目录锚定形态**：恢复原 CLI 仓根语义、命中面限于本产品；否决「根档规则改非锚定 `**/.thincoder/…`」——命中面扩散至任意层嵌套、且把产品规则混入共享根档）；VSC 侧自带子目录 `.gitignore`，不受影响。**批 2 首项 = 批 1 补正：产品级 `.gitignore` 落位 + 探针验证 `git check-ignore` 命中** |
| `LICENSE` / `CHANGELOG.md` | 两产品各自保留（版本线与许可各自独立） |

### 2.11 迁移完成判据（N3）

| 检查 | 判据 |
|---|---|
| 文件完整性 | 迁移前两仓文件清单（含内容哈希）↔ 迁移后逐条对账，**零缺失** |
| 历史可达 | VSC 807 提交在合并仓内逐个可达；抽查 `blame` 跨搬迁连续 |
| 测试 | 两产品全量测试各自全绿（与迁移前基线一致） |
| 机检 | 单仓化后的 V1 / V5 / 台账机检在合并仓全域**零红**（**全域口径由 CI 调用承载**——产品门禁各自只扫本产品域，§2.5） |
| 发布 | 两产品各自走一次完整发布链（可用 dry-run / 预发版本）成功 |
| 文档 | 本档验收标准逐项勾销（§3） |

### 2.12 关键决策（已定案）

**已定案**（用户 2026-09-13 对 Q1–Q7「按倾向走」+ 本档设计决策）：

| # | 决策 | 理由 |
|---|---|---|
| D1 | 采用 **subtree** 并入 VSC 历史 | B8：工具自带、不改既有历史、回滚成本低 |
| D2 | 子目录名**沿用现有仓名** | 128 处路径 token 零改写（§2.5 / §2.6） |
| D3 | 默认分支用 `main` | B6：CLI 为主干 |
| D4 | **不搬 tag**，旧仓 tag 留在归档仓 | B7：避开 4 条同名 tag；F6 保证可查 |
| D5 | 两产品 `docs/` **保持分层不合并** | B4：27+31+20 对同名撞车自然消解；避免 V1 fail-open |
| D6 | 跨仓判据**删除**而非改写 | R1/R7 反向生效且不报红，修补无法穷尽 |
| D7 | 旧 VSC 仓**归档保留** | F6：Marketplace 元数据 `repository` 指向它 |
| D8 | 合并仓远端沿用 `thincoder`（原 Q1①） | 远端仓名与本地目录名解耦，迁移成本最低 |
| D9 | 合并仓根 = **原 CLI 仓目录原地改造**（原 Q2①） | 工作区布局影响面最小；`d:\teamcode` 本身非 git 仓（B9） |
| D10 | `（X 仓）` 注记：**停新增**，留痕档冻结不动，现行档随触碰改写（原 Q3②） | 留痕档是历史；全量清理会制造大范围文档漂移 |
| D11 | CLI 侧 CI **顺路补齐**（原 Q4①） | 合并是天然时机；ci 工作流本就必须迁至仓根（§2.9） |
| D12 | 实施**分批**（原 Q5②，切分见 §4） | 每批可独立回滚（N4） |
| D13 | **不做**「双仓并存」过渡窗口（原 Q6①） | 并存会让跨仓机制继续存活，违背 F4 |
| D14 | 提示词**不做单副本合流**——产品内双源保留，跨产品收敛归 phase 2（原 Q7） | 运行期硬加载 + 打包边界（§2.7 P1–P3）——机械约束 |

### 2.13 phase 2 演进通道（本批不实施）

phase 2 目标 = 「一个核 + 两个薄壳」：共享核心真正可 `import`，两壳各自只保留端特有部分。

**本批仅为它预留通道，不实施任何一步**：
- 单仓之内跨子目录 `import` 在技术上已可行（"禁跨仓 import"禁令随 R14 退役）；
- 但**当前不做**——`src/**` 差异实测远大于表层（`src/agent-tools` 中位相似度 0.24），
  真正统一需要独立的差异分析与迁移设计，属另一个板块。

**边界**：phase 2 若启动，应另建板块文档（按文档规范 §3.3 规则 3），不在本档扩张。

### 2.14 受影响文件清单

| 类别 | 范围 |
|---|---|
| **结构搬迁** | CLI 仓顶层全部条目 → `thincoder/`；VSC 仓全部条目 → `thincoder-vscode/`（subtree 并入） |
| **机检脚本（删改）** | CLI `scripts/doc-anchors.mjs`（299 → 删）· `scripts/check-doc-width.mjs`（367 → 删）· `scripts/check-ledger.mjs`（354 → 删）· `scripts/doc-impact.mjs`（141 → 措辞改写（§2.4）——±0，import 改指统一版）；VSC `scripts/check-doc-anchors.mjs（VSC 仓）`（411 → 删）· `scripts/check-doc-width.mjs（VSC 仓）`（365 → 删）· `scripts/check-ledger.mjs（VSC 仓）`（317 → 删）· `scripts/reconcile-lookup.mjs（VSC 仓）`（124 → 移仓 / 改指——import 改指统一版）；六档判据并入仓根统一版（§2.5）；调用点同步改指（两产品 test 面 + VSC `package.json` `doc:check`——§2.8；CLI `package.json` 无六档调用点——零改）；单源依赖改指见 §2.5；S4 |
| **机检脚本（新增）** | 合并仓根 `scripts/`（单份 ×3——文档锚 / 文档格式 / 台账；目录定死（仓根）· **档名沿用现有三名**——`scripts/doc-anchors.mjs` / `scripts/check-doc-width.mjs` / `scripts/check-ledger.mjs`（VSC 侧 `scripts/check-doc-anchors.mjs（VSC 仓）` 并入后取 `scripts/doc-anchors.mjs` 一名；§2.5）；拆分结构与实测行数见下注） |
| **测试（R1–R10 · R16 连带面——删跨仓断言段 + 调用点改指统一版脚本；净删为主）** | CLI `test/doc-anchors.test.mjs`（297 → −25±10——含 R2 T-V5-5⑦ 夹具重述，见 §2.4 R2 行）· `test/doc-consistency.test.mjs`（309 → −30±10）· `test/ledger.test.mjs`（285 → −35±15）· `test/ledger-surface.test.mjs`（333 → ±0——调用点改指）· `test/doc-impact.test.mjs`（90 → ±0——调用点改指）；VSC `test/doc-anchors.test.mjs（VSC 仓）`（362 → −40±15）· `test/doc-consistency.test.mjs（VSC 仓）`（255 → −30±10）· `test/ledger-check.test.mjs（VSC 仓）`（180 → −25±10）· `test/reconcile-lookup.test.mjs（VSC 仓）`（100 → ±0——随移仓改指）· `test/context-parity.test.mjs（VSC 仓）`（374 → −11±3——R16 跨仓防护段整段退役；S4）· `test/prompts-mirror-anchors.test.mjs（VSC 仓）`（155 → ≤−20——R10 跨仓段删 + T-DC16 随 R13 同步；S5）；**除本行列名者外，两产品其余测试档零改**（可枚举口径）；逐档实测 delta 以实施轮为准（口径 = `wc -l`） |
| **提示词** | 两产品 `src/prompts/`（15 档）+ `docs/design/prompts/`（15 档）——**结构保留**（D14）；仅退役其跨仓机制层 |
| **文档** | 两产品 `docs/README.md`（自持段改写——CLI `:114` as-of / `README（VSC 仓）:23` as-of；R12）；纪律档 = `docs/requirements/ENGINEERING-MODE.md` §1.19 / `ENGINEERING-MODE（VSC 仓）§1`（R12 / R14 句）+ CLI `docs/design/ENGINEERING-MODE.md` 同源句（R14）+ VSC `docs/requirements/AGENT-LOOP.md:302（VSC 仓）` N-CL4 · VSC `docs/design/README.md（VSC 仓）`「镜像差异表」· CLI `docs/design/TESTING.md` §11.6（R15——随 R12 / R13 同批）；提示词双源面（`src/prompts/` + `docs/design/prompts/` 各持）：`discipline-normal.md`（R12 自持节——CLI `:38` / VSC `:35` as-of）· `discipline-engineering.md`（R12 自持节 + R13「跨仓批」条）；两产品 `AGENTS.md`（「镜像提示词约定」段改写——CLI `:21` / VSC `:15` as-of；R11 附加面）；**本板块两档**（`../requirements/TWO-REPO-MERGE.md` + 本档——R24a 标注面 + 自身锚处置见 §2.5）；**六档脚本引用面**（非命令形态 190——跨 14 档；登记与分界见 §2.5；命令形态零改） |
| **CI** | 新增合并仓根 `.github/workflows/`；原 VSC 工作流迁出子目录 |
| **仓根级** | 新增 `.gitattributes` / `.gitignore` / `README.md`（合并仓总览） |
| **产品级配置（批 1 补正——批 2 首项）** | 新增 `thincoder/.gitignore`（0 → 2 行；内容 / 依据 / 探针验证 = §2.10）——**批 2 首项 = 批 1 补正：产品级 `.gitignore` 落位 + 探针验证 `git check-ignore` 命中** |
| **清理** | 两仓未跟踪临时产物（迁入前删除） |
| **产品代码** | **零改动**（F7 / B1） |

> **行数口径（2026-09-13 第 2 修正轮）**：本表行数一律 **`wc -l`**（= 换行符计数；与编辑器「末行」显示差 1 属末尾空行所致——非行数变更）。
> **>300 行档拆分审视（2026-09-13）**：测试档 CLI `test/doc-consistency.test.mjs`（309）· `test/ledger-surface.test.mjs`（333）·
> VSC `test/doc-anchors.test.mjs（VSC 仓）`（362）· VSC `test/context-parity.test.mjs（VSC 仓）`（364——批 2 后实测；终态仍 >300，归后续批复核）——
> 本批均净删向或 ±0、不新增结构体，**本批不拆**；终态若仍 >300（软线），按既有拆分触发（切法 = 用例组二分 · 判据 = D18 四条）归后续批复核。六档机检脚本为删除项（拆分无对象）。
> **统一脚本拆分与行数——实测落地（R24a——2026-09-13 收正轮）**：统一脚本实测落为 **8 档**（批 2 补做轮落地；切点与定名依据见批次档 §5 批 2 补做轮），
> 全部 ≤300 行（`wc -l` 口径）：`doc-anchors.mjs`（90——入口 / 域驱动 / 报告）· `doc-anchors-v5.mjs`（255——V5 锚引擎）· `doc-anchors-core.mjs`（231——VSC 锚引擎）·
> `doc-anchors-targets.mjs`（139——采集面）· `check-doc-width.mjs`（109——入口 / 报告 + 宽度判据）· `check-doc-width-core.mjs`（272——判据核：域驱动 + 判据 + 基线）·
> `check-ledger.mjs`（259——入口 / 定位判序 / 报告）· `check-ledger-core.mjs`（151——判据核）。
> **「各文件目标 ≤300 行」已达成**（最大 272——`check-doc-width-core.mjs`；「末行」显示 273——差 1 属末尾空行，同本表口径注）；>500 行硬上限无对象。

### 2.15 迁移步骤与回滚点（N4）

| 步 | 动作 | 回滚点 |
|---|---|---|
| S0 | 两仓全量备份 = `git clone --mirror` 至**仓外目录**（CLI / VSC 各一份）+ 未跟踪产物另行归档（tar / 目录拷贝）；清理未跟踪产物 | 备份即回滚点（恢复形态 = mirror 恢复仓库 + 产物归档回拷——T-M18 按此验收） |
| S1 | 在 CLI 仓内 `git mv` 顶层条目至 `thincoder/`，提交 | `reset --hard` 回退该提交 |
| S2 | `git subtree add --prefix=thincoder-vscode` 并入 VSC 历史，提交（**前置 = §2.3 实施前必验项——tag 行为 + graft 追溯实测**：副本仓并入后抽查 `git log --follow -m -- thincoder-vscode/package.json` 与跨搬迁档 `git blame`——记录基准供 T-M8 判定；单 `--follow`（未给 `-m`）在 graft 合并提交上返回空——工作形态 = `--follow -m` 或 `git blame`） | `reset --hard` 回退（subtree 并入是单次提交） |
| S3 | 建仓根级配置与总览；迁 CI 工作流 | 同上 |
| S3b | 旧 VSC 仓远端**置归档 / 只读**（远端动作）——**不可逆**：置前须用户确认（N4） | 不适用——确认门前不执行；已置则不可逆 |
| S4 | **批 2 首项 = 批 1 补正：产品级 `.gitignore` 落位（`thincoder/.gitignore`，§2.10）+ 探针验证 `git check-ignore` 命中**；机检脚本单仓化（R1–R9 · R16 删改 + 统一版三档落位——档名 / 仓根 / 执行根与扫描域口径见 §2.5）——含连带测试档与调用点处置（两产品 test 面——含 VSC `test/context-parity.test.mjs` 跨仓防护段（R16）/ VSC `package.json`——§2.14）；`doc-impact.mjs` 措辞改写（§2.4）；**本板块两档六档锚退场注记**（§2.5——含 R16 行坐标同批）；现行文档非命令形态脚本引用随批处置（§2.5 登记面） | 回退脚本改动提交 |
| S5 | 提示词跨仓机制层退役（按 §2.7；含 VSC `test/prompts-mirror-anchors.test.mjs` 跨仓断言段删——R10；两产品 `AGENTS.md` 镜像约定段改写——R11 附加面） | 同上 |
| S6 | 文档纪律句改写（R12–R15——含提示词自持节两副本与端差句；**R16 连带文档面——T-CI-11 引用行退场注记**）；**本板块两档复跑 V5**（自身锚零悬空——T-M17 / T-M21 面）；§2.5 非命令形态引用登记面复核 | 同上 |
| S7 | 两产品全量测试 + 机检全绿 + 发布链演练 | 任一步失败即回退至 S0 |

**每步独立提交**——这是 N4「任一步可退」的兑现方式。

---

## 3. 测试（Testing）

> 每条功能性需求至少一个用例。T = 被测项编号；判定以**可观测结果**为准。「事实依据」列 = 佐证号（B = §2.1 事实基线 / R = §2.4 退役清单）。

### 3.1 正常路径

| 用例 | 对应需求 | 事实依据 | 输入 | 预期输出 |
|---|---|---|---|---|
| T-M1 | F1 | — | 合并仓根执行 `git ls-tree --name-only HEAD` | 顶层仅含 `thincoder/`、`thincoder-vscode/`、仓根级配置与总览——两产品分居子目录 |
| T-M2 | F1 / F7 | — | 两产品各自全量测试 | 各自全绿，与迁移前基线一致；`src/**` 无行为差异 |
| T-M3 | F2 | — | `thincoder/` 内 `npm pack`；`thincoder-vscode/` 内 `vsce package` | 两产物各自可生成，互不触发对方链 |
| T-M4 | F3 | — | `git log --follow -m -- thincoder-vscode/package.json`（或 `git blame`——无需附加参数） | 可回溯至 VSC 仓并入前的提交，历史连续——批 1 实测基准（干跑仓 ×2 + 正式仓三处一致）：单 `--follow`（未给 `-m`）返回空 · `--follow -m` = 234 条 · `git rev-list --count HEAD` = 2251 · VSC tip `--is-ancestor` = YES · `git blame` 归属 `^d27f773c` 跨 graft 连续 |
| T-M5 | F4 | R1–R9 | 合并仓内检索跨仓判据（R1–R9 落点）——**检索口径 = 已退役判据符号五名**（`PEER_PREFIX` / `PEER_DIRS` / `domain-out` / `resolvePeerRoot` / `SIBLING_NAMES`）**逐个检索须零命中**（射程 = 两产品 `src/` · `test/` · `scripts/` + 仓根 `scripts/`） | 全部删除——**五名零命中**（2026-09-13 实测——代码 / 脚本 / 测试面零残留；文档层 as-of 证据记录（R 表 / 批次档留痕）不属射程）；另登记 `PEER_*` 裸字面**白名单两处**（并发实例机制、与跨仓判据无关——批 4 复跑不误红）：`PEER_WRITE_TOOLS`（`thincoder/src/peer-domains.mjs:31`）· `PEER_DOMAIN_HOT_MS`（`thincoder-vscode/src/extension/peer-domains.mjs:30`） |
| T-M6 | F5 | — | 单仓化后运行文档机检（V1 / V5 / 台账） | 合并仓全域零红——**口径 = 退出码 0**（VSC 域报告态：报告行不阻断——§2.9） |
| T-M7 | F6 | — | 访问旧 VSC 仓远端 + 校验 VSC `package.json` 的 `repository` 字段 | 归档只读可达；`repository` 字段值**仍指向旧 VSC 仓**（现值 = `https://github.com/xinbo-tech/thincoder-vscode.git`）——不得改为新仓 |
| T-M8 | N2 | — | `git blame` 抽查跨搬迁档（基准 = §2.15 S2 前置实测记录——工作命令形态 `--follow -m` 与 blame 归属形态） | 归属连续（工作形态 = `--follow -m` 或 `git blame`），不出现整档归并为搬迁提交——批 1 实测基准：VSC `thincoder-vscode/package.json` 归属 `^d27f773c`（跨 graft 连续）· CLI `thincoder/src/log.mjs` 归属 `0b37f4219`（跨搬迁连续） |
| T-M22 | F4 | R1–R10 · R16 | 合并仓内检索「自指防护 / 缺对端 fail-closed」类跨仓断言——**检索域 = 两产品全部测试档** | 跨仓断言段已删、**残余为零**（射程 = R1–R10 · R16 判据家族——含 context-parity T-CI-11 同型守卫）；产品内双源守卫断言保留（本端同名集合相等 + 本端镜像节引用可解析） |
| T-M23 | F4 | R11 | 两产品 `src/prompts/` + `docs/design/prompts/` 检索跨仓机制层措辞（对端发现 / 跨仓逐字断言） | 跨仓机制层措辞**零残留**；产品内双源结构保留（D14——两目录同名集合不变） |
| T-M24 | F4 | R12 | 纪律层提示词与两产品 `docs/README.md` 内检索「跨仓」「他仓」键残留 | 改写为仓内规范——**零跨仓键残留** |
| T-M25 | F4 | R13 | 纪律层提示词检索「每仓一轮」「跨仓批」口径 | 已改写——**零残留** |
| T-M26 | F4 | R14 | 纪律层提示词与需求档检索「禁跨仓 import」「跨仓 import」 | 禁令已删——**零残留** |
| T-M27 | F4 | R15 | 合并仓内检索端差登记语境——三落点：VSC `docs/requirements/AGENT-LOOP.md:302（VSC 仓）` N-CL4 · VSC `docs/design/README.md（VSC 仓）`「镜像差异表」· CLI `docs/design/TESTING.md` §11.6 | 已改写为产品侧对位语义或退场注记在册——**跨仓端差机制叙事零残留**（「（CLI 侧）」产品侧注记不计） |
| T-M28 | —（D11——非 F 级） | B11 | 合并仓根 CI 工作流实跑（推送触发；或本地等效命令 + 工作流结构核对） | 两产品 job 各自绿（含 CLI job——D11 已定案执行）；全域机检 step 绿 |

### 3.2 边界情况

| 用例 | 对应需求 | 事实依据 | 输入 | 预期输出 |
|---|---|---|---|---|
| T-M9 | F5 | B4 | 两产品同路径文档（如各自的 `docs/design/TESTING.md`）同时纳入扫描域 | 按产品前缀隔离解析，**无 basename 一对多 fail-open** |
| T-M10 | F5 | B5 | 现行文档内的 `thincoder/…` / `thincoder-vscode/…` 路径 token | 全部按仓内相对路径解析命中；**零改写** |
| T-M11 | F4 | R1 | 旧 VSC 仓归档后仍位于工作区同层 | 机检**不**因兄弟目录存在而误解析（对端发现已删） |
| T-M12 | N1 | — | 共享用户级运行期状态（`config.json` · `checkpoints/{cwdHash12}/` · `logs/`） | 行为不变——两产品照常读写；**不涉迁移、无需验证**（cwd 键本地状态另见 `../requirements/TWO-REPO-MERGE.md` §3 的 N1 旁注——不属产品行为回归） |
| T-M13 | F1 | B10 | 两产品 `.thincoder/` 同名不同内容文件 | 各自保留于子目录内，互不覆盖 |
| T-M14 | F6 | B7 | 合并仓 tag 列表 | 无同名冲突（VSC tag 未搬入） |
| T-M15 | N3 | B12 | 迁移前未跟踪临时产物 | 已清理，不进入合并仓 |

### 3.3 错误条件

| 用例 | 对应需求 | 事实依据 | 输入 | 预期输出 |
|---|---|---|---|---|
| T-M16 | N3 | — | 迁移后文件清单与迁移前对账 | 任一缺失即**阻断**，不得带病推进 |
| T-M17 | N3 | — | 合并仓内指向已删判据的残留引用 | 机检报红（文档锚悬空）——不得静默通过 |
| T-M18 | N4 | — | 任一步骤失败 | 可从 mirror 备份恢复仓库、从产物归档恢复被清理文件——状态与备份点一致（S0 形态） |
| T-M19 | N5 | — | 发布链演练（dry-run / 预发） | 两产品各自 exit 0；任一失败即视为迁移未完成 |
| T-M20 | F4 | R7 · R10 · R16 回归 | 合并后对"跨仓断言"类测试 | 相关断言与测试**已删除**——不存在"静默通过的空转断言" |
| T-M21 | N6 | — | **本板块两档**（`../requirements/TWO-REPO-MERGE.md` + 本档）纳入扫描域 | 不引 V1 / V4 / V5 红 |

---

## 4. 实施分批建议

| 批 | 范围 | 可独立回滚 | 依赖 |
|---|---|---|---|
| **批 1 · 搬迁** | S0–S3b（清理、`git mv`、subtree 并入、仓根配置、CI 迁移、旧仓归档确认门） | 是 | 无 |
| **批 2 · 机制退役** | S4（R1–R9 判据删除 + 机检单仓化 + 连带测试档 / 调用点处置）；**批 2 首项 = 批 1 补正：产品级 `.gitignore` 落位（`thincoder/.gitignore`，§2.10）+ 探针验证 `git check-ignore` 命中** | 是 | 批 1 |
| **批 3 · 提示词与文档** | S5–S6（提示词跨仓机制层退役、纪律句改写、两产品 `AGENTS.md` 镜像约定段） | 是 | 批 1 |
| **批 4 · 验证收口** | S7（全量测试、机检、发布演练、验收勾销） | — | 批 1–3 |

批 1 与批 2 之间存在**硬依赖**：判据删除必须在搬迁完成后执行——否则删除动作本身会让现行双仓结构失去机检保护。

---

## 变更记录

- 2026-09-13：**需求层拆档（结构搬迁——零语义变更）**——需求层（总体需求 / 功能性需求 F1–F7 / 非功能性需求 N1–N6 / 与既有需求的关系）
  迁出为 `../requirements/TWO-REPO-MERGE.md`（板块镜像形态——`docs/README.md` §3.1 / §3.2 / §4 首注「新老划断」）；本档保留**设计层 + 测试层**
  （节号 §2 设计 / §3 测试 / §4 分批零位移）；F1–F7 · N1–N6 · R1–R15 · T-M1–T-M26 · B1–B12 · D1–D14 编号一字不改，档内 §1.x 交叉引用改指需求档。
- 2026-09-13：Q7 定案（D14）——实测确认两产品运行期各自硬加载 `src/prompts/`（P1/P2）且打包只收包根之内文件（P3）
  ⇒「单副本」在 phase 1 不可实现；§2.7 由「提示词合流」改写为「提示词承载」+ 偏差注；Q1–Q6 依用户裁定落为 D8–D13。
- 2026-09-13：建档——phase 1（目录合并）三层设计草案。事实基线为当日实测；裁定见 §2.12。
- 2026-09-13：**修正轮（评审 round 1 后）**——15 条发现逐条落修：F4 提示词要素收窄为跨仓机制层（`../requirements/TWO-REPO-MERGE.md` §2 / 本档 §2.7，Q7/D14 全档统一「已定案」）；
  §2.4 补 R15（端差登记）+ R10–R14 落点点名；§3 用例归位 F/N 号 + 补 R10–R14 检索式用例（T-M22–T-M26）；
  统一机检脚本定案（位置 / 调用 / 扫描域两态——§2.5 / §2.8 / §2.11 / §2.14）；§2.14 补行数标注与拆分计划；
  B2 / N1 共享运行期状态更正（含 cwd 键旁注）；tag 行为实施前必验项（§2.3 / §2.15 S2）；S0 备份形态 + S3b 归档确认门（§2.15）。
- 2026-09-13：**第 2 修正轮（评审 round 2 后）**——12 条发现 + 消费方全量扫补逐条落修：R1–R9 连带测试档与六档脚本消费方全量入册（含 `reconcile-lookup` / `ledger-surface` / `doc-impact` 面——删跨仓断言段 + 调用点改指）；
  §2.14 行数按 `wc -l` 口径重标注 + >300 档拆分审视 + 本板块两档自身锚处置（§2.5 / S4 / S6）；两产品 `AGENTS.md` 镜像约定段入 R11 / S5；V1「（CLI 侧）」豁免保留 + 单仓语义（§2.5 / R8）；
  T-M21 扩「本板块两档」+ 新增 T-M27（R15 / 检索式）/ T-M28（CLI CI）；CLI CI 统一定案（§2.9）；discipline-normal 归 R12 对齐（§2.14）；S2 前置补 graft 追溯实测（供 T-M8）；需求档 F5 补收窄注记（§2.6 / D10 对齐）。
- 2026-09-13：**第 3 修正轮（主 agent 追加裁决 2 条）**——① R16 增条（VSC `test/context-parity.test.mjs` T-CI-11——跨仓 fail-closed 守卫，与 R10 同范式：对端发现 + 自指防护 + 缺仓 fail-closed；合并后断言恒真、静默绿 ⇒ 整段退役，实施批 = S4）+ §2.14 测试行同步 + T-M20 / T-M22 射程含 R16 + §2.15 S4 / S6；
  ② 统一脚本档名钉死（沿用现有三名——命令形态零改）+ 执行根与扫描域口径落档（§2.5）+ 现行文档非命令形态脚本引用登记（非命令形态 190——跨 14 档；历史 AC 行留痕不改写）。
- 2026-09-13：**修正轮（评审通过后——3 条发现落修）**——① R2 行补抽取面消费者（排除式 5②——`scripts/doc-anchors.mjs:173`）+ T-V5-5⑦ 夹具 / `:146-147` 计数断言随单仓化重述 + 「`PEER_PREFIX` 全消费者面扫描」口径（§2.4 R2 行 / §2.14）；
  ② §2.7 结论括注改两侧实况（槽位面缺档静默空载 / advisor 面缺档即抛错——加载面断供；结论与 D14 不动）；
  ③ R16 连带文档面口径改语义面扫描（含 §17.9 / 跨仓只读叙述段——代表点补 `:1278-1284` / `:1302`；`:48` as-of 豁免；非按坐标清单）。
- 2026-09-13：**收口轮（评审通过后——P1/P2 面级措辞收正 + 档头状态刷新）**——① §2.7 P1 行「硬加载」收正为槽位面实况（**静默空载**——缺档返回空串；与落点 `src/prompt-overlays.mjs:18` 的 `catch { return "" }` 一致）；
  ② §2.7 P2 行改面级表述（槽位面（两侧同型）静默空载 / advisor 面缺档即抛错——抛错面 = CLI `src/advisor.mjs:63-69` + VSC `src/advisor/main.mjs:66-71（VSC 仓）`）；档头状态行改「**设计评审通过（轮次 3 PASS）· 待用户批准**」（建档日期等信息不动）；P3 行与结论句、D14 一字不动。
- 2026-09-13：**批 1 实施发现收正（2 条）**——① 追溯命令形态收正为实测工作形态 `git log --follow -m -- <path>`（或 `git blame`——单 `--follow` 未给 `-m` 时在 graft 合并提交上返回空）：
  §2.3 / §2.15 S2 / §3.1 T-M4 · T-M8 同步，实测基准写入（`git rev-list --count HEAD` = 2251 · VSC tip `--is-ancestor` = YES · `--follow -m` = 234 条 · blame 归属 `^d27f773c`）；
  ② 仓根 `.gitignore` 锚定漂移（产品级规则缺位——实施批 §5 发现 #2）——增产品级 `thincoder/.gitignore`（§2.10 / §2.14 / §2.15 S4 / §4；批 1 实测 `git check-ignore` 未命中），批 2 首项 = 批 1 补正：产品级 `.gitignore` 落位 + 探针验证 `git check-ignore` 命中。
- 2026-09-13：**记录同步轮**——① 批次档 §2 同步：批 2 范围条补入批 1 补正项（产品级 `thincoder/.gitignore` 落位 + 探针验证 `git check-ignore` 命中——与 §2.15 S4 / §4 同源）+ 批 1 S2 并入前必验项命令形态收正为实测工作形态（`--follow -m`——单 `--follow`（未给 `-m`）在 graft 合并提交上返回空，见 §2.3 / §3.1 T-M4）；
  ② 档头状态行刷新为「设计评审通过（轮次 3 PASS）· 用户已批准（2026-09-13）· 批 1（搬迁）已实施」。
- 2026-09-13：**设计收正轮（批 2 交付评审 #20 裁示 + F5 漏派工补记——5 项）**——① §2.6 增「项目台账单仓化」行（已实施——commit `c9f35f93`；批次档 §2 批 3 范围 + 批 2 验收同步补记）；
  ② §2.9 增「零红」口径（= **退出码 0**——VSC 域报告态不阻断；转闸依赖批 3 / S6 面清零）+ §3.1 T-M6 同步；
  ③ §2.14 拆分注收正为**实测落地结构**（8 档全部 ≤300——`wc -l` 最大 272）+「机检脚本（新增）」行指针同步；
  ④ §2.14「>300 行档拆分审视」清单补 VSC `test/context-parity.test.mjs（VSC 仓）`（364——终态仍 >300，归后续批复核）；
  ⑤ §3.1 T-M5 检索口径收正 = **已退役判据符号五名逐个零命中**（射程 = 代码 / 脚本 / 测试面）+ 白名单两处（`PEER_WRITE_TOOLS` / `PEER_DOMAIN_HOT_MS`——并发实例机制）。
