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

> **已退役（2026-10-27）**：本故事的三行由故事 12 接替——裁定 ⑤（无活批档不许改产品代码）之后，未立项写产品码**被拒**，原故事「提醒一次、之后不再打断」的前提不再成立（判据 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 决策 8）。

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
> 节注：回指 = docs/core/requirements/ADVISOR-CONVERGENCE.md §2.3 条目 F18（判据 = docs/core/design/ADVISOR-GUARDS.md §12——A-AG19 ∥ A-AG20）；三态（行序）= 6-1 正常 · 6-2 错误 · 6-3 错误 · 6-4 错误 · 6-5 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 6-1 | 会话锚在项目内（cwd = 项目根或其子目录）时发起设计评审，`documents` 传一份非 `docRoot` 树下的仓内文档（项目根相对形，如 `thincoder-core/tool-docs/advisor.md`） | 工具层受理（回执不是 `scope-not-doc` 拒发；异步 ack 或评审输出正常），评审读得到该文档 | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |
| 6-2 | 同一入口，`documents` 传项目内的代码文件（如 `thincoder-core/agent-tools/advisor.mjs`） | 当场拒发：文案含 `criterion=scope-not-doc`、解析后路径、期望形两句；零评审实例、零 token、零 LLM | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |
| 6-3 | `documents` 传绝对路径指到项目外（工作区下无项目归属的 `.md`） | 当场拒发：`criterion=scope-not-doc` + `outside-project` 拒因 + 期望形；零评审实例 | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |
| 6-4 | 会话锚 = 工作区根（下辖两项目、根无 `PROJECT-MANIFEST.json`），`documents` 传项目根相对的 `.md` | 当场拒发：`criterion=scope-not-doc` + 拒因 `no-project-root`，文案报锚态与期望形（项目根相对例 / 绝对路径）；零评审实例、零 token | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |
| 6-5 | 会话锚 = 非项目目录（根无 `PROJECT-MANIFEST.json`、下辖 1 个项目），`documents` 传项目根相对的 `.md` | 当场拒发：`criterion=scope-not-doc` + 拒因 `no-project-root`，不把唯一下辖项目当根；文案报期望形（项目根相对例 / 绝对路径）；零评审实例、零 token | 待执行 | — | — | — | `test/integration/review-doc-scope.test.mjs` |

### 7. 收口只判本批改过的档

> 目的：收口门判的只是本批笔域集（含本批批档自身）——范围外的脏档不拦收口，也不进回执；两条判据不分适用面，工具描述面同样受段长约束。另有一道与本门并行的前置：**本批改面单测档仍在盘 ⇒ 拒收口**（单测零留存，判据见行 7-4）——这一道判的是「该删的删了没」，与本门判的「改过的档干净不干净」是两件事。
> 节注：回指 = docs/core/requirements/DOC-CHECK.md F9 ∥ AC-7（AC-2 为其范围面）∥ docs/core/design/TESTING.md §3.5（行 7-4 的判据）；机制单源 = docs/core/design/DOC-DISCIPLINE.md §3.20「结构兜底」；交互组件 = `batch` 工具（append ∥ edit ∥ close）⟷ `runBatchGate`（范围 + 强制集）⟷ `doc-check` 引擎（锚 ∥ 段判据）；进入口 = 真 `batch` 工具调用（收口 = depth-0 ∥ 写段 = 子代理 append ∥ §2 改写 = 设计席 `edit`，写完的 §2 段体作 `pending` 进机检门；不直调 `runBatchGate`）；十态（行序）= 7-1 正常 · 7-2 边界 · 7-3 错误 · 7-4 错误（本批单测档仍在盘）· 7-5 边界（段判据的围栏语义——嵌套围栏不入段；缺口来源与回指见该行）· 7-6 错误（收口面命中批档自身）· 7-7 正常（收口面含批档自身且放行）· 7-8 错误（写段面命中本次写入文本）· 7-9 错误（工具描述面：锚与段两条同时拦）· 7-10 正常（§2 就地改：目标行换掉、其余行逐字节不变；锚不唯一 ⇒ 拒）。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 7-1 | 在夹具项目里跑一次 `batch` 收口，本批笔域集内各档零命中 | 收口放行，回执含 `[doc-check gate] DOC-CHECK GATE: PASS` 行（verdict 为 gate 段首行；close 回执首行 = 状态句），范围行档数 = 笔域集档数 | **PASS** | 2026-10-25 | 父侧亲跑 | — | `test/integration/batch-close-gate.test.mjs` |
| 7-2 | 同一夹具，工作树里放一档范围外的档且含悬空指针，再收口 | 该档不入判、收口放行、回执零该档行（连档名都不出现） | **PASS** | 2026-10-25 | 父侧亲跑 | — | `test/integration/batch-close-gate.test.mjs` |
| 7-3 | 同一夹具，本批笔域集内一档含悬空指针，再收口 | 收口被拒（throw），§1 状态行字节不变 | **PASS** | 2026-10-25 | 父侧亲跑 | — | `test/integration/batch-close-gate.test.mjs` |
| 7-4 | 同一夹具，收口前在批档同目录放本批自己的单元测试档 `<批档名>.test.mjs`（另备前缀变体 `<批档名>-extra.test.mjs`，盘上无 `<批档名>-extra.md`），再收口 | 收口被拒（throw）：拒串点名该档绝对路径 + 修法（删）；§1 状态行字节不变；删档后同跑收口放行 | 待执行 | — | — | — | `test/integration/batch-close-gate.test.mjs` |
| 7-5 | 夹具项目里放一档**嵌套围栏档**（外层四反引号包内层三反引号、内层代码合计 &gt;300 字）与一档同长度**无围栏正文**档，两者均入本批笔域集，跑一次 `batch` 收口 | 嵌套围栏档 0 命中（其内代码不入段）· 收口放行；对照档命中 1 条（`clazz` = 文字太长）· 收口被拒——两半都成立才算过 | 待执行 | — | — | 缺口来源 = 2026-10-27 围栏闭合判定缺陷（批档 `docs/batches/2026-10-27-fence-paragraph-gate.md`）；回指 = `docs/core/requirements/DOC-CHECK.md` F9 ∥ AC-7 · `docs/core/design/DOC-DISCIPLINE.md` §3.18「围栏行止」· §5 A-DD27 | — |
| 7-6 | 夹具批档 §1 含裸档名（要求档写成了不带目录段的名字），跑一次 `batch close` | 收口被拒（throw）：拒串首行 `DOC-CHECK GATE: REFUSED`、命中行带 `§1（作者：主 agent）`；§1 状态行字节不变 | 待执行 | — | — | 回指 = `docs/core/requirements/DOC-CHECK.md` F9 ∥ AC-7 ②（收口面含批档自身）；判据 = `docs/core/design/DOC-DISCIPLINE.md` §5 A-DD31 ③；用例号 = DD-129 | `test/integration/batch-close-gate.test.mjs` |
| 7-7 | 同一夹具，批档干净、笔域集各档干净，跑一次 `batch close` | 收口放行；回执 `[doc-check gate] DOC-CHECK GATE: PASS · 范围 N 档`，N = 实判档数且 ≥ 1（批档自身在内） | 待执行 | — | — | 回指 = `docs/core/requirements/DOC-CHECK.md` F9 ∥ AC-7 ②；判据 = `docs/core/design/DOC-DISCIPLINE.md` §5 A-DD31 ④（判域恒非空）；用例号 = DD-135 | `test/integration/batch-close-gate.test.mjs` |
| 7-8 | 子代理 append §2，本次写入文本把要求档写成不带目录段的名字；随后改成全路径再 append 一次 | 第一次被拒：命中行点名 `本次写入文本`，批档字节逐字不变（零字节落盘）；第二次落盘，前文零变 | 待执行 | — | — | 回指 = `docs/core/requirements/DOC-CHECK.md` F9 ∥ AC-7 ①（写段面强制集 = 本次写入文本）；判据 = `docs/core/design/DOC-DISCIPLINE.md` §5 A-DD31 ⑥；用例号 = DD-130 | `test/integration/batch-close-gate.test.mjs` |
| 7-9 | 夹具项目里放一档 `thincoder-core/tool-docs/x.md`（内含一段 400 字符 + 一个解析不到的裸档名），入本批笔域集，跑一次 `batch close` | 收口被拒（throw）且拒因**锚与段两条同时点名**（命中行分别指向该裸档名 ∥ 该 400 字符段）；只删裸档名后同跑仍拒（段那条）；拆成两段后放行 | 待执行 | — | — | 回指 = `docs/core/requirements/DOC-CHECK.md` F3「判据不分适用面」· 判据 = `docs/core/design/DOC-DISCIPLINE.md` §3.18 条 7 ∥ §5 A-DD35 判据 ①；缺口来源 = 台账 `#1847`（改工具描述档一句文案，写段与收口被段判据拦下）；用例号 = DD-137 ∥ DD-138 | `test/integration/batch-close-gate.test.mjs` |
| 7-10 | 工程模式设计席对一本在飞批档的 §2 作一次更正（把一行已作废的判据就地换掉）：`batch({action:"edit", segment:"§2", oldText, newText})`；随后同一句在 §2 出现两处时再改一次 | 第一次：回执点名替换字符数、机检门 `PASS`；**§2 那一行被换掉、其余行逐字节不变**（行数不变、旧行不残留——不留「以本节为准」指针）。第二次：拒（锚不唯一 + 点名命中行号），档字节一字不动 | 待执行 | — | — | 回指 = `docs/core/design/BATCH-RECORD.md` §4.19 ∥ §4.8 BR-77 · BR-78 ∥ 台账 `#1990` ∥ 批次档 §1「已定决定（批档内两种东西、两种处置）」；本行起因 = `docs/batches/2026-11-02-review-requires-batch.md` §2 验收表留着已作废判据，实施席照表落笔会把已删的分支写回来 | `test/integration/batch-edit-spec-section.test.mjs` |

