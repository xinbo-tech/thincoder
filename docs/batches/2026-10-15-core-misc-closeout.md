# 2026-10-15 · core-misc-closeout
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-15 · 来源 = 用户 2026-10-15 22:45「都并并批，能开的都开起来」+ 台账合并扫描（#1472 ∥ #1476 ∥ #1477 ∥ #1478 ∥ #1481——core 面小件）。
> 台账 = #1472（core · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-25
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**轮次开账（2026-10-15 22:4x · 主 agent）**：触发 = 用户 22:45「都并并批，能开的都开起来」。**并入（5）**：#1472 跨端残差（词面/整形）∥ #1476 MODEL-SPECS tokenhub 一次性产物依赖 ∥ #1477 `model-specs.mjs` 行注悬空 ∥ #1478 manifest 声明失配 ∥ #1481 `config.mjs` 注释行号。**不并**：server/desktop 面 = 各自批；条件未到族维持。**先核义务**：#1476/#1477/#1478 原条件句先核（已满足⇒直落；未满足⇒写明触发）。授权 = 22:45 令；设计轮点火。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-10-15（五条定形；先核三毕（#1476/#1477/#1478 条件满足 ⇒ 直落）；零实施）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

**落盘（2026-10-15 · eng-designer · 设计轮）**：五条逐条 = 先核 ∥ 修法 ∥ 落点 ∥ 面 ∥ 验收。本文 = 定形设计；**零实施**（代码与文档改动随 §4 批准后走链落地）；全部坐标 = 本席实读。

### 一、本批条目（覆盖 5）与先核结果

| # | 条目 | 先核（条件句） | 处置 |
|---|---|---|---|
| #1472 | 跨端残差：终态注记词面/整形（CLI `stopped` ∥ 核 `cancelled`；+ 整形差） | 条件 = 「须设计定形后改码」——本 §2 即定形 ⇒ 达成 | 直落（定形 + 产品码收正） |
| #1476 | tokenhub 预置「名 = 批次档标题名」（批档可删 ⇒ 值失效） | **已满足**：源批档不在盘（`docs/batches` 名含 `okenhub` 实读 0 命中）＋用户 2026-10-15 裁定批档可整体清理；该字面全仓仅规范档 1 处（`MODEL-SPECS.md:453`），余 3 处同在批档记录面 | 直落 |
| #1477 | `model-specs.mjs:37/:66` 行注引 `MODEL-SPECS.md §13.4`（节已删） | **已满足**：该档 `13\.4` 零命中；标题层 §13.3 ⇒ §13.5 断号（空号保留 = 清账已裁） | 直落 |
| #1478 | manifest `checkConfig.lineCounts` 声明失配（「迁自」括注已去） | **已满足**：实跑 `checkLineCounts`（显式 root）= 「声明节未命中」**9** 条（8 条「迁自」族 + 1 条 `webui/SANDBOX.md` 同机制） | 直落 |
| #1481 | `config.mjs:70` 注释内嵌 `setup.mjs:281` 行号（会漂） | 归批项（无条件句） | 直落 |

### 二、#1472 设计（两裁定形 + 收正）

**现状实读（两端终结面现行实现）**：
- CLI：`thincoder-cli/src/tui/render-segments.mjs:100-109`（冻结头 = 图标三态 + 动词三词 `:101` **自铸字面**`"stopped"/"error"/"done"`；注记分面 `:103-109`：error 面 `:107` **原串**、stopped 面 `:108` 零注记、done 面 `:109` 经 `noteSuffix` `:72-76` = 空白折叠 + 140）；`thincoder-cli/src/tui/agent-turn.mjs:221` 停止行 `"[stopped]"` 自铸字面。
- 核件（`thincoder-render-core/subblocks/activity-view.mjs`；VSC = 再导出 shim〔`thincoder-vscode/webview/activity-view.js:1-2`「零逻辑」〕⇒ 单实现、双端）：`:69` cancelled ⇒ 可见词 = `W.stopped()` = `t("sub.stopped")`；`:88-91` 注记整形 = 空白折叠 + 140（error ∥ done 两类注记同过此径）。
- 读面单源（在册）：`docs/core/design/SESSION.md` §6.26 `:967`「词面判据三条（读面归一——跨端单源）」（停止面三写词 ⇒ ⏹ + stopped）∥ `:968`「写面词表零动（三端各写各词）」。
- 词单源实读：核字典 `thincoder-core/i18n.mjs` 已含 `sub.stopped`(:57) ∥ `sub.done`(:58) ∥ `sub.error`(:59) ∥ `status.stopped`(:70)；**缺键** = `sub.async` / `sub.sync` / `sub.waiting` / `sub.awaitingApproval`（宿主字典各有定义：desktop `renderer/i18n.mjs:196-199` ∥ VSC `locales/en.json:206-213`）。

