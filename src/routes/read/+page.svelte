<script lang="ts">
    import { createBookInFirestore, loadBookFromFirestore, loadPublishedBooksFromFirestore, loadUsersBooksFromFirestore } from '$lib/models/Firestore';
    import BookPreview from '$lib/components/BookPreview.svelte'
    import type Book from "$lib/models/book/Book"
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
	import Alert from "$lib/components/page/Alert.svelte";

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

<h1>Read</h1>

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