/**
 * aggregates.mjs — 派生两表（metering/METERING.md §2.3——KD-SV-38/39）：写 ∥ 计数点查 ∥ 成员月表读 ∥ 对账重算 ∥ 派生清理。
 *
 * 两表 = **可重算派生面**（真源 = `usage` 明细；对账 = `usage reconcile`）：`usage_daily`（汇表面读源——日 × 成员 ×
 * key × provider × model × endpoint）∥ `quota_counters`（检查面点查源——成员 × provider × 模型 × 自然月）。
 * 键时基 = 行 `ts` 同源：`day`/`month` 由 `strftime(…, ts / 1000, 'unixepoch', 'localtime')` 推导（**与 v5 回填/
 * 对账 SQL 同表达式**——非入账时刻；跨零点/月初终结请求 ⇒ 键归 `ts` 所在日/月，对账零幻影行）。
 * 写入口 = `usage.mjs` `recordUsage`（单写点——同事务三写）；本档不自开事务。
 */
const DAILY_COLUMNS = ["day", "member_id", "key_id", "provider", "model", "endpoint"]
const DAILY_VALUES = ["requests", "prompt_tokens", "completion_tokens", "total_tokens", "duration_ms", "errors"]
const COUNTER_COLUMNS = ["member_id", "provider", "model", "month"]

/** 自然月键（本地时区——与 upsert/回填同表达式）：`'YYYY-MM'`。 */
export function monthKeyOf(db, ts = Date.now()) {
  return db.prepare("SELECT strftime('%Y-%m', ? / 1000, 'unixepoch', 'localtime') AS month").get(ts).month
}

/** 日表重算（同回填表达式——`month` 限额）：以 `usage` 真源重聚合该月各键行。 */
function dailyFromUsage(db, month) {
  return db
    .prepare(
      `SELECT strftime('%Y-%m-%d', ts / 1000, 'unixepoch', 'localtime') AS day, member_id, key_id, provider, model, endpoint,
              COUNT(*) AS requests, COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
              COALESCE(SUM(completion_tokens), 0) AS completion_tokens, COALESCE(SUM(total_tokens), 0) AS total_tokens,
              COALESCE(SUM(duration_ms), 0) AS duration_ms,
              COALESCE(SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END), 0) AS errors
       FROM usage WHERE strftime('%Y-%m', ts / 1000, 'unixepoch', 'localtime') = ?
       GROUP BY day, member_id, key_id, provider, model, endpoint`,
    )
    .all(month)
}

/** 计数表重算（同回填表达式——`month` 限额）。 */
function countersFromUsage(db, month) {
  return db
    .prepare(
      `SELECT member_id, provider, model, strftime('%Y-%m', ts / 1000, 'unixepoch', 'localtime') AS month,
              COALESCE(SUM(total_tokens), 0) AS tokens
       FROM usage WHERE strftime('%Y-%m', ts / 1000, 'unixepoch', 'localtime') = ?
       GROUP BY member_id, provider, model, month`,
    )
    .all(month)
}

/** 派生两表同事务累加（随记账——METERING §1/§2.3）：日表计数 +1 ∥ token/时长/错误累加；计数表 token 累加。
 *  键 = 行 `ts` 推导（跨零点/月初终结 ⇒ 键归 `ts` 所在日/月）；NULL token 计 0（口径同聚合）。 */
