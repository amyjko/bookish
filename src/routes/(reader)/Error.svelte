<section>
    <h1>Oops</h1>

    <p><slot /></p>
</section>

<style>
    /* Custom fonts for app */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&display=swap');

    section {
        position: fixed;
        top: 25;
        left: 50%;
        transform: translateX(-50%);
        width: 20em;
        font-family: 'Outfit', sans-serif;
        font-size: x-large;
    }

    :global(a) {
        color: black;
    }
</style>