### 8. 批次档建在项目里（工作区锚报明、不落锚目录）

> 目的：会话锚是多根工作区（自身无档、下辖有项目）时，建批次档要报明项目并给路，不静默落到锚目录。
> 节注：回指 = docs/core/design/BATCH-RECORD.md §4.15 条 5（判据 = docs/core/design/LEDGER.md §3.8「多根工作区锚（batch 面）」）；三态（行序）= 8-1 错误 · 8-2 正常。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 8-1 | 夹具目录（根无 `PROJECT-MANIFEST.json`、下辖 1 个带档项目），以该目录为会话锚调 `batch` create（`path` = `docs/batches/<x>.md`） | 当场拒（throw）：文案含 `belongs to no project` + 该唯一项目绝对路径 + 显式路径指引；锚目录下零 `docs/batches` 新建、零档 | 待执行 | — | — | — | `test/integration/batch-anchor-create.test.mjs` |
| 8-2 | 同一夹具，以该目录为会话锚调 `batch` create（`path` = `<下辖项目>/docs/batches/<x>.md`——目标所属 ∈ 下辖集） | 正常路径不误报：档落该项目声明基底，回执路径 = 该项目内绝对路径；锚目录下零 `docs/batches` 新建 | 待执行 | — | — | — | `test/integration/batch-anchor-create.test.mjs` |

### 9. 项目根解析：工作区锚不就地建档

> 目的：会话锚是多根工作区（自身无档、下辖有项目）时，建档流当场报明项目并给路，不在用户目录里凭空生成 `PROJECT-MANIFEST.json`。
> 节注：回指 = docs/core/design/MANIFEST.md AC-22 ∥ AC-27 ∥ T51（判据 = docs/core/design/LEDGER.md §3.8「多根工作区锚（batch 面）」）；三态（行序）= 9-1 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 9-1 | 夹具目录（根无 `PROJECT-MANIFEST.json`、下辖 1 个裸仓——`.git` 无档）为会话锚，直调 `manifest` 工具 `init`（`target` = 该目录） | 当场拒（抛，前缀 `manifest init: refused`）：文案含 `workspace` 态 + 下辖候选全列 + 显式 `target` 指引；**零建档**——锚目录下零 `PROJECT-MANIFEST.json` 新建、裸仓档零变 | 待执行 | — | — | — | `test/integration/manifest-workspace-init.test.mjs` |

### 10. 收口即清账（批档收口即消费该批设计凭证）

> 目的：收口成功即该批凭证不再放行写产品码；收口被拒即凭证仍活、状态行未变。
> 节注：回指 = docs/core/requirements/DESIGN-TOKEN-SETTLEMENT.md F-D7 ∥ F-D8（机制 = docs/core/design/DESIGN-TOKEN-SETTLEMENT.md §10）；交互组件 = `batch-lifecycle.mjs` 收口通路 ↔ `design-slots.mjs` 消费核 ↔ 槽文件 I/O；进入口 = 父侧经 `batch` 工具收口（工程模式）；三态（行序）= 10-1 正常 · 10-2 错误 · 10-4 正常。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 10-1 | 工程模式夹具里，让一次设计评审以 `batchDoc` 带上批档（签发一个槽；夹具须让该评审把 §3 写进批档——轮次块 + 状态行 = `评审通过`，否则 §3 落地门挡住签发、本行断言不可达），再调 `batch close` 收该批 | close 回执含 `[design tokens]` 且点名消费 1 枚；随后同 designId 的 eng-coder spawn 被机械拒；`design-slots` 里该槽不在 | 待执行 | — | — | — | `test/integration/batch-close-token-consume.test.mjs` |
| 10-4 | 工程模式夹具里以 `batchDoc` 带批档跑一次设计评审（签发一个槽；夹具同上：该评审须把 §3 写进批档），再调 `subagent` `action:'design-slots'` | 该槽行 `batch=<批档 basename>`（不是 `—`）；其余列零变 | 待执行 | — | — | — | `test/integration/batch-close-token-consume.test.mjs` |
| 10-2 | 同一夹具，把 `persistEngTokens` 注入为抛错后再 close | close 被拒且回执点名消费失败；§1 状态行字节不变；槽仍在盘（内存已回滚） | 待执行 | — | — | — | `test/integration/batch-close-token-consume.test.mjs` |
| 10-3 | 工程模式夹具里造三行 `待核销`：a 行 `task_book` 指向「已收口 ∧ §3 = 评审通过」的批档（换会话核销，槽内无归属）；b 行指向「未收口」的批档；c 行指向「已收口但 §3 = 进行中」的批档。三行各跑一次 `thincoder ledger close --id <行>` | a 行核销成功（`status = 已核销`，`closed_at` 非空；槽内无归属也通过）；b / c 行被拒，回执分别点名缺 ② ∥ 缺 ③，且两行 `status` 仍 `待核销`、`closed_at` 仍空 | 待执行 | — | — | — | `test/integration/ledger-close-proof.test.mjs` |

