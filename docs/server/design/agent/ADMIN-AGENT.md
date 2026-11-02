# Thincoder Server · 管理面 agent（agent/ADMIN-AGENT）

> 板块 = server ∥ 本域 = agent（server 端 agent——管理面唯一 agent）；本档 = 域档。
> 口径单源 = `docs/server/requirements/PROJECT.md` §5「两个 chat 界面」（管理面 chat——功能点 37 ∥ 41 ∥ 43 ∥ 46）：载体 = server 进程内的 LLM agent（工具面 = 管理面九件 + 环境六族八件；能力逐步长）。
> 用户口径（逐字）：工具面要有通用执行能力（bash/ssh 级——「不给bash/ssh会很麻烦」）∥ Docker 操作工具要给（「一些docker的操作工具不给他吗？」）∥ **唯一一个 agent**（「就是同一个agent，就是管里面的那个agent」——能力面 = 整个 server 管理面，逐步长）。
> 落点 = 控制台对话页 `#/admin/chat`（`docs/server/design/webui/CHAT.md` §2.1）；核复用口径 = `docs/server/design/PROJECT.md` §5 KD-SV-78。

## 1. 形态与定位

- **一句话**：管理面 agent = **server 进程内的 LLM agent**——以**会话**为单位接收管理动作（管理面 chat），经工具面（管理面九件 ∥ 环境六族八件 ∥ MCP）执行、验证、报告。
- **唯一一个**：不为管理面另立第二个 agent；其余管理面能力（成员 ∥ provider ∥ 模型选择 ∥ 用量/配额 ∥ 审计 ∥ 沙盒各面）陆续入其工具面——「通过 agent 完成 thincoder server 的完整管理」（需求 §5 后续议题行）。
- **载体**：server 进程内模块 `thincoder-server/src/agent/`（不做独立进程/通道）；执行面（runner）机器上零驻留。
- **核 = `@thincoder/core`**（KD-SV-78：依赖声明形照 CLI——钉版本；**档面裁剪 = 本档 §5**）。
- **驱动器 = 聊天式（唯一形态——§11）**：管理面 chat 会话（§11；需求 §5「两个 chat 界面」④）——同一审计面、同一模型出口面（§5——管理会话出口实现 = §16.2）。
- **与成员面 agent 的关系**：成员面 chat = 开发壳（用户裁「成员资源管理 = 同一个 chat 界面 + 开放工具」）——其 server 域工具与本体同源、面不同；**独立档 `docs/server/design/agent/MEMBER-AGENT.md`（第四壳——盒内核同件 + 最小壳；机制全文 = 该档 §3）；工具面归属 = 下行句。**
- **成员面 agent 的 server 域工具面归属** = `docs/server/design/agent/MEMBER-AGENT.md` §2 KD-SV-159：范围 = 成员本人资源；动作集 = 写面同集——单源（创建 ∥ 启动 ∥ 停止 ∥ 销毁 + 拉仓）；管理面运维件（docker/主机/exec/provider）不入成员面；逐件清单与实施 = 实施批从实需反推。

## 5. 核复用与对话面裁剪（KD-SV-78 落实）

- **保留（取核面——件级）**：多轮工具循环语义 ∥ **工具调用协议（回灌形——§17.3 A1）** ∥ **上下文压缩（§17.3 A3）** ∥ provider 客户端（模型出口）∥ 审计挂钩；**环体（回合骨架）= 服务端自持**（宿主语义：DB 单源 ∥ NDJSON 帧 ∥ 档面裁剪（§5） ∥ 网关记账出口——核内无对应缝；取核形全文 = §17，开放点 = §17.4）。
- **裁剪**：TTY 假面 ∥ 与运维任务无关族（记忆 ∥ 台账 ∥ 子代理 ∥ 浏览器——按任务需要再逐族接）。
- **审批卡面（本批落——§11.5 ∥ KD-SV-224–227；用户 2026-10-17 裁「必须上审批卡」）**：写类工具逐调用经审批门挡——单件 ∥ 批卡（`permission`/`batch` kind）；`always` ⇒ 会话行 `auto_approve`；问询/秘密面不接（无源——§11.5 收窄条）。
- **MCP 面**：**管理会话（chat）挂载**（服务器级清单 ⇒ 工具随回合并入——机制全文 = `docs/server/design/mcp/MCP.md`）。
- **模型出口**：**管理会话（chat）** = **本 server 网关链的进程内客户端**（loopback——本机监听地址 + 管理面 sk〔`admin-agent`〕；鉴权/派发/准入/记账全链逐字复用，零第二份——机制全文 = §16.2/§16.3）。
  出口代理旗随 provider 条目（复核点——`docs/server/design/sandbox/SANDBOX.md` §16 R53③）。

## 6. 本域文件与行数预算（本域族行）

| 档 | 行数（设计估） | 职责 |
|---|---|---|
| `thincoder-server/src/agent/run.mjs`（已落盘） | 实读 **33** ⇒ ≈**34**（本批删 `TRIMMED_FACES` 之 `"approval"`——KD-SV-224；保留 = 预算常量 ∥ `loadCoreChat` ∥ `providerModelRefs`） | 核装载共用件（chat 会话装配 ∥ 预算常量 ∥ `providerModelRefs` ∥ 裁剪面清单） |
| `thincoder-server/src/agent/tools.mjs`（已落盘） | ≈**20**（**保留 = `maskSecrets`**——掩蔽单源（chat `exec` ∥ 主机凭据面共用）） | 掩蔽单源（`maskSecrets`——KD-SV-136 同件） |
| `thincoder-server/src/agent/chat.mjs`（已落盘） | 实读 **745**（口径 = `split("\n").length − 1`；本批 +4/−1 ⇒ ≈**748**；越 500 咨询线——微触不拆判据 = §9 KD-SV-208/228） | 聊天式驱动（§11）：会话装配（系统简报 + 历史重放）∥ 回合环（预算 ∥ 工具循环 ∥ 中止检查点）∥ 帧流编解码（七型 + `end` 两可字段）∥ 逐条落库 ∥ 终态收尾（五形） |
| `thincoder-server/src/agent/chat-compact.mjs`（已落盘） | 实读 **334**（口径 = `split("\n").length − 1`；本批 +50/−3 ⇒ ≈**381**） | A3 压缩面（§17.3）：核件动载（`context.mjs`）∥ 压缩调用与垫片 ∥ 覆盖区间差分求 ∥ 标记行落库 ∥ 阈值取数（`compactThresholdOf`——按在用模型现算，与核同源） |
| `thincoder-server/src/agent/chat-routes.mjs`（已落盘） | 实读 **223** ⇒ **224**（本轮 `#1617` +1；结构不变） | 会话面**七**端点（§11——契约 = `docs/server/design/gateway/API.md` §2.8；+ask 应答 = KD-SV-224）∥ 判权 ∥ 在途门 ∥ 重启恢复钩（running ⇒ idle + notice） |
| `thincoder-server/src/agent/chat-asks.mjs`（已落盘） | 实读 **242**（口径 = `split("\n").length − 1`——沿 chat.mjs 行） | 审批 ask 宿主（§11.5——KD-SV-224）：写类调用 ⇒ `ask` 帧构造 ∥ 应答 ⇒ 结算续跑 ∥ 拒值三径（回合收 ∥ 中止 ∥ 流断）∥ 置库（`auto_approve`） |
| `thincoder-server/src/agent/chat-tools.mjs`（已落盘） | 实读 **562**（口径 = `split("\n").length − 1`——沿 chat.mjs 行） ⇒ ≈**590**（越 500 软线——上限 700：触发 = 实读 >700 ⇒ 起拆档审查；本批 +只读判类表/`readonlyOf` = KD-SV-225）∥ `mcp` 第九件 = 独立面 `thincoder-server/src/mcp/admin-tools.mjs`（已落盘——实读 **222**），§12.2 | 管理面**九件**（§12——九中之八在本档；`mcp` = 独立面，§12.2）：members ∥ providers ∥ models ∥ usage ∥ audit ∥ runners ∥ docker ∥ exec——参数校验 ∥ 结果结构化 ∥ 审计包装（进程内直取域件） |
| `thincoder-server/src/agent/docker-ops.mjs`（已落盘） | 实读 **91** | Docker 十动词执行器（任务面/聊天面两驱动单源；客户端 = `sandbox/docker.mjs`） |
| `thincoder-server/src/agent/chat-env.mjs`（已落盘） | ≈**97**（能力段行：`bash.async` 可用 ∥ timer 空闲唤醒；管理族句含 `exec`） | 环境块装配（§14.1）：时空 ∥ 所在/身份 ∥ 所管现况一行（三活体——块级降级）∥ 能力与边界段（`CHAT_LIMITS_BLOCK`——系统简报第四块） |
| `thincoder-server/src/agent/chat-env-tools.mjs`（已落盘） | 实读 **328** ⇒ ≈**336**（+ `readonlyOf`（核旗逐字）——KD-SV-225） | 环境工具面六族八件（§14.2/§14.3）：核件动载 ∥ ctx 适配 ∥ 结果归一 `{ ok, subject, summary, output }` ∥ `bash` 限幅（超时 ∥ 输出 ∥ 工作目录）∥ timer/后台任务垫片与投递汇（§15——唤醒器接线 ∥ 投递落库 ∥ 异步池宿主） |
| `thincoder-server/src/agent/chat-store.mjs`（已落盘） | 实读 **155** | 库面单源（库面段 + `parseJson` + `CHAT_ROLES`/`CHAT_EXCERPT_MAX` 抽出；11 名重导出同引用 ∥ 零反引 `chat.mjs`） |
| `thincoder-server/src/agent/chat-wake.mjs`（已落盘） | 实读 **141** | 唤醒器（§15.1）：会话键面闩表（核 `createTimerWatch` 复用——零第二套闩）∥ 空闲判定（会话行 `status` 单源）∥ 火策略（核 `fireTimerWake`）∥ 结算钩子（`_asyncWaiters`——先自再武装再评估）∥ 再武装三链尾 ∥ 零轮询 |

- `thincoder-server/package.json`（`@thincoder/core` 版本声明依赖——实读 `^0.10.7`）与**带核发布形**（版本对位口径）= 服务端设计档 `docs/server/design/PROJECT.md` §2.3（单源；核先于/同拍发行）。**地板 = 含 A3 阈值算式的核版本**：导出在场 ≠ 算式同位（0.10.7/0.10.8 的 `resolveCompactThreshold` = `floor(usable × 0.6)`；仓内现行 = `min(usable, ⌊window × 0.8⌋)`——读数差额 = §13 R92）。
- sandbox 域件（`ssh.mjs` ∥ 主机凭据件）= `docs/server/design/sandbox/SANDBOX.md` §13（本档不重复）；`bin/thincoder-server.mjs` **±0**（节点/凭据端点经 `thincoder-server/src/sandbox/routes.mjs` 转注册——装配行计入 sandbox 域预算）。

## 7. 验收判据（机检）

| 判据 | 载体 |
|---|---|
| 聊天式驱动：七端点判权三态（`user` ⇒ 403 ∥ 无会话 ⇒ 401 ∥ admin 200）∥ 流帧逐帧序（`delta`/`call`/`result`/`end`——假模型出口 ∥ 假工具）∥ 会话落库与重放（逐行在场 ∥ notice 回放滤除 ∥ 工具结果截断口径一致；压缩会话以标记行代覆盖段——§17.3 A3）∥ 在途门（`running` ⇒ 400 人话）∥ 重启收尾（`running` ⇒ `idle` + notice + `chat_stop` 行）∥ 管理面九件逐件（§12——假件下断言动词面与参数校验）∥ 每工具调用一条 `agent_event` 行（逐调用 ∥ 掩蔽）∥ chat 重置 ⇒ 既有域型零增（`password_reset` 零行——只 `chat_call` 行；§12 重置链助手边界）∥ 异常终态落库（模型错误 ∥ 预算超限）：已生成文本 ⇒ `assistant` 行如实落库（部分文本——回放逐字一致）；notice 行独立落行（回放滤除）；零文本 ⇒ 零 `assistant` 行 | 单元测试档（`…-admin-agent-chat.test.mjs` ∥ `…-admin-agent-chat-tools.test.mjs`） |
| 输入区四件后端 + 帧面：PATCH 换模型（idle/running 两态——下回合生效 ∥ 在途零触；非法/不存在 ⇒ 400/404 库零变）∥ `images` 三门（非数组 ∥ 非栅格 ∥ 超单图阈 ⇒ 400；非视觉模型 ⇒ 400——库零变）∥ user 行 `imageParts` 逐值 + 回放 content 数组（模型出口入参断言）+ 详情仅 `imageCount` ∥ abort（在途 ⇒ 200 + 收尾三件（notice `"aborted"` ∥ `chat_stop` ∥ `end` failed）；idle ⇒ 400；两中止窗（调用间 ∥ 在途 signal）∥ 登记表清零）∥ 帧序 = `turn(n)` 前 ∥ `usage` 后（缺 usage ⇒ 零帧）∥ `end` 携 `durationMs`/`calls`（可字段——旧消费零破） | 单元测试档（`…-admin-agent-chat.test.mjs` 续——**716** 行；越 500 软线：预案 = 用例段随拆档审查；硬限 800 未越） |
| 会话级思考档位：`GET /api/admin/providers` 行携 `modelReasoning`（稀疏 ∥ 键 = 上游真名 ∥ 值 = 核枚举；假 specLookup 注入）∥ `PATCH …/:id { reasoning }`（枚举内 ⇒ 200 落库 + 回执携值；表外/非串/同携 model ⇒ 400 库零变；判权三态）∥ 换模型 ⇒ `reasoning` 清 NULL（口径②）∥ 装配（行值 ∈ 当刻模型枚举 ⇒ 出口 `reasoningEffort`；未设 ∥ 表外 ⇒ 零键——假出口入参断言）∥ 结构（v16 零迁移：空库直落 16 ∥ 列面在场 ∥ 存量行 NULL） | 单元测试档（`…-console-reasoning-levels.test.mjs`） |

| 环境感知与环境工具面（功能点 43 ∥ AC-43 ①–⑥） | ① 四块装配在场（三实况行逐值——注入 now ∥ 假 db ∥ 注入 cwd；简报含能力边界段——**对位断言** = 每件注册工具名 ∈ 能力段字面）∥ ② 值随实况（读源变更 ⇒ 下回合行变）＋ 块级降级（读败 ⇒ 该行缺席、回合 `succeeded`）∥ ③ 零新端点（两新档源零 `routes.add(` ∥ `chat-routes.mjs` 计数不变——现 = 七端点）∥ ④ 行形 = `[System reminder: ` 族前缀（三端同形——坐标逐块 = §14.1 表）∥ ⑤ 工具面六族八件在场（names/schemas——核真件〔仓内核直引〕）＋ `get_current_time` 一次调用读数 ＋ `bash` 限幅三件（取值校验：仅拒非有限值/小于 1 ∥ cwd 生效）∥ ⑥ 每调用一审计行（逐调用——既有）＋ 详情扩字段（`subject` = 命令原文/路径 ∥ 成败 ∥ `truncated`）＋ 审计页按型渲染（agent 行模板——三文案键两表同步） | 单元测试档（`…-admin-agent-awareness.test.mjs`）＋ 收口轮（浏览器实走——问「现在几点/你管着几个节点」各一 ＋ 时间工具一次调用 ＋ 审计页一行） |

| 唤醒与投递面 | ① **唤醒链**：设 timer ⇒ 到期（注入钟）⇒ 会话空闲 ⇒ 唤醒器 fire ⇒ 送达行**落库**（`user` 行 + `data.kind="reminder"`——行文 = 核件单源逐字）＋ **自动开一轮**（模型出口调用一次；域文本 = 核 `TIMER_TURN_DOMAIN` 逐字）＋ 助手回复落库 ∥ 出列幂等（不二投）∥ 未到期 ⇒ 零行零轮 ∥ 在途回合（`status = running`）⇒ 零动作（链尾再武装）∥ 零交付 ⇒ 零开轮 ∥ ② **异步链**：`bash.async:true` ⇒ 回执 `bash#N started (running) — log: …`（核件原文 ⇒ `tool` 行）∥ 结算 ⇒ 钩子触发唤醒轮 ⇒ 摘要行落库（`[System reminder: background bash#N finished …` 核件原文）∥ 帽 4（第 5 件 ⇒ 工具级错误人话）∥ `process action="kill" id:N` 两态（在途 ⇒ 杀树 + 确认；未知/已完成 ⇒ 人话）∥ ③ **中止面**：非 interrupt 中止 ⇒ 本回合在途后台任务杀树 + 丢弃提醒入汇（核件原文）+ 墓碑 ⇒ 零摘要投递 ∥ ④ **结构面**：零新端点（端点计数不变；现 = 七端点）∥ 三 kind 审计面不扩 ∥ 唤醒器零轮询（源扫描零 `setInterval`）∥ 同源断言（导入面 = 核 `timers.mjs` 四件） | 单元测试档（`…-server-wake-face.test.mjs`）＋ 收口轮（部署实走） |
| 会话历史与出口改道（需求 43⑤ 扩 ∥ 46⑤ ∥ AC-46⑥） | ① 登录发面（admin ⇒ `admin-agent` 在册携明文 ∥ 幂等 ∥ `user` 零行 ∥ 审计 `surface`）∥ ② 出口入参（外标 ∥ selfBase ∥ sk 明文——**不携** provider 凭据）∥ ③ 全链出账（真网关链 + 假上游：`usage` 行在场且可归因）∥ ④ `read_history` 本会话逐形（含 `path` 拒）＋ 审计 subject ∥ ⑤ 结构（七端点 ∥ 三 kind ∥ 核件零改 ∥ 能力段八件对位）——机检口径全文 = §16.4 | 单元测试档（`…-server-wake-face.test.mjs` 续）＋ 收口轮（浏览器实走） |
| `exec`（SSH）进 chat | ① 工具在场（第八件——名/schema；绑定 = 主机表行：名 ∥ 地址两形命中；未在册 ⇒ 工具级错误）∥ ② 一轮 `exec`（假模型 + 假 ssh `execImpl`）：`call`/`result` 帧逐值 ∥ 结果**含四字段** `{ ok, exitCode, stdout, stderr }`（形全文 = §12 表）∥ 审计 `chat_call`（tool=`exec` ∥ subject=命令原文 ∥ resultCode=exitCode）；命令非零退出 ⇒ `ok:true`（退出码在结果内）∥ ③ 缺凭据/解密失败 ⇒ 工具级错误（回合不停、零 notice）∥ ④ 掩蔽：行凭据值（`secret`/`sudoSecret`）零入结果文本/摘要/subject/帧/审计（含 stdout 含秘密的构造用例）∥ ⑤ 临时私钥文件用毕即删（假件断零残留）∥ ⑥ 结构：工具面八件（能力段对位断言）∥ `runners` 动词 + `revoke_credential`（撤销两径同效；**chat 径审计两行** = `chat_call` + `host_credential_revoke`——凭据类例外，KD-SV-91）；用例 = §8（N83 ∥ B79 ∥ E61）＋ `docs/server/design/sandbox/SANDBOX.md` §12（N80 ∥ N82〔撤销两径用例〕 ∥ B77/B78） | 单元测试档（`…-admin-chat-creds-merge.test.mjs`）＋ 收口轮（浏览器实走——对话页录凭据 ⇒ `exec` 一条） |

| 与核取核形（机制 = §17） | ① 件清单在场（§17.2——file 级逐件）∥ ② A1 回灌形（tool 轮 assistant 消息 = 核件构造：回声族携 `reasoning_content`〔缺值 ⇒ `""`〕∥ 非回声族零字段；`extra_content` 在场才带；落库 ∥ 回放逐值）∥ ③ A2 历史修复（断链 pair 注入 ⇒ 修复成对；常态零改）∥ ④ A3 压缩（阈值触发 ⇒ 标记行落库 ＋ 回放以标记代覆盖段 ＋ 压缩后上下文缩；3 连败〔= 核常量 `COMPRESS_FAILURE_LIMIT`——取件 = `@thincoder/core/context.mjs`〕⇒ 降级；摘要调用经出口——`usage` 行可归因）∥ ⑤ 缺核降级不阻断（环境族不注册 ∥ 档位退中性）∥ ⑥ 核面零改（核侧文件零动——git 面判） | 单元测试档（`…-server-core-unification.test.mjs`） |

| 模型测试（机制 = §12.1） | ① 工具在场（`models` 动词 +1——`test`；名集八件不变 ∥ 能力段对位不破）∥ ② 通路（假自环出口 ＋ 假 fetch：请求形 = `POST <selfBase>/v1/chat/completions` ∥ `stream: true` ∥ sk 明文 Authorization；真链用例 ⇒ `usage` 行在场——member = 本回合发送者 ∥ key = `admin-agent`）∥ ③ 读数五件逐值（假 SSE 流注入时刻——注入钟〔§12.1③〕 ⇒ `status`／`totalMs`／`ttfbMs`／`tps`／`error`；`ttfbMs` = 首个非空内容增量——流首空壳块不计；`tps` = `usage.completion_tokens` ÷ 生成窗——usage 缺 ⇒ null）∥ ④ 分类五支（假出口逐形 ⇒ `ok`〔含空答——零内容增量亦归 ⇒ `ttfbMs:null`〕／`timeout`（携 `phase`）／`http_error`（携 HTTP 码 ＋ 原文原样）／`bad_response`／`broken_stream`〔含首内容增量前中断——零部分读数〕）∥ ⑤ 未配/草稿 ∥ 入参校验（`prompt` 逾 2000 字 ∥ `timeoutS` 非正/非数/越界〔>600〕）⇒ 工具级错误人话（零外呼 ∥ 除逐调用 `chat_call` 行外库零变——与「测试连接」草稿面（AC-18）划界句在）∥ ⑥ 结构（零新端点——路由计数不变 ∥ 零新审计型/kind——`chat_call` 逐调用一行 ∥ 零迁移） | 单元测试档 |

| MCP 管理工具（机制 = §12.2） | ① 工具面在册（第九件 `mcp`——五动词名/schema 在场 ∥ 寻址 `id`∥`name` 两形 ∥ 未知动词/缺 op ⇒ 工具级错误人话）∥ ② 零第二实现（引件表 = `store.mjs` 六导出 ＋ `face.mjs` 三导出——源扫断言；假件用例 = U2–U5）∥ ③ 凭据三面零秘密（结果 = 视图（`hasSecrets` 布尔）∥ `mcp_event` detail 零值（`keys` 只顶层键名）∥ 日志零值——假 log 扫描；`token` 入参 = 只写）——掩蔽 = 键名表 `SENSITIVE_KEYS` 单源（列名键零值——§12.2③）；袋内非列名键值 = 残余披露类（不入本腿断言）∥ ④ 能力叙述认 MCP（`CHAT_LIMITS_BLOCK` 管理族行含 `mcp` token ＋「已配服务器工具随回合可用」句 ＋ schema 描述——对位断言）∥ ⑤ 审计（add/update/remove ⇒ `mcp_event` 三 kind 逐值（同 routes 形——含 `keys` 无值）＋ 驱动层逐调用 `chat_call`（两行）；list/probe ⇒ 仅 `chat_call`；零新 kind/型）∥ ⑥ 结构（零新端点——routes 五端点计数不变 ∥ 零迁移 ∥ 成员面零涉 ∥ `chat-tools.mjs`/`store.mjs`/`face.mjs`/`routes.mjs` 逐件零改——源扫） | 单元测试档 ＋ 收口轮（会话实走——列/探/增一条真实服务器） |
| 审批卡面（机制 = §11.5） | 判类（写类 ⇒ 门 ∥ 读类零弹）∥ 单件 ∥ 批（三值）∥ 拒 ⇒ 不执行 + 行 + 审计 + 续跑 ∥ 兜底三径（回合收 ∥ 中止 ∥ 流断）⇒ 拒值 ∥ 应答端点（三态 ∥ 400 零副作用）∥ `always` ⇒ 行 `auto_approve`（v25）+ PATCH 键 ∥ 收窄（question/secret 无源）∥ 结构（七端点 ∥ 零新审计面 ∥ 核零改） | 单元测试档（`…-admin-approval-cards.test.mjs`——已落盘，实读 **635** 行）＋ 收口轮（浏览器实走：写类一次弹卡 ⇒ 批 ⇒ 执行 ∥ 拒一次） |

## 8. 用例（本域）

