# 批次档 · 2026-09-21 · 核包对外文本面（core-readme）

> 前情：无（新批）。
> 触发：用户 2026-09-21 11:56「core 没有 readme」+ 11:58「不能先把文件生成出来吗？」（要求尽快产出）· 台账 **#190**。
> 授权：需求已由用户指认 ⇒ **立批 + 设计轮启动**；**父侧代点火 / 代批准授权（用户 2026-09-21 12:00「自动跑到完成吧」）**——本批**设计评审点火权**与 **§4 批准权**委托父侧自动执行 ✓ **父侧自缚**：① 代签仅当「评审 pass（0🔴）∧ 设计/修正轮落点逐条核验 ✓ ∧ token 已签发」；② 每次代签在 §4 写明授权与依据；③ 需**新范围** / **用户口径裁决** ⇒ 仍停下不代签；④ 射程 = 本批跑到收口（排空）✓。
> 六段：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（主 agent）。

## §1 讨论（主 agent）

**状态行**：已收口 2026-09-21

**实核（双证 · 父侧）**：
- 源树 `thincoder-core/` 目录实扫 = **无 `README.md` ✗ 无 `LICENSE`**（有 `CHANGELOG.md` · `package.json` ✓）。
- 已发布 `@thincoder/core@0.9.1` tarball 203 档全表 grep `README|LICENSE` = **零命中** ✓（npm 自动带 README/LICENSE——没带上 = 源树就没有）。

**影响**：核是**已发布的共享包**（CLI / VSC 两端依赖）✗ npm 页 `@thincoder/core` **无文档面**——外部读者无从知道它是什么、怎么用 ✗ `license: MIT` 仅存于 `package.json`（无 LICENSE 文件）✗ `repository` / `homepage` / `keywords` / 作者面元数据亦缺 ⇒ 对外产品面不完整。

**需求（用户指认派生）**：核包补**对外文本面**——① `README.md`（新）② `LICENSE`（新）③ `package.json` 元数据小补。**内容要点**：是什么（共享机制核 + 共享提示词内容 · CLI ↔ VSC 两端共用）/ 安装与 import 面（`@thincoder/core/…` 子路径 ✗ `exports` 通配 `"./*"`）/ 资产面（`prompts/` · `tool-docs/`）/ 版本制（CalVer——号反映发布时间）/ 许可（MIT）。

**口径约束（硬）**：
- **依赖口径对齐 #181 收正**（「零第三方依赖」口径 ✗ 不得写回旧说法）。
- **与 CLI README 单源**（D2）：核 README **不复写** CLI 专有内容（CLI 的安装 / 命令 / TUI 面 ✗ 指向即可）；字段细节住实现 / 设计档 ✗ README 不复述。
- 长文档人类可读判据适用（行宽 / 换行结构化 ✗ README 住仓根 ✗ 不入 `docs/` 机检域 ✓ 但写法仍遵判据）。

**范围（本批）**：`thincoder-core/README.md`（新）· `thincoder-core/LICENSE`（新）· `thincoder-core/package.json`（元数据字段小补 ✗ 不改 `exports` / `files`——README/LICENSE 由 npm 自动带上 ✓）。
**零改**：产品码（`*.mjs`）· 提示词 / tool-docs 内容 · CLI / VSC 侧档 · 版本号（发版时另定）。

**路由**：产品文本面（对外文本 ✗ fail-closed = 产品码面）⇒ 全链（需求 = 主 agent（本档）✗ 设计 = eng-designer ✗ 评审 = 用户点火 ✗ 实现 = eng-coder）✗ 不走便道（#154 教训）。

**与发版耦合**：核 `0.9.2`（承 #189 启动修复）重发时**一并带上**（README/LICENSE 由 npm 自动入 tarball ✗ npm 页当场齐 ✗ 否则须等下一次核发版才能修复页面）✓ 实施赶在核发版之前 ✓。

## §2 批次任务（eng-designer）

**状态行**：🔄 设计完成（initial + fix 轮 1 · 2026-09-21 · eng-designer）

> **本批唯一设计承载 = 本段**（产品文本面小批——不另建设计档；`docs/core/design/**` 零改，遵 §1 边界）。设计 = 三档内容**逐字**（A/B/C）+ 受影响面与判据（D）。台账 #190。
> 口径零新语义：依赖 / 版本制 / 资产面三类口径全承**既有收正面**（比对来源见下表）。

**口径锚（比对来源 · 三类）**

| 类 | 既有收正面（逐字比对来源 · as-of 2026-09-21 实读） |
|---|---|
| **依赖** | `thincoder-cli/README.md:5`（`zero third-party dependencies`）· `:11` · `:225` · `thincoder-cli/AGENTS.md:5` · `:18` · `thincoder-vscode/README.md:7`（`zero third-party runtime dependencies`）· `thincoder-vscode/AGENTS.md:11`；裁定源 = `docs/core/design/CORE-UNIFICATION.md:1138`（§2.9 #5「零依赖只约束第三方」）+ `docs/core/requirements/CORE-UNIFICATION.md:120`（N7）+ 批档 `docs/batches/2026-09-21-readme-dep-claim.md` §2 终稿 |
| **版本制** | `docs/RELEASE.md:36-54`（§4 CalVer 三段定义 + 定号纪律 + 「号反映发布时间，不反映语义」）· 核 `thincoder-core/CHANGELOG.md:4` |
| **资产面** | `thincoder-core/prompt-files.mjs:2-21`（单一解析面 · 三交付态 dev link / npm install / vsix embed）· `docs/RELEASE.md:23`（F5：`files` 白名单含 `prompts/` 15 + `tool-docs/` 24 = 断言 D 对象）· `docs/core/design/ARCHITECTURE.md:20`（核引擎下限 `>=22.13.0`）· `:45`（核 = 共享机制实现 + 共享提示词与工具描述） |

---

## A README 设计

**落点** = `thincoder-core/README.md`（新档）。**语言 = 英文**（两侧 README 同形 · npm 面读者 · 见 KD-1）。

**章节结构（11 节 · 要点）**

| # | 章节 | 要点 |
|---|---|---|
| 1 | 标题 + 定位句 | `# @thincoder/core`；一句话 = 是什么（两产品共享核：机制 + 提示词内容） |
| 2 | 定位段 | 薄壳关系 + 共享面清单（agent 环 / advisor / provider / 记忆 / 工具 / 会话 / MCP / git / 台账 / traces + 提示词与工具描述）；**依赖口径句逐字**（K1） |
| 3 | Requirements | Node **>= 22.13.0**（依据 = `engines` + `node:sqlite` 去 flag 界——`memory/schema.mjs:9` 实读 `node:sqlite`） |
| 4 | Install | `npm install @thincoder/core`；库非 CLI（无 `bin`）；「多数人经两产品间接使用」 |
| 5 | Importing | **无裸根入口**（实测 `ERR_PACKAGE_PATH_NOT_EXPORTED`）+ `exports` 通配 `{ "./*": "./*" }` + **含 `.mjs` 后缀**（无后缀实测 `ERR_MODULE_NOT_FOUND`）+ 5 条真实子路径示例 + 嵌套路径示例（K2） |
| 6 | What's inside | 9 行模块域表（域 → 模块路径；纯路径面，不复述机制语义） |
| 7 | Shared prompt content | `prompts/`（槽位提示词）· `tool-docs/`（工具描述面）干什么用 + `prompt-files.mjs` 相对包自身解析（三交付态一致）（K3） |
| 8 | Versioning | CalVer 三段（`year.month.monthly-count` · 年段自 2026 计且 2026 = 0）+ 「号反映发布时间，不反映 API 兼容性」+ `CHANGELOG.md` 指针（K4） |
| 9 | Contributing | 仓内位置（`thincoder-core/`）+ issue 面 + 两条约定（纯 `.mjs` 无构建 / 零第三方依赖）+ `npm test` + 设计档落点指针 |
| 10 | License | MIT + `LICENSE` 指针（K5） |