### 11. 超窗守卫与内部阶段豁免（absent 档全档同判）

> 目的：越窗时要么先压一次再发，要么带三实数当场报错——不把同一条超限请求丢给服务端吃 400；压缩只在压完能落到线下时发生——不为一次没有净减的摘要白付请求，用户照常拿到答复。
> 节注：回指 = `docs/core/design/CONTEXT-COMPACTION.md` §6.2 ∥ §6.17；交互组件 = `thincoder-core/agent/run-stages.mjs`（守卫）· `thincoder-core/provider/{core,anthropic,google,responses}.mjs`（净判）· `thincoder-core/provider/errors.mjs`（400 分类）；需求回指 = `docs/core/requirements/CONTEXT-COMPACTION.md` §2.1（压缩线目标 60% ∥ 触发可达性门 ∥ F-CC2 主动压缩）∥ 台账 `#1833`；三态（行序）= 11-1 正常 · 11-2 错误 · 11-3 边界 · 11-4a 错误 · 11-4b 错误 · 11-5 边界 · 11-6 正常 · 11-7 边界 · 11-8 边界 · 11-9 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 11-1 | CLI 会话经 provider 桩跑到估算越线（显式压缩线 750,000 隔离阈值面），再发一条消息 | 压缩事件恰好 1（`mode:"summary"`）；压缩请求 1 · 回合请求 1；全 200 无 400；`max_tokens` 仍未发 | **PASS** | 2026-10-27 | 父侧亲跑 | — | `test/integration/context-overflow-guard.test.mjs` |
| 11-2 | 同上，摘要桩回超长摘要使压后仍越线 | 错误带 prompt / `max_tokens not sent` / 窗口三实数；强压请求恰 1 · 回合请求 0；无 400 | **PASS** | 2026-10-27 | 父侧亲跑 | — | `test/integration/context-overflow-guard.test.mjs` |
| 11-3 | `absent` 档（deepseek-flash 形状）两半段：越线 620,000 ∥ 未越线 100,000，另加退化档 `doubao-seed-2-1-turbo-260628` | 越线：强压 1 · 回合请求 1 · 零 400；未越线：零压缩 · 请求照发；退化档：零压缩 · 请求照发（地板不误伤） | **PASS** | 2026-10-27 | 父侧亲跑 | — | `test/integration/context-overflow-guard.test.mjs` |
| 11-4a | provider 桩首回合回 400 越窗报文，重试回合回 200 | 压缩事件恰 1（自适应压一次）· 压缩请求 1 · 回合请求 2（首 400 + 重试）· 用户拿到答复而非错误 | **PASS** | 2026-10-27 | 父侧亲跑 | — | `test/integration/context-overflow-guard.test.mjs` |
| 11-4b | 同一夹具，压缩后重试仍回 400 越窗（二次越窗） | typed 错误浮出（`kind = "context_overflow"` · `retryable === false`）· 压缩恰 1（不再压）· 回合请求恰 2（无第三次）· 不静默截断 | **PASS** | 2026-10-27 | 父侧亲跑 | — | `test/integration/context-overflow-guard.test.mjs` |
| 11-5 | 恢复带样本的会话（槽带 `estimateSample`：`num 723_272` / `den 491_000` ⇒ 比 ≈ 1.473；provider `maxTokens: 393_216` ⇒ `limit` 606,784），发一条消息 | 首请求估算支 ≈ 723,272 > `limit` ⇒ 触发压缩而非吃 400；业务可观察 = 重启后继续大会话不再 400 | 待执行 | — | — | 缺口来源 = 2026-10-27 上下文预算低估批；回指 = `docs/core/requirements/CONTEXT-COMPACTION.md` F-CC7 · `docs/core/design/CONTEXT-COMPACTION.md` §6.17.1 链二 | — |
| 11-6 | CLI 会话用 128,000 窗档（压缩线 76,800），provider 桩带巨型工具 schema 使 `system + tools` 估算 > 76,800、`history` 仅数条短消息（复刻 `#1833` 现场），发一条消息 | 压缩事件 0（`agent._lastCompressInfo` 未置位）· 摘要请求 0（`logCtx.stage === "compress"` 零发）· 回合请求 1 · 用户拿到答复 · 无 400 | 待执行 | — | — | 缺口来源 = 台账 `#1833`（压缩判据把固定开销算进被判定的一侧） | `test/integration/context-overflow-guard.test.mjs` |
| 11-7 | 同一档，`history` 堆出足量可摘中段，使 `history − middle + 注记 + 占位 + 开销` 的估算 ≤ 76,800，再发一条消息 | 压缩事件恰 1（`agent._lastCompressInfo.mode === "summary"`）· 摘要请求恰 1 · 回合请求恰 1 · 回复引用工具结果 | 待执行 | — | — | 同上 | `test/integration/context-overflow-guard.test.mjs` |
| 11-8 | CLI 会话里让模型主动调 `context{action:'compact'}`——用户说一句「压一下上下文」即进入该回合，且压后仍超压缩线 | 压缩仍执行恰 1——门只拦阈值面，`force` 全文豁免 | 待执行 | — | — | — | `test/integration/context-overflow-guard.test.mjs` |
| 11-9 | CLI 会话里粘一段超 `OVERSIZE_CONTENT_LIMIT` 的巨型日志发出去，且无中段可摘 | 走 `shrinkOversized`、体内出现截断标记；门不拦（零网络） | 待执行 | — | — | — | `test/integration/context-overflow-guard.test.mjs` |

### 12. 无活批档不许改产品代码

