/**
 * Stringifies objects
 * @param {any} obj The object to stringify
 * @param {Array<[string, any]>} processed List of keys that have been processed, for circularity checking
 * @param {string} path The JSON path for that this call is at
 * @returns {string} The stringified results
 */
export const stringify = (obj, processed, path = '', isError) => {
    try {
        if (typeof obj !== 'object') return JSON.stringify(obj);
        // error doesnt stringify correctly, manually include key fields like being an error
        if (obj instanceof Error) {
            const set = {
                name: obj.name ?? null,
                message: obj.message ?? null,
                stack: obj.stack ?? null,
                cause: obj.cause ?? null,
                ...obj
            }
            return stringify(set, processed, path, true);
        }
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
        return (isArray ? '{"t":"a","v":[' : isError ? '{"t":"e","v":{' : '{"t":"o","v":{') + str.slice(1) + (isArray ? ']}' : '}}');
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
        obj.t = 'o';
        const meta = _parseRecursive(obj, processed, path)
        const err = new Error('__TEMPLATE__');
        if (meta.cause) err.cause = meta.cause;
        if (meta.message) err.message = meta.message;
        // @todo different browsers use different trace shapes, and so
        // we need to use something like the log capture serialization here instead
        if (meta.stack) err.stack = meta.stack;
        if (meta.name) err.name = meta.name;
        Object.assign(err, meta);
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

if (globalThis.window) window.JSONCircular = {
    stringify,
    parse
}