**关键口径句逐字（机检串 K1–K5）**

- **K1（依赖 · 对齐 #181）**：`The core has **zero third-party dependencies**: Node.js standard library only, pure ESM (`.mjs`), no build step.`
  采用无「自家核例外句」形——核自身 `dependencies` 字段不存在（`thincoder-core/package.json` 实读）⇒ 无需例外句（见 KD-2）。
- **K2（import 面）**：`There is no bare-root entry point — \`import "@thincoder/core"\` does not resolve (\`ERR_PACKAGE_PATH_NOT_EXPORTED\`).` + `subpaths map 1:1 onto files in the package`（`exports` 为 `{ "./*": "./*" }` · 逐字同时给出通配形）。
- **K3（资产）**：`The two products author no slot prompts or tool-description bodies of their own` + `prompt-files.mjs` resolves them relative to the package itself + 三交付态（`local link, npm install, packaged extension`）+ 例外句（工具面 2 锚——bash terminal face / question-panel availability line——端取值由各端 `src/prompt-injections.mjs` 供给）。
- **K4（版本制）**：`Version numbers are calendar-based (CalVer): \`year.month.monthly-count\`` + `The number marks release time, not API compatibility`。
- **K5（许可）**：`MIT — see \`LICENSE\`.`（`license` 字段 = `MIT` 不变）

**全文逐字**（实施 = 逐字节落盘 · UTF-8 / LF / 无 BOM / 尾换行 · 89 行 / 4483 B · 最长行 161 字符 < 300）

````markdown
# @thincoder/core

**The shared core of the ThinCoder products — the mechanisms and the prompt content behind the ThinCoder CLI and the ThinCoder VS Code extension.**

Both products are thin shells: this package owns everything they have in common — the agent loop and subagent
scheduling, the advisor review system, the provider layer (SSE streaming, thinking-mode mapping, retries, rate
gating), the three-layer memory with its code and document indexes, the built-in tool system, session storage,
the MCP client, git and checkpoint integration, the ledger — plus the prompt texts and tool descriptions the
two products assemble their model context from.

The core has **zero third-party dependencies**: Node.js standard library only, pure ESM (`.mjs`), no build step.

## Requirements

- **Node.js >= 22.13.0** — the floor comes from the built-in `node:sqlite` module (usable without a flag since 22.13.0), which the memory and ledger modules use.

## Install

```bash
npm install @thincoder/core
```

The package is a library — it ships no CLI of its own. Most users never install it directly: the two products
declare it as a dependency (`thincoder`, the CLI, and `thincoder-vscode`, the VS Code extension). Install it
directly when you build your own tooling on the shared core.

## Importing

There is no bare-root entry point — `import "@thincoder/core"` does not resolve (`ERR_PACKAGE_PATH_NOT_EXPORTED`).
Every import is a subpath, and subpaths map 1:1 onto files in the package (`exports` is `{ "./*": "./*" }`), so
include the `.mjs` extension:

```js
import { loadConfig } from "@thincoder/core/config.mjs"
import { createAgent } from "@thincoder/core/agent.mjs"
import { chat } from "@thincoder/core/provider/index.mjs"
import { put, putMarkdown } from "@thincoder/core/memory.mjs"
import { runAdvisorReview } from "@thincoder/core/advisor/run.mjs"
```

Nested paths work the same way (`@thincoder/core/git/checkpoint.mjs`, `@thincoder/core/mcp/transport-stdio.mjs`).

## What's inside

| Area | Modules |
|---|---|
| Agent loop, subagents | `agent.mjs` · `agent/` · `agent-tools/` |
| Advisor review, consultation, escalate | `advisor/` · `agent-tools/consult.mjs` · `agent-tools/escalate-async.mjs` |
| Provider layer (streaming, thinking mapping, retries, rate gate) | `provider/` |
| Memory, embedding, code/doc indexes | `memory.mjs` · `memory/` · `embedding.mjs` |
| Built-in tools | `tools/` |
| Sessions | `session.mjs` · `session-*.mjs` |
| MCP client | `mcp.mjs` · `mcp/` |
| Git, checkpoints, team-memory sync | `git/` |
| Ledger, traces | `ledger.mjs` · `traces/` |

## Shared prompt content

The two products author no slot prompts or tool-description bodies of their own: both assemble their model
context from the texts in this package. `prompt-files.mjs` resolves them relative to the package itself, so the
same files are loaded in every delivery state (local link, npm install, packaged extension).

- `prompts/` — the slot-based prompt texts: personas, the common layer, the discipline layers, and the advisor
  and consultation modules.
- `tool-docs/` — one file per built-in tool; these texts are what the model reads as tool descriptions.

A prompt rule or a tool-description body is edited in exactly one place, and both products pick it up with the
next release. The exception is two tool-face anchors — the bash terminal face in `tool-docs/bash.md` and the
question-panel availability line in `tool-docs/question.md`: each product supplies those two values from its own
`src/prompt-injections.mjs`, because they describe behavior that differs between the CLI and the extension.

## Versioning

Version numbers are calendar-based (CalVer): `year.month.monthly-count`, where the year segment counts from
2026 (`0` = 2026). `0.9.1` is therefore the first core release of September 2026.

The number marks release time, not API compatibility — read `CHANGELOG.md` for what changed.

## Contributing

The core lives in `thincoder-core/` of the ThinCoder repository; bug reports and questions go to the
repository issue tracker. Two conventions shape every change: pure ESM `.mjs` with no build step, and
zero third-party dependencies — if the Node.js standard library can do it, no third-party package is
allowed. `npm test` runs the offline unit suite; it runs again on release through `prepublishOnly`.
Mechanism design documents live in the repository under `docs/core/design/`.

## License

MIT — see `LICENSE`.
````

## B LICENSE 设计

- **内容 = `thincoder-cli/LICENSE` 逐字节复制**（1079 B · 21 行 · sha256 前 12 = `9742a973a30b`；`thincoder-vscode/LICENSE` 同哈希 ⇒ 三档同版）。**版权行 = `Copyright (c) 2026 ThinCoder contributors`**（逐字比对两兄弟档）。
- 形态 = UTF-8 / LF / 无 BOM / 尾换行。
- **npm 行为**：`readme*` / `license*` / `licence*` 属 npm 恒带集（**证据** = npm-packlist（Node 随附 `C:\Program Files\nodejs\node_modules\npm\node_modules\npm-packlist\lib\index.js:287-293` strictDefaults：`!/package.json` · `!/readme*` · `!/copying*` · `!/license*` · `!/licence*`）+ 设计轮 `npm pack --dry-run --json` 实测）⇒ 源树有档即自动入 tarball ✓ 白名单零改。
- 全文逐字（= CLI 档）：见上「npm 行为」同源复制；实施 = 从 `thincoder-cli/LICENSE` 取字节写 `thincoder-core/LICENSE`（不改一字）。

## C package.json 元数据（三档之一 · 只加字段）

**新增五字段 + 值（值来源 = 实读）**

| 字段 | 值 | 依据 |
|---|---|---|
| `keywords` | `["ai", "agent", "core", "shared", "llm", "mcp"]` | 核自身属性（非产品词——见 KD-5） |
| `author` | `liwei <liwei@51marine.com> (上海新舶)` | `thincoder-cli/package.json:42` 逐字同值 |
| `repository` | `{ "type": "git", "url": "git+https://github.com/xinbo-tech/thincoder.git" }` | 同仓兄弟包 `thincoder-cli/package.json:32-35` 逐字同值（见 KD-3 · F1 上抛） |
| `homepage` | `https://github.com/xinbo-tech/thincoder` | 仓根形（同族 `thincoder-vscode/package.json:13`；子目录形否决——见 KD-4） |
| `bugs` | `{ "url": "https://github.com/xinbo-tech/thincoder/issues" }` | 仓根 issue 面（同族 `thincoder-vscode/package.json:14-16`） |

