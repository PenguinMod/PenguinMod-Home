/**
 * @fileoverview This file specifies which translation keys for text strings are the same in all languages/english.
 * This determines the "complete-ness" of a language.
 */

import en from '../translations/en.json';

const logWhenLangMissingTranslation = false;

const sameInAll = [
    "---notes1", // translation note
    "---notes2", // translation note
    "---notes3", // translation note
    "---notes4", // translation note
    "payment.paypal.card", // brand name
    "payment.paypal", // brand name
    "payment.cashapp", // brand name
    "payment.stripe", // brand name
    "vr.title", // nearly every language is the same, since VR as an acronym seems to be more like a brand name
    "account.settings.parental.pin", // pin is an acronym, seems like most langs dont change that
    "profile.badge.owner", // a brand name and an acronym
    "licensing.license.gpl", // license name
    "licensing.license.gpl.long", // license name
    "licensing.license.gplv3", // license name
    "licensing.license.gplv3.long", // license name
    "licensing.license.mit", // license name
    "licensing.license.mite", // license name
    "licensing.license.mite.long", // license name
    "licensing.license.cco", // license name
    "licensing.license.cc.long", // license name
    "licensing.license.ccbysa", // license name
    "licensing.license.ccbysa.long", // license name
    "licensing.license.ccbyncnd", // license name
    "licensing.license.ccbyncnd.long", // license name
];
const sameInLocale = {
    "da": [
        "generic.ok",
        "generic.info",
        "avatar.name1",
        "avatar.name2",
        "avatar.title",
        "home.footer.sections.website",
        "home.footer.sections.info",
        "profile.badge.admin",
        "profile.badge.donator",
        "profile.badge.discordadmin",
        "profile.badge.partner",
        "uploading.type.upload",
        "uploading.type.remix",
        "uploading.remix.selected",
        "account.settings.cookies.title",
        "profile.badge.moderator",
    ],
    "es": [
        "generic.errortitle",
        "home.footer.sections.website.editor",
        "avatar.title",
        "generic.ok",
        "generic.no",
        "generic.legal",
        "account.settings.account.email",
        "account.fields.email",
        "region.sub.micronesia",
        "project.rating.questions.chat.no",
    ],
    "es-419": [
        "generic.errortitle",
        "home.footer.sections.website.editor",
        "avatar.title",
        "generic.ok",
        "generic.no",
        "generic.legal",
        "account.settings.account.email",
        "account.fields.email",
        "region.main.asia",
        "region.sub.melanesia",
        "region.sub.micronesia",
        "project.rating.questions.chat.no",
    ],
    "ru": [
        "region.sub.micronesia",
    ],
    "tr": [
        "home.footer.sections.website",
        "avatar.title",
        "profile.badge.partner",
        "account.settings.account.email",
        "account.fields.email",
    ],
};

let allEnglishStrings = 0;
for (const key in en) {
    if (key.startsWith("---")) continue; // ---notes1
    if (typeof en[key] !== "string") continue; // if for some reason a string is null or something
    allEnglishStrings += 1;
}

export function getLocaleFinishedPercentage(locale, json) {
    // english is literally what we speak
    if (locale === "en") return 1;

    let completedCount = 0;
    for (const key in en) {
        const text = en[key];
        const translated = json[key];

        if (typeof translated !== "string") {
            // this string doesnt exist in this lang
            continue;
        }
        if (text === translated) {
            // english version matches this translated one
            // if this key is the same in all langs or this locale is specified to have this key the same as english, this is still marked as translated
            if ((sameInAll.includes(key)) || (sameInLocale[locale] && sameInLocale[locale].includes(key))) {
                completedCount += 1;
            } else if (logWhenLangMissingTranslation) {
                console.log(locale, "missing", key);
            }
        } else {
            completedCount += 1;
        }
    }

    return completedCount / allEnglishStrings;
};