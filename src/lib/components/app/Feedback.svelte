<script lang="ts">
    import Large from "./Large.svelte";

    export let error: boolean = false;
</script>

{#if error}
    <p role="alert"><slot></slot></p>
{:else}
    <p role="status" aria-live="polite"><Large><slot></slot></Large></p>
{/if}

<style>
    p {
        font-family: var(--bookish-app-font-family);
        margin-top: var(--bookish-app-content-spacing);
        margin-bottom: var(--bookish-app-content-spacing);
        padding: var(--bookish-app-chrome-padding);
        --bounce-height: 1em;
    }

    p[role="alert"] {
        color: var(--bookish-app-error-color);
    }

    p[role="alert"]:before {
        content: "! ";
        font-size: 200%;
    }

    p[role="status"] {
        color: var(--bookish-app-font-color);
        animation: waiting 1s infinite;
    }

    @keyframes waiting {
        0%   { transform: rotate(2deg); }
        50% { transform: rotate(-2deg); }
        100% { transform: rotate(2deg); }
    }

</style>