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

    const ProjectClient = new ProjectApi();

    // Components
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import ClickableProject from "$lib/ClickableProject/Project.svelte";
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

    let tab = '';
    let admin = false;
    let loggedIn = null;
    /** @type {HTMLInputElement} */
    let fileSelector;
    let codeArea;
    /** @type {import('brace').Editor} */
    let editor;
    let ace;

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

                tab = browser 
                    ? location.hash.slice(1) || 'projects'
                    : 'projects'
            })
            .catch(() => {
                loggedIn = false;
                kickOut(true);
            });

        let lastDarkMode = null;
        const loop = () => {
            const darkmode = isEmbed ?
                location.hash.replace(/#/gmi, "") === "dark=true"
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

    $: if (browser && loggedIn) location.hash = tab;

    /* --- Projects category --- */
    let rejectionReason = '';
    let isRejectHard = false; // heh
    let rejectionPageOpen = false;
    let rejectingName = '';
    let rejectingId;

    /* --- Messages Category --- */


    /* --- Users category --- */
    let userReportsLoaded = false;
    let userReports = [];
    let selectedUserReport = null;
    let selectedUsername = '';
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
    function onSelectedUserChange(username) {
        profileBadges = [];
        ProjectApi.getUserBadges(username)
            .then(badges => profileBadges = badges)
            .catch(err => {
                if (err === '{"error":"NotFound"}') return;
                console.error(err);
                alert(err);
            })
    }
    $: onSelectedUserChange(selectedUsername);

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
        case 'projects': break;
        case 'messages':

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
                    .catch(err => console.error(err));
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
                <p>Rejecting <b>{rejectingName}</b></p>
                <img
                    src={`${LINK.projects}api/v1/projects/getproject?projectID=${rejectingId}&requestType=thumbnail`}
                    alt="Image of {rejectingName}"
                    width="240"
                    height="180"
                />
                <!-- svelte-ignore a11y-autofocus -->
                <textarea
                    bind:value={rejectionReason}
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
                        rejectionReason = arg.detail;
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
            </div>
            <div class="card-chunk" style="grid-column: 2;">project management</div>
        </div>
    {:else if tab === 'messages'}
        <div class="card-chunk">messages</div>
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
                                    <button
                                        on:click={() => ProjectClient.closeReport(content.id)
                                            .then(() => userReports.splice(selectedUserReport, 1))
                                            .catch(err => {
                                                console.error(err);
                                                alert(err);
                                            })}
                                        color="red"
                                    >
                                        Close Reports
                                    </button>
                                    {#each content.details as report}
                                        <details open={report.reporter === content.reporter}>
                                            <summary>
                                                {report.reporter}
                                                <button on:click={() => selectedUsername = report.reporter}>
                                                    Select user
                                                </button>
                                            </summary>
                                            <p style="white-space:pre-wrap">
                                                {report.report}
                                                <button
                                                    on:click={() => ProjectClient.closeReport(report.id)
                                                        .then(() => userReports.splice(selectedUserReport, 1))
                                                        .catch(err => {
                                                            console.error(err);
                                                            alert(err);
                                                        })}
                                                    color="red"
                                                >
                                                    Close Report
                                                </button>
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
                            {:else}
                                <p
                                    style="font-size: initial; font-weight: normal; width: 100%; text-align: center;"
                                >No Badges!</p>
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
                                    <button
                                        on:click={() => {
                                            profileBadges.push(...selectedAddingBadges);
                                            ProjectClient.setUserBadges(selectedUsername, profileBadges)
                                                .then(() => { profileBadges = profileBadges; addBadgesSelectorOpen = false; })
                                                .catch(err => {
                                                    console.error(err);
                                                    alert(err);
                                                })
                                        }}
                                    >Add</button>
                                    <button
                                        on:click={e => {
                                            e.stopPropagation();
                                            addBadgesSelectorOpen = false;
                                        }}
                                    >Cancel</button>
                                </div>
                            </button>
                        </div>
                        <div class="user-profile-controls">
                            {#if userIPBanned}
                                <Button
                                    label="Un IP ban"
                                    on:click={() => {}}
                                />
                            {:else if userBanned}
                                <Button
                                    label="Unban"
                                    on:click={() => {}}
                                />
                            {/if}
                        </div>
                    </div>
                    <div class="profile-access">
                        <Button
                            link="/profile?user={selectedUsername}"
                            label="View Profile"
                        />
                        <Button
                            link="/search?q=by%3A{selectedUsername}"
                            label="View Projects"
                        />
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
                    <details bind:open={banUserOpen}>
                        <summary>User bans</summary>
                        <!-- svelte-ignore a11y-autofocus -->
                        <textarea
                            bind:value={banReason}
                            placeholder="Ban reason..."
                            style="width: 100%; box-sizing: border-box;"
                            autofocus
                        />
                        <div style="display:flex;flex-direction:row;padding:1em">
                            <Button
                                label="Temp Ban"
                                color="purple"
                                on:click={() => {}}
                            />
                            <Button
                                label="Ban"
                                color="red"
                                on:click={() => {}}
                            />
                            <Button
                                label="IP Ban"
                                color="red"
                                on:click={() => {}}
                            />
                            <Button
                                label="Delete Account"
                                color="red"
                                on:click={() => {}}
                            />
                        </div>
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
                                <div style="display: grid; grid-template-columns: minmax(auto, 1fr) max-content">
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
                            <div class="save-button" >
                                <Button
                                    style={profanityLoaded ? 'display: none' : ''}
                                    color={profanityChanged ? '' : 'gray'}
                                    on:click={() => {
                                        ProjectClient.setProfanityFilter(profanityFilter = editor.getValue())
                                            .then(() => { alert('Done'); profanityChanged = false; })
                                            .catch(err => alert(err))
                                    }}
                                >Save filter</Button>
                                <Button 
                                    style={profanityLoaded ? '' : 'display: none'}
                                    on:click={() => profanityLoaded = true}
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
        top: 0;
        right: 0;
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

    .profile-access {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 32px;
    }
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

    button[color="red"] {
        color: white;
        background-color: #ff5151;
        border-color: rgba(255, 81, 81, 0.35);
        border-radius: 4px;
    }
</style>
