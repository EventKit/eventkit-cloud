
const bindHelpers = require('../../common/snaptest-nw-driver').bindHelpers;
const bindComponents = require('../../common/components').bindComponents;
const screenshot = require('../../screenshot');


module.exports = {
    "Login": function(browser) {
        bindHelpers(browser);
        bindComponents(browser);
        screenshot.bindHelpers(browser);

        browser
            .url(`${browser.launchUrl}/login`, screenshot.width, screenshot.height, `Load page... "${browser.launchUrl}/login"`)
            .elementPresent(`.qa-LoginPage-Paper`, `CSS`, `Login page is present`)
            // .saveScreenshot('screenshots/login.png')
            // .matchesScreenshot('login', 0.95)
            .end();
    }
};
