<script>
    import { onMount } from "svelte";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import ChecksBox from "$lib/ChecksBox/ChecksBox.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import TranslationHandler from "../../resources/translations.js";
    import Authentication from "../../resources/authentication.js";
    import { page } from '$app/stores';

    let loginMethods = [];

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
        checkIfValid();

        username = localStorage.getItem("username");
        token = localStorage.getItem("token");

        if (!username || !token) {
            location.href = "/";
        }

        Authentication.usernameFromCode(username, token)
            .then(({ loginMethods: _loginMethods }) => {
                loginMethods = _loginMethods;
            })
            .catch(() => {
                location.href = "/";
            });
    });

    Authentication.onLogout(() => {
        location.href = "/";
    })

    Language.onChange((lang) => {
        currentLang = lang;
    });

    let oldPassword = "";
    let password = "";
    let changingPassword = false;
    let canChangePassword = false;
    let showingOldPassword = false;
    let showingNewPassword = false;
    let focused = false;
    let username = "";
    let token = "";

    let passwordValid = false;

    const passwordRequirements = [
        {name: "password.requirement.length", value: false},
        {name: "password.requirement.casing", value: false},
        {name: "password.requirement.number", value: false},
        {name: "password.requirement.symbol", value: false},
    ]

    async function checkIfValid() {
        const passwordDoesNotMeetLength = password.length < 8 || password.length > 50;
        const passwordMeetsTextInclude = password.match(/[a-z]/) && password.match(/[A-Z]/);
        const passwordHasNumber = !!password.match(/[0-9]/);
        const passwordMeetsSpecialInclude = !!password.match(/[^a-z0-9]/i);

        const passwordCheck = passwordDoesNotMeetLength || !(passwordMeetsTextInclude && passwordMeetsSpecialInclude && passwordHasNumber);

        passwordRequirements[0].value = !passwordDoesNotMeetLength;
        passwordRequirements[1].value = passwordMeetsTextInclude;
        passwordRequirements[2].value = passwordHasNumber;
        passwordRequirements[3].value = passwordMeetsSpecialInclude;
        passwordValid = !passwordCheck;

        canChangePassword = !passwordCheck && oldPassword.length > 0;

        return canChangePassword;
    }

    function passwordInputChanged(event) {
        password = event.target.value;
        checkIfValid();
    }

    function oldPasswordInputChanged(event) {
        oldPassword = event.target.value;
        checkIfValid();
    }

    const toggleOldPasswordView = () => {
        showingOldPassword = !showingOldPassword;
    };
    const toggleNewPasswordView = () => {
        showingNewPassword = !showingNewPassword;
    };

    function toOAuthPage(method) {
        const url = `${PUBLIC_API_URL}/api/v1/users/addpasswordtooauth?method=${method}&username=${username}&token=${token}`
        location.href = url;
    }

    function googleOAuth() {
        toOAuthPage("google");
    }

    function githubOAuth() {
        toOAuthPage("github");
    }

    function scratchOauth() {
        toOAuthPage("scratch");
    }

    function changePassword() {
        changingPassword = true;
        Authentication.changePassword(username, token, oldPassword, password)
            .then(() => {
                changingPassword = false;
                alert(TranslationHandler.textSafe(
                    "password.update.success",
                    currentLang,
                    "Password changed successfully!"
                ));
                location.href = "/";
            })
            .catch((error) => {
                changingPassword = false;
                alert(error);
            });
    }
</script>
    
<svelte:head>
    <title>PenguinMod - Change Password</title>
    <meta name="title" content="PenguinMod - Change Password" />
    <meta property="og:title" content="PenguinMod - Change Password" />
    <meta property="twitter:title" content="PenguinMod - Change Password" />
    <meta name="description" content="Change your password for PenguinMod to access your account with a new password" />
    <meta property="twitter:description" content="Change your password for PenguinMod to access your account with a new password" />
    <meta property="og:url" content="https://penguinmod.com/changepassword">
    <meta property="twitter:url" content="https://penguinmod.com/changepassword">
</svelte:head>
    
<NavigationBar />

