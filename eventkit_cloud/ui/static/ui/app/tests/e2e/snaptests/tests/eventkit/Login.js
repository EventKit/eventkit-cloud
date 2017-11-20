 const TIMEOUT = 10000;
 const random = "" + parseInt(Math.random() * 1000000);
 const random1 = "" + parseInt(Math.random() * 1000000);
 const random2 = "" + parseInt(Math.random() * 1000000);
 const random3 = "" + parseInt(Math.random() * 1000000);


 module.exports = {
   "Login": function(browser) {

     require('./../../common/snaptest-nw-driver.js').bindHelpers(browser);
     require('./../../common/components.js').bindComponents(browser);

     var baseUrl = browser.launchUrl || `http://cloud.eventkit.dev`;


     browser
       .url(`${baseUrl}/login`, 1310, 946, `Load page... "${baseUrl}/login"`)
       .click(`[name=username]`, `CSS`, `Click element`)
       .changeInput(`[name=username]`, `CSS`, `admin`, `Change input to... "admin"`)
       .changeInput(`[name=password]`, `CSS`, `@dm1`, `Change input to... "@dm1"`)
       .click(`div .qa-Application-content span`, `CSS`, `Click element`)
       .pause(1000)
       .elementNotPresent(`.qa-LoginPage-Paper`, `CSS`, `El is not present`)
       .end();
   }
 };