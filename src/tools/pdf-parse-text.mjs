/**
 * pdf-parse-text.mjs — read_pdf text-layer core: page tree, content-stream operator walk,
 * glyph decoding (ToUnicode CMap → WinAnsi/Standard/MacRoman + /Differences), (x,y) layout
 * with light x-cluster columns (TOOLS.md §11.2 stages 5/7/8/9, §11.3.3). Tables cross-checked vs Unicode.org + pdf.js.
 */
import { PdfError, nextToken, skipWs, decodeStreamBytes } from "./pdf-parse-xref.mjs";

const MAX_PAGE_NODES = 10_000;
const MAX_FORM_DEPTH = 16;

// ── page tree (stage 5) ─────────────────────────────
function collectPageRefs(doc, ref, out, seen) {
  if (out.length > MAX_PAGE_NODES) throw new PdfError("page tree exceeds safety limit");
  const key = ref.r.join(",");
  if (seen.has(key)) throw new PdfError("cyclic page tree");
  seen.add(key);
  const node = doc.resolve(ref);
  if (!node || typeof node !== "object") throw new PdfError(`page-tree node ${ref.r[0]} unreadable`);
  if (node.Type === "Page" || (node.Type === undefined && node.Kids === undefined && node.Contents !== undefined)) out.push(ref);
  else if (Array.isArray(node.Kids)) for (const k of node.Kids) collectPageRefs(doc, k, out, new Set([...seen]));
  else throw new PdfError(`page-tree node ${ref.r[0]} (${node.Type || "?"}) has no /Kids`);
}

/** Merge /Resources down the parent chain (page → root Pages), child wins per key. */
function pageResources(doc, pageRef) {
  const merged = {};
  const chain = [];
  let ref = pageRef, depth = 0;
  while (ref && depth++ < 64) {
    const node = doc.resolve(ref);
    if (!node || typeof node !== "object") break;
    chain.unshift(node);
    ref = node.Parent && node.Parent.r ? node.Parent : null;
  }
  for (const node of chain) {
    if (node.Resources && typeof node.Resources === "object" && !node.Resources.r) {
      const r = doc.resolve(node.Resources);
      for (const k of Object.keys(r)) if (!(k in merged)) merged[k] = r[k];
    }
  }
  return merged;
}

// ── encoding tables (stage 8 fallbacks) ─────────────
const WINANSI_OVERRIDES = { 0x80: "\u20AC", 0x82: "\u201A", 0x83: "\u0192", 0x84: "\u201E", 0x85: "\u2026", 0x86: "\u2020", 0x87: "\u2021", 0x88: "\u02C6", 0x89: "\u2030", 0x8A: "\u0160", 0x8B: "\u2039", 0x8C: "\u0152", 0x8E: "\u017D", 0x91: "\u2018", 0x92: "\u2019", 0x93: "\u201C", 0x94: "\u201D", 0x95: "\u2022", 0x96: "\u2013", 0x97: "\u2014", 0x98: "\u02DC", 0x99: "\u2122", 0x9A: "\u0161", 0x9B: "\u203A", 0x9C: "\u0153", 0x9E: "\u017E", 0x9F: "\u0178" };
const UNDEFINED = new Set([0x81, 0x8D, 0x8F, 0x90, 0x9D]);

const MACROMAN_HIGH = "\u00C4\u00C5\u00C7\u00C9\u00D1\u00D6\u00DC\u00E1\u00E0\u00E2\u00E4\u00E3\u00E5\u00E7\u00E9\u00E8\u00EA\u00EB\u00ED\u00EC\u00EE\u00EF\u00F1\u00F3\u00F2\u00F4\u00F6\u00F5\u00FA\u00F9\u00FB\u00FC\u2020\u00B0\u00A2\u00A3\u00A7\u2022\u00B6\u00DF\u00AE\u00A9\u2122\u00B4\u00A8\u2260\u00C6\u00D8\u221E\u00B1\u2264\u2265\u00A5\u00B5\u2202\u2211\u220F\u03C0\u222B\u00AA\u00BA\u03A9\u00E6\u00F8\u00BF\u00A1\u00AC\u221A\u0192\u2248\u2206\u00AB\u00BB\u2026\u00A0\u00C0\u00C3\u00D5\u0152\u0153\u2013\u2014\u201C\u201D\u2018\u2019\u00F7\u25CA\u00FF\u0178\u2044\u00A4\u2039\u203A\uFB01\uFB02\u2021\u00B7\u201A\u201E\u2030\u00C2\u00CA\u00C1\u00CB\u00C8\u00CD\u00CE\u00CF\u00CC\u00D3\u00D4\uF8FF\u00D2\u00DA\u00DB\u00D9\u0131\u02C6\u02DC\u00AF\u02D8\u02D9\u02DA\u00B8\u02DD\u02DB\u02C7";

