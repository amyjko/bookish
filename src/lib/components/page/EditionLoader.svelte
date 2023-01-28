<script lang="ts">
    import Loading from '$lib/components/page/Loading.svelte';
    import Edition from '$lib/components/page/Edition.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import {
        getBook,
        getEdition,
        getAuth,
        CHAPTERTEXT,
        getChapterText,
    } from '$lib/components/page/Contexts';
    import { onDestroy } from 'svelte';
    import { page } from '$app/stores';
    import type { Unsubscribe } from 'firebase/auth';
    import { listenToChapters, listenToEdition } from '../../models/CRUD';

    export let write: boolean;

    let auth = getAuth();
    let book = getBook();
    let edition = getEdition();
    let chapterText = getChapterText();

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
            const editionNumber = $page.params.editionid;
            const latestPublished = !write;

            // Figure out which edition to load.
            let editionID;
            if (editionNumber === undefined) {
                if (latestPublished) {
                    editionID = $book.getLatestPublishedEditionID();
                    if (editionID === undefined)
                        error = 'There is no published edition of this book.';
                } else {
                    editionID = $book.getLatestEditionID();
                }
            } else {
                editionID = $book.getEditionNumberID(parseFloat(editionNumber));
                if (editionID === undefined)
                    error = `There is no ${editionNumber} edition of this book`;
            }

            // Listen to the doc for changes and listen to all of its chapters.
            if (editionID !== undefined) {
                editionUnsub = listenToEdition(
                    $book.ref.id,
                    editionID,
                    (ed) => {
                        if (ed) {
                            // Before setting the new edition, augmented it with the chapter text.
                            edition.set(
                                $chapterText
                                    ? ed.withChapterText($chapterText)
                                    : ed
                            );
                        } else {
                            edition.set(undefined);
                            error = 'Unable to load edition';
                        }
                    }
                );

                chaptersUnsub = listenToChapters(
                    $book.ref.id,
                    editionID,
                    (chapters) => {
                        // Update the chapter text store.
                        chapterText.set(chapters);
                        // Update the chapter text in the current edition.
                        if ($edition)
                            edition.set($edition.withChapterText(chapters));
                    }
                );
            }
        }
    }

    // Whenever the book or page changes, change the listener.
    $: if ($page && $auth && $auth.user !== null) listen();

    // When unmounted, unset the stores — no longer viewing a book.
    onDestroy(() => {
        edition.set(undefined);
        unsub();
    });
</script>

{#if $book === undefined || error}
    <Feedback error>Unable to load edition.</Feedback>
{:else if $edition === undefined}
    <Loading />
{:else}
    <Edition
        edition={$edition}
        base={write
            ? `/write/${$book.getRefID()}/${$edition.getEditionNumber()}/`
            : `/${$book.getSubdomain() ?? $book.getRefID()}/`}
    >
        <slot />
    </Edition>
{/if}