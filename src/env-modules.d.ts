// src/lib is published as bookish-press and built by bookish-reader, which is
// still on SvelteKit 2, where only the $env/* modules exist. So library code
// keeps importing $env/*. SvelteKit 3 still serves those modules, as
// deprecated re-exports of $app/env/public, but no longer generates their
// types; these declarations restore them. Move src/lib to $app/env/public
// once every consumer is on SvelteKit 3.
declare module '$env/static/public' {
    export * from '$app/env/public';
}

declare module '$env/dynamic/public' {
    export * as env from '$app/env/public';
}
