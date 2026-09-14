# VSC 产品定性（PROJECT）· 需求 — VSC 部分

> 部分 = **vsc**（`docs/vsc/`）；本档 = VSC 端产品定性与专有面需求（界面 / 入口 / 审批 / webview 形态 / 会话流时序）。
> 产品级定性与跨产品共享契约 = `docs/core/requirements/PROJECT.md`（本批同 split——切分规则见其 §5.2，本档不重述，D2）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 5**——`thincoder-vscode/docs/requirements/PROJECT.md` 拆分重建：VSC 专有面 ⇒ 本档；
> 旧档原地一字不改、留作参照历史）。

## 1. 总体定位

VS Code 扩展 = ThinCoder 产品族的独立产品之一（与 CLI 同级——关系与共享契约见 `docs/core/requirements/PROJECT.md`）。
本档登记**仅本端**的产品决策与需求：界面形态、宿主入口、审批面、webview 实现形态，以及 webview 面的待设计需求。

## 2. 本端产品决策（已定）

| 项 | 决策 | 备注 |
|---|---|---|
| 界面 | VS Code Webview（iframe） | HTML/CSS/JS，`postMessage` 通信——机制权威 = `WEBVIEW.md`（同层三档） |
| 入口 | `extension.mjs` → `activate()` | 标准 VS Code 扩展激活模式 |
| 宿主 API | VS Code Extension API | 零 npm 运行时依赖的宿主面（产品族定性 = `docs/core/requirements/PROJECT.md §2`） |
| LLM 调用 | 原生 `fetch` + SSE 流式 | OpenAI 兼容协议，支持 reasoning / thinking |
| 工具审批 | `autoApprove` 会话级槽位字段，默认 `false` | AUTO 按钮 / approve-all 翻转；agent 循环 live 读取，mid-turn 立即生效 |
| 模型能力 | 自包含 `thincoder-vscode/src/config.mjs` | MODEL_SPECS 表本端独立维护（preset 表权威 = CLI——见 core 档 C3） |
| Session 标题 | LLM 自动生成（首条消息后触发） | 失败静默降级为截断消息 |
| 协议 transport | 三协议均已实现 | `thincoder-vscode/src/provider/transports/`（openai / anthropic / google——契约 = core 档 C4） |
| 模型选择 webview 形态 | hover flyout 子菜单 | 两级语义对齐 CLI（契约 = core 档 C5）；webview 无键盘导航 ⇒ 主下拉列 provider 行 + hover 弹出模型子菜单 |
| 安全边界 | 透明 + 默认保守 + 信任用户判断 | 不搞命令级沙箱；开启 AUTO 时弹一次性警告；审计靠 git + 聊天历史（不建独立审计日志）；prompt injection 防御 v2 再议 |
| Multi-root 策略 | 目标 = 所有文件夹对 Agent 可见 | 现状 = `workspaceFolders[0]`；状态栏标明工作目录（用户知道限制） |
| Webview 技术选型 | vanilla JS | 约 5000+ 行（2025-08-14 时点）仍不值得引入框架；撑不住了再迁 |
| 国际化 | 中英双语 | `locales/en.json` + `locales/zh.json`；UI 文本集中 i18n 常量文件，webview 启动注入 |

## 3. 待设计需求：会话流时序对齐 CLI（2026-09-09 用户需求点）

> owning board = **webview 面**（panel/webview——P2 专有面）。状态 = C 层深勘察在途，设计 / 评审 / 实现链后续推进。

用户反馈：VSC 会话流时序「乱 / 不清晰」——与 CLI 差距大。对比勘察结论：双端 agent 核心（runAgent / run-stages / suspension 状态机）几乎同构——**时序差距全在 UI 呈现层**。

- **机制根源（勘察对比表）**：CLI = 单 state / 单 writer / 整帧重绘 / 块原地生长——事件乱序无害（下帧收敛）；
  VSC = 无串行化消息路由（R9）+ 多镜像忙态（R4）+ 多生产者事件直写 DOM + 子代理块跨位置移动（R5）+ 会话打开波浪式落地（R2）——事件相对顺序直接决定视觉顺序。
- **成因排序**：R6 命令直发绕过 `_turnActive` 守卫（最硬竞态——回合中触发先 abort 再开新回合）→ R5 子代理块位移（live 底部面板 → settle move 进对话流）→ R2 波浪式恢复 → R4 多 writer 竞争 → R3 回合边界磁盘往返 + 后置标题 LLM → R8 启发式子回合识别。
- **分层方案（用户裁全做——非三选一）**：
  - **C 层（先行——架构级）**：R9 webview 消息路由加串行队列 + R4 忙态收敛单一状态机（host / webview 双端单状态机 + 单 writer）。
  - **A 层（后做——局部快赢）**：R6 sendMessage 补 `_turnActive` 守卫 + R4 状态行收敛单 writer + R3 标题移回回合内。
  - **B 层（后做——结构）**：R5 子代理块原地（live 块直接长在对话流）+ R2 会话打开原子化（单 status 快照消息）。
- **实现顺序理由**：C 在 A / B 前——先建串行 + 状态机地基，再加固具体路径。

## 4. 不并项与历史沿革

### 4.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/PROJECT.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「归位注记」（自旧树设计层的 REQUIREMENTS 档归位——原档已不存在） | 旧树内归位史 | 旧树批次语境——本档即基准层权威登记 |
| 旧档「会话流时序对齐」节尾状态行（「C 勘察中——设计/评审/实现链后续推进」） | 批次状态行 | 状态行不并——待设计登记已入本档 §3 头注 |

### 4.2 不并项登记（拆分去向——逐项登记）

| 旧档面 | 内容 | 去向 |
|---|---|---|
| 「已确定的决策」表的 语言 / 依赖 / Provider / 模型配置 / 会话存储 五行 · Provider 预设节 · 模型选择四契约 · 「与 CLI 的关系」节 · API Key 存储 · 多 Provider 默认选择 · 与 CLI 记忆互通 | 产品级定性与跨产品共享契约 | `docs/core/requirements/PROJECT.md`（切分规则见其 §5.2） |
| CLI 侧同名档（`thincoder-cli/docs/requirements/PROJECT.md`） | CLI 产品定性正文 | 触发 = CLI 迁移轮 |

## 5. 体量与拆分规划（R24a）

**实测行数**：本档 **72 行**（VSC 部分新建 · as-of 2026-09-15）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 批 5**）：建档——`thincoder-vscode/docs/requirements/PROJECT.md` **拆分重建**：
  VSC 专有面 ⇒ 本档；产品级定性面 ⇒ `docs/core/requirements/PROJECT.md`（承 §7.2 D4 归属疑变的父侧裁定）。
