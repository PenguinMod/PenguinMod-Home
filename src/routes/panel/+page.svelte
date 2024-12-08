<script>
    import { onMount } from "svelte";
    import { browser } from '$app/environment'; 
    import { page } from '$app/stores';
    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";
    import Authentication from "../../resources/authentication.js";
    import LINK from "../../resources/urls.js";
    import ProfileBadges from "../../resources/badges.js";
    import QuickRejectComponent from "./quickRejects.svelte";
    import ProjectApi from "../../resources/projectapi.js";
    import * as FileSaver from "file-saver";
    import JSZip from "jszip";
    import BlobAndDataUrl from "./blobanddataurl.js";
    import FileTypes from "./filetypes.js";

    const ProjectClient = new ProjectApi();

    // Components
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import ClickableProject from "$lib/ClickableProject/Project.svelte";
    import Stats from "$lib/statsComponent/stats.svelte";
    import Button from "$lib/Button/Button.svelte";

    function unixToDisplayDate(unix) {
        return `${new Date(Number(unix)).toDateString()} at ${new Date(
            Number(unix)
        ).toLocaleTimeString()}`;
    }

    let tab = browser 
        ? location.hash.slice(1) 
        : 'projects';
    let admin = false;
    let loggedIn = null;

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

    onMount(() => {
        if (location.hash) tab = location.hash.slice(1);
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

    $: if (browser) location.hash = tab;

    /* --- Misc category --- */
    let serverStats = [];
    let canUploadProjects = true;
    let canViewProjects = true;
    let profanityFilter = '';
    let connections = '';

    /* --- Preloaders --- */
    $: {
        switch (tab) {
        case 'projects': break;
        case 'messages': break;
        case 'users': break;
        case 'misc': 
            ProjectApi.getServerInfo()
                .then(stats => serverStats = Flatten(stats))
                .catch(err => console.error(err));
            
            ProjectApi.canUploadProjects()
                .then(can => canUploadProjects = can);
            ProjectApi.canViewProjects()
                .then(can => canViewProjects = can);
            
            ProjectClient.getProfanityFilter()
                .then(json => profanityFilter = JSON.stringify(JSON.parse(json), null, 4))
                .catch(err => console.error(err));
            break;
        }
    }
</script>

<svelte:head>
    <title>PenguinMod - Admin Panel</title>
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home">
    <meta name="description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="twitter:description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>

<NavigationBar />

{#if !loggedIn}
    <NavigationMargin />
    <LoadingSpinner enableTips={true} />
{/if}

<div class="main" style={loggedIn ? "" : "display:none"}>
    <NavigationMargin />

    
    <div class="section-category-toggles">
        <div class="category-toggle-section">
            <button active={tab === 'projects'} on:click={() => tab = 'projects'}>Projects</button>
            <button active={tab === 'messages'} on:click={() => tab = 'messages'}>Messages</button>
            <button active={tab === 'users'} admin={!admin} on:click={() => tab = 'users'}>Users</button>
            <button active={tab === 'misc'} admin={!admin} on:click={() => tab = 'misc'}>Misc</button>
        </div>
    </div>
    {#if tab === 'projects'}
        <div class="projects-control">
            <div class="card-chunk" style="grid-column: 1;">reports</div>
            <div class="card-chunk" style="grid-column: 2;">project management</div>
        </div>
    {:else if tab === 'messages'}
        <div class="card-chunk">messages</div>
    {:else if tab === 'users'}
        <div class="card-chunk">users bans and badges</div>
    {:else if tab === 'misc'}
        <div class="projects-control">
            <div class="card-chunk" style="grid-column: 1;"><Stats stats_data={serverStats} render={true}></Stats></div>
            <div class="card-chunk" style="grid-column: 2;">
                <div class="misc-members">
                    <div class="misc-member">
                        User IP Lookup
                        <div class="text-controlable" style="height:100%;">
                            <div style="width: 100%">
                                <input  type="text">
                                <textarea 
                                    bind:value={connections}
                                    class="text-box"
                                ></textarea>
                            </div>
                            <div>
                                <Button on:click={() => {}} color="red">Ban IP</Button>
                                <Button on:click={() => {}}>Unban IP</Button>
                            </div>
                        </div>
                    </div>
                    <div class="misc-member">
                        Profanity List
                        <div class="text-controlable" style="height:100%;">
                            <div style="width: 100%">
                                <textarea 
                                    bind:value={profanityFilter}
                                    class="text-box"
                                ></textarea>
                            </div>
                            <div>
                                <Button on:click={() => ProjectClient.setProfanityFilter(profanityFilter)
                                    .then(() => alert('Done'))
                                    .catch(err => alert(err))}>Save filter</Button>
                            </div>
                        </div>
                    </div>
                    <div class="misc-member">
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
                        <div class="can-view-toggle">
                            <Button 
                                color={canViewProjects ? 'red' : 'remix'} 
                                on:click={() => {
                                    if (!confirm("Are you sure?")) return;
                                    ProjectClient.setErrorAllUploadProjects(!canViewProjects)
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

    .text-box {
        box-sizing: border-box;
        width: 100%;
        height: 150px;
    }
    .text-controlable {
        display: grid;
        grid-template-columns: minmax(auto, 1fr) max-content;
        justify-content: end;
        width: 100%;
    }
    .misc-member {
        width: 100%;
        height: 100%;
        border-top: 1px solid grey;
        padding-top: 10px;
        text-align: center;
    }
    .misc-members {
        display: grid;
        grid-template-columns: 100%;
        grid-template-rows: repeat(2, minmax(auto, 1fr)) max-content;
        justify-content: end;
        height: 100%;
        width: 100%;
    }

    .can-upload-toggle {
        display: inline;
        float: left;
    }
    .can-view-toggle {
        display: inline;
        float: right;
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
        grid-template-columns: repeat(4, 20%);
        align-items: flex-end;
        justify-content: center;
        width: 100%;
        margin-top: 4px;
    }
    .category-toggle-section button {
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        border-width: 4px;
        border-style: solid;
        border-color: grey;
        padding: 4px 10px;
        background: #008cff;
        font-weight: bold;
        font-size: 1em;
        border: 0;
        margin: 2px 0.5px;
        margin-bottom: 0;
        color: white;
        cursor: pointer;
    }
    .category-toggle-section button[active="true"] {
        margin-top: 0;
        padding: 7px 10px;
        background: #003bdd;
        z-index: 2;
    }
    .category-toggle-section button[admin="true"] {
        background: #215a8a;
    }
</style>
