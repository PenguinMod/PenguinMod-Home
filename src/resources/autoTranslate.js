class AutoTranslate {
    static languageCodes = [
        'en',
        'cy',
        'zu',
        'ko',
        'az',
        'he',
        'mk',
        'am',
        'mr',
        'cs',
        'zh-cn',
        'la',
        'nn',
        'my',
        'ga',
        'es',
        'nl',
        'zh-tw',
        'pt-br',
        'kn',
        'uz',
        'ja',
        'is',
        'sk',
        'ht',
        'bg',
        'de',
        'gd',
        'et',
        'fi',
        'ar',
        'hu',
        'mt',
        'ro',
        'fa',
        'hi',
        'eo',
        'lt',
        'it',
        'el',
        'mi',
        'hr',
        'ca',
        'th',
        'hy',
        'id',
        'eu',
        'da',
        'ru',
        'sr',
        'gl',
        'lv',
        'nb',
        'tr',
        'fr',
        'sv',
        'sl',
        'ml',
        'be',
        'pl',
        'pt',
        'ku',
        'sq',
        'ms',
        'vi',
        'te',
        'uk',
        'mn',
        'es-419',
        'ja-hira'
    ];
    static getClosestLanguageCode(lc) {
        if (typeof lc !== 'string') return 'en';
        lc = lc.toLowerCase();
        if (AutoTranslate.languageCodes.includes(lc)) return lc;
        const split = lc.split('-');
        if (AutoTranslate.languageCodes.includes(split[0])) return split[0];
        return 'en';
    }
    static async translate(text, lc) {
        const languageCode = AutoTranslate.getClosestLanguageCode(lc);
        const res = await fetch(`https://trampoline.turbowarp.org/translate/translate?language=${languageCode}&text=${encodeURIComponent(text)}`);
        const json = await res.json();
        if (!res.ok) {
            throw new Error(json);
        }
        return json.result;
    }
}

export default AutoTranslate;