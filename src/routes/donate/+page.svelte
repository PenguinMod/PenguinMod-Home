<script>
    import { onMount } from "svelte";
    import MarkdownIt from "markdown-it";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Static values
    import LINK from "../../resources/urls.js";

    let currentLang = "en";
    let forceHtmlClass;
    let forceHtmlClass2;
    let forceHtmlClass3;
    onMount(() => {
        Language.forceUpdate();
        forceHtmlClass.classList.add('donate-card-html');
        forceHtmlClass2.classList.add('donate-card-html');
        forceHtmlClass3.classList.add('donate-card-html');
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });
    
    const md = new MarkdownIt({
        html: false,
        linkify: false,
        breaks: true,
    });
    
    const env = {};
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };
</script>

<svelte:head>
    <title>PenguinMod - Donate</title>
    <meta name="title"                   content="PenguinMod - Donate" />
    <meta property="og:title"            content="PenguinMod - Donate" />
    <meta property="twitter:title"       content="PenguinMod - Donate">
    <meta name="description"             content="Help support PenguinMod and it's development!">
    <meta property="twitter:description" content="Help support PenguinMod and it's development!">
    <meta property="og:url"              content="https://penguinmod.com/donate">
    <meta property="twitter:url"         content="https://penguinmod.com/donate">
</svelte:head>

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
                    <LocalizedText
                        text="PenguinMod helps people around the world create the games that they want and share the fun stuff they make with the community."
                        key="donate.message1"
                        lang={currentLang}
                    />
                </p>
                <p>
                    {@html generateMarkdown(`${String(TranslationHandler.text(
                        "donate.people1",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.people1",
                        'en'
                    ))
                    .replace('$1', (25000).toLocaleString())
                    .replace('$2', (55000).toLocaleString())
                    /* $1 is new people, $2 is returning */}

${String(TranslationHandler.text(
                        "donate.people2",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.people2",
                        'en'
                    ))}`)}
                </p>
                <p>
                    <LocalizedText
                        text="We would appreciate if you could donate below to help us pay for our domain and server costs! 😀"
                        key="donate.message2"
                        lang={currentLang}
                    />
                </p>

                <div style="height: 16px;" />

                <!-- donation buttons -->
                <div class="donation-section">
                    <div class="donation-buttons">
                        <p class="small">
                            <LocalizedText
                                text="Donate using"
                                key="donate.methods"
                                lang={currentLang}
                            />
                        </p>
                        <a
                            target="_blank"
                            href="https://donate.stripe.com/fZe4hV1jWbmr7sYbII"
                            style="text-decoration: none !important;"
                        >
                            <button
                                class="donation-container"
                                title="Stripe - Financial infrastructure for the internet"
                            >
                                <img src="/stripe.png" alt="Stripe" />
                                <span>
                                    <LocalizedText
                                        text="Stripe (Most payment types)"
                                        key="payment.stripe.subtitle"
                                        lang={currentLang}
                                    />
                                </span>
                            </button>
                        </a>
                        <br />
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
                                <span>
                                    <LocalizedText
                                        text="PayPal / Card"
                                        key="payment.paypal.card"
                                        lang={currentLang}
                                    />
                                </span>
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
                                <span>
                                    <LocalizedText
                                        text="Cash App"
                                        key="payment.cashapp"
                                        lang={currentLang}
                                    />
                                </span>
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
                    <LocalizedText
                        text="You can always donate to our parent projects Scratch or TurboWarp as well, to help them stay online."
                        key="donate.parents"
                        lang={currentLang}
                    />
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
                <p style="text-align: center;">
                    <LocalizedText
                        text="For completely free:"
                        key="donate.served.title"
                        lang={currentLang}
                    />
                </p>
                <div class="detail-card" bind:this={forceHtmlClass} style="background: dodgerblue">
                    {@html String(TranslationHandler.text(
                        "donate.served.projects",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.served.projects",
                        'en'
                    ))
                    // we serve __ projects
                    .replace('$1', (10000).toLocaleString())}
                </div>
                <div class="detail-card" bind:this={forceHtmlClass2} style="background: darkviolet">
                    {@html String(TranslationHandler.text(
                        "donate.served.size",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.served.size",
                        'en'
                    ))
                    // we send __ gb of stuff
                    .replace('$1', (700).toLocaleString())}
                </div>
                <div class="detail-card" bind:this={forceHtmlClass3} style="background: #ffb300">
                    {@html String(TranslationHandler.text(
                        "donate.served.requests",
                        currentLang
                    ) || TranslationHandler.text(
                        "donate.served.requests",
                        'en'
                    ))
                    // we handle ___ reqs
                    .replace('$1', (20000000).toLocaleString())}
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
    :global(html[dir="rtl"]) .section-info h1 {
        margin-left: initial;
        margin-right: 32px;
    }
    :global(html[dir="rtl"]) .section-info p {
        margin-left: initial;
        margin-right: 32px;
    }

    .penguin-donate {
        height: 80%;
        margin-right: 32px;
    }
    :global(html[dir="rtl"]) .penguin-donate {
        margin-right: initial;
        margin-left: 32px;
        transform: scaleX(-1);
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
    :global(html[dir="rtl"]) .section-discussion {
        margin-right: initial;
        margin-left: 5%;
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
