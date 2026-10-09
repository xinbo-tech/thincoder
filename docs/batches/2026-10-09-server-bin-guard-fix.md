# 2026-10-09 · server-bin-guard-fix
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-09 · 来源 = 用户 2026-10-09 11:2x「bin那个缺陷先修」——承 ECS 测试环境部署轮暴露的 bin 入口 guard 缺陷（#1113 条件触发命中）。
> 台账 = #1113（server · 归批）。前情 = docs/batches/2026-10-09-server-test-env-ecs.md §1（在途——缺陷暴露批）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-09
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent · 2026-10-09）**

**来源与授权（用户逐字）**：11:2x「bin那个缺陷先修」——承 ECS 测试环境部署轮（`docs/batches/2026-10-09-server-test-env-ecs.md` §1）暴露的 bin 入口 guard 缺陷（台账 #1113；本批 = 其修复批，条件触发命中）。

**范围**：① `thincoder-server/bin/thincoder-server.mjs` 入口判据 realpath 化（最小差分——+3 行：import ∥ 判据 ∥ 注释）；② 批内件（符号链接 ∥ 目录连接两形不静默 + 真身非回归 + 导入语义——§2.5 验收表）。**范围外（本批不修）**：同族十三处（清单 = §2.1——入台账另册）；部署资产（ECS compose `entrypoint:` 覆盖件 = 现状绕行——修复落地后由父侧收尾移除）；需求档本体（AC-8 缺口 = 回笔建议，见下）。

**授权口径（父侧）**：产品码 → 正式链（设计 → 评审〔用户点火〕 → 用户批 → eng-coder）；父侧直改曾被产品码写门机械拒（判据 ≠ 门旁路，门优先——仓零触在证）——故本轮设计由 eng-designer 落盘，实施待批后派舱。

**关键判据（设计轮回报——见 §2）**：修形 = `argv[1]` 经 `realpathSync` 解析后与 `import.meta.url` 比对；不可解析 ⇒ 抛（显式，不静默）；被否候选在册（`.native` 大小写归一与装载器拼写保持面不咬合 ∥ `resolve()` 同病 ∥ `throwIfNoEntry:false` 吞缺位 = 静默残留 ∥ 仅文档约定 = 根因不动 ∥ 部署壳绕行长期化）。

**在册待办**：① 需求档回笔（AC-8 补「npm 全局装（POSIX 符号链接垫片）装后起服可跑」一条——本缺陷所出之缝；笔 = 主 agent，随评审/批准束办）；② 部署侧收尾三件（镜像重建 ∥ 覆盖件移除 ∥ 重收敛验证——父侧，修复落地后执行）；③ 同族十三处 = 入台账另册（本轮新增技术待办）。

**§1 授权（用户 2026-10-09 11:33「后续自动跑完。」）**：本批全链授权（循本仓先例）——设计评审点火权（首轮已由用户 11:32「点火！」亲点；后续轮父侧自动）∥ §4 用户批准（父侧代签）∥ 修正轮 ∥ 实施轮派发 ∥ 收口核销 · 提交 · 推送 · token 耗——全部父侧自动执行，不必逐次请点。

**父侧自缚三条（本仓惯例）**：① 代签仅当三条件齐备（评审 pass〔0🔴〕∧ 修正轮已落地并逐条核验 ∧ token 已签发）——代签在 §4 写明「父侧代签（用户 11:33 授权）+ 三条件依据」；② 新范围 ∥ 用户口径裁决 ⇒ 停下、只摆那一条；③ 破坏性/不可逆（数据 ops ∥ 强杀 ∥ 外仓写）⇒ 先停。

