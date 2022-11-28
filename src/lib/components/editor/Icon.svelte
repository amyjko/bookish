<script lang="ts">
    export let icon: string;
</script>

<span>
    {@html icon}
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