<script lang="ts">
    import type { TOCHeaderKey } from '$lib/models/book/ChapterID';
    import TextEditor from '../editor/TextEditor.svelte';
    import { getEdition, isEditionEditable } from './Contexts';
    import PageHeader from './PageHeader.svelte';

    export let id: TOCHeaderKey;
    /** ARIA label */
    export let label: string;

    let edition = getEdition();
    let editable = isEditionEditable();
</script>

<PageHeader {id}>
    {#if $edition}
        {#if editable}
            <TextEditor
                text={$edition.getHeader(id)}
                placeholder="header"
                {label}
                valid={() => undefined}
                save={(text) => edition.set($edition.withHeader(id, text))}
            />
        {:else}
            {$edition.getHeader(id)}
        {/if}
    {/if}
</PageHeader>
