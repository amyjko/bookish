<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import Embed from '$lib/components/chapter/Embed.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import Title from './Title.svelte';
    import { onMount } from 'svelte';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import { getUser, getEdition, getLeasee, lease } from './Contexts';
    import Button from '../app/Button.svelte';
    import ConfirmButton from '../editor/ConfirmButton.svelte';

    
    
    interface Props {
        /** True if an author should be able to edit this header. */
        editable: boolean;
        label: string;
        header: string;
        id: string;
        subtitle?: string | undefined;
        print?: boolean;
        tags?: string[] | undefined;
        getImage?: undefined | (() => string | null);
        setImage?: 
        | undefined
        | ((embed: string | null) => Promise<void> | void);
        /** For saving the revised chapter title*/
        save?: ((text: string) => Promise<void> | void) | null;
        outline?: import('svelte').Snippet;
        before?: import('svelte').Snippet;
        after?: import('svelte').Snippet;
    }

    let {
        editable,
        label,
        header,
        id,
        subtitle = undefined,
        print = false,
        tags = undefined,
        getImage = undefined,
        setImage = undefined,
        save = null,
        outline,
        before,
        after
    }: Props = $props();

    let title: HTMLHeadingElement | null = $state(null);
    let showReminder: boolean = $state(true);

    let auth = getUser();
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
            updateScrollReminder(),
        );
        if (title) intersectionObserver.observe(title);
        updateScrollReminder();

        // Stop observing when unmounted.
        return () => {
            if (title) intersectionObserver.unobserve(title);
        };
    });

    // Get the embed, update when getImage function prop changes.
    let embed: string | null = $derived(getImage ? getImage() : null);
    
</script>

<!-- We key on the chapter ID to avoid laggy updates from image loading -->
{#key id}
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
                        lease={(lock) =>
                            lease(auth, edition, `embed-${id}`, lock)}
                    />
                {:else}
                    <Embed
                        node={Parser.parseEmbed($edition, embed)}
                        editable={false}
                    />
                {/if}
                {#if !print && showReminder}
                    <div class="bookish-scroll-reminder"></div>
                {/if}
            </div>
        {:else}
            <!-- Add a bit of space to account for the lack of an image. -->
            <p>&nbsp;</p>
        {/if}
        {#if !print}
            {@render outline?.()}
        {/if}
        {#if editable && getImage && setImage}
            {#if embed === null}
                <Button tooltip="add cover image" command={addCover}
                    >+ cover image</Button
                >
            {:else}
                <ConfirmButton
                    confirm="delete image"
                    tooltip="delete cover image"
                    command={removeCover}>- cover image</ConfirmButton
                >
            {/if}
        {/if}
        <div bind:this={title} class="bookish-chapter-header-text">
            {@render before?.()}
            <Title>
                {#if editable && save}
                    <TextEditor
                        {label}
                        text={header + (subtitle ? ': ' + subtitle : '')}
                        placeholder="title"
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
            {@render after?.()}
            {#if tags}
                <div
                    >{#each tags as tag}<span class="bookish-tag">{tag}</span
                        >{/each}</div
                >
            {/if}
        </div>
    </header>
{/key}

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
