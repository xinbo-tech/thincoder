# 2026-09-29 · 桌面 config:read 回执契约收正（向导收尾复读闸判据错位）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-29 · 来源 = 用户 2026-09-29 21:31「这个问题你处理一下吧」（承 #667 答疑：向导收尾 config:read 回执判据错位——复读失效 + 假通知串 + 噪声）；父侧实读三档定位（台账 #667 同账）。
> 台账 = #667（desktop · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-29
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 讨论来源

- 用户 2026-09-29 21:31：「**这个问题你处理一下吧**」（承 #667 答疑）——批点燃；**单开微批**（不并入在飞的 `2026-09-29-desktop-ledger-emit-fix`——防夹带；亦无现成「下一桌面触碰批」可并）。
- 上游 = 今日自测 Round 0 观测（console 一条噪声）→ 21:3x 父侧实读**升格**（契约不一致，非噪声）。

### 1.2 已核根因（父侧实读三档 · 2026-09-29 21:3x）

| # | 档 | 实读 |
|---|---|---|
| 1 | `thincoder-desktop/src/main/ipc.mjs:105-110` | `readConfig()` 成功形 = `{ config, locale, dict, configured }`——**无 `ok` 字段** |
| 2 | `thincoder-desktop/renderer/mount-onboarding.mjs:62-71` | `finishWizard()` 按 `receipt.ok === true` 判——**恒假 ⇒ 失败臂恒走**：`report("panel", receipt, "config:read")`；且 `configured` 恒退回 `store.settings?.configured ?? null`（**`receipt.configured` 永不消费 ⇒ 复读闸空转**） |
| 3 | `thincoder-desktop/renderer/mount-settings.mjs:80-88` | `report()`：`reason` null ⇒ ① `console.error('…failure receipt without reason')`（`:82`）② `wizard.notice = "invalid-shape"`（`:85-87` 假失败串恒写） |

- 附证（非笔误级）：boot 面同通道同判 —— `app.mjs:71` ∕ `:227` 按「三字段齐备」判成否（非 `.ok`）⇒ 消费点单侧误判。
- 用户可见后果：暂未观测（靠旁路 ∕ 后续读收敛）；机制面 = 复读失效 + 假串 + 噪声三件套。

### 1.3 批面（授权口径）

- ① **修**：失败臂只在**真失败**走；「仍未配」= **正常态**。修向候选（设计轮定形）：a) `config:read` 回执补 `ok`（三态归一——须核 boot ∕ 全部消费点兼容）b) `finishWizard` 改按 `configured` 字段存在性判 c) 两处同拍归一；
- ② **同族排查**（限面）：`config:read` 全部消费点 + `mount-onboarding.mjs` ∕ `mount-settings.mjs` 内其余回执判据点（`.ok === true` 形 vs 回执实形）——逐点「现状 + 处置」；超面只报告不扩；
- ③ **回归用例**（批内件，落位沿 #545 现行法）：**修前红可复现**优先（形态设计轮定：VM 抽取 ∕ 逻辑缝 ∕ 行为面）；
- ④ **真机复核**（父侧）：复用 `.thincoder/tmp/desktop-selftest-2026-09-29.mjs` 轮 A 读数——零配置首启 → 完成 → `consoleErrors` **不再含** `config:read: failure receipt without reason` ∧ 无 `invalid-shape` 落串（∧ 可读面核 configured 消费自新回执）。
- **边界**：不并 ∕ 不动 #666 批（在飞）；核件（`thincoder-core`）零改；不改向导业务语义（只修判据 ∕ 契约面）。

### 1.4 判据与验收

- 机检：批内件修前红 → 修后绿（脚本化）；真机：轮 A 读数对照（噪声行消失 + 假串不落）；
- 链：设计 → 评审（用户点）→ 批准（用户签）→ 实施 → 父侧真机复核。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 1 收正在 §2.12）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**轮**：initial（设计轮 · 2026-09-29）· 触面 = `thincoder-desktop/renderer/mount-onboarding.mjs`（码面待实施轮）+ 批内件（已落）+ `docs/desktop/design/IPC.md`（已落）。

### 2.1 条目表（覆盖 ∕ 不覆盖）

**覆盖**（本批条目 = 台账 #667 · 逐条对 §1.3 批面）：

| # | 条目 | 落点（本设计定形） |
|---|---|---|
| B1 | 修：失败臂只在**真失败**走；「仍未配」= **正常态**非失败 | `thincoder-desktop/renderer/mount-onboarding.mjs:62-71`（定形 = §2.2） |
| B2 | 同族排查（限面）：`config:read` 全部消费点 + 两档内其余回执判据点 | §2.3 逐点表（限面闭合 · 超面只报） |
| B3 | 回归用例（批内件 · 修前红可复现） | `thincoder/docs/batches/2026-09-29-desktop-config-read-receipt.test.mjs`（**新建 · 已落 86 行** · §2.5） |
| B4 | 真机复核配方（父侧执行） | §2.6 |
| B5 | 文档随动 | §2.7（`docs/desktop/design/IPC.md` 一笔**已落** ∕ `UI.md` 零改明示） |

