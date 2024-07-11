/**
 * @fileoverview This file specifies which translation keys for text strings are the same in all languages/english.
 * This determines the "complete-ness" of a language.
 */

import en from '../translations/en.json';

const sameInAll = [
    "payment.paypal.card",
    "payment.paypal",
    "payment.cashapp",
    "payment.stripe",
];
const sameInLocale = {
    "es": [
        "generic.errortitle",
        "home.footer.sections.website.editor",
        "avatar.title",
        "generic.ok",
        "generic.no",
        "generic.legal",
    ],
    "es-419": [
        "generic.errortitle",
        "home.footer.sections.website.editor",
        "avatar.title",
        "generic.ok",
        "generic.no",
        "generic.legal",
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
            }
        } else {
            completedCount += 1;
        }
    }

    return completedCount / allEnglishStrings;
};