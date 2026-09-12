# 批次记录（本仓份）— COMMON-LAYER（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-COMMON-LAYER（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 回注（2026-09-12）：对端（CLI 仓）源档对应块**已补切**（本档逐字承载在先——对齐核验 57/57 零差异 · 源档 blob SHA 双向一致；实证见 `LEDGER-SELF-CONTAINED（CLI 仓）§5` 记录）。
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **18** 条目 = VSC 面域 18 档）；源档 blob SHA（切除前）= 2519c46a2c4e。
> 源档案内锚：§2「VSC 面」块（`:288`）+ §5 双面交付（id=37）。

## 本仓份（逐字自源档搬运）

### 实施记录（eng-coder 自写 · 2026-09-11——VSC 面）

**面域**：VSC 仓 18 档（9 EN 提示词 + 7 CN 权威源 + 2 测试档）；CLI 仓零触碰；**零源代码改动**（`src/*.mjs` 未碰）；未 commit。

**落笔前置（顺序不跳——两项已执行）**：

1. CLI 面已落定核验：`src/prompts/common.md`（CLI 仓） 10 节在位（11 块）、9 EN + 7 CN + 2 测试档改动齐备——核验通过后才落笔。
2. VSC 与 CLI 的 5 档落笔前**逐字同文**（common / persona-normal / persona-explore / persona-coder / persona-plan——比对 CLI HEAD 确认一致，落定后仍逐字同文：common 115 行全等）；
   余 4 档端自持（VSC 端特有段保留）。
3. 3 条搜索条款字面串（`prompts-async-guidance` 既有断言）↔ 设计 §2.2 草案逐字比对：**3/3 逐字命中**——无差异，草案无需回改。
4. §4 行数现场重测：全表按现场（下表）；无超档（提示词 ≤300；测试档 ≤500 硬限内）。

**实测行数（内容行——落定；设计注记 → 落定）**：

| 文件 | 设计注记 → 落定 |
|---|---|
| `src/prompts/common.md` | 40→≈115 / **115**（与 CLI 逐字同文） |
| `persona-engineering.md` | 79→≈84 / **86**（含 VSC Multi-Task 端段） |
| `persona-normal.md` | 20→≈25 / **27** |
| `persona-explore.md` | 28→≈19 / **15** |
| `persona-coder.md` | 47→≈27 / **21** |
| `persona-plan.md` | 29→≈27 / **26** |
| `persona-eng-coder.md` | 50→≈52 / **50**（+2 处补丁、净 +1 行） |
| `discipline-engineering.md` | 234→≈219 / **221**（R14 端段保留） |
| `discipline-normal.md` | 230→≈172 / **168** |
| CN `common.md` | 120→≈121 / **120**（+R-2 行） |
| CN `persona-engineering.md` / `persona-normal.md` | 54 / 23 → **53 / 22**（仅标题注剥除） |
| CN `persona-explore.md` / `persona-coder.md` | 15 / 18 → **15 / 18**（+R-1 各 +1 行、净 +1——原 14 / 17） |
| CN `discipline-engineering.md` | 161→≈147 / **149** |
| CN `discipline-normal.md` | 248→≈192 / **182** |
| `test/prompts-async-guidance.test.mjs` | 450→≈451 / **451**（3 处用例重定向/更新，例数守恒） |
| `test/prompts-mirror-anchors.test.mjs` | 231→≈280 / **280**（+面 ⑦，11→12 例） |

> 行数 as-of 源档交付日（2026-09-11）；后续批次已在其上叠加（as-built 现值以 `test/files.mjs` 与各档现文为准）。

> **§5 追加正文（收尾轮补承载 · 2026-09-12）**：来源 = 对端源档 `2026-09-11-COMMON-LAYER（CLI 仓）`「VSC 面」§5 追加正文——**逐字搬运、零改写**（D10）；源档 blob SHA（as-of 本迁入轮）= `b3bcc1ed5d34`；行区间 = `:291`–`:347`（本迁入轮实测，以本值为准；对端记录所载 = `:289`–`:346`）。

