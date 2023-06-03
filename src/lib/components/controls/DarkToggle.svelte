<script lang="ts">
    export let dark: boolean;
    export let toggle: () => void;

    const lightLabel = '\u263C';
    const darkLabel = '\u263E';

    function change() {
        dark = !dark;
        toggle();
    }
</script>

<!-- Dark mode toggle -->
<div
    class="dark-toggle"
    role="button"
    aria-label={dark === true ? 'Switch to light mode' : 'Switch to dark mode'}
    tabindex="0"
    on:click={change}
    on:keydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            change();
            event.stopPropagation();
        }
    }}
>
    {dark ? darkLabel : lightLabel}
</div>

<style>
    .dark-toggle {
        transition: transform 0.2s ease-in;
        user-select: none;
    }
    .dark-toggle:hover {
        cursor: pointer;
        transform: scale(1.25, 1.25);
        color: var(--bookish-paragraph-color);
    }
</style>
