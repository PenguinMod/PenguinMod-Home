<script>
    import { page } from '$app/stores';
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import AutoTranslate from "../../resources/autoTranslate.js";
    import ProjectApi from "../../resources/projectapi.js";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    import ProfileBadge from "$lib/Badge.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../resources/icons/Penguin/confused.svelte";

    let loggedIn = null;
    let paginationPage = 0;
    let paginationWantedPage = 1;

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
        pageShouldReload();
    }
    onMount(async () => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            pageShouldReload();
            return;
        }

        Authentication.usernameFromCode(username, token)
            .then(() => {
                loggedIn = true;
                loggedInChange(username, token);
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({ username }) => {
                    if (username) {
                        loggedIn = true;
                        loggedInChange(username, privateCode);
                        return;
                    }
                    loggedIn = false;
                })
                .catch(() => {
                    loggedIn = false;
                });
        });
    }

    Authentication.onLogout(() => {
        loggedIn = false;
        loggedInChange();
    });
    Authentication.onAuthentication((username, privateCode) => {
        loggedIn = true;
        loggedInChange(username, privateCode);
    });
    
    const pageType = $page.url.searchParams.get('type');
    const pageTarget = $page.url.searchParams.get('target');
    const metaTitle = (pageType === "followers" || pageType === "following") ? `${pageTarget}'s ${pageType}`
        : "User list";
    const metaDescription = pageType === "followers" ? `See ${pageTarget}'s followers.`
        : (pageType === "following" ? `See who ${pageTarget} is following.`
        : (`See a list of users.`));

    let pageLoading = false;
    let pageError = false;
    let pageUsers = [];
    let pageProfilePrivate = false;
    let pageProfilePrivateToFollowers = false;
    let pageProfilePrivateFollowingList = false;
    const pageShouldReload = () => {
        pageLoading = true;
        pageError = false;

        const knownPages = [
            "followers",
            "following"
        ];
        if (!knownPages.includes(pageType)) {
            location.href = location.origin + `/error?error=404`;
            return;
        }

        switch (pageType) {
            case "followers":
                ProjectClient.getFollowers(pageTarget, paginationPage)
                    .then(followers => {
                        pageUsers = followers;
                    })
                    .catch(err => {
                        pageError = err;
                    })
                    .finally(() => {
                        pageLoading = false;
                    });
                break;
            case "following":
                ProjectClient.getFollowing(pageTarget, paginationPage)
                    .then(followers => {
                        pageUsers = followers;
                    })
                    .catch(err => {
                        if (err === "PrivateProfile") { pageProfilePrivate = true; return; }
                        if (err === "Hidden") { pageProfilePrivateFollowingList = true; return; }
                        pageError = err;
                    })
                    .finally(() => {
                        pageLoading = false;
                    });
                break;
        }
    };
    let pageUpdateTimeout = null;
    const pageCheckPagination = () => {
        // fix number, note that paginationWantedPage starts at 1
        if (paginationWantedPage < 1) paginationWantedPage = 1;
        if (isNaN(paginationWantedPage)) paginationWantedPage = 1;
        if (!isFinite(paginationWantedPage)) paginationWantedPage = 1;
        // queue an update to the page
        const realPage = paginationWantedPage - 1;
        if (pageUpdateTimeout) {
            clearTimeout(pageUpdateTimeout);
            pageUpdateTimeout = null;
        }
        pageUpdateTimeout = setTimeout(() => {
            if (realPage === paginationPage) return;
            paginationPage = realPage;
            pageShouldReload();
        }, 500);
    };
    onMount(() => {
        page.subscribe(store => {
            if (store.url.searchParams.get("type") !== pageType) return window.location.reload();
            if (store.url.searchParams.get("target") !== pageTarget) return window.location.reload();
        });
    });
</script>