**插入点（生成器 = `JSON.parse` → 赋值 → `JSON.stringify(x, null, 2)`，禁 BOM——`docs/RELEASE.md:93` 教训）**：① `keywords` 紧随 `description` 之后；② `author` / `repository` / `homepage` / `bugs` 紧随 `license` 之后。
**零改键**：`name` · `version` · `description` · `type` · `license` · `engines` · `exports` · `files` · `scripts` —— 逐字不动（判据 JC4）。**目标全文** = 上表五字段 + 既有键序（32 → **49 行** / 990 B；`JSON.parse` 通过 = 设计轮实测）。

## D 受影响文件表 + 验收判据

**D-1 受影响文件表（as-of 2026-09-21 实读 · 行数 = `wc -l` 口径）**

| 文件 | 现状 | 改点 | 预期增量 |
|---|---|---|---|
| `thincoder-core/README.md` | 不存在 | 新档 = A 全文逐字 | 0 → **89 行** / 4483 B（最长行 161 字符） |
| `thincoder-core/LICENSE` | 不存在 | 新档 = CLI LICENSE 逐字节复制 | 0 → **21 行** / 1079 B |
| `thincoder-core/package.json` | **32 行** / 605 B | 五字段 · 两插入点（C 节） | 32 → **49 行** / 990 B（+17） |
| 其余全仓档 | — | 零改 | ±0（`exports` / `files` / `version` / `description` 等键面逐字不动） |

**改动面反查（工程工具约定 · `thincoder-cli/AGENTS.md:22`）**：设计轮实跑（`docImpact` 直驱 · 变更面 = 三核档 · 符号面空）= 命中 98 档（含设计/需求层 47 档）——全部为包面档名（`README.md` / `LICENSE` / `package.json`）的既有引称，无一引用本批新增语义面 ⇒ **不录入改动面**（本批零语义变更：`exports` / `files` / `version` / `description` 键面逐字不动）。符号面为空的结构性依据 = 核目录不在代码树枚举（`src` / `scripts` / `bin` / `test`）⇒ 核符号不进宽形态索引（`docs/core/design/CORE-UNIFICATION.md:1139`——报告面 · 不入闸）。

**D-2 验收判据（机检 · 仓根运行 · 纯 ASCII ⇒ cmd / bash 双安全 · 判据串避反引号）**

- **JC1（tarball 含两新档）**：`node -e "const {execSync}=require('child_process');const j=JSON.parse(execSync('npm pack --dry-run --json',{cwd:'thincoder-core',encoding:'utf8'}));const f=j[0].files.map(x=>x.path);const miss=['README.md','LICENSE'].filter(p=>!f.includes(p));console.log(miss.length?'MISSING '+JSON.stringify(miss):'OK(tarball: README.md + LICENSE / '+f.length+' files)');process.exit(miss.length?1:0)"`
  基线（设计轮实测）= `MISSING ["README.md","LICENSE"]`（209 档）⇒ 实施后预期 `OK(… / 211 files)` · exit 0。
- **JC2（口径串在 + 旧形零残留）**：`node -e "const fs=require('fs');const t=fs.readFileSync('thincoder-core/README.md','utf8');const need=['zero third-party dependencies','ERR_PACKAGE_PATH_NOT_EXPORTED','subpaths map 1:1 onto files','prompt-files.mjs','calendar-based (CalVer)','release time, not API compatibility','MIT','no slot prompts or tool-description bodies of their own','prompt-injections.mjs'];const bad=['zero npm dependencies','zero dependencies','author no prompt texts of their own'];const miss=need.filter(s=>!t.includes(s));const res=bad.filter(s=>t.includes(s));console.log((miss.length||res.length)?'FAIL missing='+JSON.stringify(miss)+' residual='+JSON.stringify(res):'OK(claims: '+need.length+' in / 0 residual)');process.exit(miss.length+res.length?1:0)"`
  基线 = 档不存在 ⇒ `FAIL`；实施后预期 `OK(claims: 9 in / 0 residual)` · exit 0。
- **JC3（子路径示例与 `exports` 语义一致）**：`node -e "const fs=require('fs');const t=fs.readFileSync('thincoder-core/README.md','utf8');const p=[...new Set([...t.matchAll(/@thincoder\/core\/([A-Za-z0-9._\/-]+)/g)].map(m=>m[1]))];const miss=p.filter(x=>!fs.existsSync('thincoder-core/'+x));console.log(miss.length?'MISSING '+JSON.stringify(miss):'OK('+p.length+' subpath examples resolve)');process.exit(miss.length?1:0)"`
  设计轮预核（对 A 全文骨架实跑）= 7 条全解析 · 0 miss ⇒ 实施后预期 `OK(7 subpath examples resolve)`。
- **JC4（键面：五键在位 / 其余逐字不变 / 可解析）**：`node -e "const {execSync}=require('child_process'),fs=require('fs');const old=JSON.parse(execSync('git show HEAD:thincoder-core/package.json',{encoding:'utf8'}));const now=JSON.parse(fs.readFileSync('thincoder-core/package.json','utf8'));const keep=['name','version','description','type','license','engines','exports','files','scripts'];const changed=keep.filter(k=>JSON.stringify(old[k])!==JSON.stringify(now[k]));const added=['keywords','author','repository','homepage','bugs'].filter(k=>!(k in now));console.log((changed.length||added.length)?'FAIL changed='+JSON.stringify(changed)+' missingNew='+JSON.stringify(added):'OK(metadata: 5 added / untouched keys identical)');process.exit(changed.length+added.length?1:0)"`
  基线（设计轮实测「目标体 vs 现档」）= `changed: []`（0）⇒ 实施后预期 `OK(metadata: 5 added / untouched keys identical)` · exit 0。
- **JC5（LICENSE 与 CLI 逐字节同 + 版权行）**：`node -e "const fs=require('fs'),c=require('crypto');const h=p=>c.createHash('sha256').update(fs.readFileSync(p)).digest('hex');const a=h('thincoder-cli/LICENSE'),b=h('thincoder-core/LICENSE');const l3=fs.readFileSync('thincoder-core/LICENSE','utf8').split('\n')[2];console.log(a===b?'OK(LICENSE byte-identical / '+b.slice(0,12)+' / '+l3+')':'MISMATCH '+a+' vs '+b);process.exit(a===b?0:1)"`
  （注：判据实体以「哈希相等」为准；实施后预期 `OK(LICENSE byte-identical / 9742a973a30b / Copyright (c) 2026 ThinCoder contributors)`。）
