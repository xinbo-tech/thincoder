# 工具系统设计

> 权威源：thincoder/src/tools/ + src/agent-tools/ + src/mcp/。本文档描述工具系统的**当前设计**——工具如何暴露给模型、如何安全工作、如何调度。跨文档已接管的主题只留指针，不复制。
> 关联权威：`AGENT-LOOP.md`（调度/审批/question 抑制）、`SESSION.md`（read_history）、`MCP.md`（MCP 客户端）、`CHECKPOINT.md`（快照）、`EDIT-HELPERS.md`（编辑工具 EOL 语义——原 EDIT-TOOL-EOL-DESIGN 并入本档）、`PROVIDER.md`（模型上下文配置）、`TOOL-OUTPUT-LIMITS-*.md`（输出落盘阈值）。


> 需求层（2026-09-10 拆分批）：本板块需求见 `../requirements/TOOLS.md`——本档保留设计与测试细节。

## 1. 总览

工具系统是 agent 与外部世界（文件/命令/网络/git/MCP/项目状态）交互的**唯一通道**：

- **能做什么**：以统一 OpenAI function-calling schema 暴露给模型（`toOpenAISchema`，shared.mjs）；
- **怎么安全做**：收口到工具内部——安全哲学 = **信任模型 + 审批门控 + 快照**（非文本拦截）；
- **何时做**：调度层两段式（只读并行、副作用串行）。

**工具分类**：内置工具（25 个，builtinTools）+ 元工具（agent-tools，纪律工具）+ MCP 展开工具（动态并入 builtinTools）。

**统一契约**：`{ name, description, parameters, readonly?, sideEffectExempt?, parallel?, multimodal?, execute(args, ctx) → string }`；`ctx = { cwd, agent, depth, signal, callbacks, onOutput, onQuestion, onPermissionRequest }`。execute 必须返回字符串（undefined 视为错误，dispatch 显式检查）。

## 2. 注册与 schema

- **内置工具 25 个**（tools/index.mjs builtinTools）：
  - file 6：read / write / edit / insert_after / hashline_edit / read_image
  - patch 2：apply_patch / delete
  - system 4：bash / glob / grep / ls
  - web 2：websearch / fetch
  - git 2：git / question
  - 其余：checklist / lint / lsp / execute / tree / ops 4（file_ops / process / get_current_time / wait_for）
  - （read_pdf 已移除——R21；sleep 已删——见 wait_for）
- **元工具**（agent-tools.mjs）：task / plan / goal / verify / batch_segment / subagent / skill / recent_changes / advisor / eng / timer / read_history / consult_start / consult_stop——readonly 自管纪律工具；子代理按 role 过滤（explore/plan 只读，eng-coder 额外门控）。read_history 语义权威 = SESSION.md §9/§13。
- **schema 生成**：`toOpenAISchema(tool)`——name/description/parameters 转 OpenAI function 格式。description 来源：CLI 用 `tools/*.md`（`DESC()` 机制，md 文件即描述源）；VS Code 用 `.mjs` 内嵌描述。md/内嵌描述给模型完整使用手册（含参数说明、路由、反模式），非一行字符串。

## 3. 上下文与生命周期

- **ctx 字段**：cwd / agent / depth / signal / callbacks / onOutput / onQuestion / onPermissionRequest。
- **undo 快照**：副作用工具执行前 `snapshotForUndo`（写前文件内容入内存栈），`/undo` 回滚。
- **hooks**：PreToolUse / PostToolUse / PostToolUseFailure 用户脚本在 `~/.thincoder/hooks/`（PreToolUse 返回 false 阻断执行）。
- **dispatch console 回显**：工具执行期间的 console 输出回显到结果（调试价值）——调度细节权威 = AGENT-LOOP.md §4。

## 4. 安全边界

安全哲学：**信任模型 + 审批门控 + 快照为真实防线**；文本匹配拦截被否定（"安全剧场"——恶意模型必然绕过，拦住的多是正常操作）。

