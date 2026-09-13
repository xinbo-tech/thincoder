/**
 * Minimal vscode mock for unit testing in plain Node.js.
 * Copied to node_modules/vscode/index.mjs before running tests.
 */
export const workspace = {
  openTextDocument: async (_path) => {},
  textDocuments: [],
  applyEdit: async () => true,
  workspaceFolders: null,
  getConfiguration: () => ({ get: () => ({}) }),
  findFiles: async () => [],
}
export const window = {
  showTextDocument: async () => {},
  showWarningMessage: async () => {},
  showErrorMessage: async () => {},
  showInputBox: async () => {},
  createOutputChannel: () => ({ appendLine() {}, show() {}, dispose() {} }),
  createQuickPick: () => ({ show() {}, dispose() {}, onDidAccept() {}, onDidHide() {} }),
  createStatusBarItem: () => ({ show() {}, dispose() {} }),
  activeTextEditor: null,
  createWebviewPanel: () => ({
    webview: {
      html: "",
      postMessage() {},
      onDidReceiveMessage() {},
      asWebviewUri: (u) => u,
      cspSource: "http://localhost",
    },
    reveal() {},
    onDidDispose() {},
    dispose() {},
  }),
}
export const Uri = {
  file: (p) => ({ fsPath: p, toString: () => p }),
  parse: (s) => ({ fsPath: s }),
}
export const ViewColumn = { One: 1, Two: 2, Three: 3 }
export const StatusBarAlignment = { Right: 1, Left: 2 }
export const ConfigurationTarget = { Global: 1 }
export const commands = {
  registerCommand: () => ({ dispose() {} }),
}
export const Range = class {
  constructor(sl, sc, el, ec) { this.start = { line: sl, character: sc }; this.end = { line: el, character: ec } }
}
export const WorkspaceEdit = class {
  constructor() { this._edits = [] }
  replace(uri, range, text) { this._edits.push({ uri, range, text }) }
}
