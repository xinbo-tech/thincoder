# 2026-10-10 · core-small-fixes
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-10 · 来源 = 用户 2026-10-10 03:49「不认自设条件——等条件的一起拿出来清理」+ 清账二遍 = 核/CLI 小修 8 条（#894 ∥ #929 ∥ #1067 ∥ #1068 ∥ #1082 ∥ #1087 ∥ #1114 ∥ #1135）。
> 台账 = #1067（core · 归批）。前情 = docs/batches/2026-10-10-ledger-full-triage.md（已收口 2026-10-10 · 清账二遍）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-10
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**状态行**：🔄 进行中（设计轮已发）

**直令**：用户 2026-10-10 03:49 清账二遍令——本批 = 核/CLI 小修面；授权 = 会话全自动沿用。

**条目（8）**：
- `#894`：旧批内件 `2026-09-30-defect-fixes-cli.test.mjs` 两行字面断言随词表演进失效——改写断言 ∥ 标失效。
- `#929`：`finishReason=null` 被静默当正常（`provider/sse.mjs:151` × `agent/run-stages.mjs:43`）——null 时注入提醒 ∥ 留痕。
- `#1067`：代理分支 gzip（`proxy.mjs:181` 不发 Accept-Encoding）——压缩响应解压阶段。
- `#1068`：`list-models.mjs:39/44` body 读错误吞详情——错误面细分。
- `#1082`：`config?.proxy != null` 未归一化直喂边——归一化收口。
- `#1087`：chunked 径背压不传播（`proxy-transport.mjs:103-104`）——pause/drain 与看门狗互动裁定。
- `#1114`：bin 入口判据同族 13 处（resolve() 变体 ∥ 未 realpath 化）——顺手清全套。
- `#1135`：`session-lifecycle.mjs:395` 槽命中无 `hasKey` 门——补门 ∥ docstring 注端差。

**边界**：`thincoder-core/**` + `thincoder-cli/scripts/**` + `scripts/**`（#1114 清单在册）；不触 `#1167` ∥ 他批落点。

**授权口径**：会话全自动（03:07「全自动」+ 03:49 清账二遍令）——设计 → 评审（用户点火）→ 批准 → 实施。

**边界随正（2026-10-10 · 父侧）**：`#1114` 口径 = **13 处全清**（原边界行只列 core/cli/scripts 系笔误——族清不得留 9 处异形）。射程 = 加 `thincoder-server/**` 3 处 ∥ bench 4 处 ∥ `thincoder-desktop/**` 2 处（坐标随设计轮列全）；与他批落点如重叠 ⇒ 文件级调度排队（机制消化，设计不缩）。实施按面拆派（核心面 ∥ 其余面分派）。

**父侧办结（2026-10-10）**：① `#929` 已核销（追认——设计轮复核零码改）✓；② 设计档落点（`PROXY.md` ∥ `SESSION.md` ∥ `CLI-ENTRY.md` §3 ∥ `PROVIDER.md` §16）= 实施后回填轮（bin 批先例）——随实施臂同拍；③ 坐标漂移（`materialize-deps.mjs:145` ∥ `PROXY.md` 内嵌 `config.mjs:261/:385`）随回填轮随正；④ 9 处他面落点 = 文件级调度排队（实施按面拆派）。

**父裁（2026-10-10 · 评审 #73 pass 回执）**：🟡4 ∥ 🔵4 逐条——F1 坐标收正 `docs/batches/2026-09-30-defect-fixes-cli.test.mjs:62`（wordList 行；`:95` 保持）∥ F2 #1087 暂停触发级明写（带 CE = 解压器 ∥ 无 CE = body；暂停点 `:104`）∥ F3 #1087 补停止门（body destroy/close ⇒ 被暂停源 resume+destroy——消悬挂口）∥ F4 跨面调度随 §5 落单 + §6 核 13 处 ∥ 🔵 F5..F8 维持/随实施。**实施派工 = eng-coder #84**（token 已签 · designId `09c470af…`）；产物回后进 §6 收口（机检 = §2.5 T-1..T-8）。

**父侧代办（2026-10-10 · #84 跨批门上抛回执）**：#894 两行字面在 `docs/batches/2026-09-30-defect-fixes-cli.test.mjs`（跨批件——子代理写门正确拒绝）⇒ **父侧直接补落**（可 revert）：`:62` wordList 项 `"migrate audit"` ⇒ `"migrate audit list"` ∥ `:95` fish 子命令行 `'migrate audit'` ⇒ `'migrate audit list'`；已回执 #84 复跑记数（预期 5/5）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（逐条落地表 8 条全覆（#929 = 已落地复核核销候；#1114 = 全 13 处·父侧 2026-10-10 裁）｜关键裁定 KD-1–KD-8｜上抛 6 项）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖）与需求锚
- 条目（8）= `#894` ∥ `#929` ∥ `#1067` ∥ `#1068` ∥ `#1082` ∥ `#1087` ∥ `#1114` ∥ `#1135`——来源 = §1 直令（用户 2026-10-10 03:49 清账二遍）+ 台账行（各条 evidence 在册）。
- 需求锚：本批无新立需求档条目——判据源 = 各台账行 evidence 句 ∥ `docs/core/requirements/AGENT-LOOP.md:298`（F-DA5——#929 面，已落）∥ `docs/core/design/SESSION.md` §6.24（#1135 面，已落）∥ 父侧本日回复（#1114 射程裁）。
- **边界随正（父侧 2026-10-10 回复 · 逐字裁）**：`#1114` 射程 = **全 13 处**（含 server 3 ∥ bench 4 ∥ desktop 2——原 §1 边界行只列 core/cli/scripts = 父侧笔误，§1 已追加「边界随正」；撞他批 = 文件级调度排队，机制消化）。其余 7 条零边界扩。

### 2.2 逐条落地表（动作 ∥ 目标 file:line（现读核实）∥ 期望 ∥ 机检法）

