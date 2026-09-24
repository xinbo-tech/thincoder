# 2026-09-24 · bench 受测名单扩容（roster-expand）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-24 · 来源 = 用户 2026-09-24 14:35 指令（「我还想扩大一下受测名单，把这几家的主力模型也加上」）+ 14:37（「b组也要」+ kimi-k2.6 快速档；判官机制不动）。
> 台账 = #261（MODEL-BENCH · 归批）。前情 = docs/batches/2026-09-24-error-duration.md §6（已收口 2026-09-24——失败耗时入用时表；本批 = 受测名单扩容 + 价格补录 + 跑批 v5）。
## §1 讨论（主 agent）
**状态行**：已收口 2026-09-24
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**批件（用户 2026-09-24 14:35 / 14:37）**：「我还想扩大一下受测名单，把这几家的主力模型也加上，你列一下我看看有哪些，一起确定一下。」→「b组也要」+「kimi-k2.6 的那个快速模型」+「**判官模型的事情你再不要装逼过分了，我好烦啊！我不需要你假装中立。**」

### 1.1 名单终稿（父侧主张 · 已探针实核）

| # | 家 | 加入档（label） | 组 | 价格状态 |
|---|---|---|---|---|
| 1 | DeepSeek | `deepseek-v4-pro` | A 旗舰 | 已录（9/27） |
| 2 | 小米 MiMo | `mimo-v2.6-pro` | A 旗舰（**已在册 · 价已录**） | 已录（3/6） |
| 3 | 小米 MiMo | `mimo-v2.6-pro-ultraspeed` | A 极速（**已在册 · 价已录**） | 已录（30/60） |
| 4 | 智谱 | `glm-5.3` | A 旗舰 | 待补（走 `glm` 渠道——判官探测已验「服从单发 JSON」） |
| 5 | 阿里 | `qwen3.8-max` | A 旗舰 | 待补（走 `qwen` 渠道） |
| 6 | Kimi | `kimi-k3` | B | 待补 |
| 7 | Kimi | `kimi-k2.6` | C（用户点名） | 待补 |
| 8 | Kimi | `kimi-k2.7-code-highspeed` | C（=「k2.6 那个快速档」的实名——kimi 家无 k2.6-highspeed） | 待补 |
| 9 | Kimi | `kimi-k2.7-code` | C（家里全上——可砍，说一声） | 待补 |
| 10 | MiniMax | `minimax-m3` | B | 待补 |

**+ 现役 6 档**（`mimo-v2.6-pro` · `mimo-v2.6-flash` · `mimo-v2.6-pro-ultraspeed` · `deepseek-flash` · `glm-5.3-flash` · `qwen3.8-flash`；§1.1 表十档 = **8 新 + 2 已在册**〔`mimo-v2.6-pro` / `-ultraspeed`——价格栏「已录」即此〕）⇒ 一轮 = 14 档（392 run ≈ 1.5-2 小时 · 十元级）（父侧 2026-09-24 收正 · 可 revert）。

**探针实测（父侧 · 2026-09-24 14:3x）**：kimi 渠道（api.moonshot.cn/v1）`/models` = 4 名（`kimi-k3` · `kimi-k2.6` · `kimi-k2.7-code` · `kimi-k2.7-code-highspeed`）；minimax 渠道 = 8 名（M3 / M2.7(-highspeed) / M2.5(-highspeed) / M2.1(-highspeed) / M2）；config 13 家（deepseek · kimi · qwen · qwenplan · kimi-code · kimi-entprprise · glm · zhipu-plan · minimax · dgx-spark · tokenhub · ark · mimo）。

### 1.2 裁定

1. **判官机制不动**（用户 14:37 原话入档）：三槽保持 A `deepseek:deepseek-flash` / B `tokenhub:hy3` / C `deepseek:deepseek-v4-pro`；被测集扩容后重合照跑 + 报告同位/同渠道明示（既定机制，不静默）——**不再作选择题上抛**。
2. **kimi-k3 温度路径**：判官面实测拒 `temperature: 0`（「only 1 is allowed for this model」）；**被测面同模型同渠道待验**（1 发探针）——若同拒 ⇒ 设计轮给结论（候选：per-model 温度例外 + 报告脚注 / 照实 error 不列）。
3. **价格补录 7 条**（glm-5.3 · qwen3.8-max · kimi-k3 · kimi-k2.6 · kimi-k2.7-code-highspeed · kimi-k2.7-code · minimax-m3）——官方定价页 + `source` + `asOf`。
4. **跑批 v5**（14 档全量）＝ 批尾动作：**点火 = 用户点名**（成本/时长已报：392 run ≈ 1.5-2 小时 · 十元级）。
5. **版本口径**：题集/判分/计时零改 ⇒ 倾向**不 bump**（名单非版本轴——设计轮定论）。

### 1.3 边界

- 改面：`bench/models.json`（+10 行）· `bench/prices.json`（+7 条）· `bench/README.md`（名单注）· 测试（名单 / 价格断言）；**可能**：温度例外机制（待 ① 探针结论）。
- **不动**：判官三槽 · 三端产品树 · bench 跑批/判分逻辑（名单是数据）；**kimi 家 `kimi-k2.7-code` 可砍**（用户口味面）。

### 1.4 名单追加（用户 2026-09-24 14:40「这两个也加上，中档的也加上」）

**追加 6 档**（全部现渠道零配置，实探在案）：
① 字节旗舰 `doubao-seed-2-1-pro-260915`（ark 渠道——唯一未测一线大厂）· ② 腾讯 `hy3`（tokenhub 渠道——在售主力；现役判官 B 位 ⇒ 加入后被测集含其渠道，同位/同渠道明示照走既定机制）；
③–⑥ 中档四档：`doubao-seed-2-1-turbo-260628` · `doubao-seed-2-0-code-preview-260215`（字节）· `glm-5.3-flashx`（智谱）· `minimax-m2.7-highspeed`（MiniMax）。

**名单合计 = 20 档**（现役 flash 4 + 旗舰 5 + kimi 4 + minimax-m3 + 字节/腾讯 2 + 中档 4）。
**预算更新**：20 × 28 ≈ 560 run ≈ 2-3 小时 · 数十元级（按量）。
**探针实据**（父侧 14:3x–14:4x）：ark `/models` 135 名（含 `doubao-seed-2-1-pro-260915` / `-turbo-260628` / `doubao-seed-2-0-code-preview-260215`；无 hy 系）· tokenhub 114 名（含 `hy3` / `hy4-preview` · `glm-5.3-flashx` · `minimax-m2.7` · kimi 全家）。
**候选落记**（未选）：`hy4-preview`（预览不碰）· `doubao-seed-2-0-*` 旧代 · `minimax-m2.5-*` / `m2.1-*`（上代）· `mimo-v2.5-pro`（tokenhub 转售版，同家已含）· 讯飞 / 文心 / 商汤 / 阶跃（需新渠道，不建议）。

### 1.5 名单追加（用户 2026-09-24 14:41「千问3.6/3.7也列入，再看看还有没有适合本地部署的小模型比如27B的千问系」）

