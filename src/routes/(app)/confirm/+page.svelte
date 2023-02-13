<script lang="ts">
    import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
    import { onMount } from 'svelte';
    import { auth } from '$lib/models/Firebase';
    import Link from '$lib/components/Link.svelte';
    import { goto } from '$app/navigation';
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Large from '$lib/components/app/Large.svelte';

    let error: string | undefined = undefined;

    const messages: Record<string, string> = {
        'auth/id-token-expired': 'This link expired.',
        'auth/id-token-revoked': "This link isn't valid anymore.",
        'auth/insufficient-permission':
            "This email doesn't have permission to create an account.",
        'auth/internal-error': "There's a problem at Google.",
        'auth/invalid-argument': "This link isn't valid.",
        'auth/invalid-email': "This wasn't a valid email.",
    };

    onMount(() => {
        if (auth && isSignInWithEmailLink(auth, window.location.href)) {
            // If this is on the same device and browser, then the email should be in local storage.
            let email = window.localStorage.getItem('email');

            // If not, ask the user to confirm it.
            if (!email)
                email = window.prompt(
                    'It appears you opened your login link on a different device or browser. Can you confirm your email?'
                );

            // If there's an email, try signing in.
            if (email)
                signInWithEmailLink(auth, email, window.location.href)
                    .then(() => {
                        // Clear email from storage now that the user is logged in.
                        window.localStorage.removeItem('email');

                        // Navigate to the home page.
                        goto('/write');
                    })
                    .catch((err: { code: string }) => {
                        error =
                            messages[err.code] ??
                            'There was a problem logging you in.';
                    });
            // Otherwise, give some feedback.
            else error = "Can't log in without an email address.";
        }
        // GIve some feedback if the email link isn't valid.
        else error = "This isn't a valid login link.";
    });
</script>

<Lead><Large>Logging</Large> in…</Lead>
{#if error}
    <Feedback error>{error} <Link to="/login">Try again?</Link></Feedback>
{:else}
    <Feedback>Redirecting...</Feedback>
{/if}
