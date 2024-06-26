import { redirect } from '@sveltejs/kit'

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
    throw redirect(301, `/report?type=project&id=${params.slug}`)
}