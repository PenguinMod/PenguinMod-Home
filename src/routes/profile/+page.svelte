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

    import { page } from "$app/stores";

    let loggedIn = null;
    let loggedInUser = "";

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
    let fullProfile = {};
    let isRankingUpMenu = false;
    let isAttemptingRankUp = false;

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
        ProjectApi.getProfile(user).then((proffile) => {
            fullProfile = proffile;
            badges = fullProfile.badges;
            isDonator = fullProfile.donator;
            followerCount = fullProfile.followers;
        });

        page.subscribe(v => {
            if (!v.url.searchParams.get("user") || !user) return;
            if (v.url.searchParams.get("user") == user) return;
            
            window.location.reload();
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
                loggedInUser = "";
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
                        loggedInUser = "";
                        loggedInChange();
                        reject();
                    })
                    .catch(() => {
                        loggedIn = false;
                        loggedInUser = "";
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
            loggedInUser = "";
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
                loggedInUser = "";
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
                loggedInChange();
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        loggedInUser = "";
        loggedInChange();
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
                    loggedInChange();
                    return;
                }
                loggedIn = false;
                loggedInUser = "";
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
                loggedInChange();
            });
    });

    const rankUpAccount = () => {
        isAttemptingRankUp = true;
        ProjectClient.attemptRankUp()
            .then(() => {
                window.location.reload();
            })
            .catch((err) => {
                console.error(err);
                alert(`${TranslationHandler.text(
                    "profile.rankup.error",
                    currentLang
                )}\n${err}`);
                isAttemptingRankUp = false;
                isRankingUpMenu = false;
            });
    };
</script>

<svelte:head>
    <title>PenguinMod - {user ? user : "Profile"}</title>
    <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8116356065497356"
        crossorigin="anonymous"
    />
</svelte:head>

<NavigationBar />

