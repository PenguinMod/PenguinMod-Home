<script>
    /** @type {import('./$types').PageData} */
    export let data;

    import { onMount } from "svelte";
    import { browser } from '$app/environment';
    import MarkdownIt from "markdown-it";
    import DevPostsPages from "../../../resources/markdown/devposts/pages";

    const markdownSource = DevPostsPages[data.slug] || "404 Page Not Found";
    if (markdownSource === '404 Page Not Found' && browser) {
        location.href = location.origin + '/error?error=404';
    }

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        breaks: true,
    });

    md.renderer.rules.fence = function (tokens, idx) {
        const token = tokens[idx];

        if (token.info === "warning") {
            return `<div class="guidelines-warning-box">${md.utils.escapeHtml(
                token.content
            )}</div>`;
        }

        // By default markdown-it will use a strange combination of <code> and <pre>; we'd rather it
        // just use <pre>
        return `<pre class="language-${md.utils.escapeHtml(
            token.info
        )}">${md.utils.escapeHtml(token.content)}</pre>`;
    };

    const env = {};
    const tokens = md.parse(markdownSource, env);

    const bodyHTML = md.renderer.render(tokens, md.options, env);
</script>

<svelte:head>
    <title>PenguinMod - Developer Post</title>
    <meta name="title"                   content="PenguinMod - Developer Post" />
    <meta property="og:title"            content="PenguinMod - Developer Post" />
    <meta property="twitter:title"       content="PenguinMod - Developer Post" />
</svelte:head>

<div class="container">
    <img
        src="/devposts/{data.slug}.webp"
        alt={data.slug}
        class="event-banner"
    >

    {@html bodyHTML}
</div>

<style>
    .container {
        margin: 0 20%;
        width: 60%;
    }
    
    .event-banner {
        width: 100%;
        height: 320px;
        object-fit: cover;
        margin: 8px 0;
        border-radius: 8px;
    }
    
    :global(h1),
    :global(h2) {
        color: rgb(0, 102, 255);
    }
    :global(a) {
        color: rgb(30, 83, 255);
    }

    :global(body.dark-mode) :global(h1),
    :global(body.dark-mode) :global(h2) {
        color: rgb(93, 174, 255);
    }
    :global(body.dark-mode) :global(a) {
        color: dodgerblue;
    }
</style>
