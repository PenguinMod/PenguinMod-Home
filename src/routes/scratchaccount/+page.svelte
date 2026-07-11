<script>
    import { onMount } from "svelte";
    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    import MarkdownIt from "markdown-it";

    import NavigationBar from "../../lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
	import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Button from "$lib/Button/Button.svelte";

    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    const STAGES = {
        VALIDITY: "validity",
        CHECK_COMMENTS: "comments",
    };

    let stage = STAGES.VALIDITY;
    let openedComments = false;
    let loading = false;
    let commentCode = "";

    let currentLang = "en";
    let method = "";
    onMount(() => {
        Language.forceUpdate();
        const url_params = new URLSearchParams(window.location.search);

        if (!url_params.has("method") || !url_params.has("code")) {
            location.href = "/";
            return;
        }

        method = url_params.get("method");
        commentCode = url_params.get("code");
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

        openedComments = false;
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
    async function userExists(username) {
        if (stupidPersonDoesntExist.has(username)) {
            return false;
        }

        const url = `${PUBLIC_API_URL}/api/v1/users/scratchuserexists?username=${username}`;

        const data = await fetch(url)
            .then((res) => res.json())
            .catch(() => ({
                exists: false,
            }));

        if (!data.exists) {
            stupidPersonDoesntExist.add(username);
            return false;
        }

        return true;
    }

    let commentCodeTextbox = null;
    async function continueAfterUsernameEnter() {
        loading = true;
        openedComments = false;
        const exists = await userExists(username);

        loading = false;

        if (!exists) {
            stage = STAGES.VALIDITY;
            usernameValid = false;
            return;
        } else {
            stage = STAGES.CHECK_COMMENTS;
        }

        setTimeout(() => {
            copyCommentCode();
        }, 0);
    }

    function profileCommentsOpened() {
        copyCommentCode();

        // small delay because we might push the button out of the way
        setTimeout(() => {
            openedComments = true;
        }, 1000);
    }
    async function copyCommentCode() {
        try {
            if (commentCodeTextbox) {
                commentCodeTextbox.focus();
                commentCodeTextbox.select();
            }

            await navigator.clipboard.writeText(commentCode);
        } catch (err) {
            console.warn("couldnt copy to cloi0padboard;", err);
        }
    }
    async function checkComments() {
        loading = true;

        window.location.replace(
            `${PUBLIC_API_URL}/api/v1/users/scratchcallback/${method}?username=${username}&code=${encodeURIComponent(commentCode)}`,
        );
    }

    // translation MD
    const md = new MarkdownIt({
        html: false,
        linkify: false,
        breaks: true,
    });
    const env = {};
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };
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
        <div style="display:flex;flex-direction:row;height:80px;">
            <img
                src="/penguins/signin.svg"
                alt="Sign in"
                style="display:block;width:80px;height:80px;"
            />
            <img
                src="/Scratch_S.svg"
                alt="Scratch"
                style="display:block;width:80px;height:80px;"
            />
        </div>
        {#if stage == STAGES.VALIDITY}
            <p>
                <LocalizedText
                    text="Use your Scratch account to sign in to PenguinMod."
                    key="auth.subtitle"
                    lang={currentLang}
                />
            </p>

            <input
                type="text"
                placeholder={TranslationHandler.textSafe(
                    "account.fields.username",
                    currentLang,
                    "Username",
                )}
                data-valid={usernameValid}
                maxlength="20"
                disabled={loading}
                on:input={usernameInputChanged}
            />

            {#if loading}
                <LoadingSpinner></LoadingSpinner>
            {:else}
                <button
                    type="submit"
                    data-canContinue={usernameValid}
                    on:click={continueAfterUsernameEnter}
                >
                    <LocalizedText
                        text="Continue"
                        key="auth.continue"
                        lang={currentLang}
                    />
                </button>
            {/if}
        {:else if stage == STAGES.CHECK_COMMENTS}
            <h3 style="margin-block-end:0px">
                <span class="disable-markdown-margin">
                    {@html generateMarkdown(
                        `${TranslationHandler.textSafe(
                            "auth.method.profile.subtitle",
                            currentLang,
                            "Sign in by leaving a comment on *your* Scratch profile.",
                        )}`,
                    )}
                </span>
            </h3>
            <textarea bind:this={commentCodeTextbox} readonly aria-readonly="true">{commentCode}</textarea>
            <div style="display:flex;flex-direction: row;">
                <Button color="remix" on:click={copyCommentCode}>
                    <LocalizedText
                        text="Copy"
                        key="auth.copy"
                        lang={currentLang}
                    />
                </Button>
                <a
                    target="_blank"
                    style="color:inherit;text-decoration: inherit;"
                    href={`https://scratch.mit.edu/users/${username}`}
                    on:click={profileCommentsOpened}
                    on:mousedown={profileCommentsOpened}
                    on:mouseup={profileCommentsOpened}
                    on:keydown={profileCommentsOpened}
                    on:keypress={profileCommentsOpened}
                    on:keyup={profileCommentsOpened}
                    on:focus={profileCommentsOpened}
                >
                    <Button>
                        <LocalizedText
                            text="Open Profile Comments"
                            key="auth.opencomments"
                            lang={currentLang}
                        />
                    </Button>
                </a>
            </div>
            {#if loading}
                <LoadingSpinner></LoadingSpinner>
            {:else if openedComments}
                <button
                    type="submit"
                    data-canContinue={true}
                    on:click={checkComments}
                >
                    <LocalizedText
                        text="Done"
                        key="auth.done"
                        lang={currentLang}
                    />
                </button>
            {/if}
        {:else}
            <LoadingSpinner />
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

    textarea {
        width: 100%;
        height: 70px;
        max-height: 250px;
        margin-block: 8px;

        resize: vertical;
    }

    .disable-markdown-margin :global(p) {
        margin: 0;
        margin-block: 0;
        display: inline;
    }
</style>
