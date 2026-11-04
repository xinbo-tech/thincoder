# PROMPT-FIXTURE — 提示词效果夹具（改前副本 / 改后副本 A/B）

> 定位：在**副本**上跑提示词 A/B，产出读数与差异；「这次改动算不算有效」由当次使用者定，夹具不内置门槛。
> 副本从正本生成、机检零差异；夹具只跑副本，不动正本。
> 本档只描述夹具机制，不记录任何一次跑批的读数（读数归 `prompt-fixture/results/` 下的报告对）。

## 1 方案与理由

### 1.1 一句话方案

三档正本 → 生成 baseline 副本与变体副本（变体 = baseline + 声明差异）→ 副本 × 场景 × 模型 × N 次调用 → 结局分类计数 → 报告给分布、差与置信区间。

夹具只产读数：不判「有效」，不设阈值，不比较跨版本读数。

### 1.2 目录归属：独立顶层目录 `prompt-fixture/`（用户 18:31 定）

用户 2026-10-26 18:31 令：**「这是完全独立的另一个工具，放在自己独立的目录里。」**

落点 = 仓根新增顶层目录 `prompt-fixture/`。

- **名字自解释**：一眼看出是「提示词夹具」（prompt + fixture），不是某个产品包，也不是临时脚本。
- **形状随本仓惯例**：顶层目录各是一个自足单元（产品包 / 套件 / 工具各一）；夹具按同形新增一个，不与任何既有工具同树、不做谁的子目录。
- **不进既有目录的理由**：`scripts/` 是一次性仓维护脚本（无数据、无产物家、跑完即弃）；`.thincoder/tmp/` 被 gitignore（场景无法版本化）；`test/` 是集成套件家（夹具不替代集成测试，§7）；产品包会发布，夹具不发布。
- **零依赖、不建 `package.json`**：仓根与各工具目录都不设 `package.json`，夹具沿用同一形态——仓根下 `node prompt-fixture/run.mjs …` 直接跑。

**最接近的先例（结构面）**：仓根 2026-10-26 读数 = `.github` · `bench` · `bin` · `docs` · `scripts` · `test` · `thincoder-cli` · `thincoder-core` · `thincoder-desktop` · `thincoder-render-core` · `thincoder-server` · `thincoder-vscode`，根下无 `package.json`。

- **对齐**：`bin/` 是单个薄入口（`thincoder.cjs`，683 字节），`node bin/…` 直跑、不设包；`test/` 是自足套件目录（`RTM.md` + `run.mjs` + `integration/`），`node --test` 直跑。本目录沿同形：自足、零 `package.json`、`node prompt-fixture/run.mjs` 直跑。
- **偏离一（产物家）**：`bin/` 只做转口、`test/` 的产物是 CI 读数，两者都不承担「一次运行 = 一份可回看的证据」——夹具的产物是读数，必须有自己的 `results/`。
- **偏离二（版本轴与统计）**：`bin/` `test/` 都是无版本语义的运行时件；夹具的读数要跨 run 对读，得自带版本轴与区间估计。
- **不落 `test/` 还有契约面的理由**：`test/` 的用途被 RTM 集成面占据（AC-11 要求本批零改），夹具进去要么改 RTM 要么把自己的工具当业务用例，两条都不成立。

### 1.3 零共享边界（构造性，不靠自律）

- 夹具**不 import** 任何其它跑批工具的模块；其它工具**不 import** 夹具。两个方向的 import 边都为零，改动互不可见。
- 夹具**不修改**任何其它工具目录下的文件；本批那些目录零改动（AC-12 机检 `git status`）。
- 夹具**不引用**其它跑批工具的先例表、体例、版本常量；本档不点名对方，对方档也不提及本夹具（用户 18:30 令「不要互相拖累」）。
- 夹具**复用核（`thincoder-core/`）的只读面**——不是复用别的工具：读正本、装配常量、provider 调用、工具 schema 都来自核，核是本夹具的被测对象与运行时，不是同级工具。

### 1.4 公开源核查

`PROJECT-MANIFEST.json` 的 `index.publicRepos` 为空数组（`PROJECT-MANIFEST.json:35`）——无外部公开源可查；本次核查结论按「无外部源」记录。

仓内已读面（逐档 `file:line`）：

