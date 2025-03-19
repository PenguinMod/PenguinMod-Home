class FontUtil {
    static getFontSize(font = '') {
        const fontProp = font;
        // tear out font names specified within quotes
        const noUnsafeFontNamesProp = fontProp.replace(/(['"]).*?\1/gm, '');
        // add spaces around everything so we can only read font size surrounded by spaces
        const readableFontProp = ` ${noUnsafeFontNamesProp.trim()} `;
        const fontSizeMatches = readableFontProp.match(/ \d+px /gm);
        if (!fontSizeMatches) {
            return 0;
        }
        const sanitized = fontSizeMatches[0]
            .replace('px', '')
            .trim();
        return Number(sanitized);
    }
}

export default FontUtil;