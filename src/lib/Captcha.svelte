<script>
    import { page } from "$app/stores";
    import { browser } from "$app/environment";
    import { onMount, createEventDispatcher } from "svelte";

    import { PUBLIC_CAPTCHA_ENABLED } from "$env/static/public";

    const dispatch = createEventDispatcher();

    let container;

    let mockCompleted = false;
    let mockExpired = false;
    const mockComplete = () => {
        mockCompleted = true;
        dispatch("update", "captcha_disabled");
    };
    const mockExpire = () => {
        mockExpired = true;
        dispatch("update", false);
    };
    const mockError = () => {
        mockCompleted = false;
        mockExpired = false;
        dispatch("update", false);
    };

    onMount(() => {
        if (String(PUBLIC_CAPTCHA_ENABLED) === "false") return;

        const renderWidget = () => {
            widgetId = turnstile.render(container, {
                sitekey: "0x4AAAAAAA0-uEePyt9NmTMl",
                callback: (token) => dispatch("update", token),
                "expired-callback": () => dispatch("update", false),
                "error-callback": () => {
                    turnstile.reset(widgetId);
                    dispatch("update", false);
                },
            });
        };

        if (window.turnstile) {
            renderWidget();
        } else {
            window.onTurnstileLoad = renderWidget;
        }
    });
</script>

<svelte:head>
    {#if String(PUBLIC_CAPTCHA_ENABLED) !== "false"}
        <script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
            defer
        ></script>
    {/if}
</svelte:head>

{#if String(PUBLIC_CAPTCHA_ENABLED) === "false"}
    <div style="border: 1px solid black; padding: 8px;">
        <span style="font-size: 24px">
            {#if mockExpired}
                You took too long
            {:else if mockCompleted}
                ✅ Success!
            {:else}
                <button
                    style="border: 1px solid black; padding: 14px;"
                    on:click={mockComplete}>X</button
                >
                I'm not a robot
            {/if}
        </span>
        <br />
        <br />
        <button on:click={mockExpire}>Expire</button>
        <button on:click={mockError}>Error (Reset)</button>
        <br />
        Emulator, Captcha is disabled in .env, see PUBLIC_CAPTCHA_ENABLED
    </div>
{:else}
    <div bind:this={container} />
{/if}
