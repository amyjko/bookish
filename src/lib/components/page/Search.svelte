<script lang="ts"> 
    import Header from "./Header.svelte";
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import Link from "../Link.svelte";
    import type Edition from '$lib/models/book/Edition';
    import Chapter from '$lib/models/book/Chapter';
    import type { Match } from '$lib/models/book/Chapter';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import { getContext, onMount } from "svelte";
    import { BASE, EDITION } from "./Symbols";
    import type { Writable } from "svelte/store";

    $: edition = getContext<Writable<Edition>>(EDITION);
    let base = getContext<string>(BASE);

    let query = "";
    let input: HTMLInputElement | null = null;

    // Focus the query box when loaded
    onMount(() => { if(input) input.focus(); });

    // Don't allow spaces
    function handleKeyDown(event: KeyboardEvent) {
        if(event.key === " ") {
            event.preventDefault();
        }
    }

    let results: (Chapter | { link: string, left: string, match: string, right: string })[] = [];
    $: {
        // Reset the results
        results = [];

        const lowerQuery = query.toLowerCase();
        let matchCount = 0;

        // Go through all the chapter indexes and find matches.
        if(query.length > 2)
            $edition.getChapters().forEach((chapter: Chapter) => {
                let index = chapter.getIndex();
                // No index yet? Skip this chapter.
                if(index) {
                    // Build a DOM to render matches.
                    const chapterMatches: Match[] = [];

                    // What are all of the words in the index that match the query?
                    Object.keys(index).forEach(word => {
                        if(query.length > 0 && word.indexOf(lowerQuery) >= 0) {
                            if(index) {
                                let matches = index[word];
                                matches.forEach((match: Match) => {
                                    chapterMatches.push(match);
                                });
                            }
                        }
                    });

                    matchCount += chapterMatches.length;
                    
                    if(chapterMatches.length > 0) {
                        results.push(chapter);
                        chapterMatches.forEach((match, index) => {
                            // Only highlight the part of the word that matches.
                            const start = match.match.toLowerCase().indexOf(lowerQuery);
                            results.push({ 
                                link: base + "/" + chapter.getChapterID() + "/" + match.match.toLowerCase() + "/" + index,
                                left: match.left + match.match.substring(0, start),
                                match: match.match.substring(start, start + query.length),
                                right: match.match.substring(start + query.length) + match.right
                            });
                        })
                    }
                }
            });
    }

</script>

<Page title={`${$edition.getTitle()} - Search`}>
    <Header 
        label="Search title"
        getImage={() => $edition.getImage(ChapterIDs.SearchID)}
        setImage={(embed) => $edition.setImage(ChapterIDs.SearchID, embed)}
        header="Search"
        tags={$edition.getTags()}
    >
        <Outline
            slot="outline"
            previous={$edition.getPreviousChapterID(ChapterIDs.SearchID)}
            next={$edition.getNextChapterID(ChapterIDs.SearchID)}
        />    
    </Header>

    <p>Type a word—just a single word—and we'll show its occurrences in this book:</p>

    <p>
        <input 
            type="text" 
            name="query" 
            placeholder={"search for a word"} 
            on:keydown={handleKeyDown}
            bind:this={input} 
            bind:value={query}
        />
    </p>

    {#if query !== "" }
        {#if query.length < 3 }
            <p>Keep typing...</p>
        {:else if results.length === 0 }
            <p>No occurrence of <em>{query}</em>.</p>
        {:else}
            <p>Found {results.filter(result => !(result instanceof Chapter)).length} occurrences of <em>{query}</em>...</p>
            {#each results as result }
                {#if result instanceof Chapter }
                    <h2 class="bookish-header" id={"header-" + result.getChapterID()}>Chapter{#if $edition.getChapterNumber(result.getChapterID()) !== undefined}&nbsp;{$edition.getChapterNumber(result.getChapterID())}{/if} - {result.getTitle()}</h2>
                {:else}
                    <p><Link to={result.link}>...{result.left}<span class="bookish-content-highlight">{result.match}</span>{result.right}...</Link></p>
                {/if}
            {/each}
        {/if}
    {/if}
</Page>