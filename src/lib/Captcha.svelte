<script>
    import { page } from '$app/stores';
    import { browser } from "$app/environment";
    import { onMount, createEventDispatcher } from "svelte";

    import { PUBLIC_CAPTCHA_ENABLED } from "$env/static/public";
    
    const dispatch = createEventDispatcher();
    
    let mockCompleted = $state(false);
    let mockExpired = $state(false);
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
        if (String(PUBLIC_CAPTCHA_ENABLED) === "false") {
            return;
        }

        window.on_captcha_complete = (token) => {
            dispatch("update", token);
        };

        window.on_captcha_expired = () => {
            dispatch("update", false);
        };

        window.on_captcha_error = () => {
            // reload the captcha
            turnstile.reset();
            dispatch("update", false);
        };
    });
</script>

<svelte:head>
    {#if String(PUBLIC_CAPTCHA_ENABLED) !== "false"}
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
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
                <button style="border: 1px solid black; padding: 14px;" onclick={mockComplete}>X</button>
                I'm not a robot
            {/if}
        </span>
        <br>
        <br>
        <button onclick={mockExpire}>Expire</button>
        <button onclick={mockError}>Error (Reset)</button>
        <br>
        Emulator, Captcha is disabled in .env, see PUBLIC_CAPTCHA_ENABLED
    </div>
{:else}
    <div
        class="cf-turnstile"
        data-sitekey="0x4AAAAAAA0-uEePyt9NmTMl"
        data-callback="on_captcha_complete"
        data-expired-callback="on_captcha_expired"
        data-error-callback="on_captcha_error"
></div>
{/if}