| # | 类 | 输入 | 预期输出 |
|---|---|---|---|
| N54 | 正常 | 假模型（一轮文本 + 一轮工具调用）+ 假工具：建会话 ⇒ 发消息（读 NDJSON 流） | 帧序 = `delta`… ∥ `call` ∥ `result` ∥ `end(succeeded)`；`agent_chat_messages` 逐行在场（`user` ∥ `assistant`（含 `toolCalls`）∥ `tool`）；审计 = `chat_start` + 每调用一条 `chat_call` |
| N55 | 正常 | 同一会话连发两轮（轮间重读详情） | 历史重放逐行（角色/序在场——notice 滤除）；模型上下文 = 前轮全量；会话 `status` 终态回 `idle` |
| B48 | 边界 | 流断/客户端断开（回合在途） | 回合照跑到终态（落库不依赖连接）；重读详情 = 全量在场；审计零缺行 |
| B49 | 边界 | 预算超限（假模型恒调工具）∥ 空回合（模型无文本无调用） | `end` 帧 `failed` + notice 行（「预算超限」人话）+ `chat_stop` 行 ∥ 同左（空回合人话） |
| E40 | 错误 | 无会话 ∥ `user` 角色 ∥ 会话不存在 ∥ 在途再发 ∥ 模型不可用（建会话） | 401 ∥ 403 ∥ 404 ∥ 400（「本会话正在执行」）∥ 400（「模型不可用」人话）——各自零副作用（在途门除外） |
| E41 | 错误 | 模型出口抛错（假模型）∥ 工具入参非法（如 `members.create` 缺 `username`） | `end` 帧 `failed` + notice（原因人话）+ `chat_stop` 行 ∥ 工具级错误回灌（`result` 帧 `ok:false`——回合不停，模型可自纠）；会话落库如实 |
| N64 | 正常 | 假模型（两轮：文本 + 工具调用）+ 假工具：发一条（读 NDJSON 流） | 帧序 = `turn(1)` ∥ `delta`… ∥ `usage{prompt,completion,cacheHit,cacheMiss}` ∥ `call`/`result` ∥ `turn(2)` ∥ `delta` ∥ `usage` ∥ `end(succeeded, durationMs, calls)`；usage 逐值 = 假模型 usage；零落库（帧面） |
| N65 | 正常 | PATCH 换模型两态（idle ∥ 回合在途）⇒ 下一回合 | 200 落库新 model；在途回合出口模型零变（当前回合跑完）；下回合出口 = 新 model（假出口入参断言）；历史零动 |
| N66 | 正常 | 图片随 POST（视觉模型位——假模型 + 假图 dataURL）⇒ 详情重读 | 200 流照常；user 行 `data_json.imageParts` 逐值；回放 ⇒ content = parts 数组（模型出口入参断言：text part + image_url part）；详情响应 user 行 `data` 仅 `imageCount`（dataURL 零下发） |
| N67 | 正常 | 在途 `POST …/abort`（假模型长回合） | `end(failed, aborted)` + notice 行（reason `"aborted"`）+ `chat_stop` 审计（reason `"aborted"`）+ 已生成文本 ⇒ assistant 行如实落库；会话回 idle；登记表清零 |
| B65 | 边界 | abort：idle 态 ∥ 不存在会话 ∥ `user` 角色 ∥ 两中止窗（模型调用间 ∥ 调用在途） | 400 人话（「本会话不在执行中」）∥ 404 ∥ 403——零副作用；两窗皆命中（① 下一检查点即停 ② 在途调用当即中断——核 `signal` 通道）；终态同 N67 |
| B66 | 边界 | `images` 拒形三（非数组 ∥ 非栅格 dataURL（svg）∥ 超单图阈） | 逐形 400 人话；库零变；流未起（信封形） |
| E50 | 错误 | 非多模态模型 + images（发送） | 400 人话（「当前模型不支持图片输入」——核 `isNonVisionModel` 判）；库零变；流未起 |
| E51 | 错误 | PATCH：模型不在注册表 ∥ 缺 model ∥ 不存在会话 | 400 ∥ 400 ∥ 404——库零变 |
| N71 | 正常 | PATCH `{ reasoning: "high" }`（模型枚举含 high）⇒ 发一条（假模型出口） | 200 回执 `chat.reasoning = "high"`；库列落值；回合出口 provider 入参携 `reasoningEffort: "high"`；`chatView`/列表/详情三面携 `reasoning` |
| B69 | 边界 | 未设档（NULL）∥ 表外存量值 ∥ 换模型（携/不携档）∥ v15 存量库 | 未设 ⇒ 出口零 `reasoningEffort` 键；表外 ⇒ 零字段（读侧容忍——装配不炸）；换模型 ⇒ `reasoning` 清 NULL；v15 库升 v16 ⇒ 存量行 NULL 零变 |
| E54 | 错误 | PATCH `{ reasoning }`：表外值 ∥ 非串 ∥ `{ model, reasoning }` 同携 ∥ 缺核规格源 | 逐形 400 人话；库零变 |

| N72 | 正常 | 假模型（一轮调 `get_current_time` ＋ 一轮纯文本）＋ 环境工具面核真件（仓内直引）＋ 假 db（一节点 ∥ 一成员 ∥ 一 provider） | 四块行在场（时间 ∥ 环境身份 ∥ 现况计数逐值）＋ 简报含能力段；`end(succeeded)`；`chat_call` 行 `tool="get_current_time"`、`resultCode=0`；工具结果含 `Date:` 读数；回放零含实况行（瞬态不落库） |
| N73 | 正常 | 同一会话连发两条；两条之间新增一个节点（库写） | 第二条现况行计数 +1（读源变更 ⇒ 下回合行变——值随实况） |
| B70 | 边界 | ① 现况读源抛错（替身抛）∥ ② timer 到期（设 1s 项 ⇒ 到期时空闲）∥ ③ timer 未到期 | ① 该行缺席、回合照跑 `succeeded`（块级降级——其余行在场）∥ ② 唤醒径（§15.1）：送达行落库（`user` 行 + `data.kind="reminder"`——行文 = `[System reminder: ⏰ timer — …]` 逐字）＋ 自唤醒一轮；出列幂等——只投一次 ∥ ③ 零 timer 行（在途保留） |
| B71 | 边界 | `bash`：`timeout` 非有限值/小于 1 ∥ `timeout: 700000`（受理形）∥ `async:true`（受理形）∥ 输出超 4000 字 | 首形 ⇒ 工具级错误人话（`ok:false`，回合不停）；`async:true` ⇒ 受理 ⇒ 回执（`bash#N started (running) — log: <path>`——回执即工具结果）；`700000` ⇒ 调用完成（无上限——核件本无量程约束）；超长 ⇒ 落库形截断（≤4000 字含注记）＋ 审计行 `truncated:true` |
| E55 | 错误 | `read` 路径不存在 ∥ `grep` 非法正则 ∥ `bash` 非零退出（`node -e "process.exit(3)"`） | 前两形 ⇒ `ok:false` 人话回灌（回合不停）；非零退出 ⇒ 调用完成（`ok:true`——退出码在输出文本内 `(exit code 3)`）；三形各落 `chat_call` 行（`subject` = 路径/正则/命令原文） |

| N74 | 正常 | 假模型 + 假钟 + `timer` 真件：设 1s 项 ⇒ 到期 ⇒ 空闲（无在途回合） | 送达行落库（`user` 行 + `data.kind="reminder"` ∥ 行文 = `[System reminder: ⏰ timer — …]` 逐字）＋ 自动开一轮（模型出口一次；域文本 = `TIMER_TURN_DOMAIN` 逐字）＋ 助手回复落库；会话回 `idle`；同件不二投 |
| N75 | 正常 | 假模型 + `bash` 真件（`async: true` + 即退命令） | 回执 = `bash#N started (running) — log: <path>`（`tool` 行逐字）；结算 ⇒ 钩子触发唤醒轮 ⇒ 摘要行落库（核件原文 `[System reminder: background bash#N finished — … (exit code 0, …s) — full log: …]`）＋ 助手回复；池空 |
| B72 | 边界 | 闩到点但在途回合（`running`）∥ 未到期 ∥ 零交付（件已由回合边界投递） | 三者皆零动作（零投递 ∥ 零开轮）——回合尾链尾再武装；件不丢（下一回合边界兜底投递） |
| B73 | 边界 | 帽满（池 4 在途 ⇒ 第 5 件）∥ `timeout` 到点 ∥ `kill id:N` 两态 | 帽满 ⇒ 工具级错误人话（零起跑）；timeout ⇒ 杀树 + 摘要行（`killed: timeout`）；kill 在途 ⇒ 杀树 + 确认句（零摘要投递）∥ 已完成 ⇒ 人话错误 |
| B74 | 边界 | 进程重启（进程内态归零） | 闩表/池/汇面天然空（零恢复面——与核 `_pendingTimers` 同判）；在途回合收尾沿既有（`running` ⇒ `idle` + notice）；重启后零唤醒残留 |
| E56 | 错误 | 唤醒评估读会话行失败 ∥ 唤醒轮内模型不可用 | 前者 ⇒ 零动作（闩撤、零注入——不炸进程）；后者 ⇒ 唤醒轮按既有 `model_error` 收尾（零新形）；件留汇面，下一回合边界兜底投递 |
| E57 | 错误 | 同会话两条：首条起 `async` 且长跑 ⇒ 首条被 `POST …/abort` 中止 | 首回合 `end(failed, "aborted")` + notice（`"aborted"`）+ `chat_stop`；在途后台任务杀树 + 丢弃提醒入汇（核件原文）+ 墓碑 ⇒ 后续零摘要投递；次条起跑投递该提醒行（落库） |
| N76 | 正常 | 假模型 + 真库行：会话内 `read_history` 逐过滤（role ∥ keyword ∥ tool ∥ limit/direction） | 输出 JSON 条目逐值（`ts` = 行 `created_at` 毫秒 ∥ role ∥ content ≤500 字）；`chat_call` 审计行（tool=read_history ∥ subject=过滤摘要）；notice 行随全量出（role 原值） |
| B75 | 边界 | `read_history`：空会话 ∥ `path` 传参 ∥ 时间窗外 ∥ `limit` 越界 | `[]` ∥ 工具级错误人话（本会话作用域——零 schema 收窄）∥ `[]` ∥ 核件钳制（1 ∥ 200） |
| N83 | 正常 | 假模型 + 假 ssh：一轮 `exec`（含 sudo 径 + 输出含行凭据值的构造用例） | `call`/`result` 帧 ∥ 结果逐值 ∥ `chat_call` 行（subject=命令原文 ≤2000 ∥ resultCode=exitCode ∥ truncated）∥ 行凭据值零入四面（结果/摘要/subject/帧）∥ 私钥临时档用毕即删 |
| B79 | 边界 | `exec`：未登记凭据 ∥ 解密失败 ∥ 假件超时/不可达 | 工具级错误人话（回合不停 ∥ 零 notice）；零秘密入帧/审计 |
| E61 | 错误 | `exec`：命令空串/超长 ∥ `timeoutS` 非法 ∥ 主机名歧义（多命中） | 工具级错误人话；零 ssh 调用（假件断） |
| N77 | 正常 | 管理登录（admin）⇒ 再登录 ∥ `user` 登录 | `api_keys` 行（name=admin-agent ∥ `key_plain` 非空 ∥ active）+ `key_issue`（surface="admin_agent"）一次 ∥ 同行零重签 ∥ 零新行 |
| N78 | 正常 | 出口全链（真网关链 + 假上游 + 本机自环）：管理会话一轮 | 帧序逐帧（turn/delta/usage/end succeeded）；`usage` 行在场（member=本回合发送者〔缺位 ⇒ 会话 owner〕∥ key=admin-agent ∥ endpoint=chat）；出口入参 = 外标 ∥ selfBase ∥ sk 明文 |
| E58 | 错误 | 出口：sk 未在册（未登录/已吊销）∥ 网关拒（sk 在途吊销 ⇒ 401） | 皆 `model_error` 收尾（notice + `chat_stop`；人话含「重新登录」／网关错误原文）；零落库缺失 |

| N84 | 正常 | 假自环出口（假 fetch 返 SSE：空壳块 ＋ 三段内容增量 ＋ usage 帧）＋ 真装配：`models` ⟮op: `test`, provider, model⟯ | 结果 = `{ ok:true, status:"ok", model, totalMs, ttfbMs（首个内容增量时刻）, tps（completion ÷ 生成窗）, tokens, outputChars }`（键在场形 = §12.1③——`error` 缺席）；`call`/`result` 帧逐值；审计 `chat_call`（tool = `models` ∥ subject = 对外标识）；真链用例 ⇒ `usage` 行在场 |
| B80 | 边界 | ① 流首空壳块（role 声明——`ttfbMs` 不计它）∥ ② 流末无 usage 帧 ⇒ `tps:null`（不估）∥ ③ 空答（零内容增量）⇒ `status:"ok"` ＋ `ttfbMs:null` ∥ ④ `timeoutS` 小值触发首字节前超时 ∥ ⑤ 首内容增量前流中断 ⇒ `status:"broken_stream"`（零部分读数） | 逐形读数（④ 之 `phase` = `before_first_byte`）；零编造数字 |
| E62 | 错误 | ① 未配/草稿值（不在开放清单）∥ ② 网关 404（被禁用/未配）∥ ③ 上游不可达（502 透视）∥ ④ sk 缺位/自环基址缺位 ∥ ⑤ 未接线（缺缝）∥ ⑥ 入参校验（`prompt` 逾 2000 字 ∥ `timeoutS` 非正/非数/越界〔>600〕） | ②③ = 读数面（`http_error`——HTTP 码 ＋ 原文原样；回合不停）；①④⑤⑥ = 工具级错误人话（`{ok:false}`——回灌模型自纠；⑥ 零外呼 ∥ 除逐调用 `chat_call` 行外库零变）；各落 `chat_call` 行 |

| N85 | 正常 | 假 db（两行：一 stdio ∥ 一 http 携秘密）＋ 真 store（假 config）：`mcp` 五动词一轮（list ⇒ add ⇒ probe（假件）⇒ update ⇒ remove） | list 视图逐值（零秘密；`hasSecrets` 布尔）；add ⇒ 行在场 ＋ 结果 `{ id, name, transport, hasSecrets }`（零值扫描）；probe ⇒ `{ ok:true, probe:{ ok:true, toolCount, latencyMs } }` 逐值 ＋ 冷却清（假件断）；update ⇒ `keys` 逐值（含值零入）；remove ⇒ 行消失 ＋ 关闭靶断（假件）＋ `mcp_event` 三 kind 逐值（形同 routes）；逐调用 `chat_call` 行（`subject` = null——本件结果零携，§12.2⑤） |
| B81 | 边界 | probe 失败（假件抛）∥ 缺核（无注入）∥ 编辑三态（字段缺席 ∥ 显式 `null` ∥ 敏感键空串）∥ 寻址两形（`id` ∥ `name`；`update` 缺 `id`） | probe ⇒ 工具面 `ok:true` ＋ `probe.ok:false` ＋ error 人话（自含读数——沿 routes 口径）；三态 ⇒ 库逐值（不变 ∥ 清 ∥ 不变）；寻址两形命中同行 ∥ `update` 缺 `id` ⇒ 工具级错误人话 |
| E63 | 错误 | 形错/未命中六形：名空 ∥ 传输表外 ∥ 必填缺（stdio 无 `command`）∥ 重名 ∥ 未命中（`remove`/`probe`）∥ 未知动词/缺 op | 逐形 ⇒ 工具级错误人话（`{ ok:false, message }`——回合不停）；库零变 ∥ 零外呼 ∥ 零 `mcp_event` 行 |

| N86 | 正常 | 假模型出口（一轮：一次写类调用 `bash`）＋ 真装配 | `ask` 帧（`permission`——promptId/tool/args 在场）⇒ 应答 `{ verdict: "once" }` ⇒ 200 ⇒ `call`/`result` 帧 ⇒ 执行成（假件断命令原文）；`chat_call` 一行（resultCode 0） |
| N87 | 正常 | 同回合两写类调用（`bash` ＋ `members.create`） | 恰一 `ask`（`batch`——count=2 ∥ tools 两件）；`approveAll` ⇒ 两调用执行（先序）；`oneByOne` ⇒ 单件卡依序两弹 |
| N88 | 正常 | `always` 一答 | 行 `auto_approve` = 1（v25 列在场）；同回合后续写类零弹（直执行）；下回合起跑读行 ⇒ 零弹；`PATCH { autoApprove:false }` ⇒ 复位（下回合弹回） |
| B82 | 边界 | `reject` 一答 | 调用零执行（假件断零调用）∥ 工具行 `{ ok:false, message:"用户拒绝——未执行" }` ∥ `call`/`result` 帧在场 ∥ `chat_call` resultCode −1 ∥ 回合并续跑（下条 assistant 文本在场） |
| B83 | 边界 | ① 应答前流断（res close）∥ ② 应答前 `…/abort` ∥ ③ 唤醒轮（无流）写类 | 三径 ⇒ 拒值收口（工具行/审计同 B82）；② 另沿既有中止收尾（notice `"aborted"`）；③ 即时拒（无卡——「无问面」口径） |
| B84 | 边界 | 读类逐件（`ls`/`read`/`grep`/`get_current_time`/`usage.summary`/`audit.query`/`models.list`/`mcp.list`） | 零 `ask` 帧、零卡、直执行（判类逐件断） |
| E64 | 错误 | 应答四错形：未知 promptId ∥ 已了结（后到应答）∥ 体与 kind 不符（值表外 ∥ `{ answer }` 对 `permission`）∥ 非 admin / 无会话 | 400/403/401 人话（零副作用——在决表零动 ∥ 回合不受扰） |

## 9. 关键决策（本域）

| # | 决策 | 理由 |
|---|---|---|
| KD-SV-82 | **管理面 agent = server 进程内（核 `@thincoder/core` + 最小壳）+ 对话面裁剪（§5）+ 无白名单围栏；唯一一个 agent；驱动器 = 聊天式（§11 ∥ KD-SV-88）** | 用户口径 + KD-SV-78（从核引）；进程内 = 直取 server 域件（库/registry/docker 客户端）零 HTTP 回环；执行面机器零驻留延续用户口径 |
| KD-SV-87 | **模型选择 = 会话级（建会话时选定——下拉源 = provider 注册表现有模型；不可用 ⇒ 建会话 400 人话）；会话内可换（明选即换 ∥ 下回合生效——KD-SV-108）** | 显式可见（零隐藏缺省）∥ 零新配置项（免「每配置项有 UI 写入口」新面）；会话内可换 = 用户「补后端一件不藏」直推（模型钮面原子已在——后端补齐） |
| KD-SV-88 | **聊天式驱动 = 管理面 chat 会话（§11）**：① 会话（chat）= 模型选定（建会话时——KD-SV-87 同口径）× 消息序（库两表——KD-SV-89）；② 回合（turn）= 用户发一条 ⇒ agent 环跑到自然结束/预算封顶——**执行不依赖浏览器连接**（流 = 视图；断连照跑）；③ 流式通路 = `POST …/messages` 单请求 + `application/x-ndjson` 帧流（`delta` ∥ `call` ∥ `result` ∥ `ask` ∥ `end` ∥ `turn` ∥ `usage` + `end` 两可字段——§11.3：浏览器 fetch + `ReadableStream` 逐行读）；④ 预算 = 每回合独立（20 分钟 ∥ 60 调用——`DEFAULT_MAX_CALLS`/`DEFAULT_MAX_DURATION_MS` 常量复用）；⑤ 判权 = `requireAdmin` 全族 | 需求 §5「两个 chat 界面」④ + 用户「浏览器流式会话通路」点名；单请求 POST = 写入与执行同跳（零孤儿流 ∥ 判权一次）；NDJSON = 每行一帧零壳（较 SSE `data:` + 空行双层无增益）；执行不依赖连接 = 与「读时单源」先例同拍（刷新/换设备不丢回合）；预算常量复用 = 同一环保险丝（常量单源 = 预算常量件） |
| KD-SV-89 | **会话持久化 = v14 两表 + OpenAI 消息形 + notice 行 + `status` 在途标记（重启如实收尾）**：`agent_chats`（`status` = `idle`/`running`——在途标记） + `agent_chat_messages`（`role` = `user`/`assistant`/`tool`/`notice` ∥ `content`（工具结果 = 模型可见形——按 chat 工具面口径截断 ≤4000 字（`CHAT_TOOL_CONTENT_MAX`）：回放逐字一致）∥ `data_json`（`toolCalls` ∥ `toolCallId`/名/`args`（调用参数原文——回读卡参数与活流帧同字）/摘要）∥ 序）；消息**逐条增量落库**；回放 = 库行装配为模型消息数组（notice 滤除；压缩会话以标记行代覆盖段——§17.3 A3）；**重启** ⇒ `running` ⇒ `idle` + notice 行 + `chat_stop` 审计（重启如实收尾口径） | 聊天上下文 = 长消息序（单列 JSON 每回合全量重写——写放大）；行式 = 逐条增量 + 读面直取；`role` 枚举落 CHECK（形单源）；在途标记落库 = 刷新/多标签页一致（进程内存态不作判据——KD-SV-80/86） |
| KD-SV-90 | **工具面扩展（管理面八件——§12）**：`members`（六动词）∥ `providers`（五）∥ `models`（五）∥ `usage`（`summary` ∥ `rows`）∥ `audit`（`query`）∥ `runners`（`list` ∥ `add` ∥ `remove` ∥ `revoke_credential`——KD-SV-136）∥ `docker`（十动词——**绑定 = 注册节点**：名∥地址经 `sandbox_runners` 查行；未在册 ⇒ 工具级错误回灌）；逐面回指控制台功能点（§12 表）；**进程内直取域件**（KD-SV-82 口径延续——零 HTTP 回环）；写链与路由**同函数**（provider/成员路由内联体提取共享助手——两调用点单源）；`exec`（SSH）**入 chat**（**绑定 = 主机表行**——凭据经录入弹窗录入，文本非通道；KD-SV-136）；节点排空/禁用随控制台同批长（不发明） | 需求 §5「工具面 = 覆盖控制台既有全部管理面……能力逐步长」+ 用户 22:28「server 的管理能力也应该托管给 agent，比如成员管理，provider 管理，模型选择，用量等等」；「控制台与 agent 走同一套调用」口径镜像（docker 面）；进程内直取 = 判权/校验/审计单源（HTTP 回环 = 双判权 + 凭据面重造） |
| KD-SV-91 | **审计型面 = 新 `agent_event`（v14 CHECK 扩型——十三型）**：kind = `chat_start`（会话创建）∥ `chat_call`（每工具调用——逐调用：工具名 ∥ 调用摘要 ∥ 结果码 ∥ 摘要；**读动作同落行**）∥ `chat_stop`（异常收尾：预算超限 ∥ 模型错误 ∥ 空回合 ∥ 重启中断 ∥ 手动中止）；正常回合终 = 无附加行（调用行 + 会话档已足）；**不双记**既有域型（agent 建成员 ⇒ 只 `chat_call` 行）；**凭据类例外（两例）**：① `runners.revoke_credential`（chat 径）⇒ 域行照落（`host_credential_revoke`——凭据生命周期 = 安全面域审计，跨径不得缺）+ `chat_call` 行（**两行**；N82 用例）；② **MCP 配置写径**（`mcp` 工具 add/update/remove——凭据承载配置）⇒ `mcp_event` 三 kind 照落 + `chat_call` 行（**两行**；§12.2⑤ ∥ KD-SV-207①）；detail 掩蔽口径 = 沿任务面（秘密掩蔽 + 摘要截断） | 跨域动作面（members/providers/models/usage/audit/runners 六域）——单一型 + kind 区分（既有型面逐域枚举扩不动）；「每次动作落审计行」= 用户口径（含读动作——沿任务面沙盒先例）；不双记 = 一动作一行（审计页可读性 + 计数诚实） |
| KD-SV-107 | **回合中止 = 协作式双通道**（用户「补后端一件不藏」）：进程内登记表 + ① AbortSignal 透传模型出口（核 `chat(..., { signal })`——`thincoder-core/provider/core.mjs:118`）∥ ② 环内检查点（每模型调用前 ∥ 每工具调用前）；终态 = 第五形 `"aborted"`（notice + `chat_stop` 审计 + `end` failed；部分文本如实落库）；`finally` 清登记（零泄漏）；重启天然空（零持久化）；idle 态 abort ⇒ 400 人话（零副作用） | 在途调用可当即中断（signal 通道 —— 核已在册——不自造）；工具循环内（检查点）；「执行不依赖连接」口径不破（登记表 = 进程内）；单条审计行（不双记） |
| KD-SV-108 | **会话内换模型 = 明选即换（下回合生效）**——KD-SV-87 收正：端点 = `PATCH /api/admin/agent/chats/:id { model }`（`requireAdmin` ∥ `assertChatModelAvailable` 同判 ⇒ 400）；库 = `agent_chats.model` 既有列（零迁移）；在途回合零触（`runChatTurn` 起跑读行——`thincoder-server/src/agent/chat.mjs:352`/`:414`）；零审计行（KD-SV-91 三 kind 不扩） | 用户「补后端一件不藏」——核模型钮面原子已在（控制台补齐后端）；明选即换 = 零新配置面；下回合生效 = 零历史改写；零迁移 = 最小面 |
| KD-SV-109 | **附件面 = 文本档零后端 + 图片随消息行存（视觉门在服务端）**：文本档 = 纯客户端（核 `thincoder-render-core/composer/attach.mjs` 三限 + `withAttachedFiles` 内联——服务端零新面）；图片 = POST `images`（dataURL 列）⇒ 服务端核 `parseDataUrl`（栅格四型 ∥ ≤`IMAGE_MAX_BYTES` 15MB）+ 核 `isNonVisionModel` 视觉门（⇒ 400 人话）；库 = user 行 `data_json.imageParts`；回放 = content 数组（非视觉历史由核 `stripImagesForTextModel` 兜底——`thincoder-core/provider/core.mjs:133`；历史图预算 = 核 `capHistoryImages`——`:135`——服务端零重复）；详情仅 `imageCount`（dataURL 零下发） | 核件阀单源（15MB/30MB、四型——不自造）；服务端复校 = 不信任客户端（直 POST 同验）；零文件面 = 最小落法；详情零下发 = 体量面；两壳同形（VSC 同机制） |
| KD-SV-110 | **会话级思考档位 = 库列 + 设置路由 + 装配携值（三件一套）**（功能点 42 ∥ AC-42）：① **存储** = `agent_chats.reasoning TEXT`（v16 增段——列级 `ALTER`，表不重建；NULL = 未设）+ 换模型随写清；② **设置** = `PATCH /api/admin/agent/chats/:id` 扩为会话设置面——体一次一件（`{ model }` ∥ `{ reasoning }`；同携 ⇒ 400）——`reasoning` 值域 = 核同一枚举（`specForModel(上游).reasoningEffortEnum`——会话 `model` = 对外标识 ⇒ **先经别名反查解上游真名**（`providers.mjs` 别名索引——KD-SV-59）；表外 400 ∥ `null` = 清）；③ **装配** = 回合起跑读行（与 `model` 同点）⇒ 值 ∈ 枚举（解析径同 ②）⇒ provider 配置携 `reasoningEffort`（核载荷门单源消费）；未设 ∥ 表外 ⇒ 零字段（读侧容忍——沿核会话槽「表外串不动」先例，防规格表变更砖死存量会话） | 口径③（会话级——与模型同层存；切会话各自记住）+ 口径②（默认不设 + 换模型回中性）；**零迁移**（存量行 NULL = 今日行为逐字同）；核单源（值域/载荷门/off 语义全在核——服务端零第二份档位语义） |

