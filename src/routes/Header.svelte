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
    import HomeIcon from '$lib/components/editor/icons/home.svg?raw';
    import Icon from '$lib/components/editor/Icon.svelte';
    import { page } from '$app/stores';

    let subdomain = getSubdomain();

    let auth = getAuth();

    function getLink(path: string) {
        return subdomain !== undefined ? pathWithoutSubdomain(path) : path;
    }

    let caret = getCaret();
    $: edition = getEdition();
    $: book = getBook();
</script>

<section class="header">
    <nav class="navigation">
        <Link to={getLink('/')} title="Home"><Icon icon={HomeIcon} /></Link>
        <Link to={getLink('/read')}>Read</Link>
        <Link to={getLink('/write')}>Write</Link>
        <small>
            {#if $auth?.user && $auth.user.email}
                <Link to={getLink('/email')}>{$auth.user.email}</Link>
            {:else}
                <Link to={getLink('/login')}>Login</Link>
            {/if}
        </small>
        {#if $book && $edition}
            <span class="elided"
                ><Link
                    to={`${
                        $page.route.id?.startsWith('/write') ? '/write' : ''
                    }/${$book.ref.id}`}>{$book.getTitle()}</Link
                ></span
            >
        {/if}
        {#if $book && $page.route.id?.includes('/[bookid]/editions')}
            <span>&ndash; Editions</span>
        {/if}
        {#if $book && $edition}
            <span
                >&ndash; <Link
                    to={`${
                        $page.route.id?.startsWith('/write') ? '/write' : ''
                    }/${$book.ref.id}/editions`}
                    >{$edition.getEditionLabel()} edition</Link
                ></span
            >
        {/if}
        <!-- Show status if there's a book and edition currently being viewed -->
        {#if $book && $edition}
            <span class="status">
                <Status />
            </span>
        {/if}
    </nav>
    {#if $caret}
        <Toolbar caret={$caret} />
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
        align-items: baseline;
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
