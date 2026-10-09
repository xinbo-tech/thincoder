# ACP 协议面合规收正（ACP-PROTOCOL-COMPLIANCE）· CLI 面 · 设计

> 论域 = `thincoder-cli/src/acp/**` 与 ACP v1 schema 的逐字段对位收正——本批 4 条（#870 ∥ #871 ∥ #872 ∥ #873 实施；#862 = 拆批裁定，见 §6）。
> 承批档 = `docs/batches/2026-10-04-issue-fix-round2.md` §1（5 条清单 + 证据锚）；条目源 = 2026-10-03 分诊（gitee/GitHub → 台账 #862 ∥ #870 ∥ #871 ∥ #872 ∥ #873）。
> 配对长期档 = `docs/cli/design/ACP-CLIENT.md`（通道机制单源——本批收正的目标文本见 §5，实施轮同拍落）；配对需求档 = `docs/cli/requirements/ACP-CLIENT.md`（F8 / R-A5——合规核对见 §1.3）。
> 规范基准 = 官方 schema v1（本设计轮复取 as-of 2026-10-04——SHA256 与 2026-09-18 记值逐字同 ⇒ 字段级结论同 as-of 有效；摘录见 §4）。
> 建档：2026-10-04（issue 修复批·二 · 设计轮 · eng-designer）。

## 1. 定位与归属

### 1.1 设计档落点与归属理由

- 长期机制面（ACP 通道）的**单源** = `docs/cli/design/ACP-CLIENT.md`；本批 4 条 = 该面内的 schema 对位收正 ⇒ 其判据与目标形最终归位该档（实施轮同拍收正——落点表与目标文本 = §5）。
- 本轮该档属 **#51（read-data-interface 实施）在飞写域** ⇒ 不可写（零触在飞写域）。本批设计独立成档（本档）——承先例 = `docs/cli/design/READ-DATA-INTERFACE.md`（批设计独立成档 + owning 档随动）。
- 分界（D2 单一权威源）：本档只写「收正目标形 / schema 对位 / 判据 / 用例 / 同拍落点」；**不重述通道机制**（传输 / 模块划分 / 能力快照 / 通知通道 / 会话生命周期——单源仍在 `docs/cli/design/ACP-CLIENT.md`）。
- **收口后定位**：本档冻结为**本批设计记录 + schema 对位基准**（不再自动扩展——后续同类收正归 `docs/cli/design/ACP-CLIENT.md` 活面）。
- **实施前置**：本批实施须**待 #51 收口后派发**（`thincoder-cli/src/**` 与 `docs/cli/design/ACP-CLIENT.md` 写域让渡——派发前核）。

### 1.2 复验结论（本设计轮逐条实读 · as-of 2026-10-04）

| 台账 | 分诊所述 | 本轮实读 | 裁决 |
|---|---|---|---|
| #871 | 3.3 已修；3.1 / 3.2 存活或半修 | 3.3 确认已修（`acp/client-caps.mjs:57-61` agentCapabilities 全形 ∥ `handlers-session.mjs:49-69` 凭据门即时判据）；3.1 存活 = `acp/bridge.mjs:208` `usage_update` 仅带 `usage`；3.2 半修 = `acp/handlers-slots.mjs:48` `sessionId` 键已正 ∥ `:50` `updatedAt: s.updatedAt ?? 0` 仍发 epoch 数 | 3.1 / 3.2 **存活**——入本批（§2.1 / §2.2） |
| #873 | 1.2 / 1.4 已修；1.1 存活、1.3 半修 | 1.2 确认已修（`acp/client-caps.mjs:28-37` authMethods 对象数组 + 门控）；1.4 确认已修（`handlers-session.mjs:204` 读 `params.prompt`）；1.1 存活 = `handlers-session.mjs:268` `set_config_option` 仍返 `{}`；1.3 半修 = `:191` `sessionId` 已正 ∥ `:32-36` `CONFIG_OPTIONS` 元素仍 `{id,name}` 无 `type` | 1.1 / 1.3 **存活**——入本批（§2.3） |
| #872 | 2.1 / 2.2 / 2.3 均存活 | 2.1 = `handlers-slots.mjs:79-80,108-114`（load）∥ `:139-140,161-164`（resume）仍 `allocSessionId()` 新分配且响应只回 `{configOptions}`（响应形状本身合规——Load/ResumeSessionResponse 无 sessionId 字段）；2.2 = `acp.mjs:101,108` 计数器 + `handlers-session.mjs:167`；2.3 = `handlers-session.mjs:287` `mode:` ∥ `:266` `{configId,value}` | 三条**存活**——入本批（§2.4） |
| #870 | 全仓 `resource_link` 零命中（thincoder 侧）；`handlers-session.mjs:204-206` 仅取首个 text 块 | 确认零命中（`.thincoder/tmp/gh-issues.json` 分诊件除外）；`handlers-session.mjs:204-206` 实读同上；schema 基线句「All agents **MUST** support resource links in prompts」（§4.2） | **存活**（基线 MUST 未达）——入本批（§2.5） |
| #862 | ② 结构化子代理事件未见实现（`bridge.mjs:194-195` 仍注「另行跟踪」） | 确认：`bridge.mjs:190-197` 现为**形态剥离**（剥即弃——零结构化映射）；结构化所依赖的状态源 = `⟦ev⟧` 事件族（8 名），现状为**显示面消费**（CLI TUI / VSC / 桌面三处各自解析，无核内机读单源） | **存活**——裁定 = **拆批**（§6） |

### 1.3 需求面合规核对（需求档 = `docs/cli/requirements/ACP-CLIENT.md`——只读核对，笔在主 agent）

- 现状判定句面 = F1–F8 / R-A1–A5 / N1–N8。本批 4 条中：
  - **#873 与 R-A5.4 相抵（欠述）**：该行现文「`configOptions` 条目含 `id` + `name`」——未含判别键 `type` 与现值字段（收正后形状见 §3.3）。需补述（需求面补笔 = 主 agent）。
  - **#871a / #872 / #870 在需求档无对应判定句**（F8 未覆盖 usage_update 形状 / 会话 id 持久身份 / resource_link 基线内容块）——缺口登记（补笔 = 主 agent；设计侧目标形已在本档 §2 给全）。
  - 其余判定句（R-A5.1/2/3/5/6/7 ∥ N1–N8）与本批**零冲突**（本批不改协议版本 / 不新增方法 / `initialize` 形状零动）。
