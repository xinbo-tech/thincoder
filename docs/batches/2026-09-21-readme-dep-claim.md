# 批次档 · 2026-09-21 · 产品文本口径收正（readme-dep-claim）

> 前情：无（新批）。
> 触发：用户 2026-09-21 06:2x 指出——「readme 里说零依赖，但是现在由于内核共享了，所以只能说是零外部依赖了。」
> 授权：用户 06:24「**开始**」= 本批点火（设计评审点火权与 §4 批准权仍在本批会话面——按本批进程逐次请示）。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：✅ 已收口 2026-09-21（父侧）

**用户指认（2026-09-21 06:2x · 逐字）**：「readme里说零依赖，但是现在由于内核共享了，所以只能说是零外部依赖了。」

**实核（父侧逐字 grep 全域 · 落点 4 处）**：

| # | 档:行 | 现文（逐字） | 问题 |
|---|---|---|---|
| 1 | `thincoder-cli/README.md:5` | "pure `.mjs`, no build step, **zero npm dependencies**, native Node.js" | 无修饰 ⇒ 与现状不符 |
| 2 | `thincoder-cli/README.md:11` | "no dependency is allowed. **The project's `node_modules` is empty.**" | **事实不符**（node_modules 现含 `@thincoder/core`——link / 装入两态均有） |
| 3 | `thincoder-cli/package.json:4` | description「**zero dependencies**, no build step…」（npm 页可见） | 同上 |
| 4 | `thincoder-cli/AGENTS.md:5` | "**Zero-dependency** AI coding CLI" | 同上 |

**既有裁定（不需要重新设计口径）**：设计档 `docs/core/design/CORE-UNIFICATION.md` §2.9 #5：「CLI『零运行时依赖 / 无构建步骤』承诺：**改述**——零依赖只约束**第三方**（B7 自述语境；自家核不在范畴）」+ 需求 `docs/core/requirements/CORE-UNIFICATION.md` **N7**「零第三方运行时依赖」⇒ 本批 = **产品文本侧补执行**（口径 = 「零第三方依赖」）。

**范围（用户已认）**：仅上表 4 处（父侧提案 → 用户 06:24「开始」）。**不扩面**：
- `README.md` 其余 `zero-dependency`（`:19` 工具集 / `:178` MCP / `:457` / `:473` TUI）= **组件级**、第三方语义仍真 ⇒ 保留；
- 文档面「零依赖」多处（设计/需求档）= 语义已指第三方（N7 承载）⇒ 不动；
- 历史面（`_archive/**` / `CHANGELOG.md` / `TODO-archive.md`）= 快照 ⇒ 不动。

**范围补全（设计轮实核发现 · 父侧 06:3x 裁定折叠）**：父侧初核的 4 处**不是完整类集**——同款无修饰 claim 另有 4 处（第 5–8 处）：`thincoder-vscode/README.md:7`（"zero npm dependencies"——VSC 亦依赖核 ✗ 同款失准）· `thincoder-cli/AGENTS.md:18`（"Zero npm runtime dependencies"）· `thincoder-cli/README.md:225`（"no npm dependencies allowed"）· 仓根 `README.md:4`（"they share no runtime code path"——内核共享后失准）。⇒ **全部折叠入本批**（用户诉求 = claim 准确 ✗ 只改 4 处会留下同类错文 ⇒ 补全 = 完成用户要求而非扩面）；组件域 `zero-dependency` 行（`:19` 工具集 / `:178` MCP / `:457` / `:473` TUI 等）= 组件级第三方语义仍真 ⇒ 保留不动。

**路由判定**：README / `package.json` / `AGENTS.md` = **产品文本面**（对外契约 ✗ 非工程工具面）⇒ 走全链（设计 → 评审 → §4 → eng-coder），**禁父侧直改**。

**台账**：#181（本批）。

## §2 批次任务（eng-designer）

（待设计。）

**状态行**：🔄 设计完成（类集 8 处 · fix 轮 ×2）· 评审 pass（2026-09-21 · eng-designer）

> 上方占位行「（待设计。）」已由本段替代——以本段为准（append-only 面不删既有行；清理归父侧轮次）。
> 本批唯一设计承载 = 本段（小批 · 4 处文本替换——不另建设计档；口径已在既有裁定承载，本批零新语义）。

**口径源（直接引用 · 不重定）**：设计 `docs/core/design/CORE-UNIFICATION.md` §2.9 #5（`:1138`）「零依赖只约束**第三方**（B7 自述语境；自家核不在范畴）」+ 需求 `docs/core/requirements/CORE-UNIFICATION.md` N7（`:120`）「零第三方运行时依赖」。本批 = **产品文本侧补执行**；台账 #181。

**A 逐字改述表（4 处 · before → after · 仅替换 · 三档其余字节零动）**

> 块内 `before（old_string）：` / `after（new_string）：` 为标号行；标号后的整行 = 逐字文本（含其内反引号；缩进按原文）。实施 = 按 old_string 精确匹配替换为 new_string；README `:11` / `AGENTS.md:5` 的 after 为**单行**（勿折行）。

A·① `thincoder-cli/README.md:5`
```text
before（old_string）：
**A "thin" AI coding agent: pure `.mjs`, no build step, zero npm dependencies, native Node.js.**
after（new_string）：
**A "thin" AI coding agent: pure `.mjs`, no build step, zero third-party dependencies, native Node.js.**
```

A·② `thincoder-cli/README.md:11`
```text
before（old_string）：
Design philosophy (the entire meaning of the name): if the Node standard library can do it, no dependency is allowed. The project's `node_modules` is empty.
after（new_string）：
Design philosophy (the entire meaning of the name): if the Node standard library can do it, no third-party dependency is allowed. The project's `node_modules` contains no third-party packages — only the first-party `@thincoder/core` shared core (a local link in development, resolved from the npm registry for releases).
```

A·③ `thincoder-cli/package.json:4`
```text
before（old_string）：
  "description": "Thin coding agent - zero dependencies, no build step, Node.js native. Sharp code, zero bloat.",
after（new_string）：
  "description": "Thin coding agent - zero third-party dependencies, no build step, Node.js native. Sharp code, zero bloat.",
```

A·④ `thincoder-cli/AGENTS.md:5`
```text
before（old_string）：
Zero-dependency AI coding CLI: pure Node.js >= 24 standard library, no build step, ESM (`.mjs`).
after（new_string）：
AI coding CLI with zero third-party dependencies: pure Node.js >= 24 standard library, no build step, ESM (`.mjs`).
```

**关键决策记录（含否决备选）**

- 统一串 = `zero third-party dependencies`（4 处同措辞）。**否决备选**：`zero third-party npm dependencies`（冗长；本档语境已锁 npm 域）·「零外部依赖」（用户口语——既有裁定用词 = 第三方，取之）。
- ② 如实两态：句 1 加限定（现已有 1 条自家 npm 依赖 ⇒「no dependency」不成立）；句 2 由「is empty」改为 link / 装入两态（依据 = 设计档 `:90-92` 双态引用：开发期本地链接 / 生产期 registry 解析）。
- ④ 句式微调（`Zero-dependency` 前置形容词无法直接带修饰 ⇒ 后置介词短语）：`AI coding CLI with zero third-party dependencies:`。
- 组件域 6 行（`:19` / `:178` / `:308` / `:315` / `:457` / `:473`）保留——组件级（第三方语义）仍真（父侧 §1 已裁）；其中 `:308` / `:315` / `:457` / `:473` 位于 README 内嵌 Changelog（沿革面）同判保留。

**B 受影响文件表（as-of 2026-09-21 · 行数 = 实读）**

