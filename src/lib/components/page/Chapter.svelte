<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import type ChapterModel from '$lib/models/book/Chapter';
    import Header from '$lib/components/page/Header.svelte';
    import Authors from '$lib/components/page/Authors.svelte';
    import Outline from '$lib/components/page/Outline.svelte';
    import Page from '$lib/components/page/Page.svelte';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Toggle from '$lib/components/editor/Toggle.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import PossibleReference from './PossibleReference.svelte';
    import ChapterNumber from './ChapterNumber.svelte';
    import Problem from '../chapter/Problem.svelte';
    import {
        CHAPTER,
        getUser,
        getBook,
        getEdition,
        isBookEditable,
        isChapterEditable,
        isEditionPartiallyEditable,
        getLeasee,
        lease,
        setChapter,
        type ChapterStore,
        isEditionEditable,
    } from './Contexts';
    import { writable } from 'svelte/store';
    import { onMount, setContext } from 'svelte';
    import { hideOutlineIfObscured, layoutMarginals } from './margins';
    import scrollToEyeLevel from '../../util/scrollToEyeLevel';
    import type ChapterContext from '$lib/components/page/ChapterContext';
    import { goto } from '$app/navigation';
    import ChapterNode from '$lib/models/chapter/ChapterNode';
    import Muted from './Muted.svelte';
    import Title from './Title.svelte';
    import PageHeader from './PageHeader.svelte';
    import Permissions from '../editor/Permissions.svelte';

    export let chapter: ChapterModel;
    export let print: boolean = false;

    let book = getBook();
    let edition = getEdition();
    let auth = getUser();

    // Keep track of the scroll position to facilitate reading during reloads.
    function rememberPosition() {
        localStorage.setItem('scrollposition', '' + window.scrollY);
    }

    // The currently selected marginal; we only do one at a time.
    let marginal = writable<string | undefined>(undefined);

    // Keep track of which hash mark is scrolled to
    let highlightedID: string | undefined = undefined;

    // When this component is mounted...
    // 1) Subscribe and unsubscribe to window listeners
    // 2) Do initial layout of marginals
    // 3) Start observing any elements corresponding to the ID in the URL's hash string
    // 4) Clean up our mess after unmounting.
    onMount(() => {
        // On render or when scrolling, see if the URL hash has changed and update state accordingly.
        // We also track whether we've scrolled to it.
        const observeHash = () => {
            // Get the ID without the hash and the corresponding element
            const elementID = window.location.hash.substring(1);
            const element = elementID
                ? document.getElementById(elementID)
                : null;

            // If it's not empty, observe it, and remember what we're observing for highlighting
            if (element) {
                highlightedID = elementID;
                // Start watching this a few seconds after we see it, giving the for in-page scrolling.
                setTimeout(() => observer.observe(element), 2500);
            }
        };

        // Do things to do when scrolling
        const handleScroll = () => {
            // See if the outline is obscured by an image
            hideOutlineIfObscured();

            // See if there are any new hashes to observe. This is because
            // we're using react-router-hash-link, which doesn't trigger hashchange events for some reason.
            observeHash();
        };

        // Lay things out when the window or scroll changes.
        window.addEventListener('scroll', handleScroll);

        // When the chapter view resizes, the responsive layout might cause the marginals to move to the footer.
        // when this happens, we want to immediately remove all of the explicit positioning.
        const resize = new ResizeObserver(() => layoutMarginals());
        resize.observe(document.body);

        // Remember the scroll position before a refresh.
        // We have to do all of these because browser support varies.
        window.addEventListener('beforeunload', rememberPosition);
        window.addEventListener('visibilitychange', rememberPosition);
        window.addEventListener('pagehide', rememberPosition);

        // Start listening for hash changes, since we want to remove them upon scrolling away from them.
        window.addEventListener('pushstate', observeHash);
        window.addEventListener('popstate', observeHash);
        window.addEventListener('hashchange', observeHash);

        // Make an intersection observer to monitor the location of elements selected by the URL hash ID.
        const observer = new IntersectionObserver((entries) => {
            // Go through all of the monitored elements
            entries.forEach((entry) => {
                // If the observed element is out of view and in the hash, remove the hash
                if (
                    entry.intersectionRatio === 0 &&
                    entry.target.id === window.location.hash.substring(1)
                ) {
                    history.pushState(
                        '',
                        document.title,
                        window.location.pathname + window.location.search,
                    );
                    observer.unobserve(entry.target);
                    highlightedID = undefined;
                }
            });
        });

        // Do an initial check the hash to see if there's an ID to scroll to
        observeHash();

        // Position the marginals, since there's new content.
        layoutMarginals();

        // On cleanup, unsubscribe from everything above.
        return () => {
            window.removeEventListener('scroll', handleScroll);
            resize.unobserve(document.body);

            // Stop listening to page visibility changes.
            window.removeEventListener('beforeunload', rememberPosition);
            window.removeEventListener('visibilitychange', rememberPosition);
            window.removeEventListener('pagehide', rememberPosition);

            // Delete the remembered position so that the next page scrolls to top.
            localStorage.removeItem('scrollposition');

            // Stop listening for hash changes
            window.removeEventListener('pushstate', observeHash);
            window.removeEventListener('popstate', observeHash);
            window.removeEventListener('hashchange', observeHash);

            // Stop observing everything on unmount
            observer.disconnect();
        };
    });

    // Position the marginals on mount.
    onMount(() => layoutMarginals());

    // This gets called after the page is done loading. There are various things we scroll to.
    function scrollToLastLocation() {
        // In case loading changed marginal positions
        layoutMarginals();

        // If there's a word we're trying to highlight in the URL path, scroll to the corresponding match.
        if (location.search) {
            const highlights = document.getElementsByClassName(
                'bookish-text bookish-content-highlight',
            );
            const num = getHighlightedNumber();
            if (
                num &&
                highlights.length > 0 &&
                num < highlights.length &&
                num >= 0
            ) {
                scrollToEyeLevel(highlights[num]);
            }
        }
        // Otherwise, if there's an ID in the URL, jump to it.
        else if (highlightedID) {
            const el = document.getElementById(highlightedID as string);
            // If we found the element, remove the hash any time after a few seconds. See handleScroll for the removal logic.
            if (el) {
                scrollToEyeLevel(el);
            }
        } else {
            // If we got to this page through a refresh, scroll to
            const entries = performance.getEntriesByType('navigation');
            const position = localStorage.getItem('scrollposition');
            if (
                position !== null &&
                entries.length > 0 &&
                (entries[entries.length - 1] as PerformanceNavigationTiming)
                    .type === 'reload'
            ) {
                // Scroll to the previous position, if there was one, so that refresh preserves position.
                window.scrollTo(0, parseInt(position));
            }
            // Otherwise, just scroll to the top.
            else {
                window.scrollTo(0, 0);
            }
        }
    }

    /** Account for static builds, where location isn't defined */
    function getLocation() {
        return typeof location === 'undefined' ? undefined : location;
    }

    function getHighlightedWord() {
        return getLocation()?.search.split('&')[0]?.split('=')[1] ?? undefined;
    }
    function getHighlightedNumber() {
        const number = getLocation()?.search.split('&')[1]?.split('=')[1];
        return number === undefined ? undefined : parseInt(number);
    }

    // Prepare to render the chapter by getting some data from the chapter and book.
    $: chapterID = chapter.getID();
    $: chapterNumber = $edition?.getChapterNumber(chapterID);
    $: chapterSection = $edition?.getChapterSection(chapterID);
    $: chapterAST = $edition ? chapter.getAST($edition) : undefined;
    $: citations = chapterAST ? chapterAST.getCitations() : undefined;
    $: editionNumber = $edition ? $edition.getEditionNumber() : undefined;

    let chapterStore = writable<ChapterContext>();
    setContext<ChapterStore>(CHAPTER, chapterStore);
    $: chapterStore.set({
        chapter,
        highlightedWord: getHighlightedWord(),
        highlightedID,
        marginal,
        layoutMarginals,
    });

    let editable =
        isBookEditable() ||
        isEditionEditable() ||
        isChapterEditable() ||
        ($auth !== undefined &&
            $auth.user !== null &&
            chapter.isEditor($auth.user.uid));
