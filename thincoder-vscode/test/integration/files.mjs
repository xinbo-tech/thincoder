/**
 * files.mjs — 集成清单（登记即跑；`docs/design/TESTING.md` §3 登记制边界）。
 *
 * 域界：`test/integration/` = ②③ 集成常驻域（寿命分界在目录——顶层 `test/*.test.mjs` 是
 * ① 单元域）；本清单 = 集成目标集合的单一来源，与单元清单 `test/files.mjs` **互不混入**
 * （集成档只登这里；单元清单零含集成档——run-integration.mjs 启动自检机械兜底）。
 * 纪律：集成档不得 `import` slow.mjs（无快层执行面，执行面 = `npm run test:integration`
 * 入口自身）——新增档在此登记，漏登记 = 启动自检失败（不静默跳过）。
 */
export default [
  "test/integration/scenario-01-normal-tool-flow.test.mjs",
  "test/integration/scenario-02-eng-chain.test.mjs",
  "test/integration/scenario-03-subagent-lifecycle.test.mjs",
  "test/integration/scenario-04-session-recovery.test.mjs",
  "test/integration/scenario-05-panel-basics.test.mjs",
  "test/integration/scenario-06-commit-verify.test.mjs",
  "test/integration/scenario-07-config-routing.test.mjs",
  "test/integration/host-shape-spawn.test.mjs",
  "test/integration/vsc-autoapprove-field.test.mjs",
  "test/integration/vsc-spawn-ctx-permission.test.mjs",
]
