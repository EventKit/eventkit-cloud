import detector from 'detect-browser';
import _ from 'lodash'

export function isBrowserValid() {
    const browser = detector.detect();
    const {
        name
    } = browser;
    if (name === 'ie') {
        const {
            version
        } = browser;
        const majorVersion = version.split('.')[0];
        if (Number(majorVersion) < 10) {
            return false;
        }
    }
    return true;
}

export function isMgrsString(c) {
    c = c.replace(/\s+/g, '');
    const MGRS = /^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z])([A-HJ-NP-V])\s*(\d{1,5}\s*\d{1,5})$/i;
    return MGRS.test(c);
}

export function isLatLon(c) {
    //Regex for lat and lon respectively
    const lat = /^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$/;
    const lon = /^(\+|-)?(?:180(?:(?:\.0{1,6})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,6})?))$/;
    
    let coordArray, parsedCoordArray = [];

    //Initial separation of numbers
    c.indexOf(',') > 0 ? coordArray = c.split(',') : coordArray = c.split(' ');

    if (coordArray.length > 2) {
        _.forEach(coordArray, coord => {
            if (!_.isNaN(parseInt(coord))) {
                console.log(parseInt(coord) + " is a number");
                parsedCoordArray.push(parseInt(coord));
            }
        });
    } else {
        if (!_.isNaN(parseInt(coordArray[0]) && !_.isNaN(parseInt(coordArray[1])))) {
            _.forEach(coordArray, coord => {
                parsedCoordArray.push(parseInt(coord));
            });
        }
    }
    
    if (parsedCoordArray.length === 2 && lat.test(parsedCoordArray[0]) && lon.test(parsedCoordArray[1])) {
        return parsedCoordArray;
    } else {
        return false;
    }
}