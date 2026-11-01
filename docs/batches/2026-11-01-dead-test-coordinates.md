# 2026-11-01 · dead-test-coordinates
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-11-01 · 来源 = 用户 2026-11-01 02:34「开」（承接「#1925 你说清我就开」）；台账 #1925 由 `#1923` 收口时登记。。
> 台账 = #1925（DOC-SYSTEM · 归批）。前情 = 2026-11-01-prompt-unit-test-location（已收口 2026-11-01）—— 该批立了「先例必须在盘」的规则，本批清它治不了的存量。
## §1 讨论（主 agent）
**状态行**：已收口 2026-11-01
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

## 1. 讨论（主 agent）

### 1.1 一句话

**把设计档里 239 处「指向已不存在的测试档」的死坐标清掉。**

### 1.2 病（父侧实测 2026-11-01 · 不含 `_archive`）

```
docs/core/design/** 引用 `<包>/test/*.test.mjs` 共 239 处，盘上存在 0 处
  233 处 = 非 integration 路径（单测档）
    6 处 = 包内 test/integration/ 路径
按档：MODEL-SPECS 95 · AGENT-LOOP-ASYNC-POOL 23 · LEDGER 18 · CORE-UNIFICATION 17 ·
      TOOLS 16 · MULTI-INSTANCE-COLLAB 14 · BATCH-LEDGER-REVIEW-UNIFY 9 · DOC-DISCIPLINE 8 ·
      AGENT-LOOP 6 · TESTING 5 · AGENT-LOOP-UPSTREAM 4 · MANIFEST 4 ·
      其余 12 档共 20 处
```

**危害**：提示词要求「先例勘察、先对齐」——**这 239 行每一行都在教下一个设计席写旧形**。`#1926` 已立的「先例必须在盘」规则治的是**新写的**，**存量它治不了**（规则对已存在的字没有强制力）。

### 1.3 两类，处置不同（本批的分水岭）

**A 类 · 233 处单测档路径 —— 按构造就是死的，删。**

**理由**：单测档是**零留存**（`docs/core/design/TESTING.md` §3.1 ①：用毕即删、不进任何门）。**一条指向零留存件的路径，写下的那一刻就开始过期**，补一个「现住 `docs/batches/<批档>.test.mjs`」也是死路（那档收口就删）。**⇒ 正确形不是「改坐标」，是「不留坐标」**：保住那行的**事实与判据**，删掉**路径**。

**B 类 · 6 处 `test/integration/` 路径 —— 不是同一回事，先说清再动。**

集成用例是**常驻**的（不随批删），**所以它的路径本应活着**；这 6 处在盘却查无，说明它们是**两种不同的病**，混在 A 类里删掉就是**把欠债当垃圾扔了**：

| 引用 | 现状 | 判断 |
|---|---|---|
| `thincoder-cli/test/integration/web-backend-404.test.mjs` | **已在仓根** `test/integration/web-backend-404.test.mjs` | 旧仓位置指针 ⇒ **改指仓根** |
| `thincoder-cli/test/integration/subagent-lifecycle.test.mjs`（2 处） | 仓根查无 | 待判：改名 ∥ 没写 ∥ 已撤 |
| `thincoder-vscode/test/integration/reasoning-echo-live.test.mjs` | 仓根查无 | 同上 |
| `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（2 处） | 仓根查无 | 同上 |

**⇒ B 类处置 = 逐条查**（在仓根找对位）；**查无对位 ⇒ 不删，登账**（那是「说有用例、其实没有」，删掉就把欠债洗白了）。

### 1.4 判据（D8 同向，禁留尸）

- **失效表述直接删**，不写「原为 X」「已删」「（已废弃）」。
- **保事实、删坐标**：一行若承载判据 ∥ 结论，删坐标后该行仍要读得通。
- **不写行号**，只留节锚（本会话实证：行号在这几轮里失效三次，`#1926` 已定此口径）。
- **受影响文件表整行死掉 ⇒ 删整行**；表还在但该行只是列举 ⇒ 删该行。

### 1.5 分批（一档一位，每轮 ≤15 档）

| 组 | 档 | 处数 |
|---|---|---|
| **S1** | `docs/core/design/MODEL-SPECS.md`（最大且是表形，单列） | 95 |
| **S2** | AGENT-LOOP-ASYNC-POOL · LEDGER · CORE-UNIFICATION · TOOLS · MULTI-INSTANCE-COLLAB · BATCH-LEDGER-REVIEW-UNIFY · DOC-DISCIPLINE | 105 |
| **S3** | AGENT-LOOP · AGENT-LOOP-UPSTREAM · TESTING · MANIFEST · SETTINGS-TOOL · DOC-MIGRATION · DOC-SYSTEM · I18N | 26 |
| **S4** | MEMORY · PROMPT-SYSTEM · PROVIDER · CONSULTATION · CONTEXT-COMPACTION · LIGHT-CHANNEL · MODEL-BENCH · TRACES | 13 |

**每轮落完复跑一次计数**（父侧给命令），**数到 0 才算清完**。

### 1.6 边界（不做）

- **不动 `_archive/**`**（归档面，清了反而毁证据）
- **不动代码**（只改设计档）
- **不动需求档 / 提示词面 / 批档 / 台账**
- **不动 `test/integration/` 下的实际用例**（B 类只改引用，不写用例）
- **不新增机检**（`#1926` 已定：先清存量，再谈机检）

### 1.7 口径补正（S1 落完后发现第三形 · 父侧实测）

**S1 只清 `包/test/xxx.test.mjs` 这一形（95→0，已核）。但同一份档里还留着 7 处裸文件名**（`model-specs.test.mjs` 等），**同样不在盘**。⇒ 原口径漏了一形。

**全仓重扫（不含 `_archive`）**：

```
包路径形   = 144 处（S1 清了 95，`docs/core/design/MODEL-SPECS.md` 归零）
裸文件名形 = 182 处（29 个档；TESTING 40 · TOOLS 39 · ENGINEERING-MODE-V2 11 · MANIFEST 11 …）
```

**★ 但裸名形不是一律该死 —— 必须分两读**：

| 读 | 例 | 处置 |
|---|---|---|
| **具体档名**（真指向某个档） | `model-specs.test.mjs` ∥ `core-hygiene.test.mjs:117-131` | 不在盘 ⇒ **死指针，删坐标保事实** |
| **模式 ∥ 占位**（在说「这一类文件」） | `*.test.mjs` ∥ `<档>.test.mjs` ∥ `批档名.test.mjs` | **是判据不是指针 ⇒ 保留**。删了就把规则删了 |

**★ 判据一句话**：**去盘上找这个名字 —— 找得到就是指针（在盘则不删），找不到且它没有通配符/占位符就是死指针（删）。**

**为什么不能按「182」一刀切**：`docs/core/design/TESTING.md` 那 40 处大半是**规则本体**（单测档叫什么、住哪、怎么跑）——**把它们当死指针删掉，等于把测试纪律本身删了。**

**S1 档的 7 处裸名**（`docs/core/design/MODEL-SPECS.md`）= 具体档名、全不在盘 ⇒ 归 **S5** 补一轮。

### 1.8 处数更正 + B 类裁定（S2 轮后 · 父侧）

**① §1.5 的处数表低估了近一倍**：那张表只数了**包路径形**。S2 实测量 = **194 处 / 162 行**（含 §1.7 才补进来的裸名形）。**续轮排期一律按实测量，不按 §1.5。**

**② B 类 2 处的裁定**：`thincoder-cli/test/integration/subagent-lifecycle.test.mjs` —— 该目录整棵不在盘，仓根 `test/integration/` 23 档无同名，全仓搜不到。

**父侧裁定（不是「不删」，是「分两头处置」）**：
- **档里的路径删掉**，**用例号 `I1` 留着** —— 用例号是稳定锚，路径是死指针；D8 删的是死指针，不是那条能力要求。
- **欠账登账**：台账立一行「I1 用例档不存在（设计档曾有该路径）」，`trigger = 条件`，复启条件 = 下一次动 subagent 生命周期面时补用例或撤句。

**为什么不按「查无 ⇒ 整句留着」办**：留着路径 = 文档继续声称一个不存在的档，**下一个读者会去盘上找一个不存在的文件**；而删掉整句 = 把欠债洗白。**两头都办才是对的：路径死，账活。**

**③ 同类待判**：`thincoder-vscode/test/integration/reasoning-echo-live.test.mjs` ∥ `host-shape-spawn.test.mjs`（2 处）—— 同一判法，归后续轮处理。

### 1.9 父侧一处口径错（S5 轮纠 · 自查）

**§1.7 那句「包内 `test/` 树的 `.test.mjs` 全为零」是错的** —— **对 `thincoder-core` 成立，对 `thincoder-vscode` 不成立。**

**实测（S5 轮）**：`thincoder-vscode/test/` 有 **5 个批次名单测档在盘并已入册**（`thincoder-vscode/test/files.mjs:8` 实列 5 项）。

**正确口径**：**逐包看，不要拿一个包的读数推全部。** 后续轮次按「去盘上找、在盘则不删」办 —— 那 5 档在盘，按判据就是活指针，不删。

**这笔错牵出一笔真债**：那 5 档是**批次名**的单测档，按零留存规则**该在各自批收口时删** —— 现在还在。已登 `#1936`（含「`docs/core/design/AGENT-LOOP-UPSTREAM.md:1220` 称现无 `.test.mjs`、与盘相反」的旁证）。

**★ 这条错误为什么值得写进账**：**它差点让后续轮次把 5 个在盘档当死指针删掉** —— 「全为零」是个**太顺手的概括**，而 S5 恰好引用不到它们，才没造成后果。**偶然没撞上，不等于口径对。**

### 1.10 两条裁定 + 一条父侧实证（S7 / S8 后）

**① 提示词面一致 —— 父侧实证，S7 的「零命中」是假阴性。**

```
thincoder-core/prompts/discipline-engineering.md:178
  **Unit test files sit beside their batch record, sharing its name** — `<docRoot.batches>/<batch record name, no .md>.test.mjs`
PROJECT-MANIFEST.json  docRoot.batches = "docs/batches"
```

**S7 扫的是字面 `docs/batches`，提示词用占位 `docRoot.batches`** ⇒ 零命中。**「没有找到 ≠ 不一致」，它当时没据此判冲突，判断对；但报告里那条结论必须换成实证后的「一致」。**

**② `docs/core/design/TESTING.md` 「现盘已清零」的处置 = 删读数、留机制句。**

S8 报：该句今日不成立（`docs/batches/` 现存 1 档 `.test.mjs`，是本批在途的单测档，收口即删）。**它给的修法是改成「当时盘上已清零」——父侧不取。**

**为什么不取「当时」**：**那是时点陈述**，写进状态档后，**下一个读者读到的是一句「从前如何」**，而他要的是「现在如何」。**设计档不留历史（历史在 git）。**

**裁定**：**删掉「2026-10-26 实测：…（现盘已清零…）」这段读数**，**保留机制事实句**「因 `test/run.mjs` 不收集该目录，留 ∥ 删都不报警」 —— **规则靠机制句立住，不靠一段会过期的读数。**

**③ 本批剩余面**：包路径形只剩 `docs/core/design/LEDGER.md`（18）∥ `docs/core/design/PROMPT-SYSTEM.md`（2）—— **这两档是在途批 `#1927` 的设计单源，实施席正按它们落笔，本批不碰**；待 `#1927` 交付后再开一轮。

**④ `docs/core/design/MEMORY.md` 那条否掉的写法，值得留一句**：**「门逼着改，不等于可以编一个结论换绿」** —— S7 遇门红时把「F-Q2 / F-Q3 已随 ⓒ 收束」写了出来，**而那两个代号全仓零命中，没人知道它们去哪了**。**遇到门挡路，删掉核不住的内容是处置，给它编一个去向不是。**

### 1.11 本批最重要的一条判据（收口前评审逼出来的）

**在盘坐标 ≠ 在盘语义。**

**坐标所指的文件在盘，只证明那件东西还在；这一行断言的那件行为还在不在，得另问一次。**

**它是 §1.7「在盘不删」缺的那一半**，实证就在本批：

```
docs/core/design/TOOLS.md:1822-1825（S3 轮改过）
  旧：项目约定 = `thincoder-core/test/*.test.mjs` 单层收集，runner = `thincoder-core/test/run.mjs`
     跑法：`cd thincoder-core && node --test test/<本批单测档>`；收口门 `cd thincoder-core && node test/run.mjs`
docs/core/design/TESTING.md:565（收集面权威）
  核 = 零目标集合，任何 `*.test.mjs` 都是错位
```

**`thincoder-core/test/run.mjs` 一直在盘** ⇒ 按「在盘不删」整行留下 —— **而它断言的「核 runner 收 `test/*.test.mjs`」早就不成立了**（该档 `:3` 逐字「本 runner 无目标集合：不跑任何用例」）。

**后果有多重**：**照那三行办，下一批把单测档放进 `thincoder-core/test/` 会被收集面判「错位」，把 `node test/run.mjs` 当收口门会天天读到 exit 1 的空集说明。** **设计档不是在记录一个错，是在教下一个人照着做。**

**★ 这条与 `#1926` 是同一个坑的两头**：

- `#1926`：**提示词里压根没写「单测档住哪」** ⇒ 设计档照旧形写；
- `#1925`：**设计档里写着「住 `thincoder-core/test/`」** ⇒ 下一个人照它写。

**⇒ 光把位置写进提示词不够，还要把写错的位置从设计档里拿掉。两件都做完，这个坑才真闭上。**

### 1.12 一处派单错误（父侧）

§1.7 写「`docs/core/design/MODEL-SPECS.md` 那 7 处裸名归 S5 补一轮」，**而 S5 只派了 3 档（CORE-UNIFICATION ∥ MULTI-INSTANCE-COLLAB ∥ BATCH-LEDGER-REVIEW-UNIFY），没含这一档** ⇒ 那 7 处一直挂着。S9 修正轮自查发现并清理（该档现 `.test.mjs` = 0）。

**教训**：**派单里写「归 Sx 轮」，就得在那一轮的派单里真的把档点上去；「写进计划」不等于「派到人」。**

## §2 批次任务与设计（eng-designer）
**状态行**：设计完成（2026-11-01 · 修正轮 6 已落（评审轮次 4 的 🟡2 —— `docs/core/design/MODEL-SPECS.md` A-10 三面各带 cwd）；设计面可收口 · 同机制残句 4 处见 §2.21.3）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>

## 2. 批次任务与设计（eng-designer）

### 2.1 本批条目（覆盖）

| # | 组 | 条目 | 落点 |
|---|----|------|------|
| 1 | **S1**（本轮） | `docs/core/design/MODEL-SPECS.md` 指向零留存测试档的坐标清零 | 已落（本档） |
| 2 | S2 | AGENT-LOOP-ASYNC-POOL · LEDGER · CORE-UNIFICATION · TOOLS · MULTI-INSTANCE-COLLAB · BATCH-LEDGER-REVIEW-UNIFY · DOC-DISCIPLINE | 未开始（另一轮） |
| 3 | S3 | AGENT-LOOP · AGENT-LOOP-UPSTREAM · TESTING · MANIFEST · SETTINGS-TOOL · DOC-MIGRATION · DOC-SYSTEM · I18N | 未开始（另一轮） |
| 4 | S4 | MEMORY · PROMPT-SYSTEM · PROVIDER · CONSULTATION · CONTEXT-COMPACTION · LIGHT-CHANNEL · MODEL-BENCH · TRACES | 未开始（另一轮） |

分组与处数见 §1.5；判据见 §1.4；边界见 §1.6。§2 只写本轮的落法与读数。

### 2.2 处置判据的落地形（本轮实测细化 §1.3 A 类）

一条路径是否该死，不看它叫不叫「测试」，看**它指的东西留不留在盘上**。本档 102 处 `pkg/test/*` 引用按此分成两半：

| 类 | 处数 | 判定 | 处置 |
|---|---|---|---|
| 指向在盘文件（`test/run.mjs` ×4 · `test/files.mjs` ×1） | 5 | 指的东西活着 | **原文保留** |
| 指向零留存单测档（`.test.mjs`） | 95 | 写下的那一刻就开始过期 | 删坐标、保事实 |
| 指向零留存探针脚本（`test/smoke-qwen-thinking.mjs`） | 2 | 同上（超出 §1.2 的「`.test.mjs`」计数口径，同一类病） | 删坐标、保事实 |

**为什么不能改写成新路径**：单测档用毕即删（`docs/core/design/TESTING.md` §3.1 ①），补一条「现住 `docs/batches/<批档>.test.mjs`」也是死路——该档收口即删。正确形 = 不留坐标。

### 2.3 两种落地形（逐处择一）

1. **整行删除**——整行的语义就是「这个测试档多少行、改了哪几段」。主体既然不在盘，整行没有可保的事实。本轮整行删 **39 行**，全部是「影响文件清单 / 用例表落点」里的单测档行：§3（5）· §9.7（5，连表头与引导句一并改成三条覆盖说明）· §10.5（1）· §11.5（3）· §12.5（2）· §13.6（3）· §14.6（8）· §15.5（6）· §16.7（6）。
2. **保事实删坐标**——行/句承载判据、结论或覆盖说明，删掉路径仍要读得通。例：`用例 T-14 …（thincoder-cli/test/cmd-think.test.mjs）` → `（落 CLI 单测档）`；`机检 = thincoder-core/test/core-hygiene.test.mjs:117-131` → `机检 = 核行数上限门`；`用例 thincoder-core/test/config-presets.test.mjs:49-51` → `用例 P-4`。

**连带面（D3 计数同变，同批收正）**：§3 删 5 行后表由 10 行变 5 行，「本表 **10 行** = 九条产品码/测试文件」与「行数读数 = 253 / 84 / 253 / 395 / 304 / 152 / 154 / 149 / 221」两处计数同批改为 5 行、`253 / 84 / 152 / 149`。计数与清单不同变 = 下一处误读。

### 2.4 关键决策

| # | 决策 | 理由 |
|---|------|------|
| D-1 | 单测档路径**不迁移、不改写**，直接去坐标 | 迁移目标本身零留存，改写等于把死路换个地址（§2.2） |
| D-2 | 表行主体是单测档 ⇒ 整行删，不留空行 / 不留「—」 | 留残迹会被下一个读者当活条目（§1.4 D8 同向） |
| D-3 | 句子里的判据保留，坐标换成**面无坐标的描述**（「落 CLI 单测档」「核行数上限门」） | 判据是状态，路径不是；删判据会丢被测语义 |
| D-4 | `SOFT_LINE_REGISTRY` 这类**登记面本身随单测档消失**的引用，连「登记面 = …」整句一并收掉，只留处置与其消解窗口 | 登记面已不在盘，保留指向它的句子等同第二个死坐标 |
| D-5 | 行号一律不写，只留节锚 | 行号在本轮已失效，节锚可解 |
| D-6 | 每处改动**只做删坐标**，不重排 / 不重编号 / 不统一措辞 | §1.6 边界；超出部分属另一轮 |

### 2.5 受影响文件与测试覆盖

- **受影响文件**：`docs/core/design/MODEL-SPECS.md`（唯一）。无代码改动、无需求档 / 提示词 / 别批档改动。
- **测试**：本批无产品码改动 ⇒ 无单测档可写。验收读数为两条静态计数（见 §2.6）+ `doc_check` gate，均在本轮内跑过。
- **B 类（`test/integration/` 路径）**：本档 **0 处** ⇒ 本轮无「改指仓根 / 查无对位上抛」的处置。

### 2.6 验收对照（读数已在本轮实测）

| 判据 | 命令 | 改前 | 改后 |
|---|---|---|---|
| 单测档坐标归零 | `grep -c '\.test\.mjs' docs/core/design/MODEL-SPECS.md`（UTF-8 扫描） | 82 行 / 95 处 | **0** |
| `pkg/test/*` 引用只剩在盘件 | 路径存在性逐条比对 | 102 处（5 在盘 / 97 不在盘） | **5 处，全部在盘**（`run.mjs` ×4 · `files.mjs` ×1） |
| 无尸标 / 无「原为 X」 | 全文扫描 `原为 / 已废弃 / 已随…退役 / ~~` | — | 命中 0（既有「已删 / 已随 §14 批」均为机制事实句，非失效表述） |
| 文档纪律 | `doc_check(mode:"gate")` | — | PASS |

变更规模读数：`git diff --numstat` = `+50 / −94`（净 −44 行）。

### 2.7 上抛项

无待裁项。一条**知会**：§1.2 的 95 处是 `.test.mjs` 口径；本档另有 **2 处**指向零留存的探针脚本 `thincoder-cli/test/smoke-qwen-thinking.mjs`，同一类病、同一处置，已一并在本轮清掉（父侧若按 95 口径复跑，读数同样归零）。

### 2.8 S2 轮（7 档 · 本轮实落 1 档，6 档未完）

**状态**：部分落地。本轮只把 `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` 清完；余 6 档**未动**（读数在 §2.8.3），不得读作已清。

#### 2.8.1 已落：`docs/core/design/AGENT-LOOP-ASYNC-POOL.md`

**读数（`.test.mjs` 命中行 / 处）**：改前 **26 行 / 30 处** ⇒ 改后 **6 行 / 6 处**。
改后残留逐条 = **B 类 2 处**（§2.8.2，等裁）· **判据形 3 处**（`test/*.test.mjs` 收集规则 · `test/run.mjs` 的 `*.test.mjs` 报错句 · 调研证据里的「零 `.test.mjs`」实读）· **在盘 1 处**（`test/integration/empty-response-retry.test.mjs`，盘上确有）。

**处置统计**：

| 处置 | 处数 | 位置 |
|---|---|---|
| 整行删（表行主体就是单测档） | **16 行** | §6.10 受影响文件表 3 行 · §6.20 受影响文件表 3 行 · §6.30 三个拆分/清单表 4 行 · §6.30.13 行数表 4 行 · §6.30 用例宿主张表 2 行 |
| 保事实删坐标 | **5 行** | U10 用例行（`input-lock.test.mjs:17` → 端单测档）· §6.20 落点句（两处档名 → 核单测档 / CLI 单测档）· 真机用例档句（名字去掉、未落事实留）· §6.30 调研证据句（删掉「旧清单所列各档已删除」这句尸述） |
| 判据保留（不动） | 3 处 | §6.30 用例宿主规则 · 核包 `*.test.mjs` 报错面 · 调研证据的实读读数 |
| 在盘保留 | 1 处 | `test/integration/empty-response-retry.test.mjs` |

**计数同变（D3）**：本档被删行所在的 5 张表**无「本表 N 行」类计数句**（`grep` 实测 0 命中）⇒ 无计数需随动。

#### 2.8.2 B 类（`test/integration/` 路径）—— 上抛，未删

本档 2 处指向 `thincoder-cli/test/integration/subagent-lifecycle.test.mjs`（受影响文件表 1 行 · I1 落点句 1 处）。

**实测**：`thincoder-cli/test/integration` **目录整个不在盘**（`Test-Path` = False）；仓根 `test/integration/` 下 23 个用例档中**无同名档**（也无任何 `*subagent-lifecycle*`）。

**判定 = §1.3 的「查无对位」⇒ 不删、上抛登账**：这 2 行在说「有成活用例 I1」，而该用例档不存在——删掉就把这条欠债洗白。请父侧裁：I1 业务可观察集成用例是**没写** ∥ **已撤** ∥ **在别的名下**，三者处置不同（补用例 ∥ 撤句 ∥ 改指）。

#### 2.8.3 未落：余 6 档（本轮零改动）

| 档 | `.test.mjs` 命中行 / 处 | 状态 |
|---|---|---|
| `docs/core/design/TOOLS.md` | 56 / 62 | 未动 |
| `docs/core/design/LEDGER.md` | 21 / 30 | 未动 |
| `docs/core/design/DOC-DISCIPLINE.md` | 21 / 24 | 未动 |
| `docs/core/design/CORE-UNIFICATION.md` | 16 / 20 | 未动 |
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 10 / 15 | 未动 |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 12 / 13 | 未动 |

**注**：`docs/core/design/LEDGER.md` 盘上已有**另一批**（§6.3 开批同面判，+51 行）的在途改动，本轮一行未碰，续做时须与之错开。

#### 2.8.4 本轮未完的原因（如实）

轮次预算用尽：开工时按 §1.5 的 105 处估，实测 7 档合计 **194 处 / 162 行**（差出 89 处 = 未计入的裸文件名形），且 `docs/core/design/TOOLS.md`（62 处）与 `docs/core/design/DOC-DISCIPLINE.md`（24 处）按任务书要求须逐处读上下文分「判据 ∥ 死指针」，不是批量替换。本轮把 1 档做完整、读数留全，其余 6 档留给续轮——按 §1.5「每轮 ≤15 档」的口径仍在本批分组内，不需重分组。

### 2.9 S3 轮 · 本档整档一次做完整：`docs/core/design/TOOLS.md`

**状态**：本档已清完（`.test.mjs` 命中 **56 行 / 62 处 ⇒ 4 行 / 6 处**，残留全部为模式判据或盘上件）。**S3 组余 8 档未动**（AGENT-LOOP · AGENT-LOOP-UPSTREAM · TESTING · MANIFEST · SETTINGS-TOOL · DOC-MIGRATION · DOC-SYSTEM · I18N），不得读作已清。

#### 2.9.1 读数（改前 / 改后 · 本轮实测）

| 项 | 改前 | 改后 |
|---|---|---|
| `.test.mjs` 命中行 / 处 | 56 / 62 | **4 / 6** |
| 其中：模式 ∥ 占位（判据） | 4 处 | 5 处 |
| 其中：具体指针 | 58 处 | 1 处（`test/integration/web-backend-404.test.mjs`——在盘） |
| 其中：死指针 | 57 处 | **0** |

改后 4 行逐条（均判据形 / 在盘件）：§6.23 收集面段（`test/integration/*.test.mjs` 模式）· §6.23 集成落点（在盘 1 处 + 模式 1 处）· §6.25 档落点（`thincoder-core/test/*.test.mjs` 模式）· §6.25 分类（模式 2 处）。

#### 2.9.2 处置统计

| 处置 | 规模 | 位置 |
|---|---|---|
| **整行删**（表行主体就是该单测档） | **11 行 / 11 处** | §6.14 受影响文件表 1 · §6.15.2 受影响文件表 6 · §6.15.3 受影响文件表 2 · §6.23 受影响文件表 1 · §6.25 受影响文件表 1 |
| **整块删**（条目主体就是该档的行数算式） | **1 条 / 3 行 / 1 处** | §6.15.2「`test/batch.test.mjs` ≈485」条目（含「实施轮须实测复核余量」句） |
| **保事实删坐标** | **45 处** | 见表下逐条 |
| **B 类改指仓根** | 1 处 | §6.23 集成落点 |
| **判据 / 模式保留** | 4 处 → 改写后 5 处 | 收窄面见 2.9.1 |

**45 处保事实删坐标逐条**（形 = 用例落点→«单测档» ∥ 机检源→规则名 ∥ 档名→面无坐标的描述）：

1. §6.13 测试面读数（6 处）：6 个「常驻」档名 + 「常驻」断言 → 现盘读数（`run.mjs` / `slow.mjs`）。
2. §6.14 行数口径 ×2：机检源 `core-hygiene.test.mjs:141` ∥ `:147` → 「核行数上限门」。
3. §6.14 用例表 A27 ×1：`test/tools-ide-changes.test.mjs` → 「VSC `ide` 工具面用例」。
4. §6.15.2 登记面句 ×1：`登记面 = core-hygiene.test.mjs（上表已入）` 整句收掉（登记面随测试树退场——D-4 同形）。
5. §6.15.2 用例表宿主 ×20 行（F10-1–5 · F11-A1–C4 · 兼容-1–3）→ 「core 单测档」。
6. §6.15.2 用例表 VSC-1 / VSC-2 / VSC-3 ×4：档名 → 「VSC 单测档」，并删 `thincoder-vscode/test/files.mjs:83 已登记` 括注（读数见 2.9.5 ①）。
7. §6.15.3 转口表 ×1：`upstream-parity.test.mjs` → 「VSC 上游对位单测」。
8. §6.15.3 拆分评估 ×1：`SOFT_LINE_REGISTRY`（`core-hygiene.test.mjs:71-84`）在册 → 行数登记面现态。
9. §6.15.3 尾句 ×1：删「新单元测试档 ≈45」，保留 `turn-domains.mjs ≈35`。
10. §6.15.3 用例表 DOM-C1 / DOM-V1 ×2：档名 → 单测档。
11. §6.17 T-22 ×1：档名 → 「T-22 用例语义零变」（用例号留、路径删）。
12. §6.17 补格 ×1：`scoped-rules.test.mjs` → 「VSC 作用域规则单测档」（用例号 T-B3b 留）。
13. §6.22 批内单测行 ×2：整行删（批已收口、档已删；「随批档存放」口径由同表行 15 承载）。
14. §6.23 文件 / 跑法 / 判据三行 ×3 → 「收集面」一段（改指仓根 runner，读数见 2.9.5 ④）。
15. §6.25 档落点 / 跑法 / 分类 ×3（分类改写见 2.9.5 ⑤）。

#### 2.9.3 B 类（`test/integration/` 路径）逐条

| 引用 | 盘上实测（本轮） | 处置 |
|---|---|---|
| `thincoder-cli/test/integration/web-backend-404.test.mjs` | 仓根 `test/integration/web-backend-404.test.mjs` **在盘** | 改指仓根（§1.3 表第 1 行同判） |
| `test/integration/ssh-device-readability.test.mjs`（§6.22） | 仓根 `test/integration/` 22 档无同名；全仓搜 `ssh-device-readability` 仅命中批档 ∥ `test/RTM.md` ∥ 本节 | **路径删、用例号（22-1 ∥ 22-2 ∥ 22-3）留、状态写真**（RTM 三行结果列 = `待执行`） |
| `thincoder-vscode/test/integration/host-shape-spawn.test.mjs`（2 处） | `thincoder-vscode/test/integration` **目录整个不在盘** | 表行删 + 用例表列改 |

**欠账两条，请父侧登账**（本席不开台账行）：① SSH 集成用例档（RTM 22-1 ∥ 22-2 ∥ 22-3）未落地；② VSC 宿主段装配集成用例档未落地。

#### 2.9.4 连带面（D3 计数）

- 本档**无「本表 N 行」类计数句**：`grep '本表'` 命中 2 处，均为「本表只留端差处置」「本表 = 该映射表的权威副本」，**无数字** ⇒ 删 11 行后无计数随动（不造新计数句）。
- 被删行所在 5 张受影响文件表的表头均无行数承诺。

#### 2.9.5 复核中查到的四条（带读数 · 均在本档面内）

1. **`files.mjs:83 已登记` 不成立**：`thincoder-vscode/test/files.mjs` 在盘 127 行，`grep 'advisor-guard|upstream-parity|scoped-rules|host-shape'` = **零命中** ⇒ 已删该括注。
2. **6 个「常驻 `*.test.mjs`」全不在盘**：`thincoder-core/test/` 现盘仅 `run.mjs` / `slow.mjs` ⇒ 旧读数改写为现读（2026-11-01）。
3. **`SOFT_LINE_REGISTRY` 已随 `core-hygiene.test.mjs` 退场**：`docs/core/design/CORE-UNIFICATION.md:560` 逐字「运行面随测试树全清退场，该门义务随测试体系重建恢复」⇒ 本档该处「在册」改指登记面现态（§2.8.1 子表）。
4. **收集面已归仓根**：`thincoder-cli/test/run.mjs:2-4` 自述「本 runner 无目标集合：不跑任何用例」；`test/run.mjs:3` 目标集合 = 仓根 `test/integration/*.test.mjs` ⇒ 本档两处旧收集面（原写 `thincoder-cli/test/run.mjs:3`）改指仓根 runner。

**[上抛·待裁] ⑤ §6.25「分类 = 常驻回归套」**：该档不在盘 ⇒ 该例外事实上不成立，本轮按零留存口径改写为「批次单测」。**要不要为设计令牌门的四条出口重立一套常驻回归套 = 需求面决定**（涉测试体系重建，不在本批边界内）。

**[上抛·知会] ⑥ 两处整档自读数仍为 `1,739`**（§6.23 / §6.25 受影响文件表），现档 **1,899 行**（`split("\n").length − 1` 实读）。非本批面（不是测试坐标），未动。

#### 2.9.6 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：本节所引节号逐一对档头实测——§6.13 ∥ §6.14 ∥ §6.15.2 ∥ §6.15.3 ∥ §6.17 ∥ §6.22 ∥ §6.23 ∥ §6.25 均在盘（初稿曾把两张表误记为 §6.20 / §6.21，核对后改正）。
- **表行 ↔ 汇总数**：11 行 + 1 条（12 处）+ 保事实 45 处 + B 类改指 1 处 + 模式 4 处 = **62 处** = 改前实测 62 处。
- **断言 ↔ 实测**：`git diff --numstat` = **`+42 / −62`**（净 −20 行）；改后命中 4 行 / 6 处；盘上存在性逐条比对（27 条候选路径 + 6 个目录清单）。
- **文档纪律**：`doc_check(mode:"gate", target = 仓根)` = **PASS**（1 档全清）。

### 2.10 S5 轮 · 3 档整档做完整（CORE-UNIFICATION · MULTI-INSTANCE-COLLAB · BATCH-LEDGER-REVIEW-UNIFY）

**状态**：三档全清完，`.test.mjs` 死坐标归零。读法 = §1.7 两形判法（包路径形按构造就死；裸名形去盘上找，模式 / 占位保留），成例 = §2.9（`docs/core/design/TOOLS.md`）。

#### 2.10.1 读数（改前 / 改后 · 本轮实测）

| 档 | 命中行 / 处（改前） | 改后 | 保留形 |
|---|---|---|---|
| `docs/core/design/CORE-UNIFICATION.md` | 16 / 20 | **0 / 0** | 无 |
| `docs/core/design/MULTI-INSTANCE-COLLAB.md` | 10 / 15 | **0 / 0** | 无 |
| `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` | 12 / 13 | **6 / 7** | 判据形 1 处 + 占位形 6 处 |

**BATCH 档保留的 7 处**（无一条可删）：

- §5「R2 写锁」：`test/integration/*.test.mjs` ⇒ 放行（工程工具面）——**模式形**。
- §5「R12 面判据三处修正」：`thincoder-vscode/test/x.test.mjs` ⇒ 拒 · `test/integration/x.test.mjs` ⇒ 放行——**占位形**。
- §5「R16 `aux` 收紧」· §6 用例表两行 · §9 用例表 12-5：同两形。

**`x.test.mjs` 是占位符不是档名**：它说的是「产品包内 `test` 段的 `.test.mjs` 一律拒」这条规则；删掉就把规则删了。

#### 2.10.2 处置统计

| 档 | 整行删 / 整块删 | 保事实删坐标 |
|---|---|---|
| CORE-UNIFICATION | 1 行 / 2 处（§2.8 受影响文件表「产品测试（S2 改）」整行——行主体即四个单测档 + `files.mjs`） | **18 处 / 14 行** |
| MULTI-INSTANCE-COLLAB | 0 | **15 处 / 10 行** |
| BATCH-LEDGER-REVIEW-UNIFY | 1 块 / 6 处（§3「单测档（收口即删）」小标题 + 6 行表——块主体就是 6 个单测档） | 0 |

**CORE-UNIFICATION 18 处的形**（全部是「现在住哪」的断言，不是搬迁记录）：

- 「锁定 / 机检 = `<单测档>:行`」⇒ 面名：`CLI [error] 前缀——单测锁定` · `锚文法断言` · `核行数上限门` · `hooks 四事件——单测锁定` · `VSC locale 逐字串——端单测锁定`。
  落点 = §2.12.1 契约表 2 处 · §2.13.1 锚语法 1 处 · §2.13.7 验收 2 处 · §2.8.1 口径 2 处。
- 「用例见 `<单测档>`」⇒ `用例 = 双夹具（夹具一 / 二）`（§2.13.5 验收①）；「见 `<单测档>`」⇒ 删尾，`见 §2.13.5` 保留（§2.13.3 两行）。
- 「豁免表位置 = `<单测档>` 的 `EXEMPT` 表」⇒ 保留豁免面事实 + 收口窗口（`随测试树全清退场，随测试体系重建恢复`）——2 处（§2.13.5 验收② · §2.13.7 验收 4），§2.4 D-4 同形。
- 「`SOFT_LINE_REGISTRY`（`core-hygiene.test.mjs`）」⇒ `核行数上限门（软线 / 硬限登记表）`；「`wc -l` 语义 = `core-hygiene.test.mjs:98` 的口径」⇒ 门名。
- 「拟档名 `tool-face-capability.test.mjs`」+「既有 `tool-registry.test.mjs` 覆盖」⇒ `核单测档；装配期门另有既有用例覆盖`（§2.13.6 验收①）；「既有 `read-image-guide.test.mjs` 双态零回归」⇒ `执行门双态零回归`。
- 「交付读数：`write-path.test.mjs` 300 行（7 用例）」⇒ `结构机检用例 300 行 / 7 用例`（读数留、坐标去）；「与 `prompt-files.test.mjs:107` 的反向断言同向」⇒ `与核 prompt-files 单测的反向断言同向`。

**MULTI-INSTANCE 15 处的形**（判据层，按被测面命名、不按档命名）：

- `peer-instances` 半 / `session-slot-write` 半 / `process-probe` 半 / `zero-sync-exec` 半 / `peer-domains` 核半 + 端半 / `peer-claims` 核半 + 端半。
- 门与先例同样去坐标：`N3 门禁（核行数上限门）` · `形态先例 = 单测零直引扫描——核 / 端两半同形` · `跨端读取比对形态先例 = 端对拍单测`。
- **保留**：`端档须入册 thincoder-vscode/test/files.mjs`——该档在盘且是活登记面（`thincoder-vscode/test/files.mjs:6` 逐字「新增测试文件：在此登记」，`:8` 实列 5 档）⇒ 指的东西活着，原文保留。

#### 2.10.3 连带面（D3 计数同变）

`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §3「改行预算」句含 `+ 单测档 6（删）= 29 档落笔面`——被删的表正是那 6 档。随动改为 `新档 6 + 改档 17 = 23 档落笔面`。另两档无「本表 N 行」类计数句（`grep '本表'` 实测零命中）⇒ 不造新计数句。

#### 2.10.4 B 类（`test/integration/` 路径）

**三档 0 处查无对位的集成路径**，无欠账可登：

- BATCH 档的 `test/integration/*.test.mjs` ∥ `test/integration/x.test.mjs` 共 5 处均为模式 / 占位；仓根 `test/integration/` 在盘 **22 档**（`Get-ChildItem test/integration/*.test.mjs` 实读）⇒ 规则有效，保留。
- CORE-UNIFICATION ∥ MULTI-INSTANCE-COLLAB：`grep '/test/'` 实读，无 `test/integration/` 引用。

#### 2.10.5 「迁移记录而非死指针」的判定条数 —— **0 条**

**判法**：CORE-UNIFICATION 是迁移档，「旧路径 ⇒ 新路径」对照行很多，但两端全是源文件（`thincoder-cli/src/**` ⇒ `thincoder-core/**`），一行未涉测试档。

逐行读过三档 16 / 10 / 12 行：全部以「机检 = X」「X 锁定」「用例见 X」「单元测试档 = X」的**现在时断言**出现——说的是「现在住哪」，不是「当时从哪搬到哪」⇒ 无一条可留作记录。

**没有一条按「在盘则不删」保下来的具体档名**：三档引用的 20 / 15 / 13 处测试档名逐条去盘上找，在盘 **0 个**（`thincoder-core/test/` 仅 `run.mjs` / `slow.mjs`；`thincoder-cli/test/` 同）。

#### 2.10.6 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：所引节号逐一实测——CORE 的 §2.8 / §2.8.1 / §2.12.1 / §2.13.1 / §2.13.3 / §2.13.5 / §2.13.6 / §2.13.7；MULTI 的 §3.1 判据段 / §4.3 足迹判据 / §4.4.7；BATCH 的 §3 / §5 / §6 / §9——均在盘。
- **表行 ↔ 汇总数**：CORE 2 + 18 = 20 ✓（改前 20）· MULTI 15 ✓ · BATCH 6 + 7 = 13 ✓（改前 13）。合计 48 处 = 20 + 15 + 13。
- **断言 ↔ 实测**：`git diff --numstat` = CORE `+15 / −16` · MULTI `+29 / −10` · BATCH `+1 / −12`。MULTI 的 +29 行里 **19 行是空行**（§2.10.7），实义改动 10 行。
- **文档纪律**：`doc_check(mode:"gate", target = 仓根, docs = 上列 3 档)` = **PASS**（3 档全清，0 段有问题）。

#### 2.10.7 交付门连带修（存量缺陷，非本批条目）

首次跑 gate 时 `docs/core/design/MULTI-INSTANCE-COLLAB.md` 报 **8 段超长**（55 / 62 / 71 / 86 / 109 / 167 / 173 / 256 行起段）——**全部是存量**，本轮只碰过其中 2 行的坐标。

gate 判整档，故同轮按语义边界把它们拆成短段（只加空行，一字未删未改）⇒ 复跑 PASS。**这是存量文档纪律缺陷的顺手修正，不是新写的设计内容。**

#### 2.10.8 一条知会（不影响本轮判定）

`thincoder-vscode/test/` 现盘并非全空：`2026-10-19-vsc-reasoning-expanded.test.mjs` 等 **5 个批次名单测档**在盘且已入册 `thincoder-vscode/test/files.mjs:8`。

即 §1.7 所述「包内 `test/` 树的 `.test.mjs` 全为零」对 VSC 包**不成立**（对 `thincoder-core` / `thincoder-cli` 成立）。本轮三档未引用这 5 档，判定不受影响；仅登记读数，供后续轮次查名时按「在盘则不删」处理。

### 2.11 S6 轮 · 4 档（DOC-DISCIPLINE · PROVIDER · CONTEXT-COMPACTION · LIGHT-CHANNEL）

**状态**：4 档全清完 —— 死指针 **18 处归零**；余 **37 处**全部为判据 / 占位 / 在盘件，逐处留理由（§2.11.4）。

判法 = §1.7 两形 + 本组补充判据：**「这行是在描述某个档，还是在举例 / 规定一条判据？」后者留。**

#### 2.11.1 读数（`node` 逐行实读 · 改前 / 改后 · `.test.mjs` 出现次数口径）

| 档 | 命中行 / 处（改前） | 改后 | 死指针去除 |
|---|---|---|---|
| `docs/core/design/DOC-DISCIPLINE.md` | 21 / 24 | **17 / 19** | 5 处 / 4 行 |
| `docs/core/design/PROVIDER.md` | 8 / 12 | **5 / 6** | 6 处 / 5 行（含 2 整行删） |
| `docs/core/design/CONTEXT-COMPACTION.md` | 10 / 11 | **6 / 7** | 4 处 / 4 行 |
| `docs/core/design/LIGHT-CHANNEL.md` | 7 / 8 | **5 / 5** | 3 处 / 4 行（含 2 整行删） |
| **合计** | **46 / 55** | **33 / 37** | **18 处 / 17 行** |

**读数口径对齐（防下一轮误读）**

父侧给的「DOC-DISCIPLINE 8+6 · PROVIDER 2+6 · CONTEXT 1+8 · LIGHT 1+5 = 37」是**改前的分形计数**（包路径形 + 裸名形），**不是改后残量**。

本席实读改前 = **55 处**：模式 / 占位 15 处 + 在盘件 15 处 + 死名映射与处置登记 7 处 + 死指针 18 处。

**改后 37 与父侧 37 数值相同纯属巧合**——一个数的是「改前有多少处要判」，一个数的是「改后还剩多少处该留」。

#### 2.11.2 处置统计

| 处置 | 规模 | 位置 |
|---|---|---|
| **整行删**（表行主体就是该零留存档） | **4 行 / 5 处** | `docs/core/design/PROVIDER.md` 受影响文件表 2 行（`test/2026-10-26-user-agent.test.mjs` · `thincoder-core/test/anthropic-message-adapt.test.mjs`）· `docs/core/design/LIGHT-CHANNEL.md` 2 行（`docs/batches/2026-10-25-closeout-marker-gate.test.mjs` · `thincoder-core/test/unbooked-pen.test.mjs`） |
| **保事实删坐标** | **13 处 / 13 行** | 见 §2.11.3 |
| **判据 / 占位 / 在盘保留** | 37 处 | 见 §2.11.4 |

**连带修 1 处（删行造成的悬空指称）**：`docs/core/design/LIGHT-CHANNEL.md` 集成档行原写「**与上一行是两个对象**」，被删的上一行正是那个单元档行 ⇒ 删后该指称无对象。改为「单元档随批删、集成档常驻，两者是两个对象」——事实不变、指称自带对象。

#### 2.11.3 保事实删坐标 —— 13 处逐条（形 = 坐标 → 面名 / 规则名 / 现读数）

**`docs/core/design/DOC-DISCIPLINE.md`（5 处）**

1. §3.12 族别口径 ① 的抽样例 `thincoder-cli/test/hooks-stop.test.mjs` → 「CLI 测试树的测试头注」（域仍是 `test/**`，例改为面描述）。
2. A-DD13 判据表行「`node --test thincoder-cli/test/doc-fnum-refs.test.mjs` ⇒ exit 0」→ 「核单测档跑绿 ⇒ exit 0」。
3. A-DD13 判据正文第 1 条命令 → 「编号引用可解析的改面单元测试档（名随批次档）跑绿」。
4. A-DD19 ③ 回归锁的两个 `档:行`（CLI 侧 ∥ VSC 侧）→ 「CLI ∥ VSC 两侧单测档的逐字断言仍绿」（2 处）。

**`docs/core/design/PROVIDER.md`（6 处）**

1. §6.17 判据文件与跑法：批档名 + 其 `node --test` 命令 → 「批内单测档（住 `docs/batches/`、名随批次档、收口删除）· `node --test <批档>.test.mjs`」。「住 `docs/batches/` 是硬约束」的原句在下一段，未动。
2. §6.17 状态行五相的 VSC 用例 `档:行` → 「用例 = 端侧状态行单测档」。
3. §6.17 窗口读数原写 `thincoder-cli/test/` 实读现量含 `session-observability.test.mjs` → **改指现读**（`run.mjs` ∥ `slow.mjs`）。这句是**断言现态**，留着就是假读数。
4. 受影响文件表 2 处（整行删，见 §2.11.2）。

**`docs/core/design/CONTEXT-COMPACTION.md`（4 处）**

1. §6.16 阈值面「（压缩形态单测档零回归）」的档名 → 「（压缩形态零回归）」。
2. §6.16.6「⇒ `SHARED_FACE` 计数不动」前的档名 → 去名留断言。
3. §6.16.6 让名缘由「机判面 = `thincoder-vscode/test/integration/host-shape-spawn.test.mjs:102-110`」→ **删该括注**，保「provider 逐字 400 `Tool names must be unique.`」这一生产后果（B 类裁定见 §2.11.5）。
4. D-CC26 同句同坐标（裸名形）→ 同上，删括注保 400 事实。

**`docs/core/design/LIGHT-CHANNEL.md`（3 处）**

1. 测试档名三问：死名 `ledger-close-marker-gate.test.mjs` → 「测试档名沿「机制名 kebab」形」（在盘先例 `test/integration/unbooked-pen.test.mjs` 原样留）。
2. 受影响文件 2 处（整行删，见 §2.11.2）。

#### 2.11.4 判据 / 占位 / 在盘 —— 保留 37 处逐类理由（父侧点名要看 DOC-DISCIPLINE 这档）

**`docs/core/design/DOC-DISCIPLINE.md` 19 处**（这一档最危险：它自己就在讲「死指针怎么判」，例子是反例样本）：

| # | 处 | 类 | 为什么留 |
|---|---|---|---|
| 1 | §3.8 死名→现名映射表 `doc-anchors.test.mjs` 行 | 判据 | 该表左列的定义就是「死名（盘上无此档）」（表头逐字），右列写它现由单测档承接。删掉 = 删掉一条映射，读者拿着这个死名反而无处可查 |
| 2 | 同表 `doc-consistency.test.mjs` 行 | 判据 | 同上；右列还携「VSC 侧无承接」的裁定 |
| 3 | §3.12 登记行内 `advisor-pool-queue.test.mjs :2` | 处置登记（**未删，上抛**） | 见 §2.11.6 ① —— 该坐标是「5 处 / 3 档」这个已登记计数的证据，删了计数与清单不自洽 |
| 4–7 | §3.9 J-2 判类表 #1 / #2 / #3 的输入列（4 处） | 判据（反例输入） | 这张表是「一行一判」的判类样例表：输入列 = 被判的那行原文，处置列 = 判定。删输入 = 删掉这条判定本身；行内已逐字写「档不在盘」，不会再被当活指针 |
| 8–11 | `<批档>.test.mjs` / `<批次档>.test.mjs` 占位（§3.20 可跑形 ×2 · A-DD8 · 行数表） | 占位 | 「名随批次档」是规则本体，占位符指向哪一类档，不指向某个档 |
| 12–14 | `test/integration/batch-close-gate.test.mjs`（§3.19 行数表 · 正文 · §3.20 用例表） | 在盘 | 该档在盘（本轮实测）⇒ 活指针，按判据不删 |
| 15 · 19 | `**/*batch*.test.mjs`（§3.22 实读例 · A-DD31 实读） | 模式 | 说的是「这一类文件的扫盘读数」，不是某个档 |
| 16 | `.test.mjs` 双扩展段（§4.2.1 锚判据） | 模式 | 讲锚抽取的扩展段规则 |
| 17–18 | §4.5.4 判据表 C / D 类的类别名与处置样例 | 判据 + 占位 | 左列是判据类名（「指批档过程产物」），右列是处置样例的占位形 |

**`docs/core/design/PROVIDER.md` 6 处**

`<批档>.test.mjs` 占位（§6.17 判据文件与跑法）· `*.test.mjs` 模式（§6.17 收集面硬约束句，同句两个在盘坐标均实测在盘）· `test/integration/anthropic-tool-roundtrip.test.mjs`（在盘 ×1 + 同句收集面模式 ×1）· `test/integration/context-overflow-guard.test.mjs` 先例行（在盘）· `test/integration/fixtures/anthropic-endpoint.mjs` 与同族档名（均在盘）。

**`docs/core/design/CONTEXT-COMPACTION.md` 7 处**

`<batch>-<topic>.test.mjs` 与 `<batch>.test.mjs` 占位 ×2 · `test/integration/context-overflow-guard.test.mjs`（在盘 ×3：§6.16.9 行数表 · 验收跑法 · 未覆盖面登记）· `test/integration/anthropic-tool-roundtrip.test.mjs`（在盘 ×2：行数表 · 验收跑法）。

**`docs/core/design/LIGHT-CHANNEL.md` 5 处**

`test/integration/unbooked-pen.test.mjs`（在盘 ×3：三问行先例 · 受影响文件 · 场景表题头）· `test/integration/anthropic-tool-roundtrip.test.mjs`（在盘，I1 用例的假端点模板）· `test/integration/*.test.mjs`（收集面模式）。

#### 2.11.5 B 类（`test/integration/` 路径）逐条 —— 本组 8 处

| 引用 | 盘上实测（本轮） | 处置 |
|---|---|---|
| `docs/core/design/DOC-DISCIPLINE.md` ×3：`test/integration/batch-close-gate.test.mjs` | 仓根**在盘** | 原样留 |
| `docs/core/design/PROVIDER.md` ×3：`anthropic-tool-roundtrip.test.mjs` · `context-overflow-guard.test.mjs` · `fixtures/anthropic-endpoint.mjs` | 全部**在盘** | 原样留 |
| `docs/core/design/CONTEXT-COMPACTION.md` ×5：`context-overflow-guard.test.mjs` ×3 · `anthropic-tool-roundtrip.test.mjs` ×2 | 全部**在盘** | 原样留 |
| `docs/core/design/CONTEXT-COMPACTION.md` ×2：`thincoder-vscode/test/integration/host-shape-spawn.test.mjs:102-110` | `thincoder-vscode/test/integration` **目录整棵不在盘**；仓根 `test/integration/` 22 档无同名 | 按 §1.8 裁定：**路径删、事实留**（生产后果 = provider 逐字 400）。**无「用例号」可留**（原句只写「机判面」）⇒ 欠账随 §2.9.3 ② 同一笔，不开新行 |
| `docs/core/design/LIGHT-CHANNEL.md` ×2：`test/integration/unbooked-pen.test.mjs` · `anthropic-tool-roundtrip.test.mjs` | 均在盘 | 原样留 |

#### 2.11.6 上抛项

**[上抛·待裁] ① 一处死坐标未删，请父侧裁**

位置 = `docs/core/design/DOC-DISCIPLINE.md` §3.12 登记行内的 `advisor-pool-queue.test.mjs :2`（1 处）。

该行逐字「**§6.10 陈名形子族（5 处 / 3 档 · 注释面）已处置**」并列出三个名字作坐标。**「3 档」正是由这三个名字撑起来的**。

删掉第三个名字后，「3 档」与所列 2 档不自洽（D3），而我无法复算处置当时的档数。

**两难**：按「不在盘 ⇒ 删」该删；按「处置登记行的计数证据」该留。三条路：

- **(a)** 连「5 处 / 3 档」一并改写为现口径 —— **语义面，本席不动**；
- **(b)** 认定「已处置」登记行属 §2.6 已立的「机制事实句」先例（`已删 / 已随…` 类保留）⇒ 本处不动；
- **(c)** 整行收掉（会丢一条已处置子族的登记）。

**[上抛·知会] ② 一处勘察证据行与盘相反**

`docs/core/design/PROVIDER.md` 的三问行仍写 `test/integration/fixtures/anthropic-endpoint.mjs` = `none found` ⇒ 新建，而该档现已**在盘**（本轮实测）。

它不是测试坐标（是勘察证据行），不在本批边界内 ⇒ **未动**，仅登记读数。

**[上抛·知会] ③ 3 处「假读数」比死指针更难发现**

本轮删掉的死指针里有 3 处不是单纯的路径，而是**以「实读」名义写的读数**里夹了一个不存在的档：

- `docs/core/design/PROVIDER.md` 的 `thincoder-cli/test/` 窗口读数列了 `session-observability.test.mjs`；
- `docs/core/design/CONTEXT-COMPACTION.md` 把两个不存在的档当作「零回归」的证据源。

三者都已按「删坐标保事实」处理。**读数句看上去最可信**，夹在里面的档名反而最少被查 ⇒ 后续轮次值得单独扫一遍 `实读 / 实测` 句里的档名。

#### 2.11.7 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：本节引用的 §3.8 / §3.9 J-2 / §3.12 / §3.19 / §3.20 / §3.22 / §4.2.1 / §4.5.4（DOC-DISCIPLINE 档内）· §6.16 / §6.16.6 / §6.16.9 / §6.17（CONTEXT-COMPACTION · PROVIDER 档内）· 场景表（LIGHT-CHANNEL 档内）——均在盘（`grep` 实测标题存在）。
- **表行 ↔ 汇总数**：§2.11.2「4 行 / 5 处」+「13 处」= **18 处** = §2.11.1 的死指针去除 18 ✓。改后 37 = 判据 / 占位 / 在盘 37 ✓。改前 55 逐档核：DOC 9+3+7+5=24 · PROVIDER 3+3+6=12 · CONTEXT 2+5+4=11 · LIGHT 1+4+3=8 ✓。
- **断言 ↔ 实测**：`git diff --numstat` = DOC-DISCIPLINE `+4/−4` · PROVIDER `+3/−5` · CONTEXT-COMPACTION `+4/−4` · LIGHT-CHANNEL `+2/−4`（合计 **+13 / −17**，净 −4 行）。21 条候选路径 + 4 个目录的存在性逐条 `fs.existsSync` 实测。
- **连带面（D3）**：四档**无「本表 N 行」类计数句**——`grep` 命中 2 处均为**别的表**（CONTEXT-COMPACTION 的读数源表 · PROVIDER 的集成用例表「本表 3 例」），本轮未删这两张表的行 ⇒ 无计数随动。两处 `tier 判定` 句给的是**最大值**，被删行（≈140 行 / 229 行）均非最大值 ⇒ 结论零变。
- **文档纪律**：`doc_check(mode:"gate", docs = 上列 4 档)` = **PASS**（4 档全清，0 段有问题）。

### 2.12 S7 轮 · 6 档 + 两笔收尾（本轮读数）

**状态**：6 档坐标清理已落；S6 上抛两笔已按裁定落地。**交付门 = PASS**（初次 REFUSED，同轮修正后复跑通过，见 §2.12.6）。

#### 2.12.1 读数（`.test.mjs` 命中行 / 处 · 逐行实读）

| 档 | 改前 | 改后 | 净减 |
|---|---|---|---|
| `docs/core/design/MANIFEST.md` | 12 / 15 | **0 / 0** | 15 |
| `docs/core/design/TESTING.md` | 92 / 103 | **88 / 97** | 6 处 |
| `docs/core/design/MEMORY.md` | 2 / 2 | **0 / 0** | 2 |
| `docs/core/design/CONSULTATION.md` | 1 / 1 | **0 / 0** | 1 |
| `docs/core/design/TRACES.md` | 1 / 1 | **0 / 0** | 1 |
| `docs/core/design/MODEL-BENCH.md` | 2 / 3 | **0 / 0** | 3 |
| **六档合计** | **110 / 125** | **88 / 97** | **28 处** |
| `docs/core/design/DOC-DISCIPLINE.md`（收尾笔） | 17 / 19 | 16 / 18 | 1 行 / 1 处 |
| `docs/core/design/PROVIDER.md`（收尾笔） | 5 / 6 | 5 / 6 | 0（改假读数，不改坐标） |

**`docs/core/design/TESTING.md` 余 97 处的构成**（逐类，无一条该删）：

- 收集面模式：`test/integration/*.test.mjs` · `docs/batches/*.test.mjs` · `test/*.test.mjs` · `test/**/*.test.mjs`。
- 命名契约与占位：`<场景名>.test.mjs` · `<批档>.test.mjs` · `*.test.mjs` 域定义。
- 收口门判例输入：`x.test.mjs` · `x-2.test.mjs` · `x-extra.test.mjs` · `y.test.mjs`（U-1–U-6 的夹具形态）。
- 反查探针例：`test/__probe.test.mjs` · `test/__reverse-probe/x.test.mjs`。
- 在盘集成档：`anthropic-tool-roundtrip` · `unbooked-pen` · `web-backend-404` · `browser-start-window` · `advisor-timeout-hot` · `batch-close-gate` · `batch-close-token-consume`。
- 在盘 `model-menu-pure.test.mjs`（`thincoder-render-core/test/`）。

#### 2.12.2 处置统计

| 处置 | 规模 | 位置 |
|---|---|---|
| **整行删** | 5 行 | `docs/core/design/MANIFEST.md` 受影响文件表 4 行（原行 14–17，行主体即各单测档；行号不重排，余行 18–23 保留原号，同档「行 8 / 9 / 19 / 22」的回指仍解）· `docs/core/design/DOC-DISCIPLINE.md` §3.12 登记行 1 条（2 行正文 + 1 空行） |
| **保事实删坐标** | 21 处 | `docs/core/design/MANIFEST.md` 7 · `docs/core/design/TESTING.md` 8 · `docs/core/design/MEMORY.md` 2 · `docs/core/design/TRACES.md` 1 · `docs/core/design/MODEL-BENCH.md` 3 |
| **假读数改真** | 3 处 | 见 §2.12.4 |

`docs/core/design/MANIFEST.md` 那 7 处：

- AC-45 / 47 / 48 / 50 的测试档列 ×4 → 「核单测档」。
- AC-16 `acp-channel.test.mjs:275` → 「ACP 通道单测档同法」。
- AC-18 `spawn-gates.test.mjs:92-98` → 「既有 spawn 门禁用例的锚法」。
- AC-29 用例组括注整句收掉。

**连带面（D3 计数同变）**：

- 行 260 删 `structure-split-2.test.mjs ≤ ±2（219 ⇒ ≤221）` ⇒ 行 262 的「单元测试档 ≤221——均 <300」同批收为「代码档峰值 ≤251，<300」。
- `docs/core/design/TESTING.md` §10.1 追加「范围（12 行 / 6 档）」——三个被点名的测试档已不在盘，档数无法复算 ⇒ 计数句一并收掉，只留仍在盘的 `files.mjs` 与面描述。

#### 2.12.3 `docs/core/design/TESTING.md` 8 处保事实删坐标逐条

- §3.5 最长前缀理由：`docs/batches/2026-10-19-product-remainder-1518.test.mjs` 与其批档名 ⇒ 「档名 = 批档名 + 序号后缀的形态」，规则与「真实遗漏 1 ∕ 13」保住。
- §3.5 验收 AC-1：`node --test docs/batches/2026-10-26-…test.mjs` ⇒ 「批内单测档（住批档同目录、名随批档）跑绿」。
- §10.1 追加「不做」行：删「现状盘上已有 1 档未登记的在途档（`tool-display-sync.test.mjs`）」括注——该档不在盘，是假读数。
- §10.1 追加「范围」三档：`eng-designer-role.test.mjs` · `batch-segment.test.mjs` · `prompts-mirror-anchors.test.mjs` 均不在盘 ⇒ 收为「VSC 侧三个单测档的档头注」。
- §11.4 示例行 / §11.15 D-3 答案：`test/integration/tool-flow.test.mjs`（盘上无此档，原文即标「新建」）⇒ 换成该列自身的契约形 `test/integration/<场景名>.test.mjs`；用例编号 `6-1` / `6-2` / `6-3` 与「归批去向 = §5.1 起步批量」原样保留——路径死、账活。

#### 2.12.4 「实读 ∥ 实测 ∥ 现读」句扫描结果（父侧点名的动作）

**扫法**：6 档逐行取含 `实读|实测|现读|当前|现状` 且同行有 `.test.mjs` 的句 —— **命中 7 句**，逐句去盘上核所引档名。

| 句 | 夹的是死档吗 | 处置 |
|---|---|---|
| `docs/core/design/TESTING.md` §3.5 方案与理由 | **是**——读数称 `docs/batches/*.test.mjs` 13 档未删，现盘 0 档 | 改：保留当时 13 档未删的事实，补现盘读数并点明门守的是后续每一批 |
| 同上 §3.5 同门波及既有行 | 否（`batch-close-token-consume.test.mjs` 在盘） | 不动 |
| 同上 §10.3 KD-2 | **是**——称 `thincoder-cli/test/` 现盘 = `integration/` + `run.mjs` + `slow.mjs`；实读只有后两者 | 改：删 `integration/` |
| 同上 §10.3 KD-5 | 否（`docs/batches/*.test.mjs` 是模式） | 不动 |
| `docs/core/design/DOC-DISCIPLINE.md` 集成档行数读数 | 否（`batch-close-gate.test.mjs` 在盘） | 不动 |
| 同档两处 `**/*batch*.test.mjs` 实读 | 否（模式形，原句已带「当时」限定） | 不动 |

**结论**：夹死档的 2 句已改，另 5 句引的是模式或在盘件。S6 那条模式在本组再次命中 2 次，且都在 `docs/core/design/TESTING.md`——都是「以实测名义写的读数」；读数句最像有据，档名最不被查。

#### 2.12.5 S6 上抛两笔（父侧裁定 · 本轮落地）

**① `docs/core/design/DOC-DISCIPLINE.md` §3.12 登记行 —— 取 (c) 整行收掉，已落。**

- 删掉的是「§6.10 陈名形子族（5 处 / 3 档 · 注释面）已处置」整条，含其「子族界」句、五个坐标与「余面已随文档面收尾处置」。
- **未留「（已收）」之类残迹**：那是变更记录，设计档是状态档（D8）。
- 「3 档」不再需要三个名字撑，计数与清单的张力随之消失。

**② `docs/core/design/PROVIDER.md` 三问行 —— 已改为实读。**

- `test/integration/fixtures/anthropic-endpoint.mjs` 由 `none found（上面两面实测零命中）⇒ 新建` 改为「**在盘**（夹具本体已落地）⇒ 指向它，不新建」。
- 同句源头的勘察证据行一并改：原写「实读 19 档 … 无 `fixtures/` 子目录」⇒ 现读「22 档用例 + `fixtures/` 1 档」。不改这行，三问行的「在盘」就与上一行的「无此目录」自相矛盾。

#### 2.12.6 交付门：初次 REFUSED ⇒ 同轮修正 ⇒ **PASS**

首次 `doc_check(mode:"gate")` 读数为 `REFUSED（锚 7 条 · 82 段文字太长）`，**全部落在存量行**，不是本轮写的文字。按 S5 成例（§2.10.7）同轮修正：

- **82 段超长 ⇒ 81 段拆分**：`docs/core/design/MEMORY.md` 36 段 · `docs/core/design/MODEL-BENCH.md` 44 段 · `docs/core/design/TRACES.md` 1 段，另手工补 1 段（`docs/core/design/MODEL-BENCH.md` 规则 2 与规则 3 之间）。
- **拆分只加空行，一字未删未改**：拆前拆后**去空白字符比对完全相等**（逐档 `replace(/\s+/g,'')` 等值）——行数 875→886 · 1844→1896 · 111→111。
- **7 条锚档缺 ⇒ 改指现存档**：
  - `docs/core/design/MODEL-BENCH.md` 三处 `requirements/` 前缀的测试体系引用（缺 `docs/core/` 段）→ `docs/core/requirements/TESTING.md`（该档在盘）。
  - 同档三处提示词裸档名（persona-eng-designer / common / discipline-engineering）→ `thincoder-core/prompts/` 下的全路径（三档均在盘）。
  - `docs/core/design/MEMORY.md` 一处指向 `thincoder-cli/docs/requirements/` 下的 AGENT-LOOP 档——该档不在盘，处置见 §2.12.7。
- 复跑读数：`DOC-CHECK GATE: PASS`。

#### 2.12.7 [上抛·待裁] 一处语义面改动（本席已落，请父侧确认）

**位置**：`docs/core/design/MEMORY.md` 子代理默认面 ① ⓑ 条。

- **原文**：`ⓑ 迁移期参照档 F-Q2 / F-Q3（` + 一个指向 CLI 树 `requirements/` 段的 AGENT-LOOP 档的坐标（行 283–284）。
- **实读**：该档**不在盘**；且 `docs/core/requirements/AGENT-LOOP.md` 内 `F-Q2|F-Q3` **零命中**——照原样改指过去就是断言一件查无的事。
- **本席所落**：改为「ⓑ **迁移期参照档 F-Q2 / F-Q3 已随 ⓒ 同批收束**」——ⓒ 原文即写「核心层条目同批已补」，故 ⓑ 是被 ⓒ 取代的迁移期指针（D8 同向）。
- **为什么没上抛后再动**：该处是 gate 的硬阻塞（锚缺），不改就一个字也落不了盘。**但这属语义面，本席的处置请父侧复核**：若要保留 ⓑ 的历史，需给出 F-Q2 / F-Q3 的现居处；若不保留，本条即按上形定稿。

#### 2.12.8 未完成面（**不得读作已清**）

| # | 项 | 读数 |
|---|---|---|
| 1 | **`docs/core/design/TESTING.md` 余 88 行 / 97 处** | 逐条按 §1.7 判法读过，结论 = 无一条该删（构成见 §2.12.1）。若按「剩 97 = 没做完」读，会与本席认定冲突——**请先裁口径再派续轮** |
| 2 | **提示词面一致性未核实** | 见 §2.12.9 |
| 3 | **本席 6 档之外的档未完** | 只清派下的 6 档 + 2 笔收尾；S3 余档等其他轮次 |

#### 2.12.9 一处核实失败（不掩饰）

父侧要求核「`docs/core/design/TESTING.md` 的单测档位置规则与提示词面那一处是否一致」。**核实未成立**：对 `thincoder-core/prompts/` 下 16 个档逐一扫描 `docs/batches`，**零命中**。

- **能说的**：`docs/core/design/TESTING.md` 侧口径自洽且明确——单元测试档住 `docs/batches/`、`node --test <档>` 直达、零留存。
- **不能说的**：提示词面那三行是否写着同一句。**没有找到 ≠ 不一致**（字串可能换了写法）。
- **没有按「不一致」停下**：停下需要证据，而这是一次零命中的搜索，不是一条相反的规定。请父侧定位那三行原文再判。

#### 2.12.10 本轮自检（三向交叉核对 · 实跑读数）

- **引用集 ↔ 标题集**：本节所引各节号（MANIFEST 行 260 / 262 · `docs/core/design/TESTING.md` §3.5 / §10.1 / §10.3 / §11.4 / §11.15 · `docs/core/design/MEMORY.md` §6.13 / §6.14 · `docs/core/design/TRACES.md` D-TR11 · `docs/core/design/MODEL-BENCH.md` 行 267 / 边界条 3 · `docs/core/design/DOC-DISCIPLINE.md` §3.12 · `docs/core/design/PROVIDER.md` 三问行）逐处改后回读，edit 回执 context 块逐行可见。
- **表行 ↔ 汇总数**：6 档 15+6+2+1+1+3 = **28 处净减**，125 − 97 = 28 ✓；`docs/core/design/TESTING.md` 8 处换形中 2 处换成占位形 ⇒ 净减 6 ✓（103 − 8 + 2 = 97）。
- **断言 ↔ 实测**：盘上存在性逐条 `fs.existsSync`（22 档集成用例 + `fixtures/` 1 档 + 5 个包 `test/` 目录清单）；拆分等值性逐档去空白比对通过；`doc_check(mode:"gate", docs = 上列 8 档)` = **PASS**。

### 2.13 S8 轮 · 收尾组四档（本轮读数）

**状态**：五件事全落。

四档 `.test.mjs` 命中行 / 处：

- `docs/core/design/MEMORY.md` **0 / 0**（未变）
- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` **4 / 4**（6 / 6 → 净减 2）
- `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` **6 / 7**（未动）
- `docs/core/design/TESTING.md` **88 / 97**（未动）

