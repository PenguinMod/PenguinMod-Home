<script>
    import { createEventDispatcher } from "svelte";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    // Static values
    import LINK from "../../resources/urls.js";

    export let id;
    export let title;
    export let lastUpdate = false;
    export let featured = false;
    export let author;
    //export let date = 0; // when the project was originally uploaded
    export let style = "";
    export let showdate = true;

    function unixToDisplayDate(unix) {
        unix = Number(unix);
        return `${new Date(unix).toLocaleString([], {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        })}`;
    }

    const dispatch = createEventDispatcher();

    function event() {
        dispatch("click");
    }
</script>

<button class="project" data-featured={featured} {style} on:click={event}>
    <div class="project-image">
        <img
            src={`${LINK.projects}api/v1/projects/getproject?projectID=${id}&requestType=thumbnail`}
            alt="Project Thumbnail"
            class="project-image"
        />
    </div>
    <div class="project-author">
        <img
            src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${author}`}
            alt="Project Author"
            class="project-author"
        />
    </div>
    <div class="project-meta">
        <div class="text" title={title}>
            {title}
        </div>
        {#if showdate}
            <div class="text author date">
                {unixToDisplayDate(lastUpdate)}
            </div>
        {:else}
            <div class="text author">
                {author}
            </div>
        {/if}
    </div>
    <slot />
</button>

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
        font-size: 16px;
        appearance: none;
        box-sizing: unset;
        background: transparent;
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
        text-align: left;
        cursor: pointer;
    }
    .project:focus {
        outline: 4px rgba(0, 0, 0, 0.35) solid;
    }
    .project-image {
        width: 204px;
        height: 152px;
        border-radius: 4px;
        overflow: hidden;
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
    :global(body.dark-mode) .project[data-featured="false"]:focus {
        outline: 4px rgba(255, 255, 255, 0.15) solid;
    }
    :global(body.dark-mode) .project[data-featured="true"]:focus {
        outline: 4px rgba(255, 255, 255, 0.35) solid;
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
</style>
