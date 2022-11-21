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

    /* Custom fonts for app */
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Kite+One&display=swap');

    :global(:root) {

        /* Bookish app theme customizations */
        --bookish-paragraph-font-family: "EB Garamond", serif;
        --bookish-header-font-family: "Kite One", serif;
        --bookish-bullet-font-family: "Verdana";

        /* Define some UI defaults not used in the Bookish theme. */
        --bookish-app-background: white;
        --bookish-app-chrome-background: rgb(244, 244, 244);
        --bookish-app-chrome-color: black;
        --bookish-app-chrome-border-color: #d5d5d5;
        --bookish-app-chrome-hover-background: #E8AF22;
        --bookish-app-chrome-hover-color: #FFFFFF;
        --bookish-app-chrome-muted: #AAAAAA;
        --bookish-app-chrome-font-family: "Verdana";
        --bookish-app-highlight-width: 3px;

        --bookish-app-error-background: rgb(255, 231, 231);
        --bookish-app-error-color: rgb(191, 15, 15);
        --bookish-app-error-font-weight: 400;

        --bookish-app-chrome-padding: 0.5em;
        --bookish-app-chrome-border-width: 1px;
        --bookish-app-chrome-roundedness: 2px;
        --bookish-app-chrome-font-size: 11pt;
        --bookish-app-chrome-spacing: 0.5em;
        --bookish-app-chrome-line-height: 1.5em;

        --bookish-app-margin: 1em;

    }    
    .bookish-app {
        text-align: center;
        font-weight: var(--bookish-paragraph-font-weight);
        font-family: var(--bookish-paragraph-font-family);
        font-size: var(--bookish-paragraph-font-size);
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