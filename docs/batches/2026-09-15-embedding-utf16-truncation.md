# 缺陷修复 · embedding 输入截断把 emoji 切成孤立代理对（400/20015）· 批次记录（2026-09-15）

> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务（eng-designer）· §3 设计评审（评审子代理）·
> §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-09-15 · 来源 = 网友报告（经用户转达，2026-09-15 23:24）+ 父侧实核根因（三处码元截断）。
> 规模 = **缺陷修复小批**（截断路径统一 + 反向用例；不扩面——其他待办另批）。

## §1 讨论（主 agent）

### 1.1 问题（网友实测）

配置**硅基流动** embedding 的 key 后，索引/记忆写入报：

```
Embedding API error 400: {"code":20015,"message":"The parameter is invalid. Please check again.","data":null}
```

网友本地排查结论（经用户转达）：**文本含 emoji，在切分时被拆开了字符编码**，服务端做 UTF-8 编码时无法表达 ⇒ 400/20015。其 AI 建议改核内 embedding 实现。

### 1.2 根因（父侧实核——三处码元截断）

| # | 位置 | 形态 |
|---|---|---|
| ① | `thincoder-core/memory/docs.mjs:162` | `` `${r.heading || r.path}\n${r.content.slice(0, EMBED_TEXT_MAX_LEN)}` `` |
| ② | `thincoder-core/memory/core.mjs:172` | 同上形（`r.content.slice(0, EMBED_TEXT_MAX_LEN)`） |
| ③ | `thincoder-core/memory/code-sync.mjs:344` | 同上形 |

`EMBED_TEXT_MAX_LEN = 2000`（`thincoder-core/memory/core.mjs:16`）。

**后果链**：`String.prototype.slice` 按 **UTF-16 码元**切 ⇒ emoji（代理对）恰跨第 2000 码元边界时被切成**孤立代理对** ⇒ `JSON.stringify` 产出 `"\ud83d"` 形态（合法 JSON 文本、非法 Unicode 标量）⇒ 服务端 UTF-8 编码不可表达 ⇒ **400 / 20015**（与报错逐字吻合）。

**旁证（同根先例已在案）**：本项目已为同类缺陷做过修复——`thincoder-core/agent/helpers.mjs:41-49` 与 `thincoder-core/agent/setup.mjs:24-33` 载有「UTF-16 安全截断（**2026-09-02 deepseek 400 根因**）」helper（截尾时丢弃孤立高/低代理）；`thincoder-core/escape.mjs:17` 亦记同族。⇒ 本缺陷 = **同一根因在记忆/检索板三处未覆盖**。

网友所提 `embedding.mjs` 经核**非病灶**（该处只有 `BATCH_SIZE = 32` 的数组分批，不切字符串）。

### 1.3 修复方向（父侧裁定 · 交 §2 出任务书）

**三处统一走安全截断**（截断点落在代理对内 ⇒ 回退一个码元；非边界文本逐字不变 ⇒ 零行为变化）——复用既有 helper 或抽核内共用件（落点与形态由设计定：`agent/*` 的 helper 与 `memory/*` 属同核不同子系统，跨子系统引用的落点需给判据）。

**必有面**：
1. **反向用例（硬项）**：emoji 恰落 2000 边界 ⇒ 送 embed 的请求体**无孤立代理对**（可机判：对 `JSON.stringify(body)` 扫孤立代理正则 `[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]` ⇒ 0 命中）；**修前必红**；
2. 边界用例：截断点 = ASCII / BMP 字符 / emoji 恰跨界 / 文本短于上限（逐字不变）;
3. 同链核查：送 embed 的其他字符串面（查询侧 / 其他截断点）**只登记不扩面**。

### 1.4 范围边界

只修此路径（三处 + 测试 + 对应文档行）；核其他盘、CLI/VSC 端、台账均不动。

## §2 批次任务（eng-designer）

> 父侧代写落档（源 = eng-designer 本席报告附录，**逐字**；写通道因骨架缺失 fail-closed——补骨架后由父侧落档，零加工）。

> 编制：eng-designer · 2026-09-15 · 依据 = 本档 §1（逐字）＋本席独立勘察（零 explore 委派——勘察预算未用；全部读数 file:line 实核）。
> 修复形态 = **复用核级单一来源**（`thincoder-core/text-budget.mjs:55` 的 `safeSliceUTF16`）——非 §1 候选 ① / ②，选型见表 2.2。

### 2.1 目标（一句定位）

配置 embedding 服务（硅基流动等严格 UTF-16 解析端）的用户，索引 / 记忆写入不得因**送 embed 文本的码元级截断**把 emoji 切成孤立代理而 400 / 20015——
三处截断点统一走码点安全截断；非边界文本零行为变化。

