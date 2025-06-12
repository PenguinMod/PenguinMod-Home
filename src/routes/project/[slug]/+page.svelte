<script>
    import { onMount } from "svelte";
    import MarkdownIt from "markdown-it";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";

	/** @type {import('./$types').PageData} */
	export let data;
    let meta = data.meta;

    const xmlEscape = function (unsafe) {
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            }
        });
    };
    const formatEmojis = (_title) => {
        const title = xmlEscape(String(_title));
        const emojiRegex = /:(\w+):/g;
        return title.replace(emojiRegex, (match) => {
            const emojiName = match.replace(/\:/gmi, "");
            return `<img
                src="https://library.penguinmod.com/files/emojis/${emojiName}.png"
                alt=":${emojiName}:"
                title=":${emojiName}:"
                style="width:1em;vertical-align: middle;"
                loading="lazy"
            >`;
        });
    };

    //markdown
    const md = new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
    });

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx];

        // By default markdown-it will use a strange combination of <code> and <pre>; we'd rather it
        // just use <pre>
        return `<pre class="language-${md.utils.escapeHtml(
            token.info
        )}">${md.utils.escapeHtml(token.content)}</pre>`;
    };
    md.renderer.rules.image = () => {
        return `<img src="/notallowed.png" height="16"></img>`;
    };
    // Remember the old renderer if overridden, or proxy to the default renderer.
    const defaultLinkOpenRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    const doesntShowRedirectURLs = [
        /https:\/\/([a-z]+\.|)penguinmod\.com/i,
        /https:\/\/([a-z]+\.|)scratch\.org/i,
        /https:\/\/([a-z]+\.|)scratch\.mit\.edu/i,
        /https:\/\/(?!share\.)([a-z]+\.)?turbowarp\.org/i,
    ];
    const safeURLs = [
        /https:\/\/([a-z]+\.|)penguinmod\.com/i,
        /https:\/\/([a-z]+\.|)scratch\.org/i,
        /https:\/\/([a-z]+\.|)scratch\.mit\.edu/i,
        /https:\/\/([a-z]+\.|)turbowarp\.org/i,
        /https:\/\/([a-z]+\.|)cocrea\.world/i,
        /https:\/\/([a-z]+\.|)getgandi\.com/i,
        /https:\/\/([a-z]+\.|)snail-ide\.com/i,
        /https:\/\/snail-ide\.js\.org/i,
        /https:\/\/snail-ide\.github\.io/i,
        /https:\/\/snail-ide\.vercel\.app/i,

        /https:\/\/(www\.|)(roblox|youtube|discord|twitter|x|patreon|reddit)\.com/i,
        /https:\/\/old\.reddit\.com/i,
        /https:\/\/create\.roblox\.com/i,
        /https:\/\/(www\.|)discord\.gg/i,
        /https:\/\/(www\.|support\.|)guilded\.gg/i,
        /https:\/\/(www\.|gist\.|)github\.com/i,
        /https:\/\/(www\.|store\.|support\.|help\.|)(steampowered|steamcommunity)\.com/i,
    ];
    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const href = String(tokens[idx].attrGet('href'));
        // only force open in new tab if we are not penguinmod.com
        if (!href.match(safeURLs[1])) {
            tokens[idx].attrSet('target', '_blank');
        }
        // if we match a URL that should show a redirect, change the href attribute
        if (!doesntShowRedirectURLs.some(regex => href.match(regex))) {
            const base64 = encodeURIComponent(btoa(href));
            tokens[idx].attrSet('href', `https://penguinmod.com/redirect?t=${base64}`);
        }

        // disables clicking on non-verified links
        if (!safeURLs.some(regex => href.match(regex))) {
            return '';
        }

        // Pass the token to the default renderer.
        return defaultLinkOpenRender(tokens, idx, options, env, self);
    };
    
    const defaultTextRender = md.renderer.rules.text || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    
    const regexRules = {
        // we have to use far more sophisticated regex here due to weird url behavior
        // due to browser compat, we do this in the next comment
        project: /#([\w-]+)/g,
        user: /@([\w-]+)/g,
        emoji: /:(\w+):/g
    }
    // certain iOS devices do not support lookbehind-assertion, and will throw an error
    // this was present in Scratch for Discord for a bit, before i just replaced the regex entirely
    // we can handle this horrible behavior properly though:
    try {
        regexRules.project = new RegExp('(?<!\\b(?:https?:\\/\\/|www\\.)\\S*)#(\\w+|\\d+)(?!\\S)', 'g');
        regexRules.user = new RegExp('(?<!\\b(?:https?:\\/\\/|www\\.)\\S*)@(\\w+|\\d+)(?!\\S)', 'g');
    } catch {
        // iOS users will experience weird gaps and or urls with hashtags leading to 2 different places
        regexRules.project = /#([\w-]+)/g;
        regexRules.user = /@([\w-]+)/g,
        console.warn('Browser does not support lookbehind assertion in regex');
    }

    md.renderer.rules.text = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        
        let textChanged = false;
        let newText = `${md.utils.escapeHtml(token.content)}`;
        if (newText.match(regexRules.project)) {
            newText = newText.replace(regexRules.project, function(id) {
                id = id.replace('#', '');
                if (/^\d{6,}$/.test(id)) {
                    return `<a href="/project/${id}" target="_blank">#${id}</a>`;
                }
                return `<a href="https://penguinmod.com/search?q=%23${id}">#${id}</a>`;
            });
            textChanged = true;
        }
        if (newText.match(regexRules.user)) {
            newText = newText.replace(regexRules.user, function(name) {
                name = name.replace('@', '');
                return `<a href="https://penguinmod.com/profile?user=${name}">@${name}</a>`;
            });
            textChanged = true;
        }
        if (newText.match(regexRules.emoji)) {
            newText = newText.replace(regexRules.emoji, function(text) {
                const emojiName = text.replace(/:/gmi, '');
                return `<img
                    src="https://library.penguinmod.com/files/emojis/${emojiName}.png"
                    alt="${emojiName}"
                    title=":${emojiName}:"
                    class="profile-bio-emoji"
                    loading="lazy"
                />`;
            });
            textChanged = true;
        }

        if (textChanged) {
            return newText;
        }

        // Pass the token to the default renderer.
        return defaultTextRender(tokens, idx, options, env, self);
    };

    const env = {};
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };

    onMount(() => {
        window.copyText = (text) => {
            var dummy = document.createElement('input')

            document.body.appendChild(dummy);
            dummy.value = text;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);
        }
    })
