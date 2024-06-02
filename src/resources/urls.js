import ProjectApi from "./projectapi"

export default {
    /**
     * PenguinMod's normal page
     */
    base: "https://studio.penguinmod.com/",

    /**
     * PenguinMod's editor page
     */
    editor: "https://studio.penguinmod.com/editor.html",

    /**
     * PenguinMod's credits page
     */
    credits: "https://studio.penguinmod.com/credits.html",

    /**
     * PenguinMod's terms of service page
     */
    terms: "/terms",

    /**
     * PenguinMod's privacy policy page
     */
    privacy: "/privacy",

    /**
     * PenguinMod's guideline pages for services
     */
    guidelines: {
        /**
         * PenguinMod's project uploading guidelines
         */
        projects: "https://studio.penguinmod.com/PenguinMod-Guidelines/PROJECTS"
    },

    /**
     * Donation pages for sites
     */
    donate: {
        scratch: "https://www.scratchfoundation.org/donate",
        turbowarp: "https://github.com/sponsors/GarboMuffin"
    },

    /**
     * PenguinMod's project page
     */
    projects: `${ProjectApi.OriginApiUrl}/`,

    /**
     * PenguinMod's my stuff page
     */
    mystuff: `${ProjectApi.OriginApiUrl}/mystuff`,

    /**
     * PenguinMod's home page
     */
    home: "https://penguinmod.com/",

    /**
     * PenguinMod's packager page
     */
    packager: "https://studio.penguinmod.com/PenguinMod-Packager/",

    /**
     * PenguinMod's unofficial wiki
     */
    wiki: "https://wiki.penguinmod.com/wiki/Main_Page",

    /**
     * PenguinMod's Discord invite
     */
    discord: "https://discord.gg/NZ9MBMYTZh",

    /**
     * Scratch's website
     */
    scratch: "https://scratch.mit.edu",

    /**
     * TurboWarp's website
     */
    turbowarp: "https://turbowarp.org",

    /**
     * PenguinMod's github page
     */
    github: "https://github.com/PenguinMod/",

    /**
     * PenguinMod's basic API
     */
    basicApi: "https://basic-api.penguinmod.com/",

    /**
     * The admin panel for pm projects api
     */
    adminPanel: "https://penguinmod.com/panel"
}
