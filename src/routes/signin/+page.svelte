<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import { browser } from "$app/environment";
    import MarkdownIt from "markdown-it";
    
    import { PUBLIC_API_URL } from "$env/static/public";
    
    // Static values
    import LINK from "../../resources/urls.js";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Button from "$lib/Button/Button.svelte";
    import Captcha from "$lib/Captcha.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import TranslationHandler from "../../resources/translations.js";
    import Authentication from "../../resources/authentication.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
        embed = $page.url.searchParams.get('embed') === "true";
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
    
    const env = {};
    const md = new MarkdownIt({
        html: false,
        linkify: false,
        breaks: true,
    });
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };

    let username = "";
    let password = "";
    let loggingIn = false;
    let embed = false;

    let showingPassword = false;

    let wrongInfo = false;
    let captcha_token = false;
    
    let apiOnlineChecking = true;
    let apiOnlineResponding = false;
    if (browser) {
        onMount(() => {
            const url = `${PUBLIC_API_URL}/api/v1`;
            fetch(url).then(res => {
                apiOnlineResponding = res.ok;
            }).finally(() => {
                apiOnlineChecking = false;
            });
        });
    }

    const togglePasswordView = () => {
        showingPassword = !showingPassword;
    };

    async function login() {
        const token = await Authentication.verifyPassword(username, password, captcha_token);

        if (token) {
            localStorage.setItem("username", username);
            localStorage.setItem("token", token);
            return true;
        }

        return false;
    }

    const LoginAccountSafe = () => {
        if (loggingIn) return;
        if (!captcha_token) return;

        loggingIn = true;
        login()
        .then((success) => {
            if (success) {
                if (embed) {
                    const opener = window.opener || window.parent;

                    function post(data) {
                        opener.postMessage(
                            data,
                            `/`
                        );
                    }

                    post();

                    window.close();
                    return;
                }

                // redirect
                const redir = $page.url.searchParams.get('redirect');
            
                window.location.href = redir ? redir : "/";
            }
            else {
                wrongInfo = true;
            }
        }, (err) => {
            wrongInfo = true;
            alert("error:", err);
        })
        .catch((err) => {
            alert("error:", err);
        })
        .finally(() => {
            loggingIn = false;
        });
    }

    function addOAuthEventListener() {
        window.addEventListener("message", (event) => {
            if (event.origin !== PUBLIC_API_URL) return;
            
            if (!event.data) return;

            const { username, token } = event.data;

            localStorage.setItem("username", username);
            localStorage.setItem("token", token);

            if (embed) {
                const opener = window.opener || window.parent;

                function post(data) {
                    opener.postMessage(
                        data,
                        `/`
                    );
                }

                post()

                window.close();
                return;
            }

            const redir = $page.url.searchParams.get('redirect');

            location.href = redir ? redir : "/";
        });
    }

    function oauthFrame(method) {
        let iframe = window.open(`${PUBLIC_API_URL}/api/v1/users/loginoauthaccount?method=${method}`, `Login with ${method}`, "width=500,height=500");

        if (!iframe) {
            alert(TranslationHandler.textSafe(
                "login.oauth.nopopup",
                currentLang,
                "Please enable popups to login with {{WEBSITE}}."
            ).replace('{{WEBSITE}}', method));
            return;
        }

        addOAuthEventListener();
    }

    function googleOAuth() {
        oauthFrame("google");
    }

    function githubOAuth() {
        oauthFrame("github");
    }

    function scratchOauth() {
        oauthFrame("scratch");
    }

    function passwordInputChanged(event) {
        password = event.target.value;
        wrongInfo = false
    }
</script>
    
<svelte:head>
    <title>PenguinMod - Login</title>
    <meta name="title" content="PenguinMod - Login" />
    <meta property="og:title" content="PenguinMod - Login" />
    <meta property="twitter:title" content="PenguinMod - Login">
    <meta name="description" content="Login for PenguinMod to start sharing your projects!">
    <meta property="twitter:description" content="Login for PenguinMod to start sharing your projects!">
    <meta property="og:url" content="https://penguinmod.com/signin">
    <meta property="twitter:url" content="https://penguinmod.com/signin">
