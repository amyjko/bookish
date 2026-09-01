<script lang="ts">
    interface Props {
        icon: string;
    }

    let { icon }: Props = $props();
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
