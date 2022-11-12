<script lang="ts">
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import type Authentication from "../lib/components/Authentication";
    import Link from "../lib/components/Link.svelte";
    import { getSubdomain, pathWithoutSubdomain } from "../lib/util/getSubdomain";

    let subdomain = getSubdomain();

    let auth = getContext<Writable<Authentication>>("auth");

    // Ask the auth context to logout, and provided an error if it fails.
    async function handleLogout() {
        try {
            await $auth.logout()
        } catch(err) {
            console.error(err);
            // TODO Handle errors.
        }
    }

    function getLink(path: string) {
		return subdomain !== undefined ? pathWithoutSubdomain(path) : path;
	}

</script>

<div class="bookish-app-header">
    <img src="/icons/icon.png" alt="A letter b in a black circle"/>&nbsp;
    <Link to={getLink("/")}>Home</Link>
    <Link to={getLink("/read")}>Read</Link>
    <Link to={getLink("/write")}>Write</Link>
    {#if $auth.user && $auth.user.email }
        <Link to={getLink("/")} before={handleLogout}>Logout </Link>
        <Link to={getLink("/email")}>{$auth.user.email}</Link>
    {:else}
        <Link to={getLink("/login")}>Login</Link>
    {/if}
</div>