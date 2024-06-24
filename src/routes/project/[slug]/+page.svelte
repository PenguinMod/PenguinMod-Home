<script>
    import { onMount } from "svelte";

    import { PUBLIC_API_URL, PUBLIC_STUDIO_URL } from "$env/static/public";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";

	/** @type {import('./$types').PageData} */
	export let data;
    let meta = data.meta;

    const xmlEscape = function (unsafe) {
        return unsafe.replace(/[<>&'"]/g, c => {
            switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            }
        });
    };
    const formatEmojis = (_title) => {
        const title = xmlEscape(String(_title));
        const emojiRegex = /:(\w+):/g;
        return title.replace(emojiRegex, (match) => {
            const emojiName = match.replace(/\:/gmi, "");
            return `<img
                src="https://library.penguinmod.com/files/emojis/${emojiName}.png"
                alt=":${emojiName}:"
                title=":${emojiName}:"
                style="width:1em;vertical-align: middle;"
            >`;
        });
    };
</script>

<svelte:head>
    <title>PenguinMod - {meta.title}</title>
    <meta name="title" content="PenguinMod - {meta.title}" />
    <meta property="og:title" content="PenguinMod - {meta.title}" />
    <meta property="twitter:title" content="PenguinMod - {meta.title}">
    <meta property="og:url" content="https://penguinmod.com/project/{meta.id}">
    <meta property="twitter:url" content="https://penguinmod.com/project/{meta.id}">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />
    <main>
        <div class="namebar">
            <img
                src="{PUBLIC_API_URL}/api/v1/users/getpfp?username={meta.author.username}&reload=false"
                alt="{meta.author.username}"
                draggable="false"
                onclick="window.open('/profile?user={meta.author.username}')"
            />
            <div class="details">
                <span class="title">{@html formatEmojis(meta.title)}</span>
                <span class="author">by {meta.author.username}</span>
            </div>
        </div>
        <div class="enter">
            <img
                src="{PUBLIC_API_URL}/api/v1/projects/getproject?projectID={meta.id}&requestType=thumbnail"
                alt="{meta.title}"
                onclick="window.open('{PUBLIC_STUDIO_URL}/#{meta.id}')"
            />
            <div class="play" />
        </div>
        <div class="horizflex">
            <div class="desc">
                {#if meta.instructions || meta.credits}
                    {#if meta.instructions}
                        <b>Instructions</b><br>
                        <p>{@html formatEmojis(meta.instructions)}</p>
                    {/if}
                    {#if meta.credits}
                        <b>Credits</b><br>
                        <p>{@html formatEmojis(meta.credits)}</p>
                    {/if}
                {:else}
                    No description provided.
                {/if}
            </div>
            <div class="ratings">
                <div class="rating love">
                    {meta.loves}
                </div>
                <div class="rating vote">
                    {meta.votes}
                </div>
                <div class="rating views">
                    {meta.views}
                </div>
            </div>
        </div>
    </main>
</div>

<style lang="scss">
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .main {
        width: 75%;
        min-width: 640px;
        max-width: 1280px;
        margin: auto; 
    }

    .enter {
        width: 100%;
        height: 70vh;
        border-radius: 8px;
        margin: 16px 0px;
        cursor: pointer;

        & > img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            background-color: #fff;
            border: 4px solid var(--penguinmod-color);
            border-radius: 8px;
            box-sizing: border-box;
        
            &:hover {
                filter: blur(16px);
                opacity: 0.7;
            }
            transition: 0.5s;
        }

        & > .play {
            display: inline-block;
            position: absolute;
            width: 96px;
            height: 96px;
            padding: 16px;
            top: calc(50% - 64px);
            left: calc(50% - 64px);
            border: 4px #0bf8 solid;
            background: url("/stage_controls/gradient/flag.svg");
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 100%;
            z-index: 2;
            opacity: 0;
            filter: blur(32px);
            transition: 0.5s;
            pointer-events: none;
        } 
        &:hover > .play {
            opacity: 1;
            filter: none;
        }
    }  

    .namebar {
        height: 64px;
        display: flex;
        gap: 8px;

        & > img {
            height: 64px;
            border-radius: 8px;
            cursor: pointer;
        }

        & > .details {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            width: calc(100% - 72px);

            & > .title {
                font-size: 28px;
                font-weight: bold;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            & > .author {
                opacity: 0.7;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    .horizflex {
        display: flex;
        justify-content: space-between;
    }

    .ratings {
        display: flex;
        gap: 32px;

        & > .rating {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 96px;
            height: 64px;
            border-radius: 24px;
            background-color: #888;
            border: 1px solid #0004;
            box-sizing: border-box;
            font-size: 20px;
            font-weight: bold;

            &.love {
                background-color: #ff639c;
            }
            &.vote {
                background-color: #ffc163;
            }
            &.views {
                background-color: #63cbff;
            }
        }
    }

    .desc {
        border: 1px solid #b9d6ff;
        background-color: #dbebff;
        padding: 8px;
        border-radius: 8px;
        width: calc(100% - 384px)
    }

    :global(body.dark-mode) {
        & .ratings {
            & > .rating {
                border-color: #fff4;

                &.love {
                    background-color: #d23a71;
                }
                &.vote {
                    background-color: #e7ac2d;
                }
                &.views {
                    background-color: #3391df;
                }
            }
        }

        & .desc {
            border-color: #203652;
            background-color: #16202c;
        }
    }
</style>