**射程说明**：含需求档 AC-8 回笔（随批准束——同一缺陷的验收面补缝，非新范围）；ECS 部署收尾三件（§2.7②：镜像重建 ∥ 覆盖件移除 ∥ 重收敛验证）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（bin 入口 guard 修复——`argv[1]` realpath 判据（最小差分 +2 行）；评审轮次 1 #1–#4 收正（修正块 §2.8）；上抛 3 项）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与需求锚
- **#1113（server · 归批——bin 入口 guard 缺陷）**：npm 全局装（POSIX，bin = 符号链接形）起服静默退出 0、服务永不启动（ECS 实机双证：符号链接路径跑 = 零输出退 0；realpath 直跑 = 真执行并报 `startup_failed`；本机 2026-10-09 复现同形）。修复 = `thincoder-server/bin/thincoder-server.mjs:176` 判据经 `realpathSync` 解析后比对 + `:12` 邻增 import（最小差分——+≈3 行）。
- **需求锚**：`docs/server/requirements/PROJECT.md:41`（功能点 8——装机 = `npm i -g`）∥ `:143`（AC-8 行——判据缺口 ⇒ 2.7① 回笔建议）。
- **非本批条目（列册——同族记录，本批不修）**：任务书八处——`thincoder-server/deploy/backup.mjs:84` ∥ `thincoder-server/deploy/converge.mjs:194` ∥ `thincoder-server/src/ops/cli.mjs:216` ∥ `bench/preflight.mjs:115` ∥ `bench/probe.mjs:307` ∥ `bench/run.mjs:304` ∥ `bench/toolcall.mjs:259` ∥ `scripts/api-contract.mjs:129`；**本轮新发现五处**（`resolve()` 变体——同病）：`scripts/dev-link.mjs:171` ∥ `scripts/doc-check.mjs:123` ∥ `thincoder-cli/scripts/doc-impact.mjs:144` ∥ `thincoder-desktop/scripts/make-icon.mjs:170` ∥ `thincoder-desktop/scripts/materialize-deps.mjs:142`。

### 2.2 设计档落点（已落盘——逐处 file:line）
- `docs/server/design/ops/OPS.md:89-95`（§4 入口判据条 + 判据行最终形 fenced（含注释））∥ `:209`（§6 bin 行预算：实读 176 ⇒ ≈179）∥ `:241`（§7 功能点 8 判据行）∥ `:254`（§8 KD-SV-53）∥ `:277`（§9 B30）∥ `:311`（变更记录）。
- `docs/server/design/PROJECT.md:84`（§4 标题 1–52 ⇒ 1–53）∥ `:140`（KD-SV-53 索引行）∥ `:168-169`（§6 本批预算行）∥ `:211`（§6 随动表行）∥ `:256`（§7 功能点 8 判据行）∥ `:335`（§9 R43）∥ `:385`（变更记录）。
- 机检读数（2026-10-09 设计轮）：`node scripts/doc-check.mjs` ⇒ 闸态零（悬空 0 ∥ 行宽 0 新增；新件引用 = 「拟新增——列报 · 不入闸」）。
- **需求档（主 agent 笔——本设计不改）**：回笔建议 = 2.7①。

### 2.3 机制设计（修复形——最小差分；含最终形与注释）
- 修改坐标：`thincoder-server/bin/thincoder-server.mjs`——`:12`（`node:url` import 邻）增 `import { realpathSync } from "node:fs"`；`:176` 判据改经 realpath 解析后比对 + 单行短语注释（载「为什么」）。无 try/catch（路径不可解析 ⇒ 抛——显式报错，不静默；裁决口径）。净增量 = +3 行（176 ⇒ ≈179）。
- 最终形（与设计档 §4 同文）：

```js
import { realpathSync } from "node:fs"
// 入口判据：argv[1] 先经 realpath 解析再比——npm 全局装（POSIX）bin = 符号链接形：argv[1] 非真身路径，不解析 ⇒ 判据恒假 ⇒ 静默退出 0；不可解析 ⇒ 抛（显式，不静默）。
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) await run()
```

- 判据机理：ESM 装载器把 `import.meta.url` 规范为真身路径（拼写保持面）；`argv[1]` = 调用侧原样路径（npm 垫片形 = 符号链接路径）⇒ 两侧先同面化（realpathSync）再比。
- 行为判据：红（现码——本机 2026-10-09 实证 + ECS 双证）= 经符号链接/目录连接调用 ⇒ 零输出退 0（`run` 从未执行）；绿（修复后）= 真执行：无 `--config` ⇒ stdout `startup_failed`（`缺少 --config`）+ 退 1；非回归 = `node <真身路径>` 同读数（既有先例 = `docs/batches/2026-10-06-server-gateway.test.mjs` 入口冒烟腿）∥ 小写拼写调用同（realpath 判据不受拼写影响）。
- 实证读数（本机 2026-10-09 · win32 · Node v24，探针 = 临时域）：直跑（大写 ∥ 小写拼写）旧判据真、realpath 判据真；文件符号链接 ∥ 目录连接两形旧判据**假**（真 bin 跑 = 零输出退 0）、realpath 判据**真**；`node -e` 的 `argv[1]` = undefined（`&&` 短路——import 上下文零抛，既有语义不变）。
- `.native` 被否（实证）：`realpathSync.native` 归一盘符/大小写（`c:\…` ⇒ `C:\…`），与装载器拼写保持面不咬合——小写拼写调用恒假。

