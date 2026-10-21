<script>
    /** @type {import('./$types').PageData} */
    export let data;

    import { onMount } from "svelte";
    import { browser } from '$app/environment';
    import MarkdownIt from "markdown-it";
    import GuidelinePages from "../../../resources/markdown/guidelines/pages";

    const markdownSource = GuidelinePages[data.slug] || "404 Page Not Found";
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
    <title>PenguinMod - Uploading Guidelines</title>
    <meta name="title"                   content="PenguinMod - Uploading Guidelines" />
    <meta property="og:title"            content="PenguinMod - Uploading Guidelines" />
    <meta property="twitter:title"       content="PenguinMod - Uploading Guidelines">
    <meta name="description"             content="PenguinMod's official rules on uploaded projects">
    <meta property="twitter:description" content="PenguinMod's official rules on uploaded projects">
    <meta property="og:url"              content="https://penguinmod.com/guidelines/uploading">
    <meta property="twitter:url"         content="https://penguinmod.com/guidelines/uploading">
</svelte:head>

<div class="container">
    {@html bodyHTML}
</div>

<style>
    .container {
        margin: 0 20%;
        width: 60%;
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
