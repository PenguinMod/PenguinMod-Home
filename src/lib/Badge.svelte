<script>
    import { Portal } from 'svelte-portal';
    import { onMount } from "svelte";

    // Static values
    import ProfileBadges from "../resources/badges.js";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../resources/translations.js";
    import Language from "../resources/language.js";

    export let badge = "test";
    export let currentLang = "en";

    let badgeIsFocused = false;
    let badgeEl;
    let badgeInfoPos = { top: 0, left: 0 };

    const showBadgeInfo = () => {
        badgeIsFocused = true;

        // Wait for DOM to render
        setTimeout(() => {
            const rect = badgeEl.getBoundingClientRect();
            badgeInfoPos.top = rect.bottom + 6;
            badgeInfoPos.left = rect.left + rect.width / 2;
        });
    };

    const hideBadgeInfo = () => {
        badgeIsFocused = false;
    };
</script>

<button
    class="badge"
    bind:this={badgeEl}
    on:click={showBadgeInfo}
    on:focusout={hideBadgeInfo}
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
</button>

{#if badgeIsFocused}
    <Portal>
        <div
            class="badge-info"
            style="
                top: {badgeInfoPos.top}px;
                left: {badgeInfoPos.left}px;
                transform: translateX(-50%);
            "
        >
            {TranslationHandler.text(
                `profile.badge.${badge}`,
                currentLang
            ) || TranslationHandler.text(
                `profile.badge.${badge}`,
                'en'
            )}
        </div>
    </Portal>
{/if}

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
        position: fixed;
        z-index: 9999;
        width: 128px;
        padding: 8px 16px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: solid 1px gray;
        border-radius: 0 8px;
        pointer-events: none;
        white-space: nowrap;
    }
</style>
