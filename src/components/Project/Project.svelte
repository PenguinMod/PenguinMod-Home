<script>
    // Static values
    import LINK from "../../resources/urls.js";

    export let id;
    export let name;
    export let owner;
    export let featured;

    const projectLink = `${LINK.base}#${id}`;
    const projectAuthorLink = `${LINK.projects}?user=${owner}`;
</script>

<div class="project">
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
        <a href={projectAuthorLink} class="text author">{owner}</a>
    </div>
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
</style>