### 2.2 勘察复证与选型

**实核链**（与 §1 逐点一致）：

| # | 事实 | 证据（file:line） |
|---|---|---|
| ① | 三处送 embed 的文本 = 前缀 + `r.content.slice(0, EMBED_TEXT_MAX_LEN)` 裸码元截断 | `thincoder-core/memory/docs.mjs:162` · `thincoder-core/memory/core.mjs:172` · `thincoder-core/memory/code-sync.mjs:344` |
| ② | 上限 = 2000；自 `core.mjs` 导出、另两档 import 消费 | `thincoder-core/memory/core.mjs:16` · `docs.mjs:11` · `code-sync.mjs:9` |
| ③ | 请求体 = `JSON.stringify({ model, input })`——孤立代理被转义为 `\ud83d` 形态（合法 JSON 文本、非法 Unicode 标量） | `thincoder-core/embedding.mjs:86` |
| ④ | 核级单一来源已存在：零 import 叶档、函数已导出、有消费先例 | `thincoder-core/text-budget.mjs:55`（头注 `:6` 自述零 import）· `thincoder-core/explore-distill.mjs:13` |
| ⑤ | `agent` 侧两份私持复本 = 已登记本地面；本批零触碰（并行批写域） | `thincoder-core/agent/helpers.mjs:45` · `thincoder-core/agent/setup.mjs:28` · `docs/core/design/TOOL-OUTPUT-LIMITS.md:39` |
| ⑥ | 查询侧三处 `embed(…, [query])` 不截断、原样送（非孤立代理生成点——同链登记） | `core.mjs:55` · `docs.mjs:109` · `code-sync.mjs:291` |

**选型对比**（候选 ≥2）：

| # | 候选 | 判据逐项评估 | 取舍（选定代价 / 权衡） | 结论 |
|---|---|---|---|---|
| 1 | 复用 `text-budget.mjs#safeSliceUTF16` | 零 import 叶档（无环）；函数已导出；档头自述「可被任意层直接引用」；有消费先例；不触碰 agent 面 | 代价 = memory 三档各 +1 行 import（行数账见 2.7） | **选定** |
| 2 | 引 `agent/helpers.mjs` 私有复本（§1 候选 ①） | 需先把私有函数导出（动 `agent/*`——并行批写域冲突）；memory ⇒ agent 反向依赖（agent 侧本就消费 memory ⇒ 子系统级双向环）；helpers.mjs 为 agent 杂物档 | —— | 否决 |
| 3 | 抽新核内共用件（§1 候选 ②，如 `utf16.mjs`） | 与既有单一来源同函数双份（D2 违例——共享面已声明其为核级单一来源） | —— | 否决 |

### 2.3 修复点（唯一生产改动面——精确化）

| 文件（`wc -l` 现值） | 落点 | 改动 | 行数账 |
|---|---|---|---|
| `thincoder-core/memory/core.mjs`（299） | `:172` | `r.content.slice(0, EMBED_TEXT_MAX_LEN)` → `safeSliceUTF16(r.content, EMBED_TEXT_MAX_LEN)` + import 一行 | +1 ⇒ **300**（`> 300` 不成立—不越软线；余量 +0，不得再增量） |
| `thincoder-core/memory/docs.mjs`（419） | `:162` | 同形替换 + import 一行 | +1 ⇒ 420（超软线已在册——`core-hygiene` 登记零改） |
| `thincoder-core/memory/code-sync.mjs`（415） | `:344` | 同形替换 + import 一行 | +1 ⇒ 416（同上） |

**import 追加行** = `import { safeSliceUTF16 } from "../text-budget.mjs"`（各档置于既有 import 块尾部——不重排、不合并其他 import）。

**零行为变化论证**（逐支）：① `content.length ≤ 2000` ⇒ 原样返回——逐字不变；② 截点码元非高代理 ⇒ `slice(0, 2000)`——逐字不变；
③ 截点码元 = 高代理（唯一差异支）⇒ `slice(0, 1999)`——**仅丢弃修前本会留下的孤立高代理**（其低代理半此前已被切掉）⇒ 文本至多短 1 码元，且仅 emoji 恰跨界时发生。
**不变量**：不改上限 / 前缀拼接（逐字保留）/ 查询侧。

### 2.4 用例表（新档 = `thincoder-core/test/memory-embed-utf16.test.mjs`；快层——in-memory sqlite + fetch 桩，零网络零重 IO）

