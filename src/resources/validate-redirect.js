import { page } from "$app/stores";
import { get } from "svelte/store";
import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

const validateRedirect = (newUrl = "") => {
    const currentOrigin = get(page).url.origin;
    try {
        const url = new URL(newUrl, currentOrigin);

        const allowedOrigins = [
            currentOrigin,
            new URL(PUBLIC_API_URL).origin,
            new URL(PUBLIC_STUDIO_URL).origin,
        ];

        if (url.protocol !== "https:" || !allowedOrigins.includes(url.origin)) {
            return currentOrigin;
        }

        return url.href;
    } catch {
        return currentOrigin;
    }
};

export default validateRedirect;