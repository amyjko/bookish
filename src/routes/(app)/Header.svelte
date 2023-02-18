<script lang="ts">
    import Link from '$lib/components/app/Link.svelte';
    import {
        getUser,
        getBook,
        getEdition,
    } from '$lib/components/page/Contexts';
    import { getCaret } from '$lib/components/page/Contexts';
    import Toolbar from '$lib/components/editor/Toolbar.svelte';
    import Status from '$lib/components/page/Status.svelte';
    import HomeIcon from '$lib/components/editor/icons/home.svg?raw';
    import Icon from '$lib/components/editor/Icon.svelte';
    import { page } from '$app/stores';
    import DarkToggle from '$lib/components/controls/DarkToggle.svelte';
    import { isDark, setDark } from '$lib/util/dark';

    let auth = getUser();

    let caret = getCaret();
    $: edition = getEdition();
    $: book = getBook();

    $: writing = $page.route.id?.includes('/write/');
</script>

<section class="header">
    <nav class="navigation">
        <Link to="/" title="Home"><Icon icon={HomeIcon} /></Link>
        {#if $book && $edition}
            <span class="elided"
                ><Link to={`${writing ? '/write' : ''}/${$book.getID()}`}
                    >{$book.getTitle()}</Link
                ></span
            >
            {#if $page.route.id?.includes('/[bookid]/editions')}
                <span>&ndash; Editions</span>
            {/if}
            <span
                >&ndash; <Link
                    to={`${writing ? '/write' : ''}/${$book.getID()}/editions`}
                    >{$edition.getEditionLabel()} edition</Link
                ></span
            >
            <span class="status">
                {#if $auth?.user && $auth.user.email}
                    <Link to="/email">{$auth.user.email}</Link>
                {:else}
                    <Link to="/login">Login</Link>
                {/if}
                <Link to="/about">(beta)</Link>
                <Status />
            </span>
        {:else}
            <Link to="/read">Read</Link>
            <Link to="/write">Write</Link>
            <Link to="/about">About</Link>
            <small>
                {#if $auth?.user && $auth.user.email}
                    <Link to="/email">{$auth.user.email}</Link>
                {:else}
                    <Link to="/login">Login</Link>
                {/if}
                <Link to="/about">(beta)</Link>
            </small>
            <div class="controls">
                <DarkToggle dark={isDark()} toggle={() => setDark(!isDark())} />
            </div>
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
        padding: var(--app-chrome-padding);
        background-color: var(--app-background-color);
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-border-color);
        display: flex;
        flex-direction: column;
        gap: var(--app-chrome-padding);
    }

    .navigation {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: var(--app-chrome-padding);
        text-overflow: ellipsis;
        align-items: baseline;
    }

    .status {
        /* This puts the saved status in the top right and pushes everything else left. */
        margin-left: auto;
        font-size: 90%;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: var(--app-chrome-padding);
        align-items: baseline;
    }

    .elided {
        overflow-x: clip;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    .controls {
        margin-left: auto;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: var(--app-chrome-padding);
    }
</style>
