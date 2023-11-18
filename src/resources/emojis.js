const emojiHtmlUrl = 'https://corsproxy.io/?https%3A%2F%2Flibrary.penguinmod.com%2Ffiles%2Femojis';

class EmojiHandler {
    static emojis = [];
    static failed = false;
    static loaded = false;
    static loading = false;
    static error = '';
    static fetch () {
        return new Promise((resolve, reject) => {
            if (EmojiHandler.emojis.length > 0) {
                EmojiHandler.loading = false;
                EmojiHandler.failed = false;
                EmojiHandler.loaded = true;
                EmojiHandler.error = '';
                return resolve(EmojiHandler.emojis);
            }
            EmojiHandler.failed = false;
            EmojiHandler.loaded = false;
            EmojiHandler.loading = true;
            EmojiHandler.error = '';
            (async () => {
                const response = await fetch(emojiHtmlUrl);
                const htmle = await response.text();
                const emojis = htmle
                    .substring(htmle.indexOf('</header><ul id=files>') + 22, htmle.indexOf('</ul></main>'))
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0) // remove blank lines
                    .filter(line => line.endsWith('.png</a>')) // remove .txt file
                    .map(emoji => {
                        const cut = emoji.substring(22);
                        const final = cut.substring(cut.indexOf('>') + 1, cut.indexOf('.png</a>'))
                        return final;
                    });

                EmojiHandler.emojis = emojis;
                EmojiHandler.loading = false;
                EmojiHandler.failed = false;
                EmojiHandler.loaded = true;
                EmojiHandler.error = '';
                resolve(emojis);
            })().catch(err => {
                EmojiHandler.failed = true;
                EmojiHandler.loading = false;
                EmojiHandler.loaded = false;
                EmojiHandler.error = err;
                reject(err);
            });
        });
    }
}

export default EmojiHandler;