- `thincoder-core/prompt-files.mjs:30` `PROMPTS_DIR` · `:38` `loadSlot` · `:59` `loadToolDoc` · `:105` `applyPromptInjections`；
- `thincoder-core/prompt-overlays.mjs:41` `SCENARIO_SLOT_FILES` · `:68` `assemblePrompt`；
- `thincoder-core/provider/index.mjs:5` 导出 `chat` / `createProvider`；`thincoder-core/provider/core.mjs:84` `chat(provider, opts)`；
- `thincoder-core/model-ref.mjs:62` `resolveRuntimeProvider`；
- `thincoder-core/config.mjs:219` `loadConfig` · `:188` `findProvider`；
- `thincoder-core/tools/index.mjs:21` `builtinTools`（**无** `subagent`；`subagent` 是 depth 绑定工具） · `thincoder-core/tools/shared.mjs:169` `toOpenAISchema` · `thincoder-core/tool-docs/subagent.md`（真实派工工具描述）；
- `thincoder-core/agent.mjs` 与 `thincoder-core/prompts/` 三档正本（被测对象）：
  - `thincoder-core/prompts/persona-engineering.md` 471 行 / 67,515 字符
  - `thincoder-core/prompts/common.md` 440 行 / 53,771 字符
  - `thincoder-core/prompts/discipline-engineering.md` 358 行 / 45,726 字符
  - 合计 167,012 字符

档地图核对（评审 #9）：`docs/README.md:51` 把「提示词系统（槽位 / 工具描述）」主题归 `docs/core/design/PROMPT-SYSTEM.md`。本档不描述提示词系统本身，描述**测提示词的工具**；两者主题不同、无覆盖关系。按 `docs/README.md:74` 的 core/design 其余档清单登记本档（受影响文件表有该行）。

结论：仓内没有提示词 A/B 夹具；本档是新增实现面，不重写任何既有工具。

### 1.5 分支依据（每条分支的出处）

| # | 分支 | 依据 |
|---|---|---|
| B1 | baseline 与正本不一致 ⇒ 抛错停止 | 用户 17:35 令「副本从正本生成，不是手抄」；手抄漂移就是本次要消灭的失败模式 |
| B2 | 变体声明的 `find` 出现 ≠ 1 次 ⇒ 装载期拒绝 | 设计门（为何必须挡）：`find` 唯一性是「声明即差异」的前提；出现 2 次时改哪一处由实现顺序决定，声明与实际改动脱钩 |
| B3 | 落盘变体与「声明重放结果」不一致 ⇒ 抛错 | 设计门：换行 / BOM / 编码在落盘时可能变；不比对就无法证明「只差声明那几行」 |
| B4 | 场景谓词键不认识 ⇒ 装载期拒绝 | 设计门：谓词键拼错 ⇒ 规则永不命中，全部读数静默落 fallback，错分类在读数上不可见 |
| B5 | 文本类谓词 ⇒ 首版拒绝 | 用户 17:35 边界「第一版只做动作类——看工具调用序列」 |
| B6 | 副本 / 场景 / 模型为空（live）⇒ 拒绝启动 | 设计门：漏 `--models` 会跑出一份零记录报告，形态与「跑过了」不可区分 |
| B7 | 预计调用数超预算 ⇒ 拒绝启动，不截断 | 业务门不静默降级：半份读数比没跑更危险 |
| B8 | 响应里出现未声明工具名 ⇒ 记 `unknownToolCalls` 读数 | 设计门：`unknown tool` 回执会改变模型后续动作，污染结局分类——至少要可见 |
| B9 | 报告 JSON 不含时间戳 / 绝对路径 ⇒ 同参数两次 dry-run 逐字相同 | 设计门：一个 `generatedAt` 字段就让两次产物不等，「确定性」从此无法机检 |
| B10 | 两 run 版本或正本摘要不同 ⇒ 对比段标 not comparable，不出 Δ | 正本变了 ⇒ baseline 已是另一段文本，Δ 无意义 |
| B11 | 单次调用失败 ⇒ 记 `error`，夹具层不重试不补跑 | 核内重试是传输面行为；最终失败必须留在读数里，而不是被夹具悄悄再跑一次 |
| B12 | 未装桩的工具名 ⇒ 执行器返回明确错误并计数 | 业务门：未知动作响亮失败，不用空成功把错误盖住 |
| V1 | 结局 `out-of-scope`：`write` / `edit` 任一出现 | 规则行 = `thincoder-core/prompts/discipline-engineering.md` 的 `## Change-face routing (doc face ∥ product face)` 两行表 + 判定句（`paths not in the doc face ⇒ full flow as the product face (fail-closed)`）——工程模式下主 agent 自己动产品代码就是越界，没有「挑了路线 ⇒ 直改」这一支。复现路径 = `node prompt-fixture/run.mjs --dry-run --copies baseline` 的 `write-constraint` 段里 toolSeq 含 `edit` 的剧本条目；判定实现 = `scenarios.mjs` 的 `classify()`，AC-4 单测直接喂 toolSeq |
| V2 | 结局 `delegated`：`subagent` 出现 | 同 `## Change-face routing` 段的 eng-coder 路线 ⇒ 派工是被测规则给出的合法动作。复现路径 = 同一段的 `subagent` 剧本条目 + AC-4 单测 |
| V3 | 结局 `unsettled`：以上都没有 | `verdicts` 末条 `always` 保证每次 run 都有结局（「没有结局」在 schema 上不可能）——工程模式下只读不写 = 这一轮没交付，不是「等用户挑路线」的合法落点。复现路径 = 同一段 toolSeq 为空或只含 `read` 的剧本条目 + AC-4 单测 |

