<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import Format from '$lib/components/chapter/Format.svelte';
    import { afterUpdate } from 'svelte';
    import { getEdition } from './Contexts';
    import Note from '../editor/Note.svelte';
    import Button from '../app/Button.svelte';
    import { tick } from 'svelte';

    export let editable: boolean;
    export let authors: string[];
    export let inheritedAuthors: string[] | undefined = undefined;
    export let add: () => Promise<void> | void;
    export let edit: (index: number, text: string) => Promise<void> | void;
    export let remove: (index: number) => Promise<void> | void;

    let edition = getEdition();

    let authorList: HTMLDivElement | null = null;

    $: showInherited = authors.length === 0 && inheritedAuthors !== undefined;
    $: authorsToShow = showInherited ? inheritedAuthors : authors;

    async function addAuthor() {
        add();
        await tick();
        if (authors.length > 0 && authorList) {
            const editors = authorList.querySelectorAll('input');
            if (editors.length > 0) {
                const lastAuthor = editors[editors.length - 1];
                if (lastAuthor instanceof HTMLElement) lastAuthor.focus();
            }
        }
    }

    // When there's a new author, focus on it.
    afterUpdate(() => {});
</script>

<p class="bookish-authors" bind:this={authorList}>
    <!-- Editing and inherited authors? Say they're  -->
    {#if authorsToShow === undefined}
        No authors
    {:else}
        <em>by </em>
        {#each authorsToShow as author, index}
            {#if editable && !showInherited}
                <span class="author-editor">
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
                    <Button
                        tooltip="remove this author"
                        command={() => remove(index)}>⨉</Button
                    >
                </span>
            {:else}
                <span
                    ><Format
                        node={Parser.parseFormat($edition, author)}
                    /></span
                >{/if}{#if index < authorsToShow.length - 1},&nbsp{/if}
        {/each}
    {/if}
    {#if editable}
        <Button tooltip="add author" command={addAuthor}>+ author</Button>
        {#if inheritedAuthors !== undefined && authors.length === 0}<Note
                >(showing book authors)&nbsp;</Note
            >{/if}
    {/if}
</p>

<style>
    .bookish-authors {
        font-family: var(--bookish-header-font-family);
        font-style: italic;
        margin: 0;
    }

    .author-editor {
        display: inline-block;
    }
</style>
