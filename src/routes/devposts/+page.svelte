<script>
    import DevPostsPages from "../../resources/markdown/devposts/pages";
    const pages = Object.keys(DevPostsPages);
    const amount = pages.length;
</script>

<h1>Dev Posts</h1>
<br />
<p class="lil-guy">
    <b>{amount} page{amount > 1 ? "s" : ""} found</b>
</p>

{#each pages as page}
    <a href={`/devposts/${page}`}>{page}</a>
{/each}

<div style="height: 32px;" />

<style>
    .lil-guy {
        font-size: small;
    }
    :global(body.dark-mode) {
        color: white;
    }
</style>
