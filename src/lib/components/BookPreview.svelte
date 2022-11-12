<script lang="ts">
    import type Book from "$lib/models/book/Book"
    import EmbedNode from "$lib/models/chapter/EmbedNode";
    import Parser from "$lib/models/chapter/Parser";
    import ErrorNode from "../models/chapter/ErrorNode";
    import ChapterBody from "./chapter/ChapterBody.svelte";
    import Embed from "./chapter/Embed.svelte";
    import ErrorMessage from "./chapter/ErrorMessage.svelte";
    import Link from "./Link.svelte";

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

<div class="bookish-app-book-preview">
    <div class={`bookish-app-book-preview-cover ${cover === null ? "bookish-app-book-preview-nocover" : ""}`}>
        {#if embed instanceof EmbedNode }
            <Embed node={embed}/>
        {:else if embed instanceof ErrorNode }
            <ErrorMessage node={embed}/>
        {/if}
    </div>
    <div class="bookish-app-book-preview-title">
        {#if subdomain === undefined || write }
            <Link to={refID === undefined ? "" : (write ? "/write/" : "/read/") + refID}>{title}</Link>
        {:else}
            <Link to={`/${subdomain}`}>{title}</Link>
        {/if}
    </div>
    <div class="bookish-app-book-preview-authors">
        {#each authors as author, index}
            <span>{author}{#if index !== authors.length - 1},&nbsp;{/if}</span>
        {:else}
            <em>No authors</em>
        {/each}
    </div>
    <div class="bookish-app-book-preview-description">
        {#if description.length === 0}
            <em>No description</em>
        {:else}
            <ChapterBody node={Parser.parseChapter(undefined, description)}/>
        {/if}
    </div>
</div>

<style>
    .bookish-app-book-preview {
        display: flex;
        width: 100%;
        border: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
        padding: var(--bookish-app-chrome-padding);
        border-radius: var(--bookish-app-chrome-roundedness);
        text-align: left;
    }

    .bookish-app-book-preview-cover {
        width: 5em;
        height: auto;
        margin-right: var(--bookish-app-chrome-padding);
    }

    .bookish-app-book-preview-cover.bookish-app-book-preview-nocover {
        background-color: var(--bookish-app-chrome-muted);
        height: 5em;
    }

    .bookish-app-book-preview-title {
        flex: 1;
        margin-right: var(--bookish-app-chrome-padding);
    }

    .bookish-app-book-preview-authors {
        flex: 1;
        margin-right: var(--bookish-app-chrome-padding);
    }

    .bookish-app-book-preview-description {
        flex: 2;
        overflow: hidden;
        max-height: 10em;
    }

</style>