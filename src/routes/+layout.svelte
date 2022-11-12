<script lang="ts">
    import Footer from "./Footer.svelte";
    import Header from "./Header.svelte";
    import Auth from "../lib/components/Auth.svelte";

</script>

{#if import.meta.env.PROD }
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <div style="text-align:center"><strong>Bookish</strong> is coming.</div>
{:else}
    <div class="bookish-app">
        <Auth>
            <Header/>
            <slot></slot>
            <Footer/>
        </Auth>
    </div>
{/if}

<style>
    .bookish-app {
        text-align: center;
        font-weight: var(--bookish-paragraph-font-weight);
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
        line-height: var(--bookish-paragraph-line-height);
    }

    :global(input, button) {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
        color: var(--bookish-app-chrome-color);
    }

    :global(input[type="email"], input[type="text"], select) {
        padding: var(--bookish-app-chrome-padding);
        font-size: var(--bookish-app-chrome-font-size);
        border: none;
        border-bottom: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
    }

    :global(textarea) {
        border: none;
        border-top: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
        border-bottom: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
    }

    :global(button, .bookish-file-upload) {
        background-color: var(--bookish-app-chrome-background);
        padding: var(--bookish-app-chrome-padding);
        border-top-right-radius: var(--bookish-app-chrome-roundedness);
        border-top-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: var(--bookish-app-chrome-roundedness);
        border: none;
    }

    :global(button:hover:enabled, .bookish-file-upload:hover) {
        background-color: var(--bookish-app-chrome-hover-background);
        color: var(--bookish-app-chrome-hover-color);
        cursor: pointer;
    }

    :global(button:disabled, .bookish-file-upload input:disabled) {
        opacity: 0.3;
        border-color: var(--bookish-app-chrome-muted);
        cursor: auto;
    }

    :global(.bookish-header button) {
        vertical-align: middle;
    }

    :global(input:focus, button:focus, select:focus, textarea:focus) {
        outline: 2px solid var(--bookish-highlight-color);
        z-index: 2;
    }

    :global(.bookish-file-upload) {
        font-family: var(--bookish-app-chrome-font);
        font-size: var(--bookish-app-chrome-font-size);
    }

    :global(.bookish-file-upload input[type="file"]) {
        display: none;
    }
</style>