<script lang="ts">
    import EmbedNode from '$lib/models/chapter/EmbedNode';
    import Parser from "$lib/models/chapter/Parser";
    import Embed from '$lib/components/chapter/Embed.svelte';
    import ErrorMessage from '$lib/components/chapter/ErrorMessage.svelte';
    import BookishEditor from '$lib/components/editor/BookishEditor.svelte';
    import { getContext, onMount } from 'svelte';
    import type Edition from '$lib/models/book/Edition';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import { EDITABLE, EDITION } from './Symbols';
    import type { Writable } from 'svelte/store';
    import type ErrorNode from '../../models/chapter/ErrorNode';

	export let label: string;
	export let header: string;
	export let subtitle: string | undefined = undefined;
	export let print: boolean = false;
	export let tags: string[] | undefined = undefined;
	export let getImage: (() => string | null);
	export let setImage: (embed: string | null) => Promise<void> | undefined;
	export let save: ((text: string) => Promise<void> | undefined) | null = null;

	let title: HTMLHeadingElement | null = null;
	let reminder: HTMLDivElement | null = null;

    let edition = getContext<Writable<Edition>>(EDITION);
    let editable = getContext<boolean>(EDITABLE);

	function updateScrollReminder() {
		if(title && reminder) {
			// If the bottom of the window is below the top of the title, hide the reminder.
			if(window.scrollY + window.innerHeight > title.getBoundingClientRect().top + window.scrollY)
				reminder.classList.add("bookish-past-title");
			else
				reminder.classList.remove("bookish-past-title");
		}
	}

	function addCover() { if(setImage) setImage("|||||") ; }
	function removeCover() { if(setImage) setImage(null); }

    // When the title becomes visible or hidden, update the scroll reminder.
    onMount(() => {
		const intersectionObserver = new IntersectionObserver(() => updateScrollReminder());
		if(title) intersectionObserver.observe(title);
		updateScrollReminder();

        // Stop observing when unmounted.
		return () => { if(title) intersectionObserver.unobserve(title) }
	});

    // Get the embed, update when getImage function prop changes.
    let embedNode: EmbedNode | ErrorNode | undefined = undefined;
	$: {
        let embed = getImage();
        embedNode = embed ? Parser.parseEmbed($edition, embed) : undefined;
    }

</script>

<div class="bookish-chapter-header">
    {#if embedNode }
        <div class="bookish-figure-full">
            {#if edition && editable && embedNode instanceof EmbedNode}
                <BookishEditor 
                    ast={embedNode} 
                    save={node => setImage ? setImage(node.toBookdown()) : undefined }
                    chapter={false}
                    component={Embed}
                    placeholder=""
                />
            {:else if embedNode instanceof EmbedNode }
                <Embed node={embedNode}/>
            {:else}
                <ErrorMessage node={embedNode} />
            {/if}
            {#if !print }<div bind:this={reminder} class="bookish-scroll-reminder"></div>{/if}
        </div>
    {:else}
        <!-- Add a bit of space to account for the lack of an image. -->
        <p>&nbsp;</p>
    {/if}
    <slot name="outline"></slot>
    {#if editable }
        {#if embedNode === undefined }
            <button on:click={addCover}>+ cover image</button> 
        {:else}
            <button on:click={removeCover}>x cover image</button>
        {/if}
    {/if}
    <div class="bookish-chapter-header-text">
        <slot name="before"></slot>
        <h1 bind:this={title} class="bookish-title">
            {#if editable && save }
                <TextEditor 
                    label={label}
                    text={header + (subtitle ? ": " + subtitle : "")}
                    placeholder="Title"
                    valid={text => text.length === 0 ? "Titles have to be at least one character long." : undefined }
                    save={save}
                />
            {:else}
                { header }
                {#if subtitle }<div class="bookish-subtitle">{subtitle}</div>{/if}
            {/if}
        </h1>
        <slot name="after"></slot>
        {#if tags }
            <div>{#each tags as tag}<span class="bookish-tag">{tag}</span>{/each}</div>
        {/if}
    </div>
</div>
