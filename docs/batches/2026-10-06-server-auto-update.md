# 2026-10-06 · server-auto-update
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-06 · 来源 = 用户 2026-10-06 15:33「server我也希望实现自动更新，那docker里的也能吗？」+ 15:37「我觉得用不用容器都走npm路径升级，容器只做个壳就行」+ 15:38「点火」——需求 = 自动更新（需求档 §2:10 ∥ 台账 #961）。
> 台账 = #961（server · 归批）。前情 = docs/batches/2026-10-06-server-presets.md §6（已收口 2026-10-06）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-10-06
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）**

**任务与来源**：用户 2026-10-06 15:33 问「server我也希望实现自动更新，那docker里的也能吗？」→ 15:37 裁「我觉得用不用容器都走npm路径升级，容器只做个壳就行」→ 15:38「点火」。需求 = server 自动更新（**两路统一 npm 版本身份 + 容器壳化**）；落地需求 = `docs/server/requirements/PROJECT.md` §2:10（含两令原文）+ 变更记录两条；台账 `#961`。

**方向裁定（在案）**：版本身份 = npm 包（`@thincoder/server`——唯一真相）；容器 = 壳（镜像 = node + 引导层，App 由 npm 取装）；升级 = 装 npm 新版 + 重启（裸机 = systemd 重起拾新版 ∥ 容器 = restart 策略重跑壳引导收敛）；回滚 = 版本回指 + 重启；旧「外部看门器（Watchtower ∥ 宿主定时）」候选作废（用户裁）。

**现状核查（父侧）**：server 零更新机制（全树 grep 零命中）；CLI 先例 `upgrade.mjs` = **检查-only**（5s 超时 ∥ 静默失败 ∥ `compareVersions` 逐段比较——**自升执行器 = 新面**）；现行镜像 = 烤树形（功能点 8 已交付实况——改壳 = 本批设计收正）；`OPS.md` §5.4 升级/回滚两行现行文案按新方向随正。

**授权（父侧代点火 + 代批准 · 沿本会话既定委托）**：用户 15:38「点火」⇒ 设计评审点火权 ∥ §4 用户批准权 ∥ 修正/实施轮派发 ∥ 收口核销/提交推送——均委托父侧自动执行。

**父侧自缚三条**：① 代签仅当三条件齐备（评审 pass〔0🔴〕∧ 修正轮已落地并逐条核验 ∧ token 已签发）；② 每次代签在 §4 写明依据；③ 需**新范围**（本批之外）或**用户口径裁决** ⇒ 停下。

**边界（本批不做）**：KD-SV-1–17 语义零改（可增决策行）；账号 ∥ 计量 ∥ 转发 ∥ 预设面零触；不预建（渠道/灰度/多版本并存不落）；**发布动作本身 = 发布面轮**（本批 = 机制就绪——无发布时自检恒「无新版」；接线点在发布面轮）。

**父侧随轮收正（设计交卷后——父侧直接执行 · 机械 · 可 revert）**：R12 已办（需求档 `:43` 400 字符 ⇒ 三行 ≤300——行宽复绿）∥ R9 已办（AC-10 行落需求档验收表）∥ 需求档 `:43` 补「形态 = 定稿」句（KD-SV-18——沿点 9 先例）；机械四项（`OPS.md:191` presets 件「拟新增」⇒「已落盘 347 行」∥ `:192` AC-10 行标记 ⇒ 已落需求档 ∥ `:199` KD-SV-17 路径补仓前缀 + 标记翻正（原缺前缀不解析）∥ 设计 `PROJECT.md` R9/R12 行销项）。

**父侧直接执行（跨批机械件 · 2026-10-06 16:0x——机械类 · 可 revert）**：`docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs` 四处断言按本批设计收正（旧形 ⇒ 壳形）：`:283` 标题尾「零 install 步」⇒「构建期本地 tgz 预装（零 registry 依赖）」∥ `:297` ENTRYPOINT 断言 ⇒ `docker-entrypoint.sh` 形 ∥ `:298` ⇒ 预装行逐字断言 + 「构建期不得走 registry 装版」反向断言（原断言 ⇒ 双断言）。复跑该件 **6/6 绿**（父侧亲跑，EXIT=0）。缘由 = `#30` 机械门禁拒绝跨批写（**正确行为**——上抛不绕门禁）+ 旧断言锚定的旧设计已被本批设计取代（性质 = 本批设计的直接机械后果，非新语义）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（六问逐答落位（①自检/档位/自升 ②壳化+收敛口径 ③ready 行字段 ④两路同法回滚 ⑤失败安全链 ⑥发布接线）∥ KD-SV-18 ∥ doc-check 本批新增悬空 0 ∥ 行宽 0（整档 62 悬空 = #958 族在册；触面外 1 超宽 = 需求档 :43——R12））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 轮次定位与本批条目（覆盖）

