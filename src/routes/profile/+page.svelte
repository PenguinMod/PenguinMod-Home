<script>
    import { onMount } from "svelte";
    import MarkdownIt from "markdown-it";

    import scratchblocks from "$lib/scratchblocks.js";
    import LINK from "../../resources/urls.js";
    import Authentication from "../../resources/authentication.js";
    import ProjectApi from "../../resources/projectapi.js";
    import EmojiList from "../../resources/emojis.js";
    const ProjectClient = new ProjectApi();

    // Static values
    import ProfileBadges from "../../resources/badges.js";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
    import Button from "$lib/Button/Button.svelte";
    import ContentCategory from "$lib/ContentCategory/Component.svelte";
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";
    import Project from "$lib/Project/Project.svelte";
    import ClickableProject from "$lib/ClickableProject/Project.svelte";
    import StatusAlert from "$lib/Alert/StatusAlert.svelte";
    // translations
    import LocalizedText from "$lib/LocalizedText/Node.svelte";
    import TranslationHandler from "../../resources/translations.js";
    import Language from "../../resources/language.js";

    // Icons
    import PenguinConfusedSVG from "../../icons/Penguin/confused.svelte";
    import SearchSVG from "../../icons/Search/icon.svelte";

    import { page } from "$app/stores";

    let loggedIn = null;
    let loggedInUser = "";
    let loggedInAdmin = false;

    let user;
    const projects = {
        all: [],
        featured: [],
    };
    let badges = [];
    let focusedBadge = -1;
    let isDonator = false;
    let isFollowingUser = false;
    let wasNotFound = false;
    let isForceView = false;
    let followerCount = null;
    let fullProfile = {};
    let isRankingUpMenu = false;
    let isAttemptingRankUp = false;
    let profileFeaturedProject = null;

    const profileEditingData = {
        bio: '',
        project: 0,
        projectTitle: 1,
        isEditingBio: false,
        isBioEditLoading: false,
        isBioInappropriate: false,
        isEditingProject: false,
        isProjectEditLoading: false,
        bioComponent: null,
    };
    let canSendSaveReq = true;
    let canSendEditedProject = true;
    const saveEditedBio = () => {
        if (!canSendSaveReq) return;
        canSendSaveReq = false;
        profileEditingData.isBioInappropriate = false;
        profileEditingData.isBioEditLoading = true;
        ProjectClient.setBio(profileEditingData.bio, user !== loggedInUser, user).then(() => {
            fullProfile.bio = profileEditingData.bio;
            profileEditingData.isEditingBio = false;
            setTimeout(() => {
                renderScratchBlocks();
            }, 0);
        }).catch(err => {
            if (err === 'InappropriateWordsUsed') {
                profileEditingData.isBioInappropriate = true;
            }
            console.log(err)
        }).finally(() => {
            canSendSaveReq = true;
            profileEditingData.isBioEditLoading = false;
        });
    };
    const updateProjectFeaturedTitle = (element) => {
        const projectTitle = Number(element.target.value);
        console.log(projectTitle);
        profileEditingData.projectTitle = projectTitle;
    };
    const saveEditedProject = (id) => {
        if (!canSendEditedProject) return;
        canSendEditedProject = false;
        profileEditingData.project = id;
        console.log(profileEditingData.project, profileEditingData.projectTitle)
        profileEditingData.isProjectEditLoading = true
        ProjectClient.setMyFeaturedProject(profileEditingData.project, profileEditingData.projectTitle).then(() => {
            profileEditingData.isEditingProject = false;
            location.reload();
        }).catch(err => {
            alert(err);
        }).finally(() => {
            canSendEditedProject = true;
            profileEditingData.isProjectEditLoading = false;
        });
    };

    const projectTitles = [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20
    ];
    const projectTitleStrings = [
        "Featured Project",
        "Featured Tutorial",
        "My Big Project",
        "My Best Project",
        "My Best Work",
        "Take a look!",
        "A little bit more about me",
        "My Favorite",
        "My Favorite Things",
        "What I like",
        "Why I use PenguinMod",
        "My Life's Work",
        "What I Do",
        "In my spare time...",
        "What I spend my time doing",
        "Check this out!",
        "Join my Contest!",
        "Please play!",
        "Here's my series!",
        "My Animation",
    ];

    const loggedInChange = async () => {
        if (!loggedIn) {
            isFollowingUser = false;
            return;
        }
        const isFollowing = await ProjectClient.isFollowingUser(user);
        isFollowingUser = isFollowing;
    };
    
    function unixToDisplayDate(unix) {
       unix = Number(unix);
        return `${new Date(unix).toLocaleString([], {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true
        })}`;
    }
    const xmlEscape = function (unsafe) {
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            }
        });
    };
    const formatProjectTitle = (_title) => {
        const title = xmlEscape(String(_title));
        const emojiRegex = /:(\w+):/g;
        return title.replace(emojiRegex, (match) => {
            const emojiName = match.replace(/\:/gmi, "");
            return `<img
                src="https://library.penguinmod.com/files/emojis/${emojiName}.png"
                alt=":${emojiName}:"
                title=":${emojiName}:"
                style="width:1.2rem;vertical-align: middle;"
            >`;
        });
    };
    
    let fetchedFullProfile = false;
    onMount(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get("user");
        user = query;

        ProjectApi.getUserProjects(user).then((projs) => {
            projects.all = projs;
            projects.featured = projs.filter((p) => p.featured);
            if (projects.all.length <= 0) {
                projects.all = ["none"];
            }
            if (projects.featured.length <= 0) {
                projects.featured = ["none"];
            }
            wasNotFound = false;
            ProjectApi.getProfile(user, true).then((proffile) => {
                fullProfile = proffile;
                badges = fullProfile.badges;
                isDonator = fullProfile.donator;
                followerCount = fullProfile.followers;

                const profileFeatured = fullProfile.myFeaturedProject;
                if (profileFeatured) {
                    ProjectApi.getProjectMeta(profileFeatured).then(metadata => {
                        profileFeaturedProject = metadata;
                    }).catch((err) => {
                        console.warn('Failed to load profile featured project;', err);
                        profileFeaturedProject = 'none';
                    });
                } else if (!profileFeatured && !projects.all[0]) {
                    profileFeaturedProject = 'none';
                } else if (!profileFeatured && projects.all[0]) {
                    profileFeaturedProject = projects.all[0];
                }
            }).catch(err => {
                err = JSON.parse(err);
                err = err.error;
                if (err === 'NotFound') {
                    wasNotFound = true;
                }
            }).finally(() => {
                fetchedFullProfile = true;
                setTimeout(() => {
                    renderScratchBlocks();
                }, 0);
            });
        });

        page.subscribe(v => {
            if (!v.url.searchParams.get("user") || !user) return;
            if (v.url.searchParams.get("user") == user) return;
            
            window.location.reload();
        });
    });

    let currentLang = "en";
    onMount(() => {
        Language.forceUpdate();
    });
    Language.onChange((lang) => {
        currentLang = lang;
    });

    const waitForLogin = () => {
        return new Promise((resolve, reject) => {
            if (loggedIn) return resolve();
            Authentication.authenticate().then((privateCode) => {
                loggedIn = null;
                loggedInUser = "";
                loggedInAdmin = false;
                Authentication.usernameFromCode(privateCode)
                    .then(({ username, isAdmin, isApprover }) => {
                        if (username) {
                            loggedIn = true;
                            loggedInUser = username;
                            loggedInAdmin = isAdmin || isApprover;
                            loggedInChange();
                            resolve();
                            return;
                        }
                        loggedIn = false;
                        loggedInUser = "";
                        loggedInAdmin = false;
                        loggedInChange();
                        reject();
                    })
                    .catch(() => {
                        loggedIn = false;
                        loggedInUser = "";
                        loggedInAdmin = false;
                        loggedInChange();
                        reject();
                    });
            });
        });
    };
    let canClickFollow = true;
    const followUser = async () => {
        await waitForLogin();
        const info = await ProjectClient.toggleFollowingUser(user);
        isFollowingUser = info.following;
    };
    const safeFollowUser = async () => {
        if (!canClickFollow) return;
        canClickFollow = false;
        try {
            await followUser();
        } catch (err) {
            console.error("couldnt follow user", err);
        }
        canClickFollow = true;
    };

    // login code below
    onMount(async () => {
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            loggedInUser = "";
            loggedInAdmin = false;
            loggedInChange();
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then(({ username, isAdmin, isApprover }) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    loggedInUser = username;
                    loggedInAdmin = isAdmin || isApprover;
                    loggedInChange();
                    return;
                }
                loggedIn = false;
                loggedInUser = "";
                loggedInAdmin = false;
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
                loggedInAdmin = false;
                loggedInChange();
            });
    });

    Authentication.onLogout(() => {
        loggedIn = false;
        loggedInUser = "";
        loggedInAdmin = false;
        loggedInChange();
    });
    Authentication.onAuthentication((privateCode) => {
        loggedIn = null;
        loggedInUser = "";
        loggedInAdmin = false;
        Authentication.usernameFromCode(privateCode)
            .then(({ username, isAdmin, isApprover }) => {
                if (username) {
                    ProjectClient.setUsername(username);
                    ProjectClient.setPrivateCode(privateCode);
                    loggedIn = true;
                    loggedInUser = username;
                    loggedInAdmin = isAdmin || isApprover;
                    loggedInChange();
                    return;
                }
                loggedIn = false;
                loggedInUser = "";
                loggedInAdmin = false;
                loggedInChange();
            })
            .catch(() => {
                loggedIn = false;
                loggedInUser = "";
                loggedInAdmin = false;
                loggedInChange();
            });
    });

    const rankUpAccount = () => {
        isAttemptingRankUp = true;
        ProjectClient.attemptRankUp()
            .then(() => {
                window.location.reload();
            })
            .catch((err) => {
                console.error(err);
                alert(`${TranslationHandler.text(
                    "profile.rankup.error",
                    currentLang
                )}\n${err}`);
                isAttemptingRankUp = false;
                isRankingUpMenu = false;
            });
    };

    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae
    // EMOJIS eae

    const emojiPickerRandomEmojis = [
        'angel',
        'angry',
        'annoyed',
        'bigsad',
        'cute',
        'disappointed',
        'happy',
        'idk',
        'meh',
        'salute',
        'shocked',
        'sobbing',
        'worried',
        'investigate',
        'grimacing',
        'confusedthinking',
        'cool',
    ];
    let emojiPickerRandomEmoji = '';
    let emojiSearchQuery = '';
    let emojiSearchBar;
    let lastSelectedFormArea;
    const pickRandomEmojiPickerDisplay = () => {
        emojiPickerRandomEmoji = emojiPickerRandomEmojis
            [Math.round(Math.random() * (emojiPickerRandomEmojis.length - 1))];
    };
    pickRandomEmojiPickerDisplay();

    let emojiPickerListUpdate = 0;
    const allowEmojiDrop = (ev) => {
        const data = ev.dataTransfer.getData("emoji");
        if (data && typeof data === 'string') {
            ev.preventDefault();
        }
    }
    const useEmojiDrag = (ev, name) => {
        ev.dataTransfer.setData("emoji", name);
    }
    const handleEmojiDrop = (ev) => {
        const data = ev.dataTransfer.getData("emoji");
        if (data && typeof data === 'string') {
            ev.dataTransfer.setData("emoji", '');
            ev.preventDefault();
        } else {
            return;
        }

        ev.toElement.value += `:${data}:`;
        // force an update
        if (profileEditingData.bioComponent) {
            profileEditingData.bio = profileEditingData.bioComponent.value;
        }
        if (emojiSearchBar) {
            emojiSearchQuery = emojiSearchBar.value;
        }
        emojiPickerListUpdate++;
    }
    const placeEmojiInTextbox = (emoji) => {
        if (!lastSelectedFormArea) return;
        lastSelectedFormArea.value += `:${emoji}:`;
        // force an update
        if (profileEditingData.bioComponent) {
            profileEditingData.bio = profileEditingData.bioComponent.value;
        }
        if (emojiSearchBar) {
            emojiSearchQuery = emojiSearchBar.value;
        }
        emojiPickerListUpdate++;
    };

    let emojiPickerOpened = false;
    onMount(() => {
        EmojiList.fetch().finally(() => {
            emojiPickerListUpdate++;
        });
    });

    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    // markdown code
    
    const md = new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
    });

    md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx];

        if (token.info === "warning") {
            return `<div class="guidelines-warning-box">${md.utils.escapeHtml(
                token.content
            )}</div>`;
        }
        
        if (token.info === "scratch") {
            env.usesScratchBlocks = true;
            return `<div class="render-scratchblocks">${md.utils.escapeHtml(
                token.content
            )}</div>`;
        }

        // By default markdown-it will use a strange combination of <code> and <pre>; we'd rather it
        // just use <pre>
        return `<pre class="language-${md.utils.escapeHtml(
            token.info
        )}">${md.utils.escapeHtml(token.content)}</pre>`;
    };
    md.renderer.rules.image = () => {
        return `<img src="/notallowed.png" height="16"></img>`;
    };
    // Remember the old renderer if overridden, or proxy to the default renderer.
    const defaultLinkOpenRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    const doesntShowRedirectURLs = [
        /https:\/\/([a-z]+\.|)penguinmod\.com/i,
        /https:\/\/([a-z]+\.|)scratch\.org/i,
        /https:\/\/([a-z]+\.|)scratch\.mit\.edu/i,
        /https:\/\/(?!share\.)([a-z]+\.)?turbowarp\.org/i,
    ];
    const safeURLs = [
        /https:\/\/([a-z]+\.|)penguinmod\.com/i,
        /https:\/\/([a-z]+\.|)scratch\.org/i,
        /https:\/\/([a-z]+\.|)scratch\.mit\.edu/i,
        /https:\/\/([a-z]+\.|)turbowarp\.org/i,
        /https:\/\/([a-z]+\.|)cocrea\.world/i,
        /https:\/\/([a-z]+\.|)getgandi\.com/i,
        /https:\/\/([a-z]+\.|)snail-ide\.com/i,
        /https:\/\/snail-ide\.js\.org/i,
        /https:\/\/snail-ide\.github\.io/i,
        /https:\/\/snail-ide\.vercel\.app/i,

        /https:\/\/(www\.|)(roblox|youtube|discord|twitter|x|patreon|reddit)\.com/i,
        /https:\/\/old\.reddit\.com/i,
        /https:\/\/create\.roblox\.com/i,
        /https:\/\/(www\.|)discord\.gg/i,
        /https:\/\/(www\.|support\.|)guilded\.gg/i,
        /https:\/\/(www\.|gist\.|)github\.com/i,
        /https:\/\/(www\.|store\.|support\.|help\.|)(steampowered|steamcommunity)\.com/i,
    ];
    md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const href = String(tokens[idx].attrGet('href'));
        // only force open in new tab if we are not penguinmod.com
        if (!href.match(safeURLs[1])) {
            tokens[idx].attrSet('target', '_blank');
        }
        // if we match a URL that should show a redirect, change the href attribute
        if (!doesntShowRedirectURLs.some(regex => href.match(regex))) {
            const base64 = encodeURIComponent(btoa(href));
            tokens[idx].attrSet('href', `https://penguinmod.com/redirect?t=${base64}`);
        }

        // disables clicking on non-verified links
        if (!safeURLs.some(regex => href.match(regex))) {
            return '';
        }

        // Pass the token to the default renderer.
        return defaultLinkOpenRender(tokens, idx, options, env, self);
    };
    
    const defaultTextRender = md.renderer.rules.text || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };
    
    const regexRules = {
        // we have to use far more sophisticated regex here due to weird url behavior
        // due to browser compat, we do this in the next comment
        project: /#([\w-]+)/g,
        user: /@([\w-]+)/g,
        emoji: /:(\w+):/g
    }
    // certain iOS devices do not support lookbehind-assertion, and will throw an error
    // this was present in Scratch for Discord for a bit, before i just replaced the regex entirely
    // we can handle this horrible behavior properly though:
    try {
        regexRules.project = new RegExp('(?<!\\b(?:https?:\\/\\/|www\\.)\\S*)#(\\w+|\\d+)(?!\\S)', 'g');
        regexRules.user = new RegExp('(?<!\\b(?:https?:\\/\\/|www\\.)\\S*)@(\\w+|\\d+)(?!\\S)', 'g');
    } catch {
        // iOS users will experience weird gaps and or urls with hashtags leading to 2 different places
        regexRules.project = /#([\w-]+)/g;
        regexRules.user = /@([\w-]+)/g,
        console.warn('Browser does not support lookbehind assertion in regex');
    }

    md.renderer.rules.text = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        
        let textChanged = false;
        let newText = `${md.utils.escapeHtml(token.content)}`;
        if (newText.match(regexRules.project)) {
            newText = newText.replace(regexRules.project, function(id) {
                id = id.replace('#', '');
                if (/^\d{6,}$/.test(id)) {
                    return `<a href="https://studio.penguinmod.com/#${id}" target="_blank">#${id}</a>`;
                }
                return `<a href="https://penguinmod.com/search?q=%23${id}">#${id}</a>`;
            });
            textChanged = true;
        }
        if (newText.match(regexRules.user)) {
            newText = newText.replace(regexRules.user, function(name) {
                name = name.replace('@', '');
                return `<a href="https://penguinmod.com/profile?user=${name}">@${name}</a>`;
            });
            textChanged = true;
        }
        if (newText.match(regexRules.emoji)) {
            newText = newText.replace(regexRules.emoji, function(text) {
                const emojiName = text.replace(/:/gmi, '');
                return `<img
                    src="https://library.penguinmod.com/files/emojis/${emojiName}.png"
                    alt="${emojiName}"
                    title=":${emojiName}:"
                    class="profile-bio-emoji"
                />`;
            });
            textChanged = true;
        }

        if (textChanged) {
            return newText;
        }

        // Pass the token to the default renderer.
        return defaultTextRender(tokens, idx, options, env, self);
    };

    const env = {};
    const generateMarkdown = (mdtext) => {
        const tokens = md.parse(mdtext, env);
        const bodyHTML = md.renderer.render(tokens, md.options, env);
        return bodyHTML;
    };

    onMount(() => {
        scratchblocks.init();
    });

    const renderScratchBlocks = () => {
        const usesScratchBlocks = env.usesScratchBlocks;
        if (usesScratchBlocks) {
            scratchblocks.module.renderMatching(".render-scratchblocks", {
                style: "scratch3",
            });
        }
    };
