class HTMLUtility {
    static isDescendantOf(parent, child) {
        if (!parent) return false;
        if (!child) return false;
        return parent.contains(child);
    }
    static isRightClick(pointerEvent) {
        let isRightMB = false;

        if ("which" in pointerEvent)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRightMB = pointerEvent.which == 3;
        else if ("button" in e)  // IE, Opera 
            isRightMB = pointerEvent.button == 2;

        return isRightMB;
    }
}

export default HTMLUtility;