<script lang="ts">
    export let type: 'submit' | 'button' | null = null;
    export let tooltip: string;
    export let disabled: boolean = false;
    export let command: () => void;
</script>

<button
    class={$$props.class}
    title={tooltip}
    aria-label={tooltip}
    {type}
    {disabled}
    on:mousedown={command}
    on:keypress={(event) =>
        event.key === ' ' || event.key === 'Enter' ? command() : undefined}
>
    <slot />
</button>

<style>
    button {
        display: inline-block;
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        color: var(--app-font-color);
        background-color: var(--app-chrome-background);
        padding-left: var(--app-chrome-padding);
        padding-right: var(--app-chrome-padding);
        padding-top: calc(var(--app-chrome-padding) / 2);
        padding-bottom: calc(var(--app-chrome-padding) / 2);
        border-radius: var(--app-chrome-roundedness);
        border: none;
    }

    button:hover:enabled {
        cursor: pointer;
        background-color: var(--app-interactive-color);
        color: var(--app-font-color-inverted);
    }

    button:disabled {
        opacity: 0.5;
        cursor: auto;
    }

    button:focus {
        position: relative;
        z-index: 2;
        outline: var(--app-chrome-border-size) solid
            var(--app-interactive-color);
    }
</style>
