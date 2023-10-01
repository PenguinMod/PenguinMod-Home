<script>
	import { onMount } from "svelte";
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
	// translations
	import LocalizedText from "$lib/LocalizedText/Node.svelte";
	import Translations from "../../resources/translations.js";
	import Language from "../../resources/language.js";

	let loggedIn = null;
	let isAdmin = false;
	let isApprover = false;
	let accountUsername = "";
	let messageCount = 0;

	function loggedInCheck() {
		const privateCode = localStorage.getItem("PV");
		if (!privateCode) {
			loggedIn = false;
			messageCount = 0;
			return;
		}
		Authentication.usernameFromCode(privateCode)
			.then(({username, isAdmin: isAdminn, isApprover: isApproverr}) => {
				if (username) {
					loggedIn = true;
					accountUsername = username;
					isAdmin = isAdminn;
					isApprover = isApproverr;
					if (username) ProjectClient.setUsername(username);
					if (privateCode) ProjectClient.setPrivateCode(privateCode);
					ProjectClient.getMessageCount().then((amount) => {
						messageCount = amount;
					});
					return;
				}
				loggedIn = false;
				messageCount = 0;
			})
			.catch(() => {
				loggedIn = false;
				messageCount = 0;
			});
	}
	Authentication.onAuthentication(loggedInCheck);

	let languageMenu;
	let accountMenu;
	let accountButton;

	function logout() {
		accountMenu.style.display = "none";
		const pv = localStorage.getItem("PV");
		Authentication.usernameFromCode(pv).then(({username}) => {
			fetch(
				`${LINK.projects}api/users/logout?user=${username}&code=${pv}`
			).then((res) => {
				if (!res.ok) return;
				localStorage.removeItem("PV");
				Authentication.fireLogout();
				loggedIn = false;
				messageCount = 0;
			});
		});
	}
	function login() {
		Authentication.authenticate();
	}

	function switchTheme() {
		if (localStorage.getItem("darkmode")) {
			localStorage.removeItem("darkmode");
		} else {
			localStorage.setItem("darkmode", true);
		}
	}

	onMount(loggedInCheck);

	let currentLang = "en";
	let searchBar = "Search for projects...";
	let defaultLanguageText = "Same as browser";
	let defaultLanguageCount = "$1 languages translated";
	onMount(() => {
		Language.forceUpdate();
	});
	Language.onChange((lang) => {
		currentLang = lang;
		searchBar = Translations.text("navigation.search", currentLang);
		defaultLanguageText = Translations.text("lang.default", currentLang);
		defaultLanguageCount = Translations.text("lang.count", currentLang);
	});

	// language picker
	const availableLanguages = Translations.languages;
	const languageKeys = Object.keys(availableLanguages);
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
	}
	function openAccountMenu(event) {
		const buttonRect = accountButton.getBoundingClientRect();
		event = event.detail;
		accountMenu.style.display = "";
		accountMenu.style.right = `${
			window.innerWidth - buttonRect.right - 8
		}px`;
		accountMenu.style.top = `3rem`;
	}
	function langName(lang) {
		return Translations.text("lang.name", lang);
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
			if (accountMenu) {
				if (!HTMLUtility.isDescendantOf(accountMenu, e.target)) {
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
		on:click={() => chooseLang("default")}
	>
		{defaultLanguageText}
	</button>
	<p class="languageCount">
		{defaultLanguageCount.replace("$1", languageKeys.length)}
	</p>
	{#each languageKeys as languageCode}
		<button
			class="languageOption"
			title={langName(languageCode) + ` (${languageCode})`}
			on:click={() => chooseLang(languageCode)}
		>
			{langName(languageCode)}
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
	<button on:click={logout}>
		<LocalizedText
			text="Logout"
			key="navigation.logout"
			lang={currentLang}
		/>
	</button>
</div>
<div class="bar">
	<a class="logo" href="/">
		<img class="logo-image" src="/navicon.png" alt="PenguinMod" />
	</a>
	<div style="margin-right: 12px;" />
	<div class="logo-launcher-margin" />
	<BarPage
		label="<img src='/moon.svg' alt='ThemeSwitcher'>"
		style="padding:0.5rem"
		classActor={"themeSwitcher"}
		on:click={switchTheme}
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
	<BarSearch placeholder={searchBar} />
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
	{#if loggedIn === true}
		<BarPage
			link="/messages"
			label={"<img src='/messages/messages.svg' width='25' alt='Messages'>"}
			style="padding:0.5rem"
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
			label="<img src='/messages/mystuff.svg' width='25' alt='My Stuff'>"
			style="padding:0.5rem"
		/>
	{/if}
	{#if isAdmin && loggedIn}
		<BarPage
			link="/panel"
			label="<img src='/messages/panel.svg' width='25' alt='Panel'>"
			style="padding:0.5rem"
		/>
	{:else if isApprover && loggedIn}
		<BarPage
			link="/userpanel"
			label="<img src='/messages/panel.svg' width='25' alt='Panel'>"
			style="padding:0.5rem"
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
	{:else if loggedIn === true}
		<!-- svelte-ignore a11y-img-redundant-alt -->
		<button
			class="profile-dropdown"
			bind:this={accountButton}
			on:click={openAccountMenu}
		>
			<img
				src={`https://trampoline.turbowarp.org/avatars/by-username/${accountUsername}`}
				alt="Profile Picture"
				class="profile-picture"
			/>
			<p>{accountUsername}</p>
			<img src="/dropdown-caret.png" style="margin-left: 4px" alt="v" />
		</button>
	{/if}
	<BarPage
		label="<img src='/globe.svg' alt='LanguageSwitcher'><img src='/dropdown-caret.png' style='margin-left: 4px' alt='v'>"
		style={"padding: 0.5rem; position: absolute; left: 4px;" +
			(Object.keys(availableLanguages).length <= 1
				? "display: none;"
				: "")}
		classActor={"languageButton"}
		on:click={openLanguageMenu}
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
		width: 192px;
		max-height: 300px;
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

	.profile-picture {
		border-radius: 4px;
		width: 30px;
		height: 30px;
		margin-right: 8px;
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
	.profile-dropdown-menu button:hover {
		background: rgba(0, 0, 0, 0.15);
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
</style>
