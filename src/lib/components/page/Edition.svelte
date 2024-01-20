<script lang="ts">
    import type Theme from '$lib/models/book/Theme';
    import type EditionModel from '$lib/models/book/Edition';
    import smoothscroll from 'smoothscroll-polyfill';
    import { goto } from '$app/navigation';
    import { onMount, setContext } from 'svelte';
    import { writable } from 'svelte/store';
    import {
        BASE,
        DARK_MODE,
        getBook,
        type BaseStore,
        type DarkModeStore,
    } from './Contexts';
    import { BookishTheme } from '$lib/models/book/Theme';
    import { isDark, setDark } from '../../util/dark';
    import { page } from '$app/stores';
    import Title from './Title.svelte';
    import Page from './Page.svelte';

    // Poly fill smooth scrolling for Safari.
    onMount(() => smoothscroll.polyfill());

    // The book and edition to render
    export let edition: EditionModel | undefined;

    // The base path allows links to adjust to different routing contexts in which a book is placed.
    // For example, when the book is hosted alone, all routes might start with the bare root "/",
    // but when the book is being viewed or edited in the Bookish app, it needs a prefix for the
    // route in the app.
    export let base: string = '';

    let book = getBook();

    // When the base changes, update the context.
    let baseStore = writable<string>(base);
    $: setContext<BaseStore>(BASE, baseStore);
    $: baseStore.set(base);

    // Default dark mode to whatever's stored in local storage, if anything.
    // respect user choice on the website despite the system theme
    let darkMode = writable<boolean>(isDark());

    // Expose dark mode to descendants
    setContext<DarkModeStore>(DARK_MODE, darkMode);

    // When dark mode changes, update the body's class list.
    $: {
        setDark($darkMode);

        // Set the theme, whatever it is, and change it when the edition changes
        setTheme(edition?.getTheme() ?? BookishTheme);
    }

    // The CSS to set on the edition.
    let themeCSS: string;

    // Set the theme on mount.
    onMount(() => {
        setTheme(edition?.getTheme() ?? BookishTheme);
    });

    // Redirect old hash routes by simply replacing their hash before routing.
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/'))
        goto(location.hash.replace('#', ''));

    /** Given a theme, sets the appropriate CSS rules in the browser to apply the theme. */
    function setTheme(theme: Theme | null) {
        if (theme === null) theme = BookishTheme;

        themeCSS = `
            ${(theme.imports ?? [])
                .map((url) => `@import url(${url});`)
                .join('\n')}
            .bookish {
                ${theme.light ? toRules(theme.light) : ''}
                ${theme.fonts ? toRules(theme.fonts) : ''}
                ${theme.sizes ? toRules(theme.sizes) : ''}
                ${theme.weights ? toRules(theme.weights) : ''}
                ${theme.spacing ? toRules(theme.spacing) : ''}
            }
            .dark {
                ${theme.dark ? toRules(theme.dark) : ''}
            }
        `;
    }

    function toRules(set: Record<string, string>) {
        return Object.keys(set)
            .map((name) => {
                const value = set[name];
                if (value.length > 0) {
                    const cssVariable =
                        '--bookish-' +
                        name
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            .split(' ')
                            .map((s) => s.toLowerCase())
                            .join('-')
                            .replace(/([0-9])/g, '-$1-');
                    return `${cssVariable}: ${value};`;
                }
            })
            .join('\n\t\t');
    }
</script>

<svelte:head>
    <!-- Keep the imports up to date -->
    {@html '<' + `style>${themeCSS}</style>`}

    {#if edition}
        <meta property="og:title" content={edition.getTitle()} />
        <meta property="og:image" content={edition.getImage('cover')} />
        <meta property="og:description" content={edition.getDescription()} />
        <meta property="og:type" content="book" />
        <meta property="og:author" content={edition.getAuthorsText()} />
        <meta
            property="og:url"
            content={edition.base ??
                `https://bookish.press/${
                    $book && $book.domain ? $book.domain : $page.params.bookid
                }`}
        />
    {/if}
</svelte:head>

<main class="bookish {$darkMode ? ' dark' : ''}">
    {#if edition}
        <slot />
        <!-- No edition to render? Coming soon. -->
    {:else if $book}
        <Page title={$book.title}>
            <div class="comingsoon">
                <Title>{$book.title}</Title>
                <p>Coming soon.</p>
            </div>
        </Page>
    {/if}
</main>

<style>
    * {
        box-sizing: border-box;
    }

    /* WINDOW AND PAGES */
    :global(body) {
        margin: 0;
        padding: 0;
        background-color: var(--bookish-background-color);
    }

    /* The root container for a book */
    .bookish {
        font-weight: var(--bookish-paragraph-font-weight);
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
        background-color: var(--bookish-background-color);
        color: var(--bookish-paragraph-color);
        width: 100%;
        z-index: 0;
        text-align: left;
    }

    .comingsoon {
        margin-top: 4em;
        text-align: center;
    }
</style>
