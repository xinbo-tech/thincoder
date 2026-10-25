# UAT 验收总表（RTM）

> 仓内一份，按端分节（H2 = 端节、节内 H3 = 业务故事）；编号以端节为域、各端自 1-1 起。
> 一节 = 一个业务故事、一节一表、一行 = 一个集成用例（8 列，列定义 = docs/core/design/TESTING.md §11.3）。
> 单元测试档不进本表（内部回路、用毕即删）；本表只登记仓根 `test/integration/**` 的集成用例。

## CLI 端（thincoder-cli）

### 1. 对话里用工具，结果必须回到模型

> 目的：工具结果原样回到模型，对话能接着走。
> 节注：回指 = docs/core/requirements/PROVIDER.md §4.9（R33 工具历史回放）；三态（行序）= 1-1 正常 · 1-2 边界 · 1-3 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 1-1 | 在 CLI 里让助手调用一次工具，然后继续同一段对话 | 会话流里有这次调用与它的结果，助手回复引用了结果，没有 400 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/anthropic-tool-roundtrip.test.mjs` |
| 1-2 | 同一轮里让助手连续调用两个工具，再继续对话 | 两个结果都回到模型，回复正常，没有 400 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/anthropic-tool-roundtrip.test.mjs` |
| 1-3 | 关掉进程，重开同一会话，历史回放后继续对话 | 回复引用了上一程的工具结果，没有 400 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/anthropic-tool-roundtrip.test.mjs` |

### 2. 未立项就写产品码：提醒一次，之后不再打断

> 目的：提醒只在首次出现，写文档不消耗它。
> 节注：回指 = docs/core/requirements/LIGHT-CHANNEL.md §2.6（F-LC6）；三态（行序）= 2-1 正常 · 2-2 边界 · 2-3 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 2-1 | 主 agent 首次写产品源文件 | 该笔回执以一行 [pen check] 结尾、只出现一次、含两处键句；文件确实写入 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/unbooked-pen.test.mjs` |
| 2-2 | 同一会话紧接着再写一个产品源文件 | 第二笔回执没有任何 [pen check] 行 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/unbooked-pen.test.mjs` |
| 2-3 | 另一个会话先写文档，再写产品源文件 | 写文档那笔零提示、不消耗提醒；随后写产品码仍有提醒 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/unbooked-pen.test.mjs` |

### 3. 网页抓取的后端故障不外溢

> 目的：单个后端故障不影响其它通路，无渠道时零变化。
> 节注：回指 = docs/core/requirements/TOOLS.md 条目 W3 ∥ W4 ∥ NW1；三态（行序）= 3-1 错误 · 3-2 错误 · 3-3 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 3-1 | 让 fetch 收到 404 后，在同一会话里再搜一次 | 404 不熔断，搜索仍然打到 DeepSeek | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/web-backend-404.test.mjs` |
| 3-2 | 让后端返回 401 | 只停该后端：fetch 回落到本地直取并成功，随后 websearch 零上游命中且正常结算 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/web-backend-404.test.mjs` |
| 3-3 | 在没有 DeepSeek 渠道的配置下跑一次 | 回执逐字不变、零 (deepseek …) 提示行、替身零命中 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/web-backend-404.test.mjs` |

### 4. 浏览器起不来的等待窗口可调

> 目的：默认 25s、可调，失败后会话仍可用。
> 节注：回指 = docs/core/requirements/BROWSER-TOOL.md 条目 F-BT16b；三态（行序）= 4-1 正常 · 4-2 正常 · 4-3 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 4-1 | 设 `BROWSER_START_TIMEOUT_MS=2000` 后启动浏览器 | 失败句含 within 2s，失败后会话仍可用 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/browser-start-window.test.mjs` |
| 4-2 | 不设该变量启动浏览器 | 失败句含 within 25s（默认窗口），不再出现 12s 时代的句子 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/browser-start-window.test.mjs` |
| 4-3 | 真机上首个动作是 navigate | 自启段不吃动作预算；宿主无 Chromium 则该例 skip 并打印 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/browser-start-window.test.mjs` |

★ 4-3：该例仅在宿主有 Chromium 时实跑，无则 skip——skip 不算验过（skip 也计入 tests 数，不据「15/15 绿」推定）；在有效宿主上实跑为 ✔ ⇒ 改 `通过` 并改执行日期。

### 5. 顾问评审超时改了马上生效

> 目的：超时可热改、可清除、非法值被拒。
> 节注：回指 = docs/core/requirements/AGENT-PARAMS.md 条目 F-AP1 ∥ F-AP2；三态（行序）= 5-1 正常 · 5-2 边界 · 5-3 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 5-1 | `settings set` 把超时改成 3000，再跑下一次评审 | 下一次评审按 3s 结束并带回超时尾 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/advisor-timeout-hot.test.mjs` |
| 5-2 | 把超时删掉（设为 null），再跑同一评审 | 评审跑完（约 5s 流），无超时尾 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/advisor-timeout-hot.test.mjs` |
| 5-3 | 给超时写入非法值 abc | 被拒，回执点名该键与可消费形态；配置面读回不变 | 通过 | 2026-10-24 | 主 agent（自动化执行） | 无 | `test/integration/advisor-timeout-hot.test.mjs` |