**不覆盖（明示）**：`config:read` 回执**形不变**（否候选 a ∕ c）· boot 面 `renderer/app.mjs` 零改 · 主侧 `thincoder-desktop/src/**` 零改 · 核件 `thincoder-core/**` 零改 · 不动 ∕ 不并 #666 批（在飞）· 向导业务语义（收尾退场 ∕ 保存流）零改 · 常驻套件零动（`thincoder-desktop/test/**` 不登记、`files.mjs` 零改）。

### 2.2 修法定形（三候择一 · 含被否理由）

**定形 = 候选 b**：`finishWizard` 改按 `configured` 字段判——成功判据 = `typeof receipt?.configured === "boolean"`（文档字段在场 + 值域布尔）；**两处判据同拍归一**（`:64` ∕ `:67` 取同一 `read` 值）：

```js
const read = typeof receipt?.configured === "boolean" // 成功判据 = 回执携布尔 configured（该通道无 ok 旗标——单源 = IPC.md §2）
const configured = read ? configuredFlag(receipt.configured) : (store.get().settings?.configured ?? null)
if (read) clearReport()
else report("panel", receipt, "config:read") // 两臂互斥照旧（批 9 审计钉——禁「先清后报」）
const next = patchSettings(store.get(), { configured })
store.set(configured === true ? next : dismissWizard(next)) // 退场两路零改
```

（全程只动 `:64` ∕ `:67` 两处判据表达式 + 头注锚 ③ ∕ 行注补判据单源指引；`:62-63` ∕ `:68-71` 零改。）

**依据**（实读证据）：
1. **「无 `ok`」三处同判**：主侧处理体自述回执 = `{ config, locale, dict, configured }` 且失败 = fail-loud 抛出（`thincoder-desktop/src/main/ipc.mjs:100-110`——抛出句 `:104`）；设计单源行（`docs/desktop/design/IPC.md:117`）；boot 消费点 = 三字段判（`thincoder-desktop/renderer/app.mjs:71-78`）。
2. **失败形另一路**：`ask()` 异常归一（桥缺 ∕ 抛 ∕ 拒绝 ∕ 非对象 ⇒ `{ ok:false, reason }`——`thincoder-desktop/renderer/mount-settings.mjs:64-77`）⇒ 成功 ∕ 失败判别器 = 「`configured` 布尔在场」（失败形恒无该键）。
3. **同族先例**：`renderer/session-wire.mjs:44` 对无成功旗标通道按语义形判（`isProject` + `Array.isArray(list?.sessions)`）；`IPC.md` 区 `project:open`「无成功旗标」判例在册（`app.mjs:112-119`）。
4. **批次定性**：§1.2 附证句 = 「**消费点单侧误判**」——修向与批档根因同向（消费面按实形判，非改形迎消费面）。
5. **假绿之戒**：批 9 旧测「收尾复读闸三臂」按消费面假设形造（`docs/batches/2026-09-26-desktop-impl-9.md:981`）⇒ 绿而场红——本批夹具取主侧实形（§2.5）。

**被否理由**：
- 候选 a（回执补 `ok`）＝**否**：① fail-loud 通道的 `ok` 恒为常量真（退化字段——带不出判别信息）；② 须动设计单源行 + 全消费点复读（boot 虽兼容但需重核），收益仅「惯用式统一」；③ **修前红在本件（逻辑缝）形态下不可复现**——消费面按假设形（携 `ok`）造夹具即可绿 ⇒ 落回假绿类，违「修前红可复现」优先序。
- 候选 c（两处同拍归一）＝**否**：实质 = a + 消费面复读的合体，与 a 同因被否；本批「归一」由 b 达成（两处判据同拍 · 判据单源引用 `IPC.md` 设置族注项 6）。

### 2.3 同族排查表（限面 · 逐点现状 + 处置）

**A. `config:read` 全部消费点**（仓内全量检索：消费点 3 处；另 4 处非判据引用 = `ipc.mjs` ∕ `ipc-registry.mjs:29` ∕ `preload.cjs` ∕ `attachments.mjs:38`）：

