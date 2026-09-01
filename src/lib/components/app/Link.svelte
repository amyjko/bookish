<script lang="ts">
    import { page } from '$app/stores';

    interface Props {
        to: string;
        before?: Function | undefined;
        title?: string | undefined;
        external?: boolean;
        children?: import('svelte').Snippet;
    }

    let {
        to,
        before = undefined,
        title = undefined,
        external = false,
        children
    }: Props = $props();

    let at = $derived(to === $page.url.pathname);
</script>

{#if at}
    <span class="link"> {@render children?.()}</span>
{:else}
    <a
        class="link"
        href={to}
        {title}
        onclick={() => (before ? before() : undefined)}
        target={to.startsWith('http') || external ? '_blank' : null}
        rel={external ? 'noreferrer' : null}>{@render children?.()}</a
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