| # | 动作 | 目标 file:line | 期望 | 机检法 |
|---|---|---|---|---|
| #894 | 改写 2 处失效字面断言（现读红 = 本席实跑 3 pass / 2 fail） | `docs/batches/2026-09-30-defect-fixes-cli.test.mjs:63`（wordList 行 `"migrate audit"` ⇒ `"migrate audit list"`）∥ `:95`（fish 子命令行 `'migrate audit'` ⇒ `'migrate audit list'`） | 复跑 5/5 绿；`thincoder-cli/src/completions.mjs:27` ∥ `:138` **零改**（源档现形已是 `migrate audit list`——断言随源收正，非回改源） | 仓根 `node --test docs/batches/2026-09-30-defect-fixes-cli.test.mjs` ⇒ tests 5 · pass 5 · fail 0（红基线 = pass 3 · fail 2，在案） |
| #929 | **零码改**——复核 + 核销（已落地） | 证据 = `thincoder-core/agent/run-stages.mjs:28-30`（缺席提醒常量）∥ `:52-55`（缺席支 = 提醒注入 + `logEvent("ev:finish-missing", {…})`）；transport 归一 = `provider/anthropic.mjs:129` ∥ `provider/google.mjs:139` ∥ `provider/responses.mjs:84`；设计 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31.7；日志登记 = `docs/core/design/LOGGING.md:83` | 复核读数 = 码面在场且语义同 F-DA5（clean end ∧ 无 finishReason ⇒ 同面提醒恰一条 + 留痕恰一条；partial / interrupted 零触）；⇒ #929 判「已落地 ⇒ 核销」（落 = 批 `docs/batches/2026-10-05-digest-accounting.md`）；`provider/sse.mjs:151` 零动 | 复跑 `node --test docs/batches/2026-10-05-digest-accounting.test.mjs`（T-DA12 ∥ T-DA13）⇒ 绿 + 四坐标读回 |
| #1067 | 代理传输单点加 **content-encoding 解压阶段**（列册转实施） | `thincoder-core/proxy-transport.mjs:98-110`（TE 判定后接解压阶段——chunked ∥ 非 chunked 两径同点；解压器 = `node:zlib`：gzip ∥ x-gzip ⇒ `createGunzip` ∥ deflate ⇒ `createInflate` ∥ br ⇒ `createBrotliDecompress`） | 上游径自压缩（未请仍压缩）⇒ 消费面得明文（探针 JSON.parse 成功 ∥ SSE 事件可解）；`identity` ∥ 头缺席 ∥ 未知编码 ∥ 多 token 列表 ⇒ 透传零动；空体 + CE 在场 ⇒ 体正常结束（零解压误报——sawInput 门）；请求头零改（不发 `Accept-Encoding`） | 批内件腿（假 socket + 真 gzip 载荷 + `content-encoding: gzip` ⇒ `text()` = 原文）+ 回归复跑 `2026-10-08-proxy-chunked-frame.test.mjs` 16/16 |
| #1068 | body 读错误面细分（去吞） | `thincoder-core/provider/list-models.mjs:39`（`await response.text().catch(() => "")` ⇒ 去 `.catch`——读失败原错误直抛）；`:44` 文案零改 | 读失败（断流 ∥ idle 超时 ∥ 网络）⇒ 抛原始错误（根因可辨）；真非 JSON（HTML 等）⇒ 文案照旧 `GET /models failed: non-JSON response`；`:34` 非 2xx 径零动 | 批内件腿（stub `globalThis.fetch`：text() reject ⇒ 抛原文 ∥ text() = HTML ⇒ 原文案） |
| #1082 | `injectProxy` 判定归一化收口（单源 `normalizeProxy`） | `thincoder-core/proxy.mjs:20`（`config?.proxy != null ? resolveProxyConfig({ agent: { config } }).uri : null` ⇒ `normalizeProxy(config?.proxy)?.uri ?? null`）+ `:8` 邻增 `import { normalizeProxy } from "./config.mjs"`（零环——config 链零 proxy import，本席实核） | `""` ∥ 空对象 ∥ 非法型 ⇒ 零注入（`!= null` 过闸后的 env 回供理论口封死）；非空串 ∥ `{uri}` ∥ `{url}` 照旧注入；模型代理永不吃 env（D-PX4 判据加强） | 批内件腿（`{proxy: ""}` + `HTTPS_PROXY` 在案 ⇒ 零注入；`{proxy: {uri: ""}}` 同；正例回归）+ 复跑 `2026-10-08-proxy-per-channel.test.mjs` T2 |
| #1087 | chunked 径背压传播（pause/drain）+ 看门狗复位源加 drain（裁定 = 2.3 KD-1） | `thincoder-core/proxy-transport.mjs:100-105`（`body.write()` 返 false ⇒ 暂停上游源（chunked 径 = `sock`）；`body.on("drain")` ⇒ 恢复——旗守卫幂等）+ `:115` 邻增 `body.on("drain", armIdle)` | 背压下 socket 暂停（内存有界——不再无界堆 body）；排空 ⇒ 恢复（载荷零丢零断）；看门狗与非 chunked 径（`:109` pipe）对齐（复位源 = readable ∪ drain；消费停读 > bodyIdleMs ⇒ 照旧断流） | 批内件腿（帧序列 > 高水位：不读 ⇒ `sock.isPaused() === true`；读空 ⇒ 恢复 + 载荷逐字节等值）+ 复跑 chunked-frame 件 |
| #1114 | 13 处入口判据按 KD-SV-53 单源收正（realpath 形 + `realpathSync` import）——逐处 = 2.2.1；按面拆派 | 逐处见 2.2.1 表（13 行——坐标全为本席本刻实读） | 任一档经符号链接 / junction 调用 ⇒ 判据真（主入口执行，非静默）；真身 ∥ 导入语义非回归；不可解析 ⇒ 显式抛（KD-SV-53 同形；单源 = `docs/server/design/ops/OPS.md` §8） | 批内件腿（代表档 symlink 跑 ≡ 直跑：stdout ∥ 退码同形；红基线 = 现码零输出）+ 13 处源面字面锁（`realpathSync(process.argv[1])` ×13 ∥ `pathToFileURL(process.argv[1])` 未解析变体零残留） |
| #1135 | `sessionReading` 槽命中补 `hasKey` 门（实现回归设计面——裁定 = 2.3 KD-3） | `thincoder-core/session-lifecycle.mjs:395`（find 谓词加 `&& hasKey(pr)`）+ `:23` import 并入 `hasKey`；`thincoder-core/model-ref.mjs:80`（`function hasKey` ⇒ `export function hasKey`——判据单源） | 槽渠道在册无 key ⇒ 走 `fallback`（= `docs/core/design/SESSION.md` §6.24 判据句 2 ∥ 边界情形 ② 已载形）；持 key 径零变；`:379` docstring 零改（补门后「同源同式」成立） | 批内件腿（无 key ⇒ fallback 读数；持 key 三态回归）+ 复跑 `2026-10-09-provider-default-model-purge-core.test.mjs:339-356` |

#### 2.2.1 #1114 十三处（面 ∥ file:line（现读）∥ 现形 ⇒ 目标形）

