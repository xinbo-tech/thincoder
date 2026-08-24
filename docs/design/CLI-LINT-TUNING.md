# CLI Lint 引入 — 设计（CLI）

> 状态：**已实现**（2026-08-25 评审修订后实施；0 error 达成，668 测试全绿（普通模式直接实施））
> 需求：`docs/design/CLI-LINT-REQUIREMENTS.md`
> 关联：`docs/design/README.md`（文档地图）；规则基线参考 thincoder-vscode `eslint.config.mjs`

## 1. 问题陈述（Problem Statement）

| # | 现状 | 证据 | 后果 |
|---|---|---|---|
| P1 | CLI 无 lint：无 eslint 配置、package.json 无 lint script、无 eslint devDeps | `dir .eslintrc* eslint.config.*` 无匹配；scripts 仅 `test`/`prepublishOnly` | 风格漂移只能靠 review 抓（2026-08-25 实例：两端 MAX_RESULT_CHARS 断言方式分叉，覆盖率批次才发现） |
| P2 | dry-run（借用 vscode 规则）暴露 21 error / 78 warning | `no-undef` 4（`performance`×4、`setImmediate`×2——Node 全局未在 globals 声明）、`no-useless-assignment` 8（死赋值）、`preserve-caught-error` 9（catch 后 new Error 丢 cause） | error 级问题真实存在但无门禁拦截 |

## 2. 解决方案（Solution Approach）

### 2.1 新增 `eslint.config.mjs`（P1）

基于 vscode 版派生，globals 适配纯 Node（无浏览器/webview 全局）：

```js
import js from "@eslint/js"

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        // Node.js（含 Node 18+ 全局）
        process: "readonly", console: "readonly", Buffer: "readonly",
        TextDecoder: "readonly", TextEncoder: "readonly", URL: "readonly",
        fetch: "readonly", Headers: "readonly", Response: "readonly", Request: "readonly",
        AbortSignal: "readonly", AbortController: "readonly", DOMException: "readonly",
        FormData: "readonly", URLSearchParams: "readonly", WebSocket: "readonly",
        ReadableStream: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly",
        setImmediate: "readonly", clearImmediate: "readonly", // memory/code-index.mjs、tools/repomap.mjs
        performance: "readonly", // tui/agent-turn.mjs、tui/render-loop.mjs（Node 全局）
        queueMicrotask: "readonly", structuredClone: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-constant-condition": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-cond-assign": "warn",
      "no-redeclare": "warn",
      "no-fallthrough": "warn",
      "no-useless-escape": "warn",
      "no-control-regex": "warn",
    },
  },
  {
    ignores: ["node_modules/**"],
  },
]
```

- 与 vscode 版差异：仅 globals（去 webview 浏览器全局，加 Node 定时器/performance 等）；规则集逐字一致（N1）。
- 注：vscode dry-run 里出现的 `no-useless-assignment`/`preserve-caught-error` 来自新版 `@eslint/js` recommended——CLI 装最新版（`eslint@^9` + `@eslint/js@^9`）自然继承同规则。

### 2.2 package.json（P1）

- `scripts.lint = "eslint src"`。
- `devDependencies`：`eslint@^9.0.0`、`@eslint/js@^9.0.0`（与 vscode 的 devDeps 做法一致，零运行时依赖不破）。
- `prepublishOnly` 不接 lint（保持现状仅跑测试——避免发布路径新增卡点；lint 由开发流程使用）。

### 2.3 Error 修复（P2，21 个）

| 类别 | 数量 | 位置 | 修法 |
|---|---|---|---|
| no-undef（globals 缺失） | 6 | `tui/agent-turn.mjs:194/263`、`tui/render-loop.mjs:39/45`（performance）；`memory/code-index.mjs:145`、`tools/repomap.mjs:171`（setImmediate） | **配置解决**（2.1 globals 声明），代码不动 |
| no-useless-assignment | 8 | `advisor/repos.mjs:52`×2、`:156`；`agent/dispatch.mjs:52`；`git/checkpoint.mjs:327`×2；`memory/core.mjs:201`；`tui/layout.mjs:64`；（`cmd-think.mjs:66-68` 为 warning 不动） | 删除死赋值（值未被读取即被覆盖/返回）；逐个人工确认非副作用表达式后删除 |
| preserve-caught-error | 9 | `config.mjs:238`、`git/checkpoint.mjs:32`、`git/gitmem.mjs:58`、`tools/file.mjs:264`、`tools/system.mjs:342/442`、`tools/web.mjs:190` | catch 块内 `new Error(msg)` 补第三参 `{ cause: e }`——错误链可追溯，行为不变（message 不改） |

- 修复原则：**只动 error 级**；warning 全部保留（N3）。`no-useless-assignment` 逐个核对源码上下文，确认赋值右侧无函数调用副作用才删。

### 2.4 明确不做

- 78 个 warning 不清理（未用 import/变量一刀切风险大；TUI `\x1b` 控制字符正则是本质需求——warning 不阻塞即可）。
- CI 接入、prepublishOnly 接 lint、`test/` 目录 lint（vscode 端 lint 含 test，CLI 后续批次对齐）。

## 3. 受影响文件（Affected Files）

| 文件 | 动作 | 内容 |
|---|---|---|
| `eslint.config.mjs` | 新增 | §2.1 配置 |
| `package.json` | MODIFY | lint script + eslint/@eslint/js devDeps |
| `src/advisor/repos.mjs` | MODIFY | 删 3 处死赋值 |
| `src/agent/dispatch.mjs` | MODIFY | 删 1 处死赋值 |
| `src/git/checkpoint.mjs` | MODIFY | 删 2 处死赋值 + 1 处补 cause |
| `src/memory/core.mjs` | MODIFY | 删 1 处死赋值 |
| `src/tui/layout.mjs` | MODIFY | 删 1 处死赋值 |
| `src/config.mjs` | MODIFY | 补 1 处 cause |
| `src/git/gitmem.mjs` | MODIFY | 补 1 处 cause |
| `src/tools/file.mjs` | MODIFY | 补 1 处 cause |
| `src/tools/system.mjs` | MODIFY | 补 2 处 cause |
| `src/tools/web.mjs` | MODIFY | 补 1 处 cause |
| `docs/design/CLI-LINT-REQUIREMENTS.md` | 新增 | 本批文档 |
| `docs/design/CLI-LINT-TUNING.md` | 新增 | 本批文档 |
| `docs/design/README.md` | MODIFY | 地图注册 |

## 4. 验收标准（Acceptance Criteria）

| # | AC | 验证方式 |
|---|---|---|
| AC1 | `npm run lint` 存在且 `npx eslint src` **0 error**（warning 允许） | 命令输出 |
| AC2 | 21 个 error 全部消除：no-undef 6（globals）、no-useless-assignment 8（删）、preserve-caught-error 9（补 cause） | lint 输出无 error 行 |
| AC3 | `node --test test/*.test.mjs` 全套通过（668 基线不回归） | 命令 |
| AC4 | 补 cause 的 9 处：`new Error(..., { cause: e })` 且原 message 不变 | git diff 逐处核对 |
| AC5 | 删死赋值的 8 处：赋值右侧无函数调用（无副作用） | git diff 逐处核对 |
| AC6 | `package-lock.json` 更新（devDeps 安装）且 `dependencies` 仍为 `{}` | git diff |
