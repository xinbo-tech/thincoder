# 2026-09-28 · 拆档批
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-28 · 来源 = 台账 #510 + 拆分族归集（#413/#438/#482/#484/#489）——用户「AB两条都走吧」授权 2026-09-28。
> 台账 = #510（拆档批 · 归批）。前情 = docs/batches/2026-09-28-desktop-midturn-input.md §6（已收口 2026-09-28）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-28
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

### 1.1 主题与范围（2026-09-28 · 用户「AB两条都走吧」授权——A 线）
- 本批 = **拆档批**（台账 #510 + 拆分族归集 #413/#438/#482/#484/#489）：全仓「越 300 ∕ 贴 500」档的结构拆分（**纯移动 · 零行为改**——除各档预案既定的随拆收正）。
- 范围三树：
  - **桌面**：越层族（`styles.css` 三段拆 · `core.css` 按面拆 · `views/settings-sections.mjs` agent 段拆 · `mount-settings.mjs` 信息行拆出 · `events.mjs` **497**（触碰前必拆）· `agent-host.mjs` 374 · `mount-composer.mjs` 322 续拆 · `store.mjs` 328）+ 测试档族（`views-settings.test` 446 · `views-question.test` 364 · `store.test` 339 · `views-tabbar-close.test` 317 · `views-chrome-vocab.test` 320 · `host-floor.test` 313 · `views-activity.test` 339 · `agent-host.test` 489 迁两例）。
  - **核件**：`subagent-actions.mjs` **499**（#413——先拆后改）· `dispatch.mjs` **499**（#482）· `session-slots-manifest.mjs` 366（#484）· 两 portability 用例档 407/388（#489）。
  - **CLI**：`bin/thincoder.mjs` **499**（#438——命令分发表外提 · CLI-DEBT.md:35 A4 行）。
- 预案源 = 各档设计档（`docs/desktop/design/PROJECT.md` §4.1 越层段 ∕ §10 · `PORTABILITY.md:188` · `core-hygiene.test.mjs:72` · `CLI-DEBT.md:35`）——本批 = 执行 + 择一处定夺。

### 1.2 前情
- 本会话诸批（align-2 ∕ align-3 ∕ idle-wake ∕ timer-wake p2 ∕ midturn）已全部收口冻结；本批承接其越层台账 + 新顶格档（events.mjs 497 ∕ 四档 499）。

### 1.3 台账
- **#510**（汇批：+ #413 ∕ #438 ∕ #482 ∕ #484 ∕ #489 归集）→ 本批——归批触发 = 已点火（随实施核销）。

### 1.4 R1 ∕ R2 暂缓 + R3 ∕ R4 开派（2026-09-28 18:4x · 父侧）
- **复评（轮次 2）通过**（🔴 0 · 🟡 2 · 🔵 6）——轮 2 八条中 R1/R2 相关者（#1 行位 ∕ #3–#6 ∕ #8）随复起轮一并核销。
- **R1 ∕ R2 暂缓**：与 #526 对齐总纲（输入面板 ∕ 流程机制两批）**文件面重叠**（`mount-composer` ∕ `views/*` ∕ `events` 等将被对齐线改造）⇒ 复起时按**届时盘面重锚**（文件清单 ∕ 拆点 ∕ 计数整表刷新），避免同一批文件两次触碰。
- **R3 ∕ R4 开派**：核件族 ∕ CLI 面与对齐线零交集，按 §2.4 ∕ §2.5 实施。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（修正轮 1 已落——评审 11 条全收（第 1 条重切 + 级联序中性判据；R1 新档 23 ∕ 总新档 43；零设计档改动；逐号收正见 §2.9 块））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.0 本批条目与范围口径

- **覆盖条目**（核销时点 = 各轮实施收口后，§6 统一核销）：#510（拆档批主条）· #413（`subagent-actions.mjs` 先拆后改）· #438（`bin/thincoder.mjs` 命令分发表外提）· #482（`dispatch.mjs` 主动拆分）· #484（`session-slots-manifest.mjs` 认领面族拆）· #489（两 portability 用例档拆）。
- **设计档落点**：**无**——本批零设计档语义变更（纯结构拆分）；各档越层登记 ∕ 读数的文档面收正 = 归 `docs/batches/2026-09-28-doc-backfill-sweep.md`；登记落点 = 本档 §2。
- **范围口径**：以「在册面」为准——§1.1 列举档 ∪ 各档设计档越层段已登记档（「消解窗口 = 该档下次被触碰的批」或「触发已到」者）。据此本舱收编：桌面交付面补五档（`i18n.mjs` ∕ `chat.css` ∕ `views/chat.mjs` ∕ `views/sessions.mjs` ∕ `views/activity.mjs`——各带在册预案）+ 测试档族补三档（`session-contract.test` ∕ `events-reduce.test` ∕ `views-locks.test`）。**未在册**而现盘越 300 者不在本批射程——只报（§2.8-3）。
- **明示不做**：文档读数回填（归上述回填批）· 需求档 ∕ 提示词零触 · 行为语义零变更 · 未在册档的拆分（归下一拆档批）。
- **计量口径**：行数 = 现盘 `wc -l`（末行无换行符者读取器 +1——凡标 `N/N+1` 处同此）；目标 = 拆分后各档 **≤300**（核件档 ≤500 体系内**全落 300 内**）；每轮文件 ≤15 且不跨树——口径 = **行动表原档数 ≤15**（新档 = 拆分产物、随动档另列，不计入）；预算列 = 拆后预估（含新档脚手架 ≈15-25 行/档，合计可略超原档），实施轮以实读为准，**≤300 为硬判**。

### 2.1 轮结构（四轮 · 逐轮 = 独立 coder 舱任务书）

| 轮 | 树 | 原档数 | 新档 | 拆后各档 | 依赖 |
|---|---|---|---|---|---|
| R1 桌面交付面 | `thincoder-desktop/`（renderer + src/main） | 13 | 22 | 全 ≤300 | 先行（无依赖） |
| R2 桌面测试档族 | `thincoder-desktop/test/` | 11 | 11 + 1 夹具档 | 全 ≤300 | **R1 后**（部分新档 import 面引用 R1 产物路径） |
| R3 核件族 | `thincoder-core/` + 两端 portability 用例面 | 5 | 4 | ≤300（核件全落 300 内） | 独立——可与 R1 ∥ |
| R4 CLI | `thincoder-cli/` | 1（+1 随动） | 2 | bin ≈180 · 两新档 ≤300 | 独立——可与 R1 ∥ |

轮序纪律：R1 ∕ R2 同树**串行**（共享面）；R3 ∕ R4 与 R1/R2 零文件交集，可并行派舱。受影响总表 = §2.2–§2.5 行动表（原档 30 · 新档 40 · 随动测试面 5 处：`views-locks` ∕ `host-floor` ∕ `views-chrome-vocab` ∕ `files.mjs`+`run.mjs` ∕ `memory-sweep-cli`）。

### 2.2 轮 1 · 桌面交付面（13 原档 → 22 新档）

**目标**：13 原档纯移动拆分；13 主档 + 22 新档全 ≤300；桌面套件（基线 263）+ doc-check 相对基线零净增。

**行动表**（原档（现读）→ 新档 ← 移动内容 → 预期）：

