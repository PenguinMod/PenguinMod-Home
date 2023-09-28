<script>
    import { onMount, onDestroy } from "svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import tips from './Tips.json'
    let tipId = Math.floor(Math.random() * tips.length)
    export let enableTips = false
    const inter = setInterval(() => {
        tipId = Math.floor(Math.random() * tips.length)
    }, 7000)

    let currentLang = "en";
    onMount(() => Language.forceUpdate());
    onDestroy(() => clearInterval(inter))
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

<div class="centerer">
    <img alt="Loading" src="/loading.png" class="spinner-load" />
    <br />
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
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .centerer {
        text-align: center;
        width: 100%;
        height: 100%;
    }

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
