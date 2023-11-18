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
    const AuthAPIFinishURLTemplate = "https://auth-api.itinerary.eu.org/auth/verifyTokens/%PrivateCode";

    var ProjectCommentAuthOpen = false;
    var ProfileCommentAuthOpen = false;

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
    }

    async function GrabProjectCommentCode() {
        const ProjectCommentAuthAPICall = await fetch(AuthAPIProjectComments).then(res => res.json());
        AuthCode = ProjectCommentAuthAPICall.publicCode;
        PrivateCode = ProjectCommentAuthAPICall.privateCode;
    }

    async function FinishTokenBasedAuth() {
        AuthAPIFinishURLTemplate.replace("%PrivateCode", PrivateCode)
    }
</script>

<head>
    <title>PenguinMod - Authenticate</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />
    <div>
        <button on:click={ProjectCommentPrompt}>Project Comments</button>
        <button on:click={ProfileCommentPrompt}>Profile Comments</button>
    </div>
    <dialog open="{ProjectCommentAuthOpen}">
        <div class="dialog-head">
            <button on:click={CloseProjectCommentAuth}>X</button>
            <b>Project Comment Auth</b>
        </div>
        <input readonly="true" value="{AuthCode}" />
        <a href="https://scratch.mit.edu/projects/{AuthProject}" target="_blank">Open Auth Project</a>
        <button on:click={FinishTokenBasedAuth}>Done</button>
    </dialog>
    <dialog open="{ProfileCommentAuthOpen}">
        <div class="dialog-head">
            <button on:click={CloseProfileCommentAuth}>X</button>
            <b>Profile Comment Auth</b>
        </div>
        <input type="text" value={AuthUser} on:change={SetUsername} id="username" /> <!--Username-->
        <div class="step-two">
            <input type="text" readonly="true" value="{AuthCode}" />
            <a href="https://scratch.mit.edu/users/{AuthUser}#comments" target="_blank">Open Profile Comments</a>
        </div>
        <button on:click={FinishTokenBasedAuth}>Done</button>
    </dialog>
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

    .donation-container {
        position: relative;
        border-radius: 6px;
        border: 1px solid rgba(0, 0, 0, 0.5);
        background: white;
        overflow: hidden;
        padding-left: 60px;
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
        box-shadow: 1px 1px 2px black;
        height: 52px;
    }
    .donation-container:hover {
        box-shadow: 1px 1px 10px black;
    }
    .donation-container:active {
        background: rgb(219, 219, 219);
    }
    .donation-container > img {
        position: absolute;
        left: 0;
        top: 0;
        height: calc(100% + 1px);
    }
    .donation-container > span {
        font-size: 20px;
        margin-right: 8px;
        font-weight: bold;
        text-decoration: none !important;
    }

    :global(body.dark-mode) .donation-container {
        background: transparent;
        border-color: white;
        color: white;
        box-shadow: 1px 1px 2px white;
    }
    :global(body.dark-mode) .donation-container:hover {
        box-shadow: 1px 1px 10px white;
    }
    :global(body.dark-mode) .donation-container:active {
        background: rgba(255, 255, 255, 0.2);
    }

    .donation-section {
        display: flex;
        flex-direction: row;
    }
    .donation-buttons {
        width: 50%;
    }
    .donation-images {
        width: 50%;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }
    .donation-images img {
        height: 192px;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
