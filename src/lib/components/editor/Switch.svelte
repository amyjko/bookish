<script lang="ts">

    export let options: string[];
    export let value: string;
    export let position: string;
    export let enabled: boolean | undefined = undefined;
    export let edit : (newValue: string) => void;

    function handleClick(event: MouseEvent) {
        const newValue = (event.currentTarget as HTMLElement).dataset.value;
        if(newValue && options.includes(newValue)) {
            edit(newValue);
        }
    }

</script>

<span class={`bookish-app-switch bookish-app-${position === "<" ? "left" : position === ">" ? "right" : "middle"}`}>
    {#each options as option }
        <button 
            class={`bookish-app-switch-option ${value === option ? "bookish-app-switch-option-selected" : ""}`} 
            data-value={option} 
            disabled={enabled === false}
            on:click|stopPropagation={handleClick}>
                {option}
        </button>
    {/each}
</span>

<style>
    .bookish-app-switch {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
    }

    .bookish-app-switch-option {
        display: inline-block;
        background-color: var(--bookish-app-chrome-background);
        cursor: pointer;
        padding-left: var(--bookish-app-chrome-padding);
        padding-right: var(--bookish-app-chrome-padding);
        border: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
    }

    .bookish-app-switch-option:first-child {
        border-top-left-radius: var(--bookish-app-chrome-roundedness);
        border-bottom-left-radius: var(--bookish-app-chrome-roundedness);
        margin-left: var(--bookish-app-chrome-padding);
    }

    .bookish-app-switch-option:last-child {
        border-top-right-radius: var(--bookish-app-chrome-roundedness);
        border-bottom-right-radius: var(--bookish-app-chrome-roundedness);
        margin-right: var(--bookish-app-chrome-padding);
    }

    .bookish-app-switch-option-selected {
        background-color: var(--bookish-app-chrome-hover-background);
    }
</style>