> 目的：产品代码面 / 产品测试面的写，必须有活批档（档 §1 = 进行中 ∧ 台帐行 = 在途 ∧ 指针回指本档）；文档面 / 工程工具面 / 构建产物照写。
> 节注：回指 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.2 ∥ §2.3 ∥ §2.10 ∥ §2.12；六态（行序）= 12-1 错误 · 12-2 正常 · 12-3 边界 · 12-4 错误 · 12-5 边界 · 12-6 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 12-1 | 工程模式父侧（有活设计槽、无活批档）用 `write` 写 `thincoder-core/agent/x.mjs` | 拒：拒文含 `write refused — no live batch record: a product-code write needs a live batch`；文件零改 | 待执行 | — | — | — | `test/integration/batch-live-batch-lock.test.mjs` |
| 12-2 | 同一会话写 docRoot 内 `.md` 与仓根 `scripts/*.mjs` | 照写；两档字节 = 写入内容 | 待执行 | — | — | — | `test/integration/batch-live-batch-lock.test.mjs` |
| 12-3 | 造两个活批档并存，再写产品码 | 产品码照写（锁只问存在否，不要求全局唯一） | 待执行 | — | — | — | `test/integration/batch-live-batch-lock.test.mjs` |
| 12-4 | 台账库不可读（库位是目录），再写产品码 | 拒：拒文含 `no live batch record` 与 `ledger unreadable — `（带台账原始错误）；文件零改 | 待执行 | — | — | — | `test/integration/batch-live-batch-lock.test.mjs` |
| 12-5 | 无活批档时写 `thincoder-vscode/test/x.test.mjs`；再写 `node_modules/**` · `thincoder-cli/dist/**` · `test/integration/**` | 前者拒（拒文含 `a product test file needs a live batch too`，文件零改）；后三者照写 | 待执行 | — | — | — | `test/integration/batch-live-batch-lock.test.mjs` |
| 12-6 | 在 `vendor/` · `node_modules/` · `dist/` 各放一份含标记文本的 `.mjs`，用 `grep` 搜该标记；再在普通目录放同文本 | 首次零命中（名单合并后三处都被剪）；普通目录那份命中——证明剪枝生效而非搜索坏了 | 待执行 | — | — | — | `test/integration/batch-live-batch-lock.test.mjs` |

### 13. 建批档就有台账

> 目的：`batch create` 一次调用同时成立「档」与「台账行」——不传号新建、传号接管；已归档 / 已结账 / 他批占用的行拒；**同面有未决行时新建须声明新事**。
> 节注：回指 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.4 ∥ `docs/core/design/LEDGER.md` §6.3（13-1 前提 ∥ 13-4 同面判）；四态（行序）= 13-1 正常 · 13-2 正常 · 13-3 错误 · 13-4 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 13-1 | 同面无未决行时不传 `ledger` 建一档 | 台账 +1 行：`status = 在途` · `task_book` = 该档 · `trigger = 归批`；档头 `> 台账 = #N（… · 归批）` 写真实行号（无 `#<编号>` 占位） | 待执行 | — | — | — | `test/integration/batch-ledger-bind.test.mjs` |
| 13-2 | 传一条 `待讨论` 行的号建一档 | 该行变 `在途`、指针回填本档；不新建行（行数不变） | 待执行 | — | — | — | `test/integration/batch-ledger-bind.test.mjs` |
| 13-3 | 传一条 `已核销` 行的号建一档 | 拒（拒文含 `an archived row cannot carry a new batch record`）；档零落盘；行逐列零改 | 待执行 | — | — | — | `test/integration/batch-ledger-bind.test.mjs` |
| 13-4 | 同一 `board` 面预置一条未决行（`待讨论`），再省略 `ledger` 建一档；随后改携 `newDebt` 重试 | 第一次拒：拒文列该行（`#<id> <status> <title>`）、批档零落盘、台账零行写入；第二次成功：档落盘、新行 `evidence` 含 `新事理由：` 前缀、本批收口回执引该理由一行 | 待执行 | — | — | — | `test/integration/batch-ledger-bind.test.mjs` |

### 14. 评审过、收口清、重开回

> 目的：`§5` 只在评审通过后开写；收口要 `§3 = 评审通过` 且把本批行推出 `在途`；核销判档面（换会话也成立）；重开把 `待核销` 行带回工作位。
> 节注：回指 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 ∥ §2.6 ∥ §2.6.1 ∥ §2.7 ∥ §2.11 ∥ §2.13；八态（行序）= 14-1 错误 · 14-2 错误 · 14-3 正常 · 14-4 正常 · 14-5 正常 · 14-6 正常 · 14-7 错误 · 14-8 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 14-1 | `§3` 无结论时以 eng-coder 绑定 append `§5`；父侧派设计评审后评审 `append §3` 写一笔无裁定行（`batch append §3` ↔ `§3` 写入闸）；再夹具直写一笔含无裁定块的存量档（不经工具）并置 `§3 = 评审通过`，重试 `append §5`；最后补一块携 `VERDICT: pass` 的轮次块重试 | 第一次拒（拒文含 `§5 append refused`，§5 字节不变）；工具写无裁定行的 `§3` ⇒ 拒（拒文逐字 = `R-G3`，档字节不变、轮次块数不变）；存量无裁定块 ⇒ `append §5` 拒（拒文逐字 = `R-G2b`，块内裁定 = 无裁定行）；末块携 pass 裁定 ⇒ 写入成功。服务条目 = R4 + R27（`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §5） | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |
| 14-2 | `§3` 非 pass 时 `batch close` | 拒，拒文含 `§3 状态行 = …，须 = 评审通过`；§1 状态行字节不变 | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |
| 14-3 | 换一个会话（ctx 无槽 / 无 designId）用 `ledger close` 核销一条「已收口 ∧ §3 = 评审通过」的合格行 | 核销成功（`status = 已核销`）——③ 判档面，不再看槽内归属 | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |
| 14-4 | `batch close` 一个含 1 行 `在途` + 1 行 `待讨论` 的批 | 分别落 `待核销` / `条件`；回执两行（在途行 / 未动行）各一行 | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |
| 14-5 | 同上夹具再读回执三行 | 汇总行（末行）只点名「本批 2 行由重锚默认推进，父侧未显式处置：#a, #b」、不再给建议；建议句各贴其行——第一行（在途行 → 待核销）携「认领行只有两种终局」、第二行（未动行 → 条件）携「不是本批的活（点火违规）」 | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |
| 14-6 | 收口后 `batch status` 重开（`§1 → 进行中` + note） | 行回 `在途`、回执第一行点名 1 行；随后产品码写当场可写（该档又是活批档） | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |
| 14-7 | 同一批里一行 `待核销` + 一行 `已核销`，重开 | 前者 → `在途`、后者零改；回执两行（待核销行回收 / 已核销行不可回收逐 id 点名） | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |
| 14-8 | 一批已 in 一轮 `pass`（§3 状态行 = `评审通过`）后，同一批判 `changes-required` 并 append `§3` 打回；随后 `append §5`；再 `status` 置 `评审通过` 后重试；最后追加一块携 `VERDICT: pass` 的 `§3` 轮次块重试 | 打回那一笔同时改 §3 状态行**字节** → `进行中（第 N 轮打回）` 并在本轮块首留痕；`append §5` 被拒（拒文含 `§3 状态行 = 进行中，须 = 评审通过`，§5 字节不变）；`status` 单写仍拒（`R-G2b`：末块仍携 `VERDICT: changes-required`）；补块 ⇒ `append §5` 放行 | 待执行 | — | — | — | `test/integration/batch-gates-reanchor.test.mjs` |

### 15. 偶发空响应不打断会话

> 目的：提供端瞬时吐空之后，用户照常拿到答复，而不是 `LLM returned empty response`；只有连续空才抛。
> 节注：回指 = `docs/core/design/AGENT-LOOP.md` §6.5①（清零判据 ∥ 额度 ∥ 清零点）· `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.8（判空加宽）；缺口来源 = 用户 2026-10-27 报告「deepseek-flash 一直报 empty response，点 retry 又能继续」。三态（行序）= 15-1 正常 · 15-2 错误 · 15-3 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 15-1 | CLI 会话里发一条消息，provider 桩按序回：空 → 带正文且带工具调用 → 空 → 带正文（中间轮必须带工具调用——零工具调用的带正文响应会当场收束本 run） | 用户拿到两次正文答复；中间轮之后 `_emptyRetries` 读到 0（读点在下一轮取值之前）；全程不抛 `LLM returned empty response` | 通过 | 2026-10-27 | 父代理（收口实跑） | — | `test/integration/empty-response-retry.test.mjs` |
| 15-2 | 同上，桩恒回空响应 | 第 3 次空响应当场抛 `LLM returned empty response`（文案带原错误）；前两次各注入一次空响应提醒 | 通过 | 2026-10-27 | 父代理（收口实跑） | — | `test/integration/empty-response-retry.test.mjs` |
| 15-3 | 同上，桩按序回：空 → 带工具调用 → 空 → 空 → 带正文 | 不抛；工具轮复位后两次空各计 1 / 2、第三次空未发生 ⇒ 重试成功。**修前此行为红**（工具轮不清零，第 3 次空即抛）——「不抛」本身即判别点 | 通过 | 2026-10-27 | 父代理（收口实跑） | — | `test/integration/empty-response-retry.test.mjs` |

