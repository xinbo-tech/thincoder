// check-dist-fixture.mjs — P1 三态夹具（合成 asar——不依赖真打包；父侧直执行件）
// 三态：ok（两包在场 + 版本逐字 ⇒ 绿）· missing-core（缺核条目 ⇒ 红）· bad-version（核版本不符 ⇒ 红）
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = "D:/teamcode/thincoder";
const coreSrc = JSON.parse(readFileSync(join(ROOT, "thincoder-core/package.json"), "utf8")).version;
const rcSrc = JSON.parse(readFileSync(join(ROOT, "thincoder-render-core/package.json"), "utf8")).version;
console.log("[src] @thincoder/core", coreSrc, "| @thincoder/render-core", rcSrc, "\n");

const buildAsar = (coreV, rcV) => {
  const contents = [];
  const mkFile = (json) => {
    const buf = Buffer.from(json, "utf8");
    const rec = { size: buf.length, offset: 0, buf };
    contents.push(rec);
    return rec;
  };
  const coreRec = coreV === null ? null : mkFile(JSON.stringify({ name: "@thincoder/core", version: coreV }));
  const rcRec = rcV === null ? null : mkFile(JSON.stringify({ name: "@thincoder/render-core", version: rcV }));
  const buildJson = () => {
    const files = {};
    if (coreRec) files["core"] = { files: { "package.json": { size: coreRec.size, offset: String(coreRec.offset).padStart(12, "0") } } };
    if (rcRec) files["render-core"] = { files: { "package.json": { size: rcRec.size, offset: String(rcRec.offset).padStart(12, "0") } } };
    return JSON.stringify({ files: { node_modules: { files: { "@thincoder": { files } } } } });
  };
  const len1 = Buffer.byteLength(buildJson(), "utf8"); // pass 1（offset=0 定长）
  let cursor = 16 + len1;
  for (const r of contents) { r.offset = cursor; cursor += r.size; }
  const json = buildJson();
  const jsonLen = Buffer.byteLength(json, "utf8");
  if (jsonLen !== len1) throw new Error(`json length drift: ${jsonLen} vs ${len1}`);
  const out = Buffer.alloc(16 + jsonLen + contents.reduce((a, r) => a + r.size, 0));
  out.writeUInt32LE(4, 0);
  out.writeUInt32LE(8 + jsonLen, 4);
  out.writeUInt32LE(0, 8);
  out.writeUInt32LE(jsonLen, 12);
  out.write(json, 16, "utf8");
  for (const r of contents) r.buf.copy(out, r.offset);
  return out;
};

const cases = [
  ["ok", coreSrc, rcSrc, 0],
  ["missing-core", null, rcSrc, 1],
  ["bad-version", "0.0.0-fake", rcSrc, 1],
];
let allPass = true;
for (const [name, cv, rv, wantExit] of cases) {
  const dir = mkdtempSync(join(tmpdir(), `cd-${name}-`));
  mkdirSync(join(dir, "win-unpacked", "resources"), { recursive: true });
  writeFileSync(join(dir, "win-unpacked", "resources", "app.asar"), buildAsar(cv, rv));
  let code = 0;
  let out = "";
  try {
    out = execFileSync(process.execPath, [join(ROOT, "thincoder-desktop/scripts/check-dist.mjs"), dir], { encoding: "utf8" });
  } catch (e) {
    code = e.status ?? 1;
    out = String(e.stdout ?? "") + String(e.stderr ?? "");
  }
  const pass = code === wantExit;
  allPass = allPass && pass;
  console.log(`[${name}] exit=${code} (want ${wantExit}) ${pass ? "✓" : "✗"}`);
  console.log(out.trim().split("\n").map((l) => "   " + l).join("\n"), "\n");
  rmSync(dir, { recursive: true, force: true });
}
console.log(allPass ? "ALL PASS" : "FAIL");
process.exit(allPass ? 0 : 1);
