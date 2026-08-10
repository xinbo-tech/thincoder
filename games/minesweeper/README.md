# 扫雷（终端版）· Minesweeper

零依赖终端扫雷：纯 Node.js（>= 24）标准库实现，无任何 npm 依赖、无构建步骤。
建议在 Windows Terminal / iTerm2 / VS Code 终端等支持 ANSI 的终端中游玩。

## 运行

```bash
node main.mjs                # 入门 9×9 · 10 雷
node main.mjs expert         # 专家 30×16 · 99 雷（intermediate = 16×16 · 40）
node main.mjs 16 16 40       # 任意尺寸（宽 高 雷数）
node main.mjs 12 12 25 --seed 42   # 固定种子，可复现同一布局
```

## 操作

| 按键 | 动作 |
| --- | --- |
| 方向键 / WASD / HJKL | 移动光标 |
| 空格 | 翻开当前格 |
| F | 插旗 / 拔旗 |
| 回车（或 C / X） | 双击展开（chord）：旗数等于数字时翻开周围未插旗的格 |
| R | 重新开局（同尺寸；指定 `--seed` 则同一布局） |
| Q / Esc / Ctrl+C | 退出 |

## 脚本模式

非 TTY 环境（管道 / CI）自动进入脚本模式，也可用 `--script` 显式指定。
每行一条指令，`#` 开头为注释，行列从 0 开始：

```bash
echo -e "r 4 4\nf 3 3" | node main.mjs 9 9 10
node main.mjs --script moves.txt
```

```
r 0 0    # 翻开 (0,0)
f 3 3    # 插旗 (3,3)
c 1 1    # 在 (1,1) 双击展开
```

脚本结束后的退出码：`0` 胜利、`1` 踩雷、`3` 游戏未结束、`2` 用法错误。
每步之后都会打印棋盘；用 `--seed` 可固定布局以便调试。

## 测试

```bash
npm test
```

## 实现要点

- `src/game.mjs` —— 纯逻辑，棋盘为扁平数组（`r * width + c`）。雷在**首次翻开时**才布置，
  保证第一击永远安全（经典规则）；mulberry32 确定性伪随机数实现 `--seed` 复现。
  翻开使用迭代式洪水填充（无递归，100×100 也不会爆栈）。
- `src/render.mjs` —— 渲染：ANSI 彩色棋盘 + 光标反显，TUI 与脚本模式共用。
- `src/tui.mjs` —— 交互：raw 模式键盘输入、全屏重绘、每秒计时刷新。
- `main.mjs` —— 入口：参数解析（预设 / 尺寸 / seed / 脚本）。
- 布局注入：`new Minesweeper({ mineLayout: [索引...] })` 可手工指定雷位，供测试与自定义棋盘使用。

## 目录结构

```
games/minesweeper/
  main.mjs              入口
  src/game.mjs          核心逻辑
  src/render.mjs        棋盘渲染
  src/tui.mjs           终端交互
  test/                 node:test 测试
  README.md
```
