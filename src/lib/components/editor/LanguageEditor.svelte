<script lang="ts">
    import type CaretContext from "$lib/components/editor/CaretContext";
    import { getContext } from "svelte";
    import { CARET } from "../page/Symbols";

    export let language: string;
    export let edit: (newValue: string) => void

    let value: string = language;
    let caret = getContext<CaretContext>(CARET);
    const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];
</script>

<select bind:value={value} on:change={() => edit(value)}>
    {#each languages as lang}<option value={lang.toLocaleLowerCase()}>{lang}</option>{/each}
</select>
<span class="bookish-editor-note">Choose a programming language to enable syntax highlighting.</span>