<script lang="ts">
    import Link from "../lib/components/Link.svelte";
    import { getAuth } from "../lib/components/page/Contexts";
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

<style>
    .bookish-app-header {
        margin-top: var(--bookish-app-chrome-spacing); 
        margin-bottom: var(--bookish-app-chrome-spacing); 
    }

    :global(.bookish-app-header a) {
        display: inline-block;
        margin-left: var(--bookish-app-chrome-spacing);
        margin-right: var(--bookish-app-chrome-spacing);
    }

    .bookish-app-header img {
        height: 1em;
        vertical-align: baseline;
    }
</style>