<script>
	import { onMount } from "svelte";
	import Authentication from "../../resources/authentication.js";
	import ProjectApi from "../../resources/projectapi.js";
	import HTMLUtility from "../../resources/html.js";

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

	function loggedInCheck() {
		const privateCode = localStorage.getItem("PV");
		if (!privateCode) {
			loggedIn = false;
			return;
		}
		Authentication.usernameFromCode(privateCode)
			.then((username) => {
				if (username) {
					loggedIn = true;
					ProjectApi.isAdmin(username).then((isAdminn) => {
						isAdmin = isAdminn;
					});
					return;
				}
				loggedIn = false;
			})
			.catch(() => {
				loggedIn = false;
			});
	}
	Authentication.onAuthentication(loggedInCheck);

	function logout() {
		const pv = localStorage.getItem("PV");
		Authentication.usernameFromCode(pv).then(username => {
			fetch(`${LINK.projects}api/users/logout?user=${username}&code=${pv}`).then((res) => {
				if (!res.ok) return;
				localStorage.removeItem("PV");
				Authentication.fireLogout();
				loggedIn = false;
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
	let languageMenu;
	function openLanguageMenu(event) {
		event = event.detail;
		languageMenu.style.display = "";
		languageMenu.style.left = `4px`;
		languageMenu.style.top = `3rem`;
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
			if (!languageMenu) return;
			if (!HTMLUtility.isDescendantOf(languageMenu, e.target)) {
				languageMenu.style.display = "none";
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
<div class="bar">
	<a class="logo" href="/">
		<img class="logo-image" src="/navicon.png" alt="PenguinMod" />
	</a>
	<div style="margin-right: 12px;" />
	<BarPage
		label="<img src='/moon.svg' alt='ThemeSwitcher'>"
		style="padding:0.5rem"
		on:click={switchTheme}
	/>
	<BarPage link={LINK.editor}>
		<LocalizedText
			text="Create"
			key="navigation.create"
			lang={currentLang}
		/>
	</BarPage>
	<BarSearch placeholder={searchBar} />
	{#if loggedIn === true}
		<BarPage link="/mystuff">
			<LocalizedText
				text="My Stuff"
				key="navigation.mystuff"
				lang={currentLang}
			/>
		</BarPage>
	{/if}
	{#if isAdmin && loggedIn}
		<BarPage label="Admin Panel" link="/panel" />
	{/if}
	<BarButton highlighted="true" link={LINK.discord} noredirect="true">
		<LocalizedText
			text="Discord"
			key="navigation.discord"
			lang={currentLang}
		/>
	</BarButton>
	{#if loggedIn === false}
		<BarPage on:click={login}>
			<LocalizedText
				text="Sign in"
				key="navigation.login"
				lang={currentLang}
			/>
		</BarPage>
	{:else if loggedIn === true}
		<BarPage on:click={logout}>
			<LocalizedText
				text="Logout"
				key="navigation.logout"
				lang={currentLang}
			/>
		</BarPage>
	{/if}
	<BarPage
		label="<img src='/globe.svg' alt='LanguageSwitcher'><img src='/dropdown-caret.png' style='margin-left: 4px' alt='v'>"
		style={"padding: 0.5rem; position: absolute; left: 4px;" +
			(Object.keys(availableLanguages).length <= 1
				? "display: none;"
				: "")}
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
</style>
