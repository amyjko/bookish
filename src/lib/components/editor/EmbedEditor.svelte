<script lang="ts">
    import PositionEditor from './PositionEditor.svelte';
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import TextEditor from './TextEditor.svelte';
    import { storage } from '$lib/models/Firebase';
    import type { Image } from '$lib/models/book/BookMedia';
    import ToolbarSpacer from './ToolbarSpacer.svelte';
    import ImageChooser from './ImageChooser.svelte';
    import URLEditor from './URLEditor.svelte';
    import Note from './Note.svelte';
    import { getBook, getCaret } from '$lib/components/page/Contexts';

    export let embed: EmbedNode;

    let caret = getCaret();
    let upload: undefined | number | string = undefined;

    $: description = embed.getDescription();
    let book = getBook();

    function isValidURL(url: string): string | undefined {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if (test.protocol === 'http:' || test.protocol === 'https:') return;
        } catch (_) {}
        return "URL doesn't seem valid";
    }

    function handleImageChange(event: Event) {
        if ($book === undefined) return;
        if ($caret === undefined) return;

        const target = event.target as HTMLInputElement;
        const file = target.files === null ? undefined : target.files[0];
        const media = $book.getMedia();

        if (file === undefined) return;
        if (storage === undefined) return;
        if (media === undefined) return;

        media.upload(
            file,
            (progress: number) => (upload = `${progress}% done`),
            (error: string) => (upload = error),
            (url: string, thumbnail: string) => {
                // Upload completed successfully, update the front end.
                // Preserve the description, in case it's an image revision, to avoid data loss.
                $caret?.edit(embed, embed.withURLs(url, thumbnail));
                upload = undefined;
            },
        );
    }

    function handleImageSelection(image: Image) {
        $caret?.edit(
            embed,
            embed.getURL() === image.url
                ? // Toggle the embed if choosing the same image
                  embed.withURL('').withDescription('')
                : embed.withURLs(image.url, image.thumb),
        );
    }
</script>

{#if $caret?.root instanceof EmbedNode}
    <ToolbarSpacer />
{:else}
    Position <PositionEditor
        value={embed.getPosition()}
        edit={(position) => $caret?.edit(embed, embed.withPosition(position))}
    />
{/if}
<label class="file-upload" tabIndex="0">
    <input
        type="file"
        on:input={handleImageChange}
        accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
    />
    Upload
</label>
<ToolbarSpacer />
{#if !embed.isHosted()}
    <URLEditor
        url={embed.getURL()}
        validator={isValidURL}
        edit={(url) => {
            const revisedEmbed = embed.withURL(url);
            const revisedURL = revisedEmbed.getURL();
            $caret?.edit(embed, revisedEmbed);
            return revisedURL;
        }}
    />
{:else}
    <Note>(Hosted)</Note>
{/if}
<ToolbarSpacer />
<TextEditor
    text={description}
    label={'Image description'}
    placeholder={'description'}
    valid={(alt) =>
        alt.length === 0 ? 'Image description required' : undefined}
    save={(alt) => {
        $caret?.edit(embed, embed.withDescription(alt));
    }}
    width={20}
    clip={true}
/>
<ToolbarSpacer />
{#if upload}
    {upload}
{/if}
<ImageChooser select={handleImageSelection} selection={embed.getURL()} />

<style>
    .file-upload {
        background-color: var(--app-chrome-background);
        padding-left: var(--app-chrome-padding);
        padding-right: var(--app-chrome-padding);
        padding-top: calc(var(--app-chrome-padding) / 2);
        padding-bottom: calc(var(--app-chrome-padding) / 2);
        border-radius: var(--app-chrome-roundedness);
        border: none;
    }

    .file-upload:hover {
        background-color: var(--app-interactive-color);
        color: var(--app-font-color-inverted);
        cursor: pointer;
    }

    .file-upload input:disabled {
        opacity: 0.3;
        cursor: auto;
    }

    .file-upload {
        font-family: var(--bookish-app-font);
        font-size: var(--app-chrome-font-size);
    }

    .file-upload input[type='file'] {
        display: none;
    }

    .file-upload:focus-within {
        position: relative;
        z-index: 2;
        outline: var(--app-chrome-border-size) solid
            var(--app-interactive-color);
    }
</style>
