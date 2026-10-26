# 设计评审凭证结算（DESIGN-TOKEN-SETTLEMENT）· 需求

> 板块 = **设计评审凭证结算**（settle 当场落盘 / 门禁读权威 / 废旧镜像）。
> 本档 = 该机制的**需求层权威**（F-D1–F-D6 / N-D1–N-D4 判定句）。
> 设计侧 = `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md`（实现坐标 / 双端与依赖方向——本档不重述，D2）。
> 关联面 = `ENG-TOKEN-BINDING.md`（凭证语义 / TTL——同层）· `docs/core/design/ENG-TOKEN-BINDING.md`。

## 1. 总体定位

async 设计评审通过后签发的 token / designId 必须在**挂起会话、同进程后续回合、进程重启 resume** 后可靠到达 spawn eng-coder 的校验门——
settle 即落盘权威台账；凭证值只进槽文件（会话态），永不进文档。

## 2. 功能性需求

| # | 需求 | 判定句（验收语义） | 范围边界（不做） |
|---|---|---|---|
| **F-D1** | **settle 当场落盘（结算可靠）**：settle = 唯一结算点——同步写槽文件权威台账；写失败 = settle 失败（可重评，不静默吞错）；内存 Map 降级为当前进程缓存（每次 run 从权威水合）。证据 = `thincoder-vscode/src/agent-tools/advisor-async.mjs:363-392` | settle 后：① 同进程后续回合 spawn 通过；② 挂起会话 digest 回合 spawn 通过；③ 重启 resume 后 spawn 通过——均不再 `designId not found`。用例 = 当批定向单测（`docs/batches/<batch>-<topic>.test.mjs`——收口随批删；常驻测试档不存在，另账） | 不做 fire-and-forget 落盘；token 值不落文档（N-D1） |
| **F-D2** | **门禁读权威（miss 回读）**：spawn 门读内存 Map，miss 回读槽权威台账（reconcile）；TTL 过期永不授权（fail-closed）；not found 机械拒（错误串含在持 id 概览）。证据 = `thincoder-vscode/src/agent-tools/subagent-spawn-gate.mjs:40-58`（现体 = 核 `thincoder-core/agent-tools/subagent-spawn.mjs:112` `resolveDesignSlot`） · `:71-82` | 内存 miss + 槽有 → 通过（回读生效）；槽空 → 拒（not-found）；过期 → 清理 + 拒。用例 = 同上（D4 组） | 不改门禁拒值文案语义；不给过期项授权通道 |
| **F-D3** | **写侧不误清 / 不覆盖**：空态保存不把 settle 已落盘值钉 null；保存 = union 合并（同 key 以新 mint 者胜——expiresAt 比较；槽独有项保留）。证据 = `thincoder-vscode/src/extension/session-slot-write.mjs:153-166` · `thincoder-vscode/src/extension/panel-session.mjs:110-113` | 空态 save → 槽值保留；忙时非全量 save → 槽独有项不丢；同 key → 后 mint 胜（双向）；不可证新者不覆盖槽。用例 = 同上（D2 / D6 组） | 空态不当清空指令；consume / TTL / new 之外的清理不做（union 不复活 consume 已清项） |
| **F-D4** | **废单值镜像**：`_engDesignToken` 单值镜像退役——settle 不写 / 水合不恢复 / consume·TTL·new 不清；唯一一次性迁移读（槽有残留且 Map 空）。证据 = `thincoder-vscode/src/agent/agent-state.mjs:43-46` · `:102-104` · `thincoder-vscode/src/agent/run-helpers.mjs:222-242` | 运行时零镜像读写（迁移读点单处）；写门 / 门禁不再读镜像。用例 = 同上（镜像面） | 不恢复镜像双真相；历史文档提及保留（形态面另论） |
| **F-D5** | **写门资格 = 任一活槽**：工程模式父侧写产品代码前判定 = 任一未过期格式有效 token 存在（内存 Map 或槽回读）——fail-closed。证据 = `thincoder-vscode/src/agent/tool-gates.mjs:29-53` | 有任一活槽 → 放行；无 → 拦（错误串指向 advisor 设计评审路径）；畸形 / 过期不构成活槽。用例 = 同上 + `docs/core/design/DESIGN-TOKEN-SETTLEMENT.md` 验收 | 不做单值判据；不放宽畸形 token |
| **F-D6** | **链终消费**：`consume-design` 动作清槽（单 designId / 无 id 清整账本）；消费后同 id spawn 机械拒。证据 = `thincoder-vscode/src/agent-tools/subagent-spawn-gate.mjs:139-170`（现体 = 核 `thincoder-core/agent-tools/design-slots.mjs:110`（`executeConsumeDesignAction`）） · `thincoder-vscode/src/agent/tool-gates.mjs:117-126` | consume 后同 id spawn → 拒（机械）；单设计会话无 id → 整账本清。用例 = 同上（D2 ① 组） | 不清兄弟 designId（单键清）；consume 不并入 control 豁免（planMode 拒绝——与 cancel 不同门） |
| **F-D7** | **凭证带批归属**：签发时记录该凭证所属的批——槽文件旁列 `engDesignTokenBatches`（键 = designId，值 = 批档路径）；闸与收口据此判「本批」。存量无旁列的槽 ⇒ 批列如实 `—` | 签发后槽文件含该 designId 的批路径；旁列缺 ⇒ 清点批列显 `—`（不误判为某批） | 不为恢复便利扩槽记录字段（§5 那条 2026-10-17 裁定仍有效——旁列承载归属、非恢复） |
| **F-D8** | **收口自动消费**：`batch` 的 `close` ∥ `status §1→已收口` 两通路，在写状态行**之前**消费本批全部凭证；消费失败 ⇒ 拒 close（不留「已收口而凭证仍在」的窗口） | 收口后该批无活槽；消费失败时 close 被拒且状态行未变 | 不改 `thincoder-core/agent/dispatch.mjs` 的放行条件 ∥ 不改 F-D5「任一活槽」语义 ∥ 不改 TTL |
| **F-SL1** | **槽位清点（只读）**：`subagent` 增只读 action `design-slots`——槽文件权威表 ∪ 内存 Map 并集（同 id 冲突以槽为准——D-S3 同源）、逐槽一行（designId ∥ live / expired ∥ 龄 ∥ 到期 ∥ 批列 ∥ `designToken`——令牌列判据见 F-SL3）、**零写**（不 reconcile 回写 / 不落盘）；批列 = 槽文件旁列 `engDesignTokenBatches` 优先、会话内评审注册表兜底（两处皆无 ⇒ 如实降级 `—`；旁列形 = F-D7）；工程模式父侧限定（同族门） | 用例 = **当批定向单测**（`docs/batches/<batch>-<topic>.test.mjs`，U-SL 组；收口随批删——常驻测试档当前不存在，既有缺口在账） | 不做写面（清点纯读）；批列跨重启可得（F-D7 旁列）；无旁列的存量槽 ⇒ `—`（如实降级） |
| **F-SL2** | **批量消费选择器**：`consume-design` 增批量选择（**恰一**：`designId` ∥ `designIds` ∥ `expired` ∥ `olderThanDays`——fail-closed 不猜）；目标集按并集视图解析 → 逐枚移出 → **单次**落盘；落盘失败 ⇒ 内存快照整体回滚（不留半消费态，可重试）；单枚形态语义 / 拒文 / 回执**逐字不变** | 用例 = 同上 U-SL 组（设计 §9 / F-SL2） | 选择器不猜（缺 / 多 ⇒ 拒）；不复活已消费项 |
| **F-SL3** | **清点面直读（token 不藏）**：`design-slots` 逐槽**恒显** `designToken`（live ∥ expired 同显——`status` 列已标态；记录畸形 ⇒ `—`）；保留 `designId` 过滤（trim 后精确匹配；空串视同缺省；未知 ⇒ 拒 + 列在场 id）；**零 reveal 开关 ∥ 零掩蔽 ∥ 零一次一槽约束**（用户 2026-10-17 19:26 裁定「没必要把 token 藏起来，agent 要就告诉他」） | 用例 = **当批定向单测**（`docs/batches/<batch>-<topic>.test.mjs`）：清点行含 token 值 ∥ `designId` 过滤 ∥ 未知 id 拒 ∥ 畸形 `—` ∥ 删除面机检（两源档 + 描述档 `grep -c reveal` = 0） | 不做专用取用读口（清点面即取用面：值随槽行直接给出）∥ 不做批量读取限制（清点即批量面）∥ 不做 spawn 门自动解析（凭证语义保持——designId 非凭据）；签发链（mint / settle / TTL / persist）零改 |

