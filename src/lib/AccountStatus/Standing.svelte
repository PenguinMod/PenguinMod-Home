<script>
    export let username = "";
    export let image = "/navicon.png";
    export let showname = false;
    export let status = 1; // 1 for first icon
    
    export let detail = 1; // 1 is image & status, 2 adds status labels, 3 adds punishment info, and 4 adds mod messages section
    export let messagecount = 0;
</script>

<div class="display">
    <img
        src={image}
        alt={username}
        title={username}
        class="pfp"
    />
    {#if showname}
        <h1 style="margin-block:4px;">{username}</h1>
    {/if}

    <div class="status-section" data-detail={detail}>
        <div class="status-line" />
        <div data-detail="1" data-selected={status === 1}>
            <p>Full Access</p>
        </div>
        <div data-detail="2" data-selected={status === 2}>
            <p>Limited</p>
        </div>
        <div data-detail="3" data-selected={status === 3}>
            <p>Temporarily Banned</p>
        </div>
        <div data-detail="4" data-selected={status === 4}>
            <p>Suspended</p>
        </div>
    </div>

    {#if detail >= 3}
        <div class="detail-section">
            <!-- TODO: base this on the provided status using LocalizedText -->
            <p>Your account does not currently have any punishments on it.</p>

            {#if detail >= 4}
                <!-- TODO: use LocalizedText and add 9+ message limit -->
                <h2>Moderator Messages ({messagecount})</h2>
                <a href="/messages">Click here to view your messages.</a>
            {/if}
        </div>
    {/if}
</div>

<style>
    .display {
        display: flex;
        align-items: center;
        flex-direction: column;
    }
    .pfp {
        width: 128px;
        height: 128px;
        border-radius: 4px;
    }

    .status-section {
        position: relative;

        width: 80%;
        height: calc(32px + 16px); /* current status pointer is 16px */

        display: flex;
        flex-direction: row;
        align-items: flex-end;
        justify-content: space-between;
    }
    .status-section div[data-detail] {
        position: relative;
        width: 32px;
        height: 32px;

        background-image: url("/account/standing_sheet.png");
        background-size: 64px;
        background-repeat: no-repeat;
        z-index: 4;
    }
    .status-section[data-detail="1"] p {
        display: none;
    }
    .status-line {
        position: absolute;
        left: 16px;
        top: calc(((32px / 2) - (4px / 2)) + 16px);
        width: calc(100% - 32px);
        height: 4px;

        background-color: rgba(0, 0, 0, 0.1);
        z-index: -5;
    }
    :global(body.dark-mode) .status-line {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .status-section div[data-detail="1"] {
        background-position: 0 0;
    }
    .status-section div[data-detail="2"] {
        background-position: -32px 0;
    }
    .status-section div[data-detail="3"] {
        background-position: 0 -32px;
    }
    .status-section div[data-detail="4"] {
        background-position: -32px -32px;
    }
    
    .status-section div[data-detail] p {
        position: absolute;
        top: 16px;
        left: 50%;
        width: max-content;
        height: 100%;

        /* this css is magic, if it breaks then we cannot fix it */
        transform: translateX(-50%);
        text-align: center;
        white-space: nowrap;
        overflow: visible;
    }

    .status-section div[data-selected=true]::before {
        position: absolute;
        left: calc(32px / 4);
        bottom: 32px;
        width: 16px;
        height: 16px;

        content: "";
        background-image: url("/account/standing_arrow.png");
        background-size: 100%;
        background-repeat: no-repeat;
    }
    :global(body.dark-mode) .status-section div[data-selected=true]::before {
        filter: invert(1);
    }

    .detail-section {
        margin-top: 8px;
        width: calc(100% - 16px);
    }
    
    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>