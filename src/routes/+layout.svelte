<script lang="ts">
    import Footer from './Footer.svelte';
    import Header from './Header.svelte';
    import Auth from '$lib/components/Auth.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Writing from '$lib/components/app/Writing.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
</script>

{#if import.meta.env.PROD}
    <Writing>
        <Lead><Large>Bookish</Large> is coming.</Lead>
        <Paragraph>A new way to write books online.</Paragraph>
    </Writing>
{:else}
    <div class="bookish-app">
        <Auth>
            <Header />
            <slot />
            <Footer />
        </Auth>
    </div>
{/if}

<style>
    /* Custom fonts for app */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap');

    :global(.bookish-app) {
        /* Define some UI defaults not used in the Bookish theme. */
        --app-font: 'Outfit', sans-serif;
        --app-line-height: 1.7;
        --app-font-size: 14pt;
        --app-text-spacing: 2rem;

        --app-interactive-color: #1b499c;
        --app-background-color: white;
        --app-font-color: black;
        --app-border-color: #444444;
        --app-font-color-inverted: #ffffff;
        --app-muted-color: #aaaaaa;
        --app-error-color: rgb(191, 15, 15);

        --app-chrome-background: rgb(244, 244, 244);
        --app-chrome-font-size: 12pt;
        --app-chrome-padding: 0.5em;
        --app-chrome-border-size: 3px;
        --app-chrome-roundedness: 5px;
        --app-chrome-padding: 0.5em;
    }

    :global(.dark .bookish-app) {
        --app-interactive-color: #1455ce;
        --app-background-color: #050505;
        --app-font-color: white;
        --app-border-color: #353535;
        --app-font-color-inverted: #000000;
        --app-muted-color: #a9a9a9;
        --app-error-color: rgb(80, 8, 8);
        --app-chrome-background: rgb(46, 46, 46);
    }

    .bookish-app {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-weight: 300;
        color: var(--app-font-color);
        font-family: var(--app-font);
        font-size: 14pt;
        background-color: var(--app-background-color);
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
