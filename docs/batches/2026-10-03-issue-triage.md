# 2026-10-03 · issues 分诊与处置（gitee 23 ∥ github 11）
> 六段 append-only，一段一作者：§1 讨论（主 agent）· §2 批次任务与设计（eng-designer）· §3 设计评审（评审子代理）· §4 用户批准（主 agent）· §5 实施记录（eng-coder）· §6 验证与收口（父代理）。
> 编制：主 agent · 2026-10-03 · 来源 = 用户 2026-10-03 17:23「都得做」——全收 17:2x 提案：A 登账入池 ∥ B 平台回复（已修条目）∥ C issue 修复批；分诊轮 = 三线的共同前提。
> 台账 = 无单一编号（分诊轮——条目随分诊结果逐条登记，编号清单见 §1）。前情 = docs/batches/2026-10-03-release-0-10-2.md §6（已收口 2026-10-03）。
## §1 讨论（主 agent）
**状态行**：🔄 进行中（…）
<§1 模板占位：本批条目 / 关键判据 / 授权口径>

**§1 讨论（主 agent）——issues 分诊轮（gitee 24 ∥ github 11）**

- **来源/授权**：用户 2026-10-03 17:23「都得做」——全收 A（登账）∥ B（平台回复）∥ C（修复批）三线；本批 = 三线共同前提的分诊轮。
- **方法**：三路只读子代理并行分诊（gitee 近 12 ∥ gitee 早 11 + thincoder-vscode 1 ∥ github 11）；判词四值（Fixed / Live / Unclear / Feature-open）；「已修」须双证（源码坐标 ∥ CHANGELOG/批档/批内证据）。**过程事故**：宿主两次静默退出（#846），两路子代理各损失一次、已重发补全（github 路首发即达）。
- **结果总表**：35 条 = **已修 10 ∥ 仍存活 15 ∥ 存疑 4 ∥ 功能未做 6**。
  - gitee 近 12：Fixed 2（IKIQGK ∥ IKGRAN）∥ Live 6（IKJ8CI ∥ IKITDG ∥ IKH8X5 ∥ IKH6Q3 ∥ IKGBXT ∥ IKFARO）∥ Unclear 1（IKGSLA）∥ Feature 3（IKJKHH ∥ IKEI3M ∥ IKDWH7）
  - gitee 早 12：Fixed 8+①（IKF9AH ∥ IKEV9I ∥ IKC6IX ∥ IKD5XY ∥ IKEZ1C ∥ IKETT1 ∥ IKDCVV ∥ IKEOO0〔A+B〕∥ IKEV9H①）∥ Live 2（IKF649 ∥ IKF5Q0）∥ Unclear 1（IKALHO）
  - github 11：Live 7（#17 ∥ #16 ∥ #15 ∥ #11 ∥ #10 ∥ #9 ∥ #7）∥ Unclear 2（#14 ∥ #8）∥ Feature 2（#12 ∥ #13）
- **A 线（登账）**：台账 **#848–#875**（28 笔新增，含 2 笔追认核销 #851/#852）；事件类 = **#846**。全条目证据坐标在册（台账 evidence 栏）。
- **B 线（平台回复）**：已修条目回复草稿备齐（gitee 10 条 ∥ github 0 条——无整条已修）；**候用户过目放行后发**（发帖不可逆）。
- **C 线（修复批）**：Live 15 + Unclear 4 + Feature 6 待分组立批；**最高优先 = GitHub #16 族**（idle-watchdog `body.destroy` 未护 error ⇒ 进程被杀——2026-10-03 两次宿主静默退出强嫌疑，见 #846；上游 PR 未合并，补丁在手）。
- **旁证发现（随分录出）**：① 设计档与 ACP 官方 schema 相抵一处（`ACP-CLIENT.md:487/500`——收 #9 时同拍收正）；② `thincoder chat` 的 question 工具未过 `excludeTools`（`ACP-CLIENT.md:374` 自陈——同 IKEV9I 族未修，待核）。
- **本批不适用段**：§2/§3/§5（分诊轮 = 分析/账务轮——无设计/实施段）；§4 = 候 B 线放行与 C 线分组裁定。

## §2 批次任务与设计（eng-designer）
**状态行**：（eng-designer 写入时更新）
<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试面 / 验收对照 / 关键决策 / 上抛项>
## §3 设计评审（评审子代理）
## §4 用户批准（主 agent）

**§4 用户批准（主 agent 记录）——B 线发出**

- **批准**：用户 2026-10-03 20:31「那发」——批准按草稿原样发出（①–⑩ 回复+关单 ∥ ⑪ 仅回复）。
- **执行回执（实读）**：11 条评论全部落地（HTTP 201 逐条）；关单 10 条（终态复核 11/11：IKIQGK ∥ IKGRAN ∥ IKF9AH ∥ IKEV9I ∥ IKC6IX ∥ IKD5XY ∥ IKEZ1C ∥ IKETT1 ∥ IKDCVV ∥ IKEOO0 = **closed**；IKEV9H = open 如约）。
- **端点注记**：Gitee 企业仓 issue 状态更新经 `repos/...PATCH` = 404（`project or enterprise`）；改走 `enterprises/shanghai-xinbo/issues/<id>` = 200（与仓内脚本回退路一致；两路 GET 的 html_url 逐字同——同一对象，已核）。评论 POST 走 repos 路径正常（201）。
- **未发面**：GitHub 侧 0 条（无整条已修可回）；C 线（修复批分组）裁定仍候用户。

## §5 实施记录（eng-coder）
## §6 验证与收口（父代理）
