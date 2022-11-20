<script lang="ts">
    import { updateEmail } from "firebase/auth";
    import { getAuth } from "../../lib/components/page/Contexts";
	import Alert from "$lib/components/page/Alert.svelte";
    import Title from "$lib/components/page/Title.svelte";
    
    let email: string;
    let auth = getAuth();

    let loading  = false;
	let feedback = "";
    let changed = false;

	const errors: Record<string,string> = {
		"auth/invalide-mail": "This wasn't a valid email.",
		"auth/email-already-in-use": "This email is already associated with an account.",
		"auto/requires-recent-login": "You haven't logged in recently enough. Log out, log in again, then try again."
	};

	async function handleSubmit() {

		// Enter loading state, try to login and wait for it to complete, and then leave loading state.
		if($auth.user !== null && email) {
			try {
				// Give some feedback when loading.
				loading = true;
				const previousEmail = $auth.user.email;
				await updateEmail($auth.user, email);
				feedback = `Check your original email address, ${previousEmail}, for a confirmation link.`;
                changed = true;
			} catch(error: any) {
				if(typeof error.code === "string")
					feedback = errors[error.code] ?? "Couldn't update email for an unknown reason."
			} finally {
				loading = false;
			}
		}

	}

</script>

<Title>Change e-mail</Title>

<p>
    To change your login email, type your new email address below.
</p>

<form on:submit|preventDefault={handleSubmit}>
    <input autocomplete="username" type="email" placeholder="email" bind:value={email} required disabled={loading}/> <button type="submit" disabled={loading || email == undefined || email.length === 0 || changed}>Update e-mail</button>
</form>

{#if feedback }
    <Alert>{feedback}</Alert>
{/if}