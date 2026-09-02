<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<span>{@render children?.()}</span>

<style>
    span {
        display: inline-block;
        background-color: var(--bookish-error-background-color);
        color: var(--bookish-error-color);
        border-radius: var(--bookish-roundedness);
        font-weight: 400;
        padding: var(--bookish-inline-padding)
            calc(2 * var(--bookish-inline-padding));
    }
</style>
