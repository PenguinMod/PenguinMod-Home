import { error } from '@sveltejs/kit'

import ProjectApi from "../../../resources/projectapi.js";

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
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