<script lang="ts">
    /** By default, we use the Bookish.press Google Analytics tag */
    export let gtagid: string | null = null;

    $: id = gtagid ?? 'G-BGFDV229BN';
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
