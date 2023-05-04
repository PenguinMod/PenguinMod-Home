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
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Button from "$lib/Button/Button.svelte";

    let loggedIn = null;
    let loadingExternal = false;

    let projectName = "Project";
    let projectImage;
    let projectData;

    let projectInputName;

    const components = {
        projectName: null,
        projectInstructions: null,
        projectNotes: null,
    };

    onMount(() => {
        const params = new URLSearchParams(location.search);
        const projName = params.get("name");
        const importLocation = params.get("external");
        if (projName) {
            projectName = projName;
        }

        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
        }
        Authentication.usernameFromCode(privateCode)
            .then((username) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
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

                // userinfo: token, remixid
                if (data.type === "userinfo") {
                }
                // image: uri of thumbnail image
                if (data.type === "image") {
                    projectImage = data.uri;
                }
                // project: uri of project data
                if (data.type === "project") {
                    projectData = data.uri;
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
        projectImage = imageUrl;
    }
    async function projectFilePicked(input) {
        input = input.target;
        const file = input.files[0];
        if (!file) return;
        projectInputName.innerText = `Using ${file.name} (${
            file.size / 125000
        } MB)`;
        const projectUri = await filePicked(input);
        projectData = projectUri;
    }

    function uploadProject() {
        ProjectClient.uploadProject({
            title: components.projectName.value,
            instructions: components.projectInstructions.value,
            notes: components.projectNotes.value,
            image: projectImage,
            project: projectData,
        })
            .then((projectId) => {
                window.open(`${LINK.base}#${projectId}`);
            })
            .catch((err) => {
                switch (err) {
                    case "TooManyRequests":
                        return alert(
                            "You can only upload projects every 8 minutes."
                        );
                    case "MissingProjectData":
                        return alert(
                            "Failed to send project data. Your project may be too large."
                        );
                    case "Reauthenticate":
                        return alert(
                            "You were logged out. Please log-in again."
                        );
                    case "FeatureDisabledForThisAccount":
                        return alert("You can't upload projects here.");
                    case "PublishDisabled":
                        return alert(
                            "Some maintenance is occurring, so you are not able to upload at this time."
                        );
                    case "FormatError":
                        return alert(
                            "Some values are not right. Check that all required fields are filled."
                        );
                    case "FormatErrorRemixMustBeProjectIdAsNumber":
                        return alert(
                            "Remix Format Error. Report to PenguinMod."
                        );
                    default:
                        return alert(err);
                }
            });
    }
    function openRemixMenu() {}
    function openUpdateMenu() {}

    Authentication.onLogout(() => {
        loggedIn = false;
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        Authentication.usernameFromCode(privateCode)
            .then((username) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
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
    <title>PenguinMod - Upload</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    {#if loadingExternal}
        <div class="external-loading">
            <LoadingSpinner />
            <p>Importing, please wait...</p>
        </div>
    {/if}

    <div class="section-info">
        <h1>Upload</h1>
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
                    />
                    <p class="important notmargin">Notes and Credits</p>
                    <textarea
                        placeholder="List people that were apart of the creation of this project..."
                        bind:this={components.projectNotes}
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
                        src={projectImage ? projectImage : "/empty-project.png"}
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
                {#if loggedIn === true && projectData}
                    <Button
                        label="Upload"
                        icon="upload.svg"
                        on:click={uploadProject}
                    />
                    <Button
                        label="Remix"
                        color="remix"
                        icon="remix.svg"
                        on:click={openRemixMenu}
                    />
                    <Button
                        label="Update"
                        color="orange"
                        icon="update.svg"
                        on:click={openUpdateMenu}
                    />
                {:else}
                    <div>
                        {#if loggedIn === false}
                            <p>Please log-in to upload a project.</p>
                        {:else if !projectData}
                            <p>You must select a project file to upload.</p>
                        {/if}
                        <div style="display:flex;flex-direction:row">
                            <Button
                                label="Upload"
                                color="gray"
                                icon="upload.svg"
                            />
                            <Button
                                label="Remix"
                                color="gray"
                                icon="remix.svg"
                            />
                            <Button
                                label="Update"
                                color="gray"
                                icon="update.svg"
                            />
                        </div>
                    </div>
                {/if}
            </div>
        </div>
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
