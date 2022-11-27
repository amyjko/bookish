<script lang="ts">
    import Link from "$lib/components/app/Link.svelte";
    import { getAuth } from "$lib/components/page/Contexts";
    import { getSubdomain, pathWithoutSubdomain } from "../lib/util/getSubdomain";

    let subdomain = getSubdomain();

    let auth = getAuth();

    // Ask the auth context to logout, and provided an error if it fails.
    async function handleLogout() {
        $auth.logout()
    }

    function getLink(path: string) {
		return subdomain !== undefined ? pathWithoutSubdomain(path) : path;
	}

</script>

<div class="header">
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

<style>
    .header {
        margin-top: var(--app-chrome-padding); 
        margin-bottom: var(--app-chrome-padding); 
    }

    .header > :global(a) {
        display: inline-block;
        margin-right: calc(2 * var(--app-chrome-padding));
    }
</style>