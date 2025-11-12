/**
 * Stringifies objects
 * @param {any} obj The object to stringify
 * @param {Array<[string, any]>} processed List of keys that have been processed, for circularity checking
 * @param {string} path The JSON path for that this call is at
 * @returns {string} The stringified results
 */
export const stringify = (obj, processed, path = '') => {
    try {
        if (typeof obj !== 'object') return JSON.stringify(obj);
        // error doesnt stringify correctly, manually include key fields like being an error
        if (obj instanceof Error) return `{"t":"e","v":{"name":${JSON.stringify(obj.name)},"message":${JSON.stringify(obj.message)},"stack":${JSON.stringify(obj.stack)},"cause":${JSON.stringify(obj.cause)}}}`;
        if (obj === null) return 'null';
        processed ??= [];
        processed.push([path, obj]);
        const isArray = obj instanceof Array;
        let str = '';
        for (const name in obj) {
            str += ',';
            if (!isArray) str += `${JSON.stringify(name)}:`;
            const first = processed.find(ent => ent[1] === obj[name]);
            if (first) {
                str += `{"t":"c","v":${JSON.stringify(first[0])}}`;
                continue;
            }
            str += stringify(obj[name], processed, `${path}/${name}`);
        }
        return (isArray ? '{"t":"a","v":[' : '{"t":"o","v":{') + str.slice(1) + (isArray ? ']}' : '}}');
    } catch (err) {
        console.warn('Failed to process with error', err);
        return JSON.stringify(obj);
    }
};
/**
 * Parses the output of stringify recursively
 * @param {any} obj The object to process
 * @param {object<string,any>} processed What objects have been processed
 * @param {string} path The path to this object
 * @returns {any} The parsed result
 */
const _parseRecursive = (obj, processed, path) => {
    if (typeof obj !== 'object') return obj;
    if (obj === null) return null;
    if (obj.t === 'c') return processed[obj.v];
    // build up an error object
    if (obj.t === 'e') {
        const err = new Error('__TEMPLATE__');
        if (obj.v.cause) err.cause = obj.v.cause;
        if (obj.v.message) err.message = obj.v.message;
        // @todo different browsers use different trace shapes, and so
        // we need to use something like the log capture serialization here instead
        if (obj.v.stack) err.stack = obj.v.stack;
        if (obj.v.name) err.name = obj.v.name;
        return err;
    }
    const result = obj.t === 'a' ? [] : {};
    processed[path] = result;
    for (const name in obj.v)
        result[name] = _parseRecursive(obj.v[name], processed, `${path}/${name}`);
    return result;
};
/**
 * Parses the stringified results from stringify
 * @param {string} string The string to parse
 * @returns {any} The parsed result
 */
export const parse = string => {
    const json = JSON.parse(string);
    if (!json.v) return json;
    return _parseRecursive(json, {}, '');
};