1. `renderer/styles.css`（498）→ `renderer/theme.css` ← :5-69 主题变量（亮 ∕ 暗两套）；`renderer/rail.css` ← :148-355 左列面（含 :346-355 单断点折叠态段）；`renderer/chrome.css` ← :357-480 中区外壳面（标签条 ∕ 会话头 ∕ 状态栏 ∕ 位标）。主档留：档头 + 基础复位 + 三列栅格与容器（:71-147）+ 滚动条皮肤 + 交互态组（:482-498）≈100-140。
2. `renderer/core.css`（345）→ `renderer/core-blocks.css` ← :200-345（② 推理块 ∕ ③ 复制钮 ∕ ④ 子 agent 块面 ∕ 组外面）。主档留 ① 核 Markdown 产出 ≈200。
3. `renderer/views/settings-sections.mjs`（356）→ `renderer/views/settings-agent.mjs` ← agent 族（可编辑类型闭集 ∕ `NAMED_FIELDS` ∕ agent 字段行 ∕ 具名控件行与出值 ∕ `agentBody`）。原档 re-export `agentBody`（导出面零改）≈250。
4. `renderer/mount-settings.mjs`（499/500 · 特挂「触碰前必拆」）→ `renderer/mount-settings-reads.mjs` ← 四段读数供给族（`activeModel` ∕ `loadProviders` ∕ `loadModels` ∕ `loadAgent` ∕ `loadMcp` ≈105）；`renderer/mount-info.mjs` ← 信息行族（`INFO_SLOT` ∕ `refreshInfo` ∕ `paintInfo` ≈50）；`renderer/mount-settings-exits.mjs` ← 出口族 + 写路辅助（八出口 + `agentPatch` ∕ `rowValue` ∕ `currentFields` ∕ `namedOut` ≈175）。主档 ≈180-270（装配 ∕ 窄桥 ∕ 失败面 ∕ 重绘 ∕ 向导接线）。三新档接线沿 `mount-onboarding.mjs` 注入先例。
5. `renderer/events.mjs`（497）→ `renderer/events-shared.mjs` ← 共用低层（:46-92 键闭集 ∕ 池写 ∕ 键过滤 ∕ 尾块定位 ∕ 游标清点）；`renderer/tool-reduce.mjs` ← 工具三事件（:120-173）；`renderer/subagent-reduce.mjs` ← 子 agent 归约径（`ev:activity` 四形 :353-395）；`renderer/readings-reduce.mjs` ← 读数切片族（:189-300 + `ev:ledger` :409-425）；`renderer/queue.mjs`（既有档）← `ev:queue` 两形归约（:301-319）。层序：events-shared（叶）← 各归约档 ← events.mjs（零环）。主档 ≈204。
6. `src/main/agent-host.mjs`（374）→ `src/main/session-routes.mjs` ← 会话级偏好写面（键闭集 ∕ 形判 ∕ `session:prefs` 路由）+ 模式位活值投影 `flagsOf` + 作答回执叠加 `respond`；`src/main/session-lifecycle.mjs` ← 装配清除 `dispose` + 切项目级联。主档 ≈240。
7. `renderer/mount-composer.mjs`（322）→ `renderer/composer-view.mjs` ← 构树面（`composerModel` ∕ `composerTree` ∕ `mountComposer` + `isComposing`）。原档 re-export 同名（`mount-cards.mjs` 消费面零改）≈182。
8. `renderer/store.mjs`（328）→ `renderer/tabs.mjs` ← 标签族 + 关闭确认 + 换形态（`openTab` ∕ `closeTab` ∕ `needsCloseConfirm` ∕ `requestCloseTab` ∕ `confirmCloseTab` ∕ `cancelCloseTab` ∕ `openRailForm` ∕ `closeRailForm` ∕ `deriveTabBadge`）。原档 re-export（导出面零改）≈238。
9. `renderer/i18n.mjs`（489）→ `renderer/i18n-settings.mjs` ← 设置 49 + 向导 10 + 信息行 9 键（两语）≈165；`renderer/i18n-views.mjs`（既有档）← 加挂视图面族：状态行 16 ∕ 状态栏 1 ∕ 活动池 7 ∕ 会话头 3 ∕ 档位 2 ∕ 对话流 10 ∕ 输入区 6 ∕ 审批 7 ∕ 提问 3 ∕ 核件 9 ∕ 说话人 3 ∕ 待发送 1 ∕ 复制 2 键（≈70 键）。主档留左列 17 ∕ 标签条 4 ∕ 来源端 3 + 机制（`t` ∕ `initDict` ∕ 归一）≈210。合并式（展开）装配点与 `HOST_DICT` 单源不变。
10. `renderer/chat.css`（479）→ `renderer/chat-cards.css` ← :205-331 卡族（审批 ∕ 提问 ∕ 计划 + 作答区）；`renderer/chat-fixes.css` ← :388-479「对齐第三批」小修族。主档 ≈260。
11. `renderer/views/chat.mjs`（354）→ `renderer/views/chat-frame.mjs` ← 帧尾四步族（尾段挂载 ∕ 锚同刷 ∕ 就地更新 ∕ 头动作 ∕ `settleFrame` :276-354）。主档 ≈259。
12. `renderer/views/sessions.mjs`（304）→ `renderer/views/rail-rows.mjs` ← 会话行族（会话行 ∕ 行控件 ∕ 元数据 ∕ 短日期 ∕ 动作控件 ∕ 换形两键 ∕ 改名控件 ∕ 行标题 ∕ 端标 :175-266）。原档 re-export 按需 ≈204。
13. `renderer/views/activity.mjs`（321 · 注册条件「超线则执行」已到）→ `renderer/views/activity-blocks.mjs` ← 核件块面（块元素 ∕ 内容增量 ∕ 冻结着装 ∕ 同 key 更新 ∕ 出生 ∕ 键控差分 ∕ 容器标签刷 :191-285）。主档 ≈216。

**随拆收正（本轮必做 · 逐处）**：

- `renderer/index.html` 链接序：`theme.css → styles.css → rail.css → chrome.css`；`chat-cards.css` ∕ `chat-fixes.css` 排 `chat.css` 之后（各拆出段与剩余段相对序保持）。
- 消费面 import 零改：新档导出名由原档 re-export 承接（断言面 = 消费档 import 行零 diff）。
- 测试锁面随拆点更新（**断言值逐字不变**）：`test/views-locks.test.mjs` U174 ∕ U182 的 `styles.css` ∕ `core.css` ∕ `chat.css` 扫描靶按拆分后住档重指；`test/host-floor.test.mjs` U95 `fresh` 臂清单增新码面档（惯例）；`test/views-chrome-vocab.test.mjs` 零 CJK 名单按需随动。
- `scripts/check-dist.mjs` ∕ 打包清单按需实核（CSS 新档入产物）。

**禁止范围**：不触测试档（除上述随动三处）· 不触核 ∕ CLI ∕ VSC 树 · 零文档档改动 · 零行为语义（零改名 ∕ 零新分支 ∕ 零顺手优化）· 零新功能。

**验收**：桌面套件 263/263 绿（含随动后）· `node scripts/doc-check.mjs` 相对基线零净增 · 逐档实读 ≤300 · U52 导出锁绿 · 无行为改六条（§2.6）。

### 2.3 轮 2 · 桌面测试档族（11 原档 → 11 新档 + 1 夹具档）

**目标**：11 原档拆分；拆后全 ≤300；桌面套件用例数不降（263 基线）；`test/files.mjs` 两向自检绿。

**行动表**：

1. `test/views-settings.test.mjs`（447）→ `test/views-settings-forms.test.mjs` ← T-DSK7 四段面 ∕ T-DSK8 语言控件 ∕ T-DSK7 两形表单 ∕ T-DSK10 出口（:20-242 ≈235）。主档 ≈224（词表重刷 ∕ 两读 ∕ T-DSK31 六例）。
2. `test/views-question.test.mjs`（443）→ `test/views-question-wiring.test.mjs` ← U124 出站接线 + U210 交互（:185-388 ≈205）。主档 ≈239。
3. `test/store.test.mjs`（354）→ `test/store-tabs.test.mjs` ← U32 ∕ U56；`test/store-queue.test.mjs` ← U117（排队镜面）。主档 ≈250。
4. `test/views-tabbar-close.test.mjs`（317）→ `test/views-tabbar-close-page.test.mjs` ← U120 页随动五例。主档 ≈196。
5. `test/views-chrome-vocab.test.mjs`（369）→ `test/vocab-harness.mjs`（零用例夹具档：`walk` ∕ `stripComments` ∕ 哨兵词键表 ∕ 面夹具 :28-191 ≈165——沿 `agent-host-harness.mjs` 先例）。主档 ≈205。
6. `test/host-floor.test.mjs`（363）→ `test/host-floor-lists.test.mjs` ← U74 ∕ U76 ∕ U77 ∕ U95（白名单 ∕ 通道 ∕ 臂清单四条锁）。主档 ≈173。
7. `test/views-activity.test.mjs`（390）→ `test/views-activity-blocks.test.mjs` ← U168 ∕ U169（核件族 + 停止出口）。主档 ≈252。
8. `test/agent-host.test.mjs`（489）→ `test/agent-host-lifecycle.test.mjs` ← U86 ∕ U178 ∕ U191 ∕ U192 ∕ U224 ∕ U225（回合执行 ∕ 路由 ∕ 挂起窗 ∕ 生命周期六例 ≈231）。主档 ≈258。（原「下轮迁两例」= 守 500 硬限的最小案——本批按 ≤300 全拆，为其超集。）
9. `test/session-contract.test.mjs`（331）→ `test/session-contract-channels.test.mjs` ← U37 ∕ U57 ∕ U180（端壳通道契约族）。主档 ≈202。
10. `test/events-reduce.test.mjs`（464）→ `test/events-reduce-slices.test.mjs` ← T-DSK29 ∕ #459 ∕ U193 ∕ U204 ∕ U220（读数与切片归约五例）。主档 ≈265。
11. `test/views-locks.test.mjs`（411）→ `test/views-locks-values.test.mjs` ← U152 ∕ U174 ∕ U182（值落点锁族）；U52（零回归 ∕ 导出锁）留主档 ≈189。

**随拆收正**：`test/files.mjs` ∕ `test/run.mjs` 清单随动（11 新档入册；`vocab-harness.mjs` 走「共享助手（非清单档）」惯例）；用例断言逐字不改（夹具 import 面按新档重指）；R1 随动过的扫描靶在新档延续。

**禁止范围**：改断言值 ∕ 增删用例 · 触产品码（R1 面零再动）· 跨树。

**验收**：桌面套件全绿且用例数 = 前值（263）· 逐档 ≤300 · files.mjs 两向自检绿 · doc-check 零净增。

### 2.4 轮 3 · 核件族（5 原档 → 4 新档）

**目标**：5 原档拆分；各 ≤300（核件体系内全落 300 内）；三套件全绿（核 772 ∕ CLI 889 ∕ VSC 1052）。

**行动表**：

1. `thincoder-core/agent-tools/subagent-actions.mjs`（498/499）→ `thincoder-core/agent-tools/subagent-actions-query.mjs` ← 查询面（`touchedSummary` ∕ `shortTouchedPath` ∕ `statusFields` ∕ `executeStatusAction` ∕ `recentTurnLines` ∕ `queuedPositionOf` ∕ `clampRecent` ∕ `executeObserveAction` :50-284 ≈235——**含「留痕文本构造」**）。原档 re-export 两执行器（action 执行器 import 面零改）；主档 ≈264。**#413 = 「先拆后改」**——本拆即其前置。
2. `thincoder-core/agent/dispatch.mjs`（498/499）→ `dispatch-gates.mjs` ← 四谓词 + `logToolError` + `noteExecutedMutation`（:27-131 ≈105）；`dispatch-run.mjs` ← 单条执行体（`runOne` → `runPreparedItem`，:327-475 ≈150）。`executeToolCalls` 签名 ∕ 缝零改；主档 ≈245。
3. `thincoder-core/session-slots-manifest.mjs`（421）→ `session-slot-claims.mjs` ← 认领面族（`staleClaims` ∕ owner 三件 ∕ `cleanDeadOwners` ∕ `ensureActive` ∕ `allocateFresh` ∕ `claimSlot` ∕ `_releaseStats` ∕ `releaseClaimsAll` ∕ `activeSlot` :211-421 ≈205）。原档 re-export（导入面零改）；主档 ≈216。**#484 消解**（`core-hygiene.test.mjs:72` 注册句的顺延项落形）。
4. `thincoder-cli/test/portability-classification.test.mjs`（407）→ `thincoder-cli/test/portability-classification-declaration.test.mjs` ← T-26 ∕ T-27 ∕ T-28 ∕ T-29 ∕ T-30 ∕ T-31 ∕ T-33（F9 辅助面 + 声明面 + 段匹配面 :238-407 ≈170）→ 主档 ≈237。
5. `thincoder-vscode/test/portability-vsc-classification.test.mjs`（388）→ `thincoder-vscode/test/portability-vsc-classification-declaration.test.mjs` ← T-V22 ∕ T-V23 ∕ T-V24 ∕ T-V25 ∕ T-V26 ∕ T-V27（:255-388 ≈134）→ 主档 ≈254。夹具随迁（拆档 = 复制脚手架先例）。

