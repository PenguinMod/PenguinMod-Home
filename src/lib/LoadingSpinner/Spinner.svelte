<script>
    import { onMount } from "svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import tips from './Tips.json'
    let tipId = Math.floor(Math.random() * tips)
    export let enableTips = false

    let langDecided = false;
    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
        langDecided = true;
    });
</script>

<div>
    <img alt="Loading" src="/loading.png" class="spinner-load" />
    {#if enableTips}
        <p>
            <LocalizedText
                text={tips[tipId]}
                key={`spinner.tips.${tipId}`}
                lang={currentLang}
            />
        </p>
    {/if}
</div>

<style>
    @keyframes spinning_basic {
        0% {
            rotate: 0deg;
        }
        50% {
            rotate: 180deg;
        }
        100% {
            rotate: 360deg;
        }
    }
    .spinner-load {
        animation-name: spinning_basic;
        animation-delay: 0s;
        animation-duration: 1s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;

        width: 64px;
        height: 64px;
    }
</style>