| 文件 | 行数（实读） | 改点 | 预期增量 | 档位 / 越线核查 |
|---|---|---|---|---|
| `thincoder-cli/README.md` | 480 | `:5` · `:11`（单行替换 ×2） | 行数 ±0（`:11` 改后仍单行 ≈310 字符） | 文档档（无 300 / 500 代码档位约束）；**不在 doc-check 扫描域**（manifest `checkConfig.scanDirs = ["docs"]`） |
| `thincoder-cli/package.json` | 44 | `:4`（description 单行替换） | 行数 ±0 | 键面 / 版本 / 依赖面零改（`version` = 0.12.63 · `dependencies` = `@thincoder/core@^0.9.1`） |
| `thincoder-cli/AGENTS.md` | 64 | `:5`（单行替换） | 行数 ±0 | 文档档 |
| 测试档 / 脚本档 / 其余档 | — | 无 | ±0 | 零连带（见 D） |

**反查读数**（`thincoder-cli/scripts/doc-impact.mjs --base HEAD --files 三档` · 预测模式 · 设计轮实跑）：命中 213 档（含他批在途 27 档噪声）。与三档直接相关者 = `docs/core/design/CORE-UNIFICATION.md` · `docs/core/requirements/CORE-UNIFICATION.md` · `docs/core/design/ARCHITECTURE.md` · `docs/core/design/DOC-CODE-RECONCILE.md` · `docs/core/design/TWO-REPO-MERGE.md`——**不录入改动面**：父侧 §1 已裁「文档面不动」，且裁定档（§2.9 #5 / N7）语义已对。

**路由**：三档 = 产品文本面（对外契约）⇒ 实施者 = eng-coder（§4 批准后）；本批零代码面。

**C 验收判据（机检 · 仓根运行 · 纯 ASCII ⇒ cmd / bash 双安全）**

> 判据串刻意避开反引号（bash 命令替换风险）；② 旧句以 `no dependency is allowed` + `is empty` 两串合判。

C1 —— 无修饰 claim 残留 = 0（三档）：
```bash
node -e "const fs=require('fs');const bad=[['thincoder-cli/README.md','zero npm dependencies'],['thincoder-cli/README.md','no dependency is allowed'],['thincoder-cli/README.md','is empty'],['thincoder-cli/package.json','zero dependencies'],['thincoder-cli/AGENTS.md','Zero-dependency AI coding CLI']];const hit=bad.filter(([f,s])=>fs.readFileSync(f,'utf8').includes(s));console.log(hit.length?'RESIDUAL '+JSON.stringify(hit):'OK(0 residual)');process.exit(hit.length?1:0)"
```
预期：`OK(0 residual)` · exit 0。

C2 —— 新形态在位（逐条）：
```bash
node -e "const fs=require('fs');const t=(f)=>fs.readFileSync(f,'utf8');const need=[['thincoder-cli/README.md','zero third-party dependencies'],['thincoder-cli/README.md','no third-party dependency is allowed'],['thincoder-cli/README.md','contains no third-party packages'],['thincoder-cli/README.md','first-party'],['thincoder-cli/README.md','resolved from the npm registry for releases'],['thincoder-cli/package.json','zero third-party dependencies'],['thincoder-cli/AGENTS.md','zero third-party dependencies']];const miss=need.filter(([f,s])=>!t(f).includes(s));console.log(miss.length?'MISSING '+JSON.stringify(miss):'OK(new forms present)');process.exit(miss.length?1:0)"
```
预期：`OK(new forms present)` · exit 0。

C3 —— 组件域保留 6 行逐条在（README）：
```bash
node -e "const fs=require('fs');const t=fs.readFileSync('thincoder-cli/README.md','utf8');const keep=['all zero-dependency, file tools confined','(JSON-RPC, zero-dependency)','Zero-dependency JSON-RPC 2.0 over stdio client','using zero-dependency approaches','(JSON-RPC + stdio, zero-dependency)','zero-dependency TUI'];const miss=keep.filter((s)=>!t.includes(s));console.log(miss.length?'MISSING '+JSON.stringify(miss):'OK(6 preserved)');process.exit(miss.length?1:0)"
```
预期：`OK(6 preserved)` · exit 0。

C4 —— package.json 解析 / 版本 / 依赖面直读：
```bash
node -e "const p=JSON.parse(require('fs').readFileSync('thincoder-cli/package.json','utf8'));console.log('version='+p.version);console.log('deps='+JSON.stringify(p.dependencies));console.log('desc='+p.description)"
```
预期：`version=0.12.63` · `deps={"@thincoder/core":"^0.9.1"}` · `desc=Thin coding agent - zero third-party dependencies, …`（`JSON.parse` 不抛 = 解析面不变）。

C5 —— doc-check 读数（登记；本批触碰档在扫描域外 ⇒ 零新增恒成立）：`node scripts/doc-check.mjs --root .` → 设计轮 as-of 读数 = `OK(锚): 0 条悬空` + `FAIL(行宽): 2 行`（`docs/core/design/BATCH-RECORD.md:358` · `:365`——归属 = 他批在途，见 F7）。预期本批实施后读数不变。

C6（可选 · 读档用例复跑）：`cd thincoder-cli && node --test test/home-expansion.test.mjs` → 预期全绿（见 D）。

**D 用例面判定（测试面零连带）**

- **零断言面**：全仓测试无一处断言本批 4 处文本（实读 `thincoder-cli/test` · `thincoder-vscode/test` · `thincoder-core/test`：对 `zero dependencies` / `zero npm dependencies` / `Zero-dependency AI coding CLI` / `node_modules is empty` 零断言；`.description` 断言全部指向工具 schema 描述，无一指向 package.json description）。
- **2 个读档点（零交集 ⇒ 预期保持绿）**：① `thincoder-cli/test/home-expansion.test.mjs:191-199`（T-H15）读 README——断言 `"dbPath": "~/.thincoder/memory.db"`（README `:140`）；② `thincoder-cli/test/wait-for-advisor-pool.test.mjs:56` 以 `thincoder-cli/package.json` 路径作 `file exists:` 夹具（只判存在性）。
- **机检面**：doc-check 扫描域 = `docs/`（三档域外）；CI `cli` job 的 `npm test` / `lint`（`node --check` 语法面）不读 4 处文本。
- **测试义务 = 无**（`thincoder-cli/AGENTS.md:35` 纯文档更新免测；package.json 仅 metadata——`description` 无运行期消费者，实读 src 仅读 `version`）。新增用例 = 不需要（无行为面）。

**发现即报（非本批改动面 · 改否由父侧裁）**

