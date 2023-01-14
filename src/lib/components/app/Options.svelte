<script lang="ts">
    export let options: [string, string][];
    export let changed: (value: string) => void;
    export let value: string;
    export let label: string;
</script>

<select bind:value on:change={() => changed(value)} aria-label={label}>
    <option value="" selected={value === ''} />
    {#each options as option}
        <option value={option[1]} selected={value === option[1]}
            >{option[0]}</option
        >
    {/each}
</select>

<style>
    select {
        border: none;
        background-color: var(--app-chrome-background);
        padding: var(--app-chrome-padding);
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
    }
</style>