### 6. 设计评审的文档范围按项目根受理

> 目的：仓内文档都能被设计评审读到，写错的路径当场说清怎么写。
> 节注：回指 = docs/core/requirements/ADVISOR-CONVERGENCE.md §2.3 条目 F18（判据 = docs/core/design/ADVISOR-GUARDS.md §12——A-AG19 ∥ A-AG20）；三态（行序）= 6-1 正常 · 6-2 错误 · 6-3 错误 · 6-4 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 6-1 | 会话锚在项目内（cwd = 项目根或其子目录）时发起设计评审，`documents` 传一份非 `docRoot` 树下的仓内文档（项目根相对形，如 `thincoder-core/tool-docs/advisor.md`） | 工具层受理（回执不是 `scope-not-doc` 拒发；异步 ack 或评审输出正常），评审读得到该文档 | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |
| 6-2 | 同一入口，`documents` 传项目内的代码文件（如 `thincoder-core/agent-tools/advisor.mjs`） | 当场拒发：文案含 `criterion=scope-not-doc`、解析后路径、期望形两句；零评审实例、零 token、零 LLM | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |
| 6-3 | `documents` 传绝对路径指到项目外（容器下无项目归属的 `.md`） | 当场拒发：`criterion=scope-not-doc` + `outside-project` 拒因 + 期望形；零评审实例 | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |
| 6-4 | 会话锚 = 工作区根（下辖两项目、根无 `PROJECT-MANIFEST.json`），`documents` 传项目根相对的 `.md` | 当场拒发：`criterion=scope-not-doc` + 拒因 `no-project-root`，文案报锚态与期望形（项目根相对例 / 绝对路径）；零评审实例、零 token | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |

### 7. 收口只判本批改过的档

> 目的：收口门判的只是本批笔域集——范围外的脏档不拦收口，也不进回执。
> 节注：回指 = docs/core/requirements/DOC-CHECK.md F9 ∥ AC-7（AC-2 为其范围面）；三态（行序）= 7-1 正常 · 7-2 边界 · 7-3 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 7-1 | 在夹具项目里跑一次 `batch` 收口，本批笔域集内各档零命中 | 收口放行，回执含 `[doc-check gate] DOC-CHECK GATE: PASS` 行（verdict 为 gate 段首行；close 回执首行 = 状态句），范围行档数 = 笔域集档数 | **PASS** | 2026-10-25 | 父侧亲跑 | — | `test/integration/batch-close-gate.test.mjs` |
| 7-2 | 同一夹具，工作树里放一档范围外的档且含悬空指针，再收口 | 该档不入判、收口放行、回执零该档行（连档名都不出现） | **PASS** | 2026-10-25 | 父侧亲跑 | — | `test/integration/batch-close-gate.test.mjs` |
| 7-3 | 同一夹具，本批笔域集内一档含悬空指针，再收口 | 收口被拒（throw），§1 状态行字节不变 | **PASS** | 2026-10-25 | 父侧亲跑 | — | `test/integration/batch-close-gate.test.mjs` |

## VS Code 端（thincoder-vscode）

**尚无集成用例**——本端集成层尚未建立；故事节随首个用例设立（编号先行：先定 RTM 编号，再落用例标题 `test('<编号> …')`）。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|

## Desktop 端（thincoder-desktop）

**尚无集成用例**——本端集成层尚未建立；故事节随首个用例设立（编号先行：先定 RTM 编号，再落用例标题 `test('<编号> …')`）。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|

## 异常与更正

> 签后唯一可写面（docs/core/design/TESTING.md §11.5）：更正 = 新增一行，不改既有行。现无异常记录。

| 异常编号 | 说明 | 严重程度 | 纠正日期 | 纠正者 | 再测结果 |
|---|---|---|---|---|---|

## 签署面

| 项 | 内容 |
|---|---|
| 产品标识 | CLI 端（thincoder-cli）· VS Code 端（thincoder-vscode）· Desktop 端（thincoder-desktop）· 版本 = 交付时填 · 变体 = — · 日期 = 交付时填 |
| 结论声明 | 上述业务故事及其全部用例均已验收通过。 |
| 验收方 | 单位：______ · 姓名：______ · 职务：______ · 签字：______ · 日期：______ |
| 供方 | 单位：______ · 姓名：______ · 职务：______ · 签字：______ · 日期：______ |
| 页脚 | 报告标识 = CLI ∥ VS Code ∥ Desktop · 签署日期 · 页码 __ / __ |