**落点实核注**：核测试树现树 28 档中零 memory / embedding 用例档 ⇒ 新档按族名建档；同族参考 = `thincoder-core/test/text-budget.test.mjs`（UTF-16 安全切片既有用例）。
**夹具**：`createMemory({ dbPath: ":memory:" })`（自 `../memory.mjs` 导入）+ `mem.embedder = createEmbedder({ baseURL: "http://stub.invalid/v1", apiKey: "k", model: "m" })`（自 `../embedding.mjs`）；
fetch 桩替换 `globalThis.fetch`——**原样收 `opts.body` 入数组**，解析后按 `input.length` 回等长向量（`[{ index, embedding: [1, 0, 0, 0] }, …]`）；`try/finally` 恢复真 fetch。每用例独立 fresh `:memory:` 库。
**机判口径（防空洞断言）**：扫**解析回值**——`JSON.parse(body).input[]` 逐条过孤立代理正则 `[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]` ⇒ 0 命中。
**勿用原串扫法**：`JSON.stringify` 已把孤立代理转义为 `\ud83d` 六字符文本——对请求体原串跑该正则恒不命中（空洞）。
**边界常量**：`EMBED_TEXT_MAX_LEN` 自 `../memory/core.mjs` 导入（不硬编码）；跨界 content = `"a".repeat(EMBED_TEXT_MAX_LEN - 1) + "😀" + "b".repeat(10)`（高代理恰在 `max - 1` 索引）。

| # | 路径 / 驱动 | content | 期望（机判） | 修前 |
|---|---|---|---|---|
| T1 | entries——`put()` 后 `ensureEmbeddings` | 跨界 | `bodies.length === 1` ∧ 送文本 = `title + "\n" + content.slice(0, max - 1)` ∧ 0 孤立代理 | 红 |
| T2 | files——直插 files 行后 `ensureEmbeddings` | 跨界 | 同 T1 形（`title` 前缀）∧ 0 | 红 |
| T3 | doc_chunks——直插后 `ensureDocEmbeddings` | 跨界 | 送文本 = `heading + "\n" + content.slice(0, max - 1)` ∧ 0 | 红 |
| T4 | code_chunks——直插后 `ensureCodeEmbeddings` | 跨界 | 送文本 = `path + " :: " + symbol + "\n" + content.slice(0, max - 1)` ∧ 0 | 红 |
| T5 | entries | ASCII 跨界（`"a"×max + "b"`） | 与裸 `slice(0, max)` 逐字相等 ∧ 0 | 绿（零变化） |
| T6 | entries | BMP 跨界（`"a"×(max-1) + "中" + "b"`） | 同上 | 绿 |
| T7 | entries | emoji 全内（`"a"×(max-2) + "😀" + "b"`） | 送文本含完整代理对 ∧ 与裸 slice 等值 | 绿 |
| T8 | entries | 短文本（`"x"×100 + "😀"`） | 全文原样 ∧ 0 | 绿 |

**直插 SQL（NOT NULL 列全给值；embedding 缺省 NULL 即待嵌行——FTS 触发器对空 `seg_content` 零碍）**：
- files：`INSERT INTO files (layer, path, type, title, content, updated_at) VALUES ('project', 'x.md', 'rule', ?, ?, 0)`
- doc_chunks：`INSERT INTO doc_chunks (path, heading, content, line_start, line_end) VALUES ('docs/x.md', ?, ?, 0, 1)`
- code_chunks：`INSERT INTO code_chunks (path, language, chunk_type, symbol_name, content, line_start, line_end) VALUES ('src/x.mjs', 'javascript', 'file', '', ?, 0, 1)`

### 2.5 反证面（修前红 → 修后绿闭环——原样记录）

① 先落测试档（三处修复未落）→ `cd thincoder-core && node --test test/memory-embed-utf16.test.mjs` ⇒ **T1–T4 红**（失败断言 = 孤立代理命中）+ **T5–T8 绿**；
② 落三处修复 → 同命令 ⇒ 全绿；③（兜底复验）修后临时还原任一处为 `.slice` ⇒ 对应用例必红 ⇒ 恢复 ⇒ 绿。
记录要求：§5 原样收命令与失败断言逐字（证明红因 = 孤立代理命中，非误红）。

### 2.6 文档收正（本席同轮落盘；实施笔（§5）零重复触碰这两档）

- `docs/core/design/MEMORY.md`：§6.3 补「嵌入输入文本（三路）」段 · §7 补 D-MEM16 · §9 行数复测收正 · 变更记录 +1 条；
- `docs/core/requirements/MEMORY.md`：§4.8「嵌入输入编码安全（缺陷修复 · 2026-09-15）」新增（F-EM1 / N-EM1 + 判定句）· 变更记录 +1 条。

### 2.7 R24a 受影响文件

