<script>
    import { createEventDispatcher } from "svelte";

    export let highlighted = false;
    export let link = false;
    export let toggled = false;
    export let label = "";
    export let noredirect = false;
    export let style = '';
    export let small = false;

    // extras
    export let icon = false;
    export let color = false;

    const dispatch = createEventDispatcher();

    function event() {
        dispatch("click");
    }
</script>

{#if link}
    <a
        href={link}
        target={noredirect ? "_blank" : "_self"}
        style="text-decoration: none; {style}"
    >
        <button
            class={(highlighted ? "button button-highlight" : "button") +
                (color ? ` ${color}` : "") +
                (small ? " button-regular" : "")}
            on:click={event}
        >
            {#if icon}
                <img src={`/${icon}`} alt={icon} style="margin-right:6px;" />
            {/if}
            {@html label}
            <slot />
        </button>
    </a>
{/if}
{#if !link}
    <button
        class={(highlighted ? "button button-highlight" : "button") +
            (color ? ` ${color}` : "") +
            (toggled ? " button-toggled" : "") +
            (small ? " button-regular" : "")}
        {style}
        on:click={event}
    >
        {#if icon}
            <img src={`/${icon}`} alt={icon} style="margin-right:6px;" />
        {/if}
        {@html label}
        <slot />
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
        border-color: rgba(0, 195, 255, 0.35);
        color: white;
        background-color: #00c3ff;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .button-regular {
        margin: revert;
        padding: revert;
        border: revert;
        font: inherit;
        font-size: 13.333px;
        outline: revert;
        border-color: rgba(0, 195, 255, 0.35);
        justify-content: center;
        color: black;
        display: inline-flex;
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
        border-color: rgba(72, 172, 114, 0.35);
        color: white;
    }
    .gray {
        background-color: #797979;
        outline-color: rgba(112, 112, 112, 0.35);
        border-color: rgba(112, 112, 112, 0.35);
        color: white;
    }
    .orange {
        background-color: #ffab00;
        outline-color: rgba(255, 171, 0, 0.35);
        border-color: rgba(255, 171, 0, 0.35);
    }
    .red {
        background-color: #ff5151;
        outline-color: rgba(255, 81, 81, 0.35);
        border-color: rgba(255, 81, 81, 0.35);
        color: white;
    }
    .purple {
        background-color: #ab51ff;
        outline-color: rgba(185, 81, 255, 0.35);
        border-color: rgba(185, 81, 255, 0.35);
        color: white;
    }
</style>
