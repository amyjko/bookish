<script lang="ts">
    import { afterUpdate, tick } from 'svelte';
    import type { Accent } from './CaretContext';

    export let left: number;
    export let top: number;
    export let height: number;
    export let linked: boolean;
    export let italic: boolean;
    export let bold: boolean;
    export let disabled: boolean;
    export let ignored: boolean;
    export let blink: boolean;
    export let locked: boolean;
    export let accent: Accent | undefined;

    let element: HTMLElement | undefined;

    let headerHeight = 0;

    // When the caret updates position, scroll the element into view after the render is complete.
    $: {
        left;
        top;
        tick().then(() =>
            element ? element.scrollIntoView({ block: 'nearest' }) : undefined,
        );
    }

    /** Keep track of the header height, so we can snap to the caret position. */
    afterUpdate(() => {
        headerHeight =
            (document.querySelector('.bookish-app > .header') as HTMLElement)
                ?.offsetHeight ?? 0;
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
    style:scroll-margin-top="{headerHeight}px"
    bind:this={element}
    >{#if locked}🔒{/if}{#if accent}
        <span class="accent">{accent}</span>
    {/if}</div
>

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
        z-index: 2;
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

    .accent {
        display: inline-block;
        position: absolute;
        top: -0.5em;
        color: var(--app-muted-color);
        font-size: 200%;
    }
</style>