| 面 | 当前机制 |
|---|---|
| 路径 | **无边界解析**（2026-09-02 取代 resolveInCwd 双重断言）：相对路径相对 cwd 解析、绝对路径原样解析、符号链接正常跟随；无目录限制。信任模型 + 权限门禁为唯一防线 |
| 命令 | **零文本拦截（彻底）**：破坏性命令（rm -rf 等）一律放行，走审批 + 快照。保留 `detectDanger` 危险标注（只给人看红标，不拦截：recursive-delete/sudo/pipe-to-shell/dd/mkfs/raw-device/chmod-777/fork-bomb，引号感知防 commit message 误标）。bash 超时 120s |
| 网络 | `isPrivateHost`（localhost/内网/云元数据 169.254.169.254）SSRF 防护；响应体 ≤5MB；HTML 转文本（stripTags/htmlToText） |
| 文件 | MAX_READ_LINES=2000、MAX_OUTPUT_CHARS=200_000（超限落盘，模型见预览）；normalizeEOL（CRLF 统一）；write 前 autoSyntaxCheck（JS 文件自动 node --check） |
| lint | node --check fast path + 语言级联（tsc/ruff/cargo/go vet）；eslint 级联已删（2026-09-02，零依赖），`scripts/check-syntax.mjs` 替代 |
| lsp | 按需 spawn LSP server（process.execPath 直跑，无 shell），语义级诊断/跳转兜底 |

**execute 边界**：纯净 node ESM 子进程，与 bash 同边界——顶层 await / 动态 `import()` / `require()` / `console` / `fetch` / `process` 全可用；**无 import 阻断、无 require 禁、无目录限制、无伪沙箱、无预置全局**（exec-prelude 已退役）。文件能力唯一入口 = 专用工具。超时 SIGKILL 强杀（默认 30s，上限 600s）。

## 5. 调度与权限

调度两段式详情权威 = **AGENT-LOOP.md §4**，此处只列工具标记语义：

- readonly = 无副作用可并行；
- `parallel: true` = 显式声明可并行（grep/glob）；
- sideEffectExempt = 有副作用但豁免于"失效 advisor/verify"追踪（subagent）；
- 审批门控：破坏性动作（delete/外发/快照类）走 onPermissionRequest（autoApprove 短路 / 批量确认）。

## 6. 编辑工具语义（地图——每工具权威档分拆）

> 2026-09-08 文档重组：编辑工具语义从本节拆到**每工具一档**（详细正文在各自权威档——本节只留定位句 + 契约要点 + 指针，不再复制正文）。
> 共享 helper（EOL/候选/U+FFFD）权威 = `EDIT-HELPERS.md`；read 是读工具（非编辑）——语义在 §7。

| 工具 | 定位 | 权威档 |
|---|---|---|
| **edit** | 精确区域替换（主）——两种定位形态（行号/内容）+ 三级匹配 + 替换即删 | `EDIT.md` |
| **insert_after** | 已知行后插入新行（纯插入——不必编造上下文） | `INSERT-AFTER.md` |
| **hashline_edit** | 按内容哈希寻址（位置无关——行号漂移免疫） | `HASHLINE-EDIT.md` |
| **apply_patch** | 统一 diff 应用到一或多文件（整块/新建/跨文件） | `APPLY-PATCH.md` |
| **write** | 整文件替换/新建（含父目录） | `WRITE.md` |

**契约要点**（详细约束在权威档）：
- edit：`line: N`/`startLine: N, endLine: M` 行号形态（互斥 old_string）或 `old_string` 内容形态；三级匹配（逐字→空白窗口→模糊 ≥90%）；零重叠替换即删；空 new_string 显式错（防静默删除）；edits 数组批（原子）。
- insert_after：`after_line`/`after_regex`（须唯一）；read-before-insert 护栏（dirty——受影响区拒绝）。
- hashline_edit：`old_hashes`（read hashes=true 取）+ `new_content`（空=删块——当前唯一命名删行路径）；U+FFFD 警告。
- apply_patch：无坐标 hunk 宽容 + 文件头容缺；多文件原子。
- write：整文件替换（read 先）；EOL 覆盖按原行尾/新建随目录多数派。

**路由**（模型可见 Routing 段见各工具描述）：edit 精确改 / insert_after 加行 / hashline 位置无关 / apply_patch 整块多文件 / write 整文件。

