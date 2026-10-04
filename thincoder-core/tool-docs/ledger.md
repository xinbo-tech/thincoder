台账统一入口——action = add / update / close / query / count。query / count 只读全角色；add / update / close 写仅主 agent。
- add：新增条目入待讨论。kind = requirement（需求池）/ tech_todo（技术待办）；trigger = 归批 / 条件 / 认账不排期（可空）。
- update：按六态允许表迁移：待讨论→待设计 / 待设计→在途 / 在途→待核销 / 待核销→已核销 / 任意态→已废弃；表外拒。status 缺省 = 仅更新字段。
- close：勾销（待核销 → 已核销）；追认核销（待讨论 / 待设计 → 已核销，须有 evidence）；在途 → 已核销 不可跳；撤回（任意态 → 已废弃）。软删除（写 closed_at，行保留）。
- query：SQLite 行集，过滤缺省 = 全部行。六态 = 待讨论 / 待设计 / 在途 / 待核销 / 已核销 / 已废弃。
- count：未决四态（待讨论 / 待设计 / 在途 / 待核销）COUNT(*)。