<script>
    import { onMount } from "svelte";
    import Alert from "./Alert.svelte";
    import LINK from "../../resources/urls.js";

    let currentStatus = {
        loading: true,
        type: "empty",
        text: "",
    };

    onMount(() => {
        // fetch(`${LINK.basicApi}status`).then((res) => {
        //     if (!res.ok) return;
        //     res.json().then((status) => {
        //         // currently multiple updates are not supported
        //         currentStatus = {
        //             type: "empty",
        //             text: "",
        //             ...status,
        //             loading: false,
        //         };
        //     });
        // });
        currentStatus = {
            loading: true,
            type: "warn",
            text: "The servers are currently down. We are working hard to bring them back up. Please be patient.",
        };
    });
</script>

{#if currentStatus.type !== "empty"}
    <Alert
        text={currentStatus.text}
        backColor="#ffd900"
        textColor="black"
        hasButton={true}
        buttonText="Details"
        buttonHref={"https://status.penguinmod.com/"}
        buttonTooLight={true}
    />
{/if}