const STANDARD_HIGH = { 0xA1: "exclamdown", 0xA2: "cent", 0xA3: "sterling", 0xA4: "fraction", 0xA5: "yen", 0xA6: "florin", 0xA7: "section", 0xA8: "currency", 0xA9: "quotesingle", 0xAA: "quotedblleft", 0xAB: "guillemotleft", 0xAC: "guilsinglleft", 0xAD: "guilsinglright", 0xAE: "fi", 0xAF: "fl", 0xB1: "endash", 0xB2: "dagger", 0xB3: "daggerdbl", 0xB4: "periodcentered", 0xB6: "paragraph", 0xB7: "bullet", 0xB8: "quotesinglbase", 0xB9: "quotedblbase", 0xBA: "quotedblright", 0xBB: "guillemotright", 0xBC: "ellipsis", 0xBD: "perthousand", 0xBF: "questiondown", 0xC1: "grave", 0xC2: "acute", 0xC3: "circumflex", 0xC4: "tilde", 0xC5: "macron", 0xC6: "breve", 0xC7: "dotaccent", 0xC8: "dieresis", 0xCA: "ring", 0xCB: "cedilla", 0xCD: "hungarumlaut", 0xCE: "ogonek", 0xCF: "caron", 0xD0: "emdash", 0xE1: "AE", 0xE3: "ordfeminine", 0xE8: "Lslash", 0xE9: "Oslash", 0xEA: "OE", 0xEB: "ordmasculine", 0xF1: "ae", 0xF5: "dotlessi", 0xF8: "lslash", 0xF9: "oslash", 0xFA: "oe", 0xFB: "germandbls" };
const GLYPH_CHAR = { exclamdown: "\u00A1", cent: "\u00A2", sterling: "\u00A3", fraction: "\u2044", yen: "\u00A5", florin: "\u0192", section: "\u00A7", currency: "\u00A4", quotesingle: "'", quotedblleft: "\u201C", guillemotleft: "\u00AB", guilsinglleft: "\u2039", guilsinglright: "\u203A", fi: "\uFB01", fl: "\uFB02", endash: "\u2013", dagger: "\u2020", daggerdbl: "\u2021", periodcentered: "\u00B7", paragraph: "\u00B6", bullet: "\u2022", quotesinglbase: "\u201A", quotedblbase: "\u201E", quotedblright: "\u201D", guillemotright: "\u00BB", ellipsis: "\u2026", perthousand: "\u2030", questiondown: "\u00BF", grave: "`", acute: "\u00B4", circumflex: "\u02C6", tilde: "\u02DC", macron: "\u00AF", breve: "\u02D8", dotaccent: "\u02D9", dieresis: "\u00A8", ring: "\u02DA", cedilla: "\u00B8", hungarumlaut: "\u02DD", ogonek: "\u02DB", caron: "\u02C7", emdash: "\u2014", AE: "\u00C6", ordfeminine: "\u00AA", Lslash: "\u0141", Oslash: "\u00D8", OE: "\u0152", ordmasculine: "\u00BA", ae: "\u00E6", dotlessi: "\u0131", lslash: "\u0142", oslash: "\u00F8", oe: "\u0153", germandbls: "\u00DF", quoteright: "\u2019", quoteleft: "\u2018", space: " " };
const SYMBOLIC = /^([A-Z]{6}\+)?(Symbol|ZapfDingbats)$/;