**追加 7 档**（qwen 渠道 dashscope 实探 261 名在案）：
①–⑤ 3.6 / 3.7 两代主力：`qwen3.6-plus` · `qwen3.6-flash` · `qwen3.7-max` · `qwen3.7-plus` · `qwen3.7-flash`（3.6-max 仅 preview 名 ⇒ 不取）；
⑥–⑦ 27B 本地档两代：`qwen3.8-27b`（原规格表在册，现入名单）+ `qwen3.6-27b`（另在售 `qwen3.5-27b`——未点，可补）。
**名单合计 = 27 档**（20 + 7）。**预算**：27 × 28 ≈ 756 run ≈ 3-4 小时（数十元级）。
**候选落记**：`qwen3-coder-next` / `qwen3-coder-flash`（代码专档——未点）· `qwen3-32b/14b/8b`（2025 老代）· `qwen3.5-27b` · `qwen3.6-max-preview`（预览）。

### 1.6 名单追加（用户 2026-09-24 14:42「qwen3.5的27b也列入」）

`qwen3.5-27b`（dashscope 在售，父侧实探在案）⇒ **27B 本地族三代齐**（3.5 / 3.6 / 3.8）。**名单合计 = 28 档**（预算：28 × 28 ≈ 784 run ≈ 3-4 小时）。

### 1.7 名单追加（用户 2026-09-24 14:43「可以」——批准小档两档）

`doubao-seed-2-1-lite-260915`（字节 lite · ark 渠道）· `glm-4.5-air`（智谱 air · glm 渠道）⇒ **名单合计 = 30 档**（预算：30 × 28 ≈ 840 run ≈ 3-4 小时）。
**小档面实据**（父侧实探）：glm 渠道 11 名（4.5 系~5.3 系——`glm-4.5-air` 为唯一轻档）· mimo 渠道 9 名（v2.5/v2.6 系，无小档；MiMo-7B 权重开源但 API 不售）· deepseek 渠道 2 名（无小档）；Kimi 4 / MiniMax 8 全大档；腾讯 hy 系无小档。

### 1.8 定音（用户 2026-09-24 14:44「开。」）

**名单封口 = 30 档**（§1.1 **八档新增**〔另 2 档 `mimo-v2.6-pro` / `-ultraspeed` 已在册〕+ §1.4 六档 + §1.5 七档 + §1.6 一档 + §1.7 两档 + 现役 **6** 档）——设计轮派发（eng-designer #21）；台账 #261 推进「待设计」。

### 1.9 评审轮 1 裁定（父侧 · 2026-09-24 14:57）

评审（§3 轮次 1 · **pass**：🔴0 / 🟡2 / 🔵5）逐条裁定：**全数接受**。

| # | Action | Detail |
|---|---|---|
| 1 🟡 | Accepted（父侧直接执行 · 可 revert） | 名单计数两读法：**以现役 6 为准**——§1.1 `:16`/`:17` 两行标注「已在册」+ `:26` 收正（现役 6 档列全）+ §1.8 `:73` 分组收正（§1.1 = 八新 + 2 已在册） |
| 2 🟡 | Accepted（父侧直接执行 · 可 revert） | 批档 §2.3 `:133` 笔误路径就地收正（`thincoder-core`）+ `:200` 更正句随之删（历史不另留） |
| 3 🔵 | Accepted（修正轮 #23） | §2.2 探针结论逐档列（或对未验档标「未验」） |
| 4 🔵 | Accepted（修正轮 #23） | 设计档 §2.4 样例补 `temperature` 形 |
| 5 🔵 | Accepted（修正轮 #23） | §5.13 分档句补 `roster.test.mjs` / `report-present.test.mjs` |
| 6 🔵 | Accepted（修正轮 #23） | §3 本档行现状数对齐（1138 控点） |
| 7 🔵 | Accepted（修正轮 #23） | `render.5` 增「旧档缺字段」腿（或注等价性） |

### 1.10 用户裁定（2026-09-24 14:57「这个确实没必要」）

`doubao-seed-2-0-code-preview-260215`（429 用量上限已达）**排除、不恢复**——**名单终态 = 29 档**（30 − 1）。父侧 30 档活体探针结论同步：`doubao-seed-2-1-lite-260915`（设计轮报 404 未开通）实测已通 ⇒ **保留**；zhipu-plan 权限问题不影响（glm 三档落 `glm` 原厂渠道）。**14:58 复测**（用户 14:57「方舟账户我已经充值了」后）：code-preview 仍 `429 SetLimitExceeded`（「reached the **set usage limit**…model service has been paused」——限 = 控制台**模型级用量上限**，非余额；充值不解）· lite 仍 OK。用户 14:57「这个确实没必要」裁定维持。

### 1.11 用户裁定（2026-09-24 14:58「preview模型没必要纳入测试」）

**通用原则：preview 档不纳入测试名单**（今后名单维护照此）。本批核验：29 档名单内唯一 preview = `doubao-seed-2-0-code-preview-260215`（已按 §1.10 排除）⇒ **名单已合规**；落记候选（`hy4-preview` / `kimi-k2.8-preview` / `qwen3.6-max-preview` / `qwen3.7-max-preview`）均未入册，与原则一致。

### 1.12 复审（轮 2）裁定（父侧 · 2026-09-24 15:10）

复审（§3 轮次 2 · **pass**：🔴0 / 🟡1 / 🔵3——修正轮 #23 落地全对：五号 + 30→29 全链 + preview 原则句，计数对平）逐条裁定：**全数接受**，**父侧直接修**（7 处，小修级；修毕进 §4，不另设修正轮）。

| # | Action | Detail |
|---|---|---|
| 1 🟡 | Accepted（父侧直接执行 · 可 revert） | `MODEL-BENCH.md:892`「`timing.test.mjs`（本批新增——`timing.1`）」→「（已实现——`timing.1`）」（归属回其所属批） |
| 2 🔵 | Accepted（父侧直接执行 · 可 revert） | `bench/judge.json` 现状数统一为 **25**（旧行 `:567`/`:607`/`:628`/`:649` 的 26 系旧读误值，按同一计行尺收正） |
| 3 🔵 | Accepted（父侧直接执行 · 可 revert） | preview 通用原则补设计面：`MODEL-BENCH.md` §2.4 纪律（`:272` 之后补一条）与 §9 名单注（`:1078` 补括注）；`bench/README.md` 名单注落实施轮（本批实施面已含） |
| 4 🔵 | Accepted（父侧直接执行 · 可 revert） | 批档 `:229` 修订过程注记句删除 |

### 1.13 价格源补充（用户 2026-09-24 15:27 供页）

**TokenHub 定价页可读**（`https://cloud.tencent.com/document/product/1823/130055` · 更新 2026-09-23，父侧实读全文）：
- **`tokenhub:hy3` = 输入 1 / 输出 4 / 缓存命中 0.25**（元/百万 tokens，无峰谷）⇒ **待补录**（等 ark 页一并，父侧直接执行；补后重跑 `roster.3` + 75 测试）。
- `Hy4 preview`（6/18/0.3）= preview ⇒ 按原则不采；页内其它档（Kimi/GLM/MiniMax/MiMo 等）= **tokenhub 转售价**（例：Kimi K3 20/100）——本批这些家走**原厂渠道**，价照原厂页录（不混用转售价）。
- 用户正在找**火山方舟定价页**（ark 三档：`doubao-seed-2-1-pro-260915` / `-turbo-260628` / `-lite-260915`）。

### 1.14 价格补录执行（父侧 · 2026-09-24 15:3x）

