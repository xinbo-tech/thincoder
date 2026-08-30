# ThinCoder vs 主流编程智能体 — 评估报告

> **归档快照（2026-07-29 时点数据，勿引用为现状）**：数字与断言均截至评估当日——多项已被后续迭代推翻（maxTurns 100→200、LSP 工具/ACP/VS Code 扩展均已交付、测试数已远超 153）。现状以 ARCHITECTURE.md / FEATURES.md 为准；时点竞评见 COMPETITIVE-CLI-2026.md（同为归档）。

**日期**：2026-07-29  
**评估者**：ThinCoder（自评，基于公开文档与源码审计）

---

## 参评项目

| 项目 | 团队 | 定位 |
|------|------|------|
| **ThinCoder** | 上海新舶 (liwei) | 零依赖、极简的编程 agent，打"克制精准"牌 |
| **kimi-code** | Moonshot AI | Kimi 模型的官方 CLI agent，国内顶流 |
| **MiMo-Code** | 小米 MiMo | OpenCode fork，功能最全的全栈编程 agent |
| **OpenCode** | AnomalyCo | MIT 开源，社区驱动的终端 agent |
| **OMP** | 社区开源 | Rust 编写，Hashline 编辑 + 流规则 + LSP/DAP 驱动 |

---

## 1. 代码规模与复杂度

| 指标 | ThinCoder | Kimi-Code | MiMo-Code | OpenCode | OMP |
|------|-----------|-----------|-----------|----------|-----|
| **语言** | JS (`.mjs`) | TS | TS | TS | Rust |
| **构建步骤** | 无 | 有 (pnpm) | 有 (bun) | 有 (bun) | 有 (cargo) |
| **核心代码行数** | ~6,000 | 88,716 | 103,126 | 33,210 | ~55,000 |
| **总代码行数** | ~10,000 | ~200k+ | ~300k+ | ~100k+ | ~100k+ |
| **npm 运行时依赖** | **0** | 29 | 110 | 64 | 0（cargo deps） |
| **核心源文件数** | ~86 `.mjs` + 20 `.md` 工具描述 | 627 `.ts` | 536 `.ts` | 316 `.ts` | ~400 `.rs` |
| **测试文件数** | 5（agent / memory / tools / tui / integration） | ~100+ | ~200+ | ~100+ | — |
| **测试用例数** | **153** | 未统计 | 未统计 | 未统计 | — |
| **测试通过率** | **153/153** ✅ | 未测 | 未测 | 未测 | — |
| **版本** | v0.8.13 | — | — | — | — |

**结论**：ThinCoder 以 **1/10 ~ 1/20 的代码量** 覆盖了其他 agent 的核心功能，同时维持 **零 npm 依赖**。这不是"功能少"而是"同样功能用的代码少"——约 86 个源文件 + 20 个工具描述实现 34 个工具、主循环、TUI、三层记忆、子 agent、MCP、checkpoint。代码量优势来自：无类型体操、无抽象框架、无冗余设计。

---

## 2. 核心能力矩阵

### 2.1 Agent 主循环

| 特性 | ThinCoder | Kimi-Code | MiMo-Code | OpenCode | OMP |
|------|-----------|-----------|-----------|----------|-----|
| 工具调用循环 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 循环上限 | 100 轮 | ✅ | ✅ | ✅ | ✅ |
| 上下文压缩 | ✅ | ✅（优秀） | ✅（智能 checkpoint） | ✅ | ✅ |
| 流式输出 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 两段式工具调度 | ✅（独创） | ❌（全并行） | ❌（全并行） | ❌（全并行） | ❌ |
| 完成守卫 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 前缀缓存 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 修复-验证循环 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 流规则引擎 | ✅（时间旅行，借鉴 OMP） | ❌ | ❌ | ❌ | ✅ |
| 用户中途注入 | ✅（Ctrl+I） | ❌ | ❌ | ❌ | ❌ |

**流规则引擎**借鉴 OMP 的"时间旅行"思想：SSE 流中实时正则匹配，命中即中断、注入提醒、同点重试——不用多花完整一轮 token 就能纠偏。**用户中途注入**（Ctrl+I）是同一套基础设施的交互层扩展：模型生成中按热键直接插入补充要求，和流规则一样省 token。

**两段式调度**是 ThinCoder 的重要创新：阶段一逐条确认权限，阶段二只读工具并行、副作用工具串行。三家的"全并行"方案在多个写工具同时操作同一文件时可能竞态——ThinCoder 用 ~20 行代价拿到 80% 并行收益且无竞态风险。

### 2.2 工具系统