### 2.4 受影响文件与测试面
- 产品码：`thincoder-server/bin/thincoder-server.mjs`（**176 ⇒ ≈179**）∥ `thincoder-server/package.json`（`prepublishOnly` 清单 27 ⇒ **28**——本批件入链；单行清单行数零变）。
- 测试面（新建——批内件，随批留存、不入仓套件）：`docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`（估 ≈130 行）。
- 零触：`thincoder-server/src/**` ∥ `public/**` ∥ `deploy/**` ∥ Dockerfile ∥ compose（部署资产零动——收尾 = 2.7②）。

### 2.5 验收对照（判据机器可核；载体 = 批内件）
| # | 判据 | 载体 |
|---|---|---|
| 1 | 文件符号链接腿（生产形——npm 垫片）：`node <link>`（无 `--config`）⇒ 退 1 + stdout 含 `startup_failed` | T1（现码红：退 0 零输出 ⇒ 修复后绿） |
| 2 | 目录连接（junction）腿（无特权互补形）：`node <junc>/bin/thincoder-server.mjs` ⇒ 同读数 | T2 |
| 3 | 非回归：`node <真身路径>`（无 `--config`）⇒ 同读数 | T3 |
| 4 | 导入语义：import 该模块（非主入口）⇒ `run` 不自动执行、导出在场 | T4 |
| 5 | 红绿序：先对现码跑 ⇒ T1/T2 红；修复落地后复跑 ⇒ 全绿（读数记 §5） | 实施轮（实现者写、实现者跑） |
| 6 | 建链能力处置：单腿不可建 ⇒ 显式 skip 读数「能力前提缺失」；两腿俱不可建 ⇒ 测试失败（fail-closed） | 腿内守卫（沿 `docs/batches/2026-10-05-engine-tools-gaps.test.mjs` canLink 先例） |

跑法：`node --test docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`（自 `thincoder/` 仓根；件内 ROOT 上溯两级）。

### 2.6 关键决策
- **KD-SV-53**（全文 = `ops/OPS.md` §8）：bin 主入口判据 = `argv[1]` 经 `realpathSync` 解析后与 `import.meta.url` 比对；不可解析 ⇒ 显式报错；被否 = 仅 `resolve()` 面 ∥ `.native` ∥ `throwIfNoEntry:false` 吞缺位 ∥ 仅文档约定 ∥ 部署壳绕行长期化（逐条理由在册）。
- 范围纪律：同族十三处不修（列表 = 2.1）；部署资产零动（收尾 = 父侧）；不引依赖（`node:fs` 自带）；不扩写需求档。

### 2.7 上抛与备注
1. **需求档回笔建议（主 agent 笔）**：`docs/server/requirements/PROJECT.md:143` AC-8 判据未覆盖「npm 全局装（POSIX 符号链接垫片）装后起服可跑」——本缺陷即从此缝漏出（功能点 8 本体已覆盖：装机 = `npm i -g`）；建议补一条判据（载体 = 批内件 ∥ 收口轮）。
2. **部署侧收尾（父侧执行——ECS）**：修复落地后 ⇒ ① 重建镜像（构建上下文含修复）；② 移除 compose `entrypoint:` 覆盖件（现绕行）；③ `up -d` 重收敛；验证 = 无覆盖件下 `Up (healthy)` + 日志含 ready。npm 路发布后自生效（发布面另轮）。
3. **同族记录（本批不修）**：清单 = 2.1（十三处）；建议入台账择批处置。
4. **§1 占位备注**：批档 §1 讨论段现为模板占位（未见正文）——本设计依据 spawn 任务书全文（含裁决口径）；如 §1 另有正式条目，以 §1 为准回正。

