<script lang="ts">
    import TextEditor from './TextEditor.svelte';
    import Link from '../app/Link.svelte';

    interface Props {
        url: string;
        validator: (text: string) => undefined | string;
        edit: (newURL: string) => string | undefined;
    }

    let { url, validator, edit }: Props = $props();
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