| 面 | file:line | 现形 ⇒ 目标形 |
|---|---|---|
| core/scripts（4） | `scripts/api-contract.mjs:129` | 未 realpath（`pathToFileURL(process.argv[1])`）⇒ `if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) process.exit(main());` |
| 同上 | `scripts/dev-link.mjs:171` | resolve() 变体 ⇒ `const isMain = process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url` |
| 同上 | `scripts/doc-check.mjs:123` | 同 resolve() 变体 ⇒ 同目标形 |
| 同上 | `thincoder-cli/scripts/doc-impact.mjs:144` | 同 resolve() 变体 ⇒ 同目标形 |
| server（3） | `thincoder-server/deploy/backup.mjs:84` | 未 realpath ⇒ inline 目标形（同 `scripts/api-contract.mjs` 行，按该档语句形落） |
| 同上 | `thincoder-server/deploy/converge.mjs:194` | 同 |
| 同上 | `thincoder-server/src/ops/cli.mjs:216` | 同 |
| bench（4） | `bench/preflight.mjs:115` | 同 |
| 同上 | `bench/probe.mjs:307` | 同 |
| 同上 | `bench/run.mjs:304` | 同 |
| 同上 | `bench/toolcall.mjs:259` | 同 |
| desktop（2） | `thincoder-desktop/scripts/make-icon.mjs:170` | resolve() 变体 ⇒ isMain 目标形 |
| 同上 | `thincoder-desktop/scripts/materialize-deps.mjs:145` | resolve() 变体 ⇒ isMain 目标形（台账载 `:142`——漂移 +3，按现读 `:145` 落） |

- 参考实现（在盘 · 已修形）= `thincoder-server/bin/thincoder-server.mjs:181-182`（注释 + `realpathSync(process.argv[1])` 判据）；`realpathSync` import 并入各档既有 `node:fs` 行（无则该档 +1 行）；既有 `resolve` import 不主动清理（零附带改动）。
- 第三变体声明：`thincoder-desktop/tools/web-quickcheck/serve.mjs:139-140`（`realpathSync.native` 形）**不在 13 处清单**——本批零触（边界 = 2.8）。

### 2.3 关键裁定（含被否候选）

**KD-1（#1087 背压方案）**：chunked 径补 **pause/drain 传播**（`body.write()` 返 false ⇒ 暂停上游源；`body.on("drain")` ⇒ 恢复），看门狗**复位源扩 `drain`**（readable ∪ drain），不引入暂停态特判。
- 理由：与非 chunked 径（`proxy-transport.mjs:109` `sock.pipe(body)`——pipe 自带 pause/drain）同语义对齐；`drain` = 消费进度信号（防「背压暂停期无数据到达 ⇒ 看门狗把慢而健康的消费者误杀」——本条原始顾虑）；消费方永停摆 ⇒ 照旧 bodyIdleMs 断流（不新增悬挂口；pipe 径同判）。
- 被否：① Transform 管线重写（`sock.pipe(decoder).pipe(body)`——动 `proxy-chunked.mjs` 已测单点，面大）② 暂停期停表（清/重启 idleTimer——消费永停摆时无杀口 + 与 pipe 径语义分叉）③ 不处置（大 chunked 响应内存无界）。

**KD-2（#894 处置形）= 改写断言（非标失效）**：仅 2 处字面随词表滞（其余 3 例绿——锁面仍有值）；源档 `thincoder-cli/src/completions.mjs:27/:138` 现状 = `migrate audit list`（`ledger list` 变体 = 真功能，`#886/#887` 轮入）⇒ 断言随源收正。
- 被否：标失效（整件 5 例锁面退场——且「标失效」在本仓无既有载体形）∥ 源档回改（删真功能——倒因为果）。

**KD-3（#1135 处置形）= 补门（非 docstring 注记）**：设计档 `docs/core/design/SESSION.md` §6.24 判据句 2 已载「槽 `activeProvider` 在册**且持 key** ⇒ `{ ...entry, model }`；未命中（不在册 ∥ 无 key）⇒ `fallback`」+ 边界情形 ②（2026-10-03 修正轮入档）——现码 `session-lifecycle.mjs:395` 缺门 = **实现与设计相抵**；本修 = 实现回归设计面（doc-first），非新语义；补门后 `:379` docstring「同源同式」句即成立。
- 被否：docstring 注端差（会把「实现与设计相抵」降写成「可接受端差」——不允许）。

**KD-4（#1067 处置形）= 同单点加解压阶段**（列册转实施——清账口径：挂账即清；形态 = 上游批 `2026-10-08-proxy-chunked-frame.md` §2.8 P2 已载「同单点加解压阶段」）。解压顺序 = TE 剥帧后接 CE 解压；错误面 = 解压失败 ⇒ body 以明错误终止（非透传——部分解码已发生，无「原字节」可回退）；未知/多层编码 ⇒ 透传（不宣称支持）。
- 被否：① 发 `Accept-Encoding` 协商（请求面语义改 + 范围扩——协商面本批不做）② 逐消费点自防（漏面——D-PX11 已否决同族）③ 不处置（= 本批开批之由被架空）。

**KD-5（#1068 形）= 去吞（原错误直抛）+ 解析文案零改**。
- 被否：① 文案拼接根因（会串进 `list-models.mjs:112-115` `channelUnavailableMessage` 用户面）② `cause` 包装（多余层——直抛已携根因）。

**KD-6（#1082 形）= `normalizeProxy` 单点**（与 loadConfig `config.mjs:385` 同源函数——判据单源）。
- 被否：① 改 `resolveProxyConfig` 本体（其 env 回落 = web 面设计行为——`resolveWebProxy` 共享，改则伤 web）② 仅注记（`!= null` 过闸后的 env 回供理论口不封）。

**KD-7（#929 形）= 零码改（已落地 ⇒ 复核 + 核销）**。
- 被否：重做一条（重复实施 = 造第二判据）。

**KD-8（#1114 形）= 全 13 处同一目标形（KD-SV-53 单源），按面拆派**。
- 依据 = 父侧 2026-10-10 回复逐字裁（同族一字留异形 = 残迹源，不许留）。被否：仅边界内 4 处。

### 2.4 受影响文件与测试面

产品 / 工具码（行数 = 本席本刻实读；增量 = 估）：

