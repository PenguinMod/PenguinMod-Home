<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";
    import Authentication from "../../resources/authentication.js";
    import LINK from "../../resources/urls.js";
    import ProfileBadges from "../../resources/badges.js";
    import QuickRejectComponent from "./quickRejects.svelte";
    import ProjectApi from "../../resources/projectapi.js";
    import * as FileSaver from "file-saver";
    import JSZip from "jszip";
    import BlobAndDataUrl from "../../resources/blobanddataurl.js";
    import FileTypes from "./filetypes.js";
    import Stats from "../../lib/statsComponent/stats.svelte";

    const ProjectClient = new ProjectApi();

    // Components
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import ClickableProject from "$lib/ClickableProject/Project.svelte";
    import Button from "$lib/Button/Button.svelte";

    function unixToDisplayDate(unix) {
        return `${new Date(Number(unix)).toDateString()} at ${new Date(
            Number(unix),
        ).toLocaleTimeString()}`;
    }

    let loggedIn = null;
    let projectIdSelection;
    let serverStats = [];
    const selectForReject = $page.url.searchParams.get("reject");

    function kickOut(loggedOut) {
        const error = loggedOut ? 401 : 403;
        location.href = location.origin + `/error?error=${error}`;
    }

    onMount(() => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }

        function Flatten(obj) {
            let stats = [];
            for (const name in obj) {
                if (typeof obj[name] === "object") {
                    stats.push({ name: name, value: Flatten(obj[name]) });
                    continue;
                }
                stats.push(`${name}: ${obj[name]}`);
            }
            return stats;
        }

        ProjectApi.getServerInfo()
            .then((stats) => {
                serverStats = Flatten(stats);
            })
            .catch((err) => {
                console.error(err);
            });
        Authentication.usernameFromCode(username, token)
            .then(({ isAdmin, isApprover }) => {
                if (!isAdmin && !isApprover) {
                    kickOut(false);
                    return;
                }
                ProjectClient.setUsername(username);
                ProjectClient.setToken(token);
                loggedIn = true;
            })
            .catch(() => {
                loggedIn = false;
                kickOut(true);
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

    // moved this here so it can be used latter on
    let dropdownSelectMenu;

    let contentWithReports = [];
    let unapprovedProjects = [];
    let selectedReportDetailed = -1;
    let reportDetails = Object.create(null);

    const guidelinesNotifs = {
        tos: false,
        pp: false,
        ug: false,
    };

    const loadReportDetails = async (id) => {
        try {
            let type = "user";
            if (dropdownSelectMenu.value === "project") {
                type = "project";
            }
            if (id in reportDetails) {
                return;
            }
            let reports = await ProjectClient.getReports(type, id);
            reportDetails[id] = reports;
            reportDetails = reportDetails;
        } catch {
            console.warn(`Failed to load report details for ${id}`);
            reportDetails[id] = [];
            reportDetails = reportDetails;
        }
    };

    const setGetProjects = (allowGetProjects) => {
        if (!confirm("Are you sure?")) return;
        ProjectClient.setErrorAllGetProjects(allowGetProjects)
            .then(() => {
                alert("done");
            })
            .catch((err) => {
                console.error(err);
                alert(err);
            });
    };
    const setUploadProjects = (allowUploadProjects) => {
        if (!confirm("Are you sure?")) return;
        ProjectClient.setErrorAllUploadProjects(allowUploadProjects)
            .then(() => {
                alert("done");
            })
            .catch((err) => {
                console.error(err);
                alert(err);
            });
    };
    const setAccountCreation = (allowAccountCreation) => {
        if (!confirm("Are you sure?")) return;
        ProjectClient.setErrorAccountCreation(allowAccountCreation)
            .then(() => {
                alert("done");
            })
            .catch((err) => {
                console.error(err);
                alert(err);
            });
    };

    let projectListStyle = "";
    const refreshProjectMenu = () => {
        unapprovedProjects = [];
        contentWithReports = [];
        projectListStyle = "";
        selectedReportDetailed = -1;
        reportDetails = Object.create(null);
        switch (dropdownSelectMenu.value) {
            case "user":
            case "project":
                return openReportsMenu(dropdownSelectMenu.value);
            case "removed":
                projectListStyle = "flex-direction: row;flex-wrap: wrap;";
            //return openProjectsMenu(dropdownSelectMenu.value);
        }
    };
    const closeUserReport = (reportID) => {
        const confirmed = prompt(
            "Are you sure you've looked over this result completely? (Type 'ok' to confirm)",
        );
        if (confirmed !== "ok") return;
        ProjectClient.closeReport(reportID)
            .then(() => {
                refreshProjectMenu();
            })
            .catch((err) => {
                alert(err);
            });
    };

    let unapprovedPage = 1;
    function openProjectsMenu(type) {
        // type is assumed to be unapproved because we have nothing else right now
        unapprovedProjects = [];
        contentWithReports = [];
        ProjectClient.getRemovedProjects(unapprovedPage - 1).then(
            (unapprovedProjs) => {
                unapprovedProjects = unapprovedProjs;
            },
        );
    }
    function openReportsMenu(type) {
        unapprovedProjects = [];
        contentWithReports = [];
        ProjectClient.getTypeWithReports(type, 0).then(
            (projectsWithReports) => {
                contentWithReports = projectsWithReports;
                console.log(contentWithReports);
            },
        );
        // get approved projects anyways cuz we need to update list
        // todo: getProjects is paged breh what we do?
        //       add a new endpoint containing all project names with tons of compression propably :idk_man:
        //       remember: network usage is key here since that makes us loose money :()

        // ProjectApi.getProjects().then((projects) => {
        //     approvedProjectNames = projects.map((p) => p.name);
        // });
    }
    // function deleteProject(id, name) {
    //     const code = prompt(
    //         `Delete ${name}? This CANNOT be undone!\nType "${id}" to delete this project.`
    //     );
    //     if (String(code).replace(/[^0-9]*/gim, "") !== String(id)) {
    //         return;
    //     }
    //     ProjectClient.deleteProject(id);
    // }
    let rejectionPageOpen = false;
    let deletionPageOpen = false;
    let rejectingId = 0;
    let rejectingName = "";
    let rejectingTextboxAreaText = "";
    let isRejectHard = false;
    function rejectProject(id) {
        id ??= projectIdSelection.value;
        const confirmationMessage =
            `Reject "${rejectingName || id}"?\n` +
            `${
                isRejectHard
                    ? "Hard reject is enabled.\nThe uploader will not be able to edit the original project once you reject it."
                    : "Soft reject is enabled."
            }`;
        if (!confirm(confirmationMessage)) return;
        if (rejectingTextboxAreaText.length <= 3) {
            return alert("The action was cancelled.");
        }
        if (!isRejectHard) {
            ProjectClient.rejectProject(id, rejectingTextboxAreaText).then(
                () => {
                    rejectionPageOpen = false;
                    refreshProjectMenu();
                },
            );
        } else {
            ProjectClient.hardRejectProject(id, rejectingTextboxAreaText).then(
                () => {
                    rejectionPageOpen = false;
                    refreshProjectMenu();
                },
            );
        }
    }
    function deleteThumbnail(id) {
        id ??= projectIdSelection.value;
        if (
            !confirm(
                `Are you sure you want to remove project ${id}'s thumbnail?`,
            )
        )
            return;
        ProjectClient.removeProjectThumbnail(id);
    }
    let selectedProjectName = "";
    let lastSelectedProjectId = 0;
    function selectProject(id, name) {
        projectIdSelection.value = id;
        lastSelectedProjectId = id;
        if (name) {
            selectedProjectName = name;
        } else {
            ProjectApi.getProjectMeta(id).then((v) => {
                selectedProjectName = v.title;
            });
        }
    }

    const openRemoveProjectMenu = async () => {
        const id = String(projectIdSelection.value);
        rejectingId = id;
        if (selectedProjectName) {
            rejectingName = selectedProjectName;
        } else {
            try {
                const projectMeta = await ProjectApi.getProjectMeta(id);
                rejectingName = projectMeta.title;
            } catch {
                rejectingName = "";
            }
        }
        rejectionPageOpen = true;
    };

    const openDeleteProjectMenu = async () => {
        const id = String(projectIdSelection.value);
        rejectingId = id;
        if (selectedProjectName) {
            rejectingName = selectedProjectName;
        } else {
            try {
                const projectMeta = await ProjectApi.getProjectMeta(id);
                rejectingName = projectMeta.title;
            } catch {
                rejectingName = "";
            }
        }
        deletionPageOpen = true;
    };
    function featureProject(value) {
        const id = String(projectIdSelection.value);
        const usure = confirm(`${value ? "Feature" : "Unfeature"} project?`);
        if (!usure) return;
        ProjectClient.featureProject(id, value).catch((err) => alert(err));
    }
    function setCommunityFeaturableProject(value) {
        const id = String(projectIdSelection.value);
        const usure = confirm(
            value
                ? `Enable community featuring for this project?`
                : `Disabling community feature will remove this project from the "Projects people want Featured" list and the project can only be manually featured.` +
                      `\nWe have guidelines for which projects should have community features disabled. Are you sure this project deserves to lose the ability to be community featured?`,
        );
        if (!usure) return;
        ProjectClient.setCanBeFeatured(id, value).catch((err) => alert(err));
    }

    onMount(() => {
        projectIdSelection.onchange = () => {
            const value = projectIdSelection.value;
            if (value !== lastSelectedProjectId) {
                selectedProjectName = "";
            }
        };
        if (selectForReject && String(selectForReject).length > 4) {
            projectIdSelection.value = selectForReject;
            openRemoveProjectMenu();
        }
    });

    // let sendWebhook = true;
    // function approveProject() {
    //     const id = Number(projectIdSelection.value);
    //     if (isNaN(id)) return;
    //     ProjectClient.approveProject(id, sendWebhook)
    //         .then(() => {
    //             alert("The project was approved!");
    //             // uhhhhhhh apparently we need to do this ig?
    //             const newProjects = projects.filter((proj) => proj.id !== id);
    //             projects = [];
    //             projects = newProjects;
    //         })
    //         .catch((err) => {
    //             alert(err);
    //         });
    // }

    const filterJSONStuff = {
        text: "",
    };
    filterJSONStuff.get = async () => {
        filterJSONStuff.text = JSON.stringify(
            await ProjectClient.getProfanityFilter(),
            null,
            4,
        );
    };
    filterJSONStuff.set = (data) => {
        ProjectClient.setProfanityFilter(data);
    };

    let inspectMenuOpen = false;
    let censorMenuOpen = false;
    const inspectMenuDetails = {
        downloading: false,
        error: false,
        errorText: false,
        extensions: [],
        extensionData: {},
        extensionUrls: {},
    };
    const censorMenuDetails = {
        downloading: false,
        uploading: false,
        error: false,
        id: 0,
        costumes: [],
        sounds: [],
        censoredCostumes: {},
        mutedSounds: {},
        previewNoBG: true,
        previewBlack: false,
        size: 128,
        rawProject: null,
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
        setTimeout(async () => {
            if (!inspectMenuOpen) return; // dont download if we closed
            const id = String(projectIdSelection.value);
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
                                JSON.stringify(extensionData),
                            );
                            inspectMenuDetails.downloading = false;
                            // get all urls
                            for (const extensionId of extensionList) {
                                if (!extensionData[extensionId]) {
                                    extensionData[extensionId] =
                                        "(Core Extension)";
                                    continue;
                                }
                                fetch(extensionData[extensionId]).then(
                                    (res) => {
                                        res.text().then((code) => {
                                            extensionData[extensionId] = code;
                                            resetInspectMenu();
                                        });
                                    },
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
    const addToCensorMenuArray = async (asset, array, zip) => {
        const assetFile = asset.md5ext;
        try {
            /**
             * @type {Blob}
             */
            const blob = await zip.file(assetFile).async("blob");
            const fileType = await BlobAndDataUrl.fileTypeFromBlob(blob);
            const mimeType = FileTypes.mimeTypePairs[fileType];
            const typedBlob = new Blob([await blob.arrayBuffer()], {
                type: mimeType,
            });
            const properURL = URL.createObjectURL(typedBlob);
            array.push({ name: asset.name, url: properURL, file: assetFile });
        } catch (e) {
            console.warn("asset", asset.name, assetFile, "failed to load", e);
        }
    };
    const fillCensorMenu = async (projectJson, zip) => {
        const displayCostumes = censorMenuDetails.costumes;
        const displaySounds = censorMenuDetails.sounds;
        for (const target of projectJson.targets) {
            for (const costume of target.costumes) {
                await addToCensorMenuArray(costume, displayCostumes, zip);
            }
            for (const sound of target.sounds) {
                await addToCensorMenuArray(sound, displaySounds, zip);
            }
        }
        // svelte doesnt react to array.push apparently
        censorMenuDetails.costumes = displayCostumes;
        censorMenuDetails.sounds = displaySounds;
        censorMenuDetails.downloading = false;
        censorMenuDetails.uploading = false;
    };
    const fetchElementAsBlob = async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw `${url} not OK`;
        const arrayBuffer = await res.arrayBuffer();
        const blob = BlobAndDataUrl.arrayBufferToBlob(arrayBuffer);
        return blob;
    };
    const _applyCensorChanges = async () => {
        /**
         * @type {{ zip:JSZip, json:object }}
         */
        const project = censorMenuDetails.rawProject;
        const censorCostume = await fetchElementAsBlob("/censor/costume.svg");
        const censorSound = await fetchElementAsBlob("/censor/sound.mp3");
        // get info that needs updating
        // NOTE: these include the file type at the end
        const censoredCostumes = Object.keys(
            censorMenuDetails.censoredCostumes,
        ).filter((key) => censorMenuDetails.censoredCostumes[key] === true);
        const censoredSounds = Object.keys(
            censorMenuDetails.mutedSounds,
        ).filter((key) => censorMenuDetails.mutedSounds[key] === true);
        // update json
        for (const target of project.json.targets) {
            for (const costumeId of censoredCostumes) {
                for (const costume of target.costumes) {
                    if (!(costume.md5ext === costumeId)) continue;
                    costume.rotationCenterX = 32;
                    costume.rotationCenterY = 32;
                    costume.bitmapResolution = 1;
                    costume.dataFormat = "svg";
                    costume.md5ext = `${costume.assetId}.svg`;
                }
            }
            for (const soundId of censoredSounds) {
                for (const sound of target.sounds) {
                    if (!(sound.md5ext === soundId)) continue;
                    sound.dataFormat = "mp3";
                    sound.format = "mp3";
                    sound.md5ext = `${sound.assetId}.mp3`;
                }
            }
        }
        // update zip
        for (const costumeId of censoredCostumes) {
            project.zip.file(costumeId, censorCostume);
        }
        for (const soundId of censoredSounds) {
            project.zip.file(soundId, censorSound);
        }
        const penguinModProject = await project.zip.generateAsync({
            type: "blob",
        });
        const projectId = censorMenuDetails.id;

        const meta = await ProjectApi.getProjectMeta(projectId);
        const thumbnail = await ProjectApi.getProjectThumbnail(projectId);

        await ProjectClient.updateProject(projectId, {
            project: penguinModProject,
            newMeta: {
                title: meta.title,
                instructions: meta.instructions,
                notes: meta.notes,
            },
            image: thumbnail,
        });
    };
    const applyCensorChanges = async () => {
        censorMenuDetails.uploading = true;
        try {
            await _applyCensorChanges();
            censorMenuOpen = false;
        } catch (e) {
            console.error(e);
            alert(e);
        }
        censorMenuDetails.uploading = false;
    };
    function openCensorMenu() {
        censorMenuOpen = true;
        censorMenuDetails.downloading = true;
        censorMenuDetails.uploading = false;
        censorMenuDetails.error = false;
        setTimeout(() => {
            if (!censorMenuOpen) return; // dont download if we closed
            const id = String(projectIdSelection.value);
            censorMenuDetails.id = id;
            ProjectApi.getProjectFile(id)
                .then((blob) => {
                    JSZip.loadAsync(blob)
                        .then(async (zip) => {
                            const project = await zip
                                .file("project.json")
                                .async("string");
                            const json = JSON.parse(project);
                            censorMenuDetails.costumes = [];
                            censorMenuDetails.sounds = [];
                            censorMenuDetails.rawProject = {
                                zip,
                                json,
                            };
                            await fillCensorMenu(json, zip);
                        })
                        .catch((err) => {
                            censorMenuDetails.error = true;
                            censorMenuDetails.errorText = err;
                        });
                })
                .catch((err) => {
                    censorMenuDetails.error = true;
                    censorMenuDetails.errorText = err;
                });
        }, 1000);
    }

    const messageReplyInfo = {
        id: "",
        text: "",
        target: "",
        canBeReplied: true,
        inReplyTab: true,
        deleteId: "",
    };
    const replyToMessage = () => {
        if (!messageReplyInfo.id) return alert("Message ID is not specified.");
        if (!messageReplyInfo.text)
            return alert("No message text was specified.");
        if (!confirm(`Reply to message with "${messageReplyInfo.text}"?`))
            return;
        ProjectClient.respondToDispute(
            messageReplyInfo.id,
            messageReplyInfo.text,
        )
            .then(() => {
                alert("Sent!");
                messageReplyInfo.id = "";
                messageReplyInfo.text = "";
            })
            .catch((err) => alert("Failed to send message:" + err));
    };
    const sendNewMessage = () => {
        if (!messageReplyInfo.text)
            return alert("No message text was specified.");
        if (
            !confirm(
                `Send ${messageReplyInfo.canBeReplied ? "respondable" : "non-respondable"} message to ${messageReplyInfo.target} with "${messageReplyInfo.text}"?${messageReplyInfo.canBeReplied ? "" : "\nThe user will not be able to respond to your message."}`,
            )
        )
            return;
        ProjectClient.sendModeratorMessage(
            messageReplyInfo.target,
            messageReplyInfo.text,
            messageReplyInfo.canBeReplied,
        )
            .then(() => {
                alert("Sent!");
                messageReplyInfo.target = "";
                messageReplyInfo.text = "";
            })
            .catch((err) => alert("Failed to send message:" + err));
    };
    const deleteModMessage = () => {
        if (!messageReplyInfo.deleteId)
            return alert("No message ID was specified.");
        if (prompt('Delete moderator message? Type "ok" to confirm.') !== "ok")
            return;
        ProjectClient.deleteModeratorMessage(messageReplyInfo.deleteId)
            .then(() => {
                alert("Deleted.");
                messageReplyInfo.deleteId = "";
            })
            .catch((err) => alert("Failed to delete message:" + err));
    };
    const sendGuidelinesNotifs = () => {
        const notifs = [];
        if (guidelinesNotifs.tos) {
            notifs.push("tos");
        }
        if (guidelinesNotifs.pp) {
            notifs.push("privacyPolicy");
        }
        if (guidelinesNotifs.ug) {
            notifs.push("guidelines");
        }
        if (notifs.length <= 0) return alert("No notifs were selected!");
        const confirmed = prompt(
            'Are you sure you want to notify ALL users of the site?\nType "ok" to confirm.',
        );
        if (confirmed !== "ok") return;
        ProjectClient.setLastPolicyUpdate(notifs);
    };

    let rejectedProjectId = "0";
    const downloadRejectedProject = async () => {
        try {
            const projectFile =
                await ProjectClient.downloadHardRejectedProject(
                    rejectedProjectId,
                );
            FileSaver.saveAs(
                new Blob([projectFile]),
                `Project_${rejectedProjectId}.pmp`,
            );
        } catch (err) {
            console.error(err);
            alert(`Failed to download the project; ${err}`);
        }
    };
    const restoreRejectedProject = () => {
        if (!confirm("Are you sure you want to restore this project?")) return;
        ProjectClient.restoreRejectedProject(rejectedProjectId)
            .then(() => {
                alert("Restored!");
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to restore project; ${err}`);
            });
    };
    const deleteProject = (id, reason) => {
        if (
            !confirm(
                "Are you sure you want to PERMANENTLY delete this project?\nYou should only do this if the project contains some really bad stuff.",
            )
        )
            return;
        ProjectClient.deleteProject(id, reason)
            .then(() => {
                alert("Deleted.");
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to delete project; ${err}`);
            });
    };

    const userSelectionData = {
        username: "",
        reason: "",
        time: 0,
        admin: false,
        approver: false,
        newUsername: "",
        newPfp: null,
    };
    const renameUser = () => {
        const promptMessage = prompt(
            `Are you sure you want to rename ${userSelectionData.username} to ${userSelectionData.newUsername}?\nType "ok" to confirm.`,
        );
        if (promptMessage !== "ok") return;
        ProjectClient.setUsernameOfUser(
            userSelectionData.username,
            userSelectionData.newUsername,
        )
            .then(() => {
                alert(
                    `Renamed ${userSelectionData.username} to ${userSelectionData.newUsername}`,
                );
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to rename user; ${err}`);
            });
    };
    const setNewPfpInput = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const arrayBuffer = reader.result;
            userSelectionData.newPfp = arrayBuffer;
        };

        // get it as a blob
        reader.readAsArrayBuffer(file);
    };
    const changePfpUser = () => {
        const promptMessage = prompt(
            `Are you sure you want to change ${userSelectionData.username}'s Profile Picture?\nType "ok" to confirm.`,
        );
        if (promptMessage !== "ok") return;
        ProjectClient.setPFPOfUser(
            userSelectionData.username,
            userSelectionData.newPfp,
        )
            .then(() => {
                alert(
                    `Changed ${userSelectionData.username}'s Profile Picture.`,
                );
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to change profile picture of user; ${err}`);
            });
    };

    const banUser = () => {
        const promptMessage = prompt(
            `Are you sure you want to ban ${userSelectionData.username} for "${userSelectionData.reason}"? Type "ok" to confirm.`,
        );
        if (promptMessage !== "ok") return;
        ProjectClient.banUser(
            userSelectionData.username,
            userSelectionData.reason,
            0,
            true,
        )
            .then(() => {
                alert(`Banned ${userSelectionData.username}.`);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to ban user; ${err}`);
            });
    };

    const tempBanUser = () => {
        const promptMessage = prompt(
            `Are you sure you want to temp ban ${userSelectionData.username} for "${userSelectionData.reason}" for ${userSelectionData.time} seconds (${userSelectionData.time / (60 * 60)} hours)? Type "ok" to confirm.`,
        );
        if (promptMessage !== "ok") return;
        ProjectClient.banUser(
            userSelectionData.username,
            userSelectionData.reason,
            Math.ceil(userSelectionData.time * 1000),
            true,
        )
            .then(() => {
                alert(`Banned ${userSelectionData.username}.`);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to ban user; ${err}`);
            });
    };

    const unbanUser = () => {
        const promptMessage = prompt(
            `Are you sure you want to unban ${userSelectionData.username}? Type "ok" to confirm.`,
        );
        if (promptMessage !== "ok") return;
        ProjectClient.banUser(
            userSelectionData.username,
            userSelectionData.reason,
            0,
            false,
        )
            .then(() => {
                alert(`Unbanned ${userSelectionData.username}.`);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to unban user; ${err}`);
            });
    };

    const userBadgeInfo = {
        isEditingMulti: false,

        targetUsername: "", // single
        areBadgesLoaded: false, // single
        currentUserBadges: {}, // single

        targetUsernamesBox: "", // multi
        isRemovingBadges: false, // multi
        targetFilterBadges: {}, // multi
    };
    const loadUserBadges = async () => {
        userBadgeInfo.areBadgesLoaded = false;
        if (!userBadgeInfo.targetUsername) return;
        const realBadges = await ProjectApi.getUserBadges(
            userBadgeInfo.targetUsername,
        );
        userBadgeInfo.currentUserBadges = {};
        for (const badgeName in ProfileBadges) {
            userBadgeInfo.currentUserBadges[badgeName] = false;
        }
        for (const badgeName of realBadges) {
            userBadgeInfo.currentUserBadges[badgeName] = true;
        }
        userBadgeInfo.areBadgesLoaded = true;
    };
    const applyUserBadges = () => {
        const targetUsers = userBadgeInfo.targetUsernamesBox
            .split("\n")
            .map((username) => username.replace(/[\r\s]/g, "").toLowerCase());
        const affectedUsers = !userBadgeInfo.isEditingMulti
            ? 1
            : targetUsers.length;
        if (userBadgeInfo.isEditingMulti) {
            if (!confirm(`Edit badges for ${affectedUsers} users?`)) return;
        } else {
            if (!confirm("Apply badges to this user?")) return;
        }

        if (userBadgeInfo.isEditingMulti) {
            const newBadges = [];
            for (const badgeName in userBadgeInfo.targetFilterBadges) {
                if (userBadgeInfo.targetFilterBadges[badgeName] === true) {
                    newBadges.push(badgeName);
                }
            }

            console.log(targetUsers, newBadges, userBadgeInfo.isRemovingBadges);
            ProjectClient.setUsersBadges(
                targetUsers,
                newBadges,
                userBadgeInfo.isRemovingBadges,
            )
                .then(() => {
                    alert("Badges are set!");
                })
                .catch((err) => {
                    alert(`An error occurred: ${err}`);
                });
            return;
        }

        const newBadges = [];
        for (const badgeName in userBadgeInfo.currentUserBadges) {
            if (userBadgeInfo.currentUserBadges[badgeName] === true) {
                newBadges.push(badgeName);
            }
        }

        ProjectClient.setUserBadges(userBadgeInfo.targetUsername, newBadges)
            .then(() => {
                alert("Badges are set!");
            })
            .catch((err) => {
                alert(`An error occurred: ${err}`);
            });
    };

    const setUsersPerms = () => {
        const verbAdmin = userSelectionData.admin
            ? `grant ${userSelectionData.username} admin?`
            : `revoke ${userSelectionData.username}'s admin?`;
        const verbApprover = userSelectionData.approver
            ? `grant ${userSelectionData.username} modderator?`
            : `revoke ${userSelectionData.username}'s modderation possition?`;
        const promptMessage = prompt(
            `Are you sure you want to ${verbAdmin} & ${verbApprover} Type "ok" to confirm.`,
        );
        if (promptMessage !== "ok") return;
        ProjectClient.assingUsersPermisions(
            userSelectionData.username,
            userSelectionData.admin,
            userSelectionData.approver,
        )
            .then(() => {
                // i don wana make it re-say the whole grant-revoke thingy
                alert(
                    `Successfully did what ever you said to do ${userSelectionData.username}.`,
                );
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to moddify users permissions; ${err}`);
            });
    };

    function ipBanUser(toggle = true) {
        if (toggle) {
            const promptMessage = prompt(
                `Are you sure you want to IP ban ${userSelectionData.username}? They will be unable to use ANY part of the site that requires the server. People who are on the same network may not be able to access that either. Type "ok" to confirm.`,
            );
            if (promptMessage !== "ok") return;
        }

        ProjectClient.ipBanUser(userSelectionData.username, toggle)
            .then(() => {
                alert(
                    `${toggle ? "" : "Un "}IP Banned ${userSelectionData.username}.`,
                );
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to ${toggle ? "" : "Un "}IP ban user; ${err}`);
            });
    }

    function deleteAccount() {
        if (
            prompt(
                'Are you sure you want to delete this account? THIS IS PERMANENT AND DELETES **ALL** DATA. enter "ok" to confirm.',
            ) !== "ok"
        )
            return;
        ProjectClient.deleteUserAccount(
            userSelectionData.username,
            userSelectionData.reason,
        )
            .then(() => {
                alert("Account deleted.");
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to delete account; ${err}`);
            });
    }

    let ipBanData = {
        input: "",
        connectedIPs: [],
    };

    function getConnectedIPs() {
        ProjectClient.getConnectedIPs(ipBanData.input)
            .then((ips) => {
                ipBanData.connectedIPs = _parseIPs(ips);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to get connected IPs; ${err}`);
            });
    }

    function getConnectedUsers() {
        ProjectClient.getConnectedUsers(ipBanData.input)
            .then((users) => {
                ipBanData.connectedIPs = users.map((v) => v.username);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to get connected users; ${err}`);
            });
    }

    function getAlts() {
        ProjectClient.getAlts(ipBanData.input)
            .then((users) => {
                ipBanData.connectedIPs = users;
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to get connected users; ${err}`);
            });
    }

    function _parseIPs(ips) {
        return ips.map((ip) => {
            return `IP: ${ip.ip}, banned: ${ip.banned}, last login: ${unixToDisplayDate(ip.lastLogin)}`;
        });
    }

    function banIP(toggle) {
        if (toggle) {
            const promptMessage = prompt(
                `Are you sure you want to ban this ip? No one who has this ip, even who are just on the same network, will be able to use anything that needs the api. Type "ok" to confirm.`,
            );
            if (promptMessage !== "ok") return;
        }

        ProjectClient.banIP(ipBanData.input, toggle)
            .then(() => {
                alert(`${toggle ? "" : "Un "}Banned ${ipBanData.input}.`);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to ${toggle ? "" : "Un "}ban IP; ${err}`);
            });
    }

    let showUserPerms = false;
    let listOfAdmins = [];
    let listOfMods = [];
    const loadUserPerms = () =>
        ProjectClient.getAllPermitedUsers()
            .then((users) => {
                listOfAdmins = users.admins;
                listOfMods = users.mods;
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to get permited users; ${err}`);
            });

    function putOnWatchlist(enabled) {
        ProjectClient.putOnWatchlist(userSelectionData.username, enabled)
            .then((success) => {
                if (!success) alert("FAILURE!!!");
                else alert("success");
            })
            .catch((error) => {
                alert(`ERROR: ${error}`);
            });
    }
