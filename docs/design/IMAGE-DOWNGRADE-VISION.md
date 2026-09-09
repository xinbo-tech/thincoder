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

## 变更记录
- 2026-09-09：落档（勘察一手——拦截只拦格式 / 判定唯一在 appendImagePointer throw / 图片 throw 前已落盘 / read_image 注册门按模型 multimodal / 子代理模型 override 已机械支持（model 参数→resolveChildProvider）/ **引擎级 spawn 通道不存在**——降级 = extension 直跑 runAgent 一次性 / CLI 软失败（read_image 工具错误——预填命令形态）/ 返回形态裁定 = 文本描述替换 images——无图污染兼容）。
