@echo off
rem desktop-debug.cmd — 带 CDP 调试旗启动桌面实例（内存取证用）
rem 用法：双击或 `thincoder\scripts\desktop-debug.cmd`
rem 起来后父侧探针：node scripts/desktop-mem-probe.mjs
cd /d "%~dp0..\thincoder-desktop"
rem 绝对路径启动：产品身份判据读 cmdline 的 thincoder-desktop 段（相对路径形会判成非本产品）
"%CD%\node_modules\electron\dist\electron.exe" --remote-debugging-port=9222 --remote-allow-origins=* .
