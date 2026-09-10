/**
 * deepseek-v41-specs.test.mjs — DeepSeek V4.1-Flash 接入（第 6 批——PROVIDER.md §20.1 T30–T34/T38）：
 * 新行 `deepseek-flash` 字段契约（T30）+ 两退役名参数随行（T31）+ 前缀优先级（T32——各名命中
 * 自身行，新行不抢先）+ read_image 门行为面（T33 放行 / T34 pro 保守锚）+ T38 pro 只读字段锚。
 * 纯查表 + 工具直调（真 PNG 落 tmp——无网络——快层）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { specForModel, specMatch } from "../src/model-specs.mjs"
import { readImageTool } from "../src/tools/file.mjs"

// §19.2（a）契约逐字段（CLI 侧 10 字段；VSC 侧另多 reasoningEffortDefault）
const CONTRACT = {
  context: 1_000_000,
  maxOutput: 384_000,
  thinking: true,
  prefixMode: true,
  multimodal: true,
  cacheMode: "auto",
  thinkApi: "type",
  reasoningEcho: "required",
  reasoningEffortEnum: ["low", "high", "max"],
  tempRange: [0, 2],
}
const V41_ROWS = ["deepseek-flash", "deepseek-v4-flash", "deepseek-v4-flash-vision-exp"]
// F-3 逐字锚（IMAGE-DOWNGRADE-VISION——read-image-guide.test.mjs 同款）
const GUIDE = "模型不支持图像——可 spawn 一个视觉模型子代理（subagent model 参数指视觉渠道）用 read_image 读图"

function assertContract(name) {
  const spec = specForModel(name)
  for (const [k, v] of Object.entries(CONTRACT)) assert.deepEqual(spec[k], v, `${name}.${k} = 契约值`)
  assert.deepEqual(Object.keys(spec).sort(), Object.keys(CONTRACT).sort(), `${name} 字段集 = 契约（无多余/缺失键）`)
}

test("T30 新行字段契约：`deepseek-flash` 命中本行（非 DEFAULT）且逐字段 = §19.2（a）（R11）", () => {
  assertContract("deepseek-flash")
  assert.equal(specMatch("deepseek-flash").matched, true, "命中真实行（非 DEFAULT 兜底）")
})

test("T31 退役名参数随行：`deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` 逐字段 = 契约（R12/R13）", () => {
  assertContract("deepseek-v4-flash")
  assertContract("deepseek-v4-flash-vision-exp")
})

test("T32 前缀优先级：三名各自命中自身行（新行不抢先——长度降序 + 第 10 字符分叉）", () => {
  for (const name of V41_ROWS) assert.equal(specMatch(name).matched, true, `${name} 命中（非 DEFAULT）`)
  assert.equal(specForModel("deepseek-flash").context, 1_000_000, "新名查得真规格（不再降级 DEFAULT 128K）")
})

test("T33 read_image 门放行（R11/R12 行为面）：新名与退役名均注入 images（tmp 真 PNG）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-dsv41-"))
  try {
    // 1×1 PNG（真图像字节——与 VSC image-downgrade 夹具同源）
    const png = join(dir, "tiny.png")
    writeFileSync(png, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"))
    for (const name of ["deepseek-flash", "deepseek-v4-flash"]) {
      const out = await readImageTool.execute({ path: png }, { cwd: dir, agent: { provider: { model: name } } })
      const parsed = JSON.parse(out)
      assert.equal(parsed.images.length, 1, `${name}：图像 part 注入（门不触发）`)
      assert.ok(parsed.images[0].image_url.url.startsWith("data:image/png;base64,"), `${name}：data URL`)
      assert.ok(!out.includes(GUIDE), `${name}：视觉放行不触发引导`)
    }
  } finally {
    try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

test("T34/T38 pro 保守锚：read_image 仍拒（含引导句）+ 只读字段零改（R14/N5）", async () => {
  // 门在文件读取前 throw（pre-IO）——路径无需存在
  await assert.rejects(
    readImageTool.execute({ path: "shot.png" }, { cwd: tmpdir(), agent: { provider: { model: "deepseek-v4-pro" } } }),
    (e) => {
      assert.ok(e.message.includes("does not support image input"), "现错误文案保留")
      assert.ok(e.message.includes(GUIDE), "F-3 引导句逐字在")
      return true
    })
  const pro = specForModel("deepseek-v4-pro")
  assert.ok(!pro.multimodal, "不加 multimodal（视觉能力未核实——保守）")
  assert.equal(pro.context, 1_000_000, "context 零改")
  assert.equal(pro.maxOutput, 384_000, "maxOutput 零改")
  assert.equal(pro.prefixMode, true, "prefixMode 零改")
  assert.deepEqual(pro.reasoningEffortEnum, ["low", "high", "max"], "effort enum 零改")
})
