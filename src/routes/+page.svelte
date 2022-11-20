<script lang="ts">
    import External from "$lib/components/External.svelte";
    import Title from "$lib/components/page/Title.svelte";
</script>

<Title>Bookish</Title>

<div class="bookish-app-callout">Bookish is a platform for reading and writing simple, accessible, beautiful online books.</div>

<div class="bookish-app-text">

    <p>
        Why not use print publishers, e-book platforms, or innovative platforms like <External to="https://www.pubpub.org">PubPub</External>?
    </p>

    <ol>
        <li>
            <strong>Simplicity</strong>. 
            Other platforms are complicated!
            Print is full gatekeeping and other digital platforms, despite being open, have complex tools and infrastructure. 
            Bookish tries to offer the simplest possible way to write and share, like a Google Docs for books.
        </li>
        <li>
            <strong>Accessibility</strong>.
            Most platforms produce books that are incompatible with screen readers.
            Bookish ensures that books are readable on any device by any person with a standard web browser.
        </li>
        <li>
            <strong>Beauty</strong>.
            Typography matters. 
            Print books can be beautiful, but are complex to make and inaccessible.
            Many e-book and web-based book platforms are … less than beautiful, focusing on navigation over reading.
            Bookish tries to prioritizes content over structure.
        </li>
    </ol>

    <p>
        Bookish is is built and maintained by <External to="http://amyjko.com">Amy J. Ko</External>, a Professor at the <External to="https://www.washington.edu/">University of Washington</External> <External to="https://ischool.uw.edu">Information School</External>.
        She originally built Bookish to write books to support her teaching.
    </p>

    <p>
        Do you have feedback about Bookish, or want to contribute?
        The project is free and open source <External to="https://github.com/amyjko/bookish">on GitHub</External>.
        Write <a href="mailto:ajko@uw.edu">Amy</a> if you'd like to collaborate, or <External to="https://github.com/amyjko/bookish/issues">submit an issue</External> or <External to="https://github.com/amyjko/bookish/pulls">pull request</External> directly.
    </p>
</div>

<style>
    .bookish-app-callout {
        font-size: x-large;
        margin: 1em;
    }

    .bookish-app-text, .bookish-app-text p {
        text-align: left;
        padding-left: 2rem;
        padding-right: 2rem;
        margin: auto;
        margin-bottom: 2rem;
        max-width: 40rem;
    }

</style>