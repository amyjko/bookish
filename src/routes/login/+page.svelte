<script lang="ts">
    import { getAuth } from '$lib/components/page/Contexts';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import TextInput from '$lib/components/app/TextInput.svelte';
    import Button from '$lib/components/app/Button.svelte';

    let user = getAuth();

    let email: string = '';
    let loading = false;
    let feedback = '';
    let error = '';

    async function handleSubmit() {
        // Enter loading state, try to login and wait for it to complete, and then leave loading state.
        try {
            // Give some feedback when loading.
            loading = true;
            await $user.login(email);
            feedback = 'Check your email for a login link.';
        } catch (err) {
            error = "Couldn't connect to the server.";
        } finally {
            loading = false;
        }
    }
</script>

<Lead><Large>Login</Large> to write.</Lead>

<Paragraph>
    We'll send you an email each time to login, no password required.
</Paragraph>

<form on:submit|preventDefault={handleSubmit}>
    <TextInput
        bind:text={email}
        autocomplete="username"
        type="email"
        placeholder="email"
        disabled={loading}
    />
    <Button
        tooltip="Login with your email"
        command={handleSubmit}
        type="submit"
        disabled={loading || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)}
    >
        Login
    </Button>
</form>

{#if feedback}
    <Feedback>{feedback}</Feedback>
{/if}
{#if error}
    <Feedback error>{error}</Feedback>
{/if}
