<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProfileBadges from "../../resources/badges.js";
    import QuickReject from "../../resources/quickReject.js";
    import ProjectApi from "../../resources/projectapi.js";
    import * as FileSaver from "file-saver";
    import JSZip from "jszip";

    const ProjectClient = new ProjectApi();

    // Components
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
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
            .then(({ username, isAdmin, isApprover }) => {
                if (username) {
                    if (!isAdmin && !isApprover) {
                        kickOut();
                        return;
                    }
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
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

    // moved this here so it can be used latter on
    let dropdownSelectMenu;

    let contentWithReports = [];
    let reports = [];
    let selectedReportDetailed = -1;
    let reportDetails = Object.create({});

    const loadReportDetails = (id) => {
        let type = "user";
        if (dropdownSelectMenu.value === "project") {
            type = "project";
        }
        if (id in reportDetails) {
            return;
        }
        ProjectClient.getReports(type, id).then((reports) => {
            reportDetails[id] = reports;
            reportDetails = reportDetails;
        });
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

    const refreshProjectMenu = () => {
        reports = [];
        contentWithReports = [];
        selectedReportDetailed = -1;
        reportDetails = Object.create({});
        switch (dropdownSelectMenu.value) {
            case "user":
            case "project":
                return openMenu(dropdownSelectMenu.value);
        }
    };
    const closeUserReports = (idOrName, user) => {
        const confirmed = prompt(
            'Are you sure you have looked at all reports and possibly acted upon them?\nType "ok" to close all reports from this user.'
        );
        if (confirmed !== "ok") return;
        const type = dropdownSelectMenu.value;
        ProjectClient.closeReports(type, idOrName, user)
            .then(() => {
                refreshProjectMenu();
            })
            .catch((err) => {
                alert(err);
            });
    };

    function openMenu(type) {
        ProjectClient.getTypeWithReports(type).then((projectsWithReports) => {
            contentWithReports = projectsWithReports.filter(content => content.exists);
        });
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
    let rejectingId = 0;
    let rejectingName = "";
    let rejectingTextboxArea;
    function rejectProject(id) {
        id ??= Number(projectIdSelection.value);
        if (isNaN(id)) return;
        if (!confirm(`Reject "${rejectingName}"?`)) return;
        if (rejectingTextboxArea.value.length <= 3) {
            return alert("The action was cancelled.");
        }
        ProjectClient.rejectProject(id, rejectingTextboxArea.value).then(() => {
            rejectionPageOpen = false;
            // uhhhhhhh apparently we need to do this ig?
            const newProjects = projects.filter((proj) => proj.id !== id);
            projects = [];
            projects = newProjects;
            // dont need to do this i think
            // refreshProjectMenu();
        });
    }
    let selectedProjectName = "";
    let lastSelectedProjectId = 0;
    function selectProject(id, name) {
        projectIdSelection.value = id;
        lastSelectedProjectId = id;
        if (name) {
            selectedProjectName = name;
        }
    }
    // function featureProject(id, name) {
    //     const usure = confirm("Feature " + name + " ?");
    //     if (!usure) return;
    //     ProjectClient.featureProject(id).catch((err) => alert(err));
    // }

    onMount(() => {
        projectIdSelection.onchange = () => {
            const value = projectIdSelection.value;
            if (value !== lastSelectedProjectId) {
                selectedProjectName = "";
            }
        };
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
                                        "(Core Extension)";
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

    const messageReplyInfo = {
        username: "",
        id: "",
        text: "",
    };
    const replyToMessage = () => {
        if (!messageReplyInfo.username) return alert("No user specified.");
        if (!messageReplyInfo.id) return alert("Message ID is not specified.");
        if (!messageReplyInfo.text)
            return alert("No message text was specified.");
        if (
            !confirm(
                `Reply to ${messageReplyInfo.username}'s message with "${messageReplyInfo.text}"?`
            )
        )
            return;
        ProjectClient.respondToDispute(
            messageReplyInfo.username,
            messageReplyInfo.id,
            messageReplyInfo.text
        ).then(() => {
            alert("Sent!");
            messageReplyInfo.username = "";
            messageReplyInfo.id = "";
            messageReplyInfo.text = "";
        });
    };

    let rejectedProjectId = 0;
    const downloadRejectedProject = async () => {
        try {
            const projectFile = await ProjectClient.getRejectedProjectFile(
                rejectedProjectId
            );
            FileSaver.saveAs(
                new Blob([projectFile]),
                `Project_${rejectedProjectId}.pmp`
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
    const deleteRejectedProject = () => {
        if (
            !confirm(
                "Are you sure you want to PERMANENTLY delete this project?\nYou should only do this if the project contains some really bad stuff."
            )
        )
            return;
        ProjectClient.deleteRejectedProject(rejectedProjectId)
            .then(() => {
                alert("Deleted.");
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to delete project; ${err}`);
            });
    };

    const banOrUnbanData = {
        username: "",
        reason: "",
    };
    let admin = false;
    let approver = false;
    const banUser = () => {
        const promptMessage = prompt(
            `Are you sure you want to ban ${banOrUnbanData.username} for "${banOrUnbanData.reason}"? Type "ok" to confirm.`
        );
        if (promptMessage !== "ok") return;
        ProjectClient.banUser(banOrUnbanData.username, banOrUnbanData.reason)
            .then(() => {
                alert(`Banned ${banOrUnbanData.username}.`);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to ban user; ${err}`);
            });
    };
    const unbanUser = () => {
        const promptMessage = prompt(
            `Are you sure you want to unban ${banOrUnbanData.username}? Type "ok" to confirm.`
        );
        if (promptMessage !== "ok") return;
        ProjectClient.unbanUser(banOrUnbanData.username, banOrUnbanData.reason)
            .then(() => {
                alert(`Unbanned ${banOrUnbanData.username}.`);
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to unban user; ${err}`);
            });
    };

    let areBadgesLoadedForVisibility = false;
    let currentUserBadges = {};
    let userBadgesUsername = "";
    const loadUserBadges = async () => {
        areBadgesLoadedForVisibility = false;
        if (!userBadgesUsername) return;
        const realBadges = await ProjectApi.getUserBadges(userBadgesUsername);
        currentUserBadges = {};
        for (const badgeName in ProfileBadges) {
            currentUserBadges[badgeName] = false;
        }
        for (const badgeName of realBadges) {
            currentUserBadges[badgeName] = true;
        }
        console.log(currentUserBadges);
        areBadgesLoadedForVisibility = true;
    };
    const applyUserBadges = () => {
        if (!confirm("Apply badges to this user?")) return;
        const newBadges = [];
        for (const badgeName in currentUserBadges) {
            if (currentUserBadges[badgeName] === true) {
                newBadges.push(badgeName);
            }
        }
        ProjectClient.setUserBadges(userBadgesUsername, newBadges)
            .then(() => {
                alert("Badges are set!");
            })
            .catch((err) => {
                alert(`An error occurred: ${err}`);
            });
    };
    const setUsersPerms = () => {
        const verbAdmin = admin
            ? `grant ${banOrUnbanData.username} admin?`
            : `revoke ${banOrUnbanData.username}'s admin?`;
        const verbApprover = approver
            ? `grant ${banOrUnbanData.username} modderator?`
            : `revoke ${banOrUnbanData.username}'s modderation possition?`;
        const promptMessage = prompt(
            `Are you sure you want to ${verbAdmin} & ${verbApprover} Type "ok" to confirm.`
        );
        if (promptMessage !== "ok") return;
        ProjectClient.assingUsersPermisions(
            banOrUnbanData.username,
            admin,
            approver
        )
            .then(() => {
                // i don wana make it re-say the whole grant-revoke thingy
                alert(
                    `Successfully did what ever you said to do ${banOrUnbanData.username}.`
                );
            })
            .catch((err) => {
                console.error(err);
                alert(`Failed to moddify users permissions; ${err}`);
            });
    };
</script>

<head>
    <title>PenguinMod - Admin Panel</title>
</head>

<NavigationBar />

{#if !loggedIn}
    <NavigationMargin />
    <LoadingSpinner enableTips={true} />
{/if}

<div class="main" style={loggedIn ? "" : "display:none"}>
    <NavigationMargin />

    {#if rejectionPageOpen}
        <div class="front-card-page" style="z-index: 20000;">
            <div class="card-page big-card-page">
                <div class="card-header">
                    <h1>Reject Project</h1>
                </div>
                <div class="card-reject" style="display:block">
                    <p>Rejecting <b>{rejectingName}</b></p>
                    <!-- svelte-ignore a11y-autofocus -->
                    <input
                        bind:this={rejectingTextboxArea}
                        placeholder="Reason for rejecting..."
                        style="width: 95%;"
                        autofocus
                    />
                    <br />
                    <br />
                    <h2><b>Quick-Reject</b></h2>
                    <details>
                        <summary>Spam</summary>
                        <div style="margin-left: 16px">
                            <div class="button-row">
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Spam"][
                                            "No content / Default project"
                                        ])}
                                >
                                    No content / Default project
                                </Button>
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Spam"]["Repost"])}
                                >
                                    Repost
                                </Button>
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Spam"][
                                            "Repost after Rejection"
                                        ])}
                                >
                                    Repost after Rejection
                                </Button>
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Spam"][
                                            "Remix is an exact copy"
                                        ])}
                                >
                                    Remix is an exact copy
                                </Button>
                            </div>
                        </div>
                    </details>
                    <details>
                        <summary>Be respectful to others</summary>
                        <div style="margin-left: 16px">
                            <details>
                                <summary>Offensive / Extreme Content</summary>
                                <div style="margin-left: 16px">
                                    <div class="button-row">
                                        <Button
                                            color="gray"
                                            on:click={(rejectingTextboxArea.value =
                                                QuickReject[
                                                    "Be respectful to others"
                                                ][
                                                    "Offensive / Extreme Content"
                                                ]["Gore"])}
                                        >
                                            Gore
                                        </Button>
                                        <Button
                                            color="gray"
                                            on:click={(rejectingTextboxArea.value =
                                                QuickReject[
                                                    "Be respectful to others"
                                                ][
                                                    "Offensive / Extreme Content"
                                                ]["Drugs / Illegal material"])}
                                        >
                                            Drugs / Illegal material
                                        </Button>
                                        <Button
                                            color="gray"
                                            on:click={(rejectingTextboxArea.value =
                                                QuickReject[
                                                    "Be respectful to others"
                                                ][
                                                    "Offensive / Extreme Content"
                                                ][
                                                    "Pornography / Disturbing / Sexual or explicit content"
                                                ])}
                                        >
                                            Pornography / Disturbing / Sexual or
                                            explicit content
                                        </Button>
                                        <Button
                                            color="gray"
                                            on:click={(rejectingTextboxArea.value =
                                                QuickReject[
                                                    "Be respectful to others"
                                                ][
                                                    "Offensive / Extreme Content"
                                                ][
                                                    "Pornography: Inflation / Vore / Fetish content"
                                                ])}
                                        >
                                            Pornography: Inflation / Vore /
                                            Fetish content
                                        </Button>
                                        <Button
                                            color="gray"
                                            on:click={(rejectingTextboxArea.value =
                                                QuickReject[
                                                    "Be respectful to others"
                                                ][
                                                    "Offensive / Extreme Content"
                                                ]["Discriminatory Content"])}
                                        >
                                            Discriminatory Content
                                        </Button>
                                        <Button
                                            color="gray"
                                            on:click={(rejectingTextboxArea.value =
                                                QuickReject[
                                                    "Be respectful to others"
                                                ][
                                                    "Offensive / Extreme Content"
                                                ]["Threat"])}
                                        >
                                            Threat
                                        </Button>
                                        <Button
                                            color="gray"
                                            on:click={(rejectingTextboxArea.value =
                                                QuickReject[
                                                    "Be respectful to others"
                                                ][
                                                    "Offensive / Extreme Content"
                                                ]["Malware"])}
                                        >
                                            Malware
                                        </Button>
                                    </div>
                                </div>
                            </details>
                        </div>
                        <div style="margin-left: 16px">
                            <div class="button-row">
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Be respectful to others"][
                                            "Misuse of an external platform"
                                        ])}
                                >
                                    Misuse of an external platform
                                </Button>
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Be respectful to others"][
                                            "References unsafe external platform"
                                        ])}
                                >
                                    References unsafe external platform
                                </Button>
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Be respectful to others"][
                                            "Slurs"
                                        ])}
                                >
                                    Slurs
                                </Button>
                                <Button
                                    color="gray"
                                    on:click={(rejectingTextboxArea.value =
                                        QuickReject["Be respectful to others"][
                                            "Creates Staff Distrust"
                                        ])}
                                >
                                    Creates Staff Distrust
                                </Button>
                            </div>
                        </div>
                    </details>
                    <div class="button-row">
                        <Button
                            color="gray"
                            on:click={(rejectingTextboxArea.value =
                                QuickReject["Scratch Reupload"])}
                        >
                            Scratch Reupload
                        </Button>
                        <Button
                            color="gray"
                            on:click={(rejectingTextboxArea.value =
                                QuickReject[
                                    "Breaks or disables aspects of the site"
                                ])}
                        >
                            Breaks or disables aspects of the site
                        </Button>
                        <Button
                            color="gray"
                            on:click={(rejectingTextboxArea.value =
                                QuickReject["Sensitive Information"])}
                        >
                            Sensitive Information
                        </Button>
                        <Button
                            color="gray"
                            on:click={(rejectingTextboxArea.value =
                                QuickReject[
                                    "Attempts to sell an untrusted product"
                                ])}
                        >
                            Attempts to sell an untrusted product
                        </Button>
                        <Button
                            color="gray"
                            on:click={(rejectingTextboxArea.value =
                                QuickReject["Contains loud sounds"])}
                        >
                            Contains loud sounds
                        </Button>
                        <Button
                            color="gray"
                            on:click={(rejectingTextboxArea.value =
                                QuickReject["Piracy"])}
                        >
                            Piracy
                        </Button>
                    </div>
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
            <div class="card">
                <h2 style="margin-block-start:0">Projects</h2>
                <p>
                    Project ID:
                    <input
                        type="number"
                        bind:this={projectIdSelection}
                        value="0"
                    />
                </p>
                {#if selectedProjectName}
                    <a
                        target="_blank"
                        href={`https://studio.penguinmod.com/#${lastSelectedProjectId}`}
                        style="color: dodgerblue"
                    >
                        <p>
                            Selected <b>{selectedProjectName}</b>
                        </p>
                        <img
                            src={`${ProjectApi.OriginApiUrl}/api/pmWrapper/iconUrl?id=${lastSelectedProjectId}`}
                            alt="Project Thumbnail"
                        />
                    </a>
                {/if}
                <h3>Tools</h3>
                <div style="display: flex; flex-direction: row;">
                    <Button
                        label="Inspect Extensions"
                        on:click={openInspectMenu}
                    />
                </div>
                <!-- <div style="height:24px" />
                <label>
                    <input type="checkbox" bind:checked={sendWebhook} />
                    Send Approved Projects to Discord
                </label> -->
                <div style="height:24px" />
                <Button
                    label="Remove Project"
                    color="red"
                    on:click={() => {
                        const id = Number(projectIdSelection.value);
                        if (isNaN(id)) return;
                        rejectingId = id;
                        rejectingName = selectedProjectName;
                        rejectionPageOpen = true;
                    }}
                />
                <div style="height:24px" />
                <h3>Removed Projects</h3>
                <p>
                    Target Removed Project:
                    <input type="number" bind:value={rejectedProjectId} />
                </p>
                <div
                    style="display: flex; flex-direction: row; align-items: center;"
                >
                    <Button on:click={downloadRejectedProject}>Download</Button>
                    <Button color="remix" on:click={restoreRejectedProject}>
                        Restore
                    </Button>
                    <div style="margin-right:24px" />
                    <Button color="red" on:click={deleteRejectedProject}>
                        Delete
                    </Button>
                </div>
            </div>

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
                <h2 style="margin-block-start:0">Messages</h2>
                <p>Respond to a project dispute/reply here.</p>
                <p>Type username:</p>
                <input
                    type="text"
                    size="50"
                    placeholder="Scratch username..."
                    bind:value={messageReplyInfo.username}
                />
                <p>Type message ID:</p>
                <input
                    type="text"
                    size="50"
                    placeholder="Message ID..."
                    bind:value={messageReplyInfo.id}
                />
                <p>Type reply:</p>
                <input
                    type="text"
                    size="50"
                    placeholder="Reply..."
                    bind:value={messageReplyInfo.text}
                />
                <br />
                <br />
                <div class="user-action-row">
                    <Button color="green" on:click={replyToMessage}>
                        Send
                    </Button>
                </div>
            </div>

            <br />

            <div class="card">
                <h2 style="margin-block-start:0">Users</h2>
                <p>Type username:</p>
                <input
                    type="text"
                    size="50"
                    placeholder="Scratch username..."
                    bind:value={banOrUnbanData.username}
                />
                <br />
                <br />
                <input
                    type="text"
                    size="50"
                    placeholder="Action reason..."
                    bind:value={banOrUnbanData.reason}
                />
                <p>
                    Action reasons for user punishments must be translatable.
                    <br />
                    Punishment may occur if your action reasons continue to be informal.
                    <br />
                    <br />
                    Reasons for banning users MUST be professional.
                    <br />
                    Do NOT ban a user with something like "you know why" or "check
                    (url here) for info"
                </p>
                <br />
                <br />
                <label>
                    <input type="checkbox" bind:checked={admin} />
                    Grant User Admin Perms
                </label>
                <label>
                    <input type="checkbox" bind:checked={approver} />
                    Grant User Moderator Perms
                </label>
                <div class="user-action-row">
                    <Button on:click={unbanUser}>Unban User</Button>
                    <Button color="red" on:click={banUser}>Ban User</Button>
                    <Button on:click={setUsersPerms}>Assign User Perms</Button>
                </div>
            </div>

            <br />

            <div class="card">
                <h2 style="margin-block-start:0">Badges</h2>
                <p>Type username:</p>
                <input
                    type="text"
                    size="50"
                    placeholder="Scratch username..."
                    on:change={() => {
                        areBadgesLoadedForVisibility = false;
                    }}
                    bind:value={userBadgesUsername}
                />
                <div class="user-action-row">
                    <Button on:click={loadUserBadges}>Load Badges</Button>
                </div>
                <br />
                <br />
                {#if areBadgesLoadedForVisibility}
                    <p>Click a badge to toggle if it is given to a user</p>
                    <p>
                        Dark gray badges are not added to the user or will be
                        removed from the user
                    </p>
                    <br />
                    <div class="user-badges-list">
                        {#each Object.keys(ProfileBadges) as badgeName}
                            <button
                                class="user-badge-button"
                                on:click={() => {
                                    currentUserBadges[badgeName] =
                                        !currentUserBadges[badgeName];
                                }}
                                data-active={currentUserBadges[badgeName]}
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
                <br />
                <div style="width:100%;height:32px;" />
                <br />
                <div class="user-action-row">
                    <Button color="remix" on:click={applyUserBadges}>
                        Apply Badges
                    </Button>
                </div>
            </div>

            <Button on:click={() => setGetProjects(false)} color="red"
                >Disable Getting Projects</Button
            >
            <Button on:click={() => setGetProjects(true)} color="remix"
                >Enable Getting Projects</Button
            >

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

            <div class="list-projects">
                {#if dropdownSelectMenu?.value}
                    {#if contentWithReports.length > 0}
                        {#if dropdownSelectMenu.value === "user"}
                            <p class="selection-info">
                                Click on a user to expand details
                            </p>
                        {:else}
                            <p class="selection-info">
                                Click on a project to expand details
                            </p>
                        {/if}
                    {:else}
                        {#if dropdownSelectMenu.value === "user"}
                            <p class="selection-info">
                                No user reports currently!
                            </p>
                        {:else}
                            <p class="selection-info">
                                No project reports currently!
                            </p>
                        {/if}
                    {/if}
                    {#each contentWithReports as content, idx}
                        {#if dropdownSelectMenu.value === "user"}
                            <button
                                class="reports-user-button"
                                on:click={() => {
                                    loadReportDetails(content.username);
                                    if (selectedReportDetailed === idx) {
                                        selectedReportDetailed = -1;
                                        return;
                                    }
                                    selectedReportDetailed = idx;
                                }}
                            >
                                <img
                                    src={`https://trampoline.turbowarp.org/avatars/by-username/${content.username}`}
                                    alt={content.username}
                                />
                                <div class="reports-user-content">
                                    <p style="font-weight: bold;">
                                        {content.username}
                                    </p>
                                    <p>{content.reports} reports</p>
                                </div>
                            </button>
                            {#if selectedReportDetailed === idx}
                                <div class="reports-generic-details">
                                    {#if !reportDetails[content.username]}
                                        <LoadingSpinner />
                                    {:else}
                                        <h3>View reports by</h3>
                                        {#each reportDetails[content.username] as report}
                                            <details>
                                                <summary>
                                                    {report.reporter}
                                                </summary>
                                                <p>
                                                    {report.ids.length} reports
                                                </p>
                                                <Button
                                                    on:click={() =>
                                                        closeUserReports(
                                                            content.username,
                                                            report.reporter
                                                        )}
                                                    color="red"
                                                >
                                                    Close Reports
                                                </Button>
                                                <p style="white-space:pre-wrap">
                                                    {report.reason}
                                                </p>
                                            </details>
                                        {/each}
                                    {/if}
                                </div>
                            {/if}
                        {:else if content.exists}
                            <button
                                class="reports-user-button reports-project-button"
                                on:click={() => {
                                    loadReportDetails(content.id);
                                    if (selectedReportDetailed === idx) {
                                        selectedReportDetailed = -1;
                                        return;
                                    }
                                    selectedReportDetailed = idx;
                                }}
                            >
                                <img
                                    src={`https://projects.penguinmod.com/api/pmWrapper/iconUrl?id=${content.id}`}
                                    alt={content.name}
                                />
                                <div
                                    class="reports-user-content reports-project-content"
                                >
                                    <p style="font-weight: bold;">
                                        {content.name}
                                    </p>
                                    <p>
                                        by {content.author} | {content.reports} reports
                                    </p>
                                </div>
                            </button>
                            {#if selectedReportDetailed === idx}
                                <div class="reports-generic-details">
                                    <p>
                                        View project at
                                        <a
                                            href={`https://studio.penguinmod.com/#${content.id}`}
                                        >
                                            {`https://studio.penguinmod.com/#${content.id}`}
                                        </a>
                                        or
                                        <button
                                            on:click={() =>
                                                selectProject(
                                                    content.id,
                                                    content.name
                                                )}
                                        >
                                            Select Project
                                        </button>
                                    </p>
                                    {#if !reportDetails[content.id]}
                                        <LoadingSpinner />
                                    {:else}
                                        <h3>View reports by</h3>
                                        {#each reportDetails[content.id] as report}
                                            <details>
                                                <summary>
                                                    {report.reporter}
                                                </summary>
                                                <p>
                                                    {report.ids.length} reports
                                                </p>
                                                <Button
                                                    on:click={() =>
                                                        closeUserReports(
                                                            content.id,
                                                            report.reporter
                                                        )}
                                                    color="red"
                                                >
                                                    Close Reports
                                                </Button>
                                                <p style="white-space:pre-wrap">
                                                    {report.reason}
                                                </p>
                                            </details>
                                        {/each}
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
        width: 485px;
        flex-wrap: nowrap;
        overflow: auto;
        height: calc(100% - 5rem);
    }
    .user-action-row {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .button-row {
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
