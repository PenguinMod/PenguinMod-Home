<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";
    import AutoTranslate from "../../resources/autoTranslate.js";
    import ProjectApi from "../../resources/projectapi.js";
    import * as FileSaver from "file-saver";

    const ProjectClient = new ProjectApi();

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import AutoLocalizedText from "$lib/AutoLocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";

    let messages = [];
    let error = null;
    let loggedIn = null;
    let page = 0;
    let pageIsLast = false;
    let canAutoTranslate = false;
    let autoTranslationCode = "en";
    const disputeTexts = {};
    const autoTranslations = {};

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
        canAutoTranslate = true;
        autoTranslationCode = navigator.language;
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    function fetchNewMessages() {
        ProjectClient.getMyMessages(page).then((messagess) => {
            if (messagess.length <= 0) {
                pageIsLast = true;
                return;
            }
            if (messagess.length < 12) {
                pageIsLast = true;
            }
            messages.push(...messagess);
            messages = messages;
        });
    }

    function loggedInChange(username, privateCode) {
        if (username) ProjectClient.setUsername(username);
        if (privateCode) ProjectClient.setPrivateCode(privateCode);
        messages = [];
        ProjectClient.getMyMessages()
            .then((messagess) => {
                if (messagess.length <= 0) {
                    messages = ["notfound"];
                    return;
                }
                messages = messagess;
                if (messages.length < 12) {
                    pageIsLast = true;
                }
            })
            .catch((err) => {
                error = TranslationHandler.text("generic.error", currentLang);
                console.error(err);
            });
    }
    // function deleteProject(id, name) {
    //     const code = prompt(
    //         String(
    //             TranslationHandler.text("mystuff.confirm.delete", currentLang)
    //         )
    //             .replace("$2", id)
    //             .replace("$1", name)
    //     );
    //     if (String(code).replace(/[^0-9]*/gim, "") !== String(id)) {
    //         return;
    //     }
    //     ProjectClient.deleteProject(id).then(loggedInChange);
    // }
    const downloadRejectedProject = async (projectId) => {
        try {
            const projectFile = await ProjectClient.getRejectedProjectFile(
                projectId
            );
            FileSaver.saveAs(
                new Blob([projectFile]),
                `Project_${projectId}.pmp`
            );
        } catch (err) {
            console.error(err);
            alert(`Failed to download the project; ${err}`);
        }
    };

    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    loggedIn = true;
                    loggedInChange(username, privateCode);
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    function askForLogin() {
        Authentication.authenticate().then((privateCode) => {
            loggedIn = null;
            Authentication.usernameFromCode(privateCode)
                .then(({ username }) => {
                    if (username) {
                        loggedIn = true;
                        loggedInChange(username, privateCode);
                        return;
                    }
                    loggedIn = false;
                })
                .catch(() => {
                    loggedIn = false;
                });
        });
    }
    let readMessages = [];
    function markAsRead(id) {
        if (id && readMessages.includes(id)) {
            console.log("skipped");
            return;
        }
        if (id) {
            if (messages.some((message) => message.id === id && message.read)) {
                console.log("skipped");
                return;
            }
        }
        ProjectClient.readMessages(id);
        if (id) {
            readMessages.push(id);
        } else {
            readMessages = [].concat(
                readMessages,
                messages.map((message) => message.id)
            );
        }
        readMessages = readMessages;
    }
    function disputeMessage(id) {
        if (
            !confirm(
                TranslationHandler.text(
                    "messages.alert.staff.reply.confirm",
                    currentLang
                )
            )
        ) {
            return;
        }
        const text = disputeTexts[id];
        if (!text) return;
        ProjectClient.disputeMessage(id, text).then(location.reload);
    }

    Authentication.onLogout(() => {
        loggedIn = false;
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    loggedIn = true;
                    loggedInChange(username, privateCode);
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    function autoTranslate(id, text) {
        AutoTranslate.translate(text, autoTranslationCode).then((text) => {
            autoTranslations[id] = text;
        });
    }
</script>

<svelte:head>
    <title>PenguinMod - Messages</title>
    <meta name="title"                   content="PenguinMod - Messages" />
    <meta property="og:title"            content="PenguinMod - Messages" />
    <meta property="twitter:title"       content="PenguinMod - Messages">
    <meta name="description"             content="See your messages or alerts.">
    <meta property="twitter:description" content="See your messages or alerts.">
    <meta property="og:url"              content="https://penguinmod.com/messages">
    <meta property="twitter:url"         content="https://penguinmod.com/messages">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    <div class="section-info">
        <h1 style="margin-block: 0;">
            <LocalizedText
                text="Messages"
                key="messages.title"
                lang={currentLang}
            />
        </h1>
        <p>
            <LocalizedText
                text="Alerts from remixes, project activity and staff members."
                key="messages.description"
                lang={currentLang}
            />
        </p>
    </div>

    <div class="section-messages">
        {#if loggedIn === null}
            <div style="margin-top: 16px;">
                <LoadingSpinner enableTips={true} />
            </div>
        {:else if loggedIn === false}
            <div class="login-prompt">
                <p>
                    <LocalizedText
                        text="Please log in to view your messages."
                        key="messages.login"
                        lang={currentLang}
                    />
                </p>
                <Button on:click={askForLogin}>
                    <LocalizedText
                        text="Sign In"
                        key="navigation.login"
                        lang={currentLang}
                    />
                </Button>
            </div>
        {:else if messages[0] !== "notfound"}
            <div style="margin-top: 16px; width: 100%;" />
            {#if messages.length > 0}
                <div class="action-bar">
                    <Button on:click={() => markAsRead()}>
                        <LocalizedText
                            text="Mark all as read"
                            key="messages.markallread"
                            lang={currentLang}
                        />
                    </Button>
                </div>
                <div style="margin-top: 16px; width: 100%;" />
            {/if}
            {#each messages as message}
                <button
                    class="message"
                    data-moderator={message.moderator === true}
                    data-read={message.read === true ||
                        readMessages.includes(message.id)}
                    on:click={() => markAsRead(message.id)}
                >
                    {#if message.moderator === true}
                        <h2>
                            <LocalizedText
                                text="Moderator Message"
                                key="messages.moderatortitle"
                                lang={currentLang}
                            />
                        </h2>
                    {/if}
                    <!-- switch case would be ideal, but we dont have that -->
                    {#if message.type === "reject"}
                        <p>
                            <b>
                                {String(
                                    TranslationHandler.text(
                                        "messages.alert.staff.removed.title",
                                        currentLang
                                    )
                                ).replace("$1", message.name)}
                            </b>
                        </p>
                        <p>{message.reason}</p>
                        {#if canAutoTranslate && !autoTranslations[message.id] && !autoTranslationCode.startsWith("en")}
                            <br />
                            <button
                                class="fake-link"
                                style="display:flex;align-items:center;"
                                on:click={() =>
                                    autoTranslate(message.id, message.reason)}
                            >
                                <img
                                    src="/messages/translate.png"
                                    alt="Translate"
                                    width="30"
                                    height="30"
                                    style="margin-right:6px"
                                />
                                <LocalizedText
                                    text="If the moderator is not speaking your language, you may click here for an auto-translation."
                                    key="messages.alert.staff.translate1"
                                    lang={currentLang}
                                />
                            </button>
                            <p>
                                <LocalizedText
                                    text="Sorry for not having any human translation available! :("
                                    key="messages.alert.staff.translate2"
                                    lang={currentLang}
                                />
                            </p>
                            <br />
                        {/if}
                        {#if autoTranslations[message.id]}
                            <br />
                            <p>{autoTranslations[message.id]}</p>
                            <br />
                        {/if}
                        <p class="small">
                            <b>
                                {String(
                                    TranslationHandler.text(
                                        "messages.projectid",
                                        currentLang
                                    )
                                ).replace("$1", message.projectId)}
                            </b>
                        </p>
                        {#if message.hardReject === false}
                            <h3>
                                <a href="/edit?id={message.projectId}" style="display:flex;align-items:center;">
                                    <img
                                        src="/pencil.png"
                                        alt="Edit"
                                        width="16"
                                        height="16"
                                        style="margin-right:6px"
                                    />
                                    <LocalizedText
                                        text="Edit Project"
                                        key="project.menu.project.edit"
                                        lang={currentLang}
                                    />
                                </a>
                            </h3>
                        {:else}
                            <button
                                class="fake-link"
                                style="display:flex;align-items:center;"
                                on:click={() =>
                                    downloadRejectedProject(message.projectId)}
                            >
                                <img
                                    src="/messages/download.png"
                                    alt="Download"
                                    width="16"
                                    height="16"
                                    style="margin-right:6px"
                                />
                                <LocalizedText
                                    text="Download"
                                    key="messages.download"
                                    lang={currentLang}
                                />
                            </button>
                        {/if}
                    {:else if message.type === "featured"}
                        <p>
                            <b>
                                {String(
                                    TranslationHandler.text(
                                        "messages.alert.featured",
                                        currentLang
                                    )
                                ).replace("$1", message.name)}
                            </b> 🌟
                        </p>
                    {:else if message.type === "followerAdded"}
                        <p>
                            {String(
                                TranslationHandler.text(
                                    "messages.alert.followeradded",
                                    currentLang
                                )
                            ).replace("$1", message.name)}
                        </p>
                    {:else if message.type === "newBadge"}
                        <p>
                            {String(
                                TranslationHandler.text(
                                    "messages.alert.badge",
                                    currentLang
                                )
                            ).replace(
                                "$1",
                                TranslationHandler.text(
                                    `profile.badge.${message.name}`,
                                    currentLang
                                )
                            )}
                        </p>
                    {:else if message.type === "remix"}
                        <p>
                            <a
                                href={`https://studio.penguinmod.com/#${message.remixId}`}
                                target="_blank"
                            >
                                {String(
                                    TranslationHandler.text(
                                        "messages.alert.remix",
                                        currentLang
                                    )
                                )
                                    .replace("$1", "__${{{___1")
                                    .replace("$2", "__${{{___2")
                                    .replace("__${{{___1", message.name)
                                    .replace("__${{{___2", message.remixName)}
                            </a>
                        </p>
                    {:else if message.type === "custom"}
                        <p>
                            {message.text}
                        </p>
                    {:else if message.type === "restored"}
                        <p>
                            {String(
                                TranslationHandler.text(
                                    "messages.alert.staff.restoredproject.title",
                                    currentLang
                                )
                            ).replace("$1", message.name)}
                        </p>
                        <p>
                            <a
                                href={`https://studio.penguinmod.com/#${message.projectId}`}
                                target="_blank"
                            >
                                <LocalizedText
                                    text="Open in new tab"
                                    key="uploading.guidelines.newtab"
                                    lang={currentLang}
                                />
                            </a>
                        </p>
                    {:else if message.type === "ban"}
                        <h3>
                            <LocalizedText
                                text="Your account has been banned from uploading projects and other features. You can continue to use the editor or view other people's projects though."
                                key="messages.alert.staff.banned.title"
                                lang={currentLang}
                            />
                        </h3>
                        <p>
                            <b>
                                <LocalizedText
                                    text="Reason:"
                                    key="messages.alert.staff.reason"
                                    lang={currentLang}
                                />
                            </b>
                        </p>
                        <p>{message.reason}</p>
                        {#if canAutoTranslate && !autoTranslationCode.startsWith("en")}
                            <br />
                            <p style="display:flex;align-items:center;">
                                <img
                                    src="/messages/translate.png"
                                    alt="Translate"
                                    width="30"
                                    height="30"
                                    style="margin-right:6px"
                                />
                                <AutoLocalizedText text={message.reason} />
                            </p>
                            <br />
                        {/if}
                    {:else if message.type === "unban"}
                        <p>
                            <LocalizedText
                                text="Your account has been unbanned. You may upload projects again."
                                key="messages.alert.staff.unbanned.title"
                                lang={currentLang}
                            />
                        </p>
                    {:else if message.type === "disputeResponse"}
                        <h4>
                            <LocalizedText
                                text="Reply from a moderator:"
                                key="messages.alert.staff.moderatorreply"
                                lang={currentLang}
                            />
                        </h4>
                        <p>
                            {message.reason}
                            {#if canAutoTranslate && !autoTranslationCode.startsWith("en")}
                                <br />
                                <p style="display:flex;align-items:center;">
                                    <img
                                        src="/messages/translate.png"
                                        alt="Translate"
                                        width="30"
                                        height="30"
                                        style="margin-right:6px"
                                    />
                                    <AutoLocalizedText text={message.reason} />
                                </p>
                                <br />
                            {/if}
                        </p>
                    {:else if message.type === "guidelines"}
                        <a
                            href="/{message.section === 'uploadingguidelines' ? 'guidelines/uploading' : message.section}"
                        >
                            {String(
                                    TranslationHandler.text(
                                        `messages.alert.${message.section}`,
                                        currentLang
                                    ) || TranslationHandler.text(
                                        `messages.alert.${message.section}`,
                                        'en'
                                    )
                            )
                            .replace("{{TERMS_OF_SERVICE}}", TranslationHandler.text(
                                        "home.footer.sections.info.terms",
                                        currentLang
                                    ))
                            .replace("{{PRIVACY_POLICY}}", TranslationHandler.text(
                                        "home.footer.sections.info.privacy",
                                        currentLang
                                    ))
                            .replace("{{UPLOADING_GUIDELINES}}", TranslationHandler.text(
                                        "home.footer.sections.info.guidelines",
                                        currentLang
                                    ))}
                        </a>
                    {:else}
                        <!-- what is this? -->
                        <p>
                            Unknown Message;
                            <LocalizedText
                                text="An error occurred. Please try again later."
                                key="generic.error"
                                lang={currentLang}
                            />
                        </p>
                    {/if}
                    {#if message.disputable}
                        <details>
                            <summary>
                                <b>
                                    {#if message.type === "disputeResponse"}
                                        <LocalizedText
                                            text="Reply"
                                            key="messages.alert.staff.reply"
                                            lang={currentLang}
                                        />
                                    {:else}
                                        <LocalizedText
                                            text="If you feel this action was wrong, please reply here."
                                            key="messages.alert.staff.dispute"
                                            lang={currentLang}
                                        />
                                    {/if}
                                </b>
                            </summary>
                            <div style="margin-top: 8px; width: 100%;" />
                            <textarea bind:value={disputeTexts[message.id]} />
                            <div style="margin-top: 8px; width: 100%;" />
                            <div class="action-bar-full">
                                <Button
                                    on:click={() => disputeMessage(message.id)}
                                >
                                    <LocalizedText
                                        text="Reply"
                                        key="messages.alert.staff.reply"
                                        lang={currentLang}
                                    />
                                </Button>
                            </div>
                        </details>
                    {/if}
                </button>
            {:else}
                <!-- messages.length === 0 -->
                <LoadingSpinner />
            {/each}
        {:else}
            <div>
                <PenguinConfusedSVG height="12rem" />
                <p>
                    <LocalizedText
                        text="Nothing was found."
                        key="generic.notfound"
                        lang={currentLang}
                    />
                </p>
            </div>
        {/if}
    </div>

    {#if messages[0] !== "notfound"}
        {#if !pageIsLast && messages.length > 0}
            <div style="height: 16px;" />
            <div class="more-messages-wrapper">
                <Button
                    label="<img alt='More' src='dropdown-caret-hd.png' width='20'></img>"
                    on:click={() => {
                        page += 1;
                        fetchNewMessages();
                    }}
                />
            </div>
        {/if}
    {/if}

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
        font-size: smaller;
        opacity: 0.6;
    }

    .section-info {
        background: #00c3ffad;
        height: 8rem;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
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
    .section-messages {
        margin: 0;
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        flex-wrap: wrap;
    }

    .login-prompt {
        display: flex;
        flex-direction: column;
        margin-top: 16px;
        margin-bottom: 16px;
        align-items: center;
    }

    .more-messages-wrapper {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
    .action-bar {
        width: 80%;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }
    .action-bar-full {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
    }

    .message {
        background: rgba(30, 184, 255, 0.2);
        font-size: 0.85rem;
        padding: 12px 24px;
        border: 0;
        margin: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.15);
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        width: 80%;
        text-align: left;
        cursor: pointer;
        user-select: text;
    }
    .message p,
    .message h2 {
        cursor: text;
    }
    .message[data-moderator="true"] {
        margin-top: 22px;
        margin-bottom: 22px;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 6px;
    }
    .message[data-read="true"] {
        background: transparent;
    }
    :global(body.dark-mode) .message {
        border-top: 1px solid rgba(255, 255, 255, 0.5);
        border-bottom: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
    }
    :global(body.dark-mode) .message[data-moderator="true"] {
        border: 1px solid rgba(255, 255, 255, 0.5);
    }
    :global(html[dir="rtl"]) .message {
        text-align: right;
    }

    textarea {
        background: rgba(255, 255, 255, 0.85);
        width: 100%;
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
    :global(body.dark-mode) textarea {
        background: transparent;
        color: white;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
    .fake-link {
        color: dodgerblue;
        text-decoration: underline;
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0;
        cursor: pointer;
        font-size: 0.85rem;
    }
</style>
