<script lang="ts">
    import ToolbarIcon from './Icon.svelte';
    import ToolbarSpacer from './ToolbarSpacer.svelte';

    export let linebreak: boolean = false;
    export let icon: string;
</script>

{#if linebreak}
    <div class="break" />
{/if}
<div class="toolbar-group">
    <ToolbarIcon {icon} /><ToolbarSpacer /><slot />
</div>

<style>
    .toolbar-group {
        display: inline-block;
        padding-bottom: var(--app-chrome-padding);
        margin-right: calc(2 * var(--app-chrome-padding));
    }

    .break {
        flex-basis: 100%;
        height: 0;
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
