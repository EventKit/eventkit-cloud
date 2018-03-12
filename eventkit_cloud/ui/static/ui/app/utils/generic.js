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