**已录 3 条**（`bench/prices.json`）：
- `tokenhub:hy3` = 1 / 4 / 缓存 0.25（source = 腾讯云 TokenHub 定价页实读——用户 15:27 供页）；
- `ark:doubao-seed-2-1-pro-260915` = 6 / 30 / 缓存 1.2（source = 火山方舟官网摘要 + 多源交叉一致——官方页 JS 门控不可直读，来源如实标注）；
- `ark:doubao-seed-2-1-turbo-260628` = 3 / 15 / 缓存 null（同上来源；缓存价未得）。
**测试校准（父侧直接执行 · 可 revert）**：`report-render.test.mjs` 的「缺价 ⇒ 位级成本 null」腿原用 `tokenhub:hy3` 当未录价键——hy3 补录后换 `ark:doubao-seed-2-1-lite-260915`（当下仍缺价）⇒ **75/75 复绿**。
**仍缺**：`ark:doubao-seed-2-1-lite-260915` 价（用户可见页文本时可补）。
**状态**：跑批 v5 就绪（缺价档成本格 `—` + 警告，按既有纪律）。

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成 2026-09-24（修正轮并入评审轮 1 #3–#7 + 用户 14:57 / 14:58 裁定：名单终态 29 档（`doubao-seed-2-0-code-preview-260215` 按用户 14:57 裁定排除）；价格 22 候选取证；kimi 四档温度例外机制落地（KD-31 · 不 bump）；glm 三档走 `glm` 原厂（zhipu-plan 无 flashx 权限））
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>

### 2.1 本批条目（覆盖 = §1.8 封口 30 档 − 1（`doubao-seed-2-0-code-preview-260215` · 用户 2026-09-24 14:57 裁定排除）= **29 档**）

**边界**：preview 档不纳入测试名单（用户 2026-09-24 14:58 裁定——**通用原则**，今后名单维护照此；本批 29 档经核无 preview ⇒ 名单合规）。

| # | 条目 | 交付 |
|---|---|---|
| 1 | 受测名单 6 → **29 档**（现役 6 条零改 + 新增 23 条：§1.1 表 8 新 + §1.4 六 + §1.5 七 + §1.6 一 + §1.7 两 = 24，去 1〔`doubao-seed-2-0-code-preview-260215` · 用户 2026-09-24 14:57 裁定排除〕） | `bench/models.json` +23 条（label / provider / model 逐档；维度面 + note 见 2.3 表） |
| 2 | 价格补录（**22 候选**） | `bench/prices.json` 逐条官方定价页取证（`source` + `asOf`）；**取不到 ⇒ 缺价如实**（不录、不编价——运行走既有无价警告路径） |
| 3 | kimi 系温度路径（**结论 = per-model 温度例外**） | `models.json` 增 `temperature` 字段 + `lib/roster.mjs` 校验 + `lib/pipeline.mjs` 透传 + `models[].temperature` 入档 + 报告概览派生披露句 + 测试腿（机制见 2.4） |
| 4 | 名单注 | `bench/README.md`：models.json 维护段补 `temperature` 字段（模型级温度例外）+ 29 档名单注 |
| 5 | 测试 | 新增 `bench/test/roster.test.mjs`（数据面二测自 `suite.test.mjs` 迁入 + `roster.1–3` / `temperature.1`）+ `report-present.test.mjs` 增 `render.5`；**全绿判据 = `node --test "bench/test/*.test.mjs"`** |
| 6 | 跑批 v5 | **不加**（AC 只到「可跑准备就绪」）；实际跑批 = 批尾点火（用户点名） |

**复现命令（29 档 · 在档）**：
- 真实跑（批尾点火用）：`node bench/run.mjs --label roster-29-v5`——缺省 = 清单全量 29 档（预算：29 × 28 ≈ 812 run ≈ 3-4 小时 · 数十元级）；
- 逐名解析自检（零网络 · 可随时跑）：`node bench/run.mjs --dry-run --label roster-29-dry --models <29 个 label 逗号列表>`（等价机检 = `roster.1`）。

### 2.2 探针实测（2026-09-24 设计轮 + 14:57 补探 · 只读 · 脚本用后即抛 · 结论逐档在册；key 只读用户 config）

**渠道名单核（`GET /models`）**：glm 11 名 · zhipu-plan 11 名（同名单）· kimi 4 名 · minimax 8 名 · ark 135 名 · tokenhub 114 名 · qwen 261 名 · deepseek 2 名——**23 档目标名全部在列**（另 1 档目标名 `doubao-seed-2-0-code-preview-260215` 按用户 2026-09-24 14:57 裁定排除）；minimax 的 API 字面 = **`MiniMax-M3` / `MiniMax-M2.7-highspeed`**（大小写与 label 不同），其余 21 档字面 = label 同名。

**被测面 1 发探针（`temperature: 0` · max_tokens 8）——逐档结论（24 档目标名 = 在册 23 + 排除 1）**：

| 结论 | 档 | 备注 |
|---|---|---|
| 拒 `temperature: 0`（4） | kimi 四档：`kimi-k3` · `kimi-k2.6` · `kimi-k2.7-code` · `kimi-k2.7-code-highspeed` | `400 invalid temperature: only 1 is allowed for this model`；改 `temperature: 1` ⇒ 四档各 200 通过 ⇒ **温度例外 = 准入事实（非偏好）** |
| 受理 `temperature: 0`（18） | glm 3（`glm-5.3` / `glm-5.3-flashx` / `glm-4.5-air`）· qwen 9（`qwen3.8-max` / `qwen3.6-plus` / `qwen3.6-flash` / `qwen3.7-max` / `qwen3.7-plus` / `qwen3.7-flash` / `qwen3.8-27b` / `qwen3.6-27b` / `qwen3.5-27b`）· minimax 2（`MiniMax-M3` / `MiniMax-M2.7-highspeed`）· ark 2（`doubao-seed-2-1-pro-260915` / `doubao-seed-2-1-turbo-260628`）· `hy3` · `deepseek-v4-pro` | 各 200 通过 |
| 已实测通过（1） | `doubao-seed-2-1-lite-260915` | 404 已翻转（补探实测已通） |
| 排除（1） | `doubao-seed-2-0-code-preview-260215` | 用户 2026-09-24 14:57 裁定（「这个确实没必要」）——不恢复 |

计数：4 + 18 + 1 + 1 = 24 = 在册 23 + 排除 1；**未验 = 0**。

- **渠道权限实测**：`zhipu-plan:glm-5.3-flashx` ⇒ `429 code 1311「当前订阅套餐暂未开放GLM-5.3-FlashX权限」`；`glm:glm-5.3-flashx` ⇒ 200 ⇒ **glm 三档走 `glm` 原厂渠道**（现役 `glm-5.3-flash` 照旧 `zhipu-plan` 不动）。

### 2.3 新增 23 档逐档映射（依据 = 2.2 探针 + `thincoder-core/model-specs.mjs` 现存行）

