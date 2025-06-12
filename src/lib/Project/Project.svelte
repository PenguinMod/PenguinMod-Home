<script>
    import { onMount } from "svelte";
    import Translations from "../../resources/translations.js";
    // import ProjectApi from "../../resources/projectapi.js";
    import Language from "../../resources/language.js";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    // Static values
    import LINK from "../../resources/urls.js";

    export let id;
    export let title;
    export let lastUpdate = false;
    export let featured = false;
    export let fromDonator = false;
    export let author;
    export let date = 0;
    export let style = "";

    export let linkOverride = false;
    export let openNewtab = false;

    // let isDonator = false;
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
    const formatProjectTitle = (_title) => {
        const title = xmlEscape(String(_title));
        const emojiRegex = /:(\w+):/g;
        return title.replace(emojiRegex, (match) => {
            const emojiName = match.replace(/\:/gmi, "");
            return `<img
                src="https://library.penguinmod.com/files/emojis/${emojiName}.png"
                alt=":${emojiName}:"
                title=":${emojiName}:"
                style="width:1.2rem;vertical-align: middle;"
                loading="lazy"
            >`;
        });
    };

    // translation
    let currentLang = "en";
    onMount(() => {
        if (typeof author === "string") {
            author = {
                username: localStorage.getItem("username"),
                id: author
            };
        }
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function unixToDisplayDate(unix) {
        unix = Number(unix);
        return `${new Date(unix).toLocaleString([], {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        })}`;
    }

    const projectLink = linkOverride ? linkOverride : `${LINK.base}#${id}`;
    const projectAuthorLink = linkOverride
        ? linkOverride
        : `/profile?user=${author.username}`;
</script>

<div data-featured={featured} class="project" {style}>
    <a
        href={projectLink}
        target={openNewtab ? "_blank" : "_self"}
        class="project-image"
    >
        <img
            src={`${LINK.projects}api/v1/projects/getproject?projectID=${id}&requestType=thumbnail`}
            alt="Project Thumbnail"
            class="project-image"
        />
    </a>
    <a
        href={projectAuthorLink}
        target={openNewtab ? "_blank" : "_self"}
        class="project-author"
    >
        <img
            src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${author.username}`}
            alt="Project Author"
            class="project-author"
        />
    </a>
    <div class="project-meta">
        <a
            href={projectLink}
            target={openNewtab ? "_blank" : "_self"}
            class="text project-title"
            title={title}
        >
            {@html formatProjectTitle(title)}
        </a>
        {#if lastUpdate}
            <a
                href={projectLink}
                target={openNewtab ? "_blank" : "_self"}
                class="text author date"
            >
                {unixToDisplayDate(date)}
            </a>
        {:else}
            <a
                href={projectAuthorLink}
                target={openNewtab ? "_blank" : "_self"}
                class={"text author" + (fromDonator ? " donator-name" : "")}
            >
                {author.username}
                {#if fromDonator}
                    <img
                        src="/badges/donator2.png"
                        alt="Donator"
                        height="16"
                        title={Translations.text(
                            "profile.badge.donator",
                            currentLang
                        )}
                    />
                {/if}
            </a>
        {/if}
    </div>
    <slot />
</div>

<style>
    /* animations */
    @keyframes gradient {
        0% {
            background-position: 0% 0%;
        }
        100% {
            background-position: 100% 100%;
        }
    }

    /* stuff */
    .project {
        width: 204px;
        height: 204px;
        padding: 8px 8px 2px;
        margin: 4px;
        border-radius: 4px;
        border-style: solid;
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        position: relative;
    }
    .project-image {
        width: 204px;
        height: 152px;
        border-radius: 4px;
        overflow: hidden;
        object-fit: cover;
    }
    .project-author {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        overflow: hidden;
    }
    .project-meta {
        width: calc(100% - 8px);
        overflow: hidden;
        max-width: 164px;
        float: left;
        margin-left: 8px;
    }
    :global(html[dir="rtl"]) .project-meta {
        margin-left: initial;
        margin-right: 8px;
    }
    :global(body.dark-mode) .project[data-featured="false"] {
        border-color: rgba(255, 255, 255, 0.3);
    }

    /* featured projects */
    .project[data-featured="true"] {
        background-color: #ffc400;
        background: linear-gradient(
            145deg,
            rgba(255, 196, 0, 1) 0%,
            rgba(255, 196, 0, 1) 45%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 196, 0, 1) 54%,
            rgba(255, 196, 0, 1) 100%
        );
        background-size: 300% 300%;
        animation: gradient 3s ease infinite;
    }

    .text {
        text-overflow: ellipsis;
        text-decoration: none;
        width: 100%;
        color: #4d97ff;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        font-weight: bold;
    }
    .author {
        color: #575e75;
        font-weight: normal;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .author > img {
        margin: 0 4px;
    }
    :global(body.dark-mode) .author {
        color: #9ba0b1;
        font-weight: normal;
    }
    .donator-name {
        color: #a237db;
        font-weight: bold;
    }
    :global(body.dark-mode) .donator-name {
        color: #c65cff;
        font-weight: bold;
    }
    .date {
        font-size: 10px;
    }

    /* featured projects */
    .project[data-featured="true"] .text {
        color: rgb(0, 0, 0);
    }
    .project[data-featured="true"] .author {
        color: black;
    }
    .project[data-featured="true"] .donator-name {
        color: #8f00db;
        font-weight: bold;
    }
</style>
