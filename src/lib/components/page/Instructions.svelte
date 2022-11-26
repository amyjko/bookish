<script lang="ts">
    import { isEditable } from "./Contexts";

    let editable = isEditable();
</script>

{#if editable }
    <section class="instructions"><slot></slot></section>
{/if}

<style>
    .instructions {
        font-family: var(--bookish-app-font-family);
        font-weight: 300;
        font-style: italic;
        margin-top: var(--bookish-app-margin);
        margin-bottom: var(--bookish-app-margin);
        line-height: 1.2;
        padding-left: var(--bookish-app-margin);
        border-left: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
    }

    .instructions :global(p), .instructions :global(li) {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
        line-height: var(--bookish-app-chrome-line-height);
        margin-bottom: 0;
    }

    .instructions :global(p) {
        margin-top: 0;
    }
</style>