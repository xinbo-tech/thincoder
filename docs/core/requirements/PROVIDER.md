# 供应商与模型（PROVIDER）· 核心统一子系统需求档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统需求档**（三层归属之需求层）。
> **工作流档**（需求层）= `docs/core/requirements/CORE-UNIFICATION.md` §1–§4 + §5 登记表（统一目标 / 边界原则 / 量级读数基线 / 范围边界）——本档**不复制**（D2 单一权威源）。
> **设计层** = `docs/core/design/PROVIDER.md`（本子系统设计与测试）；工作流设计档 = `docs/core/design/CORE-UNIFICATION.md`。
> 建档：2026-09-13（**需求侧拆分轮**——用户 2026-09-13 明令「需求侧文档先拆」）。**不新增需求**：条文分**搬移 / 回填 / 派生**三类并逐条标来源；无现成表述者由设计裁决派生，标「**派生 · 非用户原话**」。
> 命名与层级 = **板块镜像**（`requirements/<板块>.md` ↔ `design/<板块>.md`，**同板块名**）——规则原文见 CLI 产品地图 `thincoder-cli/docs/README.md` §3.2；三层归属见同图 §3.1。
> **需求条目面**（§4 · 2026-09-14「B 轮并入」）：**旧档缺**——CLI 侧无 `docs/requirements/PROVIDER.md` 镜像（需求层同档承载）；本批自旧设计档的需求层节并入**既有需求条目正文**（编号承旧档）——**无新增需求**。

## 1. 总体定位

供应商与模型 = 调用核心（`thincoder-core/provider/core.mjs` + `index.mjs` ↔ VSC `provider.mjs`）**+** 传输（`anthropic` / `google` / `responses`）**+** 基础件（`sse` / `retry` / `normalize` / `errors` / `abort-provenance`）**+** 限流（`rate.mjs`）**+** 模型清单（`list-models.mjs`）**+** 模型规格（`model-specs.mjs`）。
本板块对本子系统的要求 = 该面归一为**核内单一调用核心**，可见面变更**保留兼容并登记**。

> 面清单与逐面裁决（分类 / 端差处置 / 前提校验 / 归属段）→ `docs/core/design/PROVIDER.md` §1–§2（不复制）。

## 2. 功能性需求

### 2.1 本子系统条目

- **【派生 · 非用户原话】** 供应商与模型面归一为**核内单一调用核心**（`chat` / `createProvider` 语义）+ 传输分派与模型规格按核内结构归位；限流等待改为**可中断**、默认限流口径与 token 估算取并集；`list-models` 失败形态由**静默空清单**改为**明确报错**（登记 + CHANGELOG）。
  源 = 设计档 `PROVIDER.md` §2.1 #114 / #115 · §2.2 #138–#143 · §3.1 A19 / A20 · §4.1 第 8 行。
- **【F-PV1 · 批 1 · 2026-09-16 · 新条目】** 核事件 `onWait` 的相位值域（五相）与**状态文案映射单源在核**——
  消费面（CLI TUI 状态行 / headless stderr / ACP 日志）**不得各自枚举相位**；无相位分支可渲染的载荷 ⇒ **不显示**
  （禁 `undefined` 文案、禁兜底误标——空数值不得被填成兜底文案）。
  源 = 设计档 `PROVIDER.md` §6.20（本批实测：`warn` 相载荷无 `seconds` ⇒ 旧消费面兜底分支渲染
  `retry in undefineds` 且被误标 429）。
- **【2026-09-29 · 新条目 · 渠道收录判据成文】** 渠道收录**判据成文**（三判据 + 字段面纪律 + 运营商三家结论 + 自助路径）——判据单源 = 设计档 `PROVIDER.md` §6.21；长尾兜底 = `providers[]` 自由字段 + 交互添加（CLI ∕ VSC ∕ 桌面核表投影；区域端点变体走自助）。
  源 = 台账 #177（批 = `docs/batches/2026-09-29-provider-config-family.md`）；本批同时新增 `huawei` 预设（22 家——`PROJECT.md` C3 计数已随动）。
