# Changelog（@thincoder/core）

All notable changes to the core package are documented here.
Format: Keep a Changelog · 中文 · 号在发布时定（CalVer——见 `docs/RELEASE.md` §4）。

## [0.10.4] — 2026-10-05

> 0.10.3 → 0.10.4（月内 +1——发布时定号）

### Added

- **零落笔看门狗（#934）**：eng-coder ∥ eng-designer ∥ 评审面连续 50 轮零文本产出 ⇒ 自动上游提醒（阈值单源叶 `zero-write-watch.mjs`）。
- **工程模式状态档写通路（#941）**：`PROJECT-MANIFEST.json` ∥ `.thincoder/conventions.json` 合规写入面（`state` 第五值——「恰执行一次」语义；`src` 段仍拒）。
- **空目录清理通路（#943）**：`delete` 空目录臂（非空照拒 ∥ 嵌套空树自底向上——`delete` 描述面同拍）。
- **台账变体键首启提示（#935）**：盘符大小写变体旧库检测 + `migrate` 指引（不再静默分裂）。
- **工具面首用可发现性（#938）**：子代理派单六字段骨架进描述面 ∥ batch 头参 ∥ 占位域修正。
- **`ledger` 统一入口（#923）**：五工具合 1（action 分派；五旧名 = 弃壳零装配）。

### Changed

- **消化账务语义（#930）**：投递-结算两分 ∥ 重试上限 + 升级 ∥ 未结可见。
- **模型可见面三笔（#950）**：派单六字段骨架 ∥ 消化签收纪律线 ∥ 停摆轮引用清理。
- **bash 执行器身份（#922）**：运行时 shell 探针 + 注入执行器行（描述与真实执行器不再相左）。
- **advisor 主循环拆分（#951）**：时间线记录 ∥ 压缩协作外提（行为零变——结构面）。

### Fixed

- **消化账务取件窗（#939）**：多轮 run 首轮签收跨轮存活（假重投根治）。
- **设计令牌裁决闸（#940）**：评审回执无 `VERDICT: pass` 不签发（机械判 ∥ 回显径）。
- **评审串台面（#949）**：并发/排队评审按本评审实例定域 + 投递水印（不再借他场轮次）。
- **引文核验装饰剥离（#928）**：包裹引号 ∥ 行内注记并入捕获串不再误报失配（候选集 c1–c4；零模糊）。
- **评审 documents 域锚祖先链（#945）**：容器相对形在子仓锚下可解析（受理判据零放宽）。
- **批次档路径多落点歧义（#942）**：无仓前缀相对形不再静默嵌套 + 歧义显式拒。
- **docRoot 空值哨兵（#944）**：`null` = 本面无（不再被默认值补回）。
- **responses 适配面健壮性（#907）**：SSE error 帧双分支 ∥ 错误码映射 ∥ `max_output_tokens` 显式发送。
- **评审文档路径基面（#921）**：按候选项目根解析 + 诊断拒语 + 七处基面声明在位。

## [0.10.3] — 2026-10-04

> 0.10.2 → 0.10.3（月内 +1——发布时定号）

### Added

- **OpenCode Go 内置预设（#906）**：`opencode-go`（OpenAI 协议侧）∥ `opencode-go-anthropic`（Anthropic 协议侧）——开箱可选渠道（双协议混装建模）。
- **ACP 结构化子代理事件（#862/#843）**：`session_info_update` 携 `_meta["thincoder.dev/subagent"]`（role ∕ id ∕ 状态 ∕ 进度）——ACP 客户端可呈现子代理活动；判据单源叶 `subagent-event.mjs`。
- **manifest 未知键告警（#802）**：读档返回 `unknownKeys` + 恰一行可见告警（含键名；非拒——拼错 / 版本错位的声明键不再静默失效）。
- **台账只读路径**：只读数据库打开面（CLI `ledger list` ∥ ACP `ledger/*` 接口共用）。
- **崩溃防护两面（#865/#866）**：流响应体错误护（`stream-destroy.mjs` 四消费点）∥ win32 杀树同步化（退出阶段不漏杀）。