**裁①（词面单源）= 核字典键**：可见词出词面 = 核字典键，各端经 `t()` 出词、**零自铸字面**（先例 = `TUI.md` §7.7「句式（词面单源 = 核字典键）」，`:693`）。
- 收正范围 = CLI 两处四词（均已核字典在键）：`render-segments.mjs:101` 三动词 ⇒ `t("sub.stopped")` / `t("sub.error")` / `t("sub.done")`（沿核件 `W.*` 形式）；`agent-turn.mjs:221` `"[stopped]"` ⇒ `t("status.stopped")`（该档补 `import { t }`）。en 缺省下逐字零变（键值实读 = `stopped` / `error` / `done` / `[stopped]`）。
- 机读词面**零改**（两套并存 = 设计态）：turn 结果 `ok/stopped/error`（`agent-turn.mjs:56-61`）· 子代理事件名 `⟦ev⟧stopped` ∥ `⟦ev⟧cancelled`（`subagent-event.mjs:49-51`——两事件各载语义：running 冻结 ∥ queued 出队）· 记录 `status` 各端自词（§6.26 `:968` 在册）——**不属可见词面差**。
- 缺键面（async/sync/waiting/awaitingApproval）：**本批零触**（补键 = 新语义）——登记（见十·发现②）。

**裁②（整形口径）= §6.26 补句（跨端单源）**：注记 = 空白折叠（`\s+` ⇒ 单空格）+ trim + 140 上限（超限 = 前 139 字符 + `…`）；折叠后为空 ⇒ 零注记；适用 error 面与 done（非错终结）面；停止面恒零注记（原因词与 verb 重复——relay 不传）。核件标尺 = `activity-view.mjs:88-91`（现行式实读）。
- 收正 = CLI error 面（`:107`）改过 `noteSuffix`（现值 = 原串——「零折叠零截断」随之收正）；done 面（已同式）∥ stopped 面（已零注记）不动。
- 注释随正：`render-segments.mjs:103-106` 分面句收正为三面同口径、引 §6.26。

**修法四元（#1472）**：修法 = 裁①收正 CLI 两处四词 + 裁②收正 CLI error 面 + §6.26 补两单源句；落点 = `thincoder-cli/src/tui/render-segments.mjs`（`:101` / `:107` / `:103-106` 注释）∥ `thincoder-cli/src/tui/agent-turn.mjs`（`:221` + import）∥ `docs/core/design/SESSION.md` §6.26（补句）；面 = 设计档面（§6.26——eng-designer 笔）∥ 产品码面（CLI 两档——eng-coder 链）；验收 = 批内单测 fixture（error 面多行+超长 ⇒ 单行且逐字 = 折叠式（139 + `…`）；空 error / stopped ⇒ 零注记；done 面照旧；三动词与停止行 = 字典键取值）+ 字面机检（冻结头段零自铸词字面；`:221` 零 `"[stopped]"` 字面；§6.26 两单源句在场）。

**拒绝备选**：全仓统一 stopped/cancelled 一词——与 §6.26 `:968` 在册「写面词表零动」相抵，且不消任何可见差；合并 `⟦ev⟧cancelled`/`⟦ev⟧stopped` 事件名——机读文法面、两事件各载语义，合并 = 协议变更零收益；反向消差（核件 error 面改原串对齐 CLI）——违核件标尺先例、双端受影响，且多行原串破单行头（两端同病）。

### 三、#1476 设计

- **修法** = `MODEL-SPECS.md:453`「名 = 批次档标题名」⇒「**键 = 渠道品牌名**〔Tencent TokenHub〕」——非批档取值形：值源 = 渠道自身品牌名（随渠道在；复核点 = 端点主机 `tokenhub.tencentmaas.com` + `thincoder-core/config-presets.mjs:41` desc「Tencent TokenHub (腾讯混元网关)」），不再指任何文档/批档。连座（同档同族「批次档」字面）：`:525` §9.8 表头「批次档」⇒「AC」（cells 实为 AC 号；兄弟节表头实读 = §10.6「| AC | 判据 | 用例 |」/ §11.6）。
- **落点** = `docs/core/design/MODEL-SPECS.md:453` ∥ `:525`。
- **面** = 设计档面（eng-designer 笔）。
- **验收** = 该档「批次档标题名」字面 = 0；新句在场（键 = 渠道品牌名）；`:525` 表头 = 「AC」（与兄弟节同形）。
- **拒绝备选**：整句删（丢命名规约本体——清账已按「机制本体句」保留在案）；端点主机派生键——preset 键沿品牌名先例（`kimi` ≠ moonshot），不沿主机。连座项父侧可裁剔除（剔除则该行并入发现③另登记）。

### 四、#1477 设计

- **修法** = 删悬空从句「补探登记见 MODEL-SPECS.md §13.4」（2 处），保本体句「视觉面 **未探**（不声明 multimodal——保守）」；无承接节可改指（登记块系清账按「登记不入规范档」整块删——非搬迁）。
- **落点** = `thincoder-core/model-specs.mjs:36-37`（deepseek-v4-pro 行注）∥ `:65-66`（glm-5.3 行注）。
- **面** = 产品码面（eng-coder 链）。
- **验收** = 该档 `13\.4` 与「补探登记」字面 = 0；本体句保留；同档 §16.3 引用**不动**（该节实存 `:1489`）。

### 五、#1478 设计

**修法** = `PROJECT-MANIFEST.json` 9 条 `section` 值 ⇒ 与各档实读标题逐字一致：

