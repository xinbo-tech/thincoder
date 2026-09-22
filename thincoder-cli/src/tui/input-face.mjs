import { PassThrough } from "node:stream"
import { readFileSync } from "node:fs"
import { emitKeypressEvents } from "node:readline"
import { C } from "./ansi.mjs"
import { insertPastedText, translateShiftEnter, stripKeyboardProtocol } from "./clipboard.mjs"
import { parseMouseClicks, handleWheel, createMouseDispatch, mouseOob } from "./mouse.mjs"
import { createKeyHandler, convMaxScroll, clearAttention } from "./key-handler.mjs"
import { writeStartupSequence, writeLoadingLine, setTuiActive } from "./tui-lifecycle.mjs"

/** 输入面（2026-09-22 structure-debt §2.2 · #159）——**二段接口**：
 *  ① 早挂载工厂（本函数体 = 输入流 / raw mode / 启动序列 / 解码器 + stdin data 处理器整块）；
 *  ② 后置挂载入口 `mountKeys(deps)` / `mountMouse(deps)`——构造期读值面（createKeyHandler 构造时
 *  一次解构 ctx / createMouseDispatch 参数解构），须在原址（键盘 :455 · 鼠标 :473）调用，
 *  此时 18 + 5 键全已初始化；早挂载 ctx 以惰性取值器承接 render / pushLine / loadOlder
 *  （晚定义名——TDZ 语义逐字保持）。
 *  @param {{ state: object, render: Function, pushLine: Function, loadOlder: Function }} ctx
 *  @returns {{ keyStream: object, mountKeys: Function, mountMouse: Function }} */
