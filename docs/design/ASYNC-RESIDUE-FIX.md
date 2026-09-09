# 异步化残留修复批（ASYNC-RESIDUE-FIX）

> 板块：提示词系统 + 工具描述（双端——全异步化后残留同步时代措辞清理）。权威源：AGENT-LOOP §7.5/§7.7/§7.7.1（async 语义锚）。
> 状态：**评审通过——已交付（clean——F-1~6 全落地——L16 双端 byte-identical 1739——CLI 172/0 + VSC 221/0——L2 待链稳定）**——2026-09-09 落档

---

## 需求

- **总体目标**：清全异步化后残留的同步时代提示词/工具描述措辞——6 处分级残留（2 误导性 + 2 过时 + 2 微调）+ 文档面候选——模型不再被误导走已废弃的同步 spawn/回合内等待路径。
- **功能性**：
  - F-1（🔴 main.md:8 双端）删 sync 例外通道句——改"下一步依赖报告 → 结束回合等 digest（或声明
    dependsOn）"——与 :13 "never pass async:false at top level" 自洽
  - F-2（🔴 engineering.md:16 CLI step 4）补 async 机制段（评审默认 async——ack 即收尾——settle→digest
    送达——批准时 token 自动签发 + digest 回显 designId——对齐 VSC async 段）
  - F-3（🟡 engineering.md:16 VSC step 4）删旧同步 token 句 + 澄清 wait 句（"start reviews one at a time and wait for each to settle" → 跨回合排发语义——settle→digest→下轮发起）
  - F-4（🟡 advisor.mjs:55 CLI）async 参数描述补"机制参数"限定（对齐 VSC:177——测试锚同步扩）
  - F-5（🔵 main.md:13 双端）"results reach you automatically" 重复句合一
  - F-6（🔵 discipline.md:68 CLI）工具路由表 subagent 行补 cancel + escalate 异步注（对齐 VSC:69）
  - **范围边界**：文档面候选（ESCALE.md async:false 指针/AGENT-LOOP 过时注）= 父侧裁（🔵 级不阻塞——本批可顺手或另列）；**前置收敛**：engineering.md 双端 :15/:16 已不同构（CLI:15 预检段 VSC 无 / VSC:16 async 段 CLI 无）——F-2/F-3 修 step 4 前需双端收敛同基——**与 MAIN-DESIGN 增强批（A1-A4 注入）协调——排其交付后实现**（MAIN-DESIGN 会把 CLI:15/VSC:15 都注入预检段——
  届时双端 :15 对齐——本批修 :16 async 段两端对齐——收敛基线自然成）。

## 设计（评估清单——照做勿自行解释）

### 逐处修正（双端各自——逐字文本见评估引用——照抄勿自行解释——评审 #5：单方案声明——本批每处修复均单一路径
（删/补/合——评估定稿——无 ≥2 候选对比——豁免）
1. **main.md:8 双端**：删 `sync only when the next step depends on this output and nothing else can proceed`——改 `if your next step depends on the report, end the turn and let it arrive (or declare dependsOn)`
2. **engineering.md:16 双端 step 4（评审 #1：旧句双端都有——CLI 863 字符只有旧句 / VSC 1819 含 async 段**
   ——收敛 = 双端删旧句 `- If advisor approves: it returns a design token in plain text in its response.`
   （CLI 无 async 段 → 整体移植 VSC 现 L16 删旧句后文本——**字节源 = VSC engineering.md:16 删旧句后**
    ——CLI 照抄 + 交付 diff 审计——单一锚：以 VSC 现文本为字节源不自行撰写）
3. **engineering.md:16 VSC step 4（评审 #1：与 F-2 合并为一次双端收敛——VSC 删旧句（字节源）**——
   wait 句已含于 VSC 现文本（"start reviews one at a time and wait for each to settle"——评审 #3 遗留
   澄清——跨回合语义注：settle→digest→下轮发起——非回合内等——注于设计不改字节）
4. **advisor.mjs:55 CLI**：async 参数描述加 `(mechanism parameter — top-level launches are async by default)`（对齐 VSC:177）——测试断言同步扩
5. **main.md:13 双端**：重复句合一（"results reach you automatically" 一句两现 → 留一）
6. **discipline.md:68 CLI**：工具路由表 subagent 行动作补 cancel——escalate 行加异步注（对齐 VSC:69）

### 测试
- prompts-async-guidance 类断言扩展：main.md:8 新句驻留（双端）+ :13 无 sync 例外 + advisor.mjs:55 机制参数限定句驻留——fail-when-unchanged
- engineering.md step 4 async 段（F-2/F-3 收敛后——双端同基断言）

## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| src/prompts/main.md | CLI/VSC | 各 35（实测——评审 #4） | ≤±3 | F-1 删 sync 例外 + F-5 重复合一 |
| src/prompts/engineering.md | CLI/VSC | 各 ~90 | ±5 | F-2 CLI 补 async 段 + F-3 VSC 删旧句——双端收敛同基 |
| src/agent-tools/advisor.mjs | CLI | 213（并发池后） | ≤+1 | F-4 机制参数限定 |
| src/prompts/discipline.md | CLI | 84（实测——评审 #4） | ≤+2 | F-6 路由表补 cancel |
| test/prompts-async-guidance.test.mjs | 双端 | 各 120（实测——评审 #4） | +4~+8 | 断言扩展 |
| docs/design/README.md | 双端 | doc | +2 | 本档地图登记一行 + 变更记录（评审 #3） |
| 文档面候选（ESCALATE.md 等） | 双端 | doc | 父侧裁 | 指针注（可选） |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 下一步依赖 | 模型读 main.md:8 | 引导结束回合等 digest——无 sync spawn 引导——F-1 |
| F-2 CLI step 4 | 架构师发起设计评审 | 知默认 async——ack 收尾——token 自动——F-2 |
| F-3 VSC step 4 | 读评审流程 | 无旧 token 句矛盾——wait 跨回合——F-3 |
| F-4 advisor 描述 | 模型读 async 参数 | 知机制参数——顶层默认 async——F-4 |
| F-5 main.md:13 | 读句 | 无重复——F-5 |
| F-6 discipline 路由 | 模型查可停子代理 | 见 cancel + escalate 异步——F-6 |
| 双端收敛 | engineering.md step 4 | CLI/VSC 同基——prompts 断言双端驻留 |

## 验收

- AC-1 main.md 双端无 sync 例外引导（:8 改 + :13 无矛盾——断言绿）
- AC-2 engineering.md 双端 step 4 收敛同基（CLI 补 async + VSC 删旧句——同基断言）
- AC-3 advisor.mjs CLI async 机制参数限定（对齐 VSC——断言扩）
- AC-4 discipline CLI 路由补 cancel（对齐 VSC）
- AC-5 测试绿（双端 npm test 快层——既有零回归）
- 红线：depth>0 sync 合法语义不动（机制路径——非顶层引导）；§7.7 顶层一律异步不动；与 MAIN-DESIGN 交付后协调（A1-A4 注入完成再改 step 4——防编辑冲突）

## 变更记录
- 2026-09-09：落档（评估一手——6 处分级残留 + 双端收敛前置 + MAIN-DESIGN 协调——排其交付后实现）。