| KD-SV-112 | **环境块装配 = 四块（三活体尾位瞬态行 ＋ 简报第四块）＋ 块级降级**：① 每回合（请求）造三活体行——时空 ∥ 所在/身份 ∥ 所管现况一行（域件进程内直取）；② **尾位**（历史与本轮消息之后——沿核 `thincoder-core/agent/setup.mjs:176-185` 前缀缓存理由）＋**瞬态**（不落库、不进回放——值随实况的直接后果）；③ 降级 = **块级略去**（该块任一读失败 ⇒ 整行缺席、回合不阻断；无半真值上屏）；④ 第四块「能力与边界」= 简报静态段 ＋ 活体面（`tools.schemas`）；⑤ timer 到期行随组同落 | 需求 43①②（值随实况 ＋ 读失败降级不阻断）；三端对位 = 核回合尾位注入/瞬态不落人读线（`pushEnvStateReminder` 先例）；瞬态 = 零迁移 ＋ 回放口径零破（KD-SV-89）；块级 = 「该块降级略去」字面读法 |
| KD-SV-113 | **环境工具面 = 核件复用（六族八件）＋ 结果归一 ＋ 服务面限幅**：① 件 = `get_current_time` ∥ `process` ∥ `timer` ∥ `ls` ∥ `read` ∥ `grep` ∥ `bash` ∥ `read_history`（§16.1）——**核工具对象原文复用**（实现 ∥ schema ∥ 描述三面同源；动载 `@thincoder/core/tools/*` ＋ `agent-tools/timer.mjs`——沿 `loadCoreChat` 先例）；② ctx 适配 = `{ cwd, signal, agent: timer 垫片, depth: 0 }`（`cwd` = `deps.cwd ?? process.cwd()`；`signal` = 回合中止信号透传 ⇒ bash 树杀）；③ 结果归一 = `{ ok, subject, summary, output }`（`ok` = 调用完成〔未抛错〕——命令退出码在输出文本内，不解析；`subject` = 主语原文——审计数据源）；④ 限幅三件（§14.3）：超时（缺省 120s = 核常量 ∥ **无上限**——仅拒非有限值/小于 1）∥ 输出（工具层 200K 字/2MB 流 ⇒ 落库形 ≤4000 字〔KD-SV-89 单源〕⇒ 帧/审计摘要 ≤300 字）∥ 工作目录（无路径围栏——如实披露）；⑤ 端池参数处置 = `bash.async` 在册（§14.2/§15.1）∥ `process.kill` 的 `id` 靶 = 后台任务杀点；`kill pid` 在册（与 bash 等价） | 「对齐三端」= 同件同语义（自写一套 = 第二份漂移面——KD-SV-78 同判）；限幅 = 需求 43⑤ 明文，值取核内既有常量/惯例（零新口径）；结果归一 = chat 面既有 `{ ok, … }` 形；`subject` = 审计「命令原文/路径」的钱货（需求 43⑥） |
| KD-SV-114 | **工具动作审计 = 详情扩字段（`subject` ∥ `truncated`）＋ 审计页按型模板**：① 落面 = 既有 `chat_call` 行（KD-SV-91 面不扩——零新型/零新 kind）；`detail` 增 `subject`（主语原文 ≤2000 字——命令/路径；逾限截断并注记；**落库前与 `call` 同链过会话面掩蔽**——「原文」= 未经摘要重写的完整命令，非免掩蔽）∥ `truncated`（**结果可见形**被截断〔`capToolContent` 触发〕）；成败 = 既有 `resultCode`；② 页面 = `views-audit.mjs` 增 **agent 行详情模板**（`tool · subject · 成败 · 〔截断〕 · summary`——非裸 JSON）＋ 三文案键（`audit.agentOk` ∥ `agentFail` ∥ `agentTruncated`——两表同步） | 需求 43⑥（每次调用一行 ＋ 命令原文/路径 ＋ 成败 ＋ 截断态 ＋ 页面可读）；`detail` = JSON 面 ⇒ 零迁移零 CHECK 改；页面模板 = 沿沙盒 `kind` 族先例（按型渲染） |

| KD-SV-125 | **唤醒面 = 一器两源（核闩复用 ＋ 结算钩子），空闲判定单源 = 会话行 `status`**：① 闩 = 核 `createTimerWatch`（`thincoder-core/agent/timers.mjs:79`——会话键面表 ∥ `getAgent` 活读垫片 ∥ `unref`）；② 第二源 = `pad._asyncWaiters` 钩子（核结算尾唤醒单点 `wakeAsyncWaiters`（`agent-tools/async-settle.mjs:324`）的兑现面——钩子**先自再武装再评估**，因核 splice 一次性消费）；③ 空闲判定 = `chatRowOr404(db).status === "running"`（**DB 单源**——与在途门/`claimChatTurn` 同判，不设进程内忙旗）；④ 火策略 = 核 `fireTimerWake`（`timers.mjs:102`：busy ⇒ `false` ∥ `deliver()` 纯判据非真 ⇒ `false` ∥ 真 ⇒ 开会话轮）；⑤ 再武装三链尾 = 用户回合尾 ∥ 唤醒回合尾 ∥ 结算钩子；**已到期不武装 0ms 闩**（交链尾消化——防自旋/惊群）；⑥ 重启 = 进程内（与核 `_pendingTimers` 同判——已核「非差异」） | 跨端用户可见差异 = 缺陷（用户「为啥要有这些差异？我真服了。」）；核三件（闩/火/判据）三端已在用 ⇒ 复用 = 零第二套语义；空闲判定取 DB 单源 = 进程内忙旗与在途门必分叉（两处状态）；零轮询 = 沿三端先例（`unref` 一次性闩——`heap-watch` 同族） |
| KD-SV-126 | **异步面 = 核池原样 ＋ 会话垫片即宿主（零自造池），送达 = 汇面落库**：① `bash.async` 显式拒**删除**——核件（`thincoder-core/tools/bash.mjs`）按 `ctx.agent` 走 `launchBgTask`（`agent-tools/bash-async.mjs:100`——帽 4 ∥ 回执 ∥ 池 ∥ 结算 ∥ 杀单点全在核）；② 垫片为宿主 = 核载体字段面（池/pending/唤醒栓经核 API 落面：`ensureBgPool` ∥ `parkAsyncPending` ∥ `wakeAsyncWaiters`；`history` 数组为 carrier 回落——**零自造第二池**）；③ 送达 = 汇面（`pad.history`）⇒ **落库**（`user` 行 + `data.kind="reminder"`）⇒ 随历史进上下文（零二次注入）；④ 取消面 = `process action="kill" id:N`（核 `killBgTask`——杀树 + 出池 + 墓碑）；⑤ 中止面 = 池条目控制器链**当刻回合信号**（`_sessionSignal` 不设 ⇒ `buildChildSignal`（`agent-tools/async-settle.mjs:165`）回落 `ctx.signal`）∘ 非 interrupt 中止 ⇒ 回合尾 `discardAbortedBgTasks(pad)`（杀 + 提醒 + 墓碑——判据沿核 `run-stages.mjs:205-218`） | 核四端机制在盘（用户「我说的就是异步啊！」）——自造池 = 第二份漂移面；送达必须落库 = 机读线单源（VSC 先例：`thincoder-vscode/src/extension/timer-watch.mjs:11-12`「不落盘 = 下一次 run 读不到 = 静默丢」） |
| KD-SV-129 | **管理会话模型出口 = 本进程网关链的 loopback 客户端**（用户「应该走我们自己的模型代理服务，这样才能确保用量统计的准确」）：① 目标 = `http://<本机监听地址>:<port>/v1`（`server.address()` 惰性读；通配 `0.0.0.0` ⇒ 拨 `127.0.0.1` ∥ `::` ⇒ `::1`；不经 nginx）；② 凭据 = 本回合发送者的 `admin-agent` sk（§16.3——KD-SV-130；唤醒/续跑轮随最近发送者、主人兜底）；③ 模型 = 会话行 `model`（**对外标识**——与会话创建/四端客户端同形）；④ **复用面 = 网关链全链逐字**（鉴权 ∥ 派发 ∥ 准入三件 ∥ 转发 ∥ 记账——零第二份）；⑤ 失败面沿既有五终态（sk 缺/网关拒 ⇒ `model_error`）；⑥ 唤醒回合同源（同装配）。**与 KD-SV-82「进程内直取」不冲突**：域件读 = 管理动作面（进程内），模型调用 = 对外契约面（走网关） | 账只能对在网关链（记账/配额/限流/判权四单源全在那）；loopback = 零网关重构（`thincoder-server/src/gateway/forward.mjs` 中继与路由解耦不做）；「跟客户端一样」字面达成（连核规格面同客户端既态——§16.2 差异三条已披露） |
| KD-SV-130 | **管理面 sk = 成员级一枚（`admin-agent`）＋ 登录 ensure ＋ 明文落库面**（用户「登陆时分配一个sk给管理会话用」）：① 归属 = 本回合发送者（成员级、跨会话稳定；唤醒/续跑轮随最近发送者、主人兜底）；② 触发 = `POST /api/login` 成功 ∧ `role = "admin"` ⇒ `ensureAgentKey`（幂等：在册 ⇒ 复用零重签；非 admin 零动作）；③ 名 = `admin-agent`（常量单源 = `thincoder-server/src/accounts/keys.mjs`）；④ 明文落面 = `api_keys.key_plain`（v19 增段——NULL = 常规 key；仅 `issueKey({ keepPlain: true })` 写；服务端即消费方——同沙盒工作区 `key_plain` 先例）；⑤ 审计 = 首发一条 `key_issue`（`detail = { keyHint, surface: "admin_agent" }`——`surface` 取值域扩，随正 = `docs/server/design/accounts/ACCOUNTS.md` §2.1）；⑥ 免 20 上限（服务端签发面沿客户端/CLI 先例）；⑦ 生命周期沿 key 面（逐请求查库 ⇒ 吊销即断；轮转连带） | 「同客户端口径」= 用户原话；落 key 表 = 列表/吊销/用量归因全复用（零第二份凭据面）；ensure 幂等 ⇒ 登录路径零新状态；明文列 = loopback 每回合需真凭据（服务端即消费方——沙盒先例同判） |
| KD-SV-131 | **`read_history` 落法 = 核件原样 ＋ 库面 `_recordStore` 适配（本会话作用域）**（用户「管理端目前没有查会话历史的工具，这个也需要打开。」）：① 件 = `thincoder-core/agent-tools/read-history.mjs` 原文复用（实现/schema/描述三面同源）；② 记录面 = `pad._recordStore = recordStoreOf(db, chatId)`（`chat-store.mjs` 新增导出——`iterate(direction)` 生成器；行 ⇒ 记录形：`ts` = `created_at` 毫秒；tool 行携 `name`/`tool_call_id`；assistant 携 `tool_calls` 重建形）；③ 作用域 = 本会话（`path` 非空 ⇒ 运行期拒——服务面无会话树）；④ notice 行在列（核件不校验 role）；⑤ 环境族第八件（第六族「会话」）；⑥ 审计沿 `chat_call`（`subject` = 过滤摘要） | 复用优先（核件已有 role/keyword/tool/时间窗/limit/direction 全套过滤与截断——自写 = 第二份语义）；`_recordStore` = 核自持注入缝（记录面单源 = KD-SV-89 库面）；跨会话在服务面无语义（一会话一行）⇒ 运行期拒（沿端池参数先例） |

| KD-SV-136 | **chat 工具面扩 = `exec`（主机表行绑定）＋ `runners.revoke_credential`（第八件）**（用户裁：SSH 凭据进管理面 chat）：`exec(host, command, timeoutS?)`——绑定 = 主机表行（名 ∥ 地址经 `runnerByRef` 单源，与 `docker` 同判）；缺凭据 ⇒ 工具级错误（人话指向录入弹窗）；传输 = `thincoder-server/src/sandbox/ssh.mjs` `createSshExecutor`（同件）∥ 凭据 = 行密列解密（既有加解密单源）∥ 审计 = `chat_call`（subject = 命令原文）∥ 掩蔽 = `maskSecrets` + **行凭据值**（输出/摘要/subject 同链）；`runners` 动词 += `revoke_credential`（主机表凭据零化 + `host_credential_revoke` 审计）；零新端点 ∥ 零新审计型 | 用户「进 chat」的落点 = 工具面（会话内可执行）；绑定沿 `docker` 先例（机队语义——不接任意地址）；三单源（传输/加解密/审计） = 零第二份；掩蔽含行凭据值 = 秘密纪律（KD-SV-114 同精神）；任务式面已退场（装机 = chat 内动作） |

| KD-SV-205 | **模型测试 = `models` 第六动词（`test`）——经网关链 loopback 单请求 ＋ 五读数**（用户提 ＋ 两句厘定）：① **形** = 面内动词（第六动词；工具名集八件不变——沿 KD-SV-90「每动作一工具」口径）；对象 = **已配渠道点名**（`provider` ＋ `model`（上游名 ∥ 别名）——解析 → 对外标识）；② **通路** = 单次 `POST <selfBase>/v1/chat/completions`（本回合发送者的 `admin-agent` sk——装配同源 = `chatProviderOf`；§16.2/§16.3 ∥ `thincoder-server/src/agent/chat.mjs:360`）；经网关链全链 ⇒ **记账自动**（usage 行——member = 发送者 ∥ key = `admin-agent`；零第二份）；③ **读数五件** = `status`（闭集五支：`ok` ∥ `timeout`（携阶段）∥ `http_error`（携 HTTP 码）∥ `bad_response` ∥ `broken_stream`）∥ `error`（原文摘录——原样、帽 500 字）∥ `totalMs` ∥ `ttfbMs`（首个**非空内容增量**——流首空壳块不计）∥ `tps`（`usage.completion_tokens` ÷ 生成窗——usage 缺 ⇒ null，不估）；④ **预算** = `timeoutS`（缺省 60 ∥ 上界 600——值域形沿 `exec` 同面先例；非正/非数/越界 ⇒ 工具级错误人话；界值依据 = §12.1①；`AbortSignal.timeout` ＋ 回合中止信号透传）；⑤ **审计** = 既有 `chat_call`（零新 kind/型——KD-SV-91 面不扩）；⑥ **边界** = 不做草稿值试连（未配 ⇒ 工具级错误——与 AC-18「测试连接」草稿面划界）∥ 无控制台对位面 ∥ 成员面不做 ∥ 零新端点 ∥ 零迁移 | 用户定案（「走网关链，记账」「首字节延迟和吞吐也需要」）；账只能对在网关链（KD-SV-129 同判）；读数五件逐条可机检（假 SSE 流注时刻）；面内动词 = 八件口径不破 |

| KD-SV-206 | **MCP 管理 = 管理面第九件工具 `mcp`（五动词）——复用 `mcp/` 域件零第二实现**（功能点 56 ∥ AC-56）：① **形** = 新工具 `mcp`（工具名集**九件**）：动词 `list ∥ add ∥ update ∥ remove ∥ probe`（命名沿 providers 族；`probe` 与端点 `POST /probe` ∥ 核 `probeMcpServer` 同词单源）；② **寻址** = `update` 以 `id`（`name` 键 = 改名——providers.update 同形）；`remove`/`probe` = `id` ∥ `name` 两形（名唯一——docker/exec 按名寻址先例）；③ **复用面（零第二实现）** = `store.mjs`（`listMcpServers` ∥ `insertMcpServer` ∥ `updateMcpServer` ∥ `removeMcpServer` ∥ `resolveProbeConfig` ∥ `mcpServerView`——形校验/编辑口径/密文列/探活体解析全在件）＋ `face.mjs`（`closeMcpServer` ∥ `loadCoreMcp` ∥ `clearMcpCooldown`）——新档零自造 SQL/零第二加密/零第二探活；**同形重复（不可共享——如实登记）** = `routes.mjs` 两处内联形体（探活调用 ＋ 读数归一：`104-134` ∥ `mcp_event` detail 三写入点：`43-49`/`64-70`/`84-90`）——不抽共享件（抽件须动 routes——与 ±0 声明相抵）⇒ 新档同形自建 ＋ 源扫腿限定引件面（§12.2②）；④ **执行器落点** = `thincoder-server/src/mcp/admin-tools.mjs`（已落盘——实读 **222**）——并面点 = `chat.mjs` `buildChatToolFace`（第四面——与 envTools/mcpFace 同形；面名 `mcp` 入 MCP 用面重名防御基线 `reservedNames`）；⑤ **探活** = 零副作用（不进会话 ∥ 不动库 ∥ 不落 `mcp_event`——沿 routes 口径；成 ⇒ 清冷却）；对象 = 库内行（草稿试连 = 控制台新建窗面——§12.2⑥）；⑥ **结果形** = 管理族 `{ ok, … }` JSON（文本面零涉——`textNames` 不含；读数产出恒 `ok:true`——探活不可达 = 读数 ≠ 工具失败，沿 `models.test` 同判） | 用户「另外，mcp配置工具也开始落地。」；诉求 = 与 provider/member 管理族同形（AC-56①）；域件已交付（五端点 ∥ 存储 ∥ 探活全链）⇒ 复用 = 零第二实现（AC-56②）；执行器独立成档 = 500 软线 ＋ `chat-tools.mjs` 上限 700 不越 |
| KD-SV-207 | **MCP 管面审计 = `mcp_event` 三 kind 照落 ＋ 驱动层 `chat_call` 逐调用（两行）；凭据 = 只写零回显**：① **审计** = 写动作（add/update/remove）经工具径 ⇒ `mcp_event`（`server_add` ∥ `server_update`（携 `keys`——值永不入）∥ `server_remove`——**detail 形与 routes 逐值同构**；actor/actorId = 会话 actor）＋ 驱动层 `chat_call` 一行（＝两行；**凭据承载配置跨径不得缺**——KD-SV-91 凭据类例外同精神；AC-56⑤「三 kind 复用」字面）；`list`/`probe` ⇒ 仅 `chat_call`（读/诊断——探活零落库零审计沿 `docs/server/design/mcp/MCP.md` §3.3）；零新 kind/型；② **凭据** = `token`/`headers`/`env` 可入参（**只写**——对齐 providers `apiKey` 先例）：结果面零秘密（视图 `hasSecrets` 布尔——单源 = `mcpServerView`）∥ 审计 detail 零值（`keys` 只顶层键名）∥ 日志零值（新档零携值日志点）——AC-56③ 三面零回显；`args` 落库/帧面 = 既有掩蔽链（键名表单源 = `SENSITIVE_KEYS`——`thincoder-server/src/agent/chat.mjs:230`；`token` 等列名键 ⇒ `***`；`headers`/`env` 袋内非列名键值 = 残余暴露（随 `args` 落库/帧面 `call` 可见）——如实披露；实证 = `thincoder-server/` 全树零 `SECRET_FORM`——掩蔽单源 = 键名表）；`${env:VAR}` 引用透传（核建连期解析）；③ **错报治理** = 能力叙述认 MCP（`CHAT_LIMITS_BLOCK` 管理族行 ＋ schema 描述——「可管清单 ∥ 已配服务器工具随回合可用」两义同叙） | AC-56⑤ 字面（三 kind 复用 ＋ 动作可归因）；KD-SV-200 理由栏（凭据/命令类配置变更从不静默）——跨径一致；探活零副作用 = routes 既定口径 |
| KD-SV-208 | **`chat.mjs` 736/737 越拆档线的处置 = 微触（净 ≈+10）不拆档**：① 越线事实 = 实读 **736/737**（`\n`/总行）＞ 720；② 触面 = 并面四处（import ∥ 建面块 ∥ 合并表 ∥ 预留名——净 ≈+10，**预估 ≤15 ⇒ 微触**）；③ 不拆理由 = 拆档对象（唤醒径整段抽 `chat-wake-turn.mjs`）与本题无关 ∥ 唤醒径零触 ∥ 单批混装「工具新增 ＋ 结构重构」= 验收/复核面翻倍；④ 触发 = 实施轮实落净增 >15 行 ⇒ 先拆后落；⑤ 拆档预案维持原判（对象/先例在案） | 父侧知会（越线 ＋ 纪律「下一触碰批动工前先审拆分」：审拆分 ∥ 微触＋理由 二择一）；本面净增局部、加性、与唤醒径零交集 |

