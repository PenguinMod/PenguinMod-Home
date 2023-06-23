<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Project from "$lib/Project/Project.svelte";
    import Button from "$lib/Button/Button.svelte";

    function unixToDisplayDate(unix) {
        return `${new Date(Number(unix)).toDateString()} at ${new Date(
            Number(unix)
        ).toLocaleTimeString()}`;
    }

    let loggedIn = null;
    let projectIdSelection;

    function kickOut() {
        location.href = location.origin + "/bx-tv1.mp4";
    }

    onMount(() => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            kickOut();
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then((username) => {
                if (username) {
                    ProjectApi.isAdmin(username)
                        .then((isAdmin) => {
                            if (!isAdmin) {
                                kickOut();
                                return;
                            }
                            ProjectClient.setUsername(username);
                            ProjectClient.setPrivateCode(privateCode);
                            loggedIn = true;
                        })
                        .catch(() => {
                            kickOut();
                            return;
                        });
                    return;
                }
                loggedIn = false;
                kickOut();
            })
            .catch(() => {
                loggedIn = false;
                kickOut();
            });
    });

    // we dont need to add an "onAuthenticate" event
    // because you cant sign in on the /panel page,
    // signing out or going on it while signed out
    // just kicks you out of the page
    Authentication.onLogout(() => {
        loggedIn = false;
        location.href = location.origin;
    });

    let projectMenuOpen = false;
    let projects = [];

    let approvedProjectNames = [];

    function openMenu(approved) {
        projects = [];
        projectMenuOpen = true;
        if (approved) {
            ProjectApi.getProjects().then((projectss) => {
                projects = projectss;
            });
        } else {
            ProjectClient.getUnapprovedProjects().then((projectss) => {
                projects = projectss;
            });
        }
        // get approved projects anyways cuz we need to update list
        ProjectApi.getProjects().then((projects) => {
            approvedProjectNames = projects.map((p) => p.name);
        });
    }
    function deleteProject(id, name) {
        const code = prompt(
            `Delete ${name}? This CANNOT be undone!\nType "${id}" to delete this project.`
        );
        if (String(code).replace(/[^0-9]*/gim, "") !== String(id)) {
            return;
        }
        ProjectClient.deleteProject(id);
        projectMenuOpen = false;
    }
    function selectProject(id) {
        projectMenuOpen = false;
        projectIdSelection.value = id;
    }
    function featureProject(id, name) {
        const usure = confirm("Feature " + name + " ?");
        if (!usure) return;
        ProjectClient.featureProject(id).catch((err) => alert(err));
    }

    let sendWebhook = true;
    function approveProject() {
        const id = Number(projectIdSelection.value);
        if (isNaN(id)) return;
        ProjectClient.approveProject(id, sendWebhook)
            .then(() => {
                alert("The project was approved!");
            })
            .catch((err) => {
                alert(err);
            });
    }

    let guidelinePageOpen = false;
</script>

<head>
    <title>PenguinMod - Admin Panel</title>
</head>

<NavigationBar />