## 7. 逐工具契约

- **git**：action 集 32（add/commit/push/tag/branch/checkout/restore/stash/fetch/pull/reset/revert/merge/cherry-pick + F7 的 clone/init/rebase/remote/clean/switch/apply/worktree/archive/blame/mv）。
  - 破坏性动作（reset --hard / checkout 丢改动 / rm / clean / rebase 有未提交时）**先快照再执行 + 确认**，从不拦截（gitGuardSnapshot）；快照为全量副本（CHECKPOINT.md 权威）。
  - status 用 runGitRaw 保行前导空格（防 porcelain 误分类）。反向路由：git.md 含 "Route to git instead of bash" + discipline.md Tool routing。
- **checklist**：mark 支持 `id` 优先于 index（index 降级 fallback）；无显式 ID 历史条目 parse 时一次性分配落盘；nextRootId 扫 checklist.md + checklist-done.md（归档 ID 恒占位不复用）；前缀归一剥所有连续 `T[\d.]+:`；父 done 须子树全 done，递归归档整棵子树。
- **execute**：`code`（inline ESM）与 `scriptFile` 二选一必填；nodeArgs 禁 `--eval`/`--inspect` 类；scriptFile 可指向 workspace 外；超时默认 30s / 上限 600s，超时错误含重试引导。
- **glob**：`{a,b}` brace 展开为 `(?:a|b)`；`!` 排除前缀（多模式 include !exclude）；不支持语法（`?(x)`/`@(a|b)`/`+(x)`/空/未闭合 brace）显式英文报错（不静默漏匹配）。
- **wait_for**：条件等待（非 sleep）——`{condition, interval_ms?, timeout_ms?}`；条件语义化（advisor settled / subagent id:N done / consult done / file exists / port open）；未知条件显式报错。readonly；timeout 默认 30s（config agent.waitForTimeoutMs 覆盖，cap 600s）；interval 默认 1s 下限 100ms；唯一非即时返回工具。等待用 wait_for，同步工具后不需要等待。
  - **`advisor settled` 判据（2026-09-11 第 10 批修正）**：= **后台评审池真实态**——`_asyncAdvisors`（∪ history 载体）无 running/queued 条目；修前判据读子代理池的 role==="advisor" 条目（该池永无此类条目）→ **恒真 0ms 秒过**（用户实证）。机制与工具面细则见 AGENT-LOOP.md §18；需求 `../requirements/AGENT-LOOP.md` §4（F-B2）。
- **timer**：默认 180s，seconds 可选。
- **task**：状态别名归一（completed/finished/…）+ warning；跨会话/项目级用 checklist（描述含路由）。
- **verify**：通用验证门禁——语言/框架/项目无关，不自动跑任何测试命令；模型经 `verification:{status:"passed"|"failed"|"skipped", command?, summary?}` 声明验证状态（passed 放行 / failed 打回 / skipped 放行但须 summary 理由）。参数已删 `full`/`testNamePattern`/`filter`（保留 `workdir`）。语义见独立设计文档（Verify 重构）。
- **read_image**：视觉模型读图；非视觉模型拒绝/占位（防 image_url 毒化会话）；svg 返回文本源码、bmp 拒绝并提示转 PNG。
- **websearch/fetch**：网络边界见 §4；fetch 失败错误含 proxy 提示。
- **process / file_ops / get_current_time / tree / lsp / lint / delete / bash**：按各自描述契约。
- **batch_segment**：批次档段写入（**无路径参数**——目标档 = spawn 绑定 `child._batchDoc` / 设计评审实例键 `resolved.run.batchDoc`；身份定可写段：eng-designer→§2 · 设计评审→§3 · eng-coder→§5）；append-only；写前剥凭证（自有正则）；工具盖 `### 轮次 N（评审子代理）` 戳（**仅 §3**，调用方同名标题被丢弃）；fail-closed 逐条 throw。权威 = `ENGINEERING-MODE.md` §2.20（挂载面 §2.20.3）。

## 8. MCP

MCP 工具**动态展开**为独立原生工具（`{server}_{tool}` 前缀、完整 inputSchema、execute→tools/call），并入 builtinTools 走统一 schema；网关式 `mcp` 工具已废弃。机制权威 = **MCP.md**。

