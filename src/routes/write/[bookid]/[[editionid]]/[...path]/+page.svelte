<script lang="ts">
    import { goto } from '$app/navigation';
    import { getBase } from '$lib/components/page/Contexts';

    goto(getBase() + "/unknown");
</script>