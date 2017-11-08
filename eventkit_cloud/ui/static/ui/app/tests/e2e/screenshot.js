
const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const process = require('process');

const width = 1280;
const height = 720;


const screenshot = {
    // Adjust resolution for Windows 10 / Chrome 61.0 bezel.
    get width() {
        return width + 16;
    },

    get height() {
        return height + 93;
    },

    bindHelpers: (browser) => {
        browser.matchesScreenshot = (baselineScreenshotName, requiredPercent) => {
            // Take a screenshot to compare.
            const newScreenshotPath = screenshot._path(baselineScreenshotName, browser);
            browser.saveScreenshot(`${newScreenshotPath}.png`, () => {
                // Load base image and new screenshot.
                const imageA = PNG.sync.read(fs.readFileSync(`${process.cwd()}/screenshots/baseline/${baselineScreenshotName}.png`));
                const imageB = PNG.sync.read(fs.readFileSync(`${process.cwd()}/${newScreenshotPath}.png`));

                // Get the difference between the two.
                const diff = new PNG({width: imageA.width, height: imageA.height});
                const diffPixels = pixelmatch(imageA.data, imageB.data, diff.data, imageA.width, imageA.height, {threshold: 0.1});
                const matchPercent = 1 - (diffPixels / (imageA.width * imageA.height));

                // Save diff image.
                fs.writeFileSync(`${process.cwd()}/${newScreenshotPath}.diff.png`, PNG.sync.write(diff));

                // Report whether the images match or not.
                const matchPercentString = (matchPercent * 100).toFixed(2) + '%';
                const requiredPercentString = (requiredPercent * 100).toFixed(2) + '%';
                if (matchPercent >= requiredPercent) {
                    browser.assert.ok(true, `Screenshot match ${matchPercentString} (required >= ${requiredPercentString})`);
                } else {
                    browser.assert.ok(false, `Screenshot match ${matchPercentString} (required >= ${requiredPercentString})`);
                }
            });

            return browser;
        };
    },

    _path: (fileName, browser) => {
        const platform = browser.options.desiredCapabilities.platform.replace(' ', '');
        const browserName = browser.options.desiredCapabilities.browserName.replace(' ', '');
        const version = browser.options.desiredCapabilities.version.replace(' ', '');
        return `screenshots/${platform}/${browserName}-${version}/${fileName}`;
    }
};

module.exports = screenshot;