| # | 落点 | 事实 | 建议 |
|---|---|---|---|
| F1 | `thincoder-cli/AGENTS.md:18` | 「Zero npm runtime dependencies: only `node:` standard library」——同类无修饰自述（现已有 1 条自家 npm 运行时依赖） | 加「第三方」限定 + 自家核例外句；同档已必改（④）⇒ 折叠成本≈0 |
| F2 | `thincoder-cli/README.md:225` | 「Code conventions: … no npm dependencies allowed (including devDependencies).」——同类（现已有 1 条 npm 依赖） | 加 `third-party` 限定 + 自家核例外句；同档已必改（①②） |
| F3 | `thincoder-vscode/README.md:7` | 「Like the CLI, it's pure `.mjs`, zero npm dependencies, …」——**同类无修饰 claim 第 5 处**（父侧实核表未列；VSC 亦依赖 `@thincoder/core`——`thincoder-vscode/package.json:32-34`）；且「Like the CLI」在 CLI 改述后与 CLI 现文不一致 | 折叠本批或紧随微批（父侧裁）；若折叠 = C1 / C2 清单加 VSC 档对应串 |
| F4 | 仓根 `README.md:4` | 「they share no runtime code path」——内核共享（本批用户指认的成因）后不再成立 | 加限定（如 other than the first-party core package）；父侧裁 |
| F5 | 批档 §1 `:23` 引证号 | 引「§2.11 #5」——实为 `docs/core/design/CORE-UNIFICATION.md` **§2.9 #5**（`:1128` 节标题 + `:1138` 第 5 条；§2.11 = 「裁定事项与状态（A1–A8）」，无编号 #5 条目） | §1 = 主 agent 笔域 ⇒ 父侧裁（本段按 §2.9 #5 引用） |
| F6 | `docs/core/design/CORE-UNIFICATION.md:33`（B7 行） | as-of 混排：「CLI … 无 `dependencies` 字段」与「两产品各有**一条自家核依赖**」并存；现 `thincoder-cli/package.json:22-24` 已有该字段 | 文档面（§1 已裁不动）⇒ 仅登记 |
| F7 | doc-check 现行红 | `FAIL(行宽)` 2 行 = `docs/core/design/BATCH-RECORD.md:358`（589 字符）/ `:365`（302 字符）——归属 = 他批在途（批次档生命周期工具批的变更记录行），与本批零因果 | 供父侧 / 他批收口 |
| F8 | 待复核答复（core / vsc package.json） | `thincoder-core/package.json:4` description = 无依赖自述 ✓；`thincoder-vscode/package.json:5` = 「zero bloat」（标语，与 `thincoder-cli/README.md:3` 同族）非依赖 claim ✓ | 两档 package.json 无需改（VSC 自述面问题 = F3 的 README 行） |

**上抛项（待父侧裁）**：F1–F4 折叠取舍 · F5 §1 引证号收正 · F6 登记处置。

**边界（本批不做）**：产品档实施（coder 笔域，§4 批准后）· 需求 / 设计档（口径已对——§2.9 #5 / N7 承载）· 组件域 6 行 · 历史面（`_archive/**` · `CHANGELOG.md` · `TODO-archive.md`）· 仓外档（`D:\teamcode\AGENTS.md`——需用户另裁）· 全量重勘 · 新语义（本批零新语义 = 既有裁定的产品文本侧补执行）。

**验收回指（本批条目 ↔ 判据）**

| # | 条目（A 表） | 判据 |
|---|---|---|
| 1 | ① `README.md:5` 收正 | C1 + C2 |
| 2 | ② `README.md:11` 收正（两态如实） | C1 + C2 |
| 3 | ③ `package.json:4` 收正 | C1 + C2 + C4 |
| 4 | ④ `AGENTS.md:5` 收正 | C1 + C2 |
| 5 | 组件域 6 行保留在 | C3 |
| 6 | 触碰档 doc-check 零新增 | C5（域外 ⇒ 恒成立；读数登记） |
| 7 | 测试面零连带 | D（+ C6 可选） |

**三方一致注**：本批无新需求条目——锚 = 既有裁定（设计 §2.9 #5 + 需求 N7）+ 台账 #181；条目 ↔ 判据一致性 = 上表 7 行 ↔ C1–C6。

**§2 补全（fix 轮 · 类集补全 · 2026-09-21 · eng-designer）**

**本轮（fix）范围**（类集补全 = 4+4 = 8 处）

> 本轮 = 点修（范围补全）：父侧 06:3x 裁定「上抛 F1–F4 全部折叠入本批」——用户诉求 = claim 准确，只改 4 处会留下同类错文 ⇒ 补全 = 完成用户要求，非扩面。**本段 + 前段 = 本批完整设计承载；A 表合计 = 8 处（①–④ 见前段，⑤–⑧ 见本段）**；前段标题内计数以本段合计为准（append-only 面不删既有行——前段行清理归父侧轮次）。口径零新语义：仍 = 既有裁定（设计 `docs/core/design/CORE-UNIFICATION.md` §2.9 #5 · `:1138` + 需求 `docs/core/requirements/CORE-UNIFICATION.md` N7 · `:120`）的「零第三方」产品文本侧补执行；台账 #181。

**类集边界（本轮实扫复核 · as-of 2026-09-21）**：产品文本面（`**/*.md` − `docs/**` − `_archive` − `.thincoder/**`）无修饰依赖 claim 类集 = **8 处**（逐处 = A 表①–⑧）。同扫另见两类命中、均不属本批：`thincoder-vscode/AGENTS.md:11`（已收正形「Zero third-party npm runtime dependencies …」——VSC 侧既有权威形，本轮用作 ⑤ / ⑥ 措辞对照）· `thincoder-vscode/CHANGELOG.md:884`（沿革面——§1 已裁不动）。包描述面另核：`thincoder-core/package.json:4` 无依赖 claim · `thincoder-vscode/package.json:5` = 标语「zero bloat」非 claim · 仓根无 package.json ⇒ 类集闭合。

**A 逐字改述表（补 4 行 · ⑤–⑧ · 形态同前段：before / after 整行逐字 · 可直取作 `old_string` / `new_string` · 仅替换 · 各档其余字节零动）**

A 表全 8 处索引：① `thincoder-cli/README.md:5` · ② `thincoder-cli/README.md:11` · ③ `thincoder-cli/package.json:4` · ④ `thincoder-cli/AGENTS.md:5` · ⑤ `thincoder-vscode/README.md:7` · ⑥ `thincoder-cli/AGENTS.md:18` · ⑦ `thincoder-cli/README.md:225` · ⑧ 仓根 `README.md:4`。

A·⑤ `thincoder-vscode/README.md:7`
```text
before（old_string）：
Like the CLI, it's pure `.mjs`, zero npm dependencies, and connects directly to top-tier models via OpenAI-compatible APIs.
after（new_string）：
Like the CLI, it's pure `.mjs`, zero third-party runtime dependencies, and connects directly to top-tier models via OpenAI-compatible APIs.
```

A·⑥ `thincoder-cli/AGENTS.md:18`
```text
before（old_string）：
- **Zero npm runtime dependencies**: only `node:` standard library (storage via `node:sqlite`, TUI via bare ANSI). For new features, first ask whether the standard library can do it; if not, raise for discussion.
after（new_string）：
- **Zero third-party npm runtime dependencies**: only `node:` standard library (storage via `node:sqlite`, TUI via bare ANSI) and the in-repo core `@thincoder/core` — the one declared dependency. For new features, first ask whether the standard library can do it; if not, raise for discussion.
```

A·⑦ `thincoder-cli/README.md:225`
```text
before（old_string）：
Code conventions: pure `.mjs`, no semicolons, no npm dependencies allowed (including devDependencies).
after（new_string）：
Code conventions: pure `.mjs`, no semicolons, no third-party npm dependencies allowed (including devDependencies) — the first-party `@thincoder/core` shared core is the only npm dependency.
```

A·⑧ 仓根 `README.md:4`
```text
before（old_string）：
its own release chain and its own documentation tree; they share no runtime code path.
after（new_string）：
its own release chain and its own documentation tree; their only shared runtime code is the first-party `@thincoder/core`.
```

**关键决策记录（补 · 含否决备选）**

