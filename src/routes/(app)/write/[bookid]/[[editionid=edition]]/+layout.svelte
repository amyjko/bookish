<script lang="ts">
    import EditionLoader from '$lib/components/page/EditionLoader.svelte';
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<EditionLoader write={true}>
    {@render children?.()}
</EditionLoader>
