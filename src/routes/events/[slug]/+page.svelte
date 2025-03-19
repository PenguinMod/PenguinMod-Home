<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import { browser } from '$app/environment';
    

    /** @type {import('./$types').PageData} */
    export let data;

    // import { onMount } from "svelte";
    import MarkdownIt from "markdown-it";
    import EventPages from "../../../resources/markdown/events/pages";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../../resources/translations.js";
    import Language from "../../../resources/language.js";

    const eventPath = data.slug;
    const language = $page.url.searchParams.get('l');
    if (!EventPages[eventPath] && browser) {
        location.href = location.origin + '/error?error=404';
    }

    const markdownSource = (EventPages[eventPath] || {})[language] || "404 no such file exists";

    const md = new MarkdownIt({
        html: true,
        linkify: true,
        breaks: true,
    });

    let eventHost = "";
    let eventCollaborator = "";
    
    let currentLang = "en";
    let hasLoadedLang = false;
    onMount(() => {
        Language.forceUpdate();
        hasLoadedLang = true;
    });
    Language.onChange((lang) => {
        currentLang = lang;
        if (language !== lang && EventPages[eventPath][lang] && window.location.pathname.includes('/events/')) {
            window.location.search = `?l=${lang}`;
        }
    });

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx];

        if (token.info === "warning") {
            return `<div class="guidelines-warning-box">${md.utils.escapeHtml(
                token.content
            )}</div>`;
        }

        if (token.info === "host") {
            eventHost = `${md.utils.escapeHtml(token.content)}`.trim();
            return '';
        }
        if (token.info === "collab") {
            eventCollaborator = `${md.utils.escapeHtml(token.content)}`.trim();
            return '';
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
    <title>PenguinMod - {headerText}</title>
    <meta name="title"                   content="PenguinMod - {headerText}" />
    <meta property="og:title"            content="PenguinMod - {headerText}" />
    <meta property="twitter:title"       content="PenguinMod - {headerText}">
    <meta name="description"             content="View this event on PenguinMod's website!">
    <meta property="twitter:description" content="View this event on PenguinMod's website!">
    <meta property="og:url"              content="https://penguinmod.com/events/{eventPath}">
    <meta property="twitter:url"         content="https://penguinmod.com/events/{eventPath}">
</svelte:head>

<div class="container">
    <h1>{@html headerHTML}</h1>

    {#if currentLang !== language && hasLoadedLang}
        <LocalizedText
            text="This event is not translated for your language at the moment. Sorry! :("
            key="event.nottranslated"
            lang={currentLang}
        />
    {/if}
    
    {#if eventHost}
        <p><i>
            {String(TranslationHandler.text(
                "event.host",
                currentLang
            ) || TranslationHandler.text(
                "event.host",
                'en'
            ))
            .replace('$1', eventHost)}
        </i></p>
    {/if}
    {#if eventCollaborator}
        <p><i>
            {String(TranslationHandler.text(
                "event.collab",
                currentLang
            ) || TranslationHandler.text(
                "event.collab",
                'en'
            ))
            .replace('$1', eventCollaborator)}
        </i></p>
    {/if}

    <img
        src="/events/{language}/{eventPath}.webp"
        alt={headerText}
        class="event-banner"
    >

    {@html bodyHTML}
</div>

<style>
    .container {
        margin: 0 15%;
        width: 70%;
    }
    :global(body.dark-mode) :global(a) {
        color: dodgerblue;
    }
    
    .event-banner {
        width: 100%;
        height: 320px;
        object-fit: cover;
        margin: 8px 0;
        border-radius: 8px;
    }
</style>