- **⑤ 加「runtime」限定**：VSC 有 4 条第三方 **dev**Dependencies（`thincoder-vscode/package.json:131-137`：@happy-dom/global-registrator · @vscode/vsce · ovsx · yauzl；`vscode` = `file:test/vscode-mock` 本仓 mock，非第三方）⇒ 无修饰形对 VSC 包面可被证伪；且与 VSC 既有权威形同 scope（`thincoder-vscode/AGENTS.md:11`）。**否决**：照抄 CLI 形 `zero third-party dependencies`（对 VSC 包面不严谨）。CLI 侧维持前段既定形（CLI 零 devDependencies ⇒ 无修饰形为真）。
- **⑥ 对齐 VSC 同族约束形**：措辞取 `thincoder-vscode/AGENTS.md:11` 既有族（「Zero third-party npm runtime dependencies … the in-repo core `@thincoder/core` — the one declared dependency」）；保留原句后半「For new features, first ask …」（既有约束句不动）。字面依据：CLI 声明依赖恰 1 条（`thincoder-cli/package.json:22-24`）。
- **⑦ 保留「(including devDependencies)」+ 补自家核例外句**：CLI 无 devDependencies 且 `dependencies` 仅 `@thincoder/core`（同上）⇒ 改后句面逐句为真。**否决**：删该括注（属既有约束面，非本批授权）。
- **⑧ 介绍段协调**：原句「share no runtime code path」在核共享后失准；改后 = 如实「唯一共享运行时面 = 自家核」。依据 = 两包各一条依赖（`thincoder-cli/package.json:22-24` · `thincoder-vscode/package.json:32-34`）+ VSC 运行面实 imports（`thincoder-vscode/extension.mjs:6` · `src/agent/**` · `src/tools/**` 族）。**形态**：单行替换（改后 122 字符——档内行族 95–125：`:50` = 116 · `:11` = 125）；**否决**折行改写（与 A 表「单行直取」形态不齐）。
- **用词**：「first-party」（②⑦⑧ 同族）·「in-repo core」（⑥，VSC 同族）；弃「share no X except Y」（更长且否定式带例外可读性差）。
- **实核**：8 处 `old_string` 于各档内均唯一出现（count=1）；8 处现文逐字实读复核在盘（2026-09-21）。

**B 受影响文件表（补 · as-of 2026-09-21 · 行数 = 实读）**

| 文件 | 行数（实读） | 改点 | 预期增量 | 档位 / 越线核查 |
|---|---|---|---|---|
| `thincoder-vscode/README.md` | 207 | `:7`（单行替换） | 行数 ±0（改后 139 字符） | 文档档（300 / 500 代码档位不适用）；**不在 doc-check 扫描域**（扫描域 = 仓根 `docs/`——`PROJECT-MANIFEST.json:21-23`） |
| 仓根 `README.md` | 65 | `:4`（单行替换） | 行数 ±0（改后 122 字符） | 同上；改后行宽在档内行族（95–125） |
| `thincoder-cli/AGENTS.md` | 64 | `:5`（前段已列）· **`:18`（并注第二处）** | 行数 ±0（`:18` 改后 293 字符） | 同上 |
| `thincoder-cli/README.md` | 480 | `:5` · `:11`（前段已列）· **`:225`（并注第三处）** | 行数 ±0（`:225` 改后 189 字符） | 同上 |

（前段 B 表 = `thincoder-cli/README.md` / `thincoder-cli/package.json` / `thincoder-cli/AGENTS.md` 三行；本表与之合并 = 本批受影响面全量 = **5 档 8 处**。）

**C 验收判据（补 · 全量替代版 · 仓根运行 · 纯 ASCII ⇒ cmd / bash 双安全）**

> C1-EXT / C2-EXT / C3-EXT = 全量版（前段 C1 / C2 / C3 并入本版——实施与核验以本段三命令为准；判据串均避反引号）。改前实跑基线（fix 轮 · 2026-09-21）：C1-EXT = 9 / 9 全红（RESIDUAL 列报）；C2-EXT = 15 / 15 全缺（MISSING 列报）；C3-EXT = 全在（`OK(preserved)`）。

C1-EXT —— 无修饰 claim 残留 = 0（9 对 = 8 处现文串展开：①–④ 前段 5 对 + ⑤–⑧ 本轮 4 对）：

```bash
node -e "const fs=require('fs');const bad=[['thincoder-cli/README.md','zero npm dependencies'],['thincoder-cli/README.md','no dependency is allowed'],['thincoder-cli/README.md','is empty'],['thincoder-cli/package.json','zero dependencies'],['thincoder-cli/AGENTS.md','Zero-dependency AI coding CLI'],['thincoder-vscode/README.md','zero npm dependencies'],['thincoder-cli/AGENTS.md','Zero npm runtime dependencies'],['thincoder-cli/README.md','no npm dependencies allowed'],['README.md','share no runtime code path']];const hit=bad.filter(([f,s])=>fs.readFileSync(f,'utf8').includes(s));console.log(hit.length?'RESIDUAL '+JSON.stringify(hit):'OK(0 residual)');process.exit(hit.length?1:0)"
```

预期（改后）：`OK(0 residual)` · exit 0。

C2-EXT —— 新形态在位（15 条 = 前段 7 条 + 本轮 8 条）：

```bash
node -e "const fs=require('fs');const t=(f)=>fs.readFileSync(f,'utf8');const need=[['thincoder-cli/README.md','zero third-party dependencies'],['thincoder-cli/README.md','no third-party dependency is allowed'],['thincoder-cli/README.md','contains no third-party packages'],['thincoder-cli/README.md','first-party'],['thincoder-cli/README.md','resolved from the npm registry for releases'],['thincoder-cli/package.json','zero third-party dependencies'],['thincoder-cli/AGENTS.md','zero third-party dependencies'],['thincoder-vscode/README.md','zero third-party runtime dependencies'],['thincoder-cli/AGENTS.md','Zero third-party npm runtime dependencies'],['thincoder-cli/AGENTS.md','the in-repo core'],['thincoder-cli/AGENTS.md','the one declared dependency'],['thincoder-cli/README.md','no third-party npm dependencies allowed'],['thincoder-cli/README.md','shared core is the only npm dependency'],['README.md','their only shared runtime code is the first-party'],['README.md','@thincoder/core']];const miss=need.filter(([f,s])=>!t(f).includes(s));console.log(miss.length?'MISSING '+JSON.stringify(miss):'OK(new forms present)');process.exit(miss.length?1:0)"
```

预期（改后）：`OK(new forms present)` · exit 0。

C3-EXT —— 保留面逐条在（10 条 = 组件域 6 行（前段）+ 本轮档位 4 条）：

```bash
node -e "const fs=require('fs');const t=(f)=>fs.readFileSync(f,'utf8');const keep=[['thincoder-cli/README.md','all zero-dependency, file tools confined'],['thincoder-cli/README.md','(JSON-RPC, zero-dependency)'],['thincoder-cli/README.md','Zero-dependency JSON-RPC 2.0 over stdio client'],['thincoder-cli/README.md','using zero-dependency approaches'],['thincoder-cli/README.md','(JSON-RPC + stdio, zero-dependency)'],['thincoder-cli/README.md','zero-dependency TUI'],['thincoder-vscode/README.md','Zero bloat.'],['thincoder-vscode/README.md','(zero-config, no key)'],['thincoder-cli/AGENTS.md','For new features, first ask whether the standard library can do it'],['README.md','git subtree add --prefix=thincoder-vscode']];const miss=keep.filter(([f,s])=>!t(f).includes(s));console.log(miss.length?'MISSING '+JSON.stringify(miss):'OK(preserved)');process.exit(miss.length?1:0)"
```

预期（改后）：`OK(preserved)` · exit 0。

C4 —— 前段 C4 不变（③ 改后）：预期 `version=0.12.63` · `deps={"@thincoder/core":"^0.9.1"}` · `desc=Thin coding agent - zero third-party dependencies, …`。