| 声明位 | 现值（摘） | 改为（实读标题） |
|---|---|---|
| `:50` UI.md | …（本域族行 · 迁自 …——逐字） | `4.1 本端文件清单与行数预算` |
| `:66` SETTINGS.md | …（设置族行 · 迁自 …——逐字） | `3.1 本端文件清单与行数预算（设置族行）` |
| `:70` CHAT.md | …（本域族行 · 迁自 …） | `3.1 本端文件清单与行数预算（本域族行）` |
| `:74` COMPOSER.md | …（本域族行 · 迁自 …——逐字） | `3.1 本端文件清单与行数预算（本域族行）` |
| `:78` ACTIVITY.md | …（本域族行 · 迁自 …） | `4.1 本端文件清单与行数预算（本域族行）` |
| `:82` RENDERER.md | …（本域族行 · 迁自 …——逐字） | `5.1 本端文件清单与行数预算` |
| `:94` E2E-TESTING.md | …（测试基建族行 · 迁自 …；切片 3 …） | `9.1 本端文件清单与行数预算（测试基建族行）` |
| `:98` WEB-QUICKCHECK.md | …（web 快筛族行 · 迁自 …——逐字） | `9.1 本端文件清单与行数预算（web 快筛族行）` |
| `:166` webui/SANDBOX.md | `3. 文件账（本面文件行 ∥ 键族登记）` | `3. 文件账（本面文件行）` |

（前 8 = #1478 本体「迁自」族；第 9 = 同文件同机制同族、随轮收正——见九·KD-4。）

- **面** = **主 agent 直笔**（PROJECT-MANIFEST = M1 项目状态档，写门唯主 agent——`thincoder-core/agent-tools/spawn-gates.mjs:79-87`（子代理无法把该路径声明为写域）＋ `manifest` 工具唯主 agent）。
- **验收** = 复跑 `checkLineCounts`（`scripts/doc-check-linecounts.mjs` 直调、显式 root——**不经 `doc-check` 入口**）⇒「声明节未命中」= **0**（基线 9）；9 条与各档标题逐字命中。

### 六、#1481 设计

- **修法** = `thincoder-core/config.mjs:70`——`核 \`agent/setup.mjs:281\`` ⇒ `核 \`agent/setup.mjs\`（\`prepareRun\` 项目指令段）`（去行号、改函数锚；`:68` 既有句已无行号 = 先例形）。
- **落点** = `thincoder-core/config.mjs:70`。
- **面** = 产品码面（eng-coder 链）。
- **验收** = 该档 `\.mjs:\d` 形 = 0（基线 = 仅 `:70` 一处）；`:70` 含 `prepareRun`；`setup.mjs:281` 在 `prepareRun` 体内（`:46` 函数、`:281` 实读属其体）。

### 七、受影响文件与测试覆盖（现行 = 实读行数；增量 = 预估）

| 文件 | 现行 | 增量 | 改动 |
|---|---|---|---|
| `docs/core/design/SESSION.md` | 1073 | +2~3 | §6.26 补两单源句 |
| `docs/core/design/MODEL-SPECS.md` | 1862 | ±0 | `:453` 取值形替换 ∥ `:525` 表头 |
| `thincoder-cli/src/tui/render-segments.mjs` | 187 | ±3 | 动词三词 t() ∥ error 面过 `noteSuffix` ∥ 注释随正 |
| `thincoder-cli/src/tui/agent-turn.mjs` | 423 | +1~2 | `:221` 停止行 t()（+import） |
| `thincoder-core/model-specs.mjs` | 370 | ±0 | 删两处悬空从句 |
| `thincoder-core/config.mjs` | 517 | ±0 | `:70` 行号 ⇒ 函数锚（存量超 500 建议线；本批 ±0） |
| `PROJECT-MANIFEST.json` | 195 | ±0 | 9 条 section 值（主 agent 直笔） |

测试 = 批内单测件一份（#1472 fixture：冻结头三面 + 停止行；随批删）；#1478 复跑 = `checkLineCounts` 直调读数；#1476/#1477/#1481 = 字面机检读数。

### 八、验收对照（三方同源链）

本批五条 = 技术待办族（无需求档条目）⇒ 同源链 = 台账 `#1472 / #1476 / #1477 / #1478 / #1481` = 本节条目（一表五条）= 各条「验收」段（逐条一一对应，无表外项）。

### 九、关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-1 | 词面：可见词核字典键单源（收正 CLI 自铸字面）；机读词并存零改 | 可见差须消（判在册）；机读词并存 = §6.26 `:968` 在册设计态，读面归一已闭 |
| KD-2 | 整形：单源入 §6.26；CLI error 面 → 核件标尺形 | 核件标尺先例（#1188 已按此对齐 done 面）；改一端 vs 改双端 |
| KD-3 | #1476 取值形 = 渠道品牌名 | 随渠道在、可复核；拒整句删（丢本体）/端点派生（违品牌名先例） |
| KD-4 | #1478 含第 9 条（webui/SANDBOX） | 同文件同机制同族；留 1 条已知失配 = 明知不完整交付（父侧可剔） |
| KD-5 | #1477 删从句而非改指 | 无承接节；「未探」事实本体句自足 |

### 十、发现与上抛

