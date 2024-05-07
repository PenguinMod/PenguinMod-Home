<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let loggedIn = null;
    let loggedInUsername = null;

    const accountInformation = {
        emailPeek: "", // a peek of the email (censors most of it), probably made by the api
        standing: 0, // 0 for good, 1 for limited, 2 for tempban, 3 for banned (ideally returned by api because of temp ban)
        tempBanExpire: 0, // a timestamp when the ban expires

        settings: { // change to match what the api internally calls these props
            private: false,
            privateToNonFollowers: false,
            showCubesOnProfile: false,
        },
    };

    let currentTab = "account";
    const changeTab = (to) => {
        currentTab = to;
    };

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function loggedInChange(username, privateCode) {
        if (username) ProjectClient.setUsername(username);
        if (privateCode) ProjectClient.setPrivateCode(privateCode);
        loggedInUsername = username;
    }

    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            return;
        }
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
    Authentication.onAuthentication((privateCode) => {
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
</script>

<svelte:head>
    <title>PenguinMod - Settings</title>
    <meta name="title"                   content="PenguinMod - Settings" />
    <meta property="og:title"            content="PenguinMod - Settings" />
    <meta property="twitter:title"       content="PenguinMod - Settings">
    <meta name="description"             content="View your account settings.">
    <meta property="twitter:description" content="View your account settings.">
    <meta property="og:url"              content="https://penguinmod.com/settings">
    <meta property="twitter:url"         content="https://penguinmod.com/settings">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    <div class="section-info">
        <h1>
            <LocalizedText
                text="Settings"
                key="account.settings.title"
                lang={currentLang}
            />
        </h1>
    </div>

    {#if loggedIn === false}
        <div class="login-prompt">
            <p>
                <LocalizedText
                    text="You were logged out. Please log-in again."
                    key="uploading.error.reauthenticate"
                    lang={currentLang}
                />
            </p>
            <Button on:click={askForLogin}>
                <LocalizedText
                    text="Sign In"
                    key="navigation.login"
                    lang={currentLang}
                />
            </Button>
        </div>
    {:else if loggedIn === null}
        <div style="margin-top: 16px;">
            <LoadingSpinner enableTips={true} />
        </div>
    {:else}
        <div style="height: 16px;" />

        <div class="center-area">
            <div class="profile-section">
                <button class="profile-section-image">
                    <img
                        src="http://localhost:8080/api/v1/users/getpfp?username={loggedInUsername}"
                        alt={loggedInUsername}
                    />
                    <div class="profile-section-image-edit">
                        <img
                            src="/pencil.png"
                            alt="Edit"
                        />
                    </div>
                </button>
                <div class="profile-section-display">
                    <h1 style="margin-block:0;font-size:40px">{loggedInUsername}</h1>
                    <button class="edit-link">
                        Set Password
                    </button>
                    <button class="edit-link">
                        Update Login Methods
                    </button>
                </div>
            </div>
    
            <div>
                <div>
                    <button
                        class="settings-section"
                        data-selected={currentTab === 'account'}
                        on:click={() => changeTab('account')}
                    >
                        Account
                    </button>
                    <button
                        class="settings-section"
                        data-selected={currentTab === 'standing'}
                        on:click={() => changeTab('standing')}
                    >
                        Standing
                    </button>
                </div>
                <div>
                    {#if currentTab === 'account'}
                        <h1>Account</h1>
                        <p>Email: {accountInformation.emailPeek}</p>
                        <br>
                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={accountInformation.settings.private}
                                >
                                Make my profile private
                            </label>
                        </p>
                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    disabled={!accountInformation.settings.private}
                                    bind:checked={accountInformation.settings.privateToNonFollowers}
                                >
                                Allow people I follow to view my profile
                            </label>
                        </p>
                        <p class="small">
                            <i>(Moderators can always view your profile, ignoring these settings.)</i>
                        </p>
                        <br>
                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={accountInformation.settings.showCubesOnProfile}
                                >
                                Show my Ice Cube count on my profile
                            </label>
                        </p>
                        <p class="small">
                            <i>(Moderators can always see your Ice Cube count, ignoring these settings.)</i>
                        </p>
                    {:else if currentTab === 'standing'}
                        <h1>Standing</h1>
                    {/if}
                </div>
            </div>
        </div>

        <div style="height: 16px;" />
    {/if}

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

    .small {
        font-size: smaller;
        opacity: 0.7;
    }

    .section-info {
        background: #00c3ffad;
        height: 8rem;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
    }

    .login-prompt {
        display: flex;
        flex-direction: column;
        margin-top: 16px;
        margin-bottom: 16px;
        align-items: center;
    }
    .edit-link,
    .fake-link {
        color: dodgerblue;
        text-decoration: underline;
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0;
        cursor: pointer;
        font-size: 0.85rem;
    }
    .edit-link::after {
        width: 16px;
        height: 16px;
        display: inline-block;
        content: "";
        background-image: url('/pencil.png');
        background-size: 16px 16px;
        background-repeat: no-repeat;
        margin-left: 4px;
    }

    .center-area {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    /* profile section */
    .profile-section {
        display: flex;
        flex-direction: row;
        align-items: center;

        width: 65%;
    }
    .profile-section-image {
        position: relative;
        margin: 0;
        padding: 0;
        border: 0;
        margin-right: 8px;

        width: 128px;
        height: 128px;

        cursor: pointer;
        background: none;
        border-radius: 8px;
        overflow: hidden;
    }
    .profile-section-image-edit {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;

        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        transition-duration: 0.1s;
        transition-property: opacity;
    }
    .profile-section-image-edit img {
        background: rgba(0, 0, 0, 0.7);
        border-radius: 100%;
        overflow: visible;
        padding: 8px;
    }
    .profile-section-image:focus .profile-section-image-edit,
    .profile-section-image:active .profile-section-image-edit,
    .profile-section-image:hover .profile-section-image-edit {
        opacity: 1;
        transition-duration: 0.1s;
        transition-property: opacity;
    }
    .profile-section-display {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
    }

    /* settings-section */
    .settings-section[data-selected="true"] {
        background: #00c3ff;
        color: white;
    }
</style>
