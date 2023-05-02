<script>
    export let header = false;
    export let seemore = false;
</script>

<div class="section">
    {#if header}
        <div class="header">
            <p style="margin-block: 6px;"><b>{header}</b></p>
            {#if seemore}
                <p style="margin-block: 6px;"><a href={seemore}>See more</a></p>
            {/if}
        </div>
    {/if}
    <div class="container"><slot /></div>
</div>

<style>
    a {
        color: dodgerblue;
    }

    .section {
        width: 30%;
        margin: 10px;
        border-radius: 8px;
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.3);
        border-style: solid;
        padding: 4px;
    }
    .header {
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 0 0.35rem;
    }
    .container {
        height: 312px;
        margin: 6px;
        overflow: auto;
    }
</style>