- 轮次 = **设计轮**（initial）；需求 = `docs/server/requirements/PROJECT.md` §2:10（功能点 10「自动更新」+ 变更记录两条——用户 15:33/15:37）；台账 = #961（task_book 指针 = 本档）；批档 §1 在册（方向裁定 + 边界）。
- 条目表（逐条覆盖）：

| # | 条目（需求回指） | 设计落点 | 状态 |
|---|---|---|---|
| 1 | 两路统一 npm 版本身份与升级路径 | `ops/OPS.md` §5.1（版本身份 = npm 包——镜像 tag 不承担版本语义） ∥ §5.4(c)（自升命令） | ✅ 覆盖 |
| 2 | 容器 = 壳（镜像 = node + 引导层；App 由 npm 取装） | `ops/OPS.md` §5.1（壳镜像形 ∥ 构建期预装 ∥ 运行期收敛） ∥ §6（新三档预算） | ✅ 覆盖 |
| 3 | 升级 = 装 npm 新版 + 重启（容器 = restart 策略重跑壳收敛） | `ops/OPS.md` §5.4(c)(d) ∥ §5.2（重起拾新版链） | ✅ 覆盖 |
| 4 | 回滚 = 版本回指 + 重启（两路同法） | `ops/OPS.md` §5.4(e)（裸机装回旧版 ∥ 容器钉回旧版） | ✅ 覆盖 |
| 5 | 形态细节（装版时机 ∥ 版本钉法 ∥ 更新源 ∥ 通知/自动档 ∥ 版本可见性） | `ops/OPS.md` §5.1 ∥ §5.4(a)(b)(g) ∥ §1（`autoUpdate`） | ✅ 覆盖 |
| 6 | 前置 = 发布面上线（无发布时恒「无新版」） | `ops/OPS.md` §5.4(h)（404 静默——写实） ∥ `PROJECT.md` §9 R10 | ✅ 覆盖 |
| 7 | 零第三方运行期依赖（沿需求 §3） | 自检 = node 内建 `fetch` ∥ 自升 = npm CLI 子进程（零新依赖）；KD-SV-18 | ✅ 覆盖 |

- **本批边界（不做）**：KD-SV-1–17 语义零改（只增 KD-SV-18）；账号 ∥ 计量 ∥ 转发 ∥ 预设面零触；不预建（渠道/灰度/多版本并存/热载——§10 在册）；发布动作本身零涉（发布面轮）；需求档零笔（AC-10 候补 = 上抛 R9）；产品码零写（实施轮）；他批零触。

### 2.2 设计档落点

- 机制全文 = `docs/server/design/ops/OPS.md` §5.4（升级/回滚全机制 (a)–(h)）；同档随动 = §1（`autoUpdate` + 更新源行）∥ §4（ready 含 version）∥ §5.1–5.3 ∥ §5.7 ∥ §6（预算）∥ §7（AC-10）∥ §8（KD-SV-18）∥ §9（用例）∥ §10（边界） ∥ 变更记录。
- 板级随动 = `docs/server/design/PROJECT.md`：§2.1 ops 行（五档 + 部署档组补两档）∥ §4 索引（1–17 ⇒ 1–18）∥ §6 预算/随动表 ∥ §7 AC-10 行 ∥ §9 R9–R12 ∥ 变更记录。
- 代码落点 = `thincoder-server/src/ops/update.mjs`（拟新增——更新机制）∥ `thincoder-server/deploy/converge.mjs`（拟新增——壳收敛）∥ `thincoder-server/deploy/docker-entrypoint.sh`（拟新增——壳入口）；`EVOLUTION.md` 零触（本批评估：无器级新触发项——更新面边界归 `ops/OPS.md` §10；评审如需立触发行 ⇒ 修复轮可加）。

### 2.3 机制设计（六问逐答——对批档 §1 任务书问面）

**① 更新机制形态（自检 ∥ 档位 ∥ 自升执行器）**：自检 = 服务内周期（启动一次 + 每 6h——实现常量，不设配置项）+ node 内建 `fetch` 直连 registry（`GET <registry>/@thincoder%2fserver/latest`——`%2f` 编码形实测在案 2026-10-06；超时 5s 沿 CLI 先例；**失败/404 静默**——发布前恒「无新版」）；更新源 = `NPM_CONFIG_REGISTRY`（缺省 npmjs；内网镜像由此解——自检与自装同源）。档位 = `autoUpdate` ∈ {`false` ∥ `"notify"` ∥ `"auto"`}，**缺省 `"notify"`**（论证 = 可见不越权：默认让运维看见版本动态而不代其决策；`"auto"` = 免值守 opt-in；`false` = 离线/审计）；非法值拒启（fail-closed）。自升执行器 = `npm i -g @thincoder/server@<版号>`（版号 = 检查所得**具体值**——防标签竞态）子进程（超时 120s）；成功 = 退出码 0 ∧ 复读版本变更 ⇒ 走**既有优雅停机路径**（`signal: "self-update"`——复用 `closeApp`）⇒ 守护重起拾新版；**失败/超时恒保留旧版运行**（子进程失败不触退出）。容器内钉版（`TC_SERVER_VERSION` 非空且非 `latest`）⇒ 自装抑制（生效 = notify——防与壳收敛互搏）。

