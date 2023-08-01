const token = "❤";

function t(length) {
    const arr = [];
    for (let i = 0; i < length; i++) {
        arr.push(token);
    }
    return arr.join('');
}

function censor(text) {
    return String(text)
        .replace(/(shitting)+/gim, t(8))
        .replace(/(fucking)+/gim, t(7))
        .replace(/(bitch|pussy)+/gim, t(5))
        .replace(/(fuck|shit|dick|cock)+/gim, t(4))
        .replace(/(ass)+/gim, t(3));
}

export default censor;