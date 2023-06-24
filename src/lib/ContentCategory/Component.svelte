<script>
    import { onMount } from "svelte";

    export let header = false;
    export let seemore = false;
    export let style = "";
    export let stylec = "";

    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

<div class="section" {style}>
    {#if header}
        <div class="header">
            <p style="margin-block: 6px;"><b>{header}</b></p>
            {#if seemore}
                <p style="margin-block: 6px;">
                    <a href={seemore}>
                        <LocalizedText
                            text="See more"
                            key="home.seemore"
                            lang={currentLang}
                        />
                    </a>
                </p>
            {/if}
        </div>
    {/if}
    <div style={stylec} class="container"><slot /></div>
</div>

<style>
    a {
        color: dodgerblue;
    }

    .section {
        width: 30%;
        margin: 10px;
        border-radius: 8px;
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.3);
        border-style: solid;
        padding: 4px;
    }
    .header {
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin: 0 0.35rem;
    }
    .container {
        height: 312px;
        margin: 6px;
        overflow: auto;
    }

    :global(body.dark-mode) .section {
        border-color: rgba(255, 255, 255, 0.3);
    }
    :global(body.dark-mode) .header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }
</style>
