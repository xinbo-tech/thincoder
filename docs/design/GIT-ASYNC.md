# Git 富注入异步化（GIT-ASYNC——L21）

> 板块：上下文注入（双端——git 富注入 execSync → 并行 async）。权威源：SESSION.md（注入语义——快照不缓存）+ setup-reminders.mjs/helpers.mjs（现实现）。
> 状态：**设计待评审**——2026-09-09 落档（L21 深勘察 explore 一手——并行 async 推荐 + context.mjs 整文件死代码发现）。需求：TODO L21（VS Code git 富注入异步优化——3×execSync×5s 最坏 15s 阻塞）——用户裁全采纳（双端同改 + 失败冷却 v1 + all-or-nothing）。

---

## 需求

- **总体目标**：git 富注入 3×execSync 串行（最坏 15s 阻塞事件循环——VSC extension host 内 Stop 都点不到）→ 并行 async——双端锁步——附带清理 VSC context.mjs 整文件死代码。
- **功能性**：
  - F-1 collectGitContext → async（promisify(execFile) 本地 runner——3 条 Promise.all——单 catch → "" 保持现 all-or-nothing 语义——用户裁保持）
  - F-2 不合成为 2 次（branch --show-current 原始名无解析面——-b 头行 C-quoting/detached/unborn 解析风险——零漂移）
  - F-3 无跨回合 TTL 缓存（注入 = 本回合快照——无廉价失效信号——status 本身就是探测器）+ **失败冷却 v1（用户裁纳入）**：模块级 Map<cwd, ts>——git 实际失败/超时后 30s 内跳过该 cwd 收集——病态 repo 周期拖慢变一次性
  - F-4 pushGitContext/调用点 async（VSC setup.mjs:393 await——CLI setup.mjs:89 await——双端调用链本就 async——相对顺序天然保持）
  - F-5 VSC context.mjs 整体删除（injectContext :122-254 + findDocChunks/escapeXml + buildRepoOutline/parseImports/collectSourceFiles :17-111 全死——setup.mjs:27 死 import 删——文档地图 5 处过期行同步：AGENTS.md:50/ARCHITECTURE.md:115/CONTEXT-COMPACTION.md:4,11/MEMORY.md:13——正主已迁 repomap.mjs/setup-reminders.mjs）
  - **范围边界**：不引入 runInterruptible（VSC shared.mjs import vscode——agent→tools 非既有边——测试会破）；CLI 无 runInterruptible（gitmem.mjs promisify 范式本地照）；v1 不做 abort signal 透传（hydrateRun 签名无 signal——记后续）。

## 设计（L21 深勘察骨架——照做勿自行解释）

### 1. VSC（setup-reminders.mjs）
- collectGitContext → async：execFileAsync = promisify(execFile)——每条
  `execFileAsync("git", [args], {cwd, encoding:"utf8", timeout:5000, windowsHide:true, maxBuffer: 现 execSync 同值})`
  （评审 #1：maxBuffer **沿用现 execSync 值不变**——防大输出仓 ENOBUFS 翻转 → "" 破 AC-4 字节 parity）
  ——Promise.all 3 条 + 单 catch → ""（all-or-nothing）
- 抽纯格式化函数（composeGitContext({branch,log,status})——独立导出供测——detached/dirty>20 截断/clean 形态）
- 失败冷却：模块级 Map<cwd, ts>——catch 时记 ts——30s 内跳过（直接返回 ""）——评审 #2：访问时惰性
  清 >30s 旧条目（防长活 extension host 无界累积——v1 接受）
- pushGitContext → async——修 :13 "no I/O" 过期注（git 注入进来后本就过期）
- :17 execSync import 删（唯一用途）

### 2. VSC（setup.mjs + context.mjs）
- :393 `await pushGitContext(...)`——:27 context.mjs 死 import 删
- context.mjs 整体删除（删前最后一次全仓 grep context.mjs 字符串确认无引用——含文档行——下述同步）

### 3. CLI（helpers.mjs + setup.mjs——用户裁双端同改）
- helpers.mjs collectGitContext → async（同构——execFile promisify 本地——:9 execSync import 删——唯一用途）
- 抽 composeGitContext 纯格式化——失败冷却 Map<cwd,ts> 30s
- setup.mjs :89 `await collectGitContext(agent.cwd)`

### 4. 文档同步
- 双端 SESSION.md（CLI :372 未决行核销记注——VSC §10 确认序契约不变）
- 双端 TODO L21 勾销（核销时）
- VSC 文档地图 5 过期行（AGENTS.md:50/ARCHITECTURE.md:115/CONTEXT-COMPACTION.md:4,11/MEMORY.md:13——context.mjs → repomap.mjs/setup-reminders.mjs）

### 5. 测试
- 双端 setup-reminders.test.mjs 增镜像格式化单测（composeGitContext——detached/dirty>20 截断/clean——不需真 git）
- 现有 hydrateRun/prepareRun 测试（mkdtemp 非 git 目录——命令快失败 → "" → 不注入——async 化行为不变断言不变——调用已 await 无需改）
- 失败冷却单测（评审 #3 定论——AC-3 锁 = **必做**非可选）：确定性 seam = 非 git 目录快失败模式
  （:44 既有 mkdtemp 非 git——git 命令 ms 级失败）——catch 记 ts 后二次调用 30s 内跳过 → "" 断言——
  不触发真 5s 超时——Map 预填 ts 注入法可选备用

## 受影响文件（双端）

| 文件 | 端 | 改动（评审 #4：行数实现期实测回填——删除行给现数锚） |
|---|---|---|
| src/agent/setup-reminders.mjs | VSC | collectGitContext/pushGitContext async + compose 抽 + 冷却 + 注修 |
| src/agent/setup.mjs | VSC | :393 await + :27 死 import 删 |
| src/context.mjs | VSC | **整体删除**（评审 #4：现 ~254 行锚——删除 → −254） |
| src/agent/helpers.mjs | CLI | collectGitContext async + compose 抽 + 冷却 |
| src/agent/setup.mjs | CLI | :89 await |
| test/setup-reminders.test.mjs | 双端 | compose 单测 + 冷却单测 |
| docs（SESSION.md/TODO.md/文档地图 5 行） | 双端 | 同步 |

## 验收

- AC-1 git 注入 async（3 条并行 Promise.all——最坏 = 单次 5s 超时——事件循环不冻结）
- AC-2 all-or-nothing 保持（任一失败/超时 → 整段 ""——测试锁——非 git 仓库快失败同路径）
- AC-3 失败冷却（真失败后 30s 内跳过该 cwd——Map 单测锁）
- AC-4 注入文本字节级不变（compose 抽离——现拼装逐字节保留——detached/截断/clean 单测锁）
- AC-5 context.mjs 删除零残留（grep 全仓——文档地图 5 行已同步）
- AC-6 双端锁步（CLI/VSC 同构——diff 核）
- AC-7 测试绿（setup-reminders + agent-lifecycle 既有 + 新单测——双端 npm test 快层）

## 变更记录
- 2026-09-09：L21 落档（深勘察一手——并行 async 推荐（不合成为 2——解析风险）——无缓存 + 失败冷却 v1（用户裁）——context.mjs 整文件死代码（injectContext + repo outline 全迁走）——all-or-nothing 保持（用户裁）——双端同改（用户裁））。