| # | 消费点 | 现状判据 | vs 实形 | 处置 |
|---|---|---|---|---|
| A1 | `renderer/app.mjs:71-78`（`isValidPayload`）+ `:227-234`（boot） | 三字段齐备（`config` ∕ `locale` ∕ `dict`）；`configured` 经 `configuredFlag` 三态归一（`:234`） | **对齐**（零 `ok` 假定） | 零改 |
| A2 | `renderer/mount-onboarding.mjs:62-71`（`finishWizard`） | `receipt.ok === true`（`:64` ∕ `:67`） | **错位（本批缺陷）** | **修**（候选 b · §2.2） |
| A3 | `renderer/i18n.mjs:362` 区（`initDict(payload)`） | 消费 `{ locale, dict }`——非判据点 | 对齐 | 零改 |

**B. 两档内其余回执判据点**（`mount-onboarding.mjs` ∕ `mount-settings.mjs`）：

| # | 判据点 | 现状 | 处置 |
|---|---|---|---|
| B1 | `mount-onboarding.mjs:37-41`（`pickDir` 缺钩路） | 合成失败形 `{ reason:"invalid-shape" }` 上报——**非回执判据**（无通道回执在场） | 零改 |
| B2 | `mount-onboarding.mjs` 余（`nextStep` ∕ `onDismiss` ∕ `presetValue`） | 零回执消费 | 零改 |
| B3 | `mount-settings.mjs:64-77`（`ask()`） | 异常归一；成功 = 原回执透传（**不合成 `ok`**） | 零改（不合成 `ok:true`——免与候选 a 半路合流）；形锚落文档（§2.7） |
| B4 | `mount-settings.mjs:80-99`（`report` ∕ `clearReport`） | 失败串落位 ∕ 清位（`reason` 直取；无 reason ⇒ 记错 + `invalid-shape`） | 零改（失败臂物理不变） |
| B5 | `mount-settings.mjs` 余（`occupies` ∕ `paintSettings` ∕ `refreshSettings` ∕ 订阅） | 零回执判据 | 零改 |

**C. 超面（只报告不扩 · 无处置请求）**：

| # | 面 | 现状 | 备注 |
|---|---|---|---|
| C1 | `renderer/mount-settings-exits.mjs` 出口族（`:69` ∕ `:89` ∕ `:101` ∕ `:121` ∕ `:135` ∕ `:165` 判 `ok !== true`） | 所通道回执**确携** `ok`（`IPC.md:244-259` 行表）——全对齐 | 零发现 |
| C2 | `renderer/session-wire.mjs`（`:97` ∕ `:150` ∕ `:175` `ok !== true` ∥ `:44` 语义形判） | 与各自通道实形对齐 | 零发现 |
| C3 | 注册 ∕ 白名单面（`src/main/ipc-registry.mjs:29` · `preload.cjs`） | 非判据点 | 零改 |

### 2.4 受影响文件与测试面

| # | 档 | 现状（实读 2026-09-29 · 内容行数） | 变更 |
|---|---|---|---|
| 1 | `thincoder-desktop/renderer/mount-onboarding.mjs` | **88** | 判据两处同拍（b）+ 头注锚 ③ ∕ 行注补判据单源（预期 +3～+5 行；≤300 ✓） |
| 2 | `thincoder/docs/batches/2026-09-29-desktop-config-read-receipt.test.mjs` | **86（已落）** | 新建 · 4 腿（不登记常驻套件） |
| 3 | `thincoder/docs/desktop/design/IPC.md` | 设置族注项 6 ∕ 变更记录在册 | 「回执形注」一行 + 变更记录一行（**本设计轮已落**——现档 `:272` ∕ `:422`，as-of 2026-09-29） |

**零触碰**：`renderer/app.mjs` · `renderer/mount-settings.mjs` · `renderer/store.mjs` · `thincoder-desktop/src/**` · `thincoder-core/**` · `thincoder-desktop/test/**`。
**行数随动**：`docs/desktop/design/PROJECT.md` 值列三处现载 **88**（`:271` 行表 ∕ `:355` 例外续期 ∕ `:1009` U95 臂）——实施后按实读收正（归口 = 实施批 ∕ 修正轮；本设计轮不预写）。

### 2.5 回归件（红→绿 · 修前红实测在案）