| 文件 | 现值（`wc -l`） | 预计增量 | >300 / >500 判断 |
|---|---|---|---|
| `thincoder-core/memory/core.mjs` | 299 | +1 | 300——软线内（余量 +0）；不触硬限 |
| `thincoder-core/memory/docs.mjs` | 419 | +1 | 超软线已在册（`SOFT_LINE_REGISTRY`）；不触硬限 |
| `thincoder-core/memory/code-sync.mjs` | 415 | +1 | 同上 |
| `thincoder-core/test/memory-embed-utf16.test.mjs` | 新建（0） | ≈110–150 | `test/` 在档位机检域外（core-hygiene walk 跳过 test 目录） |
| `docs/core/design/MEMORY.md` | 373 | +9±3 | 文档档免档位判定 |
| `docs/core/requirements/MEMORY.md` | 179 | +16±4 | 同上 |
| `thincoder-core/text-budget.mjs` | 79 | 0（只读引用） | 软线内 |

### 2.8 验收标准（可机判——逐条回指）

| AC | 判据（命令 / 断言） | 回指 |
|---|---|---|
| A1 | `cd thincoder-core && node --test` 零 fail ∧ 新档 8 用例全绿；总数 = 实现时基线 + 8（基线以改动前实跑为准并原样记录；as-of 2026-09-15 23:36 实跑 = **183/183/0**——并行批未提交新增在树，本档 §1 所述 178 为更早时点） | F-EM1 |
| A2 | 反证闭环：修前红（T1–T4 红 · T5–T8 绿）→ 修后全绿；读数原样入 §5 | F-EM1 |
| A3 | 三处落点逐处实核：三档各 1 处 `safeSliceUTF16(` 调用 + 1 行 import；`slice(0, EMBED_TEXT_MAX_LEN)` 在三档零残留（grep） | F-EM1 |
| A4 | 零行为变化：T5–T8 与裸 `slice` 逐字相等（绿）；上限 / 前缀 / 查询侧零触碰 | N-EM1 |
| A5 | 仓根三闸 + `doc:check`：宽度 `OK` 0 违规 · 台账 `0 处违规` · 锚根域 `OK(V5) 0 悬空`（全域名跑时 CLI 域存量 37 条如实登记——见 2.10）· `doc:check`（VSC 域 strict）`命中 0 处` | N-EM1（零回归面） |
| A6 | `git status` ⊆ 写域（三处 + 新测试档 + 两档文档）；单笔提交（承 §1：单笔） | —— |

### 2.9 边界（不做）

- 只此面：三处修复 + 新测试档 + 两档文档；核其他盘 / CLI / VSC / `thincoder-core/agent/**`（并行批写域）/ 台账 / `scripts/**` 零触碰；
- 同链登记（**只登记不扩面**）：① 查询侧三处原样送；② `docs.mjs:190` / `code-sync.mjs:371` 工具输出预览 `slice(0, 2000)`（送模型——由发送兜底 `escape.mjs` 的 `sanitizeLoneSurrogates` 覆盖，源头未修）；
  ③ `agent` 侧两份私持复本（本地面，并行批写域）；④ CLI / VSC 侧 UI / 预览类裸 slice（如 `thincoder-cli/src/distill.mjs:114` · `thincoder-vscode/src/extension/file-refs.mjs:25`——发送兜底覆盖面另议）；
- 兜底：实核发现第四处同形截断在 embed 路径上 ⇒ **停下上抛**（不自行扩面）。

### 2.10 三闸 / doc:check 基线读数（本席实跑 · as-of 2026-09-15 23:40，cwd = 仓根）

| # | 命令 | 读数 |
|---|---|---|
| 1 | `node scripts/check-doc-width.mjs` | `OK(宽度): 无 >300 字符单行（412 文件）` · `一致性 V1/V2/V3：新增违规 0 条 · 存量 0 条`（412 = §1 所述 411 + 本批档——归因注） |
| 2 | `node scripts/check-ledger.mjs` | `OK` 两档 · `0 处违规 · 基线 0 条` |
| 3 | `node scripts/doc-anchors.mjs --domain .` | 根域 `OK(V5): 0 条悬空锚`（exit 0） |
| 4 | `node scripts/doc-anchors.mjs`（全域名） | 根域 0；**CLI 域（99 档）37 条悬空——存量**（全在 CLI 树参照历史档、指向已删 / 已迁路径——W16 `488c86c9` 删档随动·未逐条归因）——非本批写域，登记 |
| 5 | `cd thincoder-vscode && npm run doc:check`（≡ `node scripts/doc-anchors.mjs --domain thincoder-vscode --strict`） | `命中 0 处 · distinct 0 · 阻断态`（exit 0） |

### 2.11 发现（随批报告 · 不阻断）

