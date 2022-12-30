<script lang="ts">
    import Link from '../Link.svelte';

    export let link: string | undefined = undefined;
</script>

<span>
    {#if link}
        <Link to={link}><slot /></Link>
    {:else}
        <slot />
    {/if}
</span>

<style>
    span {
        font-family: var(--bookish-header-font-family);
    }
</style>
