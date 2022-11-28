<script lang="ts">
    import Options from "../app/Options.svelte";
    import Note from "./Note.svelte";

    export let language: string;
    export let edit: (newValue: string) => void

    let value: string = language;
    const languages = [ "", "html", "css", "javascript", "python" ];

</script>

<Options options={languages.map(lang => [ lang === "" ? "plaintext" : lang, lang ])} value={language} changed={() => edit(value) }/>
<Note>Choose a programming language to enable syntax highlighting.</Note>