const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });
};

class NineSlices {
    static images = {
        button: {
            url: './vr/nineslices/button.png',
            corner: 24
        }
    };
    static async loadImages() {
        for (const sliceName in NineSlices.images) {
            const slice = NineSlices.images[sliceName];
            const url = slice.url;
            const image = await loadImage(url);
            slice.image = image;
        }
    };

    /**
     * @type {CanvasRenderingContext2D}
     */
    static ctx = null;

    static drawTexture(image, cornerSize, x, y, width, height) {
        // center
        this.ctx.drawImage(image, cornerSize, cornerSize, image.width - (cornerSize * 2), image.height - (cornerSize * 2), x + cornerSize, y + cornerSize, width - (cornerSize * 2), height - (cornerSize * 2));
        // corners
        // oh nah
        this.ctx.drawImage(image, 0, 0, cornerSize, cornerSize, x, y, cornerSize, cornerSize); // TL
        this.ctx.drawImage(image, image.width - cornerSize, 0, cornerSize, cornerSize, x + (width - cornerSize), y, cornerSize, cornerSize); // TR
        this.ctx.drawImage(image, 0, image.height - cornerSize, cornerSize, cornerSize, x, y + (height - cornerSize), cornerSize, cornerSize); // BL
        this.ctx.drawImage(image, image.width - cornerSize, image.height - cornerSize, cornerSize, cornerSize, x + (width - cornerSize), y + (height - cornerSize), cornerSize, cornerSize); // BR
        // edges
        // i am going insane
        this.ctx.drawImage(image, 0, cornerSize, cornerSize, image.height - (cornerSize * 2), x, y + cornerSize, cornerSize, height - (cornerSize * 2)); // L
        this.ctx.drawImage(image, image.width - cornerSize, cornerSize, cornerSize, image.height - (cornerSize * 2), x + (width - cornerSize), y + cornerSize, cornerSize, height - (cornerSize * 2)); // R
        this.ctx.drawImage(image, cornerSize, 0, image.width - (cornerSize * 2), cornerSize, x + cornerSize, y, width - (cornerSize * 2), cornerSize); // T
        this.ctx.drawImage(image, cornerSize, image.height - cornerSize, image.width - (cornerSize * 2), cornerSize, x + cornerSize, y + (height - cornerSize), width - (cornerSize * 2), cornerSize); // B
    }
}

export default NineSlices;