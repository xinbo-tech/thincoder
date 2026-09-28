# 2026-09-28 · guard-face-micro
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 用户 2026-09-28 05:0x 清账裁定（「如何少挂账」）——台账 #465（父侧门 aux 缺省 fail-open 边）+ #473/#474（台账工具守卫族）直接立链。
> 台账 = #465 + #473 + #474（守卫族 · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-28 05:0x 清账裁定 + 05:12「都自动跑吧」全自动授权——点火 / 代签 / 派发 / 收口全自动）**：守卫族微修三件——

- **① #465**：父侧门 aux 缺省 **fail-open 边**——路径**全域段**匹配含祖先段（`classifyPath("D:/work/scripts/…")` 祖先段命中 ⇒ 整片放行）；候选修法 = 限定项目根相对面；来源 = 写门放行批 #102 只报项 1/2（登记面 = `docs/core/design/PORTABILITY.md` §3.2）。
- **② #473**：ledger 查询 / 计数工具过滤参数**同类守卫**（读面）——探针实读：`status: []` ⇒ 绑定原文；`status: 123` / `kind: "bogus"` ⇒ 静默空集（同 helper 复用）。
- **③ #474**：`ledger_update.executor` `null` 形与「可空 ≡ 略去」口径不符（`ledger-cmd.mjs:271` `=== undefined` 旁路）——二选一裁：`null` 归略去 ‖ 明定 `null` = 保持现值并补口径句。

**范围**：写门分类面（`thincoder-core/agent-tools/` 侧）+ `thincoder-core/ledger-cmd.mjs`（守卫 + 取值语义）+ 对应测试；设计档落点 = `docs/core/design/PORTABILITY.md` §3.2 / `docs/core/design/LEDGER.md`。

**边界**：不改写门既有放行语义（只收 fail-open 边）；不动 ledger 写命令既有守卫（#472 已落）；需求档 / 台账零改（父侧笔）。

**链**：§2 设计 → §3 评审（授权内代点火）→ §4 批准（代签 · 三条件）→ §5 实施 → §6 收口。

**父侧裁定（2026-09-28 05:2x · 设计轮上抛四项）**

- ① **需求档侧收正 = 受理（父侧笔 · 随评审落地后同笔）**——`docs/core/requirements/PORTABILITY.md` F9 行补「项目根相对面」限定句；`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` AC-M2-15 射程（写三 ⇒ 五）+ AC-M2-16 对位 + 两档变更记录（评审落地后一笔，避免与评审冻结面互撞）。
- ② **拦截向半幅（判定表 #6）**：受理为「限定项目根相对面」登记候选的**字面导出**；是否超「只收 fail-open 边」授权面 → **交评审独立核**，其报告父侧逐条裁定；如需退守 ⇒ 走 KD-B1（code 段保持全段）。
- ③ **拆分项（KD-B4）＝ 核准**：`thincoder-core/ledger-tools.mjs`（拟新增 ≈170）+ `ledger-cmd.mjs` 核心档 ≈140——尺度派生（298 贴 300 线）· 纯搬移 · 可 revert；沿「贴线先拆后改」先例。
- ④ **测试面 `root` 同号收正 5 处 = 受理**（随 ① 实施同笔）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（守卫族微修三件 + 评审轮 1 修正 11 条落点见 §2 末修正轮块 · 2026-09-28）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

**状态行**：设计完成（2026-09-28）

**覆盖条目**：台账 #465 / #473 / #474（守卫族微修三件）。设计档落点 = `docs/core/design/PORTABILITY.md` §2 / §3.2 / §4（D17 / D18）/ §5 / 变更记录 + `docs/core/design/LEDGER.md` §3.1 / §3.2 / §8（AC-M2-16）/ §9 / 变更记录（本轮已落）。

### ① #465 —— 段匹配面 = 项目根相对面（父侧门 aux 缺省 fail-open 边收口）

**判据（钉死）**

- **项目根解析源 = 声明载体的项目根**：`conv.root = dirname(manifestFilePath(cwd))`（与档路径判定同源——KD-M1-18；缺档项目 = `resolveProjectRoot(cwd) ?? resolve(cwd)` 同一式）；`DEFAULT_DECLARATION.root = null` = 根未知。声明对象形状增 `root`（`{ declared, codePaths, index, advisor, root }`——`root` 非声明值，不入 `declared` 判）。
- **面判**：绝对形（分隔符归一 + 逐段大小写不敏感）在根之下、剩余段非空且无 `.` / `..` ⇒ 面 = 剩余段；等于根 ⇒ 面 = ∅；其余（根外 / 根未知 / 含跳段）⇒ 面不可判。相对形 ⇒ 面 = 原样段（含 `.` / `..` ⇒ 面不可判）。
- **段匹配**：aux 序列仅在面内匹配（面不可判 ⇒ **不命中**——fail-open 边收口）；code 段面内匹配、面不可判时**回落全段**（拦截面不缩）；doc / temp 判据不变；段匹配只此一处实现（消费面零签名改动、零自有面判）。

