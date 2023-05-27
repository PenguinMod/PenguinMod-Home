<script>
	import { onMount } from "svelte";
	import Authentication from "../../resources/authentication.js";

	// Static values
	import LINK from "../../resources/urls.js";

	// Components
	import BarButton from "$lib/BarButton/Button.svelte";
	import BarPage from "$lib/BarPage/Button.svelte";
	import BarSearch from "$lib/BarSearch/Search.svelte";

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
					return;
				}
				loggedIn = false;
			})
			.catch(() => {
				loggedIn = false;
			});
		ProjectApi.isAdmin(username).then((isAdminn) => {
		    isAdmin = isAdminn;
		});
	}
	Authentication.onAuthentication(loggedInCheck);

	function logout() {
		localStorage.removeItem("PV");
		Authentication.fireLogout();
		loggedIn = false;
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
</script>

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
	<BarPage label="Create" link={LINK.editor} />
	<BarSearch placeholder="Search for projects..." />
	<BarPage label="My Stuff" link="/mystuff" />
	{#if isAdmin && loggedIn}
		<BarPage label="Admin Panel" link="/panel" />
	{/if}
	<BarButton
		highlighted="true"
		link={LINK.discord}
		label="Join our Discord!"
		noredirect="true"
	/>
	{#if loggedIn === false}
		<BarPage label="Sign in" on:click={login} />
	{:else if loggedIn === true}
		<BarPage label="Logout" on:click={logout} />
	{/if}
</div>

<style>
	:root {
		--penguinmod-color: #00c3ff;
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
		min-width: 800px;
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
</style>
