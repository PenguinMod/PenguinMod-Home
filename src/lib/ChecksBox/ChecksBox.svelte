<script>
    import { onMount } from "svelte";

    export let items;
	import LocalizedText from "$lib/LocalizedText/Node.svelte";
	import Translations from "../../resources/translations.js";
	import Language from "../../resources/language.js";
    
	let currentLang = "en";
	onMount(() => {
		Language.forceUpdate();
	});
	Language.onChange((lang) => {
		currentLang = lang;
	});
</script>

<div class="box">
    {#each items as item}
        <div class="item">
            <!-- if item.value is true it should show a green check, and a red x if not -->
            <!-- keywords are checked first since they also equal true -->
            {#if item.value === "loading"}
                <img src="/loading.png" alt="Loading" class="spinner">
            {:else if item.value}
                <img src="/checkmark.png" alt="Success">
            {:else}
                <img src="/notallowed.png" alt="Fail">
            {/if}

            <LocalizedText
                text={item.name}
                key={item.name}
                lang={currentLang}
            />
        </div>
    {/each}
</div>

<style>
    .box {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding: 4px;
        max-width: 60%;
    }

    .item {
        margin: 0.5rem;
    }

    .item img {
        width: 20px;
        height: 20px;
        margin-bottom: -5px;
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
    .spinner {
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