// We use these unique objects as keys in Svelte context in order
// to avoid key collisions and prevent typos. This is partly
// future-proofing, but also because getContext<Type>() isn't type safe,
// as the resulting value is coerced to Type even if it's not that value.

import { getContext } from 'svelte';
import { get, type Writable } from 'svelte/store';
import type Book from '../../models/book/Book';
import type Chapter from '../../models/book/Chapter';
import type BookSaveStatus from '../../models/book/BookSaveStatus';
import type Edition from '../../models/book/Edition';
import type Authentication from '../Authentication';
import type CaretState from '../editor/CaretState';
import type ChapterContext from './ChapterContext';
import { page } from '$app/stores';
import { updateLock } from '../../models/CRUD';
import type { DocumentReference } from 'firebase/firestore';
import type ChapterNode from '../../models/chapter/ChapterNode';

export type DarkModeStore = Writable<boolean>;
export const DARK_MODE = Symbol('dark');
export function getDarkMode() {
    return getContext<DarkModeStore>(DARK_MODE);
}

export type UserStore = Writable<Authentication | undefined>;
export const USER = Symbol('user');
export function getUser() {
    return getContext<UserStore>(USER);
}

export type BookStore = Writable<Book | undefined>;
export const BOOK = Symbol('book');
export function getBook() {
    return getContext<BookStore>(BOOK);
}

export type EditionStore = Writable<Edition | undefined>;
export const EDITION = Symbol('edition');
export function getEdition() {
    return getContext<EditionStore>(EDITION);
}

export type ChapterText = [DocumentReference, string][];
export type ChapterTextStore = Writable<ChapterText | undefined>;
export const CHAPTERTEXT = Symbol('chaptertext');
export function getChapterText() {
    return getContext<ChapterTextStore>(CHAPTERTEXT);
}

export type ChapterStore = Writable<ChapterContext>;
export const CHAPTER = Symbol('chapter');
export function getChapter() {
    return getContext<ChapterStore>(CHAPTER);
}

export type RootStore = Writable<ChapterNode>;
export const ROOT = Symbol('root');
export function getRoot() {
    return getContext<RootStore>(ROOT);
}

/**
 * Update the edition that contains the chapter, then update the
 * global edition store with the new edition, propogating the changes everywhere.
 */
export function setChapter(
    store: EditionStore,
    previous: Chapter,
    chapter: Chapter,
) {
    // Don't set if its the same chapter.
    if (previous === chapter) return;
    const edition = get(store);
    if (edition) store.set(edition.withRevisedChapter(previous, chapter));
}

function isRouteWrite(): boolean {
    return get(page).route.id?.startsWith('/(app)/write') ?? false;
}

export function isChapterEditable(): boolean {
    if (!isRouteWrite()) return false;
    const auth = get(getUser());
    const chapter = get(getChapter());
    const edition = get(getEdition());
    const book = get(getBook());
    return (
        chapter !== undefined &&
        edition !== undefined &&
        book !== undefined &&
        auth !== undefined &&
        auth.user !== null &&
        (chapter.chapter.isEditor(auth.user.uid) ||
            edition.isEditor(auth.user.uid) ||
            book.isEditor(auth.user.uid))
    );
}

export function isEditionEditable(): boolean {
    if (!isRouteWrite()) return false;
    const auth = get(getUser());
    const edition = get(getEdition());
    const book = get(getBook());
    return (
        edition !== undefined &&
        book !== undefined &&
        auth !== undefined &&
        auth.user !== null &&
        (edition.isEditor(auth.user.uid) || book.isEditor(auth.user.uid))
    );
}

export function isEditionPartiallyEditable(): boolean {
    if (!isRouteWrite()) return false;
    const auth = get(getUser());
    const edition = get(getEdition());
    return (
        edition !== undefined &&
        auth !== undefined &&
        auth.user !== null &&
        edition.isChapterEditor(auth.user.uid)
    );
}

export function isBookEditable(): boolean {
    if (!isRouteWrite()) return false;
    const auth = get(getUser());
    const book = get(getBook());
    return (
        book !== undefined &&
        auth !== undefined &&
        auth.user !== null &&
        book.isEditor(auth.user.uid)
    );
}

export const BASE = Symbol('base');
export type BaseStore = Writable<string>;
export function getBase() {
    return getContext<BaseStore>(BASE);
}

export const CARET = Symbol('caret');
export function getCaret() {
    return getContext<Writable<CaretState | undefined>>(CARET);
}

export const STATUS = Symbol('status');
export type StatusStore = Writable<BookSaveStatus>;
export function getStatus() {
    return getContext<StatusStore>(STATUS);
}

export const EDITORS = Symbol('editors');
export type EditorsStore = Writable<Map<string, string>>;
export function getEditors() {
    return getContext<EditorsStore>(EDITORS);
}

export async function lease(
    authStore: UserStore,
    editionStore: EditionStore,
    contentID: string,
    lock: boolean,
): Promise<boolean> {
    const edition = get(editionStore);
    const auth = get(authStore);
    if (edition && auth && auth.user) {
        await updateLock(edition, auth.user.uid, contentID, lock);
        const latestEdition = get(editionStore);
        const latestAuth = get(authStore);
        if (latestEdition && latestAuth && latestAuth.user) {
            editionStore.set(
                latestEdition.withLock(latestAuth.user.uid, contentID, lock),
            );
            return true;
        } else return false;
    } else return false;
}

export function getLeasee(
    authStore: UserStore,
    editionStore: EditionStore,
    contentID: string,
): string | boolean {
    const edition = get(editionStore);
    const auth = get(authStore);
    if (edition !== undefined && auth !== undefined && auth.user !== null) {
        const leasee = edition.getLeasee(contentID);
        if (leasee === undefined) return false;
        else if (leasee === auth.user.uid) return true;
        else return leasee;
    } else return false;
}