export function createInputFace(ctx) {
  const { state } = ctx
  // 晚定义名转发（render / pushLine / loadOlder 于 startTUI 后段方初始化——调用点在事件回调内）
  const render = (...a) => ctx.render(...a)
  const pushLine = (...a) => ctx.pushLine(...a)
  const loadOlder = (...a) => ctx.loadOlder(...a)
  // 后置槽：鼠标两路（mountMouse 回填；挂载前 undefined = 原址 TDZ 语义——② 的调用点保持在 try 内）
  let mouseCtx
  let onMouseClick
  // Input stream goes through a filter: mouse sequences (scroll wheel) are intercepted and handled here,
  // stripped clean before passing to keypress parsing, preventing sequence fragments (e.g. "64;72;42M")
  // from leaking into the input box
  const keyStream = new PassThrough()
  let mousePending = "" // incomplete mouse sequence tail spanning chunks
  let lastRenderedScroll = 0
  emitKeypressEvents(keyStream)
  process.stdin.setRawMode(true)
  // Keyboard enhancement — enable BOTH protocols (unsupported terminals ignore them):
  // kitty push (\x1b[>1u): Shift+Enter → \x1b[13;2u (Windows Terminal 1.19+, VS Code, kitty, iTerm2)
  // modifyOtherKeys lvl 2 (\x1b[>4;2m): Shift+Enter → \x1b[27;2;13~ (mintty / Git Bash)
  // translateShiftEnter (stdin layer) maps both to \x1b\r → meta+return → multiline branch.
  writeStartupSequence()
  // 启动加载画面（2026-09-21 用户）：冷启动剩余期（memory 同步 / 索引扫描）非黑。
  // 静态读（render-frame 先例——module-load 一次 ✗ 首帧 render 覆盖本行 ✗ 无需清除逻辑）。
  {
    let v = ""
    try { v = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version } catch { /* 尽力面 */ }
    writeLoadingLine(undefined, v)
  }
  setTuiActive(true) // R25（F-R25a）：终端接管完成——置 TUI 活动态（崩溃钩子恢复判定源）

  const utf8Decoder = new TextDecoder("utf-8", { fatal: false })

  let pasteMode = false
  let pasteAccum = ""

  process.stdin.on("data", (chunk) => {
    try {

      let text = mousePending + utf8Decoder.decode(chunk, { stream: true })
      mousePending = ""

    // 第 33 批（TUI §14.3(e) 鼠标点）：stdin 数据到达即用户在场 ⇒ 清 attention 位
    // （单点覆盖下方滚轮分支与 onMouseClick；键盘入口在 key-handler）。
    clearAttention(state, render)

    // Bracketed paste: terminal wraps pasted text in \x1b[200~ ... \x1b[201~
    // Route pasted content to the active text target (question answer / input box) in one shot,
    // avoiding slow char-by-char keypress render — see insertPastedText in clipboard.mjs
    if (pasteMode) {
      const endIdx = text.indexOf("\x1b[201~")
      if (endIdx >= 0) {
        pasteAccum += text.slice(0, endIdx)
        pasteMode = false
        const pasted = pasteAccum
        pasteAccum = ""
        if (pasted) {
          insertPastedText(state, pasted)
          render()
        }
        text = text.slice(endIdx + 6)
      } else {
        pasteAccum += text
        return
      }
    }

    // Check for paste start (may appear mid-chunk alongside other input)
    const pasteStartIdx = text.indexOf("\x1b[200~")
    if (pasteStartIdx >= 0) {
      const before = text.slice(0, pasteStartIdx)
      const after = text.slice(pasteStartIdx + 6)
      const endIdx = after.indexOf("\x1b[201~")
      if (endIdx >= 0) {
        // Paste begin and end in the same chunk: insert pasted content directly
        const pasted = after.slice(0, endIdx)
        if (pasted) {
          insertPastedText(state, pasted)
          render()
        }
        text = before + after.slice(endIdx + 6)
      } else {
        // Paste spans multiple chunks: write prefix, enter paste mode
        if (before) keyStream.write(before)
        pasteMode = true
        pasteAccum = after
        return
      }
    }

    // Scroll wheel: \x1b[<64;col;rowM = up, \x1b[<65;col;rowM = down（3 lines each）
    // 2026-08-31：坐标命中展开块内容行 → 块内滚动（handleWheel）；未命中 → 会话滚动（现状）
    for (const m of text.matchAll(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/g)) {
      const button = Number(m[1])
      if (button === 64 || button === 65) {
        // F-3 sane-gate ③（RESIZE-MOUSE-LEAK-FIX）：越界 wheel 禁止会话滚动——handleWheel
        // 对越界返回未消费会穿到 fallback 滚动（mouse.mjs 内 gate 覆盖不到此路径）
        const dims = state.dims ? state.dims.get() : { cols: process.stdout.columns || 80, rows: process.stdout.rows || 24 }
        if (mouseOob(Number(m[2]), Number(m[3]), dims)) continue
        const consumed = handleWheel(mouseCtx(), button, Number(m[2]), Number(m[3]))
        if (!consumed) {
          if (button === 64) {
            state.scroll += 3
            state._followTail = false // 2026-08-31：用户上滚 = 暂停流式跟随（不抢视角）
            // 2026-08-31 用户约定修复：滚动到头自动加载（原来只挂 PgUp 键——违约）
            if (state._hasOlder && state.scroll >= convMaxScroll(state)) loadOlder()
          } else {
            state.scroll = Math.max(0, state.scroll - 3)
            if (state.scroll === 0) state._followTail = true // 滚回底部恢复跟随
          }
        }
      }
    }

    // Left-click: \x1b[<0;col;rowM → picker selection / line action menu
    for (const click of parseMouseClicks(text)) {
      try {
        onMouseClick(click.col, click.row)
      } catch (e) {
        pushLine(`[mouse] ${e.message || e}`, C.error)
        render()
      }
    }

    // Strip complete mouse sequences; keep incomplete tail for reassembly with next chunk
    text = text.replace(/\x1b\[<\d+;\d+;\d+[Mm]/g, "")
    const tail = text.match(/\x1b\[<[\d;]*$/)
    if (tail) {
      mousePending = tail[0]
      text = text.slice(0, -tail[0].length)
    }

    // Shift+Enter (keyboard-enhanced terminals) → Alt+Enter path (\x1b\r = meta+return)
    text = translateShiftEnter(text)
    text = stripKeyboardProtocol(text)

    if (state.scroll !== lastRenderedScroll) {
      lastRenderedScroll = state.scroll
      render()
    }
    if (text) keyStream.write(text)
    } catch (e) {
      pushLine(`[input-error] ${e.message || e}`, C.error)
    }
  })

  // 后置挂载入口③：键盘接线（原址 :455——18 键 deps 由调用侧按原样构造）
  function mountKeys(deps) {
    // keypress is attached to filtered keyStream: mouse sequences already intercepted and stripped upstream
    const onKeypress = createKeyHandler(deps)
    keyStream.on("keypress", (str, key) => {
      try {
        onKeypress(str, key)
      } catch (e) {
        pushLine(`[input-error] ${e.message || e}`, C.error)
        render()
      }
    })
  }

  // 后置挂载入口④：鼠标 dispatch（原址 :473——5 键 deps）
  function mountMouse(deps) {
    // 鼠标点击/滚轮 ctx 装配（mouse.mjs createMouseDispatch——D-S1a：cancelSubagent/onMouseClick/mouseCtx）
    const dispatch = createMouseDispatch(deps)
    mouseCtx = dispatch.mouseCtx
    onMouseClick = dispatch.onMouseClick
  }

  return { keyStream, mountKeys, mountMouse }
}