### Changed

- **模型切换解锁 · 核侧（#918）**：会话槽三键（provider ∕ model ∕ effort）**单写者**——回合关联落盘（`prefsSeedOnly`）不携三键（槽在场值赢 ∥ 缺播种）——忙期选定不再可能被旧快照覆写。
- **环边界中止前置（#793）**：回合环头 ∥ 环尾两检查点——中止态（用户 Stop）恒以 AbortError 收束，不再产出撞帽续跑询问（需求 F5「Stop 优先」兑现）。
- **多项目台账合计（#882）**：歧义根（容器根）下状态行台账段按族合计——多项目求和不显单一。

### Fixed

- **MCP 会话过期自愈（#850）**：HTTP 404 ⇒ 清会话 + 重新 initialize + 重试一次（单飞重建）；二次失败透传 + `sessionDead` 入存活判据。
- **杀树相位（#877）**：退出阶段 POSIX 组杀 + SIGKILL 兜底（忽略 SIGTERM 的子进程不再泄漏）。
- **SSE 重复帧守卫（#856）**：message 形状重复帧前缀补差 + tool_calls 覆盖（MiniMax v2 类端点二次追加不再叠加）。
- **直连断流 abort 通道（#878）**：fetch 直连路径 120s 看门狗恢复生效（含遗漏路径收口）。
- **图片字节预算（#853）**：历史图片累计驱逐（最老先出）+ 注入时同判 + 413 可操作化。
- **embedding 毒行隔离（#859）**：孤立代理项清洗 + 单毒行不阻后续批。
- **auto-think 守卫（#860）**：思考型模型分类调用——恒发守卫 + 失败一次可见（不再 100% 静默回退）。
- **子代理模型形态防线（#861）**：非法 `agent.subagentModel`——加载期清洗 + 运行期明确错误（不再裸崩）。
- **大工具回执汇总行（#796）**：批量编辑回执末行恒置 `edit batch: N/N entries — <路径清单>`——大回执（offload 截中段）也可读到结论。
- **TUI-OOM 余项（#863）**：/undo 快照双上界 ∥ console 采集 cap ∥ advisor 关闭轻量化。
- **台账幽灵根发现（#899）**：歧义根不再被空壳库遮蔽（族发现跳过 + 容器根合计恢复）。
- **设计令牌回显链（#884）**：截断回显容错 + 常量标记剥离 + 正则单源（工程模式签发可靠性）。

## [0.10.2] — 2026-10-03

> 0.10.1 → 0.10.2（月内 +1——发布时定号）

### Added

- **统一 provider 解析（#841 · 三端归一）**：核导出 `resolveProviderPlan`（回退链 = 槽渠道（持 key）→ `defaultModel` 渠道 → 首个持 key 渠道；模型面 = 槽模型 → `defaultModel`（同渠道）→ 渠道单值 → `null`；三态 = `ok` ∕ `fallback` ∕ `invalid` + `reason`）与 `resolveChannelModel`（单值转口面）。
- **`providerState` ∕ `providerStateReason` 两键**：`loadConfig()` 落（`provider` = 解析入选渠道）+ 槽面 key 门（`applySession`——槽无 key ⇒ 跳过且不写槽）。

### Changed

- **「无效」语义收窄**：仅「无 provider ∥ 无 key」为 `invalid`（不可运行 ⇒ 引导配置）；「可运行而无有效 `defaultModel`」为 `fallback`（**可运行 + 必明示**——不再当无效拦下）。

## [0.10.1] — 2026-10-03

> 0.9.5 → 0.10.1（月切换——十月首发，发布时定号）

### Added

