<script lang="ts">
    // Assumed to be SVG text.
    export let name: string;
</script>

<span>
    {@html name}
</span>

<style>
    span {
        vertical-align: middle;
    }

    span :global(svg) {
        width: 1em;
        height: 1em;
    }
</style>