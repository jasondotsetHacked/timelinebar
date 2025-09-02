/* Simple build: bundle modules to IIFE, copy CSS, and rewrite HTML */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = process.cwd();
const distDir = path.join(root, 'dist');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function bundle() {
  await esbuild.build({
    entryPoints: [path.join(root, 'app.js')],
    bundle: true,
    format: 'iife',
    target: ['es2018'],
    outfile: path.join(distDir, 'app.bundle.js'),
    sourcemap: false,
    legalComments: 'none',
  });
}

async function copyCss() {
  const src = path.join(root, 'styles.css');
  const dst = path.join(distDir, 'styles.css');
  await fs.promises.copyFile(src, dst);
}

function rewriteHtml(html) {
  // Replace the module script with a classic bundle reference
  return html.replace(
    /<script[^>]*type\s*=\s*"module"[^>]*src\s*=\s*"app\.js"[^>]*><\/script>/i,
    '<script src="app.bundle.js"></script>'
  );
}

async function writeHtml() {
  const srcHtml = path.join(root, 'index.html');
  const dstHtml = path.join(distDir, 'index.html');
  const html = await fs.promises.readFile(srcHtml, 'utf8');
  const out = rewriteHtml(html);
  await fs.promises.writeFile(dstHtml, out, 'utf8');
}

async function main() {
  await ensureDir(distDir);
  await bundle();
  await copyCss();
  await writeHtml();
  console.log('Built to', distDir);
  console.log('Open dist/index.html directly in your browser.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
