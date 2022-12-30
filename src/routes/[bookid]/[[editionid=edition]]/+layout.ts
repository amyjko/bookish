import loadEdition from '$lib/models/loadEdition';

export async function load(context: { params: Record<string, string> }) {
    return await loadEdition(
        context.params.bookid,
        context.params.editionid,
        true
    );
}
