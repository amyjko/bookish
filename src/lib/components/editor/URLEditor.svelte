<script lang="ts">
    import TextEditor from './TextEditor.svelte';
    import Link from '../app/Link.svelte';

    export let url: string;
    export let validator: (text: string) => undefined | string;
    export let edit: (newURL: string) => string | undefined;
</script>

<TextEditor
    placeholder="url"
    text={url}
    label="URL editor"
    valid={(url) => validator(url)}
    width={20}
    clip
    save={(url) => edit(url)}
/>
{#if url.startsWith('http')}
    <Link to={url}>↗</Link>
{/if}