| KD-SV-224 | **管理面审批卡面 = 写类门挡 + ask 回路（用户 2026-10-17 裁「必须上审批卡」；形同成员面）**：① 落点 = 回合环门挡 + 新档 `chat-asks.mjs` + 应答端点（七端点）+ 页卡；② 词表/帧形/卡件单源 = 成员面（两裁决表与 `askAnswerBodyOf` 导入复用；卡 = 核两件）；③ 收窄 = question/secret 不接（无源）；④ `TRIMMED_FACES` 删 `"approval"`；全形 = §11.5 | 词表导入零第二份；收窄带实证 |
| KD-SV-225 | **判类单源 = 工具面 `readonlyOf` 扩缝**：环境族 = 核 `readonly` 旗逐字 ∥ 管理族 = 逐动词只读表（免 = 各读类动词——全表 = §11.5）∥ MCP 件恒写类（核 `readonly:false`）∥ 未声明面（注入口/假件）⇒ 读类（既有消费零破） | 单源（零第二判 ∥ 假件零破 ∥ 同核旗语义）；未声明面取旧行为 = 回退保守 |
| KD-SV-226 | **`always` ⇒ 会话行 `auto_approve`（v25 增列）+ PATCH 第三键**：`always` 结算 ⇒ 置真（当回合即时免问）；`PATCH …/:id { autoApprove }`（一次一件第三键——下回合生效）；行形四面（建/列表/详情/PATCH 回执）同源携键；零审计行（三 kind 不扩——会话设置面沿例） | 槽语义同成员面（跨重启存续）；`#auto-btn` 留隐（钮位面出列——§13 R91③） |
| KD-SV-227 | **兜底三径（回合收 ∥ 中止 ∥ 流断）⇒ 拒值；问面 = 活体流**：无流（唤醒轮）⇒ 写类即时拒（`{ ok:false, message:"无问面（无人值守轮）——未执行" }`）；拒执行面 = `call`+`result` 帧 + 工具行 + `chat_call`（resultCode −1）；未决卡 = 回合挂起（中止/重启可解——同成员面判） | 「执行不依赖连接」对写执行不破；无流断重挂面 ⇒ 断即拒（拒挂起吊死回合）；拒必可见（帧+行+审计三面） |
| KD-SV-228 | **`chat.mjs` 越线处置 = 门挡全逻辑外置（Δ ≤15；超出 ⇒ 先拆后落）**：触发续 KD-SV-208④；拆案对象 = 回合收尾段（终态五形收尾 ∥ notice ∥ 审计）⇒ `chat-turn-end.mjs`（拟） | KD-SV-208 纪律承接（>15 ⇒ 先拆）；外置 = 触面最小化；`migrations.mjs` 795 ⇒ ≈804 同判（拆案 = DDL 段常量外拆 `migrations-ddl.mjs`——纯搬迁零语义） |

## 10. 本域边界（不做的面）

- **权限模型/围栏改造**（admin 权限管理归用户——12:47 裁；本面只保证留痕：每次工具调用一审计行）。
- **路径围栏 ∥ 命令白名单**（不设——沿核口径：`resolveInCwd` 无边界断言 ∥ bash 无命令过滤；如实披露 = 任一 admin 成员可经对话页在服务器跑命令/读文件〔含密钥与库文件面〕——需求 43 风险在册）。
- **三端无对应物项**（git 上下文 ∥ 项目档注入 ∥ 同目录实例——需求 43 边界句；服务端无该物）；**cwd 在册**（②行 `cwd:` 字段 + §14.3 工作目录限幅）。
- **唤醒开关 ∥ 唤醒频率下限**（三端 `agent.timerWake` 键 = 端配置文件面，服务面无该面；频率下限/周期式样 = 兄弟批设计面——§15.3 ②③）。
- **timer/后台任务的可视面**（控制台提醒行样式 ∥ 状态行段 ∥ 定时器与后台任务列表 ∥ 唤醒开关控件——新 UI 面，且 `views-chat.mjs` 已贴 500 软线；§15.3 ②）。
- **浏览器后台动作族（`browser.async`）**（本面八件无 browser 件 ⇒ 零对位面——§15.2）。
- **`wait_for` 工具**（核族件；本面八件口径不含——任务等待面 = 结算投递，§15.1）。
- **`read_history` 的跨会话面**（`path = 文件 ∥ cwd: ∥ all`——服务面无会话树；运行期拒——§16.1）；历史删除/编辑（不设）。
- **MCP 管面不做（§12.2）**：草稿试连（未落库全量体——控制台新建窗面）∥ 逐服务器工具开关/白名单（沿 `docs/server/design/mcp/MCP.md` §7）∥ 成员面 MCP（沿 `docs/server/design/mcp/MCP.md` §6）；改名 = 仅 `update` 的 `id` 径（按名寻址时不可改名——防寻址/改名同键歧义）。
- **文件编辑族工具（write/edit/apply_patch）**（不入册——写入仍可经 `bash` 抵达，工具面如实；核 `bash` 描述指向 edit 族的指引在本面落空 = 核文案面发现项，§13 R62③）。
- **成员面 agent 的 server 域工具面归属** = `docs/server/design/agent/MEMBER-AGENT.md` §2 KD-SV-159：范围 = 成员本人资源；动作集 = 写面同集——单源（创建 ∥ 启动 ∥ 停止 ∥ 销毁 + 拉仓）；管理面运维件（docker/主机/exec/provider）不入成员面；逐件清单与实施 = 实施批从实需反推。
- **审批卡面不做（§11.5）**：question/secret 两 kind（无源——收窄条在册）∥ `#auto-btn` 钮位面（留隐——模式位三段另批）∥ 在决 ask 读数段（状态行零增）∥ 卡面 diff 预览（工具面无文件编辑族）。
- **chat 面不做（§11/§12）**：SSH 凭据经 chat **文本**输入（凭据入口 = 结构化弹窗——沙盒页节点行动作 ∥ 对话页钮，同一弹窗件；**文本非通道**：秘密零入消息行/模型上下文）∥ 会话删除/重命名/归档 ∥ 会话自动清理（不设清零）∥
  沙盒工作区/设置各面工具（随沙盒余面批同批长）∥ 节点排空/禁用工具（不发明）∥ **思考档位的逐条覆写/状态行段**（口径③④恒会话级；`✦reasoning` 零引用）。
- **多任务编排/队列**（任务式面已退场；独立编排器不加 ∥ 定时/事件触发 = chat 面 timer/唤醒——§15）。

## 11. 聊天式驱动（管理面 chat）

- **形态**：管理面 chat = 管理面 agent 的驱动形态（唯一）——浏览器侧 = 控制台页 `#/admin/chat`（`docs/server/design/webui/CHAT.md` §2.1）；用途 = 运维/管理（机队 ∥ 成员与 provider ∥ 审查排障——**非开发用途**；需求 §5「两个 chat 界面」②）。工具面框架 = 管理面九件（§12）+ 环境六族八件（§14）；同一审计面、同一模型出口面（§5——管理会话出口实现 = §16.2：本机网关链 + 本回合发送者的 sk——谁用谁）。
- **会话（chat）**：`model`（建会话时选定——KD-SV-87 同口径；**会话内可换**——明选即换、下回合生效（KD-SV-108））+ 消息序（库两表——KD-SV-89）；列表/详情 = 读时读（无后台常驻）。
- **回合（turn）**：用户发一条 ⇒ 装配 = 系统简报（管理面用途句 + 行动纪律句 + 能力边界段——§14.1 第四块）+ 历史重放（含图——KD-SV-109；压缩会话以标记行代覆盖段——§17.3 A3）+ 本轮消息 + **环境块**（三活体行 + timer 到期行——尾位瞬态、不落库；§14.1）⇒ agent 环（多轮工具循环）跑到自然结束（模型出口 = §16.2：本机网关链 loopback + 本回合发送者的 `admin-agent` sk——出账归因同点）。
  终止**五形**（`data.reason` 各点名）：

  - **① 自然结束** = 模型无工具调用（`succeeded`）——唯一不追加收尾行的形。
  - **② 预算超限** = 20 分钟 ∥ 60 调用（**每回合独立计**）⇒ `"budget"`。
  - **③ 模型出口抛错** ⇒ `"model_error"`。
  - **④ 空回合** = 无文本无调用 ⇒ `"empty_turn"`。
  - **⑤ 手动中止** ⇒ `"aborted"`（KD-SV-107）。

  ②③④⑤ 三件同套：notice 行（人话 = `content` 面）＋ `chat_stop` 审计 ＋ `end` 帧 `failed`。
  ②③⑤ 已生成文本 ⇒ `assistant` 行如实落库（部分文本，回放逐字一致；与 notice 行各自一行）；零文本 ⇒ 零 `assistant` 行。
- **流式通路**（KD-SV-88）：`POST /api/admin/agent/chats/:id/messages` 单请求；响应 = `application/x-ndjson` 帧流（每行一帧）。帧型逐条：

  - `{"type":"delta","text"}`——模型文本增量（核 `onToken`）。
  - `{"type":"call","id","name","args"}`——工具调用开始；`args` = **字符串**（参数摘要：JSON 序列化 ⇒ 掩蔽后截断 ≤500 字；恒为字符串，非对象）。
  - `{"type":"result","id","ok","summary"}`——结果摘要 ≤300 字。
  - `{"type":"ask","kind","promptId",…}`——审批卡（§11.5）。
  - `{"type":"end","status","reason"?}`——回合终态；两可字段 = `durationMs` ∥ `calls`。
  - `turn` ∥ `usage`——轮次界（每模型调用前）∥ 每次调用用量（有源才发）；帧形全文 = §11.3。

  **执行不依赖连接**：断连照跑（落库单源；页刷新/重开重读会话详情即全量）。流前错误（判权 ∥ 形 ∥ 在途 ∥ 不存在）= 统一信封；流中失败 = `end` 帧（headers 已发，不再走信封）。
- **在途门**：同会话 `status = running` 期间再发 ⇒ 400 人话（「本会话正在执行——等它结束」）；跨会话并发不设限（不发明）。
- **重启恢复**（重启如实收尾口径）：启动装配期 `running` ⇒ `idle` + notice 行（「server 重启——本轮中断」；`data.reason` = "restart"）+ `chat_stop` 审计行；已落库消息零动。
- **判权与审计**：七端点全 `requireAdmin`（界面显隐非判据）；审计 = `agent_event`（KD-SV-91——`chat_start` ∥ `chat_call` 逐调用 ∥ `chat_stop` 异常收尾）。
- **行动纪律句（系统简报内——提示词级，非机制门）**：先查后动（读数先于动作）∥ 结果用逐句人话 ∥ 破坏性动作（删节点 ∥ 吊销凭据 ∥ 重置密码 ∥ 删 provider ∥ 停模型）先说明将做什么、再执行 ∥ 凭据请求 = 指向主机凭据弹窗（**不要请用户把凭据发在聊天里**） ∥ 不确定 ⇒ 问用户。
- **测试注入缝**（§7 单元测试档判据依托）：模型出口 ∥ 工具面 = 模块级注入（setter ∥ 参数覆盖——默认 `null` ⇒ `??` 回落真件，生产行为不变；沿 `docs/server/design/sandbox/SANDBOX.md` §13 `fetchImpl`/`execImpl` 注入面先例）；控制台面假流桩 = `docs/server/design/webui/WEBUI.md` §6 行。

### 11.1 呈现面

- **渲染面 = 复用渲染核**（本域零新增机制；用户指出「第四套 chat」+「改」）：管理面 chat 的呈现面（markdown ∥ 代码块高亮 ∥ 工具卡 ∥ 流式增量 ∥ 滚动行为）由 `thincoder-render-core` 承载（取件形 = 控制台静态面第二根 `/rc/*`）；对齐集与做/不做逐项 = `docs/server/design/webui/CHAT.md` §2.1 ∥ 决策 = 该档 KD-SV-101。
- **本域零变化**：会话 ∥ 回合 ∥ 帧流七型 ∥ 消息 role 四值 ∥ 工具面 ∥ 审计面均不动（呈现面 = 控制台侧消费面）；**帧面/落库面无 reasoning 文本通道**（例外 = 落库面 tool 轮回声道——§17.3 A1；思考块 = 模型思考文本——与思考档位 `reasoningEffort`（请求参）无关，后者 = KD-SV-110） = 呈现面不做思考块的根因（加文本字段 = 本域面——余项，不在射程）。
- 工具卡呈现 = 核件 `renderToolCard` ∥ `finishToolCard`（失败判定 = 核 `isToolFailure`）；工具行语义面（§12 表）不变。
- **输入区全件翻做**：面板 ∥ 控件行 ∥ 附件 ∥ 斜杠 ∥ 模型菜单五件均入呈现面；适配层与无源钮收窄 = `docs/server/design/webui/CHAT.md` §2.1③；四件控件后端 = 本档 §11.2。

### 11.2 输入区四件后端

- **① 会话内换模型**（KD-SV-108——KD-SV-87 收正）：端点 = `PATCH /api/admin/agent/chats/:id`（体 `{ model }`——`requireAdmin`；模型校 = `assertChatModelAvailable` 同判 ⇒ 400 人话）；响应 = 200 `{ chat: { id, model, status, createdAt, updatedAt } }`（同建会话行形）。
  - 库 = `agent_chats.model` 既有列（零迁移）；语义 = **明选即换、下回合生效**（在途回合零触——`runChatTurn` 起跑读行（`thincoder-server/src/agent/chat.mjs:352`）∥ 出口于回合内装配（`:414`））；零审计行（KD-SV-91 三 kind 不扩——换模型 = 会话设置面）。
- **② 附件**（KD-SV-109）：**文本档** = 纯客户端（核 `thincoder-render-core/composer/attach.mjs` 三限（单档 256KB ∥ 每回合 4 个 ∥ 合计 512KB——**值以核件为单源**）+ `withAttachedFiles` 内联进 `content` 文本）——**服务端零新面**；**图片** = 随 POST 体 `images`（dataURL 列）：
  - 服务端校验 = 核 `attachments.mjs` 单源：`parseDataUrl`（栅格四型 png/jpg/gif/webp ∥ 单图 ≤ `IMAGE_MAX_BYTES` 15,000,000）——不合 ⇒ 400 人话；视觉门 = 核 `isNonVisionModel(model)`（规格表单源）⇒ 非多模态 ⇒ 400 人话（「当前模型不支持图片输入」）；流未起（信封形）。
  - 落库 = user 行 `data_json.imageParts`（parts 形：`[{ type: "image_url", image_url: { url: dataURL } }]`——回放直取）；**详情响应仅 `imageCount`**（dataURL 零下发——体量面；`messageView` 收口）。
  - 回放 = `replayMessages` 重建 content 数组（`[{ type: "text", text }]` + parts——非多模态历史由核 `stripImagesForTextModel` 兜底（`thincoder-core/provider/core.mjs:133`）∥ 历史图预算由核 `capHistoryImages`（`:135`）——**服务端零重复实现**。
  - 边界：图片零文件面（无缩略图/下载/文件存储——dataURL 随行存；体量口径 = 披露）。
- **③ 回合中止**（KD-SV-107）：端点 = `POST /api/admin/agent/chats/:id/abort`（`requireAdmin`；`chatRowOr404`；会话非 `running` ⇒ 400 人话（「本会话不在执行中」）——零副作用）；响应 = 200 `{ ok: true }`（终态经流/详情呈——本响应只言「已请求」）。
  - 机制 = **进程内中止登记表**（`Set<chatId>`——`requestChatAbort` ∥ `isChatAbortRequested` ∥ `clearChatAbort`；`chat.mjs` 模块级——零持久化，重启天然空）+ **双通道生效**：① `AbortSignal` 透传模型出口（核 `chat(..., { signal })`——`thincoder-core/provider/core.mjs:118`；在途调用当即中断）② 环内检查点（每模型调用前 ∥ 每工具调用前——协作式，非抢占）。
  - 收尾 = 沿异常收尾径（notice `"aborted"` + `chat_stop` 审计 + `end` 帧 `failed`）+ `finally` 清登记（零泄漏）；审计行 = 一条（`chat_stop` reason `"aborted"`——中止请求本身零审计行，不双记）。
- **④ 斜杠命令表**（控制台装配——核 `composer/slash.mjs` 机制单源）：`/model`（⇒ 开模型菜单——同钮同函数）∥ `/new`（⇒ 新会话弹窗）∥ `/help`（⇒ `formatHelp` 行集就地打印）；别名 `/m` ∥ `/n` ∥ `/h`（CLI `SLASH_ALIASES` 键集内）；**表纪律** = 不得自创命令名（名 ⊆ CLI `SLASH_COMMANDS` 名集）；未知 ⇒ 核 `slash.unknown` toast（文本保留不发送）∥ 带参 ⇒ 核 `slash.args` toast。

### 11.3 帧面扩展与视图读数源（`turn` 帧双职：状态行 ＋ 活流分步界）

- **加性扩展**（既有消费零破——`end` 增可字段；新帧 = 新 type）：
  - `{ "type": "turn", "n": 1 }`——每模型调用前发（n = 本回合第 n 次调用）；**双职帧**：控制台状态行轮次 ＋ **活流分步界**（每到达 ⇒ 上一步收束、新步起——一步一块；消费面 = `docs/server/design/webui/CHAT.md` §2.1——KD-SV-132）；
  - `{ "type": "usage", "prompt": N, "completion": N, "cacheHit": N, "cacheMiss": N }`——每次模型调用返回且 `turn.usage` 在场（缺 ⇒ 零帧——**有源才发**）；
    值 = 核 `usage.{prompt_tokens, completion_tokens, prompt_cache_hit_tokens, prompt_cache_miss_tokens}`（`thincoder-core/provider/core.mjs:306-312` 聚合形；核 usage 无 reasoning 计数 ⇒ 状态行 ✦ 段不做）；
  - `{ "type": "ask", "kind": "permission", "promptId": "…", "tool": "…", "args": "…" }` ∥ `{ "type": "ask", "kind": "batch", "promptId": "…", "count": N, "tools": ["…"] }`——审批卡（写类门挡——`args` = 掩蔽截断串 ≤500；机制/应答 = §11.5）；
  - `end` 帧 + `durationMs`（回合耗时）∥ `calls`（工具调用数）——可字段。
- **零落库**：帧面 = 视图面（读时单源 = 消息行不变——刷新后状态行清空重算）；状态行读数项表 = `docs/server/design/webui/CHAT.md` §2.1④（消费面单源）。

### 11.4 会话级思考档位

- **归属与形**（口径③——用户「行」）：档位归**会话**（与 `model` 同层）——库列 `agent_chats.reasoning`（v16 增段；NULL = 未设）；`chatView` 行形携 `reasoning`（建会话回执 ∥ 列表 ∥ 详情 ∥ PATCH 回执四面同源）。
- **值域源 = 核单源**：`thincoder-core/model-specs.mjs` `specForModel(上游真名).reasoningEffortEnum`（前缀匹配 + 命名空间剥离同核）——服务端桥件 `thincoder-server/src/gateway/reasoning-levels.mjs`（已落盘——懒载 `@thincoder/core/model-specs.mjs` + 缓存；`levelsOf` ∥ `modelReasoningMap` 稀疏图）；
  - **标识解析径**：会话 `model` = **对外标识**（别名 ∥ `provider/model`；KD-SV-59）⇒ 取枚举前**先解上游真名**。
  - **反查件** = `thincoder-server/src/gateway/providers.mjs` 的 `providerAliasIndex(db)`（其形 = `createAliasIndex(listProviderEntries(db))`），`lookup(外标)` ⇒ `{ provider, model: 上游真名 }`——「读面回映射」同源件，保存换表随动。
  - **三处同经此解析**：源面行 ∥ PATCH 校验 ∥ 回合装配——别名模型 = 别名所指上游的枚举，不另退中性。
  - **零第二清单**：档位词表不落库。
  - **模型列表下发** = `GET /api/admin/providers` 每行 `modelReasoning`（键 = 上游真名，与 `settings`/`modelMeta` 同键空间；无档模型零键）。
  - **缺核**（本开发机未装包——`thincoder-server/node_modules` 无 `@thincoder/core`）⇒ 空图 + 一条警告（档位面退中性；生产 = 核为声明依赖）。
- **设置路由**（口径②）：`PATCH /api/admin/agent/chats/:id` 扩为**会话设置面**——体一次一件（`{ model }` ∥ `{ reasoning }`；同携 ⇒ 400 人话）：`model` 在场 ⇒ 换模型 + **档位清 NULL**（换模型回中性——同一写）；`reasoning` 在场 ⇒ `null`（清）∥ 字面 ∈ 当刻模型枚举 ⇒ 落库，否则 400 人话；判权 = `requireAdmin` 沿用；**零审计行**（KD-SV-91 三 kind 不扩——沿 KD-SV-108）。
- **回合装配**：`runChatTurn` 起跑读行（与 `chat.model` 同点——在途回合零触；沿 KD-SV-108 口径）⇒ 行值 ∈ 当刻模型枚举 ⇒ `buildChatExit` 出口 provider 配置携 `reasoningEffort`（核 `thincoder-core/provider/core.mjs` 载荷门/枚举门/路由形守门单源消费）；**未设 ∥ 表外 ⇒ 零字段**（与今日行为逐字同）；表外 = 读侧容忍（不炸、不改行——沿核会话槽「表外串不动」先例）。
- **控制台面**（源下发消费 ∥ 钮面启用 ∥ 无档模型中性）= `docs/server/design/webui/CHAT.md` §2.1③⑤（KD-SV-111）；**不做** = 本档 §10（逐条覆写 ∥ 状态行段）。

### 11.5 审批卡面（写类门挡——KD-SV-224–227；用户 2026-10-17 裁「必须上审批卡」）

- **口径**：管理面写类工具逐调用弹审批卡（机制同成员面——词表/帧形/卡件全单源）；提示词级纪律句（破坏性先动作说明）不动——卡面 = 机制+提示词双层。
- **最近先例**（对齐 ∥ 偏离）：先例 = 成员面审批批（`ask` 帧四类 ⇒ 页卡 ⇒ 应答端点 ⇒ 下行 `answer` ⇒ 盒壳结算——`docs/server/design/agent/MEMBER-AGENT.md` §3.11(2) ∥ KD-SV-217）＋ `thincoder-server/src/agent/ask-vocab.mjs`（词表单源）+ `member-relay.mjs`（帧面/卡件复用品）；对齐 = 机制同形（`ask` 帧 ⇒ 页卡 ⇒ 应答 ⇒ 结算续跑）∥ 词表/卡件/帧面单源导入（零第二份）；**偏离** = 三条（差异表 ①∥②∥③：兜底口径 ∥ 收窄 ∥ 免问轨载体）。
- **公开源档核查**：本批未查外部（公开）源档——「无相关」（机制面单源 = 仓内成员面先例 ＋ 核件，零外部源）；仓内核查面 = `docs/server/design/agent/MEMBER-AGENT.md` §3.11(2) ∥ `member-relay.mjs` ∥ 核 `thincoder-core/agent/dispatch.mjs:177-231`（门挡）。
- **判类（单源，KD-SV-225）**：`tools.readonlyOf(name, args)`（工具面扩缝）：环境族 = 核工具 `readonly` 旗逐字（免 = `get_current_time`/`ls`/`read`/`grep`/`timer`/`read_history`；问 = `bash`/`process`）；
  管理族 = 逐动词只读表（免 = `members.list`/`providers.list`/`models.list`/`usage.summary|rows`/`audit.query`/`runners.list`/`mcp.list`；余问）；
  MCP 件恒写类（核 `readonly:false`——逐件同成员面）∥ `readonlyOf` 缺席（注入口/假件）⇒ 读类（既有消费零变）。
