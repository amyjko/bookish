<script lang="ts">
    export let type: string | null = null;
    export let tooltip: string;
    export let disabled: boolean = false;
    export let command: () => void;

</script>

<button 
    class={$$props.class} 
    title={tooltip} 
    {type} 
    {disabled} 
    on:click={command}
    on:keypress={event => event.key === " " || event.key === "Enter" ? command() : undefined }
>
    <slot></slot>
</button>

<style>
    button {
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
        color: var(--bookish-app-chrome-color);
        background-color: var(--bookish-app-chrome-background);
        padding: var(--bookish-app-chrome-padding);
        border-radius: var(--bookish-app-chrome-roundedness);
        border: none;
    }

    button:hover:enabled {
        cursor: pointer;
        background-color: var(--bookish-app-chrome-hover-background);
        color: var(--bookish-app-chrome-hover-color);
    }

    button:disabled {
        opacity: 0.3;
        border-color: var(--bookish-app-chrome-muted);
        cursor: auto;
    }

</style>