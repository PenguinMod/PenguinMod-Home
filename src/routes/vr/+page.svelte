<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import VRHandler from "../../vr";
    import VRPages from "../../vr/menus/index.js";
    
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    const ProjectClient = new ProjectApi();
    
    let loggedIn = false;
    let loggedInUser = '';
    let isLiveTests = false;
    let vrIsSupported = null;
    if ($page.url.searchParams.has("livetests")) {
        isLiveTests = true;
    }
    onMount(async () => {
        vrIsSupported = await VRHandler.isSupported();
    });

    // LOGIN
    // TODO: Login should able to be transferred from other device (even other vr's too), possibly using 8 digit code
    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            loggedInUser = "";
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    loggedInUser = username;
                    return;
                }
                loggedIn = false;
                loggedInUser = "";
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        loggedInUser = "";
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        loggedInUser = "";
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    loggedInUser = username;
                    return;
                }
                loggedIn = false;
                loggedInUser = "";
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
            });
    });

    // VR
    /**
     * @type {VRHandler}
     */
    let vrSession;
    const checkLogin = () => {
        if (!loggedIn) {
            vrSession.loadPage(VRPages.pageLogin);
            return;
        }

        vrSession.loadPage(VRPages.pageHome);
    };
    const openSession = async () => {
        if (!isLiveTests) return;
        if (!vrIsSupported) return;
        if (vrSession) return;

        vrSession = new VRHandler();
        await vrSession.initialize();
        vrSession.start();
        vrSession.loadPage(VRPages.pageLoading);

        setTimeout(() => {
            checkLogin();
        }, 500);
    };
</script>

{#if isLiveTests && vrIsSupported}
    <p>{loggedIn}</p>
    <p>{loggedInUser}</p>
    <button
        class="vr-test-button"
        on:click={openSession}
    >
        Enter VR
    </button>
{:else}
    <p>We're working on it! 🐧</p>
{/if}

<style>
    .vr-test-button {
        padding: 20px;
        margin: 4px;
        font-size: larger;
    }
</style>