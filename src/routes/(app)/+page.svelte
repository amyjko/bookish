<script lang="ts">
    import Section from '$lib/components/app/Section.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Link from '$lib/components/app/Link.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Head from '$lib/components/app/Head.svelte';
</script>

<Section>
    <Lead
        ><Large>Bookish</Large> (beta) platform for writing simple, beautiful, accessible
        online books.</Lead
    >

    <Head>Simple</Head>
    <Paragraph>
        Print is full gatekeeping and other digital platforms have complex
        tools. Bookish strives to be a Google Docs for books: the workflow is as
        simple as write and share.
    </Paragraph>

    <Head>Beautiful</Head>
    <Paragraph>
        Typography matters. Print books can be beautiful, but are complex to
        make. E-books can be easier to make, but are often typographically
        messy. Bookish strives for a happy medium, making digital content
        typographicaaly beautiful.
    </Paragraph>

    <Head>Accessible</Head>
    <Paragraph>
        Most platforms produce books that are incompatible with screen readers,
        excluding readers who are blind, low vision, dyslexic, or otherwise
        prefer to have text spoken. Bookish strives to be readable in any web
        browser, with sight or sound.
    </Paragraph>

    <Paragraph>
        <Link to="/about">Learn more</Link>
        about the platform.
    </Paragraph>
</Section>