- **【2026-10-04 · 新条目 · responses 适配面健壮性三判据（台账 #907）】**
  ① **判据-D9**：构造 `type:"error"` 帧流 ⇒ parseStream **抛错或 partial 抢救**（分界 = 是否已有流出；禁止静默跳过）——T1–T4；
  ② **判据-D8**：`errors.mjs` 导出码级映射（最小集五码逐码断言 ∥ 未列码 null 透传）——T5–T6；
  ③ **判据-D5**：`buildBody` 仅显式 `maxTokens` 时发 `max_output_tokens`——T7–T8。
  源 = 批档 `docs/batches/2026-10-04-responses-robustness.md` §2 AC-1..4；设计 = `PROVIDER.md` §6.13 错误出口块 + D-PR34/35/36。〔评审 #5 发现 6：本条目落档时变更记录漏行——本行即补（父侧 2026-10-04 21:5x）〕

### 2.2 适用工作流条目（回指 · 不复制）

| 条目 | 适用于本子系统的哪一面 |
|---|---|
| F11 | 对称面**进核**的准入（供应商 / 模型面属「进核」集合） |
| F13 | 对外契约面：**输出 / 命令面**变更须**保留兼容**并登记（`list-models` 失败形态） |
| F12 | 凡改可观察行为 / 对外契约者**逐条提交裁定**（本面命中 ①②） |
| F6 | 裁决**逐条落实**（限流 / 排序 / 报错形态的归一结果） |
| F3 | 核内实现**只从两侧提取**（来源可追溯） |

## 3. 非功能性需求

本子系统无独立非功能条目。适用工作流条目（回指）= **N1**（未涉面不得无故回归）· **N2**（建核段两产品零改动 · 可回退）· **N3**（核独立可验证）· **N5**（单一权威源）· **N7**（零第三方依赖）· **N8**（结构尺度）。

## 4. 需求条目（自 CLI 产品档需求层节并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/design/PROVIDER.md` 的**需求层节**（该板块 CLI 侧**无 `docs/requirements/` 镜像**——需求层同档承载是既有形态；本批按需求层节归位）。
> **并入** = 需求条目正文（总体需求 / 功能性 / 非功能性 / 范围边界）——条目**编号与文本承旧档**（R1–R20 / N1–N9）。
> **不并** = 各批「归属注」「批次依据」注 · 状态行 · 变更记录（见 §5）。

### 4.1 模型选择面重构（旧档模型选择面需求层）

**总体需求**：可用模型清单的**权威 = provider 运行期拉取**（`GET /models`），不是人工维护的配置字段——`providers[].models[]` 候选清单整字段退场；**渠道不携模型**（单值 `providers[].model` ∥ 预设 `model` 全退场——2026-10-09 清除批）；模型身份唯二 = 顶层 `defaultModel`（复合串 `provider:model`）∥ 会话槽选定；缺 ⇒ 明示未设置、不静默回落；显式 `provider:model` **一律放行**；切换成功回显规格来源；VS Code 端同批对齐。

| # | 需求 | 判定句（验收口径——摘要） |
|---|---|---|
| R1 | 清单来源 provider 化（运行期拉取，按 format 各一份） | 三种 format 各有拉取实现；拉不到列表 = 该渠道不可选 |
| R2 | `providers[].models[]` 整字段删除 | 全仓无对该字段的读写（迁移读取除外）；渠道 `model` 键同规（2026-10-09 清除批——见 R3） |
| R3 | **渠道不携模型（单值 `model` 退场——2026-10-09 清除批）** | 全仓 `providers[].model` ∥ 预设 `model` 零读写（迁移清理除外）；需要模型处只认全局 `defaultModel`（复合串）或会话选定；缺 ⇒ 明示「未设置」——绝不静默回落 |
| R4 | 显式 `provider:model` 放行（仅三类无效） | 候选外 / 多冒号显式值返回 `ok:true` |
| R5 | 切换回显 spec 来源 | 切换后出现来源回显行；`DEFAULT_SPEC` 兜底时警示色 + 提示 |
| R6 | VSC 端同批对齐 | 面板候选同源；`resolveDefaultModel` 收形为全局 `defaultModel` 复合串直读（零渠道级静默回退） |
| R7 | 契约测试反转（随件） | 三族测试转新契约、双端跑绿 |
| R8 | 文档连带改写（随件） | 现状描述无「候选硬约束 / 候选外拒」残留 |
| R9 | 渠道准入校验（配置阶段） | 探通 / 探不通两态；探不通不入可选来源且**不阻断配置流** |
| R10 | 面板候选未命中 = 保持当前选择（范围追加） | 未命中零 `selectModel` / `selectReasoning` post |

