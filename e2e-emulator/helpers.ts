import { expect, type Page } from '@playwright/test';
import { EMULATOR_PORTS } from '../playwright.emulator.config';

export const PROJECT = 'demo-bookish';
const AUTH = `http://127.0.0.1:${EMULATOR_PORTS.auth}`;
const FIRESTORE = `http://127.0.0.1:${EMULATOR_PORTS.firestore}`;
const owner = {
    Authorization: 'Bearer owner',
    'Content-Type': 'application/json',
};

/** Collect page errors and console errors for later assertions. */
export function captureErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (message) => {
        if (message.type() === 'error')
            errors.push('console: ' + message.text());
    });
    return errors;
}

/** Assert that no Svelte effect cycles occurred. */
export function expectNoCycles(errors: string[]) {
    expect(
        errors.filter((e) => e.includes('effect_update_depth_exceeded')),
    ).toEqual([]);
}

/**
 * Sign in through the auth emulator's email link flow: submit the login form,
 * fetch the out-of-band link from the emulator, rewrite its target to the
 * app under test, and follow it through /confirm.
 */
export async function signIn(page: Page, email: string) {
    // Accept the "confirm your email" prompt if localStorage was lost.
    page.on('dialog', (dialog) => dialog.accept(email));

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[type=email]').fill(email);
    await page.locator('input[type=email]').press('Enter');
    await expect(page.getByRole('status')).toContainText('Check your email');

    const oob = (await (
        await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/oobCodes`)
    ).json()) as { oobCodes: { email: string; oobLink: string }[] };
    const link = oob.oobCodes
        .filter((code) => code.email === email)
        .at(-1)?.oobLink;
    if (!link) throw new Error(`No sign-in link for ${email} in the emulator`);

    await page.goto(link, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/write', { timeout: 15000 });
    return uidFor(email);
}

/** Look up an account's uid in the auth emulator. */
export async function uidFor(email: string): Promise<string> {
    const accounts = (await (
        await fetch(
            `${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`,
            { method: 'POST', headers: owner, body: JSON.stringify({}) },
        )
    ).json()) as { userInfo?: { email: string; localId: string }[] };
    const uid = accounts.userInfo?.find((u) => u.email === email)?.localId;
    if (!uid) throw new Error(`No account for ${email} in the auth emulator`);
    return uid;
}

/** Change an account's email via the emulator (test cleanup/arrangement). */
export async function accountExists(email: string): Promise<boolean> {
    const accounts = (await (
        await fetch(
            `${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`,
            { method: 'POST', headers: owner, body: JSON.stringify({}) },
        )
    ).json()) as { userInfo?: { email: string }[] };
    return accounts.userInfo?.some((u) => u.email === email) ?? false;
}

/** Create an account directly in the auth emulator (for arranging tests). */
export async function createAccount(email: string) {
    const res = await fetch(
        `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'probe-password-1' }),
        },
    );
    if (!res.ok) throw new Error(`createAccount ${email}: ${await res.text()}`);
}

// ——— Firestore emulator REST seeding ———

