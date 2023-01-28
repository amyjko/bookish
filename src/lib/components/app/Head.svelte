<script lang="ts">
    export let id: string | null = null;
</script>

<h2 {id}><slot /></h2>

<style>
    h2 {
        font-size: 150%;
        font-weight: bold;
        font-family: var(--app-font);
        margin-top: var(--app-text-spacing);
        margin-bottom: 0;
        margin-left: -1rem;
    }
</style>
