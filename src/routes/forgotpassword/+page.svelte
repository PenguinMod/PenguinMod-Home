<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    
    // Static values
    import LINK from "../../resources/urls.js";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Captcha from "$lib/Captcha.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import TranslationHandler from "../../resources/translations.js";
    import Authentication from "../../resources/authentication.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    let email = "";
    let sendingEmail = false;
    let emailValid = false;
    let embed = false;
    let captcha_token = false;

    async function sendEmail() {
        await Authentication.sendResetPasswordEmail(email, captcha_token);
        alert(TranslationHandler.textSafe(
            "login.confirm.email.title",
            currentLang,
            "Check your email!"
        ));
    }
    const sendEmailSafe = () => {
        if (!emailValid) {
            alert(TranslationHandler.textSafe(
                "forgotpassword.invalidemail",
                currentLang,
                "Your email is not valid."
            ));
            return;
        }

        if (sendingEmail) return;
        sendingEmail = true;
        
        sendEmail()
        .then(() => {
            if (embed) {
                const opener = window.opener || window.parent;

                function post(data) {
                    opener.postMessage(
                        data,
                        `/`
                    );
                }

                post();

                window.close();
                return;
            }

            // redirect
            const redir = $page.url.searchParams.get('redirect');
        
            window.location.href = redir ? redir : "/";
        }, (err) => {
            emailValid = false;
            console.log(`error: ${err}`)
        })
        .finally(() => {
            sendingEmail = false;
        });
    }

    const validateEmail = (email) => {
        return email.match(
            /^([a-z0-9\-\._~!$&'()*+,=:]|%[0-9a-f]{2})+@[a-z0-9\-\._~!$&'()*+,=]+$/i
        ) ? true : false;
    };

    function emailInputChanged() {
        email = event.target.value;
        checkIfValid();
    }

    function checkIfValid() {
        emailValid = validateEmail(email);
        canCreate = emailValid && captcha_token;
    }

    let canCreate = false;
</script>
    
<svelte:head>
    <title>PenguinMod - Sign Up</title>
    <meta name="title" content="PenguinMod - Sign Up" />
    <meta property="og:title" content="PenguinMod - Sign Up" />
    <meta property="twitter:title" content="PenguinMod - Sign Up">
    <meta name="description" content="Sign up for PenguinMod to start sharing your projects!">
    <meta property="twitter:description" content="Sign up for PenguinMod to start sharing your projects!">
    <meta property="og:url" content="https://penguinmod.com/forgotpassword">
    <meta property="twitter:url" content="https://penguinmod.com/forgotpassword">
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
                text="Forgot your password? No problem! Enter your email below to reset it."
                key="forgotpassword.title"
                lang={currentLang}
            />
        </p>
        <span class="input-title">
            <LocalizedText
                text="Email"
                key="account.fields.email"
                lang={currentLang}
            />
        </span>
        <input
            type="text"
            placeholder={TranslationHandler.textSafe(
                "account.fields.email.placeholder",
                currentLang,
                "Your email address"
            )}
            data-valid={emailValid}
            class="email-input"
            maxlength="254"
            on:input={emailInputChanged}
            bind:value={email}
        />

        <Captcha on:update={(event) => {
            captcha_token = event.detail;
        }} />

        <button class="send-email" data-canCreate={canCreate} on:click={sendEmailSafe}>
            {#if sendingEmail}
                <LoadingSpinner icon="/loading_white.png" />
            {:else}
                <LocalizedText
                    text="Send Email"
                    key="forgotpassword.sendemail"
                    lang={currentLang}
                />
            {/if}
        </button>
    </main>

    <div class="footer-links">
        <a target="_blank" href={LINK.contact}>
            <LocalizedText
                text="Contact Us"
                key="home.footer.sections.info.contact"
                lang={currentLang}
            />
        </a>
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

    .footer-links {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin-top: 8px;
    }
    .footer-links a {
        margin: 0 8px;
    }
    
    :global(body.dark-mode) :global(a),
    :global(body.dark-mode) a {
        color: rgb(73, 164, 255);
    }

    .send-email {
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
    
    .send-email[data-canCreate=true] {
        background: #00c3ff;
        cursor: pointer;
        color: white;
    }

    :global(body.dark-mode) .send-email[data-canCreate=false] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
    }

    .send-email[data-canCreate=false] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
        cursor: not-allowed;
    }

    .send-email {
        transition-duration: 0.3s;
        transition-timing-function: cubic-bezier(0, 0, 0.24, 1.83);
        transition-property: transform;
    }
    .send-email:active {
        transform: scale(0.9);
        transition-duration: 0.1s;
        transition-timing-function: ease-out;
        transition-property: transform;
    }
    .send-email :global(div) :global(img) {
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