</svelte:head>

{#if !embed}
    <NavigationBar />
{/if}
<div class="main">
    {#if !embed}
        <NavigationMargin />
    {/if}

    {#if !apiOnlineChecking && apiOnlineResponding}
        <main>
            <img
                src="/penguins/signin.svg"
                alt="Profiles"
            />
            <h1 style="margin-block:4px">PenguinMod</h1>
            <p>
                <LocalizedText
                    text="Login with your personal account"
                    key="login.title"
                    lang={currentLang}
                />
            </p>
            
            <div class="old-accounts-warning">
                {@html generateMarkdown(`${TranslationHandler.textSafe(
                    "login.linkto.oldaccounts2025.line1",
                    currentLang,
                    "Due to server issues, accounts & projects created from November 2024 to January 2025 have been deleted."
                )}
                ${TranslationHandler.textSafe(
                    "login.linkto.oldaccounts2025.line2",
                    currentLang,
                    "Check the post [here](https://penguinmod.com/devposts/3-18-2025-shutdown-incident) for more information."
                )}`)}
            </div>
        
            <button class="gsi-material-button" on:click={googleOAuth}>
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                    </div>
                    <span class="gsi-material-button-contents">
                        <LocalizedText
                            text="Login with Google"
                            key="login.oauth.google"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Login with Google"
                            key="login.oauth.google"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>
        
            <button class="gsi-material-button" on:click={githubOAuth}>
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <img
                            src="/github-mark/github-mark.svg"
                            alt="github"
                            class="invert-on-dark"
                            style="display: block;width:20px;height:20px;"
                        />
                    </div>
                    <span class="gsi-material-button-contents">
                        <LocalizedText
                            text="Login with GitHub"
                            key="login.oauth.github"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Login with GitHub"
                            key="login.oauth.github"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>
        
            <button class="gsi-material-button" on:click={scratchOauth}>
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <img src="/Scratch_S.svg" alt="Scratch" style="display:block;width:20px;height:20px;">
                    </div>
                    <span class="gsi-material-button-contents">
                        <LocalizedText
                            text="Login with Scratch"
                            key="login.oauth.scratch"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Login with Scratch"
                            key="login.oauth.scratch"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>
            
            <p class="or-line">
                <LocalizedText
                    text="or"
                    key="account.methods.orline"
                    lang={currentLang}
                />
            </p>
        
            <span class="input-title">
                <LocalizedText
                    text="Username"
                    key="account.fields.username"
                    lang={currentLang}
                />
            </span>
            <input
                bind:value={username}
                type="text"
                placeholder={TranslationHandler.textSafe(
                    "generic.typehere",
                    currentLang,
                    "Type here..."
                )}
                maxlength="20"
                on:input={() => wrongInfo = false}
            />
            <span class="input-title">
                <LocalizedText
                    text="Password"
                    key="account.fields.password"
                    lang={currentLang}
                />
            </span>
            <div class="password-wrapper">
                <input
                    type={showingPassword ? "text" : "password"}
                    placeholder={TranslationHandler.textSafe(
                        "generic.typehere",
                        currentLang,
                        "Type here..."
                    )}
                    maxlength="50"
                    on:input={passwordInputChanged}
                />
                <button
                    class="password-show"
                    on:click={togglePasswordView}>
                    {#if showingPassword}
                        <img
                            src="/account/hidepassword.svg"
                            alt="Hide Password"
                            class="invert-on-dark"
                        />
                    {:else}
                        <img
                            src="/account/showpassword.svg"
                            alt="Show Password"
                            class="invert-on-dark"
                        />
                    {/if}
                </button>
            </div>
        
            <Captcha on:update={(event) => {
                captcha_token = event.detail;
            }} />
    
            <button class="Login-acc" data-canClick={!!captcha_token} on:click={LoginAccountSafe}>
                {#if loggingIn}
                    <LoadingSpinner icon="/loading_white.png" />
                {:else}
                    <LocalizedText
                        text="Login"
                        key="login.confirm"
                        lang={currentLang}
                    />
                {/if}
            </button>
        
            <a href="/forgotpassword" style="margin: 8px">
                <LocalizedText
                    text="Forgot your password? Reset it here."
                    key="login.linkto.forgot"
                    lang={currentLang}
                />
            </a>
        
            <LocalizedText
                text="or"
                key="account.methods.orline"
                lang={currentLang}
            />
        
            <a href="/signup?embed={embed}" style="margin: 8px">
                <LocalizedText
                    text="Don't have an account? Sign up here!"
                    key="login.linkto.signup"
                    lang={currentLang}
                />
            </a>
        
            {#if wrongInfo}
                <p style="color: red;margin-bottom:0;">
                    <LocalizedText
                        text="Hm. That doesn't seem quite right. Try again."
                        key="login.error.invalid"
                        lang={currentLang}
                    />
                </p>
            {/if}
        </main>
    {:else if !apiOnlineChecking && !apiOnlineResponding}
        <main>
            <img
                src="/penguins/server.svg"
                alt="Server Penguin"
                style="width: 15rem"
            />
            <p>
                <LocalizedText
                    text="Whoops! Our server's having some problems. Try again later."
                    key="home.server.error"
                    lang={currentLang}
                />
            </p>
            {#if !embed}
                <Button
                    label="<img src='/tryit.svg' width='32px' style='margin-right:8px;filter:contrast(0%) brightness(999%)'></img>"
                    link={LINK.editor}
                >
                    <LocalizedText
                        text="Editor"
                        key="home.footer.sections.website.editor"
                        lang={currentLang}
                    />
                </Button>
            {:else}
                <a target="_blank" href={LINK.editor}>
                    <LocalizedText
                        text="Editor"
                        key="home.footer.sections.website.editor"
                        lang={currentLang}
                    />
                </a>
            {/if}
        </main>
    {:else}
        <LoadingSpinner />
    {/if}

    <div class="footer-links">
        <a target="_blank" href={LINK.terms}>
            <LocalizedText
                text="Terms of Service"
                key="home.footer.sections.info.terms"
                lang={currentLang}
            />
        </a>
        <a target="_blank" href={LINK.privacy}>
            <LocalizedText
                text="Privacy Policy"
                key="home.footer.sections.info.privacy"
                lang={currentLang}
            />
        </a>
        <a target="_blank" href={LINK.contact}>
            <LocalizedText
                text="Contact Us"
                key="home.footer.sections.info.contact"
                lang={currentLang}
            />
        </a>
    </div>
    
    <!-- the magical div of scroll -->
    <div style="height:32px" />
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
    .password-wrapper {
        width: 60%;
        margin-left: -10px;
        margin-bottom: 8px;
        position: relative;
    }
    .password-wrapper input {
        width: 100%;
        margin-bottom: 0;
    }
    :global(html[dir="rtl"]) .password-wrapper {
        margin-right: -10px;
        margin-left: initial;
    }

    .input-title {
        width: calc(60% + 8px);
        font-size: small;
        opacity: 0.85;
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

    .password-show {
        position: absolute;
        right: 0px;
        top: 4px;
        width: 24px;
        height: calc(100% - 8px);
        border: 0;
        background: transparent;
        opacity: 0.7;
        cursor: pointer;
    }

    .password-show img {
        width: 24px;
        height: 24px;
    }
    
    :global(body.dark-mode) .invert-on-dark {
        filter: invert(1);
    }
    :global(html[dir="rtl"]) .password-show {
        right: initial;
        left: -4px;
    }
    
    .or-line {
        margin-block: 2px;
    }
    .footer-links {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin-top: 8px;
    }
    .footer-links a {
        margin: 0 8px;
    }

    main a {
        margin-top: 8px;
        color: dodgerblue;
        text-decoration: none;
    }
    :global(body.dark-mode) :global(a),
    :global(body.dark-mode) a {
        color: rgb(73, 164, 255);
    }

    .Login-acc {
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
        background: #00546d;
        color: grey;
    }

    .Login-acc[data-canClick=true] {
        background: #00c3ff;
        cursor: pointer;
        color: white;
    }

    .Login-acc {
        transition-duration: 0.3s;
        transition-timing-function: cubic-bezier(0, 0, 0.24, 1.83);
        transition-property: transform;
    }
    .Login-acc:active {
        transform: scale(0.9);
        transition-duration: 0.1s;
        transition-timing-function: ease-out;
        transition-property: transform;
    }
    .Login-acc :global(div) :global(img) {
        width: 18px;
        height: 18px;
    }

    .old-accounts-warning {
        background: rgba(255, 196, 0, 0.212);
        border: 1px solid rgb(143, 95, 32);
        border-radius: 4px;
        padding: 0 8px;
        margin-bottom: 8px;
    }

    /* google stuff */
    .gsi-material-button {
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-appearance: none;
        appearance: none;
        background-color: WHITE;
        background-image: none;
        border: 1px solid #747775;
        -webkit-border-radius: 20px;
        border-radius: 20px;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        color: #1f1f1f;
        cursor: pointer;
        font-family: 'Roboto', arial, sans-serif;
        font-size: 14px;
        height: 40px;
        letter-spacing: 0.25px;
        outline: none;
        overflow: hidden;
        padding: 0 12px;
        position: relative;
        text-align: center;
        -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
        transition: background-color .218s, border-color .218s, box-shadow .218s;
        vertical-align: middle;
        white-space: nowrap;
        width: 60%;
        max-width: 400px;
        min-width: 220px;
        margin-bottom: 8px;
    }

    :global(body.dark-mode) .gsi-material-button {
        background-color: #131314;
        border-color: #8e918f;
        color: #e3e3e3;
    }

    .gsi-material-button .gsi-material-button-icon {
        height: 20px;
        margin-right: 12px;
        min-width: 20px;
        width: 20px;
    }

    .gsi-material-button .gsi-material-button-content-wrapper {
        -webkit-align-items: center;
        align-items: center;
        display: flex;
        -webkit-flex-direction: row;
        flex-direction: row;
        -webkit-flex-wrap: nowrap;
        flex-wrap: nowrap;
        height: 100%;
        justify-content: space-between;
        position: relative;
        width: 100%;
    }

    .gsi-material-button .gsi-material-button-contents {
        -webkit-flex-grow: 1;
        flex-grow: 1;
        font-family: 'Roboto', arial, sans-serif;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: top;
    }

    .gsi-material-button .gsi-material-button-state {
        -webkit-transition: opacity .218s;
        transition: opacity .218s;
        bottom: 0;
        left: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        top: 0;
    }

    .gsi-material-button:disabled {
        cursor: default;
        background-color: #ffffff61;
        border-color: #1f1f1f1f;
    }
    :global(body.dark-mode) .gsi-material-button:disabled {
        background-color: #13131461;
        border-color: #8e918f1f;
    }

    .gsi-material-button:disabled .gsi-material-button-state {
        background-color: #e3e3e31f;
    }

    .gsi-material-button:disabled .gsi-material-button-contents {
        opacity: 38%;
    }

    .gsi-material-button:disabled .gsi-material-button-icon {
        opacity: 38%;
    }

    .gsi-material-button:not(:disabled):active .gsi-material-button-state, 
    .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
        background-color: #303030;
        opacity: 12%;
    }

    :global(body.dark-mode) .gsi-material-button:not(:disabled):active .gsi-material-button-state, 
    :global(body.dark-mode) .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
        background-color: white;
        opacity: 12%;
    }

    .gsi-material-button:not(:disabled):hover {
        -webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
        box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
    }

    .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
        background-color: #303030;
        opacity: 8%;
    }
    :global(body.dark-mode) .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
        background-color: white;
        opacity: 8%;
    }
</style>
