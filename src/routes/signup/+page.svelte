<script>
    import { onMount } from "svelte";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import Authentication from "../../resources/authentication.js";
    
    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    let username;
    let password;
    let creatingAccount = false;

    async function createAccount() {
        const token = await Authentication.createAccount(username, password);
        alert("Account created");
        
        localStorage.setItem("username", username);
        localStorage.setItem("token", token);
    }
    const createAccountSafe = () => {
        if (creatingAccount) return;
        creatingAccount = true;
        createAccount().finally(() => {
            creatingAccount = false;
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

        <!-- TODO: list username & password requirements,
        should only appear if the inputs are focused & will have checkmarks
        that enable next to them when sufficed -->
        <span class="input-title">Username</span>
        <input
            bind:value={username}
            type="text"
            placeholder="Use something iconic!"
            maxlength="20"
        />
        <span class="input-title">Password</span>
        <input
            bind:value={password}
            type="password"
            placeholder="Remember to write it down!"
            maxlength="50"
        />
        <button class="create-acc" on:click={createAccountSafe}>
            {#if creatingAccount}
                <LoadingSpinner icon="/loading_white.png" />
            {:else}
                Create
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
        margin-top: 100px;
    }

    /* TODO: RTL language support as this just looks weird in RTL */
    main {
        margin: 0 calc(35% - 16px);
        padding: 32px;
        width: 30%;

        display: flex;
        flex-direction: column;
        align-items: center;

        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        background: white;
    }
    main input {
        width: 60%;
        margin-bottom: 4px;
        border-radius: 4px;
        border: 1px solid rgba(0, 0, 0, 0.5);
    }
    main input::placeholder {
        font-size: 12px;
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

    .create-acc {
        border-radius: 1024px;
        padding: 4px 8px;
        width: 60%;
        margin-top: 4px;
        
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

        cursor: pointer;
        border: 1px solid rgba(0, 0, 0, 0.2);
        background: #00c3ff;
        color: white;
        font-size: 18px;
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