| 工具 | ThinCoder | Kimi-Code | MiMo-Code | OpenCode | OMP |
|------|-----------|-----------|-----------|----------|-----|
| 文件读写 | read/write/edit/insert_after | ✅ | ✅ | ✅ | ✅ |
| apply_patch | ✅（多文件原子） | ❌ | ❌ | ❌ | ❌ |
| hashline_edit | ✅（哈希定位，对空白符免疫） | ❌ | ❌ | ❌ | ✅ |
| bash | ✅ | ✅ | ✅ | ✅ | ✅ |
| glob/grep | ✅ | ✅ | ✅ | ✅ | ✅ |
| grep 上下文行 | ✅（before/after） | ✅ | ✅ | ✅ | ✅ |
| websearch | ✅ | ✅ | ✅ | ✅ | ✅ |
| fetch | ✅ | ✅ | ✅ | ✅ | ✅ |
| ls | ✅ | ✅ | ✅ | ✅ | ✅ |
| git diff/status/log | ✅ | ✅ | ✅ | ✅ | ✅ |
| checkpoint | ✅ | ❌ | ✅ | ❌ | ❌ |
| delete | ✅ | ✅ | ✅ | ✅ | ✅ |
| read_image | ✅ | ✅（视频） | ❌ | ❌ | ❌ |
| syntax_check | ✅ | ❌ | ❌ | ❌ | ❌ |
| task | ✅ | ✅ | ✅ | ✅ | ✅ |
| plan | ✅ | ✅ | ✅ | ✅ | ✅ |
| goal | ✅ | ✅ | ✅ | ❌ | ❌ |
| verify | ✅ | ❌ | ❌ | ❌ | ❌ |
| question | ✅ | ✅ | ✅ | ✅ | ✅ |
| subagent | ✅ | ✅ | ✅ | ✅ | ✅ |
| skill | ✅ | ✅ | ✅ | ❌ | ❌ |
| memory_put/search | ✅ | ❌ | ✅ | ❌ | ❌ |
| repo_outline | ✅ | ❌ | ❌ | ❌ | ❌ |
| code_search | ✅ | ❌ | ❌ | ❌ | ❌ |
| doc_search | ✅ | ❌ | ❌ | ❌ | ❌ |
| recent_changes | ✅ | ❌ | ❌ | ❌ | ❌ |
| timer | ✅ | ❌ | ❌ | ❌ | ❌ |
| checklist | ✅ | ❌ | ❌ | ❌ | ❌ |
| **工具总数** | **34** | ~22 | ~24 | ~18 | ~32 |

**ThinCoder 在工具数量最多**，但做到这一点没有引入任何额外依赖。三个检索工具（repo_outline / code_search / doc_search）是独创：它们从"结构 → 意图 → 细节"三层逐级深入，比传统的"给模型一个 grep"精确得多。`hashline_edit` 借鉴 OMP 的哈希锚定编辑思想，用 SHA256 定位编辑位置，彻底解决传统 `edit` 工具对空白符/编码敏感的匹配失败问题。

### 2.3 记忆系统

| 维度 | ThinCoder | Kimi-Code | MiMo-Code | OpenCode | OMP |
|------|-----------|-----------|-----------|----------|-----|
| 记忆范围 | Personal / Project / Team | ❌（session only） | Personal + Project | ❌ | ❌ |
| 存储 | SQLite FTS5 | ❌ | SQLite FTS5 | ❌ | Hindsight |
| 向量检索 | ✅（RRF 混合） | ❌ | ❌（仅 BM25） | ❌ | ❌ |
| 语义检索 | ✅（BGE-M3） | ❌ | ❌ | ❌ | ❌ |
| Git 同步 | ✅（Project+Team） | ❌ | ❌ | ❌ | ❌ |
| 条目格式 | Markdown + frontmatter | ❌ | JSON/SQLite | ❌ | — |
| 人审机制 | ✅（distill y/n） | ❌ | ✅（dream/distill） | ❌ | ❌ |
| 冲突处理 | 结构规避 + 诚实报错 | ❌ | ❌ | ❌ | ❌ |
| 检索隔离 | 按项目路径 | ❌ | ❌ | ❌ | ❌ |
| 必需外部服务 | **无** | ❌ | ❌ | ❌ | ❌ |

**这是 ThinCoder 最核心的差异化优势**。ThinCoder 是唯一一个把"团队记忆"真实跑通的项目——`verify-team.mjs` 脚本验证了 A→git→B 全链路。关键设计决策：

1. **Markdown + 单文件单条目**：GitHub 直接可读可 review，天然无合并冲突
2. **SQLite 是易失索引**：随时可从 markdown 源重建，不依赖数据库
3. **双轨沉淀**：规范靠人写，经验靠 `/distill` 提取后逐条 y/n 确认
4. **零外部依赖**：SiliconFlow 仅提供免费 embedding，不用也能检索（退化为纯 FTS5）

