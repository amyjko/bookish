<script lang="ts">
    import EditionLoader from '$lib/components/page/EditionLoader.svelte';
</script>

<EditionLoader write={true}>
    <slot />
</EditionLoader>
