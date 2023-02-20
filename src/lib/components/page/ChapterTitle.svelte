<script lang="ts">
    import Link from '../Link.svelte';

    export let link: string | undefined = undefined;
</script>

{#if link}
    <Link to={link}><h3> <slot /></h3></Link>
{:else}
    <h3><slot /></h3>
{/if}

<style>
    h3 {
        font-family: var(--bookish-header-font-family);
        /* Disable heavy weight in this context. */
        font-weight: normal;
        margin: 0;
    }
</style>
