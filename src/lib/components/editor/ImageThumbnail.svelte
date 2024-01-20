<script lang="ts">
    import type { Image } from '../../models/book/BookMedia';

    export let image: Image;
    export let selected: boolean;
    export let select: (image: Image) => void;

    let retries = 3;
    let error: boolean = false;
    let loading: boolean = true;

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

    loadImage(image.thumb);
</script>

{#if loading}
    <div class="thumbnail loading" />
{:else}
    <div
        tabindex="0"
        role="button"
        on:click|stopPropagation={() => select(image)}
        on:keydown={(event) =>
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
