<script>
    import { onMount } from "svelte";
    import AutoTranslate from "../../resources/autoTranslate.js";

    /**
     * @typedef {Object} Props
     * @property {string} [text]
     */

    /** @type {Props} */
    let { text = $bindable("") } = $props();

    onMount(() => {
        const locale = navigator.language;
        AutoTranslate.translate(text, locale).then((newtext) => {
            text = newtext;
        });
    });
</script>

{text}
