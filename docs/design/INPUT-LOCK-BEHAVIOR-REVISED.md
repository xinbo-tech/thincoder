# INPUT-LOCK busy 行为修订（INPUT-LOCK-BEHAVIOR-REVISED）

> 板块：主会话输入门禁（双端——INPUT-LOCK-ASYNC 已交付核销——本修订改其行为）。权威源：INPUT-LOCK-ASYNC（门禁机制——已核销）+ 本修订。
> 状态：**设计待评审**——2026-09-09 落档（用户反馈修订——对已交付设计的体验修正）。需求：TODO INPUT-LOCK busy 行为修订（用户裁：允许录入不禁输入框——只禁 send——斜杠白名单删——忙时斜杠也禁——纯一致禁发）。

---

## 需求

- **总体目标**：修 INPUT-LOCK 交付的行为过度——① busy 时输入框**不禁用**（允许继续录入回显——VSC readOnly 锁 = 过度）——只 **send/Enter 禁发**；② **斜杠命令白名单删除**（busySafeCommand/BUSY_SAFE_COMMANDS = 过度设计）——忙时斜杠同禁发（纯一致——/exit 也发不出——退出靠 Ctrl+C 终端层紧急通道）。
- **功能性**：
  - F-1（VSC 不禁录入）busy 锁改：readOnly 移除（可打字回显）——send 禁保留（send.js 出口守卫——回车/发送按钮拒——占位符文案改"输入中——主会话处理中——Enter 提交禁用"）
  - F-2（CLI 白名单删）BUSY_SAFE_COMMANDS/busySafeCommand 机制删（index.mjs + key-handler.mjs）——斜杠命令忙时同走提交吞（白名单直执行分支删）
  - F-3（测试更新）INPUT-LOCK 测试族——白名单直执行测删/改禁发测 + VSC busy 锁测改（readOnly 移除 → 可录入 + send 禁断言）
  - **范围边界**：门禁判据（busy = processing/_turnState running）零动；Ctrl+C/Ctrl+I 终端层紧急通道保留（key-handler 门禁前——与白名单无关）；CLI 提交吞 + 字符回显保留（已允许录入——只删白名单）；VSC 中断模态豁免（_interruptMode——Ctrl+I 注入）保留——不禁录入后 readOnly 相关豁免面重查。

## 设计（行为修订——照做勿自行解释）

### 1. F-1 VSC 不禁录入（loading.js/input.js + send.js）
- `webview/loading.js` applyBusyLock：readOnly 锁**移除**（`inputEl.readOnly = false`——可打字）——busy 占位符文案改（"主会话处理中——Enter 提交禁用——可继续输入"）
- `webview/send.js` send() 出口守卫**保留**（busy 拒发——Enter/发送按钮——文本保留输入框不吞）
- `webview/input.js` 中断模态豁免（enterInterruptMode 解锁）——readOnly 移除后豁免面变（input 不禁——Ctrl+I 通道仍放行——重查豁免是否还需）
- 测试：busy 时输入框可打字（readOnly false）+ Enter 拒发（send 守卫）+ 文本保留

### 2. F-2 CLI 白名单删（index.mjs + key-handler.mjs）
- index.mjs：BUSY_SAFE_COMMANDS 定义 + busySafeCommand 注入删
- key-handler.mjs：L265 门禁——白名单检查分支删（`ctx.busySafeCommand` 直执行删）——斜杠忙时同走提交吞
- 测试：白名单直执行测删——忙时斜杠也吞测（/exit 忙时 Enter → 吞——不发）

### 3. F-3 测试族更新（双端 INPUT-LOCK 测试）
- CLI input-lock.test.mjs：白名单直执行断言删/改禁发；busy 斜杠吞测
- VSC webview-turnstate.test.mjs：readOnly 锁断言改（可录入 + send 禁）——applyBusyLock 行为更新

## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| webview/loading.js | VSC | 62 | ≤-3 | F-1 readOnly 移除 + 占位符改 |
| webview/send.js | VSC | 53 | ≤+1 | F-1 守卫确认（已有——小） |
| webview/input.js | VSC | 135 | ≤-5 | F-1 豁免面重查（readOnly 移除后） |
| webview/chat.js + locales（占位符文案） | VSC | ~320 | ≤+2 | F-1 文案 |
| src/tui/index.mjs | CLI | 449 | ≤-5 | F-2 BUSY_SAFE_COMMANDS 删 |
| src/tui/key-handler.mjs | CLI | 443 | ≤-8 | F-2 白名单分支删 |
| test/（input-lock + webview-turnstate 族） | 双端 | 既有 | ±10 | F-3 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 VSC 可录入 | busy 时打字 | 输入框可编辑回显——F-1 |
| F-1 VSC send 禁 | busy 时 Enter/发送 | 拒发——文本保留输入框——F-1 |
| F-1 空闲恢复 | 回合结束 | send 恢复——F-1 |
| F-2 白名单删 | 忙时 /exit | 同提交吞——不发（白名单直执行删）——F-2 |
| F-2 Ctrl+C | 忙时 Ctrl+C | 终端层紧急退出保留（门禁前）——F-2 |
| F-3 测试更新 | 双端测试跑 | 白名单测删 + 禁发测绿——F-3 |

## 验收

- AC-1 VSC busy 可录入（readOnly false——打字回显——测试锁）
- AC-2 VSC busy send 禁（Enter 拒发——文本保留——测试）
- AC-3 CLI 白名单零残留（grep busySafeCommand/BUSY_SAFE_COMMANDS 双端零）
- AC-4 忙时斜杠禁发（/exit 忙时吞——测试）
- AC-5 双端 npm test 快层零回归（INPUT-LOCK 测试族更新——门禁判据零动）
- 红线：门禁判据（busy 语义）零动；Ctrl+C/Ctrl+I 终端层通道保留；CLI 提交吞 + 字符回显保留；单槽/释放窗口机制不动（只改 busy 输入面）

## 变更记录
- 2026-09-09：落档（用户反馈——INPUT-LOCK 交付行为过度：VSC readOnly 锁禁录入 + CLI 白名单——修订为允许录入只禁 send + 白名单删 + 忙时斜杠也禁（用户裁纯一致——退出靠 Ctrl+C）——已核销设计新范围走新评审链）。
