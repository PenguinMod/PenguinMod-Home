<script>
    import EventsPages from "../../events/pages";
    const pages = Object.keys(EventsPages);
    const amount = pages.length;
</script>

<h1>Events</h1>
<br />
<p class="lil-guy">
    <b>{amount} page{amount > 1 ? "s" : ""} found</b>
</p>

{#each pages as page}
    <a href={`/events/${page}`}>{page}</a>
{/each}

<div style="height: 32px;"></div>

<style>
    .lil-guy {
        font-size: small;
    }
    :global(body.dark-mode) {
        color: white;
    }
</style>
