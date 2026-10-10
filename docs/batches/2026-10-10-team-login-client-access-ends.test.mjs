/**
 * 2026-10-10-team-login-client-access-ends.test.mjs — 批内单测件（B1 批 · **跨面件：核 + 三端结构面** · 名随批档
 * 留存 · 住 `docs/batches/` · 不入仓套件 ∥ **不入 `prepublishOnly` 链**（跨面件无宿主产品链））。
 * 姊妹件 = `2026-10-10-team-login-client-access.test.mjs`（服务端面——入 server 链）∥
 * `2026-10-10-team-login-client-access-desktop.test.mjs`（桌面舱 D 行为面）。
 * 跑法（`thincoder/` 仓根或工作区根均可——按件位定位仓根）：
 *   node --test thincoder/docs/batches/2026-10-10-team-login-client-access-ends.test.mjs
 *
 * 射程（判据源 = `docs/core/design/TEAM.md` §2 ∥ §5 ①–⑤ ∥ §6 用例 N1/B1/E1/N2/B2/E2）：
 *   腿 1（N1 ∥ B1 ∥ E1 ∥ N2 · 核写法面）：单写者（`persistRaw` 恰两写点）∥ 登录一次 mutate（`team` 四键 +
 *     派生条目表尾追加 ∥ 两处同值 token）∥ 同名手工条目不覆盖（`notice` 码）∥ 失败分类早返零写盘 + `write_failed`
 *     零假成功 ∥ 退出摘 token ∥ 摘 apiKey（`derived` 保留）∥ 吊销 best-effort 两态；
 *   腿 2（`team` 段形 · §2.1）：加载归一 ∥ 不入 `DEFAULTS` ∥ 三端七档零自写盘（零写调用 ∥ 零写 import）；
 *   腿 3（B2 · 隐藏判据）：四消费面各一处（定义单源 ∥ 逐面在位 ∥ 面外零余处）+ CLI 谓词纯函数真值表；
 *   腿 4（E2 · 归一）：地址归一四例 ∥ label 裁剪 ≤40（纯函数）+ 源码面（`LABEL_MAX = 40` ∥ 两处 slice）；
 *   腿 5（§2.5 文案）：未登录句 ∥ 四失败句 ∥ 两提示句——三端逐字同拍 + 消费接线 + 读面四键零提示字段；
 *   腿 6（桌面闭集随动 · KD-68）：`SECTIONS` 八段 ∥ `SCOPES` 十一名（派生式）∥ `MODAL_READS.team` ∥
 *     菜单镜像 `SETTINGS_GROUPS` 六名零改名；
 *   腿 7（CLI 注册面）：USAGE 两行 ∥ 命令表 case + import ∥ 三子命令分派 ∥ 补全三套（bash ∥ zsh ∥ fish）；
 *   腿 8（VSC 第 6 卡）：复合序尾 ∥ 三字段（密码型）∥ 两钮 ∥ 消息链（上行 2 case ∥ 回执 3 case ∥ 成拍两推送）；
 *   腿 9（桌面第 8 段 + 三 IPC 通道）：段体两态 ∥ 段分派 + 段态门 ∥ 白名单 51（末位三）∥ `HANDLERS` 闭合 ∥ 转口直连核。
 * 纪律：读面 = 源码文本扫描 + 三枚纯函数直调（CLI 谓词 ∥ 核地址归一/标签）——零写盘 ∥ 零网络 ∥ 零真机 ∥ 零上游改动。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = [join(HERE, "..", ".."), join(HERE, "..", "..", "..")].find((d) => existsSync(join(d, "thincoder-core")))
if (ROOT === undefined || !existsSync(join(ROOT, "thincoder-cli"))) throw new Error("按件位未定位到仓库根（须含 thincoder-core/ 与 thincoder-cli/）")
const read = (rel) => readFileSync(join(ROOT, rel), "utf8")
const mod = (rel) => import(pathToFileURL(join(ROOT, rel)).href)
const count = (text, re) => (text.match(re) ?? []).length

/** 源树文件遍历（除 `node_modules` ∥ `dist*`——批内件惯例）；路径统一正斜杠形。 */
function walkFiles(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (entry.isDirectory() && (entry.name === "node_modules" || entry.name.startsWith("dist"))) continue
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) walkFiles(rel, out)
    else out.push(rel)
  }
  return out
}

// ─── 夹具（核档三件 ∥ 三端 team 族七档 ∥ 桌面词表取件）──────────────────────────────────────────

const CORE_FILE = "thincoder-core/team.mjs"
const CORE_CONFIG = "thincoder-core/config.mjs"
const CORE_IO = "thincoder-core/config-io.mjs"
const DESK_I18N = "thincoder-desktop/renderer/i18n-settings.mjs"

/** 三端 team 族七档（零自写盘扫描域——机制面各端接线件）。 */
const END_TEAM_FILES = [
  "thincoder-cli/src/cli/team-command.mjs",
  "thincoder-vscode/src/extension/team.mjs",
  "thincoder-vscode/webview/settings-team.js",
  "thincoder-vscode/src/extension/panel-messages-settings.mjs",
  "thincoder-desktop/src/main/team.mjs",
  "thincoder-desktop/renderer/mount-team.mjs",
  "thincoder-desktop/renderer/views/settings-sections-team.mjs",
]

