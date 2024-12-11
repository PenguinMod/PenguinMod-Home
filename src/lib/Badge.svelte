<script>
    import { onMount } from "svelte";

    // Static values
    import ProfileBadges from "../resources/badges.js";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../resources/translations.js";
    import Language from "../resources/language.js";

    /**
     * @typedef {Object} Props
     * @property {string} [badge]
     * @property {string} [currentLang]
     */

    /** @type {Props} */
    let { badge = "test", currentLang = "en" } = $props();

    let badgeIsFocused = $state(false);
    const badgeFocus = () => {
        badgeIsFocused = true;
    };
    const badgeUnfocus = () => {
        badgeIsFocused = false;
    };
</script>

<button
    class="badge"
    onclick={badgeFocus}
    onfocusout={badgeUnfocus}
    title={TranslationHandler.text(
        `profile.badge.${badge}`,
        currentLang
    ) || TranslationHandler.text(
        `profile.badge.${badge}`,
        'en'
    )}
>
    <img
        src={`/badges/${ProfileBadges[badge]}.png`}
        alt={TranslationHandler.text(
            `profile.badge.${badge}`,
            currentLang
        ) || TranslationHandler.text(
            `profile.badge.${badge}`,
            'en'
        )}
        title={TranslationHandler.text(
            `profile.badge.${badge}`,
            currentLang
        ) || TranslationHandler.text(
            `profile.badge.${badge}`,
            'en'
        )}
    />
    {#if badgeIsFocused}
        <div class="badge-info">
            {TranslationHandler.text(
                `profile.badge.${badge}`,
                currentLang
            ) || TranslationHandler.text(
                `profile.badge.${badge}`,
                'en'
            )}
        </div>
    {/if}
</button>

<style>
    .badge {
        position: relative;
        margin: 0 4px;
        border: 0;
        padding: 0;
        width: 32px;
        height: 32px;
        background: transparent;
        cursor: pointer;
    }
    .badge img {
        margin: 0;
        border: 0;
        padding: 0;
        width: 32px;
        height: 32px;
    }

    .badge-info {
        position: absolute;
        top: 36px;
        left: 0;
        width: 128px;
        padding: 8px 16px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        transform-origin: center;
        transform: translateX(calc(50% - 64px));
        z-index: 5000;
    }
</style>