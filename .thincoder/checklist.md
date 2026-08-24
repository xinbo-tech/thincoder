# Checklist — ACP 接入（M1 起步）

> 播种自 ACP-CLIENT.md 用户故事（需求层跟踪）。

- [ ] 用户故事：Zed 用户在 IDE 直接对话 thincoder（编辑器上下文注入）
- [ ] 用户故事：JetBrains 用户在 AI chat 驱动 thincoder（审批弹 IDE 内）
- [ ] 用户故事：多编辑器用户一次登录多处可用（会话/鉴权复用）
- [ ] 用户故事：工程师审查 agent 编辑（fs 反向 RPC → IDE 原生 diff）
- [ ] M1：传输层 + initialize/authenticate/session/new + prompt 流式（无工具）——Zed 能对话
- [ ] M2：工具调用 + request_permission + fs 反向 RPC——Zed 能完整干活
- [ ] M3：session/load/resume/list/delete + config_options + cancel——日常使用闭环
- [ ] M4：测试完备 + ides.md 集成指南——发布 0.13.0

# Checklist — 工具输出长度限制调整（16K/2K/12K → 64K）

> 需求 TOOL-OUTPUT-LIMITS-REQUIREMENTS.md / 设计 TOOL-OUTPUT-LIMITS-TUNING.md（2026-08-24，评审 #1-#8）。

- [ ] FR1: ≤64K 工具结果不落盘直接进上下文；>64K 落盘并返回 64K preview + 文件路径（阈值 16_000 → 65536）
- [ ] FR2: 落盘 preview 放大到 64K（2_000 → 65536）
- [ ] FR3: advisor MAX_RESULT_CHARS 放宽到 64K（12_000 → 65536，line-aware 截断不变）
- [ ] FR4: 落盘格式/清理/路径消息不变（仅阈值与 preview 长度变化）
- [ ] AC1: ≤65536 不落盘返回原文（=== 输入）
- [ ] AC2: 65537+ 落盘，preview + 路径，磁盘全量
- [ ] AC3: 内联 preview > 20000（放大到 64K）
- [ ] AC4: advisor MAX_RESULT_CHARS = 65536（常量断言必做）
- [ ] AC5: 现有 offload 清理/保留/目录缺失测试通过（输入 70_000 后）
- [ ] AC6: node --test test/*.mjs 全套通过
- [ ] AC7: src/ 无 16_000/2_000/12_000 工具输出残留
- [ ] AC8: 落盘失败回退截断 = 65536
