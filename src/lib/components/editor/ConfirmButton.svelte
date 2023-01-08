<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '../app/Button.svelte';

    export let commandLabel: string;
    export let tooltip: string;
    export let confirmLabel: string;
    export let command: () => Promise<void> | void;

    let confirming = false;
    let executing = false;
    let timeoutID: NodeJS.Timer | undefined = undefined;
    let isMounted = false;

    onMount(() => {
        isMounted = true;
        return () => (isMounted = false);
    });

    function execute() {
        if (!confirming && !executing) {
            confirming = true;
            timeoutID = setTimeout(() => {
                if (isMounted) confirming = false;
            }, 2000);
        } else if (confirming) {
            command()?.finally(() => {
                if (isMounted) {
                    if (timeoutID) clearTimeout(timeoutID);
                    confirming = false;
                    executing = false;
                }
            });
        }
    }
</script>

<Button
    disabled={executing}
    {tooltip}
    command={execute}
    class={confirming ? 'bookish-editor-confirm' : ''}
>
    {confirming ? confirmLabel : commandLabel}
</Button>

<style>
    :global(button.bookish-editor-confirm) {
        animation: failure 100ms infinite;
    }
</style>
