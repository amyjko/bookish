<script lang="ts">
    import Section from '$lib/components/app/Writing.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Lead from '$lib/components/app/Lead.svelte';
    import Link from '$lib/components/app/Link.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Head from '$lib/components/app/Head.svelte';
</script>

<Section>
    <Lead
        ><Large>Bookish</Large> press is a platform for reading and writing simple,
        accessible, beautiful online books.</Lead
    >

    <Head>Simple</Head>
    <Paragraph>
        Print is full gatekeeping and other digital platforms have complex
        tools. Bookish strives to be a Google Docs for books: the workflow is as
        simple as write, share, read.
    </Paragraph>

    <Head>Accessible</Head>
    <Paragraph>
        Most platforms produce books that are incompatible with screen readers,
        excluding readers who are blind, low vision, dyslexic, and others who
        rely on them. Bookish ensures that books are readable on any device by
        any person with a modern web browser.
    </Paragraph>

    <Head>Beautiful</Head>
    <Paragraph>
        Typography matters. Print books can be beautiful, but are complex to
        make and inaccessible. Many e-book and online book platforms prioritize
        navigation over content. Bookish tries to prioritizes content over
        structure.
    </Paragraph>

    <Paragraph aside>
        Bookish is built and maintained by <Link to="http://amyjko.com"
            >Amy J. Ko</Link
        >, a Professor at the <Link to="https://www.washington.edu/"
            >University of Washington</Link
        >
        <Link to="https://ischool.uw.edu">Information School</Link>. She
        originally built Bookish to write books to support her teaching. Do you
        have feedback or want to contribute? The project is free and open source <Link
            to="https://github.com/amyjko/bookish">on GitHub</Link
        >. Write <Link to="mailto:ajko@uw.edu">Amy</Link> if you'd like to collaborate,
        or <Link to="https://github.com/amyjko/bookish/issues"
            >submit an issue</Link
        > or <Link to="https://github.com/amyjko/bookish/pulls"
            >pull request</Link
        > directly.
    </Paragraph>
</Section>
