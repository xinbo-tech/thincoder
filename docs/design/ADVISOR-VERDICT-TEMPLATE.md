# Advisor 裁决模板（ADVISOR-VERDICT-TEMPLATE）

> 板块：评审收敛（工程模式——advisor 提示词）。权威源：ADVISOR-CONVERGENCE.md + src/prompts/advisor-round1/2/3.md + advisor-design.md。
> 状态：**设计待评审**——2026-09-09 落档（勘察一手——治 #15/#36 单轮 126s+ 输出 reasoning 自我协商——用户 2026-09-08 裁立项 L50）。

---

## 需求

- **总体目标**：治 advisor 单轮长输出（#15/#36 实测 126s+——模型在输出尾部自我协商/反复权衡拖长单轮）——给 advisor 结构化**裁决行**——逼短平快收尾（省时间省 token——不牺牲裁决严谨性——评审质量优先）。
- **功能性**：F1 各 advisor prompt 档尾加"结尾裁决行"指令（VERDICT: pass|changes-required + 计数）——F2 裁决行与既有机械 marker 兼容（design tokenPattern/失败前缀——不加新机械消费点）——F3 双端同源同批（round1/2/3 + design 逐字同源——勘察核）——F4 长输出抑制（裁决行指令含"收尾一短行——勿在裁决后再协商"）。
- **范围边界**：不改结算/判定逻辑（marker 消费现况：design = design-token.mjs tokenPattern 回声即过——code = 无正向消费只排失败前缀——裁决行给人读总结 + 潜在未来机械点——本批不加新消费）。VSC design-token 判定在别处内联（勘察核——双端同源提示词仍适用）。

## 设计

1. **round1.md**（表格规范区 :16-25 后 + pass/fail 段 :25 处）加裁决行指令：表格/发现后**收尾一行** `VERDICT: pass | changes-required`（pass = 无 🔴；changes-required = 有 🔴/🟡 需修）——**裁决后不再输出任何内容**（治尾部长协商）。
2. **round2/3.md**（verify-only :20 "If all 🔴 resolved… passes" prose）同加：核验表后 `VERDICT: pass | changes-required` + 收尾禁续。
3. **advisor-design.md**（:16 Approval Signal 区——已有 DESIGN-TOKEN 回显结构）——加 `VERDICT: pass | changes-required` 前置行（token 回声前）——不干扰 tokenPattern 解析（token 独立行）。
4. 双端同批同文（round1/2/3 + design 各档——逐字同源——byte 同步不漂移）。
5. 测试：prompts 内容断言（如 test/ 有 prompts 锚测试——按需补 VERDICT 行存在断言——或 verify-redesign 等既有）——若 test/ 无锚（09-07 清空）说明。

## 受影响文件

| 文件 | 端 | 改动 | 行数 |
|---|---|---|---|
| src/prompts/advisor-round1.md | 双端 | 尾加裁决行指令 | ~+4 |
| src/prompts/advisor-round2.md | 双端 | 同 | ~+3 |
| src/prompts/advisor-round3.md | 双端 | 同 | ~+3 |
| src/prompts/advisor-design.md | 双端 | VERDICT 前置行 | ~+2 |
| prompts 锚测试（如有） | 双端 | VERDICT 断言 | 按实际 |

## 验收

- AC1 各档含 `VERDICT: pass | changes-required` 收尾指令（双端逐字一致）
- AC2 "裁决后不再输出"指令在位（治尾部长协商）
- AC3 机械 marker 不干扰（design tokenPattern 独立行解析不受影响——code 失败前缀排除不受影响）
- AC4 双端同源（byte 同步——round1/2/3 + design 各档 diff 双端一致）
- AC5 既有测试不回归（提示词改动——无锚测试则说明）
