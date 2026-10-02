/**
 * mount-onboarding.mjs — 首启向导接线族（批 B · 自 `renderer/mount-settings.mjs` 拆出 —— 300 行层拆分，
 * 零语义变化）：步进 / 收尾 / 目录出口 + 六出口族。共享项（渠道提交 / 渠道校验 / 模型候选复读）**由装配面注入**
 * （`deps` —— 单一 owner 住 `mount-settings.mjs`，本档零副本）。
 *
 * 语义锚（`docs/desktop/design/IPC.md` §2 设置族注）：
 *   ① 步号闭集 1..3（步进 = store 纯动作 `setWizardStep`；步入步 2 ⇒ 模型候选面随动）。
 *   ② 步 3 目录出口走装配面项目面链（`onProjectOpened` = `app.mjs` `openDir`，含刷新 + 「点开即可续」）
 *      —— 本档零算法副本。
 *   ③ 收尾复读配置闸（`config:read` ⇒ 三态归一）⇒ 落槽；仍未配 ⇒ 退场旗（会话内幂等，下次冷启动重新过闸）；
 *      成功判据 = 回执携布尔 `configured`（该通道无 `ok` 旗标——读失败 fail-loud 抛出；形源 = `thincoder-desktop/src/main/ipc.mjs:103-104`）。
 *   ④ 失败面零静默：目录钩缺 / 收尾读失败 ⇒ `deps.report` 落面串（表内码 / 核错误串直传，词面归视图 `reasonWord`）。
 * 纪律：零 `node:` / 零裸包 · 本档 import 只 `store.mjs` 纯动作（**零反向** —— 装配面单向往回，无环）。
 */
import { configuredFlag, dismissWizard, patchSettings, setWizardStep } from "./store.mjs"

/** 向导切片读数（缺 ⇒ 空表 —— 不猜）。 */
const wizardOf = (state) => state?.settings?.wizard ?? {}

/** 向导步 1 校验（`onVerify(null)`）：自读表单现选 —— 槽内预设选择器现值；缺 ⇒ `null`（零发送）。
 *  槽锚由调用面给（单一 owner = `SETTINGS_SLOT` 所在档）—— 本档零锚串副本。 */
export function presetValue(slot) {
  const select = document.querySelector(`${slot} select[name="name"]`)
  const value = select === null ? "" : String(select.value ?? "")
  return value === "" ? null : value
}

/**
 * 向导接线族：`deps` = `{ store, ask, report, clearReport, loadModels, submitChannel, verifyChannel,
 * onProjectOpened }`（共享项注入 ⇒ 本档零副本）；返回 `{ handlers }`（六出口 —— 与视图同域）。
 */
export function createWizard(deps = {}) {
  const { store, ask, report, clearReport, loadModels, submitChannel, verifyChannel } = deps
  const onProjectOpened = typeof deps.onProjectOpened === "function" ? deps.onProjectOpened : null

  /** 向导步 3 目录出口：走装配面项目面链（`openDir` —— 刷新 + 「点开即可续」，本档零副本）。 */
  async function pickDir() {
    if (onProjectOpened === null) {
      console.error("[renderer] project:open hook missing: wizard dir step inactive")
      report("panel", { reason: "invalid-shape" }, "project:open")
      return
    }
    clearReport()
    await onProjectOpened()
  }

  /** 向导步进（步号闭集 1..3；越界 / 等值 ⇒ store 原引用 ⇒ 零通知）；步入步 2 ⇒ 候选面随动。 */
  function nextStep() {
    const state = store.get()
    const step = Number.isInteger(wizardOf(state).step) ? wizardOf(state).step : 1
    const next = Math.min(3, Math.max(1, step) + 1)
    const stepped = setWizardStep(state, next)
    if (stepped === state) return
    store.set(stepped)
    if (next === 2) {
      const provider = state.settings?.model?.provider ?? null
      void loadModels(typeof provider === "string" && provider !== "" ? provider : null)
    }
  }

  /** 向导收尾：复读配置闸（`config:read` ⇒ 三态归一）⇒ 落槽；仍未配 ⇒ 退场旗（会话内幂等，下次冷启动重新过闸）。 */
  async function finishWizard() {
    const receipt = await ask("config:read")
    const read = typeof receipt?.configured === "boolean" // 成功判据 = 回执携布尔 configured（该通道无 ok 旗标——单源 = IPC.md §2）
    const configured = read
      ? configuredFlag(receipt.configured)
      : (store.get().settings?.configured ?? null)
    if (read) clearReport()
    else report("panel", receipt, "config:read") // 两臂互斥：失败串留面（禁「先清后报」—— 向导占槽路会把刚落的串同 tick 抹除）
    const next = patchSettings(store.get(), { configured })
    store.set(configured === true ? next : dismissWizard(next))
  }

  /** 向导出口族（六出口 —— 与视图 `handlers?.on*` 同域；前三项 = 共享项注入直通）。 */
  const handlers = {
    onSubmit: (event) => void submitChannel(event),
    onVerify: (name) => void verifyChannel(name),
    onPickDir: () => void pickDir(),
    onNext: () => nextStep(),
    onFinish: () => void finishWizard(),
    onDismiss: () => {
      const state = store.get()
      const next = dismissWizard(state)
      if (next !== state) store.set(next)
    },
  }

  return { handlers }
}
