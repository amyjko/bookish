<script lang="ts">
    export let id: string | null = null;
</script>

<h2 {id}><slot></slot></h2>

<style>
    h2 {
        margin-top: var(--bookish-header-spacing);
    }
</style>