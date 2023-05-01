<script>
    // Static values
    import LINK from "../resources/urls.js";

    // Components
    import NavigationBar from "../components/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "../components/NavigationBar/NavMargin.svelte";
    import Button from "../components/Button/Button.svelte";
</script>

<head>
    <title>PenguinMod - Home</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section section-info">
        <div style="margin-left: 8rem;">
            <h1>Block-based coding with tons of capabilities</h1>
            <h1>
                Built off of
                <a href={LINK.turbowarp} target="_blank">TurboWarp</a>
                and
                <a href={LINK.scratch} target="_blank">Scratch</a>
            </h1>
            <Button
                label="<img src='/tryit.svg' width='32px' style='margin-right:8px'></img> Try it out"
                highlighted="true"
                link={LINK.editor}
            />
        </div>

        <video
            width="426.666667"
            height="240"
            autoplay="true"
            muted="true"
            loop="true"
            class="example-video"
        >
            <source src="/example.mp4" type="video/mp4" />
            <track kind="captions" />
        </video>
    </div>

    <div class="section section-links">
        <Button label="Project Packager" link={LINK.packager} />
        <Button label="Credits" link={LINK.credits} />
        <Button label="Community Wiki" link={LINK.wiki} />
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
    }

    .section {
        margin: 8px;
    }
    .section-info {
        background: #00c3ffad;
        height: 24rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    .section-links {
        background: #00c3ff28;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 0.5rem 0;
        margin: 0px;
    }

    .section-info a {
        color: white;
    }

    .example-video {
        border-radius: 6px;
        outline-style: solid;
        outline-width: 6px;
        outline-color: rgba(255, 255, 255, 0.35);
        margin-right: 8rem;
    }
</style>
