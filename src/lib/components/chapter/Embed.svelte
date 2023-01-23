<svelte:options immutable={true} />

<script lang="ts">
    import type EmbedNode from '$lib/models/chapter/EmbedNode';
    import { storage } from '$lib/models/Firebase';
    import { getCaret, getBook } from '$lib/components/page/Contexts';
    import Figure from './Figure.svelte';
    import { getContext } from 'svelte';

    export let node: EmbedNode;
    export let editable: boolean = false;
    export let placeholder: string = '';
    export let imageOnly: boolean = false;

    $: url = node.getURL();
    $: description = node.getDescription();

    let caret = getCaret();
    let book = getBook();

    // Bookish editor should have passed down a way to set the active editor.
    let claimCaret = getContext<Function>('claimeditor');

    let dragging = false;
    let dragFeedback: undefined | string = undefined;
    let imageError = false;
    $: if (node) imageError = false;

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.items) {
            // Get the files and convert them to file opens, then filter by allowed file extensions
            const imageFiles = [...event.dataTransfer.items]
                .filter((item) => item.kind === 'file')
                .map((item) => item.getAsFile())
                .filter(
                    (file) =>
                        file !== null && /.*\.(jpg|jpeg|png)/i.test(file.name)
                );
            if (imageFiles.length === 0)
                dragFeedback = 'Only JPEG or PNG images are allowed.';
            else if (imageFiles.length > 1)
                dragFeedback = 'Only one image at a time please!';
            else {
                dragFeedback = 'Uploading…';

                const file = imageFiles[0];
                const media = $book?.getMedia();

                if (file === null) return;
                if (storage === undefined) return;
                if (media === undefined) return;

                media.upload(
                    file,
                    (progress: number) => (dragFeedback = `${progress}% done`),
                    (error: string) => {
                        dragFeedback = error;
                        dragging = false;
                    },
                    (url: string, thumbnails: string) => {
                        // Upload completed successfully, now we can get the download URL
                        $caret?.edit(
                            node,
                            node.withURLs(url, thumbnails).withDescription('')
                        );
                        dragging = false;
                        dragFeedback = undefined;
                    }
                );
            }
        }
    }

    function handleDrag(event: DragEvent) {
        event?.preventDefault();
        dragging = true;
        dragFeedback = 'Drop to upload…';
        // If we have a way to claim the caret, claim it, since we want to be able to make an edit with the active caret.
        if (claimCaret) claimCaret();
    }

    function handleDragLeave(event: DragEvent) {
        if (event.target !== event.currentTarget) return;
        event?.preventDefault();
        dragging = false;
        dragFeedback = undefined;
    }

    function handleLoad() {
        imageError = false;
    }

    function handleError() {
        imageError = true;
    }

    function handleClick() {
        if (claimCaret) claimCaret();
    }
</script>

{#if imageError}
    <p class="bookish-figure-unspecified"
        >{editable
            ? 'Unable to load image. Is the URL correct? Are you offline?'
            : 'Unable to load image'}</p
    >
{:else}
    <Figure
        {node}
        caption={imageOnly ? undefined : node.getCaption()}
        credit={imageOnly ? undefined : node.getCredit()}
    >
        {#if url.trim().length === 0}
            {#if editable}
                <p
                    class={`bookish-figure-unspecified ${
                        dragging ? 'bookish-figure-dragging' : ''
                    }`}
                    on:click|preventDefault={handleClick}
                    tabIndex="0"
                    on:keydown={(event) =>
                        event.key === ' ' || event.key === 'Enter'
                            ? handleClick()
                            : undefined}
                    on:drop|preventDefault={handleDrop}
                    on:dragover={handleDrag}
                    on:dragleave={handleDragLeave}
                    >{dragFeedback !== undefined
                        ? dragFeedback
                        : placeholder.length > 0
                        ? placeholder
                        : 'Click or drag to choose or upload an image, or enter an image or video URL.'}
                </p>
            {:else}
                <p class="bookish-figure-unspecified">No image or video</p>
            {/if}
        {:else if url.includes('https://www.youtube.com') || url.includes('https://youtu.be') || url.includes('https://www.tiktok.com') || url.includes('vimeo.com')}
            <article class="bookish-figure-embed">
                <iframe
                    class="bookish-figure-frame"
                    title={description}
                    src={url}
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </article>
        {:else}
            <img
                class={'bookish-figure-image'}
                src={url.startsWith('http') ? url : 'images/' + url}
                srcset={node.hasSmallURL()
                    ? `${node.getSmallURL()} 320w, ${url} 1024w`
                    : undefined}
                sizes={node.hasSmallURL()
                    ? '(min-width: 1024px) 1024px, 320px'
                    : undefined}
                alt={description}
                on:load={handleLoad}
                on:error={handleError}
            />
        {/if}
    </Figure>
{/if}

<style>
    .bookish-figure {
        margin-top: var(--bookish-paragraph-spacing);
        margin-bottom: var(--bookish-paragraph-spacing);
        width: 100%;
    }

    .bookish-figure-image {
        border-radius: var(--bookish-roundedness);
        max-width: 100%;
        width: 100%;
        height: auto;
        margin-bottom: 0;
    }

    :global(.dark) .bookish-figure-image {
        filter: brightness(50%);
    }

    .bookish-figure-embed {
        position: relative;
        display: block;
        width: 100%;
        padding: 0;
        overflow: hidden;
        border-radius: var(--bookish-roundedness);
    }

    .bookish-figure-embed::before {
        /* Make the embed 16:9 */
        padding-top: 56.25%;
        display: block;
        content: '';
    }

    .bookish-figure-unspecified {
        width: 100%;
        height: 8em;
        font-family: var(--app-font);
        background-color: var(--app-chrome-background);
        color: var(--app-chrome-color);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .bookish-figure-dragging {
        background-color: var(--app-interactive-color);
        color: var(--app-font-color-inverted);
    }

    .bookish-figure-frame {
        /* Fill the container */
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: 0;
    }
</style>