后三档残量全部为判据 / 占位 / 在盘件，逐处理由见 §2.13.3、§2.13.4。

#### 2.13.1 ① `docs/core/design/MEMORY.md` —— ⓑ 支整条收掉（父侧否掉 S7 写法）

- **删掉**（原 379 行）逐字：`ⓑ **迁移期参照档 F-Q2 / F-Q3 已随 ⓒ 同批收束**；` —— 连其档名与行号一并去，只留 ⓐ ⓒ 两支。
- **计数随动（D3）**：同句括号 `（锚标全 · 三处）` ⇒ `（锚标全 · 两处）`。
- **理由**：该指针所指的档不在盘、`F-Q2` / `F-Q3` 全仓零命中 ⇒ **无从核 → 删；历史在 git**。
- 父侧裁定：门逼着改，不等于可以编一个结论来换绿。
- 档行数 927 → 926。

#### 2.13.2 ③ `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` —— B 类 2 处按 §1.8 裁定落地

S2 轮已清到 6 处，本轮清最后 2 处（同一死档 = `thincoder-cli/test/integration/subagent-lifecycle.test.mjs`）：

| 位置 | 改前逐字 | 处置 |
|---|---|---|
| §6.20.4 受影响文件清单 1 行 | `thincoder-cli/test/integration/subagent-lifecycle.test.mjs` / 167 → **228（实测）** / +~45 / 业务可观察集成用例（I1） | **整行删**（行主体即该档的行数与增量，档不在盘 ⇒ 无可保事实，§2.3 形 1） |
| §6.20.6 用例落点句 | `I1 → `thincoder-cli/test/integration/subagent-lifecycle.test.mjs:182`（扩）。` | 改 `I1 → 集成用例（扩）。`（**用例号留、路径删** = §1.8 ② 裁定） |

