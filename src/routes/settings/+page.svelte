<script>
    import { page } from '$app/stores';
    import { onMount } from "svelte";
    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    const ProjectClient = new ProjectApi();

    // Components
    import Alert from "$lib/Alert/Alert.svelte";
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

    let loggedIn = null;
    let loggedInUsername = null;
    let token = null;
    let loginMethods = [];
    let emailIsVerified = false;
    let emailIsVisible = false;

    let standing = 1;

    const accountInformation = {
        emailPeek: "...", // a peek of the email (censors most of it), probably made by the api
        emailFull: "...", // the full email (remove show button if this becomes deprecated)
        emailSet: false,
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
    
    switch ($page.url.searchParams.get("page")) {
        case "login":
            currentTab = "login";
            break;
        case "standing":
            currentTab = "standing";
            break;
    }

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
    function setupLoginInfo(_loginMethods, _privateProfile, _cfsp, _standing, isEmailVerified, email) {
        loginMethods = _loginMethods;
                
        accountInformation.settings.private = _privateProfile;
        accountInformation.settings.privateToNonFollowers = _cfsp;

        email = email || "";
        let emailPeek = `${email.substring(0, 3)}...${email.substring(email.indexOf("@"))}`

        accountInformation.emailSet = !!email;
        accountInformation.emailFull = email || "";
        accountInformation.emailPeek = email ? emailPeek : "";
        emailIsVerified = isEmailVerified;

        standing = _standing + 1;
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
                setupLoginInfo(_loginMethods, _privateProfile, _cfsp, _standing, isEmailVerified, email);
            })
            .catch((e) => {
                console.log("AAAAAAAAAAAAa", e);
                loggedIn = false;
            });
    });

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({ username, loginMethods: _loginMethods, privateProfile: _privateProfile, canFollowingSeeProfile: _cfsp, standing: _standing, isEmailVerified, email }) => {
                    loggedIn = true;
                    loggedInChange(username, token);
                    setupLoginInfo(_loginMethods, _privateProfile, _cfsp, _standing, isEmailVerified, email);
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
                    // reload but add page query param set to the current tab
                    location.href = `?page=${currentTab}`;
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
        alert(TranslationHandler.textSafe(
            "login.confirm.email.title",
            currentLang,
            "Check your email!"
        ));
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
    let changingUsername = false;
    let changingUsernameProcessing = false;
    let newChangedUsernameError = "";
    let newChangedUsername = "";
    const setNewUsername = async () => {
        await ProjectClient.setNewUsername(newChangedUsername);
        localStorage.setItem("username", newChangedUsername.toLowerCase());
        location.href = "?verified=true";
    };
    const toggleUsernameMenu = async () => {
        if (changingUsernameProcessing) return;
        if (changingUsername && newChangedUsername !== loggedInUsername) {
            // we were changing the name but now we are confirming it
            if (newChangedUsername.length <= 0) return;

            newChangedUsernameError = "";
            changingUsernameProcessing = true;
            try {
                await setNewUsername();
                changingUsernameProcessing = false;
            } catch (err) {
                changingUsernameProcessing = false;
                newChangedUsernameError = "";

                switch (err) {
                    case "InvalidLengthUsername":
                        newChangedUsernameError = "username.requirement.length";
                        return;
                    case "InvalidUsername":
                        newChangedUsernameError = "username.requirement.letters";
                        return;
                    case "UsernameTaken":
                        newChangedUsernameError = "account.fields.username.taken";
                        return;
                }

                alert(err);
                return;
            }
        } else {
            // we are now switching to changing the name
            newChangedUsernameError = "";
            newChangedUsername = loggedInUsername;
        }
        changingUsername = !changingUsername;
    };

    let editingEmail = false;
    let editingEmailProcessing = false;
    let newEmail = "";

    function saveEmail() {
        if (editingEmailProcessing) return;
        if (newEmail.length <= 0) return;

        editingEmailProcessing = true;
        ProjectClient.updateEmail(newEmail)
            .then(() => {
                editingEmailProcessing = false;
                editingEmail = false;
                accountInformation.emailSet = true;
                accountInformation.emailFull = newEmail;
                accountInformation.emailPeek = `${newEmail.substring(0, 3)}...${newEmail.substring(newEmail.indexOf("@"))}`;
            })
            .catch((err) => {
                editingEmailProcessing = false;
                alert(err);
            });
    }

    function addOAuthEventListener() {
        return new Promise((resolve) => {
            window.addEventListener("message", (event) => {
                if (event.origin !== PUBLIC_API_URL) return;
                
                if (!event.data) return;

                const { username, token } = event.data;

                localStorage.setItem("username", username);
                localStorage.setItem("token", token);

                resolve();
            });
        });
    }
    
    function oauthFrame(method) {
        let iframe = window.open(
            `${PUBLIC_API_URL}/api/v1/users/addoauthmethod?method=${method}&username=${ProjectClient.username}&token=${ProjectClient.token}`,
            `Sign in with ${method}`,
            "width=500,height=500"
        );

        if (!iframe) {
            alert(TranslationHandler.textSafe(
                "login.oauth.nopopup",
                currentLang,
                "Please enable popups to login with {{WEBSITE}}."
            ).replace('{{WEBSITE}}', method));
            return;
        }

        addOAuthEventListener().then(() => {
            location.href = `?page=${currentTab}`;
        })
    }
    function loginMethodToggled(method, name) {
        if (loginMethods.includes(method)) {
            const remove = confirm(`Remove ${name} as a login method?`);
            if (!remove) return;
            ProjectClient.removeOAuthMethod(method)
                .then(() => {
                    loginMethods = loginMethods.filter((m) => m !== method);
                })
                .catch(alert);
            return;
        }

        oauthFrame(method);
    }
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
    {#if accountInformation.emailSet && !emailIsVerified}
        <Alert
            text={TranslationHandler.textSafe(
                "verifyemail.banner.generic.hasemail",
                currentLang,
                "Check your email to verify your email address, or check settings to resend the email.",
            )}
            backColor="#ffd900"
            textColor="black"
            hasButton={false}
            textLocalize={false}
        />
    {/if}

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
                    {#if !changingUsername}
                        <h1 style="margin-block:0;font-size:40px">
                            {loggedInUsername}
                            <button class="change-username" on:click={toggleUsernameMenu}>
                                <img
                                    src="/pencil.png"
                                    alt="Edit"
                                    title="Edit"
                                />
                            </button>
                        </h1>
                    {:else}
                        <h1 style="margin-block:0;font-size:40px">
                            <input
                                type="text"
                                placeholder={TranslationHandler.textSafe(
                                    "generic.typehere",
                                    currentLang,
                                    "Type here...",
                                )}
                                bind:value={newChangedUsername}
                                class="change-username-field"
                                maxlength="20"
                            />
                            <button class="change-username" on:click={toggleUsernameMenu}>
                                {#if changingUsernameProcessing}
                                    <LoadingSpinner style="width:32px;height:32px;" single={true} />
                                {:else}
                                    <img
                                        src="/badges/approver.png"
                                        alt="Save"
                                        title="Save"
                                    />
                                {/if}
                            </button>
                        </h1>
                        {#if newChangedUsernameError}
                            <p class="change-username-error">
                                <img
                                    src="/notallowed.png"
                                    alt="Error"
                                    title="Error"
                                />
                                <LocalizedText
                                    text={newChangedUsernameError}
                                    key={newChangedUsernameError}
                                    lang={currentLang}
                                />
                            </p>
                        {/if}
                    {/if}
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
                        data-selected={currentTab === 'login'}
                        on:click={() => changeTab('login')}
                    >
                        <LocalizedText
                            text="Login"
                            key="login.confirm"
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
                            {#if !editingEmail}
                                <LocalizedText
                                    text={"Email: {{EMAIL_PEEK}}"}
                                    key="account.settings.account.email"
                                    lang={currentLang}
                                    replace={{
                                        "{{EMAIL_PEEK}}": `${accountInformation.emailSet ? 
                                            (emailIsVisible ? accountInformation.emailFull : accountInformation.emailPeek) :
                                            ""}`
                                    }}
                                />
                                {#if !accountInformation.emailSet}
                                    <span style="opacity:0.65">
                                        <LocalizedText
                                            text="Not set"
                                            key="account.settings.account.email.notset"
                                            lang={currentLang}
                                        />
                                    </span>
                                {:else}
                                    <button class="show-email-link" on:click={() => {emailIsVisible = !emailIsVisible}}>
                                        {#if !emailIsVisible}
                                            <img
                                                src="/account/showpassword.svg"
                                                alt="Show"
                                                title="Show"
                                            />
                                        {:else}
                                            <img
                                                src="/account/hidepassword.svg"
                                                alt="Hide"
                                                title="Hide"
                                            />
                                        {/if}
                                    </button>
                                {/if}
                                <button class="edit-email-link" on:click={() => editingEmail = true}>
                                    <img
                                        src="/pencil.png"
                                        alt="Edit"
                                        title="Edit"
                                    />
                                </button>
                            {:else}
                                <span>
                                    <LocalizedText
                                        text={"Email: {{EMAIL_PEEK}}"}
                                        key="account.settings.account.email"
                                        lang={currentLang}
                                        replace={{ "{{EMAIL_PEEK}}": "" }}
                                    />
                                    <input
                                        type="email"
                                        class="email-edit-field"
                                        bind:value={newEmail}
                                        placeholder={TranslationHandler.textSafe(
                                            "generic.typehere",
                                            currentLang,
                                            "Type here...",
                                        )}
                                    >
                                    <button on:click={() => editingEmail = false} class="email-edit-cancel">
                                        <LocalizedText
                                            text="Cancel"
                                            key="generic.cancel"
                                            lang={currentLang}
                                        />
                                    </button>
                                    <button on:click={saveEmail} class="email-edit-save">
                                        <LocalizedText
                                            text="Save"
                                            key="generic.save"
                                            lang={currentLang}
                                        />
                                    </button>
                                </span>
                            {/if}
                        </p>
                        {#if !emailIsVerified && accountInformation.emailSet && !editingEmail}
                            <p class="email-verify-message">
                                <img
                                    src="/account/status_warn.svg"
                                    alt="Verify your email"
                                    title="Verify your email"
                                />
                                <LocalizedText
                                    text="You have not verified your email address yet."
                                    key="email.failed.notverified"
                                    lang={currentLang}
                                />
                            </p>
                            <button class="verify-link" on:click={verifyEmail}>
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
                    {:else if currentTab === 'login'}
                        <h1>
                            <LocalizedText
                                text="Login"
                                key="login.confirm"
                                lang={currentLang}
                            />
                        </h1>
                        <p>
                            <LocalizedText
                                text="Update Login Methods"
                                key="account.settings.login.updateoauth"
                                lang={currentLang}
                            />
                        </p>
                        <button class="login-method-selector" on:click={() => loginMethodToggled("google", "Google")}>
                            <img
                                src="/google.svg"
                                alt="Google"
                            />
                            <span>
                                Google
                            </span>
                            {#if loginMethods.includes("google")}
                                <img
                                    src="/account/remove.svg"
                                    alt="Remove"
                                />
                            {:else}
                                <img
                                    src="/account/add.svg"
                                    alt="Add"
                                />
                            {/if}
                        </button>
                        <button class="login-method-selector" on:click={() => loginMethodToggled("github", "GitHub")}>
                            <img
                                src="/github-mark/github-mark.svg"
                                class="invert-on-dark"
                                alt="GitHub"
                            />
                            <span>
                                GitHub
                            </span>
                            {#if loginMethods.includes("github")}
                                <img
                                    src="/account/remove.svg"
                                    alt="Remove"
                                />
                            {:else}
                                <img
                                    src="/account/add.svg"
                                    alt="Add"
                                />
                            {/if}
                        </button>
                        <button class="login-method-selector" on:click={() => loginMethodToggled("scratch", "Scratch")}>
                            <img
                                src="/Scratch_S.svg"
                                alt="Scratch"
                            />
                            <span>
                                Scratch
                            </span>
                            {#if loginMethods.includes("scratch")}
                                <img
                                    src="/account/remove.svg"
                                    alt="Remove"
                                />
                            {:else}
                                <img
                                    src="/account/add.svg"
                                    alt="Add"
                                />
                            {/if}
                        </button>
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

    .verify-link {
        color: dodgerblue;
        text-decoration: underline;
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0;
        cursor: pointer;
        font-size: 0.85rem;
    }
    .verify-link::after {
        width: 16px;
        height: 16px;
        display: inline-block;
        content: "";
        margin-left: 4px;
    }

    .email-verify-message {
        color: #c96100;
    }
    .email-verify-message img {
        height: 16px;
        margin-bottom: -2px;
    }
    :global(body.dark-mode) .email-verify-message {
        color: #ffd8ac;
    }

    :global(html[dir="rtl"]) .edit-link::after {
        margin-left: initial;
        margin-right: 4px;
    }

    :global(html[dir="rtl"]) .verify-link::after {
        margin-left: initial;
        margin-right: 4px;
    }

    .show-email-link,
    .edit-email-link {
        width: 16px;
        height: 16px;
        background: transparent;
        border: 0;
        cursor: pointer;
        position: relative;
    }
    .show-email-link img,
    .edit-email-link img {
        position: absolute;
        width: 16px;
        height: 16px;
        left: 0;
        top: 0;
    }
    .show-email-link {
        margin-right: 20px;
    }
    :global(body.dark-mode) .show-email-link img {
        filter: invert(1);
    }
    :global(html[dir="rtl"]) .show-email-link {
        margin-left: 20px;
        margin-right: initial;
    }

    .change-username {
        overflow: hidden;
        background: none;
        border: 0;
        cursor: pointer;
    }
    .change-username img {
        height: 32px;
    }
    
    .change-username-field {
        font-size: 40px;
        width: 70%;
    }
    :global(body.dark-mode) .change-username-field {
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: transparent;
        color: white;
    }

    .change-username-error {
        color: red;
        margin-block: 2px;
        font-size: 14px;
    }
    .change-username-error img {
        margin-bottom: -3px;
        height: 16px;
    }
    :global(body.dark-mode) .change-username-error {
        color: rgb(255, 130, 130);
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
        margin-right: initial;
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

    .email-edit-save,
    .email-edit-cancel {
        height: 22px;
        border-radius: 4px;
        cursor: pointer;
        border: 1px solid rgba(0, 0, 0, 0.4);
    }
    .email-edit-save {
        background: dodgerblue;
        color: white;
        font-weight: bold;
    }
    .email-edit-cancel {
        background: transparent;
        color: black;
        font-weight: normal;
    }
    :global(body.dark-mode) .email-edit-cancel {
        color: white;
        border-color: rgba(255, 255, 255, 0.4);
    }
    :global(body.dark-mode) .email-edit-field {
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: transparent;
        color: white;
    }

    :global(body.dark-mode) .invert-on-dark {
        filter: invert(1);
    }
    .login-method-selector {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.35);
        border-radius: 4px;
        margin: 4px;
        padding: 8px 16px;
        font-size: 20px;
        width: 50%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
    }
    .login-method-selector img {
        width: 24px;
        height: 24px;
    }
    :global(body.dark-mode) .login-method-selector {
        color: white;
        border-color: rgba(255, 255, 255, 0.35);
    }
</style>
