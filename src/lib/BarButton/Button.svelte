<script>
    export let highlighted = false;
    export let link = false;
    export let label = "";
    export let noredirect = false;
</script>

{#if link}
    <a
        href={link}
        target={noredirect ? "_blank" : "_self"}
        style="text-decoration: none;"
    >
        <button class={highlighted ? "button button-highlight" : "button"}>
            {@html label}
            <slot />
        </button>
    </a>
{/if}
{#if !link}
    <button class={highlighted ? "button button-highlight" : "button"}>
        {@html label}
        <slot />
    </button>
{/if}

<style>
    .button {
        margin-left: 0.25rem;
        margin-right: 0.25rem;
        padding: 0.75rem 1rem;
        font-weight: 600;
        font-size: 0.85rem;
        border: 0px;
        border-radius: 4px;
        outline-width: 1px;
        outline-style: solid;
        outline-color: rgba(0, 0, 0, 0.15);
        color: white;
        background-color: transparent;
        cursor: pointer;
    }
    .button-highlight {
        outline: 0px;
        background-color: white;
        color: #00c3ff;
    }
    :global(body.dark-mode) .button-highlight {
        color: #009ccc;
    }
</style>
