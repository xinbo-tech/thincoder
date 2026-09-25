/**
 * cmd-config-effort.test.mjs — `/config` effort 菜单档位构造面（#16 双 `none` 去重 · 设计
 * `docs/core/design/MODEL-SPECS.md` §14.7 AC-4 / §14.8 E-1、E-2 · 批 2026-09-25-model-specs-cleanup）。
 *
 * 断言对象 = `src/tui/cmd-config.mjs` 的 `effortMenuLevels`（唯一档位构造处——`:27`）：`none` 恒为
 * 首项且唯一、其余档序保持；空枚举不经本函数（`pickEffort` 早退——`:187`）⇒ 以源锚锁位（结构机器
 * 核形）。两个消费点的 `none` 清档语义面（add 径不落键 / edit 径删键——`:213`/`:240`）同以源锚锁
 * 「零改」。输入取真表枚举（qwen3.8-flash 首项 none / glm-5.2 末项 none / deepseek 无 none）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import { effortMenuLevels } from "../src/tui/cmd-config.mjs"
import { specForModel } from "@thincoder/core/config.mjs"

const SRC = readFileSync(new URL("../src/tui/cmd-config.mjs", import.meta.url), "utf8")

test("E-1 正常：枚举首项 none（qwen3.8-flash 形）⇒ 恒等映射（旧式会出两行 none）", () => {
  const enumList = specForModel("qwen3.8-flash").reasoningEffortEnum
  assert.equal(enumList?.[0], "none", "前提——真表枚举首项 = none")
  const levels = effortMenuLevels(enumList)
  assert.deepEqual(levels, enumList, "none 已在首位 ⇒ 档位面 = 枚举面（零增删）")
  assert.equal(levels.filter((l) => l === "none").length, 1, "none 唯一（双 none 即红）")
})

test("E-1 正常：枚举末项 none（glm-5.2 形）⇒ none 提首位，其余序保持", () => {
  const levels = effortMenuLevels(specForModel("glm-5.2").reasoningEffortEnum)
  assert.deepEqual(levels, ["none", "max", "xhigh", "high", "medium", "low", "minimal"], "none 提到首位、余序不动")
  assert.equal(new Set(levels).size, levels.length, "零重复")
})

test("E-2 边界：枚举无 none（deepseek 形）⇒ 前置 none；空/单元素 ⇒ 仅 none", () => {
  assert.deepEqual(effortMenuLevels(specForModel("deepseek-flash").reasoningEffortEnum), ["none", "low", "high", "max"])
  assert.deepEqual(effortMenuLevels([]), ["none"])
  assert.deepEqual(effortMenuLevels(undefined), ["none"], "缺枚举取空形（防御）")
})

test("E-2 边界（源锚）：空枚举在 pickEffort 早退 ⇒ 不经档位构造", () => {
  const guardAt = SRC.search(/if\s*\(!enumList\s*\|\|\s*enumList\.length\s*===\s*0\)\s*return null/)
  const ctorAt = SRC.indexOf("= effortMenuLevels(enumList)")
  assert.ok(guardAt > 0, "空枚举早退守卫在场（既有语义）")
  assert.ok(ctorAt > guardAt, "守卫早于档位构造（空枚举不进 effortMenuLevels）")
})

test("AC-4 源锚（零改）：「none」清档语义面在两个消费点原样在场", () => {
  assert.ok(/effort\s*&&\s*effort\s*!==\s*"none"/.test(SRC), "add 径：none 不落 effort 键（`:213`）")
  assert.ok(/effort\s*===\s*"none"[\s\S]{0,80}\.\.\.rest/.test(SRC), "edit 径：none ⇒ 解构剔除 effort 键（`:240`）")
})
