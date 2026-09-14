/**
 * read-image-guide.test.mjs — IMAGE-DOWNGRADE-VISION F-3（CLI 镜像——软引导）：
 * 非视觉模型 read_image 错误文案含引导句（逐字锚照抄设计档——可 spawn 视觉渠道子代理）；
 * 视觉模型不触发（零回归——现 multimodal 注入路径 intact）。纯工具直调——无网络——快层。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readImageTool } from "@thincoder/core/tools/file.mjs"

// F-3 逐字锚（设计档照抄——字节级一致）
const GUIDE = "模型不支持图像——可 spawn 一个视觉模型子代理（subagent model 参数指视觉渠道）用 read_image 读图"

const run = (model, pngPath, cwd) => readImageTool.execute({ path: pngPath }, { cwd, agent: { provider: { model } } })

test("F-3 非视觉模型 read_image → 错误含引导句（spawn 视觉子代理——软引导不静默）", async () => {
  // 门在文件读取前 throw（pre-IO）——路径无需存在
  await assert.rejects(run("deepseek-v4-pro", "shot.png", tmpdir()), (e) => {
    assert.ok(e.message.includes("does not support image input"), "现错误文案保留（首行）")
    assert.ok(e.message.includes(GUIDE), "引导句逐字在（F-3）")
    return true
  })
})

test("F-3 视觉模型零回归：kimi-k3 read_image → 正常注入（images payload——门不触发）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-rig-"))
  try {
    const png = join(dir, "tiny.png")
    writeFileSync(png, Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"))
    const out = await run("kimi-k3", png, dir)
    const parsed = JSON.parse(out)
    assert.equal(parsed.images.length, 1, "multimodal 注入 intact")
    assert.ok(parsed.images[0].image_url.url.startsWith("data:image/png;base64,"), "image part 正常")
    assert.ok(!out.includes(GUIDE), "视觉模型不触发引导")
  } finally {
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})
