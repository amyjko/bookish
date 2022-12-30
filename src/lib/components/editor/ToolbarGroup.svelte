<script lang="ts">
    import ToolbarIcon from './Icon.svelte';
    import ToolbarSpacer from './ToolbarSpacer.svelte';

    export let linebreak: boolean = false;
    export let icon: string;
</script>

{#if linebreak}<br />{/if}
<span class="bookish-editor-toolbar-group">
    <ToolbarIcon {icon} /><ToolbarSpacer /><slot />
</span>

<style>
    .bookish-editor-toolbar-group {
        display: inline-block;
        padding-bottom: var(--app-chrome-padding);
        margin-right: calc(2 * var(--app-chrome-padding));
    }

    .bookish-editor-toolbar-group :global(button:first-of-type) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    .bookish-editor-toolbar-group :global(button:last-of-type) {
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
    }

    .bookish-editor-toolbar-group
        :global(button:not(:first-of-type):not(:last-of-type)) {
        border-radius: 0;
    }

    .bookish-editor-toolbar-group :global(input),
    .bookish-editor-toolbar-group :global(select) {
        margin-left: var(--app-chrome-padding);
        margin-right: var(--app-chrome-padding);
    }
</style>
