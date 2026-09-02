<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<section>
    {@render children?.()}
</section>

<style>
    section {
        margin: auto;
        padding-left: 2rem;
        padding-right: 2rem;
        max-width: 40rem;
    }
</style>
