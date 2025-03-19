class TypeConverter {
    static HTMLCollectionToArray(collection) {
        const arr = [];
        for (let i = 0; i < collection.length; i++) {
            const element = collection.item(i);
            arr.push(element);
        }
        return arr;
    }
}

export default TypeConverter;