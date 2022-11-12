// We use these unique objects as keys in Svelte context in order
// to avoid key collisions and prevent typos. This is partly
// future-proofing, but also because getContext<Type>() isn't type safe,
// as the resulting value is coerced to Type even if it's not that value.
export const EDITION = Symbol("edition");
export const DARK_MODE = Symbol("dark");
export const BOOK = Symbol("book");
export const BASE = Symbol("base");
export const EDITABLE = Symbol("editable");
export const CHAPTER = Symbol("chapter");
export const CARET = Symbol("caret");