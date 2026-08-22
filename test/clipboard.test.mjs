/**
 * clipboard.mjs tests — buildWindowsClipboardCommand (TUI.md §9.2D, IK9UWM).
 */
import { test } from "node:test"
import assert from "node:assert/strict"

import { buildWindowsClipboardCommand } from "../src/tui/clipboard.mjs"

test("buildWindowsClipboardCommand forces UTF-8 output for Get-Clipboard", () => {
  assert.deepEqual(buildWindowsClipboardCommand(), [
    "-NoProfile",
    "-Command",
    "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard",
  ])
})