- **ask 回路（形同成员面）**：写类调用 ⇒ `ask` 帧（`permission`：`{ promptId, tool, args }`——args = 掩蔽截断串 ≤500，掩蔽链同 `call` 帧）⇒ 页卡 ⇒ 应答端点 ⇒ 结算续跑；同回合 >1 写类 ⇒ 一卡 `batch`（`{ promptId, count, tools }`）；裁决词表 = `once`/`always`/`reject` ∥ `approveAll`/`deny`/`oneByOne`（两表自 `ask-vocab.mjs` 导入；`member-relay` 仅重导出——零第二份）。
- **应答端点（七端点）**：`POST /api/admin/agent/chats/:id/asks/:promptId`（体按 kind——`askAnswerBodyOf` 同源校验）⇒ 命中在途 ⇒ 200 `{ ok: true }`；未知 ∥ 已了结 ∥ 体不合 ⇒ 400 人话（零副作用）；契约 = `docs/server/design/gateway/API.md` §2.8。
- **结算**：`once` ⇒ 放行执行；`reject` ⇒ 拒（不执行——工具行 `{ ok:false, message:"用户拒绝——未执行" }` ＋ `call`/`result` 帧 ＋ `chat_call` 行 resultCode −1；回合续跑）；`always` ⇒ 置行 `auto_approve`（KD-SV-226）＋ 当回合即时免问。
- **兜底三径（KD-SV-227）**：回合收尾（`finally` 关宿主）∥ 中止（`requestChatAbort` 同拍结算）∥ 流断（`res` close ⇒ 结算）⇒ 未决卡全量拒值；无问面（唤醒轮——无流）⇒ 写类即时拒。
- **起跑窗流断（宿主未登记）**：装配段内有 MCP 建连 / 压缩等 await ⇒ `res` close 可先于宿主登记；按**流 token**（本请求 `emit`）落 `closedStreams`（`Map<chatId, token>`——每会话至多一枚，异流残留不生效），建宿主时按 token 对位消费并删：同流 ⇒ `streamAlive = false`（生为无问面）。
- **起跑窗守卫与清理**：无问面下弹卡口（`askPermission` / `askBatch`）与逐件径同拍零卡即时拒；正常收尾不登记（`res.writableEnded` 判）；清理 = 同会话下次建宿主（消费即删）。坐标 = `thincoder-server/src/agent/chat-asks.mjs:38` · `:65` · `:82`–`:85` · `:115` / `:125` · `:150` · `:226`。
- **免问轨**：行 `auto_approve` = 1（回合起跑读行；`always` 当回合即时置真）⇒ 写类不过门直执行；PATCH 键为唯一人工清径（下回合生效）。
- **收窄条（两 kind 不接——理由）**：`question` = 管理面无 ask 源（工具面无 `question` 件）⇒ 无卡可弹；`secret` = 凭据口径 = 结构弹窗（KD-SV-136「文本非通道」）⇒ 聊天面永不承载秘密；应答词表仍四 kind 全集（校验单源不缩——收窄只在弹出侧）。
- **结构件**：判类扩缝（`chat-tools.mjs` ∥ `chat-env-tools.mjs` ∥ `mcp/face.mjs` ∥ `mcp/admin-tools.mjs` 各 + `readonlyOf`）∥ 新档 `chat-asks.mjs`（宿主 ∥ 帧构造 ∥ 结算 ∥ 置库）∥ `run.mjs` `TRIMMED_FACES` 删 `"approval"` ∥ `chat.mjs` 触面 = 开宿主/关宿主 + `preflight`/`admit` 两调用（Δ ≤15——超出先拆，KD-SV-228）。
- **与成员面差异表（逐条实证——宿主差异保留；无实证即改）**：
  - ① 无盒壳：管理面 = 进程内直执行（成员面 = 盒协议转发——在途表 = relay 内存，`docs/server/design/agent/MEMBER-AGENT.md` §3.11(2)）⇒ 兜底口径不同：流断 ⇒ 立即拒值（成员面 = 挂起待重挂——即**流断重挂面**；管理面零**流断重挂面**；页内**卡面重挂**（remount）两面对有——见 ⑥；KD-SV-227）。
  - ② 收窄：唯二 kind（`permission`/`batch`；成员面四 kind——question/secret 无源）。
  - ③ 免问轨载体：会话行 `auto_approve`（成员面 = 盒会话槽——`docs/server/design/agent/MEMBER-AGENT.md` §3.11(2)）。
  - ④ 卡件/词表单源：全导入（本面零第二份）。
  - ⑤ 在决读数段：不做（成员面有——状态行段）。
  - ⑥ 壳面挂法：卡挂消息流尾（成员面 = 卡挂 `#messages`（`.chat-thread`）尾——`docs/server/design/agent/MEMBER-AGENT.md` §3.11(2)「页面去留」；各自宿主，形态同源）。
- **不做（本面边界）**：question/secret 卡（无源）∥ `#auto-btn` 钮位面（模式位读出/写/推送三段另批）∥ 在决 ask 状态行段（零增）∥ 卡面 diff 预览（工具面无文件编辑族）。

## 12. 工具面扩展（管理面九件）

**口径**（KD-SV-90）：逐面回指控制台功能点 ∥ 进程内直取域件（零 HTTP 回环——KD-SV-82 延续）∥ 写链与路由同函数（单源）∥ 每次动作落审计行（读动作同落）∥ 无白名单围栏（KD-SV-82 口径不破）。

| 工具 | 形（动词） | 实现面（域件） | 回指（控制台面） |
|---|---|---|---|
| `members(op, …)` | `list` ∥ `create` ⟮username/name/role⟯ ∥ `reset_password` ⟮member⟯ ∥ `revoke_key` ⟮member/keyId⟯ ∥ `set_quota` ⟮member/quotas 键级合并⟯ ∥ `set_disables` ⟮member/disables 键级合并⟯ | `accounts/members.mjs`（`createMember` ∥ `setMemberPassword` ∥ `mergeMemberModelQuotas` ∥ `mergeMemberModelDisables`）∥ `accounts/keys.mjs`（`revokeKey`）∥ 重置链 = 改密 + 清计（`guard.clearUsername`——装配面注入 ∥ 与路由同效：共享助手边界 = **改密 + 清计**两件；审计写不随迁——`recordAudit` 各留调用侧既有面（路由侧 = `password_reset`（`docs/server/design/accounts/ACCOUNTS.md` §2.1）∥ chat 侧 = 只 `chat_call` 行——KD-SV-91）） | 成员页/弹窗（功能点 15④ ∥ 23②）；端点 = `docs/server/design/gateway/API.md` §3 |
| `providers(op, …)` | `list` ∥ `add` ⟮全字段⟯ ∥ `update` ⟮字段级（`settings` 键级合并）⟯ ∥ `remove` ⟮id⟯ ∥ `discover` ⟮baseURL/apiKey/providerId/proxy⟯ | `thincoder-server/src/gateway/provider-admin.mjs`（校验单源 `validateProviderEntry` ∥ 候选注册表 ∥ `runtime` 换表）——路由内联写链提取共享写函数（两调用点单源）；发现 = 同探针件 | Provider 页（功能点 18/AC-11；端点 = §2.2） |
| `models(op, …)` | `list` ∥ `enable` ⟮provider/model——加开放⟯ ∥ `disable` ⟮减项（退役可停）⟯ ∥ `settings` ⟮rpm/tpm/costIn/costOut/note/quotaTokens 键级合并⟯ ∥ `alias` ⟮设置/清除（含唯一性校验）⟯ ∥ **`test` ⟮provider/model/prompt?/timeoutS?——真实调用 ＋ 五读数（机制 = §12.1）⟯** | 同上写链 + `settings` 合并件（`mergeProviderSettings`） ∥ `agent/model-test.mjs`（已落盘——模型测试执行器） | 服务模型页（功能点 17/29——A/C/D/E/F/G 面）；`test` 无控制台对位面（会话面专属——§12.1⑤） |
| `usage(op, …)` | `summary` ⟮member/model/endpoint/from/to⟯ ∥ `rows` ⟮同上 + limit ≤100⟯ | `thincoder-server/src/metering/report.mjs`（`usageSummary`）∥ `metering/usage.mjs`（`queryUsage`——与端点同过滤构建器） | 管理·用量页（功能点 15②；端点 = §3） |
| `audit(op, …)` | `query` ⟮type/member/from/to/limit⟯ | `accounts/audit.mjs`（`queryAudit`——与审计页同过滤件） | 审计页（功能点 15④——`docs/server/design/accounts/ACCOUNTS.md` §2.1） |
| `runners(op, …)` | `list` ∥ `add` ⟮name/address——连通自检 + 落行⟯ ∥ `remove` ⟮id/containers（keep∥remove）/confirm⟯ ∥ `revoke_credential` ⟮id——主机表凭据零化 + 审计 `host_credential_revoke`；**凭据类例外**：域行 + `chat_call` 两行（KD-SV-91）⟯（`list` 行携 `ssh` 元数据——主机表；`docs/server/design/sandbox/SANDBOX.md` §3） | `sandbox/registry.mjs`（`insertRunner` ∥ 读行）+ 删除链（容器处置 ∥ 承载确认 ∥ 工作区解绑 + 续放置——与控制台同函数同效） | 沙盒页·运行面（`docs/server/design/webui/SANDBOX.md` §2.1①——最小切片；端点 = §2.5） |
| `docker(host, op, args?)` | 同任务面十动词（version ∥ info ∥ ps ∥ images ∥ pull ∥ create ∥ start ∥ stop ∥ rm ∥ logs）——**绑定 = 注册节点**（名 ∥ 地址经 `sandbox_runners` 查行；未在册 ⇒ 工具级错误回灌） | `sandbox/docker.mjs`（`createDockerClient`——与控制台容器面同一客户端）+ `thincoder-server/src/agent/docker-ops.mjs`（已落盘——admin-agent-chat 批；十动词执行器——两驱动单源） | 沙盒页·容器区（`docs/server/design/webui/SANDBOX.md` §2.1①） |
| `exec(host, command, timeoutS?)` | **绑定 = 主机表行**（名 ∥ 地址——`registry.runnerByRef` 单源，与 `docker` 同判；未在册 ⇒ 工具级错误）；凭据 = 行密列（缺 ⇒ 工具级错误人话——指向主机凭据弹窗）；`timeoutS` = 正数秒数（缺省 = `SSH_COMMAND_TIMEOUT_S`——`thincoder-server/src/sandbox/ssh.mjs` 单源常量，60 s）；上界 **86 400**（24 小时；父侧裁）——越界 ⇒ 工具级错误人话「超时上限 24 小时」（回合不停 ∥ 零 ssh 调用 ∥ 库零变）；非正/非数 ⇒ 工具级错误（E61）。上界依据 = 86 400 000 ms ≪ Node 计时器量程 2 147 483 647 ms（逾量程被归 1 ms——即刻假超时）；单命令 24 h 以上超出本工具用途；结果 = `{ ok, exitCode, stdout, stderr, summary, subject }`（命令非零退出 ⇒ `ok:true`——退出码在结果内；传输级失败 ⇒ `ok:false` + 人话） | `sandbox/hosts.mjs`（已落——`execOnHost`——解密 + `thincoder-server/src/sandbox/ssh.mjs` 传输 + 临时私钥用毕即删）+ `thincoder-server/src/agent/tools.mjs` `maskSecrets`（行凭据值入掩蔽面——同任务面口径） | 沙盒页·运行面（凭据弹窗录入——`docs/server/design/gateway/API.md` §2.5 两端点）；对话页（同一弹窗件挂载） |
| `mcp(op, …)` | `list` ∥ `add` ⟮name, transport, command?/args? ∥ url? ∥ wsUrl?, headers?, token?, env?, enabled?⟯ ∥ `update` ⟮id ＋ 字段级（`name` = 改名；字段缺席 = 不变 ∥ 显式 `null` = 清 ∥ 敏感键空串 = 不变——`store.mjs` 单源）⟯ ∥ `remove` ⟮id ∥ name⟯ ∥ `probe` ⟮id ∥ name——库内行；零副作用⟯ | `thincoder-server/src/mcp/admin-tools.mjs`（已落盘——执行器，实读 **222**）＋ 复用 `mcp/store.mjs`（CRUD ∥ 探活体解析 ∥ 视图）∥ `mcp/face.mjs`（关闭 ∥ 核装载 ∥ 冷却）——**零第二实现**（机制 = §12.2） | MCP 页（`docs/server/design/webui/MCP.md`——功能点 54/AC-54；端点 = `docs/server/design/gateway/API.md` §2.13） |

- **不入 chat 面**：任务面装机三件（`register`/`verify`/`report`）已随任务式退场删净；**装机（新主机）= chat 内动作**（`runners.add` 登记 + `exec` 装运行时/开监听——主机表凭据经弹窗录入；KD-SV-135）；chat 侧可读机队（`runners.list` ∥ `docker` 读数）。
- **随控制台同批长**（不发明）：节点排空/禁用 ∥ 沙盒工作区/设置各面工具（随沙盒余面批；出站规则/待批两件随退场删）。
- 工具结果形 = `{ ok, … }`（结构化；错误 ⇒ `ok:false` + 人话 message——回灌模型自纠，回合不停）。

### 12.1 模型测试（`models.test`——功能点 55 ∥ AC-55）

> 口径 = 用户「管理面会话缺一个模型测试工具，有时候需要知道模型服务的状态和性能。」＋ 两句厘定「走网关链，记账」「首字节延迟和吞吐也需要」。
> 一句话 = 对**已配渠道点名**做一次**真实调用**（经本进程网关链 loopback）并归一**五读数**——工具形 ∥ 计量 ∥ 读数 ∥ 审计 ∥ 边界五面见下。

**最近先例**（对齐 ∥ 偏离）：先例 = ① 同面动词扩展（`exec`——§12 表：值域形 ＋ 工具级错误分流）∥ ② 控制台三件诊断（向量服务探活/试跑 ∥ 代理连通测试 ∥ MCP 探活——皆自含状态、不落库不计量；需求档 §5 现状句）∥ ③ loopback 出口（§16.2——本进程网关链客户端）；对齐 = 单动词入列（名集八件不变）∥ 读数自含不落库；**偏离** = 本工具经网关链**记账并计配额/限流**（诊断三件 = 零计费）——依据 = 用户 00:50 裁「走网关链，记账」＋账只能对在网关链（全文 = §9 KD-SV-205）。

**① 工具形**（KD-SV-205——面内动词；工具名集八件不变）：
- 入参 = `models` ⟮op: `test`, provider（名 ∥ id）, model（上游名 ∥ 别名）, prompt?, timeoutS?⟯——对象 = **已配渠道点名**（解析 = `resolveProvider` ＋ `locateModel` 同源）。
- **未在开放清单 ⇒ 工具级错误**（零外呼）——草稿值不走本工具（试连草稿 = Provider 页「测试连接」面（AC-18））；message 带划界句。
- `prompt?` = 探针输入（缺省 = 内置探针句 `ping`——常量 `MODEL_TEST_PROBE_TEXT`，沿向量探针 `EMBEDDING_PROBE_TEXT` 同字面；帽 2000 字——逾 ⇒ 工具级错误人话）。
- `timeoutS?` = 探针预算（正数秒——非正/非数/越界〔>600〕 ⇒ 工具级错误人话；缺省 **60** ∥ 上界 **600**——**值域形**沿 `exec` 同面先例〔该先例上界 86 400 依据 = Node 计时器量程——与本值无涉〕；界值依据 = 单请求探针 10 分钟窗口——先于回合预算 20 min 收尾，超时读数可得）。
- 返回 = 结构化读数（§③）；**读数产出恒 `ok:true`**（服务坏 ≠ 工具失败——沿 `exec` 非零退出判例）；结果携 `subject`（= 对外标识——审计消费）＋ `summary`（人话一行）。判权 = 管理面 chat 全族（零新判权）。
- 落档两处：`thincoder-server/src/agent/model-test.mjs`（已落盘——执行器）∥ `thincoder-server/src/agent/chat-tools.mjs`（薄接线：动词分派 ＋ schema 描述）。

**② 计量落点（走链自动——零第二份）**：
- 通路 = 单次 `POST <selfBase>/v1/chat/completions`（`stream: true`）；出口装配**同源** = `chatProviderOf`（§16.2/§16.3——sk = 本回合发送者的 `admin-agent` 明文；谁用谁）。
- **两装配件关系**（§16.2 单源）：`chatProviderOf` = 出口 provider 描述子取件（出 `{ provider, upstream }`；两消费面 = 模型出口 ∥ 压缩垫片）——**本动词复用层**；`buildChatExit` = 出口装配（描述子 ＋ 核 `chat` 调用件；§16.2「装配」行所指）。本动词取描述子后**自持单请求**——不经核 `chat`（沿 §9 KD-SV-205 被否栏）。
- 经网关链全链（鉴权 ∥ 派发 ∥ 准入三件 ∥ 转发 ∥ 记账——逐字复用）⇒ **usage 行自动落**（member = 发送者 ∥ key = `admin-agent` ∥ endpoint = `chat`）；`stream_options.include_usage` 链侧注入（KD-SV-5）⇒ 上游 usage 原值可达。
- **TTFB/吞吐不落库**（读数 = 会话面结果——usage 表零列增 ∥ 零迁移）；测试**照常计配额/限流**（准入三件不豁免——被拒也是读数）。
- 中止 = 回合中止信号透传（`invoke` 第三参 `ctx` 通到管理族——本动词消费 `ctx.signal`；`AbortSignal.any([超时, signal])`）——中止即断开探针（沿 KD-SV-107 口径）。
- 与 KD-SV-82「进程内直取域件、零 HTTP 回环」不冲突——沿 §16.2 同判（**模型调用 = 对外契约面** ⇒ 走网关链；域件读仍进程内直取）。

**③ 读数归一（五件——逐条定义）**：
- `status`（**闭集五支**）：`ok`（2xx ＋ 流正常终结——零内容增量亦归〔空答 ⇒ `ttfbMs:null`〕）∥ `timeout`（预算耗尽——携 `phase`：`before_first_byte` ∥ `generating`）∥ `http_error`（响应非 2xx——携 `httpStatus` ＋ 原文）∥ `bad_response`（2xx 但不可用：非 SSE 形 ∥ 解析不出事件）∥ `broken_stream`（传输中断——首内容增量后携部分读数 ∥ 首内容增量前中断亦归〔零部分读数〕）。
- `error` = **原文摘录**（原样不重写；帽 500 字——逾限截断加注；有界读 8 KiB）。网关自产错误与上游透传错误**不可区分**（转发面原样透传 = 设计事实——如实一类 `http_error`，原文即据）。
- `totalMs` = 请求发出 ⇒ 流终结／失败时刻；`ttfbMs` = 请求发出 ⇒ **首个非空内容增量**（流首空壳块不计；零内容 ⇒ null）；`tps` = `usage.completion_tokens` ÷ 生成窗（首个内容增量 ⇒ 流终结；usage 缺 ⇒ null——**不估**）。
- 附 = `tokens`（上游 usage 三值原值）∥ `outputChars`（产出字符数）∥ `httpStatus`／`phase`（各按支）。读数含网关链全链耗时（loopback 一跳 ＋ 网关处理——端到端如实，不拆分归因）。
- **键在场形**（逐支——不适用 ⇒ 缺席〔键不落〕；有源缺值 ⇒ null）：恒在 = `ok`／`status`／`model`／`totalMs`／`outputChars`（零产出 = 0）；`ttfbMs`——无首内容增量 ⇒ null（含空答）；`tps`／`tokens`——usage 缺 ⇒ null（不估）；条件键 = `httpStatus` 仅 `http_error` ∥ `phase` 仅 `timeout` ∥ `error` 仅 `http_error`／`bad_response`（原文摘录）；余支缺席。
- **确定性**（机检）：`totalMs`／`ttfbMs`／`tps` 分母窗以**注入钟**读时（`now()` 注入口——沿 §14.1 取值源①）；假 fetch 按注入时刻吐 SSE 帧 ⇒ 用例**逐值相等**断言（零容差窗）。

**④ 审计** = 既有 `chat_call`（逐调用一行——tool = `models` ∥ `subject` = 对外标识 ∥ `call` = 入参串；成败沿既有口径）：**零新 kind/型**（KD-SV-91 三 kind 不扩 ∥ 审计型面十七型不扩）；读数为结果面（tool 行 ＋ `result` 帧），审计零新字段；测试非纯读（耗真 token）但沿「读动作同落行」口径——零双记、零域行。

**⑤ 边界（不做）**：草稿值试连（= AC-18 面）∥ 控制台页/钮（无 UI 对位面——会话面专属）∥ 成员面（不入成员面工具面）∥ 批量/全量巡检 ∥ 新端点/新契约（复用 `/v1/chat/completions`）。
机检口径 = §7 行；用例 = §8（N84 ∥ B80 ∥ E62）；单元测试档（批内定向单测——收口随批删；不入任何门）。

### 12.2 MCP 管理（`mcp` 第九件——功能点 56 ∥ AC-56）

> 口径 = 用户「另外，mcp配置工具也开始落地。」（承「MCP服务有了，但是配置没有开放工具给管理面会话，这个不太好」＋ 管理会话错报「系统不支持 MCP」）。
> 一句话 = 把 MCP 服务器清单的**列/增/改/删/探活**开成管理面第九件工具（`mcp`）——**复用 `mcp/` 域件**（零第二实现），凭据只写零回显，管理动作可归因。

**最近先例**（对齐 ∥ 偏离）：

- **先例** = ① 域件复用面（`docker`——`sandbox/docker.mjs` 客户端 ＋ `docker-ops.mjs` 执行器：注册在管理族、执行器独立成档）∥ ② 模型测试（§12.1——新执行器 ＋ 审计 `chat_call`）。
- **对齐** = 工具形（管理族 `{ ok, … }` JSON ∥ 动词入列 ∥ 工具级错误分流）∥ 执行器独立成档（`model-test.mjs`/`docker-ops.mjs` 同法）。
- **偏离** = ① 本工具是**新工具**（八件 ⇒ 九件；§12.1 为面内动词 +1）——依据 = 无 MCP 语义归属的既有件，AC-56①「与 provider/member 管理族同形」= 同形非同件。② 写动作**两行审计**（`mcp_event` ＋ `chat_call`——KD-SV-207①）——依据 = 凭据承载配置跨径不得缺。

**① 工具形**（KD-SV-206）：新工具 `mcp`（工具名集八件 ⇒ **九件**）：

- 动词五 = `list` ∥ `add` ∥ `update` ∥ `remove` ∥ `probe`（命名沿 providers 族；`probe` = 与端点 `POST /probe` ∥ 核 `probeMcpServer` 同词单源）。
- 寻址：`update` = `id`（`name` 键 = 改名——providers.update 同形）；`remove`/`probe` = `id` ∥ `name` 两形（名唯一；未命中 ⇒ 工具级错误人话「先 mcp.list 查在册」——docker/exec 按名寻址先例）。
  **按名解析步（单一落法）** = 经 `listMcpServers(db)` 视图按 `name` 取 `id`（视图行携 `id`/`name`——`thincoder-server/src/mcp/store.mjs:146-163`）⇒ 之后全走既有导出（`updateMcpServer`/`removeMcpServer`/`resolveProbeConfig`——id 形）——零自造 SQL ∥ `store.mjs` ±0 声明不破。
- 参数校验转 `store.mjs` 单源（形错/重名 ⇒ store 人话 ⇒ 工具级错误、库零变）；工具零再校验（不复制第二份）。
- 未配 ⇒ 空清单（非错误）；`probe` 对象 = 库内行（草稿试连 = 控制台新建窗面——⑥）。
- 落档 = `thincoder-server/src/mcp/admin-tools.mjs`（已落盘——实读 **222**）＋ 并面点 = `chat.mjs` `buildChatToolFace`（第四面：`mergeToolFaces(chatTools, [envTools, mcpFace, mcpAdmin])`；面名 `mcp` 入 MCP 用面重名防御基线 `reservedNames`）。

**② 零第二实现（引件表——AC-56②）**：

| 引件 | 取用导出 | 消费面 |
|---|---|---|
| `thincoder-server/src/mcp/store.mjs` | `listMcpServers` ∥ `insertMcpServer` ∥ `updateMcpServer` ∥ `removeMcpServer` ∥ `resolveProbeConfig` ∥ `mcpServerView`（视图经 list） | 五动词全部写读链（形校验 ∥ 编辑口径 ∥ 密文列 ∥ 探活体解析） |
| `thincoder-server/src/mcp/face.mjs` | `closeMcpServer` ∥ `loadCoreMcp` ∥ `clearMcpCooldown` | 删/停用 ⇒ 关会话（同 routes 生命周期）∥ 探活核装载 ∥ 成 ⇒ 清冷却 |

- **零自造**：SQL ∥ 加密 ∥ 探活协议 ∥ 工具命名（MCP 用面）——全在既有件；假件用例（U2–U5）证明复用（`store`/`face` 假件替身下行为逐值）。
- **注入缝（替身——键面与 routes/face 同源）**：复用 `deps.mcpProbeImpl`（探活——`thincoder-server/src/mcp/routes.mjs:104` 同键）∥ `deps.mcpRemoveImpl`（关会话——`thincoder-server/src/mcp/face.mjs:158` 同键）；`?? null` 缺省 = 真件回落、生产零变——假件用例（U2–U5）依此；如有新增键一律 `?? null` 缺省（同判）。
- **同形重复（不可共享——如实登记）**：`routes.mjs` 两处内联形体不抽共享件——① 探活调用 ＋ 读数归一（`104-134`）；② `mcp_event` detail 三写入点（`43-49` ∥ `64-70` ∥ `84-90`）。新档按**同形自建**（detail 键集逐值同构——KD-SV-207①）；复用声明与源扫腿限定**引件面**（`store.mjs`/`face.mjs` 导出——`routes.mjs` 零改声明不破）。
- 判权 = 管理面 chat 全族（会话本身即 admin 面——零新判权；沿 §12 口径）。

