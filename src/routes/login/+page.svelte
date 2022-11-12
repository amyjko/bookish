<script lang="ts">
    import { getAuth } from "$lib/components/page/Contexts";

	let email: HTMLInputElement;
	let auth = getAuth()

	// Not loading by default
	let loading = false;

	// Track feedback with state
	let feedback = "";

	async function handleSubmit() {

		// Enter loading state, try to login and wait for it to complete, and then leave loading state.
		try {
			// Give some feedback when loading.
			loading = true;
			await $auth.login(email.value);
			feedback = "Check your email for a login link.";
		} catch(err) {
			feedback = "Uh oh! Couldn't connect to the server.";
			console.error(err);
		} finally {
			loading = false;
		}

	}

</script>

<h1>Login to write</h1>

<p>We'll send you an email each time to login, no password required.</p>

<form on:submit|preventDefault={handleSubmit}>
    <input autocomplete="username" type="email" placeholder="email" bind:this={email} required disabled={loading} /> <button type="submit" disabled={loading}>Login</button>
</form>

{#if feedback }
    <div class="bookish-app-alert">{feedback}</div>
{/if}