<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import Project from "$lib/Project/Project.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let projects = [];
    let error = null;
    let loggedIn = null;
    let page = 0;
    let pageIsLast = false;

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function fetchNewProjects() {
        ProjectClient.getMyProjects(page).then((projectss) => {
            if (projectss.length <= 0) {
                pageIsLast = true;
                return;
            }
            if (projectss.length < 20) {
                pageIsLast = true;
            }
            projects.push(...projectss);
            projects = projects;
        });
    }

    function loggedInChange(username, privateCode) {
        if (username) ProjectClient.setUsername(username);
        if (privateCode) ProjectClient.setPrivateCode(privateCode);
        projects = [];
        ProjectClient.getMyProjects()
            .then((projectss) => {
                if (projectss.length <= 0) {
                    projects = ["notfound"];
                    return;
                }
                projects = projectss;
            })
            .catch((err) => {
                error = TranslationHandler.text("mystuff.error", currentLang);
                console.error(err);
            });
    }
    function deleteProject(id, name) {
        const code = prompt(
            String(
                TranslationHandler.text("mystuff.confirm.delete", currentLang)
            )
                .replace("$2", id)
                .replace("$1", name)
        );
        if (String(code).replace(/[^0-9]*/gim, "") !== String(id)) {
            return;
        }
        ProjectClient.deleteProject(id).then(loggedInChange);
    }

    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then(({username}) => {
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

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({username}) => {
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
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        Authentication.usernameFromCode(privateCode)
            .then(({username}) => {
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
</script>

<head>
    <title>PenguinMod - My Stuff</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    <div class="section-info">
        <h1>
            <LocalizedText
                text="My Stuff"
                key="mystuff.title"
                lang={currentLang}
            />
        </h1>
    </div>

    <div class="section-projects">
        {#if loggedIn === null}
            <div style="margin-top: 16px;">
                <LoadingSpinner enableTips={true} />
            </div>
        {:else if loggedIn === false}
            <div class="login-prompt">
                <p>
                    <LocalizedText
                        text="Please log in to view your PenguinMod projects."
                        key="mystuff.login"
                        lang={currentLang}
                    />
                </p>
                <Button on:click={askForLogin}>
                    <LocalizedText
                        text="Sign In"
                        key="navigation.login"
                        lang={currentLang}
                    />
                </Button>
            </div>
        {:else if projects[0] !== "notfound"}
            {#each projects as project}
                <Project
                    id={project.id}
                    name={project.name}
                    owner={project.owner}
                    date={project.date}
                    style="padding:8px;height:auto"
                    showdate="true"
                    dotsmenu="true"
                    dotsoptions={[
                        {
                            name: project.remix
                                ? TranslationHandler.text(
                                      "project.menu.remix.edit",
                                      currentLang
                                  )
                                : TranslationHandler.text(
                                      "project.menu.project.edit",
                                      currentLang
                                  ),
                            href: `/edit?id=${project.id}`,
                            color: project.remix ? "remix" : null,
                        },
                        {
                            name: project.remix
                                ? TranslationHandler.text(
                                      "project.menu.remix.delete",
                                      currentLang
                                  )
                                : TranslationHandler.text(
                                      "project.menu.project.delete",
                                      currentLang
                                  ),
                            callback: () => {
                                deleteProject(project.id, project.name);
                            },
                            color: "red",
                        },
                    ]}
                >
                    <div class="inside-project">
                        {#if project.hidden}
                            <p>
                                <i>
                                    <LocalizedText
                                        text="(hidden)"
                                        key="project.status.hidden"
                                        lang={currentLang}
                                    />
                                </i>
                            </p>
                        {:else if !project.accepted}
                            <p>
                                <i>
                                    <LocalizedText
                                        text="(unapproved)"
                                        key="project.status.unapproved"
                                        lang={currentLang}
                                    />
                                </i>
                            </p>
                        {/if}
                    </div>
                </Project>
            {:else}
                <!-- projects.length === 0 -->
                <div style="margin-top: 16px;">
                    <LoadingSpinner />
                </div>
            {/each}
        {:else}
            <div>
                <PenguinConfusedSVG height="12rem" />
                <p>
                    <LocalizedText
                        text="Nothing was found."
                        key="generic.notfound"
                        lang={currentLang}
                    />
                </p>
            </div>
        {/if}
    </div>

    {#if projects[0] !== "notfound"}
        {#if !pageIsLast && projects.length > 0}
            <div style="height: 16px;" />
            <div class="more-projects-wrapper">
                <Button
                    label="<img alt='More' src='dropdown-caret-hd.png' width='20'></img>"
                    on:click={() => {
                        page += 1;
                        fetchNewProjects();
                    }}
                />
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
        min-width: 1000px;
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
    .section-projects {
        margin: 0;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
    }

    .inside-project {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    :global(body.dark-mode) .inside-project {
        color: white;
    }

    .login-prompt {
        display: flex;
        flex-direction: column;
        margin-top: 16px;
        margin-bottom: 16px;
        align-items: center;
    }

    .more-projects-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
