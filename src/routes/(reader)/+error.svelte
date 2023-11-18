<script>
    import Error from './Error.svelte';
    import { page } from '$app/stores';
</script>

<Error>
    {#if $page.error}{$page.error.message}{:else}There was a problem loading
        this page.{/if} Head <a href="/">home</a>?
</Error>
