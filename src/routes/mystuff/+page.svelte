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

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let projects = [];
    let error = null;
    let loggedIn = null;
    let isAdmin = false;

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
                error =
                    "An error occurred. We couldn't get your uploaded projects.";
                console.error(err);
            });
        ProjectApi.isAdmin(username).then((isAdminn) => {
            isAdmin = isAdminn;
        });
    }
    function deleteProject(id, name) {
        const code = prompt(
            `Delete ${name}? This CANNOT be undone!\nType "${id}" to delete this project.`
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
            .then((username) => {
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
                .then((username) => {
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
            .then((username) => {
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

    <div class="section-info">
        <h1>My Stuff</h1>
    </div>

    <div class="section-projects">
        {#if loggedIn === null}
            <div style="margin-top: 16px;">
                <LoadingSpinner />
            </div>
        {:else if loggedIn === false}
            <div class="login-prompt">
                <p>Please log in to view your PenguinMod projects.</p>
                <Button label="Sign In" on:click={askForLogin} />
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
                            name: `Edit ${project.remix ? "Remix" : "Project"}`,
                            href: `/edit?id=${project.id}`,
                            color: project.remix ? "remix" : null,
                        },
                        {
                            name: `Delete ${
                                project.remix ? "Remix" : "Project"
                            }`,
                            callback: () => {
                                deleteProject(project.id, project.name);
                            },
                            color: "red",
                        },
                    ]}
                >
                    <div class="inside-project">
                        {#if project.hidden}
                            <p><i>(hidden)</i></p>
                        {:else if !project.accepted}
                            <p><i>(unapproved)</i></p>
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
                <p>Nothing was found.</p>
            </div>
        {/if}
    </div>

    {#if isAdmin && loggedIn}
        <div
            style="width:100%;display:flex;flex-direction:row;justify-content: center;"
        >
            <a href="/panel"> Admin Panel </a>
        </div>
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

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>