### 2.4 子 Agent 系统

| 特性 | ThinCoder | Kimi-Code | MiMo-Code | OpenCode | OMP |
|------|-----------|-----------|-----------|----------|-----|
| 角色类型 | explore / plan / coder | explore / plan / coder | 动态生成 | general | — |
| 并行派发 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 权限模型 | 人在回路（透传到父审批） | 继承 | 继承 | 继承 | ❌ |
| 只读强制 | ✅（explore/plan） | ✅ | ✅ | ✅（plan） | ❌ |
| 流式可见 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 报告质量兜底 | ✅（<200字打回） | ❌ | ❌ | ❌ | ❌ |
| 上下文隔离 | ✅ | ✅ | ✅ | ✅ | ❌ |

**thinCoder 的子 agent 权限模型最安全**：coder 的写操作不是"全自动放行"而是**透传到父 agent 的审批 UI**，用户在 TUI 中逐条确认，拒绝后子 agent 改交报告。这是"人在回路"的正确实现——不像其他 agent 要么全信任、要么全隔离。

### 2.5 TUI 体验

| 特性 | ThinCoder | Kimi-Code | MiMo-Code | OpenCode | OMP |
|------|-----------|-----------|-----------|----------|-----|
| 实现方式 | 裸 ANSI（零依赖） | pi-tui（React-like） | 基于 OpenCode | 自研 | TUI |
| 斜杠命令 | 全部菜单化 | ✅ | ✅ | ✅ | ✅ |
| todo 面板 | ✅ | ✅ | ✅ | ❌ | ✅ |
| 权限预览 | ✅（紧挨输入框） | ✅ | ✅ | ✅ | ✅ |
| 子 agent 面板 | ✅ | ✅ | ✅ | ❌ | ❌ |
| token 用量 | ✅（含缓存命中率 + 推理 token） | ✅ | ✅ | ✅ | ✅ |
| 上下文利用率 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 图片粘贴 | ✅ | ✅（视频） | ❌ | ❌ | ❌ |
| 多 provider 切换 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 选择器 UI | ✅（统一列表游标） | ✅ | ✅ | ✅ | ✅ |
| TPM 节流展示 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 用户中途注入 | ✅（Ctrl+I） | ❌ | ❌ | ❌ | ❌ |
| Shell 补全 | ✅（bash/zsh/fish） | ❌ | ❌ | ❌ | ❌ |

---

## 3. 工程质量

### 3.1 依赖管理

```
ThinCoder:  node_modules 为空
Kimi-Code:  29 deps (含 ai-sdk, effect, drizzle-orm 等重依赖)
MiMo-Code:  110 deps (含 ai-sdk, effect, drizzle-orm, ink, react 等)
OpenCode:   64 deps (含 effect, drizzle-orm, solid-js 等)
OMP:        零 npm，但依赖 Bun 运行时 + Rust cargo 生态系统
```

**每引入一个 npm 包就引进一份技术债**（CVE、版本冲突、维护成本）。ThinCoder 的零依赖策略是工程洁癖的极致，也是 agent 稳定性的护城河。OMP 的 Rust 编译型方案在性能上有优势，但牺牲了"改一行就跑"的迭代速度和跨平台零安装体验。

### 3.2 测试策略

| 指标 | ThinCoder |
|------|-----------|
| 测试框架 | `node:test`（零依赖） |
| 测试数量 | 153 |
| 通过率 | 153/153 |
| 类型 | 纯离线（mock LLM server） |
| 覆盖范围 | TUI 纯函数与布局（39）、memory CRUD（15）、tools 文件/系统/git（26）、agent 循环（69）、端到端集成（4） |
| 执行速度 | ~8s |

全部离线测试，不依赖真实 API——意味着 CI 零成本、任何环境都能跑。153 条覆盖了核心流程、边界条件、错误路径。

### 3.3 代码组织

ThinCoder 遵循几个关键纪律：

- **接口先行**：所有模块通过显式 export 通信，尤其是 `memory.mjs`——团队记忆的扩展位在此
- **关注点分离**：权限逻辑在 TUI 层、执行在 tools 层、调度在 agent 层
- **命名一致性**：所有 `.md` overlay 文件对应 agent 角色命名（`explore-overlay.md` / `plan-overlay.md` / `coder-overlay.md`）
- **自文档化**：工具描述存 `src/tools/*.md`，修改工具行为无需改代码
- **提示词分层**：`SYSTEM_PROMPT.md`（核心规则） + `main-overlay.md`（主 agent 条款）+ 角色 overlays

---

## 4. 设计哲学对比