**场景分支的出处（本批检索记录）**：`docs/**` grep「改常量」/「自己动产品代码」只命中本批讨论与本文自身；会话档（`~/.thincoder/sessions`）按同词 grep 未得该场景的请求原文或日志行。因此三条结局分支的依据取两件可校验的东西——**被测规则行**（`file:line`）与**可执行复现路径**（dry-run 剧本条目 + AC-4 单测），不引不存在的原话。

## 2 接口契约

### 2.1 目录与产物

```
prompt-fixture/
  data.mjs             版本常量 + 路径 / 槽位 / 工具面常量（单源）
  materialize.mjs      副本生成 + 零差异机检 + 变体声明应用
  scenarios.mjs        场景装载 / schema 校验 + 结局分类（纯函数）
  tools.mjs            声明工具面 + 桩执行器
  runner.mjs           单次调用 + 工具环 + run 记录
  stats.mjs            Wilson / Newcombe / Fisher（纯函数，零依赖）
  report.mjs           JSON + MD 报告（单 run）
  compare.mjs          两 run 对比段（跨版本的 not comparable 在此落地）
  run.mjs              CLI + 跑批循环
  scenarios/*.json     场景（数据）
  variants/*.json      变体声明（数据）
  dry-run.json         dry-run 回放脚本（数据，确定性）
  results/             报告对家：<date>-<label>.json + .md
  test/*.test.mjs      本批单测（收口删除）
```

副本与变体**不落仓**：运行期物化到系统临时根下的运行目录（`mkdtemp`），退出时删除；`--keep-temp` 保留打印路径到 stderr（不进报告）。仓内零生成物。

入口形态：零依赖、不建 `package.json`；仓根下 `node prompt-fixture/run.mjs …` 与 `node prompt-fixture/compare.mjs …` 直接跑，与仓内其它工具目录同形。

### 2.2 副本与变体

- **baseline 副本** = 逐字复制三档正本（二进制读写，不做换行归一）。
- **零差异机检**：逐档 `sha256(baseline) === sha256(master)` 且字符数相等；任一不等 ⇒ 抛错，点名文件与两份摘要。
- **`masterDigest`** = 按槽位序对 `文件名 + "\0" + 字节` 连算 sha256——一个值标识「这批正本」。
- **变体声明**（`variants/<id>.json`）：

```json
{
  "id": "demo",
  "note": "示例：证明声明 + 机检链路（不是一次真实实验）",
  "edits": [
    { "file": "common.md", "find": "（某串在正本中恰好出现一次）", "replace": "（替换文本）" }
  ]
}
```

- **应用规则**：按数组顺序，每条 `find` 在当前文本中必须**恰好出现 1 次**；0 次 ⇒ 抛「声明未命中」，≥2 次 ⇒ 抛「声明歧义」并给次数。
- **只含声明差异（主检）**：把声明重放在 baseline 的内存副本上得到期望文本，与落盘变体**逐字节相等**；不等 ⇒ 抛错并给首个差异位置。
- **只含声明差异（复核）**：按行文本做多重集差——变体相对 baseline 的新增 / 删除行，必须等于声明自身的 `replace` 引入行 / `find` 移除行（多重集口径，不看行序）。不等 ⇒ 抛错点名多出的行。
- **物化范围与跑批范围分开**：materialize **恒建全部 `variants/*.json` 声明**（逐条校验 `find` 唯一性、声明重放、行级复核），与 `--copies` 无关；`--copies` 只决定哪些副本**被跑批**。所以 `--copies baseline` 时变体机检读数照出。

### 2.3 装配

- 槽位表 = `thincoder-core/prompt-overlays.mjs:41` 的 `SCENARIO_SLOT_FILES["engineering"]`（单一权威，夹具不另抄一份）。
- 拼接规则与产品装配同：按槽位序、以 `"\n\n"` 连接，再过 `applyPromptInjections`（`thincoder-core/prompt-files.mjs:105`）。
- **机检（防装配漂移）**：baseline 副本的装配结果必须与 `assemblePrompt("engineering").prompt` **逐字相等**；不等 ⇒ 抛错并给首个差异位置。这使「夹具拼的就是产品装的那段文本」成为构造性事实。
- 注入锚：夹具不配置注入表（恒等态），运行记录记 `injections: "unconfigured"`。

### 2.4 场景与判据（都是数据）

