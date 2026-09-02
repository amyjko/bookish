<script lang="ts">
    import Loading from '$lib/components/page/Loading.svelte';
    import Edition from '$lib/components/page/Edition.svelte';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import {
        getBook,
        getEdition,
        getStatus,
        getUser,
        getChapterText,
    } from '$lib/components/page/Contexts';
    import BookSaveStatus from '$lib/models/book/BookSaveStatus';
    import { get } from 'svelte/store';
    import { onDestroy, untrack } from 'svelte';
    import { page } from '$app/state';
    import type { Unsubscribe } from 'firebase/auth';
    import { listenToChapters, listenToEdition } from '../../models/CRUD';

    interface Props {
        write: boolean;
        children?: import('svelte').Snippet;
    }

    let { write, children }: Props = $props();

    let currentEditionID: string | undefined = $state();

    let auth = getUser();
    let book = getBook();
    let edition = getEdition();
    let status = getStatus();

    /** Whether the edition store has been set by something other than this
     *  loader's own snapshot application (i.e., a local edit) since the last
     *  completed save. While true, incoming snapshots are by definition older
     *  than local state and applying them would lose the newer edits, so they
     *  are skipped; the pending save's own confirmation snapshot arrives
     *  after the save completes and is applied then. (Reader routes never
     *  edit, so this stays false there.) */
    let locallyEdited = false;
    let applyingSnapshot = false;
    const localEditWatch = edition.subscribe(() => {
        if (!applyingSnapshot) locallyEdited = true;
    });
    // When a save completes, local state and server state agree again.
    const statusWatch = status?.subscribe((current) => {
        if (current === BookSaveStatus.Saved) locallyEdited = false;
    });

    function skipStaleSnapshot() {
        const current = status ? get(status) : undefined;
        return (
            locallyEdited &&
            (current === BookSaveStatus.Changed ||
                current === BookSaveStatus.Saving)
        );
    }

    function applySnapshot(apply: () => void) {
        applyingSnapshot = true;
        try {
            apply();
        } finally {
            applyingSnapshot = false;
        }
    }
    /** Mapping from Firestore docuemnt IDs to chapter text */
    let chapterText: Map<string, string> = new Map();

    let editionUnsub: Unsubscribe | undefined = undefined;
    let chaptersUnsub: Unsubscribe | undefined = undefined;

    let error: string | undefined = $state(undefined);

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
            currentEditionID = page.params.editionid;
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
                        if (skipStaleSnapshot()) return;
                        if (ed) {
                            // Before setting the new edition, augmented it with the chapter text.
                            applySnapshot(() =>
                                edition.set(ed.withChapterText(chapterText)),
                            );
                        } else {
                            applySnapshot(() => edition.set(undefined));
                            error = 'Unable to load edition';
                        }
                    },
                );

                chaptersUnsub = listenToChapters(
                    $book.getID(),
                    editionID,
                    (chapters) => {
                        // Cache the text of the chapters we received — except
                        // text we already have while local edits await a save,
                        // which may be a stale echo of what the user since
                        // revised. Text for a chapter not yet cached is load
                        // data, not an echo; it must always be kept, since
                        // nothing will re-deliver it. (The effect below keeps
                        // this cache current with local edits, so applying it
                        // to the edition never loses anything.)
                        const stale = skipStaleSnapshot();
                        for (const [ref, text] of chapters)
                            if (!stale || !chapterText.has(ref.id))
                                chapterText.set(ref.id, text);
                        // Update the chapter text in the current edition.
                        if ($edition) {
                            applySnapshot(() =>
                                edition.set(
                                    $edition.withChapterText(chapterText),
                                ),
                            );
                        }
                    },
                );
            }
        }
    }

    // Remember the chapter text whenever the edition changes, so we don't overwrite stale text.
    // when other things change.
    $effect.pre(() => {
        if ($edition) {
            for (const chapter of $edition.chapters) {
                if (chapter.ref && chapter.text !== null)
                    chapterText.set(chapter.ref.id, chapter.text);
            }
        }
    });

    // Whenever the requested edition or the user changes, change the listener.
    // currentEditionID is read untracked because listen() writes it; tracking
    // it would make this effect invalidate itself.
    $effect(() => {
        const requestedEditionID = page.params.editionid;
        const user = $auth?.user;
        untrack(() => {
            if (
                (currentEditionID === undefined ||
                    requestedEditionID !== currentEditionID) &&
                user !== null &&
                user !== undefined
            )
                listen();
        });
    });

    // When unmounted, unset the stores — no longer viewing a book.
    onDestroy(() => {
        localEditWatch();
        statusWatch?.();
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
        {@render children?.()}
    </Edition>
{/if}
