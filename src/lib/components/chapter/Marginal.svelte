<script lang="ts">
    import { isMobile, watchMobile } from '$lib/util/isMobile';
    import { getContext, onMount } from 'svelte';
    import type ChapterContext from '../page/ChapterContext';
    import { CHAPTER } from '../page/Symbols';

    export let id: string;

	let hovered = false;
	let context = getContext<ChapterContext>(CHAPTER);

	// If there's no marginal selected or this is different from the current selection, this is hidden.
	function isHidden() { 
		return context.marginalID === null || context.marginalID !== id
	}

	function toggle() {

		if(context.setMarginal) {
			if(isMobile() && isHidden())
				context.setMarginal(id);
			// Otherwise, deselect.
			else
				context.setMarginal(undefined);
		}

	}

	function handleEnter() { hovered = true }
	function handleExit() { hovered = false }

    onMount(() => {
		const mediaWatch = watchMobile();
		mediaWatch.addEventListener("change", toggle)

		return () => mediaWatch.removeEventListener("change", toggle);
	});

</script>

<span 
    class={"bookish-marginal-interactor" + (hovered ? " bookish-marginal-hovered" : "") + (isHidden() ? "" : " bookish-marginal-selected")} 
    on:click={toggle} 
    on:mouseenter={handleEnter} 
    on:mouseleave={handleExit}
>
    <slot name="interactor"></slot>
</span>
<span 
    class={"bookish-marginal" + (isHidden() ? " bookish-marginal-hidden" : "") + (hovered ? " bookish-marginal-hovered" : "")} 
    on:click={toggle} 
    on:mouseenter={handleEnter} 
    on:mouseleave={handleExit}
>
    <slot name="content"></slot>
</span>