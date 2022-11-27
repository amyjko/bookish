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

<nav class="header">
    <Link to={getLink("/")}>Home</Link>
    <Link to={getLink("/read")}>Read</Link>
    <Link to={getLink("/write")}>Write</Link>
    {#if $auth.user && $auth.user.email }
        <Link to={getLink("/")} before={handleLogout}>Logout </Link>
        <Link to={getLink("/email")}>{$auth.user.email}</Link>
    {:else}
        <Link to={getLink("/login")}>Login</Link>
    {/if}
</nav>

<style>
    .header {
        width: 100%;
        padding: var(--app-chrome-padding); 
        box-sizing: border-box;
        white-space: nowrap;
        overflow: clip;
        text-align: center;
    }

    .header > :global(a) {
        margin-right: var(--app-chrome-padding);
        text-overflow: ellipsis;
    }
</style>