</script>

<svelte:head>
    <title>PenguinMod - {user ? user : "Profile"}</title>
    <meta name="title"                   content="PenguinMod - {user ? user : "User Profile"}" />
    <meta property="og:title"            content="PenguinMod - {user ? user : "User Profile"}" />
    <meta property="twitter:title"       content="PenguinMod - {user ? user : "User Profile"}">
    <meta name="description"             content="View {user ? user : "this user"}'s profile on PenguinMod.">
    <meta property="twitter:description" content="View {user ? user : "this user"}'s profile on PenguinMod.">
    <meta property="og:url"              content="https://penguinmod.com/profile">
    <meta property="twitter:url"         content="https://penguinmod.com/profile">
</svelte:head>

<NavigationBar />

{#if isRankingUpMenu}
    <div class="scratch-modal-back">
        <div class="scratch-modal">
            <div class="scratch-modal-title">
                <LocalizedText
                    text="Rank up"
                    key="profile.rankup.title"
                    lang={currentLang}
                />
            </div>
            <div class="scratch-modal-content">
                <img src="/penguins/rankup.svg" alt="Rank up" />
                <p style="text-align:center;">
                    <LocalizedText
                        text="Let's see if you can become a real penguin!"
                        key="profile.rankup.message1"
                        lang={currentLang}
                    />
                    <br />
                    <LocalizedText
                        text="This will allow you to upload projects with custom extensions and other built-in extensions."
                        key="profile.rankup.message2"
                        lang={currentLang}
                    />
                </p>
                {#if isAttemptingRankUp}
                    <LoadingSpinner />
                {:else}
                    <Button on:click={rankUpAccount}>
                        <LocalizedText
                            text="Rank up"
                            key="profile.rankup.title"
                            lang={currentLang}
                        />
                    </Button>
                {/if}
            </div>
        </div>
    </div>
{/if}

{#if profileEditingData.isEditingProject}
    <div class="scratch-modal-back">
        <div class="scratch-modal">
            <div class="scratch-modal-title">
                <LocalizedText
                    text="Choose a project to display"
                    key="profile.featured.choose"
                    lang={currentLang}
                />
            </div>
            <div class="scratch-modal-content">
                <p>
                    <LocalizedText
                        text="Choose a label for this project"
                        key="profile.featured.chooselabel"
                        lang={currentLang}
                    />
                    <select bind:value={profileEditingData.projectTitle} on:change={updateProjectFeaturedTitle}>
                        {#each projectTitles as title}
                            <option value="{title}">
                                <LocalizedText
                                    text="{projectTitleStrings[title - 1]}"
                                    key="profile.featured.title{title}"
                                    lang={currentLang}
                                />
                            </option>
                        {/each}
                    </select>
                </p>
                <div class="featured-project-list">
                    {#if projects.all.length > 0}
                        {#if projects.all[0] !== "none"}
                            {#each projects.all as project}
                                <ClickableProject {...project} on:click={() => saveEditedProject(project.id)} />
                            {/each}
                        {:else}
                            <div class="none-found">
                                <PenguinConfusedSVG height="10rem" />
                                <p>
                                    <LocalizedText
                                        text="Nothing was found. Did you misspell something or does the user not exist?"
                                        key="generic.notfound"
                                        lang={currentLang}
                                    />
                                </p>
                            </div>
                        {/if}
                    {:else}
                        <LoadingSpinner />
                    {/if}
                </div>
                <Button color="gray" on:click={() => {
                    profileEditingData.isEditingProject = false;
                }}>
                    <LocalizedText
                        text="Cancel"
                        key="profile.featured.cancel"
                        lang={currentLang}
                    />
                </Button>
            </div>
        </div>
    </div>
{/if}

<div class="main">
    <NavigationMargin />

    <StatusAlert />

    {#if (projects.all.length > 0 && fetchedFullProfile) || isForceView}
        {#if
            ((!(projects.all[0] !== "none" && wasNotFound))
            && ((projects.all[0] !== "none" || isDonator || fullProfile.bio || isFollowingUser || fullProfile.rank > 0)
            || (loggedIn && user === loggedInUser)))
            || isForceView
        }
        <div class="background">
            {#if user}
                <div class="section-user">
                    <div class="section-user-header">
                        <div class="subuser-section">
                            <div class="user-username">
                                <img
                                    style="border-color:{isDonator ? "#a237db" : "#efefef"}"
                                    src={`https://trampoline.turbowarp.org/avatars/by-username/${user}`}
                                    alt="Profile"
                                    class="profile-picture"
                                />
                                <div class="user-after-image">
                                    {#if isDonator}
                                        <h1 class="donator-color">{user}</h1>
                                    {:else}
                                        <h1>{user}</h1>
                                    {/if}
                                </div>
                            </div>
                        <div class="follower-section">
                            <p class="follower-count">
                                {TranslationHandler.text(
                                    "profile.followers",
                                    currentLang
                                ).replace("$1", followerCount)}
                            </p>
                            <div>
                                {#if !(loggedIn && user === loggedInUser)}
                                    {#key isFollowingUser}
                                        <button
                                            class={`follower-button
                                                ${isDonator ? ' follower-button-donator' : ''}
                                                ${isFollowingUser ? ' follower-button-following' : ''}`}
                                            on:click={safeFollowUser}
                                        >
                                            {#if isFollowingUser}
                                                <LocalizedText
                                                    text="Unfollow"
                                                    key="profile.unfollow"
                                                    dontlink={true}
                                                    lang={currentLang}
                                                />
                                            {:else}
                                                <LocalizedText
                                                    text="Follow"
                                                    key="profile.follow"
                                                    dontlink={true}
                                                    lang={currentLang}
                                                />
                                            {/if}
                                        </button>
                                    {/key}
                                {/if}
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            {/if}
            <div class="section-projects">
                <div class="user-ordering-stats" style="width:90%">
                    <div class="section-user-stats">
                        {#if profileEditingData.isEditingBio}
                            <div>
                                <button
                                    on:mouseenter={pickRandomEmojiPickerDisplay}
                                    on:click={() => {
                                        emojiPickerOpened = !emojiPickerOpened;
                                    }}
                                    title="Pick an emoji"
                                    class="emoji-picker-button"
                                >
                                    <img
                                        src={`https://library.penguinmod.com/files/emojis/${emojiPickerRandomEmoji}.png`}
                                        alt="Emoji"
                                        title="Pick an emoji"
                                        on:dragstart={(ev) => {
                                            useEmojiDrag(ev, emojiPickerRandomEmoji);
                                        }}
                                    >
                                </button>
                                <div class="emoji-picker-list" data-opened={emojiPickerOpened}>
                                    <div class="emoji-picker-search-container">
                                        <div class="emoji-picker-search-icon">
                                            <SearchSVG
                                                width="30px"
                                                height="20px"
                                                color="#000000"
                                                scale="2px"
                                                style="margin-bottom:5px; margin-top: 5px;"
                                            />
                                        </div>
                                        <input
                                            on:dragover={allowEmojiDrop}
                                            on:drop={handleEmojiDrop}
                                            type="text"
                                            placeholder="..."
                                            bind:value={emojiSearchQuery}
                                            bind:this={emojiSearchBar}
                                        >
                                    </div>
                                    <div class="emoji-picker-emoji-container">
                                        {#key emojiPickerListUpdate}
                                            {#if EmojiList.loading}
                                                <LoadingSpinner></LoadingSpinner>
                                            {:else if EmojiList.failed}
                                                <p>
                                                    <LocalizedText
                                                        text="Unknown error."
                                                        key="generic.errorsmall"
                                                        lang={currentLang}
                                                    />
                                                </p>
                                            {:else}
                                                {#each EmojiList.emojis as emoji}
                                                    {#if
                                                        !emojiSearchQuery
                                                        || String(emoji).includes(
                                                            emojiSearchQuery
                                                                .toLowerCase()
                                                                .replace(/[^a-z]+/gmi, '')
                                                        )
                                                    }
                                                        <button
                                                            class="emoji-picker-emoji"
                                                            on:click={() => placeEmojiInTextbox(emoji)}
                                                        >
                                                            <img
                                                                src={`https://library.penguinmod.com/files/emojis/${emoji}.png`}
                                                                alt={`:${emoji}:`}
                                                                title={`:${emoji}:`}
                                                                draggable="false"
                                                            >
                                                        </button>
                                                    {/if}
                                                {/each}
                                            {/if}
                                        {/key}
                                    </div>
                                </div>
                            </div>
                            <div class="profile-bio-sidenotes">
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say your real name"
                                        key="profile.bio.warning1"
                                        dontlink={true}
                                        lang={currentLang}
                                    />
                                </div>
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say how old you are or when you were born"
                                        key="profile.bio.warning2"
                                        dontlink={true}
                                        lang={currentLang}
                                    />
                                </div>
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say where you live"
                                        key="profile.bio.warning3"
                                        dontlink={true}
                                        lang={currentLang}
                                    />
                                </div>
                                <div class="profile-bio-sidenote">
                                    <img
                                        src="/notallowed.png"
                                        alt="X"
                                        style="height:1.5em"
                                    >
                                    <LocalizedText
                                        text="Don't say your password or your email"
                                        key="profile.bio.warning4"
                                        dontlink={true}
                                        lang={currentLang}
                                    />
                                </div>
                            </div>
                        {/if}
                        <h2 style="margin-block:4px">
                            <LocalizedText
                                text="About Me"
                                key="profile.bio.title"
                                dontlink={true}
                                lang={currentLang}
                            />
                            {#if profileEditingData.isEditingBio}
                                {#if !profileEditingData.isBioEditLoading}
                                    <button class="edit-done" on:click={saveEditedBio}>
                                        <img
                                            src="/badges/approver.png"
                                            alt="Save"
                                            style="height:1.5em"
                                        >
                                    </button>
                                {/if}
                            {:else}
                                {#if loggedIn && (user === loggedInUser || loggedInAdmin)}
                                    <button class="edit-link" on:click={() => {
                                        profileEditingData.bio = fullProfile.bio || '';
                                        profileEditingData.isEditingBio = true;
                                    }}>
                                        <img
                                            src="/pencil.png"
                                            alt="Edit"
                                            style="height:1.5em"
                                        >
                                    </button>
                                {/if}
                            {/if}
                        </h2>
                        <div class="profile-bio-line"></div>
                        <div class="profile-bio">
                            {#if profileEditingData.isEditingBio}
                                <textarea
                                    class="profile-bio-textarea{profileEditingData.isBioInappropriate ? ' profile-bio-textarea-inappropriate' : ''}"
                                    on:click={() => {
                                        lastSelectedFormArea = profileEditingData.bioComponent;
                                    }}
                                    on:focus={() => {
                                        lastSelectedFormArea = profileEditingData.bioComponent;
                                    }}
                                    bind:this={profileEditingData.bioComponent}
                                    bind:value={profileEditingData.bio}
                                    on:dragover={allowEmojiDrop}
                                    on:drop={handleEmojiDrop}
                                    maxLength="2048"
                                />
                                {#if profileEditingData.isBioInappropriate}
                                    <div class="profile-bio-warning-inappropriate">
                                        <LocalizedText
                                            text="Your bio contains inappropriate words or websites we don't allow. Please remove them to change your bio."
                                            key="profile.bio.inappropriate"
                                            dontlink={true}
                                            lang={currentLang}
                                        />
                                    </div>
                                {/if}    
                            {:else}
                                {#if fullProfile.bio}
                                    {@html generateMarkdown(fullProfile.bio)}
                                {:else}
                                    <p style="opacity:0.5">
                                        {#if user === loggedInUser}
                                            <LocalizedText
                                                text="There's nothing here.. yet! Write some things you want to share here!"
                                                key="profile.bio.none"
                                                dontlink={true}
                                                lang={currentLang}
                                            />
                                        {:else}
                                            <LocalizedText
                                                text="Nothing yet!"
                                                key="generic.noneyet"
                                                dontlink={true}
                                                lang={currentLang}
                                            />
                                        {/if}
                                    </p>
                                {/if}
                            {/if}
                        </div>
                    </div>
                    <div class="section-user-stats">
                        <h2 style="margin-block:4px">
                            <LocalizedText
                                text={projectTitleStrings[(fullProfile.myFeaturedProjectTitle || 1) - 1]}
                                key="profile.featured.title{fullProfile.myFeaturedProjectTitle || 1}"
                                dontlink={true}
                                lang={currentLang}
                            />
                            {#if loggedIn && user === loggedInUser && profileFeaturedProject && !profileEditingData.isEditingProject}
                                <button class="edit-link" on:click={() => {
                                    profileEditingData.project = profileFeaturedProject.id || 0;
                                    profileEditingData.projectTitle = fullProfile.myFeaturedProjectTitle || 1;
                                    profileEditingData.isEditingProject = true;
                                }}>
                                    <img
                                        src="/pencil.png"
                                        alt="Edit"
                                        style="height:1.5em"
                                    >
                                </button>
                            {/if}
                        </h2>
                        <div class="profile-bio-line"></div>
                        {#if !profileFeaturedProject}
                            <LoadingSpinner></LoadingSpinner>
                        {:else if profileFeaturedProject === 'none'}
                            <p style="opacity:0.5">
                                <LocalizedText
                                    text="Nothing yet!"
                                    key="generic.noneyet"
                                    dontlink={true}
                                    lang={currentLang}
                                />
                            </p>
                        {:else if profileFeaturedProject.owner === user}
                            <a href={`${LINK.base}#${profileFeaturedProject.id}`} style="text-decoration: none">
                                <img
                                    src={`${ProjectApi.OriginApiUrl}/api/pmWrapper/iconUrl?id=${profileFeaturedProject.id}&widescreen=true`}
                                    alt="Project Thumbnail"
                                    class="profile-project-image"
                                />
                                <div class="profile-project-authordiv">
                                    <img
                                        src="https://trampoline.turbowarp.org/avatars/by-username/{user}"
                                        alt="Project Author"
                                        title={user}
                                        class="profile-project-author"
                                    >
                                    <div class="profile-project-authorinfo">
                                        <p class="profile-project-link">{@html formatProjectTitle(profileFeaturedProject.name)}</p>
                                        <p class="profile-project-date">{unixToDisplayDate(profileFeaturedProject.date)}</p>
                                    </div>
                                </div>
                            </a>
                        {/if}
                    </div>
                    <div class="section-user-stats">
                        <div class="user-stat-box" style="border-bottom: 1px solid rgba(0, 0, 0, 0.15);">
                            <div class="user-stat-box-inner">
                                <LocalizedText
                                    text="Rank"
                                    key="profile.ranking.title"
                                    lang={currentLang}
                                />
                            </div>
                            <p class="small" style="margin-block:4px">
                                {#if fullProfile.admin === true}
                                    <LocalizedText
                                        text="King Penguin"
                                        key="profile.ranking.admin"
                                        lang={currentLang}
                                    />
                                {:else if fullProfile.approver === true}
                                    <LocalizedText
                                        text="Guard Penguin"
                                        key="profile.ranking.mod"
                                        lang={currentLang}
                                    />
                                {:else if fullProfile.rank === 1}
                                    <LocalizedText
                                        text="Penguin"
                                        key="profile.ranking.ranked"
                                        lang={currentLang}
                                    />
                                {:else}
                                    <LocalizedText
                                        text="Newborn Penguin"
                                        key="profile.ranking.new"
                                        lang={currentLang}
                                    />
                                {/if}
                                {#if loggedIn && user === loggedInUser && fullProfile.rank === 0}
                                    {#if fullProfile.canrankup !== true}
                                        <span style="opacity: 0.5;font-size:.7em;">
                                            <br>
                                            <LocalizedText
                                                text="Cannot rank up yet"
                                                key="profile.rankup.cannot"
                                                lang={currentLang}
                                            />
                                        </span>
                                    {:else}
                                        <!-- svelte-ignore a11y-invalid-attribute -->
                                        <a
                                            href="#"
                                            style="color:dodgerblue;font-size:.6em;"
                                            on:click={() => {
                                                isRankingUpMenu = true;
                                            }}
                                        >
                                            <br>
                                            <LocalizedText
                                                text="Rank up"
                                                key="profile.rankup.title"
                                                lang={currentLang}
                                            />
                                            <div class="rankup-badge">
                                                !
                                            </div>
                                        </a>
                                    {/if}
                                {/if}
                            </p>
                        </div>
                        <div class="user-stat-box">
                            <div class="user-stat-box-inner">
                                <LocalizedText
                                    text="Badges"
                                    key="profile.badges.title"
                                    lang={currentLang}
                                />
                            </div>
                            <div class="user-box-maxwidth"></div>
                            <div class="user-badge-container">
                            <div class="user-badges">
                                {#each badges as badge, idx}
                                    {#if ProfileBadges[badge]}
                                        <button
                                            on:click={() => {
                                                focusedBadge = idx;
                                            }}
                                            on:focusout={() => {
                                                focusedBadge = -1;
                                            }}
                                            title={TranslationHandler.text(
                                                `profile.badge.${badge}`,
                                                currentLang
                                            ) || TranslationHandler.text(
                                                `profile.badge.${badge}`,
                                                'en'
                                            )}
                                        >
                                            <img
                                                src={`/badges/${ProfileBadges[badge]}.png`}
                                                alt={TranslationHandler.text(
                                                    `profile.badge.${badge}`,
                                                    currentLang
                                                ) || TranslationHandler.text(
                                                    `profile.badge.${badge}`,
                                                    'en'
                                                )}
                                                title={TranslationHandler.text(
                                                    `profile.badge.${badge}`,
                                                    currentLang
                                                ) || TranslationHandler.text(
                                                    `profile.badge.${badge}`,
                                                    'en'
                                                )}
                                            />
                                            {#if focusedBadge === idx}
                                                <div class="badge-info">
                                                    {TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        currentLang
                                                    ) || TranslationHandler.text(
                                                        `profile.badge.${badge}`,
                                                        'en'
                                                    )}
                                                </div>
                                            {/if}
                                        </button>
                                    {/if}
                                {:else}
                                    <p style="font-size: initial; font-weight: normal; width: 100%; text-align: center;">
                                        <LocalizedText
                                            text="Nothing was found."
                                            key="generic.notfound"
                                            lang={currentLang}
                                        />
                                    </p>
                                {/each}
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                <ContentCategory
                    header={TranslationHandler.text(
                        "profile.projects.all",
                        currentLang
                    )}
                    style="width:calc(90% - 10px);"
                    stylec="height: 244px;overflow-x:auto;overflow-y:hidden;"
                    seemore={`/search?q=user%3A${user}`}
                >
                    <div class="project-list">
                        {#if projects.all.length > 0}
                            {#if projects.all[0] !== "none"}
                                {#each projects.all as project}
                                    <Project {...project} />
                                {/each}
                            {:else}
                                <div class="none-found">
                                    <PenguinConfusedSVG height="10rem" />
                                    <p>
                                        <LocalizedText
                                            text="Nothing was found. Did you misspell something or does the user not exist?"
                                            key="generic.notfound"
                                            lang={currentLang}
                                        />
                                    </p>
                                </div>
                            {/if}
                        {:else}
                            <LoadingSpinner />
                        {/if}
                    </div>
                </ContentCategory>
            </div>
            <div class="section-serious-actions">
                {#if !(loggedIn && user === loggedInUser)}
                    <div class="report-action">
                        <a
                            href={`/report?type=user&id=${user}`}
                            target="_blank"
                            class="report-link"
                            style="color: red !important;"
                        >
                            <img
                                class="report-icon"
                                src="/report_flag.png"
                                alt="Report"
                            />
                            <LocalizedText
                                text="Report"
                                key="report.title"
                                lang={currentLang}
                            />
                        </a>
                    </div>
                {/if}
            </div>
        </div>
        {:else}
            <div style="height:32px;" />
            <div style="display:flex;flex-direction:column;align-items:center;">
                <PenguinConfusedSVG height="10rem" />
                <p>
                    <LocalizedText
                        text="This user was not found. A user must have 1 uploaded project to view their profile."
                        key="profile.doesntexist"
                        lang={currentLang}
                    />
                </p>
                <br>
                <!-- only show if we fetched the full profile -->
                {#if fetchedFullProfile}
                    <Button link="https://scratch.mit.edu/users/{user}/" noredirect={true}>
                        <LocalizedText
                            text="View on Scratch"
                            key="profile.scratchprofile"
                            dontlink={true}
                            lang={currentLang}
                        />
                    </Button>
                    {#if loggedInAdmin}
                        <Button on:click={() => {
                            isForceView = true;
                        }}>
                            (Admin) Force view profile
                        </Button>
                    {/if}
                {/if}
            </div>
        {/if}
    {:else}
        <div style="height:32px;" />
        <LoadingSpinner enableTips={true} />
    {/if}
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        min-width: 1000px;
        max-width: 1920px;
    }
    .background {
        margin: auto;
        width: 80%;
    }

    .user-stat-box {
        height: 50%;
        display: flex;
        justify-content: center;
        font-weight: bolder;
        font-size: 1.7em;
        flex-wrap: wrap;
    }

    .user-stat-box-inner {
        margin-top: 10px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        height: 35px;
        text-align: center;
        width: 50%;
    }
    :global(body.dark-mode) .user-stat-box-inner {
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    }

    :global(body.dark-mode) .main {
        color: white;
    }

    .emoji-picker-button {
        position: absolute;
        left: -72px;
        top: 0;
        width: 64px;
        height: 64px;
        border-radius: 1024px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        background: transparent;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    :global(html[dir="rtl"]) .emoji-picker-button {
        left: initial;
        right: -72px;
    }
    :global(body.dark-mode) .emoji-picker-button {
        border-color: rgba(255, 255, 255, 0.35);
    }
    .emoji-picker-button img {
        width: 56px;
        height: 56px;
        transform: scale(1);
        transition-duration: 0.5s;
    }
    .emoji-picker-button:hover img {
        transform: scale(1.5);
        transition-duration: 0.5s;
    }
    .emoji-picker-button:active img {
        filter: brightness(0.7);
        transition-duration: 0s;
    }
    .emoji-picker-list {
        position: absolute;
        top: 8px;
        left: calc(100% + 8px);
        background: white;
        width: 320px;
        height: 100%;
        display: none;
        border-radius: 8px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        z-index: 4999;
    }
    :global(html[dir="rtl"]) .emoji-picker-list {
        left: initial;
        right: calc(100% + 8px);
    }
    :global(body.dark-mode) .emoji-picker-list {
        border-color: rgba(255, 255, 255, 0.35);
        background: #111;
    }
    @media screen and (max-width: 1105px) {
        .emoji-picker-list {
            left: initial;
            right: initial;
            top: 100%;
            width: 100%;
            height: 320px;
        }
        :global(html[dir="rtl"]) .emoji-picker-list {
            left: initial;
            right: initial;
        }
    }
    .emoji-picker-list[data-opened="true"] {
        display: initial;
    }
    .emoji-picker-search-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 32px;
    }
    .emoji-picker-search-container input {
        width: calc(100% - 48px);
        height: 24px;
        border: 0;
        padding: 0 4px;
        margin: 0;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 8px;
    }
    :global(body.dark-mode) .emoji-picker-search-container input {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    .emoji-picker-search-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    :global(body.dark-mode) .emoji-picker-search-icon {
        filter: invert(1);
    }
    .emoji-picker-emoji-container {
        overflow: auto;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        height: calc(100% - 32px);
    }
    .emoji-picker-emoji {
        background: transparent;
        border: 0;
        width: 48px;
        height: 48px;
        margin: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .emoji-picker-emoji img {
        width: 48px;
        height: 48px;
    }
    .emoji-picker-emoji:hover {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
    }
    :global(body.dark-mode) .emoji-picker-emoji:hover {
        background: rgba(255, 255, 255, 0.15);
    }

    .section-projects {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
    }
    .section-user {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0px;
        margin-top: 6px;
    }
    .section-serious-actions {
        /* padding-top: 120px; */
        padding-bottom: 10px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
        width: 95%;
    }
    .report-action {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .report-action img {
        margin: 0 4px;
    }

    .project-list {
        display: flex;
        flex-direction: row;
    }

    .none-found {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        height: 100%;
        text-align: center;
    }

    .scratch-modal-back {
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 6000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .scratch-modal {
        overflow: hidden;
        border: 4px solid hsla(0, 100%, 100%, 0.25);
        outline: none;
        border-radius: 0.5rem;
    }
    .scratch-modal-title {
        background: #00c3ff;
        color: white;
        font-size: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 3.125rem;
    }
    .scratch-modal-content {
        padding: 12px;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    :global(body.dark-mode) .scratch-modal-content {
        background: #111;
    }

    .profile-picture {
        border-radius: 15px;
        height: 80px;
        width: 80px;
        border-style: solid;
        border-width: 2px;
    }
    :global(html[dir="rtl"]) .profile-picture {
        margin-right: initial;
        margin-left: 8px;
    }

    .donator-color {
        color: #a237db;
    }
    :global(body.dark-mode) .donator-color {
        color: #c65cff;
    }

    .small {
        font-size: .8em;
        font-weight: lighter;
        text-align: center;
        width: 100%;
    }
    .rankup-badge {
        display: inline-block;
        text-align: center;
        background: red;
        color: white;
        font-weight: bold;
        border-radius: 1000px;
        width: 16px;
        height: 16px;
    }
    .report-link {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .report-icon {
        height: 16px;
    }

    .section-user-header {
        margin: 10px;
        margin-top: 20px;
        width: 80%;
        vertical-align: middle;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .section-user-stats {
        height: 295px;
        width: 32%;
        border-radius: 8px;
        border-width: 1px;
        border-color: rgba(0, 0, 0, 0.3);
        border-style: solid;
        padding: 6px;
        position: relative;
    }
    .profile-bio {
        width: calc(100% - 6px);
        height: calc(100% - (2.2em + 1px));
        overflow: auto;
    }
    .profile-bio-line {
        width: calc(100% - 6px);
        height: 1px;
        background: rgba(0, 0, 0, 0.15);
    }
    :global(body.dark-mode) .profile-bio-line {
        background: rgba(255, 255, 255, 0.3);
    }

    .user-ordering-stats {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
    @media screen and (max-width: 1915px) {
        .section-user-stats {
            width: 31%;
        }
    }
    @media screen and (max-width: 1105px) {
        .user-ordering-stats {
            flex-direction: column;
        }
        .section-user-stats {
            width: 100%;
            margin-bottom: 4px;
        }
    }

    .profile-project-image {
        width: 100%;
        height: 180px;
        margin-top: 18px;
        object-fit: cover;
    }
    .profile-project-authordiv {
        display: flex;
        align-items: center;
    }
    .profile-project-author {
        width: 2.4em;
        height: 2.4em;
        border-radius: 4px;
        margin-right: 4px;
    }
    .profile-project-authorinfo {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .profile-project-authorinfo p {
        margin-block: 0;
    }
    .profile-project-link {
        color: #4d97ff;
        text-decoration: none;
    }
    .profile-project-date {
        color: #575e75;
        text-decoration: none;
    }
    :global(body.dark-mode) .profile-project-date {
        color: #9ba0b1;
    }
    :global(html[dir="rtl"]) .profile-project-author {
        margin-right: initial;
        margin-left: 4px;
    }

    .user-box-maxwidth {
        width: 100%;
        height: 1px;
    }
    :global(body.dark-mode) .section-user-stats {
        border-color: rgba(255, 255, 255, 0.3);
    }

    .edit-link {
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0 4px;
        color: dodgerblue;
        border-bottom: 1.5px solid dodgerblue;
        cursor: pointer;
    }
    .edit-done {
        background: transparent;
        border: 0;
        padding: 0;
        margin: 0 4px;
        cursor: pointer;
    }

    .profile-bio-textarea {
        width: calc(100% - 6px);
        height: calc(100% - 2.2em);
        margin-top: 4px;
        resize: none;
    }
    .profile-bio-textarea:focus {
        outline: none;
        border-color: black;
    }
    :global(body.dark-mode) .profile-bio-textarea {
        border-color: rgba(255, 255, 255, 0.3);
        background: none;
        color: white;
    }
    :global(body.dark-mode) .profile-bio-textarea:focus {
        outline: none;
        border-color: white;
    }
    .profile-bio-textarea-inappropriate {
        border-color: red !important;
    }
    .profile-bio-warning-inappropriate {
        background: #700;
        color: white;
        font-weight: bold;
        border-radius: 4px;
        z-index: 1000;
        position: absolute;
        padding: 4px 8px;
        max-width: 50%;
        box-shadow: black 0 0 10px;
    }

    .profile-bio-sidenotes {
        width: 70%;
        position: absolute;
        left: 100%;
        top: 12px;
        padding: 10px 8px;
        z-index: 900;
        background: white;
        border: 1px solid rgba(0, 0, 0, 0.3);
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .profile-bio-sidenote {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin: 4px 0;
    }
    .profile-bio-sidenote img {
        margin-right: 4px;
    }
    :global(html[dir="rtl"]) .profile-bio-sidenote img {
        margin-right: initial;
        margin-left: 4px;
    }
    :global(body.dark-mode) .profile-bio-sidenotes {
        background: #111;
        border-color: rgba(255, 255, 255, 0.3);
    }
    :global(html[dir="rtl"]) .profile-bio-sidenotes {
        left: initial;
        right: 100%;
        border-top-right-radius: initial;
        border-bottom-right-radius: initial;
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
    }
    @media screen and (max-width: 1105px) {
        .profile-bio-sidenotes {
            left: initial;
            right: initial;
            top: 100%;
            height: 175px;
        }
        :global(html[dir="rtl"]) .profile-bio-sidenotes {
            left: initial;
            right: initial;
        }
    }

    .featured-project-list {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 960px;
        height: 512px;
        overflow: auto;
    }

    .follower-section {
        width: auto;
        margin-right: 0px;
        text-align: center;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .follower-count {
        font-size: medium;
        text-align: center;
        font-weight: bold;
        margin: 0 6px;
    }
    .follower-button {
        min-width: 100px;
        height: 35px;
        font-size: medium;
        font-weight: bold;
        background-color: rgb(0, 195, 255);
        color: white;
        border-radius: 10px;
        border-color: rgba(0, 0, 0, 0.25);
        border-width: 1px;
        border-style: solid;
        text-align: center;
        cursor: pointer;
    }
    .follower-button-donator {
        background-color: #c65cff;
    }
    .follower-button-following {
        background-color: rgb(163, 163, 163);
    }
    :global(body.dark-mode) .follower-button {
        border-color: rgba(255, 255, 255, 0.25);
    }

    .subuser-section {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .user-username {
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .user-after-image {
        display: flex;
        flex-direction: column;
    }
    .user-after-image > h1 {
        font-size: 3em;
        font-weight: bolder;
        margin-block: 0.2rem;
        margin-left: 20px;
    }

    .user-badge-container {
        margin: 0px;
        /* TODO: this is a bandaid fix, properly fix it later */
        margin-top: -64px;
        height: 32px;
        width: 200px;
        /* TODO: too many badges will overflow this box, fix this later */
    }
    .user-badges {
        display: flex;
        flex-flow: row;
        flex-wrap: wrap;
    }
    .user-badges button {
        position: relative;
        margin: 0 4px;
        border: 0;
        padding: 0;
        width: 32px;
        height: 32px;
        background: transparent;
        cursor: pointer;
    }
    .user-badges button img {
        margin: 0;
        border: 0;
        padding: 0;
        width: 32px;
        height: 32px;
    }

    .badge-info {
        position: absolute;
        top: 36px;
        left: 0;
        padding: 8px 16px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        transform-origin: center;
        transform: translateX(calc(50% - 64px));
        z-index: 5000;
    }
</style>
