<script lang="ts">
    import Footer from "./Footer.svelte";
    import Header from "./Header.svelte";
    import Auth from "$lib/components/Auth.svelte";
    import Large from "$lib/components/app/Large.svelte";
    import Lead from "$lib/components/app/Lead.svelte";
    import Writing from "$lib/components/app/Writing.svelte";
    import Paragraph from "$lib/components/app/Paragraph.svelte";
</script>


{#if import.meta.env.PROD }
    <Writing>
        <Lead><Large>Bookish</Large> is coming.</Lead>
        <Paragraph>
            A new way to write books online.
        </Paragraph>
    </Writing>
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

    /* Custom fonts for app */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap');

    :global(:root) {

        /* Define some UI defaults not used in the Bookish theme. */
        --bookish-app-font-family: "Outfit", sans-serif;
        --bookish-app-header-font: "Outfit", sans-serif;
        --bookish-app-font-size: 14pt;
        --bookish-app-link-color: #1B499C;
        --bookish-app-chrome-hover-background: #1B499C;
        --bookish-app-background: white;
        --bookish-app-chrome-background: rgb(244, 244, 244);
        --bookish-app-font-color: black;
        --bookish-app-chrome-color: black;
        --bookish-app-chrome-border-color: #444444;
        --bookish-app-chrome-hover-color: #FFFFFF;
        --bookish-app-chrome-muted: #AAAAAA;
        --bookish-app-highlight-width: 3px;

        --bookish-app-error-background: rgb(255, 231, 231);
        --bookish-app-error-color: rgb(191, 15, 15);
        --bookish-app-error-font-weight: 400;

        --bookish-app-content-spacing: 2em;

        --bookish-app-chrome-font-family: "Outfit", sans-serif;
        --bookish-app-chrome-font-size: 13pt;
        --bookish-app-chrome-padding: 0.5em;
        --bookish-app-chrome-border-width: 3px;
        --bookish-app-chrome-roundedness: 5px;
        --bookish-app-chrome-spacing: 0.5em;
        --bookish-app-chrome-line-height: 1.5em;

        --bookish-app-margin: 1em;

    }

    .bookish-app {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-weight: 300;
        color: var(--bookish-app-font-color);
        font-family: var(--bookish-app-font-family);
        font-size: 14pt;
        background-color: var(--bookish-app-background);
    }

    :global(.bookish-file-upload) {
        background-color: var(--bookish-app-chrome-background);
        padding: var(--bookish-app-chrome-padding);
        border-top-right-radius: var(--bookish-app-chrome-roundedness);
        border-top-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom-left-radius: var(--bookish-app-chrome-roundedness);
        border: none;
    }

    :global(.bookish-file-upload:hover) {
        background-color: var(--bookish-app-chrome-hover-background);
        color: var(--bookish-app-chrome-hover-color);
        cursor: pointer;
    }

    :global(.bookish-file-upload input:disabled) {
        opacity: 0.3;
        border-color: var(--bookish-app-chrome-muted);
        cursor: auto;
    }

    :global(.bookish-file-upload) {
        font-family: var(--bookish-app-chrome-font);
        font-size: var(--bookish-app-chrome-font-size);
    }

    :global(.bookish-file-upload input[type="file"]) {
        display: none;
    }

    :global(.firebase-emulator-warning) {
        opacity: 0.05;
        pointer-events: none;
    }

    @keyframes -global-failure {
        0% {
            transform: translate(-2px, 0px);
        }
        50% {
            transform: translate(0px, 0px);
        }
        100% {
            transform: translate(2px, 0px);
        }
    }
</style>