| 文件 | 现读 | 增量 | 面 |
|---|---|---|---|
| `docs/batches/2026-09-30-defect-fixes-cli.test.mjs` | 98 | ±0（2 行字面收正） | #894 |
| `thincoder-core/proxy-transport.mjs` | 245 | ≈ +30（解压阶段 + 背压 + 注释） | #1067 + #1087 |
| `thincoder-core/provider/list-models.mjs` | 166 | ±0（去 `.catch`——行内） | #1068 |
| `thincoder-core/proxy.mjs` | 50 | ≈ +2（import + 判定行） | #1082 |
| `thincoder-core/session-lifecycle.mjs` | 403 | ≈ +1（谓词行内改 + import 并入） | #1135 |
| `thincoder-core/model-ref.mjs` | 162 | ±0（`export` 关键字） | #1135 |
| `scripts/api-contract.mjs` | 129 | +1~2 | #1114 |
| `scripts/dev-link.mjs` | 172 | +1~2 | #1114 |
| `scripts/doc-check.mjs` | 124 | +1~2 | #1114 |
| `thincoder-cli/scripts/doc-impact.mjs` | 145 | +1~2 | #1114 |
| `thincoder-server/deploy/backup.mjs` | 86 | +1~2 | #1114 |
| `thincoder-server/deploy/converge.mjs` | 197 | +1~2 | #1114 |
| `thincoder-server/src/ops/cli.mjs` | 218 | +1~2 | #1114 |
| `bench/preflight.mjs` | 120 | +1~2 | #1114 |
| `bench/probe.mjs` | 309 | +1~2 | #1114 |
| `bench/run.mjs` | 309 | +1~2 | #1114 |
| `bench/toolcall.mjs` | 261 | +1~2 | #1114 |
| `thincoder-desktop/scripts/make-icon.mjs` | 171 | +1~2 | #1114 |
| `thincoder-desktop/scripts/materialize-deps.mjs` | 146 | +1~2 | #1114 |

- 全档 ≤ 500 硬线（超者 = `bench/probe.mjs` ∥ `bench/run.mjs` @309——增量 +2 不触阈值；零拆档）。
- 测试面（批内件新建——随批留存、不入仓套件）：`docs/batches/2026-10-10-core-small-fixes.test.mjs`（估 ≈180–220 行；腿表 = 2.2 机检法列）。
- 回归复跑（实施轮实跑——实现者跑）：`2026-09-30-defect-fixes-cli.test.mjs`（5/5）∥ `2026-10-08-proxy-chunked-frame.test.mjs`（16/16）∥ `2026-10-08-proxy-per-channel.test.mjs`（T1/T2）∥ `2026-10-05-digest-accounting.test.mjs`（T-DA12/13）∥ `2026-10-09-provider-default-model-purge-core.test.mjs`（:339-356）。
- 仓套件 = 父侧收口唯一跑点（not repo-suite verified 口径沿例）。

### 2.5 验收对照（判据 → 载体）

| # | 判据（机器可核） | 载体 |
|---|---|---|
| 1 | #894：复跑 5/5 绿（红基线 = 3 pass / 2 fail 在案） | 旧件复跑 |
| 2 | #929：缺信号两腿绿（clean end 无 finishReason ⇒ 提醒恰一 + 留痕恰一；partial 零触） | digest-accounting 件 |
| 3 | #1067：gzip 载荷 ⇒ 明文；identity/未知编码/多 token ⇒ 透传；空体零误报；请求头零改 | 批内件腿 |
| 4 | #1068：读失败 ⇒ 原错误直抛；真非 JSON ⇒ 原文案 | 批内件腿 |
| 5 | #1082：空串 ∥ 空对象 ⇒ 零注入（env 在案亦然）；正例注入零变 | 批内件腿 + per-channel T2 |
| 6 | #1087：背压暂停（`isPaused` 真）∥ 排空恢复 ∥ 载荷逐字节等值 | 批内件腿 |
| 7 | #1114：代表档 symlink 跑 ≡ 直跑（stdout ∥ 退码）+ 13 处字面锁 ×13 命中 ∥ 未解析变体零残留 | 批内件腿 |
| 8 | #1135：无 key ⇒ fallback 读数；持 key 三态零变 | 批内件腿 + purge-core 复跑 |

### 2.6 设计档落点（列点——**本席本批零写**（spawn 口径：只写 §2）；待父侧安排，建议沿 bin 批先例 = 实施后设计面回填轮）

- `docs/core/design/PROXY.md`：§2（传输实现——解压阶段句 ∥ 背压句）· §7（D-PX11 尾注收正（`content-encoding` 列册 ⇒ 已处置）+ 新增 D-PX12（解压单点）∥ D-PX13（背压/看门狗））· §1（`injectProxy` 归一化判定句——`normalizeProxy` 单源）· §6.1 坐标行 · 变更记录。
- `docs/core/design/SESSION.md`：§6.24（补门后「同源同式」实读成立——as-of 行）· 变更记录。
- `docs/cli/design/CLI-ENTRY.md` §3：发射锁面（#894 批内件断言随词表收正——实施轮核 §3 是否需 as-of 注）。
- `docs/core/design/PROVIDER.md`：§16（list-models 错误面口径句——实施轮对读；若载 non-JSON 文案口径则随动）。
- `docs/core/design/LOGGING.md`：零改（`ev:finish-missing` 行已在 `:83`）。
- `docs/server/design/ops/OPS.md`：零改（KD-SV-53 判据行 = #1114 目标形单源——引用不复制）。

### 2.7 上抛项

1. **[已裁 · 知会]** #1114 = 13 处全清（父侧 2026-10-10 回复裁；§1 已补「边界随正」）——2.2.1 表按全 13 处落，实施按面拆派。
2. **[待父侧 · 台账面]** #929 已落地（证据 = 2.2 行）⇒ 本批动作 = 复核 + 核销；本批 8 行台账的核销/收口（`#894` ∥ `#929` ∥ `#1067` ∥ `#1068` ∥ `#1082` ∥ `#1087` ∥ `#1114` ∥ `#1135`）在主 agent 笔。
3. **[待父侧 · 文档面]** 2.6 设计档落点零写（spawn「只写 §2」口径）——需父侧安排落点（回填轮 ∥ 实施轮随动）。
4. **[报备]** 9 处落点在他面（server 3 ∥ bench 4 ∥ desktop 2）——同窗三面批在途；按父侧「文件级调度排队」口径消化。
5. **[报备 · 坐标漂移]** 台账 #1114 载 `thincoder-desktop/scripts/materialize-deps.mjs:142`，现读 = `:145`（+3）——实施按现读落，台账随收口随正。
6. **[报备 · 越批发现]** `docs/core/design/PROXY.md:20` ∥ `:115` 载 `config.mjs:259`（`normalizeProxy`）∥ `:384`（调用点）——本席现读 = `:261` / `:385`（漂移 +2）；无行为影响，建议随 2.6 回填轮随正。

### 2.8 边界与零触