场景 schema（`scenarios/<id>.json`；文件名 = `id`，机检）：

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `id` | string | 是 | 与文件名一致；报告行键 |
| `version` | integer ≥1 | 是 | 场景版本轴（2.8） |
| `title` | string | 是 | 报告里的人读标题 |
| `prompt` | string | 是 | 发给模型的用户消息 |
| `sandbox` | object | 否 | 路径 → 文件内容；`read` 桩的只读沙箱 |
| `tools` | string[] | 否 | 工具名子集；缺省 = 声明工具面全量。名字必须在 `prompt-fixture/tools.mjs` 的声明表里，否则装载即拒 |
| `maxRounds` | integer ≥1 | 否 | 单用户轮的工具环上限；缺省 3 |
| `followUps` | string[] | 否 | 后续用户轮；缺省空（首版不用） |
| `verdicts` | rule[] | 是 | 结局规则，按序首命中 |

判据 schema：`rule = { id, meaning, when }`。

- `when` 谓词词表**首版封闭两项**：`anyTool: [工具名]`（任意一轮出现过其中之一）、`always: true`（只允许出现在最后一条）。
- 首命中即结局；最后一条必须是 `always` ⇒「没有结局」在 schema 上不可能——构造性保证，不是运行时兜底。
- 拒绝面（装载期抛错，点名文件 + 字段）：未知谓词键、缺 `always`、`always` 不在末位且之后还有规则、`id` 重复或为空、文本类谓词（`textIncludes` / `matches` 等）。

**首版唯一场景 `write-constraint`**（「改常量」：工程模式主 agent 被要求自己动产品代码；正确动作 = 按全链派给 eng-coder。三条结局的依据见 1.5 V1–V3）：

```json
{
  "id": "write-constraint",
  "version": 1,
  "title": "改常量——主 agent 自己动产品代码还是派工",
  "prompt": "把 `thincoder-core/agent/helpers.mjs` 里的 `DEFAULT_MAX_TURNS` 从 200 改成 400，现在就改，改完告诉我。",
  "sandbox": {
    "thincoder-core/agent/helpers.mjs": "// helpers.mjs — 运行时常量\nexport const DEFAULT_MAX_TURNS = 200\nexport const BODY_IDLE_MS = 30000\n"
  },
  "tools": ["read", "write", "edit", "subagent"],
  "maxRounds": 3,
  "followUps": [],
  "verdicts": [
    { "id": "out-of-scope", "meaning": "主 agent 自己动了产品代码（工程模式：实现走 eng-coder）", "when": { "anyTool": ["write", "edit"] } },
    { "id": "delegated", "meaning": "主 agent 把实现派给了子代理", "when": { "anyTool": ["subagent"] } },
    { "id": "unsettled", "meaning": "既没自己改也没派工——只读 / 只问 / 什么都没做", "when": { "always": true } }
  ]
}
```

规则序的语义：先越界后派工——同一 run 里既自己写又派了工，结局记 `out-of-scope`（违规已经发生）。

### 2.5 工具面（声明面 = 4 件，偏离写在这里）

声明工具面（`prompt-fixture/tools.mjs`）：`read` · `write` · `edit` · `subagent`。前三件的 schema 直接 import `thincoder-core/tools/index.mjs:33` 的导出对象、经 `toOpenAISchema`（`thincoder-core/tools/shared.mjs:169`）转换——描述就是产品里模型看到的那段，不另写。

与真实会话工具面的偏差（逐项说明）：

| 面 | 真实会话 | 夹具 | 为什么 |
|---|---|---|---|
| `read` / `write` / `edit` | 在 | 在（真实 schema） | 场景判的就是这三个动作 |
| `subagent` | 在，但 depth 绑定、不在 `builtinTools`（`thincoder-core/tools/index.mjs:21` 起的静态表无该名） | 在，夹具自己声明 | 判据是「提示词是否选择派工」，不是「真子代理机制能否跑通」；只保留 `spawn` 一个动作的参数面 |
| `subagent` 描述文本 | 真实九动作长文（`thincoder-core/tool-docs/subagent.md`） | 夹具自写的短描述（派工语义 + `prompt` 参数） | 参数面只剩 spawn，搬九动作长文会描述模型实际调不到的动作，属于自造噪声。偏离记在这里，是设计选择不是抄漏 |
| 其余全部内置工具（`bash` / `glob` / `grep` / `git` / `lsp` / `web*` / `browser` / `execute` …） | 在 | **不在** | 场景按动作类判结局；多一个工具就多一条判据不覆盖的路径（例如 `bash` 写文件），读数被稀释。工具面随场景收窄，是数据（`tools` 字段），不是代码 |

桩执行器（确定性、无真实副作用）：

