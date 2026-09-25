/**
 * @fileoverview Module to help determine how much of the file-system APIs can be used.
 * NOTE: This module is meant to help with a few things,
 * 1. Recognize that Chrome on Desktop should support everything
 * 2. Tell if a browser (like Firefox & Safari) is missing File System Access API
 * 3. State if the browser is known to be extremely bad at supporting the file type filters (mobile browsers + Safari on all platforms)
 *
 * NEW NOTE: this is copy pasted from gui
 */
const isMobile = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
    );

const isSafari = () =>
    !navigator.userAgentData &&
    /Safari\//.test(navigator.userAgent) &&
    !/Chrom(e|ium)\//.test(navigator.userAgent);

// NOTE: handles point 1 & 2
const isApiAvailable = () => !!window.showSaveFilePicker;

// NOTE: handles point 3
const isTypeFilterAvailable = () => !(isMobile() || isSafari());

export default { isApiAvailable, isTypeFilterAvailable };
