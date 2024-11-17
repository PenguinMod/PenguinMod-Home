<script>
    import { onMount } from "svelte";

    export let username = "";
    export let image = "/navicon.png";
    export let showname = false;
    export let showpfp = true;
    export let showdeleted = false;
    export let status = 1; // 1 for first icon
    
    export let detail = 1; // 1 is image & status, 2 adds status labels, 3 adds punishment info, and 4 adds mod messages section
    export let messagecount = 0;
    
	import LocalizedText from "$lib/LocalizedText/Node.svelte";
	import Translations from "../../resources/translations.js";
	import Language from "../../resources/language.js";
    
	let currentLang = "en";
	onMount(() => {
		Language.forceUpdate();
	});
	Language.onChange((lang) => {
		currentLang = lang;
	});

    const localeText = {
        icon: {
            [1]: "full",
            [2]: "limited",
            [3]: "tempban",
            [4]: "ban",
        },
        descriptive: {
            [1]: "full",
            [2]: "limited",
            [3]: "ban",
            [4]: "ban",
        },
    };
</script>

<div class="display">
    {#if showpfp}
        <img
            src={image}
            alt={username}
            title={username}
            class="pfp"
        />
    {/if}
    {#if showname}
        <h1 style="margin-block:4px;">{username}</h1>
    {/if}

    <div class="status-section" data-detail={detail}>
        <div class="status-line" />
        <div data-detail="1" data-selected={status === 1}>
            <p>
                <LocalizedText
                    text="Full Access"
                    key="account.settings.standing.visual.{localeText.icon[1]}"
                    lang={currentLang}
                />
            </p>
        </div>
        <div data-detail="2" data-selected={status === 2}>
            <p>
                <LocalizedText
                    text="Limited"
                    key="account.settings.standing.visual.{localeText.icon[2]}"
                    lang={currentLang}
                />
            </p>
        </div>
        <div data-detail="3" data-selected={status === 3}>
            <p>
                <LocalizedText
                    text="Temporarily Banned"
                    key="account.settings.standing.visual.{localeText.icon[3]}"
                    lang={currentLang}
                />
            </p>
        </div>
        <div data-detail="4" data-selected={status === 4}>
            <p>
                <LocalizedText
                    text="Banned"
                    key="account.settings.standing.visual.{localeText.icon[4]}"
                    lang={currentLang}
                />
            </p>
        </div>
    </div>

    {#if detail >= 3}
        <div class="detail-section">
            <p>
                {#if showdeleted && status === 4}
                    <LocalizedText
                        text="Your account has been deleted."
                        key="account.settings.standing.descriptive.deleted"
                        lang={currentLang}
                    />
                {:else}
                    <LocalizedText
                        text="Your account does not currently have any punishments on it."
                        key="account.settings.standing.descriptive.{localeText.descriptive[status]}"
                        lang={currentLang}
                    />
                {/if}
            </p>

            {#if detail >= 4}
                <h2>
                    {#if messagecount > 9}
                        <LocalizedText
                            text="Moderator Messages (9+)"
                            key="account.settings.standing.messages.toomany"
                            lang={currentLang}
                        />
                    {:else}
                        <LocalizedText
                            text={"Moderator Messages ({{COUNT}})"}
                            key="account.settings.standing.messages"
                            lang={currentLang}
                            replace={{
                                "{{COUNT}}": messagecount,
                            }}
                        />
                    {/if}
                </h2>
                <a href="/messages">
                    <LocalizedText
                        text="Click here to visit the Messages tab."
                        key="account.settings.standing.messages.link"
                        lang={currentLang}
                    />
                </a>
            {/if}
        </div>
    {/if}
</div>

<style>
    .display {
        display: flex;
        align-items: center;
        flex-direction: column;
    }
    .pfp {
        width: 128px;
        height: 128px;
        border-radius: 4px;
    }

    .status-section {
        position: relative;

        width: 80%;
        height: calc(32px + 16px); /* current status pointer is 16px */

        display: flex;
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
    }
    .status-section div[data-detail] {
        position: relative;
        width: 32px;
        height: 32px;

        background-size: 100%;
        background-repeat: no-repeat;
        z-index: 4;
    }
    .status-section[data-detail="1"] p {
        display: none;
    }
    .status-line {
        position: absolute;
        left: 16px;
        top: calc(((32px / 2) - (4px / 2)) + 16px);
        width: calc(100% - 32px);
        height: 4px;

        background-color: rgba(0, 0, 0, 0.1);
        z-index: -5;
    }
    :global(body.dark-mode) .status-line {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .status-section div[data-detail="1"] {
        background-image: url("/account/status_good.svg");
    }
    .status-section div[data-detail="2"] {
        background-image: url("/account/status_limited.svg");
    }
    .status-section div[data-detail="3"] {
        background-image: url("/account/status_warn.svg");
    }
    .status-section div[data-detail="4"] {
        background-image: url("/account/status_banned.svg");
    }
    
    .status-section div[data-detail] p {
        position: absolute;
        top: 16px;
        left: 50%;
        width: max-content;
        height: 100%;

        /* this css is magic, if it breaks then we cannot fix it */
        transform: translateX(-50%);
        text-align: center;
        white-space: nowrap;
        overflow: visible;
    }

    .status-section div[data-selected=true]::before {
        position: absolute;
        left: calc(32px / 4);
        bottom: 32px;
        width: 16px;
        height: 16px;

        content: "";
        background-image: url("/account/standing_arrow.png");
        background-size: 100%;
        background-repeat: no-repeat;
    }
    :global(body.dark-mode) .status-section div[data-selected=true]::before {
        filter: invert(1);
    }

    .detail-section {
        margin-top: 8px;
        width: calc(100% - 16px);
    }
    
    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>