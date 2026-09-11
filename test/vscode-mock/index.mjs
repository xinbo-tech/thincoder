/**
 * Local mock of the "vscode" module — used ONLY by node --test runs.
 * The real module is provided by the VS Code extension host at runtime.
 * Everything here is a safe no-op default; tests import it but do not
 * assert on its behavior (keep it that way — assert on your logic, not
 * on the mock).
 */

export const workspace = {
  workspaceFolders: [],
  getConfiguration: () => ({ get: () => undefined }),
  fs: {
    readFile: async () => new Uint8Array(0),
    writeFile: async () => {},
    stat: async () => ({ type: 1 }),
  },
  onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
  // File-system watcher (config-watch.mjs — B5 batch 21): registrations land in
  // workspace.fileSystemWatchers; tests drive them with watcher._fire(kind, uri).
  fileSystemWatchers: [],
  createFileSystemWatcher: (pattern) => {
    const w = {
      pattern,
      disposed: false,
      _listeners: { change: [], create: [], delete: [] },
      onDidChange: (fn) => { w._listeners.change.push(fn); return { dispose: () => {} } },
      onDidCreate: (fn) => { w._listeners.create.push(fn); return { dispose: () => {} } },
      onDidDelete: (fn) => { w._listeners.delete.push(fn); return { dispose: () => {} } },
      _fire: (kind, uri) => { if (w.disposed) return; for (const fn of w._listeners[kind] ?? []) fn(uri) },
      dispose: () => { w.disposed = true },
    }
    workspace.fileSystemWatchers.push(w)
    return w
  },
  // Editor-edit dual channel (tools/shared.mjs): tests stub textDocuments and
  // capture applyEdit calls. applyEdit must actually APPLY the recorded edits
  // so the doc's text reflects them (the real host applies them synchronously).
  textDocuments: [],
  applyEditCalls: [],
  applyEdit: async (edit) => {
    workspace.applyEditCalls.push(edit)
    for (const { uri, range, newText } of edit._edits ?? []) {
      const doc = workspace.textDocuments.find((d) => d.uri.fsPath === uri.fsPath)
      doc?._applyEdit?.(range, newText)
    }
    return true
  },
  // openTextDocument / diff preview support
  openTextDocument: async (arg) => ({ uri: arg?.uri ?? arg, content: arg?.content ?? "", language: arg?.language ?? "" }),
  registerTextDocumentContentProvider: (scheme, provider) => {
    (workspace._contentProviders ??= new Map()).set(scheme, provider)
    return { dispose: () => workspace._contentProviders.delete(scheme) }
  },
}

export class Range {
  constructor(startLine, startCol, endLine, endCol) {
    this.start = { line: startLine, character: startCol }
    this.end = { line: endLine, character: endCol }
  }
}

export class Position {
  constructor(line, character) { this.line = line; this.character = character }
}

export class Selection {
  constructor(anchor, active) { this.anchor = anchor; this.active = active }
}

export class WorkspaceEdit {
  constructor() { this._edits = [] }
  replace(uri, range, newText) { this._edits.push({ uri, range, newText }) }
  insert(uri, position, newText) { this._edits.push({ uri, range: { start: position, end: position }, newText }) }
}

export const window = {
  showInformationMessage: async () => undefined,
  showWarningMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  withProgress: async (_opts, task) => task({ report: () => {} }, { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) }),
  createOutputChannel: () => ({ appendLine: () => {}, show: () => {}, dispose: () => {} }),
  activeTextEditor: undefined,
  onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
  createWebviewPanel: () => ({
    webview: { html: "", onDidReceiveMessage: () => ({ dispose: () => {} }), postMessage: async () => true },
    onDidDispose: () => ({ dispose: () => {} }),
    reveal: () => {},
    dispose: () => {},
  }),
  // Terminal API (bash tool terminal modes) — tests stub these per case
  terminals: [],
  activeTerminal: undefined,
  createTerminal: () => { throw new Error("stub window.createTerminal in your test") },
  onDidChangeTerminalShellIntegration: () => ({ dispose: () => {} }),
  // Window focus state (notify.mjs) + text editor (openFile)
  state: { focused: true },
  showTextDocument: async (doc) => ({ document: doc, selection: null, revealRange: () => {} }),
  // tab groups (context tool) — safe no-op default
  tabGroups: { all: [] },
}

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
  executeCommand: async () => undefined,
}

export const env = {
  clipboard: { readText: async () => "", writeText: async () => {} },
  machineId: "mock-machine",
  uiKind: 1,
}

export class Uri {
  constructor(scheme, path) {
    this.scheme = scheme
    this.path = path
    this.fsPath = path
  }
  static file(p) { return new Uri("file", p) }
  static parse(s) { const u = new URL(s); return new Uri(u.protocol.slice(0, -1), u.pathname) }
  toString() { return `${this.scheme}://${this.path}` }
  with() { return this }
}

/** RelativePattern (config-watch.mjs — B5 batch 21): transparent carrier of
 *  (base, pattern) so tests can assert what a watcher was registered on. */
export class RelativePattern {
  constructor(base, pattern) {
    this.base = base
    this.pattern = pattern
  }
}

export class CancellationTokenSource {
  constructor() { this.token = { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) } }
  cancel() { this.token.isCancellationRequested = true }
  dispose() {}
}

export class EventEmitter {
  constructor() { this.listeners = [] }
  fire(e) { for (const l of this.listeners) l(e) }
  event(listener) { this.listeners.push(listener); return { dispose: () => {} } }
}

export class Progress { report() {} }

export const ProgressLocation = { Notification: 1, Window: 2, Task: 3 }

export const ViewColumn = { Active: -1, Beside: -2, One: 1 }

export const ThemeIcon = class {
  constructor(id) { this.id = id }
}

export const l10n = { t: (s) => s }

export const workspaceState = { get: () => undefined, update: async () => {} }
export const globalState = { get: () => undefined, update: async () => {} }

export const languages = { createDiagnosticCollection: () => ({ dispose: () => {} }), getDiagnostics: () => [] }

export const ExtensionMode = { Production: 1, Development: 2, Test: 3 }

export const version = "1.85.0-mock"
