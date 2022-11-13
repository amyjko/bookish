<script lang="ts">
    import { isMobile, watchMobile } from '$lib/util/isMobile';
    import { onMount } from 'svelte';
    import { getChapter } from '../page/Contexts';

    export let id: string;

	let hovered = false;
	let chapter = getChapter();

	// If there's no marginal selected or this is different from the current selection, this is hidden.
	function isHidden() { 
		return $chapter?.marginalID === null || $chapter?.marginalID !== id
	}

	function toggle() {

		if($chapter) {
			if(isMobile() && isHidden())
				$chapter.setMarginal(id);
			// Otherwise, deselect.
			else
				$chapter.setMarginal(undefined);
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
	tabIndex=0
    on:mousedown={toggle}
	on:keydown={event => event.key === "Enter" || event.key === " " ? toggle() : undefined }
    on:mouseenter={handleEnter} 
    on:mouseleave={handleExit}
>
    <slot name="interactor"></slot>
</span>
<span 
    class={"bookish-marginal" + (isHidden() ? " bookish-marginal-hidden" : "") + (hovered ? " bookish-marginal-hovered" : "")} 
	tabIndex=0
    on:mousedown|stopPropagation={toggle} 
	on:keydown={event => event.key === "Enter" || event.key === " " ? toggle() : undefined }
    on:mouseenter={handleEnter} 
    on:mouseleave={handleExit}
>
    <slot name="content"></slot>
</span>