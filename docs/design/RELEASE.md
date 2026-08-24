# 发布流程(RELEASE)

> 归属:`thincoder` CLI 发布到 npm 的完整流程(规则基线参考 thincoder-vscode `docs/design/RELEASE.md`)
> 包名:`thincoder`(package.json `name` 字段)
> npm 发布者:`xinbo-tech`(已登录,`npm whoami` 验证)
> 仓库:Gitee `https://gitee.com/shanghai-xinbo/thincoder`(main 分支)

## 1. 发布前检查

- [ ] `node --test "test/*.test.mjs"` 全绿
- [ ] `npm run lint` 0 error(warning 允许)
- [ ] `CHANGELOG.md` 已更新新版本条目(Keep a Changelog 格式,中文,Added/Changed/Fixed/Removed 分节)
- [ ] `package.json` version 已 bump

## 2. 发布

```bash
cd thincoder

# bump(patch/minor 自行判断;本次改动含新功能用 minor,纯修复用 patch)
# 手动改 package.json 的 version 字段

git add package.json CHANGELOG.md
git commit -m "release: vX.Y.Z"      # 历史惯例:release commit 消息格式 "release: v0.12.43"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z

npm publish                          # prepublishOnly 自动跑全套测试
```

## 3. 验证

```bash
npm view thincoder version           # 应显示新版本
npm view thincoder time --json       # 发布时间戳确认
```

## 4. 踩坑记录

### 4.1 vsce 的 patch 自动 bump(2026-08-25,vscode 端教训,CLI 同样适用)

`vsce publish patch` 会**自动再 bump 一次**版本——手动 bump 到 0.1.48 后执行 `publish patch` 实际发布 0.1.49,还自动创建了 bump commit,导致 tag 与 release commit 错位。
**规则:手动 bump + 直接 `vsce publish`(不带 patch/minor/major)**,让版本号完全由人控制。

### 4.2 Open VSX 异步激活(2026-08-25,vscode 端教训)

ovsx publish 返回 `🚀 Published` 后,**版本处于"已发布未激活"状态**(API 仍显示旧版本)。Open VSX 服务端异步扫描 malware,通过后自动激活——通常几分钟,**不是发布失败**。
诊断口诀:报错 "already published, but currently isn't active and not visible" = 扫描进行中,等待即可;真失败会报 Invalid access token 或明确错误。

### 4.3 ovsx 无 TTY 静默失败(2026-08-25)

`ovsx verify-pat` / `publish` 在无 TTY 环境下**输出被吞且 exit 0**——看起来成功实则什么都没做(与 vsce 的 `'y'` PAT 读取坑同源,见 vscode RELEASE.md §1.2b)。
**规则:ovsx 操作必须显式传 `--pat`**(真实 token 从环境变量 `OVSX_PAT` 读,不是 `OVSX_TOKEN`),并用 `execute`(node 直调 ovsx 内部 API)或事后 API 查询确认结果,不信任 CLI 的静默 exit 0。

### 4.4 npm prepublishOnly 是最后一道门

`npm publish` 自动执行 `prepublishOnly`(package.json 配置为全套测试)——测试不过发布中止,这是有意设计,不要绕过。

## 5. 回滚 / 问题

- **npm 不支持撤版**:发布后发现问题,修复后发补丁版本(如 0.12.44),或 `npm deprecate thincoder@X.Y.Z "message"` 标记废弃
- **发布失败重试**:npm publish 网络中断后可直接重试(同版本号已存在会报错,说明其实已成功——先 `npm view` 确认)
