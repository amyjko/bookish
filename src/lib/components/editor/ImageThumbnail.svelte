<script lang="ts">
    import type { Image } from '../../models/book/BookMedia';

    interface Props {
        image: Image;
        selected: boolean;
        select: (image: Image) => void;
    }

    let { image, selected, select }: Props = $props();

    let retries = 3;
    let error: boolean = $state(false);
    let loading: boolean = $state(true);

    function loadImage(url: string) {
        retries--;
        let img = new Image();
        img.onerror = () => {
            if (retries > 0) {
                setTimeout(() => loadImage(url), 1000);
            } else {
                loading = false;
                error = true;
            }
        };
        img.onload = () => {
            loading = false;
        };
        img.src = url;
    }

    // Load now and whenever the image prop changes (thumbnails can be
    // reused for a different image by an unkeyed list).
    $effect(() => {
        retries = 3;
        loading = true;
        error = false;
        loadImage(image.thumb);
    });
</script>

{#if loading}
    <div class="thumbnail loading"></div>
{:else}
    <div
        tabindex="0"
        role="button"
        onclick={(event) => {
            event.stopPropagation();
            select(image);
        }}
        onkeydown={(event) =>
            event.key === 'Enter' || event.key === ' '
                ? select(image)
                : undefined}
    >
        <img
            class="thumbnail"
            class:selected
            src={error ? image.url : image.thumb}
            alt={`Image named ${image.url}`}
        />
    </div>
{/if}

<style>
    .thumbnail {
        display: inline-block;
        height: 1.5em;
        cursor: pointer;
    }

    .thumbnail.selected {
        outline: var(--app-chrome-border-size) solid
            var(--app-interactive-color);
        outline-offset: calc(-1 * var(--app-chrome-border-size));
    }

    .loading {
        width: 2.5em;
        background: var(--app-chrome-background);
    }
</style>
