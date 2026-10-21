const enLang = {}; /* paste English Language here */
const testLang = {};
for (const key in enLang) {
    testLang[key] = key;
}
console.log(JSON.stringify(testLang, 4, null));