{#if isRankingUpMenu}
    <div class="scratch-modal-back">
        <div class="scratch-modal">
            <div class="scratch-modal-title">
                <LocalizedText
                    text="Rank up"
                    key="profile.rankup.title"
                    lang={currentLang}
                />
            </div>
            <div class="scratch-modal-content">
                <img src="/penguins/rankup.svg" alt="Rank up" />
                <p style="text-align:center;">
                    <LocalizedText
                        text="Let's see if you can become a real penguin!"
                        key="profile.rankup.message1"
                        lang={currentLang}
                    />
                    <br />
                    <LocalizedText
                        text="This will allow you to upload projects with custom extensions and other built-in extensions."
                        key="profile.rankup.message2"
                        lang={currentLang}
                    />
                </p>
                {#if isAttemptingRankUp}
                    <LoadingSpinner />
                {:else}
                    <Button on:click={rankUpAccount}>
                        <LocalizedText
                            text="Rank up"
                            key="profile.rankup.title"
                            lang={currentLang}
                        />
                    </Button>
                {/if}
            </div>
        </div>
    </div>
{/if}

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    {#if projects.all.length > 0}
        {#if projects.all[0] !== "none" || (loggedIn && user === loggedInUser)}
        <div class="background">
            {#if user}
                <div class="section-user">
                    <div class="section-user-header">
                        <div class="subuser-section">
                            <div class="user-username">
                                <img
                                    style="border-color:{isDonator ? "#a237db" : "#efefef"}"
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
                                </div>
                            </div>
                        <div class="follower-section">
                            <p class="follower-count">
                                {TranslationHandler.text(
                                    "profile.followers",
                                    currentLang
                                ).replace("$1", followerCount)}
                            </p>
                            <div>
                                {#if !(loggedIn && user === loggedInUser)}
                                    {#key isFollowingUser}
                                        <button
                                            class={`follower-button
                                                ${isDonator ? ' follower-button-donator' : ''}
                                                ${isFollowingUser ? ' follower-button-following' : ''}`}
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
                                        </button>
                                    {/key}
                                {/if}
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="section-projects">
                <div class="user-ordering-stats" style="width:90%;margin:10px;">
                    <div class="section-user-stats">
                        <div class="user-stat-box" style="border-bottom: 1px solid rgba(0, 0, 0, 0.15);">
                            <div class="user-stat-box-inner">
                                <LocalizedText
                                    text="Rank"
                                    key="profile.ranking.title"
                                    lang={currentLang}
                                />
                            </div>
                            <p class="small" style="margin-block:4px">
                                {#if fullProfile.admin === true}
                                    <LocalizedText
                                        text="King Penguin"
                                        key="profile.ranking.admin"
                                        lang={currentLang}
                                    />
                                {:else if fullProfile.approver === true}
                                    <LocalizedText
                                        text="Guard Penguin"
                                        key="profile.ranking.mod"
                                        lang={currentLang}
                                    />
                                {:else if fullProfile.rank === 1}
                                    <LocalizedText
                                        text="Penguin"
                                        key="profile.ranking.ranked"
                                        lang={currentLang}
                                    />
                                {:else}
                                    <LocalizedText
                                        text="Newborn Penguin"
                                        key="profile.ranking.new"
                                        lang={currentLang}
                                    />
                                {/if}
                                {#if loggedIn && user === loggedInUser && fullProfile.rank === 0}
                                    {#if fullProfile.canrankup !== true}
                                        <span style="opacity: 0.5;font-size:.7em;">
                                            <br>
                                            <LocalizedText
                                                text="Cannot rank up yet"
                                                key="profile.rankup.cannot"
                                                lang={currentLang}
                                            />
                                        </span>
                                    {:else}
                                        <!-- svelte-ignore a11y-invalid-attribute -->
                                        <a
                                            href="#"
                                            style="color:dodgerblue;font-size:.6em;"
                                            on:click={() => {
                                                isRankingUpMenu = true;
                                            }}
                                        >
                                            <br>
                                            <LocalizedText
                                                text="Rank up"
                                                key="profile.rankup.title"
                                                lang={currentLang}
                                            />
                                            <div class="rankup-badge">
                                                !
                                            </div>
                                        </a>
                                    {/if}
                                {/if}
                            </p>
                        </div>
                        <div class="user-stat-box">
                            <div class="user-stat-box-inner">
                                <LocalizedText
                                    text="Badges"
                                    key="profile.badges.title"
                                    lang={currentLang}
                                />
                            </div>
                            <div class="user-box-maxwidth"></div>
                            <div class="user-badge-container">
                            <div class="user-badges">
                                {#each badges as badge, idx}
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
                                {:else}
                                    <p style="font-size: initial; font-weight: normal; width: 100%; text-align: center;">
                                        <LocalizedText
                                            text="Nothing was found."
                                            key="generic.notfound"
                                            lang={currentLang}
                                        />
                                    </p>
                                {/each}
                            </div>
                        </div>
                        </div>
                    </div>
                        <ContentCategory
                            header={TranslationHandler.text(
                                "profile.projects.featured",
                                currentLang
                            )}
                            style="width:65%;margin:0px;"
                            stylec="height: 244px;"
                            seemore={`/search?q=user%3A${user} featured%3Atrue`}
                        >
                            <div class="project-list">
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
                                            key="generic.notfound"
                                            lang={currentLang}
                                        />
                                    </p>
                                </div>
                                {/if}
                            </div>
                        </ContentCategory>
                    </div>
                <ContentCategory
                    header={TranslationHandler.text(
                        "profile.projects.all",
                        currentLang
                    )}
                    style="width:calc(90% - 10px);"
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
                                            key="generic.notfound"
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
            <div class="section-serious-actions">
                {#if !(loggedIn && user === loggedInUser)}
                    <div class="report-action">
                        <a
                            href={`/report?type=user&id=${user}`}
                            target="_blank"
                            class="report-link"
                            style="color: red !important;"
                        >
                            <img
                                class="report-icon"
                                src="/report_flag.png"
                                alt="Report"
                            />
                            <LocalizedText
                                text="Report"
                                key="report.title"
                                lang={currentLang}
                            />
                        </a>
                    </div>
                {/if}
            </div>
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
        top: 0px;
        left: 0px;
        width: 100%;
        min-width: 1000px;
    }
    .background {
        margin: auto;
        width: 80%;
    }

    .user-stat-box {
        height: 50%;
        display: flex;
        justify-content: center;
        font-weight: bolder;
        font-size: 1.7em;
        flex-wrap: wrap;
    }

    .user-stat-box-inner {
        margin-top: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        height: 35px;
        text-align: center;
        width: 50%;
    }
    :global(body.dark-mode) .user-stat-box-inner {
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
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
    .section-serious-actions {
        /* padding-top: 120px; */
        padding-bottom: 10px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        width: 95%;
    }
    .report-action {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .report-action img {
        margin: 0 4px;
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

    .scratch-modal-back {
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 6000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .scratch-modal {
        overflow: hidden;
        border: 4px solid hsla(0, 100%, 100%, 0.25);
        outline: none;
        border-radius: 0.5rem;
    }
    .scratch-modal-title {
        background: #00c3ff;
        color: white;
        font-size: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 3.125rem;
    }
    .scratch-modal-content {
        padding: 12px;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    :global(body.dark-mode) .scratch-modal-content {
        background: #111;
    }

    .profile-picture {
        border-radius: 15px;
        height: 80px;
        width: 80px;
        border-style: solid;
        border-width: 2px;
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

    .small {
        font-size: .8em;
        font-weight: lighter;
        text-align: center;
        width: 100%;
    }
    .rankup-badge {
        display: inline-block;
        text-align: center;
        background: red;
        color: white;
        font-weight: bold;
        border-radius: 1000px;
        width: 16px;
        height: 16px;
    }
    .report-link {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .report-icon {
        height: 16px;
    }

    .section-user-header {
        margin: 10px;
        margin-top: 20px;
        width: 80%;
        vertical-align: middle;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .section-user-stats {
        height: 295px;
        width: 30%;
        margin-right: 5%;
        border-radius: 8px;
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.3);
        border-style: solid;
    }
    :global(html[dir="rtl"]) .section-user-stats {
        margin-right: inherit;
        margin-left: 5%;
    }
    .user-ordering-stats {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .user-box-maxwidth {
        width: 100%;
        height: 1px;
    }
    :global(body.dark-mode) .section-user-stats {
        border-color: rgba(255, 255, 255, 0.3);
    }

    .follower-section {
        width: auto;
        margin-right: 0px;
        text-align: center;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .follower-count {
        font-size: medium;
        text-align: center;
        font-weight: bold;
        margin: 0 6px;
    }
    .follower-button {
        width: 100px;
        height: 35px;
        font-size: medium;
        font-weight: bold;
        background-color: rgb(0, 195, 255);
        color: white;
        border-radius: 10px;
        border-color: rgba(0, 0, 0, 0.25);
        border-width: 1px;
        border-style: solid;
        text-align: center;
        cursor: pointer;
    }
    .follower-button-donator {
        background-color: #c65cff;
    }
    .follower-button-following {
        background-color: rgb(163, 163, 163);
    }
    :global(body.dark-mode) .follower-button {
        border-color: rgba(255, 255, 255, 0.25);
    }

    .subuser-section {
        width: 100%;
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
        font-size: 3em;
        font-weight: bolder;
        margin-block: 0.2rem;
        margin-left: 20px;
    }

    .user-badge-container {
        margin: 0px;
        /* TODO: this is a bandaid fix, properly fix it later */
        margin-top: -64px;
        height: 32px;
        width: 200px;
        /* TODO: too many badges will overflow this box, fix this later */
    }
    .user-badges {
        display: flex;
        flex-flow: row;
        flex-wrap: wrap;
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