export function bumpDerived(db, { ts, memberId, keyId, endpoint, provider, model, status, promptTokens, completionTokens, totalTokens, durationMs }) {
  db.prepare(
    `INSERT INTO usage_daily (day, member_id, key_id, provider, model, endpoint, requests, prompt_tokens, completion_tokens, total_tokens, duration_ms, errors)
     VALUES (strftime('%Y-%m-%d', ? / 1000, 'unixepoch', 'localtime'), ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
     ON CONFLICT (day, member_id, key_id, provider, model, endpoint) DO UPDATE SET
       requests = requests + 1,
       prompt_tokens = prompt_tokens + excluded.prompt_tokens,
       completion_tokens = completion_tokens + excluded.completion_tokens,
       total_tokens = total_tokens + excluded.total_tokens,
       duration_ms = duration_ms + excluded.duration_ms,
       errors = errors + excluded.errors`,
  ).run(ts, memberId, keyId, provider, model, endpoint, promptTokens ?? 0, completionTokens ?? 0, totalTokens ?? 0, durationMs ?? 0, status === "error" ? 1 : 0)
  db.prepare(
    `INSERT INTO quota_counters (member_id, provider, model, month, tokens)
     VALUES (?, ?, ?, strftime('%Y-%m', ? / 1000, 'unixepoch', 'localtime'), ?)
     ON CONFLICT (member_id, provider, model, month) DO UPDATE SET tokens = tokens + excluded.tokens`,
  ).run(memberId, provider, model, ts, totalTokens ?? 0)
}

/** 计数点查（检查面——KD-SV-38）：唯一键 autoindex 命中 ⇒ O(1)；无行 ⇒ 0。`month` 同 upsert 表达式（本地时区）。 */
export function quotaCounterTokens(db, { memberId, provider, model, now = Date.now() }) {
  const row = db
    .prepare(
      `SELECT tokens FROM quota_counters
       WHERE member_id = ? AND provider = ? AND model = ? AND month = strftime('%Y-%m', ? / 1000, 'unixepoch', 'localtime')`,
    )
    .get(memberId, provider, model, now)
  return row ? Number(row.tokens) : 0
}

/** 成员月表读（配额 v2 批——METERING §2.3；成员弹窗逐行已用 ∥ AC-23）：Map memberId → `{ 外标: tokens }`（自然月）。
 *  外标回拼同记账口径（`provider = ''` ⇒ `model` 单段——无损）；`memberId` 给定 ⇒ 唯一键前缀查询
 *  ∥ 缺省 = 全员一次装配（免 N+1）；无行成员不在图内（消费侧缺省 `{}`——两形逐值相等）。 */
export function monthlyCountersByMember(db, { memberId = null, now = Date.now() } = {}) {
  const month = monthKeyOf(db, now)
  const where = memberId === null ? "WHERE month = ?" : "WHERE member_id = ? AND month = ?"
  const args = memberId === null ? [month] : [memberId, month]
  const byMember = new Map()
  for (const row of db.prepare(`SELECT member_id, provider, model, tokens FROM quota_counters ${where}`).all(...args)) {
    let entry = byMember.get(row.member_id)
    if (!entry) {
      entry = {}
      byMember.set(row.member_id, entry)
    }
    entry[row.provider === "" ? row.model : `${row.provider}/${row.model}`] = Number(row.tokens)
  }
  return byMember
}

/** 行键（比较用——分隔符不可入值域（NUL）；数值/文本逐列原样）。 */
function keyOf(row, columns) {
  return columns.map((column) => String(row[column])).join("\u0000")
}

/** 逐行逐值比较 ⇒ 漂移清单：`{ key, expected, actual }`（缺行 ⇒ 对侧 `null`）；`checked` = 比对键数。 */
function diffRows(expectedRows, actualRows, keyColumns, valueColumns) {
  const expected = new Map(expectedRows.map((row) => [keyOf(row, keyColumns), row]))
  const actual = new Map(actualRows.map((row) => [keyOf(row, keyColumns), row]))
  const keys = [...new Set([...expected.keys(), ...actual.keys()])]
  const drifted = []
  const strip = (row) => (row === null ? null : Object.fromEntries(valueColumns.map((column) => [column, Number(row[column])])))
  for (const key of keys) {
    const want = expected.get(key) ?? null
    const have = actual.get(key) ?? null
    if (want !== null && have !== null && valueColumns.every((column) => Number(want[column]) === Number(have[column]))) continue
    drifted.push({ key: Object.fromEntries(keyColumns.map((column) => [column, (want ?? have)[column]])), expected: strip(want), actual: strip(have) })
  }
  return { checked: keys.length, drifted }
}

