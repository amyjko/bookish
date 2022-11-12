<script lang="ts">

    import { sendSignInLinkToEmail, type User } from "firebase/auth";
    import { onMount, setContext } from "svelte";
    import { writable, type Writable } from "svelte/store";
    import { auth } from "../models/Firebase";
    import type Authentication from "./Authentication";

    // Track the user and user loading status in state
    let loading = true;

    // The store that tracks the auth context.
    const authentication: Writable<Authentication> = writable({ user: null, loading: loading, login, logout, });

    // Login using Firebase's password-less email verification
    async function login(email: string) {
        // If connected to firebase...
        if(auth) {

            const actionCodeSettings = {
                url: location.origin + "/finishlogin",
                handleCodeInApp: true
            }

            // Ask Firebase to log in with the given email
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            // Remember the email in local storage so we don't have to ask for it again
            // after returning to the link above.
            window.localStorage.setItem("email", email);

        }
    }

    function updateAuth(user: User | null) {
        authentication.set({ user, loading: loading, login, logout, });
    }

    // Logout using Firebase's authentication framework.
    function logout() {
        if(auth) {
            return auth.signOut().then(() => updateAuth(null));
        }
    }    

    // On mount, subscribe to authentication changes.
    onMount(() => {
        if(auth) {
            const unsubscribe = auth.onAuthStateChanged(user => {
                loading = false;
                updateAuth(user);
            });
            // On unmount, stop subscribing.
            return unsubscribe;
        }

    });

    // Expose the state and the login/logout functionality.
    setContext<Writable<Authentication>>("auth", authentication);

</script>

<!-- Wrap whatever children are given in this context. -->
{#if loading === false }
    <slot></slot>
{/if}