function decodeUTF16BE(b) {
  try { return new TextDecoder("utf-16be").decode(b); }
  catch {
    let s = "";
    for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode((b[i] << 8) | b[i + 1]);
    return s;
  }
}

/** ActualText / a PDF text string: UTF-16BE (BOM) or UTF-8 (BOM), else latin1. */
function decodeActual(b) {
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) return decodeUTF16BE(b.slice(2));
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return new TextDecoder("utf-8").decode(b.slice(3));
  if (b.length >= 4 && b[0] === 0 && b[1] !== 0) return decodeUTF16BE(b);
  return b.toString("latin1");
}

/** Content-stream property dict (BDC operands) — flat top level, nested values skipped. */
function parseDictInline(data, p) {
  const dict = {};
  for (;;) {
    const t = nextToken(data, p);
    if (!t.tok) throw new PdfError("unterminated inline dict");
    p = t.p;
    if (t.tok.t === ">>") return { dict, after: p };
    if (t.tok.t !== "name") continue;
    const v = nextToken(data, p);
    if (!v.tok) throw new PdfError("unterminated inline dict value");
    p = v.p;
    if (v.tok.t === "str" || v.tok.t === "hex") dict[t.tok.s] = { b: v.tok.buf };
    else if (v.tok.t === "num") dict[t.tok.s] = v.tok.n;
    else if (v.tok.t === "name") dict[t.tok.s] = v.tok.s;
    else if (v.tok.t === "true" || v.tok.t === "false") dict[t.tok.s] = v.tok.t === "true";
    else if (v.tok.t === "[" || v.tok.t === "<<") { // nested — skip to matching closer
      const close = v.tok.t === "[" ? "]" : ">>";
      let depth = 1;
      while (depth > 0) {
        const t2 = nextToken(data, p);
        if (!t2.tok) break;
        p = t2.p;
        if (t2.tok.t === v.tok.t) depth++;
        else if (t2.tok.t === close) depth--;
      }
    }
  }
}

// ── CMap (ToUnicode: codespaces / bfchar / bfrange) ──
function parseCMap(data) {
  const single = new Map();
  const ranges = [];
  let codeWidth = 0, p = 0;
  const codeOf = (tok) => { if (!tok) throw new PdfError("CMap truncated"); return tok.buf.length === 1 ? tok.buf[0] : (tok.buf[0] << 8) | (tok.buf[1] || 0); };
  const utf16 = (b) => b.length >= 2 ? decodeUTF16BE(b) : String.fromCharCode(b[0]);
  while (p < data.length) {
    const { tok, p: np } = nextToken(data, p);
    if (!tok) throw new PdfError("CMap truncated");
    p = np; // always advance — non-section keywords must not stall the loop
    if (tok.t !== "kw") continue;
    if (tok.s === "begincodespacerange") {
      const t1 = nextToken(data, p);
      const lo = t1.tok && t1.tok.buf ? t1.tok.buf.length : 0;
      if (lo === 1) codeWidth = 1;
      else if (lo === 2) codeWidth = 2;
    }
    if (tok.s !== "beginbfchar" && tok.s !== "beginbfrange") continue;
    for (;;) {
      const t1 = nextToken(data, skipWs(data, p));
      if (!t1.tok) throw new PdfError("CMap unterminated");
      if (t1.tok.t === "kw" && /^end/.test(t1.tok.s)) { p = t1.p; break; }
      const t2 = nextToken(data, t1.p);
      const t3 = nextToken(data, t2.p);
      if (tok.s === "beginbfchar") { // <src> <dst>
        single.set(codeOf(t1.tok), utf16(t2.tok.buf));
        p = t2.p;
      } else if (t3.tok && t3.tok.t === "[") { // <lo> <hi> [dst …]
        const lo = codeOf(t1.tok), hi = codeOf(t2.tok);
        let q = t3.p, code = lo;
        for (;;) {
          const dt = nextToken(data, q);
          if (!dt.tok || dt.tok.t === "]") { q = dt.p; break; }
          if (dt.tok.t === "str" || dt.tok.t === "hex") single.set(code, utf16(dt.tok.buf));
          code++; q = dt.p;
          if (code > hi) break;
        }
        p = q;
      } else { // <lo> <hi> <dst>
        const lo = codeOf(t1.tok), hi = codeOf(t2.tok), dst = t3.tok.buf;
        if (hi < lo) throw new PdfError("CMap bfrange reversed");
        if (dst.length <= 2) ranges.push({ lo, hi, base: dst.length === 1 ? dst[0] : (dst[0] << 8) | dst[1] });
        else single.set(lo, utf16(dst)); // 4+ byte dst: single-char range only
        p = t3.p;
      }
    }
  }
  return { single, ranges, codeWidth };
}

