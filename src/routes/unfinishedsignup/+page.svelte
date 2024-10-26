<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import { browser } from "$app/environment";
    import MarkdownIt from "markdown-it";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import CountryLookup from "../../resources/country-lookup.json";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    import Language from "../../resources/language.js";

    // Static values
    import LINK from "../../resources/urls.js";
    
    const ProjectClient = new ProjectApi();

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
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

    let username = "";
    let token = "";
    let loggedIn = null;
    
    let embed = false;
    if (browser) {
        embed = $page.url.searchParams.get('embed') === "true";
    }
    let specificFilloutForm = "";
    if (browser) {
        specificFilloutForm = $page.url.searchParams.get('fillout');
    }

    let country = "";
    let birthday = "";
    let countryValid = false;
    let birthdayValid = false;

    let birthdayFaked = false;
    let consentedToDataUsage = false;
    let accurateDataAgreement = false;
    let canFinishSignup = false;

    let processingSignupFinish = false;
    let apiProcessFailReason = null;
    const finishSignup = async () => {
        await ProjectClient.filloutSafetyDetails(birthday, country);
    };
    const finishSignupSafe = () => {
        if (!canFinishSignup) {
            // TODO: Translate the error messages.
            if (apiProcessFailReason) {
                alert('Failed to update account:', apiProcessFailReason);
                return;
            }

            if (!consentedToDataUsage || !accurateDataAgreement) {
                return alert("Not all agreements have been checked.");
            }

            alert("Not all fields have been filled out.");
            return;
        }

        if (processingSignupFinish) return;
        processingSignupFinish = true;
        
        finishSignup()
        .then(() => {
            if (embed) {
                const opener = window.opener || window.parent;

                function post(data) {
                    opener.postMessage(
                        data,
                        `/`
                    );
                }

                post();

                window.close();
                return;
            }

            // redirect
            const redir = $page.url.searchParams.get('redirect');
            window.location.href = redir ? redir : "/";
        }, (err) => {
            canFinishSignup = false;
            apiProcessFailReason = err;
            alert(`Failed to create account: ${err}`);
            console.error(err);
        })
        .finally(() => {
            processingSignupFinish = false;
        });
    };
    
    function loggedInChange(username, privateCode) {
        if (username) ProjectClient.setUsername(username);
        if (privateCode) ProjectClient.setToken(privateCode);
    }
    onMount(async () => {
        const username = localStorage.getItem("username");
        token = localStorage.getItem("token");
        if (!token || !username) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(() => {
                loggedIn = true;
                loggedInChange(username, token);
            })
            .catch((e) => {
                loggedIn = false;
            });
    });
    Authentication.onLogout(() => {
        loggedIn = false;
    });
    Authentication.onAuthentication((username, privateCode) => {
        loggedIn = true;
        loggedInChange(username, privateCode);
    });
    
    const parseBirthday = (birthday) => {
        if (!birthday) return;
        if (typeof birthday !== "string") return;
        try {
            const date = new Date(birthday);
            if (isNaN(date.getTime())) {
                return; // invalid format
            }

            return date;
        } catch {
            return;
        }
    };
    const getMaxBirthdate = () => {
        const todaysDate = new Date();
        return `${todaysDate.getFullYear()}-${todaysDate.getMonth() + 1}-${todaysDate.getDate()}`;
    };
    const checkIfValid = () => {
        if (!specificFilloutForm || specificFilloutForm !== "country") {
            birthdayFaked = false;

            const parsedBirthday = parseBirthday(birthday);
            if (!parsedBirthday) {
                birthdayValid = false;
            } else {
                birthdayValid = true;

                const currentDate = new Date();
                const birthYear = parsedBirthday.getFullYear();
                if (birthYear <= 1901) {
                    birthdayFaked = birthYear >= 1899 && birthYear <= 1901;
                    birthdayValid = false;
                }
                if (birthYear > currentDate.getFullYear()) {
                    birthdayValid = false;
                }
                if (parsedBirthday.getDate() > currentDate.getDate()) {
                    birthdayValid = false;
                }
            }
        }
        if (!specificFilloutForm || specificFilloutForm !== "birthday") {
            countryValid = CountryLookup.countryCodes.includes(country);
        }

        if (specificFilloutForm === "country") {
            birthdayValid = true;
        }
        if (specificFilloutForm === "birthday") {
            countryValid = true;
        }
        canFinishSignup = countryValid && birthdayValid && consentedToDataUsage && accurateDataAgreement;
    };
    
    const birthdayInputChanged = (event) => {
        birthday = event.target.value;
        checkIfValid();
    }
    const countryInputChanged = (event) => {
        country = event.target.value;
        checkIfValid();
    }
