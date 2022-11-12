<script lang="ts">
    import type Theme from "$lib/models/book/Theme";
    import ChapterBody from "$lib/components/chapter/ChapterBody.svelte";
    import Parser from "$lib/models/chapter/Parser";
    import { getDarkMode } from "./Contexts";

    export let theme: Theme;

    let darkMode = getDarkMode();

	$: preview = Parser.parseChapter(undefined, `
		# Header 1
		## Header 2
		### Header 3
		
		This is how a sentence with _various_ *formatting* ^will^ look.

		* How does it look?
		* Would you change anything?	
	`);

</script>

<div class="bookish-theme-preview" style={`background-color: ${$darkMode ? theme.dark.backgroundColor : theme.light.backgroundColor };`}>
    <ChapterBody node={preview}/>
</div>

<style>
	.bookish-theme-preview {
		padding: 1em;
		border: var(--bookish-app-chrome-border-width) solid black;
		transform: translate(-25%, -25%) scale(0.5);
		position: sticky;
		margin-top: 2em;
		top: 2em;
		z-index: 3;
	}

	:global(.bookish-dark .bookish-theme-preview) {
		border-color: white;
	}

</style>