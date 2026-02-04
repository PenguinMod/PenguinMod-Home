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
        })
    },
    //preprocess: [vitePreprocess()]
};