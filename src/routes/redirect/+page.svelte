<script>
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { browser } from '$app/environment';

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    const xmlEscape = function (unsafe) {
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            }
        });
    };

    let url = '';
    let urlOrigin = '';
    try {
        const path = atob(browser ? $page.url.searchParams.get('t') : "");
        const urlObj = new URL(path);
        url = path;
        urlOrigin = urlObj.hostname;
    } catch {
        if (!browser) {
            url = 'https://penguinmod.com/';
            urlOrigin = 'Unknown';
        } else {
            location.href = location.origin + '/error?error=404';
        }
    }

    let canVisit = false;
    const tryClosingTab = () => {
        const parent = window.opener || window.parent;
        const parentIsNotThis = parent !== window;
        if (parent && parentIsNotThis) {
            window.close();
            return;
        }
        location.href = location.origin;
    };
    onMount(() => {
        setTimeout(() => {
            canVisit = true;
        }, 2000);
    });
</script>

<svelte:head>
    <title>PenguinMod - Redirecting</title>
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
    <img
        src="/vr/warning.png"
        alt="Warning"
        title="!!!"
        height="128"
    />
    <h1>
        <LocalizedText
            text="You are leaving PenguinMod"
            key="redirect.title"
            lang={currentLang}
        />
    </h1>
    <p>
        <LocalizedText
            text="You are leaving PenguinMod to visit &qt;{"{{WEBSITE_URL}}"}. Content on this site may not be safe for everyone."
            key="redirect.message1"
            html={true}
            replace={{
                "{{WEBSITE_URL}}": `<b>${xmlEscape(urlOrigin)}</b>`
            }}
            lang={currentLang}
        />
    </p>
    <p>
        <LocalizedText
            text="Be careful with what you type, click on, or view."
            key="redirect.message2"
            lang={currentLang}
        />
    </p>

    <div class="buttons">
        {#if canVisit}
            <a href={url}>
                <Button color="red">
                    <LocalizedText
                        text="Proceed to site"
                        key="redirect.proceed"
                        lang={currentLang}
                    />
                </Button>
            </a>
        {:else}
            <Button color="gray">
                <LocalizedText
                    text="Proceed to site"
                    key="redirect.proceed"
                    lang={currentLang}
                />
            </Button>
        {/if}
        
        <Button on:click={tryClosingTab}>
            <LocalizedText
                text="Go back"
                key="redirect.leave"
                lang={currentLang}
            />
        </Button>
    </div>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    a {
        text-decoration: none;
    }
    :global(b) {
        color: rgb(30, 109, 255);
        user-select: none;
        cursor: not-allowed;
    }
    :global(body.dark-mode) :global(b) {
        color: rgb(58, 157, 255);
    }

    .center-div {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
</style>
