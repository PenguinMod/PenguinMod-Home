<script>
    import { onMount } from "svelte";
    import HTMLUtility from "../../resources/html.js";

    // Static values
    import LINK from "../../resources/urls.js";

    export let id;
    export let name;
    export let showdate = false;
    export let featured = false;
    export let owner;
    export let date = 0;
    export let style = "";
    export let dotsmenu = false;
    export let dotsoptions = [];

    export let linkOverride = false;
    export let openNewtab = false;

    function unixToDisplayDate(unix) {
        return `${new Date(Number(unix)).toDateString()} at ${new Date(
            Number(unix)
        ).toLocaleTimeString()}`;
    }

    const projectLink = linkOverride ? linkOverride : `${LINK.base}#${id}`;
    const projectAuthorLink = linkOverride
        ? linkOverride
        : `/profile?user=${owner}`;

    let dropdownMenu;
    function showDropdown(pointer) {
        dropdownMenu.style.display = "flex";
        dropdownMenu.style.left = `${pointer.x}px`;
        dropdownMenu.style.top = `${pointer.y}px`;
    }
    onMount(() => {
        window.addEventListener("mousedown", (e) => {
            if (!dropdownMenu) return;
            if (!HTMLUtility.isDescendantOf(dropdownMenu, e.target)) {
                dropdownMenu.style.display = "none";
            }
        });
    });
</script>

{#if dotsoptions.length > 0}
    <div bind:this={dropdownMenu} class="dropdown-options">
        {#each dotsoptions as option}
            {#if option.href}
                <a
                    href={option.href}
                    target={option.newtab ? "_blank" : "_self"}
                    class="dropdown-redirect"
                >
                    <button
                        class={"dropdown-option dropdown-option-" +
                            (option.color ? option.color : "default")}
                        on:click={option.callback ? option.callback : null}
                    >
                        {option.name}
                    </button>
                </a>
            {:else}
                <button
                    class={"dropdown-option dropdown-option-" +
                        (option.color ? option.color : "default")}
                    on:click={option.callback ? option.callback : null}
                >
                    {option.name}
                </button>
            {/if}
        {/each}
    </div>
{/if}

<div data-featured={featured} class="project" {style}>
    {#if dotsmenu}
        <button class="dots-menu" on:click={showDropdown}>
            <img class="dots-icon" src="/dots.svg" alt="..." />
        </button>
    {/if}
    <a
        href={projectLink}
        target={openNewtab ? "_blank" : "_self"}
        class="project-image"
    >
        <img
            src={`${LINK.projects}api/pmWrapper/iconUrl?id=${id}`}
            alt="Project Thumbnail"
            class="project-image"
        />
    </a>
    <a
        href={projectAuthorLink}
        target={openNewtab ? "_blank" : "_self"}
        class="project-author"
    >
        <img
            src={`https://trampoline.turbowarp.org/avatars/by-username/${owner}`}
            alt="Project Author"
            class="project-author"
        />
    </a>
    <div class="project-meta">
        <a
            href={projectLink}
            target={openNewtab ? "_blank" : "_self"}
            class="text"
            title={name}
        >
            {name}
        </a>
        {#if showdate}
            <a
                href={projectLink}
                target={openNewtab ? "_blank" : "_self"}
                class="text author date"
            >
                {unixToDisplayDate(date)}
            </a>
        {:else}
            <a
                href={projectAuthorLink}
                target={openNewtab ? "_blank" : "_self"}
                class="text author"
            >
                {owner}
            </a>
        {/if}
    </div>
    <slot />
</div>

<style>
    /* animations */
    @keyframes gradient {
        0% {
            background-position: 0% 0%;
        }
        100% {
            background-position: 100% 100%;
        }
    }

    /* stuff */
    .project {
        width: 204px;
        height: 204px;
        padding: 8px 8px 2px;
        margin: 4px;
        border-radius: 4px;
        border-style: solid;
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        position: relative;
    }
    .project-image {
        width: 204px;
        height: 152px;
        border-radius: 4px;
        overflow: hidden;
        object-fit: cover;
    }
    .project-author {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        overflow: hidden;
    }
    .project-meta {
        width: calc(100% - 8px);
        overflow: hidden;
        max-width: 164px;
        float: left;
        margin-left: 8px;
    }
    :global(body.dark-mode) .project[data-featured="false"] {
        border-color: rgba(255, 255, 255, 0.3);
    }

    /* featured projects */
    .project[data-featured="true"] {
        background-color: #ffc400;
        background: linear-gradient(
            145deg,
            rgba(255, 196, 0, 1) 0%,
            rgba(255, 196, 0, 1) 45%,
            rgba(255, 255, 255, 1) 50%,
            rgba(255, 196, 0, 1) 54%,
            rgba(255, 196, 0, 1) 100%
        );
        background-size: 300% 300%;
        animation: gradient 3s ease infinite;
    }

    .text {
        text-overflow: ellipsis;
        text-decoration: none;
        width: 100%;
        color: #4d97ff;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        font-weight: bold;
    }
    .author {
        color: #575e75;
        font-weight: normal;
    }
    :global(body.dark-mode) .author {
        color: #9ba0b1;
        font-weight: normal;
    }
    .date {
        font-size: 10px;
    }

    /* featured projects */
    .project[data-featured="true"] .text {
        color: rgb(0, 0, 0);
    }
    .project[data-featured="true"] .author {
        color: black;
    }

    .dots-menu {
        position: absolute;
        right: 8px;
        top: 8px;
        background: transparent;
        border: 0;
        border-radius: 4px;
        width: 24px;
        height: 24px;
        cursor: pointer;
        transition-duration: 250ms;
        overflow: hidden;
    }
    .dots-menu:focus,
    .dots-menu:hover {
        background: rgba(0, 0, 0, 0.1);
        transition-duration: 250ms;
    }
    .dots-menu:active {
        background: rgba(0, 0, 0, 0.25);
        transition-duration: 250ms;
    }

    .dots-icon {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
    }

    .dropdown-options {
        width: 128px;
        background: white;
        border-radius: 4px;
        outline-style: solid;
        outline-width: 4px;
        outline-color: rgba(0, 0, 0, 0.25);
        display: none;
        flex-direction: column;
        align-items: stretch;
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10000;
        padding: 6px;
    }

    .dropdown-option {
        border: 0;
        border-radius: 4px;
        margin: 2px 0px;
        background: transparent;
        cursor: pointer;
        padding: 4px 0px;
    }
    .dropdown-redirect {
        text-decoration: none;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    .dropdown-option-default:focus,
    .dropdown-option-default:hover {
        background: #00c3ff;
    }

    .dropdown-option-remix:focus,
    .dropdown-option-remix:hover {
        background: #48ac72;
    }
    .dropdown-option-gray:focus,
    .dropdown-option-gray:hover {
        background: #a1a1a1;
    }
    .dropdown-option-orange:focus,
    .dropdown-option-orange:hover {
        background: #ffab00;
    }
    .dropdown-option-red:focus,
    .dropdown-option-red:hover {
        background: #ff5151;
    }
</style>
