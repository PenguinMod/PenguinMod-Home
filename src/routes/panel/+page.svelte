<script>
    import { onMount } from "svelte";
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
            Number(unix)
        ).toLocaleTimeString()}`;
    }

    let tab = 'projects';
    let admin = false;
    let loggedIn = true;
    let serverStats = [];

    function kickOut(loggedOut) {
        const error = loggedOut ? 401 : 403;
        location.href = location.origin + `/error?error=${error}`;
    }

    onMount(() => {
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

        ProjectApi.getServerInfo()
            .then((stats) => {
                serverStats = Flatten(stats);
            })
            .catch((err) => {
                console.error(err);
            });
        
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }

        /*
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
        */
    });
    // we dont need to add an "onAuthenticate" event
    // because you cant sign in on the /panel page,
    // signing out or going on it while signed out
    // just kicks you out of the page
    Authentication.onLogout(() => {
        loggedIn = false;
        location.href = location.origin;
    });
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
            <button active={tab === 'users'} admin={admin} on:click={() => tab = 'users'}>Users</button>
            <button active={tab === 'admin'} admin={admin} on:click={() => tab = 'admin'}>Admin</button>
            <button active={tab === 'misc'} admin={admin} on:click={() => tab = 'misc'}>Misc</button>
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
    {:else if tab === 'admin'}
        <div class="card-chunk">ip management</div>
    {:else if tab === 'misc'}
        <div class="projects-control">
            <div class="card-chunk" style="grid-column: 1;"><Stats stats_data={serverStats} render={true}></Stats></div>
            <div class="card-chunk" style="grid-column: 2;">server on/offs and profanity config</div>
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
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 30%;
        margin: 4px 10px;
    }
    .category-toggle-section button {
        border-radius: 1024px;
        padding: 4px 10px;
        background: #008cff;
        font-weight: bold;
        font-size: 1em;
        border: 0;
        margin: 0 4px;
        color: white;
        cursor: pointer;
    }
    .category-toggle-section button[active="true"] {
        background: #003bdd;
    }
    .category-toggle-section button[admin="true"] {
        background: #215a8a;
    }
</style>
