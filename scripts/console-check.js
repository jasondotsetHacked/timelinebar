#!/usr/bin/env node
/*
  Build the project, then open the built HTML in a headless browser
  and report any console errors or page errors, similar to checking
  the browser devtools console.
*/

const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');

async function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function ensurePuppeteer() {
  try {
    require.resolve('puppeteer');
    return;
  } catch (_) {
    console.error('\nError: dev dependency "puppeteer" not installed.');
    console.error('Install it with: npm i -D puppeteer');
    process.exitCode = 2;
    process.exit();
  }
}

async function main() {
  const root = process.cwd();
  const distDir = path.join(root, 'dist');
  const indexPath = path.join(distDir, 'index.html');

  // 1) Build
  console.log('> Building via scripts/build.js...');
  await run('node', [path.join('scripts', 'build.js')]);

  // 2) Sanity check output file exists
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Build did not produce ${indexPath}`);
  }

  // 3) Load headless browser and capture console errors
  await ensurePuppeteer();
  const puppeteer = require('puppeteer');

  console.log('> Launching headless Chromium and opening dist/index.html...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const url = pathToFileURL(indexPath).toString();

  const errors = [];
  const warnings = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push({ source: 'console', type, text });
    } else if (type === 'warning') {
      warnings.push({ source: 'console', type, text });
    }
  });

  page.on('pageerror', (err) => {
    errors.push({ source: 'pageerror', type: 'pageerror', text: err && err.stack ? err.stack : String(err) });
  });

  page.on('requestfailed', (req) => {
    const failure = req.failure && req.failure();
    const status = failure && failure.errorText ? failure.errorText : 'request failed';
    const url = req.url();
    // Treat failed script/style fetches as warnings (not always fatal).
    warnings.push({ source: 'network', type: 'requestfailed', text: `${status}: ${url}` });
  });

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    // Allow app to initialize and log any async errors
    await new Promise((r) => setTimeout(r, 2500));
  } finally {
    await browser.close();
  }

  // 4) Report
  const warnCount = warnings.length;
  const errCount = errors.length;

  console.log('\n=== Console Check Report ===');
  console.log(`Warnings: ${warnCount}`);
  console.log(`Errors:   ${errCount}`);

  if (warnCount) {
    console.log('\n-- Warnings --');
    warnings.forEach((w, i) => {
      console.log(`#${i + 1} [${w.source}] ${w.type}: ${w.text}`);
    });
  }

  if (errCount) {
    console.log('\n-- Errors --');
    errors.forEach((e, i) => {
      console.log(`#${i + 1} [${e.source}] ${e.type}: ${e.text}`);
    });
  }

  if (errCount > 0) {
    console.error('\nResult: Found console errors.');
    process.exitCode = 1;
  } else {
    console.log('\nResult: No console errors detected.');
  }
}

main().catch((err) => {
  console.error('\nconsole-check failed:', err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
