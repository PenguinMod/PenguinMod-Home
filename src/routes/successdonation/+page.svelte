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

<div class="confetti-wrapper">
    <Confetti
        x={[-5, 5]}
        y={[0, 0.1]}
        infinite
        duration="6000"
        amount="100"
        size="15"
        fallDistance="120vh"
    />
</div>

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
        <div class="pengfetti-wrapper">
            <Confetti
                amount="200"
                size="30"
                x={[-15, 15]}
                y={[-15, 15]}
                noGravity
                duration="6000"
                fallDistance="100vh"
                colorArray={['url(/penguins/cheer.svg)']}
            />
        </div>
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
    .confetti-wrapper {
        position: fixed;
        top: -50px;
        left: 0;
        height: 100vh;
        width: 100vw;
        display: flex;
        justify-content: center;
        overflow: hidden;
    }
    .pengfetti-wrapper {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    @keyframes bouncy {
        0% {
            left: 0px;
            top: 0px;
            transform: rotate(0deg);
            animation-timing-function: ease-out;
        }
        25% {
            left: 20px;
            top: -30px;
            transform: rotate(10deg);
            animation-timing-function: ease-in;
        }
        50% {
            left: 0;
            top: 0;
            transform: rotate(0deg);
            animation-timing-function: ease-out;
        }
        75% {
            left: -20px;
            top: -30px;
            transform: rotate(-10deg);
            animation-timing-function: ease-in;
        }
        100% {
            left: 0px;
            top: 0px;
            transform: rotate(0deg);
        }
    }

    .thank-you {
        height: 12em;
        padding-top: 1rem;
        position: relative;
        animation-name: bouncy;
        animation-duration: 1s;
        animation-iteration-count: infinite;
    }
</style>
