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
        font-family: var(--bookish-app-chrome-font-family);
        font-size: var(--bookish-app-chrome-font-size);
        color: var(--bookish-app-chrome-color);
        padding: var(--bookish-app-chrome-padding);
        font-size: var(--bookish-app-chrome-font-size);
        border: none;
        border-bottom: var(--bookish-app-chrome-border-width) solid var(--bookish-app-chrome-border-color);
    }

    input:focus {
        border-bottom-color: var(--bookish-highlight-color);
        outline: none;
    }
</style>