<script lang="ts">
    import type Book from '$lib/models/book/Book';
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import Parser from '$lib/models/chapter/Parser';
    import ChapterBody from './chapter/ChapterBody.svelte';
    import Embed from './chapter/Embed.svelte';
    import Link from '$lib/components/app/Link.svelte';

    export let book: Book;
    export let write: boolean = false;

    $: refID = book.getID();
    $: cover = book.getCover();
    $: authors = book.getAuthors();
    $: description = book.getDescription();
    $: subdomain = book.getSubdomain();
    $: title = book.getTitle();
    $: embed = cover === null ? null : Parser.parseEmbed(undefined, cover);

    $: url =
        subdomain === null || write
            ? refID === undefined
                ? ''
                : (write ? '/write/' : '/') + refID
            : `/${subdomain}`;
</script>

<article class="book-preview">
    <div class="cover" class:empty={embed === null}>
        {#if embed instanceof EmbedNode}
            <Embed node={embed} imageOnly editable={false} />
        {/if}
    </div>
    <div class="content">
        <Link to={url}><h2 class="title">{title}</h2></Link>
        <p class="authors">
            {#each authors as author, index}
                <span
                    >{author}{#if index !== authors.length - 1},&nbsp;{/if}</span
                >
            {:else}
                <em>No authors</em>
            {/each}
        </p>
        <div class="description">
            {#if description.length === 0}
                <em>No description</em>
            {:else}
                <ChapterBody
                    node={Parser.parseChapter(undefined, description)}
                />
            {/if}
        </div>
        <Link to={`${url}/editions`}>Editions</Link>
    </div>
</article>

<style>
    .book-preview {
        display: flex;
        flex-direction: row;
        align-content: start;
        margin: var(--app-chrome-padding);
        padding: var(--app-chrome-padding);
        text-align: left;
        flex-wrap: wrap;
        height: 12em;
    }

    .cover {
        flex: 1;
        width: 10em;
        height: 100%;
        margin-right: var(--app-chrome-padding);
        padding: var(--app-chrome-padding);
    }

    .cover.empty {
        background-color: var(--app-chrome-background);
    }

    .content {
        flex: 4;
        display: flex;
        flex-direction: column;
        gap: var(--app-chrome-padding);
    }

    .title {
        font-size: 20pt;
        margin-top: 0;
        margin-bottom: var(--app-chrome-padding);
    }

    .authors {
        margin-top: 0;
        margin-bottom: var(--app-chrome-padding);
        font-style: italic;
    }

    .description {
        margin-top: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>
