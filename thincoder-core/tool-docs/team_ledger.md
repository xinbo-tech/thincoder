团队台账（服务端一本——登录后可用；与**本机台账两账独立**：本机账照旧，团队账零离线缓存）。action = query / count / add / update / close。
- query / count：只读全角色；add / update / close：写仅主 agent 装配面（子代理只读）。
- 仓标记自动派生（当前项目根的 git 源——不手挑）：无 git 仓 ∥ 无 remote.origin.url ⇒ 明示失败、零请求。
- query：scope = "repo"（缺省——当前仓）∥ "team"（全队跨仓）；过滤 status（六态：待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃）∥ owner（用户名精确匹配）；行集携 aged（未决四态 ∧ 行龄 > 30 天）。
- count：同 query 参数，出 total。
- add：title 必填（≤200）∥ detail（≤4000）∥ owner（缺省 = 自己）——status 恒 待讨论。
- update：id 必填；title / detail / owner / status 至少一件；status = 迁移表合法后继（待讨论→待设计 ∥ 待设计→在途 ∥ 在途→待核销 ∥ 待核销→已核销 ∥ 未归档→已废弃）；已归档（已核销 / 已废弃）⇒ 拒；仓不可改。
- close：id + status（已核销 ∥ 已废弃）——已核销：勾销（只自 待核销；其余现态 400，出路 = 先 PATCH 推进到 待核销）；已废弃 = 撤回（任意未归档态）。
- 登录态门：未登录 ⇒ 明示「未登录」且零请求；401（token 失效）⇒ 「登录已失效——请重新登录」；不可达 ⇒ 「服务器不可达」（零离线缓存，重试不落旧值）。