| # | label | provider | model | 维度面 | note |
|---|---|---|---|---|---|
| 1 | `deepseek-v4-pro` | `deepseek` | `deepseek-v4-pro` | skip vision | 旗舰；判官 C 位同键 |
| 2 | `glm-5.3` | `glm` | `glm-5.3` | skip vision | 旗舰（走 glm 原厂） |
| 3 | `glm-5.3-flashx` | `glm` | `glm-5.3-flashx` | 全维 | 多模态；走 glm 原厂（plan 无权限） |
| 4 | `glm-4.5-air` | `glm` | `glm-4.5-air` | skip vision | 轻档（走 glm 原厂） |
| 5 | `qwen3.8-max` | `qwen` | `qwen3.8-max` | 全维 | 多模态 |
| 6 | `qwen3.6-plus` | `qwen` | `qwen3.6-plus` | 全维 | 多模态 |
| 7 | `qwen3.6-flash` | `qwen` | `qwen3.6-flash` | 全维 | 多模态 |
| 8 | `qwen3.7-max` | `qwen` | `qwen3.7-max` | skip vision | 无视觉（实测拒图像输入） |
| 9 | `qwen3.7-plus` | `qwen` | `qwen3.7-plus` | skip vision | 无视觉（spec 未建行） |
| 10 | `qwen3.7-flash` | `qwen` | `qwen3.7-flash` | 全维 | 多模态 |
| 11 | `qwen3.8-27b` | `qwen` | `qwen3.8-27b` | 全维 | 多模态（27B 本地族） |
| 12 | `qwen3.6-27b` | `qwen` | `qwen3.6-27b` | 全维 | 多模态（27B 本地族） |
| 13 | `qwen3.5-27b` | `qwen` | `qwen3.5-27b` | skip vision | 无视觉（spec 未建行） |
| 14 | `kimi-k3` | `kimi` | `kimi-k3` | 全维 + **temperature 1** | 多模态；API 仅受理温度 1 |
| 15 | `kimi-k2.6` | `kimi` | `kimi-k2.6` | skip vision + **temperature 1** | API 仅受理温度 1 |
| 16 | `kimi-k2.7-code` | `kimi` | `kimi-k2.7-code` | skip vision + **temperature 1** | 代码档；API 仅受理温度 1 |
| 17 | `kimi-k2.7-code-highspeed` | `kimi` | `kimi-k2.7-code-highspeed` | skip vision + **temperature 1** | 极速档；API 仅受理温度 1 |
| 18 | `minimax-m3` | `minimax` | `MiniMax-M3` | 全维 | 多模态；model ID = API 字面 |
| 19 | `minimax-m2.7-highspeed` | `minimax` | `MiniMax-M2.7-highspeed` | skip vision | 极速档；model ID = API 字面 |
| 20 | `hy3` | `tokenhub` | `hy3` | skip vision | 无视觉（实测）；判官 B 位同键 |
| 21 | `doubao-seed-2-1-pro-260915` | `ark` | `doubao-seed-2-1-pro-260915` | skip vision | 字节旗舰（spec 未建行） |
| 22 | `doubao-seed-2-1-turbo-260628` | `ark` | `doubao-seed-2-1-turbo-260628` | skip vision | 中档（spec 未建行） |
| 23 | `doubao-seed-2-1-lite-260915` | `ark` | `doubao-seed-2-1-lite-260915` | skip vision | 轻档；**已实测通过（404 已翻转）** |

**维度面判据**：`skipDims: ["vision"]` = 该档无视觉位——`model-specs.mjs` 无行 / 未声明 `multimodal` ⇒ 核面剥离图像（`thincoder-core/provider/core.mjs` 的 `stripImagesForTextModel`——父侧 2026-09-24 路径收正 · 可 revert）⇒ 跑视觉维 = 假测量（spec 未建行的档按保守面处理；补行 = 三端产品树另批议题）。**全维 = 8 自动维 + 人工 lane 照跑**。

### 2.4 机制设计：模型级温度例外（KD-31）

**机制**：`models.json` 条目增**可选字段 `temperature`**（0–2 数字；缺省 ⇒ 0 = 冻结缺省）——仅当该模型 API 拒收 `temperature: 0` 时逐档显式开（准入依据 = 探针实测在册）。

链路（三处 + 一个披露句）：① `lib/roster.mjs` 校验（存在 ⇒ 有限数字且 0 ≤ t ≤ 2；非法 ⇒ 装载即拒——体例同 `dims`）；② `lib/pipeline.mjs` provider 条目构造两分支（dry-run / live）改读 `entry.temperature ?? 0`，并在 `models[]` 记录实际值（`temperature` 字段入档）；③ `lib/report.mjs` 概览（模型表后）派生**温度例外披露句**：`(models[].temperature ?? run.temperature) ≠ run.temperature` 的档逐条列出（label + 取值）；无例外 ⇒ 该句不出现（旧档缺字段 ⇒ 等价缺省——**非历史兼容分支，是缺省语义**）；④ 版本口径 = **不 bump**（`SUITE_VERSION` 恒 5 · `judge.json` ±0——温度属运行参数面，同 `--max-tokens`：参数入档 + 报告披露，四轴零改）。

**披露面（机制摊开 · 用户点名要求）**：报告概览披露句 + 结果 JSON `models[].temperature` + `models.json` note（能力注记）；跨档比较的测量条件差异**不得静默**——kimi 四档为 1、其余全 0。

### 2.5 价格补录候选 22 条（逐条取证；取不到 ⇒ 缺价如实）

| 组 | 键（`provider:model`） | 来源（官方页） |
|---|---|---|
| glm 3 | `glm:glm-5.3` · `glm:glm-5.3-flashx` · `glm:glm-4.5-air` | 智谱 BigModel「API 定价」（docs.bigmodel.cn） |
| qwen 9 | `qwen:qwen3.8-max` · `qwen3.6-plus` · `qwen3.6-flash` · `qwen3.7-max` · `qwen3.7-plus` · `qwen3.7-flash` · `qwen3.8-27b` · `qwen3.6-27b` · `qwen3.5-27b` | 阿里云百炼「模型信息 / 计费」（help.aliyun.com） |
| kimi 4 | `kimi:kimi-k3` · `kimi-k2.6` · `kimi-k2.7-code` · `kimi-k2.7-code-highspeed` | Moonshot 开放平台定价页 |
| minimax 2 | `minimax:MiniMax-M3` · `minimax:MiniMax-M2.7-highspeed` | MiniMax 开放平台定价页 |
| ark 3 | `ark:doubao-seed-2-1-pro-260915` · `-turbo-260628` · `-lite-260915` | 火山方舟「模型服务计费」（volcengine.com） |
| tencent 1 | `tokenhub:hy3` | 腾讯云 TokenHub 定价页 |

纪律：单位 = 元 / 百万 token（**页面按 K 计价须换算**）；`cachedInput` 有则录；`source` + `asOf`（= 取证日 2026-09-24）条目级；**相对口径不得转写为数字**；取不到价 ⇒ **不录**（警告路径已备）。已录 7 条（mimo×3 / deepseek×2 / zhipu-plan:glm-5.3-flash / qwen3.8-flash）零改。

### 2.6 受影响文件与测试面（现状 = 设计轮实读行数）

| 文件 | 现状 | 预期增量 | 说明 |
|---|---|---|---|
| `bench/models.json` | 53 | +~185（23 条 × ~8 行） | 6 → 29 档（现役 6 条零改） |
| `bench/prices.json` | 71 | ≤ +~200（22 候选 × ~9 行） | 能录尽录；缺价不录 |
| `bench/lib/roster.mjs` | 65 | +6 ±3 | `temperature` 字段校验（fail-closed） |
| `bench/lib/pipeline.mjs` | 269 | +3 ±1 | 温度透传（两分支）+ `models[]` 记录实际值 |
| `bench/lib/report.mjs` | 198 | +6 ±3 | 概览温度例外披露句（派生 · 仅存在例外档时） |
| `bench/README.md` | 174 | +6 ±3 | `temperature` 字段文档 + 29 档名单注 |
| `bench/test/roster.test.mjs` | 0（新增） | ~110 | 数据面二测迁入 + `roster.1–3` / `temperature.1` |
| `bench/test/suite.test.mjs` | 264 | −56 ±5 | 数据面二测迁出（越线降载；净降） |
| `bench/test/report-present.test.mjs` | 108 | +14 ±4 | `render.5`（披露句在位 / 反例） |
| `bench/test/fixtures.mjs` | 170 | +6 ±3 | 夹具 `models[]` 补 `temperature` |
| `bench/results/` | 1 对（v4） | **±0** | 不重跑（v5 = 批尾点火）· 不重出（旧档缺字段 ⇒ 渲染按缺省） |
| `bench/cases/index.mjs` · `bench/judge.json` | 66 · 25 | **±0** | 不 bump（恒 5） |
| `docs/core/design/MODEL-BENCH.md` | 1138（本批前读数——就地更新后 **1187** 行 · 2026-09-24 修正轮实读） | 就地更新 | §1.3 / §2.1-4 / §2.2-12 / §2.3 / §2.4 / §3 / §4 KD-31 / §5.13 / §6 / §7-13 / §9 指针 / 变更记录 |

