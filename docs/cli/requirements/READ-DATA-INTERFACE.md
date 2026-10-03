# 只读数据接口（READ-DATA-INTERFACE）· CLI 面 · 需求

> 板块 = **只读数据接口**（台账 ∥ 批次档 数据对外暴露——外部工具个性化整合用，免直读私有 SQLite）。
> 配对设计档 = `docs/cli/design/`（归属设计轮定——候选 = 新档 `READ-DATA-INTERFACE.md`）。
> 建档：2026-10-03（用户转外部意见〔「@指甲长得长」〕+ 同日裁定「桌面放弃吧。只做cli」——桌面面裁弃；台账 #886 ∥ #887）。
> 层归属 = **CLI 面**（P2——命令面 ∥ ACP 协议面；两出口共用核读单源）。

## 1. 总体定位

**为谁解决什么问题**：外部工具（例：开发进度 / 需求池面板）要按自己的方式整合 ThinCoder 的台账与批次数据——现在只能直读**无版本标记的私有 SQLite**（台账库无 `user_version`——迁移靠运行期探测列）或不可附着的内通道；本板块提供**带版本号的只读数据接口**（CLI 命令面 + ACP 协议面），使外部消费者不必直读私有库。

**范围边界（不做）**：不做桌面面（2026-10-03 用户裁定「桌面放弃」——`ledger:read` / `ev:ledger` 现状零动）∥ 不提供**写**面（全只读——零写命令 / 零变更方法）∥ 不承诺无版本历史库的结构推断（`schemaVersion` 为对外标记本身）。

## 2. 功能性需求

| # | 需求（说明 + 判定句） | 范围边界（不做） |
|---|---|---|
| **FR1** | **CLI 命令面**：`thincoder ledger list --json`——台账行原样输出（id ∥ kind ∥ status ∥ title ∥ board ∥ req_doc ∥ task_book ∥ trigger ∥ executor ∥ created_at ∥ updated_at ∥ closed_at）+ **`schemaVersion` 结构版本号**；**`evidence` 默认不输出、`--full` 才给**（实测单条 500–2000 字符）。判定句：① `--json` 输出可被 `JSON.parse` 且含 `schemaVersion`；② 默认输出零 `evidence` 键 ∥ `--full` 含；③ 行集与核 `ledgerQuery` 同源同数 | 不做写面命令 ∥ 不改 `ledger migrate` / `audit` 现有语义 ∥ 不做无版本库的结构推断 |
| **FR2** | **三口径**（FR1 同批）：① **多项目范围** = 当前项目（默认）∥ `--cwd <路径>` ∥ **同族**（`--family`——口径与 `docs/core/design/LEDGER.md` §7 族定义**成套**）；② **无台账 ⇒ 返回空集**（exit 0，非报错）；③ **全程只读**——读路径不得建库 / 不得迁移 / 不得任何写副作用。判定句：① 三范围各可核（当前 ∥ 指定 cwd ∥ 同族合计）；② 空库 exit 0 + 空集；③ 读路径零 DDL（对旧库读一次后库文件结构零变） | 不做跨机器 ∥ 不做远程 ∥ 族定义不另立（单源 = LEDGER.md §7） |
| **FR3** | **ACP 协议面**：只读方法 `ledger/list` ∥ `ledger/count` ∥ `batch/list` + **「数据已变更」通知**（挂现有 notify 通道）。`batch/list` 同时给批次级（§1 进行中 / 已收口）与各段状态（§2 设计完成 ∥ §3 评审完成 ∥ §5 实施完成——词面 = `batch-skeleton.mjs` 词表单源；§4 / §6 无状态词，如实给「无状态词」）。判定句：① 三方法可调、回包只读数据；② 通知在数据变更后可达；③ `batch/list` 状态与文件面一致（解析器单源复用） | 不做写方法 ∥ 不改协议版本（沿先例——加方法不动版本；是否进 initialize 能力面 = 设计轮定） ∥ 不造 §4 / §6 状态词 |

## 3. 非功能性需求

- **N1 单源**：两出口（CLI ∥ ACP）共用**核读出口统一序列化**（核内读 API 单源——零 SQL 复刻 ∥ 零表名泄漏——沿「核只读出口透传」纪律）。
- **N2 版本面**：`schemaVersion` = 对外兼容性判据——结构变更须同步升号（对标 `memory.db` `PRAGMA user_version` 先例；台账库本批新增标记）。
- **N3 时序**：FR2 的族口径依赖台账族合计批（#882——`scopeMarkerOf` / `discoverFamily`）——同源成套，不另立。

## 4. 验收方向（机检面）

① `thincoder ledger list --json` 可解析 + `schemaVersion` 在场 + evidence 默认省；② 空库空集 exit 0；③ 只读证明（旧库读后零改）；④ ACP 三方法 + 通知可达（对拍文件面）；⑤ 双出口序列化同源（同一行集两出口等值）。

## 5. 依赖

- 上游：台账核读 API（`ledgerQuery` / `ledgerCount`——已在）∥ 族定义（#882——在批）。
- 下游：外部消费者（第三方面板——不在本仓）。
