<script lang="ts">
    import { isEditable } from './Contexts';

    let editable = isEditable();
</script>

{#if editable}
    <section class="instructions"><slot /></section>
{/if}

<style>
    .instructions {
        font-family: var(--app-font);
        font-weight: 300;
        font-style: italic;
        margin-top: var(--app-text-spacing);
        margin-bottom: var(--app-text-spacing);
        line-height: var(--app-line-height);
        padding-left: var(--app-chrome-padding);
        border-left: var(--app-chrome-border-size) solid var(--app-border-color);
    }

    .instructions :global(p),
    .instructions :global(li) {
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        line-height: var(--app-line-height);
        margin-bottom: 0;
    }

    .instructions :global(p) {
        margin-top: 0;
    }
</style>
