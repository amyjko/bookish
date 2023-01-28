<script lang="ts">
    import { createUser, getUserEmails } from '../../models/CRUD';
    import Button from '../app/Button.svelte';
    import TextInput from '../app/TextInput.svelte';
    import Note from './Note.svelte';

    export let uids: string[];
    export let inheriteduids: string[];
    export let writable: boolean;
    export let atleastone: boolean;
    export let change: (uids: string[]) => void;

    let emails: Map<string, string> | null = null;

    $: alluids = Array.from(new Set([...uids, ...inheriteduids]));

    async function getEmails(userIDs: string[]) {
        emails = await getUserEmails(userIDs);
    }
    $: {
        if (
            emails === null ||
            (emails.size > 0 &&
                Array.from(emails.keys()).join() !== alluids.join())
        )
            getEmails(alluids);
    }

    let newEditor: string = '';
    let newEditorError: string | null = null;

    let loading: string | undefined = undefined;

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
</script>

{#if emails === null}
    Loading editors...
{:else}
    <section class="emails">
        {#if writable}
            <form on:submit|preventDefault={addEditor}>
                <TextInput
                    type="email"
                    placeholder="email"
                    bind:text={newEditor}
                    disabled={false}
                />
                <Button
                    tooltip="give {newEditor} editing rights"
                    disabled={newEditor.length === 0 ||
                        Array.from(emails.values()).includes(newEditor)}
                    command={addEditor}>+ editor</Button
                >
                {#if newEditorError !== null}{newEditorError}{/if}
            </form>
        {/if}

        {#each uids as uid, index (uid)}
            {@const email = emails.get(uid)}
            <p>
                {email}
                {#if writable}
                    <Button
                        tooltip="remove {email} editing rights"
                        command={() =>
                            change([
                                ...uids.slice(0, index),
                                ...uids.slice(index + 1),
                            ])}
                        disabled={atleastone && uids.length <= 1}>x</Button
                    >
                {/if}
            </p>
        {/each}
        {#each inheriteduids as uid}
            <p><em>{emails.get(uid)}</em> <Note>book editor</Note></p>
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
