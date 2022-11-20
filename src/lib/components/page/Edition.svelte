<script lang="ts">
    import type Theme from "$lib/models/book/Theme";
    import type EditionModel from "$lib/models/book/Edition";
    import smoothscroll from 'smoothscroll-polyfill';
    import { goto } from '$app/navigation';
    import Status from "./Status.svelte";
    import { onMount, setContext } from 'svelte';
    import { writable } from "svelte/store";
    import { BASE, BOOK, DARK_MODE, EDITABLE, EDITION, type DarkModeStore, type EditionStore } from "./Contexts";
    import type Book from "$lib/models/book/Book";

    // Poly fill smooth scrolling for Safari.
    smoothscroll.polyfill();

    // True if the edition should be editable. Distributed as context.
    export let editable: boolean = false;

    // When editable changes, update the context.
    $: setContext<boolean>(EDITABLE, editable);

    // The base path allows links to adjust to different routing contexts in which a book is placed.
    // For example, when the book is hosted alone, all routes might start with the bare root "/", 
    // but when the book is being viewed or edited in the Bookish app, it needs a prefix for the
    // route in the app.
    export let base: string = "";

    // When the base changes, update the context.
    $: setContext<string>(BASE, base);

    // The book edition to render.
    export let edition: EditionModel;

    // Expose the edition to descendents in a store and update the context when the edition changes.
    let currentEdition = writable<EditionModel>(edition);
    setContext<EditionStore>(EDITION, currentEdition);

    // Expose the book to descendents in a store and update the context when the edition changes.
    $: setContext<Book|undefined>(BOOK, edition.getBook());

    // When edition changes, unsubscribe to the previous edition and subscribe to the new one.
    // We use a simple assignment to tell Svelte about the change.
    let editionChanged = () => currentEdition.set(edition);
    $: {
        // Remove the listeners from the old edition
        $currentEdition.removeListener(editionChanged);
        $currentEdition.getBook()?.removeListener(editionChanged);

        // Update the current edition.
        currentEdition.set(edition);

        // Listen to the new edition
        $currentEdition.getBook()?.addListener(editionChanged);
        $currentEdition.addListener(editionChanged)
    }

    // Create a timer that saves the current edition periodically and stops when unmounted.
    onMount(() => {
        const saveListener = setInterval(() => {
            $currentEdition.saveEdits();
            $currentEdition.getBook()?.saveEdits();
        }, 500);
        // On unmount, stop listening.
        return () => clearInterval(saveListener);
    });

    // Default dark mode to whatever's stored in local storage, if anything.
    // respect user choice on the website despite the system theme
    let darkMode = writable<boolean>(
        typeof localStorage !== "undefined" &&
        localStorage.getItem("bookish-dark") !== "false" && (
            localStorage.getItem("bookish-dark") === "true" || // A previous setting
            window.matchMedia("(prefers-color-scheme: dark)").matches // Operating system is set to dark
        )
    );

    // Expose dark mode to descendants
    setContext<DarkModeStore>(DARK_MODE, darkMode);

    // When dark mode changes, update the body's class list.
    $: {
        if($darkMode) {
            document.body.classList.add("bookish-dark")
        }
        else {
            document.body.classList.remove("bookish-dark")
            if(typeof localStorage !== "undefined")
                localStorage.setItem("bookish-dark", $darkMode ? "true" : "false")
        }
    }

    // Redirect old hash routes by simply replacing their hash before routing.
    if(typeof window !== "undefined" && window.location.hash.startsWith('#/'))
        goto(location.hash.replace('#', ''))    

    // Set the theme, whatever it is, and change it when the edition changes.
    $: setTheme(edition.getTheme());
    
    function setTheme(theme: Theme | null) {

        // Remove any existing theme.
        document.getElementById("bookish-theme")?.remove();

        // If the theme is being unset, make sure we've removed any overrding style declaration.
        // This let's the default theme kick in.
        if(theme === null)
            return;

        // If it's being set, create a new style tag.
        const themeTag = document.createElement("style");
        themeTag.setAttribute("id", "bookish-theme");

        const css = `:root {
                ${toRules(theme.light)}
                ${toRules(theme.fonts)}
                ${toRules(theme.sizes)}
                ${toRules(theme.weights)}
                ${toRules(theme.spacing)}
            }
            .bookish-dark {
                ${toRules(theme.dark)}
            }`;
        themeTag.appendChild(document.createTextNode(css));
        document.head.appendChild(themeTag);

    }

    function toRules(set: Record<string, string>) {
        return Object.keys(set).map(name => {
            const cssVariable = "--bookish-" + name.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ").map(s => s.toLowerCase()).join("-");
            return `${cssVariable}: ${set[name]};`
        }).join("\n\t\t");
    }

</script>

<div class="bookish {$darkMode ? " bookish-dark" : ""}">
    <slot></slot>
    <Status book={edition.getBook()} edition={edition}/>
</div>

