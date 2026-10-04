/**
 * 2026-10-04-acp-user-docs.test.mjs — 批内件（ACP 用户文档批 · 台账 #916 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-04-acp-user-docs.md` §2.6（测试面）∥ §2.3（十四节大纲与详度定标）
 * ∥ §2.7 A1/A2（验收对照）；README 目标逐字 = `docs/cli/design/ACP-CLIENT.md` §11.6（`:596`）。
 *
 * 面（跨仓只读——先例 = `docs/batches/2026-10-02-desktop-release-stage2.test.mjs` 腿⑤）：
 *   腿 ① 页结构十四节（页头导读块 ∥ 12 具名节标题 ∥ 页尾两链接）；
 *   腿 ② 关键短语（as-of 行 ∥ `--login` ∥ `10MB` ∥ 降级标记串）；
 *   腿 ③ 链接目标（站仓侧五目标 = 三内链 docs/features/install → `acp.html` 且在盘 ＋ 页尾两链接（文档页 ∥ 协议官网——在腿①）；本腿另核 sitemap 行）；
 *   腿 ④ README 链接目标（改指逐字行 ∥ 旧设计档指向绝迹 ∥ 登录句零改）；
 *   腿 ⑤ 三宿主配置片段逐字保留（A1）；腿 ⑥ A1 行数带 [300,420]。
 * 站仓页腿（①–③、⑤⑥）= 父侧站仓扩容轮在飞——首跑允许暂红，轮落定后复跑应转绿。
 * 本件不进仓套件（批内件 · 随批留存）；跑法（任意 cwd —— 路径按本档自身位置解析）：
 *   node --test docs/batches/2026-10-04-acp-user-docs.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"

const repoURL = (p) => new URL(`../../${p}`, import.meta.url) // 本仓 = thincoder/（本档上两级）
const siteURL = (p) => new URL(`../../../thincoder.com/www/${p}`, import.meta.url) // 站仓 www/
const site = (p) => readFileSync(siteURL(p), "utf8")

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
/** 节标题判据：h2 起始文本段含目标名（` · ` 容错 U+00B7 ∕ U+30FB 与空格两态）。 */
const h2Re = (title) => new RegExp(`<h2[^>]*>[^<]*${esc(title).replace(/ · /g, "\\s*[·・]\\s*")}`)

const SECTIONS = [
  "前置条件", "能力一览",
  "快速接入 · Zed", "快速接入 · JetBrains", "快速接入 · Paseo",
  "登录与凭据", "会话管理", "配置选项", "@文件引用", "子代理活动",
  "故障排查", "限制与路线图",
]

test("腿① 页结构十四节：页头导读块 ∥ 12 具名节标题 ∥ 页尾两链接（文档页 ∥ 协议官网）", () => {
  const html = site("acp.html")
  const missing = []

  const headStart = html.indexOf('<div class="page-header">')
  const headEnd = html.indexOf("<main")
  const head = headStart >= 0 && headEnd > headStart ? html.slice(headStart, headEnd) : ""
  if (!/<h1[^>]*>/.test(head) || !/<p[^>]*>/.test(head)) missing.push("页头导读（h1 + 定位句）")

  for (const title of SECTIONS) if (!h2Re(title).test(html)) missing.push(title)

  const start = html.indexOf("<main")
  const end = html.indexOf("</main>")
  const main = start >= 0 && end > start ? html.slice(start, end) : ""
  const tail = main.slice(-2000) // 页尾区 = main 末窗（形状无关——防排版改动假红）
  if (!/href="docs\.html"/.test(tail) || !/agentclientprotocol\.com/.test(tail)) missing.push("页尾两链接")

  assert.deepEqual(missing, [], `缺节：${missing.join(" ∥ ")}`)
})

test("腿② 关键短语：as-of 行 ∥ `thincoder acp --login` ∥ `10MB` ∥ 降级标记串", () => {
  const html = site("acp.html")
  const checks = [
    ["as-of 行", /本页内容更新于[^<]{0,40}\d/],
    ["`thincoder acp --login`", /thincoder acp --login/],
    ["`10MB`", /10\s?MB/],
    ["降级标记串", /\[File reference:[^\]\n]{0,160}—[^\]\n]{0,160}\]/],
    ["stderr 诊断面", /stderr/],
    ["日志捕获命令", /thincoder acp 2&gt; acp\.log/],
  ]
  const missing = checks.filter(([, re]) => !re.test(html)).map(([name]) => name)
  assert.deepEqual(missing, [], `缺短语：${missing.join(" ∥ ")}`)
})

test("腿③ 链接目标：三内链（docs ∥ features ∥ install → acp.html）且在盘 ∥ sitemap 行", () => {
  assert.ok(existsSync(siteURL("acp.html")), "目标在盘：thincoder.com/www/acp.html")
  const missing = []
  for (const page of ["docs.html", "features.html", "install.html"]) {
    if (!/href="acp\.html"/.test(site(page))) missing.push(`${page} → acp.html`)
  }
  if (!site("sitemap.xml").includes("https://thincoder.com/acp.html")) missing.push("sitemap 行")
  assert.deepEqual(missing, [], `缺链接目标：${missing.join(" ∥ ")}`)
})

test("腿④ README 链接目标：改指逐字行 ∥ 旧设计档指向绝迹 ∥ 登录句零改", () => {
  const readme = readFileSync(repoURL("thincoder-cli/README.md"), "utf8")
  assert.match(readme, /^  - Setup: \[ACP 接入指南\]\(https:\/\/thincoder\.com\/acp\.html\)$/m,
    "逐字目标行（链接段 = `docs/cli/design/ACP-CLIENT.md` §11.6 `:596` 目标；`  - ` bullet 形态保留）")
  assert.ok(!/ACP-CLIENT\.md/.test(readme), "旧设计档指向（任意形态）绝迹")
  assert.ok(readme.includes("thincoder acp --login"), "登录句（`:61`）零改在")
})

test("腿⑤ 三宿主配置片段逐字保留（A1）：Zed ∥ JetBrains ∥ Paseo", () => {
  const html = site("acp.html")
  const snippets = [
    ["Zed", '{ "agent_servers": { "ThinCoder": { "type": "custom", "command": "thincoder", "args": ["acp"], "env": {} } }'],
    ["JetBrains", '{ "agent_servers": { "ThinCoder": { "command": "C:\\\\path\\\\to\\\\thincoder.exe", "args": ["acp"], "env": {} } }'],
    ["Paseo", '{ "agents": { "providers": { "thincoder": { "extends": "acp", "label": "ThinCoder", "command": ["thincoder", "acp"] } } }'],
  ]
  const missing = snippets.filter(([, text]) => !html.includes(text)).map(([name]) => name)
  assert.deepEqual(missing, [], `片段漂移：${missing.join(" ∥ ")}`)
})

test("腿⑥ A1 行数带：acp.html 行数 ∈ [300,420]（口径 = split('\\n')）", () => {
  const lines = site("acp.html").split("\n").length
  assert.ok(lines >= 300 && lines <= 420, `行数 ${lines} 出带 [300,420]（A1）`)
})