**边界说明**：本轮跨「核 + CLI ∕ VSC 测试树」——两 portability 用例档 = 核机制对位面，随核件族同轮（不计跨树混装）。

**禁止范围**：分类器 ∕ 门禁判据语义零改 · 断言零改 · 不触两端 src。

**验收**：核 772 ∕ CLI 889 ∕ VSC 1052 三套全绿（用例数不降）· 各档 ≤300 · doc-check 零净增。

### 2.5 轮 4 · CLI（1 原档 + 1 随动）

**目标**：`bin/thincoder.mjs`（499）拆出命令分发表；bin ≤300；CLI 套件 889 绿。

**行动表**：

1. `bin/thincoder.mjs`（499）→ `src/command-table.mjs` ← 分发骨架 + 九薄命令族（memory ∕ sync ∕ distill ∕ reindex ∕ completion ∕ upgrade ∕ session ∕ ledger）+ help ∕ version（≈175）；`src/command-interactive.mjs` ← 交互长驻三命令（chat ∕ tui ∕ acp）出档为函数（≈185）。bin 留 bootstrap（imports ∕ argv ∕ USAGE ∕ fatal ∕ 两 helper + 分发调用）≈180。依赖经 ctx 注入（先例 = `turn-face.mjs` 出档）。

**随拆收正（A4 耦合义务 · 单源 = `docs/cli/design/CLI-ENTRY.md` §4）**：`thincoder-cli/test/memory-sweep-cli.test.mjs` MS-1 源码读取面随分发落点改指新档（`case "memory"` 等断言 token 逐字保持）；MS-2 ∕ MS-3 零改。

**禁止范围**：命令行为 ∕ USAGE 文本 ∕ 旗标语义零改；CLI-DEBT ∕ CLI-ENTRY 文档描述句 = 归回填批。

**验收**：CLI 套件 889 绿（MS-1 改面后）· bin 与新档 ≤300 · doc-check 零净增。

### 2.6 通用验收判据（无行为改六条 —— 各轮入口口径）

① 对外缝零改 = 既有导出名 ∕ 调用点 ∕ 消费面 import 行逐字不变（re-export 承接）；② 纯结构搬移 = 逐字搬迁（注释随迁）· 零改名 · 零新分支 · 零顺手优化；③ 用例零改 = 既有断言零改（例外 = 点名允许更新的结构锚靶——§2.2 U174 ∕ U182 ∕ U95、§2.5 MS-1，逐处列名）；④ 协议面零改（IPC ∕ 事件通道判别式集不变）；⑤ 全绿 = 各树 `npm test` exit 0 且用例数不降（**基线读数：核 772 ∕ CLI 889 ∕ VSC 1052 ∕ 桌面 263**——实施轮以亲跑读数为准）；⑥ 行数 = 拆分后各目标档 ≤300（核件 ≤500 体系内全落 300 内）。另：`node scripts/doc-check.mjs` 相对基线**零净增** · 零文档档改动（读数回填归 `docs/batches/2026-09-28-doc-backfill-sweep.md`）。

**验收对照（回指条目）**：#510 → R1 + R2 全档 ≤300（+ 无行为改六条）；#413 → R3-1（先拆后改前置）；#438 → R4-1（+ MS-1 随动）；#482 → R3-2；#484 → R3-3；#489 → R3-4 ∕ 5。

### 2.7 关键决策（择一定夺 · 逐条给由）

- **KD-S1 `styles.css`**：注册案「主题 ∕ 布局 ∕ 折叠」三段经核**不足以消解**（§10 AL 自注：主题段拆出后本档仍 ≈380 > 300）⇒ 本舱定**按面拆**：`theme.css` ∕ `rail.css`（含折叠断点段——折叠态 = 左列面语义内）∕ `chrome.css`，主档留栅格骨架；四档全 ≤300。
- **KD-S2 `mount-settings.mjs`**：注册案两族（信息行 + 读数供给）拆后仍 ≈380 ⇒ 补拆**出口族**一档（三新档），达 ≤300；接线沿 `mount-onboarding.mjs` 注入先例（同构已知可行）。
- **KD-S3 `i18n.mjs`**：注册方向「词族按视图面拆第二档」→ 既有 `i18n-views.mjs` 加挂视图面族（≈70 键）；设置 ∕ 向导 ∕ 信息行族（68 键）新档 `i18n-settings.mjs`；装配点（展开合并）与 `HOST_DICT` 单源不变。
- **KD-S4 `events.mjs`**：注册两径（subagent ∕ queue）拆后仍 ≈435 ⇒ 补 `readings-reduce` + `tool-reduce` + `events-shared`（低层下沉为叶，保零环）。
- **KD-S5 `agent-host.mjs`**：BL 案（turn-chain 提取）已由前批落；续拆定「路由 ∕ 生命周期」二分（`session-routes.mjs` ∕ `session-lifecycle.mjs`）。
- **KD-S6 `dispatch.mjs`**：设计档无预拆案（仅「零改硬要求」+ 主动审视）⇒ 本舱定二分：门面谓词与记账（gates）∕ 单条执行体（run）；`executeToolCalls` 对外缝零改。
- **KD-S7 `subagent-actions.mjs`**：三候选（查询面 ∕ escalate 段 ∕ observe 单迁）取**查询面外提**（含留痕文本构造；拆后 ≈264 落 300 内）——另两案单拆不足 300 线。
- **KD-S8 测试档通则**：用例组外提 + 夹具随迁（复制脚手架先例）；单例档（`views-chrome-vocab`）夹具外提为 `vocab-harness.mjs`（零用例档）。
- **KD-S9 轮序**：R1 → R2 串行；R3 ∕ R4 并行独立。

### 2.8 表外发现与上抛（只报 · 不当场改）

1. **§4.1 读数漂移**（登记值 ≠ 现盘 `wc -l`）：`mount-settings` 426 ⇒ **499/500** · `styles.css` 466 ⇒ 498 · `events.mjs` ≈466 ⇒ 497 · `i18n.mjs` 470 ⇒ 489 · `chat.css` ≈310 ⇒ 479 · `views/chat` 341 ⇒ 354 · `sessions` 301 ⇒ 304 · `settings-sections` ≈312 ⇒ 356 · `core.css` ≈350 ⇒ 345 · `store` 333 ⇒ 328 · `agent-host` ≈330 ⇒ 374；测试面 `views-question` 364 ⇒ 443 · `store.test` 339 ⇒ 354 · `views-chrome-vocab` 320 ⇒ 369 · `host-floor` 313 ⇒ 363 · `agent-host.test` 338 ⇒ 489 · `events-reduce` 312 ⇒ 464 · `session-contract` 319 ⇒ 331 · `views-locks` ≈320 ⇒ 411 · `views-activity` 339 ⇒ 390。⇒ 回填归另批（本批 §2 已按现盘用值）。
2. **范围补全说明**（§1.1 未列举、在册越层段已登记，本批收编）：`i18n.mjs` · `chat.css` · `views/chat.mjs` · `views/sessions.mjs` · `views/activity.mjs`（触发「超线则执行」已到）+ 测试档 `session-contract` / `events-reduce` / `views-locks`。
3. **未在册越层档**（现盘 >300 且无登记行——本批只报）：测试面 `views-chat.test`（**451**）· `views-chat-frame.test`（**417**）· `views-approval.test`（**398**）· `views-head.test`（**355**）· `views-chrome.test`（**352**）· `views-attach.test`（**342**）· `views-statusline.test`（**328**）· `fake-dom.mjs`（**311**）——建议下一拆档批收编（登记面先行）。
4. **#413 预案口径差**：spawn ∕ 台账述「留痕文本构造下沉零依赖叶」；设计档实文 =「`executeObserveAction` 迁出零依赖叶」（`docs/core/design/TURN-CAP-CONTINUE.md` §3.1 超限缓冲）+ 查询面案（`docs/core/design/CORE-UNIFICATION.md` §2.13 行 5）。本舱取并集（查询面含留痕构造）——口径差登记。
5. **注册句滞后**：`i18n-views.mjs` ∕ `chat-chrome.mjs` ∕ `queue.mjs` ∕ `composer-send.mjs` 等「（拟新增）」句中档案**已落**——注册措辞随回填批收正。
6. **行数口径**：`wc -l` 与读取器行数在末行无换行符时差 1（`subagent-actions` ∕ `dispatch` 498/499 · `mount-settings` 499/500）——各轮以 `wc -l` 为通报口径、读取器值另注。
7. **恰线 / 贴线登记**：`test/settings.test.mjs` **300** 恰线（≤300 合规）· `views-tabbar.test` 297 · `app.mjs` 299——未越，零动作。

（下接 §3 评审。）

### 2.9 修正轮 1（2026-09-28 · 承评审轮 1 —— 11 条全收）

