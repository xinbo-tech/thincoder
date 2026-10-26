/**
 * data.mjs — prompt fixture: version constant + the single source for paths, slot set and
 * the declared tool face.
 *
 * Everything that another module of this fixture needs to agree on lives here exactly once:
 * bumping the fixture semantics means bumping `PROMPT_FIXTURE_VERSION` here and nowhere else.
 *
 * The slot set is read from the core's own assembly table (`SCENARIO_SLOT_FILES`) rather than
 * copied — a copy would drift from the product the fixture is measuring.
 */

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { SCENARIO_SLOT_FILES } from "../thincoder-core/prompt-overlays.mjs"

/**
 * Fixture semantics version. Bump when any of these changes: verdict vocabulary, assembly
 * rules, budget / stop semantics, copy-generation rules, the declared tool face, report
 * columns or the statistical method. Presentation-only changes (wording, column order,
 * table style) do not bump.
 */
export const PROMPT_FIXTURE_VERSION = 1

export const FIXTURE_DIR = dirname(fileURLToPath(import.meta.url))
export const SCENARIOS_DIR = join(FIXTURE_DIR, "scenarios")
export const VARIANTS_DIR = join(FIXTURE_DIR, "variants")
export const RESULTS_DIR = join(FIXTURE_DIR, "results")
export const DRY_RUN_FILE = join(FIXTURE_DIR, "dry-run.json")

/** The only slot set the first version assembles — a copy is assembled from these three files. */
export const SLOT_SET = "engineering"
export const SLOT_FILES = [...SCENARIO_SLOT_FILES[SLOT_SET]]
/** Product assembly joins the slot contents with a blank line; the fixture must match byte for byte. */
export const SLOT_JOINER = "\n\n"

/** Declared tool face of the fixture (the scenario may narrow it, never widen it). */
export const TOOL_FACE = ["read", "write", "edit", "subagent"]

export const BASELINE_ID = "baseline"

/** dry-run has no model: a fixed label keeps the report deterministic. */
export const DRY_RUN_MODEL = "dry-run"

export const DEFAULT_MAX_ROUNDS = 3
export const DEFAULT_MAX_CALLS = 200
export const DEFAULT_CALL_TIMEOUT_MS = 180_000
export const DEFAULT_N = 1
export const DEFAULT_LABEL = "run"
