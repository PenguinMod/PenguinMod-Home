<script>
    import { onMount } from "svelte";

	import LocalizedText from "$lib/LocalizedText/Node.svelte";
	import Translations from "../../resources/translations.js";
	import Language from "../../resources/language.js";
    
	import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    
    export let items;
    
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
                <LoadingSpinner style="width:20px;height:20px;margin-bottom:-5px;" single={true} />
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
</style>