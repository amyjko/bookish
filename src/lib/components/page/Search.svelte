<script lang="ts"> 
    import Header from "./Header.svelte";
    import Outline from './Outline.svelte';
    import Page from './Page.svelte';
    import Link from "../Link.svelte";
    import Chapter from '$lib/models/book/Chapter';
    import type { Match } from '$lib/models/book/Chapter';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import { getBase, getEdition } from "./Contexts";
    import TextInput from "../app/TextInput.svelte";
    import ChapterTitle from "./ChapterTitle.svelte";
    import ChapterNumber from "./ChapterNumber.svelte";

    let edition = getEdition();
    let base = getBase();

    let query = "";

    let results: (Chapter | { link: string, left: string, match: string, right: string })[] = [];
    $: {
        // Reset the results
        results = [];

        const lowerQuery = query.toLowerCase();

        query = query.trim();

        // Go through all the chapter indexes and find matches.
        if(query.length > 2)
            for(const chapter of $edition.getChapters()) {
                let index = chapter.getIndex();
                // No index yet? Skip this chapter.
                if(index) {
                    // Build a DOM to render matches.
                    const chapterMatches: Match[] = [];

                    // What are all of the words in the index that match the query?
                    for(const word of Object.keys(index)) {
                        if(query.length > 0 && word.indexOf(lowerQuery) >= 0) {
                            if(index) {
                                let matches = index[word];
                                matches.forEach((match: Match) => {
                                    chapterMatches.push(match);
                                });
                            }
                        }
                    }
                    
                    if(chapterMatches.length > 0) {
                        results.push(chapter);
                        chapterMatches.forEach((match, index) => {
                            // Only highlight the part of the word that matches.
                            const start = match.match.toLowerCase().indexOf(lowerQuery);
                            results.push({ 
                                link: `${base}${chapter.getChapterID()}?word=${match.match.toLowerCase()}&number=${index}`,
                                left: match.left + match.match.substring(0, start),
                                match: match.match.substring(start, start + query.length),
                                right: match.match.substring(start + query.length) + match.right
                            });
                        })
                    }
                }
            }
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

    <p>
        Type a word—just a single word—and we'll show its occurrences in this book:
    </p>

    <p>
        <TextInput 
            type="text" 
            placeholder={"search for a word"} 
            disabled={false}
            bind:text={query}
        />
    </p>

    {#if query.trim() !== "" }
        {#if query.trim().length < 3 }
            <p>Keep typing...</p>
        {:else if results.length === 0 }
            <p>No occurrence of <em>{query}</em>.</p>
        {:else}
            <p>Found {results.filter(result => !(result instanceof Chapter)).length} occurrences of <em>{query}</em>...</p>
            {#each results as result }
                {#if result instanceof Chapter }
                    <h2 id={"header-" + result.getChapterID()}><ChapterNumber>Chapter{#if $edition.getChapterNumber(result.getChapterID()) !== undefined}&nbsp;{$edition.getChapterNumber(result.getChapterID())}{/if}</ChapterNumber> - <ChapterTitle>{result.getTitle()}</ChapterTitle></h2>
                {:else}
                    <p><Link to={result.link}>...{result.left}<span class="bookish-content-highlight">{result.match}</span>{result.right}...</Link></p>
                {/if}
            {/each}
        {/if}
    {/if}
</Page>

<style>
    input[type="text"] {
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
        padding: var(--bookish-inline-padding) calc(2 * var(--bookish-inline-padding));
        width: 100%;
    }
</style>