### 2.8 修正块（fix 轮——评审轮次 1 #1–#4 收正；父侧裁定全收）
- **#1（验收判据 🟡）**：§2.5 补腿（新行 7 ∥ 载体 T5）——判据 =「不可解析 ⇒ 抛（显式、非静默）」；构造 = 子进程伪 `argv[1]`（不存在路径）+ 动态导入 ⇒ 非静默失败（退非 0 + 报错可见）；红 = 现码该构造下零输出退 0 ∥ 绿 = 修复后非静默失败 ∥ 守卫 = 免建链（构造恒可；不可达 ⇒ 显式 skip——沿行 6 先例）；并入行 5 红绿序（现码 ⇒ T1/T2/T5 红）；随动（已落）= `ops/OPS.md` §7 功能点 8 行补同支 + §9 B30 输入/预期扩同支；§2.5 跑法行零动（同件同跑法）。
- **#2（文档状态 🟡）**：门禁件数随正——`ops/OPS.md` §5.1 ∥ `docs/server/design/PROJECT.md` 板级行两处收正（27 ⇒ 28 件；组成 = 八 + #962/#963/i18n/#972 件 + 后续各批 15 件 = 27——实读 2026-10-09；本批件入链）；与 §2.4 ∥ `PROJECT.md` §6 预算行（27 ⇒ 28）同拍。
- **#3（行数注释 🔵）**：+3/≈179 ⇒ +2/≈178（组成 = import +1 ∥ 注释 +1 ∥ 判据行就地改写 ±0）——本节 §2.1 ∥ §2.2 ∥ §2.3 ∥ §2.4 内各处以本块为准；批档 §1 同载（主 agent 段——未改，以本块为准）；设计档两处（`ops/OPS.md` §6 ∥ `PROJECT.md` §6）已就地收正。
- **#4（记录面 🔵）**：§2.7④ 备注前提已陈——批档 §1 现载完整讨论正文；§1 ∥ §2 一致性已核（范围 ∥ 待办 ∥ 判据逐项一致），无需回正。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 验收判据 | 🟡 | KD-SV-53 ∥ §4 已裁的「路径不可解析 ⇒ 抛（显式报错——不静默）」分支无任何机检腿：§2.5 T1–T4 只覆盖垫片/连接/真身/导入四面，OPS §7 行与 B30 亦无对应腿（B30 预期 = `startup_failed` + 退 1 一径）；该分支可经伪 `argv[1]` + 动态导入构造触达（`bin/thincoder-server.mjs:176` 顶层求值），非不可测。 | 补一条腿（伪 `argv[1]` 动态导入 ⇒ 非静默失败；或 `node -e` 导入 ⇒ 零抛），或在 §2.5 明示该分支不做机检的理由。 |
| 2 | 文档状态 | 🟡 | 门禁件数跨档不一致（属既存滞后，非本批引入）：`OPS.md:102` 谓「批内件十二件（八 + #962 件 + #963 件 + i18n 件 + #972 件）」∥ `PROJECT.md:175` 板级件行止于「`prepublishOnly` 清单十二件 ⇒ 十三件」；实读 `thincoder-server/package.json:13` 清单为 27 件（第 27 项 = `docs/batches/2026-10-08-server-public-structure.test.mjs`），本设计自身按「27 ⇒ 28」记账（批档 §2.4 ∥ `PROJECT.md:169`/`:211`）——陈值与现行值相抵。 | 两处件数随正为现行值（本批后 = 28 件），与本批 §2.4 ∥ `PROJECT.md:169`/`:211` 预算行（27 ⇒ 28）同拍。 |
| 3 | 行数注释 | 🔵 | 「净增量 = +3 行（176 ⇒ ≈179）」（批档 §2.3）组成枚举三取其二才为新增（import +1 ∥ 注释 +1 ∥ 判据行就地改写 ±0）⇒ 净增实为 +2（≈178）；同文另见 `OPS.md:209`、`PROJECT.md:168`、批档 §2.1。 | 收正为 +2/≈178，或保留 ≈ 容差、回填轮以实读闭合。 |
| 4 | 记录面 | 🔵 | 批档 §2.7④ 谓「批档 §1 讨论段现为模板占位（未见正文）」——本评审实读 §1 已载完整讨论正文（来源 ∥ 范围 ∥ 授权口径 ∥ 关键判据 ∥ 在册待办），且与 §2 逐项一致（范围 ∥ 待办三件 ∥ 判据）；该备注前提已陈。 | 回填轮收正该备注（前提已陈；核对结论 = §1 与 §2 一致、无需回正）。 |
| 5 | 边界（unverified） | 🔵 | 残余入口形态：若 Node 旗标 `--preserve-symlinks-main`（∥ NODE_OPTIONS 同值）语义 = 主模块不做真身解析（本条未在评审范围内可核——unverified），则经符号链接的主入口调用在新判据下仍可静默退 0；触达面 = 显式 opt-in 旗标（npm 垫片 ∥ systemd ∥ 容器三径均不携带）。 | 视需要在 §4 记一笔「不支持旗标形态」边界；不记亦可（非生产形）。 |

