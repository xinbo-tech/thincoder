# CLI 命令入口（CLI-ENTRY）· CLI 面 · 设计

> 板块 = **CLI 命令入口**——`thincoder` 可执行面对使用者的**命令词面**：argv 命令树（命令 / 子命令 / 旗标）· 分发 · `USAGE` · shell 补全脚本发射。
> 配对需求档 = `docs/cli/requirements/FEATURES.md`（§2.13 对外文档契约面 + §3 N9——命令 · 子命令 · 旗标「文档说得到、敲得通」的判据句；层归属不对称：机制设计住本档）。
> 对位档 = **无**（VSC 端无 argv 命令面——结构性不对称，P2 产品面 ⇒ 落 `docs/cli/`）。
> 建档：2026-09-25（**cli-small-items 批 · 台账 #350 命令入口面载体收口**——承设计评审轮 1 发现 11：命令入口面设计档归属缺位 = 本册指定的收口）。
> 论域文件 = `thincoder-cli/bin/thincoder.mjs`（`USAGE` 常量 + `switch (command)` 分发族）· `thincoder-cli/src/completions.mjs`（三套补全脚本发射）。行数口径 = `wc -l`；读数 as-of 2026-09-25 设计轮实读（仓根 = `thincoder/`）。

## 1. 定位与边界

- **承载**：命令词面——命令树（有哪些命令 / 子命令 / 旗标）· 分发结构（`switch (command)` 族）· `USAGE` 对外文本 · 补全脚本三套发射（bash / zsh / fish）。
- **不承载**（D2——单一权威源，各面各有其主）：
  - 单命令**行为契约**（解析之后的执行语义）= 该命令所属板块设计档：`memory` → `docs/core/design/MEMORY.md` · `session gc` / `session index` → `docs/core/design/SESSION.md` · `ledger` → `docs/core/design/LEDGER.md` · `acp` → `docs/cli/design/ACP-CLIENT.md` · `chat` → agent 循环族档。本档只给词面（树形 / 旗标名 / 发射形态）。
  - **档位（行数）登记** = `docs/cli/design/CLI-DEBT.md`（本档不另设读数面）。
  - 补全面**缺口**在册 = `docs/cli/design/CLI-DEBT.md` §3 尾项 T1 / T2 / T3（本档只给契约，不复制缺口清单）。
- 入口链 = `thincoder-cli/bin/thincoder.cjs`（CJS shim）→ `thincoder-cli/bin/thincoder.mjs`（分发主体）。
- 与 `docs/cli/design/TUI-COMMANDS.md` 的分界：后者 = TUI 内 **slash 命令层**；本档 = **argv 命令层**（进程级）。

## 2. 命令树与旗标（as-of 2026-09-25 实读）

命令树权威 = `USAGE` 常量 + 各 `case` 分发与子命令 usage 行；核侧命令的解析面 = 该命令实现档（表「实装源」列）。**本表 = 补全面与机检面共同的词表基准**。

| 命令 | 子命令 | 旗标 / 位置参（实装面） | 实装源 |
|---|---|---|---|
| （无参）· `tui` | —— | ——（无参 = TUI 默认路径） | `bin/thincoder.mjs` |
| `chat` | —— | `--auto` + 位置参 prompt | `bin/thincoder.mjs` |
| `acp` | —— | `--login` | `bin/thincoder.mjs` |
| `memory` | `list` | `--type=<t>` | `src/cli/memory-command.mjs` |
| | `search` | 位置参 query | `src/cli/memory-command.mjs` |
| | `put` | `--type=` · `--title=` · `--content=` · `--tags=` | `src/cli/memory-command.mjs` |
| | `remove` | 位置参 uid | `src/cli/memory-command.mjs` |
| | `sweep` | `--origin <o>`（空格形 / `=` 形）· `--dry-run` / `--confirm`（互斥；缺省干跑） | `src/cli/memory-command.mjs`（`parseSweepArgs`） |
| `sync` | —— | —— | `bin/thincoder.mjs` |
| `reindex` | —— | —— | `bin/thincoder.mjs` |
| `distill` | —— | `--yes` · `--layer=<s>` + 位置参 file | `src/cli/distill-command.mjs` |
| `session` | `gc` | `--dry-run` · `--confirm <hash>` · `--confirm --all` | `thincoder-core/session-gc.mjs` |
| | `index` | `--status` / `--rebuild`（互斥；无参 = `--status`） | `thincoder-core/session-index-cmd.mjs` |
| `ledger` | `migrate` | `--dry-run` / `--confirm`（互斥）· `--from <key>`（可重复） | `thincoder-core/ledger-migrate.mjs` |
| | `audit` | `--root <dir>`（可重复） | `thincoder-core/ledger-migrate.mjs` |
| `upgrade` | —— | —— | `bin/thincoder.mjs` |
| `completion` | —— | 位置参 shell（`bash` / `zsh` / `fish`） | `src/completions.mjs` |
| `-h` / `--help` · `-v` / `--version` | —— | —— | `bin/thincoder.mjs` |

