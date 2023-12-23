<script>
    /** @type {import('./$types').PageData} */
    export let data;

    // import { onMount } from "svelte";
    import MarkdownIt from "markdown-it";
    import GuidelinePages from "../../../resources/guidelines/pages";

    const markdownSource = GuidelinePages[data.slug];

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        breaks: true,
    });

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
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

    // Extract the header
    let headerHTML = "## file did not contain header ##";
    let headerText = headerHTML;
    const headerStart = tokens.findIndex(
        (token) => token.type === "heading_open" && token.tag === "h1"
    );
    const headerEnd = tokens.findIndex(
        (token) => token.type === "heading_close" && token.tag === "h1"
    );
    if (headerStart !== -1 && headerEnd !== -1) {
        const headerTokens = tokens.splice(
            headerStart,
            headerEnd - headerStart + 1
        );

        // Discard the header tokens themselves, but render the HTML title with any formatting
        headerTokens.shift();
        headerTokens.pop();
        headerHTML = md.renderer.render(headerTokens, md.options, env);

        // We also need a no-formatting version for the title
        const justTextTokens = headerTokens.filter(
            (token) => token.type === "inline"
        );
        headerText = md.renderer.render(justTextTokens, md.options, env);
    }

    const bodyHTML = md.renderer.render(tokens, md.options, env);

    // const usesScratchBlocks = env.usesScratchBlocks;
    // if (usesScratchBlocks) {
    //     onMount(() => {
    //         scratchblocks.init();
    //         scratchblocks.module.renderMatching(".render-scratchblocks", {
    //             style: "scratch3",
    //         });
    //     });
    // }
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
    <h1>{@html headerHTML}</h1>

    {@html bodyHTML}
</div>

<style>
    .container {
        margin: 0 20%;
        width: 60%;
    }
    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
