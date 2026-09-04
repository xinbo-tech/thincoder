/**
 * pdf-parse.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): pdf.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { builtinTools } from "../src/tools/index.mjs"
import { openPdf, decodeStreamBytes } from "../src/tools/pdf-parse-xref.mjs"
import { extractPages } from "../src/tools/pdf-parse-text.mjs"
import { GOLDEN_B64 } from "./fixtures/pdf-golden.mjs"

const byName = Object.fromEntries(builtinTools.map((t) => [t.name, t]));
const ctxOf = (dir, model) => ({ cwd: dir, agent: model ? { provider: { model } } : undefined });
const L1 = (s) => Buffer.from(s, "latin1");
const flate = (data) => deflateSync(data);
const NL = "\n";
const HELV = (enc, extra = "") => "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica" + (enc ? " /Encoding " + enc : "") + extra + " >>";
const tj = (text, font = "F1", size = 12, x = 60, y = 700) => "BT /" + font + " " + size + " Tf " + x + " " + y + " Td (" + text + ") Tj ET";
function buildClassicPdf({ objects, root = "1 0 R", encrypt = null }) {
  const chunks = [L1("%PDF-1.7\n%\u00E2\u00E3\u00CF\u00D3\n")];
  const table = new Map();
  let at = chunks[0].length;
  for (const o of objects) {
    table.set(o.n, at);
    const text = L1(o.n + " 0 obj\n" + o.body + "\nendobj\n");
    chunks.push(text);
    at += text.length;
  }
  const size = Math.max(...objects.map((o) => o.n)) + 1;
  let xrefText = "xref\n0 " + size + "\n";
  for (let i = 0; i < size; i++) {
    if (table.has(i)) xrefText += String(table.get(i)).padStart(10, "0") + " 00000 n \n";
    else xrefText += "0000000000 65535 f \n"; // every slot must appear (subsections allowed, full table simpler)
  }
  const trailer = "trailer\n<</Size " + size + " /Root " + root + (encrypt ? " /Encrypt " + encrypt : "") + ">>\n";
  return Buffer.concat([...chunks, L1(xrefText), L1(trailer), L1("startxref\n" + at + "\n%%EOF\n")]);
}
function streamBody(dictText, data) {
  const d = Buffer.isBuffer(data) ? data : L1(data);
  return "<<" + dictText + " /Length " + d.length + ">>\nstream\n" + esc(d) + "\nendstream";
}
function onePageDoc(contentOps, fontBody) {
  return [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { n: 3, body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 100 0 R>>>> /Contents 4 0 R >>" },
    { n: 4, body: streamBody("/Filter /FlateDecode", flate(L1(contentOps))) },
    { n: 100, body: fontBody },
  ];
}
const CMAP_HEAD = "/CIDInit /ProcSet findresource begin" + NL + "12 dict begin" + NL + "begincmap" + NL;
const CMAP_TAIL = "endcmap" + NL + "end" + NL + "end";
const esc = (buf) => buf.toString("latin1");

test("pdf: minimal classic xref, Flate content, page markers", async () => {
  const dir = mkdtempSync(join(tmpdir(), "pdf-test-"))
  try {
    const content = tj("Hello PDF") + NL + tj("Second line", "F1", 12, 60, 680)
    const buf = buildClassicPdf({ objects: onePageDoc(content, HELV("/WinAnsiEncoding")) })
    const doc = openPdf(buf)
    const { pages } = extractPages(doc, [1])
    assert.equal(pages[0].no, 1)
    assert.ok(pages[0].lines[0].includes("Hello PDF"), "line0 = " + pages[0].lines[0])
    assert.ok(pages[0].lines[1].includes("Second line"))
    writeFileSync(join(dir, "a.pdf"), buf)
    const out = await byName.read_pdf.execute({ path: "a.pdf", pages: "1" }, ctxOf(dir, "kimi-k3"))
    assert.match(out, /^\[read_pdf: a\.pdf/)
    assert.match(out, /--- Page 1 ---/)
    assert.ok(out.includes("Hello PDF"))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})



test("pdf: ToUnicode CMap bfchar + bfrange decode (simple font)", async () => {
  const cmapText = CMAP_HEAD +
    "1 begincodespacerange" + NL + "<00> <FF>" + NL + "endcodespacerange" + NL +
    "2 beginbfchar" + NL + "<41> <0061>" + NL + "<42> <0062>" + NL + "endbfchar" + NL +
    "1 beginbfrange" + NL + "<43> <46> <0063>" + NL + "endbfrange" + NL + CMAP_TAIL
  const objs = onePageDoc("BT /F1 12 Tf 60 700 Td <414243444546> Tj ET", HELV(null, " /ToUnicode 101 0 R"))
  objs.push({ n: 101, body: streamBody("", L1(cmapText)) })
  const doc = openPdf(buildClassicPdf({ objects: objs }))
  const { pages } = extractPages(doc, [1])
  assert.ok(pages[0].lines[0].includes("abcdef"), "got: " + pages[0].lines[0])
})



test("pdf: WinAnsi fallback + /Differences without ToUnicode", async () => {
  const enc = "<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [128 /bullet] >>"
  const objs = onePageDoc("BT /F1 12 Tf 60 700 Td (caf\u00E9\u0080) Tj ET", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding " + enc + " >>")
  const doc = openPdf(buildClassicPdf({ objects: objs }))
  const { pages } = extractPages(doc, [1])
  assert.ok(pages[0].lines[0].includes("caf\u00E9"), "winansi é: " + pages[0].lines[0])
  assert.ok(pages[0].lines[0].includes("\u2022"), "differences bullet: " + pages[0].lines[0])
})



test("pdf: Type0 / Identity-H CJK via ToUnicode bfchar", async () => {
  const cmapText = CMAP_HEAD +
    "2 begincodespacerange" + NL + "<0000> <FFFF>" + NL + "endcodespacerange" + NL +
    "2 beginbfchar" + NL + "<0028> <4F60>" + NL + "<0041> <597D>" + NL + "endbfchar" + NL + CMAP_TAIL
  const objs = onePageDoc("BT /F1 12 Tf 60 700 Td <00280041> Tj ET",
    "<< /Type /Font /Subtype /Type0 /BaseFont /AAA+SimSun /Encoding /Identity-H /DescendantFonts [101 0 R] /ToUnicode 102 0 R >>")
  objs.push(
    { n: 101, body: "<< /Type /Font /Subtype /CIDFontType2 /BaseFont /AAA+SimSun /CIDSystemInfo <</Registry (Adobe) /Ordering (GB1) /Supplement 0>> /DW 1000 >>" },
    { n: 102, body: streamBody("", L1(cmapText)) },
  )
  const doc = openPdf(buildClassicPdf({ objects: objs }))
  const { pages, warnings } = extractPages(doc, [1])
  assert.ok(pages[0].lines[0].includes("\u4F60\u597D"), "CJK got: " + pages[0].lines[0])
  assert.equal(warnings.length, 0, "no warnings: " + warnings.join(";"))
})



test("pdf: XRef stream + ObjStm (compressed-object tier)", async () => {
  const catalog = { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" }
  const pages = { n: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" }
  const stm = { n: 4, body: streamBody("/Filter /FlateDecode", flate(L1(tj("ObjStm works")))) }
  const fontBody = HELV("/WinAnsiEncoding")
  const pageBody = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 100 0 R>>>> /Contents 4 0 R >>"
  const first = 8192
  const bodies = [fontBody, pageBody]
  // spec header offsets are /First-relative (first object at 0); bodies are placed at /First
  let off = 0
  const headers = []
  for (const [n, t] of [[100, fontBody], [3, pageBody]]) { headers.push(n + " " + off); off += t.length + 1 }
  const headerText = headers.join(" ")
  const stmText = headerText + " ".repeat(Math.max(1, first - headerText.length)) + bodies.join(" ") // bodies start exactly at /First
  const objStm = { n: 10, body: streamBody("/Type /ObjStm /N 2 /First " + first, L1(stmText)) }
  const chunks = [L1("%PDF-1.7\n%\u00E2\u00E3\u00CF\u00D3\n")]
  const table = new Map()
  let at = chunks[0].length
  for (const o of [catalog, pages, stm, objStm]) {
    table.set(o.n, at)
    const t = L1(o.n + " 0 obj\n" + o.body + "\nendobj\n")
    chunks.push(t)
    at += t.length
  }
  const size = 101
  const rows = Buffer.alloc(size * 4)
  const put = (num, type, f2, f3) => { rows[num * 4] = type; rows[num * 4 + 1] = (f2 >> 8) & 0xff; rows[num * 4 + 2] = f2 & 0xff; rows[num * 4 + 3] = f3 }
  put(0, 0, 0, 0)
  for (const [n, t] of table) put(n, 1, t, 0)
  put(3, 2, 10, 1)
  put(100, 2, 10, 0)
  const xrefStream = streamBody("/Type /XRef /Size " + size + " /W [1 2 1] /Index [0 " + size + "] /Root 1 0 R /Filter /FlateDecode", flate(rows))
  const xrefChunk = L1("9 0 obj\n" + xrefStream + "\nendobj\n")
  chunks.push(xrefChunk)
  const pdf = Buffer.concat([...chunks, L1("startxref\n" + at + "\n%%EOF\n")])
  const doc = openPdf(pdf)
  const { pages: ps, warnings } = extractPages(doc, [1])
  assert.ok(ps[0].lines.some((l) => l.includes("ObjStm works")), "objstm text: " + ps[0].lines.join(" / "))
  assert.equal(warnings.length, 0, JSON.stringify(warnings))
})



test("pdf: stream filters — Flate+PNG predictor, ASCIIHex, ASCII85, LZW/unknown refusal", () => {
  const raw = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7])
  const prev = Buffer.alloc(4)
  const encoded = Buffer.alloc(10)
  for (let y = 0; y < 2; y++) {
    encoded[y * 5] = 2 // PNG predictor "Up"
    for (let i = 0; i < 4; i++) encoded[y * 5 + 1 + i] = (raw[y * 4 + i] - prev[i]) & 0xff
    raw.copy(prev, 0, y * 4, (y + 1) * 4)
  }
  const out = decodeStreamBytes(deflateSync(encoded), { Filter: "FlateDecode", DecodeParms: { Predictor: 12, Columns: 4, Colors: 1, BitsPerComponent: 8 } })
  assert.deepEqual([...out], [...raw], "PNG predictor round-trip")
  assert.equal(decodeStreamBytes(Buffer.from("4869 2079 6f75>", "latin1"), { Filter: "ASCIIHexDecode" }).toString("latin1"), "Hi you")
  assert.equal(decodeStreamBytes(Buffer.from("87cURD]j7BEbo80~>", "latin1"), { Filter: "ASCII85Decode" }).toString("latin1"), "Hello world!")
  assert.throws(() => decodeStreamBytes(Buffer.from("x"), { Filter: "LZWDecode" }), /LZW/)
  assert.throws(() => decodeStreamBytes(Buffer.from("x"), { Filter: "JPXDecode" }), /unsupported stream filter/)
})



test("pdf: encrypted PDF refused with a clear message", async () => {
  const objs = [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { n: 3, body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>" },
  ]
  const buf = buildClassicPdf({ objects: objs, encrypt: "99 0 R" })
  assert.throws(() => openPdf(buf), /encrypted|Encrypt/)
  const dir = mkdtempSync(join(tmpdir(), "pdf-test-"))
  try {
    writeFileSync(join(dir, "enc.pdf"), buf)
    await assert.rejects(() => byName.read_pdf.execute({ path: "enc.pdf" }, ctxOf(dir, "kimi-k3")), /encrypted/i)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})



test("pdf: nested page tree preserves page order", async () => {
  const objs = [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [5 0 R 6 0 R] /Count 2 >>" },
    { n: 5, body: "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>" },
    { n: 6, body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 100 0 R>>>> /Contents 7 0 R >>" },
    { n: 3, body: "<< /Type /Page /Parent 5 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 100 0 R>>>> /Contents 8 0 R >>" },
    { n: 4, body: "<< /Type /Page /Parent 5 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 100 0 R>>>> /Contents 9 0 R >>" },
    { n: 100, body: HELV("/WinAnsiEncoding") },
    { n: 7, body: streamBody("/Filter /FlateDecode", flate(L1(tj("page three", "F1", 12, 60, 600)))) },
    { n: 8, body: streamBody("/Filter /FlateDecode", flate(L1(tj("page one", "F1", 12, 60, 700)))) },
    { n: 9, body: streamBody("/Filter /FlateDecode", flate(L1(tj("page two", "F1", 12, 60, 650)))) },
  ]
  const doc = openPdf(buildClassicPdf({ objects: objs }))
  const { pages } = extractPages(doc, [1, 2, 3])
  const texts = pages.map((p) => p.lines.join(" "))
  assert.ok(texts[0].includes("page one"), texts.join(" | "))
  assert.ok(texts[1].includes("page two"))
  assert.ok(texts[2].includes("page three"))
})



test("pdf: TJ kerning & spacing adjustments on one line", async () => {
  const objs = onePageDoc("BT /F1 12 Tf 60 700 Td [(AB) 2000 (CD)] TJ ET",
    HELV("/WinAnsiEncoding", " /FirstChar 0 /Widths [" + Array(90).fill(600).join(" ") + "]"))
  const doc = openPdf(buildClassicPdf({ objects: objs }))
  const { pages } = extractPages(doc, [1])
  assert.equal(pages[0].lines[0], "AB CD", "wide TJ gap → space: " + pages[0].lines[0])
})



test("pdf: corrupt xref / truncated file → explicit error", () => {
  const objs = [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { n: 3, body: "<< /Type /Page /Parent 2 0 R >>" },
  ]
  const buf = buildClassicPdf({ objects: objs })
  const bad = Buffer.from(buf.toString("latin1").replace(/startxref\n\d+/, "startxref\n42"), "latin1")
  assert.throws(() => openPdf(bad), /xref|trailer|malformed|unreadable|invalid|unexpected token|stream without data/)
  assert.throws(() => openPdf(buf.subarray(0, buf.length - 40)), /xref|trailer|malformed|unreadable|invalid|no startxref|unexpected token/)
})



test("pdf: scanned page → multimodal image (vision) / hint degrade (text-only)", async () => {
  const jpeg = Buffer.from("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==", "base64")
  const objs = [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { n: 3, body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</XObject <</Im1 5 0 R>>>> /Contents 4 0 R >>" },
    { n: 4, body: streamBody("/Filter /FlateDecode", flate(L1("q 300 0 0 300 60 60 cm /Im1 Do Q"))) },
    { n: 5, body: streamBody("/Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode", jpeg) },
  ]
  const dir = mkdtempSync(join(tmpdir(), "pdf-test-"))
  try {
    writeFileSync(join(dir, "scan.pdf"), buildClassicPdf({ objects: objs }))
    const vis = await byName.read_pdf.execute({ path: "scan.pdf" }, ctxOf(dir, "kimi-k3"))
    const parsed = JSON.parse(vis)
    assert.ok(Array.isArray(parsed.images) && parsed.images.length === 1, "image via multimodal channel")
    assert.match(parsed.images[0].image_url.url, /^data:image\/jpeg;base64,/)
    assert.match(parsed.text, /scanned image attached/)
    const txt = await byName.read_pdf.execute({ path: "scan.pdf" }, ctxOf(dir, "deepseek-v4-pro"))
    assert.ok(!txt.includes("data:image"), "no base64 image for a text-only model")
    assert.match(txt, /has no vision/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})



test("pdf: Flate gray image converts to PNG (multimodal channel)", async () => {
  const objs = [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { n: 3, body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</XObject <</Im1 5 0 R>>>> /Contents 4 0 R >>" },
    { n: 4, body: streamBody("/Filter /FlateDecode", flate(L1("q 60 0 0 60 60 60 cm /Im1 Do Q"))) },
    { n: 5, body: streamBody("/Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode", flate(Buffer.from([0, 255, 255, 0]))) },
  ]
  const dir = mkdtempSync(join(tmpdir(), "pdf-test-"))
  try {
    writeFileSync(join(dir, "gray.pdf"), buildClassicPdf({ objects: objs }))
    const out = await byName.read_pdf.execute({ path: "gray.pdf" }, ctxOf(dir, "kimi-k3"))
    const parsed = JSON.parse(out)
    assert.match(parsed.images[0].image_url.url, /^data:image\/png;base64,iVBORw0KGgo/, "Flate gray → PNG signature")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})



test("pdf: Type3 font without ToUnicode → explicit warning (F-P3)", async () => {
  const objs = onePageDoc(tj("legacy"),
    "<< /Type /Font /Subtype /Type3 /FontBBox [0 0 100 100] /FontMatrix [0.001 0 0 0.001 0 0] /CharProcs <</g0 101 0 R>> /Encoding <</Type /Encoding /Differences [0 /g0]>> >>")
  objs.push({ n: 101, body: "<< /Length 5 >>\nstream\nxxxxx\nendstream" })
  const doc = openPdf(buildClassicPdf({ objects: objs }))
  const { warnings } = extractPages(doc, [1])
  assert.ok(warnings.some((w) => w.includes("Type3") && w.includes("ToUnicode")), "Type3 warning: " + warnings.join(";"))
})

test("pdf: LZW content stream → warning, later pages still extract (F-P3)", async () => {
  const objs = [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>" },
    { n: 3, body: "<< /Type /Page /Parent 2 0 R /Resources <</Font <</F1 100 0 R>>>> /Contents 4 0 R >>" },
    { n: 4, body: streamBody("/Filter /LZWDecode", L1("garbage")) },
    { n: 5, body: "<< /Type /Page /Parent 2 0 R /Resources <</Font <</F1 100 0 R>>>> /Contents 6 0 R >>" },
    { n: 6, body: streamBody("/Filter /FlateDecode", flate(L1(tj("after lzw page")))) },
    { n: 100, body: HELV("/WinAnsiEncoding") },
  ]
  const doc = openPdf(buildClassicPdf({ objects: objs }))
  const { pages, warnings } = extractPages(doc, [1, 2])
  assert.ok(pages[1].lines.some((l) => l.includes("after lzw page")), "second page still extracts")
  assert.ok(warnings.some((w) => w.includes("LZW")), "LZW refusal surfaced: " + warnings.join(";"))
})



test("pdf: pages parameter — selection order, cap, bad specs (F-P4)", async () => {
  const objs = [
    { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    { n: 2, body: "<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R] /Count 3 >>" },
  ]
  for (let p = 0; p < 3; p++) {
    objs.push({ n: 3 + p, body: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 100 0 R>>>> /Contents " + (10 + p) + " 0 R >>" })
    objs.push({ n: 10 + p, body: streamBody("/Filter /FlateDecode", flate(L1(tj("page number " + (p + 1))))) })
  }
  objs.push({ n: 100, body: HELV("/WinAnsiEncoding") })
  const dir = mkdtempSync(join(tmpdir(), "pdf-test-"))
  try {
    writeFileSync(join(dir, "pages.pdf"), buildClassicPdf({ objects: objs }))
    const out = await byName.read_pdf.execute({ path: "pages.pdf", pages: "3,1" }, ctxOf(dir, "kimi-k3"))
    assert.match(out, /--- Page 1 ---/)
    assert.match(out, /--- Page 3 ---/)
    assert.ok(!out.includes("Page 2 ---"), "page 2 not selected")
    assert.ok(out.indexOf("Page 1 ---") < out.indexOf("Page 3 ---"), "pages render in ascending order")
    const big = []
    for (let i = 0; i < 60; i++) big.push({ n: 200 + i, body: "<< /Type /Page /Parent 2 0 R >>" })
    const bigBuf = buildClassicPdf({
      objects: [
        { n: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
        { n: 2, body: "<< /Type /Pages /Kids [" + big.map((o) => o.n + " 0 R").join(" ") + "] /Count 60 >>" },
        ...big,
      ],
    })
    writeFileSync(join(dir, "big.pdf"), bigBuf)
    await assert.rejects(() => byName.read_pdf.execute({ path: "big.pdf" }, ctxOf(dir, "kimi-k3")), /at most 50 pages/)
    const ok60 = await byName.read_pdf.execute({ path: "big.pdf", pages: "1-50" }, ctxOf(dir, "kimi-k3"))
    assert.ok(ok60.startsWith("[read_pdf:"), "50-page selection works")
    await assert.rejects(() => byName.read_pdf.execute({ path: "pages.pdf", pages: "1-2,7" }, ctxOf(dir, "kimi-k3")), /out of range/)
    await assert.rejects(() => byName.read_pdf.execute({ path: "pages.pdf", pages: "two" }, ctxOf(dir, "kimi-k3")), /invalid pages spec/)
    await assert.rejects(() => byName.read_pdf.execute({ path: "pages.pdf", pages: "2-1" }, ctxOf(dir, "kimi-k3")), /invalid page range/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("pdf: golden — real Chrome/Edge print PDF extracts faithfully (refinement #6)", async () => {
  const buf = Buffer.from(GOLDEN_B64, "base64")
  assert.ok(buf.length > 2000, "golden fixture sane (" + buf.length + " bytes)")
  const dir = mkdtempSync(join(tmpdir(), "pdf-test-"))
  try {
    writeFileSync(join(dir, "golden.pdf"), buf)
    const doc = openPdf(buf)
    assert.equal(extractPages(doc, []).pageCount, 1)
    const out = await byName.read_pdf.execute({ path: "golden.pdf" }, ctxOf(dir, "kimi-k3"))
    for (const expected of [
      "ThinCoder read_pdf golden fixture",
      "printed from a web browser (Edge headless)",
      "Type0 CID fonts with ToUnicode bfrange CMaps",
      "the quick brown fox jumps over the lazy dog",
      "中文段落测试。日本語のテスト。한국어 테스트.",
      "alpha beta",
      "apples",
      "bananas",
    ]) {
      assert.ok(out.includes(expected), "golden text missing: " + expected + "\n--- got ---\n" + out.slice(0, 700))
    }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})



test("pdf: registered readonly + multimodal, DESC from md, read.md routes to it", () => {
  assert.ok(byName.read_pdf, "tool registered")
  assert.equal(byName.read_pdf.readonly, true)
  assert.equal(byName.read_pdf.multimodal, true)
  assert.ok(byName.read_pdf.description.includes("extract its text as plain text"), "DESC = read_pdf.md")
  assert.ok(byName.read_pdf.description.includes("pages"), "pages param documented")
  assert.ok(byName.read.description.includes("read_pdf"), "read.md routes PDFs to read_pdf")
})