<div class="main" style={loggedIn ? "" : "display:none"}>
    <NavigationMargin />

    {#if projectMenuOpen}
        <div class="front-card-page">
            <div class="card-page">
                <div class="card-header">
                    <h1>Select a project</h1>
                </div>
                <div class="card-projects">
                    {#each projects as project}
                        <Project
                            id={project.id}
                            name={project.name}
                            owner={project.owner}
                            dotsmenu="true"
                            openNewtab="true"
                            style="padding:8px;height:min-content"
                            dotsoptions={[
                                {
                                    name: `Select ${
                                        project.remix ? "Remix" : "Project"
                                    }`,
                                    callback: () => {
                                        selectProject(project.id);
                                    },
                                },
                                {
                                    name: `Edit ${
                                        project.remix ? "Remix" : "Project"
                                    }`,
                                    href: `/edit?id=${project.id}`,
                                    color: project.remix ? "remix" : null,
                                    newtab: true,
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
                                {
                                    name: `Feature ${
                                        project.remix ? "Remix" : "Project"
                                    }`,
                                    callback: () => {
                                        featureProject(
                                            project.id,
                                            project.name
                                        );
                                    },
                                    color: "orange",
                                },
                            ]}
                        >
                            <p class="nomargintext date">
                                {unixToDisplayDate(project.date)}
                            </p>
                            {#if approvedProjectNames.includes(project.name) && !project.accepted}
                                <p class="nomargintext">
                                    An approved project also has this name
                                </p>
                            {/if}
                            {#if project.updating}
                                <p class="nomargintext">(Update!)</p>
                            {/if}
                        </Project>
                    {/each}
                </div>
                <div style="display:flex;flex-direction:row;padding:1em">
                    <Button
                        label="Cancel"
                        on:click={() => {
                            projectMenuOpen = false;
                        }}
                    />
                </div>
            </div>
        </div>
    {/if}

    {#if guidelinePageOpen}
        <div class="front-card-page">
            <div class="card-page">
                <div class="card-header">
                    <h1>Guidelines</h1>
                </div>
                <div class="card-projects">
                    <iframe
                        title="Guidelines Page"
                        src="https://studio.penguinmod.site/PenguinMod-Guidelines/PROJECTS"
                    />
                </div>
                <a
                    href="https://studio.penguinmod.site/PenguinMod-Guidelines/PROJECTS"
                    style="margin-top:6px;color:dodgerblue"
                    target="_blank"
                >
                    Open in new tab
                </a>
                <p class="only-in-dark-mode">
                    <i>
                        This page is not in Dark Mode because it is an external
                        website.
                    </i>
                </p>
                <div style="display:flex;flex-direction:row;padding:1em">
                    <Button
                        label="Close"
                        on:click={() => {
                            guidelinePageOpen = false;
                        }}
                    />
                </div>
            </div>
        </div>
    {/if}

    <div class="section-info">
        <div>
            <h1 style="margin-block:8px">Admin Panel</h1>
        </div>
    </div>

    <div class="full">
        <div class="card">
            <h2 style="margin-block-start:0">Projects</h2>
            <p>
                Project ID:
                <input type="number" bind:this={projectIdSelection} value="0" />
            </p>
            <p>Open Project Selection:</p>
            <div
                style="display:flex;flex-direction:row;justify-content:space-evenly"
            >
                <Button on:click={() => openMenu(false)} label="Unapproved" />
                <Button on:click={() => openMenu(true)} label="Approved" />
            </div>
            <div style="height:24px" />
            <label>
                <input type="checkbox" bind:checked={sendWebhook} />
                Send Approved Projects to Discord
            </label>
            <div style="height:8px" />
            <Button label="Approve Project" on:click={approveProject} />
        </div>

        <button
            class="guidelines-link"
            on:click={() => {
                guidelinePageOpen = true;
            }}
        >
            Project Uploading & Updating Guidelines
        </button>
    </div>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    input[type="number"] {
        width: 50%;
        border-radius: 6px;
        border-color: rgba(0, 162, 255, 0.15);
        border-width: 2px;
        border-style: dashed;
    }
    input[type="number"]:focus {
        border-color: rgba(0, 162, 255, 0.35);
        outline: none;
    }
    :global(body.dark-mode) input[type="number"] {
        background-color: transparent;
        color: white;
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
        height: 6rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
        text-align: center;
    }

    .card {
        width: 60%;
        padding: 32px;
        border-style: solid;
        border-width: 2px;
        border-color: rgba(0, 0, 0, 0.1);
        border-radius: 16px;
    }
    .full {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 32px;
    }
    :global(body.dark-mode) .card {
        border-color: rgba(255, 255, 255, 0.3);
    }

    .front-card-page {
        background: rgba(0, 0, 0, 0.5);
        position: fixed;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .card-page {
        box-shadow: 0px 0px 20px 10px rgba(0, 0, 0, 0.25);
        background: white;
        border-radius: 16px;
        width: 85%;
        height: 80%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .only-in-dark-mode {
        display: none;
    }
    :global(body.dark-mode) .only-in-dark-mode {
        display: inline;
    }
    :global(body.dark-mode) .card-page {
        background: #1f1f1f;
    }
    .card-header {
        width: 97.5%;
        border-bottom: #00000030 1px solid;
        text-align: center;
    }
    .card-projects {
        display: flex;
        flex-direction: row;
        width: 100%;
        flex-wrap: wrap;
        overflow: auto;
        height: 100%;
    }

    .nomargintext {
        margin-block: 0;
    }
    .date {
        opacity: 0.5;
        font-size: 12px;
    }

    .guidelines-link {
        background: transparent;
        border: 0;
        color: dodgerblue;
        text-decoration: underline;
        cursor: pointer;
        margin-top: 16px;
    }
    iframe {
        width: 100%;
        border: 0;
    }
</style>
