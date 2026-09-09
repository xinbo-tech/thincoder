# 头尾保留读取与截断（DUAL-END-TRUNCATION——L19+L20）

> 板块：工具输出限制（CLI+VSC 双端——read 工具 C 方案 + advisor 截断双端化）。权威源：TOOL-OUTPUT-LIMITS-{REQUIREMENTS,TUNING}.md（板块档）+ L19/L20 待办。
> 状态：**设计待评审**——2026-09-09 落档（代码正确性核实一手 + 用户裁 B 双端方向——L19 read C + L20 advisor 截断同构合并设计）。需求：TODO L19（read offload C 真未做）+ L20（advisor 截断方向——用户裁 B 双端）。

---

## 需求

- **总体目标**：统一"头+尾保留、中段截断"策略——治两类尾切：① read 工具读回 offload/大文件（现纯头向——尾不可见）② advisor 工具结果回填（现保头弃尾——评审尾部结论被切）——双端锁步（CLI+VSC）。
- **功能性**：
  - F-1 read 工具 C 方案：read 对大文件/offload 产物返回"头+尾"（判别分支——头 N 行 + 省略注 + 尾 M 行）——替代纯头向窗口
  - F-2 advisor 截断双端化：结果回填从保头弃尾 → 头尾双保（中段切 + offset 续读提示）
  - F-3 双端锁步（CLI file.mjs:96-108 / VSC file.mjs:13-55 read——CLI run.mjs:315-335 / VSC run.mjs:285-306 advisor）
  - F-4 与 hashes 模式/offset 续读交互保留（现 offset 续读路径不破坏）
  - **范围边界**：read offload 判别方式（offload 文件标记/大小阈值）设计内定；主循环 64K offload（dispatch.mjs:393）不动；单次输出上限 MAX_OUTPUT_CHARS 不动；L19 A 方案（offload 落盘双端预览）不动（已落地——C 是 read 自身）。

## 设计（双端——照做勿自行解释——参数实现期定稿）

### 1. read 工具 C 方案（F-1）
- 判别：read 请求窗口覆盖大文件/offload 产物（文件 > 阈值或含 offload 尾注标记——实现期定判别——与 hashes 模式交互核）
- 返回形态：头 N 行（offset 起） + `…(truncated: K lines in middle, use offset to continue)` + 尾 M 行（现 CLI file.mjs:96-108 尾注升级为真实尾行内容——VSC file.mjs:13-55 补行数提示）
- N/M 参数（头尾保留行数——实现期定——参照 CLI 2000 行默认/尾 M 与 read offload 双端预览同构）
- 交互：offset 续读路径不变（中段可逐页读）；hashes 模式（若 read 支持）与双端返回的交互核（hashing 行——头尾行 hash 照常）

### 2. advisor 截断双端化（F-2——用户裁 B）
- 现：CLI run.mjs:315-335 / VSC run.mjs:285-306——从首行累加到 MAX_RESULT_CHARS=64K break（保头弃尾）
- 改：头行累加至阈值 ~60% → 中段切 + `…(truncated: N more lines)` + 尾行累加至剩余 ~40%（保尾结论）——offset 自救提示保留（read(path, offset=..., limit=...)）
- 头尾比例（60/40——实现期可调）——保证：头部上下文（评审目标/标准）可见 + 尾部结论/裁决可见
- 与 L19 read C 同构（同"头+尾防尾切"策略——共享设计语言——分别实现）

### 3. 双端锁步（F-3）
- CLI + VSC 同实现（read 双端 file.mjs——advisor 双端 run.mjs）——逐字同构（双端镜像纪律）
- 测试双端：read 大文件返回头+尾形态断言 / advisor 超 64K 结果头尾保断言 + offset 续读路径不回归

### 4. 参数与判别（设计内定——实现期实测校准）
- READ_HEAD_LINES/READ_TAIL_LINES（read 头尾行数——默认参照现 2000 窗口的合理头尾）
- ADVISOR_HEAD_RATIO≈0.6（advisor 头占比——尾自动余）
- offload 判别标记（read 侧——现 offload 注入文案 helpers.mjs:130-134——可作判别锚）

## 受影响文件（双端）

| 文件 | 端 | 改动 |
|---|---|---|
| src/tools/file.mjs:96-108 | CLI | read C 方案（头+尾）——评审 #2：现数实现期实测——预计 ≤±15（结构不变级——行数表随实现回填） |
| src/tools/file.mjs:13-55 | VSC | read C 方案 + 行数提示补——评审 #2：同上现数实现期实测 ≤±15 |
| src/advisor/run.mjs:315-335 | CLI | 截断双端化（头~60%+尾~40%）——评审 #2：同上现数实现期实测 ≤±15 |
| src/advisor/run.mjs:285-306 | VSC | 同——评审 #2：同上现数实现期实测 ≤±15 |
| test/read-dual-end.test.mjs + test/advisor-truncation.test.mjs（评审 #5：具体文件名——双端各自同名镜像） | 双端 | 新测试 |
| docs/design/TOOL-OUTPUT-LIMITS-TUNING.md | CLI | §2.5 advisor 截断描述同批更新（评审 #3——防双述）+
  C 方案核销 + 双端化记录 |
| docs/design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md | CLI | FR3/FR4 双端语义增补（评审 #3——同批不滞后） |

## 验收

- AC-1 read 大文件返回头+尾（形态断言——头 N + 省略注 + 尾 M——双端测试——评审 #4：边沿补——
  offset 窗口与尾区重叠不重复/无尾注时 K=0 无假省略注/≤阈值文件走旧头向路径——实现期数值钉死 N/M/阈值）
- AC-2 advisor 超限结果头尾保（头部上下文 + 尾部结论可见——offset 续读提示在——双端测试）
- AC-3 offset 续读/hashes 模式零回归（现路径不破坏）
- AC-4 双端锁步（CLI/VSC 同实现——逐字同构）
- AC-5 测试绿（read + advisor 截断测试 + 既有——双端 npm test）
- AC 红线：单次输出上限/64K offload 主循环/A 方案不动——纯 read+advisor 截断层

## 变更记录
- 2026-09-09：L19+L20 合并落档（核实一手——read C 真未做/advisor 保头弃尾——用户裁 B 双端 + 与 L19
  同构合并设计——双端锁步）。
- 2026-09-09 评审 5 项采纳（文档归属注/受影响表补行数/同批文档一致性/AC 边沿用例/测试文件名——token e7aa5d71）。

> 归属注（评审 #1）：本档 = L19+L20 批设计载体——实现时权威措辞并入 TOOL-OUTPUT-LIMITS-TUNING.md
> §新增（read C + advisor 双端——同批更新防双述）——REQUIREMENTS.md FR 增补——核销时随 README 变更记录
> 登记或归档（同 MEMORY-TOOL-SCOPE-FIX 先例）。