**本块口径**：§2 append 修正面——逐号给收正后的生效文本；与原行位冲突处**以本块为准**（引用行号 = 收正前 §2 行位）。除 11 条外 §2 零正文语义变更；零设计档改动（`PROJECT.md` ∕ `CLI-DEBT.md` 的收正归回填批——逐处判据见 #11 落差点名单）。行位 = 本席 2026-09-28 实读（评审表个别引读差 1——按实读核）。

**【#1 · 🔴 两支 CSS 链序 ∥ 不变量相抵——以 `:68` 不变量为硬判据收正】**（收正 `:52` ∕ `:61` ∕ `:68` ∕ `:70` ∕ `:75`）

- **择「重切」（依据：重排不可行）**：两支保留面均跨拆出段两侧——`styles.css` 保留 `:1-4` + `:70-147`（在 `theme` ∕ `rail` ∕ `chrome` 之前）× `:481-498`（在 `rail` ∕ `chrome` 之后）；
  `chat.css` 保留 `:1-204`（在 `chat-cards` 之前）× `:332-387`（在 `chat-cards` ∥ `chat-fixes` 之间）。单档于链序只占一个位置 ⇒ 任何重排必使「保留段 vs 拆出段」之一相抵 ⇒ 重切 = **保留段连续化**（主档只留首端连续段；其余保留段另拆一片——不并入 `chrome.css` ∕ `chat-fixes.css`：非本族内容不混装面名档）。
- **收正后拆点（`§2.2` 行动表 1 ∕ 10 条按此为准）**：
  - `renderer/styles.css`（498）→ `theme.css` ← `:5-69` · `rail.css` ← `:148-355` · `chrome.css` ← `:357-480` · **`renderer/skin.css`（另拆一片）← `:481-498`**（滚动条皮肤 + 交互态组——D24 全局尾段）；主档留 `:1-4` + `:70-147` ≈ **82**。
  - `renderer/chat.css`（479）→ `chat-cards.css` ← `:205-331` · **`renderer/chat-composer.css`（另拆一片）← `:332-387`**（输入区面 + 交互态组）· `chat-fixes.css` ← `:388-479`；主档留 `:1-204` = **204**。
  - `renderer/core.css`（345）→ `core-blocks.css` ← `:200-345`；**入链位置 = 紧接 `core.css` 之后**（主档 ① `:1-199` 在前、②③④ 段随后——与主档 ①②③④ 原序一致）。
  - 拆后各档（≤300）：`styles` 支 ≈65 ∕ ≈82 ∕ 208 ∕ 124 ∕ ≈18 · `chat` 支 204 ∕ 127 ∕ ≈56 ∕ 92 · `core` 支 199 ∕ 146。
- **收正后 `renderer/index.html` 链接序（`:68` 生效文本）**：`theme.css → styles.css → rail.css → chrome.css → skin.css → chat.css → chat-cards.css → chat-composer.css → chat-fixes.css → core.css → core-blocks.css → pool.css → settings.css`。
  序保核验：`chat` ∕ `core` 两支逐段全等；`styles` 支唯 `:1-4` 档头注释位次前移（零级联力——按级联面判序保）。
- **R1 验收补判据（`:75` 追加）= 「级联序中性」**（取 ① 同特异度跨档冲突查法，以**序保核验**实现）：三支各按入链序逐档拼接，段序 = 原档逐段序（拆点表逐段核：`styles` 五段 ∕ `chat` 四段 ∕ `core` 两段）；序保 ⇒ 同特异度跨档相对序不变 ⇒ 级联判定不变。真机 `getComputedStyle` 抽查不取（离线可产面优先；序保为更强判据）。
- **随动随正**：`:70` 扫描靶集合按新住档增补（`views-locks` U174 ∕ U182 靶含 `skin.css` ∕ `chat-composer.css`）；`:71` 两新 CSS 入产物（`check-dist` ∕ 打包清单）。
- **计数随正**：R1 新档 22 → 21（#3）→ **23**（+2）；`§2.1` R1 行 ∕ `:44` 总表 ∕ `§2.2` 标题 ∕ `:48` 目标行同拍（对照见文末）。

**【#2 · 🟡 §2.8-3 改述】**（`:155` 整条替换）：

> 3. **在册未触碰档**（八档——`PROJECT.md` §4.1 越层段「测试面越 300 在册」行〔本席实读 `:230`〕已列；各带预案，消解窗口 = 各自下次被触碰的批）：
> 测试面 `views-chat.test`（**451**）· `views-chat-frame.test`（**417**）· `views-approval.test`（**398**）· `views-head.test`（**355**）· `views-chrome.test`（**352**）· `views-attach.test`（**342**）· `views-statusline.test`（**328**）· `fake-dom.mjs`（**311** · 共享助手）
> ——**本批未触碰 ⇒ 未入射程**（只报；本批射程 = §2.0 范围口径）；预案逐字承在册行「各档用例面拆分〔档名实施批定〕」。

（删「无登记行 ∕ 登记面先行」表述；八档读数经实读与在册行逐字同值。）

**【#3 · 🟡 R1-5 补标「（既有档）」】**（`:56`）：该条 `renderer/subagent-reduce.mjs` 补标「**（既有档** · 实读 **137** · `PROJECT.md:225` 记「（已落）」**）**← 本批**加挂** `ev:activity` 四形归约（非新建；加挂后以实施轮实读为准）」；同条 `queue.mjs`（既有档）标法不变。R1 新档计数 22 → 21（与 #1 合并 ⇒ 23）。

**【#4 · 🟡 R3 行新档计数】**（`:41` R3 行 · `:44` 总表）：R3 新档 4 → **6**（`§2.4` 实列六档：`subagent-actions-query.mjs` ∕ `dispatch-gates.mjs` ∕ `dispatch-run.mjs` ∕ `session-slot-claims.mjs` ∕ `portability-classification-declaration.test.mjs` ∕ `portability-vsc-classification-declaration.test.mjs`）；总表「原档 30 · 新档 40」→「原档 30 · 新档 **43**」（= 23 + 12 + 6 + 2）。

**【#5 · 🟡 R1-11 命名收正 + §2.8-5 逐档坐实】**（`:62` ∕ `:157`；§2.7 增 KD-S10）

- **取舍 = 保留 `renderer/views/chat-frame.mjs`**（不沿用注册名 `chat-chrome.mjs`）——给由：注册名已由「对齐第三批」批落档（实读 `renderer/views/chat-chrome.mjs` = **297**——帧尾**态刷**面：`syncChrome` + 五尾组 + 插点锚 + 置焦）；
  本档所拆 = 帧尾**步骤机**面（尾段挂载 ∕ 锚同刷 ∕ 就地更新 ∕ 头动作 ∕ `settleFrame`）——两族相异；且既有档 297 + 本族 ≈79 > 300 不可加挂 ⇒ 新建 `chat-frame.mjs`（依赖向 `chat.mjs` → `chat-frame.mjs` → `chat-chrome.mjs`，无环）；R1-11 其余不变。
- **§2.7 增条 KD-S10（R1-11 命名）**：见上；注册句收正（`PROJECT.md:404` ∕ `:458`「拟新增 · ≈60」→ 已落 + 名称坐实）归回填批。
- **§2.8-5 逐档坐实**（实读 2026-09-28）：`chat-chrome.mjs` **297** ∕ `i18n-views.mjs` **68** ∕ `queue.mjs` **41** ∕ `composer-send.mjs` **70**——四档均已落（§2.8-5 原判成立）；
  活面残留「（拟新增）」点 = `:404` ∕ `:458`（chat-chrome）· `:175` ∕ `:468`（i18n-views）· `:401` ∕ `:176`（queue）· `:252` ∕ `:402`（composer-send）——收正归回填批（changelog 记录面同形句不改——冻结纪律）。

**【#6 · 🔵 §2.6 ③ 例外补第三处】**（`:135`）：③ 例外清单收正 = `§2.2` U174 ∕ U182 ∕ U95 ∕ **`views-chrome-vocab` 零 CJK 名单随动**、`§2.5` MS-1（= 随拆收正逐处所列，逐处列名）。

**【#7 · 🔵 「≤15 且不跨树」单源】**（`:33` 并入例外；`:113` 降为理由陈述）：`:33` 生效文本 = 「每轮文件 ≤15 且不跨树（**例外**：R3 随轮两 portability 用工档——核机制对位面，不计跨树混装，§2.4）——口径 = 行动表原档数 ≤15（新档 = 拆分产物、随动档另列，不计入）」。

**【#8 · 🔵 R4-1 计数】**（`:125`）：「九薄命令族」→「**八薄命令族**」（与名单逐字对齐；实读 `bin/thincoder.mjs` `case` 族 = 八薄〔memory ∕ sync ∕ distill ∕ reindex ∕ completion ∕ upgrade ∕ session ∕ ledger〕+ 三交互〔chat ∕ tui ∕ acp〕+ help ∕ version）。

**【#9 · 🔵 §2.8-1 标注】**（`:153`）：整条加注「**已随回填轮（2026-09-28）收正**」——`PROJECT.md` §4.1 现读与所列「⇒ 现盘」值逐条同值（抽查：498 styles ∕ 479 chat ∕ 497 events ∕ 489 i18n ∕ 328 store ∕ 345 core ∕ 304 views/sessions ∕ 356 settings-sections ∕ 322 mount-composer + 测试面十一档同值）；本项留作历史、无待办；「本批 §2 按现盘用值」句不动。

**【#10 · 🔵 R2-1 读数】**（`:83`）：`views-settings.test.mjs`（447）→（**446**）（实读 `wc -l` = 446；与 `PROJECT.md:210` 值列同源）。

**【#11 · 🟡 §2.0 附——随拆落差点名单】**（承接口径 `:30` 的逐处判据；行位 = 实读；收正执行 = 回填批）

