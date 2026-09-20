# 批：2026-09-20 · 渠道接入（腾讯 TokenHub + 字节火山方舟）

> 状态行：✅ **已收口 2026-09-20**（§6 收口 · 本档冻结）
> 批次边界：交付目标 = 「`tokenhub`（腾讯混元）与 `ark`（火山方舟豆包 Seed）两渠道在**产品登记面**成为一等公民：逐名 spec 行 + 渠道预置/选择面一致 + 兼容决策有实测依据」；
> 条目集 = 台账 **#12**（接入两渠道 · 用户 2026-09-20 02:57「我觉得可以接入」+ 03:09/03:15 供双 key + 03:26 确认开通）。
> 前情 = ① `docs/batches/2026-09-20-qwen-flash-specs.md`（同表 qwen 族形状修正 · 在途）——本批与其**共写域**（`MODEL-SPECS.md` / `model-specs.mjs`），派单须避让或串行；② 台账 #11（覆盖面巡检 · 条件触发）——本批新增行即其部分兑现。
> 关联档：`docs/core/design/MODEL-SPECS.md`（规格表面）· `docs/core/design/PROVIDER.md`（渠道与思考契约 · §12 `enable_thinking`）。

## §1 批次任务（父侧）

**状态行**：**已收口 2026-09-20**——机读位（解析对象 = §1 段内本前缀行；规则 = `BATCH-RECORD.md` §4.9）。

### 1.1 目标与理由

两渠道已由用户注册、父侧**全针实测完毕并写入用户配置**（`~/.thincoder/config.json` 新增 `tokenhub` / `ark` 两条目，改前有备份 `.bak-20260920` / `.bak2-20260920`）。
本批做**产品登记面**的事：让这两个渠道的名字在规格表 / 渠道预置 / 能力门上有据可查，而不是长期靠「查表掉兜底 128K + 思考下拉空白」运行。
（注：用户配置已存在 = 既成事实；本批**不**负责也不得改用户 `config.json`。）

### 1.2 实测证据（父侧 2026-09-20 03:0x–03:3x · 活体双渠道，设计轮直接取用，勿重跑）

**腾讯 TokenHub** = `https://tokenhub.tencentmaas.com/v1`（OpenAI 兼容 · **聚合网关**：`/models` 实返 124 名，含 `glm-5.3*` / `kimi-k3` / `deepseek-v4-*` / `minimax-m3` 等**直命中现有 spec 行**的名）

| 名 | 实测 |
|---|---|
| `hy3` | 默认思考 **true**（裸请求 `reasoning_content` 在场 · `reasoning_tokens`=16；`effort:"none"` → tok=0 rc 消失）· effort **受理面 = 七值全 200**（`none/minimal/low/medium/high/xhigh/max`；乱值 → 400 泛化拒收、不列枚举；2026-09-20 11:5x 复测扩充，见 §1.10①）· **视觉无**（真值 32×32 纯红图答 "Unknown"；对照无图组明说看不到图）· tool 历史带/不带/空 `reasoning_content` 三形态全 200 ⇒ 回声 optional · `max_tokens` 网关不硬拒 ⇒ 上限未证（参考实配 128K out / 256K ctx = **网络/他仓口径，非实测**） |
| `hy3-preview` | 401 前验活（在场）；同参考实配 `none/low/high` |
| `hy4-preview` | 在场（`/models` + 401 探针）；参考实配标其兼容 Anthropic Messages 协议（本批不走该协议） |
| TokenPlan 订阅端点 | `api.lkeap.cloud.tencent.com/plan/v3` 同 key 401 ⇒ **未订阅，本批不做** |

**火山方舟** = `https://ark.cn-beijing.volces.com/api/v3`（OpenAI 兼容 · 账号 `2132196669` · `/models` 133 名）

| 名 | 实测 |
|---|---|
| `doubao-seed-2-0-code-preview-260215`（**编程专档** · 已开通） | 默认思考 **true**（裸请求 rc 在场 · tok=219；`effort:"none"` → tok=0 rc 消失）· effort 真校验（`zzz` → **400 明列 invalid**；`minimal/low/medium/high/xhigh/max` 全 200）· **真视觉**（纯红图答 "Red"）· 回声三形态 200 ⇒ optional · **maxOutput 上限 131 072**（262 144 → 400 "above maximum"）· context：210K tok 输入受理（探至账号 429 限额停手；官方 256K 口径）· `echo.model` 自报真名（防暗换 ✓） |
| `doubao-seed-2-0-lite-260428`（已开通） | 同族全针 ✓（默认思考 true · tok=161 · 视觉答 "Red" · 上限 131 072 · echo 真名） |
| `doubao-seed-2-1-*` 全系 | **ModelNotOpen**（未开通，用户后续动作）——本批只登记**已开通**名；未开通名不补行（无法实测） |
| Coding 订阅端点 `/api/coding/v3` | 400 `InvalidSubscription` ⇒ 本批不做 |
| **兼容地雷** | 他仓（openclaw）为方舟维护 `minLength/maxLength/minItems/maxItems/minContains/maxContains` 剥除兼容层 ⇒ **本批实测：seed-2.0 代全部 200 不触发**（且我们自有工具 schema 零使用这些关键字）⇒ 兼容决策须以此实测为准 |

### 1.3 验收标准

| # | 判据 |
|---|---|
| AC-1 | `specForModel('hy3')` / `('hy3-preview')` / `('hy4-preview')` / `('doubao-seed-2-0-code-preview-260215')` / `('doubao-seed-2-0-lite-260428')` 命中**独立行**（非兜底）（五名 = §1.2 在场集；第五名系 §1.8-② 补登），且 `thinking` / effort 枚举 / `maxOutput` / 视觉位逐项 = §1.2 实测值（**hy3 视觉 = 不声明**；seed 两档 = `true`；两 preview 行能力位不声明仅尺寸行 = §9.3 D-11 代价句） |
| AC-2 | 未证字段**不得冒充实测**：`hy3` context/maxOutput（他仓口径）、seed 系 context（官方口径 + 实测下界）→ 取值 + 行注证据等级，与 MODEL-SPECS §2.2 同款诚实标注纪律 |
| AC-3 | 聚合网关命中核对：`tokenhub` 上的 `glm-5.3` / `kimi-k3` / `deepseek-*` 等名**命中既有行且值可用**（这些是第三方模型经腾讯转售——能力位是否等同原厂行？须实读 `specForModel` 结果并**逐名认账**或加渠道级注记，禁止静默套用） |
| AC-4 | 兼容决策落档：方舟 schema 兼容层「**不引入**」的结论 + 判据（§1.2 实测 + 自有工具面零使用受限关键字）写进设计文档；若设计仍要引入须给反证 |
| AC-5 | 渠道预置面：两渠道进 `PROVIDER_PRESETS`（或设计裁定的等价登记面）——新用户在向导/选择面可见；取值 = §1.2 端点实钉；**不改**用户 `config.json` |
| AC-6 | 三端测试全绿（核 / CLI / VSC）+ 新增用例覆盖**五名逐字段**（§1.8-② 随 AC-1 同变）+ 两族枚举**各自七值、行独立**（§1.10-① 随 #12 收正；A-12） |
| AC-7 | `node scripts/doc-check.mjs` **本批射程零新增**（锚：悬空 0 实跑；行宽：本批自产零；全仓余 2 行 = `docs/core/requirements/AGENT-LOOP.md:163/168` 非本批笔 ⇒ 存量不追·上抛） |
| AC-8 | 用户面实测：切渠道到 `ark` / `tokenhub` 各发一轮对话成功（父侧执行） |
| **AC-9** | （§1.7-① 新登 · §1.8-① 计数收正）D-14 修法落地：off 标记 + effort 族枚举含 `"none"` + 无显式档 ⇒ 载荷携 `reasoning_effort:"none"`；**五** guard 零变面（无枚举行透传 / 显式档优先只携该档 / 百炼 flash 同义多携 / 枚举不含 `none` 者如 `kimi-k3` 不发 / **含 `/` 路由形态名不发**〔#5 收正〕）各有断言；交付面含 `thincoder-core/provider/core.mjs`（~+5）；判据链 = 批次档 §1.7-① + 设计 §9.6 D-14 + 用例 B-5 | 设计 §9.6 · §9.9 B-5 |

### 1.4 边界（本批不做）

- 不接音频/视频模态（产品无发送路径；见 qwen 批 MODEL-SPECS §2.7 同判）。
- 不引入自动探测/在线校正——规格仍人工登记。
- 不为**未开通**名补行（`doubao-seed-2-1-*` 等），开通后随台账 #11 巡检处理。
- TokenPlan / Coding Plan 订阅端点不做（未订阅）。
- 不改 `config.mjs:133-140` 的 `enable_thinking` 名称白名单机制（其判据 = 前缀 + 主机，与两新渠道的关系由设计**核对并登记**，非本批改码对象）。
- Anthropic Messages 协议接入不做（hy4 支持但非本批目标）。

### 1.5 设计轮须裁的开放项

