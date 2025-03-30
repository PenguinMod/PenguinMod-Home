class Direction {
    static toRad(deg) {
        return deg * (Math.PI / 180);
    }
    static toDeg(rad) {
        return rad * (180 / Math.PI);
    }
}

export default Direction;