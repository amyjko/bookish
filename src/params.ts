import { defineParams } from '@sveltejs/kit/params';

function matchEdition(param: string) {
    return /^\d+$/.test(param);
}

export const params = defineParams({
    edition: (param) => (matchEdition(param) ? param : undefined),
});
