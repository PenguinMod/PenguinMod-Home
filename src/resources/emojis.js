const emojiHtmlUrl = 'https://gextapi.penguinmod.com/emojis';

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
                const emojis = await response.json();
                if (!response.ok) {
                    throw {
                        error: new Error('API responded NOT OK'),
                        detail: emojis
                    };
                }

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