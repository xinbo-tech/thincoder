# 2026-10-07 · VSC 渠道代理语义修复
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-07 · 来源 = 用户 2026-10-07 17:58 原话「provider 走不走 proxy 是每个 provider 单独选的」（直斥 403 案）+ 17:59「你先把这个问题开始修!」。
> 台账 = #1026（vscode · 归批）。前情 = 无（独立批）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 笔 1（轻通道 · 缺陷修复）——「测试连接」代理语义修复

**披露**（落笔前定性）：本笔 = 轻通道，命中三条之②「缺陷修复——实现与既有源头相抵」。
源头两侧：① 用户 2026-10-07 17:58 原话「provider 走不走 proxy 是每个 provider 单独选的」；
② 运行期语义 `thincoder-vscode/src/extension/presets.mjs:131-135`（`entry.proxy ∧ proxyCfg.model`
双重门槛，缺省直连）。旧实现 `settings.mjs:224-226` 取全局 `config.proxy.web` 旗。
回退 = revertable（单笔提交，见 §6 收口面）。

**改动**（两档源码 + 一测试件）：
- `thincoder-vscode/src/extension/settings.mjs:220-233`：`testProviderConnection` 不再取全局
  `config.proxy.web`——添加渠道表单 = 尚未落盘的条目 ⇒ 与运行期缺省一致 = 直连（`proxyUri: null`）。
- `thincoder-core/proxy.mjs`：新增 `isLoopbackTarget()`（`localhost` ∥ `*.localhost` ∥ `127.0.0.0/8`
  ∥ `::1`；含尾点 ∥ IPv6 括号归一）；`proxyFetch` 入口对 loopback 目标一律旁路代理串（NO_PROXY 语义）。
- `docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs`（随批档存档）。

**走查（红 → 绿对，逐条实跑）**：
- 红（修前）：3 用例 3 fail；其中②原样复现用户案——loopback 目标被送进代理：
  `Proxy CONNECT failed (ECONNREFUSED)`（生产侧代理应答即 403，服务端零请求）。
- 绿（修后）：`node --test docs/batches/2026-10-07-vsc-provider-proxy-fix.test.mjs` = 3/3 pass。
- 语法门：两源码档 `Syntax OK`；core ∥ VSC 自测清单 = 空清单（2026-09-28 全清重置）⇒ 无存量回归面。

**冻结**：本笔冻结——后续改动开新笔。收口 = 全链一次（设计化 → 独立评审 → 批准 → 核销）。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
