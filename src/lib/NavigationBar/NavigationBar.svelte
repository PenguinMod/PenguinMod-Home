<script>
	import { onMount } from "svelte";
    import { page } from "$app/stores";

	import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

	const isAprilFools = () => {
        const date = new Date(Date.now());
        const urlParams = $page.url.searchParams;
        const isAprilFools = date.getMonth() === 3 && date.getDate() === 1; // month is 0 indexed for literally no reason
        const runningLocal = String(urlParams.get('forceaprilfools')) === 'true' && $page.url.hostname === 'localhost';

        return isAprilFools || runningLocal;
    };

	import Authentication from "../../resources/authentication.js";
	import ProjectApi from "../../resources/projectapi.js";
	import HTMLUtility from "../../resources/html.js";

	const ProjectClient = new ProjectApi();

	// Static values
	import LINK from "../../resources/urls.js";

	// Components
	import BarButton from "$lib/BarButton/Button.svelte";
	import BarPage from "$lib/BarPage/Button.svelte";
	import BarSearch from "$lib/BarSearch/Search.svelte";
	import CircularProgress from "$lib/CircularProgress.svelte";
	// translations
	import LocalizedText from "$lib/LocalizedText/Node.svelte";
	import Translations from "../../resources/translations.js";
	import Language from "../../resources/language.js";

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [pfpkey]
	 */

	/** @type {Props} */
	let { pfpkey = false } = $props();

	let loggedIn = $state(null);
	let isAdmin = $state(false);
	let isApprover = $state(false);
	let accountUsername = $state("");
	let messageCount = $state(0);
	let canRankUp = $state(false);

	const isAprilFirst = isAprilFools();
	const randomColor = (() => {
		const colors = [
			"#00c3ff",
			"#ff4c4c",
			"#66757f",
			"#ffd000",
			"#b200fe"
		];
		return colors[Math.round(Math.random() * (colors.length - 1))];
	})();

	function loggedInCheck() {
		const username = localStorage.getItem("username");
		const token = localStorage.getItem("token")
		if (!token || !username) {
			loggedIn = false;
			canRankUp = false;
			messageCount = 0;
			return;
		}
		Authentication.usernameFromCode(username, token)
			.then(
				({ isAdmin: isAdminn, isApprover: isApproverr, countryEntered, birthdayEntered }) => {
					loggedIn = true;
					accountUsername = username;
					isAdmin = isAdminn;
					isApprover = isApproverr;
					ProjectClient.setUsername(username);
					ProjectClient.setToken(token);
					ProjectClient.setAdmin(isAdminn);
					ProjectClient.getUnreadMessageCount().then((amount) => {
						messageCount = amount;
					});
					ProjectApi.getProfile(username, false, token).then((profile) => {
						canRankUp = profile.canrankup === true;
					});

					const permittedPages = [
						"/unfinishedsignup",
						"/terms",
						"/privacy",
						"/contact",
						"/guidelines/uploading"
					];
					if ((!countryEntered || !birthdayEntered) && !permittedPages.includes(location.pathname)) {
						const newUrl = new URL(location.href);
						newUrl.pathname = "/unfinishedsignup";
						if (!countryEntered && birthdayEntered) {
							newUrl.search = "?fillout=country"
						}
						if (!birthdayEntered && countryEntered) {
							newUrl.search = "?fillout=birthday"
						}
						location.href = newUrl;
					}
				}
			)
			.catch((err) => {
				loggedIn = false;
				canRankUp = false;
				messageCount = 0;
			});
	}
	Authentication.onAuthentication(loggedInCheck);

	let languageMenu = $state();
	let accountMenu = $state();
	let accountButton = $state();

	function logout() {
		accountMenu.style.display = "none";
		Authentication.logout().then(() => {
		    loggedIn = false;
		    canRankUp = false;
		    messageCount = 0;
		});
	}
	function login() {
		Authentication.authenticate().then(() => {
			location.reload();
		})
	}

	function switchTheme() {
		let prefersDarkMode = false;
		try {
			prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
		} catch {
			prefersDarkMode = false;
		}
		const darkThemeOption = localStorage.getItem("darkmode");
		const hasDarkOption = darkThemeOption !== null && darkThemeOption !== undefined;
		if (String(darkThemeOption) === "true" || (!hasDarkOption && prefersDarkMode)) { 
			localStorage.setItem("darkmode", false);
		} else {
			localStorage.setItem("darkmode", true);
		}
	}

	onMount(loggedInCheck);

	let currentLang = $state("en");
	onMount(() => {
		Language.forceUpdate();
	});
	Language.onChange((lang) => {
		currentLang = lang;
	});

	// language picker
	const availableLanguages = Translations.languages;
	const languageKeys = Object.keys(availableLanguages)
		.sort((a, b) => a.localeCompare(b));
	function openLanguageMenu(event) {
		event = event.detail;
		languageMenu.style.display = "";
		languageMenu.style.left = `4px`;
		languageMenu.style.top = `3rem`;
		if (window._isPenguinModLauncher) {
			languageMenu.style.top = "initial";
			languageMenu.style.left = `calc(5rem + 4px)`;
			languageMenu.style.bottom = "4px";
		}
		if (Translations.rtlLanguages.includes(currentLang)) {
			languageMenu.style.left = `initial`;
			languageMenu.style.right = `4px`;
		}
	}
	let accountMenuIsOpen = false;
	function openAccountMenu(event) {
		const buttonRect = accountButton.getBoundingClientRect();
		event = event.detail;
		if (accountMenuIsOpen) {
			accountMenu.style.display = "none";
			accountMenuIsOpen = false;
			return;
		}
		accountMenu.style.display = "";
		accountMenu.style.right = `${
			window.innerWidth - buttonRect.right - 8
		}px`;
		accountMenu.style.top = `3rem`;
		accountMenuIsOpen = true;
	}
	function chooseLang(lang) {
		languageMenu.style.display = "none";
		if (lang === "default") {
			localStorage.removeItem("pm:language");
			Language.forceUpdate();
			return;
		}
		localStorage.setItem("pm:language", lang);
		Language.forceUpdate();
	}
	// close menu if we didnt click in it
	onMount(() => {
		window.addEventListener("mousedown", (e) => {
			if (languageMenu) {
				if (!HTMLUtility.isDescendantOf(languageMenu, e.target)) {
					languageMenu.style.display = "none";
				}
			}
			if (accountMenu && accountButton) {
				if (!HTMLUtility.isDescendantOf(accountMenu, e.target) && !HTMLUtility.isDescendantOf(accountButton, e.target)) {
					accountMenu.style.display = "none";
				}
			}
		});
	});