## 9. 关键设计决策

- **md 文件即 description**：长描述模型才理解边界；代码/描述分离便于迭代不触发 schema 变更。
- **bash 命令零文本拦截** = "安全剧场"论证：文本匹配拦不住恶意模型（空白/heredoc/node -e 绕过），只误伤正常操作；真实防线 = 审批层 + 快照；detectDanger 只给人看不构成边界。
- **超限落盘而非截断**：模型可再 read 全量，预览够决策。
- **工具全部字符串返回**：schema 简单、dispatch 统一、流式展示统一。
- （历史）"沙箱只出不进"：exec-prelude 退役后 execute 与 bash 同边界，文件能力唯一入口 = 工具授权。

## 10. 工具描述写作六要素

工具描述（md/内嵌）必含六要素，缺一补一：
1. **一句话语义**——能做什么/不能做什么；
2. **参数关系**——参数间约束；
3. **路由/反模式**——何时用别的工具（"Route to X instead of bash"）、何时不该用本工具；
4. **副作用与权限**——破坏性/外发/需确认标注；
5. **错误形态**——失败时返回什么、如何引导；
6. **多端一致**——CLI/VS Code 描述同语义（逐字锚走 review 流程）。

## 11. websearch 配置面——`provider` 死键处置（2026-09-11 第 36 批）

> 需求回指：`../requirements/TOOLS.md` §2 F6 / §3 N8；批次 = `2026-09-11-WEBSEARCH-PROVIDER-KEY.md` §1（A1）。
> 本批性质 = 配置面收口（删除面）——搜索语义与兜底链**零改**。

### 11.1 问题与现状（as-of 2026-09-11）

- 声明面：`DEFAULTS.websearch`（`src/config.mjs:103-106`）申报 `provider: "tavily"`——**全仓零读取点**（死键）：websearch 配置的唯一消费 = `src/tools/web.mjs:49` 读 `apiKey`。
- 现状后端链（本批不动）：有 `apiKey` → Tavily（`web.mjs:48-68`）；无 key / Tavily 失败 → Bing RSS/HTML 兜底（`web.mjs:12-42` 抽取 · `:70-84` 抓取 · `:109-119` 编排）。
- 播种面（VSC 仓）：面板保存 key 时把 `provider: "tavily"` **写回用户 config.json**（`thincoder-vscode` `src/extension/settings.mjs` 写点）；另三处（`:119` / `:221` / `:243`）兜底字面量同携该键（`thincoder-vscode` `src/agent/setup.mjs`）——死键还会被产品主动播种。
- 兼容面：CLI 无写入点；磁盘遗留值零消费（不校验、不剥离、不报错）。

### 11.2 方案选型对比（候选 3——判据逐项）

> 判据（批次 §1 给定）：① 与 Gitee #IKEI3M（DeepSeek 搜索端点——待外部证据）未来面的衔接；② 用户配置兼容；③ D2 单一权威源；④ 成本与双端一致性风险。

| # | 候选方案 | 判据逐项评估 | 取舍（选定代价/权衡） | 结论 |
|---|---|---|---|---|
| 1 | 接线为后端选择（枚举 tavily / bing + 分发 + 校验） | ① 为未来枚举预置骨架——但端点 / 鉴权形态未知（阻塞待外部）= 形状靠猜；默认值已被 VSC 面板播种进存量配置，未来多后端偏好语义有 legacy 钉死风险。② 手工设过非默认值的配置从"静默无效"变"生效"= 行为变更面。③ 选择键语义须在 DEFAULTS 注释 / README / 设计档 / 双端代码多处重述，且与 apiKey 回退规则叠加（provider=tavily 无 key 仍回 Bing——选择键不选择）。④ 分发点 + 校验面 + 新用例 + VSC 语义镜像——成本与双端漂移面最大；且触碰"不改搜索语义"边界 | 收益（强制 Bing 开关 + 未定形状的骨架）与成本不匹配 | **否决** |
| 2 | 移除死键（声明 + 文档 + 两端写入面） | ① 不预置未知形状——`provider` 名保留为未来干净槽位（未来枚举含 tavily 时历史值天然合法）。② 零行为变更（无读取点删除；遗留值照旧被忽略）。③ 删除申报面无新语义——后端规则继续由 README apiKey 注释单处承载。④ 删 1 行 + 文档同步 + VSC 面清理 + 新测试档——不触碰搜索语义 / 兜底链（边界天然满足） | 未来批若需选择面 → 以完整信息另设计（成本后移，非消失） | **选定** |
| 3 | 保留现状（登记债） | ① / ② 接口与行为零改。③ 申报即死键持续存在——配置面继续说谎。④ 零成本 | 与"issue都别留着"（用户 2026-09-11 13:52）及 N8 直接冲突；VSC 面板继续把死键写入用户配置（放大面） | **否决** |