**非功能**：N1 兼容（老配置形态迁移不丢凭据 / 不丢全局 `defaultModel`；渠道级 `model` 键由迁移清除）· N2 性能（热路径形态不变；准入校验只在配置阶段）· N3 单一权威（清单唯一权威 = 运行期拉取）· N4 双端独立（不做逐字硬一致、不加双端同步依赖）。

### 4.2 DeepSeek V4.1-Flash 接入（旧档第 6 批需求层）

**总体需求**：把两端 MODEL_SPECS 表更新到新事实（V4.1-Flash 以 `deepseek-flash` 上线；旧名退役但**当下即**路由；`deepseek-v4-pro` 限期路由）。

| # | 需求 | 判定句（验收口径——摘要） |
|---|---|---|
| R11 | 新增 `deepseek-flash` 行（含 `multimodal: true`） | 双端 spec 表含该行；`specForModel` 命中该行；read_image 门放行 |
| R12 | `deepseek-v4-flash` 行对齐 V4.1 Flash | 行字段 = 契约（`multimodal` 为真）；行为面允许读图 / 贴图 |
| R13 | `deepseek-v4-flash-vision-exp` 行对齐（注释标退役 / 路由） | 行保留且字段 = 契约；行注释含退役 / 路由说明 |
| R14 | `deepseek-v4-pro` 行保留 + 注释（**不加 `multimodal`**） | 行字段零改；注释含路由日期 |
| R16 | 文档连带（随件） | 节落档；双端三机检本批文件新增 0 |
| R17 | 测试面同步（随件） | 双端 `npm test` 全绿（本批面） |

**注**：R15 已退场——判据对象（预设 `deepseek.model` 比较）随渠道单值模型退场删除（2026-10-09 清除批；见变更记录）。

**非功能**：N5 零行为回归 · N6 双端独立同源 · N7 退役语义可判定（重评入口显式——路由生效后复检）。
**范围边界（不做）**：不改 spec 前缀匹配机制本体；不改其它厂商任何 spec 行；不做「按日期切换规格」的运行期机制；不动用户本机配置；不改多模态消费链。

### 4.3 `provider.headers` 全通路铺开（旧档第 32 批需求层）

**总体需求**：用户为渠道声明的静态定制头（`providers[].headers`）在主聊天通路已生效，而 responses / anthropic / google 三 transport 与会话标题生成**不携带该头**——本批把静态定制头铺到全部通路：**只铺开、不改语义、不引入新机制**。

| # | 需求 | 判定句（验收口径——摘要） |
|---|---|---|
| R18 | 四遗漏通路补展开（顺序对齐 core：定制头前、内置头后） | 逐通路机验：定制头出现在该通路请求头里；同名冲突时内置头胜出；无定制头配置时头集合逐字一致 |
| R19 | 测试面随件（逐通路行为锁） | `node --test test/provider-headers.test.mjs` 全绿（**载体已随 2026-09-28 测试树全清退场——本行判据 as-of 批次窗**）；`npm test` 全绿 |
| R20 | 文档面随件 | 本档三层落档；机检本批文件新增违规 0 |

**非功能**：N8 零行为回归（未配置 headers 时头集合逐字不变）· N9 覆盖语义对齐（同名时内置头胜出；`Authorization` 装载面剥离语义不变）。
**范围边界（不做）**：不实现会话动态头；不改头语义；不动已展开面；不动 embedding 独立渠道；不碰 VS Code 端；不新建档。

### 4.4 qwen-plan 渠道名接入（`deepseek-v4.1-flash` · 2026-09-15 · 用户快车道）