// ── fonts: resource dict → decode plan ──────────────
function loadFont(doc, fontValue) {
  const f = doc.resolve(fontValue);
  if (!f || typeof f !== "object") return null;
  const info = { type0: f.Subtype === "Type0", baseFont: f.BaseFont, cmap: null, enc: null, diffs: null, widths: null, firstChar: 0, wRanges: null, dw: 1000, symbolic: false, notes: new Set() };
  const readTu = (ref) => {
    try {
      const tu = doc.resolve(ref);
      if (tu && tu.stream) info.cmap = parseCMap(decodeStreamBytes(tu.stream, tu.dict));
    } catch { info.cmap = info.cmap || null; } // unreadable ToUnicode → fall through to encodings
  };
  if (f.ToUnicode && f.ToUnicode.r) readTu(f.ToUnicode);
  if (info.type0) {
    const desc = f.DescendantFonts?.[0] ? doc.resolve(f.DescendantFonts[0]) : null;
    if (desc && typeof desc === "object") {
      if (Array.isArray(desc.W)) info.wRanges = parseWRanges(desc.W);
      if (typeof desc.DW === "number") info.dw = desc.DW;
      if (!info.cmap && desc.ToUnicode && desc.ToUnicode.r) readTu(desc.ToUnicode);
    }
    const encName = typeof f.Encoding === "string" ? f.Encoding : f.Encoding?.BaseEncoding;
    info.identity = /Identity-[HV]/.test(encName || "");
  } else {
    if (Array.isArray(f.Widths)) { info.widths = f.Widths; info.firstChar = f.FirstChar || 0; }
    const enc = f.Encoding;
    if (typeof enc === "string") info.enc = enc === "MacRomanEncoding" ? "macRoman" : enc === "StandardEncoding" ? "standard" : "winAnsi";
    else if (enc && typeof enc === "object" && !enc.r) {
      info.enc = enc.BaseEncoding === "MacRomanEncoding" ? "macRoman" : enc.BaseEncoding === "StandardEncoding" ? "standard" : "winAnsi";
      if (Array.isArray(enc.Differences)) {
        info.diffs = new Map();
        let code = null;
        for (const d of enc.Differences) { if (typeof d === "number") code = d; else if (code !== null) info.diffs.set(code++, d); }
      }
    } else info.enc = f.Subtype === "Type1" ? "standard" : "winAnsi"; // no /Encoding: base-14 ≈ Standard, TrueType ≈ WinAnsi
    info.symbolic = !info.cmap && SYMBOLIC.test(info.baseFont || "") && !info.diffs;
    if (!info.cmap && f.Subtype === "Type3") info.notes.add("type3-no-tounicode"); // codes are charproc indices — best-effort only
  }
  return info;
}

function parseWRanges(W) {
  const out = [];
  for (let i = 0; i < W.length; i++) {
    const c = W[i];
    if (typeof c !== "number") continue;
    const n2 = W[i + 1];
    if (Array.isArray(n2)) { out.push({ from: c, width: n2 }); i++; }
    else if (typeof n2 === "number") {
      const n3 = W[i + 2];
      if (typeof n3 === "number") { out.push({ from: c, to: n2, w: n3 }); i += 2; }
      else if (Array.isArray(n3)) { out.push({ from: c, width: n3 }); i += 2; }
    }
  }
  return out;
}

