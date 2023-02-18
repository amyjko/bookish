<script lang="ts">
    import Footer from './Footer.svelte';
    import Header from './Header.svelte';
    import Auth from '$lib/components/Auth.svelte';
    import { writable, type Writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import {
        CARET,
        BOOK,
        EDITION,
        STATUS,
        type EditionStore,
        type StatusStore,
        type ChapterText,
        CHAPTERTEXT,
    } from '$lib/components/page/Contexts';
    import type Book from '$lib/models/book/Book';
    import type Edition from '$lib/models/book/Edition';
    import type CaretState from '$lib/components/editor/CaretState';
    import BookSaveStatus from '$lib/models/book/BookSaveStatus';
    import { updateBook, updateEdition } from '$lib/models/CRUD';
    import { page } from '$app/stores';

    // A global store context for the focused editor, used to display toolbar.
    let caret = writable<CaretState | undefined>(undefined);
    setContext(CARET, caret);

    // A global store for the current book. It's at the root so the header can do breadcrumbs.
    let book = writable<Book | undefined>(undefined);
    setContext<Writable<Book | undefined>>(BOOK, book);

    // A global store for the current edition. It's at the root so the header can do breadcrumbs.
    let edition = writable<Edition>(undefined);
    setContext<EditionStore>(EDITION, edition);

    // A global store for the current chapter text. It's at the root so the header can do breadcrumbs.
    let chapterText = writable<ChapterText | undefined>(undefined);
    setContext<Writable<ChapterText | undefined>>(CHAPTERTEXT, chapterText);

    // A global store for save feedback.
    let status = writable<BookSaveStatus>(BookSaveStatus.Saved);
    setContext<StatusStore>(STATUS, status);

    let bookTimer: NodeJS.Timeout | undefined = undefined;
    let editionTimer: NodeJS.Timeout | undefined = undefined;
    function debounce(timer: NodeJS.Timeout | undefined, fun: Function) {
        clearTimeout(timer);
        return setTimeout(() => {
            fun();
        }, 250);
    }

    /** Save whatever edition is stored. */
    let previousSavedEdition: Edition | undefined = undefined;
    /**
     * Note whether the update was due to us storing the revised edition from the
     * database so that we don't get in an infinite loop of saving.
     */
    let reflection = false;
    async function saveEdition() {
        if (reflection) {
            reflection = false;
            return;
        }

        const previousDocID = previousSavedEdition?.getEditionRef()?.id;
        const newDocID = $edition.getEditionRef()?.id;

        if (
            ($book && $edition && previousDocID === undefined) ||
            (newDocID !== undefined &&
                previousDocID !== undefined &&
                newDocID === previousDocID)
        ) {
            status.set(BookSaveStatus.Saving);
            try {
                // Set the edition after we save it, since things like chapter refs can change for new chapters.
                reflection = true;
                // Get the chapter refs from the updated edition
                const newChapterRefs = await updateEdition(
                    previousSavedEdition,
                    $edition
                );

                // If we succeeded, update all of the chapters with the new chapter references, if there are any.
                let revisedEdition = $edition;
                for (const [id, ref] of newChapterRefs) {
                    const chap = revisedEdition.chapters.find(
                        (chapter) => chapter.id === id
                    );
                    if (chap && chap.ref === undefined) {
                        revisedEdition = revisedEdition.withRevisedChapter(
                            chap,
                            chap.withRef(ref)
                        );
                    }
                }
                // Update the current edition.
                edition.set(revisedEdition);

                status.set(BookSaveStatus.Saved);
            } catch (error) {
                console.error(error);
                status.set(BookSaveStatus.Error);
            } finally {
                previousSavedEdition = $edition;
            }
        }
    }

    async function saveBook() {
        if ($book) {
            status.set(BookSaveStatus.Saving);
            try {
                updateBook($book);
                status.set(BookSaveStatus.Saved);
            } catch (error) {
                console.log(error);
                status.set(BookSaveStatus.Error);
            }
        }
    }

    function scheduleSave() {
        // If this is the latest edition, update the book's metadata to reflect the changes.
        if (
            $book &&
            $edition.isLatestEdition($book) &&
            previousSavedEdition &&
            previousSavedEdition.getEditionRef()?.id ===
                $edition.getEditionRef()?.id &&
            (previousSavedEdition.getTitle() !== $edition.getTitle() ||
                previousSavedEdition.getImage('cover') !==
                    $edition.getImage('cover') ||
                previousSavedEdition.getAuthors().join() !==
                    $edition.getAuthors().join() ||
                previousSavedEdition.getDescription() !==
                    $edition.getDescription())
        ) {
            book.set(
                $book
                    .withTitle($edition.getTitle())
                    .withCover($edition.getImage('cover') ?? null)
                    .withAuthors($edition.getAuthors())
                    .withDescription($edition.getDescription())
            );
        }

        if (!reflection) status.set(BookSaveStatus.Changed);
        editionTimer = debounce(editionTimer, saveEdition);
    }

    // When the edition changes, update the book and debounce a save.
    $: {
        if ($edition) scheduleSave();
    }

    // When the book changes, debounce a save.
    $: {
        if ($book) {
            status.set(BookSaveStatus.Changed);
            bookTimer = debounce(bookTimer, saveBook);
        }
    }
</script>

<div class="bookish-app">
    <Auth>
        {#if $page.route.id !== null && !$page.route.id.startsWith('/[bookid]/[[editionid=edition]]')}
            <Header />
        {/if}
        <slot />
        <Footer />
    </Auth>
</div>

<style>
    /* Custom fonts for app */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap');

    .bookish-app {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-weight: 300;
        color: var(--app-font-color);
        font-family: var(--app-font);
        font-size: 14pt;
        background-color: var(--app-background-color);
    }

    :global(:root) {
        /* Define some UI defaults not used in the Bookish theme. */
        --app-font: 'Outfit', sans-serif;
        --app-line-height: 1.7;
        --app-font-size: 16pt;
        --app-text-spacing: 2rem;

        --app-interactive-color: #1b499c;
        --app-background-color: white;
        --app-font-color: black;
        --app-border-color: #444444;
        --app-font-color-inverted: #ffffff;
        --app-muted-color: #989898;
        --app-error-color: rgb(191, 15, 15);

        --app-chrome-background: rgb(244, 244, 244);
        --app-chrome-font-size: 12pt;
        --app-chrome-padding: 0.5em;
        --app-chrome-border-size: 3px;
        --app-chrome-roundedness: 5px;
    }

    :global(.dark) {
        --app-interactive-color: #5f97ff;
        --app-background-color: #050505;
        --app-font-color: white;
        --app-border-color: #353535;
        --app-font-color-inverted: #000000;
        --app-muted-color: #a9a9a9;
        --app-error-color: rgb(80, 8, 8);
        --app-chrome-background: rgb(46, 46, 46);
    }

    :global(body) {
        background-color: var(--app-background-color) !important;
    }

    :global(.firebase-emulator-warning) {
        opacity: 0.05;
        pointer-events: none;
    }

    @keyframes -global-failure {
        0% {
            transform: translate(-2px, 0px);
        }
        50% {
            transform: translate(0px, 0px);
        }
        100% {
            transform: translate(2px, 0px);
        }
    }
</style>
