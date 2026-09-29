/**
 * vision-channel.mjs — 视觉渠道查找（**薄壳 re-export** —— parity-b4 W1 · D6）：本体核单源
 * `@thincoder/core/vision-reader.mjs`（`findVisionChannel`）。
 *
 * 判据与 `appendImagePointer` ∕ `read_image` 注册门同源：`specForModel(p.model).multimodal`；
 * 选序 = 「优先同名（当前主）渠道的视觉默认模型 → 首视觉渠道」。
 * 沿革：拆档产物（2026-09-22——config-io 撞行数硬限的 helper 独立档）；自持实现随本批迁移删，
 * 消费面 `image-handler.mjs` 已直接改指核件，本档留形（re-export）备引。
 */
export { findVisionChannel } from "@thincoder/core/vision-reader.mjs"
