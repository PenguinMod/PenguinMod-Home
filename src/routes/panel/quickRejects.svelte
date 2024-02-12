<script>
    import { createEventDispatcher } from "svelte";
    
    const dispatch = createEventDispatcher();

    function event(arg) {
        dispatch("select", arg);
    }
</script>

<div style="display:flex;flex-direction:column;align-items: flex-start;">
    <details><summary>Spam</summary>
        <button on:click={() => event("Your project was removed because you uploaded a blank project. Your account is not in any trouble though, we just remove blank projects to reduce spam.")}>
        No content / Default project</button>
        <button on:click={() => event("Your project was removed because you uploaded a project that is the same as one you have published before. Please update the original project instead in your My Stuff page.")}>
        Repost</button>
        <button on:click={() => event("Your project was removed because it is the exact same as your previously removed project. Please remove any material that broke the Project Uploading Guidelines, or if you believe the project did not break the guidelines, please reply to the original message with your reason.")}>
        Repost after Rejection</button>
        <button on:click={() => event("Your project has been removed because it is based around showing content from another website that you did not create. These types of projects are banned in the \"Base requirements for a project\" section of the uploading rules.")}>
        Based around external site content</button>
        <button on:click={() => event("Your project has been removed because it is only an iframe. We do not allow projects that are only iframes on penguinmod. Read the project uploading guidelines for more information.")}>
        Iframe only</button>
    </details>
    <button on:click={() => event("Your project was removed because it disables or breaks access to parts of the PenguinMod editor.")}>
    Breaks or disables aspects of the site</button>
    <button on:click={() => event("Your project was removed because it contains sensitive information of either you or another person. We remove these types of projects to protect the people included, so please be careful with what information you share in your project.")}>
    Sensitive Information</button>
    <details><summary>Unsafe platforms / words</summary>
        <button on:click={() => event("Your project was removed because it links to a platform that is not safe for PenguinMod to share. Please link to another source or remove inappropriate links.")}>
        Misuse of an external platform</button>
        <button on:click={() => event("Your project was removed because it contains a link or references a platform with either offensive, extreme, sexual or unsafe content. Please remove these references from your project.")}>
        References unsafe external platform</button>
        <button on:click={() => event("Your project was removed because it contains slurs or bypassed slurs. These words are not allowed on our platform, and you may receive punishment.")}>
        Slurs</button>
    </details>
    <details><summary>Offensive / Extreme Content</summary>
        <button on:click={() => event("Your project was removed because it contains realistic or extreme amounts of gore (Shows real or realistic blood, guts or death). Keep in mind that PenguinMod is available for users under 13, do not use PenguinMod as a facet to upload inappropriate content to.")}>
        Gore (Not real-life, but too realistic/extreme)</button>
        <button on:click={() => event("Your project was removed because it contains references to drug and/or otherwise illegal material. Please do not use PenguinMod as a facet to upload illegal content, and we may involve authorities if severe enough.")}>
        Drugs / Illegal material</button>
        <button on:click={() => event("Your project was removed because it contains sexual, explicit or disturbing content not safe for users under 18. Keep in mind that PenguinMod wants to be available for all ages and we will punish users who use PenguinMod as a facet to upload inappropriate content.")}>
        Pornography / Disturbing / Sexual or explicit content</button>
        <button on:click={() => event("Your project was removed because it contains explicit or disturbing content not safe for all ages. Keep in mind that PenguinMod wants to be available for all ages and we will punish users who use PenguinMod as a facet to upload inappropriate content.")}>
        Pornography: Inflation / Vore / Fetish content</button>
        <button on:click={() => event("Your project was removed because it discriminates to a certain group or groups. PenguinMod would like to stay inclusive of all groups on our platform, and we may punish your account for breaking this guideline.")}>
        Discriminatory Content</button>
        <button on:click={() => event("Your project was removed because it threatens other users or a group of people. PenguinMod does not allow this behavior, and we may punish your account if severe enough.")}>
        Threat</button>
        <button on:click={() => event("Your project was removed because it either abuses blocks to act like malware, or shares malware in any way. Your account may be punished if this is severe.")}>
        Malware</button>
        <button data-serious on:click={() => event("Your project was removed because it contains extreme amounts of gore/blood, or death. Your account will be banned as this is a serious offense.")}>
        Gore (Real-life, animals or humans)</button>
        <button data-serious on:click={() => event("Your project was removed because it contains sexual, explicit or disturbing content that includes minors, or otherwise children. Your account will be banned as this is a serious offense, and authorities may be involved.")}>
        Pornography / Disturbing: Minors / Children</button>
    </details>
    <button on:click={() => event("Your project was removed because you are attempting to sell products through it without using one of the services specified in the Uploading Guidelines. We fully respect that you are trying to profit, but we want to be sure our users are not being scammed and receive the promised product.")}>
    Attempts to sell an untrusted product</button>
    <button on:click={() => event("Your project was removed because it contains loud sounds above the boundary in the sound editor. You must place a loud sound warning either as a warning screen or remove the loud sounds entirely.")}>
    Contains loud sounds</button>
    <button on:click={() => event("Your project was removed because it contains or enables downloading of stolen copyrighted or paid content. This is a serious offense and you may get your account banned or limited.")}>
    Pirating paid music, video or other media</button>
</div>

<style>
    details {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    details[open] {
        border-left: 1px solid black;
    }
    :global(body.dark-mode) details[open] {
        border-left: 1px solid white;
    }
    button {
        padding: 8px;
        font-size: large;
    }
    button[data-serious] {
        background-color: rgb(255, 114, 114);
    }

    details,
    button {
        margin: 4px 0;
        margin-left: 16px;
    }
</style>