- **公开仓读取（declared sources）**：可把外部公开仓声明为「公开源」——检索 ∕ 引用 ∕ 提示词面一体支持（多仓工作区的只读面）+ 四条提示面词句与机检。
- **会话锚解析（session-anchor）**：`projectRootView` 三态（ok ∕ ambiguous ∕ none）+ 歧义保护贯通台账 ∕ 批档 ∕ 写门——多清单工作区不再猜锚。
- **多仓操作机制（六提示面 · 中英）**：仓 = 一个 git 仓；一档一仓；子代理只写本仓；跨仓任务分仓记录；发现物报告路由。
- **工程纪律面**：轻通道三判据 + 一句边界（四面）∥ 命名纪律（禁生造词）∥ 单测 ∕ 集成锚定与「单测永不升集成」∥ 反膨胀判断 ∥ fix-in-place 与追认核销。
- **`pushRecord` 缝（#726）**：人工可读行的记录追加面。
- **settle 事件归一（#746）**：done 仅在消费时落——子代理块不再中途拼接。
- **heap 快照采集运行期开关**（默认关）；**桌面 digest 持久化（#719）**：traces 与归档子代理块跨重载 ∕ 重挂 ∕ 换会话存活。
- **桌面聊天面板（A+B）+ e2e 骨架** ∥ **turn-cap 续跑（F8 ∕ F9）+ slot-end 参数 + config 镜像** ∥ **空闲唤醒 p2 核**（opt-in 注入 + 中止适配——timer-wake #443 ∕ #444）∥ **子代理升级 canonical 重写 + subagent-base 单源层**（18 处去重——#442）。
- **R8 台账刷新（核面）** + config-watch 升级 + 热重载 + L2 明细行；channels 23（13 档）。
- **parity B1–B10 波 + 走查轮**：滚动退出 ∕ 挂起队列 ∕ 状态栏 ∕ 渲染性能 ∕ execute 修复 ∕ i18n ∕ 设置 ∕ 复制 ∕ 卡顿指示 ∕ 发送忙碌队列。
- **`PROJECT-MANIFEST.json` 接管声明面**：codePaths ∕ index ∕ advisor 三键入驻（旧 `conventions.json` 退役）；**eng 写门豁免 aux 路径**（test/tests/scripts、.thincoder/tmp）。

### Changed

- **测试面重整**：全仓旧套件退役（五包——runner 骨架保留，空 = 绿）；开发期测试件 36 档退役（-213 例）+ 锁型测试件 10 档退役（-87 例）；单测 = 批内件（随批档，可复跑）。
- **规则上收（R10）**：薄壳规则纯搬迁入核（字节一致探针）；VSC 壳重指向。
- **提示词面**：EN 面 parity 收正（#721）∥ `batch_segment` 过渡别名退役 ∥ 模式口径收正（文档系统模式无关）∥ 轻通道收口（#725——提醒点 + 跨会话承接）。

### Fixed

- **批档 CRLF 容忍 + CLI 粘贴生命周期（#732 ∕ #733）**；**VSC 粘贴临时件写时清扫（#735——有界临时目录）**。
- **会话台账可靠性核**：懒校验 + 写安全 + 空值 ∕ `—` 显示；**会话列表按磁盘槽扫描**（resume 门 + 18 例）。
- **manifest 写守卫**：不可信 base 拒写（G1–G11）；**台账工具参数守卫** + 写门 null ∕ empty `task_book`（AC-M2-15）。
- **项目相对守卫面 + 台账读守卫**（ledger-tools 拆分）；**`ledger_close` 追认核销路径**。
- **桌面残项**：恢复态播种 ∥ user-block md 深度 ∥ 事件拆分。

### Removed

- **`conventions.json` 退役**（`PROJECT-MANIFEST.json` 单源）；旧测试套件族（锁型 ∕ 开发期——见 Changed）。

## [0.9.5] — 2026-09-25

> 0.9.4 → 0.9.5（月内序号——发布时定号）

### Added