**改后判定表（放行 / 拦截双向逐条）**

| # | 输入（根 = R） | 改前 | 改后 | 向 · 说明 |
|---|---|---|---|---|
| 1 | `D:/work/scripts/mytool/lib/<x>.mjs` · R = `D:/work/scripts/mytool` | aux | **code** | fail-open 收口（#465 复现形——祖先段在根之上） |
| 2 | 同路径 · R = `D:/work` | aux | aux | 零变（`scripts` 为根内段——F9「任意深度」语义；声明 `codePaths` 可收回） |
| 3 | `<R>/test/<x>.mjs` · `<R>/packages/foo/tests/deep/<x>.mjs` | aux | aux | 零变（根内辅助面豁免全保持） |
| 4 | `D:/src/app/docs/<x>.md` · R = `D:/work/proj` | code | code | 零变（根外 = 全段——T-04 既有登记代价保持） |
| 5 | `<R>/<x>.mjs` · R = `D:/work/test`（根名即辅助面段） | aux | **code** | fail-open 收口（根名不属根内结构） |
| 6 | `<R>/docs/<x>.md` · R = `D:/src/app`（根之上含代码段） | code | **doc** | 拦截向：登记代价**根内半幅**消除（见上抛项 2） |
| 7 | 相对形 `../scripts/<x>.mjs` | aux | **code** | fail-open 收口（含跳段 ⇒ 面不可判） |

**同根 TMPDIR 假红项裁 = 消解**：面判据使根内读数不再受根之上祖先段影响（系统 TMPDIR 祖先段含 `src` 不再致用例假红）；用例以**根内 / 根外两侧读数**锁面判据（设计档 §3.2 面判读数表 + §5）。

**尺度**：`thincoder-core/conventions.mjs`（244 行）⇒ ≈275 行（面判 helper + `root` 入声明对象）；六个消费面（`thincoder-core/agent/dispatch.mjs` 498 行 · `thincoder-core/advisor/repos.mjs` · `thincoder-core/agent-tools/advisor-settle.mjs` · `thincoder-core/agent-tools/verify.mjs` · `thincoder-vscode/src/agent/tool-gates.mjs` · `thincoder-vscode/src/agent/run-helpers.mjs`）**零改**（dispatch 贴 500 硬限 ⇒ 零改是硬要求）。

**用例**：T-33（核 · 面判七读数——`thincoder-cli/test/portability-classification.test.mjs` 371 ⇒ ≈400 行）+ T-V27（VSC 同判——`thincoder-vscode/test/portability-vsc-classification.test.mjs` 351 ⇒ ≈375 行）；同号收正 = CLI T-29 / T-30 / T-31 · VSC T-V25 / T-V26（等值断言改 `{ ...conv, root: null }` 对 `DEFAULT_DECLARATION`）。

### ② #473 —— 台账读面参数守卫（同 helper 复用）

**裁定 = 非法参 ⇒ 明确中文报错**（复用 `assertToolArgs`）；落选「空集语义收紧」。

**判据**

1. **单源复用**：同 helper、同 P1–P6 文案模板（写面已立先例；D2 声明派生——枚举 / 类型不在守卫内复写）。
2. **静默空集 = 虚假读数**：`status: 123` / `kind: "bogus"` 现值 = 空集，与「库不在 = 空账」不可区分（与台账「一眼看出」机制目标相抵）；本仓口径 = fail-closed 可见。
3. **只判不改**：合法面零扰动（缺省 / 可空 `null` ≡ 略去 / 合法过滤命中读数与直调核函数等值）；守卫判于 `openLedger` 之前 ⇒ 非法参零库动作。

落选理由：把非法输入固化为「空集」= 错误不可见，且与工具 schema 的 enum 宣告相抵（「声明即校验」写面已立）。

**尺度（含拆分落地）**：`thincoder-core/ledger-cmd.mjs`（298 行）——两读工具 `execute` 顶端各 +1 行守卫 + 声明补 `additionalProperties: false`（+2 行）⇒ 必越 300 顾问线 ⇒ 按既有登记「下一增量轮先审视拆分」**拆分落地**：

