<script lang="ts">
    interface Props {
        id?: string | null;
        children?: import('svelte').Snippet;
    }

    let { id = null, children }: Props = $props();
</script>

<h2 class="page-header" {id}>{@render children?.()}</h2>

<style>
    h2 {
        margin-top: var(--bookish-header-spacing);
        font-family: var(--bookish-header-font-family);
        font-weight: var(--bookish-header-font-weight);
        line-height: var(--bookish-header-line-height);
        font-size: var(--bookish-header-1-font-size);

        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--bookish-inline-padding);
    }
</style>
