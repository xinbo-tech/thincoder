#!/usr/bin/env node
// 仓根便捷启动器（convenience launcher）。
//
// 为什么有这个档：合并仓之后 CLI 产品树住进了 thincoder-cli/，
// 从工作区起步的路径变成了 d:\teamcode\thincoder\thincoder-cli\bin\ —— 嵌套太深。
// 本档只是转发：真正的入口仍在产品树里（唯一权威源），本档不含任何逻辑。
//
// 用法（在仓根）：
//   node bin/thincoder.cjs            # 启动 TUI
//   node bin/thincoder.cjs --version
//   node bin/thincoder.cjs --help
//
// 转发方式：同进程动态 import —— argv / cwd / 环境变量原样传给真正的入口。

import("../thincoder-cli/bin/thincoder.mjs")
