// Adds keys to one locale if they are missing.
// "base" is the locale with all keys
// "cover" is the locale with the missing keys

const mergeTranslationJSON = () => {
    const base = {}; // replace JSON here
    const cover = {}; // replace JSON here

    for (const key in cover) {
        base[key] = cover[key];
    }

    return base;
};

// Right-click > Copy string contents in console
console.log(JSON.stringify(mergeTranslationJSON()));