### 16. 状态行百分比与压缩判据同尺

> 目的：用户看到的上下文百分比就是压缩实际用的那把尺子——校准比生效，不是低报的裸估算。
> 节注：需求回指 = `docs/core/requirements/CONTEXT-COMPACTION.md`（F-CC1 感知 `:34`「模型可查当前上下文的用量与构成」∥ 报面 `:57`「同名输出不得两个无名百分比并存」）；设计回指 = `docs/core/design/CONTEXT-COMPACTION.md`（stats 面「与状态行 ctx% 的单源关系」条：单源 = 核 `historyReading`）；交互组件 = 槽 `estimateSample` → 核 `sampleRatio` / `restoreTokenSample` → CLI 渲染缓存 `ctxCacheOf` → 状态行渲染（四组件）；进入口 = CLI 恢复带样本的会话，用户肉眼读状态行；三态（行序）= 16-1 正常。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 16-1 | CLI 端恢复一个**带 `estimateSample`** 的会话（`num` / `den` ⇒ 比 > 1，如 1473 / 1000），读状态行的 `context X%` 段，同一回合再调 `context` 工具的 `stats` | 状态行显示的 X = 核 `historyReading(合并后机读线, provider, `sampleRatio` 出的比).pct`（与未校准读数不同）；`stats` 第 6 行同值——两处一个数 | 通过 | 2026-10-27 | 父代理（收口实跑） | — | `test/integration/context-percent-calibrated.test.mjs` |

### 17. 评审没写进批档就不算过

> 目的：判 pass 的评审必须已经把结论落进该批档 §3——不落地就不签发凭证；而没有批档绑定的设计评审根本发不出去（批次档是评审的前提，不是纸张）。下游 spawn 拿不到授权（代价不落到实施席头上）。
> 节注：回指 = `docs/core/requirements/ADVISOR-CONVERGENCE.md` F-A13；机制单源 = `docs/core/design/ADVISOR-GUARDS.md` §1.1 ∥ §1.3（结算面 §3 落地门）∥ §2 第 6 条（准入面：设计评审必携 `batchDoc`）∥ §2 第 7 条（账链门：批档须挂未决台账行）；交互组件 = 准入面（`advisor` 工具入参门）⟷ 账链面（台账库读取）⟷ 结算面（`settleDesignReview`）⟷ 批档 §3 读写 ⟷ spawn 门 ⟷ 槽清点；进入口 = 父侧发设计评审（工程模式 depth-0）→ 读回执 → 派 eng-coder；三态（行序）= 17-1 错误 · 17-2 错误 · 17-3 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 17-1 | 带 `batchDoc` 的设计评审回 pass 但不写 §3 | 无 token、回执含 `review record incomplete`、同 designId 的 eng-coder spawn 被机械拒；补写 §3 后重评 ⇒ 签发（spawn 门放行） | 待执行 | — | — | — | `test/integration/advisor-record-gate.test.mjs` |
| 17-2 | 不带 `batchDoc` 的设计评审（`documents` 只放设计档） | 当场拒发：回执首行点名 `batchDoc` 必填（标识行 `criterion=batchdoc-missing`）+ 两条期望形 + 无档时先 `batch create` 的下一步；拒发登记；跑前跑后槽数不变、零评审实例、零 LLM；随后同 designId 的 eng-coder spawn 因无授权被机械拒 | 待执行 | — | — | 修前红 = 准入判据未落地 ⇒ 不带 `batchDoc` 照常签发——本行断言的就是那条已退场的旧行为 | `test/integration/advisor-record-gate.test.mjs` |
| 17-3 | 批档的未决行已被撤（`已废弃`）后，携该 `batchDoc` 发设计评审 | 拒发：回执含 `criterion=batchdoc-no-ledger` ∧ `reason=no-pending-row` ∧ `Record:` 读数 `unsettled: 0`；零实例 / 零 token / 零 LLM。反证格 = 另一本带未决行的批档发同调用 ⇒ 放行 | 待执行 | — | — | 修前红 = 账链门未落地 ⇒ 未决行被撤后照常发评审、token 照签而无收口能收 | `test/integration/advisor-record-gate.test.mjs` |

### 18. 一条后台报告只投递一次，未签收时才升级