</script>

<div style="display: none;" class="languageSelect" bind:this={languageMenu}>
	<button
		class="languageOption"
		style="margin-bottom: 8px;"
		onclick={() => chooseLang("default")}
	>
		<LocalizedText
			text="Same as browser"
			key="lang.default"
			lang={currentLang}
		/>
	</button>
	<p class="languageCount">
		<LocalizedText
			text="$1 languages translated"
			key="lang.count"
			lang={currentLang}
			replace={{
				"$1": languageKeys.length
			}}
		/>
	</p>
	{#each languageKeys as languageCode}
		<button
			class="languageOption"
			onclick={() => chooseLang(languageCode)}
		>
			<div class="languageProgress">
				<div class="only-in-dark-mode">
					<CircularProgress
						progress={Translations.getLanguageFinishedPercentage(languageCode)}
						holeColor="#222"
						emptyColor="#555"
						fillColor="dodgerblue 0deg, dodgerblue"
						style="width: 28px;height:28px;"
					/>
				</div>
				<div class="only-non-dark-mode">
					<CircularProgress
						progress={Translations.getLanguageFinishedPercentage(languageCode)}
						fillColor="dodgerblue 0deg, dodgerblue"
						style="width: 28px;height:28px;"
					/>
				</div>
				<span>
					{Math.round(Translations.getLanguageFinishedPercentage(languageCode) * 100)}
				</span>
			</div>
			<LocalizedText
				text={languageCode}
				key="lang.name"
				lang={languageCode}
			/>
		</button>
	{/each}
</div>
<div
	style="display: none;"
	class="profile-dropdown-menu"
	bind:this={accountMenu}
>
	<a href={`/profile?user=${accountUsername}`}>
		<button>
			<LocalizedText
				text="Profile"
				key="navigation.profile"
				lang={currentLang}
			/>
			{#if canRankUp}
				<div class="rankup-badge">!</div>
			{/if}
		</button>
	</a>
	<a href="/mystuff">
		<button>
			<LocalizedText
				text="My Stuff"
				key="navigation.mystuff"
				lang={currentLang}
			/>
		</button>
	</a>
	<a href="/settings">
		<button>
			<LocalizedText
				text="Settings"
				key="account.settings.title"
				lang={currentLang}
			/>
		</button>
	</a>
	<div class="seperated-navopt"></div>
	<button onclick={logout}>
		<LocalizedText
			text="Logout"
			key="navigation.logout"
			lang={currentLang}
		/>
	</button>
</div>
<div class="bar" style={isAprilFirst ? `background-color: ${randomColor} !important` : ''}>
	<a class="logo" href="/">
		<img class="logo-image" src="/navicon.png" alt="PenguinMod" />
	</a>
	<div style="margin-right: 12px;"></div>
	<div class="logo-launcher-margin"></div>
	<BarPage
		label="<img src='/moon.svg' alt='ThemeSwitcher'>"
		style="padding:0.5rem"
		classActor={"themeSwitcher"}
		on:click={switchTheme}
		title="navigation.theme"
		lang={currentLang}
	/>
	<div class="only-non-launcher">
		<BarPage link={LINK.editor}>
			<LocalizedText
				text="Create"
				key="navigation.create"
				lang={currentLang}
			/>
		</BarPage>
	</div>
	<div class="only-launcher">
		<BarPage id="__home_navigation_create_button">
			<img src="/create.png" alt="Create" />
		</BarPage>
	</div>
	<BarSearch placeholder={Translations.textSafe("navigation.search", currentLang, "Search for projects...")} />
	<BarButton
		highlighted="true"
		link={LINK.discord}
		noredirect="true"
		classActor={"discordButton"}
	>
		<div class="discord-button-text">
			<LocalizedText
				text="Discord"
				key="navigation.discord"
				lang={currentLang}
			/>
		</div>
		<div class="discord-button-icon">
			<img src="/discord_white.png" alt="Discord" />
		</div>
	</BarButton>
	<!-- <BarPage
		link={LINK.discord}
		label="<img src='/discord_white.png' width='25' alt='Discord'>"
		style="padding:0.5rem"
	/> -->
	{#if loggedIn === true}
		<BarPage
			link="/messages"
			label={"<img src='/messagesstatic/messages.svg' width='25' alt='Messages'>"}
			style="padding:0.5rem"
			title="messages.title"
			lang={currentLang}
		>
			{#if messageCount > 0}
				<div class="message-badge">
					{#if messageCount > 9}
						!
					{:else}
						{messageCount}
					{/if}
				</div>
			{/if}
		</BarPage>
		<BarPage
			link="/mystuff"
			label="<img src='/messagesstatic/mystuff.svg' width='25' alt='My Stuff'>"
			style="padding:0.5rem"
			title="mystuff.title"
			lang={currentLang}
		/>
	{/if}
	{#if (isAdmin || isApprover) && loggedIn}
		<BarPage
			link="/panel"
			label="<img src='/messagesstatic/panel.svg' width='25' alt='Panel'>"
			style="padding:0.5rem"
			title="Admin Panel"
		/>
	{/if}
	{#if loggedIn === false}
		<BarPage on:click={login}>
			<LocalizedText
				text="Sign in"
				key="navigation.login"
				lang={currentLang}
			/>
		</BarPage>
		<BarPage on:click={() => location.href="/signup"}>
			<LocalizedText
				text="Sign up"
				key="navigation.signup"
				lang={currentLang}
			/>
		</BarPage>
	{:else if loggedIn === true}
		<!-- svelte-ignore a11y_img_redundant_alt -->
		<button
			class="profile-dropdown"
			bind:this={accountButton}
			onclick={openAccountMenu}
		>
			<img
				src={`${PUBLIC_API_URL}/api/v1/users/getpfp?username=${accountUsername}&reload=${pfpkey}`}
				alt="Profile Picture"
				class="profile-picture"
			/>
			<p>{accountUsername}</p>
			<img src="/dropdown-caret.png" style="margin: 0 4px" alt="v" />
		</button>
	{/if}
	<BarPage
		label="<img src='/globe.svg' alt='LanguageSwitcher'><img src='/dropdown-caret.png' style='margin: 0 4px' alt='v'>"
		style={"padding: 0.5rem; position: absolute; left: 4px;" +
			(Object.keys(availableLanguages).length <= 1
				? "display: none;"
				: "")}
		classActor={"languageButton"}
		on:click={openLanguageMenu}
		title="navigation.language"
		lang={currentLang}
	/>
</div>

<style>
	:root {
		--penguinmod-color: #00c3ff;
	}
	:global(body.dark-mode) {
		--penguinmod-color: #009ccc;
	}

	.bar {
		position: fixed;
		width: 100%;
		left: 0px;
		top: 0px;
		background: var(--penguinmod-color);
		height: 3rem;
		color: white;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		flex-wrap: nowrap;
		box-sizing: border-box;
		font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
		font-size: 0.75rem;
		font-weight: bold;
		min-width: 1000px;
		z-index: 1000;
	}
	:global(body.launcher-mode) .bar {
		width: 5rem;
		height: 100%;
		min-width: initial;
		min-height: 360px;
		flex-direction: column;
		justify-content: flex-start;
	}

	.logo {
		height: 100%;
	}
	.logo-image {
		margin-top: 10%;
		height: 80%;
		transition: 0.15s ease all;
	}
	.logo-image:hover {
		margin-top: 5%;
		height: 90%;
		transition: 0.15s ease all;
	}
	.logo-launcher-margin {
		width: 0;
		height: 0;
	}
	:global(body.launcher-mode) .logo {
		position: absolute;
		top: 8px;
		height: initial;
		width: 100%;
	}
	:global(body.launcher-mode) .logo-image {
		height: initial;
		margin-top: 20%;
		margin-left: 20%;
		width: 60%;
	}
	:global(body.launcher-mode) .logo-image:hover {
		height: initial;
		margin-top: 15%;
		margin-left: 15%;
		width: 70%;
	}
	:global(body.launcher-mode) .logo-launcher-margin {
		height: 90px;
	}

	.discord-button-icon {
		display: none;
	}
	.discord-button-icon > img {
		width: 2rem;
		padding: 2px 0;
	}
	:global(body.launcher-mode) .discord-button-icon {
		display: initial;
	}
	:global(body.launcher-mode) .discord-button-text {
		display: none;
	}

	.languageSelect {
		position: fixed;
		width: 256px;
		max-height: 60%;
		overflow: auto;
		background: white;
		box-shadow: 0px 0px 8px black;
		outline: #222 1px solid;
		z-index: 9999999;
	}
	.languageOption {
		width: 100%;
		/* margin: 4px 0px; */
		/* border-radius: 4px; */
		background: white;
		border: 0;
		font-size: 1rem;
		text-align: left;
		cursor: pointer;

		display: flex;
		align-items: center;
	}
	:global(html[dir="rtl"]) .languageOption {
		text-align: right;
	}

	.languageProgress {
		position: relative;
		margin-right: 4px;
	}
	.languageProgress span {
		position: absolute;
		left: 0;
		top: calc(50% - (1.15em / 2));
		width: 28px;
		height: 28px;

		text-align: center;
		vertical-align: middle;

		color: black;
		font-size: 0.75em;
	}
	:global(html[dir="rtl"]) .languageProgress {
		margin-right: initial;
		margin-left: 4px;
	}
	:global(body.dark-mode) .languageProgress span {
		color: white;
	}

	.languageCount {
		/* width: 100%; */
		/* text-align: center; */
		font-weight: bold;
		font-size: 12px;
		margin-left: 4px;
		margin-bottom: 0px;
		font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
	}

	:global(body.dark-mode) .languageSelect {
		background: #222;
		outline: white 1px solid;
	}
	:global(body.dark-mode) .languageOption {
		color: white;
		background: #222;
	}

	.languageOption:hover {
		background: dodgerblue !important;
		color: white;
	}

	.message-badge {
		position: absolute;
		background: red;
		color: white;
		font-weight: bold;
		border-radius: 1000px;
		width: 16px;
		height: 16px;
		top: 0px;
		right: 0px;
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

	.profile-picture {
		border-radius: 4px;
		width: 30px;
		height: 30px;
		margin-right: 8px;
	}
	:global(html[dir="rtl"]) .profile-picture {
		margin-right: initial;
		margin-left: 8px;
	}
	.profile-dropdown {
		background: transparent;
		border-radius: 4px;
		padding: 0 10px;
		border: 0;
		margin: 0;

		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;

		cursor: pointer;
		user-select: none;
	}
	.profile-dropdown > p {
		font-weight: bold;
		font-size: 0.85rem;
		color: white;
	}

	.profile-dropdown:hover,
	.profile-dropdown:focus {
		background: rgba(0, 0, 0, 0.15);
	}

	.profile-dropdown-menu {
		position: fixed;
		background: var(--penguinmod-color);
		border-radius: 4px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		padding: 4px 0;
		border-top: 0;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
		z-index: 9999;
	}
	.profile-dropdown-menu button {
		background: transparent;
		font-weight: bold;
		font-size: 0.85rem;
		text-align: left;
		width: 100%;
		color: white;
		border: 0;
		padding: 8px 8px;
		padding-right: 4px;
		margin: 4px 0;
		text-decoration: none;
		cursor: pointer;
		user-select: none;
	}
	:global(html[dir="rtl"]) .profile-dropdown-menu button {
		text-align: right;
	}
	.profile-dropdown-menu button:hover {
		background: rgba(0, 0, 0, 0.15);
	}

	.profile-dropdown-menu .seperated-navopt {
		border-top: 1px solid rgba(0, 0, 0, 0.15);
		width: calc(100% - 8px);
		margin-left: 4px;
	}

	.only-non-launcher {
		display: initial;
	}
	.only-launcher {
		display: none;
	}
	:global(body.launcher-mode) .only-non-launcher {
		display: none;
	}
	:global(body.launcher-mode) .only-launcher {
		display: initial;
	}
	
    .only-in-dark-mode {
        display: none;
    }
    :global(body.dark-mode) .only-in-dark-mode {
        display: initial;
    }
    .only-non-dark-mode {
        display: initial;
    }
    :global(body.dark-mode) .only-non-dark-mode {
        display: none;
    }
</style>