### 11.3 处置设计（选定 = 候选 2）——接口与数据流

- **申报面**：`DEFAULTS.websearch = { apiKey: "" }`（`src/config.mjs`）——唯一申报键 = `apiKey`。
- **读取面（单点，不变）**：`config.websearch.apiKey` → `agent.config`（`make-agent` 装配）→ `web.mjs:49` 触发 Tavily；无 key / 失败 → Bing 兜底。**`web.mjs` 本批零改**。
- **遗留值语义**：磁盘 `websearch.provider` 原样保留（零读取 / 零校验 / 零写回）；`settings` 工具类型表自动派生自 DEFAULTS（`settings.mjs:58`）——键移除即脱表 = 未知键原样语义（既有通用行为，零特判）。

**逐面改动（完整修复路径）**：

| 面 | 文件（as-of 行） | 改动 |
|---|---|---|
| CLI 声明 | `src/config.mjs:104` | 删 `provider: "tavily"` 行；"empty apiKey → Bing 兜底"语义注并到 `apiKey` 行 |
| CLI 文档 | `README.md:159` | 配置模板删 `"provider": "tavily",` 行（两条注释已准确——保留） |
| CLI 测试 | `test/websearch-config.test.mjs`（新建） | 见 §11.7 |
| VSC 写面 | `thincoder-vscode` `src/extension/settings.mjs:140` | 删 `ws.provider = "tavily"` 写点（停播种——防产品继续写死键） |
| VSC 读面 | 同档 `:131-134` | 快照 `{ provider, hasKey }` → `{ hasKey }`（webview 零渲染该字段——实证 `webview/settings-tools.js`） |
| VSC 兜底 | `thincoder-vscode` `src/agent/setup.mjs:119` / `:221` / `:243` | 兜底字面量去 `provider`（3 处字面量） |
| VSC 测试 | `thincoder-vscode` `test/agent-lifecycle-singleton.test.mjs:45` | 夹具同步（去 provider） |

**目标形态（语义锚——措辞可微调，语义不可变）**：

```js
websearch: {
  // Structured search via Tavily when a key is set — empty apiKey → Bing RSS/HTML fallback (zero-config).
  apiKey: "",          // Tavily key (tvly-...) — optional
},
```

### 11.4 受影响文件清单（当前行数 + 预计增量）

| # | 文件 | 现行数 | 改动 | 预计增量 |
|---|---|---|---|---|
| 1 | `src/config.mjs` | 487 | DEFAULTS.websearch 删 provider 行 + 注释合并 | −1 行 |
| 2 | `README.md` | 472 | 配置模板删 provider 行 | −1 行 |
| 3 | `test/websearch-config.test.mjs` | 新建 | T1–T8（§11.7） | ~+80 行 |
| 4 | `docs/requirements/TOOLS.md` | 40（批次前） | F6 / N8 / §4 / 变更记录（已落——本批 designer） | +7 行（实测 47） |
| 5 | `docs/design/TOOLS.md` | 126（批次前） | §11 + 变更记录（已落——本批 designer） | +121 行（修正轮后实测 247） |
| 6 | `thincoder-vscode/src/extension/settings.mjs` | 350 | 写面删 1 行；读面快照去字段 | −2 行 |
| 7 | `thincoder-vscode/src/agent/setup.mjs` | 463 | 兜底字面量去 provider（3 处：`:119` / `:221` / `:243`） | ±3 行 |
| 8 | `thincoder-vscode/test/agent-lifecycle-singleton.test.mjs` | 431 | 夹具同步 | ±1 行 |

