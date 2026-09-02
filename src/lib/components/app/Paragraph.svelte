<script lang="ts">
    interface Props {
        aside?: boolean;
        children?: import('svelte').Snippet;
    }

    let { aside = false, children }: Props = $props();
</script>

<p class={aside ? 'aside' : ''}>{@render children?.()}</p>

<style>
    p {
        font-family: var(--app-font);
        font-size: var(--app-font-size);
        font-weight: 300;
        line-height: var(--app-line-height);
        margin-top: 0;
        margin-bottom: var(--app-text-spacing);
    }

    .aside {
        font-style: italic;
        font-size: 90%;
    }
</style>
