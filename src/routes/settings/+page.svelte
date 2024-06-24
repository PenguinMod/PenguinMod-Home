<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    import AccountStatus from "$lib/AccountStatus/Standing.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let loggedIn = null;
    let loggedInUsername = null;
    let token = null;
    let loginMethods = [];
    let emailIsVerified = false;

    let standing = 1;

    const accountInformation = {
        emailPeek: "...", // a peek of the email (censors most of it), probably made by the api
        standing: 0, // 0 for good, 1 for limited, 2 for tempban, 3 for banned (ideally returned by api because of temp ban)
        tempBanExpire: 0, // a timestamp when the ban expires

        settings: { // change to match what the api internally calls these props - mmmmmm no
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
        if (privateCode) ProjectClient.setToken(privateCode);
        loggedInUsername = username;
    }

    onMount(async () => {
        const username = localStorage.getItem("username");
        token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(({ loginMethods: _loginMethods, privateProfile: _privateProfile, canFollowingSeeProfile: _cfsp, standing: _standing, isEmailVerified, email }) => {
                loggedIn = true;
                loggedInChange(username, token);
                loginMethods = _loginMethods;
                
                accountInformation.settings.private = _privateProfile;
                accountInformation.settings.privateToNonFollowers = _cfsp;
                accountInformation.emailPeek = email;
                // TODO: make this have like a show email button so it doesnt just immediately show your email
                emailIsVerified = isEmailVerified;

                standing = _standing + 1;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({ loginMethods: _loginMethods, privateProfile: _privateProfile, canFollowingSeeProfile: _cfsp, standing: _standing, isEmailVerified, email }) => {
                    loggedIn = true;
                    loggedInChange(username, token);
                    loginMethods = _loginMethods;
                    
                    accountInformation.settings.private = _privateProfile;
                    accountInformation.settings.privateToNonFollowers = _cfsp;
                    accountInformation.emailPeek = email;
                    emailIsVerified = isEmailVerified;

                    standing = _standing + 1;
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

    function changePassword() {
        const url = "/changepassword";
        let login;

        const handleMessageReciever = (event) => {
            if (event.origin !== PUBLIC_API_URL) {
                return;
            }

            if (event.data) {
                const username = event.data.username;
                const _token = event.data.token;

                if (username && token) {
                    localStorage.setItem("username", username);
                    localStorage.setItem("token", token);
                    token = _token;
                    location.reload();
                }
            }
        };

        window.addEventListener("message", handleMessageReciever);

        login = window.open(
            url,
            "Login",
            `scrollbars=yes,resizable=yes,status=no,location=yes,toolbar=no,menubar=no,width=1024,height=512,left=200,top=200`
        );

        if (!login) {
            window.removeEventListener("message", handleMessageReciever);
            alert(TranslationHandler.textSafe(
                "account.settings.nopopup",
                currentLang,
                "Please allow popups for this site."
            ));
        };
    }

    async function verifyEmail() {
        await Authentication.verifyEmail(loggedInUsername, token);
        alert("check your email");
    }

    function updatePrivateProfile() {
        const privateProfile = accountInformation.settings.private || false;
        const privateToNonFollowers = accountInformation.settings.privateToNonFollowers || false;

        ProjectClient.updatePrivateProfile(privateProfile, privateToNonFollowers);
    }

    function setPFP() {
        // open file menu
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.click();

        // get the file
        fileInput.addEventListener("change", async () => {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async () => {
                const blob = reader.result;

                // upload the file
                ProjectClient.setPFP(blob).then((() => {
                    pfpReload = !pfpReload;
                }).bind(this))
                    .catch((err) => alert(err));
            };
            // get it as a blob
            reader.readAsArrayBuffer(file);
        });
    }

    let pfpReload = false;
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

<NavigationBar bind:pfpkey={pfpReload} />

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
                <button class="profile-section-image" on:click={setPFP}>
                    <img
                        src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={loggedInUsername}&reload={pfpReload}"
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
                    <button class="edit-link" on:click={changePassword}>
                        {#if loginMethods.includes("password")}
                            <LocalizedText
                                text="Change Password"
                                key="account.settings.login.changepassword"
                                lang={currentLang}
                            />
                        {:else}
                            <LocalizedText
                                text="Set Password"
                                key="account.settings.login.setpassword"
                                lang={currentLang}
                            />
                        {/if}
                    </button>
                    <button class="edit-link">
                        <LocalizedText
                            text="Update Login Methods"
                            key="account.settings.login.updateoauth"
                            lang={currentLang}
                        />
                    </button>
                </div>
            </div>
    
            <div class="settings-area">
                <div class="settings-area-sections">
                    <button
                        class="settings-section"
                        data-selected={currentTab === 'account'}
                        on:click={() => changeTab('account')}
                    >
                        <LocalizedText
                            text="Account"
                            key="account.settings.account.title"
                            lang={currentLang}
                        />
                    </button>
                    <button
                        class="settings-section"
                        data-selected={currentTab === 'standing'}
                        on:click={() => changeTab('standing')}
                    >
                        <LocalizedText
                            text="Standing"
                            key="account.settings.standing.title"
                            lang={currentLang}
                        />
                    </button>
                </div>
                <div class="settings-area-content">
                    {#if currentTab === 'account'}
                        <h1>
                            <LocalizedText
                                text="Account"
                                key="account.settings.account.title"
                                lang={currentLang}
                            />
                        </h1>
                        <p>
                            <LocalizedText
                                text={"Email: {{EMAIL_PEEK}}"}
                                key="account.settings.account.email"
                                lang={currentLang}
                                replace={{
                                    "{{EMAIL_PEEK}}": `${accountInformation.emailPeek}`
                                }}
                            />
                        </p>
                        {#if !emailIsVerified}
                            <button class="edit-link" on:click={verifyEmail}>
                                <LocalizedText
                                    text="Verify your email"
                                    key="account.settings.account.email.verify"
                                    lang={currentLang}
                                />
                            </button>
                        {/if}
                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={accountInformation.settings.private}
                                    on:change={updatePrivateProfile}
                                >
                                <LocalizedText
                                    text="Make my profile private"
                                    key="account.settings.account.toggles.private"
                                    lang={currentLang}
                                />
                            </label>
                        </p>
                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    disabled={!accountInformation.settings.private}
                                    bind:checked={accountInformation.settings.privateToNonFollowers}
                                    on:change={updatePrivateProfile}
                                >
                                <LocalizedText
                                    text="Allow people I follow to view my profile"
                                    key="account.settings.account.toggles.privatenonfollowers"
                                    lang={currentLang}
                                />
                            </label>
                        </p>
                        <p class="small">
                            <i>
                                <LocalizedText
                                    text="(Moderators can always view your profile, ignoring these settings.)"
                                    key="account.settings.account.toggles.private.note"
                                    lang={currentLang}
                                />
                            </i>
                        </p>
                        <!-- <br>
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
                        </p> -->
                    {:else if currentTab === 'standing'}
                        <h1>
                            <LocalizedText
                                text="Standing"
                                key="account.settings.standing.title"
                                lang={currentLang}
                            />
                        </h1>
                        <AccountStatus
                            username={loggedInUsername}
                            image="{PUBLIC_API_URL}/api/v1/users/getpfp?username={loggedInUsername}&reload={pfpReload}"
                            showname={false}
                            status={standing}
                            detail={4}
                        />
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
    .edit-link {
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

    :global(html[dir="rtl"]) .edit-link::after {
        margin-left: none;
        margin-right: 4px;
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
    :global(html[dir="rtl"]) .profile-section-image {
        margin-right: none;
        margin-left: 8px;
    }

    .profile-section-image > img {
        width: 128px;
        height: 128px;
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

    .settings-area {
        margin-top: 8px;
        width: 65%;
        height: 520px;

        display: flex;
        align-items: center;
    }
    .settings-area-sections {
        width: 20%;
        height: 100%;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-right: none;
        overflow-y: auto;
    }
    .settings-area-content {
        width: calc(80% - 16px);
        height: calc(100% - 16px);
        border: 1px solid rgba(0, 0, 0, 0.35);
        padding: 8px;
        overflow-y: auto;
    }
    
    :global(body.dark-mode) .settings-area-sections,
    :global(body.dark-mode) .settings-area-content {
        border-color: rgba(255, 255, 255, 0.35);
    }
    
    :global(html[dir="rtl"]) .settings-area-sections {
        border-right: 1px solid rgba(0, 0, 0, 0.35);
        border-left: none;
    }
    :global(html[dir="rtl"]) :global(body.dark-mode) .settings-area-sections {
        border-right-color: rgba(255, 255, 255, 0.35);
    }

    /* settings-section */
    .settings-section {
        width: 100%;

        background: none;
        border: 0;

        padding: 8px 4px;
        text-align: left;
        cursor: pointer;
    }
    .settings-section:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    .settings-section:active {
        background: rgba(0, 0, 0, 0.25);
    }
    .settings-section[data-selected="true"] {
        background: #008cff;
        color: white;
    }
    
    :global(html[dir="rtl"]) .settings-section {
        text-align: right;
    }

    :global(body.dark-mode) .settings-section {
        color: white;
    }
    :global(body.dark-mode) .settings-section:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    :global(body.dark-mode) .settings-section:active {
        background: rgba(255, 255, 255, 0.25);
    }
    :global(body.dark-mode) .settings-section[data-selected="true"] {
        background: #0059ff;
    }
</style>
