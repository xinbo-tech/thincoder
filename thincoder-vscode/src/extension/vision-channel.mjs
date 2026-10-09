/**
 * vision-channel.mjs — 视觉渠道查找（**薄壳 re-export** —— parity-b4 W1 · D6）：本体核单源
 * `@thincoder/core/vision-reader.mjs`（`findVisionChannel`）。
 *
 * 判据与 `appendImagePointer` ∕ `read_image` 注册门同源（原 `specForModel(p.model).multimodal` 判定源
 * 随 2026-10-09 清除批退场——渠道不携模型；判定源重定在途，核件现行为恒 `null` ⇒ 消费方走既有
 * 「无视觉渠道」可读报错径——F-IDG-2 不静默丢图；机制全文 = `@thincoder/core/vision-reader.mjs`）。
 * 沿革：拆档产物（2026-09-22——config-io 撞行数硬限的 helper 独立档）；自持实现随 parity-b4 批迁移删，
 * 消费面 `image-handler.mjs` 已直接改指核件，本档留形（re-export）备引（仓内零 import——2026-10-09 复核）。
 */
export { findVisionChannel } from "@thincoder/core/vision-reader.mjs"
