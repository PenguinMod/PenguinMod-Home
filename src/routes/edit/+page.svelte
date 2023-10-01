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
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    let projectName = "";
    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
        if (projectName === "") {
            projectName = TranslationHandler.text(
                "uploading.project.title.default",
                currentLang
            );
        }
    });

    let loggedIn = null;
    let loadingExternal = false;
    let guidelinePageOpen = false;

    let projectId;
    let projectMetadata;

    let newProjectImage;
    let newProjectData;

    let projectInputName;

    const components = {
        projectName: null,
        projectInstructions: null,
        projectNotes: null,
    };

    function floatTo2Decimals(number) {
        const num = Number(number);
        if (isNaN(num)) return 0;
        const str = String(num);
        if (!str.includes(".")) return num;
        const split = str.split(".");
        if (split[1].length <= 2) return num;
        const newNumber = split[0] + "." + split[1].substring(0, 2);
        return Number(newNumber);
    }

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
            .then(({username}) => {
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
                    projectInputName.innerText = String(
                        TranslationHandler.text(
                            "uploading.project.ownfile.imported",
                            currentLang
                        )
                    ).replace("$1", data.name);
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
                TranslationHandler.text(
                    "editing.confirm.featured",
                    currentLang
                ).replace("$1", code)
            );
            if (continueEdit.trim().replace(/[^0-9]*/gim, "") !== String(code))
                return;
        } else if (projectMetadata.accepted) {
            const continueEdit = confirm(
                TranslationHandler.text("editing.confirm.normal", currentLang)
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
                const message = TranslationHandler.text(
                    `uploading.error.${String(err).toLowerCase()}`,
                    currentLang
                );
                if (!message)
                    return alert(
                        String(
                            TranslationHandler.text(
                                "uploading.error.unknown",
                                currentLang
                            )
                        ).replace("$1", err)
                    );
                alert(message);
                // alert(`Uh oh! An error occurred: ${err}`);
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
        const projectUri = await filePicked(input);
        newProjectData = projectUri;
        projectInputName.innerText = TranslationHandler.text(
            "uploading.project.ownfile.picked",
            currentLang
        )
            .replace("$2", floatTo2Decimals(file.size / 1250000))
            .replace("$1", file.name);
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

    <StatusAlert />

    {#if loadingExternal}
        <div class="external-loading">
            <LoadingSpinner />
            <p style="text-align: center;">
                {@html TranslationHandler.text(
                    "project.importing",
                    currentLang
                )}
            </p>
        </div>
    {/if}

    {#if guidelinePageOpen}
        <div class="front-card-page">
            <div class="card-page">
                <div class="card-header">
                    <h1>
                        <LocalizedText
                            text="Guidelines"
                            key="uploading.guidelines.title"
                            lang={currentLang}
                        />
                    </h1>
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
                    <LocalizedText
                        text="Open in new tab"
                        key="uploading.guidelines.newtab"
                        lang={currentLang}
                    />
                </a>
                <p class="only-in-dark-mode">
                    <i>
                        <LocalizedText
                            text="This page is not in Dark Mode because it is an external website."
                            key="uploading.guidelines.darkmode"
                            lang={currentLang}
                        />
                    </i>
                </p>
                <p style={currentLang !== "en" ? "" : "display: none;"}>
                    {@html TranslationHandler.text(
                        "uploading.guidelines.nottranslated",
                        currentLang
                    )}
                </p>
                <div style="display:flex;flex-direction:row;padding:1em">
                    <Button
                        on:click={() => {
                            guidelinePageOpen = false;
                        }}
                    >
                        <LocalizedText
                            text="Close"
                            key="uploading.project.selector.close"
                            lang={currentLang}
                        />
                    </Button>
                </div>
            </div>
        </div>
    {/if}

    <div class="section-info">
        <div>
            <h1 style="margin-block:8px">
                <LocalizedText
                    text="Edit"
                    key="editing.header"
                    lang={currentLang}
                />
            </h1>
            <p style="margin-block:8px">
                {String(
                    TranslationHandler.text(
                        "editing.header.detail",
                        currentLang
                    )
                ).replace("$1", projectName)}
            </p>
        </div>
    </div>

    <div class="full">
        <div class="card">
            <div
                style="display:flex;flex-direction:row;justify-content: space-between;"
            >
                <div style="width:50%;">
                    <p class="important notmargin">
                        <LocalizedText
                            text="Project Title"
                            key="uploading.project.title"
                            lang={currentLang}
                        />
                    </p>
                    <input
                        type="text"
                        placeholder={TranslationHandler.text(
                            "uploading.project.title.default",
                            currentLang
                        )}
                        bind:this={components.projectName}
                        value={projectName}
                    />
                    <p class="important notmargin" style="margin-top:24px">
                        <LocalizedText
                            text="Instructions"
                            key="uploading.project.instructions"
                            lang={currentLang}
                        />
                    </p>
                    <textarea
                        placeholder={TranslationHandler.text(
                            "uploading.project.instructions.default",
                            currentLang
                        )}
                        bind:this={components.projectInstructions}
                        value={projectMetadata
                            ? projectMetadata.instructions
                            : ""}
                    />
                    <p class="important notmargin">
                        <LocalizedText
                            text="Notes and Credits"
                            key="uploading.project.notes"
                            lang={currentLang}
                        />
                    </p>
                    <textarea
                        placeholder={TranslationHandler.text(
                            "uploading.project.notes.default",
                            currentLang
                        )}
                        bind:this={components.projectNotes}
                        value={projectMetadata ? projectMetadata.notes : ""}
                    />
                    <input
                        id="FILERI"
                        type="file"
                        class="hidden-picker"
                        accept=".pmp,.pm,.sb3,.sb2,.sb,.goobert"
                        on:change={projectFilePicked}
                    />
                    <label
                        class="file-picker"
                        for="FILERI"
                        style="width:90%"
                        bind:this={projectInputName}
                    >
                        <LocalizedText
                            text="Use a different project file"
                            key="uploading.project.ownfile"
                            lang={currentLang}
                        />
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
                        accept=".png"
                        on:change={imageFilePicked}
                    />
                    <label class="file-picker" for="FILEPI">
                        <LocalizedText
                            text="Use my own image"
                            key="uploading.project.ownimage"
                            lang={currentLang}
                        />
                    </label>
                </div>
            </div>
            <div style="display:flex;flex-direction:row;margin-top:48px">
                <Button icon="update.svg" on:click={updateProject}>
                    <LocalizedText
                        text="Update"
                        key="uploading.type.update"
                        lang={currentLang}
                    />
                </Button>
            </div>
        </div>
        <div style="height:16px" />
        <button
            class="guidelines-link"
            on:click={() => {
                guidelinePageOpen = true;
            }}
        >
            <LocalizedText
                text="Project Uploading & Updating Guidelines"
                key="uploading.guidelines.button"
                lang={currentLang}
            />
        </button>
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

    :global(body.dark-mode) input[type="text"] {
        background-color: transparent;
        color: white;
    }
    :global(body.dark-mode) textarea {
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
    :global(body.dark-mode) .card-page {
        background: #1f1f1f;
    }
    .only-in-dark-mode {
        display: none;
    }
    :global(body.dark-mode) .only-in-dark-mode {
        display: inline;
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

    .guidelines-link {
        background: transparent;
        border: 0;
        color: dodgerblue;
        text-decoration: underline;
        cursor: pointer;
    }
    iframe {
        width: 100%;
        border: 0;
    }
</style>