## 3. 非功能性需求

| # | 维度 | 标准 | 度量方式 |
|---|---|---|---|
| **N-D1** | 凭证不落文档 | token / designId 值只进槽文件（会话态）——设计 / 需求 / 批次档零值 | 设计侧验收巡检；文档面 grep 零凭证值 |
| **N-D2** | 跨进程存活 | 槽文件 = 权威台账（持久）；进程重启 resume 后可结算 | 用例 = 当批定向单测（重启面 / 挂起会话 digest；收口随批删） |
| **N-D3** | 双端同源 | 与对端同机制语义（settle 即落盘 / 废镜像 / 凭证纪律）；各端独立实现 | 本档 §4 端差登记（已登记**宿主能力例外** = 载体一项） |
| **N-D4** | 可机判 | 用例在册且 `npm test` 全绿 | 当批定向单测（D1 / D4 / D2 / D6 组；收口随批删） |

## 4. 端差登记（多实现面——语义同源、各端原文自持；登记面 = 已裁的**宿主能力例外项**；端差默认 = 消；**用户可见端差 = 缺陷（唯一例外 = 宿主能力面，须实证）**）

- 语义对位：结算可靠（不再 `designId not found`）· 废单值镜像 · 凭证不落文档——逐条同源。
- 端差（本端实况 · **宿主能力例外**）：**结算载体** = 会话槽 `engDesignTokens` 多槽表（`thincoder-vscode/src/extension/session-slot-write.mjs:100-166`——对端 = persistState 单源面）；语义结果两端一致（settle 即落盘）。
  - **① 宿主能力制约**：VSC 宿主基线不同——agent 对象**每 run 重建**（`thincoder-vscode/src/agent/setup.mjs`——非 CLI 常驻单对象）⇒ 结算面多出「死对象 / 快照 / 清零」三类 VSC 独有断点域；载体随端壳存储面走（CLI 无对应面，不引入）。
  - **② 证据**：设计档 §6.2 / §6.3 + 源码注释逐字登记（`thincoder-core/token-ttl.mjs:181-186`）+ 端侧批内定向单测（当批·收口随批删）。
  - **③ 裁定在册**：**已裁宿主能力例外**——声明面 = 设计档 §6.2 二态化块（`docs/core/design/DESIGN-TOKEN-SETTLEMENT.md:82-84`——同节两项余项状态词在册）+ §6.3 载体基线段（`:89-90`）；本项（载体）与余项两项分列（本项无消解项）。

