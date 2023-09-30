const data = {
    "Spam": {
        "No content / Default project": "Your project was rejected because you uploaded a project with content that either does nothing or is not there. PenguinMod only approves projects with actual block code or art you drew.",
        "Repost": "Your project was rejected because you uploaded a project that is the same as one you have published before. Please update the original project instead in your My Stuff page.",
        "Repost after Rejection": "Your project was rejected because it is the exact same as your previously rejected project. Please remove any material that broke the Project Uploading Guidelines, or if you believe the project did not break the guidelines, please reply to the original message with your reason.",
        "Remix is an exact copy": "Your remix was rejected because it adds little to no new content or changes to the project. Please only remix a project if you are going to make changes to the project.",
    },
    "Scratch Reupload": "Your project was rejected because it is the same as the version you uploaded to Scratch. Please add more content or plan to add some unique features to PenguinMod.",
    "Breaks or disables aspects of the site": "Your project was rejected because it disables or breaks access to parts of the page. This can be abused to force the user to do or watch something, so your project has been removed.",
    "Sensitive Information": "Your project was rejected because it contains sensitive information of either you or another person. We reject these types of projects to protect the people included, so please be careful with what information you share in your project.",
    "Be respectful to others": {
        "Misuse of an external platform": "Your project was rejected because it links to a platform that is not safe for PenguinMod to share. Please link to another source or remove inappropriate links.",
        "References unsafe external platform": "Your project was rejected because it contains a link or references a platform with either offensive, extreme, sexual or unsafe content. Please remove these references from your project.",
        "Slurs": "Your project was rejected because it contains slurs or bypassed slurs. These words are not allowed on our platform, and you may receive punishment.",
        "Offensive / Extreme Content": {
            "Gore": "Your project was rejected because it contains realistic or extreme amounts of gore (Shows real or realistic blood, guts or death). Keep in mind that PenguinMod is available for users under 13, do not use PenguinMod as a facet to upload inappropriate content to.",
            "Drugs / Illegal material": "Your project was rejected because it contains references to drug and/or otherwise illegal material. Please do not use PenguinMod as a facet to upload illegal content, and we may involve authorities if severe enough.",
            "Pornography / Disturbing / Sexual or explicit content": "Your project was rejected because it contains sexual, explicit or disturbing content not safe for users under 18. Keep in mind that PenguinMod wants to be available for all ages and we will punish users who use PenguinMod as a facet to upload inappropriate content.",
            "Pornography: Inflation / Vore / Fetish content": "Your project was rejected because it contains explicit or disturbing content not safe for all ages. Keep in mind that PenguinMod wants to be available for all ages and we will punish users who use PenguinMod as a facet to upload inappropriate content.",
            "Discriminatory Content": "Your project was rejected because it discriminates to a certain group or groups. PenguinMod would like to stay inclusive of all groups on our platform, and we may punish your account for breaking this guideline.",
            "Threat": "Your project was removed because it threatens other users or a group of people. PenguinMod does not allow this behavior, and we may punish your account if severe enough.",
            "Malware": "Your project was removed because it either abuses blocks to act like malware, or shares malware in any way. Your account may be punished if this is severe."
        },
        "Creates Staff Distrust": "Your project was rejected since it creates distrust between users and staff. Please do not create fake ban reasons, fake moderation screenshots, or harass any users on the moderation team. This type of content will confuse people into thinking we purposely run our service poorly.",
    },
    "Attempts to sell an untrusted product": "Your project was rejected because you are attempting to sell products through it without using one of the services specified in the Uploading Guidelines. We fully respect that you are trying to profit, but we want to be sure our users are not being scammed and receive the promised product.",
    "Contains loud sounds": "Your project was rejected because it contains loud sounds above the boundary in the sound editor. You must place a loud sound warning either as a warning screen or remove the loud sounds entirely.",
    "Piracy": "Your project was rejected because it contains or enables downloading of stolen copyrighted or paid content. This is a serious offense and you may get your account banned or limited."
};

const getTopLevel = () => {
    return Object.keys(data);
};
const getLevel = (...levels) => {
    let currentLevel = data;
    for (const level of levels) {
        currentLevel = currentLevel[level];
    }
    return currentLevel;
};

export default {
    getTopLevel,
    getLevel,
    ...data
};