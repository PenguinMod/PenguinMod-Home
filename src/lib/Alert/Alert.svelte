<script>
    import { onMount } from "svelte";
    import AutoLocalizedText from "$lib/AutoLocalizedText/Node.svelte";

    let isDismissed = false;

    export let text = "";
    export let textBreakup = false;
    export let backColor = "rgb(118, 80, 168)";
    export let textColor = "black";
    export let dismissable = true;

    export let onlyShowID = false;

    export let hasImage = true;
    export let imgSrc = "/alert_icon.svg";
    export let imgAlt = "(!)";

    export let hasButton = false;
    export let buttonText = "";
    export let buttonHref = "/";
    export let buttonTooLight = false; // makes button text black

    const splitText = [];

    if (onlyShowID) {
        isDismissed = true;
    }
    const saveClosedLocally = () => {
        if (!onlyShowID) return;
        const key = `pm:alert-${onlyShowID}`;
        localStorage.setItem(key, "closed");
    };
    onMount(() => {
        if (!onlyShowID) return;

        const key = `pm:alert-${onlyShowID}`;
        if (localStorage.getItem(key) !== "closed") {
            isDismissed = false;
        }
    });

    if (textBreakup) {
        for (const newText of text.split(".")) {
            splitText.push(newText);
        }
    }
</script>

{#if !isDismissed}
    <div
        class="alert-banner"
        style={`background: ${backColor}; color: ${textColor};`}
    >
        <p>
            {#if hasImage}
                <img src={imgSrc} alt={imgAlt} />
            {/if}
            {#if !textBreakup}
                <AutoLocalizedText {text} />
            {:else}
                {#each splitText as text, idx}
                    <AutoLocalizedText
                        text={text + (idx !== splitText.length - 1 ? "." : "")}
                    />
                {/each}
            {/if}
            {#if hasButton}
                <a href={buttonHref}>
                    <button
                        style={`color: ${buttonTooLight ? "black" : backColor}`}
                    >
                        <AutoLocalizedText text={buttonText} />
                    </button>
                </a>
            {/if}
            {#if dismissable}
                <button
                    class="alert-dismiss"
                    on:click={() => {
                        isDismissed = true;
                        if (onlyShowID) {
                            saveClosedLocally();
                        }
                    }}
                />
            {/if}
        </p>
    </div>
{/if}

<style>
    .alert-banner {
        position: relative;
        background: rgb(118, 80, 168);
        font-weight: bold;
        text-align: center;
        padding: 20px 0;
        color: white;
    }
    .alert-banner * {
        margin-block: 0;
    }
    .alert-banner > p {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
    .alert-banner img {
        height: 32px;
        margin-right: 12px;
    }
    .alert-banner button {
        border: 0;
        cursor: pointer;
        font-weight: bold;
        border-radius: 1000px;
        background: white;
        color: rgb(118, 80, 168);
        font-size: 16px;
        padding: 6px 16px;
        margin: 0 6px;
        margin-left: 12px;
    }
    .alert-banner button:active {
        background: rgb(216, 216, 216);
    }
    .alert-dismiss {
        position: absolute;
        right: 16px;
        width: 32px;
        height: 32px;
        background: url("/dismiss.svg") !important;
        background-size: cover !important;
    }
    :global(html[dir="rtl"]) .alert-dismiss {
        right: initial;
        left: 16px;
    }
    .alert-dismiss:active {
        filter: brightness(0.5);
    }
</style>
