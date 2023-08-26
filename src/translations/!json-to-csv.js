// Note: This file is only useful if you can EDIT the Google Sheet containing all of the translations.
// IE: This is basically only useful for Jeremy.

// This script generates JSON to make a new page inside that sheet from one of the translation files.

// Run this code in console
// Pass result into any online JSON to CSV converters like https://www.convertcsv.com/json-to-csv.htm

const generateCSVForTranslation = () => {
    const input = {}; // the JSON from the file
    const output = {
        "Translation Keys": [],
        "Translation": []
    };

    output.Translation = Object.values(input);
    output["Translation Keys"] = Object.keys(input);

    return output;
};

// Right-click > Copy string contents in console
console.log(JSON.stringify(generateCSVForTranslation()));