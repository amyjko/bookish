<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<span>{@render children?.()}</span>

<style>
    span {
        font-size: small;
        font-style: italic;
        font-weight: normal;
        color: var(--app-muted-color);
    }
</style>
