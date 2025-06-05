<script>
    import { createEventDispatcher } from "svelte";
    
    const dispatch = createEventDispatcher();

    function event(arg) {
        dispatch("select", arg);
    }
</script>

<div style="display:flex;flex-direction:column;align-items: flex-start;">
    <details><summary>Project Uploading</summary>
        <button on:click={() => event("Your project was removed because you uploaded a blank or empty project. Your account is not in any trouble though—we just remove blank projects to reduce spam.")}>
        Blank Project</button>
        <button on:click={() => event("Your project was removed because it appears to be the same as a previously uploaded project. Please use the “Update” button instead.")}>
        Duplicate Project / Spam Uploading</button>
        <button on:click={() => event("Your project was removed because it only works outside of PenguinMod. Please upload it to the correct site instead. Projects must be functional on PenguinMod.")}>
        Doesn't Work on PenguinMod</button>
        <button on:click={() => event("Your project was removed because its main purpose was to display a different website through an iframe. Projects should not just act as browsers.")}>
        Iframe-Browser Project</button>
        <button on:click={() => event("Your project was removed because it appears to be reuploaded from Scratch without clear permission from the original creator. Reuploads must include proof of permission in the notes.")}>
        Scratch Reupload (No Permission)</button>
        <button on:click={() => event("Your project was removed because it disables or breaks access to parts of the PenguinMod editor. Please read the uploading guidelines for more information.")}>
        Breaks or Disables Aspects of the Site</button>
    </details>

    <details><summary>Credit & Ownership</summary>
        <button on:click={() => event("Your project was removed because it uses someone else's work without giving them proper credit in the notes. “Credit to all” is not enough—please list names specifically if possible.")}>
        Missing Credit</button>
    </details>

    <details><summary>Respect & Safety</summary>
        <button on:click={() => event("Your project was removed for including content that could be considered harassment, bullying, or intimidation. Please be respectful to all users.")}>
        Harassment or Bullying</button>
        <button on:click={() => event("Your project was removed because it contained disrespectful or inappropriate language. Please avoid using slurs or hate speech of any kind.")}>
        Derogatory Language or Slurs</button>
        <button on:click={() => event("Your project was removed because it discriminates to a certain group or groups. PenguinMod would like to stay inclusive of all groups on our platform, and we may punish your account for breaking this guideline.")}>
        Discriminatory Content</button>
        <button on:click={() => event("Your project was removed for referencing or promoting violence, self-harm, or other dangerous behaviors. Projects that contain this kind of content are not allowed on PenguinMod.")}>
        Violence or Harmful Behavior</button>
        <button on:click={() => event("Your project was removed because it threatens other users or a group of people. PenguinMod does not allow this behavior, and we may punish your account if severe enough.")}>
        Threat</button>
        <button on:click={() => event("Your project was removed for making light of a real-world event that harmed others. Please do not reference real-world tragedies.")}>
        Sensitive Real-World Events</button>
    </details>

    <details><summary>Audio & Visual Content</summary>
        <button on:click={() => event("Your project was removed because it contained loud or disruptive audio without a warning screen. Please keep loud sounds under one second or add a clear warning that requires interaction.")}>
        Loud or Disruptive Audio</button>
    </details>

    <details><summary>Sensitive & Inappropriate Content</summary>
        <button data-serious on:click={() => event("Your project was removed because it included or referenced sexual content, which is not allowed on PenguinMod.")}>
        Sexual Content or References</button>
        <button data-serious on:click={() => event("Your project was removed due to excessive or realistic depictions of blood or gore. Your account will be banned as this is a serious offense.")}>
        Excessive or Realistic Gore</button>
        <button data-serious on:click={() => event("Your project was removed because it contained disturbing content not appropriate for PenguinMod. These types of projects are not permitted.")}>
        Disturbing/Fetish Themes</button>
        <button on:click={() => event("Your project was removed because it contained romantic or dating-related content, which is not allowed for safety reasons. Read the uploading guidelines for more information.")}>
        Online Dating / Romantic Content</button>
        <button on:click={() => event("Your project was removed because it showed or encouraged drug use, alcohol, or vaping. This content is not allowed even in a comedic or fictional context.")}>
        Drug/Alcohol References</button>
    </details>

    <details><summary>Privacy & Security</summary>
        <button on:click={() => event("Your project was removed because it shared personal information like your name, age, or location. Please don't share this to help keep you safe.")}>
        Personal Information (Yourself)</button>
        <button on:click={() => event("Your project was removed for sharing private or personal information about someone else. This is a serious violation and could result in a ban.")}>
        Personal Information (Others)</button>
        <button on:click={() => event("Your project was removed because it may have linked to or encouraged downloading unsafe or malicious material. This is not allowed and could result in a ban.")}>
        Malicious or Dangerous Links/Files</button>
        <button on:click={() => event("Your project was removed because it either abuses blocks to act like malware, or shares malware in any way. Your account may be punished if this is severe.")}>
        Malware</button>
    </details>

    <details><summary>Chat & User-Generated Content</summary>
        <button on:click={() => event("Your project was removed because projects containing online chat with custom messages are no longer allowed. This rule is in place to help keep users safe.")}>
        Chatroom Project</button>
        <button on:click={() => event("Your project was removed because it allows users to view/upload user-generated content. This is not allowed because PenguinMod cannot moderate this content.")}>
        User-Generated Content</button>
    </details>

    <details><summary>Policy & Platform Use</summary>
        <button on:click={() => event("Your project was removed because it links to a platform that is not safe for PenguinMod to share. Please link to another source or remove inappropriate links.")}>
        Misuse of an External Platform</button>
        <button on:click={() => event("Your project was removed because it contains a link or references a platform with either offensive, extreme, sexual or unsafe content. Please remove these references from your project.")}>
        References an Unsafe External Platform</button>
        <button on:click={() => event("Your project was removed because you are attempting to sell products through it without using one of the services specified in the Uploading Guidelines. We fully respect that you are trying to profit, but we want to be sure our users are not being scammed and receive the promised product.")}>
        Attempts to Sell an Untrusted Product</button>
        <button on:click={() => event("Your project was removed as it promotes political ideologies, parties, candidates, or causes. PenguinMod is not a platform for primarily political projects or messages. Please read the uploading guidelines for more information.")}>
        Political Project</button>
        <button on:click={() => event("Your project was removed because it included profanity in its title, instructions, notes, or thumbnail. Please keep explicit language out of those areas.")}>
        Profanity in Title/Notes</button>
        <button on:click={() => event("Your project was removed for using content you don't appear to have rights to (e.g., music, logos, or code). Please only use content you have permission for.")}>
        Copyright Violation</button>
        <button on:click={() => event("Your project was removed for encouraging others to break PenguinMod rules or exploit the system. Your account may be punished.")}>
        Encouraging Rule-Breaking or Exploits</button>
        <button on:click={() => event("Your project was removed because it contains or enables downloading of stolen copyrighted or paid content. This is a serious offense and you may get your account banned or limited.")}>
        Pirating Paid Music, Video or Other Media</button>
    </details>

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
