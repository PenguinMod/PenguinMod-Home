<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";

    import Authentication from "../resources/authentication.js";
    import ProjectApi from "../resources/projectapi.js";
    import censor from "../resources/basiccensorship.js";
    const ProjectClient = new ProjectApi();

    // Static values
    import LINK from "../resources/urls.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import EventComponent from "$lib/Event/Component.svelte";
    import ContentCategory from "$lib/ContentCategory/Component.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import UserDisplay from "$lib/UserDisplay/Display.svelte";
    import Project from "$lib/Project/Project.svelte";
    import Alert from "$lib/Alert/Alert.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../resources/translations.js";
    import Language from "../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../icons/Penguin/confused.svelte";

    const isAprilFools = () => {
        const date = new Date(Date.now());
        const urlParams = $page.url.searchParams;
        const isAprilFools = date.getMonth() === 3 && date.getDate() === 1; // month is 0 indexed for literally no reason
        const runningLocal = String(urlParams.get('forceaprilfools')) === 'true' && $page.url.hostname === 'localhost';

        return isAprilFools || runningLocal;
    };

    let loggedIn = null;
    let langDecided = false;
    let currentLang = "en";

    let ghcommits = [];
    let myFeed = [];
    let updates = [];
    let feedIsEmpty = false;
    let ghcommitsFailed = false;
    let ghcommitsLoaded = false;
    let projectsLoaded = false;
    let projectsFailed = false;

    let catText = '⠀';
    let existingInterval;
    const catAudio = () => {
        const audio = new Audio('./cat/speak.mp3');
        audio.currentTime = 0;
        audio.volume = 0.5;

        audio.onended = () => {
            audio.remove();
        };

        audio.play();
    };
    const catSpeak = () => {
        if (existingInterval) {
            clearInterval(existingInterval);
        }

        const randomText = (() => {
	    	const catEmotions = [
                "/ᐠ.ꞈ.ᐟ\\",
                "(^・x・^)",
                "ฅ^•ﻌ•^ฅ",
                "(^._.^)",
                "≧^◡^≦",
                "ฅ(＾・ω・＾ฅ)",
                "(^人^)",
                "ヾ(=^・^=)丿",
                "ヽ(^◇^*)/",
                "ฅ(=･ω･=)ฅ"
            ];
	    	return catEmotions[Math.round(Math.random() * (catEmotions.length - 1))];
	    })();
        let index = 0;
        catText = '⠀';

        existingInterval = setInterval(() => {
            catText += randomText.charAt(index);
            catAudio();
            index++;

            if (index >= randomText.length) {
                clearInterval(existingInterval);
            }
        }, 100);
    };

    let projects = {
        today: [],
        featured: [],
        liked: [],
        voted: [],
        viewed: [],
        tagged: [],
    };

    const ratings = [
        'omg you where so close with $1%!!!!! but sadly not this time',
        'getting warmer :)',
        'waaaaaaarmer.....',
        'waaaarmer....',
        'yeah thats the right direction',
        'boowomp, you got nothing',
        'your tempurture is!!!!!!!!!!! mild.',
        'colder....',
        'cooolder.....',
        'bro stop, this isnt the correct direction',
        'my g what are you doing, go back to 50%<',
        'dude, are how unlucky are you dear god',
        'dude just got owned by the js random number generater at a whoping $1% off from success'
    ]
    function formatNumber(num) {
        return Math.abs(num) >= 0.01 && num % 1 !== 0
            ? num.toFixed(2)
            : num
    }
    function rateChance(max, thresh) {
        const randomNumber = Math.random()
        const underThresh = randomNumber * max <= thresh
        const ratingIdx = Math.floor(randomNumber * ratings.length)
        const ratingMsg = underThresh
            ? 'yo you actually got it thats so epic!!!!!!!!'
            : ratings[ratingIdx]
                .replace('$1', formatNumber(randomNumber * 100))
        return [underThresh, ratingMsg]
    }
    let thingyActive = false;
    // do the thingy
    $: {
        if (!loggedIn) {
            // 1:9000 chance that we will play the video imediatly rather then after four hours
            // we use 9000 because thats roughly how many users we have, so there will now
            // only be like onr or two people who actually get this :Trol
            let message
            [thingyActive, message] = rateChance(9000, 1);
            console.log(message)
            setTimeout(() => {
                thingyActive = true;
            }, 1.44e7);
        } else console.log("you dont get to see the thingy :trol:");
    }

    const getAndUpdateMyFeed = async () => {
        const feed = await ProjectClient.getMyFeed();
        if (feed.length <= 0) {
            feedIsEmpty = true;
        }
        myFeed = feed;
    };
    const getFeedText = (type, author, content) => {
        switch (type) {
            case "follow":
                return TranslationHandler.text(
                    "feed.following",
                    currentLang
                ).replace("$1", author);
            case "upload":
                return TranslationHandler.text("feed.uploaded", currentLang)
                    .replace("$1", author)
                    .replace("$2", content.name);
            case "remixed":
                return TranslationHandler.text("feed.remixed", currentLang)
                    .replace("$1", author)
                    .replace("$2", content.name);
            case "posted":
                return TranslationHandler.text(
                    "feed.posted",
                    currentLang
                ).replace("$1", author);
        }
    };
    const getFeedUrl = (type, author, content) => {
        switch (type) {
            case "upload":
            case "remixed":
                return `https://studio.penguinmod.com/#${content.id}`;
            case "posted":
                return `/profile?user=${author}&post=${content.id}`;
            default:
                return `/profile?user=${author}`;
        }
    };

    let tagForProjects = "";
    onMount(async () => {
        const projectId = Number(location.hash.replace("#", ""));
        if (!isNaN(projectId) && projectId != 0) {
            location.href = `https://studio.penguinmod.com/#${projectId}`;
            return;
        }

        fetch(`${LINK.basicApi}commits`)
            .then((res) => {
                res.json()
                    .then((commits) => {
                        ghcommits = commits;
                        ghcommitsLoaded = true;
                    })
                    .catch(() => {
                        ghcommitsFailed = true;
                    });
            })
            .catch(() => {
                ghcommitsFailed = true;
            });
        fetch(`${LINK.basicApi}updates`).then((res) => {
            res.json().then((updatess) => {
                // currently multiple updates are not supported
                updates = [updatess];
            });
        });

        ProjectApi.getFrontPage()
            .then(results => {
                projects.today = results.latest;
                projects.featured = results.featured;
                projects.liked = results.liked;
                projects.voted = results.voted;
                projects.viewed = results.viewed;
                projects.tagged = results.tagged;
                tagForProjects = results.selectedTag;
                projectsLoaded = true;
            })
            .catch(() => {
                projectsFailed = true;
            });
    });

    // login code below
    let loggedInUsername = "";
    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    loggedInUsername = username;
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    getAndUpdateMyFeed();
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        myFeed = [];
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        Authentication.usernameFromCode(privateCode)
            .then(({ username }) => {
                if (username) {
                    loggedInUsername = username;
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    getAndUpdateMyFeed();
                    return;
                }
                loggedIn = false;
            })
            .catch(() => {
                loggedIn = false;
            });
    });

    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
        langDecided = true;
    });

    let selectedFrontTabSelected = "new";
