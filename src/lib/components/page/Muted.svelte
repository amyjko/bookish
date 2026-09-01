<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<span class="muted">{@render children?.()}</span>

<style>
    /* TYPOGRAPHY */
    .muted {
        color: var(--bookish-muted-color);
        font-weight: normal;
        font-size: var(--bookish-block-font-size);
    }
</style>
