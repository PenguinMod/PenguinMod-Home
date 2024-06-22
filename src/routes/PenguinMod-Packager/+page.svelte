<script>
    import { onMount } from "svelte";
    import { PUBLIC_STUDIO_URL } from "$env/static/public";
    onMount(() => {
        window.location.href =
            `${PUBLIC_STUDIO_URL}/PenguinMod-Packager`;
    });
</script>

<svelte:head>
    <title>Redirecting</title>
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home">
    <meta name="description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="twitter:description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>
<div>
    If you are not redirected automatically,
    <a href="{PUBLIC_STUDIO_URL}/PenguinMod-Packager">click here</a>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        color: white;
    }

    a {
        margin-left: 4px;
    }

    div {
        background: #009ccc;
        display: flex;
        align-items: center;
        height: 100%;
        width: 100%;
        position: absolute;
        left: 0px;
        top: 0px;
        overflow: hidden;
        justify-content: center;
    }
</style>
