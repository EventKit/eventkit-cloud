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

export function getDegreeMultiplier(mgrsString){
    let mgrsChars = mgrsString.split('');
    let precisionFirstIndex = _.findLastIndex(mgrsChars, function(char, index){ return /[a-zA-Z]/.test(char) });
    let precisionIndicator = mgrsString.substring(precisionFirstIndex+1, mgrsString.length);
    // Return multiplier for degree range for BBOX based on precision, assuming roughly 111km per degree
    return Math.pow(10, -0.5*precisionIndicator.length);
}