### 2.7 验收对照（AC → 设计落点 → 判定方式）

| AC | 判据 | 设计落点 | 判定方式 |
|---|---|---|---|
| AC-1 | 29 档解析（`--models` 逐名在册） | 设计 §2.4（清单 = 数据档）· §3 本批表 | `roster.1`（29 条 + 29 label 逐名解析）+ dry-run |
| AC-2 | 价格能录尽录 + 缺价如实（不编价） | 设计 §2.5（schema / 取值纪律零改） | `roster.3`（键命中自身 + 无孤儿）+ 逐条 source / asOf 对读（§5 取证记录） |
| AC-3 | kimi 温度结论与腿 | 设计 §2.1-4 / §2.2-12 / §2.3 / §2.4 / KD-31 | `roster.2` + `temperature.1` + `render.5` |
| AC-4 | 测试全绿 | ——（实施面） | `node --test "bench/test/*.test.mjs"`（读数入 §5） |
| AC-5 | 29 档复现命令在档 | 本 §2.1 | 命令在档 + README 名单注（人工对读） |
| AC-6 | 版本口径 = 不 bump | 设计 §1.3（温度 = 运行参数面）· KD-31 | `SUITE_VERSION` / `frozenAtSuiteVersion` 断言零改（恒 5） |

### 2.8 关键决策（详见设计档 §4 KD-31 + §3 本批表）

1. **温度例外机制 = KD-31**（数据面字段 · 非 CLI 参数；不 bump）——被否：全局 `--temperature` / 照实 error 不列 / 判官面同开 / 核 spec 表加 `tempRange` / bump。
2. **glm 三档走 `glm` 原厂**（zhipu-plan 实测无 flashx 权限）；现役 `glm-5.3-flash` 的渠道零改。
3. **无视觉位档 `skipDims: ["vision"]`**（spec 未声明 / 实测无）——被否：全维跑（图像被核面剥离 ⇒ 假测量）。
4. **测试面降载**：`suite.test.mjs` 264 行 + 新腿 ⇒ 越线，数据面二测迁 `roster.test.mjs`（先例：judge.13 / FROZEN_PROMPTS 降载）。
5. **v4 在档零改**：旧档缺 `models[].temperature` ⇒ 渲染按缺省（披露句不出现——与 v4 实态一致）。

### 2.9 上抛项 / 待办（不阻本批交付）

1. **判官与被测重合面变化**（既定机制照走 · 用户 14:37 不动判官）：被测集扩容后 B 位 `tokenhub:hy3` 与 C 位 `deepseek:deepseek-v4-pro` 由「同渠道 / 无重合」变为**同位（自判）**——报告逐位明示 + warnings 照出（`judge.5` 机制，不拒跑）。
2. **spec 未建行的 9 档**（kimi-k2.6 / k2.7-code / k2.7-code-highspeed · minimax-m2.7-highspeed · doubao-seed-2-1 三档 · qwen3.5-27b · qwen3.7-plus）：`thincoder-core/model-specs.mjs` 补行 = 三端产品树面（另批议题）；本批按保守面（无视觉位）。
3. **hy3 价格**：tokenhub 定价页若查不到官方价 ⇒ 缺价如实（判官 B 位同键 —— 报告已按「已录价位之和」口径句处置）。


### 2.10 修正轮落点（评审轮 1 #3–#7 + 用户 14:57 / 14:58 裁定并入 · 2026-09-24）

| # | 处置 | 落点 |
|---|---|---|
| 3 | §2.2 探针结论逐档列（24 档目标名 = 拒 4〔kimi〕/ 受理 18 / 已实测通过 1〔`doubao-seed-2-1-lite-260915` · 404 已翻转〕/ 排除 1〔`doubao-seed-2-0-code-preview-260215` · 用户 14:57 裁定〕）；计数与枚举对平（4+18+1+1 = 24 = 在册 23 + 排除 1；未验 = 0） | 本档 §2.2 |
| 4 | 设计档 §2.4 models.json 样例补 `temperature` 形（缺省省略 + 例外档示例各一） | `MODEL-BENCH.md` §2.4 |
| 5 | 设计档 §5.13 分档句补 `bench/test/report-present.test.mjs`（呈现面）/ `bench/test/roster.test.mjs`（数据面） | `MODEL-BENCH.md` §5.13 |
| 6 | 设计档 §3 本档行控点对齐（1138 本批前读数〔git HEAD 实核〕+ 就地更新后 1187 行）；本档 §2.6 镜像同步 | `MODEL-BENCH.md` §3 · 本档 §2.6 |
| 7 | `render.5` 增旧档缺字段腿（缺字段 ≡ 全 0——`??` 缺省语义，§2.2-12） | `MODEL-BENCH.md` §5.13 |

**裁定并入（14:57 / 14:58）**：名单 30 → **29 档**（`doubao-seed-2-0-code-preview-260215` 排除 · 不恢复 · §2.9 原「方舟两档处置」项随之删——无待处置）；价格候选 23 → 22（ark 4 → 3）；计数同步面 = §2.1（29 档 · 复现命令 `roster-29-v5` / `roster-29-dry` · 预算 812 run）· §2.2 · §2.3（23 行）· §2.5 · §2.6 · §2.7 AC-1 / AC-5；设计档 §3 / §5.13 / §6 / §9 / 变更记录同步；preview 原则句落 §2.1「边界」（14:58）。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

