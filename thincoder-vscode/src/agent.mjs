/**
 * agent.mjs — VSC 主循环退役（2026-09-29 parity-b1 · 批档 §2.3 件 1）：depth-0 循环本体归核
 * `@thincoder/core/agent.mjs` `runAgent(agent, text, callbacks, opts)`；端壳侧 = host 装配
 * （`./agent/setup.mjs` 的 `hydrateRun` ∕ `setupAgentRun`）+ 端 adapter 键（`opts.injections` ∕
 * `opts.turnDomainText` ∕ `opts.distillSignal` ∕ `opts.toolDecorate`——B7 3b：尾块键退役）。
 * 本档只保留既有 import 面转口：`ContinueError`（核单类——现盘零消费者：端壳续跑判定已归核
 * `continueDecision`（#677 · I10））。
 */
export { ContinueError } from "@thincoder/core/agent/helpers.mjs"