C5 —— doc-check 读数（fix 轮实跑 2026-09-21）：`node scripts/doc-check.mjs --root .` ⇒ `OK(锚): 0 条悬空` + `FAIL(行宽): 2 行`（`docs/core/design/BATCH-RECORD.md:358`（589 字符）· `:365`（302 字符）——他批在途，F7）= **与设计轮登记读数逐项一致**。本批 5 档全在扫描域（`docs/`）外；批档自身在 `anchors.exclude`（`batches`——`PROJECT-MANIFEST.json:27-30`）内 ⇒ 本段追加对机检零影响、零新增恒成立。

C6（可选）—— 前段 C6 不变。

**D 用例面判定（补 · 本轮 4 处复核结论）**

- **⑤ `thincoder-vscode/README.md`：零读取 / 零断言**。实扫 `thincoder-vscode/test`：README 命中全为夹具 / UI 字符串——`context-parity.test.mjs:96`（临时工程写 README 夹具）· `integration/scenario-05-panel-basics.test.mjs:65-87`（聊天文本词）· `integration/scenario-06-commit-verify.test.mjs:42-54`（`readme.txt` 夹具）· `memory-index-face.test.mjs:141` · `verify-redesign.test.mjs:101/132/140`（夹具路径）——无一读本档 `README.md`；scripts 面（`thincoder-vscode/scripts`）零 README 引用。
- **⑧ 仓根 `README.md`：零读取 / 零断言**（两产品测试树均无根 README 读取；CLI 树唯一 README 读取 = 本树 `README.md`——见下）；两产品 scripts 目录实扫零 README 命中。
- **⑥ `thincoder-cli/AGENTS.md`：零内容断言**（`thincoder-cli/test/eng-designer-role.test.mjs:266` 头注实载「README / AGENTS 口径断言已随 2026-09-12 散文锚退役批删除」；`prompt-refs-zero.test.mjs:32/40/121` 之「AGENTS.md」= 白名单操作数非档读取；VSC 侧 AGENTS 命中 = 临时夹具）。运行期消费 = 项目指令注入（文本变更、无断言面）。
- **既有 2 读档点不变（预期保持绿）**：① `thincoder-cli/test/home-expansion.test.mjs:191-199`（T-H15 读本树 README `:140` 之 `"dbPath": "~/.thincoder/memory.db"` 串——本批不改该行）；② `thincoder-cli/test/wait-for-advisor-pool.test.mjs:56`（仅以 `thincoder-cli/package.json` 路径作存在性夹具）。
- **测试义务 = 无**（纯文档更新免测——`thincoder-cli/AGENTS.md:35`；package.json 仅 metadata，无运行期消费者）。

**上抛项处置（fix 轮闭环 · 供 §3 对照）**：F1–F4 → **折叠落位**（= 本段 A⑤–⑧ + B / C / D 扩；父侧 06:3x 裁定）；F5 → 父侧已收正（§1 引证收 §2.9 #5）；F6 → 维持登记（文档面不动——§1 裁）；F7 → 他批在途（C5 读数 2 行，非本批因果）；F8 → 维持判定（core `:4` / vsc `:5` 描述面无依赖 claim ⇒ 零改）。

**验收回指（补 · 8 处全量）**

| # | 条目（A 表） | 判据 |
|---|---|---|
| 1–4 | ①–④ 收正（前段） | C1-EXT + C2-EXT（+ ③ C4） |
| 5 | ⑤ `thincoder-vscode/README.md:7` 收正 | C1-EXT + C2-EXT |
| 6 | ⑥ `thincoder-cli/AGENTS.md:18` 收正 | C1-EXT + C2-EXT |
| 7 | ⑦ `thincoder-cli/README.md:225` 收正 | C1-EXT + C2-EXT |
| 8 | ⑧ 仓根 `README.md:4` 收正 | C1-EXT + C2-EXT |
| 9 | 保留面逐条在（组件域 6 行 + 档位 4 条） | C3-EXT |
| 10 | 触碰档 doc-check 零新增 | C5（域外 / 排除域 ⇒ 恒成立；读数登记） |
| 11 | 测试面零连带 | D（+ C6 可选） |

**三方一致注（补）**：本批无新需求条目——锚 = 既有裁定（设计 §2.9 #5 + 需求 N7）+ 台账 #181；条目 ↔ 判据一致性 = 8 处 ↔ C1-EXT / C2-EXT（保留面 / 机检 / 测试面 = C3-EXT / C5 / D）。

**边界（本轮维持前段边界 + 本轮不做清单）**：产品档实施（coder 笔域——§4 批准后）· 需求 / 设计档（除批档 §2 本段）· 组件域行 · 历史面（`_archive/**` · `CHANGELOG.md` · `TODO-archive.md`）· 仓外档（`D:\teamcode/*`——需用户另裁）· 全量重勘 · 新语义（零新语义 = 既有裁定补执行）。

**§2 评审处置（承 §3 轮 1 · 2026-09-21 · eng-designer）**

承 §3 轮 1（VERDICT = pass；#2–#5 父侧裁定接受 ⇒ 本段逐项落位；#1 父侧已机械收）。**本段 = §2 终稿面**——前段（initial + fix 轮）对应条项自此为历史层（append-only 面不删既有行，清理归父侧轮次）；实施 / 核验以本段终稿为准。本轮零新语义（全部 = 评审发现直接导出）。

**终稿对照（前段行 → 本段终稿）**

| 项 | 前段行（历史层） | 终稿 |
|---|---|---|
| ④ after 文本 | `:80` | 本段「A」 |
| C2-EXT 命令（15 → 16 条） | `:252` | 本段「A · C2-EXT 终稿」 |
| C 段改动面判据 | （缺） | 本段「B · C7」（新编号） |
| F6 登记（B7） | `:151` | 本段「C · F6 终稿」（+ B6） |
| C1-EXT 命令（探针） | `:244` | 本段「D · C1-EXT 终稿」（entry 3 重锚） |
| 基线声明 | `:239` | 本段「基线复跑」（重锚 / 扩条后实跑） |

**A（#2 处置）· ④ after 终稿**——`thincoder-cli/AGENTS.md:5`；`old_string` 不变（= A·④ before 行），`new_string` 换为：

```text
AI coding CLI with zero third-party dependencies: Node.js >= 24 standard library plus the in-repo core `@thincoder/core`, no build step, ESM (`.mjs`).
```

**关键决策记录（补 · ④ 终稿 · 承 #2）**：取**删「pure」**——「pure X plus Y」自相矛盾；「pure Node.js >= 24 standard library」可被读作纯 stdlib（与同档 ⑥ 精度不一）；终稿与 ⑥ / VSC 权威形同族（「the in-repo core `@thincoder/core`」）。**否决**：保留「pure」+ 例外短语（矛盾形）。A 表其余 7 处 / `before` 行 / 坐标零改。

**A · C2-EXT 终稿**（16 条 = 前段 15 条 + 1 条 ④ 终稿专有串「plus the in-repo core」）：

```bash
node -e "const fs=require('fs');const t=(f)=>fs.readFileSync(f,'utf8');const need=[['thincoder-cli/README.md','zero third-party dependencies'],['thincoder-cli/README.md','no third-party dependency is allowed'],['thincoder-cli/README.md','contains no third-party packages'],['thincoder-cli/README.md','first-party'],['thincoder-cli/README.md','resolved from the npm registry for releases'],['thincoder-cli/package.json','zero third-party dependencies'],['thincoder-cli/AGENTS.md','zero third-party dependencies'],['thincoder-vscode/README.md','zero third-party runtime dependencies'],['thincoder-cli/AGENTS.md','Zero third-party npm runtime dependencies'],['thincoder-cli/AGENTS.md','the in-repo core'],['thincoder-cli/AGENTS.md','the one declared dependency'],['thincoder-cli/AGENTS.md','plus the in-repo core'],['thincoder-cli/README.md','no third-party npm dependencies allowed'],['thincoder-cli/README.md','shared core is the only npm dependency'],['README.md','their only shared runtime code is the first-party'],['README.md','@thincoder/core']];const miss=need.filter(([f,s])=>!t(f).includes(s));console.log(miss.length?'MISSING '+JSON.stringify(miss):'OK(new forms present)');process.exit(miss.length?1:0)"
```

