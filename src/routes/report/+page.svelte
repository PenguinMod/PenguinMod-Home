<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    const ProjectClient = new ProjectApi();

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Button from "$lib/Button/Button.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";
    // Icons
    import PenguinConfusedSVG from "../../resources/icons/Penguin/confused.svelte";

    let loggedIn = null;
    let loggedInUser = "";

    const pageDetails = {
        loaded: false,
        type: "",
        id: 0,
        pickedReason: "",
        otherReason: "",
        userSexualContentReason: "",
        userAttackReason: "",
        userIllegalReason: "",
        
        projectMalwareReason: "",
        projectStoreInfoReason: "",
        projectSexualContentReason: "",
        projectIllegalReason: "",

        isCurrentlyReporting: false,
    };

    const reportReasons = {
        user: [
            {
                text: "The user posts sexual content or references it",
                key: "report.reason.user.sexual",
                pageDetail: "userSexualContentReason",
            },
            {
                text: "The user attacks other users",
                key: "report.reason.user.attacker",
                pageDetail: "userAttackReason",
            },
            {
                text: "The user posts illegal content",
                key: "report.reason.user.illegal",
                pageDetail: "userIllegalReason",
            },
        ],
        project: [
            {
                text: "The project contains sexual content or references",
                key: "report.reason.project.sexual",
                pageDetail: "projectSexualContentReason",
            },
            {
                text: "The project plays really loud or inappropriate sounds",
                key: "report.reason.project.audio",
            },
            {
                text: "The project contains illegal material or pirated content",
                key: "report.reason.project.illegal",
                pageDetail: "projectIllegalReason",
            },
            {
                text: "The project has viruses or dangerous files",
                key: "report.reason.project.virus",
                pageDetail: "projectMalwareReason",
            },
            {
                text: "The project shares or stores my personal information",
                key: "report.reason.project.personal",
                pageDetail: "projectStoreInfoReason",
            },
            {
                text: "The project removes my ability to stop or pause it",
                key: "report.reason.project.nocontrols",
            },
        ],
    };

    const handleReport = () => {
        // set loading & check if it is valid
        pageDetails.isCurrentlyReporting = true;
        if (!pageDetails.pickedReason) {
            pageDetails.isCurrentlyReporting = false;
            return;
        }
        // create report text
        const reportGroup = reportReasons[pageDetails.type];
        let reportText = "";
        if (pageDetails.pickedReason === "report.reason.other") {
            reportText = pageDetails.otherReason;
        } else {
            for (const reportMsg of reportGroup) {
                if (
                    reportMsg.pageDetail &&
                    pageDetails.pickedReason === reportMsg.key
                ) {
                    reportText = `${reportMsg.text}: ${
                        pageDetails[reportMsg.pageDetail]
                    }`;
                } else if (pageDetails.pickedReason === reportMsg.key) {
                    reportText = reportMsg.text;
                }
            }
        }
        if (!reportText) {
            alert("Please specify a reason to report this user.");
            pageDetails.isCurrentlyReporting = false;
            return;
        }
        ProjectClient.reportContent(
            pageDetails.type,
            pageDetails.id,
            reportText
        )
            .then(() => {
                alert("Sent report.");
                window.close();
                setTimeout(() => {
                    // ok the window was not a pop-up, just go back to main page idk
                    window.location.pathname = "/";
                }, 500);
            })
            .catch((err) => {
                console.error(err);
                alert(
                    `Something went wrong. Please try again later or make sure you filled everything out.\n${err}`
                );
            })
            .finally(() => {
                pageDetails.isCurrentlyReporting = false;
            });
    };

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    // login code below
    const loggedInChange = async () => {};
    const waitForLogin = () => {
        return new Promise((resolve, reject) => {
            if (loggedIn) return resolve();
            Authentication.authenticate().then((privateCode) => {
                loggedIn = null;
                loggedInUser = "";
                Authentication.usernameFromCode(privateCode)
                    .then(({ username }) => {
                        if (username) {
                            loggedIn = true;
                            loggedInUser = username;
                            loggedInChange();
                            resolve();
                            return;
                        }
                        loggedIn = false;
                        loggedInUser = "";
                        loggedInChange();
                        reject();
                    })
                    .catch(() => {
                        loggedIn = false;
                        loggedInUser = "";
                        loggedInChange();
                        reject();
                    });
            });
        });
    };

    onMount(async () => {
        const params = new URLSearchParams(location.search);
        const reportType = params.get("type");
        const reportId = params.get("id");
        pageDetails.type = reportType;
        pageDetails.id = reportId;

        pageDetails.loaded = true;

        /*
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(() => {
                loggedIn = true;
                loggedInChange(username, token);
            })
            .catch(() => {
                loggedIn = false;
            });
        */

        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            loggedInUser = "";
            loggedInChange();
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(() => {
                ProjectClient.setUsername(username);
                ProjectClient.setToken(token);
                loggedIn = true;
                loggedInUser = username;
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
                loggedInChange();
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        loggedInUser = "";
        loggedInChange();
    });
    Authentication.onAuthentication((username, privateCode) => {
        ProjectClient.setUsername(username);
        ProjectClient.setToken(privateCode);
        loggedIn = true;
        loggedInUser = username;
        loggedInChange();
    });
</script>

<svelte:head>
    <title>PenguinMod - Report</title>
    <meta name="title"                   content="PenguinMod - Report" />
    <meta property="og:title"            content="PenguinMod - Report" />
    <meta property="twitter:title"       content="PenguinMod - Report">
    <meta name="description"             content="Report a specific project or user on PenguinMod.">
    <meta property="twitter:description" content="Report a specific project or user on PenguinMod.">
    <meta property="og:url"              content="https://penguinmod.com/report">
    <meta property="twitter:url"         content="https://penguinmod.com/report">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    <div class="box">
        {#if loggedIn === null || !pageDetails.loaded}
            <LoadingSpinner />
        {:else if loggedIn !== true}
            <Button on:click={waitForLogin}>
                <LocalizedText
                    text="Sign In"
                    key="navigation.login"
                    lang={currentLang}
                />
            </Button>
        {:else if pageDetails.type !== "project" && pageDetails.type !== "user"}
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
        {:else}
            {#if pageDetails.type === "user"}
                <img
                    class="profile-picture"
                    src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${pageDetails.id}`}
                    alt={pageDetails.id}
                />
            {:else}
                <img
                    class="project-picture"
                    src={`${PUBLIC_API_URL}/api/v1/projects/getproject?projectID=${pageDetails.id}&requestType=thumbnail`}
                    alt={pageDetails.id}
                />
            {/if}
            <div class="report-card">
                <h3>
                    <LocalizedText
                        text="Report"
                        key="report.title"
                        lang={currentLang}
                    />
                </h3>
                <div class="report-reasons">
                    {#each reportReasons[pageDetails.type] as reason}
                        <label>
                            <input
                                type="radio"
                                name="report_reason"
                                value={reason.key}
                                bind:group={pageDetails.pickedReason}
                            />
                            <LocalizedText {...reason} lang={currentLang} />
                        </label>
                        {#if reason.pageDetail && pageDetails.pickedReason === reason.key}
                            <input
                                type="text"
                                class="custom-reason"
                                bind:value={pageDetails[reason.pageDetail]}
                                placeholder={String(TranslationHandler.text(
                                    "report.reason.clarify",
                                    currentLang
                                ) || TranslationHandler.text(
                                    "report.reason.clarify",
                                    'en'
                                ))}
                            />
                        {/if}
                    {/each}
                    <label>
                        <input
                            type="radio"
                            name="report_reason"
                            value="report.reason.other"
                            bind:group={pageDetails.pickedReason}
                        />
                        <LocalizedText
                            text="Other..."
                            key="report.reason.other"
                            lang={currentLang}
                        />
                    </label>
                    {#if pageDetails.pickedReason === "report.reason.other"}
                        <input
                            type="text"
                            class="custom-reason"
                            bind:value={pageDetails.otherReason}
                            placeholder={String(TranslationHandler.text(
                                "report.reason.other.reason",
                                currentLang
                            ) || TranslationHandler.text(
                                "report.reason.other.reason",
                                'en'
                            ))}
                        />
                    {/if}
                </div>
            </div>
            <div style="height:16px" />
            {#if pageDetails.isCurrentlyReporting}
                <LoadingSpinner />
            {:else if !pageDetails.pickedReason || (pageDetails.pickedReason === "report.reason.other" && !pageDetails.otherReason)}
                <Button color="gray">
                    <LocalizedText
                        text="Report"
                        key="report.title"
                        lang={currentLang}
                    />
                </Button>
            {:else}
                <Button color="red" on:click={handleReport}>
                    <LocalizedText
                        text="Report"
                        key="report.title"
                        lang={currentLang}
                    />
                </Button>
            {/if}
        {/if}
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
        min-width: 1000px;
    }
    .box {
        margin-top: 32px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .profile-picture {
        width: 64px;
        height: 64px;
        border-radius: 4px;
    }
    .project-picture {
        width: 240px;
        height: 180px;
        border-radius: 4px;
        border: rgba(0, 0, 0, 0.25) 1px solid;
    }
    :global(body.dark-mode) .project-picture {
        border: rgba(255, 255, 255, 0.4) 1px solid;
    }

    .report-card {
        border: rgba(0, 0, 0, 0.25) 1px solid;
        border-radius: 4px;
        padding: 8px 16px;
        margin-top: 8px;
    }
    :global(body.dark-mode) .report-card {
        border: rgba(255, 255, 255, 0.35) 1px solid;
    }
    .report-reasons {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    .report-reasons label {
        margin: 6px 0;
    }
    .custom-reason {
        width: 100%;
        background: transparent;
        border: rgba(0, 0, 0, 0.25) 1px solid;
    }
    :global(body.dark-mode) .custom-reason {
        border: rgba(255, 255, 255, 0.35) 1px solid;
        color: white;
    }
</style>
