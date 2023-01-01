<script lang="ts">
    import Footer from './Footer.svelte';
    import Header from './Header.svelte';
    import Auth from '$lib/components/Auth.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Writing from '$lib/components/app/Writing.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import { writable, type Writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import {
        ActiveEditorSymbol,
        BOOK,
        EDITION,
        type EditionContext,
    } from '$lib/components/page/Contexts';
    import type Book from '$lib/models/book/Book';
    import type Edition from '../lib/models/book/Edition';
    import type CaretState from '../lib/components/editor/CaretState';

    // A global store context for the focused editor, used to display toolbar.
    let activeEditor = writable<CaretState | undefined>(undefined);
    setContext(ActiveEditorSymbol, activeEditor);

    // A global store for the current book. It's at the root so the header can do breadcrumbs.
    let activeBook = writable<Book | undefined>(undefined);
    setContext<Writable<Book | undefined>>(BOOK, activeBook);

    // A global store for the current edition. It's at the root so the header can do breacrumbs.
    let activeEdition = writable<Edition>(undefined);
    setContext<EditionContext>(EDITION, activeEdition);
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