- **A. 越层段 ∕ 值列行（`PROJECT.md`）**：
  - R1 十三档：`styles.css`（值列 `:166` · 越层 `:224`）· `chat.css`（`:167` · `:226`）· `events.mjs`（`:170` · `:225`）· `i18n.mjs`（`:175` · `:226`）· `store.mjs`（`:176` · `:227`）· `views/chat.mjs`（`:177` · `:227`）· `views/settings-sections.mjs`（`:187` · `:227`）· `core.css`（`:206` · `:227`）· `views/sessions.mjs`（`:182` · `:229`）· `views/activity.mjs`（`:185` · `:228`）· `mount-composer.mjs`（`:194` · `:228`）· `mount-settings.mjs`（`:192` · 在册例外 `:222`）· `agent-host.mjs`（`:147` · `:229` · §10 BL）；随动 = `index.html`（`:165`）。
  - R2 十一档：`:210` 值列 + `:230` 测试面在册行（受触档重锚 + 新档入列）。
  - R3 五档（核面）：`docs/core/design/CORE-UNIFICATION.md` §2.8.1 三档行 + §2.13（#413）· `docs/core/design/SESSION.md` §6.23（#484 顺延句）· `thincoder-core/test/core-hygiene.test.mjs:72`（「顺延」注句）· `docs/core/design/PORTABILITY.md` §5 两行（`:194` ∕ `:198`）。
  - R4：见 D。
- **B. KD 实据行（`PROJECT.md`——拆后住档 ∕ 行号漂移，逐处重锚）**：KD-16（`:53`）`store.mjs:113-119`（R1-8 → `tabs.mjs`）· `events.mjs:274-281`（R1-5 → 外迁）——两处失效 ∕ 重锚（同条 `mount-sessions.mjs` ∕ `app.mjs` 坐标本批不触）；
  KD-23（`:61`）`agent-host.mjs:186-205` ∕ `:212-228`（R1-6）；KD-24（`:62`）`chat.css:33-37`（R1-10）；KD-40（`:79`）`agent-host.mjs:320-321` ∕ `:335-336`（R1-6）；§2.2 注（`:94` ∕ `:106`）`agent-host.mjs` 坐标族（R1-6）；§4.1 随动注（`:270`）`views/sessions.mjs:18` ∕ `:237`（R1-12）。
- **C. §4.2 行（各批表内本批受触档既有行）**：实读点名 = `:400`（events 续期预案）· `:401` ∕ `:176`（store ∕ queue）· `:402` ∕ `:252`（mount-composer ∕ composer-send）· `:404` ∕ `:458`（views/chat——chat-chrome 预案）· `:452`（subagent-reduce 读数）· `:464`（settings-sections 预案——本批定名 `settings-agent.mjs`）· `:465`（mount-settings）· `:469`（chat ∕ core ∕ styles 三行）· `:483` ∕ `:484` ∕ `:486`（timer-wake 表三行）；
  须收正者 = 前向句（预案 ∕ 「拟新增」 ∕ 「本批执行」）+ 受触档行；全量逐行 = 回填批按本类别巡检。
- **D. `CLI-DEBT.md`（R4）**：`:35`（A4 行——499 · 触发已到）⇒ R4 落成后 §1 行维护①（`:22`——被触碰批设计轮刷新读数 ∕ 触发状态）+ ②（`:23`——拆分兑现 ⇒ 行移 §4「已消解」）义务悬空 ⇒ 回填批执行（本批零设计档改动）；`:35` 内「耦合注」（MS-1 同批改）随 R4 执行（`§2.5` `:127` 已列）。
- **E. 表外（只报）**：`thincoder-core/test/core-hygiene.test.mjs:72` 注句（#484「顺延」——R3-3 落拆后 stale）· `PORTABILITY.md:188` 与 §1.1 所引「预案源」不符（实读 `:188` = D18 行——口径差登记）。

**计数收正对照（本块 #1 ∕ #3 ∕ #4）**：`§2.1` R1 行 ∕ `§2.2` 标题 ∕ `:48`：22 新档 ⇒ **23**（−1 `subagent-reduce` 既有 + 2 `skin.css` ∕ `chat-composer.css`）；`§2.1` R3 行：4 ⇒ **6**；`:44` 总表：新档 40 ⇒ **43**。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

发现表（设计评审 · 拆档批 §2 四轮任务书 · 逐字）：

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Acceptance ∕ Clarity | 🔴 | R1 随拆收正自述「各拆出段与剩余段相对序保持」（`thincoder/docs/batches/2026-09-28-split-batch.md:68`），但所给链接序与之相抵：① `styles.css` 主档保留 :482-498（滚动条皮肤 ∕ 交互态组——`:52`），而 `rail.css`（:148-355）∕`chrome.css`（:357-480）排其后 ⇒ 该尾段与被拆两段的文档序对调；② `chat.css` 主档保留 :332-387（`:61`，479−127−92=260），而 `chat-cards.css`（:205-331）排 `chat.css` 之后 ⇒ 卡族与其后保留段对调。级联按文档序（跨档 = 链接序）定胜负，等差特异性冲突下判定翻转；R1 验收（`:75`）与 §2.6 六条（`:135`）逐条不覆盖级联序 ⇒ 「零行为改」在这两支 CSS 上无判据面。③ 同处未列第三支 CSS 拆分 `core-blocks.css` 的入链位置（`:53`）。 | 两择一：① 保序改法——`chat-cards.css` 排 `chat.css` 前 ∥ `styles.css` 尾段（:481-498）另拆一片排 `chrome.css` 之后，或把拆分切点改到保留段之后；② 增「级联序中性」判据（同特异度跨档冲突逐处核验 ∥ 真机 `getComputedStyle` 抽查）并写入 R1 验收；③ 补 `core-blocks.css` 入链位置（建议紧接 `core.css` 之后——与主档 ①②③④ 原序一致）。 |
| 2 | Document ownership | 🟡 | `thincoder/docs/batches/2026-09-28-split-batch.md:155` 将 `views-chat.test`(451) ∕ `views-chat-frame.test`(417) ∕ `views-approval.test`(398) ∕ `views-head.test`(355) ∕ `views-chrome.test`(352) ∕ `views-attach.test`(342) ∕ `views-statusline.test`(328) ∕ `fake-dom.mjs`(311) 记作「现盘 >300 且无登记行」；`thincoder/docs/desktop/design/PROJECT.md:229` 越层段已把同八档列为「测试面越 300 **在册**（各带预案 + 消解窗口 = 各自下次被触碰的批）」——同一事实两处相反，「登记面先行」建议前提不成立。 | 改述为「在册但消解窗口未到（未在本批射程）」；若指「无个案拆分预案」，与 `PROJECT.md:229`「预案 = 各档用例面拆分〔档名实施批定〕」逐字对齐后再表述。 |
| 3 | Clarity | 🟡 | R1-5（`:56`）把 `renderer/subagent-reduce.mjs` 与新档并列（计入「22 新档」），但同批 KD-S4（`:144`）自述「注册两径（subagent ∕ queue）**拆后**仍 ≈435」、`PROJECT.md:224` 记该档「（已落）」、`:451` 记其现读 **138 ⇒ ≈142**；同一行动表对 `queue.mjs` 已标「（既有档）」而该档未标 ⇒ 两档标记口径不一，R1 新档数随之失准（21）。 | 该档补标「（既有档）」（或改用新档名并给由），同笔收正「22 新档」与 `:44` 总表「新档 40」（与 #4 合并核算）。 |
| 4 | Clarity | 🟡 | `:41`（§2.1 表 R3 行「5 原档 → **4** 新档」）与 `:107`-`:111`（§2.4 实列 6 新档：`subagent-actions-query.mjs` ∕ `dispatch-gates.mjs` ∕ `dispatch-run.mjs` ∕ `session-slot-claims.mjs` ∕ `portability-classification-declaration.test.mjs` ∕ `portability-vsc-classification-declaration.test.mjs`）不符——行动表同口径下（R2 行「11 + 1 夹具档」即含用例新档）应为 6；`:44` 总表「新档 40」同源受影响。 | R3 行收正 **6**（或表下注明「4 = 核内新档」的计数口径），总表随正。 |
| 5 | Doc ownership ∕ Clarity | 🟡 | R1-11（`:62`）新档名 `renderer/views/chat-frame.mjs` 与在册预案名 `thincoder-desktop/renderer/views/chat-chrome.mjs`（`PROJECT.md:403` ∕ `:457`「帧尾态刷拆…（拟新增 · ≈60）」）同族异名、无给由；同批 `:157`（§2.8-5）又称 `chat-chrome.mjs` 等「（拟新增）」句中档案**已落**——「已落」与「R1-11 新建」两说必有一讹。 | 择一收正：或沿用注册名 `chat-chrome.mjs`（注册句零改），或保留 `chat-frame.mjs` 并在 §2.7 补一条 KD（给由 + 注册句改述）；§2.8-5「已落」名单逐档与 `PROJECT.md:403` ∕ `:457` 的「（拟新增）」对齐（孰真孰假逐处坐实）。 |
| 6 | Acceptance | 🔵 | §2.6 ③（`:135`）声称例外「逐处列名」= U174 ∕ U182 ∕ U95 ∕ MS-1，但 `:70` 的第三处随动（`test/views-chrome-vocab.test.mjs` 零 CJK 名单按需随动）未入列——「既有断言零改」判据留下未列名例外面。 | ③ 补入该随动（或 ③ 改为「例外 = §2.2 ∕ §2.5 随拆收正逐处所列」的单一指向，防漏列）。 |
| 7 | Methodology | 🔵 | `:33` 规则「每轮文件 ≤15 且**不跨树**」与 `:113`（§2.4 边界说明：R3 跨核 + CLI ∕ VSC 三树，「不计跨树混装」）口径不一；§2.0 未收该例外。 | 把 §2.4 例外并入 `:33` 规则行（单源），或注明「不跨树」限定的实义（同批多树共享面 ∕ 树数），使轮规则与轮实践一处成立。 |
| 8 | Numbers | 🔵 | `:125`（R4-1）「九薄命令族」括注实列八名（memory ∕ sync ∕ distill ∕ reindex ∕ completion ∕ upgrade ∕ session ∕ ledger）——`chat ∕ tui ∕ acp` 另归交互档、help ∕ version 另列，计数与名单不符。 | 补列第 9 名，或改「八薄命令族」（与名单逐字对齐）。 |
| 9 | Numbers | 🔵 | `:153`（§2.8-1）自述「§4.1 读数漂移（登记值 ≠ 现盘）」并逐档给「⇒ 现盘」值；但 `PROJECT.md` 现读与所列现盘值逐条同值（`:165` 498 ∕ `:166` 479 ∕ `:169` 497 ∕ `:174` 489 ∕ `:175` 328 ∕ `:176` 354 ∕ `:181` 304 ∕ `:186` 356 ∕ `:191` 499 ∕ `:205` 345 ∕ `:146` 374）⇒ 该项漂移面已消（§4.1 已按盘重锚），清单留在活面易被当活工单。 | 标注「已随回填轮收正」或删列；若保留，改述为「§4.2 历史行 as-of 值 ≠ 现盘」并点名具体行。 |
| 10 | Numbers | 🔵 | `:83`（R2-1）`views-settings.test.mjs`「（447）」与 `PROJECT.md:209` 用例模块行现读 **446** 差 1（其余十档与 §4.1 逐字同值），且未按 `:33` 的 `N/N+1` 口径并列（另三档 498/499 ∕ 499/500 已并列）。 | 按盘收正，或补 `wc -l` ∕ 内容行数口径注，与 §4.1 值列同源。 |
| 11 | Coordination | 🟡 | 本轮拆档将使多处设计档坐标 ∕ 登记面与盘面分叉，`:30` 仅笼统声明「登记 ∕ 读数收正」承接口径：R1-8（`:59`）拆 `store.mjs` ⇒ `PROJECT.md:53`（KD-16 实据行）`store.mjs:113-119` 指向失效；R1-5（`:56`）移动 :189-300 ⇒ 同处 `events.mjs:274-281`（唯一写者坐标）需重锚；R4（`:119` 起）落成后 `thincoder/docs/cli/design/CLI-DEBT.md:35`（A4 行）与 `:22`-`:23` 行维护①（被触碰批设计轮刷新）∕②（拆分兑现移 §4）义务悬空。落差面宽于「读数回填」措辞（含 KD 实据坐标 ∕ §4.2 行）。 | 在 §2.0 附「随拆落差点名单」（逐档点：越层段行 ∕ KD 实据行 ∕ §4.2 行 ∕ CLI-DEBT A4 行与 §1 行维护义务），使承接面有逐处判据、防回填遗漏。 |