> 目的：一条后台报告在会话里出现一次之后**不再被注入**——空回合不把它再推一遍；未签收累积到上限才升级（终局披露一次 + 一条 UNSETTLED 提醒），此后零自动投递。
> 节注：回指 = `docs/core/requirements/AGENT-LOOP.md` §4.15（F-DA1 / F-DA2 / F-DA3 · N2 / N4）；机制单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.5（判定两支 ∥ 未签收上限 ∥ 升级支）∥ §6.31.11（A-DA3 / A-DA9）；交互组件 = 会话链路（`createAgent` + `runAgent` 消化轮）⟷ 见账 pass（`accountDigestRound`——含升级终局披露）⟷ 会话流与 status 面；进入口 = CLI 会话里一条后台报告被投递之后的连续消化轮；三态（行序）= 18-1 正常。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 18-1 | CLI 会话里一条后台报告被投递之后的连续消化轮：置 `_daSession`，把一条**未投递**条目放进 `_pendingAsyncResults`（report = 可检索标记串，不预置 `_daDelivered`），逐轮 `runAgent(agent, "", {}, { autoTurn: true })`——前 4 轮桩恒回空响应（该轮抛 `LLM returned empty response`，调用面 catch 后继续），第 5 轮桩回任意正文 | 第 1 轮后报告正文出现 1 次（首投）；第 1–3 轮后会话流零 UNSETTLED 提醒、条仍在容器、注入计数 = 1、`report` 未释放；第 4 轮后 `_unsettledDigests` 恰 1 条（`missRounds = 4`）、UNSETTLED 提醒恰 1 条、正文出现 2 次（首投 + 终局披露）、`unsettledCount === 0`（条已离容器）；第 5 轮后零新注入。**修前红**：第 2、3 轮各再注入一次（正文出现 3 次）、第 3 轮即出 UNSETTLED 提醒 | 通过 | 2026-10-27 | eng-coder（实施席实跑） | — | `test/integration/digest-empty-round.test.mjs` |

### 19. 首 token 慢的长上下文请求不再被当断流

> 目的：等首 token 与流中途停摆分开计时——prefill 久不算断流，中途真停摆仍按空闲窗及时报错。
> 节注：回指 = docs/core/design/TIMEOUT-DIGEST.md §2.4（判据 A11 ∥ A13）；交互组件 = provider 读侧看门狗（`thincoder-core/provider/sse.mjs` 两态臂）⟷ 两个取值点 `effectiveFetchTimeoutMs` / `effectiveBodyIdleMs`（传输层看门狗本批不动——另批，见该档 §7）；进入口 = CLI 里对慢 prefill 的 provider 桩发一条长上下文消息；两态（行序）= 19-1 正常 · 19-2 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 19-1 | CLI 配慢 prefill 的 provider 桩（响应头立刻回、首帧延迟 3s），`agent.bodyIdleTimeoutMs` 设 800，发一条消息 | 用户拿到正文答复；会话流零 `SSE … timeout` 报错（首 chunk 窗生效） | 待执行 | — | — | — | `test/integration/sse-first-chunk-window.test.mjs` |
| 19-2 | 同一桩吐出首帧后停摆，`agent.bodyIdleTimeoutMs` 设 800 | 报错文案含 `no data for 0.8s`、相位串 `sse-idle`；用时 ≈1s（不是首 chunk 窗的 600s） | 待执行 | — | — | — | `test/integration/sse-first-chunk-window.test.mjs` |

### 20. 一本批档只服务一个并发 spawn

> 目的：同一本批档同时只有一个写者——第二席被拒、点名占用者，而不是两边都写坏档。
> 节注：回指 = 设计档 §6.58.1–§6.58.2（判据 ∥ 拒因文案）· 集成行设计 = 同档 §6.58.8；机制单源 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58；交互组件 = spawn 门（`buildSpawnChild`）⟷ 异步池在飞表（`getAsyncPool`）⟷ 第二席的返回；进入口 = 工程模式父侧并发派两席共一本批档；两态（行序）= 20-1 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 20-1 | 工程模式父侧并发派两席共一本批档：第一席 async 在飞，紧接着派第二席（同一 `batchDoc`） | 第二席被拒，返回文本点名该批档路径、占用者 `<role>#<id>` 与其 status，并给可执行下一步（等其 settle ∥ cancel 它）；第一席照常交付、档上只有一套写者。**修前红**：两席都被接受 | 通过 | 2026-10-28 | 父侧（`node test/run.mjs`） | ① 只断第二席被拒 + 点名 + 池面不变（池内仅第一席、其条目零改、队列空）；「第一席照常交付」需真 LLM 子代理，夹具以池条目字面量代其在场（形态所限的收窄，非省事）。② 集成桩 `subagent-*` 侧 | `test/integration/batchdoc-reuse-guard.test.mjs`；读数 = `tests 69 / pass 69 / fail 0`（`node test/run.mjs`，含 20-1 单例 26ms 绿） |

### 21. 跨项目读账读的是目标项目

> 目的：进程锚与目标项目不同时，`ledger list --json` ∥ ACP `ledger/list` ∥ `ledger/count` 读的是目标项目的行与数——不是空账，也不是进程锚那个项目的。
> 节注：回指 = `docs/cli/requirements/READ-DATA-INTERFACE.md` FR1 ∥ FR3（载荷形 = `docs/cli/design/READ-DATA-INTERFACE.md` §3.2 ∥ §2.6）；机制单源 = `docs/core/design/LEDGER.md` §3.10（界 = 同档 §3.8「三面三界」）；交互组件 = 命令面 runner（`thincoder-core/ledger-read.mjs` `runLedgerList`）∥ ACP 两出口（`thincoder-cli/src/acp/read-data.mjs` `ledger/list` ∥ `ledger/count`）⟷ `ledgerExport` ∥ `ledgerCount` ⟷ 根推导界 ⟷ 键控库读取；进入口 = 进程锚 ≠ 目标项目时跑 `thincoder ledger list --json --cwd <目标项目>`；四态（行序）= 21-1 正常 · 21-2 边界 · 21-3 正常 · 21-4 正常。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 21-1 | 夹具项目 A ∥ B 各在台账建行；`process.chdir(A)`，再跑 `ledger list --json --cwd <B>` | 退出码 0 · 单段 JSON · `projects.length === 1` · `projects[0].root` = B · 行 id 集 = B 的行 · 零 A 行 · `schemaVersion` = 2 | 待执行 | — | — | 缺口来源 = 台账 #1834 §6 读数（修前 `{"projects":[]}` → 修后 1 项 / 1 行） | `test/integration/ledger-read-cross-project.test.mjs` |
| 21-2 | 同一 A 锚，`--cwd <带档但无台账库的项目>` | 退出码 0 · `projects` = `[]` · stderr 零行——空账不改成抛 | 待执行 | — | — | 回指 = 需求档验收 ②「空库空集 exit 0」；夹具两项 = 目标带 `PROJECT-MANIFEST.json`、键控库不在盘 | `test/integration/ledger-read-cross-project.test.mjs` |
| 21-3 | 同 21-1 的进程锚与目标，走 ACP `ledger/list`（`params.cwd` = B） | 回包与 CLI 载荷深等：1 项 · 根 = B · 行集 = B 的行 · 零 A 行 | 待执行 | — | — | 业务入口 = 扩展拉取选中项目的台账；缺口来源 = 台账 #1834 的第二出口 | `test/integration/ledger-read-cross-project.test.mjs` |
| 21-4 | 同 21-1 的进程锚与目标，走 ACP `ledger/count`（`params.cwd` = B，会话锚 = A） | `count` = B 的未决四态行数（≠ 0）· `overdue` ∥ `evidenceTooLong` 与 B 的读数一致 | 待执行 | — | — | 缺口来源 = 用户 2026-10-28 13:06 裁定 A（`count` 的界跟 `list`）；现行 `thincoder-cli/src/acp/read-data.mjs:77` 走 `ctx.getCwd()` ⇒ 修前回 0 | `test/integration/ledger-read-cross-project.test.mjs` |

