<script lang="ts">
    import Lead from '$lib/components/app/Lead.svelte';
    import Large from '$lib/components/app/Large.svelte';
    import Paragraph from '$lib/components/app/Paragraph.svelte';
    import Link from '$lib/components/app/Link.svelte';
    import Section from '$lib/components/app/Section.svelte';
    import Head from '$lib/components/app/Head.svelte';
</script>

<Section>
    <Lead><Large>About</Large> Bookish.</Lead>

    <Paragraph>
        Bookish is built and maintained by <Link to="http://amyjko.com"
            >Amy J. Ko</Link
        >, a Professor at the <Link to="https://www.washington.edu/"
            >University of Washington</Link
        >
        <Link to="https://ischool.uw.edu">Information School</Link>. She
        originally built Bookish to write web-based books to support her
        teaching. She decided to build a platform to make editing and
        maintaining books easier for both herself and others. She works on it as
        a side project and continues to use it extensively in her classes.
    </Paragraph>

    <Head id="scope">What do you publish?</Head>
    <Paragraph>
        As with any publisher, Bookish has an editorial policy and philosophy.
        Much like university publishers (e.g., <Link
            to="https://mitpress.mit.edu/about/">MIT Press</Link
        >), Amy views the mission of Bookish Press as <em>scholarly</em>: books
        on the platform should advance knowledge, educate the public, and be
        informed by other scholarly work, through fiction and non-fiction.
        However, Bookish is particularly interested in works that advance
        progress toward a society that
        <em
            >radically embraces the beautiful diversity of humanity and nature
            and seeks to dismantle systems that get in the way.</em
        >
        While this includes works broadly explicitly about social justice topics
        such as diversity, equality, equity, inclusion, justice, accessibility, sustainability,
        indigienous sovereignty, and oppression, it also includes works that discuss
        more strictly technical ideas in sociotechnical ways.
    </Paragraph>

    <Paragraph
        >For now, anyone can create an account and write books, but publishing
        rights are <strong>invitation only</strong>. <Link
            to="mailto:amy@amyjko.com">Write Amy</Link
        > to discuss your vision, to ensure it aligns with our editioral mission.
        Amy retains the right to revoke publishing rights and unpublish books that
        do not align with the vision above; publishing on the platform is a privilege,
        not a right.</Paragraph
    >

    <Paragraph>
        That said, if your vision does not align with ours, you can still use
        Bookish to write your book and export a version for hosting elsewhere.
        You could even use the Bookish source to host your own press with a
        different editorial vision.
    </Paragraph>

    <Head id="beta">What does "beta" mean?</Head>

    <Paragraph>
        Beta means that we are still working toward a <Link
            to="https://github.com/amyjko/bookish/milestones/1.0">1.0</Link
        >, so there are still many known issues that may disrupt authoring, or
        even lead to data loss. The reading experience, however, is quite
        stable. If you'd like to accelerate progress toward a 1.0, <Link
            to="mailto:ajko@uw.edu">write Amy</Link
        >. We do not have a timeline for the 1.0 release, but the project is
        actively progressing.
    </Paragraph>

    <Head id="costs">What does it cost?</Head>

    <Paragraph>
        Using Bookish to write books will always be free. However, hosting is
        not free and particularly widely read books can incur costs that Amy
        can't pay alone. She is considering models for covering bandwidth costs
        from reading such per-book fees or donations. If you have ideas, <Link
            to="https://github.com/amyjko/bookish/issues/251"
            >join the discussion</Link
        >.
    </Paragraph>

    <Head id="business">Is Bookish a business?</Head>
    <Paragraph>
        No. At the moment, it is strictly an open source project maintained by <Link
            to="https://amyjko.phd">Amy</Link
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

    <Head id="pdf">PDFs?</Head>
    <Paragraph
        >No, although you can visit a chapter or show all chapters on a page and
        then have your browser generate a PDF. We recognize that PDFs are still
        widely used, but since they are extremely difficult to make accesssible
        to people who rely on screen readers, they do not align with the
        project's values. Bookish is web-first and web-only for this reason.</Paragraph
    >

    <Head id="pdf">Custom domains?</Head>
    <Paragraph
        >Yes, but with effort. By default, books published on <em
            >bookish.press</em
        >
        are hosted on this domain. We intend our 1.0 to have support for exporting
        an HTML, CSS, JavaScript bundle which you will be able to upload and host
        yourself on other domains. This will have the downside of requiring you to
        rexport and reupload any time you make changes to your book and to manage
        your own hosting. Another option is
        <Link to="https://en.wikipedia.org/wiki/Domain_masking"
            >domain masking</Link
        >: some domain registrars will allow you to forward all requests to a
        domain to your Bookish book, making it look like your book is hosted on
        your domain. You'll have to check your domain provider's documentation
        on how to do this. Finally, you can always choose a Bookish URL (e.g.,
        bookish.press/mybook) if you're okay having the Bookish name as part of
        your book's URL.</Paragraph
    >

    <Head id="pdf">Multiple editions?</Head>
    <Paragraph
        >Yes, each Bookish book is a series of editions. You can make a new
        edition at any time, which copies your latest edition, and then you can
        make edits and describe a summary of what changed.</Paragraph
    >

    <Head id="pdf">WCAG compliance?</Head>

    <Paragraph
        >We aspire to meet and exceed all <Link
            to="https://www.w3.org/TR/WCAG21/">WCAG 2.1 guidelines</Link
        >. We are always finding new ways to verify and improve accessibility,
        however, and web standards are always evolving, so accessibility will
        always be an ongoing project. See our <Link
            to="https://github.com/amyjko/bookish/issues?q=is%3Aissue+is%3Aopen+label%3Adefect"
            >open issues</Link
        > for any open accessibility problems.</Paragraph
    >

    <Head id="feedback">How do I give feedback?</Head>

    <Paragraph>
        Do you have feedback or want to contribute to the plaform? The project
        is free and open source <Link to="https://github.com/amyjko/bookish"
            >on GitHub</Link
        >. Write <Link to="mailto:ajko@uw.edu">Amy</Link> if you'd like to collaborate,
        or <Link to="https://github.com/amyjko/bookish/issues"
            >submit an issue</Link
        > or <Link to="https://github.com/amyjko/bookish/pulls"
            >pull request</Link
        > directly. Note that this is not a full-time project for Amy, so it will
        progress leisurely; defects take priority over new features.
    </Paragraph>
</Section>