</script>

<svelte:head>
    <title>PenguinMod - Home</title>
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home">
    <meta name="description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="twitter:description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <Alert
        onlyShowID={"donatee:_2"}
        text={"PenguinMod is a free-to-use visual coding website. Your support can help us keep the website working!"}
        textBreakup={true}
        textColor={"white"}
        hasImage={true}
        imgSrc={"/happy.svg"}
        imgAlt={":D"}
        hasButton={true}
        buttonText={"Donate"}
        buttonHref={"/donate"}
    />
    <!-- TODO: should we remove this? -->
    <!-- <Alert
        onlyShowID={"privacee:_1"}
        text={"Our privacy policy has been updated."}
        textBreakup={true}
        textColor={"white"}
        backColor={"#009900"}
        hasImage={false}
        hasButton={true}
        buttonText={"View"}
        buttonHref={"https://studio.penguinmod.com/privacy.html"}
    /> -->
    <StatusAlert />

    {#if loggedIn === false}
        <div class="section-info">
            <div style="margin-left: 8rem;">
                <h1>
                    <LocalizedText
                        text="Block-based coding with tons of capabilities"
                        key="home.introduction1"
                        lang={currentLang}
                    />
                </h1>
                <h1>
                    <LocalizedText
                        text="Built off of TurboWarp and Scratch"
                        key="home.introduction2"
                        lang={currentLang}
                    />
                </h1>
                <Button
                    label="<img src='/tryit.svg' width='32px' style='margin-right:8px'></img>"
                    highlighted="true"
                    link={LINK.editor}
                >
                    {#if !thingyActive}
                        <LocalizedText
                            text="Try it out"
                            key="home.tryout"
                            lang={currentLang}
                        />
                    {:else}
                        EEEAAAOOO
                    {/if}
                </Button>
            </div>

            {#if !thingyActive}
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
            {:else}
                <iframe
                    src="/eao.html"
                    title="The Thingy"
                    width="426.666667"
                    height="240"
                    frameborder="0"
                    class="example-video"
                />
            {/if}
        </div>

        {#if langDecided && currentLang != "en" && loggedIn === false}
            <div class="section-language-warning">
                <img
                    src="/warning.png"
                    draggable="false"
                    style="height: 24px; margin-right: 6px"
                    alt="Warning"
                />
                <p>
                    <LocalizedText
                        text="PenguinMod is made by English-speaking developers. Expect minor issues and sorry for any translation errors."
                        key="translation.warning"
                        lang={currentLang}
                    />
                </p>
            </div>
        {/if}

        <div class="section-links">
            <Button link={LINK.packager}>
                <LocalizedText
                    text="Packager"
                    key="home.footer.sections.website.packager"
                    lang={currentLang}
                />
            </Button>
            <Button link={LINK.credits}>
                <LocalizedText
                    text="Credits"
                    key="home.footer.sections.website.credits"
                    lang={currentLang}
                />
            </Button>
            <Button link={"/donate"}>
                <LocalizedText
                    text="Donate"
                    key="home.footer.sections.donate"
                    lang={currentLang}
                />
            </Button>
            <Button label="GitHub" link={LINK.github} />
            <Button link={LINK.wiki}>
                <LocalizedText
                    text="Community Wiki"
                    key="home.footer.sections.community.wiki"
                    lang={currentLang}
                />
            </Button>
        </div>
    {/if}

    {#if langDecided && currentLang != "en" && loggedIn !== false}
        <div class="section-language-warning">
            <img
                src="/warning.png"
                draggable="false"
                style="height: 24px; margin-right: 6px"
                alt="Warning"
            />
            <p>
                <LocalizedText
                    text="PenguinMod is made by English-speaking developers. Expect minor issues and sorry for any translation errors."
                    key="translation.warning"
                    lang={currentLang}
                />
            </p>
        </div>
    {/if}

    <p style="width: 100%; text-align: center;">
        <i>
            <LocalizedText
                text="Scratch Note: Please don't mention PenguinMod on Scratch, we have different rules compared to Scratch! 😅"
                key="home.scratchnote"
                dontlink={true}
                lang={currentLang}
            />
        </i>
    </p>

    <div class="section-categories">
        {#if loggedIn !== true}
            <ContentCategory
                header={TranslationHandler.text(
                    "home.sections.whatsnew",
                    currentLang
                )}
                seemore={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
            >
                <div class="category-content">
                    {#if updates.length > 0}
                        {#each updates as update}
                            <UserDisplay
                                link={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
                                userLink={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
                                text={update.cleanContent}
                                author={update.authorName}
                                image={update.authorImage}
                            />
                            <a target="_blank" href={update.image}>
                                <button class="update-image-wrapper">
                                    <img
                                        src={update.image}
                                        alt={update.cleanContent}
                                        title={update.cleanContent}
                                        class="update-image"
                                    />
                                </button>
                            </a>
                        {/each}
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
            </ContentCategory>
        {:else}
            <div class="welcome-back-card">
                <img
                    src={`https://trampoline.turbowarp.org/avatars/by-username/${loggedInUsername}`}
                    alt="Profile"
                    class="profile-picture"
                />
                <h1>
                    {TranslationHandler.text(
                        "home.welcome",
                        currentLang
                    ).replace('$1', loggedInUsername)}
                </h1>
                <div class="welcome-back-row">
                    <a href={LINK.editor} class="welcome-back-no-underline">
                        <button class="welcome-back-button">
                            <div class="welcome-back-icon-container">
                                <img
                                    src="/messages/create.svg"
                                    alt="Create"
                                    draggable="false"
                                />
                            </div>
                            <LocalizedText
                                text="Create"
                                key="navigation.create"
                                lang={currentLang}
                            />
                        </button>
                    </a>
                    <a href={`/mystuff`} class="welcome-back-no-underline">
                        <button class="welcome-back-button">
                            <div class="welcome-back-icon-container">
                                <img
                                    src="/messages/mystuff.svg"
                                    alt="My Stuff"
                                    draggable="false"
                                />
                            </div>
                            <LocalizedText
                                text="My Stuff"
                                key="navigation.mystuff"
                                lang={currentLang}
                            />
                        </button>
                    </a>
                    <a
                        href={`/profile?user=${loggedInUsername}`}
                        class="welcome-back-no-underline"
                    >
                        <button class="welcome-back-button">
                            <div class="welcome-back-icon-container">
                                <img
                                    src="/messages/profile.svg"
                                    alt="Profile"
                                    draggable="false"
                                />
                            </div>
                            <LocalizedText
                                text="Profile"
                                key="navigation.profile"
                                lang={currentLang}
                            />
                        </button>
                    </a>
                </div>
            </div>
        {/if}
        {#if loggedIn && selectedFrontTabSelected === "feed"}
            <ContentCategory
                header={TranslationHandler.text(
                    "home.sections.feed",
                    currentLang
                )}
            >
                <div class="category-content">
                    {#if myFeed.length > 0}
                        {#each myFeed as message}
                            {#if message}
                                <UserDisplay
                                    link={getFeedUrl(
                                        message.type,
                                        message.username,
                                        message.content
                                    )}
                                    userLink={`/profile?user=${message.username}`}
                                    text={getFeedText(
                                        message.type,
                                        message.username,
                                        message.content
                                    )}
                                    author={message.username}
                                    image={`https://trampoline.turbowarp.org/avatars/by-username/${message.username}`}
                                />
                            {/if}
                        {/each}
                    {:else if feedIsEmpty}
                        <PenguinConfusedSVG width="6rem" />
                        <p>
                            <LocalizedText
                                text="Nothing was found."
                                key="generic.notfound"
                                lang={currentLang}
                            />
                        </p>
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
            </ContentCategory>
        {:else if !loggedIn || selectedFrontTabSelected === "commit"}
            <ContentCategory
                header={TranslationHandler.text(
                    "home.sections.githubcommits",
                    currentLang
                )}
                seemore={LINK.github}
            >
                <div class="category-content">
                    {#if ghcommits.length > 0}
                        {#each ghcommits as commit}
                            {#if commit}
                                <UserDisplay
                                    link={commit.html_url}
                                    userLink={commit.author
                                        ? commit.author.html_url
                                        : ""}
                                    text={censor(commit.commit.message)}
                                    author={commit.author
                                        ? commit.author.login
                                        : ""}
                                    image={commit.author
                                        ? commit.author.avatar_url
                                        : ""}
                                />
                            {/if}
                        {/each}
                    {:else if ghcommitsFailed}
                        <p>
                            <LocalizedText
                                text="Failed to load commits."
                                key="home.sections.githubcommits.failed.generic"
                                lang={currentLang}
                            />
                        </p>
                    {:else if ghcommitsLoaded}
                        <p style="text-align: center;">
                            <LocalizedText
                                text="GitHub failed to provide commits. Please try again later."
                                key="home.sections.githubcommits.failed.provide"
                                lang={currentLang}
                            />
                        </p>
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
            </ContentCategory>
        {:else if loggedIn && selectedFrontTabSelected === "new"}
            <ContentCategory
                header={TranslationHandler.text(
                    "home.sections.whatsnew",
                    currentLang
                )}
                seemore={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
            >
                <div class="category-content">
                    {#if updates.length > 0}
                        {#each updates as update}
                            <UserDisplay
                                link={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
                                userLink={`https://discord.com/channels/1033551490331197462/1038252360184643674`}
                                text={update.cleanContent}
                                author={update.authorName}
                                image={update.authorImage}
                            />
                            <a target="_blank" href={update.image}>
                                <button class="update-image-wrapper">
                                    <img
                                        src={update.image}
                                        alt="Screenshot"
                                        class="update-image"
                                    />
                                </button>
                            </a>
                        {/each}
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
            </ContentCategory>
        {/if}
    </div>
    {#if loggedIn}
        <div class="section-category-toggles">
            <div class="category-toggle-section" />
            <div class="category-toggle-section">
                <button
                    class="section-toggle-button"
                    data-active={selectedFrontTabSelected === "new"}
                    on:click={() => {
                        selectedFrontTabSelected = "new";
                    }}
                >
                    <LocalizedText
                        text="What's new?"
                        key="home.sections.whatsnew"
                        lang={currentLang}
                    />
                </button>
                <button
                    class="section-toggle-button"
                    data-active={selectedFrontTabSelected === "feed"}
                    on:click={() => {
                        selectedFrontTabSelected = "feed";
                    }}
                >
                    <LocalizedText
                        text="My Feed"
                        key="home.sections.feed"
                        lang={currentLang}
                    />
                </button>
                <button
                    class="section-toggle-button"
                    data-active={selectedFrontTabSelected === "commit"}
                    on:click={() => {
                        selectedFrontTabSelected = "commit";
                    }}
                >
                    <LocalizedText
                        text="Recent commits"
                        key="home.sections.githubcommits"
                        lang={currentLang}
                    />
                </button>
            </div>
        </div>
    {/if}
    
    <div style="width:80%; margin:0 10%;">
        <EventComponent />
    </div>

    <div class="section-projects">
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.weeklyfeatured",
                currentLang
            )}
            seemore={`/search?q=featured%3Aprojects`}
            style="width:65%;"
            stylec="height: 244px;overflow-x:auto;overflow-y:hidden;"
        >
            <div class="project-list">
                {#if projects.featured.length > 0}
                    {#each projects.featured as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsLoaded === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
                        <PenguinConfusedSVG width="8rem" />
                        <p>
                            <LocalizedText
                                text="Nothing found. You can help feature projects by clicking the yellow checkmark below them."
                                key="home.none.featured"
                                lang={currentLang}
                            />
                        </p>
                    </div>
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
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
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.mostliked",
                currentLang
            )}
            seemore={`/search?q=sort%3Alikes%20featured%3Aexclude`}
            style="width:65%;"
            stylec="height: 244px;overflow-x:auto;overflow-y:hidden;"
        >
            <div class="project-list">
                {#if projects.liked.length > 0}
                    {#each projects.liked as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
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
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.mostvoted",
                currentLang
            )}
            seemore={`/search?q=sort%3Avotes%20featured%3Aexclude`}
            style="width:65%;"
            stylec="height: 244px;overflow-x:auto;overflow-y:hidden;"
        >
            <div class="project-list">
                {#if projects.voted.length > 0}
                    {#each projects.voted as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
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
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        {#if projects.tagged.length > 7}
            <ContentCategory
                header={String(TranslationHandler.text(
                    "home.sections.sortedbytag",
                    currentLang
                )).replace('$1', tagForProjects)}
                seemore={`/search?q=%23${tagForProjects}`}
                style="width:65%;"
                stylec="height: 244px;overflow-x:auto;overflow-y:hidden;"
            >
                <div class="project-list">
                    {#each projects.tagged as project}
                        <Project {...project} />
                    {/each}
                </div>
            </ContentCategory>
        {/if}
        <ContentCategory
            header={TranslationHandler.text(
                "home.sections.todaysprojects",
                currentLang
            )}
            seemore={`/search?q=featured%3Aexclude`}
            style="width:65%;"
            stylec="height: 244px;overflow-x:auto;overflow-y:hidden;"
        >
            <div class="project-list">
                {#if projects.today.length > 0}
                    {#each projects.today as project}
                        <Project {...project} />
                    {/each}
                {:else if projectsFailed === true}
                    <div
                        style="display:flex;flex-direction:column;align-items: center;width: 100%;"
                    >
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
                    </div>
                {:else}
                    <LoadingSpinner />
                {/if}
            </div>
        </ContentCategory>
        
        {#if isAprilFools()}
            <button class="cat-button" on:click={catSpeak}>
                <img src="/cat/dave.png" alt="cat">
                <p>{catText}</p>
            </button>
        {/if}
    </div>

    <div class="footer">
        <p>
            <!-- {#if !thingyActive} -->
                <LocalizedText
                    text="PenguinMod is not affiliated with Scratch, TurboWarp, the Scratch Team, or the Scratch Foundation."
                    key="home.footer.notaffiliated"
                    dontlink={true}
                    lang={currentLang}
                />
            <!-- todo: find a better place to put this that isn't, the legal text -->
            <!-- {:else}
                EEAAOO EEAAOOEEAAOOEEAAOOEEAAOOEEAAOOEEAAOO EEAAOO
                EEAAOOEEAAOOEEAAOO EEAAOO
            {/if} -->
        </p>
        <div class="footer-list">
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Website"
                        key="home.footer.sections.website"
                        lang={currentLang}
                    />
                </p>
                <a href={LINK.editor}>
                    <LocalizedText
                        text="Editor"
                        key="home.footer.sections.website.editor"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.credits}>
                    <LocalizedText
                        text="Credits"
                        key="home.footer.sections.website.credits"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.github}>
                    <LocalizedText
                        text="Source"
                        key="home.footer.sections.website.source"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.packager}>
                    <LocalizedText
                        text="Packager"
                        key="home.footer.sections.website.packager"
                        lang={currentLang}
                    />
                </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Community"
                        key="home.footer.sections.community"
                        lang={currentLang}
                    />
                </p>
                <a target="_blank" href={LINK.discord}>Discord</a>
                <a target="_blank" href={LINK.wiki}>
                    <LocalizedText
                        text="Wiki"
                        key="home.footer.sections.community.wiki"
                        lang={currentLang}
                    />
                </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Info"
                        key="home.footer.sections.info"
                        lang={currentLang}
                    />
                </p>
                <a href={LINK.terms}>
                    <LocalizedText
                        text="Terms of Service"
                        key="home.footer.sections.info.terms"
                        lang={currentLang}
                    />
                </a>
                <a href={LINK.privacy}>
                    <LocalizedText
                        text="Privacy Policy"
                        key="home.footer.sections.info.privacy"
                        lang={currentLang}
                    />
                </a>
                <a target="_blank" href={"/guidelines/uploading"}>
                    <LocalizedText
                        text="Uploading Guidelines"
                        key="home.footer.sections.info.guidelines"
                        lang={currentLang}
                    />
                </a>
            </div>
            <div class="footer-section">
                <p>
                    <LocalizedText
                        text="Donate"
                        key="home.footer.sections.donate"
                        lang={currentLang}
                    />
                </p>
                <a href={"/donate"}>PenguinMod</a>
                <a target="_blank" href={LINK.donate.turbowarp}>TurboWarp</a>
                <a target="_blank" href={LINK.donate.scratch}>Scratch</a>
            </div>
        </div>
    </div>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .footer {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        padding: 24px 0px 48px;
        border-top: rgba(0, 0, 0, 0.3) 1px solid;
        background: #00c3ff15;
        font-weight: bold;
        margin-top: 4px;
        /* border-top-left-radius: 20%; */
        /* border-top-right-radius: 20%; */
    }
    .footer a {
        color: dodgerblue;
        font-weight: normal;
        margin: 2px 0px;
    }
    .footer a:active {
        color: rgb(15, 77, 139);
    }
    .footer-list {
        display: flex;
        align-items: flex-start;
        justify-content: center;
    }
    .footer-section {
        display: flex;
        flex-direction: column;
        margin: 0px 32px;
        font-size: 14px;
    }
    :global(body.dark-mode) .footer {
        /* border-top: rgba(255, 255, 255, 0.1) 1px solid; */
        border-top: rgba(255, 255, 255, 0.3) 1px solid;
        /* background: transparent; */
        /* background: #0059ff15; */
        /* border-top-left-radius: 20%; */
        /* border-top-right-radius: 20%; */
    }

    .main {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        min-width: 1000px;
    }
    :global(body.dark-mode) .main {
        color: white;
    }

    .cat-button {
        background: none;
        border: 0;
    }
    .cat-button p {
        font-size: 20px;
        font-family: 'Comic Sans MS', 'Arial', sans-serif;
        color: black;
        height: 20px;
    }
    :global(body.dark-mode) .cat-button p {
        color: white;
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
    :global(html[dir="rtl"]) .section-info {
        justify-content: space-around;
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

    .section-categories {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .section-category-toggles {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .category-toggle-section {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 30%;
        margin: 4px 10px;
    }
    .section-toggle-button {
        border-radius: 1024px;
        padding: 4px 10px;
        background: #008cff;
        font-weight: bold;
        font-size: 1em;
        border: 0;
        margin: 0 4px;
        color: white;
        cursor: pointer;
    }
    .section-toggle-button[data-active="true"] {
        background: #003bdd;
    }

    .profile-picture {
        width: 72px;
        height: 72px;
        border-radius: 4px;
    }
    .welcome-back-card {
        width: 30%;
        height: 312px;
        margin: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .welcome-back-row {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .welcome-back-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: transparent;
        border: 0;
        cursor: pointer;
    }
    :global(body.dark-mode) .welcome-back-button {
        color: white;
    }
    .welcome-back-no-underline {
        text-decoration: none;
    }
    .welcome-back-icon-container {
        border: 1px solid rgba(0, 0, 0, 0.25);
        background: transparent;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 69px;
        margin-bottom: 8px;
    }
    :global(body.dark-mode) .welcome-back-icon-container {
        border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .welcome-back-button:active .welcome-back-icon-container {
        background: rgba(0, 0, 0, 0.2);
    }
    .welcome-back-row >
    a:first-child .welcome-back-icon-container {
        border-top-left-radius: 36px;
        border-bottom-left-radius: 36px;
        padding-left: 8px;
    }
    :global(html[dir="rtl"]) .welcome-back-row >
    a:first-child .welcome-back-icon-container {
        border-top-left-radius: initial;
        border-bottom-left-radius: initial;
        padding-left: initial;
        border-top-right-radius: 36px;
        border-bottom-right-radius: 36px;
        padding-right: 8px;
    }
    .welcome-back-row >
    a:last-child .welcome-back-icon-container {
        border-top-right-radius: 36px;
        border-bottom-right-radius: 36px;
        padding-right: 8px;
    }
    :global(html[dir="rtl"]) .welcome-back-row >
    a:last-child .welcome-back-icon-container {
        border-top-right-radius: initial;
        border-bottom-right-radius: initial;
        padding-right: initial;
        border-top-left-radius: 36px;
        border-bottom-left-radius: 36px;
        padding-left: 8px;
    }
    :global(body.dark-mode)
        .welcome-back-button:active
        .welcome-back-icon-container {
        background: rgba(255, 255, 255, 0.2);
    }
    .welcome-back-icon-container img {
        width: 32px;
        height: 32px;
        filter: brightness(0.2);
    }
    :global(body.dark-mode) .welcome-back-icon-container img {
        filter: brightness(1);
    }

    .section-projects {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .section-language-warning {
        background: #ffd00073;
        color: black;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        width: 100%;
        font-size: 18px;
        font-weight: bold;
        margin: 0px;
        text-align: center;
    }
    .section-language-warning > img {
        filter: brightness(0);
    }
    :global(body.dark-mode) .section-language-warning {
        color: white;
    }
    :global(body.dark-mode) .section-language-warning > img {
        filter: brightness(1);
    }

    .example-video {
        border-radius: 6px;
        outline-style: solid;
        outline-width: 6px;
        outline-color: rgba(255, 255, 255, 0.35);
        margin-right: 8rem;
    }

    .category-content {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .update-image {
        width: 100%;
        height: 100%;
    }
    .update-image-wrapper {
        background: transparent;
        cursor: pointer;
        margin-top: 4px;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        border: 0;
    }

    .project-list {
        display: flex;
        flex-direction: row;
    }
</style>
