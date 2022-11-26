<script lang="ts">
    import type Book from "$lib/models/book/Book"
    import EmbedNode from "$lib/models/chapter/EmbedNode";
    import Parser from "$lib/models/chapter/Parser";
    import ErrorNode from "../models/chapter/ErrorNode";
    import ChapterBody from "./chapter/ChapterBody.svelte";
    import Embed from "./chapter/Embed.svelte";
    import ErrorMessage from "./chapter/ErrorMessage.svelte";
    import Link from "$lib/components/app/Link.svelte";

    export let book: Book;
    export let write: boolean;

    $: refID = book.getRefID();
    $: cover = book.getCover();
    $: authors = book.getAuthors();
    $: description = book.getDescription();
    $: subdomain = book.getSubdomain();
    $: title = book.getTitle() === "" ? "Untitled" : book.getTitle();

	$:  embed = cover === null ? null : Parser.parseEmbed(undefined, cover);

</script>

<tr class="book-preview">
    <td class="cover">
        {#if embed instanceof EmbedNode }
            <Embed node={embed}/>
        {:else if embed instanceof ErrorNode }
            <ErrorMessage node={embed}/>
        {/if}
    </td>
    <td class="title">
        {#if subdomain === undefined || write }
            <Link to={refID === undefined ? "" : (write ? "/write/" : "/") + refID}>{title}</Link>
        {:else}
            <Link to={`/${subdomain}`}>{title}</Link>
        {/if}
    </td>
    <td class="authors">
        {#each authors as author, index}
            <span>{author}{#if index !== authors.length - 1},&nbsp;{/if}</span>
        {:else}
            <em>No authors</em>
        {/each}
    </td>
    <td class="description">
        {#if description.length === 0}
            <em>No description</em>
        {:else}
            <ChapterBody node={Parser.parseChapter(undefined, description)}/>
        {/if}
    </td>
</tr>

<style>

    td {
        vertical-align: top;
        padding: var(--bookish-app-chrome-padding);
    }

    .book-preview {
        display: flex;
        width: 100%;
        padding: var(--bookish-app-chrome-padding);
        text-align: left;
    }

    .cover {
        width: 5em;
        height: 5em;
        margin-right: var(--bookish-app-chrome-padding);
    }

    .title {
        flex: 1;
        margin-right: var(--bookish-app-chrome-padding);
    }

    .authors {
        flex: 1;
        margin-right: var(--bookish-app-chrome-padding);
    }

    .description {
        flex: 2;
        overflow: hidden;
        max-height: 10em;
    }

</style>