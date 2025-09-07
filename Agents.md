**Agent Console Check Tool**

- **Purpose:** Build the app and load the built `dist/index.html` in a headless browser, then report any browser console errors (like a human checking DevTools).
- **Script:** `scripts/console-check.js`
- **NPM:** `npm run check` (alias: `npm run check:console`)

**What It Does**

- **Build:** Runs `node scripts/build.js`.
- **Open headless:** Launches headless Chromium via `puppeteer` and opens the built `dist/index.html`.
- **Capture errors:** Collects `console.error`, `window.onerror`/`pageerror`, and network request failures (as warnings).
- **Report:** Prints a summary and details. Exits with code `1` if errors were found, `0` otherwise.

**Usage**

- Run: `npm run check`
- Direct: `node scripts/console-check.js`

If the script reports errors, the agent should summarize the error(s), assess if a quick fix seems straightforward, and ask for approval before making changes.

**Notes**

- **Dependencies:** Uses `puppeteer` (dev dependency). Installed in `package.json`.
- **CDN assets:** The app references CDN resources in `dist/index.html`. Network access is required during the check.
- **Local file load:** The page is opened via `file://` URL. If future changes require HTTP, the script can be extended to serve `dist/` via a simple static server.
- **Timeouts:** The checker waits for the page `load` event and then ~2.5s for async errors to surface. Adjust if needed.

**When To Use**

- After major checkpoints (e.g., build steps, feature completion) to verify the app loads cleanly without console errors.
- As a quick gate in CI to prevent merging builds that throw initialization errors.

