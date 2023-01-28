<script lang="ts">
    import { updateEmail } from 'firebase/auth';
    import { getAuth } from '../../lib/components/page/Contexts';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Button from '../../lib/components/app/Button.svelte';
    import Lead from '../../lib/components/app/Lead.svelte';
    import Large from '../../lib/components/app/Large.svelte';
    import Paragraph from '../../lib/components/app/Paragraph.svelte';
    import TextInput from '../../lib/components/app/TextInput.svelte';
    import { goto } from '$app/navigation';

    let email: string;
    let auth = getAuth();

    let loading = false;
    let feedback = '';
    let error = '';
    let changed = false;

    const errors: Record<string, string> = {
        'auth/invalid-mail': "This wasn't a valid email.",
        'auth/email-already-in-use':
            'This email is already associated with an account.',
        'auto/requires-recent-login':
            "You haven't logged in recently enough. Log out, log in again, then try again.",
    };

    async function handleSubmit() {
        if ($auth === undefined) return;

        // Enter loading state, try to login and wait for it to complete, and then leave loading state.
        if ($auth.user !== null && email) {
            // Give some feedback when loading.
            loading = true;
            const previousEmail = $auth.user.email;
            feedback = `Sending email update confirmation to ${previousEmail}...`;
            updateEmail($auth.user, email)
                .then(() => {
                    feedback = `Check your original email address, ${previousEmail}, for a confirmation link.`;
                    changed = true;
                })
                .catch((error: any) => {
                    if (typeof error.code === 'string')
                        error =
                            errors[error.code] ??
                            "Couldn't update email for an unknown reason.";
                })
                .finally(() => {
                    loading = false;
                });
        }
    }

    // Ask the auth context to logout, and provided an error if it fails.
    function handleLogout() {
        $auth?.logout();
        goto('/login');
    }
</script>

<Lead><Large>You</Large>.</Lead>

<Paragraph>
    To change your login email, type your new email address below.
</Paragraph>

<Paragraph>
    <form on:submit|preventDefault={handleSubmit}>
        <TextInput
            autocomplete="username"
            type="email"
            placeholder="email"
            bind:text={email}
            disabled={loading}
        />
        <Button
            tooltip="submit new email address"
            command={handleSubmit}
            type="submit"
            disabled={loading ||
                email == undefined ||
                email.length === 0 ||
                changed}>update email</Button
        >
    </form>
</Paragraph>

<Paragraph>
    Or, <Button tooltip="logout of your account" command={handleLogout}
        >logout</Button
    >
</Paragraph>

{#if feedback}
    <Feedback>{feedback}</Feedback>
{/if}
{#if error}
    <Feedback error>{error}</Feedback>
{/if}
