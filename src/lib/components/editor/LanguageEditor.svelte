<script lang="ts">
    import Options from '../app/Options.svelte';
    import Note from './Note.svelte';

    interface Props {
        language: string;
        edit: (newValue: string) => void;
    }

    let { language, edit }: Props = $props();

    const languages = ['', 'html', 'css', 'javascript', 'python', 'java'];
</script>

<Options
    options={languages.map((lang) => [lang === '' ? 'plaintext' : lang, lang])}
    value={language}
    changed={(lang) => edit(lang)}
    label="choose language"
/>
<Note>Choose a programming language to enable syntax highlighting.</Note>
