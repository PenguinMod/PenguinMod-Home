<script>
    import NavigationBar from "../../lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import { onMount } from "svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Button from "$lib/Button/Button.svelte";
    import Language from "../../resources/language.js";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    const STAGES = {
        VALIDITY: "validity",
        LOADING: "loading",
        CHECK_COMMENTS: "comments",
    };

    let stage = STAGES.VALIDITY;

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    let usernameValid = false;

    let lastUsernameType = Infinity;
    let username = null;
    function usernameInputChanged(event) {
        lastUsernameType = Date.now();

        username = event.target.value;

        usernameValid = isValidScratchUsername(username);
    }

    function isValidScratchUsername(username) {
        // only letters, numbers, -, and _, len between 3 and 20 (inclusive)
        return (
            /^[A-Za-z0-9_-]+$/.test(username) &&
            username.length >= 3 &&
            username.length <= 20
        );
    }

    const stupidPersonDoesntExist = new Set();
    async function getCode(username) {
        if (stupidPersonDoesntExist.has(username)) {
            return null;
        }

        const url = `${PUBLIC_API_URL}/api/v1/users/createaccountoauth/scratchusergetcode?username=${username}`;

        const data = await fetch(url)
            .then((res) => res.json())
            .catch(() => ({
                exists: false,
            }));

        if (!data.exists) {
            stupidPersonDoesntExist.add(username);
        }

        return data.code;
    }

    // shitty TODO: eventually, maybe we could find out a way to translate this? pass language to server.
    // although that might fall ill to a man-in-the-middle attack. idk.
    let commentCode = "";
    async function continueAfterUsernameEnter() {
        stage = STAGES.LOADING;
        commentCode = await getCode(username);
        if (!commentCode) {
            stage = STAGES.VALIDITY;
            usernameValid = false;
            return;
        } else {
            stage = STAGES.CHECK_COMMENTS;
        }
    }

    async function checkComments() {
        stage = STAGES.LOADING;
        window.location.replace(
            `${PUBLIC_API_URL}/api/v1/users/scratchcallback/createaccount?username=${username}&code=${encodeURIComponent(commentCode)}`,
        );
    }
</script>

<svelte:head>
    <title>PenguinMod - Scratch Account</title>
    <meta name="title" content="PenguinMod - Scratch Account" />
    <meta property="og:title" content="PenguinMod - Scratch Account" />
    <meta property="twitter:title" content="PenguinMod - Scratch Account" />
    <meta
        name="description"
        content="Affect your PenguinMod account using your Scratch Account."
    />
    <meta
        property="twitter:description"
        content="Affect your PenguinMod account using your Scratch Account."
    />
    <meta property="og:url" content="https://penguinmod.com/scratchaccount" />
    <meta
        property="twitter:url"
        content="https://penguinmod.com/scratchaccount"
    />
</svelte:head>

<NavigationBar />

<NavigationMargin />

<div class="main">
    <main>
        {#if stage == STAGES.VALIDITY || stage == STAGES.LOADING}
            pretty please put your scratch username here thank you thank you
            thank you

            <input
                type="text"
                placeholder="TODO: TRANSLATION NEEDED"
                data-valid={usernameValid}
                maxlength="20"
                disabled={stage != STAGES.VALIDITY}
                on:input={usernameInputChanged}
            />

            <button
                type="submit"
                data-canContinue={usernameValid}
                on:click={continueAfterUsernameEnter}
            >
                {#if stage == STAGES.LOADING}
                    <LoadingSpinner icon="/loading_white.png" />
                {:else}
                    TODO: translation --- continue
                {/if}
            </button>
        {:else if stage == STAGES.CHECK_COMMENTS}
            <!-- jeremy please make this pretty and not just text -->
            <a href={`https://scratch.mit.edu/users/${username}`}>
                your account
            </a>
            <br />
            {commentCode}
            <br />
            <button
                type="submit"
                data-canContinue={true}
                on:click={checkComments}
            >
                {#if stage == STAGES.LOADING}
                    <LoadingSpinner icon="/loading_white.png" />
                {:else}
                    TODO: translation --- i totally put that comment on my
                    account
                {/if}
            </button>
        {/if}
    </main>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: calc(100vh - 48px - 100px);
        min-width: 1000px;
        margin-top: 48px;
    }

    main {
        margin: 0 calc(35% - 33px);
        padding: 32px;
        width: 30%;

        display: flex;
        flex-direction: column;
        align-items: center;

        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        background: white;
        font-size: 14px;

        /* vertically center */
        position: absolute;
        top: 50%;
        -ms-transform: translateY(-50%);
        transform: translateY(-50%);
    }
    main input {
        width: 60%;
        margin-bottom: 8px;
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.5);
        padding: 4px;
        font-size: large;
        outline: unset;
    }
    :global(body.dark-mode) main {
        border-color: rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        background: #111;
    }
    :global(body.dark-mode) main input {
        border-color: rgba(255, 255, 255, 0.3);
        background: #111;
        color: white;
    }
    main input[data-valid="true"] {
        border-color: rgb(0, 187, 0) !important;
    }
    main input[data-valid="false"] {
        border-color: rgb(187, 0, 0) !important;
    }

    button {
        border-radius: 1024px;
        padding: 4px 8px;
        width: 60%;
        margin-top: 4px;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(0, 0, 0, 0.2);
        font-size: 18px;
    }

    button[data-canContinue="true"] {
        background: #00c3ff;
        cursor: pointer;
        color: white;
    }

    :global(body.dark-mode) button[data-canContinue="false"] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
    }

    button[data-canContinue="false"] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
        cursor: not-allowed;
    }

    button {
        transition-duration: 0.3s;
        transition-timing-function: cubic-bezier(0, 0, 0.24, 1.83);
        transition-property: transform;
    }
    button:active {
        transform: scale(0.9);
        transition-duration: 0.1s;
        transition-timing-function: ease-out;
        transition-property: transform;
    }
    button :global(div) :global(img) {
        width: 18px;
        height: 18px;
    }
</style>