- 五要素（本批条目层）：**目标** = 外部编排器（Zed 等）对 ACP v1 的字段级兼容；**功能点** = §2.1–§2.5 五条；**边界** = §11；**验收** = §9（可机检）；**依赖** = 官方 schema v1（§4）+ 核 `providerSpec` / `model-specs` 单源 + #51 写域让渡。

## 2. 机制设计（逐条：现盘坐标 → 目标形 → 验收判据）

### 2.1 #871a · `usage_update` 形状收正

- **现盘坐标**：`thincoder-cli/src/acp/bridge.mjs:208` `onUsage: (usage) => update("usage_update", { usage })`——`usage` 是自定义包装键；官方 `UsageUpdate.required = ["used","size"]`（§4.2），现状双缺。
- **目标形**：
  ```js
  onUsage: (usage) => update("usage_update", {
    used: (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0),
    size: providerSpec(agent?.provider).context,
  }),
  ```
  - `used` = 本轮请求 prompt + 生成 completion（近似「当前在上下文中的 token」——量级近似，客户端进度条允许偏差，如实登记）。
  - `size` = **模型上下文窗口**（schema 逐字「Total context window size in tokens」）。取值单源 = `providerSpec(agent.provider).context`（`@thincoder/core/config.mjs` 再导出；含 `providers[].context` 覆写，K→×1024 换算单源）——未知模型 ⇒ `DEFAULT_SPEC.context = 128_000` 兜底（函数全量，零 undefined）。
  - **agent 传递**：`buildAcpCallbacks` 增入参 `agent`（`bridge.mjs:62` 签名 + `thincoder-cli/src/acp/session.mjs:22` 调用点）；**活引用**（`session/set_config_option` 切模型后 size 随动——不得在构造期固化数值）。
  - 被否：`agent?.provider?.maxTokens`（= **输出上限**，与「上下文窗口」语义相抵——issue 自注）；被否：构造期快照数值（切模型后失真）。
- **验收判据**：任一次 `usage_update` 通知含整数 `used ≥ 0` 与 `size ≥ 0`；`used` = prompt+completion 之和；模型可知时 `size` = 其规格 context（如 `kimi-k3` → 1_000_000），未知 ⇒ 128_000。用例 T1–T3。

### 2.2 #871b · `session/list` 条目 `updatedAt` 收正 + `messageCount` 剔除

- **现盘坐标**：`thincoder-cli/src/acp/handlers-slots.mjs:47-53`——`:50` `updatedAt: s.updatedAt ?? 0`（epoch 数——schema 要 ISO 8601 字符串，见 §4.2）；`:52` `messageCount`（非 SessionInfo 字段——多余键收敛，同 09-18 批「多余键收敛为契约形态」原则）。
- **目标形**：
  ```js
  sessions: slots.map((s) => ({
    sessionId: String(s.slot),
    cwd: getCwd(),
    updatedAt: Number.isFinite(s.updatedAt) && Math.abs(s.updatedAt) <= 8.64e15
      ? new Date(s.updatedAt).toISOString()
      : undefined,
    title: s.title ?? "",
  })),
  ```
  - `s.updatedAt` 源 = 核 `listSlots` 条目 `updatedAt: meta.updatedAt ?? meta.ts`（epoch ms 数——`thincoder-core/session-slots.mjs:208`）。
  - **值域钳**（防 `toISOString` RangeError ⇒ list 整方法 `-32603`）：`Number.isFinite(v) && Math.abs(v) <= 8.64e15`（ECMA-262 TimeClip 上限——域内 `toISOString()` 恒不抛）⇒ ISO 串；**非法 ∥ 超域**（非有限 ∥ `|v| > 8.64e15`）⇒ `undefined`（JSON 序列化 ⇒ 键缺席——= null 语义；schema 该键可空且非必填；既定形，不用 epoch 0 占位——0 会谎报 1970 活动）。
  - `title` 保留（`string` 合法；`""` 合法）。`messageCount` **删**（无 schema 位；客户端不可依赖）。
- **验收判据**：有限且 `|v| <= 8.64e15` 的 `updatedAt`（输入 = epoch 数）⇒ 发射值为 ISO 8601 串，且**对发射值**往返恒等——`new Date(emit(v)).toISOString() === emit(v)`（`emit(v)` = `session/list` 条目中该键的发射值）；非法 ∥ 超域 ⇒ 键缺席、方法零抛（`-32603` 不可达）；`messageCount` 键不在。用例 T4–T5。

### 2.3 #873 · `set_config_option` 响应补 `configOptions` + 全形判别键

- **现盘坐标**：`thincoder-cli/src/acp/handlers-session.mjs`——`:268` `set_config_option` 返 `{}`（`SetSessionConfigOptionResponse.required = ["configOptions"]` ⇒ 客户端 parse error）；`:32-36` `CONFIG_OPTIONS` 元素 `{id,name}`（缺 oneOf 判别键 `type` 与现值——`SessionConfigOption` 见 §4.2）。
- **目标形**：
  - `CONFIG_OPTIONS` 常量**替换**为投影函数 `sessionConfigOptions(agent)`（导出——`handlers-slots.mjs` 同源消费）：
    ```js
    export function sessionConfigOptions(agent) {
      const opts = []
      const model = agent?.provider?.model
      if (typeof model === "string" && model) {
        const provider = agent?.provider?.name
        const value = provider ? `${provider}:${model}` : model
        opts.push({ id: "model", name: "Model", type: "select", currentValue: value, options: [{ value, name: value }] })
      }
      const th = agent?.provider?.thinking
      opts.push({ id: "thinking", name: "Thinking", type: "boolean", currentValue: th != null && th.type !== "disabled" })
      opts.push({ id: "mode", name: "Mode", type: "select", currentValue: agent?.planMode ? "plan" : "normal",
        options: [{ value: "normal", name: "Normal" }, { value: "plan", name: "Plan" }] })
      return opts
    }
    ```
  - `thinking` 现值判据 = 「非 off 形」：off 两形 = `null`（effort 族）∥ `{type:"disabled"}`（type 族）——`th != null && th.type !== "disabled"`（与 `thinkOffShape` 两形对应；含 `thinkEnabledValue` 自定义开值族，如 `"adaptive"`）。
  - `model` 不可解析 ⇒ 该项**缺席**（select 的 `currentValue` 必填——无值不可虚构；余两项照常）。
  - 响应点四处同源：`session/set_config_option` `:268` → `{ configOptions: sessionConfigOptions(found.session.agent) }`；`session/new` `:191`、`session/load` `handlers-slots.mjs:114`、`session/resume` `:164` → 同函数（替换 `[...CONFIG_OPTIONS]`）。
  - 通知面（`config_option_update` 全量数组）归 §2.4。
  - 被否：`options` 列全量候选模型（候选集语义未定——spec 表 ∥ 配置渠道 ∥ 用户偏好；登记 §11）；`currentValue` 缺席时虚构占位值（硬造现值 = 假造）。
