import { PUBLIC_API_URL } from "$env/static/public";

export async function load({ url }) {
    const username = url.searchParams.get("user") ?? "";
    const idQuery = url.searchParams.get("id") ?? "";

    let resolvedUsername = username;

    if (idQuery && !username) {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/api/v1/users/getusername?id=${idQuery}`);
            const data = await res.json();
            resolvedUsername = data.username ?? "";
        } catch {
            resolvedUsername = "";
        }
    }

    let bio = "";
    let displayName = resolvedUsername;

    try {
        const res = await fetch(`${PUBLIC_API_URL}/api/v1/users/getprofile?username=${resolvedUsername}&extra=true`);
        const profile = await res.json();
        bio = profile.bio ?? "";
        displayName = profile.real_username ?? resolvedUsername;
    } catch {
        // epic fail
    }

    return { resolvedUsername, displayName, bio };
}