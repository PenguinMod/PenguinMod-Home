<script>
    import { onMount } from "svelte";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";

    // Static values
    import LINK from "../../resources/urls.js";

    onMount(() => {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get("code");
        fetch(
            `${LINK.projects}api/v1/users/gettokenfromonetimecode?code=${code}`,
        )
            .then((res) => res.json())
            .then((res) => {
                if (!res.token) {
                    throw "No token returned";
                }

                localStorage.setItem("token", res.token);
                // this isn't exactly necessary. but this site sucks balls and so a lot of
                // the code expects this username to exist
                localStorage.setItem("username", res.username);
            })
            .catch((err) => {
                alert(
                    `Please report this via our contact page (take a screenshot): ${err}`,
                );
            })
            .finally(() => {
                window.location.replace("/");
            });
    });
</script>

<svelte:head>
    <title>PenguinMod - Support Us</title>
    <meta name="title" content="PenguinMod - Ladidadida" />
    <meta property="og:title" content="PenguinMod - Ladidadidi" />
    <meta property="twitter:title" content="PenguinMod - Sycmnailmbaifuttm" />
</svelte:head>

<NavigationBar />

<NavigationMargin />

Please wait...
