// We use these unique objects as keys in Svelte context in order
// to avoid key collisions and prevent typos. This is partly
// future-proofing, but also because getContext<Type>() isn't type safe,
// as the resulting value is coerced to Type even if it's not that value.

import { getContext } from "svelte";
import type { Writable } from "svelte/store";
import type Book from "../../models/book/Book";
import type Edition from "../../models/book/Edition";
import type Authentication from "../Authentication";
import type CaretContext from "../editor/CaretContext";
import type ChapterContext from "./ChapterContext";

export type AuthContext = Writable<Authentication>;
export const AUTH = Symbol("auth");
export function getAuth() { return getContext<AuthContext>(AUTH); }

export type EditionStore = Writable<Edition>;
export const EDITION = Symbol("edition");
export function getEdition() { return getContext<EditionStore>(EDITION); }

export type CaretStore = Writable<CaretContext>;
export const CARET = Symbol("caret");
export function getCaret() { return getContext<CaretStore>(CARET); }

export type DarkModeStore = Writable<boolean>;
export const DARK_MODE = Symbol("dark");
export function getDarkMode() { return getContext<DarkModeStore>(DARK_MODE); }

export type ChapterStore = Writable<ChapterContext>;
export const CHAPTER = Symbol("chapter");
export function getChapter() { return getContext<ChapterStore>(CHAPTER); }

export const EDITABLE = Symbol("editable");
export function isEditable() { return getContext(EDITABLE); }

export const BASE = Symbol("base");
export function getBase() { return getContext<string>(BASE); }

export const BOOK = Symbol("book");
export function getBook() { return getContext<Book>(BOOK); }