**② 容器壳化**：镜像 = `node:24-slim` 基座 + 引导层（entrypoint.sh = `converge.mjs || exit 1` + `exec thincoder-server --config /app/config.json`；converge.mjs 自足——零 App 依赖）。**装版时机** = 构建期预装（`npm pack` 构建上下文包体 ⇒ `npm i -g <tgz>`——离线可构建 ∥ **构建零 registry 依赖**——发布前可全链验证）为默认；运行期收敛为兜底。**装位** = `/home/node/.npm-global`（`NPM_CONFIG_PREFIX`——node 账号自有）；**权限** = `USER node`（非 root——官方基座 `useradd --uid 1000` + `--create-home` 实读在案）；`VOLUME /app/data` 保留（bind 卷 `chown 1000:1000`——部署清单 ③）。**entrypoint 收敛口径** = 按 `TC_SERVER_VERSION` × 已装判定表（§5.4(d)：空 = 按已装（零网络）∥ 钉 = 收敛该版（缺则装；装不上 ⇒ 拒启 + 三选修复）∥ `latest` = 追新（不可达 ⇒ 回退已装 + 警告））——重跑壳 = 收敛到配置版本：不留旧、不漂移。

**③ 版本可见性**：启动日志 `ready` 行加 `version` 字段（= 前缀内实际安装版本——journald/docker logs 直读；升级核对 = 重起读 ready 行）；容器收敛行 `converge: version=<v> source=<installed|installed-now|fallback>`。**形态选型 = ready 行字段**（三候选中最小——零新面；轻端点 = 新鉴权/健康语义面（否）∥ 响应头 = 热路径每响应加字段（否））。

**④ 回滚**：两路同法「版本回指 + 重启」——裸机 = `npm i -g @thincoder/server@<旧版>` + `systemctl restart`；容器 = 钉回旧版 + `up -d`（离线可指镜像预装版 = 构建时树版本）。注意三则（§5.4(e) 在案）：`"auto"` 档回滚会被下轮自检再自装（长期旧版 ⇒ 改 `false`/`"notify"`）∥ 升级不动数据（库文件零触）∥ 库迁移只进不退（回滚前建议先备份——§5.5）。

**⑤ 失败安全链**（绝不 brick——逐位形态 = §5.4(f)）：自装失败/超时 ⇒ 旧版照常（进程不退）；半装窗 ⇒ 旧进程内存内照常服务（树受损时恢复 = 重装——命令在日志与文档）；装后启动失败 ⇒ 守护重起循环（systemd 起爆窗内失败态 ∥ docker 重起——日志可见）⇒ 版本回指回滚；容器钉版不可得 ⇒ 拒启（重起循环使其可见——不静默漂移）。

**⑥ 前置声明与随动**：发布面接线点 = `@thincoder/server` 发布前自检恒「无新版」（404 静默——写实在案）；发布后自生效（零改动）。受影响文件 = §2.4 表；`README.md` 随动 = §8 升级/回滚重写 + §1/§3 安装/清单 + §2 `autoUpdate` 行 + §10 边界。

### 2.4 受影响文件与测试面