- 新档 `thincoder-core/ledger-tools.mjs`（拟新增 · ≈170 行）= 五工具定义 + 守卫 helper 三件 + `assertToolArgs` + `cwdOf` + tool 层 `getSessionId` 动态 import；
- `thincoder-core/ledger-cmd.mjs` ⇒ 核心函数档 ≈140 行（五核函数 + `assertTaskBookGate` / `resolveExecutorTarget` / `isFile`）；
- `thincoder-core/ledger.mjs`（214 行）re-export 面两源（±2 行）；消费面 `thincoder-core/tools/index.mjs` / `thincoder-core/agent/family-tools.mjs` **零改**（均经 `ledger.mjs` 导入）。

**用例**：T43（`ledger_query` 非法形逐条文案逐字 + `ledger_count` 同判 + 合法形零回归 + 拒 ⇒ 零库动作）——落 `thincoder-core/test/ledger-args-guard.test.mjs`（198 ⇒ ≈240 行）。

### ③ #474 —— `executor` 显式 `null` 语义

**裁定 = `null` 归略去**（不为本字段造例外）。

**判据**

1. **跨字段规则一致性**：§3.2 已定「可空字段 `null` ≡ 略去」（例外仅 `title` / `task_book`，且各由「值无意义」判据承载）；`executor` 无独立判据 ⇒ 随通则。
2. **惯用义 + 机制目标**：模型传 `null` 的惯用义 = 「无值」；读作「抑制自动归属」= 隐式语义、不可见——F-LX1 机制目标 = 在途记「谁在做」，静默抑制与目标相抵。
3. **实现面零新增判据**：工具层与缺省同分支（`patch.executor == null` ⇒ 取 sessionId 供值）；核内 `resolveExecutorTarget` 零改（`??` 链对 `null` / 缺键同判）。

**尺度**：`thincoder-core/ledger-tools.mjs`（拟新增）判 `patch.executor == null`（±0 行）；文档 = `LEDGER.md` §3.1 `null` 口径句（本轮已落）。

**用例**：T44（`待设计 → 在途`（带在档 `task_book`）+ `executor: null` ⇒ 行 `executor` = `getSessionId()`；显式串仍优先；非迁移纯字段更新读数零变）。

### 验收对照（回指批件 / 需求侧）

