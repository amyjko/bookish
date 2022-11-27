<script lang="ts">

    import type { Image } from '$lib/models/book/BookMedia';
    import { onMount } from 'svelte';
    import { getBook } from '../page/Contexts';
    
    export let select: (image: Image) => void;
    export let selection: string;
	
    let book = getBook();
	let images: Image[] | undefined = undefined;
    let expanded = false;

    function updateImages(newImages: Image[]) {
        images = newImages;
    }

    // Load the latest images in the book, and keep them updated as they change.
	onMount(() => {
        const media = book.getMedia();
        media.notify(updateImages);
        return () => media.stopNotifying(updateImages);
	});

</script>

<div 
    class={`bookish-image-chooser ${expanded ? "expanded" : ""}`}
    tabIndex=0
    on:click={() => expanded = !expanded}
    on:keydown={event => event.key === "Enter" || event.key === " " ? expanded = !expanded : undefined }
    on:mouseenter={() => expanded = true}
    on:mouseleave={() => expanded = false}
>
    {#if images === undefined}
        Loading images
    {:else}
        <!-- Sort the images by their URL. There's probably a more meaningful sort,
                such as placing unused images at the front of the list. -->
        {#each images.sort((a, b) => a.url.localeCompare(b.url)) as image }
            <img 
                class={`bookish-image-chooser-image ${image.url === selection ? "selected" : ""}`}
                src={image.url} 
                alt={`Image named ${image.url}`}
                tabIndex=0
                on:click|stopPropagation={() => select(image)}
                on:keydown={event => event.key === "Enter" || event.key === " " ? select(image) : undefined }
            />
        {:else}
            No images uploaded
        {/each}
    {/if}
</div>

<style>
    .bookish-image-chooser {
        margin-top: var(--app-chrome-padding);
        height: 3em;
        overflow-y: hidden;
    }

    .bookish-image-chooser.expanded {
        height: auto;
        overflow-y: auto;
    }

    .bookish-image-chooser-image {
        display: inline-block;
        height: 3em;
        margin-right: var(--app-chrome-padding);
        cursor: pointer;
    }

    .bookish-image-chooser-image.selected {
        outline: var(--app-chrome-border-size) solid var(--app-interactive-color);
        outline-offset: calc(-1 * var(--app-chrome-border-size));
    }
</style>