<script>
    export let highlighted = false;
    export let link = false;
    export let label = "Button";
    export let noredirect = false;

    // extras
    export let icon = false;
    export let color = false;
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
        >
            {#if icon}
                <img src={`/${icon}`} alt={icon} style="margin-right:6px;" />
            {/if}
            {@html label}
        </button>
    </a>
{/if}
{#if !link}
    <button
        class={(highlighted ? "button button-highlight" : "button") +
            (color ? ` ${color}` : "")}
    >
        {#if icon}
            <img src={`/${icon}`} alt={icon} style="margin-right:6px;" />
        {/if}
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
    .button:focus {
        outline-width: 4px;
    }
    .button-highlight {
        outline: 0px;
        background-color: white;
        color: #00c3ff;
    }

    .remix {
        background-color: #48ac72;
        outline-color: rgba(72, 172, 114, 0.35);
    }
    .gray {
        background-color: #a1a1a1;
        outline-color: rgba(155, 155, 155, 0.35);
    }
    .orange {
        background-color: #ffab00;
        outline-color: rgba(255, 171, 0, 0.35);
    }
</style>
