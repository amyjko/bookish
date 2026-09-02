<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<h1>{@render children?.()}</h1>

<style>
    h1 {
        margin-top: 0;
        margin-bottom: 0;
        font-size: var(--bookish-title-font-size);
        font-family: var(--bookish-header-font-family);
        font-weight: var(--bookish-header-font-weight);
        line-height: var(--bookish-header-line-height);
    }
</style>
