<script>
    export let highlighted;
    export let link;
    export let label;
</script>

{#if link}
    <a href={link} target="_blank" style="text-decoration: none;">
        <button class={highlighted ? "button button-highlight" : "button"}>
            {@html label}
        </button>
    </a>
{/if}
{#if !link}
    <button class={highlighted ? "button button-highlight" : "button"}>
        {@html label}
    </button>
{/if}

<style>
    .button {
        margin-left: 0.25rem;
        margin-right: 0.25rem;
        padding: 1rem 1rem;
        font-weight: 600;
        font-size: 1.1rem;
        border: 0px;
        border-radius: 4px;
        outline-width: 2px;
        outline-style: solid;
        outline-color: rgba(0, 195, 255, 0.35);
        color: white;
        background-color: #00c3ff;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .button-highlight {
        outline: 0px;
        background-color: white;
        color: #00c3ff;
    }
</style>