- **JC6（doc-check 零新增）**：`node scripts/doc-check.mjs --root .` —— **基线（2026-09-21 设计轮实跑）= `FAIL(锚): 3 条悬空` + `FAIL(行宽): 3 行超 300 字符`**（明细 = `docs/core/design/AGENT-LOOP-SUBAGENT.md:2047` / `:2065` / `:2066` 悬空 + `AGENT-LOOP-SUBAGENT.md:2091`（345）/ `docs/core/design/BATCH-RECORD.md:358`（589）/ `:365`（302）——**均他批在飞，非本批因果**）。本批三触碰档全在扫描域（`docs`）外且 `thincoder-core/**` 不入闸（`PROJECT-MANIFEST.json` checkConfig.scanDirs = `["docs"]`）⇒ **零新增恒成立**；读数登记 = 与基线逐项一致。
- **JC7（改动面 · 防夹带）**：① 改动面路径集合（域 = `thincoder-core/`）：`node -e "const fs=require('fs'),{execSync}=require('child_process');const want=['thincoder-core/LICENSE','thincoder-core/README.md','thincoder-core/package.json'];const read=s=>s.split('\n').filter(Boolean).map(l=>l.slice(3));const cur=read(execSync('git status --porcelain -- thincoder-core/',{encoding:'utf8'}));let base=[];try{base=read(fs.readFileSync('.thincoder/tmp/core-before.txt','utf8'))}catch{console.log('NOTE: no baseline snapshot - judging the current set as-is')}const s=cur.filter(p=>!base.includes(p));const extra=s.filter(p=>!want.includes(p));const missing=want.filter(p=>!cur.includes(p));console.log(extra.length||missing.length?('FAIL extra='+JSON.stringify(extra)+' missing='+JSON.stringify(missing)):'OK(change surface: exactly 3 paths)');process.exit(extra.length+missing.length?1:0)"` ⇒ 预期 `OK(change surface: exactly 3 paths)`（快照差法：核内第 4 档被改 ⇒ 列报 `extra`）；② 档形（`package.json` 纯增）：`node -e "const {execSync}=require('child_process');const out=execSync('git diff HEAD -U0 -- thincoder-core/package.json',{encoding:'utf8'});const h=out.split('\n@@').slice(1);const del=h.map(x=>x.split('\n').filter(l=>l[0]==='-'&&l.slice(0,3)!=='---').length);const ok=h.length===2&&del.every(n=>n===0);console.log(ok?'OK(package.json: 2 hunks / 0 deleted lines)':'DIFF-FACE hunks='+h.length+' del='+JSON.stringify(del));process.exit(ok?0:1)"` ⇒ 预期 `OK(package.json: 2 hunks / 0 deleted lines)`。
  **运行时机 / 基准** = §5 实施后 / 提交前。**判定取「实施动作引入差」**——多批并行下他批在飞的域内改动会混入现集合（修正轮实跑即遇：8 个他批在飞域内档）⇒ §5 写档前先存基准快照 `git status --porcelain -- thincoder-core/ > .thincoder/tmp/core-before.txt`（`.thincoder/tmp/` 已 gitignore——`.gitignore:19`）；快照缺 ⇒ ① 退化为现集合判定并 `NOTE` 明示（`extra` 中他批条目人工分辨）。**已提交** ⇒ ② 的 `HEAD` 改 `HEAD^`、① 由 §6 以提交清单（`git show --name-only --format= HEAD`）复核三档在内。**基线（修正轮实跑）= ① 无快照态 `FAIL extra=[8 个他批在飞域内档] missing=[3 档全缺]` · ② `DIFF-FACE hunks=0 del=[]`**（本批尚未实施）。先例 = `docs/core/design/CORE-UNIFICATION.md:1730` K3（diff 可逆性）+ 批档 `docs/batches/2026-09-21-readme-dep-claim.md` C7（运行时机 / 基准形）。

**D-3 用例表（normal / boundary / error）**

| 类 | 输入 | 预期输出 |
|---|---|---|
| normal | `npm pack --dry-run --json`（cwd = `thincoder-core`） | 211 档含 `README.md` + `LICENSE`（JC1） |
| normal | README 子路径示例 ×7 | 全部在包内解析（JC3 · 设计轮已实测 7/7） |
| normal | `JSON.parse` 读 `package.json` | 通过；`exports` / `files` / `version` 逐字不动（JC4） |
| boundary | `import "@thincoder/core"`（裸根） | 不解析 → `ERR_PACKAGE_PATH_NOT_EXPORTED`（README 如实声明——设计轮实测） |
| boundary | `import "@thincoder/core/config"`（无后缀） | 不解析 → `ERR_MODULE_NOT_FOUND`（README 声明「含 `.mjs` 后缀」——设计轮实测） |
| boundary | 断网环境跑 `npm pack --dry-run` | 纯本地打包（核零依赖、无 registry 交互）；`prepublishOnly` 不触发（仅 `npm publish` 触发） |
| error | `package.json` 被写坏（尾逗号 / BOM） | JC4 的 `JSON.parse` 抛 ⇒ 判据红（拦在发布前） |

**D-4 边界（本批不做）**：产品码 / 测试（coder 笔域）· 核根三档之外的档 · CLI / VSC 侧任何档 · 提示词 / `tool-docs` 内容 · 版本号（发版时另定 · §1 已裁）· `exports` / `files` / `scripts` 键面 · 设计档（`docs/core/design/**` 零改）· 需求档（口径已对）· 新语义（全承既有收正面）· UI 面（本批无 UI / 交互决策 ⇒ 无 open 项，除 F1 一项待裁）。

**D-5 发现即报（未改动面 · 处置由父侧裁）**

| # | 落点 | 事实 | 建议 |
|---|---|---|---|
| F1 | `.git/config`（origin）vs 两侧 `package.json` | 本 clone `origin` = `https://gitee.com/shanghai-xinbo/thincoder`；而同仓**已发布**兄弟包 URL 组 = `github.com/xinbo-tech/thincoder(.git)`（**CLI 档逐字支撑** = `thincoder-cli/package.json:32-35`；VSC 档 = 同族形态证据——其 URL 组指向本仓自有远程 `github.com/xinbo-tech/thincoder-vscode(.git)`（`thincoder-vscode/package.json:9-16`））+ 仓根 README `:12` 记 `.github/workflows/test.yml` | 本设计取 **GitHub 一组**（KD-3）；若口径应为 Gitee ⇒ **3 值翻转**（`repository.url` / `homepage` / `bugs.url`）——一行裁定 |
| F2 | `thincoder-core/CHANGELOG.md` | **不在 `files` 白名单 ⇒ 不入 tarball**（npm 不恒带 CHANGELOG——npm-packlist 恒带集仅 `package.json` / `readme*` / `copying*` / `license*` / `licence*`；dry-run 实测 209 档无 CHANGELOG） | README 的 `CHANGELOG.md` 指针 = 仓库内副本（如实）；若需 npm 面可见 ⇒ `files` 加档（另批——本批禁动 `files`） |
| F3 | `thincoder-core/package.json` | 无 `publishConfig.access`——scoped 包公开发布依赖命令行 `--access public`（`docs/RELEASE.md:104`） | 发布批候选（防漏参 · 一行）；本批范围外 |
| F4 | 核 README 无「内嵌 Changelog 摘要」节 | CLI README 有摘要节且 `docs/RELEASE.md:92` 要求每发行同步；核无此节（KD-6） | 现状 = 设计选择（`CHANGELOG.md` 单源）；若要 npm 页可见发行记录 ⇒ 另裁（会把核 README 挂上发行耦合） |
| F5 | `thincoder-vscode/README.md:176` | 项目结构树内 `src/prompts/` 行**已不存在**（实读 `thincoder-vscode/src/` 无 `prompts/`；提示词已归一入核） | 产品文本面卫生（另批 · 非本批） |
| F6 | 已发布 0.9.1 tarball **203 档** vs 现工作树 dry-run **209 档** | 差 = 0.9.1 后新增档（非缺陷 · 事实读数） | 页面修复须随 **0.9.2 重发**（§1 已裁——README/LICENSE 由 npm 自动带上） |

**关键决策记录（含否决备选）**

- **KD-1 语言 = 英文**：两侧 README 均英文（npm / Marketplace 面读者）；否决中文（含中文档另有承载——设计档 / CHANGELOG）。
- **KD-2 依赖句 = 无例外句的 `zero third-party dependencies` 形**：核自身 `dependencies` 字段不存在（实读）⇒ 无需「自家核例外句」（那是两侧壳面语境）；否决照抄 CLI `README.md:11` 整句（含 `node_modules` 现状描述 = CLI 专有面 ⇒ 违单源边界 §1:22）。
- **KD-3 URL 组 = GitHub**：①同仓已发布兄弟包同值（npm 面一致性）②仓根 README 记 GitHub Actions ③VSC 同族；**上抛 F1**（本 clone origin = Gitee）。翻转成本 = 3 值。
- **KD-4 `homepage` = 仓根**（非 `.../tree/main/thincoder-core`）：与兄弟包同形且离线可核；否决子目录形（依赖默认分支名 + 不可离线核证）。
- **KD-5 `keywords` = 核自身属性**（`ai`/`agent`/`core`/`shared`/`llm`/`mcp`）；否决照抄 CLI 产品词（`cli`/`tui`/`deepseek`/`openai` = 产品面词，核非产品）。
- **KD-6 README 不内嵌 Changelog 摘要**（版本制节 = CalVer 段 + `CHANGELOG.md` 指针）；否决 CLI 式摘要（避免 README–发行耦合 · 见 F4）。
- **KD-7 README 不写计数**（prompts / tool-docs 档数不落 README）：README 不在机检域 ⇒ 计数会静默过期（D3 计数纪律）；否决写「15 / 24」。
- **KD-8 `files` 不动**：README / LICENSE 由 npm 恒带（证据 = npm-packlist 恒带集 + dry-run 实测）；CHANGELOG 不恒带（F2）。
- **KD-9 链接最小化**：全文无外链；`CHANGELOG.md` / `LICENSE` 以代码形指称——否决相对链接（npm 渲染改写行为离线不可核证）。