- **发现①【上抛·待裁】同族死指针**：`docs/core/design/LEDGER.md` 无 §13.4（标题层 §1–§9；§5 = 归档/触发/老化），但 5 处引用「LEDGER.md §13.4」——`thincoder-core/ledger-cmd.mjs:18` ∥ `:31` ∥ `thincoder-core/ledger-db.mjs:61` ∥ `docs/server/design/ledger/LEDGER.md:6` ∥ `:22`（后两处携全路径）⇒ 产品码行注 + 跨档指针悬空（#1477 同族）；建议归批或另登记（父侧裁）。
- **发现②【登记】词面缺键/自铸族**（#1472 同族 · 本批射程外）：核字典缺 `sub.async`/`sub.sync`/`sub.waiting`/`sub.awaitingApproval`（宿主字典各有定义——desktop `renderer/i18n.mjs:196-199` ∥ VSC `locales/en.json:206-213`）；CLI 运行面板（`subagent-panel.mjs:73-106`）词面自铸（含 zh 混排）——本批零触（补键 = 新语义）⇒ 归「词面字典补键轮」。
- **发现③【同批】`MODEL-SPECS.md:525` 表头「批次档」残留**（清账评审已 flag、四组外）——已作 #1476 连座纳入（父侧可剔）。
- **发现④【知悉】#1478 收正后 9 节进入实比对**——既存行漂将现形（基线实读 diffCount 71；报告态非闸；系存量漂移，非本批缺陷）。

### 十一、修正轮收正（§3 轮次 1 八条逐号 · 2026-10-15 · eng-designer）

**修正轮收正**：§3 轮次 1 八条发现（🟡6 ∥ 🔵2）逐号落盘（①–⑧）；本块诸项 = 修正后定形；零实施不变量维持。

**①（审#1 · import 补行）**：两档落点均写明 `import { t } from "@thincoder/core/i18n.mjs"`（`render-segments.mjs` 现档零 i18n import——`:8-13` 实读；同形先例 = `thincoder-cli/src/tui/status-line.mjs:14`）。
- 落点定形 = `thincoder-cli/src/tui/render-segments.mjs`（`:101` / `:107` / `:103-106` 注释）+ 该 import ∥ `thincoder-cli/src/tui/agent-turn.mjs`（`:221`）+ 该 import。
- 受影响文件表定形两行（其余行照旧）：`thincoder-cli/src/tui/render-segments.mjs` ∥ 现行 187 ∥ 增量 **+2~4（含 import +1）** ∥ import 补行 ∥ 动词三词 `t()` ∥ error 面过 `noteSuffix` ∥ 注释随正；`thincoder-cli/src/tui/agent-turn.mjs` ∥ 现行 423 ∥ 增量 **+1~2（含 import +1）** ∥ import 补行 ∥ `:221` 停止行 `t()`。

**②（审#2 · 批内 fixture 点名）**：批内单测件 = `docs/batches/2026-10-15-core-misc-closeout.test.mjs`——**0 → ~120**（预估；随批档归档 · 不进 `test/` 套件；先例 = `docs/batches/2026-10-15-inject-project-rules-switch.test.mjs`「批内单元测试件 · 随批档归档 · 不进 test/ 套件」）。受影响文件表补行：该档 ∥ 0 ∥ +~120 ∥ #1472 fixture（冻结头三面 + 停止行 + 字面机检）。

**③（审#3 · 两越档点拆分计划）**：
- `thincoder-core/config.mjs`（517 > 500 主动拆分线）：拆点候选 = MCP 段族外提（`reloadMcpFromDisk` `:437-478` ∥ `readMcpSection` `:480-492` ∥ `diffMcpServers` `:494-506` ∥ `mcpFingerprint` `:508-516`——约 80 行 ⇒ 新档 `config-mcp.mjs`）∥ 次候选 = 清洗族外提（`:186-250` 六函数 + `sanitizeProviderHeaders` `:292-304`——约 78 行 ⇒ `config-sanitize.mjs`）；触发条件 = 该档下次结构级改动 ∥ 越 800 硬限（硬限无豁免通道）——本批 = `:70` 注释行收正（非结构级——不触发）。
- `thincoder-cli/src/tui/agent-turn.mjs` 之 `runAgentTurnBody`（`:107-422` = 316 行 > 300 函数档）：拆点候选 = 错误决策族外提（catch 五支 = resume ∥ stop ∥ cap-stop ∥ ask ∥ error——`:196-292` ≈97 行 ⇒ 同档私有 `handleTurnFailure(ctx, error, opts)`）⇒ 316 − 97 ≈ 219 ≤ 300；触发条件 = 该函数下次结构级改动 ∥ 该档越 500 行——本批 = `:221` 一行替换（非结构级——不触发）。

**④（审#4 · §6.26 两单源句定形 + 射程声明）**：落点 = `docs/core/design/SESSION.md` §6.26 `词面判据三条` 块（`:967-968`）后追加两条 bullet（句一 ∥ 句二），逐字：
- 句一 = 「**可见终结词面单源（跨端——射程 = 本枚举词）**：子代理冻结头动词（`stopped` ∥ `error` ∥ `done`）∥ 回合停止行（`[stopped]`）= 核字典键（`sub.stopped` ∥ `sub.error` ∥ `sub.done` ∥ `status.stopped`），各端经 `t()` 出词——零自铸字面。」
- 句二 = 「**注记整形单源（跨端同式）**：注记 = 原始文本经空白折叠（`\s+` ⇒ 单空格）+ trim + 140 上限（超限 = 前 139 字符 + `…`）；折叠后为空 ⇒ 零注记；适用错误面与 done（非错终结）面；**停止面恒零注记**（live 事件径不变量 = `⟦ev⟧stopped` 不传 `note`——`thincoder-render-core/subblocks/relay.mjs:131-133`；CLI 渲染侧同效硬零——`thincoder-cli/src/tui/render-segments.mjs:108`）。」
- 射程声明（评审点面逐处判）：**收正** = 终结面四词（`render-segments.mjs:101` 三动词 ∥ `agent-turn.mjs:221` 停止行；键值 en 逐字同现值——零可见变）；**保留 + 登记** = ① `render-segments.mjs:26-27` tool 块状态词（核键在册——`tool.running` / `tool.done`——值形差：en「running…」≠ 现值「running」；成对收正须先裁值形 ⇒ 词面字典族后续轮）② `render-segments.mjs:162/:165` advisor 标签（无核键——补键 = 新语义 ⇒ 词面字典族后续轮）③ 缺键族（`render-segments.mjs:92` 模式词 `waiting`/`async`/`sync` + 运行面板族 + 四缺键 `sub.async`/`sub.sync`/`sub.waiting`/`sub.awaitingApproval`——在案（十·发现②）⇒ 同轮）。
- 验收机判随正（#1472）：§6.26 两句逐字在场（= 上列句一 ∥ 句二——grep 关键子句可判）；其余验收面（fixture 用例 ∥ 字面机检）不变。

