<script lang="ts">
    import Options from '../app/Options.svelte';
    import Note from './Note.svelte';

    export let language: string;
    export let edit: (newValue: string) => void;

    const languages = ['', 'html', 'css', 'javascript', 'python'];
</script>

<Options
    options={languages.map((lang) => [lang === '' ? 'plaintext' : lang, lang])}
    value={language}
    changed={(lang) => edit(lang)}
/>
<Note>Choose a programming language to enable syntax highlighting.</Note>
