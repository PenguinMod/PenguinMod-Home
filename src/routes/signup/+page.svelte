<script>
    import { onMount } from "svelte";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
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

    async function createAccount() {
        const token = await Authentication.createAccount(username, password);
        alert("Account created");
        
        localStorage.setItem("username", username);
        localStorage.setItem("token", token);
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
            <!-- put the sign in shit here -->
            <input bind:value={username} placeholder="Username">
            <input bind:value={password} placeholder="Password">
            <button on:click={createAccount}>submit</button>
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
    
        main {
            margin: 0 20%;
            width: 60%;
        }
    
    </style>
    