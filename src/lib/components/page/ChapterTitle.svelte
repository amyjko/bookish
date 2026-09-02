<script lang="ts">
    import Link from '../Link.svelte';

    interface Props {
        link?: string | undefined;
        children?: import('svelte').Snippet;
    }

    let { link = undefined, children }: Props = $props();
</script>

{#if link}
    <Link to={link}><h3> {@render children?.()}</h3></Link>
{:else}
    <h3>{@render children?.()}</h3>
{/if}

<style>
    h3 {
        font-family: var(--bookish-header-font-family);
        /* Disable heavy weight in this context. */
        font-weight: normal;
        margin: 0;
    }
</style>