1. **核测试基线口径**：§1 任务书「178/178/0」为更早时点；现树实跑 **183/183/0**（+5 = 并行批未提交的 `thincoder-core/test/family-tools.test.mjs`）——验收按「实现时实跑基线」记。
2. **锚域口径**：「锚 0」仅**根域**成立；`thincoder-cli` 域 37 条悬空 = 存量（非本批、写域外）——全域跑 exit 1 由此而来；本批验收 =「写域新增 0 + 根域 0」。
3. **宽度档数口径**：411 → 412（+1 = 本批批次档文件在建）。
4. **核测试树族位**：核测试树现无 memory / embedding 用例档（现树 28 档零命中）——新档系该族首个。

## §3 设计评审（评审子代理）

### 轮次 1（评审子代理）

本轮 = 设计评审（对象 = 本档 §1 问题/根因三处实证 + §2 任务书：三处 `safeSliceUTF16` 替换 + 新测试档 8 例 + 反证闭环 + R24a + 边界）。实核面：三处病灶行 · `text-budget.mjs:55` 语义与导出 · 三档 `wc -l` 等价值 · `SOFT_LINE_REGISTRY` 在册状态 · schema 列约束 · `embed()` 请求/响应契约 · 夹具前置条件。两档 MEMORY 文档的收正已落盘且与本档机制描述互不矛盾（设计档 §6.3 / D-MEM16 / 需求档 §4.8）。

| # | Category | Severity | Issue | Suggestion |
|---|----------|----------|-------|------------|
| 1 | Clarity / Acceptance | 🟡 | T4 期望串与夹具自相矛盾：期望写作 `path + " :: " + symbol + "\n"`（本档:110），夹具 `symbol_name` 插 `''`（本档:119），而 `memory/code-sync.mjs:344` 为条件拼接（`symbol_name` 空则无 `" :: "`）⇒ 按字面实现必得误红（修后仍红）。 | T4 夹具改插非空 `symbol_name`（期望 `" :: <sym>"`），或期望改写为与代码同形的条件式；实现面不动。 |
| 2 | Affected-file annotations | 🟡 | 新测试档行注解称「`test/` 在档位机检域外（core-hygiene walk 跳过 test 目录）」（本档:139）——实核不成立：`thincoder-core/test/core-hygiene.test.mjs:36-44` 的 walk 不跳过 `test/`，档位断言 `:93-107` 作用于全量结果，`SOFT_LINE_REGISTRY` 无任何 `test/…` 条目。 | 只收正注解依据（结论仍安全：现估 110–150 ≪ 300）；勿让后续批次据此以为 `test/` 免档位。 |
| 3 | Coordination | 🟡 | A6「`git status` ⊆ 写域」（本档:153）与本档自陈树态冲突：§2.11 #1 已述并行批未提交档 `thincoder-core/test/family-tools.test.mjs` 在树（`ls` 实核）。 | A6 加限定「写域内改动单笔提交；并行批未提交档不计入、不得夹带」；§5 原样记提交范围。 |
| 4 | Clarity（夹具） | 🔵 | fetch 桩响应体信封未写明：`embed()` 按 `data.data` 校验条数（`thincoder-core/embedding.mjs:35-36`）；设计简写「回等长向量（`[{index, embedding},…]`）」（本档:100）若落成裸数组 ⇒ 全档红（T5–T8 修前应绿可兜住，但属误红）。 | 明写响应体 `{ data: [...] }`（含 `index`，按 `JSON.parse(opts.body).input.length` 造等长项）；桩法有先例（`test/provider-merge.test.mjs:73-87`）。 |
| 5 | Verified（无缺陷 · 备查） | 🔵 | 档位与单一来源已核：core.mjs 299 → +1 = 300（`>300` 不成立，且未列入 `SOFT_LINE_REGISTRY` 亦无需列入）· docs.mjs 419 · code-sync.mjs 415（两档已在册 `core-hygiene.test.mjs:30-31`）· `text-budget.mjs:55` 语义＝设计所述「截点落高代理回退一码元」。 | 余量 +0：core.mjs 再增一行即触软线，届时须登记或拆分；其余无需动作。 |
| 6 | Doc hygiene | 🔵 | `docs/TODO.md:12` 的缺陷条目 status=待讨论；§2.6 收正面只含两档 MEMORY 文档，未登记该书目的状态收正。 | 由 §6 收口轮同轮收正该书目状态（或明示「随批归档」），避免悬空。 |

计数：🔴 0 · 🟡 3 · 🔵 3。判定依据：机制面（三处统一走核级单一来源、零行为变化三分支论证、机判口径用 `JSON.parse(body).input[]` 而非原串扫、反证闭环含兜底复验）经实核成立；R24a 数字经交叉实核成立；无 🔴。