/** 派生两表当月实读（对账用——日表按 `day` 前缀窗 ∥ 计数表按月键）。 */
function readDailyRows(db, month) {
  return db
    .prepare("SELECT day, member_id, key_id, provider, model, endpoint, requests, prompt_tokens, completion_tokens, total_tokens, duration_ms, errors FROM usage_daily WHERE substr(day, 1, 7) = ?")
    .all(month)
}
function readCounterRows(db, month) {
  return db.prepare("SELECT member_id, provider, model, month, tokens FROM quota_counters WHERE month = ?").all(month)
}

/** 对账读数（`usage reconcile`——METERING §2.5）：两派生表 vs `usage` 重算（缺省月 = 当本月）。
 *  `fix = true` ⇒ **`BEGIN IMMEDIATE` 先行**——读快照（重算）与覆写**同事务**（CLI 对账 × server 记账的
 *  跨进程并发窗闭合——#1001①）；零漂移 ⇒ 零覆写（`fixed = false`）。报告路径（无 `--fix`）零改。
 *  返回 `{ month, daily, counters, fixed }`。 */
export function reconcileUsage(db, { month = null, fix = false, now = Date.now() } = {}) {
  const target = month ?? monthKeyOf(db, now)
  if (!fix) {
    const daily = diffRows(dailyFromUsage(db, target), readDailyRows(db, target), DAILY_COLUMNS, DAILY_VALUES)
    const counters = diffRows(countersFromUsage(db, target), readCounterRows(db, target), COUNTER_COLUMNS, ["tokens"])
    return { month: target, daily, counters, fixed: false }
  }
  db.exec("BEGIN IMMEDIATE") // 写锁先行（读快照与覆写同事务——跨进程窗闭合）
  try {
    const expectedDaily = dailyFromUsage(db, target) // 事务内重算快照（与覆写同源）
    const expectedCounters = countersFromUsage(db, target)
    const daily = diffRows(expectedDaily, readDailyRows(db, target), DAILY_COLUMNS, DAILY_VALUES)
    const counters = diffRows(expectedCounters, readCounterRows(db, target), COUNTER_COLUMNS, ["tokens"])
    if (daily.drifted.length === 0 && counters.drifted.length === 0) {
      db.exec("COMMIT") // 零漂移 ⇒ 零覆写
      return { month: target, daily, counters, fixed: false }
    }
    db.prepare("DELETE FROM usage_daily WHERE substr(day, 1, 7) = ?").run(target)
    const insertDaily = db.prepare(
      `INSERT INTO usage_daily (day, member_id, key_id, provider, model, endpoint, requests, prompt_tokens, completion_tokens, total_tokens, duration_ms, errors)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    for (const row of expectedDaily) {
      insertDaily.run(row.day, row.member_id, row.key_id, row.provider, row.model, row.endpoint, row.requests, row.prompt_tokens, row.completion_tokens, row.total_tokens, row.duration_ms, row.errors)
    }
    db.prepare("DELETE FROM quota_counters WHERE month = ?").run(target)
    const insertCounter = db.prepare("INSERT INTO quota_counters (member_id, provider, model, month, tokens) VALUES (?, ?, ?, ?, ?)")
    for (const row of expectedCounters) insertCounter.run(row.member_id, row.provider, row.model, row.month, row.tokens)
    db.exec("COMMIT")
    return { month: target, daily, counters, fixed: true }
  } catch (e) {
    db.exec("ROLLBACK")
    throw e
  }
}

/** 派生两表保留清理（与 usage 同窗——METERING §1）：日表 `day <` 界日 ∥ 计数表 `month <` 界月；返回删除读数。 */
export function pruneDerived(db, { cutoff }) {
  const daily = Number(db.prepare("DELETE FROM usage_daily WHERE day < strftime('%Y-%m-%d', ? / 1000, 'unixepoch', 'localtime')").run(cutoff).changes)
  const counters = Number(db.prepare("DELETE FROM quota_counters WHERE month < strftime('%Y-%m', ? / 1000, 'unixepoch', 'localtime')").run(cutoff).changes)
  return { daily, counters }
}
