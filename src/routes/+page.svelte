<script>
    import { onMount } from "svelte";
    import ProjectApi from "../resources/projectapi.js";

    // Static values
    import LINK from "../resources/urls.js";

    // Components
    import NavigationBar from "../components/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "../components/NavigationBar/NavMargin.svelte";
    import Button from "../components/Button/Button.svelte";
    import ContentCategory from "../components/ContentCategory/Component.svelte";
    import LoadingSpinner from "../components/LoadingSpinner/Spinner.svelte";
    import UserDisplay from "../components/UserDisplay/Display.svelte";
    import Project from "../components/Project/Project.svelte";

    let ghcommits = [];
    let updates = [];

    let projects = {
        featuredweek: [],
        today: [],
    };

    onMount(() => {
        fetch(`${LINK.basicApi}commits`).then((res) => {
            res.json().then((commits) => {
                ghcommits = commits;
            });
        });
        fetch(LINK.updateReaderApi).then((res) => {
            res.json().then((updatess) => {
                // currently multiple updates are not supported
                updates = [updatess];
            });
        });

        ProjectApi.getProjects().then((projs) => {
            projects.today = projs;
        });
    });
</script>

<head>
    <title>PenguinMod - Home</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <div style="margin-left: 8rem;">
            <h1>Block-based coding with tons of capabilities</h1>
            <h1>
                Built off of
                <a href={LINK.turbowarp} target="_blank">TurboWarp</a>
                and
                <a href={LINK.scratch} target="_blank">Scratch</a>
            </h1>
            <Button
                label="<img src='/tryit.svg' width='32px' style='margin-right:8px'></img> Try it out"
                highlighted="true"
                link={LINK.editor}
            />
        </div>

        <video
            width="426.666667"
            height="240"
            autoplay="true"
            muted="true"
            loop="true"
            class="example-video"
        >
            <source src="/example.mp4" type="video/mp4" />
            <track kind="captions" />
        </video>
    </div>

    <div class="section-links">
        <Button label="Project Packager" link={LINK.packager} />
        <Button label="Credits" link={LINK.credits} />
        <Button label="GitHub" link={LINK.github} />
        <Button label="Community Wiki" link={LINK.wiki} />
    </div>

    <div
        style="width:100%;display:flex;flex-direction:row;justify-content: center;"
    >
        <p>
            <i>
                This page is still in development, some features likely will not
                work yet.
            </i>
        </p>
    </div>

    <div class="section-categories">
        <ContentCategory
            header="What's new?"
            seemore={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
        >
            <div class="category-content">
                {#if updates.length > 0}
                    {#each updates as update}
                        <UserDisplay
                            link={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
                            userLink={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
                            text={update.cleanContent}
                            author={update.authorName}
                            image={update.authorImage}
                        />
                        <img
                            src={update.image}
                            alt="Update Screenshot"
                            class="update-image"
                        />
                    {/each}
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        <ContentCategory header="Recent changes" seemore={LINK.github}>
            <div class="category-content">
                {#if ghcommits.length > 0}
                    {#each ghcommits as commit}
                        <UserDisplay
                            link={commit.html_url}
                            userLink={commit.author.html_url}
                            text={commit.commit.message}
                            author={commit.author.login}
                            image={commit.author.avatar_url}
                        />
                    {/each}
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
    </div>
    <div style="height:32px;" />
    <div class="section-projects">
        <ContentCategory
            header="Featured projects of the Week"
            seemore={`/search?q=featured%3Aprojects`}
            style="width:65%;"
            stylec="height: 244px;"
        >
            <div class="project-list">
                {#if projects.today.length > 0}
                    {#each projects.today as project}
                        {#if Date.now() - project.date <= 604800000 && project.featured === true}
                            <Project {...project} />
                        {/if}
                    {/each}
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        <ContentCategory
            header="Today's projects"
            seemore={`/search?q=all%3Aprojects`}
            style="width:65%;"
            stylec="height: 244px;"
        >
            <div class="project-list">
                {#if projects.today.length > 0}
                    {#each projects.today as project}
                        {#if Date.now() - project.date <= 86400000}
                            <Project {...project} />
                        {/if}
                    {/each}
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
    </div>
    <div style="height:32px;" />
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

    .section-info {
        background: #00c3ffad;
        height: 24rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    .section-links {
        background: #00c3ff28;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 0.5rem 0;
        margin: 0px;
    }

    .section-info a {
        color: white;
    }

    .section-categories {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }

    .section-projects {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }

    .example-video {
        border-radius: 6px;
        outline-style: solid;
        outline-width: 6px;
        outline-color: rgba(255, 255, 255, 0.35);
        margin-right: 8rem;
    }

    .category-content {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .update-image {
        margin-top: 4px;
        width: 100%;
        height: 100%;
    }

    .project-list {
        display: flex;
        flex-direction: row;
    }
</style>