| 条目 | 验收（机检） | 回指 |
|---|---|---|
| ① | `classifyPath` 面判七读数（T-33 / T-V27）+ 六个消费面零改 + 既有 portability 用例全绿（仅 `root` 同号收正 5 处） | 需求 F9（`docs/core/requirements/PORTABILITY.md` §2）· 台账 #465 |
| ② | 读工具非法形逐条文案逐字 + 零库动作 + 合法形零回归（T43）+ 套件全绿 | 需求 AC-M2-15 族（`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md`）· 台账 #473 |
| ③ | T44 三拍（`null` ≡ 略去 / 显式串优先 / 非迁移零变）+ 既有 executor 用例（T15–T17）零改全绿 | 需求 AC-M2-7（F-LX1）· 台账 #474 |
| 全批 | `cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 净增 0 悬空 + 0 行宽（基线 47 / 32——设计轮已核） | 批件验收标准 |

### 关键决策（本批）

| # | 决策 | 理由 |
|---|---|---|
| KD-B1 | 面判据对 code / aux **双向同源**（非只收 aux） | 登记候选「仅项目根之下参与段匹配」逐字；单向会留「绝对形 / 相对形不同判」破例与 TMPDIR 假红残余。**退守形**（若评审判超授权）= code 段保持全段——一行判据换向，机制其余零改 |
| KD-B2 | 项目根随声明对象下发（`conv.root`），非消费面各自解析 / 非隐式旁挂 | 根解析单源（KD-M1-18）；消费面零签名改动（dispatch 贴硬限）；隐式字段检查器与日志不可见 |
| KD-B3 | 读面裁定 = 拒（非空集收紧）；守卫同 helper 复用 | 虚假读数不可接受；单源（D2） |
| KD-B4 | `ledger-cmd.mjs` 拆分落地（工具定义 + 守卫 helper ⇒ `thincoder-core/ledger-tools.mjs`（拟新增）） | 298 行贴 300 顾问线，本批增量必越线；既有登记「下一增量轮先审视拆分」触发；纯搬移、语义零变 |
| KD-B5 | `executor` `null` 归略去 | 跨字段规则单一（§3.2）；惯用义；实现面零新增判据 |

### 上抛项（父侧 / 评审面）

1. **需求档侧收正（父侧笔）**：`docs/core/requirements/PORTABILITY.md` F9 行可补「项目根相对面」限定句；`docs/core/requirements/ENGINEERING-MODE-V2-SPEC-LEDGER.md` AC-M2-15 射程句（写三 ⇒ 五）或新增 AC-M2-16 行 + 变更记录（设计侧 AC-M2-16 已落 `LEDGER.md` §8）。
2. **拦截向半幅（判定表 #6）**：根之上含代码段的根内路径由 code 改判 doc——本设计判 = 收（同登记候选逐字，消除绝对 / 相对不同判）；若评审判超出「只收 fail-open 边」授权 ⇒ 走 KD-B1 退守形。
3. **拆分项（KD-B4）**：批件字面为「守卫 + 取值语义」，拆分 = 尺度派生项（越线触发）——请评审 / 父侧核可（纯搬移、可 revert）。
4. **测试面 `root` 收正**（同号 5 处）——形状派生项，随 ① 实施同笔。

### 修正轮（设计评审轮 1 · 发现 1–8 / 10–12 点修 · 2026-09-28）

**逐号落点**（#9 = 记账面另办 · #13 / #14 = 判程声明——本轮零触碰；改动全部落设计两档，零语义）：

| # | 号 → 改动 file:line |
|---|---|
| 1 | `docs/core/design/LEDGER.md:132`——优先级句收口两分句（进边 / 出边——与 `:140` / AC-M2-7 / T16 同判序） |
| 2 | `docs/core/design/PORTABILITY.md:92`——「单一实现面」条收口三谓词与面判链关系（含 `isTempPath`）；`:70`——API 表行 4 同指 |
| 3 | `LEDGER.md:202`（块头读数 as-of 收正 2026-09-28）· `:204`（`ledger.mjs` 补 214 行 ⇒ ±2 行）· `:208`（`ledger.mjs` 移出零改面） |
| 4 | `LEDGER.md:206`（单一读数「在位 · 198 行 · as-of 2026-09-28；本批 +T43 / T44 ⇒ ≈240 行」）· `:408`（同读数补齐） |
| 5 | `LEDGER.md:362` / `:363` / `:364` / `:365`——删重编号溯源注（发现 5 列三处；实测四处——`:363` 同款漏列，一并删除） |
| 6 | `PORTABILITY.md:264`——§7.2 括注限定非分类裁判面（分类裁判面 W4 核单源——§3.6 W4 状态注） |
| 7 | `LEDGER.md:371`——AC-M2-16 回指补「需求侧补行已落——AC-M2-15 射程注 + AC-M2-16 新增，2026-09-28（父侧）」 |
| 8 | `PORTABILITY.md:30`——档级行数 244 行 ⇒ 本批 ≈275 行（面判 helper + `root` 入声明对象）+ 批档 §2 指针（受影响文件全表） |
| 10 | `LEDGER.md:155` / `:204` / `:206` / `:401` / `:408`——状态标记一式「待建 / 在位 + as-of」（待建态逐字保留 doc-check 前向引用族前缀——替换即入悬空闸） |
| 11 | `PORTABILITY.md:8`——档头 as-of 补 2026-09-28 一枚（段匹配面 / D17–D18 / §5） |
| 12 | `PORTABILITY.md:231`——T-33 补根内 doc 面读数（对应 §3.2 读数表第 6 例——共七读数） |

**读数**：`cd thincoder && node scripts/doc-check.mjs --root .` ⇒ 悬空 **47** / 行宽 **31**（= 改前基线逐项相等——本批新增零入闸；`LEDGER.md:155` / `:204` 拟新增族列报保持）。

**未动项**：`LEDGER.md:377` / `:386`（「新档 X」= 档名定位、无判据 8 行数读数——不在五坐标射程）；需求档（零动——父侧笔）；实现码 / 其他档（零动）。两档变更记录各 +1 条。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`thincoder/docs/core/design/PORTABILITY.md` + `thincoder/docs/core/design/LEDGER.md`（全文两档；盘面行数 / 档存在性未复核——判程限此两档）。**计数：🔴 0 · 🟡 7 · 🔵 7。**

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 一致性（同机制两处互抵） | 🟡 | `thincoder/docs/core/design/LEDGER.md:132`「统一优先级：patch 显式值 > 自动语义（进 = sessionId / 出 = NULL）> 行现值兜底 > NULL」与 `thincoder/docs/core/design/LEDGER.md:140`「离开『在途』…**无条件置 NULL**——patch 显式传 `executor` 也不复活（出边自动语义压 patch）」对出边场景给出相反判序；`LEDGER.md:362`（AC-M2-7）· `LEDGER.md:380`（T16）与 :140 同侧 ⇒「统一优先级」句与出边判决不能同真 | 把出边例外并入优先级句（改写为「进边 = patch > sessionId；出边 = 无条件 NULL」两分句）或去掉「统一」字样，使 :132 与 :140 / AC / 用例同一判序 |
| 2 | 清晰度 | 🟡 | `thincoder/docs/core/design/PORTABILITY.md:70`「`isDocPath` / `isTempPath` 为独立谓词、非 `classifyPath` 派生——沿既有口径」与 `PORTABILITY.md:92`「面判与段匹配只在 `classifyPath` 链内实现（`isCodePath` / `isDocPath` / `isAuxPath` 各自经它）」互抵（`isTempPath` 未入 :92 括注）⇒ #465 面判是否覆盖 doc / temp 谓词消费面不可判 | 一句收口三谓词与 `classifyPath` 链的关系（内部判定是否一律经共享面判链），钉在「单一实现面」条下；若口径 =「API 面不改、内部经链」则写明 |
| 3 | 受影响档注记（判据 8） | 🟡 | `LEDGER.md:204`（① 拆分后 …`thincoder-core/ledger.mjs`（re-export 面两源——±2 行））与 `LEDGER.md:208`（④ 零改面含 `thincoder-core/ledger.mjs`（re-export 已在册））互抵；同块块头 `LEDGER.md:202` 标「设计时 2026-09-27 读数」而 ① 标 2026-09-28 实核 ⇒ 该档现行行数 / 预期增量不可判 | 择一收口（ledger.mjs 移出零改面并注明 ±2 行，或全块对齐同一 as-of），使受影响面块给出单一读数 |
| 4 | 受影响档注记（判据 8） | 🟡 | `LEDGER.md:206`（② 用例 = 新档 `ledger-args-guard.test.mjs`（198 行（实测）——T37–T42））与 `LEDGER.md:408`（§8 同档「在位 · 198 行 · as-of 2026-09-28」，其下含 `LEDGER.md:416` T43）不咬合——同读数 198 行但范围不同（T37–T42 vs T37–T44）⇒ 现行行数与本批增量不可判 | 统一为一条现行读数（现行行数 + 本批 T43 / T44 增量或「同规模」），② 的范围标注随 §8 同号收正 |
| 5 | 文档卫生（失效表达残留） | 🟡 | AC 表（规范面）残留重编号式表达：`LEDGER.md:362`（「旧 AC-M2-7 重编 AC-M2-9 让位」）· `LEDGER.md:364`（「原 AC-M2-7 重编承接」）· `LEDGER.md:365`（「原 AC-M2-8 重编承接」）；同沿革已住记录面（`LEDGER.md:450` 变更记录），先例裁定 = `PORTABILITY.md:276` | 删三处重编号溯源注，AC 行只留现行语义 + 回指（历史归变更记录） |
| 6 | 一致性（档内滞后） | 🟡 | `PORTABILITY.md:264`（§7.2 登记行括注「VSC 保持独立实现、语义同源」）与 `PORTABILITY.md:134`（§3.6 W4 状态注「VSC 端镜像实现已删——VSC 经 `@thincoder/core/conventions.mjs` 引用（单源…）」）对同一面读数相反（节头 `PORTABILITY.md:133`「各自独立实现」同族）⇒ 分类裁判在 VSC 端是否第二实现获得相反读数 | 收正 §7.2 括注（限定为非分类裁判面 / 挂与 §3.6 同款状态标记），使镜像纪律行文与 W4 核单源一致 |
| 7 | 需求覆盖 / 协调项 | 🟡 | `LEDGER.md:371`（AC-M2-16 回指栏「需求侧 AC 补行 = 父侧笔」）未标已落 / 待落，与 `LEDGER.md:370`（AC-M2-15「需求档补行已落…」）体例不一 ⇒ 需求侧覆盖状态不可判 | 补状态一句（已落 + 日期，或待落 + 触发点），与 AC-M2-15 行同体例 |
| 8 | 判据 8（判程受限） | 🔵 | `PORTABILITY.md:30` 只给函数 as-of 行号，无档级现行行数 / 增量；本档受影响文件表按 `PORTABILITY.md:182`（D12）落批档 §2（批档不在本判程）⇒ 本批唯一源档（`thincoder-core/conventions.mjs`）的判据 8 检查项在本判程内不可核 | 在 §2 该行或 §5 附一行指针（批档 §2 表号），或档内补现行行数 + 预期增量（越 300 线时随附拆分计划） |
| 9 | 判据 8（体量债务） | 🔵 | `PORTABILITY.md:188`（D18）载「父侧门档 499 行贴 500 硬限 ⇒ 零改是硬要求」——该档越 300 顾问线、距 500 硬限 1 行；本设计对其零改（不触判据 8 修改面），档内未登记拆分计划 | 维持零改；为该档另批登记一次主动拆分审视，避免下一次增量撞硬限 |
| 10 | 文档卫生（状态标记） | 🔵 | 档存在性标记未收正：`LEDGER.md:155` · `LEDGER.md:204`（`ledger-tools.mjs`「拟新增」与「2026-09-28 实核 · 本批拆分落地」并置）· `LEDGER.md:206`（「新档」）与 `LEDGER.md:408`（「在位」）· `LEDGER.md:401`（`ledger-close.test.mjs`「拟新增」）与 `LEDGER.md:206`（引其「153 行」为规模形）⇒ 判据 8 取「现行 + 增量」还是「预期行数」不定 | 统一一处标记法（在位 / 待建 + as-of 日期）并在全档收齐 |
| 11 | as-of 漂移 | 🔵 | `PORTABILITY.md:8` 档头 as-of 句（本档 as-of 2026-09-15 · F9 节 as-of 2026-09-27）未覆盖 2026-09-28 批内容（`PORTABILITY.md:87` 段匹配面 · `PORTABILITY.md:187`/`:188` D17/D18 · `PORTABILITY.md:231`/`:232` T-33/T-V27） | 档头 as-of 句补 2026-09-28 一枚，或改述为「逐节 as-of 注为准」 |
| 12 | 测试面（覆盖） | 🔵 | §3.2 读数表第 6 例（`PORTABILITY.md:103`——根 = `D:/src/app` 下 `<R>/docs/<x>.md` ⇒ doc，「根内半幅的过度拦截随之消除」）在 T-33（`PORTABILITY.md:231`）六项读数中无对位（同表第 3 例 aux 任意深度已由 T-26 承接）⇒ 该正面读数（doc 面）无用例锁定 | 于 T-33 追加一根内 doc 面读数，或注明该读数由面判共享逻辑 + 现有例隐含覆盖 |
| 13 | 方法学（判程受限） | 🔵 | 未提供项目标准档——方法学合规只能按 Project Guide + 本评审判据判定；两档体例（变更记录 / as-of 注 / 就地更新 / 不并项登记）在本判程内自洽，未与标准档对读（未核） | 如需该维度定论，提供标准档后复核；本判程不作为合规否证 |
| 14 | 文档所有权（判程受限） | 🔵 | 未提供 document map——「改动是否落在其主题的既有所有者档」仅能就两档内部证据判定：二者皆为本主题既有机制档、本次为就地更新（无新建分片档、未见档内复制他档正文）；跨档重复 / 相抵未核 | 提供 document map 后补核跨档重复 / 相抵项 |

VERDICT: pass（🔴 0 · 🟡 7 · 🔵 7）

## §4 用户批准（主 agent）

**父侧代签（用户 2026-09-28 05:12「都自动跑吧」——点火 / 代签 / 派发 / 收口全自动授权；自缚三条件齐备）**

- ① **设计评审 pass**：轮 1 = 0🔴 / 7🟡 / 7🔵（评审 19）——三件本体（#465 面判 / #473 读面守卫 + 拆分 / #474 `null` 口径）过审；
- ② **修正落地核验** ✓：修正轮 #23 十一条（1–8、10–12；含实测第四处重编号注）+ 父侧需求档同笔（F9 根相对面限定 + AC-M2-16 + 两档变更记录）；父侧逐点复读核验（`LEDGER.md:132` · `:204-208` · 重编号注清 · `PORTABILITY.md:92` · `:231` 七读数）；
- ③ **token 已签发**（值不落档——运行时凭证）。

**批准范围**：§2 定稿设计（段匹配面 = 项目根相对面 + 读面守卫 + `executor` 空值口径 + 拆分落地）；实施写域 = `thincoder-core/conventions.mjs` · `ledger-tools.mjs`（拟新增）· `ledger-cmd.mjs` · `ledger.mjs` · `test/ledger-args-guard.test.mjs` · `thincoder-cli/test/portability-classification.test.mjs` · `thincoder-vscode/test/portability-vsc-classification.test.mjs`（root 同号收正 5 处随①同笔）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（2026-09-28 · 三套件全绿（750 / 885 / 1034 · fail 0）· 评审轮 1 pass）

**交付摘要**（守卫族微修三件 · 写域 = §4 批准七档）

| 条目 | 落点 | 行数读数 |
|---|---|---|
| ① #465 段匹配面 = 项目根相对面 | `thincoder-core/conventions.mjs`（面判 `faceOf` + 单一分叉 `hasSegmentSequence(…, fallbackAll)`（aux `false` / code `true`）+ `root` 入声明对象 · `DEFAULT_DECLARATION.root = null`）；六消费面零改 | 244 ⇒ **295** |
| ② #473 读面守卫 + 拆分落地 | 新档 `thincoder-core/ledger-tools.mjs`（五工具定义 + 守卫 helper 三件 + `cwdOf` + tool 层 `getSessionId` 动态 import）；`ledger-cmd.mjs` 收敛为核函数档；`ledger.mjs` re-export 两源 | 298 ⇒ **130** · 新档 **187** · 214 ⇒ **216** |
| ③ #474 `executor` 显式 `null` ≡ 略去 | `ledger-tools.mjs` `patch.executor == null` 与缺省同分支；核内 `??` 取值链零改 | 工具档 ±0 |
| 用例面 | T-33 / T-V27（面判七读数 + 边界四面：面 = ∅ · 相对形含 `.` · 绝对形含 `..` · 根未知）· T43 / T44；`root` 同号收正 7 处断言（5 用例） | 198 ⇒ 255 · 371 ⇒ 407 · 351 ⇒ 388 |

**实跑读数**（2026-09-28 · 工作根 `D:\teamcode` · 仓 `thincoder/`）

- `cd thincoder-core && node test/run.mjs` ⇒ tests **750** · pass **750** · fail 0（含 T43 / T44）
- `cd thincoder-cli && node test/run.mjs` ⇒ tests **885** · pass **885** · fail 0（含 T-33）
- `cd thincoder-vscode && node test/run.mjs` ⇒ tests **1034** · pass **1034** · fail 0（含 T-V27）
- `node scripts/doc-check.mjs --root .` ⇒ 悬空 **47** / 行宽 **31**（= 设计轮修正读数，净增 0）
- 注：core 计数含并行批次新增用例（本座落盘时 747 → 复核 750）；三条读数均 fail 0。

**决策透明表**（设计未定形、实施轮自定）

| # | 决策 | 理由 |
|---|---|---|
| B-I1 | 面判形 = `faceOf(p, root)`（段数组 / `[]` / `null` 三态）+ 单一分叉点 `hasSegmentSequence(p, sequences, root, fallbackAll)` | 面判只此一处；D17 两向语义（aux 不命中 / code 全段回落）显式化 |
| B-I2 | 缺档 / 档不可用声明面 = `buildDeclaration(null, root)`（不复用 `DEFAULT_DECLARATION` 常量） | §3.2「缺档项目 = `resolveProjectRoot(cwd) ?? resolve(cwd)` 同一式」⇒ 面判锚仍在位；`DEFAULT_DECLARATION.root = null` 仍为「根未知」回退面 |
| B-I3 | 无 `conv` / `root: null` ⇒ 面不可判 ⇒ aux 不命中 + code 全段回落 | 照 §3.2 面不可判处置句；T-33「根未知 ⇒ 全段旧判」读数按**代码段半幅**断言（aux 半幅照设计收口） |
| B-I4 | 用例面补 4 条面判边界读数 + `isAuxPath` 反向断言 | 面判三分支边角不在七读数内；零新语义（逐条照 §3.2 字面） |
| B-I5 | `ledger-tools.mjs` 静态 import `ledger-cmd.mjs` 五核函数 | 同链（node:sqlite 经 `ledger-db.mjs`）；消费面仍只动态 import `ledger.mjs` ⇒ W8 契约②不破 |
| B-I6 | 读面二具补 `additionalProperties: false`（守卫本体仍消费 `properties` 派生） | §3.2 明裁（闭合声明与「未知键拒」同源） |

**背离审计与代码评审（轮次与终态）**

- **内部背离审计**（explore · 只读 · 轮 1）：**0 代码背离**——逐条对读面判三条 / 判定表七行 / 六消费面零改 / 纯搬移与名面 / 守卫生效与判序 / `null` 口径 / 行数约束 / 表外改动；报 doc-drift 3 条 + 观察 2 条（见下）。
- **内部代码评审**（advisor `type=code` · 轮 1）：**VERDICT: pass**（0🔴 · 0 must-fix）——发现 6 条（🟡 3 / 🔵 3）；核验摘要判 ②③ 面零缺陷。
- **fix round 1**：评审发现 5（🔵「切段原语两份」）**已改**——`faceOf` 改用 `segmentsOf(s)`（一行、逐字等价改写）；改后三套件复跑全绿（750 / 885 / 1034）。未再开评审轮 2（该条 = 非 must-fix + 等价表达式交换；复核证据 = 复跑读数）。
- **终态 = `clean`**（0🔴 / 0 must-fix；登记项 5 条各有到期条件或另批指向）。

**评审发现处置表**

| # | 发现 | 严重级 | 处置 |
|---|---|---|---|
| 1 | 「拦截向半幅」新放行面（根内 doc / 辅助面路径——当根或根之上含代码段时） | 🟡 非 must-fix | 登记 + 上抛：父侧对 §1 上抛项 2 出裁定句；退守形 = `conventions.mjs` 一行判据换向（KD-B1）。独立核结论 = 判在登记候选「仅项目根之下参与段匹配」字面射程内 |
| 2 | CLI 用例档 407 行 > 300 顾问线 | 🟡 非 must-fix | 不采纳于本批（新增档超 §4 批准写域）——另批拆分建议随交付报告上抛 |
| 3 | VSC 用例档 388 行 > 300 顾问线 | 🟡 非 must-fix | 同上（T-V27 移入 VSC 专档，两档同轮） |
| 4 | 相对形 `.` 段不对称（`test/x.mjs` ⇒ aux / `./test/x.mjs` ⇒ code） | 🔵 | 不采纳于本批（设计已钉死 + 用例已锁 + 消费面零改是硬要求）；另批候选（如实跑发现常触） |
| 5 | 切段原语两份 | 🔵 | **已改**（fix round 1，见上） |
| 6 | `conventions.mjs` 295 行贴近顾问线 | 🔵 | 登记：下一增量前先审视拆分（沿 KD-B4「贴线先拆后改」先例） |

**越域 / 上抛（非本座写域）**

1. **doc-drift 3 条**（设计档面）：`docs/core/design/LEDGER.md:8` 模块地图仍记「`ledger-cmd.mjs`（命令族 + 工具定义）」；`docs/core/design/PORTABILITY.md:30` + `:67`–`:72` 行号与档级行数（估 ≈275 ⇒ 实 295）待回填；`LEDGER.md:204`–`:206` 行数预期 vs 实读（188 / 130 / 216 / 255）。
2. **观察 2 条**：`thincoder-vscode/test/files.mjs:67` 档注释仍只列 T-V01–T-V06（T-V22–T-V27 未登记）；`thincoder-cli/m10-cli-fresh.log` 为历史失败日志残留（其失败因 `normAbs` / `scanGroups` 现行码面已无）——勿据其判红。
3. **批档 §2 内读数相抵**：验收对照行（`:103`「基线 47 / 32」）vs 修正轮（`:140`「悬空 47 / 行宽 31」）；本座实测 = **47 / 31** ⇒ 收口轮择一。
4. **越域核对**：本座改动 = 七档整（`git diff --stat` 逐档在册）；仓内并行批次在改的 session / docs / desktop 档不属本座，零越域新增。

## §6 验证与收口（父代理）

**验证（父侧亲跑 · 2026-09-28 06:0x）**：① `cd thincoder-core && node --test test/ledger-args-guard.test.mjs` —— **T37–T44 全过 8/8**（读面守卫 T43 · `executor: null` ≡ 略去 T44）；② `cd thincoder-cli && node --test test/portability-classification.test.mjs` = **19/19**（含 T-33 面判判定表）；③ `cd thincoder-vscode && node --test test/portability-vsc-classification.test.mjs` = **15/15**（含 T-V27）；④ 全仓读数（实施侧）：核 750/750 · CLI 885/885 · VSC 1034/1034。

**上报处置（四项）**：① 「拦截向半幅」（判定表 #6——除收 fail-open 边外两形由拦截转放行）= **受理**（登记候选字面射程内；判定表七行由 T-33 / T-V27 逐行锁定；如需退守 = `conventions.mjs` 一行判据换向〔KD-B1〕）；② 设计档漂移（`LEDGER.md:8` 模块地图 · `PORTABILITY.md:30` + `:67-72` 行数）= **文档波**（父侧同笔一次落）；③ §2 读数相抵（`:103` 47/32 vs `:140` 47/31）——**实测 47/31 为准**（本 §6 定谳）；④ 同族杂物（两 portability 档越 300 拆分 / `files.mjs` 注释 / `m10-cli-fresh.log` / BADGES 副本）⇒ **记账 #489**。

**提交与推送**：`126480b4`（fix: project-relative guard faces + ledger read guards——7 档）· 双远端已推 · 推送后核验 = `rev-list --count` 双零。

**结算（D7）**：台账 #465 / #473 / #474 → 待核销 → 已核销（evidence = 本 §6 + 提交号）· 设计槽已消费（链终态）。