- **形态** = 逻辑缝直测：`createWizard(deps)`（注入缝 = `mount-onboarding.mjs:31-33`）直取；件内只 import `renderer/mount-onboarding.mjs` + `renderer/store.mjs`（纯数据面）——零 DOM ∕ 零 electron ∕ 零 `/rc/`。
- **夹具 = 主侧实形**（形源 = `src/main/ipc.mjs:105-110`）：成功两腿 `{ config, locale, dict, configured:true|false }`；失败腿 `{ ok:false, reason }`；畸形腿 `{}`。
- **四腿**：① 成功·已配 ⇒ 零 report ∕ `clearReport`=1 ∕ `configured:true` 落槽 ∕ `dismissed` 不烧；② 成功·仍未配 ⇒ 零 report ∕ 退场旗正常；③ 真失败 ⇒ report 恰一次（panel ∕ `config:read`）∥ clear=0（两臂互斥钉）∥ 保旧值 ∕ 仍退场；④ 畸形形 ⇒ 按失败处置（防过宽成功判据）。③④ = 修前修后皆绿（防过修两向钉）。
- **运行**（自 `thincoder/` 根）：`node --test docs/batches/2026-09-29-desktop-config-read-receipt.test.mjs`
- **修前红（实测 · 本设计轮）**：4 例 ⇒ **腿 1 ∕ 2 红**（失败臂误走——断言实读含 `[["panel",{config,locale,dict,configured:true},"config:read"]]`）· **腿 3 ∕ 4 绿**（读数 `fail 2 / pass 2`）。
- **修后绿判据**：实施轮复跑同命令 ⇒ 4/4 绿（`fail 0`）。
- **零常驻**：不登记 `thincoder-desktop/test/files.mjs`（批内件随批留存——#545 现行法）。

### 2.6 真机复核配方（父侧执行 · 复用轮 A）

- **主判**：`cd thincoder && node .thincoder/tmp/desktop-selftest-2026-09-29.mjs > .thincoder/tmp/desktop-selftest-2026-09-29.log 2>&1` ⇒ 取 `readings.json` `A.consoleErrors`：
  1. **不含** `config:read: failure receipt without reason`；
  2. 与修前读数比对 ⇒ **差集 = 恰删该一行**（零新增 error 行）。
- **附读数（零回归 · 修向不涉回执形）**：`A.boot.boot === "ok"`（脚本内建断言）· 收尾退场（脚本已 `waitForFunction`：settings 容器 `childElementCount === 0`）· `A.afterSettingsClick` 设置面读数照常。
- **注（真支的面级盲区）**：「已配收尾」与「仍未配收尾」两径 DOM 同形（退场判据 `views/onboarding.mjs:34` 两路皆假）⇒ **真支语义的判据面 = 单测腿 1**（状态面：`configured:true` 落槽 ∕ `dismissed` 不烧）；真机只作端到端噪声与退出复核。
- **可选扩展（父侧自决 · 工程具面）**：轮 A 步 1 填键 + 提交（预期 `provider:save` 落盘 ⇒ `isConfigured()` 真）后再走完 ⇒ 断言同主判第 1 ∕ 2 条；不达亦不阻塞（真支已由单测腿 1 钉）。

### 2.7 文档随动（逐处 file:line）

- `docs/desktop/design/IPC.md` **已落**（本设计轮 · 现档 as-of `:272` ∕ `:422`）：设置族注项 6（向导闸）插「**回执形注**」行——`config:read` 回执**无 `ok` 旗标**（读失败 = fail-loud 抛出）· 消费判据 = `configured` 布尔在场（先例 = boot 三字段判）；变更记录一行随落。
- `docs/desktop/design/UI.md`：**零改**——向导面形态（闸 ∕ 三步 ∕ 退场 ∕ 幂等，`:31` 行）逐条未动；收尾判据非形态面。
- `docs/desktop/design/PROJECT.md`：值列三处随动见 §2.4（实施后收正）。

### 2.8 行为变化明示（修后复读闸真支复活）

1. **带已保存 provider 收尾**（配置档在盘 ⇒ `receipt.configured:true`）：首走 `store.set(configuredFlag(receipt.configured))` **真支** ⇒ `configured:true` 落槽 ∥ `dismissed` 旗**不烧**（今日恒走 `dismissWizard`）。**面级用户可见零差**（两路退场 DOM 同形）；差异面 = 状态树真值与台面噪声。
2. **仍未配收尾**：走**成功臂**（不再假报；`clearReport()`）⇒ 仍 `dismissWizard` 退场——业务语义零改。
3. **噪声 ∕ 假串清零**：「`config:read: failure receipt without reason`」与 `wizard.notice="invalid-shape"` 不再落（面级可核 = §2.6 主判）。
4. **失败臂**：真失败（桥缺 ∕ 拒绝 ∕ 非对象）照旧上报 + 保旧值 ∕ 仍退场（单测腿 3 ∕ 4 两向钉）。

### 2.9 验收对照（条目 → 判据）

| 条目 | 验收判据（机检形） |
|---|---|
| B1 修 | 批内件 4/4 绿（修前：腿 1 ∕ 2 红）+ 真机 `A.consoleErrors` 差集 = 删一行 |
| B2 排查 | §2.3 逐点表在册（限面闭合 · 超面 C1–C3 零发现归档） |
| B3 用例 | 件在盘（86 行）+ 修前红实测读数在案 + 实施后复跑 4/4 绿 |
| B4 真机 | §2.6 主判断言 1 ∕ 2 命中 |
| B5 文档 | `IPC.md` 形注行 + 变更记录行在盘（读回核 · 已落）；`UI.md` 零改明示 |

