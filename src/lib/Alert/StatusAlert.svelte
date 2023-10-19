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
        fetch(`${LINK.updateReaderApi}status`).then((res) => {
            if (!res.ok) return;
            res.json().then((status) => {
                // currently multiple updates are not supported
                currentStatus = {
                    type: "empty",
                    text: "",
                    ...status,
                    loading: false,
                };
            });
        });
    });
</script>

{#if currentStatus.type !== "empty"}
    <Alert
        text={currentStatus.text}
        backColor="#ffd900"
        textColor="black"
        hasButton={true}
        buttonText="Details"
        buttonHref={"https://status.penguinmod.site/"}
        buttonTooLight={true}
    />
{/if}