VERDICT: pass

## §4 用户批准（主 agent）
## §5 实施记录（eng-coder）

> 实施者 = eng-coder · 2026-09-15（开工 23:47 · 提交 23:51）· 依据 = 本档 §2（逐字）＋ §3 裁决口径。

### 5.1 开工基线（⓪ 实测）

| # | 命令（cwd） | 读数 |
|---|---|---|
| 1 | `cd thincoder-core && node --test`（落盘 `.thincoder/tmp/core-baseline.log`） | `tests 183 · pass 183 · fail 0`——与 §2.8 as-of 23:36 基线一致 |
| 2 | 三档 `wc -l` 实核 | `core.mjs 299 · docs.mjs 419 · code-sync.mjs 415`——与 §2.7 一致 |
| 3 | 三处病灶行 byte-exact 实核 | `core.mjs:172` · `docs.mjs:162` · `code-sync.mjs:344` 与 §2.2 ① 逐字一致 |

### 5.2 实施落点（落盘后行号）

| # | 文件 | import 新增行 | 调用替换行 | 行数账（实测） |
|---|---|---|---|---|
| ① | `thincoder-core/memory/core.mjs` | `:14` | `:173`（任务书 :172 ⇒ import 插入后 +1） | 299 → **300**（恰软线 · 余量 +0） |
| ② | `thincoder-core/memory/docs.mjs` | `:16` | `:163`（原 :162 ⇒ +1） | 419 → 420 |
| ③ | `thincoder-core/memory/code-sync.mjs` | `:14` | `:345`（原 :344 ⇒ +1） | 415 → 416 |

三处调用 = `safeSliceUTF16(r.content, EMBED_TEXT_MAX_LEN)`；import 行 = `import { safeSliceUTF16 } from "../text-budget.mjs"`（各档 import 块尾、零重排）。
**零残留实证**：全核 grep `slice(0, EMBED_TEXT_MAX_LEN)` 零命中（唯一文本命中 = 测试档头注的病灶原文描述——注释面，非代码面）。

### 5.3 反证闭环（原样）

① **修前红**（测试档先落、三处未修）：`cd thincoder-core && node --test test/memory-embed-utf16.test.mjs`
⇒ `ℹ tests 8 · pass 4 · fail 4`；T1–T4 ✖、T5–T8 ✔。失败断言逐字（T1；T2–T4 同形）：

```
✖ T1 entries：跨界 emoji 截断 ⇒ 送文本 0 孤立代理，前缀 + 安全截断 (9.3252ms)
  AssertionError [ERR_ASSERTION]: T1: 送 embed 文本含孤立代理（严格 UTF-16 解析端 ⇒ 400）
      actual: [ 'U+D83D' ],
      expected: [],
```

红因 = `U+D83D` 孤立高代理命中——与 §1.2 后果链（400/20015）逐字吻合；T5–T8 绿 = 非跨界零行为面。（落盘：`.thincoder/tmp/embed-utf16-prefix.log`）

② **修后绿**：同命令 ⇒ `ℹ tests 8 · pass 8 · fail 0`（`.thincoder/tmp/embed-utf16-postfix.log`）。

③ **兜底复验**：临时还原 `code-sync.mjs:345` 为 `.slice` ⇒ 跑 ⇒ 恰 **T4** ✖（同形 `actual: [ 'U+D83D' ]`）· 其余 7 ✔；恢复 ⇒ 8/8/0 ✔
（`.thincoder/tmp/embed-utf16-fallback.log` · `-restore.log`）。

### 5.4 复跑链（实施后全量 · 全绿）

| # | 命令 | 读数 |
|---|---|---|
| 1 | `cd thincoder-core && node --test` | `tests 191 · pass 191 · fail 0`（183 + 8——A1 达成） |
| 2 | `cd thincoder-vscode && npm run test` | `tests 553 · pass 518 · fail 0 · skipped 35`（快层慢测归册 skip） |
| 3 | `... npm run test:full` | `tests 553 · pass 553 · fail 0` |
| 4 | `... npm run test:integration` | `tests 34 · pass 34 · fail 0` |
| 5 | `... npm run lint` | `check-syntax: 194 JS files OK` |
| 6 | `... npm run doc:check` | `V5: 命中 0 处 · distinct 0 · 阻断态`（exit 0） |
| 7 | `cd 仓根 && node scripts/check-doc-width.mjs` | `OK(宽度): …（412 文件）` · 一致性新增 0 · 存量 0 |
| 8 | `node scripts/check-ledger.mjs` | `OK` 两档 · `0 处违规 · 基线 0 条` |
| 9 | `node scripts/doc-anchors.mjs --domain .` | `OK(V5): 0 条悬空锚`（exit 0） |