- **规格表覆盖扩面（新名专行）**：`qwen-flash` / `qwen-vl-max`（实测输出上限 32_768——服务端直报 `[1, 32768]`；前者思考默认可开、后者不支持）、`claude-fable-5.1`（1_000_000 / 128_000）、`gemini-3.1-pro`（1_048_576 / 65_536）、`stepfun/step-3.7-flash`（262_144）；kimi-code 平台三行（`kimi-for-coding` / `kimi-for-coding-highspeed` / `k3-256k`——含 effort 枚举与默认档）——掉兜底名不再退默认。
- **bench 受测 10 档规格行**：此前经泛前缀/兜底解析的受测模型补独立行 + 视觉声明分态登记。
- **跨实例意图认领层（P1）**：`peers/{sessionId}.json` 增 claims 意图域（TTL 30 分钟租约 · 进程死亡即失效）；写前命中他实例活认领 ⇒ 软提示（不阻写；与写后足迹登记分开存）。

### Changed

- **提示词面**：`question` 工具从子代理工具表排除（子代理无提问通道——可见但不可用，不再注入）；子代理**在途提问通道**（问询即上抛，不等收尾）与「矛盾要求 ⇒ 立即 ask、不得自行解套」自止边界落档（common + 各人格面）。
- **`glm-5.3-flash` 行 `maxOutput` 128_000 → 131_072**（校验级实测；本体 `glm-5.3` 128_000 冻结零改）。

### Removed

- **`cacheMode` 字段整体删除**：全仓零判据消费的死字段（假能力位——看着像能力声明、实际零行为）；表键 / 行注 / `DEFAULT_SPEC` / 注释提及字面清零。

### Fixed

- **deepseek 预设 `maxTokens` 393_216 → 384_000**（对齐规格行——消 K×1024 vs 十进制口径差；预置 ≤ 规格不变式 + 历史超限白名单锁定）。
- **edit 工具非数组 `edits` 入参** ⇒ 成形错误（原裸 `TypeError` 外泄；core 与 ACP 桥同收）。
- **台账库键跨端归一**（盘符大小写 ⇒ 同项目双库）+ `ledger-migrate` 迁移引擎（备份两道 → dry-run → confirm → 记存根审计；源库进回收不删）。
- **batch 工具相对路径基底统一**（create / append / 评审门 / spawn 门四调用点单源解析 + 防嵌套 fail-closed）。
- **会话 GC 加固**：无主会话清扫（无活属主 + cwd 不可达/空 + 7 天窗收口）· 多处指针/文句收正。

## [0.9.4] — 2026-09-22

> 0.9.3 → 0.9.4（月内序号——发布时定号）

### Added

- **MiMo V2.6 三款规格行**（`mimo-v2.6-pro` / `mimo-v2.6-flash` / `mimo-v2.6-pro-ultraspeed`——同日上架）：此前缺行落兜底（128K / 32K / 无视觉），现按真机实测登记——1M 上下文 · 131_072 输出 · 思考默认开（`thinking.type`）· 全模态 · 自动缓存。

### Changed

- **MiMo v2.5 两行存量对齐**（同日实测）：`maxOutput` 128_000 → 131_072 + 补自动缓存登记；族头注与 `assistantToolCallMessage` 文书句按 2026-09-22 复测改写（原「缺字段 → 400」句已不可复现——回显策略保持保守不变）。
- **MiMo 预设改指**：`mimo` / `mimoplan` 默认模型 → `mimo-v2.6-pro`（v2.5 官网标注即将下线；Token Plan 端点同平台推断）。

## [0.9.3] — 2026-09-22

> 0.9.2 → 0.9.3（月内序号——发布时定号）

### Added

