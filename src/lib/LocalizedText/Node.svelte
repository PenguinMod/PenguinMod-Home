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

    $effect(() => {
        const translated = Translations.textSafe(
            key,
            lang,
            text
        );
        let tmp_dtext = translated;

        for (const key in replace) {
            const value = replace[key];
            tmp_dtext = tmp_dtext.replace(key, value);
        }

        if (dolink) {
            shouldHTML = true;
            displayText = tmp_dtext.replace(/TurboWarp|Turbowarp|Scratch/gm, (value) => {
                console.log(value, tmp_dtext);
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
        } else {
            displayText = tmp_dtext;
        }
    });
</script>

{#if shouldHTML}
    {@html displayText}
{:else}
    {displayText}
{/if}