**总体需求**：qwen-plan 渠道（provider `qwenplan`、baseURL `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`）上的 DeepSeek
V4.1-Flash 模型名为 `deepseek-v4.1-flash`（2026-09-15 实测：GET /models 200 含该名 · chat 200）——该名不命中核内 MODEL_SPECS 任何前缀
（`.1` ≠ `-`）→ 前缀查表 miss（`specForModel` 回落）→ 未知模型警告 + 回落 128K 默认 spec，1M 上下文用不上。本批在核内 MODEL_SPECS **增加该行为独立行**，
能力位**逐字段对齐 `deepseek-flash`**（含 `multimodal: true`——用户 04:01 拍板），使 qwen-plan 渠道的该模型获得真实能力规格。

| # | 需求 | 判定句（验收口径——摘要） |
|---|---|---|
| R21 | 核内 `MODEL_SPECS` 新增 `deepseek-v4.1-flash` 行，能力位逐字段对齐 `deepseek-flash`（1M ctx / 384K out / thinking / prefixMode / thinkApi type / reasoningEcho required / reasoningEffortEnum low·high·max / tempRange [0,2] / **multimodal true**） | `specForModel("deepseek-v4.1-flash")` 逐字段 deepEqual `specForModel("deepseek-flash")`，且 context = 1_000_000 · thinking true · prefixMode true · multimodal true；`specMatch` 返回 `matched: true`（未知模型兜底分支不进入） |

**非功能**：N10 1M 上下文命中（specForModel 返回 context = 1_000_000——压缩阈值 / 续写协议 / 规格显示跟随真实能力）·
N11 零前缀回归（既有 deepseek 前缀命中行为不变：`deepseek-v4-flash` / `deepseek-v4-flash-0731` 仍命中退役行、`deepseek-v4-pro` 仍保守行——新行与退役行
前缀不相交（第 12 位 `.` 与 `-` 互不为前缀）⇒ **互不 shadow**）·
N12 零 VSC 触碰（`thincoder-vscode/**` 一字不改——VSC 未迁移，自持副本不动）。

**范围边界（不做）**：不改 spec 查表机制本体（前缀匹配 / namespace 剥离不变）；不为该名引入别名 / 归一化机制（`deepseek-v4-flash-0731`
前缀命中实证 = 纯前缀足够；与 D-PR19 同源）；`deepseek-v4-flash-0731` **不**加行；不改其它厂商任何 spec 行；不动预设 `qwenplan`
（其模型携带面已随 2026-10-09 清除批退场——§4.1 R3）；不改多模态消费链；不动用户本机配置；不 commit、不发起评审。

### 4.5 VSC 端图片输入与贴图降级条目（并入 · 2026-09-15 终收批）

> **来源** = `thincoder-vscode/docs/design/IMAGE-DOWNGRADE-VISION.md` 的需求节（F-1–F-4 语义）——设计侧落地 = `docs/core/design/PROVIDER.md` §6.18。**编号系 = 本子节自有**（F-IDG / N-IDG——与 §2 的 F 系、§4.1–§4.4 的 R 系并列，不互指）；**本子节 = VSC 端面条目（非核心统一面条目）**——随 §8B #4 终收批并入。

**总体需求**：非视觉模型贴图时不再硬报错——自动降级为视觉模型子代理读图返回文本描述注入主会话（用户无感换模型）；无视觉渠道 / 降级失败时保留可读报错（不静默丢图）。

| # | 需求 | 判定句（验收口径——摘要） |
|---|---|---|
| F-IDG-1 | VSC 贴图自动降级（depth-0） | 非视觉模型 + 贴图 + 有视觉渠道 → 视觉子代理读图 → 描述注入 → 主回合继续——不 throw |
| F-IDG-2 | fallback 可读 | 无视觉渠道 / spawn 失败 / 超时 / 空返回 → 保留现可读报错（不静默丢）；降级窗内 ⏹ 有效（启动即中止——at-most-half-a-turn） |
| F-IDG-3 | CLI 镜像软引导 | CLI 非视觉 read_image 错误文案含「spawn 视觉模型子代理读图」引导（不硬自动降级） |