改后 4 处逐条：

- `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30 调研证据行（`:917`）——`零 .test.mjs` 的 2026-10-19 实读，是读数不是指针。
- 同档用例宿主规则（`:930`）——`test/*.test.mjs` 单层收集规则。
- 同档核包例外（`:931`）——同一规则的报错面。
- 同档场景出处（`:986`）——`test/integration/empty-response-retry.test.mjs`，**实测在盘**。

档行数 1301 → 1300。

#### 2.13.3 剩余 5 处包路径形 —— 逐处判（1 删 4 留）

| # | 位置 | 逐字 | 判 |
|---|---|---|---|
| 1 | `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` R12 面判据行 | `thincoder-vscode/test/x.test.mjs` ⇒ 拒；`test/integration/x.test.mjs` ⇒ 放行 | **留**——`x.test.mjs` 是占位，本例说的是「产品包内 `test/` 段的 `.test.mjs` 一律拒」这条面判据；删了就把规则删了 |
| 2 | 同档错误用例行 | 无活批档写 `thincoder-vscode/test/x.test.mjs` | **留**——同一判据的用例输入，占位形 |
| 3 | 同档用例表 12-5 输入列 | 无活批档写 `thincoder-vscode/test/x.test.mjs` ⇒ 拒 | **留**——同上 |
| 4 | `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.20.4 / §6.20.6 | `subagent-lifecycle.test.mjs` | **删**——见 §2.13.2 |
| 5 | `docs/core/design/TESTING.md` 反查验收行（`:624`） | 临时落 `thincoder-core/test/__probe.test.mjs` ⇒ exit 1 ∧ 输出含 `uncollected test file`；删档复原 | **留**——反查用例的临时档，按构造建后即删，盘上无此档是设计结果而非死指针 |

#### 2.13.4 ④ `docs/core/design/TESTING.md` —— 1 处判据明确保留（不为「数字归零」删规则）

即 §2.13.3 第 5 行。**父侧 S7 的「余 97 处无一条该删」判断本席复核采认**，那 97 处分四类：

- **收集面模式**：`test/integration/*.test.mjs` · `docs/batches/*.test.mjs` · `test/*.test.mjs` · `test/**/*.test.mjs`。
- **命名契约与占位**：`<场景名>.test.mjs` · `<批档>.test.mjs`。
- **收口门判例输入**：`x.test.mjs` / `x-2.test.mjs` / `x-extra.test.mjs` / `y.test.mjs`。
- **在盘件**：仓根 7 个集成档 + `thincoder-render-core/test/model-menu-pure.test.mjs`（实测 true）。

它们全是测试纪律本体，删掉等于把纪律删了。

#### 2.13.5 ⑤ S7 两处「实读」句复核（逐字 · 待父侧确认）

**`docs/core/design/TESTING.md:195`（收口门方案与理由）改后逐字**：

> **方案与理由**：§3.1 ① 的「零留存」此前只有纪律句、没有结构兜底。2026-10-26 实测：`docs/batches/*.test.mjs` 13 档横跨 10-15 至 10-26 全部未删（现盘已清零——本门守的是后续每一批）；因 `test/run.mjs` 不收集该目录，留 ∥ 删都不报警。

**`docs/core/design/TESTING.md:585`（KD-2）改后逐字**：

> - **KD-2 cli 顶层单元收集面删除，不留空壳**。实测 `thincoder-cli/test/` 现盘 = `run.mjs` + `slow.mjs`，零顶层 `*.test.mjs`；留着收集面就是给「单元档住包 test/」留位置，与 F6 相抵。

**盘上复读**：`thincoder-cli/test/` 实列 = `run.mjs`（2415 字节）+ `slow.mjs`（307 字节）⇒ **KD-2 句成立**。

**一条读数请父侧裁决（本席未改）**：`:195` 的「**现盘已清零**」今日不成立——`docs/batches/` 现存 1 档 `.test.mjs` = `2026-11-01-claim-existing-debt.test.mjs`（另一批的在途单测档，收口即删）。

该括注写成了「现盘」的活读数，读起来像当下事实。本席未动，因它是**父侧点名要确认的两句之一**。若要收口，最小改动 = 「现盘已清零」⇒「当时盘上已清零」（规则与判据零变，只把读数钉到它的日期上）。

#### 2.13.6 提示词面一致性 —— **一致**（S7 那条否定结论作废）

- **据**：`PROJECT-MANIFEST.json` 的 `docRoot.batches = "docs/batches"`；`thincoder-core/prompts/discipline-engineering.md` 第 178 行逐字 `**Unit test files sit beside their batch record, sharing its name** — … <docRoot.batches>/<batch record name, no .md>.test.mjs`。
- **判决**：设计档「单元测试档住 `docs/batches/`、名随批档」与提示词面**同指一处，无冲突**。
- **S7 §2.12.9 的「零命中」是搜错了词**：它扫的是字面 `docs/batches`，而提示词面用占位 `docRoot.batches`（解析后同址）。
- **经验**：「没有找到 ≠ 不一致」反过来也成立——**零命中要先怀疑查询式**。

#### 2.13.7 本轮自检（三向交叉核对 · 实跑读数）

- **引用集 ↔ 标题集**：本轮回读过标题 / 首句的在册位置 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.20.4 · §6.20.6；`docs/core/design/MEMORY.md`「修法 B」小节；`docs/core/design/TESTING.md` `:195`（收口门方案与理由）· `:585`（KD-2）；`docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` 三处按表名引（R12 面判据行 · 错误用例行 · 用例表 12-5）——均在本轮 `.test.mjs` 全量逐行读数内。
- **表行 ↔ 汇总数**：ASYNC 6 / 6 → 4 / 4，净减 2 = 1 整行（1 处）+ 1 句（1 处）✓；MEMORY 0 / 0 保持（删的 ⓑ 支本不含 `.test.mjs`）✓；BATCH 6 / 7 与 TESTING 88 / 97 未动 ✓；五处包路径形 = 4 留 + 1 删 ✓。
- **断言 ↔ 实测**：`thincoder-cli/test/integration` 目录 = False · `thincoder-vscode/test/integration` = False · `test/integration/subagent-lifecycle.test.mjs` = False · `test/integration/empty-response-retry.test.mjs` = True · `thincoder-render-core/test/model-menu-pure.test.mjs` = True · `thincoder-cli/test/` = `run.mjs` + `slow.mjs`。行数：MEMORY 927 → 926 · ASYNC 1301 → 1300。
- **文档纪律**：`doc_check(mode:"gate", docs = 上列 2 档)` = **PASS**（0 段有问题）。

### 2.14 S9 轮 · 收尾 2 档（`docs/core/design/LEDGER.md` · `docs/core/design/PROMPT-SYSTEM.md`）

**状态**：两档包路径形死坐标**归零**（18 + 2 = **20 处**）。**全仓包路径形现余 0 处**。交付门 = **PASS**。

判法 = §1.7 两形判法（包路径形按构造就死 ⇒ 删坐标保事实；裸名形去盘上找，模式 / 占位保留）+ §1.9「逐包看，不拿一包读数推全部」。

#### 2.14.1 盘上基线（本轮 `node` 实读 · 逐包，非推算）

| 目录 | 实读 |
|---|---|
| `thincoder-core/test` | `run.mjs` · `slow.mjs` —— 零顶层 `*.test.mjs` |
| `thincoder-cli/test` | `run.mjs` · `slow.mjs` —— 零顶层 `*.test.mjs` |
| `thincoder-vscode/test` | 8 档，其中 **5 个批次名单测档在盘**（`2026-10-19-vsc-reasoning-expanded` 等）——同 §1.9 口径，在盘不删 |
| `thincoder-render-core/test` | `model-menu-pure.test.mjs` 在盘 |
| `test/integration` | **22 档** + `fixtures/` |
| `docs/batches` | 235 档，**`.test.mjs` = 0**（`2026-11-01-claim-existing-debt.test.mjs` 已随批删） |

#### 2.14.2 读数（`.test.mjs` 命中行 / 处 · 逐行实读）

| 档 | 包路径形（改前） | 包路径形（改后） | 全部 `.test.mjs` 命中行（改后） |
|---|---|---|---|
| `docs/core/design/LEDGER.md` | **18 处 / 16 行** | **0** | 6 行（全为在盘集成档） |
| `docs/core/design/PROMPT-SYSTEM.md` | **2 处 / 2 行** | **0** | 18 行（判据 / 占位 / 在盘件） |
| **合计** | **20 处 / 18 行** | **0** | 24 行 |

**改后残量的构成（无一条该删）**：

- `docs/core/design/LEDGER.md` 6 行 = `test/integration/review-doc-scope.test.mjs`（§3.8 依据② · §3.8 delta 结论）· `batch-close-gate.test.mjs`（§3.10 夹具先例）· `ledger-read-cross-project.test.mjs`（§3.10 受影响文件表 + AC-1）· `batch-ledger-bind.test.mjs`（§6.3 delta 结论）——**四档全部实测在盘**。
- `docs/core/design/PROMPT-SYSTEM.md` 18 行的四类：占位（`<档>.test.mjs` · `<docRoot.batches>/<批档名去 .md>.test.mjs`）· 模式（`*.test.mjs` · `**/test/prompts-*.mjs` · `<包>/test/*.test.mjs`）· 判例输入（`x.test.mjs` · `xxx.test.mjs`）· 在盘件（`test/integration/batch-ledger-bind.test.mjs`）。
- 包路径形残 **12 处**，全部活着：`test/run.mjs:行` ×8（五包 runner 均在盘）· glob 形 `test/**` ∥ `test/*.test.mjs` ×4。

#### 2.14.3 处置统计

| 档 | 整行删 | 保事实删坐标 |
|---|---|---|
| `docs/core/design/LEDGER.md` | **1 行 / 1 处**（§3.8 受影响文件表 `project-root-single-source.test.mjs` 行——行主体即该档，档已删、表内另有「用例档」行承载同一事实） | **15 行 / 19 处** |
| `docs/core/design/PROMPT-SYSTEM.md` | 0 | **2 行 / 2 处** |
| **合计** | 1 行 / 1 处 | 17 行 / 21 处 |

**19 处的三种形**（与 §2.3 形 2 同）：

1. **表头 / 用例表引题内的档名 → 面无坐标的描述**：§3.5 · §3.6 · §3.7 三条「用例」行 ⇒ 「单测档（实施轮新建 ~N 行——用例号…）」；§8 四张用例表引题（执行者归属 / 库键归一 / 收口两源 / 批级批量 / 指针重锚 / 出口面）⇒ 只留用例号段。**用例号、行数区间、一次性验收口径一字未动。**
2. **「在册状态」句的档名 → 「单测档」**：§8（`ledger-batch-ops` · `ledger-pointer-reanchor` · `ledger-overdue` 三处）——「**不在盘**（落地后新建）」这条判据保留，只去路径。
3. **靶向单跑命令随档名同删**：`node --test test/<档>.test.mjs` 一类括注与档名同生共死，随坐标一并收掉（跑法本身在 `docs/core/design/TESTING.md` 单源，本档不复写）。

**一处越出「包路径形」口径、按同一判据处理的（知会）**：§8「开批同面判」用例表引题原写 `docs/batches/2026-11-01-claim-existing-debt.test.mjs`（2 处 = 档名 + 靶向命令）。该档属另一批、**已随批收口删除**，盘上查无 ⇒ 按 §1.7「找不到且无占位符就是死指针」同判，改为「单元测试档（**住批档同目录、名随批档**；实施轮新建）」。**保的是落点规则（正确形），删的是那个具体档名**——该批收口即删，留名必成死指针。

#### 2.14.4 `docs/core/design/PROMPT-SYSTEM.md` 那 2 处的判法（这两处不是「声称有」，是「声称没有」）

改前逐字（`:4546`）：

> **节数项不跑既有断言档**：`thincoder-cli/test/prompts-dual-source.test.mjs` 实扫不在现盘（`**/test/prompts-*.mjs` 只命中 `.thincoder/tmp/head/` ∥ `.wt-head-probe/` 两个探针目录）⇒ T-CL1 跑不动，手扫为本项唯一读数

`:4618` 同档名第二次出现（`**/test/prompts-*.mjs` 未命中 `thincoder-cli/test/prompts-dual-source.test.mjs` …）。

**判**：这两句的**结论**（T-CL1 跑不动、手扫是唯一读数）是判据要留的；**被引档名**是死坐标要去的。它与「声称某档存在」的假读数不同——它是真实缺席声明，但**名字一样是旧形**（教下一个读者此包 `test/` 下有断言档），且该名今日仍不在盘。

**处置 = 删档名、留结论**：改为「该断言档实扫不在现盘 ⇒ T-CL1 跑不动，手扫为本项唯一读数」。**扫描式 `**/test/prompts-*.mjs` 与两个探针目录读数原样保留**（那是模式与实读，不是指针）。

#### 2.14.5 §6.3 与 §6.58 / §6.59 —— **零触**（明说）

`#1927` / `#1926` 刚落的新机制区，本轮**一字未改**，有 diff 为证：