- **派生会话索引库**（`node:sqlite` · 零新依赖）：`read_history` 超大会话不再整档拒（>50k 消息经索引可查）+ `path:"all"` 跨会话检索（行携 `session.file` 回查锚）+ `tool_calls` 携参数；索引从记录段增量建 · 可重建（丢/坏自愈）· 主存（会话文件）零改。
- **子代理「系统固块」**：机制性指令（审计五锚 + 批档行）改由 spawn 单点写入并拼进 system 面（前缀缓存契约——同 child 连跑 `systemPrompt` 逐字节相等）。
- **进程族单源**：`killProcessTree` 收口为 `tools/process-tree.mjs`（核 / VSC 本地副本全消除）。
- **退出即释放会话认领**：正常退出释放本进程认领（端标记保留作路标）——重启恢复不再依赖进程探测兜底。
- **认领释放扩面**：ACP `session/close` · 跨 cwd 释放 · 被占槽返回可区分信号（零写）。

### Changed

- **批档工具词面协议结构化**：`batch status` enum 化（散文走 `note`）+ `create` 补 `source` / `prev` 前缀归一 / 占位自动；append/status 占位残留机检（fail-closed）。
- **工程模式 `task` 工具机械停用**（追踪面 = 批档 + 台账；普通模式零改）。
- **设置面**：敏感键谓词导出 + 非敏感父对象 JSON 化渲染（`[object Object]` 瑕疙消除）。
- FTS 语言面外提 `fts-text.mjs`（`segmentCJK` / `buildFtsQuery` 单源 + re-export 面）。

### Fixed

- 会话索引自愈链（坏库 / 删库现场保留 + 重建）· 段轮转与等长改写的水位判别 · 源消失级联清行。

## [0.9.2] — 2026-09-21

> 0.9.1 → 0.9.2（月内序号——发布时定号）

### Added

- **PROJECT-MANIFEST 模型（按用点解析）**：项目发现五级梯（会话锚 → 带档祖先 → 一层子档 → 工作区……）+ owning-ancestor 归属 + 建档流；整档缺失不再静默（启动降级 + 明示提示）。
- **批档生命周期工具** `batch`（create / append / status / close——原 `batch_segment` 更名，别名保留）。
- **台账执行人列**（F-LX1）：executor 归属 + 判存活显示。
- **信号行两档标签**（digest / ask）+ ask 参数 + 起始行（F-UC8）。
- **会话认领释放**（F-CR1/CR2）：释放 + 拒绝零写入。

### Changed

- **非阻塞启动**：异步会话 GC · 陈旧清扫 · traces 清理（启动不再被大扫除卡住）。
- **工程模式排除 `plan` 角色**（FR31——装配 / 命令 / 残留三面一致）。
- **包面**：README 补建（static 工具口径收正）+ LICENSE + npm 元数据；`files` 白名单不变。

### Fixed

- 批别名残留（测试断言 / 提示词文档引用 / 错误串）· VSC 子代理块标题行与 CLI 对齐（标题段补全）。

## [0.9.1] — 2026-09-21

> 核首发（2026-09 当月推导——registry 无号 ⇒ `0.<当月>.1`；首发即本段 ✗ 无更早历史——核内容此前散在两产品仓 ✗ 无独立版本号可考 ✗）。

### Added

- **核包首发 `@thincoder/core@0.9.1`**：两产品共享机制收敛后的单一权威源——agent 执行环 / 子代理调度（spawn-gate · async 池 · notify_parent）· advisor 评审 · provider 层（SSE 流式 · thinking 映射 · 重试）· 记忆三层 · 工具系统 · 会话存储 · MCP 客户端 · git 集成 · 台账。
- **提示词与工具文档随包分发**：`prompts/` 15 档 + `tool-docs/` 24 档（一致性断言 D 对象——与 CLI 装机目录 / vsix 三处逐字相等）。
- **发布门禁**：`prepublishOnly` = `npm test`（与 CLI/VSC 门禁对称——2026-09-21 首发 补上）。

### Changed

- 两产品 `dependencies` 同步收正 `^0.1.0 → ^0.9.1`（声明面与 registry 实发对齐——断言 A）。
