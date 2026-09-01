<script lang="ts">
    import BookLoader from '$lib/components/page/BookLoader.svelte';
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<BookLoader>{@render children?.()}</BookLoader>
