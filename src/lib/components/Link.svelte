<script lang="ts">
    export let to: string;
    export let before: Function | undefined = undefined; 

    let link: HTMLAnchorElement;

    function scroll(event: MouseEvent) {
        // No element? Bail.
        if(link === undefined) return;

        // No hash? No scroll.
        const hash = new URL(link.href).hash;
        if(hash === "") return;

        // Prevent the browser from scrolling.
        event.preventDefault();

        // Get the anchor
        const anchorId = new URL(link.href).hash.replace('#', '')
        const anchor = document.getElementById(anchorId);

        // No anchor? Bail.
        if(anchor === null) return;

        // Scroll to the anchor.
        window.scrollTo({
            top: anchor.offsetTop,
            behavior: 'smooth'
        })

        // Update the hash (without scrolling)
        history.pushState({}, "", hash);

	}

</script>

<a href={to} bind:this={link} on:click={event => before ? before() : scroll(event) }><slot></slot></a>