**注**（2026-10-09 清除批）：F-IDG-1 的「有视觉渠道」判定源（渠道单值模型）随渠道默认模型退场——判定重定在途（台账 #1125）；现行为 = 恒走 F-IDG-2 径（可读报错——不静默丢图）。

**非功能**：N-IDG-1 视觉模型路径零回归（read_image 注入不变）· N-IDG-2 引擎级 spawn 通道零新建（降级 = extension 内 runAgent 一次性直跑）· **N-IDG-3 VSC 贴图临时件有界**（2026-09-30 · #735）：贴图落盘写时对 `<cwd>/.thincoder/tmp` 执行 mtime 扫除（窗 = 3 天；核 `cleanupOldToolResults` 单源，与 CLI 同形）。
  判定句：置超龄件（mtime > 3 天）后经一次贴图落盘 ⇒ 超龄件被回收 ∧ 未超龄件保留 ∧ 落盘出口 `{paths, dropped}` 零变。
**范围边界（不做 / 移出）**：UI 前置（模型下拉 vision 标记 + 贴图前提示）= UX 增强后批（F-4 移出本批）；`depth>0` 子代理回合非视觉贴图沿用现报错（不降级）；非 raster（svg / heic）现 toast 不变；retry 不回带 images（另行登记）；`maxTurns` 固定 10（观察登记——候选按图数伸缩）。

### 4.6 模型规格查表 · 命名空间取末段（测试服务器 GLM-5.3 形报障 · 2026-10-10 · 用户报障）

**来源（用户逐字）**：2026-10-10 02:56「thincoder匹配model_spec的时候应该忽略大小写。」+ 03:01「thincoder使用测试服务器提供的GLM-5.3系列的几个模型时会报model_spec没找到。」+ 03:05「只取最后一段就可以。」（修法裁定——取代主 agent 初报的「逐段迭代」形）

**症状与根因（父侧实跑复现 · 2026-10-10 03:0x）**：测试服务器（ECS 10.0.0.5）清单内 `qwen/ZHIPU/GLM-5.3` ∥ `qwen/ZHIPU/GLM-5.3-FlashX` 两名 ⇒ `specMatch` 判 `matched:false` ⇒ 告警 + `DEFAULT_SPEC`（128K/32K）。
同清单其余名（抽测：裸名 `glm-5.3-flash` ∥ 单段 `qwen/qwen3.7-max` ∥ `deepseek/deepseek-flash`）全命中。根因 = `lookupSpec` 命名空间剥离为**单跳**（`thincoder-core/model-specs.mjs:268-274`——只剥首个 `/` 前一段、重试一次）。
服务端外标 = `provider/上游名`，而上游名自身含厂商前缀（`ZHIPU/GLM-5.3`）⇒ 双段，单跳后得 `zhipu/glm-5.3` 仍无行命中。

**大小写口径（用户首判之澄清——实跑钉证）**：查表双侧现行已 `.toLowerCase()`（`thincoder-core/model-specs.mjs:263-265`）——`Qwen/ZHIPU/GLM-5.3` 与 `qwen/ZHIPU/GLM-5.3` 实跑同判（均未命中）⇒ 大小写非本障成因；本项保留不敏感口径，且要求其不随剥离逻辑回归。

| # | 需求 | 判定句（验收口径——摘要） |
|---|---|---|
| R22 | `lookupSpec` 命名空间兜底改**取末段**（完整名未命中且含 `/` ⇒ 取最后一个 `/` 之后的段重试前缀匹配——`qwen/ZHIPU/GLM-5.3` ⇒ `glm-5.3` 命中；单段名两法等价、零回归）；大小写不敏感口径不变；未知名回落语义零变 | ① `specMatch("qwen/ZHIPU/GLM-5.3").matched === true` 且 context = 1_000_000（`glm-5.3` 行）；② `specMatch("qwen/ZHIPU/GLM-5.3-FlashX").matched === true`（`glm-5.3-flashx` 行）；③ 大小写变体（`Qwen/ZHIPU/GLM-5.3`）与①同判；④ 既有面零回归（单段 `ZHIPU/GLM-5.3` ∥ 裸名 `glm-5.3-flash` ∥ 单段对照 `qwen/qwen3.7-max`）；⑤ 未知名（如 `zzz/unknown-x`）仍 `matched:false` + `DEFAULT_SPEC` 兜底 |

