<script>
    import { onMount } from "svelte";
    
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

    let state = "";
    let email = "";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
        checkIfValid();

        // get state and email from url params
        const urlParams = new URLSearchParams(location.search);

        state = urlParams.get("state");
        email = urlParams.get("email");

        if (!state || !email) {
            //location.href = "/";
        }
    });

    Language.onChange((lang) => {
        currentLang = lang;
    });

    let password = "";
    let resetingPassword = false;
    let canResetPassword = false;
    let showingNewPassword = false;
    let focused = false;

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

        canResetPassword = !passwordCheck;

        return canResetPassword;
    }

    function passwordInputChanged(event) {
        password = event.target.value;
        checkIfValid();
    }

    const toggleNewPasswordView = () => {
        showingNewPassword = !showingNewPassword;
    };

    function resetPassword() {
        resetingPassword = true;
        Authentication.resetPassword(email, state, password)
            .then(() => {
                resetingPassword = false;
                alert(TranslationHandler.textSafe(
                    "password.update.success",
                    currentLang,
                    "Password changed successfully!"
                ));
                location.href = "/";
            })
            .catch((error) => {
                resetingPassword = false;
                alert(error);
            });
    }
</script>
    
<svelte:head>
    <title>PenguinMod - Reset Password</title>
    <meta name="title" content="PenguinMod - Reset Password" />
    <meta property="og:title" content="PenguinMod - Reset Password" />
    <meta property="twitter:title" content="PenguinMod - Reset Password" />
    <meta name="description" content="Reset your password for PenguinMod to regain access to your account with a new password" />
    <meta property="twitter:description" content="Reset your password for PenguinMod to regain access to your account with a new password" />
    <meta property="og:url" content="https://penguinmod.com/resetpassword">
    <meta property="twitter:url" content="https://penguinmod.com/resetpassword">
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

        <button class="create-acc" data-canReset={canResetPassword} on:click={resetPassword}>
            {#if resetingPassword}
                <LoadingSpinner icon="/loading_white.png" />
            {:else}
                <LocalizedText
                    text="Change"
                    key="password.update.confirm"
                    lang={currentLang}
                />
            {/if}
        </button>
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
    
    .create-acc[data-canReset=true] {
        background: #00c3ff;
        cursor: pointer;
        color: white;
    }

    :global(body.dark-mode) .create-acc[data-canReset=false] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
    }

    .create-acc[data-canReset=false] {
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
</style>
