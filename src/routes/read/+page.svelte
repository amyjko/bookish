<script lang="ts">
    import { loadPublishedBooksFromFirestore } from '$lib/models/Firestore';
    import BookPreview from '$lib/components/BookPreview.svelte'
    import type Book from "$lib/models/book/Book"
    import { onMount } from 'svelte';
	import Alert from "$lib/components/page/Alert.svelte";
    import Title from '$lib/components/page/Title.svelte';

	let books: Book[] = [];
	let loading = true;
	let error = "";

	function updateBooks() {
        loadPublishedBooksFromFirestore().then(loadedBooks => {
            loading = false;
            if(loadedBooks === null)
                error = "Unable to load books";
            else
                books = loadedBooks;
        })
	}

	// Get the books when the component loads.
	onMount(() => {
		updateBooks()
	});
	
</script>

<Title>Read</Title>

<p>
    Books you can read.
</p>

{#if error }
    <Alert>{error}</Alert>
{:else if loading }
    <p>Loading books...</p>
{:else}
    {#each books as book }
        <BookPreview book={book} write={false} />
    {:else}
        <p>No published books to read.</p>
    {/each}
{/if}