VERDICT: pass

**计数**：🔴 0 ∥ 🟡 2 ∥ 🔵 3（共 5 发现；核验读数：`bin/thincoder-server.mjs` 实读 176 行 ∥ :12/:176 坐标属实；`package.json:13` 清单 27 件；OPS/PROJECT 全部申报落点 file:line 实读命中——0 悬空）。

## §4 用户批准（主 agent）

**§4 用户批准（父侧代签 · 2026-10-09）**

**依据** = 用户 2026-10-09 11:33「后续自动跑完。」= 本批全链自动授权（§1 授权条在册）。

**三条件核检**：① **评审 pass**——设计评审 §3 轮次 1（🔴 0 · 🟡 2 · 🔵 3）· VERDICT: pass；发现处置 = #1–#4 收修（修正轮已落）· #5 Deferred（显式 opt-in 旗标、三径不携带——理由在册）② **修正轮已落地并逐条核验**——修复轮 eng-designer#3 四条逐号落；父侧核验 = 实读八处（`docs/server/design/ops/OPS.md:102/:209/:241/:277/:312` ∥ `docs/server/design/PROJECT.md:168/:175-176/:386`）+ 批档 §2.8 L85–L88 在册 + `node scripts/doc-check.mjs` 复跑 **EXIT 0** ✓ ③ **token 已签发** ✓（凭据值不落档——沿纪律）。

**实施口径**：设计令牌在册（本会话持有）；实施舱按 §2 任务书派发（§2.4 三件：`bin/thincoder-server.mjs` ∥ 批内件 `docs/batches/2026-10-09-server-bin-guard-fix.test.mjs` ∥ `thincoder-server/package.json` 清单 27 ⇒ 28）；落地后父侧验证 + ECS 部署收尾三件（§2.7②）。

## §5 实施记录（eng-coder）
**状态行**：实施完成（评审 round 1 = changes-required（唯一 🔴 = 门禁件数随正）已由父侧直笔落正 + 复跑闭环；本舱写面 = 3 件、对该 7 件零重叠（详见本节））



**§5 实施记录（eng-coder · 2026-10-09）**

**摘要**：#1113 bin 入口 guard 修复落地——主入口判据 `argv[1]` 经 `realpathSync` 解析后与 `import.meta.url` 比对（修因：npm 全局装（POSIX）bin = 符号链接形：`argv[1]` 非真身路径，旧判据恒假 ⇒ 静默退出 0、服务永不启动）；不可解析 ⇒ 抛（显式、不静默；无 try/catch）。批内件新建（T1–T5 + 建链守卫）；`package.json` 门禁清单 27 ⇒ 28。净 +2 行（176 ⇒ 178）。

**改动清单（file:line）**

| 文件 | 坐标 | 内容 |
|---|---|---|
| `thincoder-server/bin/thincoder-server.mjs` | `:12` | 增 `import { realpathSync } from "node:fs"`（`:13` = 既有 `node:url`） |
| 同上 | `:177-178` | `:177` 注释（载为什么）∥ `:178` 判据行 realpath 形（就地改写 ±0） |
| `thincoder-server/package.json` | `:13` | `prepublishOnly` 清单末位增本批件（27 ⇒ 28；单行零变；实点 28、去重 28） |
| `docs/batches/2026-10-09-server-bin-guard-fix.test.mjs` | 新建 | 批内件 112 行（T1–T5 + 守卫；跑法在件头） |

