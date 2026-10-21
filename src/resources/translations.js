// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
// TRANSLATION DEFINITIONS HAVE MOVED TO src/translations/!locales.js
import Locales from "../translations/!locales";
import { getLocaleFinishedPercentage } from "../translations/!all-locale-text";

const languages = Locales.languages;
const rtlLanguages = Locales.rtlLanguages;
const jokeLanguages = Locales.jokeLanguages;

class TranslationHandler {
    static text(key, lang) {
        // return key;
        if (!languages[lang]) lang = 'en';
        const language = languages[lang];
        if (language[key]) return language[key];
        return null;
    }
    static textSafe(key, lang, defaultText) {
        const langText = TranslationHandler.text(key, lang);
        if (langText) return langText;
        const englishText = TranslationHandler.text(key, "en");
        if (englishText) return englishText;

        return defaultText;
    }
    
    static getLanguageFinishedPercentage(lang) {
        return getLocaleFinishedPercentage(lang, languages[lang]);
    }
    static isLanguageAvailable(lang) {
        return (lang in languages);
    }
    static isLanguageDone(lang) {
        return TranslationHandler.getLanguageFinishedPercentage(lang) >= 1;
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
    static get jokeLanguages() {
        return jokeLanguages;
    }
}


export default TranslationHandler;
