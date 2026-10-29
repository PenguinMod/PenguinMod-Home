<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
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
    import pmp_protobuf from "pmp-protobuf";

    const ProjectClient = new ProjectApi();

    // Components
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import ClickableProject from "$lib/ClickableProject/Project.svelte";
    import ContentCategory from "$lib/ContentCategory/Component.svelte";
    import Project from "$lib/Project/Project.svelte";
    import Stats from "$lib/statsComponent/stats.svelte";
    import Button from "$lib/Button/Button.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    function unixToDisplayDate(unix) {
        return `${new Date(Number(unix)).toDateString()} at ${new Date(
            Number(unix),
        ).toLocaleTimeString()}`;
    }

    let censorCostume;
    let censorAudio;
    let tab = '';
    let admin = false;
    let loggedIn = null;
    /** @type {HTMLInputElement} */
    let fileSelector;
    let codeArea;
    /** @type {import('brace').Editor} */
    let editor;
    let ace;
    let linkedState = new URLSearchParams();
    function invalidate() {
        if (!browser) return;
        if (!tab) return;
        
        location.hash = `#${tab}`;
        if (linkedState.size > 0) location.hash += `&${linkedState.toString()}`;
    }

    function kickOut(loggedOut) {
        const error = loggedOut ? 401 : 403;
        location.href = location.origin + `/error?error=${error}`;
    }
    function Flatten(obj) {
        let stats = [];
        for (const name in obj) {
            if (typeof obj[name] === "object") {
                stats.push({ name: name, value: Flatten(obj[name]) });
                continue;
            }
            stats.push(`${name}: ${obj[name]}`)
        }
        return stats;
    }
    function onThemeChange(dark) {
        if (!editor) return;
        if (dark)
            editor.setTheme('ace/theme/twilight');
        else
            editor.setTheme('ace/theme/dawn');
    }
    async function onCodeAreaChanged(codeArea) {
        if (!globalThis.window) return;
        ace = await import('brace');
        await import('brace/mode/json');
        await import('brace/mode/javascript');
        await import('brace/theme/twilight');
        await import('brace/theme/dawn'); 
        if (editor) editor.destroy();
        queueMicrotask(() => {
            if (editor) editor.destroy();
            editor = ace.edit(codeArea);
            editor.setOptions({
                fontSize: "15px", showPrintMargin: false,
                highlightActiveLine: true, useWorker: false
            });
            editor.session.setMode('ace/mode/json');
            onThemeChange(String(localStorage.getItem('darkmode') || prefersDarkMode) === 'true');
            editor.setValue(profanityFilter);
            editor.addEventListener('change', () => profanityChanged = editor.getValue() !== profanityFilter);
            editor.setReadOnly(false);
        });
    }
    $: onCodeAreaChanged(codeArea);

    let currentLang = "en";
    Language.onChange((lang) => {
        currentLang = lang;
    });
    onMount(async () => {
        fetch('/censor/costume.svg').then(req => req.blob()).then(res => censorCostume = res);
        fetch('/censor/sound.mp3').then(req => req.blob()).then(res => censorAudio = res);

        Language.forceUpdate();
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }

        Authentication.usernameFromCode(username, token)
            .then(({ isAdmin, isApprover }) => {
                admin = isAdmin;
                if (!isAdmin && !isApprover) {
                    kickOut(false);
                    return;
                }
                ProjectClient.setUsername(username);
                ProjectClient.setToken(token);
                loggedIn = true;

                const firstAnd = Math.max(location.hash.indexOf('&'), 0) || null;
                linkedState = new URLSearchParams(location.hash.slice(firstAnd +1));
                tab = location.hash.slice(1, firstAnd) || 'projects';

                selectedUsername = linkedState.get('username');
                selectedProjectId = linkedState.get('project');
                if (linkedState.has('reject')) {
                    rejectionPageOpen = true;
                    selectedProjectId = linkedState.get('reject');
                }
            })
            .catch(() => {
                loggedIn = false;
                kickOut(true);
            });

        let lastDarkMode = null;
        const loop = () => {
            const darkmode = isEmbed ?
                linkedState.get('dark')
                : String(localStorage.getItem('darkmode') || prefersDarkMode) === 'true';
            if (darkmode === lastDarkMode) return;
            lastDarkMode = darkmode;
            onThemeChange(darkmode);
        }
        setInterval(loop, 100);
    });
    // we dont need to add an "onAuthenticate" event
    // because you cant sign in on the /panel page,
    // signing out or going on it while signed out
    // just kicks you out of the page
    Authentication.onLogout(() => {
        loggedIn = false;
        location.href = location.origin;
    });

    $: if (loggedIn) invalidate(tab);

    /* --- Projects category --- */
    let rejectionReason = '';
    let rejectionMode = 'soft';
    let rejectionPageOpen = false;
    let reloadProject = false;
    let projectReportsLoaded = false;
    let projectReports = [];
    let originalTitle = null;
    let projectTitle = '';
    let projectAuthor = '';
    let originalInstructions = null;
    let projectInstructions = '';
    let originalNotes = null;
    let projectNotes = '';
    let selectedProjectReport = null;
    let selectedProjectId = linkedState.get('project');
    let replacementThumbnail = null;
    let projectFeatured = false;
    let projectCanFeature = true;
    let projectRejected = false;
    let projectRejectionHard = false;
    let projectExists = false;
    let projectFileLoading = false;
    let progressLabel = '';
    let totalProgress = 0;
    let projectJson = null;
    let projectContentView = null;
    let unorderedStrings = '';
    function onSelectedProjectChanged(project) {
        replacementThumbnail = null;
        reloadProject = !reloadProject;
        projectContentView = null;
        projectJson = null;
        projectExists = false;
        ProjectApi.getProjectMeta(project)
            .then(project => {
                projectTitle = project.title;
                originalTitle = project.title;
                projectAuthor = project.author.username;
                projectInstructions = project.instructions;
                originalInstructions = project.instructions;
                projectNotes = project.notes;
                originalNotes = project.notes;
                projectFeatured = project.featured;
                projectCanFeature = !project.noFeature;
                projectRejected = project.softRejected || project.hardRejected;
                projectRejectionHard = project.hardRejected;
                projectExists = true;
            })
            .catch(() => projectRejected = projectRejectionHard = true);
    }
    async function getProject() {
        projectFileLoading = true;
        totalProgress = 0;
        progressLabel = 'Loading project JSON...';
        if (!projectJson) {
            const req = new XMLHttpRequest();
            req.responseType = 'arraybuffer';
            req.onprogress = e => totalProgress = Math.min(e.loaded / e.total, 1);
            req.open('GET', `${PUBLIC_API_URL}/api/v1/projects/getProject?requestType=protobuf&projectID=${selectedProjectId}`);
            req.send();
            await new Promise((resolve, reject) => { req.onloadend = resolve; req.onerror = reject; });
            projectJson = pmp_protobuf.protobufToJson(new Uint8Array(req.response));
        }
        projectFileLoading = false;
    }
    $: onSelectedProjectChanged(selectedProjectId);
    $: invalidate(linkedState.set('project', selectedProjectId));

    /* --- Messages Category --- */
    let messageTarget = '';
    let messageToUser = true;
    let messageContent = '';
    let messageRepliable = true;
    let broadcastTOSChange = false;
    let broadcastPolicyChange = false;
    let broadcastGuidelinesChange = false;

    /* --- Users category --- */
    let userReportsLoaded = false;
    let userReports = [];
    let selectedUserReport = null;
    let selectedUsername = linkedState.get('username');
    let changingUsername = false;
    let changingUsernameProcessing = false;
    let newChangedUsername;
    let newChangedUsernameError = null;
    let reloadPFP = false;
    let adminsList = [];
    let modsList = [];
    let banReason = '';
    let banUserOpen = false;
    let userBanned = false;
    let userIPBanned = false;
    let userWatchlisted = false;
    let profileBadges = [];
    let addBadgesSelectorOpen = false;
    let selectedAddingBadges = [];
    let bioContent = '';
    let featuredProjectId = null;
    let featuredProjectTitle = null;
    let profileProjects = [];
    let bioChanged = false;
    let sourceBio = '';
    function onSelectedUserChange(username) {
        if (!loggedIn) return;

        profileBadges = [];
        ProjectApi.getProfile(username)
            .then(profile => {
                profileBadges = profile.badges;
                bioContent = profile.bio;
                sourceBio = profile.bio;
                featuredProjectId = profile.myFeaturedProject;
                featuredProjectTitle = null;
                ProjectApi.getProjectMeta(featuredProjectId)
                    .then(project => featuredProjectTitle = project.title)
                    .catch(() => {});
                ProjectApi.getUserProjects(username, 0)
                    .then(projects => profileProjects = projects)
                    .catch(() => {});
            })
            .catch(err => {
                if (err === '{"error":"NotFound"}') return;
                console.error(err);
                alert(err);
            })
    }
    $: onSelectedUserChange(selectedUsername);
    $: invalidate(linkedState.set('username', selectedUsername));

    /* --- Admin category --- */
    let connections = '';
    let connectionCheck = '';
    let isCheckIP = false;

    /* --- Misc category --- */
    let serverStats = [];
    let canUploadProjects = true;
    let canViewProjects = true;
    let canSignUp = true;
    let profanityLoaded = false;
    let profanityFilter = '';
    let profanityChanged = false;

    /* --- Preloaders --- */
    function onTabChange(tab) {
        switch (tab) {
        case 'projects':
            projectReportsLoaded = false;
            selectedProjectReport = null;
            ProjectClient.getTypeWithReports('project', 0)
                .then(reports => {
                    projectReportsLoaded = true;
                    projectReports = reports;
                })
                .catch(err => console.error(err));
            break;
        case 'messages':
            if (messageToUser) messageTarget = selectedUsername;
            break;
        case 'users':
            addBadgesSelectorOpen = false;
            userReportsLoaded = false;
            selectedUserReport = null;
            ProjectClient.getTypeWithReports('user', 0)
                .then(reports => {
                    userReportsLoaded = true;
                    userReports = reports;
                })
                .catch(err => console.error(err));
            ProjectClient.getAllPermitedUsers()
                .then(lists => {
                    adminsList = lists.admins.map(permit => permit.username);
                    modsList = lists.mods.map(permit => permit.username);
                })
                .catch(err => console.error(err));
            break;
        case 'misc': 
            // steal the selected username 
            connectionCheck = selectedUsername;
            ProjectApi.getServerInfo()
                .then(stats => serverStats = Flatten(stats))
                .catch(err => console.error(err));
            
            ProjectApi.canUploadProjects()
                .then(can => canUploadProjects = can);
            ProjectApi.canViewProjects()
                .then(can => canViewProjects = can);
            
            if (profanityLoaded) {
                ProjectClient.getProfanityFilter()
                    .then(json => editor.setValue(profanityFilter = JSON.stringify(json, null, 4)))
                    .catch(err => {
                        console.error(err);
                        alert(err);
                    });
            }
            break;
        }
    }
    $: onTabChange(tab);
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
                <p>Rejecting <b>{projectTitle}</b></p>
                <img
                    src={`${LINK.projects}api/v1/projects/getproject?projectID=${selectedProjectId}&requestType=thumbnail`}
                    alt="Image of {projectTitle}"
                    width="240"
                    height="180"
                />
                <!-- svelte-ignore a11y-autofocus -->
                <textarea
                    bind:value={rejectionReason}
                    placeholder="Reason for rejecting..."
                    style="width: 100%;"
                    autofocus
                />

                <br>
                <input type="radio" bind:group={rejectionMode} value="soft" id="soft-reject" name="reject-type"/>
                <label for="soft-reject">Soft reject</label>
                <input type="radio" bind:group={rejectionMode} value="hard" id="hard-reject" name="reject-type"/>
                <label for="hard-reject" style="color:red">Hard reject</label>
                <input type="radio" bind:group={rejectionMode} value="delete" id="delete-project" name="reject-type"/>
                <label for="delete-project" style="color:red">Delete project</label>
                <h2><b>Quick-Reject</b></h2>
                <QuickRejectComponent
                    on:select={arg => rejectionReason = arg.detail}
                />
            </div>
            <div style="display:flex;flex-direction:row;padding:1em">
                <Button
                    label="Reject"
                    color="red"
                    on:click={() => {
                        let promise;
                        switch (rejectionMode) {
                        case 'delete': promise = ProjectClient.deleteProject(selectedProjectId, rejectionReason); break;
                        case 'hard': promise = ProjectClient.hardRejectProject(selectedProjectId, rejectionReason); break;
                        case 'soft': promise = ProjectClient.rejectProject(selectedProjectId, rejectionReason); break;
                        }
                        promise
                            .then(() => {
                                rejectionPageOpen = false;
                                onSelectedProjectChanged(selectedProjectId);
                            })
                            .catch(err => {
                                console.error(err);
                                alert(err);
                            });
                    }}
                />
                <Button
                    label="Cancel"
                    on:click={() => rejectionPageOpen = false}
                />
            </div>
        </div>
    </div>

    <input type="file" hidden bind:this={fileSelector}>

    <div class="section-category-toggles">
        <div class="category-toggle-section">
            <button active={tab === 'projects'} on:click={() => tab = 'projects'}>Projects</button>
            <button active={tab === 'messages'} on:click={() => tab = 'messages'}>Messages</button>
            <button active={tab === 'users'} on:click={() => tab = 'users'}>Users</button>
            <button active={tab === 'misc'} on:click={() => tab = 'misc'}>Misc</button>
        </div>
    </div>
    {#if tab === 'projects'}
        <div class="projects-control">
            <div class="card-chunk" style="grid-column: 1;">
                {#if projectReportsLoaded}
                    {#each projectReports as content, idx}
                        <button
                            class="reports-user-button reports-project-button"
                            on:click={() => {
                                if (selectedProjectReport === idx) return selectedProjectReport = null;
                                selectedProjectId = content.targetID;
                                selectedProjectReport = idx;
                                selectedUsername = content.author;
                                if (content.details) return;
                                ProjectClient.getReports('project', content.targetID)
                                    .then(details => content.details = details)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    });
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
                        {#if selectedProjectReport === idx}
                            <div class="reports-generic-details">
                                {#if !content.details}
                                    <LoadingSpinner />
                                {:else}
                                    <Button
                                        on:click={() => ProjectClient.closeReport(content.id)
                                            .then(() => projectReports.splice(selectedProjectReport, 1))
                                            .catch(err => {
                                                console.error(err);
                                                alert(err);
                                            })}
                                        color="red"
                                        label="Close reports"
                                        small
                                    />
                                    {#each content.details as report}
                                        <details open={report.reporter === content.reporter}>
                                            <summary>
                                                {report.reporter}
                                                <Button
                                                    on:click={() => {
                                                        tab = 'users';
                                                        selectedUsername = report.reporter;
                                                    }}
                                                    label="Select user"
                                                    small
                                                />
                                            </summary>
                                            <p style="white-space:pre-wrap">
                                                {report.report}
                                                <Button
                                                    on:click={() => ProjectClient.closeReport(report.id)
                                                        .then(() => projectReports.splice(selectedProjectReport, 1))
                                                        .catch(err => {
                                                            console.error(err);
                                                            alert(err);
                                                        })}
                                                    color="red"
                                                    label="Close report"
                                                    small
                                                />
                                            </p>
                                        </details>
                                    {/each}
                                {/if}
                            </div>
                        {/if}
                    {/each}
                {:else}
                    <LoadingSpinner></LoadingSpinner>
                {/if }
            </div>
            <div class="card-chunk" style="grid-column: 2;">
                <input
                    class="user-selector"
                    type="text"
                    placeholder="Project ID"
                    bind:value={selectedProjectId}
                >
                {#if projectRejected}
                    <div class="rejection-message">
                        {#if !projectRejectionHard}
                            <img src="/account/status_warn.svg" alt="Project Soft Rejected">
                            <span>Project is currently soft rejected.</span>
                            <Button
                                color="red" small
                                on:click={() => ProjectClient.restoreRejectedProject(selectedProjectId)
                                    .then(() => projectRejected = false)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                                label="Unreject"
                            />
                        {:else}
                            <img src="/account/status_banned.svg" alt="Project Hard Rejected">
                            <span>Project cant be found. Maybe its hard rejected?</span>
                            <Button
                                small
                                label="Download project"
                                on:click={() => ProjectClient.downloadHardRejectedProject(selectedProjectId)
                                    .then(data => FileSaver.saveAs(new Blob([data]), `Project_${selectedProjectId}.pmp`))
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                            />
                        {/if}
                    </div>
                {/if}
                {#if projectExists}
                    <div class="yet-another-selected-project-wrapper" project-rejected={projectRejected}>
                        <div class="selected-project">
                            <div class="project-header">
                                <img
                                    src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${projectAuthor}`}
                                    alt={projectAuthor}
                                />
                                <div class="project-header-text">
                                    <input class="project-title-editable" type="text" bind:value={projectTitle}>
                                    <button class="href-button" on:click={() => { tab = 'users'; selectedUsername = projectAuthor; }}>{projectAuthor}</button>
                                </div>
                            </div>
                            <button
                                class="profile-section-image project-thumbnail"
                                on:click={() => {
                                    fileSelector.type = "file";
                                    fileSelector.accept = "image/*";
                                    fileSelector.click();

                                    const onceSelected = async () => {
                                        fileSelector.removeEventListener('change', onceSelected);
                                        replacementThumbnail = fileSelector.files[0];
                                    }
                                    fileSelector.addEventListener('change', onceSelected);
                                }}
                            >
                                <img
                                    src={replacementThumbnail
                                        ? URL.createObjectURL(replacementThumbnail)
                                        : `${PUBLIC_API_URL}/api/v1/projects/getproject?projectID=${selectedProjectId}&requestType=thumbnail`}
                                    alt={projectTitle}
                                />
                                <div class="profile-section-image-edit">
                                    <img src="/pencil.png" alt="Change Thumbnail" />
                                </div>
                            </button>
                        </div>
                        <div class="project-texts">
                            <Button
                                color={(originalTitle !== projectTitle || originalInstructions !== projectInstructions || originalNotes !== projectNotes || replacementThumbnail) || 'gray'}
                                on:click={() => ProjectClient.updateProject(selectedProjectId, {
                                    image: replacementThumbnail,
                                    newMeta: {
                                        title: projectTitle,
                                        instructions: projectInstructions,
                                        notes: projectNotes
                                    }
                                })
                                    .then(() => onSelectedProjectChanged(selectedProjectId))
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                                small
                                label="Save changes"
                            />
                            <div class="project-text-field">
                                <h3>Instructions</h3>
                                <textarea bind:value={projectInstructions}/>
                            </div>
                            <div class="project-text-field">
                                <h3>Notes & Credits</h3>
                                <textarea bind:value={projectNotes}/>
                            </div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 2px; margin-top: 2px;">
                        <Button
                            small
                            color="red"
                            label="Remove thumbnail"
                            on:click={() => ProjectClient.removeProjectThumbnail(selectedProjectId, false)
                                .then(() => selectedProjectId = selectedProjectId)
                                .catch(err => {
                                    console.error(err);
                                    alert(err);
                                })}
                        />
                        <Button
                            small
                            color="red"
                            label="Remove project"
                            on:click={() => rejectionPageOpen = true}
                        />
                        <Button
                            small
                            label="Goto project page"
                            noredirect
                            link="{PUBLIC_STUDIO_URL}/#{selectedProjectId}"
                        />
                        {#if projectFeatured}
                            <Button
                                small
                                color="red"
                                label="Unfeature"
                                on:click={() => ProjectClient.featureProject(selectedProjectId, false)
                                    .then(() => projectFeatured = false)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                            />
                        {:else}
                            <Button
                                small
                                color="orange"
                                label="Feature"
                                on:click={() => ProjectClient.featureProject(selectedProjectId, true)
                                    .then(() => projectFeatured = true)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                            />
                        {/if}
                        {#if projectCanFeature}
                            <Button
                                small
                                color="red"
                                label="Block featuring"
                                on:click={() => ProjectClient.setCanBeFeatured(selectedProjectId, false)
                                    .then(() => projectCanFeature = false)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                            />
                        {:else}
                            <Button
                                small
                                color="remix"
                                label="Allow featuring"
                                on:click={() => ProjectClient.setCanBeFeatured(selectedProjectId, true)
                                    .then(() => projectCanFeature = true)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                            />
                        {/if}
                    </div>
                    <div style="display:grid;grid-template-columns: 1fr 1fr 1fr; gap: 2px; margin-top: 2px;">
                        <Button
                            small
                            label="Inspect extensions"
                            on:click={() => getProject(false)
                                .then(() => projectContentView = 'extensions')
                                .catch(err => {
                                    console.error(err);
                                    alert(err);
                                })}
                        />
                        <Button
                            small
                            label="Inspect strings/comments"
                            on:click={() => getProject(false)
                                .then(() => {
                                    unorderedStrings = '';
                                    for (const sprite of projectJson.targets) {
                                        unorderedStrings += sprite.name + '\n';
                                        for (const scalar of Object.values(sprite.variables))
                                            unorderedStrings += scalar[0] + ': ' + scalar[1] + '\n';
                                        for (const list of Object.values(sprite.lists))
                                            unorderedStrings += list[0] + ':\n' + list[1].join('\n') + '\n';
                                        for (const broadcast of Object.values(sprite.broadcasts))
                                            unorderedStrings += broadcast + '\n';
                                        for (const customVar of sprite.customVars)
                                            unorderedStrings += customVar.name + '\n';
                                        for (const block of Object.values(sprite.blocks)) {
                                            if (!block.fields?.TEXT) continue;
                                            unorderedStrings += block.fields.TEXT.value + '\n';
                                        }
                                        for (const comment of Object.values(sprite.comments))
                                            unorderedStrings += comment.text + '\n';
                                        for (const costume of sprite.costumes)
                                            unorderedStrings += costume.name + '\n';
                                        for (const sound of sprite.sounds)
                                            unorderedStrings += sound.name + '\n';
                                    }
                                    projectContentView = 'strings'
                                })
                                .catch(err => {
                                    console.error(err);
                                    alert(err);
                                })}
                        />
                        <Button
                            small
                            label="Inspect assets"
                            on:click={() => getProject(true)
                                .then(async () => {
                                    const promises = [];
                                    let i = 0;
                                    const assets = projectJson.targets.reduce((c,v) => c + v.costumes.length + v.sounds.length, 0);
                                    projectFileLoading = true;
                                    progressLabel = `Loading ${assets} assets`;
                                    totalProgress = 0;
                                    for (const sprite of projectJson.targets) {
                                        for (const costume of sprite.costumes) {
                                            costume.link = `https://asset-cdn.penguinmod.com/file/penguinmod-warm-tier-s2-cf/${selectedProjectId}_${costume.md5ext}`;
                                            promises.push(fetch(costume.link)
                                                .then(req => req.arrayBuffer())
                                                .then(res => new Blob([res], { type: 'image/svg+xml' }))
                                                .then(blob => {
                                                    costume.link = URL.createObjectURL(blob);
                                                    totalProgress = ++i / assets;
                                                }));
                                        }
                                        for (const sound of sprite.sounds)
                                            sound.paused = true;
                                    }
                                    await Promise.all(promises);
                                    projectContentView = 'assets';
                                    projectFileLoading = false;
                                })
                                .catch(err => {
                                    console.error(err);
                                    alert(err);
                                })}
                        />
                    </div>
                    {#if projectFileLoading}
                        <div class="file-loading-status">
                            <span>{progressLabel}</span>
                            <progress min="0.000" max="1.000" value={totalProgress}></progress>
                        </div>
                    {/if}
                    {#if projectContentView === 'extensions'}
                        <div class="extensions-view">
                            <select class="user-selector" on:change={e => fetch(e.target.value)
                                .then(req => req.text())
                                .then(res => {
                                    editor.setValue(res);
                                    editor.setReadOnly(true);
                                    editor.session.setMode('ace/mode/javascript');
                                })
                                .catch(err => {
                                    console.error(err);
                                    alert(err);
                                })}
                            >
                                <option value="">(Making a selection will load the url)</option>
                                {#each Object.entries(projectJson.extensionURLs) as [extId, url]}
                                    <option value={url}>{extId} <em>({url})</em></option>
                                {/each}
                            </select>
                            <div bind:this={codeArea}></div>
                        </div>
                    {:else if projectContentView === 'strings'}
                        <code class="strings-listout">
                            {unorderedStrings}
                        </code>
                    {:else if projectContentView === 'assets'}
                        <Button
                            label="Apply censoring"
                            on:click={async () => {
                                try {
                                    const zip = new JSZip();
                                    const promises = [];
                                    for (const sprite of projectJson.targets) {
                                        for (const costume of sprite.costumes) {
                                            if (!costume.replace) {
                                                promises.push(fetch(`https://asset-cdn.penguinmod.com/file/penguinmod-warm-tier-s2-cf/${selectedProjectId}_${costume.md5ext}`)
                                                    .then(req => req.blob())
                                                    .then(res => zip.file(costume.md5ext, res)));
                                                continue;
                                            }
                                            costume.rotationCenterX = 32;
                                            costume.rotationCenterY = 32;
                                            costume.bitmapResolution = 1;
                                            costume.dataFormat = "svg";
                                            costume.md5ext = `${costume.assetId}.svg`;
                                            zip.file(costume.md5ext, censorCostume);
                                        }
                                        for (const sound of sprite.sounds) {
                                            if (!sound.replace) {
                                                promises.push(fetch(`https://asset-cdn.penguinmod.com/file/penguinmod-warm-tier-s2-cf/${selectedProjectId}_${sound.md5ext}`)
                                                    .then(req => req.blob())
                                                    .then(res => zip.file(sound.md5ext, res)));
                                                continue;
                                            }
                                            sound.dataFormat = "mp3";
                                            sound.format = "mp3";
                                            sound.md5ext = `${sound.assetId}.mp3`;
                                            zip.file(sound.md5ext, censorAudio);
                                        }
                                    }
                                    await Promise.all(promises);
                                    zip.file('project.json', JSON.stringify(projectJson));

                                    await ProjectClient.updateProject(selectedProjectId, {
                                        project: await zip.generateAsync({ type: 'blob' }),
                                        newMeta: {
                                            title: projectTitle,
                                            instructions: projectInstructions,
                                            notes: projectNotes
                                        }
                                    });
                                    projectContentView = null;
                                } catch (err) {
                                    console.error(err);
                                    alert(err);
                                }
                            }}
                        />
                        {#each projectJson.targets as sprite}
                            <details open>
                                <summary>{sprite.name}</summary>
                                {#each sprite.costumes as costume}
                                    <button class="project-costume-asset" on:click={() => costume.replace = !costume.replace}>
                                        <img
                                            src={costume.link}
                                            alt={costume.name}
                                        >
                                        <div>
                                            <input type="checkbox" bind:checked={costume.replace} name="costume-select">
                                            <label for="costume-select">{costume.name}</label>
                                        </div>
                                    </button>
                                {/each}
                                <br>
                                {#each sprite.sounds as sound}
                                    <button class="project-sound-asset" on:click={() => sound.replace = !sound.replace}>
                                        {#if sound.paused}
                                            <button on:click={e => { e.stopPropagation(); sound.audio.play(); }}>
                                                <img
                                                    src="/stage_controls/gradient/play.svg"
                                                    alt="Play"
                                                >
                                            </button>
                                        {:else}
                                            <button on:click={e => { e.stopPropagation(); sound.audio.pause(); }}>
                                                <img
                                                    src="/stage_controls/gradient/pause.svg"
                                                    alt="Pause"
                                                >
                                            </button>
                                        {/if}
                                        <audio
                                            bind:this={sound.audio}
                                            bind:paused={sound.paused}
                                            src="https://asset-cdn.penguinmod.com/file/penguinmod-warm-tier-s2-cf/{selectedProjectId}_{sound.md5ext}"
                                            alt={sound.name}
                                        />
                                        <div>
                                            <input type="checkbox" bind:checked={sound.replace} name="sound-select">
                                            <label for="sound-select">{sound.name}</label>
                                        </div>
                                    </button>
                                {/each}
                            </details>
                        {/each}
                    {/if}
                {/if}
            </div>
        </div>
    {:else if tab === 'messages'}
        <div class="card-chunk">
            <div class="inputs-inline">
                <input 
                    placeholder={messageToUser ? "Username" : "Message ID"} 
                    type="text" 
                    bind:value={messageTarget}
                >
                <div>
                    <input type="checkbox" name="checkIp" bind:checked={messageToUser}>
                    <label for="checkIp">Send Directly</label>
                </div>
            </div>
            {#if messageTarget}
                <div style="display: flex; flex-direction: row;">
                    <textarea
                        bind:value={messageContent}
                        placeholder="Message Content..."
                        style="width: 100%; box-sizing: border-box; min-height: 25%"
                    />
                    <div style="display: flex; flex-direction: column;">
                        {#if messageToUser}
                            <div style="width: max-content">
                                <input type="checkbox" name="canReply" bind:checked={messageRepliable}>
                                <label for="canReply">Allow Replies</label>
                            </div>
                        {/if}
                        <Button
                            label="Send"
                            style="width: 100%; height: 100%"
                            on:click={() => {
                                const promise = messageToUser
                                    ? ProjectClient.sendModeratorMessage(messageTarget, messageContent, messageRepliable)
                                    : ProjectClient.respondToDispute(messageTarget, messageContent);
                                promise
                                    .then(() => alert('Message Sent!'))
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })
                            
                            }}
                        />
                    </div>
                </div>
                {#if !messageToUser}
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        OR
                        <Button
                            color="red"
                            label="Delete Message"
                            on:click={() => ProjectClient.deleteModeratorMessage(messageTarget)
                                .then(() => messageTarget = '')
                                .catch(err => {
                                    console.error(err);
                                    alert(err);
                                })}
                        />
                    </div>
                {/if}
            {/if}
            <div class="misc-members">
                <div class="misc-member">
                    Broadcast Messages
                    <div>
                        <input type="checkbox" name="updateTOS" bind:checked={broadcastTOSChange}>
                        <label for="updateTOS">Terms of Service</label>
                        <input type="checkbox" name="updatePrivacy" bind:checked={broadcastPolicyChange}>
                        <label for="canReply">Privacy Policy</label>
                        <input type="checkbox" name="updateGuidelines" bind:checked={broadcastGuidelinesChange}>
                        <label for="canReply">Uploading Guidelines</label>
                    </div>
                    <div style="display: flex; justify-content: center;">
                        <Button
                            on:click={() => {
                                const list = [];
                                if (broadcastTOSChange) list.push('tos');
                                if (broadcastPolicyChange) list.push('privacyPolicy');
                                if (broadcastGuidelinesChange) list.push('guidelines');
                                if (list.length <= 0) return alert('Nothing to send!!');

                                ProjectClient.setLastPolicyUpdate(list)
                                    .then(() => {
                                        broadcastTOSChange = false;
                                        broadcastPolicyChange = false;
                                        broadcastGuidelinesChange = false;
                                    })
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })
                            }}
                            label="Send broadcast"
                        />
                    </div>
                </div>
            </div>
        </div>
    {:else if tab === 'users'}
        <div class="projects-control">
            <div class="card-chunk" style="grid-column: 1;">
                {#if !userReportsLoaded}
                    <LoadingSpinner />
                {:else if userReports.length <= 0}
                    <span>Theres no reports!!</span>
                {:else}
                    {#each userReports as content, idx}
                        <button
                            class="reports-user-button"
                            on:click={() => {
                                if (selectedUserReport === idx)
                                    return selectedUserReport = null;
                                selectedUserReport = idx;
                                selectedUsername = content.target;
                                if (content.details) return;
                                ProjectClient.getReports('user', content.target)
                                    .then(details => content.details = details)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    });
                            }}
                        >
                            <img
                                src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${content.target}`}
                                alt={content.target}
                            />
                            <div class="reports-user-content">
                                <p style="font-weight: bold;">{content.target}</p>
                                <p>{content.report}</p>
                            </div>
                        </button>
                        {#if selectedUserReport === idx}
                            <div class="reports-generic-details">
                                {#if !content.details}
                                    <LoadingSpinner />
                                {:else}
                                    <Button
                                        on:click={() => ProjectClient.closeReport(content.id)
                                            .then(() => userReports.splice(selectedUserReport, 1))
                                            .catch(err => {
                                                console.error(err);
                                                alert(err);
                                            })}
                                        color="red"
                                        small
                                        label="Close reports"
                                    />
                                    {#each content.details as report}
                                        <details open={report.reporter === content.reporter}>
                                            <summary>
                                                {report.reporter}
                                                <Button
                                                    small
                                                    on:click={() => selectedUsername = report.reporter}
                                                    label="Select user"
                                                />
                                            </summary>
                                            <p style="white-space:pre-wrap">
                                                {report.report}
                                                <Button
                                                    on:click={() => ProjectClient.closeReport(report.id)
                                                        .then(() => userReports.splice(selectedUserReport, 1))
                                                        .catch(err => {
                                                            console.error(err);
                                                            alert(err);
                                                        })}
                                                    color="red"
                                                    small
                                                    label="Close report"
                                                />
                                            </p>
                                        </details>
                                    {/each}
                                {/if}
                            </div>
                        {/if}
                    {/each}
                {/if}
            </div>
            <div class="card-chunk" style="grid-column: 2;">
                <input
                    class="user-selector"
                    type="text"
                    placeholder="Username"
                    bind:value={selectedUsername}
                >
                {#if !selectedUsername}
                    Select a user!!
                {:else}
                    <div class="profile-section">
                        <button class="profile-section-image" on:click={() => {
                            fileSelector.type = "file";
                            fileSelector.accept = "image/*";
                            fileSelector.click();

                            const onceSelected = async () => {
                                fileSelector.removeEventListener('change', onceSelected);
                                const data = await fileSelector.files[0].arrayBuffer();

                                ProjectClient.setPFPOfUser(selectedUsername, data)
                                    .then(() => reloadPFP = !reloadPFP)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    });
                            }
                            fileSelector.addEventListener('change', onceSelected);
                        }}>
                            <img
                                src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={selectedUsername}&reload={reloadPFP}"
                                alt={selectedUsername}
                            />
                            <div class="profile-section-image-edit">
                                <img src="/pencil.png" alt="Edit" />
                            </div>
                        </button>
                        <div class="profile-section-display">
                            {#if !changingUsername}
                                <h1 style="margin-block:0;font-size:40px">
                                    {selectedUsername}
                                    <button
                                        class="change-username"
                                        on:click={() => {
                                            changingUsername = true;
                                            newChangedUsername = selectedUsername;
                                        }}
                                    >
                                        <img
                                            src="/pencil.png"
                                            alt="Edit"
                                            title="Edit"
                                        />
                                    </button>
                                </h1>
                            {:else}
                                <h1 style="margin-block:0;font-size:40px">
                                    <input
                                        type="text"
                                        placeholder={"Type here..."}
                                        bind:value={newChangedUsername}
                                        class="change-username-field"
                                        maxlength="20"
                                    />
                                    <button
                                        class="change-username"
                                        on:click={() => {
                                            if (changingUsernameProcessing) return;
                                            if (newChangedUsername === selectedUsername) {
                                                changingUsername = false;
                                                return;
                                            }
                                            if (newChangedUsername.length <= 0) return;
                                            changingUsernameProcessing = true;
                                            ProjectClient.setUsernameOfUser(selectedUsername, newChangedUsername)
                                                .then(() => {
                                                    selectedUsername = newChangedUsername;
                                                    changingUsername = false;
                                                })
                                                .catch(err => {
                                                    switch (err) {
                                                    case "InvalidLengthUsername":
                                                        newChangedUsernameError = "username.requirement.length";
                                                        break;
                                                    case "InvalidUsername":
                                                        newChangedUsernameError = "username.requirement.letters";
                                                        break;
                                                    case "UsernameTaken":
                                                        newChangedUsernameError = "account.fields.username.taken";
                                                        break;
                                                    default:
                                                        alert(err);
                                                        console.error(err);
                                                        break;
                                                    }
                                                })
                                                .finally(() => changingUsernameProcessing = false)
                                        }}
                                    >
                                        {#if changingUsernameProcessing}
                                            <LoadingSpinner
                                                style="width:32px;height:32px;"
                                                single={true}
                                            />
                                        {:else}
                                            <img
                                                src="/badges/approver.png"
                                                alt="Save"
                                                title="Save"
                                            />
                                        {/if}
                                    </button>
                                </h1>
                                {#if newChangedUsernameError}
                                    <p class="change-username-error">
                                        <img
                                            src="/notallowed.png"
                                            alt="Error"
                                            title="Error"
                                        />
                                        <LocalizedText
                                            text={newChangedUsernameError}
                                            key={newChangedUsernameError}
                                            lang={currentLang}
                                        />
                                    </p>
                                {/if}
                            {/if}
                        </div>
                        <div class="user-profile-controls">
                            {#each profileBadges as badge, idx}
                                {#if ProfileBadges[badge]}
                                    <button
                                        class="permited-user-profile-button"
                                        on:click={() => {
                                            profileBadges.splice(idx, 1)
                                            ProjectClient.setUserBadges(selectedUsername, profileBadges)
                                                .then(() => profileBadges = profileBadges)
                                                .catch(err => {
                                                    console.error(err);
                                                    alert(err);
                                                })
                                        }}
                                    >
                                        <img
                                            class="profile-badge"
                                            src={`/badges/${ProfileBadges[badge]}.png`}
                                            alt="Badge"
                                        />
                                        <div class="profile-section-image-edit">
                                            <img 
                                                src="/account/remove.svg" 
                                                alt="Remove Badge {TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        currentLang
                                                    ) || TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        'en'
                                                    )}"
                                            />
                                        </div>
                                    </button>
                                {/if}
                            {/each}
                            <button
                                class="add-profile-badge"
                                on:click={() => addBadgesSelectorOpen = true}
                            >
                                <img src="/account/add.svg" alt="Add Badge">
                                <div
                                    class="pop-under"
                                    style="z-index: 20000;{addBadgesSelectorOpen ? '' : 'display:none;'}"
                                >
                                    <div class="full-badge-list">
                                        {#each Object.keys(ProfileBadges) as badge}
                                            {#if !profileBadges.includes(badge)}
                                                <input
                                                    type="checkbox"
                                                    class="profile-badge-selector"
                                                    style="background-image: url('/badges/{ProfileBadges[badge]}.png')"
                                                    alt={TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        currentLang
                                                    ) || TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        'en'
                                                    )}
                                                    title={TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        currentLang
                                                    ) || TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        'en'
                                                    )}
                                                    on:change={e => {
                                                        console.log(selectedAddingBadges);
                                                        if (e.target.checked) return selectedAddingBadges.push(badge);
                                                        selectedAddingBadges = selectedAddingBadges.filter(toAdd => toAdd !== badge);
                                                    }}
                                                />
                                            {/if}
                                        {/each}
                                    </div>
                                    <Button
                                        small
                                        on:click={() => {
                                            profileBadges.push(...selectedAddingBadges);
                                            ProjectClient.setUserBadges(selectedUsername, profileBadges)
                                                .then(() => { profileBadges = profileBadges; addBadgesSelectorOpen = false; })
                                                .catch(err => {
                                                    console.error(err);
                                                    alert(err);
                                                })
                                        }}
                                        label="Add"
                                    />
                                    <Button
                                        small
                                        on:click={e => {
                                            e.stopPropagation();
                                            addBadgesSelectorOpen = false;
                                        }}
                                        label="Cancel"
                                    />
                                </div>
                            </button>
                            {#if !userWatchlisted}
                                <Button
                                    color="orange"
                                    label="Watchlist"
                                    on:click={ProjectClient.putOnWatchlist(selectedUsername, true)
                                        .then(() => userWatchlisted = true)
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                />
                            {:else}
                                <Button
                                    label="Unwatchlist"
                                    on:click={ProjectClient.putOnWatchlist(selectedUsername, false)
                                        .then(() => userWatchlisted = true)
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                />
                            {/if}
                        </div>
                    </div>
                    <div class="profile-featured-wrapper">
                        <div class="code-controlable">
                            <textarea
                                class="profile-bio"
                                bind:value={bioContent}
                                on:input={() => bioChanged = bioContent !== sourceBio}
                            />
                            <div class="save-button">
                                <Button
                                    style={!bioChanged ? 'display: none; float: right;' : ''}
                                    small
                                    on:click={() => ProjectClient.setBio(sourceBio = bioContent, true, selectedUsername)
                                        .then(() => bioChanged = false)
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                    label="Save"
                                />
                            </div>
                        </div>
                        <a class="featured-project" href="https://studio.penguinmod.com/#{featuredProjectId}">
                            <img
                                src={`${ProjectApi.OriginApiUrl}/api/v1/projects/getproject?projectID=${featuredProjectId}&requestType=thumbnail`}
                                alt={featuredProjectTitle}
                            >
                            <h2>{featuredProjectTitle}</h2>
                        </a>
                    </div>
                    <div class="project-list">
                        {#each profileProjects as project}
                            <button
                                class="project-tile"
                                on:click={() => { tab = 'projects'; selectedProjectId = project.id; }}
                            >
                                <img
                                    src={`${LINK.projects}api/v1/projects/getproject?projectID=${project.id}&requestType=thumbnail`}
                                    alt="Project Thumbnail"
                                    class="project-image"
                                />
                                <img
                                    src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${project.author.username}`}
                                    alt="Project Author"
                                    class="project-author"
                                />
                                <span class="project-title">{project.title}</span>
                            </button>
                        {/each}
                        <Button
                            link="/search?q=by%3A{selectedUsername}"
                            label="See more"
                        />
                    </div>
                    <details bind:open={banUserOpen}>
                        <summary>User bans</summary>
                        {#if userIPBanned}
                            <Button
                                label="Un IP ban"
                                on:click={() => ProjectClient.ipBanUser(selectedUsername, false)
                                    .then(() => userIPBanned = false)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                            />
                        {:else if userBanned}
                            <Button
                                label="Unban"
                                on:click={() => ProjectClient.banUser(selectedUsername, banReason, 0, false)
                                    .then(() => userBanned = false)
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })}
                            />
                        {:else}
                            <!-- svelte-ignore a11y-autofocus -->
                            <textarea
                                bind:value={banReason}
                                placeholder="Ban reason..."
                                style="width: 100%; box-sizing: border-box;"
                                autofocus
                            />
                            <div style="display:flex;flex-direction:row;padding:1em;justify-content:center;">
                                <Button
                                    label="Temp Ban"
                                    color="purple"
                                    on:click={() => {
                                        const time = prompt('For how long should they be banned?', '24h');
                                        let seconds = 0;
                                        for (const [_,digits,unit] of time.matchAll(/([0-9]+(?:\.[0-9]+)?)(?:\s*([hmsyd]))?/gi)) {
                                            switch (unit.toUpperCase()) {
                                            case 'Y': seconds += digits * 365 * 24 * 60 * 60; break;
                                            case 'D': seconds += digits * 24 * 60 * 60; break;
                                            case 'H': seconds += digits * 60 * 60; break;
                                            case 'M': seconds += digits * 60; break;
                                            case 'S': seconds += Number(digits); break;
                                            }
                                        }
                                        if (isNaN(seconds)) return alert('Time kinda needs to use valid numbers!');
                                        if (!isFinite(seconds)) return alert('Just ban them normally! infinite time isnt good.');
                                        if (seconds === 0) return alert('Are you sure you want to permanently ban them?');
                                        if (seconds < 0) return alert('Cant ban for negative time!!');

                                        ProjectClient.banUser(selectedUsername, banReason, seconds, true)
                                            .then(() => userBanned = true)
                                            .catch(err => {
                                                console.error(err);
                                                alert(err);
                                            });
                                    }}
                                />
                                <Button
                                    label="Ban"
                                    color="red"
                                    on:click={() => ProjectClient.banUser(selectedUsername, banReason, 0, true)
                                        .then(() => userBanned = true)
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                />
                                <Button
                                    label="IP Ban"
                                    color="red"
                                    on:click={() => ProjectClient.ipBanUser(selectedUsername, true)
                                        .then(() => userIPBanned = true)
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                />
                                <Button
                                    label="Delete Account"
                                    color="red"
                                    on:click={() => ProjectClient.deleteUserAccount(selectedUsername, banReason)
                                        .then(() => selectedUsername = '')
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                />
                            </div>
                        {/if}
                    </details>
                {/if}
                <div class="misc-member">
                    Permitted Users
                    <strong class="title">Admins</strong>
                    <div class="permited-users-grid">
                        {#each adminsList as permitted}
                            <div class="permited-user-tile">
                                <button
                                    class="permited-user-profile-button"
                                    on:click={() => 
                                        ProjectClient.assingUsersPermisions(permitted, false, modsList.includes(permitted))
                                            .then(() => { adminsList.splice(adminsList.indexOf(permitted), 1); adminsList = adminsList; })
                                            .catch(err => {
                                                console.error(err);
                                                alert(err);
                                            })}
                                >
                                    <img
                                        class="permited-user-profile"
                                        src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={permitted}"
                                        alt={permitted}
                                    />
                                    <div class="profile-section-image-edit">
                                        <img src="/account/remove.svg" alt="Remove Perms" />
                                    </div>
                                </button>
                                <span>{permitted}</span>
                            </div>
                        {/each}
                        <button
                            class="add-permited-user"
                            on:click={() => {
                                const username = prompt('Please enter there username below', selectedUsername);
                                if (!username) return;
                                ProjectClient.assingUsersPermisions(username, true, modsList.includes(username))
                                    .then(() => { adminsList.push(username); adminsList = adminsList; })
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    });
                            }}
                        >
                            <img src="/account/add.svg" alt="Add User">
                        </button>
                    </div>
                    <strong class="title">Mods</strong>
                    <div class="permited-users-grid">
                        {#each modsList as permitted}
                            <div class="permited-user-tile">
                                <button
                                    class="permited-user-profile-button"
                                    on:click={() => 
                                        ProjectClient.assingUsersPermisions(permitted, adminsList.includes(permitted), false)
                                            .then(() => { modsList.splice(modsList.indexOf(permitted), 1); modsList = modsList; })
                                            .catch(err => {
                                                console.error(err);
                                                alert(err);
                                            })}
                                >
                                    <img
                                        class="permited-user-profile"
                                        src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={permitted}"
                                        alt={permitted}
                                    />
                                    <div class="profile-section-image-edit">
                                        <img src="/account/remove.svg" alt="Remove Perms" />
                                    </div>
                                </button>
                                <span>{permitted}</span>
                            </div>
                        {/each}
                        <button
                            class="add-permited-user"
                            on:click={() => {
                                const username = prompt('Please enter there username below', selectedUsername);
                                if (!username) return;
                                ProjectClient.assingUsersPermisions(username, adminsList.includes(username), true)
                                    .then(() => { modsList.push(username); modsList = modsList; })
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    });
                            }}
                        >
                            <img src="/account/add.svg" alt="Add User">
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {:else if tab === 'misc'}
        <div class="projects-control">
            <div class="card-chunk" style="grid-column: 1;"><Stats stats_data={serverStats} render={true}></Stats></div>
            <div class="card-chunk" style="grid-column: 2;">
                <div class="misc-members">
                    <div class="misc-member">
                        User IP Lookup
                        <div class="text-controlable">
                            <div class="text-box-wrapper">
                                <div class="inputs-inline">
                                    <input 
                                        placeholder={"IP/Username"} 
                                        type="text" 
                                        bind:value={connectionCheck}
                                    >
                                    <div>
                                        <input type="checkbox" name="checkIp" bind:checked={isCheckIP}>
                                        <label for="checkIp">Get IPs</label>
                                    </div>
                                </div>
                                <div class="text-box-wrapper-wrapper"><textarea class="text-box" bind:value={connections}></textarea></div>
                            </div>
                            <div>
                                <Button on:click={() => {
                                    if (!isCheckIP) {
                                        ProjectClient.getAlts(connectionCheck)
                                            .then(user => connections = user.join('\n'))
                                            .catch(err => {
                                                console.error(err);
                                                connections = `Failed to get connections: ${err}`
                                            })
                                        return;
                                    }
                                    const isIp = connectionCheck.includes(':') || connectionCheck.includes('.');
                                    (isIp
                                        ? ProjectClient.getConnectedUsers(connectionCheck)
                                        : ProjectClient.getConnectedIPs(connectionCheck)
                                    )
                                        .then(res => {
                                            if (res.length <= 0) return connections = 'No connections';
                                            connections = res
                                                .map(ip => isIp
                                                    ? ip.username
                                                    : `IP: ${ip.ip}, banned: ${ip.banned}, last login: ${unixToDisplayDate(ip.lastLogin)}`)
                                                .join('\n');
                                        })
                                        .catch(err => {
                                            console.error(err);
                                            connections = `Failed to get connections: ${err}`
                                        })
                                }}>Get Connections</Button>
                                <br>
                                <Button on:click={() => ProjectClient.banIP(connectionCheck, true)
                                    .then(() => alert(`Banned IP ${connectionCheck}`))
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })} color="red">Ban IP</Button>
                                <Button on:click={() => ProjectClient.banIP(connectionCheck, false)
                                    .then(() => alert(`Banned IP ${connectionCheck}`))
                                    .catch(err => {
                                        console.error(err);
                                        alert(err);
                                    })} color="red">Unban IP</Button>
                            </div>
                        </div>
                    </div>
                    <div class="misc-member">
                        Profanity List
                        <div class="code-controlable" style="height: 400px;">
                            <div style="width: 100%; height: 100%">
                                <div class="code-box" bind:this={codeArea}></div>
                            </div>
                            <div class="save-button">
                                <Button
                                    style={!profanityLoaded ? 'display: none' : ''}
                                    color={profanityChanged ? '' : 'gray'}
                                    on:click={() => ProjectClient.setProfanityFilter(profanityFilter = editor.getValue())
                                        .then(() => { alert('Done'); profanityChanged = false; })
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                >Save filter</Button>
                                <Button 
                                    style={!profanityLoaded ? '' : 'display: none'}
                                    on:click={() => ProjectClient.getProfanityFilter()
                                        .then(filter => {
                                            profanityFilter = JSON.stringify(filter, null, 4);
                                            editor.setValue(profanityFilter);
                                            profanityLoaded = true;
                                            profanityChanged = false;
                                        })
                                        .catch(err => {
                                            console.error(err);
                                            alert(err);
                                        })}
                                >Load filter</Button>
                            </div>
                        </div>
                    </div>
                    <div class="misc-member access-toggles">
                        <div class="can-upload-toggle">
                            <Button 
                                color={canUploadProjects ? 'red' : 'remix'} 
                                on:click={() => {
                                    if (!confirm("Are you sure?")) return;
                                    ProjectClient.setErrorAllUploadProjects(!canUploadProjects)
                                        .then(() => canUploadProjects = !canUploadProjects)
                                        .catch((err) => {
                                            console.error(err);
                                            alert(err);
                                        });
                                }}
                            >
                                {!canUploadProjects ? 'Enable' : 'Dissable'} project uploading
                            </Button>
                        </div>
                        <div class="can-sign-up-toggle">
                            <Button 
                                color={canSignUp ? 'red' : 'remix'} 
                                on:click={() => {
                                    if (!confirm("Are you sure?")) return;
                                    ProjectClient.setErrorAccountCreation(!canSignUp)
                                        .then(() => canSignUp = !canSignUp)
                                        .catch((err) => {
                                            console.error(err);
                                            alert(err);
                                        });
                                }}
                            >
                                {!canSignUp ? 'Enable' : 'Dissable'} account creation
                            </Button>
                        </div>
                        <div class="can-view-toggle">
                            <Button 
                                color={canViewProjects ? 'red' : 'remix'} 
                                on:click={() => {
                                    if (!confirm("Are you sure?")) return;
                                    ProjectClient.setErrorAllGetProjects(!canViewProjects)
                                        .then(() => canViewProjects = !canViewProjects)
                                        .catch((err) => {
                                            console.error(err);
                                            alert(err);
                                        });
                                }}
                            >
                                {!canViewProjects ? 'Enable' : 'Dissable'} project viewing
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .href-button {
        padding: 0;
        border: none;
        background: none;
        color: #008cff;
        font-size: inherit;
        cursor: pointer;
    }

    .inputs-inline {
        display: grid;
        grid-template-columns: minmax(auto, 1fr) max-content;
        margin-bottom: 5px;
    }
    .title { margin-top: .5rem; }
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
    .pop-under {
        position: absolute;
        top: 36px;
        left: 0;
        width: 128px;
        padding: 8px 16px;
        border: solid 1px rgba(255, 255, 255, .3);
        border-radius: 8px 0px 8px 8px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        transform-origin: middle right;
        transform: translateX(calc(-100% + 16px));
        z-index: 5000;
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
    .card-reject {
        width: calc(100% - 32px);
        height: 100%;
        padding: 16px;
        overflow: auto;
    }

    .text-box {
        max-width: 100%;
        box-sizing: border-box;
        width: 100%;
        height: 100%;
    }
    .text-box-wrapper-wrapper {
        overflow: auto;
        text-align: start;
    }
    .text-box-wrapper {
        box-sizing: border-box;
        resize: none;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: min-content auto;
        grid-template-columns: 100%;
    }
    .text-controlable {
        position: relative;
        width: 100%;
        display: grid;
        grid-template-columns: auto max-content;
    }

    .code-box {
        font-family: monospace;
        box-sizing: border-box;
        resize: none;
        width: 100%;
        height: 100%;
    }
    .code-controlable {
        position: relative;
        width: 100%;
        height: 100%;
    }
    .misc-member {
        width: 100%;
        height: calc(100% - 12px);
        border-top: 1px solid grey;
        padding-top: 10px;
        text-align: center;
        display: flex;
        flex-direction: column;
    }
    .misc-members {
        display: grid;
        grid-template-columns: 100%;
        grid-template-rows: minmax(auto, 1fr) max-content;
        justify-content: end;
        height: 100%;
        width: 100%;
    }

    .save-button {
        position: absolute;
        top: 5px;
        right: 5px;
    }

    .can-upload-toggle {
        flex-grow: 1;
        align-self: start;
    }
    .can-view-toggle {
        align-self: end;
    }
    .can-sign-up-toggle {
        flex-grow: 1;
        align-self: center;
    }
    .access-toggles {
        display: flex;
        flex-direction: row;
        height: min-content;
        width: 100%;
    }

    .profile-bio {
        resize: none;
        border-radius: 10px;
        padding: 5px;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
    }
    .profile-featured-wrapper {
        display: grid;
        gap: 10px;
        grid-template-columns: 50% 50%;
    }
    .featured-project {
        text-align: center;
        background-color: #00c3ff22;
        border-radius: 10px;
        padding: 5px;
        color: white;
    }
    .featured-project:visited { color: white; }
    .featured-project img {
        aspect-ratio: 4 / 3;
        background-color: white;
        border-radius: 10px;
        height: 180px;
    }
    .featured-project h2 { margin: 0; }
    .project-list {
        display: flex;
        flex-direction: row;
        align-items: center;
        overflow: scroll;
        padding: 10px 0px;
    }
    .user-selector {
        width: 100%;
        box-sizing: border-box;
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

    .project-tile {
        color: inherit;
        font-size: inherit;
        text-overflow: ellipsis;
        word-break: keep-all;
        padding: 5px;
        margin: 4px;
        background: none;
        border: 1px solid grey;
        border-radius: 5px;
        display: grid;
        gap: 4px;
        grid-template-rows: 180px 32px;
        grid-template-columns: 32px 204px;
        cursor: pointer;
    }
    .project-image {
        border-radius: 5px;
        grid-column: 1 / 3;
    }
    .project-author {
        border-radius: 5px;
        width: 32px;
        height: 32px;
        grid-column: 1;
        grid-row: 2;
    }
    .project-title {
        text-overflow: ellipsis;
        align-content: center;
        text-align: start;
        white-space: nowrap;
        overflow: hidden;
    }
    .profile-badge {
        width: 24px;
        height: 24px;
    }
    .full-badge-list {
        overflow-x: scroll;
        display: flex;
        flex-direction: row;
        padding-bottom: 10px;
        gap: 3px;
    }
    .add-profile-badge {
        position: relative;
        cursor: pointer;
        margin: 4px;
        padding: 2px;
        border-radius: 4px;
        border: rgba(0, 0, 0, 0.25) 1px solid;
        background: none;
        width: 32px;
        height: 32px;
        box-sizing: border-box;
        cursor: pointer;
    }
    :global(body.dark-mode) .add-profile-badge { border: rgba(255, 255, 255, 0.35) 1px solid; }
    .add-profile-badge img {
        width: 24px;
        height: 24px;
    }
    .profile-badge-selector {
        width: 24px;
        height: 24px;
        margin: 0;
        appearance: none;
        background-size: contain;
        filter: saturate(0);
        cursor: pointer;
        flex-shrink: 0;
    }
    .profile-badge-selector:checked {
        filter: none;
        border-bottom: rgba(0, 0, 0, 0.25) 1px solid;
    }
    :global(body.dark-mode) .profile-badge-selector:checked { border-bottom: rgba(255, 255, 255, 0.35) 1px solid; }

    .permited-users-grid {
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        justify-content: center;
        gap: 4px;
    }
    :global(body.dark-mode) .permited-user-tile {
        border: rgba(255, 255, 255, 0.35) 1px solid;
        background: #111;
        color: white;
    }
    .add-permited-user {
        cursor: pointer;
        padding: 4px;
        border: none;
        background: none;
    }
    .add-permited-user img {
        width: 32px;
        height: 32px;
    }
    .permited-user-tile {
        padding: 4px;
        border: rgba(0, 0, 0, 0.25) 1px solid;
        border-radius: 4px;
        background: white;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .permited-user-profile {
        width: 32px;
        height: 32px;
    }
    .permited-user-profile-button {
        width: 32px;
        height: 32px;
        overflow: hidden;
        position: relative;
        cursor: pointer;
        padding: 0px;
        border: none;
        background: none;
        border-radius: 4px;
        margin-right: 4px;
    }
    .permited-user-profile-button:focus .profile-section-image-edit,
    .permited-user-profile-button:active .profile-section-image-edit,
    .permited-user-profile-button:hover .profile-section-image-edit {
        opacity: 1;
        transition-duration: 0.1s;
        transition-property: opacity;
    }

    .user-profile-controls {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap-reverse;
        height: 128px;
        align-items: end;
        justify-content: center;
    }
    .change-username {
        overflow: hidden;
        background: none;
        border: 0;
        cursor: pointer;
    }
    .change-username img {
        height: 32px;
    }
    /* profile section */
    .profile-section {
        display: flex;
        flex-direction: row;
        align-items: center;

        margin: 10px 0px;
        width: 100%;
    }
    .profile-section-image {
        position: relative;
        margin: 0;
        padding: 0;
        border: 0;
        margin-right: 8px;

        width: 128px;
        height: 128px;

        cursor: pointer;
        background: none;
        border-radius: 8px;
        overflow: hidden;
    }
    :global(html[dir="rtl"]) .profile-section-image {
        margin-right: initial;
        margin-left: 8px;
    }

    .profile-section-image > img {
        width: 128px;
        height: 128px;
    }
    .profile-section-image-edit {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;

        background: rgba(0, 0, 0, 0.5);
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        transition-duration: 0.1s;
        transition-property: opacity;
    }
    .profile-section-image-edit img {
        background: rgba(0, 0, 0, 0.7);
        border-radius: 100%;
        overflow: visible;
        padding: 8px;
    }
    .profile-section-image:focus .profile-section-image-edit,
    .profile-section-image:active .profile-section-image-edit,
    .profile-section-image:hover .profile-section-image-edit {
        opacity: 1;
        transition-duration: 0.1s;
        transition-property: opacity;
    }
    .profile-section-display {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        flex-grow: 2;
    }


    .change-username-field {
        font-size: 40px;
        width: 70%;
    }
    :global(body.dark-mode) .change-username-field {
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: transparent;
        color: white;
    }

    .change-username-error {
        color: red;
        margin-block: 2px;
        font-size: 14px;
    }
    .change-username-error img {
        margin-bottom: -3px;
        height: 16px;
    }
    :global(body.dark-mode) .change-username-error {
        color: rgb(255, 130, 130);
    }

    .project-text-field {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }
    .project-text-field h3 {
        margin: 0;
        margin-top: 10px;
    }
    .project-text-field textarea {
        resize: none;
        width: 100%;
        box-sizing: border-box;
        flex-grow: 1;
    }
    .project-texts {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
    .yet-another-selected-project-wrapper[project-rejected=true] {
        filter: saturate(0) opacity(70%);
        pointer-events: none;
        cursor: pointer;
    }
    .yet-another-selected-project-wrapper {
        display: grid;
        grid-template-columns: auto 1fr;
        margin: 5px 0px;
    }
    .selected-project {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .project-thumbnail {
        width: 480px;
        height: 360px;
        border-radius: 10px;
    }
    .project-thumbnail > img {
        width: 480px;
        height: 360px;
        border-radius: 10px;
    }
    .project-header {
        box-sizing: border-box;
        margin-bottom: 4px;
        padding: 4px;
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 480px;
    }
    .project-header img {
        width: 64px;
        height: 64px;
        border-radius: 6px;
        margin-right: 5px;
    }
    .project-header-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-left: 4px;
        width: 100%;
    }
    .project-title-editable {
        background: none;
        border: none;
        color: white;
        font-weight: bold;
        font-size: larger;
        box-sizing: border-box;
        width: 100%;
        text-overflow: ellipsis;
    }
    .project-title-editable:focus-within {
        background: revert;
        border: revert;
        color: revert;
    }
    .rejection-message {
        height: 24px;
        margin: 5px 0px;
        gap: 5px;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .rejection-message img {
        height: 24px;
    }
    .file-loading-status {
        width: 100%;
        margin-top: 5px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .file-loading-status progress {
        border-radius: 0;
        height: 16px;
        width: 360px;
        margin: 3px 0px;
    }
    .extensions-view {
        display: grid;
        grid-template-rows: max-content 1fr;
        gap: 4px;
        height: 40%;
        margin: 4px;
    } 
    .strings-listout {
        white-space: pre;
        word-break: break-all;
    }
    .project-costume-asset {
        margin: 4px;
        padding: 4px;
        border: rgba(0, 0, 0, 0.25) 1px solid;
        border-radius: 4px;
        background: white;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
    }
    :global(body.dark-mode) .project-costume-asset {
        border: rgba(255, 255, 255, 0.35) 1px solid;
        background: #111;
        color: white;
    }
    .project-costume-asset img {
        width: 128px;
        height: 128px;
        object-fit: contain;
    }
    .project-sound-asset {
        margin: 4px;
        padding: 4px;
        border: rgba(0, 0, 0, 0.25) 1px solid;
        border-radius: 4px;
        background: white;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
    }
    :global(body.dark-mode) .project-sound-asset {
        border: rgba(255, 255, 255, 0.35) 1px solid;
        background: #111;
        color: white;
    }
    .project-sound-asset img {
        width: 32px;
        height: 32px;
    }
    .project-sound-asset > button {
        border: none;
        background: none;
        padding: none;
        margin: none;
        width: 128px;
        height: 128px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .projects-control {
        display: grid;
        grid-template-columns: 35% 65%;
        height: 100%;
    }
    .card-chunk {
        margin: 10px;
        padding: 10px;
        border-radius: 10px;
        background-color: #00c3ff22;
        height: 100%;
        overflow-x: hidden;
        overflow-y: scroll;
    }
    .section-category-toggles {
        background-color: rgba(100%, 100%, 100%, 0.05);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .category-toggle-section {
        display: grid;
        grid-template-columns: repeat(4, calc(calc(100% / 4) - 4px));
        align-items: flex-end;
        justify-content: center;
        width: 100%;
        margin-top: 4px;
    }
    .category-toggle-section button {
        border-radius: 10px;
        border-width: 4px;
        border-style: solid;
        border-color: grey;
        padding: 4px 10px;
        background: #008cff;
        font-weight: bold;
        font-size: 1em;
        border: 0;
        margin: 2px 2px;
        color: white;
        cursor: pointer;
    }
    .category-toggle-section button[active="true"] {
        margin-top: 0;
        background: #003bdd;
        z-index: 2;
    }
    .category-toggle-section button[admin="true"] {
        background: #215a8a;
    }
</style>