- 产品码/部署面（实施轮笔——本批零写）：`thincoder-server/src/ops/update.mjs`（拟新增——设计估 ≈160）∥ `thincoder-server/src/ops/config.mjs`（158 ⇒ ≈170——`autoUpdate` 校验）∥ `thincoder-server/bin/thincoder-server.mjs`（113 ⇒ ≈125——ready 带 version + 更新循环 + 停机清循环）∥ `thincoder-server/deploy/docker-entrypoint.sh`（拟新增 ≈12）∥ `thincoder-server/deploy/converge.mjs`（拟新增 ≈85）∥ `thincoder-server/Dockerfile`（16 ⇒ ≈32——壳化重设计）∥ `thincoder-server/docker-compose.yml`（15 ⇒ ≈26）∥ `thincoder-server/.dockerignore`（7 ⇒ ≈8——注释随正）∥ `thincoder-server/deploy/thincoder-server.service`（32 ⇒ ≈42——前缀 env + ExecStart）∥ `thincoder-server/config.example.json`（32 ⇒ ≈33）∥ `thincoder-server/README.md`（125 ⇒ ≈150）∥ `thincoder-server/package.json`（25 ⇒ ≈26——`prepublishOnly` 八件）。
- 设计档（本批笔）：`docs/server/design/ops/OPS.md`（§1 ∥ §4 ∥ §5 ∥ §6 ∥ §7 ∥ §8 ∥ §9 ∥ §10 ∥ 变更记录）∥ `docs/server/design/PROJECT.md`（§2.1 ∥ §4 ∥ §6 ∥ §7 ∥ §9 ∥ 变更记录）。
- 测试面 = 批内件 `docs/batches/2026-10-06-server-auto-update.test.mjs`（拟新增——设计估 ≈260 行；腿 = 自检（本地假 registry `node:http`）∥ 档位三值 + 拒启 ∥ 自升执行器（假 npm 替身——成功走停机/失败不退）∥ ready 含 version ∥ converge 判定矩阵（临时前缀 + 假 npm））；不设 `test/` 树（沿测试纪律）；复跑 = `node --test docs/batches/2026-10-06-server-auto-update.test.mjs`（cwd = 仓根）。
- 真机面 = 收口轮（docker build + compose 起停 = #959 条件行同窗；发布前用假 registry 可测自检链）。

### 2.5 验收对照（回指功能点 10 ∥ 需求 §2:10）

- AC-10 候选判据（全文 = `ops/OPS.md` §7 行）= 自检（假 registry ⇒ 触发 ∥ 404/失败 ⇒ 静默）∥ 档位三值语义 + 非法值拒启 ∥ 自升执行器（成功 ⇒ 优雅停机；失败/超时 ⇒ 不退 ∥ 旧版续跑）∥ ready 含 version ∥ 容器收敛判定表（converge 矩阵）；载体 = 批内件 + 收口轮真机。AC 行候补 = 上抛 R9（需求档笔 = 主 agent）。

### 2.6 机检读数（D6 读回——`node scripts/doc-check.mjs` · 仓根 · 原始字节落盘避控制台编码）

- **改前基线**（留档 = `.thincoder/tmp/doc-check-before.txt`）：候选 49367 · 悬空 **62** · 注记豁免 331 · 拟新增 51 · 迁移期引文 303 · 声明源缺位 0；行宽 **1**（`docs/server/requirements/PROJECT.md:43`——400 字符；需求档笔——§2.7①）；行数面差异 13（桌面声明面——本批零触）。
- **改后**（复跑 = `.thincoder/tmp/doc-check-after.txt`）：候选 49417（+50——本批新增行）· 悬空 **62**（**零增**）· 注记豁免 331 · 拟新增 **55**（+4 = entrypoint/converge 两档四引——列报）· 迁移期引文 303 · 声明源缺位 0；行宽 **1**（同上——触面外）；exit 1（闸态 = #958 族 62 + 需求档宽行——均非本批触面）。
- **本批触面**：新增闸态悬空 **0** ∥ 新增超宽 **0**（初读 4 条本批超宽已就地拆行闭合——零语义）；新增报告面行 = `OPS.md:85/:177/:178`（entrypoint ∥ converge——拟新增列报）；整档 62 = #958 族 + 他批存量（本批零增——归清账批）。

### 2.7 披露与顺带项（逐条报告）

- ① **需求档行宽破口（非本批触面——主 agent 笔）**：`docs/server/requirements/PROJECT.md:43`（功能点 10 行——400 字符 > 300）⇒ 机检 FAIL(行宽)；处置 = 拆行（上抛 R12）——本批零笔（需求档 = 主 agent 域）。
- ② **本批自纠 2 项**（设计面自检——已就地闭合，零语义）：一行「拟新增」标记漏全角括号（`OPS.md` §5.1 ⇒ 2 条闸态悬空——修后归列报）∥ 4 行超宽（拆行）。
- ③ **既有列报复核**：`OPS.md:199` presets「拟新增」标记（presets 批留档——列报不入闸；本批不动——注：该行路径 `src/ops/presets.mjs` 不带仓前缀、不解析，如翻正将转闸态）。
- ④ **EVOLUTION 评估结论（视需要项）**：不触——本机制无器级新触发项；更新面边界（渠道/灰度/多版本并存/热载）归 `ops/OPS.md` §10；评审如认为需立触发行 ⇒ 修复轮可加。

### 2.8 上抛项

