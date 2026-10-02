@echo off
rem desktop-debug.cmd — 带 CDP 调试旗启动桌面实例（内存取证用）
rem 用法：双击或 `thincoder\scripts\desktop-debug.cmd`
rem 起来后父侧探针：node scripts/desktop-mem-probe.mjs
cd /d "%~dp0..\thincoder-desktop"
rem 绝对路径启动：产品身份判据读 cmdline 的 thincoder-desktop 段 ∥ electron\dist 路径段（#707 超集——相对形亦命中；绝对形照旧稳妥）
rem 端口 = 9224（2026-10-01 起——9222 被已退进程的孤儿 socket 占住，新实例绑口静默失败；待重启清除后可改回）；--inspect=9225 = 主进程 Node 调试口（假死测量主进程面——focus-probe main-arm）
"%CD%\node_modules\electron\dist\electron.exe" --remote-debugging-port=9224 --inspect=9225 --remote-allow-origins=* .
