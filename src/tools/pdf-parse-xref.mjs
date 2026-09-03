/**
 * pdf-parse-xref.mjs — read_pdf object-layer core: xref tables/streams, ObjStm,
 * stream filters + PNG predictors. Design TOOLS.md §11.2 (stages 1-4, 6) — twin-core with
 * pdf-parse-text.mjs (page tree / content ops / CMap / layout). node:zlib only. Hostile-PDF
 * discipline (refinement #8): inflate caps, chain guards, recursion limits.
 */
import { inflateSync, crc32, deflateSync } from "node:zlib";

export const MAX_FILE_BYTES = 100 * 1024 * 1024;   // whole-file guard (read_pdf tool)
export const MAX_INFLATE = 512 * 1024 * 1024;      // per-stream inflate cap (bomb guard)
export const MAX_OBJSTM_ENTRIES = 100_000;
const MAX_PREV_CHAIN = 64, MAX_RESOLVE_DEPTH = 10; // Prev-chain & resolve-depth caps

export class PdfError extends Error {
  constructor(msg, where = "") { super(where ? `${msg} (at ${where})` : msg); this.name = "PdfError"; }
}

export function inflateLimited(data, cap = MAX_INFLATE) {
  try { return inflateSync(data, { maxOutputLength: cap }); }
  catch (e) {
    if (/larger than|maximum output/i.test(e.message)) {
      throw new PdfError(`stream inflates beyond the ${Math.round(cap / 1024 / 1024)}MB safety cap — refusing to expand (possible zip bomb)`);
    }
    throw new PdfError(`invalid FlateDecode stream: ${e.message}`);
  }
}

// ─────────────────────────────── token grammar (shared with pdf-parse-text.mjs)
// Token shapes: {t:'num',n} {t:'name',s} {t:'kw',s} {t:'str'|'hex',buf} {t:'['} {t:']'} {t:'<<'} {t:'>>'}
const WS = new Set([0, 9, 10, 12, 13, 32]);
const ESC = { 110: 10, 114: 13, 116: 9, 98: 8, 102: 12 }; // \n \r \t \b \f

export function skipWs(buf, p) {
  while (p < buf.length) {
    const c = buf[p];
    if (WS.has(c)) { p++; continue; }
    if (c === 0x25) { while (p < buf.length && buf[p] !== 10 && buf[p] !== 13) p++; continue; } // % comment
    break;
  }
  return p;
}

function parseName(buf, p) { // p at '/' — returns {name, p}
  let out = "";
  p++;
  while (p < buf.length) {
    const c = buf[p];
    if (WS.has(c) || "()<>[]{}/%".includes(String.fromCharCode(c))) break;
    if (c === 0x23 && p + 2 < buf.length) { // #xx escape
      const h = parseInt(buf.toString("latin1", p + 1, p + 3), 16);
      if (Number.isFinite(h)) { out += String.fromCharCode(h); p += 3; continue; }
    }
    out += String.fromCharCode(c); p++;
  }
  return { s: out, p };
}

function parseLiteral(buf, p) { // p at '(' — escapes incl. \ddd octal; EOLs kept as-is
  const out = [];
  p++;
  let depth = 1;
  while (p < buf.length && depth > 0) {
    const c = buf[p];
    if (c === 0x5c) { // backslash
      const n = buf[p + 1];
      if (ESC[n] !== undefined) { out.push(ESC[n]); p += 2; }
      else if (n >= 0x30 && n <= 0x37) { // up to 3 octal digits
        let v = 0, i = 0;
        while (i < 3 && buf[p + 1 + i] >= 0x30 && buf[p + 1 + i] <= 0x37) { v = v * 8 + buf[p + 1 + i] - 0x30; i++; }
        out.push(v); p += 1 + i;
      } else if (n === 10 || n === 13) { // line continuation (\CRLF / \LF / \CR)
        p += n === 13 && buf[p + 2] === 10 ? 3 : 2;
        while (p < buf.length && (buf[p] === 32 || buf[p] === 9)) p++;
      } else { out.push(n); p += 2; } // per spec: backslash before other char = that char
    } else if (c === 0x28) { out.push(0x28); depth++; p++; }
    else if (c === 0x29) { depth--; if (depth > 0) out.push(0x29); p++; }
    else { out.push(c); p++; }
  }
  return { buf: Buffer.from(out), p };
}

