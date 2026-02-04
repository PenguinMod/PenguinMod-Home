import { error } from '@sveltejs/kit'
import { browser } from '$app/environment';

import ProjectApi from "../../../resources/projectapi.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
    if (!browser) throw error(404);

    let meta
    try {
        meta = await ProjectApi.getProjectMeta(params.slug)
    } catch {
        throw error(404)
    }

    return {
        meta: meta
    }
}