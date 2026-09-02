import { expect, test } from '@playwright/test';
import {
    captureErrors,
    expectNoCycles,
    expectSaved,
    openChapterEditor,
    seedBook,
    signIn,
} from './helpers';

// Uploads an image through the embed editor's file input, exercising
// BookMedia.upload (including its crypto.randomUUID naming) against the
// storage emulator, and the image chooser listing.
test('an image can be uploaded and appears in the chapter and chooser', async ({
    page,
}) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'images@example.com');
    await seedBook(uid, 'imagetest', {
        chapters: [
            {
                id: 'chap',
                title: 'Image Chapter',
                text: 'A paragraph before the image.',
            },
        ],
    });
    await openChapterEditor(page, 'imagetest', 'chap', errors);

    const toolbar = page.locator('section.bookish-editor-toolbar');

    // Make an empty paragraph so the block-insert command is enabled.
    await page.locator('.bookish-text', { hasText: 'paragraph' }).click();
    await page.keyboard.press('Enter');
    const imageButton = toolbar.locator(
        'button[title^="insert image or video"]',
    );
    await expect(imageButton).toBeEnabled();
    await imageButton.click();

    // The embed editor appears with a hidden file input; upload a real PNG.
    const fileInput = toolbar.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    // A minimal valid 8x8 PNG.
    const png = Buffer.from(
        '89504e470d0a1a0a0000000d494844520000000800000008080200000' +
            '04b6d29dc0000001d494441547801636460f8cf80019818460d1c3560' +
            'd4c0510343060600a33d017a1f9cf6dc0000000049454e44ae426082',
        'hex',
    );
    await fileInput.setInputFiles({
        name: 'probe-image.png',
        mimeType: 'image/png',
        buffer: png,
    });

    // The uploaded image renders in the chapter from the storage emulator.
    const image = page.locator('img.bookish-figure-image').first();
    await expect(image).toBeAttached({ timeout: 20000 });
    const src = await image.getAttribute('src');
    expect(src).toContain('imagetest');

    // The image chooser lists the uploaded image.
    await expect(
        page.locator('.bookish-image-chooser img.thumbnail').first(),
    ).toBeAttached({ timeout: 20000 });

    await expectSaved(page);

    // Persisted: the image is still in the chapter after a reload.
    await openChapterEditor(page, 'imagetest', 'chap', errors);
    await expect(
        page.locator('img.bookish-figure-image').first(),
    ).toBeAttached();

    expectNoCycles(errors);
});