**A5 达成**：三闸 + doc:check 全绿；CLI 域存量 37 条（§2.10 #4）非本批（仅根域跑）。

### 5.5 提交（单笔 · A6 口径执行记录）

`9e4bd132`——`fix(memory): UTF-16-safe truncation for embedding inputs (lone surrogate -> 400)` · **6 files · +198/−4**。
路径清单（逐条）：① `thincoder-core/memory/core.mjs` ② `thincoder-core/memory/docs.mjs` ③ `thincoder-core/memory/code-sync.mjs`
④ `thincoder-core/test/memory-embed-utf16.test.mjs`（新建 **168 行**）⑤ `docs/core/design/MEMORY.md` ⑥ `docs/core/requirements/MEMORY.md`。
A6 口径（§3 🟡#3 裁决）：写域内改动单笔提交；他批未提交档（`docs/TODO.md` · `docs/TODO-archive.md` M 态）与他批批次档（untracked）**未纳入、未夹带**——提交后 `git status` 复核其原样在树。
命令形态：`git add <新档>`（untracked 无法仅凭 path 提交）⇒ `git commit --only <六路径>`。

### 5.6 决策透明表

| # | 决策点 | 选择 | 理由 | 替代（否决） |
|---|---|---|---|---|
| 1 | T1–T4 断言顺序 | 先孤立代理断言、后送文本等值断言 | 失败输出直给红因（`U+D83D`）——红因非误红可逐字自证 | 等值断言先行（失败 = 长字符串 diff，红因不直观） |
| 2 | fetch 桩响应体 | `{ data: [{ index, embedding: [1,0,0,0] }, …] }`，按 `JSON.parse(body).input.length` 等长 | `embed()` 校验 `data.data` 条数（`embedding.mjs:35-36`）· 先例 `provider-merge.test.mjs:73-87` · 🔵#4 裁决 | 裸数组 / 定长项（前者全档误红、后者抖动） |
| 3 | 夹具隔离 | 每用例 fresh `:memory:` 库 + `try/finally` 恢复 `globalThis.fetch` | 模块级 embed 锁 + 全局 fetch 态——隔离防串扰 | 共享单库（用例间状态泄漏） |
| 4 | T4 夹具 | `symbol_name = "fn"`（非空）· `chunk_type` 保留任务书原值 `'file'` | 🟡#1 裁决落地：期望 `" :: fn"` 与代码条件拼接自洽 | 保留空 symbol_name（与期望矛盾——误红） |
| 5 | 兜底复验取样 | 还原 `code-sync.mjs` 一处（T4 单例面） | 红/绿对照最干净——恰 1 红证明断言挂点、非全局误红 | 还原 entries 面（单例红连带 2 用例——对照噪音大） |
| 6 | 桩法沿用 | `globalThis.fetch` 替换 + 恢复（核内既有先例） | 零网络零重 IO——快层用例（<10ms/例，未触 500ms 归册阈值） | 起本地 http 服务（重 IO——须归册慢测） |

### 5.7 未决 / 未落项 / 边界登记

- **未落项**：无。三处落点全落 · 8 用例全绿 · 两档 MEMORY 文档由设计者落盘、随本笔提交带走（本席零重复触碰）· 台账（`docs/TODO.md`）零触碰（🔵#6 归父侧）。
- **§2.7 注解依据收正**（🟡#2）：`test/` **不是**档位机检域外（`core-hygiene.test.mjs:36-44` walk 不跳 `test/`、`:93-107` 断言吃全量）；新档 **168 行 ≤300**——结论不变（按裁决只收正依据）。
- **第四处同形截断核查**（§2.9 兜底条件）：全核 grep `EMBED_TEXT_MAX_LEN` = 定义 1 处 + import 2 处 + 使用 3 处（全在 embed 路径、即本批三处）——**无第四处**，未触发上抛；其余 `slice(0, 2000)` 预览面（`docs.mjs:190` · `code-sync.mjs:371`）经核非 embed 路径（§2.9 已登记）。
- **同链登记未扩面**（原样延续 §2.9）：查询侧三处原样送；工具输出预览两处；agent 侧私持复本两份；CLI / VSC UI 裸 slice。
- **未决**：无。

### 5.8 评审后补记（内部审计 + advisor code review 裁决）

- **内部审计（explore · divergence audit · 1 轮 · blocking）**：四类偏差（部分实现 / 静默简化 / 文档漂移 / 清单外改动）均未发现；七项逐条 PASS（两项 unverified 系审计角色无执行 / git 工具，已给替代证据）。
- **advisor code review（1 轮 · sync）**：VERDICT **pass**——0 🔴 / 3 🟡（全 optional）/ 4 🔵。裁决表：

