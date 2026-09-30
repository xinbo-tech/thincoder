# 2026-09-30 · VSC 贴图件清理
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-30 · 来源 = 台账 #735（源 = pairfix 设计轮 §2 F-1 上抛）∥ 用户 2026-09-30 18:24「挂账那些也都处理掉」。事实：`docs/core/design/PROVIDER.md:271` ∥ `thincoder-core/attachments.mjs:16-17` 声称的「VSC offloadToolResult mtime 扫除兜底（paste-* 在扫除面内）」与实码不符——offload 已迁 `~/.thincoder/tool-results`，VSC 源码零扫除调用 ⇒ **VSC 贴图件无自动清理（累积）**；parity-b4 §2.3「保留」裁定之「无落盘累积」结论对 VSC 不成立。**父侧裁 = 接线**（VSC 侧补清理——对位面：桌面族 `TOOL-OUTPUT-LIMITS.md:44` 3 天窗 ∥ 随族清理形；实现形待设计）。。
> 台账 = #735（VSC · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：进行中（来源入档 ✓ · 父侧裁 = 接线 · 设计轮派发（eng-designer #7））
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**来源**：台账 #735（源 = pairfix 设计轮 §2 F-1 上抛）+ 用户 2026-09-30 18:24「挂账那些也都处理掉」。

**事实**：`docs/core/design/PROVIDER.md:271` ∥ `thincoder-core/attachments.mjs:16-17` 声称的「VSC offloadToolResult mtime 扫除兜底（paste-* 在扫除面内）」与实码不符——offload 已迁 `~/.thincoder/tool-results`，VSC 源码零扫除调用 ⇒ **VSC 贴图件无自动清理（累积）**；parity-b4 §2.3「保留」裁定之「无落盘累积」结论对 VSC 不成立。

**父侧裁 = 接线**（VSC 侧补贴图件清理；形态待设计：mtime 窗 ∥ 会话边界 ∥ 随族——对位面 = `TOOL-OUTPUT-LIMITS.md:44`〔3 天窗 · 写时自清理〕）。需求侧锚 = 设计轮定位（缺口上抛）；doc-code 收正（声称 vs 实）= 随设计处置。

**下一手**：设计轮 → 评审 → 批准 → 实施（VSC 码面）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