**回指（本批条目 ↔ 判据）**

| # | 条目（§1 需求 + 台账 #190） | 判据 |
|---|---|---|
| 1 | `README.md`（新） | JC1 + JC2 + JC3 |
| 2 | `LICENSE`（新 · MIT） | JC1 + JC5 |
| 3 | `package.json` 元数据小补（5 字段） | JC4 |
| 4 | 依赖口径对齐 #181 · 与 CLI README 单源边界 | JC2（+ KD-2） |
| 5 | 版本制（CalVer）落 README | JC2（K4 串）+ KD-6 |
| 6 | 触碰档 doc-check 零新增 | JC6（域外 ⇒ 恒成立；读数登记） |
| 7 | 改动面恰 3 档 · 防夹带 | JC7 |

**三方一致注**：本批无新需求条目——锚 = 台账 #190 + 批档 §1（用户 11:56 指认）；条目 ↔ 判据一致性 = 上表 7 行 ↔ JC1–JC7。

**未决 / 待裁（唯一项）**：F1 URL 组（默认按 KD-3 = GitHub 组实施；若父侧 / 用户裁定 Gitee ⇒ 实施前改 3 值）。

**复核读数（生成器安全性 · 设计轮实测 · 修正轮复跑 ✓）**：`JSON.parse → JSON.stringify(x, null, 2) + "\n"` 对现档 **逐字节可逆**（605 B 全等）⇒ C 节生成器路径与 JC7（改动面恰 2 个纯增 hunk · 0 删除行）相容。

**变更记录**：2026-09-21 初稿（设计轮）；2026-09-21 修正轮——承评审轮 1 的 7 条发现逐条收正（§7 口径句 K3 与 JC2 检串 · JC5 退出方向 · JC7 改动面断言与运行时机 · F1 引证 · D-1 反查注 · 计数与统计修正（README 89 行 / 4483 B；package.json 32 行口径）· 设计面失效残面清出）。

## §3 设计评审（评审子代理）

（待点火。）

### 轮次 1（评审子代理）

对象 = `docs/batches/2026-09-21-core-readme.md` §2（本批唯一设计承载）· 设计评审 · round = 1。

**实核（证据面 · 本轮实读）**：`thincoder-core/` 目录实扫 = 无 `README.md` ✗ 无 `LICENSE` ✓（§1 实核成立）；`thincoder-core/package.json` 现档 **32 行 / 605 B**（ls 实读）、9 键、**无 `dependencies`** ✓ ⇒ KD-2（无例外句）成立；A 全文 = 86 行（:82–:167 逐行清点）✓；JC3 的 7 条子路径**全在盘**（`config.mjs` · `agent.mjs` · `provider/index.mjs` · `memory.mjs` · `advisor/run.mjs` · `git/checkpoint.mjs` · `mcp/transport-stdio.mjs`）✓；示例 import 符号在盘（`config.mjs:228` · `agent.mjs:59` · `provider/index.mjs:5`←`provider/core.mjs:75` · `memory.mjs:11`←`memory/core.mjs:26/198` · `advisor/run.mjs:91`）✓；`prompts/` 15 档 · `tool-docs/` 24 档 ✓；`LICENSE` = MIT 21 行、版权行与 CLI 档逐字同（**sha256 前 12 未复算 = unverified**——本环境无 shell 工具面）；锚实读命中：`thincoder-cli/package.json:32-35/:42` · `thincoder-vscode/package.json:9-16/:32-34` · `docs/RELEASE.md:23/:36-54/:92-93/:104` · `thincoder-core/prompt-files.mjs:2-21` · `thincoder-core/CHANGELOG.md:4` · `docs/core/design/ARCHITECTURE.md:20/:45` · `docs/core/design/CORE-UNIFICATION.md:1138` · `docs/core/requirements/CORE-UNIFICATION.md:120` · `PROJECT-MANIFEST.json:20-31`（`scanDirs=["docs"]`）✓；#181 批档 §2 终稿 = 「zero third-party dependencies」族 ✓（K1 对齐成立）。JC6 基线读数（3 悬空 + 3 行宽）无法复跑 = **unverified**（「域外零新增」结论不依赖该读数）。受影响文件表注解（线档判据）✓：三档均带现状行数与增量（0→86 · 0→21 · 32→49 / +17），远低于档位、`.md` 豁免。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（内容准确性） | 🔴 | §7 首句「The two products author no prompt texts of their own」（:140）与末句「A prompt rule or a tool description is edited in exactly one place」（:148）与在盘机制不符：核 `tool-docs/bash.md:15` / `tool-docs/question.md:11` 是注入锚，**端取值由产品侧撰写**（`thincoder-vscode/src/prompt-injections.mjs:18` = VSC 的 terminal 面整段模型可见文本；`thincoder-cli/src/prompt-injections.mjs:19` = CLI 侧 question 行）；产品侧文档明记该残留（`thincoder-cli/AGENTS.md:21`「仅工具面 2 锚（bash/question 端差异）保留至工具面 review」· `thincoder-vscode/AGENTS.md:15`「装配 = 核单点 + 本端 `src/prompt-injections.mjs` 注入端取值」），产品测试断言该端取值确在模型可见工具描述内（`thincoder-vscode/test/tool-descriptions.test.mjs:68`）。K3 句为本设计自撰（全仓仅批档 :75/:140 命中）⇒ 落盘即发布不准确声明；JC2 只做子串匹配，检不出 | 把 §7 首句与末句收口径（例：产品不撰写槽位提示词与工具描述正文；工具面 2 锚的端取值由各端供给），并同步 JC2 需检串；机制面零改 |
| 2 | Acceptance criteria | 🟡 | JC5 命令（:213）`process.exit(a===b?1:0||0)` = **哈希相等时退出 1**（成功=红），与同组判据「exit 0 = pass」及 :214「实施后预期 `OK(...)`」相反；:273 勘误称该表达式「已就地更正为 `process.exit(a===b?0:1)`」，与 :213 实读逐字不符（声称已修而未修）。按退出码机检 ⇒ 正确实现被判失败 | :213 改为相等即 0（如 `process.exit(a===b?0:1)`），并同步删/改 :273 的「已更正」声明 |
| 3 | Acceptance criteria | 🟡 | JC7（:216）自称「防夹带 · 预期恰 3 档改动面」，但两条命令只覆盖三档自身（package.json hunk + 两新档 status）——第 4 个被改档不会被检出，与 D-1「其余全仓档 ±0」不闭合；且未写运行时机/基准（若实施后已提交，`git diff HEAD` 为空 ⇒ 假红）。先例 #181 C7 有「运行时机 = 实施后 / 提交前；若已提交 ⇒ HEAD 改 HEAD^」 | 补全工作树路径集合断言（恰 3 档）并写明运行时机与基准（提交前 / 实施前 HEAD；已提交则 HEAD^） |
| 4 | Doc hygiene | 🟡 | §2 设计面残留失效/修订式表达：:34「（待设计。）」仍在（下方 :36 已是「设计完成」状态行，且无替代注——#181 §2 以「占位行已由本段替代」显式处理）；:271 勘误块标注「残面已由父侧就地收正——打标 ✓ … 可 revert」。依 `docs/core/design/BATCH-RECORD.md:369`（2026-09-18 用户裁定「失效的表达一定要删掉」）应清 | 走状态行改写豁免给占位行收口（或补显式替代注），并把勘误块「已就地收正/可 revert」类表述删净（沿革归记录面/变更记录） |
| 5 | Clarity | 🔵 | F1 行（:236）称「同仓已发布兄弟包 URL 组 = `github.com/xinbo-tech/thincoder(.git)`（`thincoder-cli/package.json:32-35` · VSC `:9-16`）」——VSC 档 :9-16 实值 = `github.com/xinbo-tech/thincoder-vscode(.git)`（另一仓），不支撑该式（CLI 档支撑 ✓、KD-3「同族」用法可用，但 F1 证据行并按会误导）。F1 = 本批唯一未决项 | 把 VSC 引用改注为「同族形态证据（各包指向本仓自有远程）」或删去；F1 的 URL 组随 §4 显式落定（勿静默取默认） |
| 6 | Methodology | 🔵 | 全仓「改动面反查」约定（`thincoder-cli/AGENTS.md:22`：实施轮开工前跑 `scripts/doc-impact.mjs`，输出并入受影响文件表；#181 设计含该读数）未在 D-1/D-5 体现；对核目录该索引可能不适用（`docs/core/design/CORE-UNIFICATION.md:1139`：核目录不在代码树枚举 ⇒ 不进宽形态索引） | 给一次反查读数，或明记「核目录不入索引 ⇒ 本批不适用」，与 #181 同形 |
| 7 | Doc-state（数字漂移） | 🔵 | 行数读数两口径不一：C 节（:190）「**33 → 49 行**」vs D-1（:194 声明「行数 = `wc -l` 口径」· :200「**32 行** / 605 B … 32 → **49 行**（+17）」）；605 B 现档实读 ✓、+17 行算式 ✓ ⇒ :190 的「33」与自身口径不符 | 统一为 wc -l 口径（32 → 49 / +17） |