function advOf(info, code, size) {
  if (info.type0) {
    for (const r of info.wRanges || []) {
      if (code >= r.from && (r.to === undefined ? code - r.from < r.width.length : code <= r.to)) {
        const w = r.to === undefined ? r.width[code - r.from] : r.w;
        if (typeof w === "number") return (w / 1000) * size;
      }
    }
    return (info.dw / 1000) * size;
  }
  if (info.widths) {
    const w = info.widths[code - info.firstChar];
    if (typeof w === "number") return (w / 1000) * size;
  }
  return size * 0.5;
}

/** One code → string (ToUnicode first, then encoding tables); null = skip glyph. */
function decodeCode(info, code) {
  if (info.cmap) {
    if (info.cmap.single.has(code)) return info.cmap.single.get(code);
    for (const r of info.cmap.ranges) if (code >= r.lo && code <= r.hi) return String.fromCharCode(r.base + (code - r.lo));
    if (code <= 0x20) return " "; // space glyph sits at low codes (Chrome Type3: 0x01-0x03) but is often missing from the CMap
    info.notes.add("unmapped-code");
    return null;
  }
  if (info.type0) {
    if (!info.identity) { info.notes.add("cmap-preset"); return "\uFFFD"; } // preset encodings unknowable without ToUnicode
    info.notes.add("no-tounicode");
    return String.fromCharCode(code); // Identity-H: code ≈ Unicode (尽力)
  }
  if (code < 0x20 || code === 0x7f) return null;
  if (info.symbolic) { info.notes.add("symbolic"); return null; }
  let c = null;
  if (code >= 0x80) {
    if (info.enc === "macRoman") c = MACROMAN_HIGH[code - 0x80];
    else if (info.enc === "standard") { const name = STANDARD_HIGH[code]; if (name !== undefined) c = GLYPH_CHAR[name] ?? "\uFFFD"; }
    else { if (UNDEFINED.has(code)) return null; c = WINANSI_OVERRIDES[code] ?? String.fromCharCode(code); }
  } else {
    if (info.enc === "standard") { if (code === 0x27) c = "\u2019"; else if (code === 0x60) c = "\u2018"; }
    c = c ?? String.fromCharCode(code);
  }
  if (info.diffs && info.diffs.has(code)) c = info.diffs.get(code) === "space" ? " " : (GLYPH_CHAR[info.diffs.get(code)] ?? "\uFFFD");
  if (c === "\uFFFD") info.notes.add("unmapped-code");
  return c;
}