### 2.10 关键决策记录

| # | 决策 | 被否方案（理由） |
|---|---|---|
| D1 | 修向 = 候选 b（消费面按文档实形判） | a（回执补 `ok`：fail-loud 下退化为常量 + 形锚双改不抵收益 + 修前红不可复现）· c（= a + 复读合体） |
| D2 | 判据取**正判**（`configured` 布尔在场） | 反判（`ok !== false` 类——对形变化脆：任何非失败形皆算成功 = 过宽） |
| D3 | 回执形 ∕ boot ∕ 主侧 ∕ 核件零改；消费面单点 + 文档形注 | 「顺手归一」（改 boot 判据 ∕ 补 `ok` ∕ 动 `ask`）——超修面、零用户收益 |
| D4 | 用例 = 逻辑缝直测 + 主侧实形夹具 | VM 抽取（重）· 行为面 E2E（红不可携）· 消费面假设形夹具（批 9 假绿因） |
| D5 | 形注落「设置族注项 6」 | 落 `IPC.md:117` 行——读写共行且行宽余量薄；项 6 = 向导闸消费点本体 |

### 2.11 上抛项

| # | 项 | 说明 |
|---|---|---|
| U1 | `IPC.md` 形注（已落）请评审核锚 | 形澄清（非形变更）；与 `:117` 行 ∕ boot 判据互指一致 |
| U2 | 真机可选扩展（configured=true 变体）= 父侧工程具面自决 | 主判不依赖（真支已由单测腿 1 钉） |
| U3 | `PROJECT.md` 三处 `88` 收正 = 实施后随动 | 归口实施批 ∕ 修正轮 |
| U4 | 超面零发现（§2.3-C） | 只报不动；无扩面请求 |
| U5 | 台账 #667 = 本批同账 | 验收闭合归 §6 |

### 2.12 修正轮记录（评审轮 1）

**轮**：fix（承 §3 轮次 1 表 · 🔴0 ∕ 🟡1 ∕ 🔵2 全收）· append-only 收正记录（同号前文以本节为准）· 批内件 ∕ §2.2 修法本体 ∕ 真机主判 1 零改；#666 ∕ #668-669 ∕ #670 批面零触。

- **① 落点 §2.6 主判 2 —— 基准保全 + 路径 ∕ 字段补全**。复跑即覆写修前件（脚本固定名落盘 `.thincoder/tmp/desktop-selftest-2026-09-29.mjs:299`；命令 `>` 同路径覆写 `.log`）⇒ 主判 2 收正为三步：
  1. **复跑前归档修前件**（现盘 `.thincoder/tmp/desktop-selftest-2026-09-29.readings.json` ∕ `.log` · 轮 A 实读）⇒ 复制为固定归档名：`thincoder/.thincoder/tmp/desktop-selftest-2026-09-29-before.readings.json` ∕ `thincoder/.thincoder/tmp/desktop-selftest-2026-09-29-before.log`；
  2. 复跑（命令照主判 1）；
  3. **差集基准 = 归档件**（非复跑覆写后的同址件）⇒ 差集 = 恰删 `[renderer] config:read: failure receipt without reason` 一行（零新增 error 行）。
  - readings 全路径 = `thincoder/.thincoder/tmp/desktop-selftest-2026-09-29.readings.json`；判定字段 = `A.consoleErrors`；修前件实读含判据行（`readings.json:905`）⇒ 差集可算。
- **② 落点 §2.3-A 括注 —— 计数收正为全量清单**。全量 grep（`thincoder-desktop/` 源码面 · `.mjs ∕ .cjs ∕ .js ∕ .html` · 2026-09-29；批档 ∕ `.thincoder/tmp` 工件面不计）行级命中 **22 处**，全列：
  - 注释行 **15** = `renderer/app.mjs:2` ∕ `:71` ∕ `:218` · `renderer/i18n.mjs:3` ∕ `:362` · `renderer/index.html:37` · `renderer/mount-onboarding.mjs:10` ∕ `:61` · `src/main/attachments.mjs:38` · `src/main/ipc.mjs:68` ∕ `:92` ∕ `:100` · `src/main/session-actions.mjs:11` · `src/main/settings.mjs:48` · `src/preload/preload.cjs:19`；
  - 代码行 **7** = 消费面 5（`renderer/app.mjs:227` ∕ `:229` ∕ `:239` · `renderer/mount-onboarding.mjs:63` ∕ `:68`）+ 注册 ∕ 桥面 2（`src/main/ipc-registry.mjs:29` · `src/preload/preload.cjs:30`）。
  - 收正 = 以上述全量清单为准（原括注「另 4 处非判据引用」低估）；消费点 3 处 ∕ 判据点结论不变（评审轮 1 同判）。