<style global>

    :root {
        /* Background colors */
        --bookish-background-color: #FFFFFF;
        --bookish-block-background-color: #FCFAFA;
        --bookish-error-background-color: #F8D7DA;

        /* Border colors */
        --bookish-border-color-light: #E0E0E0;
        --bookish-border-color-bold: #000000;

        /* Foreground colors */
        --bookish-paragraph-color: #000000;
        --bookish-muted-color: #9AA1A7;
        --bookish-highlight-color: #E8AF22;
        --bookish-comment-color: #257F31;
        --bookish-error-color: #721C24;
        --bookish-link-color: #1B499C;
        --bookish-bullet-color: #EB2C27;

        /* Fonts */
        --bookish-paragraph-font-family: "Georgia", serif;
        --bookish-header-font-family: "Verdana", serif;
        --bookish-code-font-family: "Courier New", monospace;
        --bookish-bullet-font-family: "Verdana";

        /* Font sizes */
        --bookish-paragraph-font-size: 14pt;
        --bookish-block-font-size: 11pt;
        --bookish-small-font-size: 9pt;
        --bookish-title-font-size: 2.4rem;
        --bookish-header-1-font-size: 2rem;
        --bookish-header-2-font-size: 1.5rem;
        --bookish-header-3-font-size: 1rem;
        --bookish-code-font-size: 11pt;

        /* Font weights */
        --bookish-paragraph-font-weight: 400;
        --bookish-bold-font-weight: 700;
        --bookish-link-font-weight: 400;
        --bookish-header-font-weight: 700;
        --bookish-code-font-weight: 400;
        --bookish-bullet-font-weight: 500;

        /* Line heights */
        --bookish-paragraph-line-height: 1.8em;
        --bookish-paragraph-line-height-tight: 1.4em;
        --bookish-header-line-height: 1.4em;

        /* Spacing */
        --bookish-paragraph-spacing: 1.8rem;
        --bookish-header-spacing: 2rem;
        --bookish-roundedness: 5px;
        --bookish-indent: 10%;
        --bookish-inline-padding: 0.25rem;
        --bookish-block-padding: 1rem;
        --bookish-outline-width: 12em;
        --bookish-outline-padding: 1em;
        --bookish-outline-offset: calc(-1 * (var(--bookish-outline-width) + 2 * var(--bookish-outline-padding)));
    }

    .bookish-dark {
        --bookish-background-color: #1C1C1C;
        --bookish-block-background-color: #333333;
        --bookish-error-background-color: #721C24;
        --bookish-border-color-light: #444444;
        --bookish-border-color-bold: #DADADA;
        --bookish-paragraph-color: #DADADA;
        --bookish-muted-color: #666666;
        --bookish-highlight-color: #c5a248;
        --bookish-comment-color: #1c4722;
        --bookish-error-color: #F8D7DA;
        --bookish-link-color: #73a3fa;
        --bookish-bullet-color: #721C24;
    }

    * {
        box-sizing: border-box;
    }

    /* WINDOW AND PAGES */
    body {
        margin: 0;
        padding: 0;

        background-color: var(--bookish-background-color);
    }

    /* The root container for a book */
    .bookish {
        font-weight: var(--bookish-paragraph-font-weight);
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
        line-height: var(--bookish-paragraph-line-height);
        background-color: var(--bookish-background-color);
        color: var(--bookish-paragraph-color);
        width: 100%;
        z-index: 0;
        text-align: left;
    }

    a {
        color: var(--bookish-link-color);
        font-weight: var(--bookish-link-font-weight);
        text-decoration: none;
    }

    a:hover {
        text-decoration: underline;
    }

    table {
        width: 100%;
        line-height: var(--bookish-paragraph-line-height-tight);
        margin-bottom: var(--bookish-paragraph-spacing);
        border-collapse: collapse;
        clear: both;
        border-collapse: separate;
        border-radius: var(--bookish-roundedness);
        border-spacing: 0;
    }

    .bookish-table {
        display: block;
        width: 100%;
        overflow-x: auto;
    }

    .bookish-table td {
        padding: var(--bookish-block-padding);
        vertical-align: top;
        border-top: 1px solid var(--bookish-border-color-light);
    }

    p {
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
        color: var(--bookish-paragraph-color);

        margin-top: var(--bookish-paragraph-spacing);
        margin-bottom: var(--bookish-paragraph-spacing);

        /* Allow paragraphs to break on words to support small screens. */
        word-break: break-word;

        /* Empty paragraphs should have at least some height. */
        min-height: var(--bookish-paragraph-line-height);

    }

    h2, h3, h4, h5, h6 {
        font-family: var(--bookish-header-font-family);
        font-weight: var(--bookish-header-font-weight);
        margin-top: var(--bookish-header-spacing);
        margin-bottom: var(--bookish-header-spacing);
        line-height: var(--bookish-header-line-height);
    }

    h2 {
        font-size: var(--bookish-header-1-font-size);
    }

    h3 {
        font-size: var(--bookish-header-2-font-size);
    }

    h4 {
        font-size: var(--bookish-header-3-font-size);
        font-style: italic;
    }
    
</style>