- **不做**：`Accept-Encoding` 协商 ∥ 多层 content-encoding ∥ deflate-raw 变体 ∥ Transform 管线重写 ∥ keep-alive / HTTP2 复用 ∥ 响应头改写 ∥ `thincoder-desktop/tools/web-quickcheck/serve.mjs:139-140`（第三变体 `realpathSync.native` 形——不在 13 处清单）∥ `#1167` 面（`model-specs.mjs`——他批在途）∥ 既有超 300 行档的拆档（`bench/probe.mjs` ∥ `bench/run.mjs` @309——增量 +2 不触阈值）。
- **零触确认**：本席本批写面唯 §2（batch 工具 append，两次）——仓内其余文件零笔迹；`git status` 现载 M / untracked 族 = 进场前既有在途批笔迹（本席未新建 / 未修改任何文件）。探读命令皆只读（`node --test` 旧件 = 沙箱 HOME 临时域写入——仓内零写）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/batches/2026-10-10-core-small-fixes.md` §2（对象状态：待评审）· 评审类型：设计评审（只审 §2；仓内码面只作坐标/行数/机制对盘取证，零读 git diff）

**取证与对盘（通过项）**：#1114 十三处坐标 **13/13 命中**（`scripts/api-contract.mjs:129` ∥ `scripts/dev-link.mjs:171` ∥ `scripts/doc-check.mjs:123` ∥ `thincoder-cli/scripts/doc-impact.mjs:144` ∥ `thincoder-server/deploy/backup.mjs:84` ∥ `thincoder-server/deploy/converge.mjs:194` ∥ `thincoder-server/src/ops/cli.mjs:216` ∥ `bench/preflight.mjs:115` ∥ `bench/probe.mjs:307` ∥ `bench/run.mjs:304` ∥ `bench/toolcall.mjs:259` ∥ `thincoder-desktop/scripts/make-icon.mjs:170` ∥ `thincoder-desktop/scripts/materialize-deps.mjs:145`）+ 参考实现在盘（`thincoder-server/bin/thincoder-server.mjs:181-182`）+ 第三变体非在册（`thincoder-desktop/tools/web-quickcheck/serve.mjs:139-140` `realpathSync.native` 形）∥ #894 字面在 `:62`/`:95` 与源档 `completions.mjs:27`/`:138` 现状（均 `migrate audit list`）相抵（KD-2 判向正确）∥ #929 零码改成立（`agent/run-stages.mjs:28-30` ∥ `:52-55`）+ 需求锚 `docs/core/requirements/AGENT-LOOP.md:298`（F-DA5 逐字）∥ #1067 目标点 `proxy-transport.mjs:98-110` ∥ #1068 `:39`/`:44`/`:34` ∥ #1082 `proxy.mjs:20` + `normalizeProxy`（`config.mjs:261`/调用点 `:385`）+ 零环成立（config 链零 proxy import）+ 现状 env 回供口实存（`resolveProxyConfig` 的 `!cfgProxy` 落 env）∥ #1087 `:100-105`/`:109`/`:115` 命中 ∥ #1135 与 `docs/core/design/SESSION.md:882`（「在册**且持 key**」）+ `:890-891`（边界情形 ②）+ `:1307`（2026-10-03 修正轮）逐字相符 ⇒ KD-3「实现回归设计面」成立 ∥ 行数抽验 9/19 精确命中（98 ∥ 245 ∥ 166 ∥ 50 ∥ 403 ∥ 129 ∥ 309 ∥ 218 ∥ 162）· 全档 ≤309 ⇒ 无拆分义务 ∥ 回归件全在盘（chunked-frame 16 test ∥ per-channel T2 与 #1082 改后语义相容 ∥ digest-accounting ∥ purge-core）∥ D-PX12/D-PX13 号位未占用 ∥ PROXY.md:20/:115 载 `config.mjs:259`/`:384` 漂移为真 · 上游载体 `2026-10-08-proxy-chunked-frame.md:144` P2 为真

**限制**：无项目标准档（方法学按 AGENTS.md 判）· 无文档地图（ownership 判据降级，按 PROXY.md/SESSION.md/CLI-ENTRY/PROVIDER 实档判）· 台账档不在射程（各条 evidence 句未核）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity | 🟡 | #894 目标坐标漂移 1 行：`docs/batches/2026-10-10-core-small-fixes.md:44` 载 `docs/batches/2026-09-30-defect-fixes-cli.test.mjs:63`（wordList 行 `"migrate audit"`），现读该字面在 `docs/batches/2026-09-30-defect-fixes-cli.test.mjs:62`；`:63` = `"--dry-run --confirm --from",`（另一坐标 `:95` 命中） | 坐标收正为 `:62`（或以内容标识为准）；`:95` 保持 |
| 2 | Clarity | 🟡 | #1087 目标块归属不准：设计把 `body.write()` 写在 `thincoder-core/proxy-transport.mjs:100-105`，实际写点在 `writeBody`（`thincoder-core/proxy-transport.mjs:68-70`，写调用 = `:69`）；且 #1067 解压阶段插入后（chunked + CE 径 = 解码器 → 解压器 → body），哪一级 `write()` 返 false 驱动 `sock.pause()` 未定（暂停点在 `thincoder-core/proxy-transport.mjs:104`） | 明写暂停触发级 = body 前最后一级可写流（带 CE = 解压器 ∥ 无 CE = body），暂停点 = `:104` 推送臂 |
| 3 | Feasibility | 🟡 | KD-1 尾句（`docs/batches/2026-10-10-core-small-fixes.md:77`「消费方永停摆 ⇒ 照旧 bodyIdleMs 断流（不新增悬挂口；pipe 径同判）」）缺机制载体：看门狗终止只经 `destroyBody`（`thincoder-core/stream-destroy.mjs:33-40`——只 destroy body），被暂停源 socket 的恢复/销毁无载；pipe 径「同判」为断言（本席未实跑验证，标 unverified） | 明确补门：body destroy/close 时对暂停源 resume + destroy（或标「已核/未核」端差），使该句可审 |
| 4 | Coordination | 🟡 | #1114 射程跨 4 面（server 3 ∥ bench 4 ∥ desktop 2 在他面，`docs/batches/2026-10-10-core-small-fixes.md:159`）+ 设计自载「按面拆派」（`:50`），同窗他批在途 ⇒ 文件级调度与本批节奏耦合（R5 协调项，非缺陷） | 实施面调度落单于 §5 + §6 收口核 13 处命中；与他批重叠文件按文件级排队显式记录 |
| 5 | Acceptance | 🔵 | 2.5 验收表两处缺口：① 错误径未入表——#1067「解压失败 ⇒ body 以明错误终止」（`:86`）∥ #1114「不可解析 ⇒ 显式抛」（`:50`）在 2.2/KD 载而 `:138`/`:142` 无腿；② 新腿未标红基线（仅 #894「3 pass / 2 fail」∥ #1114「现码零输出」标了），腿的判别力不可审 | ① 补两腿（#1114 可指既有族件 `docs/batches/2026-10-09-server-bin-guard-fix.test.mjs`）；② 逐腿记改前读数 |
| 6 | Document ownership | 🔵 | 2.6（`:145`）本批零写、落点全推回填轮（PROXY.md §1/§2/§7/§6.1 ∥ SESSION.md §6.24 ∥ CLI-ENTRY.md §3 ∥ PROVIDER.md §16）——与 AGENTS.md「Discussion → docs … immediately」有时序差（父侧已办结 · bin 批 ∥ `PROXY.md:208` 先例）；漂移随正项（`docs/core/design/PROXY.md:20` ∥ `:115` ⇒ `config.mjs:261`/`:385`；`materialize-deps.mjs:142` ⇒ `:145`）经本席对盘为真 | 回填轮入收口验收物（含两处漂移随正），使设计面不落后于码面 |
| 7 | Clarity | 🔵 | KD-4 引上游载体与上游原句不同位：上游 `docs/batches/2026-10-08-proxy-chunked-frame.md:144` 载「（`proxy-chunked.mjs` 同单点追加阶段）」，本设计把解压单点落 `thincoder-core/proxy-transport.mjs:98-110`（覆盖两径）——机制不冲突，两处记载读作分叉 | 回填轮 D-PX12 明写单点 = `proxy-transport.mjs` TE 剥帧后（chunked ∥ 非 chunked 两径）替上游句 |
| 8 | Clarity | 🔵 | 2.4 尺度句自相矛盾（`:127`「全档 ≤ 500 硬线（超者 = `bench/probe.mjs` ∥ `bench/run.mjs` @309…」）——309 行未超 500 | 改「最大档 = …@309」，并注「≤500 ⇒ 免拆档」 |

**计数**：🔴 0 · 🟡 4 · 🔵 4

**VERDICT: pass**

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
**状态行**：实施完成（8 条交付 + 设计档 4 档回填 + 审计/评审轮次与终态已录（见 5.6））



**批次**：2026-10-10 core-small-fixes（8 条 = #894 ∥ #929 ∥ #1067 ∥ #1068 ∥ #1082 ∥ #1087 ∥ #1114 ∥ #1135）；仓根 = `d:\teamcode\thincoder`；实施窗 = 2026-10-10 本会话。

### 5.1 逐条交付（坐标 = 实施后现读）

| # | 结论 | 落点 | 机检读数（实跑） |
|---|---|---|---|
| #894 | ✅ 落（写手 = 父侧） | `docs/batches/2026-09-30-defect-fixes-cli.test.mjs:62`（wordList 项 ⇒ `"migrate audit list"`）∥ `:95`（fish 子命令行同形）——**父侧笔**（见 5.4 跨批门） | 该件复跑 **5/5 绿**（红基线 3 pass / 2 fail 在案） |
| #929 | ✅ 核销（零码改复核） | 六坐标读回全中：`thincoder-core/agent/run-stages.mjs`（缺席提醒常量 + `logEvent("ev:finish-missing"` + 缺席支判据）∥ `provider/anthropic.mjs` ∥ `provider/google.mjs` ∥ `provider/responses.mjs`（归一三处）∥ `provider/sse.mjs` 零触 | digest-accounting 复跑 **14/14 绿** |
| #1067 | ✅ 落 | `thincoder-core/proxy-transport.mjs:128-139`（TE 剥帧后接解压阶段；chunked ∥ 非 chunked 两径同点；gzip ∥ x-gzip ⇒ gunzip ∥ deflate ⇒ inflate ∥ br ⇒ brotli） | 批内件 L3a–L3f **6 腿全绿**（四编码解码 ∥ identity/头缺席/未知/多 token 透传 ∥ 空体+CE 零误报 ∥ 截断 ⇒ 明错误 ∥ 请求头零 `Accept-Encoding`）+ chunked-frame 复跑 **16/16 绿** |
| #1068 | ✅ 落 | `thincoder-core/provider/list-models.mjs:40`（去 `.catch(() => "")` ⇒ 读失败原错直抛；真非 JSON 原文案零改）；`:24-25` docstring 同拍 | 批内件 L4 **两断全中** |
| #1082 | ✅ 落 | `thincoder-core/proxy.mjs:7`（`import { normalizeProxy } from "./config.mjs"`——零环实核）∥ `:22-27`（判定式 ⇒ `normalizeProxy(config?.proxy)?.uri ?? null`） | 批内件 L5（**非法/空形 7 态零注入** + 正例 3 形 + env 回流零注入）+ per-channel **T2 绿** |
| #1087 | ✅ 落 | `thincoder-core/proxy-transport.mjs:90-98`（`pushDownstream`：写门后 `write()===false` ⇒ 停上游；暂停级 = body 前最后一级可写流）∥ `:144`/`:149`（推送臂）∥ `:161`（看门狗复位源扩 drain）∥ `:164-165`（恢复信号 = sink ∥ body drain）∥ `:170-173`（停止门 = resume + destroy） | 批内件 L6a/L6b/L6c **三腿全绿**（不读 ⇒ `isPaused()` 真 ∥ 读空 ⇒ 恢复 + 载荷逐字节等值 ∥ CE 链同判 ∥ 停止门源销毁）+ chunked-frame 复跑 **16/16 绿** |
| #1114 | ✅ 落（**13/13 处**，无缩面） | 13 档判据 ⇒ `pathToFileURL(realpathSync(process.argv[1]))`（清单 = §2.2 表逐档；`node:fs` import 同步补 `realpathSync`） | 批内件 L7a（**13/13 字面锁** ∥ 未解析变体 0 残留）∥ L7b（代表档 symlink ≡ 直跑：status ∥ stdout ∥ stderr 三同形）∥ L7c（不可解析 ⇒ 显式 ENOENT 抛——非静默退 0） |
| #1135 | ✅ 落 | `thincoder-core/model-ref.mjs:80`（`hasKey` ⇒ `export function`——判据单源）∥ `thincoder-core/session-lifecycle.mjs:23`（import 并入）∥ `:395`（find 谓词加 `&& hasKey(pr)`） | 批内件 L8（**无 key ⇒ fallback 读数**；持 key 三态零变）+ purge-core 复跑 **17/17 绿** |

批内件 = `docs/batches/2026-10-10-core-small-fixes.test.mjs`（新；17 腿；跑法 `node --test docs/batches/2026-10-10-core-small-fixes.test.mjs`）——**17/17 绿**（≈2.3s）。

### 5.2 回归复跑读数（设计 §2.2 逐件；本表 = 实跑）

| 件 | 读数 |
|---|---|
| `2026-09-30-defect-fixes-cli.test.mjs` | **5/5 绿** |
| `2026-10-08-proxy-chunked-frame.test.mjs` | **16/16 绿** |
| `2026-10-08-proxy-per-channel.test.mjs` | T1 ∥ T2 ∥ T3 ∥ W1 ∥ T5–T8 **全绿**；**T4 ✖ ∥ W2 ✖**——两条本批无关（5.4 有据） |
| `2026-10-05-digest-accounting.test.mjs` | **14/14 绿** |
| `2026-10-09-provider-default-model-purge-core.test.mjs` | **17/17 绿** |
| `2026-10-03-crash-guards.test.mjs`（代理族回归） | **10 pass / 1 skip（POSIX 腿，本机 win32）/ 0 fail** |
| `scripts/doc-check.mjs`（仓自门） | 行宽 **OK**（源域全 .md 无 >300 字符行）；锚面悬空 **3**（皆 `docs/server/design/metering/METERING.md`——他面，5.4） |
| `scripts/api-contract.mjs --check` | DRIFT（生成区 ≠ 源：盘 3338 行 ∥ 生成 3346 行；缺 102 行条目）——既存系统性漂移（含本批 `hasKey` 1 行），`--check` 自标「报告态 · 不入闸」；本批不写（5.4） |

### 5.3 决策透明表

| 决策点 | 弃 | 取 + 依据 |
|---|---|---|
| #1067 解压落法 | 逐消费点自防 ∥ 发 `Accept-Encoding` 协商 ∥ 重写 Transform 管线 | 解压器作 `sink` ⇒ `sink.pipe(body)`——与既有 chunked 解码器同构（函数式改写、body 本体零替换）；解压器可写侧天然可作 #1087 暂停级 |
| #1067 空体 + CE | 一律建解压器 | **sawInput 门**（见过正文字节才建）：空 gunzip 结束抛 `unexpected end of file` ⇒ 一律建会把「空体 + CE」误报成解压失败（实测） |
| #1087 暂停级 | 只看 body | **body 前最后一级可写流**（带 CE = 解压器）：只看 body 则解压器自身缓冲无界涨（内存有界不闭合）；恢复信号随之取 `sink['drain']` |
| #1087 看门狗 × 暂停 | 暂停期停表 | **复位源扩 `drain`**（readable ∪ drain）：停表会让「消费方永停摆」失杀口；drain = 消费进度（不新增悬挂口） |
| #1087 停止门 | 不处置（body 亡即止） | body 终止 ∧ 上游仍在暂停态 ⇒ `resume()` + `destroy()` 源（评审 F3 悬挂口）：仅该组合触发，其余路径零改 |
| #1082 归一化 | 就地判空串 | **复用 `normalizeProxy`**（单源；config 链零 proxy import 零环实核）：非空串 ∥ `{uri}` ∥ `{url}` 语义随单源零改 |
| #1135 key 判据 | session-lifecycle 内联 | `model-ref.hasKey` **转 export**（+1 字面；§6.24「同源同式」） |
| #894 跨批写 | 绕门（shell 直写） | 上抛请裁——门属机制，不绕；父裁 = 父侧补落 |
| API-CONTRACT 生成区 | `--write` 重生成 | 不写：不在 §2 文件清单；`--check` 自标报告态；漂移主体 = 他批既存（102 行缺，非本批引入） |

### 5.4 披露 / 上抛项

- `[上抛·知会]` **#894 写手 = 父侧**：本席写该件被系统跨批门拒（2026-09-30 批件，本执行者绑 2026-10-10 批）⇒ 上抛 `ask`；父裁「父侧直接补落」并已落；本席复跑 5/5 绿取证。
- `[上抛·知会]` **per-channel T4 ✖（非本批面）**：`thincoder-vscode/src/extension/presets.mjs` 工作区在改（mtime 2026-10-10 4:23:50；diff = `storeProviderKey` 三态回执 `#1073`）——T4 报 `provider "vsc-p" not in providers list`（读到**真** `~/.thincoder/config.json`，`_setConfigPathForTest` 面失效）。本批零触 VSC。
- `[上抛·知会]` **per-channel W2 ✖（既存陈旧断言）**：向导已不写 `providers[].model`（`thincoder-cli/src/tui/wizard.mjs:196-197` 载 2026-10-09 清除批「渠道条目零 `model`」），W2 仍断 `c.provider.model === "m-tui"` ⇒ 断言随清除批失效。设计对本批只要求 T1/T2（皆绿）。
- `[上抛·知会]` **doc-check 3 条闸态悬空（非本批）**：`docs/server/design/metering/METERING.md:76` ∥ `:170`（`src/metering/report.mjs:48-56` ×2 ∥ `metering/routes.mjs`）——他面路径/坐标悬空。
- `[上抛·知会]` **api-contract 漂移（报告态）**：生成区 ≠ 源（盘 3338 ∥ 生成 3346 行；缺 102 行条目，含本批 `hasKey` 1 行）——主体他批既存；建议**归批重生成**（`--write`），本批不写。
- `[上抛·知会]` **PACKAGING.md:340 行数漂移（报告态）**：`materialize-deps.mjs` 表 143 ⇒ 实读 146——`+3` 出自他面未提交改动（本席 diff = 2 行改写、零行增：import 收正 + 判据收正）。
- `[上抛·知会]` **测试件内嵌 `node --test` 的静默假绿陷阱（实测）**：测试件内 `spawnSync(node --test …)` 继承 `NODE_TEST_CONTEXT` ⇒ 子进程「`recursively … skipping running files`」——**exit 0 + 零输出**。本批内件已剥该变量（`testEnv()`）并断 summary 在场；**既存他批件疑同病**（`2026-10-08-proxy-chunked-frame.test.mjs` C15 只断 exit 0 ⇒ 恒真），建议归批排查。
- **出清单改动（透明披露）**：① `docs/batches/2026-10-10-core-small-fixes.test.mjs`（新——本批批内件，设计 §2.4 载明）；② 设计档回填 4 档（§2.6 指派：`PROXY.md` ∥ `SESSION.md` ∥ `CLI-ENTRY.md` ∥ `PROVIDER.md`）；③ 无其他越清单写入。

### 5.5 设计档回填（§2.6 · 实施后同拍）

- `docs/core/design/PROXY.md`：§1 归一化坐标收正（`config.mjs:261`/`:385`）+ `injectProxy` 判定同源句（#1082）；§2 新增**内容编码解压阶段**（#1067）+ **chunked 径背压传播 + 停止门**（#1087）+ 同因坐标扫正（`tunnelHttps :219` ∥ 移交 `:258` ∥ `tcpConnectProxy :269` ∥ 坏串报错 `:228/:276` ∥ 分块条汇流 `:258/:52` ∥ `sock` 级错误 `:194-197` ∥ body 条 `:50` ∥ `:153`）+ 三档行数按盘（54 ∥ 298 ∥ 53）；§3 TLS 条（`:253` ∥ 注释 `:213-214`/`:252`）；§6.1 坐标行按盘重锚 + 新增 #1067 ∥ #1087 两行；§7 **D-PX11 尾注收正**（列册 ⇒ 已处置）+ **D-PX12 / D-PX13**（回应评审发现 #7：D-PX12 明写单点 = `proxy-transport.mjs` TE 剥帧后）。
- `docs/core/design/SESSION.md`：§6.24 判据句 2 补实现坐标注（`session-lifecycle.mjs:395`）。
- `docs/cli/design/CLI-ENTRY.md`：§3 横深对齐条补 as-of（三套 `migrate audit list`；MS-2 锁面随词表收正）。
- `docs/core/design/PROVIDER.md`：§6.16 M1 补错误面句（#1068）。
- 四档变更记录各一条（均含 as-of 日期与批名）。

### 5.6 审计与代码评审轮次与终态

（下一块补：内部 explore 分歧审计 + advisor 代码评审的轮次 / 发现 / 修复 / 终态。）

### 5.6 审计与代码评审轮次与终态

**轮次表**

| 轮 | 类型 | 闸后结论 | 发现（按级） |
|---|---|---|---|
| 1 | 内部 explore 分歧审计（只读；四类 = ①验收未落半 ②静默简化 ③文档漂移 ④越面改动） | **CLEAN**（四类零分歧） | 🔴 0 ∥ 🟡 0 ∥ 🔵 0 |
| 1 | advisor 代码评审（独立；19 档 + 4 设计档 + 批档） | **pass** | 🔴 0 ∥ 🟡 1（非阻塞协调项）∥ 🔵 4（建议项） |

审计证据（要点）：§2.2 八条机检法与批内件 **17 腿**逐条对位（1+1+6+1+1+3+3+1=17）——无半截（#1067 两径齐 ∥ #1114 13/13 ∥ #1082 正例不缺 ∥ #1135 三态齐）∥ #1087 三件（暂停/恢复 ∥ 看门狗 drain ∥ 停止门）逐句在盘且落点 = `thincoder-core/proxy-transport.mjs` ∥ 四设计档抽查坐标全中 ∥ 改单 24 档全落 §2.4/§2.6 清单、无未披露越面。

**advisor 发现处置（5 条 · 逐条落判）**

| # | 级 | 发现 | 处置 |
|---|---|---|---|
| 1 | 🟡 | API 索引生成区未含本批新导出（`hasKey`）；`api-contract --check` 报告态漂移（缺 102 条 = 他批既存 + 本批 1 条） | **不修（协调项）**——非门禁工具 ∥ 不在 §2 文件清单 ∥ 修则越面替他批背书；维持 §5.4 归批重生成建议 |
| 2 | 🔵 | `deflate` 只接 zlib 包裹形，裸形（RFC1951）边界未明书 | **已修**：`docs/core/design/PROXY.md` §2 #1067 条补边界句（`deflate` = RFC1950 包裹形；非合规裸形 ⇒ 明错误径、不透传） |
| 3 | 🔵 | §2.4 行数（245 ≈ +30）与 as-built（298 = +53）未对账；§2.2 目标坐标为改前帧 | **已修**：本档 §5.1 对账行（见下补记）+ PROXY.md §6.1 现读（298）为权威读数 |
| 4 | 🔵 | §5.6 交付时为空占位 | **已修**（= 本块） |
| 5 | 🔵 | 批内件死助手 `sleep`（定义零调用） | **已修**：删该行（`docs/batches/2026-10-10-core-small-fixes.test.mjs:26` 现 = `tick` 单行）；删后复跑 **17/17 绿** |

**§5.1 补记（行数对账 · 回应处置 3）**：`thincoder-core/proxy-transport.mjs` 245（设计 §2.4 估）⇒ **298**（as-built；+53 = 解压阶段 + 背压/停止门 + 注释与错位收正）；`thincoder-core/proxy.mjs` 50 ⇒ **53**；`thincoder-core/proxy-target.mjs` 54（零触）。§2.2 表内 `file:line` = **改前帧**（设计轮现读），实施后坐标以 §5.1 与本档 §5.5 四设计档为准。

**终态 = 收敛（converged）**：审计轮 1 ∥ 评审轮 1 后 **must-fix 零**；四条 🔵 处置中三条修（记录/注释面，零语义）、一条（🟡 协调项）不修并留判据。修复后复跑读数：批内件 **17/17 绿** ∥ `scripts/doc-check.mjs` **exit 0**——`OK(锚): 0 条悬空` + `OK(行宽)`（前读 3 条悬空 = METERING.md 他面，末读已清）。未修项：🟡 API 索引（归批）——**非阻塞，不结转本批 must-fix**。

## §6 验证与收口（父代理）

**交付物**：9 条全 ✅ —— #894 两处失效字面收正（父侧补落）+ #929 零码复核 ∥ #1067 解压单点 ∥ #1068 去吞口 ∥ #1082 判定收口 ∥ #1087 背压 + 停止门 ∥ #1114 13 处 realpath 判据 ∥ #1135 `hasKey` 门 ∥ §2.6 设计档回填四档（eng-coder #84）。

**父侧验证读数**：`node --test docs/batches/2026-10-10-core-small-fixes.test.mjs` = **17/17 绿**（父侧实跑 · 3612ms）∥ 旧件复跑 5/5 ∥ digest-accounting 14/14 ∥ chunked-frame 16/16 ∥ `node scripts/doc-check.mjs` = exit 0（coder 读数）。

**上抛处置（三项——当日入账）**：① per-channel T4/W2 红 = 他面（VSC `presets.mjs` 同窗在改 ∥ 10-09 后陈旧断言）——Ⅳ 批父侧测试面已列随正；② api-contract 盘面漂移（3338∥3346；缺 102 条）⇒ 台账 **#1183**；③ 内嵌 `node --test` 假绿陷阱（`NODE_TEST_CONTEXT` 继承）⇒ 台账 **#1185**；另 `PACKAGING.md:340` 漂移 ⇒ **#1184**。

**评审终态**：探索分歧审计轮 1 = CLEAN ∥ 顾问代码评审轮 1 = **pass**（🔴0 ∥ 🟡1 非阻塞 ∥ 🔵4——三条已修、一条留判据）；终态 = converged。

**结算**：#894 ∥ #929 ∥ #1067 ∥ #1068 ∥ #1082 ∥ #1087 ∥ #1114 ∥ #1135 ⇒ 核销（evidence = 本档 + 17/17 读数）。**待办**：波尾 scoped commit；无未决项。
