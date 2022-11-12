<script lang="ts">
    import Note from "./Note.svelte";

    export let language: string;
    export let edit: (newValue: string) => void

    let value: string = language;
    const languages = [ "C", "C++", "CSS", "Go", "HTML", "Java", "JavaScript", "Markdown", "Plaintext", "Python", "TypeScript" ];

</script>

<select bind:value={value} on:change={() => edit(value)}>
    {#each languages as lang}<option value={lang.toLocaleLowerCase()}>{lang}</option>{/each}
</select>
<Note>Choose a programming language to enable syntax highlighting.</Note>