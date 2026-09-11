# 批次记录（本仓份）— COMMON-LAYER（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `thincoder/docs/batches/2026-09-11-COMMON-LAYER.md` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **18** 条目 = VSC 面域 18 档）；源档 blob SHA = 2519c46a2c4e。
> 源档案内锚：§2「VSC 面」块（`:288`）+ §5 双面交付（id=37）。

## 本仓份（逐字自源档搬运）

### 实施记录（eng-coder 自写 · 2026-09-11——VSC 面）

**面域**：VSC 仓 18 档（9 EN 提示词 + 7 CN 权威源 + 2 测试档）；CLI 仓零触碰；**零源代码改动**（`src/*.mjs` 未碰）；未 commit。

**落笔前置（顺序不跳——两项已执行）**：

1. CLI 面已落定核验：`thincoder/src/prompts/common.md` 10 节在位（11 块）、9 EN + 7 CN + 2 测试档改动齐备——核验通过后才落笔。
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