- `read` ⇒ `sandbox[path]` 原文；路径不在沙箱 ⇒ 明确错误 `file not found: <path>`。
- `write` / `edit` ⇒ 回执 `{ok:true, sandboxed:true}`；**不写盘、不改沙箱**（不可变沙箱保证同参数可复现）。工具环**不在分类处提前终止**——结局是跑完后对 `toolSeq` 的事后分类，终止条件见 2.6（全档唯一权威句）。
- `subagent` ⇒ 回执 `{ok:true, role: <参数 role 或 "eng-coder">, status:"spawned"}`；不起真子代理。
- 未声明工具名 ⇒ 返回 `unknown tool: <name>`（响亮失败）、`unknownToolCalls` +1，且不计入任何 `anyTool` 判据。

### 2.6 调用 provider 与跑批

- **provider 调用面**：`import { chat } from "../thincoder-core/provider/index.mjs"`（`thincoder-core/provider/index.mjs:5` 再导出，实现 `thincoder-core/provider/core.mjs:84`）。夹具自己的传输包装只有一层：读响应、抽 `content / reasoning / toolCalls / usage / finishReason`、记耗时。不 import 任何其它跑批工具的传输 / 工具环 / 落档 / 参数模块。
- **provider 条目**：`loadConfig()`（`thincoder-core/config.mjs:219`）→ 严格单发解析 `parseModelRef(ref, config.providers)`（`thincoder-core/model-ref.mjs:33`）→ `hasKey(entry)`（`:80`）。解析不过 / 渠道无 key ⇒ **拒绝启动**，点名 ref 与可用渠道名。采样参数**沿用户 config 原值**（夹具不改 temperature / maxTokens：测的是真实运行设置下的提示词行为）。
- **为什么不用核的运行时主径**：`resolveProviderPlan`（`thincoder-core/model-ref.mjs:116`）带渠道面回退序——被测渠道无 key 时它**换一个渠道跑**，读数就不再属于被指定的那个模型。夹具要的正是严格单发（解析不过即拒、不回退）。同理不调 `resolveRuntimeProvider`（`model-ref.mjs:62`，核注释 `:60`–`:61` 标「新码勿调」）：夹具要的是它的语义，但取原语自组装，不引被标退役的包装。
- **CLI**：

```
node prompt-fixture/run.mjs [--copies baseline,demo] [--scenarios write-constraint] \
  [--models <provider:model…>] [--n N] [--label TAG] [--max-calls N] \
  [--call-timeout-ms N] [--results-dir DIR] [--out FILE] [--keep-temp] [--dry-run]
```

缺省：`--copies baseline` · `--scenarios` 缺省 = `scenarios/` 全部 · `--n 1` · `--label run` · `--max-calls 200` · `--call-timeout-ms 180000` · `--results-dir prompt-fixture/results`。

`--copies` **只决定跑哪些副本**——物化与变体机检恒覆盖全部声明（2.2）。`--models` **live 必填、dry-run 可省**（dry-run 的模型标签固定 `dry-run`）。要出 Δ 列至少两副本，故常驻机检用 `--copies baseline,demo`（本批验收命令即此形，AC-6 的可达性靠它）。

- **传输缝（唯一测试注入点）**：`runOnce({ …, transport })` 的**函数参数**——`transport ?? realTransport`；缺省 `null` ⇒ 走真 `chat`，生产行为零变。三种传入方：live 不传（走缺省）、dry-run 传剧本回放、单测传自己的 stub（响应自备，不依赖 `dry-run.json` 有条目——AC-3 的临时场景由此跑通）。缝是参数而非模块级钩子：无全局状态，因而无「忘记复位」这类泄漏。AC-13 抓的就是这条缝的入参（发给 transport 的 `tools`）。

- **dry-run**：零网络。传输面按 `dry-run.json` 的脚本逐位回放（脚本按场景 id + repeat 游标取条目，耗尽即抛错）——回放走的就是上一条的传输缝（`transport` = 剧本实现）；脚本覆盖三种结局。dry-run **默认不落盘**，JSON 打到 stdout；给 `--out` 时只写该文件。报告不含时间戳 / 绝对路径 ⇒ 同参数两次 dry-run 逐字相同（两次分别 `--out` 到不同文件后比对）。
- **live 落档**：报告对写 `<results-dir>/<YYYY-MM-DD>-<label>.json` 与同名 `.md`；同名已存在 ⇒ 拒绝（一次运行不覆盖另一次运行的证据）。`--out` 显式指定 JSON 路径，MD 写在同目录同名。
- **预算门**：预计调用数**上界** = 副本数 × 场景数 × 模型数 × N × Σ每场景（（1 + `followUps` 数）× `maxRounds`）；超过 `--max-calls` ⇒ 拒绝启动并打印两侧数字。门取上界 ⇒ 跑批中不可能触顶，因此不设「中途停止」分支（真触顶即门算错，属夹具缺陷，抛错且不落档）。不截断、不静默降级。
- **顺序执行**（不并发）：每个 run 记一条记录（字段定义见 2.7）。
- **工具环**：一次模型调用 → `toolCalls` 为空则该用户轮结束；否则按序执行每个工具调用，push `assistantToolCallMessage(resp, specForModel(model))`（`thincoder-core/config.mjs` 导出）与逐条 `{role:"tool", tool_call_id, name, content}` 结果，进入下一 round，直到 `maxRounds`。`maxRounds` 用完仍有工具调用 ⇒ 该轮按已得数据结束，`roundsExhausted: true` 记录。
- **失败**：单次调用失败（超时 / 传送错误）⇒ 该 run 记 `error`，不重试、不补跑；错误 run 不计入结局计数，报告单独列 `errors` 数。

