<script lang="ts">
    import TextEditor from '$lib/components/editor/TextEditor.svelte';
    import { isSubdomainAvailable } from '$lib/models/CRUD';
    import { getSubdomain } from '$lib/util/getSubdomain';
    import { getBook } from './Contexts';
    import Muted from './Muted.svelte';

    let book = getBook();

    const invalidNames: string[] = [
        'email',
        'login',
        'confirm',
        'about',
        'read',
        'write',
    ];
</script>

{#if $book}
    <Muted>
        <em>bookish.press/</em><TextEditor
            text={$book.getSubdomain() ?? ''}
            label="Book domain editor"
            save={// Save the new domain
            async (domain) => {
                if ($book) {
                    const available = await isSubdomainAvailable(domain);
                    if (available) book.set($book.withSubdomain(domain));
                    else if ($book.getSubdomain() !== domain)
                        throw Error("Domain isn't available");
                }
            }}
            placeholder="book name"
            valid={(newDomain) =>
                // If not the empty string, must be a valid URL subdomain, and none of the existing routes.
                invalidNames.includes(newDomain) ||
                (newDomain.length > 0 &&
                    !/^[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?$/.test(
                        newDomain
                    ))
                    ? `Book IDs must be fewer than 63 characters, made of symbols a-z, A-Z, and 0-9, and not one of ${invalidNames.join(
                          ', '
                      )}.`
                    : undefined}
            saveOnExit={true}
        />
    </Muted>
{/if}
