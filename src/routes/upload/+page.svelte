<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    import EmojiList from "../../resources/emojis.js";
    import {
        PUBLIC_STUDIO_URL,
        PUBLIC_MAX_UPLOAD_SIZE,
    } from "$env/static/public";

    const ProjectClient = new ProjectApi();

    // Static values
    import LINK from "../../resources/urls.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import ClickableProject from "$lib/ClickableProject/Project.svelte";
    import Button from "$lib/Button/Button.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    import Stats from "../../lib/statsComponent/stats.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";
    // Icons
    import SearchSVG from "../../resources/icons/Search/icon.svelte";

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

    let projectImage;
    let projectImageURL;
    let projectData;
    let projectSizes = { name: `0/${PUBLIC_MAX_UPLOAD_SIZE}MB`, value: [] };
    function updateSize() {
        projectSizes[0] = `thumbnail: ${((projectImage?.size ?? 0) / 1024 / 1024).toFixed(2)}MB`;
        if (projectData)
            ProjectClient.resolveProjectSizes(
                projectData,
                projectImage?.size ?? 0,
                true
            ).then(([sizes, tooLarge]) => {
                projectSizes = sizes;
                if (tooLarge)
                    alert(
                        TranslationHandler.text(
                            "uploading.error.projecttoolarge",
                            currentLang
                        )
                    );
            });
    }

    let projectInputName;
    let remixingProjectName;
    let remixProjectId;

    let username;

    let remixedInURL = false;

    let projectPageType = "remix";
    let projectPage = 0,
        projectPageSearch = 0;
    let lastProjectPage = false;

    let recommendedTagList = [];
    let recommendedTagUpdate = 0;
    const components = {
        projectName: null,
        projectInstructions: null,
        projectNotes: null,
    };

    const updateRecommendedTags = () => {
        const combinedText = `${String(components.projectName.value)} ${String(components.projectInstructions.value)} ${String(components.projectNotes.value)}`;
        const normalizedText = combinedText
            .toLowerCase()
            .replace(/[\s\-_\W]+/gi, "");
        recommendedTagList = [];

        const hashtags = combinedText.match(/#([\w-]+)/g) || [];

        // Frontpage-able tags:
        if (
            normalizedText.includes("game") ||
            normalizedText.includes("playable")
        ) {
            recommendedTagList.push("games");
        }
        if (
            normalizedText.includes("animation") ||
            normalizedText.includes("animated") ||
            normalizedText.includes("animate")
        ) {
            recommendedTagList.push("animation");
        }
        if (
            normalizedText.includes("art") ||
            normalizedText.includes("drawn") ||
            normalizedText.includes("drawing") ||
            normalizedText.includes("paint")
        ) {
            recommendedTagList.push("art");
        }
        if (
            normalizedText.includes("platform") ||
            normalizedText.includes("jumping")
        ) {
            recommendedTagList.push("platformer");
        }
        if (
            normalizedText.includes("rpg") ||
            normalizedText.includes("roguelike")
        ) {
            recommendedTagList.push("rpg");
        }
        if (
            normalizedText.includes("story") ||
            normalizedText.includes("lore")
        ) {
            recommendedTagList.push("story");
        }
        if (
            normalizedText.includes("minigame") ||
            normalizedText.includes("warioware")
        ) {
            recommendedTagList.push("minigames");
        }
        if (
            normalizedText.includes("online") ||
            normalizedText.includes("multiplayer") ||
            normalizedText.includes("cloudlink")
        ) {
            recommendedTagList.push("online");
        }
        if (
            normalizedText.includes("remade") ||
            normalizedText.includes("remake") ||
            normalizedText.includes("demake")
        ) {
            recommendedTagList.push("remake");
        }
        if (
            normalizedText.includes("physics") ||
            normalizedText.includes("box2d")
        ) {
            recommendedTagList.push("physics");
        }
        if (normalizedText.includes("contest")) {
            recommendedTagList.push("contest");
        }
        if (
            normalizedText.includes("horror") ||
            normalizedText.includes("scary") ||
            normalizedText.includes("spook") ||
            normalizedText.includes("spoop") ||
            normalizedText.includes("halloween")
        ) {
            recommendedTagList.push("horror");
        }
        if (
            normalizedText.includes("tutorial") ||
            normalizedText.includes("teach")
        ) {
            recommendedTagList.push("tutorial");
        }
        if (normalizedText.includes("3d")) {
            recommendedTagList.push("3d");
        }
        if (normalizedText.includes("2d")) {
            recommendedTagList.push("2d");
        }
        if (normalizedText.includes("dimension")) {
            recommendedTagList.push("3d");
            recommendedTagList.push("2d");
        }

        // Misc
        if (
            normalizedText.includes("clicker") ||
            normalizedText.includes("clicking")
        ) {
            recommendedTagList.push("clicker");
        }
        if (
            normalizedText.includes("metroid") ||
            normalizedText.includes("metroidvania")
        ) {
            recommendedTagList.push("metroidvania");
        }
        if (
            normalizedText.includes("towerdefense") ||
            normalizedText.includes("btd") ||
            normalizedText.includes("bloonstd")
        ) {
            recommendedTagList.push("towerdefense");
        }
        if (
            normalizedText.includes("christmas") ||
            normalizedText.includes("festive") ||
            normalizedText.includes("xmas") ||
            normalizedText.includes("presents")
        ) {
            recommendedTagList.push("christmas");
        }
        if (normalizedText.includes("aprilfools")) {
            recommendedTagList.push("aprilfools");
        }

        // remove recommended tags present inside the text
        for (const hashtag of hashtags) {
            recommendedTagList = recommendedTagList.filter(
                (recommendedTag) => `#${recommendedTag}` !== hashtag
            );
        }
        // remove duplicate tags
        recommendedTagList = [...new Set(recommendedTagList)];
        recommendedTagUpdate += 1;
    };
    const clickOnRecommendedTag = (tagText) => {
        const originalText = String(components.projectNotes.value);
        if (
            originalText.endsWith(" ") ||
            originalText.length <= 0 ||
            originalText.match(/^[\s]+$/gi)
        ) {
            components.projectNotes.value += `#${tagText}`;
        } else {
            components.projectNotes.value += ` #${tagText}`;
        }
        updateRecommendedTags();
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

    function dataURLtoBlob(dataurl) {
        var arr = dataurl.split(","),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    onMount(async () => {
        const params = new URLSearchParams(location.search);
        const projName = params.get("name");
        const remixId = params.get("remix");
        const importLocation = params.get("external");
        if (projName) {
            projectName = projName;
        }
        const remixNumber = Number(remixId);
        if (!isNaN(remixNumber) && remixNumber > 0) {
            remixedInURL = true;
            remixProjectId = remixNumber;
            ProjectApi.getProjectMeta(remixProjectId).then((meta) => {
                remixingProjectName = meta.name;
            });
        }

        username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
        }
        Authentication.usernameFromCode(username, token)
            .then(() => {
                ProjectClient.setUsername(username);
                ProjectClient.setToken(token);
                loggedIn = true;
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
                        "*" // now really you should never do this but im lazy and this shit is refusing to work
                    );
                } catch (e) {
                    console.warn("Cannot post message", e);
                }
            }
            // when WE get a post from PM
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
                    projectImageURL = data.uri;
                    projectImage = dataURLtoBlob(data.uri);
                    updateSize();
                }
                // project: uri of project data
                if (data.type === "project") {
                    projectData = dataURLtoBlob(data.uri);
                    updateSize();
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

        projectSizes = { name: `0/${PUBLIC_MAX_UPLOAD_SIZE*(await ProjectClient.isDonator()?1.75:1)}MB`, value: [] };
    });

    function filePicked(file) {
        return new Promise((resolve, reject) => {
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
        projectImage = input.files[0];
        projectImageURL = await filePicked(projectImage);
        updateSize();
    }
    async function projectFilePicked(input) {
        input = input.target;
        const file = input.files[0];
        if (!file) return;
        projectData = file;
        projectInputName.innerText = TranslationHandler.text(
            "uploading.project.ownfile.picked",
            currentLang
        )
            .replace("$2", floatTo2Decimals(file.size / 1250000))
            .replace("$1", file.name);
        updateSize();
    }

    let isBusyUploading = false;
    async function uploadProject() {
        if (isBusyUploading) return;
        isBusyUploading = true;

        if (!projectImage) {
            projectImage = await fetch("/empty-project.png").then((res) =>
                res.blob()
            );
        }

        ProjectClient.uploadProject({
            title: components.projectName.value,
            instructions: components.projectInstructions.value,
            notes: components.projectNotes.value,
            image: projectImage,
            remix: remixProjectId,
            project: projectData,
        })
            .then((projectId) => open(`${PUBLIC_STUDIO_URL}/#${projectId}`))
            .catch((err) => {
                let message = "";
                switch (err) {
                    case "Uploaded in the last 8 minutes":
                        message = TranslationHandler.textSafe(
                            "uploading.error.toomanyrequests",
                            currentLang,
                            "You can only upload projects every 8 minutes."
                        );
                        break;
                    case "Uploading is disabled":
                        message = TranslationHandler.textSafe(
                            "uploading.error.publishdisabled",
                            currentLang,
                            "We are undergoing maintenance, so you are not able to upload projects at this time."
                        );
                        break;
                    case "Missing json file, thumbnail, or assets":
                        message = TranslationHandler.textSafe(
                            "uploading.error.formaterror",
                            currentLang,
                            "Some values are not right. Check that all required fields are filled."
                        );
                        break;
                    case "IllegalWordsUsed":
                        message = TranslationHandler.textSafe(
                            "uploading.error.illegalwordsused",
                            currentLang,
                            "Words or phrases were used that are not allowed in PenguinMod. Please check through your project's details for any inappropriate words or phrases."
                        );
                        break;
                    default:
                        message = TranslationHandler.textSafe(
                            "uploading.error.unknown",
                            currentLang,
                            "Unknown error. The file may be too large or something unexpected happened. Full error: $1"
                        ).replace("$1", err);
                        break;
                }
                if (String(err).startsWith("Extension not allowed:")) {
                    message = TranslationHandler.textSafe(
                        "uploading.error.cannotusethisextensionforthisrank",
                        currentLang,
                        "You cannot upload this project yet as it contains custom extensions or certain blocked extensions. Upload a few other projects and wait a few days to rank up before you can post this project."
                    );
                }
                alert(message);
            })
            .finally(() => {
                isBusyUploading = false;
            });
    }

    Authentication.onLogout(() => {
        loggedIn = false;
    });
    Authentication.onAuthentication((_username, privateCode) => {
        loggedIn = true;
        username = _username;
        ProjectClient.setUsername(_username);
        ProjectClient.setToken(privateCode);
    });

    let otherProjects = [];
    let canRemix = [];

    let remixPageOpen = false;
    let updatePageOpen = false;
    let guidelinePageOpen = false;

    async function incrementPageAndAddToMenu(pageType) {
        // todo: not this thats for sure
        //       just do one of them and then await it idk
        //       gonna do that later
        //       (aka in like 3 months when i finally look at this code again)
        if (pageType === "remix") {
            if ((projectRemixSearchQuery ?? "").trim() !== "") {
                projectPageSearch += 1;

                ProjectApi.searchProjects(
                    projectPageSearch ?? 0,
                    projectRemixSearchQuery.trim(),
                    ProjectClient.username,
                    ProjectClient.token
                ).then((meta) => {
                    let projectss = meta.filter(
                        (p) => !canRemix.some((i) => i.id === p.id)
                    );
                    canRemix = [...projectss, ...canRemix];
                    canRemix = canRemix;

                    lastProjectPage = projectss.length <= 0;
                });
            } else {
                projectPageSearch = 0;
                projectPage += 1;
                ProjectApi.getProjects(projectPage, false, username, ProjectClient.token).then((projectss) => {
                    canRemix.push(...projectss);
                    canRemix = canRemix;
                    lastProjectPage = projectss.length <= 0;
                });
            }
        } else {
            ProjectClient.getMyProjects(projectPage).then((projectss) => {
                otherProjects.push(...projectss);
                otherProjects = otherProjects;
                lastProjectPage = projectss.length <= 0;
            });
        }
    }

    function openRemixMenu() {
        canRemix = [];
        projectPage = 0;
        projectPageSearch = 0;
        lastProjectPage = false;
        projectPageType = "remix";
        remixPageOpen = true;

        ProjectApi.getProjects(projectPage, false, ProjectClient.token).then((projects) => {
            canRemix = projects;
        });
    }
    function openUpdateMenu() {
        otherProjects = [];
        projectPage = 0;
        lastProjectPage = false;
        projectPageType = "update";
        updatePageOpen = true;
        ProjectClient.getMyProjects().then((projects) => {
            otherProjects = projects;
        });
    }

    let _window = { location: { origin: null } };
    function generateExportEditPageForId(id) {
        const origin = String(_window.location.origin);
        return `${origin}/edit?id=${id}&external=${origin}`;
    }

    function projectRemixSearchInputFnc() {
        if (/^[0-9]+$/.test(projectRemixSearchQuery)) {
            if (canRemix.some((i) => i.id === projectRemixSearchQuery)) return;

            ProjectApi.getProjectMeta(projectRemixSearchQuery.trim())
                .then((meta) => {
                    canRemix.push(meta);
                    canRemix = canRemix;
                })
                .catch((_err) => console.warn("that's not a project id"));
        } else {
            projectPageSearch = 0;
            ProjectApi.searchProjects(
                0,
                projectRemixSearchQuery.trim(),
                ProjectClient.username,
                ProjectClient.token
            )
                .then((meta) => {
                    let filteredMeta = meta.filter(
                        (p) => !canRemix.some((i) => i.id === p.id)
                    );
                    canRemix = [...filteredMeta, ...canRemix];
                    canRemix = canRemix;

                    if (filteredMeta.length <= 0) {
                        lastProjectPage = true;
                    }
                })
                .catch((error) => console.error(error));
        }
    }

    onMount(() => {
        _window = window;
        // when WE get a post from edit site
        window.addEventListener("message", (e) => {
            if (!e.origin.startsWith(location.origin)) {
                return;
            }
            const data = e.data && e.data.p4;
            if (!data) {
                return;
            }

            // send data
            if (data.type === "validate") {
                e.source.postMessage(
                    {
                        p4: {
                            type: "image",
                            uri: projectImage,
                        },
                    },
                    e.origin
                );
                e.source.postMessage(
                    {
                        p4: {
                            type: "project",
                            uri: projectData,
                            name: projectName,
                        },
                    },
                    e.origin
                );
                e.source.postMessage(
                    {
                        p4: {
                            type: "metadata",
                            meta: {
                                title: components.projectName.value,
                                instructions:
                                    components.projectInstructions.value,
                                notes: components.projectNotes.value,
                            },
                        },
                    },
                    e.origin
                );
                e.source.postMessage(
                    {
                        p4: {
                            type: "finished",
                        },
                    },
                    e.origin
                );
            }
        });
    });

    function selectToRemixProject(id, title) {
        remixProjectId = String(id);
        if (isNaN(remixProjectId) || remixProjectId < 0) remixProjectId = 0;
        remixingProjectName = title;
        remixPageOpen = false;
    }

    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae

    const emojiPickerRandomEmojis = [
        "angel",
        "angry",
        "annoyed",
        "bigsad",
        "disappointed",
        "happy",
        "idk",
        "meh",
        "salute",
        "shocked",
        "sobbing",
        "worried",
        "investigate",
        "grimacing",
        "confusedthinking",
        "cool",
        "tada",
    ];
    let emojiPickerRandomEmoji = "";
    let emojiSearchQuery = "";
    let emojiSearchBar;
    let projectRemixSearchQuery = "";
    let lastSelectedFormArea;
    const pickRandomEmojiPickerDisplay = () => {
        emojiPickerRandomEmoji =
            emojiPickerRandomEmojis[
                Math.round(Math.random() * (emojiPickerRandomEmojis.length - 1))
            ];
    };
    pickRandomEmojiPickerDisplay();

    let emojiPickerListUpdate = 0;
    const allowEmojiDrop = (ev) => {
        const data = ev.dataTransfer.getData("emoji");
        if (data && typeof data === "string") {
            ev.preventDefault();
        }
    };
    const useEmojiDrag = (ev, name) => {
        ev.dataTransfer.setData("emoji", name);
    };
    const handleEmojiDrop = (ev) => {
        const data = ev.dataTransfer.getData("emoji");
        if (data && typeof data === "string") {
            ev.dataTransfer.setData("emoji", "");
            ev.preventDefault();
        } else {
            return;
        }

        ev.toElement.value += `:${data}:`;
        if (emojiSearchBar) {
            emojiSearchQuery = emojiSearchBar.value;
        }
        emojiPickerListUpdate++;
    };
    const placeEmojiInTextbox = (emoji) => {
        if (!lastSelectedFormArea) return;
        lastSelectedFormArea.value += `:${emoji}:`;
        if (emojiSearchBar) {
            emojiSearchQuery = emojiSearchBar.value;
        }
        emojiPickerListUpdate++;
    };

    let emojiPickerOpened = false;
    onMount(() => {
        components.projectName.addEventListener("click", (e) => {
            lastSelectedFormArea = e.target;
        });
        components.projectInstructions.addEventListener("click", (e) => {
            lastSelectedFormArea = e.target;
        });
        components.projectNotes.addEventListener("click", (e) => {
            lastSelectedFormArea = e.target;
        });
        EmojiList.fetch().finally(() => {
            emojiPickerListUpdate++;
        });
    });
</script>

<svelte:head>
    <title>PenguinMod - Upload</title>
    <meta name="title" content="PenguinMod - Upload" />
    <meta property="og:title" content="PenguinMod - Upload" />
    <meta property="twitter:title" content="PenguinMod - Upload" />
    <meta
        name="description"
        content="Upload your project to PenguinMod, for the whole world to see."
    />
    <meta
        property="twitter:description"
        content="Upload your project to PenguinMod, for the whole world to see."
    />
    <meta property="og:url" content="https://penguinmod.com/upload" />
    <meta property="twitter:url" content="https://penguinmod.com/upload" />
</svelte:head>

<NavigationBar />

<div class="main">
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

    {#if updatePageOpen}
        <div class="front-card-page">
            <div class="card-page">
                <div class="card-header">
                    <h1>
                        <LocalizedText
                            text="Select a project"
                            key="uploading.project.selector"
                            lang={currentLang}
                        />
                    </h1>
                </div>
                <div class="card-projects">
                    {#each otherProjects as project}
                        <ClickableProject
                            id={project.id}
                            title={project.title}
                            author={project.author.username ?? username}
                            lastUpdate={project.lastUpdate}
                            featured={project.featured}
                            showdate={true}
                            on:click={window.open(
                                generateExportEditPageForId(project.id),
                                "_blank"
                            )}
                        />
                    {/each}
                    {#if !lastProjectPage}
                        <!-- todo: should this really look the way it does? -->
                        <Button
                            label="<img alt='More' src='/dropdown-caret-hd.png' width='20'></img>"
                            on:click={() =>
                                incrementPageAndAddToMenu(projectPageType)}
                        />
                    {/if}
                </div>
                <div style="display:flex;flex-direction:row;padding:1em">
                    <Button
                        on:click={() => {
                            updatePageOpen = false;
                        }}
                    >
                        <LocalizedText
                            text="Cancel"
                            key="uploading.project.selector.cancel"
                            lang={currentLang}
                        />
                    </Button>
                </div>
            </div>
        </div>
    {/if}

    {#if remixPageOpen}
        <div class="front-card-page">
            <div class="card-page">
                <div class="card-header">
                    <h1>
                        <LocalizedText
                            text="Select a project"
                            key="uploading.project.selector"
                            lang={currentLang}
                        />
                    </h1>
                </div>
                <div class="search-input">
                    <input
                        type="text"
                        placeholder={TranslationHandler.textSafe(
                            "navigation.search",
                            currentLang,
                            "Search for projects..."
                        )}
                        on:paste={() => {
                            projectRemixSearchInputFnc();
                        }}
                        bind:value={projectRemixSearchQuery}
                        on:input={() => {
                            lastProjectPage = false;
                        }}
                    />
                    <Button
                        on:click={() => {
                            projectRemixSearchInputFnc();
                        }}
                    >
                        <SearchSVG
                            width="22px"
                            height="22px"
                            color="#ffffff"
                            scale="2px"
                        />
                    </Button>
                </div>
                <div class="card-projects">
                    {#each canRemix as project}
                        <ClickableProject
                            id={project.id}
                            title={project.title}
                            author={project.author.username}
                            lastUpdate={project.lastUpdate}
                            featured={project.featured}
                            showdate={true}
                            on:click={() => {
                                selectToRemixProject(project.id, project.title);
                            }}
                        />
                    {/each}
                    {#if !lastProjectPage}
                        <!-- todo: should this really look the way it does? -->
                        <Button
                            label="<img alt='More' src='/dropdown-caret-hd.png' width='20'></img>"
                            on:click={() => {
                                incrementPageAndAddToMenu(projectPageType); 
                            }}
                        />
                    {/if}
                </div>
                <div style="display:flex;flex-direction:row;padding:1em">
                    <Button
                        on:click={() => {
                            remixPageOpen = false;
                        }}
                    >
                        <LocalizedText
                            text="Cancel"
                            key="uploading.project.selector.cancel"
                            lang={currentLang}
                        />
                    </Button>
                </div>
            </div>
        </div>
    {/if}

    <!-- {#if guidelinePageOpen}
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
                        src="https://studio.penguinmod.com/PenguinMod-Guidelines/PROJECTS"
                    />
                </div>
                <a
                    href="https://studio.penguinmod.com/PenguinMod-Guidelines/PROJECTS"
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
    {/if} -->

    <div class="section-info">
        <h1>
            <LocalizedText
                text="Upload"
                key="uploading.title"
                lang={currentLang}
            />
        </h1>
    </div>

    <div class="full">
        <div class="card">
            <button
                on:mouseenter={pickRandomEmojiPickerDisplay}
                on:click={() => {
                    emojiPickerOpened = !emojiPickerOpened;
                }}
                title="Pick an emoji"
                class="emoji-picker-button"
            >
                <img
                    src={`https://library.penguinmod.com/files/emojis/${emojiPickerRandomEmoji}.png`}
                    alt="Emoji"
                    title="Pick an emoji"
                    on:dragstart={(ev) => {
                        useEmojiDrag(ev, emojiPickerRandomEmoji);
                    }}
                />
            </button>
            <div class="emoji-picker-list" data-opened={emojiPickerOpened}>
                <div class="emoji-picker-search-container">
                    <div class="emoji-picker-search-icon">
                        <SearchSVG
                            width="30px"
                            height="20px"
                            color="#000000"
                            scale="2px"
                            style="margin-bottom:5px; margin-top: 5px;"
                        />
                    </div>
                    <input
                        on:dragover={allowEmojiDrop}
                        on:drop={handleEmojiDrop}
                        type="text"
                        placeholder="..."
                        bind:value={emojiSearchQuery}
                        bind:this={emojiSearchBar}
                    />
                </div>
                <div class="emoji-picker-emoji-container">
                    {#key emojiPickerListUpdate}
                        {#if EmojiList.loading}
                            <LoadingSpinner></LoadingSpinner>
                        {:else if EmojiList.failed}
                            <p>
                                <LocalizedText
                                    text="Unknown error."
                                    key="generic.errorsmall"
                                    lang={currentLang}
                                />
                            </p>
                        {:else}
                            {#each EmojiList.emojis as emoji}
                                {#if !emojiSearchQuery || String(emoji).includes(emojiSearchQuery
                                            .toLowerCase()
                                            .replace(/[^a-z]+/gim, ""))}
                                    <button
                                        class="emoji-picker-emoji"
                                        on:click={() =>
                                            placeEmojiInTextbox(emoji)}
                                    >
                                        <img
                                            src={`https://library.penguinmod.com/files/emojis/${emoji}.png`}
                                            alt={`:${emoji}:`}
                                            title={`:${emoji}:`}
                                            draggable="false"
                                        />
                                    </button>
                                {/if}
                            {/each}
                        {/if}
                    {/key}
                </div>
            </div>
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
                        on:input={updateRecommendedTags}
                        on:dragover={allowEmojiDrop}
                        on:drop={handleEmojiDrop}
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
                        on:input={updateRecommendedTags}
                        on:dragover={allowEmojiDrop}
                        on:drop={handleEmojiDrop}
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
                        on:input={updateRecommendedTags}
                        on:dragover={allowEmojiDrop}
                        on:drop={handleEmojiDrop}
                    />
                    {#key recommendedTagUpdate}
                        {#each recommendedTagList as recommendedTag}
                            <button
                                class="recommended-tag"
                                on:click={() =>
                                    clickOnRecommendedTag(recommendedTag)}
                            >
                                + #{recommendedTag}
                            </button>
                        {/each}
                    {/key}
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
                    <div style="height:16px" />
                    <p>
                        <a
                            class="guidelines-link"
                            target="_blank"
                            href={"/guidelines/uploading"}
                        >
                            <LocalizedText
                                text="Project Uploading & Updating Guidelines"
                                key="uploading.guidelines.button"
                                lang={currentLang}
                            />
                        </a>
                    </p>
                </div>
                <div style="width:50%;">
                    <img
                        src={projectImage
                            ? projectImageURL
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
                    <hr />
                    <Stats stats_data={[projectSizes]} render={true}></Stats>
                </div>
            </div>
            <div style="display:flex;flex-direction:row;margin-top:48px">
                {#if loggedIn && projectData}
                    <div>
                        {#if remixingProjectName}
                            <p>
                                {String(
                                    TranslationHandler.text(
                                        "uploading.remix.selected",
                                        currentLang
                                    )
                                ).replace("$1", remixingProjectName)}
                            </p>
                        {/if}
                        <div style="display:flex;flex-direction:row">
                            {#if isBusyUploading}
                                <div class="button-sized">
                                    <span style="width:26px;height:20px"></span>
                                    <LocalizedText
                                        text="Upload"
                                        key="uploading.type.upload"
                                        lang={currentLang}
                                    />
                                    <div>
                                        <LoadingSpinner></LoadingSpinner>
                                    </div>
                                </div>
                            {:else}
                                <Button
                                    icon="upload.svg"
                                    on:click={uploadProject}
                                >
                                    <LocalizedText
                                        text="Upload"
                                        key="uploading.type.upload"
                                        lang={currentLang}
                                    />
                                </Button>
                            {/if}
                            {#if !remixedInURL}
                                <Button
                                    color="remix"
                                    icon="remix.svg"
                                    on:click={openRemixMenu}
                                >
                                    <LocalizedText
                                        text="Remix"
                                        key="uploading.type.remix"
                                        lang={currentLang}
                                    />
                                </Button>
                            {/if}
                            <Button
                                color="orange"
                                icon="update.svg"
                                on:click={openUpdateMenu}
                            >
                                <LocalizedText
                                    text="Update"
                                    key="uploading.type.update"
                                    lang={currentLang}
                                />
                            </Button>
                        </div>
                    </div>
                {:else}
                    <div>
                        {#if loggedIn === false}
                            <p>
                                <LocalizedText
                                    text="Please log-in to upload a project."
                                    key="uploading.project.mustlogin"
                                    lang={currentLang}
                                />
                            </p>
                        {:else if !projectData}
                            <p>
                                <LocalizedText
                                    text="You must select a project file to upload."
                                    key="uploading.project.mustselect"
                                    lang={currentLang}
                                />
                            </p>
                        {/if}
                        <div style="display:flex;flex-direction:row">
                            <Button color="gray" icon="upload.svg">
                                <LocalizedText
                                    text="Upload"
                                    key="uploading.type.upload"
                                    lang={currentLang}
                                />
                            </Button>
                            {#if !remixedInURL}
                                <Button color="gray" icon="remix.svg">
                                    <LocalizedText
                                        text="Remix"
                                        key="uploading.type.remix"
                                        lang={currentLang}
                                    />
                                </Button>
                            {/if}
                            <Button color="gray" icon="update.svg">
                                <LocalizedText
                                    text="Update"
                                    key="uploading.type.update"
                                    lang={currentLang}
                                />
                            </Button>
                        </div>
                    </div>
                {/if}
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

    .button-sized {
        position: relative;
        margin: 0.25rem;
        padding: 1rem 1rem;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        color: transparent;
    }
    .button-sized > div {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }
    .emoji-picker-button {
        position: absolute;
        left: -72px;
        top: 0;
        width: 64px;
        height: 64px;
        border-radius: 1024px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        background: transparent;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    :global(html[dir="rtl"]) .emoji-picker-button {
        left: initial;
        right: -72px;
    }
    :global(body.dark-mode) .emoji-picker-button {
        border-color: rgba(255, 255, 255, 0.35);
    }
    .emoji-picker-button img {
        width: 56px;
        height: 56px;
        transform: scale(1);
        transition-duration: 0.3s;
    }
    .emoji-picker-button:hover img {
        transform: scale(1.2);
        transition-duration: 0.3s;
    }
    .emoji-picker-button:active img {
        filter: brightness(0.8);
        transition-duration: 0.1s;
    }
    .emoji-picker-list {
        position: absolute;
        top: 8px;
        right: 8px;
        background: white;
        width: 520px;
        height: 87.5%;
        display: none;
        border-radius: 8px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        z-index: 50;
    }
    :global(html[dir="rtl"]) .emoji-picker-list {
        right: initial;
        left: 8px;
    }
    :global(body.dark-mode) .emoji-picker-list {
        border-color: rgba(255, 255, 255, 0.35);
        background: #111;
    }
    .emoji-picker-list[data-opened="true"] {
        display: initial;
    }
    .emoji-picker-search-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 32px;
    }
    .emoji-picker-search-container input {
        width: calc(100% - 48px);
        height: 24px;
        border: 0;
        padding: 0 4px;
        margin: 0;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }
    :global(body.dark-mode) .emoji-picker-search-container input {
        background: rgba(255, 255, 255, 0.1);
    }
    .emoji-picker-search-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    :global(body.dark-mode) .emoji-picker-search-icon {
        filter: invert(1);
    }
    .emoji-picker-emoji-container {
        overflow: auto;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        height: calc(100% - 32px);
    }
    .emoji-picker-emoji {
        background: transparent;
        border: 0;
        width: 48px;
        height: 48px;
        margin: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .emoji-picker-emoji img {
        width: 48px;
        height: 48px;
    }
    .emoji-picker-emoji:hover {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
    }
    :global(body.dark-mode) .emoji-picker-emoji:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .recommended-tag {
        background: #00c3ff;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        padding: 2px 4px;
        margin-right: 4px;
        margin-bottom: 4px;
        color: white;
        cursor: pointer;
    }
    :global(html[dir="rtl"]) .recommended-tag {
        margin-right: initial;
        margin-left: 4px;
    }

    .card {
        width: 60%;
        padding: 32px;
        border-style: solid;
        border-width: 2px;
        border-color: rgba(0, 0, 0, 0.1);
        border-radius: 16px;
        position: relative;
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
        margin-bottom: 0.5rem;
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
        z-index: 99999;
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
        z-index: 99998;
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
    /* .only-in-dark-mode {
        display: none;
    }
    :global(body.dark-mode) .only-in-dark-mode {
        display: inline;
    } */
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
    .search-input {
        display: flex;
        flex-direction: row;
        gap: 5px;
        width: 80%;
    }
    .search-input input {
        box-sizing: border-box;
        width: 100%;
        margin: 5px;
        font-size: 20px;
        flex: 1;
    }

    /* iframe {
        width: 100%;
        border: 0;
    } */
</style>