- **R9（需求档回笔——主 agent 笔）**：AC-10 行候补（判据草案 = `ops/OPS.md` §7）。先例 = AC-7/AC-8/AC-9 回笔。
- **R10（发布面接线点）**：发布前恒「无新版」（404 静默）——发布后自生效；发布动作 = 发布面轮。
- **R11（实施后回填轮）**：预算实读（新三档 + 十一档增量）∥ 批内件实读。
- **R12（需求档行宽破口——主 agent 笔）**：`docs/server/requirements/PROJECT.md:43` 拆行修复。
- 无「停下上抛」触发（方向两令 + 批档 §1 边界支撑本设计；无私自扩面；KD-SV-1–17 零改）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | 一致性（Clarity） | 🟡 | compose 样例 `TC_SERVER_VERSION=${TC_SERVER_VERSION:-latest}`（`ops/OPS.md:98`，同行注释 `留空 = 按镜像预装运行（离线）`）——在 compose `:-` 语义（仓外知识——**unverified**）下空值取 `latest`，使判定表首行 `空（缺位 ∥ 空串）`（`ops/OPS.md:132`）与 §5.1 `空 = 运行已装版本（零网络）`（`ops/OPS.md:87`）经示例不可达：按注释留空的用户会走 registry 查询而非零网络。 | 择一收正：示例缺省改空态透传形（或删该 environment 条目）∥ 改注释与 §5.7③「`TC_SERVER_VERSION` 可选」口径为「不设 = `latest`」——两处口径对齐后示例与判定表自洽。 |
| 2 | 验收/边界 | 🟡 | 容器收敛判定表两格未定处置：`latest`+已装 行 `有新 ⇒ 装 ⇒ 运行；不可达 ⇒ 回退已装 + 警告`（`ops/OPS.md:136`）未覆盖「可达但装失败/超时（120s）」；`latest`+无 行 `可达 ⇒ 装 ⇒ 运行；不可达 ⇒ 拒启`（`ops/OPS.md:137`）同缺「装失败」格——实现与 converge 矩阵批内件无判据可依（拒启 ∥ 回退已装+警告未择）。 | 补两格处置（建议沿既有口径：有已装 ⇒ 回退已装 + 警告；无已装 ⇒ 拒启 + 三选修复消息），并让 converge 矩阵断言覆盖之。 |
| 3 | 文档状态 | 🟡 | `docs/server/design/PROJECT.md:146` AC-10 行仍标 `需求档行候补——主 agent 回笔`，而同档 `:173` R9 行写 `**需求档回笔（已办）**：AC-10 行已落需求档验收表（2026-10-06）`，需求档 `:60` 亦已有 `自检（假 registry ⇒ 触发` 行——同档自相矛盾（§7 AC-9 行已作「已落需求档」形）。 | 将 `:146` 的「候补——主 agent 回笔」收正为「已落需求档」（对齐 §7 AC-9 行写法）。 |
| 4 | 文档状态 | 🟡 | `docs/server/design/ops/OPS.md:37` 预设形落点仍标 `（拟新增——静态表 + 展开函数；§6 在册）`，同档 `:172` 该档记为 `（已落盘）`、`**50**（实读 2026-10-06——设计估 ≈45）`，`:199` KD-SV-17 为「已落盘 50 行」，磁盘实读亦 50 行——标记滞留（presets 批实施后回填漏改本行）。 | 翻正或删该「拟新增」标记（例：`（已落盘 50 行——静态表 + 展开函数；§6 在册）`）。 |
| 5 | 清晰度 | 🔵 | 容器入口 exec 用裸命令名：批档 `:56` 给 `exec thincoder-server --config /app/config.json`；而设计只写装位 `装位 = 镜像前缀（node 账号自有——自升可写）`（`ops/OPS.md:88`），镜像 PATH 是否含 `<前缀>/bin` 未写；裸机路用绝对路径 `ExecStart=<前缀>/bin/thincoder-server --config <配置档>`（`ops/OPS.md:113`）。 | 设计注明 PATH 接线（Dockerfile `ENV PATH` 含前缀 bin）或入口改前缀绝对路径——与裸机路写法对齐。 |
| 6 | 清晰度 | 🔵 | 自检传输面表述不一：设计 `（直连 HTTPS；`%2f` 编码形实测在案 2026-10-06；超时 5s 沿 CLI 先例）`（`ops/OPS.md:125`）∥ 批内件腿 `自检（本地假 registry `node:http`）`（批档 `:70`）——若实现按「仅 HTTPS」硬编，内网 http 镜像（`NPM_CONFIG_REGISTRY` 可指）自检恒静默失败（不更新）。 | 明示自检按 `NPM_CONFIG_REGISTRY` 的 scheme 直连（http(s) 皆可），并作为批内件断言之一。 |
| 7 | 文档卫生 | 🔵 | 规范面残留 as-is 状态陈述：需求档 `:44` `现行烤树形镜像 = 实况`——本批落地（镜像转壳）后失真（现状陈述归记录面）。 | 删去该分句（历史已由变更记录承载）或改写为落地后事实。 |
| 8 | 清晰度（测试面） | 🔵 | 替身注入点未写明：批内件腿 `自升执行器（假 npm 替身——成功走停机/失败不退）` 与 `converge 判定矩阵（临时前缀 + 假 npm）`（批档 `:70`）——设计（`ops/OPS.md` §5.4(c) ∥ §6）未给 npm 命令/前缀/周期常量的可注入点，实现若把命令与常量硬编入循环则批内件只能走真实 npm。 | 设计注明可注入口径（参数覆盖 + `??` 缺省——缺省保持生产行为不变；测试内 finally 复原），使两处替身有稳定接线。 |

