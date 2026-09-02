<script lang="ts">
    
    interface Props {
        /** By default, we use the Bookish.press Google Analytics tag */
        gtagid?: string | null;
    }

    let { gtagid = null }: Props = $props();

    let id = $derived(gtagid ?? 'G-BGFDV229BN');
</script>

<svelte:head>
    <script
        async
        src="https://www.googletagmanager.com/gtag/js?id={id}"
    ></script>
    {@html `<script>
            window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }

    gtag('js', new Date());
    gtag('config', "${id}");
    </script>`}
</svelte:head>
