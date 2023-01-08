<script lang="ts">
    import Link from '$lib/components/app/Link.svelte';
    import {
        getAuth,
        getBook,
        getEdition,
    } from '$lib/components/page/Contexts';
    import { getCaret } from '$lib/components/page/Contexts';
    import {
        getSubdomain,
        pathWithoutSubdomain,
    } from '../lib/util/getSubdomain';
    import Toolbar from '$lib/components/editor/Toolbar.svelte';
    import Status from '$lib/components/page/Status.svelte';

    let subdomain = getSubdomain();

    let auth = getAuth();

    function getLink(path: string) {
        return subdomain !== undefined ? pathWithoutSubdomain(path) : path;
    }

    // Get the focused editor context
    let activeEditor = getCaret();
    $: edition = getEdition();
    $: book = getBook();
</script>

<section class="header">
    <nav class="navigation">
        <Link to={getLink('/')}>Home</Link>
        <Link to={getLink('/read')}>Read</Link>
        <Link to={getLink('/write')}>Write</Link>
        {#if $auth?.user && $auth.user.email}
            <Link to={getLink('/email')}>{$auth.user.email}</Link>
        {:else}
            <Link to={getLink('/login')}>Login</Link>
        {/if}
        {#if $book}
            <span class="elided">&mdash; {$book.getTitle()}</span>
        {/if}
        {#if $edition && $book}
            <span class="elided"
                >&mdash; {$edition.getEditionLabel($book)} edition</span
            >
        {/if}
        <!-- Show status if there's a book and edition currently being viewed -->
        {#if $book && $edition}
            <span class="status">
                <Status />
            </span>
        {/if}
    </nav>
    {#if $activeEditor}
        <Toolbar caret={$activeEditor} />
    {/if}
</section>

<style>
    .header {
        width: 100%;
        box-sizing: border-box;
        text-align: center;
        position: sticky;
        top: 0;
        z-index: 3;
        background-color: var(--app-background-color);
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-border-color);
    }

    .navigation {
        display: flex;
        flex-direction: row;
        justify-content: center;
        padding: var(--app-chrome-padding);
        gap: var(--app-chrome-padding);
        text-overflow: ellipsis;
    }

    .status {
        /* This puts the saved status in the top right and pushes everything else left. */
        margin-left: auto;
    }

    .elided {
        overflow-x: clip;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
</style>
