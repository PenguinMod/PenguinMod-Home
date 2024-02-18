// https://en.wikipedia.org/wiki/Magic_number_(programming)#Magic_numbers_in_files
function detectFileType(uint8Array) {
    // support ArrayBuffer
    if (uint8Array instanceof ArrayBuffer) {
        uint8Array = new Uint8Array(uint8Array);
    }
    if (uint8Array.length < 4) {
        return null; // Not enough bytes to determine the file type
    }

    const magicNumber = uint8Array.slice(0, 12);

    if (compareMagicNumber(magicNumber, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
        return 'png';
    } else if (compareMagicNumber(magicNumber, [0xFF, 0xD8, 0xFF, 0xE0]) || compareMagicNumber(magicNumber, [0xFF, 0xD8, 0xFF, 0xE1])) {
        return 'jpeg';
    } else if (compareMagicNumber(magicNumber, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || compareMagicNumber(magicNumber, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) {
        return 'gif';
    } else if (compareMagicNumber(magicNumber.slice(0, 4), [0x52, 0x49, 0x46, 0x46]) && compareMagicNumber(magicNumber.slice(8, 12), [0x57, 0x45, 0x42, 0x50])) {
        return 'webp';
    } else if (compareMagicNumber(magicNumber.slice(0, 4), [0x52, 0x49, 0x46, 0x46]) && compareMagicNumber(magicNumber.slice(8, 12), [0x41, 0x4E, 0x49, 0x4D])) {
        return 'webp'; // animated
    } else if (compareMagicNumber(magicNumber, [0x42, 0x4D])) {
        return 'bmp';
    } else if (compareMagicNumber(magicNumber.slice(0, 8), [0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]) && compareMagicNumber(magicNumber.slice(8, 12), [0x00, 0x00, 0x00, 0x0D])) {
        return 'png'; // image/apng
    } else if (compareMagicNumber(magicNumber.slice(0, 5), [0x3C, 0x3F, 0x78, 0x6D])) {
        return 'svg'; // looks for "<?xm", byte 31 can be added to look for "<?xml" but some SVG files have the "l" character magically set to byte 6C instead
    } else if (compareMagicNumber(magicNumber.slice(0, 5), [0x3C, 0x73, 0x76, 0x67, 0x20])) {
        return 'svg'; // looks for "<svg "
    } else if (compareMagicNumber(magicNumber.slice(0, 3), [0xFF, 0xFB, 0xE0]) || compareMagicNumber(magicNumber.slice(0, 3), [0x49, 0x44, 0x33])) {
        return 'mp3';
    } else if (compareMagicNumber(magicNumber.slice(0, 3), [0xFF, 0xFB, 0x90])) {
        return 'mp3'; // another mp3 format maybe? explode.mp3 seems to have byte 0xE0 changed to 0x90...
    } else if (compareMagicNumber(magicNumber.slice(0, 4), [0x52, 0x49, 0x46, 0x46]) && compareMagicNumber(magicNumber.slice(8, 12), [0x57, 0x41, 0x56, 0x45])) {
        return 'wav';
    } else if (compareMagicNumber(magicNumber, [0x4F, 0x67, 0x67, 0x53])) {
        return 'ogg';
    } else if (compareMagicNumber(magicNumber.slice(0, 4), [0x1A, 0x45, 0xDF, 0xA3])) {
        return 'webm';
    } else if (compareMagicNumber(magicNumber.slice(0, 4), [0xFF, 0xF1, 0x4C, 0xE5]) || compareMagicNumber(magicNumber.slice(0, 4), [0xFF, 0xF9, 0x4C, 0xE5])) {
        return 'aac';
    } else if (compareMagicNumber(magicNumber.slice(0, 4), [0x66, 0x4C, 0x61, 0x43])) {
        return 'flac';
    }

    return null;
}

function compareMagicNumber(magicNumber, expectedBytes) {
    for (let i = 0; i < expectedBytes.length; i++) {
        if (magicNumber[i] !== expectedBytes[i]) {
            return false;
        }
    }
    return true;
}

export default {
    compareMagicNumber,
    detectFileType
};