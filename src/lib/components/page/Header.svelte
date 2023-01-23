<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import Embed from '$lib/components/chapter/Embed.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Title from './Title.svelte';
    import { onMount } from 'svelte';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import { getAuth, getEdition, getLeasee, lease } from './Contexts';
    import Button from '../app/Button.svelte';

    /** True if an author should be able to edit this header. */
    export let editable: boolean;
    export let label: string;
    export let header: string;
    export let id: string;
    export let subtitle: string | undefined = undefined;
    export let print: boolean = false;
    export let tags: string[] | undefined = undefined;
    export let getImage: () => string | null;
    export let setImage: (embed: string | null) => Promise<void> | void;
    export let save: ((text: string) => Promise<void> | void) | null = null;

    let title: HTMLHeadingElement | null = null;
    let showReminder: boolean = true;

    let auth = getAuth();
    let edition = getEdition();

    function updateScrollReminder() {
        // If the bottom of the window is below the top of the title, hide the reminder.
        if (title)
            showReminder =
                window.scrollY + window.innerHeight <=
                title.getBoundingClientRect().top + window.scrollY;
    }

    function addCover() {
        if (setImage) setImage('|||||');
    }
    function removeCover() {
        if (setImage) setImage(null);
    }

    // When the title becomes visible or hidden, update the scroll reminder.
    onMount(() => {
        const intersectionObserver = new IntersectionObserver(() =>
            updateScrollReminder()
        );
        if (title) intersectionObserver.observe(title);
        updateScrollReminder();

        // Stop observing when unmounted.
        return () => {
            if (title) intersectionObserver.unobserve(title);
        };
    });

    // Get the embed, update when getImage function prop changes.
    let embed: string | null;
    $: embed = getImage();
</script>

<header class="bookish-chapter-header">
    {#if embed}
        <div class="bookish-figure-full">
            {#if $edition && editable}
                <BookishEditor
                    text={embed}
                    parser={(text) => Parser.parseEmbed($edition, text)}
                    save={(node) =>
                        setImage ? setImage(node.toBookdown()) : undefined}
                    chapter={false}
                    component={Embed}
                    placeholder=""
                    leasee={getLeasee(auth, edition, `embed-${id}`)}
                    lease={(lock) => lease(auth, edition, `embed-${id}`, lock)}
                />
            {:else}
                <Embed
                    node={Parser.parseEmbed($edition, embed)}
                    editable={false}
                />
            {/if}
            {#if !print && showReminder}
                <div class="bookish-scroll-reminder" />
            {/if}
        </div>
    {:else}
        <!-- Add a bit of space to account for the lack of an image. -->
        <p>&nbsp;</p>
    {/if}
    {#if !print}
        <slot name="outline" />
    {/if}
    {#if editable}
        {#if embed === null}
            <Button tooltip="add cover image to page" command={addCover}
                >+ cover image</Button
            >
        {:else}
            <Button tooltip="remove cover image from page" command={removeCover}
                >- cover image</Button
            >
        {/if}
    {/if}
    <div bind:this={title} class="bookish-chapter-header-text">
        <slot name="before" />
        <Title>
            {#if editable && save}
                <TextEditor
                    {label}
                    text={header + (subtitle ? ': ' + subtitle : '')}
                    placeholder="Title"
                    valid={(text) =>
                        text.length === 0
                            ? 'Titles have to be at least one character long.'
                            : undefined}
                    {save}
                />
            {:else}
                {header}
                {#if subtitle}<div class="bookish-subtitle">{subtitle}</div
                    >{/if}
            {/if}
        </Title>
        <slot name="after" />
        {#if tags}
            <div
                >{#each tags as tag}<span class="bookish-tag">{tag}</span
                    >{/each}</div
            >
        {/if}
    </div>
</header>

<style>
    .bookish-subtitle {
        font-size: var(--bookish-header-1-font-size);
        font-weight: normal;
        font-style: italic;
        margin-top: 0; /* Shouldn't have any space below title */
        margin-bottom: calc(var(--bookish-title-font-size) * 0.5);
        line-height: var(--bookish-header-line-height);
    }

    .bookish-figure-full {
        left: 50%;
        margin-left: -50vw;
        margin-right: -50vw;
        margin-bottom: 3em;
        max-width: 100vw;
        position: relative;
        right: 50%;
        width: 100vw;
    }

    .bookish-figure-full :global(.bookish-figure) {
        /* No margin above full figures, which tend to come first in a page. */
        margin-top: 0;
    }

    .bookish-scroll-reminder {
        position: fixed;
        bottom: 4em;
        left: 50%;
        animation: bookish-bounce 3s infinite;
        animation-timing-function: ease;
        width: 0;
        height: 0;
        margin-left: -1rem;
        border-left: 1rem solid transparent;
        border-right: 1rem solid transparent;
        border-top: 1rem solid white;
        mix-blend-mode: difference;
    }

    @keyframes bookish-bounce {
        0% {
            bottom: 4em;
        }
        50% {
            bottom: 5em;
        }
        100% {
            bottom: 4em;
        }
    }

    .bookish-tag {
        font-size: var(--bookish-small-font-size);
        display: inline-block;
        padding: var(--bookish-inline-padding)
            calc(2 * var(--bookish-inline-padding));
        border-radius: var(--bookish-roundedness);
        background-color: var(--bookish-border-color-light);
        font-weight: bold;
        text-transform: uppercase;
    }
</style>
