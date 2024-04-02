<script>
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Button from "$lib/Button/Button.svelte";

    let opened = false;

    function begin() {
        window.open(
            "https://studio.penguinmod.com?restore=true&handler=" +
                window.location.origin
        );
        window.onmessage = (e) => {
            if (!e.origin.startsWith(`https://studio.penguinmod.com`)) {
                return;
            }

            if (!e.data.p4) {
                return;
            }

            const packagerData = e.data.p4;
            if (packagerData.type !== "validate") {
                return;
            }

            for (var i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (String(key).toLowerCase().trim() === "pv") {
                    continue;
                }
                const value = localStorage.getItem(localStorage.key(i));
                e.source.postMessage(
                    {
                        p4: {
                            type: "data",
                            key: key,
                            value: value,
                        },
                    },
                    e.origin
                );
            }

            e.source.postMessage(
                {
                    p4: {
                        type: "finished",
                    },
                },
                e.origin
            );
        };
    }
</script>

<svelte:head>
    <title>PenguinMod - Restore</title>
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home">
    <meta name="description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="twitter:description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="og:url" content="https://penguinmod.com/restore">
    <meta property="twitter:url" content="https://penguinmod.com/restore">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="box">
        {#if !opened}
            <div style="height:32px;" />
            <Button label="Click to begin" on:click={begin} />
        {:else}
            <LoadingSpinner />
        {/if}
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
    .box {
        margin-top: 32px;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
