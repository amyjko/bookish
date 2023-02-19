<script lang="ts">
    import { page } from '$app/stores';

    export let to: string;
    export let before: Function | undefined = undefined;
    export let title: string | undefined = undefined;
    export let external: boolean = false;

    $: at = to === $page.url.pathname;
</script>

{#if at}
    <span class="link"> <slot /></span>
{:else}
    <a
        class="link"
        href={to}
        {title}
        on:click={() => (before ? before() : undefined)}
        target={to.startsWith('http') || external ? '_blank' : null}
        rel={external ? 'noreferrer' : null}><slot /></a
    >
{/if}

<style>
    .link {
        font-family: var(--app-font);
        font-weight: 400;
        text-decoration: none;
    }

    a {
        color: var(--app-interactive-color);
    }

    a:hover {
        text-decoration: underline;
    }
</style>
