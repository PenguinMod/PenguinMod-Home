import ProjectApi from "./projectapi"

import { PUBLIC_STUDIO_URL } from "$env/static/public";

export default {
    /**
     * PenguinMod's normal page
     */
    base: `${PUBLIC_STUDIO_URL}/`,

    /**
     * PenguinMod's editor page
     */
    editor: `${PUBLIC_STUDIO_URL}/editor.html`,

    /**
     * PenguinMod's credits page
     */
    credits: `${PUBLIC_STUDIO_URL}/credits.html`,
    
    /**
     * PenguinMod's contact page
     */
    contact: `${PUBLIC_STUDIO_URL}/contact.html`,

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
        projects: `${PUBLIC_STUDIO_URL}/PenguinMod-Guidelines/PROJECTS`
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
    packager: `${PUBLIC_STUDIO_URL}/PenguinMod-Packager/`,

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
    basicApi: "https://penguinmod-basic-api.derpygamer2142.com/",

    /**
     * The admin panel for pm projects api
     */
    adminPanel: "https://penguinmod.com/panel"
}