**改动清单（逐文件）**：

- EN `common.md`：诚实原则节后追加 §2.2 全段（6 节 = 7 个 `##` 块）——与 CLI 落定文逐字同文；4 节 → 10 节（11 块）。
- EN `persona-engineering.md`：推进档位节后、「与 eng-coder 的分工界面」前插 C8 段（角色版 7 行）。
- EN `persona-normal.md`：文件尾追加 C8 段（角色版——`mode = mode toggle` + caches/in-flight 句）。
- EN `persona-explore.md`：删「权限边界（只读/不碰用户）」整节；报告义务瘦身为 2 条（无命中显式报告 / 报告结构化+交付表按 common）；保留彻底度档位；身份节尾 +R-1 行。
- EN `persona-coder.md`：旧 1-3 号条 → 中立瘦身条 + common 指针句；交付表块与五条清单 → 报告义务两行；工具权限注保留；身份节尾 +R-1 行。
- EN `persona-plan.md`：删调用方两行（`All user messages…` + `Treat the parent as your caller.`）——「不问用户」句自持。
- EN `persona-eng-coder.md`：①「绝不请求确认」行尾补「（此条覆写 common 确认门）」；②自含交付协议补「交付表按 common.md 统一格式；审计/评审轮次与终态写进报告（角色补充）。」——Guidelines 端段零碰。
- EN `discipline-engineering.md`：删「## 工具观条款」整节（Search Tool Priority + Codebase exploration order）；R14 端段保留。
- EN `discipline-normal.md`：删路由块（bullets + 全表 + 搜索优先级）+ 探索顺序 bullet + C8 副本（reminders/env 段 + MCP 行）；并行细则、委派、会诊、飞刀、收尾验收节保留。
- CN `common.md`：搜索工具优先级补 R-2 镜像路径 bullet（位 3——逐字取 §2.3 C CN 形态）。
- CN `persona-engineering.md` / `persona-normal.md`：标题「——评审 #C8 落位」剥除。
- CN `persona-explore.md` / `persona-coder.md`：+R-1 行（与 EN 同义）。
- CN `discipline-engineering.md`：删工具观条款节（搜索优先级 + 探索顺序）；VSC 端特有段（R14）保留。
- CN `discipline-normal.md`：删路由块 + 探索顺序节 + C8 副本（reminders/env 段、MCP 行）；评审纪律指针块与并行细则保留。
- 测试：`async` 3 处（搜索条款宿主迁 common + 3 字面 + de/dn 负断言；`#9` 清单清零 = `[]`；R6 用例重定向）；`mirror` +面 ⑦（common 11 标题组 + 关键句组 zh↔zh / en↔en 跨仓逐字）+ 头部「断言七面」。

**偏差与设计缺口处置（如实披露）**：

1. **R6 用例重定向**（设计 §3.3 未列——被删 dn 路由块含其断言锚）：断言迁 common subagent 族行 + dn 飞刀段 escalate 异步句 + dn 旧块零残留；例数守恒。与 CLI 面同款改法。
2. **VSC dn 融合行拆行**（3 处物理行融合：编辑纪律+路由导语 / 表末行+搜索优先级导语 / 搜索 bullet+评审纪律导语）：按内容边界拆分——保留编辑纪律本体与「Review discipline (…)」导语；CN 侧为逐行体、无此融合。
3. **de 删「工具观条款」后 EN `### VSC 端特有段：R14 池规则` 成孤悬三级标题**（端段零触碰原则下未改标题层级；CN 侧同段为 `##`）——如实登记，父侧如另有裁定可一行改。
4. **EN R-2 行前缀**（同 CLI 面披露）：设计两处字面形态不一（§2.2 无 `- ` 前缀 / §2.3 C 有 `- `）——EN 按 §2.2 草案形态（marker 剥除）、CN 按 R-2 逐字（含 `- `）。内容等价，仅列前缀差异。
5. **测试注释未写批次号**：父侧口径「第 17 批」与设计/CLI 侧「第 15 批」不一致——取中性「公共层扩容」，规避口径冲突（可机检注释里无日期/批次号/评审号）。
6. **T75 协调结果**：VSC 仓 `test/doc-consistency.test.mjs` 实测**无 T75 守恒锁**（本面零碰该档、零涉跨批锁值）；本面例数变化 = `mirror-anchors` 11→12（`async` 例数不动）。