// ── content-stream walk (stage 7) ───────────────────
function walkContent(doc, data, st) {
  let p = 0;
  let inText = false, tx = 0, lx = 0, ly = 0;
  let fontInfo = null, fontName = null, fontSize = 0;
  const spans = [];
  const resolveFont = (name) => {
    const fr = st.resources.Font?.[name];
    if (!fr) return null;
    if (!st.fontCache.has(name)) st.fontCache.set(name, loadFont(doc, fr));
    return st.fontCache.get(name);
  };
  const show = (buf) => {
    if (!inText) return;
    if (!fontInfo) { st.missingFonts.add(fontName); return; }
    if (fontInfo.type0 && !fontInfo.identity && !fontInfo.cmap) { fontInfo.notes.add("preset-skip"); return; } // CMap-preset, no ToUnicode
    const step = fontInfo.cmap?.codeWidth || (fontInfo.type0 ? 2 : 1);
    const text = [];
    let adv = 0;
    for (let i = 0; i < buf.length; i += step) {
      const code = step === 2 && i + 1 < buf.length ? (buf[i] << 8) | buf[i + 1] : buf[i];
      if (fontInfo.symbolic) { fontInfo.notes.add("symbolic"); break; }
      adv += advOf(fontInfo, code, fontSize);
      const ch = decodeCode(fontInfo, code);
      if (ch !== null) text.push(ch);
    }
    const startX = tx;
    tx += adv;
    if (!text.length) return;
    const joined = text.join("");
    const run = { x: startX, y: ly, size: fontSize, adv, text: joined, font: fontName, fw: adv / Math.max(1, joined.length) / fontSize > 0.85, i: st.order++ };
    if (spans.length && spans[spans.length - 1].actual !== null && spans[spans.length - 1].runsStart < 0) spans[spans.length - 1].runsStart = st.runs.length;
    st.runs.push(run);
  };
  const pending = []; // PDF content is POSTFIX: operands precede their operator
  const pushOp = (o) => { pending.push(o); if (pending.length > 10_000) throw new PdfError("content stream: operand flood — malformed/hostile stream"); };
  while (p < data.length) {
    const t = nextToken(data, p);
    if (!t.tok) break;
    p = t.p;
    if (t.tok.t !== "kw") {
      if (t.tok.t === "<<") { const { dict, after } = parseDictInline(data, p); pushOp({ t: "dict", v: dict }); p = after; }
      else if (t.tok.t === "[") {
        const items = [];
        for (;;) {
          const e = nextToken(data, p);
          if (!e.tok) break;
          p = e.p;
          if (e.tok.t === "]") break;
          if (e.tok.t === "num") items.push({ t: "num", n: e.tok.n });
          else if (e.tok.t === "str" || e.tok.t === "hex") items.push({ t: "str", b: e.tok.buf });
        }
        pushOp({ t: "arr", items });
      } else if (t.tok.t === "num") pushOp({ t: "num", n: t.tok.n });
      else if (t.tok.t === "name") pushOp({ t: "name", s: t.tok.s });
      else if (t.tok.t === "str" || t.tok.t === "hex") pushOp({ t: "str", b: t.tok.buf });
      continue;
    }
    const nums = () => pending.filter((o) => o.t === "num").map((o) => o.n);
    const lastStr = () => { for (let i = pending.length - 1; i >= 0; i--) if (pending[i].t === "str") return pending[i].b; return null; };
    switch (t.tok.s) {
      case "BT": inText = true; tx = 0; lx = 0; ly = 0; break;
      case "ET": inText = false; break;
      case "Tf": { const name = pending.find((o) => o.t === "name"), size = nums()[0]; if (name && size !== undefined) { fontName = name.s; fontInfo = resolveFont(fontName); fontSize = size; } break; }
      case "Td": case "TD": {
        const n = nums();
        if (n.length >= 2) { lx += n[0]; ly += n[1]; if (t.tok.s === "TD") st.leading = -n[1]; tx = lx; }
        break;
      }
      case "T*": ly -= st.leading; tx = lx; break;
      case "Tm": { const n = nums(); if (n.length >= 6) { lx = n[4]; ly = n[5]; tx = lx; } break; }
      case "TL": { const n = nums(); if (n.length) st.leading = n[0]; break; }
      case "Tj": { const b = lastStr(); if (b) show(b); break; }
      case "TJ": {
        const arr = pending.find((o) => o.t === "arr");
        if (arr) for (const item of arr.items) { if (item.t === "str") show(item.b); else if (item.t === "num") tx += (item.n / 1000) * fontSize; }
        break;
      }
      case "'": { if (inText) { ly -= st.leading; tx = lx; const b = lastStr(); if (b) show(b); } break; }
      case '"': { const s = pending.find((o) => o.t === "str"); if (s && inText) { ly -= st.leading; tx = lx; show(s.b); } break; }
      case "Do": {
        const name = pending.find((o) => o.t === "name");
        if (name && st.resources.XObject?.[name.s]) {
          const xo = doc.resolve(st.resources.XObject[name.s]);
          if (xo?.dict?.Subtype === "Image") st.images.push(xo); // full stream object — tool extracts payloads
          else if (xo?.dict?.Subtype === "Form" && xo.stream && st.formDepth < MAX_FORM_DEPTH) {
            st.formDepth++;
            const saved = st.resources;
            if (xo.dict.Resources) st.resources = { ...saved, ...doc.resolve(xo.dict.Resources) };
            try { walkContent(doc, decodeStreamBytes(xo.stream, xo.dict), st); }
            finally { st.resources = saved; st.formDepth--; }
          }
        }
        break;
      }
      case "BDC": {
        const d = [...pending].reverse().find((o) => o.t === "dict");
        const actual = d?.v.ActualText && d.v.ActualText.b ? decodeActual(d.v.ActualText.b) : null;
        spans.push({ actual, runsStart: -1 });
        break;
      }
      case "EMC": {
        const top = spans.pop();
        if (top && top.actual !== null && top.runsStart >= 0 && st.runs.length > top.runsStart) {
          const first = st.runs[top.runsStart];
          for (const r of st.runs.splice(top.runsStart + 1)) first.adv += r.adv;
          first.text = top.actual;
        }
        break;
      }
      case "BI": p = skipInlineImage(data, p); break;
      default: break; // unknown/graphics operator — pending (its operands) is dropped below
    }
    pending.length = 0;
  }
  for (const fi of st.fontCache.values()) {
    if (!fi) continue;
    const who = fi.baseFont || "?";
    if (fi.notes.has("symbolic")) st.warn.push(`font ${who}: symbolic font without usable mapping — its glyphs were skipped (F-P3)`);
    if (fi.notes.has("type3-no-tounicode")) st.warn.push(`font ${who}: Type3 font without ToUnicode — glyph codes decoded best-effort, may be wrong (F-P3)`);
    if (fi.notes.has("no-tounicode")) st.warn.push(`font ${who}: CID/Type0 font without ToUnicode — codes mapped as Unicode, may be wrong (F-P3)`);
    if (fi.notes.has("cmap-preset")) st.warn.push(`font ${who}: CMap-preset encoding without ToUnicode — glyphs shown as U+FFFD (F-P3)`);
    if (fi.notes.has("preset-skip")) st.warn.push(`font ${who}: CMap-preset encoded text skipped (F-P3)`);
    if (fi.notes.has("unmapped-code")) st.warn.push(`font ${who}: some glyph codes unmapped — output may be incomplete (F-P3)`);
  }
}