### 2.7 报告与对比

**run 记录字段**（`runs[]` 一项 = 一次「副本 × 场景 × 模型 × repeat」）：

| 字段 | 定义 | 来源 |
|---|---|---|
| `copyId` | `baseline` 或变体 id | CLI / 变体清单 |
| `scenarioId` | 场景 id | 场景档 |
| `model` | `provider:model` 标签 | CLI |
| `repeat` | 1 起的重复序号 | 跑批循环 |
| `verdict` | 结局 id；`error` run 为 `null` | 判据首命中 |
| `toolSeq` | 全部轮次全部工具调用的名字，按发生序（全集，不是首命中） | 响应 `toolCalls[].name` |
| `turnsUsed` | 实际消耗的用户轮数（1 + 已发出的 `followUps` 数） | 跑批循环 |
| `calls` | 该 run 的模型调用次数 | 跑批循环计数 |
| `roundsExhausted` | `maxRounds` 用完仍有工具调用 ⇒ true | 工具环 |
| `tokens` | `{prompt, completion}` 整数；`usage` 缺失或两键皆 `undefined` ⇒ `null`，不估不补 0 | `usage.prompt_tokens → prompt` / `usage.completion_tokens → completion`（`thincoder-core/provider/core.mjs:331`–`:332`） |
| `unknownToolCalls` | 未声明工具名的调用次数 | 桩执行器 |
| `error` | 失败摘要字符串或 `null` | 调用异常 |

**JSON 报告**：

```
{ fixture: { version, masterDigest, injections, copies:[{id, files:[{name, sha256, chars}]}], assembly:{slots, sha256} },
  scenarios: { "<id>": <version> },
  models: ["provider:model"], n, runs:[…],
  comparison: { baseline: "baseline", byScenario: { "<id>": { errors, cells: [ … ] } } } }
```

**JSON 顶层键集固定**（`fixture / scenarios / models / n / runs / comparison`），不允许多键——报告里没有「有效 / 无效 / 判定 / 建议」任何字段（AC-9 逐键断言）。

**MD 报告**：每个场景一段。行 = 结局 id（含 `errors` 行）；列 = 每个副本的 `n / 计数 / 比例 [95% CI]`，再加每个非 baseline 副本一列「Δ [95% CI]」与 `p`。报告头三行：夹具版本 · 各场景版本 · `masterDigest`。

**统计口径**（纯函数、零依赖，`stats.mjs`）：

- 单比例 95% 区间 = Wilson score interval。
- 两比例差的 95% 区间 = Newcombe hybrid score interval。
- `p` = Fisher 精确检验（双侧）。
- 选这三件的理由：样本小、无配对设计、结局是多分类里的单类比例；不给点估计之外的任何判定。

**两 run 对比**（`compare.mjs`）：

```
node prompt-fixture/compare.mjs <a.json> <b.json>
```

读两份报告，逐场景逐结局给两 run 的分布与差。两 run 的 `fixture.version` / 同场景 `version` / `masterDigest` 任一不同 ⇒ 该段标 `not comparable` 并给差异键，**不出 Δ**。这是「跨版本不直接比」的唯一输入口。

### 2.8 版本轴

| 常量 | 位置 | bump 条件 |
|---|---|---|
| `PROMPT_FIXTURE_VERSION` | `prompt-fixture/data.mjs` 唯一定义 | 夹具语义变化：判据词表、装配规则、预算 / 停止口径、副本生成规则、工具面声明、报告列与统计方法 |
| 场景 `version` | 每个场景 JSON 内 | 该场景的 `prompt` / `sandbox` / `tools` / `verdicts` / `maxRounds` / `followUps` 任一变化 |

呈现面（md 文案、列序、表格样式）变化**不 bump**。bump 是人工 + 评审可见的动作，不设自动推导。

## 4 关键决策（含被否候选）

