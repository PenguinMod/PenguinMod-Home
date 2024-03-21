<script>
    import { onMount } from "svelte";
    import VRHandler from "../../vr";
    import VRPages from "../../vr/menus/index.js";
    
    let isLiveTests = false;
    let vrIsSupported = null;

    /**
     * @type {VRHandler}
     */
    let vrSession;
    onMount(async () => {
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.has("livetests")) {
            isLiveTests = true;
        }

        if (!isLiveTests) return;
        vrIsSupported = await VRHandler.isSupported();
        if (!vrIsSupported) return;
    });
    const openSession = () => {
        if (!isLiveTests) return;
        if (!vrIsSupported) return;
        if (vrSession) return;

        vrSession = new VRHandler();
        vrSession.initialize();
        vrSession.start();
        vrSession.loadPage(VRPages.pageLoading);
    };
</script>

<p>We're working on it! 🐧</p>
{#if isLiveTests && vrIsSupported}
    <button
        class="vr-test-button"
        on:click={openSession}
    >
        Enter VR
    </button>
{/if}

<style>
    .vr-test-button {
        padding: 20px;
        margin: 4px;
        font-size: larger;
    }
</style>