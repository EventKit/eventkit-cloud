
const bindHelpers = require('../../common/snaptest-nw-driver').bindHelpers;
const bindComponents = require('../../common/components').bindComponents;
const screenshot = require('../../screenshot');


module.exports = {
    "Login": function(browser) {
        bindHelpers(browser);
        bindComponents(browser);

        browser
            .url(`${browser.launchUrl}/login`, screenshot.width, screenshot.height, `Load page... "${browser.launchUrl}/login"`)
            .elementPresent(`.qa-LoginPage-Paper`, `CSS`, `Login page is present`)
            .end();
    }
};
