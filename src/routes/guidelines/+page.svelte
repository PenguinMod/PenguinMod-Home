<script>
    import GuidelinesPages from "../../resources/markdown/guidelines/pages";
    const pages = Object.keys(GuidelinesPages);
    const amount = pages.length;
</script>

<h1>Guidelines</h1>
<br />
<p class="lil-guy">
    <b>{amount} page{amount > 1 ? "s" : ""} found</b>
</p>

{#each pages as page}
    <a href={`/guidelines/${page}`}>{page}</a>
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