| # | Action | Detail |
|---|---|---|
| 1 | Fixed | 夹具导入源替换（🟡）已补记于本 §5.8：交付档自 `../memory/schema.mjs` 导入 `createMemory`（test:17），与任务书 §2.4 所指 `../memory.mjs` 为**同绑定再导出**（`memory.mjs:7`）——零行为差异；§2.4 属设计者段落，本席不触碰，以本记录对齐。 |
| 2 | Deferred | 台账条目状态（`docs/TODO.md:12` 仍 `status=待讨论`）归 §6 父侧收口轮——台账 = 本批显式写域外（§3 🔵#6 已指派）。 |
| 3 | Not an issue | 两档 >300 行 = **存量已登记**债务（`core-hygiene.test.mjs:30` 在册 `memory/code-sync.mjs` · `memory/docs.mjs`），本批各 +1 行在设计 R24a 预判内；按 R3 不上升级、不重开。 |
| 4 | Deferred | 残余风险（原文自身已含孤立代理的透传面）登记后续面——本批边界冻结（§2.9 零扩面），另批核发送兜底覆盖面。 |
| 5 | Not an issue | T5–T8 覆盖面对称性与 §2.4 用例表逐字一致（设计口径），非偏差。 |
| 6 | Not an issue | §2.2 / §2.9 行号为落盘前口径（实现后 +1 位移）——设计先于实现之正常态，同链登记面经核仍成立。 |
| 7 | Not an issue | 备查行（无缺陷实核面）——无需动作。 |

- **修正轮**：0 代码修正轮（评审 0 🔴、无 must-fix 🟡）；唯一动作 = 本 §5.8 记录（🟡#1 落地）。**终态 = clean**。

## §6 验证与收口（父代理）


## §6 验证与收口（父代理）

### 6.1 父侧验证（非采信自述）

- 提交 `9e4bd132` 实核（`git show`）= 6 档 / +198/−4（三处 source + 新测试档 + 两档 MEMORY 文档）。
- 三处现文实读 = `safeSliceUTF16(r.content, EMBED_TEXT_MAX_LEN)`（`thincoder-core/memory/core.mjs:173` · `thincoder-core/memory/docs.mjs:163` · `thincoder-core/memory/code-sync.mjs:345`）+ 各档 1 行 import（`:14` / `:16` / `:14`）——父侧 grep 实证。
- **核回归父侧复跑**（`.thincoder/tmp/final-core.log`）= `# tests 191 · # pass 191 · # fail 0 · # skipped 0` ✓。

### 6.2 AC 逐条（A1–A6）

A1 ✓（191 = 实现时基线 183 + 8）· A2 ✓（反证三步原样在 §5.3：修前 4 红/4 绿 → 修后 8/8 → 兜底复验单红 → 恢复 8/8；红因逐字 = `U+D83D` 孤立高代理）· A3 ✓（三档 `slice(0, EMBED_TEXT_MAX_LEN)` 零残留）· A4 ✓（T5–T8 与裸 slice 逐字相等）· A5 ✓（三闸 + VSC `doc:check` 全绿）· A6 ✓（单笔提交、写域内、他批档未夹带）。

### 6.3 测试寿命处置

新档 8 例 = **转 ② 长期资产（常驻快层）**——三条件全满足（业务可观察 = 送 embed 请求体零孤立代理；集成未覆盖 = 核测试树 memory 族首个；可稳定驱动 = in-memory + fetch 桩零重 IO）；不适用退役。

### 6.4 收口行（核销同步清单）

- 台账：`docs/TODO.md:12` 需求池条目 → `docs/TODO-archive.md` §四（已核销）；需求池计数 27 → 26。
- 提交：实现 = `9e4bd132`（单笔）；收口 = 本记录（§3/§5/§6）+ 台账两档（父侧单笔）。
- 推送：两远端（gitee / github）。
- 凭证：本批 designId 槽位终消费（链终）。

### 6.5 携带与用户面复核

- 用户面（建议实机）：配硅基流动 embedding 的实例重建索引含 emoji 的文档 ⇒ 不再 400/20015（父侧无法复现网络端）。
- 携带：`docs/core/design/CORE-UNIFICATION.md:803-806` R24a 读数刷新 = 并行批收正轮本轮内处置；`docs/core/design/MEMORY.md:75` 指针 = 只登记。
- 边界：CLI/VSC 端零触碰（读数只作对照）。

### 6.6 结论

批终态 = clean（评审 pass · 反证闭环齐 · 全链绿 · 父侧复跑实证）。
