<script lang="ts">
    /** Test-only: exposes the app layout's context stores to tests via the
     *  `captured` module, since contexts are only reachable from components. */
    import { getEdition, getStatus } from '$lib/components/page/Contexts';
    import { captured } from './capture';

    captured.edition = getEdition();
    captured.status = getStatus();
</script>
