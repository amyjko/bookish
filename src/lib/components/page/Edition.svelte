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
            localStorage.setItem("bookish-dark", "true")
        }
        else {
            document.body.classList.remove("bookish-dark")
            localStorage.setItem("bookish-dark", "false")
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

<div class={"bookish" + ($darkMode ? " bookish-dark" : "")}>
    <slot></slot>
    <Status book={edition.getBook()} edition={edition}/>
</div>