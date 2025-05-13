<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import AutoTranslate from "../../resources/autoTranslate.js";
    import ProjectApi from "../../resources/projectapi.js";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    import ProfileBadge from "$lib/Badge.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../resources/icons/Penguin/confused.svelte";

    let loggedIn = null;
    let page = 0;

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function loggedInChange(username, privateCode) {
        if (username) ProjectClient.setUsername(username);
        if (privateCode) ProjectClient.setToken(privateCode);
    }
    onMount(async () => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }

        Authentication.usernameFromCode(username, token)
            .then(() => {
                loggedIn = true;
                loggedInChange(username, token);
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({ username }) => {
                    if (username) {
                        loggedIn = true;
                        loggedInChange(username, privateCode);
                        return;
                    }
                    loggedIn = false;
                })
                .catch(() => {
                    loggedIn = false;
                });
        });
    }

    Authentication.onLogout(() => {
        loggedIn = false;
    });
    Authentication.onAuthentication((username, privateCode) => {
        loggedIn = true;
        loggedInChange(username, privateCode);
    });
</script>

<svelte:head>
    <title>PenguinMod - Temp Name</title>
    <meta name="title"                   content="PenguinMod - Temp Name" />
    <meta property="og:title"            content="PenguinMod - Temp Name" />
    <meta property="twitter:title"       content="PenguinMod - Temp Name">
    <meta name="description"             content="test.">
    <meta property="twitter:description" content="test.">
    <meta property="og:url"              content="https://penguinmod.com/userlist">
    <meta property="twitter:url"         content="https://penguinmod.com/userlist">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <p>TODO: Add a "type" parameter that this page can have, and if it is "following" or "followers" then also have a "target" parameter.</p>
    <p>TODO: Private profiles or hidden following lists require a sign in button & requirement.</p>

    <div style="height: 16px;" />
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
</style>
