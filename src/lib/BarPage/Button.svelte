<script>
    import { createEventDispatcher } from "svelte";
    import Translations from "../../resources/translations.js";

    export let link = false;
    export let label = "";
    export let style = "";
    export let noredirect = false;
    export let classActor = "";
    export let id = "";
    export let title = "";
    export let lang = "en";

    const dispatch = createEventDispatcher();

    function event(...args) {
        dispatch("click", ...args);
    }

    $: {
        if (!title == "") {
            const translated = Translations.textSafe(
                title,
                lang,
                title
            );
            title = translated;
        }
    }
</script>

{#if !link}
    <button
        class={`button${classActor ? ` ca-${classActor}` : ""}`}
        on:click={event}
        {style}
        {id}
        {title}
    >
        {@html label}
        <slot />
    </button>
{:else}
    <a
        href={link}
        target={noredirect ? "_blank" : "_self"}
        style="text-decoration: none;"
        class={`${classActor ? ` ca-${classActor}` : ""}`}
        {title}
    >
        <button class="button" on:click={event} {style} {id}>
            {@html label}
            <slot />
        </button>
    </a>
{/if}

<style>
    .button {
        position: relative;
        margin-left: 0.1rem;
        margin-right: 0.1rem;
        padding: 0.75rem;
        font-weight: 600;
        font-size: 0.85rem;
        border: 0px;
        border-radius: 4px;
        outline: 0px;
        color: white;
        background-color: transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .button:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    :global(html[dir="rtl"]) .ca-languageButton {
        left: initial !important;
        right: 12px !important;
    }
    :global(body.launcher-mode) .ca-languageButton {
        position: absolute;
        left: 12px !important;
        bottom: 8px;
    }
    :global(body.launcher-mode) .ca-themeSwitcher {
        position: absolute;
        bottom: 96px;
    }
</style>