- **验收判据**：`set_config_option` 响应 = `{configOptions: [...]}`；每项含 `id`/`name`/`type`；select 项含 `currentValue` + `options[]`（元素 `{value,name}`）；boolean 项含 `currentValue`（布尔）；四处响应同形。用例 T6–T8。

### 2.4 #872 · 会话身份与状态同步（G5 收正）

- **现盘坐标**：`thincoder-cli/src/acp.mjs:100-108`（`nextId` 计数器 + `ctx.allocSessionId`）；`handlers-session.mjs:167`（new）/ `handlers-slots.mjs:79-80`（load）/ `:139-140`（resume）三处消费；`handlers-session.mjs:287` 通知 `mode:` ∥ `:266` 通知 `{configId,value}`（均与 schema 相抵）。
- **目标形（id 语义统一）**：
  - **`session id = 持久槽位号字符串**（全族单一命名空间）：
    - `session/new`：**先** `const slot = await newSession(getCwd())`（认领 + 槽文件 + digest——`thincoder-core/session-lifecycle.mjs:226`），`const id = String(slot)`（createSession 的 id 在构造期烧入 callbacks——必须先行）；`session.agent._slot = slot` 由既有点位保留（零改）。
    - `session/load` / `resume`：`const id = String(params.sessionId)`（**客户端原文形态**——同值读回保续）；`sessions.set(id, session)`。
  - **失败回滚（new 的新序引入的孤儿面——必处置）**：`createSession` 抛错 ∥ `_providerInvalid` 分支 ⇒ `deleteSlot(getCwd(), slot)`（既有函数——文件 + manifest 条目 + 认领由 `session-slots.mjs` 单点清理；回滚以 `committed` 旗标守卫：仅在未 `sessions.set` 前生效）。
  - **同 id 在存 ⇒ 处置（new/load/resume 三途同法）**：按 `session/close` 同法处置旧实例（动作 = `cancel()` ∥ `sessions.delete(id)` ∥ 认领释放），再装载——共性理由：防旧实例成为不可达孤儿（同 id 在 Map 上唯一）；load/resume 另：旧实例的钉槽不再计入 `sameProcessPinned`（重载同槽 ⇒ 可正常钉回原槽，不误 fork）。位次按途钉定（下两条）。
    - **load/resume 途替换点钉定（拒载安全）**：替换在既有前置判据（`loadSlotFile` 缺失 `handlers-slots.mjs:64-67` ∥ 工程模式拒载 `:72-77`）**之后**、`createSession` **之前**——拒载路径零副作用（旧实例保留：不 `cancel`、不释放认领——不误杀在飞回合）。
    - **new 途处置点钉定（delete→new 槽号回收面）**：`session/delete` 删档后槽号回流（`thincoder-core/session-slots.mjs:226-229`），`session/new` 复得同号时 `sessions.set(id, session)` 撞**同键在存实例**——旧回合不 cancel、通知串流（D-4 被否类经 delete→new 入口）。
      触发条件：键 = 槽号串而 `_slot` 已与键分离（fork/换钉）的旧实例不受 delete 重钉环处置（`handlers-slots.mjs:211-213` 按 `_slot` 匹配）。
      处置点 = `sessions.set(id, session)` **直前**（`createSession` 成功与 `_providerInvalid` 排除之后）：`const stale = sessions.get(id); if (stale) { stale.cancel(); sessions.delete(id) }`——此前任何一步失败均不改动旧实例。
    - **new 途认领释放位次**：`if (stale) releaseClosedSlot()` 置于 `sessions.set` 与 `committed` 置位**之后**——保留集须含新会话槽（`createSlotReleaser` 保留集 = 在存 Map 槽——`handlers-session.mjs:64-72`）：
      先释后装会把 `newSession` 刚写的新认领当残留释放（`staleClaims` 谓词——`session-slot-claims.mjs:29-35`；认领写入 `session-lifecycle.mjs:273-274`）⇒ 复开 F2 双写窗口；置 `committed` 后 ⇒ 释放失败不误删已建会话。
  - **认领释放单点抽取**：现 `releaseClosedSessionSlot`（`handlers-session.mjs:135-141`）提为 `createSlotReleaser({ getCwd, sessions })` 工厂（导出）——`acp.mjs` 建一次入 `ctx.releaseClosedSlot`（同 `requireConfigured` 先例），new 失败回滚外三处（close ∥ load 替换 ∥ resume 替换）同源消费。
  - **`allocSessionId` / `nextId` 撤除**（零消费者——`acp.mjs` ctx 键删除；两 handler 模块解构同步删）。
  - **通知字段收正**：
    - `session/set_mode` → `update: { sessionUpdate: "current_mode_update", currentModeId: params.mode }`（`CurrentModeUpdate.required = ["currentModeId"]`）。
    - `session/set_config_option` → `update: { sessionUpdate: "config_option_update", configOptions: sessionConfigOptions(found.session.agent) }`（`ConfigOptionUpdate.required = ["configOptions"]`——**全量数组**，非增量 `{configId,value}`）。
  - **不变量（可直接写成断言）**：`session/new` 返回的 id **必定**出现在随后 `session/list` 的条目集（newSession 即写槽文件 + digest）；load/resume 后以原 id 发 `prompt` / `cancel` / `close` / `set_*` 命中该会话（无 `unknown session`）。
  - **边界（如实登记）**：① fork 角——载入遇他进程占用槽 ⇒ 既有 fork 语义（`newSession` 新槽）保持，本次存续期 id 与落盘槽号分离（重载后 list 显示 fork 槽号）；② 未 load 的档位直喂 `prompt` 仍 `unknown session`（语义正解——prompt 认在存会话）；③ 客户端 id 存续期格式假设（`"008"` 类非规范字面按原文注册——同字面读回即可命中）。
  - 被否：保留计数器 + 映射表（双命名空间 = G5 缺陷本体）；被否：load 遇同 id 直接覆盖不处置旧实例（旧实例成不可达孤儿——回合在飞、token 空烧）；被否：load 沿用 fork 分支不做替换（同 id 无法双注册）。
- **验收判据**：§2.4 不变量两条机检（T9–T12）；两处通知字段形状（T13–T14）。

### 2.5 #870 · `session/prompt` 支持 `resource_link`（基线内容块）

- **现盘坐标**：`thincoder-cli/src/acp/handlers-session.mjs:204-206`——仅取首个 text 块；`resource_link` 块丢弃（全仓零命中）；schema 基线句「All agents **MUST** support resource links in prompts」（§4.2）。
- **落点**：新档 `thincoder-cli/src/acp/resource-link.mjs`（拟新增——块解析与内联纯函数面；`node:fs` ∥ `node:url` ∥ `node:path` 叶子级）。
  - 导出：`resolveResourceLink(block, { cwd })`（异步——单块 → 内联段或降级标记）· `buildPromptText(blocks, { cwd })`（异步——聚合）· 常量 `MAX_INLINE_BYTES` / `MAX_INLINE_LINES` / `MAX_INLINE_CHARS`。
- **目标形（`buildPromptText`）**：
  - 文本段 = **首个** `type:"text"` 且 `text` 为字符串的块（首块策略**不变**；「首块」判据微收正为「首个**合法** text 块」——畸形首块不再吞掉后续合法块）。
  - 资源段 = 按数组序逐 `resource_link` 块调 `resolveResourceLink`；段间 `\n\n` 连接；文本段在前、资源段随后（保序）。
  - 空结果 ⇒ 既有错误通道（`-32602`，message 收正为 `prompt requires a text or resource_link content block`）。
- **目标形（`resolveResourceLink` 判定树——逐态可机检）**：
  1. `uri` 非字符串 ⇒ 标记 `missing uri`（路径位取 `block.name ?? "unknown"`）。
  2. `new URL(uri)`：
     - 成功 ∧ `protocol === "file:"` ⇒ 路径 = `decodeURIComponent(url.pathname)`；UNC 主机（`hostname` 非空且非 `localhost`）⇒ `//<host><path>`；否则 `/C:/…` 形式剥前导 `/`（Windows 盘符）；解码失败 ⇒ 标记 `invalid percent-encoding`。
     - 成功 ∧ 非 file 协议 ⇒ 标记 `unsupported scheme`（路径位 = 原 uri）——含**裸盘符形**（`C:\…` / `C:/…`：`new URL` 成功、protocol = 单字母 `c:` ⇒ 本支；盘符剥前导 `/` 收正仅对 `file:` 形生效）。
     - 失败 ⇒ 按纯路径处理（整串百分号解码；失败 ⇒ `invalid percent-encoding`）——**相对路径按 cwd 解析**（`path.resolve(cwd, p)`）——含**非 URL 形带片段**（如 `docs/a.md#L10-L20`：片段并入路径、**不解析选区**——选区只从 `url.hash` 取出；通常 `unreadable`）。
  3. 选区（仅 `url.hash`，格式 `#L<a>` ∥ `#L<a>-<b>` ∥ `#L<a>:<b>`（`b` 可带 `L` 前缀）——含 `#L5:15` / `#L10-L20` 两观察形）：`a`/`b` 均 1 基闭区间；`b < a` ⇒ 标记 `invalid selection`；`a > 总行数` ⇒ 标记 `lines out of range`；`b` 超尾 ⇒ 截到总行数。
  4. 读面：`stat` 失败 ⇒ 标记 `unreadable`；非普通文件 ⇒ `not a regular file`；`size > MAX_INLINE_BYTES`（10MB，**文件级**——先于读取）⇒ `too large (>10MB)`；读取抛错 ⇒ `unreadable`；缓冲含 NUL 字节 ⇒ `binary (NUL byte)`。
  5. 载荷级上限（**选区时作用于选区切片**，整文时作用于全篇）：行数 > 2000 ⇒ `too many lines (>2000)`；字符数 > 100k ⇒ `too long (>100000 chars)`。
  6. 成功形（两态）：
     - 整文：`[File: <path>]` + 换行 + ` ``` ` 围栏代码块（内容原样，围栏无语言标记）。
     - 选区：`[File: <path> lines <a>–<b>]` + 同围栏。
     - `<path>` = 解码后解析的绝对路径（平台原生分隔符——可直接喂 `read` 工具）。
  7. 标记形（单行，无围栏）：`[File reference: <path> — <reason>]`——`<reason>` ∈ 上列**固定词表**：
     `unsupported scheme` / `missing uri` / `invalid percent-encoding` / `unreadable` / `not a regular file` / `too large (>10MB)` /
     `binary (NUL byte)` / `too many lines (>2000)` / `too long (>100000 chars)` / `invalid selection` / `lines out of range`；
     块间独立——单块失败不影响他块。
- **语义裁定（三条）**：
  - **无 cwd confine**：用户显式 @ 引用可读任意绝对路径——与 `read` 工具同界（`thincoder-core/tools/shared.mjs:291-302`：confinement 已于 2026-09-02 撤除；trust model + 审批门为界——读操作只读，不触发审批）。
  - **无需能力位**：`resource_link` 属基线 MUST（非 `PromptCapabilities` 项）——零门控、零声明变更；`embeddedContext` 维持 `false`（`resource` / image / audio 块丢弃照旧）。
  - **上限量级与 `read` 同源**：行上限直引 `MAX_READ_LINES`（`@thincoder/core/tools/shared.mjs:21` = 2000）；字节 10MB / 字符 100k = 本面常量（同量级，常量住 §2.5 落点新档）。
- **接线（handlers-session.mjs）**：
  ```js
  const blocks = Array.isArray(params?.prompt) ? params.prompt : []
  const text = await buildPromptText(blocks, { cwd: getCwd() })
  if (!text) return { error: { ...ACP_ERRORS.INVALID_PARAMS, message: "prompt requires a text or resource_link content block" } }
  ```
- **验收判据**：T15–T20（正常 ∥ 边界 ∥ 降级 ∥ 上限 ∥ 无文本仅引用）。
- **登记（§11 详表）**：多块 text 合流（首块策略残项）· 总量无闸（N 块各自独立上限）· 块级 `title/description/mimeType/size/annotations` 字段不消费 · 两形（裸盘符 ∥ 非 URL 形带片段——行为 = 上判定树，降级不中断）。

## 3. 接口契约（收正后形状）

### 3.1 `session/update` 通知（本批触及项）

| 通知 | 收正后形状 |
|---|---|
| `usage_update` | `{ sessionUpdate: "usage_update", used: <int ≥0>, size: <int ≥0> }` |
| `config_option_update` | `{ sessionUpdate: "config_option_update", configOptions: [<全形见 §3.3>] }`（全量数组） |
| `current_mode_update` | `{ sessionUpdate: "current_mode_update", currentModeId: "plan" ∥ "normal" }` |

### 3.2 `session/list` 条目（收正后）

```json
{ "sessionId": "<槽位号字符串>", "cwd": "<绝对路径>", "updatedAt": "<ISO 8601>", "title": "<标签 ∥ 空串>" }
```

- `updatedAt` 非法 ∥ 超域（非有限 ∥ `|v| > 8.64e15`）⇒ 键缺席；`messageCount` 不存在。

### 3.3 `configOptions` 全形（响应 ∥ 通知共用——单源 `sessionConfigOptions`）

```json
[ { "id": "model",    "name": "Model",    "type": "select",  "currentValue": "<provider:model>", "options": [ { "value": "<同上>", "name": "<同上>" } ] },
  { "id": "thinking", "name": "Thinking", "type": "boolean", "currentValue": true },
  { "id": "mode",     "name": "Mode",     "type": "select",  "currentValue": "normal",
    "options": [ { "value": "normal", "name": "Normal" }, { "value": "plan", "name": "Plan" } ] } ]
