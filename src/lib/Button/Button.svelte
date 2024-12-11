<script>
    import { createEventDispatcher } from "svelte";


    
    /**
     * @typedef {Object} Props
     * @property {boolean} [highlighted]
     * @property {boolean} [link]
     * @property {boolean} [toggled]
     * @property {string} [label]
     * @property {boolean} [noredirect]
     * @property {boolean} [icon] - extras
     * @property {boolean} [color]
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {Props} */
    let {
        highlighted = false,
        link = false,
        toggled = false,
        label = "",
        noredirect = false,
        icon = false,
        color = false,
        children
    } = $props();

    const dispatch = createEventDispatcher();

    function event() {
        dispatch("click");
    }
</script>

{#if link}
    <a
        href={link}
        target={noredirect ? "_blank" : "_self"}
        style="text-decoration: none;"
    >
        <button
            class={(highlighted ? "button button-highlight" : "button") +
                (color ? ` ${color}` : "")}
            onclick={event}
        >
            {#if icon}
                <img src={`/${icon}`} alt={icon} style="margin-right:6px;" />
            {/if}
            {@html label}
            {@render children?.()}
        </button>
    </a>
{/if}
{#if !link}
    <button
        class={(highlighted ? "button button-highlight" : "button") +
            (color ? ` ${color}` : "") +
            (toggled ? " button-toggled" : "")}
        onclick={event}
    >
        {#if icon}
            <img src={`/${icon}`} alt={icon} style="margin-right:6px;" />
        {/if}
        {@html label}
        {@render children?.()}
    </button>
{/if}

<style>
    .button {
        margin: 0.25rem;
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
    .button:focus {
        outline-width: 4px;
    }
    .button-highlight {
        outline: 0px;
        background-color: white;
        color: #00c3ff;
    }
    .button-toggled {
        background-color: transparent !important;
        outline-color: rgba(0, 0, 0, 0.1) !important;
        border: 1px solid rgba(0, 0, 0, 0.35);
        color: black;
        font-weight: normal;
    }
    :global(body.dark-mode) .button-toggled {
        outline-color: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.35);
        color: white;
    }

    .remix {
        background-color: #48ac72;
        outline-color: rgba(72, 172, 114, 0.35);
    }
    .gray {
        background-color: #797979;
        outline-color: rgba(112, 112, 112, 0.35);
    }
    .orange {
        background-color: #ffab00;
        outline-color: rgba(255, 171, 0, 0.35);
    }
    .red {
        background-color: #ff5151;
        outline-color: rgba(255, 81, 81, 0.35);
    }
    .purple {
        background-color: #ab51ff;
        outline-color: rgba(185, 81, 255, 0.35);
    }
</style>
