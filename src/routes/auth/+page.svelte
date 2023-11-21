<script>
    import { onMount } from "svelte";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import ProjectApi from "../../resources/projectapi.js";


    // Static values
    import LINK from "../../resources/urls.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    // Page Specific Functions, Constants, & Variables


    const AuthProject = "926884382";
    const DefaultRedirect = `${ProjectApi.OriginApiUrl}/api/users/login`;
    var AuthAPIProfileCommentsTemplate = "https://auth-api.itinerary.eu.org/auth/getTokens?method=profile-comment&username=%AuthUser&redirect=%Redirect";
    var AuthAPIProjectComments = `https://auth-api.itinerary.eu.org/auth/getTokens?method=comment&authProject=${AuthProject}&redirect=%Redirect`;

    var ProjectCommentAuthOpen = false;
    var ProfileCommentAuthOpen = false;

    var OpenLinkReady = false;

    var AuthCode = "";
    var AuthUser = "";
    
    var PrivateCode = "";

    var useLocal = "";

    onMount(() => {
        if (window.location.hostname === "localhost") useLocal = "Local";
        const Redirect = btoa(DefaultRedirect + useLocal);
        AuthAPIProfileCommentsTemplate = AuthAPIProfileCommentsTemplate.replace("%Redirect", Redirect);
        AuthAPIProjectComments = AuthAPIProjectComments.replace("%Redirect", Redirect);
    });

    function ProjectCommentPrompt() {
        ProjectCommentAuthOpen = !ProjectCommentAuthOpen;
        ProfileCommentAuthOpen = false;
        AuthCode = "";
        AuthUser = "";
        OpenLinkReady = false;
        GrabProjectCommentCode()
    }
    function ProfileCommentPrompt() {
        ProfileCommentAuthOpen = !ProfileCommentAuthOpen;
        ProjectCommentAuthOpen = false;
        AuthCode = "";
        OpenLinkReady = false;
        AuthUser = "";
    }

    function CloseProfileCommentAuth() {
        ProfileCommentAuthOpen = false;
        AuthUser = "";
        OpenLinkReady = false;
        AuthCode = "";
    }
    function CloseProjectCommentAuth() {
        ProjectCommentAuthOpen = false;
        OpenLinkReady = false;
        AuthCode = "";
    }

    function SetUsername(event) {
        AuthUser = event.target.value;
        GrabProfileCommentCode();
    }

    async function GrabProfileCommentCode() {
        const ProfileCommentAuthAPIUrl = AuthAPIProfileCommentsTemplate.replace("%AuthUser", AuthUser);
        const ProfileCommentAuthAPICall = await fetch(ProfileCommentAuthAPIUrl).then(res => res.json());
        AuthCode = ProfileCommentAuthAPICall.publicCode;
        OpenLinkReady = true;
        PrivateCode = ProfileCommentAuthAPICall.privateCode;
        DoneReady = true;
    }

    async function GrabProjectCommentCode() {
        const ProjectCommentAuthAPICall = await fetch(AuthAPIProjectComments).then(res => res.json());
        AuthCode = ProjectCommentAuthAPICall.publicCode;
        PrivateCode = ProjectCommentAuthAPICall.privateCode;
    }

    function CopyAuthCode() {
        navigator.clipboard.writeText(AuthCode);
    }

    async function FinishTokenBasedAuth() {
        location.replace(`${ProjectApi.OriginApiUrl}/api/users/login${useLocal}?privateCode=${PrivateCode}`)
    }

    var OneClickAccounts = []; // { username, lastSignedIn }, lastSignedIn should be a formatted date string.

    function OneClickSignInTriggered() {} // This cannot function unless a change is made to penguin mod's projects API
</script>

<head>
    <title>PenguinMod - Authenticate</title>
</head>

