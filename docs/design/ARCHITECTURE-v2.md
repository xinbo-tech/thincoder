# ThinCoder v2 架构设计：团队记忆

> 依据：REQUIREMENTS.md（v2 决策已全部收口）。在 v1 代码基础上扩展，不推翻任何已有模块。
> 约束不变：纯 mjs、无构建、Node >= 24、零 npm 依赖。

## 记忆层级（全部"有就查、没有就跳过"）

```
Team（可选，独立 git 仓库）──┐
Project（.thincoder/memory/）─┼─→ 统一检索（FTS5 + 向量 + RRF）
Personal（v1 sqlite）─────────┘
Session（对话内上下文，现有逻辑不变）
```

- **Personal**：v1 已有，sqlite 条目，不动
- **Project**：项目仓库内 `.thincoder/memory/*.md`。ThinCoder **只写文件，绝不替用户的项目仓库做 commit**——用户按自己的工作流提交
- **Team**：独立记忆仓库，clone 到 `~/.thincoder/teams/<name>/`。这是 ThinCoder 自管的专用设施，**可以**自动 commit + push。未配置则整层禁用

## 新增/修改模块

### markdown.mjs（新增，~80 行）

frontmatter 解析与序列化，零依赖。

```js
export function parseEntry(text)      // → { meta: {type,title,tags,author,created}, content }
export function serializeEntry(meta, content) // → markdown 文本
export function slugify(title)        // 文件名用 slug
```

条目文件格式：

```markdown
---
type: rule | knowledge | decision | pattern
title: 条目标题
tags: [tag1, tag2]
author: 提交人（git config user.name 兜底）
created: 2026-07-24
embedding: BAAI/bge-m3    # 生成向量用的模型；与配置不一致时触发向量重建
---

正文（markdown，任意长度）
```

文件名：`YYYYMMDD-<slug>-<rand4>.md`（条目级文件隔离，消灭 99% 合并冲突）。

### embedding.mjs（新增，~60 行）

OpenAI 兼容 `/v1/embeddings`，复用 provider.mjs 的 fetch/重试模式。

```js
export function createEmbedder(config)                    // { baseURL, apiKey, model }
export async function embed(embedder, texts)              // → Float32Array[]
export function cosine(a, b)                              // Float32Array 点积（已归一化）
```

默认配置指向 SiliconFlow `BAAI/bge-m3`（免费额度，中文好）；Ollama 本地为离线备选。

### gitmem.mjs（新增，~150 行）

Team 层的 git 同步。所有 git 操作用 `child_process` 调系统 git，不引库。

```js
export async function ensureClone(teamConfig)   // 不存在则 git clone
export async function sync(teamDir)             // pull --rebase → 返回 { oldHash, newHash }；冲突抛带指引的错误
export async function putAndPush(teamDir, filename, markdown, message)
   // 写文件 → git add+commit → push；push 被拒则 pull --rebase 后重试一次，再失败报错
```

冲突策略（已定）：不同条目天然不冲突；同条目冲突时报错"请到 `<teamDir>` 手动解决后运行 sync 重试"，不做自动合并。

### memory.mjs（扩展，不重写）

v1 的接口签名全部保留。新增：

```js
// 索引 markdown 层（project/team 共用一张表）
export async function indexMarkdown(memory, { layer, dir, files })  // 增量：指定文件列表
export async function reindexAll(memory, layers)                    // 全量重建
export async function removeLayer(memory, layer)                    // 某层整体下线
```

sqlite schema 演进（user_version → 3）：

```sql
CREATE TABLE files (          -- markdown 层条目
  layer TEXT NOT NULL,        -- 'project' | 'team'
  path TEXT NOT NULL,         -- 相对路径，(layer, path) 唯一
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  embedding BLOB,             -- Float32Array 序列化，NULL = 未生成
  seg_title TEXT NOT NULL DEFAULT '',
  seg_content TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);
CREATE VIRTUAL TABLE files_fts USING fts5(seg_title, seg_content, tokenize='unicode61');
-- personal 的 entries 表加 embedding BLOB 列，同步触发器不变
```

检索合并（search 升级）：

1. FTS5 对 `entries`（personal）和 `files`（project+team）各查一次，得两组 BM25 排名
2. 有 embedder 配置时：查询向量与所有条目的 embedding 暴力余弦（Float32Array，万条级毫秒），得向量排名
3. **RRF 合并**：`score = Σ 1/(60 + rank_i)`，跨层统一排序
4. 结果带 `layer` 标记（personal/project/team），TUI 展示来源

后台惰性 embedding：put/index 时向量留 NULL；search 时发现 NULL 条目才批量补算并落库（首次慢、后续零成本；换模型时按 frontmatter 的 `embedding` 字段强制重建）。

### agent.mjs（小改）

- `memory_put` 工具加可选参数 `scope: personal | project | team`（默认 personal；team 未配置时拒绝并提示）
- system prompt 补充层级说明：团队规范优先于个人记忆

