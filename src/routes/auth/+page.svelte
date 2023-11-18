<script>
    import { onMount } from "svelte";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";

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
    const AuthAPIProfileCommentsTemplate = "https://auth-api.itinerary.eu.org/auth/getTokens?method=profile-comment&username=%AuthUser&redirect=aHR0cHM6Ly9wcm9qZWN0cy5wZW5ndWlubW9kLmNvbS9hcGkvdXNlcnMvbG9naW4%3D";
    const AuthAPIProjectComments = "https://auth-api.itinerary.eu.org/auth/getTokens?method=comment&redirect=aHR0cHM6Ly9wcm9qZWN0cy5wZW5ndWlubW9kLmNvbS9hcGkvdXNlcnMvbG9naW4%3D&authProject=" + AuthProject;
    const AuthAPIFinishURLTemplate = "https://auth-api.itinerary.eu.org/auth/verifyToken/%PrivateCode";

    var ProjectCommentAuthOpen = false;
    var ProfileCommentAuthOpen = false;

    var DoneReady = false;

    var AuthCode = "";
    var AuthUser = "";
    
    var PrivateCode = "";

    function ProjectCommentPrompt() {
        ProjectCommentAuthOpen = !ProjectCommentAuthOpen;
        ProfileCommentAuthOpen = false;
        AuthCode = "";
        AuthUser = "";
        GrabProjectCommentCode()
    }
    function ProfileCommentPrompt() {
        ProfileCommentAuthOpen = !ProfileCommentAuthOpen;
        ProjectCommentAuthOpen = false;
        AuthCode = "";
        AuthUser = "";
    }

    function CloseProfileCommentAuth() {
        ProfileCommentAuthOpen = false;
        AuthUser = "";
        AuthCode = "";
    }
    function CloseProjectCommentAuth() {
        ProjectCommentAuthOpen = false;
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
        PrivateCode = ProfileCommentAuthAPICall.privateCode;
        DoneReady = true;
    }

    async function GrabProjectCommentCode() {
        const ProjectCommentAuthAPICall = await fetch(AuthAPIProjectComments).then(res => res.json());
        AuthCode = ProjectCommentAuthAPICall.publicCode;
        PrivateCode = ProjectCommentAuthAPICall.privateCode;
    }

    function CopyAuthCode() {}

    async function FinishTokenBasedAuth() {
        location.replace("https://projects.penguinmod.com/api/users/login?privateCode=" + PrivateCode)
    }
</script>

<head>
    <title>PenguinMod - Authenticate</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />
    <main class="auth-page-holder">
        <div class="auth-method-sector">
            <button on:click={ProjectCommentPrompt}>
                <b>Project Comment Auth</b>
                <p>Sign in by leaving a comment on a Scratch project.</p>
            </button>
            <button on:click={ProfileCommentPrompt}>
                <b>Profile Comment Auth</b>
                <p>Sign in by leaving a comment on <i>your</i> Scratch profile.</p>
            </button>
        </div>
        <dialog class="auth-method" open="{ProjectCommentAuthOpen}">
            <div class="dialog-head">
                <button on:click={CloseProjectCommentAuth}>X</button>
                <b>Project Comment Auth</b>
            </div>
            <div class="dialog-body">
                <div class="auth-code-holder">
                    <input type="text" readonly="true" value="{AuthCode}" />
                    <button on:click={CopyAuthCode}>Copy</button>
                </div>
                <div class="auth-finish">
                    <a href="https://scratch.mit.edu/projects/{AuthProject}" target="_blank">Open Auth Project</a>
                    <button on:click={FinishTokenBasedAuth}>Done</button>
                </div>
            </div>
        </dialog>
        <dialog class="auth-method" open="{ProfileCommentAuthOpen}">
            <div class="dialog-head">
                <button on:click={CloseProfileCommentAuth}>X</button>
                <b>Profile Comment Auth</b>
            </div>
            <div class="dialog-body">
                <div class="auth-initiary">
                    <input type="text" value={AuthUser} on:change={SetUsername} />
                    <button on:click={SetUsername}>Continue</button>
                </div>
                <div class="auth-code-holder">
                    <input type="text" readonly="true" value="{AuthCode}" />
                    <button on:click={CopyAuthCode}>Copy</button>
                </div>
                <div class="auth-finish">
                    <a href="https://scratch.mit.edu/users/{AuthUser}#comments" target="_blank">Open Profile Comments</a>
                    <button on:click={FinishTokenBasedAuth}>Done</button>
                </div>
            </div>
        </dialog>
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
        min-width: 1000px;
    }

    .auth-page-holder {
        display: flex;
        position: relative;
        justify-content: center;
    }

    .auth-method {
        width: 50%;
    }

    .auth-method-sector {
        position: relative;
        width: 25%;
    }

    .auth-method-sector button {
        display: block;
        text-align: left;
        padding: 10px;
        margin: 10px;
        width: 100%;
    }

    .auth-method-sector button p {
        margin: 5px 0;
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
        height: 12rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    .section-info h1 {
        margin-block: 0;
        margin-left: 32px;
    }
    .section-info p {
        margin-block-end: 0;
        margin-left: 32px;
    }

    .penguin-donate {
        height: 80%;
        margin-right: 32px;
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

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
