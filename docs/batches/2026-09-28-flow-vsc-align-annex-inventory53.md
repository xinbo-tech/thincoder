[System reminder: async subagent #53 (explore) finished]
侦察完成。以下是完整对位清单报告（零改动，只读）。

---

# 双端机制对位清单（桌面 ∥ VSC，核件为对照）

## 0. 方法与覆盖

**只读工具链**：`ls`/`tree`/`glob`/`grep`（头注首行抽取法 `^\s*\*\s+\S+\.mjs —` + `^export`）+ 关键档分段 `read`（头注 + 导出面 + 装配段，均 ≤30 秒/档）。
**覆盖**：desktop `src/main/` 27 档（全数）· desktop `renderer/` 顶层 29 档 + `views/` 24 档（头注全采）· VSC `src/extension/` **55 档**（任务书写 58，实点 55）· VSC `src/agent/` 12 档 · VSC `webview/` 49 项（头注全采）· CLI `src/tui/` 对位名 · 核件 `thincoder-core/agent/*`、`agent/suspension.mjs`、`agent/timers.mjs`、`context.mjs`、`session*.mjs`、`skills/rules/permission/peer-*` 导出面，以及 **`thincoder-render-core`（第二个共享包，桌面经 `app://` 的 `/rc/` 别名消费、VSC webview 经 `node_modules` 相对路径消费）**——&quot;是否已有出口&quot;判定必须含它，故并入本报告。

**关键口径**：`关系` 列用四值（重造 ∕ 同名两造 ∕ 核件已单源但端未消费 ∕ 真端差）；`建议三态` 为 上提核件单源 ∕ 复用他端 ∕ 真端差，**已单源且已消费的行标「已对齐」**（三态不适用）。

---

## 1. 机制对位表

### 1.1 队列

| 机制 | desktop 档（行数） | VSC 对位档（行数） | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 队表 + 容量 + 条目形 | `queued-input.mjs`(118, **09-28**) `createQueuedInput`/`QUEUED_MAX_ITEMS=8` | `queued-merge.mjs`(65, **09-23**) `QUEUED_MAX_ITEMS=8` | `queued-merge.mjs` | 仅显示面值：`render-core/flow/queued-mark.mjs:28` `QUEUED_MAX_ITEMS=8` | **重造**（desktop 档头自注「CLI ∕ VSC 同值」，`queued-input.mjs:6-9`） | 上提核件单源 |
| 合并批计划 `planQueuedInput`/`formatMergedMessages`（8 条/2000 字符） | `queued-input.mjs:43-68` | `queued-merge.mjs:36-65` | `queued-merge.mjs:40` | **无** | **重造**（desktop `:21` 「CLI 逐字同值」、`:33-34` 「**逐字**」）| 上提核件单源 |
| 步边界 pickup（不中断 + 下一步生效 + 整批让位） | `turn-chain.mjs:41-48`(72) | `queued-pickup.mjs:31-40`(57) | `queued-pickup.mjs:22` | 缝已有：`core/agent.mjs:102` `runAgent({consumeQueuedInput})`——策略无出口 | **重造**（desktop 自注 KD-40 ⑤「携图整批让位」与 VSC 同规则） | 上提核件单源 |
| 回合尾续发（队列先于接管） | `turn-chain.mjs:51-72` | `suspension.mjs:33`+`queued-pickup.mjs:49 takeQueuedBatchItem` | `agent-turn.mjs`（submit/队列递归） | `core/agent/suspension.mjs` 消化轮 + `runAgent` autoTurn 旗标 | **重造**（三端各持续发链） | 上提核件单源（与上两行同批） |
| 队列显示（标记 + 快照应用 + 防悬空） | `renderer/queue.mjs`(41) + `views/chat-pending.mjs`(78)；`views/chat-text.mjs:23` 仅取 `markPending/paintLabel` | `webview/queued-mark.js`(40, `:12` 取核 `planBusyQueued`) | `key-handler-busy/edit.mjs`（`QUEUED_MAX_ITEMS`） | **`render-core/flow/queued-mark.mjs`(104)**：`planBusyQueued`/`markPending`/`clearPending` | **核件已单源但端未消费**（desktop 未取 `planBusyQueued`，自持镜面） | 复用他端（desktop 接核纯逻辑面） |

### 1.2 回合执行

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| depth-0 主循环 `runAgent` | 无自造；`agent-host.mjs:35` 消费核 `runAgent` | **`src/agent.mjs`(456) + `src/agent/*` 12 档自持循环**（`queued-pickup.mjs:2` 自注「端壳自有 depth-0 循环」） | `agent-turn.mjs:17` 消费核 | `core/agent.mjs:102 runAgent` | **核件已单源但端未消费**（VSC 侧 fork；desktop/CLI 已消费） | 复用他端（**VSC 收口核**；desktop 零动作） |
| 单回合执行面 + 结算三径（落盘→读数→终局事件） | `turn-face.mjs`(78) + `agent-host.mjs`(375) | `panel-turn-loop.mjs`(187) + `panel-turn-stages.mjs`(241) + `panel-chat.mjs`(260) | `agent-turn.mjs` | `core/agent.mjs` 返回语义 + `agent/suspension.mjs` 消化轮 | **重造**（端胶水，载体不同；desktop 最薄） | 真端差（保留）+ 语义对齐核 §6.8 |
| 回调桥（callbacks → `ev:*` 事件） | `agent-bridge.mjs`(249) | `panel-callbacks.mjs`(317) + `panel-subagent-relay.mjs`(271) | `tool-events.mjs` | 映射单源 **`render-core/subblocks/relay.mjs`(141)**（档头：两端共用） | **重造**（投递通道端差；子代理 token→patch 映射已单源且两端已消费） | 真端差 + 已对齐（映射面） |
| 协议行解析 `parseEvToken` / 工具参数摘要 | `agent-bridge.mjs:40-47`（`summarizeArgs:50` 自注「不引他端模块」） | `panel-callbacks.mjs`（relay token 走 render-core）+ `panel-toolpanel.mjs` | `tool-args.mjs` + `tool-events.mjs` | `render-core/tool-summary.mjs`（展示面）+ `core/agent/spawn-child.mjs stripEventToken` | **重造**（小面，三端各造） | 上提核件单源（小面，可选） |
| 阶段函数族（压缩/蒸馏/收尾/提醒） | 消费核 | `src/agent/run-stages.mjs`(30.6KB)+`response-stages`+`context-injections` 等 fork | 消费核 | `core/agent/run-stages.mjs` 四导出 | **核件已单源但端未消费**（VSC fork） | 复用他端（VSC 收口核） |

### 1.3 悬挂

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 挂起会话驱动 | `suspension-drive.mjs`(270, **消费核 `startSuspension`**) | `suspension.mjs`(484, 自持 `suspensionSession:260`) | `suspension-drive.mjs`(23.3KB, 自持 `suspensionSession:236`) | **`core/agent/suspension.mjs`(281)**：`startSuspension:172`/`finishSuspension:106` | **核件已单源但端未消费**（VSC+CLI；desktop 已消费） | 复用他端（VSC+CLI 收口核） |
| 池判据/清扫/计数 | 消费核（`:22`） | `suspension.mjs:59 poolLive`/`:74 sweepSettledToPending`/`:125 backgroundStatus` 自持 | `suspension-drive.mjs:94 poolLive` 自持 | `core/agent/suspension.mjs:52/63/78` 同名三件（档头 `:10-13` 明言 carrier 注入面已兼容 CLI 形/ VSC 形） | **核件已单源但端未消费** | 复用他端 |
| 残输入兜底/窗内输入路由 | `suspension-drive.mjs` 第⑥⑦面（自注「VSC 队列兜底同形」） | `suspension.mjs` `pendingInput` 面 | `suspension-drive.mjs` | 核 `startSuspension` `injectResidual` 面 | **重造**（载体差异） | 上提核件单源（并入驱动收口） |
| 存活 2s 拍 | `subagent-face.mjs`(87, `LIVE_HEARTBEAT_MS=2000`, 09-27) | `panel-messages.mjs:45` `LIVE_HEARTBEAT_MS=2000`+`startLiveHeartbeat`；`suspension.mjs reassertLiveChildren` | 无 2s 拍（渲染循环驱动） | 仅语义单源（`RENDER-CORE.md §5「存活投影变体」`），**无代码出口** | **同名两造**（值同 2000，两造实现；desktop `:21-23` 自注 VSC 先例） | 上提核件单源（小面） |

### 1.4 定时

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| timer 闩（一次性 deadline）+ 交付 + 火面 `deliverExpiredTimers`/`fireTimerWake`/`createTimerWatch` | `timer-watch.mjs`(79, **09-28**, 消费核三件) | `timer-watch.mjs`(117, **09-28**, 消费核三件) | `timer-watch.mjs`(09-27)+`cmd-timers.mjs` | `core/agent/timers.mjs`：`pendingTimerDeadline:19`/`takeExpiredTimers:32`/`injectTimerReminders:42`（`TIMER_MAX_PENDING=8:16`） | **同名两造**（三端同语义·各自实现；两端档头均自注「端面独立实现·机制同源」） | 上提核件单源（闩+火策略，载具注入） |

### 1.5 会话 IO

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 槽清单/end-marker/端名 | `session-slots.mjs`(196, `END=&quot;desktop&quot;:67`, 回掏核 57-64) | `session-slots.mjs`(77, `END=&quot;vscode&quot;:46`) | `startup.mjs`/`cmd-session.mjs` | `core/session.mjs`（listSlots/slotOccupancy/renameSlot…）+`session-slots.mjs` | **已对齐**（两端消费核） | 已对齐 |
| 槽装载/落盘 | `session-io.mjs`(38, 薄转口：`loadSlotFile/applySession/saveSession`） | `session-io.mjs`(247, 高阶 `resumeSlot:91`/`newSlot:128`/`switchToSlot:186`/`deleteSlotAndUpdate:210` 端壳自持) | `index.mjs`/`agent-turn.mjs` `saveSession` | `core/session.mjs`/`session-lifecycle.mjs`/`session-slots-manifest.mjs` | **重造**（VSC 高阶面可归核；desktop 已最薄） | 复用他端（VSC 收口核） |
| 历史页读面 | `session-slots.mjs pageHistory` + 核 `history-window` | `session-io.mjs:61` re-export 核 + `panel-session.mjs loadOlder` | `startup/render-conversation` | `core/history-window.mjs`（`historyWindow/HISTORY_PAGE_SIZE/isRealUserMsg`） | **已对齐** | 已对齐 |
| 会话 GC/索引命令 | **无此面**（grep `session-gc` 零命中） | `session-gc-command.mjs`(71)/`session-index-command.mjs`(44) | `cmd-reindex.mjs`/`cmd-session.mjs` | `core/session-gc.mjs`/`session-index-cmd.mjs` | 端差（desktop 缺面）+ 核已单源 | 复用他端（desktop 如需则接核） |
| 台账可见面 | `project-info.mjs`(97)：直取核 `ledger.mjs:33 buildScan` + `ledger-surface.runLedgerScan:62` | `ledger-surface.mjs`(140,「W4 接入核机制」) | `ledger-surface.mjs`（K-LX3 归核） | `core/ledger-surface.mjs`+`ledger.mjs` | **已对齐**（三端消费核） | 已对齐 |

### 1.6 装配

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 代理装配序（配置→注入→记忆→规则→工具→代理） | `agent-assemble.mjs`(96)：`teamConfig:30`「**端本地最小实现（同形于 CLI 装配侧取值）**」、`gitAuthor:38`「端本地最小实现——**不引他端模块**」 | `src/agent/setup.mjs`(30.6KB)+`setup-tooltable.mjs`(20.4KB)+`setup-reminders.mjs` | 消费核 `prepareRun`（装配点未细核） | `core/agent/setup.mjs:42 prepareRun` + `agent/setup-reminders.mjs`（部分出口） | **重造**（三端各持装配序；核只有 pre-flight 半） | 上提核件单源 |
| 团队层取值 `teamConfig`/`gitAuthor` | `agent-assemble.mjs:28-40` | `setup.mjs` 内嵌 | 未细核 | 无 | **重造**（小面，desktop 自注同形 CLI） | 上提核件单源（小面） |

### 1.7 桥

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 通道注册/分发（29 项） | `ipc.mjs`(262)+`preload CHANNELS` 单源（`:39`） | `panel-messages.mjs`(358)+`panel-messages-{session,settings,turn}.mjs`+`chat-panel.mjs`(431) | TUI 键盘/命令面 | 无（传输层） | **真端差**（Electron IPC ∥ webview postMessage）；载荷契约端各持 | 真端差 |
| 静态供给/协议 | `protocol.mjs`(89, `app://` + `CORE_ROOT:RENDERER_ROOT` 供 `/rc/` 别名) | webview `../node_modules/@thincoder/render-core/*` 直引 | 无 | `render-core` 包（两端消费） | **真端差**（供给机制）＋已对齐（同一 render-core） | 真端差 |
| 窗口/菜单/主题/冒烟 | `window.mjs`(137)/`main.mjs`(109)/`host-floor.mjs`(43) | 无（宿主提供） | 无 | 无 | **真端差** | 真端差 |

### 1.8 通知

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 回合完成提示（失焦门 + 文案） | `notify.mjs`(47, **09-28**)：`:8` 「VSC 逐字同判据 = panel-callbacks:233」；`:32` 「VSC notify.mjs:9-18 同判据」；`:14` `notify.done` = VSC `locales/{zh,en}.json:222` 逐字 | `notify.mjs`(18, **09-13**) | 无对位（TUI 无系统通知） | 无 | **重造**（策略小面重造；平台落子真端差；desktop 增档②「子任务完成」） | 上提核件单源（策略）+ 真端差（平台） |

### 1.9 附件

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 贴图落盘（dataURL 解析 + 15MB 闸 + `.thincoder/tmp/paste-*`） | `attachments.mjs`(126, **09-27**)：`:6` 「先例同形 = VSC image-handler.mjs:34-63」 | `image-handler.mjs`(130, `savePastedImages:49`, **09-21**) | `clipboard.mjs`（粘贴面） | 下游已核：`core/agent/setup-reminders.mjs appendImagePointer`；阈同值 `core/tools/file.mjs MAX_IMAGE_BYTES` | **重造**（同阈同径同下游；desktop 仅比 VSC 多 30MB 合计批面） | 上提核件单源 |
| 非视觉降级（视觉渠道子代理读图） | `attachments.mjs` ⑤ **仅文本提示，无读图代理** | `image-handler.mjs:71 runVisionReader`+`:109 downgradeNonVisionImages`+`vision-channel.mjs`(24) | 未核 | 无（`specForModel` 核已供） | **真端差（desktop 未跟进）** | 复用他端（desktop 接 VSC 面）或上提 |

### 1.10 设置

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| provider 读写/流程（add/remove/setKey/代理） | `providers.mjs`(151)+`settings.mjs`(254)，消费核 `config/config-io/list-models/think-off` | `settings.mjs`(410)+`presets.mjs`(216)+`provider-flows.mjs`(175)+`panel-settings-push.mjs` | `cmd-config.mjs`/`model-picker.mjs` | `core/config.mjs`+`config-io.mjs`+`config-presets.mjs`（读面已单源） | 读写面**已对齐**；**流程面重造**（三端各持交互流程） | 上提核件单源（流程面） |
| 渠道探针/准入 | `providers.mjs providerVerify`（核 `probeChannelModels/admissionOf`） | `provider-flows.mjs probeProviderAdmission`+`provider-probe-window.mjs` | `model-catalog.mjs` | `core/provider/list-models.mjs`（`recordAdmission`） | **已对齐**（三端消费核） | 已对齐 |
| MCP 面 | `mcp-servers.mjs`(120, 核 connect/probe/remove) | `panel-mcp.mjs`(168, 核 connect/probe/_sessions) | `cmd-mcp.mjs` | `core/mcp.mjs` | **已对齐**（核单源 + 端壳消息面端差） | 已对齐 |
| 设置面 UI | `mount-settings.mjs`(323)+`views/settings.mjs`(297)+`views/settings-sections.mjs` | `webview/settings*.js`（7 档） | `cmd-config` 等 | 无（核无 UI 出口） | **真端差**（宿主 UI） | 真端差 |

### 1.11 子代理面

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 取消/停止出口 | `subagent-face.mjs stopSubagent`（核 `executeCancelAction`/`cancelSyncChild`，**零算法副本**） | `panel-messages-turn.mjs handleCancelSubagent`（核） | `mouse.mjs`（核） | `core/agent-tools/subagent-async.mjs` | **已对齐** | 已对齐 |
| 子代理事件映射/中继 | `agent-bridge.mjs:26-27`（render-core relay）+ `renderer/subagent-reduce.mjs`（`/rc/subblocks/state`） | `panel-subagent-relay.mjs`（R2 后经 render-core 取值） | `subagent-blocks.mjs`（core `relay-prefix` 自持映射） | **`render-core/subblocks/relay.mjs`**（`relayEventToSubPatch` 等） | **核件已单源但端未消费**（CLI 未接 render-core） | 复用他端（CLI 侧，可选） |
| 子代理面板/块渲染 | `views/activity.mjs`(322)+`chat-subagent.mjs`（`/rc/subblocks`） | `webview/activity.js`（`/rc/subblocks` shim） | `subagent-panel.mjs`+`subagent-blocks.mjs` | `render-core/subblocks/{block,state,activity-view}.mjs` | **已对齐**（两端消费 render-core；CLI 自持） | 已对齐 |

### 1.12 其他

| 机制 | desktop 档 | VSC 对位档 | CLI 对位 | 核件出口？ | 关系 | 建议三态 |
|---|---|---|---|---|---|---|
| 文件链接（验存） | `file-links.mjs`(63, **09-28**)：`:4-6` 「语义同源 = VSC …**多实现面各自落地**」 | `file-links.mjs`(41, **09-13**) | 无（TUI 无链接面） | **无**（同正则/同 `MAX_LINKS=50`/同算法两造） | **重造** | 上提核件单源 |
| skills | **无此面**（grep `skill` 零命中） | `skills.mjs`(119, 同步自持：`loadSkills/readSkill`) | `cmd-skills.mjs:7`（核 `loadSkills`） | `core/skills.mjs`（`loadSkills:92`/`loadSkillsSync:214`/`readSkillSync:224`） | **核件已单源但端未消费**（VSC 自持 sync 版；CLI 已消费） | 复用他端（VSC 收口核） |
| 规则面 | 消费核 `discoverRules`（`agent-assemble.mjs:19`） | `agent/rules-face.mjs`（核）+ `rules.mjs`(125, `.cursor/rules` **端差增量**) | 核 rules | `core/rules.mjs discoverRules:22` | **已对齐** + VSC 端差增量 | 已对齐（增量端差保留） |
| i18n | `renderer/i18n.mjs`(490)+`i18n-views.mjs`（HOST_DICT） | `i18n.mjs`+`locales/{zh,en}.json` | 核 i18n 消费 | `core/i18n.mjs`（容器归一，D1 裁定「容器归一、投影端差」） | **真端差（经裁定）**；但词键**值面**仍有校照（desktop `notify.mjs:14` 引 VSC locales 逐字） | 真端差（已裁定）+ 值面可对照 |
| 多实例协作（peers） | **无此面** | `peer-claims.mjs`(225)+`peer-domains.mjs`(265)+`peer-instances.mjs`(183)（「VS Code 镜像」，AC-IC11 对拍） | 未核 | **`core/peer-claims.mjs`(264)**+`peer-domains.mjs`+`peer-instances.mjs`（单源已出） | **核件已单源但端未消费**（VSC 镜像 ~670 行） | 复用他端（VSC 收口核——若路径/端壳可注入） |
| 卡面（审批/提问/任务面板） | `views/approval.mjs`(201)+`views/question.mjs`(113)+`mount-cards.mjs`(185)，**自造卡树**（仅取 `/rc/diff` `/rc/lib`） | `webview/permission.js`+`question.js`+`panels.js`（消费 render-core cards） | `interaction.mjs`（核 `permission.mjs askPermission`） | **`render-core/cards/permission.mjs`(130)**+`question.mjs`+`panel.mjs`——档头自注「VSC 绑 postMessage / **桌面绑 invoke**」（即为两端设计） | **核件已单源但端未消费**（desktop 未 import `/rc/cards/*`——已 grep 实证） | 复用他端（desktop 接 render-core cards） |
| 项目面/会话栏 | `projects.mjs`(121)+`sessions.mjs`(46)+`session-actions.mjs`(74) | `panel-project.mjs`+`panel-session.mjs`(326) | `startup.mjs`/`cmd-session.mjs` | `core/session-stale.mjs groupSessionEntries`+`session-slots-manifest.releaseClaimsAll`（已消费） | **重造（模型端差）**：桌面多会话标签/池模型 ∥ VSC 单面板工作区 | 真端差为主 + 清单/认领面已对齐 |
| 渲染面引导/状态树/归约 | `renderer/store.mjs`(329)+`events.mjs`(498)+`app.mjs` | `webview/state.js`+`chat.js`+`chat-messages.js` | `render-loop.mjs`/`tui-state.mjs` | `render-core`（md/stream/tool-card/diff/lib/i18n 值面，两端已消费） | **真端差**（状态树/归约各自）+ 已对齐（原语面） | 真端差 + 已对齐 |
| VSC-only 宿主特性面 | 无 | `workspace-guard.mjs`(60)/`loop-sampler.mjs`(83)/`provider-probe-window.mjs`/`stop-trace.mjs`/`editor-context.mjs`/`file-refs.mjs`/`diff-preview.mjs` | 无 | 无 | **真端差**（VSC 宿主特性） | 真端差 |

---

## 2. 高优先重造榜（VSC/CLI 先有 → desktop 后造，均带铁证）

| # | 条目 | 铁证（档名 + 判据） |
|---|---|---|
| 1 | **`queued-input.mjs`**(118, 09-28) ∥ VSC/CLI `queued-merge.mjs`(65, **09-23**)+`queued-pickup.mjs`(57, 09-23) | desktop 档头 `:6-9` 自引两端为单源；`:21` 「CLI 逐字同值」；`:33-34` `formatMergedMessages` 「**逐字**」；常量 8/8/2000 三端同值；VSC 侧有对拍锁（`queued-merge` 档头引 T-V16-14） |
| 2 | **`turn-chain.mjs`**(72, 09-28)：步边界 pickup + 回合尾续发 | 与 VSC `queued-pickup.mjs:31-40`/CLI `:22` 同构（plan[0]→splice→`pushReal`→快照推送）；desktop `:9-11` 自注同 KD-40 规则（含「携图整批让位」= VSC `:36` 同判） |
| 3 | **`timer-watch.mjs`**(79, 09-28) ∥ VSC `timer-watch.mjs`(117, 09-28) ∥ CLI(09-27) | 三端导出同名（`createTimerWatch/deliverExpiredTimers/fireTimerWake`）；两端档头均写「端面独立实现 · 机制同源」；闩体（一次性/unref/撤旧立新）逐行同构 |
| 4 | **`file-links.mjs`**(63, 09-28) ∥ VSC `file-links.mjs`(41, **09-13**) | desktop `:4-6` 自注「**多实现面各自落地**」；`PATH_TOKEN_RE`、`MAX_LINKS=50`、去重/存在闸/封顶算法逐行同构 |
| 5 | **`attachments.mjs`**(126, 09-27) ∥ VSC `image-handler.mjs`(130, **09-21**) | desktop `:6` 自注「先例同形 = VSC `image-handler.mjs:34-63`」；15MB 闸同值、`paste-&lt;id&gt;-&lt;i&gt;.&lt;ext&gt;` 同径、下游同 `appendImagePointer` |
| 6 | **`suspension-drive.mjs`**(270, 09-28) 的窗寄存器/回收/残输入兜底面 | `:7` 「VSC `reclaimDigestedBlocks` 同形」、`:8` 「VSC 队列兜底同形 —— 对位表『关闭』行」；VSC `suspension.mjs`(484) 为对应实现（且 desktop 反而已消费核 `startSuspension`） |
| 7 | **`subagent-face.mjs`**(87, 09-27) 的 2s 存活拍 | `:21-23` `LIVE_HEARTBEAT_MS=2000` 自注「**单源——VSC 先例 `panel-messages.mjs:45`**」；VSC 同名常量 + `startLiveHeartbeat`/`reassertLiveChildren` |
| 8 | **`notify.mjs`**(47, 09-28) ∥ VSC `notify.mjs`(18, **09-13**) | `:8` 「VSC 逐字同判据 = `panel-callbacks.mjs:233`」；`:32` 「VSC `notify.mjs:9-18` 同判据」；`:14` 词键取 VSC `locales/{zh,en}.json:222` 逐字 |
| 9 | **`agent-assemble.mjs`**(96, 09-27) 装配序 + `teamConfig`/`gitAuthor` | `:28` 「**端本地最小实现（同形于 CLI 装配侧取值）**」；`:38` 「端本地最小实现——**不引他端模块**」；对位 VSC `agent/setup.mjs`(30.6KB) |
| 10 | **`renderer/views/approval.mjs`**(201)+`question.mjs`(113) 卡面自造 | render-core `cards/permission.mjs:4` 明言「VSC 绑 postMessage / **桌面绑 invoke**」（核件为两端设计）；VSC webview 已消费；desktop 零 `/rc/cards/*` import（已 grep 实证） |
| 11 | **`renderer/queue.mjs`**(41)+`views/chat-pending.mjs`(78) 排队镜面 | VSC `webview/queued-mark.js:12` 取核 `planBusyQueued`；desktop 仅取 `markPending/paintLabel`（`chat-text.mjs:23`），自持镜面/防悬空逻辑；render-core `queued-mark.mjs` 档头注明「双写登记」待收 |

&gt; 附注：`session-io.mjs`(38)、`project-info.mjs`(97)、`ipc.mjs`、`host-floor.mjs` 等虽&quot;晚&quot;，但**已直取核件**，不在重造榜。

---

## 3. 真端差候选（桌面独有且合理，各一句由）

| 档 | 由 |
|---|---|
| `window.mjs`(137)/`main.mjs`(109)/`host-floor.mjs`(43) | Electron 壳面（单实例锁/隔离三件套/原生菜单/`node:sqlite` 下限探针）——宿主供给面，VSC/CLI 无对位体 |
| `protocol.mjs`(89) | `app://desktop` 特权 scheme + `/rc/` 别名供给（renderer 与 render-core 的安全供给面）——Electron 特有 |
| `ipc.mjs`(262) | Electron IPC 白名单注册（单源在 preload `CHANNELS`，fail-closed）——传输层端差；载荷契约本身可对照 |
| `notify.mjs` 平台落子 | 系统通知构造（Electron `Notification`）vs `vscode.window.showInformationMessage`——平台面端差（策略面见上提候选） |
| `projects.mjs`(121)/`sessions.mjs`(46)/`session-actions.mjs`(74) | 桌面&quot;多会话标签 + 每键一槽&quot;模型（`/session:&lt;n&gt;` 键面、在飞表按会话分键）——与 VSC 单面板/工作区模型是产品面端差 |
| 设置面/对话流 UI 全族（renderer `mount-*`+`views/*`） | 宿主 UI 布局与状态树自持（仅取 render-core 值面）——UI 面端差 |
| `host-floor`/冒烟读数 | 基准与冒烟探针（判据②③）——发布面端差 |

---

## 4. 核件可上提候选（上提后三端共消费）

| # | 上提对象 | 归属 | 理由 | 预估面（删除量） |
|---|---|---|---|---|
| 1 | **队列纯逻辑族**：`planQueuedInput`/`MAX_MERGE_ITEMS`/`MAX_MERGE_CHARS`/`QUEUED_MAX_ITEMS`/`formatMergedMessages` + 队表（键化 Map）+ 步边界/尾续发策略 | `thincoder-core`（新 `queued.mjs`） | 已有 VSC↔CLI 对拍锁可继承；desktop 为超集（键化 + images）——三端合一后天然免漂移 | 新增 ~120 行；删 desktop 118 中 ~60、VSC 65、CLI ~90；三端各留载具 adapter |
| 2 | **timer 闩+火策略**（`createTimerWatch` 键表化 + `deliverExpiredTimers` + `fireTimerWake` 序列） | `core/agent/timers.mjs` 扩展 | 三端同语义已并存；核已出三原语（deadline/take/inject），只差闩与开轮序 | 新增 ~60 行；VSC 117→~40、CLI 同减半、desktop 79→~35 |
| 3 | **附件贴图族**（dataURL 解析 + 15MB 闸 + tmp 落盘 + 非视觉判决） | `core`（新 `attachments-image.mjs`） | desktop 自注先例=VSC；阈值已与 `core/tools/file.mjs` 同值；纯逻辑+fs 叶面 | 新增 ~70 行；desktop 126 与 VSC 130 各减 ~50；CLI `clipboard.mjs` 可接 |
| 4 | **file-links 纯函数**（token 正则 + 存在闸 + 去重封顶） | `core` | 纯函数、零宿主、两端已逐字同构 | 新增 ~40 行；desktop 63+VSC 41 归零各留 2 行转口 |
| 5 | **装配序 + `teamConfig`/`gitAuthor`/`validateProvider`** | `core/agent/setup.mjs` 扩 | desktop 自注&quot;同形 CLI 取值&quot;；VSC 30.6KB setup 与之同族——统一后装配序可机验 | 新增 ~80 行；desktop 96 减半、VSC 侧瘦身 |
| 6 | **存活投影 2s 拍**（值 + 逐键再断言 + 清点） | `core` 或 `render-core §5` | 值同 2000 两造；语义单源已在设计档但无代码出口 | 新增 ~30 行；两端各减 ~20 |
| 7 | **提示策略**（失焦门 + 两档判据 + 词键） | `core`（平台落子留端） | desktop 已逐字引 VSC 判据与词键，仅平台调用不同 | 新增 ~30 行；两端各减 ~15（词键与 VSC locales 合并为一源） |
| 8 | **provider 流程族**（add/remove/setKey/探针窗） | `core`（流程函数） | 读写面已单源、只剩交互流程三造 | 新增 ~60 行；VSC 175 + desktop ~80 + CLI 内 ~50 瘦身 |

---

## 5. 反向发现：核件/共享包已单源、但端未消费（供父侧一并裁决）

| 已单源件 | 未消费端 | 证据 |
|---|---|---|
| `core/agent/suspension.mjs`（5 导出，carrier 注入已兼容两端形） | **VSC**(`suspension.mjs` 484 自持 poolLive/sweep/backgroundStatus/suspensionSession)、**CLI**(`suspension-drive.mjs` 自持) | core `:10-13` 明言载体兼容；VSC 档头 `:18-22` 自述 W13 只接了 `parkAsyncPending` |
| `core/skills.mjs`（含 `loadSkillsSync`/`readSkillSync`） | **VSC**(`skills.mjs` 119 同步自持) | VSC 档头 `:5` 「语义同源、实现自持（CLI 为 async）」；CLI 已消费 |
| `core/peer-{claims,domains,instances}.mjs` | **VSC**（镜像 ~670 行，AC-IC11 对拍） | VSC 档头自注「与核 `peer-claims.mjs` 逐字同串」 |
| `core/agent.mjs runAgent` + `core/agent/run-stages.mjs` | **VSC**（`src/agent.mjs` 456 + `src/agent/*` 12 档 fork） | VSC `queued-pickup.mjs:2` 「端壳自有 depth-0 循环」 |
| `render-core/cards/{permission,question,panel}.mjs` | **desktop**（自造卡树 314+185 行） | grep：desktop 零 `/rc/cards/*` import；核件档头自注支持桌面 |
| `render-core/flow/queued-mark.mjs planBusyQueued` | **desktop**（自持镜面） | 见上 1.1 行 5 |
| `render-core/subblocks/*` | **CLI**（`subagent-blocks.mjs` 自持） | 仅头注/导入面判据——CLI 未接 render-core（**未细核**） |

---

## 6. 未核 / 边界（不猜）

- **未核**：VSC `src/agent/*` 12 档与 `core/agent/*` 的逐档对位（仅据头注+导入面判 fork 关系）；CLI 代理装配点与 CLI `subagent-blocks.mjs` 内部映射表；desktop 与 VSC 是否已有队列对拍测试（desktop `test/` 仅见文件名未读）；`/rc/` 别名解析实现（`protocol.mjs` 供给段未逐行读）；VSC `queued-merge.mjs:40-65` 尾部、`panel-messages.mjs` 内部。
- **行数口径**：表内&quot;行数&quot;为实测（`read` 总行提示）；未实测的少数字节数已在正文标注（如 VSC `agent/setup.mjs` 30.6KB）。
- **任务书写 VSC extension 58 档，实点 55 档**（多算 3）；其余覆盖与任务书一致。

---

## 交付表

| # | Status | Requirement |
|---|--------|-------------|
| 1 | ✅ Done | 机制对位表（12 族 40 行，含 desktop/VSC 档+行数、CLI 对位、核件出口、关系四值、建议三态） |
| 2 | ✅ Done | 高优先重造榜 11 条（≥8，均含档名+一句话判据+自注/时间戳铁证） |
| 3 | ✅ Done | 真端差候选 7 条（桌面独有且合理者，各一句由） |
| 4 | ✅ Done | 核件可上提候选 8 条（含理由 + 预估面/删除量） |
| 5 | ✅ Done | 附加：反向发现（核件已单源但 VSC/CLI 未消费 7 项）+ 未核清单（边界诚实标注） |

**零改动确认**：本次仅执行 `ls`/`tree`/`glob`/`grep`/`read`，未写任何文件、未改任何代码。