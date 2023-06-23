<script>
    export let link;
    export let userLink;
    export let text;
    export let author;
    export let image;
</script>

<div class="display" title={author + ": " + text}>
    <a href={userLink} class="display-author">
        <img src={image} alt="Display Author" class="display-author" />
    </a>
    <div class="display-meta">
        <a href={link} class="text">{text}</a>
        <a href={userLink} class="text author">{author}</a>
    </div>
</div>

<style>
    .display {
        width: 100%;
        display: flex;
        flex-direction: row;
    }

    .display-author {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        overflow: hidden;
        display: block;
    }
    .display-meta {
        width: calc(100% - 32px);
        overflow: hidden;
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
    :global(body.dark-mode) .author {
        color: #9ba0b1;
    }
</style>
