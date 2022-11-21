<script lang="ts">
    export let url: string;
    export let alt: string;
</script>
    
<span class={"bookish-figure-preview"}>
    <img 
        src={url} 
        alt={alt}
    />
    <div class="bookish-figure-credit"><slot></slot></div>
</span>

<style>
    .bookish-figure-preview {
        display: inline-block;
        width: 10rem;
        margin: 1em;
        vertical-align: bottom;
    }

    .bookish-figure-preview img {
        width: 100%;
        height: auto;
    }

    .bookish-figure-credit {
        display: block;
        text-align: right;
        font-style: italic;
        font-size: var(--bookish-small-font-size);
    }

</style>