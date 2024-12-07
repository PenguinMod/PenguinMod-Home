<script>
    import Stats from './stats.svelte';
    import { onMount } from 'svelte';

    export let stats_data;
    export let render = false;

    let object_clicks = {};

    onMount(() => {
        stats_data.forEach(stat => {
            if (typeof stat === 'object') {
                object_clicks[stat.name] = false;
            }
        })
    });
</script>

{#if stats_data && render}
    {#each stats_data as stat}
        {#if typeof stat === 'object'}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <p class="click_object" on:click={() => {object_clicks[stat.name] = !object_clicks[stat.name]}}>{object_clicks[stat.name] ? ">" : "v"} {stat.name}</p>
            <Stats stats_data={stat.value} bind:render={object_clicks[stat.name]} />
        {:else}
            <p>{stat}</p>
        {/if}
    {/each}
{/if}

<style>
    .click_object {
        cursor: pointer;
        /* underline */
        text-decoration: underline;
    }
</style>