**⑤（审#5 · 句二携锚）**：锚已逐字入句二——`thincoder-render-core/subblocks/relay.mjs:131-133`（`⟦ev⟧stopped` 不传 `note` 不变量）+ CLI 侧硬零 `thincoder-cli/src/tui/render-segments.mjs:108`；无第二落点。

**⑥（审#6 · 最近先例行——实现坐标 ∥ 设计档节 ∥ 先例批；对齐 ∥ 偏离）**：
- #1472①：实现坐标 = `thincoder-cli/src/tui/status-line.mjs:14`（核键直取）∥ 设计档节 = `docs/cli/design/TUI.md` §7.7（`:693`「句式（词面单源 = 核字典键）」）∥ 先例批 = 停滞轻显形批（2026-09-29）；对齐 = 同法则（可见词 = 核字典键 ∥ `t()` 出词 ∥ 零自铸）；偏离 = 无。
- #1472②：实现坐标 = `thincoder-render-core/subblocks/activity-view.mjs:88-91`（核件标尺；在盘形 = `render-segments.mjs:70-76`）∥ 设计档节 = `SESSION.md` §6.26（本批补句）∥ 先例批 = #1188（done 面同标尺对齐）；对齐 = 同标尺同式；偏离 = error 面由「原串」收正为同标尺（理由 = KD-2：核件 error 面亦过同整形 ∥ 原串多行破单行头）。
- #1476：实现坐标 = `thincoder-core/config-presets.mjs` 全表键形（品牌名——`:37` `volcengine`、`:38` `hunyuan`、`:41` `tokenhub`；注形先例 = `:31` server 预设批 · 台账 #1128）∥ 设计档节 = `MODEL-SPECS.md` §9.6 `:453` ∥ 先例批 = 渠道行集批（§9）；对齐 = 键沿渠道品牌名；偏离 = 无。
- #1477：无直系批先例（显式声明）；修法依死指针族规则——`docs/core/design/DOC-DISCIPLINE.md:198-202` 节外指称①（指针句 ⇒ 删指针；有承接节则改指——本处无承接节 ⇒ 删从句）；该族登记 = `docs/core/design/ANCHOR-DEBT-REPAIR.md:371`（「代码注释死指针——另轮 / 已登记」——本条 = 其落地之一）。
- #1478：无先例（显式声明——该机检面（`checkConfig.lineCounts` 声明节）首次按实读标题整族收正；对齐基准 = 各档实读标题逐字）。
- #1481：实现坐标 = `thincoder-core/config.mjs:68`（同档无行号句）∥ 设计档节 = 无（同档句形先例）∥ 先例批 = 无直系；对齐 = 去行号 + 函数锚；偏离 = 无。

**⑦（审#7 · 调研证据行——所查来源 ∥ 结论）**：① 本仓在档机制先例——`docs/cli/design/TUI.md` §7.7 ∥ `docs/core/design/SESSION.md` §6.26 ∥ `docs/core/design/MODEL-SPECS.md` §9.6 / §14.9 ∥ 核件 `thincoder-render-core/subblocks/{activity-view,relay}.mjs` ∥ 核字典 `thincoder-core/i18n.mjs` ∥ `docs/core/design/DOC-DISCIPLINE.md` ∥ `docs/core/design/ANCHOR-DEBT-REPAIR.md`——**相关**（坐标 ∥ 对齐 / 偏离见⑥）；② 工作区并级仓文档树——`thinworker/docs/**`（数字员工 / 知识库 / 日程题材）∥ `thincoder.com/docs/**`（站点批档 5 档）∥ `thincoder-issues`（脚本仓、零 .md）——题材面与本批（core 杂项收口）**无相关**；③ 声明源清单 = 本仓 `PROJECT-MANIFEST.json:189` `index.publicRepos` = `[]`——**无外部声明源可查**（`D:\ref\` 参照系 = 工作区外、不入索引——不在声明源内）。

**⑧（审#8 · `MODEL-SPECS.md:1251` 字面判决）**：实读 = §14.9（`:1249` 起）边界句「不做 #5 / #13（排除面）；不动六态机制与批档机制。」——「批档机制」= **机制名**（= 批次档机制；机制本体在册 = `docs/core/design/BATCH-RECORD.md`；同句「六态机制」= 台账六态、`docs/core/design/LEDGER.md` §3 在册）——非 #1476 族「依赖取值形」（机制不随单档消长——无失效面）⇒ **登记（零动作）**；#1476 收正射程维持 `:453` ∥ `:525` 两点（不含本处）。

