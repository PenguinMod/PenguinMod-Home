<script>
    import { onMount } from "svelte";
    import Authentication from "../../../resources/authentication.js";
    import ProjectApi from "../../../resources/projectapi.js";
    const ProjectClient = new ProjectApi();

    // Components
    import LoadingSpinner from "$lib/LoadingSpinner/Spinner.svelte";

    function numberCast(num) {
        const neww = Number(num);
        if (isNaN(neww)) return 0;
        return neww;
    }

    let likes = 0;
    let votes = 0;
    let views = 0;

    let userLiked = false;
    let userVoted = false;
    let userLikedOnLoad = false;
    let userVotedOnLoad = false;

    let loaded = false;
    let loggedIn = true;
    let loggedInAdmin = false;

    let projectId = 0;

    function vote() {
        if (loggedIn === false) {
            Authentication.authenticate().then(() => {
                const username = localStorage.getItem("username");
                const token = localStorage.getItem("token");
                Authentication.usernameFromCode(username, token)
                    .then(({isAdmin, isApprover}) => {
                        loggedIn = true;
                        loggedInAdmin = isAdmin || isApprover;
                        ProjectClient.setUsername(username);
                        ProjectClient.setToken(token);
                        registerView();
                        vote();
                        return;
                    })
                    .catch(() => {
                        loggedIn = false;
                    });
            });
            return;
        }
        ProjectClient.toggleVoteProject(projectId, "vote", !userVoted)
            .catch((err) => alert(String(err)));
        userVoted = !userVoted;
    }
    function love() {
        if (loggedIn === false) {
            Authentication.authenticate().then(() => {
                const username = localStorage.getItem("username");
                const token = localStorage.getItem("token");
                Authentication.usernameFromCode(username, token)
                    .then(({isAdmin, isApprover}) => {
                        loggedIn = true;
                        loggedInAdmin = isAdmin || isApprover;
                        ProjectClient.setUsername(username);
                        ProjectClient.setToken(token);
                        registerView();
                        love();
                        return;
                    })
                    .catch(() => {
                        loggedIn = false;
                    });
            });
            return;
        }
        ProjectClient.toggleVoteProject(projectId, "love", !userLiked)
            .catch((err) => alert(String(err)));
        userLiked = !userLiked;
    }

    function updateVoteStates() {
        ProjectClient.getVoteStates(projectId)
            .then((states) => {
                userLiked = states.loved;
                userVoted = states.voted;
                userLikedOnLoad = userLiked;
                userVotedOnLoad = userVoted;
                loaded = true;
            })
            .catch(() => {
                userLiked = false;
                userVoted = false;
                loaded = true;
            });
    }
    onMount(() => {
        const params = new URLSearchParams(location.search);
        const projId = String(params.get("id"));
        projectId = projId;
        
        ProjectApi.getProjectMeta(projId)
            .then((meta) => {
                likes = numberCast(meta.loves);
                votes = numberCast(meta.votes);
                views = numberCast(meta.views);
            })
            .catch(() => {
                likes = 0;
                votes = 0;
                views = 0;
            });

        const username = localStorage.getItem("username");
        const token = localStorage.getItem("token");
        
        if (!token || !username) {
            loggedIn = false;
            userLiked = false;
            userVoted = false;
            loaded = true;
            console.log("what", username, token)
            return;
        }
        Authentication.usernameFromCode(username, token)
            .then(({ isAdmin, isApprover }) => {
                console.log("suces")
                ProjectClient.setToken(token);
                ProjectClient.setUsername(username);

                updateVoteStates();
                loggedIn = true;
                loggedInAdmin = isAdmin || isApprover;

                registerView();
            })
            .catch((e) => {
                console.log("err", e)
                loggedIn = false;
                userLiked = false;
                userVoted = false;
                loaded = true;
            });
    });

    // RTODO: change this
    Authentication.onAuthentication((username, privateCode) => {
        ProjectClient.setUsername(username);
        ProjectClient.setToken(privateCode);
        Authentication.usernameFromCode(username, privateCode).then(({ isAdmin, isApprover}) => {
            loggedIn = true;
            loggedInAdmin = isAdmin || isApprover;
        });
    });

    // used for algorithm
    function registerView() {
        ProjectClient.registerView(projectId);
    }
</script>

<div class="main">
    {#if loaded}
        <div title="Like this project" class="parent button-text">
            <button class="like" on:click={love}>
                <img
                    src="/vote/heart{userLiked ? "" : "_white"}.svg"
                    alt="Like"
                    class="button-image"
                    draggable="false"
                    data-activated={userLiked}
                />
            </button>
            <p>{likes - Number(userLikedOnLoad) + Number(userLiked)}</p>
        </div>
        <div title="Vote to Feature this project" class="parent button-text">
            <button class="feature" on:click={vote}>
                <img
                    src="/vote/feature{userVoted ? "" : "_white"}.svg"
                    alt="Vote to Feature"
                    class="button-image"
                    draggable="false"
                    data-activated={userVoted}
                />
            </button>
            <p>
                {votes - Number(userVotedOnLoad) + Number(userVoted)}
            </p>
        </div>
        <div title="Project views" class="parent button-text">
            <button class="view" disabled>
                <img
                    src="/vote/view_white.svg"
                    alt="View Count"
                    class="button-image"
                    draggable="false"
                />
            </button>
            <p>{views}</p>
        </div>
        {#if loggedInAdmin}
            <div>
                <p>
                    <a href="/panel?reject={projectId}" target="_blank">
                        <img
                            src="/notallowed.png"
                            alt="Reject Project"
                            title="Reject Project"
                            height="32"
                        >
                    </a>
                </p>
                <br>
                <p>
                    <a href="/edit?id={projectId}" target="_blank">
                        <img
                            src="/pencil.png"
                            alt="Edit Project"
                            title="Edit Project"
                            height="32"
                        >
                    </a>
                </p>
            </div>
        {/if}
    {:else}
        <LoadingSpinner />
    {/if}
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        position: absolute;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-evenly;
        width: 100%;
        height: 100%;
        left: 0px;
        top: 0px;
    }

    button {
        cursor: pointer;
        border: 0;
        width: 64px;
        height: 64px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        background: transparent;
    }
    button:active:enabled {
        opacity: 0.5;
    }
    button:disabled {
        cursor: not-allowed !important;
    }

    .button-text {
        color: rgba(0, 0, 0, 0.9);
    }
    :global(body.dark-mode) .button-text {
        color: rgba(255, 255, 255, 0.9);
    }
    .button-image {
        width: 100%;
        user-select: none;
        filter: brightness(0);
        opacity: 0.7;
    }
    :global(body.dark-mode) .button-image {
        filter: saturate(0) brightness(255);
    }
    .button-image[data-activated="true"] {
        filter: initial !important;
        opacity: 1 !important;
    }

    img {
        width: 100%;
    }
    p {
        margin-block: 4px;
    }

    .parent {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-weight: bold;
        font-size: 24px;
    }

    /* .like-text {
        color: rgb(255, 106, 200);
    }
    .view-text {
        color: rgb(0, 169, 255);
    }
    .feature-text {
        color: rgb(255, 229, 107);
    } */

    /* .like {
        background: rgba(255, 106, 200, 0.25);
    }
    .view {
        background: rgba(0, 169, 255, 0.25);
    }
    .feature {
        background: rgba(255, 229, 107, 0.25);
    } */
</style>
