<script>
    import { page } from "$app/stores";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";

    // Icons
    import PenguinConfusedSVG from "../icons/Penguin/confused.svelte";
</script>

<head>
    <title>PenguinMod - {$page.status}</title>
</head>

<NavigationBar />
<NavigationMargin />

<div class="center-div">
    <PenguinConfusedSVG height="12rem" />

    <h1>Whoops!</h1>
    <p>
        Something's not quite right. Maybe you should <a href="../">go back?</a>
    </p>

    <p>Error: {$page.status} - {$page.error.message}</p>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .center-div {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    :global(body.dark-mode) {
        color: white;
    }
    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
