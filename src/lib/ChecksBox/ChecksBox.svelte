<script>
    export let items;
</script>

<div class="box">
    {#each items as item}
        <div class="item">
            <!-- if item.value is true it should show a green check, and a red x if not -->
            {#if item.value}
                <img src="/checkmark.png" alt="Success">
            {:else}
                <img src="/notallowed.png" alt="Fail">
            {/if}
            {item.name}
        </div>
    {/each}
</div>

<style>
    .box {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding: 4px;
        max-width: 60%;
    }

    .item {
        margin: 0.5rem;
    }

    .item img {
        width: 20px;
        height: 20px;
        margin-bottom: -5px;
    }
</style>