### bin（新命令）

```
thincoder sync              # team 层 pull --rebase + 增量索引
thincoder reindex           # 全量重建索引（含向量）
thincoder distill           # 从当前会话提取候选条目，逐条 y/n 后按 scope 写入
```

### config 扩展

```jsonc
{
  "embedding": {
    "baseURL": "https://api.siliconflow.cn/v1",
    "apiKey": "...",
    "model": "BAAI/bge-m3"
  },
  "memory": {
    "dbPath": "~/.thincoder/memory.db",
    "projectDir": ".thincoder/memory",       // 相对项目根
    "team": {                                 // 可选，不配则 Team 层禁用
      "name": "myteam",
      "repo": "git@github.com:org/team-memory.git",
      "dir": "~/.thincoder/teams/myteam"
    }
  }
}
```

### distill（M9 细化）

流程：
1. 取当前会话 history（TUI 内）或指定会话文件
2. LLM 用专门 prompt 产出候选条目 JSON 数组：`[{type, title, content, tags, scope}]`
3. 逐条展示，用户 y/n/e（编辑）确认；rule 类默认提示"规范建议手动写，确认提取？"
4. 确认后按 scope 走 put 流程（team 层走 putAndPush）

## 里程碑

| 里程碑 | 内容 | 验证标准 |
|---|---|---|
| M6 | markdown.mjs + Project 层（写入/索引/合并检索） | 在项目 `.thincoder/memory/` 放 .md，agent 能搜到并与 personal 结果合并排序 |
| M7 | embedding.mjs + 向量列 + RRF 混合检索 | 用语义不同但字面不同的查询（如"规范" vs 条目"风格"）能命中；FTS-only 与混合结果对比合理 |
| M8 | Team 层（clone/sync/putAndPush/增量索引/冲突报错） | 两个本地 clone 模拟两人：同时写不同条目无冲突同步成功；改同一条目冲突时给出手动指引 |
| M9 | distill 命令 + TUI `/distill` | 真实会话提取候选，y/n 流程可用，写入对应层 |

老规矩：每个里程碑当场真实验证，不留没跑过的代码。

## 明确排除

- 自动合并冲突、"保留双方"策略
- 会话结束全自动沉淀（distill 必须人工触发、人工确认）
- 向量数据库（sqlite BLOB + 暴力余弦在万条级够用；百万级再议 pgvector）
- 服务端组件（同步全部走 git）

## TUI 斜杠命令系统（v0.7+）

所有需要用户选择的选项统一使用列表游标选择器（↑↓ 移动 / Enter 确认 / Esc 取消），不再要求用户记忆和输入子命令参数。

### 通用选择器

```js
// 打开选择器（Promise 式，选中即关闭）：entries 含 { type:"header"|"item", text, ...extra }，
// resolve 选中条目（含 extra 字段透传），Esc/取消 → null
const entry = await showPicker(title, entries, { defaultIndex? })

// 关闭所有 picker：清空栈，挂起者全部 resolve(null)
closePicker()
```

选择器为栈结构：`state.pickerStack`，`state.picker` 始终指向栈顶。`showPicker` 入栈前有互斥保护（挂起的旧 picker 全部 resolve(null)，消除 Promise 悬挂）；嵌套菜单用顺序 `await`（上一层返回后再开下一层），子菜单 Esc 返回 null 由调用方 while 循环重开主菜单。键盘处理统一在输入循环中：↑↓ 循环移动、PgUp/PgDn 翻页、Home/End 跳首尾、可打印字符进入 `picker.filter`（大小写不敏感子串过滤，Backspace 删除）、Enter 选中过滤后列表的当前项并关闭、Esc/Ctrl+C 取消当前层。

### 需要文本输入的操作

选中操作后若需用户输入文本（如 goal 描述、provider 名称+URL、API key），通过 `askQuestion(prompt)` 弹出文本输入提示，用户键入后 Enter 提交。这复用了已有的 question 机制。

### 命令一览

| 命令 | 选择器内容 |
|------|----------|
| `/model` | 各 provider 下所有模型列表（异步拉取远端） |
| `/think` | 思维模式：开启 / 关闭；推理强度：low / high / max |
| `/session` | 归档槽位列表（含日期），选中即切换 |
| `/restore` | 存档点列表（含时间），选中即回滚 |
| `/goal` | 操作菜单：设置（弹出文本输入）/ 取消 / 查看详情 |
| `/mcp` | 操作菜单：查看 / 添加（弹出文本输入）/ 移除（选服务器） / 重连（选服务器） |
| `/provider` | 操作菜单：查看 / 添加（弹出文本输入）/ 移除（选 provider） / 配 key（选 provider → 弹出输入） |
| `/config` | 操作菜单：查看 / 设置 embedding key（弹出输入） / 高级设置（弹出输入） |
| `/plan` `/auto` `/clear` `/new` `/exit` `/help` `/reindex` `/init` `/skills` `/distill` | 无选项，直接执行 |