计数：🔴 0 ∥ 🟡 4 ∥ 🔵 4（行数标注抽检 13/13 与磁盘逐值相符；新三档确实未落盘——glob 实核）

VERDICT: pass

## §4 用户批准（主 agent）

**§4 用户批准（主 agent 代签）**——用户 2026-10-06 15:38「点火」全链授权（沿 §1 自缚三条）。

- **三条件齐备**：① 评审 **pass**（§3 轮次 1——🔴0 ∥ 🟡4 ∥ 🔵4）；② 修正已落地并逐条核验（**8/8 全采纳当场修**：① compose 缺省 `${TC_SERVER_VERSION:-latest}` ⇒ `:-}`（空态透传——与判定表/注释对齐）∥ ② 收敛表两格补处置（`latest` 装失败 ⇒ 有已装回退+警告 ∕ 无已装拒启）∥ ③ 设计 `PROJECT.md:146` AC-10 标记收正 ∥ ④ `OPS.md:37` presets「拟新增」翻正 ∥ ⑤ PATH 接线段（`ENV PATH` 含前缀 bin）∥ ⑥ 自检 scheme 口径（随 `NPM_CONFIG_REGISTRY`——http(s) 皆可）∥ ⑦ 需求档残留句删 ∥ ⑧ 注入口径段（可覆盖参数 + `??` 缺省）；父侧直接执行 · 小修/机械 · 逐处对表读回 · 可 revert）；③ **token 已签发**（值不入档）。
- **批准范围** = 实施轮十三档：`src/ops/update.mjs`（新 ≈160）∥ `src/ops/config.mjs`（158 ⇒ ≈170）∥ `bin/thincoder-server.mjs`（113 ⇒ ≈125）∥ `deploy/docker-entrypoint.sh`（新 ≈12）∥ `deploy/converge.mjs`（新 ≈85）∥ `Dockerfile`（重写 ∥ 16 ⇒ ≈40）∥ `docker-compose.yml`（重写 ∥ 15 ⇒ ≈30）∥ `.dockerignore`（随动）∥ `deploy/thincoder-server.service`（32 ⇒ ≈42）∥ `config.example.json`（32 ⇒ ≈33）∥ `README.md`（125 ⇒ ≈150）∥ `package.json`（25 ⇒ ≈26——prepublishOnly 增列本批件）∥ 批内件 `docs/batches/2026-10-06-server-auto-update.test.mjs`（新 ≈260）。
- **依据登记** = §3 轮次 1 ∥ §2（设计）∥ 需求 §2:10 / AC-10。可撤回。

## §5 实施记录（eng-coder）

**状态行**：实施完成（十三档落位 ∥ 新批内件 14/14 绿 ∥ 八件全量回归 70/70 绿 ∥ `npm run prepublishOnly` 实跑绿 exit 0 ∥ 审计 1 轮 + 代码评审 1 轮 ⇒ 终态 clean）

