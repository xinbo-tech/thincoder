# 提示词注意力优化重排 + 自动推进开关（PROMPT-ATTENTION-RESTRUCTURE）

> 板块：提示词工程（双端 src/prompts/ 全 15 文件 + ENGINEERING-MODE.md 联动 + AUTO-PROGRESS-SWITCH 合并）。
> 权威源：全量勘察（explore#1——31 文件基线：🔴24/🟡6/🟢1——提示词目录无一个达标——最长行 1959 字符
> engineering.md L13——形态成因=批式编辑行尾 append + 标题标记 inline）。
> 状态：**设计待评审（评审 #2 changes-required 修正版——round 3 PASS——2026-09-09 21:11）**——评审 #3 附 5 项
> 非阻塞 advisory（🟡 状态行/AC-4 引用/AUTO 行状态 + 🔵 孤号/300 档豁免）——本批已修——token 已签发
> （designId 60ff4e55）——阶段 A 待启动（explore 切分方案——先审后执行）。2026-09-09 落档（用户指出
> "没做注意力
> 优化"——designer 增强 fe6d62d 实证把 A1-A4 锚行中内插进千字行——注意力污染起点——方向：**先重排再加段**——
> **B 裁：AUTO-PROGRESS-SWITCH 合并本档作废**——开关段范围 = 主会话提示词——全提示词都要重排）。需求：TODO
> 提示词注意力优化重排 + 自动推进开关（用户反馈——2026-09-09）。

---

## 需求

- **总体目标**：按**人类可读 + 注意力优化**标准重排全部提示词文件——让关键控制规则（用户批准门/推进档位/
  叫停）落在模型高注意力区——不再埋千字行中段。内容语义零改动；重排后并入自动推进开关段（先重排再加段——
  开关段权威内容 = 原 AUTO-PROGRESS-SWITCH 档——**该档合并作废**）。
- **注意力优化方法论（7 原则——行为依据——重排按此执行）**：
  1. **优先级排序**：最高优先规则（听用户的闸/批准门）放文件最前部
  2. **规则独立成短句 + 加粗关键词**：关键指令一行一条——加粗触发词
  3. **命令句 + 否定强调**：闸用祈使/禁止句——非叙述性——命令句注意力权重更高
  4. **关键规则放首/尾**（serial position）：批准门等放每条消息处理规则顶部
  5. **减量提权**：长文机制细节从正文移走/指向文档——减总量提升剩余注意力
  6. **关键锚点多处重复**（不同措辞）：顶部总则 + 具体 flow 点 + Hard Rules
  7. **视觉锚**：`>` 块引用 / 加粗 / 独立行——关键行有结构性凸起
- **功能性**：
  - F-1（全文件重排）双端 src/prompts/ 全部 15 文件按 7 原则重排——标题独占行 + 规则短句化 + 关键控制规则
    前置 + 视觉锚
  - F-2（开关段并入——合并 AUTO-PROGRESS-SWITCH）自动推进档位（auto/manual）作为最高规则段放**主会话提示词**
    **最前部**（engineering.md/main.md/system.md——用户在场的）——**子代理提示词不放**（coder/advisor-design/
    round1-3/explore/plan/eng-coder/consult-base/engineering-sub——子代理内无用户可等——"execute immediately"
    语义保留）——逐字文本 = 原 AUTO-PROGRESS-SWITCH F-1/F-2/F-3（字节源——权威内容见阶段 C——**逐字保真
    仅限 engineering.md 的三个结构位**（Work Loop 前/step 4 尾/分派表最前——main.md/system.md 无同结构））
  - F-3（锚断言联动）ENGINEERING-MODE §2.9 + 测试——重排后断言改写（改写清单见阶段 D——行号索引断言
    重定位 + bullet 切片断言重定位 + 锚断言**按形态分类**——列举型（A1/A3）关键子串 / 命令型（A2/A4 + 核心
    纪律句）保逐字——§2.9 契约文本更新）
  - **范围边界**：内容语义零改动（纯拆行/换行/换位/提权——不改规则含义）；**双端同源不硬一致**（方案在设计档
    定稿权威源——各端独立落地照抄——端特有段各端保留——不加 byte-identical 硬校验/同步依赖——语义锚断言守
    一致）；开关段只进主会话提示词（子代理提示词零**开关段**改动——F-1 重排照常——engineering-sub 保留）；ENGINEERING-MODE.md 本身 🟢 不重排
    （只联动 §2.9）；fe6d62d src/tui 混批单独排查；AUTO-PROGRESS-SWITCH.md 删除（合并作废——本档唯一权威）。

