const fs = require('fs');
const path = require('path');

const outDir = './out';
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy public directory
if (fs.existsSync('./public')) {
  fs.cpSync('./public', outDir, { recursive: true });
}

// Copy .next/static into out/_next/static
const nextStaticDir = path.join(outDir, '_next', 'static');
fs.mkdirSync(nextStaticDir, { recursive: true });
if (fs.existsSync('./.next/static')) {
  fs.cpSync('./.next/static', nextStaticDir, { recursive: true });
}

// Recursively find and copy all generated HTML pages from .next/server/app
const appDir = './.next/server/app';
function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (item.name.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const htmlFiles = walk(appDir);
for (const file of htmlFiles) {
  const rel = path.relative(appDir, file);
  if (rel === 'index.html') {
    fs.copyFileSync(file, path.join(outDir, 'index.html'));
  } else {
    const route = rel.replace(/\.html$/, '');
    const targetDir = path.join(outDir, route);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(file, path.join(targetDir, 'index.html'));
    fs.copyFileSync(file, path.join(outDir, route + '.html'));
  }
}

// Ensure headers and redirects
if (fs.existsSync('./public/_headers')) fs.copyFileSync('./public/_headers', path.join(outDir, '_headers'));
if (fs.existsSync('./public/_redirects')) fs.copyFileSync('./public/_redirects', path.join(outDir, '_redirects'));

// Ensure 404.html is available for static hosting providers (Render, Netlify, Cloudflare Pages)
const notFoundSources = [
  path.join(outDir, '_not-found.html'),
  path.join(outDir, 'not-found.html'),
  path.join(appDir, '_not-found.html'),
  path.join(appDir, 'not-found.html'),
];
for (const nf of notFoundSources) {
  if (fs.existsSync(nf)) {
    fs.copyFileSync(nf, path.join(outDir, '404.html'));
    const notFoundDir = path.join(outDir, '404');
    fs.mkdirSync(notFoundDir, { recursive: true });
    fs.copyFileSync(nf, path.join(notFoundDir, 'index.html'));
    console.log(`[Export] Generated 404 fallback from ${nf}`);
    break;
  }
}

console.log(`[Export] Successfully exported ${htmlFiles.length} pages and static assets to ${outDir}`);