</script>

<svelte:head>
    <title>PenguinMod - Sign Up</title>
    <meta name="title" content="PenguinMod - Sign Up" />
    <meta property="og:title" content="PenguinMod - Sign Up" />
    <meta property="twitter:title" content="PenguinMod - Sign Up">
    <meta name="description" content="Sign up for PenguinMod to start sharing your projects!">
    <meta property="twitter:description" content="Sign up for PenguinMod to start sharing your projects!">
    <meta property="og:url" content="https://penguinmod.com/signup">
    <meta property="twitter:url" content="https://penguinmod.com/signup">
</svelte:head>

{#if !embed}
    <NavigationBar />
{/if}

<div class="main">
    {#if !embed}
        <NavigationMargin />
    {/if}

    {#if loggedIn === false}
        <main>
            <a href="/signup?embed={embed}" style="margin: 8px">
                <LocalizedText
                    text="Don't have an account? Sign up here!"
                    key="login.linkto.signup"
                    lang={currentLang}
                />
            </a>
        </main>
    {:else if loggedIn === null}
        <main>
            <LoadingSpinner></LoadingSpinner>
        </main>
    {:else}
        <main>
            <img src="/penguins/frontpage.svg" alt="Finish your child's account" style="width:40%" />
            <h1>Finish Sign Up</h1>

            {#if specificFilloutForm !== "birthday"}
                <!-- TODO: Translations. Specifically, the default disabled option and the input title. -->
                <span class="input-title">
                    Country:
                </span>
                <select
                    class="input-forced-class"
                    data-valid={countryValid}
                    on:input={countryInputChanged}
                >
                    <option value="" selected disabled>Select the country your child lives in</option>
                    {#each CountryLookup.countryCodes as countryCode}
                        <option value={countryCode}>{CountryLookup.countryNames[countryCode]}</option>
                    {/each}
                </select>
            {/if}
            
            {#if specificFilloutForm !== "country"}
                <!-- TODO: Translations. Specifically, the input title and warning message. -->
                <span class="input-title">
                    Your Child's Birthdate:
                </span>
                <input
                    type="date"
                    min="1900-01-01"
                    max={getMaxBirthdate()}
                    data-valid={birthdayValid}
                    on:input={birthdayInputChanged}
                />
                {#if birthdayFaked}
                    <p class="birthday-warning">
                        Did your parent/guardian give you permission to use PenguinMod?
                        <br>
                        That seems like your trying to secretly make an account without them knowing.
                    </p>
                {/if}
            {/if}

            <!-- TODO: Translations. Specifically, the agreement. -->
            <label style="width:60%">
                <input
                    type="checkbox"
                    bind:checked={consentedToDataUsage}
                    on:change={checkIfValid}
                />
                <span class="disable-markdown-margin">
                    {@html generateMarkdown(`I agree to allow PenguinMod to collect and use my country and date of birth (or my child's if I am registering on their behalf) in accordance with the [Privacy Policy](/privacy).`)}
                </span>
            </label>
            <label style="width:60%">
                <input
                    type="checkbox"
                    bind:checked={accurateDataAgreement}
                    on:change={checkIfValid}
                />
                <span class="disable-markdown-margin">
                    {@html generateMarkdown(`I confirm that the information I have provided is accurate, and I understand that my date of birth and country cannot be changed after account creation without contacting support.`)}
                </span>
            </label>

            <!-- TODO: This should refer to the parent/guardian. -->
            <p>
                {@html generateMarkdown(`${TranslationHandler.textSafe(
                    "signup.confirm.legal",
                    currentLang,
                    "By creating a PenguinMod account through any means provided on this page, you agree to abide by the [Terms of Service](/terms) and [Uploading Guidelines](/guidelines/uploading) and confirm that you have read the [Privacy Policy](/privacy) in its entirety."
                )}`)}
            </p>
        
            <button class="create-acc" data-canCreate={canFinishSignup} on:click={finishSignupSafe}>
                {#if processingSignupFinish}
                    <LoadingSpinner icon="/loading_white.png" />
                {:else}
                    <LocalizedText
                        text="Done"
                        key="auth.done"
                        lang={currentLang}
                    />
                {/if}
            </button>
        </main>
    {/if}

    <div class="footer-links">
        <a target="_blank" href={LINK.contact}>
            <LocalizedText
                text="Contact Us"
                key="home.footer.sections.info.contact"
                lang={currentLang}
            />
        </a>
    </div>

    <div style="height: 32px;" />
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
        margin-top: 48px;
    }

    main {
        margin: 0 calc(35% - 33px);
        padding: 32px;
        width: 30%;

        display: flex;
        flex-direction: column;
        align-items: center;

        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        background: white;
        font-size: 14px;
    }
    main .input-forced-class,
    main input {
        width: 60%;
        margin-bottom: 8px;
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.5);
        padding: 4px;
        font-size: large;
        outline: unset;
    }
    main select {
        width: calc(60% + 10px) !important;
    }
    main input[type="checkbox"] {
        width: initial;
        border: 0;
        transform: scale(1.25);
    }

    .birthday-warning {
        color: #bb0000;
    }
    :global(body.dark-mode) .birthday-warning {
        color: #ff6363;
    }
    
    .create-acc {
        border-radius: 1024px;
        padding: 4px 8px;
        width: 60%;
        margin-top: 4px;
        
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(0, 0, 0, 0.2);
        font-size: 18px;
    }
    
    .create-acc[data-canCreate=true] {
        background: #00c3ff;
        cursor: pointer;
        color: white;
    }

    :global(body.dark-mode) .create-acc[data-canCreate=false] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
    }
    :global(body.dark-mode) :global(a),
    :global(body.dark-mode) a {
        color: rgb(73, 164, 255);
    }

    .create-acc[data-canCreate=false] {
        background: #9c9c9c;
        color: rgb(255, 255, 255);
        cursor: not-allowed;
    }

    .create-acc {
        transition-duration: 0.3s;
        transition-timing-function: cubic-bezier(0, 0, 0.24, 1.83);
        transition-property: transform;
    }
    .create-acc:active {
        transform: scale(0.9);
        transition-duration: 0.1s;
        transition-timing-function: ease-out;
        transition-property: transform;
    }
    .create-acc :global(div) :global(img) {
        width: 18px;
        height: 18px;
    }

    .input-title {
        width: calc(60% + 8px);
        font-size: small;
        opacity: 0.85;
    }
    :global(body.dark-mode) main {
        border-color: rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        background: #111;
    }
    :global(body.dark-mode) main .input-forced-class,
    :global(body.dark-mode) main input {
        border-color: rgba(255, 255, 255, 0.3);
        background: #111;
        color: white;
    }
    main .input-forced-class[data-valid="true"],
    main input[data-valid="true"] {
        border-color: rgb(0, 187, 0) !important;
    }
    main .input-forced-class[data-valid="false"],
    main input[data-valid="false"] {
        border-color: rgb(187, 0, 0) !important;
    }
    
    .footer-links {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        margin-top: 8px;
    }
    .footer-links a {
        margin: 0 8px;
    }

    .disable-markdown-margin :global(p) {
        margin: 0;
        margin-block: 0;
        display: inline;
    }
</style>
