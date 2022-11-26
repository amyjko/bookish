<script lang="ts">
    import Feedback from "$lib/components/app/Feedback.svelte";
    import Lead from "$lib/components/app/Lead.svelte";
    import Link from "$lib/components/app/Link.svelte";
</script>

<Lead>Oops.</Lead>

<Feedback>
    This page doesn't exist.
    Want to go <Link to="/">home</Link>?
</Feedback>