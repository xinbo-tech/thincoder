# 贴图自动降级视觉子代理（IMAGE-DOWNGRADE-VISION）

> 板块：贴图处理链（双端——VSC 主 + CLI 镜像）。权威源：MODEL_SPECS（multimodal 判定）+ setup-reminders appendImagePointer。
> 状态：**评审通过——已交付（VSC bd7c803 + CLI 1090eb4——clean——advisor pass 0 修正轮——VSC 243/0 + CLI 210/0——L2 待链稳定）**——2026-09-09 落档

---

## 需求

- **总体目标**：非视觉模型贴图时不再硬报错——**自动降级为视觉模型子代理读图**返回文本描述注入主会话——用户无感换模型（VSC 主——CLI 镜像软引导）。
- **功能性**：
  - F-1（VSC 自动降级）贴图到非视觉模型 → 引擎自动先跑视觉渠道子代理读图（复用 runAgent/runChild 机制——视觉模型 override）→ 文本描述注入用户消息 → 主回合正常继续——不 throw
  - F-2（fallback）无视觉渠道/降级 spawn 失败 → 保留现可读报错（用户可见 fallback——不静默丢图）
  - F-3（CLI 镜像）CLI 非视觉 read_image 工具错误 → 错误文案引导自动降级（提示模型可 spawn 视觉子代理 read_image——CLI 软失败已可——加引导）
  - F-4（UI 前置——**评审 #3 裁定移出本批**——UX 后批：模型下拉 vision 标记——本批聚焦降级机制——
    settings.mjs/webview 零动）
  - **范围边界**：引擎级新 spawn 通道不建（勘察确认不存在——降级用 extension 内 runAgent 一次性直跑——不走 agent-tools 池）；retry 不回带 images（现缺陷——另记）；非 raster（svg/heic）现 toast 不变；视觉模型路径零动；
    **depth>0 子代理回合非视觉贴图沿用现报错（评审 #5——不降级——边界明示）**。

## 设计（勘察落点——照做勿自行解释）