function skipInlineImage(data, p) {
  for (;;) {
    const t = nextToken(data, p);
    if (!t.tok) return t.p;
    p = t.p;
    if (t.tok.t === "kw" && t.tok.s === "ID") break;
  }
  for (let i = p; i < data.length - 1; i++) { // EI must be whitespace-delimited (binary-safe)
    if (data[i] === 0x45 && data[i + 1] === 0x49 && i > p && WS_BYTE(data[i - 1]) && (i + 2 >= data.length || WS_BYTE(data[i + 2]))) return i + 2;
  }
  return data.length;
}
const WS_BYTE = (c) => c === 10 || c === 13 || c === 32 || c === 0;

// ── layout (stage 9: rows / light columns / paragraphs) ──
function layout(runs) {
  if (!runs.length) return [];
  runs.sort((a, b) => b.y - a.y);
  const rows = [];
  for (const r of runs) {
    let row = null;
    for (const cand of rows) if (Math.abs(cand.y - r.y) <= Math.max(cand.size, r.size) * 0.62) { row = cand; break; }
    if (row) { row.runs.push(r); row.y = (row.y + r.y) / 2; row.size = Math.max(row.size, r.size); }
    else rows.push({ y: r.y, size: r.size, runs: [r] });
  }
  const byOrder = [...rows].sort((a, b) => a.runs[0].i - b.runs[0].i);
  let up = 0, down = 0;
  for (let i = 1; i < byOrder.length; i++) { const d = byOrder[i].y - byOrder[i - 1].y; if (d > 0.01) up++; else if (d < -0.01) down++; }
  const desc = down > up; // y desc when baselines shrink downstream (PDF-native y-up); flipped matrices grow
  rows.sort((a, b) => (desc ? b.y - a.y : a.y - b.y));
  // light x-cluster columns: wide intra-row gaps (≥2em) that recur at a consistent x
  const cands = [];
  let gappy = 0;
  for (const row of rows) {
    const rs = [...row.runs].sort((a, b) => a.x - b.x);
    for (let i = 1; i < rs.length; i++) {
      const gap = rs[i].x - (rs[i - 1].x + rs[i - 1].adv);
      if (gap >= Math.max(rs[i - 1].size, rs[i].size) * 2) { cands.push({ cx: rs[i - 1].x + rs[i - 1].adv + gap / 2, w: gap }); gappy++; }
    }
  }
  const bands = [];
  for (const g of cands.sort((a, b) => a.cx - b.cx)) {
    const near = bands.find((b) => Math.abs(b.cx - g.cx) <= 24);
    if (near) { near.ws.push(g.w); near.n++; } else bands.push({ cx: g.cx, ws: [g.w], n: 1 });
  }
  const bounds = [];
  for (const b of bands) {
    if (b.n < Math.max(2, Math.ceil(gappy * 0.3))) continue;
    b.ws.sort((a, b) => a - b);
    const half = b.ws[Math.floor(b.ws.length / 2)] / 2;
    if (bounds.every((o) => Math.abs(o.cx - b.cx) > o.half + half)) bounds.push({ cx: b.cx, half });
    if (bounds.length >= 2) break;
  }
  const colOf = (x) => { let n = 0; for (const b of bounds) if (x > b.cx + b.half) n++; return n; };
  const nCols = bounds.length + 1;
  const per = Array.from({ length: nCols }, () => []);
  for (const row of rows) {
    const rs = [...row.runs].sort((a, b) => a.x - b.x);
    for (let c = 0; c < nCols; c++) {
      const frag = rs.filter((r) => colOf(r.x + r.adv / 2) === c);
      if (!frag.length) continue;
      let text = "";
      for (let i = 0; i < frag.length; i++) {
        if (i > 0) {
          const prev = frag[i - 1], cur = frag[i];
          const gap = cur.x - (prev.x + prev.adv);
          if (gap >= prev.size * 0.15) {
            const pFW = prev.fw, cFW = cur.fw || cur.adv / Math.max(1, cur.text.length) / cur.size > 0.85;
            if (pFW && cFW) { /* CJK↔CJK */ }
            else if (pFW) { if (gap >= (prev.adv / Math.max(1, prev.text.length)) * 1.35) text += " "; }
            else if (!cFW) text += " ";
          }
        }
        text += frag[i].text;
      }
      per[c].push({ text, y: row.y, size: row.size });
    }
  }
  const lines = [];
  for (let c = 0; c < nCols; c++) {
    per[c].sort((a, b) => (desc ? b.y - a.y : a.y - b.y));
    per[c].forEach((ln, i) => {
      if (i > 0 && Math.abs(ln.y - per[c][i - 1].y) > Math.max(ln.size, per[c][i - 1].size) * 1.9) lines.push("");
      lines.push(ln.text);
    });
    if (c < nCols - 1) lines.push("");
  }
  return lines;
}

