<script>
    import { onMount } from "svelte";
    import Authentication from "../resources/authentication.js";
    import ProjectApi from "../resources/projectapi.js";

    // Static values
    import LINK from "../resources/urls.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import ContentCategory from "$lib/ContentCategory/Component.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import UserDisplay from "$lib/UserDisplay/Display.svelte";
    import Project from "$lib/Project/Project.svelte";

    // Icons
    import PenguinConfusedSVG from "../icons/Penguin/confused.svelte";

    let loggedIn = null;

    let ghcommits = [];
    let updates = [];
    let ghcommitsFailed = false;
    let ghcommitsLoaded = false;

    let projects = {
        today: [],
    };

    onMount(() => {
        const projectId = Number(location.hash.replace("#", ""));
        if (!isNaN(projectId) && projectId != 0) {
            location.href = `https://studio.penguinmod.site/#${projectId}`;
            return;
        }

        fetch(`${LINK.basicApi}commits`)
            .then((res) => {
                res.json()
                    .then((commits) => {
                        ghcommits = commits;
                        ghcommitsLoaded = true;
                    })
                    .catch(() => {
                        ghcommitsFailed = true;
                    });
            })
            .catch(() => {
                ghcommitsFailed = true;
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

    // login code below

    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then((username) => {
                if (username) {
                    loggedIn = true;
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        Authentication.usernameFromCode(privateCode)
            .then((username) => {
                if (username) {
                    loggedIn = true;
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });
</script>

<head>
    <title>PenguinMod - Home</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    {#if loggedIn === false}
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
    {/if}

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
        <ContentCategory header="Recent commits" seemore={LINK.github}>
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
                {:else if ghcommitsFailed}
                    <p>Failed to load commits.</p>
                {:else if ghcommitsLoaded}
                    <p style="text-align: center;">
                        GitHub failed to provide commits.
                        <br />
                        Please try again later.
                    </p>
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
                        {#if project.featured === true}
                            <Project {...project} />
                        {/if}
                    {/each}
                    {#if projects.today.filter((proj) => proj.featured === true).length <= 0}
                        <div
                            style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                        >
                            <PenguinConfusedSVG width="8rem" />
                            <p>
                                Nothing found. You can help feature projects by
                                clicking the yellow checkmark below them.
                            </p>
                        </div>
                    {/if}
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
                        <Project {...project} />
                    {/each}
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
    </div>

    <div class="footer">
        <p>
            PenguinMod is not affiliated with Scratch, TurboWarp, the Scratch
            Team, or the Scratch Foundation.
        </p>
        <div class="footer-list">
            <div class="footer-section">
                <p>Website</p>
                <a href={LINK.editor}>Editor</a>
                <a href={LINK.credits}>Credits</a>
                <a href={LINK.github}>Source</a>
                <a href={LINK.packager}>Packager</a>
            </div>
            <div class="footer-section">
                <p>Community</p>
                <a target="_blank" href={LINK.discord}>Discord</a>
                <a target="_blank" href={LINK.wiki}>Wiki</a>
            </div>
            <div class="footer-section">
                <p>Info</p>
                <a target="_blank" href={LINK.privacy}>Privacy Policy</a>
                <a target="_blank" href={LINK.guidelines.projects}
                    >Uploading Guidelines</a
                >
            </div>
            <div class="footer-section">
                <p>Donate</p>
                <a target="_blank" href={LINK.donate.scratch}>Scratch</a>
                <a target="_blank" href={LINK.donate.turbowarp}>TurboWarp</a>
            </div>
        </div>
    </div>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 24px 0px 48px;
        border-top: rgba(0, 0, 0, 0.3) 1px solid;
        background: #00c3ff15;
        font-weight: bold;
        margin-top: 4px;
        /* border-top-left-radius: 20%; */
        /* border-top-right-radius: 20%; */
    }
    .footer a {
        color: dodgerblue;
        font-weight: normal;
        margin: 2px 0px;
    }
    .footer a:active {
        color: rgb(15, 77, 139);
    }
    .footer-list {
        display: flex;
        align-items: flex-start;
        justify-content: center;
    }
    .footer-section {
        display: flex;
        flex-direction: column;
        margin: 0px 32px;
        font-size: 14px;
    }
    :global(body.dark-mode) .footer {
        /* border-top: rgba(255, 255, 255, 0.1) 1px solid; */
        border-top: rgba(255, 255, 255, 0.3) 1px solid;
        /* background: transparent; */
        /* background: #0059ff15; */
        /* border-top-left-radius: 20%; */
        /* border-top-right-radius: 20%; */
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
