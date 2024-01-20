<script lang="ts">
    import Icon from './Icon.svelte';
    import ToolbarSpacer from './ToolbarSpacer.svelte';

    export let icon: string;
</script>

<div class="toolbar-group">
    <Icon {icon} /><ToolbarSpacer /><slot />
</div>

<style>
    .toolbar-group {
        display: flex;
        margin-right: calc(2 * var(--app-chrome-padding));
        flex-direction: row;
        flex-wrap: wrap;
        row-gap: var(--app-chrome-padding);
        align-items: baseline;
    }

    .toolbar-group :global(button:first-of-type) {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }

    .toolbar-group :global(button:last-of-type) {
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
    }

    .toolbar-group :global(button:not(:first-of-type):not(:last-of-type)) {
        border-radius: 0;
    }

    .toolbar-group :global(input),
    .toolbar-group :global(select) {
        margin-left: var(--app-chrome-padding);
        margin-right: var(--app-chrome-padding);
    }
</style>