function parseHex(buf, p) { // p at '<' NOT '<<'
  const out = [];
  let hi = -1;
  p++;
  while (p < buf.length) {
    const c = buf[p];
    if (c === 0x3e) break;
    const v = hexVal(c);
    if (v >= 0) { if (hi < 0) hi = v; else { out.push(hi * 16 + v); hi = -1; } }
    p++;
  }
  if (hi >= 0) out.push(hi * 16); // odd nibble pads with 0
  return { buf: Buffer.from(out), p: p + 1 };
}

function hexVal(c) {
  return c >= 0x30 && c <= 0x39 ? c - 0x30 : c >= 0x41 && c <= 0x46 ? c - 0x41 + 10 : c >= 0x61 && c <= 0x66 ? c - 0x61 + 10 : -1;
}

/** Full tokenizer: returns { tok, p } or { tok: null, p } at EOF. */
export function nextToken(buf, p) {
  p = skipWs(buf, p);
  if (p >= buf.length) return { tok: null, p };
  const c = buf[p];
  if (c >= 0x30 && c <= 0x39 || c === 0x2b || c === 0x2d || c === 0x2e) { // number
    const m = buf.toString("latin1", p, p + 64).match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
    return { tok: { t: "num", n: parseFloat(m[0]) }, p: p + m[0].length };
  }
  if (c === 0x2f) { const { s, p: p2 } = parseName(buf, p); return { tok: { t: "name", s }, p: p2 }; }
  if (c === 0x28) { const { buf: b, p: p2 } = parseLiteral(buf, p); return { tok: { t: "str", buf: b }, p: p2 }; }
  if (c === 0x3c) {
    if (buf[p + 1] === 0x3c) return { tok: { t: "<<", }, p: p + 2 };
    const { buf: b, p: p2 } = parseHex(buf, p);
    return { tok: { t: "hex", buf: b }, p: p2 };
  }
  if (c === 0x5b) return { tok: { t: "[", }, p: p + 1 };
  if (c === 0x5d) return { tok: { t: "]", }, p: p + 1 };
  if (c === 0x3e && buf[p + 1] === 0x3e) return { tok: { t: ">>", }, p: p + 2 };
  const m = buf.toString("latin1", p, p + 64).match(/^[A-Za-z0-9'._*+\-"]+/);
  if (m) {
    const s = m[0];
    if (s === "true") return { tok: { t: "true" }, p: p + 4 };
    if (s === "false") return { tok: { t: "false" }, p: p + 5 };
    if (s === "null") return { tok: { t: "null" }, p: p + 4 };
    return { tok: { t: "kw", s }, p: p + s.length };
  }
  return { tok: { t: "kw", s: String.fromCharCode(c) }, p: p + 1 };
}

// ─────────────────────────────── value parsing
/** Parse one object value from buf at p → { v, p }. Values: plain objects for
 *  dicts (name-keyed), arrays, strings→{b:Buffer}, numbers, refs {r:[num,gen]}. */
export function parseValue(buf, p, depth = 0) {
  if (depth > 40) throw new PdfError("object nesting too deep (cycle?)");
  const { tok, p: p2 } = nextToken(buf, p);
  if (!tok) throw new PdfError("unexpected end of data while parsing object");
  switch (tok.t) {
    case "num": {
      const q = skipWs(buf, p2), t2 = nextToken(buf, q); // lookahead: "N G R" → indirect reference
      if (t2.tok && t2.tok.t === "num" && Number.isInteger(tok.n) && Number.isInteger(t2.tok.n)) {
        const t3 = nextToken(buf, skipWs(buf, t2.p));
        if (t3.tok && t3.tok.t === "kw" && t3.tok.s === "R") return { v: { r: [tok.n, t2.tok.n] }, p: t3.p };
      }
      return { v: tok.n, p: p2 };
    }
    case "<<": {
      const d = {};
      let p3 = p2;
      for (;;) {
        const k = skipWs(buf, p3);
        const { tok: t, p: p4 } = nextToken(buf, k);
        if (t && t.t === ">>") return { v: d, p: p4 };
        if (!t || t.t !== "name") throw new PdfError(`dict key expected, got ${t ? t.t : "EOF"}`);
        const { v, p: p5 } = parseValue(buf, p4, depth + 1);
        d[t.s] = v; p3 = p5;
      }
    }
    case "[": {
      const a = [];
      let p3 = p2;
      for (;;) {
        const { tok: t, p: pk } = nextToken(buf, p3);
        if (!t) throw new PdfError("array unterminated");
        if (t.t === "]") return { v: a, p: pk };
        const { v, p: p4 } = parseValue(buf, p3, depth + 1); // re-reads from p3 — tokenizer is pure
        a.push(v); p3 = p4;
      }
    }
    case "name": return { v: tok.s === "" ? "?" : tok.s, p: p2 };
    case "str": case "hex": return { v: { b: tok.buf }, p: p2 };
    case "true": return { v: true, p: p2 };
    case "false": return { v: false, p: p2 };
    case "null": return { v: null, p: p2 };
    default: throw new PdfError(`unexpected token ${tok.t} where a value was expected`);
  }
}

// ─────────────────────────────── xref machinery
/** Read a dictionary + optional stream data starting at p ("N G obj" already consumed).
 *  Stream length: /Length (possibly indirect) is resolved by caller (doc.resolveLen). */
function readDictAndStream(buf, p, dictLenResolver) {
  const { v: dict, p: p2 } = parseValue(buf, p);
  const { tok, p: p3 } = nextToken(buf, p2);
  if (tok && tok.t === "kw" && tok.s === "stream") {
    let dataStart = p3;
    if (buf[dataStart] === 13) dataStart += buf[dataStart + 1] === 10 ? 2 : 1;
    else if (buf[dataStart] === 10) dataStart++;
    const len = dictLenResolver(dict);
    if (!Number.isInteger(len) || len < 0 || dataStart + len > buf.length) {
      throw new PdfError(`stream /Length ${len} invalid (offset ${dataStart}, file ${buf.length} bytes)`);
    }
    return { dict, stream: buf.slice(dataStart, dataStart + len), p: dataStart + len };
  }
  return { dict, stream: null, p: p2 };
}

function parseXrefSection(buf, p) { // classic "xref" table; returns { entries, p } (p at trailer dict)
  const entries = new Map();
  for (;;) {
    const a = skipWs(buf, p);
    const { tok: t1, p: p1 } = nextToken(buf, a);
    if (t1 && t1.t === "num") {
      const { tok: t2, p: p2 } = nextToken(buf, p1);
      if (!(t2 && t2.t === "num" && Number.isInteger(t1.n) && Number.isInteger(t2.n))) {
        throw new PdfError(`xref subsection header malformed (got ${t1.n}, ${t2 ? t2.t : "EOF"})`);
      }
      const start = t1.n, count = t2.n;
      let q = p2;
      for (let i = 0; i < count; i++) {
        const m = buf.toString("latin1", q).match(/^\s*(\d{10})\s(\d{5})\s([nf])/);
        if (!m) throw new PdfError(`xref row ${i} malformed near offset ${q}`);
        entries.set(start + i, { type: m[3] === "n" ? 1 : 0, gen: parseInt(m[2]), off: parseInt(m[1]) });
        q += m[0].length;
      }
      p = q;
    } else {
      if (!(t1 && t1.t === "kw" && t1.s === "trailer")) throw new PdfError(`"trailer" expected after xref rows, got ${t1 ? t1.t : "EOF"}`);
      return { entries, p: p1 };
    }
  }
}

// ─────────────────────────────── document
export function openPdf(buf) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  if (buf.length > MAX_FILE_BYTES) throw new PdfError(`PDF too large (${Math.round(buf.length / 1024 / 1024)}MB > ${MAX_FILE_BYTES / 1024 / 1024}MB)`);
  const head = buf.indexOf("%PDF-");
  if (head < 0 || head > 2048) throw new PdfError("not a PDF — %PDF- header not found (file may be truncated or not a PDF)");
  const verM = buf.toString("latin1", head, head + 8).match(/%PDF-(\d+\.\d+)/);
  const trailerSeen = new Set();

  const rawTrailer = () => { // last "startxref" — tolerates trailing garbage
    const tail = buf.toString("latin1");
    const sx = tail.lastIndexOf("startxref");
    if (sx < 0) throw new PdfError("no startxref found — damaged file");
    const num = tail.slice(sx + 9).match(/(\d+)/);
    const off = num ? parseInt(num[1]) : NaN;
    if (!Number.isFinite(off) || off < 0 || off > buf.length) throw new PdfError(`startxref offset invalid (${num ? num[1] : "?"})`);
    return off;
  };

  const sectionFrom = (off) => {
    const { tok, p } = nextToken(buf, off);
    if (tok && tok.t === "kw" && tok.s === "xref") { // classic table
      const { entries, p: pT } = parseXrefSection(buf, p);
      let dict;
      try { ({ v: dict } = parseValue(buf, pT)); }
      catch { throw new PdfError("trailer dict unreadable"); }
      return { kind: "classic", entries, trailer: dict };
    }
    // xref stream: "N G obj <<…>> stream" (some writers omit the obj header)
    let q = off;
    if (tok && tok.t === "num") {
      const { tok: t2, p: p2 } = nextToken(buf, p);
      if (t2 && t2.t === "num") {
        const { tok: t3, p: p3 } = nextToken(buf, p2);
        if (t3 && t3.t === "kw" && t3.s === "obj") q = p3;
      }
    }
    const { dict, stream } = readDictAndStream(buf, q, (d) => {
      if (!d.Length) return 0;
      if (typeof d.Length === "number") return d.Length;
      throw new PdfError("xref stream /Length is an indirect reference — v1 refuses rather than guess (vanishingly rare)");
    });
    if (!stream) throw new PdfError("xref stream without stream data");
    if (!Array.isArray(dict.W) || dict.W.length < 3) throw new PdfError(`object at xref offset is neither a classic xref table nor an xref stream (/W missing)`);
    // entries from xref stream (unfilter the stream — filters live in its own dict)
    const data = decodeStreamBytes(stream, dict);
    const W = dict.W; // [w1 w2 w3]
    const idx = dict.Index || [0, dict.Size];
    const width1 = W[0] ?? 1, width2 = W[1] ?? 2, width3 = W[2] ?? 1;
    const rowLen = width1 + width2 + width3;
    const entries = new Map();
    for (let i = 0; i + 1 < idx.length; i += 2) {
      const base = idx[i], count = idx[i + 1];
      for (let j = 0; j < count; j++) {
        const rp = (base - idx[0] + j) * rowLen;
        const type = width1 === 0 ? 1 : data[rp];
        const f2 = width2 === 0 ? 0 : readUint(data, rp + width1, width2);
        const f3 = width3 === 0 ? 0 : readUint(data, rp + width1 + width2, width3);
        entries.set(base + j, { type, off: type === 1 ? f2 : 0, gen: type === 1 ? f3 : 0, objstm: type === 2 ? f2 : 0, idx: type === 2 ? f3 : 0 });
      }
    }
    return { kind: "stream", entries, trailer: dict };
  };

  const startOff = rawTrailer();
  let cur = startOff;
  const merged = new Map(); // entry map: first-seen (newest) wins
  let trailer = null;
  for (let depth = 0; cur != null && depth < MAX_PREV_CHAIN; depth++) {
    if (trailerSeen.has(cur)) throw new PdfError("cyclic /Prev xref chain");
    trailerSeen.add(cur);
    const sec = sectionFrom(cur);
    for (const [k, v] of sec.entries) if (!merged.has(k)) merged.set(k, v);
    if (!trailer) trailer = sec.trailer;
    const prev = sec.trailer.Prev;
    if (typeof prev === "number") cur = prev;
    else if (prev && prev.r) cur = prev.r[0];
    else cur = null;
    // hybrid-reference: /XRefStm in a classic trailer → parse that stream too (newer entries win)
    const xstm = sec.trailer.XRefStm;
    if (typeof xstm === "number" && sec.kind === "classic") {
      try { for (const [k, v] of sectionFrom(xstm).entries) merged.set(k, v); } catch { /* optional hybrid — classic table already usable */ }
    }
  }
  if (!trailer || typeof trailer !== "object") throw new PdfError("no usable trailer");
  const encrypt = trailer.Encrypt;
  if (encrypt != null) {
    throw new PdfError(`PDF is encrypted (/Encrypt present) — refusing extraction. Decrypt the document first (e.g. remove the password / run through a PDF tool), then re-run read_pdf.`);
  }
  const rootRef = trailer.Root && trailer.Root.r ? trailer.Root.r : null;
  if (!rootRef) throw new PdfError("trailer /Root missing — not a page-oriented PDF?");

  const doc = {
    buf, version: verM ? verM[1] : null, xref: merged, trailer,
    objStmCache: new Map(), // objstm num → Map(innerNum → value) resolved lazily
  };

  const getObjStream = (stmNum, depth = 0) => {
    if (depth > MAX_RESOLVE_DEPTH) throw new PdfError("object stream nesting too deep (ObjStm cycle?)");
    if (doc.objStmCache.has(stmNum)) return doc.objStmCache.get(stmNum);
    const e = doc.xref.get(stmNum);
    if (!e || e.type !== 1) throw new PdfError(`object stream ${stmNum} not found`);
    const { dict, stream } = readObjectAt(stmNum, e);
    const data = decodeStreamBytes(stream, dict);
    if (dict.Type && dict.Type !== "ObjStm") throw new PdfError(`object ${stmNum} is not an ObjStm`);
    const n = dict.N, first = dict.First;
    if (!Number.isInteger(n) || n < 0 || n > MAX_OBJSTM_ENTRIES || !Number.isInteger(first)) throw new PdfError(`ObjStm /N /First invalid (${n}, ${first})`);
    // header pairs (objnum offset) then object bodies
    const inner = new Map();
    const pairs = [];
    let q = 0;
    for (let i = 0; i < n; i++) {
      const nm = data.toString("latin1", q).match(/^\s*(\d+)\s+(\d+)/);
      if (!nm) throw new PdfError(`ObjStm header row ${i} malformed`);
      pairs.push([parseInt(nm[1]), parseInt(nm[2])]);
      q += nm[0].length;
    }
    pairs.sort((a, b) => a[1] - b[1]);
    for (const [num, at] of pairs) {
      // spec/pdf.js/mupdf: header offsets are relative to /First (first object usually at 0);
      // tolerate absolute offsets (some writers) via the fallback — primary must match the spec
      try { const { v } = parseValue(data, first + at); inner.set(num, v); }
      catch { try { const { v } = parseValue(data, at); inner.set(num, v); } catch { inner.set(num, null); } } // one broken object shouldn't kill the stream
    }
    doc.objStmCache.set(stmNum, inner);
    return inner;
  };

  function readObjectAt(num, entry) {
    // entries point at "N G obj" — skip the header (tolerate offsets pointing straight at the dict)
    let p = entry.off;
    const a = nextToken(buf, p), b = a.tok && a.tok.t === "num" ? nextToken(buf, a.p) : null, c = b && b.tok && b.tok.t === "num" ? nextToken(buf, b.p) : null;
    if (a.tok && a.tok.t === "num" && c && c.tok && c.tok.t === "kw" && c.tok.s === "obj") p = c.p;
    return readDictAndStream(doc.buf, p, (d) => d.Length === undefined ? -1 : (typeof d.Length === "number" ? d.Length : doc.resolve(d.Length) ?? -1));
  }

  doc.resolve = (ref, depth = 0) => {
    if (ref == null) return null;
    if (typeof ref !== "object") return ref;
    if (!ref.r) return ref;
    const [num, gen] = ref.r;
    if (depth > MAX_RESOLVE_DEPTH) throw new PdfError(`indirect reference chain too deep at object ${num}`);
    const e = doc.xref.get(num);
    if (!e) throw new PdfError(`object ${num} referenced but absent from xref`);
    if (e.type === 0) throw new PdfError(`object ${num} is a free xref entry`);
    if (e.type === 2) {
      const inner = getObjStream(e.objstm, depth + 1);
      const v = inner.get(num);
      if (v === undefined) throw new PdfError(`object ${num} missing from ObjStm ${e.objstm}`);
      return v;
    }
    const { dict, stream } = readObjectAt(num, e);
    if (stream) return { dict, stream };
    return dict;
  };
  doc.isStreamObj = (v) => v && typeof v === "object" && Buffer.isBuffer(v.stream) && v.dict;
  doc.getStreamData = (dictOrStreamObj) => {
    const { dict, stream } = Buffer.isBuffer(dictOrStreamObj.stream) ? dictOrStreamObj : { dict: dictOrStreamObj, stream: dictOrStreamObj.stream };
    return { dict, raw: stream, data: decodeStreamBytes(stream, dict) };
  };
  return doc;
}
function readUint(data, p, width) {
  let v = 0;
  for (let i = 0; i < width; i++) v = v * 256 + (data[p + i] || 0);
  return v;
}

// ─────────────────────────────── stream filters (stage 6)
/** Filter chain per PDF: /Filter applied in listed order → decode in REVERSE.
 *  LZW: refused with a clear error (design F-P3). DecodeParms indexed or single. */
export function decodeStreamBytes(streamBuf, dict) {
  let data = Buffer.from(streamBuf);
  const F = dict.Filter;
  const filters = typeof F === "string" ? [F] : Array.isArray(F) ? F.slice() : [];
  const DP = dict.DecodeParms;
  const parms = filters.map((_, i) => (Array.isArray(DP) ? (DP[i] ?? null) : DP || null));
  for (let i = filters.length - 1; i >= 0; i--) data = applyFilter(data, filters[i], parms[i]); // decode in REVERSE order
  return data;
}

function applyFilter(data, name, parms) {
  switch (name) {
    case "FlateDecode": case "Fl": {
      let out = inflateLimited(data);
      const p = parms && parms.Predictor ? parms : null;
      if (p && p.Predictor > 1) out = applyPredictor(out, p);
      return out;
    }
    case "ASCIIHexDecode": case "AHx": {
      const out = [];
      let hi = -1;
      for (const c of data) {
        if (c === 0x3e) break;
        const v = hexVal(c);
        if (v < 0) continue;
        if (hi < 0) hi = v; else { out.push(hi * 16 + v); hi = -1; }
      }
      if (hi >= 0) out.push(hi * 16);
      return Buffer.from(out);
    }
    case "ASCII85Decode": case "A85": return ascii85Decode(data);
    case "LZWDecode": case "LZW": throw new PdfError("LZWDecode streams are refused (design F-P3 — LZW unsupported in v1)");
    default: throw new PdfError(`unsupported stream filter /${name} (design F-P3 — explicit refusal, no silent garbage)`);
  }
}

function ascii85Decode(data) {
  const out = [];
  let q = [];
  const flush = () => {
    let n = 0;
    for (const d of q) n = n * 85 + d;
    for (let i = 0; i < q.length - 1; i++) out.push((n >>> (24 - i * 8)) & 0xff);
  };
  for (const c of data) {
    if (c === 0x7e) { if (q.length) flush(); break; } // ~>
    if (c === 0x7a && q.length === 0) out.push(0, 0, 0, 0); // z
    else if (c >= 0x21 && c <= 0x75) q.push(c - 0x21);
    if (q.length === 5) { flush(); q = []; }
  }
  return Buffer.from(out);
}

/** PNG predictors (10/11/12/13/14/15) and TIFF predictor (2). */
function applyPredictor(data, parms) {
  const colors = parms.Colors || 1, bpc = parms.BitsPerComponent || 8, columns = parms.Columns || 1;
  const bpp = Math.max(1, Math.ceil(colors * bpc / 8));
  const rowLen = Math.ceil(columns * colors * bpc / 8);
  const out = Buffer.alloc(data.length);
  let prev = Buffer.alloc(rowLen);
  let p = 0, o = 0;
  const pred = parms.Predictor;
  if (pred === 2) { // TIFF
    while (p < data.length) {
      const row = data.slice(p, p + rowLen); p += rowLen;
      for (let i = 0; i < rowLen; i++) { row[i] = row[i] + (i >= bpp ? row[i - bpp] : 0) & 0xff; out[o++] = row[i]; }
    }
    return out.slice(0, o);
  }
  while (p < data.length) {
    const ft = data[p++];
    const row = data.slice(p, p + rowLen); p += rowLen;
    const cur = Buffer.from(row);
    if (ft >= 1 && ft <= 4) {
      for (let i = 0; i < rowLen; i++) {
        const left = i >= bpp ? cur[i - bpp] : 0;
        const up = prev[i];
        const ul = i >= bpp ? prev[i - bpp] : 0;
        let v = row[i];
        if (ft === 1) v = (v + left) & 0xff;
        else if (ft === 2) v = (v + up) & 0xff;
        else if (ft === 3) v = (v + ((left + up) >> 1)) & 0xff;
        else { const pv = left + up - ul; const pa = Math.abs(pv - left), pb = Math.abs(pv - up), pc = Math.abs(pv - ul); v = (v + (pa <= pb && pa <= pc ? left : pb <= pc ? up : ul)) & 0xff; }
        cur[i] = v;
      }
    }
    prev = cur;
    o += cur.copy(out, o);
  }
  return out.slice(0, o);
}

/** Minimal PNG encoder for extracted Flate image samples (gray/RGB 8-bit — design §11.3.2); zero-dep via node:zlib. */
export function encodePng(samples, width, height, colors) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colors === 1 ? 0 : 2; // grayscale / truecolor (no alpha in v1)
  const stride = width * colors;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 0; samples.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const body = Buffer.concat([Buffer.from(type, "latin1"), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(body) >>> 0, 0); return Buffer.concat([len, body, c]); };
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
