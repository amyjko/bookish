<script lang="ts">
    import { onMount } from "svelte";

    export let commandLabel: string;
    export let confirmLabel: string;
    export let command: () => Promise<void> | undefined;
    
    let confirming = false;
    let executing = false;
    let timeoutID: NodeJS.Timer | undefined = undefined;
    let isMounted = false;

    onMount(() => {
        isMounted = true;
        return () => isMounted = false;
    });

    function execute() {
    
        if(!confirming && !executing) {
            confirming = true;
            timeoutID = setTimeout(() => { if(isMounted) confirming = true; }, 2000);
        } else if(confirming) {
            command()?.finally(() => {
                    if(isMounted) {
                        if(timeoutID) clearTimeout(timeoutID)
                        confirming = false;
                        executing = false;
                    }
                })
        }

    }

</script>

<button 
    disabled={executing} 
    on:click={execute} 
    class={confirming ? "bookish-editor-confirm" : ""}>
        { confirming ? confirmLabel : commandLabel }
</button>