## 设计（分阶段——照做勿自行解释）

### 阶段 A：逐文件切分方案（explore 产出——先审后执行）
- 每个 🔴/🟡 文件出一份：现有行 → 按 `## ` / 编号边界 / `。 - ` 标记切分 → 每条规则独立短行 → 归属标题
  归类 → **关键规则提权位置标注**（哪些规则提到文件前 20%）
- 方案在设计档定稿（权威源——排版/提权位置统一）——各端独立落地照抄（不加 byte 硬校验）
- 产出后**呈现给用户审**——审过才执行（不自动进入 B）

### 阶段 B：eng-coder 分批执行
- 按权重序分批：engineering.md → system.md/main.md → engineering-sub.md → discipline.md → advisor 四件套/其余
- 每批执行后：无 >500 行 + 标题全独立 + 锚断言绿（改写后版——见阶段 D）

### 阶段 C：开关段并入（重排后——合并 AUTO-PROGRESS-SWITCH 权威内容）
1. **顶层档位规则**（engineering.md Work Loop 前插——逐字文本——原 AUTO-PROGRESS-SWITCH F-1）：
> ## Progress mode（推进档位——先于 Work Loop 判定）
> Progress has two modes: **auto**（默认——each step completed → present → proceed to the next）and **manual**
> （用户叫停/把关时切入——each step completed → present → WAIT for explicit go before the next）。叫停与把关
> 是**意图**不是词表：你的话表达"停下 / 先别 / 别急 / 等下 / 别自动 / 我要看看再定"即切 manual——无需特定措辞。
> manual 下你**继续回答与讨论、呈现当前结果**——只是不自动跨出下一步（spawn / 评审发起 / 推进落档 / digest
> 处理后的后续动作都停住等点头）。你下一条明确指示（"可以 / 继续 / 开始"或具体下一步指令）恢复 auto——原状态
> 不丢——推进档位只是每步间的闸，不是新状态。
2. **step 4 尾句补**（engineering.md flow step 4 digest 描述尾——"for the eng-coder spawn"后追加——原
   AUTO-PROGRESS-SWITCH F-2）：
> — this digest is a MACHINE SIGNAL that the review finished; it is NOT authorization to spawn or proceed.
> Under manual mode the result is presented and progress waits for the user's explicit go.
3. **分派表加 manual 语义**（engineering.md "Then handle the message" 列表最前——原 AUTO-PROGRESS-SWITCH F-3）：
> - **User stop / hold-back**（你说"停 / 先别 / 别急 / 等下 / 别自动"或表达"我要把关再定"——意图为准非词表）→
>   推进切 manual：本消息仅回答/呈现，不落文档推进、不 spawn、不发起评审——你明确指示后恢复。
4. **main.md/system.md 对应段**：主会话提示词按同语义落对应位置（main.md 顶部纪律区 + system.md 确认门区）
   ——措辞源 = 本档顶层档位规则语义（auto/manual 两档 + 叫停意图非词表 + 不丢状态 + 恢复词）——main/system
   无 engineering 的 Work Loop/digest/分派表结构——不逐字抄结构句——落**语义对应段**（端特有结构各自位置）
   ——兜底断言 = AC-2 前 20% 巡检（auto/manual 档位词在该文件前 20%）

### 阶段 D：锚断言改写清单（评审 #1 #2 + 评审 #2 #1——设计定稿——实现照此改测试）
- **行号索引断言重定位**：main.md L8/L13（测试用 split("\n")[7]/[12]）、engineering.md step 4 L16
  （split("\n")[15]）——重排后行号变——断言改为**锚定内容特征**（该行起始文本片段）而非行号
