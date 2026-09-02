<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<section>
    <table>
        {@render children?.()}
    </table>
</section>

<style>
    section {
        width: 100%;
        overflow-x: auto;
        margin-top: var(--app-text-spacing);
        border-top: var(--app-chrome-border-size) solid var(--app-border-color);
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-border-color);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        clear: both;
        border-collapse: separate;
        border-spacing: 0;
    }

    table :global(td:not(:first-of-type)) {
        padding: var(--app-chrome-padding);
        vertical-align: top;
        font-family: var(--app-font);
        font-weight: 300;
    }
</style>
