<script>
    import { run } from 'svelte/legacy';

    import Translations from "../../resources/translations.js";

    /**
     * @typedef {Object} Props
     * @property {string} [text]
     * @property {string} [key]
     * @property {string} [lang]
     * @property {boolean} [dolink]
     * @property {boolean} [html]
     * @property {any} [replace]
     */

    /** @type {Props} */
    let {
        text = "",
        key = "",
        lang = "",
        dolink = false,
        html = false,
        replace = {}
    } = $props();

    let displayText = $state('');
    let shouldHTML = $state(html);

    run(() => {
        const translated = Translations.textSafe(
            key,
            lang,
            text
        );
        displayText = translated;

        for (const key in replace) {
            const value = replace[key];
            displayText = displayText.replace(key, value);
        }

        if (dolink) {
            shouldHTML = true;
            displayText = displayText.replace(/TurboWarp|Turbowarp|Scratch/gm, (value) => {
                let url = "";
                switch (value) {
                    case "TurboWarp":
                        url = "https://turbowarp.org/";
                        break;
                    case "Scratch":
                        url = "https://scratch.mit.edu/";
                        break;
                }
                return `<a href="${url}" target="_blank" style="color: inherit">${value}</a>`;
            });
        }
    });
</script>

{#if shouldHTML}
    {@html displayText}
{:else}
    {displayText}
{/if}
