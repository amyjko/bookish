import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const S = '/private/tmp/claude-501/-Users-amyko-Code-bookish/14794025-2fd1-431f-adf4-fbeba1f57c27/scratchpad';
const READER = `${S}/reader2`;
const books = process.argv.slice(2);

const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
    '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml',
    '.gif':'image/gif', '.webp':'image/webp', '.json':'application/json', '.ico':'image/x-icon' };

function findIndex(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) { const f = findIndex(p); if (f) return f; }
        else if (e.name === 'index.html') return p;
    }
    return null;
}

for (const book of books) {
    const name = book.split('/').filter(Boolean).pop();
    process.stdout.write(`\n=== ${name} ===\n`);
    try {
        execFileSync('node', ['build.js', `${book}/book.json`], { cwd: READER, stdio: 'pipe' });
    } catch (e) {
        console.log('  BUILD FAILED:', (e.stderr || e.stdout || '').toString().split('\n').slice(-4).join(' | '));
        continue;
    }
    const root = `${READER}/build`;
    const idx = findIndex(root);
    if (!idx) { console.log('  no index.html produced'); continue; }
    const base = '/' + relative(root, idx).replace(/index\.html$/, '');
    const chapters = execFileSync('bash', ['-c', `find ${root} -name '*.html' | wc -l`]).toString().trim();

    const server = createServer((req, res) => {
        let p = decodeURIComponent(req.url.split('?')[0]);
        if (p.endsWith('/')) p += 'index.html';
        let f = join(root, p);
        if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
        if (!existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': types[extname(f)] ?? 'application/octet-stream' });
        createReadStream(f).pipe(res);
    });
    await new Promise((r) => server.listen(4178, r));

    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    try {
        await page.goto(`http://localhost:4178${base}`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.locator('.epub select').selectOption('standard');
        await page.locator('.epub button').click();
        const link = page.getByRole('link', { name: /Download .*\.epub/ });
        await link.waitFor({ state: 'visible', timeout: 300000 });
        const warn = await page.locator('.warnings').textContent().catch(() => null);
        const [file] = await Promise.all([page.waitForEvent('download'), link.click()]);
        const out = `${S}/book-${name}.epub`;
        await file.saveAs(out);
        const size = (statSync(out).size / 1048576).toFixed(1);
        const check = execFileSync('bash', ['-c',
            `java -jar ${S}/epubcheck-5.2.1/epubcheck.jar ${out} 2>&1 | grep -cE '^(ERROR|FATAL)' || true`]).toString().trim();
        console.log(`  pages ${chapters} | epub ${size}MB | epubcheck errors: ${check} | warnings: ${warn ? warn.trim().split('\n')[0].slice(0,60) : 'none'} | js errors: ${errors.length}`);
    } catch (e) {
        console.log('  EXPORT FAILED:', String(e).split('\n')[0].slice(0, 140));
    }
    await browser.close();
    server.close();
}
