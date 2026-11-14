import { expect, test } from '@playwright/test';
import {
    accountExists,
    captureErrors,
    callFunction,
    seedBook,
    setBookAccess,
    signIn,
    signUpForToken,
} from './helpers';

/** A suffix so repeated runs against one emulator don't collide. */
const run = () => Math.random().toString(36).slice(2, 8);

// The callable functions hand out emails and create accounts, so they must
// refuse strangers. These call them over HTTP as different users, the way
// anyone on the internet could.

test('only collaborators can look up each other’s emails', async () => {
    const id = run();
    const editor = await signUpForToken(`access-editor-${id}@example.com`);
    const chapterEditor = await signUpForToken(
        `access-chapter-${id}@example.com`,
    );
    const stranger = await signUpForToken(`access-stranger-${id}@example.com`);
    await seedBook(editor.uid, `accessbook${id}`, {
        chapters: [{ id: 'one', title: 'One', text: 'Text.' }],
    });
    await setBookAccess(`accessbook${id}`, [editor.uid], [chapterEditor.uid]);
    const uids = [editor.uid, chapterEditor.uid, stranger.uid];

    // No sign-in: refused outright.
    const anonymous = await callFunction('getUserEmailsGen2', { uids });
    expect(anonymous.error?.status).toBe('UNAUTHENTICATED');

    // A book editor sees the book's people, but not the stranger.
    const asEditor = await callFunction(
        'getUserEmailsGen2',
        { uids },
        editor.token,
    );
    expect(asEditor.result).toEqual({
        [editor.uid]: `access-editor-${id}@example.com`,
        [chapterEditor.uid]: `access-chapter-${id}@example.com`,
    });

    // A chapter editor shares the book too, so sees the same people.
    const asChapterEditor = await callFunction(
        'getUserEmailsGen2',
        { uids },
        chapterEditor.token,
    );
    expect(Object.keys(asChapterEditor.result as object).sort()).toEqual(
        [editor.uid, chapterEditor.uid].sort(),
    );

    // A signed-in stranger learns only their own email.
    const asStranger = await callFunction(
        'getUserEmailsGen2',
        { uids },
        stranger.token,
    );
    expect(asStranger.result).toEqual({
        [stranger.uid]: `access-stranger-${id}@example.com`,
    });

    // Malformed requests are rejected rather than crashing.
    const malformed = await callFunction('getUserEmailsGen2', {}, editor.token);
    expect(malformed.error?.status).toBe('INVALID_ARGUMENT');
});

test('only book editors can create accounts', async () => {
    const id = run();
    const editor = await signUpForToken(`creator-editor-${id}@example.com`);
    const stranger = await signUpForToken(`creator-stranger-${id}@example.com`);
    await seedBook(editor.uid, `creatorbook${id}`, {
        chapters: [{ id: 'one', title: 'One', text: 'Text.' }],
    });

    const anonymous = await callFunction('createUserWithEmailGen2', {
        email: `made-by-nobody-${id}@example.com`,
    });
    expect(anonymous.error?.status).toBe('UNAUTHENTICATED');

    const asStranger = await callFunction(
        'createUserWithEmailGen2',
        { email: `made-by-stranger-${id}@example.com` },
        stranger.token,
    );
    expect(asStranger.error?.status).toBe('PERMISSION_DENIED');
    expect(await accountExists(`made-by-nobody-${id}@example.com`)).toBe(false);
    expect(await accountExists(`made-by-stranger-${id}@example.com`)).toBe(
        false,
    );

    const invalid = await callFunction(
        'createUserWithEmailGen2',
        { email: 'not an email' },
        editor.token,
    );
    expect(invalid.error?.status).toBe('INVALID_ARGUMENT');

    const asEditor = await callFunction(
        'createUserWithEmailGen2',
        { email: `new-coauthor-${id}@example.com` },
        editor.token,
    );
    expect(typeof asEditor.result).toBe('string');
    expect(await accountExists(`new-coauthor-${id}@example.com`)).toBe(true);

    // Asking again returns the same account rather than a second one.
    const again = await callFunction(
        'createUserWithEmailGen2',
        { email: `new-coauthor-${id}@example.com` },
        editor.token,
    );
    expect(again.result).toBe(asEditor.result);
});

test('a newly added editor shows by email, before and after a reload', async ({
    page,
}) => {
    const id = run();
    const errors = captureErrors(page);
    const uid = await signIn(page, `adder-${id}@example.com`);
    await seedBook(uid, `adderbook${id}`, {
        chapters: [{ id: 'one', title: 'One', text: 'Text.' }],
    });

    await page.goto(`/write/adderbook${id}/1`, {
        waitUntil: 'domcontentloaded',
    });
    const editors = page.locator('section.emails').first();
    await expect(editors).toContainText(`adder-${id}@example.com`, {
        timeout: 20000,
    });

    await editors
        .locator('input[type=email]')
        .fill(`added-later-${id}@example.com`);
    await editors.getByRole('button', { name: /^give / }).click();
    // Shown at once, from the email that was typed, before any save.
    await expect(editors).toContainText(`added-later-${id}@example.com`);

    // After the autosave (debounced by a second), a fresh load gets the
    // email from the server instead.
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('section.emails').first()).toContainText(
        `added-later-${id}@example.com`,
        { timeout: 20000 },
    );
    expect(errors).toEqual([]);
});
