<script>
    import { onMount } from "svelte";
    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

	let currentLang = "en";
	onMount(() => {
		Language.forceUpdate();
	});
	Language.onChange((lang) => {
		currentLang = lang;
	});

    let users = {};
    onMount(() => {
        if (localStorage.getItem("accountSwitcher")) {
            users = JSON.parse(localStorage.getItem("accountSwitcher"))
        } else {
            users = {}
        }

        if (localStorage.getItem("token") && localStorage.getItem("username")) {
            if (!Object.keys(users).includes(localStorage.getItem("username"))) {
                users[localStorage.getItem("username")] = localStorage.getItem("token")
                localStorage.setItem("accountSwitcher", JSON.stringify(users))
            }
        }
    });

    function del(username) {
        delete users[username]
        users = users
        localStorage.setItem("accountSwitcher", JSON.stringify(users))
    }

    function login(username) {
        localStorage.setItem("username", username)
        localStorage.setItem("token", users[username])
        location.reload()
    }

</script>

<svelte:head>
    <title>PenguinMod - Account Switcher</title>
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home">
    <meta name="description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="twitter:description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <h1>
            <LocalizedText
                text="Account Switcher"
                key="accswitch.title"
                lang={currentLang}
            />
        </h1>
    </div>

    <NavigationMargin />

    <div class="users">
        {#each Object.keys(users).sort((a, b) => a == localStorage.getItem("username") ? -1 : 1) as username}
            <div class="user">
                <div>
                    <img class="pfp" src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${username}`} alt={username} />
                    <span class="username">{username}</span>
                </div>
                <div>
                    {#if username != localStorage.getItem("username")}
                        <Button color="red" on:click={() => del(username)}>
                            <LocalizedText
                                text="Remove"
                                key="accswitch.del"
                                lang={currentLang}
                            />
                        </Button>
                        <Button on:click={() => login(username)}>
                            <LocalizedText
                                text="Login"
                                key="accswitch.login"
                                lang={currentLang}
                            />
                        </Button>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <NavigationMargin />

    <Button>
        <LocalizedText
            text="Add account"
            key="accswitch.addacc"
            lang={currentLang}
        />
    </Button>
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
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .section-info {
        background: #00c3ffad;
        height: 6rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
    }

    .users {
        border: 2px solid #8886;
        width: 480px;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
    }

    .user {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        padding: 8px;
        box-sizing: border-box;
    }
    .user:not(:last-child) {
        border-bottom: 2px solid #8884;
    }

    .user > div {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .pfp {
        height: 64px;
        border-radius: 8px;
    }
</style>
