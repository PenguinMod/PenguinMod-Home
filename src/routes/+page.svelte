<script>
    // Static values
    import LINK from "../resources/urls.js";

    // Components
    import NavigationBar from "../components/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "../components/NavigationBar/NavMargin.svelte";
</script>

<head>
    <title>PenguinMod - Home</title>
</head>

<NavigationBar />
<NavigationMargin />

<h1>This page is in development</h1>
<p>Please wait before visiting</p>

<p><a target="_blank" href={LINK.base}>Head to PenguinMod</a></p>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
</style>