// ── entry ───────────────────────────────────────────
export function extractPages(doc, pageNos) {
  const root = doc.resolve(doc.trailer.Root);
  if (!root || root.Type !== "Catalog" || !root.Pages?.r) throw new PdfError("catalog has no /Pages tree");
  const refs = doc.__pdfPageRefs || ((doc.__pdfPageRefs = []), collectPageRefs(doc, root.Pages, doc.__pdfPageRefs, new Set()), doc.__pdfPageRefs); // memoized — count + extract share one page-tree walk
  if (!refs.length) throw new PdfError("document has no pages");
  const warn = [];
  const out = [];
  for (const no of pageNos) {
    const ref = refs[no - 1];
    if (!ref) continue;
    const page = doc.resolve(ref);
    const st = { runs: [], images: [], warn, order: 0, leading: 0, formDepth: 0, resources: pageResources(doc, ref), fontCache: new Map(), missingFonts: new Set() };
    const contents = [];
    if (page.Contents?.r) contents.push(page.Contents);
    else if (Array.isArray(page.Contents)) for (const c of page.Contents) if (c?.r) contents.push(c);
    for (const cr of contents) {
      const cs = doc.resolve(cr);
      if (!cs?.stream) continue;
      try { walkContent(doc, decodeStreamBytes(cs.stream, cs.dict), st); }
      catch (e) { warn.push(`page ${no} content stream: ${e.message}`); }
    }
    for (const fn of st.missingFonts) warn.push(`page ${no}: text used missing font "${fn}" — glyphs skipped (F-P3)`);
    out.push({ no, lines: layout(st.runs), hasText: st.runs.length > 0, images: st.images });
  }
  return { pages: out, pageCount: refs.length, warnings: warn };
}