- **③ 落点 §2.2 依据 1 —— 坐标收正**：fail-loud 抛出句 = `thincoder-desktop/src/main/ipc.mjs:103`（跨至 `:104`；「配置载入失败 ⇒ 抛出」起于 `:103`）。

上抛：无。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

设计评审（轮次 1）——对象 = §2（候选 b 消费面判据 + 同族排查表 + 批内件红→绿 + 真机配方）· 台账 #667。核验面：IPC.md 全档 + §2 逐条对盘（`mount-onboarding.mjs` 88 行实读 · 批内件 86 行实读 · 主侧实形 `ipc.mjs:105-110` · `configuredFlag` 三态 `store.mjs:230-234` · `views/onboarding.mjs:34` 退场判据 · `app.mjs:71-78` ∕ `:112-119` ∕ `:227-234` · `mount-settings.mjs:64-77` ∕ `:80-88` · `settings-values.mjs:35-37` `isConfigured` 布尔 · `test/run.mjs` 显式清单不收集 `docs/batches/`（红件不污染常驻套件）· IPC.md `:272` 形注 ∕ `:422` 变更记录在盘 · UI.md `:31` 闸句与修向一致）。修前红 fail 2 / pass 2 经静态推演复核成立（本评审无执行面）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance | 🟡 | §2.6 主判第 2 条「与修前读数比对 ⇒ 差集 = 恰删该一行」的比对基准未保全：复跑即覆写修前件——脚本固定名落盘（`thincoder/.thincoder/tmp/desktop-selftest-2026-09-29.mjs:299`：`writeFileSync(join(HERE, 'desktop-selftest-2026-09-29.readings.json'), …)`）且命令同路径重定向 log（同档 `:12`）；配方亦未给 readings 全路径（盘上实读 = `.thincoder/tmp/desktop-selftest-2026-09-29.readings.json`） | 配方补一步：复跑前把修前 `readings.json`（及 log）另存固定归档名，再以归档件为差集基准；并给 readings 精确路径与判定字段（`A.consoleErrors`） |
| 2 | Clarity | 🔵 | §2.3-A 括注「另 4 处非判据引用 = `ipc.mjs` ∕ `ipc-registry.mjs:29` ∕ `preload.cjs` ∕ `attachments.mjs:38`」低估——全树实读另有注释级引用 `renderer/app.mjs:2` · `renderer/index.html:37` · `src/main/settings.mjs:48` · `src/main/session-actions.mjs:11` · `src/main/ipc.mjs:68`；「消费点 3 处」（`app.mjs` boot ∕ `mount-onboarding.mjs` ∕ `i18n.mjs` `initDict`）经全树 grep 复核成立 | 计数改「注释级引用若干（全量 grep）」或补齐清单（消费点 ∕ 判据点结论不受影响） |
| 3 | Clarity | 🔵 | §2.2 依据 1 称 fail-loud「抛出句 `thincoder-desktop/src/main/ipc.mjs:104`」；实读该句（「配置载入失败 ⇒ **抛出**」）起于 `ipc.mjs:103` 跨至 `:104`（`:100-110` 区间本身无误） | 坐标收正 `:103`（或标 `:103-104`） |

计数：🔴 0 · 🟡 1 · 🔵 2。要点核验（零发现项）：候选 b 判据 `typeof receipt?.configured === "boolean"` 与主侧实形（`configured` 恒布尔——`settings-values.mjs:35-37`）及失败形（ask 归一恒无该键）互斥成立；「两处同拍」单 `read` 值达成；boot ∕ 注册面 ∕ 核件 ∕ @666 批零触面与 §2.1 不覆盖声明一致；IPC.md 形注（`:272`）与 `:117` 行 ∕ UI.md `:31` 闸句无机制级矛盾（文档归属合规，未新建文件承载既有节）；受影响文件行数注（88 → +3~+5）与盘上实读一致、未越结构档。

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 批准（父侧代签 · 2026-09-29 22:0x）

- **授权基础**：用户 2026-09-29 21:38「后续你自己跑完吧」——全链授权（评审代点火 ∕ 批准代签，沿自缚三条件）。
- **自缚三条件核验**：
  - ① 设计评审 **pass**——§3 轮次 1（🔴0 · 🟡1 · 🔵2），三条全部裁定接受并落修正轮；
  - ② 修正轮 **3/3 落地**并经父侧核验——§2.12（`:185-200`）回读在位（① 基准保全三步 + readings 全路径 ∕ 判定字段；② 全量清单 22 处（注释 15 ∕ 代码 7）；③ 坐标 `ipc.mjs:103`）；
  - ③ 设计 **token 在位**（值不落档——运行时凭证）。
