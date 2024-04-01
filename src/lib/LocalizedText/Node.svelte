<script>
    import Translations from "../../resources/translations.js";

    export let text = "";
    export let key = "";
    export let lang = "";
    export let dontlink = false;
    export let html = false;
    export let replace = {};

    let displayText = '';
    let shouldHTML = html;

    $: {
        const translated = String(Translations.text(key, lang) || Translations.text(key, 'en') || text);
        displayText = translated;

        for (const key in replace) {
            const value = replace[key];
            displayText = displayText.replace(key, value);
        }

        if (!dontlink) {
            shouldHTML = true;
            displayText = displayText.replace(/TurboWarp|Scratch/gm, (value) => {
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
    }
</script>

{#if shouldHTML}
    {@html displayText}
{:else}
    {displayText}
{/if}
