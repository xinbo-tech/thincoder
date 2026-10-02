# Changelog

All notable changes to ThinCoder Desktop are documented here.

## [0.10.1] — 2026-10-01

> 首发（桌面端新号段 —— CalVer 各端同制，单源 = `../docs/RELEASE.md` §4）

### Added

- **Windows 安装包（NSIS · x64）**：`electron-builder.yml` 打包链落定——`prepackage` 两核包物化（`scripts/materialize-deps.mjs`）→ `electron-builder` → `postpackage` 产物校验（`scripts/check-dist.mjs`= 闸）；产物名 = `ThinCoder-Setup-0.10.1.exe`（版本单源 = `package.json`）。
- **签名就绪**：证书（GlobalSign EV · eToken 5300）在位 ⇒ 构建期实签（PowerShell `Set-AuthenticodeSignature` 主载体 ∥ `signtool` 备 · RFC3161 取时）；缺席 ⇒ 跳过并明示（构建零失败）。
- **图标资产**：`build/icon.ico`（16 ∕ 32 ∥ 48 ∥ 256 多尺寸）——零依赖生成器 `scripts/make-icon.mjs`（圆角方块 `#2563eb` + `</>` 白字形，与站点 favicon 同品牌）。
