<script lang="ts">
    export let url: string;
    export let alt: string;
</script>

<figure class={'media-preview'}>
    <img src={url.startsWith('http') ? url : `${url}`} {alt} />
    <figcaption class="credit"><slot /></figcaption>
</figure>

<style>
    .media-preview {
        display: inline-block;
        width: 10rem;
        margin: 1em;
        vertical-align: bottom;
    }

    .media-preview img {
        width: 100%;
        height: auto;
    }

    .credit {
        display: block;
        text-align: right;
        font-style: italic;
        font-size: var(--bookish-small-font-size);
    }
</style>
