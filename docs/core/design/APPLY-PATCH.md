# apply_patch 工具权威语义（APPLY-PATCH）· 编辑工具板块

> 板块 = **编辑工具**；本档 = **apply_patch 语义的权威源**（逐工具权威档之一）。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6 · §8.2——本档不复制其内容（D2）。
> 共享底层 = `docs/core/design/EDIT-HELPERS.md`（EOL 写回 / 新建随目录多数派——本档只指不述）。
> 双端：CLI `thincoder-core/tools/patch.mjs`（`applyPatchTool`）· VSC `thincoder-vscode/src/tools/more-file.mjs`（同机制，各自实现）（VSC 自持镜像已删——W14 已迁核，现体同指 `thincoder-core/tools/patch.mjs`）。 （迁移期引文）
> 模型可见描述 = `thincoder-core/tool-docs/apply_patch.md`（提示词面 / 产品代码）。
> 需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）。
> 建档：2026-09-15（**B 式迁移轮 · 第 1 批**——`thincoder-cli/docs/design/APPLY-PATCH.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。

## 1. 定位

apply_patch = **统一 diff 形态应用到一或多文件，原子**（任一 hunk 失败 → 全不写）。

**适用**：一次新建多个文件（每文件 `--- /dev/null` 头）· 整文件替换 · 跨文件重构（改接口 + 全调用方）——一个 diff 调用覆盖整变更（一次授权 / 一个 undo 单元 / 一个 turn）。
**不是**：单文件小改（→ edit 更简单）、整文件重写（→ write）、删文件（→ delete 工具）。

## 2. 参数与语法

- `patch`（必须）——unified diff 文本。每文件 `--- a/<path>` / `+++ b/<path>` 头对，后接 `@@ -old,count +new,count @@` hunks；`--- /dev/null` = 新建文件。

**宽容格式**（三处）：

- `+++ b/<path>` 头对可省：既有文件可写 lone `--- a/<path>`（或 `--- b/<path>`）后直接接 hunk；**新建仍须** `--- /dev/null` + `+++ b/<path>`。
- **无坐标 hunk**：裸 `@@` 若上下文行 <2 且含 ≥1 `-` 行 → 定位锚 = hunk 内匹配行序列（空格上下文 + `-` 行按出现序）连续；唯一序列匹配即应用（`-` 后随 `+` = 替换、无 `+` = 删除）；0/1 上下文同待遇；多匹配 → 报错（matches N locations）；**纯 `+` 零上下文（无 `-` 锚）仍拒**（位置不明）；上下文 ≥2 走既有路径。
- **文件头容缺**：`--- /dev/null` 缺 `+++ b/<path>` → 仍拒并**特报**（新文件名不可从 `---` 侧推导）；`-- x` 内容删行不误判文件头；多文件补丁完整 / 容缺可混合；空段过滤（不虚报 touchedPaths）。

标准坐标格式 `@@ -old,count +new,count @@` 不变，两格式并存；hunk 体 `-` / `+` 行语义不变。

## 3. 定位规则（hunk）

hunk 按**上下文 / 删除行定位，非行号**——但上下文必须与文件**精确匹配**（先 `read` 再从实际内容生成 patch）；一 hunk 上下文匹配多处 → 拒绝（须补更多上下文）。

## 4. 约束

- **删文件不支持**（→ delete 工具；`--- b/... +++ /dev/null` 形态显式拒绝）。
- **多文件原子**：任一 hunk 失败 → 全不写。
- **返回值**：`Applied patch to N file(s)` + 每文件变更行 + 变更 JS 文件的 syntax-check 注。
- **EOL**：写回按原行尾（`docs/core/design/EDIT-HELPERS.md` §4 F1）；新建按目录多数派（F2）。

## 5. 何时用（模型路由）

跨文件 / 多文件 / 整块 / 新建多个 → apply_patch（一次授权）；单文件小改 → edit；加新行 → insert_after；整文件重写 → write。（路由权威 = AGENT-LOOP 板。）

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 工具对象 / 执行 | `thincoder-core/tools/patch.mjs:171`（`applyPatchTool`） | 导出在位 |
| 删文件拒绝 | `thincoder-core/tools/patch.mjs:49` | 错误文案在位 |
| `/dev/null` 缺 `+++` 特报 | `thincoder-core/tools/patch.mjs:63` | 错误文案在位 |
| 返回文案 | `thincoder-core/tools/patch.mjs:243`（`Applied patch to N file(s)`） | 在位 |
| 注册面 | `thincoder-core/tools/index.mjs:5`（import）· `:21`（注册表） | patch 组（apply_patch / delete） |
| 描述面（模型可见） | `thincoder-core/tool-docs/apply_patch.md` | 在位（`DESC()` 加载） |
| VSC 对位实现 | `thincoder-vscode/src/tools/more-file.mjs:239`（`apply_patch`）（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/patch.mjs`） | 同名机制 · 独立实现 （迁移期引文） |

