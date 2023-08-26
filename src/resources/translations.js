// if you want to add a language, this is the spot
// after "import" put a name that has no symbols and doesnt start with a number
// then the file path should be self explanatory, just follow the ones already there
// you can find the actual language translations in the src/translations folder

import en from '../translations/en.json';
import id from '../translations/id.json';
import test from '../translations/test.json';

// to add a language, the first part is the language code (ex: "es-419") or top level (ex: "en-US" goes to "en")
// the second part is the import name above that had no symbols
// its easy to just duplicate the "en": en, line and then change accordingly
const languages = {
    "en": en,
    "id": id,

    // "test": test,
};

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

    static get languages() {
        return languages;
    }
}

export default TranslationHandler;