<script>
    import { onMount } from "svelte";
    import Language from "../../resources/language.js";
    import EventPages from "../../resources/markdown/events/pages.js";

    const isHavingEvent = false;
    const eventName = "Super 2025 PenguinJam";
    const eventPath = "penguinjamsuper2025";
    
    let currentLang = "en";
    let pageLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
        if (EventPages[eventPath][currentLang]) {
            pageLang = currentLang;
        }
    });
</script>

{#if isHavingEvent}
    <a href="/events/{eventPath}?l={pageLang}">
        <button title={eventName}>
            <img
                src="/events/{pageLang}/{eventPath}.webp"
                title={eventName}
                alt={eventName}
            >
        </button>
    </a>
{/if}

<style>
    a {
        width: 100%;
        max-width: 1530px;
        text-decoration: none;
    }
    button {
        width: 100%;
        height: 320px;
        margin: 8px 0;
        border: 0;
        border-radius: 16px;
        background: none;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    img {
        width: 100%;
        height: 100%;
        max-width: 1530px;
        object-fit: cover;
        transform-origin: center;
        transition-duration: 0.35s;
        border-radius: 16px;
    }

    button:hover img {
        transform: scale(1.1);
        transition-duration: 0.35s;
    }
</style>