</script>

<svelte:head>
    <title>PenguinMod - Admin Panel</title>
    <meta
        name="robots"
        content="noindex,nofollow,noarchive,nosnippet,noimageindex,nocache,none"
    />
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home" />
    <meta
        name="description"
        content="The area where featured projects and community stuff & info is shown."
    />
    <meta
        property="twitter:description"
        content="The area where featured projects and community stuff & info is shown."
    />
    <meta property="og:url" content="https://penguinmod.com/" />
    <meta property="twitter:url" content="https://penguinmod.com/" />
</svelte:head>

<NavigationBar />

{#if !loggedIn}
    <NavigationMargin />
    <LoadingSpinner enableTips={true} />
{/if}

<div class="main" style={loggedIn ? "" : "display:none"}>
    <NavigationMargin />

    <div
        class="front-card-page"
        style="z-index: 20000;{rejectionPageOpen ? '' : 'display:none;'}"
    >
        <div class="card-page big-card-page">
            <div class="card-header">
                <h1>Reject Project</h1>
            </div>
            <div class="card-reject" style="display:block">
                <p>Rejecting <b>{rejectingName}</b></p>
                <img
                    src={`${LINK.projects}api/v1/projects/getproject?projectID=${rejectingId}&requestType=thumbnail`}
                    alt="Image of {rejectingName}"
                    width="240"
                    height="180"
                />
                <!-- svelte-ignore a11y-autofocus -->
                <textarea
                    bind:value={rejectingTextboxAreaText}
                    placeholder="Reason for rejecting..."
                    style="width: 95%;"
                    autofocus
                />
                <details>
                    <summary>Dangerous options</summary>
                    <label style="color:red">
                        <input type="checkbox" bind:checked={isRejectHard} />
                        Don't allow the uploader to edit the project after reject
                        (hard reject)
                    </label>
                </details>
                <br />
                <br />
                <h2><b>Quick-Reject</b></h2>
                <QuickRejectComponent
                    on:select={(arg) => {
                        rejectingTextboxAreaText = arg.detail;
                    }}
                />
            </div>
            <div style="display:flex;flex-direction:row;padding:1em">
                <Button
                    label="Reject"
                    color="red"
                    on:click={() => {
                        rejectProject(rejectingId);
                    }}
                />
                <Button
                    label="Cancel"
                    on:click={() => {
                        rejectionPageOpen = false;
                    }}
                />
            </div>
        </div>
    </div>

    <div
        class="front-card-page"
        style="z-index: 20000;{deletionPageOpen ? '' : 'display:none;'}"
    >
        <div class="card-page big-card-page">
            <div class="card-header">
                <h1>Delete Project</h1>
            </div>
            <div class="card-reject" style="display:block">
                <p>Deleting <b>{rejectingName}</b></p>
                <img
                    src={`${LINK.projects}api/v1/projects/getproject?projectID=${rejectingId}&requestType=thumbnail`}
                    alt="Image of {rejectingName}"
                    width="240"
                    height="180"
                />
                <!-- svelte-ignore a11y-autofocus -->
                <textarea
                    bind:value={rejectingTextboxAreaText}
                    placeholder="Reason for deletion..."
                    style="width: 95%;"
                    autofocus
                />
                <br />
                <br />
                <h2><b>Quick-Delete</b></h2>
                <QuickRejectComponent
                    on:select={(arg) => {
                        rejectingTextboxAreaText = arg.detail;
                    }}
                />
            </div>
            <div style="display:flex;flex-direction:row;padding:1em">
                <Button
                    label="Hard Delete"
                    color="red"
                    on:click={() => {
                        deleteProject(rejectingId, rejectingTextboxAreaText);
                        deletionPageOpen = false;
                    }}
                />
                <Button
                    label="Cancel"
                    on:click={() => {
                        deletionPageOpen = false;
                    }}
                />
            </div>
        </div>
    </div>

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
                                {#if inspectMenuDetails.extensionUrls[extensionId]}
                                    <a
                                        href={inspectMenuDetails.extensionUrls[
                                            extensionId
                                        ]}
                                        target="_blank"
                                    >
                                        {String(
                                            inspectMenuDetails.extensionUrls[
                                                extensionId
                                            ],
                                        ).length > 456
                                            ? "Extension URL is too long"
                                            : String(
                                                  inspectMenuDetails
                                                      .extensionUrls[
                                                      extensionId
                                                  ],
                                              )}
                                    </a>

                                    <textarea
                                        value={inspectMenuDetails.extensionData[
                                            extensionId
                                        ]}
                                        style="width:90%;height:256px;font-family:monospace"
                                    />
                                {:else}
                                    (Core Extension)
                                {/if}
                            </p>
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
    {#if censorMenuOpen}
        <div class="front-card-page">
            <div class="card-page big-card-page">
                <div class="card-header">
                    <h1>Censor Images/Audio</h1>
                </div>
                <div class="card-projects" style="display:block">
                    {#if censorMenuDetails.downloading}
                        <p style="width:100%;text-align:center;">
                            Downloading project, this might take a bit...
                        </p>
                    {:else}
                        <h1>Costumes</h1>
                        <p>
                            Click the Replace button to mark it to be replaced
                            with a 🚫 sign
                        </p>
                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={
                                        censorMenuDetails.previewBlack
                                    }
                                />
                                Use black background
                            </label>
                        </p>
                        <p>
                            <label>
                                <input
                                    type="checkbox"
                                    bind:checked={censorMenuDetails.previewNoBG}
                                />
                                Use no background
                            </label>
                        </p>
                        <p>
                            <label>
                                Size
                                <input
                                    type="number"
                                    bind:value={censorMenuDetails.size}
                                />
                                (enter nothing to use image size)
                            </label>
                        </p>
                        <div style="display:flex;flex-wrap:wrap;">
                            {#each censorMenuDetails.costumes as costume}
                                <div
                                    style="padding:4px; border:1px solid black; margin:4px;"
                                >
                                    <img
                                        src={costume.url}
                                        alt={costume.name}
                                        width={censorMenuDetails.size}
                                        height={censorMenuDetails.size}
                                        style={censorMenuDetails.previewNoBG
                                            ? ""
                                            : `background:${censorMenuDetails.previewBlack ? "black" : "white"}`}
                                    />
                                    <p>{costume.name}</p>
                                    <p>
                                        <label>
                                            <input
                                                type="checkbox"
                                                bind:checked={
                                                    censorMenuDetails
                                                        .censoredCostumes[
                                                        costume.file
                                                    ]
                                                }
                                            />
                                            Replace
                                        </label>
                                    </p>
                                </div>
                            {/each}
                        </div>
                        <h1>Sounds</h1>
                        <p>Click the Mute button to mark it to be muted</p>
                        {#each censorMenuDetails.sounds as sound}
                            <figure>
                                <figcaption>{sound.name}</figcaption>
                                <audio volume={0.5} src={sound.url} controls />
                                <br />
                                <a
                                    download={sound.name}
                                    href={sound.url}
                                    target="_blank"
                                >
                                    Download
                                </a>
                                <label>
                                    <input
                                        type="checkbox"
                                        bind:checked={
                                            censorMenuDetails.mutedSounds[
                                                sound.file
                                            ]
                                        }
                                    />
                                    Mute
                                </label>
                            </figure>
                        {/each}
                    {/if}
                    {#if censorMenuDetails.error}
                        <p style="width:100%;text-align:center;color:red">
                            {censorMenuDetails.errorText}
                        </p>
                    {/if}
                </div>
                <div style="display:flex;flex-direction:row;padding:1em">
                    {#if censorMenuDetails.uploading}
                        <LoadingSpinner></LoadingSpinner>
                    {:else}
                        <Button
                            color="red"
                            label="Apply changes"
                            on:click={applyCensorChanges}
                        />
                    {/if}
                    <Button
                        label="Close"
                        on:click={() => {
                            censorMenuOpen = false;
                        }}
                    />
                </div>
            </div>
        </div>
    {/if}

    <!-- {#if guidelinePageOpen}
        <div class="front-card-page">
            <div class="card-page">
                <div class="card-header">
                    <h1>Guidelines</h1>
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
    {/if} -->

    <div class="section-info">
        <div>
            <h1 style="margin-block:8px">Admin Panel</h1>
        </div>
    </div>

    <div class="double-list">
        <div class="full">
            <p>
                <a
                    class="guidelines-link"
                    target="_blank"
                    href={"/guidelines/moderation"}
                >
                    PenguinMod Moderation Expectations
                </a>
            </p>

            <div class="card">
                <h2 style="margin-block-start:0">Projects</h2>
                <p>
                    Project ID:
                    <input
                        type="string"
                        bind:this={projectIdSelection}
                        value="0"
                    />
                </p>
                <p>
                    <Button
                        label="Select"
                        color="orange"
                        on:click={() => selectProject(projectIdSelection.value)}
                    />
                </p>
                {#if selectedProjectName}
                    <a
                        target="_blank"
                        href={`${PUBLIC_STUDIO_URL}/#${lastSelectedProjectId}`}
                        style="color: dodgerblue"
                    >
                        <p>
                            Selected <b>{selectedProjectName}</b>
                        </p>
                        <img
                            src={`${ProjectApi.OriginApiUrl}/api/v1/projects/getproject?projectID=${lastSelectedProjectId}&requestType=thumbnail`}
                            alt="Project Thumbnail"
                            style={{ maxWidth: "100%" }}
                        />
                    </a>
                {/if}
                <h3>Tools</h3>
                <div style="display: flex; flex-direction: row;">
                    <Button
                        label="Inspect Extensions"
                        on:click={openInspectMenu}
                    />
                    <Button
                        label="Censor Images/Audio"
                        on:click={openCensorMenu}
                    />
                </div>
                <!-- <div style="height:24px" />
                <label>
                    <input type="checkbox" bind:checked={sendWebhook} />
                    Send Approved Projects to Discord
                </label> -->
                <div style="height:24px" />
                <div style="display: flex; flex-direction: row; width: 100%;">
                    <Button
                        label="Remove"
                        color="red"
                        on:click={openRemoveProjectMenu}
                    />
                    <Button
                        label="Hard Delete"
                        color="purple"
                        on:click={openDeleteProjectMenu}
                    />
                    <div style="width:24px" />
                    <Button
                        label="Remove Thumbnail"
                        color="red"
                        on:click={() => deleteThumbnail()}
                    />
                </div>
                <div style="height:24px" />
                <div style="display: flex; flex-direction: row; width: 100%;">
                    <Button
                        label="Feature"
                        color="orange"
                        on:click={() => featureProject(true)}
                    />
                    <Button
                        label="Unfeature"
                        color="red"
                        on:click={() => featureProject(false)}
                    />
                    <div style="width:24px" />
                    <Button
                        label="Allow Community Feature"
                        color="remix"
                        on:click={() => setCommunityFeaturableProject(true)}
                    />
                    <Button
                        label="Disable Community Feature"
                        color="red"
                        on:click={() => setCommunityFeaturableProject(false)}
                    />
                </div>
                <h3>Removed Projects</h3>
                <p>
                    Target Removed Project:
                    <input type="text" bind:value={rejectedProjectId} />
                </p>
                <div
                    style="display: flex; flex-direction: row; align-items: center;"
                >
                    <Button on:click={downloadRejectedProject}>Download</Button>
                    <Button color="remix" on:click={restoreRejectedProject}>
                        Restore
                    </Button>
                </div>
            </div>

            <br />

            <p>
                <a
                    class="guidelines-link"
                    target="_blank"
                    href={"/guidelines/uploading"}
                >
                    Project Uploading & Updating Guidelines
                </a>
            </p>

            <br />

            <div class="card">
                <h2>Server Stats</h2>
                <Stats stats_data={serverStats} render={true} />
            </div>
            <br />

            <!-- ATODO: add mod message (just send a message to the user, not a dispute response) -->

            <div class="card">
                <h2 style="margin-block-start:0">Messages</h2>
                <p>
                    <a
                        class="guidelines-link"
                        target="_blank"
                        href={"/guidelines/moderation"}
                    >
                        PenguinMod Moderation Expectations
                    </a>
                </p>
                <button
                    on:click={() => {
                        messageReplyInfo.inReplyTab = true;
                    }}>Reply Menu</button
                >
                <button
                    on:click={() => {
                        messageReplyInfo.inReplyTab = false;
                    }}>Send Menu</button
                >
                {#if messageReplyInfo.inReplyTab}
                    <p>Respond to a project dispute/reply here.</p>
                    <p>
                        <i>
                            NOTE: Your usage of the moderator messaging system
                            must be appropriate.
                            <br />
                            View the
                            <a target="_blank" href={"/guidelines/moderation"}>
                                PenguinMod Moderation Expectations
                            </a> for more info.
                        </i>
                    </p>
                    <p>Type message ID:</p>
                    <input
                        type="text"
                        size="50"
                        placeholder="Message ID..."
                        bind:value={messageReplyInfo.id}
                    />
                    <p>Type reply:</p>
                    <textarea
                        type="text"
                        size="50"
                        placeholder="Reply..."
                        bind:value={messageReplyInfo.text}
                    />
                    <br />
                    <br />
                    <div class="user-action-row">
                        <Button color="remix" on:click={replyToMessage}>
                            Reply
                        </Button>
                    </div>
                {:else}
                    <p>Send a new moderator message to a user.</p>
                    <p>
                        <i>
                            NOTE: Your usage of the moderator messaging system
                            must be appropriate.
                            <br />
                            View the
                            <a target="_blank" href={"/guidelines/moderation"}>
                                PenguinMod Moderation Expectations
                            </a> for more info.
                        </i>
                    </p>
                    <p>Type receiver username:</p>
                    <input
                        type="text"
                        size="50"
                        placeholder="PenguinMod Username..."
                        bind:value={messageReplyInfo.target}
                    />
                    <p>Type message:</p>
                    <textarea
                        type="text"
                        size="50"
                        placeholder="Message..."
                        bind:value={messageReplyInfo.text}
                    />
                    <br />
                    <label>
                        <input
                            type="checkbox"
                            bind:checked={messageReplyInfo.canBeReplied}
                        />
                        Can the receiver reply back?
                    </label>
                    <br />
                    <br />
                    <div class="user-action-row">
                        <Button color="remix" on:click={sendNewMessage}>
                            Send
                        </Button>
                    </div>
                {/if}
                <br />
                <br />
                <h3>Delete Mod Message</h3>
                <p>Type message ID:</p>
                <input
                    type="text"
                    size="50"
                    placeholder="Message ID..."
                    bind:value={messageReplyInfo.deleteId}
                />
                <Button color="red" on:click={deleteModMessage}>Delete</Button>
                <br />
                <br />
                <h3>Guidelines</h3>
                <p>
                    Send update notifications for TOS, Privacy Policy, or
                    Uploading Guidelines.
                </p>
                <p>Will send to all users on the website.</p>
                <br />
                <label>
                    <input
                        type="checkbox"
                        bind:checked={guidelinesNotifs.tos}
                    />
                    Terms of Service
                </label>
                <br />
                <label>
                    <input type="checkbox" bind:checked={guidelinesNotifs.pp} />
                    Privacy Policy
                </label>
                <br />
                <label>
                    <input type="checkbox" bind:checked={guidelinesNotifs.ug} />
                    Uploading Guidelines
                </label>
                <br />
                <br />
                <div class="user-action-row">
                    <Button color="remix" on:click={sendGuidelinesNotifs}>
                        Send Guidelines Update
                    </Button>
                </div>
            </div>

            <br />

            <div class="card">
                <h2 style="margin-block-start:0">Users</h2>
                <Button on:click={loadUserPerms}>Load Permited Users</Button>
                {#if showUserPerms}
                    <h3>Admins</h3>
                    {#each listOfAdmins as admin}
                        <p>{admin.username}</p>
                    {/each}
                    <h3>Mods</h3>
                    {#each listOfMods as mod}
                        <p>{mod.username}</p>
                    {/each}
                {/if}
                <Button on:click={() => (showUserPerms = !showUserPerms)}
                    >{showUserPerms ? "Hide" : "Show"} Permited Users</Button
                >
                <p>Type username:</p>
                <input
                    type="text"
                    size="50"
                    placeholder="PenguinMod username..."
                    bind:value={userSelectionData.username}
                />
                <br />
                <br />
                Temp-Ban Time
                <input
                    type="number"
                    size="50"
                    bind:value={userSelectionData.time}
                />
                (in seconds)
                <br />
                <br />
                <input
                    type="text"
                    size="50"
                    placeholder="Action reason..."
                    bind:value={userSelectionData.reason}
                />
                <p>
                    Action reasons for user punishments must be translatable.
                    <br />
                    This means you should use formal wording and never use profanity.
                    <br />
                    Do NOT ban a user with something like "you know why" or "check
                    (url here) for info"
                    <br />
                    <br />
                    Punishment may occur if your action reasons become informal.
                </p>
                <div class="user-action-collumn">
                    <div class="user-action-row">
                        <Button color="red" on:click={banUser}>Ban User</Button>
                        <Button color="purple" on:click={tempBanUser}
                            >Temp-Ban User</Button
                        >
                        <Button on:click={unbanUser}>Unban User</Button>
                    </div>
                    <br />
                    <div class="user-action-row">
                        <Button color="red" on:click={() => ipBanUser(true)}
                            >IP Ban User</Button
                        >
                        <Button on:click={() => ipBanUser(false)}
                            >Un-IP Ban User</Button
                        >
                    </div>
                    <br />
                    <div class="user-action-row">
                        <Button color="red" on:click={deleteAccount}
                            >Delete User Account</Button
                        >
                    </div>
                    <br />
                    <div class="user-action-row">
                        <Button
                            color="orange"
                            on:click={() => putOnWatchlist(true)}
                            >Put on watchlist</Button
                        >
                        <Button
                            color="blue"
                            on:click={() => putOnWatchlist(false)}
                            >Take off watchlist</Button
                        >
                    </div>
                </div>
                <!-- <br>
                <br> -->
                <!-- <input
                    type="text"
                    size="50"
                    minlength="3"
                    maxlength="20"
                    placeholder="New username..."
                    bind:value={userSelectionData.newUsername}
                />
                <br> -->
                <label>
                    New Profile Picture:
                    <input type="file" on:change={setNewPfpInput} />
                </label>
                <br />
                <br />
                <!--<Button color="purple" on:click={renameUser}>Rename User</Button>-->
                <Button color="purple" on:click={changePfpUser}
                    >Change User's Profile Picture</Button
                >
                <br />
                <br />
                <label>
                    <input
                        type="checkbox"
                        bind:checked={userSelectionData.admin}
                    />
                    Grant User Admin Perms
                </label>
                <br />
                <label>
                    <input
                        type="checkbox"
                        bind:checked={userSelectionData.approver}
                    />
                    Grant User Moderator Perms
                </label>
                <div class="user-action-row">
                    <Button color="remix" on:click={setUsersPerms}
                        >Assign User Perms</Button
                    >
                </div>
            </div>

            <br />

            <div class="card">
                <h2 style="margin-block-start:0">IPs</h2>

                <input
                    type="text"
                    size="50"
                    placeholder="IP Address or Username"
                    bind:value={ipBanData.input}
                />

                <textarea
                    value={ipBanData.connectedIPs.join("\n")}
                    style="width:80%;height:150px;font-family:monospace"
                    readonly
                />

                <div class="user-action-row">
                    <Button on:click={getConnectedIPs}>Get Connected IPs</Button
                    >
                    <Button on:click={getConnectedUsers}
                        >Get Connected Users</Button
                    >
                    <Button color="red" on:click={() => banIP(true)}
                        >Ban IP</Button
                    >
                    <Button on:click={() => banIP(false)}>Unban IP</Button>
                    <Button on:click={getAlts}>Get alt accounts</Button>
                </div>
            </div>

            <div class="card">
                <h2 style="margin-block-start:0">Badges</h2>

                <button
                    on:click={() => {
                        userBadgeInfo.isEditingMulti = false;
                    }}>Specific User</button
                >
                <button
                    on:click={() => {
                        userBadgeInfo.isEditingMulti = true;
                    }}>Multiple Users</button
                >

                {#if !userBadgeInfo.isEditingMulti}
                    <p>Type username:</p>
                    <input
                        type="text"
                        size="50"
                        placeholder="PenguinMod username..."
                        on:change={() => {
                            userBadgeInfo.areBadgesLoaded = false;
                        }}
                        bind:value={userBadgeInfo.targetUsername}
                    />
                    <div class="user-action-row">
                        <Button on:click={loadUserBadges}>Load Badges</Button>
                    </div>
                    <br />
                    <br />
                    {#if userBadgeInfo.areBadgesLoaded}
                        <p>Click a badge to toggle if it is given to a user</p>
                        <p>
                            Dark gray badges are not added to the user or will
                            be removed from the user
                        </p>
                        <br />
                        <div class="user-badges-list">
                            {#each Object.keys(ProfileBadges) as badgeName}
                                <button
                                    class="user-badge-button"
                                    on:click={() => {
                                        userBadgeInfo.currentUserBadges[
                                            badgeName
                                        ] =
                                            !userBadgeInfo.currentUserBadges[
                                                badgeName
                                            ];
                                    }}
                                    data-active={userBadgeInfo
                                        .currentUserBadges[badgeName]}
                                >
                                    <img
                                        src={`/badges/${ProfileBadges[badgeName]}.png`}
                                        alt={badgeName}
                                    />
                                    {badgeName}
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <p>Badges have not been loaded.</p>
                    {/if}
                {:else}
                    <p>Type usernames:</p>
                    <textarea
                        style="width: 80%;height:120px"
                        placeholder="Paste PenguinMod usernames, seperated by new lines. Excess spaces will be trimmed."
                        bind:value={userBadgeInfo.targetUsernamesBox}
                    />

                    <br />
                    <label>
                        <input
                            type="checkbox"
                            bind:checked={userBadgeInfo.isRemovingBadges}
                        />
                        Remove Badges from Users
                    </label>
                    <br />

                    {#if userBadgeInfo.isRemovingBadges}
                        <p>Selected badges will be removed from each user.</p>
                    {:else}
                        <p>Selected badges will be added to each user.</p>
                    {/if}
                    <br />
                    <div class="user-badges-list">
                        {#each Object.keys(ProfileBadges) as badgeName}
                            <button
                                class="user-badge-button"
                                on:click={() => {
                                    userBadgeInfo.targetFilterBadges[
                                        badgeName
                                    ] =
                                        !userBadgeInfo.targetFilterBadges[
                                            badgeName
                                        ];
                                }}
                                data-active={userBadgeInfo.targetFilterBadges[
                                    badgeName
                                ]}
                            >
                                <img
                                    src={`/badges/${ProfileBadges[badgeName]}.png`}
                                    alt={badgeName}
                                />
                                {badgeName}
                            </button>
                        {/each}
                    </div>
                {/if}
                <br />
                <div style="width:100%;height:32px;" />
                <br />
                <div class="user-action-row">
                    <Button color="remix" on:click={applyUserBadges}>
                        Apply Badges
                    </Button>
                </div>
            </div>

            <br />
            <div class="card">
                <h2>Profanity Filter JSON</h2>
                <textarea bind:value={filterJSONStuff.text}></textarea>
                <br />
                <div class="user-action-row">
                    <Button color="remix" on:click={filterJSONStuff.get}>
                        Load Current Filter JSON
                    </Button>
                    <Button
                        on:click={() => {
                            let json = {};
                            try {
                                json = JSON.parse(filterJSONStuff.text);
                            } catch (e) {
                                alert("failed with error: " + e);
                                return;
                            }
                            filterJSONStuff.set(json);
                        }}
                    >
                        Update Filter
                    </Button>
                </div>
            </div>
            <br />

            <p>Global Server Toggles: (applies to all users)</p>
            <Button on:click={() => setGetProjects(false)} color="red">
                Disable Getting Projects
            </Button>
            <Button on:click={() => setGetProjects(true)} color="remix">
                Enable Getting Projects
            </Button>
            <Button on:click={() => setUploadProjects(false)} color="red">
                Disable Uploading Projects
            </Button>
            <Button on:click={() => setUploadProjects(true)} color="remix">
                Enable Uploading Projects
            </Button>
            <Button on:click={() => setAccountCreation(false)} color="red">
                Disable Account Creation
            </Button>
            <Button on:click={() => setAccountCreation(true)} color="remix">
                Enable Account Creation
            </Button>

            <br />
            <br />
        </div>
        <div class="project-sidebar">
            <div class="project-sidebar-actions">
                <Button on:click={refreshProjectMenu}>Refresh</Button>
                <select
                    value=""
                    on:change={refreshProjectMenu}
                    bind:this={dropdownSelectMenu}
                >
                    <option value="" disabled>(Select an option)</option>
                    <option value="" disabled />
                    <option value="user">User Reports</option>
                    <option value="project">Project Reports</option>
                    <option value="" disabled />
                    <optgroup label="Moderation">
                        <option value="removed">Removed Projects</option>
                        <option value="" disabled>
                            Assets (in development)
                        </option>
                    </optgroup>
                </select>
            </div>
            {#if !dropdownSelectMenu?.value}
                <p class="selection-info">
                    Please select what type of reports you wish to view
                </p>
            {/if}

            <div class="list-projects" style={projectListStyle}>
                {#if dropdownSelectMenu?.value}
                    {#if contentWithReports.length > 0 || unapprovedProjects.length > 0}
                        {#if dropdownSelectMenu.value === "user"}
                            <p class="selection-info">
                                Click on a user to expand details
                            </p>
                        {:else}
                            <p class="selection-info">
                                Click on a project to expand details
                            </p>
                        {/if}
                    {:else if dropdownSelectMenu.value === "user"}
                        <p class="selection-info">No user reports currently!</p>
                    {:else if dropdownSelectMenu.value === "removed"}
                        <p class="selection-info">
                            No removed projects currently!
                        </p>
                    {:else}
                        <p class="selection-info">
                            No project reports currently!
                        </p>
                    {/if}
                    {#each unapprovedProjects as project}
                        <div>
                            <ClickableProject
                                {...project}
                                on:click={() => {
                                    selectProject(project.id, project.name);
                                }}
                            />
                        </div>
                    {/each}
                    {#each contentWithReports as content, idx}
                        {#if dropdownSelectMenu.value === "user"}
                            <button
                                class="reports-user-button"
                                on:click={() => {
                                    loadReportDetails(content.target);
                                    if (selectedReportDetailed === idx) {
                                        selectedReportDetailed = -1;
                                        return;
                                    }
                                    selectedReportDetailed = idx;
                                }}
                            >
                                <img
                                    src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${content.target}`}
                                    alt={content.target}
                                />
                                <div class="reports-user-content">
                                    <p style="font-weight: bold;">
                                        {content.target}
                                    </p>
                                    <p>{content.target} reports</p>
                                </div>
                            </button>
                            {#if selectedReportDetailed === idx}
                                <div class="reports-generic-details">
                                    {#if !reportDetails[content.target]}
                                        <LoadingSpinner />
                                    {:else}
                                        <h5>
                                            By: <a
                                                href={`https://penguinmod.com/profile?user=${content.reporter}`}
                                                >{content.reporter}</a
                                            >
                                        </h5>
                                        <p>
                                            {content.report}
                                        </p>
                                        <Button
                                            on:click={() =>
                                                closeUserReport(content.id)}
                                            color="red"
                                        >
                                            Close Report
                                        </Button>
                                        <a
                                            href={`https://penguinmod.com/profile?user=${content.target}`}
                                            target="”_blank”">go to profile</a
                                        >
                                        <h3>View reports by</h3>
                                        {#each reportDetails[content.target] as report}
                                            <details>
                                                <summary>
                                                    {report.reporter}
                                                </summary>
                                                <Button
                                                    on:click={() =>
                                                        closeUserReport(
                                                            report.id,
                                                        )}
                                                    color="red"
                                                >
                                                    Close Report
                                                </Button>
                                                <p style="white-space:pre-wrap">
                                                    {report.report}
                                                </p>
                                            </details>
                                        {/each}
                                    {/if}
                                </div>
                            {/if}
                        {:else}
                            <button
                                class="reports-user-button reports-project-button"
                                on:click={() => {
                                    loadReportDetails(content.targetID);
                                    if (selectedReportDetailed === idx) {
                                        selectedReportDetailed = -1;
                                        return;
                                    }
                                    selectedReportDetailed = idx;
                                }}
                            >
                                <img
                                    src={`${PUBLIC_API_URL}/api/v1/projects/getproject?projectID=${content.targetID}&requestType=thumbnail`}
                                    alt={content.target}
                                />
                                <div
                                    class="reports-user-content reports-project-content"
                                >
                                    <p style="font-weight: bold;">
                                        {content.target}
                                    </p>
                                    <p>
                                        by {content.author}
                                    </p>
                                </div>
                            </button>
                            {#if selectedReportDetailed === idx}
                                <div class="reports-generic-details">
                                    <h5>
                                        By: <a
                                            href={`https://penguinmod.com/profile?user=${content.reporter}`}
                                            >{content.reporter}</a
                                        >
                                    </h5>
                                    <p>
                                        {content.report}
                                    </p>

                                    <p>
                                        View project at
                                        <a
                                            href={`${PUBLIC_STUDIO_URL}/#${content.targetID}`}
                                        >
                                            {`${PUBLIC_STUDIO_URL}/#${content.targetID}`}
                                        </a>
                                        or
                                        <button
                                            on:click={() =>
                                                selectProject(
                                                    content.targetID,
                                                    content.target,
                                                )}
                                        >
                                            Select Project
                                        </button>
                                    </p>
                                    {#if !reportDetails[content.targetID]}
                                        <LoadingSpinner />
                                    {:else}
                                        <h3>View reports by</h3>
                                        {#each reportDetails[content.targetID] as report}
                                            <details>
                                                <summary>
                                                    {report.reporter}
                                                </summary>
                                                <Button
                                                    on:click={() =>
                                                        closeUserReport(
                                                            report.id,
                                                        )}
                                                    color="red"
                                                >
                                                    Close Report
                                                </Button>
                                                <p style="white-space:pre-wrap">
                                                    {report.report}
                                                </p>
                                            </details>
                                        {/each}
                                        {#if reportDetails[content.targetID].length == 0}
                                            <Button
                                                on:click={() =>
                                                    closeUserReport(content.id)}
                                                color="red"
                                            >
                                                Force Close Report
                                            </Button>
                                        {/if}
                                    {/if}
                                </div>
                            {/if}
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>
    </div>
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
        height: calc(100% - 6rem - 3rem);
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
    .double-list {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row-reverse;
    }
    .full {
        width: calc(100% - 485px);
        height: calc(100% - 32px);
        overflow: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 32px;
    }
    :global(body.dark-mode) .card {
        border-color: rgba(255, 255, 255, 0.3);
    }

    .reports-user-button {
        margin: 4px;
        padding: 4px;
        border: rgba(0, 0, 0, 0.25) 1px solid;
        border-radius: 4px;
        background: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: calc(100% - 8px);
        height: 44px;
        cursor: pointer;
    }
    .reports-user-button:active {
        filter: brightness(0.9);
    }
    .reports-user-button img {
        width: 32px;
        height: 32px;
        border-radius: 4px;
    }
    .reports-project-button img {
        width: 48px;
        border-radius: 0;
    }
    .reports-user-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-left: 4px;
    }
    .reports-user-content p {
        margin-block: 0;
    }
    .reports-generic-details {
        margin: 4px;
        padding: 4px;
        border: rgba(0, 0, 0, 0.25) 1px solid;
        border-radius: 4px;
        background: white;
        width: calc(100% - 20px);
    }
    :global(body.dark-mode) .reports-user-button,
    :global(body.dark-mode) .reports-generic-details {
        border: rgba(255, 255, 255, 0.35) 1px solid;
        background: #111;
        color: white;
    }

    .selection-info {
        text-align: center;
    }
    .project-sidebar {
        display: flex;
        flex-direction: column;
        background: #00c3ff22;
    }
    .project-sidebar-actions {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        height: 5rem;
    }
    .list-projects {
        display: flex;
        flex-direction: column;
        width: 512px;
        flex-wrap: nowrap;
        overflow: auto;
        height: calc(100% - 5rem);
    }
    .user-action-row {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .user-action-collumn {
        display: flex;
        flex-direction: column;
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
        z-index: 5000;
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
    .card-reject {
        width: calc(100% - 32px);
        height: 100%;
        padding: 16px;
        overflow: auto;
    }

    .user-badges-list {
        display: flex;
        flex-direction: row;
        width: 100%;
        overflow: auto;
    }
    .user-badges-list button img {
        width: 64px;
        height: 64px;
    }
    .user-badge-button {
        background: #1f1f1f;
        filter: grayscale(1);
        color: white;
    }
    .user-badge-button[data-active="true"] {
        background: green;
        filter: initial;
    }

    .guidelines-link {
        background: transparent;
        border: 0;
        color: dodgerblue;
        text-decoration: underline;
        cursor: pointer;
        margin-top: 16px;
    }
</style>