/** 写调用形（含核内写执行体名——端侧档须零命中）。 */
const WRITE_CALL = /\b(?:persistRaw|writeConfigAtomic|writeConfigRaw|writeConfig|writeFileSync|writeFile)\s*\(/
/** 写 import 绑定名（具名 import 面——端侧档须零命中）。 */
const WRITE_BINDING = /^(?:persistRaw|writeConfigAtomic|writeConfigRaw|writeConfig|writeFileSync|writeFile)$/

const core = read(CORE_FILE)

/** 桌面 zh 词条值（同键两表（en 先 ∥ zh 后）——取末次命中 = zh 表）。 */
function deskZhValue(key) {
  const hits = [...read(DESK_I18N).matchAll(new RegExp(`"${key.replaceAll(".", "\\.")}": "((?:[^"\\\\]|\\\\.)*)"`, "g"))]
  assert.equal(hits.length, 2, `桌面词键两表形（en ∥ zh）：${key}`)
  return hits.at(-1)[1]
}

// ─── 腿 1 · 核写法面（N1 ∥ B1 ∥ E1 ∥ N2）──────────────────────────────────────────────────────

test("腿1a N1 写入形：单写者（persistRaw 恰两写点 ∥ import 自 config-io）∥ 登录一次 mutate（team 四键 + 派生条目表尾 ∥ 同值 token）", () => {
  assert.equal(count(core, /\bpersistRaw\(/g), 2, "写点恰二 = 登录 ∥ 退出（各自一次 mutate）")
  assert.match(core, /import \{ persistRaw \} from "\.\/config-io\.mjs"/, "写执行体经核 config-io")
  assert.ok(!core.includes("node:fs"), "核档零 fs 直写")
  const io = read(CORE_IO)
  assert.match(io, /export function persistRaw\(mutate, opts = \{\}\) \{\s*return writeConfigAtomic\(/, "persistRaw = writeConfigAtomic 包装（核内唯一写盘执行体）")
  assert.ok(core.includes('const TEAM_PROVIDER_NAME = "team"'), "派生条目固定名 = team")
  const mutateAt = core.indexOf("persistRaw((raw) => {")
  const teamAt = core.indexOf("raw.team = { server: base")
  const pushAt = core.indexOf("raw.providers.push({ name: TEAM_PROVIDER_NAME")
  assert.ok(mutateAt !== -1 && mutateAt < teamAt && teamAt < pushAt, "登录一次 mutate：先 team 段、后派生条目（同一次写盘落）")
  assert.ok(core.includes("raw.team = { server: base, member: { username: memberUsername, name: memberName }, label: resolvedLabel, token }"), "team 四键 = server ∥ member{username,name} ∥ label ∥ token")
  assert.ok(core.includes("raw.providers.push({ name: TEAM_PROVIDER_NAME, baseURL: `${base}/v1`, apiKey: token, derived: true })"), "派生条目形 = 固定名 + baseURL `<server>/v1` + apiKey=token + derived:true（表尾追加）")
  assert.ok(core.includes("existing.baseURL = `${base}/v1`") && core.includes("existing.apiKey = token") && core.includes("existing.derived = true"), "有则更新（upsert——同值 token）")
  const manualAt = core.indexOf("existing.derived !== true")
  const firstUpdateAt = core.indexOf("existing.baseURL = `${base}/v1`")
  assert.ok(manualAt !== -1 && manualAt < firstUpdateAt, "手工分支早于更新分支（不覆盖——见腿1b）")
})

test("腿1b B1 同名手工：登录仍成 + notice 码（零覆盖）∥ 三端码消费在位", () => {
  assert.ok(core.includes('export const NOTICE_MANUAL_NAME_CONFLICT = "manual-name-conflict"'), "提示码 = manual-name-conflict（码不携文）")
  assert.match(core, /if \(existing !== undefined && existing\.derived !== true\) \{\s*\n\s*notice = NOTICE_MANUAL_NAME_CONFLICT[^\n]*\n\s*return/, "同名手工 ⇒ 记码 + 早返（不写派生条目）")
  const manualBlock = core.slice(core.indexOf("existing.derived !== true"), core.indexOf("existing.baseURL = `${base}/v1`"))
  assert.ok(!/existing\.\w+ =/.test(manualBlock), "手工分支零 existing 赋值（零覆盖）")
  assert.match(core, /return notice !== null \? \{ ok: true, notice \} : \{ ok: true \}/, "成径返回形（notice 仅同名冲突在场）")
  assert.ok(read("thincoder-cli/src/cli/team-command.mjs").includes("result.notice === NOTICE_MANUAL_NAME_CONFLICT"), "CLI 码判定在位")
  assert.ok(read("thincoder-vscode/webview/settings-team.js").includes('"manual-name-conflict": "settings.team.notice.manualNameConflict"'), "VSC 码表在位")
  assert.ok(read("thincoder-desktop/renderer/mount-team.mjs").includes('const MANUAL_NAME_CONFLICT = "manual-name-conflict"'), "桌面码常量在位")
})

test("腿1c E1 失败面：分类早返零写盘（network ∥ credentials ∥ rate_limited）∥ write_failed 两径零假成功", () => {
  const firstWrite = core.indexOf("persistRaw(")
  assert.ok(firstWrite !== -1 && core.indexOf('reason: "credentials"') < firstWrite && core.indexOf('reason: "network"') < firstWrite, "参数面失败（无地址 ∥ 凭据不全）早于写点（零写盘）")
  assert.match(core, /if \(res\.status === 401\) return \{ ok: false, reason: "credentials" \}/, "401 ⇒ credentials")
  assert.match(core, /if \(res\.status === 429\) return \{ ok: false, reason: "rate_limited" \}/, "429 ⇒ rate_limited")
  assert.match(core, /return \{ ok: false, reason: "network" \} \/\/ 404/, "余状态 ⇒ network（服务不符合预期面）")
  assert.match(core, /catch \{\s*return \{ ok: false, reason: "network" \} \/\/ 不可达/, "不可达 ⇒ network")
  assert.match(core, /if \(token === null\) return \{ ok: false, reason: "network" \} \/\/ 200 而形不符/, "200 而形不符 ⇒ network（零假成功）")
  assert.equal(count(core, /reason: "write_failed"/g), 4, "写盘失败两径 × 两流程（登录 ∥ 退出）")
  const loginSuccessAt = core.indexOf("return notice !== null ? { ok: true, notice } : { ok: true }")
  const logoutSuccessAt = core.indexOf("return { ok: true, revokeDelivered }")
  const conflictGuard = 'if (result !== null && result.ok === false) return { ok: false, reason: "write_failed" }'
  const loginGuardAt = core.indexOf(conflictGuard)
  const logoutGuardAt = core.lastIndexOf(conflictGuard)
  assert.ok(loginGuardAt !== -1 && loginSuccessAt !== -1 && loginGuardAt < loginSuccessAt, "登录：写盘失败返还在成径之前（零假成功）")
  assert.ok(logoutGuardAt !== -1 && logoutSuccessAt !== -1 && logoutGuardAt < logoutSuccessAt, "退出：写盘失败返还在成径之前（零假成功）")
})

test("腿1d N2 退出形：摘 token ∥ 摘 apiKey（derived 保留）∥ 吊销 best-effort 两态 ∥ 无 token ∥ 无派生 key ⇒ 零写盘", () => {
  const logoutBlock = core.slice(core.indexOf("export async function teamLogout()"))
  assert.ok(logoutBlock.includes("delete section.token"), "摘 team.token（server ∥ member ∥ label 留存）")
  assert.ok(logoutBlock.includes("delete entry.apiKey"), "摘派生条目 apiKey")
  assert.equal(count(logoutBlock, /\bdelete /g), 2, "退出删除集恰二（token ∥ apiKey——条目与 derived 标记保留）")
  assert.ok(!logoutBlock.includes("splice("), "零删条目（零 splice）")
  assert.match(core, /authorization: `Bearer \$\{token\}`/, "吊销请求携 Bearer token")
  assert.match(core, /revokeDelivered = res\.status === 200 \|\| res\.status === 401/, "吊销两态（401 = 已失效 ⇒ 视同送达）")
  assert.match(core, /catch \{\s*revokeDelivered = false/, "网络失败 ⇒ revokeDelivered:false（本地照清）")
  assert.ok(core.includes("let revokeDelivered = true"), "默认 = 已送达（false 仅网络失败 ∥ 有 token 无地址）")
  assert.match(core, /return \{ ok: true, revokeDelivered \}/, "退出成径返回形（revokeDelivered:boolean）")
  assert.match(core, /if \(token !== null \|\| hasDerivedKey\)/, "无 token 且无派生 key ⇒ 零写盘（幂等）")
})

// ─── 腿 2 · `team` 段形（§2.1）─────────────────────────────────────────────────────────────────

test("腿2 team 段形：加载归一 ∥ 不入 DEFAULTS（字面唯一 = memory.team）∥ 三端七档零自写盘", () => {
  const cfgText = read(CORE_CONFIG)
  assert.match(cfgText, /export function normalizeTeamSection\(value\) \{/, "加载归一函数在场")
  assert.ok(cfgText.includes("merged.team = normalizeTeamSection(merged.team)"), "loadConfig 归一行（形不符 ⇒ null——软失败不阻启动）")
  const defaultsStart = cfgText.indexOf("export const DEFAULTS = {")
  const defaults = cfgText.slice(defaultsStart, cfgText.indexOf("\n}", defaultsStart + 1))
  const teamLines = defaults.split("\n").filter((line) => /\bteam\b/.test(line))
  assert.equal(teamLines.length, 1, "DEFAULTS 内 team 字面唯一（= memory.team——新 team 段不入 DEFAULTS）")
  assert.match(teamLines[0], /team: null/)
  for (const file of END_TEAM_FILES) {
    const text = read(file)
    assert.ok(!WRITE_CALL.test(text), `${file} 零写调用（端侧零自写盘）`)
    const bindings = [...text.matchAll(/import\s*\{([^}]*)\}\s*from/g)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]))
    assert.ok(bindings.every((b) => !WRITE_BINDING.test(b)), `${file} 零写 import 绑定`)
    assert.ok(!text.includes("node:fs"), `${file} 零 fs import`)
  }
})

// ─── 腿 3 · 隐藏判据（B2——四消费面各一处）────────────────────────────────────────────────────

test("腿3a B2 隐藏判据四消费面各一处：定义单源（CLI 谓词）∥ 逐面在位 ∥ 面外零余处", () => {
  const admin = read("thincoder-cli/src/tui/provider-admin.mjs")
  assert.match(admin, /export function isDerivedProviderHidden\(provider\) \{\s*\n\s*return provider\?\.derived === true && !hasKey\(provider\)/, "CLI 谓词定义（单源——语义 = derived ∧ 无 key）")
  assert.ok(admin.includes("agent.providers.filter((p) => p.name !== agent.activeProvider && !isDerivedProviderHidden(p))"), "CLI provider-admin 过滤调用在位（remove 流）")
  const picker = read("thincoder-cli/src/tui/model-picker.mjs")
  assert.match(picker, /import \{ createProviderAdmin, isDerivedProviderHidden \} from "\.\/provider-admin\.mjs"/, "模型候选面复用同引用")
  assert.match(picker, /export \{ cascadeRemoveProvider, isDerivedProviderHidden \} from "\.\/provider-admin\.mjs"/, "再出口同引用（零第二实现）")
  assert.ok(!picker.includes("function isDerivedProviderHidden"), "模型候选面零本地定义")
  assert.ok(count(picker, /isDerivedProviderHidden\(/g) >= 1, "模型候选面过滤在位")
  const vsc = read("thincoder-vscode/src/extension/settings.mjs")
  const statusAt = vsc.indexOf("export function providerStatus()")
  const vscFilterAt = vsc.indexOf("if (entry.derived === true && !configured) continue")
  assert.ok(statusAt !== -1 && vscFilterAt !== -1 && statusAt < vscFilterAt, "VSC providerStatus 内一处过滤（本件只钉字面；configured 语义归舱 C）")
  const desk = read("thincoder-desktop/src/main/providers.mjs")
  assert.match(desk, /function isHiddenDerived\(entry\) \{\s*\n\s*return entry\?\.derived === true && !hasKeyOf\(entry\)/, "桌面谓词（derived ∧ 无 key）")
  assert.ok(desk.includes("providers.filter((p) => !isHiddenDerived(p))"), "桌面 providerList 一处过滤")
  const hits = ["thincoder-cli/src", "thincoder-vscode/src", "thincoder-vscode/webview", "thincoder-desktop/src", "thincoder-desktop/renderer"]
    .flatMap((dir) => walkFiles(dir))
    .filter((file) => /\.(mjs|js|cjs)$/.test(file) && /\.derived\b/.test(read(file)))
  assert.deepEqual(hits.sort(), [
    "thincoder-cli/src/tui/provider-admin.mjs",
    "thincoder-desktop/src/main/providers.mjs",
    "thincoder-vscode/src/extension/settings.mjs",
  ].sort(), "面外零余处（三端产品树内 `.derived` 属性读恰三档）")
})

test("腿3b B2 纯函数：isDerivedProviderHidden 真值表（无 key 派生 ⇒ 真；有 key ∥ 手工 ⇒ 假）", async () => {
  const { isDerivedProviderHidden } = await mod("thincoder-cli/src/tui/provider-admin.mjs")
  assert.equal(isDerivedProviderHidden({ name: "team", baseURL: "https://t.example/v1", apiKey: "", derived: true }), true, "派生无 key ⇒ 隐藏（退出态）")
  assert.equal(isDerivedProviderHidden({ name: "team", baseURL: "https://t.example/v1", derived: true }), true, "apiKey 键缺席（退出实装形——摘键）⇒ 隐藏")
  assert.equal(isDerivedProviderHidden({ name: "team", baseURL: "https://t.example/v1", apiKey: "   ", derived: true }), true, "空白 key（trim 判据）⇒ 隐藏")
  assert.equal(isDerivedProviderHidden({ name: "team", baseURL: "https://t.example/v1", apiKey: "sk-x", derived: true }), false, "派生有 key ⇒ 在场（登录态）")
  assert.equal(isDerivedProviderHidden({ name: "manual", baseURL: "https://m.example/v1", apiKey: "" }), false, "手工条目零涉")
  assert.equal(isDerivedProviderHidden(undefined), false, "缺项零抛（可选链）")
})

// ─── 腿 4 · E2 归一 + label 裁剪 ──────────────────────────────────────────────────────────────

test("腿4 E2 归一：地址四例（补 http ∥ 去尾斜杠 ∥ 去 /v1 ∥ 空 ⇒ null）∥ label ≤40 ∥ 源码面", async () => {
  const { normalizeTeamServer, defaultTeamLabel } = await mod(CORE_FILE)
  assert.equal(normalizeTeamServer("  host:1234/v1/  "), "http://host:1234", "缺协议补 http:// + 去尾斜杠 + 去 /v1")
  assert.equal(normalizeTeamServer("https://t.example/"), "https://t.example", "去尾斜杠")
  assert.equal(normalizeTeamServer("https://t.example/v1"), "https://t.example", "尾 /v1 去")
  assert.equal(normalizeTeamServer(""), null, "空 ⇒ null")
  assert.equal(normalizeTeamServer("http://"), null, "纯协议（空 host）⇒ 无效")
  const label = defaultTeamLabel()
  assert.ok(typeof label === "string" && label.includes("@") && label.length > 0 && label.length <= 40, `label = 端名@主机名（≤40——读数 ${label.length}）`)
  assert.ok(core.includes("const LABEL_MAX = 40"), "上限常量 = 40")
  assert.equal(count(core, /\.slice\(0, LABEL_MAX\)/g), 2, "两处裁剪（自动生成 ∥ 显式传入同口径）")
})

// ─── 腿 5 · 文案逐字同句（§2.5）───────────────────────────────────────────────────────────────

test("腿5a 未登录态句：三端逐字「未登录——登录后可用」∥ CLI 两出口接线（status ∥ logout）", () => {
  const cliCmd = read("thincoder-cli/src/cli/team-command.mjs")
  const cliLiteral = cliCmd.match(/const NOT_LOGGED_IN = "([^"]+)"/)?.[1]
  assert.equal(cliLiteral, "未登录——登录后可用")
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  assert.equal(vscZh["settings.team.notLoggedIn"], "未登录——登录后可用")
  assert.equal(deskZhValue("settings.team.loggedOut"), "未登录——登录后可用")
  assert.equal(vscZh["settings.team.notLoggedIn"], deskZhValue("settings.team.loggedOut"), "VSC ∥ 桌面同拍")
  assert.ok(cliCmd.includes("console.log(NOT_LOGGED_IN)"), "CLI 直出该句")
  assert.equal(count(cliCmd, /printNotLoggedIn\(\)\n/g), 2, "两出口调用（status ∥ logout——出口 0 幂等）")
  assert.ok(read("thincoder-vscode/webview/settings-team.js").includes('t("settings.team.notLoggedIn")'), "VSC 卡内提示行")
  assert.ok(read("thincoder-desktop/renderer/views/settings-sections-team.mjs").includes('t("settings.team.loggedOut")'), "桌面段内提示行")
})

test("腿5b 四失败句三端逐字同拍（network ∥ credentials ∥ rate_limited ∥ write_failed——理由域四值单源）", () => {
  const cliCmd = read("thincoder-cli/src/cli/team-command.mjs")
  const failBlock = cliCmd.match(/const FAILURE_TEXT = \{([\s\S]*?)\n\}/)?.[1] ?? ""
  const cliMap = Object.fromEntries([...failBlock.matchAll(/(\w+): "([^"]+)"/g)].map((m) => [m[1], m[2]]))
  assert.deepEqual(Object.keys(cliMap).sort(), ["credentials", "network", "rate_limited", "write_failed"], "四值闭集（CLI 表）")
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  const rows = [
    ["network", "settings.team.fail.network", "settings.team.reason.network"],
    ["credentials", "settings.team.fail.credentials", "settings.team.reason.credentials"],
    ["rate_limited", "settings.team.fail.rateLimited", "settings.team.reason.rateLimited"],
    ["write_failed", "settings.team.fail.writeFailed", "settings.team.reason.writeFailed"],
  ]
  for (const [code, vscKey, deskKey] of rows) {
    assert.equal(cliMap[code], vscZh[vscKey], `CLI ∥ VSC 同拍（${code}）`)
    assert.equal(vscZh[vscKey], deskZhValue(deskKey), `VSC ∥ 桌面 同拍（${code}）`)
  }
  assert.equal(cliMap.network, "网络不可达")
  assert.equal(cliMap.credentials, "用户名或密码错误")
  assert.equal(cliMap.rate_limited, "登录尝试过于频繁")
  assert.equal(cliMap.write_failed, "本机配置写入失败")
  assert.equal(count(cliCmd, /console\.error\(FAILURE_TEXT\[result\.reason\] \?\? FAILURE_TEXT\.network\)/g), 2, "CLI 两出口（登录 ∥ 退出）")
  const vscCard = read("thincoder-vscode/webview/settings-team.js")
  for (const code of ["network", "credentials", "rate_limited", "write_failed"]) assert.ok(vscCard.includes(`${code}: "settings.team.fail.`), `VSC 码表 ${code}`)
  const deskSeg = read("thincoder-desktop/renderer/views/settings-sections-team.mjs")
  for (const code of ["network", "credentials", "rate_limited", "write_failed"]) assert.ok(deskSeg.includes(`${code}: "settings.team.reason.`), `桌面码表 ${code}`)
})

test("腿5c 两提示句三端逐字同拍 ∥ 一次性事件门（notice 码 ∥ revokeDelivered === false）∥ 读面四键零提示字段", () => {
  const cliCmd = read("thincoder-cli/src/cli/team-command.mjs")
  const cliManual = cliCmd.match(/const TEXT_MANUAL_CONFLICT = "([^"]+)"/)?.[1]
  const cliRevoke = cliCmd.match(/const TEXT_REVOKE_UNDELIVERED = "([^"]+)"/)?.[1]
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  assert.equal(cliManual, vscZh["settings.team.notice.manualNameConflict"])
  assert.equal(vscZh["settings.team.notice.manualNameConflict"], deskZhValue("settings.team.notice.manualNameConflict"))
  assert.equal(cliRevoke, vscZh["settings.team.notice.revokeUndelivered"])
  assert.equal(vscZh["settings.team.notice.revokeUndelivered"], deskZhValue("settings.team.notice.revokeNotDelivered"))
  assert.equal(cliManual, "已存在同名 provider「team」——未自动添加；请改名或删除后重登")
  assert.equal(cliRevoke, "服务端吊销未达")
  assert.ok(cliCmd.includes("if (result.notice === NOTICE_MANUAL_NAME_CONFLICT) console.error(TEXT_MANUAL_CONFLICT)"), "CLI 登录当刻")
  assert.ok(cliCmd.includes("if (result.revokeDelivered === false) console.error(TEXT_REVOKE_UNDELIVERED)"), "CLI 退出当刻")
  assert.ok(read("thincoder-vscode/webview/settings-team.js").includes('result.revokeDelivered === false ? t("settings.team.notice.revokeUndelivered") : null'), "VSC 退出当刻（缺席 = true）")
  const deskMount = read("thincoder-desktop/renderer/mount-team.mjs")
  assert.ok(deskMount.includes('receipt.notice === MANUAL_NAME_CONFLICT ? { kind: "manualConflict" } : null'), "桌面登录当刻")
  assert.ok(deskMount.includes('receipt.revokeDelivered === false ? { kind: "revokeFailed" } : null'), "桌面退出当刻（缺席 = true）")
  const statusBlock = core.match(/export function teamStatus\(\) \{[\s\S]*?return \{([\s\S]*?)\n  \}/)?.[1] ?? ""
  assert.deepEqual([...statusBlock.matchAll(/(\w+):/g)].map((m) => m[1]), ["loggedIn", "server", "member", "label"], "读面四键（零提示字段）")
  assert.ok(read("thincoder-desktop/src/main/team.mjs").includes("return { ok: true, ...teamStatus() }"), "桌面读面 = 核投影")
  assert.ok(read("thincoder-vscode/src/extension/settings.mjs").includes('panel?.webview.postMessage({ type: "teamStatus", ...teamStatus() })'), "VSC 读面 = 核投影")
})

// ─── 腿 6 · 桌面闭集随动（KD-68）─────────────────────────────────────────────────────────────

test("腿6a 桌面闭集随动：SECTIONS 八段（序尾 team）∥ SCOPES 十一名（派生式）∥ MODAL_READS.team = loadTeam", () => {
  const view = read("thincoder-desktop/renderer/views/settings.mjs")
  const names = [...(view.match(/export const SECTIONS = Object\.freeze\(\[([\s\S]*?)\n\]\)/)?.[1] ?? "").matchAll(/name: "([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(names, ["providers", "model", "agent", "mcp", "env", "tools", "models", "team"], "八段（团队追加序尾——既有七段零重排）")
  const addGroup = view.match(/export const ADD_MODAL_GROUP = "([^"]+)"/)?.[1]
  const mcpForm = view.match(/export const MCP_FORM_MODAL_GROUP = "([^"]+)"/)?.[1]
  const consultAdd = view.match(/export const CONSULT_ADD_MODAL_GROUP = "([^"]+)"/)?.[1]
  assert.deepEqual([addGroup, mcpForm, consultAdd], ["providerAdd", "mcpForm", "consultAdd"], "三弹窗组名")
  const mount = read("thincoder-desktop/renderer/mount-settings.mjs")
  assert.ok(mount.includes("const SCOPES = Object.freeze([...SECTIONS.map((section) => section.name), ADD_MODAL_GROUP, MCP_FORM_MODAL_GROUP, CONSULT_ADD_MODAL_GROUP])"), "SCOPES 派生式（段名 + 三组 = 十一名）")
  assert.equal(names.length + 3, 11, "SCOPES 十一名")
  assert.ok(mount.includes('team: "loadTeam",'), "MODAL_READS.team 读链一处")
})

test("腿6b 菜单镜像零改名：SETTINGS_GROUPS 六名（= SECTIONS 去「模型」去「团队」）∥ 零 team", () => {
  const menu = read("thincoder-desktop/src/main/app-menu.mjs")
  const groups = [...(menu.match(/export const SETTINGS_GROUPS = Object\.freeze\(\[([^\]]+)\]\)/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(groups, ["providers", "agent", "mcp", "env", "tools", "models"], "六名闭集不动（菜单镜像零改名）")
  assert.ok(!groups.includes("team"), "团队不入菜单")
  const names = [...(read("thincoder-desktop/renderer/views/settings.mjs").match(/export const SECTIONS = Object\.freeze\(\[([\s\S]*?)\n\]\)/)?.[1] ?? "").matchAll(/name: "([^"]+)"/g)].map((m) => m[1])
  assert.deepEqual(groups, names.filter((n) => n !== "model" && n !== "team"), "镜像 = SECTIONS 名序去「模型」去「团队」")
})

// ─── 腿 7 · CLI 注册面 ───────────────────────────────────────────────────────────────────────

test("腿7a CLI 注册：USAGE 两行 ∥ 命令表 case + import ∥ 三子命令分派", () => {
  const bin = read("thincoder-cli/bin/thincoder.mjs")
  assert.ok(bin.includes("thincoder team login [--server <url>] [--user <name>]"), "USAGE：login 行")
  assert.ok(bin.includes("thincoder team logout | status"), "USAGE：logout ∥ status 行")
  const table = read("thincoder-cli/src/command-table.mjs")
  assert.ok(table.includes('import { teamCommand } from "./cli/team-command.mjs"'), "命令表 import")
  assert.match(table, /case "team": \{[\s\S]*?const code = await teamCommand\(args\)[\s\S]*?if \(code\) exitSoon\(code\)/, "命令表 case（退出码透传）")
  const cmd = read("thincoder-cli/src/cli/team-command.mjs")
  assert.ok(cmd.includes('if (sub === "login") return runLogin(argv.slice(1))'), "子命令 login")
  assert.ok(cmd.includes('if (sub === "logout") return runLogout(argv.slice(1))'), "子命令 logout")
  assert.ok(cmd.includes('if (sub === "status") return runStatus(argv.slice(1))'), "子命令 status")
  assert.ok(cmd.includes("export async function teamCommand(args)"), "入口导出")
})

test("腿7b CLI 补全三套：bash ∥ zsh ∥ fish team 词面（顶层 + 子命令 + 旗标）", () => {
  const comp = read("thincoder-cli/src/completions.mjs")
  assert.ok(comp.includes("session ledger team -v --version -h --help"), "bash 顶层词表")
  assert.ok(comp.includes('team) case "$prev" in'), "bash 子命令分派")
  assert.ok(comp.includes('compgen -W "login logout status"'), "bash 子命令词面")
  assert.ok(comp.includes('compgen -W "--server --user"'), "bash 旗标词面")
  assert.ok(comp.includes("'team[Team login: login / logout / status]'"), "zsh 顶层描述")
  assert.ok(comp.includes('team) case "$words[2]" in'), "zsh 子命令分派")
  assert.ok(comp.includes("'--server:Team server URL:' '--user:Team user name:'"), "zsh 旗标描述")
  assert.match(comp, /complete -c thincoder -a team\s+-d 'Team login: login \/ logout \/ status'/, "fish 顶层描述")
  assert.ok(comp.includes("-n '__fish_seen_subcommand_from team' -a 'login logout status'"), "fish 子命令词面")
  assert.ok(comp.includes("-l server -d 'Team server URL'") && comp.includes("-l user -d 'Team user name'"), "fish 旗标词面")
})

// ─── 腿 8 · VSC 第 6 卡 ──────────────────────────────────────────────────────────────────────

test("腿8a VSC 第 6 卡：复合序尾 ∥ 管理面三读数 ∥ 零字段零钮零上行 ∥ 两回执消费位", () => {
  const settingsJs = read("thincoder-vscode/webview/settings.js")
  assert.ok(settingsJs.includes("providersCardHtml() + agentCardHtml() + consultAdvisorCardHtml() + toolsCardHtml() + envCardHtml() + teamCardHtml()"), "六卡复合（团队序尾）")
  assert.ok(!settingsJs.includes("bindTeamControls()"), "开面绑定退役")
  const card = read("thincoder-vscode/webview/settings-team.js")
  assert.ok(card.includes('t("settings.team.server")') && card.includes('t("settings.team.memberLabel")') && card.includes('t("settings.team.labelLabel")'), "卡档三读数（服务器地址 → 成员 → 端标签）")
  assert.ok(card.includes('t("settings.team.notLoggedIn")'), "未登录提示行")
  assert.ok(!card.includes('id="team-server"') && !card.includes('id="team-username"') && !card.includes('id="team-password"'), "零字段")
  assert.ok(!card.includes('id="team-login-btn"') && !card.includes('id="team-logout-btn"'), "零钮")
  assert.ok(!card.includes('type: "teamLogin"') && !card.includes('type: "teamLogout"'), "零上行")
  assert.ok(card.includes("export function onTeamLoginResult") && card.includes("export function onTeamLogoutResult"), "两回执消费位")
})

test("腿8b VSC 消息链：上行 2 case ∥ 回执 3 case ∥ 成拍推送（先 teamStatus + providerStatus、后回执）∥ 转口档", () => {
  const chat = read("thincoder-vscode/webview/chat-messages.js")
  const cases = [["teamStatus", "updateTeamStatus(m)"], ["teamLoginResult", "onTeamLoginResult(m); onWelcomeTeamLoginResult(m)"], ["teamLogoutResult", "onTeamLogoutResult(m)"]]
  for (const [message, fn] of cases) assert.ok(chat.includes(`case "${message}": ${fn}; break`), `回执 case ${message}`)
  const panel = read("thincoder-vscode/src/extension/panel-messages.mjs")
  assert.ok(panel.includes('case "teamLogin": await handleTeamLogin(panel, msg); break'), "上行 case teamLogin")
  assert.ok(panel.includes('case "teamLogout": await handleTeamLogout(panel); break'), "上行 case teamLogout")
  const handlers = read("thincoder-vscode/src/extension/panel-messages-settings.mjs")
  assert.ok(handlers.includes("export async function handleTeamLogin(panel, msg)") && handlers.includes("export async function handleTeamLogout(panel)"), "两处理体")
  assert.ok(handlers.includes("const r = await teamLogin({ server: msg.server, username: msg.username, password: msg.password })"), "三字段直转核")
  const pushAt = handlers.indexOf("pushTeamStatus(panel._panel)")
  const receiptAt = handlers.indexOf('type: "teamLoginResult"')
  assert.ok(pushAt !== -1 && receiptAt !== -1 && pushAt < receiptAt, "成拍：推送先、回执后")
  assert.ok(handlers.includes('panel._panel?.webview.postMessage({ type: "teamLoginResult", ...r })'), "登录回执")
  assert.ok(handlers.includes('panel._panel?.webview.postMessage({ type: "teamLogoutResult", ...r })'), "退出回执")
  const push = read("thincoder-vscode/src/extension/panel-settings-push.mjs")
  assert.equal(count(push, /settingsPushTeamStatus\(panel\._panel\)/g), 2, "快照族两拍（light ∥ full）")
  const relay = read("thincoder-vscode/src/extension/team.mjs")
  assert.ok(relay.includes("teamStatus as coreTeamStatus") && relay.includes("teamVerify as coreTeamVerify") && relay.includes("teamLogin as coreTeamLogin") && relay.includes("teamLogout as coreTeamLogout"), "转口档四件（核单源 ∥ 端侧零自写盘）")
})

// ─── 腿 9 · 桌面第 8 段 + 三 IPC 通道 ────────────────────────────────────────────────────────

test("腿9a 桌面第 8 段：**卡面管理面**（三读数 ∥ 零登/退控件；段态门）∥ 面板段体（三字段 ∥ 三读数 ∥ 两动作）∥ re-export（teamAdminBody）∥ 段分派 ∥ 装配（读链 ∥ 出口合并 ∥ 开面随读）", () => {
  const seg = read("thincoder-desktop/renderer/views/settings-sections-team.mjs")
  assert.ok(seg.includes('"data-form": "team"') && seg.includes('"data-draft-scope": "team"'), "表单锚 + 草稿作用域")
  assert.ok(seg.includes('fieldPair("team-server", "server", "text"') && seg.includes('fieldPair("team-username", "username", "text"') && seg.includes('fieldPair("team-password", "password", "password"'), "三字段（密码型）")
  assert.ok(seg.includes('t("settings.team.loggedOut")'), "未登录提示行")
  assert.ok(seg.includes('statusRowNode("team-server"') && seg.includes('statusRowNode("team-member"') && seg.includes('statusRowNode("team-label"'), "已登录三读数")
  assert.ok(seg.includes('"data-action": "settings:teamLogin"') && seg.includes('"data-action": "settings:teamLogout"'), "两动作")
  assert.ok(read("thincoder-desktop/renderer/views/settings-sections.mjs").includes('export { teamAdminBody } from "./settings-sections-team.mjs"'), "re-export")
  const view = read("thincoder-desktop/renderer/views/settings.mjs")
  assert.ok(view.includes('if (name === "team") return [sectionStateNode(model.team.state), ...(model.team.state === "ready" ? teamAdminBody(model.team) : [])]'), "段分派 + 段态门（ready 才落体）")
  assert.ok(view.includes("state: stateOf(settings.team)"), "段切片")
  const mount = read("thincoder-desktop/renderer/mount-settings.mjs")
  assert.ok(mount.includes('import { attachTeamPanel, createTeam } from "./mount-team.mjs"'), "接线族装配")
  assert.ok(mount.includes("const allReads = { ...reads, loadTeam: team.loadTeam }"), "读链并入（MODAL_READS ∥ 开面 ∥ 复读三口同源）")
  assert.ok(mount.includes("Object.assign(exits.handlers, team.handlers)"), "出口并入单一表")
  assert.equal(count(mount, /allReads\.loadTeam\(\)/g), 2, "两调用点（开面随读 ∥ config 复读）")
  assert.equal(count(mount, /team\.resetNotice\(\)/g), 2, "两面开清（页 ∥ 弹窗）")
})

test("腿9b 桌面三 IPC 通道：白名单 52（末位四）∥ HANDLERS 闭合 + 末位映射 ∥ 转口档直连核", () => {
  const preload = read("thincoder-desktop/src/preload/preload.cjs")
  const channels = [...(preload.match(/const CHANNELS = Object\.freeze\(\[([\s\S]*?)\n\]\)/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1])
  assert.equal(channels.length, 52, "白名单 52 项")
  assert.equal(new Set(channels).size, 52, "零重复项")
  assert.deepEqual(channels.slice(-4), ["team:status", "team:login", "team:logout", "team:verify"], "末位四 = 团队族")
  const registry = read("thincoder-desktop/src/main/ipc-registry.mjs")
  const block = registry.match(/const HANDLERS = Object\.freeze\(\{([\s\S]*?)\n\}\)/)?.[1] ?? ""
  const rows = [...block.matchAll(/"([^"]+)":/g)].map((m) => m[1])
  assert.equal(rows.length, 52, "HANDLERS 52 行")
  assert.deepEqual(rows.slice(-4), ["team:status", "team:login", "team:logout", "team:verify"], "表尾四行")
  assert.deepEqual([...rows].sort(), [...channels].sort(), "HANDLERS 行集 = 白名单集（闭合）")
  assert.match(block, /"team:status": teamStatusChannel,\s*\n\s*"team:login": teamLoginChannel,\s*\n\s*"team:logout": teamLogoutChannel,\s*\n\s*"team:verify": teamVerifyChannel,\s*$/, "末位映射（处理体单源）")
  const relay = read("thincoder-desktop/src/main/team.mjs")
  assert.ok(relay.includes('import { teamLogin, teamLogout, teamStatus, teamVerify } from "@thincoder/core/team.mjs"'), "转口档 = 核单源 import")
  assert.ok(relay.includes("export function teamStatusChannel()") && relay.includes("export function teamLoginChannel(payload)") && relay.includes("export function teamLogoutChannel()") && relay.includes("export async function teamVerifyChannel("), "四通道处理体导出")
})
