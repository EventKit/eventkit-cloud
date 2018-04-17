import detector from 'detect-browser';

export function isBrowserValid() {
    const browser = detector.detect();
    const { name } = browser;
    if (name === 'ie') {
        const { version } = browser;
        const majorVersion = version.split('.')[0];
        if (Number(majorVersion) < 10) {
            return false;
        }
    }
    return true;
}

export function userIsDataPackAdmin(user, permissions, groups) {
    const { username } = user;
    if (permissions.members[username] === 'ADMIN') {
        return true;
    }
    const groupPermissions = Object.keys(permissions.groups);
    return groupPermissions.some((groupName) => {
        if (permissions.groups[groupName] === 'ADMIN') {
            const adminGroup = groups.find(g => g.name === groupName);
            if (adminGroup) {
                if (adminGroup.administrators.includes(username)) {
                    return true;
                }
                return false;
            }
        }
        return false;
    });
}

export function isMgrsString(c) {
    const coord = c.replace(/\s+/g, '');
    const MGRS = /^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z])([A-HJ-NP-V])\s*(\d{1,5}\s*\d{1,5})$/i;
    return MGRS.test(coord);
}

export function isLatLon(c) {
    // Regex for lat and lon respectively
    const lat = /^(\+|-)?(?:90(?:(?:\.0{1,20})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,20})?))$/;
    const lon = /^(\+|-)?(?:180(?:(?:\.0{1,20})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,20})?))$/;

    let coordArray = [];
    const parsedCoordArray = [];

    // Initial separation of numbers
    if (c.indexOf(',') > 0) {
        coordArray = c.split(',');
    } else {
        coordArray = c.split(' ');
    }

    if (coordArray.length > 2) {
        coordArray.forEach((coord) => {
            if (!Number.isNaN(parseFloat(coord))) {
                parsedCoordArray.push(parseFloat(coord));
            }
        });
        coordArray.forEach((coord) => {
            if (!Number.isNaN(parseFloat(coord))) {
                parsedCoordArray.push(parseFloat(coord));
            }
        });
    } else if (!Number.isNaN(parseFloat(coordArray[0]) && !Number.isNaN(parseFloat(coordArray[1])))) {
        coordArray.forEach((coord) => {
            parsedCoordArray.push(parseFloat(coord));
        });
    }

    if (parsedCoordArray.length === 2 && lat.test(parsedCoordArray[0]) && lon.test(parsedCoordArray[1])) {
        return parsedCoordArray;
    }
    return false;
}
