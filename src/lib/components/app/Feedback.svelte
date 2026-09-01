<script lang="ts">
    import Large from './Large.svelte';

    interface Props {
        error?: boolean;
        children?: import('svelte').Snippet;
    }

    let { error = false, children }: Props = $props();
</script>

{#if error}
    <p role="alert">{@render children?.()}</p>
{:else}
    <p role="status" aria-live="polite"><Large>{@render children?.()}</Large></p>
{/if}

<style>
    p {
        font-family: var(--app-font);
        margin-top: var(--app-text-spacing);
        margin-bottom: var(--app-text-spacing);
        padding: var(--app-chrome-padding);
        --bounce-height: 1em;
    }

    p[role='alert'] {
        color: var(--app-error-color);
    }

    p[role='status'] {
        color: var(--app-font-color);
        /* animation: waiting 1s 1; */
    }

    @keyframes waiting {
        0% {
            transform: rotate(1deg);
        }
        50% {
            transform: rotate(-1deg);
        }
        100% {
            transform: rotate(1deg);
        }
    }
</style>
