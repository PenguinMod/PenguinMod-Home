<script>
    import { onMount } from "svelte";
    import Authentication from "../../resources/authentication.js";

    onMount(async () => {
        const url_params = new URLSearchParams(window.location.search);

        if (!url_params.has("token")) {
            location.href = "/";
            return;
        }

        const token = url_params.get("token");
        const username = url_params.get("username") || (await Authentication.usernameFromCode(null, token, true)).username;

        localStorage.setItem("token", token);
        localStorage.setItem("username", username);

        if (window.opener && !window.opener.closed) {
            window.close();
        } else {
            const redir = url_params.get("redir") || "/";
            location.replace(redir);
        }
    });
</script>

Please wait...
