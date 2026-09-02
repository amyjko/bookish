import { expect, test } from '@playwright/test';
import {
    captureErrors,
    expectNoCycles,
    expectSaved,
    openChapterEditor,
    seedBook,
    signIn,
} from './helpers';

// Exercises each toolbar sub-editor in the real chapter editor against the
// emulators: inline code, links, citations, footnotes, comments, and tables —
// then reloads to prove the edits persisted through the save pipeline.
//
// Interaction notes learned the hard way: clicking a toolbar button moves
// focus to the toolbar and the editor ignores keys while unfocused, so any
// insert that is followed by typing clicks back into the target text (the way
// a mouse user edits). Each step targets a distinct word because insertions
// split the text spans around the caret.
test('toolbar tools edit and persist chapter annotations', async ({ page }) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'tools@example.com');
    await seedBook(uid, 'tooltest', {
        chapters: [
            {
                id: 'chap',
                title: 'Tool Chapter',
                text: 'Alpha beta gamma delta.\n\nSecond paragraph here.',
            },
        ],
        // The APA array form the app itself writes:
        // [authors, year, title, source, url, summary]. NOTE: the legacy
        // string form crashes the editor page with "e is not iterable" —
        // a real, separately-tracked app bug.
        references: {
            ref1: ['Author, A.', '2020', 'A cited work', 'A Journal', '', ''],
        },
    });
    await openChapterEditor(page, 'tooltest', 'chap', errors);

    const editor = page.locator('.bookish-editor').last();
    const toolbar = page.locator('section.bookish-editor-toolbar');
    const word = (text: string) =>
        page.locator('.bookish-text', { hasText: text }).first();

    // Click into the chapter text; the toolbar should become active.
    await word('Alpha').click();
    await expect(toolbar).not.toContainText('Select rich text');

    // Inline code: select a word, toggle code, choose a language.
    await word('gamma').dblclick();
    await toolbar.locator('button[title^="toggle code"]').click();
    // In editable mode inline code renders as a span, not a <code> element.
    await expect(page.locator('.bookish-code-inline').first()).toBeAttached();
    const languageSelect = toolbar.locator(
        'select[aria-label="choose language"]',
    );
    await expect(languageSelect).toBeVisible();
    await languageSelect.selectOption('python');

    // Link: select a word so the link wraps real text, then set its URL.
    await word('Alpha').dblclick();
    await toolbar.locator('button[title^="toggle link"]').click();
    const urlInput = toolbar.locator('input[aria-label="URL editor"]');
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://example.com/probe');
    await urlInput.press('Enter');

    // Citation: insert, then attach the seeded reference in the sub-editor.
    await word('delta').click();
    await toolbar.locator('button[title^="insert citations"]').click();
    const citationSelect = toolbar.locator(
        'select[aria-label="choose citations"]',
    );
    await expect(citationSelect).toBeVisible();
    await citationSelect.selectOption('ref1');
    await expect(
        page.locator('.bookish-citation-symbol').first(),
    ).toBeAttached();

    // Footnote: insert via the toolbar, then click into the marginal's text
    // and type its content.
    await word('Second').click();
    await toolbar.locator('button[title^="insert footnote"]').click();
    await expect(page.locator('.bookish-footnote')).toBeAttached();
    await page.locator('.bookish-footnote').click();
    await page.keyboard.type('My footnote note.');
    await expect(page.locator('.bookish-footnote')).toContainText(
        'My footnote note.',
    );

    // Comment: same click-into-the-marginal flow.
    await word('here').click();
    await toolbar.locator('button[title^="insert comment"]').click();
    await expect(
        page.locator('.bookish-comment-symbol').first(),
    ).toBeAttached();
    await page.locator('span.comment').click();
    await page.keyboard.type('A probe comment.');
    await expect(page.locator('span.comment')).toContainText(
        'A probe comment.',
    );

    // Table: create a fresh empty paragraph (caret lands at its start, which
    // is what enables block insertion), then insert and grow a table.
    await word('here').click();
    await page.keyboard.press('Escape');
    await word('here').click();
    await page.keyboard.press('Enter');
    const tableButton = toolbar.locator('button[title^="insert table"]');
    await expect(tableButton).toBeEnabled();
    await tableButton.click();
    await expect(editor.locator('table').first()).toBeAttached();
    const rowsBefore = await editor.locator('table tr').count();
    await toolbar.locator('button[title^="insert row below"]').click();
    await expect
        .poll(() => editor.locator('table tr').count())
        .toBeGreaterThan(rowsBefore);
    // The table position switch renders in the table sub-editor.
    await expect(
        toolbar.locator('span.switch button[data-value="<"]').first(),
    ).toBeAttached();

    await expectSaved(page);

    // Reload: everything must have persisted through Firestore.
    await openChapterEditor(page, 'tooltest', 'chap', errors);
    // Editable links render as spans; verify the URL through the sub-editor.
    await expect(
        page.locator('span.bookish-editor-link').first(),
    ).toBeAttached();
    await page.locator('span.bookish-editor-link').first().click();
    await expect(page.locator('input[aria-label="URL editor"]')).toHaveValue(
        'https://example.com/probe',
    );
    await expect(page.locator('.bookish-footnote')).toContainText(
        'My footnote note.',
    );
    await expect(
        page.locator('.bookish-comment-symbol').first(),
    ).toBeAttached();
    await expect(
        page.locator('.bookish-citation-symbol').first(),
    ).toBeAttached();
    await expect(page.locator('.bookish-code-inline').first()).toBeAttached();
    // The chosen language persisted: reopen the code sub-editor and check it.
    await page.locator('.bookish-code-inline').first().click();
    await expect(
        page.locator('select[aria-label="choose language"]'),
    ).toHaveValue('python');
    await expect(page.locator('.bookish-editor table').first()).toBeAttached();

    expectNoCycles(errors);
});