- **批准结论**：**准予实施**——修法 = 候选 b（消费面按主侧实形判：`typeof receipt?.configured === "boolean"`）；批内件已落（86 行 · 修前红实测 `fail 2 / pass 2`，父侧复现过）；实施面 = `renderer/mount-onboarding.mjs:64/:67` 两处判据同拍归一（按 §2.2 现行值）。
- **实施注意（交 eng-coder）**：仅动判据两处 + 头注锚；落笔前实读复核；实施后复跑批内件 = **4/4 绿**；真机复核 = 父侧（selftest 轮 A + §2.6 归档件差集法）。
- **附**：台账 #667 收口归 §6。

## §5 实施记录（eng-coder）
**状态行**：实施完成（判据两处同拍归一 + 批内件 4/4 绿 + 审计/评审各 1 轮收敛（终态 clean））


### 5.1 实施摘要（coder 轮 · 2026-09-29）

**实施面** = `thincoder-desktop/renderer/mount-onboarding.mjs`（唯一改动档 · 内容行 88 ⇒ 90）：`finishWizard()` 判据两处同拍归一（候选 b · §2.2 现行值）；批内件与其余各档零改。

**落点与回读证据**（落笔后实读）：

| # | 落点（现盘 file:line） | 实读内容（关键片段） |
|---|---|---|
| 1 | `thincoder-desktop/renderer/mount-onboarding.mjs:65` | `const read = typeof receipt?.configured === "boolean" // 成功判据 = 回执携布尔 configured（该通道无 ok 旗标——单源 = IPC.md §2）` |
| 2 | 同档 `:66`（三元头） | `const configured = read`——`receipt.ok === true` 已去；续行 `:67` ∕ `:68` 零改（多行形式保留，取最小 diff） |
| 3 | 同档 `:69` | `if (read) clearReport()` |
| 4 | 同档 `:10-11`（头注锚 ③） | 补句：`成功判据 = 回执携布尔 configured（该通道无 ok 旗标——读失败 fail-loud 抛出；形源 = thincoder-desktop/src/main/ipc.mjs:103-104）。` |

- 零改面回读核：`:62-63`（函数注 ∕ `const receipt = await ask("config:read")`）· `:70`（`else report(...)` 两臂互斥注）∕ `:71`（`patchSettings`）∕ `:72`（`store.set(... ? next : dismissWizard(next))`）——原行号口径 `:62-63` ∕ `:68-71` 零改成立。
- diff 面（`git diff` 该档）= 恰两处 hunk（头注锚 ③ +1 行；判据两处）——除判据两处 + 注释外零 diff（验收 ④ ✓）；净 +2 行（§2.4 预报 +3～+5 为预估，实际 +2，与 §2.2 定形块内联注释形一致）。

**批内件复跑**（cwd = `thincoder/` · 命令 `node --test docs/batches/2026-09-29-desktop-config-read-receipt.test.mjs`）：

| 轮 | 读数 |
|---|---|
| 修前（本轮复现） | `pass 2 / fail 2`——腿 1 ∕ 2 红（失败臂误走，实读 `[["panel",{config:{},locale:"en",dict:{},configured:true},"config:read"]]`）· 腿 3 ∕ 4 绿（与 §2.5 修前红实测一致） |
| 修后 | `pass 4 / fail 0`（4/4 绿 · 验收 ② ✓） |

批内件 86 行零改（mtime 早于本轮全部落笔）。

### 5.2 审计与评审轮次与终态（自含交付协议）

- **分歧审计（轮次 1 · explore 只读）**：报告 1 项 = 记录面「§5 未落位」（补落即闭）；码面四点逐条核过——修法 vs §2.2 逐字一致 ∕ 除判据两处 + 注释外零 diff（读侧核算；字节级归父侧 git）∕ 批内件零改 ∕ 无越面改动。**已闭**（本段落位即修复）。
- **代码评审（轮次 1 · advisor · type=code）**：🔴 0 · 🟡 0（must-fix 0）· 🔵 1（同项 = §5 记录面未落位，标注「不阻塞」）⇒ **VERDICT: pass**。评审另核：判别器与主侧实形互斥（`thincoder-desktop/src/main/ipc.mjs:109` 恒布尔 `configured` ∥ `mount-settings.mjs:64-77` `ask()` 归一失败形恒无该键）· 生产装配面注入真件（`mount-settings.mjs:148-152`）· 退场两路 DOM 同形（`views/onboarding.mjs:34`）。评审自报限制：项目未声明 Project Standards 标准档（评审判据取 Project Guide + 通用评审标准）。
- **响应表**（评审发现 → 处置）：① 🔵 §5 未落位 → 已落（本节）；② 超面注 PROJECT.md 三处 `88` 陈旧 → 本轮不触（见 5.3-1，留父侧裁量）。
- **终态 = `clean`**（审计 1 轮 ∕ 评审 1 轮；零代码修正轮——无 fix 轮触发）。

