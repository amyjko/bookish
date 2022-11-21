<script lang="ts">
    import Note from "./Note.svelte";

    export let language: string;
    export let edit: (newValue: string) => void

    let value: string = language;
    const languages = [ "html", "css", "javascript", "python" ];

</script>

<select bind:value={value} on:change={() => edit(value)}>
    {#each languages as lang}<option value={lang.toLocaleLowerCase()}>{lang}</option>{/each}
</select>
<Note>Choose a programming language to enable syntax highlighting.</Note>