<script lang="ts">
    import type Book from "$lib/models/book/Book";
    import type Edition from "$lib/models/book/Edition";
    import { BookSaveStatus } from "$lib/models/book/Edition";
    import { onMount } from "svelte";

    export let book: Book | undefined;
    export let edition: Edition;

	let status: BookSaveStatus = BookSaveStatus.Saved;

	function handleBookChange(newStatus: BookSaveStatus) {
		status = newStatus;
	}

	// Listen to book and chapter changes.
	onMount(() => {

		book?.addListener(status => handleBookChange(status));
		edition.addListener((status) => handleBookChange(status));
		return () => { 
			book?.removeListener(handleBookChange);
			edition.removeListener(handleBookChange); 
		}
	});

</script>

<div class={`bookish-editor-status ${status === BookSaveStatus.Saving ? "bookish-editor-status-saving" : status === BookSaveStatus.Error ? "bookish-editor-status-error" : ""}`}>
    {
        status === BookSaveStatus.Changed ? "\u270E Editing" :
        status === BookSaveStatus.Saving ? "\u2026 Saving" :
        status === BookSaveStatus.Saved ? "\u2713 Saved" :
        status === BookSaveStatus.Error ? "\u2715 Couldn't save." :
        ""
    }
</div>

<style>
    .bookish-editor-status {
        position: fixed;
        top: var(--bookish-app-chrome-spacing);
        right: var(--bookish-app-chrome-spacing);
        z-index: 3;
        color: var(--bookish-muted-color);
        font-family: var(--bookish-header-font-family);
        font-size: var(--bookish-small-font-size);
    }

    .bookish-editor-status-error {
        color: var(--bookish-app-error-color);
        animation: failure 100ms infinite;
    }

    .bookish-editor-status-saving {
        animation: waiting 100ms infinite;
    }

    @keyframes waiting {
        from, to { transform: scale(1, 1); }
        25% { transform: scale(1, 1.2); }
        50% { transform: scale(1, 1.0); }
        75% { transform: scale(1, 1.1); }
    }

</style>