### 22. SSH 接网络设备：读得清、拿得全、判得准

> 目的：接真网络设备时输出干净、长配置取得全、慢操作不误判就绪。
> 节注：回指 = `docs/core/requirements/TOOLS.md` §4.8（S3 ∥ S4 ∥ NS2）；交互组件 = `ssh` 工具面 ⟷ 会话池 ⟷ 传输面（剥离 ∥ 帽窗 ∥ 四门）；进入口 = CLI 会话里让助手调 `ssh` 工具，用户看的是那一格工具结果回执；三态（行序）= 22-1 正常 · 22-2 正常 · 22-3 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 22-1 | CLI 会话里让助手 `ssh connect` 到脚本化假设备（`_setSshBinaryForTest` 替掉 ssh），再 `send("show run")`：设备吐 20 000 字符、夹 CSI/OSC/退格、末行 `--More--` | 工具结果回执零 `\x1b` 残留、首行与末行俱在、注记点名中段可取回；随后 `read` 取回中段，三段拼合与设备原文逐字一致；`--More--` 字面出现 1 次 | 待执行 | — | — | — | `test/integration/ssh-device-readability.test.mjs` |
| 22-2 | 同一会话 `send("write memory")`：设备回显后静默 3 s 再出 `[OK]` 与提示符 | 结论 = 提示符命中 ∧ 未在静默窗交出（首屏从未在 800 ms 静默处返回）；`[OK]` 与提示符俱在返回文本里。用时只作旁证，不作断言 | 待执行 | — | — | — | `test/integration/ssh-device-readability.test.mjs` |
| 22-3 | 同一会话 `send`：替身按脚本在第 N 字节后停吐（同一会话内从「会吐」切到「不再吐」，`timeoutMs: 1500`） | 硬超时内返回可读句并点名未过的门（无提示符 ∥ 仍在输出 ∥ 一个字节都没回）；会话仍在 `list` 里（不静默挂起、不崩） | 待执行 | — | — | — | `test/integration/ssh-device-readability.test.mjs` |

### 23. 配了 OpenCode Go 的会话能发出话

> 目的：配好渠道后发一句话就有回复，不再吃 `400 MissingSessionID`。
> 节注：回指 = 台账 #1923（用户 2026-11-01 01:04 裁定「每会话一个」）；需求面 = 用户裁定 + 台账行，需求档未立条目；交互组件 = 配置装载（`providers[].headers` 的 `${sessionId}` 模板）⟷ 请求装配（`withUserAgent`）⟷ 本地假上游 HTTP；进入口 = 用户在 `/config` 配好 `opencode-go` 后发一句话，看的是助手回复那一格；三态（行序）= 23-1 正常。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 23-1 | CLI 会话把 `opencode-go` 的 `baseURL` 指向本地假上游（零外网、零付费端点）：假上游按请求头作答——带头 ⇒ 200 + 一段助手回复，不带头 ⇒ `400 {"type":"MissingSessionID"}`（逐字复刻实测载荷）。先跑一次带头的正常回合；再以修前配置形状（无该头）跑同一句作对照 | 正常跑 = 会话里出现助手回复（不再落 400 错误面）；对照跑 = 该回合失败并带出上游 400 的 `MissingSessionID` 错误面（不静默、不返回空回复） | 待执行 | — | — | 出站头的值不在本行断言（同值判据归单元用例，两层不重复）；真端点留给收口 smoke | `test/integration/opencode-session-header.test.mjs` |

### 24. 评审的方法论符合度不再恒空

> 目的：项目声明了标准档，评审就拿到正文、按它判方法论；没声明 ∥ 声明了读不到，各自说清是哪一种——不再对任何项目都空着。
> 节注：回指 = `docs/core/requirements/ADVISOR-CONVERGENCE.md` §5.1「项目标准」行 ∥ 验收 ③④（③ = 任何一面都不得静默跳过——24-2 的第二半与 24-3 的负向锁都断在它上面）；判据 ∥ 文案单源 = `docs/core/design/MANIFEST.md` §2.12；交互组件 = 项目数据档 `docRoot.standards` → 数据档读取 → 注入器 → 评审消息组装面；进入口 = 工程模式会话里对一本批档发起一次设计评审（`batchDoc` 绑定）；三态（行序）= 24-1 正常 · 24-2 错误 · 24-3 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 24-1 | 夹具项目声明 `docRoot.standards` = 一份在盘的标准档，在该项目里发起一次设计评审 | 评审消息组装面含 `## Project Standards` + 用途句 + 该档正文首行；返该档绝对路径 | 待执行 | — | — | — | `test/integration/review-standards-injection.test.mjs` |
| 24-2 | 同一夹具把声明值改成不存在的路径，再发起一次设计评审 | 注入面出现态 2 句（含该声明路径字面 + `no such file`），**且与 24-3 的句子不等**；零正文注入 | 待执行 | — | — | — | `test/integration/review-standards-injection.test.mjs` |
| 24-3 | 同一夹具删掉该键（或整档），再发起一次设计评审 | 注入面出现 `NO_STANDARDS_NOTICE`；零正文、零路径字面、零 `declared` | 待执行 | — | — | — | `test/integration/review-standards-injection.test.mjs` |

### 25. 撞帽了，用户看得见自己转了多久

> 目的：撞帽卡上同时给出本段轮数与链内累计轮数——用户据此判「继续还是停」。
> 节注：回指 = `docs/core/requirements/TURN-CAP-CONTINUE.md`（撞帽提示条目）；判据 = `docs/core/design/TURN-CAP-CONTINUE.md` §6；交互组件 = 核回合环（每轮 `++_turnSeq` ∥ `ContinueError` 抛点）⟷ CLI 撞帽分支（询问行 ∥ 待答状态行）；进入口 = CLI 会话里让一个任务连撞两次轮帽，读第二次的卡面；两态（行序）= 25-1 正常 · 25-2 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 25-1 | CLI 会话把 `agent.maxTurns` 调小，发一个跑得比它长的任务，撞帽后在卡上选 Continue，第二段再撞帽 | 第二张卡的两行都同时含两个数：`Ran 3 turns — 6 turns total. Continue?` 与 `Continue after 3 turns (6 total)?`——本段 3、累计 6，零 `(limit` | ✅ 通过 | 2026-11-01 | 父侧（主 agent） | — | `test/integration/turn-cap-progress.test.mjs` |
| 25-2 | 同一会话首段即撞帽（未续跑） | 首张卡 = `Ran 3 turns — 3 turns total. Continue?`（累计等于本段，两个数都在） | ✅ 通过 | 2026-11-01 | 父侧（主 agent） | — | `test/integration/turn-cap-progress.test.mjs` |

### 26. 清账要先有一把可复述的尺（report 面的行号坐标清单）