const DB = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents`;
const REFBASE = `projects/${PROJECT}/databases/(default)/documents`;

type Value = Record<string, unknown>;
const S = (s: string): Value => ({ stringValue: s });
const B = (b: boolean): Value => ({ booleanValue: b });
const I = (n: number): Value => ({ integerValue: String(n) });
const NULL: Value = { nullValue: null };
const ARR = (...values: Value[]): Value => ({ arrayValue: { values } });
const MAP = (fields: Record<string, Value>): Value => ({
    mapValue: { fields },
});
const REF = (path: string): Value => ({
    referenceValue: `${REFBASE}/${path}`,
});

async function put(path: string, fields: Record<string, Value>) {
    const res = await fetch(`${DB}/${path}`, {
        method: 'PATCH',
        headers: owner,
        body: JSON.stringify({ fields }),
    });
    if (!res.ok)
        throw new Error(`Seeding ${path}: ${res.status} ${await res.text()}`);
}

export type SeedChapter = {
    id: string;
    title: string;
    text: string;
    forthcoming?: boolean;
};

/**
 * Seed a book the given user can edit, with one edition and the given
 * chapters, references, and glossary. Ids are caller-chosen so each test
 * file can use its own book without cross-test coupling.
 */
export async function seedBook(
    uid: string,
    bookID: string,
    options: {
        title?: string;
        authors?: string[];
        chapters: SeedChapter[];
        references?: Record<string, string | string[]>;
        glossary?: Record<
            string,
            { phrase: string; definition: string; synonyms: string[] }
        >;
    },
) {
    const title = options.title ?? 'Probe Book';
    const authors = options.authors ?? ['Probe Author'];
    const editionPath = `books/${bookID}/editions/${bookID}edition`;

    for (const chapter of options.chapters)
        await put(`${editionPath}/chapters/${chapter.id}`, {
            text: S(chapter.text),
        });

    await put(editionPath, {
        bookRef: REF(`books/${bookID}`),
        title: S(title),
        number: I(1),
        summary: S(''),
        published: NULL,
        authors: ARR(...authors.map(S)),
        images: MAP({}),
        description: S(''),
        chapters: ARR(
            ...options.chapters.map((chapter) =>
                MAP({
                    ref: REF(`${editionPath}/chapters/${chapter.id}`),
                    id: S(chapter.id),
                    title: S(chapter.title),
                    authors: ARR(),
                    image: NULL,
                    numbered: B(true),
                    forthcoming: B(chapter.forthcoming ?? false),
                    uids: ARR(S(uid)),
                }),
            ),
        ),
        license: S('All rights reserved.'),
        acknowledgements: S(''),
        tags: ARR(),
        sources: MAP({}),
        references: MAP(
            Object.fromEntries(
                Object.entries(options.references ?? {}).map(([id, text]) => [
                    id,
                    typeof text === 'string' ? S(text) : ARR(...text.map(S)),
                ]),
            ),
        ),
        symbols: MAP({}),
        glossary: MAP(
            Object.fromEntries(
                Object.entries(options.glossary ?? {}).map(([id, entry]) => [
                    id,
                    MAP({
                        phrase: S(entry.phrase),
                        definition: S(entry.definition),
                        synonyms: ARR(...entry.synonyms.map(S)),
                    }),
                ]),
            ),
        ),
        theme: NULL,
        base: NULL,
        uids: ARR(S(uid)),
        chapteruids: ARR(S(uid)),
        active: MAP({}),
        gtagid: NULL,
    });

    await put(`books/${bookID}`, {
        title: S(title),
        authors: ARR(...authors.map(S)),
        description: S(''),
        cover: NULL,
        published: B(false),
        editions: ARR(
            MAP({
                ref: REF(editionPath),
                summary: S(''),
                number: I(1),
                published: NULL,
                editionuids: ARR(S(uid)),
                chapteruids: ARR(S(uid)),
            }),
        ),
        domain: NULL,
        uids: ARR(S(uid)),
        readuids: ARR(),
    });
}

/** Open a chapter's editor and wait for the editable body to be ready. */
export async function openChapterEditor(
    page: Page,
    bookID: string,
    chapterID: string,
    errors: string[] = [],
) {
    await page.goto(`/write/${bookID}/${chapterID}`, {
        waitUntil: 'domcontentloaded',
    });
    try {
        await page.waitForSelector('.bookish-chapter-body', {
            timeout: 20000,
        });
    } catch (error) {
        const body = ((await page.textContent('body')) ?? '')
            .replace(/\s+/g, ' ')
            .slice(0, 400);
        throw new Error(
            `Chapter editor did not render. Page: ${body}\nConsole: ${errors
                .slice(0, 5)
                .join('\n')}`,
            { cause: error },
        );
    }
    // Let the streamed chapter text and editor mount settle.
    await page.waitForTimeout(1000);
}

/**
 * Wait for a full save round-trip after an edit: the status must first leave
 * Saved (Changed/Saving), then return to it, then a beat for the Firestore
 * listener echo to land. Editing again before the echo arrives can lose the
 * newer local edits to the echoed snapshot — a pre-existing race in the
 * edition listener — so tests pace their edit phases with this.
 */
export async function waitForSaveRoundtrip(page: Page) {
    const status = page.locator('small.status');
    await expect(status).not.toContainText('Saved', { timeout: 5000 });
    await expect(status).toContainText('Saved', { timeout: 15000 });
    await page.waitForTimeout(400);
}

/** The save status indicator in the header; wait for a completed save.
 *  (Persistence is asserted separately by reloading; this just waits for
 *  the debounced save pipeline to settle.) */
export async function expectSaved(page: Page) {
    await expect(page.locator('small.status')).toContainText('Saved', {
        timeout: 15000,
    });
}
