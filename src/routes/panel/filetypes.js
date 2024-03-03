// to support more, edit this file:
import fileTypePairs from './filetypes.json';

const mimeTypePairs = {};
for (let i = 0; i < Object.keys(fileTypePairs).length; i++) {
    const mimeType = Object.keys(fileTypePairs)[i];
    const fileType = fileTypePairs[mimeType];
    mimeTypePairs[fileType] = mimeType;
}

const module = {
    fileTypePairs,
    mimeTypePairs,
    fileTypes: Object.keys(mimeTypePairs),
    mimeTypes: Object.keys(fileTypePairs),
};

for (const fileType of module.fileTypes) {
    const key = `FILE_${fileType.toUpperCase()}`;
    module[key] = fileType;
}
for (const mimeType of module.mimeTypes) {
    const sanitized = mimeType
        .split('/')[1]
        .replace(/[^A-Za-z]/g, '_')
        .toUpperCase();
    const key = `MIME_${sanitized}`;
    module[key] = mimeType;
}

export default module;