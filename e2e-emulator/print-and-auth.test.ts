import { expect, test } from '@playwright/test';
import { captureErrors, expectNoCycles, seedBook, signIn } from './helpers';

// The write route's print view: every non-forthcoming chapter on one page,
// no toolbar, and a print-appropriate document title. Plus an auth negative:
// a garbage confirmation link is rejected.
test('the write print view renders all chapters without the toolbar', async ({
    page,
}) => {
    const errors = captureErrors(page);
    const uid = await signIn(page, 'printer@example.com');
    await seedBook(uid, 'printtest', {
        title: 'Print Book',
        authors: ['Print Author'],
        chapters: [
            { id: 'one', title: 'Chapter One', text: 'First chapter text.' },
            { id: 'two', title: 'Chapter Two', text: 'Second chapter text.' },
            {
                id: 'soon',
                title: 'Forthcoming Chapter',
                text: 'Unpublished text.',
                forthcoming: true,
            },
        ],
    });

    await page.goto('/write/printtest/1/print', {
        waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('.bookish-chapter-body').first()).toBeAttached({
        timeout: 20000,
    });

    const body = page.locator('main.bookish');
    await expect(body).toContainText('First chapter text.');
    await expect(body).toContainText('Second chapter text.');
    await expect(body).not.toContainText('Unpublished text.');
    await expect(page.locator('section.bookish-editor-toolbar')).toHaveCount(0);
    await expect
        .poll(() => page.title())
        .toContain('Print Book - 1st Edition - Print Author');

    expectNoCycles(errors);
});

test('an invalid confirmation link is rejected', async ({ page }) => {
    // A URL that is not an email sign-in link at all.
    await page.goto('/confirm', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('alert')).toContainText(
        "This isn't a valid login link.",
    );
});
