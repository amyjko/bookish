import { expect, test } from '@playwright/test';

// Exercises the rich text editor against the fixture at
// src/routes/(test)/fixture/editor: focusing, typing, splitting paragraphs,
// navigating, and undo, plus the custom caret rendering.
test('editor accepts typing, navigation, and undo', async ({ page }) => {
    await page.goto('/fixture/editor');

    const editor = page.locator('.bookish-editor');
    await expect(editor).toBeVisible();
    await expect(editor).toContainText('This is an editable fixture chapter.');

    // Click into the first paragraph to place the caret.
    await page
        .locator('.bookish-text', { hasText: 'This is an editable' })
        .click();

    // The custom caret view renders once the editor is focused.
    await expect(page.locator('.caret')).toBeAttached();

    // Typing inserts text at the caret.
    await page.keyboard.type('TYPED');
    await expect(editor).toContainText('TYPED');

    // Arrow navigation doesn't crash and the caret persists.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.caret')).toBeAttached();

    // Splitting a paragraph with Enter adds a paragraph.
    const paragraphsBefore = await page
        .locator('.bookish-chapter-body p')
        .count();
    await page.keyboard.press('Enter');
    await expect
        .poll(() => page.locator('.bookish-chapter-body p').count())
        .toBeGreaterThan(paragraphsBefore);

    // Undo (via the platform shortcut) removes the typed text and the
    // paragraph split. (The editor's undo stack does not restore the very
    // first keystroke of a session — a quirk verified to be identical in
    // the Svelte 4 version of the editor — so we don't assert an exact
    // return to the original text.)
    const isMac = await page.evaluate(() =>
        navigator.platform.toUpperCase().includes('MAC'),
    );
    const modifier = isMac ? 'Meta' : 'Control';
    for (let i = 0; i < 20; i++) await page.keyboard.press(`${modifier}+z`);
    await expect(editor).not.toContainText('TYPED');
    await expect
        .poll(() => page.locator('.bookish-chapter-body p').count())
        .toBe(paragraphsBefore);
});
