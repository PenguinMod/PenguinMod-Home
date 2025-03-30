<script>
    import { onMount } from "svelte";
    import Authentication from "../../../resources/authentication.js";

    import { PUBLIC_STUDIO_URL } from "$env/static/public";

    const getLoginDetails = async () => {
        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        if (!token || !username) {
            return { loggedIn: false };
        }

        try {
            const { username:_username } = await Authentication.usernameFromCode(username, token);
            if (!_username) return { loggedIn: false };
            return {
                loggedIn: true,
                username: _username
            };
        } catch (e) {
            console.warn(e);
            return { loggedIn: false };
        }
    };

    onMount(async () => {
        const loginDetails = await getLoginDetails();

        const params = new URLSearchParams(location.search);
        const importLocation = params.get("external");
        if (!importLocation) return console.warn("No external provided");

        const stripped = PUBLIC_STUDIO_URL.replace("https://", "").replace("http://", "");

        const urlObject = new URL(importLocation);
        if (
            !(
                urlObject.host.startsWith("dev.penguinmod.com") ||
                urlObject.host.startsWith(stripped) ||
                urlObject.host.startsWith("penguinmod.com") ||
                urlObject.host.startsWith("localhost:3000")
            )
        ) {
            console.warn("Unsafe host", urlObject.host);
            return;
        }

        // get parent window
        const opener = window.opener || window.parent;
        if (!opener || opener === window) {
            // exit if not found
            console.warn("No parents");
            return;
        }

        // wrapper to handle errors & be easier
        function post(type, data) {
            try {
                opener.postMessage(
                    {
                        type,
                        packet: data,
                    },
                    importLocation
                );
            } catch (e) {
                console.warn("Cannot post message", e);
            }
        }

        post("login", loginDetails);
    });
</script>
