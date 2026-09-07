import { expect, test } from '@playwright/test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { captureErrors, expectNoCycles, seedBook, signIn } from './helpers';
import config from '../playwright.emulator.config';

const BASE_URL = (config.use?.baseURL as string) ?? 'http://localhost:4180';

/**
 * The EPUB export is built entirely in the browser, so the parts that matter
 * most -- canvas re-encoding of images and the download itself -- can only be
 * exercised in a real one. The unit tests cover the serializer and the zip
 * writer; this covers the round trip.
 */

/** Read one entry out of a zip using the system unzip. */
function entry(path: string, name: string): string {
    return execFileSync('unzip', ['-p', path, name]).toString();
}

/** Every entry's name and uncompressed size. */
function listing(path: string): { name: string; size: number }[] {
    return execFileSync('unzip', ['-l', path])
        .toString()
        .split('\n')
        .map((line) => line.trim().split(/\s+/))
        .filter((parts) => parts.length === 4 && /^\d+$/.test(parts[0]))
        .map((parts) => ({ size: Number(parts[0]), name: parts[3] }));
}

/** Build an EPUB through the UI at the given size and save it. */
async function download(
    page: import('@playwright/test').Page,
    size: string,
    to: string,
) {
    await page.locator('.epub select').selectOption(size);
    // Scoped to the component: the write route also has "remove <email>
    // editing rights" buttons, whose text can match a looser selector.
    await page.locator('.epub button').click();

    // The link only appears once the blob is ready, which is also why it is
    // never in prerendered HTML for a crawler to follow.
    const link = page.getByRole('link', { name: /Download .*\.epub/ });
    await link.waitFor({ state: 'visible', timeout: 60000 });

    const [file] = await Promise.all([
        page.waitForEvent('download'),
        link.click(),
    ]);
    await file.saveAs(to);
    return file.suggestedFilename();
}

test('a book downloads as a valid EPUB with its content and cross-references', async ({
    page,
}, testInfo) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'epub@example.com');
    await seedBook(uid, 'epubtest', {
        title: 'Epub Book',
        authors: ['Epub Author'],
        chapters: [
            {
                id: 'one',
                title: 'Chapter One',
                text: 'First chapter text{a footnote} with a citation<ko2020> and a ~bug~bug.',
            },
            { id: 'two', title: 'Chapter Two', text: 'Second chapter text.' },
            {
                id: 'soon',
                title: 'Forthcoming Chapter',
                text: 'Unpublished text.',
                forthcoming: true,
            },
        ],
        references: {
            ko2020: ['Ko, A.', '2020', 'A title', 'A source', '', ''],
        },
        glossary: {
            bug: { phrase: 'bug', definition: 'A defect', synonyms: [] },
        },
    });

    await page.goto('/write/epubtest/1', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.epub')).toBeVisible({ timeout: 20000 });

    const path = testInfo.outputPath('standard.epub');
    const filename = await download(page, 'standard', path);
    expect(filename).toBe('epub-book.epub');

    // Readers identify an EPUB by reading a fixed range at the head of the
    // file, which only works if mimetype is the first entry and uncompressed.
    const bytes = readFileSync(path);
    expect(bytes.subarray(30, 38).toString()).toBe('mimetype');
    expect(bytes.subarray(38, 58).toString()).toBe('application/epub+zip');

    // The archive is well formed enough for a real unzip to verify it.
    execFileSync('unzip', ['-t', path]);

    const names = listing(path).map((e) => e.name);
    expect(names).toContain('OEBPS/content.opf');
    expect(names).toContain('OEBPS/nav.xhtml');
    expect(names).toContain('OEBPS/one.xhtml');
    expect(names).toContain('OEBPS/two.xhtml');
    // Forthcoming chapters are left out, as they are in the print view.
    expect(names).not.toContain('OEBPS/soon.xhtml');

    const one = entry(path, 'OEBPS/one.xhtml');
    expect(one).toContain('First chapter text');
    expect(one).toContain('a footnote');
    // Citations and definitions become links to back matter that exists.
    expect(one).toContain('references.xhtml#ref-ko2020');
    expect(one).toContain('glossary.xhtml#gloss-bug');
    expect(entry(path, 'OEBPS/references.xhtml')).toContain('id="ref-ko2020"');
    expect(entry(path, 'OEBPS/glossary.xhtml')).toContain('id="gloss-bug"');

    const opf = entry(path, 'OEBPS/content.opf');
    expect(opf).toContain('<dc:title>Epub Book</dc:title>');
    expect(opf).toContain('Epub Author');

    expect(entry(path, 'OEBPS/two.xhtml')).not.toContain('Unpublished text');

    expectNoCycles(errors);
});

