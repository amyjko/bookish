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

export type DarkModeStore = Writable<boolean>;
export const DARK_MODE = Symbol('dark');
export function getDarkMode() {
    return getContext<DarkModeStore>(DARK_MODE);
}

export type AuthContext = Writable<Authentication | undefined>;
export const AUTH = Symbol('auth');
export function getAuth() {
    return getContext<AuthContext>(AUTH);
}

export type BookStore = Writable<Book | undefined>;
export const BOOK = Symbol('book');
export function getBook() {
    return getContext<BookStore>(BOOK);
}

export type EditionContext = Writable<Edition | undefined>;
export const EDITION = Symbol('edition');
export function getEdition() {
    return getContext<EditionContext>(EDITION);
}

export type ChapterStore = Writable<ChapterContext>;
export const CHAPTER = Symbol('chapter');
export function getChapter() {
    return getContext<ChapterStore>(CHAPTER);
}

/**
 * Update the edition that contains the chapter, then update the
 * global edition store with the new edition, propogating the changes everywhere.
 */
export function setChapter(
    store: EditionContext,
    previous: Chapter,
    chapter: Chapter
) {
    const edition = get(store);
    if (edition) store.set(edition.withRevisedChapter(previous, chapter));
}

export const EDITABLE = Symbol('editable');
export function isEditable(): boolean {
    return getContext(EDITABLE);
}

export const BASE = Symbol('base');
export type BaseStore = Writable<string>;
export function getBase() {
    return getContext<BaseStore>(BASE);
}

export const ActiveEditorSymbol = Symbol('caret');
export function getCaret() {
    return getContext<Writable<CaretState | undefined>>(ActiveEditorSymbol);
}

export const STATUS = Symbol('status');
export type StatusContext = Writable<BookSaveStatus>;
export function getStatus() {
    return getContext<StatusContext>(STATUS);
}
