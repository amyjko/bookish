<script lang="ts">
    interface Props {
        children?: import('svelte').Snippet;
    }

    let { children }: Props = $props();
</script>

<span class="bookish-chapter-number">{@render children?.()}</span>

<style>
    .bookish-chapter-number {
        font-family: var(--bookish-header-font-family);
        font-weight: normal;
        font-style: italic;
    }
</style>