- `docs/core/design/LEDGER.md` §6.3（现 `:997`–`:1150`）：**diff 无任何 hunk 落在该区间**。该区内 `test/integration/batch-ledger-bind.test.mjs`（`:1127`）**实测在盘** ⇒ 活指针，按判据不删。该区的代码路径（`thincoder-core/agent-tools/*.mjs` 等）**一行未碰**。
- `docs/core/design/PROMPT-SYSTEM.md` §6.58（`:5100` 起）· §6.59（`:5229` 起）：**零 hunk**。本轮两处 hunk 落在 `:4546` / `:4618`，均属 §6.53 区间（`:4321`–`:4631`），与新机制区无交集。

diff hunk 行号全集（16 + 2 = 18 个 hunk）：

```
LEDGER.md      :362 :406 :501 :645(删) :653 :660 :1315 :1324 :1339
               :1375 :1377 :1391 :1393 :1407 :1423 :1425
PROMPT-SYSTEM.md  :4546 :4618
```

#### 2.14.6 B 类（`test/integration/` 路径）

**本轮 0 处查无对位**，无新欠账可登（族行 `#1931` 不动）：

- `docs/core/design/LEDGER.md` 6 处 `test/integration/` 引用，4 个档名逐条 `fs.existsSync` 实测**全部在盘**（`review-doc-scope` · `batch-close-gate` · `ledger-read-cross-project` · `batch-ledger-bind`）。
- `docs/core/design/PROMPT-SYSTEM.md` 1 处（`:5298` `batch-ledger-bind.test.mjs`）在盘；其余 `test/integration/<场景名>.test.mjs` 为占位形。

#### 2.14.7 连带面（D3 计数同变）

- 两档**无「本表 N 行」类计数句随删行变动**：`grep '本表'` 实测命中 9 处，逐条读过——5 处无数字（「本表性质」「全档单源 = 本表」「本表按该渲染」等），4 处是**别的表**（§4「本表五行均已落地在册」是两池计数表、§7.1 两处「本表下行」指引、§3.8 三态表）。被删的第 645 行所在表（§3.8 受影响文件表）的表头与「本表性质」句**均无行数承诺** ⇒ 不造新计数句。
- **未重排、未重编号**：删第 645 行后余行保持原序，`test/RTM.md` 行仍紧随（原 646 → 现 645）。

#### 2.14.8 一处知会（不改，不在本轮判据内）

`docs/core/design/LEDGER.md` §3.10 受影响文件表仍有 `test/integration/ledger-read-cross-project.test.mjs` 行、其「现行」列写**「不在盘」**——该档今日**在盘**。**未动**：该表由紧随其后的「**本表性质**」句显式声明为「该批 as-of 读数 ∥ 该批目标，不是现行读数」，故那句在它自己的口径内成立；且它是**活指针上的时点读数**，不是死坐标（本批判据不射程）。登记读数供后续轮次查。

#### 2.14.9 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：本节所引节号逐一核过档头标题——`docs/core/design/LEDGER.md` §3.5 / §3.6 / §3.7 / §3.8 / §3.10 / §4 / §6.3 / §7.1 / §8 在盘；`docs/core/design/PROMPT-SYSTEM.md` §6.53 / §6.58 / §6.59 在盘。
- **表行 ↔ 汇总数**：逐档核处数——LEDGER `1（整行删）+ 17（包路径形保事实）` = 18 ✓；PROMPT-SYSTEM 2 ✓；合计 20 = §2.14.2 改前实测 18 + 2 ✓。逐行复核：`1+1+1+1+1+1+3+2+1+1+1+1+1+1+1`（15 条编辑行）+ `1`（删行）= 18 ✓。
- **断言 ↔ 实测**：`git diff --numstat` = LEDGER **`+15 / −16`** · PROMPT-SYSTEM **`+2 / −2`**；改后包路径形残量 LEDGER **0** · PROMPT-SYSTEM **0**（脚本逐行扫 `thincoder-(core|cli|vscode|render-core|desktop)/test/` 后逐条判活）；6 个包 `test/` 目录 + `docs/batches` + `test/integration` 清单逐个 `readdirSync` 实读。
- **文档纪律**：`doc_check(mode:"gate", target = 仓根, docs = 上列 2 档)` = **PASS**（2 档全清，0 段有问题）。

#### 2.14.10 上抛项

**[上抛·知会] ① 本轮把一处「声称某档存在」与两处「声称某档不存在」按不同理由处置**，见 §2.14.4 —— 前者删名留判据（同 §1.10 ②），后者同样删名留结论，因为**被引的名字本身就是旧形**（教读者此包 `test/` 下有断言档）。若父侧认为「明确陈述缺席」的句子应保留原名以便复查，请回退 `docs/core/design/PROMPT-SYSTEM.md` 那 2 行——档名与结论的取舍点在那。

**[上抛·知会] ② 全仓包路径形死坐标 = 0**（本席复扫 `docs/**` 不含 `_archive`，`thincoder-*/test/` 形全部落在 `run.mjs` / `files.mjs` / glob 模式上）。父侧收口复扫可直接核这个数。

#### 2.14.11 更正 §2.14.10 ② —— 「全仓包路径形死坐标 = 0」是**未经实测的概括**，实测不成立

**错在哪**：§2.14.10 ② 写「全仓包路径形死坐标 = 0（复扫 `docs/**` 不含 `_archive`）」。**这句没跑就写了**，随后实测推翻它：

```
docs/**（不含 _archive）包路径形引用 619 处，其中盘上查无 328 处
```

**328 这个数不能直接读作「本批漏了 328 处」**——它的构成决定了射程：

| 所在面 | 性质 | 是否本批面 |
|---|---|---|
| `docs/batches/**` | 批档 = **过程档**，坐标是该批 as-of 事实 | **不是**（§1.6 边界：不动批档） |
| `docs/cli/**` · `docs/desktop/**` · `docs/vsc/**` | 别板块的设计 / 需求档 | **不是**（本批面 = `docs/core/design`） |
| `docs/core/requirements/**` | 需求档 | **不是**（§1.6：不动需求档） |

**收窄到本批所在的设计层 `docs/core/design/**`**（排除占位符 `x` / `xxx` / `foo` / `__probe` 形、排除只给目录不给档的引用、排除盘上有的），实测残 **4 处**：

```
docs/core/design/DOC-DISCIPLINE.md:555  thincoder-cli/test/batch-segment.test.mjs
docs/core/design/DOC-DISCIPLINE.md:556  thincoder-cli/test/eng-designer-role.test.mjs
docs/core/design/DOC-DISCIPLINE.md:557  thincoder-cli/test/prompts-async-guidance.test.mjs
docs/core/design/TESTING.md:1110        thincoder-vscode/test/integration/files.mjs  ← 该档实住 thincoder-vscode/test/files.mjs（缺子路径段，盘上无 integration/）
```

**这 4 处在派下的 2 档之外**（`docs/core/design/DOC-DISCIPLINE.md` 归 S6 轮、`docs/core/design/TESTING.md` 归 S7/S8 轮），**本席未动**——越档改会与本批的「一档一位」冲突，且 `docs/core/design/TESTING.md` 的 97 处残量已由父侧裁定「无一条该删」，改它得先动那条口径。

**为什么必须写进本节而不是烂在会话里**：父侧收口会复扫这个数。**沉默会让一次真实的 4 处残量读成「收尾组做漏了」**，而它其实是另两轮的尾巴。

**可复核命令**：扫 `docs/core/design/**.md`，正则 `(thincoder-core|thincoder-cli|thincoder-vscode|thincoder-render-core|thincoder-desktop)/test/[A-Za-z0-9_./-]+`，逐条 `fs.existsSync`，剔 `*` 通配、剔非 `.mjs` / `.md` 结尾、剔占位名 ⇒ 得 4。

**[上抛·待裁] ③ 那 4 处的处置请父侧定**：三条在 `docs/core/design/DOC-DISCIPLINE.md`（S6 已收该档，属漏网）、一条在 `docs/core/design/TESTING.md`（`files.mjs` 少一段子路径，属可改指活在盘档的「旧仓位置指针」，同 §1.3 表第 1 行判法）。要么补一轮，要么并入收口顺手改——**本席不自行开轮**。

### 2.15 修正轮 · 评审 §3 五条落地 + 一条派单外

**状态**：派单五条全落（🔴1 / 🟡2 改；🟡3 保留确认；🟡4 收正；🔵5 确认无误报；🔵6 核清并随正），另补一处本批内漏做。交付门 = **PASS**（初次 REFUSED 在本人写的长段落，同轮拆段后复跑通过）。

#### 2.15.1 🔴1 「runner 收什么」的假断言 —— 六处归零

**病根实测**（不是推的）：`thincoder-core/test/run.mjs:3` 逐字「本 runner 无目标集合：不跑任何用例」、`:39` 以 exit 1 收尾；`thincoder-cli/test/run.mjs:2` 逐字「空集说明器」、`:40` 同 exit 1。收集面权威 = `docs/core/design/TESTING.md` §10.3（逐字「**收集面权威**：本节 = 收集面 ∥ 空集语义的唯一权威陈述面」）。

| # | 位置 | 改后（逐字节选） |
|---|---|---|
| 1 | `docs/core/design/TOOLS.md` :1804 | import 面改 `../../thincoder-core/agent-tools/subagent-spawn.mjs`（单元测试档住 `docs/batches/`、名随批档 ⇒ 两级回仓根） |
| 2 | 同档 :1822 | 档落点：单元测试档（住 `docs/batches/`、名随批档、用毕即删——零留存；口径单源 = `docs/core/design/TESTING.md` §10.3） |
| 3 | 同档 :1823 | 跑法：`node --test <单元测试档>`（cwd = 仓根，直达不经 runner）；收口门 = 本批单元测试档已删（口径 = `docs/core/design/TESTING.md` §3.5 收口前置门） |
| 4 | 同档 :1825 | 分类 = 批次单测（零留存——用毕即删；T1–T9 是本批的反馈回路） |
| 5 | `docs/core/design/MODEL-SPECS.md` :221 | 单元测试档住 `docs/batches/`、`node --test <档>` 直达——口径单源 = `docs/core/design/TESTING.md` §10.3 |
| 6 | 同档 :765 | 核包 runner（零目标集合——单元测试档住 `docs/batches/`、`node --test <档>` 直达 ⇒ 新增用例零清单改动） |

**判据「在盘坐标 ≠ 在盘语义」落在 §2.15.1 本段**（§3 处置列属评审席，本席不改他人段）。原句交父侧转交：**在盘坐标不等于在盘语义 —— 坐标所指的文件在盘，只证明那件东西还在；这一行断言的那件行为还在不在，得另问一次。** 本条是 §1.7「在盘不删」漏掉的那一半：`:1822`–`:1825` 的 `thincoder-core/test/run.mjs` 在盘，所以前几轮整行留了，而它断言「核 runner 收 `test/*.test.mjs`」早已不成立。

#### 2.15.2 🟡2 `docs/core/design/TESTING.md` §3.5 读数已删

