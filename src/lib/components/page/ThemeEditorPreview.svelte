<script lang="ts">
    import type Theme from '$lib/models/book/Theme';
    import ChapterBody from '$lib/components/chapter/ChapterBody.svelte';
    import Parser from '$lib/models/chapter/Parser';
    import { getDarkMode } from './Contexts';

    export let theme: Theme | null;

    let position: number;

    let darkMode = getDarkMode();
    $: backgroundColor =
        theme === null
            ? null
            : $darkMode
            ? theme.dark?.backgroundColor
            : theme.light?.backgroundColor;

    $: preview = Parser.parseChapter(
        undefined,
        `# Header 1
		## Header 2
		### Header 3
		
		This is how a sentence with _various_ *formatting* ^will^ look.

		* How does it look?
		* Would you change anything?
	`
    );
</script>

<aside
    class={`preview ${position > window.innerHeight / 2 ? 'small' : ''}`}
    style={`${backgroundColor ? `background-color: ${backgroundColor};` : ''}`}
>
    <ChapterBody node={preview} />
</aside>

<svelte:window bind:scrollY={position} />

<style>
    .preview {
        padding: 1em;
        border: var(--app-chrome-border-size) solid black;
        position: sticky;
        margin-top: var(--app-text-spacing);
        margin-bottom: var(--app-text-spacing);
        top: 2em;
        z-index: 3;
        transition: transform 0.5s;
    }

    .preview.small {
        transform: scale(0.5);
        transform-origin: left top;
    }
</style>
