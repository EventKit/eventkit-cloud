

export function elementsEqual(array1, array2) {
    // To compare two arrays for equality, we check length for an early exit,
    // otherwise we sort them then compare element by element.
    if (array1.length !== array2.length) {
        return false;
    }
    // This code will only run if the arrays are the same length
    array1.sort();
    array2.sort();
    let valuesEqual = true;
    array1.forEach((item, index) => {
        if (item !== array2[index]) {
            valuesEqual = false;
            return;
        }
    });
    return valuesEqual;
}


export function hasValue(array: any[], val: any): boolean {
    return array.indexOf(val) !== -1;
}