**③ 凭据纪律（AC-56③——只写零回显）**：

- 入参：`token` ∥ `headers` ∥ `env` 可入（**只写**——对齐 providers `apiKey` 先例；`${env:VAR}` 引用透传，核建连期解析）；schema 描述明写「凭据只入库、永不回显；优先 `${env:VAR}`」。
- 结果面：零秘密（视图 = `mcpServerView`——`hasSecrets` 布尔为唯一信号；`update` 只出 `keys`（顶层键名——值永不入））。
- 审计面：`mcp_event` detail 同 routes 形（零值）；`chat_call` 面 = 既有链（`call` 摘要经 `maskArgs`＋`maskSecrets`——`token` 具名敏感键 ⇒ `***`）。
- 日志面：新档零携值日志点（如记：只名/形）；既有点（`mcp_connect_failed` 等）只携 name/message。
- **掩蔽面边界（如实披露——键名面口径）**：掩蔽 = 键名表 `SENSITIVE_KEYS`（`thincoder-server/src/agent/chat.mjs:230`——键名大小写无关）；`token` 等列名键值 ⇒ `args` 落库/帧面 `call` 同链 `***`；
  `headers`/`env` 袋内**非列名键**值（如 `X-Api-Key`/`ZHIPU_API_KEY`）⇒ 随 `args` 落库/帧面 `call` 摘要可见 = **残余暴露**（零改掩蔽链；实证 = `thincoder-server/` 全树零 `SECRET_FORM`）——R88③。

**④ 错报治理（AC-56④——能力叙述认 MCP）**：

- `CHAT_LIMITS_BLOCK`（`chat-env.mjs`）管理族行 += `mcp（MCP 服务器清单：list ∥ add ∥ update ∥ remove ∥ probe；已配服务器的工具随回合并入——可直接调用）`——对位断言 = 注册工具名 `mcp` ∈ 能力段字面。
- 工具 schema 描述（说明书第二面）：两义同叙（可管清单 ∥ 已配服务器工具可用）；含凭据指引句。

**⑤ 审计（AC-56⑤——KD-SV-207①）**：

- 写动作（`add`/`update`/`remove`）⇒ `mcp_event` 三 kind 照落（detail 逐值同 routes 形——`{ kind, id, name, transport }` ∥ `{ kind, id, name, keys }` ∥ `{ kind, id, name }`；actor/actorId = 会话 actor）＋ 驱动层逐调用 `chat_call` 行（**两行**）。
- `list`/`probe` ⇒ 仅 `chat_call`（探活零落库零审计——沿 `docs/server/design/mcp/MCP.md` §3.3）。
- `chat_call.subject` = **null**（本件五动词结果零携 `subject`——管理族既有口径：结果携 ⇒ 用之、零携 ⇒ null，`thincoder-server/src/agent/chat.mjs:674-678`；动作靶名 = `mcp_event` detail ∥ `call` 入参内可读）。
- 零新 kind/型（审计型十七型不扩 ∥ `agent_event` 三 kind 不扩）。

**⑥ 边界**：草稿试连（= 控制台新建窗面）∥ 逐服务器工具开关/白名单（沿 `docs/server/design/mcp/MCP.md` §7）∥ 成员面 MCP（沿 `docs/server/design/mcp/MCP.md` §6）∥ 改名 = 仅 `update` 的 `id` 径（按名寻址时不可改名——防寻址/改名同键歧义）∥ 零新端点 ∥ 零迁移。
机检口径 = §7 行；用例 = §8（N85 ∥ B81 ∥ E63）；单元测试档（批内定向单测——收口随批删；不入任何门；腿 = U1–U9）。

## 13. 上抛/余项（本域）

> 服务端设计档 `docs/server/design/PROJECT.md` §9 同类行 = 保位 stub（指向本节）。

| # | 项 | 类型 | 处置建议 |
|---|---|---|---|
| R54 | **需求档回笔 + 随正件 + 披露**：① 需求档回笔（主 agent 笔——§5「两个 chat 界面」②④ 的落点与 AC）：§2 增**功能点 37（管理面 chat——草案：会话/回合模型 ∥ 流式通路 ∥ 工具面（草案七件——**落定八件**：`exec` 入列，`docs/server/design/agent/ADMIN-AGENT.md` §9 KD-SV-136） ∥ 审计型 ∥ 不做单）** + **AC-37 行**（判据 = §7 行——机制/端点/控制台/存储/审计五面指针）+ 标题计数随正 + 变更记录 ∥ AC-28 审计型数随正（十二 ⇒ **十三型**——`agent_event`）∥ AC-12/AC-14 管理项数 8 ⇒ **9** + 静态档目 31∥32 ⇒ **32∥33**（余面批 ⇒ 34∥35）∥ §5 成员面 chat 归属句随正（用户裁）∥ ② 随正件（父侧落——实施轮同拍）：`views-audit` 型面数断言件 ∥ nav 计数件（管理 8 ⇒ **9**）∥ 档目断言件（`views-chat.mjs` 入列表——31∥32 ⇒ **32∥33**）∥ 门禁件数断言件（42 ⇒ **45**——三件入链；以实施当刻盘面实读为准）+ `thincoder-server/package.json`（同基数；逐件登记 = §6 注⑲）∥ ③ 披露（不阻塞）：chat 不收 SSH 凭据（装机 = 任务式弹窗——KD-SV-84 不破）**〔装机/主机运维 = 管理面 chat 内动作（`exec`/`docker`/`runners` + 主机表凭据）；承接 = `docs/server/design/sandbox/SANDBOX.md` §16 R87〕**∥ 会话无删除/重命名/清理（不设清零）∥ 回合无中途中止钮（预算封顶）∥ 破坏性动作「先说明后执行」= 提示词级纪律（机制级确认门未做）∥ 节点排空/禁用工具 = 随控制台同批长（不发明）∥ 跨会话并发未设限 ∥ ④ 部署收尾（父侧执行）：镜像重建 + 重收敛 + 浏览器实走（建会话 ⇒ 发一条 ⇒ 帧流 ⇒ 工具调用行 ⇒ 刷新重读） | 披露 | 评审/用户复核 |
| R60 | **需求档回笔 + 随正件 + 披露 + 部署**：① 需求档回笔（主 agent 笔）——**已闭合**（功能点 41 ∥ AC-41 入册——`docs/server/requirements/PROJECT.md` :225/:230） ∥ ② 随正件（父侧/实施轮——以当刻盘面实读为准）：`2026-10-11-admin-agent-chat-ui.test.mjs` 静态面用例上量（档目链单源 = `docs/server/design/webui/WEBUI.md` §1；**397** 行；净变预算 ≤±50）+ 类名闭合用例 ∥ `2026-10-11-console-chat-align.test.mjs` 两用例收正——取件面白名单用例（新取件增列 `thincoder-render-core/flow/block.mjs` ∥ `thincoder-render-core/composer/panel.mjs`）∥ 「零 composer/reasoning 引用」口径（**395** 行；净变预算 ≤±20）∥ `style.css`（五钮隐藏 + 别名块——`docs/server/design/webui/STYLE.md`）∥ `views-chat.mjs` 拆档（新档入链）∥ 门禁件数断言（单元测试档）∥ `i18n-{zh,en}-admin` 行账（`docs/server/design/webui/ADMIN.md` §3）∥ ③ 披露（不阻塞）：**R54 ③ 两项交付失效**（回合中止钮 ⇒ 已交付 = KD-SV-107 ∥ 会话内换模型 ⇒ 已交付 = KD-SV-108）∥ 图片随行存 dataURL（≤15MB/图 ∥ 30MB/回合——核阀单源；详情仅 `imageCount`）∥ 无源钮隐藏五枚（模式位/设置——无源实证；推理钮 ⇒ 已交付 = KD-SV-111）∥ `interrupt` 折法（中止 + 入队首——无注入通道）∥ 换模型零审计行（三 kind 不扩）∥ ④ 部署收尾（父侧）：镜像重建 + ECS 浏览器实走（四轴走查清单以当刻盘面为准） | 披露 | 评审/用户复核 |
| R61 | **披露 + 随正件 + 部署**：① 随正件（父侧/实施轮——以当刻盘面实读为准）：结构版本断言 **11 件**（设计轮枚举——**实盘收正 20 件**：+ `-console-modals` ∥ `-embedding-decouple` ∥ `-console-list-style` ∥ `-server-auto-update` ∥ `-console-layout` ∥ `-me-usage-charts` ∥ `-model-alias` ∥ `-runner-admin-console` ∥ `-runner-admin-console-agent` 九件——逐行坐标以当刻盘面实读为准；各一行 `SCHEMA_VERSION === 15` ⇒ `16`——数字就地收正 ⇒ 逐件行数 ±0；逐件现读：`…-server-gateway.test.mjs`（**495 行**——`:167`） ∥ `…-console-completeness-2`（**504 行**——`:152`） ∥ `…-me-keys-redo`（**370 行**——`:120`） ∥ `…-provider-model-metadata`（**494 行**——`:151`） ∥ `…-quota-per-model`（**447 行**——`:150`） ∥ `…-quota-v2-member-models`（**740 行**——`:167`） ∥ `…-server-console-config`（**795 行**——`:383`） ∥ `…-server-gemini-openai-preset`（**735 行**——`:263`） ∥ `…-team-login-client-access`（**305 行**——`:284`） ∥ `…-admin-agent-chat`（**716 行**——`:638`） ∥ `…-sandbox-image-sources`（**685 行**——`:599`））∥ `…-chat-shell-align.test.mjs:791`（隐藏用例六 id ⇒ 五 id）+ `:807`（零悬停扫描名单）∥ `…-admin-agent-chat.test.mjs:640`（`agent_chats` 列面五列 ⇒ 六列——`ORDER BY cid` 尾插）∥ 门禁件数（**56 ⇒ 57**——单元测试档入链）∥ ② 披露（不阻塞）：**开发机无 `@thincoder/core`** ⇒ 档位面退中性（`modelReasoning = {}` + 警告一条；生产镜像内核为声明依赖——若真缺核 ⇒ admin chat 回合本就不可用，同源失败、非引入）∥ **路由形模型名**（含 `/`）：核载荷门静默不发 `reasoning_effort`（VSC/桌面同态）——服务端/控制台不另立过滤（只读消费核单源）∥ 档位面零审计行（三 kind 不扩——沿 KD-SV-108）∥ `views-chat.mjs` 此后 ≈498 ⇒ **实 500**（恰贴 500 软线；硬限 800 未越——拆档预案在案）∥ ③ 部署收尾（父侧）：镜像重建 + 浏览器实走（选档/换模型/切会话三径以当刻盘面为准） | 披露 | 评审/用户复核 |

| R62 | **需求档回笔 + 随正件 + 披露 + 部署收尾**：① 需求档回笔（主 agent 笔——**父侧已受理**：功能点 43③「（在线数）」与 43⑤ `process`「（看服务器进程——只读）」两括注收正（经父侧裁「均按设计倾向」）；+ **43 边界句收正**——「环境行 `cwd:` 字段与 43⑤ 工作目录口径」入册（不做 = git 上下文 ∥ 项目档注入 ∥ 同目录实例〔三项以「cwd 锚定的项目」为前提〕；**cwd 本身在册**——②行 `cwd:` 字段 + ⑤工作目录限幅）——**经父侧 2026-10-12 裁**；落点 = `docs/server/requirements/PROJECT.md:250`）∥ ② 随正件（父侧落——实施轮同拍，以当刻盘面实读为准）：门禁件数断言件七件（**57 ⇒ 58**——单元测试档入链；注释/断言消息同拍）+ `thincoder-server/package.json`（`prepublishOnly` **57 ⇒ 58**——单元测试档入链；单行清单行数零变）；i18n 键集断言（system 两表 **+3 键/表**——等量 ⇒ 「键集相等」断言不破；如有计数断言 ⇒ 随正；以实施当刻盘面为准）；档目断言件 **±0**（零新档）；审计型面断言 **±0**（零新型/零新 kind）；旧断言件核（预计零——`chat-tools` 面零改：环境族 = 新档 `chat-env-tools.mjs`）∥ ③ 披露（不阻塞）：**核可达性结论 = §14.5**（依赖声明 ∥ registry 实核 0.10.4 ∥ 镜像两装径同经 npm 解析——前提 = 装机时 registry 可达，不可达 ⇒ 拒启 fail-loud）∥ **无路径围栏 ∥ 无命令白名单**（任一 admin 成员可经对话页在服务器跑命令/读文件——含密钥与库文件面；需求 43 风险在册）∥ **读文件内容不在掩蔽面内**（掩蔽只盖本轮入参敏感值；配置档内 apiKey 等可被读出——权限模型归用户）∥ `process.kill` 在册（含**杀 server 自身进程 = 操作者自伤面**——与 bash 等价）∥ `timer` 空闲唤醒在册（§15.1——到点空闲自唤醒一轮）∥ `bash` 非零退出不映射 `ok:false`（退出码在输出文本内——不解析）∥ 模型可见输出 ≤4000 字（`CHAT_TOOL_CONTENT_MAX`——读大文件用 offset/limit ∥ grep ∥ bash `filter` 收窄）∥ 核 `tool-docs/*.md` 指向本面不存在工具的指引（write/edit/git/repo_outline 族）落空——不改核文案（提示词单源；要改 = 主 agent 面另裁）∥ `chat.mjs` 越 500 软线续存（拆档预案 = §6）∥ ④ 部署收尾（父侧执行）：镜像重建 + 重收敛 + 浏览器实走（问「现在几点」「你管着几个节点」各一 + 时间工具一次调用 + 审计页看一行 `chat_call`——命令原文/路径可见） | 披露 | 评审/用户复核 |
| R71 | **需求档回笔建议 ＋ 开放点 ＋ 随正件 ＋ 披露 ＋ 部署收尾**：① 需求档回笔（主 agent 笔）——**已闭合**（主 agent 落笔：功能点 46 ∥ AC-46 在册；条目 ③④ 两件另落 = 功能点 43⑤ 扩（`read_history`） ∥ 功能点 46⑤ ∥ AC-46⑥；本档 §16 与上述同拍，三条链在册）∥ ② **开放点四条**（§15.3——身份与审计行 ∥ 消息形与呈现 ∥ 计费与制动 ∥ 防自激；**均附推荐与代价**；② 含控制台呈现面与唤醒开关两项新 UI 面，前置 = `views-chat.mjs` 拆分审查）∥ ③ 随正件（父侧落——实施轮同拍，以当刻盘面实读为准）：门禁件数断言**七件**（七处皆 `assert.equal(batchFiles.length, 58, …)`；`prepublishOnly` **58 ⇒ 59**，注释/断言消息同拍） + `thincoder-server/package.json`（待补单元测试档入链）∥ 旧批单元测试档随正三处（`:265-286`（timer 行「零落库」断言 ⇒ 落库口径）· `:323-325`（`async` 拒断言 ⇒ 回执断言）· `:353-355`/`:375`（同））＋ 修订轮追加：旧批单测档 `:304-318`（用例④ 七件名单/计数/族覆盖 ⇒ 八件·六族）∥旧批 chat 单测档 `:470-486`（⑧ 出口缺位用例——实现键由 provider 名 ⇒ `admin-agent` sk 明文；断言式修）∥ ④ 披露（不阻塞）：**后台任务日志落在核 config 目录**（`<HOME>/.thincoder/tool-results/`——非 server 数据目录，运维面知悉；日志名 = `<时间戳>-bash-<id>.log`）∥ **跨回合在途任务不随后续回合中止而杀**（其控制器链在起跑回合的信号——三端为会话级 Stop，服务面无该物 ⇒ §15.2「无对应物」行）∥ 唤醒回合耗真 token（经网关链计入本回合发送者 × `admin-agent`（缺位 ⇒ 会话 owner）——§16.2/§16.3）∥ 管理会话经本机环回 ⇒ 核规格面以外标为键（同四端客户端既态——§16.2 差异三条）∥ sk 明文落库（`api_keys.key_plain`——服务端即消费方）∥ 轮转连带吊销 sk（下次登录补发）∥ 唤醒回合的提醒行以 `user` 行落库（若不另作呈现面，控制台以用户消息样式显一——内容自带 `[System reminder: …]` 前缀，不误导语义）∥ ⑤ 部署收尾（父侧执行）：镜像重建 + 重收敛 + 实走（设 1 分钟 timer ⇒ 不动页面 ⇒ 到点回来看见提醒行与助手回复；`bash async` 一条长命令 ⇒ 回合结束 ⇒ 回来见摘要行）∥ 管理登录 ⇒ key 列表见 `admin-agent` ∥ 发一轮 ⇒ 用量面见账（归因 = admin-agent）∥ 问一句历史 ⇒ `read_history` 出条目∥ ⑥ **未随正清单**：`docs/server/design/gateway/API.md` §2.1 补内环消费方句（管理面 chat = 本面客户端、loopback——B2 修复轮 #283 占用中，未动）∥ 需求档 `docs/server/requirements/PROJECT.md:641` 坐标全限定（`thincoder-server/src/agent/chat.mjs:367-390`——doc-check 悬空 26 之一）∥ **任务式（run）出口同形缺口——已撤回**（admin-chat-creds-merge 批：run 退场路线在册——用户裁「将来并入 chat」⇒ 不再对 run 改道；`docs/server/design/sandbox/SANDBOX.md` §3 KD-SV-135） | 披露 | 评审/用户复核 |

| R73 | **开放点 ＋ 需求档回笔建议 ＋ 随正件 ＋ 披露**：① **开放点三条**（§17.4——环体取核〔含宿主缝设计草案，供配套核批〕∥ 提示词场景槽 ∥ 会话面；均附路径与触发）∥ ② 需求档回笔建议（主 agent 笔）：§5 已裁口径（`:601`）补落地形句（件级取核 ∥ 环体自持 ∥ 核缝承接——设计 = 本档 §17）——是否入册 = 主 agent 择 ∥ ③ 随正件：`thincoder-server/README.md:13`「零依赖 ⇒ 装机无 install 步」句已失效（实读依赖两包——registry 核 ＋ `file:` 渲染核）——产品文案随正（实施轮 ∥ 发布面轮）∥ ④ 披露：环体自持 = 目标态未闭（配套核批承接）；压缩改写会话历史视图（标记行形——原行原文留存；控制台详情随观） | 披露 | 评审/用户复核 |
| R86 | **agent 域面**：chat 工具面并 MCP 面（文本面路由 ∥ ctx 透传 ∥ 失败冷却）∥ `thincoder-server/src/agent/run.mjs:22` `TRIMMED_FACES` 收正（删 `"mcp"`）∥ 任务面维持不挂载；**全文 = `docs/server/design/mcp/MCP.md` 的「上抛/余项（R86）」节**（该表 R86 行起句逐字：「**server-mcp 批 — 需求档回笔建议 ＋ 随正件 ＋ 披露 ＋ 待裁点 ＋ 部署收尾**」） | 披露 | 评审/用户复核 |

| R87 | **需求档回笔 ＋ 随正件 ＋ 披露 ＋ 部署收尾**：① 需求档回笔（主 agent 笔）——**已入册**：功能点 55 = `docs/server/requirements/PROJECT.md` §2（`:372–379`）∥ AC-55 = 验收表（`:456`）∥ §5 行（`:563–565`）；AC-12/AC-28 链零动（无控制台页 ∥ 零新审计型）∥ ② 随正件（父侧落——实施轮同拍）：**零**（无门禁链；档目/计数件零涉——零新档 ∥ 零新端点 ∥ i18n 零涉）；单元测试档 1 档（批内定向单测——收口随批删、不入任何门）∥ ③ 披露（不阻塞）：测试耗真 token（计入发送者用量 × `admin-agent`——用户 00:50「记账」口径）∥ 读数含网关链全链耗时（loopback 一跳 ＋ 网关处理——如实，不复算分拆）∥ 网关自产错误与上游透传错误不可区分（如实一类 `http_error`——转发面「原样透传」设计事实）∥ `models.test` 无控制台对位面（回指口径例外——会话面专属）∥ SSE 流形假设（OpenAI 兼容——上游非 SSE 2xx ⇒ `bad_response`）∥ ④ 部署收尾（父侧执行）：镜像重建 ＋ 重收敛 ＋ 会话实走（点名一个已配模型 ⇒ `test` ⇒ 四读数在场 ⇒ 用量面见一行） | 披露 | 评审/用户复核 |

| R88 | **需求档回笔建议 ＋ 随正件 ＋ 披露 ＋ 部署收尾**：① 需求档回笔（主 agent 笔）——**已办**：§2 条目块在册（`docs/server/requirements/PROJECT.md:381`——五要素成块；三链同源：本档 §12.2 ∥ §7 行 ∥ §8（N85 ∥ B81 ∥ E63））＋ AC-56 行（`:457`）＋ §5 立案行（`:566`）（回笔 = 需求档变更记录 `:793`）；**余项** = §5 行计数**已随正**（工具面九件）∥ ② 随正件（父侧落——实施轮同拍）：**零门禁链**（`thincoder-server` 无 test 脚本；`prepublishOnly` = 三档 `node --check`——零涉）；旧批批内件名集断言 = 旧快照（八件口径——非门禁面，不追改）∥ ③ 披露（不阻塞）：token 明文经聊天文本来往（用户消息行原文——沿 providers `apiKey` 既态；工具面三面掩蔽在册）∥ `headers`/`env` 袋内非列名键值 = 掩蔽面残余（键名表 `SENSITIVE_KEYS` 单源——§12.2③） ∥ 探活 = 库内行（草稿试连 = 控制台面）∥ 探活不落 `mcp_event`（诊断零审计——routes 同口径）∥ `chat.mjs` 733 越 720 拆档线——微触 ≈+10（评估 = §9 KD-SV-208）∥ ④ 部署收尾（父侧执行）：镜像重建 ＋ 重收敛 ＋ 会话实走（列/探/增一条真实服务器——AC-56 收口腿） | 披露 | 评审/用户复核 |

| R91 | **审批卡面批（2026-10-17）——需求回笔 ＋ 随正件 ＋ 披露 ＋ 部署收尾**：① 需求回笔 = 主 agent 笔（用户裁「必须上审批卡」在册）∥ ② 随正件（实施轮实读为准）：结构版本断言 = **25** ∥ `agent_chats` 列面 = **8 列**（含 `auto_approve`） ∥ 门禁件数 ∥ 静态档目链 + `views-chat-cards.mjs` ∥ ③ 披露：`#auto-btn` 留隐（钮位面出列）∥ 断线/未决卡 ⇒ 拒值（中止可解）∥ 拒行落审计（−1）∥ ④ 部署收尾 = 父侧（镜像 + 实走：写类弹卡 ⇒ 批 ⇒ 执行 ∥ always ∥ 拒） | 披露 | 评审/用户复核 |

| R92 | **压缩阈值取核批（2026-10-18）——披露：依赖地板须含 A3 算式**：① 事实（实读）：`thincoder-server/package.json:17` 声明 `@thincoder/core ^0.10.7`；v0.10.7 ∥ v0.10.8 的 `resolveCompactThreshold`（`config.mjs`）算式 = `floor(usable × 0.6)`，仓内现行 = `min(usable, ⌊window × 0.8⌋)`（`config.mjs:181` `requestBudget`——2026-10-18 提交，未入任何 tag）⇒ 导出在场、算式旧：成员形校验只判导出 ⇒ 阈值静默为旧式（`gpt-4o` 67,200 vs 102,400 ∥ `deepseek-flash` 369,600 vs 616,000）∥ ② 处置：地板抬至含该算式的核版本（号于核发布时定；发布序 = `docs/server/design/PROJECT.md` §2.3③ 核先发，服务端随升）；抬版前服务端不得以 `^0.10.7` 发行 ∥ ③ 披露（不阻塞）：服务面 `loadCoreConfig` 的形校验只判导出在场、不判算式——防静默旧式只靠版本地板（另立算式探测 = 第二份算式，D3 所拒） | 披露 | 评审/用户复核 |

## 14. 环境感知与环境工具面（功能点 43 ∥ AC-43 ①–⑥）

