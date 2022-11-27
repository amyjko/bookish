<script lang="ts">
    import Header from "$lib/components/page/Header.svelte";
    import Outline from '$lib/components/page/Outline.svelte';
    import Page from '$lib/components/page/Page.svelte';
    import Instructions from '$lib/components/page/Instructions.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import Link from "$lib/components/Link.svelte";
    import { getBase, getEdition } from "./Contexts";
    import { page } from "$app/stores";
    import Muted from "./Muted.svelte";
    import ChapterTitle from "./ChapterTitle.svelte";
    import ChapterNumber from "./ChapterNumber.svelte";
    import PageHeader from "./PageHeader.svelte";

    let edition = getEdition();
    let base = getBase();

    // What letter are we matching?
    $: letter = $page.params.letter;

    $: bookIndex = $edition.getBookIndex();

    let letters: Record<string, boolean> = {};
    // Figure out what letters have words
    $: {
        for(const word of Object.keys(bookIndex).sort((a, b) => a.localeCompare(b)))
            letters[word.charAt(0).toLocaleLowerCase()] = true;
    }

    let words: (string | true)[] = [];
    $: {
        words = [];
        let count = 0;
        Object.keys(bookIndex).sort((a, b) => a.localeCompare(b)).forEach(word => {
            const firstLetter = word.charAt(0).toLowerCase()
            if(letter === firstLetter) {
                count++;
                if(count % 20 === 0) words.push(true);
                words.push(word);
            }
        });
    } 

</script>

<Page title={`${$edition.getTitle()} - Index`}>
    <Header 
        label="Index title"
        getImage={() => $edition.getImage(ChapterIDs.IndexID)}
        setImage={(embed) => $edition.setImage(ChapterIDs.IndexID, embed)}
        header="Index"
        tags={$edition.getTags()}
    >
        <Outline
            slot="outline"
            previous={$edition.getPreviousChapterID(ChapterIDs.IndexID)}
            next={$edition.getNextChapterID(ChapterIDs.IndexID)}
        />
    </Header>

    <Instructions>
        This index is created automatically.
        It's not perfect; we may add more control over it in the future.
    </Instructions>

    <p><em>This index includes all words, excluding common English words, words with apostrophes, and words ending in -ly.</em></p>

    {#if Object.keys(letters).length === 0 }
        <p>There are no words in this book, so there's no index.</p>
    {:else}
        <p>Pick a letter to browse:</p>

        <p>
            {#each "abcdefghijklmnopqrstuvwxyz".split("") as symbol, index}
                <span style="display: inline-block">
                    {#if symbol in letters && letter !== symbol }
                        <Link to={base + "index/" + symbol}>{symbol}</Link>
                    {:else}
                        <span>
                            {#if letter === symbol } 
                                <strong><span style="font-size: 200%">{symbol}</span></strong>
                            {:else}
                                <Muted>{symbol}</Muted>
                            {/if}
                        </span>
                    {/if}
                    {#if index < 26 - 1 } 
                        <span>&sdot;</span>
                    {/if}
                </span>
            {/each}
        </p>

        <div class="bookish-table">
            <table>
                <tbody>
                    {#each words as word, index }
                        {#if word === true}
                            <tr><td colspan={2}><PageHeader>{words[index + 1]}</PageHeader></td></tr>
                        {:else}
                            <tr>
                                <td>{word}</td>
                                <td>
                                    <!-- Sort the chapters by chapter number -->
                                    {#each Array.from(bookIndex[word])
                                        .sort((a, b) => {
                                            let numberA = $edition.getChapterNumber(a);
                                            let numberB = $edition.getChapterNumber(b);
                                            if(numberA === undefined) return -1;
                                            if(numberB === undefined) return 1;
                                            return numberA - numberB;
                                        }) as chapterID, index }
                                        <!-- Map them to links to the first occurrence in the chapter. -->
                                        <span>
                                            <ChapterNumber>Chapter {#if $edition.getChapterNumber(chapterID) !== undefined}{$edition.getChapterNumber(chapterID)}. {/if}</ChapterNumber> <ChapterTitle link={`${base}${chapterID}?word=${word}`}>{$edition.getChapterName(chapterID)}</ChapterTitle>
                                            {#if index < bookIndex[word].size - 1 }<br/>{/if}
                                        </span>
                                    {/each}
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</Page>