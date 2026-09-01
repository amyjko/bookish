<script lang="ts">
    import Button from '../app/Button.svelte';

    interface Props {
        tooltip: string;
        confirm: string;
        command: () => Promise<void> | void;
        children?: import('svelte').Snippet;
    }

    let {
        tooltip,
        confirm,
        command,
        children
    }: Props = $props();

    let confirming = $state(false);
</script>

<div class="confirm">
    {#if !confirming}
        <Button {tooltip} command={() => (confirming = true)}>{@render children?.()}</Button>
    {:else}
        <Button tooltip="no" command={() => (confirming = false)}>cancel</Button
        >&nbsp;<Button
            tooltip="yes"
            command={() => {
                confirming = false;
                command();
            }}>{confirm}</Button
        >
    {/if}
</div>

<style>
    .confirm {
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        display: inline-block;
    }
</style>
