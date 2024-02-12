// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
import Locales from "../translations/!locales";

const languages = Locales.languages;
const rtlLanguages = Locales.rtlLanguages;

class TranslationHandler {
    static text(key, lang) {
        // return key;
        if (!languages[lang]) lang = 'en';
        const language = languages[lang];
        if (language[key]) return language[key];
        return null;
    }
    static tokened(key, lang) {
        const text = TranslationHandler.text(key, lang);
        if (!text) return null;
        let newText = text;
        let idx = 0;
        for (const name of arguments) {
            idx++;
            if (idx === 1) continue; // skip key
            if (idx === 2) continue; // skip lang
            newText = String(newText).replace(`$${idx - 1}`, name);
        }
        return `${newText}`;
    }
    static isLanguageAvailable(lang) {
        return (lang in languages);
    }
    static tryConvertingLocale(languageCode) {
        if (languageCode in Locales.autoLocale) {
            return Locales.autoLocale[languageCode];
        }
        return languageCode;
    }

    static get languages() {
        return languages;
    }
    static get rtlLanguages() {
        return rtlLanguages;
    }
}

export default TranslationHandler;