- **bullet 切片断言重定位**：main.md escalate 段 escSeg 切片（测试 L36-37 区）——同法改内容特征锚
- **锚断言按形态分类（权威分类——F-3/AC-4 引用此——消除 A1-A4 整体归类的假两难）**：
  - **列举型 → 关键子串断言**：A1 勘察 checklist（①-⑤ 子条）+ A3 评审前预检（①-⑤ 子条）——重排拆成
    独立子行——断言改**子条级关键词子串**（每条 ①②③…的触发词 fail-when-unchanged）——子条才是防漂移点
  - **命令型 → 保逐字整句**：A2 方案对比（候选≥2 → MUST 对比子节——单意命令）+ A4 实践沉淀（短句）——
    重排不拆——整句逐字 fail-when-unchanged
  - **核心纪律句 → 保逐字整句不降级**：批准门/WAIT/发起权（step 3/step 5 语义——§2.9 锚 #4 类独立于 A1-A4）
  - **需求池锚 → 关键子串**：三规则句本就子串断言形态——重排拆行后仍按原子串
- §2.9 契约文本更新：锚清单注每锚断言形式（保逐字名单：A2/A4 + 核心纪律句——子串名单：A1/A3 子条 + 需求池）
  ——双端同步
- 上游字节源档（MAIN-DESIGN-ENHANCE A1-A4 定稿文本）同步注：MAIN-DESIGN-ENHANCE 保原逐字（字节源不拆）——
  下游 engineering.md 重排后 A1/A3 子条子串化、A2/A4 保整句——注记 §2.9（保逐字与子串名单一致——无冲突）
- AC-5 快层零回归为兜底——漏改断言显红

## 受影响文件（双端——评审 #1 #3 补预计增量）

| 文件 | 端 | 现行数 | 预计增量 | 改动 |
|---|---|---|---|---|
| src/prompts/engineering.md | 双端 | 88 | 重排 88→~300 + 开关段 ≤+15 | F-1 重排 + 开关段（最高优先） |
| src/prompts/engineering-sub.md | 双端 | 14 | 重排 14→~60 | F-1 重排（子代理——无开关段） |
| src/prompts/system.md | 双端 | 44 | 重排 44→~120 + 开关对应 ≤+5 | F-1 + F-2 |
| src/prompts/main.md | 双端 | 34 | 重排 34→~90 + 开关对应 ≤+5 | F-1 + F-2 |
| src/prompts/methodology-template.md | 双端 | 38 | 重排 38→~90 | F-1 |
| src/prompts/advisor-design.md | 双端 | 33 | 重排 →~60 | F-1 |
| src/prompts/advisor-round1/2/3.md | 双端 | 39/38/34 | 各重排 →~60-80 | F-1 |
| src/prompts/discipline.md | 双端 | 84-85 | 重排 →~150 | F-1 |
| src/prompts/coder.md / eng-coder.md | 双端 | 13-19 | 各重排 →~40-50 | F-1 |
| src/prompts/plan.md / explore.md / consult-base.md | 双端 | 9-17 | 各重排 →~30-40 | F-1 |
| docs/design/ENGINEERING-MODE.md（§2.9 锚断言形式） | CLI | 313 | ≤+10 | F-3 契约文本更新（本身不重排） |
| test/prompts-async-guidance.test.mjs | 双端 | CLI 165 / VSC 160 | ±30 | F-3 断言改写（行号→内容特征 + 锚子串化） |
| ~~AUTO-PROGRESS-SWITCH.md~~（B 裁——已合并作废删除——文件已从仓移除） | CLI | 已删除 | 无动作（权威内容已并入本档阶段 C） | B 裁合并 |
| docs/design/README.md（文档地图——评审 #2 #3） | CLI | — | ≤+3 | 本档登记 + AUTO-PROGRESS-SWITCH 删除注 |

## 用例表（评审 #1 #6 补边界/错误行）

