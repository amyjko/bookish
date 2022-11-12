<script lang="ts">
    import type EmbedNode from "$lib/models/chapter/EmbedNode";
    import renderPosition from './renderPosition';
    import { storage } from '$lib/models/Firebase';
    import Format from './Format.svelte';
    import { getContext } from "svelte";
    import type Edition from "$lib/models/book/Edition";
    import { EDITABLE, EDITION, getCaret } from "../page/Contexts";
    import type { Writable } from "svelte/store";

    export let node: EmbedNode;
    export let placeholder: string | undefined = undefined;

    $: url = node.getURL();
	$: position = node.getPosition();
	$: description = node.getDescription();
	$: credit = node.getCredit();
	$: caption = node.getCaption();

    let caret = getCaret();
    let editable = getContext<boolean>(EDITABLE);
    let edition = getContext<Writable<Edition>>(EDITION);

	let dragging = false;
	let dragFeedback: undefined | string = undefined;
	let imageError = false;

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if(event.dataTransfer?.items) {
			// Get the files and convert them to file opens, then filter by allowed file extensions
			const imageFiles = [...event.dataTransfer.items]
				.filter(item => item.kind === 'file')
				.map(item => item.getAsFile())
				.filter(file => file !== null && /.*\.(jpg|jpeg|png)/i.test(file.name));
			if(imageFiles.length === 0)
				dragFeedback = "Only JPEG or PNG images are allowed.";
			else if(imageFiles.length > 1)
				dragFeedback = "Only one image at a time please!";
			else {
				dragFeedback = "Uploading…";

				const file = imageFiles[0];
				const media = $edition.getBook()?.getMedia();

				if(file === null) return;
				if(storage === undefined) return;
				if(media === undefined) return;
		
				media.upload(file, 
					(progress: number) => dragFeedback = `${progress}% done`,
					(error: string) => { dragFeedback = error; dragging = false; },
					(url: string, thumbnails: string) => {
						// Upload completed successfully, now we can get the download URL
						$caret?.edit(node, node.withURLs(url, thumbnails).withDescription(""));
						dragging = false;
						dragFeedback = undefined;
					}
				);				
			}

		}
	}

	function handleDrag(event: DragEvent) { 
		event?.preventDefault(); 
		dragging = true;
		dragFeedback = "Drop to upload…";
	}

	function handleDragLeave(event: DragEvent) { 
		if(event.target !== event.currentTarget) return;
		event?.preventDefault(); 
		dragging = false;
		dragFeedback = undefined;
	}

	function handleLoad() {
		imageError = false;
	}

	function handleError() {
		imageError = true;
	}

</script>

<div class={"bookish-figure " + renderPosition(position)} data-nodeid={node.nodeID}>
    {#if url.trim().length === 0 }
        {#if editable }
            <div 
                class={`bookish-figure-unspecified ${dragging ? "bookish-figure-dragging" : ""}`}
                on:drop|preventDefault={handleDrop}
                on:dragover={handleDrag}
                on:dragleave={handleDragLeave}
            >{
                dragFeedback !== undefined ? dragFeedback :
                placeholder !== undefined ? placeholder :
                    "Click or drag to choose or upload an image, or enter an image or video URL."
            }
            </div>
        {:else}
            <div class="bookish-figure-unspecified">No image or video specified</div>
        {/if}
    {:else}
        {#if url.includes("https://www.youtube.com") || 
            url.includes("https://youtu.be") || 
            url.includes("https://www.tiktok.com") || 
            url.includes("vimeo.com") }
            <div class="bookish-figure-embed">
                <iframe 
                    class="bookish-figure-frame"
                    title="Embedded video content from streaming service"
                    src={url} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen>
                </iframe>
            </div>
        {:else}
            <img 
                class={"bookish-figure-image"}
                src={url.startsWith("http") ? url : "images/" + url}
                srcset={node.hasSmallURL() ? `${node.getSmallURL()} 320w, ${url} 1024w` : undefined }
                sizes={node.hasSmallURL() ? "(min-width: 1024px) 1024px, 320px" : undefined }
                alt={description}
                on:load={handleLoad}
                on:error={handleError}
            />
        {/if}
    {/if}
    <div class="bookish-figure-caption">
        <div class="bookish-figure-credit">
            <Format node={credit} placeholder="credit" />
        </div>
        <Format node={caption} placeholder="caption" />
    </div>
    {#if imageError }
        <div class="bookish-figure-unspecified">{ editable ? "Unable to load image. Is the URL correct? Are you offline?" : "Unable to load image" }</div>
    {/if}
</div>