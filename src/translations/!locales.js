// if you want to add a language, this is the spot
// after "import" put a name that has no symbols and doesnt start with a number
// then the file path should be self explanatory, just follow the ones already there
// you can find the actual language translations in the src/translations folder

import en from '../translations/en.json';
import id from '../translations/id.json';
import he from '../translations/he.json';
import ptBr from '../translations/pt-br.json';
import es419 from '../translations/es-419.json';
import da from '../translations/da.json';
import tr from '../translations/tr.json';
import pl from '../translations/pl.json';
import ro from '../translations/ro.json';
import sv from '../translations/sv.json';
import ru from '../translations/ru.json';
import cs from '../translations/cs.json';
import hr from '../translations/hr.json';
import vi from '../translations/vi.json';
import uwu from '../translations/uwu.json';
import test from '../translations/test.json';

// to add a language, the first part is the language code (ex: "es-419") or top level (ex: "en-US" goes to "en")
// the second part is the import name above that had no symbols
// its easy to just duplicate the "en": en, line and then change accordingly
const languages = {
    "en": en,                      // English
    "es-419": es419,               // Espanol (Latin American)
    "pt-br": ptBr,                 // Portuguese (Brasil)
    "cs": cs,                      // Czech
    "hr": hr,                      // Croatian
    "vi": vi,                      // Viatnamese
    "ro": ro,                      // Romanian
    "ru": ru,                      // Russian
    "da": da,                      // Danish
    "pl": pl,                      // Polish
    "tr": tr,                      // Turkish
    "sv": sv,                      // Swedish
    "id": id,                      // Bahasa Indonesia
    "he": he,                      // Hebrew
    // uncomment joke languages when we have >30 regular langs to hide them
    // "uwu": uwu,
    // "test": test,
};
// add languages that are RTL here
const rtlLanguages = [
    "he",
];

export default {
    languages,
    rtlLanguages,
};