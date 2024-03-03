import TranslationHandler from "./translations";

let lastAlertLang = '';
class Language {
    static _eventListeners = [];
    static onChange(cb) {
        Language._eventListeners.push({ callback: cb, type: "CHANGE" });
    }
    static fireChange(lang) {
        Language._eventListeners.forEach(thinkle => {
            if (thinkle.type === "CHANGE") {
                thinkle.callback(lang);
            }
        })
    }
    /**
     * Should be called in onMount.
     * Can be called more than once.
     */
    static forceUpdate() {
        let lang = localStorage.getItem('pm:language');
        // if no lang, default to browser lang
        if (!lang) {
            lang = navigator.language;
            lang = TranslationHandler.tryConvertingLocale(lang);
        }
        // if no browser lang, check top level lang
        if (!TranslationHandler.isLanguageAvailable(lang)) {
            lang = navigator.language.split('-')[0];
            lang = TranslationHandler.tryConvertingLocale(lang);
            // if no top level lang go to en
            if (!TranslationHandler.isLanguageAvailable(lang)) {
                lang = 'en';
            }
        }
        // scam alert messages
        if (lang !== lastAlertLang) {
            const warnings = [
                TranslationHandler.text("console.warning1", lang),
                TranslationHandler.text("console.warning2", lang),
                TranslationHandler.text("console.warning3", lang),
            ];
            console.log(
                `%c${warnings[0]} %c${warnings[1]}`,
                "color:red;font-family:system-ui;font-size:2rem;-webkit-text-stroke: 1px black;font-weight:bold",
                "color:black;font-family:system-ui;font-size:1.75rem;font-weight:bold"
            );
            console.log(warnings[2]);
            lastAlertLang = lang;
        }
        // change page direction if needed
        document.documentElement.dir = "ltr";
        if (TranslationHandler.rtlLanguages.includes(lang)) {
            document.documentElement.dir = "rtl";
        }
        // fire change event
        Language.fireChange(lang);
    }
}

export default Language;