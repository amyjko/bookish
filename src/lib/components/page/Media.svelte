<script lang="ts">
    import Header from "$lib/components/page/Header.svelte";
    import Outline from '$lib/components/page/Outline.svelte';
    import type { Image } from '$lib/models/book/BookMedia';
    import Page from '$lib/components/page/Page.svelte'
    import Instructions from '$lib/components/page/Instructions.svelte';
    import ChapterIDs from '$lib/models/book/ChapterID';
    import Format from '$lib/components/chapter/Format.svelte';
    import MediaPreview from "./MediaPreview.svelte";
    import { onMount } from "svelte";
    import { getEdition, isEditable } from "./Contexts";

    let edition = getEdition();
    let editable = isEditable();
    let images: Image[] | undefined = [];

    $: embeds = $edition.getEmbeds();
    $: media = $edition.getBook()?.getMedia();

    function updateImages(newImages: Image[] | undefined) {
        images = newImages;
    }

    onMount(() => {
        // Listen to image changes.
        media?.notify(updateImages);
        return () => media?.stopNotifying(updateImages);
    });

    $: unused = images?.filter(image => embeds.find(embed => embed.getURL() === image.url) === undefined);

</script>

<Page  title={`${$edition.getTitle()} - Media`}>
    <Header 
        label="Media title"
        getImage={() => $edition.getImage(ChapterIDs.MediaID)}
        setImage={(embed) => $edition.setImage(ChapterIDs.MediaID, embed)}
        header="Media"
        tags={$edition.getTags()}
    >
        <Outline
            slot="outline"
            previous={$edition.getPreviousChapterID(ChapterIDs.MediaID)}
            next={$edition.getNextChapterID(ChapterIDs.MediaID)}
        />
    </Header>
    <Instructions>
        This page shows readers an index of the media in the book.
        Writers can use this page to manage any images that are linked or uploaded for this book.
        Note: images are shared between all editions, so if you delete one not used in this edition,
        it might be used in others.
    </Instructions>

    {#if embeds.length === 0}
        <p>No images or videos appear in the book.</p>
    {:else}
        <p>These are the images and videos in the book:</p>
    {/if}
    {#each embeds as embed }
        <MediaPreview 
            url={embed.getSmallURL()} 
            alt={embed.getDescription()}
        >
            <span>{#if editable}{images && images.find(i => i.url === embed.getURL()) === undefined ? "linked" : "uploaded"}{embed.getCredit().isEmptyText() ? "" : " • "}{/if}<Format node={embed.getCredit()}/></span>
        </MediaPreview>
    {/each}
    {#if editable !== undefined && unused !== undefined && unused.length > 0 }
        <h2>Unused</h2>
        <Instructions>
            These images are uploaded to this book, but not used.
            Delete them if you don't need them.
            Note, however, that these images may be used in other editions of this book.
        </Instructions>
        {#each unused as image }
            <MediaPreview
                url={image.url}
                alt={""}
            >
                <span>uploaded <button on:click={() => media?.remove(image).then(images => updateImages(images))}>x</button></span>
            </MediaPreview>
        {/each}
    {/if}
</Page>