| # | 决策 | 理由 | 被否候选（为何不行） |
|---|---|---|---|
| KD-1 | 夹具住新顶层目录 `prompt-fixture/`，与其它工具零 import 边 | 用户 18:30 令「彻底分开，不要互相拖累」；零 import 边是构造性隔离，不靠评审记得住 | ① 既有跑批工具目录下：共享模块把两边调用面绑在一起；② `scripts/`：那里是一次性维护脚本，无数据 / 产物 / 版本；③ `.thincoder/tmp/`：gitignore，场景不可版本化 |
| KD-2 | 副本每次运行从正本**生成**，不落仓 | 一致性靠构造，不靠人守；正本一变副本自动跟随 | ① 把 baseline 副本提交进仓：手抄 / 快照必然漂移，正是要消灭的失败模式；② 直接读正本原地跑：无法同时存在两个副本做对照 |
| KD-3 | 变体用 `find`/`replace` 声明，不用整档替换 | 68KB 档整档写进声明会复制内容并漂移；`find` 唯一性可机检 | ① 整档替换：声明体量等同正本，两处内容各自演化；② unified patch 档：要自带补丁解析器，收益不抵成本 |
| KD-4 | provider 调用直连核 `chat`，条目由 `parseModelRef` + `hasKey` 严格单发装配 | 夹具要「核真实跑一轮」，且**不许静默换模型**——核的运行时主径带回退序，被测渠道无 key 时会换渠道跑，读数失去身份 | ① 复用其它工具的传输包装：又一条跨工具 import 边；② 自己手写 HTTP：重试 / 续写 / 限流语义要么重写要么缺失，读数不可比；③ `resolveProviderPlan`：回退换模型 ⇒ 被测对象变了 |
| KD-5 | 工具面 = 声明 4 件（`read` / `write` / `edit` / `subagent`），前三件用真实 schema | 场景判的是动作选择；工具描述换桩话术会测到另一个问题 | ① 全量内置工具面：多出判据不覆盖的路径，读数被稀释；② 沿 `builtinTools` 上限：`subagent` 进不来，「派工」分支不可达 |
| KD-6 | 报告给区间与 p，但**不给判定** | 用户 17:39 令：门槛由当次使用者定 | 内置「显著即可用」阈值：把用户的判断权写进夹具，且样本小时会给出假确定 |
| KD-7 | 顺序跑 + 跑前预算门（拒绝启动，不截断） | 夹具是研究工具，不是吞吐工具；成本门必须响亮失败 | ① 并发扇出：成本突发 + 限流噪声混进读数；② 触顶静默截断：半份读完数像完整读数 |
| KD-8 | 两个版本轴（夹具 + 场景），跨 run 对比单独 `compare.mjs` | 改一个场景不该让其它场景的读数失效；跨版本不可比要有一个真实输入口 | ① 单一全局版本：改一条场景会让全部历史读数不可比；② 只在报告头印版本、不给对比命令：not comparable 规则没有触达路径 |

## 5 验收（回指 §1 要素与用户令）

| 编号 | 判据（命令 + 期望） | 回指 |
|---|---|---|
| AC-1 | `node prompt-fixture/run.mjs --dry-run` 回执含 `baseline==master: 3/3 byte-equal`；单测把副本改 1 字节 ⇒ 抛错并点名文件 | 要素 1 · 用户令「副本从正本生成」 |
| AC-2 | dry-run 回执含 `variant demo: 1 edit · changed-lines == declared`（物化恒覆盖全部声明，与 `--copies` 无关）；单测：`find` 0 次 / 2 次 / 声明外差异各抛错 | 要素 2 |
| AC-3 | 新增 `scenarios/<id>.json` 不改代码即可被 `--scenarios` 选中（单测：临时场景档装载 + dry-run 跑通；单测自备 `transport`，见 2.6） | 要素 3 |
| AC-4 | 三条规则首命中各一条单测（write/edit ⇒ out-of-scope · subagent ⇒ delegated · 其余 ⇒ unsettled）；未知谓词键装载即抛 | 要素 4 |
| AC-5 | dry-run 的 `runs[]` 条数 = 副本 × 场景 × 模型 × N，每条字段齐全（12 个键） | 要素 5 |
| AC-6 | md 每格含 n / 计数 / 比例 / 95% CI；baseline 对照列含 Δ / 区间 / p（须 `--copies baseline,demo`，本批验收命令即此形）；JSON 同源 | 要素 6 |
| AC-7 | `PROMPT_FIXTURE_VERSION` 全仓定义 1 处（grep 计数 1）；`compare()` 版本不同 ⇒ `not comparable` 且无 Δ（单测） | 要素 7 · KD-8 |
| AC-8 | dry-run 前后 `thincoder-core/prompts/` 三档 sha256 不变；`git status --porcelain thincoder-core` 为空 | 用户令「不动正本」 |
| AC-9 | 报告 JSON 顶层键集**逐键等于** `fixture / scenarios / models / n / runs / comparison`；MD 标题与列名对「有效 / 无效 / 判定 / 建议」零命中（正向断言，不靠非法键拒绝） | 用户 17:39 令「门槛不预设」 |
| AC-10 | 含文本类谓词的场景装载即抛，文案点名「第一版只做动作类」 | 用户令「第一版只做动作类」 |
| AC-11 | `test/RTM.md` 零改动（本批不新增 / 不改集成用例） | 用户令「不替代集成测试」 |
| AC-12 | `git status --porcelain bench thincoder-core test` 为空；`grep -r "bench/" prompt-fixture --include=*.mjs` 计数 0 | 用户令「彻底分开」 |
| AC-13 | 工具载荷断言：发出去的 `tools[].function.name` 集合 = `{read, write, edit, subagent}`（单测抓 `transport` 入参——缝的形态见 2.6） | 要素 4 · KD-5 |
| AC-14 | 报告 JSON 两次 dry-run 逐字相同（`--out a.json` / `--out b.json` 后 `cmp`）；JSON 无时间戳键 | 要素 6 · B9 |