test('a smaller image preset produces a smaller image', async ({
    page,
}, testInfo) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'epubimages@example.com');
    // An image the page can genuinely fetch: the app serves its own icon, so
    // this exercises the real fetch-decode-resize-encode path in a browser.
    const image = `${BASE_URL}/icons/icon.png`;
    await seedBook(uid, 'epubimages', {
        title: 'Image Book',
        chapters: [
            {
                id: 'one',
                title: 'One',
                text: `|${image}|An icon|A caption||`,
            },
        ],
    });

    await page.goto('/write/epubimages/1', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.epub')).toBeVisible({ timeout: 20000 });

    const imageBytesFor = async (size: string) => {
        const path = testInfo.outputPath(`${size}.epub`);
        await download(page, size, path);
        const images = listing(path).filter((e) =>
            e.name.startsWith('OEBPS/images/'),
        );
        expect(images, `${size} should package the image`).toHaveLength(1);
        // The chapter points at whatever the image was named.
        expect(entry(path, 'OEBPS/one.xhtml')).toContain('<img src="images/');
        return images[0].size;
    };

    const large = await imageBytesFor('large');
    const compact = await imageBytesFor('compact');

    // The source is 640x639. Compact shrinks it to 480px and drops color, so
    // it must come out clearly smaller -- which also proves the size menu is
    // wired to the encoder rather than reusing a stale build.
    expect(compact).toBeLessThan(large);

    expectNoCycles(errors);
});

/**
 * Small e-readers often have almost no default stylesheet, so anything the
 * packaged CSS leaves unsaid is left unrendered. An XTeink X3 ran glossary
 * terms straight into their definitions for exactly that reason. This strips
 * the browser's own defaults and checks the packaged stylesheet stands alone.
 */
test('the packaged stylesheet renders correctly with no reading-system defaults', async ({
    page,
}, testInfo) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'epubcss@example.com');
    await seedBook(uid, 'epubcss', {
        title: 'CSS Book',
        chapters: [
            {
                id: 'one',
                title: 'One',
                text: '# A header\n\nText with `code`js.\n\n1. First\n\n2. Second',
            },
        ],
        glossary: {
            bug: {
                phrase: 'bug',
                definition: 'A defect in software.',
                synonyms: [],
            },
        },
    });

    await page.goto('/write/epubcss/1', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.epub')).toBeVisible({ timeout: 20000 });

    const epub = testInfo.outputPath('css.epub');
    await download(page, 'standard', epub);

    const unpacked = mkdtempSync(join(tmpdir(), 'epub-css-'));
    execFileSync('unzip', ['-q', '-o', epub, '-d', unpacked]);
    const read = (name: string) =>
        readFileSync(join(unpacked, 'OEBPS', name), 'utf8');
    const stylesheet = read('style.css');

    // Everything a reading system would normally supply, removed.
    const strip = `* { display: inline; font-size: inherit; font-family: inherit;
        font-weight: inherit; font-style: inherit; list-style: none; margin: 0;
        padding: 0; border: 0; vertical-align: baseline; white-space: normal;
        border-collapse: separate; }`;
    const render = async (name: string) =>
        page.setContent(
            read(name)
                .replace(/<link rel="stylesheet"[^>]*>/, '')
                .replace(
                    '</head>',
                    `<style>${strip}</style><style>${stylesheet}</style></head>`,
                ),
        );

    await render('glossary.xhtml');
    // Classed paragraphs rather than a definition list: <dt>/<dd> flatten on a
    // reader that doesn't know them, and <dt> can hold nothing block-level.
    expect(
        await page.evaluate(() => {
            const term = document.querySelector('.term');
            const meaning = document.querySelector('.meaning');
            if (!term || !meaning)
                return `missing ${term ? '.meaning' : '.term'}`;
            return (
                meaning.getBoundingClientRect().top >=
                term.getBoundingClientRect().bottom
            );
        }),
        'a glossary term and its definition ran together',
    ).toBe(true);

    await render('one.xhtml');
    const chapter = await page.evaluate(() => {
        const size = (selector: string) => {
            const element = document.querySelector(selector);
            return element
                ? parseFloat(getComputedStyle(element).fontSize)
                : null;
        };
        const list = document.querySelector('ol');
        const code = document.querySelector('code');
        return {
            heading: size('h2'),
            paragraph: size('p'),
            codeFamily: code ? getComputedStyle(code).fontFamily : null,
            listType: list ? getComputedStyle(list).listStyleType : null,
            listPosition: list
                ? getComputedStyle(list).listStylePosition
                : null,
        };
    });

    // Headings were all one size on the device; code was not monospace; an
    // ordered list came out bulleted; wrapped list items didn't hang.
    expect(chapter.heading).toBeGreaterThan(chapter.paragraph as number);
    expect(chapter.codeFamily).toContain('monospace');
    expect(chapter.listType).toBe('decimal');
    expect(chapter.listPosition).toBe('outside');

    expectNoCycles(errors);
});
