# VSC 文档迁移规划（VSC-MIGRATION）· 设计 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；本档 = VSC 部分**文档面迁移**的设计（判据 · 落点规则 · 引用形态）。
> 需求侧 = `docs/vsc/requirements/VSC-MIGRATION.md`（F-M1–F-M9 / N-M1–N-M6——**同名成对**，N-b）。
> 判据（本档**不重述**——D2）= `docs/core/design/DOC-SYSTEM.md`：目标结构 §4 · 归属判据 **P1–P5** §5.1 · 命名 **N-a–N-d** §6 · 引用形态 **R1–R5** §7。

## 1. 接口契约

### 1.1 二分判据（什么是「活」与「历史」——可复核）

| # | 判 | 判据句 | 动作 |
|---|---|---|---|
| **二-1** | **活档** | 该档描述的机制/界面**在现行代码中在位**，且该档是它**在 VSC 树内的现行权威或唯一登记** | ⇒ 迁（内容重建入基准层活档） |
| **二-2** | **历史档** | 该档为**一次性交付记录**（档头自述「已交付核销 / 已实现 / 已批准+已实现」的施工过程稿），或**已被本树另一档显式取代**（含批 3 扩展形：机制结论已由根层活档单源承载） | ⇒ **就地留**（不迁；树降格后随之为参照历史） |

**依据列取值（逐档必填）**：

| 码 | 判据句 | 形态 |
|---|---|---|
| **①** | `docs/core/` 已有同话题活档 | 给该档路径（承载域） |
| **②** | 已被现行设计取代 | 给对照点（取代者档 + 节，或「档头自述取代」） |
| **③** | 只描述核内已单源化机制 | 给单源档路径 |
| **④** | 结构性不对称（该机制只在本部分存在） | 给机制名（`DOC-SYSTEM` §5.1 P2） |

### 1.2 落点规则（承 P1–P5，此处只给本端映射）

| 分类 | 落点 | 本端实例 |
|---|---|---|
| 活档 · 统一面（机制在 ≥2 部分存在） | `docs/core/<层>/<板块>.md` | VSC webview 之外的全部机制档（INVENTORY §8） |
| 活档 · 专有面（结构性不对称） | `docs/vsc/<层>/<板块>.md` | webview 面 · 配置面板 · 项目切换 |
| 历史档 | **归档保留**（`_archive/` 下原相对路径） | 15 设计档 + 1 需求档（INVENTORY §4 / §5） |
| 流程面（台账 / 批次档 / 地图） | `docs/` 根，**不进三部分**（P3） | 本规划零涉及 |

### 1.3 引用形态（迁移期口径——`R3` 落地前）

| # | 被引对象 | 形态 | 机检行为（现状实核） |
|---|---|---|---|
| **引-1** | 已迁入基准层的档 | 裸名 + 节号（同部分**同层**）∥ **带层前缀**（同部分跨层，`design/<X>.md §N` / `requirements/<X>.md §N`——承 `DOC-SYSTEM` §7 R2）∥ 仓根相对全路径（跨部分） | V1 解析（按 basename，域内）；V5-A 排除式 5① 让给 V1 |
| **引-2** | **仍在产品树**的档（未迁） | `名称（VSC 侧）§N`（去 `.md` 去路径——承 `docs/README.md` §2 现状口径）；需给可解析路径时用 `` `thincoder-vscode/docs/...`（VSC 侧） `` | V1 不入判（无 `.md`）；V5-A 路径形态按仓根解析命中 |
| **引-3** | 代码坐标 | 仓根相对路径 + **符号名**（函数 / 常量 / 导出名——如 `thincoder-vscode/webview/ui.js` 的 `<函数名>`；不写行号） | V5-A 按仓根解析（`resolveFile` 候选①）——**产品树相对写法迁出后即失效**，故一律改写 |

### 1.4 权威性与维护（B 式的代价处置）

迁移完成后：**基准层活档 = 权威**；产品树旧档 = **参照历史**（保留 ≠ 维护——`docs/README.md` §2）。同一话题在两者同时存在期间，**以基准层为准**；旧档不参与内容同步（「不逐字一致、不加跨面同步依赖」——多实现面纪律）。

**归档形态（现状）**：`thincoder-vscode/docs/**` 已 `git mv` 入 `thincoder-vscode/docs/_archive/<原相对路径>`（恒等映射 · 正文一字未改）——参照历史可查 · 迁入即出机检源域；方案 = `docs/core/design/DOC-SYSTEM.md` §5.1（归属判据 P1–P5——归档形态即“参照历史”这一归属的落地）。

## 2. 分批计划（批序 · 每批 ≤6 档 · 写域）

| 批 | 内容 | 源档数 | 落点 | 写域 | 状态 |
|---|---|---|---|---|---|
| **批 1** | VSC 专有面（P2）**可迁部分** | 3 | `docs/vsc/design/SETTINGS.md` · `docs/vsc/design/PROJECT-SWITCHER.md` · `docs/vsc/requirements/WEBVIEW.md` | `docs/vsc/**` | **已落** |
| **批 2** | `WEBVIEW（VSC 侧）`（1867 行）拆分 + 实迁 | 1（→3 档） | `docs/vsc/design/{WEBVIEW,WEBVIEW-PROTOCOL,WEBVIEW-INPUT}.md` | `docs/vsc/**` | **已落** |
| **批 3** | 统一面（P1）64 档**复判** + 纯新建第一批（3 板块设计 / 需求成对） | 6 | `docs/core/{design,requirements}/{TURN-CAP-CONTINUE,SEND-STALL-DISTILL,ESCALATE}.md` | `docs/core/**` | **已落** |
| **批 4** | 统一面**纯新建**（落笔时核层无同话题档者） | 6 | `docs/core/{design,requirements}/{DOC-CODE-RECONCILE,AGENT-PARAMS,NORMAL-MODE,MULTI-INSTANCE-COLLAB,SETTINGS-TOOL,STRUCTURE-DEBT}.md` | `docs/core/**` | **已落** |
| **批 5** | §8A 剩余纯新建（5 档——ADVISOR-CONVERGENCE 翻转跳过 · PROJECT 拆分双落）+ 本档拆分 | 6 | `docs/core/requirements/{DESIGN-TOKEN-SETTLEMENT,ENG-TOKEN-BINDING,PORTABILITY,VERIFY-REDESIGN,PROJECT}.md` · `docs/vsc/requirements/PROJECT.md` | 新建 core 需求档 + `docs/vsc/**` | **已落** |
| **批 6+** | §8B 并入清单 **26 条**（转并入既有面）+ 待裁 D1–D3 定判后处置 | 26+ | 逐条给定（清单面已收口） | `docs/core/**`（+ 待裁项 `docs/vsc/**`） | **已落** |
| **收尾批** | 产品树两份地图（设计树 · 需求树各一份）随树降格处置 | 2 | —— | 父侧 | 待排（地图处置仍待父侧） |

## 3. 判据缺口（登记）

**未销的判据缺口（登记，非待裁）**：`DOC-SYSTEM` §5.1 的 P1/P2 对「镜像面」无专条——建议随 §8B 声明面批次补一条判据句（目标档 `docs/core/**`）。

