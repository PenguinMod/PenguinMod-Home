<script>
    import Translations from "../../resources/translations.js";

    export let text = "";
    export let key = "";
    export let lang = "";
    export let dontlink = false;
</script>

<!-- this code sucks but no ones gonna see it soooo -->
{#if String(Translations.text(key, lang) ? Translations.text(key, lang) : text).match(/TurboWarp|Scratch/m) && !dontlink}
    {@html String(
        Translations.text(key, lang) ? Translations.text(key, lang) : text
    ).replace(/TurboWarp|Scratch/gm, (value) => {
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
    })}
{:else}
    {Translations.text(key, lang) ? Translations.text(key, lang) : text}
{/if}