**非功能**：N13 热路径形态不变（查表仍为纯函数前缀扫描——多段名 = 一次末段重试）· N14 过匹配防回归（未知名仍兜底；既有单段命中面逐一回归）。

**范围边界（不做）**：不改规格表任何行值 ∥ 不改 `SORTED_SPECS` 排序机制 ∥ 不改告警文案与回退语义 ∥ 不动服务器侧外标形（`provider/model` 不变）∥ 不引入别名映射表。
**VSC 同判随正（在册交付面）**：`thincoder-vscode/src/specs.mjs:55-57` 单跳 ⇒ 取末段，随本批落（父裁 2026-10-10 03:2x · #44 上抛）；守卫为既有端差（核 `slash > 0` ∥ VSC `slash >= 0`——首位斜杠形 `/glm-5.3`：核 miss ∥ VSC 命中 `glm-5` 默档），本批不动、显式认账。


## 5. 不并项与历史沿革（B 轮 · 2026-09-14）

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 各批「归属注」段（「Provider 板块无 `requirements/` 镜像——本批需求层同档承载」+ 批次依据） | 归属与批次来源指针 | 时点材料——**本次 B 轮已将需求层归位到本档**；旧注为迁出前历史 |
| 各批需求层节的状态行（「均已实施并核销」） | 交付状态标记 | 时点状态——归批次档 / 台账 |
| 各批「范围边界」中与实现机制绑定的行（如「不做双端同步依赖 / 逐字硬一致」） | 重复的非功能声明 | 已归入 N4 / N6（同一语义，不重复登记） |
| 变更记录（旧设计档） | 逐批流水账 | 历史叙述——旧档即其载体；设计侧变更见 `docs/core/design/PROVIDER.md` |
| `IMAGE-DOWNGRADE-VISION.md`（VSC 设计档）批次面 | 受影响文件表 / 用例表 / AC 表 / 状态行 / 变更流水 | 一次性批次材料——机制与契约已入设计档 §6.18 · 需求条目已入本档 §4.5；旧档 = 参照历史 |

## 变更记录

