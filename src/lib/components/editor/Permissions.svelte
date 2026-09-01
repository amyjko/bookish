<script lang="ts">
    import { createUser } from '../../models/CRUD';
    import Button from '../app/Button.svelte';
    import TextInput from '../app/TextInput.svelte';
    import { getEditors } from '../page/Contexts';
    import Note from './Note.svelte';

    interface Props {
        uids: string[];
        inheriteduids: string[];
        writable: boolean;
        atleastone: boolean;
        change: (uids: string[]) => void;
    }

    let {
        uids,
        inheriteduids,
        writable,
        atleastone,
        change
    }: Props = $props();

    let emails = getEditors();

    let newEditor: string = $state('');
    let newEditorError: string | null = $state(null);

    let loading: string | undefined = $state(undefined);

    async function addEditor() {
        const email = newEditor;
        newEditor = '';
        loading = email;
        try {
            const uid = await createUser(email);
            if (uid === null) newEditorError = "couldn't add editor";
            else change([...uids, uid]);
        } finally {
            loading = undefined;
        }
    }

    function hasEditor(email: string): boolean {
        if (email.length === 0) return false;
        const match = Array.from($emails.entries()).find(
            ([, e]) => e === email,
        );
        if (match === undefined) return false;
        const uid = match[0];
        return uids.includes(uid) || inheriteduids.includes(uid);
    }
</script>

{#if emails === null}
    Loading editors...
{:else}
    <section class="emails">
        {#if writable}
            <form onsubmit={(event) => {
                    event.preventDefault();
                    addEditor();
                }}>
                <TextInput
                    type="email"
                    placeholder="email"
                    bind:text={newEditor}
                    disabled={false}
                />
                <Button
                    tooltip="give {newEditor} editing rights"
                    disabled={newEditor.length === 0 || hasEditor(newEditor)}
                    command={addEditor}>+ editor</Button
                >
                {#if hasEditor(newEditor)}<Note>already added</Note>{/if}
                {#if newEditorError !== null}{newEditorError}{/if}
            </form>
        {/if}

        {#key $emails}
            {#each uids as uid, index (uid)}
                {@const email = $emails.get(uid)}
                <p>
                    {#if email}{email}{:else}<em>loading...</em>{/if}
                    {#if writable}
                        <Button
                            tooltip="remove {email} editing rights"
                            command={() =>
                                change([
                                    ...uids.slice(0, index),
                                    ...uids.slice(index + 1),
                                ])}
                            disabled={atleastone && uids.length <= 1}>⨉</Button
                        >
                    {/if}
                </p>
            {/each}
        {/key}
        {#each inheriteduids as uid}
            <p><em>{$emails.get(uid)}</em> <Note>book editor</Note></p>
        {/each}
        {#if loading}
            <p>
                adding {loading}
            </p>
        {/if}
    </section>
{/if}

<style>
    p {
        font-family: var(--app-font);
    }
</style>