**红绿读数（逐条）**——跑法 = 自 `thincoder/` 仓根 `node --test docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`（本舱两跑 = 2026-10-09 11:53 HKT 区）：

| 腿 | 红（修复前） | 绿（修复后） |
|---|---|---|
| 守卫 建链能力 | 文件符号链接可建 = true · 目录连接可建 = true（无 skip） | 同读数（无 skip） |
| T1 文件符号链接（npm 垫片形） | `status=0 · stdout="" · stderr=""`（红 ✓） | `status=1 · stdout` 含 `startup_failed`（`缺少 --config`） |
| T2 目录连接（junction） | `status=0 · stdout="" · stderr=""`（红 ✓） | `status=1 · stdout` 含 `startup_failed` |
| T3 真身非回归 | `status=1 · startup_failed`（基绿） | `status=1` 同读数（零变） |
| T4 导入语义 | `status=0 · 导出在场 · exitCode null`（基绿） | `status=0` 同读数 |
| T5 伪 `argv[1]` 不可解析 | `status=0 · stdout="" · stderr=""`（红 ✓） | `status=1 · stderr` 含 `ENOENT` |
| 汇总 | tests 6 · pass 3 · fail 3 · skipped 0 · exit 1 | tests 6 · pass 6 · fail 0 · skipped 0 · exit 0 |

机检：`node --check bin/thincoder-server.mjs` 过 ∥ 批内件落盘语法过 + 实跑全绿。**not repo-suite verified**——本舱只跑本批件；仓套件/门禁整套 = 父侧收口跑（唯一套件跑）。

**验收对照（任务书 ①–⑤）**：① 红绿读数在册 ✅（上表）∥ ② 改动三件 file:line ✅（上表）∥ ③ `node --check` + 批内件全绿 ✅ ∥ ④ `package.json` 含本批件（28）✅ ∥ ⑤ not repo-suite verified ✅。

**决策透明（本舱自主决断）**

| # | 决断 | 理由 |
|---|---|---|
| 1 | 建链在模块载入时一次成型；单腿不可建 ⇒ `t.skip("能力前提缺失")`；两腿俱不可建 ⇒ 显式失败 | 沿 §2.5 行 6 先例（fail-closed）；本机两腿俱可建（读数在案） |
| 2 | T5 构造 = 临时 driver（置伪 `argv[1]` + 动态导入 bin） | 恒可建、免建链；红/绿形状经探针先验 |
| 3 | T4 = 进程内 import（导出在场）+ 子进程 driver（不自动执行反证） | 一条腿同落两子判 |
| 4 | 清理链维持「先 unlink 后 rm」原序（不加加固） | 探针实读 `lstat(junction).isSymbolicLink()=true` ⇒ rm 判「链 ≠ 目录 ⇒ 不递归」，评审 🔵#6 风险面不成立 |

**自检轮次与终态**

- **内审（explore 分歧审计 · 只读）**：零分歧 pass——判据行三处行哈希逐字节等（`bin :12/:177/:178` = `OPS.md :92/:93/:94`）∥ 净 +2 算术闭合 ∥ 腿表逐条对应 §2.5 + §2.8#1 ∥ 超范围零触（`src/**` ∥ `public/**` ∥ `deploy/**` ∥ Dockerfile ∥ compose + 同族十三处）∥ 设计漂移零。
- **代码评审（advisor · code）round 1**：**changes-required**——🔴 1 = 门禁件数随正缺环（7 个既有门禁件硬断言 27 ≠ 现清单 28 ⇒ prepublishOnly 必红）；🟡 2 = §5 读数落档（本节闭合）∥ AC-8 回笔未落（主 agent 笔、在册待办）；🔵 3 = 批档 §2 行数文本（+3/≈179）与 §2.8（+2/178）并存（以 §2.8 为准；实读 178 闭合）∥ 设计档「拟新增」标记待回填轮 ∥ 批内件清理链（见决策 #4）。
- **🔴 处置（超声明事件 · 披露）**：本舱原拟随正该 7 件并两次上抛知会（计划披露 ∥ 更正知会）；**实际零写**——7 件由**父侧直笔**落正（12:06:43，20 处 = 断言值 27⇒28 + 注释/测试名/消息链同拍），父侧复跑该 7 件 = tests 57 · pass 57 · fail 0 · exit 0；父侧核对 = 截至 12:07:5x 该 7 件无本舱笔迹（本舱亦确认未落笔）。本舱静态复核 = 7 处断言 28 × 清单 28 一致 ∥ 7 件 `node --check` 过。父侧回执：认可「超声明的必需改动 = 允许 + 如实披露」判据（本条闭环）；设计侧补登记由父侧处理（勿由本舱开笔）。
- **fix round**：本舱 0 轮（🔴 盘面修正 = 父侧直笔，本舱零重叠）。
- **终态**：`clean`（唯一 🔴 已闭环；🟡/🔵 记录面项归父侧收口/回填轮）。

