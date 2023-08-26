// Note: This file is only useful if you can EDIT the Google Sheet containing all of the translations.
// IE: This is basically only useful for Jeremy.

// This script takes generated JSON from the default settings of https://csvjson.com/csv2json and converts it to be usable
// Run this code in console

const generateJSONForTranslation = () => {
    const input = []; // the JSON from the website
    const output = {};

    for (const item of input) {
        const key = item["Translation Keys"];
        const value = item["Translation"];
        output[key] = value;
    }

    return output;
};

// Right-click > Copy string contents in console
console.log(JSON.stringify(generateJSONForTranslation()));