### 5.3 决策透明（上抛 ∕ 超面注）

1. **`PROJECT.md` 行数随动本轮未执行**：`docs/desktop/design/PROJECT.md` 三处仍载 `88`（`:271` §4.1 值列 ∕ `:354` 例外续期 ∕ `:1025` U95 臂——设计档记坐标 `:355` ∕ `:1009` 与现盘有偏）；本批实施后实读 = **90**。判据：§4「实施注意（交 eng-coder）：仅动判据两处 + 头注锚」⇒ 本轮不触该档；§2.4 ∕ §2.11-U3「归口 = 实施批 ∕ 修正轮」⇒ 留父侧裁量落笔点位（收口或修正轮；落笔前按现盘实读复核坐标）。
2. **零触面与留守面**：批内件 ∕ `renderer/app.mjs` ∕ `mount-settings.mjs` ∕ `src/**` ∕ 核件 ∕ 常驻套件零触（§2.1 不覆盖清单 ✓）；**全仓套件未跑**（父侧收口跑——本批不做仓级套件验证）；**真机复核 = 父侧**（§2.6 归档件差集法 ∕ 主判 2 三步）。
3. **形态备忘**：三元多行形式保留（未收成单行——「只动判据两处表达式」的最小 diff 口径）；`configuredFlag` 保留（成功臂下对布尔入参恒等——族内一致，评审明示非缺陷）。

## §6 验证与收口（父代理）

### 6.1 验证（父侧 · 2026-09-29 22:1x）

- **判据两处 + 头注回读**（父侧实读 `mount-onboarding.mjs`）：`:65` = `const read = typeof receipt?.configured === "boolean"` ✓ ∕ `:66-68` 三元 `read ?` ✓ ∕ `:69` = `if (read) clearReport()` ✓ ∕ `:70-72` 零改 ✓ ∕ 头注锚 ③（`:10-11`）判据单源句在位 ✓；全档内容行 88 ⇒ 90。
- **批内件父侧独立复跑**：`node --test docs/batches/2026-09-29-desktop-config-read-receipt.test.mjs` ⇒ **`pass 4 / fail 0`** ✓（修前 `fail 2 / pass 2` 本轮亦可复现）。
- **真机腿（父侧 · 按 §2.6 配方执行）**：修前基线归档（`.thincoder/tmp/desktop-selftest-2026-09-29-before.readings.json` ∕ `-before.log`）→ 复跑 selftest（exit 0）→ 差集比对：`A.consoleErrors` **5 条 ⇒ 4 条，恰删 `[renderer] config:read: failure receipt without reason` 一行，零新增** ✓（主判 1 ∕ 2 双过）。
- **套件面**：not repo-suite verified（清令——仓套件不跑；父侧收口跑保留）。

### 6.2 上抛与超面处置

1. **行数随动（设计 `PROJECT.md`）**：`:271`（§4.1 值列）与 `:354`（在册例外叙述）父侧收正 `88 ⇒ 90`（父侧直接执行 · 可 revert）；`:1041`（批 B 用例号节留痕句「批 B 新档…实读 146 ∕ 147 ∕ 88」）按 as-of 政策**不追改**（判定在案）。
2. 形态备忘（三元多行保留 ∕ `configuredFlag` 保留）：收（评审明示非缺陷；最小 diff 口径）。
3. U2（selftest `configured=true` 变体）：真机主判（差集法）已过；变体**不另做**（判定在案）。
4. **并发注**：收正落笔时 peer-collab 警示邻线（cli pid=21400）持本档活写意图——两处收正若被其写覆盖，收口后复核重落（在册 · 可 revert）。

### 6.3 结算（D7）

- **角色表**：§1 讨论（主 agent）· §2 设计（eng-designer · 含 §2.12 修正轮）· §3 评审（评审子代理 · 轮次 1 pass）· §4 批准（主 agent 代签）· §5 实施（eng-coder · 终态 clean）· §6 本段（父侧）。
- **状态行**：§1 → 已收口 2026-09-29；全档冻结。
- **台账**：#667 → 已核销（依据 = 本节 + §5 + 真机差集读数）。
- **欠账**：无新增（行数三处：两处收正 ∕ 一处判定不追）。