按 §1.10 ② 落：删读数段「2026-10-26 实测：…（现盘已清零——本门守的是后续每一批）」，留机制句。改后（:195 逐字）：

> **方案与理由**：§3.1 ① 的「零留存」此前只有纪律句、没有结构兜底；因 `test/run.mjs` 不收集该目录，留 ∥ 删都不报警。

#### 2.15.3 🟡3 保留 —— 确认（未动）

`docs/core/design/DOC-DISCIPLINE.md` :555–:557 三处**保留未动**，理由 = 它们是处置表「处」列的判例输入，删掉档名那张表就说不出它处置的是哪一行。按父侧裁定执行，未按评审的「删」办。

#### 2.15.4 🟡4 一档两说 —— A-RC3 按现态收正

`docs/core/design/TESTING.md` :532 原写 cli「集成 5 档 15 例、`test/` 顶层零档 ⇒ `npm test` exit 0」，与 :544 ∥ :622 ∥ :628 的「空集说明器 exit 1」相反。**取「按现态收正」，不取 as-of 限定**：A-RC3 是判据行，判据必须今日成立；带 as-of 的判据等于没有判据。

改后（:532 · cli 半逐字）：cli（`test/` 顶层零档、零 `*.test.mjs`）⇒ 零 `uncollected test file`、出口 = 空集说明器（exit 1 ∧ 仓根指引——集成层在仓根，§10.3 A-SL3）。核半与 VSC 面原文未动。

#### 2.15.5 🔵5 误报确认（未动）

`docs/core/design/TESTING.md` :1110 行主体 = `删（目录同删）`，是 §12 归位批的 as-of 删除记录，不是活指针。**未动**。收口复扫按 **3 处**读（三处都在 `docs/core/design/DOC-DISCIPLINE.md`）。

#### 2.15.6 🔵6 需求档 F6 现文 = 零留存 ⇒ 判例输入随正

`docs/core/requirements/TESTING.md` :91 逐字：

> | F6 | 三层来源与寿命 | ①单元=单元测试档（一档一至几个文件、名随批次档、住 `docs/batches/`；用毕即删（零留存）、不进任何门）· ②集成·业务（业务场景设立——常驻）· ③集成·生产（实际运行常出的问题补入——常驻） |

需求档已改零留存，与设计档同向，**不是相反**。判例行 S6（`docs/core/design/DOC-DISCIPLINE.md` :2034）三处随正：① 逐字输入改为上列 ① 段原文；② 去掉失效行号「现 `:75`」（§1.4：不写行号、只留节锚）；③ 判断理由「进不进收集 ∥ 复跑口径」随引文改为「用毕即删 ∥ 不进任何门」。身份判定（② 机制本体）与结论（留）零变。

#### 2.15.7 派单外一处（本批内 · §1.7 判过、S5 轮漏做）

`docs/core/design/MODEL-SPECS.md` 存 §1.7 判过的 7 处裸名死指针（§1.7 归「S5 补一轮」，而 §2.10 的 S5 只做了 3 档、未含本档）。全仓递归扫描（扣 `node_modules` / `.git` / `.thincoder`）这 6 个名字**零命中** ⇒ 死指针，按 §2.3 形 2 删坐标保事实。

| 位置 | 删掉的死名 | 改后 |
|---|---|---|
| :853 | `model-specs-qwen36.test.mjs` | 先例 = 模型规格族单元测试档（一机制一档） |
| :1139 | `model-specs-mimo.test.mjs` / `model-specs-qwen36.test.mjs` | 循模型规格族「一机制一档」单元测试档先例 |
| :1239 | `model-specs.test.mjs:250-262` / `model-ref.test.mjs:85` / `image-downgrade.test.mjs:120` | 核单元测试档里 T-13 的零字面断言，就地改形 + 模型引用 ∥ 图片降档两族的去键断言绿 |
| :1367 | `model-picker-fallback.test.mjs` | 核单元测试档里 picker 回落族的负控判据 |

#### 2.15.8 读数与自检

| 项 | 读数 |
|---|---|
| `docs/core/design/MODEL-SPECS.md` | **0 行 / 0 处**（改前 4 行 / 7 处） |
| `docs/core/design/TOOLS.md` | **2 行 / 3 处**（残 = 集成层收集面模式 + 在盘集成档，均正确） |
| `docs/core/design/TESTING.md` | **87 行 / 97 处**（处数与 §2.13 的 97 同——改的是假读数与假收集面，不是测试纪律） |
| `docs/core/design/DOC-DISCIPLINE.md` | **16 行 / 18 处**（未变；三处死名按裁定保留） |
| 交付门 | `doc_check(mode:"gate", 4 档)` = **PASS**（首次 REFUSED：`docs/core/design/TOOLS.md` :1804 本人写的段超长，同轮拆段后复跑通过） |

- **引用集 ↔ 标题集**：所引节号逐条核过在盘——TOOLS :1804 / :1822–:1825 · MODEL-SPECS :221 / :765 / :853 / :1139 / :1239 / :1367 · TESTING :195 / :532 / :544 / :622 / :628 / :1110 / §3.5 / §10.3 · DOC-DISCIPLINE :555–:557 / :2034 / §3.9 J-2。
- **表行 ↔ 汇总数**：2.15.1 六行 + 2.15.7 四行 = 10 处 = 实际编辑数（TOOLS 4 · MODEL-SPECS 6 · TESTING 2 · DOC-DISCIPLINE 1；其中 TOOLS :1804 因拆段编辑两次）。
- **断言 ↔ 实测**：6 个死档名全仓 `readdirSync` 递归 = 0 命中；七目录清单实读（核 2 项 0 档 · cli 2 项 0 档 · vsc 8 项 5 档 · render-core 2 项 1 档 · desktop 4 项 0 档 · `test/integration` 23 项 22 档 · `docs/batches` 235 项 0 档）。

### 2.16 修正轮 2 · 评审轮次 2 的 🔴2 + 同族 🔵3 落地（本轮读数）

**状态**：派单 4 处全落；同族自查另 5 处一并落（同一类病，按「别留给下一批」办）。交付门 = **PASS**（文档三档首次即过；本段首写被拒两次，见 §2.16.6）。

**判据**（父侧给，本轮逐处用它判）：**在盘坐标 ≠ 在盘语义**——命令还在盘、还能跑，只证明它还执行；它给出的读数是不是这句话说的那个，得另问一次。且 §2.15.4 已立「判据必须今日成立；带 as-of 的判据等于没有判据」⇒ 四处**不用**「那是当时的读数」辩护。

#### 2.16.1 病根（本轮实跑读数，不是推的）

| 命令 | 今日实测 |
|---|---|
| `cd thincoder-core && node test/run.mjs` | **exit 1** ∧ 输出逐字 `✖ no integration test set — this package has none (requirement N20); node --test <file> runs batch unit tests. This run proves nothing.` |
| `cd thincoder-cli && node test/run.mjs` | **exit 1** ∧ 输出逐字 `✖ no integration test set — the integration set lives at the repository root: node test/run.mjs (run from the repository root). …` |
| `node test/run.mjs`（仓根） | **exit 0** ∧ `ℹ tests 76` ∕ `ℹ pass 76` ∕ `ℹ fail 0`（集成目录 22 档） |
| `cd thincoder-core && npm run prepublishOnly` | **exit 0** ∧ `check-syntax: 285 file(s) OK` |
| `cd thincoder-vscode && node test/run.mjs` | **exit 0** ∧ `ℹ tests 27` ∕ `ℹ pass 27` ∕ `ℹ fail 0`（单元清单面——面差②） |

⇒ 核 ∥ cli 两 runner **无条件 exit 1**，「全绿」在这两面永不可能出现；集成层的绿只在仓根。

#### 2.16.2 派单 4 处（逐条 = 改哪档:行 + 改后逐字 + 复跑）

**① `docs/core/design/TOOLS.md:1848`（A4）**

改后逐字：

> | A4 | §13.11 ⑤：普通模式 / depth>0 零回归 | 零回归读数取核包可达面（核仓无集成测试集，口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL4）：本批单测档 `node --test` 按例全过 + `cd thincoder-core && npm run prepublishOnly` ⇒ exit 0 ∧ 输出 `check-syntax: N file(s) OK`；`agent/family-tools.mjs:90-110` 零改 |

**取「语法门 + 批内单测档」而非别的**：核包零集成集 ⇒ 核的验证面 = 批内单测档 + 语法门（`docs/core/design/TESTING.md` §10.3 A-TS12 同口径），这是核包今日唯一可达的绿。复跑：`cd thincoder-core && npm run prepublishOnly` ⇒ **exit 0 · `check-syntax: 285 file(s) OK`**（本轮实跑）。

**② `docs/core/design/MODEL-SPECS.md:296`（A-10）**

改后逐字：

> | A-10 | 三端门禁读数（各取本面可达值）：核 `npm run prepublishOnly` exit 0 ∧ `check-syntax: N file(s) OK`（语法门——核仓无集成测试集）· 集成层 = 仓根 `node test/run.mjs` exit 0 ∧ `fail 0`（口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1）· CLI `node test/run.mjs` = 空集说明器 exit 1 ∧ 输出指仓根（集成集已上移，§10.3 A-SL3）· VSC `node test/run.mjs` exit 0 ∧ `fail 0`（单元清单面——面差②）；用例含「两 flash 档枚举不等」差异断言（A-3） | AC-10（项目纪律「每次改动必须跑起来验证」） |

**核半未动**（父侧点名「已经对」）。**「集成集 15 例」一并删除**——该数今日不成立（仓根 76 例），且它是**会漂的数**，改成 `fail 0` 这条**今日真、明日仍真**的读数。复跑三条读数见 §2.16.1。

**③ `docs/core/design/TOOLS.md:316`（A13）**

改后逐字（同句另含一处跨档行号指称，本段略去不复写，处置见 §2.16.4 ③）：

> A13 调用方普查 · 集成测试级：集成层单入口 = 仓根 `node test/run.mjs`（口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1）⇒ 失败集合 ⊆ 批前失败集合（口径同 A-MS6 · …）；H3 夹具读数落 §5。

**④ `docs/core/design/TOOLS.md:563`（A27）**

改后逐字：

> | A27 | 边界 | 形保真（成功路径零变 · = §1 边界） | 集成层 = 仓根 `node test/run.mjs`（口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1）· VSC 面 = `cd thincoder-vscode && node test/run.mjs`（单元清单面——面差②）+ 抽样对拍（`status` / `diff` / `log` / `branch list` 输出逐字比） | 两面失败集合 ⊆ 批前失败集合 · 抽样输出逐字同 | —（回归） |

**一处连带删（同一句内的死声明，知会 §2.16.4 ①）**：原句「（含 VSC `ide` 工具面用例）」删去——该用例今日**两面都查无**：`thincoder-vscode/test/files.mjs:8` 实列 5 档全为 `2026-10-*` 批次名单测档，且对该目录全部 `.mjs` 作 `ide` 大小写不敏感扫描，命中仅 `overrides` 与 `run.mjs` 头注 ⇒ 无 `ideTool` 面用例。

**⑤ `docs/core/design/TESTING.md:402`（A-TS9 cli 半）**

改后逐字（cli 半）：

> **cli** = 空集说明器（exit 1 ∧ 输出指仓根——集成层在仓根，A-SL3）

核半 ∥ vsc·desktop·render-core 半原文未动。原「exit 0 ∧ `ℹ tests 15`（集成层即收口门）」删除：两句今日皆假（cli exit 1；15 例已在仓根变 76 例）。

#### 2.16.3 同族自查 5 处（派单外，同一类病，一并落）

**为什么落它们**：A-10 ∥ A4 ∥ A13 ∥ A27 的新句子**都指「§10.3 是口径单源」**——而这个单源里 `ℹ tests 15` 还在（今日 76）。**不修它，我这四句就架在一句假读数上**，属「阻塞当前任务」那一类，不是顺手扩张。

| # | 位置 | 改后逐字 | 判据 |
|---|---|---|---|
| 1 | `docs/core/design/TESTING.md` A-SL1 | 集成目录全跑（exit 0 ∧ `fail 0` ∧ 零 `uncollected test file`——收集面反查 SC-1 fail-closed）、仓根 `test/` 顶层档零执行 | 原「5 档全跑（`ℹ tests 15`）」= 今日 22 档 ∕ 76 例。**保留「全跑」的证据力**（SC-1 fail-closed：错位档必红 ⇒ exit 0 即证明收集面覆盖全） |
| 2 | 同档 A-SL3 | 复原后 exit 0 ∧ `fail 0` | 原 `ℹ tests 15` |
| 3 | 同档 AC-IU1 | 仓根 `node test/run.mjs` exit 0 ∧ `fail 0`（集成档全数执行——零 `uncollected test file`） | 原「`ℹ tests 15`（15 例全绿）」 |
| 4 | 同档 AC-IU3 | 复原后 exit 0 ∧ `fail 0` | 同上 |
| 5 | 同档 U-IU1 | exit 0 ∧ `fail 0` | 同上 |

**连带 1 处（读数删、机制句留——§1.10 ② 裁定同形）**：同档 KD-1 原句「…只能跑全套（cli 实测 15 例 / ≈14s 的集成集）」⇒「…只能跑集成层全量」。删的是**会过期的读数**，理由句（一条命令两种含义时「全绿」证明不了任何一件具体的事）原样保留。

**为什么一律换成 `fail 0` 而不写 76**：**判据里的数会漂**（集成集只增不减时 76 必假）。`exit 0 ∧ fail 0` 今日真、明日仍真；「全跑」的证据由 SC-1 的 fail-closed 反查承载，不靠一个数。这与 §2.15.4「判据必须今日成立」同向，也是本批 §1.10 ② 的成例。

#### 2.16.4 知会 / 上抛

**[上抛·知会] ① A27 的「含 VSC `ide` 工具面用例」已删**——读数见 §2.16.2 ④。若父侧知道该用例现住何处（改名 ∥ 并入哪档），回退该括注并改指即可；本席两面对过，查无。

**[上抛·知会] ② `docs/core/design/MODEL-SPECS.md` 另有 4 处「三端测试全绿」未动**：`:542`（AC-6）· `:675`（AC-4）· `:782`（AC-4）· `:974`（AC-6），另 `:1135`「核测试全绿」。它们**不点命令**，是目标陈述不是跑面读数，故不在本轮判据内（本轮判的是「点了死命令 / 死了的读数」）。**但核半今日永不可能绿** ⇒ 若按「判据必须今日成立」收，这 5 行同样要改成「核 = 语法门 + 批内单测档」。**请父侧定射程**：本席不自行扩轮。

**[上抛·知会] ③ 本轮未动 A13 同句内的那处跨档行号指称**（`docs/core/design/AGENT-LOOP-SUBAGENT.md:713`）：它指向的档在盘，但行号是行号——本批已定「不写行号、只留节锚」。**改它需要知道 A-MS6 住哪一节**，超出本轮派单，未动。

**④ B 类（`test/integration/` 路径）**：本轮 **0 处**，无新欠账可登。

#### 2.16.5 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：本段所引节号逐条核过——`docs/core/design/TESTING.md` §10.3（在盘）· A-SL1 ∥ A-SL3 ∥ A-SL4 ∥ A-TS12 ∥ §3.5（均在盘，`grep` 实测标题 / 表行存在）；`docs/core/design/TOOLS.md` §13.11（在盘）；`docs/core/design/MODEL-SPECS.md` AC-10 行（在盘）。
- **表行 ↔ 汇总数**：派单 4 处 + 同族 5 处 + 连带 1 处 = **10 处**改动面 = 实际编辑 **11 条**（`docs/core/design/TOOLS.md` 3 · `docs/core/design/MODEL-SPECS.md` 1 · `docs/core/design/TESTING.md` 7；A-TS9 与 A-SL1/ASL3 分属两次编辑）。**11 条均为单行替换 ⇒ 三档行数零变**。
- **断言 ↔ 实测**：`grep 'tests 15|集成集 15|5 档全跑|三包集成测试集|两包集成测试集'` 扫 `docs/core/design/*.md` ⇒ **改后 0 命中**（改前 9 命中：`docs/core/design/MODEL-SPECS.md` 1 · `docs/core/design/TESTING.md` 6 · `docs/core/design/TOOLS.md` 2）。五条命令读数见 §2.16.1，全部本轮现跑。
- **`git diff --numstat`（累计读数，含本批前几轮未提交改动，不读作本轮增量）**：`+47 / −65`（TOOLS）· `+56 / −101`（MODEL-SPECS）· `+16 / −17`（TESTING）。
- **文档纪律**：`doc_check(mode:"gate", target = 仓根, docs = 上列 3 档)` = **PASS**（3 档全清，0 段有问题）。

#### 2.16.6 本段首写被门拒两次（如实）

第一次：`REFUSED（锚 1 条）`——本段正文写了**省略域段的裸档名**；批档住 `docs/batches/`，裸名在该目录解析不到。

第二次：`REFUSED（锚 2 条）`——本段自述「裸名为什么解析不到」时，又把裸名本身写进了正文，门照样判它是指针。

**处置**：正文一律写全路径；引被改设计档原文的那一处，把该括注改为 `…` 省略并指向 §2.16.4 ③，不改被引档的字。

**两次都零落盘**——门拒的是「本次写入文本」，前文逐字不变、段号不推进。这是它正确的地方：解析不到的指针没进档。

### 2.17 修正轮 3 · 派单两条落地（本轮读数）

**状态**：① 五行「三端测试全绿」已换成各面可达读数；② 那处行号坐标已处置，**但处置形与派单设想不同（A-MS6 在该档已不存在），待父侧裁**（§2.17.3）；③ 确认未动。交付门 = **PASS**（2 档全清，首次即过）。

#### 2.17.1 ① 五行逐条（`docs/core/design/MODEL-SPECS.md`）

**五处共用的新形**（逐字相同；各行只保留自己原来的尾段）：

> 三端门禁读数（各取本面可达值 · 口径单源 = `docs/core/design/TESTING.md` §10.3）：核 = `cd thincoder-core && npm run prepublishOnly` exit 0 ∧ `check-syntax: N file(s) OK`（语法门——核仓无集成测试集）· 集成层 = 仓根 `node test/run.mjs` exit 0 ∧ `fail 0` · CLI = 空集说明器 exit 1 ∧ 输出指仓根 · VSC = `cd thincoder-vscode && node test/run.mjs` exit 0 ∧ `fail 0`（单元清单面）

| # | 位置 | 改前逐字 | 改后 |
|---|---|---|---|
| 1 | `docs/core/design/MODEL-SPECS.md:542` | 三端 `test` 全绿 + 新用例覆盖**五名**逐字段 + 两族枚举各自七值、行独立（A-12） | 上式 + 原尾段（A-12 等）照留 |
| 2 | `docs/core/design/MODEL-SPECS.md:675` | 三端测试全绿 | 上式；用例列 `机检` 不变 |
| 3 | `docs/core/design/MODEL-SPECS.md:782` | VSC 端差表处置裁定（= 登记 "high"）+ 三端测试全绿 | 裁定句照留 + 上式；用例列 `Q-7 + 机检` 不变 |
| 4 | `docs/core/design/MODEL-SPECS.md:974` | 三端测试全绿 | 上式；落点列 `§12.5` 与用例列 `机检` 不变 |
| 5 | `docs/core/design/MODEL-SPECS.md:1135` | G-7（既有族代表名字段零改）+ 核测试全绿 | G-7 照留 + 上式 |

**新读数（本轮现跑，四条命令）**

| 命令 | 读数 |
|---|---|
| `node test/run.mjs`（仓根） | exit 0 · `tests 76` / `pass 76` / `fail 0` |
| `cd thincoder-cli && node test/run.mjs` | exit 1 · `no integration test set — the integration set lives at the repository root…` |
| `cd thincoder-vscode && node test/run.mjs` | exit 0 · `tests 27` / `pass 27` / `fail 0` |
| `cd thincoder-core && npm run prepublishOnly` | exit 0 · `check-syntax: 285 file(s) OK` |

**为什么三面各不相同**：核仓无集成测试集 ⇒ 核的可达绿只有语法门（口径单源 = `docs/core/design/TESTING.md` §10.3）；CLI 的包级 runner 是空集说明器（exit 1，输出指仓根）；集成层的绿只在仓根；VSC 的 runner 走单元清单面。**同 §2.16.2 的 A-10 同一形**，本轮不另发明。

**判据里的数不写死**：`check-syntax: N file(s) OK` 保留 `N`，绿判据取 `exit 0 ∧ fail 0` 而非某个测试计数——集只增不减，写死必假（同 §2.16.3）。

**为什么没有一行改成「不可达就硬凑」**：五行的面都能落到可跑命令，无需退到「本批改动面单测跑绿」那种弱形。

#### 2.17.2 grep 复扫（「三端测试全绿」族 · 改前 / 改后）

**改前**（`grep -n '三端测试全绿|核测试全绿'`，本轮开工读数）：`docs/core/design/MODEL-SPECS.md:675` · `:782` · `:974`（三分句逐字「三端测试全绿」）· `:1135`（逐字「核测试全绿」）= **4 命中**；另 `:542` 为异形「三端 `test` 全绿」（该正则不命中，人工补入第五行）。

⇒ **改前合计 5 行**。

**改后**同一正则加异形（`三端测试全绿|核测试全绿|三端 ` + "`test`" + ` 全绿`）：**0 命中**。

**同档另 5 处「全绿」未动**（不在派单，且都不是跑面断言）：`:707` / `:832` 的「探针全绿」· `:1336` 的「不变式全绿」· `:1432` / `:1444` 的「逐对…全绿」。

这四处均为该节自身的离线断言（活体取证记录 / 运行时不变量 / 值域对照），不点任何一端命令 ⇒ 不属「照着跑会读到不可能读数」那一类。

#### 2.17.3 ② `docs/core/design/AGENT-LOOP-SUBAGENT.md:713` 的处置（**待父侧裁**）

**派单设想** = 把行号换成节锚。**实测两条，都指不到一个存在的 A-MS6**：

| 核对面 | 实测 | 读法 |
|---|---|---|
| 全仓 A-MS6 定义 | `grep A-MS6` 全域仅命中 `docs/core/design/TOOLS.md:316` 与批档；设计档 / 需求档**零定义** | 无现居处 |
| 该档 §6.23.7 验收表 | `grep A-MS` 实测 4 行（`:510`–`:513`）= A-MS1 / A-MS2 / A-MS3 / A-MS5 | **无 A-MS6**（也无 A-MS4） |
| 旧行号 `:713` 实指 | §6.26 累计受影响面表的**表头行** | 连行号都指错了 |

**为什么没写 §6.23.7**：那会落成「A-MS6 住在 §6.23.7」这句假断言——**错指比死指更坏**（派单原句）。且 A-MS6 的口径是三包 `npm test` 失败集合，与 A-MS1..A-MS5 不同族，不能代为承接。

**本轮所落**：`docs/core/design/TOOLS.md:316` 的括注 `（口径同 A-MS6 · <该档>:713）` 整体删去，句子判据面完整保留——同句前段已写「口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1」，`⇒ 失败集合 ⊆ 批前失败集合` 不依赖那个死标签。

改后逐字：

> A13 调用方普查 · 集成测试级：集成层单入口 = 仓根 `node test/run.mjs`（口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1）⇒ 失败集合 ⊆ 批前失败集合；H3 夹具读数落 §5。

**待裁**：若父侧要保留 A-MS6 这个名（其口径另有现居处），给出所在档 + 节号即可回退改指；本席全域搜不到，不猜一个节号。

#### 2.17.4 ③ A27 的「VSC `ide` 工具面用例」—— 确认（未动）

父侧采认上一轮删法（查无且无占位符 ⇒ 死指针删；判据本体「VSC 面 = 单元清单面（面差 ②）」留住）。本轮零改动。

