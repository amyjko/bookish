import { expect, test } from '@playwright/test';

// Verifies the marginal layout system against the fixture chapter at
// src/routes/(test)/fixture: on a wide viewport, every floating marginal
// (footnotes here) must be explicitly positioned by layoutMarginals()
// after hydration, and stacked without overlapping.
test('marginals are laid out in the right margin on a wide screen', async ({
    page,
}) => {
    await page.goto('/fixture');

    // The chapter server-renders with its footnote content.
    await expect(page.locator('.bookish-chapter-body')).toBeVisible();
    const marginals = page.locator('.bookish-marginal');
    await expect(marginals).toHaveCount(3);

    // The code block gets highlighted by Prism after hydration.
    await expect(
        page.locator('code.bookish-code .token').first(),
    ).toBeAttached();

    // After hydration, the layout pass positions each floating marginal
    // with explicit inline coordinates.
    for (const marginal of await marginals.all()) {
        await expect
            .poll(async () => marginal.evaluate((el) => el.style.top))
            .toMatch(/^\d+(\.\d+)?px$/);
        await expect
            .poll(async () => marginal.evaluate((el) => el.style.left))
            .not.toBe('');
    }

    // The marginals must not overlap vertically.
    const bounds = [];
    for (const marginal of await marginals.all()) {
        const box = await marginal.boundingBox();
        expect(box).not.toBeNull();
        if (box) bounds.push(box);
    }
    bounds.sort((a, b) => a.y - b.y);
    for (let i = 1; i < bounds.length; i++) {
        expect(bounds[i].y).toBeGreaterThanOrEqual(
            bounds[i - 1].y + bounds[i - 1].height,
        );
    }
});
