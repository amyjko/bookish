<script lang="ts">
    import Button from '../app/Button.svelte';

    export let tooltip: string;
    export let confirm: string;
    export let command: () => Promise<void> | void;

    let confirming = false;
</script>

<div class="confirm">
    {#if !confirming}
        <Button {tooltip} command={() => (confirming = true)}><slot /></Button>
    {:else}
        <Button tooltip="yes" {command}>{confirm}</Button>
        <Button tooltip="no" command={() => (confirming = false)}>no</Button>
    {/if}
</div>

<style>
    .confirm {
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: baseline;
        gap: var(--app-chrome-padding);
    }
</style>
