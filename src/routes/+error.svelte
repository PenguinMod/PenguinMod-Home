<script>
    import { page } from "$app/stores";

    // Components
    import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
    import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";

    // Icons
    import PenguinConfusedSVG from "../icons/Penguin/confused.svelte";

    let gameIsActive = false;
    const gameAssets = {
        penguin: null,
        brick: null
    };
    const gameState = {
        playerY: 0,
        playerFalling: 0,
        brickX: 500,
        brickY: -200,
        grassX: 0,
        points: 0,
        canIncreasePoints: true,
    };
    const defaultGameState = JSON.parse(JSON.stringify(gameState));
    const gameClick = () => {
        gameState.playerFalling = -5;
    };
    const resetState = () => {
        for (const key of Object.keys(defaultGameState)) {
            gameState[key] = defaultGameState[key];
        }
    };
    const rectTouch = (rect1, rect2) => {
        if (rect1.x + rect1.width < rect2.x || rect2.x + rect2.width < rect1.x) {
            return false;
        }
        if (rect1.y + rect1.height < rect2.y || rect2.y + rect2.height < rect1.y) {
            return false;
        }
        return true;
    };
    const startGame = () => {
        gameIsActive = true;
        setInterval(() => {
            gameState.playerY += gameState.playerFalling;
            if (gameState.playerFalling < 20) {
                gameState.playerFalling += 0.25;
            }
            if (gameState.playerY > 220) {
                resetState();
            }
            if (gameState.playerY < 0) {
                gameState.playerY = 0;
            }
            gameState.grassX -= 3;
            gameState.grassX = gameState.grassX % 400;
            gameState.brickX -= 3;
            // collide
            const playerRect = {
                x: 40,
                y: gameState.playerY,
                width: 33.55,
                height: 25.98
            };
            const brick1Rect = {
                x: gameState.brickX,
                y: gameState.brickY,
                width: 55,
                height: 300
            };
            const brick2Rect = {
                ...brick1Rect,
                y: brick1Rect.y + 400
            };
            const willReset = rectTouch(playerRect, brick1Rect) || rectTouch(playerRect, brick2Rect);
            if (willReset) {
                resetState();
            }
            if (gameState.brickX + 25 < 40 && gameState.canIncreasePoints) {
                gameState.points += 1;
                gameState.canIncreasePoints = false;
            }
            // reset brick if needed
            if (gameState.brickX < -100) {
                gameState.brickX = defaultGameState.brickX;
                gameState.brickY = -160 - (Math.random() * 120); // -160 to -280
                gameState.canIncreasePoints = true;
            }
        }, 1000 / 60);
    };
</script>

<svelte:head>
    <title>PenguinMod - {$page.status}</title>
    <meta name="title" content="PenguinMod - Home" />
    <meta property="og:title" content="PenguinMod - Home" />
    <meta property="twitter:title" content="PenguinMod - Home">
    <meta name="description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="twitter:description" content="The area where featured projects and community stuff & info is shown.">
    <meta property="og:url" content="https://penguinmod.com/">
    <meta property="twitter:url" content="https://penguinmod.com/">
</svelte:head>

<NavigationBar />
<NavigationMargin />

<div class="center-div">
    {#if $page.status === 404}
        {#if !gameIsActive}
            <button class="hidden-button" on:click={startGame} on:keydown={gameClick}>
                <PenguinConfusedSVG height="12rem" />
            </button>
        {:else}
            <button class="game" on:click={gameClick}>
                <p class="game-points" on:click{gameClick}>{gameState.points.toLocaleString()}</p>
                <img
                    src="/secret/pengin.svg"
                    alt="Penguin"
                    class="game-penguin"
                    style="top: {gameState.playerY}px"
                    bind:this={gameAssets.penguin}
                >
                <img
                    src="/secret/floor.png"
                    alt="Grass"
                    style="left: {gameState.grassX}px"
                    class="game-floor"
                >
                <img
                    src="/secret/bricks.png"
                    alt="Brick"
                    style="left: {gameState.brickX}px; top: {gameState.brickY}px;"
                    class="game-bricks"
                >
            </button>
        {/if}
    {:else}
        <PenguinConfusedSVG height="12rem" />
    {/if}

    <h1>Whoops!</h1>
    <p>
        Something's not quite right. Maybe you should <a href="../">go back?</a>
    </p>

    <p>Error: {$page.status} - {$page.error.message}</p>
</div>

<style>
    * {
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }

    .game {
        width: 400px;
        height: 300px;
        margin: 8px;
        padding: 0;
        border: 0;
        position: relative;
        background-image: url('/secret/sky.png');
        overflow: hidden;
    }
    .game-penguin {
        position: absolute;
        left: 40px;
        top: 0;
        transform: scale(0.5);
        transform-origin: left top;
        z-index: 9990;
    }
    .game-floor {
        position: absolute;
        left: 0;
        bottom: -20px;
        z-index: 9998;
    }
    .game-bricks {
        position: absolute;
        z-index: 9997;
    }
    .game-points {
        pointer-events: none;
        font-size: 16px;
        font-weight: bold;
        font-style: italic;
        color: black;
        position: absolute;
        left: 8px;
        top: 8px;
        margin-block: 0;
        z-index: 9999;
    }
    :global(html[dir="rtl"]) .game {
        transform: scaleX(-1);
        transform-origin: center;
    }
    :global(html[dir="rtl"]) .game-points {
        transform: scaleX(-1);
        transform-origin: center;
    }

    .hidden-button {
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;
    }

    .center-div {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    :global(body.dark-mode) {
        color: white;
    }
    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
