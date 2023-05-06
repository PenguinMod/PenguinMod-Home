<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";

    const ProjectClient = new ProjectApi();

    // Static values
    import LINK from "../../resources/urls.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";

    let loggedIn = null;
    let loadingExternal = false;

    let projectId;
    let projectName = "Project";
    let projectMetadata;

    let newProjectImage;
    let newProjectData;

    let projectInputName;

    const components = {
        projectName: null,
        projectInstructions: null,
        projectNotes: null,
    };

    function kickOut() {
        location.href = location.origin + "/mystuff";
    }

    onMount(async () => {
        const params = new URLSearchParams(location.search);
        const projId = params.get("id");
        const importLocation = params.get("external");
        projectId = projId;
        if (!projectId) {
            kickOut();
            return;
        }

        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            kickOut();
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then((username) => {
                if (username) {
                    ProjectApi.getProjectMeta(projectId)
                        .then((metadata) => {
                            projectName = metadata.name;
                            projectMetadata = metadata;
                            ProjectClient.setUsername(username);
                            ProjectClient.setPrivateCode(privateCode);
                            loggedIn = true;
                        })
                        .catch((err) => {
                            alert(err);
                            kickOut();
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

        if (importLocation) {
            // load project from parent window
            loadingExternal = true;

            // get parent window
            const opener = window.opener || window.parent;
            if (!opener || opener === window) {
                // exit if not found
                loadingExternal = false;
                console.warn(
                    "External import stopped; parent window not found"
                );
                return;
            }
            // wrapper to handle errors & be easier
            function post(data) {
                try {
                    opener.postMessage(
                        {
                            p4: data,
                        },
                        importLocation
                    );
                } catch (e) {
                    console.warn("Cannot post message", e);
                }
            }
            // when WE get a post
            window.addEventListener("message", (e) => {
                if (e.origin !== importLocation) {
                    return;
                }
                const data = e.data && e.data.p4;
                if (!data) {
                    return;
                }

                // metadata: { title, instructions, notes }
                if (data.type === "metadata") {
                    projectName = data.meta.title;
                    projectMetadata.instructions = data.meta.instructions;
                    projectMetadata.notes = data.meta.notes;
                }
                // image: uri of thumbnail image
                if (data.type === "image") {
                    newProjectImage = data.uri;
                }
                // project: uri of project data
                if (data.type === "project") {
                    newProjectData = data.uri;
                    projectInputName.innerText = `Imported ${data.name} from PenguinMod`;
                }

                // we done here
                if (data.type === "finished") {
                    loadingExternal = false;
                }
                // something bad happenedd!!!!!!!!!!!
                if (data.type === "error") {
                    loadingExternal = false;
                    alert("Failed to import the full project; " + data.error);
                }
            });
            post({ type: "validate" });
        }
    });

    function updateProject() {
        if (projectMetadata.featured) {
            const code = projectId;
            const continueEdit = prompt(
                `Editing this project will cause it to become unapproved and unfeatured again. Are you sure you want to continue?\nType "${code}" to continue.`
            );
            if (continueEdit.trim().replace(/[^0-9]*/gim, "") !== String(code))
                return;
        } else if (projectMetadata.accepted) {
            const continueEdit = confirm(
                "Editing this project will cause it to become unapproved again. Are you sure you want to continue?"
            );
            if (!continueEdit) return;
        }
        const newMetadata = {};
        const data = {
            newMeta: newMetadata,
        };
        if (components.projectName.value !== projectName) {
            newMetadata.name = components.projectName.value;
        }
        if (
            components.projectInstructions.value !==
            projectMetadata.instructions
        ) {
            newMetadata.instructions = components.projectInstructions.value;
        }
        if (components.projectNotes.value !== projectMetadata.notes) {
            newMetadata.notes = components.projectNotes.value;
        }
        if (newProjectImage) {
            data.image = newProjectImage;
        }
        if (newProjectData) {
            data.project = newProjectData;
        }
        ProjectClient.updateProject(projectId, data)
            .then(kickOut)
            .catch((err) => {
                alert(`Uh oh! An error occurred: ${err}`);
            });
    }

    function filePicked(input) {
        return new Promise((resolve, reject) => {
            if (!input) return reject("NoInput");
            if (!input.files) return reject("NoFiles");
            const file = input.files[0];
            if (!file) return reject("NoFile");
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                resolve(e.target.result);
            };
            fileReader.onerror = reject;
            fileReader.readAsDataURL(file);
        });
    }

    async function imageFilePicked(input) {
        input = input.target;
        const imageUrl = await filePicked(input);
        newProjectImage = imageUrl;
    }
    async function projectFilePicked(input) {
        input = input.target;
        const file = input.files[0];
        if (!file) return;
        projectInputName.innerText = `Using ${file.name} (${
            file.size / 125000
        } MB)`;
        const projectUri = await filePicked(input);
        newProjectData = projectUri;
    }

    // we dont need to add an "onAuthenticate" event
    // because you cant sign in on the /edit page,
    // signing out or going on it while signed out
    // just kicks you to the /mystuff page
    Authentication.onLogout(() => {
        loggedIn = false;
        kickOut();
    });
</script>

<head>
    <title>PenguinMod - Edit {projectName}</title>
</head>

<NavigationBar />

<div class="main" style={loggedIn ? "" : "display:none"}>
    <NavigationMargin />

    {#if loadingExternal}
        <div class="external-loading">
            <LoadingSpinner />
            <p>Importing, please wait...</p>
            <p>(you may need to switch tabs and come back)</p>
        </div>
    {/if}

    <div class="section-info">
        <div>
            <h1 style="margin-block:8px">Edit</h1>
            <p style="margin-block:8px">Editing {projectName}</p>
        </div>
    </div>

    <div class="full">
        <div class="card">
            <div
                style="display:flex;flex-direction:row;justify-content: space-between;"
            >
                <div style="width:50%;">
                    <p class="important notmargin">Project Title</p>
                    <input
                        type="text"
                        placeholder="My Project"
                        bind:this={components.projectName}
                        value={projectName}
                    />
                    <p class="important notmargin" style="margin-top:24px">
                        Instructions
                    </p>
                    <textarea
                        placeholder="Tell others how to use or play your project..."
                        bind:this={components.projectInstructions}
                        value={projectMetadata
                            ? projectMetadata.instructions
                            : ""}
                    />
                    <p class="important notmargin">Notes and Credits</p>
                    <textarea
                        placeholder="List people that were apart of the creation of this project..."
                        bind:this={components.projectNotes}
                        value={projectMetadata ? projectMetadata.notes : ""}
                    />
                    <input
                        id="FILERI"
                        type="file"
                        class="hidden-picker"
                        accept=".pm,.sb3,.sb2,.sb,.goobert"
                        on:change={projectFilePicked}
                    />
                    <label
                        class="file-picker"
                        for="FILERI"
                        style="width:90%"
                        bind:this={projectInputName}
                    >
                        Use a different project file
                    </label>
                </div>
                <div style="width:50%;">
                    <img
                        src={newProjectImage
                            ? newProjectImage
                            : projectId
                            ? `${LINK.projects}api/pmWrapper/iconUrl?id=${projectId}`
                            : "/empty-project.png"}
                        style="border-width:1px;border-style:solid;border-color:rgba(0, 0, 0, 0.1);width:100%;"
                        alt="Project Thumbnail"
                    />
                    <input
                        id="FILEPI"
                        type="file"
                        class="hidden-picker"
                        accept=".png,.jpg,.jpeg,.gif"
                        on:change={imageFilePicked}
                    />
                    <label class="file-picker" for="FILEPI">
                        Use my own image
                    </label>
                </div>
            </div>
            <div style="display:flex;flex-direction:row;margin-top:48px">
                <Button
                    label="Update"
                    icon="update.svg"
                    on:click={updateProject}
                />
            </div>
        </div>
    </div>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    textarea {
        width: 90%;
        resize: none;
        height: 100px;
        border-radius: 6px;
        border-style: dashed;
        border-color: rgba(0, 162, 255, 0.15);
        border-width: 2px;
    }
    textarea:focus {
        border-color: rgba(0, 162, 255, 0.35);
        outline: none;
    }
    input[type="text"] {
        width: 90%;
        border-radius: 6px;
        border-color: rgba(0, 162, 255, 0.15);
        border-width: 2px;
        border-style: dashed;
    }
    input[type="text"]:focus {
        border-color: rgba(0, 162, 255, 0.35);
        outline: none;
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

    .important {
        font-weight: bold;
    }
    .notmargin {
        margin-block: 0;
    }

    .file-picker {
        display: block;
        background-color: #00c3ff;
        color: white;
        border-radius: 1000px;
        width: 100%;
        border: 0px;
        padding: 0.25rem 0;
        outline: 0;
        cursor: pointer;
        font-weight: bold;
        text-align: center;
    }
    .file-picker:focus {
        outline: 4px solid rgba(0, 195, 255, 0.3);
    }

    .hidden-picker {
        width: 0px;
        height: 0px;
        display: block;
    }

    .external-loading {
        background: rgba(0, 0, 0, 0.75);
        position: fixed;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
    }
</style>