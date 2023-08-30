<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    import JSZip from "jszip";

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
        location.href = location.origin + "/fail.mp4";
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
                    ProjectApi.isApprover(username)
                        .then((isApprover) => {
                            if (!isApprover) {
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
        loggedIn = true;
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
    let projectPage = 0;
    let lastProjectPage = false;

    // let approvedProjectNames = [];

    function incrementPageAndAddToMenu(approved) {
        projectPage += 1;
        // todo: not this thats for sure
        //       just do one of them and then await it idk
        //       gonna do that later
        //       (aka in like 3 months when i finally look at this code again)
        console.log(projectPage);
        if (approved) {
            ProjectApi.getProjects(projectPage).then((projectss) => {
                projects.push(...projectss);
                projects = projects;
                if (projectss.length <= 0) {
                    lastProjectPage = true;
                }
            });
        } else {
            ProjectClient.getUnapprovedProjects(projectPage).then(
                (projectss) => {
                    projects.push(...projectss);
                    projects = projects;
                    if (projectss.length <= 0) {
                        lastProjectPage = true;
                    }
                }
            );
        }
    }
    let projectPageType = true;
    function openMenu(approved) {
        projectPageType = approved;
        projects = [];
        projectPage = 0;
        lastProjectPage = false;
        projectMenuOpen = true;
        if (approved) {
            ProjectApi.getProjects(projectPage).then((projectss) => {
                projects = projectss;
            });
        } else {
            ProjectClient.getUnapprovedProjects(projectPage).then(
                (projectss) => {
                    projects = projectss;
                }
            );
        }
    }
    function rejectProject(id, name) {
        if (!confirm("Reject this project?")) return;
        const reason = prompt(`Type your reason for rejecting ${name}.`);
        if (reason.length <= 3) {
            return alert("The action was cancelled.");
        }
        ProjectClient.rejectProject(id, reason);
        projectMenuOpen = false;
    }
    function selectProject(id) {
        projectMenuOpen = false;
        projectIdSelection.value = id;
    }
    // function featureProject(id, name) {
    // no reason to allow this if approvers cant touch already approved projects
    //     const usure = confirm("Feature " + name + " ?");
    //     if (!usure) return;
    //     ProjectClient.featureProject(id).catch((err) => alert(err));
    // }

    let sendWebhook = true;
    function approveProject() {
        if (!confirm("Approve this project?")) return;
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

    let inspectMenuOpen = false;
    const inspectMenuDetails = {
        downloading: false,
        error: false,
        errorText: false,
        extensions: [],
        extensionData: {},
        extensionUrls: {},
    };
    let _resettingInspectMenu = true;
    function resetInspectMenu() {
        _resettingInspectMenu = false;
        setTimeout(() => {
            _resettingInspectMenu = true;
        }, 10);
    }
    function openInspectMenu() {
        inspectMenuOpen = true;
        inspectMenuDetails.downloading = true;
        inspectMenuDetails.error = false;
        setTimeout(() => {
            if (!inspectMenuOpen) return; // dont download if we closed
            const id = Number(projectIdSelection.value);
            ProjectApi.getProjectFile(id)
                .then((blob) => {
                    JSZip.loadAsync(blob)
                        .then(async (zip) => {
                            const project = await zip
                                .file("project.json")
                                .async("string");
                            const json = JSON.parse(project);
                            const extensionList = json.extensions;
                            inspectMenuDetails.extensions = extensionList;
                            const extensionData = json.extensionURLs
                                ? json.extensionURLs
                                : {};
                            inspectMenuDetails.extensionData = extensionData;
                            inspectMenuDetails.extensionUrls = JSON.parse(
                                JSON.stringify(extensionData)
                            );
                            inspectMenuDetails.downloading = false;
                            // get all urls
                            for (const extensionId of extensionList) {
                                if (!extensionData[extensionId]) {
                                    extensionData[extensionId] =
                                        "(Core Extension, built into PenguinMod)";
                                    continue;
                                }
                                fetch(extensionData[extensionId]).then(
                                    (res) => {
                                        res.text().then((code) => {
                                            extensionData[extensionId] = code;
                                            resetInspectMenu();
                                        });
                                    }
                                );
                            }
                        })
                        .catch((err) => {
                            inspectMenuDetails.error = true;
                            inspectMenuDetails.errorText = err;
                        });
                })
                .catch((err) => {
                    inspectMenuDetails.error = true;
                    inspectMenuDetails.errorText = err;
                });
        }, 1000);
    }

    let guidelinePageOpen = false;
</script>

<head>
    <title>PenguinMod - Approving Panel</title>
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
                                    name: `Reject ${
                                        project.remix ? "Remix" : "Project"
                                    }`,
                                    callback: () => {
                                        rejectProject(project.id, project.name);
                                    },
                                    color: "red",
                                },
                            ]}
                        >
                            <p class="nomargintext date">
                                {unixToDisplayDate(project.date)}
                            </p>
                            <!-- doesnt seem like this is neccessary to be honest -->
                            <!-- {#if approvedProjectNames.includes(project.name) && !project.accepted}
                                <p class="nomargintext">
                                    An approved project also has this name
                                </p>
                            {/if} -->
                            {#if project.updating}
                                <p class="nomargintext">(Update!)</p>
                            {/if}
                        </Project>
                    {/each}
                    {#if !lastProjectPage}
                        <!-- yes this looks weird, no i wont fix it soon -->
                        <Button
                            label="More"
                            on:click={() =>
                                incrementPageAndAddToMenu(projectPageType)}
                        />
                    {/if}
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

    {#if inspectMenuOpen}
        <div class="front-card-page">
            <div class="card-page big-card-page">
                <div class="card-header">
                    <h1>Inspect Extensions</h1>
                </div>
                <div class="card-projects" style="display:block">
                    {#if inspectMenuDetails.downloading}
                        <p style="width:100%;text-align:center;">
                            Downloading project, this might take a bit...
                        </p>
                    {:else if _resettingInspectMenu}
                        {#each inspectMenuDetails.extensions as extensionId}
                            <p>
                                {extensionId}:
                                <a
                                    href={inspectMenuDetails.extensionUrls[
                                        extensionId
                                    ]}
                                    target="_blank"
                                >
                                    {String(
                                        inspectMenuDetails.extensionUrls[
                                            extensionId
                                        ]
                                    ).length > 456
                                        ? "Extension URL is too long"
                                        : String(
                                              inspectMenuDetails.extensionUrls[
                                                  extensionId
                                              ]
                                          )}
                                </a>
                            </p>
                            <textarea
                                value={inspectMenuDetails.extensionData[
                                    extensionId
                                ]}
                                style="width:90%;height:256px;font-family:monospace"
                            />
                        {/each}
                    {/if}
                    {#if inspectMenuDetails.error}
                        <p style="width:100%;text-align:center;color:red">
                            {inspectMenuDetails.errorText}
                        </p>
                    {/if}
                </div>
                <div style="display:flex;flex-direction:row;padding:1em">
                    <Button
                        label="Close"
                        on:click={() => {
                            inspectMenuOpen = false;
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
            <h1 style="margin-block:8px">Approving Panel</h1>
        </div>
    </div>

    <div class="full">
        <div class="card">
            <h2 style="margin-block-start:0">Approve Projects</h2>
            <p>
                Please look thoroughly through projects before approving them.
                <br />
                This includes sounds, costumes and code. Suspicious extensions can
                be given to an admin to investigate.
                <br />
                <br />
                To prevent abuse, all of your actions are logged.
                <br />
                This includes your username, any settings attached to the action,
                any details given to the action (like a reason for rejecting), when
                the action was done, and what the action was done on.
                <br />
                <br />
                Please note all administrators have the right to remove your access
                to the approving panel if we believe you are not following the guidelines.
                <br />
                You are also not required to approve projects every day or so, please
                just approve when you can.
            </p>
            <p>
                Project ID:
                <input type="number" bind:this={projectIdSelection} value="0" />
            </p>
            <div>
                <Button
                    on:click={() => openMenu(false)}
                    label="View Unapproved Projects"
                />
                <!-- <Button on:click={() => openMenu(true)} label="Approved" /> -->
            </div>
            <div style="height:24px" />
            <p>Extra Project Actions:</p>
            <div>
                <Button label="Inspect Extensions" on:click={openInspectMenu} />
            </div>
            <p>
                <i>
                    Try to only use these once or twice per project as they
                    <br />
                    might increase bandwidth on your internet and our server.
                </i>
            </p>
            <div style="height:48px" />
            <label>
                <input type="checkbox" bind:checked={sendWebhook} />
                Post Approved Project to Discord (usually disabled for small projects)
            </label>
            <div style="height:20px" />
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
    .big-card-page {
        width: 95%;
        height: 89.25%;
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