### 5.1 交付摘要（十三档 · 行数 = 实读）
- **新增**：`thincoder-server/src/ops/update.mjs`（**228**；设计估 ≈160——自检 ∥ 版本比较/形状门 ∥ 档位语义 + 钉版抑制 ∥ 自升执行器（`close` 结算 + 超时 kill + 复读校验）∥ 更新器循环；§5.4(a)(b)(c)）∥ `thincoder-server/deploy/converge.mjs`（**197**；≈85——判定表七行逐行 + `converge:` 行 + 三选修复消息；§5.4(d)(g)；自足零 App 依赖——仅 node 内建）∥ `thincoder-server/deploy/docker-entrypoint.sh`（**7**；≈12——`converge.mjs || exit 1` + `exec thincoder-server --config /app/config.json`）∥ 批内件 `docs/batches/2026-10-06-server-auto-update.test.mjs`（**498**；≈260 ∥ **14 用例**——假 registry `node:http` ∥ 假 npm 替身 `[node, 临时 .mjs]` ∥ converge 矩阵 ∥ 进程级 N15/ready/E12/converge 退出码 ∥ 部署件结构 ∥ 零依赖扫描）。
- **改动**：`src/ops/config.mjs`（**164**；≈170——`autoUpdate` 三值 + 缺省 `"notify"` + 非法拒启）∥ `bin/thincoder-server.mjs`（**122**；≈125——ready 含 `version` ∥ 更新循环接线（`update` 覆盖参数）∥ 停机清循环 ∥ `signal:"self-update"`）∥ `Dockerfile`（**28**；≈32——壳化重写：构建期上下文包体预装（本地 tgz——零 registry 依赖）∥ `ENV PATH` 含前缀 bin ∥ `USER node` ∥ `ENTRYPOINT` = entrypoint.sh）∥ `docker-compose.yml`（**19**；≈26——重写照 §5.1 代码块，`TC_SERVER_VERSION=${TC_SERVER_VERSION:-}` 空态透传）∥ `.dockerignore`（**8**；≈8——注释随正、清单不变）∥ `deploy/thincoder-server.service`（**34**；≈42——`NPM_CONFIG_PREFIX`/`NPM_CONFIG_CACHE` + ExecStart 前缀形）∥ `config.example.json`（**33**；≈33——`autoUpdate` 行）∥ `README.md`（**142**；≈150——§1/§2/§3/§4/§8/§10 随动）∥ `package.json`（**25**——prepublishOnly 八件 + 三档 `node --check`）。
- 读数供 R11 回填轮：update **228** ∥ converge **197** ∥ 批内件 **498** ∥ bin **122** ∥ config **164** ∥ Dockerfile **28** ∥ compose **19** ∥ service **34** ∥ entrypoint **7** ∥ example **33** ∥ README **142** ∥ dockerignore **8** ∥ package.json **25**。

### 5.2 决策透明表（设计未逐字给处——实施侧判据）
| # | 处 | 决定 | 依据 |
|---|---|---|---|
| ① | 事件级别 | `update_available` = warn ∥ `update_suppressed` = info ∥ `update_install_failed` = warn ∥ `update_installed` = info | 设计只定事件名未定级；notify 通道语义 = 运维可见；钉版为运维意图（说明而非告警） |
| ② | 复读校验口径 | 已装版本 **等于** 目标版（严于「版本变更」字面） | 更强且无标签竞态；批内件同口径断言 |
| ③ | npm 命令注入口径 | 「命令 + 前导参数」数组（缺省 `["npm"]`；批内件 `[node, 假 npm]`） | §5.4(c) 注入口径；Windows 下 `.cmd` 垫片不可直接 spawn（跨平台可测） |
| ④ | converge 前缀缺省 | `/home/node/.npm-global`（镜像 ENV 同值）；已装探测双布局（`lib/node_modules` ∥ `node_modules`） | §5.1 装位；npm 全局布局双平台 |
| ⑤ | 收敛行形 | 设计字面 `converge: version=<v> source=<installed\|installed-now\|fallback>` + `warning …`/`refused …`（拒启含修复选项） | §5.4(d)(g) |
| ⑥ | 子进程结算 | `close` 事件（stdio 关后取尾） | 代码评审判定——防末行截断（update ∥ converge 同改） |
| ⑦ | 钉版解析 | `TC_SERVER_VERSION` 先去空白 | 与 converge 目标解析同源（评审判定） |

### 5.3 审计与代码评审（轮次 + 终态）
- **内部分歧审计（explore · 只读 · 1 轮）**：2 条真分歧——① 本段（批档 §5）缺笔 ⇒ 本段闭；② 批内件 **661 行越 500 硬线** ⇒ 自修两轮压缩至 **498**（保 14 用例全腿——合并单件腿入 ⑤ + finally/表头/助手压缩；零覆盖损失）。3 条可接受解释（R11 回填面）+ 1 条弱覆盖（启动即检隔离）⇒ 已补 `once` 腿（长周期隔离读数）。
- **代码评审（advisor · code · 1 轮）**：**pass**（🔴 0）。🟡2 = 批内件行数（498——硬限内、零余量：后续追加须先拆）∥ 设计档标记/预算回填（R11 在册）。🔵5 = ① exit 取尾 ⇒ **已修** `close` ② Dockerfile COPY+rm 单阶段残层 ⇒ 保持（受 `-webui-deploy` 逐字断言钉形约束；多阶段改造归后续轮）③ 钉版 trim 不一致 ⇒ **已修** ④ 测试件重复注释 ⇒ **已删** ⑤ 墙钟窗 ⇒ 保留（观察窗 ≫ intervalMs）。评审侧注：其 6 处引用因路径根解析未定标 unverified——各引用行我方逐条实读核验（`update.mjs:97/:170/:227` ∥ `converge.mjs:110/:151/:196`）。
- **终态：clean**（两轮评审后无未处置项）。