> 目的：清存量行号引用之前，先让「还剩多少」可复述——同一份报面同时给出量法、两面读数与逐处坐标。
> 节注：回指 = `docs/core/requirements/DOC-CHECK.md` F11 ∥ AC-9（AC-9 ①②④）；判据 = `docs/core/design/DOC-DISCIPLINE.md` §3.23 条目 W；交互组件 = `doc_check({mode:"report"})` → 报面构造 → 行号坐标采集器 → 清单块；进入口 = 真 `doc_check` 工具调用（`mode:"report"` + 显式 `docs`）；两态（行序）= 26-1 正常 · 26-2 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 26-1 | 夹具档里三种写法各放一处（紧贴 ∥ 同段承名 ∥ 跨段承名，档名均为在盘档），调 `doc_check`（`mode:"report"` + 显式 `docs`） | 清单块首行是**量法行**（含档名抽取式 ∥ 坐标抽取式 ∥ 扫描域三串）· 合计行读 `合计 3 处` · 逐处行三行且形别 ① / ② / ③ 各一 · 末行仍是 `结论：…` | 待执行 | — | — | — | `test/integration/doc-check-line-refs.test.mjs` |
| 26-2 | 夹具档不含任何行号坐标，同一入口再跑一次 | 清单块仍出量法行 + 空态行「行号坐标 0 处」，块内无空行（空行读起来像「没跑」） | 待执行 | — | — | — | `test/integration/doc-check-line-refs.test.mjs` |

### 27. 评审写一笔 §3 就够：状态行由工具置位

> 目的：绑了批档的评审写一笔携 `VERDICT: pass` 的 §3 就完成该轮——段级状态行由工具在同一笔写盘里置位，评审不必记得再签一次 `status`；漏签不再白跑一轮评审。
> 节注：回指 = `docs/core/requirements/ENGINEERING-MODE-V2.md` §5.3（§3 状态行由工具置位）；批档条目 = R23；机制 + 判据单源 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 ∥ §5 R23；交互组件 = `batch append §3`（`thincoder-core/agent-tools/batch.mjs` 的追加轨）⟷ §3 段级状态行（`updateSectionStatusLine`）⟷ 结算面（`settleDesignReview`）∥ `§5` 写入门（`assertSectionFiveGate`）；进入口 = 父侧派设计评审（工程模式 depth-0，`batchDoc` 绑定）→ 读回执 → 派 eng-coder（与 17-1 同一入口、同一格回执）；一态（行序）= 27-1 正常。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 27-1 | 带 `batchDoc` 绑定的设计评审对**骨架原形批档**（§3 无段级状态行）只写一笔 §3，正文携 `VERDICT: pass`——**不另调 `status`、不手写状态行**；随后读回执、结算、由 eng-coder 追加 §5 | §3 段内出现 `**状态行**：评审通过`（轮次块 +1、零留痕行、读侧 `readSectionStatusWord` 同值）；结算签发 token（回执带 `Approved. Pass this exact token to eng-coder`、槽内为该 designId 的全串）；随后同一档 `append §5` 放行 | 待执行 | — | — | 修前红 = 那一笔之后 §3 仍无状态行 ⇒ 结算面拒 `status-not-passed`（「补一次签字」正是本行要消掉的那一步） | `test/integration/batch-status-auto-set.test.mjs` |

### 28. 拿行号改文档不会静默改错行

> 目的：同一会话里先写过一笔、再从旧快照拿行号去改 ⇒ 当场拒（点名路径 / 上次写入行 / 漂移量 / 两条下一步），文件字节零改。改前那里是「静默改到隔壁几行、回执还写成成功」。
> 节注：回指 = `docs/core/design/EDIT-HELPERS.md` §7（行号锚护栏，判据单源）；批档条目 = `docs/batches/2026-11-02-edit-line-anchor-guard.md` §2；机制单源 = `docs/core/design/EDIT-HELPERS.md` §7.1 ∥ §7.2 ∥ §7.3；交互组件 = 编辑族行号形（`edit` 的 `line` / `startLine`+`endLine`）⟷ 写入记账面（`lastWriteOf` / `isDirty`，`thincoder-core/tools/write-path.mjs`）⟷ 会话工具结果面；进入口 = 同一会话内两次编辑工具调用（子代理与主 agent 共用一张记账表）；一态（行序）= 28-1 错误。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 28-1 | 同一会话内先一笔 `edit`（或 `insert_after`）改到第 N 行附近，再用**旧快照的行号**调 `edit` 的 `line` / `startLine`+`endLine`，目标行落在受影响区内 | 当场拒：拒文逐字含路径、上次写入行、漂移量、两条下一步（重 `read` 与改走内容锚）；**文件字节零改**（改前后内容哈希相同）；回执不出现 `Edited …` 成功句 | 待执行 | — | — | 修前红 = 旧行号照旧应用、改到相邻行而回执报成功——本行断言的就是那条已退场的旧行为 | `test/integration/edit-line-anchor.test.mjs` |

## VS Code 端（thincoder-vscode）

> 本端集成层按故事设立（编号先行：先定 RTM 编号，再落用例标题 `test('<编号> …')`）。

### 1. 归档块重开 ∥ reload 后，子代理行还是子代理行

> 目的：会话重开 / 面板重载后，归档块里嵌套子代理那几行的行首子标仍在，不退化成正文；父自己的行照旧无子标。
> 节注：回指 = 需求 F-W1（恢复后存续）∥ I-7（收窄负控）；机制单源 = 设计档 §5.7 行形条 ∥ D-W46；交互组件 = webview 归档派生点（`rowsOf` → `recordAppend`）⟷ 槽 JSON 记录 ⟷ 页级重建（`record-restore.js` + 核 `renderSubagentChunk`）；进入口 = VSC 里跑一个带嵌套子代理的回合 → 重开面板 ∥ `reload` 窗口 → 展开归档块读行首。三态（行序）= 1-1 正常 · 1-2 边界。

| 编号 | 怎么做 | 怎么算通过 | 结果 | 执行日期 | 执行人 | 异常 | 证据 |
|---|---|---|---|---|---|---|---|
| 1-1 | VSC 里跑一个 `advisor` → `explore` 嵌套回合，等块归档落流；重开面板 ∥ `reload` 窗口，展开该归档块 | 每条子代行的行首有 dim 子标 `explore#1 · `（正文里不重复出现）；父自己的行零子标；行正文与重开前逐字一致 | 通过（6/6） | 2026-11-01 | 父侧（收口轮） | 无 | `test/integration/vsc-record-sublabel.test.mjs` |
| 1-2 | 同一会话在 VSC 里跑完嵌套子代理回合（新形记录落流），再于 CLI 端恢复同一会话 | 存量记录（子标字面在 `text` 内）两端行文逐字一致；新形记录在 CLI 恢复面同样以 `explore#1 · ` 起头，行全文与 VSC 端逐字一致 | 通过（6/6） | 2026-11-01 | 父侧（收口轮） | 无 | `test/integration/vsc-record-sublabel.test.mjs` |

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
