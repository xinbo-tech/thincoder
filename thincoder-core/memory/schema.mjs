/**
 * memory/schema.mjs — database schema definition, migration, CJK segmentation
 * v1: node:sqlite + FTS5 standalone implementation, zero dependencies.
 *
 * Chinese search strategy: FTS5 unicode61 tokenizer + CJK character-by-character spacing (applied to both write and query sides).
 * Effect: Chinese indexed by character; two-character words like "分号" still match; ASCII stays whole-word.
 */

import { DatabaseSync } from "node:sqlite"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

export const VALID_TYPES = new Set(["rule", "knowledge", "decision", "pattern"])
export const SCHEMA_VERSION = 9
export const SQLITE_BUSY_TIMEOUT = 3000
/** WAL 回收后的文件截断上界（§6.12 修法①——防复胀；实测曾达 587 MB）。 */
export const WAL_SIZE_LIMIT_BYTES = 64 * 1024 * 1024

// Code index: source file extensions. Curated DEFAULTS — a project can declare
// more (union) through .thincoder/conventions.json → index.codeExtensions
// (PORTABILITY PO-9: an unlisted extension used to be invisible AND undeclarable).
export const CODE_EXTS = new Set([
  ".mjs", ".js", ".cjs", ".mts", ".cts", ".ts", ".tsx", ".jsx",
  ".py", ".rs", ".go", ".java", ".c", ".h", ".cpp", ".hpp",
  ".rb", ".swift", ".kt", ".dart", ".lua", ".cs", ".fs", ".fsx",
  ".clj", ".cljs", ".ex", ".exs", ".erl", ".hrl", ".scala", ".groovy",
  ".pl", ".pm", ".r", ".jl", ".zig", ".ps1",
  ".sh", ".bash", ".sql", ".yaml", ".yml", ".toml", ".json",
  ".proto", ".graphql", ".tf", ".hcl",
  ".css", ".html", ".vue", ".svelte",
])
// Doc index: markdown / plain text (separate index makes it easier for LLM to distinguish "design specs" from "existing code")
// Same declaration rule as CODE_EXTS (index.docExtensions).
export const DOC_EXTS = new Set([".md", ".mdc", ".mdx", ".txt", ".rst", ".adoc", ".org", ".wiki", ".tex"])
// Directory names always skipped during code/doc indexing
// NOTE: these are case-sensitive basename matches; add common platform-specific dirs
export const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".turbo", "coverage",
  "__pycache__", ".venv", "venv", "target", ".next", ".nuxt", ".svelte-kit",
  // Windows user profile directories (never contain project code)
  "AppData", "Application Data", "Desktop", "Documents", "Downloads",
  "Music", "Pictures", "Videos", "OneDrive", "Contacts", "Favorites",
  "Links", "Saved Games", "Searches",
  // Other common non-code directories
  "Program Files", "Program Files (x86)", "Windows", "$Recycle.Bin",
])
// Files larger than these limits are skipped during bulk indexing
// (minified bundles, test fixtures, generated code, etc.)
export const MAX_CODE_FILE_BYTES = 1024 * 1024   // 1 MB
export const MAX_DOC_FILE_BYTES  = 512 * 1024    // 512 KB
export const BIG_FILE_LINES = 2000

/**
 * CJK character-by-character spacing: makes unicode61 treat each Han/Kana/Hangul character as an independent token.
 * Both write and query must use the same processing for retrieval to match.
 */
export function segmentCJK(text) {
  return text.replace(
    /[぀-ヿ㐀-䶿一-鿿豈-﫿가-힯]+/g,
    (run) => [...run].join(" "),
  )
}

/**
 * Open/initialize the memory store. dbPath is auto-created if missing.
 * The returned memory object is the interface; all subsequent functions take it as their first argument.
 */