1. **effort 枚举登记形态**：hy3 = 服务端不列枚举（400 泛化）而参考实配三档 ⇒ 登记 `["none","low","high"]`（依他仓+我方一致证据）还是留空透传？seed 系 = 六档受理 + 真校验 ⇒ 登记实测全集？**两者是否同策略**须明裁（影响 `core.mjs:198` 越界抛错门）。
2. **context 取值**：hy3（未实测 · 他仓 256K/128K）与 seed 系（实测下界 210K · 官方 256K）各取何值 + 行注口径。
3. **聚合网关命中面**（AC-3）：转售名沿用原厂行 = 可否？若不可，登记面的形状（新增渠道限定行？行注？）——注意这与 qwen 批刚立的「逐名显式声明」纪律的关系：**不得因省事而把「转售≈原厂」当实测**。
4. **`reasoningEcho`**：两族均实测 optional ⇒ 不声明（= 现状默认）还是显式登记 `"optional"`？与表内既有风格一致性。
5. **PROVIDER_PRESETS 形状**：新增两条预置的字段面（默认模型名、展示名、渠道类型），按 `config.mjs` 实读既有惯例定。

### 1.7 父侧核验裁定（2026-09-20 08:5x · 对设计稿 §9 的内容级核验）

**① D-14 = 批准，升本批必修**（新登 **AC-9**）：判据链成立——本批登记枚举后，下拉/off 钮首次在这两渠道可见，而 off 标记（`thinking:null`）在非百炼主机不发任何思考字段（`thincoder-core/config.mjs` 主机门控）+ 服务端默认想 on ⇒ **UI 显 OFF 实际在想** = 本批注册制造的假告知，与 qwen 批 §2.8 同根同判（「已知命令变坏不得出厂」判例）。交付面新增 `thincoder-core/provider/core.mjs`（载荷组装段 ~+5，谓词 = `thinking===null ∧ thinkApi==="effort" ∧ 枚举含"none" ∧ 无显式档 ⇒ 发 `reasoning_effort:"none"`）+ 用例 B-5（off 标记载荷形 · **四 guard** 零变面断言：无枚举行（`hy4-preview`）透传不变 / 显式档优先只携该档 / 百炼 flash 多携该字段 = 同义（`docs/batches/2026-09-20-qwen-flash-specs.md` §1.8-① 实测支撑）/ 枚举不含 `none` 者（`kimi-k3`）不发）。〔guard 计数勘正 = §1.8-①〕
**② 五行登记认可**：AC-1 字面四名 = 硬要求；`hy3-preview`（§1.2 在场无尺寸实测）按能力位全不声明 + 仅尺寸行入表 = AC-2 证据等级面（当时不另改 AC-1 文本；后经 #10 上报点 2 ⇒ **已由 §1.8-② 补登五名**）。
**③ 计数同变面随实施批动**（D3）：`docs/core/requirements/PROJECT.md:30` + 两 README + `thincoder-vscode/README.md:92` 改值 = 并入交付面（实施轮一次改齐，父侧收口核数）；预改 = 谎报盘上事实，现在不动。
**④ AC-7 读数复验 = 不实**：设计自报「实跑悬空 0」；父侧 08:57 实跑 = `FAIL(锚): 2`（均在本设计自写 §9.9 清单行 `MODEL-SPECS.md:650`：`docs/AGENTS.md` 不存在 + `provider/core.mjs` 裸段歧义）——引用三问第四次同型（自报实跑 ≠ 盘上）。微修轮（#10）：两锚收正 + D-14 获批落文（§9.6/§9.7 由「待批」改「交付项 + AC-9/B-5」）+ 行计数口径注（`model-specs.mjs` 210/211 = 尾换行口径差，本批统一「实读含末行 +1」形，不追改）。
**正面记录**：§9.3 证据等级列 / §9.4 逐名认账表（含 kimi/deepseek 存疑沿用 + `/beta` 软失败路径实读）/ §9.5 兼容层双判据 / D-11 代价句 / 漂移白名单只减不增护栏——质量高于本仓近期均值。

### 1.8 勘误补记（2026-09-20 09:5x · 父侧 · 收 #10 上报三条）

① **guard 计数 3 → 4**：AC-9 / §1.7-① 原写「三 guard（qwen3.x-max / 无枚举行 / 百炼 flash）」，设计 §9.9 B-5 实列四项断言（无枚举行透传 / 显式档优先 / 百炼 flash 同义多携 / 枚举不含 `none` 者如 `kimi-k3` 不发）——qwen3.x-max 归入「枚举不含 none」类（以 `kimi-k3` 为代表实例）；规范面已按 B-5 实形收正，本节为账。
② **AC-1 字面补五名**（增 `hy3-preview`）：#10 上报点 2——五名交付基准与字面四名长期不齐消除；补登依据 = §1.2 在场证据（非新增实测）。
③ **`_dc.txt` 认领**：仓根临时文件（06:12 · 65KB · doc-check 转储）= **父侧产出**（一次性诊断，本应落 `%TEMP%`），已删；父侧临时输出一律 `%TEMP%` 教训入记忆。
④ 编号账：原 §1.6「派单纪律」因 §1.7/§1.8 插入顺延为 §1.9，**1.6 号作废无悬空引用**；后续引用以盘上实读为准（D4）。

### 1.9 派单纪律

- 设计 = eng-designer（**声明共写域** `MODEL-SPECS.md` ⇒ 与 qwen 批冲突时由调度器排队，勿手工插队）。
- 实现 = eng-coder（需本批设计评审通过 + 用户批准 + 新 designToken；qwen 批凭证已消费，不可复用）。
- 台账 #12 生命周期：归批 → 本批档；验收/勾销 = §6。

### 1.10 评审后补证（2026-09-20 11:5x · 父侧活体探针 · 收评审 #12 附带）

**① hy3 effort 受理面实测扩充**（回应评审发现 #12）：`none/minimal/low/medium/high/xhigh/max` **七值全 200 受理**（原记录参考实配三档 `none/low/high` = 欠报，本条取代之）；乱值（`zzz`）→ 400 泛化拒收（服务端不列枚举）。⇒ 父侧裁定：hy3 行按**七值受理集**登记（证据等级 = 受理级探针，行注明标）；B-2 越界错误用例从 `xhigh` 改用域外值；A-1 枚举断言随七值。

**② hy3 前缀继承面现状核对**（回应评审发现 #8）：网关 124 名全量筛 `hy*|hunyuan*` ⇒ 其余名 = `hy-image-v3` / `hy-vision-2.0-instruct` / `hunyuan-t1-vision-*` / `hunyuan-turbos-vision-video-*` / `hy-mt2-{pro,plus,lite}` / `hy-role` / `hunyuan-role-latest` / `hy-3d-* 族` / `hy-asr-*` / `hy-world2-*` / `hy-video-*` / `hy-image-lite`——**无其它以 `hy3` 为前缀之名** ⇒ 现盘继承面 = 仅 `hy3-preview`（已显式在册）；其余名不入 `hy3` 前缀面（落 DEFAULT_SPEC + 告警）。未来同族名随台账 #11 巡检。

**③ 聚合命中面素材**（回应评审发现 #7）：转售命中既有行 = `glm-5.3` / `glm-5.3-flash` / **`glm-5.3-flashx`（经 `glm-5.3-flash` 前缀继承）** / `deepseek-v4-pro(-0813/-202606)` / `deepseek-v4-flash(-0731/-202605)` / `deepseek/deepseek-v4-flash-vision-exp`（`/` 命名空间剥离后命中）/ `kimi-k3` / `minimax-m3`；未命中名（无行 ⇒ 兜底 + 告警）= `kimi-k2.5` / `kimi-k2.6` / `kimi-k2.7-code(-highspeed)` / `kimi-k2.8-preview` 等；非聊天家族（`minimax-video/voice/speech/music-*` 等）不属聊天路由面。设计 §9.4 覆盖面句按此收正。

**④ 清单 8 处置预裁**（#13 上抛 1，随实施轮落）：`thincoder-core/test/model-specs.test.mjs` 实施后若越 300 行软线 ⇒ 登记 `thincoder-core/test/core-hygiene.test.mjs` 的 SOFT_LINE_REGISTRY + `docs/core/design/CORE-UNIFICATION.md` §2.8.1 补行（**不拆档**——单档内聚）；读数以实施时盘上实读为准（qwen 批共写域在途）。

**⑤ 跨面触碰披露**（#13 附改）：其报告「判据行收正 `docs/core/design/MODEL-SPECS.md:303`（A-11）」 = qwen 面 §5 行——父侧已实读核验（下段），与本批 AC-7 同式收敛为「本批射程零新增」公式，属两批已裁定口径的同式同步，非语义漂移，**追认**。

### 1.11 AC-8 / AC-9 活体读数（父侧执行 · 2026-09-20 13:3x）

经产品核路径（`presetToEntry` → `createProvider` → `chat`；CLI/VSC 同核；CLI 无一次性发话入口 ⇒ 字面 TUI 面未驱）：

| 轮 | 结果 | 读数 |
|---|---|---|
| ① `tokenhub` / `hy3` 正常轮 | ✅ | 内容「你好」· reasoning 53 字符 · `reasoning_tokens:30` · finish stop |
| ② `ark` 渠道 | ✅（lite 档） | `doubao-seed-2-0-lite-260428` → 「你好」；**预设默认模型 `…code-preview-260215` = 429 `SetLimitExceeded`**（账户侧限额——外部状态，非产品缺陷；限额恢复后复测） |
| ③ `tokenhub` / `hy3` off 轮（`thinking:null`） | ✅ | `reasoning_tokens:0` · rc 零 —— **D-14 补发支活体生效**（AC-9 活体面） |

⇒ AC-8 渠道面成立（两渠道各有一轮成功）；②的默认模型限额为用户侧事项（建议查方舟控制台限额设置）。

## §2 批次任务与设计

**设计正文** = `docs/core/design/MODEL-SPECS.md` §9（本轮新增，§1–§8 既有内容零触碰）；渠道/预设面同时落 `docs/core/design/PROVIDER.md` §6.11。
**上报编号** = 批次档无编号上报面 ⇒ 统一用 `MODEL-SPECS.md` §9.9 表末「上报清单 1–6」，正文引用写「§9.9 清单 N」。

### 2.1 本批覆盖的需求条目（逐条对 §1.3 AC）

| AC | 设计落点 | 交付物 |
|---|---|---|
| AC-1 | §9.2 / §9.3 | 五新行（`hy3` / `hy3-preview` / `hy4-preview` / `doubao-seed-2-0-code-preview-260215` / `doubao-seed-2-0-lite-260428`），`thinking` / `thinkApi` / `reasoningEffortEnum` / `multimodal` / `maxOutput` / `context` 逐字段 = §1.2 实测值（hy3 视觉 = **不声明**；seed 两档 = `true`）|
| AC-2 | §9.3 等级列 | 未证字段逐条行注标级（「参考实配」/「网络·他仓口径」/「官方口径 + 实测下界 210K」/「同族沿用」），测试面只断言已登记值本身 |
| AC-3 | §9.4 | 转售名**逐名认账表**（glm 族 / minimax-m3 / kimi-k3 / deepseek-v4 两档 + 未在册名退化面），宿主耦合字段公开登记；裁定 D-12 = 不加渠道限定行、不给 `lookupSpec` 扩 provider 维度 |
| AC-4 | §9.5 | 方舟 schema 剥除兼容层 = **不引入**，两条判据（§1.2 全 200 不触发 + 设计轮 grep `thincoder-core/tools/` 受限关键字命中 0）；正文登记位 `doc:PROVIDER.md:§6.7` |
| AC-5 | §9.6 D-13 | 新增 `tokenhub` 预置（端点实钉、`model:"hy3"`、思考/`maxTokens` **不设 = 不发**）；方舟 = **复用 `volcengine`** 预置改默认模型（同渠道不双键）；既有 `hunyuan`（另一主机）未实测 ⇒ 不动 |
| AC-6 | §9.7 / §9.9 | 用例 21 条（A-1..A-12 规格面 · B-1..B-6 载荷面 · P-1..P-3 预置面），含两档枚举差判据（三档 vs 七档互不污染）|
| AC-7 | 本节 2.4 | `doc-check` 实跑 悬空 0 / 行宽 0（设计轮读数）|
| AC-8 | §9.6 / §9.8 | 离线等价断言 B-1..B-6（`reasoning_effort` 载荷形状）；活体一轮 = 父侧执行 |
| AC-9 | §9.6 / §9.7 / §9.9 | `thincoder-core/provider/core.mjs` 载荷组装层补发：`thinking===null` ∧ `thinkApi==="effort"` ∧ 枚举含 `"none"` ∧ 无显式档 ⇒ 发 `reasoning_effort:"none"`；用例 B-5（off 标记载荷形 + 四 guard 零变面）与 B-6（后台路径副作用认账）；越界抛错门 `:198-203` 零改 |

### 2.2 明确不入本批实施面的条目

- 未开通名（`doubao-seed-2-1-*` = ModelNotOpen）不补行；音频/视频模态位不登记；TokenPlan / Coding 订阅端点不做；Anthropic Messages 协议不接（皆 = §1.4 边界，设计侧确认无缺口）。
- `resolveEnableThinking`（`thincoder-core/config.mjs:133-140`）不改（§1.4 边界；与两新渠道的关系已核对 = §9.6）。
- 用户 `config.json` 不改（§1.1 既成事实）。
- `thincoder-core/provider/core.mjs` 除 **D-14（已批 · AC-9 · off 补发）**外零改动——该文件其余（含 `:198-203` 越界抛错门）一行不改。
- 主 agent 笔面（不入 eng-coder 任务）：需求档 `docs/core/requirements/PROJECT.md:30`「全集 20 个」→ 21、产品文案 `thincoder-cli/README.md:18` / `thincoder-vscode/README.md:22`、VSC README `:92` 预设表 `doubao-pro-32k` 行改值（§9.9 清单 5）。

### 2.3 父侧已裁定的两项（原待裁面 · 2026-09-20 08:5x 批 · 批次档 §1.7）

1. **D-14（§9.6）effort 族非百炼渠道「off 静默失效」修法 = 已批准 · 新登 AC-9**：两端「关思考」发 `thinking:null` 标记
   （`thincoder-cli/src/tui/cmd-think.mjs:115` / `thincoder-vscode/src/extension/reasoning-mode.mjs:22-24`），该标记对 hy3 / seed
   两渠道不发任何思考字段（`thincoder-core/provider/core.mjs:193` 跳过 falsy），而两渠道服务端默认思考 on（§1.2 裸请求实测）
   ⇒ UI 显示 OFF、服务端照想。修法单点（载荷组装层补发 `reasoning_effort:"none"`，实测唯一有效 off 路径），三端 UI 零改；
   后台调用随之不再想 = 已认账（`thincoder-core/context.mjs:401` / `thincoder-core/explore-distill.mjs:98`，用例 B-6）。
   交付面：`thincoder-core/provider/core.mjs`（~+5）+ 用例 B-5 / B-6 + AC-9。
2. **`hy3-preview` 第五行 = 保留（按五行交付）**：父侧认「AC-1 字面四名 = 硬要求，第五行 = 按 §1.2 在场证据补登」，
   不改 AC-1 文本；VSC 探测下拉对它档位空 = 已认账（§9.3 D-11 代价句）。

另：父侧裁定 §9.9 清单 6（CLI 下拉对未在册名回退全档 vs VSC 档位空）= 已知两端不一致、**不升为本批必修**；
处置（登记位置）归主 agent 笔面，本设计只保留发现面。

### 2.4 影响文件清单与设计侧自查

- 产品码三档：`thincoder-core/model-specs.mjs` 211 → ~229（+~18）、`thincoder-core/config-presets.mjs` 47 → ~48（+1 / ±1）、
  `thincoder-core/provider/core.mjs` 477 → ~482（+~5 · D-14）；测试五档：`thincoder-core/test/model-specs.test.mjs` 91（+~50）、
  `thincoder-core/test/provider-merge.test.mjs` 162（+~50）、`thincoder-core/test/config-presets.test.mjs`（拟新增 ~24）、
  CLI/VSC `test/config-merge.test.mjs` 217 / 182（各 +3 / −3）；改后全部 < 300 行软线 ⇒ 无拆分方案
  （行计数口径 = `split('\n').length` 含末行，见 `MODEL-SPECS.md` §9.7 注）。
- 设计轮笔两档：`MODEL-SPECS.md` §9 + 变更记录、`PROVIDER.md` §6.11 计数 20→21 + 变更记录。
- 机检实跑：`node scripts/doc-check.mjs` ⇒ 悬空 0 / 行宽 0（AC-7 达标；含设计自查修正轮现场修的 4 条新悬空与 2 条自产超长行）。
- 三链一致：2.1 覆盖条目 = `MODEL-SPECS.md` §9.8 回指条目 = 批次档 §1.3 AC-1..AC-8 + §1.7-① 新登 AC-9，逐条对得上（D3 计数面已收正为「在盘 10 处」并同步 +3/−3）。
- 共写域申报：本批与 qwen 批 #3 共写 `MODEL-SPECS.md` / `model-specs.mjs`——本轮只追加 §9 与变更记录尾条，未触碰 §1–§8 与既有表行；§9.9 用例 A-11 即为「防前批改动被遮蔽」的回归用例。

**设计状态**：八项齐、AC-1..AC-9 逐条回指、两项待裁已获父侧裁定（§1.7）⇒ 待 #11 复审通过 + 用户批准后转实施（发起权在父侧）。

### 2.5 #10 复审后微修轮（2026-09-20 09:1x · eng-designer · 零新语义）

**输入** = 批次档 §1.7 父侧裁定四条 + #10 复审的 Suggestion 四条。本轮只做「裁定落位 + 一致性面自修」，未扩范围、未新增 AC。

**号 → 改动位（`docs/core/design/MODEL-SPECS.md` 除注明外）**：

| 输入号 | 处置 | 改动位 |
|---|---|---|
| ① D-14 批准 · 新登 AC-9 | 交付面解锁：载荷组装段 +~5、`provider/core.mjs` 入表（477 / +~5）、抛错门 `:198-203` 零改句 | §9.6 状态句 · §9.7 表 `:512` · §9.8 `:555` |
| ① 连带 | 用例 B-5 落位（off 标记载荷形 + 四 guard 零变面）· B-6（后台路径副作用认账，父侧裁定「AC-9 不区分内部/用户 off」派生）· 思考开关行由「待批」改「已批准 · AC-9」 | §9.9 `:587` `:588` · §9.11 `:629` |
| ② hy3-preview 保留（按五行交付） | 不改 AC-1 文本；D-11 代价句（VSC 探测下拉档位空）保持已认账表述 | §9.2 `:380` · §9.3 行注 |
| ② 五行字面 vs 父侧「AC-1 四名 = 硬要求」 | §9.8 AC-1 行与 §9.9 清单 1 保持「按 §1.2 在场证据补登第五行」的成文表述，不擅改 AC-1 字面（字面属父侧笔面） | §9.8 `:547` · §9.9 清单 1 |
| ③ 计数同变随实施批动（预改 = 谎报盘上事实） | `docs/core/requirements/PROJECT.md:30`、两 README、VSC README `:92` **本轮未改**；§9.9 清单 5 的「主 agent 笔」归属句保持 | §9.9 清单 5 |
| ④ 四条自写悬空 + 两条超长行 | 四条已在上一轮收正（其中 `docs/AGENTS.md` 死指针改指 `docs/README.md`、`provider/core.mjs` 补仓根前缀、两处符号误抽加反引号）；本轮新发现同类一条并收正：变更记录旧条内指向本仓不存在文件的裸指针 → 改描述性写法（可解析性收正，历史事实不改） | `:679-680` |
| Suggestion：`reasoningEcho` 段行宽 | 已折行（`:502` 起四行形），本轮复查无 >300 单行 | §9.6 |
| Suggestion：清单 6 行宽 | 已折行（`:605-608`），本轮复查同上 | §9.9 清单 6 |
| Suggestion：§2.4 与 §9.7 交付面差集（缺 `provider/core.mjs` 行、用例数 19 vs 21、测试档 +~26 vs +~50） | 批次档 §2.4 已同步：产品码「两档」→「三档」（含 `provider/core.mjs` 477→~482）、测试「四档」→「五档」（+~50 对齐）、AC-6 用例数 19 → **21 条**（A-1..A-12 · B-1..B-6 · P-1..P-3）、§2.1 补 **AC-9** 行、§2.3「待裁」→「已裁」、§2.2「默认零改动」→「除 D-14（已批）外零改」、§2 抬头「清单 1–5」→「1–6」 | 批次档 §2.1/§2.2/§2.3/§2.4 |

**D3 计数与清单同变（规范面三处）**：§9.7 测试表承载段 `B-1..B-4` → `B-1..B-6`（`:529`）· §9.9 B-5 guard 数 三 → 四（`:587`，§9.8 AC-9 行 `:555` 随变）· §9.8 AC-8 行 `B-1..B-3` → `B-1..B-6`（`:554`）。变更记录内的历史读数（`613→639` / `418→423` / `B-1..B-4`）属记录面，不改。

**§9.7 现行数刷新**：`MODEL-SPECS.md` 676 → **704**、`PROVIDER.md` 423 → **427**（本轮笔面）。其余八行经 `split('\n').length` 实读复核：211 / 47 / 477 / 91 / 162 / 217 / 182 全部对上，`config-presets.test.mjs` 实存确认 = 缺失（与「拟新增」一致）。

**机检读数（本轮 09:1x 实跑，非引用他处）**：`node scripts/doc-check.mjs` ⇒ 退出码 0 · 锚 **OK(悬空 0)** · 行宽 **OK（源域无 >300 单行）**；汇总行 = 候选 18057 · 悬空 0 · 注记豁免 43 · 拟新增 6 · 迁移期引文 212。AC-7 字面「悬空 0 / 行宽 0」= 达标。

**范围外发现（只报不改）**：
1. `docs/batches/2026-09-20-channel-onboarding.md:52`（§1.4 AC 表 **AC-9 行，父侧笔面**）：guard 计数「三 guard 零变面（qwen3.x-max / 无枚举行 / 百炼 flash）」= 3 项枚举，而设计 §9.9 B-5 实列 **4** 项（多 `kimi-k3` 枚举无 `none` guard）。父侧 §1.7-① 原文亦为「三」⇒ 属规范面计数与清单不同变，但落点在需求/讨论段（D1 主 agent 笔面）⇒ 交父侧收正（建议：改「四 guard」并补 `kimi-k3` 项，或明确 B-5 只断言三项）。
2. 变更记录历史条目中的旧坐标（如 `provider/core.mjs` 裸段旧写法）已随「指针可解析性」收正为描述性写法；其余历史读数一律未追改。

**状态**：八项齐、AC-1..AC-9 逐条回指、两项待裁均已按 §1.7 落位、机检双绿 ⇒ 待 #11 复审与用户批准；实施与提交 = eng-coder（本轮未触碰任何产品码）。

### 2.6 评审轮 1 修正轮回执（2026-09-20 · eng-designer · fix 轮）

**输入** = §3 轮次 1 发现 12 条（🟡9 / 🔵3 / 🔴0）。射程 = 设计面两档（`docs/core/design/MODEL-SPECS.md` · `docs/core/design/PROVIDER.md`）；
需求档与产品码本批零动，§1 与 §2.1–2.5 原文未改（本段 = 追加，冲突处以本段为准）。

**逐号落位（号 → 改动 file:line）**：

| # | 落位 |
|---|---|
| 1 | `PROVIDER.md:284-289`（§6.19 改指核单源 + VSC 取一侧 + 计数 21）· `:170`（21 家）· `MODEL-SPECS.md:560-564`（§9.7 D3 清单 10 → 11 处） |
| 2 | `MODEL-SPECS.md:571`（AC-1 五名行）· `:575`（AC-6 五名逐字段）· `:617-619`（清单 1 改「字面缺口闭合」） |
| 3 | `PROVIDER.md:194-200`（§6.12 新段落 = D-14 谓词单源）· `:91`（§6.2 载荷组装补 off 补发支）· `MODEL-SPECS.md:530`（§9.7 PROVIDER 行） |
| 4 | `MODEL-SPECS.md:483-484`（§9.5 正文登记位 = 本节自身；`PROVIDER.md:§6.7` 死指撤） |
| 5 | `MODEL-SPECS.md:498-511`（§9.6 D-14 补第五子句 `!provider.model.includes("/")` + 单源指针）· `:610`（B-5 第 5 guard = `x/hy3`） |
| 6 | `MODEL-SPECS.md:635-640`（清单 7 = 端差默认档现状 + 修法越批上抛）· `:668`（§9.11 VSC 默认档行认账） |
| 7 | `MODEL-SPECS.md:472-475`（§9.4 覆盖面口径 = 命中 / 未命中全集） |
| 8 | `MODEL-SPECS.md:427-430`（§9.2 前缀继承面现状核对） |
| 9 | `MODEL-SPECS.md:630-634`（清单 6 坐标 → `provider-probe-window.mjs:66` / `settings.mjs:210-215` / `settings-state.js:36-49`；`.ts` 死指撤） |
| 10 | `MODEL-SPECS.md:526`（230）· `:546`（222）· `:529`（750）· `:530`（445） |
| 11 | `MODEL-SPECS.md:653-656`（§9.10 补三边界：端差档面 / 订阅端点 / 不自动探测） |
| 12 | `MODEL-SPECS.md:439`（hy3 枚举行 = 七值受理级 + 四级取证 + `zzz` → 400 泛化） |

**机检实跑**（`node scripts/doc-check.mjs`，修轮末跑）：锚 = 悬空 0（`OK(锚)`）；
行宽 = 3 行超 300，本批自产 1 行（`PROVIDER.md:89` 加支后 382 字符 ⇒ 已折行），末跑余 2 行 = `docs/core/requirements/AGENT-LOOP.md:163/168`（需求档 = 主代理笔，非本批射程）。
⇒ AC-7「零新增」按此判：**本批射程零新增成立**；「全仓 0 行」不成立（残余在需求档）。

**§2.4 读数勘正（原段不改，以本段为准）**：① `:143` 的 `model-specs.mjs` 211 → 现盘实读 **230**（`wc -l` 229；qwen 批行已落盘）；
② `:149` 的「行宽 0」为当轮读数，本轮实跑余 2 行（同上）；③ `:150` 的「在盘 10 处」→ #1 落位后 **11 处**（§9.7 已同变）。

**上抛（6 条）**：① `thincoder-core/test/model-specs.test.mjs` 改后 ~305 越 300 软线（`core-hygiene.test.mjs:109-123` `walk(ROOT)` 无 test 排除）
⇒ 拆档 or 登记 `SOFT_LINE_REGISTRY` + `CORE-UNIFICATION.md` §2.8.1 补行，请父侧裁（= §9.9 清单 8）；
② §1.3 AC-6（`:49`「hy3 三档 vs seed 七档」）· AC-9（`:52`「四 guard」）字面随本轮 #12 / #5 落位失效 ⇒ 父侧勘误；
③ §1.3 AC-7（`:50`「基线 = 0/0」）按本轮实读需改「本批射程零新增」口径 ⇒ 父侧勘误；
④ 行宽残余 2 行 = `docs/core/requirements/AGENT-LOOP.md:163/168`（需求档笔）；
⑤ 五新名 VSC 端差默认档修法 = VSC 产品码 ⇒ 越本批边界（现状与后果 = §9.9 清单 7）；
⑥ `model-specs.mjs` 读数 211 → 228 → 230 漂移（共写域兄弟批在途）⇒ 实施轮以盘上实读为准。

**零新语义**：D-14 系 §1.7-① 已批项；余 11 条全为评审发现的直接导出项。

### 2.7 收口轮回执（§5.4 DR-1…DR-5 + 针㈤ · 2026-09-20 · eng-designer · fix 轮）

**派单范围**：批档 §5.4 漂移表 DR-1…DR-5（设计档 = 我笔面）+ 针㈤（父侧实测回填：代码面 P-4 已落 ⇒ 设计侧同变）。形态令：数字写 `131072`（无下划线）；qwen 面余量只报不修。**零新语义** = 全部落位为派单项直接导出（含 ①/⑧ 读数刷新类）。

**落位（号 → 档:落点）**

- **DR-1** → `CORE-UNIFICATION.md:1787-1790` 变更记录 + §2.8.1 子表行 12 / 13（`test/model-specs.test.mjs` **414** · `test/provider-merge.test.mjs` **306**，`wc -l` 实读 2026-09-20）+ 计数句同改（在册 33 → **35** · 已登 12 → **14** · 后 11 → **13** 档）+ 子表头补「渠道接入批补 2 档〔test 面〕」；两行拆分计划 = 登记不拆档（单档内聚）+ 消解窗口（越 500 硬限前或该档下次实质改动时重裁）。
- **DR-3** → `MODEL-SPECS.md:729`（变更记录 ④）：预设 20 → **21**（在盘处数 11 → **12** · 测试面 6 → **7**，补 `thincoder-vscode/test/files.mjs:21`）；`PROVIDER.md` §6.19 指针 `:273` → `:274`（死坐标收正）；逐笔复核零残留。
- **DR-4** → `MODEL-SPECS.md:726-727`（§9.7 表收口值 + 变更记录 ①②）：`model-specs.mjs` **253** · `config-presets.mjs` **50** · `provider/core.mjs` **492** · 两测试档 **415 / 307**（split 口径）· 新档 `config-presets.test.mjs` **52**；**结论反转收正** =「均低于 300 ⇒ 无拆分方案」→「两测试档越线 ⇒ §1.10-④ 预裁不拆档 + 登记已落（`core-hygiene.test.mjs:55`）+ 拆分计划落 CU §2.8.1」。
- **DR-5** → `MODEL-SPECS.md:730`（变更记录 ⑤）+ §9.6 D-13 ② 面：`volcengine.maxTokens` 追注 32768 → **131072**（已落盘 · 随模型改指同变）。
- **针㈤** → `MODEL-SPECS.md:594`（§9.7 覆盖列）· `:623`（§9.8 AC-5）· `:664`（§9.9 新 **P-4** 行 · 正常类）· `:732-733`（变更记录 ⑦）：代码面 P-4 已落（`config-presets.mjs:32` = `maxTokens: 131072` · 用例 `test/config-presets.test.mjs:49-51`）⇒ 设计侧同变；**用例计数 21 → 22**（A-1..A-12 · B-1..B-6 · P-1..P-4）；数字形态归一无分隔符形（本批 DR-5 / D-13 面两笔 = `:539` / `:730`）。
- **机检（AC-7）** → `MODEL-SPECS.md:625`（AC-7 行刷新）+ `:734`（变更记录 ⑧）：`node scripts/doc-check.mjs` 实跑 = **OK(锚) 0 悬空 · OK(行宽) 无 >300 字符单行**（汇总：候选 18396）；本轮修序 = `:726` / `:728` 悬空锚补全路径（`thincoder-core/provider/core.mjs`）· `:732` 行宽 325 → 拆两行 · CU `:1787` 行宽 457 → 拆四行；自述行 `:576` = **837**（split 实读，与盘一致）。旧 AC-7 附注「全仓残余 2 行 = `AGENT-LOOP.md:163/168`」按现读删除（两行现读 188 / 124，非超线行）。

**验收回指**：设计侧射程 = AC-7（机检 · 上表实跑）+ AC-5 面 P-4（针㈤）；全 AC 面见 `MODEL-SPECS.md` §9.8。

**上抛（只报不修 · 我笔外）**

1. qwen 面 `131_072` **6 处**：`MODEL-SPECS.md:71` / `:332` / `:340` / `:367` / `:487` / `:639`（qwen 批笔面）；另 `:733` 含 `131_072` = 本记录面形态注（旧→新），非残留。
2. 批档面旧形：`131_072` **9 处** + 用例计数「21 条 · P-1..P-3」= `:130`（§1.3 AC-6）· `:280`（§4 批准范围）· `:299` / `:393`（§5 面同族）——需求面 AC-6 由 21 → 22 更新 = 父侧笔。
3. 产品码注释面失实（实施侧收口笔）：`thincoder-core/test/core-hygiene.test.mjs:43`「待补——见批档 §5 漂移表」随 DR-1 落位失实；`:44` 读数「414 / 303」→ 实读 **414 / 306**（`wc -l`）。
4. `docs/core/design/AGENT-LOOP-SUBAGENT.md:1701`「注册表 33 档全为源档、零 `test/` 条目」= 彼批 as-of 陈述；本批起注册表含 2 条 `test/` 档 ⇒ 现读失实，处置 = 父侧裁。
5. `CORE-UNIFICATION.md:821` / `:1124`「`provider/core.mjs` 476」= as-of 2026-09-14 读数（行注声明），与实读 491（`wc -l`）/ 492（split）差 = 存量 as-of 口径，不属本批收口面（列报）。

## §3 设计评审记录

### 轮次与发现（评审子代理）

（待评审轮次追加。）

### 轮次 1（评审子代理）

**发现表（渠道接入批设计评审 · 轮 1）** —— 三档全读 + 定点盘上核查（范围 = `MODEL-SPECS.md` §9 · `PROVIDER.md` §6.11 · 批次档 §1/§2）

| # | Category | Severity | Issue | Suggestion |
|---|---|---|---|---|
| 1 | Document ownership | 🟡 | `docs/core/design/PROVIDER.md:273`（§6.19）仍登记 VSC 侧预置**镜像文件** `thincoder-vscode/src/config-presets.mjs:10`（「镜像 CLI 保持同步」+「20 preset」及 20 名清单），与本次设计 `docs/core/design/MODEL-SPECS.md:511`「端壳无镜像文件」相反（盘上实证设计侧为真：该镜像档不存在，VSC 侧为 `thincoder-vscode/src/extension/presets.mjs:9,21` 的核单源取一侧；核 `thincoder-core/config-presets.mjs:4-8` 记 #129 合一）；且该处计数/清单未随 §6.11（`docs/core/design/PROVIDER.md:168`，本批改 21 家）同变 ⇒ `docs/core/design/MODEL-SPECS.md:537-541` 自称的 D3 清单「在盘 10 处 · 清单已列全」漏计此第 11 处 | 按盘上实读收正 §6.19（改指核单源 + VSC 取一侧坐标），把「20 preset」+ 清单改为 21 + `tokenhub`，并把该处补进 §9.7 的计数同变清单 |
| 2 | Requirements | 🟡 | 设计面三处仍按「四名」口径，与批次档 §1.8-② 补登后的五名 AC 不齐：`docs/core/design/MODEL-SPECS.md:547`（AC-1 行「四在册名」）· `:552`（AC-6 行「四行逐字段」）· `:594`（清单 1「AC-1 四条在册名不含 `hy3-preview`（批次档字面）」）——批次档 `docs/batches/2026-09-20-channel-onboarding.md:44`（AC-1）现列五名、`:49`（AC-6）写「五名逐字段」 | 三处按五名（hy3 / hy3-preview / hy4-preview / seed 两档）改写；§9.9 清单 1 的「批次档字面」句随 §1.8-② 改为「已补登」 |
| 3 | Document ownership | 🟡 | D-14 机制（off 标记 ∧ `thinkApi==="effort"` ∧ 枚举含 `none` ∧ 无显式档 ⇒ 载荷补发 `reasoning_effort:"none"`，`docs/core/design/MODEL-SPECS.md:491`）只落在规格表档 §9.6；机制面档对应两处未改——§6.2 载荷组装枚举（`docs/core/design/PROVIDER.md:89`）与 §6.12 关思考「两机制并存」（`:180-190`），本批 PROVIDER.md 交付面仅 §6.11（`docs/core/design/MODEL-SPECS.md:514`）；与 §9.5 自称的「机制面单一权威 = PROVIDER.md」（`:471`）及 qwen 面 §2.6-4 的同型登记先例不一致 | 把 D-14 规则登记进 PROVIDER.md §6.12（并补 §6.2 载荷组装枚举一支），写入 §9.7 的 PROVIDER.md 行与变更记录 |
| 4 | Document ownership | 🟡 | §9.5 指定 AC-4 结论的「正文登记位 = `doc:PROVIDER.md:§6.7`」（`docs/core/design/MODEL-SPECS.md:471`），但 PROVIDER.md §6.7（`docs/core/design/PROVIDER.md:131-136`）无任何方舟 schema/受限关键字内容，§9.7 亦无交付行 ⇒ 指针悬空 | 二选一：登记写进 PROVIDER.md §6.7 并列入 §9.7 的 PROVIDER.md 行；或删去「正文登记位」句（AC-4 由 §9.5 自身承载） |
| 5 | Clarity | 🟡 | D-14 子句与既有门的关系未写：`thincoder-core/provider/core.mjs:196-197` 的 `reasoning_effort` 注入带 `!isRouter`（含 `/` 模型 ID 被路由/代理误读，`:194-195` 代码注），§9.6:491 四条件直加子句未声明是否继承该门 ⇒ 含 `/` 的模型 ID（命名空间剥离后命中 effort 行、枚举含 none）在 `thinking:null` 且无显式档时会**新携**该字段（今日从不发）；B-5 四 guard（`docs/core/design/MODEL-SPECS.md:587`）不覆盖此面 | 在 §9.6/§9.7 写明子句落位（是否复用 `:197` 的门），并把 router 面零变纳入 B-5 guard 集 |
| 6 | Requirements | 🟡 | 五个新名在 VSC 端差默认档面的后果未登记：`EFFORT_DEFAULT_PREFIXES` 只覆盖 qwen 档，新名未登记 ⇒ 依已诊断的兑底链（`docs/core/design/MODEL-SPECS.md:244-247`：`entry.effortDefault || levels[0] || null`）落枚举首项 `"none"`（hy3/seed 枚举首项均 `none`，`:433` / `:431`）＝ VSC 下拉默认显示 off；§9.11（`:630`）/§9.10（`:617`）只记 preview 空档与「不改 UI 形状」，未记该默认值面 | 或把五个新名登记进 VSC 端差默认档表（含断言），或在 §9.11 明记「新名默认档 = none/off」的已认账后果 |
| 7 | Requirements | 🟡 | §9.4 的「不静默套用」判定（`docs/core/design/MODEL-SPECS.md:463`）缺覆盖面边界：认账表只覆盖 glm 两档 / minimax-m3 / kimi-k3 / deepseek-v4 两档 + 未在册一行（`:454-460`），124 名中「命中既有行」的全集未给（AC-3 为「…等名 … 逐名认账」句式，`docs/batches/2026-09-20-channel-onboarding.md:46`） | 补一句覆盖面口径（命中既有行的全集 = 哪些），或写明表外命中名的沿用认定规则 |
| 8 | Requirements | 🟡 | `hy3` 行的前缀命中面与 D-11「能力位不跨名沿用」（`docs/core/design/MODEL-SPECS.md:395`）存在未记账张力：未登记的 `hy3*` 名将经前缀命中继承 `thinking`/枚举/`maxOutput`/`context`（网关 124 名清单未逐名核）；§9.2（`:422-424`）只自查两 preview 关系与「未来同族新档」 | 补记现状核对（124 名中其它 `hy*` 名有无），或把该继承形态记入认账/台账 #11 条目 |
| 9 | Clarity | 🟡 | §9.9 清单 6（`docs/core/design/MODEL-SPECS.md:605-608`）引 `thincoder-vscode/src/extension/model-status.ts:183` 为 VSC 思考下拉枚举源——盘上该文件不存在（thincoder-vscode 全树无 `.ts` 文件，亦无 `model-status*` 文件；同名消费点为 `thincoder-vscode/src/extension/provider-probe-window.mjs:66` / `settings.mjs:213`） | 坐标改用盘上实读的枚举源文件（或标 unverified），并复核 AC-7 对该行的读数 |
| 10 | Note | 🔵 | `thincoder-core/model-specs.mjs`「现行数 211」（`docs/core/design/MODEL-SPECS.md:510` / 批次档 `:135`）已与盘上不符：现盘 228 行（qwen 批行落盘：`thincoder-core/model-specs.mjs:72` / `:79` / `:83`）⇒ 共写域兄弟批落盘的基线漂移，非本设计缺陷 | 以盘上实读重取基线（本轮抽查相符：`provider/core.mjs` 477 · `config-presets.mjs` 47 · 两档 md 704/427） |
| 11 | Scope | 🔵 | §9.10 边界未与 §1.4 逐条对齐：缺「TokenPlan / Coding Plan 订阅端点不做」（`docs/batches/2026-09-20-channel-onboarding.md:59`）与「不引入自动探测/在线校正」（`:57`）两条 | §9.10 补两条边界以与 §1.4 同变 |
| 12 | Evidence | 🔵 | hy3 枚举 `none/low/high` 登记为「实测有效集」（`docs/core/design/MODEL-SPECS.md:433`），但排除面（哪些档位实测被 400 拒）未登记；服务端不列枚举（批次档 `:25`）⇒ 若存在未探而服务端可受理的档位，登记后本地抛错门（`thincoder-core/provider/core.mjs:198-203`）会把可用值变硬失败 | 在行注补探针面（哪些值实测 400 / 哪些 200），或写明「除 none/low/high 外一律 400」的探针结论 |

**计数**：🔴 0 · 🟡 9 · 🔵 3 · 合计 12 条（🔵/🟡 均不阻塞）。

**范围外注记（不附严重度）**：工作区根残留诊断快照 `d:/teamcode/.thincoder/tmp/{core-before,head,headout,mirror}/**`（含 `thincoder-vscode/src/config-presets.mjs` 的镜像副本，即 §6.19 镜像命题的探针产物）与 `d:/teamcode/.wt-head-probe/**` 仍在盘上——与 §1.8-③「父侧临时输出一律 %TEMP%」教训同名类。

**核查限制**：无文档地图与项目标准档（归属按三档内节/指针布局判）；无 shell 面 ⇒ `doc-check` 未能独立重跑；代码面按声明不在射程，只做定点核（坐标存在性 + 行数 + 关键词）。

VERDICT: pass
（token / designId 值按 §2.7 不入档）

## §4 用户批准

**2026-09-20 · 用户批准**（原文：「渠道批批准」）——设计链收口后批准：

- **批准对象**：设计档 `docs/core/design/MODEL-SPECS.md` §9（渠道族规格面 + D-11…D-14）+ `docs/core/design/PROVIDER.md` §6.11/§6.12/§6.19 本批面 + 本档 §2 实施任务书。
- **前置状态**：设计评审轮次 1 **PASS**（🔴 0 · 🟡 9 · 🔵 3；§3 逐字落档）；12 条发现逐条裁定并修正落位（#13 十二号全落），父侧抽验实读复核；父侧补证 §1.10（hy3 七值受理探针 / 前缀面 / 命中面素材）并入；机检 `OK(锚): 0` + 本批射程零宽新增。
- **批准范围**：本档 §2.4 实施面 = 产品码 3 档 + 测试 5 档 + 计数同变面（两 README 随实施；`docs/core/requirements/PROJECT.md:30` 父侧收口改）；21 条用例（A-1..A-12 · B-1..B-6 · P-1..P-3）。
- **解锁**：eng-coder 实施（凭证 = 评审轮 1 签发，值不落文档）；实施完成 → 父侧验证（含 AC-8 活体一轮）→ 收口核销（D7）。
- **收口追记（2026-09-20 · DR-5 收口轮）**：用例面经 DR-5 增 **P-4**（volcengine `maxTokens` 同变断言）⇒ 21 → **22** 条；`volcengine` 预置 `maxTokens` 32768 → **131072**（DR-5 裁定；§2.7 / #18 / #19）。本批准记录**原文保留**（不回溯改写）。

## §5 实施与修正记录

（待 eng-coder 自写。）

### 5.1 交付摘要（eng-coder · 2026-09-20 13:1x · 收尾轮）

**一句话**：产品码三档 + 测试五档 + 计数同变面（六处）落齐；三端测试实跑全绿（core 434 / CLI 738 / VSC 833，fail 0）；`doc-check` 双绿；内部审计两轮 + 顾问代码评审 pass；终态 = **clean**。

**产品码三档**（行数 = 实读含末行口径）

| 档 | 行数 | 落位 |
|---|---|---|
| `thincoder-core/model-specs.mjs` | 252 | 五新行：`hy3`（thinking true · thinkApi effort · 七值枚举 · context 256_000 · maxOutput 128_000 · **不声明 multimodal**）· `hy3-preview` / `hy4-preview`（**仅** `{context,maxOutput}`）· seed 两档（thinking true · effort · 七值 · `multimodal:true` · maxOutput 131_072 · context 256_000） |
| `thincoder-core/config-presets.mjs` | 49 | `tokenhub` 新增（端点 `https://tokenhub.tencentmaas.com/v1` · model `hy3` · thinking / reasoningEffort / maxTokens **不设 = 不发** · D-13）· `volcengine` 改指 `doubao-seed-2-0-code-preview-260215` · `hunyuan` 零改 |
| `thincoder-core/provider/core.mjs` | 491 | D-14 补发支：`thinking===null ∧ thinkApi==="effort" ∧ 枚举∋"none" ∧ reasoningEffort==null ∧ !provider.model.includes("/")` ⇒ 载荷携 `reasoning_effort:"none"`；越界抛错门 `:198-203` 零改（两轮审计实读复核 ✓） |

**测试五档**：`core/test/model-specs.test.mjs` 414（A-1..A-12）· `core/test/provider-merge.test.mjs` 303（B-1..B-6，B-5 五 guard）· `core/test/config-presets.test.mjs` 47（新档 · P-1..P-3）· `cli/test/config-merge.test.mjs` 216 · `vscode/test/config-merge.test.mjs` 181。

**计数同变（20 → 21 · 六处）**：P-1 断言（`config-presets.test.mjs:16-17`）· CLI `config-merge.test.mjs:5/28` · VSC `config-merge.test.mjs:4/132` · `vscode/test/files.mjs:21`（越清单 · 见 5.4 DR-3）· `cli/README.md:18`（twenty → twenty-one · `Tencent TokenHub (腾讯混元网关)` 入列）· `vscode/README.md:22`（20 → 21 · `Tencent TokenHub` 入列）+ 预设表（Volcengine 行改指新模型 · 新增 tokenhub 行 `:94`）。

**越清单改动（各一条理由 · 均已披露）**：① `core/test/core-hygiene.test.mjs`（151）——登记两条越 300 软线测试档（414 / 303）+ 头注读数口径（批档 §1.10-④ 预裁「登记不拆档」）；② `vscode/test/files.mjs:21`——注释计数 21 同变。

### 5.2 决策透明表（自主判定 · 无待确认项）

| # | 情境 | 判定 | 依据 |
|---|---|---|---|
| 1 | README 计数面归属冲突：批档 §2.2「主 agent 笔面（不入 eng-coder 任务）」 vs §1.7-③ / §4 | **改两 README**；`PROJECT.md:30` 留父侧 | §4 = 用户批准的交付范围（最新 · 最高层）明分「两 README **随实施**；`PROJECT.md:30` 父侧收口改」，与 §1.7-③「并入交付面·实施轮一次改齐」同向 ⇒ §2.2 旧述被取代 |
| 2 | D-14 谓词第五子句（含 `/` 路由形态名） | 补 `!provider.model.includes("/")` | 设计评审轮 1 发现 #5（设计 §9.6 已同变 · B-5 第五 guard） |
| 3 | `xhigh` 越界错误用例 | 换域外值 | 批次档 §1.10-①：七值受理后 `xhigh` 合法 |
| 4 | 未证尺寸取值 | hy3 = 256_000 / 128_000（他仓口径 · 行注标级）；seed 两档 = 256_000 / 131_072（实测上限 + 官方 ctx + 实测下界 210K 行注） | AC-2 证据等级纪律 |
| 5 | `reasoningEcho` | 不声明（两族实测 optional = 现状默认） | §1.5-4 开放项按设计收口 |
| 6 | VSC 产品码是否需改 | 零改——「端壳零镜像」成立（`extension/presets.mjs:21` 纯 re-export 核单源） | 审计轮 2 实读复核 ✓ |

### 5.3 审计与代码评审轮次（终态 = clean）

| 轮 | 面 | 读数 | 处置 |
|---|---|---|---|
| 内部 explore 审计 · 轮 1 | 交付态 vs 设计（首轮） | 0🔴 / 4🟡 / 5🔵 | fix round 1 全落（净语义零改） |
| 顾问代码评审（`advisor type=code`） | 产品码 + 测试五档 | **VERDICT pass** · 0🔴 / 2🟡 / 5🔵（两🟡 = 414/303 越软线 · 登记已成立 · 均「非 must-fix」） | 5🔵：③ 档头自述就地修（折一行 · 净行数不变）· ② 头注死路径改事实性写法 · ① `:5-7` 旧述改「has since moved out to config-presets.mjs」；④ **驳回**（`allowedProd` 断言属 qwen 批 T-13 面 · 设计 `MODEL-SPECS.md:372` 明裁允许面）；⑤ 转报父侧（见 5.4 DR-5） |
| 内部 explore 审计 · 轮 2 | **收尾后终态**（含两 README 计数面 = 前轮未覆盖的新面） | 产品面**零语义偏差**（五新行 / 预置 / D-14 谓词 / 用例族 / 文案计数逐项实读相符；死名 `doubao-pro-32k` 代码与 README 零残留）· 4🟡 全为非代码面 | 无代码修正；4🟡 逐条入 5.4（DR-1..DR-4）+ 交付报告 |

**fix round 计数** = 2 轮（审计轮 1 后 1 轮 + 顾问 5🔵 处置 1 轮），在 5 轮上限内。轮 1 发现明细表在实施会话内；「无残留」由轮 2 对全交付态重审得证（0🔴 · 零语义偏差）。

### 5.4 设计档漂移表（只报不改 —— 设计档 = eng-designer 笔面）

| # | 漂移 | 证据 | 归属 / 处置 |
|---|---|---|---|
| DR-1 | `CORE-UNIFICATION.md` §2.8.1 计划行未落：计数句仍「在册 33 · 已登 12 · 待补 21」，本批两档零行 | `docs/core/design/CORE-UNIFICATION.md:1102` / `:1108-1120`（grep `model-specs.test` / `provider-merge.test` 零命中） | 设计侧笔（批档 §1.10-④ 已预裁「+ §2.8.1 补行」）；`core-hygiene.test.mjs:43` 头注指针「见批档 §5 漂移表」= **本表**（今日可解析） |
| DR-2 | `PROJECT.md:30` 仍「当前全集 **20** 个」（盘上 = 21 键 · 两 README 已 21） | `docs/core/requirements/PROJECT.md:30`（mtime 09-17 · 本批未触） | 父侧笔（§4「父侧收口改」）⇒ 计数面待收口 |
| DR-3 | 设计 §9.7「计数同变面在盘 **11 处** … 清单已列全」失实：盘上 ≥ **12** 处（含 `vscode/test/files.mjs:21`；批档全文 `files.mjs` 原零命中） | `MODEL-SPECS.md:598-608` vs `thincoder-vscode/test/files.mjs:21` | 设计侧笔；本表补记 ⇒ 处数应改 12（§5.1 越清单披露即该第 12 处） |
| DR-4 | 行数读数漂移（含一条结论反转 · 一条此前未披露）：① `model-specs.test.mjs` 设计 ~305 ⇒ 实 **414**；② `provider-merge.test.mjs` 设计「~272 ⇒ 均低于 300 ⇒ 无拆分方案」⇒ 实 **303**（结论反转 · 已登记）；③ `provider/core.mjs` 设计 477 / `+~5` ⇒ ~482 ⇒ 实 **491**（距 500 硬限余量 ~9 行 · **本表首次披露**） | `MODEL-SPECS.md:570 / :572 / :589 / :590 / :594-597` vs 实读行数 | 设计侧笔；①②已由 `core-hygiene.test.mjs` 头注非静默登记，③由本表披露 |
| DR-5 | `volcengine` 预置 `maxTokens:32768` 未随模型改指同变（seed-code 实测上限 131_072） | `config-presets.mjs:32`（设计 §9.6 D-13 只裁两新渠道「不设 = 不发」，未明裁既有行该字段） | 设计侧裁 / 父侧知悉（顾问 🔵⑤ 同指）——**未擅改**（越设计裁量面） |

### 5.5 未复核 / 越批 / 交父侧

- **AC-8（活体一轮）= 父侧执行**：本批产品码交付不含活体验证（`ark` / `tokenhub` 各发一轮对话）。
- **AC-7 判据实跑**：`node scripts/doc-check.mjs` ⇒ `OK(锚): 0 条悬空（闸态——阈值 0）` + `OK(行宽): 源域全部 .md 无 >300 字符单行`；全仓残余 ✗ 行均为「列报 · 不入闸」迁移期引文且属他批/需求档面 ⇒ **本批射程零新增成立**。
- **测试执行面（收尾后实跑 · 非引用）**：core 434 / CLI 738 / VSC 833，fail 全部 0。
- **越批面（未触）**：`thincoder-vscode/src/specs.mjs`（`allowedProd` 断言属 qwen 批 T-13）· 工作树内他批在途档（`PROVIDER.md` / `LOGGING.md` / `TUI.md` / `TURN-CAP-CONTINUE.md` / `WORKSPACE.md` / `cmd-think.mjs` / `webview/model-picker.js` 及其两档测试）· `docs/core/requirements/PROJECT.md:30`（父侧）。
- **本段落位说明**：§5 为追加式写入，正文落于占位行「（待 eng-coder 自写。）」之后（工具语义 = 只追加，不重写既有行）。

### 5.6 终验读数（收尾轮实跑）

- `npm test`（三端 · 收尾后实跑，非引用）：core **434** / CLI **738** / VSC **833**，`fail 0` 全绿。
- `node scripts/doc-check.mjs`（实跑）：`OK(锚): 0 条悬空（闸态——阈值 0）` + `OK(行宽): 源域全部 .md 无 >300 字符单行` ⇒ AC-7 两判据皆绿。
- **归因口径勘正（覆盖 5.5 末条一句）**：列报 ✗ 行 = 「列报 · 不入闸」类（迁移期引文 / 拟新增），不入闸 ⇒ 与 AC-7 判据无关；其文档落点含设计档 `PROVIDER.md:14 / :34 / :38 / :299`（存量迁移期引文行，非本批新增）与 `docs/core/requirements/*` ⇒ 5.5 原文「（残余 ✗ 行）属他批/需求档面」的归类就 `PROVIDER.md` 四行而言不精确，**以本条为准**。
- 内部审计轮 2 = **收尾后终态**全量重审（含两 README 计数面）：产品面零语义偏差（五新行 / 预置 / D-14 谓词 / 用例族 / 文案计数逐项实读相符；死名 `doubao-pro-32k` 代码与 README 零残留）· 4🟡 全为非代码面（DR-1..DR-4 已逐条入 5.4）⇒ **终态 = clean**。

### 5.7 DR-5 收口轮（父侧授权 · 单点 fix · 终态 = clean）

**授权与面**：父侧在 §4 后授权 DR-5 单点轮——落点 `thincoder-core/config-presets.mjs:32`（`volcengine` 预置 `maxTokens`）与 `thincoder-core/test/config-presets.test.mjs`（新增 P-4 用例 + 档头同变）。
**§5.4 表 DR-5 行的处置列（「未擅改 · 越设计裁量面」）由本回执取代**：该漂移已由父侧裁并落地；设计侧 D-13 追注由并行 designer 微轮承接。
本轮**编辑面 = 两档**（`config-presets.mjs` · `test/config-presets.test.mjs`）；**OUT-OF-LIST 改动 = 0**（工作树其余未提交改动属本批早前轮 / 他批，本轮零触）。

**落点 ① 改值 · 读回原文（`config-presets.mjs:32`，判据链见下）**

> `  volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seed-2-0-code-preview-260215", maxTokens: 131_072, desc: "Volcengine Ark (豆包)" },`

- 同处 `model` 字段零改（改指由早前轮已落）；`hunyuan` 行（`:33`）零改。
- 判据链：批次档 §1.2 `:34`「**maxOutput 上限 131 072**（262 144 → 400 "above maximum"）」↔ 规格行 `model-specs.mjs:136`（seed-code · `maxOutput: 131_072`）。
- **live 真值实读（本轮直取，非仅字面）**：`PROVIDER_PRESETS.volcengine.maxTokens === 131072` → **true**；`specMatch("doubao-seed-2-0-code-preview-260215").spec.maxOutput === 131072`；同时复核 `PROVIDER_PRESETS` 计数 = **21**、`tokenhub` 无 `maxTokens`（`:36`）⇒ D-13 / P-1 / P-3 面零回归。
- 行数不变（就地改值）：`config-presets.mjs` = 49 行（`\n` 计数 49，与 §5.1 口径自洽）。

**落点 ② 新增 P-4 · 读回原文（`test/config-presets.test.mjs:49-51`）**

> `test("P-4 volcengine 预置 maxTokens 随改指模型同变（seed-code 实测上限 131_072 · 批 DR-5）", () => {`
> `  assert.equal(PROVIDER_PRESETS.volcengine.maxTokens, 131_072, "预置 maxTokens 随改指模型同变（= seed-code 实测输出上限）")`

- 档头两处同变：`:3` 用例号 `P-1…P-3` → `P-1…P-4`；`:5` 断言面枚举 +1 区「预置取值随模型上限同变」。
- 测试档行数 47（§5.1）→ **51**（+4：空行 + test 行 + assert 行 + 收括号）。
- **自修 1 处（审计后）**：断言消息初稿作「qwen / kimi / mimo 同式」——审计证实失实（`mimo` 预置 `maxTokens: 131072`（`:24`）↔ `model-specs.mjs:94` `maxOutput: 128_000` 不等；`deepseek` `393216`（`:17`）↔ `384_000`（`:33`）同形）⇒ 改为现值「随改指模型同变（= seed-code 实测输出上限）」。

**形态差异披露（供父侧翻转 · 未有擅改）**：任务书字面 `131_072`（带分隔符），而本表其余 128K 值一律无分隔符（`kimi:18` / `qwen:22` / `mimo:24` 皆 `131072`）⇒ **同值异形**，本行现为全表唯一带 `_` 写法（顾问评审 🔵 同指认：以 `grep 131072` 做预设↔规格比对会漏本行）。
现值取任务书字面（并与 `model-specs.mjs` 下划线风格一致）；父侧若求表内同形，`131072` 一行 diff 即换，语义零变。

**验证读数（本轮实跑 · 非引用）**

- `npm test`（`thincoder-core`）：`tests 435 / pass 435 / fail 0`（exit 0），`✔ P-4 …` 在列；对照 §5.6 收尾轮 434 ⇒ **435 = +1 = P-4**。自修后已复跑，同绿。
- `node scripts/doc-check.mjs`：`OK(锚): 0 条悬空` + `OK(行宽)`，exit 0（§5.7 落档后再跑一次复核，结论见回执末行）。
- live 模块实读：见落点 ① 三条。

**审计与评审轮次（本轮）**：内部 explore 审计 **1 轮**（交付态 vs 设计：coder 面偏差 **0**——落值 = 规格行逐字相等 · P-4 走真模块非空转 · 批档 §1.2 相符）；**自修 1 处**；顾问代码评审 `advisor type=code` **1 轮**：**VERDICT pass** · 0🔴 / 1🟡 / 4🔵。
处置：🟡 = 设计侧跨档滞后（§9.9 用例表止于 P-3 · 并行 designer 微轮承接 · 只报不入闸）；🔵 全为加固 / 风格 / 登记项（形态差异 · P-4 可选加钉 `model` 对偶断言 · 档头 `:5` 括注待 D-13 追注落地后解析 · 「长输入 + `max_tokens` = 上限」与 256K context 交互 **unverified**）⇒ 均不改本轮面，逐条转报父侧。
**本轮 fix round 计数 = 1**（累计 §5.3 的 2 轮 ⇒ 3，在 5 轮上限内）。**终态 = clean**（审计 / 评审的发散项均非本交付面）。

**未验证 / 交父侧**

- 「长输入（如 §1.2 的 210K 受理面）+ 默认 `max_tokens: 131_072`」与 256K context 的**组合探针未做**（§1.2 只证上限受理 + 262 144 被拒）；该字段取值语义（= 模型输出上限）设计侧亦未裁 ⇒ 建议 D-13 追注一并记取值依据，或 AC-8 复测时补一轮活体探针（可选）。
- 同型口径现象（未授权 · 只报）：`deepseek` `393216`（`:17`）↔ `384_000`（`model-specs.mjs:33`）；`mimo` / `mimoplan` `131072`（`:24` / `:25`）↔ `128_000`（`model-specs.mjs:94` / `:95`）——可能是「预设 K×1024 / 规格行十进制」的有意口径，是否整理请父侧裁。
- 设计侧回写（非本笔）：`MODEL-SPECS.md` §9.6 D-13 追注 · §9.7 测试表（`:591` 覆盖列未含 P-4）· §9.9 用例表（`:656-658` 止于 P-3）· §9.8 AC-5 行（`:618`）· `:571` 行数读数。
- 提交面提示：`config-presets.test.mjs` 为**未跟踪新档**（`git status` = `?? thincoder-core/test/config-presets.test.mjs`）⇒ 父侧 commit 需 `git add`；本批早前轮 P-1..P-3 的逐字节同一因该档无 VCS 历史不可比（以本轮编辑面声明为准）。

**§5.7 落档后复核（补记 · 关闭上文「结论见回执末行」）**

- `node scripts/doc-check.mjs`（§5.7 写入**之后**实跑）：`OK(锚): 0 条悬空（闸态——阈值 0）` + `OK(行宽): 源域全部 .md 无 >300 字符单行`，exit 0。
- §5.7 新增段自身零悬空锚、零超宽行；全文 ✗ 行均为存量「列报 · 不入闸」迁移期引文 / 拟新增（属他批 / 需求档面，与 AC-7 判据无关）。
- 读回核验：§5.7 正文已逐字落于 §6 之前（`docs/batches/2026-09-20-channel-onboarding.md:351-393`）。

## §6 验证与收口

**收口日期**：2026-09-20 · **终态**：✅ 已收口

### 6.1 AC 验证（AC-1..AC-9）

| AC | 落位 | 验证（父侧实跑 / 实读） |
|---|---|---|
| AC-1 | `thincoder-core/model-specs.mjs:124/127/130/136/139`（#16 读回） | core 435/0 · A-1..A-3 / A-5 全绿 |
| AC-2 | 行注证据等级（受理级 / 网络口径 / 官方口径） | A-4 ✓ |
| AC-3 | §9.4 逐名认账 + D-12 | A-6..A-9 ✓ |
| AC-4 | §9.5 结论 + 复访条件（死指已撤） | A-10 ✓ |
| AC-5 | `config-presets.mjs:32/36`（tokenhub 新增 · volcengine 改指 + maxTokens 131072） | P-1..P-4 ✓ |
| AC-6 | 用例 22 条（A-12 · B-6 · P-4）+ 两族枚举行独立 | 三端全绿 |
| AC-7 | doc-check | 父侧 13:5x 实跑 `OK(锚): 0 · OK(行宽)` ✓ |
| AC-8 | 活体（父侧 · §1.11） | tokenhub/hy3 ✅ · ark/lite ✅；预设默认模型 code-preview = 429 账户限额（外部待复测） |
| AC-9 | D-14 + B-5/B-6 | 活体 off 轮 `reasoning_tokens:0` ✓（§1.11③） |
| 计数同变 | 预设 21（测试 6 处 + `files.mjs` + 两 README + `PROJECT.md` C3） | 父侧抽验 ✓ |

### 6.2 终态机检（父侧实跑 · 2026-09-20 13:5x）

core **435 / 0** · cli **738 / 0** · vsc **839 / 0** · `doc-check` 双清（与 qwen 批同跑，读数见其 §6.2）。

### 6.3 漂移与勘误闭合

DR-1..DR-5 全闭（#18 / #19 落位 + 本档 §2.7/§5.4）；父侧直改清单（打标 · 可逐条核）：`131_072`→`131072` ×2（#19 形态归一转写）· `thincoder-core/test/core-hygiene.test.mjs` 注释（303→306・「待补」→「已落」）· `docs/core/design/AGENT-LOOP-SUBAGENT.md:1699/:1701`（零 test 条目 → 时点论 + 现读）· `docs/core/requirements/PROJECT.md:30` C3（权威路径 + 21 个）· 本档状态行 ×2。

### 6.4 结算同步（D7 清单）

- **角色表**：讨论 = 父侧 · 设计 = eng-designer（#9——串位事故后重派）· 设计评审 = advisor 轮 1 **PASS**（§3 逐字落档）· 批准 = 用户（§4）· 实施 = eng-coder #16 · 收口 = #18（设计面）+ #19（DR-5 代码面）。
- **状态行**：本档 → 「已收口 2026-09-20」（本节落笔后**冻结**）。
- **计数**：预设 21 · 用例 22（P-4）· 交付面 = §2.4 面（产品码三档 + 测试五档 + 两 README；`PROJECT.md` 父侧笔）。
- **台账**：见 6.5。

### 6.5 台账结算

**#12**：`在途 → 待核销 → 已核销`（结算依据 = 本档 §6 + 三端实跑 + §1.11 活体）。

### 6.6 提交

路径限提交 = 本收口序列末步；hash 落台账 evidence（不入本档，避二次回改）。
