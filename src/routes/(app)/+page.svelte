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
        ><Large>Bookish</Large> (beta*) is a platform for writing simple, beautiful,
        accessible online books.</Lead
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
        make. E-books can be easier to make, but are often typographically messy
        on the web. Bookish strives for a happy medium, striving for
        typographically beautiful web-based reading experiences.
    </Paragraph>

    <Head>Accessible</Head>
    <Paragraph>
        Most platforms produce books that are incompatible with screen readers,
        excluding readers who prefer or require that text be spoken. Bookish
        strives to be readable in any web browser, with sight or sound.
    </Paragraph>

    <Paragraph>
        <Link to="/write">Start writing</Link> or <Link to="/about"
            >learn more</Link
        >.
    </Paragraph>

    <Paragraph
        ><em
            >* Beta means that I'm still working toward a <Link
                to="https://github.com/amyjko/bookish/milestones/1.0">1.0</Link
            >, so there are still many known issues that may disrupt authoring,
            or even lead to data loss. The reading experience, however, is quite
            stable. If you'd like to accelerate progress toward a 1.0, <Link
                to="mailto:ajko@uw.edu">write Amy</Link
            >.</em
        ></Paragraph
    >
</Section>
