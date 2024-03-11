<script lang="ts">
    import Parser from '$lib/models/chapter/Parser';
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import Format from '$lib/components/chapter/Format.svelte';
    import { afterUpdate } from 'svelte';
    import { getEdition, getLeasee, getUser, lease } from './Contexts';
    import Note from '../editor/Note.svelte';
    import Button from '../app/Button.svelte';
    import { tick } from 'svelte';
    import BookishEditor from '../editor/BookishEditor.svelte';
    import { auth } from '$lib/models/Firebase';

    export let editable: boolean;
    export let authors: string[];
    export let inheritedAuthors: string[] | undefined = undefined;
    export let add: () => Promise<void> | void;
    export let edit: (index: number, text: string) => Promise<void> | void;
    export let remove: (index: number) => Promise<void> | void;
    export let editors: boolean = false;

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
</script>

<p class="bookish-authors" bind:this={authorList}>
    <!-- Editing and inherited authors? Say they're  -->
    {#if authorsToShow === undefined}
        No authors
    {:else}
        <em
            >{#if editors}edited by{:else}by{/if}</em
        >
        {#each authorsToShow as author, index}
            {#if editable && !showInherited}
                <span class="author-editor">
                    <!-- We don't do leases on author names since chances of collisions are so low. -->
                    <BookishEditor
                        inline
                        text={author}
                        parser={(text) => Parser.parseFormat($edition, text)}
                        save={(node) => edit(index, node.toBookdown())}
                        chapter={false}
                        component={Format}
                        placeholder="author"
                        leasee={false}
                        lease={() => true}
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
