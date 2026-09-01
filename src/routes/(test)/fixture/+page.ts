import { error } from '@sveltejs/kit';
import { PUBLIC_CONTEXT } from '$env/static/public';

/**
 * This fixture page exists only for local testing and CI smoke tests
 * (see e2e/). It is compiled out of staged and released builds.
 */
export function load() {
    if (PUBLIC_CONTEXT !== 'local') error(404, 'Not found');
}
