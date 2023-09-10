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

    function toRad(deg) {
        return deg * (Math.PI / 180);
    }

    // TODO: rewrite ALL of this to be canvas :3
    let penguinArea;
    let penguinStyles = [];
    const penguinData = [];
    for (let i = 0; i < 10; i++) {
        const moveDirection = Math.round(Math.random()) == 1 ? 1 : -1;
        penguinStyles.push({
            left: Math.round(Math.random() * 1280),
            bottom: 0,
            rotate: 0,
            transform: `scaleX(${moveDirection})`,
            "transform-origin": "center bottom",
        });
        penguinData.push({
            rotation: Math.round(Math.random() * 360),
            moving: moveDirection,
        });
    }
    const psToStyle = (style) => {
        let string = "";
        for (const key in style) {
            const unit =
                typeof style[key] === "number" ? `${style[key]}px` : style[key];
            if (key === "rotate") {
                string += `${key}: ${style[key]}deg; `;
                continue;
            }
            string += `${key}: ${unit}; `;
        }
        return string;
    };
    onMount(() => {
        setInterval(() => {
            let idx = 0;
            for (const style of penguinStyles) {
                style.left += penguinData[idx].moving * 2;
                if (style.left > penguinArea.clientWidth - 80) {
                    penguinData[idx].moving = -1;
                    style.transform = "scaleX(-1)";
                }
                if (style.left < -80) {
                    penguinData[idx].moving = 1;
                    style.transform = "scaleX(1)";
                }
                penguinData[idx].rotation += 2;
                penguinData[idx].rotation = penguinData[idx].rotation % 360;
                style.bottom =
                    Math.abs(Math.sin(toRad(penguinData[idx].rotation) * 6)) *
                    15;
                style.rotate =
                    Math.sin(toRad(penguinData[idx].rotation) * 6) * 5;
                idx++;
            }
            penguinStyles = penguinStyles;
        }, 1000 / 15);
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
        <div class="bouncing-penguins" bind:this={penguinArea}>
            {#each penguinStyles as style}
                <img
                    class="penguin"
                    draggable="false"
                    src="/penguins/cheer.svg"
                    style={psToStyle(style)}
                    alt="Penguin"
                />
            {/each}
        </div>
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
            amount="200"
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

    .bouncing-penguins {
        position: relative;
        width: 100%;
        height: 256px;
        margin-bottom: 16px;
        overflow-x: hidden;
    }
    .penguin {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 100%;
        user-select: none;
    }
</style>