**核侧实现 = 壳侧只分发**（`session` / `ledger` 两族）——旗标语义（互斥 / fail-closed 面）住核档。

## 3. shell 补全发射契约

- **发射面** = `printCompletion(shell)`（`thincoder-cli/src/completions.mjs`）；`completion` 分支在 `bin/thincoder.mjs` 分发（非法 shell ⇒ usage + 退出 1）。
- **横深对齐**：三套脚本须覆盖 §2 表内旗标词面——**现状不齐**（缺口在册 = `docs/cli/design/CLI-DEBT.md` §3 尾项 T1 / T2）。
- **bash 源文本形 vs 发射字节形**（防改形漂移；同族各分支行逐字节同形）：
  - 源档形（写入 `completions.mjs` 模板字面量内——**两反斜杠**）：`\\$(compgen -W "<词表>" -- "\\$cur")`
  - 发射形（`thincoder completion bash` 输出——**单反斜杠**）：`\$(compgen -W "<词表>" -- "\$cur")`
  - 判据 = 与同族既有分支行（`chat` / `memory` 子命令与旗标 / `distill` / `completion` / 顶层词表行）同形；断言面 = 机检形 MS-2 的字节断言（§4）。
- **测试沙箱纪律**：任何驱动 `node bin/thincoder.mjs …` 的子进程用例须以临时目录作 `HOME` / `USERPROFILE`（先例 = `thincoder-cli/test/session-gc-cli.test.mjs` 沙箱段）——入口无条件 `prepareCrashReporting()`（mkdir + 30 天 purge）⇒ 无沙箱会**真触** `~/.thincoder/crash-reports/`。**禁触真实 `~/.thincoder`**。

## 4. 机检形（#350 契约）

**宿主** = `thincoder-cli/test/memory-sweep-cli.test.mjs`（拟新增——CLI 两层 glob 自动收集，零登记）。三例：

- **MS-1 · 源码 token 机检**：读 `bin/thincoder.mjs` + `src/cli/memory-command.mjs` 源文本，断言 `case "memory"` 分发面 · `case "sweep"` 分支 · `SWEEP_USAGE` 行 · 三旗标 token。
  **耦合义务**：命令分发表外提（触发在册 = `docs/cli/design/CLI-DEBT.md` §2.1 A4）执行批**须同批**改本读取面（锁点随分发落点走；不改即红）。
- **MS-2 · 三套横深机检**：子进程驱动 `node bin/thincoder.mjs completion <shell>`（**沙箱 env**：`HOME` / `USERPROFILE` → 临时目录）；三套输出各含 sweep 三旗标 token（fish 形 = `-l origin` / `-l dry-run` / `-l confirm`）∧ 各含顶层 `ledger`；bash 套另断 §3 发射字节形段（锁改形漂移）。
- **MS-3 · 行为边界**：直引导出 `memoryCommand`（解析错分支零触库）——`--dry-run --confirm` 互斥 / 未知参 / `--origin=` 空 ⇒ 返回 1 + `SWEEP_USAGE`（stderr）。
- **射程**：本三例 = **窄射程锁**（sweep 旗标 + 顶层 `ledger` 词）；**全量锁缺位**（其余命令 / 旗标补全面无锁）= `docs/cli/design/CLI-DEBT.md` §3 尾项 T3（在册）。
- **禁散文锚**：三例全为源码 / 输出 token 结构机检。

## 5. 边界（本档不做）

- 不做命令行为设计（住各命令所属板块档——§1）；不做档位登记（住 `docs/cli/design/CLI-DEBT.md`）。
- 不设常驻机检门（全量锁缺位在册——§4 射程）；不代裁需求面（`docs/cli/requirements/**` = 主 agent 笔）。
- 判据源 = 实装面 + 各批裁定（补全面 / 机检形逐条注实装源——§2 / §4）。

## 变更记录

- 2026-09-25（**cli-small-items 批 · 台账 #350 命令入口面载体收口**）：建档——承设计评审轮 1 发现 11（命令入口面设计档归属缺位）：① §2 命令树与旗标全集（as-of 实读 · 词表基准）；② §3 补全发射契约（源文本形 / 发射字节形 / 沙箱纪律）；③ §4 #350 机检形三例（含 A4 耦合义务）；④ §5 边界与缺口指针（`docs/cli/design/CLI-DEBT.md` §3 尾项 T1–T3）。