**修正块自查补正（同轮自查 · 2026-10-15）**：两处计数收正（结论均不变）：① ⑦ 行站点批档「5 档」→「**6 档**」（重数实读：`2026-10-02` 一 ∥ `2026-10-03` 二 ∥ `2026-10-04` 三）；② ③ 行次候选「六函数」→「**五函数**」（`sanitizeConsultModels` ∥ `warnConsultModelsFiltered` ∥ `sanitizeSubagentModel` ∥ `sanitizeSubagentModels` ∥ `warnSubagentModelsFiltered`——`:193-250` 实读逐数；「约 78 行」估算不变）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审轮（设计评审 · 对象 = 本批 §2「设计完成、零实施」· 待评审；评审范围 = 本批档 ∥ MODEL-SPECS.md ∥ SESSION.md）**

核实读数（逐处实读命中）：`MODEL-SPECS.md:453`「名 = 批次档标题名」∧`:525` 表头「批次档」∧`13.4` 零命中 ∧ §16.3 实存 `:1489` ∧ §10.6 表头 `:660`；`model-specs.mjs:36-37/:65-66`（两处悬空从句）；`config.mjs:70`（该档 `.mjs:<数字>` 唯一位；`:68` 无行号先例）；`setup.mjs:46 prepareRun` ∧ `:281` 属其体；`render-segments.mjs:100-109`（三词 `:101`、error 面原串 `:107`、`noteSuffix :72-76`）；`agent-turn.mjs:221`；`i18n.mjs:57-59/:70`（四键在册；`sub.async/sync/waiting/awaitingApproval` 确缺；`t()` 缺省 en、缺键回退 key）；`activity-view.mjs:69/:88-91`；`SESSION.md §6.26 :967-968`；`TUI.md:693`；`spawn-gates.mjs:79-87`；`config-presets.mjs:41`；`docs/batches` 名含 `okenhub` = 0 命中；受影响文件行数七档 = 1073/1862/187/423/370/517/195 全准。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 清晰性·落点 | 🟡 | #1472 `t()` 收正两档均需补 import；设计只对 `agent-turn.mjs` 注明「（该档补 `import { t }`）」（本批档 `:36`），`render-segments.mjs` 的落点（`:44`）与表行（`:97`）未含 import——该档现无任何 i18n import（`render-segments.mjs:8-13`） | 两档落点均写明 `import { t } from "@thincoder/core/i18n.mjs"` 并计入增量 |
| 2 | 文件标注（判据 8） | 🟡 | #1472 批内 fixture 未点名、未入受影响文件表（本批档 `:103`「批内单测件一份（…；随批删）」）；test 档缺「现行数 + 增量」注记 | 按同日先例点名 `docs/batches/<批档名>.test.mjs`（先例 = `2026-10-15-inject-project-rules-switch.test.mjs`「批内单元测试件 · 随批档归档 · 不进 `test/` 套件」）并标 `0 → ~N` |
| 3 | 文件标注（判据 8·档位） | 🟡 | 两个越档点未带拆分计划：`config.mjs` 517（>500 档；本批档 `:100` 仅注「存量超 500 建议线；本批 ±0」）；`agent-turn.mjs` 内 `runAgentTurnBody`（`:107`–`:422` = 316 行单函数——函数档越线；本批档 `:98` 未提） | 各给拆分计划（拆点/落点）或明确的延后复核触发条件 |
| 4 | 验收·清晰性 | 🟡 | §6.26「两单源句」只给要点、未定形（本批档 `:44`）⇒ 验收「§6.26 两单源句在场」不可机判；且「可见词…零自铸字面」（`:35`）若按全称句落地将与在盘自铸面相抵——发现②（`:122`）之外另有 `render-segments.mjs:26-27`（tool 块状态词 `"running"/"done"`）与 `:162/:165`（advisor 标签） | 定形两句逐字文本（或关键子句）+ 明示「词面单源」射程/登记指针，使验收可机判 |
| 5 | 证据锚（注） | 🔵 | 「停止面恒零注记（…relay 不传）」（本批档 `:40`）的不变量现只住核件注释（`relay.mjs:131-133`）；核件消费谓词 `activity-view.mjs:74` 本身对 `cancelled` 非硬清零 | §6.26 补句携带 `relay.mjs:131-133` 或等价不变量句作锚 |
| 6 | 方法学（判据 9·先例） | 🟡 | 无「最近先例」行；先例坐标散见（`:35` TUI.md §7.7 `:693`、`:46` #1188、`:86` config.mjs:68、`:54` preset 键品牌名先例），未按「实现坐标 ∥ 设计档节 ∥ 先例批次 + 对齐/偏离理由」收拢；无先例项（如 #1478）未显式声明 | 补「最近先例」行（含无先例/有意偏离的显式声明） |
| 7 | 方法学（判据 10·调研） | 🟡 | 无「调研证据」行（核过哪些公开源档 ∥ 有无相关；「均不相关」亦须记录） | 补「调研证据」行 |
| 8 | 文档卫生（注） | 🔵 | `MODEL-SPECS.md:1251`「不动六态机制与批档机制」携同族字面「批档机制」；#1476 先核枚举（`:22`「余 3 处同在批档记录面」）与连座（`:50` 之 `:525`）未含此位 | 确认该字面语义（机制名 / 依赖残句）后连带处置或登记 |

