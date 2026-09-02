<script lang="ts">
    import { goto } from '$app/navigation';
    import { getUser } from '$lib/components/page/Contexts';
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();

    let auth = getUser();

    // Redirect to the login page if not authenticated.
    $effect(() => {
        if ($auth === undefined || $auth.user === null)
            goto('/login', { replaceState: true });
    });
</script>

{@render children?.()}
