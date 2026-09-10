# 并发池统一可配置 + advisor 归位（POOL-CONFIG-UNIFIED）

> 板块：并发池/评审收敛（双端——三类槽统一默认 4 + 可配）。权威源：CLI AGENT-LOOP.md §11.1（角色分池 R14）/§11.2（async advisor R13）——文档已重排（§24 旧锚为历史残留——本批触碰行更新）。
> 状态：**设计待评审**——2026-09-09 落档（并发池设计前勘察 explore 一手——advisor 池落点判定：100% 双端仓内——无平台面——可配键体系/CLI /config/VSC 面板/doc 同步行全定位）。需求：TODO L91（CLI docs/TODO.md——三类槽统一默认 4 + 可配置——CLI /config + VSC 配置面板）——用户三裁：① 同 scope 并发守卫（加）② 文案去数字化（同意）③ §24 触碰行更新 + 全仓清理挂 TODO。

---

## 需求

- **总体目标**：三类并发池（eng-coder / other / advisor 评审）统一——默认全 4 + 用户可配置（agent.poolLimits 三键）——配置界面双端（CLI /config 并发池子菜单 + VSC 配置面板）——advisor 池并入同一可配体系——同 scope 评审并发守卫——默认值全链路真实。
- **功能性**：
  - F-1 默认三键 4/4/4（双端 ADVISOR_POOL_LIMIT 常量 2→4 + 各默认权威源同步 + 耦合锁补真空）
  - F-2 advisor 池可配：agent.poolLimits.advisor 第三键（双端各需独立 advisor 读取器——现 resolvePoolLimits/effectivePoolLimits 遍历表只 2 键是 subagent 专用）
  - F-3 CLI /config 并发池子菜单并入 advisor 第三项（cmd-config.mjs）
  - F-4 VSC 配置面板并入 advisor 第三数字框（settings-agent.js + locales + 白名单 + 回退）
  - F-5 同 scope 并发守卫（用户裁①）：同 type+scope 有 running 评审实例 → 新启动拒（现 resolve 只查 settled——running 并行多实例歧义放大）
  - F-6 模型可见静态文案去数字化（用户裁②）：CLI advisor.mjs:43 / VSC engineering.md:16（旧宿主名——该文件 2026-09-10 已退役，现 persona-engineering.md）死数字 → 活配置引用——错误文案含生效上限（CLI 已插值——VSC :173 硬编码改插值）
  - F-7 §24 旧锚触碰行更新（用户裁③）：本批触碰行注释 §24→§11.1/§11.2——全仓清理挂 TODO 观察项
  - **范围边界**：全仓 §24→§11 大扫 = 后续（挂 TODO）；评审轮次上限 MAX_REVIEW_ROUNDS=5/②-6a 不排队语义不变；subagent 两域现语义不变（engCoder/other 已 4 已可配——本批只界面/一致性）；排队机制（advisor 无排队——超限即拒）不变——仅阈值 + scope 守卫。
  - **非功能性（评审 #4 补）**：双端锁步同构（CLI/VSC 三键体系 + 守卫逻辑 diff 核）；性能零影响
    （并发判定 O(1)~O(池条目)——不改 spawn 热路径复杂度）；配置持久化语义（旧 2 键 poolLimits 对象
    无 advisor → 读回退 4——新写全 3 键落盘——非法键不落盘回退）；向后兼容（既有 engCoder/other 配置
    值零迁移）。

## 设计（勘察骨架 + 用户三裁——照做勿自行解释）

### 1. 默认值统一 4（F-1）
- 双端 `advisor-async.mjs` `ADVISOR_POOL_LIMIT` 常量（CLI :196 / VSC :39）2 → 4——评审 #6 措辞：
  常量 = 运行时回退权威——DEFAULTS/回退对象 = config 层镜像（保持逐字节同值——耦合锁测试保一致）——
  四源同改缺一即漂移
- 默认源同步 4：CLI config.mjs:65 DEFAULTS.agent.poolLimits 加 `advisor: 4` / VSC config-io.mjs:271 AGENT_DEFAULTS.poolLimits + VSC settings.mjs:96 回退对象加 `advisor: 4`
- **耦合锁补真空**（勘察：T-24a4 锚定测试现不存在——注释宣称锁但测试树零引用）——新测试断言 DEFAULTS ↔ 运行时常量逐键同值（3 键 4/4/4）

### 2. advisor 读取器（F-2——每端各一，放 advisor-async.mjs 判定点旁）
- 读 `agent.config.agent.poolLimits.advisor`——合法（≥1 整数）→ 生效值；非法/缺省 → 回退 `ADVISOR_POOL_LIMIT`（4）
- 判定点现读常量 → 改读生效上限（CLI :364 比较 / VSC :171-172）——文案如实报生效值
- 与 subagent 域读取器（CLI resolvePoolLimits/VSC effectivePoolLimits）独立不共享（键表语义不同）

