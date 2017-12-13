import detector from 'detect-browser';
import _ from 'lodash'

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

export function isMgrsString(c){ 
    c = c.replace(/\s+/g, '');
    const MGRS = /^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z])([A-HJ-NP-V])\s*(\d{1,5}\s*\d{1,5})$/i;
    return MGRS.test(c);
}