**VSC 端差异（并入 · 批 8）**：VSC 端 `more-file.mjs:239`（`apply_patch`）——同机制独立实现；EOL 写回 / 新建随目录多数派（F1 / F2）同口径（`docs/core/design/EDIT-HELPERS.md` §4）；**无编辑器路径分支**（apply_patch = 整文件域、不进编辑器 range——见 §1）；宽容格式三处（§2）双端同。（W14 已迁核——VSC 自持镜像已删，现体 = 核 `thincoder-core/tools/patch.mjs`） （迁移期引文）

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-P1 | **hunk 按锚序列定位**（无坐标 hunk 须含 ≥1 `-` 行） | 上下文/删除行是唯一可靠锚；纯 `+` 无锚 = 位置不明（宁可拒，不许猜） |
| D-P2 | **多文件原子**（全有或全无） | 半应用的多文件补丁留下不自洽工作树；否决「逐文件提交部分成功」 |
| D-P3 | 文件头**容缺但特报**（新建名缺 `+++` 显式拒） | 新文件名不可推导——特报优于笼统语法错；否决「按 `---` 侧推名」 |
| D-P4 | 删文件**不做**（专用 delete 工具承担） | 删除是闸控动作，混入 patch 会把审批面变宽 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/APPLY-PATCH.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行 | 时点状态行 | 批次语境——现行态已入 §1–§5 |
| 旧档「变更记录」节（2026-09-08 文档重组） | 文档重组流水 | 历史叙述——本档自有变更记录 |
| 旧档括注的 `TOOLS.md` §6.4 节号与 `AGENT-LOOP.md:140-141` 旧坐标 | 旧节号 / 迁移前行号 | 现行地图节号 = `TOOLS.md` §6.6；路由指针见 §5（不引旧行号） |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 描述面正文（参数描述全文） | 模型可见文本 | **提示词面 = 产品代码**——落点 `thincoder-core/tool-docs/apply_patch.md` |
| delete 工具语义 | 删除面契约 | 非编辑工具——归 `docs/core/design/TOOLS.md` §6.7 逐工具契约 |
| VSC 档（`thincoder-vscode/docs/design/APPLY-PATCH.md`）的批次材料 / 变更记录 | 一次性材料 + 历史流水 | VSC 差异面已并 §6.1（VSC 端差异块）；批次档承载 |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 1 批**）：建档——`thincoder-cli/docs/design/APPLY-PATCH.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；坐标改写为现状路径（`thincoder-core/tools/patch.mjs` · VSC `more-file.mjs`）；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-09-15（**B 式迁移轮 · VSC 第 8 批 · 并入 · eng-designer**）：§6.1 增 **VSC 端差异块**（同机制 / EOL 同口径 / 无编辑器路径分支）；§8.2 登记 VSC 源档批次材料。
- 2026-09-15（**S2 W14 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：双端行 + §6.1「VSC 对位实现」行 + VSC 端差异块补迁核注（VSC 自持档已删——现体 = 核 `thincoder-core/tools/patch.mjs`）；机制条文零改。
