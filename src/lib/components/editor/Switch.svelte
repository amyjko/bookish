<script lang="ts">

    export let options: string[];
    export let value: string;
    export let enabled: boolean | undefined = undefined;
    export let edit : (newValue: string) => void;

    function handleClick(event: MouseEvent) {
        const newValue = (event.currentTarget as HTMLElement).dataset.value;
        if(newValue && options.includes(newValue)) {
            edit(newValue);
        }
    }

</script>

<span class="switch">
    {#each options as option }
        <button 
            class={`option ${value === option ? "selected" : ""}`} 
            data-value={option} 
            disabled={enabled === false}
            on:click|stopPropagation={handleClick}>
                {option}
        </button>
    {/each}
</span>

<style>

    button {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
        color: var(--bookish-app-chrome-color);
        background-color: var(--bookish-app-chrome-background);
        padding: var(--bookish-app-chrome-padding);
        border: none;
        border-radius: 0;
    }

    button:hover:enabled:not(.selected) {
        cursor: pointer;
        background-color: var(--bookish-app-chrome-hover-background);
        color: var(--bookish-app-chrome-hover-color);
    }

    button.selected {
        background-color: var(--bookish-app-chrome-border-color);
        color: var(--bookish-app-chrome-hover-color);
    }

    button:disabled {
        opacity: 0.3;
        border-color: var(--bookish-app-chrome-muted);
        cursor: auto;
    }

    .switch {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
        white-space: nowrap;
    }

    .option {
        display: inline-block;
        background-color: var(--bookish-app-chrome-background);
        padding-left: var(--bookish-app-chrome-padding);
        padding-right: var(--bookish-app-chrome-padding);
    }

    .option:first-child {
        border-top-left-radius: var(--bookish-app-chrome-roundedness);
        border-bottom-left-radius: var(--bookish-app-chrome-roundedness);
        margin-left: var(--bookish-app-chrome-padding);
    }

    .option:last-child {
        border-top-right-radius: var(--bookish-app-chrome-roundedness);
        border-bottom-right-radius: var(--bookish-app-chrome-roundedness);
        margin-right: var(--bookish-app-chrome-padding);
    }

</style>