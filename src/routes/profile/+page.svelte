<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    const ProjectClient = new ProjectApi();

    // Static values
    import ProfileBadges from "../../resources/badges.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import ContentCategory from "$lib/ContentCategory/Component.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Project from "$lib/Project/Project.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let loggedIn = null;
    let loggedInUser = '';

    let user;
    const projects = {
        all: [],
        featured: [],
    };
    let badges = [];
    let focusedBadge = -1;
    let isDonator = false;
    let isFollowingUser = false;
    let followerCount = null;

    const loggedInChange = async () => {
        if (!loggedIn) {
            isFollowingUser = false;
            return;
        }
        const isFollowing = await ProjectClient.isFollowingUser(user);
        isFollowingUser = isFollowing;
    };
    onMount(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get("user");
        user = query;

        ProjectApi.getUserProjects(user).then((projs) => {
            projects.all = projs;
            projects.featured = projs.filter((p) => p.featured);
            if (projects.all.length <= 0) {
                projects.all = ["none"];
            }
            if (projects.featured.length <= 0) {
                projects.featured = ["none"];
            }
        });
        ProjectApi.getUserBadges(user).then((badgs) => {
            badges = badgs;
            isDonator = badges.includes("donator");
        });
        ProjectApi.getFollowerCount(user).then((foolowerCount) => {
            followerCount = foolowerCount;
        });
    });

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    const waitForLogin = () => {
        return new Promise((resolve, reject) => {
            if (loggedIn) return resolve();
            Authentication.authenticate().then((privateCode) => {
                loggedIn = null;
                loggedInUser = '';
                Authentication.usernameFromCode(privateCode)
                    .then(({ username }) => {
                        if (username) {
                            loggedIn = true;
                            loggedInUser = username;
                            loggedInChange();
                            resolve();
                            return;
                        }
                        loggedIn = false;
                        loggedInUser = '';
                        loggedInChange();
                        reject();
                    })
                    .catch(() => {
                        loggedIn = false;
                        loggedInUser = '';
                        loggedInChange();
                        reject();
                    });
            });
        });
    };
    let canClickFollow = true;
    const followUser = async () => {
        await waitForLogin();
        const info = await ProjectClient.toggleFollowingUser(user);
        isFollowingUser = info.following;
    };
    const safeFollowUser = async () => {
        if (!canClickFollow) return;
        canClickFollow = false;
        try {
            await followUser();
        } catch (err) {
            console.error("couldnt follow user", err);
        }
        canClickFollow = true;
    };

    // login code below
    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            loggedInUser = '';
            loggedInChange();
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    loggedInUser = username;
                    loggedInChange();
                    return;
                }
                loggedIn = false;
                loggedInUser = '';
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = '';
                loggedInChange();
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        loggedInUser = '';
        loggedInChange();
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        loggedInUser = '';
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    loggedInUser = username;
                    loggedInChange();
                    return;
                }
                loggedIn = false;
                loggedInUser = '';
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = '';
                loggedInChange();
            });
    });
</script>