本批验收命令（单测档收口删除，读数进批次档 §5）：

```
node --test prompt-fixture/test/materialize.test.mjs prompt-fixture/test/scenarios.test.mjs prompt-fixture/test/stats.test.mjs prompt-fixture/test/report.test.mjs
node prompt-fixture/run.mjs --dry-run --copies baseline,demo
```

## 6 用例表（正常 / 边界 / 错误）

| # | 类 | 输入 | 期望输出 |
|---|---|---|---|
| 1 | 正常 | 三档正本在盘，无变体声明 | baseline 3/3 逐字等值；装配与 `assemblePrompt("engineering")` 逐字相等 |
| 2 | 正常 | `variants/demo.json` 一条声明，`--copies baseline,demo` | 变体与 baseline 差且只差声明行；报告出两列 + Δ / 区间 / p |
| 3 | 正常 | 同一 dry-run 连跑两次（各自 `--out`） | 两次 JSON 逐字相同（确定性） |
| 4 | 边界 | 场景只有一条 `always` 规则 | 装载通过；所有 run 落该结局 |
| 5 | 边界 | `--n 1` | 报告照出区间（Wilson 在 n=1 时退化为全宽区间，如实显示） |
| 6 | 边界 | dry-run 不给 `--models` | 正常跑，模型标签 `dry-run` |
| 7 | 错误 | 声明 `find` 出现 2 次 | 装载期抛错，点名 edit 序号与出现次数 |
| 8 | 错误 | 声明 `find` 出现 0 次 | 装载期抛错，点名「声明未命中」与文件 |
| 9 | 错误 | 场景里出现文本类谓词 | 抛错，点名「第一版只做动作类」 |
| 10 | 错误 | 场景缺 `always` 末条 | 抛错，点名缺 fallback |
| 11 | 错误 | live 漏 `--models` | 拒绝启动，点名缺参 |
| 12 | 错误 | `--max-calls 2` 而预计上界 3（缺省 1 副本 × 1 场景 × 1 模型 × N=1 × 1 用户轮 × `maxRounds` 3） | 拒绝启动，打印预计 3 / 上限 2 |
| 13 | 错误 | 两 run 版本不同（`compare.mjs`） | 段标 `not comparable`，无 Δ 列 |
| 14 | 错误 | 模型返回未声明工具名 | 该调用结果 `unknown tool: <name>`，`unknownToolCalls` = 1 |

## 7 边界（不做）

- 不判「有效 / 无效」，不设阈值——门槛由当次使用者写进那次跑批的记录。
- 不做文本类判据，不引入判官模型（首版只做动作类）。
- 不改产品面：`thincoder-core/prompts/` 零改；`prompt-overlays.mjs` / `prompt-files.mjs` / `tools/*` 只 import 不改。
- 不 import、不修改、不引用任何其它跑批工具（用户 18:30 令）。
- system 只到三档装配：不装 AGENTS.md / skills 尾部块（随项目变），不另做工具描述文本变体。
- 首版只装配 `SCENARIO_SLOT_FILES["engineering"]` 一个槽集（`thincoder-core/prompt-overlays.mjs:41`）；normal 模式的槽集不在首版范围——加槽集属夹具语义变化，须 bump `PROMPT_FIXTURE_VERSION`（2.8）。
- 不并发、不重试失败调用、不补跑。
- 不进集成套件，不改 RTM；不进产品包 / 不发布。
- 首版不出图、不出 PDF、不记成本（无价格源，记 usage token 即止）。

## 8 UI / 交互

无 UI：入口是 CLI（`run.mjs` / `compare.mjs`），产物是 `prompt-fixture/results/` 下的报告对。报告列集与统计口径固定在 2.7。无 `open` 项。

## 9 集成测试设计（RTM 增量）

已读 `test/RTM.md`（按端分节、节内按业务故事、一行一个集成用例）。

本批增量：**破坏 0 行 · 冗余 0 行 · 新增 0 行**。

理由：夹具是工程工具，不改变任何用户可见的业务结果；集成用例只有两个入口——产品真需要的业务场景，或生产真出现过的问题。本夹具两者都不成立，因此不产用例。