预期（改后）：`OK(new forms present)` · exit 0。（基线 = 16 / 16 全缺——见「基线复跑」。）

**B（#3 处置）· C7 新增（改动面判据 · 防夹带）**

> 域 = 本批 5 档；前提 = 5 档无本批外未提交改动。逐档 hunk 数 = [3,1,2,1,1] 且每 hunk 恰 1 删 + 1 增 ⇒ 合计 = 恰 8 处单行替换、档内其余零改（先例 = K3 diff 可逆性 · 防夹带）。运行时机 = §5 实施后 / 提交前（基准 = 实施前 `HEAD`；若已提交 ⇒ `HEAD` 改 `HEAD^`）。

```bash
node -e "const {execSync}=require('child_process');const want=[[3,'thincoder-cli/README.md'],[1,'thincoder-cli/package.json'],[2,'thincoder-cli/AGENTS.md'],[1,'thincoder-vscode/README.md'],[1,'README.md']];const bad=[];for(const [k,f] of want){const out=execSync('git diff HEAD -U0 -- '+f,{encoding:'utf8'});const hunks=out.split('\n@@').slice(1);const d=hunks.map(h=>h.split('\n').filter(l=>l[0]==='-'&&l.slice(0,3)!=='---').length);const a=hunks.map(h=>h.split('\n').filter(l=>l[0]==='+'&&l.slice(0,3)!=='+++').length);const ok=hunks.length===k && d.every(n=>n===1) && a.every(n=>n===1);if(ok===false)bad.push(f+' hunks='+hunks.length+' del='+JSON.stringify(d)+' add='+JSON.stringify(a)+' want='+k);}console.log(bad.length?'DIFF-FACE '+JSON.stringify(bad):'OK(diff-face: 5 files / exactly 8 single-line swaps)');process.exit(bad.length?1:0)"
```

预期（实施后 / 提交前）：`OK(diff-face: 5 files / exactly 8 single-line swaps)` · exit 0。设计态实跑（2026-09-21 · 仓根）= `DIFF-FACE`（空 diff ⇒ 5 档 hunks=0 全 miss）。

**C（#4 处置）· F6 终稿（B6 并入）**

| # | 落点 | 事实 | 建议 |
|---|---|---|---|
| F6 | `docs/core/design/CORE-UNIFICATION.md:32`（B6 行）· `:33`（B7 行） | **B6**：「运行期无跨仓依赖；共享面 = 用户级状态」（说明句含「跨仓机制 100% 位于 build / doc / test 期」）——与 ⑧ 终稿（`:214`）及两产品运行面实读相左（自家核 = 运行期跨仓依赖）；**B7**：as-of 混排（前段登记，事实不变） | 文档面（§1 已裁不动）⇒ 仅登记；**下次触碰该档一并收正**（B6 / B7 同表同类） |

取「并入 F6」而非新 F9：同表同类同处置 ⇒ 单行单源登记（F 表编号仍 F1–F8）；`:279` 处置行 F6 项同扩 B6。

**D（#5 处置）· C1-EXT 终稿（探针重锚 · 9 对）**

entry 3：`'is empty'` → `'\x60node_modules\x60 is empty'`——运行期串 = 含 `node_modules` 的整句片段（现档内唯一命中 `thincoder-cli/README.md:11` 不变）；`\x60` = backtick 的 JS 转义写形（判据源内避字面反引号 ⇒ bash 命令替换风险零）。其余 8 对 / 对数 9 零改。

```bash
node -e "const fs=require('fs');const bad=[['thincoder-cli/README.md','zero npm dependencies'],['thincoder-cli/README.md','no dependency is allowed'],['thincoder-cli/README.md','\x60node_modules\x60 is empty'],['thincoder-cli/package.json','zero dependencies'],['thincoder-cli/AGENTS.md','Zero-dependency AI coding CLI'],['thincoder-vscode/README.md','zero npm dependencies'],['thincoder-cli/AGENTS.md','Zero npm runtime dependencies'],['thincoder-cli/README.md','no npm dependencies allowed'],['README.md','share no runtime code path']];const hit=bad.filter(([f,s])=>fs.readFileSync(f,'utf8').includes(s));console.log(hit.length?'RESIDUAL '+JSON.stringify(hit):'OK(0 residual)');process.exit(hit.length?1:0)"
```

预期（改后）：`OK(0 residual)` · exit 0。

**基线复跑（重锚 / 扩条后 · 2026-09-21 · 仓根实跑）**

- C1-EXT（终稿 9 对）= `RESIDUAL` —— 9 / 9 全红（逐对列报；entry 3 重锚版仍命中 `:11` 现文）。
- C2-EXT（终稿 16 条）= `MISSING` —— 16 / 16 全缺。
- C3-EXT（不变 10 条）= `OK(preserved)`。
- C7（新增 · 设计态）= `DIFF-FACE`（5 档 hunks=0 全 miss——设计态预期）；OK 形与检出形另经合成仓（5 档同构）实跑核证：8 处替换 ⇒ `OK` · 第 9 处夹带 / 折行变形 ⇒ 各自 `DIFF-FACE` 检出。

**回指与一致注（补）**：回指表增行 12 =「改动面恰 8 处替换 · 档内其余零改（防夹带）」→ **C7**（行 1–11 不变）。判据编号 = C1-EXT · C2-EXT · C3-EXT · C4 · C5 · C6 · **C7**（连续）。锚不变（设计 §2.9 #5 · 需求 N7 · 台账 #181）；条目 ↔ 判据 = 8 处 ↔ C1-EXT / C2-EXT（保留面 / 机检 / 测试面 / 改动面 = C3-EXT / C5 / D / C7）。

**边界（本轮）**：维持前段 + 本轮不做——产品档实施（coder 笔域 · §4 批准后）· 需求 / 设计档编辑（`CORE-UNIFICATION.md` 裁冻结——#4 仅登记）· 类集再扩（8 处闭合）· 全量重勘 · 新语义。

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

对象 = `docs/batches/2026-09-21-readme-dep-claim.md` §2（initial + fix 轮）+ `docs/core/design/CORE-UNIFICATION.md`（口径锚）。设计评审 · round = 1。

