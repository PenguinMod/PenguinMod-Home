import adapter from '@sveltejs/adapter-static';

export default {
    kit: {
        adapter: adapter({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'public',
            assets: 'public',
            fallback: '404.html',
            precompress: false,
            strict: true
        }),
        prerender: {
            handleHttpError: ({ path, referrer, message }) => {
                // https://svelte.dev/docs/kit/configuration#prerender
                if (path && path.startsWith("/api")) return; // whatever bro js render
                switch (path) {
                    case "/error":
                    case "/contact.html":
                        return;
                }

                // otherwise fail the build
                throw new Error(message);
            }
        }
    },
    //preprocess: [vitePreprocess()]
};