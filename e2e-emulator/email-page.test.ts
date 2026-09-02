import { expect, test } from '@playwright/test';
import { createAccount, signIn, uidFor } from './helpers';

// Exercises the change-login-email page against the auth emulator: the error
// path (address already in use — this feedback was dead code until the
// shadowed-variable fix) and the success path, verifying the account's email
// actually changed in the emulator.
test('the email page reports errors and changes the login email', async ({
    page,
}) => {
    await createAccount('occupied@example.com');
    await signIn(page, 'emailer@example.com');

    await page.goto('/email', { waitUntil: 'domcontentloaded' });
    const input = page.locator('input[type="email"]');
    const submit = page.locator('button[title="submit new email address"]');

    // Error path: an address that belongs to another account.
    await input.fill('occupied@example.com');
    await submit.click();
    await expect(page.getByRole('alert')).toContainText(
        'already associated with an account',
    );

    // Success path: a fresh address.
    await input.fill('emailer-new@example.com');
    await submit.click();
    await expect(page.getByRole('status')).toContainText(
        'Check your original email address',
    );
    await expect(submit).toBeDisabled();

    // The account's email actually changed in the emulator.
    await expect(async () => {
        await uidFor('emailer-new@example.com');
    }).toPass({ timeout: 10000 });
});
