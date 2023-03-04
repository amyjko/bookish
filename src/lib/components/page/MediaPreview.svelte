<script lang="ts">
    import Link from '../Link.svelte';
    import { getBase } from './Contexts';

    export let url: string;
    export let alt: string;
    export let chapterID: string | undefined;

    let base = getBase();

    let loaded: boolean | null;
    let urlChecked: string;
    $: {
        if (urlChecked !== url && typeof Image !== 'undefined') {
            urlChecked = url;
            let image = new Image();
            image.src = url;
            loaded = image.complete;
            if (!loaded) {
                image.onload = () => (loaded = true);
                image.onerror = () => (loaded = null);
            }
        }
    }
</script>

<figure class={'media-preview'}>
    {#if loaded}
        <Link to={`${$base}/${chapterID}`} linked={chapterID !== undefined}
            ><img src={url.startsWith('http') ? url : `${url}`} {alt} /></Link
        >
    {:else if loaded === null}
        <div class="missing">missing image</div>
    {/if}
    <figcaption class="credit"><slot /></figcaption>
</figure>

<style>
    .media-preview {
        display: inline-block;
        width: 12rem;
        margin: 1em;
        vertical-align: bottom;
    }

    .media-preview img {
        width: 100%;
        height: auto;
    }

    .missing {
        height: 8em;
        border: 1px solid var(--bookish-border-color-light);
        padding: var(--bookish-inline-padding);
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-small-font-size);
    }

    .credit {
        display: block;
        text-align: right;
        font-style: italic;
        font-size: var(--bookish-small-font-size);
    }
</style>