<svelte:head>
    <title>PenguinMod - {metaTitle}</title>
    <meta name="title"                   content={`PenguinMod - ${metaTitle}`} />
    <meta property="og:title"            content={`PenguinMod - ${metaTitle}`} />
    <meta property="twitter:title"       content={`PenguinMod - ${metaTitle}`}>
    <meta name="description"             content={metaDescription}>
    <meta property="twitter:description" content={metaDescription}>
    <meta property="og:url"              content="https://penguinmod.com/userlist">
    <meta property="twitter:url"         content="https://penguinmod.com/userlist">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div style="height:24px"></div>
    {#if pageLoading}
        <LoadingSpinner enableTips={true}></LoadingSpinner>
    {:else if pageError}
        <div class="error-penguin">
            <PenguinConfusedSVG height="15rem"></PenguinConfusedSVG>
        </div>
        <p class="error-message">
            {#if pageError === "User not found"}
                <LocalizedText
                    text="This user was not found."
                    key="profile.doesntexist.alt"
                    lang={currentLang}
                />
            {:else}
                <LocalizedText
                    text="This page failed to load, please try again later."
                    key="generic.failedloadpage"
                    lang={currentLang}
                />
            {/if}
        </p>
    {:else}
        {#if pageType === "followers" || pageType === "following"}
            <div class="profile-section">
                <img
                    src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${pageTarget}`}
                    alt="Profile"
                    class="profile-picture"
                />
                <h1><a href={`/profile?user=${pageTarget}`}>
                    {pageTarget}
                </a></h1>
                <div class="profile-switches">
                    <a href={`/userlist?type=followers&target=${encodeURIComponent(pageTarget)}`}>
                        <button>
                            <LocalizedText
                                text="Followers"
                                key="profile.title.followers"
                                lang={currentLang}
                            />
                        </button>
                    </a>
                    <a href={`/userlist?type=following&target=${encodeURIComponent(pageTarget)}`}>
                        <button>
                            <LocalizedText
                                text="Following"
                                key="profile.title.following"
                                lang={currentLang}
                            />
                        </button>
                    </a>
                </div>
            </div>
            <div style="height:24px"></div>
        {/if}

        {#if ((pageType === "followers" || pageType === "following") && pageProfilePrivate) || (pageType === "following" && pageProfilePrivateFollowingList)}
            <div class="section-private">
                <img
                    src="/account/lock.svg"
                    alt="Private"
                    title="Private"
                />
                
                {#if pageProfilePrivateToFollowers}
                    <p>
                        <LocalizedText
                            text={"This profile is private. Only people {{NAME}} follows can see their profile."}
                            key="profile.private.followers"
                            lang={currentLang}
                            replace={{
                                "{{NAME}}": pageTarget,
                            }}
                        />
                    </p>
                {:else if pageProfilePrivateFollowingList}
                    <p>
                        <LocalizedText
                            text="Your account is not allowed to view this."
                            key="generic.limited.view"
                            lang={currentLang}
                        />
                    </p>
                {:else}
                    <p>
                        <LocalizedText
                            text="This profile is private. You cannot view it."
                            key="profile.private"
                            lang={currentLang}
                        />
                    </p>
                {/if}
            </div>
        {:else}
            <div class="list-paging">
                <div class="list-paging-buttons">
                    <button on:click={() => { paginationWantedPage -= 1; pageCheckPagination(); }}>◀</button>
                    <input type="number" bind:value={paginationWantedPage} on:blur={pageCheckPagination}>
                    <button on:click={() => { paginationWantedPage += 1; pageCheckPagination(); }}>▶</button>
                </div>
            </div>
            <div class="list-users">
                {#each pageUsers as follower}
                    <a class="list-user" href={`/profile?user=${encodeURIComponent(follower.username)}`}>
                        <button>
                            <img
                                src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${pageTarget}`}
                                alt="Profile"
                                class="list-user-picture"
                                draggable="false"
                                loading="lazy"
                            />
                            {follower.username}
                        </button>
                    </a>
                {/each}
            </div>
        {/if}
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
        min-width: 730px;
    }

    .error-message {
        width: 100%;
        text-align: center;
    }
    .error-penguin {
        width: 100%;
        
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .list-paging {
        width: 100%;
        height: 2em;

        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
    .list-paging-buttons {
        height: 100%;
    }
    .list-paging-buttons > button,
    .list-paging-buttons > input {
        margin-top: 0;
        margin-bottom: 0;
    }
    .list-paging-buttons > button {
        height: calc(100% - 2px);
        padding: 0 8px;

        background: #00c3ff;
        color: white;
        border: 1px solid rgba(0, 0, 0, 0.25);
        border-radius: 4px;

        cursor: pointer;
    }
    .list-paging-buttons > input {
        width: 3em;
        height: calc(100% - 2px);
        padding: 0 8px;

        background: white;
        border: 1px solid rgba(0, 0, 0, 0.25);
        border-radius: 4px;
    }

    .list-users {
        width: 100%;
        
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .list-user {
        width: 90%;
        height: 3em;
        max-width: 684px;
        margin: 4px 0;
        
        text-decoration: none;
    }
    .list-user button {
        width: 100%;
        height: 100%;
        
        display: flex;
        flex-direction: row;
        align-items: center;

        background: none;
        border: 0;
        text-align: left;
        font-size: large;

        cursor: pointer;
    }
    .list-user-picture {
        height: 100%;
        margin-right: 8px;
        
        border-radius: 8px;
    }

    .profile-section {
        width: 100%;
        height: 6em;
        
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
    .profile-section > h1 {
        margin: 0 8px;
    }
    .profile-section > h1 a {
        color: black;
        text-decoration: none;
    }
    :global(body.dark-mode) .profile-section > h1 a {
        color: white;
    }
    .profile-picture {
        height: 100%;
        
        border-radius: 8px;
    }
    .profile-switches button {
        margin: 8px 0;

        display: flex;
        flex-direction: column;
        align-items: center;

        background: transparent;
        border: 0;
        font-size: large;
        color: black;

        cursor: pointer;
    }
    :global(body.dark-mode) .profile-switches button {
        color: white;
    }
    .profile-switches a {
        text-decoration: none;
    }
</style>