**二态化裁定行**：载体一项 = **已裁宿主能力例外**（① 宿主能力制约 = VSC agent 每 run 重建，结算面多出三类独有断点；② 证据 = 设计档 §6.3 + `thincoder-core/token-ttl.mjs:181-186` 注释逐字登记 + 端侧批内定向单测（当批·收口随批删）；
③ 裁定在册 = 见上条）；设计档侧同轮二态化 = §6.2 ① **消解路径 + 到期条件** · §6.2 ② **形态（非登记项）**（本档 §4 不重述——D2）。

## 5. 范围边界（不做）

- 不做 fire-and-forget 落盘（去 fire-and-forget 后 settle 同步写 = 唯一结算点）。
- 不恢复单值镜像双真相；不给过期 token 授权通道。
- 凭证值不进任何文档（设计 / 需求 / 批次档——N-D1）。
- **不为恢复便利扩展机制**（用户 2026-10-17 19:22 裁定「我的本意只是在流程中加一个抑制 agent 盲动的坎」「不希望让机制进一步复杂化」）：**本条禁的是「为恢复便利」加的机制**——不为「把过期 / 已消费的凭证捞回来」扩字段（时间戳 / 恢复索引等持久化）、不加多级降级层级；恢复 = 清点 + 评审历史反查映射，不为此新增机制。**批归属的旁列（F-D7）不属本条射程**——它承载的是「这笔改动属于哪一批」，用于写门与收口判定，不用于凭证恢复；其跨重启可得与不可得时如实 `—` 的降级，见 F-SL1。
