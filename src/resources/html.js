class HTMLUtility {
    static isDescendantOf(parent, child) {
        if (!parent) return false;
        if (!child) return false;
        return parent.contains(child);
    }
}

export default HTMLUtility;