**实核（证据面 · 本轮实读）**：8 处 `old_string` 逐字且唯一 = 全中（`thincoder-cli/README.md:5` · `:11` · `:225` · `thincoder-cli/package.json:4` · `thincoder-cli/AGENTS.md:5` · `:18` · `thincoder-vscode/README.md:7` · 仓根 `README.md:4`）；5 档行数（480 / 44 / 64 / 207 / 65）与 B 表逐项一致；C2-EXT 15 条新形态串改前**全缺**（判据非空转）+ C3-EXT 10 条保留串改前**全在**；口径锚逐字命中 = 设计 `CORE-UNIFICATION.md:1138`（§2.9 #5「零依赖只约束第三方」）+ 需求 `docs/core/requirements/CORE-UNIFICATION.md:120`（N7「零第三方运行时依赖」）；类集闭合**独立复扫**（全仓 `**/*.md` 依赖 claim 族）= 仅本批 8 处 + 已收正形 `thincoder-vscode/AGENTS.md:11` + 沿革面；包描述面 = `thincoder-core/package.json:4` 无 claim · `thincoder-vscode/package.json:5` 为标语；② 两态句实读支持 = `thincoder-cli/README.md:234`/`:238`（核首个 npm 发布 · 0.12.63 起 registry 解析）+ `thincoder-cli/node_modules/@thincoder/` 仅 `core`；⑥ 引用形存在 = `thincoder-vscode/AGENTS.md:11`；机检面 = `PROJECT-MANIFEST.json:20-31`（`scanDirs=["docs"]` · `anchors.exclude` 含 `batches`——`scripts/doc-check-targets.mjs:24` 逐层生效，行宽与锚共用同一源域）；C5 读数复算 = 域内非表格长行恰 2 条（`docs/core/design/BATCH-RECORD.md:358` ≥589 字符 · `:365` 301–302 字符，逐项一致）；测试面 = 测试树对本批文本零断言（`thincoder-cli/test/home-expansion.test.mjs:191-199` 只读 README 未涉行 · `wait-for-advisor-pool.test.mjs:18` 仅存在性夹具）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Doc hygiene | 🟡 | §2 面残留两版规范片段：状态行 ×2（`:40`「round = initial」被 `:175`「round = fix」取代）+ 初轮 4 处 A 表头（`:47`）/ C1–C3（`:107`–`:133`）/ 7 行回指表（`:159`–`:169`）——仅以指针注（`:42` · `:177` · `:239`）声明「以本段为准」，失效表达未删。项目侧判据：`docs/core/design/BATCH-RECORD.md:60`（append-only + 状态行单行改写 = 唯一豁免）+ `:369`（用户 2026-09-18 裁定「修订式表达很害人，失效的表达一定要删掉」）。残留风险 = 读者把 4 处 A 表 / 旧 C 清单当活单执行 | 状态行收为单行（走状态行改写豁免）· 被取代的初轮规范片段清掉或标失效；沿革留变更记录面 |
| 2 | Clarity | 🟡 | ④ 只改 `AGENTS.md:5` 前半句（`:80`），留「pure Node.js >= 24 standard library」枚举句未收；同批 ⑥（`:198`）同档改为「only `node:` standard library …and the in-repo core `@thincoder/core`」⇒ 同档两处依赖口径精度不一（前者可被读作「纯 stdlib」）。实核 = CLI 运行面大量裸名导入核（`thincoder-cli/bin/thincoder.mjs:18-33` · `src/tui/agent-turn.mjs:17-23` 等）；VSC 权威形亦枚举核（`thincoder-vscode/AGENTS.md:11`） | ④ 的枚举句与 ⑥ 对齐（补自家核例外限定），使同档两处同精度 |
| 3 | Acceptance criteria | 🟡 | A 表自设「仅替换 · 各档其余字节零动」（`:49` · `:181`），但 C1-EXT / C2-EXT / C3-EXT 只做串级断言：无判据约束「改动面 = 恰好 8 处」⇒ 夹带改动（无关行改写 / 折行 / 尾空白）不被机检发现。先例 = `CORE-UNIFICATION.md:1730` K3（diff 可逆性 · 防夹带） | 补一条改动面判据（`git diff --numstat` 或 hunk 计数 = 预期 8 处替换 · 其余零改） |
| 4 | Requirements / doc-state | 🟡 | `CORE-UNIFICATION.md:32`（B6「运行期无跨仓依赖；共享面 = 用户级状态」）与 ⑧ 新文本（`:214`「their only shared runtime code is the first-party `@thincoder/core`」）及两产品运行面实读相左；设计 F6 只登记同表 `:33`（B7），B6 属同类未登。R7a 口径 = 登记不编辑（§1 已裁文档面不动） | 把 B6 并入 F6 登记（文档面债清单），下次触碰该档一并收正 |
| 5 | Clarity（判据稳健性） | 🔵 | C1-EXT 的 `is empty` 为通用短语（非该句专有）——现档内唯一命中 `thincoder-cli/README.md:11` ✓，但探针未锚定 ⇒ 他批同档改动或二次改写可致假红 | 探针锚到该句特征形态（如含 `node_modules` 的整句片段） |

**域外注（无严重度）**：工作区档 `D:\teamcode\AGENTS.md`（本评审上下文 Project Guide · 仓外）仍持无修饰形「zero-dependency AI coding CLI」/「zero deps」——批 §2 边界已列「仓外档（`D:\teamcode\*`——需用户另裁）」，不计严重度，供另裁。

**计数**：🔴 0 · 🟡 4 · 🔵 1（+ 域外注 1）。

VERDICT: pass

## §4 用户批准（主 agent）

**2026-09-21 06:55 · 用户批准**（会话面原话：「批准」）。

**三条件齐备**：① 设计评审 **pass**（轮 1：🔴 0 · 🟡 4 · 🔵 1——§3 逐字在档）；② **修正轮已落地并经父侧逐项核验**（#13 类集补全 4→8 · #15 处置微轮：#2 ④ 终稿 / #3 C7 判据 / #4 F6 并入 / #5 探针重锚——父侧独立复跑四判据基线逐项一致：C1-EXT 9/9 红 · C2-EXT 16/16 缺 · C3-EXT 10/10 在 · C7 正确检出未实施态）；③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：
1. **设计**：本档 §2（8 处逐字替换 · 判据 C1-EXT 9 / C2-EXT 16 / C3-EXT 10 / C7 · 受影响 5 档 · F6 登记）；
2. **实现**：spawn `eng-coder`（任务书 = 本档 §2；凭证值不落档）；
3. **实施面 = 5 档 8 处**（`thincoder-cli/README.md` ×3 · `thincoder-cli/package.json` ×1 · `thincoder-cli/AGENTS.md` ×2 · `thincoder-vscode/README.md` ×1 · 仓根 `README.md` ×1）；
4. **出批边界**：仓外 `D:\teamcode\AGENTS.md`（**父侧直改已完成**——用户 06:51「要」授权，不派子代理）· 文档面/设计档（F6 仅登记）· 类集之外任何档。

## §5 实施记录（eng-coder）

（待批准后。）

**状态行**：✅ 实施完成（2026-09-21 · eng-coder）——8 处落地 · C1-EXT / C2-EXT / C3-EXT / C4 / C7 全绿 · 偏离审计与代码评审各 1 轮已收敛（0 fix 轮）；终态 = clean。

**实施（逐字依 §2 终稿面 · 单行替换 · 5 档行数 ±0）**

| # | 档:行 | 替换要点（before 串 → after 串；逐字全文以 §2 A 表为准） |
|---|---|---|
| ① | `thincoder-cli/README.md:5` | `zero npm dependencies` → `zero third-party dependencies` |
| ② | `thincoder-cli/README.md:11` | `no dependency is allowed` → `no third-party dependency is allowed`；`node_modules` 句由「is empty」改为「contains no third-party packages — only the first-party `@thincoder/core` shared core（dev 本地链接 / release registry 解析两态）」 |
| ③ | `thincoder-cli/package.json:4` | description：`zero dependencies` → `zero third-party dependencies`（键面 / 版本 / 依赖面零改） |
| ④ | `thincoder-cli/AGENTS.md:5` | 取 fix 轮终稿形（`AI coding CLI with zero third-party dependencies: Node.js >= 24 standard library plus the in-repo core …`——删 `pure` 版；**非**前段 `:80` 形） |
| ⑤ | `thincoder-vscode/README.md:7` | `zero npm dependencies` → `zero third-party runtime dependencies`（`runtime` 限定按设计保留，未简化） |
| ⑥ | `thincoder-cli/AGENTS.md:18` | `Zero npm runtime dependencies` → `Zero third-party npm runtime dependencies` + 自家核例外句（`the in-repo core `@thincoder/core` — the one declared dependency`） |
| ⑦ | `thincoder-cli/README.md:225` | `no npm dependencies allowed` → `no third-party npm dependencies allowed` + 自家核例外句（保留 `(including devDependencies)`） |
| ⑧ | 仓根 `README.md:4` | `share no runtime code path` → `their only shared runtime code is the first-party `@thincoder/core`` |

