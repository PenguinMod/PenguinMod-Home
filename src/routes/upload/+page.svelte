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

    <div class="section-info">
        <h1>Upload</h1>
    </div>

    <div class="full">
        <div class="card">
            <div
                style="display:flex;flex-direction:row;justify-content: space-between;"
            >
                <div style="width:50%;">
                    <p class="important notmargin">Project Title</p>
                    <input type="text" placeholder="My Project" />
                    <p class="important notmargin" style="margin-top:24px">
                        Instructions
                    </p>
                    <textarea
                        placeholder="Tell others how to use or play your project..."
                    />
                    <p class="important notmargin">Notes and Credits</p>
                    <textarea
                        placeholder="List people that were apart of the creation of this project..."
                    />
                </div>
                <div style="width:50%;">
                    <img
                        src="/empty-project.png"
                        style="border-width:1px;border-style:solid;border-color:rgba(0, 0, 0, 0.1);width:100%;"
                        alt="Project Thumbnail"
                    />
                    <button class="image-picker">Use my own image</button>
                </div>
            </div>
            <div style="display:flex;flex-direction:row;margin-top:48px">
                <Button label="Upload" icon="upload.svg" />
                <Button label="Remix" color="remix" icon="remix.svg" />
                <Button label="Update" color="orange" icon="update.svg" />
            </div>
        </div>
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

    textarea {
        width: 90%;
        resize: none;
        height: 100px;
        border-radius: 6px;
        border-style: dashed;
        border-color: rgba(0, 162, 255, 0.15);
        border-width: 2px;
    }
    textarea:focus {
        border-color: rgba(0, 162, 255, 0.35);
        outline: none;
    }
    input[type="text"] {
        width: 90%;
        border-radius: 6px;
        border-color: rgba(0, 162, 255, 0.15);
        border-width: 2px;
        border-style: dashed;
    }
    input[type="text"]:focus {
        border-color: rgba(0, 162, 255, 0.35);
        outline: none;
    }

    .main {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        min-width: 1000px;
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

    .important {
        font-weight: bold;
    }
    .notmargin {
        margin-block: 0;
    }

    .image-picker {
        background-color: #00c3ff;
        color: white;
        border-radius: 1000px;
        width: 100%;
        border: 0px;
        padding: 0.25rem 0;
        outline: 0;
        cursor: pointer;
        font-weight: bold;
    }
    .image-picker:focus {
        outline: 4px solid rgba(0, 195, 255, 0.3);
    }
</style>
