<script lang="ts">
    import Icon from './Icon.svelte';

    export let options: string[];
    export let icons: Record<string, string> | undefined = undefined;
    export let value: string;
    export let enabled: boolean | undefined = undefined;
    export let edit: (newValue: string) => void;

    function handleClick(event: MouseEvent) {
        const newValue = (event.currentTarget as HTMLElement).dataset.value;
        if (newValue && options.includes(newValue)) {
            edit(newValue);
        }
    }
</script>

<span class="switch">
    {#each options as option}
        <button
            class={`option ${value === option ? 'selected' : ''}`}
            data-value={option}
            disabled={enabled === false}
            on:click|stopPropagation={handleClick}
        >
            {#if icons && option in icons}
                <Icon icon={icons[option]} />
            {:else}
                {option}
            {/if}
        </button>
    {/each}
</span>

<style>
    button {
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        color: var(--app-font-color);
        background-color: var(--app-chrome-background);
        padding: var(--app-chrome-padding);
        border: none;
        border-radius: 0;
    }

    button:hover:enabled:not(.selected) {
        cursor: pointer;
        background-color: var(--app-interactive-color);
        color: var(--app-font-color-inverted);
    }

    button.selected {
        background-color: var(--app-border-color);
        color: var(--app-font-color-inverted);
    }

    button:disabled {
        opacity: 0.3;
        cursor: auto;
    }

    .switch {
        font-family: var(--app-font);
        font-size: var(--app-chrome-font-size);
        white-space: nowrap;
    }

    .option {
        display: inline-block;
        background-color: var(--app-chrome-background);
        padding-left: var(--app-chrome-padding);
        padding-right: var(--app-chrome-padding);
    }

    .option:first-child {
        border-top-left-radius: var(--app-chrome-roundedness);
        border-bottom-left-radius: var(--app-chrome-roundedness);
        margin-left: var(--app-chrome-padding);
    }

    .option:last-child {
        border-top-right-radius: var(--app-chrome-roundedness);
        border-bottom-right-radius: var(--app-chrome-roundedness);
        margin-right: var(--app-chrome-padding);
    }
</style>