- 2026-09-13：建档——自 `docs/core/requirements/CORE-UNIFICATION.md` 拆分（来源：§2 F11 / F13 / F12 回指）+ 设计档 `PROVIDER.md`（§2.1 #114 / #115 · §2.2 #138–#143 · §3.1 A19 / A20 · §4.1 第 8 行 派生）；**无新增需求**。
- 2026-09-14（**B 轮并入 · 第 2 批**）：新增 §4 **需求条目**（模型选择面重构 R1–R10 / N1–N4 · DeepSeek V4.1-Flash 接入 R11–R17 / N5–N7 · `provider.headers` 全通路铺开 R18–R20 / N8–N9——自旧设计档需求层节并入需求正文；**编号与文本承旧档**）+ §5 **不并项与历史沿革**；**本档新增需求 0**（纯回填）；首部加需求条目面指针一行。
- 2026-09-15（**qwen-plan 渠道名接入批**）：新增 §4.4 需求条目 **R21** / N10–N12（`deepseek-v4.1-flash` 加行——qwen-plan 渠道实测模型名；能力位逐字段对齐 `deepseek-flash` 含 multimodal；零 VSC 触碰；零前缀回归）。
- 2026-09-15（**评审修正轮** · eng-designer）：§4.4 总体需求段 `lookupSpec` 符号改「前缀查表 miss（`specForModel` 回落）」（与设计层统一用语）；N11 论证口径改前缀不相交（第 12 位 `.` 与 `-` 互不为前缀——长度排序既不充分也无必要）。
- 2026-09-15（**终收批 · §8B #4 并入** · eng-designer）：新增 §4.5 **VSC 端图片输入与贴图降级条目**（F-IDG-1–3 / N-IDG-1–2——自 VSC 设计档 `IMAGE-DOWNGRADE-VISION.md` 需求节并入 · 编号系本子节自有）；§5 补登记行；**本档新增需求 3 条**（VSC 端面——非核心统一面条目）。
- 2026-09-16（**批 1 CORE-DEFECT-FIXES** · eng-designer）：§2.1 新增条目——`onWait` 相位值域与状态文案映射单源在核（消费面禁各自枚举 · 禁 `undefined` 文案 · 禁兜底误标）；源 = 设计档 §6.20；条目号 **F-PV1**（批次档 §2 / 设计档 §6.20 同号引用）。
- 2026-09-29（**provider-config-family 批 · 需求新增 · 父侧直接执行 · 可 revert**——承用户 20:45 请求「陈年导入你就不管了吗？」；台账 #177）：§2.1 新增条目「渠道收录判据成文」（判据单源 = 设计档 `PROVIDER.md` §6.21；本批同时新增 `huawei` 预设——`PROJECT.md` C3 计数 21→22 已随动）；**本档新增需求 1 条**。
- 2026-09-30（**#735 · N-IDG-3 新增 · 主 agent 落笔**〔父侧直接执行 · 可 revert〕——承批 `docs/batches/2026-09-30-vsc-paste-cleanup.md` §2.7（设计轮草案）· 用户 18:24 ∥ 18:28 令）：§4.5 非功能段新增 **N-IDG-3**（VSC 贴图临时件有界——写时 mtime 3 天窗扫除 ∥ 核 `cleanupOldToolResults` 单源）；源 = 台账 #735（pairfix §2 F-1 上抛：VSC 贴图件无自动清理实锤）。
- 2026-10-02（**文档清账轮 · 执行轮 3（core/requirements + cli + vsc）· eng-designer**——承 `docs/batches/2026-10-02-doc-settlement-round.md` §2.3 · 台账 #806）：宽面 1 行折行（132——语义零改）。**零新语义**。
- 2026-10-03（**死指针收正 · 主 agent 直接执行 · 可 revert**——承 crash-guards 批修复轮报备）：§4 R19 载体注收正——`test/provider-headers.test.mjs` 已随 2026-09-28 测试树全清退场（本行判据 as-of 批次窗），消除死指针。**零新语义**。（迁移期引文）
- 2026-10-04（**#907 判据条目落档 · 主 agent**）：§2.1 新增 responses 适配面健壮性三判据条目（判据-D9/D8/D5——批 `docs/batches/2026-10-04-responses-robustness.md` §2；设计 = `PROVIDER.md` §6.13 + D-PR34/35/36）。〔评审 #5 发现 6：落档时漏行，本行随补〕
- 2026-10-09（**清除批 · 需求档同拍 · 主 agent**〔自动跑完授权 · 可 revert〕——承批 `docs/batches/2026-10-09-provider-default-model-purge.md` · 台账 #1122）：§4.1 R3 立法句收正（**渠道不携模型**——单值 `providers[].model` ∥ 预设 `model` 全退场；模型身份唯二 = 顶层 `defaultModel`（复合串）∥ 会话槽选定；缺 ⇒ 明示「未设置」不静默回落）+ R2 ∥ R6 ∥ N1 同拍；§4.2 总体需求句 ∥ §4.4 边界句随正；**R15 退场删除**（判据对象随清除对象不存在——表后注在册）；§4.5 F-IDG-1 判定源退场注（渠道单值模型退场——重定在途 · 台账 #1125）。**本档新增需求 0**（收正 + 退场登记）。
- 2026-10-10（**模型规格查表命名空间取末段 · 需求新增 · 主 agent 直接执行 · 可 revert**——承用户 2026-10-10 02:56/03:01 报障）：新增 **§4.6**（R22 / N13–N14）——测试服务器 `qwen/ZHIPU/GLM-5.3` 形误报 spec not found（父侧实跑复现：`qwen/ZHIPU/GLM-5.3` ∥ `qwen/ZHIPU/GLM-5.3-FlashX` = `matched:false`；根因 = `lookupSpec` 单跳剥离 `thincoder-core/model-specs.mjs:268-274`；大小写非成因——`:263-265` 双侧已小写化，`Qwen/` 变体同判）；修向 = 取末段（用户 03:05 裁「只取最后一段就可以」）。**本档新增需求 1 条**。
