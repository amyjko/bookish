<script lang="ts">
    import PositionEditor from './PositionEditor.svelte';
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import TextEditor from './TextEditor.svelte';
    import { storage } from '$lib/models/Firebase';
    import type { Image } from '$lib/models/book/BookMedia';
    import { BOOK, CARET, EDITION } from '../page/Symbols';
    import ToolbarSpacer from './ToolbarSpacer.svelte';
    import ImageChooser from './ImageChooser.svelte';
    import URLEditor from './URLEditor.svelte';
    import { getContext } from 'svelte';
    import type Book from '$lib/models/book/Book';
    import type CaretContext from './CaretContext';
    import type Edition from '$lib/models/book/Edition';

    export let embed: EmbedNode;

    let book = getContext<Book>(BOOK);
    let caret = getContext<CaretContext>(CARET);
    let edition = getContext<Edition>(EDITION);
    let upload: undefined|number|string = undefined;

    $: description = embed.getDescription();
    $: book.getMedia();

    function isValidURL(url: string): string | undefined {
        // Is it a valid URL?
        try {
            let test = new URL(url);
            if(test.protocol === "http:" || test.protocol === "https:")
                return;
        } catch (_) {}
        return "URL doesn't seem valid";
    }

    function handleImageChange(event: Event) {

        const target = event.target as HTMLInputElement;
        const file = target.files === null ? undefined : target.files[0];
        const media = edition?.getBook()?.getMedia();

        if(file === undefined) return;
        if(storage === undefined) return;
        if(media === undefined) return;

        media.upload(file, 
            (progress: number) => upload = `${progress}% done`,
            (error: string) => upload = error,
            (url: string, thumbnail: string) => {
                // Upload completed successfully, now we can get the download URL
                caret?.edit(embed, embed.withURLs(url, thumbnail).withDescription(""));
                upload = undefined;
            }
        );
    }

    function handleImageSelection(image: Image) {
        // Toggle the embed
        caret?.edit(embed, 
            embed.getURL() === image.url ?
                embed.withURL("").withDescription("") :
                embed.withURL(image.url)
        );
    }

</script>

{#if caret?.root instanceof EmbedNode}
    <ToolbarSpacer/>
{:else}
    Position <PositionEditor value={embed.getPosition()} edit={position => caret?.edit(embed, embed.withPosition(position)) } />
{/if}
<label class="bookish-file-upload">
    <input type="file" on:input={handleImageChange} accept=".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"/>
    Upload
</label>
<ToolbarSpacer/>
<code>
    {#if !embed.isHosted() }
        <URLEditor 
            url={embed.getURL()} 
            validator={isValidURL}
            edit={url => {
                const revisedEmbed = embed.withURL(url);
                const revisedURL = revisedEmbed.getURL();
                caret?.edit(embed, revisedEmbed);
                return revisedURL;
            }}
        />
    {/if}
</code>
<ToolbarSpacer/>
<code>
    <TextEditor
        text={description} 
        label={'Image description'} 
        placeholder={'description'} 
        valid={ alt => alt.length === 0 ? "Image description required" : undefined }
        save={ alt => { caret?.edit(embed, embed.withDescription(alt)); } }
        width={20}
        clip={true}
    />
</code>
<ToolbarSpacer/>
{upload}
<ImageChooser select={handleImageSelection} selection={embed.getURL()} />