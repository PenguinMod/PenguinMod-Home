<script>
  import { onMount } from "svelte";
  import Authentication from "../../../resources/authentication.js";

  let loggedIn = null;
  let loggedInUsername = "";

  onMount(() => {
    const params = new URLSearchParams(location.search);
    const importLocation = params.get("external");
    if (!importLocation) return;

    const urlObject = new URL(importLocation);
    if (!urlObject.host.endsWith("penguinmod.com")) {
      return;
    }

    // get parent window
    const opener = window.opener || window.parent;
    if (!opener || opener === window) {
      // exit if not found
      return;
    }

    // wrapper to handle errors & be easier
    function post(data) {
      try {
        opener.postMessage({ p4: data }, importLocation);
      } catch (e) {
        console.warn("Cannot post message", e);
      }
    }

    const privateCode = localStorage.getItem("PV");
    if (!privateCode) {
      loggedIn = false;
      return;
    }
    Authentication.usernameFromCode(privateCode)
      .then(({ username }) => {
        if (username) {
          loggedInUsername = username;
          loggedIn = true;
          post({ username: loggedInUsername });
          return;
        }
        loggedIn = false;
      })
      .catch(() => {
        loggedIn = false;
      });
  });
</script>
