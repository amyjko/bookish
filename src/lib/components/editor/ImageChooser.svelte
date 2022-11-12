<script lang="ts">

    import type { Image } from '$lib/models/book/BookMedia';
    import { getContext, onMount } from 'svelte';
    import type Book from '$lib/models/book/Book';
    import { BOOK } from '../page/Symbols';
    
    export let select: (image: Image) => void;
    export let selection: string;
	
    let book = getContext<Book>(BOOK);
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
    on:click={() => expanded = !expanded}
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
                alt={""}
                on:click|stopPropagation={() => select(image)}
            />
        {:else}
            No images uploaded
        {/each}
    {/if}
</div>
