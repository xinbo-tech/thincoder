/**
 * slow-gate-marked.mjs — D-T6 机制自验夹具：与 unmarked 同一体，但已 slow() 归册。
 * 快层（THINCODER_TEST_FULL 非 1）下 slow() 门 skip → 无 test:pass → 拦截转绿。
 * 命名不带 .test.mjs —— 同 unmarked 夹具，不被 runner glob 收集。
 */
import { slow } from "../slow.mjs"

slow("fixture: marked slow case", async () => {
  await new Promise((r) => setTimeout(r, 150))
})
