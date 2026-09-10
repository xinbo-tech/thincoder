# SESSION — 需求

> 板块：会话（CLI 会话存储/加载/恢复）。需求层文档（docs/requirements/）。
> 状态：已实现。
> 来源：2026-09-10 自 `../design/SESSION.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

### 10.1 需求与约束

**总体需求**：同一项目下 CLI 与 VS Code 并存时，任一端退出重进都回到**本端**上次的会话；两端对"当前会话"的记录不再互相覆盖。

- F1：CLI TUI 重启 → 恢复 CLI 自己退出前的会话；恢复依据 = CLI 本端持久记录。
- F2：迁移一次性继承——本端从无记录（升级/该项目首用）时：共享 active 指向的槽若属主已死/无属主且文件存在 → 认领继承一次并写下本端记录；属主为活进程 → 绝不继承（全新槽起步）。此后本端记录恒在，不再读共享指针。
- F3：VS Code 面板同构（F1/F2 镜像）。
- F4：`/new`、`/session N`、面板"打开历史会话" → 更新本端记录；删除本端记录指向的槽 → 记录**显式置空**，下次启动全新起步（不继承他人遗留、不复活被删会话）。

**范围边界**：

- ACP 会话（session/load|resume|new|delete——显式钉槽 + 同进程守卫）：行为不变、**不读本端记录**（恢复决策不经 marker）；经共享 newSession/deleteSlot 调用点的 marker 写入属预期副作用（"端内最后认领者"语义——无行为回归）。
- 混合版本：旧版另一端仍按共享指针认领（无 marker 概念）——新版端行为局部退化（D-7 矩阵），数据安全不变；完整效果需两端同步升级。
- 手动跨端接续保留：`/session` 与面板会话列表列出全部槽位，任一端可手动打开另一端留下的会话。
- 数据零丢失：本变更只改"恢复目标选择"——槽文件内容与既有防护（sessionStart 轮转、.bak/.corrupted/.unreadable）全部不变。

**非功能需求**：

- NF1：**不新增跨端共享可变字段**——本端记录是本端**单写者**文件（manifest 条目级合并只认识已知字段、旧版整对象写会丢未知字段——记录进 manifest = 重开跨端丢失更新窗口）。
- NF2：记录写入原子（.tmp+rename）且失败容忍——写失败 → 本次启动按无记录路径降级，不影响会话数据。
- NF3：启动成本不增——恢复决策的存活探测次数与现状 ensureActive 同量级。
- NF4：跨端并发语义不回归——活槽绝不双写（认领/继承先过属主生死；slot 粘性不变）。

---

### 11.1 需求段（2026-09-08 用户裁定——env-state slot + resumed 按会话跟踪——快车道）

> 状态：需求登记（2026-09-08 并批评估 + 用户裁"先处理环境感知"——TODO L80 + L15 合并批；git 富注入优化拆开独立排）。设计启动前需澄清确认。

**总体需求**：env-state 行补 `slot: {N}` 字段（agent 自知当前会话槽号）+ resumed 语义从"进程级一次性"完善为"按会话跟踪"（每次会话恢复得一次 `resumed: yes`）——双端（CLI/VS Code）同机制。

**功能性需求**：
- **F1（slot 字段）**：As a agent, I want env-state 行含 `slot: {N}`（当前会话槽号）, so that 我自知落在哪个会话槽（诊断/跨会话/多实例协作语境）。
- **F2（resumed 按会话跟踪）**：As a agent, I want 每次会话恢复（进程重启 resume / 中途切换会话到有历史的槽）的首个回合得一次 `resumed: yes`, so that 我不把"切槽恢复"误当"普通续跑"。
- **F3（CLI 伪触发修复）**：As a 开发者, I want 消除全新会话 turn 2 误报 `process restarted`/`resumed: yes` 的伪触发（现 `_sessionStart != null` 推断缺陷——勘察发现）, so that 无恢复事件不误报。

**非功能性需求**：
- N1 双端同机制——env-state 行模板同构（只差 END 常量）——slot/resumed 语义双端一致
- N2 slot 语义 = 粘性当前会话槽（CLI `agent._slot` / VSC `_engPersist.slot`）——非 manifest active 共享指针
- N3 slot 无绑定窗口 → 字段如实 `slot: null`（不读共享 active 回退——避免 ACP 多会话张冠李戴）
- N4 判定守卫保持：depth-0 / 非 resume / 非 autoTurn 才注入（digest/续跑不触发）
- N5 判据统一："载入历史非空"（VSC 现语义）——CLI 由 `_sessionStart != null` 推断改为显式恢复事件
- N6 注入句解耦：`process restarted at…`（真进程重启）与 resumed（含切槽恢复）语义分离——切槽不误报进程重启

**待设计澄清**（设计时定）：
- VSC：resumed 信号改 agent 级 `_resumedPending`（agent 换槽销毁重建天然对齐——restore:true 工厂路径武装）——**模块级闸 restartDetectionDone 保留不迁（评审 #7——process restarted 句的进程级信号）**
- CLI：applySession 收敛落点武装恢复事件 + 清 `_sessionStart` 推断
- 测试：双端新建 setup-reminders.test.mjs（现零测试）

---

### 13.1 需求

- **F-R19a（跨会话检索）**：检索任意会话（本 cwd 或指定目录）的消息历史——跨会话找回裁定/决策/过去讨论（read_history 本会话外延）。
- **F-R19b（检索族消歧）**：检索/记忆族工具描述互指消歧（何时用哪个）——"查历史"不命中 5 个工具选错。
- **NF-R19**：readonly；depth-0 only（同 read_history——子代理查"本会话"无意义域外）；会话文件为只读检索对象（不写不改）；性能 = v1 逐文件流式读（无索引——行读 + keyword 预筛）；隐私 = 本机会话文件（同 read_history 无额外门禁）。
