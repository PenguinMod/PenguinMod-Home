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
    import Authentication from "../../resources/authentication.js";
    import { page } from '$app/stores';

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
        checkIfValid();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    let username = "";
    let password = "";
    let creatingAccount = false;
    let canCreateAccount = false;
    let showingPassword = false;
    let focused = "";
    let embed = false;

    let lastUsernameCheck = 0;
    let lastUsernameCheckVal = false;

    let usernameValid = false;
    let passwordValid = false;

    const usernameRequirements = [
        {name: "Is between 3 and 20 letters, numbers or symbols", value: false},
        {name: "Has only letters (A-Z), numbers (0-9), hyphens (-), and underscores (_)", value: false},
        {name: "Username is not already taken", value: false}
    ]

    const passwordRequirements = [
        {name: "Is between 8 and 50 letters, numbers or symbols", value: false},
        {name: "Has at least one uppercase and one lowercase letter", value: false},
        {name: "Has at least one number", value: false},
        {name: "Has at least one symbol", value: false},
    ]

    async function createAccount() {
        const token = await Authentication.createAccount(username, password);
        
        localStorage.setItem("username", username);
        localStorage.setItem("token", token);
    }
    const createAccountSafe = () => {
        if (!canCreateAccount) {
            alert("Your username or password do not meet the requirements needed to create an account.");
            return;
        }

        if (creatingAccount) return;
        creatingAccount = true;
        
        createAccount()
        .then(() => {
            if (embed) {
                const opener = window.opener || window.parent;

                function post(data) {
                    opener.postMessage(
                        data,
                        `http://localhost:5173`
                    );
                }

                post();

                window.close();
                return;
            }

            // redirect
            const redir = $page.url.searchParams.get('redirect');
        
            window.location.href = redir ? redir : "http://localhost:5173";
        }, (err) => {
            canCreateAccount = false;
            console.log(`error: ${err}`)
        })
        .finally(() => {
            creatingAccount = false;
        });
    }

    async function checkIfValid() {
        const usernameDoesNotMeetLength = username.length < 3 || username.length > 20;

        const usernameHasIllegalChars = Boolean(username.match(/[^a-z0-9\-_]/i));

        const userCheck = usernameDoesNotMeetLength || usernameHasIllegalChars;

        const passwordDoesNotMeetLength = password.length < 8 || password.length > 50;
        const passwordMeetsTextInclude = password.match(/[a-z]/) && password.match(/[A-Z]/);
        const passwordHasNumber = !!password.match(/[0-9]/);
        const passwordMeetsSpecialInclude = !!password.match(/[^a-z0-9]/i);

        const passwordCheck = passwordDoesNotMeetLength || !(passwordMeetsTextInclude && passwordMeetsSpecialInclude);

        passwordRequirements[0].value = !passwordDoesNotMeetLength;
        passwordRequirements[1].value = passwordMeetsTextInclude;
        passwordRequirements[2].value = passwordHasNumber;
        passwordRequirements[3].value = passwordMeetsSpecialInclude;
        passwordValid = !passwordCheck;

        if (!username) {
            usernameRequirements[0].value = false;
            usernameRequirements[1].value = false;
            usernameRequirements[2].value = true;

            canCreateAccount = false;
            usernameValid = false;
            return;
        }

        let uniqueUsername = false;
        try {
            uniqueUsername = !(await checkUsername() || false);
        } catch {
            uniqueUsername = false;
        }

        canCreateAccount = !(userCheck || passwordCheck) && uniqueUsername;
        usernameValid = uniqueUsername && !userCheck;

        usernameRequirements[0].value = !usernameDoesNotMeetLength;
        usernameRequirements[1].value = !usernameHasIllegalChars;
        usernameRequirements[2].value = uniqueUsername;

        return canCreateAccount;
    }
    function passwordInputChanged(event) {
        password = event.target.value;
        checkIfValid();
    }

    const togglePasswordView = () => {
        showingPassword = !showingPassword;
    };

    function addOAuthEventListener() {
        window.addEventListener("message", (event) => {
            if (event.origin !== "http://localhost:8080") return;
            
            if (!event.data) return;

            const { username, token } = event.data;

            localStorage.setItem("username", username);
            localStorage.setItem("token", token);

            if (embed) {
                const opener = window.opener || window.parent;

                function post(data) {
                    opener.postMessage(
                        data,
                        `http://localhost:5173`
                    );
                }

                post();

                window.close();
                return;
            }

            const redir = $page.url.searchParams.get('redirect');

            location.href = redir ? redir : "http://localhost:5173";
        });
    }

    function oauthFrame(method) {
        let iframe = window.open(`http://localhost:8080/api/v1/users/createoauthaccount?method=${method}`, `Sign up with ${method}`, "width=500,height=500");

        if (!iframe) {
            alert(`Please enable popups to sign up with ${method}.`);
            return;
        }

        addOAuthEventListener();
    }

    function googleOAuth() {
        oauthFrame("google");
    }

    function githubOAuth() {
        oauthFrame("github");
    }

    function scratchOauth() {
        oauthFrame("scratch");
    }

    function checkUsername() {
        if (Date.now() - lastUsernameCheck < 1000) {
            return lastUsernameCheckVal;
        }
        let url = `http://localhost:8080/api/v1/users/userexists?username=${username}`;

        return new Promise((resolve, reject) => {
            fetch(url)
            .then((res) => res.json())
            .then((res) => {
                if (res.exists) {
                    canCreateAccount = false;
                }
                lastUsernameCheck = Date.now();
                lastUsernameCheckVal = res.exists;
                resolve(res.exists);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }
</script>
    
<svelte:head>
    <title>PenguinMod - Sign Up</title>
    <meta name="title" content="PenguinMod - Sign Up" />
    <meta property="og:title" content="PenguinMod - Sign Up" />
    <meta property="twitter:title" content="PenguinMod - Sign Up">
    <meta name="description" content="Sign up for PenguinMod to start sharing your projects!">
    <meta property="twitter:description" content="Sign up for PenguinMod to start sharing your projects!">
    <meta property="og:url" content="https://penguinmod.com/signup">
    <meta property="twitter:url" content="https://penguinmod.com/signup">
</svelte:head>
    
<NavigationBar />

<div class="main">
    <NavigationMargin />

    <main>
        <div class="profile-section">
            <img
                src="/account/profile_sheet.png"
                alt="Profiles"
                title="Feel free to draw your own profile picture to get ready for your new account!"
            />
        </div>
        <h1 style="margin-block:4px">PenguinMod</h1>
        <p>Create your personal account</p>

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
                <span class="gsi-material-button-contents">Sign up with Google</span>
                <span style="display: none;">Sign up with Google</span>
            </div>
        </button>

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
                <span class="gsi-material-button-contents">Sign up with GitHub</span>
                <span style="display: none;">Sign up with GitHub</span>
            </div>
        </button>

        <button class="gsi-material-button" on:click={scratchOauth}>
            <div class="gsi-material-button-state"></div>
            <div class="gsi-material-button-content-wrapper">
                <div class="gsi-material-button-icon">
                    <img src="/Scratch_S.svg" alt="Scratch" style="display:block;width:20px;height:20px;">
                </div>
                <span class="gsi-material-button-contents">Sign up with Scratch</span>
                <span style="display: none;">Sign up with Scratch</span>
            </div>
        </button>

        <p class="or-line">or</p>
    
        <span class="input-title">Username</span>
        <input
            bind:value={username}
            type="text"
            placeholder="Use something iconic!"
            data-valid={usernameValid}
            maxlength="20"
            on:input={checkIfValid}
            on:focusin={() => focused = "username"}
            on:focusout={() => focused = ""}
        />
        {#if focused === "username"}
            <ChecksBox items={usernameRequirements} />
        {/if}

        <span class="input-title">Password</span>
        <div class="password-wrapper">
            <input
                type={showingPassword ? "text" : "password"}
                placeholder="Remember to write it down!"
                data-valid={passwordValid}
                maxlength="50"
                on:input={passwordInputChanged}
                on:focusin={() => focused = "password"}
                on:focusout={() => focused = ""}
            />
            <button
                class="password-show invert-on-dark"
                data-visible={showingPassword}
                on:click={togglePasswordView}
            />
        </div>
        {#if focused === "password"}
            <ChecksBox items={passwordRequirements} />
        {/if}

        <p>
            By creating a PenguinMod account through any means provided on this page,
            you agree to abide by the <a href="/terms" target="_blank">Terms of Service</a>
            and <a href="/guidelines/uploading" target="_blank">Uploading Guidelines</a>
            and confirm that you have read the <a href="/privacy" target="_blank">Privacy Policy</a> in its entirety.
        </p>

        <button class="create-acc" data-canCreate={canCreateAccount} on:click={createAccountSafe}>
            {#if creatingAccount}
                <LoadingSpinner icon="/loading_white.png" />
            {:else}
                Create
            {/if}
        </button>

        <a href="/signin?embed={embed}" style="margin-top: 8px">Already have an account? Sign in here!</a>
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

    main a {
        margin-top: 8px;
        color: dodgerblue;
        text-decoration: none;
    }
    :global(body.dark-mode) main a {
        color: rgb(73, 164, 255);
    }

    .or-line {
        margin-block: 2px;
    }

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