**计数**：🔴 1 · 🟡 5 · 🔵 5（共 11 条）

VERDICT: changes-required

### 轮次 2（评审子代理）

发现表（设计评审 · 拆档批 §2.9 修正块核销轮 · 逐字）：

口径：无项目标准档声明 · 无文档地图（Document ownership 维度按 Project Guide 降级判）；源档读数（`chat-chrome.mjs` 297 等）不在本次评审范围 ⇒ 标 unverified。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Numbers | 🟡 | §2.9 全块以「行位 = 本席 2026-09-28 实读」立据（`thincoder/docs/batches/2026-09-28-split-batch.md:165`），但与盘上现态系统性不符：`PROJECT.md` §4.1 一带行位少 **1**（`:230`〔`:184`〕↔ 实为 `thincoder/docs/desktop/design/PROJECT.md:231`；`:225`〔`:190`〕↔ `PROJECT.md:226`；`styles.css` 值列 `:166` ∕ 越层 `:224`〔`:215`〕↔ `PROJECT.md:167` ∕ `:225`；用例模块 `:210`〔`:216`〕↔ `PROJECT.md:211`；i18n 值列 `:175` ↔ `PROJECT.md:176`）；后段（§4.1 后段块 ∕ §4.2 各表）少 **5**（`:404` ∕ `:458`〔`:200`〕↔ `PROJECT.md:409` ∕ `:463`；`:401` ∕ `:176`〔`:200`〕↔ `PROJECT.md:406` ∕ `:177`；`:175` ∕ `:468`〔`:200`〕↔ `PROJECT.md:176` ∕ `:473`；`:252` ∕ `:402`〔`:200`〕↔ `PROJECT.md:257` ∕ `:407`；`:400` ∕ `:401` ∕ `:402` ∕ `:404` ∕ `:452` ∕ `:464` ∕ `:465` ∕ `:469`〔`:221`〕↔ `PROJECT.md:405` ∕ `:406` ∕ `:407` ∕ `:409` ∕ `:457` ∕ `:469` ∕ `:470` ∕ `:474`）。数值本体（498 ∕ 479 ∕ 497 ∕ 489 ∕ 328 ∕ 345 ∕ 304 ∕ 356 ∕ 322 与测试面诸档）与 `PROJECT.md` 逐条同值——仅行位漂。该块据此改写评审轮 1 的行位、且落差名单（`:215`-`:224`）以行位为定位键 ⇒ 按行位操作会错位。 | 落差名单逐处按**行内容**（档名 + 值 + 判据句）重锚，或整块加 as-of 口径注（行位 = 收正时实读，较盘面少 1 ∕ 5）；「本席实读」句随之限定。 |
| 2 | Consistency | 🟡 | #2 把 §2.8-3 整条替换为「在册未触碰档（八档…）」（`:184`-`:186`），但 §2.0 `:31` 的交叉引用仍写「**未在册**而现盘越 300 者不在本批射程——只报（§2.8-3）」——改后 §2.8-3 已不再列「无登记行」档（且其自述口径为「本批未触碰 ⇒ 未入射程」），指针分类名失效；评审轮 1 发现 2 的同一表述只清了 `:155` 一处（`:188`）。 | `:31` 末句与 `:184`-`:186` 分类逐字对齐（如「在册未触碰者…只报（§2.8-3）」）；若确存「未在册越 300」档，另点名列示。 |
| 3 | Acceptance | 🔵 | #1 的序保核验（`:178`）声明「三支各按入链序逐档拼接，段序 = 原档逐段序…`styles` 五段 ∕ `chat` 四段 ∕ `core` 两段」，但同块自述 `styles` 支 `:1-4` 位次前移（`:177`）——判据字面与该例外相抵；「零级联力」的前提（`:1-4` = 纯注释）取自盘外源档，本次范围不可核。 | 判据写成「三支按入链序拼接 ≡ 原档逐行（唯一例外 = `styles.css:1-4` 位次前移）」+ 补一条可核前提（`:1-4` 无选择器 ∕ 纯注释）——同一条判据既容例外又挡真掉行。 |
| 4 | Acceptance | 🔵 | `styles.css` 拆点逐段行数合计 497 ≠ 498：`:5-69`(65) + `:1-4`+`:70-147`(82) + `:148-355`(208) + `:357-480`(124) + `:481-498`(18)（`:172` ∕ `:175`）——`styles.css:356` 无归属（`chat` ∕ `core` 两支逐段全等：479 = 204+127+56+92；345 = 199+146）。 | 点名 `:356` 归属档（按内容归 `rail.css` 或 `chrome.css`），并把「逐行全归」写进验收判据。 |
| 5 | Clarity | 🔵 | #1 计数随正只覆盖 `§2.1` R1 行 ∕ `:44` 总表 ∕ §2.2 标题 ∕ `:48`（`:180` ∕ `:226`），未同拍 §2.7 **KD-S1**（`:141`）——该条仍写「`theme.css` ∕ `rail.css` ∕ `chrome.css`…主档留栅格骨架；**四档全 ≤300**」，重切后实为五档（另 `renderer/skin.css`，主档 ≈82）。 | KD-S1 同拍收正，或加「以 §2.9 #1 拆点为准」限定句。 |
| 6 | Consistency | 🔵 | #5 的「活面残留「（拟新增）」点」枚举（`:200`）只覆盖 §2.8-5 四档；抽查另见 `page-read.mjs` 同病——`PROJECT.md:458` 记其现行 **103**（已落），而 `PROJECT.md:405` 仍标「（拟新增 · ≈120）」；枚举句式易被读作全量。 | 枚举加限定（「§2.8-5 四档面；全量巡检 = `:221` 已列」），或把该点补入。 |
| 7 | Numbers | 🔵 | #3 插入的「实读 **137**」（`:190`）与 `PROJECT.md:457` 同档现行值 **138** 差 1（源档不在本次范围 ⇒ unverified）。 | 两值同源坐实，或按 `N/N+1` 口径并注。 |
| 8 | Annotation | 🔵 | §2.1 `:44` 随动测试面五处（`views-locks` ∕ `host-floor` ∕ `views-chrome-vocab` ∕ `files.mjs`+`run.mjs` ∕ `memory-sweep-cli`）在行动表中只有点名、无「现行 ⇒ 预期（结构不变 ∕ ≤±N）」注；#1 又把 `skin.css` ∕ `chat-composer.css` 追加进 `views-locks` U174 ∕ U182 扫描靶（`:179`）⇒ 该随动增量升格。 | 随动面按 §2.6 口径补一行（现行值 + 结构不变 ∕ ≤±N），至少笼盖 U174 ∕ U182 靶面扩面后那一档。 |

表外（只报 · 无严重度）：§1.1（`:13`）列 `session-slots-manifest.mjs` **366**，§2.4-3（`:109`）同档按 **421** 拆（`:211-421` ≈205）；§2.8-1 漂移清单（`:153`）只覆盖 `PROJECT.md` §4.1 桌面档 ⇒ 此差值未在册。

**计数**：🔴 0 · 🟡 2 · 🔵 6（共 8 条）

VERDICT: pass

## §4 用户批准（主 agent）