### 1. VSC 降级链（appendImagePointer 分支——setup-reminders.mjs:254-256）
- 现状：`!spec.multimodal` → throw（图片已落盘 `.thincoder/tmp/paste-*.png`——throw 前 routeUserTurn 已存）
- 改（评审 #1 定稿——**extension 层预跑**——appendImagePointer 保持同步零动——无图到不了 throw）：
  1. **触发点 = routeUserTurn**（panel-messages.mjs——savePastedImages 后、_chat 前）：检测非视觉模型
     （specForModel(provider.model).multimodal 为假）+ images 非空 + depth-0 → 降级分支
  2. 从 config-io resolveProviders 找视觉渠道（models 中任一 multimodal——优先同名渠道视觉模型 → 首视觉渠道）
  3. 有视觉渠道 → extension 内直跑一次性视觉子代理读图（runAgent(视觉渠道, 任务书 "用 read_image 读
     <路径> 返回图像内容描述")——复用 runChild/runAgent 换渠道模式）——**超时 60s**——图描述文本返回
  4. 描述注入：text 改 `[图片 <路径> 描述: <视觉子代理描述>]`——images 清空——主回合正常跑
  5. 无视觉渠道 / spawn 失败 / 超时 / 空返回 → fallback 现报错文案（可读——不静默丢）
- 注：子代理跑者注入 seam（评审 #6——参数注入 + ?? 默认——测试 mock）——panel UI 回调直通（降级在
  runPanelChat 回合内——主回合未发 LLM 请求前——loading 已 running 不需翻转）
- 返回形态裁定：**文本描述替换 images**（勘察确认"视觉子代理读图 → 文本描述回传与现机制完全兼容——无图污染"）

### 2. CLI 镜像（F-3——软引导）
- CLI read_image 工具错误文案（file.mjs:163-171——非视觉 throw）→ 追加引导："模型不支持图像——可 spawn 一个视觉模型子代理（subagent model 参数指视觉渠道）读图"——CLI 粘贴路径已预填 read_image 命令——模型收到错误后自选降级路径（软——模型自主）
- 硬自动 CLI 不做（CLI 无 extension 式主回合引擎包装——粘贴即用户主动命令——软引导足够）

### 3. UI 前置（F-4——移出本批——评审 #3）
- 模型下拉 vision 标记 + 贴图前提示 = UX 增强——无 AC 用例支撑——**后批**（本批降级机制先行——机械兜底已在引擎
  ——F-4 到时独立用例/AC）

## 受影响文件（双端）

| 文件 | 端 | 现行数（实测） | 预计净变 | 改动 |
|---|---|---|---|---|
| src/agent/setup-reminders.mjs | VSC | 288 | **零改（评审 #1 定稿——appendImagePointer 不动）** | — |
| src/extension/panel-messages.mjs | VSC | 444→463 | +19 | F-1 降级触发（routeUserTurn 预跑分支） |
| src/extension/image-handler.mjs（交付 OOL 补行——跑者落 paste-图域同族） | VSC | 53→81 | +28 | runVisionReader + 60s 超时 |
| src/config-io.mjs | VSC | 499 | 零改（vision-channel 独立——不接线——交付注） | — |
| src/config-io.mjs + 视觉渠道查找 helper（新——评审 #2：config-io 499 撞 500 硬限——helper 独立新文件
  vision-channel.mjs 新 ≤40——config-io 只接线） | VSC | 499 | helper 新 + config-io ≤+2 | resolveProviders 扫 multimodal |
| （F-4 移出本批——评审 #3：无 AC 用例——UX 后批——settings.mjs/webview 零动） | VSC | — | — | — |
| src/tools/file.mjs | CLI | 467→470 | +3 | F-3 错误文案引导（评审：行数实测 467——非 190 区） |
| test/image-downgrade.test.mjs（新——评审 #6 跑者注入 seam） | VSC | 新 | 新 ≤120 | 非视觉+有图 → 视觉子代理读图 → 描述注入；无渠道/失败/空返 → fallback；视觉模型零动 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 正常降级 | 非视觉模型 + 贴图 + 有视觉渠道 | 视觉子代理读图 → 描述注入 → 主回合跑——不 throw——F-1 |
| F-1 视觉模型 | 视觉模型 + 贴图 | 现路径（read_image 注入）零动——F-1 |
| F-2 fallback | 非视觉 + 无视觉渠道 | 现可读报错保留（不静默丢）——F-2 |
| F-2 spawn 失败 | 视觉渠道调不通 | fallback 报错——F-2 |
| F-3 CLI | 非视觉 read_image | 错误 + 引导句（spawn 视觉子代理）——F-3 |

## 验收

- AC-1 VSC 非视觉贴图自动降级（视觉子代理读图——描述注入——主回合继续——测试绿）
- AC-2 视觉模型路径零回归（read_image 注入不变）
- AC-3 fallback 可读（无渠道/失败 → 现报错）
- AC-4 CLI 错误文案含引导（spawn 视觉子代理）
- AC-5 VSC npm test 快层零回归
- 红线：视觉模型路径零动；引擎池/spawn 通道零新建（extension 直跑 runAgent 一次性）；非 raster toast 不变

## 跟进修复（群 A 批 A12——2026-09-11）

> 来源：`docs/TODO.md:166`（IMAGE-DOWNGRADE 跟进项——①已闭合）——用户 2026-09-11 17:08 裁定：
> ③ 修（降级窗内 Stop 无动作）；② 登记观察（maxTurns）。

### ② maxTurns 固定 10——观察登记（不改）

`runVisionReader` 的 maxTurns 固定 10（`image-handler.mjs:77`）——大贴图/多图读图可能超限落
F-2 fallback；候选（按图数伸缩 `2+paths.length*2`）在 TODO 在案。**本批不改**（观察——出现实证后再裁）。

### ③ 降级窗内 Stop（⏹）无动作——修复（根因 + 契约）

**根因（as-of 2026-09-11 实测）**：降级窗 = `routeUserTurn`（`panel-messages.mjs:80-89`）内
`await (visionReader ?? runVisionReader)(…)`（≤60s；窗内 `:81` 已 `_publishTurnState("running")`——⏹ 可见可点）。
⏹ → `{type:"abort"}` → abort case（`panel-messages.mjs:201-222`）的 `_turnState === "running"` 分支：
`_abortController` = 上回合遗留——① 未 aborted 僵尸（上回合正常结束）→ 不置闩、`abort()` 命中僵尸（交付无效）；
② null → 置闩但 `_chat` 入口 `panel-chat.mjs:129` 无条件清闩（防陈旧闩）→ 闩丢失。两路皆静默无效。

**契约（C-MA12-1..6）**：

| # | 契约点 | 规则 |
|---|---|---|
| C-MA12-1 | 降级窗 controller 上挂 | `routeUserTurn`：窗前建 `AbortController` 挂 `panel._visionAbort`；`finally` 清理（仅当仍指向本窗 controller——幂等） |
| C-MA12-2 | 取消缝（跑者） | `runVisionReader({ paths, providerName, cwd, signal })`——`signal?.addEventListener("abort", () => ac.abort(), { once: true })`（桥接内部 60s 超时 controller；既有 catch → `null` 语义复用——零新返回形态）；`signal` 缺省 = 现状（向后兼容） |
| C-MA12-3 | abort 定向（host） | `panel-messages.mjs` abort case 的 `running` 分支内**优先**判 `panel._visionAbort`（非空且未 aborted）→ `abort()` + `break`（不再落僵尸交付路径） |
| C-MA12-4 | 停后语义 = 启动即中止 | 窗被 Stop → await 快速返回 `null` → 照常 `panel._chat(...)`（用户消息入 history——at-most-half-a-turn，与 C1 Startup 闩同构）→ **`_chat` 调用后置 `panel._abortRequested = true`**——`newTurnController`（`panel-chat.mjs:55-63`）消费 → 回合建立即 abort |
| C-MA12-5 | 零新增布尔状态 | `stopped` 判定 = `vad.signal.aborted`；唯一新字段 = `panel._visionAbort`（临时——窗生命周期） |
| C-MA12-6 | 边界 | Ctrl+I（interrupt）面与视觉模型/无图/susp 路径零动；maxTurns 不改（②）；池/spawn 通道零动 |

**受影响文件（行数口径 = `split("\n").length`；as-of 2026-09-11 实测）**：

| 文件 | 当前行数 | 预计增量 | 改动 |
|---|---|---|---|
| `src/extension/panel-messages.mjs` | 468 | +10 ± 4 | 窗 controller 上挂/清理 + abort case 分支 + `_chat` 后置闩 |
| `src/extension/image-handler.mjs` | 81 | +7 ± 3 | `signal` 参数 + 桥接 |
| `test/image-downgrade.test.mjs` | 158 | +45 ± 15 | T-MA12-1..3 |

**用例表（T-MA12-1..3）**：

| # | 类型 | 输入 | 预期输出 |
|---|---|---|---|
| T-MA12-1 | 正常 | stub 面板 + mock 跑者（挂起——监听 `arg.signal` abort → reject）；窗未决时 `handlePanelMessage(panel, {type:"abort"})` | `panel._visionAbort.signal.aborted === true`；await 提前返回；`_chat` 被调（消息在——不丢）；`panel._abortRequested === true`（闩落位） |
| T-MA12-2 | 边界（零回归） | 无降级窗（`_visionAbort` 缺省）abort 消息 | 既有分支行为零变（僵尸交付路径保持） |
| T-MA12-3 | 边界（缝兼容） | 直调 `runVisionReader`：① 预 aborted signal → `null`（不等 60s）；② 不传 signal（现状）→ 无渠道 `null` | ① 快速失败 ② 现状零变 |

**验收**：AC-MA12-1 = T-MA12-1 绿；AC-MA12-2 = T-MA12-2 / T-MA12-3 绿 + 快层绿；AC-MA12-3 = 既有
`image-downgrade` 全族零回归 + `check-doc-width` 新增 0。

**边界**：只修 ③；② 只登记；interrupt 面（窗内 Ctrl+I 维持现行为——同族观察）零动；不 commit。

## 变更记录
- 2026-09-11（群 A 批增补 A12）：跟进节——② maxTurns 观察登记（不改）+ ③ 降级窗内 Stop 无动作修复契约（C-MA12-1..6 / T-MA12-1..3 / 根因两路失效实证）。
- 2026-09-09：落档（勘察一手——拦截只拦格式 / 判定唯一在 appendImagePointer throw / 图片 throw 前已落盘 / read_image 注册门按模型 multimodal / 子代理模型 override 已机械支持（model 参数→resolveChildProvider）/ **引擎级 spawn 通道不存在**——降级 = extension 直跑 runAgent 一次性 / CLI 软失败（read_image 工具错误——预填命令形态）/ 返回形态裁定 = 文本描述替换 images——无图污染兼容）。
