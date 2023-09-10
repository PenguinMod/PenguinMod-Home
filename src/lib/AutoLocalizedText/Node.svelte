<script>
    import { onMount } from "svelte";
    import AutoTranslate from "../../resources/autoTranslate.js";

    export let text = "";

    onMount(() => {
        const locale = navigator.language;
        AutoTranslate.translate(text, locale).then((newtext) => {
            text = newtext;
        });
    });
</script>

{text}