**域外注（无严重度）**：① `docs/RELEASE.md:100` 记「核包 `prepublishOnly` 门禁现状 = 暂缺（scripts 仅 `test`）」——与 `thincoder-core/package.json:8`（已有 `prepublishOnly: npm test`）不符（参考面档滞后，仅登记）；② `docs/core/design/ARCHITECTURE.md:20` 把核引擎下限实核落点记为 `thincoder-core/package.json:8`（现档 `engines` 在 :11-13）——as-of 漂移，仅登记。

**口径限制声明**：本评审上下文未提供 Project Standards 档与 Document Map ⇒ 方法学按 Project Guide（AGENTS.md）+ 仓内规范档（`docs/core/design/BATCH-RECORD.md` · 产品 AGENTS.md）判；文档归属维度降级——核 `README.md` / `LICENSE` = 包面产物（落包根，非 docs 树分片），设计承载走批档 §2 与 #181 先例同形，**未发现归属违规**；唯一发现的文本矛盾 = 上表 #1。

**计数**：🔴 1 · 🟡 3 · 🔵 3（+ 域外注 2）。

VERDICT: changes-required

### 轮次 2（评审子代理）

**对象** = `docs/batches/2026-09-21-core-readme.md` §2（本批唯一设计承载）· **复核轮 2（缩范围）**——逐号核验修正轮 7 条落点（①🔴 §7 口径收紧 + K3/JC2 同步 ②🟡 JC5 方向 + 勘误清 ③🟡 JC7 补全（快照差集形）④🟡 占位/修订式清 ⑤🔵 F1 引证 ⑥🔵 反查读数 ⑦🔵 32 行）× 方向一致 × 兼查修正引入的新矛盾（不重开新面）。

**实核（证据面 · 本轮实读）**：本档全文 317 行实读 + 参考面实读（`thincoder-core/tool-docs/{bash,question}.md` · 两端 `src/prompt-injections.mjs` · `thincoder-core/prompt-files.mjs` · 两侧 `package.json` · 两侧 `AGENTS.md` · `.gitignore` · `CORE-UNIFICATION.md` :1130-1145/:1725-1738 · `BATCH-RECORD.md` :340-388 · `readme-dep-claim.md` :360-399）。① §7 新句逐字在档且与在盘机制相符（`tool-docs/bash.md:15: {{inject:bash-terminal-face}}` · `question.md:11: {{inject:question-ui-face}}`；两端取值表均含双锚 ✓）；② :216 `process.exit(a===b?0:1)`（全档 grep 仅现值 + :292 轮 1 记录引旧值）；勘误/「組」/「已就地」类在 §2 面零残留；③ JC7 重写（:219-220：路径集合 + 快照差集 + 运行时机/基准）；`.thincoder/tmp/` 目录实存 ✓ + `.gitignore:19` 覆盖 ✓；④ :34 单行状态行（占位行已删）+ :277 变更记录；⑤ F1（:240）VSC 引证收正——两侧 package.json 实读逐字符（CLI :32-35 · VSC :9-16）；⑥ D-1 反查段（:204）+ `CORE-UNIFICATION.md:1139` 实读符 + `thincoder-cli/scripts/doc-impact.mjs` 实存（读数 98/47 无法复跑 = unverified）；⑦ :191 改「32 → 49 行」与 D-1 口径一致；README 计数 89 行 = :80–:168 逐行清点 ✓（4483 B 未复算 = unverified——无 shell）。

| # | Orig# | File | Severity | Status | Notes |
|---|-------|------|----------|--------|-------|
| 1 | ①（原🔴） | `docs/batches/2026-09-21-core-readme.md` | — | ✅ Fixed | §7 收正（:138「The two products author no slot prompts or tool-description bodies of their own…」+ :146-149 例外句——工具面 2 锚端取值自各端 `src/prompt-injections.mjs`；CLI 侧 bash 值 = 显式空串，仍属端供值语义）；K3（:73）与 JC2（:210 检串 `'no slot prompts or tool-description bodies of their own','prompt-injections.mjs'` 入 need · 旧形入 bad）同步 |
| 2 | ②（原🟡） | 同上 | — | ✅ Fixed | JC5 退出方向 = `a===b?0:1`（:216）；勘误块清（grep 命中仅 :292/:294 轮 1 记录行）；:240 已是「一组」；沿革入 :277 变更记录 |
| 3 | ③（原🟡） | 同上 | — | ✅ Fixed | JC7 = ① 改动面路径集合（域 = `thincoder-core/`；基准快照 `.thincoder/tmp/core-before.txt` 差集；缺快照退化为 NOTE 明示）+ ② 档形（2 hunks / 0 删行）+ 运行时机/基准段（:220「§5 实施后 / 提交前」「已提交 ⇒ HEAD 改 HEAD^、§6 提交清单复核」）；父侧裁准的快照差集形已落 |
| 4 | ④（原🟡） | 同上 | — | ✅ Fixed | §2 占位行「（待设计。）」已删 + :34 单行状态行「🔄 设计完成（initial + fix 轮 1 …）」+ 勘误块清 + :277 变更记录（§3 的「（待点火。）」:281 = 全族骨架占位——同族 4 档同形、含已 pass 的 `readme-dep-claim.md:370` ⇒ 非落点、不计） |
| 5 | ⑤（原🔵） | 同上 | — | ✅ Fixed | F1 行（:240）收正为「VSC 档 = 同族形态证据——其 URL 组指向 `github.com/xinbo-tech/thincoder-vscode(.git)`（`thincoder-vscode/package.json:9-16`）」；不再并入「同仓 thincoder(.git)」式；F1 仍为唯一未决项（默认 GitHub 组） |
| 6 | ⑥（原🔵） | 同上 | — | ✅ Fixed | D-1 反查段（:204）：读数（98 档 · 设计/需求层 47 档 ⇒ 不录入改动面）+ 符号面依据引 `CORE-UNIFICATION.md:1139`（实读逐字符）+ 约定源 `thincoder-cli/AGENTS.md:22` 实读符；脚本实存（`thincoder-cli/scripts/doc-impact.mjs`） |
| 7 | ⑦（原🔵） | 同上 | — | ✅ Fixed | C 节「（32 → **49 行** / 990 B…）」（:191）与 D-1（:195 `wc -l` 口径 · :201「**32 行** / 605 B … 32 → **49 行**（+17）」）一致；「33 → 49」零残留（仅 :297 轮 1 记录引旧值） |
| 8 | (new) | 同上 | 🔵 | New | :219 JC7 ① 命令 NOTE 串含非 ASCII「—」：`catch{console.log('NOTE: no baseline snapshot — judging the current set as-is')}`——与 :206 自述「**D-2 验收判据（机检 · 仓根运行 · 纯 ASCII ⇒ cmd / bash 双安全 · 判据串避反引号）**」相抵；字符串字面量内 ⇒ 逻辑/退出码不受影响，仅 cmd 码页下 NOTE 文字可能乱码。建议 `-` 替 `—` |

