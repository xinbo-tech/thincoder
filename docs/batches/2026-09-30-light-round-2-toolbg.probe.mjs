import { chromium } from "playwright-core"

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222")
const ctx = browser.contexts()[0]
const page = ctx.pages()[0]

const head = await page.$(".tool-head")
if (!head) { console.log("无 .tool-head"); process.exit(0) }
await head.scrollIntoViewIfNeeded()
await head.hover()
await page.waitForTimeout(400)
const r = await head.evaluate((el) => ({
  hover: el.matches(":hover"),
  bg: getComputedStyle(el).backgroundColor,
  disabled: el.disabled ?? null,
  tag: el.tagName,
  rect: el.getBoundingClientRect().toJSON(),
}))
console.log(JSON.stringify(r, null, 2))

// 比对：未 hover 的第二个头行
const others = await page.evaluate(() => {
  const hs = [...document.querySelectorAll(".tool-head")]
  const nh = hs.find((h) => !h.matches(":hover"))
  return nh ? `对照组（未 hover）底: ${getComputedStyle(nh).backgroundColor}` : "无对照组"
})
console.log(others)

// 悬停令牌现值
const toks = await page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement)
  return `--hover-bg: ${cs.getPropertyValue("--hover-bg")} ∥ --overlay: ${cs.getPropertyValue("--overlay")}`
})
console.log(toks)
process.exit(0)
