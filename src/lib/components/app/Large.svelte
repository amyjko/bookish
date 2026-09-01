<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<span>{@render children?.()}</span>

<style>
    span {
        font-size: 175%;
        font-weight: bold;
    }
</style>
