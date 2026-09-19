# 批次记录（本仓份）— INPUT-FIXES-SMALL（2026-09-11）

> 搬迁注记：本档 = CLI 仓批次记录 `2026-09-11-INPUT-FIXES-SMALL（CLI 仓）` 的**本仓份拆出承载档**
> （LEDGER-SELF-CONTAINED 批——拆分：两端均有实施面，各仓持其份；文字**逐字搬运、零改写**——D10；对端份留源档）。
> 对端（CLI 仓）源档对端份已**切除**（2026-09-12）——追溯锚 = 源档档首移出清单 + 源档 blob SHA
> 拆分判据 = `LEDGER-SELF-CONTAINED（CLI 仓）§8.3` 表（本仓份 **6** 条目 = §5 交付表 VSC 行）；源档 blob SHA = 4808cdea90ef。
> 源档案内锚：§2 行级「仓」列（`B1 纯 CLI / B2 纯 VSC`）+ §5 交付清单 VSC 行。

## 本仓份（逐字自源档搬运）

### 5.1 交付清单 + 实测行数（口径 `split("\n").length` 含末行）

| 仓 | 文件 | 批前（设计 as-of） | 实测（交付后） | 本批增量 | 变更点 |
|---|---|---|---|---|---|
| VSC | `webview/input.js` | 133 | **146** | +13 | C-B2-1 ×2（:42/:77）+ C-B2-2 让位（:78-84——保留 preventDefault）+ C-B2-3 硬化（:121-124） |
| VSC | `webview/autocomplete.js` | 201 | **189** | −12 | C-B2-1 接受分支守卫（:99）+ showToast 提取改 import（:7；本地私有实现删） |
| VSC | `webview/send.js` | 53 | **57** | +4 | C-B2-4 busy 分支追加 `showToast(t("input.busyPlaceholder"))`（:23） |
| VSC | `webview/toast.js` | — | **23**（新增） | 新增 | showToast 共享模块（原样提取：懒建 `#paste-toast` / `.visible` / 2.6s / 静态 `_t`） |
| VSC | `test/webview-input-enter.test.mjs` | — | **204**（新增） | 新增 | T-B2-1~7 |
| VSC | `test/files.mjs` | 56 | **61** | +1 | 新档登记（:59；余 +4 = 他批在飞条目） |

**增量超设计预估带（3 处，如实披露）**：① `pickers.mjs` 实测 118（CLI 面——见源档）；② `input.js` 实测 +13（预估 +6±3——超 4：C-B2-1/C-B2-2 逐字注释块 + 修正轮次序注 +1）；③ `test/webview-input-enter.test.mjs` 实测 204（预估 130±40——超 34：7 用例 + 自备 DOM 装配 + 逐测复位 helper + 断言密度）。

> 状态（源档 §5）：交付完成——终态 `clean`（2026-09-11）。范围 = §2 两条目全量交付（B1 CLI 3 档 / B2 VSC 6 档）。
> B2 = 本批次 = VSC 6 档；行数 as-of 交付日（现文行数以各档现态为准）。