</script>

{#if $edition}
    <Page
        afterLoaded={scrollToLastLocation}
        title={`${$edition.getTitle()} - ${chapter.getTitle()}`}
    >
        <Header
            editable={isChapterEditable()}
            id={chapter.id}
            header={chapter.getTitle()}
            label="Chapter title"
            tags={$edition.getTags()}
            save={(text) =>
                setChapter(edition, chapter, chapter.withTitle(text))}
            getImage={() => chapter.getImage()}
            setImage={(embed) =>
                setChapter(edition, chapter, chapter.withImage(embed))}
            {print}
        >
            <!-- Collapse the outline if a marginal is selected. -->
            <Outline
                slot="outline"
                collapse={$marginal !== undefined}
                previous={$edition.getPreviousChapterID(chapterID, editable)}
                next={$edition.getNextChapterID(chapterID, editable)}
                listener={(expanded) => {
                    // If the outline is being expanded, hide the marginal, otherwise leave it alone.
                    if (expanded) marginal.set(undefined);

                    // Check if we need to hide the outline after positioning.
                    hideOutlineIfObscured();
                }}
            />
            <!-- Add an editable chapter ID if in editor mode -->
            <svelte:fragment slot="before">
                {#if editable && $book}
                    <Muted>
                        <em>bookish.press/book/</em><TextEditor
                            text={chapter.getID()}
                            label="Chapter URL ID editor"
                            save={// After the ID is edited, reload the page with the new URL.
                            async (newChapterID) => {
                                if ($book) {
                                    setChapter(
                                        edition,
                                        chapter,
                                        chapter.withChapterID(newChapterID),
                                    );
                                    // Navigate to the new ID
                                    goto(
                                        `/write/${$book.getID()}/${editionNumber}/${newChapterID}`,
                                        {
                                            keepFocus: true,
                                        },
                                    );
                                }
                            }}
                            placeholder="chapter name"
                            valid={(newChapterID) =>
                                !/^[a-zA-Z0-9]+$/.test(newChapterID)
                                    ? 'Chapter IDs must be one or more letters or numbers'
                                    : chapter.getID() !== newChapterID &&
                                        $edition?.hasChapter(newChapterID)
                                      ? "There's already a chapter that has this ID."
                                      : undefined}
                            saveOnExit={true}
                        />
                    </Muted>
                {/if}
                {#if editable}
                    <Toggle
                        on={chapter.isNumbered()}
                        save={(on) =>
                            setChapter(
                                edition,
                                chapter,
                                chapter.asNumbered(on),
                            )}
                    >
                        <ChapterNumber
                            >{#if chapterNumber !== undefined}Chapter {chapterNumber}{:else}<Muted
                                    >Unnumbered</Muted
                                >{/if}</ChapterNumber
                        >
                    </Toggle>
                {:else if chapterNumber !== undefined}
                    <ChapterNumber>Chapter {chapterNumber}</ChapterNumber>
                {/if}
                {#if chapterSection !== undefined && chapterSection.length > 0}
                    <span class="section-name">{chapterSection}</span>
                {/if}
            </svelte:fragment>
            <!-- If there are chapter authors, render those, otherwise use the book authors -->
            <Authors
                editable={isChapterEditable()}
                slot="after"
                authors={chapter.getAuthors()}
                inheritedAuthors={$edition.getAuthors()}
                add={() => setChapter(edition, chapter, chapter.withAuthor(''))}
                edit={(index, text) =>
                    setChapter(
                        edition,
                        chapter,
                        chapter.withRenamedAuthor(index, text),
                    )}
                remove={(index) =>
                    setChapter(edition, chapter, chapter.withoutAuthor(index))}
            />
        </Header>

        <Instructions {editable}>
            Edit your chapter's title, authors, and cover image above. You can
            also change the ID of the chapter, which is the text that appears in
            the chapter URL. Write your chapter text below, formatting options
            in the toolbar above to add headers, lists, tables, comments,
            citations, footnotes, and more. It's okay to try things, you can
            always undo. Saves are automatic.
        </Instructions>

        <!-- Render the chapter body, passing some context -->
        <section class="chapter-content">
            {#if chapterAST}
                {#if editable}
                    <BookishEditor
                        text={chapterAST.toBookdown()}
                        parser={(text) => Parser.parseChapter($edition, text)}
                        save={(ast) =>
                            ast instanceof ChapterNode
                                ? setChapter(
                                      edition,
                                      chapter,
                                      chapter.withAST(ast),
                                  )
                                : undefined}
                        chapter={true}
                        autofocus
                        component={ChapterBody}
                        placeholder="write here"
                        leasee={getLeasee(auth, edition, chapter.id)}
                        lease={(lock) => lease(auth, edition, chapter.id, lock)}
                    />
                {:else}
                    <ChapterBody node={chapterAST} />
                {/if}
            {:else if $edition === undefined}Loading...{:else}Unable to load
                chapter text{/if}
        </section>

        {#if citations && citations.size > 0}
            {@const refs = $edition.getReferences()}
            <Title>References</Title>
            <ol>
                {#each [...citations].sort() as citationID}
                    {#if citationID in refs}
                        <li
                            class={'bookish-reference'}
                            id={'ref-' + citationID}
                        >
                            <PossibleReference node={refs[citationID]} edit />
                        </li>
                    {:else}
                        <li
                            ><Problem
                                >Unknown reference: <code>{citationID}</code
                                ></Problem
                            ></li
                        >
                    {/if}
                {/each}
            </ol>
        {/if}

        {#if editable || isEditionPartiallyEditable()}
            <PageHeader id="editors">Editors</PageHeader>
            <Instructions {editable}
                >These authors can edit this chapter. Add an email here to
                provide chapter-level edit permissions.</Instructions
            >

            <Permissions
                uids={chapter.uids}
                inheriteduids={Array.from(
                    new Set([...$edition.uids, ...($book ? $book.uids : [])]),
                )}
                atleastone={false}
                writable={isChapterEditable()}
                change={(uids) =>
                    setChapter(edition, chapter, chapter.withEditors(uids))}
            />
        {/if}
    </Page>
{/if}

<style>
    .section-name {
        display: inline-block;
        margin-left: 0.5em;
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
        font-weight: normal;
        font-style: normal;
        color: var(--bookish-muted-color);
        line-height: 1em;
    }
</style>