```

- `model` 项在模型不可解析时缺席；数组序 = model（在位时）→ thinking → mode。

### 3.4 会话 id 语义（不变量）

- `session id` = 持久槽位号字符串（`session/new` 返回 ∥ `list` 条目 ∥ `prompt/cancel/close/set_*` 认领——**同一命名空间**）。
- `session/load` / `resume`：id 沿用客户端传入值（响应无 `sessionId` 字段——id 不变语义）；同 id 在存 ⇒ 旧实例按 close 同法替换。
- 建档不变量：`session/new` 的返回 id ∈ 随后 `session/list` 的 sessionId 集。

### 3.5 `session/prompt` 内容块处理（收正后）

- `text` → 首个合法块取其 `text`；`resource_link` → §2.5 解析（内联 ∥ 降级标记）；其他类型（image/audio/resource）→ 丢弃（能力位与基线语义不变）。
- 聚合空 ⇒ `-32602`。逐块失败降级**不中断**整体（对模型可见「引用过」。

## 4. 规范依据（本批复取 · 逐字摘录）

### 4.1 复取与复核

- 来源 = `agentclientprotocol/agent-client-protocol` · `main` 分支 · `schema/v1` 目录的 v1 schema（`gh-proxy.com` 镜像，命令同 `docs/batches/2026-09-18-acp-external-drivers.md` §2.8）。
- **本批复取（2026-10-04）：247168 字节 · SHA256 `3c17bd6385d90cf672d8a661fddc359d73422cf8b8ce6865213d25cfd4c0eca7` · 170 `$defs`**——与 2026-09-18 记值**逐字相同** ⇒ 字段级结论同 as-of 有效（16 日零漂移）。
- 复核方式：按上行命令复取 → sha256 逐字比对；不一致 ⇒ 字段面按新 as-of 重核后再实施。

### 4.2 相关 `$def` 摘录（本批结论依赖面——逐字）

```text
UsageUpdate — required = ["used","size"]；used:「Tokens currently in context.」（integer uint64 ≥0）；size:「Total context window
  size in tokens.」（同型）；cost 可选。
