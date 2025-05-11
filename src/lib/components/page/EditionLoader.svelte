<script lang="ts">
    import Loading from '$lib/components/page/Loading.svelte';
    import Edition from '$lib/components/page/Edition.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import {
        getBook,
        getEdition,
        getUser,
        getChapterText,
    } from '$lib/components/page/Contexts';
    import { onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import type { Unsubscribe } from 'firebase/auth';
    import { listenToChapters, listenToEdition } from '../../models/CRUD';

    export let write: boolean;

    let currentEditionID: string | undefined;

    let auth = getUser();
    let book = getBook();
    let edition = getEdition();
    /** Mapping from Firestore docuemnt IDs to chapter text */
    let chapterText: Map<string, string> = new Map();

    let editionUnsub: Unsubscribe | undefined = undefined;
    let chaptersUnsub: Unsubscribe | undefined = undefined;

    let error: string | undefined = undefined;

    function unsub() {
        // Unsubscribe to the old edition document if we were listening to one.
        if (editionUnsub) editionUnsub();
        if (chaptersUnsub) chaptersUnsub();
    }

    function listen() {
        unsub();

        error = undefined;

        // If we no longer have a book, we can't get an edition.
        if ($book === undefined) {
            edition.set(undefined);
            error = 'Unknown book.';
            return;
        } else {
            currentEditionID = $page.params.editionid;
            const latestPublished = !write;

            // Figure out which edition to load.
            let editionID;
            if (currentEditionID === undefined) {
                if (latestPublished) {
                    editionID = $book.getLatestPublishedEditionID();
                    if (editionID === undefined)
                        error = 'There is no published edition of this book.';
                } else {
                    editionID = $book.getLatestEditionID();
                }
            } else {
                editionID = $book.getEditionNumberID(
                    parseFloat(currentEditionID),
                );
                if (editionID === undefined)
                    error = `There is no ${currentEditionID} edition of this book`;
            }

            // Listen to the doc for changes and listen to all of its chapters.
            if (editionID !== undefined) {
                editionUnsub = listenToEdition(
                    $book.getID(),
                    editionID,
                    (ed) => {
                        if (ed) {
                            // Before setting the new edition, augmented it with the chapter text.
                            edition.set(ed.withChapterText(chapterText));
                        } else {
                            edition.set(undefined);
                            error = 'Unable to load edition';
                        }
                    },
                );

                chaptersUnsub = listenToChapters(
                    $book.getID(),
                    editionID,
                    (chapters) => {
                        // Update the text of the chapters we received.
                        for (const [ref, text] of chapters)
                            chapterText.set(ref.id, text);
                        // Update the chapter text in the current edition.
                        if ($edition) {
                            edition.set($edition.withChapterText(chapterText));
                        }
                    },
                );
            }
        }
    }

    // Remember the chapter text whenever the edition changes, so we don't overwrite stale text.
    // when other things change.
    $: if ($edition) {
        for (const chapter of $edition.chapters) {
            if (chapter.ref && chapter.text !== null)
                chapterText.set(chapter.ref.id, chapter.text);
        }
    }

    // Whenever the book changes, change the listener.
    $: if (
        (currentEditionID === undefined ||
            $page.params.editionid !== currentEditionID) &&
        $auth &&
        $auth.user !== null
    )
        listen();

    // When unmounted, unset the stores — no longer viewing a book.
    onDestroy(() => {
        edition.set(undefined);
        unsub();
    });
</script>

{#if $book === undefined || error}
    <Feedback error>Unable to load edition: {error}</Feedback>
{:else if $edition === undefined}
    <Loading />
{:else}
    <Edition
        edition={$edition}
        base={write
            ? `/write/${$book.getID()}/${$edition.getEditionNumber()}`
            : `/${$book.getSubdomain() ?? $book.getID()}`}
    >
        <slot />
    </Edition>
{/if}
