<script lang="ts">
    import { isEditable } from "./Contexts";

    let editable = isEditable();
</script>

{#if editable }
    <div class="bookish-instructions"><slot></slot></div>
{/if}

<style>
    .bookish-instructions {
        font-style: italic;
        margin-top: var(--bookish-app-margin);
        margin-bottom: var(--bookish-app-margin);
        line-height: 1.2;
        padding: var(--bookish-app-margin);
        border: 2px solid var(--bookish-app-chrome-border-color);
        border-radius: var(--bookish-roundedness);
    }

    .bookish-instructions :global(p), .bookish-instructions :global(li) {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
        line-height: var(--bookish-app-chrome-line-height);
        margin-bottom: 0;
    }

    .bookish-instructions :global(p) {
        margin-top: 0;
    }
</style>