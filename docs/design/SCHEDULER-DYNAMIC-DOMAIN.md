# 调度器动态文件域（SCHEDULER-DYNAMIC-DOMAIN）

> 板块：subagent 调度器（双端——subagent-scheduler.mjs 同构）。权威源：AGENT-LOOP §10.1/§10.2（调度器——2026-09-09 重编号后）+ §7.2（status/observe touched 上报）。
> 状态：**评审通过——已交付（CLI c7626ab + VSC e55a516——clean——修正轮 1/5——CLI 208/208 + VSC 238/238——L2 待链稳定）**——2026-09-09 落档

---

## 需求

- **总体目标**：调度器文件域冲突判定从"纯声明 files"扩为"声明 ∪ 运行中实际写入"——out-of-list 写入（真实交付常态——纪律已允许 + 报告）不再是无域保护的裸写——并行子代理不会踩彼此实际改的文件。
- **功能性**：
  - F-1 有效域：冲突判定用 `effectiveFiles(e) = (e._files ?? []) ∪ (e.status === "running" ? e.childAgent?._touchedFiles ?? [] : [])`——queued 无 childAgent 天然只声明域（未写任何文件——语义自洽）
  - F-2 改点：describeBlockers / queueRunnable / detectStall 三函数"他条目域"读取从 `e._files ?? []` → `effectiveFiles(e)`——每端 ~6 处 + helper + showFile/waiting 文案区分命中来源（声明 vs 运行中实际写入）
  - F-3 触发保护：refill/spawn 准入实时读（无需新触发——queued start 前必经 refill 重扫——动态域对 start 决策保护**不依赖**新事件）
  - F-4 纪律残留清理：AGENT-LOOP:510 files 描述"不碰清单外文件"旧语 → 对齐 L443 新裁定（允许 + 逐项报告）
  - **范围边界**：running-vs-running 抢占 = 不做（无抢占机制——动态域只保护未来 start 决策——需子侧写前门禁是独立大机制——标注后续项）；escalate 飞刀无 files 声明——动态域让 running 飞刀实际写成为他条目 blocker——但飞刀自身启动不排队（scope 决策点——本批只受益不改造）；中途写窗口（批提交延迟毫秒~秒）接受并文档化；touched 默认零排除（只有 6 结构化写工具进——噪音面小）。

## 设计（勘察方案——照做勿自行解释）

### 1. effectiveFiles helper（双端 scheduler 同构）
- `effectiveFiles(e)`：`e.status === "running" && e.childAgent ? [...(e._files ?? []), ...(e.childAgent._touchedFiles ?? [])] : (e._files ?? [])`——去重按 fileKey（filesOverlap/fileKey 现键空间——touched 绝对路径与 normalizeFileList 同源——零改动）
- queued 无 childAgent（CLI start 才绑 subagent-run.mjs:131 / VSC 首 onAgentTurn 才绑）——`?.` null 安全——既有测试无 childAgent 零行为变化

### 2. 三函数改点（每端 ~6 处）
- describeBlockers（CLI :113-147 / VSC :166-199）：准入/等待态判定——他条目域 → effectiveFiles
- queueRunnable（CLI :242-264 / VSC :207-227）：补位判据——同上
- detectStall（CLI :167-233 / VSC :242-281）：停滞检测——同上
- showFile/waiting 文案：命中来源区分——`域冲突 <file>（运行中实际写入）` vs 声明（纯声明不加注——既有文案不回归）

### 3. 触发点（无需新事件——分层说明）
- spawn 准入 + refill + status/排队标注：实时读（数组最新值——池 ≤8 × 文件数——微秒级——无锁单线程）
- 可选新触发（touch push 点重算 describeBlockers——更新 queued waiting 头 UX）——本批不做（refill 已保护 start 决策）——标注后续 UX 增强

### 4. 纪律残留（AGENT-LOOP:510）
- `eng-coder 纪律"不碰清单外文件"` → `eng-coder 纪律（AGENT-LOOP §18/A 裁定——清单外改动允许但必须逐项报告——L443）`——对齐现行

## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| src/agent-tools/subagent-scheduler.mjs | CLI | 343 | ≤+20 | F-1 helper + F-2 三函数改点 + 文案 |
| src/agent-tools/subagent-scheduler.mjs | VSC | ~400 区 | ≤+20 | 同构镜像 |
| docs/design/AGENT-LOOP.md | CLI/VSC | doc | +5 | F-4 纪律残留清 + 动态域记录（§10.1/§10.2） |
| test/subagent-scheduler.test.mjs | 双端 | 既有 | +15~+25 | 伪 running 条目带 childAgent+touched 用例——queueRunnable/describeBlockers 新判定 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-2 运行中写入冲突 | running 子代理 touched 文件 X（未声明）+ 新 spawn 声明 X | 新 spawn 排队——waiting 注"域冲突 X（运行中实际写入）"——F-2 |
| F-2 纯声明不回归 | running 无 touched + 声明域冲突 | 原判定不变（无"运行中实际写入"注）——F-2 |
| F-2 queued 只声明域 | queued 条目（无 childAgent） | 只按声明域判——`?.` null 安全——F-2 |
| F-3 refill 保护 | running touched 增长 + queued 释放 | queued start 前 refill 重扫见新 touched——不启动冲突——F-3 |
| F-4 纪律残留 | grep "不碰清单外文件" AGENT-LOOP | 零残留（对齐 L443）——F-4 |

## 验收

- AC-1 effectiveFiles 双端（declared ∪ running touched——queued 只声明——null 安全）
- AC-2 三函数改点（describeBlockers/queueRunnable/detectStall 用有效域——测试绿）
- AC-3 文案区分（运行中实际写入 vs 声明——既有文案不回归）
- AC-4 纪律残留清（AGENT-LOOP "不碰清单外" 零残留——对齐 L443）
- AC-5 双端 npm test 快层零回归（scheduler 既有测试全绿——无 childAgent 用例零变化）
- 红线：文件域键空间零改（fileKey/filesOverlap 不动）；running-vs-running 不做（标注后续）；escalate 飞刀只受益不改（scope 决策点记录）；refill/spawn 语义不变只扩读法

## 变更记录
- 2026-09-09：落档（touched 勘察一手——数据源两端同构 agent._touchedFiles + entry.childAgent 实时读——动态域 = declared ∪ running touched——6 改点/端——refill 已保护无需新事件——running-vs-running 标注不做——纪律残留 AGENT-LOOP:510 清）。纪律部分主体已落地（engineering-sub ALLOWED + AGENT-LOOP:443 A 裁定）——本档 F-4 只清残留。
