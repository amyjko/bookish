<script lang="ts">
    import type { Image } from '$lib/models/book/BookMedia';
    import { onMount } from 'svelte';
    import { getBook } from '$lib/components/page/Contexts';
    import ImageThumbnail from './ImageThumbnail.svelte';

    interface Props {
        select: (image: Image) => void;
        selection: string;
    }

    let { select, selection }: Props = $props();

    let book = getBook();
    let images: Image[] | undefined = $state(undefined);
    let expanded = $state(false);

    function updateImages(newImages: Image[]) {
        images = newImages;
    }

    // Load the latest images in the book, and keep them updated as they change.
    onMount(() => {
        if ($book === undefined) return;
        const media = $book.getMedia();
        media.notify(updateImages);
        return () => media.stopNotifying(updateImages);
    });
</script>

<div
    class={`bookish-image-chooser ${expanded ? 'expanded' : ''}`}
    tabindex="0"
    role="button"
    onclick={() => (expanded = !expanded)}
    onkeydown={(event) =>
        event.key === 'Enter' || event.key === ' '
            ? (expanded = !expanded)
            : undefined}
    onmouseenter={() => (expanded = true)}
    onmouseleave={() => (expanded = false)}
>
    {#if images === undefined}
        Loading images
    {:else}
        <!-- Sort the images by their URL. There's probably a more meaningful sort,
                    such as placing unused images at the front of the list. -->
        {#each images.sort((a, b) => a.url.localeCompare(b.url)) as image}
            <ImageThumbnail
                {image}
                selected={image.url === selection}
                {select}
            />
        {:else}
            No images uploaded
        {/each}
    {/if}
</div>

<style>
    .bookish-image-chooser {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
        overflow-x: scroll;
        gap: calc(var(--app-chrome-padding) / 2);
    }

    .bookish-image-chooser.expanded {
        height: auto;
        overflow-y: auto;
    }
</style>
