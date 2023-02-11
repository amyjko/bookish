<script lang="ts">
    import Header from './Header.svelte';
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import Link from '../Link.svelte';
    import Chapter from '$lib/models/book/Chapter';
    import type { Match } from '$lib/models/book/Chapter';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import { getBase, getEdition, isEditionEditable } from './Contexts';
    import TextInput from '../app/TextInput.svelte';
    import ChapterTitle from './ChapterTitle.svelte';
    import ChapterNumber from './ChapterNumber.svelte';
    import PageHeader from './PageHeader.svelte';

    let edition = getEdition();
    let base = getBase();

    let query = '';

    let results: (
        | Chapter
        | { link: string; left: string; match: string; right: string }
    )[] = [];
    $: {
        // Reset the results
        results = [];

        const lowerQuery = query.toLowerCase();

        query = query.trim();

        // Go through all the chapter indexes and find matches.
        if ($edition && query.length > 2)
            for (const chapter of $edition?.getChapters() ?? []) {
                let index = chapter.getIndex($edition);
                // No index yet? Skip this chapter.
                if (index) {
                    // Build a DOM to render matches.
                    const chapterMatches: Match[] = [];

                    // What are all of the words in the index that match the query?
                    for (const word of Object.keys(index)) {
                        if (query.length > 0 && word.indexOf(lowerQuery) >= 0) {
                            if (index) {
                                let matches = index[word];
                                matches.forEach((match: Match) => {
                                    chapterMatches.push(match);
                                });
                            }
                        }
                    }

                    if (chapterMatches.length > 0) {
                        results.push(chapter);
                        chapterMatches.forEach((match, index) => {
                            // Only highlight the part of the word that matches.
                            const start = match.match
                                .toLowerCase()
                                .indexOf(lowerQuery);
                            results.push({
                                link: `${$base}/${chapter.getID()}?word=${match.match.toLowerCase()}&number=${index}`,
                                left:
                                    match.left +
                                    match.match.substring(0, start),
                                match: match.match.substring(
                                    start,
                                    start + query.length
                                ),
                                right:
                                    match.match.substring(
                                        start + query.length
                                    ) + match.right,
                            });
                        });
                    }
                }
            }
    }
</script>

{#if $edition}
    <Page title={`${$edition.getTitle()} - Search`}>
        <Header
            editable={isEditionEditable()}
            label="Search title"
            getImage={() => $edition?.getImage(ChapterIDs.SearchID) ?? null}
            setImage={(embed) =>
                $edition
                    ? edition.set(
                          $edition.withImage(ChapterIDs.SearchID, embed)
                      )
                    : undefined}
            header="Search"
            id="search"
            tags={$edition.getTags()}
        >
            <Outline
                slot="outline"
                previous={$edition.getPreviousChapterID(ChapterIDs.SearchID)}
                next={$edition.getNextChapterID(ChapterIDs.SearchID)}
            />
        </Header>

        <p>
            Type a word—just a single word—and we'll show its occurrences in
            this book:
        </p>

        <input
            class="query"
            type="text"
            placeholder="search for a word"
            bind:value={query}
        />

        {#if query.trim() !== ''}
            {#if query.trim().length < 3}
                <p>Keep typing...</p>
            {:else if results.length === 0}
                <p>No occurrence of <em>{query}</em>.</p>
            {:else}
                <p
                    >Found {results.filter(
                        (result) => !(result instanceof Chapter)
                    ).length} occurrences of <em>{query}</em>...</p
                >
                {#each results as result}
                    {#if result instanceof Chapter}
                        <PageHeader id={'header-' + result.getID()}
                            ><ChapterNumber
                                >Chapter{#if $edition.getChapterNumber(result.getID()) !== undefined}&nbsp;{$edition.getChapterNumber(
                                        result.getID()
                                    )}{/if}</ChapterNumber
                            > - <ChapterTitle>{result.getTitle()}</ChapterTitle
                            ></PageHeader
                        >
                    {:else}
                        <p
                            ><Link to={result.link}
                                >...{result.left}<span
                                    class="bookish-content-highlight"
                                    >{result.match}</span
                                >{result.right}...</Link
                            ></p
                        >
                    {/if}
                {/each}
            {/if}
        {/if}
    </Page>
{/if}

<style>
    .query {
        font-family: var(--bookish-header-font-family);
        font-size: var(--bookish-header-font-size);
        border: none;
        border-bottom: 3px solid var(--bookish-border-color-light);
        padding: var(--bookish-inline-padding);
        display: inline-block;
        margin-top: 2em;
    }

    .query:focus {
        outline: none;
        border-color: var(--bookish-highlight-color);
    }
</style>
