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
    let userVotedThisSession = false;

    let loaded = false;
    let loggedIn = null;

    let projectId = 0;

    function vote() {
        if (loggedIn === false) {
            Authentication.authenticate().then((privateCode) => {
                Authentication.usernameFromCode(privateCode)
                    .then((username) => {
                        if (username) {
                            loggedIn = true;
                            vote();
                            return;
                        }
                        loggedIn = false;
                    })
                    .catch(() => {
                        loggedIn = false;
                    });
            });
            return;
        }
        ProjectClient.toggleVoteProject(projectId, "feature")
            .then((featured) => {
                userVoted = featured;
                userVotedThisSession = featured;
            })
            .catch((err) => alert(String(err)));
    }
    function love() {
        if (loggedIn === false) {
            Authentication.authenticate().then((privateCode) => {
                Authentication.usernameFromCode(privateCode)
                    .then((username) => {
                        if (username) {
                            loggedIn = true;
                            love();
                            return;
                        }
                        loggedIn = false;
                    })
                    .catch(() => {
                        loggedIn = false;
                    });
            });
            return;
        }
        ProjectClient.toggleVoteProject(projectId, "love")
            .then((loved) => {
                userLiked = loved;
            })
            .catch((err) => alert(String(err)));
    }

    function updateVoteStates() {
        ProjectClient.getVoteStates(projectId)
            .then((states) => {
                userLiked = states.loved;
                userVoted = states.voted;
                loaded = true;
            })
            .catch(() => {
                userLiked = false;
                userVoted = false;
                userVotedThisSession = false;
                loaded = true;
            });
    }
    onMount(() => {
        const params = new URLSearchParams(location.search);
        const projId = numberCast(params.get("id"));
        projectId = projId;
        const privateCode = localStorage.getItem("PV");
        if (!privateCode) {
            loggedIn = false;
            updateVoteStates();
            return;
        }
        Authentication.usernameFromCode(privateCode)
            .then((username) => {
                if (username) {
                    ProjectClient.setPrivateCode(privateCode);
                    ProjectClient.setUsername(username);
                    updateVoteStates();
                    loggedIn = true;
                    return;
                }
                loggedIn = false;
                updateVoteStates();
            })
            .catch(() => {
                loggedIn = false;
                updateVoteStates();
            });
    });
    onMount(() => {
        const params = new URLSearchParams(location.search);
        const projId = numberCast(params.get("id"));
        projectId = projId;
        ProjectApi.getProjectMeta(projId).then((data) => {
            likes = numberCast(data.likes?.length);
            votes = numberCast(data.votes?.length);
            views = numberCast(data.views);
        });
    });
    Authentication.onAuthentication((privateCode) => {
        ProjectClient.setPrivateCode(privateCode);
        Authentication.usernameFromCode(privateCode).then((username) => {
            if (username) {
                ProjectClient.setUsername(username);
                loggedIn = true;
            }
        });
    });
</script>

<div class="main">
    {#if loaded}
        <div title="Like this project" class="parent like-text">
            <button class="like" on:click={love}>
                <img src="/heart.svg" alt="Like" />
            </button>
            <p>{likes + Number(userLiked)}</p>
        </div>
        <div title="Vote to Feature this project" class="parent feature-text">
            <button class="feature" on:click={vote}>
                <img src="/feature.svg" alt="Vote to Feature" />
            </button>
            <p>
                {votes +
                    (!userVotedThisSession && userVoted
                        ? -1
                        : Number(userVotedThisSession))}
            </p>
        </div>
        <div title="Project views" class="parent view-text">
            <button class="view">
                <img src="/view.svg" alt="View Count" />
            </button>
            <p>{views}</p>
        </div>
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
        border-radius: 12px;
        border: 0;
        cursor: pointer;
        width: 64px;
        height: 64px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
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

    .like-text {
        color: rgb(255, 106, 200);
    }
    .view-text {
        color: rgb(0, 169, 255);
    }
    .feature-text {
        color: rgb(255, 229, 107);
    }

    .like {
        background: rgba(255, 106, 200, 0.25);
    }
    .view {
        background: rgba(0, 169, 255, 0.25);
    }
    .feature {
        background: rgba(255, 229, 107, 0.25);
    }
</style>