## §6 验证与收口（父代理）

**§6 验收与收口（2026-10-09 · 主 agent）**

**交付核验（父侧实读）**：三件逐处与设计最终形一致——`thincoder-server/bin/thincoder-server.mjs:12`（`realpathSync` import）∥ `:177`（注释载「为什么」）∥ `:178`（判据 = `pathToFileURL(realpathSync(process.argv[1]))`——净 +2 行，176 ⇒ 实读 **178**）∥ `thincoder-server/package.json:13` 清单实读 **28** 项（末项 = 本批件）∥ 批内件实读 **112** 行。红绿读数（交付报告在案）：T1/T2/T5 先红后绿、守卫无 skip——tests 6 · pass 6 · fail 0 · exit 0。

**门禁链随正（父侧直笔 · 机械计数 · 可 revert）**：七件断言 27 ⇒ 28（20 处：断言值 + 注释/测试名/消息链同拍——与 bin 批件入链同拍；随正落盘并入提交 `c1b1c486`）；复跑七件 = **tests 57 · pass 57 · fail 0 · exit 0**。

**AC-8 回笔（主 agent 笔）**：`docs/server/requirements/PROJECT.md:144` AC-8 判据行补「npm 全局装（POSIX 符号链接垫片）装后起服可跑」＋变更记录 `:266`（承载 = 批内件 T1/T2 ∥ 收口轮实机复验）。

**ECS 部署收尾三件（父侧真机）**：① 提交 `c1b1c486` 双远端推送（gitee ∥ github）→ 机上 `git pull`（HEAD c1b1c48）→ 镜像重建（新 ID `1809940e0307`）；② 撤 compose `entrypoint:` 覆盖（备份 = 机上 `/tmp/docker-compose.yml.bak-20261009`）——容器 COMMAND 恢复镜像自带 `/app/deploy/docker-…`；③ 重收敛验证读数：`converge: version=0.1.0 source=installed` → `ready host 0.0.0.0 port 8787 routes:33 version 0.1.0` ∥ `Up (healthy)` ∥ `/healthz` = `{"status":"ok","version":"0.1.0","uptime":8,"db":"ok"}` ∥ 入口链实证：`/home/node/.npm-global/bin/thincoder-server` = **符号链接形**（→ `../lib/node_modules/@thincoder/server/bin/thincoder-server.mjs`）——修复前静默退 0 的路径现真跑（AC-8 实机复验 ✓）。

**设计档回填轮（#10）**：四处「拟新增」翻正（`ops/OPS.md:241` ∥ `design/PROJECT.md:170`/`:216`/`:262`——批内件实读 112）+ 两档变更记录各 +1 行；`doc-check` EXIT 0。**「≈178 ⇒ 实读 178」收敛**（`design/PROJECT.md:169` ∥ `ops/OPS.md:209`——父侧直笔 · 机械计数）。

**套件行**：① 本批单元件 = `docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`（随批留存——无处置）；② 集成面 = ECS 真机重收敛（上③——部署即集成验证）；仓集成套件零增改。

**余项（另册）**：同族十三处同判据形 = 台账 **#1114**（条件触发）；「not repo-suite verified」项 = 七门禁件 57/57 已代跑，全链留发布轮。

**状态**：已收口（2026-10-09）。
