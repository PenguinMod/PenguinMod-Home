<script>
    // Static values
    import LINK from "../../resources/urls.js";

    // Components
    import NavigationBar from "../../components/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "../../components/NavigationBar/NavMargin.svelte";
    import Button from "../../components/Button/Button.svelte";
</script>

<head>
    <title>PenguinMod - Home</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section section-info">
        <h1>Upload</h1>
    </div>

    <div
        style="width:100%;display:flex;flex-direction:row;justify-content: center;"
    >
        <p>
            <i>
                This page is still in development, some features likely will not
                work yet.
            </i>
        </p>
    </div>

    <div class="full">
        <div class="card">
            <p>Project Title</p>
            <input type="text" placeholder="My Project" />
            <Button label="Upload" />
        </div>
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

    .section {
        margin: 8px;
    }
    .section-info {
        background: #00c3ffad;
        height: 6rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0;
    }

    .card {
        width: 60%;
        padding: 32px;
        border-style: solid;
        border-width: 2px;
        border-color: rgba(0, 0, 0, 0.1);
        border-radius: 16px;
    }
    .full {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 32px;
    }
</style>