> 1–5 = CLI 面（本批）；6–8 = VSC 镜像面——**纳入本批（已裁，2026-09-11）**，清单已列全。父侧维护面（不进 coder files 域）：`CHANGELOG.md` 注记 · `docs/TODO.md`（如需索引行）。`src/config.mjs` 487 行（近 500 硬限）——本批方向 −1 行（安全）。

### 11.5 关键决策记录

- **D-1 选型 = 移除**（对比见 §11.2）：死键无消费方、零行为变更、D2 负担最小。
- **D-2 不做遗留值剥离 / 迁移 / 写回**：剥离需动 `loadConfig` 启动路径，收益仅"内存洁癖"；未来若复用 `provider` 名，历史值处理归那批设计（本记录在案）。
- **D-3 不加校验 / 特判**：`settings` 未知键原样 = 既有通用语义；不为单键引入特判（防"半接线"态）。
- **D-4 VSC 面同批收口（已裁：纳入本批，2026-09-11）**：CLI 删、VSC 继续播种 = 死键持续被产品写入（假收口）——裁定同批收口。
- **D-5 未来衔接（IKEI3M）**：DeepSeek 端点批以完整信息设计选择面（届时若需要）；`provider` 名为干净槽位。
- **D-6 工具描述文本零改**：`src/tools/websearch.md` / `fetch.md` 与本键无耦合；既有 "Search the web via Bing" 与 Tavily 触发的张力 = 登记观察项（不属本批）。
- **UI/交互决策**：无（config 键处置）；VSC 面板显示面零改（provider 从未渲染）· CLI TUI 无 websearch provider 入口（`cmd-config` 仅代理开关）——全落档于本节，无 open 项。

### 11.6 验收标准（逐条回指需求）

| # | 验收标准（机验） | 回指 |
|---|---|---|
| AC-1 | `DEFAULTS.websearch` 键集 == `{ apiKey }`（deepEqual） | F6 |
| AC-2 | `src/**/*.mjs` 扫描 0 命中（形态枚举 = §11.7 注——权威单源）∧ `web.mjs` 含唯一配置读取 `config?.websearch?.apiKey`（逐字） | F6 |
| AC-3 | README 配置模板无 `"provider": "tavily"` ∧ websearch 段在（含 apiKey） | N8 |
| AC-4 | 遗留配置 `{websearch:{provider:"tavily",apiKey:"k"}}` → `loadConfig()` 不抛 ∧ apiKey 原样；`_buildShapeTable(DEFAULTS)["websearch.provider"] === undefined` | N8 |
| AC-5 | 反证：扫描器对探针必命中（零假阴性）∧ 合法样本零误报 | F6 |
| AC-6 | 快层全量零新增失败；`node scripts/check-doc-width.mjs` 两仓新增 0；doc-consistency V1/V2/V3 新增 0 | 批次边界 |
| AC-7 | （VSC 面）保存 key 后磁盘 websearch 段无 provider · 读面快照无该字段 · VSC 测试绿。载体：磁盘/快照子句 = 代码走查（写点/快照点）+ 残留清扫产出（§11.7 注）；测试绿 = `cd thincoder-vscode && npm test` | N8 |

### 11.7 用例表（正常 / 边界 / 错误——输入 / 预期输出）

