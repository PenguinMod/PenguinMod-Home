<script>
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import { browser } from "$app/environment";
    import MarkdownIt from "markdown-it";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";
    
    // Static values
    import LINK from "../../resources/urls.js";
    
    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import ChecksBox from "$lib/ChecksBox/ChecksBox.svelte";
    import Button from "$lib/Button/Button.svelte";
    import Captcha from "$lib/Captcha.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import Language from "../../resources/language.js";
    import TranslationHandler from "../../resources/translations.js";
    import Authentication from "../../resources/authentication.js";
    import CountryLookup from "../../resources/country-lookup.json";

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
        checkIfValid();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    let username = "";
    let password = "";
    let email = "";
    let birthday = "";
    let country = "";
    let creatingAccount = false;
    let canCreateAccount = false;
    let apiCreateRejectReason = '';
    let showingPassword = false;
    let focused = "";
    let embed = false;
    if (browser) {
        embed = $page.url.searchParams.get('embed') === "true";
    }

    let apiOnlineChecking = true;
    let apiOnlineResponding = false;
    if (browser) {
        onMount(() => {
            const url = `${PUBLIC_API_URL}/api/v1`;
            fetch(url).then(res => {
                apiOnlineResponding = res.ok;
            }).finally(() => {
                apiOnlineChecking = false;
            });
        });
    }

    let emailValid = 0;
    let usernameValid = false;
    let passwordValid = false;
    let birthdayValid = false;
    let countryValid = false;

    let birthdayFaked = false;
    let consentedToDataUsage = false;
    let accurateDataAgreement = false;

    let captcha_token = false;

    const usernameRequirements = [
        {name: "username.requirement.length", value: false},
        {name: "username.requirement.letters", value: false},
        {name: "username.requirement.unique", value: false}
    ]

    const passwordRequirements = [
        {name: "password.requirement.length", value: false},
        {name: "password.requirement.casing", value: false},
        {name: "password.requirement.number", value: false},
        {name: "password.requirement.symbol", value: false},
    ]

    async function createAccount() {
        const token = await Authentication.createAccount(username, password, email, birthday, country, captcha_token);
        
        if (!token) {
            throw "Failed to create account";
        }

        localStorage.setItem("username", username);
        localStorage.setItem("token", token);
    }
    const createAccountSafe = () => {
        if (!canCreateAccount) {
            if (apiCreateRejectReason) {
                alert("Failed to create account:", apiCreateRejectReason);
                return;
            }
            if (emailValid === 1) {
                alert(TranslationHandler.textSafe(
                    "forgotpassword.invalidemail",
                    currentLang,
                    "Your email is not valid."
                ));
                return;
            }

            if (!consentedToDataUsage || !accurateDataAgreement) {
                return alert(TranslationHandler.textSafe(
                    "agreement.requirement.all",
                    currentLang,
                    "Not all agreements have been checked."
                ));
            }

            if (!captcha_token) {
                return alert(TranslationHandler.textSafe(
                    "login.error.captcha.complete",
                    currentLang,
                    "Please complete the captcha."
                ));
            }

            alert(TranslationHandler.textSafe(
                "username.requirement.notmet",
                currentLang,
                "Your username or password do not meet the requirements needed to create an account."
            ));
            return;
        }

        if (creatingAccount) return;
        creatingAccount = true;
        
        createAccount()
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
            canCreateAccount = false;
            apiCreateRejectReason = err;
            alert(`Failed to create account: ${err}`);
            console.error(err);
        })
        .finally(() => {
            creatingAccount = false;
        });
    }
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

    let isUsernameUnique = false;
    let hasDoneUsernameCheck = false;
    let usernameUniqueCheckId = 0; // used to fix problems when we type while checking if a username is unique
    function checkIfValid() {
        const usernameDoesNotMeetLength = username.length < 3 || username.length > 20;

        const usernameHasIllegalChars = Boolean(username.match(/[^a-z0-9\-_]/i));

        const userCheck = usernameDoesNotMeetLength || usernameHasIllegalChars;

        const passwordDoesNotMeetLength = password.length < 8 || password.length > 50;
        const passwordMeetsTextInclude = password.match(/[a-z]/) && password.match(/[A-Z]/);
        const passwordHasNumber = !!password.match(/[0-9]/);
        const passwordMeetsSpecialInclude = !!password.match(/[^a-z0-9]/i);

        const passwordCheck = passwordDoesNotMeetLength || !(passwordMeetsTextInclude && passwordMeetsSpecialInclude && passwordHasNumber);

        passwordRequirements[0].value = !passwordDoesNotMeetLength;
        passwordRequirements[1].value = passwordMeetsTextInclude;
        passwordRequirements[2].value = passwordHasNumber;
        passwordRequirements[3].value = passwordMeetsSpecialInclude;
        passwordValid = !passwordCheck;
        
        // NOTE: The API technically doesnt require a birthday or country, but that's only for OAuth2 accounts when they are first created.
        // We can skip that on the frontend for password-based accounts to make sign up smoother.
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
            if (birthYear === currentDate.getFullYear() && parsedBirthday.getDate() > currentDate.getDate()) {
                birthdayValid = false;
            }
        }
        countryValid = CountryLookup.countryCodes.includes(country);

        if (!username) {
            usernameRequirements[0].value = false;
            usernameRequirements[1].value = false;
            usernameRequirements[2].value = true;

            canCreateAccount = false;
            usernameValid = false;
            return;
        }

        canCreateAccount = !(userCheck || passwordCheck) && (isUsernameUnique && hasDoneUsernameCheck) && emailValid !== 1;
        usernameValid = (isUsernameUnique && hasDoneUsernameCheck) && !userCheck;
        if (!birthdayValid || !countryValid) {
            canCreateAccount = false;
        }
        if (!consentedToDataUsage || !accurateDataAgreement) {
            canCreateAccount = false;
        }

        usernameRequirements[0].value = !usernameDoesNotMeetLength;
        usernameRequirements[1].value = !usernameHasIllegalChars;
        usernameRequirements[2].value = hasDoneUsernameCheck ? isUsernameUnique : "loading";

        if (userCheck) {
            // the username is unique if it doesnt meet any of the other requirements
            usernameRequirements[2].value = true;
        }

        if (!captcha_token) {
            canCreateAccount = false;
        }

        return canCreateAccount;
    }

    let lastUsernameType = Infinity;
    function usernameInputChanged(event) {
        lastUsernameType = Date.now();
        hasDoneUsernameCheck = false;
        usernameUniqueCheckId += 1;

        username = event.target.value;
        checkIfValid();
    }

    const validateEmail = (email) => {
        return email.match(
            /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        ) ? 2 : 1;
    };
    const getMaxBirthdate = () => {
        const todaysDate = new Date();
        return `${todaysDate.getFullYear()}-${todaysDate.getMonth() + 1}-${todaysDate.getDate()}`;
    };

    function emailInputChanged(event) {
        if (event.target.value) {
            emailValid = validateEmail(event.target.value);
        } else {
            emailValid = 0;
        }
        email = event.target.value;
        checkIfValid();
    }
    const birthdayInputChanged = (event) => {
        birthday = event.target.value;
        checkIfValid();
    }
    const countryInputChanged = (event) => {
        country = event.target.value;
        checkIfValid();
    }

    function passwordInputChanged(event) {
        password = event.target.value;
        checkIfValid();
    }
    
    function checkIsUsernameUnique(username) {
        let url = `${PUBLIC_API_URL}/api/v1/users/userexists?username=${username}`;

        return new Promise((resolve, reject) => {
            fetch(url)
            .then((res) => res.json())
            .then((res) => {
                // if it doesnt exist, its unique
                resolve(!res.exists);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    if (browser) {
        // we dont want to query the api if the tab isnt focused
        let tabIsFocused = document.hasFocus();
        document.addEventListener("focus", () => {
            tabIsFocused = true;
        });
        document.addEventListener("blur", () => {
            tabIsFocused = false;
        });

        let lastCheckedValue = "";
        setInterval(() => {
            if (!tabIsFocused) return;
            if (lastCheckedValue === username) return;
            
            // we dont want to query the api while they are typing
            if (Date.now() - lastUsernameType < 600) return;
            // username should be valid before we check anything
            if (!usernameRequirements[0].value) return;
            if (!usernameRequirements[1].value) return;

            // update the event id before saving it, otherwise we will always assume another event is now running
            usernameUniqueCheckId += 1;
            let checkIdThisEvent = usernameUniqueCheckId;

            checkIsUsernameUnique(username)
                .then(isUnique => {
                    // this affectively acts like restartExistingThreads in scratch, since the username changed
                    if (checkIdThisEvent != usernameUniqueCheckId) return;
                    hasDoneUsernameCheck = true;
                    isUsernameUnique = isUnique;
                    checkIfValid();
                });
            lastCheckedValue = username;
        }, 1000);
    }

    const togglePasswordView = () => {
        showingPassword = !showingPassword;
    };

    function addOAuthEventListener() {
        window.addEventListener("message", (event) => {
            if (event.origin !== PUBLIC_API_URL) return;
            
            if (!event.data) return;

            const { username, token } = event.data;

            localStorage.setItem("username", username);
            localStorage.setItem("token", token);

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

            const redir = $page.url.searchParams.get('redirect');

            location.href = redir ? redir : "/";
        });
    }

    function oauthFrame(method) {
        let iframe = window.open(`${PUBLIC_API_URL}/api/v1/users/createoauthaccount?method=${method}`, `Sign up with ${method}`, "width=500,height=500");

        if (!iframe) {
            alert(TranslationHandler.textSafe(
                "signup.oauth.nopopup",
                currentLang,
                "Please enable popups to sign up with {{WEBSITE}}."
            ).replace('{{WEBSITE}}', method));
            return;
        }

        addOAuthEventListener();
    }

    function googleOAuth() {
        oauthFrame("google");
    }

    function githubOAuth() {
        oauthFrame("github");
    }

    function scratchOauth() {
        oauthFrame("scratch");
    }

    // translation MD
    const md = new MarkdownIt({
        html: false,
        linkify: false,
        breaks: true,
    });
    
    const defaultLinkOpenRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        // we should not exit the signup page
        tokens[idx].attrSet('target', '_blank');

        // Pass the token to the default renderer.
        return defaultLinkOpenRender(tokens, idx, options, env, self);
    };
    
    const env = {};
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };
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

    {#if !apiOnlineChecking && apiOnlineResponding}
        <main>
            <div class="profile-section">
                <img
                    src="/account/profile_sheet.png"
                    alt="Profiles"
                    title={TranslationHandler.textSafe(
                        "signup.profilewheel",
                        currentLang,
                        "Feel free to draw your own profile picture to get ready for your new account!"
                    )}
                />
            </div>
            <h1 style="margin-block:4px">PenguinMod</h1>
            <p>
                <LocalizedText
                    text="Create your personal account"
                    key="signup.title"
                    lang={currentLang}
                />
            </p>

            <button class="gsi-material-button" on:click={googleOAuth}>
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block;">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                    </div>
                    <span class="gsi-material-button-contents">
                        <LocalizedText
                            text="Sign up with Google"
                            key="signup.oauth.google"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Sign up with Google"
                            key="signup.oauth.google"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>

            <button class="gsi-material-button" on:click={githubOAuth}>
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <img
                            src="/github-mark/github-mark.svg"
                            alt="github"
                            class="invert-on-dark"
                            style="display: block;width:20px;height:20px;"
                        />
                    </div>
                    <span class="gsi-material-button-contents">
                        <LocalizedText
                            text="Sign up with GitHub"
                            key="signup.oauth.github"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Sign up with GitHub"
                            key="signup.oauth.github"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>

            <button class="gsi-material-button" on:click={scratchOauth}>
                <div class="gsi-material-button-state"></div>
                <div class="gsi-material-button-content-wrapper">
                    <div class="gsi-material-button-icon">
                        <img src="/Scratch_S.svg" alt="Scratch" style="display:block;width:20px;height:20px;">
                    </div>
                    <span class="gsi-material-button-contents">
                        <LocalizedText
                            text="Sign up with Scratch"
                            key="signup.oauth.scratch"
                            lang={currentLang}
                        />
                    </span>
                    <span style="display: none;">
                        <LocalizedText
                            text="Sign up with Scratch"
                            key="signup.oauth.scratch"
                            lang={currentLang}
                        />
                    </span>
                </div>
            </button>

            <p class="or-line">
                <LocalizedText
                    text="or"
                    key="account.methods.orline"
                    lang={currentLang}
                />
            </p>

            <span class="input-title">
                <LocalizedText
                    text="Username"
                    key="account.fields.username"
                    lang={currentLang}
                />
            </span>
            <input
                type="text"
                placeholder={TranslationHandler.textSafe(
                    "account.fields.username.placeholder",
                    currentLang,
                    "Use something iconic!"
                )}
                data-valid={usernameValid}
                maxlength="20"
                on:input={usernameInputChanged}
                on:focusin={() => focused = "username"}
                on:focusout={() => focused = ""}
            />
            {#if focused === "username"}
                <ChecksBox items={usernameRequirements} />
            {/if}
                
            <span class="input-title">
                <LocalizedText
                    text="Email (Optional)"
                    key="account.fields.email"
                    lang={currentLang}
                />
            </span>
            <input
                type="text"
                placeholder={TranslationHandler.textSafe(
                    "account.fields.email.placeholder",
                    currentLang,
                    "Your email address"
                )}
                data-valid={emailValid}
                class="email-input"
                maxlength="254"
                on:input={emailInputChanged}
                on:focusin={() => focused = "email"}
                on:focusout={() => focused = ""}
            />

            <span class="input-title">
                <LocalizedText
                    text="Password"
                    key="account.fields.password"
                    lang={currentLang}
                />
            </span>
            <div class="password-wrapper">
                <input
                    type={showingPassword ? "text" : "password"}
                    placeholder={TranslationHandler.textSafe(
                        "account.fields.password.placeholder",
                        currentLang,
                        "Remember to write it down!"
                    )}
                    data-valid={passwordValid}
                    maxlength="50"
                    on:input={passwordInputChanged}
                    on:focusin={() => focused = "password"}
                    on:focusout={() => focused = ""}
                />
                <button
                    class="password-show"
                    on:click={togglePasswordView}>
                    {#if showingPassword}
                        <img
                            src="/account/hidepassword.svg"
                            alt="Hide Password"
                            class="invert-on-dark"
                        />
                    {:else}
                        <img
                            src="/account/showpassword.svg"
                            alt="Show Password"
                            class="invert-on-dark"
                        />
                    {/if}
                </button>
            </div>
            {#if focused === "password"}
                <ChecksBox items={passwordRequirements} />
            {/if}

            <span class="input-title">
                <LocalizedText
                    text="Country"
                    key="account.fields.country"
                    lang={currentLang}
                />
            </span>
            <select
                class="input-forced-class"
                data-valid={countryValid}
                on:input={countryInputChanged}
            >
                <option value="" selected disabled>
                    <LocalizedText
                        text="Select the country your child lives in"
                        key="account.fields.country.placeholder"
                        lang={currentLang}
                    />
                </option>
                {#each CountryLookup.countryCodes as countryCode}
                    <option value={countryCode}>{CountryLookup.countryNames[countryCode]}</option>
                {/each}
            </select>

            <span class="input-title">
                <LocalizedText
                    text="Your Child's Birthdate"
                    key="account.fields.birthdate"
                    lang={currentLang}
                />
            </span>
            <input
                type="date"
                min="1900-01-01"
                max={getMaxBirthdate()}
                data-valid={birthdayValid}
                on:input={birthdayInputChanged}
            />

            <Captcha on:update={(event) => {
                captcha_token = event.detail;
            }} />

            {#if birthdayFaked}
                <p class="birthday-warning">
                    <LocalizedText
                        text="Did your parent/guardian give you permission to use PenguinMod?"
                        key="birthday.requirement.faked.line1"
                        lang={currentLang}
                    />
                    <br>
                    <LocalizedText
                        text="That seems like you're trying to secretly make an account without them knowing."
                        key="birthday.requirement.faked.line2"
                        lang={currentLang}
                    />
                </p>
            {/if}

            <label style="width:60%">
                <input
                    type="checkbox"
                    bind:checked={consentedToDataUsage}
                    on:change={checkIfValid}
                />
                <span class="disable-markdown-margin">
                    {@html generateMarkdown(`${TranslationHandler.textSafe(
                        "account.fields.agreements.personalinfo",
                        currentLang,
                        "I agree to allow PenguinMod to collect and use my country and date of birth (or my child's if I am registering on their behalf) in accordance with the [Privacy Policy](/privacy)."
                    )}`)}
                </span>
            </label>
            <label style="width:60%">
                <input
                    type="checkbox"
                    bind:checked={accurateDataAgreement}
                    on:change={checkIfValid}
                />
                <span class="disable-markdown-margin">
                    {@html generateMarkdown(`${TranslationHandler.textSafe(
                        "account.fields.agreements.accurate",
                        currentLang,
                        "I confirm that the information I have provided is accurate, and I understand that my date of birth and country cannot be changed after account creation without contacting support."
                    )}`)}
                </span>
            </label>

            <p>
                {@html generateMarkdown(`${TranslationHandler.textSafe(
                    "signup.confirm.legal.alt",
                    currentLang,
                    "By creating a PenguinMod account through any means provided on this page, you agree to abide by the [Terms of Service](/terms) and [Uploading Guidelines](/guidelines/uploading) and confirm that you have read the [Privacy Policy](/privacy) in its entirety. If you are a parent or guardian creating an account for a child, you agree to these terms on their behalf. If you are legally an adult, you confirm that you are creating this account for yourself."
                )}`)}
            </p>

            <button type="submit" class="create-acc" data-canCreate={canCreateAccount} on:click={createAccountSafe}>
                {#if creatingAccount}
                    <LoadingSpinner icon="/loading_white.png" />
                {:else}
                    <LocalizedText
                        text="Create"
                        key="signup.confirm"
                        lang={currentLang}
                    />
                {/if}
            </button>

            <a href="/signin?embed={embed}" style="margin-top: 8px">
                <LocalizedText
                    text="Already have an account? Sign in here!"
                    key="signup.linkto.signin"
                    lang={currentLang}
                />
            </a>
        </main>
    {:else if !apiOnlineChecking && !apiOnlineResponding}
        <main>
            <img
                src="/penguins/server.svg"
                alt="Server Penguin"
                style="width: 15rem"
            />
            <p>
                <LocalizedText
                    text="Whoops! Our server's having some problems. Try again later."
                    key="home.server.error"
                    lang={currentLang}
                />
            </p>
            <Button
                label="<img src='/tryit.svg' width='32px' style='margin-right:8px;filter:contrast(0%) brightness(999%)'></img>"
                link={LINK.editor}
            >
                <LocalizedText
                    text="Editor"
                    key="home.footer.sections.website.editor"
                    lang={currentLang}
                />
            </Button>
        </main>
    {:else}
        <LoadingSpinner />
    {/if}

    <div class="footer-links">
        <a target="_blank" href={LINK.terms}>
            <LocalizedText
                text="Terms of Service"
                key="home.footer.sections.info.terms"
                lang={currentLang}
            />
        </a>
        <a target="_blank" href={LINK.privacy}>
            <LocalizedText
                text="Privacy Policy"
                key="home.footer.sections.info.privacy"
                lang={currentLang}
            />
        </a>
        <a target="_blank" href={LINK.contact}>
            <LocalizedText
                text="Contact Us"
                key="home.footer.sections.info.contact"
                lang={currentLang}
            />
        </a>
    </div>

    <!-- the magical div of scroll -->
    <div style="height:32px" />
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

    .password-wrapper {
        width: 60%;
        margin-left: -10px;
        margin-bottom: 8px;
        position: relative;
    }
    .password-wrapper input {
        width: 100%;
        margin-bottom: 0;
    }
    :global(html[dir="rtl"]) .password-wrapper {
        margin-right: -10px;
        margin-left: initial;
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

    .disable-markdown-margin :global(p) {
        margin: 0;
        margin-block: 0;
        display: inline;
    }

    .email-input[data-valid="0"] {
        border-color: rgba(0, 0, 0, 0.5) !important;
    }

    :global(body.dark-mode) .email-input[data-valid="0"] {
        border-color: rgba(255, 255, 255, 0.3) !important;
    }

    .email-input[data-valid="2"] {
        border-color: rgb(0, 187, 0) !important;
    }

    .email-input[data-valid="1"] {
        border-color: rgb(187, 0, 0) !important;
    }

    .password-show {
        position: absolute;
        right: 0px;
        top: 4px;
        width: 24px;
        height: calc(100% - 8px);
        border: 0;
        background: transparent;
        opacity: 0.7;
        cursor: pointer;
    }

    .password-show img {
        width: 24px;
        height: 24px;
    }

    :global(body.dark-mode) .invert-on-dark {
        filter: invert(1);
    }
    :global(html[dir="rtl"]) .password-show {
        right: initial;
        left: -4px;
    }

    .birthday-warning {
        color: #bb0000;
    }
    :global(body.dark-mode) .birthday-warning {
        color: #ff6363;
    }

    .or-line {
        margin-block: 2px;
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
    
    main a {
        margin-top: 8px;
        color: dodgerblue;
        text-decoration: none;
    }
    :global(body.dark-mode) :global(a),
    :global(body.dark-mode) a {
        color: rgb(73, 164, 255);
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

    @keyframes profile-scroll {
        0%, 10% {
            transform: translateX(0);
        }
        15%, 25% {
            transform: translateX(-96px);
        }
        30%, 40% {
            transform: translateX(-192px);
        }
        45%, 55% {
            transform: translateX(-288px);
        }
        60%, 70% {
            transform: translateX(-384px);
        }
        75%, 85% {
            transform: translateX(-480px);
        }
        90%, 100% {
            transform: translateX(-480px);
        }
    }
    .profile-section {
        width: 96px;
        height: 96px;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
    }
    .profile-section img {
        position: absolute;
        left: 0;
        top: 0;
        height: 96px;
        animation: profile-scroll 10s linear infinite;
        animation-delay: 3s;
    }

    /* google stuff */
    .gsi-material-button {
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-appearance: none;
        appearance: none;
        background-color: WHITE;
        background-image: none;
        border: 1px solid #747775;
        -webkit-border-radius: 20px;
        border-radius: 20px;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        color: #1f1f1f;
        cursor: pointer;
        font-family: 'Roboto', arial, sans-serif;
        font-size: 14px;
        height: 40px;
        letter-spacing: 0.25px;
        outline: none;
        overflow: hidden;
        padding: 0 12px;
        position: relative;
        text-align: center;
        -webkit-transition: background-color .218s, border-color .218s, box-shadow .218s;
        transition: background-color .218s, border-color .218s, box-shadow .218s;
        vertical-align: middle;
        white-space: nowrap;
        width: 60%;
        max-width: 400px;
        min-width: 220px;
        margin-bottom: 8px;
    }

    :global(body.dark-mode) .gsi-material-button {
        background-color: #131314;
        border-color: #8e918f;
        color: #e3e3e3;
    }

    .gsi-material-button .gsi-material-button-icon {
        height: 20px;
        margin-right: 12px;
        min-width: 20px;
        width: 20px;
    }

    .gsi-material-button .gsi-material-button-content-wrapper {
        -webkit-align-items: center;
        align-items: center;
        display: flex;
        -webkit-flex-direction: row;
        flex-direction: row;
        -webkit-flex-wrap: nowrap;
        flex-wrap: nowrap;
        height: 100%;
        justify-content: space-between;
        position: relative;
        width: 100%;
    }

    .gsi-material-button .gsi-material-button-contents {
        -webkit-flex-grow: 1;
        flex-grow: 1;
        font-family: 'Roboto', arial, sans-serif;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: top;
    }

    .gsi-material-button .gsi-material-button-state {
        -webkit-transition: opacity .218s;
        transition: opacity .218s;
        bottom: 0;
        left: 0;
        opacity: 0;
        position: absolute;
        right: 0;
        top: 0;
    }

    .gsi-material-button:disabled {
        cursor: default;
        background-color: #ffffff61;
        border-color: #1f1f1f1f;
    }
    :global(body.dark-mode) .gsi-material-button:disabled {
        background-color: #13131461;
        border-color: #8e918f1f;
    }

    .gsi-material-button:disabled .gsi-material-button-state {
        background-color: #e3e3e31f;
    }

    .gsi-material-button:disabled .gsi-material-button-contents {
        opacity: 38%;
    }

    .gsi-material-button:disabled .gsi-material-button-icon {
        opacity: 38%;
    }

    .gsi-material-button:not(:disabled):active .gsi-material-button-state, 
    .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
        background-color: #303030;
        opacity: 12%;
    }

    :global(body.dark-mode) .gsi-material-button:not(:disabled):active .gsi-material-button-state, 
    :global(body.dark-mode) .gsi-material-button:not(:disabled):focus .gsi-material-button-state {
        background-color: white;
        opacity: 12%;
    }

    .gsi-material-button:not(:disabled):hover {
        -webkit-box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
        box-shadow: 0 1px 2px 0 rgba(60, 64, 67, .30), 0 1px 3px 1px rgba(60, 64, 67, .15);
    }

    .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
        background-color: #303030;
        opacity: 8%;
    }
    :global(body.dark-mode) .gsi-material-button:not(:disabled):hover .gsi-material-button-state {
        background-color: white;
        opacity: 8%;
    }
</style>
