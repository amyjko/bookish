import { expect, test } from '@playwright/test';
import {
    captureErrors,
    expectNoCycles,
    seedBook,
    signIn,
    waitForSaveRoundtrip,
} from './helpers';

// Regression test for the lost-update race: a save's Firestore listener echo
// used to clobber any edits made after the save started, so editing several
// fields in quick succession (faster than the ~1s debounce + roundtrip) lost
// all but the first. Edits here are deliberately NOT paced with save
// roundtrips; everything must still persist.
test('rapid successive edits all survive the save echo', async ({ page }) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'rapid@example.com');
    await seedBook(uid, 'rapidtest', {
        chapters: [{ id: 'chap', title: 'Rapid Chapter', text: 'Some text.' }],
    });

    await page.goto('/write/rapidtest/glossary', {
        waitUntil: 'domcontentloaded',
    });
    const addButton = page.locator('button[title="add glossary entry"]');
    await expect(addButton).toBeVisible({ timeout: 20000 });
    await addButton.click();

    // Phrase, definition, and synonym in rapid succession, no pacing.
    const phrase = page.locator('input[aria-label="Glossary phrase editor."]');
    await phrase.fill('Zephyr');
    await phrase.press('Enter');

    const definitionEditor = page.locator('section.definition .bookish-editor');
    await definitionEditor.click();
    await page.keyboard.type('A gentle breeze.');

    await page.locator('button[title="add synonym"]').click();
    const synonym = page.locator('input[aria-label="Synonym editor."]').last();
    await expect(synonym).toBeFocused();
    await synonym.fill('wind');
    await synonym.press('Enter');

    // Let the final save (and its echo) land, then verify everything stuck.
    await waitForSaveRoundtrip(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(
        page.locator('input[aria-label="Glossary phrase editor."]'),
    ).toHaveValue('Zephyr', { timeout: 20000 });
    await expect(
        page.locator('section.definition .bookish-editor'),
    ).toContainText('A gentle breeze.');
    await expect(
        page.locator('input[aria-label="Synonym editor."]').last(),
    ).toHaveValue('wind');

    expectNoCycles(errors);
});
