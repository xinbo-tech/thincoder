import { chromium } from "playwright-core"

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222")
const ctx = browser.contexts()[0]
const page = ctx.pages()[0]
console.log("hard reload…")
const cdp = await ctx.newCDPSession(page)
await cdp.send("Page.reload", { ignoreCache: true })
await page.waitForTimeout(7000)
const info = await page.evaluate(async () => {
  const t = await fetch("./chat.css").then((r) => r.text())
  const flow = document.querySelector(".flow")
  const blocks = [...flow.children].filter((el) => (el.getAttribute("class") || "").includes("block-"))
  const tail = blocks.slice(-14).map((el) => {
    const cls = (el.getAttribute("class") || "").replace("block block-", "")
    const mt = getComputedStyle(el).marginTop
    const lab = el.querySelector(":scope > .msg-label") ? "+签" : ""
    return `${cls}${lab}:${mt}`
  })
  return [
    `规则在盘: ${t.includes(".block + .block:is(.block-reasoning, .block-error, .block-subagent)") && !t.includes(".block + .block:is(.block-tool,")}`,
    `尾 14 块上距: ${tail.join(" | ")}`,
  ].join("\n")
})
console.log(info)
process.exit(0)
