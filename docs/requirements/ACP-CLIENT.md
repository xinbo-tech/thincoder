# ACP-CLIENT — 需求

> 板块：ACP 协议（IDE 接入）。需求层文档（docs/requirements/）。
> 状态：已实现（M1）。
> 来源：2026-09-10 自 `../design/ACP-CLIENT.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 定位与目标

`thincoder acp` 子命令在 **stdio 上通过 [Agent Client Protocol](https://agentclientprotocol.com/)（schema v1）暴露 thincoder agent**，使 Zed / JetBrains AI Chat / Paseo 等 ACP 客户端可直接驱动。thincoder 已有专有 VS Code 扩展；ACP 一次实现即可接通 Zed / JetBrains / Paseo（桌面 + Web + 移动自托管编排器）——补上"编辑器接线"生态位。

**核心体验**：
- 编辑器上下文自动注入（打开文件/光标/选区，无需手动 `@`）；
- agent 编辑以 IDE 原生 diff 应用（fs 反向 RPC）；
- 工具审批弹在 IDE 内（`request_permission`）；
- 登录态/会话复用（一次终端登录、多表面可用）。

**协议权威**：`agentclientprotocol/agent-client-protocol` 仓库 `schema/v1/schema.json`（稳定协议版本 **1**；方法名/事件类型以 schema 为准）；kimi-code `packages/acp-adapter/` 为参考实现（方法名与 schema v1 一致）。**注意**：`@agentclientprotocol/sdk@0.23.0` 是 SDK 包版本、不是协议版本；kimi 文档中的 "stable 10/12" 按其 SDK 表面统计——本设计以 schema v1 方法清单为准。

---

## 9. 非功能性需求

- **性能**：ACP 层零缓冲透传——TTFT 开销 < 5ms（与 `thincoder chat` 直跑对比）；流式事件逐块转发不做缓冲合并。重放逐块发送（协议无批量通道），超长会话加载有可见延迟——v1 接受。
- **兼容性**：协议以 schema v1 为准；最低客户端 = 支持 `initialize` 版本协商的任何 ACP v1 客户端（Zed 原生 ACP、JetBrains AI chat 插件、Paseo）。
- **可维护性**：ACP 模块与 agent 核心解耦（可插拔点默认空实现）；协议细节收敛在 src/acp/ 下，TUI/CLI 不感知。
- **会话资源**：每 session/new 一个 agent 实例；v1 不设上限。

---

## 12. 不做项（明确裁剪）

| 不做 | 理由 |
|---|---|
| `logout` | 无账号体系 |
| terminal 反向 RPC | shell 本地执行（kimi 同取舍） |
| unstable 扩展（elicitation/*、auth/configuration、buffer sync、inline-edit 预测等） | 正常客户端流程不依赖 |
| audio prompt | 无音频输入通道 |
| ACP 会话写存档为客户端管理生命周期 | 存档由 session.mjs 每回合末写；客户端只负责连接生命周期 |
| 依赖官方 SDK（TS/Rust/Kotlin 等） | 零依赖哲学；自写层可测（schema v1 是唯一权威） |
