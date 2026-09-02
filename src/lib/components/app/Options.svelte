<script lang="ts">
    interface Props {
        options: [string, string][];
        changed: (value: string) => void;
        value: string;
        label: string;
    }

    let {
        options,
        changed,
        value = $bindable(),
        label
    }: Props = $props();
</script>

<select bind:value onchange={() => changed(value)} aria-label={label}>
    <option value="" selected={value === ''}></option>
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
        max-width: 10em;
    }
</style>