**评审对象**：`docs/core/design/MODEL-BENCH.md`（roster-expand）§1.3（`:49`）· §2.1-4（`:93`）· §2.2 样例与纪律（`:126` / `:197`）· §2.3 概览披露句（`:205`）· §2.4 字段行（`:268` / `:270`）· §3 本批表（`:664-680`）· KD-31（`:718`）· §5.13（`:922-929`）· §6 AC（`:1037-1046`）+ `docs/batches/2026-09-24-bench-roster-expand.md` §2

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Requirements（名单计数） | 🟡 | 同一批两读法并存：`docs/batches/2026-09-24-bench-roster-expand.md:26`「**+ 现役 4 档**（`mimo-v2.6-flash` · `deepseek-flash` · `glm-5.3-flash` · `qwen3.8-flash`）⇒ 一轮 = 14 档」+ `:73`「§1.1 十档 + … + 现役 4 档」 vs `:83`「现役 **6** 条零改 + 新增 **24** 条 = §1.1 表 **8** 新 + …」+ `:104-131` 24 行映射表（**不含** `mimo-v2.6-pro` / `mimo-v2.6-pro-ultraspeed`）+ `docs/core/design/MODEL-BENCH.md:668`「6 → 30 档（24 新增条目 … 现役 6 条零改）」——两读法相差 2 档：若以 §1.1 为准（该两档属新增）则 §2.3 表缺 2 行 ⇒ 终排 28 档、AC-1「30 档」不达。旁证指向现役 = 6：`MODEL-BENCH.md:1082-1087` 初始 6 条含该两档；批档 `:154`「已录 7 条 = mimo×3 / deepseek×2 / …」的分解仅在 6 档名册下自洽（mimo×3 须为在册条目，否则触 `roster.3` 无孤儿判据）；批档 `:160`「models.json 现状 53 行」≈ 6 条 × ~8 行。 | 二取一并留单源：① 批档 `:15-26` 该两行移出「加入档」（现役列改 6）+ `:73` 分组同步为「§1.1 八新 + 现役 6」；② 或按「现役 4」补 §2.3 两行并同步 §2.1 / §3 / §6 的 24 / 30 计数。定后 `roster.1` 的期望值（30 条）随之锁定。 |
| 2 | Doc hygiene | 🟡 | 批档 `:133`（§2.3「维度面判据」判据行）仍携笔误路径 `thindercoder-core/provider/core.mjs`，而 `:200` 保留「**更正（同轮）**：§2.3…应为 `thincoder-core/provider/core.mjs`」——失效表达未就地删除 + 下游修订式修正句两存（D8 / 文档卫生口径：现役判据行不留「原记 X ⇒ 收正 Y」残句）。判据行内指针现态不可解析 + 修正句分离 ⇒ 两读。 | `:133` 就地改 `thincoder-core/provider/core.mjs`；`:200` 更正句随之删（路径自述已足，历史不需另留）。 |
| 3 | Requirements / 证据完整性 | 🔵 | 批档 `:100`「其余 20 档（glm 3 / qwen 9 / minimax 2 / ark 3 / hy3 / deepseek-v4-pro）`temperature: 0` 全部 200 通过」——括号枚举 = 3+9+2+3+1+1 = **19**（24 − 4 kimi = 20 ⇒ 缺 1 档）；且 ark 两档（`:102` ① lite `404 ModelNotOpen` ② code-preview `429 SetLimitExceeded`）既在阻断面又落「全部 200 通过」面 ⇒ 该两档「`temperature: 0` 受理」未被 200 实测（KD-31 准入依据 = 探针实测，未验档现按缺省 0 假设）。 | 逐档补探针结论列（24 档 × 受理 / 拒 / 未验）或对该两档如实标「未验」；两档账户处置（§2.9 `:195`）后各补一发 `temperature: 0` 探针——若拒 0 则按 KD-31 走例外档（依据在册）。 |
| 4 | Clarity | 🔵 | `MODEL-BENCH.md:250-257` 的 models.json 样例块未含本批新字段 `temperature`（字段表 `:268` 已列、纪律 `:270` 已写）——样例与字段表不同步。 | 样例补 `temperature` 一形（缺省省略 + 例外档示例各一），或加注「可选字段清单见下表（`temperature` 缺省省略）」。 |
| 5 | Clarity | 🔵 | `MODEL-BENCH.md:889-890` §5.13「分档」句枚举测试档（judge / graders / report-render / recompute / timing）未纳本批新增 `bench/test/roster.test.mjs`（表内 `:922-926` 已逐行标「新增档」），亦未纳既有 `report-present.test.mjs`——分档单源句落后于表。 | 分档句补「**数据面** = `roster.test.mjs`（本批新增）」与 `report-present.test.mjs`，或改为「测试档逐行见下表『测试档』列」以消枚举维护面。 |
| 6 | Affected-file annotations | 🔵 | `MODEL-BENCH.md:680` 本档行「现状 = 1139」，同表上一批行 `:662` 记「就地更新后 **1138** 行」——同表两行差 1（读数控点）；本档行亦未按 `:662` 先例标注就地更新后行数（本档现实读 1185 行）。 | 现状数对齐上一批收口值（或注明读数时点 / 来源）；比照 `:662` 补「就地更新后 N 行」。 |
| 7 | Acceptance criteria / 测试严格度 | 🔵 | `MODEL-BENCH.md:926` `render.5` 两态夹具 = ① 例外档 ② 全 0；**缺「旧档缺 `models[].temperature` 字段」腿**——而 `:197`（§2.2-12）与 `:678` 明示 v4 在档恰走该路径（旧档缺字段 ⇒ 披露句不出现），该路径无断言；披露句字面亦未如 §2.3-8 冻结串先例给单源常量（`:926` 断言锚 = 「温度例外」+ label + 取值）。 | `render.5` 增第三腿（夹具删 `temperature` 键 ⇒ 与 ② 同断，或注明缺字段 ≡ 全 0 的等价性由 `??` 保证）；如需逐字断言，按 §2.3-8 先例给冻结字符串（同源常量）。 |

**VERDICT: pass** —— 计数：🔴 0 · 🟡 2 · 🔵 5（合计 7 条）。无 Critical ⇒ 通过；两条 🟡 按报告式处置不阻断。

### 轮次 2（评审子代理）

**评审对象（轮 2 · 复审）**：`docs/core/design/MODEL-BENCH.md`（修正轮 #23 后）§2.4:253-258 · §5.13:892/:928 · §3:670-682 · §6:1039-1049 / §9:1076-1123 / 变更记录:1185-1187 + 本档 §2.1–§2.10。落地核验：修正轮 #3–#7 全落（#4 §2.4:257 例外档形 · #5 §5.13:892 补两档 · #6 §3:682 = 1138→1187〔实读 1187 内容行对平〕· #7 §5.13:928 三腿 · #3 本档 §2.2）· 30→29 全链对平（设计 §3:670/675/676/681 · §5.13:924/926/927/928 · §6:1043/1047 · §9:1078 · 变更记录:1185/1187 · 本档 §2.1/§2.2/§2.3/§2.5/§2.6/§2.7）· preview 原则句在位（本档 §1.11:95 / §2.1:103）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Doc state | 🟡 | `MODEL-BENCH.md:892`（§5.13 分档句）「采集面 = `bench/test/timing.test.mjs`（**本批新增**——`timing.1`）」——该档非本批新增：由上一批 `2026-09-24-error-duration` 引入且已实施（`:652` 批头「新增一档 = `bench/test/timing.test.mjs`」· `:659`「0（新增）… 实施读数 58」），本批新增档单源 = `:666`「新增一档 = `bench/test/roster.test.mjs`」；同句 `render.5` / `roster.test.mjs` 两处「本批」= 本批（roster-expand）⇒ `timing` 的「本批新增」出现两读（本批待建 / 已实现）。 | 该档按归属改写为「已实现」（或去「本批」限定、标 `timing.1` 所属批），与本批两个「本批新增」区分开。 |
| 2 | Affected-file annotations | 🔵 | 同档 §3 表 `bench/judge.json` 现状数两值并存：`:567` / `:607` / `:628` / `:649` = 26 vs `:663` / `:681` = 25（本批修正轮按实读收正 → 25，见 `:1187` ③）；该档在这些批之间无增删行内容变化 ⇒ 26 / 25 不可能同为真值，旧行读数未随收正同步。 | 旧行按同一计行尺统一（或标注读数时点 / 「历史读数，以最新行为准」），消同表两值。 |
| 3 | Document ownership | 🔵 | preview 通用原则（用户 14:58 裁定「今后名单维护照此」）只落本档 `:95`（§1.11）/ `:103`（§2.1 边界）＝批次记录面；名单纪律的设计面单源（`MODEL-BENCH.md:270` / `:272` §2.4 字段表与纪律、`:1078` §9 现行名单注）与维护面（`bench/README.md` 名单注＝本批交付项，本档 `:110` / `MODEL-BENCH.md:675`）均未载该通则。 | 在 §2.4 纪律（或 §9 名单注）与 README 名单注补一句「preview 档不入测试名单（通用原则）」——维护轮在设计面即可读到该约束（批档 §1 为记录面，非维护入口）。 |
| 4 | Doc hygiene | 🔵 | 本档 `:229` 留「（本条为设计轮交付说明，路径更正已就地落 §2.3，历史不需另留。）」——评审轮 1 #2 处置为「更正句随之删」，现文仍携「更正已落…」的修订过程注记（修订式表达留在 §2 设计面）。 | 删该句（路径已在 §2.3 自述）；留痕归批档记录面。 |