**域外注（无严重度）**：① `docs/RELEASE.md:100`「核包 `prepublishOnly` 门禁现状 = **暂缺**（scripts 仅 `test`…）」与 `thincoder-core/package.json:8`（已有 `prepublishOnly: npm test`）不符（参考面档滞后，仅登记）；② `docs/core/design/ARCHITECTURE.md:20` 核引擎下限落点引 `thincoder-core/package.json:8`（现档 `engines` 在 :11-13）——as-of 漂移，仅登记。

**口径限制声明**：Project Standards 档与 Document Map 仍未提供（承轮 1）——归属维度降级核对：三档 = 包面产物 / 批档 §2 承载（#181 同形），未见归属违规。

**计数**：🔴 0 · 🟡 0 · 🔵 1（新 · 非阻断）+ 域外注 2（无严重度）。

VERDICT: pass

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-21 12:00「自动跑到完成吧」授权 · 代签三条件齐备）**：

- 依据 ① **评审链全清**：轮 1（评审 id=35）= 🔴 1 · 🟡 3 · 🔵 3 → 修正轮（7/7 落）→ 轮 2 复核（评审 id=42）= **🔴 0 · 🟡 0 · 🔵 1（新 · 非阻断）**——7 条发现全部收正并复核 ✓；
- 依据 ② **落点逐条核验**：轮 2 复核 7/7 ✓（§7 口径句在盘相符 ¦ JC5 `a===b?0:1` ¦ JC7 补全（快照差集）¦ 占位/勘误清 ¦ F1 引证 ¦ 反查段 ¦ 32 行）；
- 依据 ③ **token 已签发**（复核 pass 后按序签发 ✗ 凭证值不落档）；
- **裁定表**：①🔴 §7 口径 → **Fixed**（README §7 两处 + K3 + JC2 同步）②🟡 JC5 → **Fixed**（含**父侧代录笔误的账**：勘误声称与命令不符——已收正）③🟡 JC7 → **Fixed**（快照差集形 = 父侧裁准）④🟡 占位/修订式 → **Fixed** ⑤🔵 F1 引证 → **Fixed** ⑥🔵 反查 → **Fixed** ⑦🔵 32 行 → **Fixed**；**轮 2 新 🔵**（JC7 NOTE 串非 ASCII 破折号）→ **Fixed**（父侧就地收正 `—` → `-` ✗ 一字 ✗ 父侧直接执行 · 打标 ✓ · 可 revert）；
- **裁决落定（评审明示「勿静默取默认」项）**：**F1 URL 组 = 采 GitHub 组**（`github.com/xinbo-tech/thincoder(.git)` 三值）——依据 = 与**已发布**兄弟包 npm 面一致（`thincoder-cli/package.json:32-35`）+ 仓根 README 记 `.github/workflows/test.yml`；本 clone `origin` = Gitee 仅灾备 ✗ 不改对外元数据口径 ✗ 用户 2026-09-21 12:11 未异议 ✓；
- **实施派发**：eng-coder #44（`thincoder-core/README.md` 89 行逐字 + `LICENSE` 逐字节 + `package.json` 五字段 ✗ 恰三档 ✗ 判据 JC1–JC7 ✗ 随核 `0.9.2` 发布）✓。

## §5 实施记录（eng-coder）

（待批准后。）

### 实施轮（initial · eng-coder · 2026-09-21）

**状态**：✅ 交付完成（三档落盘 · JC1–JC7 全绿 · 偏离审计 + 代码评审双过 · fix round 0）

**交付摘要（对齐 §2 回指表 7 行）**

| # | 条目 | 落点 | 判据 |
|---|---|---|---|
| 1 | README.md（新） | `thincoder-core/README.md` · 89 行 / 4483 B · 与 §2 A 块（:80–:168）**逐字节等** | JC1 + JC2 + JC3 |
| 2 | LICENSE（新） | `thincoder-core/LICENSE` · 21 行 / 1079 B · 与 `thincoder-cli/LICENSE` 字节同 | JC1 + JC5 |
| 3 | package.json 元数据小补 | `thincoder-core/package.json` · 32 → 49 行 / 605 → 990 B · 五字段两插入点 | JC4 |
| 4 | 依赖口径对齐 #181 | K1 句在档 · 旧形零残留 | JC2 |
| 5 | 版本制（CalVer）入 README | README §Versioning | JC2（K4 串） |
| 6 | doc-check 零新增 | 与基线逐项一致（三档在扫描域外） | JC6 |
| 7 | 改动面恰 3 档 · 防夹带 | 快照差集 = 恰 3 路径 | JC7①② |

**判据读数（命令 = §2 D-2 判据原文逐条 · 仓根运行 · 读数原文）**
- JC1 → `OK(tarball: README.md + LICENSE / 211 files)`（exit 0 · §2 预期 211 ✓）
- JC2 → `OK(claims: 9 in / 0 residual)`（exit 0）
- JC3 → `OK(7 subpath examples resolve)`（exit 0）
- JC4 → `OK(metadata: 5 added / untouched keys identical)`（exit 0）
- JC5 → `OK(LICENSE byte-identical / 9742a973a30b / Copyright (c) 2026 ThinCoder contributors)`（exit 0）
- JC6 → `FAIL(锚): 3 条悬空（闸态——阈值 0）` · `FAIL(行宽): 3 行超 300 字符`（`AGENT-LOOP-SUBAGENT.md:2091` 345 / `BATCH-RECORD.md:358` 589 / `:365` 302 —— 三条明细与 §2 基线逐项逐字同；锚面计数 3 = 基线 3）⇒ **与基线一致 · 零新增**（本批三档在 `docs` 扫描域外）
- JC7① → `OK(change surface: exactly 3 paths)`（exit 0 · 基准快照 `.thincoder/tmp/core-before.txt` 于改动**前**写入 = ` M thincoder-core/manifest.mjs`）
- JC7② → `OK(package.json: 2 hunks / 0 deleted lines)`（exit 0）
- 补测（档形 · 非 JC）→ README：`BYTE-EQUAL: true`（89 行 / 4483 B / 无 BOM / LF / 尾换行）；package.json：`bytes=990 | newlines=49 | BOM=no | CR=no | trailing-nl=true | canonical-generator-form=true`（= 与 §2 C 生成器输出等价）

**npm test 读数与归因**：`cd thincoder-core && npm test` ⇒ `ℹ tests 494 / ℹ pass 491 / ℹ fail 3`。3 条红 = **他批在飞**（并行批 #43 `manifest-resolution` · 其 §3.2 重定义 T39/T40/T41 为本批新格 ⇒ 现红为中途态）。⇒ 本批 AC③ 口径记「**排除他批在飞后 = 全绿**」（父侧 2026-09-21 确认采纳）。
**归因证据（A/B/C 三跑 · 同一环境同命令）**：① 现树（含本批三档）= 3 fail；② 对照副本 `.thincoder/tmp/core-probe/`（同树**除去**本批三档：README/LICENSE 删除 + package.json 回 HEAD 版）= 同 3 条 fail；③ 同副本 + `manifest.mjs` 换回 HEAD 版（18162 B）= **该 3 条全绿** ⇒ **本批改动面 A\B = ∅（零因果）**。（副本另现 3 条路径伪影 fail = 副本目录下 `REPO_ROOT=../../` 解析所致，与两变量皆无关，现树无此现象。）