> 口径 = 用户「管理面的agent现在没有环境感知能力，我希望这一块要对齐cli/vsc和桌面。」+（工具面 ∥ 读文件族 + `bash` ∥ 审计 + 权限归用户）三句；单源 = 需求 `docs/server/requirements/PROJECT.md` §2 功能点 43。

### 14.1 四块装配（时空 ∥ 所在/身份 ∥ 所管现况一行 ∥ 能力与边界）

- **装配形**：每回合（= 每请求）在 `runChatTurn` 起跑段造**三活体行**（+ timer 到期行），**尾插**于历史与本轮消息之后（沿核 `thincoder-core/agent/setup.mjs:176-185` 理由：秒级新值不进前缀——缓存保持命中）；**瞬态不落库**（不进 `agent_chat_messages`、不进回放——值随实况的直接后果；校验 = 回放逐字零含实况行）。
- 三四块逐字形（`chat-env.mjs` 造；`[System reminder: ` 族前缀 = 三端同形标记）：

| 块 | 行形（本面——`{}` = 取值点） | 三端同源坐标（功能点 43 ④——逐块） |
|---|---|---|
| ① 时空 | `[System reminder: current time is {本地时间 sv-SE} (local; timezone {IANA 时区})].` | `thincoder-core/agent/setup.mjs:181-185`（每回合 time reminder——三端同调同核件） |
| ② 所在/身份 | `[System reminder: env: thincoder-server {版本}（{部署身份}）∥ host: {主机名} ∥ platform: {平台} {架构} ∥ node: {版本} ∥ pid: {pid} ∥ cwd: {工作目录} ∥ model: {会话模型} ∥ reasoning: {档位 ∥ 未设}].` | `thincoder-core/agent/setup-reminders.mjs:40-42`（env 行——端名/模型/槽；同族 = `pushEnvStateReminder`） |
| ③ 所管现况一行 | `[System reminder: 管理面现况：注册节点 {N}（active {A} ∥ disabled {D}）∥ 服务模型 {K} ∥ 成员 {M}].` | `thincoder-core/agent/setup-reminders.mjs:152`（`pushManifestStateReminder`——会话所操作对象的现况**单活体行**：值随实况 ∥ 读败保守） |
| ④ 能力与边界 | 系统简报静态段 `CHAT_LIMITS_BLOCK`（工具族清单 ∥ 限额 ∥ 边界——四块之一）+ 活体面 = 当回合 `tools.schemas`（能力清单的真体现） | `thincoder-core/prompts/`（人格/纪律槽——三端能力与边界 = 系统提示词面；本面 = 系统简报） |

- **取值源**：① `now()`（注入面）；② `process`/`os` 直读 + 版本 = `readPackageVersion()`（`thincoder-server/src/ops/update.mjs:46`——版本单源）；
  **部署身份** = 容器（`/.dockerenv` ∨ `/run/.containerenv` 在场）∥ systemd 服务（`INVOCATION_ID` 非空）∥ 独立进程（其余）——判据明列；三判据读取异常 ⇒ 按「独立进程」落值（探针非抛——②行无字段级略去，降级唯块级）；
  ③ 域件进程内直取（`listRunners` ∥ `modelEntriesOf(listProviderEntries(db))` ∥ `listMembers`——每回合三读，读数级）。
- **③ 在线性读面**（父侧裁）：v12 已撤心跳（`sandbox_runners.status` = active/disabled；「在线」只能读时逐节点探活——`thincoder-server/src/sandbox/routes.mjs:128-145` 每节点现打 `/info` 3s）
  ⇒ 不便宜且慢节点会误读离线 ⇒ 本行取**注册态分布**；**在线性/容器数走工具按需探**（`runners.list` / `docker version`——需求同句「明细仍走工具」）。
- **降级（需求 43② 字面）**：块级——该块任一读失败 ⇒ **整行略去**（无半真值上屏），其余行照常、回合不阻断（不抛、不 notice）。
- **timer 到期行**：随三行同落（行文 = 核件单源 `[System reminder: ⏰ timer — {消息}]`）——见 §14.4。
- **不做对位**：git 上下文 ∥ 项目档注入 ∥ 同目录实例（三端有、服务端无对应物——需求 43 边界句；三项以「cwd 锚定的项目」为前提）；**cwd 本身在册**（②行 `cwd:` 字段 + §14.3 工作目录限幅）。

### 14.2 环境工具面（六族八件——核件复用）

| 族 | 件 | 核件（单源） |
|---|---|---|
| 时间 | `get_current_time` | `@thincoder/core/tools/ops.mjs`（`getCurrentTimeTool`——`:140`） |
| 进程 | `process`（list ∥ kill） | 同件（`processTool`——`:51`） |
| 提醒 | `timer` | `@thincoder/core/agent-tools/timer.mjs`（`timerTool`） |
| 文件读取族 | `ls` ∥ `read` ∥ `grep` | `@thincoder/core/tools/search.mjs`（`lsTool` ∥ `grepTool`） ∥ `tools/file.mjs`（`readTool`） |
| 命令 | `bash`（限幅 = §14.3） | `@thincoder/core/tools/bash.mjs`（`bashTool`） |
| 会话 | `read_history`（本会话——§16.1） | `@thincoder/core/agent-tools/read-history.mjs`（`readHistoryTool`） |

- **复用口径**（KD-SV-113）：实现 ∥ schema ∥ 描述三面同源——核工具对象**原文直用**（`execute(args, ctx)`），本面只做 `ctx` 适配与结果归一；**不收窄 schema**（端池参数运行期处置）。
- **载入**：动载（`loadCoreEnvTools()`——沿 `loadCoreChat` 先例）；单元测试档经 `coreTools` 注入口（真件亦可——**仓内核直引**：`thincoder-core/tools/*.mjs` ∥ `thincoder-core/agent-tools/*.mjs`——`DESC()` 经 `prompt-files.mjs` 按模块自身位置解析，仓内 `tool-docs/` 在场 ⇒ 开发机可用真件）。
- **ctx 适配**：`cwd` = `deps.cwd ?? process.cwd()`（相对路径基准——无围栏）；`signal` = 当回合中止信号（透传 ⇒ bash 树杀、模型调用中断同源）；`agent` = timer 垫片（§14.4）；`depth: 0`。
- **结果归一**：`{ ok, subject, summary, output }`——`ok` = 调用完成（未抛错；命令非零退出 ⇒ `ok:true`，退出码在输出文本内 `(exit code N)`——不解析，KD-SV-113 被否栏）；
  `output` = 核件文本原文（模型可见形经会话面 ≤4000 字截断——KD-SV-89 单源）；`subject` = 主语原文（审计数据源——§14.4）；
  `summary` = 人话单行（bash ⇒ 核件结果末行状态行；`get_current_time` ⇒ 首行 `Date:`；`timer` ⇒ 核件返回句；余 = 「工具名 + 主语」）。
- **端池参数处置**（`bash.async` 在册，§15.1）：`bash.async:true` ⇒ 核件异步径（回执即工具结果；池/帽/结算全在核）；`process.kill` 的 `id` 靶 = 后台任务杀点（核 `killBgTask`——杀树 + 出池 + 墓碑；未知/已完成 ⇒ 核件人话）；
  `process.kill` 的 `pid` 靶**在册**（与 bash 等价——含杀 server 自身进程的操作者自伤面；R62②披露）；`timeout` 取值校验见 §14.3；
  `read_history` 的 `path` 非空（文件路径 ∥ `cwd:<dir>` ∥ `all`）⇒ 工具级错误人话（本会话作用域——§16.1）。
- **描述面**：核 `tool-docs/*.md` 原文（三端同文）；其中指向本面不存在工具的指引（write/edit/git/repo_outline 族）落空 = 核文案面发现项（R62③——不改）。

### 14.3 限幅在册（`bash` 三件——需求 43⑤）

| 限 | 值 | 依据 |
|---|---|---|
| 超时 | 缺省 120_000 ms ∥ **无上限**（可指定任意 ≥1 的值；上界 = Node 计时器量程 2147483647 ms——逾之会被归 1 ms 立即触发，故显式拒；非有限值/小于 1 ⇒ 工具级错误——零静默） | 缺省 = 核 `BASH_TIMEOUT_MS`（`thincoder-core/tools/shared.mjs:26`）；**无上限**（核件本无上限——`bash.mjs:285` 直传；`process` 列表/杀 + 中止杀树在册 ⇒ 跑飞可杀） |
| 输出上限 | 三层：工具层 200_000 字（核 `truncate`）+ 每流 2_000_000 字节缓冲（核 `MAX_STREAM_BUF`——`thincoder-core/tools/bash.mjs:15`）⇒ 落库/模型可见 ≤4_000 字（`CHAT_TOOL_CONTENT_MAX`——KD-SV-89 单源）⇒ 帧与审计摘要 ≤300 字 | 全为核件/会话面既有常量——零新口径 |
| 工作目录 | `deps.cwd ?? process.cwd()`（相对路径解析基准；**无路径围栏**——沿核「无边界断言」口径） | 需求 43⑤ 三限之一；围栏 = 权限模型面（12:47 归用户——§10 边界） |

### 14.4 审计与 timer 投递

- **审计（需求 43⑥——KD-SV-114）**：每次调用一 `agent_event`/`chat_call` 行（面不扩——KD-SV-91）；`detail` 增 `subject`（命令原文/路径——≤2000 字，逾限截断并注记；**落库前与 `call` 同链过会话面掩蔽**——「原文」= 未经摘要重写的完整命令，非免掩蔽）∥ `truncated`（结果可见形截断位）；成败 = 既有 `resultCode`。
  审计页 `views-audit.mjs` 增 **agent 行详情模板**（tool · subject · 成败 ·〔截断〕· summary——非裸 JSON）+ 三文案键（`audit.agentOk`/`agentFail`/`agentTruncated`——两表同步）。
- **timer/后台任务投递面**（机制全文 = §15——本行只留指针）：进程内按会话挂垫片（零持久化——重启天然空，与核 `_pendingTimers` 同判）；**到期件与后台任务结算皆经汇面落库投递**（`user` 行 + `data.kind="reminder"`——随历史进上下文）；**到点空闲即自唤醒一轮**（唤醒器 = §15.1；屏障 = 会话行 `status`）；不落库面 = 环境三活体行（§14.1）。
- **秘密面**：掩蔽口径沿会话面（入参敏感键 ∥ 本轮已见敏感值）；**文件内容不在掩蔽面内**（读文件/命令输出可含凭据——如实披露，R62②）。

### 14.5 核可达性（生产镜像——核实结论）

- 依赖声明在案（`thincoder-server/package.json:17` `@thincoder/core: ^0.10.7`）；registry 实核 = 该包在 npm 上（`npm view @thincoder/core version` ⇒ **0.10.8**，2026-10-18 实读；与仓内核版本一致——但该版 `resolveCompactThreshold` 为旧算式，见 §13 R92）；包白名单含 `tools/` ∥ `agent-tools/` ∥ `tool-docs/`（`files` 面）+ `exports: { "./*": "./*" }` ⇒ 子路径直引可达。
- 镜像两装径同经 npm 解析该依赖：构建期（`thincoder-server/Dockerfile:25` `npm i -g ./thincoder-server/*.tgz …`）∥ 运行期（`thincoder-server/deploy/converge.mjs:79-90` `installVersion`——`npm i -g @thincoder/server@<target>`）——registry 不可达 ⇒ 装机失败 ⇒ 拒启（fail-loud，非静默）。**结论：核在镜像内可达**（前提 = 装机时 registry 可达）。
- 开发机（本仓 checkout）未装核 ⇒ 本面全族走动载 + 注入口（生产走真件；单元测试档走注入——真件亦可经仓内直引）。

## 15. 唤醒与投递面

> 口径 = 用户「为啥给主agent bash的时候还加那么多限制，连异步都不支持？」+「我说的就是异步啊！」⇒「有process在，跑死了可以杀的，你没事加那么多限制干嘛！」⇒「定时器server能用吗」+「为啥要有这些差异？我真服了。」。
> **定性**（非新裁）= 跨端用户可闻差异 = 缺陷（唯一例外 = 宿主能力限制）；服务端常驻进程做调度不构成例外 ⇒ = **消差异**，不是加特性。
> 兄弟批接缝（周期/绝对时刻式样——兄弟批设计面）：其 §1 明写「不动唤醒器设计（归兄弟批）」——本 §15 的接口面（§15.1）即其引用面；低费式（只出提醒行、不开轮）若被采纳，本面已把「投递」与「开轮」两步分开，可分叉。

### 15.1 机制（一器两源 ＋ 投递汇 ＋ 唤醒回合）

- **唤醒器** = 新档 `thincoder-server/src/agent/chat-wake.mjs`（已落盘——实读 141 行；装配点 = `registerChatRoutes`——生产路径）。
  - **闩** = 核件复用 `createTimerWatch`（`thincoder-core/agent/timers.mjs:79`）：**会话键面表**（一会话一闩——同桌面 `thincoder-desktop/src/main/suspension-timers.mjs` 键面表形）+ `getAgent: () => pad`（活读、不捕获对象）+ `unref`（进程不因闩保活）。**零轮询**（无 `setInterval`、无秒级 tick）。
  - **两源**：① **到期** = 闩到点回调；② **结算** = 池结算尾唤醒面 `pad._asyncWaiters` 钩子（核 `wakeAsyncWaiters`（`agent-tools/async-settle.mjs:324`）splice 一次性消费 ⇒ 钩子**先自再武装、再评估**）。
  - **评估** = 核火策略复用 `fireTimerWake`（`timers.mjs:102`）：`busy: chatRowOr404(db, chatId).status === "running"`（**空闲判定单源 = 会话行 `status`**——与在途门/`claimChatTurn` 同判；不设进程内忙旗）
    ∥ `deliver: () => hasPendingDelivery(pad, now)`（**纯判据**：到期 timer ∨ `_pendingAsyncResults` 非空 ∨ 汇面留件——**零交付零开轮**）
    ∥ `openTurn: () => runChatWakeTurn(...)`。撞忙/零件 ⇒ 核返 `false`（零动作）⇒ 链尾再武装。
  - **再武装三链尾**：① 用户回合结束（`chat-routes.mjs` 回合尾）∥ ② 唤醒回合结束（唤醒器自持）∥ ③ 结算钩子。**已到期不武装 0ms 闩**（`pendingTimerDeadline(pad) <= now()` ⇒ 撤旧闩，交链尾/钩子消化——防自旋与惊群）。
- **投递汇** = `pad.history`（核三注入器唯一落点：timer 行 `injectTimerReminders` ∥ 后台摘要 `injectBgResult` ∥ 中止丢弃提醒 `async-discard.mjs:121`）——`deliverPending(chatId, { db, now, log, coreTools })`：
  - ① timer 面出列（核 `deliverExpiredTimers`——幂等、零在途早退）。
  - ② 池在途结算逐件注入（核 `injectBgResult`——消费即墓碑；异常 role ⇒ 出列 + 墓碑 + 一条警告，防死循环）。
  - ③ 汇面逐行**落库**（`role: "user"` + `data: { kind: "reminder" }`）；**出** = 本次落库行数。
  - **送达行入会话记录** ⇒ 回放后模型在后续回合仍可见（依据 = VSC 端同判「不落盘 = 下一次 run 读不到 = 静默丢」——`thincoder-vscode/src/extension/timer-watch.mjs`）；落库失败 ⇒ 该行留汇、下次重试（零静默丢）。
- **唤醒回合** = `chat.mjs` 内 `runChatWakeTurn({ db, chatId, source, deps, now, log })`（与用户回合**同环同面**——零第二套环）：
  - **无路由、无帧面**（`emit = null`——控制台页不订阅、帧无人消费；落库单源，用户下次读取即见）；
  - 起跑 = `claimChatTurn`（撞忙 ⇒ `{ status: "skipped" }`——不抛不炸）；**投递先于装配**（`deliverPending` ⇒ 行随历史进上下文，**零二次注入**）；交付 0 件 ⇒ 早退 `skipped`（零空转消费）；
  - **域文本** = 核常量（timer 源 ⇒ `TIMER_TURN_DOMAIN`（`thincoder-core/agent/helpers.mjs`）∥ 结算源 ⇒ `AUTO_TURN_DIGEST_DOMAIN`）——**瞬态尾插**（不落库——沿 §14.1 口径；文案单源 = 核）；
  - 用户回合起跑同样调 `deliverPending`（**回合边界兜底**：唤醒被跳过/失败时件仍在下一回合送达——§14.4 既有口径不回退）。
- **异步面**（`bash.async`）：`chat-env-tools.mjs:137-142` 的 async 拒**删除** ⇒ 核件（`thincoder-core/tools/bash.mjs`）见 `ctx.agent` 走 `launchBgTask`（`agent-tools/bash-async.mjs:100`）：**回执即工具结果**（`bash#N started (running) — log: <path>` ⇒ `tool` 行 ⇒ 进上下文）；帽 4（第 5 件 ⇒ 工具级错误人话）；`timeout` 到点杀树。
  **垫片即宿主**（零自造池）：核载体字段面经核 API 落面（`ensureBgPool` ∥ `parkAsyncPending` ∥ `wakeAsyncWaiters`；`history` 数组 = carrier 回落）——逐字段以核件读取面为准（实施轮按 `launchBgTask`/`nextSubagentId` 实读补齐）。
- **看/管面**（对齐三端——三端亦无专用任务列表工具）：**看** = 回执（id + log 路径）+ `read`/`bash` 读日志 + `process action="list"`（OS 面——子进程在列）；**杀** = `process action="kill" id:N`（核 `killBgTask`——杀树 + 出池 + 墓碑 + 零摘要）。
- **中止面**（非 interrupt）：池条目控制器链**当刻回合信号**（`_sessionSignal` 不设 ⇒ `buildChildSignal`（`async-settle.mjs:165`）回落 `ctx.signal`）；回合中止 ⇒ 回合尾调 `discardAbortedBgTasks(pad)`（`async-discard.mjs:206`——杀树 + 丢弃提醒入汇 + 墓碑；判据沿核 `run-stages.mjs:205-218`）⇒ 提醒行（核件原文）由下一回合边界/唤醒面落库。
  **定义（非 interrupt 中止）** = 无 `reason.interrupt` 的全停式中止——对照 Ctrl+I 中断（`reason.interrupt` ⇒ 注入消息、回合续跑、池保留——核 `run-stages.mjs:197-198`）；服务面唯一中止径 = `POST …/abort`（E57）——无注入续跑通道。

### 15.2 对齐表（三端既有 ↔ 服务面对——逐条）

| 面 | 三端既有（单源坐标） | 服务面处置 |
|---|---|---|
| timer 空闲唤醒 | 核三件 ＋ 各端一闩（`thincoder-core/agent/timers.mjs:79/102`；CLI `thincoder-cli/src/tui/timer-watch.mjs` ∥ 桌面 `thincoder-desktop/src/main/suspension-timers.mjs` ∥ VSC `thincoder-vscode/src/extension/timer-watch.mjs`） | **消**——同核件、同判据（§15.1） |
| 空闲判定 | 端面 busy（在飞回合 ∥ 挂起窗 ∥ 模态） | **消**——单源 = 会话行 `status`（服务面唯一在途表示；与在途门同判） |
| 到期投递形态 | 核 `injectTimerReminders` 行文 ＋ 入机读线 | **消**——同核件行文；入会话记录（落库） |
| 唤醒回合 | 核 `fireTimerWake` 策略 ＋ 端开轮（域文本 = 核常量） | **消**——同策略、同域文本；帧面 = 无人（§15.1） |
| 后台任务（池/帽/回执/结算/杀） | 核 `bash-async.mjs`（帽 4 ∥ 回执 ∥ 池 ∥ `killBgTask`） | **消**——核池原样，垫片即宿主 |
| 结算投递形态 | 核 `injectBgResult`（摘要 ＋ log 路径）⇒ 机读线 | **消**——同核件行文；入会话记录 |
| 待办可见面 | ack ＋ log 路径 ＋ `wait_for`（`bash id:N done`）＋ OS `process list` | **消（等价面）**——ack/日志/OS 进程面在册；`wait_for` 不在本面八件（族面口径另账——§10） |
| 唤醒开关 `agent.timerWake` | 端配置文件键（缺省开；关 ⇒ 零注册） | **留**——服务面无端配置文件面；默认态 = 开（与三端缺省逐字同判）；开关键面 = §15.3③ |
| 可见面（状态行 ∥ 定时器列表 ∥ 后台任务列表） | CLI 状态行段 ∥ `/timers`；桌面/VSC 各有呈现 | **留**——承载物 = 控制台（新 UI 面；含 `views-chat.mjs` 拆分前置）；**触发落流一项 = 消**（唤醒回合的助手回复落库即见） |
| 会话级 Stop（关窗/退出 ⇒ 清池） | 端生命周期（进程退出即清） | **无对应物**——服务面进程常驻、无「会话关闭」动作；在途任务只经 `kill`/中止/进程退出消失（如实披露，R71④） |
| 浏览器后台动作（`browser.async`） | 核 `browser-async.mjs` | **无件可对**——本面八件无 browser（接 = 随 browser 件入册批） |

### 15.3 开放点（不设默认动作）

| # | 项 | 我方推荐（附代价） | 备选 |
|---|---|---|---|
| ① | **唤醒回合的身份与审计行**：actor 取法 ∥ 是否新增一等审计行 | 推荐 = actor 沿会话 owner（`actorNameOf(chat.created_by)`——与用户回合同）；**审计面零扩**（三 kind 不动——KD-SV-91）：工具调用 `chat_call` 照落、异常 `chat_stop` 照落；唤醒标记 = 服务器日志一行（`chat_wake_turn`）＋（可加）`chat_stop.detail.wake` 布尔 | 落一条「唤醒已发生」审计行 ⇒ 需新 kind / 新 detail 形 ⇒ 连带审计页模板 + i18n + AC-28 审计型面计数（代价 = 三面 +1） |
| ② | **送达行的消息形与呈现**（含 timer 可见面） | 推荐 = 「落库（`user` 行 + `data.kind="reminder"`）」——落库理由 = §15.1（机读线单源）；呈现面（提醒行样式 ∥ 状态行 ∥ 定时器与后台任务列表 ∥ 唤醒开关键）= 新 UI 面，前置 = `views-chat.mjs`（500 软线）拆分审查 | 只落库不呈现（提醒行以用户消息样式显一——内容自带前缀，不误导语义） |
| ③ | **计费/制动口径** | **计费 = 已裁落**（用户「应该走我们自己的模型代理服务，这样才能确保用量统计的准确」）——管理面 chat（**含唤醒回合**）经网关链**出账**：usage 行归因 = 本回合发送者 × `admin-agent` key（缺位 ⇒ 会话 owner；机制 = §16.2/§16.3）；**制动**推荐 = 一个唤醒开关（服务配置键 + 系统页控件 + i18n 两键——产品常识：配置项须有 UI 写面） | 不做（对齐三端缺省态；暴露 = 模型自激循环耗平台 token——**今起出账可见**；制动 = 模型停/进程重起）；或加频率下限（属「新增限制」，与用户 15:00 口径相抵；周期式样 = 兄弟批设计面） |
| ④ | **防自激口径** | 推荐 = **不加限制**（对齐：三端唤醒回合内同样可再设 timer/再起后台任务；核既有门已够——在途 timer 帽 8 ∥ 池帽 4 ∥ 一次性闩 ∥ 到期批合并一轮） | 加「唤醒回合内禁再设 timer/再起 async」（= 新增限制面 ⇒ 须与兄弟批一并裁，否则两端行为分叉） |

### 15.4 机检口径（单元测试档）

- **唤醒链**（假模型 + 假钟 + timer 真件）：到期 ⇒ 落库行（`user` + `kind`）∥ 自动开轮（域文本逐字）∥ 出列幂等 ∥ 未到期零行零轮 ∥ 忙零动作 ∥ 零交付零轮。
- **异步链**（假模型 + bash 真件 + 即退命令）：回执逐字（`bash#N started (running) — log: …`）∥ 结算 ⇒ 摘要行落库（核件原文前缀 `[System reminder: background bash#N finished`）∥ 帽 4 ∥ `process kill id` 两态。
- **中止面**：非 interrupt 中止 ⇒ 杀树 + 丢弃提醒（核件原文）+ 墓碑 ⇒ 零摘要投递。
- **结构面**：七端点计数不变（+ask 应答——KD-SV-224） ∥ 三 kind 不扩 ∥ `chat-wake.mjs` 源零 `setInterval` ∥ 导入面（`@thincoder/core/agent/timers.mjs` 四件——同源断言）。
- **出口用例**：管理登录 ⇒ sk 在册 ∥ 管理会话一轮 ⇒ usage 行在场且可归因 ∥ `read_history` 本会话逐形——全文 = §16.4。

