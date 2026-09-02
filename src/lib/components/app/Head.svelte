<script lang="ts">
    interface Props {
        id?: string | null;
        children?: import('svelte').Snippet;
    }

    let { id = null, children }: Props = $props();
</script>

<h2 {id}>{@render children?.()}</h2>

<style>
    h2 {
        font-size: 150%;
        font-weight: bold;
        font-family: var(--app-font);
        margin-top: var(--app-text-spacing);
        margin-bottom: 0;
        margin-left: -1rem;
    }
</style>