**运行证据（命令 + 结果）**：

- `node --test test/prompts-async-guidance.test.mjs test/prompts-mirror-anchors.test.mjs` → **54/54 pass · 0 fail**。
- `node test/run-fast.mjs` → 415 例 · 414 pass · **0 fail** · 1 skipped（先落盘再查——临时目录日志）。
- `node scripts/check-doc-width.mjs` → 扫描域 67 文件无 >300 行；一致性 V1/V2/V3 **新增违规 0**（存量基线 34）。
- 本批改动面 diffstat（18 档）：**+176 / −216**；新增行零 `【R-2】` / 零「评审 #C8」残留（全仓 grep 核）。

**内部 explore 偏差审计：1 轮 → 四类偏差 0**（PARTIAL 0 · SILENT-SIMPLIFICATION 0 · DOC-DRIFT 0 · OUT-OF-LIST 0）+ 3 条观测：
① VSC EN dn 相对 CN 镜像缺「文档先行 / 查重与意图」独立节——经 diff 自核 = **存量端差**（非本批引入；EN 以 Workflow bullets 内联承载）；
② 需求档 §2.5「落地现状」行与 `VSC-PROMPTS.md` = 父侧收口待办（非本面写域，如实登记）；
③ 披露项复核一致（R6 重定向 / dn 拆行 / de 孤悬标题均与现场一致）。

**内部 advisor 代码评审：轮次 1 → pass（🔴 0 · 🟡 2 · 🔵 2）**；裁决 4/4 收敛：
**#1 Deferred**（批次 §4 计数「VSC 17 项（9 + 7 + 1测试）」应为 18——**父侧写域**，报告披露、收口时一行更正）·
**#2 Not an issue**（测试档 451 行：项目档位口径 = 测试档 ≤500 硬限内、无拆分触发——设计档 §4 档位注；本批净 +≈1 行不改档位）·
**#3 Not an issue**（`persona-coder.md:9` 单行 384 字符：与 CLI 逐字同文；设计 ≤300 口径的核算域 = §2.2 新增 common 文本，本行非该域）·
**#4 Deferred**（pe/de Multi-Task 段重复 = 存量端差、设计 §2.1 #3 端段冻结——留后续提示词卫生批）。
**终态 = `clean`**（无 must-fix 项；零修正轮）。

**提示词改动需 reload 会话后生效**——静态断言绿 ≠ 已生效，不得据断言绿声称已生效（父侧收口后建议真机核验一次装配注入文本 = common 10 节 / 11 块）。

**交付三值表（本报告范围 = VSC 面）**：

| # | Status | Requirement |
|---|--------|-------------|
| 1 | ✅ Done | 提示词落面：VSC 16 档（9 EN + 7 CN——批次 §2「要做」1 的 VSC 半面） |
| 2 | ✅ Done | 测试面：2 档（async 3 处重定向 + mirror 面 ⑦；54/54 绿） |
| 3 | ✅ Done | 交付报告含 reload 声明（同条 3——见上；⚠️/❌ 零行：本面零简化、零未做） |

**未 commit**（父侧收口）；CLI 面 = 另一 eng-coder（本面 dependsOn 已满足——CLI 已落定），不在本报告范围。
