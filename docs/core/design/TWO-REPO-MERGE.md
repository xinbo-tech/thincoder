# 两仓合并（TWO-REPO-MERGE）· 设计

> 板块 = **两仓合并**——架构级机制档：本档承载**设计层 + 测试层**（需求层已拆出，见下）。
> 需求侧 = `docs/core/requirements/TWO-REPO-MERGE.md`（**统一面**）。
> **phase 1（目录合并）已闭环**；**phase 2（核心统一）**的演进通道 = `docs/core/design/CORE-UNIFICATION.md`（其需求侧 = `docs/core/requirements/CORE-UNIFICATION.md`）——不在本档展开。

## 2. 现行仓形态

### 2.1 布局

```text
thincoder/                          ← 单一 git 仓（默认分支 main）
├── thincoder-cli/                  ← CLI 产品（原 CLI 仓内容整体下移一层）
│   ├── bin/  src/  test/  scripts/  docs/
│   └── package.json  CHANGELOG.md  LICENSE  README.md  AGENTS.md  .gitignore
├── thincoder-vscode/               ← VSC 产品（subtree 并入，自带 .gitignore）
│   ├── extension.mjs  src/  webview/  locales/  assets/  test/  scripts/  docs/
│   └── package.json  CHANGELOG.md  LICENSE  README.md  AGENTS.md
├── docs/                           ← 基准层文档（core / cli / vsc 三部分 + 台账 + 批次档）
├── scripts/                        ← 仓根统一机检族
├── .github/workflows/test.yml      ← 仓根 CI（每产品一条 job）
├── .gitattributes · .gitignore     ← 仓根级（两产品共用）
└── README.md                       ← 合并仓总览
```

**关键约束（现行）**：两产品目录名沿用原仓名——这是**路径 token 零改写**的前提（`thincoder-cli/…` 形态现为仓内路径）。

### 2.2 两产品独立构建 / 独立发布

| 产品 | 包 | 发布链 |
|---|---|---|
| CLI | npm 包 `thincoder` | `prepack` 之外无构建；发布门 = `prepublishOnly` → lint → 单入口 `npm test`（含集成测试集）（CLI 设计档 `docs/cli/design/RELEASE.md`） |
| VSC | vsix `thincoder-vscode` | `vscode:prepublish` = lint + 文档机检 + 单入口 `npm test`（含集成测试集）；发布 = Marketplace + Open VSX |

两产品**互不触发**：`package.json` / `package-lock.json` 各自留在子目录内（**不合并 lockfile**）；发布动作本身仍是各自的既有流程，合并只改变**执行目录**。

### 2.3 历史承载

- **CLI 历史 = 仓历史**：搬迁是纯重命名，`git log` / `git blame` 对 CLI 文件跨搬迁**自动连续**（无需附加参数）。
- **VSC 历史以 subtree graft 并入**：按路径追溯需**合并感知**的写法：

```bash
git log --follow -m -- thincoder-vscode/package.json   # 单 --follow（未给 -m）在 graft 合并提交上返回空
git blame thincoder-vscode/package.json                # blame 跨 graft 无需附加参数
```

- **tag 归属**：merge 仓只为**新产品线**打 tag；旧 VSC 仓的 tag 留在归档仓内可查（不重命名、不搬移）——两套 tag 永不相撞。
- **旧 VSC 仓**：归档不删（Marketplace 元数据的 `repository` 仍指向它——该字段**不得**改为新仓）。

### 2.4 仓根级配置与产物

| 项 | 处置 |
|---|---|
| 仓根 `.gitattributes` / `.gitignore` | 仓根建一份（两产品共用）；各产品子目录内可保留自有规则 |
| 产品级 `.gitignore` | `thincoder-cli/.gitignore` 存在（目录锚定形态 `/.thincoder/index/` · `/.thincoder/tmp/`）——**依据**：仓根 `.gitignore` 的含斜杠规则锚定在仓根，产品内 `.thincoder/` 产物会脱保 |
| `.thincoder/` | 各产品子目录内各留一份（同名不同内容不复用）；仓根如需另行建 |
| `LICENSE` / 各产品 `CHANGELOG`（`thincoder-cli/CHANGELOG.md` ∥ `thincoder-vscode/CHANGELOG.md`） | 两产品各自保留（版本线与许可各自独立） |
| 未跟踪临时产物 | 不入版本控制；迁入前已清理 |

