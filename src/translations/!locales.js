// if you want to add a language, this is the spot
// after "import" put a name that has no symbols and doesnt start with a number
// then the file path should be self explanatory, just follow the ones already there
// you can find the actual language translations in the src/translations folder

import en from '../translations/en.json';
import id from '../translations/id.json';
import it from '../translations/it.json';
import he from '../translations/he.json';
import ptBr from '../translations/pt-br.json';
import es from '../translations/es.json';
import es419 from '../translations/es-419.json';
import da from '../translations/da.json';
import tr from '../translations/tr.json';
import pl from '../translations/pl.json';
import ro from '../translations/ro.json';
import sv from '../translations/sv.json';
import ru from '../translations/ru.json';
import cs from '../translations/cs.json';
import de from '../translations/de.json';
import hr from '../translations/hr.json';
import vi from '../translations/vi.json';
import frCa from '../translations/fr-ca.json';
import fr from '../translations/fr.json';
import no from '../translations/no.json';
import sk from '../translations/sk.json';
import uk from '../translations/uk.json';
import ja from '../translations/ja.json';
import fa from '../translations/fa.json';

// joke languages
import test from '../translations/test.json';
import enReversed from '../translations/en-reversed.json';

// to add a language, the first part is the language code (ex: "es-419") or top level (ex: "en-US" goes to "en")
// the second part is the import name above that had no symbols
// its easy to just duplicate the "en": en, line and then change accordingly
const languages = {
    "en": en,                      // English
    "es": es,                      // Espanol (Spain)
    "es-419": es419,               // Espanol (Latin American)
    "pt-br": ptBr,                 // Portuguese (Brasil)
    // "id": id,                   // Bahasa Indonesia: has no translator anymore, and theres too much untranslated text now
    "cs": cs,                      // Czech
    "hr": hr,                      // Croatian
    "vi": vi,                      // Viatnamese
    "ro": ro,                      // Romanian
    "ru": ru,                      // Russian
    "ja": ja,                      // Japanese
    "fr": fr,                      // French
    "fr-ca": frCa,                 // French (Canada)
    "de": de,                      // German
    "da": da,                      // Danish
    "pl": pl,                      // Polish
    "no": no,                      // Norwegian
    "it": it,                      // Italian
    "tr": tr,                      // Turkish
    "sv": sv,                      // Swedish
    "sk": sk,                      // Slovak
    "uk": uk,                      // Ukranian
    "he": he,                      // Hebrew
    "fa": fa,                      // Persian
    
    // only visible if in the jokeLanguages array
    "test": test,                  // Test
    "en-reversed": enReversed,     // English Reversed
};
// add languages that are RTL here
const rtlLanguages = [
    "he",                          // Hebrew
    "fa",                          // Persian
];
// set pairs for language codes that should be interpreted as another language code
const autoLocale = {
    "nn": "no",
    "nb": "no",
};
// only appear when ?jokelang=true
const jokeLanguages = [
    "test",                        // Test
    "en-reversed"                  // English Reversed
];

export default {
    languages,
    rtlLanguages,
    jokeLanguages,
    autoLocale,
};
