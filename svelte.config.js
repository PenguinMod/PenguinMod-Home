import adapter from '@sveltejs/adapter-static';

export default {
    kit: {
        adapter: adapter({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'public',
            assets: 'public',
            fallback: undefined,
            precompress: false,
            strict: true
        }),
        prerender: {
            handleHttpError: ({ path, referrer, message }) => {
                // https://svelte.dev/docs/kit/configuration#prerender
                switch (path) {
                    case "/error":
                    case "/api/v1/projects/getproject":
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