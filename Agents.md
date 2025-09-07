**Agent Playbook**

- **Purpose:** Provide a consistent, extensible workflow for agents to build, verify, diagnose, and propose fixes using a catalog of tools.
- **Scope:** Defines tool interface, run flow, reporting format, and approval etiquette. Specific tools (build, console-check, etc.) plug into this framework.

**Workflow**

- **Plan:** Outline steps and checkpoints. Prefer small, verifiable increments.
- **Build:** Produce artifacts (e.g., `dist/`). Fail fast on build errors.
- **Verify:** Run one or more tools (console, tests, lint, type-check) to validate behavior.
- **Report:** Summarize findings with clear pass/fail and actionable notes.
- **Propose Fixes:** For simple issues, suggest targeted patches and ask for approval. Escalate complex changes.

**Tool Interface Contract**

- **Name:** Short, kebab-case identifier.
- **Command:** Single command the agent can run locally (npm script preferred).
- **Goal:** What the tool validates or produces.
- **Success Criteria:** What “pass” means (and exit code 0).
- **Failure Behavior:** What constitutes failure and exit code non‑zero.
- **Artifacts:** Files/logs produced for inspection.
- **Notes:** Environment needs, caveats, typical false positives.

**Registered Tools**

- **build:**
  - Command: `npm run build` (or `node scripts/build.js`)
  - Goal: Bundle JS, copy CSS, write `dist/index.html` with classic bundle.
  - Success: `dist/` contains `app.bundle.js`, `styles.css`, and `index.html`; exit 0.
  - Failure: Build errors or missing expected outputs; exit non‑zero.
  - Notes: Uses `esbuild`. Pure local build; no network needed.

- **console-check:**
  - Command: `npm run check` (alias: `npm run check:console`)
  - Goal: Open `dist/index.html` headlessly and capture console/page errors.
  - Success: No console errors or page errors; exit 0. Warnings allowed but reported.
  - Failure: Any console error or page error; exit non‑zero and print details.
  - Notes: Uses `puppeteer`; network may be needed for CDN assets referenced by the page.

**Execution Flow Template**

- **Checkpoint 1 — Build:** Run `npm run build`. If it fails, report stderr and stop.
- **Checkpoint 2 — Verify:** Run selected tools (e.g., `npm run check`). Capture output and exit codes.
- **Checkpoint 3 — Triage:** If failures, extract the most relevant error and suspected file/line.
- **Checkpoint 4 — Proposal:** If a small, low‑risk change is apparent, propose a patch and request approval. Otherwise, request guidance.

**Reporting Format**

- **Summary:** One‑line pass/fail per tool.
- **Details:** Bullet points of key errors/warnings with short context.
- **Next Steps:** Proposed fix or questions blocking progress.

**Adding New Tools**

- **Create script:** Add a script under `scripts/` (e.g., `scripts/lint.js`).
- **NPM entry:** Add an npm script (e.g., `lint`) that exits 0 on pass, non‑zero on fail.
- **Output:** Print a clear header (e.g., `=== Lint Report ===`) and concise details.
- **Document:** Append an entry under “Registered Tools” above using the Tool Interface Contract.

**Approval & Fix Policy**

- **Simple fixes:** Typo/missing import, null‑guard, obvious logic slip, build config tweak. Propose a small patch and ask to proceed.
- **Non‑trivial fixes:** Refactors, schema changes, UX changes. Summarize impact and request explicit approval.
- **Destructive actions:** Deletions or migrations require approval and a rollback plan.

**Environment Notes**

- **Node & NPM:** Use the repo’s `package.json` scripts when available.
- **Network:** Some tools (e.g., console‑check with CDN assets) may need network access. Note when network is required.
- **Local file URLs:** `console-check` opens `dist/index.html` via `file://`. If stricter environments require HTTP, add a tiny static server as a new tool (e.g., `serve-dist`).

**Quick Commands**

- Build: `npm run build`
- Console check: `npm run check`
