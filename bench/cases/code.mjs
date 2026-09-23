/**
 * cases/code.mjs — 代码维 3 例（题面逐字冻结 = 设计档 §5.2；改题 ⇒ SUITE_VERSION + 1）。
 *
 * AC-5 隐藏用例机制（KD-3）：题面只给公开 1 例 + 规则；隐藏断言（5 条/题）只住本档的判分器，
 * 题面零泄漏；判分 = `vmRun` 实跑（4s 超时）+ 追加断言脚本。读题面即知判据的硬编码实现拿不到分。
 */

import { vmRun } from "../lib/grade.mjs"

export const CODE_ASSERTS = {
  "code.1": `
__check("size=1 → 每元素一组", () => __eq(chunkEven([1, 2, 3], 1), [[1], [2], [3]]))
__check("size > arr.length → [arr]", () => __eq(chunkEven([1, 2], 5), [[1, 2]]))
__check("[] → []", () => __eq(chunkEven([], 2), []))
__check("size=0 → 抛 RangeError", () => __throws(() => chunkEven([1], 0), "RangeError"))
__check("size=-3 → 抛 RangeError", () => __throws(() => chunkEven([1], -3), "RangeError"))
`,
  "code.2": `
__check("[2,3,4] → 6", () => __eq(sumEven([2, 3, 4]), 6))
__check("[] → 0", () => __eq(sumEven([]), 0))
__check("[1,3] → 0", () => __eq(sumEven([1, 3]), 0))
__check("[0] → 0", () => __eq(sumEven([0]), 0))
__check("[-2,5] → -2（负偶数计入）", () => __eq(sumEven([-2, 5]), -2))
`,
  "code.3": `
__check("空串 → {}", () => __eq(parsePairs(""), {}))
__check("重复键 → 后者覆盖", () => __eq(parsePairs("x=1;x=2"), { x: "2" }))
__check("空段跳过", () => __eq(parsePairs("a=1;;b=2"), { a: "1", b: "2" }))
__check("k= → {k:\\"\\"}", () => __eq(parsePairs("k="), { k: "" }))
__check("值保持字符串（前导零保真）", () => __eq(parsePairs("n=007"), { n: "007" }))
`,
}

export const cases = [
  {
    id: "code.1",
    dim: "code",
    class: "normal",
    prompt: "用 JavaScript 实现函数 `chunkEven(arr, size)`：把数组按 size 切分为多个子数组并返回二维数组；`size` 小于 1 时抛出 `RangeError`。公开例：`chunkEven([1,2,3,4,5], 2) → [[1,2],[3,4],[5]]`。只输出函数代码，不要示例调用与解释。",
    build: null,
    callOpts: {},
    mechRubric: "`chunkEven(arr, size)` 语义 = 按 size 切分；`size < 1` 抛 `RangeError`；以实跑隐藏断言为准（5 条：size=1 / 超长 / 空数组 / size=0 / size=−3）。",
    grade: (result) => vmRun(result.text, CODE_ASSERTS["code.1"]),
  },
  {
    id: "code.2",
    dim: "code",
    class: "error",
    prompt: "下面的函数在边界输入下行为不正确，请修复并只输出修复后的完整函数代码。\n\n```js\nfunction sumEven(nums){ let t=0; for (let i=1; i<nums.length; i++){ if (nums[i]%2===0 && nums[i]>0) t+=nums[i] } return t }\n```\n\n语义 = 求数组中所有偶数之和。",
    build: null,
    callOpts: {},
    mechRubric: "修复后 `sumEven` 须对全部偶数（含 0 与负数）求和；以 5 条实跑断言为准。",
    grade: (result) => vmRun(result.text, CODE_ASSERTS["code.2"]),
  },
  {
    id: "code.3",
    dim: "code",
    class: "boundary",
    prompt: '用 JavaScript 实现函数 `parsePairs(text)`：`text` 形如 `"a=1;b=2"`，返回 `{a:"1", b:"2"}`；规则①空串 → `{}`；②重复键 → 后者覆盖；③不含 `=` 的段 → 跳过；④值保持字符串。公开例：`parsePairs("a=1;b=2") → {a:"1", b:"2"}`。只输出函数代码。',
    build: null,
    callOpts: {},
    mechRubric: "`parsePairs(text)` 四规则（空串→`{}` / 重复键后者覆盖 / 无 `=` 段跳过 / 值保持字符串）；以 5 条实跑断言为准。",
    grade: (result) => vmRun(result.text, CODE_ASSERTS["code.3"]),
  },
]
