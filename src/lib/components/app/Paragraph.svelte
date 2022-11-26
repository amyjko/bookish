<script lang="ts">
    export let aside:boolean = false;

</script>

<p class={aside ? "aside" : ""}><slot></slot></p>

<style>
    p {
        font-family: var(--bookish-app-font-family);
        font-size: var(--bookish-app-font-size);
        font-weight: 300;
        line-height: 1.7;
        margin-top: 0;
        margin-bottom: var(--bookish-app-content-spacing);
    }

    .aside {
        font-style: italic;
    }
</style>