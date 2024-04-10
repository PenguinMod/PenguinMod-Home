<script>
    // localstorage
    import { browser } from '$app/environment';

    let gameIsActive = false;
    let currentMenu = 'start';
    const gameAssets = {
        penguin: null,
        brick: null
    };
    const constants = {
        floorHeight: 240,
        jumpHeight: 4
    };
    const gameState = {
        playerY: 150,
        playerFalling: 0,
        brickX: 500,
        brickY: -200,
        grassX: 0,
        points: 0,
        rotation: 0,
        mustBeTop: false,
        canIncreasePoints: true,
    };
    let highscore = browser ? (localStorage.getItem("flappypangHighscore") || 0) : 0;
    const defaultGameState = {...gameState};
    let gameButton = null;
    let buttonUninitialized = true;
    const gameClick = () => {
        gameState.playerFalling = -constants.jumpHeight;
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
    const gameStartPressed = () => {
        buttonUninitialized = true;
        currentMenu = 'game';
    }
    const restartGame = () => {
        resetState();
        gameStartPressed();
    }
    const die = () => {
        gameState.mustBeTop = true;
        currentMenu = 'died';
        gameState.playerFalling = -constants.jumpHeight;
        // just incase, push the sprite out of the ground
        gameState.playerY += gameState.playerFalling;
    }
    const openDeathMenu = () => {
        currentMenu = 'death'
    }
    const startGame = () => {
        gameIsActive = true;
        setInterval(() => {
            switch (currentMenu) {
            case 'start':
                gameState.playerY = (Math.sin(Date.now() / 100) * 10) + 100
                break;
            case 'died':
                gameState.playerY += gameState.playerFalling;
                // gravity
                if (gameState.playerFalling < 20) {
                    gameState.playerFalling += 0.25;
                }
                if (gameState.playerY > 300) openDeathMenu();
                break;
            case 'game':
                if (buttonUninitialized) {
                    gameButton.focus();
                    buttonUninitialized = false;
                }
                gameState.playerY += gameState.playerFalling;
                // gravity
                if (gameState.playerFalling < 20) {
                    gameState.playerFalling += 0.25;
                }
                // death
                if (gameState.playerY > constants.floorHeight) {
                    die();
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
                    die();
                }
                if (gameState.brickX + 25 < 40 && gameState.canIncreasePoints) {
                    gameState.points += 1;
                    gameState.canIncreasePoints = false;
                    if (gameState.points > highscore) {
                        highscore = gameState.points;
                        if (browser) {
                            localStorage.setItem("flappypangHighscore", highscore);
                        }
                    }
                }
                // reset brick if needed
                if (gameState.brickX < -100) {
                    gameState.brickX = defaultGameState.brickX;
                    gameState.brickY = -160 - (Math.random() * 120); // -160 to -280
                    gameState.canIncreasePoints = true;
                }
                break;
            }
        }, 1000 / 60);
    };

    $: {
        startGame();
    }
</script>

<button class="game" on:click={gameClick} bind:this={gameButton}>
    {#if currentMenu === 'start'}
        <button class="menuButton" on:click={gameStartPressed}>start game</button>
    {:else if currentMenu === 'death'}
        <img
            src="/secret/penginDead.svg"
            alt="Penguin Deid"
            class="menu-penguin"
            style="margin-bottom: 10px;position: relative;z-index: {gameState.mustBeTop ? 9999 : 9990}"
            bind:this={gameAssets.penguin}
        >
        <br/>
        <button class="menuButton" on:click={restartGame}>restart game</button>
    {:else if currentMenu === 'game'}
        <p class="game-points score-counter">{gameState.points.toLocaleString()}</p>
        <p class="high-score score-counter">highscore<br>{highscore.toLocaleString()}</p>
    {/if}
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
    <img
        src="/secret/pengin{currentMenu === 'died' ? 'Dead' : ''}.svg"
        alt="Penguin"
        class="game-penguin"
        style="top: {gameState.playerY}px; z-index: {gameState.mustBeTop ? 9999 : 9990}"
        bind:this={gameAssets.penguin}
    >
</button>

<style>
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
    }
    .menu-penguin {
        transform: scale(1.5);
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
    
    .score-counter {
        pointer-events: none;
        font-size: 16px;
        font-weight: bold;
        font-style: italic;
        color: black;
        position: absolute;
        margin-block: 0;
        z-index: 9999;
    }

    .game-points {
        font-size: 24px;
        /* center */
        left: 50%;
        top: 10%;
    }

    .high-score {
        right: 8px;
        top: 8px;
    }
    
    :global(html[dir="rtl"]) .game {
        transform: scaleX(-1);
        transform-origin: center;
    }
    :global(html[dir="rtl"]) .high-score,
    :global(html[dir="rtl"]) .menuButton,
    :global(html[dir="rtl"]) .game-points {
        transform: scaleX(-1);
        transform-origin: center;
    }
</style>