<script lang="ts">
    import { afterUpdate } from 'svelte';

    export let left: number;
    export let top: number;
    export let height: number;
    export let linked: boolean;
    export let italic: boolean;
    export let bold: boolean;
    export let disabled: boolean;
    export let ignored: boolean;
    export let blink: boolean;

    let element: HTMLElement;

    // When the caret updates, make sure it's in view.
    afterUpdate(() => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
</script>

<div
    class="caret"
    class:blink
    class:disabled
    class:ignored
    class:bold
    class:italic
    class:linked
    style:left="{left}px"
    style:top="{top}px"
    style:height="{height}px"
    bind:this={element}
/>

<style>
    .caret {
        left: 0;
        top: 0;
        width: 0px;
        background: none;
        outline: 1px solid var(--bookish-paragraph-color);
        display: inline-block;
        box-sizing: border-box;
        position: absolute;
        z-index: 1;
    }

    @keyframes caret-blink {
        100% {
            outline: none;
        }
    }

    .disabled {
        outline-color: var(--app-muted-color);
    }

    .blink {
        animation: caret-blink 1s steps(2) infinite;
    }

    .italic {
        transform: skew(-10deg);
    }

    .bold {
        outline-width: 2px;
    }

    .ignored {
        animation: failure 100ms 10;
    }

    .linked {
        outline-width: 1px;
        outline-color: var(--bookish-link-color);
    }
</style>
