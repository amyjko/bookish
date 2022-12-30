<script lang="ts">
    import Feeback from '$lib/components/app/Feedback.svelte';
    import Link from '$lib/components/app/Link.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
</script>

<Lead><Large>Oops</Large>...</Lead>

<Feeback error>
    This book doesn't exist. Want to go to your <Link to="/write"
        >dashboard</Link
    >?
</Feeback>