| 维度 | ThinCoder | 主流做法 |
|------|-----------|----------|
| 模型策略 | **只跟顶流、只跟最新** | 兼容所有模型（OpenAI/Anthropic/Google/Ollama/本地） |
| 依赖策略 | **零 npm 依赖** | 用框架（Effect/ai-sdk）加速开发 |
| 上下文策略 | **准比短重要**（1M 窗口是常态） | 压缩焦虑，担心 token 成本 |
| 权限模型 | **人在回路、透传审批** | 全自动 / 信任模式 / 跳过权限 |
| 记忆策略 | **Git 为真相源、SQLite 为易失索引** | 数据库为中心（PostgreSQL） |
| 认知模型 | **代码是问题、不是答案** | 模仿现有代码风格 |
| 国际化 | **英文为默认**（不做中文限定） | 多数面向中国用户 |
| 借鉴态度 | **好想法就吸收**（OMP 的 hashline 编辑、流规则） | 闭门造车 |

这些哲学差异不是"好"与"坏"——它们反映了不同的工程价值观。ThinCoder 的选择是**极简主义 + 硬约束**：用最少的东西做最可靠的事。

---

## 5. 局限与短板

ThinCoder 的克制本身也是它的约束——应该诚实地列出：

| 短板 | 说明 |
|------|------|
| **单一协议** | 仅支持 OpenAI 兼容端点（fetch + SSE），不做 Anthropic Messages API、不做 Google Gemini API |
| **模型范围窄** | 只跟顶流、只跟最新（内置 17 家厂商旗舰模型），不做老旧/不成熟模型 |
| **无 LSP 集成** | 代码理解靠 FTS5 + 向量 + JSDoc，不是 LSP 语义分析（OMP 有完整的 LSP + DAP 集成） |
| **无 IDE 集成** | 纯终端 CLI/TUI，没有 VS Code 插件、没有 ACP 服务端 |
| **无桌面应用** | TUI only（OpenCode 有桌面版） |
| **无工作流引擎** | 没有 QuickJS 沙箱、没有确定性 workflow 脚本 |
| **无语音输入** | 没有 ASR（MiMo-Code 有） |
| **无视频输入** | 没有视频理解（kimi-code 有） |
| **内置技能少** | 只有体系技能（plan/task/goal），没有"写 PDF""搜 arXiv"这类领域技能 |
| **社区生态** | 单人项目，无 Discord 社区 |
| **文档** | 仅 README + 3 份设计文档，无在线文档站 |
| **CI/CD** | 无（本地测试+人工发布） |
| **Windows 路径** | 完整支持（cmd.exe + 进程组杀 + GBK 编码修复），实际开发平台 |

**这些都是"选择不做"而非"做不到"**。ThinCoder 的原则是：能砍的砍掉，留下的做到极致。每加一个功能都问"值不值这个复杂度"。

---

## 6. 综合评价

### 6.1 按场景推荐

| 用户场景 | 推荐 |
|----------|------|
| 要开箱即用、零配置 | **ThinCoder**（`npm i -g thincoder`，启动即配置向导） |
| 要团队共享知识 | **ThinCoder**（唯一真正跑通的团队记忆） |
| 要最小认知负担 | **ThinCoder**（约 86 个源文件，一下午能读完所有代码） |
| 要全功能（语音/视频/工作流/PDF/PPT） | MiMo-Code |
| 要开源纯社区版 | OpenCode |
| 要用 Kimi 模型的最佳体验 | Kimi-Code |
| 要 IDE 集成 | Kimi-Code（ACP）或 OpenCode（桌面版） |
| 要 CI 中跑 agent | ThinCoder（`thincoder chat "..."` 管道友好）或 Kimi-Code |
| 要 Rust 生态 + LSP/DAP 驱动 | OMP |

### 6.2 一句话总结

| 项目 | 一句话 |
|------|--------|
| **ThinCoder** | 工程师的刀——克制、精准、零依赖。团队记忆是唯一跑通的王牌。吸收了 OMP 的 hashline 编辑和流规则精华。 |
| **Kimi-Code** | Kimi 模型的最佳 CLI 体验——视频输入、ACP 协议、插件生态，但锁在自家生态。 |
| **MiMo-Code** | 功能的百货商场——workflow 引擎、23 个技能、语音输入、dream/distill，但复杂度爆炸（110 deps）。 |
| **OpenCode** | MIT 开源的标准答案——够用、干净、有桌面版，但记忆系统缺失。 |
| **OMP** | Rust 编写的强劲新秀——Hashline 编辑成功率 68%、LSP/DAP 驱动、时间旅行流规则，正在快速迭代。 |

---

*本报告基于各项目截至 2026-07-29 的公开代码与文档。数据来自源码审计（行数统计、依赖分析、测试运行），非主观印象。OMP 信息基于 GitHub 仓库及官网文档。*
