# 结构债批 7（STRUCTURE-DEBT-BATCH-7——等裁项收尾批）

> 板块：结构债（横切）。权威源：STRUCTURE-DEBT.md（总账）+ 本文档（批专属设计——2026-09-08 夜用户逐一裁定的等裁项——收尾一致性 3 小项）。
> 状态：**设计待评审**——2026-09-09 落档（勘察 explore 一手——改动面 file:line 实测）。大项（L31 轨迹 / L50 advisor 模板 / L52 sync 中止）各自独立留档——不在本批。

---

## 需求（用户裁定记录）

- **L58**：VSC 评审陈旧面对齐 CLI isCodePath（2026-09-08 用户裁"对齐 CLI"——VSC 任意文件变更都判陈旧 vs CLI 只 code-path——文档改动不烧评审轮次）。
- **L24**：R19 read_history 护栏改消息数预算（用户裁"消息数预算——解析后消息数组长度"——现 READ_HISTORY_SCAN_MAX 200K 按物理 \n 行计——JSON 单行槽护栏失效）。
- **system.md:24 下批同步 3 子项**（§11.3 上报项 1+2 用户裁纳入）：① token 存活指引 VSC 对齐 CLI ② slot 行内 prose 短句 ③ SESSION §11 字段映射补 slot 条目。

## 设计（勘察建议——照做勿自行解释）

### 1. L58 VSC 评审陈旧面（小）

- VSC `src/agent-tools/advisor-async.mjs:104`——`advisorStale` code 分支 `return true // 任意文件变更即陈旧` → **改按 isCodePath 过滤**（launch 后仅 code-path 变更判陈旧——doc/temp 编辑不陈旧）。
- 补 `isCodePath`/`isTempFile` 等价函数——放 VSC `src/advisor/repos.mjs` isDocFile（:107）旁——供 `hasCodeMutations` 同用（附带差：VSC run-helpers.mjs:75-79 只排除 doc 无 temp——对齐一并修——CLI repos.mjs:146 `!isTempFile && !isDocFile` 参照）。
- 同步模块头注（:10/:97-98 "任意文件面" 描述 → code-path 面）。

### 2. L24 R19 read_history 护栏消息数预算（小-中）

- CLI `src/agent-tools/read-history.mjs`：:139-162 行扫 `exceedsScanMax` 保留为廉价第一道 + **:181-184 parse 后加 `data.history.length` 检查**（消息数预算——超限返回 TOO_LARGE_ERROR 同款文案或更新文案）——文案/描述口径 :225 + SESSION.md:558 定稿文案同步（设计决策点：保留行扫第一道 + 加消息数第二道——双保险）。
- VSC `src/agent-tools/read-history.mjs`：同构（:52 常量/:136-160 行扫/:182-185 parse 后加 length 检查）。
- **测试重建**（勘察歧义 1：全仓 test 树无 read-history 专项——CHANGELOG 称 T-R19.1..7 但清理轮疑删）——设计补：双端各建 read-history 护栏测试（消息数超限拒绝 + 行扫第一道 + 正常查询不回归）。

### 3. system.md:24 同步 3 子项（小）

- **3①**：VSC `src/prompts/system.md:24`——括号去 `tokens,`（`(tokens, caches, in-flight flags)
  survived` → `(caches, in-flight flags) survived`）+ 在 "A mode/model change…" 前插 CLI 逐字
  例外句（"Design tokens are the exception: a still-valid design token (within its TTL) is
  restored with the session slot — … expired tokens are dropped at restore."——CLI :24 逐字参照
  ——实现时 read CLI :24 逐字复制）。
- **3②**：双端 system.md:24——"model = the active model" 后插 "slot = the current session's sticky slot (null when none is bound)"（双端各 1 处）。
- **3③**：CLI `docs/design/SESSION.md` §11 字段映射（:354-359——现 env/mode/model/resumed 四行）——model 行（:358）后补 slot 行（`slot` → 粘性当前会话槽——N2 语义——无绑定 null——§11.2 :406-412 参照）。VSC SESSION.md 无 §11 env-state 镜像段（勘察核——不动）。

## 受影响文件

| 文件 | 端 | 改动 | 行数 |
|---|---|---|---|
| src/agent-tools/advisor-async.mjs:104 | VSC | advisorStale code 分支 isCodePath 过滤 | 现（+~8） |
| src/advisor/repos.mjs:107 旁 | VSC | isCodePath/isTempFile 补 | 现（+~15） |
| src/agent/run-helpers.mjs:75-79 | VSC | hasCodeMutations 补 temp 排除 | 现（+~2） |
| src/agent-tools/read-history.mjs:181-184 | CLI | parse 后 history.length 检查 | ~285 现（+~6） |
| src/agent-tools/read-history.mjs:182-185 | VSC | 同 | 现（+~6） |
| test/read-history-guard.test.mjs | 双端新 | 护栏测试（消息数超限/行扫/正常） | 新 |
| src/prompts/system.md:24 | VSC | 3① token 例外对齐 | 行内 |
| src/prompts/system.md:24 | 双端 | 3② slot 短句 | 行内 |
| docs/design/SESSION.md:354-359 | CLI | 3③ 字段映射补 slot 行 | doc |

## 验收

- AC1 VSC 评审陈旧 = code-path only（doc/temp 编辑不触发——launch 后 code-path 变更仍触发）
- AC2 read_history 消息数护栏生效（超限拒绝——行扫第一道保留——正常查询不回归——测试绿）
- AC3 双端 system.md:24 token 指引一致（VSC 含 CLI 逐字例外句——无 tokens 不存活矛盾）+ slot 短句双端在位
- AC4 SESSION.md §11 字段映射含 slot 行
- AC5 双端 npm test 快层 + L2 绿（链终）