### 3. CLI /config 并入（F-3——cmd-config.mjs）
- 子菜单（:243-247）加第三 item "advisor 评审池上限"——header（:244）三值
- 写盘（:255-259）：next = {engCoder, other, advisor}——saveProxy 全对象（:257）
- 主菜单/view（:279 label + :307 摘要）加 advisor 值
- 显示回退 cur()（:242/:274）读 DEFAULTS——DEFAULTS 加 advisor:4 后自然显示（undefined 问题消）

### 4. VSC 面板并入（F-4）
- webview/settings-agent.js:20-21 Agent 卡加第三数字框 `ag-pool-advisor`——payload :91-101 加读取
- locales/en.json:235-238 + zh.json:235-238 加 settings.poolAdvisor/Help
- extension/panel-messages.mjs:361-362 → config-io.mjs:369-376 saveAgentSettingsFromPanel 白名单（:371 现 ["engCoder","other"]）加 "advisor"（全非法 → 删整键回退默认语义不变）
- settings.mjs:96 回退对象加 advisor + settings-agent.js 显示 `?? 4`
- 运行期：effectivePoolLimits 加 advisor 键遍历（subagent-scheduler.mjs:344-360 键表 2→3——评审 #2：
  第三键**仅供面板生效值显示/读取回退**——调度路径过滤不消费（subagent 两域 engCoder/other 判定不变）——
  advisor 实际调度上限由 advisor-async 独立读取器（§2）决定——两路径各司其职）——每 run 起始
  setup 重建 cfg——下个 spawn 生效（R14 语义）

### 5. 同 scope 并发守卫（F-5——用户裁①）
- resolve/launch 判定：现查同 type+scope **settled** → 续跑；加查同 type+scope **running** → 存在则**拒**（不等不排——②-6a 无排队语义保持）
- CLI：launchAsyncAdvisor（:354-370 区）——scope 级 running 检查（_advisorRuns 找 reviewType+docSetKey 匹配且 open/state=running）→ error
- VSC：launch（:171-185 区）——resolveReviewInstance 或前置检查——同 scopeKey running 记录 → error（record.state === "running" 匹配——现 L142-143 只收 settled——加 running 分支判拒）
- 拒文案：含 scope 语义 + 指引（"此 scope 已有评审在跑——settle 后逐个发起"）——去数字化
- 与池容量守卫独立：容量 = 全局 ≤4——scope 守卫 = 同 scope ≤1——两守卫都过才启动

### 6. 文案去数字化（F-6——用户裁②）
- CLI advisor.mjs:43 工具描述 "at most 2 reviews run in parallel" → 引用配置活值（"at most {agent.poolLimits.advisor || 4} reviews…"——描述构建时读）
- VSC engineering.md:16 "pool limit 2 — start reviews one at a time" → 活引用（去硬数字）
- VSC advisor-async.mjs:173 错误文案硬编码 "pool limit 2" → 插值生效上限
- CLI :365 已插值（读常量）→ 改读**生效上限**（config 覆盖后如实）

### 7. §24 触碰行更新（F-7——用户裁③）
- 本批触碰文件内 §24 引用注释（advisor-async.mjs/subagent-async.mjs/scheduler/cmd-config 触碰行）→ §11.1/§11.2（现行节号）
- 全仓 §24→§11 清理 → CLI docs/TODO.md 挂观察项（后续批——不做全仓大扫）

## 受影响文件（双端——评审 #1 实测行数 + 预计增量——>300 审视注）

> 档位总览：全 <500 硬限（最接近 VSC config-io 494 +1 → 495 安全）——8 文件 >300 advisory 档——
> 本批增量全部 ≤±25 不触发拆分——审视注：无 >500 诞生/逼近风险（config-io 495 记录为最热点——
> 下次触碰优先拆）——纯 .md 豁免行数标注。