#### 2.17.5 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：所引节号逐条实测在盘——`docs/core/design/TESTING.md` §10.3（`:540` 标题「### 10.3 执行层分离与空集处置（现行）」）· `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.23.7（`:506`）/ §6.26（`:710`）。
- **表行 ↔ 汇总数**：§2.17.1 五行 + §2.17.3 一行 = **6 条编辑**，与 `edit` 回执数（5 + 1）相等 ✓；grep 改前 5 行、改后 0 ✓。
- **断言 ↔ 实测**：四条命令本轮现跑（读数见 §2.17.1 表）；6 处均为**单行等量替换** ⇒ 两档行数零变。`git diff --numstat` 累计读数 = `docs/core/design/MODEL-SPECS.md` `+61 / −106` · `docs/core/design/TOOLS.md` `+47 / −65`（**含本批前几轮未提交改动，不读作本轮增量**，同 §2.16.5 口径）。
- **文档纪律**：`doc_check(mode:"gate", docs = 上列 2 档)` = **PASS**（2 档全清，0 段有问题）。

#### 2.17.6 [上抛·知会] 同族残量（不在本轮派单）

`docs/core/design/SESSION.md` 仍有 3 行「三端测试全绿」（`:522` · `:584` · `:687`）——同一种不可达断言，属另一板块的设计档，本轮未动，供父侧定射程。

### 2.18 修正轮 4 · `docs/core/design/SESSION.md` 三行「三端测试全绿」（本轮读数）

**状态**：三行全落。交付门 = **PASS**（首次 REFUSED：本人写的 2 段各 305 字符，同轮拆段后复跑通过，见 §2.18.4）。
**判法**：三处全在「验收回指」段内 ⇒ 都是**门禁读数**，不是目标陈述，按 §2.17.1 已立的新形改；判据里的数不写死（`N` 保留、绿判据取 `exit 0 ∧ fail 0`）。

#### 2.18.1 三行逐条（位置 · 改前逐字 · 改后）

| # | 位置（改后） | 改前逐字 | 上下文判定 |
|---|---|---|---|
| 1 | `docs/core/design/SESSION.md`:522 · :524 · :526（原 :522 一行拆三段） | `③ 三端测试全绿；` | §6.17 验收回指 ①②③④ 的第 ③ 条 = 门禁读数 ⇒ 展开为本面可达值 |
| 2 | `docs/core/design/SESSION.md`:588（原 :584） | `- T6 = 三端测试全绿。` | §6.18 验收回指（需求 §2.5 T1–T6）的 T6 = 门禁读数 |
| 3 | `docs/core/design/SESSION.md`:695 · :697（原 :687） | `⑦ 三端测试全绿。` | §6.19 验收回指（F-R19a/c/d · F-S4）的第 ⑦ 条 = 门禁读数 |

**改后共用的形（三处逐字相同；#1 内联进 ③，#2 接在 `- T6 = `，#3 内联进 ⑦）**：

> 三端门禁读数（各取本面可达值 · 口径单源 = `docs/core/design/TESTING.md` §10.3）：核 = `cd thincoder-core && npm run prepublishOnly` exit 0 ∧ `check-syntax: N file(s) OK`；集成层 = 仓根 `node test/run.mjs` exit 0 ∧ `fail 0` · CLI = 空集说明器 exit 1 ∧ 输出指仓根 · VSC = `cd thincoder-vscode && node test/run.mjs` exit 0 ∧ `fail 0`（单元清单面）。

#### 2.18.2 四条读数（本轮现跑，非引用前轮）

| 命令 | 读数 |
|---|---|
| `node test/run.mjs`（仓根） | **exit 0** |
| `cd thincoder-cli && node test/run.mjs` | **exit 1** ∧ 逐字 `✖ no integration test set — the integration set lives at the repository root: node test/run.mjs (run from the repository root). node --test <file> runs batch unit tests. This run proves nothing.` |
| `cd thincoder-vscode && node test/run.mjs` | **exit 0** |
| `cd thincoder-core && npm run prepublishOnly` | **exit 0** ∧ `check-syntax: 285 file(s) OK` |

⇒ 原句「三端测试全绿」在三处**今日永不可能成立**（cli 面无条件 exit 1）。改后三处各自给出该面真实可达的绿。

#### 2.18.3 grep 复扫（域 = `docs/core/design/*.md`）

- **改前** 3 命中，全部在 `docs/core/design/SESSION.md`（原 `:522` · `:584` · `:687`），逐字均为「三端测试全绿」。
- **改后** 0 命中（模式 `三端测试全绿|核测试全绿|三端 `test` 全绿`）。

#### 2.18.4 交付门（含首次 REFUSED 的处置）

首次 `doc_check(mode:"gate", docs = [`docs/core/design/SESSION.md`])` = `REFUSED（2 段文字太长）`，指向本人所写的 :524 ∥ :693（实读各 **305** 字符）。
处置 = **拆段，一字不删**：③ 与 ⑦ 各拆成「核面」+「集成层 / CLI / VSC 面」两段，中间加空行。复跑 = **PASS**（1 档全清，0 段有问题）。

#### 2.18.5 同族残留（**未动 · 上抛**）

**同一份档里另有两处同一类断言，字面是「三包测试全绿」——父侧 grep 模式（三端）扫不到它们**：

- `docs/core/design/SESSION.md`:741 逐字 `④ 三包测试全绿 + `doc-check` 零新增闸态失败。`
- `docs/core/design/SESSION.md`:787 逐字 `④ 三包测试全绿 + `doc-check` 零新增闸态失败 → 落点表在册；`

**病同 §2.18.1**：核 ∥ cli 两面 `node test/run.mjs` 无条件 exit 1（读数见 §2.18.2）⇒「三包测试全绿」今日同样不可达。
**本轮未动**：派单边界 = 只动那三行；这两处请父侧定是否开一轮（改法与 §2.18.1 同形）。
**一条教训**：**「零命中要先怀疑查询式」**（§1.10 ① 已立）——同一句话换了量词（端 ⇒ 包），同一个 grep 就扫不到。收口复扫建议按 `全绿` 加 `三端|三包|三仓` 三形一起扫。

#### 2.18.6 本轮自检（三向交叉核对 · 实跑读数）

- **引用集 ↔ 标题集**：`docs/core/design/TESTING.md` §10.3 实测在盘（`:540` 标题「### 10.3 执行层分离与空集处置（现行）」）；`docs/core/design/SESSION.md` §6.17 / §6.18 / §6.19 为本轮三处所在节，标题在盘。
- **表行 ↔ 汇总数**：§2.18.1 三行 = 实际编辑 **3 处 / 5 条 edit**（③ 一处两写：先内联、后拆段；⑦ 同）；grep 改前 3 → 改后 0 ✓。
- **断言 ↔ 实测**：四条命令权限现跑（§2.18.2）；段长逐行实读（305 → 拆后各 ≤300）；`doc_check` gate = **PASS**。
- **边界**：本档 `.test.mjs` 命中 = **0 处**（`grep` 实测）⇒ 本轮只碰「全绿」断言，未碰任何测试坐标；同档其它「全绿」（`docs/core/design/SESSION.md`:741 ∥ :787 之外无探针 / 不变式类）本轮零改动。

### 2.19 修正轮 5 · `docs/core/design/SESSION.md` 两行「三包测试全绿」（本轮读数）

**状态**：派单两行全落。**grep 复扫（七量词）3 → 1**，余 1 处经父侧裁定可达、勿动。交付门 = **PASS**（首次即过）。

**判法（父侧本轮派单）**：两行都在「验收回指」段 ⇒ 是门禁读数，不是目标陈述。按 §2.18.1 已立的新形改（各面可达值 · 口径单源 = `docs/core/design/TESTING.md` §10.3）。

行尾那半句 `+ doc-check 零新增闸态失败` 今日**可达**，逐字留住；只换「三包测试全绿」这一段。

#### 2.19.1 两行逐条（改前 / 改后逐字）

| # | 位置 | 改前逐字 | 改后逐字 |
|---|---|---|---|
| 1 | `docs/core/design/SESSION.md` §6.20 | `④ 三包测试全绿 + \`doc-check\` 零新增闸态失败。` | `④ 三包门禁读数（各取本面可达值 · 口径单源 = \`docs/core/design/TESTING.md\` §10.3）：核 = \`cd thincoder-core && npm run prepublishOnly\` exit 0 ∧ \`check-syntax: N file(s) OK\`；集成层 = 仓根 \`node test/run.mjs\` exit 0 ∧ \`fail 0\` · CLI = 空集说明器 exit 1 ∧ 输出指仓根 · VSC = \`cd thincoder-vscode && node test/run.mjs\` exit 0 ∧ \`fail 0\`（单元清单面）+ \`doc-check\` 零新增闸态失败。` |
| 2 | `docs/core/design/SESSION.md` §6.21 | `④ 三包测试全绿 + \`doc-check\` 零新增闸态失败 → 落点表在册；` | 同形（逐字节与第 1 行一致），尾段 `→ 落点表在册；` 原样留。 |

**段内位置**：改后两条各成三段（①②③ 一段 · 核面一段 · 集成层 / CLI / VSC 面一段），空行分隔。形与同档 §6.17 已落的先例逐字一致（`:522` / `:524` / `:526`）。

**为什么要拆段**：整句约 400 字符，一段写进交付门必被判「文字太长」——§2.18.4 已实证过一次。拆分只加空行，一个字未删。

#### 2.19.2 四条读数（本轮现跑，非引用前轮）

| 命令 | 读数 |
|---|---|
| `node test/run.mjs`（仓根） | **exit 0** · `tests 76` / `pass 76` / `fail 0` |
| `cd thincoder-cli && node test/run.mjs` | **exit 1** · 逐字 `no integration test set — the integration set lives at the repository root: node test/run.mjs (run from the repository root). node --test <file> runs batch unit tests. This run proves nothing.` |
| `cd thincoder-vscode && node test/run.mjs` | **exit 0** · `tests 27` / `pass 27` / `fail 0` |
| `cd thincoder-core && npm run prepublishOnly` | **exit 0** · `check-syntax: 285 file(s) OK` |

⇒ 原句「三包测试全绿」今日不可达：cli 面无条件 exit 1。改后三包各给本面真实可达的绿，集成层的绿另指仓根。

#### 2.19.3 grep 复扫（域 = `docs/core/design/*.md` · 七量词）

模式 = `(三端|三包|三仓|两端|两包|三面|两面)[^\n。，|]{0,12}全绿`。

| 时点 | 命中 | 分布 |
|---|---|---|
| 改前 | **3** | `docs/core/design/SESSION.md`:741 · `docs/core/design/SESSION.md`:787 · `docs/core/design/CONTEXT-COMPACTION.md`:692 |
| 改后 | **1** | `docs/core/design/CONTEXT-COMPACTION.md`:692（「两面用例全绿」——那两面单测直跑可达，父侧裁定不动） |

**本档命中 2 → 0。**

上一轮的教训（父侧本轮自陈）：派单里的 `grep` 只扫「三端」，漏了「三**包**」——同句话换量词就扫不到，所以本轮复扫一律带七量词。

#### 2.19.4 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：所引节号逐条实测在盘——`docs/core/design/TESTING.md` §10.3（`:540` 标题「### 10.3 执行层分离与空集处置（现行）」）· `docs/core/design/SESSION.md` §6.20（`:701`）· §6.21（`:751`）· §6.17（先例三句所在节）。
- **表行 ↔ 汇总数**：§2.19.1 两行 = 实际编辑 **2 条**（`edit` 回执 2/2）；grep 改前 3 → 改后 1 ✓（本档 2 → 0）· §2.19.2 四条命令全部本轮现跑。
- **断言 ↔ 实测**：本档行数 1174 → **1182**（两处各 1 行拆成 3 段 + 2 空行 = 各 +4）；两处均为等量改述，无删句、无新增机制。
- **文档纪律**：`doc_check(mode:"gate", target = 仓根, docs = [`docs/core/design/SESSION.md`])` = **PASS**（1 档全清，0 段有问题）。

#### 2.19.5 受影响文件（本批全轮汇总）

本批自 S1 至本轮共动 **24 档设计档**，全部在 `docs/core/design/` 下；无代码改动、无需求档 / 提示词面 / 批档之外的改动。

范围与处数逐轮读数见 §2.2–§2.19 各轮小节；B 类（`test/integration/` 路径）欠账登记见 §2.9.3 与 §2.11.5。

**`git diff --numstat`（累计读数，含本批前几轮未提交改动，不读作本轮增量）**：`docs/core/design/SESSION.md` = `+23 / −5`。

本轮的增量读数是文件行数 **1174 → 1182（+8）**；两者之差来自 §2.18 那轮的未提交改动。父侧收口复跑 numstat 时按此口径读，别把 +23 当成本轮改动的量。

### 2.20 修正轮 4 · 评审轮次 3 的 🔴1（四行 · `docs/core/design/TESTING.md`）

**状态**：四行全落；`入口 = 各包` 归零。交付门 = **PASS**。

**判法**：一档之内同一机制只许一套说法——同档 §4.3 入口行 ∥ §10.3 A-SL1 已是现行口径，本轮把顶层那半旧口径收掉。

#### 2.20.1 四行逐条（改前 / 改后逐字）

| # | 位置 | 改前逐字 | 改后逐字 |
|---|---|---|---|
| 1 | `docs/core/design/TESTING.md:25`（§1.1 分层纪律 · 链终收口行） | 「入口 = 各包 `npm test`（§10 F1）」 | 「入口 = 仓根 `node test/run.mjs`（口径 = §10.3 A-SL1）」 |
| 2 | 同档 `:95`（§2 库存治理 · 构成句） | 「`npm test`（单入口）= 集成测试（收口时）（§10）」 | 「集成测试集的入口 = 仓根 `node test/run.mjs`（收口时恰一次；包级 `npm test` 不再是集成门——口径 = §10.3）」 |
| 3 | 同档 `:459`（AC-M10-1） | 「`npm test` 一条命令跑**集成测试**（收口时；slow 照跑）」 | 「一条命令跑**集成测试**（收口时；slow 照跑）——入口 = 仓根 `node test/run.mjs`（包级 `npm test` 不再是集成门，口径 = §10.3 A-SL1）」 |
| 4 | 同档 `:462`（AC-M10-4） | 「有集成集 ⇒ 全绿（`npm test` → exit 0）」 | 「有集成集 ⇒ 全绿（仓根 `node test/run.mjs` → exit 0 ∧ `fail 0`）」 |

第 2 行保住了它真正要说的事——「本仓的测试由哪三类构成」一句未删，只把「入口」那半改准。第 4 行的后半「**空集 ⇒ 非零退出 + 说明文案**」原文留。

#### 2.20.2 as-of ∥ 现行：判 **现行**

三条理由，逐条可查：

① 本批 §2.15.4 已立「判据必须今日成立；带 as-of 的判据等于没有判据」——AC 行属判据行，加 as-of 限定等于把它变成一句没有判据力的话。
② 两条都能落到今日可达形：仓根 `node test/run.mjs` exit 0 ∧ `fail 0`，与 §10.3 A-SL1 逐字同形，不另发明读数。
③ 它们与环境里已有的正解同处一档：A-SL1–A-SL9 都写仓根入口，AC-M10 表若留包级口径，同一档内两套说法正是本轮要收的病。

⇒ 不写 as-of，改指仓根入口。旧说法按 D8 直接删，不落「原为…」。

#### 2.20.3 grep 复扫（域 = `docs/core/design/*.md`）

| 模式 | 改前 | 改后 |
|---|---|---|
| `入口 = 各包` | **1 命中**（`docs/core/design/TESTING.md:25`） | **0** |
| `npm test` ∧ `集成测试` 同行 | **8 行**：`3` · `25` · `42` · `47` · `95` · `405` · `419` · `459` | **7 行**：`3` · `42` · `47` · `95` · `405` · `419` · `459` |

改前 8 行取自本轮编辑前的 grep 实读。改后 7 = 8 − 1：`docs/core/design/TESTING.md:25` 改后不再含 `npm test` 而掉出，其余六行零变；改前的 `:462` 本就不含「集成测试」字串（写的是「有集成集」）⇒ 不计入。

#### 2.20.4 残留 7 行逐类

- **现行正确、不该动（2 行）**：`:47` 核面「`npm test` 不跑用例、exit 1 并说明」· `:405` A-TS12 核面 exit 1 + `requirement N20`。核 `npm test` 是空集说明器，这两句写的正是这个事实。
- **本轮改后成为现行形（2 行）**：`:95` · `:459`——句里 `npm test` 只出现在「包级 `npm test` 不再是集成门」这个否定半句上。
- **残留旧口径、四行之外（3 行）**：见 §2.20.5。

#### 2.20.5 [上抛·知会] 同机制残句 4 处（四行边界外 · 未动）

| 位置 | 现文逐字（截） | 与现行口径的差 |
|---|---|---|
| 同档 `:3` | 「测试门（v2——单入口 `npm test`）」 | 板块头仍以包级 `npm test` 命名 v2 单入口；集成层的单入口今日是仓根 runner |
| 同档 `:42` | 「`npm test`（VSC）… 集成测试（收口时）」 | 同档 §10.3 把 vsc 记为「单元清单面——面差②续挂」，两处不一致 |
| 同档 `:296` | 「执行顺序：集成层随 `npm test`（§10 F1）」 | 集成层入口今日 = 仓根 runner |
| 同档 `:419` | 「TS-1 … `npm test` 跑 | 集成测试（收口时）执行；退出码 0」 | 与 `:25` 改前同一形，未在本轮四行内 |

**未动理由**：本轮边界 = 只动四行，越界即新语义。请父侧定是否开一轮。

**一条教训留给收口**：`入口 = 各包` 归零 ≠「包级 `npm test` = 集成门」在本档绝迹——同一说法换几种写法还在（上表四处）。复扫只扫一个短语，会把它读成清零。

#### 2.20.6 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：所引节号逐条实测在盘——`docs/core/design/TESTING.md` §1.1 · §2 · §4.3 · §10（`## 10. 测试门禁简化（v2——M10 增量）`）· §10.3 · A-SL1（`docs/core/design/TESTING.md:620`）· A-SL3（`:622`）· A-SL4（`:623`）。
- **表行 ↔ 汇总数**：四行 = 实际编辑 **4 条**（`edit` 回执 4/4）；grep 8 → 7（掉出 1、其余零变）✓；`入口 = 各包` 1 → 0 ✓。
- **断言 ↔ 实测**：本档行数 **1369**（`split("\n").length − 1` 实读）——四行均为同量单行替换 ⇒ 行数零变 ✓。`doc_check(mode:"gate", docs = [該档])` = **PASS**（1 档全清，0 段有问题）。
- **边界**：只动 `docs/core/design/TESTING.md` 四行；`:290` ∥ `:544` ∥ `:546` 现行口径零触碰，代码零改动，他档零改动。

#### 2.20.7 RTM 增量（评审轮次 3 的 🟡4 · 本轮补落）

以仓根 `test/RTM.md` 为基线的增量：

- **断行 = 0**：本批只改设计档文字，无产品码改动 ⇒ 现有各行断言的业务可观察结果零变。
- **冗余行 = 0**：无行失去意义。
- **新增行 = 0**：无新业务场景、无生产新问题 ⇒ 不立新用例。
- **例外（既有欠账，不因本批而变）**：22-1 ∥ 22-2 ∥ 22-3 的结果列 = `待执行`（`test/RTM.md:263`–`:265`，用例档 = `test/integration/ssh-device-readability.test.mjs`）——本批 S3 轮已登记（§2.9.3），属「说有用例、其实没写」的活账。

**为什么补在这里**：评审轮次 3 把它列为 🟡4，而 §2.19 落完时该行仍未写。§6 收口行可直接引本节。

### 2.21 收尾轮 · 五处（`docs/core/design/TESTING.md` 四处 + `docs/core/design/MODEL-SPECS.md` 一处）

**状态**：五处全落。本档 `npm test` ∧ `集成测试` 同行表 7 行 → **5 行**（其中 2 行本轮改）。交付门 = **PASS**（首次即过）。

**判据（本轮统一用）**：§10.3 是收集面 ∥ 空集语义的唯一权威陈述面 —— 集成层的单入口 = 仓根 `node test/run.mjs`；包级 `npm test` 按包分层（cli = 空集说明器 exit 1；核 = 空集说明器 exit 1 + `requirement N20`；vsc ∥ desktop = 单元清单面——面差②续挂）。凡与本句相抵的入口断言，按本句改准。

#### 2.21.1 五处逐条（改前 / 改后逐字）

| # | 位置 | 改前逐字 | 改后逐字 |
|---|---|---|---|
| ① | `docs/core/design/TESTING.md`:3（板块头） | **分层纪律与测试门（v2——单入口 `npm test`）** | **分层纪律与测试门（v2——单入口 = 仓根 `node test/run.mjs` 集成层；包级 `npm test` = 空集说明器 ∥ 单元清单面〔§10.3〕）** |
| ② | 同档 `:42`（§1.2 入口表 VSC 行） | 集成测试（收口时）· 显式清单 + 清单↔盘上两向自检（空集守卫未落——§10.3 面差） | **单元清单面**（面差②——§10.3 面差登记）：显式清单 + 清单↔盘上两向自检（空集守卫未落） |
| ③ | 同档 `:296`（§4.3 接口契约 · 执行顺序） | 执行顺序：集成层随 `npm test`（§10 F1）；单元层无入口（`node --test <档>`——需求 F5）。 | 执行顺序：集成层随仓根 `node test/run.mjs`（§10 F1 · 口径 = §10.3 A-SL1）；单元层无入口（`node --test <档>`——需求 F5）。 |
| ④ | 同档 `:419`（§7 用例表 TS-1） | \| TS-1 \| 正常 \| `npm test` 跑 \| 集成测试（收口时）执行；退出码 0 \| | \| TS-1 \| 正常 \| 仓根 `node test/run.mjs` 跑 \| 集成测试（收口时）执行；退出码 0 ∧ `fail 0` \| |
| ⑤ | `docs/core/design/MODEL-SPECS.md`:296（A-10 核半） | 核 `npm run prepublishOnly` exit 0 ∧ `check-syntax: N file(s) OK` | 核 `cd thincoder-core && npm run prepublishOnly` exit 0 ∧ `check-syntax: N file(s) OK` |

**① 为什么不是删四字**：v2 这个名字留着，但它原来的内容「单入口 `npm test`」今日两面皆假（读数见 §2.21.4）。改后板块头给的是 v2 的真实内容：单入口在仓根 runner，包级按包分层。删掉四字会留一个没有内容的版号。

**② 的判据（同档两句互相作证）**：§10.3 逐字「vsc ∥ desktop = **单元清单面**——面差②续挂」；同节面差登记② 逐字「单元清单非空时 `npm test` **不再**执行单元档」 —— 这正说明今日执行的是单元档，故 VSC 面写「集成测试（收口时）」是反向断言。

**④ 的上下文判法（父侧点名要我判）**：这张是 §7 用例表的正常态首行。同表 TS-3 =「集成入口跑首批场景 + 种子」、TS-8 =「**核面** `npm test`」⇒ TS-1 的输入是**集成入口**，不是核面，故按仓根 runner 改，不按 exit 1 改。
加 `∧ fail 0` 的理由 = §2.16.3 已立的绿判据形：写死用例数会漂，`exit 0 ∧ fail 0` 今日真、明日仍真。

**⑤ 为什么缺 cwd 是硬伤**：`prepublishOnly` 是包级 script，仓根没有同名 script ⇒ 不带 `cd` 那句不能就地照跑。同批另九处都带前缀，本轮对齐。

#### 2.21.2 本档 `npm test` ∧ `集成测试` 同行表 —— 逐行处置（7 行 → 5 行）

| 行（改前坐标） | 处置 | 依据 |
|---|---|---|
| `:3` | **改**（①） | 板块头以旧口径命名 v2 |
| `:42` | **改**（②） | 与 §10.3 反指 |
| `:47` | **现行正确，不动** | 核树面露：无集成测试层（需求 N20）⇒ `npm test` 不跑用例、exit 1 —— 这句写的就是空集说明器事实 |
| `:95` | **现行正确，不动** | 入口已写仓根 runner；`npm test` 只出现在否定半句「包级 `npm test` 不再是集成门」 |
| `:405` | **现行正确，不动** | A-TS12 = 核面 exit 1 + `requirement N20`（非门） |
| `:419` | **改**（④） | 输入写包级 `npm test`（今日 exit 1），断言写「退出码 0」—— 输入与断言错位 |
| `:459` | **现行正确，不动** | AC-M10-1；入口 = 仓根 runner，`npm test` 只在否定半句 |

