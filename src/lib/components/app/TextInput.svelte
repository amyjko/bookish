<script lang="ts">
    export let text = "";
    export let autocomplete: string | null = null;
    export let type: string;
    export let placeholder: string;
    export let disabled: boolean;

    let input: HTMLInputElement;

    export function value() { return text; }

</script>

<input {autocomplete} {type} {placeholder} {disabled} bind:this={input} on:input={() => text = input.value } />

<style>
    input {
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        color: var(--app-font-color);
        padding: var(--app-chrome-padding);
        font-size: var(--app-chrome-font-size);
        border: none;
        border-bottom: var(--app-chrome-border-size) solid var(--app-border-color);
    }

    input:focus {
        border-bottom-color: var(--bookish-highlight-color);
        outline: none;
    }
</style>