</script>

<svelte:head>
    <title>PenguinMod - {meta.title}</title>
    <meta name="title" content="PenguinMod - {meta.title}" />
    <meta property="og:title" content="PenguinMod - {meta.title}" />
    <meta property="twitter:title" content="PenguinMod - {meta.title}">
    <meta property="og:url" content="https://penguinmod.com/project/{meta.id}">
    <meta property="twitter:url" content="https://penguinmod.com/project/{meta.id}">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />
    <main>
        <div class="namebar">
            <img
                src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={meta.author.username}&reload=false"
                alt="{meta.author.username}"
                draggable="false"
                onclick="window.open('/profile?user={meta.author.username}')"
            />
            <div class="details">
                <span class="title">{@html formatEmojis(meta.title)}</span>
                <span class="author">by {meta.author.username}</span>
            </div>
        </div>
        <div class="enter">
            <img
                src="{PUBLIC_API_URL}/api/v1/projects/getproject?projectID={meta.id}&requestType=thumbnail"
                alt="{meta.title}"
                onclick="window.open('{PUBLIC_STUDIO_URL}/#{meta.id}')"
            />
            <div class="play" />
        </div>
        <div class="horizflex">
            <div class="desc">
                {#if meta.instructions || meta.credits}
                    {#if meta.instructions}
                        <b>Instructions</b><br>
                        {@html generateMarkdown(meta.instructions)}
                    {/if}
                    {#if meta.credits}
                        <b>Credits</b><br>
                        {@html generateMarkdown(meta.credits)}
                    {/if}
                {:else}
                    <p>No description provided.</p>
                {/if}
                <br>
                <span class="copylink" onclick="copyText(document.location.href)">Copy Link</span>
            </div>
            <div class="ratings">
                <div class="rating love">
                    <img src="/projectimages/love.svg" alt="Loves" />
                    <span>{meta.loves}</span>
                </div>
                <div class="rating vote">
                    <img src="/projectimages/vote.svg" alt="Features" />
                    <span>{meta.votes}</span>
                </div>
                <div class="rating views">
                    <img src="/projectimages/view.svg" alt="Views" />
                    <span>{meta.views}</span>
                </div>
            </div>
        </div>
    </main>
</div>

<style lang="scss">
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        width: 75%;
        min-width: 640px;
        max-width: 1280px;
        margin: auto; 
    }

    .enter {
        width: 100%;
        height: 70vh;
        border-radius: 8px;
        margin: 16px 0px;
        cursor: pointer;

        & > img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            background-color: #fff;
            border: 4px solid var(--penguinmod-color);
            border-radius: 8px;
            box-sizing: border-box;
        
            &:hover {
                filter: blur(16px);
                opacity: 0.7;
            }
            transition: 0.5s;
        }

        & > .play {
            display: inline-block;
            position: absolute;
            width: 96px;
            height: 96px;
            padding: 16px;
            top: calc(50% - 64px);
            left: calc(50% - 64px);
            border: 4px #0bf8 solid;
            background: url("/stage_controls/gradient/flag.svg");
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 100%;
            z-index: 2;
            opacity: 0;
            filter: blur(32px);
            transition: 0.5s;
            pointer-events: none;
        } 
        &:hover > .play {
            opacity: 1;
            filter: none;
        }
    }  

    .namebar {
        height: 64px;
        display: flex;
        gap: 8px;

        & > img {
            height: 64px;
            border-radius: 8px;
            aspect-ratio: 1;
            cursor: pointer;
        }

        & > .details {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            width: calc(100% - 72px);

            & > .title {
                font-size: 28px;
                font-weight: bold;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            & > .author {
                opacity: 0.7;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    .horizflex {
        display: flex;
        justify-content: space-between;
    }

    .ratings {
        display: flex;
        gap: 32px;

        & > .rating {
            display: flex;
            position: relative;
            align-items: center;
            justify-content: center;
            width: 72px;
            height: 72px;
            border-radius: 24px;
            background-color: #888;
            border: 1px solid #0004;
            box-sizing: border-box;
            font-size: 20px;
            font-weight: bold;

            & img {
                position: absolute;
                width: 64px;
            }

            & span {
                z-index: 2;
            }

            &.love {
                background-color: #ff639c;
            }
            &.vote {
                background-color: #ffc163;
            }
            &.views {
                background-color: #63cbff;
            }
        }
    }

    .desc {
        border: 1px solid #b9d6ff;
        background-color: #dbebff;
        padding: 8px;
        box-sizing: border-box;
        border-radius: 8px;
        width: calc(100% - 312px);

        & p {
            white-space: pre-wrap;
        }

        & > .copylink {
            color: var(--penguinmod-color);
            font-weight: bold;
            text-decoration: underline;
            cursor: pointer;
            user-select: none;
        }
    }

    :global(body.dark-mode) {
        & .ratings {
            & > .rating {
                border-color: #fff4;

                &.love {
                    background-color: #d23a71;
                }
                &.vote {
                    background-color: #e7ac2d;
                }
                &.views {
                    background-color: #3391df;
                }
            }
        }

        & .desc {
            border-color: #203652;
            background-color: #16202c;
        }
    }
</style>