SessionInfo — required = ["sessionId","cwd"]；updatedAt:「ISO 8601 timestamp of last activity」（string|null）；title（string|null）；
  properties 无 messageCount。
SessionConfigOption — required = ["id","name"]；oneOf（判别键 type）：
  ① select：required = ["type"] + SessionConfigSelect.required = ["currentValue","options"]（options 元素 SessionConfigSelectOption
     required = ["value","name"]）；② boolean：required = ["type"] + SessionConfigBoolean.required = ["currentValue"]。
SetSessionConfigOptionResponse — required = ["configOptions"]（full set）。
ConfigOptionUpdate — required = ["configOptions"]:「The full set of configuration options and their current values.」。
CurrentModeUpdate — required = ["currentModeId"]。
LoadSessionResponse / ResumeSessionResponse — properties = modes / configOptions / _meta；无 sessionId；required 无。
ContentBlock · resource_link —「References to resources that the agent can access. All agents MUST support resource links in prompts.」
PromptRequest.prompt —「the Agent MUST support ContentBlock::Text and ContentBlock::ResourceLink, while other variants are optionally
  enabled via PromptCapabilities.」
PromptCapabilities.embeddedContext — type boolean, default false（image / audio 同）——baseline = text + resource_link。
SessionUpdate — oneOf 判别键 sessionUpdate（含 current_mode_update / config_option_update / usage_update 三值在位）。
```

## 5. 同拍收正面（`docs/cli/design/ACP-CLIENT.md`——实施轮，落点 = 落笔时读回；此处给目标文本）

| # | 现落点（as-of 本设计轮） | 目标文本（要点逐字） |
|---|---|---|
| R1 | `:37` §2.1 session/new 行 | 返回 `{ sessionId, configOptions }`；`sessionId` = 本进程内该会话的持久槽位号（G5 收正）；`configOptions` = 全形（§11.3） |
| R2 | `:114` §3.3 list 行 | `{ sessionId, cwd, updatedAt(ISO 8601), title }`（`messageCount` 已剔——非 SessionInfo 字段）；`sessionId` 取值 = 持久化槽位号——即**全族统一身份**（§11.3） |
| R3 | `:115-116` §3.3 load/resume 行 | 增一句：**会话 id 沿用客户端传入值**（响应无 `sessionId`——id 不变语义）；同 id 在存 ⇒ 旧实例按 close 同法替换 |
| R4 | `:152` §3.5 ctx 键行 | `{ getCwd, sessions, notifyRef, requestRef, createSession, requireConfigured, releaseClosedSlot, log }`（`allocSessionId` 撤） |
| R5 | `:153` §3.5 句 | 会话 id = 持久槽号（load/new 同命名空间；`releaseClosedSlot` = 认领释放单点） |
| R6 | `:180` §5 映射行 | `usage_update` `{ used, size }`（used = prompt ∥ completion 之和；size = 上下文窗口——`providerSpec(agent.provider).context`） |
| R7 | `:490-491` §11.3 契约 bullet | `SessionConfigOption` 全形（required [id,name] + oneOf select/boolean 判别键 `type`：select 另需 `currentValue`+`options`；boolean 需 `currentValue`）；`SessionInfo.updatedAt` = ISO 8601 字符串 |
| R8 | `:523` §11.3 响应统一形状句 | `configOptions` 条目 → 全形（`{id,name,type,currentValue,options?}`） |
| R9 | `:525-527` §11.3 id 命名空间段 | 改述为**统一现态**：id = 持久槽位号（G5 已收正——load/new 同命名空间）；同 id 重载替换；fork 角如实注 |
| R10 | `:619` / `:620` / `:631` §11.9 | G5 行删、G6 行删（无效化表述即删）；`:631` 登记项 3 改述：resource_link 已接；余多块 text 合流待立批 |

- 变更记录（`docs/cli/design/ACP-CLIENT.md`）同轮补一行（日期 + 收正点）。
- **API-CONTRACT 再生**（导出面变动：`CONFIG_OPTIONS` 撤、`sessionConfigOptions` / `createSlotReleaser` / `resolveResourceLink` 增）：`node scripts/api-contract.mjs --write`（生成区机械笔）。

## 6. #862 裁定：拆批（含后续批 scope 草案）

- **裁定 = 拆出另批**（本批不实施）。理由四条：
  1. **面在新机制不在修补**：结构化子代理事件 = ACP **契约外的扩展契约**（`session/update` 载荷 `_meta` 通道——候选形；非标 `sessionUpdate` 枚举值已否：严格客户端反序列化风险）——「新机制 ⇒ 全链」，且形状决策需要独立设计轮与用户可见契约文档。
  2. **跨层依赖**：状态源（`⟦ev⟧` 事件族 8 名——`async ∥ queued ∥ turn ∥ cancelled ∥ stopped ∥ settled ∥ done ∥ approval`）现状为显示面消费（CLI TUI / VSC / 桌面桥三处各自解析）——提升为**核内机读单源**是前置件（本批声明面 = `src/acp/**`，不含核面）。
  3. **客户端契约在外**：需求本义 = ACP 客户端侧活动面板前置件——服务端交付物含面向客户端（Zed 侧）的接口说明（跨仓消费者）。
  4. **体量档不同**：其余四条 = schema 逐键对位小件；混批会拉长评审/验证面。
- **后续批 scope 草案（供另批设计轮起点——非本批承诺）**：`_meta.subagent = { role, id, state?, progress? }` 候选形（role/id 自 relay 前缀 `parseRelayPath`；state 自事件族状态机；progress 自 `⟦ev⟧turn` 轮号形）；前置件 = 事件文法机读单源 + `_meta` 契约文档；被否候选 = ① 非标 `sessionUpdate` 新枚举值 ② 结构化与文本剥离同轮改（本批剥离语义零改）。
- **登记去向**：台账 #862 维持「待设计」；另批由父侧排程（批名建议 `acp-subagent-events`）。

## 7. 受影响文件与行数预算

口径 = 行数实读（as-of 2026-10-04 本设计轮）；Δ = 预期增量（实施轮按盘回填）。

| 文件 | 现行 | Δ | 预算 | 改动点 |
|---|---|---|---|---|
| `thincoder-cli/src/acp/bridge.mjs` | 397 | +~9 | ~406 | `:208` onUsage 收正；`:62` 签名增 `agent`；`:10` 头注；import `providerSpec` |
| `thincoder-cli/src/acp/session.mjs` | 54 | +1 | 55 | `:22` 调用点传 `agent` |
| `thincoder-cli/src/acp/handlers-session.mjs` | 292 | +~55（含 −~15） | ~345 | `:32-36` 常量 → `sessionConfigOptions` + `createSlotReleaser` 导出；`:167` new 重排 + 回滚；`:204-206` prompt 接线；`:266`/`:287` 通知收正；`:191`/`:268` 响应 |
| `thincoder-cli/src/acp/handlers-slots.mjs` | 196 | +~20 | ~216 | `:47-53` list 条；`:79-80` / `:139-140` id；load/resume 替换逻辑；`:114`/`:164` 响应 |
| `thincoder-cli/src/acp/resource-link.mjs` | 新 | ~130 | ≤300 | §2.5 判定树全量（拟新增） |
| `thincoder-cli/src/acp.mjs` | 151 | −2 | ~149 | `:100-108` 计数器与 ctx 键撤除；ctx 增 `releaseClosedSlot` |
| `docs/cli/design/ACP-CLIENT.md` | 655 | +~15 | ~670 | §5 表十处 + 变更记录（随动——实施轮） |
| `docs/cli/design/ACP-PROTOCOL-COMPLIANCE.md` | 本档 | — | — | 本批设计（已落） |
| `docs/core/design/API-CONTRACT.md` | 2961 | 重生成 | — | `node scripts/api-contract.mjs --write` |
| `docs/batches/2026-10-04-issue-fix-round2.test.mjs` | 新 | ~290 | ≤300 | 批内单测（§10；拟新增） |
| `docs/cli/requirements/ACP-CLIENT.md` | 151 | 补笔 | — | R-A5.4 补述 + 新判定句——**主 agent 笔**（§1.3） |

## 8. 关键决策记录（含被否）

- **D-1 `size` = `providerSpec(agent.provider).context`**（上下文窗口；含 provider 级 `context` 覆写）∥ 被否：`provider.maxTokens`（输出上限——语义相抵）∥ 被否：`specForModel().context`（漏 `providers[].context` 覆写单源）∥ 被否：硬编码 131072。
- **D-2 `used` = prompt + completion 之和**（issue 参考值）∥ 被否：仅 prompt（低估当前上下文）。
- **D-3 session id = 持久槽位号**（单一命名空间）∥ 被否：计数器 + 双命名空间（G5 缺陷本体）∥ 被否：UUID 类新身份（与槽位族两张皮）。
- **D-4 load/resume 同 id 在存 ⇒ 替换（close 同法）**∥ 被否：静默覆盖（旧实例成不可达孤儿）∥ 被否：报错拒载（双开 UX 破坏）。
- **D-5 new 先认领、失败 `deleteSlot` 回滚**（id 构造期依赖槽号，顺序不可逆）∥ 被否：认领留孤儿（槽被占、清单污染）∥ 被否：仅释放认领不删档（空档文件残留）。
- **D-6 `configOptions` 单源投影函数**（四处响应 + 两处通知同源）∥ 被否：静态常量补 `type`（无法投影现值——`currentValue` 就地失真）。
- **D-7 model 项不可解析 ⇒ 缺席**（`currentValue` 必填不可虚构）∥ 被否：占位值 ∥ 被否：空串现值。
- **D-8 `resource_link` 内联**（读文件进 prompt）∥ 被否：仅给路径文本（kimi 式——本仓取 issue 建议的内联形：模型立即可见内容）∥ 被否：XML 包装（kimi 非 file 面——另形混入）。
- **D-9 上限三态 = 拒绝降级**（超限不发内容发标记）∥ 被否：截断（模型误以为全文）；字节闸 = 文件级 ∥ 行/字符闸 = 载荷级（选区小文件大 ⇒ 仍可内联）。
- **D-10 降级标记固定词表**（`[File reference: … — <reason>]`）∥ 被否：自由文案（机检面失锚）。
- **D-11 `resource_link` 零能力门控**（基线 MUST）∥ 被否：挂 `embeddedContext`（张冠李戴——该位管 `resource` 嵌入式）。
- **D-12 `messageCount` 删除**（契约形状收敛）∥ 被否：保留（无 schema 位——收敛原则）。
- **D-13 #862 拆批**（§6 四理由）∥ 被否：本批做 role/id 半切片（冻结半契约——状态/进度词表未定）。

## 9. 验收对照（回指批条目）

| 判据 | 机检项 | 用例 |
|---|---|---|
| AC-1（#871a） | 每条 `usage_update` 含整数 `used`/`size`；`used` = prompt+completion；`size` = 规格 context ∥ 128_000 兜底 | T1–T3 |
| AC-2（#871b） | `updatedAt` ISO 往返恒等 ∥ 非法 ∥ 超域键缺席；`messageCount` 键不在 | T4–T5 |
| AC-3（#873） | `set_config_option` / `new` / `load` / `resume` 响应 `configOptions` 全形（判别键 + 现值 + select `options`） | T6–T8 |
| AC-4（#872） | new id ∈ 随后 list；load/resume 原 id 全方法命中；同 id 在存处置（load/resume/new 三途）；两通知字段收正 | T9–T14 |
| AC-5（#870） | 整文 ∥ 选区内联形；降级词表；上限三态；无文本仅引用可走；无 confine | T15–T20 |
| AC-6（面） | 批内件全绿（先红后绿）+ `node scripts/doc-check.mjs` exit 0 + 语法检查 | 命令面 |
| AC-7（#862） | 拆批裁定在档（§6）+ 台账维持待设计 | 记录面 |

## 10. 用例表（批内单测件——先红后绿）

宿主 = `docs/batches/2026-10-04-issue-fix-round2.test.mjs`（拟新增；自 `thincoder/` 仓根跑 `node --test`；不入仓套件）。夹具 = 临时 cwd 沙箱（`_setSessionsDirForTest` 邻位缝 + USERPROFILE/HOME 隔离——先例 = 批内件同法）。

| # | 类 | 输入 | 期望 |
|---|---|---|---|
| T1 | 正常 | 直驱 `buildAcpCallbacks`（stub agent `{provider:{model:"kimi-k3"}}`）+ `onUsage({prompt_tokens:100,completion_tokens:50})` | 通知 `{used:150,size:1000000}` |
| T2 | 边界 | usage 缺字段 ∥ `{}` | `{used:0, size:<规格>}`——零抛 |
| T3 | 边界 | 未知模型 ∥ 无 provider | `size` = 128_000 兜底 |
| T4 | 正常 | list 夹具（槽 meta `updatedAt` = epoch 数） | `updatedAt` = ISO 串且往返恒等；`messageCount` 键缺席 |
| T5 | 边界 | meta `updatedAt` 非有限 ∥ 超域（`|v| > 8.64e15`） | `updatedAt` 键缺席；list 零抛 |
| T6 | 正常 | `set_config_option`（model/thinking/mode 各一次） | 响应 `{configOptions}` 全形（判别键/现值/options） |
| T7 | 正常 | `session/new` ∥ `load` ∥ `resume` | 三响应 `configOptions` 同形 |
| T8 | 边界 | provider 无 model | model 项缺席；thinking/mode 在 |
| T9 | 正常 | `session/new` → `session/list` | 返回 id = 槽号串；∈ list 集（不变量） |
| T10 | 正常 | `session/new` → 新 handler 实例（模拟跨进程）`load(同 id)` → 原 id `prompt` | 全链命中（无 unknown session） |
| T11 | 正常 | `resume(同 id)` → 原 id `cancel`/`close` | 命中；close 后释放认领 |
| T12 | 边界 | 同 id 二次 load ∥ 同 id 在存 + 拒载形（槽文件缺失 ∥ 工程模式拒载）∥ delete→new 回收槽号（旧实例在存） | 旧实例被替换（cancel 被调、Map 单条）；钉槽不误 fork ∥ 拒载时旧实例保留（cancel 未触——零副作用）∥ delete→new：旧实例被处置（cancel 被调、Map 单条） |
| T13 | 正常 | `set_mode` | 通知 `currentModeId`（非 `mode`） |
| T14 | 正常 | `set_config_option` | 通知 `configOptions` 全量数组（非 `{configId,value}`） |
| T15 | 正常 | prompt = [text, resource_link(file:// 整文)] | 文本在前；`[File: …]` + 围栏全文 |
| T16 | 边界 | `#L10-L20` ∥ `#L5:15` ∥ 尾越界截断 | 选区行数正确；`lines a–b` 头 |
| T17 | 边界 | 百分号编码路径 ∥ Windows 盘符形 ∥ 相对路径（按 cwd） | 路径正确解析并读出 |
| T18 | 降级 | 不存在文件 ∥ `zed://` ∥ https ∥ 非法选区 ∥ 行越界 | 各出对应 reason 标记（词表逐字） |
| T19 | 上限 | >2000 行 ∥ >100k 字符 ∥ 含 NUL ∥ >10MB（sparse 造件） | 各出对应上限标记 |
| T20 | 错误 | 空 prompt ∥ 仅 image 块 | `-32602`（文案收正）；仅 resource_link（无 text）**可走**（并入 T15 腿） |

## 11. 边界（本批不做）

- 不改协议版本 / 不新增方法 / `initialize` 形状零动（不新增能力字段）。
- prompt 多块 text 合流（首块策略仍存——残登记）；image / audio / `resource`（嵌入式）丢弃照旧（`embeddedContext` 维持 `false`）。
- `resource_link` 块级 `title/description/mimeType/size/annotations` 字段不消费（只用 `uri`/`name`）。
- model select 候选模型列表不供货（`options` = 现值单项——候选机制登记）。
- `usage_update` 的 `cost` 不供（无成本数据源）。
- 会话 id fork 角（他进程占用 ⇒ 本次存续期 id 与落盘槽号分离——如实登记，不新增语义）。
- delete→new 槽号回收面（`session/delete` 后 `session/new` 复用槽号）：同键在存 ⇒ 处置（定形 §2.4——`cancel` ∥ 删键 ∥ 认领释放，释放位次 = `sessions.set` 后）；id（槽号串）复用属既有槽号分配语义——复用后即新会话。
- load/resume 替换的装配失败面：`createSession` 抛错 ⇒ 旧实例已撤、新实例未建（§2.4 只保证前置判据拒载零副作用）；恢复方案未定——登记（不新增语义）。
- 多引用块**总量无闸**（各块独立上限——登记候选）。
- `resource_link` 两形登记（行为按实装钉——均**降级不中断**）：① 裸盘符形（`C:\…` / `C:/…`）⇒ `unsupported scheme` 标记；② 非 URL 形带片段 ⇒ 片段并入路径、不选区 ⇒ 通常 `unreadable`。
- #862 全项（拆批——§6）。
- `thinking` 的 `currentValue` = **本地显式档**语义——`undefined`（未显式设置）⇒ `false`（§2.3 判据式 `th != null && …` 如此）；`thinkAlwaysOn` 族（`thincoder-core/model-specs.mjs:69`）为本地档、非服务端生效态——不探测服务端侧生效状态（登记）。

## 12. 落定与实施注意

1. **前置** = #51 收口后派发（写域让渡——`thincoder-cli/src/**` ∥ `docs/cli/design/ACP-CLIENT.md`）。
2. 实施轮首步 = §4.1 复取 schema 复核（SHA 不一致 ⇒ 停下重核字段面）。
3. 批内件先红后绿；`node scripts/doc-check.mjs` 复跑 exit 0 为验收项。
4. 同拍收正 `docs/cli/design/ACP-CLIENT.md`（§5 表十处）+ `node scripts/api-contract.mjs --write`（生成区再生）。
5. 需求面补笔 = 主 agent 笔（§1.3 / §7 表末行）——实施轮零触需求档。
6. 边界登记（§11 各项）随收口入台账（父侧）。
7. **修正轮实施令（交付登记 号 1 ∥ 号 2 收正——本档定形）**：① `session/new` 同键处置（§2.4——处置点 = `sessions.set` 直前；认领释放随 `sessions.set`/`committed` 之后）；② `session/list` `updatedAt` 值域钳（§2.2）；批内件随补 T5 超域腿 + T12 delete→new 腿（先红后绿）。

## 变更记录

**2026-10-0x 批次落点指针**（本档涉批——落点表 = 各批档 §2 · 一次性材料承载面）：
**本批（issue 修复批·二 · 2026-10-04）落点表** = `docs/batches/2026-10-04-issue-fix-round2.md` §2（唯一承载面——一次性批次材料）。

- 2026-10-08（**代码长度上限 500/800 口径更换批 · 实施轮 · eng-coder**——承 `docs/batches/2026-10-08-code-limit-500-800.md` §2 · 台账 #1072）：§7「拆分评审」块删（丙——两档现读 ≤500，义务前提消失；含 `bridge.mjs` 同注）；§7 表两处 ≤300 预算格 = 闭合批叙述面（B 史实保留 ⇒ 零动）。**零协议语义**（文档面 · 可 revert）。

- 2026-10-04（**issue 修复批·二 · 设计轮 · eng-designer**——承批档 `docs/batches/2026-10-04-issue-fix-round2.md` §1 · 台账 #870 ∥ #871 ∥ #872 ∥ #873）：建档——① 复验 5/5 在档（§1.2）；② 四条收正目标形（usage_update ∥ list updatedAt ∥ configOptions 全形 ∥ 会话 id = 持久槽号 + 两通知字段）+ resource_link 基线支持（新档拟新增）；③ schema 复取复核（SHA 逐字同 2026-09-18）；④ ACP-CLIENT.md 同拍落点表；⑤ #862 拆批裁定 + 后续批 scope 草案。
- 2026-10-04（**fix 轮 · 设计评审 #66 号 1–5 收正 · eng-designer**）：§1.2 行锚收正（`acp.mjs:101,108`）∥ §2.2 判据改发射值往返恒等 ∥ §2.4 增「替换点钉定（拒载安全）」+ §10 T12 拒载腿 ∥ §7 增拆分评审（本批不拆 + 后续拆分点；`bridge.mjs` 同注）∥ §11 增 thinking 语义登记。号 6 = 判据降级限制声明（保持）。
- 2026-10-04（**fix 轮 · 交付登记四条（#75）收正 · eng-designer**——父侧裁定：① ② 就地修 ∥ ③ 记录接受 ∥ ④ 逐条登记）：§2.2 增**值域钳**（非法 ∥ 超域 ⇒ 键缺席 = null 语义）∥ §2.4 增 new 途处置点钉定 + 认领释放位次 ∥ §2.5 增两形行为（裸盘符 ∥ 非 URL 形带片段）∥ §11 增三登记行 ∥ §3.2 / §9 / §10 / §12 随动。