### 4.1 用户批准（父侧代签 · 2026-09-28 19:2x）
- **依据三条件齐备**：① 设计评审 pass（§3 · 复评轮 pass——🔴0）；② 实施轮 R3 ∕ R4 落地并逐条核验（§5 ∕ §5.7–5.10；父侧抽验 = 六新档在盘 ✓ + 三套件读数 772 ∕ 889 ∕ 1052 全绿 + `doc-check` 净增 0）；③ token 已签发（值为运行态、不落档——实施两舱同凭据）。
- 射程裁：**R1 ∕ R2（桌面树）按 §1.4 暂缓**（复起按届时盘面重锚）；本批交付 = R3（核件族）∥ R4（CLI bin 分发表）。

## §5 实施记录（eng-coder）

**状态行**：实施完成（R3 核件族 + R4 CLI 双轮（纯移动）——R3：12 档全 ≤300（最大 query 270）· 核 772 ∕ CLI 889 ∕ VSC 1052 全绿 · doc-check 零净增 · 审计 1 轮 ∕ 代码评审 1 轮 pass · fix round 1（+ 评审后注释收正）· 终态 clean（详见 5.6–5.10）；R4 详见 5.1–5.5）

### 5.1 交付摘要（R4 · CLI 拆档 · 纯移动）
- 逐档「原档 → 新档 + 实读」：
  - `bin/thincoder.mjs`（499）→ **177**（bootstrap：imports ∕ argv 包装门 ∕ VERSION ∕ USAGE ∕ handleFatal 崩溃钩 ∕ 测试门 ∕ 两 helper〔noKeyMessage ∕ exitSoon〕∕ 启动清理 ∕ 分发调用）。
  - → `src/command-table.mjs`（新 · **185**）← 分发骨架（原顶层 switch）+ 八薄命令族（memory ∕ sync ∕ distill ∕ reindex ∕ completion ∕ upgrade ∕ session ∕ ledger）+ help ∕ version。
  - → `src/command-interactive.mjs`（新 · **186**）← 交互长驻三命令 chat ∕ tui ∕ acp（出档为 `chatCommand` ∕ `tuiCommand` ∕ `acpCommand`）。
- 依赖经 ctx 注入（`usage` ∕ `version` ∕ `exitSoon` ∕ `noKeyMessage`——bin 装配面单点；先例 = `src/tui/turn-face.mjs` 出档）。
- 机械改（唯三，逐字之外）：case 块 → 函数体（`break` → `return`，5 处）· 相对 import 路径随住档改指（`../src/x` → `./x`；`../package.json` 同深度零改）· `USAGE` ∕ `VERSION` 消费改经 ctx。
- 保真核（多重集比对 `git show HEAD:thincoder-cli/bin/thincoder.mjs` vs 三档现文）：零丢行、零走样行；差额 = 全部预期变换项 + 三档头注 ∕ 函数脚手架 ∕ import 分列（499 → 548 行，+49）。
- 命令行为 ∕ USAGE 文本 ∕ 旗标语义零改（冒烟核：`--version` ∕ `-v` ∕ `--help` ∕ `nonsense` ∕ `completion {bash,zsh,fish}` ∕ `completion bogus` ∕ `memory list` ∕ `memory sweep` 互斥拒 ∕ `ledger` 无参 ∕ `chat` 无参 ∕ `session` 无参——假 HOME 沙箱逐项对形）。

### 5.2 决策透明表
| # | 处 | 决策 | 由 |
|---|---|---|---|
| 1 | 3 处额外「bin 源码读取面」测试 = `test/session-index-cli.test.mjs` AC-7 ∕ `test/make-agent-manifest-gate.test.mjs` AC-16 ∕ `test/wait-status-callsites.test.mjs` V6 | 随拆收正（只改读取靶 ∕ 表条目，断言 token 逐字保持） | 任务书 §2.5 随拆收正只列 MS-1；实核三处同为「读 bin 源码断言已移出 token」类——不改则验收①「889 全绿」不可达 ⇒ 上抛父侧，**父侧 2026-09-28 明准**（「按 MS-1 同法随拆收正……逐处入 §5 越域披露」）；§2.6③ 例外清单增列归父侧结算轮记 |
| 2 | `bin/thincoder.mjs` 原 :45 注释「不达下方 switch」→「不达下方命令分发」 | 随拆改指（注释指位收正） | switch 已外提 ⇒ 指位失实；零行为面 |
| 3 | `test/make-agent-manifest-gate.test.mjs` 头部注 :3 ∕ :6 + T28d 注 :157（`bin` → `src/command-interactive.mjs`） | 随拆改指（注释指位收正） | 同因（重估点已移居新档）——与 #1 同档同笔 |

### 5.3 越域披露（超任务书 §2.5 声明面的触碰）
- **测试档 3 处**（决策表 #1）：`test/session-index-cli.test.mjs`（AC-7 分发面 6 断言改读 `src/command-table.mjs`；USAGE 行 + `scheduleSessionIndexPass` + 动态 import 3 断言仍读 bin）· `test/make-agent-manifest-gate.test.mjs`（AC-16 读取靶改 `../src/command-interactive.mjs`）· `test/wait-status-callsites.test.mjs`（CALLSITES 表条目改 `src/command-interactive.mjs`）。**全部断言 token 逐字保持**（逐条对照 HEAD 版核）。
- **注释指位 2 处**（决策表 #2 ∕ #3，同属随拆改指）。零断言面 ∕ 零行为面。
- 无其它越域改动：本轮 CLI 面触碰 = 7 档（bin + 2 新档 + 4 测试档）；仓内其余 docs 改动 = 他批在途（非本轮）。

### 5.4 读数（实跑）
- `cd thincoder-cli && node test/run.mjs` → `ℹ tests 889 · pass 889 · fail 0 · skipped 0`（exit 0）。
- `node scripts/doc-check.mjs`（仓根）→ 与实施前基线**逐行一致**（悬空 56 ∕ 行宽 36 = 既有态，零净增；临时基线件已清）。
- `node scripts/check-syntax.mjs`（CLI 树 lint）→ `check-syntax: 226 file(s) OK`。
- 行数实读：**bin 177 ∕ command-table 185 ∕ command-interactive 186**（全 ≤300）。
- 单点复核：`memory-sweep-cli` ∕ `session-index-cli` ∕ `make-agent-manifest-gate` ∕ `wait-status-callsites` 四档改面后单跑全绿（exit 0）。

### 5.5 审计 ∕ 代码评审轮次与终态
- **内部背离审计（explore · 只读）· 轮 1**：findings = 1 条 PARTIAL（§5 未写入——本段落已闭合）+ 3 条非偏差记录（N1 文档面顺延归口 ∕ N2 表外档陈旧注 `test/setup-reminders.test.mjs:220`〔只报不改——该档不在 7 档面〕 ∕ N3 批准痕迹）；**代码交付面零背离**。终态 = **clean**。
- **代码评审（advisor · code）· 轮 1**：🔴 **0** · 🟡 3（①②`docs/cli/design/CLI-DEBT.md:35` ∕ `docs/cli/design/CLI-ENTRY.md:7 等` 文件面陈旧——设计明示归回填批；③ §5 待写——已闭合）· 🔵 2（§2.5 行现文「九薄命令族」vs §2.9 #8「八薄命令族」（以 §2.9 为准）；bin 头注命令枚举漏 4 名——既有、非本拆引入、本批零动作）。**VERDICT: pass**；无 must-fix ⇒ **fix round = 0**。
- 表外连通项（供父侧路由）：`thincoder-cli/AGENTS.md:51 ∕ :54` 模块图未收录两新档（未入 §2.9 #11 落差名单 A–E）——建议随回填批收正。
- 终态：**clean**（审计 1 轮 + 评审 1 轮收敛，无 stalled、无未闭合 fix）。

### 5.6 交付摘要（R3 · 核件族 · 5 原档 → 6 新档 · 纯移动）
- 逐档「原档 → 新档 + 实读（`wc -l`）」：
  - `thincoder-core/agent-tools/subagent-actions.mjs`（498/499）→ 主档 **252** ＋ `subagent-actions-query.mjs`（新 · **270**）← 查询面（`touchedSummary` ∕ `shortTouchedPath` ∕ `statusFields` ∕ `executeStatusAction` ∕ `recentTurnLines` ∕ `queuedPositionOf` ∕ `clampRecent` ∕ `executeObserveAction`——原档 :30-283 逐字搬迁）；主档 :37 re-export 两执行器（`subagent.mjs:32` 五名 import 面零改）。
  - `thincoder-core/agent/dispatch.mjs`（498/499）→ 主档 **241** ＋ `dispatch-gates.mjs`（新 · **125**：ERRORS_DIR ∕ `logToolError` ∕ 四谓词 ∕ `noteExecutedMutation`——原档 :25-130）＋ `dispatch-run.mjs`（新 · **167**：原 :327-475 `runOne` 闭包 → `export async function runPreparedItem(item, agent, depth, signal, callbacks)`——函数体逐字 + 去一级缩进）；`executeToolCalls` 签名 ∕ 导出面零改，两处调用点改指（:224 ∕ :234）。
  - `thincoder-core/session-slots-manifest.mjs`（421）→ 主档 **232** ＋ `session-slot-claims.mjs`（新 · **230**）← 认领面族（`staleClaims` ∕ owner 三件 ∕ `cleanDeadOwners` ∕ `ensureActive` ∕ `allocateFresh` ∕ `claimSlot` ∕ `_releaseStats` ∕ `releaseClaimsAll` ∕ `activeSlot`——原档 :211-220 ＋ :228-421）；主档 re-export 十名保既有 import 面（#484 顺延项落形）。
  - `thincoder-cli/test/portability-classification.test.mjs`（407）→ 主档 **220** ＋ `portability-classification-declaration.test.mjs`（新 · **237**）← T-26 ∕ T-27 ∕ T-28 ∕ T-29 ∕ T-30 ∕ T-31 ∕ T-33（原档 :234-407 用例组逐字 + 夹具随迁 · 复制脚手架）。
  - `thincoder-vscode/test/portability-vsc-classification.test.mjs`（388）→ 主档 **243** ＋ `portability-vsc-classification-declaration.test.mjs`（新 · **212**）← T-V22 ∕ T-V23 ∕ T-V24 ∕ T-V25 ∕ T-V26 ∕ T-V27（原档 :253-388 用例组逐字 + 夹具随迁）。
