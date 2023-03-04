<script lang="ts">
    import { goto } from '$app/navigation';
    import { getUser } from '$lib/components/page/Contexts';

    let auth = getUser();

    // Redirect to the login page if not authenticated.
    if ($auth === undefined || $auth.user === null)
        goto('/login', { replaceState: true });
</script>

<slot />
