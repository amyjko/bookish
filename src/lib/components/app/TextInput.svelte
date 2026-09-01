<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements';

    interface Props {
        text?: string;
        autocomplete?: HTMLInputAttributes['autocomplete'];
        type: string;
        placeholder: string;
        disabled: boolean;
    }

    let {
        text = $bindable(''),
        autocomplete = null,
        type,
        placeholder,
        disabled
    }: Props = $props();

    let input: HTMLInputElement | undefined = $state();

    export function value() {
        return text;
    }
</script>

<input
    {autocomplete}
    {type}
    {placeholder}
    {disabled}
    value={text}
    bind:this={input}
    oninput={(event) => (text = event.currentTarget.value)}
/>

<style>
    input {
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        background: var(--app-background-color);
        color: var(--app-font-color);
        padding: var(--app-chrome-padding);
        font-size: var(--app-chrome-font-size);
        border: none;
        border-bottom: var(--app-chrome-border-size) solid
            var(--app-border-color);
    }

    input:focus {
        border-bottom-color: var(--app-interactive-color);
        outline: none;
    }
</style>
