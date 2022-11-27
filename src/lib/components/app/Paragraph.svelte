<script lang="ts">
    export let aside:boolean = false;

</script>

<p class={aside ? "aside" : ""}><slot></slot></p>

<style>
    p {
        font-family: var(--app-font);
        font-size: var(--app-font-size);
        font-weight: 300;
        line-height: var(--app-line-height);
        margin-top: 0;
        margin-bottom: var(--app-text-spacing);
    }

    .aside {
        font-style: italic;
    }
</style>