**决策透明表**

| 决策 | 依据 | 备选与否决 |
|---|---|---|
| README 用**机械抽取**（读批档 → 取围栏块 :80–:168 共 89 行 → 写档）而非手抄 | §2 要求「逐字节落盘 · 89 行 / 4483 B」；手抄引入不可证伪的转写风险（全文 18 行含非 ASCII：`—` · `·` · `↔`） | 手抄 89 行 ⇒ 否决（无法保证字节等） |
| 抽出后**逐字节复校**（期望串 = 批档块 + 尾换行 vs 落盘档） | 把「逐字」从声明变成可判读数 | 仅目视对读 ⇒ 否决 |
| URL 组 = **GitHub 三值** | §4 裁决（:340 · 与已发布兄弟包 npm 面一致） | Gitee 组（本 clone origin）⇒ 父侧已裁定否决 |
| package.json 以 `write` 落盘 + **规范形复校**（`JSON.stringify(JSON.parse(x),null,2)+"\n" === x`）代替生成器直写 | §2 C 指定生成器路径；规范形复校等价于「该档 = 生成器对自身内容的输出」，且不走 node 写文件绕过写工具面 | `node` 直写档（绕写工具门）⇒ 否决 |
| LICENSE 用 `file_ops` **字节复制** | §2 B「逐字节复制」 | `write` 转写 ⇒ 否决 |

**审计与代码评审轮次与终态**

| 轮 | 类型 | 结果 |
|---|---|---|
| 1 | 内部 explore **偏离审计**（对照 §2 四类偏离） | **clean · 零偏离**（README 89/89 行文本全等 · LICENSE 21 行 / 1079 B 与 CLI 同 + 版权行 · package.json 五字段/插入点/990 B · 越界痕迹未见） |
| 2 | 内部 advisor **代码评审**（type=code） | **VERDICT: pass** · 🔴 0 / must-fix 🟡 0 / 🔵 2（非阻断） |
| fix round | — | **0 轮**（两轮皆无实施落点） |

**评审 2🔵 处置（响应表 · 本批均不改）**
- ① README:65「one file per built-in tool」：`tool-docs/` 24 档 = 静态表 24 名（`test/tool-registry.test.mjs:26-31` SHARED_FACE），而注册面另有 8 个 instance-bound 工具（同档 `:34` INSTANCE_BOUND）无 tool-docs 档（`repo_outline` 描述内联于 `tools/repomap.mjs:299`）⇒ 句面语义偏窄（实施侧已独立复核实据）。
  **不改**：该句为设计逐字（§2 A 块 :144），改文案 = 改设计 ⇒ 属设计面，待父侧裁（父侧机械折行 · 打标 ✓ · 可 revert）。
- ② README:77 `CHANGELOG.md` 指针：该档不在 `files` 白名单 ⇒ 不入 tarball（npm 页读者在 tarball 内找不到）。**不改**：设计面 :241 F2 已登记并裁定「仓库内副本（如实）」，属已披露项。

**偏离 / 未决**：实施面零偏离。未决（父侧裁）= 上述 2🔵 是否走设计修正轮（若改 ⇒ README 需重落 + §2 重审）。
**域外 / 卫生**：诊断副本 `.thincoder/tmp/core-probe/` 与日志 `core-readme-test.log` / `dc-core-readme.log` / `core-probe*.log` 均在 `.thincoder/tmp/`（gitignored ⇒ 不入库）；建议收尾清理副本。

## §6 验证与收口（主代理）

**实施轮**：eng-coder #44（initial ✗ 偏离审计 clean ✗ 代码评审 pass ✗ fix round 0）✗ 交付 = §5 ✗ 三档（README 新建 89 行 / LICENSE 新建 21 行 / package.json 32→49 行）。

**验收（父侧独立复跑 · 计数原文）**：

| # | 判据 | 命令 | 读数（父侧复跑） | 结论 |
|---|---|---|---|---|
| ① | README 与 §2 A 块逐字 | 批档围栏块（````markdown :79–:169）vs 落盘档 | **`VERBATIM-MATCH = true`**（89 行 == 89 行 ✗ 尾换行 ✓）| ✓ |
| JC1 | tarball 含两新档 | `npm pack --dry-run --json`（cwd = `thincoder-core`） | `README.md:true LICENSE:true` ✗ **files = 211**（基线 209 ✗ §2 预期 211 ✓）| ✓ |
| JC2 | 口径串 | §2 D-2 原文 | 9 串全在 ✗ 残留 0 | ✓ |
| JC3 | 子路径 | 同上 | 7 条全解析 ✗ miss 0 | ✓ |
| JC4 | 键面 | 同上 | 五键在位 ✗ 旧九键逐字未动（changed-keep = []）| ✓ |
| JC5 | LICENSE 逐字节 | 同上 | `OK byte-identical / 9742a973a30b` | ✓ |
| JC6 | doc-check | `node scripts/doc-check.mjs --root .` | **悬空 3 · 行宽 3 = 基线零新增**（三条明细与 §2 基线逐项同）| ✓ |
| JC7① | 改动面 | 快照差集（域 = `thincoder-core/`） | 恰三档（package.json + README + LICENSE）| ✓ |
| JC7② | 档形 | `git diff HEAD -U0` | **2 hunks / 0 删行** | ✓ |
| URL 组 | §4 裁定落盘 | 读 package.json | `git+https://github.com/xinbo-tech/thincoder.git` ✗ homepage / bugs 同源（= GitHub 三值 ✓）| ✓ |

**AC③（核 npm test）口径**：coder 读数 = `494 / 491 / 3`，3 红 = 他批在飞（#43 `manifest-resolution` 中途态 ✗ 其 §3.2 重定义 T39/T40/T41）✗ 归因 = coder A/B/C 三跑（本批改动面 A\B = ∅ ✗ 零因果 ✓）⇒ 本批记「**排除他批在飞后 = 全绿**」✗ 核 `0.9.2` 发布前以 #43 落地后的复跑为准（发布门 ✓）。

**父侧直接执行（打标 · 可 revert）**：§5 一行（评审 🔵 响应 ①）303 字符 ⇒ **机械折行**为两行（内容零变 ✗ 仅断行 ✓ 尾标「父侧机械折行 · 打标 ✓ · 可 revert」）。

**结算同步清单（D7）**：① 六段齐名归其位（§1/§4/§6 = 主 agent ✗ §2 = eng-designer ✗ §3 = 评审子代理 ✗ §5 = eng-coder）✓；② 状态行 →「**已收口 2026-09-21**」✓；③ 计数 / 枚举一致（JC1–JC7 七条 ✗ 回指表七行 ✗ §5 交付表七行 ✓）；④ 指针解析（`§2` ✗ `§3` 轮 1/轮 2 ✗ `§4` 代签 ✗ `§5` 实施 ✗ `§6` 本段 ✓）；⑤ 沿革：设计档本批零触碰 ✓ ✗ 本批沿革 = §2/§3/§4/§5 自载 ✓；⑥ 待办：**#190 → 已核销**（结算依据 = 本 §6 + §5）✗ 新增 **#194**（README `:65` 口径待裁 ✗ 送发版审面 ✓）✗ 面外 F2–F7 在 #192 ✓；⑦ 前批遗留交叉核：无（本批为新增面 ✗ 无「条目完成而锚批档未收口」情形 ✓）。

**发布关联**：本批 = 核 `0.9.2` 的 npm 页面首秀件（README / LICENSE）✗ 随 `0.9.2` 发布（发布动作 = 用户门 ✗ 挂起中 ✓）。

**冻结核**：本 §6 落 ⇒ 整档冻结（不再回改 ✗ 例外 = 提交哈希回填 errata 一笔 ✓）。