## 16. 会话历史查询与模型出口改道

> 口径 = 用户「管理端目前没有查会话历史的工具，这个也需要打开。」⇒ **`read_history` 入内**（条目 ③）；「这样不对，会让我们的帐和provider的帐对不上，应该走我们自己的模型代理服务，这样才能确保用量统计的准确，也应该跟客户端一样，登陆时分配一个sk给管理会话用。」⇒ **管理会话模型出口改道**（条目 ④）。
> 两侧同源**「同客户端口径」**：管理会话 = 本 server 网关链的**进程内客户端**——凭据面（sk）与历史面（本会话 `read_history`）一并收口。

### 16.1 会话历史查询（`read_history`——核件原样 ＋ 库面适配）

- **件 = 核件原文复用**（`thincoder-core/agent-tools/read-history.mjs`——实现 ∥ schema ∥ 描述三面同源，沿 §14.2 复用口径；该档 392 行、零改）：环境族**第八件**、第六族「会话」（§14.2 表）；`ENV_TOOL_NAMES` 七 ⇒ **八**。
- **作用域 = 本会话（写死）**：服务面无「会话树」概念（一会话 = 一行 `agent_chats`）⇒ 核件的跨会话各族（`path` = 文件路径 ∥ `cwd:<dir>` ∥ `all`）在服务面**运行期拒**（`path` 非空 ⇒ 工具级错误人话；缺省/空串 ⇒ 本会话——沿 §14.2 端池参数处置先例，**零 schema 收窄**）。
- **记录面 = 库面单源**（`pad._recordStore = recordStoreOf(db, chatId)`——新增导出，落 `thincoder-server/src/agent/chat-store.mjs`）：`iterate(direction)` 生成器逐行出行，映射为核记录形——
  **记录面 = 库面单源**：`pad._recordStore = recordStoreOf(db, chatId)`（`thincoder-server/src/agent/chat-store.mjs` 新增导出）——`iterate(direction)` 生成器逐行出行，映射为核记录形：
  - `user` ∥ `notice` ⇒ `{ role, content, ts }`；
  - `assistant`（携 `toolCalls` 时）⇒ `{ role, content, ts, tool_calls: [{ id, type: "function", function: { name, arguments } }] }`；
  - `tool` ⇒ `{ role, name, tool_call_id, content, ts }`。
  **`ts`** = 行 `created_at`（ISO 串）解析毫秒，解析失败 ⇒ 该键缺席。**`content`** 原样（核件自截 ≤500 字）。
  **notice 行在列**（role 原值——核件不校验 role；过滤面枚举 = `user`/`assistant`/`tool`，notice 经全量/关键词/时间窗命中）。
- **审计**：沿用 `chat_call`（面不扩——KD-SV-91；KD-SV-114 口径）：`subject` = **过滤摘要**（`role=… keyword=… tool=… since=… until=… limit=… direction=…` 逐项、缺项不列）∥ 成败 = 既有 `resultCode` ∥ `truncated` 照旧。
- **能力段**（§14.1 第四块）：`CHAT_LIMITS_BLOCK` 补 `read_history（本会话历史查询——只读）`（对位断言 = 每件注册名 ∈ 能力段字面）。
- **不做**：跨会话检索（服务面无该面）；历史编辑/删除；核件关键词表加白（核件原样）。

### 16.2 模型出口改道 = 网关链 loopback（KD-SV-129）

- **决策**：管理会话的模型出口 = **本进程监听的网关 HTTP 面**（`http://<本机监听地址>:<port>/v1`）；凭据 = 本回合发送者的 `admin-agent` sk（§16.3——谁用谁；唤醒/续跑轮随最近发送者、主人兜底）；模型 = 会话行 `model`（**对外标识**——与会话创建面/四端客户端同形）。
- **复用点（逐字）** = 网关链全链：鉴权（key 验签）∥ 派发（外标 → provider）∥ 准入三件（模型禁用 ∥ 配额 ∥ 限流）∥ 上游转发 ∥ **记账（usage 行）**——零第二份。**与 KD-SV-82「进程内直取」不冲突**：域件读 = 管理动作面（进程内直取，如 `members`/`providers` 工具），模型调用 = **对外契约面**（走网关）。
- **装配**（`buildChatExit`——`thincoder-server/src/agent/chat.mjs`）：`baseURL = <selfBase>/v1`（`selfBase` = `deps.selfBaseUrl?.()` 惰性取数——`thincoder-server/bin/thincoder-server.mjs` 注入 `server.address()`；
  通配 `0.0.0.0` ⇒ 拨 `127.0.0.1`、`::` ⇒ `::1`、具名地址原样，IPv6 加括号；不经 nginx）∥ `apiKey = sk 明文` ∥ `model = ref`（外标）∥ `name` = provider 名（日志面）。
  **本地 registry 复检保留**（缺模型 ⇒ 会话可建面的既有判据不变）；`reasoningEffort` 装配不变（枚举源 = 上游真名）。
- **失败面**：sk 缺位（未登录/已吊销）⇒ 出口装配抛 ⇒ 既有 `model_error` 收尾（notice 人话含「重新登录控制台」）；网关侧拒（sk 在途吊销 ⇒ 401 ∥ 模型不可用 ⇒ 404）⇒ 网关错误形即模型出口错误 ⇒ 同径收尾。**五终态零新形**。
- **与今日的差（如实披露，三条）**：① 核规格面（`specForModel(provider.model)`）现以**外标**为键 ⇒ 别名/`provider/model` 外标在核规格表上**退中性**（`partialMode` 续写等核内调节面）——**与四端客户端既态逐点同形**（用户 15:44「跟客户端一样」的字面后果，非新增差异）；② 核载荷门 `isRouter`（外标含 `/` ⇒ 静默不发 `reasoning_effort`）——与 R61② 披露同门；③ 出口代理旗 = 网关侧消费，本面零重复。
- **唤醒回合同源**：`runChatWakeTurn` 与用户回合共用出口装配（零第二份）；凭据主体沿 §16.3 口径（唤醒/续跑轮随最近发送者、主人兜底——`senderId ?? chat.created_by`）。
### 16.3 管理面 sk（`admin-agent`——登录 ensure ∥ 免 20 上限；KD-SV-130）

- **归属** = **本回合发送者**（登录成员——成员级、每人一枚、跨会话稳定；谁用谁——用户裁）；**唤醒/续跑轮随最近发送者、主人兜底**（`senderId ?? chat.created_by`——上下文缺位 ⇒ 主人）；**触发** = `POST /api/login` 成功 ∧ `role = "admin"` ⇒ `ensureAgentKey(db, memberId)`（幂等：在册 ⇒ 复用、零重签）；**非 admin 登录零动作**（管理会话 = admin 面）。
- **命名** = `admin-agent`（常量单源 `AGENT_KEY_NAME`——`thincoder-server/src/accounts/keys.mjs`）；落 `api_keys.name`（列表可见、可吊销）。
- **明文落面** = `api_keys.key_plain`（**v19 增段**：`ALTER TABLE api_keys ADD COLUMN key_plain TEXT`；NULL = 常规 key（服务端不留明文）∥ 非空 = 服务端自持面）——写面唯一 = `issueKey({ keepPlain: true })`；**服务端即消费方**（同沙盒工作区 `key_plain` 先例——披露类不升级，R71④ 在册）。归属/生命周期全沿 key 面（逐请求查库 ⇒ 吊销即断）。
- **审计**：首发一条 `key_issue`（`detail = { keyHint, surface: "admin_agent" }`——`surface` 取值域扩，随正 = `docs/server/design/accounts/ACCOUNTS.md` §2.1）；复用登录 ⇒ 零行。
- **口径**：不判 20 上限（沿客户端登录 ∥ CLI 先例——签发面不判，§1.1 判据只在自助面）；不计入「管理动作」审计型（`agent_event` 三 kind 不扩）。
- **已知摩擦（披露）**：① 管理成员「轮转」（`POST /api/me/keys/rotate` 全换）会连带吊销 sk ⇒ 管理会话转 `model_error`，下次登录补发；② 用量/导出面的 key 名恒为 `admin-agent`（归因可读——`usage.key_id` → `api_keys.name` join；单源 = `thincoder-server/src/metering/usage.mjs` 行 42）。

### 16.4 机检口径（单元测试档续）

- **登录发面**：admin 登录 ⇒ `api_keys` 行（`name = "admin-agent"` ∥ `key_plain` 非空 ∥ `status = "active"`）+ 一条 `key_issue`（`surface: "admin_agent"`）；重复登录 ⇒ 同行（零重签）；`user` 登录 ⇒ 零新行。
- **出口入参**（假出口 ∥ 真装配）：一轮 ⇒ 出口配置携 `{ baseURL: "<selfBase>/v1", apiKey: "<本回合发送者的 admin-agent 明文>", model: <外标> }`——**不携** provider `baseURL`/`apiKey`（结构用例）。
- **全链出账**（真网关链 + 假上游 + 本机自环）：管理会话一轮 ⇒ 帧序零变 + `usage` 行在场（member = 本回合发送者〔缺位 ⇒ 会话 owner〕∥ key = `admin-agent` ∥ endpoint = `chat`）。
- **历史面**：会话内（`user` ∥ `assistant`+`tool_calls` ∥ `tool` ∥ `notice` 行）⇒ `read_history` 逐过滤形（role/keyword/tool/since-until/limit/direction）＋ `ts` = `created_at` 毫秒；`path` 传参 ⇒ 工具级错误人话；审计 `chat_call`（`tool = read_history`、`subject` = 过滤摘要）。
- **结构用例**：七端点计数不变 ∥ 三 kind 不扩 ∥ `read-history.mjs` 零改（核件原文——导入即用）∥ 能力段对位（八件名 ∈ 段字面）。


## 17. 与核的取核形

> 目标态 = 需求 `docs/server/requirements/PROJECT.md:601`（用户裁：agent 循环 ∥ 会话 ∥ 审批 ∥ 提示词装配 = 取核；能力面 ∥ 工具集 = 管理面自己的）。
> = 取核形**设计落形**（实现列实施轮）——**核面实现零动**；核欠缝面 = §17.4 开放点（含宿主缝设计草案，供配套核批直接接）。

### 17.1 取核形（一句话）

- **件级取核**：共有机制取核**单件**（工具件 ∥ 计时与唤醒件 ∥ 会话历史件 ∥ provider 客户端 ∥ 模型规格件 ∥ 压缩件——逐件 = §17.2）；**环体（回合骨架）自持**——宿主语义（DB 单源 ∥ NDJSON 帧 ∥ 档面裁剪（§5） ∥ 网关记账出口）在核内无对应缝（§17.4 ①）。
- **消费面接法**（沿既有先例）：动载（`import()` 懒载 + 缓存）+ 注入口（单元测试档替身）+ 缺核降级（环境族不注册 ∥ 档位退中性——回合不阻断）；**垫片即宿主**（核件以既有 `ctx`/`agent` 读面为准——§14.2/§15.1）。
- **最近先例**（对齐 ∥ 偏离）：先例 = 件级核件复用既有形（本档 §14.2 环境工具面六族八件 ∥ §16.1 `read_history` 核件原样 ＋ `recordStoreOf` 库面适配）；对齐 = 同法（动载 ∥ 注入口 ∥ 结果归一）；偏离 = A1 替换自建回灌形（理由 = §17.3 A1）∥ A3 标记行落法（理由 = §17.3 A3）。
- **核件原文复用**：实现 ∥ schema ∥ 描述三面同源——不收窄 schema、不二次包装（KD-SV-113 口径）。

### 17.2 引核件清单（file 级）

**在盘（15 件——已消费；本清单 = 「服务端消费哪些核件」单源；版本对位背书 = 服务端设计档 `docs/server/design/PROJECT.md` §2.3）**：

| 核件 | 取用面（导出） | 服务面消费坐标 |
|---|---|---|
| `@thincoder/core/provider/index.mjs` | `chat` | `run.mjs`（任务出口——`:23`）∥ `chat.mjs`（会话出口——`:403` loopback 描述子） |
| `@thincoder/core/model-specs.mjs` | `specForModel` | `gateway/reasoning-levels.mjs`（档位枚举——`:38`） |
| `@thincoder/core/agent/timers.mjs` | `deliverExpiredTimers` ∥ `createTimerWatch` ∥ `fireTimerWake` | `chat-env-tools.mjs`（投递汇①）∥ `chat-wake.mjs`（唤醒器——闩 ∥ 火策略） |
| `@thincoder/core/agent-tools/timer.mjs` | `timerTool` | `chat-env-tools.mjs`（环境族·提醒） |
| `@thincoder/core/agent-tools/bash-async.mjs` | `injectBgResult` | 同上（投递汇②——后台任务送达） |
| `@thincoder/core/agent-tools/async-settle.mjs` | `writeTombstone` | 同上（异常件墓碑） |
| `@thincoder/core/agent-tools/async-discard.mjs` | `discardAbortedBgTasks` | 同上（中止收尾） |
| `@thincoder/core/agent-tools/read-history.mjs` | `readHistoryTool` | 同上（第六族·会话） |
| `@thincoder/core/tools/ops.mjs` | `getCurrentTimeTool` ∥ `processTool` | 同上（时间 ∥ 进程） |
| `@thincoder/core/tools/search.mjs` | `lsTool` ∥ `grepTool` | 同上（文件读取族） |
| `@thincoder/core/tools/file.mjs` | `readTool` | 同上 |
| `@thincoder/core/tools/bash.mjs` | `bashTool` | 同上（命令族） |
| `@thincoder/core/tools/shared.mjs` | `toOpenAISchema` | 同上（schema 形单源） |
| `@thincoder/core/agent/helpers.mjs` | 域文本面（`loadCoreTurnDomains`） | `chat-env-tools.mjs`（唤醒轮域文本） |
| `@thincoder/core/attachments.mjs` | `parseDataUrl` ∥ `isNonVisionModel` | `chat-routes.mjs`（图面两门——`:40`） |

**MCP 面采用（1 件——同清单同规则；机制全文 = `docs/server/design/mcp/MCP.md` §4）**：

| 核件 | 取用面（导出） | 服务面消费坐标 |
|---|---|---|
| `@thincoder/core/mcp.mjs` | `connectMcpServer` ∥ `probeMcpServer` ∥ `closeAllMcp` ∥ `removeMcpTools` | 新档 `thincoder-server/src/mcp/face.mjs`（已落盘——工具面装配）∥ `thincoder-server/src/mcp/routes.mjs`（已落盘——探活 ∥ 删行关闭）∥ `bin/thincoder-server.mjs`（停机收尾） |

**新增（3 面——零核改可采纳件）**：

| 面 | 核件（取用导出） | 服务面落点 |
|---|---|---|
| A1 工具轮回灌形 | `@thincoder/core/model-specs.mjs` `assistantToolCallMessage`（`:355`）＋ `specForModel`（`:298`） | `chat.mjs` ∥ `run.mjs` 自建形替换；回声落库/回放 |
| A2 历史修复 | `@thincoder/core/agent/helpers.mjs` `repairHistory` | 回合装配期（回放段）施用 |
| A3 上下文压缩 | `@thincoder/core/context.mjs` `compressIfNeeded`（`:165`）∥ `compressFallback`（`:239`）∥ `COMPRESS_FAILURE_LIMIT`；`@thincoder/core/config.mjs` `resolveCompactThreshold`（`:191`）——阈值 | 新档 `chat-compact.mjs`（压缩面 ＋ 落库标记适配 ＋ 阈值取数） |

### 17.3 新增三面（机制与接法）

**A1 工具轮回灌形（取核——替换服务端自建形）**：tool 轮 assistant 消息改由核件构造——`assistantToolCallMessage(response, specForModel(<上游真名>))`，上游真名 = 别名反查后取（§11.4 解析单源）。核件自动携带两件回声：`reasoning_content`（`reasoningEcho:"required"` 族——deepseek/kimi/mimo；缺值回 `""`）与 `tool_calls[].extra_content`（思考签名——在场才带）。

**配套三件（落库面）**：

- ① **回声道落库**——tool 轮 assistant 行 `data.reasoning`，回放回插 `reasoning_content`。
- ② **签名落库**——`data.toolCalls[].extraContent`，回放重建。
- ③ **`args` 落库 = 掩蔽原文**——JSON 有效、不截断；≤500 摘要只落 `call` 帧与审计面。理由 = 截断残 JSON 回放会撞严校验上游（dashscope code 系，400 实证）。

**净化与体量（两条如实披露）**：

- 存量坏行在回放面兜底：非 JSON ⇒ `{}`，合法原样逐字；**非对象根（数组/标量）∥ 非法入参同样落 `{}`**。
- 落库/详情面的 `args` 自此无 500 上限（随模型输出增长）；帧与审计面仍 ≤500。

**理由与被否**：理由 = 跨端语义单源（三端经核件同判）。被否 = 维持自建形——自建形零携回声/签名，正是回声族「首个工具调用后思考断流」症状的复现面。

**实施后读数**：`chat.mjs` 工具轮已改经核件构造（`chat-compact.mjs` 的 `assistantTurnOf` 承接）∥ `run.mjs` 任务环随任务式退场删净（该档现读 **33** 行，零自建形）；自建形现存一处 = `chat-compact.mjs` 的缺核回落位。

**A2 历史修复（取核）**：回合装配期对回放段施用核 `repairHistory`——修断链 `tool_calls` ∥ 孤儿 `tool` 行（中止/重启窗病态形）；常态输入原样（零改）。
落点（实施落定）= 回放面（`replayEntriesOf`/`replayMessages`/`messageOfRow`——标记解析 `compactionCoversOf`）自 `chat.mjs` **迁入** `chat-store.mjs`；`chat.mjs` 装配点施用（`repairTurnHistory`——缺核 ⇒ 原样）。被否 = 自修（第二份）。

**A3 上下文压缩（取核——消跨端差异）**：落核压缩——

1. 时机 = 回合起跑段（本轮消息与投递落库后、模型调用前；安全点 = 历史以 user 结尾）；
2. 垫片 = **专用压缩垫片**（`{ history: <本次待发消息数组>, provider: <loopback 描述子>, config: { traces: { enabled: false } }, cwd }`——勿与 env 垫片混用）；**provider 取数 = 注入口** = `deps.compactProvider ?? modelExit.provider`（生产 = 出口同源；单测替身免真 HTTP）；
3. 调用 = `compressIfNeeded(垫片, 阈值, { onCompressStart }, { systemPrompt, tools }, signal)`——**摘要调用经同一出口**（loopback ⇒ 记账同链；`usage` 行可归因——用户 15:44 口径不破）；**可视面 = `onCompressStart` ⇒ 日志一条**（`chat_compact_start`——观察链，不产帧）；
4. **落库单源 = 压缩标记行**（`role="user"` ∥ `data.kind="compaction"` ∥ `data.covers=[seq首, seq尾]` ∥ 内容 = 压缩产物文本）：回放自标记解析——覆盖区间以标记行代（嵌套标记自然消解）；**原行不删**（审计面原文留存；模型视野 = 压缩后形——「回放逐字一致」= 对标记形成立）；覆盖区间 = 压缩前后差分求（首变点 ⇒ 尾重合段前沿——实施当刻以核 `applyCompression` 实读为准）；
5. 失败链 = 进程内计数 ＋ 达 `COMPRESS_FAILURE_LIMIT`（= 3——取件 = `@thincoder/core/context.mjs`）⇒ 降级 `compressFallback`（确定性截断——同落标记行）；
   - **阈值 = 按在用模型现算（与核同源）**：起跑段 `compactThresholdOf`（`chat-compact.mjs`）取数——会话外标经 §11.4 解析径解上游真名 ⇒ 核 `resolveCompactThreshold(undefined, { model })`（`@thincoder/core/config.mjs`；算式单源 = `docs/core/design/CONTEXT-COMPACTION.md` §6.17，本档不复述）⇒ 传 `compactTurnHistory` 的 `threshold`。
   - **兜底 = `DEFAULT_COMPACT_THRESHOLD`**（`chat-compact.mjs` 常量，100,000）——三形取兜底：调用方未传 ∥ 缺核 ∥ 取值失败（`compactTurnHistory` 缺省入参同值）。
   - **模型名未登记** ⇒ 核缺省规格（128K/32K ⇒ 96,000）＋ 核一条告警（`model-specs.mjs`）——服务面不复述算式、不加第二条告警。
   - **生效面** = 后续回合起跑段；已落库原文与既有标记行零动（回放按 `covers` 解析，与阈值无关）。

被否 = 不压缩（跨端差异续存）∥ 就地删行改写（记录面丢原文）。

**缺核降级与警告面（三面共轨）**：三面各自退中性（A1 自建形回落 ∥ A2 原样返回 ∥ A3 跳过）；核件成员级形校验（导出缺失 ∥ `COMPRESS_FAILURE_LIMIT` 非正整数 ⇒ 按缺核处置）＋ 核件运行期抛 ⇒ 自建形回落——**回合不阻断**。警告面 = 会话面（`log` 通道在位）：退中性面各一条 `chat_core_face_missing`。阈值件（`config.mjs`）**单缺** ⇒ A3 **不跳过**（压缩照常，阈值取兜底常量 100,000）——该面退化只到阈值口径（`face="config"` 一条警告）。

### 17.4 开放点（不纳入——路径与触发已定）

- **① 环体取核（`runAgent`）——目标态未闭**：实读相抵——`thincoder-core/agent/setup.mjs:198-208`（depth 0 恒调 `assembleFamilyTools`）∥ `family-tools.mjs`（无宿主裁剪入参）⇒ 直用 `runAgent` 会带全家族矩阵（subagent ∥ ledger ∥ batch ∥ advisor…）＋ git/树/记忆/技能注入，与 §5 裁剪裁决相抵。
  **宿主缝设计草案（供配套核批——只设计不实施）**：
  - 候选 a = `assembleFamilyTools`/`prepareRun` 增**宿主面入参**（`hostFaces = { familyTools: false | [名单], injections: { git: false, tree: false, memory: false, skills: false } }`）——缺省不改 ⇒ 三端逐字零变。
  - 候选 b = 宿主函子缝（`host = { familyTools(), reminders() }`——空 ⇒ 核默认）。
  - **推荐 = a**（纯参数化 ∥ 面最小）。
  **切换判据** = 核批落地后：服务面 `chat.mjs` 环体替换（帧面 ∥ 落库 ∥ 中止面三适配）＋ 三端回归（零改）。触发 = 配套核批开批。
- **② 提示词装配（场景槽）**：核 `prompt-overlays.mjs` 场景表无管理面场景；简报内容 = 服务端产品文案（自持——「壳自持增量」形）。触发 = 需跨端提示词机制（槽 ∥ 降级链）复用的实需出现（届时核批增场景）。
- **③ 会话面（核 session-store）**：服务端 DB 单源（审计 ∥ 七端点 ∥ 控制台 ∥ 计量）⇒ 自持；核会话存储 = 文件面（`~/.thincoder/sessions`——改根仅测试缝，非生产面）。触发 = 核开会话存储正式注入缝 ＋ 产品理由出现。
- **审批腿（目标态四腿之一——本批落，非开放点）**：写类工具审批卡面 = §11.5（KD-SV-224–227；2026-10-17 用户裁）——四腿中审批一腿由此闭合，余三腿 = ①②③（开放点如旧）。

### 17.5 核面零改声明

- 取核件（§17.2 在盘 15 件 ＋ 新增 3 面）**全部为核既有导出**（声明依赖实读 `^0.10.7`；逐件坐标 = §17.2/§17.3）；**导出在场 ≠ 算式同位**（阈值算式随核版本变——§13 R92）；
- 与实施轮**核侧零文件 ∥ 零导出 ∥ 零行为改动**；核欠缝面（环体 ∥ 场景槽 ∥ 会话面）= §17.4 开放点——**配套核批承接**（不塞实施）。

### 17.6 版本对位与机检

- 版本对位口径（依赖形 ∥ 地板口径 ∥ 发布序）全文 = 服务端设计档 `docs/server/design/PROJECT.md` §2.3。
- 机检（→ 实施轮）：§7 新增判据行「与核取核形」——载体 = 单元测试档。
