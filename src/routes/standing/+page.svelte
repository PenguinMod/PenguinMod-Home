<script>
    import { page } from '$app/stores';
    import { onMount } from "svelte";
    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    const ProjectClient = new ProjectApi();
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import AccountStatus from "$lib/AccountStatus/Standing.svelte";
    import Button from "$lib/Button/Button.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";
    
    let loggedIn = null;
    let loggedInUsername = null;
    let token = null;
    
    const displayAccountDeleted = $page.url.searchParams.get('deleted');
    const deletedUsername = $page.url.searchParams.get('username');
    let accountStanding = 1;

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function loggedInChange(username, privateCode, standing) {
        if (username) ProjectClient.setUsername(username);
        if (privateCode) ProjectClient.setToken(privateCode);
        loggedInUsername = username;
        accountStanding = standing;
    }
    onMount(async () => {
        const username = localStorage.getItem("username");
        token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(({ standing }) => {
                loggedIn = true;
                loggedInChange(username, token, standing);
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({ standing }) => {
                    loggedIn = true;
                    loggedInChange(username, token, standing);
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
        loggedIn = null;
        Authentication.usernameFromCode(privateCode)
            .then(({ standing }) => {
                loggedIn = true;
                loggedInChange(username, token, standing);
            })
            .catch(() => {
                loggedIn = false;
            });
    });
    
    const sendToHome = () => {
        location.href = location.origin;
    };
    const logoutUser = () => {
        // TODO: This probably fails for deleted accounts since their username & token is not valid.
        Authentication.logout().then(() => {
            sendToHome();
        });
    };
</script>

<svelte:head>
    <title>PenguinMod - Standing</title>
    <meta name="title" content="PenguinMod - Standing" />
    <meta property="og:title" content="PenguinMod - Standing" />
    <meta property="twitter:title" content="PenguinMod - Standing">
    <meta name="description" content="See your account standing.">
    <meta property="twitter:description" content="See your account standing.">
    <meta property="og:url" content="https://penguinmod.com/standing">
    <meta property="twitter:url" content="https://penguinmod.com/standing">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="cooler-box">
        {#if loggedIn === null}
            <LoadingSpinner />
        {:else if loggedIn === false && !displayAccountDeleted}
            <Button on:click={askForLogin}>
                <LocalizedText
                    text="Sign in"
                    key="navigation.login"
                    lang={currentLang}
                />
            </Button>
        {:else}
            <div class="box">
                {#if displayAccountDeleted}
                    <div class="center">
                        <h1>
                            <LocalizedText
                                text="Your account has been deleted."
                                key="account.settings.standing.descriptive.deleted"
                                lang={currentLang}
                            />
                        </h1>
                    </div>
                    <AccountStatus
                        username={deletedUsername}
                        image="https://library.penguinmod.com/files/emojis/exclamation.png"
                        showname={!!deletedUsername}
                        showpfp={true}
                        showdeleted={true}
                        status={4}
                        detail={2}
                    />
                {:else}
                    <AccountStatus
                        username={loggedInUsername}
                        image="{PUBLIC_API_URL}/api/v1/users/getpfp?username={loggedInUsername}"
                        showname={true}
                        status={1}
                        detail={4}
                    />
                {/if}
    
                <div class="center" style="margin-top: 24px;">
                    {#if displayAccountDeleted}
                        <Button on:click={logoutUser}>
                            <LocalizedText
                                text="Logout"
                                key="navigation.logout"
                                lang={currentLang}
                            />
                        </Button>
                    {:else}
                        <Button on:click={sendToHome}>
                            <LocalizedText
                                text="Continue"
                                key="auth.continue"
                                lang={currentLang}
                            />
                        </Button>
                    {/if}
                </div>
            </div>
        {/if}
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
        min-width: 1000px;
    }
    .cooler-box {
        margin-top: 32px;
        width: 100%;
    }
    .cooler-box,
    .center {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .box {
        width: 40%;
    }
</style>
