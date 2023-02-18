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
        type BaseStore,
        type DarkModeStore,
    } from './Contexts';
    import { BookishTheme } from '$lib/models/book/Theme';
    import { isDark, setDark } from '../../util/dark';

    // Poly fill smooth scrolling for Safari.
    onMount(() => smoothscroll.polyfill());

    // The book edition to render.
    export let edition: EditionModel;

    // The base path allows links to adjust to different routing contexts in which a book is placed.
    // For example, when the book is hosted alone, all routes might start with the bare root "/",
    // but when the book is being viewed or edited in the Bookish app, it needs a prefix for the
    // route in the app.
    export let base: string = '';

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
        setTheme(edition.getTheme() ?? BookishTheme);
    }

    // Set the theme on mount.
    onMount(() => {
        setTheme(edition.getTheme() ?? BookishTheme);
    });

    // Redirect old hash routes by simply replacing their hash before routing.
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#/'))
        goto(location.hash.replace('#', ''));

    /** Given a theme, sets the appropriate CSS rules in the browser to apply the theme.*/
    function setTheme(theme: Theme | null) {
        // If the theme is being unset, make sure we've removed any overrding style declaration.
        // This let's the default theme kick in.
        let themeTagImports = document.getElementById('bookish-theme-imports');
        let themeTagCSS = document.getElementById('bookish-theme');

        // We only want to set it if it's actually different than what's currently set.
        // Otherwise during editing we get lots of jittery changes on each edit, because the
        // whole edition is rerendering. To check this, we set a data attribute on the style tag containing
        // a stringify of the theme set. We do this separately for the imports, since they can have more
        // major changes than the spacing and color sizes, changing fonts especially.
        const themeTagCSSValue = themeTagCSS?.dataset.css;
        const themeTagImportsValue = themeTagImports?.dataset.imports;
        const newThemeTagCSSValue = JSON.stringify(theme);
        const newThemeTagImportsValue = JSON.stringify(theme?.imports);

        if (theme !== null) {
            // If the imports changed, update theme.
            if (themeTagImportsValue !== newThemeTagImportsValue) {
                // If it's being set, create a new style tag.
                const newThemeImportsTag = document.createElement('style');

                // Give it an ID so we can remove it later.
                newThemeImportsTag.setAttribute('id', 'bookish-theme-imports');
                newThemeImportsTag.dataset.imports = newThemeTagImportsValue;

                // Insert any import statements, then any rules.
                const css = `${(theme.imports ?? [])
                    .map((url) => `@import url(${url});`)
                    .join('\n')}`;
                newThemeImportsTag.appendChild(document.createTextNode(css));
                document.head.appendChild(newThemeImportsTag);

                // Remove the old tag
                themeTagImports?.remove();
            }

            // If the rules changed, update them.
            if (themeTagCSSValue !== newThemeTagCSSValue) {
                // If it's being set, create a new style tag.
                const newThemeCSSTag = document.createElement('style');

                // Give it an ID so we can remove it later.
                newThemeCSSTag.setAttribute('id', 'bookish-theme');
                newThemeCSSTag.dataset.css = newThemeTagCSSValue;

                // Insert any import statements, then any rules.
                const css = `
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
                    }`;
                newThemeCSSTag.appendChild(document.createTextNode(css));
                document.head.appendChild(newThemeCSSTag);

                // Remove the old tag
                themeTagCSS?.remove();
            }
        } else {
            // Remove the old tags, unsetting the theme.
            themeTagImports?.remove();
            themeTagCSS?.remove();
        }
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

<main class="bookish {$darkMode ? ' dark' : ''}">
    <slot />
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
</style>