| # | 类型 | 场景 | 输入 | 预期输出 | 回指 |
|---|---|---|---|---|---|
| T1 | 正常 | 申报面收口 | `import { DEFAULTS }` | `websearch` deepEqual `{ apiKey: "" }` | AC-1 |
| T2 | 边界 | 遗留键兼容（零读取——行为等价） | tmp config ×2（缝 = `_setConfigPathForTest`）：A = `{websearch:{provider:"tavily",apiKey:"tvly-x"}}` · B = `{websearch:{apiKey:"tvly-x"}}` → 各 `loadConfig()` | 均不抛；`apiKey === "tvly-x"` 原样；A 段去 `provider` 后与 B 段 deepEqual（「行为与未设置一致」机验——D-2 保留语义下整段 deepEqual 不成立，故取去键等值 + 消费位等值） | AC-4 |
| T3 | 边界 | 读取面扫描 | 遍历 `src/**/*.mjs` 逐行（扫描器 = §11.7 注枚举） | 0 命中 | AC-2 |
| T4 | 边界 | 触发面单点 | `src/tools/web.mjs` 文本 | 含 `config?.websearch?.apiKey` | AC-2 |
| T5 | 边界 | 键表脱表 | `_buildShapeTable(DEFAULTS)`——符号面**已核**：导出 `src/agent-tools/settings.mjs:265` · 纯派生 `:54-58` · 测试同款 `test/settings.test.mjs:19` | `websearch.provider` 未定义 | AC-4 |
| T6 | 正常 | 文档面 | `README.md` 文本 | 无 `"provider": "tavily"`；websearch 段在且含 `apiKey`（与 AC-3 逐字对齐） | AC-3 |
| T7 | 错误（反证） | 扫描器非空转 | 探针串 = §11.7 注枚举 4 形态各一（点访问 / 括号 / 解构 / 单行申报） | 全部命中 | AC-5 |
| T8 | 错误（反证负例） | 合法文本不误报 | `websearch?.apiKey` 读取行 · proxy.mjs "websearch, fetch, and provider calls" 注释行 | 0 命中 | AC-5 |

> **注（扫描枚举——权威单源）**：AC-2 / T3 / T7 引用本枚举。扫描域 = `src/**/*.mjs` 逐行文本；命中判据 = 「`websearch` 与 `provider` 的**语法关系**」同现（非邻近词出现——T8 注释负例约束）。形态 4：
> ① **点访问** `websearch.provider` / `websearch?.provider`；② **括号访问** `websearch["provider"]` / `websearch['provider']`（引号键名 ⊂ 本形态）；③ **解构读取** `const { provider } = …websearch`（同行）；④ **单行申报** `websearch: { … provider … }`（单行对象字面量内 `provider` 键——声明位仅此单行形态）。
> 不覆盖（明确排除）：跨行对象块内裸 `provider:` 声明行（申报面完备性由 AC-1 deepEqual 承担）；变量别名间接读取（`const ws = …websearch; ws.provider`——regex 扫描器边界，登记不追）；非 websearch 上下文 `provider`（模型渠道域）。
>
> **注（残留清扫——完备性证据）**：实施收口时两仓（`thincoder/src` + `thincoder-vscode/src`）与文档面（含 `docs/`）各做一次配置域 provider 残留清扫（不限精确串——注释/散文提及一并读出），产出（命中清单或 0 命中声明）并入验收记录（§5）——覆盖精确串两查（AC-3 / T3）的逃逸面。

> 网络行为面（无 key 走 Bing / Tavily 失败回退）无网络测试面——既有行为零改：T4 逐字锁触发面 + §11.8 边界覆盖。

### 11.8 边界（不做）

- 不做 provider 枚举 / 分发 / 校验（候选 1 已否决）；`src/tools/web.mjs` 本批零改——搜索语义与兜底链不动。
- 不做 DeepSeek 搜索端点（Gitee #IKEI3M 主体——待外部证据，不属本批）。
- 不做遗留值剥离 / 迁移 / 写回（`loadConfig` 零改）。
- 不做 `settings` 键特判（未知键原样 = 通用语义）。
- 不改工具描述文本 / 提示词；不改 VSC 面板文案与 UI（"Tavily API Key" 与帮助句仍准确）。
- 不新建文档档（新测试档为测试文件，非文档）。

## 变更记录

- 2026-09-11：新增 §11——`websearch.provider` 死键移除（第 36 批；需求 `../requirements/TOOLS.md` §2 F6 / §3 N8；批次 `2026-09-11-WEBSEARCH-PROVIDER-KEY.md` §2）。
- 2026-09-11：§11 修正轮（评审轮次 1 后）——扫描枚举单源（§11.7 注）· T2 行为等价机验 · T5 符号面核实 · AC-7 载体注 · VSC 面裁定回写 · 播种点回填（`:221`）。
