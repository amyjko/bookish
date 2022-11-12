<script lang="ts">
    import { getContext } from "svelte";
    import type Theme from "$lib/models/book/Theme";
    import ChapterBody from "$lib/components/chapter/ChapterBody.svelte";
    import Parser from "$lib/models/chapter/Parser";
    import { DARK_MODE } from "./Symbols";

    export let theme: Theme;

    let darkMode = getContext<boolean>(DARK_MODE);

	const preview = Parser.parseChapter(undefined, `
		# Header 1
		## Header 2
		### Header 3
		
		This is how a sentence with _various_ *formatting* ^will^ look.

		* How does it look?
		* Would you change anything?	
	`);

</script>

<div class="bookish-theme-preview" style={`background-color: ${darkMode ? theme.dark.backgroundColor : theme.light.backgroundColor };`}>
    <ChapterBody node={preview}/>
</div>