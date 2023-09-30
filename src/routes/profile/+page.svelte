<script>
    import { onMount } from "svelte";
    import ProjectApi from "../../resources/projectapi.js";

    // Static values
    import LINK from "../../resources/urls.js";

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

    let user;
    const projects = {
        all: [],
        featured: [],
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
    });

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

<head>
    <title>PenguinMod - {user ? user : "Profile"}</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    {#if projects.all.length > 0}
        {#if projects.all[0] !== "none"}
            {#if user}
                <div class="section-user">
                    <div class="subuser-section">
                        <div class="user-username">
                            <img
                                src={`https://trampoline.turbowarp.org/avatars/by-username/${user}`}
                                alt="Profile"
                                style="margin-right:8px;border-radius:4px;height:128px;width:128px;"
                            />
                            <h1>{user}</h1>
                        </div>
                        <Button link={`https://scratch.mit.edu/users/${user}/`}>
                            <LocalizedText
                                text="View on Scratch"
                                key="profile.scratchprofile"
                                dontlink={true}
                                lang={currentLang}
                            />
                        </Button>
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
</style>