**计数**：🔴 0 · 🟡 6 · 🔵 2

**VERDICT: pass**

## §4 用户批准（主 agent）

**用户批准**：2026-10-15 23:54「**批**」（11 批队列放行——本批实施轮 eng-coder#53 在其列）。
**面判（父侧 2026-10-16 00:10 裁）**：本批**只落产品码面**。`docs/core/design/SESSION.md §6.26` 补句 ∥ `docs/core/design/MODEL-SPECS.md:453/:525` = 设计档面（eng-designer 笔，父侧另派）；`PROJECT-MANIFEST.json` 9 条 = 主 agent 直笔（写门禁子代理）——**本席零触、不回改**。
**评审记录**：§3 设计评审 = 通过；实施侧 advisor code 评审 = **pass**（🔴 0 ∥ 3 🟡 只读 ∥ 1 🔵）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（产品码面四改一建落齐；审计 CLEAN · 评审 pass（0🔴）；另三面（§6.26 ∥ MODEL-SPECS ∥ manifest）按面列非本席，零触）



**落盘（2026-10-16 · eng-coder · 实施轮 · initial）**

**交付摘要（只落 §2「产品码面」）——四改一建**

- **#1472 裁①（可见终结词面单源）**：`thincoder-cli/src/tui/render-segments.mjs` —— +`import { t } from "@thincoder/core/i18n.mjs"`（`:14`）；冻结头三动词自铸字面 `"stopped" / "error" / "done"` ⇒ `t("sub.stopped") / t("sub.error") / t("sub.done")`（`:102`）。`thincoder-cli/src/tui/agent-turn.mjs` —— +同键 import（`:19`）；停止行 `pushLine("[stopped]", C.warn)` ⇒ `pushLine(t("status.stopped"), C.warn)`（`:222`）。en 缺省下逐字零变（键值实读 = `i18n.mjs:57` stopped ∥ `:58` done ∥ `:59` error ∥ `:70` `[stopped]`）。
- **#1472 裁②（注记整形单源）**：`render-segments.mjs:108-110` —— error 面 `sub.lastError ? ` — ${sub.lastError}` : ""` ⇒ `noteSuffix(sub.lastError)`（随改前「原串·零折叠零截断」收正）；done 面早已同式（不动）；stopped 面恒零注记（不动）。注释 `:104-107` 收正为三面同口径 + 引 §6.26。核件标尺 = `thincoder-render-core/subblocks/activity-view.mjs:88-91`。
- **#1477（悬空从句）**：`thincoder-core/model-specs.mjs:36-37` ∥ `:66` —— 删「补探登记见 MODEL-SPECS.md §13.4」（2 处）；本体句「视觉面 **未探**（不声明 multimodal——保守）」保留；同档 §16.3 引用未动。
- **#1481（行号锚）**：`thincoder-core/config.mjs:70` —— `核 `agent/setup.mjs:281`` ⇒ `核 `agent/setup.mjs`（`prepareRun` 项目指令段）`。
- **批内单测件（新建）**：`docs/batches/2026-10-15-core-misc-closeout.test.mjs`（T1–T5 六例；随批档删 · 不进 `test/` 套件；先例 = 同日 inject-project-rules-switch 批）。

**非本面·未落（§2「面」列明标他笔 + 父侧 2026-10-16 回告确认）**：`SESSION.md §6.26` 补两句（设计档面·eng-designer 笔——父侧另派设计席）∥ `MODEL-SPECS.md:453/:525`（#1476，设计档面·eng-designer 笔）∥ `PROJECT-MANIFEST.json` 9 条 section 值（#1478，主 agent 直笔——写门禁子代理 `spawn-gates.mjs:79-87`，父侧已挂账 #1510 族）。**本席三处零改动**。

**决策透明表**

| # | 决策 | 理由 |
|---|---|---|
| D-1 | 只在产品码面落笔；文档面 ∥ manifest 面零触 | §2 各条「面」列明标他笔；D1 写权矩阵（设计档 = eng-designer 独立署名）＋ manifest 写门；父侧 2026-10-16 回告「按面列交付，不跨界」 |
| D-2 | 三动词沿核件 `W.*` 形式走 `t()`，不另造取值 | §2 裁①（词面单源 = 核字典键）；先例 = 核件 `activity-view.mjs:69` `W.stopped()` ∥ CLI `status-line.mjs:14` `import { t }` |
| D-3 | error 面复用同档既有 `noteSuffix`（不另写整形函数） | §2 裁② = 核件标尺 `activity-view.mjs:88-91`；`noteSuffix`（`:73-77`）已在档，复用 = 零新语义 |
| D-4 | 批内单测件名 = `<批档名>.test.mjs`，落 `docs/batches/` | §2 修正块② 点名；同形先例 = `docs/batches/2026-10-15-inject-project-rules-switch.test.mjs` |
| D-5 | 不做「§6.26 两单源句在场」机检项 | 该档非本面（设计档面）；且「非测试文档的散文锚」禁入测试档——该判据归设计档面机检，本席以字数/字面实读代报 |

**审计与代码评审轮次与终态**