### 2.5 项目台账单仓化

仓根 `docs/TODO.md`（项目级唯一活档）+ `docs/TODO-archive.md`（两产品归档并入 + 单仓化归档节）；机检承接 = 台账机检默认清单改指仓根两档（`scripts/check-ledger.mjs`）。仓根 `README.md` 有「Project ledger」节登记。

### 2.6 CI 承载

`.github/workflows/test.yml` 居**仓根**（GitHub Actions 只读仓根工作流目录——留在子目录内会**静默失效**）：两产品各自一条 job（`working-directory` 指产品子目录）+ 一条**全域文档机检** step（统一脚本扫合并仓全域）。

**「零红」口径**：全域调用下 VSC 域引擎为**报告态**——退出码 0（报告行不阻断）；「零红」= **退出码 0**。

## 3. 文档层处置

| 对象 | 现行处置 |
|---|---|
| 路径 token（规范档 / 留痕档内的 `thincoder-cli/…` · `thincoder-vscode/…`） | **零改写**——子目录名沿用后自动成为正确的仓内路径 |
| `（X 仓）` 注记 | **停新增**；留痕档（`_archive/`）冻结不动；现行档**随触碰改写**（D10） |
| 同名撞车（两产品各自的同名档） | **不物理合并**——两产品文档分层保留在各自子目录内，撞车不成立 |
| 文档地图 | 基准层地图 = `docs/README.md`；各产品地图各留一份（各管各产品）；仓根 `README.md` = 合并仓总览 |
| 三部分落点（core / cli / vsc） | 规划 = `docs/core/design/DOC-SYSTEM.md`；迁移台账 = `docs/core/design/DOC-MIGRATION.md`（CLI 树）· `docs/vsc/design/VSC-MIGRATION.md`（VSC 树） |

## 4. 提示词承载（单源）

现状结构：唯一副本 = `thincoder-core/prompts/`（16 档，运行期加载面，两产品共用）；两产品 `docs/` 下的提示词档（15 档 × 2）已归档到 `_archive/`（历史参照，不再维护）。

| 层 | 对象 | 处置 |
|---|---|---|
| 跨仓机制层 | 对端发现 / 自指防护 / 跨仓逐字断言 | **退役**——合并后对端发现无对象 |

**单副本必须住核包内（机械约束，非偏好）**：npm tarball 与 vsix **均只收包根之内**的文件（CLI 的 `files` 无法收录父目录文件；vsix 打包根 = 扩展目录）。单副本若居仓根或另一产品内，两产品的运行期加载会同时断供（槽位面缺档**静默空载** / advisor 面缺档**即抛错**）；而「构建期拷入」会把 `src/**` 变成生成物，破坏开发期直跑源码。

## 5. 机检单仓化

合并后两套同名机检脚本不能各留一份（判据都建立在「本仓 vs 对端」二分上，单仓内该二分不存在）——收为**仓根一份**：

- **档名**：沿用 `scripts/doc-anchors.mjs` · `scripts/check-doc-width.mjs` · `scripts/check-ledger.mjs`（命令形态 `node scripts/<name>.mjs` 零改）；
- **执行根**：一律自合并仓根执行；
- **调用**：两产品门禁链各自调用仓根统一脚本并**传入本产品域**（避免发布门禁相互牵连）；
- **扫描域两态**：无域参 = **全域**（CI 全域调用与现行文档命令形态）；产品域态（门禁——显式传本产品域）；
- **判据核**（各档 ≤300 行）：`doc-anchors.mjs` · `doc-anchors-v5.mjs` · `doc-anchors-core.mjs` · `doc-anchors-targets.mjs` · `check-doc-width.mjs` · `check-doc-width-core.mjs` · `check-ledger.mjs` · `check-ledger-core.mjs`；
- **产品域外引用豁免**：带「对方产品侧」注记的引用不判 unknown-doc（单仓语义 = 产品域外引用豁免）。

