<script>
    import { onMount } from "svelte";
    import Authentication from "../resources/authentication.js";
    import ProjectApi from "../resources/projectapi.js";
    import censor from "../resources/basiccensorship.js";

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
    import Alert from "$lib/Alert/Alert.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../resources/translations.js";
    import Language from "../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../icons/Penguin/confused.svelte";

    let loggedIn = null;

    let ghcommits = [];
    let updates = [];
    let ghcommitsFailed = false;
    let ghcommitsLoaded = false;
    let projectsLoaded = false;
    let projectsFailed = false;

    let projects = {
        today: [],
        featured: [],
    };

    onMount(async () => {
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

        ProjectApi.getMaxProjects(15, false, true).then((projs) => {
            projects.today = projs;
        });
        ProjectApi.getMaxProjects(15, true, false)
            .then((projs) => {
                projects.featured = projs;
                projectsLoaded = true;
            })
            .catch(() => {
                projectsFailed = true;
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
            .then(({ username }) => {
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
            .then(({ username }) => {
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

    let langDecided = false;
    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
        langDecided = true;
    });
</script>

<head>
    <title>PenguinMod - Home</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <Alert
        text={"PenguinMod is a free-to-use visual coding website. Your support can help us keep the website working!"}
        textColor={"white"}
        hasImage={true}
        imgSrc={"/happy.svg"}
        imgAlt={":D"}
        hasButton={true}
        buttonText={"Donate"}
        buttonHref={"/donate"}
    />
    <StatusAlert />

    {#if loggedIn === false}
        <div class="section-info">
            <div style="margin-left: 8rem;">
                <h1>
                    <LocalizedText
                        text="Block-based coding with tons of capabilities"
                        key="home.introduction1"
                        lang={currentLang}
                    />
                </h1>
                <h1>
                    <LocalizedText
                        text="Built off of TurboWarp and Scratch"
                        key="home.introduction2"
                        lang={currentLang}
                    />
                </h1>
                <Button
                    label="<img src='/tryit.svg' width='32px' style='margin-right:8px'></img>"
                    highlighted="true"
                    link={LINK.editor}
                >
                    <LocalizedText
                        text="Try it out"
                        key="home.tryout"
                        lang={currentLang}
                    />
                </Button>
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

        {#if langDecided && currentLang != "en" && loggedIn === false}
            <div class="section-language-warning">
                <img
                    src="/warning.png"
                    draggable="false"
                    style="height: 24px; margin-right: 6px"
                    alt="Warning"
                />
                <p>
                    <LocalizedText
                        text="PenguinMod is made by English-speaking developers. Expect minor issues and sorry for any translation errors."
                        key="translation.warning"
                        lang={currentLang}
                    />
                </p>
            </div>
        {/if}

        <div class="section-links">
            <Button link={LINK.packager}>
                <LocalizedText
                    text="Packager"
                    key="home.footer.sections.website.packager"
                    lang={currentLang}
                />
            </Button>
            <Button link={LINK.credits}>
                <LocalizedText
                    text="Credits"
                    key="home.footer.sections.website.credits"
                    lang={currentLang}
                />
            </Button>
            <Button link={"/donate"}>
                <LocalizedText
                    text="Donate"
                    key="home.footer.sections.donate"
                    lang={currentLang}
                />
            </Button>
            <Button label="GitHub" link={LINK.github} />
            <Button link={LINK.wiki}>
                <LocalizedText
                    text="Community Wiki"
                    key="home.footer.sections.community.wiki"
                    lang={currentLang}
                />
            </Button>
        </div>
    {/if}
    {#if langDecided && currentLang != "en" && loggedIn !== false}
        <div class="section-language-warning">
            <img
                src="/warning.png"
                draggable="false"
                style="height: 24px; margin-right: 6px"
                alt="Warning"
            />
            <p>
                <LocalizedText
                    text="PenguinMod is made by English-speaking developers. Expect minor issues and sorry for any translation errors."
                    key="translation.warning"
                    lang={currentLang}
                />
            </p>
        </div>
    {/if}

    <p style="width: 100%; text-align: center;">
        <i>
            <LocalizedText
                text="Scratch Note: Please don't mention PenguinMod on Scratch, we have different rules compared to Scratch! 😅"
                key="home.scratchnote"
                dontlink={true}
                lang={currentLang}
            />
        </i>
    </p>

    <div class="section-categories">
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.whatsnew",
                currentLang
            )}
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
                        <a target="_blank" href={update.image}>
                            <button class="update-image-wrapper">
                                <img
                                    src={update.image}
                                    alt="Screenshot"
                                    class="update-image"
                                />
                            </button>
                        </a>
                    {/each}
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.githubcommits",
                currentLang
            )}
            seemore={LINK.github}
        >
            <div class="category-content">
                {#if ghcommits.length > 0}
                    {#each ghcommits as commit}
                        {#if commit}
                            <UserDisplay
                                link={commit.html_url}
                                userLink={commit.author
                                    ? commit.author.html_url
                                    : ""}
                                text={censor(commit.commit.message)}
                                author={commit.author
                                    ? commit.author.login
                                    : ""}
                                image={commit.author
                                    ? commit.author.avatar_url
                                    : ""}
                            />
                        {/if}
                    {/each}
                {:else if ghcommitsFailed}
                    <p>
                        <LocalizedText
                            text="Failed to load commits."
                            key="home.sections.githubcommits.failed.generic"
                            lang={currentLang}
                        />
                    </p>
                {:else if ghcommitsLoaded}
                    <p style="text-align: center;">
                        <LocalizedText
                            text="GitHub failed to provide commits. Please try again later."
                            key="home.sections.githubcommits.failed.provide"
                            lang={currentLang}
                        />
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
            header={TranslationHandler.text(
                "home.sections.weeklyfeatured",
                currentLang
            )}
            seemore={`/search?q=featured%3Aprojects`}
            style="width:65%;"
            stylec="height: 244px;"
        >
            <div class="project-list">
                {#if projects.featured.length > 0}
                    {#each projects.featured as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsLoaded === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
                        <PenguinConfusedSVG width="8rem" />
                        <p>
                            <LocalizedText
                                text="Nothing found. You can help feature projects by clicking the yellow checkmark below them."
                                key="home.none.featured"
                                lang={currentLang}
                            />
                        </p>
                    </div>
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
                        <img
                            src="/penguins/server.svg"
                            alt="Server Penguin"
                            style="width: 15rem"
                        />
                        <p>
                            <LocalizedText
                                text="Whoops! Our server's having some problems. Try again later."
                                key="home.server.error"
                                lang={currentLang}
                            />
                        </p>
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.todaysprojects",
                currentLang
            )}
            seemore={`/search?q=all%3Aprojects`}
            style="width:65%;"
            stylec="height: 244px;"
        >
            <div class="project-list">
                {#if projects.today.length > 0}
                    {#each projects.today as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
                        <img
                            src="/penguins/server.svg"
                            alt="Server Penguin"
                            style="width: 15rem"
                        />
                        <LocalizedText
                            text="Whoops! Our server's having some problems. Try again later."
                            key="home.server.error"
                            lang={currentLang}
                        />
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
    </div>

    <div class="footer">
        <p>
            <LocalizedText
                text="PenguinMod is not affiliated with Scratch, TurboWarp, the Scratch Team, or the Scratch Foundation."
                key="home.footer.notaffiliated"
                dontlink={true}
                lang={currentLang}
            />
        </p>
        <div class="footer-list">
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Website"
                        key="home.footer.sections.website"
                        lang={currentLang}
                    />
                </p>
                <a href={LINK.editor}>
                    <LocalizedText
                        text="Editor"
                        key="home.footer.sections.website.editor"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.credits}>
                    <LocalizedText
                        text="Credits"
                        key="home.footer.sections.website.credits"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.github}>
                    <LocalizedText
                        text="Source"
                        key="home.footer.sections.website.source"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.packager}>
                    <LocalizedText
                        text="Packager"
                        key="home.footer.sections.website.packager"
                        lang={currentLang}
                    />
                </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Community"
                        key="home.footer.sections.community"
                        lang={currentLang}
                    />
                </p>
                <a target="_blank" href={LINK.discord}>Discord</a>
                <a target="_blank" href={LINK.wiki}>
                    <LocalizedText
                        text="Wiki"
                        key="home.footer.sections.community.wiki"
                        lang={currentLang}
                    />
                </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Info"
                        key="home.footer.sections.info"
                        lang={currentLang}
                    />
                </p>
                <a target="_blank" href={LINK.privacy}>
                    <LocalizedText
                        text="Privacy Policy"
                        key="home.footer.sections.info.privacy"
                        lang={currentLang}
                    />
                </a>
                <a target="_blank" href={LINK.guidelines.projects}>
                    <LocalizedText
                        text="Uploading Guidelines"
                        key="home.footer.sections.info.guidelines"
                        lang={currentLang}
                    />
                </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Donate"
                        key="home.footer.sections.donate"
                        lang={currentLang}
                    />
                </p>
                <a href={"/donate"}>PenguinMod</a>
                <a target="_blank" href={LINK.donate.turbowarp}>TurboWarp</a>
                <a target="_blank" href={LINK.donate.scratch}>Scratch</a>
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
    .section-language-warning {
        background: #ffd00073;
        color: black;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        font-size: 18px;
        font-weight: bold;
        margin: 0px;
        text-align: center;
    }
    .section-language-warning > img {
        filter: brightness(0);
    }
    :global(body.dark-mode) .section-language-warning {
        color: white;
    }
    :global(body.dark-mode) .section-language-warning > img {
        filter: brightness(1);
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
        width: 100%;
        height: 100%;
    }
    .update-image-wrapper {
        background: transparent;
        cursor: pointer;
        margin-top: 4px;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        border: 0;
    }

    .project-list {
        display: flex;
        flex-direction: row;
    }
</style>