**VERDICT: pass** —— 计数：🔴 0 · 🟡 1 · 🔵 3（合计 4 条）。无 Critical ⇒ 通过；1 条 🟡 按报告式处置不阻断。

## §4 用户批准（主 agent）

**状态行**：✅ 已批准（2026-09-24 · 父侧代签——用户 14:37–14:58 连续裁定 + 排空授权口径）

**批准依据**：① 设计评审两轮全 **pass**（§3：轮 1 🟡2/🔵5 → 修正 #23；轮 2 🟡1/🔵3 → 父侧直接执行收正）；② 修正轮 #23 落地经轮 2 复审逐项确认（#3–#7 + 30→29 全链 + preview 原则句 + 计数对平）；③ 设计凭证已签发（凭证值按工具纪律不落档）。
**批准范围**：设计档本批面（§1.3 温度条 · §2.1-4 · §2.2-12 · §2.3 披露句 · §2.4 字段与纪律 ⑤ · KD-31 · §5.13 `roster.1–3` / `temperature.1` / `render.5` · §6 AC-1..AC-7）+ 批档 §2 任务书（§2.3 逐档映射表 / §2.4 机制 / §2.5 价格候选）。
**用户裁定并入**：名单终态 **29 档**（`doubao-seed-2-0-code-preview-260215` 排除 · 不恢复）· **preview 档不入名单**（通用原则）· **判官三槽不动**。
**轮 2 四条处置**（父侧直接执行 · 可 revert · 已落）：`:892` 归属收正 / `bench/judge.json` 计数统一 25（4 行）/ §2.4 纪律 ⑤ + §9 名单注补 preview 通则 / 批档 §2.9 残句删。
**放行**：实施轮（eng-coder）派发——files = `bench/models.json` · `bench/prices.json` · `bench/lib/roster.mjs` · `bench/lib/pipeline.mjs` · `bench/lib/report.mjs` · `bench/README.md` · `bench/test/roster.test.mjs`（新增）· `bench/test/suite.test.mjs` · `bench/test/report-present.test.mjs` · `bench/test/fixtures.mjs`。

## §5 实施记录（eng-coder）
**状态行**：实施完成 2026-09-24（29 档 + 价格 18 录入 / 4 缺价如实 + KD-31 温度例外全链；node --test 75/75 绿；分歧审计 1 轮 · 内部代码评审 2 轮均 pass（终态 clean））



### 5.1 交付摘要（逐条 → 落点）

| # | §2.1 条目 | 交付 | 落点 |
|---|---|---|---|
| 1 | 受测名单 6 → 29 档（现役 6 条零改 + 新增 23 条） | ✅ 逐档 = §2.3 表（label / provider / model / 维度面 / note） | `bench/models.json:53-239`（现役 6 条 `:4-51` 零改；kimi 四档 `"temperature": 1` = `:163` / `:172` / `:181` / `:190`） |
| 2 | 价格补录（22 候选） | ✅ 能录尽录 = **18 条**（官方页逐条取证）；**缺价如实 = 4 条**（不录、不编价——走既有「价格未录」警告路径） | `bench/prices.json:70-223`（既有 7 条零改） |
| 3 | kimi 温度例外（KD-31） | ✅ 全链 = 字段 → 校验 → 透传 → 入档 → 披露句 → 测试五腿 | `bench/lib/roster.mjs:41-43` · `bench/lib/pipeline.mjs:170-171` / `:205` · `bench/lib/report.mjs:41-43` / `:56-58` |
| 4 | 名单注 | ✅ 29 档 + `temperature` 字段 + preview 通则 | `bench/README.md:131-132` / `:142-144` |
| 5 | 测试面 | ✅ `roster.1-3` / `temperature.1` / `render.5` 三腿 + 数据面四测迁出（零断言丢失） | `bench/test/roster.test.mjs`（新增 · 156 行 · `:48` / `:61` / `:87` / `:113`）· `bench/test/suite.test.mjs`（原 `:173-228` 行段迁出 · 264 → 203 行）· `bench/test/report-present.test.mjs:111-124` · `bench/test/fixtures.mjs:76-90`（变体件）+ `:131` / `:143`（夹具注入两处） |
| 6 | 跑批 v5 | ⏸ 按设计不跑（批尾点火 = 用户点名；本轮只到「可跑准备就绪」） | —— |

### 5.2 运行命令与读数（可复现）

| 命令 | 读数 |
|---|---|
| `node --test "bench/test/*.test.mjs"` | **75 tests / 75 pass / 0 fail**（exit 0）——含新增 `roster.1-3` / `temperature.1` / `render.5`；修复轮后复跑同读数 |
| `node bench/run.mjs --dry-run --models <29 名> --label roster-29-dry`（`BENCH_RESULTS_DIR` = 临时沙箱 ⇒ `bench/results/` 零触碰） | exit 0 · 29 条入档 · 770 step 行（812 − 42 skipped）· `run.temperature = 0` · 例外档 = kimi 四档 = 1 · md 含「温度例外」披露句 · warnings 8 条（判官三位同位自判 3 + 价格未录 4 + 判官 B 位缺价 1） |
| `git status --porcelain` / `git diff --stat` | 改动 = files 清单十档（9 改 + 1 新增）；`bench/results/` · `bench/cases/` · `bench/judge.json` 零 diff |

### 5.3 价格取证记录（AC-2 逐条对读 · 条目级 asOf = 2026-09-24）

**录入 18 条**（source = 官方页；数值 = 页面读数 · 单位 元/百万 token）：
- 智谱 BigModel「API 定价」（docs.bigmodel.cn/cn/guide/start/pricing）：`glm:glm-5.3` 8 / 28 / 缓存 2；`glm:glm-5.3-flashx` 2 / 7 / 0.57；`glm:glm-4.5-air` 0.8 / 2 / 0.16（分档——取 输入 [0,32K)·输出 [0,0.2K) 档，note 在册）。
- 阿里云百炼「模型调用价格」（help.aliyun.com/zh/model-studio/model-pricing；华北2·北京表）：`qwen3.8-max` 12 / 36 / 1.5（另见其模型信息页）· `3.6-plus` 2 / 12 · `3.6-flash` 1.2 / 7.2 · `3.7-max` 12 / 36 · `3.7-plus` 2 / 8 · `3.7-flash` 0.2 / 0.8 · `3.8-27b` 3 / 12 · `3.6-27b` 3 / 18 · `3.5-27b` 0.6 / 4.8（阶梯档位入 note）。
- Moonshot（Kimi）开放平台「模型推理定价」（platform.moonshot.cn/docs/pricing/chat）：`kimi-k3` 20 / 100 / 2（缓存写入另计——成本式无该项，note 在册）· `kimi-k2.6` 6.5 / 27 / 1.1 · `kimi-k2.7-code` 6.5 / 27 / 1.3 · `kimi-k2.7-code-highspeed` 13 / 54 / 2.6。
- MiniMax 开放平台「按量计费」（platform.minimaxi.com/docs/guides/pricing-paygo）：`minimax:MiniMax-M3` 2.1 / 8.4 / 0.42（标准档 ≤512k）· `minimax:MiniMax-M2.7-highspeed` 4.2 / 16.8 / 0.42。

