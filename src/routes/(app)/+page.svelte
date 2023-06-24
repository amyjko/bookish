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

    <Head>FAQs</Head>

    <Paragraph>
        <strong>What does beta mean?</strong> Beta means that we are still
        working toward a <Link
            to="https://github.com/amyjko/bookish/milestones/1.0">1.0</Link
        >, so there are still many known issues that may disrupt authoring, or
        even lead to data loss. The reading experience, however, is quite
        stable. If you'd like to accelerate progress toward a 1.0, <Link
            to="mailto:ajko@uw.edu">write Amy</Link
        >. We do not have a timeline for the 1.0 release, but the project is
        actively progressing.
    </Paragraph>

    <Paragraph>
        <strong>Is Bookish a company?</strong> No. At the moment, it is strictly
        an open source project maintained by <Link to="https://amyjko.phd"
            >Amy J. Ko</Link
        >, and the occasional contributor from around the world. It has no
        revenue stream or organization to support it, although Amy's role as
        Professor at the University of Washington Information School, and the
        public funding that supports the university, is a key part of what
        enables Amy to work on the project. In particular, some National Science
        Foundation grants (<Link
            to="https://www.nsf.gov/awardsearch/showAward?AWD_ID=1703734"
            >#1703734</Link
        >, <Link to="https://www.nsf.gov/awardsearch/showAward?AWD_ID=2031265"
            >#2031265</Link
        >), have partially funded her time to work on book writing
        infrastructure. Not having an organization has tradeoffs. For example,
        we can't take money, and therefore can use money to grow a team to
        better support the project. However, because we don't rely on a revenue
        stream, it means we can focus on the values above without them being
        warped by capital.
    </Paragraph>

    <Paragraph
        ><strong>Can Bookish export PDFs?</strong> No, although you can visit a chapter
        or show all chapters on a page and then have your browser generate a PDF.
        We recognize that PDFs are still widely used, but since they are extremely
        difficult to make accesssible to people who rely on screen readers, they
        do not align with the project's values. Bookish is web-first and web-only
        for this reason.</Paragraph
    >

    <Paragraph
        ><strong>Can you support my custom domain?</strong> Yes, but with
        effort. By default, books published on <em>bookish.press</em> are hosted
        on this domain. We intend our 1.0 to have support for exporting an HTML,
        CSS, JavaScript bundle which you will be able to upload and host
        yourself on other domains. This will have the downside of requiring you
        to rexport and reupload any time you make changes to your book and to
        manage your own hosting. Another option is
        <Link to="https://en.wikipedia.org/wiki/Domain_masking"
            >domain masking</Link
        >: some domain registrars will allow you to forward all requests to a
        domain to your Bookish book, making it look like your book is hosted on
        your domain. You'll have to check your domain provider's documentation
        on how to do this. Finally, you can always choose a Bookish URL (e.g.,
        bookish.press/mybook) if you're okay having the Bookish name as part of
        your book's URL.</Paragraph
    >

    <Paragraph
        ><strong>Does Bookish support multiple editions?</strong> Yes, each Bookish
        book is a series of editions. You can make a new edition at any time, which
        copies your latest edition, and then you can make edits and describe a summary
        of what changed.</Paragraph
    >

    <Paragraph
        ><strong>Is Bookish WCAG compliant?</strong>We aspire to meet and exceed
        all <Link to="https://www.w3.org/TR/WCAG21/">WCAG 2.1 guidelines</Link>.
        We are always finding new ways to verify and improve accessibility,
        however, and web standards are always evolving, so accessibility will
        always be an ongoing project. See our <Link
            to="https://github.com/amyjko/bookish/issues">open issues</Link
        > for any open accessibility problems.</Paragraph
    >
</Section>
