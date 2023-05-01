<script>
    import { onMount } from "svelte";

    // Static values
    import LINK from "../../resources/urls.js";

    // Components
    import NavigationBar from "../../components/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "../../components/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "../../components/LoadingSpinner/Spinner.svelte";
    import Project from "../../components/Project/Project.svelte";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let searchQuery = "...";
    let projects = [];
    let requestFailed = false;

    onMount(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get("q");
        searchQuery = query;

        const api = `${
            LINK.projects
        }api/projects/paged?length=100&includes=${encodeURIComponent(
            searchQuery
        )}`;
        fetch(api)
            .then((response) => {
                response
                    .json()
                    .then((pages) => {
                        projects = pages.flat(Infinity);
                        if (pages.length <= 0) {
                            projects = ["notfound"];
                        }
                    })
                    .catch(() => {
                        requestFailed = true;
                    });
            })
            .catch(() => {
                requestFailed = true;
            });
    });
</script>

<head>
    <title>PenguinMod - Home</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section section-info">
        <div>
            <h1>Search</h1>
            <p>Searching for {searchQuery}</p>
        </div>
    </div>

    <div class="section section-projects">
        {#if projects[0] !== "notfound"}
            {#each projects as project}
                <Project {...project} />
            {:else}
                <!-- projects.length === 0 -->
                <div style="margin-top: 16px;">
                    <LoadingSpinner />
                </div>
            {/each}
        {:else}
            <div>
                <PenguinConfusedSVG height="12rem" />
                <p>Nothing was found.</p>
            </div>
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

    .section {
        margin: 8px;
    }
    .section-info {
        background: #00c3ffad;
        height: 8.5rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
        text-align: center;
    }

    .section-projects {
        margin: 0;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
    }
</style>
