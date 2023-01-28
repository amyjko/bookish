<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import Format from '$lib/components/chapter/Format.svelte';
    import { afterUpdate } from 'svelte';
    import { getEdition, isBookEditable, isEditionEditable } from './Contexts';
    import Note from '../editor/Note.svelte';
    import Button from '../app/Button.svelte';

    export let editable: boolean;
    export let authors: string[];
    export let inheritedAuthors: string[] | undefined = undefined;
    export let add: () => Promise<void> | void;
    export let edit: (index: number, text: string) => Promise<void> | void;
    export let remove: (index: number) => Promise<void> | void;

    let edition = getEdition();

    let authorList: HTMLDivElement | null = null;
    let newAuthor = false;

    function addAuthor() {
        add();
        newAuthor = true;
    }

    // When there's a new author, focus on it.
    afterUpdate(() => {
        if (authors.length > 0 && authorList && newAuthor) {
            const editors = authorList.querySelectorAll('input');
            if (editors.length > 0) {
                const lastAuthor = editors[editors.length - 1];
                if (lastAuthor instanceof HTMLElement) {
                    lastAuthor.focus();
                }
            }
            newAuthor = false;
        }
    });
</script>

<p class="bookish-authors" bind:this={authorList}>
    {#if authors.length === 0}
        {#if editable && inheritedAuthors !== undefined && inheritedAuthors.length > 0}
            <Note>&nbsp;(book authors)&nbsp;</Note>
        {:else}
            No authors
        {/if}
    {:else}
        <em>by </em>
        {#each authors as author, index}
            {#if editable}
                <TextEditor
                    text={author}
                    label={'Author name editor'}
                    placeholder="author"
                    valid={() => undefined}
                    save={(text) =>
                        /* If text is already empty, remove */ author.length >
                            0 && text === ''
                            ? remove(index)
                            : edit(index, text)}
                />
            {:else}
                <span
                    ><Format
                        node={Parser.parseFormat($edition, author)}
                    /></span
                >
            {/if}
            {#if index < authors.length - 1},&nbsp{/if}
        {/each}
    {/if}
    {#if editable}
        &nbsp;<Button tooltip="add author" command={addAuthor}>+ author</Button>
    {/if}
</p>

<style>
    .bookish-authors {
        font-family: var(--bookish-header-font-family);
        font-style: italic;
        margin: 0;
    }
</style>