<head>
    <title>PenguinMod - {user ? user : "Profile"}</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    {#if projects.all.length > 0 || user === loggedInUser}
        {#if projects.all[0] !== "none"}
            {#if user}
                <div class="section-user">
                    <div class="subuser-section">
                        <div class="user-username">
                            <img
                                src={`https://trampoline.turbowarp.org/avatars/by-username/${user}`}
                                alt="Profile"
                                class="profile-picture"
                            />
                            <div class="user-after-image">
                                {#if isDonator}
                                    <h1 class="donator-color">{user}</h1>
                                {:else}
                                    <h1>{user}</h1>
                                {/if}
                                <div class="user-badges">
                                    {#each badges as badge, idx}
                                        <!-- TODO: these should be clickable & have proper
                                alts + titles -->
                                        <button
                                            on:click={() => {
                                                focusedBadge = idx;
                                            }}
                                            on:focusout={() => {
                                                focusedBadge = -1;
                                            }}
                                            title={TranslationHandler.text(
                                                `profile.badge.${badge}`,
                                                currentLang
                                            )}
                                        >
                                            <img
                                                src={`/badges/${ProfileBadges[badge]}.png`}
                                                alt={TranslationHandler.text(
                                                    `profile.badge.${badge}`,
                                                    currentLang
                                                )}
                                                title={TranslationHandler.text(
                                                    `profile.badge.${badge}`,
                                                    currentLang
                                                )}
                                            />
                                            {#if focusedBadge === idx}
                                                <div class="badge-info">
                                                    {TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        currentLang
                                                    )}
                                                </div>
                                            {/if}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                        <div>
                            {#key isFollowingUser}
                                <Button
                                    color={isDonator ? "purple" : false}
                                    toggled={isFollowingUser}
                                    on:click={safeFollowUser}
                                >
                                    {#if isFollowingUser}
                                        <LocalizedText
                                            text="Unfollow"
                                            key="profile.unfollow"
                                            dontlink={true}
                                            lang={currentLang}
                                        />
                                    {:else}
                                        <LocalizedText
                                            text="Follow"
                                            key="profile.follow"
                                            dontlink={true}
                                            lang={currentLang}
                                        />
                                    {/if}
                                </Button>
                            {/key}
                            <p
                                style="font-size:small;text-align:center;margin-block:0.5em"
                            >
                                {TranslationHandler.text(
                                    "profile.followers",
                                    currentLang
                                ).replace("$1", followerCount)}
                            </p>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="section-projects">
                <ContentCategory
                    header={TranslationHandler.text(
                        "profile.projects.featured",
                        currentLang
                    )}
                    style="width:65%;"
                    stylec="height: 244px;"
                    seemore={`/search?q=user%3A${user} featured%3Atrue`}
                >
                    <div class="project-list">
                        {#if projects.featured.length > 0}
                            {#if projects.featured[0] !== "none"}
                                {#each projects.featured as project}
                                    <Project {...project} />
                                {/each}
                            {:else}
                                <div class="none-found">
                                    <PenguinConfusedSVG height="10rem" />
                                    <p>
                                        <LocalizedText
                                            text="Nothing was found. Did you misspell something or does the user not exist?"
                                            key="generic.notfoundonuser"
                                            lang={currentLang}
                                        />
                                    </p>
                                </div>
                            {/if}
                        {:else}
                            <LoadingSpinner />
                        {/if}
                    </div>
                </ContentCategory>
                <ContentCategory
                    header={TranslationHandler.text(
                        "profile.projects.all",
                        currentLang
                    )}
                    style="width:65%;"
                    stylec="height: 244px;"
                    seemore={`/search?q=user%3A${user}`}
                >
                    <div class="project-list">
                        {#if projects.all.length > 0}
                            {#if projects.all[0] !== "none"}
                                {#each projects.all as project}
                                    <Project {...project} />
                                {/each}
                            {:else}
                                <div class="none-found">
                                    <PenguinConfusedSVG height="10rem" />
                                    <p>
                                        <LocalizedText
                                            text="Nothing was found. Did you misspell something or does the user not exist?"
                                            key="generic.notfoundonuser"
                                            lang={currentLang}
                                        />
                                    </p>
                                </div>
                            {/if}
                        {:else}
                            <LoadingSpinner />
                        {/if}
                    </div>
                </ContentCategory>
            </div>
        {:else}
            <div style="height:32px;" />
            <div style="display:flex;flex-direction:column;align-items:center;">
                <PenguinConfusedSVG height="10rem" />
                <p>
                    <LocalizedText
                        text="This user was not found. A user must have 1 uploaded project to view their profile."
                        key="profile.doesntexist"
                        lang={currentLang}
                    />
                </p>
            </div>
        {/if}
    {:else}
        <div style="height:32px;" />
        <LoadingSpinner enableTips={true} />
    {/if}
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

    :global(body.dark-mode) .main {
        color: white;
    }

    .section-projects {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .section-user {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
        margin-top: 6px;
    }

    .project-list {
        display: flex;
        flex-direction: row;
    }

    .none-found {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        height: 100%;
        text-align: center;
    }

    .profile-picture {
        margin-right: 8px;
        border-radius: 4px;
        height: 128px;
        width: 128px;
    }
    :global(html[dir="rtl"]) .profile-picture {
        margin-right: initial;
        margin-left: 8px;
    }

    .donator-color {
        color: #a237db;
    }
    :global(body.dark-mode) .donator-color {
        color: #c65cff;
    }

    .subuser-section {
        width: 65.5%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .user-username {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .user-after-image {
        display: flex;
        flex-direction: column;
    }
    .user-after-image > h1 {
        margin-block: 0.2rem;
    }
    .user-badges {
        display: flex;
        flex-direction: row;
    }
    .user-badges button {
        position: relative;
        margin: 0 4px;
        border: 0;
        padding: 0;
        width: 32px;
        height: 32px;
        background: transparent;
        cursor: pointer;
    }
    .user-badges button img {
        margin: 0;
        border: 0;
        padding: 0;
        width: 32px;
        height: 32px;
    }

    .badge-info {
        position: absolute;
        top: 36px;
        left: 0;
        padding: 8px 16px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        transform-origin: center;
        transform: translateX(calc(50% - 64px));
        z-index: 5000;
    }
</style>
