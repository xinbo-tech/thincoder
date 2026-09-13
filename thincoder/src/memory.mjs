/**
 * memory.mjs — memory system re-export hub
 * Submodules in src/memory/ directory, split by responsibility.
 */

// schema + constants
export { createMemory, migrate, segmentCJK, VALID_TYPES, SCHEMA_VERSION, CODE_EXTS, DOC_EXTS, SKIP_DIRS, BIG_FILE_LINES } from "./memory/schema.mjs"

// CRUD + search + ensureEmbeddings
// (delete.mjs owns the disk-truth row match + deletion family — see its header)
export { put, search, ftsSearch, fetchEntry, ensureEmbeddings, putMarkdown, syncDir, indexMarkdownFile, list, clearPersonal, buildFtsQuery } from "./memory/core.mjs"
export { matchMemoryRows, deleteWhere, deleteByUid, remove } from "./memory/delete.mjs"

// code chunking + markdown chunking
export { detectLanguage, extractSymbols, extractPySymbols, chunkCode, extractLeadingDoc, yieldTick, _upsertCodeFile, chunkMarkdown, _upsertDocFile } from "./memory/code-index.mjs"

// code sync + search + reindex
export { gitSync, codeSync, markIndexedCommit, codeSearch, ensureCodeEmbeddings, codeSearchTool, reindexFile } from "./memory/code-sync.mjs"

// doc sync + search + memoryTools
export { docSync, docSearch, ensureDocEmbeddings, docSearchTool, memoryTools } from "./memory/docs.mjs"