<div class="main">
    <!-- I'm aware this page is bland, I just didn't feel like making Pang illustrations. -->
    <div class="section-info">
        <div>
            <h1 style="margin-block: 0;">Sign in to PenguinMod</h1>
            <p>Use your Scratch account to sign in to PenguinMod.</p>
        </div>
        <div>
            <img
                src="/penguins/signin.svg"
                alt="Sign In"
            >
        </div>
    </div>
    <div class="darken" data-opened={ProjectCommentAuthOpen || ProfileCommentAuthOpen}></div>
    <dialog class="auth-method" open="{ProjectCommentAuthOpen}">
        <div class="dialog-head">
            Project Comment Auth
            <div class="close-button-holder">
                <button class="close-button" on:click={CloseProjectCommentAuth}>
                    <img
                        src="/dismiss.svg"
                        alt="X"
                    >
                </button>
            </div>
        </div>
        <div class="dialog-body">
            <div class="auth-code-holder">
                <input type="text" readonly="true" value="{AuthCode}" />
                <button on:click={CopyAuthCode} class="copy-button">Copy</button>
            </div>
            <div class="auth-finish">
                <a href="https://scratch.mit.edu/projects/{AuthProject}" class="open-auth-area" target="_blank">Open Auth Project</a>
                <button on:click={FinishTokenBasedAuth}>Done</button>
            </div>
        </div>
    </dialog>
    <dialog class="auth-method" open="{ProfileCommentAuthOpen}">
        <div class="dialog-head">
            Profile Comment Auth
            <div class="close-button-holder">
                <button class="close-button" on:click={CloseProfileCommentAuth}>
                    <img
                        src="/dismiss.svg"
                        alt="X"
                    >
                </button>
            </div>
        </div>
        <div class="dialog-body">
            <div class="auth-initiary">
                <input type="text" value={AuthUser} on:change={SetUsername} />
                <button>Continue</button>
            </div>
            <div class="auth-code-holder">
                <input type="text" readonly="true" value="{AuthCode}" />
                <button on:click={CopyAuthCode} class="copy-button" disabled="{AuthCode == ""}">Copy</button>
            </div>
            <div class="auth-finish">
                {#if OpenLinkReady}
                <a href="https://scratch.mit.edu/users/{AuthUser}#comments" class="open-auth-area" target="_blank">Open Profile Comments</a>
                {:else}
                <span class="disabled-link open-auth-area">Open Profile Comments</span>
                {/if}
                <button on:click={FinishTokenBasedAuth} disabled="{!OpenLinkReady}">Done</button>
            </div>
        </div>
    </dialog>
    <main class="auth-page-holder"> <!-- use class "one-click-available" if a one click account is available. -->
        <div class="auth-method-sector">
            <h3 style="opacity: 0.6">Choose a way to sign in</h3>
            <button class="auth-button" on:click={ProjectCommentPrompt}>
                <b>Project Comment Auth</b>
                <p>Sign in by leaving a comment on a Scratch project.</p>
            </button>
            <button class="auth-button" on:click={ProfileCommentPrompt}>
                <b>Profile Comment Auth</b>
                <p>Sign in by leaving a comment on <i>your</i> Scratch profile.</p>
            </button>
        </div>
    </main>
    <aside class="one-click-sign-in"> <!-- use class "one-click-available" if a one click account is available. -->
        <div class="auth-method-sector">
            <h3 style="opacity: 0.6">One click sign in</h3>
            {#each OneClickAccounts as { username, lastSignedIn }}
            <button class="auth-button" on:click={OneClickSignInTriggered}>
                <b><i>One Click:</i> {username}</b>
                <p>Last signed in {lastSignedIn}</p>
            </button>
            {/each}
        </div>
    </aside>

    <div style="display:none">
        <!-- tricking the packager into keeping the required CSS that isn't used until page load. -->
        <div class="auth-page-holder one-click-available"></div>
        <div class="one-click-sign-in one-click-available"></div>
    </div>
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
        min-width: 500px;
    }

    .auth-page-holder {
        display: flex;
        position: relative;
        justify-content: center;
        width: 100%;
    }

    .auth-page-holder.one-click-available {
        width: 50% !important;
        display: inline-flex;
    }

    .one-click-sign-in:not(.one-click-available) {
        display: none;
    }

    .one-click-sign-in.one-click-available {
        display: block;
        width: 50%;
        float: right;
    }

    .copy-button {
        transition: filter .2s;
    }

    .copy-button:not(:disabled):active {
        filter: grayscale(25%);
    }

    :any-link {
        color: var(--penguinmod-color);
    }

    .auth-method {
        width: 50%;
        border-radius: 10px;
    }

    .auth-method button:not(.close-button) {
        display: inline-block;
        padding: 5px;
        color: white;
        border: none;
        border-radius: 4px;
        outline: rgba(0, 195, 255, 0.35) 2px solid;
        background-color: var(--penguinmod-color);
        cursor: pointer;
    }

    .auth-method button:disabled {
        filter: grayscale(1);
        cursor: not-allowed;
    }

    .disabled-link {
        color: grey !important;
        cursor: not-allowed;
        text-decoration: underline;
        text-decoration-style: dotted;
    }

    .close-button {
        cursor: pointer;
        background: none;
        border: none;
    }
    .close-button img {
        height: 2rem;
    }
    .close-button:hover {
        filter: brightness(0.8);
    }

    .auth-method .dialog-body > div {
        margin: 4px 0;
    }

    .auth-method .dialog-head {
        display: flex;
        align-items: center;
    }

    dialog {
        padding: 0;
        --outer-padding: 1.5em;
        z-index: 99;
        /* border: var(--penguinmod-color) 2px solid; */
        border: 0;
        outline: rgba(0, 195, 255, 0.35) 3px solid;
        overflow: hidden;
    }

    .dialog-head {
        padding: 8px 12px;
        background-color: var(--penguinmod-color);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 2rem;
        font-weight: bold;
    }
    .close-button-holder {
        position: absolute;
        right: 8px;
        top: 8px;
    }

    .dialog-body {
        padding: 1px var(--outer-padding) var(--outer-padding);
    }

    .auth-method .dialog-head b {
        flex: 1;
    }

    .auth-method-sector {
        position: relative;
        width: 50%;
    }
    .auth-method-sector button b {
        font-size: 1.5rem;
        /* text-align: center; */
        width: 100%;
        display: block;
    }
    .auth-method-sector button p {
        margin: 5px 0;
    }

    .auth-button {
        display: block;
        padding: 1rem;
        font-size: 1.1rem;
        text-align: left;
        padding: 20px 15px;
        margin: 10px;
        width: 100%;
        color: #111;
        border-radius: 8px;
        outline: none;
        background: rgba(0, 195, 255, 0.03);
        border: 1px solid var(--penguinmod-color);
        cursor: pointer;
    }
    .auth-button:active {
        background: rgba(0, 195, 255, 0.25);
    }
    :global(body.dark-mode) .auth-button {
        color: white;
    }

    .small {
        font-size: 12px;
    }

    .detail-card {
        width: calc(100% - 24px);
        padding: 48px 12px;
        background: dodgerblue;
        color: white;
        text-align: center;
    }
    .detail-card p,
    .detail-card h1 {
        margin-block: 0;
    }
    .detail-card h1 {
        font-size: 48px;
    }

    .section-info {
        background: #00c3ffad;
        height: 9rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    .section-info div {
        margin: 0 12px;
    }
    .section-info div h1 {
        margin-block: 0;
        margin-left: 32px;
    }
    :global(html[dir="rtl"]) .section-info div h1 {
        margin-left: inherit;
        margin-right: 32px;
    }
    .section-info div p {
        margin-block-end: 0;
        margin-left: 32px;
    }
    :global(html[dir="rtl"]) .section-info div p {
        margin-left: inherit;
        margin-right: 32px;
    }
    .section-info div img {
        height: 7rem;
        transform-origin: center;
        transform: scaleX(-1);
        margin-right: 12px;
    }
    :global(html[dir="rtl"]) .section-info div img {
        margin-right: inherit;
        margin-left: 12px;
        transform: scaleX(1);
    }

    .section-discussion-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    .section-discussions {
        display: flex;
        flex-direction: row;
        width: 65%;
    }
    .section-discussion {
        width: 65%;
        margin-right: 5%;
    }
    .section-details {
        width: 30%;
    }

    .darken {
        background: rgba(0, 195, 255, 0.25);
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: none;
        z-index: 5;
    }
    .darken[data-opened="true"] {
        display: initial;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