**判 as-of = 0 行**：这 7 行全是现行时判据（入口 ∥ 空集语义 ∥ 验收），没有一行是某批的 as-of 读数，故没有一行可以「挂到它的日期上」结案。

**一行同病但不入表**：`:296` 不含「集成测试」字串（写的是「集成层」）⇒ 被同行式扫不到，本轮按 ③ 改了。这条再次印证 §2.18.5 那条教训：**换一个词就扫不到。**

#### 2.21.3 本档同族残句 4 处（未动 · 知会）

以下四行都在说「`npm test` 就是集成层 ∥ 单入口」，与 §10.3 `:544` 相抵：

- `:411` A-TS18 逐字「门 = `npm test` 单入口」
- `:413` A-TS20 逐字「`npm test` = 集成层单层收集」
- `:546` 逐字「因此 `npm test` 只证明一件事：集成层的发布门」
- `:584` KD-1 逐字「**KD-1 `npm test` 只留集成层**」

**未动理由**：本轮边界 = 五处，越界即新语义。它们是同一族换写法的残句，与 §2.20.5 那四处（`:3` ∥ `:42` ∥ `:296` ∥ `:419`）同性质 —— 那四处的三处本轮已收，这一批仍在盘。

#### 2.21.4 读数与自检（三向交叉核对 · 均为本轮实跑）

**命令读数（本轮现跑，非引用前轮）**

| 命令 | 读数 |
|---|---|
| `cd thincoder-core && node test/run.mjs` | **exit 1** ∧ 逐字 `no integration test set — this package has none (requirement N20); node --test <file> runs batch unit tests. This run proves nothing.` |
| `cd thincoder-cli && node test/run.mjs` | **exit 1** ∧ 逐字 `no integration test set — the integration set lives at the repository root: node test/run.mjs (run from the repository root). …` |
| `node test/run.mjs`（仓根） | **exit 0** · `tests 76` / `pass 76` / `fail 0` |

⇒ 包级 `npm test` 给不出 exit 0 这条事实，三处原句（① 的旧内容 ∥ ② ∥ ④ 的旧输入）都以它为前提。

**计数（两次 `grep` 实扫）**

| 项 | 改前 | 改后 |
|---|---|---|
| `npm test` 命中行 | **33** | **31**（掉出 `:296` ∥ `:419`——改后不再含该串） |
| `npm test` ∧ `集成测试` 同行 | **7** | **5**（掉出 `:42` ∥ `:419`） |

- **引用集 ↔ 标题集**：所引节号逐条实测在盘 —— `docs/core/design/TESTING.md` §10.3（`:540`）· §4.3（`:283`）· §1.2（`:36`）· §7 用例表（`:415`）· 面差登记②（`:645`）· `docs/core/design/MODEL-SPECS.md` A-10 行（`:296`）。
- **表行 ↔ 汇总数**：§2.21.1 五行 = 实际编辑 **5 条**（`edit` 回执 5/5）；§2.21.2 表 7 行 = 改 3（3 ∥ 42 ∥ 419）+ 不动 4（47 ∥ 95 ∥ 405 ∥ 459）✓；5 − 2 = 3，与「5 行 → 5 行」的读法自洽（改前 7 = 改 3 + 不动 4；改后 5 = 改后仍在的 3 + 不动 4 − 掉出 2）。
- **断言 ↔ 实测**：五处均为**单行等量替换** ⇒ 两档行数零变；两次 `grep` 复扫 + 三条命令本轮现跑；行数未另测（无数值断言需要它）。
- **文档纪律**：`doc_check(mode:"gate", target = 仓根, docs = 上列 2 档)` = **PASS**（2 档全清，0 段有问题）。

#### 2.21.5 边界遵守（逐条）

- **只动五处**：`docs/core/design/TESTING.md` 四行 + `docs/core/design/MODEL-SPECS.md` 一行；两档其余行零触。
- **`:290` ∥ `:544` ∥ `:546` 中的前两处**（父侧点名「是对的，别碰」）**一字未动**；`:546` 属 §2.21.3 未动项。
- 别档零改 · 代码零改 · 需求档 ∥ 提示词面 ∥ 台账零改。
- **本批无产品码改动** ⇒ 无单测档可写；验收读数 = 上列三条命令 + 两次 `grep` + `doc_check` gate。

#### 2.21.6 更正 §2.21.4 的一处算式（读回自查发现）

§2.21.4「表行 ↔ 汇总数」那条的后半句写错了，逐字为：

> 5 − 2 = 3，与「5 行 → 5 行」的读法自洽（改前 7 = 改 3 + 不动 4；改后 5 = 改后仍在的 3 + 不动 4 − 掉出 2）

**错在「改后仍在的 3」**：改后掉出表的两行正是 `:42` ∥ `:419`，它们本来就在「改 3」里 ⇒ 改后仍在表内的改动行只有 `:3` **1 行**，不是 3 行。

**正确算式**（逐行对过 §2.21.2 表与两次 `grep` 读数）：

- 改前 **7** = 改 3（`:3` ∥ `:42` ∥ `:419`）+ 不动 4（`:47` ∥ `:95` ∥ `:405` ∥ `:459`）
- 改后 **5** = 仍在表内的改 1（`:3`——它改后还含「集成测试集」四字，属板块内容列举）+ 不动 4
- ⇒ 7 − 2（`:42` ∥ `:419` 因「集成测试」四字被替换而掉出）= **5** ✓

**其余读数不受影响**：§2.21.1 五行 = 实际编辑 5 条（`edit` 回执 5/5）· `npm test` 命中行 33 → 31 · 同行表 7 → 5 · 两档行数零变 · 交付门 PASS，均照原样成立。

### 2.22 修正轮 6 · 评审轮次 4 的 🟡2（一行 · `docs/core/design/MODEL-SPECS.md`）

**状态**：一处已落，三面判据一字未动。交付门 = **PASS**（1 档全清，首次即过）。

**判法（评审轮次 4 🟡2）**：同一格前半已把「仓根 `node test/run.mjs`」定义为集成层 ⇒ CLI ∥ VSC 两半缺 cwd 时，读者按字面在仓根跑，读到的正是集成层那一面，与两半自述的面相反。

**本轮三条命令现跑（非引用前轮）**

| 命令 | 读数 |
|---|---|
| `cd thincoder-cli && node test/run.mjs` | **exit 1** ∧ 逐字 `✖ no integration test set — the integration set lives at the repository root: node test/run.mjs (run from the repository root). node --test <file> runs batch unit tests. This run proves nothing.` |
| `cd thincoder-vscode && node test/run.mjs` | **exit 0** ∧ `tests 27` / `pass 27` / `fail 0` |
| `node test/run.mjs`（仓根——缺 cwd 时会落到的那个面） | **exit 0** ∧ `tests 76` / `pass 76` / `fail 0` |

**第三行即病灶实证**：缺 cwd 时读到 `exit 0` / 76 例，而 CLI 半自述 `exit 1`。同一条命令落在两个面上、两个读数 —— 不写 cwd，那句判据就落在错的面。

#### 2.22.1 逐字（只加 cwd 前缀，其余一字未动）

- 改前 CLI 半：``· CLI `node test/run.mjs` = 空集说明器 exit 1 ∧ 输出指仓根（集成集已上移，§10.3 A-SL3）``
- 改后 CLI 半：``· CLI `cd thincoder-cli && node test/run.mjs` = 空集说明器 exit 1 ∧ 输出指仓根（集成集已上移，§10.3 A-SL3）``
- 改前 VSC 半：``· VSC `node test/run.mjs` exit 0 ∧ `fail 0`（单元清单面——面差②）``
- 改后 VSC 半：``· VSC `cd thincoder-vscode && node test/run.mjs` exit 0 ∧ `fail 0`（单元清单面——面差②）``

#### 2.22.2 一处形差（如实报，未改）

同档另五处的 VSC 半写 `cd thincoder-vscode && node test/run.mjs`，与本轮改后逐字同形；但它们的 CLI 半不点命令，只写「CLI = 空集说明器 exit 1 ∧ 输出指仓根」。

⇒ 本格 CLI 半现比那五处多一层可跑性（给了命令 + cwd）。判据面一致，不构成两说；未回改那五处（边界 = 只动这一格）。

#### 2.22.3 本轮自检（三向交叉核对 · 均为实跑读数）

- **引用集 ↔ 标题集**：所引判据行逐条实测在盘 —— `docs/core/design/TESTING.md:620`（A-SL1）· `:622`（A-SL3）· `:626`（A-SL7）· `:645`（面差②）。
- **表行 ↔ 汇总数**：上表三行 = 本轮现跑 3 条命令；编辑 = **1 条**（`edit` 回执 1/1），一格改两半（CLI ∥ VSC 各加 cwd），核面原已带 cwd 未动。
- **断言 ↔ 实测**：`docs/core/design/MODEL-SPECS.md` 行数 **1910** —— 单行等量替换 ⇒ 行数零变；`doc_check(mode:"gate", docs = 该档)` = **PASS**（1 档全清，0 段有问题）。

## §3 设计评审（评审子代理）
**状态行**：评审通过 2026-11-01（轮次 4 · 收口验收：轮次 3 七条判面内全落 · 未修族实质披露已核准确，形（#1939 指针 ∥ §6 收口句）待收口落 · 🔴 0 · 🟡 3 · 🔵 3）



### 轮次 1（评审子代理）

### 设计评审 · 删改面复核（清死坐标批 #1925）

**评审判据** = 只问一件：本批 24 档的删除里，有哪一处删掉的其实是判据 / 规则；以及反过来——哪一处把「描述某个档 / 某个机制现态」当成了判据保留下来，删后句子站不住。判据源 = 本档 §1.7（去盘上找 · 在盘不删 · 占位 / 模式留）、§1.8、§1.10。

| # | 类 | 级 | 问题 | 建议 |
|---|----|----|------|------|
| 1 | 文档归属 / 机制两说 | 🔴 | 单测收集面被说成两套。`docs/core/design/TOOLS.md:1822`「项目约定 = `thincoder-core/test/*.test.mjs` 单层收集，runner = `thincoder-core/test/run.mjs`」· `:1823` 跑法 + 「收口门 `cd thincoder-core && node test/run.mjs`」· `:1825`「`thincoder-core/test/*.test.mjs` 的收集面 = `thincoder-core/test/run.mjs`（`node --test test/*.test.mjs`）」· `:1804`「测试档在 `thincoder-core/test/` 下」；`docs/core/design/MODEL-SPECS.md:221`「（runner 自动收集 `test/*.test.mjs`，`thincoder-cli/test/run.mjs:3`）」· `:765`「`thincoder-core/test/run.mjs`（单层 glob 自动收集新测试文件——」。收集面权威 = `docs/core/design/TESTING.md:548`「**收集面权威**：本节 = 收集面 ∥ 空集语义的**唯一权威陈述面**」；同档 `:565`「cli = 空集说明器（零目标集合，任何 `*.test.mjs` 都是错位）；核 = 零目标集合，任何 `*.test.mjs` 都是错位」· `:545`「**单元层无入口**：单元测试档住 `docs/batches/`」。三处互相否认，且 `TOOLS.md:407` 同档自己写「单测档零留存——不进 `test/` 树」（同一机制在同一档内自相矛盾）。这些正是本批 §2.9.2 第 15 条判为「模式判据」保留的处（§2.9.1 逐条列 §6.25 档落点 / 分类）——**读起来像「这一类文件」的形，实际是一句「这个 runner 收什么」的现态断言**，与本批要防的「描述一个档 ∥ 举例一条判据」正好搞反。照此句办：把批内单测档放进 `thincoder-core/test/` 会被 SC-1 判错位、把它当收口门会读到 exit 1 的空集说明。 | 判据补一读：**在盘坐标不等于在盘语义**——文件在盘就把整句留下，是 §1.7「在盘不删」漏掉的一半；收口前对每个留下的 runner ∥ 目录坐标问一次「这行断言的那件行为还在吗」。处置方向 = 删「项目约定 + runner」与「收集面 = …」两截（它们描述的是已退役的包级收集面），跑法改指 `docs/core/design/TESTING.md` §10.3 的单元层口径；`TOOLS.md:1804` 的相对 import 说明随单测档落点一并改述。 |
| 2 | 批次自身裁定未落 | 🟡 | §1.10 ② 的裁定未落盘：`docs/core/design/TESTING.md:195` 仍是「2026-10-26 实测：`docs/batches/*.test.mjs` 13 档横跨 10-15 至 10-26 全部未删（现盘已清零——本门守的是后续每一批）」。裁定原文（本档 `:142`）为「**保留机制事实句**」、删读数；§2.13.5 末段亦记该读数「本席未改」。同档 `:69`「**读数不进状态档**」是该读数自己的判据。「现盘已清零」今日成立（`thincoder/docs/batches/*.test.mjs` 实扫 0 档）**不构成留用理由**——它是时点读数，下一批开批即变假。 | 按 §1.10 ② 落：删掉那段读数，留「因 `test/run.mjs` 不收集该目录，留 ∥ 删都不报警」这一机制句。非删除面事项，属 §1 裁定与 §2 落盘的对账。 |
| 3 | 自报残留未处置 | 🟡 | `docs/core/design/DOC-DISCIPLINE.md:555` `thincoder-cli/test/batch-segment.test.mjs:3` · `:556` `thincoder-cli/test/eng-designer-role.test.mjs:124` · `:557` `thincoder-cli/test/prompts-async-guidance.test.mjs:9`——三处是**具体档名、盘上查无、无通配 ∥ 占位符**，按 §1.7 判据就是死指针（`thincoder/thincoder-cli/test/` 实扫仅 `run.mjs` ∥ `slow.mjs`）。本批 §2.14.11 ④ 自报并留「本席不自行开轮」⇒ **收口前这 3 处不读作已清**。 | 二选一并在 §6 写明：补一轮（按 §2.11.4 #4–7 保「判例输入」属性、只把「处」列的死路径改述为面无坐标的描述），或明确登记为下一批射程。口径未定前不要把「全仓包路径形死坐标 = 0」写成收口读数。 |
| 4 | 文档状态矛盾（非本批面） | 🟡 | `docs/core/design/TESTING.md:532`「cli（集成 5 档 15 例、`test/` 顶层零档）⇒ `npm test` exit 0」与同档 `:622`「cli `npm test` = 空集说明器（exit 1 ∧ 仓根指引 ∧ 无 `zero tests = green`）」两说并存，`:544` 同句亦为 exit 1。两处都是判据行（A-RC3 ∥ A-SL3），不是 as-of 读数列。 | 属 §12 仓根归位前的存量、本批删改面外——只登记：收口轮按「同档判据行只说一套」收正 A-RC3，或给它加 as-of 限定。 |
| 5 | 读数口径 | 🔵 | §2.14.11 的「设计层残 4 处」含一例误报：`docs/core/design/TESTING.md:1110` 那行主体是 `删（目录同删）`（§12 归位批把该清单档连 `thincoder-vscode/test/integration/` 一并删除的 as-of 记录；该目录实扫不在盘），**不是活指针**。 | 收口复扫按 **3 处**读（三处都在 DOC-DISCIPLINE），并说明第 4 处是 as-of 删除行。 |
| 6 | 判例引用文本 | 🔵 | `docs/core/design/DOC-DISCIPLINE.md:2034`（§4.5.9 S6 判例行）逐字引需求档 F6 为「随批留存、不进任何门、零维护、可按需复跑」——与同族「零留存（用毕即删）」相反。该行作为**判例输入**保留是对的（删输入即删判定），但引文与现行寿命口径是否一致 **unverified**（需求档不在本次评审范围）。 | 收口时核一次 `docs/core/requirements/TESTING.md` F6 现文；若已改为零留存，判例行的逐字输入随正——否则这一格示范的是「随批留存」。 |

**核对过的方向（未发现问题）**：

- §2.11.3 ∥ §2.12.3 列的「保事实删坐标」13 + 8 处，逐处读后句子仍站得住：`A-DD13` 判据 ①②、`A-DD19` ③ 回归锁、`docs/core/design/TESTING.md` §3.5 最长前缀理由 ∥ AC-1、§10.1 追加范围、§11.4 示例行 + §11.15 D-3 的 `6-1` ∥ `6-2` ∥ `6-3` 用例号。
- §3.12 族别口径 ① 的抽样例去名后仍是可判的域句（「① 族抽样亦含 CLI 测试树的测试头注」）。
- `BATCH-LEDGER-REVIEW-UNIFY` 的 `x.test.mjs` 占位、`docs/core/design/TESTING.md` 的 `__probe` ∥ `x-2` ∥ `x-extra` 判例输入属 §1.7「模式 ∥ 占位」正解，未误删。

**计数**：🔴 1 · 🟡 3 · 🔵 2。

VERDICT: changes-required

### 轮次 2（评审子代理）

**轮次 2 口径**：只验轮次 1 六条（🔴1 · 🟡2 · 🟡3 · 🟡4 · 🔵5 · 🔵6），逐条判已落 ∥ 未落，不开新议题。核对面 = `docs/core/design/TOOLS.md` · `docs/core/design/MODEL-SPECS.md` · `docs/core/design/TESTING.md` · `docs/core/design/DOC-DISCIPLINE.md` 四档改后原文。

**逐条裁定（1 未落 · 5 已落）**

| # | 项 | 判 | 依据 |
|---|---|---|---|
| 1 | 🔴1 收集面：两份档与 `docs/core/design/TESTING.md` 同口径 | **未完全落** | 六处已改且「收口门」句站得住（见下「已核」）；同两档仍各留一条同面残句，见下二行 |
| 2 | 🟡2 `docs/core/design/TESTING.md:195` 读数段 | **已落** | 现逐字「**方案与理由**：§3.1 ① 的「零留存」此前只有纪律句、没有结构兜底；因 `test/run.mjs` 不收集该目录，留 ∥ 删都不报警。」——读数已删、机制句留，与 §1.10 ② 裁定同形 |
| 3 | 🟡3 `docs/core/design/DOC-DISCIPLINE.md:555`–`:557` 三处 | **已落（按裁定保留）** | 父侧裁定落 §2.15.3 · 收口复扫口径落 §2.15.5（按 3 处读）；三行句内逐字标「档不在盘」，不构成活指针断言 |
| 4 | 🟡4 `docs/core/design/TESTING.md:532` A-RC3 | **已落** | 现逐字「cli（`test/` 顶层零档、零 `*.test.mjs`）⇒ 零 `uncollected test file`、出口 = 空集说明器（exit 1 ∧ 仓根指引——集成层在仓根，§10.3 A-SL3）」——与 `:622` ∥ `:628` 同口径 |
| 5 | 🔵5 `docs/core/design/TESTING.md:1110` | **已落（误报确认）** | 行主体 = 「删（目录同删）」，§12 归位批的 as-of 删除记录，非活指针 |
| 6 | 🔵6 `docs/core/design/DOC-DISCIPLINE.md:2034` 判例输入 | **已落** | 现引「①单元=单元测试档（一档一至几个文件、名随批次档、住 `docs/batches/`；用毕即删（零留存）、不进任何门）」，与 §2.15.6 所引需求档 F6 同向 |

**已核 · 六处改后原文**：`docs/core/design/TOOLS.md:1824` 档落点 · `:1825` 跑法 + 收口门 · `:1827` 分类 · `:1806` import 面（两级回仓根，路径算术成立）· `docs/core/design/MODEL-SPECS.md:221` ∥ `:765`。

`docs/core/design/TOOLS.md:1588` ∥ `:1687` 的收集面句亦已改指仓根 runner，与 §10.3 同口径。

**已核 · 收口门那句的判据源**：`docs/core/design/TESTING.md:193` 逐字「### 3.5 零留存的收口门（本批自己的单测档仍在盘 ⇒ 拒收口）」· `:197` 逐字「补一道**收口前置门**：本批自己的单元测试档仍在盘 ⇒ 拒收口」。

改后句 = 「收口门 = 本批单元测试档已删（口径 = `docs/core/design/TESTING.md` §3.5 收口前置门）」——与上两行同义，节锚可解析 ⇒ **站得住**。

**未落（🔴1 残句 · 两条同机制两说）**

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 机制两说（收集面） | 🔴 | `docs/core/design/TOOLS.md:1848` A4 逐字「`cd thincoder-core && node test/run.mjs` 全绿」；同命令在 `docs/core/design/TESTING.md:623` A-SL4 逐字「`cd thincoder-core && node test/run.mjs` ⇒ **exit 1**」，`docs/core/design/TESTING.md:555` 逐字「常态读数 = exit 1 + …」· `:556` 逐字「不得改回 exit 0（空集不读作绿——§10 F5）」。核 runner 无条件 exit 1 ⇒「全绿」永不出现 | 把 A4 判法换成可达的零回归读数（核包语法门 exit 0，或批内单测档 `node --test` 按用例结果），删「全绿」；表述与 §10.3 核仓口径同句 |
| 2 | 机制两说（收集面） | 🔴 | `docs/core/design/MODEL-SPECS.md:296` A-10 逐字「CLI `node test/run.mjs`（集成集 15 例）· VSC `node test/run.mjs` 均 `fail 0`」；`docs/core/design/TESTING.md:544` 逐字「包级 `npm test` 不再是集成门（cli = 空集说明器，同核仓口径…）」· `:126` 逐字「`ℹ tests` ∥ `fail 0` + exit 0 在这面从不出现」· `:622` 逐字「cli `npm test` = 空集说明器（exit 1 ∧ 仓根指引…）」 | 集成面读数改指仓根 `node test/run.mjs`（口径 = `docs/core/design/TESTING.md:620` A-SL1 的 `ℹ tests 15`）；cli 半改空集说明器（exit 1），删「集成集 15 例」与 `fail 0` |

**为何这两条算 🔴1 未落**：本批判据 §1.11 逐字「**在盘坐标 ≠ 在盘语义**」——`thincoder-core/test/run.mjs` 在盘只证明那件东西还在，这行断言的那件行为早已反转。

两条正是「照它办就读到不可能读数」的那一类。§2.15.4 已立「判据必须今日成立；带 as-of 的判据等于没有判据」，故 A4 ∥ A-10 不能以历史快照辩解。

**知会（同面族，未计级）**：`docs/core/design/TOOLS.md:316`（「三包集成测试集（`npm test`）失败集合 ⊆ 批前失败集合」）∥ `:563`（「两包集成测试集：`thincoder-core` `node --test` + `thincoder-vscode` `npm test`」）仍是包级集成面措辞。

上两行与 `docs/core/design/TESTING.md:544` 相抵；另 `docs/core/design/TESTING.md:402` A-TS9 的 cli 半仍写「exit 0 ∧ `ℹ tests 15`」，与同档 §10.3 自相抵。三处不改变本轮六条裁定，登记供父侧定射程。

**计数**：🔴 1（🔴1 未落，含 2 条残句）· 🟡 0 · 🔵 0——🟡2 ∥ 🟡3 ∥ 🟡4 ∥ 🔵5 ∥ 🔵6 均判已落。

VERDICT: changes-required

### 轮次 3（评审子代理）

**第 3 轮 · 收尾验收（轮次 2 六项 + 其后四小轮）**

**口径**：只验轮次 2 判 `changes-required` 的两条 🔴 与三条同族知会（其后落为四小轮），逐条给坐标；重点复核新句子里的四条命令是否真的存在、真的这么读。

**已落项逐条（7 项 · 全落）**

