<script>
    import Translations from "../../resources/translations.js";

    export let text = "";
    export let key = "";
    export let lang = "";
    export let dolink = false;
    export let html = false;
    export let replace = {};

    let displayText = '';
    let shouldHTML = html;

    $: {
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
    }
</script>

{#if shouldHTML}
    {@html displayText}
{:else}
    {displayText}
{/if}
