<script>
    import { onMount, onDestroy } from "svelte";
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import tips from './Tips.json';
    
    export let enableTips = false;
    export let single = false;
    
    export let icon = "/loading.png";
    export let style = "width: 64px; height: 64px;";

    let tipId = Math.round(Math.random() * (tips.length - 1));
    const inter = setInterval(() => {
        tipId = Math.round(Math.random() * (tips.length - 1));
    }, 7000);

    let currentLang = "en";
    onMount(() => Language.forceUpdate());
    onDestroy(() => clearInterval(inter));
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

{#if single}
    <img
        src={icon}
        alt="Loading"
        class="spinner-load"
        {style}
    />
{:else}
    <div class="centerer">
        <img
            src={icon}
            alt="Loading"
            class="spinner-load"
            {style}
        />
        {#if enableTips}
            <br />
            <p>
                <LocalizedText
                    text={tips[tipId]}
                    key={`spinner.tips.${tipId}`}
                    lang={currentLang}
                />
            </p>
        {/if}
    </div>
{/if}

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .centerer {
        text-align: center;
    }

    @keyframes spinning_basic {
        0% {
            transform: rotate(0deg);
        }
        50% {
            transform: rotate(180deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
    .spinner-load {
        animation-name: spinning_basic;
        animation-delay: 0s;
        animation-duration: 1s;
        animation-iteration-count: infinite;
        animation-timing-function: linear;

        /* stop highlighting */
        -webkit-touch-callout: none; /* iOS Safari              */
        -webkit-user-select: none;  /* Safari                  */
        -khtml-user-select: none;  /* Konqueror HTML          */
        -moz-user-select: none;   /* Old versions of Firefox */
        -ms-user-select: none;   /* Internet Explorer/Edge  */
        user-select: none;      /* Non-prefixed version    */
    }
</style>
