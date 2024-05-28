<script>
import { onMount } from "svelte";

// Components
import NavigationBar from "$lib/NavigationBar/NavigationBar.svelte";
import NavigationMargin from "$lib/NavigationBar/NavMargin.svelte";
// translations
import LocalizedText from "$lib/LocalizedText/Node.svelte";
import Language from "../../resources/language.js";

// Static values
import LINK from "../../resources/urls.js";

let currentLang = "en";
onMount(() => {
    Language.forceUpdate();
});
Language.onChange((lang) => {
    currentLang = lang;
});
</script>

<svelte:head>
    <title>PenguinMod - Privacy Policy</title>
    <meta name="title" content="PenguinMod - Privacy Policy" />
    <meta property="og:title" content="PenguinMod - Privacy Policy" />
    <meta property="twitter:title" content="PenguinMod - Privacy Policy">
    <meta name="description" content="The status of your privacy while using PenguinMod.">
    <meta property="twitter:description" content="The status of your privacy while using PenguinMod.">
    <meta property="og:url" content="https://penguinmod.com/privacy">
    <meta property="twitter:url" content="https://penguinmod.com/privacy">
</svelte:head>

<NavigationBar />

<div class="main">
    <NavigationMargin />

    <div class="section-info">
        <h1>Privacy Policy</h1>
    </div>

    <main>
        <!-- UPDATE THIS WHEN MAKING CONTENT CHANGES -->
        <p><i>Updated May 27th, 2024 (Mountain Time)</i></p>

        <!-- some things are intentionally not formatted as they are in the HTML file on the website -->
        <p>
            This document applies to
            <a href="https://penguinmod.com">https://penguinmod.com</a>,
            <a href="https://studio.penguinmod.com">https://studio.penguinmod.com</a>,
            <a href="https://extensions.penguinmod.com">https://extensions.penguinmod.com</a>,
            <a href="https://projects.penguinmod.com">https://projects.penguinmod.com</a>,
            and any other penguinmod.com subdomains.
        </p>
        <p>
            You may see websites such as <a href="https://scratch.mit.edu/">"Scratch"</a>,
            <a href="https://turbowarp.org/">"TurboWarp"</a>, <a href="https://oauth2.scratch-wiki.info/">"Scratch OAuth2"</a>,
            and <a href="https://auth.itinerary.eu.org/">"Scratch Authentication"</a>
            referenced in multiple places.
        </p>
        <p>
            A "Service Administrator", "Admin", "Moderator", "Mod" or "Administrator" is a person who can either
            directly access the server files for PenguinMod,
            or a person who can contact the server host that is able to access the server files and server process.
            "Host" may also refer to the server host of PenguinMod's project sharing.
        </p>
        <p>
            A "Project Moderator" is a person who has the ability to remove projects or content from those projects,
            and reply or send messages to users who had moderation actions happen towards their project or account.
            These users may also be able to edit profile information about another user.
            <br><br>
            These people can contact Administrators aswell, and may have extra permissions such as banning users.
        </p>

        <h2>General</h2>
        <p>
            We may log anonymous aggregated data such as
                how many people use the site,
                how often a feature is used,
                what operating system and browser is used,
                how much user content is on the site,
                and diagnostic information such as cache hit ratios.
        </p>
        <p>
            When using the website, your IP will be logged and stored to your account if you log in.
            This is to help us identify users who may be spamming or attacking the site.
            <br>
            Your IP will also be stored temporarily when viewing a project, along with information about the project you viewed being logged temporarily.
            <br>
            <br>
            This temporary amount of time will be around 1 week, and this applies to all "temporarily stored" content listed here.
        </p>

        <h2>Advertisments</h2>
        <p>
            When advertisements are served on any PenguinMod page, third parties may be placing and reading cookies on your browser,
            or using web beacons to collect information. PenguinMod itself does not do this, and you may be able to find more information here:
        </p>
        <ul>
            <li><a href="https://support.google.com/publisherpolicies/answer/10437794">What we must disclose in our privacy policy</a></li>
            <li><a href="http://www.google.com/policies/privacy/partners/">How Google uses data when you use our partners' sites or apps</a></li>
        </ul>
        
        <h2>Project Sharing & Accounts/Profiles</h2>
        <p>
            Accounts are created and logged into using either a Username and Password, or using one of the OAuth2 login methods.
            These login methods are <a href="https://oauth2.scratch-wiki.info/">"Scratch OAuth2"</a>
            requiring a <a href="https://scratch.mit.edu/">"Scratch"</a> account,
            <a href="https://google.com/">"Google"</a> requiring a "Google" account,
            or <a href="https://github.com/">"GitHub"</a> requiring a "GitHub" account.
        </p>
        <p>When you use the <a href="https://oauth2.scratch-wiki.info/">"Scratch OAuth2"</a>,
            <a href="https://google.com/">"Google"</a>,
            or <a href="https://github.com/">"GitHub"</a>
            login methods, they can access:</p>
            <ul>
                <li>your IP address</li>
                <li>your general location (using your IP address)</li>
                <li>your public account information on their respective platforms
                    (in some cases, emails or other information the login method provides to PenguinMod on authentication)</li>
            </ul>

        <p>
            Accounts created will have their IP and creation date stored with them.
        </p>
        <p>
            Any logins to an account using any login method will also have that IP and login date stored on the account.
            <br>
            PenguinMod may require an email to be attached to an account for certain features or account security.
            <br>
            This will be stored on the account if provided.
        </p>

        <p>
            When using our Services:
        </p>
        <ul>
            <li>any projects uploaded will have their project name logged</li>
            <li>any projects uploaded are publicly viewable (including unapproved or under review projects if you have the URL to them)</li>
            <li>any private profiles or projects are visible to site moderators or admins (or visible to other users depending on the profile's settings)</li>
            <li>any profile info you set (bio/about me, featured project) is publicly viewable to all users (and private profiles are visible to site moderators or admins)</li>
            <li>any projects uploaded can be modified by admins or hosts of the service in any way (project image, project name, project code, etc.)</li>
            <li>any profile info you set can be modified by admins or hosts of the service in any way (profile about me, etc.)</li>
            <li>any projects, accounts, or content created on the platform may be logged when deemed neccessary</li>
        </ul>
        <p>
            Uploaded projects will be publicly visible to all users on the website.
            Any user may report a project or report another user to Project Moderators if they believe the
            <a href="https://penguinmod.com/guidelines/uploading">Uploading Guidelines</a> have been violated.
        </p>
            Project Information available to users, Project Moderators and Service Administrators include:
            <ul>
                <li>the project name, project instructions & notes, project thumbnail, project data, uploader's username, and uploader's profile picture for any project</li>
                <li>the date any project was uploaded, updated or featured</li>
                <li>the likes, votes, favorites and views attached to that project</li>
                <li>whether or not the project has been updated</li>
                <li>any other internal information about the project</li>
                <li>the uploader's <a href="https://scratch.mit.edu/">Scratch</a> account (if they used it to create the account or use information from it)</li>
                <li>the uploader's <a href="https://github.com/">GitHub</a> account (if they used it to create the account or use information from it)</li>
            </ul>
            Information available only to Project Moderators and Service Administrators include:
            <ul>
                <li>the date a project was removed</li>
                <li>the date, contents, and type of any moderator message or response to a moderator message</li>
                <li>any above information users can access</li>
            </ul>
            Information available only to Service Administrators include:
            <ul>
                <li>the indiviudal users who liked, favorited or voted a project</li>
                <li>the IP of users who viewed a project
                <li>any above information users or Project Moderators can access</li>
                <li>the uploader's <a href="https://google.com/">Google</a> account (if the account has it as a login method)</li>
                <li>the uploader's <a href="https://github.com/">GitHub</a> account (if the account has it as a login method)</li>
                <li>the uploader's <a href="https://scratch.mit.edu/">Scratch</a> account (if the account has it as a login method)</li>
            </ul>
        <p>
            Your IP will temporarily be saved in the server when you view a project.
            This is used to make sure you are not the same user reloading the page to gain multiple views.
        </p>
        <p>Account information may be logged or saved to the server when interacting with a project.</p>
        <p>This information is used to save liked, favorited, or voted projects for users and also to debug any issues present in the server.</p>

        <h2>Third Parties</h2>
        <p>When uploading a project, getting a project "featured", or having a project deleted by a moderator,
            information about the project and account's public information will be sent to the third-party site <a href="https://discord.com/">"Discord"</a>.
        </p>
        <p>The purpose of this logging is for site moderators to easily find
            projects that violate the <a href="https://penguinmod.com/guidelines/uploading">Uploading Guidelines</a>
            or see any previous actions other moderators have done to a project.
        </p>
        <p>The purpose of logging "featured" projects is to allow users to view projects other users may enjoy or like.</p>
        <p>When an account is banned, has punishments placed on it, or gets it's information updated by a moderator, information about the
            account will be sent to the third-party site <a href="https://discord.com/">"Discord"</a>.
        </p>
        <p>When an account sends a message to a moderator, receives a message from a moderator or uses language not appropriate for PenguinMod on the platform,
            account will be sent to the third-party site <a href="https://discord.com/">"Discord"</a>.
        </p>
        <p>The purpose of this logging is for site moderators to handle or respond to users that may have violated PenguinMod's
            <a href="https://penguinmod.com/terms">Terms of Service</a>.
        </p>
        <p>Information about accounts, projects, or other content on the platform may be sent to the third-party site <a href="https://discord.com/">"Discord"</a>
        for any reason that deems it neccessary.
        </p>
        
        <h2>Other services</h2>
        <p>When using cloud variables, the project ID and your username may be logged for up to 14 days.</p>
        <p>Your randomly generated or chosen username is stored in your browser's local storage. To mitigate the potential to track users with this feature, all randomly generated usernames are anonymized before the server receives them. However, usernames explicitly set by a user may be logged to help prevent abuse.</p>
        <p>If a user is logged into PenguinMod, their username used by Cloud Variables, other extensions, and the editor "username" block will be set to their PenguinMod account's username.</p>
        <p>Built-in Scratch extensions that require Wi-Fi (such as Translate, Text to Speech, LEGO, micro:bit, etc.) may connect to the Scratch API to implement these features. <a href="https://scratch.mit.edu/privacy_policy/">Refer to the Scratch privacy policy for more information</a>. The Translate extension may instead make requests to a TurboWarp API, which may then forward your request to the Scratch API and log the message being translated and the result for caching and performance.</p>
        <p>In rare circumstances, connections that are appear to be spam may have their IP logged for up to 24 hours. This happens very infrequently and only in cases of extreme abuse.</p>
        <p>
            Built-in PenguinMod and Custom extensions that require Wi-Fi or use Wi-Fi to get online data (HTTP, Website Requests, Sound Systems, CloudLink, HTML iframes, Storage, etc.) may connect to any user-specified API, which will grant the owner of the website being connected to:
        </p>
        <ul>
            <li>your full IP address (and possibly general location using your IP address)</li>
            <li>the ability to show or display anything (if the extension is showing the info returned to the user)</li>
            <li>any other things public APIs can do or access</li>
        </ul>
        <p>This document does not apply to third-parties, including other users or bots connected to cloud variables, links to external websites, custom extensions, or some advanced URL parameters.</p>

        <h2>Editor extensions</h2>
        <h3>Core - HTML iframes (referred to as "iframes" here)</h3>
        <p>
            "iframes" may connect to user-specified websites. These websites may be allowed to access:
        </p>
            <ul>
                <li>your IP address</li>
                <li>your general location (using your IP address)</li>
                <li>any web API</li>
            </ul>
        <p>
            The websites specified may also display any content, however PenguinMod will attempt to automatically scan the website
            for any potential viruses or vulnerabilities. Major adult websites are also blocked, and most others are blocked aswell.
        </p>
        <p>
            PenguinMod does not allow projects uploaded to only display content from other websites.
            Uploaded projects must contain content of their own, and certain websites may cause the uploaded project to be deleted or rejected.
        </p>
        <h3>Core - Scratch Authentication (referred to as "Scratch Auth Extension" here)</h3>
        <p>
            The "Scratch Auth Extension" will connect to <a href="https://auth.itinerary.eu.org/">Scratch Auth</a> for Log-In. Scratch Auth can access:
            </p>
            <ul>
                <li>your IP address</li>
                <li>your general location (using your IP address)</li>
                <li>your public <a href="https://scratch.mit.edu/">Scratch</a> Account information</li>
            </ul>
            <p>
            The "Scratch Auth Extension" also allows your public Scratch account information to be accessible to the PenguinMod project,
            however other tools, extensions or APIs are required to get information past your Scratch username.
        </p>
        <h3>User-submitted (G1nX) - Better Storage</h3>
        <p>
            Better Storage will connect to <a href="https://auth.itinerary.eu.org/">Scratch Auth</a> for Log-In. Scratch Auth can access:</p>
            <ul>
                <li>your IP address</li>
                <li>your general location (using your IP address)</li>
                <li>your public <a href="https://scratch.mit.edu/">Scratch</a> Account information</li>
            </ul>
            <p>
            Better Storage can also access any info that Scratch Auth can.
            The owner of Better Storage may also view any saved data using their keys for security and safety.
        </p>
        <h3>User-submitted (MubiLop) - PenguinGPT</h3>
        <p>
            PenguinGPT will connect to <a href="https://reverse.mubi.tech/">reverse.mubi.tech</a> by default for AI communication. This site can access:</p>
            <ul>
                <li>your IP address</li>
                <li>your general location (using your IP address)</li>
                <li>any prompt or responses given to any AI on the site</li>
                <li>any prompt or responses from any AI on the site</li>
                <li>any images from any AI on the site</li>
            </ul>
            <p>
            The owner of PenguinGPT logs and reads this information for security and preventing malicious attacks.
        </p>
        <h3>User-submitted (RubyDevs) - TurboWeather</h3>
        <p>
            TurboWeather uses Browser APIs to geolocate the user.
            <br>
            PenguinMod will ask the user to confirm this action before the extension attempts to do this.
            <br>
            <br>
            PenguinMod will not ask the user to confirm this action if the project is compiled using
            <a href="https://studio.penguinmod.com/PenguinMod-Packager/">the PenguinMod packager.</a>
            <br>
            In this case it is up to the user's browser to prompt the user if they would like to allow the website
            to access their location.
        </p>
        <p>
            The Ruby Developer team promises that they do not store or keep your location data in any way when using the extension.
            <br>
            TurboWeather does however connect to third-party services to get user information that may store your info:
        </p>
        <ul>
            <li><a href="https://open-meteo.com/en/terms">OpenMeteo - Terms of Service</a></li>
            <li><a href="https://osmfoundation.org/wiki/Privacy_Policy">OpenStreetMap - Privacy Policy</a></li>
        </ul>
        <p>
            When using the extension, third-party services may be able to access:</p>
            <ul>
                <li>your IP address</li>
                <li>your general location</li>
                <li>info about your location (weather, temperature)</li>
            </ul>
            <p>
            TurboWeather does make efforts to avoid returning private info, such as:
        </p>
        <ul>
            <li>latitude and longitude</li>
            <li>specifically chosen or user coordinates (provided for geolocation)</li>
            <li>any other info returned by the third-party services that may be used to find the user in real life</li>
        </ul>

        <h2>Contact</h2>

        <p>Email us at <a href="mailto:penguinmodhelp@gmail.com">penguinmodhelp@gmail.com</a></p>
        <p>Join <a href="https://discord.gg/NZ9MBMYTZh">our Discord Server</a></p>
    </main>
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

    main {
        margin: 0 20%;
        width: 60%;
    }

    .section-info {
        background: #00c3ffad;
        height: 12rem;
        color: white;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        margin: 0;
    }
    .section-info h1 {
        margin-block: 0;
        margin-left: 32px;
    }

    :global(body.dark-mode) a {
        color: dodgerblue;
    }
</style>
