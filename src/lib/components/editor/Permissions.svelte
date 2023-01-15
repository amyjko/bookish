<script lang="ts">
    import { createUser, getUserEmails } from '../../models/CRUD';
    import Button from '../app/Button.svelte';
    import TextInput from '../app/TextInput.svelte';
    import Note from './Note.svelte';

    export let uids: string[];
    export let writable: boolean;
    export let emptyMessage: string;
    export let change: (uids: string[]) => void;

    let emails: Record<string, string> | null = null;

    async function getEmails() {
        emails = await getUserEmails(uids);
    }
    $: if (uids) getEmails();

    let newEditor: string = '';
    let newEditorError: string | null = null;

    async function addEditor() {
        const uid = await createUser(newEditor);
        if (uid === null) newEditorError = "couldn't add editor";
        else change([...uids, uid]);
    }
</script>

{#if emails === null}
    Loading editors...
{:else}
    <section class="emails">
        {#if writable}
            <p
                ><TextInput
                    type="email"
                    placeholder="email"
                    bind:text={newEditor}
                    disabled={false}
                />
                <Button
                    tooltip="Give email editing rights"
                    disabled={newEditor.length === 0 ||
                        Object.values(emails).includes(newEditor)}
                    command={addEditor}>+ editor</Button
                >
                {#if newEditorError !== null}{newEditorError}{/if}
            </p>
        {/if}

        {#each Object.entries(emails) as [uid, email], index (uid)}
            <p>
                {#if writable}
                    <Button
                        tooltip="Remove email's editing rights"
                        command={() =>
                            change([
                                ...uids.slice(0, index),
                                ...uids.slice(index + 1),
                            ])}
                        disabled={uids.length <= 1}>x</Button
                    >
                {/if}
                {email}
            </p>
        {:else}
            <Note>{emptyMessage}</Note>
        {/each}
    </section>
{/if}

<style>
    p {
        font-family: var(--app-font);
    }
</style>