| 轮 | 类型 | 范围 | 结论 | fix round |
|---|---|---|---|---|
| 1 | explore 分歧审计（read-only） | 产品码面 5 档 vs §2（含修正块①–⑧） | **CLEAN**（四类偏差 = 0：部分实现 ∥ 静默简化 ∥ 档漂移 ∥ 越表） | 0 |
| 1 | advisor 代码评审（type=code） | 产品码面 5 档 + 本批档 | **pass**（🔴 0 ∥ 🟡 2 ∥ 🔵 2） | 0 |

**评审发现响应表**

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡（协调项 · 非本面 must-fix） | 三处注释引 `SESSION.md §6.26` 单源句，但该节两句现未落 ⇒ #1472 验收项「§6.26 两单源句在场」未达成 + 注释指针悬空 | **父侧已裁**（2026-10-16 回告）：按面列交付、该面另派设计席——本面零改动，报告标「非本面·未落」。**闭合** |
| 2 | 🟡（可选） | `config.mjs` 517 行 > 500 建议线 | 拆分计划在案（§2 修正块③ + 触发条件：下次结构级改动 ∥ 越 800）；本批 ±0、非结构级 ⇒ 零动作（登记） |
| 3 | 🔵 | 批内单测件字面机检负向锁偏窄（只锁两精确形）∥ `head()` 只走折叠分支 | 设计验收要件 = 折叠头 + 停止行 + 字面机检，现状达标；该档随批档即删 ⇒ 不改（避免评审后 churn） |
| 4 | 🔵 | 批内单测件执行结果评审侧未复核（评审只读面） | 本席实跑附读数（下条） |

**验证读数（靶向单跑）**

- `node --test docs/batches/2026-10-15-core-misc-closeout.test.mjs`（workdir = `thincoder/`）⇒ **tests 6 ∥ pass 6 ∥ fail 0**。
- 字面机检实读：`model-specs.mjs` `13\.4` ∥「补探登记」= 0；`config.mjs` `\.mjs:\d` = 0 且 `:70` 含 `prepareRun`；`render-segments.mjs` 冻结头段零自铸动词字面；`agent-turn.mjs` 零 `"[stopped]"` 字面。
- 项目自带套件（`thincoder-cli` ∥ `thincoder-core` `npm test`）= 「test manifest is empty —— zero tests = green」⇒ 无回归面。
- import 冒烟：两档 `import`（`@thincoder/core/i18n.mjs`）解析实测 OK。

**环境知会**：工作树共享脏（多批在飞面未提交）；同文件含他批改动（`config.mjs` 的 `injectProjectRules` 键族 ∥ `model-specs.mjs` 的 gemini thinking 位 ∥ `render-segments.mjs` 的 `noteSuffix` 定义）——均非本席，收口时请按笔分离。

## §6 验证与收口（父代理）

**收口（父侧 · 2026-10-16）**

**① 验证读数（本批验证行）**：父侧抽核 —— `thincoder-core/config.mjs:70` 已去行号、改函数锚（「判点 = 核 `agent/setup.mjs`（`prepareRun` 项目指令段）」）逐字在盘 ✓；批内件 `node --test` = **6 passed / 0 failed**（#53 读数）；字面机检（`model-specs.mjs` `13\.4` ∥「补探登记」= 0；`agent-turn.mjs` 零 `"[stopped]"` 字面）✓；禁调令遵守 ✓。

**② 集成场景影响**：无。

**③ 核销结算**：台账 **#1481**（`config.mjs:70` 注释内嵌行号）→ 已核销；同批本面件 **#1472**（词面/整形单源）∥ **#1477**（`model-specs.mjs:36-37/:66` 死指针从句）→ 随本档 §5 落定，已核销；**#1478**（`PROJECT-MANIFEST.json` 9 条）→ **父侧已直笔收正**（2026-10-16，声明节未命中 9 ⇒ 0），已核销。

**④ 暂缓批复核**：无。

**⑤ 结算同步清单**：角色表 ✓ ∥ 状态行（§5 实施完成 → 本档已收口）✓ ∥ 计数（本面 3 件销 ∥ 非本面 2 件另办）✓ ∥ 指针 ✓ ∥ 待办勾销（`#1476` 留设计席轮；`#1472`/`#1477`/`#1478`/`#1481` 销）✓ ∥ 前批遗留交叉核（无）✓。

**⑥ 范围外知会处置**（#53 报告）：① `config.mjs` 517 行 > 500 建议线（存量；§2 修正块③ 已有拆点计划 + 触发条件）→ 已在册（不动）；② 批内单测件负向锁偏窄（随批删——不追）；③ `SESSION.md §6.26` ∥ `MODEL-SPECS.md:453/:525` → 父侧另派设计席（#1476 在册）；④ 环境知会（工作树多批共享脏、同文件含他批未提交改动）→ 收口提交时按笔分离（父侧）。

**⑦ 结算行**：台账 #1481 ∥ #1472 ∥ #1477 ∥ #1478 → 已核销；#1476 留待设计席轮。

**更正（父侧同轮 · 2026-10-16）**：上文③ 对 **#1472** 的核销表述**仅限其产品码面**（裁① 词面单源 ∥ 裁② 整形单源——已落）；其**设计档面**（`SESSION.md §6.26` 两句补句）非本席面、**未落** ⇒ **#1472 保持未决**，余项随设计席轮（与 #1476 同轮）。已落面证据 = 本档 §5 落点表。
