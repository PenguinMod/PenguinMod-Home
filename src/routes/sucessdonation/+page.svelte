<script>
    import { onMount } from "svelte";
    import { Confetti } from "svelte-confetti";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
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

<head>
    <title>PenguinMod - Thanks for donating!</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <h1 style="margin-block: 0;">
            <LocalizedText
                text="Thanks for donating!"
                key="donate.completed"
                lang={currentLang}
            />
        </h1>
    </div>

    <div style="height: 16px;" />

    <div class="section-content">
        <p>Thanks for donating! ✨</p>
        <p>
            We hope you continue to support PenguinMod, even if it's not with
            money but by sharing and using our service!
        </p>
        <img src="/penguins/cheer.svg" alt="Cheering" class="thank-you" />
        <p>
            Your donation can help us fund PenguinMod's server and domain!
            <br />
            <b>Thanks for supporting us! 😄</b>
        </p>
        <div style="height: 16px;" />
        <Button link="/donate">Back</Button>
    </div>
</div>

<div class="confetti-holder">
    <div class="confetti-wrapper">
        <Confetti
            amount="40"
            size="100"
            x={[-15, 15]}
            y={[0, 50]}
            noGravity
            duration="6000"
            fallDistance="100vh"
            colorArray={["url(/navicon.png)"]}
        />
        <Confetti
            amount="465"
            size="50"
            x={[-15, 15]}
            y={[0, 50]}
            noGravity
            duration="6000"
            fallDistance="100vh"
        />
    </div>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        min-width: 1000px;
    }

    .section-info {
        background: #00c3ffad;
        height: 12rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
    }
    .section-content {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .confetti-holder {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        overflow: hidden;
        pointer-events: none;
    }
    .confetti-wrapper {
        position: absolute;
        left: 50%;
        bottom: 0;
        pointer-events: none;
    }

    .thank-you {
        height: 12em;
    }
</style>
