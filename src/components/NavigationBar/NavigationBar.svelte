<script>
	// Static values
	import LINK from "../../resources/urls.js";

	// Components
	import BarButton from "../../components/BarButton/Button.svelte";
	import BarPage from "../../components/BarPage/Button.svelte";
	import BarSearch from "../../components/BarSearch/Search.svelte";
</script>

<div class="bar">
	<a class="logo" href="/">
		<img class="logo-image" src="/navicon.png" alt="PenguinMod" />
	</a>
	<div style="margin-right: 12px;" />
	<BarPage label="Create" link={LINK.editor} />
	<BarPage label="More Projects" link={LINK.projects} />
	<BarSearch placeholder="Search for projects..." />
	<BarPage label="My Stuff" link={LINK.mystuff} />
	<BarButton
		highlighted="true"
		link={LINK.discord}
		label="Join our Discord!"
	/>
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
