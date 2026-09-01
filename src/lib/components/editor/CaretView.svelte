<script lang="ts">
    import { tick } from 'svelte';
    import type { Accent } from './CaretContext';

    interface Props {
        left: number;
        top: number;
        height: number;
        linked: boolean;
        italic: boolean;
        bold: boolean;
        disabled: boolean;
        ignored: boolean;
        blink: boolean;
        locked: boolean;
        accent: Accent | undefined;
    }

    let {
        left,
        top,
        height,
        linked,
        italic,
        bold,
        disabled,
        ignored,
        blink,
        locked,
        accent,
    }: Props = $props();

    let element: HTMLElement | undefined = $state();

    let headerHeight = $state(0);

    // When the caret updates position, scroll the element into view after
    // the render is complete, and re-measure the header height so we can
    // snap to the caret position.
    $effect(() => {
        void left;
        void top;
        tick().then(() =>
            element ? element.scrollIntoView({ block: 'nearest' }) : undefined,
        );
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