<div class="main">
    <NavigationMargin />

    <main>
        <div class="profile-section">
            <img
                src="/account/profile_sheet.png"
                alt="Profiles"
            />
        </div>
        <h1 style="margin-block:4px">PenguinMod</h1>
        <p>
            <LocalizedText
                text="Change Your Password"
                key="password.update.title"
                lang={currentLang}
            />
        </p>

        {#if loginMethods.includes("google")}
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
                            text="Change your password with Google"
                            key="password.update.oauth.google"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Change your password with Google"
                            key="password.update.oauth.google"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>
        {/if}

        {#if loginMethods.includes("github")}
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
                            text="Change your password with GitHub"
                            key="password.update.oauth.github"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Change your password with GitHub"
                            key="password.update.oauth.github"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>
        {/if}

        {#if loginMethods.includes("scratch")}
            <button class="gsi-material-button" on:click={scratchOauth}>
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <img src="/Scratch_S.svg" alt="Scratch" style="display:block;width:20px;height:20px;">
                    </div>
                    <span class="gsi-material-button-contents">
                        <LocalizedText
                            text="Change your password with Scratch"
                            key="password.update.oauth.scratch"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Change your password with Scratch"
                            key="password.update.oauth.scratch"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>
        {/if}

        {#if loginMethods.length > 1 && loginMethods.includes("password")}
            <p class="or-line">
                <LocalizedText
                    text="or"
                    key="account.methods.orline"
                    lang={currentLang}
                />
            </p>
        {/if}

        {#if loginMethods.includes("password")}
            <span class="input-title">
                <LocalizedText
                    text="Old Password"
                    key="password.update.old.title"
                    lang={currentLang}
                />
            </span>
            <div class="password-wrapper">
                <input
                    type={showingOldPassword ? "text" : "password"}
                    placeholder={TranslationHandler.textSafe(
                        "password.update.old.placeholder",
                        currentLang,
                        "You won't need this anymore!"
                    )}
                    maxlength="50"
                    on:input={oldPasswordInputChanged}
                />
                <button
                    class="password-show invert-on-dark"
                    data-visible={showingOldPassword}
                    on:click={toggleOldPasswordView}
                />
            </div>
            
            <span class="input-title">
                <LocalizedText
                    text="Password"
                    key="account.fields.password"
                    lang={currentLang}
                />
            </span>
            <div class="password-wrapper">
                <input
                    type={showingNewPassword ? "text" : "password"}
                    placeholder={TranslationHandler.textSafe(
                        "account.fields.password.placeholder",
                        currentLang,
                        "Remember to write it down!"
                    )}
                    data-valid={passwordValid}
                    maxlength="50"
                    on:input={passwordInputChanged}
                    on:focusin={() => focused = true}
                    on:focusout={() => focused = false}
                />
                <button
                    class="password-show invert-on-dark"
                    data-visible={showingNewPassword}
                    on:click={toggleNewPasswordView}
                />
            </div>
            {#if focused}
                <ChecksBox items={passwordRequirements} />
            {/if}

            <button class="create-acc" data-canCreate={canChangePassword} on:click={changePassword}>
                {#if changingPassword}
                    <LoadingSpinner icon="/loading_white.png" />
                {:else}
                    <LocalizedText
                        text="Change"
                        key="password.update.confirm"
                        lang={currentLang}
                    />
                {/if}
            </button>
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
    
    main input[data-valid="true"] {
        border-color: rgb(0, 187, 0) !important;
    }
    main input[data-valid="false"] {
        border-color: rgb(187, 0, 0) !important;
    }

    .password-show {
        position: absolute;
        right: -4px;
        top: 4px;
        width: 24px;
        height: calc(100% - 8px);
        border: 0;
        background: transparent;
        background-image: url('account/showpassword.svg');
        background-size: 100% 100%;
        opacity: 0.7;
        cursor: pointer;
    }
    .password-show[data-visible="true"] {
        background-image: url('account/hidepassword.svg');
        background-size: 100% 100%;
    }
    :global(body.dark-mode) .invert-on-dark {
        filter: invert(1);
    }
    :global(html[dir="rtl"]) .password-show {
        right: initial;
        left: -4px;
    }

    /* main a {
        margin-top: 8px;
        color: dodgerblue;
        text-decoration: none;
    }
    :global(body.dark-mode) main a {
        color: rgb(73, 164, 255);
    } */

    .create-acc {
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
    
    .create-acc[data-canCreate=true] {
        background: #00c3ff;
        cursor: pointer;
        color: white;
    }

    :global(body.dark-mode) .create-acc[data-canCreate=false] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
    }

    .create-acc[data-canCreate=false] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
        cursor: not-allowed;
    }

    .create-acc {
        transition-duration: 0.3s;
        transition-timing-function: cubic-bezier(0, 0, 0.24, 1.83);
        transition-property: transform;
    }
    .create-acc:active {
        transform: scale(0.9);
        transition-duration: 0.1s;
        transition-timing-function: ease-out;
        transition-property: transform;
    }
    .create-acc :global(div) :global(img) {
        width: 18px;
        height: 18px;
    }

    @keyframes profile-scroll {
        0%, 10% {
            transform: translateX(0);
        }
        15%, 25% {
            transform: translateX(-96px);
        }
        30%, 40% {
            transform: translateX(-192px);
        }
        45%, 55% {
            transform: translateX(-288px);
        }
        60%, 70% {
            transform: translateX(-384px);
        }
        75%, 85% {
            transform: translateX(-480px);
        }
        90%, 100% {
            transform: translateX(-480px);
        }
    }
    .profile-section {
        width: 96px;
        height: 96px;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
    }
    .profile-section img {
        position: absolute;
        left: 0;
        top: 0;
        height: 96px;
        animation: profile-scroll 10s linear infinite;
        animation-delay: 3s;
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