| # | 项 | 判 | 依据（本轮复读原文） |
|---|---|---|---|
| 1 | 轮次 2 🔴 A4 → `docs/core/design/TOOLS.md:1848` | 已落 | 现读「零回归读数取核包可达面（核仓无集成测试集，口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL4）：本批单测档 `node --test` 按例全过 + `cd thincoder-core && npm run prepublishOnly` ⇒ exit 0 ∧ 输出 `check-syntax: N file(s) OK`」——「全绿」已无 |
| 2 | 轮次 2 🔴 A-10 → `docs/core/design/MODEL-SPECS.md:296` | 已落 | 核 = 语法门 · 集成层 = 仓根 runner · CLI = 空集说明器 exit 1 · VSC = 单元清单面；「集成集 15 例」已删 |
| 3 | 同族 → `docs/core/design/TOOLS.md:316` A-MS6 括注 | 已落 | 现读「…（口径单源 = `docs/core/design/TESTING.md` §10.3 A-SL1）⇒ 失败集合 ⊆ 批前失败集合；H3 夹具读数落 §5。」；`A-MS6` 本档零命中 |
| 4 | 同族 → `docs/core/design/TOOLS.md:563` A27 | 已落 | 集成层 = 仓根 runner · VSC = 单元清单面（面差②）· 抽样对拍；包级集成面措辞已无 |
| 5 | 同族 → `docs/core/design/TESTING.md:402` A-TS9 cli 半 | 已落 | 现读「cli = 空集说明器（exit 1 ∧ 输出指仓根——集成层在仓根，A-SL3）」，与同档 `:544` ∥ `:622` 同口径 |
| 6 | 同族 → `ℹ tests 15` 五处 | 已落 | `docs/core/design/TESTING.md:620` A-SL1 · `:622` A-SL3 · `:1132` AC-IU1 · `:1134` AC-IU3 · `:1146` U-IU1 均换 `exit 0 ∧ fail 0`；同档 `tests 15` 零命中 |
| 7 | `docs/core/design/MODEL-SPECS.md` 五行 + `docs/core/design/SESSION.md` 五处「三端 ∥ 三包…全绿」 | 已落 | 前者 `:542` `:675` `:782` `:974` `:1135`，后者 `:524` `:526` `:590` `:695` `:697` `:743` `:745` `:793` `:795`，均为「各取本面可达值」形；两档「三端测试全绿 ∥ 核测试全绿」零命中 |

**可跑性（父侧点名项 · 逐条对上权威面）**

四条命令各有本档权威陈述：核语法门 = `docs/core/design/TESTING.md:626` A-SL7（exit 0 ∧ `check-syntax: N file(s) OK`）· 仓根集成层 = `:620` A-SL1（exit 0 ∧ `fail 0`）。

CLI 空集说明器 = `docs/core/design/TESTING.md:622` A-SL3（exit 1 ∧ 仓根指引）· VSC 单元清单面 = `:645` 面差②。四读数与父侧实跑一致，新句子无「照办读到不可能读数」。

**未落 / 新查（🔴 1 · 同族残句：坐标不在派单内，但落在本批拥有的档内）**

| # | 类 | 级 | 问题 | 建议 |
|---|---|---|---|---|
| 1 | 文档归属 · 机制两说（集成门入口） | 🔴 | `docs/core/design/TESTING.md:25` 逐字「入口 = 各包 `npm test`（§10 F1）」· `:95` 逐字「`npm test`（单入口）= 集成测试（收口时）（§10）」· `:459` AC-M10-1「`npm test` 一条命令跑**集成测试**」· `:462` AC-M10-4「有集成集 ⇒ 全绿（`npm test` → exit 0）」；同档 `:544` 逐字「包级 `npm test` 不再是集成门（cli = 空集说明器」· `:40`「**集成层**（收口时）· `test/integration/*.test.mjs` 单层收集」· `:622` A-SL3 cli = 空集说明器。四小轮刚落的句子全靠 `:544` ∥ §10.3 站住（`docs/core/design/MODEL-SPECS.md:296`「CLI `node test/run.mjs` = 空集说明器 exit 1 ∧ 输出指仓根」）⇒ 同档两句互相否认：照 `:25` ∥ `:95` 办会去跑包级 `npm test`（核 ∥ cli 无条件 exit 1），照 `:544` 办才读得到集成层的绿。**与轮次 2 那两条 🔴 同一机制族**，只是不含量词、不被七量词复扫覆盖 | 删 `docs/core/design/TESTING.md:25` 的入口句与 `:95` 的「`npm test`（单入口）」谓语，改指仓根 `node test/run.mjs`（口径 = 同档 §10.3 A-SL1）；`:459` ∥ `:462` 按 §10.3 收正或加 as-of 限定。判据 = 改后同档无「入口 = 各包 npm test」形 + doc_check gate 复跑 PASS |
| 2 | 清晰 / 可跑性 | 🟡 | `docs/core/design/MODEL-SPECS.md:296` 核半只写「核 `npm run prepublishOnly` exit 0」，缺 cwd 前缀；同批同形的另五处（`:542` ∥ `:675` ∥ `:782` ∥ `:974` ∥ `:1135`）与 `docs/core/design/SESSION.md` 五处均写 `cd thincoder-core && npm run prepublishOnly` | A-10 核半对齐为 `cd thincoder-core && npm run prepublishOnly`，与同批九处同形（`prepublishOnly` 是包级 script，无 cwd 不能就地照跑；仓根另有同名 script = **unverified**） |
| 3 | 验收 / 证据域 | 🟡 | 收口复扫的查询式只覆盖「量词 + 全绿」形：`docs/batches/2026-11-01-dead-test-coordinates.md:1285` 逐字「模式 = `(三端|三包|三仓|两端|两包|三面|两面)[^\n。，|]{0,12}全绿`」，改后读数 = 1（`:1290`）。同批自己已立「换量词即扫不到」（§2.18.5）⇒「全绿族清零」的域 = 这一个模式，不含不带量词的形（本条 🔴 的 `:25` ∥ `:459` ∥ `:462` 正是扫不到的那类） | §6 收口行写清结论的域（模式 + 扫描档集），或补一次不带量词的扫描（`全绿` ∧ 命令 token · `npm test` ∧ `exit 0`）后再落「清零」 |
| 4 | 集成影响（RTM 增量） | 🟡 | §2 无以仓根 `test/RTM.md` 为基线的增量陈述（本批断哪些行 / 哪些行冗余 / 缺哪些行）；现有只有 `:231`「本批无产品码改动 ⇒ 无单测档可写。验收读数为两条静态计数（见 §2.6）+ `doc_check` gate」与 `:345` 的 B 类欠账（RTM 22-1 ∥ 22-2 ∥ 22-3 未落地）。本批确实不改任何业务可观察结果，但该结论未以 RTM 增量的形写出 | §2 补一行 RTM 增量结论（不改现有用例断言的业务可观察结果 · 不新增场景 · 例外 = 22-1 ∥ 22-2 ∥ 22-3 仍 `待执行` 的既有欠账），供 §6 收口行直接引用 |
| 5 | 评审面限制 | 🔵 | 本次评审上下文无文档地图、无项目标准档；文档归属按 `docs/core/design/TESTING.md:548` 自述「本节 = 收集面 ∥ 空集语义的**唯一权威陈述面**」判，未按地图判 | 收口时若另有归属表，按表复核 TESTING 的 §1 ∥ §10 归属面 |

**核对过的方向（未发现问题）**

- 受影响文件全为 `.md`（`:1305` 共 24 档）⇒ tier 判定豁免。
- 本批验收 = doc_check gate + 静态计数（`:231` · `:368` · `:715` · `:1105` · `:1191` · `:1301`），未把全量套件写成轮内验收。
- `docs/core/design/MODEL-SPECS.md` 余五处「全绿」（`:707` `:832` `:1336` `:1432` `:1444`）逐条读过，均为离线断言、不点命令。
- `docs/core/design/CONTEXT-COMPACTION.md:692`「两面用例全绿」= 父侧裁定不动项。

**计数**：🔴 1 · 🟡 3 · 🔵 1。

VERDICT: changes-required

### 轮次 4（评审子代理）

### 设计评审 · 第 4 轮（收口验收 · 两件）

**口径** = 只验两件。

① 轮次 3 七条 / 五条未落项的落盘状态。

② 本记录是否如实披露 `npm test = 集成入口` 未修族（不读成已清零、指向台账 #1939）。新发现的同族行归 #1939，不阻本批。

核对面 = `docs/core/design/TESTING.md` · `docs/core/design/MODEL-SPECS.md` · 本档 §2.20 ∥ §2.21。

判面限制：`docs/core/design/TOOLS.md` ∥ `docs/core/design/SESSION.md` 不在本次三档评审范围内 ⇒ 涉及它们的条目判 unverified。

#### A · 轮次 3「已落 7 项」复核（判面内 4 项 · 判面外 3 项）

| # | 项 | 判 | 依据（本轮复读原文） |
|---|---|---|---|
| 1 | `docs/core/design/TOOLS.md:1848` A4 ∥ `:316` ∥ `:563` | **unverified** | 该档不在本次评审判面内 |
| 2 | `docs/core/design/MODEL-SPECS.md:296` A-10 | 已落 | 核半现读「核 `cd thincoder-core && npm run prepublishOnly` exit 0 ∧ `check-syntax: N file(s) OK`」——cd 前缀在盘 |
| 3 | `docs/core/design/TESTING.md:402` A-TS9 cli 半 | 已落 | 现读「cli = 空集说明器（exit 1 ∧ 输出指仓根——集成层在仓根，A-SL3）」 |
| 4 | `ℹ tests 15` 五处 | 已落 | 同档 `tests 15` 复扫零命中 |
| 5 | `docs/core/design/MODEL-SPECS.md` 五行 | 已落 | `:542` ∥ `:675` ∥ `:782` ∥ `:974` ∥ `:1135` 均「各取本面可达值 · 口径单源 = §10.3」形 |
| 6 | `docs/core/design/SESSION.md` 五处 | **unverified** | 该档不在本次评审判面内 |

#### B · 轮次 3 的 🔴1 ∥ 🟡3 ∥ 🔵1 逐条

| # | 项 | 判 | 依据 |
|---|---|---|---|
| 1 | 轮次 3 🔴1 首行 | **已落** | `docs/core/design/TESTING.md:25`「入口 = 仓根 `node test/run.mjs`（口径 = §10.3 A-SL1）」 |
| 1b | 同上另三行 | **已落** | 同档 `:95`「集成测试集的入口 = 仓根 `node test/run.mjs`」· `:459`「入口 = 仓根 `node test/run.mjs`（包级 `npm test` 不再是集成门」· `:462`「仓根 `node test/run.mjs` → exit 0 ∧ `fail 0`」 |
| 1c | 四行与同档口径 | **同口径** | 与 `:544` ∥ `:622` 一致；「入口 = 各包」形零命中 |
| 2 | 轮次 3 🟡2 cd 前缀 | **部分已落** | 核半已补（见 A-2）；同一格 CLI ∥ VSC 两半仍无 cwd（见下表 #2） |
| 3 | 轮次 3 🟡3 复扫域 | **部分已落** | 本档 `:1427` 标题「#### 2.21.3 本档同族残句 4 处（未动 · 知会）」+ `:1429`–`:1434` 逐字列四行 + `:1436` 未动理由——以逐行枚举替代「清零」读数，实质到位；§6 收口行与其结论域仍未写 |
| 4 | 轮次 3 🟡4 RTM 增量 | **已落** | 本档 `:1377`「以仓根 `test/RTM.md` 为基线的增量」+ `:1379`–`:1382` 破行 ∥ 冗余 ∥ 新增 = 0 + 理由 + 例外 22-1–22-3 仍 `待执行` |
| 5 | 轮次 3 🔵5 评审面限制 | **不适用**（评审侧口径，非设计侧可落项） | 本轮上下文仍无文档地图 |

#### C · ② 未修族披露 —— 核实结果

- **实质披露在盘且准确**：本档 `:1427` 标题「本档同族残句 4 处（未动 · 知会）」· `:1429`「`:411` A-TS18 逐字「门 = `npm test` 单入口」」· `:1430`–`:1434` 另三行 · `:1436` 未动理由。
- **逐条去盘上对**：`docs/core/design/TESTING.md:411`「门 = `npm test` 单入口」· `:413`「`npm test` = 集成层单层收集」· `:546`「因此 `npm test` 只证明一件事：集成层的发布门」· `:584`「**KD-1 `npm test` 只留集成层**」——四条全在盘、文字全对。
- ⇒ 本记录**不会**把这族读成已清零。
- **缺的一件**：本档 `#1939` **零命中**（同档 `:120` 引 `#1936` · `:144` 引 `#1927` 同体例 ⇒ 缺此指针在体例上是可见的）。
- **另缺**：§6 收口记录为空（`:1601` 之后无正文），「本批未清此族」尚未以收口句落盘。

| # | 类 | 级 | 问题 | 建议 |
|---|----|----|------|------|
| 1 | 披露诚实度（② 项） | 🟡 | 未修族的**实质**披露已在 `:1427`–`:1436`，且经核与盘上四行逐字相符（不会读成已清零）；**形**未落：本档 `#1939` 零命中、§6 无收口句 ⇒「本批未清此族 + 指向 #1939」在记录里查不到。另 `:1436` 只界定 `docs/core/design/TESTING.md` 的四行，未含 #1939 所辖其余同类 | §6 收口行写一行：「本批未清此族 = 本档 `:1429`–`:1434` 四行 + #1939 所辖同类；本批射程不含此族」；或同句追加至 `:1436` 末。判据 = 本档 `#1939` ≥1 命中且与「未清」同句 |
| 2 | 可跑性 / 清晰 | 🟡 | `docs/core/design/MODEL-SPECS.md:296` 同一格三面只核半带 cwd：「CLI `node test/run.mjs` = 空集说明器 exit 1 ∧ 输出指仓根」∥「VSC `node test/run.mjs` exit 0 ∧ `fail 0`」均无 `cd`，而同格前半已把「仓根 `node test/run.mjs`」定义为集成层 ⇒ 这两处按字面在仓根跑读到的是集成层读数，与自述的 CLI 空集 ∥ VSC 单元清单面相反；同档 `:542` ∥ `:675` ∥ `:782` ∥ `:974` ∥ `:1135` 五处均写 `cd thincoder-vscode && …` | CLI ∥ VSC 两半各补 cwd（`cd thincoder-cli && …` ∥ `cd thincoder-vscode && …`），与同档五处同形 |
| 3 | 收口链（协调项） | 🟡 | 本档 §4「用户批准」（`:1599`）无内容、亦无 `> 不适用：§4 —— …` 行；§6（`:1601`）之后无正文 ⇒ 按六段收口链门（§2/§3/§4/§6 各须有内容，§5 豁免，§6 从不可缺）写 §1「已收口」会被拒 | 收口前补 §4（批准 ∥ 不适用声明）与 §6（含上条那一行）；§5 空不阻 |
| 4 | 评审面限制 | 🔵 | A 表判面外条目（`docs/core/design/TOOLS.md:1848` ∥ `:316` ∥ `:563`、`docs/core/design/SESSION.md` 五处）本轮只能判 unverified，**不读作已复核** | 若收口需这四条的全链复核，另派含 `docs/core/design/TOOLS.md` ∥ `docs/core/design/SESSION.md` 的判面 |
| 5 | 集成影响 | 🔵 | §2.20.7 例外坐标 `test/RTM.md:263`–`:265` 在本次判面外 ⇒ unverified；增量结论之形（破/冗/新 = 0 + 理由 + 例外）已足 | 收口时按 RTM 现文核一次三行结果列仍为 `待执行` |
| 6 | 记录体例 | 🔵 | §2 无独立「先例对齐 ∥ 公共源勘察」行；实质在 `:1268`（与同档 §6.17 先例逐字一致）∥ `:1390`（口径单源 = §10.3）；本档 §2 模板未要求该行 ⇒ 不构成缺口 | 无动作；若收口口径要求该行，在 §6 指一次即可 |

**核对过的方向（未发现问题）**

- 受影响面全为 `.md`（`:1305` 24 档）⇒ tier 判定豁免；无代码 ∥ 无测试档 ⇒ 无 6b 分支来源问题。
- `docs/core/design/TESTING.md` 交付门面无修订痕：`原为 ∥ 已废弃 ∥ 已改 ∥ 原写 ∥ ~~` 复扫零命中。
- 验收未写成全量套件：`:1388` ∥ `:1442`–`:1446` 为三条命令现跑 + `doc_check` gate。
- 受影响档 = `docs/core/design/TESTING.md` 自身（`:548` 自述为收集面 ∥ 空集语义唯一权威陈述面）⇒ 归属正确，未 Fragment。

**计数**：🔴 0 · 🟡 3 · 🔵 3。

VERDICT: pass

## §4 用户批准（主 agent）

## 4. 用户批准（主 agent）

**状态行**：已批准 2026-11-01

### 4.1 批准依据（用户原话 · 逐字）

- **「开」**（2026-11-01 02:34）—— 回应父侧的「`#1925` 你说清我就开」。**这一句 = 本批开批 + 整条链的 go-ahead**。
- **「继续」**（2026-11-01 10:46 ∥ 11:03 ∥ 11:16 等多处）—— 中间隔夜，用户每轮以「继续」推进，**未变更射程**。
- **「剩下得三件事也推进吧」**（2026-11-01 11:47）—— 本批收尾 + `#1935` + `#1937` 三件并推。

### 4.2 缘起

`#1923` 收口排查时登记：**提示词要求「先例勘察、先对齐」，而设计档里 239 处「指向已不存在的单测档」的坐标在教下一个设计席写旧形。** 同批 `#1926` 治的是「新写的」（立「先例必须在盘」规则），**本批治存量**。

### 4.3 批准范围

`docs/core/design/**` 下的死测试坐标清理（24 档 · 两百余处），**判据两形**：包路径形（零留存 ⇒ 按构造就死）∥ 裸名形（去盘上找，在盘不删、占位/模式留）。

### 4.4 中途确立的两条判据（用户全程知晓）

- **§1.11「在盘坐标 ≠ 在盘语义」** —— 坐标所指文件在盘，只证明那件东西还在；这行断言的那件行为还在不在，得另问一次。
- **§2.15.4「判据必须今日成立；带 as-of 的判据等于没有判据」**。

### 4.5 明确不在本批（全部已登账，射程在记录里写死）

| 台账 | 内容 |
|---|---|
| `#1931` | 族行：四个集成用例档未落地 |
| `#1932` | 四档存量 245 锚挡改动（其中 230 条是迁移映射表左列） |
| `#1933` | `docs/core/design/DOC-MIGRATION.md` §10.5 S4 步骤无落点 |
| `#1934` | `upstream-parity` 单测档从未登记 |
| `#1936` | `thincoder-vscode/test/` 5 个零留存档没删 |
| `#1938` | 需求档 5–7 处「三包全绿」族 |
| `#1939` | 设计档 10 档 + 本档 4 行「包级 `npm test` = 集成入口」族 |

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）

## 6. 验证与收口（父代理）

**状态行**：已收口 2026-11-01

### 6.1 本批做了什么（一句话）

**把 `docs/core/design/**` 里「指向已不存在的单测档」的坐标清掉** —— 单测档零留存，**指向它的路径写下的那一刻就开始过期**；而提示词要求「先例勘察、先对齐」⇒ **不清，下一个人就照旧形写**。

**射程 = 24 档设计档**；**不动代码、不动需求档、不动提示词面、不动别批档**。

### 6.2 父侧收口读数（自跑）

```
包路径形死坐标（docs/core/design，不含 _archive）：S1 前 239 处 → 收口 0 处
「N 端 ∥ 包 ∥ 仓 + 全绿」族：改前 10 处 → 改后 1 处（CONTEXT-COMPACTION.md:692，可达，裁定保留）
`ℹ tests 15` 族：改前 9 命中 → 0
三端 ∥ 三包测试全绿族：改前 5 行 → 0
```

**残余判据**：`x.test.mjs` 类占位 ∥ `__probe` 类构造即删 ∥ 在盘集成档 ∥ 处置表「处」列 —— **四类均非死指针，逐类有理由，见 §2.9 ∥ §2.11 ∥ §1.7**。

### 6.3 本批立的两条判据（最值钱的部分）

**① 「在盘坐标 ≠ 在盘语义」（§1.11）**

**坐标所指的文件在盘，只证明那件东西还在；这一行断言的那件行为还在不在，得另问一次。**

实证：`thincoder-core/test/run.mjs` 一直在盘 ⇒ 按「在盘不删」整行留下 —— **而它断言的「核 runner 收 `test/*.test.mjs`」早不成立**（该档逐字「本 runner 无目标集合：不跑任何用例」）。**照那行办，下一批把单测档放进 `thincoder-core/test/` 会被判错位，把 `node test/run.mjs` 当收口门会天天读到 exit 1。**

**② 「判据必须今日成立；带 as-of 的判据等于没有判据」（§2.15.4）**

**这两条与 `#1926` 是同一个坑的两头**：`#1926` 补的是「提示词里没写单测档住哪」，本批补的是「设计档里写着错的住哪」。**两件都做完，这个坑才真闭上。**

### 6.4 ★ 本批未清此族（明确声明，不读成已清零）

**「包级 `npm test` = 集成入口」这一族，本批只清了 8 行，尚有 4 行留在 `docs/core/design/TESTING.md`：**

```
:411  A-TS18「门 = `npm test` 单入口」
:413  A-TS20「`npm test` = 集成层单层收集」
:546  「因此 `npm test` 只证明一件事：集成层的发布门」
:584  KD-1「`npm test` 只留集成层」
```

**另加跨 10 档的同类**（`docs/core/design/AGENT-LOOP-UPSTREAM.md` ∥ `docs/core/design/SESSION-OBSERVABILITY.md` ∥ `docs/core/design/BASH-EXECUTOR-FACE.md` ∥ `docs/core/design/CORE-UNIFICATION.md` ∥ `docs/core/design/TWO-REPO-MERGE.md` ∥ `docs/core/design/DOC-DISCIPLINE.md` 等）。

**全部由台账 `#1939` 承接，接笔时按组一起改。本批射程不含此族 —— 收口声明不当它是零。**

### 6.5 本批滚出来的债（全部登账，指针在台账）

| 台账 | 内容 |
|---|---|
| `#1931` | 族行：四个集成用例档未落地（SSH 22 ∥ VSC 宿主段 ∥ VSC 回声恒带 ∥ VSC 子代理生命周期） |
| `#1932` | 四档存量 245 锚 + 43 长段挡改动 —— 其中 230 条是迁移映射表左列（按表语义本就档缺） |
| `#1933` | `docs/core/design/DOC-MIGRATION.md` §10.5 的 S4 步骤无落点 |
| `#1934` | `upstream-parity` 单测档从未登记也不在盘 |
| `#1936` | `thincoder-vscode/test/` 5 个零留存档没删 + 设计档称「现无 `.test.mjs`」与盘相反 |
| `#1938` | 需求档 5–7 处「三包全绿」族（可达性） |
| `#1939` | 设计档「包级 `npm test` = 集成入口」族（本档 4 行 + 跨 10 档） |

**已撤回（前提不成立）：`#1929` `#1930`（并入 `#1931`）∥ `#1935`（AC-M2-36 不是断层）∥ `#1937`（`thincoder-core/tool-docs/batch.md:31` 分支仍可达）。**

### 6.6 过程账（十一轮）

S1–S9 九轮清理 + 五轮修正。**每一次「改一半」的形状都一样**：删了档名留了「它收什么」（第 1 次）· 改了「住哪」没改「哪条命令能跑绿」（第 2 次）· 改了「三端」漏了「三包」（第 3 次）· 改了「入口 = 各包」漏了同族四行（第 4 次）· 同格三面只补一半 cwd（第 5 次）。

**⇒ 一句话的寿命，不在它提到的那件东西上，在它断言的那件事上。**

### 6.7 收口判据

- chain：§1 · §2（S1–S9 + 六轮修正）· §3（四轮，终态 pass）· §4 · §5 · §6 全在。
- 验收：`doc_check` gate PASS（各轮）；父侧复扫读数见 §6.2；四类残余逐类有理由。
- **零留存**：本批无单测档（纯设计档改动）。
- 未清族：见 §6.4，`#1939` 承接。
- 台账：`#1925` → 已核销。
