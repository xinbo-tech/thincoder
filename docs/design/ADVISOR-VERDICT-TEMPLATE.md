# Advisor 裁决模板（ADVISOR-VERDICT-TEMPLATE）

> 板块：评审收敛（工程模式——advisor 提示词）。权威源：ADVISOR-CONVERGENCE.md + src/prompts/advisor-round1/2/3.md + advisor-design.md。
> 状态：**已交付核销**——2026-09-09（CLI 33ed72b + VSC f9f0335——8 prompt 档裁决行 + 锚测试 9/9——byte 同步 8/8——L2 双端绿——consume 9e85ddd9）。

---

## 需求

- **总体目标**：治 advisor 单轮长输出（#15/#36 实测 126s+——模型在输出尾部自我协商/反复权衡拖长单轮）——给 advisor 结构化**裁决行**——逼短平快收尾（省时间省 token——不牺牲裁决严谨性——评审质量优先）。
- **功能性**：F1 各 advisor prompt 档尾加"结尾裁决行"指令（评审 #1：**单值裁决行**——模型输出 `VERDICT: pass` 或
  `VERDICT: changes-required` 之一——非双侧字面——**无数字计数在行上**（F1 计数措辞删——计数语义由
  pass 判定蕴含：pass = 无 🔴））——F2 裁决行与既有机械 marker 兼容（design tokenPattern/失败前缀——
  不加新机械消费点）——F3 双端同源同批（round1/2/3 + design 逐字同源——勘察核）——F4 长输出抑制
  （裁决行指令含"收尾一短行——勿在裁决后再协商"）。
  **每轮 pass 规则（评审 #1 钉死）**：round1 pass = 无 🔴；round2/3（verify-only）pass = 全部 prior 🔴
  已解决且无新 🔴——🟡-需修 → changes-required——🟡-可选/🔵 → 仍可 pass 但列 advisory。
- **范围边界**：不改结算/判定逻辑（marker 消费现况：design = design-token.mjs tokenPattern 回声即过——code = 无正向消费只排失败前缀——裁决行给人读总结 + 潜在未来机械点——本批不加新消费）。VSC design-token 判定在别处内联（勘察核——双端同源提示词仍适用）。

## 设计

1. **round1.md**（表格规范区 :16-25 后 + pass/fail 段 :25 处）加裁决行指令：表格/发现后**收尾一行**
   `VERDICT: pass | changes-required`（pass = 无 🔴；changes-required = 有 🔴/🟡 需修）——**裁决后不再输出
   任何内容**（治尾部长协商）——**评审 #2 双轨消除：既有 pass/fail 句（round1 :25 "🟡/🔵 do NOT block
   approval"）改写并入钉死规则——🟡-可选/🔵 不阻断 pass；🟡-需修 = advisory 明示"must fix before
   implementation/approval"（advisory 分类在表格列明——模型判类依据）→ changes-required**。
2. **round2/3.md**（verify-only——round2 该句实 :24/round3 :20——评审 #3 锚点行号注）同加：核验表后
   `VERDICT: pass | changes-required` + 收尾禁续——**评审 #2：既有 prose 同步改写**（"🟡/🔵 do not
   block" → "🟡-可选/🔵 不阻断——🟡-需修 → changes-required"）。
3. **advisor-design.md**（:16 Approval Signal 区——已有 DESIGN-TOKEN 回显结构）——加 `VERDICT: pass |
   changes-required` 前置行（token 回声前）——**评审 #2 措辞定制："VERDICT 行后仅允许回显 DESIGN-TOKEN
   与 designId——之后不再输出任何内容"**——token+designId 保持末字节——不干扰 tokenPattern 解析
   （token 独立行）——"不再输出"句不原样套 design 档（防模型吞 token）。
4. 双端同批同文（round1/2/3 + design 各档——逐字同源——byte 同步不漂移）。
5. 测试：prompts 内容断言（如 test/ 有 prompts 锚测试——按需补 VERDICT 行存在断言——或 verify-redesign 等既有）——若 test/ 无锚（09-07 清空）说明。

## 受影响文件

| 文件 | 端 | 改动 | 行数 |
|---|---|---|---|
| src/prompts/advisor-round1.md | 双端 | 尾加裁决行指令 | 35 现（+~4——评审 #3 实测） |
| src/prompts/advisor-round2.md | 双端 | 同 | 35 现（+~3——评审 #3 实测） |
| src/prompts/advisor-round3.md | 双端 | 同 | 31 现（+~3——评审 #3 实测） |
| src/prompts/advisor-design.md | 双端 | VERDICT 前置行（评审 #2 定制措辞） | 31 现（+~2——评审 #3 实测） |
| prompts 锚测试（如有） | 双端 | VERDICT 断言 | 按实际 |

## 验收

- AC1 各档含 `VERDICT: pass | changes-required` 收尾指令（双端逐字一致）
- AC2 "裁决后不再输出"指令在位（治尾部长协商）
- AC3 机械 marker 不干扰（design tokenPattern 独立行解析不受影响——code 失败前缀排除不受影响）
- AC4 双端同源（byte 同步——round1/2/3 + design 各档 diff 双端一致）
- AC5（评审 #4）既有测试不回归——实现前测试层补全（per-file VERDICT 存在断言 AC1/AC2/AC4——双端 byte 同步
  检查——锚测试回归——有输入/预期输出——09-07 清空事实实现期确认）
- AC6（评审 #6 NFR——行为可观测）VERDICT 行后无实质内容段（content-level 抽查——非仅指令在位）
- AC7（评审 #2——双轨消除）文件内无与裁决行冲突的旧 pass 定义（旧 prose 已改写并入——grep/目视核）

## 变更记录
- 2026-09-09：L50 立项落档（勘察一手——marker 消费调研：design = design-token tokenPattern 回声/ code = 失败前缀排除无正向消费）。评审 6 项采纳（裁决单值格式 + 每轮 pass 规则钉死 / design 档 token 回显措辞定制 / 受影响表补行数 / 测试层完成注 / 文档归属注 / NFR 度量 AC6——token 0bc7a599）。
