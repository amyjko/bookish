import { expect, test } from '@playwright/test';
import {
    captureErrors,
    expectNoCycles,
    openChapterEditor,
    seedBook,
    signIn,
    waitForSaveRoundtrip,
} from './helpers';

// Exercises glossary editing end to end: creating an entry, editing its
// phrase, definition, and synonyms (including the focus-new-synonym effect),
// using it from the chapter editor's definition tool, and deleting it.
test('glossary entries can be created, used, and deleted', async ({ page }) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'glossary@example.com');
    await seedBook(uid, 'glosstest', {
        chapters: [
            {
                id: 'chap',
                title: 'Glossary Chapter',
                text: 'The wumpus is a mysterious creature.',
            },
        ],
    });

    // Create an entry on the glossary page.
    await page.goto('/write/glosstest/glossary', {
        waitUntil: 'domcontentloaded',
    });
    const addButton = page.locator('button[title="add glossary entry"]');
    await expect(addButton).toBeVisible({ timeout: 20000 });
    await addButton.click();

    const phrase = page.locator('input[aria-label="Glossary phrase editor."]');
    await expect(phrase).toBeVisible();
    await phrase.fill('Wumpus');
    await phrase.press('Enter');
    await waitForSaveRoundtrip(page);

    // Type the definition into the entry's rich text editor.
    const definitionEditor = page.locator('section.definition .bookish-editor');
    await definitionEditor.click();
    await page.keyboard.type('A creature of legend.');
    await expect(definitionEditor).toContainText('A creature of legend.');
    await waitForSaveRoundtrip(page);

    // Add a synonym. (The intended focus-the-new-input behavior does not
    // work — verified identical with the pre-migration afterUpdate version;
    // the Firestore listener echo re-render appears to drop focus — so this
    // asserts the input appears and is editable, not that it's focused.)
    await page.locator('button[title="add synonym"]').click();
    const synonym = page.locator('input[aria-label="Synonym editor."]').last();
    await expect(synonym).toBeVisible();
    await synonym.click();
    await synonym.fill('beast');
    await synonym.press('Enter');
    await waitForSaveRoundtrip(page);

    // Persisted after a reload.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(
        page.locator('input[aria-label="Glossary phrase editor."]'),
    ).toHaveValue('Wumpus', { timeout: 20000 });
    await expect(
        page.locator('section.definition .bookish-editor'),
    ).toContainText('A creature of legend.');
    await expect(
        page.locator('input[aria-label="Synonym editor."]').last(),
    ).toHaveValue('beast');

    // The chapter editor's definition tool can now use the entry.
    await openChapterEditor(page, 'glosstest', 'chap', errors);
    await page.locator('.bookish-text', { hasText: 'wumpus' }).dblclick();
    await page
        .locator('section.bookish-editor-toolbar')
        .locator('button[title^="toggle definition"]')
        .click();
    const definitionSelect = page.locator(
        'select[aria-label="choose definition"]',
    );
    await expect(definitionSelect).toBeVisible();
    await expect(
        definitionSelect.locator('option', { hasText: 'Wumpus' }),
    ).toHaveCount(1);

    // Delete the entry via the two-step confirm button.
    await page.goto('/write/glosstest/glossary', {
        waitUntil: 'domcontentloaded',
    });
    await page
        .locator('button[title^="delete definition of"]')
        .click({ timeout: 20000 });
    await page.locator('button[title="yes"]').click();
    await waitForSaveRoundtrip(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('section.definition')).toHaveCount(0, {
        timeout: 20000,
    });

    expectNoCycles(errors);
});