D6 读回：8/8 逐字命中 §2 终稿 after 串（含 ④ 终稿专有串 `plus the in-repo core`）。

**判据读数（照 §2 终稿命令 · 仓根实跑 · 2026-09-21 06:56–07:0x）**

| 判据 | 实施前基线（本实施轮复跑） | 实施后 |
|---|---|---|
| C1-EXT | `RESIDUAL` 9/9 全红 | **`OK(0 residual)`** · exit 0 |
| C2-EXT | `MISSING` 16/16 全缺 | **`OK(new forms present)`** · exit 0 |
| C3-EXT | `OK(preserved)` | **`OK(preserved)`** · exit 0（10/10 在） |
| C7 | `DIFF-FACE`（5 档 hunks=0） | **`OK(diff-face: 5 files / exactly 8 single-line swaps)`** · exit 0 |
| C4 | — | `JSON.parse` 通过；`version=0.12.63` · `deps={"@thincoder/core":"^0.9.1"}` · desc = 新形 |
| C5（doc-check） | `OK(锚): 0 条悬空` + `FAIL(行宽): 2 行`（`:358` / `:365`——他批在途） | 逐项不变（零新增） |
| `git diff --numstat` | — | 5 档 = `1/1` · `2/2` · `3/3` · `1/1` · `1/1`（8 删 8 增） |

**字节面独立核（裁决偏离审计 D1）**：以「`HEAD` 档内容 + 恰 8 处单行替换 ≡ 现文」逐档逐字节核 ⇒ 5/5 全等（尾字节一致；BOM / 行尾 / 折行零变；package.json 尾换行 `HEAD` 已存在）。审计所见「44 vs 45 行」= 计数口径差（`split("\n").length` vs 设计轮口径），非本批引入 ⇒ **D1 关闭（无偏离）**。

**测试面**：设计 D 段判定（零断言 / 纯 metadata / 无运行期消费者）经评审轮复核一致；未跑全量套件——免测判定 + `thincoder-cli/AGENTS.md:35`（纯文档更新免测）。

**轮次与终态**

- 偏离审计（read-only explore · 1 轮）：核心 8 处与 §2 终稿逐字一致（converged）；报 D1（已裁决关闭）/ D2（§5 未写——本段落盘闭环）。
- 代码评审（advisor · 1 轮）：`VERDICT: pass` · 🔴 0 · 🟡 1 · 🔵 1；0 处需修 ⇒ **无 fix 轮**。
- 终态 = **clean**（0 需修 · 0 未做 · 0 静默简化）。

**面外披露 / 上抛（未改 · 交父侧裁）**

- 🟡（预存在 · 本批对象外）：`thincoder-cli/README.md` Architecture 段（`:171`–`:193`）仍列核统一前自持树（`provider/` · `tools/` · `mcp/` · `agent.mjs` · `memory/` · `session.mjs` · `config.mjs` 等）——实施侧实核 `thincoder-cli/src/` 仅 `acp/` `cli/` `tui/` + 8 档；`AGENTS.md:49` 记「已删的自持镜像不再列行」⇒ 产品文本自相矛盾。建议登记 `docs/TODO.md` 或另起文本收正批。
- 设计 / 需求档、历史面（`_archive/**` · `CHANGELOG.md`）、仓外 `D:\teamcode\AGENTS.md`：零触碰（依 §2 边界 + §4 批准范围）。

**占位行说明**：本段首行占位「（待批准后。）」已由上述（状态行起）内容替代——以本段为准；append-only 面不删既有行，清理归父侧轮次。

## §6 验证与收口（主代理）

**状态行**：✅ 已收口 2026-09-21（父侧）

**验收读数（父侧独立复跑 · 2026-09-21 07:0x · 仓根）**

| 判据 | 预期 | 实测 | 结果 |
|---|---|---|---|
| C1-EXT（无修饰残留 · 9 对） | `OK(0 residual)` | `OK(0 residual)`（exit 0） | ✓ |
| C2-EXT（新形态 · 16 条） | 全在 | `OK(16 新形全在)`（exit 0） | ✓ |
| C3-EXT（保留面 · 10 条） | 全在 | `OK(preserved 10/10)`（exit 0） | ✓ |
| C7（改动面 · 防夹带） | 5 档 ✗ 恰 8 处单行替换 | `OK(diff-face: 5 files / exactly 8 single-line swaps)`（exit 0） | ✓ |
| `numstat` 交叉 | 8 删 8 增 ✗ 零附带 | `1/1 · 2/2 · 3/3 · 1/1 · 1/1`（= 恰 8 处 ✓） | ✓ |
| package.json 解析 | JSON 有效 ✗ 键面零改 | ✓ `version=0.12.63` · `deps={"@thincoder/core":"^0.9.1"}` · desc 新形 | ✓ |
| doc-check | 本批触碰档零新增 | 5 档在 `docs/` 扫描域外 ✓ 批档在 `exclude` ✓（域内残项 = 他批在飞） | ✓ |

**链上轮次**：设计 3（#12 初稿 · #13 类集补全 4→8 · #15 评审处置微轮）× 实施 1（#16 · 终态 clean ✗ 内审 1 + 代码评审 pass 0🔴）✗ 评审 1（轮 1 = pass：🔴 0 / 🟡 4 / 🔵 1 ✗ §3）✗ 批准 = **用户 06:55「批准」**（§4）✓。

**父侧机械直改（打标 · 可 revert）**：§2 状态行收单 + 顺延（`:40`）· §1 引证号收正（§2.9 #5）· §1 「范围补全」段（折叠裁定）。**仓外直改（用户 06:51「要」授权 ✗ 不派子代理）**：`D:\teamcode\AGENTS.md` 3 处 claim 收正（`:5` / `:11` / `:40`——该档非 git 仓 ⇒ 无提交面 ✗ 本地直改 + 回读核验 ✓）。

**披露与另案**：F6 登记（`CORE-UNIFICATION.md:32` B6 + `:33` B7 文档面债——下次触碰该档一并收正）· 另案入册 **#182**（`thincoder-cli/README.md:171-193` Architecture 段仍列核统一前自持树——预存在 ✗ 类集外 ✗ 上抛）· 他批在飞面（doc-check 域内 2 悬空 + 2 行宽 = batch-lifecycle 族 ✗ 非本批）。

**结算同步（D7）**：① 角色表 = §1/§2/§3/§4/§5 各段标注 ✓；② 状态行 = §1 `:8` 改「已收口」+ 本节 ✓；③ 计数 = 8 处 / 5 档 / 判据 4 组（C1·C2·C3·C7）✓；④ 指针 = 批档 §2 终稿（fix 轮对照表）✓；⑤ 变更记录 = 产品档无变更记录面（README/AGENTS/package.json 非变更日志载体；CLI `CHANGELOG.md` 为发版载 ✗ 本批非发版面 ⇒ 不写）✓；⑥ 待办 = #182 入册 ✓；⑦ 台账 = **#181 待设计 → 在途 → 待核销 → 已核销** ✓；⑧ 前批遗留交叉 = 无本批关联遗留 ✓。

**提交**：`10b577a4`（6 档 · +486/−8——含本档；产品 5 档 = 恰 8 删 8 增）——push ✓ `origin/main` = `10b577a4` 实核（ls-remote）✓。