| 文件 | 端 | 现行数（评审 #1 实测） | 预计增量 | 改动 |
|---|---|---|---|---|
| src/agent-tools/advisor-async.mjs | CLI | 457（>300 审视——增量安全） | ≤±25 | 常量 4 + 读取器 + scope 守卫 + 文案生效值 |
| src/config.mjs | CLI | 429（>300 审视——结构不变） | +1 | DEFAULTS poolLimits 加 advisor:4 |
| src/tui/cmd-config.mjs | CLI | 393（>300 审视——增量安全） | ≤+12 | advisor 第三项 |
| src/agent-tools/advisor.mjs | CLI | 211 | ≤+2 | 描述去数字化活引用 |
| src/agent-tools/subagent-async.mjs | CLI | 417（>300 审视——仅注释） | 0（替换） | §24→§11 注释 |
| src/agent-tools/advisor-async.mjs | VSC | 433（>300 审视——增量安全） | ≤±25 | 常量 4 + 读取器 + scope 守卫 + 文案插值 |
| src/config-io.mjs | VSC | 494（>300 审视——最热点 495 安全） | +1 | 默认 + 白名单加 advisor |
| src/extension/settings.mjs | VSC | 309（>300 审视——增量安全） | +1 | 回退对象加 advisor:4 |
| webview/settings-agent.js | VSC | 169 | ≤+10 | 第三数字框 |
| locales/en.json + zh.json | VSC | 240 ×2 | ≤+4 ×2 | poolAdvisor 文案 |
| src/agent-tools/subagent-scheduler.mjs | VSC | 459（>300 审视——键表评估） | ≤+1 | 键表 + §24 注释 |
| src/prompts/engineering.md | VSC | 88（.md 豁免——列结构变更） | ≤+2 | 去数字化活引用 |
| docs/design/AGENT-LOOP.md + ENGINEERING-MODE.md + ARCHITECTURE.md | 双端 | doc 豁免 | doc | 同步 |
| docs/design/README.md | CLI | doc 豁免 | doc | 登记（核销时） |
| docs/TODO.md L91 | CLI | doc 豁免 | doc | 需求勾销（核销时）|
| test/（评审 #3 点名：CLI test/config-pool.test.mjs（耦合锁/读取器/容量拒/scope 守卫/子菜单读写——
  若 TUI 基建无则子菜单走人工清单）+ test/advisor-description.test.mjs（活引用）；VSC
  test/config-pool.test.mjs（耦合锁/读取器/容量拒/scope 守卫/白名单）+ test/settings-panel.test.mjs
  （回退显 4）） | 双端 | 新 | 新 ≤150 | 新测试 |
## 用例表（正常/边界/错误——对应 F-1~7）

| 用例 | 输入 | 预期输出 |
|---|---|---|
| 默认三键 | 无配置（null） | 4/4/4——F-1 耦合锁 |
| advisor 合法覆盖 | poolLimits.advisor=6 | 生效 6——文案报 6——F-2/F-6 |
| advisor 非法回退 | poolLimits.advisor="abc"/0 | 回退 4——F-2 |
| 第 5 并发评审 | 4 running + 第 5 启动 | 池容量拒——F-2 阈值 |
| 同 scope 并发 | scope X running + 同 scope 新启 | scope 守卫拒——F-5 |
| 同 scope 续跑 | scope X settled + 同 scope 发起 | round+1 续跑（现语义保持）——F-5 |
| 异 scope 并行 | scope X + scope Y 各 1 | 两守卫都过——并行允许——F-5 |
| CLI /config 写 | advisor 改 6 | 子菜单/主菜单/view 显 6——F-3 |
| VSC 面板写 | advisor 框 6 保存 | 白名单过——落盘——生效——F-4 |
| VSC 面板回退 | 无配置开面板 | 三框显 4——F-4 |
| 工具描述 | 模型读 advisor 描述 | 无死数字——活引用默认 4——F-6 |

## 验收

- AC-1 三池默认 4（双端常量 + DEFAULTS + 回退 4/4/4——耦合锁测试绿）
- AC-2 advisor 可配（读取器合法覆盖/非法回退——文案含生效值——双端测试）
- AC-3 CLI /config 三域读写（子菜单/主菜单/view 一致——评审 #3 钉死：config-pool.test.mjs 子菜单读写测
  （若 TUI 基建无 → 固定人工走查清单：/config → 并发池 → 三值读写 → 重进核对））
- AC-4 VSC 面板三框读写（白名单 + 落盘 + 回退显 4——config-io 纯函数单测）
- AC-5 同 scope 并发守卫（running 同 scope 拒——settled 续跑不回归——异 scope 并行允许——双端测试）
- AC-6 文案去数字化（advisor.mjs 描述/engineering.md/拒文案无死数字——活引用生效值）
- AC-7 §24 触碰行已更新（触碰文件 grep 无 §24 残留——全仓清理已挂 TODO）
- AC-8 测试绿（双端各自 npm test 快层——既有零回归——subagent 两域语义零变）
- 红线：MAX_REVIEW_ROUNDS=5/②-6a 不排队语义不变 + engCoder/other 行为零变 + CLI/VSC 锁步同构

## 变更记录
- 2026-09-09：落档（勘察一手——advisor 池落点 100% 仓内——可配键/界面/doc 行全定位——测试真空申报）——用户三裁并入（①同 scope 守卫 ②去数字化 ③触碰行 + TODO）。TODO L91 勘察结论更新：原"平台限 2 待勘察" → 已证仓内——实现无平台面。
