<script>
    import Stats from './stats.svelte';
    import { onMount } from 'svelte';

    /**
     * @typedef {Object} Props
     * @property {any} stats_data
     * @property {boolean} [render]
     */

    /** @type {Props} */
    let { stats_data, render = false } = $props();

    let object_clicks = $state({});

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
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <p 
                class="click_object" 
                onclick={() => {object_clicks[stat.name] = !object_clicks[stat.name]}}
            >
                {object_clicks[stat.name] ? "v" : ">"} {stat.name}
            </p>
            <div style="padding-left: 10px; border-left: 1px solid grey">
                <Stats stats_data={stat.value} bind:render={object_clicks[stat.name]} />
            </div>
        {:else}
            <span>{stat}</span><br>
        {/if}
    {/each}
{/if}

<style>
    .click_object {
        cursor: pointer;
        /* underline */
        text-decoration: underline;
        margin-left: -3px;
        margin-top: 10px;
        margin-bottom: 0px;
    }
</style>