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
        ><Large>Bookish</Large> is a platform for writing simple, beautiful, accessible
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

    <Paragraph aside>
        Bookish is built and maintained by <Link to="http://amyjko.com"
            >Amy J. Ko</Link
        >, a Professor at the <Link to="https://www.washington.edu/"
            >University of Washington</Link
        >
        <Link to="https://ischool.uw.edu">Information School</Link>. She
        originally built Bookish to write web-based books to support her
        teaching. She decided to build a platform to make editing and
        maintaining books easier for both herself and others.
    </Paragraph>

    <Paragraph aside>
        Using Bookish to write books will always be free. However, Amy is
        considering models for covering bandwidth costs from reading such
        per-book fees or donations. If you have ideas, <Link
            to="https://github.com/amyjko/bookish/issues/251"
            >join the discussion</Link
        >.
    </Paragraph>

    <Paragraph aside>
        Do you have feedback or want to contribute? The project is free and open
        source <Link to="https://github.com/amyjko/bookish">on GitHub</Link>.
        Write <Link to="mailto:ajko@uw.edu">Amy</Link> if you'd like to collaborate,
        or <Link to="https://github.com/amyjko/bookish/issues"
            >submit an issue</Link
        > or <Link to="https://github.com/amyjko/bookish/pulls"
            >pull request</Link
        > directly.
    </Paragraph>
</Section>