- 新档合计 6（§2.9 #4 口径）；本舱 12 档全 ≤300（硬判达标，最大 = query 270）。
- 机械改（逐字之外，全量清单）：`dispatch-gates.mjs` 六处 `export` 前缀（四谓词 ∕ logToolError ∕ noteExecutedMutation 原为模块私有）· `runPreparedItem` 形参代入 + 去一级缩进（原闭包自由变量 agent ∕ depth ∕ signal ∕ callbacks）· 主档两调用点改指 · 各档头注拆分注 + 两清册行收正 · 两主档测试档 import 行按未用名收窄 · 两主档删除孤儿 `logEventCount`（唯一消费者已迁出，副本随迁新档）。
- 纯行段提取由 node 脚本执行（零语义——保逐字），非人工转录；产物逐档实读回验（含 `git show HEAD:` 行段比对）。
- 缝核：`subagent.mjs:32` 五名 ∕ `executeToolCalls` 消费点（core ∕ CLI ∕ VSC 含两用例档）逐处解析通过 ∕ session 族 13 名（`session-slots.mjs:47-50` ∕ :56-59 两侧）逐名落位；`ensureActive` 保持私有（拆分前同态）；环 session-slots-manifest ↔ session-slot-claims 为函数声明 + 仅运行时调用（零顶层调用）。
- 本轮不做（明示）：文档读数回填 ∕ 注册句收正（归 doc-backfill-sweep 批）· 设计档坐标重锚（§2.9 #11-B/C/D 名单）· R4 CLI（并行舱，见 5.1–5.5）· R1 ∕ R2 桌面树（暂缓，见 §1.4）。

### 5.7 决策透明表（R3）
| # | 处 | 决策 | 由 |
|---|---|---|---|
| 1 | `thincoder-vscode/test/files.mjs`（原行动表未列） | 增登记 1 行 + 原行注追加迁出注 | VSC runner 显式清单 fail-closed（未登记 ⇒ `test/run.mjs` exit 1）——不登记则验收①不可达 |
| 2 | CLI ∕ VSC 两主档测试档 import 行 + 孤儿 `logEventCount` 删除 | 按搬出后未用名收窄 ∕ 删孤儿（副本已随迁新档） | 搬出即失去消费者；审计 F2 命中（双份定义 + 收窄后悬挂引用——零调用零行为面）——沿既有拆档先例 |
| 3 | `subagent-actions.mjs` ∕ `session-slots-manifest.mjs` 头注清册行收正 | 「内容 ∕ 归族」行同拍（迁出族标「已随 2026-09-28 拆分迁出——见下」） | 评审 🔵：拆分使清册失实（本拆所为 ⇒ 收正消 residue） |
| 4 | 拆点行位微差（实读） | 按设计「注释随迁」规则，status ∕ observe 的 docstring（原 :30-49）随函数迁出（§2.4-1 记 :50-284） | 设计范围系近似标位；docstring 不随迁则主档留悬空注释——按 §2.6② 规则从之 |

### 5.8 越域披露（超 §2.4 行动表声明面的触碰）
- **`thincoder-vscode/test/files.mjs`**（决策表 #1）：登记 1 行 + 原行注收正（追加「（T-V22–T-V27 组已迁下行新档——2026-09-28 拆分批 · R3）」）。
- **CLI ∕ VSC 两主档测试档**（决策表 #2）：import 行收窄 + 孤儿 helper 删除——**用例 ∕ 断言零改**（逐号在场：CLI 主档 12 例 + 新档 7 例；VSC 主档 9 例 + 新档 6 例）。
- **core 三主档头注**（决策表 #3）：拆分注 + 清册行收正——纯注释面。
- 无其它改动：本轮三树触碰 = 12 档（7 core + 4 用例档 + files.mjs 登记）；两端产品 src 零触；docs 面零改。

### 5.9 读数（实跑）
- `cd thincoder-core && node test/run.mjs` → `ℹ tests 772 · pass 772 · fail 0`（exit 0；与基线同值）。
- `cd thincoder-cli && node test/run.mjs` → `ℹ tests 889 · pass 889 · fail 0`（exit 0）。
- `cd thincoder-vscode && node test/run.mjs` → `ℹ tests 1052 · pass 1052 · fail 0`（exit 0）。
- `node scripts/doc-check.mjs --root .` → 悬空 **56**（基线 56——净增 **0**）· 行宽 **36**（同基线）；报告行零条涉及本舱改动档。
- 行数实读：见 5.6（全 ≤300）。
- 中间轮留痕：核首轮 23 红（`dispatch-gates` 六处 export 前缀缺——已补）· VSC 首轮 1 红（declaration 档 `resolve` import 收窄过度——已补）· 孤儿 helper 由审计命中（已删）——终轮三套件全绿。

### 5.10 审计 ∕ 代码评审轮次与终态（R3）
- **内部背离审计（explore · 只读）· 轮 1**：裁决 = 有偏差（2 条 PARTIAL 🟡 · 无 🔴）：F1 §5 待写（本段闭合）；F2 两主档孤儿 `logEventCount`（当场删）；另 5 条非偏差观察（A `core-hygiene.test.mjs` SOFT_LINE_REGISTRY 三行陈旧 ∕ B `session-ledger-reliability.test.mjs:101` 扫描表未含新档 ∕ C 端点侧注释 `dispatch.mjs:<旧行位>` 指位失效 ∕ D `isDocOnlyChange` 未用 import（既有） ∕ E 机械 touchedFiles 口径）。拆点一致性 ∕ re-export 承接 ∕ 消费档解析 ∕ ≤300 实读全部通过。
- **代码评审（advisor · code）· 轮 1**：🔴 **0** · 🟡 2（① §5 R3 段待写——本段闭合；② `core-hygiene.test.mjs` 登记表三行未入 §2.9 #11-A 落差名单——协调项，路由回填批）· 🔵 3（`subagent-actions.mjs` ∕ `session-slots-manifest.mjs` 清册行失实——已收正；`files.mjs:67` 清单注 AC-V01 陈旧——既有文本，路由回填批）。**VERDICT: pass**，无 must-fix。
- **fix round = 1**：审计后——孤儿 helper 删除 + 新档 export 前缀补全 + declaration 档 `resolve` 补回；评审后——两清册行收正（零行为面，已复跑核套件 772 绿）。
- 终态：**clean**（审计 1 轮 + 评审 1 轮收敛；评审后改动仅注释 + 本段，未再开轮）。
- 表外连通项（只报 · 供父侧路由）：`core-hygiene.test.mjs:118 ∕ :121 ∕ :126` 登记表三行 ⇒ 并入 §2.9 #11-A；`process-probe.test.mjs:234` F-MI7 扫描域未含 `session-slots-manifest.mjs`（既有）与新档 `session-slot-claims.mjs`（属性成立——新档零 `child_process` 实读）；`session-ledger-reliability.test.mjs:101` 扫描表建议补新档；端点侧注释指位（VSC `src/agent/execute-tools.mjs` 等 ∕ `test/dispatch-hooks.test.mjs:125 ∕ :139`）随文档 ∕ 注释回填批。

## §6 验证与收口（父代理）

### 6.1 亲验（2026-09-28 19:4x · 父侧）
- **六新档在盘** ✓（glob 实证）：`subagent-actions-query.mjs` · `dispatch-gates.mjs` · `dispatch-run.mjs` · `session-slot-claims.mjs` · 两 portability `-declaration.test.mjs`。
- 读数（两舱报告 · 父侧采信）：核 **772∕772** · CLI **889∕889** · VSC **1052∕1052** 全绿（exit 0）；`doc-check` = 悬空 56 ∕ 行宽 36（净增 0）；各档实读 ≤300（最大 270）。
- 两舱内部协议：背离审计 + 代码评审 **pass**（🔴0）；R3 终态 clean ∕ R4 fix=0。

### 6.2 验收对照
- R3 四项 + R4 九项全落（§5 ∕ §5.7–5.10 在册）；**R1 ∕ R2（桌面树）按 §1.4 暂缓**（复起按届时盘面重锚——留守项随 `#510` 在册）。

### 6.3 未决 ∕ 移交（在册不丢）
- **R3 表外连通项 ×4 + R4 文档面三项**（`CLI-DEBT` A4 行 ∕ `CLI-ENTRY` 描述句 ∕ CLI `AGENTS.md` 模块图）= 入台账新条目（随本收口在册）。
- `#510` 留守 = R1 ∕ R2 桌面树拆档（`styles.css` · `mount-settings` · `events.mjs` · `agent-host` · `store` · `mount-composer` + 测试档越层 8 档）——随桌面批次复起。

### 6.4 收口同步清单（D7）
- 角色表 = 六段齐；指针（§1 ∕ §2 ∕ §3 ∕ §4 ∕ §5 ∕ §6）全解析；变更记录 = 各受触档随舱落；台账 = 归集五项（`#413` ∕ `#438` ∕ `#482` ∕ `#484` ∕ `#489`）随本收口核销 + `#510` 留守 + 新残留条目在册。
- **前批遗留交叉核对**：无「条目已结而锚批档未闭」项。
- **本批 = 交付完成（R3 ∥ R4）+ 父侧亲验通过 ⇒ 已收口 2026-09-28（记录冻结）。** 凭据面按纪律处置（值不落档）。
