<script>
  import { onMount } from "svelte";
  import { Confetti } from "svelte-confetti";

  // Components
  import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
  import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
  import Button from "$lib/Button/Button.svelte";
  // translations
  import LocalizedText from "$lib/LocalizedText/Node.svelte";
  import Language from "../../resources/language.js";
  import TranslationHandler from "../../resources/translations.js";

  let currentLang = "en";
  onMount(() => {
    Language.forceUpdate();
  });
  Language.onChange((lang) => {
    currentLang = lang;
  });
</script>

<svelte:head>
  <title>PenguinMod - Thanks for donating!</title>
  <meta name="title" content="PenguinMod - Thanks for donating!" />
  <meta property="og:title" content="PenguinMod - Thanks for donating!" />
  <meta property="twitter:title" content="PenguinMod - Thanks for donating!" />
  <meta
    name="description"
    content="Help support PenguinMod and it's development!"
  />
  <meta
    property="twitter:description"
    content="Help support PenguinMod and it's development!"
  />
  <meta property="og:url" content="https://penguinmod.com/donate" />
  <meta property="twitter:url" content="https://penguinmod.com/donate" />
</svelte:head>

<NavigationBar />

<div class="confetti-wrapper">
  <Confetti
    x={[-5, 5]}
    y={[0, 0.1]}
    infinite
    duration="6000"
    amount="100"
    size="15"
    fallDistance="120vh"
  />
</div>

<div class="main">
  <NavigationMargin />

  <div class="section-info">
    <h1 style="margin-block: 0;">
      <LocalizedText
          text="Thanks for donating! ✨"
          key="donated.title"
          lang={currentLang}
      />
    </h1>
  </div>

  <div style="height: 16px;" />

  <div class="section-content">
    <p>
      <LocalizedText
          text="We hope you continue to support PenguinMod, even if it's not with money but by sharing and using our service!"
          key="donated.subtitle"
          lang={currentLang}
      />
    </p>
    <div class="pengfetti-wrapper">
      <Confetti
        amount="200"
        size="30"
        x={[-15, 15]}
        y={[-15, 15]}
        noGravity
        duration="6000"
        fallDistance="100vh"
        colorArray={["url(/badges/donator.png)"]}
      />
    </div>
    <img src="/penguins/cheer.svg" alt="Cheering" class="thank-you" />
    <div class="card">
        <h2 style="text-align:center;">
          <LocalizedText
              text="Want some donator perks?"
              key="donated.perks"
              lang={currentLang}
          />
        </h2>
        <p style="text-align:center;">
          <i>
            {@html String(TranslationHandler.text(
              "donated.perks.howto",
              currentLang
            ) || TranslationHandler.text(
              "donated.perks.howto",
              'en'
            )).replace('{{EMAIL}}', `<a href="mailto:penguinmodhelp@gmail.com">penguinmodhelp@gmail.com</a>`)}
          </i>
        </p>
    </div>
    <div style="height: 32px;" />
    <p>
      <LocalizedText
          text="Your donation can help us fund PenguinMod's server and domain!"
          key="donated.location"
          lang={currentLang}
      />
      <br />
      <b>
        <LocalizedText
            text="Thanks for supporting us! 😄"
            key="donated.thanks"
            lang={currentLang}
        />
      </b>
    </p>
    <div style="height: 8px;" />
    <Button link="/donate">
      <LocalizedText
          text="Back"
          key="generic.back"
          lang={currentLang}
      />
    </Button>
  </div>
</div>

<style>
  * {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  }

  .main {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 100%;
    min-width: 1000px;
  }
  .card {
    padding: 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.26);
  }
  :global(body.dark-mode) .card {
    border-color: rgba(255, 255, 255, 0.25);
  }

  .section-info {
    background: #00c3ffad;
    height: 12rem;
    color: white;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 0;
  }
  .section-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .confetti-wrapper {
    position: fixed;
    top: -50px;
    left: 0;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    overflow: hidden;
    pointer-events: none;
  }
  .pengfetti-wrapper {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    pointer-events: none;
  }

  @keyframes bouncy {
    0% {
      left: 0px;
      top: 0px;
      transform: rotate(0deg);
      animation-timing-function: ease-out;
    }
    25% {
      left: 20px;
      top: -30px;
      transform: rotate(10deg);
      animation-timing-function: ease-in;
    }
    50% {
      left: 0;
      top: 0;
      transform: rotate(0deg);
      animation-timing-function: ease-out;
    }
    75% {
      left: -20px;
      top: -30px;
      transform: rotate(-10deg);
      animation-timing-function: ease-in;
    }
    100% {
      left: 0px;
      top: 0px;
      transform: rotate(0deg);
    }
  }

  .thank-you {
    height: 12em;
    padding-top: 1rem;
    position: relative;
    animation-name: bouncy;
    animation-duration: 1s;
    animation-iteration-count: infinite;
  }
</style>
