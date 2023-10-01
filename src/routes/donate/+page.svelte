<script>
    import { onMount } from "svelte";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";

    // Static values
    import LINK from "../../resources/urls.js";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
</script>

<head>
    <title>PenguinMod - Donate</title>
</head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <div>
            <h1 style="margin-block: 0;">
                <LocalizedText
                    text="Donate"
                    key="donate.title"
                    lang={currentLang}
                />
            </h1>
            <p>
                <LocalizedText
                    text="Help PenguinMod pay for our servers, link & more!"
                    key="donate.description"
                    lang={currentLang}
                />
            </p>
        </div>
        <img src="/penguins/donate.svg" alt="Penguin" class="penguin-donate" />
    </div>

    <div style="height: 16px;" />

    <div class="section-discussion-wrapper">
        <div class="section-discussions">
            <div class="section-discussion">
                <p>
                    PenguinMod helps people around the world create the games
                    that they want and share the fun stuff they make with the
                    community.
                </p>
                <p>
                    In the last month, <b>
                        <i>20k+ new people found PenguinMod</i>
                    </b>
                    and
                    <br />
                    we sent our website to <b><i>50k+</i></b> returning users
                    from
                    <b>Japan</b>, <b>Russia</b>, the <b>United Kingdom</b> and more!
                    🎉
                </p>
                <p>
                    We would appreciate if you could donate below to help us pay
                    for our domain and server costs! 😀
                </p>

                <div style="height: 16px;" />

                <!-- donation buttons -->
                <div class="donation-section">
                    <div class="donation-buttons">
                        <p class="small">Donate using</p>
                        <a
                            target="_blank"
                            href="https://www.paypal.com/donate/?hosted_button_id=6UJFR8W3V7KYC"
                            style="text-decoration: none !important;"
                        >
                            <button
                                class="donation-container"
                                title="PayPal - The safer, easier way to pay online!"
                            >
                                <img src="/paypal.png" alt="PayPal" />
                                <span>PayPal / Card</span>
                            </button>
                        </a>
                        <br />
                        <a
                            target="_blank"
                            href="https://www.cash.app/$JeremyGamer13"
                            style="text-decoration: none !important;"
                        >
                            <button
                                class="donation-container"
                                title="Cash App - Do more with your money"
                            >
                                <img src="/cashapp.png" alt="Cash App" />
                                <span>Cash App</span>
                            </button>
                        </a>
                    </div>
                    <div class="donation-images">
                        <img
                            src="/penguins/donating.svg"
                            alt="Penguins Donating"
                        />
                    </div>
                </div>

                <!-- other stuff -->
                <div style="height: 48px;" />

                <p class="small">
                    <LocalizedText
                        text="PenguinMod is not affiliated with Scratch, TurboWarp, the Scratch Team, or the Scratch Foundation."
                        key="home.footer.notaffiliated"
                        dontlink={true}
                        lang={currentLang}
                    />
                </p>
                <p class="small">
                    You can always donate to our parent projects Scratch or
                    TurboWarp too to help them stay online.
                </p>
                <br />
                <p class="small">
                    <LocalizedText
                        text="Donate"
                        key="home.footer.sections.donate"
                        lang={currentLang}
                    />
                </p>
                <a class="small" target="_blank" href={LINK.donate.scratch}>
                    Scratch
                </a>
                <br />
                <a class="small" target="_blank" href={LINK.donate.turbowarp}>
                    TurboWarp
                </a>
            </div>
            <div class="section-details">
                <p style="text-align: center;">For completely free:</p>
                <div class="detail-card" style="background: dodgerblue">
                    <p>We host and serve</p>
                    <h1>900+</h1>
                    <p>projects</p>
                </div>
                <div class="detail-card" style="background: darkviolet">
                    <p>We send</p>
                    <h1>30 GB+</h1>
                    <p>of content monthly</p>
                </div>
                <div class="detail-card" style="background: #ffb300">
                    <p>We handle</p>
                    <h1>5M+</h1>
                    <p>requests monthly</p>
                </div>
            </div>
        </div>
    </div>

    <div style="height: 16px;" />
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
    .small {
        font-size: 12px;
    }

    .detail-card {
        width: calc(100% - 24px);
        padding: 48px 12px;
        background: dodgerblue;
        color: white;
        text-align: center;
    }
    .detail-card p,
    .detail-card h1 {
        margin-block: 0;
    }
    .detail-card h1 {
        font-size: 48px;
    }

    .section-info {
        background: #00c3ffad;
        height: 12rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    .section-info h1 {
        margin-block: 0;
        margin-left: 32px;
    }
    .section-info p {
        margin-block-end: 0;
        margin-left: 32px;
    }

    .penguin-donate {
        height: 80%;
        margin-right: 32px;
    }

    .section-discussion-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    .section-discussions {
        display: flex;
        flex-direction: row;
        width: 65%;
    }
    .section-discussion {
        width: 65%;
        margin-right: 5%;
    }
    .section-details {
        width: 30%;
    }

    .donation-container {
        position: relative;
        border-radius: 6px;
        border: 1px solid rgba(0, 0, 0, 0.5);
        background: white;
        overflow: hidden;
        padding-left: 60px;
        display: flex;
        flex-direction: row;
        align-items: center;
        cursor: pointer;
        box-shadow: 1px 1px 2px black;
        height: 52px;
    }
    .donation-container:hover {
        box-shadow: 1px 1px 10px black;
    }
    .donation-container:active {
        background: rgb(219, 219, 219);
    }
    .donation-container > img {
        position: absolute;
        left: 0;
        top: 0;
        height: calc(100% + 1px);
    }
    .donation-container > span {
        font-size: 20px;
        margin-right: 8px;
        font-weight: bold;
        text-decoration: none !important;
    }

    :global(body.dark-mode) .donation-container {
        background: transparent;
        border-color: white;
        color: white;
        box-shadow: 1px 1px 2px white;
    }
    :global(body.dark-mode) .donation-container:hover {
        box-shadow: 1px 1px 10px white;
    }
    :global(body.dark-mode) .donation-container:active {
        background: rgba(255, 255, 255, 0.2);
    }

    .donation-section {
        display: flex;
        flex-direction: row;
    }
    .donation-buttons {
        width: 50%;
    }
    .donation-images {
        width: 50%;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }
    .donation-images img {
        height: 192px;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
