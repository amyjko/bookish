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

    <Head>Beta</Head>

    <Paragraph
        >Bookish is currently in <em>beta</em>. That means there are likely to
        be defects, including those that result in loss of content. We'll remove
        this label when we're confident that the platform can reliably serve
        both readers and writers. See our <Link
            to="https://github.com/amyjko/bookish/issues?q=is%3Aissue+is%3Aopen+label%3Adefect"
            >list of defects</Link
        > to check our progress (and help, if you are able).</Paragraph
    >

    <Head>Costs</Head>

    <Paragraph>
        Using Bookish to write books will always be free. However, hosting is
        not free and particularly widely read books can incur costs that Amy
        can't pay alone. She is considering models for covering bandwidth costs
        from reading such per-book fees or donations. If you have ideas, <Link
            to="https://github.com/amyjko/bookish/issues/251"
            >join the discussion</Link
        >.
    </Paragraph>

    <Head>Vision</Head>

    <Paragraph>
        As with any publisher, Bookish as an editorial policy and philosophy.
        Much like university publishers (e.g., <Link
            to="https://mitpress.mit.edu/about/">MIT Press</Link
        >), Amy views the mission of Bookish as <em>scholarly</em>: books on the
        platform should advance knowledge, educate the public, and be informed
        by other scholarly work. However, Bookish is particularly interested in
        works that advance progress toward a society that
        <em
            >radically embraces the beautiful diversity of humanity and nature
            and seeks to dismantle systems and ideas that get in the way.</em
        > While this definitely includes works broadly explicitly about social justice
        toopics such as diversity, equality, equity, inclusion, justice, accessibility,
        sustainability, indigienous sovereignty, it also includes works that discuss
        more strictly technical ideas in sociotechnical ways.
    </Paragraph>

    <Head>Editing</Head>

    <Paragraph
        >For now, anyone can create an account and write books, but publishing
        rights are <strong>invitation only</strong>. <Link
            to="mailto:amy@amyjko.com">Write Amy</Link
        > to arrange a time to discuss your your vision, to ensure it aligns with
        our editioral mission. Amy retains the right to revoke publishing rights
        and unpublish books that do not align with the vision above; publishing on
        the platform is a privilege, not a right.</Paragraph
    >

    <Paragraph>
        That said, if your vision does not align with ours, you can still use
        Bookish to write your book and export a version for hosting elsewhere.
        You could even use the Bookish source to host your own press with a
        different editorial vision.
    </Paragraph>

    <Head>Feedback</Head>

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
        progress will be leisurely; defects take priority over new features.
    </Paragraph>
</Section>