### 5.4 测试读数（终态）
- 新批内件 `node --test docs/batches/2026-10-06-server-auto-update.test.mjs` ⇒ **14/14 绿**（exit 0）。
- 八件全量回归 ⇒ **70/70 绿**（exit 0；含父侧落地的 `-webui-deploy` 更新断言）。
- 门禁 `npm run prepublishOnly`（自 `thincoder-server/`）⇒ **70/70 绿**（exit 0；含三档 `node --check`）。
- `node --check`：全部改动 `.mjs` 逐个实跑绿。零依赖扫描腿实核（全树 import 仅 `node:`/相对 ∥ `dependencies` 空）。
- **未跑（披露）**：`docker build`/compose 起停——本机无 docker（命令不存在）⇒ AC-10 真机面归收口轮。

### 5.5 表外改动（逐条 · 可 revert）
- ① `docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs:283/:297-298`——旧形断言（ENTRYPOINT 旧形 ∥「零依赖 ⇒ 无 install 步」）⇒ 新壳形逐字断言（ENTRYPOINT=entrypoint.sh ∥ 预装行逐字 ∥ 反向断言「构建期不得走 registry 装版」）。**父侧直接执行落地**（我侧门禁拒跨批写——已上抛并获准 A 案）；性质 = 本批设计取代旧设计的机械后果。
- ② 其他：无（下游转发/清单/账号/计量/预设零改；需求/设计档零笔；他批零触）。

### 5.6 上抛与未办
- 两问两答已闭合（① Dockerfile 冲突 ⇒ 准 A 案 ② 门禁拒写 ⇒ 父侧代落）。
- 未办（披露）：`docker build`/compose 起停（环境无 docker——收口轮真机面）；设计档「拟新增」标记 + §6 预算实读回填（R11 轮）。

## §6 验证与收口（父代理）

**§6 验证与收口（主 agent）**

**来路**：用户 15:33「server我也希望实现自动更新，那docker里的也能吗？」→ 15:37「用不用容器都走npm路径升级，容器只做个壳就行」→ 15:38 点火 → 设计轮 `#27`（两路统一 + 壳化 + 收敛表 + KD-SV-18）→ 评审 `#28`（**pass**——🔴0 ∥ 🟡4 ∥ 🔵4）→ 八条收正（父侧直接执行 · 机械 · 可 revert）→ §4 代签 → 实施轮 `#30`（新增 4 档 ∥ 改动 9 档）→ 本段。

**验证读数（父侧亲跑）**：
- 八件 **70/70 pass**（EXIT=0——含本批新档 14/14）。
- `npm run prepublishOnly`（八件 + 三档 `node --check`）实跑绿（`#30` 终读数，父侧复核一致）。
- converge 矩阵七行逐行断言在案（空 ⇒ 零网络 ∥ 空无 ⇒ 拒启 ∥ 钉=即用 ∥ 钉≠ 装/拒启+三选修复 ∥ latest 装失败/不可达 ⇒ 回退+警告或拒启 ∥ POSIX 探测 ∥ 退出码 0/1）。
- 零依赖扫描绿（无新依赖 ∥ `import` 全 `node:`/相对）。
- `docker build`/compose 起停 = **本机无 docker ⇒ 未跑**（如实披露——归 `#959` 真机条件行同窗）。

**跨批机械件（父侧直接执行 · 可 revert）**：`docs/batches/2026-10-06-server-gateway-webui-deploy.test.mjs` 四处断言按壳形收正（`#30` 撞跨批写门禁——**正确上抛不绕**）；复跑 6/6 绿。已并入本批提交（§1 在案）。

**实施提交**：`43288a4c`（`feat: thincoder-server auto-update — npm identity, shell image, converge (13 files, #961)`——15 档 · +1210/−60）；双推 = 末段随收口（R11 落定后）。

**遗留 / 移交（在册）**：
- **R11 回填 = 冻结解除即落**（`ops/OPS.md` ∥ `design/PROJECT.md` 被 #34 评审冻中——补丁已备；实读：update **228** ∥ converge **197** ∥ entrypoint **7** ∥ bin **122** ∥ config **164** ∥ Dockerfile **28** ∥ compose **19** ∥ dockerignore **8** ∥ service **34** ∥ example **33** ∥ README **142**；小计 **1246**；批内件 **498**）。
- 批内件 **498 行**（500 硬线内零余量——后续追加须先拆）。
- `docker build` 真机 = `#959` 条件行同窗；R10（发布面接线）= 发布面轮。

**§6 尾（R11 收尾 · 2026-10-06）**：R11 回填已落（`ops/OPS.md` ∥ 设计 `PROJECT.md` 两档实读收正 + 标记翻正 + R11 销项——见两档变更记录）；提交 = `43288a4c`（实施 13 档）∥ `ba8ee955`（设计/需求/批档 docs 波）；双推 = origin ✓ ∥ github ✓。批次档至此冻结。