## 6. 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D1 | 采用 **subtree** 并入 VSC 历史 | 系统 git 自带（零安装）、不改既有历史、回滚成本低 |
| D2 | 子目录名**沿用原仓名** | 路径 token 零改写 |
| D3 | 默认分支用 `main` | CLI 为主干；VSC 的 `master` 只作历史来源，不保留为分支 |
| D4 | **不搬 tag**，旧仓 tag 留归档仓 | 避开同名 tag；归档保留保证可查 |
| D5 | 两产品 `docs/` **保持分层不合并** | 同名撞车自然消解；避免按 basename 解析时一对多 fail-open |
| D6 | 跨仓判据**删除**而非改写 | 对端发现 / 对端根断言合并后**反向生效**（结论全错且不报红）——修补无法穷尽 |
| D7 | 旧 VSC 仓**归档保留** | Marketplace 元数据 `repository` 指向它 |
| D8 | 合并仓远端沿用 `thincoder` | 远端仓名与本地目录名解耦，迁移成本最低 |
| D9 | 合并仓根 = **原 CLI 仓目录原地改造** | 工作区布局影响面最小 |
| D10 | `（X 仓）` 注记：**停新增**、留痕档冻结、现行档随触碰改写 | 留痕档是历史；全量清理会制造大范围文档漂移 |
| D11 | CLI 侧 CI **顺路补齐** | 工作流本就必须迁至仓根，是天然时机 |
| D12 | 实施**分批** | 每批可独立回滚 |
| D13 | **不做**「双仓并存」过渡窗口 | 并存会让跨仓机制继续存活，违背本板块目标 |
| D14 | 提示词 = **单副本**（`thincoder-core/prompts/`，运行期硬加载 ⇒ 副本须在包内） | 承 2026-10-18 取消镜像裁定；打包边界见 §4 |

## 7. 跨仓机制退役面（现状）

**已退役判据五名**（代码 / 脚本 / 测试）——现状断言 = **逐个检索零命中**：

| # | 退役判据 | 原作用 |
|---|---|---|
| 1 | `resolvePeerRoot` | 对端仓根发现（兄弟目录扫描） |
| 2 | `PEER_PREFIX` | 对端前缀解析与裸直引跳判 |
| 3 | `domain-out` | 缺仓 / 域外口径 |
| 4 | `PEER_DIRS` | 跨仓形态判据（文档格式面） |
| 5 | `SIBLING_NAMES` | 兄弟仓族常量（台账面） |

**白名单两处**（`PEER_*` 裸字面，与跨仓判据无关——并发实例机制）：`thincoder-core/peer-domains.mjs` · `thincoder-vscode/src/extension/peer-domains.mjs`。

## 8. phase 2 演进通道（本档不实施）

phase 2 目标 = 「一个核 + 两个薄壳」：共享核心真正可 `import`，两壳各自只保留端特有部分。

- 单仓之内跨子目录 `import` 在技术上已可行（「禁跨仓 import」禁令已随本板块退役）；
- **但**实现层真分叉远大于表层——真正统一需要独立的差异分析与迁移设计，属**另一个板块**：`docs/core/design/CORE-UNIFICATION.md`（已启动，设计 + 测试；板块镜像需求档同层同名）。
- **边界**：phase 2 若扩张，应在其板块档内进行，不在本档扩张。

## 9. 现行形态的验证（持续有效）

| # | 检查 | 判据 |
|---|---|---|
| 1 | 文件完整性 | 迁移前后文件清单（含内容哈希）逐条对账——**零缺失** |
| 2 | 历史可达 | VSC 历史以 graft 并入且逐提交可达；跨搬迁档的 `blame` 连续（命令见 §2.3） |
| 3 | 测试 | 两产品集成测试集各自全绿（与各自基线一致） |
| 4 | 机检 | 单仓化后的文档锚 / 文档格式 / 台账机检在合并仓**全域零红**（全域口径由 CI 调用承载；产品门禁各自只扫本产品域） |
| 5 | 发布 | 两产品各自走一次完整发布链成功 |
| 6 | 产品行为 | **零行为回归**——共享用户级运行期状态（`~/.thincoder/config.json` · `checkpoints/{cwdHash12}/` · `logs/`）行为不变 |