| 用例 | 输入 | 预期输出 |
|---|---|---|
| 标题独立 | 原行内 `## Work Loop` | 独占一行——F-1 |
| 规则短句化 | 原千字行 5 机制 | 拆 5 条独立短句——F-1 |
| 开关并入 | 重排后 engineering.md | auto/manual 段文件最前——F-2 |
| 开关范围 | 子代理提示词 | 无开关段（用户不在场）——F-2 |
| 锚断言改写 | 重排后跑测试 | 行号断言→内容特征 + 核心纪律句保逐字——F-3 |
| 边界：code-block 内标记 | `。 - ` 出现在引用示例内 | 不误切（code-block 跳过）——F-1 |
| 错误：断言漏改 | 某行号断言未重定位 | AC-5 测试红——漏改显形——F-3 |
| 错误：端特有段冲突 | VSC R14 池规则段 | 端特有保留——不硬统一——F-1 |

## 验收（评审 #1 #4 补量化判据）

- AC-1 全部 15 文件双端重排：**量化判据**——每条规则独立一行（无多规则并一行）+ 行长 ≤200 字符 + 标题
  全独立 + 无 >500 行——机械可验（巡检脚本扫 src/prompts）
  （注：提示词为整文件加载资产——&gt;300 行档不适用拆分——工程文件守 ≤500 硬顶——AC-1 检 ≤500 即可）
- AC-2 注意力分布：**最高规则（批准门/推进档位）在文件前 20%**（巡检断言——前 20% 含巡检标记词——
  WAIT/Do NOT/never/auto/manual 类命令句标记）+ 命令句形态——机械可验
  （注：AC-2 巡检标记词 ≠ 红线禁止的"叫停触发词表"——前者是断言扫描用的命令句标记——后者是把叫停
  理解降级成词表匹配——不同物不冲突）
- AC-3 内容语义零改动（逐句对照——措辞含义不变——实现批自查 + 交付审计）
- AC-4 锚断言改写版双端绿——**按阶段 D 形态分类**（A1/A3 子条级子串 + A2/A4/核心纪律句保逐字整句 + 需求池
  原子串——fail-when-unchanged——行号→内容特征重定位含 bullet 切片）
- AC-5 双端 npm test 快层零回归
- 红线：不改规则语义；子代理提示词无开关段（engineering-sub 保留 "execute immediately"）；双端同源不硬一致
  （不加 byte 硬校验）；ENGINEERING-MODE.md 本身不重排（只动 §2.9 断言形式）；fe6d62d src/tui 混批单独排查；
  不加关键词词表（叫停 = 语义理解——意图为准）

## 变更记录
- 2026-09-09：落档（用户叫停失败 + 注意力优化——designer 增强 fe6d62d 行中内插 A1-A4 为污染起点实证——7 原则
  方法论——全提示词重排 + 开关段并入——锚断言子串联动——双端同源不硬一致——AUTO-PROGRESS-SWITCH 合并作废）。
- 2026-09-09：评审 #1 changes-required 修正版（🔴 AUTO-PROGRESS-SWITCH 双规格矛盾——**B 裁：合并本档作废删除**
  开关段范围 = 主会话提示词（子代理无用户可等不放）+ 🟡 #2 锚断言改写清单 + 🟡 #3 受影响表补预计增量 + 🟡 #4
  AC 量化判据 + 🔵 #5-7 措辞/用例/地图注——round 2 待评）。
- 2026-09-09：评审 #2 changes-required 修正版（🔴 #1 锚断言分类矛盾解——**按形态分类非 A1-A4 整体**：列举型
  A1/A3 → 子条级关键子串（重排可拆）——命令型 A2/A4 + 核心纪律句 → 保逐字整句不拆——需求池按原子串——
  F-3/§3/AC-4 引用单一权威分类——上游 MAIN-DESIGN-ENHANCE 保逐字注记调和）+ 🟡 #2 表补 advisor-design 行
  （15 文件齐）+ 🟡 #3 README 地图行 + 🟡 #4 main/system 语义对应段明 scope（逐字仅 engineering 三结构位——
  AC-2 兜底）+ 🔵 #5 编号指针修正 + 🔵 #6 AC-2 巡检标记 ≠ 红线触发词表区分语 + 🔵 #7 子代理零开关段改动
  措辞——round 3 待评）。
