import { loadBookFromFirestore } from "$lib/models/Firestore";
import { error } from "@sveltejs/kit";

export async function load(context: { params: Record<string,string> }) {

    const book = await loadBookFromFirestore(context.params.bookid);

    const editionNumber = context.params.editionid === undefined ? undefined : parseInt(context.params.editionid);
    const edition = editionNumber === undefined || isNaN(editionNumber) ? await book.getDraftEdition() : await book.getEditionNumber(editionNumber);

    if(edition === undefined)
        throw error(404, "Not found");

    return { book: book, edition: edition };

}