export function createMemory({ dbPath }) {
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new DatabaseSync(dbPath)
  // WAL: reads and writes don't block each other (TUI search and background indexing can run concurrently); busy_timeout prevents SQLITE_BUSY from multi-process same-db access
  db.exec(`PRAGMA journal_mode = WAL`)
  db.exec(`PRAGMA busy_timeout = ${SQLITE_BUSY_TIMEOUT}`)
  // §6.12 WAL 卫生（TUI 假死批）：① `journal_size_limit` = 回收后 WAL 文件截断上界（防复胀）；
  // ② 开库**一次性** `wal_checkpoint(TRUNCATE)`——失败容忍（另一实例持读事务 ⇒ busy：静默跳过，
  // 不重试不报错）。边界写实：最坏等待上界 = 连接上的 `busy_timeout`（**不是**「不阻塞」；
  // `wal_checkpoint` 是否走 busy handler = unverified——判据面 = 批档 §2.5 T-W2）。
  db.exec(`PRAGMA journal_size_limit = ${WAL_SIZE_LIMIT_BYTES}`)
  try { db.exec(`PRAGMA wal_checkpoint(TRUNCATE)`) } catch { /* busy / 非 WAL（内存库）⇒ 保持现状 */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('rule','knowledge','decision','pattern')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '',
      seg_title TEXT NOT NULL DEFAULT '',
      seg_content TEXT NOT NULL DEFAULT '',
      seg_tags TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  migrate(db)
  return { db }
}

/** Step-by-step migration by user_version. Single transaction — any step failure rolls back, no half-finished schema left behind. */
export function migrate(db) {
  const { user_version: version } = db.prepare(`PRAGMA user_version`).get()
  if (version >= SCHEMA_VERSION) return

  db.exec("BEGIN IMMEDIATE")
  try {
  if (version < 2) {
    // v1 (trigram) or empty DB → v2 (unicode61 + CJK char-by-char): rebuild FTS and triggers
    db.exec(`
      DROP TRIGGER IF EXISTS entries_ai;
      DROP TRIGGER IF EXISTS entries_ad;
      DROP TRIGGER IF EXISTS entries_au;
      DROP TABLE IF EXISTS entries_fts;
    `)
    // Old DB (v1) has no seg columns — add them
    const columns = db.prepare(`PRAGMA table_info(entries)`).all().map((c) => c.name)
    for (const col of ["seg_title", "seg_content", "seg_tags"]) {
      if (!columns.includes(col)) {
        db.exec(`ALTER TABLE entries ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`)
      }
    }
    // Backfill seg columns (segmentation done in JS; SQL can't do it)
    const rows = db.prepare(`SELECT id, title, content, tags FROM entries`).all()
    const update = db.prepare(`UPDATE entries SET seg_title = ?, seg_content = ?, seg_tags = ? WHERE id = ?`)
    for (const r of rows) {
      update.run(segmentCJK(r.title), segmentCJK(r.content), segmentCJK(r.tags), r.id)
    }

    db.exec(`
      CREATE VIRTUAL TABLE entries_fts USING fts5(
        seg_title, seg_content, seg_tags,
        content='entries', content_rowid='id',
        tokenize='unicode61'
      )
    `)
    db.exec(`
      CREATE TRIGGER entries_ai AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(rowid, seg_title, seg_content, seg_tags)
        VALUES (new.id, new.seg_title, new.seg_content, new.seg_tags);
      END;
      CREATE TRIGGER entries_ad AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, seg_title, seg_content, seg_tags)
        VALUES ('delete', old.id, old.seg_title, old.seg_content, old.seg_tags);
      END;
      CREATE TRIGGER entries_au AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, seg_title, seg_content, seg_tags)
        VALUES ('delete', old.id, old.seg_title, old.seg_content, old.seg_tags);
        INSERT INTO entries_fts(rowid, seg_title, seg_content, seg_tags)
        VALUES (new.id, new.seg_title, new.seg_content, new.seg_tags);
      END;
    `)
    db.exec(`INSERT INTO entries_fts(entries_fts) VALUES('rebuild')`)
    db.exec(`PRAGMA user_version = 2`)
  }

  if (version < 3) {
    // v3: markdown layer (project/team) files table + FTS + triggers
    db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        layer TEXT NOT NULL CHECK(layer IN ('project','team')),
        path TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('rule','knowledge','decision','pattern')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '',
        author TEXT NOT NULL DEFAULT '',
        embedding BLOB,
        mtime_ms INTEGER NOT NULL DEFAULT 0,
        seg_title TEXT NOT NULL DEFAULT '',
        seg_content TEXT NOT NULL DEFAULT '',
        seg_tags TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (layer, path)
      )
    `)
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
        seg_title, seg_content, seg_tags,
        content='files', content_rowid='rowid',
        tokenize='unicode61'
      )
    `)
    db.exec(`
      CREATE TRIGGER files_ai AFTER INSERT ON files BEGIN
        INSERT INTO files_fts(rowid, seg_title, seg_content, seg_tags)
        VALUES (new.rowid, new.seg_title, new.seg_content, new.seg_tags);
      END;
      CREATE TRIGGER files_ad AFTER DELETE ON files BEGIN
        INSERT INTO files_fts(files_fts, rowid, seg_title, seg_content, seg_tags)
        VALUES ('delete', old.rowid, old.seg_title, old.seg_content, old.seg_tags);
      END;
      CREATE TRIGGER files_au AFTER UPDATE ON files BEGIN
        INSERT INTO files_fts(files_fts, rowid, seg_title, seg_content, seg_tags)
        VALUES ('delete', old.rowid, old.seg_title, old.seg_content, old.seg_tags);
        INSERT INTO files_fts(rowid, seg_title, seg_content, seg_tags)
        VALUES (new.rowid, new.seg_title, new.seg_content, new.seg_tags);
      END;
    `)
    db.exec(`PRAGMA user_version = 3`)
  }

  if (version < 4) {
    // v4: add vector column to personal entries table (files table already had it since v3); meta table stores embedding model name
    const columns = db.prepare(`PRAGMA table_info(entries)`).all().map((c) => c.name)
    if (!columns.includes("embedding")) {
      db.exec(`ALTER TABLE entries ADD COLUMN embedding BLOB`)
    }
    db.exec(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`)
    db.exec(`PRAGMA user_version = 4`)
  }

  if (version < 5) {
    // v5: add origin column to files table (absolute project path), prevent cross-project memory collision
    const columns = db.prepare(`PRAGMA table_info(files)`).all().map((c) => c.name)
    if (!columns.includes("origin")) {
      db.exec(`ALTER TABLE files ADD COLUMN origin TEXT NOT NULL DEFAULT ''`)
    }
    db.exec(`PRAGMA user_version = 5`)
  }

  if (version < 6) {
    // v6: code index — code_chunks table + FTS5 (same pattern as files table)
    db.exec(`
      CREATE TABLE IF NOT EXISTS code_chunks (
        path TEXT NOT NULL,
        language TEXT NOT NULL,
        chunk_type TEXT NOT NULL CHECK(chunk_type IN ('file','symbol')),
        symbol_name TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        line_start INTEGER NOT NULL DEFAULT 0,
        line_end INTEGER NOT NULL DEFAULT 0,
        mtime_ms INTEGER NOT NULL DEFAULT 0,
        embedding BLOB,
        seg_content TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (path, line_start)
      )
    `)
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS code_chunks_fts USING fts5(
        path, symbol_name, seg_content,
        content='code_chunks', content_rowid='rowid',
        tokenize='unicode61'
      )
    `)
    db.exec(`
      CREATE TRIGGER code_chunks_ai AFTER INSERT ON code_chunks BEGIN
        INSERT INTO code_chunks_fts(rowid, path, symbol_name, seg_content)
        VALUES (new.rowid, new.path, new.symbol_name, new.seg_content);
      END;
      CREATE TRIGGER code_chunks_ad AFTER DELETE ON code_chunks BEGIN
        INSERT INTO code_chunks_fts(code_chunks_fts, rowid, path, symbol_name, seg_content)
        VALUES ('delete', old.rowid, old.path, old.symbol_name, old.seg_content);
      END;
      CREATE TRIGGER code_chunks_au AFTER UPDATE ON code_chunks BEGIN
        INSERT INTO code_chunks_fts(code_chunks_fts, rowid, path, symbol_name, seg_content)
        VALUES ('delete', old.rowid, old.path, old.symbol_name, old.seg_content);
        INSERT INTO code_chunks_fts(rowid, path, symbol_name, seg_content)
        VALUES (new.rowid, new.path, new.symbol_name, new.seg_content);
      END;
    `)
    db.exec(`PRAGMA user_version = 6`)
  }

  if (version < 7) {
    // v7: doc index — doc_chunks table + FTS5 (same pattern as code_chunks), markdown chunked by ## headings
    db.exec(`
      CREATE TABLE IF NOT EXISTS doc_chunks (
        path TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'markdown',
        heading TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        line_start INTEGER NOT NULL DEFAULT 0,
        line_end INTEGER NOT NULL DEFAULT 0,
        mtime_ms INTEGER NOT NULL DEFAULT 0,
        embedding BLOB,
        seg_content TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (path, line_start)
      )
    `)
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS doc_chunks_fts USING fts5(
        path, heading, seg_content,
        content='doc_chunks', content_rowid='rowid',
        tokenize='unicode61'
      )
    `)
    db.exec(`
      CREATE TRIGGER doc_chunks_ai AFTER INSERT ON doc_chunks BEGIN
        INSERT INTO doc_chunks_fts(rowid, path, heading, seg_content)
        VALUES (new.rowid, new.path, new.heading, new.seg_content);
      END;
      CREATE TRIGGER doc_chunks_ad AFTER DELETE ON doc_chunks BEGIN
        INSERT INTO doc_chunks_fts(doc_chunks_fts, rowid, path, heading, seg_content)
        VALUES ('delete', old.rowid, old.path, old.heading, old.seg_content);
      END;
      CREATE TRIGGER doc_chunks_au AFTER UPDATE ON doc_chunks BEGIN
        INSERT INTO doc_chunks_fts(doc_chunks_fts, rowid, path, heading, seg_content)
        VALUES ('delete', old.rowid, old.path, old.heading, old.seg_content);
        INSERT INTO doc_chunks_fts(rowid, path, heading, seg_content)
        VALUES (new.rowid, new.path, new.heading, new.seg_content);
      END;
    `)
    db.exec(`PRAGMA user_version = 7`)
  }

  if (version < 8) {
    // v8: add origin column to code_chunks/doc_chunks (absolute project root), PK changed to (origin, path, line_start).
    // SQLite can't ALTER primary key → drop and recreate table (auto-reindexed by next codeSync/docSync).
    db.exec(`
      DROP TRIGGER IF EXISTS code_chunks_ai;
      DROP TRIGGER IF EXISTS code_chunks_ad;
      DROP TRIGGER IF EXISTS code_chunks_au;
      DROP TABLE IF EXISTS code_chunks_fts;
      DROP TABLE IF EXISTS code_chunks;
      DROP TRIGGER IF EXISTS doc_chunks_ai;
      DROP TRIGGER IF EXISTS doc_chunks_ad;
      DROP TRIGGER IF EXISTS doc_chunks_au;
      DROP TABLE IF EXISTS doc_chunks_fts;
      DROP TABLE IF EXISTS doc_chunks;
    `)
    db.exec(`
      CREATE TABLE code_chunks (
        origin TEXT NOT NULL DEFAULT '',
        path TEXT NOT NULL,
        language TEXT NOT NULL,
        chunk_type TEXT NOT NULL CHECK(chunk_type IN ('file','symbol')),
        symbol_name TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        line_start INTEGER NOT NULL DEFAULT 0,
        line_end INTEGER NOT NULL DEFAULT 0,
        mtime_ms INTEGER NOT NULL DEFAULT 0,
        embedding BLOB,
        seg_content TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (origin, path, line_start)
      )
    `)
    db.exec(`
      CREATE VIRTUAL TABLE code_chunks_fts USING fts5(
        path, symbol_name, seg_content,
        content='code_chunks', content_rowid='rowid',
        tokenize='unicode61'
      )
    `)
    db.exec(`
      CREATE TRIGGER code_chunks_ai AFTER INSERT ON code_chunks BEGIN
        INSERT INTO code_chunks_fts(rowid, path, symbol_name, seg_content)
        VALUES (new.rowid, new.path, new.symbol_name, new.seg_content);
      END;
      CREATE TRIGGER code_chunks_ad AFTER DELETE ON code_chunks BEGIN
        INSERT INTO code_chunks_fts(code_chunks_fts, rowid, path, symbol_name, seg_content)
        VALUES ('delete', old.rowid, old.path, old.symbol_name, old.seg_content);
      END;
      CREATE TRIGGER code_chunks_au AFTER UPDATE ON code_chunks BEGIN
        INSERT INTO code_chunks_fts(code_chunks_fts, rowid, path, symbol_name, seg_content)
        VALUES ('delete', old.rowid, old.path, old.symbol_name, old.seg_content);
        INSERT INTO code_chunks_fts(rowid, path, symbol_name, seg_content)
        VALUES (new.rowid, new.path, new.symbol_name, new.seg_content);
      END;
    `)
    db.exec(`
      CREATE TABLE doc_chunks (
        origin TEXT NOT NULL DEFAULT '',
        path TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'markdown',
        heading TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        line_start INTEGER NOT NULL DEFAULT 0,
        line_end INTEGER NOT NULL DEFAULT 0,
        mtime_ms INTEGER NOT NULL DEFAULT 0,
        embedding BLOB,
        seg_content TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (origin, path, line_start)
      )
    `)
    db.exec(`
      CREATE VIRTUAL TABLE doc_chunks_fts USING fts5(
        path, heading, seg_content,
        content='doc_chunks', content_rowid='rowid',
        tokenize='unicode61'
      )
    `)
    db.exec(`
      CREATE TRIGGER doc_chunks_ai AFTER INSERT ON doc_chunks BEGIN
        INSERT INTO doc_chunks_fts(rowid, path, heading, seg_content)
        VALUES (new.rowid, new.path, new.heading, new.seg_content);
      END;
      CREATE TRIGGER doc_chunks_ad AFTER DELETE ON doc_chunks BEGIN
        INSERT INTO doc_chunks_fts(doc_chunks_fts, rowid, path, heading, seg_content)
        VALUES ('delete', old.rowid, old.path, old.heading, old.seg_content);
      END;
      CREATE TRIGGER doc_chunks_au AFTER UPDATE ON doc_chunks BEGIN
        INSERT INTO doc_chunks_fts(doc_chunks_fts, rowid, path, heading, seg_content)
        VALUES ('delete', old.rowid, old.path, old.heading, old.seg_content);
        INSERT INTO doc_chunks_fts(rowid, path, heading, seg_content)
        VALUES (new.rowid, new.path, new.heading, new.seg_content);
      END;
    `)
    db.exec(`PRAGMA user_version = 8`)
  }

  if (version < 9) {
    // v9: files table PK gains origin, prevents cross-project project-layer memory overwrite
    // SQLite can't ALTER primary key → drop and recreate table (auto-reindexed by next syncDir)
    db.exec(`
      DROP TRIGGER IF EXISTS files_ai;
      DROP TRIGGER IF EXISTS files_ad;
      DROP TRIGGER IF EXISTS files_au;
      DROP TABLE IF EXISTS files_fts;
      DROP TABLE IF EXISTS files;
    `)
    db.exec(`
      CREATE TABLE files (
        layer TEXT NOT NULL CHECK(layer IN ('project','team')),
        origin TEXT NOT NULL DEFAULT '',
        path TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('rule','knowledge','decision','pattern')),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '',
        author TEXT NOT NULL DEFAULT '',
        embedding BLOB,
        mtime_ms INTEGER NOT NULL DEFAULT 0,
        seg_title TEXT NOT NULL DEFAULT '',
        seg_content TEXT NOT NULL DEFAULT '',
        seg_tags TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (layer, origin, path)
      )
    `)
    db.exec(`
      CREATE VIRTUAL TABLE files_fts USING fts5(
        seg_title, seg_content, seg_tags,
        content='files', content_rowid='rowid',
        tokenize='unicode61'
      )
    `)
    db.exec(`
      CREATE TRIGGER files_ai AFTER INSERT ON files BEGIN
        INSERT INTO files_fts(rowid, seg_title, seg_content, seg_tags)
        VALUES (new.rowid, new.seg_title, new.seg_content, new.seg_tags);
      END;
      CREATE TRIGGER files_ad AFTER DELETE ON files BEGIN
        INSERT INTO files_fts(files_fts, rowid, seg_title, seg_content, seg_tags)
        VALUES ('delete', old.rowid, old.seg_title, old.seg_content, old.seg_tags);
      END;
      CREATE TRIGGER files_au AFTER UPDATE ON files BEGIN
        INSERT INTO files_fts(files_fts, rowid, seg_title, seg_content, seg_tags)
        VALUES ('delete', old.rowid, old.seg_title, old.seg_content, old.seg_tags);
        INSERT INTO files_fts(rowid, seg_title, seg_content, seg_tags)
        VALUES (new.rowid, new.seg_title, new.seg_content, new.seg_tags);
      END;
    `)
    db.exec(`PRAGMA user_version = 9`)
  }
  db.exec("COMMIT")
  } catch (err) {
    db.exec("ROLLBACK")
    throw err
  }
}
