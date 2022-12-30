<script lang="ts">
    import Feedback from '$lib/components/app/Feedback.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Link from '$lib/components/app/Link.svelte';
    import Large from '../lib/components/app/Large.svelte';
</script>

<Lead><Large>Oops</Large>.</Lead>

<Feedback error>
    This page doesn't exist. Want to go <Link to="/">home</Link>?
</Feedback>
