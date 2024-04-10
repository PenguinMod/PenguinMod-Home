<script>
    import { page } from "$app/stores";
    import { onMount } from "svelte";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import Error404 from "$lib/Game404/Component.svelte";
    
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../resources/translations.js";
    import Language from "../resources/language.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    let pageStatus = Number($page.url.searchParams.get("error")) || $page.status;

    let displayGame = false;
    let showGameVignette = false;
    const showGame = () => {
        if (pageStatus !== 404) return;
        displayGame = true;
        showGameVignette = true;
    };
    const hideGame = () => {
        showGameVignette = false;
    };

    const getErrorImage = (status) => {
        switch (status) {
            case 401:
            case 403:
            case 405:
            case 408:
            case 409:
            case 413:
            case 415:
            case 429:
            case 501:
            case 502:
            case 503:
            case 504:
            case 507:
            case 508:
                return `/errors/${status}.png`;
            case 400:
                return "/vr/warning.png";
            case 500:
                return "/penguins/server.svg";
            default:
                return "/penguins/confused.svg";
        }
    };
    const getTranslatedError = (status, currentLang) => {
        return TranslationHandler.text(`navigation.error.${status}`, currentLang)
            || TranslationHandler.text(`navigation.error.${status}`, 'en')
            || TranslationHandler.text(`navigation.error.unknown`, currentLang)
            || TranslationHandler.text(`navigation.error.unknown`, 'en');
    }
</script>

<svelte:head>
    <title>PenguinMod - {pageStatus}</title>
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home">
    <meta name="description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="twitter:description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>

<NavigationBar />
<NavigationMargin />

<div class="center-div">
    <div class="card">
        <div class="text-container">
            <h1>{pageStatus}</h1>
            <h2>{getTranslatedError(pageStatus, currentLang)}</h2>
        </div>

        <div class="image-container">
            <button class="image-button" on:click={showGame}>
                <img
                    src={getErrorImage(pageStatus)}
                    alt="{pageStatus} - {$page.error.message}"
                    title="{pageStatus} - {$page.error.message}"
                />
            </button>
        </div>

        <a href="../" class="bottom-left">
            <Button>
                <LocalizedText
                    text="Go back"
                    key="redirect.leave"
                    lang={currentLang}
                />
            </Button>
        </a>
    </div>
</div>

{#if displayGame}
    <div class="vignette" style={showGameVignette ? '' : 'display: none;'}>
        <Error404 />
        <Button on:click={hideGame}>
            <LocalizedText
                text="Go back"
                key="redirect.leave"
                lang={currentLang}
            />
        </Button>
    </div>
{/if}

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .text-container {
        width: 50%;
    }
    .image-container {
        position: absolute;
        right: 0;
        top: 0;
        width: 40%;
        height: 100%;
        padding-right: 24px;
        overflow: hidden;
        
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
    }
    :global(html[dir="rtl"]) .image-container {
        padding-right: initial;
        right: initial;
        padding-left: 12px;
        left: 0;
        align-items: flex-start;
    }
    .image-button {
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;

        width: 100%;
        height: 60%;
    }
    .image-button > img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
    .vignette {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 50%);
        z-index: 999999;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    h1 {
        font-size: 96px;
        margin-block: 0;
    }
    a {
        text-decoration: none;
    }

    .center-div {
        position: absolute;
        left: 0;
        top: 3rem;
        width: 100%;
        height: calc(100% - 3rem);

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .bottom-left {
        position: absolute;
        left: 12px;
        bottom: 12px;
    }
    :global(html[dir="rtl"]) .bottom-left {
        left: initial;
        right: 12px;
    }

    .card {
        position: relative;
        width: 70%;
        height: 60%;
        border-radius: 8px;
        padding: 24px 16px;

        border: 1px solid rgba(0, 0, 0, 35%);
        overflow: auto;
    }
    :global(body.dark-mode) .card {
        border-color: rgba(255, 255, 255, 35%);
    }
    :global(body.dark-mode) {
        color: white;
    }
    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
