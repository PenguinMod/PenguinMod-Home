<script>
    import { onMount } from "svelte";

    // Static values
    import LINK from "../../resources/urls.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Project from "$lib/Project/Project.svelte";
    import Button from "$lib/Button/Button.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let searchQuery = "...";
    let projects = [];
    let requestFailed = false;
    let page = 0;
    let pageIsLast = false;

    const validTagPrefixes = ["studio", "user", "featured", "sort"];
    const tagFilterFunction = (word) => {
        const startsWithTag = validTagPrefixes.some((value) => {
            return String(word).startsWith(`${value}:`);
        });
        if (startsWithTag) {
            // ex: "studio: abc" should count as searching for abc ONLY
            return !String(word).endsWith(":");
        }
    };

    const fetchNewProjects = () => {
        let api = "";
        if (searchQuery.trim() === "all:projects") {
            api = `${LINK.projects}api/projects/search?page=${page}`;
        } else {
            // todo: parse tags & apply properly
            const split = searchQuery.split(" ");
            const textContent = split.filter((...args) => {
                return !tagFilterFunction(...args);
            });
            const tags = split.filter(tagFilterFunction);
            const realQuery = textContent.join(" ");

            // add to query params
            let queryExtra = "";
            for (const tag of tags) {
                if (tag.startsWith("user")) {
                    queryExtra += `&user=${tag.replace("user:", "")}`;
                }
                if (tag.startsWith("sort")) {
                    queryExtra += `&sortby=${tag.replace("sort:", "")}`;
                }
                if (tag.startsWith("featured")) {
                    const value = tag.replace("featured:", "");
                    const exclude = value === "false" || value === "exclude";
                    queryExtra += `&featured=${exclude ? "exclude" : "true"}`;
                }
            }

            api = `${
                LINK.projects
            }api/projects/search?page=${page}${queryExtra}&includes=${encodeURIComponent(
                realQuery
            )}`;
        }

        fetch(api)
            .then((response) => {
                response
                    .json()
                    .then((projectListResult) => {
                        const result = projectListResult.projects;
                        projects.push(...result);
                        projects = projects;
                        if (projects.length <= 0) {
                            projects = ["notfound"];
                            pageIsLast = true;
                        }
                        if (result.length < 20) {
                            pageIsLast = true;
                        }
                    })
                    .catch(() => {
                        requestFailed = true;
                    });
            })
            .catch(() => {
                requestFailed = true;
            });
    };

    onMount(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get("q");
        searchQuery = query;

        fetchNewProjects();
    });

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

<svelte:head>
    <title>PenguinMod - Search</title>
    <meta name="title"                   content="PenguinMod - Search{searchQuery ? ` for ${searchQuery}` : ''}" />
    <meta property="og:title"            content="PenguinMod - Search{searchQuery ? ` for ${searchQuery}` : ''}" />
    <meta property="twitter:title"       content="PenguinMod - Search{searchQuery ? ` for ${searchQuery}` : ''}">
    <meta name="description"             content={searchQuery ? `View things under "${searchQuery}" on PenguinMod.` : 'View some stuff uploaded to PenguinMod under a certain query.'}>
    <meta property="twitter:description" content={searchQuery ? `View things under "${searchQuery}" on PenguinMod.` : 'View some stuff uploaded to PenguinMod under a certain query.'}>
    <meta property="og:url"              content="https://penguinmod.com/search">
    <meta property="twitter:url"         content="https://penguinmod.com/search">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    <div class="section-info">
        <div>
            <h1>
                <LocalizedText
                    text="Search"
                    key="search.title"
                    lang={currentLang}
                />
            </h1>
            <p>
                {String(
                    TranslationHandler.text("search.query", currentLang)
                ).replace("$1", searchQuery)}
            </p>
        </div>
    </div>

    <div class="section-searchType">
        <Button
            label="Projects"
            link={searchQuery.startsWith("studio:")
                ? `?q=${searchQuery.replace("studio:", "")}`
                : `?q=${searchQuery}`}
        />
        <Button
            label="Studios"
            link={searchQuery.startsWith("studio:")
                ? `?q=${searchQuery}`
                : `?q=studio:${searchQuery}`}
        />
    </div>

    <div class="section-projects">
        {#if projects[0] !== "notfound"}
            {#each projects as project}
                <Project {...project} />
            {:else}
                <!-- projects.length === 0 -->
                <div style="margin-top: 16px;">
                    <LoadingSpinner enableTips={true} />
                </div>
            {/each}
        {:else}
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
        {/if}
    </div>

    {#if projects[0] !== "notfound"}
        {#if !pageIsLast && projects.length > 0}
            <div style="height: 16px;" />
            <div class="more-projects-wrapper">
                <Button
                    label="<img alt='More' src='dropdown-caret-hd.png' width='20'></img>"
                    on:click={() => {
                        page += 1;
                        fetchNewProjects();
                    }}
                />
            </div>
        {/if}
    {/if}

    <div style="height: 16px;" />
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
    .section-searchType {
        background: #b4eeff;
        height: 6rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
        text-align: center;
        display: none;
    }

    .more-projects-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
</style>
