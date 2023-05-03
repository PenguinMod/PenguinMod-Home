<script>
    // Static values
    import LINK from "../../resources/urls.js";

    export let id;
    export let name;
    export let showdate = false;
    export let owner;
    export let date = 0;
    export let style = "";

    function unixToDisplayDate(unix) {
        return `${new Date(Number(unix)).toDateString()} at ${new Date(
            Number(unix)
        ).toLocaleTimeString()}`;
    }

    const projectLink = `${LINK.base}#${id}`;
    const projectAuthorLink = `${LINK.projects}?user=${owner}`;
</script>

<div class="project" {style}>
    <a href={projectLink} class="project-image">
        <img
            src={`${LINK.projects}api/pmWrapper/iconUrl?id=${id}`}
            alt="Project Thumbnail"
            class="project-image"
        />
    </a>
    <a href={projectAuthorLink} class="project-author">
        <img
            src={`${LINK.projects}api/pmWrapper/scratchUserImage?username=${owner}`}
            alt="Project Author"
            class="project-author"
        />
    </a>
    <div class="project-meta">
        <a href={projectLink} class="text">{name}</a>
        {#if showdate}
            <a href={projectLink} class="text author date">
                {unixToDisplayDate(date)}
            </a>
        {:else}
            <a href={projectAuthorLink} class="text author">{owner}</a>
        {/if}
    </div>
    <slot />
</div>

<style>
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
    .date {
        font-size: 10px;
    }
</style>
