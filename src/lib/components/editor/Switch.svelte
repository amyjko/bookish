<script lang="ts">

    export let options: string[];
    export let value: string;
    export let position: string;
    export let enabled: boolean | undefined = undefined;
    export let edit : (newValue: string) => void;

    function handleClick(event: MouseEvent) {

        // Don't let anything else handle the click.
        event.stopPropagation();
        const newValue = (event.currentTarget as HTMLElement).dataset.value;
        if(newValue && options.includes(newValue)) {
            edit.call(undefined, newValue);
        }

    }

</script>

<span class={`bookish-app-switch bookish-app-${position === "<" ? "left" : position === ">" ? "right" : "middle"}`}>
    {#each options as option }
        <button 
            class={`bookish-app-switch-option ${value === option ? "bookish-app-switch-option-selected" : ""}`} 
            data-value={option} 
            disabled={enabled === false}
            on:click={handleClick}>
                {option}
        </button>
    {/each}
</span>