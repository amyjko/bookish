<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<h1>{@render children?.()}</h1>

<style>
    h1 {
        font-family: var(--app-font);
        font-weight: 300;
        font-size: 24pt;
        margin-top: 5rem;
        margin-left: -1rem;
        margin-bottom: var(--app-text-spacing);
    }
</style>