**缺价 4 条（如实 · 不录 · 不编价）**：
- `tokenhub:hy3`：TokenHub 产品定价页（cloud.tencent.com/product/tokenhub）可见表内未列 Hy3（列 Hy4 preview / GLM / Kimi / DeepSeek / MiniMax）——§2.9-3 预授权「查不到官方价 ⇒ 缺价如实」；判官 B 位同键（账目 `null` + 警告）。
- `ark` 三档（`doubao-seed-2-1-pro-260915` / `-turbo-260628` / `-lite-260915`）：火山方舟官方文档（www.volcengine.com/docs/82379/1099320「模型价格」；docs.volcengine.com 同页）**JS 门控 / 区域封锁**——抓取仅得导航壳（正文 <300 字符），官方单价表不可读 ⇒ 缺价如实（第三方转述数值**不采信、不转写**）。
- 运行影响 = 四档成本格 `—` + warnings「价格未录：…」（既有路径，不阻断）。

### 5.4 决策透明（实施轮自决项）

| # | 决策 | 理由 |
|---|---|---|
| 1 | 数据面迁出范围 = 4 测（models schema / models fail-closed → 并入 `roster.2` / prices schema / prices orphan → 并入 `roster.3` 首腿） | §2.6 预测 −56 ±5 行；实读 −61（264 → 203）。逐条对读确认**零断言丢失** |
| 2 | `roster.2` 增「例外档白名单 = kimi 四档」数据面腿（设计行未点名） | KD-31「仅拒收 0 的档显式开」的机检化（收紧型守卫）；不扰动既有断言 |
| 3 | `models.json` 的 `glm-5.3-flashx` note 回 §2.3 表原文「（plan 无权限）」 | 审计轮报实现写 `zhipu-plan` 与表文非等值表述 ⇒ 就地回表文（记录面留痕） |
| 4 | `roster.mjs` 档头补「例外档宜核 spec 无 `tempRange`」注释（代码评审 🔵 #2） | 入档值 = 请求值依赖该不变量（核按 `spec.tempRange` 裁剪——`thincoder-core/provider/core.mjs` 侧）；现值四档无 `tempRange`，成立 |
| 5 | `roster.test.mjs` 临时目录改 `after` 收尾（代码评审 🔵 #3） | 体例同 `fixtures.mjs:20-22`；不再遗留 `bench-roster-*` 目录 |

### 5.5 自含交付协议：审计 / 评审轮次 · fix round · 终态

| 轮 | 形态 | 结论 | 处置 |
|---|---|---|---|
| 分歧审计（explore · 只读） | 1 轮 | DEVIATIONS：🔴 0 / 🟡 0 / 🔵 1（note 措辞等值）+ 过程面 1 条（§5 空） | 🔵 就地回表文（5.4 #3）；过程面由本 §5 关闭 |
| 内部代码评审（advisor · code） | 轮 1 | **pass**：🔴 0 / 🟡 1（report-only：§5/§6 取证留档缺位——即本节要补的记录）+ 🔵 3 | 🟡 由本 §5 关闭（读数 + 取证在册）；🔵 #2 / #3 修复落地（5.4 #4 / #5）；🔵 #4（设计档 §3「预期增量」行数控点）→ 收口轮 |
| fix round | 1 轮 | 3 项（表文回正 + 注释补核面 + 测试收尾）；复跑 75/75 绿 | —— |
| 内部代码评审（advisor · code） | 轮 2（fix-verification） | **pass**：两处修复经逐字核验已落地、未引入新缺陷 | 终态 = **clean** |

**版本口径（复核）**：`SUITE_VERSION` 恒 5（`bench/cases/index.mjs:22`）· `bench/judge.json` 零改 · `bench/results/` 零 diff · 判官三槽零改 · `cases/` 题集零改 · 判分 / 计时逻辑零改 · 三端产品树零改。

**边界申报（如实）**：真批 v5 未跑（批尾点火 = 用户点名）；`roster.2` 白名单腿 = 超设计收紧（5.4 #2）；`docs/core/design/MODEL-BENCH.md` 工作树未提交改动 = 父侧评审修正轮所留（非本实施轮）；`bench/results/` 真批产物零触碰（dry-run 验证走临时沙箱）。

## §6 验证与收口（父代理）

**状态行**：✅ 已收口（2026-09-24）

**验收（父侧独立 · 不复用实施轮自报）**：① 测试复跑 = `node --test "bench/test/*.test.mjs"` ⇒ **75/75 pass · 0 fail · skipped 0**（log = `.thincoder/tmp/acc3.log`）；② 实读核 ≡ 设计：`bench/models.json` kimi 四档 `"temperature": 1`（`:163`/`:172`/`:181`/`:190`——k2.6 / code / highspeed 带 `skipDims: ["vision"]` 保守面 · k3 全维）· `bench/lib/report.mjs:41-43`/`:56-58` 披露句派生（`(m.temperature ?? runTemp) !== runTemp` ⇒ 逐档列 label 与取值；无例外 ⇒ 不出现）· `bench/lib/roster.mjs:41-43` 校验 fail-closed；③ `bench/results/` / `bench/cases/` / `bench/judge.json` 零 diff（`git status` 核）；④ 改动面 = files 十档 + 设计档（父侧收正）+ 批档（新增）；⑤ 版本面零改（`SUITE_VERSION` 恒 5——测试断言核）。

**实施读数对账（设计 §3 本批表收正）**：models.json 241（预算 ~238 → **+3 超带**）· prices.json 225（≤271 内——18 录 + 4 缺）· roster.mjs 71 ✓ · pipeline.mjs 268（预期 271–273 → **−4**）· report.mjs 203 ✓ · README.md 178 ✓ · roster.test.mjs 156（预算 ~110 → **+46 超带**）· suite.test.mjs 203 ✓ · report-present.test.mjs 124 ✓ · fixtures.mjs 180 ✓——三处超带按实施读数就地收正（父侧 · 可 revert）。

**价格取证**：**18 条官方页录入**（智谱 BigModel 定价页 / 百炼「模型调用价格」华北2·北京 / Moonshot 定价页 / MiniMax「按量计费」页——逐条 `source` + `asOf` 2026-09-24）；**4 条缺价如实**（`tokenhub:hy3` 定价页未列该档 + `ark` 三档官方页 JS 门控不可读 ⇒ **不采信第三方、不编价**——成本 `—` + 既有「价格未录」警告路径）。

**剩余事项**：① **跑批 v5 点火 = 用户点名**（`node bench/run.mjs --label roster-29-v5`；复现命令在批档 §2.1）；② ark 价格 3 条缺（官方页门控——如后续可读按同纪律补录）；③ 范围外承 §2.9（判官重合面明示照走 / 9 档 spec 行另批）。

**台账**：#261（MODEL-BENCH · 归批）——在途 → 待核销 → 已核销（evidence = 75/75 + dry-run 29 档 + 提交号）。
